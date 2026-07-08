const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const congratsMsg = document.getElementById('congratsMsg');
const restartBtn = document.getElementById('restartBtn');
const gameOverMsg = document.getElementById('gameOverMsg');
const retryBtn = document.getElementById('retryBtn');
const timerVal = document.getElementById('timerVal');
const timerBadge = document.querySelector('.timer-badge');

// Timer state
let timeLeft = CONFIG.game.timeLimit;
let timerInterval = null;

// Audio synth BGM state
let audioCtx = null;
let musicIntervalId = null;
let nextNoteTime = 0;
let melodyStep = 0;
let currentBpm = 110;

// Happy 8-bit loop melody arpeggio
const melody = [
    523.25, 659.25, 783.99, 659.25,
    493.88, 587.33, 783.99, 587.33,
    440.00, 523.25, 659.25, 523.25,
    349.23, 440.00, 523.25, 440.00 
];

const bass = [
    130.81, 0, 0, 0,
    98.00,  0, 0, 0,
    110.00, 0, 0, 0,
    87.31,  0, 0, 0 
];

function startMusic() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    if (musicIntervalId) return;
    nextNoteTime = audioCtx.currentTime;
    melodyStep = 0;
    musicIntervalId = setInterval(scheduler, 100);
}

function stopMusic() {
    if (musicIntervalId) {
        clearInterval(musicIntervalId);
        musicIntervalId = null;
    }
}

function scheduler() {
    const scheduleAheadTime = 0.2;
    while (nextNoteTime < audioCtx.currentTime + scheduleAheadTime) {
        scheduleNote(melodyStep, nextNoteTime);
        advanceNote();
    }
}

function advanceNote() {
    const secondsPerBeat = 60.0 / currentBpm;
    nextNoteTime += 0.5 * secondsPerBeat;
    melodyStep = (melodyStep + 1) % melody.length;
}

function scheduleNote(step, time) {
    const freq = melody[step];
    if (freq > 0) {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        
        gain.gain.setValueAtTime(0.04, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(time);
        osc.stop(time + 0.25);
    }
    
    const bassFreq = bass[step];
    if (bassFreq > 0) {
        const oscBass = audioCtx.createOscillator();
        const gainBass = audioCtx.createGain();
        oscBass.type = 'sine';
        oscBass.frequency.value = bassFreq;
        
        gainBass.gain.setValueAtTime(0.06, time);
        gainBass.gain.exponentialRampToValueAtTime(0.001, time + 0.5);
        
        oscBass.connect(gainBass);
        gainBass.connect(audioCtx.destination);
        oscBass.start(time);
        oscBass.stop(time + 0.5);
    }
}

function ensureAudioStarted() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    if (!musicIntervalId && isPlaying) {
        startMusic();
    }
}

function playLoseSound() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    const notes = [293.66, 261.63, 220.00, 196.00];
    const now = audioCtx.currentTime;
    
    notes.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.value = freq;
        
        gain.gain.setValueAtTime(0.08, now + idx * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.15 + 0.25);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + idx * 0.15);
        osc.stop(now + idx * 0.15 + 0.25);
    });
}

function playWinSound() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const notes = [523.25, 659.25, 783.99, 1046.50];
    const now = audioCtx.currentTime;

    notes.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;

        gain.gain.setValueAtTime(0.1, now + idx * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.15 + 0.1);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + idx * 0.15);
        osc.stop(now + idx * 0.15 + 0.1);
    });
}

function playShiftSound() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(150, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.2);
    
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.2);
}

// Maze settings
const cols = CONFIG.maze.cols;
const rows = CONFIG.maze.rows;
const w = canvas.width / cols;
let grid = [];
let current;
let player;
let goal;
let spider;
let isPlaying = true;
let lastShiftTime = 0;
let lastSpiderMoveTime = 0;
let spiderPrevCell = null;

// Player & Goal representations (Emojis)
const playerEmoji = CONFIG.graphics.playerEmoji;
const goalEmoji = CONFIG.graphics.goalEmoji;
const spiderEmoji = CONFIG.graphics.spiderEmoji;

class Cell {
    constructor(i, j) {
        this.i = i;
        this.j = j;
        this.walls = [true, true, true, true]; // top, right, bottom, left
        this.visited = false;
        this.highlightTimer = 0;
    }

    show() {
        const x = this.i * w;
        const y = this.j * w;
        
        // Fill background of cell
        if (this.highlightTimer > 0) {
            ctx.fillStyle = CONFIG.graphics.shiftingWallColor;
            this.highlightTimer--;
        } else {
            ctx.fillStyle = CONFIG.graphics.floorColor;
        }
        ctx.fillRect(x, y, w, w);
        
        ctx.strokeStyle = CONFIG.graphics.wallColor;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';

        ctx.beginPath();
        if (this.walls[0]) { ctx.moveTo(x, y); ctx.lineTo(x + w, y); } // Top
        if (this.walls[1]) { ctx.moveTo(x + w, y); ctx.lineTo(x + w, y + w); } // Right
        if (this.walls[2]) { ctx.moveTo(x + w, y + w); ctx.lineTo(x, y + w); } // Bottom
        if (this.walls[3]) { ctx.moveTo(x, y + w); ctx.lineTo(x, y); } // Left
        ctx.stroke();
    }
}

function index(i, j) {
    if (i < 0 || j < 0 || i > cols - 1 || j > rows - 1) return -1;
    return i + j * cols;
}

function removeWalls(a, b) {
    const x = a.i - b.i;
    if (x === 1) { a.walls[3] = false; b.walls[1] = false; }
    else if (x === -1) { a.walls[1] = false; b.walls[3] = false; }

    const y = a.j - b.j;
    if (y === 1) { a.walls[0] = false; b.walls[2] = false; }
    else if (y === -1) { a.walls[2] = false; b.walls[0] = false; }
}

function generateMaze() {
    grid = [];
    for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
            grid.push(new Cell(i, j));
        }
    }

    let stack = [];
    current = grid[0];
    current.visited = true;

    // DFS Maze Generation
    let generating = true;
    while (generating) {
        let neighbors = [];
        let i = current.i;
        let j = current.j;

        let top = grid[index(i, j - 1)];
        let right = grid[index(i + 1, j)];
        let bottom = grid[index(i, j + 1)];
        let left = grid[index(i - 1, j)];

        if (top && !top.visited) neighbors.push(top);
        if (right && !right.visited) neighbors.push(right);
        if (bottom && !bottom.visited) neighbors.push(bottom);
        if (left && !left.visited) neighbors.push(left);

        if (neighbors.length > 0) {
            let next = neighbors[Math.floor(Math.random() * neighbors.length)];
            stack.push(current);
            removeWalls(current, next);
            current = next;
            current.visited = true;
        } else if (stack.length > 0) {
            current = stack.pop();
        } else {
            generating = false; // Maze complete
        }
    }
}

let movingWallPairs = [];

function addWalls(a, b) {
    const x = a.i - b.i;
    if (x === 1) { a.walls[3] = true; b.walls[1] = true; }
    else if (x === -1) { a.walls[1] = true; b.walls[3] = true; }

    const y = a.j - b.j;
    if (y === 1) { a.walls[0] = true; b.walls[2] = true; }
    else if (y === -1) { a.walls[2] = true; b.walls[0] = true; }
}

function getOpenNeighbors(curr) {
    let neighbors = [];
    let i = curr.i;
    let j = curr.j;
    if (!curr.walls[0] && j > 0) neighbors.push(grid[index(i, j - 1)]);
    if (!curr.walls[1] && i < cols - 1) neighbors.push(grid[index(i + 1, j)]);
    if (!curr.walls[2] && j < rows - 1) neighbors.push(grid[index(i, j + 1)]);
    if (!curr.walls[3] && i > 0) neighbors.push(grid[index(i - 1, j)]);
    return neighbors;
}

function findPath(startCell, endCell) {
    let queue = [startCell];
    let parent = new Map();
    parent.set(startCell, null);
    
    while(queue.length > 0) {
        let curr = queue.shift();
        if (curr === endCell) break;
        
        let neighbors = getOpenNeighbors(curr);
        for (let n of neighbors) {
            if (!parent.has(n)) {
                parent.set(n, curr);
                queue.push(n);
            }
        }
    }
    
    let path = [];
    let curr = endCell;
    while(curr !== null) {
        path.unshift(curr);
        curr = parent.get(curr);
    }
    return path;
}

function wallKey(c1, c2) {
    return Math.min(index(c1.i, c1.j), index(c2.i, c2.j)) + "-" + Math.max(index(c1.i, c1.j), index(c2.i, c2.j));
}

function initMovingWalls() {
    movingWallPairs = [];
    let usedWalls = new Set();
    
    let internalClosedWalls = [];
    for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
            let c = grid[index(i, j)];
            if (i < cols - 1 && c.walls[1]) {
                internalClosedWalls.push({ c1: c, c2: grid[index(i + 1, j)] });
            }
            if (j < rows - 1 && c.walls[2]) {
                internalClosedWalls.push({ c1: c, c2: grid[index(i, j + 1)] });
            }
        }
    }
    
    internalClosedWalls.sort(() => Math.random() - 0.5);
    let targetCount = Math.floor(Math.random() * (CONFIG.game.movingWallsCount.max - CONFIG.game.movingWallsCount.min + 1)) + CONFIG.game.movingWallsCount.min;
    
    for (let w1 of internalClosedWalls) {
        if (movingWallPairs.length >= targetCount) break;
        
        let k1 = wallKey(w1.c1, w1.c2);
        if (usedWalls.has(k1)) continue;
        
        let path = findPath(w1.c1, w1.c2);
        if (path.length < 2) continue;
        
        let n1 = path[1];
        let w2_A = { c1: w1.c1, c2: n1 };
        let k2_A = wallKey(w2_A.c1, w2_A.c2);
        
        let prevB = path[path.length - 2];
        let w2_B = { c1: prevB, c2: w1.c2 };
        let k2_B = wallKey(w2_B.c1, w2_B.c2);
        
        let validW2s = [];
        if (!usedWalls.has(k2_A)) validW2s.push({w: w2_A, key: k2_A});
        if (!usedWalls.has(k2_B)) validW2s.push({w: w2_B, key: k2_B});
        
        if (validW2s.length > 0) {
            let chosen = validW2s[Math.floor(Math.random() * validW2s.length)];
            
            movingWallPairs.push({
                w1: w1,
                w2: chosen.w,
                state: 0
            });
            usedWalls.add(k1);
            usedWalls.add(chosen.key);
        }
    }
}

function shiftWalls() {
    for (let pair of movingWallPairs) {
        if (pair.state === 0) {
            removeWalls(pair.w1.c1, pair.w1.c2);
            addWalls(pair.w2.c1, pair.w2.c2);
            pair.state = 1;
        } else {
            addWalls(pair.w1.c1, pair.w1.c2);
            removeWalls(pair.w2.c1, pair.w2.c2);
            pair.state = 0;
        }
        
        pair.w1.c1.highlightTimer = 30;
        pair.w1.c2.highlightTimer = 30;
        pair.w2.c1.highlightTimer = 30;
        pair.w2.c2.highlightTimer = 30;
    }
    playShiftSound();
}

function drawGrid() {
    for (let i = 0; i < grid.length; i++) {
        grid[i].show();
    }
}

function drawMovingWalls() {
    ctx.strokeStyle = CONFIG.graphics.movingWallColor || '#0ea5e9';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    
    ctx.beginPath();
    if (typeof movingWallPairs !== 'undefined') {
        for (let pair of movingWallPairs) {
            let activeWall = pair.state === 0 ? pair.w1 : pair.w2;
            let c1 = activeWall.c1;
            let c2 = activeWall.c2;
            
            let x1 = c1.i * w;
            let y1 = c1.j * w;
            
            if (c1.i === c2.i) {
                let y = Math.max(c1.j, c2.j) * w;
                ctx.moveTo(x1, y);
                ctx.lineTo(x1 + w, y);
            } else {
                let x = Math.max(c1.i, c2.i) * w;
                ctx.moveTo(x, y1);
                ctx.lineTo(x, y1 + w);
            }
        }
    }
    ctx.stroke();
}

function drawPlayer() {
    const px = player.i * w + w / 2;
    const py = player.j * w + w / 2;

    ctx.font = `${w * 0.85}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(playerEmoji, px, py);
}

function drawGoal() {
    const gx = goal.i * w + w / 2;
    const gy = goal.j * w + w / 2;

    ctx.font = `${w * 0.85}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(goalEmoji, gx, gy);
}

function drawSpider() {
    const sx = spider.i * w + w / 2;
    const sy = spider.j * w + w / 2;

    ctx.font = `${w * 0.85}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(spiderEmoji, sx, sy);
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid();
    drawMovingWalls();
    drawGoal();
    if (spider) {
        drawSpider();
    }
    if (player) {
        drawPlayer();
    }
}

function initGame() {
    generateMaze();
    initMovingWalls();
    player = { i: 0, j: 0 };
    goal = { i: cols - 1, j: rows - 1 };
    spider = { i: cols - 1, j: 0 }; // Spider starts at top right
    spiderPrevCell = null;
    isPlaying = true;
    timeLeft = CONFIG.game.timeLimit;
    lastShiftTime = performance.now();
    lastSpiderMoveTime = performance.now();

    congratsMsg.classList.add('hidden');
    gameOverMsg.classList.add('hidden');

    timerVal.textContent = timeLeft;
    timerBadge.classList.remove('urgent');

    currentBpm = 110;

    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        if (!isPlaying) return;
        timeLeft--;
        timerVal.textContent = timeLeft;

        if (timeLeft <= 15) {
            timerBadge.classList.add('urgent');
            currentBpm = 160;
        }

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            isPlaying = false;
            stopMusic();
            playLoseSound();
            gameOverMsg.querySelector('.game-over-sub').textContent = "魔法師被困在裡面了...";
            gameOverMsg.classList.remove('hidden');
        }
    }, 1000);

    if (audioCtx && audioCtx.state === 'running') {
        startMusic();
    }

    render();
}

function movePlayer(dx, dy) {
    if (!isPlaying) return;

    let cell = grid[index(player.i, player.j)];

    if (dy === -1 && !cell.walls[0]) player.j--; // Up
    if (dx === 1 && !cell.walls[1]) player.i++; // Right
    if (dy === 1 && !cell.walls[2]) player.j++; // Down
    if (dx === -1 && !cell.walls[3]) player.i--; // Left

    if (player.i === goal.i && player.j === goal.j) {
        isPlaying = false;
        if (timerInterval) clearInterval(timerInterval);
        stopMusic();
        playWinSound();
        congratsMsg.classList.remove('hidden');
    }
    
    checkCollision();
}

function checkCollision() {
    if (player.i === spider.i && player.j === spider.j) {
        isPlaying = false;
        if (timerInterval) clearInterval(timerInterval);
        stopMusic();
        playLoseSound();
        gameOverMsg.querySelector('.game-over-sub').textContent = "你被蜘蛛抓到了！";
        gameOverMsg.classList.remove('hidden');
    }
}

function moveSpider() {
    if (!isPlaying) return;
    
    let currCell = grid[index(spider.i, spider.j)];
    let neighbors = getOpenNeighbors(currCell);
    
    if (neighbors.length > 0) {
        // Try not to turn back unless it's a dead end
        let validNeighbors = neighbors;
        if (neighbors.length > 1 && spiderPrevCell) {
            validNeighbors = neighbors.filter(n => n !== spiderPrevCell);
        }
        
        let nextCell = validNeighbors[Math.floor(Math.random() * validNeighbors.length)];
        spiderPrevCell = currCell;
        spider.i = nextCell.i;
        spider.j = nextCell.j;
    }
    
    checkCollision();
}

// Keyboard controls state
const keysPressed = {};
let lastMoveTime = 0;
const moveInterval = 150;

window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyS', 'KeyA', 'KeyD'].includes(e.code)) {
        e.preventDefault();
        ensureAudioStarted();
        if (!keysPressed[e.code]) {
            keysPressed[e.code] = true;
            lastMoveTime = 0;
        }
    }
});

window.addEventListener('keyup', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyS', 'KeyA', 'KeyD'].includes(e.code)) {
        keysPressed[e.code] = false;
    }
});

window.addEventListener('blur', () => {
    for (const key in keysPressed) {
        keysPressed[key] = false;
    }
    stopMusic();
});

window.addEventListener('focus', () => {
    if (isPlaying && audioCtx && audioCtx.state === 'running') {
        startMusic();
    }
});

let touchStartX = 0;
let touchStartY = 0;
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    ensureAudioStarted();
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
}, { passive: false });

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    if (!isPlaying) return;

    let touchEndX = e.changedTouches[0].clientX;
    let touchEndY = e.changedTouches[0].clientY;

    let dx = touchEndX - touchStartX;
    let dy = touchEndY - touchStartY;

    if (Math.abs(dx) > Math.abs(dy)) {
        if (Math.abs(dx) > 30) {
            movePlayer(dx > 0 ? 1 : -1, 0);
        }
    } else {
        if (Math.abs(dy) > 30) {
            movePlayer(0, dy > 0 ? 1 : -1);
        }
    }
}, { passive: false });

restartBtn.addEventListener('click', initGame);
retryBtn.addEventListener('click', initGame);

function animate(timestamp) {
    if (isPlaying) {
        if (timestamp - lastShiftTime > CONFIG.game.shiftInterval) {
            shiftWalls();
            lastShiftTime = timestamp;
        }
        
        if (timestamp - lastSpiderMoveTime > CONFIG.game.spiderSpeed) {
            moveSpider();
            lastSpiderMoveTime = timestamp;
        }

        if (timestamp - lastMoveTime > moveInterval) {
            let dx = 0, dy = 0;
            if (keysPressed['ArrowUp'] || keysPressed['KeyW']) dy = -1;
            else if (keysPressed['ArrowDown'] || keysPressed['KeyS']) dy = 1;
            else if (keysPressed['ArrowLeft'] || keysPressed['KeyA']) dx = -1;
            else if (keysPressed['ArrowRight'] || keysPressed['KeyD']) dx = 1;

            if (dx !== 0 || dy !== 0) {
                movePlayer(dx, dy);
                lastMoveTime = timestamp;
            }
        }
    }

    render();
    requestAnimationFrame(animate);
}

initGame();
requestAnimationFrame(animate);
