import re

file_path = "/Users/gauravpurohit/Documents/GP/Playmix/index.html"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Map of old h3 title -> new SEO-boosted h3 title
title_replacements = [
    (r'<h3>🏹 Archery Master</h3>', '<h3>🏹 Archery Bow Shooting Game – Free Slingshot</h3>'),
    (r'<h3>😊 Smiley Doodle Jump</h3>', '<h3>😊 Doodle Jump Game – Hop Endless Platforms Free</h3>'),
    (r'<h3>🏎️ Car Racer 3D</h3>', '<h3>🏎️ Car Racer 3D – Free Neon Speed Racing Game</h3>'),
    (r'<h3>👾 Neon Pac-Man: Endless Maze</h3>', '<h3>👾 Neon Pac-Man – Classic Ghost Maze Arcade Game</h3>'),
    (r'<h3>🔤 Word Crossword</h3>', '<h3>🔤 Word Crossword Puzzle – Free Brain Vocabulary Game</h3>'),
    (r'<h3>🎱  Pool Master</h3>', '<h3>🎱 8 Ball Pool Online – Free Billiards Game</h3>'),
    (r'<h3>💎 Balloon Ninja</h3>', '<h3>💎 Balloon Ninja Slice – Fruit Cutting Arcade Game</h3>'),
    (r'<h3>🐔 Crossy Road</h3>', '<h3>🐔 Crossy Road Hop – Dodge Traffic Arcade Game</h3>'),
    (r'<h3>🔢 Merge Numbers 2248</h3>', '<h3>🔢 Merge Numbers 2048 – Math Puzzle Brain Game</h3>'),
    (r'<h3>🍉 Fruit Splash</h3>', '<h3>🍉 Fruit Splash Match 3 – Pop Fruit Puzzle Game</h3>'),
    (r'<h3>🐍 Neon Snake</h3>', '<h3>🐍 Classic Neon Snake – Play Snake Game Online Free</h3>'),
    (r'<h3>👾 Alien Highway</h3>', '<h3>👾 Galaxy Space Shooter – Alien Defense Arcade Game</h3>'),
    (r'<h3>🎈 Number Balloon Shooter</h3>', '<h3>🎈 Math Balloon Pop – Number Shooting Puzzle Game</h3>'),
    (r'<h3>🏐 Volleyball Arena</h3>', '<h3>🏐 Volleyball Arena 3D – Spike & Block Sports Game</h3>'),
    (r'<h3>🎾 Arcade Tennis</h3>', '<h3>🎾 Tennis Master 3D – Online Sports Tournament Game</h3>'),
    (r'<h3>🏑 Air Hockey 3D</h3>', '<h3>🏑 Air Hockey 3D Neon – Puck Sports Arcade Game</h3>'),
    (r'<h3>🧪 Water Sort 3D</h3>', '<h3>🧪 Water Sort Puzzle – Relaxing Color Flask Game</h3>'),
    (r'<h3>Stack 3D</h3>', '<h3>🧱 Stack 3D – Build Tower Physics Puzzle Game</h3>'),
    (r'<h3>🎳 3D Bowling Clash</h3>', '<h3>🎳 Bowling Strike 3D – Realistic Pin Sports Game</h3>'),
    (r'<h3>Helix Bounce</h3>', '<h3>🧬 Helix Bounce – Drop Ball Rotating Platform Game</h3>'),
    (r'<h3>⚔️ Stickman Neon Warriors</h3>', '<h3>⚔️ Stickman Warriors Duel – Ragdoll Fighting Game</h3>'),
]

for old, new in title_replacements:
    content = re.sub(old, new, content)

# Also update card description for Pool to match SEO tone
content = content.replace(
    '<p><strong>Classic 8-Ball!</strong> Challenge the AI or a friend. Smooth physics, fully mouse and mobile touch friendly. Sink the 8-ball to win!</p>',
    '<p><strong>Realistic 8-Ball Pool!</strong> Challenge the AI or a friend in this smooth physics billiards game. Pocket all your balls and sink the 8-ball to win!</p>'
)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("✅ index.html card titles updated for SEO.")
