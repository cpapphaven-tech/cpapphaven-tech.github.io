#!/usr/bin/env python3
"""
PlayMix Duplicate & Gameplay Diversity Detector (v3.0)
========================================================
Uses a structured GameplayFingerprint similarity score as the primary
uniqueness signal. Title similarity and slug collision are also verified.

Reject threshold: fingerprint similarity >= 0.72
A different engine does NOT automatically mean a unique game.
A shared engine does NOT automatically mean a duplicate.
The gameplay fingerprint is the authoritative uniqueness signal.
"""

import sys
import json
import re
import argparse
from pathlib import Path
from difflib import SequenceMatcher

CURRENT_DIR = Path(__file__).resolve().parent
REPO_ROOT = CURRENT_DIR.parent.parent
sys.path.insert(0, str(CURRENT_DIR.parent))  # game-factory/ -> engines importable
sys.path.insert(0, str(CURRENT_DIR))          # scripts/ -> fingerprint importable

from fingerprint import (
    GameplayFingerprint, compute_similarity, print_uniqueness_report,
    SIMILARITY_THRESHOLD, generate_explanation
)
from engines import DEFAULT_FINGERPRINTS

def normalize_text(text):
    text = (text or '').lower()
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
            registry_path = REPO_ROOT / 'game-factory' / 'game-registry.json'
        
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

    def get_fingerprint_for_game(self, game_dict):
        """Extract or reconstruct a GameplayFingerprint from game record."""
        fp_data = game_dict.get('fingerprint')
        if fp_data and isinstance(fp_data, dict):
            return GameplayFingerprint.from_dict(fp_data)
        
        # Fallback to reconstructing from archetype & metadata
        archetype = game_dict.get('archetype', 'arcade_casual')
        base = dict(DEFAULT_FINGERPRINTS.get(archetype, DEFAULT_FINGERPRINTS.get('arcade_casual', {})))
        base['archetype'] = archetype
        base['controls'] = game_dict.get('controls', base.get('controls', ['touch', 'mouse']))
        if 'gameplay_loop' in game_dict:
            base['gameplay_loop'] = game_dict['gameplay_loop']
        if 'mechanics' in game_dict and game_dict['mechanics']:
            base['secondary_mechanics'] = game_dict['mechanics']
        return GameplayFingerprint.from_dict(base)

    def check(self, candidate_name, candidate_folder=None, candidate_fingerprint=None,
              candidate_archetype=None, candidate_category='action', candidate_mechanics=None,
              verbose=True):
        """
        Evaluates candidate game against registry using gameplay fingerprint comparison.
        Returns evaluation dict with full uniqueness metrics and decision.
        """
        norm_name = normalize_text(candidate_name)
        candidate_slug = re.sub(r'[^a-z0-9]+', '-', candidate_name.lower()).strip('-')
        candidate_folder_slug = re.sub(r'[^a-z0-9]+', '-', (candidate_folder or candidate_name).lower()).strip('-')

        # Construct candidate fingerprint if passed as dict or None
        if isinstance(candidate_fingerprint, dict):
            cand_fp = GameplayFingerprint.from_dict(candidate_fingerprint)
        elif isinstance(candidate_fingerprint, GameplayFingerprint):
            cand_fp = candidate_fingerprint
        else:
            arch = candidate_archetype or 'arcade_casual'
            base = dict(DEFAULT_FINGERPRINTS.get(arch, DEFAULT_FINGERPRINTS.get('arcade_casual', {})))
            base['archetype'] = arch
            if candidate_mechanics:
                base['secondary_mechanics'] = candidate_mechanics
            cand_fp = GameplayFingerprint.from_dict(base)

        reasons = []
        highest_fp_sim = 0.0
        closest_game_name = "None"
        closest_fp = None
        closest_sim_result = None

        highest_title_sim = 0.0

        for folder, g in self.registry.items():
            # Skip checking against self if re-evaluating existing folder
            if candidate_folder and folder.lower() == candidate_folder.lower():
                continue

            existing_name = g.get('name', folder)
            existing_slug = g.get('slug', '')
            existing_folder = g.get('folder', folder)

            # 1. Exact Name Collision Check
            if norm_name == normalize_text(existing_name):
                reasons.append(f"Exact title match with existing game: '{existing_name}' ({folder})")

            # 2. Slug / Folder Collision Check
            if candidate_slug == existing_slug or candidate_folder_slug == existing_folder.lower():
                reasons.append(f"Folder or slug collision with existing directory '{existing_folder}'")

            # Title similarity tracking
            t_sim = max(string_similarity(candidate_name, existing_name), token_jaccard(candidate_name, existing_name))
            if t_sim > highest_title_sim:
                highest_title_sim = t_sim

            # 3. GAMEPLAY FINGERPRINT COMPARISON (Authoritative Signal)
            existing_fp = self.get_fingerprint_for_game(g)
            sim_res = compute_similarity(cand_fp, existing_fp)
            sim_score = sim_res['overall']

            if sim_score > highest_fp_sim:
                highest_fp_sim = sim_score
                closest_game_name = existing_name
                closest_fp = existing_fp
                closest_sim_result = sim_res

        # Fallback if registry was empty
        if not closest_fp:
            closest_fp = cand_fp
            closest_sim_result = {'overall': 0.0, 'fields': {}}

        decision = "FAIL" if (highest_fp_sim >= SIMILARITY_THRESHOLD or len(reasons) > 0) else "PASS"

        if highest_fp_sim >= SIMILARITY_THRESHOLD:
            reasons.append(f"Gameplay fingerprint similarity ({highest_fp_sim:.4f}) with '{closest_game_name}' exceeds threshold ({SIMILARITY_THRESHOLD}).")

        explanation = generate_explanation(cand_fp, closest_fp, closest_sim_result.get('fields', {}), decision)
        if reasons and decision == 'FAIL' and not explanation.startswith("This game is a gameplay clone"):
            explanation = f"{reasons[0]} {explanation}"

        report_data = {
            'candidate_name': candidate_name,
            'archetype': cand_fp.archetype,
            'gameplay_signature': cand_fp.signature(),
            'closest_game': closest_game_name,
            'similarity': highest_fp_sim,
            'decision': decision,
            'explanation': explanation,
            'rejection_reasons': reasons,
            'uniqueness_score': round(1.0 - highest_fp_sim, 4),
            'allowed': (decision == "PASS")
        }

        if verbose:
            print("\n" + "=" * 62)
            print("GAMEPLAY UNIQUENESS CHECK")
            print("=" * 62)
            print(f"  Archetype:          {report_data['archetype']}")
            print(f"  Gameplay signature: {report_data['gameplay_signature']}")
            print(f"  Closest existing:   {report_data['closest_game']}")
            print(f"  Similarity:         {report_data['similarity']:.4f}")
            print(f"  Decision:           {report_data['decision']}")
            print(f"  Explanation:        {report_data['explanation']}")
            print("=" * 62 + "\n")

        return report_data

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
        candidate_archetype=args.archetype,
        candidate_category=args.category,
        candidate_mechanics=mechanics,
        verbose=True
    )

    if not result['allowed']:
        sys.exit(1)

if __name__ == '__main__':
    main()
