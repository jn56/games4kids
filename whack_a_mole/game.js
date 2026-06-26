const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const muteBtn = document.getElementById('muteBtn');

let state = 'START';
let score = 0;
let highScore = localStorage.getItem('whack_a_mole_highScore') || 0;
let timeLeft = CONFIG.game.gameDuration;
let timerInterval = null;

let audioCtx = null;
let isMuted = false;

muteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    isMuted = !isMuted;
    if (isMuted) {
        muteBtn.textContent = '🔇 音效: 關';
        muteBtn.style.background = 'rgba(255,255,255,0.1)';
    } else {
        muteBtn.textContent = '🔊 音效: 開';
        muteBtn.style.background = 'rgba(139, 92, 246, 0.3)';
        initAudio();
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
    
    if (type === 'hit') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
    } else if (type === 'bomb') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.4);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.4);
    } else if (type === 'over') {
        [400, 300, 200].forEach((freq, i) => {
            const o = audioCtx.createOscillator();
            const g = audioCtx.createGain();
            o.type = 'square';
            o.frequency.value = freq;
            g.gain.setValueAtTime(0.1, audioCtx.currentTime + i * 0.2);
            g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + i * 0.2 + 0.15);
            o.connect(g);
            g.connect(audioCtx.destination);
            o.start(audioCtx.currentTime + i * 0.2);
            o.stop(audioCtx.currentTime + i * 0.2 + 0.15);
        });
    }
}

// Holes setup
const holes = [];
const cols = CONFIG.game.cols;
const rows = CONFIG.game.rows;
const holeSize = CONFIG.game.holeSize;
const gap = CONFIG.game.gap;
const gridWidth = cols * holeSize + (cols - 1) * gap;
const gridHeight = rows * holeSize + (rows - 1) * gap;
const startX = (canvas.width - gridWidth) / 2;
const startY = (canvas.height - gridHeight) / 2 + 30;

for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
        holes.push({
            x: startX + c * (holeSize + gap) + holeSize/2,
            y: startY + r * (holeSize + gap) + holeSize/2,
            active: false,
            entity: null,
            timer: 0,
            scale: 0
        });
    }
}

let particles = [];
let lastTime = performance.now();

function startGame() {
    initAudio();
    state = 'PLAYING';
    score = 0;
    timeLeft = CONFIG.game.gameDuration;
    particles = [];
    holes.forEach(h => { h.active = false; h.scale = 0; });
    
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeLeft--;
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            state = 'GAMEOVER';
            playSound('over');
            if (score > highScore) {
                highScore = score;
                localStorage.setItem('whack_a_mole_highScore', highScore);
            }
        }
    }, 1000);
}

function handleInput(x, y) {
    if (state !== 'PLAYING') {
        startGame();
        return;
    }
    
    // Check hit
    for (let h of holes) {
        if (h.active) {
            const dx = x - h.x;
            const dy = y - h.y;
            if (Math.sqrt(dx*dx + dy*dy) < holeSize/2) {
                if (h.entity.type === 'bomb') {
                    score += h.entity.score;
                    playSound('bomb');
                    createParticles(h.x, h.y, '#ef4444');
                } else {
                    score += h.entity.score;
                    playSound('hit');
                    createParticles(h.x, h.y, '#fcd34d');
                }
                h.active = false;
                h.scale = 0;
                break;
            }
        }
    }
}

canvas.addEventListener('mousedown', (e) => {
    initAudio();
    const rect = canvas.getBoundingClientRect();
    handleInput((e.clientX - rect.left) * (canvas.width / rect.width), (e.clientY - rect.top) * (canvas.height / rect.height));
});

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    initAudio();
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    handleInput((touch.clientX - rect.left) * (canvas.width / rect.width), (touch.clientY - rect.top) * (canvas.height / rect.height));
}, { passive: false });

function createParticles(x, y, color) {
    for (let i = 0; i < 6; i++) {
        particles.push({
            x: x, y: y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            life: 1,
            color: color
        });
    }
}

function update(dt) {
    if (state !== 'PLAYING') return;

    // Random mole popping
    if (Math.random() < 0.03 + (CONFIG.game.gameDuration - timeLeft)*0.001) {
        let inactiveHoles = holes.filter(h => !h.active);
        if (inactiveHoles.length > 0) {
            let h = inactiveHoles[Math.floor(Math.random() * inactiveHoles.length)];
            h.active = true;
            h.timer = CONFIG.game.baseShowTime - (CONFIG.game.gameDuration - timeLeft)*15;
            if (h.timer < CONFIG.game.minWaitTime) h.timer = CONFIG.game.minWaitTime;
            
            let r = Math.random();
            let selected = CONFIG.entities[0];
            let cumulative = 0;
            for (let e of CONFIG.entities) {
                cumulative += e.probability;
                if (r <= cumulative) { selected = e; break; }
            }
            h.entity = selected;
        }
    }

    holes.forEach(h => {
        if (h.active) {
            h.timer -= dt;
            if (h.timer <= 0) {
                h.active = false;
            } else {
                h.scale = Math.min(1, h.scale + dt/100);
            }
        } else {
            h.scale = Math.max(0, h.scale - dt/100);
        }
    });

    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].x += particles[i].vx;
        particles[i].y += particles[i].vy;
        particles[i].life -= 0.05;
        if (particles[i].life <= 0) particles.splice(i, 1);
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw holes
    holes.forEach(h => {
        ctx.fillStyle = CONFIG.ui.holeColor;
        ctx.beginPath();
        ctx.ellipse(h.x, h.y, holeSize/2, holeSize/3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.beginPath();
        ctx.ellipse(h.x, h.y + holeSize/6, holeSize/2 * 0.8, holeSize/3 * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();

        if (h.scale > 0 && h.entity) {
            ctx.save();
            ctx.translate(h.x, h.y - h.scale * 20);
            ctx.scale(h.scale, h.scale);
            ctx.font = `${holeSize * 0.7}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(h.entity.emoji, 0, 0);
            ctx.restore();
        }
    });

    for (let p of particles) {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    // UI
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 24px "Fredoka", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`分數: ${score}`, 15, 30);
    ctx.textAlign = 'center';
    ctx.fillText(`時間: ${timeLeft}`, canvas.width/2, 30);
    ctx.textAlign = 'right';
    ctx.fillText(`最高: ${highScore}`, canvas.width - 15, 30);

    if (state !== 'PLAYING') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if (state === 'START') {
            ctx.fillStyle = CONFIG.ui.primaryColor;
            ctx.font = 'bold 40px "Fredoka", sans-serif';
            ctx.fillText('打地鼠 🐹', canvas.width/2, canvas.height/2 - 30);
            ctx.fillStyle = '#fff';
            ctx.font = '20px "Fredoka", sans-serif';
            ctx.fillText('點擊螢幕開始', canvas.width/2, canvas.height/2 + 30);
        } else if (state === 'GAMEOVER') {
            ctx.fillStyle = '#ef4444';
            ctx.font = 'bold 40px "Fredoka", sans-serif';
            ctx.fillText('時間到 ⏳', canvas.width/2, canvas.height/2 - 30);
            ctx.fillStyle = '#fff';
            ctx.font = '20px "Fredoka", sans-serif';
            ctx.fillText('點擊螢幕重來', canvas.width/2, canvas.height/2 + 30);
        }
    }
}

function loop(timestamp) {
    let dt = timestamp - lastTime;
    lastTime = timestamp;
    update(dt);
    draw();
    requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
