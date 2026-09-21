#!/usr/bin/env python3
"""
PlayMix Fingerprint Similarity Audit & Backfill Report
Identifies all existing game pairs in game-registry.json with fingerprint similarity >= 0.72.
Report-only: Does NOT modify, delete, or reject any existing games.
"""

import sys
import json
from pathlib import Path

CURRENT_DIR = Path(__file__).resolve().parent
REPO_ROOT = CURRENT_DIR.parent.parent
sys.path.insert(0, str(CURRENT_DIR.parent))
sys.path.insert(0, str(CURRENT_DIR))

from fingerprint import GameplayFingerprint, compute_similarity, generate_explanation, SIMILARITY_THRESHOLD

def generate_audit_report():
    registry_path = REPO_ROOT / 'game-factory' / 'game-registry.json'
    with open(registry_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    games = data.get('games', {})
    folders = sorted(games.keys())

    print("=" * 80)
    print(f"📊 PLAYMIX GAMEPLAY FINGERPRINT AUDIT REPORT")
    print(f"Total catalogued games: {len(folders)}")
    print(f"Similarity Threshold: >= {SIMILARITY_THRESHOLD}")
    print("=" * 80)

    pairs = []
    seen = set()

    for i in range(len(folders)):
        f_a = folders[i]
        g_a = games[f_a]
        fp_dict_a = g_a.get('fingerprint')
        if not fp_dict_a:
            continue
        fp_a = GameplayFingerprint.from_dict(fp_dict_a)

        for j in range(i + 1, len(folders)):
            f_b = folders[j]
            g_b = games[f_b]
            fp_dict_b = g_b.get('fingerprint')
            if not fp_dict_b:
                continue
            fp_b = GameplayFingerprint.from_dict(fp_dict_b)

            sim_result = compute_similarity(fp_a, fp_b)
            score = sim_result['overall']

            if score >= SIMILARITY_THRESHOLD:
                pairs.append({
                    'game_a': g_a.get('name', f_a),
                    'folder_a': f_a,
                    'game_b': g_b.get('name', f_b),
                    'folder_b': f_b,
                    'archetype_a': fp_a.archetype,
                    'archetype_b': fp_b.archetype,
                    'similarity': score,
                    'primary_a': fp_a.primary_mechanic,
                    'primary_b': fp_b.primary_mechanic,
                    'pattern_a': fp_a.interaction_pattern,
                    'pattern_b': fp_b.interaction_pattern,
                    'loop_a': fp_a.gameplay_loop,
                    'loop_b': fp_b.gameplay_loop,
                    'reason': generate_explanation(fp_a, fp_b, sim_result['fields'], 'FAIL')
                })

    pairs.sort(key=lambda x: -x['similarity'])

    print(f"\nFound {len(pairs)} pairs with similarity >= {SIMILARITY_THRESHOLD}:\n")

    for idx, p in enumerate(pairs, 1):
        print(f"Pair #{idx}:")
        print(f"  * Game A:             {p['game_a']} ({p['folder_a']})")
        print(f"  * Game B:             {p['game_b']} ({p['folder_b']})")
        print(f"  * Archetype A:        {p['archetype_a']}")
        print(f"  * Archetype B:        {p['archetype_b']}")
        print(f"  * Similarity score:   {p['similarity']:.4f}")
        print(f"  * Primary mechanics:  '{p['primary_a']}' vs '{p['primary_b']}'")
        print(f"  * Interaction pattern:'{p['pattern_a']}' vs '{p['pattern_b']}'")
        print(f"  * Gameplay loop A:    '{p['loop_a']}'")
        print(f"  * Gameplay loop B:    '{p['loop_b']}'")
        print(f"  * Reason for similarity:\n    {p['reason']}\n")

    print("=" * 80)
    print(f"Audit Complete. Notice: No games were modified or removed.")
    print("=" * 80)
    return pairs

if __name__ == '__main__':
    generate_audit_report()
