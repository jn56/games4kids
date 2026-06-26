const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const muteBtn = document.getElementById('muteBtn');

let state = 'START';
let score = 0;
let highScore = localStorage.getItem('flappy_bird_highScore') || 0;

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
        muteBtn.style.background = 'rgba(6, 182, 212, 0.3)';
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
    
    if (type === 'flap') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(500, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
    } else if (type === 'score') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
    } else if (type === 'over') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.4);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.4);
    }
}

let bird = { x: 80, y: 300, velocity: 0 };
let pipes = [];
let frames = 0;

function startGame() {
    initAudio();
    state = 'PLAYING';
    score = 0;
    bird = { x: 80, y: 300, velocity: 0 };
    pipes = [];
    frames = 0;
}

function flap() {
    if (state !== 'PLAYING') {
        startGame();
        return;
    }
    bird.velocity = CONFIG.game.jumpForce;
    playSound('flap');
}

window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
        initAudio();
        flap();
    }
});

canvas.addEventListener('mousedown', () => {
    initAudio();
    flap();
});

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    initAudio();
    flap();
}, { passive: false });

function update() {
    if (state !== 'PLAYING') return;

    bird.velocity += CONFIG.game.gravity;
    bird.y += bird.velocity;

    // Floor / Ceiling collision
    if (bird.y + CONFIG.game.birdSize/2 >= canvas.height || bird.y - CONFIG.game.birdSize/2 <= 0) {
        state = 'GAMEOVER';
        playSound('over');
    }

    // Spawn pipes
    if (frames % CONFIG.game.spawnInterval === 0) {
        let minHeight = 50;
        let maxHeight = canvas.height - CONFIG.game.pipeGap - minHeight;
        let topHeight = Math.floor(Math.random() * (maxHeight - minHeight + 1) + minHeight);
        
        pipes.push({
            x: canvas.width,
            topHeight: topHeight,
            passed: false
        });
    }

    for (let i = pipes.length - 1; i >= 0; i--) {
        let p = pipes[i];
        p.x -= CONFIG.game.pipeSpeed;

        // Collision check (forgiving bounding box)
        let bx = bird.x;
        let by = bird.y;
        let br = CONFIG.game.birdSize / 2 * 0.8; // forgiving radius

        if (bx + br > p.x && bx - br < p.x + CONFIG.game.pipeWidth) {
            if (by - br < p.topHeight || by + br > p.topHeight + CONFIG.game.pipeGap) {
                state = 'GAMEOVER';
                playSound('over');
            }
        }

        // Score
        if (p.x + CONFIG.game.pipeWidth < bird.x && !p.passed) {
            score++;
            p.passed = true;
            playSound('score');
            if (score > highScore) {
                highScore = score;
                localStorage.setItem('flappy_bird_highScore', highScore);
            }
        }

        // Remove offscreen
        if (p.x + CONFIG.game.pipeWidth < 0) {
            pipes.splice(i, 1);
        }
    }

    frames++;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw pipes (Clouds)
    for (let p of pipes) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
        ctx.shadowBlur = 10;
        
        // Top pipe
        ctx.beginPath();
        ctx.roundRect(p.x, 0, CONFIG.game.pipeWidth, p.topHeight, [0, 0, 15, 15]);
        ctx.fill();
        
        // Bottom pipe
        ctx.beginPath();
        ctx.roundRect(p.x, p.topHeight + CONFIG.game.pipeGap, CONFIG.game.pipeWidth, canvas.height, [15, 15, 0, 0]);
        ctx.fill();
        
        ctx.shadowBlur = 0;
    }

    // Draw Bird
    ctx.save();
    ctx.translate(bird.x, bird.y);
    // rotation based on velocity
    let rotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, (bird.velocity * 0.1)));
    ctx.rotate(rotation);
    
    ctx.font = `${CONFIG.game.birdSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🕊️', 0, 0);
    ctx.restore();

    // UI
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 24px "Fredoka", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`分數: ${score}`, 15, 30);
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
            ctx.fillText('飛天小鳥 🕊️', canvas.width/2, canvas.height/2 - 30);
            ctx.fillStyle = '#fff';
            ctx.font = '20px "Fredoka", sans-serif';
            ctx.fillText('點擊或空白鍵開始', canvas.width/2, canvas.height/2 + 30);
        } else if (state === 'GAMEOVER') {
            ctx.fillStyle = '#ef4444';
            ctx.font = 'bold 40px "Fredoka", sans-serif';
            ctx.fillText('遊戲結束 💥', canvas.width/2, canvas.height/2 - 30);
            ctx.fillStyle = '#fff';
            ctx.font = '20px "Fredoka", sans-serif';
            ctx.fillText('點擊或空白鍵重來', canvas.width/2, canvas.height/2 + 30);
        }
    }
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
