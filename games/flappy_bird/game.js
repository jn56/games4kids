const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
// Keep gameplay coordinates independent of the screen drawing resolution.
const boardWidth = canvas.width, boardHeight = canvas.height;
const muteBtn = document.getElementById('muteBtn');

let state = 'START';
let score = 0;
let highScore = GameStorage.number('flappy_bird_highScore');

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
    audioCtx = GameAudio.context(); GameAudio.unlock();
}

function playSound(type) {
    GameAudio.effect(type);
}

let bird = { x: 80, y: 300, velocity: 0 };
let pipes = [];
let frames = 0;
let spawnTimer = 0;

function startGame() {
    initAudio();
    state = 'PLAYING';
    score = 0;
    bird = { x: 80, y: 300, velocity: 0 };
    pipes = [];
    frames = 0;
    spawnTimer = 0;
}

function flap() {
    if (GameShell.paused) return;
    if (state !== 'PLAYING') {
        startGame();
        bird.velocity = CONFIG.game.jumpForce;
        playSound('flap');
        return;
    }
    bird.velocity = CONFIG.game.jumpForce;
    playSound('flap');
}

window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        if (!e.repeat) {
            initAudio();
            flap();
        }
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
    if (GameShell.paused) return;
    if (state !== 'PLAYING') return;

    bird.velocity += CONFIG.game.gravity;
    bird.y += bird.velocity;

    // Floor / Ceiling collision
    if (bird.y + CONFIG.game.birdSize/2 >= boardHeight || bird.y - CONFIG.game.birdSize/2 <= 0) {
        state = 'GAMEOVER';
        playSound('over');
        return;
    }

    let speedMult = 1 + Math.floor(frames / 600) * 0.1;

    // Spawn pipes
    spawnTimer += speedMult;
    if (spawnTimer >= CONFIG.game.spawnInterval) {
        spawnTimer -= CONFIG.game.spawnInterval;
        let minHeight = 50;
        let maxHeight = boardHeight - CONFIG.game.pipeGap - minHeight;
        let topHeight = Math.floor(Math.random() * (maxHeight - minHeight + 1) + minHeight);
        
        pipes.push({
            x: boardWidth,
            topHeight: topHeight,
            passed: false
        });
    }

    for (let i = pipes.length - 1; i >= 0; i--) {
        let p = pipes[i];
        p.x -= CONFIG.game.pipeSpeed * speedMult;

        // Collision check (forgiving bounding box)
        let bx = bird.x;
        let by = bird.y;
        let br = CONFIG.game.birdSize / 2 * 0.8; // forgiving radius

        if (bx + br > p.x && bx - br < p.x + CONFIG.game.pipeWidth) {
            if (by - br < p.topHeight || by + br > p.topHeight + CONFIG.game.pipeGap) {
                state = 'GAMEOVER';
                playSound('over');
                return;
            }
        }

        // Score
        if (p.x + CONFIG.game.pipeWidth < bird.x && !p.passed) {
            score++;
            p.passed = true;
            playSound('score');
            if (score > highScore) {
                highScore = score;
                GameStorage.set('flappy_bird_highScore', highScore);
            }
            if (score >= 100) {
                state = 'WIN';
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
    ctx.clearRect(0, 0, boardWidth, boardHeight);

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
        ctx.roundRect(p.x, p.topHeight + CONFIG.game.pipeGap, CONFIG.game.pipeWidth, boardHeight, [15, 15, 0, 0]);
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
    ctx.fillText(`最高: ${highScore}`, boardWidth - 15, 30);

    if (state !== 'PLAYING') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, boardWidth, boardHeight);
        
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if (state === 'START') {
            ctx.fillStyle = CONFIG.ui.primaryColor;
            ctx.font = 'bold 27px sans-serif';
            ctx.fillText('🐦 小鳥的雲朵旅行', boardWidth/2, boardHeight/2 - 30);
            ctx.fillStyle = '#fff';
            ctx.font = '20px "Fredoka", sans-serif';
            ctx.fillText('點擊或空白鍵開始', boardWidth/2, boardHeight/2 + 30);
        } else if (state === 'GAMEOVER') {
            ctx.fillStyle = '#ef4444';
            ctx.font = 'bold 27px sans-serif';
            ctx.fillText('遊戲結束 💥', boardWidth/2, boardHeight/2 - 30);
            ctx.fillStyle = '#fff';
            ctx.font = '20px "Fredoka", sans-serif';
            ctx.fillText('點擊或空白鍵重來', boardWidth/2, boardHeight/2 + 30);
        } else if (state === 'WIN') {
            ctx.fillStyle = '#10b981';
            ctx.font = 'bold 27px sans-serif';
            ctx.fillText('恭喜過關 🎉', boardWidth/2, boardHeight/2 - 30);
            ctx.fillStyle = '#fff';
            ctx.font = '20px "Fredoka", sans-serif';
            ctx.fillText('點擊或空白鍵再玩一次', boardWidth/2, boardHeight/2 + 30);
        }
    }
}

let lastTime = 0;
const frameInterval = 1000 / 60; // 60 FPS

function loop(timestamp) {
    requestAnimationFrame(loop);
    if (!lastTime) lastTime = timestamp;
    const elapsed = timestamp - lastTime;
    
    if (elapsed >= frameInterval) {
        lastTime = timestamp - (elapsed % frameInterval);
        update();
        draw();
    }
}

requestAnimationFrame(loop);

GameShell.register({board:{width:boardWidth,height:boardHeight,draw:draw},status:()=>state,start:flap,resume:()=>{lastTime=0;}});
