const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
// Keep gameplay coordinates independent of the screen drawing resolution.
const boardWidth = canvas.width, boardHeight = canvas.height;
const muteBtn = document.getElementById('muteBtn');

let state = 'START';
let score = 0;
let highScore = GameStorage.number('hungry_snake_highScore');

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
    audioCtx = GameAudio.context(); GameAudio.unlock();
}

function playSound(type) {
    GameAudio.effect(type);
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
    const available=[]; for(let y=0;y<rows;y++)for(let x=0;x<cols;x++)if(!snake.some(s=>s.x===x&&s.y===y))available.push({x,y});
    if(!available.length){state='WIN';GameAudio.effect('win');return;}
    food=available[Math.floor(Math.random()*available.length)];
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
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
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
    if (GameShell.paused) return;
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
        const eating = head.x === food.x && head.y === food.y;
        for (let i = 0; i < snake.length - (eating ? 0 : 1); i++) {
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
                GameStorage.set('hungry_snake_highScore', highScore);
            }
        } else {
            snake.pop();
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, boardWidth, boardHeight);

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
        if (i === 0) {
            const cx=s.x*tileSize+tileSize/2,cy=s.y*tileSize+tileSize/2;
            ctx.fillStyle='#163f26';
            ctx.beginPath();
            for (const side of [-1,1]) ctx.arc(cx+dir.x*4-dir.y*side*4,cy+dir.y*4+dir.x*side*4,1.8,0,Math.PI*2);
            ctx.fill();
        }
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
    ctx.fillText(`最高: ${highScore}`, boardWidth - 10, 25);

    if (state !== 'PLAYING') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, boardWidth, boardHeight);
        
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if (state === 'START') {
            ctx.fillStyle = CONFIG.ui.primaryColor;
            ctx.font = 'bold 27px sans-serif';
            ctx.fillText('🐍 小蛇的蘋果派對', boardWidth/2, boardHeight/2 - 30);
            ctx.fillStyle = '#fff';
            ctx.font = '18px "Fredoka", sans-serif';
            ctx.fillText('點擊或滑動螢幕開始', boardWidth/2, boardHeight/2 + 30);
        } else if (state === 'WIN') {
            ctx.fillStyle='#34d399';ctx.font='bold 30px sans-serif';ctx.fillText('蘋果派對完成！',boardWidth/2,boardHeight/2-20);
        } else if (state === 'GAMEOVER') {
            ctx.fillStyle = '#ef4444';
            ctx.font = 'bold 27px sans-serif';
            ctx.fillText('遊戲結束 💥', boardWidth/2, boardHeight/2 - 30);
            ctx.fillStyle = '#fff';
            ctx.font = '18px "Fredoka", sans-serif';
            ctx.fillText('點擊或滑動螢幕重來', boardWidth/2, boardHeight/2 + 30);
        }
    }
}

function loop(time) {
    update(time);
    draw();
    requestAnimationFrame(loop);
}

requestAnimationFrame(loop);

canvas.addEventListener("mousedown",()=>{if(state!=="PLAYING")startGame();});

GameShell.register({board:{width:boardWidth,height:boardHeight,draw:draw},status:()=>state,start:startGame,resume:()=>{lastTime=performance.now();}});
