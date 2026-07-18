#!/usr/bin/env python3
import os
import re
import sys
import time
import ast
from pathlib import Path

BASE_DIR = Path(__file__).parent.resolve()
BLOG_DIR = BASE_DIR / "blog"
SITEMAP_PATH = BASE_DIR / "sitemap.xml"

CAT_META = {
    "action": {"name": "Action & Arcade", "emoji": "🎮"},
    "sports": {"name": "Sports Games", "emoji": "⚽"},
    "puzzle": {"name": "Puzzle & Brain", "emoji": "🧩"},
    "board": {"name": "Board & Classic", "emoji": "♟"},
    "quiz": {"name": "Quizzes & Tests", "emoji": "🧠"},
    "reels": {"name": "Wisdom & Reels", "emoji": "📜"}
}

def load_seo_data():
    seo_file = BASE_DIR / "seo_updater.py"
    if not seo_file.exists():
        return {}
    try:
        with open(seo_file, "r", encoding="utf-8") as f:
            content = f.read()
        start_idx = content.find('games_seo = {')
        if start_idx != -1:
            brace_count = 0
            end_idx = -1
            for i in range(start_idx + len('games_seo = '), len(content)):
                if content[i] == '{':
                    brace_count += 1
                elif content[i] == '}':
                    brace_count -= 1
                    if brace_count == 0:
                        end_idx = i + 1
                        break
            if end_idx != -1:
                dict_str = content[start_idx + len('games_seo = '):end_idx]
                return ast.literal_eval(dict_str)
    except Exception as e:
        print(f"⚠️ Error parsing seo_updater.py: {e}")
    return {}

def slugify(name):
    name = name.lower()
    name = name.replace("&", "and")
    name = re.sub(r'[^a-z0-9\s-]', '', name)
    name = re.sub(r'[\s_]+', '-', name)
    return name.strip('-')

def parse_games_data():
    js_file = BASE_DIR / "games-data.js"
    if not js_file.exists():
        print("❌ Error: games-data.js not found.")
        sys.exit(1)
    with open(js_file, "r", encoding="utf-8") as f:
        content = f.read()
    
    sections_match = re.search(r'sections:\s*\[(.*?)\]\s*,\s*featured:', content, re.DOTALL)
    if not sections_match:
        sections_match = re.search(r'sections:\s*\[(.*?)\]\s*\}\s*;?\s*$', content, re.DOTALL)
    if not sections_match:
        print("❌ Could not parse sections block from games-data.js")
        sys.exit(1)
        
    sections_content = sections_match.group(1)
    sections = re.findall(r'\{\s*id:\s*["\'](.*?)["\'],\s*title:\s*["\'](.*?)["\'],.*?items:\s*\[(.*?)\]\s*\}', sections_content, re.DOTALL)
    
    games = {}
    for cat_id, title, items_str in sections:
        items = re.findall(r'\{\s*name:\s*["\'](.*?)["\'],\s*genre:\s*["\'](.*?)["\'],\s*(?:icon:\s*["\'](.*?)["\'],\s*)?href:\s*["\'](.*?)["\'],\s*(?:badge:\s*["\'](.*?)["\'],\s*)?emoji:\s*["\'](.*?)["\']\s*\}', items_str)
        for name, genre, icon, href, badge, emoji in items:
            folder_slug = href.split('/')[0]
            url_slug = slugify(name)
            if url_slug in games:
                continue
            games[url_slug] = {
                "name": name,
                "genre": genre,
                "icon": icon or "",
                "href": href,
                "badge": badge or "",
                "emoji": emoji or "🎮",
                "folder_slug": folder_slug,
                "category_id": cat_id,
                "category_name": CAT_META.get(cat_id, {}).get("name", title),
                "url_slug": url_slug
            }
    return games

def get_thumbnail(game):
    if game["icon"] and os.path.exists(BASE_DIR / game["icon"]):
        return game["icon"]
    folder = BASE_DIR / game["folder_slug"]
    if folder.exists():
        for ext in [".png", ".jpg", ".jpeg", ".webp"]:
            thumb = folder / f"thumbnail{ext}"
            if thumb.exists():
                return f"{game['folder_slug']}/thumbnail{ext}"
            for f in folder.glob(f"*{ext}"):
                if "thumb" in f.name.lower() or f.name.lower() == f"{game['folder_slug'].lower()}{ext}":
                    return f"{game['folder_slug']}/{f.name}"
    return "img/192.png"

def get_related_games(current_game, all_games, count=4):
    same_cat = [g for g in all_games.values() if g["url_slug"] != current_game["url_slug"] and g["category_id"] == current_game["category_id"]]
    other_cat = [g for g in all_games.values() if g["url_slug"] != current_game["url_slug"] and g["category_id"] != current_game["category_id"]]
    related = same_cat[:count]
    if len(related) < count:
        related += other_cat[:(count - len(related))]
    return related

# Generate a high-quality deterministic pseudo-random number based on the seed string
def get_seeded_choice(arr, seed_str, salt):
    val = sum(ord(c) * (idx + 1) for idx, c in enumerate(seed_str + salt))
    return arr[val % len(arr)]

def generate_article_local(game, all_games):
    name = game["name"]
    genre = game["genre"]
    cat_id = game["category_id"]
    cat_name = game["category_name"]
    emoji = game["emoji"]
    href = game["href"]
    
    # Pre-calculate seeded variations for high uniqueness
    seed = name
    
    # 1. Introduction Hooks (Category-Specific)
    intros = {
        "action": [
            f"Step into the heart-pounding universe of {name}, the ultimate free online browser sensation that is taking the gaming world by storm. If you are looking for lightning-fast reflexes, intense survival challenges, and instantaneous action that runs directly in your web browser, this is the perfect destination. {name} strips away all unnecessary loading screens and complex controls to deliver pure, unadulterated gameplay right at your fingertips.",
            f"Get ready to test your speed, reaction time, and precision under pressure in the thrilling online arcade game {name}. In this free browser game, players are thrown directly into an escalating series of obstacles where timing and situational awareness are everything. {name} combines classic coin-op arcade thrills with modern visual flair to keep you hooked from your very first try.",
            f"If you have got a few minutes to spare and want a quick dose of adrenaline, look no further than {name}. This browser game challenges your spatial tracking, motor coordination, and risk assessment skills in a highly satisfying, loop-based arcade environment. Free to play online with zero downloads required, it is the perfect title to test your limits."
        ],
        "sports": [
            f"Bring the competitive stadium atmosphere directly into your home with {name}, a highly polished online browser sports game that delivers realistic physics and immersive action. Whether you are aiming for goal post headers, cue ball spins, or perfect bowling strikes, {name} lets you practice your favorite sports tactics without leaving your desk.",
            f"Experience the thrill of the win and the lessons of the field in {name}, the ultimate free browser sports game online. Built around responsive physics engines and quick decision-making windows, this game challenges your strategic angle selection and force application. No registration, no downloads – just jump on the pitch and play.",
            f"Get your sports fix instantly with {name}, a beautifully optimized free browser sports experience. Perfect for both casual gamers and sports enthusiasts, the game features competitive AI levels, clean mechanics, and quick matches that fit perfectly into your daily schedule. Test your precision and dominate the field."
        ],
        "puzzle": [
            f"Give your brain a comprehensive workout with {name}, a brilliant online logic puzzle game that combines satisfying mechanics with deep spatial and numerical thinking. Whether you are sorting colors, calculating arithmetic formulas, or matching patterns, {name} provides an intellectually stimulating escape directly in your web browser.",
            f"Engage your cognitive faculties and relax your mind with the satisfying puzzle mechanics of {name}. This free browser game offers a meditative yet challenging flow state where you can solve problems at your own pace, away from the stresses of daily timers. Learn patterns, plan moves ahead, and experience the satisfaction of a perfect clear.",
            f"If you love word grids, sliding numbers, or block-fitting challenges, {name} will quickly become your next browser obsession. This free online logic game is designed to test your deduction, memory, and spatial reasoning skills in a series of increasingly intricate layouts that are easy to learn but difficult to master."
        ],
        "board": [
            f"Revisit classic tabletop strategy and multiplayer excitement with {name}, a beautifully rendered browser board game that you can play free online. Combining time-honored rules with modern visual themes, this game lets you enjoy classic board gaming against challenging AI or friends directly in your web browser.",
            f"Experience the timeless appeal of tabletop classics with {name}, a free browser board game designed for strategic minds. From positioning pieces to rolling dice and blocking opponent pathways, {name} requires careful planning, risk evaluation, and patience to achieve victory in every match.",
            f"Whether you are looking to master grand opening lines or just want a casual match of X-O, {name} delivers the perfect board game experience online. Play instantly on desktop or mobile browsers, enjoy clean interfaces, and sharp board designs that make every strategic move feel premium."
        ],
        "quiz": [
            f"Discover more about yourself, test your trivia mastery, or brush up on your skills with {name}, a highly interactive browser test game online. Filled with thought-provoking scenarios, educational questions, and instant score feedback, {name} makes self-discovery and learning fun and accessible.",
            f"Challenge your mind and explore new domains of knowledge with {name}, a free educational quiz game that runs perfectly in any modern browser. Perfect for curious minds of all ages, it tests your grammar, math, health science, or personality archetypes in a clean, user-friendly interface.",
            f"Are you ready to test your knowledge or uncover your hidden traits? {name} offers an engaging digital quiz experience with hundreds of questions across multiple categories. Free to play online, it is the perfect tool to keep your intellect active, learn facts, and share insights with friends."
        ],
        "reels": [
            f"Dive into a revolutionary bite-sized learning experience with {name}, the ultimate free online micro-learning card game. Designed for mobile-first scrolling, {name} lets you swipe through short, engaging, and high-impact fact cards covering fitness, wellness, life skills, and global facts in under 60 seconds.",
            f"Level up your daily habits and vocabulary with {name}, a modern browser information reel game that brings interactive cards straight to your screen. Swipe left or right to explore tips, facts, and tactical guides that are written by experts for fast comprehension and instant application in your daily life.",
            f"Unlock wisdom in seconds with the fast-paced scrolling format of {name}. This free online browser experience lets you navigate a deck of high-yield wellness, sports, or general knowledge cards. It is the perfect companion for quick breaks, replacing mindless scrolling with valuable learning."
        ]
    }
    
    # 2. What is the Game (Category-Specific)
    what_is = {
        "action": [
            f"At its core, {name} is an arcade experience built around quick coordination and reaction times. Players must navigate a series of rotating targets, moving hazards, or falling elements by tapping or clicking at the exact right millisecond. The game features clean graphics, responsive physics, and a difficulty curve that rises smoothly to keep you in the zone.",
            f"Essentially, {name} tests your hand-eye coordination by introducing a simple, addictive loop: a central objective that is constantly changing states (like spinning, flying, or falling), and an input mechanism that demands timing. Slicing, throwing, or jumping at the right moment earns points, while a single collision with a bomb or obstacle triggers an immediate reset.",
            f"As a premier arcade title on PlayMix, {name} focuses on the psychological 'flow state' – that sweet spot where a game is challenging enough to require full focus, but intuitive enough to feel natural. The neon assets, responsive sounds, and clean layout provide an immersive audio-visual backdrop for your high-score runs."
        ],
        "sports": [
            f"At its core, {name} simulates the mechanical physics of real-world sports in a simplified browser layout. Players adjust angles, apply force vectors, and anticipate opponent moves to score goals, hit balls, or pocket objects. The game utilizes realistic gravity and collision algorithms to ensure that every throw, slide, or strike behaves exactly as you expect.",
            f"Essentially, {name} translates the rules and techniques of athletic sports into an intuitive interface. By using swipe or click-drag actions, you can control cue sticks, rackets, or players' limbs to execute complex techniques like ball spin, angle rebounds, and defensive blocks. It is a wonderful blend of mechanical skill and strategy.",
            f"Designed for sports fans, {name} focusing on competitive positioning and timing. You are pitted against an adaptive AI opponent that reads your shots, forcing you to mix up your serving speeds, shooting angles, and court positioning. Every point won requires focus and spatial execution."
        ],
        "puzzle": [
            f"At its core, {name} is a logic deduction and pattern recognition puzzle. The game presents a grid, a set of tubes, or an array of shapes that must be organized according to clear geometric or arithmetic rules. Players must analyze the starting state, plan a sequence of moves, and execute them without trapping themselves in an unsolvable layout.",
            f"Essentially, {name} is a digital brain trainer disguised as a satisfying game. By sorting colored liquids, matching matching pairs, or solving crossmath equations, you are actively building logical pathways. The game offers various grid sizes and difficulty tiers, making it accessible to kids and challenging for puzzle experts.",
            f"As a standout title on PlayMix, {name} is built on structural problem solving. Whether you are placing blocks on a board to clear lines or deducing family tree relationships from logic clues, the game keeps your attention focused, rewarding strategic planning rather than speed."
        ],
        "board": [
            f"At its core, {name} digitalizes a classic tabletop board layout. Players navigate counters, roll dice, and position pieces across grids according to historical rules. The interface features crisp board graphics, clear indicator paths, and intuitive token movement so you can focus entirely on outmaneuvering your opponent.",
            f"Essentially, {name} is a battle of strategic foresight. In this classic board format, every turn is a choice between aggressive offensive placement and solid defensive blocking. The game simulates dice rolls or piece captures with absolute fairness, providing a realistic virtual tabletop experience.",
            f"Designed for classic game lovers, {name} combines traditional board game structures with clean digital enhancements. You can play against smart computer opponents, test various opening layouts, or play casual matches on mobile. The game tracks your board history and displays legal moves dynamically."
        ],
        "quiz": [
            f"At its core, {name} is an interactive scenario-based quiz. It presents multiple-choice questions, situation cards, or vocabulary prompts that you answer according to your personal values, general knowledge, or grammar rules. Once completed, the game analyzes your inputs to output a detailed archetype report or a numerical score.",
            f"Essentially, {name} is a tool for learning and self-reflection. By navigating questions about tech habits, leadership values, or English syntax, you gain valuable feedback. The game uses a clean slider or button-click layout, making it extremely easy to read and answer questions on any device.",
            f"As a fun educational title, {name} combines learning with quiz game loops. You are presented with colorful cards, guided letter-tracing paths, or health trivia questions. The instant feedback system shows the correct answers immediately, turning every mistake into a learning moment."
        ],
        "reels": [
            f"At its core, {name} is an interactive micro-learning card reader. The deck consists of highly structured slides containing facts, fitness routines, or wellness tips. Users swipe to reveal cards, tap to read detailed breakdowns, and complete small self-check questions at the end of each reel to lock in the knowledge.",
            f"Essentially, {name} is a modern educational format tailored for busy lifestyles. It delivers condensed cards on personal finance, muscle workouts, or mental health exercises. The swipe controls are fast and natural, making it the perfect way to consume useful information without getting bogged down in long text.",
            f"Designed for the mobile-first generation, {name} uses visual cards to display high-yield knowledge. You can learn proper form, discover historical facts, or practice breathing patterns with dynamic timers. The game turns personal growth into a satisfying swipe-based collection habit."
        ]
    }
    
    # Category default controls & rules
    controls = {
        "action": f"Using your mouse or finger, click/tap the screen to make your character jump, throw a knife, or swipe to slice incoming targets. The game reacts instantly to your inputs, so focus on timing.",
        "sports": f"Use click-and-drag or swipe gesture to adjust your aiming line, pull back to set the shot power, and release to shoot, kick, or serve. Mobile players can swipe anywhere on the screen.",
        "puzzle": f"Tap or click a shape, tube, or number tile to select it, then tap the empty grid slot or destination tube to move it. Drag-and-drop is also supported for placing blocks.",
        "board": f"Click the dice to roll, then click on your token to move it along the board. For chess, click a piece to see its legal moves highlighted, then click the destination square.",
        "quiz": f"Read the prompt and click or tap the button corresponding to your preferred answer choice. Use the next button to load the next scenario.",
        "reels": f"Swipe left or right on mobile to browse cards, or use the on-screen arrow buttons on desktop. Tap a card to flip it over and read detailed information."
    }

    rules = {
        "action": [
            "A single collision with any hazard, bomb, or your own trailing body ends the level instantly.",
            "Complete the level target (e.g. slicing 10 balloons or throwing 8 knives) to advance.",
            "Bonus stars or apples appear randomly; collect them for score multipliers."
        ],
        "sports": [
            "Matches are governed by standard sport rules (e.g. score 7 goals to win air hockey, pocket 8-ball to win pool).",
            "Fouls (like pocketing the white cue ball or hitting out of bounds) grant your opponent ball-in-hand or free turns.",
            "Beat the timer or score more points than the AI before the round ends."
        ],
        "puzzle": [
            "You can only move objects into empty spaces or on top of matching elements (e.g. matching liquid colors).",
            "Getting stuck with no legal moves remaining results in a game over, though you can restart the level.",
            "Clear the grid or complete the matching objective using the fewest moves possible."
        ],
        "board": [
            "Players take turns sequentially; board movement is determined by dice rolls or chess piece values.",
            "To win, you must navigate all your tokens to the home column or capture the opponent's king (checkmate).",
            "Hitting an opponent's token sends it back to the starting area."
        ],
        "quiz": [
            "Select an option for every question to calculate your final test result.",
            "For grammar/math tests, incorrect answers lower your final score percentage but show correct explanations.",
            "There are no time limits per question, allowing you to read and think thoroughly."
        ],
        "reels": [
            "Swipe through the entire deck of cards to complete the reel.",
            "Completing the end-of-reel quiz unlocks achievements and new trivia decks.",
            "You can bookmark important cards for review later in the session."
        ]
    }

    # Tips & Strategies
    tips = {
        "action": [
            "Watch the upcoming hazard patterns instead of looking at your score counter.",
            "Commit to single, deliberate clicks rather than frantic rapid tapping.",
            "Prioritize dodging hazards over collecting bonus items.",
            "Observe the acceleration and spin patterns of objects before throwing or moving."
        ],
        "sports": [
            "Take your time to aim; the targeting lines show exactly where the ball will rebound.",
            "Apply soft force for close-range shots to maintain positioning control.",
            "Anticipate your opponent's movement vector and aim for the open space.",
            "Practice applying spin (English) to the ball to curve around obstacles."
        ],
        "puzzle": [
            "Look 2–3 moves ahead before executing your current move.",
            "Always keep at least one grid space or tube empty as a temporary holding area.",
            "Work from the outer edges inward to prevent blocking your core moves.",
            "Prioritize clearing complex, cluttered columns early in the puzzle."
        ],
        "board": [
            "Keep your tokens clustered together on the board to form a defensive wall.",
            "Control the center of the board early in the game to restrict opponent movement.",
            "Calculate your opponent's maximum possible roll to stay out of their strike zone.",
            "Don't rush to capture pieces if it leaves your king or back row exposed."
        ],
        "quiz": [
            "Read all the answer choices fully before making your selection.",
            "Answer honestly in personality quizzes to get an accurate archetype report.",
            "Use the process of elimination for difficult grammar or math questions.",
            "Review the answer key at the end of the quiz to lock in the learning."
        ],
        "reels": [
            "Slow down on action cards and visualize the fitness forms or wellness habits.",
            "Answer the micro-quizzes immediately to consolidate your memory.",
            "Take a screenshot of critical information cards for easy offline reference.",
            "Complete one full reel deck per day to build a habit of micro-learning."
        ]
    }

    strategies = {
        "action": f"To master {name}, you must develop muscle memory for its specific movement latency. Spend your first few sessions learning the exact delay between your click and the game's reaction. On faster levels, focus your eyes slightly ahead of your character's position to give your brain more time to process incoming hazards.",
        "sports": f"Advanced strategy in {name} revolves around force control and spin. Never use full power unless necessary; soft shots allow you to control where your ball or player lands, setting up your next shot easily. Always aim for rebounds using the board walls to bypass the opponent's defensive blocks.",
        "puzzle": f"The key to mastering {name} is holding-area management. In any sorting or block puzzle, your empty spaces are your most valuable resources. If you fill all your tubes or grid spaces, your flexibility drops to zero. Try to resolve one full section of the puzzle completely, freeing up resources for the rest of the board.",
        "board": f"In {name}, positioning is everything. In chess, Ludo, or backgammon, an isolated piece is a vulnerable piece. Keep your tokens or pieces within supporting distance of each other. Force your opponent to make risky moves by sealing off their safe paths, and capitalize on their mistakes immediately.",
        "quiz": f"To get the most out of {name}, analyze the patterns in your feedback reports. For educational tests, write down the rules you got wrong. For personality tests, compare your archetype score across different runs to see how your answers shift under different moods.",
        "reels": f"Maximal learning in {name} is achieved by applying the cards in real life. When swiping through fitness or wellness decks, practice the breathing timers or stretches immediately. Keep your focus high by reading only one category reel at a time to prevent cognitive fatigue."
    }

    mistakes = {
        "action": "Frantic clicking (panic tapping) when multiple hazards appear, which reduces control and leads to instant collisions.",
        "sports": "Using maximum power on every shot, which causes the ball or puck to bounce out of control, resulting in fouls.",
        "puzzle": "Moving tiles or pouring liquids randomly without planning where the temporary elements will be held, clogging the board.",
        "board": "Leaving tokens isolated far down the board, allowing the opponent to easily capture them and reset your progress.",
        "quiz": "Rushing through the text cards and selecting answers randomly without reading the scenarios or grammar rules.",
        "reels": "Scrolling through the cards too quickly without reading the detailed bullet points, turning learning into mindless swiping."
    }

    why_enjoy = {
        "action": "Players enjoy the instant feedback loop. Each level takes under a minute, providing quick dopamine hits and a strong 'just one more try' feeling.",
        "sports": "The satisfaction of realistic physics. Landing a clean volley, curveshot, or pocketing a ball using calculated angles feels highly rewarding.",
        "puzzle": "The meditative flow state. Organizing elements, sorting colors, or finding hidden patterns relaxes the mind while keeping the brain active.",
        "board": "The tactical intellectual challenge. Outsmarting an opponent through careful planning and seeing your strategy succeed is highly satisfying.",
        "quiz": "The fun of self-discovery and learning. Discovering your anime archetype or testing your health knowledge builds personal insights.",
        "reels": "The feeling of productive entertainment. Learning useful life skills, workouts, or facts in under a minute makes scrolling feel meaningful."
    }

    benefits = {
        "action": "Improves hand-eye coordination, speeds up visual processing, and trains fine motor control reflexes.",
        "sports": "Enhances spatial estimation, teaches vector force estimation, and develops competitive focus under pressure.",
        "puzzle": "Sharpens logical deduction, develops pattern recognition, and exercises both short-term memory and spatial planning.",
        "board": "Exercises strategic thinking, trains risk assessment, and develops patience and mental calculation speeds.",
        "quiz": "Expands general knowledge, sharpens grammatical/mathematical rules, and builds emotional intelligence through scenario reading.",
        "reels": "Teaches practical wellness habits, improves fitness posture knowledge, and builds a vocabulary of high-yield facts."
    }

    # Deterministic Selection using Adler-32 style hash of name
    intro_p = get_seeded_choice(intros[cat_id], name, "intro")
    what_is_p = get_seeded_choice(what_is[cat_id], name, "whatis")
    control_p = controls[cat_id]
    rules_list = rules[cat_id]
    tips_list = tips[cat_id]
    strategy_p = strategies[cat_id]
    mistake_p = mistakes[cat_id]
    enjoy_p = why_enjoy[cat_id]
    benefit_p = benefits[cat_id]
    
    # Generate unique FAQ items based on the game metadata
    faq_questions = [
        (f"Is {name} free to play?", f"Yes, {name} is 100% free to play directly in your web browser on PlayMixGames. There are no paid upgrades, downloads, or sign-ups required."),
        (f"Can I play {name} on my mobile phone?", f"Absolutely! {name} is fully optimized for touch controls. You can launch and play it on any iOS or Android mobile browser without installing apps."),
        (f"What is the best way to get a high score in {name}?", f"The secret to a high score is consistency and pacing. In {genre.lower()} games, rushing leads to simple mistakes. Spend time mastering the basic physics or deduction rules before aiming for speed."),
        (f"Do I need to install any plugins to play {name}?", f"No plugins or extensions are needed. The game is built using modern HTML5 web technologies and runs instantly in Chrome, Safari, Firefox, or Edge browsers."),
        (f"How does {name} train my brain or skills?", f"Playing {name} regularly helps train your {benefit_p.split(',')[0].lower()}. It forces your brain to analyze patterns, calculate angles, or make rapid logical decisions depending on the level difficulty."),
        (f"Are my high scores saved in {name}?", f"Yes! Your high scores are stored locally in your web browser. As long as you don't clear your browser cache, your achievements and best scores will be preserved.")
    ]
    
    # Build HTML sections
    body = []
    
    # Section 1: Intro (H2)
    body.append(f"<h2>{get_seeded_choice(['Master Your Skills In', 'Why You Should Play', 'Instant Fun With'], name, 'intro_title')} {name}</h2>")
    body.append(f"<p>{intro_p}</p>")
    body.append(f"<p>Unlike complicated desktop installations, this browser title is lightweight, fast, and responsive. It is designed to run perfectly on both mobile screens and desktop monitors, giving you a seamless gaming session wherever you are. Whether you are aiming to pass a quick break or trying to conquer the global leaderboards, this game has something to offer.</p>")
    
    # Section 2: What is [Game] (H2)
    body.append(f"<h2>What is {name}?</h2>")
    body.append(f"<p>{what_is_p}</p>")
    body.append(f"<p>The visual presentation is sleek and clean, utilizing high-contrast colors and smooth transitions. This minimal design keeps your focus directly on the gameplay, ensuring you aren't distracted during critical moments. Sound effects are satisfying and crisp, reinforcing your successful moves with direct audio feedback.</p>")
    
    # Section 3: How to Play & Controls (H2)
    body.append(f"<h2>How to Play &amp; Controls</h2>")
    body.append(f"<p>{control_p}</p>")
    body.append(f"<p>Here is a quick walkthrough to get you started:</p>")
    body.append(f"<ol>")
    body.append(f"<li><strong>Launch the Game:</strong> Open {name} in your browser and click the Play button to load the first level.</li>")
    body.append(f"<li><strong>Understand the Objective:</strong> Study the visual targets or prompt cards displayed on the screen.</li>")
    body.append(f"<li><strong>Execute Your Moves:</strong> Use your mouse clicks or touch taps to slide, match, shoot, or answer.</li>")
    body.append(f"<li><strong>Advance Levels:</strong> Complete the round goals to unlock the next, more challenging stage.</li>")
    body.append(f"</ol>")
    
    # Section 4: Game Rules (H2)
    body.append(f"<h2>Rules of {name}</h2>")
    body.append(f"<p>To stay on top of your run, make sure you keep these core rules in mind:</p>")
    body.append(f"<ul>")
    for r in rules_list:
        body.append(f"<li>{r}</li>")
    body.append(f"<li>Ensure you play within the boundary areas; going outside limits often cancels your current streak.</li>")
    body.append(f"</ul>")
    
    # Section 5: Beginner Tips (H2)
    body.append(f"<h2>Beginner Tips to Get Started</h2>")
    body.append(f"<p>If you are playing {name} for the first time, these quick tips will help you avoid early failures:</p>")
    body.append(f"<ul>")
    for t in tips_list:
        body.append(f"<li><strong>{t.split(':')[0]}:</strong>{t.split(':')[-1]}</li>")
    body.append(f"</ul>")
    
    # Section 6: Advanced Strategies (H2)
    body.append(f"<h2>Advanced Strategies for High Scores</h2>")
    body.append(f"<p>{strategy_p}</p>")
    body.append(f"<p>Another useful technique is adjusting your play style based on the level pacing. Slow down when the obstacles are tightly packed or options are limited; speed up only when you have a clear run. Consistent pacing outscores reckless speed in the long run.</p>")
    
    # Section 7: Common Mistakes (H2)
    body.append(f"<h2>Common Mistakes to Avoid</h2>")
    body.append(f"<p>Watch out for these frequent slip-ups that cost players their runs:</p>")
    body.append(f"<ul>")
    body.append(f"<li><strong>{mistake_p.split('(')[0].strip()}:</strong> {mistake_p}</li>")
    body.append(f"<li><strong>Rushing under pressure:</strong> Trying to complete sections too fast without reading the board layout or target speeds.</li>")
    body.append(f"<li><strong>Tunnel vision:</strong> Staring only at your character or card and missing surrounding threats or timers.</li>")
    body.append(f"</ul>")
    
    # Section 8: Why People Enjoy (H2)
    body.append(f"<h2>Why People Enjoy {name}</h2>")
    body.append(f"<p>{enjoy_p} The lack of complicated setups allows players to focus entirely on the core gaming loop. Additionally, the responsive controls and satisfying visuals make it a go-to game for quick stress relief and mental refreshment during busy days.</p>")
    
    # Section 9: Benefits (H2)
    body.append(f"<h2>Benefits of Playing</h2>")
    body.append(f"<p>{benefit_p} Regular play challenges your brain to process visual information faster and coordinates your responses under time pressure, making it a productive way to relax.</p>")
    
    # Section 10: Conclusion (H2)
    body.append(f"<h2>Conclusion</h2>")
    body.append(f"<p>{name} is a high-quality online browser game that offers the perfect mix of fun, challenge, and convenience. With no download or installation required, it is immediately accessible on any device. Start playing now, challenge your high scores, and discover why so many players love {name} on PlayMix!</p>")
    body.append(f"<p>Play {name} instantly on PlayMix Games.</p>")
    
    # FAQs
    body.append(f"<h2>Frequently Asked Questions (FAQ)</h2>")
    body.append(f"<div class=\"faq-section\">")
    for q, a in faq_questions:
        body.append(f"<div class=\"faq-item\">")
        body.append(f"<div class=\"faq-q\">❓ {q}</div>")
        body.append(f"<div class=\"faq-a\">{a}</div>")
        body.append(f"</div>")
    body.append(f"</div>")
    
    faq_html = []
    for q, a in faq_questions:
        faq_html.append(f"""
        <div class="faq-item">
            <div class="faq-q">❓ {q}</div>
            <div class="faq-a">{a}</div>
        </div>
        """)
        
    return "\n".join(body), "\n".join(faq_html)

HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{seo_title} | PlayMixGames</title>
    <meta name="description" content="{seo_description}">
    <link rel="icon" type="image/png" href="../img/192.png">
    <link rel="canonical" href="https://playmixgames.in/blog/{slug}.html">
    <link rel="stylesheet" href="../portal-style.css">
    
    <!-- Open Graph -->
    <meta property="og:type" content="article">
    <meta property="og:url" content="https://playmixgames.in/blog/{slug}.html">
    <meta property="og:title" content="{seo_title}">
    <meta property="og:description" content="{seo_description}">
    <meta property="og:image" content="https://playmixgames.in/{thumbnail_path}">

    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:title" content="{seo_title}">
    <meta property="twitter:description" content="{seo_description}">
    <meta property="twitter:image" content="https://playmixgames.in/{thumbnail_path}">

    <!-- Schemas -->
    <script type="application/ld+json">
    {{
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": "{seo_title}",
      "description": "{seo_description}",
      "image": "https://playmixgames.in/{thumbnail_path}",
      "author": {{
        "@type": "Organization",
        "name": "PlayMixGames",
        "url": "https://playmixgames.in"
      }},
      "publisher": {{
        "@type": "Organization",
        "name": "PlayMixGames",
        "logo": {{
          "@type": "ImageObject",
          "url": "https://playmixgames.in/img/192.png"
        }}
      }},
      "mainEntityOfPage": {{
        "@type": "WebPage",
        "@id": "https://playmixgames.in/blog/{slug}.html"
      }}
    }}
    </script>

    <script type="application/ld+json">
    {{
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [{{
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://playmixgames.in/"
      }},{{
        "@type": "ListItem",
        "position": 2,
        "name": "Blog",
        "item": "https://playmixgames.in/blog/index.html"
      }},{{
        "@type": "ListItem",
        "position": 3,
        "name": "{game_name}",
        "item": "https://playmixgames.in/blog/{slug}.html"
      }}]
    }}
    </script>
    
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6129521314653726" crossorigin="anonymous"></script>
    <script type="module" src="../analytics.js"></script>
    <script defer src="../ads.js"></script>
    <script>document.addEventListener('DOMContentLoaded',function(){{if(typeof prepSystem==="function")prepSystem();}});</script>

    <style>
        body.as-body {{
            background: #0f111a;
            color: #ffffff;
            margin: 0;
            padding: 0;
            padding-bottom: 70px;
            font-family: 'Outfit', sans-serif;
        }}
        .blog-content {{
            max-width: 800px;
            margin: 100px auto 40px;
            padding: 0 24px 70px;
            line-height: 1.8;
            font-family: 'Outfit', sans-serif;
            color: #cbd5e1;
            word-wrap: break-word;
            overflow-wrap: break-word;
        }}
        .blog-content h1 {{ 
            font-size: 2.8rem; 
            font-weight: 900; 
            color: #ffffff; 
            margin-bottom: 20px; 
            line-height: 1.2;
        }}
        .blog-content h2 {{ 
            font-size: 1.8rem; 
            font-weight: 800; 
            color: #38bdf8; 
            margin-top: 40px; 
            margin-bottom: 15px; 
            border-bottom: 1px solid rgba(255,255,255,0.1); 
            padding-bottom: 8px; 
            line-height: 1.3;
        }}
        .blog-content h3 {{ 
            font-size: 1.3rem; 
            font-weight: 700; 
            color: #60a5fa; 
            margin-top: 30px; 
            margin-bottom: 10px; 
        }}
        .blog-content p {{ 
            margin-bottom: 20px; 
            font-size: 1.1rem;
        }}
        .blog-content ul, .blog-content ol {{
            margin-bottom: 20px;
            padding-left: 24px;
        }}
        .blog-content li {{
            margin-bottom: 10px;
            font-size: 1.05rem;
        }}
        .blog-content strong {{
            color: #ffffff;
        }}
        
        /* Premium Play In Browser Box */
        .play-hero-box {{
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 16px;
            padding: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 20px;
            margin: 30px 0;
            backdrop-filter: blur(10px);
        }}
        .play-hero-info {{
            display: flex;
            align-items: center;
            gap: 15px;
        }}
        .play-hero-emoji {{
            font-size: 2.8rem;
        }}
        .play-hero-info h2 {{
            margin: 0 !important;
            font-size: 1.4rem !important;
            font-weight: 800;
            color: #ffffff !important;
            border: none !important;
            padding: 0 !important;
        }}
        .play-hero-info p {{
            margin: 5px 0 0 0 !important;
            font-size: 0.9rem;
            color: #94a3b8;
        }}
        .play-hero-btn {{
            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
            color: #ffffff;
            font-weight: 700;
            padding: 12px 24px;
            border-radius: 10px;
            text-decoration: none;
            white-space: nowrap;
            transition: transform 0.2s, box-shadow 0.2s;
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }}
        .play-hero-btn:hover {{
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(59, 130, 246, 0.5);
        }}
        
        .game-thumb {{ 
            display: block;
            width: 100%; 
            max-width: 450px; 
            height: auto;
            border-radius: 16px; 
            margin: 24px auto; 
            border: 1px solid rgba(255,255,255,0.1); 
        }}
        .play-btn-cta {{ 
            display: inline-block; 
            background: linear-gradient(135deg, #3b82f6, #1d4ed8); 
            color: #ffffff; 
            font-weight: 800; 
            padding: 15px 30px; 
            border-radius: 12px; 
            text-decoration: none; 
            margin: 30px auto; 
            box-shadow: 0 10px 20px rgba(59, 130, 246, 0.3); 
            max-width: 100%;
            box-sizing: border-box;
            text-align: center;
            transition: transform 0.2s, box-shadow 0.2s;
        }}
        .play-btn-cta:hover {{ 
            transform: translateY(-2px); 
            box-shadow: 0 15px 30px rgba(59, 130, 246, 0.5); 
        }}
        .related-section {{ 
            background: #0f172a; 
            padding: 25px; 
            border-radius: 16px; 
            margin-top: 40px; 
            border: 1px solid rgba(255,255,255,0.05);
        }}
        .related-grid {{ 
            display: grid; 
            grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); 
            gap: 15px; 
            margin-top: 15px; 
        }}
        .related-card {{ 
            background: #1e293b; 
            padding: 15px; 
            border-radius: 12px; 
            text-decoration: none; 
            color: #fff; 
            text-align: center; 
            border: 1px solid rgba(255,255,255,0.05); 
            display: block; 
            transition: transform 0.2s, border-color 0.2s;
        }}
        .related-card:hover {{ 
            border-color: #38bdf8; 
            transform: translateY(-3px);
        }}
        .related-card span {{
            font-size: 2.2rem;
            display: block;
            margin-bottom: 8px;
        }}
        .related-card p {{
            margin: 0;
            font-size: 0.9rem;
            font-weight: 600;
        }}
        .adsterra-slot {{ 
            margin: 40px 0; 
            display: flex; 
            justify-content: center; 
        }}
        
        /* FAQs styling */
        .faq-item {{
            margin-bottom: 20px;
            background: rgba(255,255,255,0.02);
            border: 1px solid rgba(255,255,255,0.05);
            border-radius: 12px;
            padding: 15px;
        }}
        .faq-q {{
            font-weight: 800;
            color: #fff;
            margin-bottom: 8px;
        }}
        .faq-a {{
            color: #cbd5e1;
            font-size: 0.95rem;
            line-height: 1.6;
        }}

        /* Mobile Adjustments */
        @media (max-width: 650px) {{
            .blog-content {{
                margin-top: 80px;
                padding: 0 16px;
            }}
            .blog-content h1 {{
                font-size: 2.2rem;
                margin-bottom: 15px;
            }}
            .blog-content h2 {{
                font-size: 1.5rem;
                margin-top: 30px;
            }}
            .blog-content p {{
                font-size: 1rem;
            }}
            .blog-content li {{
                font-size: 0.95rem;
            }}
            .blog-content ul, .blog-content ol {{
                padding-left: 20px;
            }}
            .play-hero-box {{
                flex-direction: column;
                align-items: stretch;
                text-align: center;
                gap: 15px;
                padding: 16px;
            }}
            .play-hero-info {{
                flex-direction: column;
                gap: 8px;
            }}
            .play-hero-btn {{
                text-align: center;
                padding: 12px 20px;
                font-size: 1rem;
            }}
            .play-btn-cta {{
                width: 100%;
                font-size: 1rem;
                padding: 12px 20px;
            }}
            .related-grid {{
                grid-template-columns: repeat(2, 1fr);
                gap: 12px;
            }}
            .related-card {{
                padding: 12px 8px;
            }}
            .related-card span {{
                font-size: 1.8rem;
            }}
        }}
    </style>
</head>
<body class="as-body">
    <header class="as-header">
        <a href="../index.html" class="as-header-logo">PlayMix</a>
    </header>

    <main class="blog-content">
        <h1>{game_name}</h1>
        
        <!-- App-Store Style Play Hero Box -->
        <div class="play-hero-box">
            <div class="play-hero-info">
                <span class="play-hero-emoji">{game_emoji}</span>
                <div>
                    <h2>Play {game_name} Online</h2>
                    <p>Instant Play in Browser • No Downloads • 100% Free</p>
                </div>
            </div>
            <a href="https://playmixgames.in/{game_href}" class="play-hero-btn">Play in Browser Now →</a>
        </div>

        <img class="game-thumb" src="../{thumbnail_path}" alt="{game_name} gameplay cover thumbnail screenshot">
        
        {generated_article_body}

        <div style="text-align: center; margin-top: 40px;">
            <a href="https://playmixgames.in/{game_href}" class="play-btn-cta">Play {game_name} Instantly on PlayMix Games</a>
        </div>

        <!-- Adsterra slot -->
        <div class="adsterra-slot">
            <div id="container-63208462c4f9ec6018b4ea2e1903489d"></div>
        </div>

        <!-- Related Games -->
        <div class="related-section">
            <h3>Related Games you might like:</h3>
            <div class="related-grid">{related_cards}</div>
        </div>
    </main>

    <footer class="as-footer">
        <div class="as-footer-links">
            <a href="../index.html">Home</a>
            <a href="../about.html">About</a>
            <a href="../privacy.html">Privacy Policy</a>
            <a href="../terms.html">Terms of Service</a>
            <a href="../contact.html">Contact</a>
        </div>
        <p class="as-footer-copy">© 2026 PlayMixGames. All rights reserved.</p>
    </footer>
</body>
</html>
"""

def update_sitemap(blog_slugs):
    if not SITEMAP_PATH.exists():
        print("⚠️ Warning: sitemap.xml not found. Skipping sitemap update.")
        return
        
    print("Updating sitemap.xml...")
    with open(SITEMAP_PATH, "r", encoding="utf-8") as f:
        content = f.read()
        
    existing_urls = set(re.findall(r'<loc>(.*?)</loc>', content))
    
    blog_urls = [f"https://playmixgames.in/blog/{slug}.html" for slug in blog_slugs]
    blog_urls.append("https://playmixgames.in/blog/index.html")
    
    new_blocks = []
    for url in blog_urls:
        if url not in existing_urls:
            block = f"""  <url>
    <loc>{url}</loc>
    <priority>0.8</priority>
  </url>"""
            new_blocks.append(block)
            
    if new_blocks:
        new_content = re.sub(
            r'</urlset>',
            '\n' + '\n'.join(new_blocks) + '\n</urlset>',
            content,
            flags=re.IGNORECASE
        )
        with open(SITEMAP_PATH, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"✅ Added {len(new_blocks)} new URLs to sitemap.xml")
    else:
        print("ℹ️ All blog URLs already present in sitemap.xml")

def generate_blog_index(games):
    index_path = BLOG_DIR / "index.html"
    print("Generating blog/index.html homepage...")
    
    cards_html = []
    for g in games.values():
        thumb = get_thumbnail(g)
        cards_html.append(f"""
        <a href="{g['url_slug']}.html" class="blog-card" data-category="{g['category_id']}">
            <div class="card-thumb-wrap">
                <img src="../{thumb}" alt="{g['name']} gameplay review" loading="lazy">
                <span class="card-cat-badge">{g['category_name']}</span>
            </div>
            <div class="card-body">
                <h3>{g['emoji']} {g['name']}</h3>
                <p>Learn rules, controls, tips, and strategies for {g['name']}. Master this game online for free!</p>
                <span class="read-more">Read Guide →</span>
            </div>
        </a>
        """)
        
    index_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PlayMixGames Official Blog | Free Game Guides & Strategies</title>
    <meta name="description" content="Discover detailed walkthroughs, strategies, tips, rules, and controls for all your favorite free browser games on PlayMix.">
    <link rel="icon" type="image/png" href="../img/192.png">
    <link rel="canonical" href="https://playmixgames.in/blog/index.html">
    <link rel="stylesheet" href="../portal-style.css">
    
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6129521314653726" crossorigin="anonymous"></script>
    <script type="module" src="../analytics.js"></script>
    <script defer src="../ads.js"></script>
    <script>document.addEventListener('DOMContentLoaded',function(){{if(typeof prepSystem==="function")prepSystem();}});</script>

    <style>
        body.blog-index {{
            background: #0f111a;
            color: #ffffff;
            font-family: 'Outfit', sans-serif;
            margin: 0;
            padding: 0 0 70px;
        }}
        .index-container {{
            max-width: 1200px;
            margin: 100px auto 40px;
            padding: 0 20px;
        }}
        .blog-header {{
            text-align: center;
            margin-bottom: 50px;
        }}
        .blog-header h1 {{
            font-size: 3rem;
            font-weight: 900;
            color: #ffffff;
            margin-bottom: 10px;
            letter-spacing: -1px;
        }}
        .blog-header p {{
            color: #94a3b8;
            font-size: 1.1rem;
            max-width: 600px;
            margin: 0 auto;
        }}
        
        .filter-bar {{
            display: flex;
            justify-content: center;
            gap: 10px;
            flex-wrap: wrap;
            margin-bottom: 40px;
        }}
        .filter-btn {{
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.1);
            color: #cbd5e1;
            padding: 10px 20px;
            border-radius: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
        }}
        .filter-btn:hover, .filter-btn.active {{
            background: #3b82f6;
            color: #ffffff;
            border-color: #3b82f6;
            transform: translateY(-2px);
        }}
        
        .blog-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 25px;
        }}
        .blog-card {{
            background: #1e293b;
            border-radius: 16px;
            overflow: hidden;
            text-decoration: none;
            color: #ffffff;
            border: 1px solid rgba(255,255,255,0.05);
            transition: transform 0.3s, border-color 0.3s;
            display: flex;
            flex-direction: column;
        }}
        .blog-card:hover {{
            transform: translateY(-5px);
            border-color: #38bdf8;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        }}
        .card-thumb-wrap {{
            position: relative;
            aspect-ratio: 16/10;
            overflow: hidden;
            background: #0f172a;
        }}
        .card-thumb-wrap img {{
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.3s;
        }}
        .blog-card:hover .card-thumb-wrap img {{
            transform: scale(1.05);
        }}
        .card-cat-badge {{
            position: absolute;
            bottom: 12px;
            left: 12px;
            background: rgba(15, 23, 42, 0.8);
            backdrop-filter: blur(5px);
            color: #38bdf8;
            padding: 4px 10px;
            border-radius: 8px;
            font-size: 0.8rem;
            font-weight: 700;
        }}
        .card-body {{
            padding: 20px;
            display: flex;
            flex-direction: column;
            flex-grow: 1;
        }}
        .card-body h3 {{
            margin: 0 0 10px 0;
            font-size: 1.2rem;
            font-weight: 800;
        }}
        .card-body p {{
            margin: 0 0 20px 0;
            color: #94a3b8;
            font-size: 0.9rem;
            line-height: 1.5;
            flex-grow: 1;
        }}
        .read-more {{
            color: #38bdf8;
            font-weight: 700;
            font-size: 0.95rem;
        }}
        
        .adsterra-index-slot {{
            margin: 50px 0 20px;
            display: flex;
            justify-content: center;
        }}
        
        @media (max-width: 600px) {{
            .blog-header h1 {{ font-size: 2.2rem; }}
            .index-container {{ margin-top: 80px; }}
        }}
    </style>
</head>
<body class="blog-index">
    <header class="as-header">
        <a href="../index.html" class="as-header-logo">PlayMix</a>
    </header>

    <main class="index-container">
        <div class="blog-header">
            <h1>Official PlayMix Blog</h1>
            <p>Master your skills with detailed walkthroughs, strategies, tips, rules, and controls for all free online games on PlayMix.</p>
        </div>

        <div class="filter-bar">
            <button class="filter-btn active" data-filter="all">All Category</button>
            <button class="filter-btn" data-filter="action">Action</button>
            <button class="filter-btn" data-filter="sports">Sports</button>
            <button class="filter-btn" data-filter="puzzle">Puzzle</button>
            <button class="filter-btn" data-filter="board">Board</button>
            <button class="filter-btn" data-filter="quiz">Quiz</button>
            <button class="filter-btn" data-filter="reels">Wisdom</button>
        </div>

        <div class="blog-grid">
            {"".join(cards_html)}
        </div>
        
        <!-- Adsterra slot -->
        <div class="adsterra-index-slot">
            <div id="container-63208462c4f9ec6018b4ea2e1903489d"></div>
        </div>
    </main>

    <footer class="as-footer">
        <div class="as-footer-links">
            <a href="../index.html">Home</a>
            <a href="../about.html">About</a>
            <a href="../privacy.html">Privacy Policy</a>
            <a href="../terms.html">Terms of Service</a>
            <a href="../contact.html">Contact</a>
        </div>
        <p class="as-footer-copy">© 2026 PlayMixGames. All rights reserved.</p>
    </footer>

    <script>
        document.querySelectorAll('.filter-btn').forEach(btn => {{
            btn.addEventListener('click', () => {{
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const filter = btn.dataset.filter;
                document.querySelectorAll('.blog-card').forEach(card => {{
                    if (filter === 'all' || card.dataset.category === filter) {{
                        card.style.display = 'flex';
                    }} else {{
                        card.style.display = 'none';
                    }}
                }});
            }});
        }});
    </script>
</body>
</html>
"""
    with open(index_path, "w", encoding="utf-8") as f:
        f.write(index_html)
    print("✅ Successfully generated blog/index.html")

def main():
    BLOG_DIR.mkdir(parents=True, exist_ok=True)
    
    print("Discovering games from games-data.js...")
    games = parse_games_data()
    print(f"Successfully discovered {len(games)} unique games.")
    
    print("Loading SEO titles from seo_updater.py...")
    seo_mapping = load_seo_data()
    
    blog_slugs = []
    
    print(f"Beginning bulk local generation of {len(games)} SEO articles...")
    for idx, (slug, game) in enumerate(games.items(), 1):
        filename = BLOG_DIR / f"{slug}.html"
        
        # We overwrite files to make sure they all have the new Play In Browser Box and uniform high-quality structure
        print(f"[{idx}/{len(games)}] ⚡ Generating article for '{game['name']}'...")
        
        seo = seo_mapping.get(game["folder_slug"], {})
        seo_title = seo.get("title", f"Play {game['name']} Online Free - Walkthrough, Rules, Tips")
        seo_description = seo.get("description", f"Play {game['name']} online for free in your browser! Discover rules, controls, beginner tips, and advanced high-score strategies for {game['name']}.")
        
        seo_title = re.sub(r'\s*\|\s*PlayMixGames\s*', '', seo_title, flags=re.IGNORECASE)
        
        body_content, faq_html = generate_article_local(game, games)
        
        related_cards = []
        related_games = get_related_games(game, games, count=4)
        for rg in related_games:
            rg_thumb = get_thumbnail(rg)
            related_cards.append(f"""
            <a href="{rg['url_slug']}.html" class="related-card">
                <span>{rg['emoji']}</span>
                <p>{rg['name']}</p>
            </a>
            """)
            
        html = HTML_TEMPLATE.format(
            seo_title=seo_title,
            seo_description=seo_description,
            slug=slug,
            thumbnail_path=get_thumbnail(game),
            game_name=game["name"],
            game_emoji=game["emoji"],
            game_href=game["href"],
            generated_article_body=body_content,
            faq_items=faq_html,
            related_cards="".join(related_cards)
        )
        
        with open(filename, "w", encoding="utf-8") as f:
            f.write(html)
            
        blog_slugs.append(slug)
        
    generate_blog_index(games)
    update_sitemap(blog_slugs)
    
    print("\n🎉 Bulk SEO Blog Generation Complete!")

if __name__ == "__main__":
    main()
