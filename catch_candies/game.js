const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const muteBtn = document.getElementById('muteBtn');

// Game state
let state = 'START'; // START, PLAYING, GAMEOVER, WIN
let score = 0;
let highScore = localStorage.getItem('catch_candies_highScore') || 0;
let items = [];
let lastSpawn = 0;
let particles = [];

// Audio context
let audioCtx = null;
let isMuted = false;
let bgmInterval = null;
let bgmStep = 0;

muteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    isMuted = !isMuted;
    if (isMuted) {
        muteBtn.textContent = '🔇 音效: 關';
        muteBtn.style.background = 'rgba(255,255,255,0.1)';
        stopBGM();
    } else {
        muteBtn.textContent = '🔊 音效: 開';
        muteBtn.style.background = 'rgba(236, 72, 153, 0.3)';
        initAudio();
        if (state === 'PLAYING') startBGM();
    }
});

function initAudio() {
    if (isMuted) return;
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
}

function playSound(type) {
    if (isMuted || !audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    if (type === 'catch') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
    } else if (type === 'bomb') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
    } else if (type === 'over') {
        [300, 250, 200, 150].forEach((freq, i) => {
            const o = audioCtx.createOscillator();
            const g = audioCtx.createGain();
            o.type = 'triangle';
            o.frequency.value = freq;
            g.gain.setValueAtTime(0.1, audioCtx.currentTime + i * 0.15);
            g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + i * 0.15 + 0.1);
            o.connect(g);
            g.connect(audioCtx.destination);
            o.start(audioCtx.currentTime + i * 0.15);
            o.stop(audioCtx.currentTime + i * 0.15 + 0.1);
        });
    } else if (type === 'win') {
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
            const o = audioCtx.createOscillator();
            const g = audioCtx.createGain();
            o.type = 'square';
            o.frequency.value = freq;
            g.gain.setValueAtTime(0.1, audioCtx.currentTime + i * 0.15);
            g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + i * 0.15 + 0.1);
            o.connect(g);
            g.connect(audioCtx.destination);
            o.start(audioCtx.currentTime + i * 0.15);
            o.stop(audioCtx.currentTime + i * 0.15 + 0.1);
        });
    }
}

function startBGM() {
    if (isMuted) return;
    initAudio();
    stopBGM();
    bgmStep = 0;
    playBGMStep();
}

function stopBGM() {
    if (bgmInterval) {
        clearTimeout(bgmInterval);
        bgmInterval = null;
    }
}

function playBGMStep() {
    if (state !== 'PLAYING' || !audioCtx || isMuted) return;
    const melody = [392, 440, 493, 523, 493, 440]; // Simple happy scale
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = melody[bgmStep % melody.length];
    
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.2);
    
    bgmStep++;
    bgmInterval = setTimeout(playBGMStep, 300);
}

// Entities
const basket = {
    x: CONFIG.game.width / 2 - CONFIG.game.basketWidth / 2,
    y: CONFIG.game.height - CONFIG.game.basketYOffset,
    w: CONFIG.game.basketWidth,
    h: CONFIG.game.basketHeight,
    vx: 0
};

// Controls
const keys = { ArrowLeft: false, ArrowRight: false };

window.addEventListener('keydown', (e) => {
    if (e.code === 'ArrowLeft') keys.ArrowLeft = true;
    if (e.code === 'ArrowRight') keys.ArrowRight = true;
    if (e.code === 'Space') {
        e.preventDefault();
        if (state !== 'PLAYING') startGame();
    }
});
window.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowLeft') keys.ArrowLeft = false;
    if (e.code === 'ArrowRight') keys.ArrowRight = false;
});

// Touch controls
canvas.addEventListener('touchstart', handleTouch, { passive: false });
canvas.addEventListener('touchmove', handleTouch, { passive: false });
canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    keys.ArrowLeft = false;
    keys.ArrowRight = false;
}, { passive: false });

function handleTouch(e) {
    e.preventDefault();
    initAudio();
    if (state !== 'PLAYING') {
        startGame();
        return;
    }
    const rect = canvas.getBoundingClientRect();
    const touchX = (e.touches[0].clientX - rect.left) * (canvas.width / rect.width);
    if (touchX < canvas.width / 2) {
        keys.ArrowLeft = true;
        keys.ArrowRight = false;
    } else {
        keys.ArrowRight = true;
        keys.ArrowLeft = false;
    }
}

canvas.addEventListener('mousedown', () => {
    initAudio();
    if (state !== 'PLAYING') startGame();
});

function startGame() {
    initAudio();
    state = 'PLAYING';
    score = 0;
    items = [];
    particles = [];
    basket.x = canvas.width / 2 - basket.w / 2;
    lastSpawn = performance.now();
    startBGM();
}

function spawnItem(now) {
    const delay = Math.max(CONFIG.game.spawnIntervalMin, CONFIG.game.spawnIntervalMax - score * 20);
    if (now - lastSpawn > delay) {
        let r = Math.random();
        let selectedItem = CONFIG.items[0];
        let cumulative = 0;
        for (let item of CONFIG.items) {
            cumulative += item.probability;
            if (r <= cumulative) {
                selectedItem = item;
                break;
            }
        }
        
        items.push({
            x: Math.random() * (canvas.width - CONFIG.game.itemSize),
            y: -CONFIG.game.itemSize,
            ...selectedItem
        });
        lastSpawn = now;
    }
}

function createParticles(x, y, color) {
    for (let i = 0; i < 8; i++) {
        particles.push({
            x: x, y: y,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            life: 1,
            color: color
        });
    }
}

function update(now) {
    if (state !== 'PLAYING') return;

    // Movement
    if (keys.ArrowLeft) basket.x -= CONFIG.game.basketSpeed;
    if (keys.ArrowRight) basket.x += CONFIG.game.basketSpeed;

    // Bounds
    if (basket.x < 0) basket.x = 0;
    if (basket.x + basket.w > canvas.width) basket.x = canvas.width - basket.w;

    spawnItem(now);

    // Update items
    for (let i = items.length - 1; i >= 0; i--) {
        let item = items[i];
        item.y += Math.min(CONFIG.game.itemFallSpeed + score * 0.05, 8); // Speed scales up

        // Collision
        if (item.y + CONFIG.game.itemSize > basket.y &&
            item.y < basket.y + basket.h &&
            item.x + CONFIG.game.itemSize > basket.x &&
            item.x < basket.x + basket.w) {
            
            if (item.type === 'bomb') {
                score += item.score;
                playSound('bomb');
                createParticles(item.x + 20, item.y + 20, '#ef4444');
                if (score < 0) {
                    state = 'GAMEOVER';
                    stopBGM();
                    playSound('over');
                }
            } else {
                score += item.score;
                playSound('catch');
                createParticles(item.x + 20, item.y + 20, '#10b981');
                if (score > highScore) {
                    highScore = score;
                    localStorage.setItem('catch_candies_highScore', highScore);
                }
                if (score >= CONFIG.game.winScore) {
                    state = 'WIN';
                    stopBGM();
                    playSound('win');
                }
            }
            items.splice(i, 1);
            continue;
        }

        // Missed item
        if (item.y > canvas.height) {
            items.splice(i, 1);
        }
    }

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].x += particles[i].vx;
        particles[i].y += particles[i].vy;
        particles[i].life -= 0.05;
        if (particles[i].life <= 0) particles.splice(i, 1);
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw basket
    ctx.fillStyle = CONFIG.ui.primaryColor;
    ctx.shadowColor = CONFIG.ui.glowColor;
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.roundRect(basket.x, basket.y, basket.w, basket.h, 10);
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // Basket design
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(basket.x + 5, basket.y + 5, basket.w - 10, 5);

    // Draw items
    ctx.font = `${CONFIG.game.itemSize}px Arial`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    for (let item of items) {
        ctx.fillText(item.emoji, item.x, item.y);
    }

    // Draw particles
    for (let p of particles) {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    // UI
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 24px "Fredoka", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`分數: ${score}`, 15, 15);
    ctx.textAlign = 'right';
    ctx.fillText(`最高: ${highScore}`, canvas.width - 15, 15);

    // Overlays
    if (state !== 'PLAYING') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if (state === 'START') {
            ctx.fillStyle = '#f472b6';
            ctx.font = 'bold 40px "Fredoka", sans-serif';
            ctx.fillText('接接樂 🍬', canvas.width/2, canvas.height/2 - 30);
            ctx.fillStyle = '#fff';
            ctx.font = '20px "Fredoka", sans-serif';
            ctx.fillText('點擊或按空白鍵開始', canvas.width/2, canvas.height/2 + 30);
        } else if (state === 'GAMEOVER') {
            ctx.fillStyle = '#ef4444';
            ctx.font = 'bold 40px "Fredoka", sans-serif';
            ctx.fillText('遊戲結束 💥', canvas.width/2, canvas.height/2 - 30);
            ctx.fillStyle = '#fff';
            ctx.font = '20px "Fredoka", sans-serif';
            ctx.fillText('點擊或按空白鍵重來', canvas.width/2, canvas.height/2 + 30);
        } else if (state === 'WIN') {
            ctx.fillStyle = '#10b981';
            ctx.font = 'bold 40px "Fredoka", sans-serif';
            ctx.fillText('🎉 恭喜破關！', canvas.width/2, canvas.height/2 - 30);
            ctx.fillStyle = '#fff';
            ctx.font = '20px "Fredoka", sans-serif';
            ctx.fillText('點擊或按空白鍵再玩一次', canvas.width/2, canvas.height/2 + 30);
        }
    }
}

function loop(timestamp) {
    update(timestamp);
    draw();
    requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
