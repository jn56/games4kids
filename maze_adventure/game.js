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

// Happy 8-bit loop melody arpeggio (frequencies in C-G-Am-F chord progression)
const melody = [
    523.25, 659.25, 783.99, 659.25, // Measure 1: C5, E5, G5, E5
    493.88, 587.33, 783.99, 587.33, // Measure 2: B4, D5, G5, D5
    440.00, 523.25, 659.25, 523.25, // Measure 3: A4, C5, E5, C5
    349.23, 440.00, 523.25, 440.00  // Measure 4: F4, A4, C5, A4
];

const bass = [
    130.81, 0, 0, 0, // C3
    98.00,  0, 0, 0, // G2
    110.00, 0, 0, 0, // A2
    87.31,  0, 0, 0  // F2
];

function startMusic() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    if (musicIntervalId) return; // Already running
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
    const scheduleAheadTime = 0.2; // schedule 200ms in advance
    while (nextNoteTime < audioCtx.currentTime + scheduleAheadTime) {
        scheduleNote(melodyStep, nextNoteTime);
        advanceNote();
    }
}

function advanceNote() {
    const secondsPerBeat = 60.0 / currentBpm;
    nextNoteTime += 0.5 * secondsPerBeat; // 8th notes (half beat per step)
    melodyStep = (melodyStep + 1) % melody.length;
}

function scheduleNote(step, time) {
    // Melody synth (Triangle oscillator for music-box tone)
    const freq = melody[step];
    if (freq > 0) {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        
        gain.gain.setValueAtTime(0.04, time); // Soft background music volume
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(time);
        osc.stop(time + 0.25);
    }
    
    // Bass synth (Sine oscillator for warm bassline)
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
    
    const notes = [293.66, 261.63, 220.00, 196.00]; // D4, C4, A3, G3 (retro drop)
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

// Maze settings
const cols = CONFIG.maze.cols;
const rows = CONFIG.maze.rows;
const w = canvas.width / cols;
let grid = [];
let current;
let player;
let goal;
let isPlaying = true;

// Player & Goal representations (Emojis)
const playerEmoji = CONFIG.graphics.playerEmoji;
const goalEmoji = CONFIG.graphics.goalEmoji;

class Cell {
    constructor(i, j) {
        this.i = i;
        this.j = j;
        this.walls = [true, true, true, true]; // top, right, bottom, left
        this.visited = false;
    }

    show() {
        const x = this.i * w;
        const y = this.j * w;
        ctx.strokeStyle = CONFIG.graphics.wallColor; // Dark Green walls
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';

        ctx.beginPath();
        if (this.walls[0]) { ctx.moveTo(x, y); ctx.lineTo(x + w, y); } // Top
        if (this.walls[1]) { ctx.moveTo(x + w, y); ctx.lineTo(x + w, y + w); } // Right
        if (this.walls[2]) { ctx.moveTo(x + w, y + w); ctx.lineTo(x, y + w); } // Bottom
        if (this.walls[3]) { ctx.moveTo(x, y + w); ctx.lineTo(x, y); } // Left
        ctx.stroke();

        // Fill background of cell
        ctx.fillStyle = CONFIG.graphics.floorColor; // Light green floor
        ctx.fillRect(x, y, w, w);
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
        // Step 1: Choose randomly one of the unvisited neighbors
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

function drawGrid() {
    for (let i = 0; i < grid.length; i++) {
        grid[i].show();
    }

    // Draw walls on top
    for (let i = 0; i < grid.length; i++) {
        const x = grid[i].i * w;
        const y = grid[i].j * w;
        ctx.strokeStyle = CONFIG.graphics.wallColor;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        if (grid[i].walls[0]) { ctx.moveTo(x, y); ctx.lineTo(x + w, y); }
        if (grid[i].walls[1]) { ctx.moveTo(x + w, y); ctx.lineTo(x + w, y + w); }
        if (grid[i].walls[2]) { ctx.moveTo(x + w, y + w); ctx.lineTo(x, y + w); }
        if (grid[i].walls[3]) { ctx.moveTo(x, y + w); ctx.lineTo(x, y); }
        ctx.stroke();
    }
}

const scaleFactor = CONFIG.game.scaleFactor;

function drawPlayer() {
    const px = player.i * w + w / 2;
    const py = player.j * w + w / 2;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    const dx = px - cx;
    const dy = py - cy;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    const rpx = (dx * cosA - dy * sinA) * scaleFactor + cx;
    const rpy = (dx * sinA + dy * cosA) * scaleFactor + cy;

    ctx.font = `${w * 0.85 * scaleFactor}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(playerEmoji, rpx, rpy);
}

function drawGoal() {
    const gx = goal.i * w + w / 2;
    const gy = goal.j * w + w / 2;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    const dx = gx - cx;
    const dy = gy - cy;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    const rgx = (dx * cosA - dy * sinA) * scaleFactor + cx;
    const rgy = (dx * sinA + dy * cosA) * scaleFactor + cy;

    ctx.font = `${w * 0.85 * scaleFactor}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(goalEmoji, rgx, rgy);
}

let angle = 0;

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (player) {
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;

        ctx.save();
        // Translate to canvas center, rotate, scale, then translate back
        ctx.translate(cx, cy);
        ctx.rotate(angle);
        ctx.scale(scaleFactor, scaleFactor);
        ctx.translate(-cx, -cy);

        drawGrid();

        ctx.restore();

        // Draw emojis outside rotated context using calculated rotated coordinates
        drawGoal();
        drawPlayer();
    } else {
        drawGrid();
        drawGoal();
    }
}

function initGame() {
    generateMaze();
    player = { i: 0, j: 0 };
    goal = { i: cols - 1, j: rows - 1 };
    isPlaying = true;
    angle = 0; // Reset angle
    timeLeft = CONFIG.game.timeLimit; // Reset timer

    congratsMsg.classList.add('hidden');
    gameOverMsg.classList.add('hidden');

    timerVal.textContent = timeLeft;
    timerBadge.classList.remove('urgent');

    currentBpm = 110; // Reset tempo to normal

    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        if (!isPlaying) return;
        timeLeft--;
        timerVal.textContent = timeLeft;

        if (timeLeft <= 15) {
            timerBadge.classList.add('urgent');
            currentBpm = 160; // Speed up music!
        }

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            isPlaying = false;
            stopMusic();
            playLoseSound();
            gameOverMsg.classList.remove('hidden');
        }
    }, 1000);

    // If audio has already been initiated and is running, auto-play
    if (audioCtx && audioCtx.state === 'running') {
        startMusic();
    }

    render();
}

// Audio context for win sound
function playWinSound() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C E G C
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

// Convert screen movement direction to grid movement direction based on current rotation angle
function getGridDirection(sdx, sdy) {
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    // Rotate screen direction by -angle to get grid direction vector
    const gdx = sdx * cosA + sdy * sinA;
    const gdy = -sdx * sinA + sdy * cosA;

    // Check dot products with the four grid unit vectors
    const candidates = [
        { dx: 0, dy: -1, score: -gdy }, // Up
        { dx: 0, dy: 1, score: gdy },   // Down
        { dx: -1, dy: 0, score: -gdx }, // Left
        { dx: 1, dy: 0, score: gdx }    // Right
    ];

    let best = candidates[0];
    for (let i = 1; i < candidates.length; i++) {
        if (candidates[i].score > best.score) {
            best = candidates[i];
        }
    }
    return best;
}

function movePlayer(dx, dy) {
    if (!isPlaying) return;

    let cell = grid[index(player.i, player.j)];

    // dx = 1 (Right), dx = -1 (Left)
    // dy = 1 (Down), dy = -1 (Up)

    if (dy === -1 && !cell.walls[0]) player.j--; // Up
    if (dx === 1 && !cell.walls[1]) player.i++; // Right
    if (dy === 1 && !cell.walls[2]) player.j++; // Down
    if (dx === -1 && !cell.walls[3]) player.i--; // Left

    // Check Win Condition
    if (player.i === goal.i && player.j === goal.j) {
        isPlaying = false;
        if (timerInterval) clearInterval(timerInterval);
        stopMusic();
        playWinSound();
        congratsMsg.classList.remove('hidden');
    }
}

// Keyboard controls state
const keysPressed = {};
let lastTimestamp = 0;
let lastMoveTime = 0;
const moveInterval = 150; // Milliseconds between moves when holding a key

window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyS', 'KeyA', 'KeyD'].includes(e.code)) {
        e.preventDefault(); // Prevent scrolling

        ensureAudioStarted(); // Resume/start music on interaction

        if (!keysPressed[e.code]) {
            keysPressed[e.code] = true;
            // Force immediate move on new key press by resetting lastMoveTime
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
    // Clear pressed keys when window loses focus
    for (const key in keysPressed) {
        keysPressed[key] = false;
    }
    stopMusic(); // Stop music when browser tab is inactive
});

window.addEventListener('focus', () => {
    // Resume music if page is focused and game is running
    if (isPlaying && audioCtx && audioCtx.state === 'running') {
        startMusic();
    }
});

// Touch controls (Swipe)
let touchStartX = 0;
let touchStartY = 0;
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    ensureAudioStarted(); // Resume/start music on touch
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
        // Horizontal swipe
        if (Math.abs(dx) > 30) {
            const dir = getGridDirection(dx > 0 ? 1 : -1, 0);
            movePlayer(dir.dx, dir.dy);
        }
    } else {
        // Vertical swipe
        if (Math.abs(dy) > 30) {
            const dir = getGridDirection(0, dy > 0 ? 1 : -1);
            movePlayer(dir.dx, dir.dy);
        }
    }
}, { passive: false });

restartBtn.addEventListener('click', initGame);
retryBtn.addEventListener('click', initGame);

// Animation Loop
function animate(timestamp) {
    if (!lastTimestamp) lastTimestamp = timestamp;
    const dt = timestamp - lastTimestamp;
    lastTimestamp = timestamp;

    if (isPlaying) {
        // Rotate slowly
        angle += CONFIG.game.rotationSpeed * (dt / 1000);

        // Check held keys for continuous movement
        if (timestamp - lastMoveTime > moveInterval) {
            let sdx = 0;
            let sdy = 0;

            if (keysPressed['ArrowUp'] || keysPressed['KeyW']) sdy = -1;
            else if (keysPressed['ArrowDown'] || keysPressed['KeyS']) sdy = 1;
            else if (keysPressed['ArrowLeft'] || keysPressed['KeyA']) sdx = -1;
            else if (keysPressed['ArrowRight'] || keysPressed['KeyD']) sdx = 1;

            if (sdx !== 0 || sdy !== 0) {
                const dir = getGridDirection(sdx, sdy);
                movePlayer(dir.dx, dir.dy);
                lastMoveTime = timestamp;
            }
        }
    }

    render();
    requestAnimationFrame(animate);
}

// Start
initGame();
requestAnimationFrame(animate);
