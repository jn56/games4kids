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
let mazeGrid = [];
let cols = 0;
let rows = 0;

// --- 紋理與精靈生成器 (透過 2D Canvas 與 Emojis 動態繪製) ---
function createHedgeTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    // 灌木叢深綠底色
    ctx.fillStyle = '#15803d';
    ctx.fillRect(0, 0, 256, 256);
    
    // 繪製多重重疊的葉子 Emojis 🌿 🍃 以形成樹籬灌木叢紋理
    ctx.font = '34px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < 35; i++) {
        const x = Math.random() * 256;
        const y = Math.random() * 256;
        ctx.fillText(Math.random() < 0.5 ? '🌿' : '🍃', x, y);
    }
    
    // 繪製粗黑色的邊框，讓迷宮格線的邊緣立體且清晰可見，方便看清走道
    ctx.strokeStyle = '#052e16';
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
    
    // 淺綠色草地
    ctx.fillStyle = '#86efac';
    ctx.fillRect(0, 0, 256, 256);
    
    // 繪製幸運草與草芽 Emojis 🍀 🌱
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < 18; i++) {
        const x = Math.random() * 256;
        const y = Math.random() * 256;
        ctx.fillText(Math.random() < 0.5 ? '🌱' : '🍀', x, y);
    }
    
    // 繪製綠色格線邊框，讓迷宮地板有清晰的板塊格線
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 8;
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
        muteBtn.textContent = '🔇 音效: 關';
        muteBtn.style.background = 'rgba(255, 255, 255, 0.1)';
        stopBGM();
    } else {
        muteBtn.textContent = '🔊 音效: 開';
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
    for (let r = 1; r < h - 1; r++) {
        for (let c = 1; c < w - 1; c++) {
            if (grid[r][c] === 1) { // 牆壁
                // 檢查打通此牆是否會連接左右兩個通道，或上下兩個通道
                const pathLeft = (grid[r][c - 1] === 0);
                const pathRight = (grid[r][c + 1] === 0);
                const pathUp = (grid[r - 1][c] === 0);
                const pathDown = (grid[r + 1][c] === 0);

                if ((pathLeft && pathRight) || (pathUp && pathDown)) {
                    // 以 15% 的機率打通此內牆，創造迴路
                    if (Math.random() < 0.15) {
                        grid[r][c] = 0;
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

    camera = new THREE.PerspectiveCamera(70, width / height, 0.1, 100);
    
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
            fireProjectile();
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
    document.getElementById('timeVal').textContent = timeLeft;
    
    // 清除舊有的 3D 物件
    if (wallsGroup) scene.remove(wallsGroup);
    if (floorMesh) scene.remove(floorMesh);
    if (ceilingMesh) scene.remove(ceilingMesh);
    if (portalMesh) scene.remove(portalMesh);
    if (portalLight) scene.remove(portalLight);
    
    monsters.forEach(m => scene.remove(m.mesh));
    monsters.length = 0;
    projectiles.forEach(p => scene.remove(p.mesh));
    projectiles.length = 0;

    // 動態更新渲染器的天藍色背景與霧氣
    if (renderer) renderer.setClearColor(CONFIG.theme.skyColor);
    if (scene) {
        scene.background = new THREE.Color(CONFIG.theme.skyColor);
        scene.fog = new THREE.FogExp2(CONFIG.theme.skyColor, 0.06); // 明亮大晴天，減少霧氣密度
    }

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
    const wallGeom = new THREE.BoxGeometry(1, 1.2, 1);
    
    const hedgeTex = createHedgeTexture();
    const wallMat = new THREE.MeshStandardMaterial({
        map: hedgeTex,
        roughness: 0.8,
        metalness: 0.0
    });

    const neonLineMat = new THREE.LineBasicMaterial({ color: CONFIG.theme.wallWireColor });
    const edges = new THREE.EdgesGeometry(wallGeom); // 移至外部，避免重複創建造成 WebGL 崩潰
    
    // 預先生成小花和小樹的紋理與材質（移至外部以大幅節省材質編譯開銷）
    const flowerEmojis = ['🌸', '🌻', '🌷', '🌹', '🌼'];
    const flowerTextures = flowerEmojis.map(emoji => createEmojiSpriteTexture(emoji));
    const flowerMaterials = flowerTextures.map(tex => new THREE.SpriteMaterial({ map: tex, transparent: true }));
    
    const treeEmojis = ['🌳', '🌲', '🌴'];
    const treeTextures = treeEmojis.map(emoji => createEmojiSpriteTexture(emoji));
    const treeMaterials = treeTextures.map(tex => new THREE.SpriteMaterial({ map: tex, transparent: true }));

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (mazeGrid[r][c] === 1) {
                // 灌木叢方塊牆壁
                const wall = new THREE.Mesh(wallGeom, wallMat);
                wall.position.set(c + 0.5, 0.6, r + 0.5);
                wall.castShadow = true;
                wall.receiveShadow = true;
                wallsGroup.add(wall);

                // 邊緣線條，讓灌木叢方塊輪廓清晰
                const line = new THREE.LineSegments(edges, neonLineMat);
                line.position.copy(wall.position);
                wallsGroup.add(line);

                // 隨機在灌木叢牆的四個側面加入 1-2 朵立體小花精靈 (共享材質以防崩潰)
                const flowerCount = Math.floor(Math.random() * 2) + 1;
                for (let f = 0; f < flowerCount; f++) {
                    const spriteMat = flowerMaterials[Math.floor(Math.random() * flowerMaterials.length)];
                    const flowerSprite = new THREE.Sprite(spriteMat);
                    flowerSprite.scale.set(0.22, 0.22, 1);
                    
                    const side = Math.floor(Math.random() * 4);
                    const offset = 0.51; // 稍微凸出表面
                    const randY = Math.random() * 0.8 + 0.2; // 隨機高度
                    const randOffset = (Math.random() - 0.5) * 0.6; // 隨機水平偏移
                    
                    let fx = c + 0.5;
                    let fz = r + 0.5;
                    if (side === 0) { fx += randOffset; fz += offset; }
                    else if (side === 1) { fx += randOffset; fz -= offset; }
                    else if (side === 2) { fx += offset; fz += randOffset; }
                    else if (side === 3) { fx -= offset; fz += randOffset; }
                    
                    flowerSprite.position.set(fx, randY, fz);
                    wallsGroup.add(flowerSprite);
                }

                // 有 25% 的機率在灌木叢頂部生長出一棵 3D 小樹精靈 (共享材質)
                if (Math.random() < 0.25) {
                    const spriteMat = treeMaterials[Math.floor(Math.random() * treeMaterials.length)];
                    const treeSprite = new THREE.Sprite(spriteMat);
                    treeSprite.scale.set(0.65, 0.65, 1);
                    treeSprite.position.set(c + 0.5, 1.45, r + 0.5); // 放在 1.2 高牆的上方
                    wallsGroup.add(treeSprite);
                }
            }
        }
    }
    scene.add(wallsGroup);

    // 4. 建立終點傳送門
    const portalGroup = new THREE.Group();
    const exitX = cols - 2 + 0.5;
    const exitZ = rows - 2 + 0.5;
    
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

    // 5. 初始化玩家位置
    player.x = 1.5;
    player.z = 1.5;
    player.angle = 0.0; // 預設面向右 (+X)
    player.invulnerable = false;
    player.invulnerableTime = 0;
    updateCamera();

    // 6. 生成小怪物
    spawnMonsters(level.monsterCount);

    // 7. 設置關卡燈光
    setupLights();

    // 8. 顯示關卡開始公告
    showLevelAnnouncement(level.name);
}

function setupLights() {
    // 全域明亮的陽光環境光 (從 0.15 加強至 0.8)，營造明亮的花園氛圍
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    // 玩家手電筒 (SpotLight)：作為溫和的輔助補光 (強度從 1.8 減弱至 0.5)
    const flashlight = new THREE.SpotLight(0xffffff, 0.5, 12, Math.PI / 5, 0.5, 1);
    flashlight.castShadow = true;
    flashlight.shadow.mapSize.width = 512;
    flashlight.shadow.mapSize.height = 512;
    flashlight.name = "flashlight";
    scene.add(flashlight);

    // 手電筒目標，用於定向
    const flashlightTarget = new THREE.Object3D();
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

    // 發射起點 (相機高度稍微降低一點點)
    mesh.position.set(player.x, CONFIG.player.height - 0.1, player.z);
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

    // 3. 更新光球發射軌跡與碰撞
    updateProjectiles(delta);

    // 4. 更新小怪物 AI 與漂浮動畫
    updateMonsters(delta, performance.now() / 1000);

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
        const speed = CONFIG.player.speed * delta;
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
    
    // 計算焦點 (相機面對的方向)
    const lookX = player.x + Math.cos(player.angle);
    const lookZ = player.z + Math.sin(player.angle);
    camera.lookAt(lookX, CONFIG.player.height, lookZ);
}

function updateLights() {
    const flashlight = scene.getObjectByName("flashlight");
    const target = scene.getObjectByName("flashlightTarget");

    if (flashlight && target) {
        flashlight.position.copy(camera.position);
        
        // 燈光照向相機正前方
        const lookX = player.x + Math.cos(player.angle) * 3;
        const lookZ = player.z + Math.sin(player.angle) * 3;
        target.position.set(lookX, CONFIG.player.height, lookZ);
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

        p.mesh.position.set(p.x, CONFIG.player.height - 0.1, p.z);

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
            spawnSparkParticles(p.x, CONFIG.player.height - 0.1, p.z, CONFIG.theme.shootColor);
            scene.remove(p.mesh);
            projectiles.splice(i, 1);
            continue;
        }

        // 3. 撞擊小怪物
        let hitMonster = false;
        for (const m of monsters) {
            if (m.state === 'STUNNED') continue; // 已暈眩不重複擊中

            const dx = p.x - m.x;
            const dz = p.z - m.z;
            const dist = Math.sqrt(dx*dx + dz*dz);

            if (dist < CONFIG.monster.radius + CONFIG.projectile.radius) {
                // 擊暈怪物！
                stunMonster(m);
                spawnSparkParticles(m.x, 0.4, m.z, "#ffff00", 15); // 黃色發光粒子
                scene.remove(p.mesh);
                projectiles.splice(i, 1);
                hitMonster = true;
                break;
            }
        }
        if (hitMonster) continue;
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
    const exitX = cols - 2 + 0.5;
    const exitZ = rows - 2 + 0.5;

    const dx = player.x - exitX;
    const dz = player.z - exitZ;
    const dist = Math.sqrt(dx*dx + dz*dz);

    // 進入傳送門 (距離小於 0.5)
    if (dist < 0.55) {
        completeLevel();
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

    // 2. 繪製終點綠色傳送門
    minimapCtx.fillStyle = '#10b981';
    minimapCtx.beginPath();
    minimapCtx.arc((cols - 2 + 0.5) * cellW, (rows - 2 + 0.5) * cellH, cellW * 0.45, 0, Math.PI * 2);
    minimapCtx.fill();

    // 3. 繪製小怪物
    for (const m of monsters) {
        minimapCtx.fillStyle = m.state === 'STUNNED' ? '#3b82f6' : '#d946ef';
        minimapCtx.beginPath();
        minimapCtx.arc(m.x * cellW, m.z * cellH, cellW * 0.4, 0, Math.PI * 2);
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
    timerInterval = setInterval(() => {
        if (gameState !== 'PLAYING') return;

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

// 綁定覆蓋層按鈕點擊事件
document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('nextLevelBtn').addEventListener('click', nextLevel);
document.getElementById('retryBtn').addEventListener('click', startGame);
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
