const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const muteBtn = document.getElementById('muteBtn');

let state = 'START';
let score = 0;
let highScore = localStorage.getItem('hungry_snake_highScore') || 0;

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
        muteBtn.style.background = 'rgba(34, 197, 94, 0.3)';
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
    
    if (type === 'eat') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, audioCtx.currentTime);
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

const cols = CONFIG.game.cols;
const rows = CONFIG.game.rows;
const tileSize = CONFIG.game.tileSize;

let snake = [];
let dir = {x: 1, y: 0};
let nextDir = {x: 1, y: 0};
let food = {x: 0, y: 0};
let lastTime = 0;
let currentSpeed = CONFIG.game.initialSpeed;

function spawnFood() {
    let valid = false;
    while (!valid) {
        food.x = Math.floor(Math.random() * cols);
        food.y = Math.floor(Math.random() * rows);
        valid = true;
        for (let s of snake) {
            if (s.x === food.x && s.y === food.y) {
                valid = false;
                break;
            }
        }
    }
}

function startGame() {
    initAudio();
    state = 'PLAYING';
    score = 0;
    currentSpeed = CONFIG.game.initialSpeed;
    snake = [
        {x: 5, y: 10},
        {x: 4, y: 10},
        {x: 3, y: 10}
    ];
    dir = {x: 1, y: 0};
    nextDir = {x: 1, y: 0};
    spawnFood();
    lastTime = performance.now();
}

window.addEventListener('keydown', (e) => {
    initAudio();
    if (state !== 'PLAYING') {
        if(e.code === 'Space') startGame();
        return;
    }
    
    if (e.code === 'ArrowUp' && dir.y === 0) nextDir = {x: 0, y: -1};
    else if (e.code === 'ArrowDown' && dir.y === 0) nextDir = {x: 0, y: 1};
    else if (e.code === 'ArrowLeft' && dir.x === 0) nextDir = {x: -1, y: 0};
    else if (e.code === 'ArrowRight' && dir.x === 0) nextDir = {x: 1, y: 0};
});

let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    initAudio();
    if (state !== 'PLAYING') {
        startGame();
        return;
    }
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
}, { passive: false });

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    if (state !== 'PLAYING') return;
    let touchEndX = e.changedTouches[0].screenX;
    let touchEndY = e.changedTouches[0].screenY;
    
    let dx = touchEndX - touchStartX;
    let dy = touchEndY - touchStartY;
    
    if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 30 && dir.x === 0) nextDir = {x: 1, y: 0};
        else if (dx < -30 && dir.x === 0) nextDir = {x: -1, y: 0};
    } else {
        if (dy > 30 && dir.y === 0) nextDir = {x: 0, y: 1};
        else if (dy < -30 && dir.y === 0) nextDir = {x: 0, y: -1};
    }
}, { passive: false });

function update(time) {
    if (state !== 'PLAYING') return;
    
    if (time - lastTime > currentSpeed) {
        lastTime = time;
        dir = nextDir;
        
        let head = {x: snake[0].x + dir.x, y: snake[0].y + dir.y};
        
        // Wrap around (No wall death)
        if (head.x < 0) head.x = cols - 1;
        if (head.x >= cols) head.x = 0;
        if (head.y < 0) head.y = rows - 1;
        if (head.y >= rows) head.y = 0;
        
        // Self collision
        for (let i = 0; i < snake.length; i++) {
            if (head.x === snake[i].x && head.y === snake[i].y) {
                state = 'GAMEOVER';
                playSound('over');
                return;
            }
        }
        
        snake.unshift(head);
        
        // Eat food
        if (head.x === food.x && head.y === food.y) {
            score += 10;
            currentSpeed = Math.max(CONFIG.game.minSpeed, currentSpeed - CONFIG.game.speedDecrement);
            playSound('eat');
            spawnFood();
            
            if (score > highScore) {
                highScore = score;
                localStorage.setItem('hungry_snake_highScore', highScore);
            }
        } else {
            snake.pop();
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw snake
    for (let i = 0; i < snake.length; i++) {
        let s = snake[i];
        if (i === 0) {
            ctx.fillStyle = CONFIG.ui.primaryColor;
        } else {
            ctx.fillStyle = 'rgba(34, 197, 94, 0.7)';
        }
        ctx.beginPath();
        ctx.roundRect(s.x * tileSize + 1, s.y * tileSize + 1, tileSize - 2, tileSize - 2, 4);
        ctx.fill();
    }
    
    // Draw food
    ctx.font = `${tileSize * 0.9}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🍎', food.x * tileSize + tileSize/2, food.y * tileSize + tileSize/2);

    // UI
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px "Fredoka", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`分數: ${score}`, 10, 25);
    ctx.textAlign = 'right';
    ctx.fillText(`最高: ${highScore}`, canvas.width - 10, 25);

    if (state !== 'PLAYING') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if (state === 'START') {
            ctx.fillStyle = CONFIG.ui.primaryColor;
            ctx.font = 'bold 36px "Fredoka", sans-serif';
            ctx.fillText('貪吃蛇 🐍', canvas.width/2, canvas.height/2 - 30);
            ctx.fillStyle = '#fff';
            ctx.font = '18px "Fredoka", sans-serif';
            ctx.fillText('點擊或滑動螢幕開始', canvas.width/2, canvas.height/2 + 30);
        } else if (state === 'GAMEOVER') {
            ctx.fillStyle = '#ef4444';
            ctx.font = 'bold 36px "Fredoka", sans-serif';
            ctx.fillText('遊戲結束 💥', canvas.width/2, canvas.height/2 - 30);
            ctx.fillStyle = '#fff';
            ctx.font = '18px "Fredoka", sans-serif';
            ctx.fillText('點擊或滑動螢幕重來', canvas.width/2, canvas.height/2 + 30);
        }
    }
}

function loop(time) {
    update(time);
    draw();
    requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
