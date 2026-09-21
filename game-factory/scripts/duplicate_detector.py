#!/usr/bin/env python3
"""
PlayMix Duplicate Game Detector
Evaluates proposed games against the PlayMix game registry.
Rejects exact duplicates, slug collisions, similar titles, and clone mechanics.
"""

import sys
import json
import re
import argparse
from pathlib import Path
from difflib import SequenceMatcher

def normalize_text(text):
    """Normalize string for fuzzy comparison."""
    text = text.lower()
    text = re.sub(r'[^a-z0-9\s]', '', text)
    return ' '.join(text.split())

def string_similarity(a, b):
    """SequenceMatcher similarity ratio between two strings (0.0 to 1.0)."""
    return SequenceMatcher(None, normalize_text(a), normalize_text(b)).ratio()

def token_jaccard(a, b):
    """Jaccard similarity of word sets."""
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

    def check(self, candidate_name, candidate_folder=None, candidate_category='arcade', candidate_mechanics=None):
        """
        Check if candidate game is unique.
        Returns:
            dict: {
                'allowed': bool,
                'uniqueness_score': float, # 0.0 (exact duplicate) to 1.0 (completely unique)
                'rejection_reasons': list,
                'closest_game': str,
                'highest_similarity': float
            }
        """
        if candidate_mechanics is None:
            candidate_mechanics = []

        norm_name = normalize_text(candidate_name)
        candidate_slug = re.sub(r'[^a-z0-9]+', '-', candidate_name.lower()).strip('-')
        if candidate_folder:
            candidate_folder_slug = re.sub(r'[^a-z0-9]+', '-', candidate_folder.lower()).strip('-')
        else:
            candidate_folder_slug = candidate_slug

        reasons = []
        highest_sim = 0.0
        closest_game = None

        candidate_mech_set = set(m.lower().strip() for m in candidate_mechanics)

        for folder, g in self.registry.items():
            existing_name = g.get('name', '')
            existing_slug = g.get('slug', '')
            existing_folder = g.get('folder', folder)
            existing_mechanics = set(m.lower().strip() for m in g.get('mechanics', []))
            existing_category = g.get('category', '')

            # 1. Exact Name match
            if norm_name == normalize_text(existing_name):
                reasons.append(f"Exact title match with existing game: '{existing_name}' ({folder})")
                return {
                    'allowed': False,
                    'uniqueness_score': 0.0,
                    'rejection_reasons': reasons,
                    'closest_game': existing_name,
                    'highest_similarity': 1.0
                }

            # 2. Slug / Folder collision
            if candidate_slug == existing_slug or candidate_folder_slug == existing_folder.lower():
                reasons.append(f"Slug or folder collision with existing folder: '{existing_folder}'")
                return {
                    'allowed': False,
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

            # Near-clone title check (> 0.70 similarity)
            if combined_name_sim >= 0.70:
                reasons.append(f"Title too similar to '{existing_name}' (similarity: {combined_name_sim:.2f})")

            # 4. Mechanic + Category near-clone check
            if existing_mechanics and candidate_mech_set:
                mech_overlap = len(candidate_mech_set & existing_mechanics) / max(len(candidate_mech_set | existing_mechanics), 1)
                # If same category, high mechanic overlap, and high name overlap -> Reject
                if candidate_category == existing_category and mech_overlap >= 0.75 and combined_name_sim >= 0.50:
                    reasons.append(f"Gameplay mechanics and theme too similar to '{existing_name}' (mechanic overlap: {mech_overlap:.2f})")

        # Compute Uniqueness Score
        # 1.0 = completely distinct, 0.0 = exact duplicate
        uniqueness_score = round(max(0.0, 1.0 - highest_sim), 3)

        # Threshold: must be at least 0.70 unique and have no blocking reasons
        allowed = (len(reasons) == 0) and (uniqueness_score >= 0.35)

        return {
            'allowed': allowed,
            'uniqueness_score': uniqueness_score,
            'rejection_reasons': reasons,
            'closest_game': closest_game,
            'highest_similarity': round(highest_sim, 3)
        }

def main():
    parser = argparse.ArgumentParser(description="Check if game concept is unique in PlayMix.")
    parser.add_argument('--name', required=True, help="Proposed game title")
    parser.add_argument('--folder', help="Target folder name")
    parser.add_argument('--category', default='arcade', help="Game category")
    parser.add_argument('--mechanics', default='', help="Comma-separated mechanics")

    args = parser.parse_args()
    mechanics = [m.strip() for m in args.mechanics.split(',') if m.strip()]

    detector = DuplicateDetector()
    result = detector.check(
        candidate_name=args.name,
        candidate_folder=args.folder,
        candidate_category=args.category,
        candidate_mechanics=mechanics
    )

    print(json.dumps(result, indent=2))
    if not result['allowed']:
        sys.exit(1)

if __name__ == '__main__':
    main()
