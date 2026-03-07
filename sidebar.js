(function () {
    // Detect if we are in a subfolder by checking the script's src attribute
    const scripts = document.getElementsByTagName('script');
    let prefix = '';
    for (let i = 0; i < scripts.length; i++) {
        const src = scripts[i].getAttribute('src');
        if (src && src.includes('sidebar.js') && src.startsWith('..')) {
            prefix = '../';
            break;
        }
    }

    // Auto-inject the required CSS for the sidebar if missing
    const cssId = 'pmg-sidebar-css';
    if (!document.getElementById(cssId)) {
        const link = document.createElement('link');
        link.id = cssId;
        link.rel = 'stylesheet';
        link.href = prefix + 'portal-style.css';
        document.head.appendChild(link);
    }

    const games = [
        { name: "⚽ Football 3D", path: "Football3D/index.html", icon: "img/football200.png", tip: "Sports" },
        { name: "🧬 Helix Bounce", path: "HelixBounce/index.html", icon: "img/helix200.png", tip: "Arcade" },
        { name: "🏓 Table Tennis", path: "TableTennis/index.html", icon: "assets/table_tennis_icon.png", tip: "Sports" },
        { name: "⚔️ Stickman Warriors", path: "StickDuel/index.html", icon: "assets/stckduels.png", tip: "Action" },
        { name: "🏏 Cricket Master", path: "CricketMaster/game.html", icon: "assets/cricket_master_icon.png", tip: "Sports" },
        { name: "⚽ Head Football", path: "HeadFootball/index.html", icon: "assets/head_football_icon.png", tip: "Sports" },
        { name: "🧊 Stack 3D", path: "Stack3D/index.html", icon: "img/stack200.png", tip: "Physics" },
        { name: "🧱 Brick Breaker", path: "BrickBreaker/game.html", icon: "img/brickbreaker200.png", tip: "Classic" },
        { name: "🔢 Merge Numbers", path: "MergeNumbers/game.html", icon: "img/mergenumber200.png", tip: "2248" },
        { name: "🧩 Block Puzzle Dash", path: "BlockPuzzle/game.html", icon: "img/blockpuzzle200.png", tip: "Puzzle" },
        { name: "🏀 Basketball 3D", path: "Basketball3D/index.html", icon: "assets/basketball3d.png", tip: "Sports" },
        { name: "🎨 Color Match 3D", path: "ColorMatch/index.html", icon: "assets/colormatch.png", tip: "Reaction" },
        { name: "🍣 Sushi Match 3D", path: "SushiMatch/index.html", icon: "assets/sushimatch3d.png", tip: "Memory" },
        { name: "🍔 Burger Stack 3D", path: "BurgerStack/index.html", icon: "assets/burgerstack.png", tip: "Physics" },
        { name: "🧪 Water Sort 3D", path: "WaterSort3D/index.html", icon: "assets/watersort3d.png", tip: "Puzzle" },
        { name: "🍾 Bottle Shoot 3D", path: "BottleShoot3D/index.html", icon: "img/bottle200.png", tip: "Sports" },
        { name: "🏑 Air Hockey 3D", path: "AirHockey3D/index.html", icon: "img/airhockey200.png", tip: "Sports" },
        { name: "🔢 Sudoku", path: "Sudoku/index.html", icon: "img/sudoku200.png", tip: "Logic" },
        { name: "🔡 Word Search", path: "WordSearch/index.html", icon: "img/wordsrarch200.png", tip: "Word" },
        { name: "🎲 Ludo Master", path: "Ludo/index.html", icon: "img/ludo200.png", tip: "Board" },
        { name: "🔵 Bubble Shooter", path: "BubbleShooter/index.html", icon: "assets/bubble_shooter.png", tip: "Arcade" },
    ];

    function createSidebar() {
        // Safety check: Page can explicitly skip the sidebar
        if (document.body && document.body.classList.contains('ignore-pmg-sidebar')) {
            console.log('🚫 PMG Sidebar: Suppressed by page class.');
            return;
        }

        if (document.getElementById('pmg-sidebar')) return;

        const container = document.createElement('div');
        container.className = 'sidebar-container';
        container.id = 'pmg-sidebar';

        // Sidebar Header
        const header = document.createElement('div');
        header.className = 'sidebar-header';
        header.innerHTML = `
            <a href="https://playmixgames.in/" class="sidebar-brand">Playmixgames.in</a>
            <h2>QUICK PLAY</h2>
        `;
        container.appendChild(header);

        // Search Bar
        const searchDiv = document.createElement('div');
        searchDiv.className = 'sidebar-search';
        searchDiv.innerHTML = `
            <input type="text" placeholder="Search games..." id="sidebar-search-input">
        `;
        container.appendChild(searchDiv);

        // Game List
        const listDiv = document.createElement('div');
        listDiv.className = 'sidebar-game-list';
        listDiv.id = 'sidebar-game-list';
        container.appendChild(listDiv);

        // Sidebar Nav
        const navDiv = document.createElement('div');
        navDiv.className = 'sidebar-nav';
        navDiv.innerHTML = `
            <a href="${prefix}index.html">Home</a>
            <a href="${prefix}privacy.html">Privacy</a>
            <a href="${prefix}contact.html">Support</a>
        `;
        container.appendChild(navDiv);

        // Toggle Button
        const toggleBtn = document.createElement('div');
        toggleBtn.className = 'sidebar-toggle';
        toggleBtn.id = 'sidebar-toggle';
        toggleBtn.innerHTML = '🎮';

        document.body.appendChild(container);
        document.body.appendChild(toggleBtn);

        // Open by Default Logic
        const isDesktop = window.innerWidth > 760;
        const startOpen = document.body && document.body.classList.contains('pmg-sidebar-start-open');
        const startClosed = document.body && document.body.classList.contains('pmg-sidebar-start-closed');

        if (startOpen || (isDesktop && !startClosed)) {
            container.classList.add('open');
            document.body.classList.add('pmg-sidebar-open');
            toggleBtn.style.left = '280px';
            toggleBtn.innerHTML = '←';

            // If we are starting open on mobile, ensure CSS doesn't hide us
            if (!isDesktop && startOpen) {
                document.body.classList.add('pmg-sidebar-mobile-enable');
            }
        }

        renderGames(games);

        // Interactions
        toggleBtn.onclick = () => {
            const isOpen = container.classList.toggle('open');
            document.body.classList.toggle('pmg-sidebar-open', isOpen);
            toggleBtn.style.left = isOpen ? '280px' : '0';
            toggleBtn.innerHTML = isOpen ? '←' : '🎮';
        };

        const searchInput = document.getElementById('sidebar-search-input');
        if (searchInput) {
            searchInput.oninput = (e) => {
                const term = e.target.value.toLowerCase();
                const filtered = games.filter(g => g.name.toLowerCase().includes(term));
                renderGames(filtered);
            };
        }
    }

    function renderGames(gameArray) {
        const list = document.getElementById('sidebar-game-list');
        if (!list) return;
        list.innerHTML = gameArray.map(g => `
            <a href="${prefix}${g.path}" class="mini-game-card">
                <img src="${prefix}${g.icon}" onerror="this.src='${prefix}assets/fallback.png'">
                <div class="info">
                    <h4>${g.name.split(' ').slice(1).join(' ') || g.name}</h4>
                </div>
            </a>
        `).join('');
    }

    // Initialize when DOM ready
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        createSidebar();
    } else {
        window.addEventListener('load', createSidebar);
    }
})();