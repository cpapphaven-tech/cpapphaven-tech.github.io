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
const swipeHint = document.getElementById('swipe-hint');

// Hide swipe hint on first scroll
container.addEventListener('scroll', () => {
    if (swipeHint) {
        swipeHint.style.opacity = '0';
        setTimeout(() => swipeHint.remove(), 500);
    }
}, { once: true });

// --- Audio Generation (Web Audio API) ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let bgOsc = null;
let bgGain = null;
let isAudioMuted = true;

function initAudio() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    bgGain = audioCtx.createGain();
    bgGain.gain.value = 0; // Starts silent
    bgGain.connect(audioCtx.destination);
    
    // 1. Generate White Noise Buffer
    const bufferSize = audioCtx.sampleRate * 2; 
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1; // Pure noise
    }

    const whiteNoise = audioCtx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // 2. Initial Softening Filter (turns harsh white noise into softer brown/pink noise)
    const lowpass1 = audioCtx.createBiquadFilter();
    lowpass1.type = 'lowpass';
    lowpass1.frequency.value = 1000;

    // 3. Dynamic Wave Filter (simulates the crest and wash of the wave)
    const waveFilter = audioCtx.createBiquadFilter();
    waveFilter.type = 'lowpass';
    waveFilter.frequency.value = 300; // Base deep underwater frequency

    // The LFO acts as the tide / wave rhythm 
    const lfo = audioCtx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.12; // roughly 8 seconds per wave crash

    // Modulate Frequency (creates the realistic 'whoosh' sound)
    const lfoFreqGain = audioCtx.createGain();
    lfoFreqGain.gain.value = 900; // Swings frequency up to 1200hz at peak crash
    lfo.connect(lfoFreqGain);
    lfoFreqGain.connect(waveFilter.frequency);

    // 4. Modulate Volume (loud when crashing, quiet when receding)
    const waveVol = audioCtx.createGain();
    waveVol.gain.value = 0.5; // Base volume
    
    const lfoVolGain = audioCtx.createGain();
    lfoVolGain.gain.value = 0.45; // Vol swings from 0.05 to 0.95
    lfo.connect(lfoVolGain);
    lfoVolGain.connect(waveVol.gain);

    // Connect the ocean chain
    whiteNoise.connect(lowpass1);
    lowpass1.connect(waveFilter);
    waveFilter.connect(waveVol);
    waveVol.connect(bgGain);

    whiteNoise.start();
    lfo.start();
}

function playLikeSound() {
    if (isAudioMuted || audioCtx.state === 'suspended') return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(800, audioCtx.currentTime);
    osc.frequency.setValueAtTime(1200, audioCtx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.35);
}

document.getElementById('audio-toggle').addEventListener('click', (e) => {
    isAudioMuted = !isAudioMuted;
    e.target.textContent = isAudioMuted ? '🔈' : '🔊';
    if (!isAudioMuted) {
        if(audioCtx.state === 'suspended') audioCtx.resume();
        bgGain.gain.setTargetAtTime(0.4, audioCtx.currentTime, 1);
    } else {
        bgGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.5);
    }
});


// --- DOM Generation ---
function createReelElement(data, index) {
    const el = document.createElement('div');
    el.className = `reel bg-style-${index % 4}`;
    el.dataset.index = index;

    // Randomize initial like/share exact counts
    let currentLikes = Math.floor(Math.random() * 5000) + 800;
    let currentShares = Math.floor(Math.random() * 500) + 50;

    el.innerHTML = `
        <div class="reel-content">
            <div class="topic-badge">${data.topic}</div>
            <h1 class="fact-title">"${data.hook}"</h1>
        </div>

        <div class="right-sidebar">
            <button class="action-btn like-btn">
                <div class="action-icon">🤍</div>
                <div class="action-count">${currentLikes.toLocaleString()}</div>
            </button>
            <button class="action-btn share-btn">
                <div class="action-icon">📤</div>
                <div class="action-count">${currentShares.toLocaleString()}</div>
            </button>
        </div>

        <div class="reel-caption">
            <div class="caption-user">
                Football Reels
            </div>
            <div class="caption-text">${data.caption}</div>
        </div>
    `;

    // Interactivity: Liking
    const likeBtn = el.querySelector('.like-btn');
    let liked = false;
    likeBtn.addEventListener('click', () => {
        if(!liked) {
            liked = true;
            currentLikes++;
            likeBtn.classList.add('liked');
            likeBtn.querySelector('.action-icon').textContent = '❤️';
            likeBtn.querySelector('.action-count').textContent = currentLikes.toLocaleString();
            playLikeSound();
            spawnFloatingHeart(likeBtn);
        }
    });

    // Interactivity: Sharing
    const shareBtn = el.querySelector('.share-btn');
    shareBtn.addEventListener('click', async () => {
        currentShares++;
        shareBtn.querySelector('.action-count').textContent = currentShares.toLocaleString();
        
        const shareData = {
            title: 'Playmix Football Reels',
            text: `Did you know this about football? "${data.hook}" - ${data.caption}`,
            url: window.location.href
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                console.log('User cancelled share');
            }
        } else {
            // Fallback for desktop/unsupported browsers
            navigator.clipboard.writeText(shareData.text + " " + shareData.url);
            alert("Fact copied to clipboard! You can now paste and share it.");
        }
    });

    // Interactivity: Expanding caption removed since text is fully displayed

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
                 
                 // Load more when nearing the bottom
                 if (currentIndex - idx <= 2) {
                     loadMoreReels(3);
                 }
            }
        }
    });
}, observerOptions);

// --- Initialization ---
function startApp() {
    initAudio();
    isAudioMuted = true; // Default to OFF
    document.getElementById('audio-toggle').textContent = '🔈';
    
    // Initialize Bank
    activeBank = shuffle([...BANK]);
    loadMoreReels(5); // Load initial batch
    
    // Remove the loader immediately instead of waiting for window.load
    const loader = document.getElementById('pmg-loader');
    if(loader) {
        loader.style.opacity = '0';
        loader.style.pointerEvents = 'none';
        setTimeout(() => loader.remove(), 500);
    }
}

startApp();

// Wait for deferred scripts (like ads.js) to finish parsing before triggering ads
document.addEventListener('DOMContentLoaded', () => {
    if (window.syncPMGLayout) {
       window.syncPMGLayout();
    } else if (window.prepSystem) {
       window.prepSystem();
    }
});
