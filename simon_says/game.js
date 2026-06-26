const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const muteBtn = document.getElementById('muteBtn');

let state = 'START';
let score = 0;
let highScore = localStorage.getItem('simon_says_highScore') || 0;

let sequence = [];
let playerStep = 0;
let litButton = -1;
let isPlayingSequence = false;

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
    if (isMuted) return;
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
}

function playTone(freq, duration) {
    if (isMuted || !audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.value = freq;
    
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration/1000);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + duration/1000);
}

function playErrorTone() {
    if (isMuted || !audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.5);
    
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.5);
}

const cx = canvas.width / 2;
const cy = canvas.height / 2;
const r = 120;
const innerR = 40;

const buttons = [
    { ...CONFIG.buttons[0], startAngle: 1.5 * Math.PI, endAngle: 2.0 * Math.PI }, // Top Right
    { ...CONFIG.buttons[1], startAngle: 0 * Math.PI, endAngle: 0.5 * Math.PI },   // Bottom Right
    { ...CONFIG.buttons[2], startAngle: 0.5 * Math.PI, endAngle: 1.0 * Math.PI }, // Bottom Left
    { ...CONFIG.buttons[3], startAngle: 1.0 * Math.PI, endAngle: 1.5 * Math.PI }  // Top Left
];

function startGame() {
    initAudio();
    state = 'PLAYING';
    score = 0;
    sequence = [];
    nextRound();
}

function nextRound() {
    sequence.push(Math.floor(Math.random() * 4));
    playerStep = 0;
    score = sequence.length - 1;
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('simon_says_highScore', highScore);
    }
    playSequence();
}

function playSequence() {
    isPlayingSequence = true;
    let step = 0;
    
    let interval = setInterval(() => {
        if (step >= sequence.length) {
            clearInterval(interval);
            isPlayingSequence = false;
            litButton = -1;
            draw();
            return;
        }
        
        let btnId = sequence[step];
        litButton = btnId;
        playTone(buttons[btnId].freq, CONFIG.game.lightDuration);
        draw();
        
        setTimeout(() => {
            litButton = -1;
            draw();
        }, CONFIG.game.lightDuration);
        
        step++;
    }, CONFIG.game.playDelay + CONFIG.game.lightDuration);
}

function handleInput(x, y) {
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
                
                setTimeout(() => {
                    litButton = -1;
                    draw();
                    if (playerStep === sequence.length) {
                        setTimeout(nextRound, 500);
                    }
                }, 200);
            } else {
                state = 'GAMEOVER';
                playErrorTone();
                setTimeout(() => {
                    litButton = -1;
                    draw();
                }, 500);
            }
        }
    }
}

canvas.addEventListener('mousedown', (e) => {
    initAudio();
    const rect = canvas.getBoundingClientRect();
    handleInput((e.clientX - rect.left) * (canvas.width / rect.width), (e.clientY - rect.top) * (canvas.height / rect.height));
});

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    initAudio();
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    handleInput((touch.clientX - rect.left) * (canvas.width / rect.width), (touch.clientY - rect.top) * (canvas.height / rect.height));
}, { passive: false });

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
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

    // Overlays
    if (state !== 'PLAYING') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if (state === 'START') {
            ctx.fillStyle = CONFIG.ui.primaryColor;
            ctx.font = 'bold 32px "Fredoka", sans-serif';
            ctx.fillText('音樂記憶 🎵', cx, cy - 30);
            ctx.fillStyle = '#fff';
            ctx.font = '16px "Fredoka", sans-serif';
            ctx.fillText('點擊螢幕開始', cx, cy + 30);
        } else if (state === 'GAMEOVER') {
            ctx.fillStyle = '#ef4444';
            ctx.font = 'bold 32px "Fredoka", sans-serif';
            ctx.fillText('遊戲結束 💥', cx, cy - 30);
            ctx.fillStyle = '#fff';
            ctx.font = '16px "Fredoka", sans-serif';
            ctx.fillText(`最高分: ${highScore}`, cx, cy + 10);
            ctx.fillText('點擊重來', cx, cy + 40);
        }
    }
}

draw();
