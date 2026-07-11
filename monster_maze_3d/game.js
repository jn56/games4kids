// 3D 迷宮大冒險遊戲核心邏輯

// --- 遊戲狀態變數 ---
let currentLevelIndex = 0;
let gameState = 'START'; // START, PLAYING, LEVEL_COMPLETE, GAMEOVER, VICTORY
let score = 0;
let lives = CONFIG.player.maxLives;
let timeLeft = 0;
let stunCount = 0;
let totalTimeElapsed = 0;

let timerInterval = null;

// --- 終點與傳送門解鎖變數 ---
let exitC = 0;
let exitR = 0;
let level4StunPoints = 0;
let portalActive = true;

// --- 蜘蛛怪物與蛛絲系統 ---
let spiders = [];
let webs = [];  // 蜘蛛吐出的蛛絲飛行物
let playerWebSlowTime = 0; // 玩家被蛛絲黏住的剩餘減速時間 (毫秒)
let bgmInterval = null;
let bgmStep = 0;

// --- 輸入控制變數 ---
const keys = {
    KeyW: false, ArrowUp: false,
    KeyS: false, ArrowDown: false,
    KeyA: false, ArrowLeft: false,
    KeyD: false, ArrowRight: false,
    Space: false
};

// 行動裝置觸控狀態
const touchControls = {
    forward: false,
    backward: false,
    rotateLeft: false,
    rotateRight: false
};

// 射擊冷卻
let lastShootTime = 0;

// --- Three.js & Canvas 變數 ---
let scene, camera, renderer;
let clock;
let ambientLight = null;
let flashlight = null;
let flashlightTarget = null;
let mazeGrid = [];
let cols = 0;
let rows = 0;

// --- 紋理與精靈生成器 (透過 2D Canvas 與 Emojis 動態繪製) ---
function createHedgeTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    // 灌木叢深綠底色 (使用配置檔定義的深綠色，與第一關保持一致)
    ctx.fillStyle = CONFIG.theme.wallColor;
    ctx.fillRect(0, 0, 256, 256);
    
    // 繪製多重重疊的葉子 Emojis 🌿 🍃 (加入透明度 0.55 減少高亮刺眼度)
    ctx.font = '34px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.globalAlpha = 0.55;
    for (let i = 0; i < 35; i++) {
        const x = Math.random() * 256;
        const y = Math.random() * 256;
        ctx.fillText(Math.random() < 0.5 ? '🌿' : '🍃', x, y);
    }
    ctx.globalAlpha = 1.0;
    
    // 繪製綠色的邊框，讓迷宮格線的邊緣立體且清晰可見，方便看清走道
    ctx.strokeStyle = '#15803d';
    ctx.lineWidth = 14;
    ctx.strokeRect(0, 0, 256, 256);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.needsUpdate = true; // 強制更新紋理，避免 WebGL 渲染一片黑
    return texture;
}

function createGrassTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    // 地板改為深藍色底色 (原 #86efac 亮綠色)
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 256, 256);
    
    // 繪製微亮星星/光芒 Emojis ✨ 💫 代替原本的草叢植物 (降低透明度防止干擾視野)
    ctx.font = '28px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.globalAlpha = 0.35;
    for (let i = 0; i < 15; i++) {
        const x = Math.random() * 256;
        const y = Math.random() * 256;
        ctx.fillText(Math.random() < 0.5 ? '✨' : '💫', x, y);
    }
    ctx.globalAlpha = 1.0;
    
    // 繪製深藍色格線邊框，讓迷宮地板有清晰的板塊格線
    ctx.strokeStyle = '#1e3a8a';
    ctx.lineWidth = 10;
    ctx.strokeRect(0, 0, 256, 256);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.needsUpdate = true; // 強制更新紋理，避免 WebGL 渲染一片黑
    return texture;
}

function createEmojiSpriteTexture(emoji) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    
    ctx.font = '96px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, 64, 64);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true; // 強制更新紋理，避免 WebGL 渲染一片黑
    return texture;
}

// 3D 物件儲存
let wallsGroup = null;
let floorMesh = null;
let ceilingMesh = null;
let portalMesh = null;
let portalLight = null;
let sunMesh = null;        // 新增全域太陽精靈
let cloudsGroup = null;    // 新增全域雲朵組精靈
const monsters = [];
const projectiles = [];
const particles = [];

// 玩家屬性
const player = {
    x: 1.5,
    z: 1.5,
    angle: 0.0, // 旋轉視角 (弧度)
    invulnerable: false,
    invulnerableTime: 0
};

// 2D 小地圖
const minimapCanvas = document.getElementById('minimapCanvas');
const minimapCtx = minimapCanvas.getContext('2d');

// --- 音效與合成器 (Web Audio API) ---
let audioCtx = null;
let isMuted = false;

const muteBtn = document.getElementById('muteBtn');
muteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    isMuted = !isMuted;
    if (isMuted) {
        muteBtn.textContent = '🔇';
        muteBtn.style.background = 'rgba(255, 255, 255, 0.1)';
        stopBGM();
    } else {
        muteBtn.textContent = '🔊';
        muteBtn.style.background = 'rgba(14, 165, 233, 0.2)';
        initAudio();
        if (gameState === 'PLAYING') startBGM();
    }
});

function initAudio() {
    if (isMuted) return;
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

function playSound(type) {
    if (isMuted || !audioCtx) return;
    initAudio();
    const now = audioCtx.currentTime;
    
    if (type === 'shoot') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.15);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
    } else if (type === 'hit') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.setValueAtTime(1000, now + 0.05);
        osc.frequency.setValueAtTime(1200, now + 0.1);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
    } else if (type === 'damage') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.linearRampToValueAtTime(60, now + 0.3);
        gain.gain.setValueAtTime(0.45, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.3);
    } else if (type === 'win') {
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, idx) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.25, now + idx * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.15);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(now + idx * 0.1);
            osc.stop(now + idx * 0.1 + 0.15);
        });
    } else if (type === 'lose') {
        const notes = [300, 260, 220, 180];
        notes.forEach((freq, idx) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.25, now + idx * 0.15);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.15 + 0.2);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(now + idx * 0.15);
            osc.stop(now + idx * 0.15 + 0.2);
        });
    }
}

function startBGM() {
    if (isMuted) return;
    initAudio();
    stopBGM();
    bgmStep = 0;
    playBGMStep();
}

function stopBGM() {
    if (bgmInterval) {
        clearTimeout(bgmInterval);
        bgmInterval = null;
    }
}

function playBGMStep() {
    if (gameState !== 'PLAYING' || !audioCtx || isMuted) return;
    
    // 改為輕快、活潑的背景音樂節奏 (每拍 300ms)
    const noteDelay = 300; // ms
    let melody = [261.63, 329.63, 392.00, 523.25, 440.00, 392.00, 440.00, 392.00]; // C Major
    
    if (currentLevelIndex === 1) {
        melody = [349.23, 440.00, 523.25, 587.33, 523.25, 440.00, 392.00, 349.23]; // F Major
    } else if (currentLevelIndex === 2) {
        melody = [392.00, 493.88, 587.33, 783.99, 587.33, 493.88, 440.00, 392.00]; // G Major
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    // 使用 sine 製作歡樂音樂盒音色
    osc.type = 'sine';
    osc.frequency.value = melody[bgmStep % melody.length];
    
    // 調大背景音樂音量 (0.06) 讓音樂清晰輕快
    gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.0, audioCtx.currentTime + (noteDelay / 1000) * 0.95);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + (noteDelay / 1000) * 0.95);
    
    bgmStep++;
    bgmInterval = setTimeout(playBGMStep, noteDelay);
}


// --- 迷宮生成演算法 (DFS + 隨機打破牆壁以產生迴路) ---
function generateMaze(w, h) {
    const grid = [];
    for (let r = 0; r < h; r++) {
        const row = [];
        for (let c = 0; c < w; c++) {
            row.push(1); // 1 = 牆壁
        }
        grid.push(row);
    }

    const stack = [];
    const startX = 1;
    const startY = 1;
    grid[startY][startX] = 0; // 0 = 通道
    stack.push([startX, startY]);

    while (stack.length > 0) {
        const [cx, cy] = stack[stack.length - 1];
        const neighbors = [];
        
        // 上下左右走兩格
        const dirs = [
            [0, -2], [0, 2], [-2, 0], [2, 0]
        ];

        for (const [dx, dy] of dirs) {
            const nx = cx + dx;
            const ny = cy + dy;
            if (nx > 0 && nx < w - 1 && ny > 0 && ny < h - 1) {
                if (grid[ny][nx] === 1) {
                    neighbors.push([nx, ny, dx, dy]);
                }
            }
        }

        if (neighbors.length > 0) {
            // 隨機選一個未訪問的鄰居
            const [nx, ny, dx, dy] = neighbors[Math.floor(Math.random() * neighbors.length)];
            grid[cy + dy / 2][cx + dx / 2] = 0; // 打通中間的牆壁
            grid[ny][nx] = 0; // 打通目標點
            stack.push([nx, ny]);
        } else {
            stack.pop();
        }
    }

    // 隨機打破一些內部牆壁，產生迴路/走道 (Braid Maze) 讓主角可以繞路
    if (currentLevelIndex === 3) {
        // 第四關 (蜘蛛巢穴)：清除所有內牆，改成散落的 1x1 柱子作為掩體 (非迷宮，無連續牆壁)
        // 第一步：清空所有內部格子成通道 (0)
        for (let r = 1; r < h - 1; r++) {
            for (let c = 1; c < w - 1; c++) {
                grid[r][c] = 0;
            }
        }
        // 第二步：在偶數行、偶數列處以 45% 的機率放置獨立的 1x1 柱子牆壁作為掩體
        for (let r = 2; r < h - 1; r += 2) {
            for (let c = 2; c < w - 1; c += 2) {
                if (Math.random() < 0.45) {
                    grid[r][c] = 1;
                }
            }
        }
    } else {
        // 普通關卡：以 15% 的機率打通內牆，保持精緻的迷宮長廊
        for (let r = 1; r < h - 1; r++) {
            for (let c = 1; c < w - 1; c++) {
                if (grid[r][c] === 1) {
                    const pathLeft = (grid[r][c - 1] === 0);
                    const pathRight = (grid[r][c + 1] === 0);
                    const pathUp = (grid[r - 1][c] === 0);
                    const pathDown = (grid[r + 1][c] === 0);

                    if ((pathLeft && pathRight) || (pathUp && pathDown)) {
                        if (Math.random() < 0.15) {
                            grid[r][c] = 0;
                        }
                    }
                }
            }
        }
    }

    // 確保起點與終點是通暢的
    grid[1][1] = 0;
    grid[h - 2][w - 2] = 0;
    // 打通終點周圍，防止終點被牆包死
    grid[h - 2][w - 3] = 0;
    grid[h - 3][w - 2] = 0;

    return grid;
}

// 尋路 BFS：幫小怪物找出往玩家走的最短路徑 (返迴下一步格座標)
function getNextStepBFS(startGridX, startGridY, targetGridX, targetGridY) {
    if (startGridX === targetGridX && startGridY === targetGridY) {
        return { x: startGridX, y: startGridY };
    }

    const queue = [[startGridX, startGridY]];
    const visited = {};
    const key = (x, y) => `${x},${y}`;
    visited[key(startGridX, startGridY)] = null;
    let found = false;

    while (queue.length > 0) {
        const [cx, cy] = queue.shift();
        if (cx === targetGridX && cy === targetGridY) {
            found = true;
            break;
        }

        const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
        for (const [dx, dy] of dirs) {
            const nx = cx + dx;
            const ny = cy + dy;
            if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) {
                if (mazeGrid[ny][nx] === 0) {
                    const nKey = key(nx, ny);
                    if (!(nKey in visited)) {
                        visited[nKey] = [cx, cy];
                        queue.push([nx, ny]);
                    }
                }
            }
        }
    }

    if (!found) return null;

    // 回溯尋找下一步
    const path = [];
    let currKey = key(targetGridX, targetGridY);
    while (currKey !== null) {
        const parts = currKey.split(',');
        const px = parseInt(parts[0]);
        const py = parseInt(parts[1]);
        path.push({ x: px, y: py });
        const parent = visited[currKey];
        currKey = parent ? key(parent[0], parent[1]) : null;
    }

    path.reverse(); // 路徑：[起點, 下一步, ..., 終點]
    return path[1] || { x: startGridX, y: startGridY };
}


// --- 3D 物件生成輔助函數 ---

// 創建一個可愛的 3D 小怪物 (由漂浮球體與兩個眨眨大眼拼裝而成)
function createMonsterMesh() {
    const monsterGroup = new THREE.Group();

    // 1. 身體 (漂浮球)
    const bodyGeom = new THREE.SphereGeometry(CONFIG.monster.radius, 16, 16);
    const bodyMat = new THREE.MeshStandardMaterial({
        color: CONFIG.theme.monsterColor,
        roughness: 0.2,
        metalness: 0.1,
        emissive: CONFIG.theme.monsterColor,
        emissiveIntensity: 0.15
    });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    body.name = "body";
    monsterGroup.add(body);

    // 2. 眼睛
    const eyeGeom = new THREE.SphereGeometry(0.08, 8, 8);
    const pupilGeom = new THREE.SphereGeometry(0.04, 8, 8);
    
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x000000 });

    // 左眼
    const leftEye = new THREE.Mesh(eyeGeom, eyeMat);
    leftEye.position.set(-0.12, 0.08, 0.22);
    const leftPupil = new THREE.Mesh(pupilGeom, pupilMat);
    leftPupil.position.set(-0.12, 0.08, 0.28);
    monsterGroup.add(leftEye);
    monsterGroup.add(leftPupil);

    // 右眼
    const rightEye = new THREE.Mesh(eyeGeom, eyeMat);
    rightEye.position.set(0.12, 0.08, 0.22);
    const rightPupil = new THREE.Mesh(pupilGeom, pupilMat);
    rightPupil.position.set(0.12, 0.08, 0.28);
    monsterGroup.add(rightEye);
    monsterGroup.add(rightPupil);

    // 3. 觸角或頭頂發光物
    const hornGeom = new THREE.ConeGeometry(0.06, 0.2, 8);
    const hornMat = new THREE.MeshStandardMaterial({ color: 0xffea00, emissive: 0xffea00 });
    const horn = new THREE.Mesh(hornGeom, hornMat);
    horn.position.set(0, 0.35, 0);
    monsterGroup.add(horn);

    return monsterGroup;
}


// --- 遊戲邏輯與流程控制 ---

function initGameEngine() {
    // 設置 Three.js 場景
    const container = document.getElementById('viewport');
    
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(CONFIG.theme.skyColor, 0.15);

    // 獲取安全寬度與高度，防止在 file:// 或 iframe 中初次讀取為 0 導致 NaN 當機
    let width = container.clientWidth || window.innerWidth || 800;
    let height = container.clientHeight || window.innerHeight || 500;

    camera = new THREE.PerspectiveCamera(90, width / height, 0.1, 100);
    
    renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('canvas3d'), antialias: true });
    renderer.setSize(width, height);
    renderer.setClearColor(CONFIG.theme.skyColor);
    renderer.shadowMap.enabled = true;

    clock = new THREE.Clock();

    // 監聽視窗縮放
    window.addEventListener('resize', onWindowResize);

    // 設置鍵盤與觸控事件
    setupInputListeners();
}

function onWindowResize() {
    const container = document.getElementById('viewport');
    let width = container.clientWidth || window.innerWidth || 800;
    let height = container.clientHeight || window.innerHeight || 500;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}

function setupInputListeners() {
    window.addEventListener('keydown', (e) => {
        if (e.code in keys) {
            keys[e.code] = true;
        }
        if (e.code === 'Space') {
            e.preventDefault();
            if (gameState === 'START') {
                startGame(); // 按空白鍵直接開始冒險 (代替滑鼠點擊)
            } else if (gameState === 'LEVEL_COMPLETE') {
                nextLevel(); // 按空白鍵進入下一關 (代替滑鼠點擊)
            } else if (gameState === 'GAMEOVER') {
                retryLevel(); // 按空白鍵重新挑戰同一關 (代替滑鼠點擊)
            } else if (gameState === 'VICTORY') {
                startGame(); // 按空白鍵再玩一次 (代替滑鼠點擊)
            } else if (gameState === 'PLAYING') {
                fireProjectile(); // 遊戲中射擊光波
            }
        }
        if (e.code === 'KeyH') {
            togglePathHints(); // 按 H 切換路徑提示箭頭
        }
    });

    window.addEventListener('keyup', (e) => {
        if (e.code in keys) {
            keys[e.code] = false;
        }
    });

    // 綁定行動裝置按鈕
    const addTouch = (id, property) => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                touchControls[property] = true;
                initAudio();
            }, { passive: false });
            btn.addEventListener('touchend', (e) => {
                e.preventDefault();
                touchControls[property] = false;
            }, { passive: false });
        }
    };

    addTouch('btnForward', 'forward');
    addTouch('btnBackward', 'backward');
    addTouch('btnRotateLeft', 'rotateLeft');
    addTouch('btnRotateRight', 'rotateRight');

    const shootBtn = document.getElementById('btnShoot');
    if (shootBtn) {
        shootBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            fireProjectile();
            initAudio();
        }, { passive: false });
    }
}

// 建立關卡 3D 場景
function buildLevel() {
    const level = CONFIG.levels[currentLevelIndex];
    cols = level.cols;
    rows = level.rows;
    timeLeft = level.timeLimit;
    
    // 更新 HUD
    document.getElementById('levelNameBadge').textContent = level.name;
    document.getElementById('timeVal').textContent = timeLeft === 0 ? '∞' : timeLeft;
    
    // 清除舊有的 3D 物件和燈光，防止多次切換關卡導致光照無限疊加而讓牆壁變白/變淡
    if (wallsGroup) scene.remove(wallsGroup);
    if (floorMesh) scene.remove(floorMesh);
    if (ceilingMesh) scene.remove(ceilingMesh);
    if (portalMesh) scene.remove(portalMesh);
    if (portalLight) scene.remove(portalLight);
    if (sunMesh) scene.remove(sunMesh);
    if (cloudsGroup) scene.remove(cloudsGroup);
    if (ambientLight) { scene.remove(ambientLight); ambientLight = null; }
    if (flashlight) { scene.remove(flashlight); flashlight = null; }
    if (flashlightTarget) { scene.remove(flashlightTarget); flashlightTarget = null; }
    if (hintsGroup) {
        scene.remove(hintsGroup);
        hintsGroup = null;
    }
    showHints = false;
    lastPlayerGridX = -1;
    lastPlayerGridZ = -1;
    
    monsters.forEach(m => scene.remove(m.mesh));
    monsters.length = 0;
    spiders.forEach(s => scene.remove(s.mesh));
    spiders.length = 0;
    webs.forEach(w => scene.remove(w.mesh));
    webs.length = 0;
    playerWebSlowTime = 0;
    projectiles.forEach(p => scene.remove(p.mesh));
    projectiles.length = 0;

    // 動態更新渲染器的天藍色背景與霧氣
    if (renderer) renderer.setClearColor(CONFIG.theme.skyColor);
    if (scene) {
        scene.background = new THREE.Color(CONFIG.theme.skyColor);
        scene.fog = new THREE.FogExp2(CONFIG.theme.skyColor, 0.015); // 將霧氣濃度從 0.05 降為 0.015，避免大關卡遠處牆壁被藍色霧氣染白/褪色，保持深綠色
    }

    // 建立天空裝飾 (大太陽與白雲，幫助玩家定位方向)
    // 1. 太陽：放在 X 和 Z 正向的極遠高處 (當作指南針)
    const sunTexture = createEmojiSpriteTexture('🌞');
    const sunMaterial = new THREE.SpriteMaterial({ map: sunTexture, transparent: true });
    sunMesh = new THREE.Sprite(sunMaterial);
    sunMesh.scale.set(2.5, 2.5, 1);
    sunMesh.position.set(cols * 1.5, 8.5, rows * 1.5);
    scene.add(sunMesh);

    // 2. 雲朵群：隨機分佈在天空上空
    cloudsGroup = new THREE.Group();
    const cloudTexture = createEmojiSpriteTexture('☁️');
    const cloudMaterial = new THREE.SpriteMaterial({ map: cloudTexture, transparent: true, opacity: 0.85 });
    
    const cloudCount = Math.floor(Math.random() * 7) + 12; // 12-18 朵雲
    for (let i = 0; i < cloudCount; i++) {
        const cloudSprite = new THREE.Sprite(cloudMaterial);
        const size = Math.random() * 1.4 + 0.8;
        cloudSprite.scale.set(size, size * 0.55, 1); // 扁平可愛狀
        
        // 隨機分佈高度與範圍
        const cx = (Math.random() - 0.3) * cols * 1.6;
        const cy = Math.random() * 1.8 + 5.5;
        const cz = (Math.random() - 0.3) * rows * 1.6;
        
        cloudSprite.position.set(cx, cy, cz);
        cloudsGroup.add(cloudSprite);
    }
    scene.add(cloudsGroup);

    // 1. 生成 2D 迷宮矩陣
    mazeGrid = generateMaze(cols, rows);

    // 2. 建立 3D 地板 (使用動態生成的草地紋理，並帶有網格格線以清晰顯示走道)
    const grassTex = createGrassTexture();
    grassTex.repeat.set(cols, rows);
    const floorMat = new THREE.MeshStandardMaterial({
        map: grassTex,
        roughness: 0.8
    });
    const floorGeom = new THREE.PlaneGeometry(cols, rows);
    floorMesh = new THREE.Mesh(floorGeom, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.set(cols / 2, 0, rows / 2);
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    // 3. 建立灌木叢牆壁 (使用動態生成的葉子紋理，帶有深色外框，並添加小花小樹精靈)
    wallsGroup = new THREE.Group();
    const wallGeom = new THREE.BoxGeometry(1, 0.8, 1);
    
    const hedgeTex = createHedgeTexture();
    const wallMat = new THREE.MeshStandardMaterial({
        map: hedgeTex,
        roughness: 0.8,
        metalness: 0.0
    });

    const neonLineMat = new THREE.LineBasicMaterial({ color: CONFIG.theme.wallWireColor });
    const edges = new THREE.EdgesGeometry(wallGeom); // 移至外部，避免重複創建造成 WebGL 崩潰
    
    // 預先生成小樹的紋理與材質（移至外部以大幅節省材質編譯開銷）
    const treeEmojis = ['🌳', '🌲', '🌴'];
    const treeTextures = treeEmojis.map(emoji => createEmojiSpriteTexture(emoji));
    const treeMaterials = treeTextures.map(tex => new THREE.SpriteMaterial({ map: tex, transparent: true }));

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (mazeGrid[r][c] === 1) {
                // 灌木叢方塊牆壁
                const wall = new THREE.Mesh(wallGeom, wallMat);
                wall.position.set(c + 0.5, 0.4, r + 0.5);
                wall.castShadow = true;
                wall.receiveShadow = true;
                wallsGroup.add(wall);

                // 邊緣線條，讓灌木叢方塊輪廓清晰
                const line = new THREE.LineSegments(edges, neonLineMat);
                line.position.copy(wall.position);
                wallsGroup.add(line);

                // 有 25% 的機率在灌木叢頂部生長出一棵 3D 小樹精靈 (共享材質)
                if (Math.random() < 0.25) {
                    const spriteMat = treeMaterials[Math.floor(Math.random() * treeMaterials.length)];
                    const treeSprite = new THREE.Sprite(spriteMat);
                    treeSprite.scale.set(0.65, 0.65, 1);
                    treeSprite.position.set(c + 0.5, 1.05, r + 0.5); // 放在 0.8 高牆的上方
                    wallsGroup.add(treeSprite);
                }
            }
        }
    }
    scene.add(wallsGroup);

    // 4. 建立終點傳送門 (前三關直接生成；第四關需擊暈 20 隻怪物後才隨機生成)
    if (currentLevelIndex !== 3) {
        exitC = cols - 2;
        exitR = rows - 2;
        portalActive = true;
        createPortalMeshAndLight(exitC, exitR);
    } else {
        exitC = -1;
        exitR = -1;
        portalActive = false;
        level4StunPoints = 0;
        // 更新關卡徽章名稱，顯示擊暈門檻進度
        document.getElementById('levelNameBadge').textContent = `${level.name} (門: 0/20)`;
    }

    // 5. 初始化玩家位置與朝向 (確保面對通道，而非牆面)
    player.x = 1.5;
    player.z = 1.5;
    
    // 檢測東側 (row 1, col 2) 或南側 (row 2, col 1) 哪一個是走道 (0)
    if (mazeGrid[1][2] === 0) {
        player.angle = 0.0; // 東邊是通道，面向右方 (+X)
    } else if (mazeGrid[2][1] === 0) {
        player.angle = Math.PI / 2; // 南邊是通道，面向下方 (+Z)
    } else {
        player.angle = 0.0; // 預設防呆
    }
    
    player.invulnerable = false;
    player.invulnerableTime = 0;
    updateCamera();

    // 6. 生成小怪物
    spawnMonsters(level.monsterCount);

    // 6b. 生成蜘蛛 (第四關及以後)
    if (level.spiderCount && level.spiderCount > 0) {
        spawnSpiders(level.spiderCount);
    }

    // 7. 設置關卡燈光
    setupLights();

    // 8. 顯示關卡開始公告
    showLevelAnnouncement(level.name);
}

function setupLights() {
    // 全域明亮的陽光環境光 (從 0.15 加強至 0.8)，營造明亮的花園氛圍
    ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    // 玩家手電筒 (SpotLight)：作為溫和的輔助補光 (強度從 1.8 減弱至 0.5)
    flashlight = new THREE.SpotLight(0xffffff, 0.5, 12, Math.PI / 5, 0.5, 1);
    flashlight.castShadow = true;
    flashlight.shadow.mapSize.width = 512;
    flashlight.shadow.mapSize.height = 512;
    flashlight.name = "flashlight";
    scene.add(flashlight);

    // 手電筒目標，用於定向
    flashlightTarget = new THREE.Object3D();
    flashlightTarget.name = "flashlightTarget";
    scene.add(flashlightTarget);
    flashlight.target = flashlightTarget;
}

function spawnMonsters(count) {
    const level = CONFIG.levels[currentLevelIndex];
    let spawned = 0;
    let attempts = 0;

    // 找出所有可以生成怪物的空地板格子，且距離玩家要有一段安全距離
    while (spawned < count && attempts < 200) {
        attempts++;
        const gx = Math.floor(Math.random() * (cols - 2)) + 1;
        const gz = Math.floor(Math.random() * (rows - 2)) + 1;

        if (mazeGrid[gz][gx] === 0) {
            // 計算與玩家初始位置 (1.5, 1.5) 的歐幾里得距離
            const dx = (gx + 0.5) - player.x;
            const dz = (gz + 0.5) - player.z;
            const dist = Math.sqrt(dx*dx + dz*dz);

            if (dist > CONFIG.monster.spawnSafeRange) {
                const mesh = createMonsterMesh();
                mesh.position.set(gx + 0.5, 0.4, gz + 0.5);
                scene.add(mesh);

                monsters.push({
                    mesh: mesh,
                    x: gx + 0.5,
                    z: gz + 0.5,
                    targetX: gx + 0.5,
                    targetZ: gz + 0.5,
                    state: 'PATROL', // PATROL, CHASE, STUNNED
                    stunTime: 0,
                    patrolCooldown: 0,
                    bobOffset: Math.random() * Math.PI * 2 // 隨機漂浮起點
                });
                spawned++;
            }
        }
    }
}

// 創建一個 3D 蜘蛛怪物 (深紫色球體 + 8 條細長蜘蛛腿 + 紅色眼睛)
function createSpiderMesh() {
    const spiderGroup = new THREE.Group();

    // 1. 身體 (扁平橢球)
    const bodyGeom = new THREE.SphereGeometry(CONFIG.spider.radius, 16, 12);
    const bodyMat = new THREE.MeshStandardMaterial({
        color: CONFIG.theme.spiderColor,
        roughness: 0.3,
        metalness: 0.2,
        emissive: CONFIG.theme.spiderColor,
        emissiveIntensity: 0.2
    });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    body.scale.set(1, 0.6, 1.2); // 壓扁成蜘蛛體型
    body.name = "body";
    spiderGroup.add(body);

    // 2. 紅色眼睛 (6 個小紅點)
    const eyeGeom = new THREE.SphereGeometry(0.04, 6, 6);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const eyePositions = [
        [-0.1, 0.05, 0.32], [0.1, 0.05, 0.32],
        [-0.16, 0.08, 0.28], [0.16, 0.08, 0.28],
        [-0.06, 0.1, 0.30], [0.06, 0.1, 0.30]
    ];
    for (const [ex, ey, ez] of eyePositions) {
        const eye = new THREE.Mesh(eyeGeom, eyeMat);
        eye.position.set(ex, ey, ez);
        spiderGroup.add(eye);
    }

    // 3. 八條蜘蛛腿 (使用圓柱體)
    const legGeom = new THREE.CylinderGeometry(0.02, 0.015, 0.55, 6);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x2d1b4e, roughness: 0.5 });
    const legAngles = [-0.7, -0.35, 0.35, 0.7]; // 前後四個角度
    for (let side = -1; side <= 1; side += 2) { // 左右兩側
        for (const angle of legAngles) {
            const leg = new THREE.Mesh(legGeom, legMat);
            leg.position.set(side * 0.25, -0.05, angle * 0.4);
            leg.rotation.z = side * 0.8; // 向外張開
            leg.rotation.x = angle * 0.3;
            spiderGroup.add(leg);
        }
    }

    // 4. 頂部蛛絲標誌 (小白球)
    const silkGeom = new THREE.SphereGeometry(0.06, 8, 8);
    const silkMat = new THREE.MeshBasicMaterial({ color: CONFIG.theme.spiderWebColor, transparent: true, opacity: 0.7 });
    const silkBall = new THREE.Mesh(silkGeom, silkMat);
    silkBall.position.set(0, -0.2, -0.35);
    spiderGroup.add(silkBall);

    return spiderGroup;
}

function spawnSpiders(count) {
    let spawned = 0;
    let attempts = 0;

    while (spawned < count && attempts < 200) {
        attempts++;
        const gx = Math.floor(Math.random() * (cols - 2)) + 1;
        const gz = Math.floor(Math.random() * (rows - 2)) + 1;

        if (mazeGrid[gz][gx] === 0) {
            const dx = (gx + 0.5) - player.x;
            const dz = (gz + 0.5) - player.z;
            const dist = Math.sqrt(dx*dx + dz*dz);

            if (dist > CONFIG.monster.spawnSafeRange + 2) { // 蜘蛛生成距離更遠一些
                const mesh = createSpiderMesh();
                mesh.position.set(gx + 0.5, 0.3, gz + 0.5);
                scene.add(mesh);

                spiders.push({
                    mesh: mesh,
                    x: gx + 0.5,
                    z: gz + 0.5,
                    targetX: gx + 0.5,
                    targetZ: gz + 0.5,
                    state: 'PATROL',
                    stunTime: 0,
                    patrolCooldown: 0,
                    bobOffset: Math.random() * Math.PI * 2,
                    lastWebTime: 0 // 上次吐絲時間
                });
                spawned++;
            }
        }
    }
}

function showLevelAnnouncement(name) {
    const ann = document.getElementById('levelAnn');
    const title = document.getElementById('levelAnnTitle');
    
    title.textContent = name;
    ann.classList.add('show-ann');
    
    setTimeout(() => {
        ann.classList.remove('show-ann');
    }, 2500);
}

// 發射眩光波
function fireProjectile() {
    if (gameState !== 'PLAYING') return;

    const now = performance.now();
    if (now - lastShootTime < CONFIG.projectile.cooldown) return;

    lastShootTime = now;
    playSound('shoot');

    // 計算發射向量 (相機面對的方向)
    const dirX = Math.cos(player.angle);
    const dirZ = Math.sin(player.angle);

    // 創建發光紅光球球
    const projGeom = new THREE.SphereGeometry(CONFIG.projectile.radius, 8, 8);
    const projMat = new THREE.MeshBasicMaterial({ color: CONFIG.theme.shootColor });
    const mesh = new THREE.Mesh(projGeom, projMat);

    // 發射起點 (固定高度 0.5，對齊小怪物與蜘蛛的身體中心，便於俯視觀察)
    mesh.position.set(player.x, 0.5, player.z);
    scene.add(mesh);

    projectiles.push({
        mesh: mesh,
        x: player.x,
        z: player.z,
        vx: dirX * CONFIG.projectile.speed,
        vz: dirZ * CONFIG.projectile.speed,
        distanceTraveled: 0
    });
}


// --- 核心更新邏輯 ---

function update(delta) {
    if (gameState !== 'PLAYING') return;

    // 1. 更新玩家無敵時間
    if (player.invulnerable) {
        player.invulnerableTime -= delta * 1000;
        if (player.invulnerableTime <= 0) {
            player.invulnerable = false;
        }
    }

    // 2. 處理玩家控制與碰撞
    handlePlayerMovement(delta);

    // 更新路徑提示箭頭 (若啟用了提示，且玩家走到了新格子)
    if (showHints) {
        const pGridX = Math.floor(player.x);
        const pGridZ = Math.floor(player.z);
        if (pGridX !== lastPlayerGridX || pGridZ !== lastPlayerGridZ) {
            lastPlayerGridX = pGridX;
            lastPlayerGridZ = pGridZ;
            generatePathHints(pGridX, pGridZ);
        }
    }

    // 3. 更新光球發射軌跡與碰撞
    updateProjectiles(delta);

    // 3b. 更新蛛絲飛行物
    updateWebs(delta);

    // 3c. 更新玩家蛛絲減速狀態
    if (playerWebSlowTime > 0) {
        playerWebSlowTime -= delta * 1000;
        if (playerWebSlowTime < 0) playerWebSlowTime = 0;
    }

    // 4. 更新小怪物 AI 與漂浮動畫
    updateMonsters(delta, performance.now() / 1000);

    // 4b. 更新蜘蛛 AI 與吐絲攻擊
    updateSpiders(delta, performance.now() / 1000);

    // 5. 更新粒子系統
    updateParticles(delta);

    // 6. 更新手電筒燈光位置
    updateLights();

    // 7. 檢測是否到達出口傳送門
    checkPortalCollision();
}

function handlePlayerMovement(delta) {
    let moveF = 0;
    let rotate = 0;

    // 鍵盤操控
    if (keys.KeyW || keys.ArrowUp) moveF += 1;
    if (keys.KeyS || keys.ArrowDown) moveF -= 1;
    if (keys.KeyA || keys.ArrowLeft) rotate -= 1;
    if (keys.KeyD || keys.ArrowRight) rotate += 1;

    // 行動裝置按鈕操控
    if (touchControls.forward) moveF += 1;
    if (touchControls.backward) moveF -= 1;
    if (touchControls.rotateLeft) rotate -= 1;
    if (touchControls.rotateRight) rotate += 1;

    // 旋轉視角
    if (rotate !== 0) {
        player.angle += rotate * CONFIG.player.rotateSpeed * delta;
        // 正規化角度
        player.angle = (player.angle + Math.PI * 2) % (Math.PI * 2);
    }

    // 移動位置
    if (moveF !== 0) {
        let speed = CONFIG.player.speed * delta;
        // 被蛛絲黏住時減速
        if (playerWebSlowTime > 0) {
            speed *= CONFIG.spider.webSlowFactor;
        }
        const dx = Math.cos(player.angle) * moveF * speed;
        const dz = Math.sin(player.angle) * moveF * speed;

        const nextX = player.x + dx;
        const nextZ = player.z + dz;

        // AABB 碰撞檢測：允許沿著牆壁滑動
        const pRadius = CONFIG.player.radius;

        // 1. 檢測 X 軸碰撞
        if (!checkWallCollision(nextX, player.z, pRadius)) {
            player.x = nextX;
        }
        // 2. 檢測 Z 軸碰撞
        if (!checkWallCollision(player.x, nextZ, pRadius)) {
            player.z = nextZ;
        }
    }

    // 更新相機位置與方向
    updateCamera();
}

function checkWallCollision(px, pz, radius) {
    // 找出玩家碰撞範圍涵蓋的迷宮格線
    const minGridX = Math.floor(px - radius);
    const maxGridX = Math.floor(px + radius);
    const minGridZ = Math.floor(pz - radius);
    const maxGridZ = Math.floor(pz + radius);

    // 若超出邊界視同碰撞
    if (minGridX < 0 || maxGridX >= cols || minGridZ < 0 || maxGridZ >= rows) return true;

    for (let r = minGridZ; r <= maxGridZ; r++) {
        for (let c = minGridX; c <= maxGridX; c++) {
            if (mazeGrid[r][c] === 1) {
                // 牆壁是一個 1x1 的正方形，圓心在 (c+0.5, r+0.5)
                // 精確的圓與正方形 AABB 碰撞
                const wallX = c + 0.5;
                const wallZ = r + 0.5;

                const closestX = Math.max(c, Math.min(px, c + 1));
                const closestZ = Math.max(r, Math.min(pz, r + 1));

                const distStrX = px - closestX;
                const distStrZ = pz - closestZ;
                const distance = Math.sqrt(distStrX * distStrX + distStrZ * distStrZ);

                if (distance < radius) {
                    return true; // 發生碰撞
                }
            }
        }
    }
    return false;
}

function updateCamera() {
    camera.position.set(player.x, CONFIG.player.height, player.z);
    
    // 計算焦點 (相機面對的方向) - 微微向下偏 0.15，適配新的身高，形成微微的俯視視角
    const lookX = player.x + Math.cos(player.angle);
    const lookZ = player.z + Math.sin(player.angle);
    camera.lookAt(lookX, CONFIG.player.height - 0.15, lookZ);
}

function updateLights() {
    const flashlight = scene.getObjectByName("flashlight");
    const target = scene.getObjectByName("flashlightTarget");

    if (flashlight && target) {
        flashlight.position.copy(camera.position);
        
        // 燈光照向相機偏下方正前方 (照向相機傾斜的角度，距離為 3 格，故高度調降 0.15 * 3 = 0.45)
        const lookX = player.x + Math.cos(player.angle) * 3;
        const lookZ = player.z + Math.sin(player.angle) * 3;
        target.position.set(lookX, CONFIG.player.height - 0.45, lookZ);
    }
}

function updateProjectiles(delta) {
    const speed = CONFIG.projectile.speed;
    const maxRange = CONFIG.projectile.maxRange;

    for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        p.x += p.vx * delta;
        p.z += p.vz * delta;
        p.distanceTraveled += speed * delta;

        p.mesh.position.set(p.x, 0.5, p.z);

        // 1. 射程耗盡
        if (p.distanceTraveled >= maxRange) {
            scene.remove(p.mesh);
            projectiles.splice(i, 1);
            continue;
        }

        // 2. 撞擊牆壁
        const gX = Math.floor(p.x);
        const gZ = Math.floor(p.z);
        if (gX < 0 || gX >= cols || gZ < 0 || gZ >= rows || mazeGrid[gZ][gX] === 1) {
            // 在撞擊處產生火花粒子
            spawnSparkParticles(p.x, 0.5, p.z, CONFIG.theme.shootColor);
            scene.remove(p.mesh);
            projectiles.splice(i, 1);
            continue;
        }

        // 3. 撞擊小怪物
        let hitMonster = false;
        for (const m of monsters) {
            if (m.state === 'STUNNED') continue;

            const dx = p.x - m.x;
            const dz = p.z - m.z;
            const dist = Math.sqrt(dx*dx + dz*dz);

            if (dist < CONFIG.monster.radius + CONFIG.projectile.radius) {
                stunMonster(m);
                spawnSparkParticles(m.x, 0.4, m.z, "#ffff00", 15);
                scene.remove(p.mesh);
                projectiles.splice(i, 1);
                hitMonster = true;
                break;
            }
        }
        if (hitMonster) continue;

        // 4. 撞擊蜘蛛
        let hitSpider = false;
        for (const s of spiders) {
            if (s.state === 'STUNNED') continue;

            const dx = p.x - s.x;
            const dz = p.z - s.z;
            const dist = Math.sqrt(dx*dx + dz*dz);

            if (dist < CONFIG.spider.radius + CONFIG.projectile.radius) {
                // 擊暈蜘蛛！
                s.state = 'STUNNED';
                s.stunTime = CONFIG.spider.stunDuration;
                playSound('hit');
                stunCount++;
                document.getElementById('stunCountVal').textContent = stunCount;
                const body = s.mesh.getObjectByName("body");
                if (body) {
                    body.material.color.set(CONFIG.theme.monsterStunColor);
                    body.material.emissive.set(CONFIG.theme.monsterStunColor);
                }
                spawnSparkParticles(s.x, 0.3, s.z, "#c084fc", 15);
                scene.remove(p.mesh);
                projectiles.splice(i, 1);
                hitSpider = true;

                // 檢查第四關傳送門解鎖進度 (擊暈蜘蛛怪物算 2 點)
                checkLevel4PortalUnlock(2);
                break;
            }
        }
        if (hitSpider) continue;
    }
}

function stunMonster(m) {
    m.state = 'STUNNED';
    m.stunTime = CONFIG.monster.stunDuration;
    playSound('hit');
    stunCount++;
    document.getElementById('stunCountVal').textContent = stunCount;

    // 將怪物的顏色轉成暈眩藍色，並加強發光
    const body = m.mesh.getObjectByName("body");
    if (body) {
        body.material.color.set(CONFIG.theme.monsterStunColor);
        body.material.emissive.set(CONFIG.theme.monsterStunColor);
    }

    // 檢查第四關傳送門解鎖進度 (擊暈普通怪物算 1 點)
    checkLevel4PortalUnlock(1);
}

function updateMonsters(delta, totalTime) {
    const pGridX = Math.floor(player.x);
    const pGridY = Math.floor(player.z);

    for (const m of monsters) {
        const body = m.mesh.getObjectByName("body");

        // 1. 處理眩暈狀態
        if (m.state === 'STUNNED') {
            m.stunTime -= delta * 1000;
            
            // 暈眩動畫：瘋狂自轉 + 縮小震動
            m.mesh.rotation.y += 12 * delta;
            
            // 星星粒子效果 (偶爾產生一格)
            if (Math.random() < 0.15) {
                spawnSparkParticles(m.x, 0.7, m.z, "#ffeb3b", 1);
            }

            if (m.stunTime <= 0) {
                // 解除暈眩
                m.state = 'PATROL';
                m.mesh.rotation.y = 0;
                if (body) {
                    body.material.color.set(CONFIG.theme.monsterColor);
                    body.material.emissive.set(CONFIG.theme.monsterColor);
                }
            }
            // 眩暈時不移動
            continue;
        }

        // 2. 判斷與玩家的距離
        const dx = player.x - m.x;
        const dz = player.z - m.z;
        const distToPlayer = Math.sqrt(dx*dx + dz*dz);

        // 如果在視野內且沒暈眩，進入追逐狀態
        if (distToPlayer < CONFIG.monster.detectRange) {
            m.state = 'CHASE';
        } else if (m.state === 'CHASE' && distToPlayer > CONFIG.monster.detectRange + 2) {
            // 距離拉得很遠，退回巡邏狀態
            m.state = 'PATROL';
        }

        // 3. 移動邏輯：每次走滿一格
        const distToTarget = Math.sqrt((m.targetX - m.x)**2 + (m.targetZ - m.z)**2);
        
        if (distToTarget < 0.05) {
            // 已經走到目標格，決定下一步
            m.x = m.targetX;
            m.z = m.targetZ;
            m.mesh.position.x = m.x;
            m.mesh.position.z = m.z;

            const mGridX = Math.floor(m.x);
            const mGridY = Math.floor(m.z);

            if (m.state === 'CHASE') {
                // 追擊玩家：利用 BFS 找出下一個前進格
                const nextStep = getNextStepBFS(mGridX, mGridY, pGridX, pGridY);
                if (nextStep) {
                    m.targetX = nextStep.x + 0.5;
                    m.targetZ = nextStep.y + 0.5;
                }
            } else {
                // 巡邏狀態：隨機上下左右選一條通道走
                m.patrolCooldown -= delta;
                if (m.patrolCooldown <= 0) {
                    const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
                    const validDirs = [];
                    for (const [dx, dy] of dirs) {
                        const nx = mGridX + dx;
                        const ny = mGridY + dy;
                        if (nx >= 0 && nx < cols && ny >= 0 && ny < rows && mazeGrid[ny][nx] === 0) {
                            validDirs.push({ x: nx + 0.5, z: ny + 0.5 });
                        }
                    }
                    if (validDirs.length > 0) {
                        const selected = validDirs[Math.floor(Math.random() * validDirs.length)];
                        m.targetX = selected.x;
                        m.targetZ = selected.z;
                    }
                    m.patrolCooldown = Math.random() * 2 + 1; // 1~3秒巡邏決策冷卻
                }
            }
        } else {
            // 朝目標平滑移動
            const currentSpeed = m.state === 'CHASE' ? CONFIG.monster.chaseSpeed : CONFIG.monster.speed;
            const step = currentSpeed * delta;
            
            const mx = m.targetX - m.x;
            const mz = m.targetZ - m.z;
            const length = Math.sqrt(mx*mx + mz*mz);
            
            m.x += (mx / length) * step;
            m.z += (mz / length) * step;
            
            m.mesh.position.x = m.x;
            m.mesh.position.z = m.z;

            // 讓怪物朝向移動的方向
            m.mesh.lookAt(m.targetX, m.mesh.position.y, m.targetZ);
        }

        // 4. 浮空上下擺動動畫 (可愛感)
        m.mesh.position.y = 0.4 + Math.sin(totalTime * 4.0 + m.bobOffset) * 0.08;

        // 5. 碰觸玩家受傷檢測
        if (distToPlayer < CONFIG.monster.radius + CONFIG.player.radius) {
            triggerPlayerDamage();
        }
    }
}

// --- 蜘蛛 AI 與吐絲攻擊系統 ---
function updateSpiders(delta, totalTime) {
    const pGridX = Math.floor(player.x);
    const pGridY = Math.floor(player.z);
    const now = performance.now();

    for (const s of spiders) {
        const body = s.mesh.getObjectByName("body");

        // 1. 處理眩暈狀態
        if (s.state === 'STUNNED') {
            s.stunTime -= delta * 1000;
            s.mesh.rotation.y += 10 * delta;
            if (Math.random() < 0.12) {
                spawnSparkParticles(s.x, 0.5, s.z, "#c084fc", 1);
            }
            if (s.stunTime <= 0) {
                s.state = 'PATROL';
                s.mesh.rotation.y = 0;
                if (body) {
                    body.material.color.set(CONFIG.theme.spiderColor);
                    body.material.emissive.set(CONFIG.theme.spiderColor);
                }
            }
            continue;
        }

        // 2. 判斷與玩家的距離
        const dx = player.x - s.x;
        const dz = player.z - s.z;
        const distToPlayer = Math.sqrt(dx*dx + dz*dz);

        if (distToPlayer < CONFIG.spider.detectRange) {
            s.state = 'CHASE';
        } else if (s.state === 'CHASE' && distToPlayer > CONFIG.spider.detectRange + 2) {
            s.state = 'PATROL';
        }

        // 3. 移動邏輯 (與普通怪物相似，但速度不同)
        const distToTarget = Math.sqrt((s.targetX - s.x)**2 + (s.targetZ - s.z)**2);

        if (distToTarget < 0.05) {
            s.x = s.targetX;
            s.z = s.targetZ;
            s.mesh.position.x = s.x;
            s.mesh.position.z = s.z;

            const sGridX = Math.floor(s.x);
            const sGridY = Math.floor(s.z);

            if (s.state === 'CHASE') {
                const nextStep = getNextStepBFS(sGridX, sGridY, pGridX, pGridY);
                if (nextStep) {
                    s.targetX = nextStep.x + 0.5;
                    s.targetZ = nextStep.y + 0.5;
                }
            } else {
                s.patrolCooldown -= delta;
                if (s.patrolCooldown <= 0) {
                    const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
                    const validDirs = [];
                    for (const [ddx, ddy] of dirs) {
                        const nx = sGridX + ddx;
                        const ny = sGridY + ddy;
                        if (nx >= 0 && nx < cols && ny >= 0 && ny < rows && mazeGrid[ny][nx] === 0) {
                            validDirs.push({ x: nx + 0.5, z: ny + 0.5 });
                        }
                    }
                    if (validDirs.length > 0) {
                        const selected = validDirs[Math.floor(Math.random() * validDirs.length)];
                        s.targetX = selected.x;
                        s.targetZ = selected.z;
                    }
                    s.patrolCooldown = Math.random() * 2 + 1;
                }
            }
        } else {
            const currentSpeed = s.state === 'CHASE' ? CONFIG.spider.chaseSpeed : CONFIG.spider.speed;
            const step = currentSpeed * delta;
            const mx = s.targetX - s.x;
            const mz = s.targetZ - s.z;
            const length = Math.sqrt(mx*mx + mz*mz);
            s.x += (mx / length) * step;
            s.z += (mz / length) * step;
            s.mesh.position.x = s.x;
            s.mesh.position.z = s.z;
            s.mesh.lookAt(s.targetX, s.mesh.position.y, s.targetZ);
        }

        // 4. 蜘蛛低矮爬行擺動動畫
        s.mesh.position.y = 0.25 + Math.sin(totalTime * 3.0 + s.bobOffset) * 0.04;

        // 5. 吐絲攻擊！當追逐狀態且玩家在偵測範圍內，且冷卻完畢
        if (s.state === 'CHASE' && distToPlayer < CONFIG.spider.detectRange && distToPlayer > 1.0) {
            if (now - s.lastWebTime > CONFIG.spider.webCooldown) {
                s.lastWebTime = now;
                fireWeb(s);
            }
        }

        // 6. 碰觸玩家受傷檢測
        if (distToPlayer < CONFIG.spider.radius + CONFIG.player.radius) {
            triggerPlayerDamage();
        }
    }
}

// 蜘蛛吐絲！朝玩家方向發射蛛絲球
function fireWeb(spider) {
    playSound('shoot'); // 使用相同音效

    const dx = player.x - spider.x;
    const dz = player.z - spider.z;
    const dist = Math.sqrt(dx*dx + dz*dz);
    const dirX = dx / dist;
    const dirZ = dz / dist;

    // 灰白色蛛絲球
    const webGeom = new THREE.SphereGeometry(0.12, 8, 8);
    const webMat = new THREE.MeshBasicMaterial({
        color: CONFIG.theme.spiderWebColor,
        transparent: true,
        opacity: 0.85
    });
    const mesh = new THREE.Mesh(webGeom, webMat);
    mesh.position.set(spider.x, 0.35, spider.z);
    scene.add(mesh);

    webs.push({
        mesh: mesh,
        x: spider.x,
        z: spider.z,
        vx: dirX * CONFIG.spider.webSpeed,
        vz: dirZ * CONFIG.spider.webSpeed,
        distanceTraveled: 0
    });
}

// 更新蛛絲飛行物
function updateWebs(delta) {
    for (let i = webs.length - 1; i >= 0; i--) {
        const w = webs[i];
        const speed = CONFIG.spider.webSpeed;

        w.x += w.vx * delta;
        w.z += w.vz * delta;
        w.distanceTraveled += speed * delta;
        w.mesh.position.set(w.x, 0.35, w.z);

        // 1. 最大射程 (10 格)
        if (w.distanceTraveled >= 10.0) {
            scene.remove(w.mesh);
            webs.splice(i, 1);
            continue;
        }

        // 2. 撞牆消失
        const gX = Math.floor(w.x);
        const gZ = Math.floor(w.z);
        if (gX < 0 || gX >= cols || gZ < 0 || gZ >= rows || mazeGrid[gZ][gX] === 1) {
            scene.remove(w.mesh);
            webs.splice(i, 1);
            continue;
        }

        // 3. 命中玩家 → 減速效果！
        const pdx = w.x - player.x;
        const pdz = w.z - player.z;
        const pdist = Math.sqrt(pdx*pdx + pdz*pdz);
        if (pdist < CONFIG.player.radius + 0.12) {
            playerWebSlowTime = CONFIG.spider.webSlowDuration;
            spawnSparkParticles(player.x, CONFIG.player.height, player.z, CONFIG.theme.spiderWebColor, 10);
            playSound('damage');
            scene.remove(w.mesh);
            webs.splice(i, 1);
            continue;
        }
    }
}

function triggerPlayerDamage() {
    if (player.invulnerable || gameState !== 'PLAYING') return;

    // 扣血
    lives--;
    updateLivesUI();
    playSound('damage');

    // 觸發紅色畫面閃爍
    const flash = document.getElementById('damageFlash');
    flash.classList.add('flash-active');
    setTimeout(() => {
        flash.classList.remove('flash-active');
    }, 150);

    // 進入無敵時間
    player.invulnerable = true;
    player.invulnerableTime = CONFIG.player.hitCooldown;

    // 生命扣完結束遊戲
    if (lives <= 0) {
        endGame(false);
    }
}

function updateLivesUI() {
    const container = document.getElementById('livesContainer');
    let hearts = '';
    for (let i = 0; i < CONFIG.player.maxLives; i++) {
        hearts += i < lives ? '❤️' : '🖤';
    }
    container.textContent = hearts;
}

function checkPortalCollision() {
    if (!portalActive) return; // 傳送門未開啟時不能通關

    const exitX = exitC + 0.5;
    const exitZ = exitR + 0.5;

    const dx = player.x - exitX;
    const dz = player.z - exitZ;
    const dist = Math.sqrt(dx*dx + dz*dz);

    // 進入傳送門 (距離小於 0.55)
    if (dist < 0.55) {
        completeLevel();
    }
}

// 建立 3D 傳送門模型與發光光源
function createPortalMeshAndLight(c, r) {
    const exitX = c + 0.5;
    const exitZ = r + 0.5;

    const portalGroup = new THREE.Group();
    
    // 圓柱傳送門主體
    const portalGeom = new THREE.CylinderGeometry(0.35, 0.35, 1.1, 16, 1, true);
    const portalMat = new THREE.MeshBasicMaterial({
        color: CONFIG.theme.portalColor,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.6,
        wireframe: true
    });
    const portalCylinder = new THREE.Mesh(portalGeom, portalMat);
    portalCylinder.position.y = 0.55;
    portalGroup.add(portalCylinder);

    // 外圍懸浮發光圈圈
    const torusGeom = new THREE.TorusGeometry(0.38, 0.03, 8, 24);
    const torusMat = new THREE.MeshStandardMaterial({
        color: CONFIG.theme.portalColor,
        emissive: CONFIG.theme.portalColor,
        emissiveIntensity: 1.0
    });
    const torus = new THREE.Mesh(torusGeom, torusMat);
    torus.rotation.x = Math.PI / 2;
    torus.position.y = 0.1;
    portalGroup.add(torus);

    portalMesh = portalGroup;
    portalMesh.position.set(exitX, 0, exitZ);
    scene.add(portalMesh);

    // 終點光源
    portalLight = new THREE.PointLight(CONFIG.theme.portalColor, 1.5, 3);
    portalLight.position.set(exitX, 0.8, exitZ);
    scene.add(portalLight);
}

// 檢查第四關傳送門解鎖進度
function checkLevel4PortalUnlock(pointsAdded) {
    if (currentLevelIndex !== 3 || portalActive) return;
    level4StunPoints += pointsAdded;
    
    const badge = document.getElementById('levelNameBadge');
    if (level4StunPoints < 20) {
        badge.textContent = `第四關：蜘蛛巢穴 (門: ${level4StunPoints}/20) 🕷️`;
    } else {
        portalActive = true;
        badge.textContent = `第四關：蜘蛛巢穴 (門已開啟! 🚪) 🕷️`;
        
        // 隨機在一個空白位置生成終點傳送門
        spawnLevel4PortalRandomly();
    }
}

// 隨機生成第四關傳送門出口
function spawnLevel4PortalRandomly() {
    let attempts = 0;
    let rc = cols - 2;
    let rr = rows - 2;
    const px = Math.floor(player.x);
    const pz = Math.floor(player.z);
    
    while (attempts < 500) {
        attempts++;
        const tc = Math.floor(Math.random() * (cols - 2)) + 1;
        const tr = Math.floor(Math.random() * (rows - 2)) + 1;
        
        // 確保不是牆壁且離玩家足夠遠
        if (mazeGrid[tr][tc] === 0) {
            const dist = Math.abs(tc - px) + Math.abs(tr - pz);
            if (dist > 8) { // 至少離玩家 8 格遠，防開臉上
                rc = tc;
                rr = tr;
                break;
            }
        }
    }
    
    exitC = rc;
    exitR = rr;
    createPortalMeshAndLight(exitC, exitR);
    
    // 顯示大字公告與開啟音效
    showLevelAnnouncement("傳送門已在隨機位置開啟！🚪");
    playSound('shoot');
    
    // 如果當前開啟了提示，立刻重算並刷新金黃色導航箭頭
    if (showHints) {
        generatePathHints(px, pz);
    }
}


// --- 粒子系統 (噴砂發光火花) ---
function spawnSparkParticles(x, y, z, colorStr, count = 10) {
    const geom = new THREE.BoxGeometry(0.04, 0.04, 0.04);
    const color = new THREE.Color(colorStr);

    for (let i = 0; i < count; i++) {
        const mat = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 1.0
        });
        const mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);

        particles.push({
            mesh: mesh,
            vx: (Math.random() - 0.5) * 2.5,
            vy: (Math.random() - 0.2) * 2.0 + 0.5,
            vz: (Math.random() - 0.5) * 2.5,
            life: 1.0,
            decay: Math.random() * 1.5 + 1.0
        });
    }
}

function updateParticles(delta) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.mesh.position.x += p.vx * delta;
        p.mesh.position.y += p.vy * delta;
        p.mesh.position.z += p.vz * delta;

        // 加點重力
        p.vy -= 4.0 * delta;

        p.life -= p.decay * delta;
        p.mesh.material.opacity = Math.max(0, p.life);

        if (p.life <= 0) {
            scene.remove(p.mesh);
            particles.splice(i, 1);
        }
    }
}


// --- 2D 小地圖繪製 ---
function drawMinimap() {
    minimapCtx.clearRect(0, 0, minimapCanvas.width, minimapCanvas.height);
    if (!mazeGrid.length) return;

    // 將迷宮等比縮小適配小地圖畫布
    const cellW = minimapCanvas.width / cols;
    const cellH = minimapCanvas.height / rows;

    // 1. 繪製迷宮格子
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (mazeGrid[r][c] === 1) {
                minimapCtx.fillStyle = '#0891b2'; // 牆壁
            } else {
                minimapCtx.fillStyle = '#090d16'; // 通道
            }
            minimapCtx.fillRect(c * cellW, r * cellH, cellW, cellH);
        }
    }

    // 2. 繪製終點綠色傳送門 (僅在傳送門已解鎖激活時，在小地圖上畫出來)
    if (portalActive) {
        minimapCtx.fillStyle = '#10b981';
        minimapCtx.beginPath();
        minimapCtx.arc((exitC + 0.5) * cellW, (exitR + 0.5) * cellH, cellW * 0.45, 0, Math.PI * 2);
        minimapCtx.fill();
    }

    // 3. 繪製小怪物
    for (const m of monsters) {
        minimapCtx.fillStyle = m.state === 'STUNNED' ? '#3b82f6' : '#d946ef';
        minimapCtx.beginPath();
        minimapCtx.arc(m.x * cellW, m.z * cellH, cellW * 0.4, 0, Math.PI * 2);
        minimapCtx.fill();
    }

    // 3b. 繪製蜘蛛 (深紫色，暈眩時藍色)
    for (const s of spiders) {
        minimapCtx.fillStyle = s.state === 'STUNNED' ? '#3b82f6' : '#7c3aed';
        minimapCtx.beginPath();
        minimapCtx.arc(s.x * cellW, s.z * cellH, cellW * 0.45, 0, Math.PI * 2);
        minimapCtx.fill();
    }

    // 4. 繪製玩家方向指針與小紅點
    const px = player.x * cellW;
    const pz = player.z * cellH;

    minimapCtx.fillStyle = '#ef4444';
    minimapCtx.beginPath();
    minimapCtx.arc(px, pz, cellW * 0.45, 0, Math.PI * 2);
    minimapCtx.fill();

    // 畫面向方向線
    minimapCtx.strokeStyle = '#ffffff';
    minimapCtx.lineWidth = 2;
    minimapCtx.beginPath();
    minimapCtx.moveTo(px, pz);
    minimapCtx.lineTo(
        px + Math.cos(player.angle) * cellW * 1.5,
        pz + Math.sin(player.angle) * cellH * 1.5
    );
    minimapCtx.stroke();
}


// --- 遊戲流程控制實作 ---

function startGame() {
    initAudio();
    
    currentLevelIndex = 0;
    score = 0;
    lives = CONFIG.player.maxLives;
    stunCount = 0;
    totalTimeElapsed = 0;
    
    document.getElementById('startOverlay').classList.add('hidden');
    document.getElementById('nextLevelOverlay').classList.add('hidden');
    document.getElementById('gameOverOverlay').classList.add('hidden');
    document.getElementById('victoryOverlay').classList.add('hidden');

    buildLevel();
    updateLivesUI();
    document.getElementById('stunCountVal').textContent = '0';

    gameState = 'PLAYING';
    startBGM();

    // 重設計時器
    startTimer();
}

function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    const level = CONFIG.levels[currentLevelIndex];
    timerInterval = setInterval(() => {
        if (gameState !== 'PLAYING') return;

        // timeLimit === 0 代表無限時間 (第四關)
        if (level.timeLimit === 0) {
            totalTimeElapsed++;
            document.getElementById('timeVal').textContent = '∞';
            return; // 不倒數，不會因時間到而失敗
        }

        timeLeft--;
        totalTimeElapsed++;
        document.getElementById('timeVal').textContent = timeLeft;

        if (timeLeft <= 0) {
            endGame(false); // 時間到失敗
        }
    }, 1000);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function completeLevel() {
    stopTimer();
    stopBGM();
    gameState = 'LEVEL_COMPLETE';
    playSound('win');

    // 計算本關分數 = 剩餘時間 * 10 點
    score += timeLeft * 10;

    if (currentLevelIndex < CONFIG.levels.length - 1) {
        // 進入下一關轉換
        document.getElementById('nextLevelOverlay').classList.remove('hidden');
        document.getElementById('nextLevelDesc').innerHTML = `
            太厲害了！你以剩餘 <b>${timeLeft}</b> 秒的超快速度逃出迷宮！<br>
            獲得積分：+${timeLeft * 10} 分！<br><br>
            下一關將為更大、更具挑戰性的的迷宮地圖，準備好了嗎？
        `;
    } else {
        // 三關全部通過，終極獲勝！
        const finalScore = score + (stunCount * 50); // 每擊暈一次額外加 50 分
        document.getElementById('victoryOverlay').classList.remove('hidden');
        document.getElementById('finalScoreVal').textContent = finalScore;
        
        // 更新大廳最高分
        const highScore = localStorage.getItem('monster_maze_3d_highScore') || 0;
        if (finalScore > highScore) {
            localStorage.setItem('monster_maze_3d_highScore', finalScore);
        }
        
        gameState = 'VICTORY';
    }
}

function nextLevel() {
    currentLevelIndex++;
    document.getElementById('nextLevelOverlay').classList.add('hidden');
    buildLevel();
    gameState = 'PLAYING';
    startBGM();
    startTimer();
}

function endGame(win) {
    stopTimer();
    stopBGM();
    playSound('lose');
    gameState = 'GAMEOVER';
    
    document.getElementById('gameOverOverlay').classList.remove('hidden');
    if (lives <= 0) {
        document.getElementById('gameOverDesc').textContent = '噢不！你的愛心被怪物摸完了！再接再厲！';
    } else {
        document.getElementById('gameOverDesc').textContent = '時間到啦！小狐狸走不出迷宮，再挑戰一次吧！';
    }
}

// --- 關卡失敗重新挑戰同一關 ---
function retryLevel() {
    initAudio();
    
    // 不重置關卡索引 (currentLevelIndex)，重設生命與介面，並重建當前關卡
    lives = CONFIG.player.maxLives;
    updateLivesUI();
    
    document.getElementById('startOverlay').classList.add('hidden');
    document.getElementById('nextLevelOverlay').classList.add('hidden');
    document.getElementById('gameOverOverlay').classList.add('hidden');
    document.getElementById('victoryOverlay').classList.add('hidden');

    buildLevel();
    
    gameState = 'PLAYING';
    startBGM();
    startTimer();
}

// --- 地板路徑導航提示系統 (按 H 鍵觸發) ---
let showHints = false;
let lastPlayerGridX = -1;
let lastPlayerGridZ = -1;
let hintsGroup = null;
let arrowTexture = null;
let arrowMaterial = null;

function createArrowTexture() {
    if (arrowTexture) return arrowTexture;
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    
    // 繪製一個精緻的亮金黃色指路箭頭
    ctx.fillStyle = 'rgba(255, 215, 0, 0.98)';
    ctx.beginPath();
    ctx.moveTo(64, 15);   // 箭頭頂點
    ctx.lineTo(20, 75);   // 左下角
    ctx.lineTo(50, 75);   // 左內凹
    ctx.lineTo(50, 115);  // 底左
    ctx.lineTo(78, 115);  // 底右
    ctx.lineTo(78, 75);   // 右內凹
    ctx.lineTo(108, 75);  // 右下角
    ctx.closePath();
    ctx.fill();
    
    arrowTexture = new THREE.CanvasTexture(canvas);
    arrowTexture.needsUpdate = true;
    return arrowTexture;
}

function getArrowMaterial() {
    if (arrowMaterial) return arrowMaterial;
    const tex = createArrowTexture();
    arrowMaterial = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        depthWrite: false, // 防止與地板網格產生深度衝突/閃爍 (z-fighting)
        side: THREE.DoubleSide
    });
    return arrowMaterial;
}

function togglePathHints() {
    if (gameState !== 'PLAYING') return;
    
    showHints = !showHints;
    if (!showHints) {
        if (hintsGroup) {
            scene.remove(hintsGroup);
            hintsGroup = null;
        }
        lastPlayerGridX = -1;
        lastPlayerGridZ = -1;
    } else {
        const pGridX = Math.floor(player.x);
        const pGridZ = Math.floor(player.z);
        lastPlayerGridX = pGridX;
        lastPlayerGridZ = pGridZ;
        generatePathHints(pGridX, pGridZ);
    }
}

// 尋找從目前格子到終點的 BFS 最短路徑
function findShortestPath(startC, startR, exitC, exitR) {
    if (startC === exitC && startR === exitR) return [];

    const queue = [[startC, startR]];
    const visited = {};
    visited[`${startC},${startR}`] = null;

    const dirs = [
        [0, -1], // 北
        [1, 0],  // 東
        [0, 1],  // 南
        [-1, 0]  // 西
    ];

    let found = false;
    while (queue.length > 0) {
        const [c, r] = queue.shift();
        if (c === exitC && r === exitR) {
            found = true;
            break;
        }

        for (const [dc, dr] of dirs) {
            const nc = c + dc;
            const nr = r + dr;
            if (nc >= 0 && nc < cols && nr >= 0 && nr < rows) {
                if (mazeGrid[nr][nc] === 0) {
                    const key = `${nc},${nr}`;
                    if (!(key in visited)) {
                        visited[key] = [c, r];
                        queue.push([nc, nr]);
                    }
                }
            }
        }
    }

    if (!found) return [];

    const path = [];
    let curr = [exitC, exitR];
    while (curr) {
        path.push(curr);
        const key = `${curr[0]},${curr[1]}`;
        curr = visited[key];
    }
    path.reverse();
    return path;
}

function generatePathHints(startC, startR) {
    if (hintsGroup) scene.remove(hintsGroup);
    hintsGroup = new THREE.Group();

    // 如果傳送門尚未解鎖開啟，不顯示任何導航箭頭
    if (!portalActive) return;

    const path = findShortestPath(startC, startR, exitC, exitR);
    if (path.length <= 1) {
        scene.add(hintsGroup);
        return;
    }

    const geom = new THREE.PlaneGeometry(0.35, 0.35);
    const mat = getArrowMaterial();

    for (let i = 0; i < path.length - 1; i++) {
        const [c, r] = path[i];
        const [nc, nr] = path[i + 1];

        const dx = nc - c;
        const dz = nr - r;
        let angle = 0;
        if (dx === 1) angle = -Math.PI / 2; // 東
        else if (dx === -1) angle = Math.PI / 2; // 西
        else if (dz === 1) angle = Math.PI; // 南
        else if (dz === -1) angle = 0; // 北

        // 1. 在格子中心繪製一個金黃色箭頭
        const mesh1 = new THREE.Mesh(geom, mat);
        mesh1.position.set(c + 0.5, 0.12, r + 0.5);
        mesh1.rotation.x = -Math.PI / 2;
        mesh1.rotation.z = angle;
        hintsGroup.add(mesh1);

        // 2. 在格線的交界邊緣處額外繪製一個金黃色箭頭，使導航路徑更密集、流暢連貫
        const mesh2 = new THREE.Mesh(geom, mat);
        mesh2.position.set(c + 0.5 + dx * 0.5, 0.12, r + 0.5 + dz * 0.5);
        mesh2.rotation.x = -Math.PI / 2;
        mesh2.rotation.z = angle;
        hintsGroup.add(mesh2);
    }

    scene.add(hintsGroup);
}

// 綁定覆蓋層按鈕點擊事件
document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('nextLevelBtn').addEventListener('click', nextLevel);
document.getElementById('retryBtn').addEventListener('click', retryLevel);
document.getElementById('winRestartBtn').addEventListener('click', startGame);


// --- 主渲染循環 (Render Loop) ---

function animate() {
    requestAnimationFrame(animate);

    const delta = clock ? clock.getDelta() : 0.016;

    // 1. 更新遊戲狀態與 3D 世界
    update(Math.min(delta, 0.1)); // 避免過大幅度的 delta 造成物理穿牆

    // 2. 旋轉傳送門
    if (portalMesh && gameState === 'PLAYING') {
        portalMesh.children[0].rotation.y += 1.5 * delta;
        portalMesh.children[1].rotation.z += 2.0 * delta;
    }

    // 3. 更新射擊冷卻條
    updateCooldownBar();

    // 4. 繪製 2D 小地圖
    drawMinimap();

    // 5. 渲染 3D 畫面
    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}

function updateCooldownBar() {
    const progress = document.getElementById('cooldownProgress');
    if (!progress) return;
    const now = performance.now();
    const elapsed = now - lastShootTime;
    const cooldown = CONFIG.projectile.cooldown;
    const percentage = Math.min(100, (elapsed / cooldown) * 100);
    progress.style.width = `${percentage}%`;
}


// --- 遊戲初始化啟動 ---
document.addEventListener('DOMContentLoaded', () => {
    initGameEngine();
    buildLevel(); // 預載第一關場景作為開場背景
    animate();
});
