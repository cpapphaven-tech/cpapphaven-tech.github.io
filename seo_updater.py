import os
import re

games_seo = {
    "Pool": {
        "title": "Play 8 Ball Pool Online Free | Realistic 3D Billiards Game",
        "description": "Play the best realistic 8 Ball Pool multiplayer online for free! Improve your billiards skills, practice trick shots, and become the pool master without downloading."
    },
    "Stack3D": {
        "title": "Stack 3D Puzzle Game | Play Free Tower Builder Online",
        "description": "Test your reflexes in Stack 3D! Build the highest block tower by perfectly dropping shapes. Fun free physics puzzle game for mobile and desktop."
    },
    "NeonSnake": {
        "title": "Neon Snake Classic Arcade | Play Modern Snake Online Free",
        "description": "Play the classic Snake retro game with a modern neon twist! Eat the glowing dots, grow your tail, and survive the endless maze for a high score."
    },
    "GalaxyAssault": {
        "title": "Galaxy Assault Space Shooter | Free Alien Arcade Game",
        "description": "Defend the galaxy in this fast-paced space shooter! Blast incoming aliens and meteors in this thrilling free arcade sci-fi online game."
    },
    "FruitSplash": {
        "title": "Fruit Splash Match 3 Puzzle | Pop Fruits Online Free",
        "description": "Connect and match colorful fruits in this juicy puzzle game! Unlock levels, use power-ups, and get a high score in Fruit Splash free online."
    },
    "MergeNumbers": {
        "title": "Merge Numbers 2048 Puzzle | Addictive Math Brain Game",
        "description": "Sharpen your brain with Merge Numbers! Combine tiles to reach huge sums in this addictive math logic puzzle game inspired by 2048."
    },
    "BlockPuzzle": {
        "title": "Block Puzzle Dash Classic | Play Wood Block Puzzle Free",
        "description": "Drop blocks to fill the grid and clear lines! Block Puzzle Dash is a relaxing and challenging brain training logic puzzle for all ages."
    },
    "Football3D": {
        "title": "Football 3D Penalty Kick | Play Soccer Free Online",
        "description": "Flick to shoot and score incredible goals! Experience realistic 3D soccer physics and penalty kicks in this free online football sports game."
    },
    "VolleyballArena": {
        "title": "Volleyball Arena 3D | Fast Paced Sports Game Online",
        "description": "Spike, block, and dive in Volleyball Arena 3D! Compete in fast-paced beach volleyball matches online for free. Mobile friendly sports game."
    },
    "HelixBounce": {
        "title": "Helix Bounce 3D | Play Addictive Drop Ball Game Free",
        "description": "Smash your way down through the rotating platforms in Helix Bounce! A highly addictive casual jumping 3D ball drop game requiring quick reflexes."
    },
    "NumberBalloonShooter": {
        "title": "Math Balloon Pop Shooter | Number Adding Puzzle Game",
        "description": "Improve your math skills by popping numbered balloons! A fun educational arcade shooter to test your quick calculation reflexes."
    },
    "BrickBreaker": {
        "title": "Classic Brick Breaker Retro | Arkanoid Arcade Game Free",
        "description": "Smash all the neon bricks with your paddle and ball! Play this classic retro breakout arcade game directly in your browser without downloads."
    },
    "Tennis": {
        "title": "Tennis Master 3D Sport | Play Open Tournament Online",
        "description": "Experience realistic 3D tennis physics! Swipe to serve, hit top-spins, and smash the ball to win the ultimate grand slam championship."
    },
    "Bowling": {
        "title": "Bowling Master Strike 3D | Realistic Ten Pin Game Online",
        "description": "Flick the ball and knock down all 10 pins! The ultimate 3D bowling simulation sports game online. Aim for a perfect strike!"
    },
    "WaterSort3D": {
        "title": "Water Sort Color Puzzle | Relaxing Liquid Glass Brain Game",
        "description": "Pour colored water into the correct tubes to sort them perfectly. An addictive logic and relaxing brain-training sorting puzzle game."
    },
    "BottleShoot3D": {
        "title": "Bottle Shoot 3D Gun Game | Sniper Target Practice Free",
        "description": "Aim down the sights and smash bottles! A realistic 3D sniper simulation target practice shooting game. Test your accuracy for free."
    },
    "HeadFootball": {
        "title": "Head Football Soccer Heads | 1v1 Big Head Sports Game",
        "description": "Jump, kick, and headbutt the ball in explosive 1v1 soccer matches! Play fun big head football tournaments online for free."
    },
    "PocketGolf": {
        "title": "Mini Golf Pocket 3D | Play Fun Putt Putt Course Online",
        "description": "Putt your way through crazy mini golf courses! Discover obstacles, perfect your swing, and get a hole-in-one in this relaxing free sports game."
    },
    "CricketMaster": {
        "title": "Cricket Master World Cup | Play T20 Cricket Game Free",
        "description": "Hit massive sixes and win the match! A highly addictive 2D side-scrolling cricket sports game simulating top T20 world cup excitement."
    },
    "AirHockey3D": {
        "title": "Air Hockey 3D Arcade | Play Neon Disk Sports Game",
        "description": "Smash the glowing puck into the goal in fast-paced neon Air Hockey 3D! An electric arcade sports simulation free to play online."
    },
    "Sudoku": {
        "title": "Play Sudoku Classic Free Online | Daily Number Logic Puzzle",
        "description": "Challenge your mind with daily classic Sudoku! Free 9x9 grid number logic puzzles with multiple difficulty levels to train your brain."
    },
    "Basketball3D": {
        "title": "Basketball 3D Hoops Swish | Flick Throw Sports Game Online",
        "description": "Swipe to shoot hoops! Compete in a rapid-fire 3D basketball simulation. Score consecutive swishes for massive combo multipliers."
    },
    "Ludo": {
        "title": "Ludo Master Classic Board Game | Play Dice Multiplayer",
        "description": "Roll the dice and race your tokens! Play the famous classic Ludo board game online for free. A fun strategy game for friends and family."
    },
    "BubbleShooter": {
        "title": "Classic Bubble Shooter Pop | Match 3 Color Arcade Game",
        "description": "Aim and match 3 colors to burst all the bubbles! A classic satisfying arcade puzzle. Play Bubble Shooter for free and clear endless levels."
    },
    "Chess": {
        "title": "Play Master Chess Online Free | 3D Strategy Board Game",
        "description": "Test your strategic mind with classic Chess! Play against smart AI in beautiful realistic 3D graphics in this ultimate brain training board game."
    },
    "StickDuel": {
        "title": "Stickman Warriors Duel | Epic Ragdoll Fighting Game Free",
        "description": "Enter the arena in Stickman Warriors Duel! An action-packed physics-based ragdoll fighting game with insane weapons and combat maneuvers."
    },
    "TableTennis": {
        "title": "Ping Pong Table Tennis 3D | Fast Ping Pong Sports Game",
        "description": "Return the serve and smash the ball in Table Tennis 3D! Master topspin and backspin in this hyper-realistic ping pong sports simulator."
    },
    "ColorMatch": {
        "title": "Color Match 3D Brain Test | Fast Reaction Puzzle Game",
        "description": "Tap the matching color when the timer starts! A visually thrilling hyperspeed reaction memory puzzle game. Train your brain's processing speed."
    },
    "SushiMatch": {
        "title": "Sushi Match 3D Pair Connect | Memory Mahjong Puzzle",
        "description": "Find and pair the matching 3D sushi tiles! An addictive and relaxing mahjong-style memory connection game perfectly suited for puzzle logic fans."
    },
    "BurgerStack": {
        "title": "Burger Stack 3D Cooking Game | Free Food Builder Online",
        "description": "Catch ingredients to build the tallest burger tower! A crazy fast-paced 3D arcade physics game focusing on timing and food stacking fun."
    },
    "WordSearch": {
        "title": "Classic Word Search Puzzle | Find English Words Game Online",
        "description": "Find the hidden words in the grid! Keep your brain sharp with endless daily word search logic puzzles. Free educational vocabulary game."
    },
    "ArcheryMaster": {
        "title": "Archery Master Bow Physics | Play 2D Slingshot Shooter Game",
        "description": "Draw your bow, factor the wind, and release! Step into the Archery Master arena in this realistic physics-based slingshot target game."
    },
    "KnifeHit": {
        "title": "Knife Hit Game Online | Play Knife Throw Arcade Free",
        "description": "Play Knife Hit online for free! Throw sharp knives into rotating target logs, slice juicy apples to score points, and avoid hitting other knives. High-speed casual reaction game."
    }
}

base_dir = "/Users/gauravpurohit/Documents/GP/Playmix"

for game_folder, seo in games_seo.items():
    folder_path = os.path.join(base_dir, game_folder)
    if not os.path.exists(folder_path):
        continue
    
    # Process both index.html and game.html if they exist
    for filename in ["index.html", "game.html"]:
        file_path = os.path.join(folder_path, filename)
        if not os.path.exists(file_path):
            continue
            
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
            
        # Regex replacement for <title>
        content = re.sub(
            r'<title>.*?</title>',
            f'<title>{seo["title"]} | PlayMixGames</title>',
            content,
            flags=re.IGNORECASE | re.DOTALL
        )
        
        # Regex replacement for <meta name="description">
        # If it exists, replace its content attribute
        if re.search(r'<meta[^>]*name=["\']description["\'][^>]*>', content, re.IGNORECASE):
            content = re.sub(
                r'(<meta[^>]*name=["\']description["\'][^>]*content=["\'])(.*?)(["\'][^>]*>)',
                f'\\g<1>{seo["description"]}\\g<3>',
                content,
                flags=re.IGNORECASE
            )
        else:
            # If it doesn't exist, append it below <title>
            content = re.sub(
                r'(<title>.*?</title>)',
                f'\\1\n    <meta name="description" content="{seo["description"]}">',
                content,
                flags=re.IGNORECASE
            )
            
        # Write back
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)

print("✅ Mass SEO Override complete for all game files.")
