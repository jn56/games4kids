const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const muteBtn = document.getElementById('muteBtn');

let state = 'START';
let score = 0; // Moves
let highScore = localStorage.getItem('memory_match_highScore') || 0;
let timeElapsed = 0;
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
        muteBtn.style.background = 'rgba(59, 130, 246, 0.3)';
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
    
    if (type === 'flip') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
    } else if (type === 'match') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        
        const osc2 = audioCtx.createOscillator();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(800, audioCtx.currentTime + 0.1);
        osc2.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.2);
        const gain2 = audioCtx.createGain();
        gain2.gain.setValueAtTime(0.1, audioCtx.currentTime + 0.1);
        gain2.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
        osc2.start(audioCtx.currentTime + 0.1);
        osc2.stop(audioCtx.currentTime + 0.2);
    } else if (type === 'mismatch') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.2);
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
    }
}

// Cards setup
let cards = [];
const cols = CONFIG.game.cols;
const rows = CONFIG.game.rows;
const cardSize = CONFIG.game.cardSize;
const gap = CONFIG.game.gap;
const gridWidth = cols * cardSize + (cols - 1) * gap;
const gridHeight = rows * cardSize + (rows - 1) * gap;
const startX = (canvas.width - gridWidth) / 2;
const startY = (canvas.height - gridHeight) / 2 + 30;

let flippedCards = [];
let matchedPairs = 0;
let isAnimating = false;

function startGame() {
    initAudio();
    state = 'PLAYING';
    score = 0;
    timeElapsed = 0;
    matchedPairs = 0;
    flippedCards = [];
    isAnimating = false;
    
    // Setup emojis
    let neededPairs = (cols * rows) / 2;
    let selectedEmojis = CONFIG.emojis.slice(0, neededPairs);
    let deck = [...selectedEmojis, ...selectedEmojis];
    deck.sort(() => Math.random() - 0.5); // shuffle
    
    cards = [];
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            cards.push({
                x: startX + c * (cardSize + gap),
                y: startY + r * (cardSize + gap),
                w: cardSize,
                h: cardSize,
                emoji: deck.pop(),
                isFlipped: false,
                isMatched: false,
                flipAnim: 0 // 0 = back, 1 = front
            });
        }
    }
    
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeElapsed++;
    }, 1000);
}

function handleInput(x, y) {
    if (state !== 'PLAYING') {
        startGame();
        return;
    }
    
    if (isAnimating) return;
    
    for (let card of cards) {
        if (!card.isFlipped && !card.isMatched &&
            x > card.x && x < card.x + card.w &&
            y > card.y && y < card.y + card.h) {
            
            card.isFlipped = true;
            flippedCards.push(card);
            playSound('flip');
            
            if (flippedCards.length === 2) {
                score++;
                isAnimating = true;
                setTimeout(checkMatch, CONFIG.game.flipDelay);
            }
            break;
        }
    }
}

function checkMatch() {
    let c1 = flippedCards[0];
    let c2 = flippedCards[1];
    
    if (c1.emoji === c2.emoji) {
        c1.isMatched = true;
        c2.isMatched = true;
        matchedPairs++;
        playSound('match');
        
        if (matchedPairs === (cols * rows) / 2) {
            state = 'WIN';
            clearInterval(timerInterval);
            playSound('win');
            if (highScore === 0 || score < highScore) {
                highScore = score;
                localStorage.setItem('memory_match_highScore', highScore);
            }
        }
    } else {
        c1.isFlipped = false;
        c2.isFlipped = false;
        playSound('mismatch');
    }
    
    flippedCards = [];
    isAnimating = false;
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

let lastTime = performance.now();

function update(dt) {
    if (state !== 'PLAYING') return;
    
    for (let card of cards) {
        if (card.isFlipped || card.isMatched) {
            card.flipAnim = Math.min(1, card.flipAnim + dt/150);
        } else {
            card.flipAnim = Math.max(0, card.flipAnim - dt/150);
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let card of cards) {
        ctx.save();
        ctx.translate(card.x + card.w/2, card.y + card.h/2);
        
        // Flip effect scaling
        let scaleX = Math.abs(Math.cos(card.flipAnim * Math.PI));
        ctx.scale(scaleX, 1);
        
        ctx.beginPath();
        ctx.roundRect(-card.w/2, -card.h/2, card.w, card.h, 12);
        
        if (card.flipAnim > 0.5) {
            // Front
            ctx.fillStyle = card.isMatched ? 'rgba(16, 185, 129, 0.8)' : CONFIG.ui.cardFront;
            ctx.fill();
            ctx.font = `${card.w * 0.6}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(card.emoji, 0, 0);
        } else {
            // Back
            ctx.fillStyle = CONFIG.ui.cardBack;
            ctx.fill();
            ctx.strokeStyle = CONFIG.ui.glowColor;
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Back design
            ctx.fillStyle = CONFIG.ui.glowColor;
            ctx.font = `${card.w * 0.4}px "Fredoka"`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('?', 0, 0);
        }
        
        ctx.restore();
    }

    // UI
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 24px "Fredoka", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`步數: ${score}`, 15, 30);
    ctx.textAlign = 'center';
    ctx.fillText(`時間: ${timeElapsed}s`, canvas.width/2, 30);
    ctx.textAlign = 'right';
    if(highScore > 0) {
        ctx.fillText(`最佳: ${highScore}步`, canvas.width - 15, 30);
    } else {
        ctx.fillText(`最佳: --`, canvas.width - 15, 30);
    }

    if (state !== 'PLAYING') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if (state === 'START') {
            ctx.fillStyle = CONFIG.ui.primaryColor;
            ctx.font = 'bold 40px "Fredoka", sans-serif';
            ctx.fillText('翻牌記憶 🃏', canvas.width/2, canvas.height/2 - 30);
            ctx.fillStyle = '#fff';
            ctx.font = '20px "Fredoka", sans-serif';
            ctx.fillText('點擊螢幕開始', canvas.width/2, canvas.height/2 + 30);
        } else if (state === 'WIN') {
            ctx.fillStyle = '#10b981';
            ctx.font = 'bold 40px "Fredoka", sans-serif';
            ctx.fillText('🎉 恭喜破關！', canvas.width/2, canvas.height/2 - 30);
            ctx.fillStyle = '#fff';
            ctx.font = '20px "Fredoka", sans-serif';
            ctx.fillText(`共花費 ${score} 步，${timeElapsed} 秒`, canvas.width/2, canvas.height/2 + 10);
            ctx.fillText('點擊螢幕再玩一次', canvas.width/2, canvas.height/2 + 45);
        }
    }
}

function loop(timestamp) {
    let dt = timestamp - lastTime;
    lastTime = timestamp;
    update(dt);
    draw();
    requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
