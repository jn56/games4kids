const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
// Game coordinates stay fixed while the drawing buffer follows screen density.
const boardWidth = canvas.width, boardHeight = canvas.height;
const muteBtn = document.getElementById('muteBtn');

let state = 'START';
let score = 0;
let highScore = GameStorage.number('simon_says_highScore');

let sequence = [];
let playerStep = 0;
let litButton = -1;
let isPlayingSequence = false;
let runId = 0;
const roundTimers = new Set();

// Count only active play time so pausing never skips a note or transition.
function later(delay, callback) {
    const run = runId;
    let remaining = delay;
    let previous = performance.now();
    function tick() {
        if (run !== runId) return;
        const now = performance.now();
        if (!GameShell.paused) remaining -= Math.min(now - previous, 100);
        previous = now;
        if (remaining <= 0) { callback(); return; }
        const timer = setTimeout(() => { roundTimers.delete(timer); tick(); }, 25);
        roundTimers.add(timer);
    }
    tick();
}

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
        muteBtn.style.background = 'rgba(245, 158, 11, 0.3)';
        initAudio();
    }
});

function initAudio() {
    audioCtx = GameAudio.context(); GameAudio.unlock();
}

function playTone(freq, duration) {
    GameAudio.tone(freq, duration / 1000);
}

function playErrorTone() {
    GameAudio.effect('error');
}

const cx = boardWidth / 2;
const cy = boardHeight / 2;
const r = 120;
const innerR = 40;

const buttons = [
    { ...CONFIG.buttons[0], startAngle: 1.5 * Math.PI, endAngle: 2.0 * Math.PI }, // Top Right
    { ...CONFIG.buttons[1], startAngle: 0 * Math.PI, endAngle: 0.5 * Math.PI },   // Bottom Right
    { ...CONFIG.buttons[2], startAngle: 0.5 * Math.PI, endAngle: 1.0 * Math.PI }, // Bottom Left
    { ...CONFIG.buttons[3], startAngle: 1.0 * Math.PI, endAngle: 1.5 * Math.PI }  // Top Left
];

function startGame() {
    runId++;
    roundTimers.forEach(clearTimeout);
    roundTimers.clear();
    initAudio();
    state = 'PLAYING';
    score = 0;
    sequence = [];
    litButton = -1;
    playerStep = 0;
    nextRound();
    draw();
}

function nextRound() {
    if (state !== 'PLAYING') return;
    sequence.push(Math.floor(Math.random() * 4));
    playerStep = 0;
    score = sequence.length - 1;
    if (score > highScore) {
        highScore = score;
        GameStorage.set('simon_says_highScore', highScore);
    }
    playSequence();
}

function playSequence() {
    isPlayingSequence = true;
    let step = 0;
    function showNext() {
        if (state !== 'PLAYING') return;
        const btnId = sequence[step];
        litButton = btnId;
        playTone(buttons[btnId].freq, CONFIG.game.lightDuration);
        draw();
        later(CONFIG.game.lightDuration, () => {
            litButton = -1;
            draw();
            step++;
            if (step === sequence.length) {
                isPlayingSequence = false;
                draw();
            } else later(CONFIG.game.playDelay, showNext);
        });
    }
    later(CONFIG.game.playDelay + CONFIG.game.lightDuration, showNext);
}

function handleInput(x, y) {
    if (GameShell.paused) return;
    if (state !== 'PLAYING' || isPlayingSequence) {
        if (state !== 'PLAYING') startGame();
        return;
    }
    
    let dx = x - cx;
    let dy = y - cy;
    let dist = Math.sqrt(dx*dx + dy*dy);
    
    if (dist > innerR && dist < r) {
        let angle = Math.atan2(dy, dx);
        if (angle < 0) angle += 2 * Math.PI;
        
        let clickedBtn = -1;
        for (let i = 0; i < buttons.length; i++) {
            if (angle >= buttons[i].startAngle && angle <= buttons[i].endAngle) {
                clickedBtn = i;
                break;
            }
        }
        
        if (clickedBtn !== -1) {
            litButton = clickedBtn;
            draw();
            
            if (clickedBtn === sequence[playerStep]) {
                playTone(buttons[clickedBtn].freq, 200);
                playerStep++;
                const complete = playerStep === sequence.length;
                if (complete) isPlayingSequence = true;
                later(200, () => {
                    litButton = -1;
                    draw();
                    if (complete && state === 'PLAYING') later(500, nextRound);
                });
            } else {
                state = 'GAMEOVER';
                runId++;
                roundTimers.forEach(clearTimeout);
                roundTimers.clear();
                isPlayingSequence = false;
                playErrorTone();
                later(500, () => {
                    litButton = -1;
                    draw();
                });
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

function draw() {
    ctx.clearRect(0, 0, boardWidth, boardHeight);
    
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(cx, cy, r + 10, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < buttons.length; i++) {
        let b = buttons[i];
        
        ctx.beginPath();
        ctx.arc(cx, cy, r, b.startAngle, b.endAngle);
        ctx.arc(cx, cy, innerR, b.endAngle, b.startAngle, true);
        ctx.closePath();
        
        if (litButton === i) {
            ctx.fillStyle = b.glow;
            ctx.shadowColor = b.glow;
            ctx.shadowBlur = 30;
        } else {
            ctx.fillStyle = b.color;
            ctx.shadowBlur = 0;
        }
        
        ctx.fill();
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 10;
        ctx.stroke();
        ctx.shadowBlur = 0;
    }
    
    // Center circle
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 5;
    ctx.stroke();
    
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 24px "Fredoka"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(score.toString(), cx, cy);
    if (state === 'PLAYING') {
        ctx.font = '14px sans-serif';
        ctx.fillStyle = '#dceee9';
        ctx.fillText(isPlayingSequence ? '先看亮燈，記住順序' : '換你了！依序按箭頭', cx, 24);
        ctx.font = 'bold 18px sans-serif';
        [[65,-65],[65,65],[-65,65],[-65,-65]].forEach(([x,y],index) => ctx.fillText(['↑','→','↓','←'][index],cx+x,cy+y));
    }

    // Overlays
    if (state !== 'PLAYING') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, boardWidth, boardHeight);
        
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if (state === 'START') {
            ctx.fillStyle = CONFIG.ui.primaryColor;
            ctx.font = 'bold 27px sans-serif';
            ctx.fillText('🎵 跟著彩色節拍走', cx, cy - 30);
            ctx.fillStyle = '#fff';
            ctx.font = '16px "Fredoka", sans-serif';
            ctx.fillText('按空白鍵或點畫面開始', cx, cy + 30);
        } else if (state === 'GAMEOVER') {
            ctx.fillStyle = '#ef4444';
            ctx.font = 'bold 27px sans-serif';
            ctx.fillText('遊戲結束 💥', cx, cy - 30);
            ctx.fillStyle = '#fff';
            ctx.font = '16px "Fredoka", sans-serif';
            ctx.fillText(`最高分: ${highScore}`, cx, cy + 10);
            ctx.fillText('空白鍵重玩', cx, cy + 40);
        }
    }
}

draw();

window.addEventListener('keydown', event => {
    const index = ['ArrowUp','ArrowRight','ArrowDown','ArrowLeft'].indexOf(event.code);
    if (index >= 0 && !event.repeat) {
        const [x,y] = [[65,-65],[65,65],[-65,65],[-65,-65]][index];
        handleInput(cx+x,cy+y);
    }
});

GameShell.register({status:()=>state,start:startGame,board:{width:boardWidth,height:boardHeight,draw}});
