#!/usr/bin/env python3
"""
PlayMix Duplicate & Gameplay Diversity Detector
Enforces title uniqueness, slug safety, AND gameplay engine diversity.
Rejects clones that share the same gameplay loop or mechanics engine.
"""

import sys
import json
import re
import argparse
from pathlib import Path
from difflib import SequenceMatcher

def normalize_text(text):
    text = text.lower()
    text = re.sub(r'[^a-z0-9\s]', '', text)
    return ' '.join(text.split())

def string_similarity(a, b):
    return SequenceMatcher(None, normalize_text(a), normalize_text(b)).ratio()

def token_jaccard(a, b):
    set_a = set(normalize_text(a).split())
    set_b = set(normalize_text(b).split())
    if not set_a or not set_b:
        return 0.0
    return len(set_a & set_b) / len(set_a | set_b)

class DuplicateDetector:
    def __init__(self, registry_path=None):
        if registry_path is None:
            repo_root = Path(__file__).resolve().parent.parent.parent
            registry_path = repo_root / 'game-factory' / 'game-registry.json'
        
        self.registry_path = Path(registry_path)
        self.registry = self._load_registry()

    def _load_registry(self):
        if not self.registry_path.exists():
            return {}
        try:
            with open(self.registry_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return data.get('games', {})
        except Exception as e:
            print(f"Warning: Could not read registry: {e}", file=sys.stderr)
            return {}

    def check(self, candidate_name, candidate_folder=None, candidate_category='action',
              candidate_archetype='maze', candidate_mechanics=None, candidate_loop=None):
        """
        Evaluates proposed game for both metadata duplicates AND gameplay engine clones.
        """
        if candidate_mechanics is None:
            candidate_mechanics = []

        norm_name = normalize_text(candidate_name)
        candidate_slug = re.sub(r'[^a-z0-9]+', '-', candidate_name.lower()).strip('-')
        candidate_folder_slug = re.sub(r'[^a-z0-9]+', '-', (candidate_folder or candidate_name).lower()).strip('-')

        reasons = []
        highest_sim = 0.0
        closest_game = None

        candidate_mech_set = set(m.lower().strip() for m in candidate_mechanics)

        for folder, g in self.registry.items():
            # Skip checking against self if re-validating an existing game
            if candidate_folder and folder == candidate_folder:
                continue

            existing_name = g.get('name', '')
            existing_slug = g.get('slug', '')
            existing_folder = g.get('folder', folder)
            existing_archetype = g.get('archetype', '')
            existing_mechanics = set(m.lower().strip() for m in g.get('mechanics', []))
            existing_loop = g.get('gameplay_loop', '')

            # 1. Exact Name match
            if norm_name == normalize_text(existing_name):
                reasons.append(f"Exact title match with existing game: '{existing_name}' ({folder})")
                return {
                    'allowed': False,
                    'status': f"FAIL: Exact title match with '{existing_name}'",
                    'uniqueness_score': 0.0,
                    'rejection_reasons': reasons,
                    'closest_game': existing_name,
                    'highest_similarity': 1.0
                }

            # 2. Slug / Folder collision
            if candidate_slug == existing_slug or candidate_folder_slug == existing_folder.lower():
                reasons.append(f"Folder or slug collision with existing directory '{existing_folder}'")
                return {
                    'allowed': False,
                    'status': f"FAIL: Slug/folder collision with '{existing_folder}'",
                    'uniqueness_score': 0.0,
                    'rejection_reasons': reasons,
                    'closest_game': existing_name,
                    'highest_similarity': 1.0
                }

            # 3. Fuzzy Name & Token Similarity
            sim = string_similarity(candidate_name, existing_name)
            jaccard = token_jaccard(candidate_name, existing_name)
            combined_name_sim = max(sim, jaccard)

            if combined_name_sim > highest_sim:
                highest_sim = combined_name_sim
                closest_game = existing_name

            if combined_name_sim >= 0.72:
                reasons.append(f"Title too similar to '{existing_name}' (similarity: {combined_name_sim:.2f})")

            # 4. GAMEPLAY DIVERSITY CHECK (Crucial rule)
            # If same archetype AND mechanic overlap >= 75% AND (title similarity >= 0.40 or thematic clone)
            if existing_archetype and candidate_archetype == existing_archetype:
                mech_overlap = len(candidate_mech_set & existing_mechanics) / max(len(candidate_mech_set | existing_mechanics), 1)
                
                # E.g. Color Switch vs Color Jump / Color Bounce Switch
                if candidate_archetype == 'color_switch':
                    reasons.append(f"Gameplay engine too similar to '{existing_name}' (Color Switch archetype already exists in PlayMix)")
                elif mech_overlap >= 0.70 and combined_name_sim >= 0.35:
                    reasons.append(f"Gameplay engine too similar to existing game '{existing_name}' (shared archetype '{candidate_archetype}', mechanic overlap: {mech_overlap:.2f})")

        uniqueness_score = round(max(0.0, 1.0 - highest_sim), 3)
        allowed = (len(reasons) == 0) and (uniqueness_score >= 0.35)

        status_msg = "PASS: Different gameplay engine." if allowed else f"FAIL: {reasons[0] if reasons else 'Too similar to existing games'}"

        return {
            'allowed': allowed,
            'status': status_msg,
            'uniqueness_score': uniqueness_score,
            'rejection_reasons': reasons,
            'closest_game': closest_game,
            'highest_similarity': round(highest_sim, 3)
        }

def main():
    parser = argparse.ArgumentParser(description="Check game uniqueness and gameplay diversity.")
    parser.add_argument('--name', required=True, help="Proposed game title")
    parser.add_argument('--folder', help="Target folder name")
    parser.add_argument('--category', default='action', help="Game category")
    parser.add_argument('--archetype', default='maze', help="Game engine archetype")
    parser.add_argument('--mechanics', default='', help="Comma-separated mechanics")

    args = parser.parse_args()
    mechanics = [m.strip() for m in args.mechanics.split(',') if m.strip()]

    detector = DuplicateDetector()
    result = detector.check(
        candidate_name=args.name,
        candidate_folder=args.folder,
        candidate_category=args.category,
        candidate_archetype=args.archetype,
        candidate_mechanics=mechanics
    )

    print(json.dumps(result, indent=2))
    print(result['status'])
    if not result['allowed']:
        sys.exit(1)

if __name__ == '__main__':
    main()
