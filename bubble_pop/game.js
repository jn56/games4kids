const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const muteBtn = document.getElementById('muteBtn');

let state = 'START';
let score = 0;
let highScore = localStorage.getItem('bubble_pop_highScore') || 0;

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
    if (isMuted) return;
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
}

function playSound(type) {
    if (isMuted || !audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    if (type === 'shoot') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
    } else if (type === 'pop') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
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
    } else if (type === 'over') {
        [300, 250, 200, 150].forEach((freq, i) => {
            const o = audioCtx.createOscillator();
            const g = audioCtx.createGain();
            o.type = 'sawtooth';
            o.frequency.value = freq;
            g.gain.setValueAtTime(0.1, audioCtx.currentTime + i * 0.15);
            g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + i * 0.15 + 0.15);
            o.connect(g);
            g.connect(audioCtx.destination);
            o.start(audioCtx.currentTime + i * 0.15);
            o.stop(audioCtx.currentTime + i * 0.15 + 0.15);
        });
    }
}

// Grid setup
const cols = CONFIG.game.cols;
const rows = CONFIG.game.rows;
const bSize = CONFIG.game.bubbleSize;
let grid = [];
let currentBubble = null;
let particles = [];

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
        x: canvas.width / 2,
        y: canvas.height - bSize/2,
        vx: 0,
        vy: 0,
        color: getRandomColor(),
        isShooting: false
    };
}

function shoot(tx, ty) {
    if (state !== 'PLAYING' || !currentBubble || currentBubble.isShooting) return;
    
    let dx = tx - currentBubble.x;
    let dy = ty - currentBubble.y;
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
    shoot((e.clientX - rect.left) * (canvas.width / rect.width), (e.clientY - rect.top) * (canvas.height / rect.height));
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
    shoot((touch.clientX - rect.left) * (canvas.width / rect.width), (touch.clientY - rect.top) * (canvas.height / rect.height));
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
            localStorage.setItem('bubble_pop_highScore', highScore);
        }
        
        if (score >= CONFIG.game.winScore) {
            state = 'WIN';
            playSound('win');
        }
    }
    
    // Check game over
    if (bestR >= 10 && state === 'PLAYING') {
        state = 'GAMEOVER';
        playSound('over');
    }
    
    spawnBubble();
}

function update() {
    if (state !== 'PLAYING') return;
    
    if (currentBubble && currentBubble.isShooting) {
        currentBubble.x += currentBubble.vx;
        currentBubble.y += currentBubble.vy;
        
        // Bounce off walls
        if (currentBubble.x < bSize/2) {
            currentBubble.x = bSize/2;
            currentBubble.vx *= -1;
        } else if (currentBubble.x > canvas.width - bSize/2) {
            currentBubble.x = canvas.width - bSize/2;
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
    ctx.clearRect(0, 0, canvas.width, canvas.height);

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
    ctx.fillText(`分數: ${score}`, 10, canvas.height - 15);
    ctx.textAlign = 'right';
    ctx.fillText(`最高: ${highScore}`, canvas.width - 10, canvas.height - 15);

    if (state !== 'PLAYING') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if (state === 'START') {
            ctx.fillStyle = CONFIG.ui.primaryColor;
            ctx.font = 'bold 36px "Fredoka", sans-serif';
            ctx.fillText('泡泡龍 🎈', canvas.width/2, canvas.height/2 - 30);
            ctx.fillStyle = '#fff';
            ctx.font = '18px "Fredoka", sans-serif';
            ctx.fillText('點擊螢幕開始', canvas.width/2, canvas.height/2 + 30);
        } else if (state === 'GAMEOVER') {
            ctx.fillStyle = '#ef4444';
            ctx.font = 'bold 36px "Fredoka", sans-serif';
            ctx.fillText('遊戲結束 💥', canvas.width/2, canvas.height/2 - 30);
            ctx.fillStyle = '#fff';
            ctx.font = '18px "Fredoka", sans-serif';
            ctx.fillText('點擊螢幕重來', canvas.width/2, canvas.height/2 + 30);
        } else if (state === 'WIN') {
            ctx.fillStyle = '#10b981';
            ctx.font = 'bold 36px "Fredoka", sans-serif';
            ctx.fillText('🎉 恭喜破關！', canvas.width/2, canvas.height/2 - 30);
            ctx.fillStyle = '#fff';
            ctx.font = '18px "Fredoka", sans-serif';
            ctx.fillText('點擊螢幕再玩一次', canvas.width/2, canvas.height/2 + 30);
        }
    }
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
