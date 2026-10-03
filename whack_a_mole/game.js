const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
// Keep gameplay coordinates independent of the screen drawing resolution.
const boardWidth = canvas.width, boardHeight = canvas.height;
const muteBtn = document.getElementById('muteBtn');

let state = 'START';
let score = 0;
let highScore = GameStorage.number('whack_a_mole_highScore');
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
    audioCtx = GameAudio.context(); GameAudio.unlock();
}

function playSound(type) {
    GameAudio.effect(type);
}

// Holes setup
const holes = [];
const cols = CONFIG.game.cols;
const rows = CONFIG.game.rows;
const holeSize = CONFIG.game.holeSize;
const gap = CONFIG.game.gap;
const gridWidth = cols * holeSize + (cols - 1) * gap;
const gridHeight = rows * holeSize + (rows - 1) * gap;
const startX = (boardWidth - gridWidth) / 2;
const startY = (boardHeight - gridHeight) / 2 + 30;

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
let selectedHole = 4;
let lastTime = performance.now();

function startGame() {
    initAudio();
    state = 'PLAYING';
    score = 0;
    timeLeft = CONFIG.game.gameDuration;
    particles = [];
    selectedHole = 4;
    holes.forEach(h => { h.active = false; h.scale = 0; h.entity = null; });
    
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        if (GameShell.paused || state !== 'PLAYING') return;
        timeLeft--;
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            state = 'GAMEOVER';
            playSound('over');
            if (score > highScore) {
                highScore = score;
                GameStorage.set('whack_a_mole_highScore', highScore);
            }
        }
    }, 1000);
}

function handleInput(x, y) {
    if (GameShell.paused) return;
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
    handleInput((e.clientX - rect.left) * (boardWidth / rect.width), (e.clientY - rect.top) * (boardHeight / rect.height));
});

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    initAudio();
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    handleInput((touch.clientX - rect.left) * (boardWidth / rect.width), (touch.clientY - rect.top) * (boardHeight / rect.height));
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
    if (GameShell.paused) return;
    if (state !== 'PLAYING') return;

    // Random mole popping
    if (Math.random() < 1 - Math.pow(1 - (0.03 + (CONFIG.game.gameDuration - timeLeft)*0.001), dt / (1000/60))) {
        let inactiveHoles = holes.filter(h => !h.active);
        if (inactiveHoles.length > 0) {
            let h = inactiveHoles[Math.floor(Math.random() * inactiveHoles.length)];
            h.active = true;
            h.timer = CONFIG.game.baseShowTime - (CONFIG.game.gameDuration - timeLeft)*40;
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
    ctx.clearRect(0, 0, boardWidth, boardHeight);

    // Draw holes
    holes.forEach(h => {
        ctx.fillStyle = CONFIG.ui.holeColor;
        ctx.beginPath();
        ctx.ellipse(h.x, h.y, holeSize/2, holeSize/3, 0, 0, Math.PI * 2);
        ctx.fill();
        if (state === 'PLAYING' && h === holes[selectedHole]) {
            ctx.strokeStyle='#f8d66d';ctx.lineWidth=4;ctx.stroke();
        }
        
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
    ctx.fillText(`時間: ${timeLeft}`, boardWidth/2, 30);
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
            ctx.fillText('🐹 地鼠出來玩', boardWidth/2, boardHeight/2 - 30);
            ctx.fillStyle = '#fff';
            ctx.font = '20px "Fredoka", sans-serif';
            ctx.fillText('按空白鍵或點畫面開始', boardWidth/2, boardHeight/2 + 30);
        } else if (state === 'GAMEOVER') {
            ctx.fillStyle = '#ef4444';
            ctx.font = 'bold 27px sans-serif';
            ctx.fillText('時間到 ⏳', boardWidth/2, boardHeight/2 - 30);
            ctx.fillStyle = '#fff';
            ctx.font = '20px "Fredoka", sans-serif';
            ctx.fillText('按空白鍵或點畫面重玩', boardWidth/2, boardHeight/2 + 30);
        }
    }
}

function loop(timestamp) {
    let dt = Math.min(timestamp - lastTime, 50);
    lastTime = timestamp;
    update(dt);
    draw();
    requestAnimationFrame(loop);
}

requestAnimationFrame(loop);

window.addEventListener('keydown',event=>{
    if (state !== 'PLAYING') return;
    const row=Math.floor(selectedHole/cols),col=selectedHole%cols;
    if(event.code==='ArrowLeft')selectedHole=row*cols+(col+cols-1)%cols;
    if(event.code==='ArrowRight')selectedHole=row*cols+(col+1)%cols;
    if(event.code==='ArrowUp')selectedHole=((row+rows-1)%rows)*cols+col;
    if(event.code==='ArrowDown')selectedHole=((row+1)%rows)*cols+col;
    const direct=['KeyA','KeyS','KeyD'].indexOf(event.code);
    if(direct>=0)selectedHole=row*cols+direct;
    if((event.code==='Space'||direct>=0)&&!event.repeat){const h=holes[selectedHole];handleInput(h.x,h.y);}
});

GameShell.register({board:{width:boardWidth,height:boardHeight,draw:draw},status:()=>state,start:startGame,resume:()=>{lastTime=performance.now();}});
