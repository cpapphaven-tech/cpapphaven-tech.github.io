#!/usr/bin/env python3
"""
PlayMix Gameplay Fingerprint System
====================================
Defines a structured 11-field gameplay fingerprint for every game.
Computes weighted semantic similarity between two fingerprints.
Generates human-readable GAMEPLAY UNIQUENESS CHECK reports.

Reject threshold: >= 0.72  (configurable via SIMILARITY_THRESHOLD)
"""

import re
from dataclasses import dataclass, field, asdict
from typing import List

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
SIMILARITY_THRESHOLD = 0.72   # Reject if score >= this

# Field weights (must sum to 1.0)
FIELD_WEIGHTS = {
    'primary_mechanic':    0.25,
    'gameplay_loop':       0.20,
    'interaction_pattern': 0.20,
    'secondary_mechanics': 0.12,
    'progression_system':  0.10,
    'scoring_system':      0.06,
    'win_condition':       0.04,
    'loss_condition':      0.04,
    'level_structure':     0.04,
    # archetype contributes a soft 0.05 bonus when identical (applied separately)
}

# Common stop words to strip when tokenising text fields
_STOP = frozenset({
    'a','an','the','and','or','to','of','in','on','by','with','for',
    'as','at','is','be','it','its','this','that','are','was','were',
    'has','have','had','do','does','did','will','would','can','could',
    'player','game','score','points','play','plays',
})

# ---------------------------------------------------------------------------
# Dataclass
# ---------------------------------------------------------------------------
@dataclass
class GameplayFingerprint:
    primary_mechanic:    str        = ''
    secondary_mechanics: List[str]  = field(default_factory=list)
    gameplay_loop:       str        = ''
    interaction_pattern: str        = ''
    progression_system:  str        = ''
    scoring_system:      str        = ''
    win_condition:       str        = ''
    loss_condition:      str        = ''
    level_structure:     str        = ''
    archetype:           str        = ''
    controls:            List[str]  = field(default_factory=list)
    confidence:          str        = 'high'   # 'high', 'medium', 'low'

    def to_dict(self):
        return asdict(self)

    @classmethod
    def from_dict(cls, d):
        if d is None:
            return cls()
        return cls(
            primary_mechanic    = d.get('primary_mechanic', ''),
            secondary_mechanics = d.get('secondary_mechanics', []),
            gameplay_loop       = d.get('gameplay_loop', ''),
            interaction_pattern = d.get('interaction_pattern', ''),
            progression_system  = d.get('progression_system', ''),
            scoring_system      = d.get('scoring_system', ''),
            win_condition       = d.get('win_condition', ''),
            loss_condition      = d.get('loss_condition', ''),
            level_structure     = d.get('level_structure', ''),
            archetype           = d.get('archetype', ''),
            controls            = d.get('controls', []),
            confidence          = d.get('confidence', 'high'),
        )

    def signature(self):
        sec = ' | '.join(self.secondary_mechanics[:3]) if self.secondary_mechanics else 'none'
        return f"{self.primary_mechanic} | {self.interaction_pattern} | {self.level_structure} | [{sec}]"

# ---------------------------------------------------------------------------
# Similarity helpers
# ---------------------------------------------------------------------------

def _tokens(text: str):
    """Lower-case word-set, stop-words removed."""
    if not text:
        return set()
    words = re.findall(r'[a-z]+', text.lower())
    return set(w for w in words if w not in _STOP and len(w) > 1)

def _text_sim(a: str, b: str) -> float:
    """Jaccard similarity on word-token sets. Empty fields contribute 0.0."""
    if not a or not b:
        return 0.0
    ta, tb = _tokens(a), _tokens(b)
    if not ta or not tb:
        return 0.0
    inter = len(ta & tb)
    union = len(ta | tb)
    return inter / union if union else 0.0

def _str_sim(a: str, b: str) -> float:
    """Exact/partial string similarity for short mechanic/pattern labels. Empty fields contribute 0.0."""
    if not a or not b:
        return 0.0
    a_clean = a.lower().strip()
    b_clean = b.lower().strip()
    if a_clean == b_clean:
        return 1.0
    # Substring containment
    if a_clean in b_clean or b_clean in a_clean:
        return 0.80
    # Shared first hyphen-token (e.g. lane-switching vs lane-dodge → "lane")
    a_tok = a_clean.split('-')[0]
    b_tok = b_clean.split('-')[0]
    if a_tok == b_tok and len(a_tok) > 2:
        return 0.55
    # Fallback to token Jaccard
    return _text_sim(a, b)

def _list_sim(la: list, lb: list) -> float:
    """Jaccard over two lists treated as sets. Empty lists contribute 0.0."""
    if not la or not lb:
        return 0.0
    sa = set(x.lower().strip() for x in la if x.strip())
    sb = set(x.lower().strip() for x in lb if x.strip())
    if not sa or not sb:
        return 0.0
    inter = len(sa & sb)
    union = len(sa | sb)
    return inter / union if union else 0.0

# ---------------------------------------------------------------------------
# Main similarity function
# ---------------------------------------------------------------------------

def compute_similarity(fp_a: GameplayFingerprint, fp_b: GameplayFingerprint) -> dict:
    """
    Returns a dict with:
      overall  – weighted similarity score (0.0 – 1.0)
      fields   – per-field similarity scores
      archetype_bonus – whether same archetype added soft bonus
    """
    scores = {}
    scores['primary_mechanic']    = _str_sim(fp_a.primary_mechanic,    fp_b.primary_mechanic)
    scores['gameplay_loop']       = _text_sim(fp_a.gameplay_loop,       fp_b.gameplay_loop)
    scores['interaction_pattern'] = _str_sim(fp_a.interaction_pattern,  fp_b.interaction_pattern)
    scores['secondary_mechanics'] = _list_sim(fp_a.secondary_mechanics, fp_b.secondary_mechanics)
    scores['progression_system']  = _text_sim(fp_a.progression_system,  fp_b.progression_system)
    scores['scoring_system']      = _text_sim(fp_a.scoring_system,      fp_b.scoring_system)
    scores['win_condition']       = _text_sim(fp_a.win_condition,       fp_b.win_condition)
    scores['loss_condition']      = _text_sim(fp_a.loss_condition,      fp_b.loss_condition)
    scores['level_structure']     = _str_sim(fp_a.level_structure,      fp_b.level_structure)

    weighted = sum(FIELD_WEIGHTS[f] * scores[f] for f in FIELD_WEIGHTS)

    # Uncertainty protection: If either game has unknown archetype or low confidence,
    # do NOT apply archetype bonuses or combo bonuses.
    is_uncertain = (
        fp_a.archetype in ('unknown', 'low_confidence', '') or
        fp_b.archetype in ('unknown', 'low_confidence', '') or
        fp_a.confidence == 'low' or fp_b.confidence == 'low'
    )

    # Soft archetype bonus when same confident archetype
    archetype_bonus = 0.0
    if not is_uncertain and (fp_a.archetype and fp_b.archetype and
            fp_a.archetype.lower() == fp_b.archetype.lower()):
        archetype_bonus = 0.05

    # Combination bonus: when primary_mechanic + interaction_pattern + level_structure
    # are ALL >= 0.80, a gameplay clone is near-certain. Add up to 0.08 bonus.
    core_scores = [scores['primary_mechanic'], scores['interaction_pattern'], scores['level_structure']]
    if not is_uncertain and all(s >= 0.80 for s in core_scores):
        combo_bonus = round(min(0.08, sum(s - 0.80 for s in core_scores) * 0.13), 4)
    else:
        combo_bonus = 0.0

    # If uncertain classification and primary mechanics do not match,
    # cap similarity below threshold (<= 0.50) so uncertain games are never falsely declared duplicates.
    raw_overall = weighted + archetype_bonus + combo_bonus
    if is_uncertain and scores['primary_mechanic'] < 0.75:
        overall = min(0.50, raw_overall)
    else:
        overall = min(1.0, raw_overall)

    return {
        'overall': round(overall, 4),
        'fields': scores,
        'archetype_bonus': archetype_bonus > 0,
        'combo_bonus': combo_bonus,
        'is_uncertain': is_uncertain
    }

# ---------------------------------------------------------------------------
# Report generator
# ---------------------------------------------------------------------------

def _similar_fields(field_scores: dict, threshold: float = 0.55) -> list:
    """Return list of (field_name, score) pairs that are notably similar."""
    return [
        (f, s) for f, s in sorted(field_scores.items(), key=lambda x: -x[1])
        if s >= threshold
    ]

def generate_explanation(fp_a: GameplayFingerprint, fp_b: GameplayFingerprint,
                         field_scores: dict, decision: str) -> str:
    """
    Generates a factual explanation derived entirely from the two fingerprints.
    Never uses hard-coded example text.
    """
    lines = []
    high_sim = _similar_fields(field_scores, threshold=0.55)

    if decision == 'FAIL':
        causes = []
        for fname, fscore in high_sim:
            if fname == 'primary_mechanic' and fscore >= 0.75:
                causes.append(
                    f"Both share primary mechanic '{fp_a.primary_mechanic}'"
                    f"{'' if fp_a.primary_mechanic == fp_b.primary_mechanic else f' ~ {fp_b.primary_mechanic}'}"
                    f" (similarity {fscore:.2f})."
                )
            elif fname == 'interaction_pattern' and fscore >= 0.60:
                causes.append(
                    f"Interaction patterns match: '{fp_a.interaction_pattern}'"
                    f"{'' if fp_a.interaction_pattern == fp_b.interaction_pattern else f' ~ {fp_b.interaction_pattern}'}"
                    f" (similarity {fscore:.2f})."
                )
            elif fname == 'gameplay_loop' and fscore >= 0.55:
                causes.append(
                    f"Gameplay loops are substantially similar (similarity {fscore:.2f}): "
                    f"'{fp_a.gameplay_loop[:80]}...' vs '{fp_b.gameplay_loop[:80]}...'"
                )
            elif fname == 'level_structure' and fscore >= 0.80:
                causes.append(
                    f"Same level structure: '{fp_a.level_structure}'."
                )
            elif fname == 'progression_system' and fscore >= 0.60:
                causes.append(
                    f"Progression systems match: '{fp_a.progression_system}' ~ '{fp_b.progression_system}' (similarity {fscore:.2f})."
                )
        if causes:
            lines.append("This game is a gameplay clone because: " + " ".join(causes))
        else:
            lines.append(
                f"Overall fingerprint similarity {field_scores.get('overall', 0):.2f} exceeds "
                f"threshold across multiple fields. Game feels identical in play despite different name."
            )
        sec_overlap = set(fp_a.secondary_mechanics) & set(fp_b.secondary_mechanics)
        if sec_overlap:
            lines.append(f"Shared secondary mechanics: {', '.join(sorted(sec_overlap))}.")
    else:
        different = [(f, s) for f, s in field_scores.items() if s < 0.35]
        if different:
            diff_names = [f.replace('_', ' ') for f, _ in different[:3]]
            lines.append(
                f"Games differ meaningfully in: {', '.join(diff_names)}. "
                f"Primary mechanic: '{fp_a.primary_mechanic}' vs '{fp_b.primary_mechanic}'. "
                f"Interaction: '{fp_a.interaction_pattern}' vs '{fp_b.interaction_pattern}'."
            )
        else:
            lines.append(
                f"Fingerprints are distinct. Primary: '{fp_a.primary_mechanic}' vs '{fp_b.primary_mechanic}'."
            )

    return " ".join(lines)


def print_uniqueness_report(candidate_name: str, fp_candidate: GameplayFingerprint,
                             closest_name: str, fp_closest: GameplayFingerprint,
                             sim_result: dict) -> None:
    """Prints the mandatory GAMEPLAY UNIQUENESS CHECK block."""
    score = sim_result['overall']
    field_scores = sim_result['fields']
    decision = 'FAIL' if score >= SIMILARITY_THRESHOLD else 'PASS'
    explanation = generate_explanation(fp_candidate, fp_closest, field_scores, decision)

    print("\n" + "=" * 62)
    print("GAMEPLAY UNIQUENESS CHECK")
    print("=" * 62)
    print(f"  Archetype:          {fp_candidate.archetype or 'unset'}")
    print(f"  Gameplay signature: {fp_candidate.signature()}")
    print(f"  Closest existing:   {closest_name}")
    print(f"  Similarity:         {score:.4f}")
    print(f"  Decision:           {decision}")
    print(f"  Explanation:        {explanation}")
    print("=" * 62 + "\n")


if __name__ == '__main__':
    # Quick self-test
    a = GameplayFingerprint(
        primary_mechanic='lane-switching',
        secondary_mechanics=['jumping', 'coin-collecting'],
        gameplay_loop='dodge obstacles in 3 lanes as speed increases endlessly',
        interaction_pattern='reactive-dodge',
        progression_system='distance-based speed increase',
        scoring_system='distance plus collectibles',
        win_condition='none endless survival',
        loss_condition='collide with obstacle',
        level_structure='endless',
        archetype='endless_runner',
    )
    b = GameplayFingerprint(
        primary_mechanic='lane-switching',
        secondary_mechanics=['jumping', 'rolling'],
        gameplay_loop='run through lanes avoiding obstacles with increasing pace',
        interaction_pattern='reactive-dodge',
        progression_system='speed ramps over distance',
        scoring_system='distance score',
        win_condition='none survival game',
        loss_condition='hit obstacle or barrier',
        level_structure='endless',
        archetype='endless_runner',
    )
    result = compute_similarity(a, b)
    print(f"Subway vs Jungle Runner similarity: {result['overall']:.4f}")
    print_uniqueness_report('Jungle Runner', b, 'Subway Runner', a, result)
