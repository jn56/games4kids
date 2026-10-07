const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
// Keep gameplay coordinates independent of the screen drawing resolution.
const boardWidth = canvas.width, boardHeight = canvas.height;

// Game state variables
let gameState = 'START'; // START, PLAYING, GAME_OVER
let score = 0;
let highScore = GameStorage.number('stair_jump_high_score');
let survivalTime = 0;
let startTime = 0;

// Audio System setup
let audioCtx = null;
let isMuted = false;
let bgmTimeout = null;
let bgmStep = 0;
let currentBgmLevel = 1;

const muteBtn = document.getElementById('muteBtn');
muteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    isMuted = !isMuted;
    if (isMuted) {
        muteBtn.innerHTML = '🔇 聲音: 關';
        muteBtn.style.color = '#ef4444';
        muteBtn.style.borderColor = 'rgba(239, 68, 68, 0.4)';
        stopBGM();
    } else {
        muteBtn.innerHTML = '🔊 聲音: 開';
        muteBtn.style.color = '#f8fafc';
        muteBtn.style.borderColor = 'rgba(255, 255, 255, 0.15)';
        initAudio();
        if (gameState === 'PLAYING' && !GameShell.paused) {
            startBGM();
        }
    }
});

function initAudio() {
    audioCtx = GameAudio.context(); GameAudio.unlock();
}

// Universal unlock for Web Audio API on mobile/desktop
const unlockAudio = () => {
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
};
window.addEventListener('click', unlockAudio);
window.addEventListener('touchend', unlockAudio);

function playJumpSound() {
    GameAudio.effect('jump');
}

function playLandSound() {
    GameAudio.effect('land');
}

function playGameOverSound() {
    GameAudio.effect('over');
}

function playWinSound() {
    GameAudio.effect('win');
}

function playBgmStep() {
    // Music is scheduled by shared/audio.js.
}

function startBGM() {
    GameAudio.startMusic();
}

function stopBGM() {
    GameAudio.stopMusic();
}

// Screen shake effect
let shakeTime = 0;
let shakeIntensity = 0;

function triggerShake(intensity, duration) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    shakeIntensity = intensity;
    shakeTime = duration;
}

// Player configuration
const player = {
    x: 0,
    y: 0,
    width: CONFIG.player.width,
    height: CONFIG.player.height,
    vx: 0,
    vy: 0,
    speed: CONFIG.player.speed,
    gravity: CONFIG.player.gravity,
    jumpForce: CONFIG.player.jumpForce,
    isGrounded: false,
    colorStart: CONFIG.player.colorStart,
    colorEnd: CONFIG.player.colorEnd,
    glowColor: CONFIG.player.glowColor
};

// Platform configuration
let platforms = [];
const platformWidth = CONFIG.platform.baseWidth;
const platformHeight = CONFIG.platform.height;
const basePlatformSpeed = CONFIG.platform.baseSpeed;
let currentPlatformSpeed = basePlatformSpeed;
let lastLandedPlatform = null;

// Particle System
let particles = [];

function spawnParticles(x, y, color, count = 8) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 5,
            vy: (Math.random() - 0.5) * 4 - 1.5,
            size: Math.random() * 3 + 2,
            color: color,
            alpha: 1,
            decay: Math.random() * 0.02 + 0.015
        });
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;
        if (p.alpha <= 0) {
            particles.splice(i, 1);
        }
    }
}

function drawParticles() {
    particles.forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });
}

// Draw rounded rectangle helper
function drawRoundedRect(x, y, width, height, radius, fillStyle, strokeStyle, shadowColor, shadowBlur) {
    ctx.save();
    if (shadowColor && shadowBlur) {
        ctx.shadowColor = shadowColor;
        ctx.shadowBlur = shadowBlur;
    }
    ctx.fillStyle = fillStyle;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
    if (strokeStyle) {
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }
    ctx.restore();
}

// Keyboard inputs
const keys = {};
let jumpQueued = false;
window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (gameState === 'PLAYING' && !e.repeat && ['Space','ArrowUp'].includes(e.code)) jumpQueued = true;
    if (e.code === 'Space') {
        if (gameState === 'GAME_OVER' || gameState === 'WIN') {
            initAudio();
            initGame();
            gameState = 'PLAYING';
            keys['Space'] = false; // avoid accidental instant jump
        }
    }
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        if (gameState === 'START') {
            initAudio();
            initGame();
            gameState = 'PLAYING';
            keys['Space'] = false; // avoid accidental instant jump
        }
    }
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

// Touch inputs for mobile devices
let touchStartX = 0;
let touchStartY = 0;

function isTouchInBox(tx, ty, bx, by, bw, bh) {
    return tx >= bx && tx <= bx + bw && ty >= by && ty <= by + bh;
}

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    initAudio();
    if (gameState === 'START') {
        initGame();
        gameState = 'PLAYING';
        return;
    }
    if (gameState === 'GAME_OVER' || gameState === 'WIN') {
        initGame();
        gameState = 'PLAYING';
        return;
    }

    const rect = canvas.getBoundingClientRect();
    for (let i = 0; i < e.touches.length; i++) {
        const touch = e.touches[i];
        const touchX = (touch.clientX - rect.left) * (boardWidth / rect.width);
        const touchY = (touch.clientY - rect.top) * (boardHeight / rect.height);

        if (e.touches.length === 1) {
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
        }

        // Jump only if tapping inside Jump Zone (x: 10~390, y: 80~380)
        if (isTouchInBox(touchX, touchY, 10, 80, boardWidth - 20, 300)) {
            if (player.isGrounded) {
                player.vy = player.jumpForce;
                player.isGrounded = false;
                triggerShake(2, 4);
                spawnParticles(player.x + player.width / 2, player.y + player.height, player.colorStart, 10);
                playJumpSound();
            }
        }
    }
    updateTouchMovement(e);
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    if (e.touches.length === 1) {
        const touch = e.touches[0];
        const touchX = (touch.clientX - rect.left) * (boardWidth / rect.width);
        const touchY = (touch.clientY - rect.top) * (boardHeight / rect.height);

        // Swipe up only if inside Jump Zone
        const diffY = touch.clientY - touchStartY;
        if (diffY < -25 && isTouchInBox(touchX, touchY, 10, 80, boardWidth - 20, 300)) {
            if (player.isGrounded) {
                player.vy = player.jumpForce;
                player.isGrounded = false;
                triggerShake(2, 4);
                spawnParticles(player.x + player.width / 2, player.y + player.height, player.colorStart, 10);
                playJumpSound();
            }
            touchStartY = touch.clientY;
        }
    }
    updateTouchMovement(e);
}, { passive: false });

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    updateTouchMovement(e);
}, { passive: false });

canvas.addEventListener('touchcancel', (e) => {
    e.preventDefault();
    updateTouchMovement(e);
}, { passive: false });

function updateTouchMovement(e) {
    keys['ArrowLeft'] = false;
    keys['ArrowRight'] = false;

    if (gameState !== 'PLAYING' || GameShell.paused) return;

    const rect = canvas.getBoundingClientRect();
    for (let i = 0; i < e.touches.length; i++) {
        const touch = e.touches[i];
        const touchX = (touch.clientX - rect.left) * (boardWidth / rect.width);
        const touchY = (touch.clientY - rect.top) * (boardHeight / rect.height);

        // Left Zone: x: 10~190, y: 400~580
        if (isTouchInBox(touchX, touchY, 10, 400, 180, 180)) {
            keys['ArrowLeft'] = true;
        }
        // Right Zone: x: 210~390, y: 400~580
        if (isTouchInBox(touchX, touchY, 210, 400, 180, 180)) {
            keys['ArrowRight'] = true;
        }
    }
}

function initGame() {
    initAudio();
    gameState = 'PLAYING'; // 先將狀態設為播放中，否則 BGM 啟動時會因狀態不符而被 Return 阻擋
    startBGM();
    score = 0;
    survivalTime = 0;
    startTime = Date.now();
    currentPlatformSpeed = basePlatformSpeed;
    lastLandedPlatform = null;
    Object.keys(keys).forEach(key => keys[key] = false);
    jumpQueued = false;

    // Set initial player state
    player.x = boardWidth / 2 - player.width / 2;
    player.y = boardHeight - 150 - player.height;
    player.vx = 0;
    player.vy = basePlatformSpeed;
    player.isGrounded = true;

    // Generate starting platforms
    platforms = [];

    // Initial landing platform directly under player (width: 95)
    platforms.push({
        x: boardWidth / 2 - 95 / 2,
        y: boardHeight - 150,
        width: 95,
        height: platformHeight,
        speed: currentPlatformSpeed,
        colorStart: CONFIG.platform.colorStart,
        colorEnd: CONFIG.platform.colorEnd,
        glowColor: CONFIG.platform.glowColor
    });

    // Evenly spaced starting platforms (widths between 75 and 125)
    for (let y = boardHeight - 230; y > 0; y -= 80) {
        const w = platformWidth + Math.random() * 50;
        platforms.push({
            x: Math.random() * (boardWidth - w),
            y: y,
            width: w,
            height: platformHeight,
            speed: currentPlatformSpeed,
            colorStart: CONFIG.platform.colorStart,
            colorEnd: CONFIG.platform.colorEnd,
            glowColor: CONFIG.platform.glowColor
        });
    }

    particles = [];
}

function spawnNewPlatform(yPos) {
    const w = platformWidth + Math.random() * 50;
    platforms.unshift({
        x: Math.random() * (boardWidth - w),
        y: yPos,
        width: w,
        height: platformHeight,
        speed: currentPlatformSpeed,
        colorStart: CONFIG.platform.colorStart,
        colorEnd: CONFIG.platform.colorEnd,
        glowColor: CONFIG.platform.glowColor
    });
}

function update() {
    if (GameShell.paused) return;
    if (gameState !== 'PLAYING' || GameShell.paused) return;

    // 1. Calculate survival time
    survivalTime = Math.floor((Date.now() - startTime) / 1000);

    // 2. Increase platform speed gradually
    currentPlatformSpeed = basePlatformSpeed + Math.min(3.5, survivalTime * 0.05);

    // 3. Player horizontal movement
    if (keys['ArrowLeft'] || keys['KeyA']) {
        player.vx = -player.speed;
    } else if (keys['ArrowRight'] || keys['KeyD']) {
        player.vx = player.speed;
    } else {
        player.vx = 0;
    }
    player.x += player.vx;

    // Keep player within horizontal borders
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > boardWidth) player.x = boardWidth - player.width;

    // 4. Player vertical movement and gravity
    player.vy += player.gravity;
    player.y += player.vy;

    // 5. Move platforms down and handle spawning
    platforms.forEach(plat => {
        plat.y += currentPlatformSpeed;
        plat.speed = currentPlatformSpeed; // update internal speed
    });

    // Filter out platforms that fell off the screen
    platforms = platforms.filter(plat => plat.y < boardHeight);

    // Check if top-most platform has moved down enough to spawn a new one
    platforms.sort((a, b) => a.y - b.y);
    if (platforms.length === 0 || platforms[0].y > 70) {
        const spawnY = platforms.length > 0 ? platforms[0].y - 80 : -platformHeight;
        spawnNewPlatform(spawnY);
    }

    // 6. Collision detection (One-way collision: player falling down onto platform)
    let stoodOnPlatform = false;
    platforms.forEach(plat => {
        if (player.vy >= 0 &&
            player.x + player.width > plat.x &&
            player.x < plat.x + plat.width) {

            const oldBottom = player.y + player.height - player.vy;
            const newBottom = player.y + player.height;

            // Support landing if crossing the platform top line
            if (oldBottom <= plat.y + 4 && newBottom >= plat.y) {
                player.y = plat.y - player.height;
                player.vy = plat.speed; // Match vertical downward movement of platform

                if (!player.isGrounded) {
                    player.isGrounded = true;
                    triggerShake(3, 4);
                    spawnParticles(player.x + player.width / 2, player.y + player.height, '#10b981', 6);
                    playLandSound();

                    // Score increment if it's a new platform
                    if (lastLandedPlatform !== plat) {
                        score += CONFIG.game.scorePerPlatform;
                        lastLandedPlatform = plat;
                    }
                }
                stoodOnPlatform = true;
            }
        }
    });

    if (!stoodOnPlatform) {
        player.isGrounded = false;
    }

    // 7. Jump action
    if ((jumpQueued || keys['ArrowUp'] || keys['Space']) && player.isGrounded) {
        player.vy = player.jumpForce;
        player.isGrounded = false;
        triggerShake(2, 4);
        spawnParticles(player.x + player.width / 2, player.y + player.height, player.colorStart, 10);
        playJumpSound();
    }
    jumpQueued = false;

    // 7.5. Win Check
    if (score >= CONFIG.game.winScore && gameState !== 'WIN') {
        gameState = 'WIN';
        triggerShake(8, 10);
        spawnParticles(player.x + player.width / 2, player.y + player.height, '#f59e0b', 30);
        stopBGM();
        playWinSound();
        if (score > highScore) {
            highScore = score;
            GameStorage.set('stair_jump_high_score', highScore);
        }
    }

    // 8. Game Over Check
    if (player.y > boardHeight) {
        gameState = 'GAME_OVER';
        triggerShake(12, 15);
        spawnParticles(player.x + player.width / 2, boardHeight - 10, '#ef4444', 20);
        stopBGM();
        playGameOverSound();
        if (score > highScore) {
            highScore = score;
            GameStorage.set('stair_jump_high_score', highScore);
        }
    }

    // 9. Update particle effects
    updateParticles();
}

function draw() {
    ctx.clearRect(0, 0, boardWidth, boardHeight);

    // Save state for screen shake
    ctx.save();
    if (shakeTime > 0) {
        const dx = (Math.random() - 0.5) * shakeIntensity;
        const dy = (Math.random() - 0.5) * shakeIntensity;
        ctx.translate(dx, dy);
        shakeTime--;
    }

    // 1. Draw grid backdrop lines (sleek cyberpunk background grid)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
    ctx.lineWidth = 1;
    for (let x = 0; x < boardWidth; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, boardHeight);
        ctx.stroke();
    }
    for (let y = 0; y < boardHeight; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(boardWidth, y);
        ctx.stroke();
    }

    // 2. Draw platforms
    platforms.forEach(plat => {
        const platGrad = ctx.createLinearGradient(plat.x, plat.y, plat.x + plat.width, plat.y);
        platGrad.addColorStop(0, plat.colorStart);
        platGrad.addColorStop(1, plat.colorEnd);
        drawRoundedRect(
            plat.x, plat.y, plat.width, plat.height, 4,
            platGrad, 'rgba(255,255,255,0.1)',
            plat.glowColor, 8
        );
    });

    // 3. Draw player
    if (gameState === 'PLAYING' && !GameShell.paused) {
        const playerGrad = ctx.createLinearGradient(player.x, player.y, player.x + player.width, player.y + player.height);
        playerGrad.addColorStop(0, player.colorStart);
        playerGrad.addColorStop(1, player.colorEnd);
        drawRoundedRect(
            player.x, player.y, player.width, player.height, 6,
            playerGrad, 'rgba(255,255,255,0.15)',
            player.glowColor, 12
        );
        // Bunny details are decorative; the collision box stays the same.
        drawRoundedRect(player.x+3,player.y-9,5,12,3,'#e9d5ff',null,null,0);
        drawRoundedRect(player.x+player.width-8,player.y-9,5,12,3,'#e9d5ff',null,null,0);
        ctx.fillStyle='#302246';
        ctx.beginPath();ctx.arc(player.x+7,player.y+10,1.7,0,Math.PI*2);ctx.arc(player.x+player.width-7,player.y+10,1.7,0,Math.PI*2);ctx.fill();
        ctx.fillStyle='#fde2f1';
        ctx.beginPath();ctx.arc(player.x+player.width/2,player.y+14,1.8,0,Math.PI*2);ctx.fill();
    }

    // 4. Draw particles
    drawParticles();

    // Restore from screen shake translation
    ctx.restore();

    // 5. Draw HUD Overlay (Digital Dashboard style)
    if (gameState === 'PLAYING' && !GameShell.paused) {
        ctx.shadowBlur = 0; // disable shadows for crisp text

        // Score
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 18px "Outfit", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`分數：${score}`, 20, 35);

        // Time
        ctx.fillStyle = '#94a3b8';
        ctx.font = '14px "Outfit", sans-serif';
        ctx.fillText(`時間：${survivalTime} 秒`, 20, 55);

        // High score indicator
        ctx.textAlign = 'right';
        ctx.fillStyle = 'rgba(6, 182, 212, 0.7)';
        ctx.fillText(`最高：${highScore}`, boardWidth - 20, 35);
    }

    // 6. Draw start screen
    if (gameState === 'START') {
        // Background dark layer
        ctx.fillStyle = 'rgba(11, 15, 25, 0.85)';
        ctx.fillRect(0, 0, boardWidth, boardHeight);

        ctx.textAlign = 'center';

        // Neon Title
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 15;
        ctx.fillStyle = '#22d3ee';
        ctx.font = '800 36px "Outfit", sans-serif';
        ctx.fillText('兔兔跳上天', boardWidth / 2, boardHeight / 2 - 60);

        ctx.shadowColor = '#a855f7';
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#c084fc';
        ctx.font = '400 16px "Outfit", sans-serif';
        ctx.fillText('保持向上跳躍，避免掉落底部！', boardWidth / 2, boardHeight / 2 - 15);

        // Press to start
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 18px "Outfit", sans-serif';
        ctx.fillText('按 ［空格鍵］/［↑］ 或 點擊螢幕 開始', boardWidth / 2, boardHeight / 2 + 50);

        // Keyboard schema description
        ctx.fillStyle = '#64748b';
        ctx.font = '13px "Outfit", sans-serif';
        ctx.fillText('按 A/D、左右鍵，或觸控螢幕左右側移動', boardWidth / 2, boardHeight / 2 + 90);
    } else if (gameState === 'WIN') {
        // Dim background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, boardWidth, boardHeight);

        drawRoundedRect(
            40, boardHeight / 2 - 120, boardWidth - 80, 200, 16,
            'rgba(15, 23, 42, 0.95)',
            'rgba(245, 158, 11, 0.5)',
            'rgba(245, 158, 11, 0.5)', 20
        );

        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 32px "Outfit", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🎉 YOU WIN! 🎉', boardWidth / 2, boardHeight / 2 - 50);

        ctx.fillStyle = '#f8fafc';
        ctx.font = '20px "Outfit", sans-serif';
        ctx.fillText(`Score: ${score}`, boardWidth / 2, boardHeight / 2 - 10);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '16px "Outfit", sans-serif';
        ctx.fillText(`High Score: ${highScore}`, boardWidth / 2, boardHeight / 2 + 20);

        ctx.fillStyle = '#06b6d4';
        ctx.font = '14px "Outfit", sans-serif';
        ctx.fillText('Tap or press Space to play again', boardWidth / 2, boardHeight / 2 + 60);
    }

    // 7. Draw Game Over screen
    if (gameState === 'GAME_OVER') {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.fillRect(0, 0, boardWidth, boardHeight);

        ctx.textAlign = 'center';

        // Game Over Text
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 20;
        ctx.fillStyle = '#f87171';
        ctx.font = '800 40px "Outfit", sans-serif';
        ctx.fillText('GAME OVER', boardWidth / 2, boardHeight / 2 - 80);

        // Score Report
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 22px "Outfit", sans-serif';
        ctx.fillText(`最終得分: ${score}`, boardWidth / 2, boardHeight / 2 - 20);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '16px "Outfit", sans-serif';
        ctx.fillText(`生存時間: ${survivalTime} 秒`, boardWidth / 2, boardHeight / 2 + 10);

        if (score >= highScore && score > 0) {
            ctx.fillStyle = '#fbbf24';
            ctx.font = 'bold 16px "Outfit", sans-serif';
            ctx.fillText('🎉 創下個人新高紀錄！', boardWidth / 2, boardHeight / 2 + 45);
        }

        // Play Again instruction
        ctx.fillStyle = '#22d3ee';
        ctx.font = 'bold 18px "Outfit", sans-serif';
        ctx.fillText('按 ［空格鍵］ 或 點擊螢幕 重新開始', boardWidth / 2, boardHeight / 2 + 100);
    }
}

// Main Loop
function gameLoop() {
    requestAnimationFrame(gameLoop);
    const now=performance.now();
    if(!gameLoop.last)gameLoop.last=now;
    if(now-gameLoop.last>=1000/60){gameLoop.last=now-((now-gameLoop.last)%(1000/60));update();draw();}
}

// Start animation loop
gameLoop();

canvas.addEventListener("mousedown",()=>{if(gameState!=="PLAYING")initGame();});

GameShell.register({board:{width:boardWidth,height:boardHeight,draw:draw},status:()=>gameState,start:initGame,clear:()=>{jumpQueued=false;Object.keys(keys).forEach(k=>keys[k]=false);},resume:(elapsed)=>{startTime+=elapsed;}});
