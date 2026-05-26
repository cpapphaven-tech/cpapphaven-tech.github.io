import os
import shutil
import re

games = [
    {
        "slug": "MarbleBlast",
        "name": "Marble Blast",
        "title": "Marble Blast - Classic Glass Marbles!",
        "desc": "Match and blast glossy marbles in this shiny puzzle game.",
        "emoji": "🔮",
        "geo": "new THREE.SphereGeometry(BUBBLE_RADIUS, 32, 32)",
        "metalness": "0.8",
        "roughness": "0.1",
        "bg_color": "0x0a1a2a"
    },
    {
        "slug": "GemShooter",
        "name": "Gem Shooter",
        "title": "Gem Shooter - Sparkling Jewel Puzzle!",
        "desc": "Aim and shoot sparkling gems to clear the board.",
        "emoji": "💎",
        "geo": "new THREE.OctahedronGeometry(BUBBLE_RADIUS)",
        "metalness": "0.9",
        "roughness": "0.2",
        "bg_color": "0x1a0f2e"
    },
    {
        "slug": "CandyBubblePop",
        "name": "Candy Bubble Pop",
        "title": "Candy Bubble Pop - Sweet Puzzle Adventure!",
        "desc": "Pop colorful candies in this sweet and relaxing game.",
        "emoji": "🍬",
        "geo": "new THREE.SphereGeometry(BUBBLE_RADIUS, 32, 32)",
        "metalness": "0.1",
        "roughness": "0.8",
        "bg_color": "0x2e1a22"
    },
    {
        "slug": "PlanetShooter",
        "name": "Planet Shooter",
        "title": "Planet Shooter - Galactic Space Puzzle!",
        "desc": "Match planets and explore the galaxy.",
        "emoji": "🪐",
        "geo": "new THREE.SphereGeometry(BUBBLE_RADIUS, 16, 16)",
        "metalness": "0.3",
        "roughness": "0.6",
        "bg_color": "0x050510"
    },
    {
        "slug": "VirusShooter",
        "name": "Virus Shooter",
        "title": "Virus Shooter - Microscopic Hexa Puzzle!",
        "desc": "Eradicate the geometric virus cells by matching colors.",
        "emoji": "🦠",
        "geo": "new THREE.DodecahedronGeometry(BUBBLE_RADIUS)",
        "metalness": "0.5",
        "roughness": "0.4",
        "bg_color": "0x0a2a1a"
    }
]

base_dir = "/Users/gauravpurohit/Documents/GP/Playmix"
source_dir = os.path.join(base_dir, "BubbleShooter")

def replace_tokens(text, game):
    # Base names
    text = text.replace("Bubble Shooter", game["name"])
    text = text.replace("bubbleshooter", game["slug"].lower())
    text = text.replace("Bubble", game["name"].split(" ")[0])
    text = text.replace("bubble", game["name"].split(" ")[0].lower())
    
    # Emoji
    text = re.sub(r'🔴|🔵|🟢|🟡|🟣|🔵', game["emoji"], text)

    # Geometry replacement
    text = text.replace("new THREE.SphereGeometry(BUBBLE_RADIUS, 32, 32)", game["geo"])
    
    # Material replacement
    text = re.sub(r'metalness:\s*[\d.]+', f'metalness: {game["metalness"]}', text)
    text = re.sub(r'roughness:\s*[\d.]+', f'roughness: {game["roughness"]}', text)
    
    # Background color replacement (scene.background = new THREE.Color(0x0a1a2a);)
    text = text.replace("0x0a1a2a", game["bg_color"])
    
    # Title tag in HTML
    text = re.sub(r"<title>.*?</title>", f"<title>{game['title']}</title>", text)
    
    # Description in HTML
    text = re.sub(r'content="Bubble Shooter 3D.*?">', f'content="{game["desc"]}">', text)
    
    return text

def process_file(src, dst, game):
    with open(src, "r", encoding="utf-8") as f:
        content = f.read()

    content = replace_tokens(content, game)

    with open(dst, "w", encoding="utf-8") as f:
        f.write(content)

for game in games:
    game_dir = os.path.join(base_dir, game["slug"])
    if not os.path.exists(game_dir):
        os.makedirs(game_dir)
        
    for filename in ["game.js", "index.html", "style.css", "game.html"]:
        src = os.path.join(source_dir, filename)
        if os.path.exists(src):
            dst = os.path.join(game_dir, filename)
            process_file(src, dst, game)
            
    print(f"Generated {game['slug']}")
