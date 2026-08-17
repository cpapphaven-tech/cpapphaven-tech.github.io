class Solitaire {
    constructor() {
        this.suits = ['hearts', 'diamonds', 'clubs', 'spades'];
        this.suitSymbols = { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' };
        this.ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        this.stock = [];
        this.waste = [];
        this.foundations = [[], [], [], []];
        this.tableau = [[], [], [], [], [], [], []];
        this.score = 0;
        this.moves = 0;
        this.time = 0;
        this.timerInterval = null;
        this.selectedCard = null;
        this.draggedCards = [];
        this.history = [];
        this.dragOffset = { x: 0, y: 0 };
        this.dragElement = null;

        this.init();
    }

    init() {
        document.addEventListener('mousemove', (e) => this.onMouseMove(e));
        document.addEventListener('mouseup', (e) => this.onMouseUp(e));
        document.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
        document.addEventListener('touchend', (e) => this.onTouchEnd(e));
        this.newGame();
    }

    createDeck() {
        const deck = [];
        for (const suit of this.suits) {
            for (let i = 0; i < this.ranks.length; i++) {
                deck.push({
                    suit,
                    rank: this.ranks[i],
                    value: i + 1,
                    color: (suit === 'hearts' || suit === 'diamonds') ? 'red' : 'black',
                    faceUp: false,
                    id: `${suit}-${this.ranks[i]}`
                });
            }
        }
        return this.shuffle(deck);
    }

    shuffle(array) {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    newGame() {
        this.stopTimer();
        this.score = 0;
        this.moves = 0;
        this.time = 0;
        this.history = [];
        this.selectedCard = null;

        const deck = this.createDeck();

        // Deal to tableau
        for (let i = 0; i < 7; i++) {
            this.tableau[i] = [];
            for (let j = 0; j <= i; j++) {
                const card = deck.pop();
                card.faceUp = (j === i);
                this.tableau[i].push(card);
            }
        }

        // Remaining cards to stock
        this.stock = deck.map(c => ({ ...c, faceUp: false }));
        this.waste = [];
        this.foundations = [[], [], [], []];

        this.updateDisplay();
        this.startTimer();
        this.showHint('Welcome! Click stock to draw, drag cards to move them.');
    }

    drawFromStock() {
        if (this.stock.length === 0) {
            if (this.waste.length > 0) {
                this.saveState();
                this.stock = this.waste.reverse().map(c => ({ ...c, faceUp: false }));
                this.waste = [];
                this.score = Math.max(0, this.score - 100);
                this.moves++;
                this.updateDisplay();
            }
            return;
        }

        this.saveState();
        const card = this.stock.pop();
        card.faceUp = true;
        this.waste.push(card);
        this.moves++;
        this.updateDisplay();
    }

    canMoveToTableau(card, pileIndex) {
        const pile = this.tableau[pileIndex];
        if (pile.length === 0) {
            return card.value === 13; // Only Kings on empty spaces
        }
        const topCard = pile[pile.length - 1];
        return topCard.faceUp && 
               topCard.color !== card.color && 
               topCard.value === card.value + 1;
    }

    canMoveToFoundation(card, foundationIndex) {
        const pile = this.foundations[foundationIndex];
        const expectedSuit = this.suits[foundationIndex];

        if (card.suit !== expectedSuit) return false;

        if (pile.length === 0) {
            return card.value === 1; // Ace
        }
        const topCard = pile[pile.length - 1];
        return topCard.value === card.value - 1;
    }

    findCardLocation(card) {
        // Check waste
        const wasteIndex = this.waste.findIndex(c => c.id === card.id);
        if (wasteIndex !== -1) {
            return { type: 'waste', index: wasteIndex, pile: this.waste };
        }

        // Check foundations
        for (let i = 0; i < 4; i++) {
            const idx = this.foundations[i].findIndex(c => c.id === card.id);
            if (idx !== -1) {
                return { type: 'foundation', index: idx, pileIndex: i, pile: this.foundations[i] };
            }
        }

        // Check tableau
        for (let i = 0; i < 7; i++) {
            const idx = this.tableau[i].findIndex(c => c.id === card.id);
            if (idx !== -1) {
                return { type: 'tableau', index: idx, pileIndex: i, pile: this.tableau[i] };
            }
        }

        return null;
    }

    moveCards(cards, fromLocation, toType, toIndex) {
        this.saveState();

        // Remove cards from source
        const fromPile = fromLocation.pile;
        const cardIndex = fromLocation.index;
        const movingCards = fromPile.splice(cardIndex);

        // Flip next card if in tableau
        if (fromLocation.type === 'tableau' && fromPile.length > 0) {
            const lastCard = fromPile[fromPile.length - 1];
            if (!lastCard.faceUp) {
                lastCard.faceUp = true;
                this.score += 5;
            }
        }

        // Add to destination
        if (toType === 'tableau') {
            this.tableau[toIndex].push(...movingCards);
        } else if (toType === 'foundation') {
            this.foundations[toIndex].push(movingCards[0]);
            this.score += 10;
        }

        this.moves++;
        this.updateDisplay();
        this.checkWin();
    }

    autoMove() {
        let moved = false;

        // Try to move from waste to foundation
        if (this.waste.length > 0) {
            const card = this.waste[this.waste.length - 1];
            for (let i = 0; i < 4; i++) {
                if (this.canMoveToFoundation(card, i)) {
                    this.moveCards([card], 
                        { type: 'waste', index: this.waste.length - 1, pile: this.waste },
                        'foundation', i);
                    moved = true;
                    break;
                }
            }
        }

        if (moved) {
            setTimeout(() => this.autoMove(), 300);
            return;
        }

        // Try to move from tableau to foundation
        for (let i = 0; i < 7; i++) {
            if (this.tableau[i].length === 0) continue;
            const card = this.tableau[i][this.tableau[i].length - 1];
            if (!card.faceUp) continue;

            for (let j = 0; j < 4; j++) {
                if (this.canMoveToFoundation(card, j)) {
                    this.moveCards([card],
                        { type: 'tableau', index: this.tableau[i].length - 1, pileIndex: i, pile: this.tableau[i] },
                        'foundation', j);
                    moved = true;
                    break;
                }
            }
            if (moved) break;
        }

        if (!moved) {
            this.showHint('No more auto-moves available');
        }
    }

    saveState() {
        if (this.history.length > 50) this.history.shift();
        this.history.push({
            stock: JSON.parse(JSON.stringify(this.stock)),
            waste: JSON.parse(JSON.stringify(this.waste)),
            foundations: JSON.parse(JSON.stringify(this.foundations)),
            tableau: JSON.parse(JSON.stringify(this.tableau)),
            score: this.score,
            moves: this.moves
        });
    }

    undo() {
        if (this.history.length === 0) {
            this.showHint('Nothing to undo');
            return;
        }
        const state = this.history.pop();
        this.stock = state.stock;
        this.waste = state.waste;
        this.foundations = state.foundations;
        this.tableau = state.tableau;
        this.score = state.score;
        this.moves = state.moves;
        this.selectedCard = null;
        this.updateDisplay();
    }

    checkWin() {
        const totalFoundationCards = this.foundations.reduce((sum, f) => sum + f.length, 0);
        if (totalFoundationCards === 52) {
            this.stopTimer();
            document.getElementById('winScore').textContent = this.score;
            document.getElementById('winMoves').textContent = this.moves;
            document.getElementById('winTime').textContent = this.formatTime(this.time);
            document.getElementById('winOverlay').classList.add('show');
            this.createConfetti();
        }
    }

    createConfetti() {
        const colors = ['#ffd700', '#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24'];
        for (let i = 0; i < 50; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.className = 'confetti';
                confetti.style.left = Math.random() * 100 + 'vw';
                confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
                confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
                document.body.appendChild(confetti);
                setTimeout(() => confetti.remove(), 4000);
            }, i * 50);
        }
    }

    startTimer() {
        this.stopTimer();
        this.timerInterval = setInterval(() => {
            this.time++;
            document.getElementById('time').textContent = this.formatTime(this.time);
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    showHint(text) {
        const hint = document.getElementById('hint');
        hint.textContent = text;
        hint.classList.add('show');
        setTimeout(() => hint.classList.remove('show'), 3000);
    }

    // Mouse/Touch Event Handlers
    onCardMouseDown(e, card, cardElement) {
        if (!card.faceUp) return;

        e.preventDefault();
        const isTouch = e.type === 'touchstart';
        const clientX = isTouch ? e.touches[0].clientX : e.clientX;
        const clientY = isTouch ? e.touches[0].clientY : e.clientY;

        const rect = cardElement.getBoundingClientRect();
        this.dragOffset = {
            x: clientX - rect.left,
            y: clientY - rect.top
        };

        const location = this.findCardLocation(card);
        const pile = location.pile;
        const cardIndex = location.index;

        // Get all cards to drag (from clicked card to end of pile)
        this.draggedCards = pile.slice(cardIndex);

        // Create drag element
        this.dragElement = document.createElement('div');
        this.dragElement.style.position = 'fixed';
        this.dragElement.style.zIndex = '2000';
        this.dragElement.style.pointerEvents = 'none';
        this.dragElement.style.left = (clientX - this.dragOffset.x) + 'px';
        this.dragElement.style.top = (clientY - this.dragOffset.y) + 'px';

        this.draggedCards.forEach((c, i) => {
            const el = this.createCardElement(c);
            el.style.position = 'absolute';
            el.style.top = (i * 25) + 'px';
            el.style.width = rect.width + 'px';
            el.style.height = rect.height + 'px';
            el.classList.add('dragging');
            this.dragElement.appendChild(el);
        });

        document.body.appendChild(this.dragElement);
        cardElement.classList.add('selected');

        // Highlight valid drop zones
        this.highlightDropZones(card);
    }

    onMouseMove(e) {
        if (!this.dragElement) return;
        this.dragElement.style.left = (e.clientX - this.dragOffset.x) + 'px';
        this.dragElement.style.top = (e.clientY - this.dragOffset.y) + 'px';
    }

    onTouchMove(e) {
        if (!this.dragElement) return;
        e.preventDefault();
        const touch = e.touches[0];
        this.dragElement.style.left = (touch.clientX - this.dragOffset.x) + 'px';
        this.dragElement.style.top = (touch.clientY - this.dragOffset.y) + 'px';
    }

    onMouseUp(e) {
        if (!this.dragElement) return;

        const dropTarget = this.findDropTarget(e.clientX, e.clientY);
        const card = this.draggedCards[0];
        const location = this.findCardLocation(card);

        if (dropTarget) {
            if (dropTarget.type === 'tableau' && this.canMoveToTableau(card, dropTarget.index)) {
                this.moveCards(this.draggedCards, location, 'tableau', dropTarget.index);
            } else if (dropTarget.type === 'foundation' && this.draggedCards.length === 1 && 
                       this.canMoveToFoundation(card, dropTarget.index)) {
                this.moveCards(this.draggedCards, location, 'foundation', dropTarget.index);
            }
        }

        this.cleanupDrag();
    }

    onTouchEnd(e) {
        if (!this.dragElement) return;

        const touch = e.changedTouches[0];
        const dropTarget = this.findDropTarget(touch.clientX, touch.clientY);
        const card = this.draggedCards[0];
        const location = this.findCardLocation(card);

        if (dropTarget) {
            if (dropTarget.type === 'tableau' && this.canMoveToTableau(card, dropTarget.index)) {
                this.moveCards(this.draggedCards, location, 'tableau', dropTarget.index);
            } else if (dropTarget.type === 'foundation' && this.draggedCards.length === 1 && 
                       this.canMoveToFoundation(card, dropTarget.index)) {
                this.moveCards(this.draggedCards, location, 'foundation', dropTarget.index);
            }
        }

        this.cleanupDrag();
    }

    findDropTarget(x, y) {
        // Check tableau
        for (let i = 0; i < 7; i++) {
            const el = document.getElementById(`tableau-${i}`);
            const rect = el.getBoundingClientRect();
            if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom + 100) {
                return { type: 'tableau', index: i };
            }
        }

        // Check foundations
        for (let i = 0; i < 4; i++) {
            const el = document.getElementById(`foundation-${i}`);
            const rect = el.getBoundingClientRect();
            if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
                return { type: 'foundation', index: i };
            }
        }

        return null;
    }

    highlightDropZones(card) {
        // Tableau
        for (let i = 0; i < 7; i++) {
            if (this.canMoveToTableau(card, i)) {
                document.getElementById(`tableau-${i}`).style.boxShadow = '0 0 0 3px rgba(255,215,0,0.5)';
            }
        }
        // Foundations
        if (this.draggedCards.length === 1) {
            for (let i = 0; i < 4; i++) {
                if (this.canMoveToFoundation(card, i)) {
                    document.getElementById(`foundation-${i}`).style.boxShadow = '0 0 0 3px rgba(255,215,0,0.5)';
                }
            }
        }
    }

    cleanupDrag() {
        if (this.dragElement) {
            this.dragElement.remove();
            this.dragElement = null;
        }
        this.draggedCards = [];
        document.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
        document.querySelectorAll('[style*="box-shadow"]').forEach(el => {
            el.style.boxShadow = '';
        });
    }

    // Display Methods
    updateDisplay() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('moves').textContent = this.moves;

        this.renderStock();
        this.renderWaste();
        this.renderFoundations();
        this.renderTableau();
    }

    renderStock() {
        const stockEl = document.getElementById('stock');
        stockEl.innerHTML = this.stock.length > 0 ? '<span>🔄</span>' : '<span style="opacity:0.3">🔄</span>';
        stockEl.style.cursor = this.stock.length > 0 ? 'pointer' : 'default';
    }

    renderWaste() {
        const wasteEl = document.getElementById('waste');
        wasteEl.innerHTML = '';
        if (this.waste.length > 0) {
            const card = this.waste[this.waste.length - 1];
            const cardEl = this.createCardElement(card);
            cardEl.style.position = 'relative';
            cardEl.addEventListener('mousedown', (e) => this.onCardMouseDown(e, card, cardEl));
            cardEl.addEventListener('touchstart', (e) => this.onCardMouseDown(e, card, cardEl), { passive: false });
            wasteEl.appendChild(cardEl);
        }
    }

    renderFoundations() {
        for (let i = 0; i < 4; i++) {
            const el = document.getElementById(`foundation-${i}`);
            el.innerHTML = `<span class="foundation-label">${this.suitSymbols[this.suits[i]]}</span>`;
            if (this.foundations[i].length > 0) {
                const card = this.foundations[i][this.foundations[i].length - 1];
                const cardEl = this.createCardElement(card);
                cardEl.style.position = 'relative';
                cardEl.addEventListener('mousedown', (e) => this.onCardMouseDown(e, card, cardEl));
                cardEl.addEventListener('touchstart', (e) => this.onCardMouseDown(e, card, cardEl), { passive: false });
                el.appendChild(cardEl);
            }
        }
    }

    renderTableau() {
        for (let i = 0; i < 7; i++) {
            const el = document.getElementById(`tableau-${i}`);
            el.innerHTML = '';

            if (this.tableau[i].length === 0) {
                const emptySlot = document.createElement('div');
                emptySlot.className = 'empty-slot';
                el.appendChild(emptySlot);
                continue;
            }

            this.tableau[i].forEach((card, j) => {
                const cardEl = this.createCardElement(card);
                cardEl.style.top = (j * 25) + 'px';
                cardEl.style.zIndex = j;

                if (card.faceUp) {
                    cardEl.addEventListener('mousedown', (e) => this.onCardMouseDown(e, card, cardEl));
                    cardEl.addEventListener('touchstart', (e) => this.onCardMouseDown(e, card, cardEl), { passive: false });
                }

                el.appendChild(cardEl);
            });
        }
    }

    createCardElement(card) {
        const div = document.createElement('div');
        div.className = `card ${card.color}`;
        div.dataset.id = card.id;

        if (!card.faceUp) {
            div.className += ' card-back';
            return div;
        }

        const symbol = this.suitSymbols[card.suit];
        div.innerHTML = `
            <div class="card-top">${card.rank}${symbol}</div>
            <div class="card-center">${symbol}</div>
            <div class="card-bottom">${card.rank}${symbol}</div>
        `;

        return div;
    }
}

const game = new Solitaire();
