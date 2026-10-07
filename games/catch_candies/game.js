const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
// Keep gameplay coordinates independent of the screen drawing resolution.
const boardWidth = canvas.width, boardHeight = canvas.height;
const muteBtn = document.getElementById('muteBtn');

// Game state
let state = 'START'; // START, PLAYING, GAMEOVER, WIN
let score = 0;
let highScore = GameStorage.number('catch_candies_highScore');
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
    audioCtx = GameAudio.context(); GameAudio.unlock();
}

function playSound(type) {
    GameAudio.effect(type);
}

function startBGM() {
    GameAudio.startMusic();
}

function stopBGM() {
    GameAudio.stopMusic();
}

function playBGMStep() {
    // Music is scheduled by shared/audio.js.
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
    const touchX = (e.touches[0].clientX - rect.left) * (boardWidth / rect.width);
    if (touchX < boardWidth / 2) {
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
    basket.x = boardWidth / 2 - basket.w / 2;
    lastSpawn = performance.now();
    startBGM();
}

function spawnItem(now) {
    const delay = Math.max(CONFIG.game.spawnIntervalMin, CONFIG.game.spawnIntervalMax - score * 20);
    if (now - lastSpawn > delay) {
        let isHighDifficulty = score >= 50;
        let adjustedItems = CONFIG.items.map(item => {
            let prob = item.probability;
            if (isHighDifficulty && item.type === 'bomb') prob = prob * 3;
            return { ...item, prob };
        });
        let totalProb = adjustedItems.reduce((sum, item) => sum + item.prob, 0);
        let r = Math.random() * totalProb;
        let selectedItem = adjustedItems[0];
        let cumulative = 0;
        for (let item of adjustedItems) {
            cumulative += item.prob;
            if (r <= cumulative) {
                selectedItem = item;
                break;
            }
        }
        
        items.push({
            x: Math.random() * (boardWidth - CONFIG.game.itemSize),
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
    if (GameShell.paused) return;
    if (state !== 'PLAYING') return;

    // Movement
    if (keys.ArrowLeft) basket.x -= CONFIG.game.basketSpeed;
    if (keys.ArrowRight) basket.x += CONFIG.game.basketSpeed;

    // Bounds
    if (basket.x < 0) basket.x = 0;
    if (basket.x + basket.w > boardWidth) basket.x = boardWidth - basket.w;

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
                    GameStorage.set('catch_candies_highScore', highScore);
                }
                if (score >= CONFIG.game.winScore) {
                    state = 'WIN';
                    stopBGM();
                    playSound('win');
                }
            }
            items.splice(i, 1);
            if (state !== 'PLAYING') return;
            continue;
        }

        // Missed item
        if (item.y > boardHeight) {
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
    ctx.clearRect(0, 0, boardWidth, boardHeight);

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
    ctx.fillStyle = '#ffffff';
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
    ctx.fillText(`最高: ${highScore}`, boardWidth - 15, 15);

    // Overlays
    if (state !== 'PLAYING') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, boardWidth, boardHeight);
        
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if (state === 'START') {
            ctx.fillStyle = '#f472b6';
            ctx.font = 'bold 27px sans-serif';
            ctx.fillText('🍬 糖果接接樂', boardWidth/2, boardHeight/2 - 30);
            ctx.fillStyle = '#fff';
            ctx.font = '20px "Fredoka", sans-serif';
            ctx.fillText('點擊或按空白鍵開始', boardWidth/2, boardHeight/2 + 30);
        } else if (state === 'GAMEOVER') {
            ctx.fillStyle = '#ef4444';
            ctx.font = 'bold 27px sans-serif';
            ctx.fillText('遊戲結束 💥', boardWidth/2, boardHeight/2 - 30);
            ctx.fillStyle = '#fff';
            ctx.font = '20px "Fredoka", sans-serif';
            ctx.fillText('點擊或按空白鍵重來', boardWidth/2, boardHeight/2 + 30);
        } else if (state === 'WIN') {
            ctx.fillStyle = '#10b981';
            ctx.font = 'bold 27px sans-serif';
            ctx.fillText('🎉 恭喜破關！', boardWidth/2, boardHeight/2 - 30);
            ctx.fillStyle = '#fff';
            ctx.font = '20px "Fredoka", sans-serif';
            ctx.fillText('點擊或按空白鍵再玩一次', boardWidth/2, boardHeight/2 + 30);
        }
    }
}

function loop(timestamp) {
    requestAnimationFrame(loop);
    const now=performance.now();if(!loop.last)loop.last=now;
    if(now-loop.last>=1000/60){loop.last=now-((now-loop.last)%(1000/60));update(now);draw();}
}

requestAnimationFrame(loop);

canvas.addEventListener("touchcancel",()=>{keys.ArrowLeft=false;keys.ArrowRight=false;});

GameShell.register({board:{width:boardWidth,height:boardHeight,draw:draw},status:()=>state,start:startGame,clear:()=>{keys.ArrowLeft=false;keys.ArrowRight=false;},resume:(elapsed)=>{lastSpawn+=elapsed;}});
