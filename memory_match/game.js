const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
// Game coordinates stay fixed while the drawing buffer follows screen density.
const boardWidth = canvas.width, boardHeight = canvas.height;
const muteBtn = document.getElementById('muteBtn');

let state = 'START';
let score = 0; // Moves
let highScore = GameStorage.number('memory_match_highScore');
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
    audioCtx = GameAudio.context(); GameAudio.unlock();
}

function playSound(type) {
    GameAudio.effect(type);
}

// Cards setup
let cards = [];
const cols = CONFIG.game.cols;
const rows = CONFIG.game.rows;
const cardSize = CONFIG.game.cardSize;
const gap = CONFIG.game.gap;
const gridWidth = cols * cardSize + (cols - 1) * gap;
const gridHeight = rows * cardSize + (rows - 1) * gap;
const startX = (boardWidth - gridWidth) / 2;
const startY = (boardHeight - gridHeight) / 2 + 30;

let flippedCards = [];
let matchedPairs = 0;
let isAnimating = false;
let matchTimeout = null;

function startGame() {
    clearTimeout(matchTimeout);
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
    for (let i=deck.length-1;i>0;i--) { const j=Math.floor(Math.random()*(i+1)); [deck[i],deck[j]]=[deck[j],deck[i]]; }
    
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
        if (!GameShell.paused && state === 'PLAYING') timeElapsed++;
    }, 1000);
}

function handleInput(x, y) {
    if (GameShell.paused) return;
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
                matchTimeout = setTimeout(checkMatch, CONFIG.game.flipDelay);
            }
            break;
        }
    }
}

function checkMatch() {
    if (GameShell.paused) { matchTimeout=setTimeout(checkMatch,100); return; }
    if (state !== 'PLAYING' || flippedCards.length !== 2) return;
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
                GameStorage.set('memory_match_highScore', highScore);
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
    handleInput((e.clientX - rect.left) * (boardWidth / rect.width), (e.clientY - rect.top) * (boardHeight / rect.height));
});

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    initAudio();
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    handleInput((touch.clientX - rect.left) * (boardWidth / rect.width), (touch.clientY - rect.top) * (boardHeight / rect.height));
}, { passive: false });

let lastTime = performance.now();

function update(dt) {
    if (GameShell.paused) return;
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
    ctx.clearRect(0, 0, boardWidth, boardHeight);

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

    if (state === 'PLAYING' && cards[selectedCard]) {
        const selected = cards[selectedCard];
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 3;
        ctx.strokeRect(selected.x - 3, selected.y - 3, selected.w + 6, selected.h + 6);
    }
    // UI
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 24px "Fredoka", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`步數: ${score}`, 15, 30);
    ctx.textAlign = 'center';
    ctx.fillText(`時間: ${timeElapsed}s`, boardWidth/2, 30);
    ctx.textAlign = 'right';
    if(highScore > 0) {
        ctx.fillText(`最佳: ${highScore}步`, boardWidth - 15, 30);
    } else {
        ctx.fillText(`最佳: --`, boardWidth - 15, 30);
    }

    if (state !== 'PLAYING') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, boardWidth, boardHeight);
        
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if (state === 'START') {
            ctx.fillStyle = CONFIG.ui.primaryColor;
            ctx.font = 'bold 27px sans-serif';
            ctx.fillText('🦁 動物翻翻好朋友', boardWidth/2, boardHeight/2 - 30);
            ctx.fillStyle = '#fff';
            ctx.font = '20px "Fredoka", sans-serif';
            ctx.fillText('按空白鍵或點畫面開始', boardWidth/2, boardHeight/2 + 30);
        } else if (state === 'WIN') {
            ctx.fillStyle = '#10b981';
            ctx.font = 'bold 27px sans-serif';
            ctx.fillText('🎉 恭喜破關！', boardWidth/2, boardHeight/2 - 30);
            ctx.fillStyle = '#fff';
            ctx.font = '20px "Fredoka", sans-serif';
            ctx.fillText(`共花費 ${score} 步，${timeElapsed} 秒`, boardWidth/2, boardHeight/2 + 10);
            ctx.fillText('空白鍵再玩一次', boardWidth/2, boardHeight/2 + 45);
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

let selectedCard=0;
window.addEventListener('keydown',event=>{
    if(state!=='PLAYING')return;
    const row=Math.floor(selectedCard/cols),col=selectedCard%cols;
    if(event.code==='ArrowLeft')selectedCard=row*cols+(col+cols-1)%cols;
    if(event.code==='ArrowRight')selectedCard=row*cols+(col+1)%cols;
    if(event.code==='ArrowUp')selectedCard=((row+rows-1)%rows)*cols+col;
    if(event.code==='ArrowDown')selectedCard=((row+1)%rows)*cols+col;
    if(event.code==='Space'&&!event.repeat){const c=cards[selectedCard];handleInput(c.x+c.w/2,c.y+c.h/2);}
});

GameShell.register({status:()=>state,start:startGame,board:{width:boardWidth,height:boardHeight,draw}});
