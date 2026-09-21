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

ENGINES = {
    'maze': maze_engine,
    'stack': stack_engine,
    'reaction': reaction_game_engine,
    'breakout': breakout_engine,
    'match3': match3_engine,
    'endless_runner': endless_runner_engine,
    'physics_drop': physics_drop_engine,
    'color_switch': color_switch_engine,
}

# Semantic keyword rules to classify custom game names
KEYWORD_MAPPINGS = [
    (r'\b(maze|labyrinth|path|corridor|dungeon|escape)\b', 'maze'),
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
