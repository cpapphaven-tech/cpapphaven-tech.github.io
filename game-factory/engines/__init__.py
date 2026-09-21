"""
PlayMix Game Engine Registry & Archetype Dispatcher
Provides modular engines, concept keyword resolution, and diversity selection.
"""

import re
from pathlib import Path

# Import all engine archetypes
from . import maze_engine
from . import stack_engine
from . import reaction_game_engine
from . import breakout_engine
from . import match3_engine
from . import endless_runner_engine
from . import physics_drop_engine
from . import color_switch_engine
from . import gravity_runner_engine

ENGINES = {
    'maze': maze_engine,
    'stack': stack_engine,
    'reaction': reaction_game_engine,
    'breakout': breakout_engine,
    'match3': match3_engine,
    'endless_runner': endless_runner_engine,
    'physics_drop': physics_drop_engine,
    'color_switch': color_switch_engine,
    'gravity_runner': gravity_runner_engine,
}

# Semantic keyword rules to classify custom game names
KEYWORD_MAPPINGS = [
    (r'\b(maze|labyrinth|path|corridor|dungeon|escape)\b', 'maze'),
    (r'\b(gravity|flip|invert|antigrav|float)\b', 'gravity_runner'),
    (r'\b(stack|tower|build|skyscraper|pile|slice)\b', 'stack'),
    (r'\b(reflex|reaction|quick|speed|twitch|prompt)\b', 'reaction'),
    (r'\b(breakout|brick|paddle|bounce|smash|ball)\b', 'breakout'),
    (r'\b(match|swap|candy|gem|jewel|cascade|crush)\b', 'match3'),
    (r'\b(run|runner|dash|sprint|lane|subway|highway)\b', 'endless_runner'),
    (r'\b(drop|merge|suika|watermelon|planet|circle)\b', 'physics_drop'),
    (r'\b(switch|gate|color ring|ring)\b', 'color_switch'),
]

def get_engine(archetype):
    """Retrieve engine module by archetype name."""
    return ENGINES.get(archetype)

def list_available_archetypes():
    """Return all registered archetype identifiers."""
    return list(ENGINES.keys())

def classify_concept(name, description=""):
    """
    Intelligently determines the appropriate gameplay archetype from title or description.
    Does NOT default to color_switch!
    """
    combined = (name + " " + description).lower()
    for pattern, archetype in KEYWORD_MAPPINGS:
        if re.search(pattern, combined):
            return archetype
    
    # If unclassified, return None to allow the caller to pick an underrepresented archetype
    return None

def select_underrepresented_archetype(existing_counts):
    """
    Chooses the least common archetype across the repository to maximize gameplay variety.
    """
    candidates = [arch for arch in ENGINES.keys() if arch != 'color_switch']
    candidates.sort(key=lambda a: existing_counts.get(a, 0))
    return candidates[0] if candidates else 'maze'


# ---------------------------------------------------------------------------
# Canonical gameplay fingerprints per archetype
# Used by inventory.py to backfill and by factory.py for new candidates.
# These represent the DEFAULT gameplay contract for each engine.
# ---------------------------------------------------------------------------
DEFAULT_FINGERPRINTS = {
    'maze': {
        'primary_mechanic':    'maze-navigation',
        'secondary_mechanics': ['fog-of-war', 'crystal-collection', 'timer-countdown', 'exit-portal'],
        'gameplay_loop':       'navigate procedural labyrinth collecting crystals and reach exit portal before timer expires',
        'interaction_pattern': 'directional-navigation',
        'progression_system':  'maze dimensions grow and battery time shrinks each level',
        'scoring_system':      'crystals collected multiplied by remaining time bonus',
        'win_condition':       'player reaches exit portal before timer reaches zero',
        'loss_condition':      'countdown timer reaches zero before portal reached',
        'level_structure':     'level-based',
        'controls':            ['swipe', 'dpad', 'keyboard'],
    },
    'stack': {
        'primary_mechanic':    'precision-timing-slice',
        'secondary_mechanics': ['combo-chain', 'overhang-trim', 'width-accumulation'],
        'gameplay_loop':       'tap to slice a moving block onto the growing tower with minimum overhang',
        'interaction_pattern': 'single-tap-timing',
        'progression_system':  'block swing speed increases with each successful slice',
        'scoring_system':      'height reached multiplied by combo multiplier',
        'win_condition':       'none highest score survival',
        'loss_condition':      'platform width reaches zero from accumulated overhang',
        'level_structure':     'endless',
        'controls':            ['tap', 'click'],
    },
    'reaction': {
        'primary_mechanic':    'visual-reflex-tap',
        'secondary_mechanics': ['streak-multiplier', 'millisecond-tracking', 'distractor-avoidance'],
        'gameplay_loop':       'tap the correct flashing target within milliseconds of it appearing',
        'interaction_pattern': 'reactive-tap',
        'progression_system':  'targets appear faster and distractors increase over time',
        'scoring_system':      'streak multiplier applied to base score per correct tap',
        'win_condition':       'none highest streak and score survival',
        'loss_condition':      'tap wrong target or miss within time window',
        'level_structure':     'endless',
        'controls':            ['tap', 'click'],
    },
    'breakout': {
        'primary_mechanic':    'ball-paddle-reflection',
        'secondary_mechanics': ['brick-destruction', 'power-up-catch', 'ball-angle-control'],
        'gameplay_loop':       'reflect ball with paddle to destroy all bricks then advance to next level',
        'interaction_pattern': 'horizontal-paddle-control',
        'progression_system':  'more bricks, harder patterns, and faster ball each level',
        'scoring_system':      'points per brick destroyed with combo for multi-brick hits',
        'win_condition':       'all bricks in layout destroyed',
        'loss_condition':      'ball passes paddle and all lives depleted',
        'level_structure':     'level-based',
        'controls':            ['swipe', 'mouse', 'keyboard'],
    },
    'match3': {
        'primary_mechanic':    'gem-swap-match',
        'secondary_mechanics': ['cascade-gravity', 'chain-reaction', 'special-gem-explosion'],
        'gameplay_loop':       'swap adjacent gems to create lines of 3 or more matching colors triggering cascade chains',
        'interaction_pattern': 'drag-swap-selection',
        'progression_system':  'target score increases and board complexity grows each level',
        'scoring_system':      'base points per match multiplied by cascade depth',
        'win_condition':       'reach target score within move or time limit',
        'loss_condition':      'moves or time exhausted before target score reached',
        'level_structure':     'level-based',
        'controls':            ['swipe', 'tap', 'mouse'],
    },
    'endless_runner': {
        'primary_mechanic':    'lane-switching',
        'secondary_mechanics': ['jumping', 'rolling', 'coin-collecting', 'power-up-activation'],
        'gameplay_loop':       'switch lanes and jump over obstacles as running speed increases endlessly',
        'interaction_pattern': 'reactive-dodge',
        'progression_system':  'speed increases with distance travelled',
        'scoring_system':      'distance plus collectibles multiplied by speed multiplier',
        'win_condition':       'none endless survival high score',
        'loss_condition':      'collide with obstacle or barrier',
        'level_structure':     'endless',
        'controls':            ['swipe', 'keyboard'],
    },
    'physics_drop': {
        'primary_mechanic':    'aim-and-drop',
        'secondary_mechanics': ['physics-collision', 'merge-chain', 'tier-progression'],
        'gameplay_loop':       'drop fruits into container aiming to merge matching tiers into higher-value fruits',
        'interaction_pattern': 'aim-release',
        'progression_system':  'higher tier merges become harder to achieve as container fills',
        'scoring_system':      'cumulative value of all merged fruit tiers',
        'win_condition':       'none highest score before overflow',
        'loss_condition':      'fruit stack overflows the container boundary',
        'level_structure':     'endless',
        'controls':            ['swipe', 'mouse'],
    },
    'color_switch': {
        'primary_mechanic':    'color-matching-passage',
        'secondary_mechanics': ['rhythm-timing', 'star-collection', 'color-orb-switch'],
        'gameplay_loop':       'tap to bounce ball through rotating obstacles only where color segments match ball color',
        'interaction_pattern': 'tap-gravity-timing',
        'progression_system':  'obstacles rotate faster and patterns more complex at higher scores',
        'scoring_system':      'obstacles passed plus stars collected',
        'win_condition':       'none highest score survival',
        'loss_condition':      'ball touches mismatched color segment',
        'level_structure':     'endless',
        'controls':            ['tap', 'click', 'keyboard'],
    },
    '2048_merge': {
        'primary_mechanic':    'directional-tile-slide',
        'secondary_mechanics': ['number-merge', 'board-fill-management'],
        'gameplay_loop':       'slide all tiles in one direction to merge identical numbers toward the 2048 target',
        'interaction_pattern': 'swipe-direction-select',
        'progression_system':  'board fills up making moves harder as tile values increase',
        'scoring_system':      'cumulative value of all merged tiles',
        'win_condition':       'create a 2048 tile',
        'loss_condition':      'board completely filled with no valid merge moves remaining',
        'level_structure':     'single-board',
        'controls':            ['swipe', 'keyboard'],
    },
    'gravity_runner': {
        'primary_mechanic':    'gravity-flip-navigation',
        'secondary_mechanics': ['obstacle-dodge', 'collectible-pickup', 'speed-ramp'],
        'gameplay_loop':       'tap to flip gravity between floor and ceiling while dodging obstacles and collecting power-ups in an auto-scrolling corridor',
        'interaction_pattern': 'tap-gravity-flip',
        'progression_system':  'scroll speed and obstacle density increase with distance',
        'scoring_system':      'distance survived plus collectibles multiplied by score multiplier',
        'win_condition':       'none endless high score survival',
        'loss_condition':      'player collides with obstacle or boundary',
        'level_structure':     'endless',
        'controls':            ['tap', 'click', 'keyboard'],
    },
    'bubble_shooter': {
        'primary_mechanic':    'aim-shoot-cluster-clear',
        'secondary_mechanics': ['color-matching', 'ricochet-shot', 'cluster-pop'],
        'gameplay_loop':       'aim and fire colored bubbles to match and pop hanging clusters before they descend',
        'interaction_pattern': 'aim-and-fire',
        'progression_system':  'clusters descend faster and patterns more complex each level',
        'scoring_system':      'bubbles popped per shot multiplied by cluster size bonus',
        'win_condition':       'all bubbles cleared from the board',
        'loss_condition':      'bubbles descend below the danger line',
        'level_structure':     'level-based',
        'controls':            ['swipe', 'mouse', 'tap'],
    },
    'card_game': {
        'primary_mechanic':    'card-matching-play',
        'secondary_mechanics': ['hand-management', 'turn-based-play', 'suit-color-matching'],
        'gameplay_loop':       'play matching suit or color cards onto the discard pile to empty hand first',
        'interaction_pattern': 'card-select-play',
        'progression_system':  'opponent AI improves and special cards appear more frequently',
        'scoring_system':      'points from remaining cards in opponent hand at round end',
        'win_condition':       'empty hand before opponents',
        'loss_condition':      'opponent empties hand before player',
        'level_structure':     'round-based',
        'controls':            ['tap', 'mouse'],
    },
    'board_strategy': {
        'primary_mechanic':    'turn-based-piece-movement',
        'secondary_mechanics': ['capture-mechanics', 'positional-strategy', 'opponent-ai'],
        'gameplay_loop':       'take tactical turns moving pieces to capture opponent pieces or achieve board objective',
        'interaction_pattern': 'select-and-place',
        'progression_system':  'opponent AI difficulty increases across matches',
        'scoring_system':      'pieces captured or board position dominance',
        'win_condition':       'capture key piece or control board objective',
        'loss_condition':      'key piece captured or position surrendered',
        'level_structure':     'match-based',
        'controls':            ['tap', 'mouse'],
    },
    'word_puzzle': {
        'primary_mechanic':    'letter-selection',
        'secondary_mechanics': ['vocabulary-knowledge', 'elimination', 'clue-deduction'],
        'gameplay_loop':       'select or arrange letters to form valid words within attempt limit',
        'interaction_pattern': 'select-and-confirm',
        'progression_system':  'words become longer and less common at higher levels',
        'scoring_system':      'fewer attempts used yields higher score',
        'win_condition':       'guess or complete the target word within allowed attempts',
        'loss_condition':      'attempts exhausted without finding target word',
        'level_structure':     'puzzle-per-word',
        'controls':            ['tap', 'keyboard', 'mouse'],
    },
    'tube_sort': {
        'primary_mechanic':    'color-pour-sorting',
        'secondary_mechanics': ['stack-order-management', 'empty-tube-strategy'],
        'gameplay_loop':       'pour colored liquid between tubes until each tube contains only one color',
        'interaction_pattern': 'tap-source-tap-target',
        'progression_system':  'more tubes and more colors each level',
        'scoring_system':      'moves used below par score',
        'win_condition':       'all tubes contain single uniform color',
        'loss_condition':      'no valid moves remaining before completion',
        'level_structure':     'level-based',
        'controls':            ['tap', 'mouse'],
    },
    'sports_sim': {
        'primary_mechanic':    'physics-sports-control',
        'secondary_mechanics': ['timing-shot', 'opponent-ai', 'stamina-management'],
        'gameplay_loop':       'control sports actions with timing and physics to outscore opponent',
        'interaction_pattern': 'timing-and-aim',
        'progression_system':  'opponent skill and game speed increase with match level',
        'scoring_system':      'goals or points scored against opponent',
        'win_condition':       'outscore opponent by end of match',
        'loss_condition':      'opponent outscores player',
        'level_structure':     'match-based',
        'controls':            ['swipe', 'tap', 'mouse'],
    },
    'idle_clicker': {
        'primary_mechanic':    'click-to-produce',
        'secondary_mechanics': ['upgrade-purchase', 'passive-income', 'prestige-reset'],
        'gameplay_loop':       'click to generate resources then spend on upgrades for passive production',
        'interaction_pattern': 'click-and-upgrade',
        'progression_system':  'upgrade cost and production rate scale exponentially',
        'scoring_system':      'total resources produced per second and lifetime total',
        'win_condition':       'none idle progression',
        'loss_condition':      'none idle game',
        'level_structure':     'endless-progression',
        'controls':            ['click', 'tap'],
    },
    'whack_target': {
        'primary_mechanic':    'tap-popup-target',
        'secondary_mechanics': ['timer-pressure', 'penalty-avoidance', 'combo-speed'],
        'gameplay_loop':       'tap rising targets before they disappear while avoiding penalty objects',
        'interaction_pattern': 'rapid-tap',
        'progression_system':  'targets appear faster and penalty items multiply at higher scores',
        'scoring_system':      'targets hit with combo multiplier for rapid successive hits',
        'win_condition':       'none high score survival',
        'loss_condition':      'timer expires or too many misses',
        'level_structure':     'endless',
        'controls':            ['tap', 'mouse'],
    },
    'arcade_casual': {
        'primary_mechanic':    'casual-interaction',
        'secondary_mechanics': ['score-accumulation'],
        'gameplay_loop':       'interact via casual mechanics to achieve the highest score',
        'interaction_pattern': 'casual-tap-or-click',
        'progression_system':  'difficulty increases with score',
        'scoring_system':      'raw score accumulation',
        'win_condition':       'none high score',
        'loss_condition':      'game-specific failure condition',
        'level_structure':     'endless',
        'controls':            ['tap', 'mouse'],
    },
}
