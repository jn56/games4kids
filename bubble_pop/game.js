const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
// Keep gameplay coordinates independent of the screen drawing resolution.
const boardWidth = canvas.width, boardHeight = canvas.height;
const muteBtn = document.getElementById('muteBtn');

let state = 'START';
let score = 0;
let highScore = GameStorage.number('bubble_pop_highScore');

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
        muteBtn.style.background = 'rgba(14, 165, 233, 0.3)';
        initAudio();
    }
});

function initAudio() {
    audioCtx = GameAudio.context(); GameAudio.unlock();
}

function playSound(type) {
    GameAudio.effect(type);
}

// Grid setup
const cols = CONFIG.game.cols;
const rows = CONFIG.game.rows;
const bSize = CONFIG.game.bubbleSize;
let grid = [];
let currentBubble = null;
let particles = [];
let aimAngle = -Math.PI / 2;
const aimKeys = {left:false,right:false};
window.addEventListener('keydown',event=>{
    if (event.code === 'ArrowLeft' || event.code === 'KeyA') aimKeys.left=true;
    if (event.code === 'ArrowRight' || event.code === 'KeyD') aimKeys.right=true;
    if (event.code === 'Space' && !event.repeat && currentBubble) shoot(currentBubble.x+Math.cos(aimAngle)*300,currentBubble.y+Math.sin(aimAngle)*300);
});
window.addEventListener('keyup',event=>{
    if (event.code === 'ArrowLeft' || event.code === 'KeyA') aimKeys.left=false;
    if (event.code === 'ArrowRight' || event.code === 'KeyD') aimKeys.right=false;
});

function getGridPos(c, r) {
    let x = c * bSize + bSize/2;
    if (r % 2 !== 0) x += bSize/2;
    let y = r * bSize * 0.85 + bSize/2;
    return {x, y};
}

function getRandomColor() {
    return CONFIG.colors[Math.floor(Math.random() * CONFIG.colors.length)];
}

function startGame() {
    initAudio();
    state = 'PLAYING';
    score = 0;
    grid = [];
    particles = [];
    aimAngle = -Math.PI / 2;
    
    // Initialize top rows
    for (let r = 0; r < rows; r++) {
        let row = [];
        let rCols = (r % 2 === 0) ? cols : cols - 1;
        for (let c = 0; c < rCols; c++) {
            row.push(getRandomColor());
        }
        grid.push(row);
    }
    
    spawnBubble();
}

function spawnBubble() {
    currentBubble = {
        x: boardWidth / 2,
        y: boardHeight - bSize/2,
        vx: 0,
        vy: 0,
        color: (() => { const colors=[...new Set(grid.flat().filter(Boolean))]; return colors.length ? colors[Math.floor(Math.random()*colors.length)] : getRandomColor(); })(),
        isShooting: false
    };
}

function shoot(tx, ty) {
    if (GameShell.paused) return;
    if (state !== 'PLAYING' || !currentBubble || currentBubble.isShooting) return;
    
    let dx = tx - currentBubble.x;
    let dy = ty - currentBubble.y;
    if (dy >= -8) return;
    dy = Math.min(dy, -Math.abs(dx) * 0.15 - 8);
    let dist = Math.sqrt(dx*dx + dy*dy);
    
    if (dist > 0) {
        currentBubble.vx = (dx / dist) * CONFIG.game.speed;
        currentBubble.vy = (dy / dist) * CONFIG.game.speed;
        currentBubble.isShooting = true;
        playSound('shoot');
    }
}

canvas.addEventListener('mousedown', (e) => {
    initAudio();
    if (state !== 'PLAYING') {
        startGame();
        return;
    }
    const rect = canvas.getBoundingClientRect();
    shoot((e.clientX - rect.left) * (boardWidth / rect.width), (e.clientY - rect.top) * (boardHeight / rect.height));
});

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    initAudio();
    if (state !== 'PLAYING') {
        startGame();
        return;
    }
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    shoot((touch.clientX - rect.left) * (boardWidth / rect.width), (touch.clientY - rect.top) * (boardHeight / rect.height));
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

function snapToGrid(bubble) {
    // Find closest grid position
    let bestDist = Infinity;
    let bestR = 0;
    let bestC = 0;
    
    // Check possible landing rows
    for (let r = 0; r < grid.length + 1; r++) {
        let rCols = (r % 2 === 0) ? cols : cols - 1;
        for (let c = 0; c < rCols; c++) {
            if (grid[r] && grid[r][c]) continue; // occupied
            
            let pos = getGridPos(c, r);
            let dist = Math.sqrt((bubble.x - pos.x)**2 + (bubble.y - pos.y)**2);
            if (dist < bestDist) {
                bestDist = dist;
                bestR = r;
                bestC = c;
            }
        }
    }
    
    while (grid.length <= bestR) grid.push([]);
    grid[bestR][bestC] = bubble.color;
    
    // Simple matching (Flood fill)
    let toRemove = [];
    let visited = new Set();
    
    function getNeighbors(r, c) {
        let n = [];
        let isEven = (r % 2 === 0);
        let dirs = [
            [-1, 0], [1, 0], [0, -1], [0, 1],
            [-1, isEven ? -1 : 1], [1, isEven ? -1 : 1]
        ];
        for (let d of dirs) {
            let nr = r + d[0];
            let nc = c + d[1];
            if (grid[nr] && grid[nr][nc]) n.push({r: nr, c: nc});
        }
        return n;
    }
    
    function flood(r, c, color) {
        let key = r + ',' + c;
        if (visited.has(key)) return;
        visited.add(key);
        toRemove.push({r, c});
        
        let neighbors = getNeighbors(r, c);
        for (let nb of neighbors) {
            if (grid[nb.r][nb.c] === color) flood(nb.r, nb.c, color);
        }
    }
    
    flood(bestR, bestC, bubble.color);
    
    if (toRemove.length >= 3) {
        score += toRemove.length * 10;
        playSound('pop');
        for (let p of toRemove) {
            let pos = getGridPos(p.c, p.r);
            createParticles(pos.x, pos.y, grid[p.r][p.c]);
            grid[p.r][p.c] = null;
        }
        
        if (score > highScore) {
            highScore = score;
            GameStorage.set('bubble_pop_highScore', highScore);
        }
        
        if (score >= CONFIG.game.winScore) {
            state = 'WIN';
            playSound('win');
        }
    }
    
    // Check game over
    if (grid.some((row,r)=>r>=10 && row.some(Boolean)) && state === 'PLAYING') {
        state = 'GAMEOVER';
        playSound('over');
    }
    
    if (state === 'PLAYING' && !grid.some(row => row.some(Boolean))) {
        state = 'WIN';
        playSound('win');
    }
    spawnBubble();
}

function update() {
    if (GameShell.paused) return;
    if (state !== 'PLAYING') return;
    aimAngle = Math.max(-Math.PI+0.18,Math.min(-0.18,aimAngle+(Number(aimKeys.right)-Number(aimKeys.left))*0.025));
    
    if (currentBubble && currentBubble.isShooting) {
        currentBubble.x += currentBubble.vx;
        currentBubble.y += currentBubble.vy;
        
        // Bounce off walls
        if (currentBubble.x < bSize/2) {
            currentBubble.x = bSize/2;
            currentBubble.vx *= -1;
        } else if (currentBubble.x > boardWidth - bSize/2) {
            currentBubble.x = boardWidth - bSize/2;
            currentBubble.vx *= -1;
        }
        
        // Check collision with top
        if (currentBubble.y <= bSize/2) {
            snapToGrid(currentBubble);
            return;
        }
        
        // Check collision with other bubbles
        let hit = false;
        for (let r = 0; r < grid.length; r++) {
            for (let c = 0; c < grid[r].length; c++) {
                if (grid[r][c]) {
                    let pos = getGridPos(c, r);
                    let dist = Math.sqrt((currentBubble.x - pos.x)**2 + (currentBubble.y - pos.y)**2);
                    if (dist < bSize * 0.9) {
                        hit = true;
                        break;
                    }
                }
            }
            if (hit) break;
        }
        
        if (hit) {
            snapToGrid(currentBubble);
        }
    }

    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].x += particles[i].vx;
        particles[i].y += particles[i].vy;
        particles[i].life -= 0.05;
        if (particles[i].life <= 0) particles.splice(i, 1);
    }
}

function draw() {
    ctx.clearRect(0, 0, boardWidth, boardHeight);

    // Draw grid bubbles
    ctx.font = `${bSize * 0.8}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    for (let r = 0; r < grid.length; r++) {
        for (let c = 0; c < grid[r].length; c++) {
            if (grid[r][c]) {
                let pos = getGridPos(c, r);
                ctx.fillText(grid[r][c], pos.x, pos.y);
            }
        }
    }
    
    // Draw current bubble
    if (currentBubble) {
        if (state === 'PLAYING' && !currentBubble.isShooting) {
            ctx.save();ctx.strokeStyle='#eaf8ff';ctx.lineWidth=3;ctx.setLineDash([5,7]);
            ctx.beginPath();ctx.moveTo(currentBubble.x,currentBubble.y);
            ctx.lineTo(currentBubble.x+Math.cos(aimAngle)*120,currentBubble.y+Math.sin(aimAngle)*120);ctx.stroke();ctx.restore();
        }
        ctx.fillText(currentBubble.color, currentBubble.x, currentBubble.y);
    }

    // Draw particles
    for (let p of particles) {
        ctx.fillStyle = '#fff';
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
        ctx.fillText(p.color, p.x, p.y); // Mini emojis for particles looks funny
    }
    ctx.globalAlpha = 1.0;

    // UI
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px "Fredoka", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`分數: ${score}`, 10, boardHeight - 15);
    ctx.textAlign = 'right';
    ctx.fillText(`最高: ${highScore}`, boardWidth - 10, boardHeight - 15);

    if (state !== 'PLAYING') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, boardWidth, boardHeight);
        
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if (state === 'START') {
            ctx.fillStyle = CONFIG.ui.primaryColor;
            ctx.font = 'bold 27px sans-serif';
            ctx.fillText('🫧 彩虹泡泡發射站', boardWidth/2, boardHeight/2 - 30);
            ctx.fillStyle = '#fff';
            ctx.font = '18px "Fredoka", sans-serif';
            ctx.fillText('按空白鍵或點畫面開始', boardWidth/2, boardHeight/2 + 30);
        } else if (state === 'GAMEOVER') {
            ctx.fillStyle = '#ef4444';
            ctx.font = 'bold 27px sans-serif';
            ctx.fillText('遊戲結束 💥', boardWidth/2, boardHeight/2 - 30);
            ctx.fillStyle = '#fff';
            ctx.font = '18px "Fredoka", sans-serif';
            ctx.fillText('按空白鍵或點畫面重玩', boardWidth/2, boardHeight/2 + 30);
        } else if (state === 'WIN') {
            ctx.fillStyle = '#10b981';
            ctx.font = 'bold 27px sans-serif';
            ctx.fillText('🎉 恭喜破關！', boardWidth/2, boardHeight/2 - 30);
            ctx.fillStyle = '#fff';
            ctx.font = '18px "Fredoka", sans-serif';
            ctx.fillText('空白鍵再玩一次', boardWidth/2, boardHeight/2 + 30);
        }
    }
}

function loop() {
    requestAnimationFrame(loop);
    const now=performance.now();if(!loop.last)loop.last=now;
    if(now-loop.last>=1000/60){loop.last=now-((now-loop.last)%(1000/60));update(now);draw();}
}

requestAnimationFrame(loop);

GameShell.register({board:{width:boardWidth,height:boardHeight,draw:draw},status:()=>state,start:startGame,clear:()=>{aimKeys.left=false;aimKeys.right=false;}});
