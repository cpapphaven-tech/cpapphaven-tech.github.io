// ==========================================================================
// Knowledge Reels (Playmix Shorts) Main Controller
// ==========================================================================

// Shuffle array
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

let activeBank = [];
let currentIndex = 0;
const container = document.getElementById('reels-container');

// --- Audio Generation (Web Audio API) ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let bgOsc = null;
let bgGain = null;
let isAudioMuted = true;

function initAudio() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    // Ambient drone generator (Soft Atmospheric sound)
    bgOsc = audioCtx.createOscillator();
    bgGain = audioCtx.createGain();
    
    // Filter to make it soft / lo-fi
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 300;
    
    // Slow evolving LFO for the frequency
    const lfo = audioCtx.createOscillator();
    const lfoGain = audioCtx.createGain();
    lfo.type = 'sine';
    lfo.frequency.value = 0.05; // extremely slow
    lfoGain.value = 10;
    
    lfo.connect(lfoGain);
    lfoGain.connect(bgOsc.frequency);
    
    bgOsc.type = 'sine';
    bgOsc.frequency.value = 100; // Deep drone
    bgGain.gain.value = 0; // Starts silent
    
    bgOsc.connect(filter);
    filter.connect(bgGain);
    bgGain.connect(audioCtx.destination);
    
    bgOsc.start();
    lfo.start();
}

function playSwishSound() {
    if (isAudioMuted || audioCtx.state === 'suspended') return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.3);
    
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.35);
}

function playLikeSound() {
    if (isAudioMuted || audioCtx.state === 'suspended') return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, audioCtx.currentTime);
    osc.frequency.setValueAtTime(600, audioCtx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.35);
}

document.getElementById('audio-toggle').addEventListener('click', (e) => {
    isAudioMuted = !isAudioMuted;
    e.target.textContent = isAudioMuted ? '🔈' : '🔊';
    if (!isAudioMuted) {
        if(audioCtx.state === 'suspended') audioCtx.resume();
        bgGain.gain.setTargetAtTime(0.15, audioCtx.currentTime, 1);
    } else {
        bgGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.5);
    }
});


// --- DOM Generation ---
function createReelElement(data, index) {
    const el = document.createElement('div');
    el.className = `reel bg-style-${index % 4}`;
    el.dataset.index = index;

    // Randomize initial like count
    const initialLikes = Math.floor(Math.random() * 50) + 12;
    const initialShares = Math.floor(Math.random() * 10) + 1;

    el.innerHTML = `
        <div class="reel-content">
            <div class="topic-badge">${data.topic}</div>
            <h1 class="fact-title">"${data.hook}"</h1>
        </div>

        <div class="right-sidebar">
            <button class="action-btn like-btn">
                <div class="action-icon">🤍</div>
                <div class="action-count">${initialLikes}k</div>
            </button>
            <button class="action-btn share-btn">
                <div class="action-icon">📤</div>
                <div class="action-count">${initialShares}k</div>
            </button>
        </div>

        <div class="reel-caption">
            <div class="caption-user">
                <img src="../assets/grammarquiz.png" alt="Playmix Profile" onerror="this.src='https://via.placeholder.com/24'">
                Playmix Facts
            </div>
            <div class="caption-text">${data.caption} <strong>...more</strong></div>
        </div>
    `;

    // Interactivity
    const likeBtn = el.querySelector('.like-btn');
    let liked = false;
    likeBtn.addEventListener('click', () => {
        if(!liked) {
            liked = true;
            likeBtn.classList.add('liked');
            likeBtn.querySelector('.action-icon').textContent = '❤️';
            likeBtn.querySelector('.action-count').textContent = (initialLikes + 1) + 'k';
            playLikeSound();
            spawnFloatingHeart(likeBtn);
        }
    });

    const captionText = el.querySelector('.caption-text');
    captionText.addEventListener('click', () => {
        captionText.classList.toggle('expanded');
    });

    return el;
}

function spawnFloatingHeart(btnRef) {
    const rect = btnRef.getBoundingClientRect();
    const heart = document.createElement('div');
    heart.className = 'floating-heart';
    heart.textContent = '❤️';
    heart.style.left = (rect.left - 10) + 'px';
    heart.style.top = rect.top + 'px';
    document.body.appendChild(heart);
    setTimeout(() => heart.remove(), 1000);
}

// --- Infinite Scroll Logic ---
function loadMoreReels(count = 5) {
    // If we run out of unique facts in the array, shuffle and loop
    if (currentIndex >= activeBank.length) {
        activeBank = activeBank.concat(shuffle([...BANK]));
    }

    for (let i = 0; i < count; i++) {
        if (currentIndex < activeBank.length) {
            const data = activeBank[currentIndex];
            const reelEl = createReelElement(data, currentIndex);
            container.appendChild(reelEl);
            observer.observe(reelEl);
            currentIndex++;
        }
    }
}

// Observer to handle audio triggers and endless injection
const observerOptions = {
    root: container,
    threshold: 0.6 // triggers when 60% of the reel is visible
};

let currentVisibleIndex = -1;
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const idx = parseInt(entry.target.dataset.index);
            if (idx !== currentVisibleIndex) {
                 // Clean up previous expanded texts if desired
                 document.querySelectorAll('.caption-text.expanded').forEach(e => e.classList.remove('expanded'));
                 currentVisibleIndex = idx;
                 
                 if (idx > 0) playSwishSound();

                 // Load more when nearing the bottom
                 if (currentIndex - idx <= 2) {
                     loadMoreReels(3);
                 }
            }
        }
    });
}, observerOptions);

// --- Initialization ---
document.getElementById('begin-btn').addEventListener('click', () => {
    initAudio();
    isAudioMuted = false;
    document.getElementById('audio-toggle').textContent = '🔊';
    bgGain.gain.setTargetAtTime(0.15, audioCtx.currentTime, 1);
    
    document.getElementById('start-screen').remove();
    
    // Initialize Bank
    activeBank = shuffle([...BANK]);
    loadMoreReels(5); // Load initial batch
});

// Remove loader when page is ready
window.addEventListener('load', () => {
    const loader = document.getElementById('pmg-loader');
    if(loader) {
        loader.style.opacity = '0';
        loader.style.pointerEvents = 'none';
        setTimeout(() => loader.remove(), 500);
    }
});
