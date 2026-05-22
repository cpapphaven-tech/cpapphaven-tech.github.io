// PlayMix Games Data - used by App Store UI renderer
window.PMG_DATA = {
  featured: [
    { name: "Crossy Road", tag: "🏎️ Fast & Fun", desc: "Navigate the sunny roads and collect number balloons", href: "CrossyRoad/index.html", gradient: "linear-gradient(135deg,#1c0a00,#ff9f0a,#ff453a)", icon: "🏎️", badge: "trend", image: "img/crossroad600.png" },
    { name: "Balloon Ninja Slice", tag: "🔥 Trending", desc: "Swipe to slash flying balloons and dodge the bombs!", href: "NeonSlicer/index.html", gradient: "linear-gradient(135deg,#1a0533,#bf5af2,#ff453a)", icon: "🗡️", badge: "hot", image: "img/ninja600.png" },
    { name: "Word Crossword", tag: "🔥 New Game", desc: "Master the Modern Word Crossword!", href: "WordCrossword/index.html", gradient: "linear-gradient(135deg,#064e3b,#4ade80,#064e3b)", icon: "🔎", badge: "new", image: "img/wordcrossword600.png" },
  ],

  // Sections rendered as horizontal scroll rows
  sections: [
    {
      id: "action",
      title: "Action & Arcade",
      more: true,
      tab: "games",
      items: [
        { name: "Balloon Ninja",    genre: "Arcade",   icon: "assets/ninja200.png",             href: "NeonSlicer/index.html",          badge: "hot",     emoji: "🗡️" },
        { name: "Highway Rush",     genre: "Racing",   icon: "assets/highwayrushcar200.png",     href: "HighwayRush/index.html",         badge: "trend",   emoji: "🏎️" },
        { name: "Crossy Road Hop",  genre: "Arcade",   icon: "assets/crossroad200.png",          href: "CrossyRoad/index.html",          badge: "",        emoji: "🐔" },
        { name: "Galaxy Shooter",   genre: "Shooter",  icon: "assets/aleign200.png",             href: "GalaxyAssault/index.html",       badge: "",        emoji: "👾" },
        { name: "Flappy Rise Bird", genre: "Arcade",   icon: "assets/Flappyrisebird200.png",     href: "FlappyRise/index.html",          badge: "hot",     emoji: "🐦" },
        { name: "Doodle Jump",      genre: "Platform", icon: "assets/doodlejump200.png",         href: "DoodleJump/index.html",          badge: "new",     emoji: "😊" },
        { name: "Idle Ball Escape", genre: "Casual",   icon: "",                                 href: "IdleBallEscape/index.html",      badge: "new",     emoji: "🌀" },
        { name: "Kids Balloon Pop", genre: "Kids",     icon: "",                                 href: "KidsBalloonPop/index.html",      badge: "new",     emoji: "🎈" },
        { name: "Coloring for Kids", genre: "Kids",    icon: "",                                 href: "ColoringKids/index.html",        badge: "new",     emoji: "🎨" },
        { name: "Brick Breaker",    genre: "Classic",  icon: "assets/brickbreaker200.png",       href: "BrickBreaker/game.html",         badge: "",        emoji: "🧱" },
        { name: "Bubble Shooter",   genre: "Arcade",   icon: "assets/bubble_shooter.png",        href: "BubbleShooter/index.html",       badge: "",        emoji: "🔵" },
      ]
    },
    {
      id: "sports",
      title: "Sports Games",
      more: true,
      tab: "games",
      items: [
        { name: "Striker League",   genre: "Football", icon: "assets/Strikerleague200.png",      href: "StrikerLeague/index.html",       badge: "new",   emoji: "⚽" },
        { name: "8 Ball Pool",      genre: "Sports",   icon: "assets/pool200.png",               href: "Pool/index.html",                badge: "",      emoji: "🎱" },
        { name: "Cricket Master",   genre: "Cricket",  icon: "assets/cricket_master_icon.png",   href: "CricketMaster/index.html",       badge: "new",   emoji: "🏏" },
        { name: "Head Football",    genre: "Football", icon: "assets/head_football_icon.png",    href: "HeadFootball/index.html",        badge: "",      emoji: "⚽" },
        { name: "Volleyball 3D",    genre: "Sports",   icon: "assets/volley200.png",             href: "VolleyballArena/index.html",     badge: "new",   emoji: "🏐" },
        { name: "Tennis Master 3D", genre: "Sports",   icon: "assets/Tennis200.png",             href: "Tennis/game.html",               badge: "new",   emoji: "🎾" },
        { name: "Air Hockey 3D",    genre: "Sports",   icon: "assets/airhockey200.png",          href: "AirHockey3D/index.html",         badge: "",      emoji: "🏑" },
        { name: "Bowling Strike",   genre: "Sports",   icon: "assets/Bowling200.png",            href: "Bowling/game.html",              badge: "updated",emoji: "🎳" },
        { name: "Table Tennis",     genre: "Sports",   icon: "assets/table_tennis_icon.png",     href: "TableTennis/index.html",         badge: "new",   emoji: "🏓" },
        { name: "Basketball 3D",    genre: "Sports",   icon: "assets/basketball3d.png",          href: "Basketball3D/index.html",        badge: "",      emoji: "🏀" },
        { name: "Football 3D",      genre: "Sports",   icon: "assets/football3d.png",            href: "Football3D/index.html",          badge: "",      emoji: "⚽" },
        { name: "Pocket Golf",      genre: "Sports",   icon: "assets/pocket_golf_icon.png",      href: "PocketGolf/index.html",          badge: "",      emoji: "⛳" },
        { name: "Bottle Shoot",     genre: "Skill",    icon: "assets/bottle200.png",             href: "BottleShoot3D/index.html",       badge: "",      emoji: "🍾" },
        { name: "Archery Master",   genre: "Skill",    icon: "assets/Archeryshooting200.png",    href: "ArcheryMaster/index.html",       badge: "new",   emoji: "🏹" },
        { name: "Car Racer 3D",     genre: "Racing",   icon: "assets/carrace200.png",            href: "RetroRacer/index.html",          badge: "new",   emoji: "🏎️" },
      ]
    },
    {
      id: "puzzle",
      title: "Puzzle & Brain",
      more: true,
      tab: "games",
      items: [
        { name: "Crossmath",        genre: "Math",     icon: "",                                 href: "Crossmath/game.html",            badge: "new",  emoji: "➕" },
        { name: "Hidden Word",      genre: "Word",     icon: "",                                 href: "HiddenWord/index.html",          badge: "new",  emoji: "🔎" },
        { name: "Dot Connect",      genre: "Puzzle",   icon: "",                                 href: "DotConnect/index.html",          badge: "new",  emoji: "🔴" },
        { name: "Merge Numbers",    genre: "Puzzle",   icon: "assets/mergenumber200.png",        href: "MergeNumbers/game.html",         badge: "",     emoji: "🔢" },
        { name: "Block Puzzle",     genre: "Puzzle",   icon: "assets/block_puzzle_thumbnail_1772348265891.png", href: "BlockPuzzle/game.html", badge: "", emoji: "🧩" },
        { name: "Numpuz",           genre: "Sliding",  icon: "assets/numberpuzzlenumpad200.png", href: "Numpuz/index.html",              badge: "new",  emoji: "🧩" },
        { name: "NumMatch",         genre: "Logic",    icon: "assets/numberballoon200.png",      href: "NumMatch/index.html",            badge: "new",  emoji: "🔢" },
        { name: "Sudoku Daily",     genre: "Logic",    icon: "assets/sudoku200.png",             href: "Sudoku/index.html",              badge: "",     emoji: "🧩" },
        { name: "Word Search",      genre: "Word",     icon: "assets/wordsrarch200.png",         href: "WordSearch/index.html",          badge: "",     emoji: "🔍" },
        { name: "Word Crossword",   genre: "Word",     icon: "assets/wordcrossword200.png",      href: "WordCrossword/index.html",       badge: "new",  emoji: "🔤" },
        { name: "Tic Tac Toe",      genre: "Classic",  icon: "assets/Tictactoe200.png",          href: "TicTacToe/index.html",           badge: "new",  emoji: "❌" },
        { name: "Solitaire",        genre: "Cards",    icon: "assets/solitaire200.png",          href: "Solitaire/index.html",           badge: "hot",  emoji: "♠️" },
        { name: "Water Sort",       genre: "Puzzle",   icon: "assets/watersort3d.png",           href: "WaterSort3D/index.html",         badge: "",     emoji: "🧪" },
        { name: "Fruit Splash",     genre: "Match-3",  icon: "assets/fruits200.png",             href: "FruitSplash/index.html",         badge: "",     emoji: "🍉" },
        { name: "Color Match",      genre: "Reaction", icon: "assets/colormatch.png",            href: "ColorMatch/index.html",          badge: "",     emoji: "🎨" },
        { name: "Helix Bounce",     genre: "Arcade",   icon: "assets/helixbounce.png",           href: "HelixBounce/index.html",         badge: "",     emoji: "🧬" },
        { name: "Stack 3D",         genre: "Physics",  icon: "assets/stack3d.png",               href: "Stack3D/index.html",             badge: "",     emoji: "🧱" },
      ]
    },
    {
      id: "board",
      title: "Board & Classic",
      more: false,
      tab: "games",
      items: [
        { name: "Chess Master",     genre: "Board",    icon: "assets/chess200.png",              href: "Chess/index.html",               badge: "",     emoji: "♟" },
        { name: "Ludo Classic",     genre: "Board",    icon: "assets/ludo200.png",               href: "Ludo/index.html",                badge: "",     emoji: "🎲" },
        { name: "Neon Pac-Man",     genre: "Classic",  icon: "assets/pacman200.png",             href: "NeonPacman/game.html",           badge: "new",  emoji: "👾" },
        { name: "Neon Snake",       genre: "Classic",  icon: "assets/snake200.png",              href: "NeonSnake/index.html",           badge: "",     emoji: "🐍" },
        { name: "SkiFree Classic",  genre: "Retro",    icon: "assets/Skyfigame200.png",          href: "SkiFree/index.html",             badge: "",     emoji: "⛷️" },
        { name: "Sushi Match",      genre: "Memory",   icon: "assets/sushimatch3d.png",          href: "SushiMatch/index.html",          badge: "",     emoji: "🍣" },
        { name: "Burger Stack",     genre: "Physics",  icon: "",                                 href: "BurgerStack/index.html",         badge: "",     emoji: "🍔" },
        { name: "Family Tree",      genre: "Logic",    icon: "assets/familytree200.png",         href: "FamilyTree/index.html",          badge: "new",  emoji: "🌳" },
        { name: "Stickman Warriors",genre: "Action",   icon: "assets/stckduels.png",             href: "StickDuel/index.html",           badge: "new",  emoji: "⚔️" },
      ]
    },
    {
      id: "quiz",
      title: "Quizzes & Tests",
      more: false,
      tab: "games",
      items: [
        { name: "Personality Test", genre: "Quiz",     icon: "",                                 href: "PersonalityTest/index.html",     badge: "trend",emoji: "🧠" },
        { name: "AI Readiness",     genre: "Quiz",     icon: "",                                 href: "AIReadiness/index.html",         badge: "new",  emoji: "🤖" },
        { name: "Travel Destiny",   genre: "Quiz",     icon: "",                                 href: "TravelDestiny/index.html",       badge: "new",  emoji: "✈️" },
        { name: "Anime Archetype",  genre: "Quiz",     icon: "",                                 href: "AnimeArchetype/index.html",      badge: "new",  emoji: "🗡️" },
        { name: "Leadership Style", genre: "Quiz",     icon: "",                                 href: "LeadershipStyle/index.html",     badge: "new",  emoji: "👑" },
        { name: "Hidden Talent",    genre: "Quiz",     icon: "",                                 href: "HiddenTalent/index.html",        badge: "new",  emoji: "✨" },
        { name: "Health Hero",      genre: "Quiz",     icon: "assets/healthhro200.png",          href: "HealthHeroTrivia/index.html",    badge: "new",  emoji: "🏥" },
        { name: "English Grammar",  genre: "Learning", icon: "assets/Englishgrammquiz200.png",   href: "EnglishGrammarQuiz/index.html",  badge: "new",  emoji: "📚" },
        { name: "Nutrition Quiz",   genre: "Health",   icon: "",                                 href: "NutritionQuiz/index.html",       badge: "new",  emoji: "🥗" },
        { name: "ABC Tracing",      genre: "Learning", icon: "",                                 href: "ABCTracing/index.html",          badge: "new",  emoji: "✍️" },
        { name: "Simply Draw",      genre: "Learning", icon: "",                                 href: "SimplyDraw/index.html",          badge: "new",  emoji: "🎨" },
        { name: "Coloring for Kids", genre: "Learning", icon: "",                                href: "ColoringKids/index.html",        badge: "new",  emoji: "🖍️" },
        { name: "Balloon Pop Kids", genre: "Learning", icon: "",                                 href: "KidsBalloonPop/index.html",      badge: "new",  emoji: "🎈" },
        { name: "Math Quiz",        genre: "Learning", icon: "assets/Mathlearningquiz200.png",   href: "DailyMathEquator/index.html",    badge: "new",  emoji: "🔢" },
        { name: "Typing Speed",     genre: "Skill",    icon: "assets/typingtest200.png",         href: "TypingSpeedTest/index.html",     badge: "new",  emoji: "⌨️" },
      ]
    },
    {
      id: "reels",
      title: "Wisdom & Reels",
      more: false,
      tab: "games",
      items: [
        { name: "Knowledge Reels",  genre: "Facts",    icon: "",                                 href: "KnowledgeReels/index.html",      badge: "trend",emoji: "📱" },
        { name: "Life Skills",      genre: "Growth",   icon: "",                                 href: "LifeSkillsReels/index.html",     badge: "new",  emoji: "💡" },
        { name: "Football Reels",   genre: "Sports",   icon: "",                                 href: "FootballReels/index.html",       badge: "new",  emoji: "⚽" },
        { name: "Fitness Reels",    genre: "Health",   icon: "",                                 href: "FitnessReels/index.html",        badge: "new",  emoji: "💪" },
        { name: "Wellness Reels",   genre: "Mental",   icon: "",                                 href: "WellnessReels/index.html",       badge: "new",  emoji: "🧘" },
      ]
    },
  ]
};
