import os
import shutil
import re

games = [
    {
        "slug": "GemMatch",
        "name": "Gem Match",
        "item_name": "gem",
        "item_name_plural": "gems",
        "types_json": """[
        { type: "diamond", emoji: "💎" },
        { type: "crystal", emoji: "🔮" },
        { type: "ruby", emoji: "🔴" },
        { type: "sapphire", emoji: "🔵" },
        { type: "emerald", emoji: "🟩" },
        { type: "amethyst", emoji: "🟪" }
    ]"""
    },
    {
        "slug": "CandyBlast",
        "name": "Candy Blast",
        "item_name": "candy",
        "item_name_plural": "candies",
        "types_json": """[
        { type: "candy", emoji: "🍬" },
        { type: "lollipop", emoji: "🍭" },
        { type: "chocolate", emoji: "🍫" },
        { type: "donut", emoji: "🍩" },
        { type: "icecream", emoji: "🍧" },
        { type: "cookie", emoji: "🍪" }
    ]"""
    },
    {
        "slug": "PetPop",
        "name": "Pet Pop",
        "item_name": "pet",
        "item_name_plural": "pets",
        "types_json": """[
        { type: "dog", emoji: "🐶" },
        { type: "cat", emoji: "🐱" },
        { type: "fox", emoji: "🦊" },
        { type: "panda", emoji: "🐼" },
        { type: "bunny", emoji: "🐰" },
        { type: "koala", emoji: "🐨" }
    ]"""
    },
    {
        "slug": "VeggieSmash",
        "name": "Veggie Smash",
        "item_name": "veggie",
        "item_name_plural": "veggies",
        "types_json": """[
        { type: "carrot", emoji: "🥕" },
        { type: "corn", emoji: "🌽" },
        { type: "broccoli", emoji: "🥦" },
        { type: "tomato", emoji: "🍅" },
        { type: "eggplant", emoji: "🍆" },
        { type: "potato", emoji: "🥔" }
    ]"""
    }
]

base_dir = "/Users/gauravpurohit/Documents/GP/Playmix"
source_dir = os.path.join(base_dir, "FruitSplash")

def process_file(src, dst, game):
    with open(src, "r") as f:
        content = f.read()

    # Replacements
    content = content.replace("FruitSplash", game["slug"])
    content = content.replace("Fruit Splash", game["name"])
    content = content.replace("fruit_splash", game["name"].lower().replace(" ", "_"))
    
    # Capitalized plural
    content = content.replace("Fruits", game["item_name_plural"].capitalize())
    # Capitalized singular
    content = content.replace("Fruit", game["item_name"].capitalize())
    # Lowercase plural
    content = content.replace("fruits", game["item_name_plural"])
    # Lowercase singular
    content = content.replace("fruit", game["item_name"])

    # If it's the JS file, replace the array
    if src.endswith("game.js"):
        target_array = f'const {game["item_name"]}Types = ['
        content = re.sub(rf'const {game["item_name"]}Types = \[.*?\];', f'const {game["item_name"]}Types = {game["types_json"]};', content, flags=re.DOTALL)
        content = content.replace("randomFruit", "randomItem")
        # FruitSplash had fruitTypes, our simple replace above makes it itemTypes
    
    # If it's the CSS file, just leave as is since Fruit isn't there, or it was replaced.

    with open(dst, "w") as f:
        f.write(content)

for game in games:
    game_dir = os.path.join(base_dir, game["slug"])
    if not os.path.exists(game_dir):
        os.makedirs(game_dir)
        
    for filename in ["game.js", "index.html", "style.css"]:
        src = os.path.join(source_dir, filename)
        dst = os.path.join(game_dir, filename)
        process_file(src, dst, game)
        
    print(f"Generated {game['slug']}")
