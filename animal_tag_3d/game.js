// --- Web Audio API 音效合成器 ---
let audioCtx = null;
let soundEnabled = true;

function initAudio() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

function playSound(type) {
    if (!soundEnabled) return;
    initAudio();
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    try {
        const time = audioCtx.currentTime;
        if (type === 'catch') {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, time);
            osc.frequency.exponentialRampToValueAtTime(1200, time + 0.15);
            gain.gain.setValueAtTime(0.3, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(time);
            osc.stop(time + 0.16);
        } else if (type === 'dash') {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(150, time);
            osc.frequency.exponentialRampToValueAtTime(40, time + 0.3);
            gain.gain.setValueAtTime(0.25, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 0.3);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(time);
            osc.stop(time + 0.31);
        } else if (type === 'rabbit') {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(220, time);
            osc.frequency.exponentialRampToValueAtTime(440, time + 0.18);
            gain.gain.setValueAtTime(0.2, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 0.18);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(time);
            osc.stop(time + 0.19);
        } else if (type === 'cat') {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(650, time);
            osc.frequency.linearRampToValueAtTime(800, time + 0.08);
            osc.frequency.exponentialRampToValueAtTime(550, time + 0.22);
            gain.gain.setValueAtTime(0.18, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 0.22);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(time);
            osc.stop(time + 0.23);
        } else if (type === 'dog') {
            // 可愛的小狗雙聲汪汪音效 (Double yip-yip puppy bark)
            const playYip = (delay, pitch) => {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = 'triangle'; // 採用三角波，音色更溫和可愛
                
                // 快速向上的頻率掃描 (從基音向上衝，模擬小奶狗的 yip 聲)
                osc.frequency.setValueAtTime(pitch, time + delay);
                osc.frequency.exponentialRampToValueAtTime(pitch * 1.6, time + delay + 0.07);
                
                gain.gain.setValueAtTime(0.18, time + delay);
                gain.gain.exponentialRampToValueAtTime(0.01, time + delay + 0.07);
                
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start(time + delay);
                osc.stop(time + delay + 0.08);
            };

            playYip(0, 480);       // 第一聲汪 (較低)
            playYip(0.08, 560);    // 第二聲汪 (較高且急促)
        } else if (type === 'gameover') {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(220, time);
            osc.frequency.linearRampToValueAtTime(110, time + 0.4);
            gain.gain.setValueAtTime(0.25, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 0.4);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(time);
            osc.stop(time + 0.41);
        } else if (type === 'victory') {
            const gain = audioCtx.createGain();
            gain.gain.setValueAtTime(0.3, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.8);
            gain.connect(audioCtx.destination);

            const chord = [261.63, 329.63, 392.00, 523.25];
            chord.forEach((f, i) => {
                const osc = audioCtx.createOscillator();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(f, time + i * 0.05);
                osc.connect(gain);
                osc.start(time + i * 0.05);
                osc.stop(time + 0.8);
            });
        }
    } catch (e) {
        console.warn("音效播不出來:", e);
    }
}

// --- 遊戲組態設定 (CONFIG) ---
const CONFIG = {
    levels: [
        {
            size: 21,
            targetCount: 8,
            rabbitCount: 12,
            catCount: 0,
            dogCount: 0,
            desc: "第一關：快去抓住 8 隻蹦蹦跳跳的小兔子！🐇",
            name: "第一關：追逐小兔兔 🐇"
        },
        {
            size: 25,
            targetCount: 10,
            rabbitCount: 0,
            catCount: 14,
            dogCount: 0,
            desc: "第二關：抓住 10 隻愛躲在樹後面的淘氣小貓咪！🐈",
            name: "第二關：尋找頑皮貓 🐈"
        },
        {
            size: 29,
            targetCount: 12,
            rabbitCount: 0,
            catCount: 0,
            dogCount: 16,
            desc: "第三關：挑戰抓住 12 隻奔跑迅速的活潑小狗狗！🐕",
            name: "第三關：狗狗大賽跑 🐕"
        },
        {
            size: 35,
            targetCount: 18,
            rabbitCount: 10,
            catCount: 10,
            dogCount: 10,
            desc: "第四關：大考驗！在超大森林中收容 18 隻動物！🌲",
            name: "第四關：森林大集合 🌲"
        }
    ],
    player: {
        normalSpeed: 3.8,
        dashSpeed: 6.2,
        height: 0.95,
        radius: 0.28
    },
    animals: {
        rabbit: { speed: 1.5, fleeSpeed: 3.5, detectRange: 5.5, radius: 0.28, color: '#f8fafc' },
        cat: { speed: 1.3, fleeSpeed: 3.2, detectRange: 4.8, radius: 0.26, color: '#f97316' },
        dog: { speed: 1.8, fleeSpeed: 4.0, detectRange: 6.0, radius: 0.32, color: '#ca8a04' }
    }
};

// --- 全局變數 ---
let scene, camera, renderer;
let clock;
let currentLevelIndex = 0;
let gameState = 'START';
let mazeGrid = [];
let cols = 0, rows = 0;
let wallsGroup = null;
let treesGroup = null;
let playerMesh = null;
let sunLight = null; // 全局陽光變數以利跟隨玩家移動

// 玩家屬性
const player = {
    x: 1.5,
    z: 1.5,
    angle: 0.0,
    stamina: 100.0,
    isDashing: false
};

// 輸入狀態
const keys = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    dash: false
};

let touchActive = false;
let minimapCanvas, minimapCtx;

// 動物與粒子
let animals = [];
let particles = [];
let caughtCount = 0;
let levelTimeLeft = 300;
let totalTimeElapsed = 0;
let timerInterval = null;

// --- 初始化入口 ---
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initGameEngine();
} else {
    document.addEventListener('DOMContentLoaded', initGameEngine);
}

function initGameEngine() {
    const container = document.getElementById('viewport');
    let width = container.clientWidth || window.innerWidth || 800;
    let height = container.clientHeight || window.innerHeight || 500;

    scene = new THREE.Scene();
    scene.background = new THREE.Color('#bae6fd'); // 晴朗白天天空 (天空藍)
    scene.fog = new THREE.FogExp2('#bae6fd', 0.035); // 清亮白天遠霧

    camera = new THREE.PerspectiveCamera(90, width / height, 0.1, 100);
    camera.position.set(player.x, CONFIG.player.height, player.z);

    renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('canvas3d'), antialias: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    clock = new THREE.Clock();

    minimapCanvas = document.getElementById('minimapCanvas');
    minimapCtx = minimapCanvas.getContext('2d');

    // 1. 基礎環境光源 (增亮)
    const ambientLight = new THREE.AmbientLight('#ffffff', 0.7);
    scene.add(ambientLight);

    // 2. 太陽光定向光源
    sunLight = new THREE.DirectionalLight('#fffbeb', 1.1);
    sunLight.position.set(20, 35, 10);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    
    // 設定合適的陰影相機圍繞範圍 (跟隨玩家後只需涵蓋 44x44 的可視區即可，能提供更高的陰影解析度)
    sunLight.shadow.camera.left = -22;
    sunLight.shadow.camera.right = 22;
    sunLight.shadow.camera.top = 22;
    sunLight.shadow.camera.bottom = -22;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 100;
    
    // 將偏置 (bias) 調整為極小值，防止陰影與物體底部脫離 (修正 Peter Panning 導致的浮空破圖黑線)
    sunLight.shadow.bias = -0.00005;
    scene.add(sunLight);
    scene.add(sunLight.target); // 確保目標點被加入場景，以便進行動態跟隨移動

    // 3. 耀眼大太陽模型
    const sunGeom = new THREE.SphereGeometry(2.8, 16, 16);
    const sunMat = new THREE.MeshBasicMaterial({ color: '#fef08a' });
    const sunMesh = new THREE.Mesh(sunGeom, sunMat);
    sunMesh.position.set(20, 26, -30);
    scene.add(sunMesh);

    // 4. 立體雲朵生成
    function createCloud(x, y, z) {
        const cloudGroup = new THREE.Group();
        const cloudMat = new THREE.MeshLambertMaterial({ color: '#ffffff', transparent: true, opacity: 0.92 });
        
        const s1 = new THREE.Mesh(new THREE.SphereGeometry(1.6, 8, 8), cloudMat);
        s1.position.set(0, 0, 0);
        s1.scale.set(1.6, 0.45, 1.0);
        cloudGroup.add(s1);

        const s2 = new THREE.Mesh(new THREE.SphereGeometry(1.1, 8, 8), cloudMat);
        s2.position.set(-1.3, -0.15, 0.1);
        s2.scale.set(1.2, 0.4, 0.8);
        cloudGroup.add(s2);

        const s3 = new THREE.Mesh(new THREE.SphereGeometry(1.2, 8, 8), cloudMat);
        s3.position.set(1.2, -0.1, -0.1);
        s3.scale.set(1.3, 0.42, 0.9);
        cloudGroup.add(s3);

        cloudGroup.position.set(x, y, z);
        scene.add(cloudGroup);
    }

    createCloud(-15, 15, -12);
    createCloud(12, 17, -25);
    createCloud(30, 14, -18);
    createCloud(-8, 16, 20);
    createCloud(18, 15, 12);
    createCloud(-22, 14, 8);
    createCloud(5, 18, 6);
    createCloud(38, 16, 25);

    // 5. 玩家前方補光燈 (極淡)
    const flashlight = new THREE.SpotLight('#ffffff', 0.15, 15, Math.PI / 6, 0.5, 1.0);
    flashlight.name = "flashlight";
    scene.add(flashlight);

    const flashlightTarget = new THREE.Object3D();
    flashlightTarget.name = "flashlightTarget";
    scene.add(flashlightTarget);
    flashlight.target = flashlightTarget;

    // 6. 創建主角模型
    playerMesh = createPlayerMesh();
    scene.add(playerMesh);

    setupInputListeners();
    setupUIEvents();
}

// 創建低多邊形 (Low-poly) 主角人類模型
function createPlayerMesh() {
    const group = new THREE.Group();
    
    // 身體/連帽衛衣 (亮藍色 - 縮短高度: 寬 0.20, 高由 0.44 縮短至 0.30, 深 0.14)
    const bodyGeom = new THREE.BoxGeometry(0.20, 0.30, 0.14);
    const bodyMat = new THREE.MeshStandardMaterial({ color: '#2563eb', roughness: 0.7 });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    body.name = "playerBody";
    body.position.y = 0.43; // 配合短身體，中心上移至 0.43 (範圍: 0.28 至 0.58)
    body.castShadow = true;
    group.add(body);

    // 頭部 (膚色球體 - 半徑 0.05，使頭部直徑 0.10 剛好為身寬 0.20 的一半)
    const headGeom = new THREE.SphereGeometry(0.05, 8, 8);
    const headMat = new THREE.MeshStandardMaterial({ color: '#fed7aa', roughness: 0.8 });
    const head = new THREE.Mesh(headGeom, headMat);
    head.position.set(0, 0.65, 0); // 頸部頂端為 0.58，頭心設在 0.65 剛好接合 (總身高不變)
    head.castShadow = true;
    group.add(head);

    // 棕色短頭髮 (主髮型盒 - 包裹後側)
    const hairGeom = new THREE.BoxGeometry(0.11, 0.05, 0.10);
    const hairMat = new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.9 });
    const hair = new THREE.Mesh(hairGeom, hairMat);
    hair.position.set(0, 0.685, -0.015);
    group.add(hair);

    // 瀏海髮線
    const bangsGeom = new THREE.BoxGeometry(0.11, 0.02, 0.03);
    const bangs = new THREE.Mesh(bangsGeom, hairMat);
    bangs.position.set(0, 0.70, 0.025);
    group.add(bangs);

    // 褲子雙腿 (深灰圓柱 - 拉長腿部: 腿高由 0.24 增加至 0.34, 腿徑 0.025)
    const legGeom = new THREE.CylinderGeometry(0.025, 0.022, 0.34, 6);
    const pantsMat = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.8 });
    
    const leftLeg = new THREE.Mesh(legGeom, pantsMat);
    leftLeg.name = "leftLeg";
    leftLeg.position.set(-0.05, 0.17, 0); // 中心位置上移至 0.17 (範圍: 0 至 0.34)
    leftLeg.castShadow = true;
    group.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeom, pantsMat);
    rightLeg.name = "rightLeg";
    rightLeg.position.set(0.06, 0.17, 0);
    rightLeg.castShadow = true;
    group.add(rightLeg);

    // 雙手 (藍色手臂 - 粗度設為 0.032, 掛接中心 0.44)
    const armGeom = new THREE.CylinderGeometry(0.032, 0.028, 0.26, 6);
    
    const leftArm = new THREE.Mesh(armGeom, bodyMat);
    leftArm.name = "leftArm";
    leftArm.position.set(-0.135, 0.44, 0);
    leftArm.castShadow = true;
    group.add(leftArm);

    const rightArm = new THREE.Mesh(armGeom, bodyMat);
    rightArm.name = "rightArm";
    rightArm.position.set(0.135, 0.44, 0);
    rightArm.castShadow = true;
    group.add(rightArm);

    return group;
}

// --- 3D 地圖與關卡組建 ---
function buildLevel() {
    if (wallsGroup) scene.remove(wallsGroup);
    if (treesGroup) scene.remove(treesGroup);
    animals.forEach(a => scene.remove(a.mesh));
    animals = [];
    particles.forEach(p => scene.remove(p.mesh));
    particles = [];

    const level = CONFIG.levels[currentLevelIndex];
    cols = level.size;
    rows = level.size;

    document.getElementById('levelNameBadge').textContent = level.name;
    document.getElementById('targetVal').textContent = `抓到 ${level.targetCount} 隻動物`;
    caughtCount = 0;
    updateProgressUI();

    const floorTex = createGrassTexture(cols, rows);
    floorTex.repeat.set(cols, rows);
    const floorMat = new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.9, metalness: 0.05 });
    const floorGeom = new THREE.PlaneGeometry(cols, rows);
    
    const oldFloor = scene.getObjectByName("floor");
    if (oldFloor) scene.remove(oldFloor);

    const floorMesh = new THREE.Mesh(floorGeom, floorMat);
    floorMesh.name = "floor";
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.set(cols / 2, 0, rows / 2);
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    mazeGrid = Array(rows).fill(null).map(() => Array(cols).fill(0));
    
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (r === 0 || r === rows - 1 || c === 0 || c === cols - 1) {
                mazeGrid[r][c] = 1;
            }
        }
    }

    for (let r = 2; r < rows - 1; r += 2) {
        for (let c = 2; c < cols - 1; c += 2) {
            if (r <= 2 && c <= 2) continue;
            if (Math.random() < 0.40) {
                mazeGrid[r][c] = 1;
            }
        }
    }

    wallsGroup = new THREE.Group();
    treesGroup = new THREE.Group();

    const wallGeom = new THREE.BoxGeometry(1, 0.8, 1);
    const hedgeTex = createHedgeTexture();
    const wallMat = new THREE.MeshStandardMaterial({ map: hedgeTex, roughness: 0.8 });
    const neonLineMat = new THREE.LineBasicMaterial({ color: '#86efac' });
    const edges = new THREE.EdgesGeometry(wallGeom);

    const trunkGeom = new THREE.CylinderGeometry(0.12, 0.16, 0.8, 8);
    const trunkMat = new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.9 });
    const leavesGeom = new THREE.SphereGeometry(0.45, 8, 8);
    const leavesMat = new THREE.MeshStandardMaterial({ color: '#16a34a', roughness: 0.7 });

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (mazeGrid[r][c] === 1) {
                const isBoundary = (r === 0 || r === rows - 1 || c === 0 || c === cols - 1);
                
                if (!isBoundary && Math.random() < 0.35) {
                    const tree = new THREE.Group();
                    
                    const trunk = new THREE.Mesh(trunkGeom, trunkMat);
                    trunk.position.y = 0.4;
                    trunk.castShadow = true;
                    tree.add(trunk);

                    const leaves = new THREE.Mesh(leavesGeom, leavesMat);
                    leaves.position.y = 0.85;
                    leaves.castShadow = true;
                    tree.add(leaves);

                    tree.position.set(c + 0.5, 0, r + 0.5);
                    treesGroup.add(tree);
                } else {
                    const wall = new THREE.Mesh(wallGeom, wallMat);
                    wall.position.set(c + 0.5, 0.4, r + 0.5);
                    wall.castShadow = true;
                    wall.receiveShadow = true;
                    wallsGroup.add(wall);

                    const line = new THREE.LineSegments(edges, neonLineMat);
                    // 稍微調高 0.002 防止底部邊線與地面 (y=0) 產生深度衝突 (Z-fighting)
                    line.position.set(c + 0.5, 0.402, r + 0.5);
                    wallsGroup.add(line);
                }
            }
        }
    }
    scene.add(wallsGroup);
    scene.add(treesGroup);

    player.x = 1.5;
    player.z = 1.5;
    player.angle = 0.0;
    player.stamina = 100.0;
    player.isDashing = false;
    updateCamera();

    spawnLevelAnimals(level);

    levelTimeLeft = 300;
    document.getElementById('timeVal').textContent = `${levelTimeLeft} 秒`;
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        if (gameState === 'PLAYING') {
            levelTimeLeft--;
            document.getElementById('timeVal').textContent = `${levelTimeLeft} 秒`;
            if (levelTimeLeft <= 0) {
                gameOver();
            }
        }
    }, 1000);

    // 啟動關卡背景音樂
    if (gameState === 'PLAYING') {
        startBGM();
    }
}

// --- 動物生成 ---
function spawnLevelAnimals(level) {
    const spawnedPositions = [];

    function getValidSpawnPos() {
        let attempts = 0;
        while (attempts < 500) {
            attempts++;
            const tc = Math.floor(Math.random() * (cols - 2)) + 1;
            const tr = Math.floor(Math.random() * (rows - 2)) + 1;

            if (mazeGrid[tr][tc] === 0) {
                const distToPlayer = Math.abs(tc - 1) + Math.abs(tr - 1);
                const overlapping = spawnedPositions.some(pos => Math.abs(pos.c - tc) < 1.5 && Math.abs(pos.r - tr) < 1.5);
                
                if (distToPlayer > 4 && !overlapping) {
                    spawnedPositions.push({ c: tc, r: tr });
                    return { x: tc + 0.5, z: tr + 0.5 };
                }
            }
        }
        return { x: cols / 2, z: rows / 2 };
    }

    for (let i = 0; i < level.rabbitCount; i++) {
        const pos = getValidSpawnPos();
        const mesh = createRabbit3D();
        scene.add(mesh);
        animals.push({
            mesh: mesh,
            type: 'rabbit',
            x: pos.x,
            z: pos.z,
            vx: 0,
            vz: 0,
            state: 'WANDER',
            wanderTimer: Math.random() * 2,
            bobOffset: Math.random() * Math.PI * 2,
            active: true
        });
    }

    for (let i = 0; i < level.catCount; i++) {
        const pos = getValidSpawnPos();
        const mesh = createCat3D();
        scene.add(mesh);
        animals.push({
            mesh: mesh,
            type: 'cat',
            x: pos.x,
            z: pos.z,
            vx: 0,
            vz: 0,
            state: 'WANDER',
            wanderTimer: Math.random() * 2.5,
            bobOffset: Math.random() * Math.PI * 2,
            active: true
        });
    }

    for (let i = 0; i < level.dogCount; i++) {
        const pos = getValidSpawnPos();
        const mesh = createDog3D();
        scene.add(mesh);
        animals.push({
            mesh: mesh,
            type: 'dog',
            x: pos.x,
            z: pos.z,
            vx: 0,
            vz: 0,
            state: 'WANDER',
            wanderTimer: Math.random() * 1.8,
            bobOffset: Math.random() * Math.PI * 2,
            active: true
        });
    }
}

// 建立 3D 可愛小兔子模型
function createRabbit3D() {
    const group = new THREE.Group();
    
    const bodyGeom = new THREE.SphereGeometry(0.22, 10, 10);
    const bodyMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.9 });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.y = 0.22;
    body.castShadow = true;
    group.add(body);

    const headGeom = new THREE.SphereGeometry(0.14, 8, 8);
    const head = new THREE.Mesh(headGeom, bodyMat);
    head.position.set(0, 0.35, 0.14);
    head.castShadow = true;
    group.add(head);

    const earGeom = new THREE.CylinderGeometry(0.02, 0.03, 0.22, 6);
    const innerEarMat = new THREE.MeshStandardMaterial({ color: '#fda4af', roughness: 0.8 });
    
    const leftEar = new THREE.Mesh(earGeom, bodyMat);
    leftEar.position.set(-0.06, 0.48, 0.12);
    leftEar.rotation.z = -0.15;
    leftEar.rotation.x = -0.1;
    group.add(leftEar);

    const rightEar = new THREE.Mesh(earGeom, bodyMat);
    rightEar.position.set(0.06, 0.48, 0.12);
    rightEar.rotation.z = 0.15;
    rightEar.rotation.x = -0.1;
    group.add(rightEar);

    const innerEarGeom = new THREE.CylinderGeometry(0.01, 0.015, 0.18, 6);
    const leftInnerEar = new THREE.Mesh(innerEarGeom, innerEarMat);
    leftInnerEar.position.set(-0.05, 0.48, 0.13);
    leftInnerEar.rotation.copy(leftEar.rotation);
    group.add(leftInnerEar);

    const rightInnerEar = new THREE.Mesh(innerEarGeom, innerEarMat);
    rightInnerEar.position.set(0.05, 0.48, 0.13);
    rightInnerEar.rotation.copy(rightEar.rotation);
    group.add(rightInnerEar);

    const eyeGeom = new THREE.SphereGeometry(0.022, 4, 4);
    const eyeMat = new THREE.MeshBasicMaterial({ color: '#ef4444' });
    const leftEye = new THREE.Mesh(eyeGeom, eyeMat);
    leftEye.position.set(-0.07, 0.38, 0.25);
    group.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeom, eyeMat);
    rightEye.position.set(0.07, 0.38, 0.25);
    group.add(rightEye);

    const blushGeom = new THREE.SphereGeometry(0.035, 4, 4);
    const blushMat = new THREE.MeshBasicMaterial({ color: '#f472b6', transparent: true, opacity: 0.65 });
    const leftBlush = new THREE.Mesh(blushGeom, blushMat);
    leftBlush.position.set(-0.1, 0.33, 0.23);
    group.add(leftBlush);

    const rightBlush = new THREE.Mesh(blushGeom, blushMat);
    rightBlush.position.set(0.1, 0.33, 0.23);
    group.add(rightBlush);

    const noseGeom = new THREE.SphereGeometry(0.02, 4, 4);
    const noseMat = new THREE.MeshBasicMaterial({ color: '#f43f5e' });
    const nose = new THREE.Mesh(noseGeom, noseMat);
    nose.position.set(0, 0.34, 0.27);
    group.add(nose);

    const tailGeom = new THREE.SphereGeometry(0.05, 6, 6);
    const tail = new THREE.Mesh(tailGeom, bodyMat);
    tail.position.set(0, 0.2, -0.22);
    group.add(tail);

    return group;
}

// 建立 3D 可愛小貓咪模型
function createCat3D() {
    const group = new THREE.Group();

    const bodyGeom = new THREE.CylinderGeometry(0.16, 0.16, 0.42, 8);
    const bodyMat = new THREE.MeshStandardMaterial({ color: '#f97316', roughness: 0.8 });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    body.rotation.x = Math.PI / 2;
    body.position.y = 0.22;
    body.castShadow = true;
    group.add(body);

    const whiteMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.8 });
    const chestGeom = new THREE.SphereGeometry(0.11, 8, 8);
    const chest = new THREE.Mesh(chestGeom, whiteMat);
    chest.position.set(0, 0.22, 0.16);
    chest.scale.set(1.0, 1.2, 0.6);
    group.add(chest);

    const headGeom = new THREE.SphereGeometry(0.13, 8, 8);
    const head = new THREE.Mesh(headGeom, bodyMat);
    head.position.set(0, 0.34, 0.22);
    head.castShadow = true;
    group.add(head);

    const earGeom = new THREE.ConeGeometry(0.04, 0.09, 4);
    const innerEarMat = new THREE.MeshStandardMaterial({ color: '#fda4af', roughness: 0.8 });
    
    const leftEar = new THREE.Mesh(earGeom, bodyMat);
    leftEar.position.set(-0.06, 0.44, 0.22);
    leftEar.rotation.z = -0.25;
    group.add(leftEar);

    const leftInnerEar = new THREE.Mesh(earGeom, innerEarMat);
    leftInnerEar.scale.set(0.6, 0.7, 0.6);
    leftInnerEar.position.set(-0.05, 0.43, 0.23);
    leftInnerEar.rotation.copy(leftEar.rotation);
    group.add(leftInnerEar);

    const rightEar = new THREE.Mesh(earGeom, bodyMat);
    rightEar.position.set(0.06, 0.44, 0.22);
    rightEar.rotation.z = 0.25;
    group.add(rightEar);

    const rightInnerEar = new THREE.Mesh(earGeom, innerEarMat);
    rightInnerEar.scale.set(0.6, 0.7, 0.6);
    rightInnerEar.position.set(0.05, 0.43, 0.23);
    rightInnerEar.rotation.copy(rightEar.rotation);
    group.add(rightInnerEar);

    const eyeGeom = new THREE.SphereGeometry(0.02, 4, 4);
    const eyeMat = new THREE.MeshBasicMaterial({ color: '#4ade80' });
    const leftEye = new THREE.Mesh(eyeGeom, eyeMat);
    leftEye.position.set(-0.06, 0.36, 0.33);
    group.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeom, eyeMat);
    rightEye.position.set(0.06, 0.36, 0.33);
    group.add(rightEye);

    const blushGeom = new THREE.SphereGeometry(0.035, 4, 4);
    const blushMat = new THREE.MeshBasicMaterial({ color: '#f472b6', transparent: true, opacity: 0.65 });
    const leftBlush = new THREE.Mesh(blushGeom, blushMat);
    leftBlush.position.set(-0.1, 0.31, 0.31);
    group.add(leftBlush);

    const rightBlush = new THREE.Mesh(blushGeom, blushMat);
    rightBlush.position.set(0.1, 0.31, 0.31);
    group.add(rightBlush);

    const noseGeom = new THREE.SphereGeometry(0.016, 4, 4);
    const noseMat = new THREE.MeshBasicMaterial({ color: '#1e293b' });
    const nose = new THREE.Mesh(noseGeom, noseMat);
    nose.position.set(0, 0.33, 0.34);
    group.add(nose);

    const whiskerGeom = new THREE.CylinderGeometry(0.003, 0.003, 0.16, 4);
    
    const w1 = new THREE.Mesh(whiskerGeom, noseMat);
    w1.rotation.z = Math.PI / 2 + 0.12;
    w1.position.set(-0.15, 0.32, 0.31);
    group.add(w1);

    const w2 = new THREE.Mesh(whiskerGeom, noseMat);
    w2.rotation.z = Math.PI / 2 - 0.12;
    w2.position.set(0.15, 0.32, 0.31);
    group.add(w2);

    const legGeom = new THREE.CylinderGeometry(0.035, 0.035, 0.12, 6);
    const pawPositions = [
        [-0.08, 0.06, 0.14],
        [0.08, 0.06, 0.14],
        [-0.08, 0.06, -0.14],
        [0.08, 0.06, -0.14]
    ];
    pawPositions.forEach((pos, idx) => {
        const leg = new THREE.Mesh(legGeom, bodyMat);
        leg.name = `leg${idx}`;
        leg.position.set(pos[0], pos[1] + 0.08, pos[2]);
        group.add(leg);

        const paw = new THREE.Mesh(legGeom, whiteMat);
        paw.scale.set(1.1, 0.6, 1.1);
        paw.position.set(pos[0], pos[1], pos[2]);
        paw.castShadow = true;
        group.add(paw);
    });

    const tailGeom = new THREE.CylinderGeometry(0.015, 0.015, 0.22, 4);
    const tail = new THREE.Mesh(tailGeom, bodyMat);
    tail.name = "tail";
    tail.position.set(0, 0.34, -0.26);
    tail.rotation.x = -Math.PI / 3;
    group.add(tail);

    const tailTipGeom = new THREE.SphereGeometry(0.02, 6, 6);
    const tailTip = new THREE.Mesh(tailTipGeom, whiteMat);
    tailTip.position.set(0, 0.44, -0.32);
    group.add(tailTip);

    return group;
}

// 建立 3D 可愛柴犬模型
function createDog3D() {
    const group = new THREE.Group();

    const bodyGeom = new THREE.BoxGeometry(0.28, 0.28, 0.46);
    const bodyMat = new THREE.MeshStandardMaterial({ color: '#d97706', roughness: 0.85 });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.y = 0.22;
    body.castShadow = true;
    group.add(body);

    const whiteMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.8 });
    const chestGeom = new THREE.SphereGeometry(0.13, 8, 8);
    const chest = new THREE.Mesh(chestGeom, whiteMat);
    chest.position.set(0, 0.22, 0.2);
    chest.scale.set(1.0, 1.2, 0.5);
    group.add(chest);

    const collarGeom = new THREE.CylinderGeometry(0.16, 0.16, 0.04, 8);
    const collarMat = new THREE.MeshStandardMaterial({ color: '#ef4444', roughness: 0.5 });
    const collar = new THREE.Mesh(collarGeom, collarMat);
    collar.position.set(0, 0.29, 0.2);
    collar.rotation.x = Math.PI / 6;
    group.add(collar);

    const bellGeom = new THREE.SphereGeometry(0.03, 6, 6);
    const bellMat = new THREE.MeshStandardMaterial({ color: '#fbbf24', metalness: 0.8, roughness: 0.25 });
    const bell = new THREE.Mesh(bellGeom, bellMat);
    bell.position.set(0, 0.24, 0.27);
    group.add(bell);

    const headGeom = new THREE.BoxGeometry(0.2, 0.2, 0.2);
    const head = new THREE.Mesh(headGeom, bodyMat);
    head.position.set(0, 0.38, 0.24);
    head.castShadow = true;
    group.add(head);

    const snoutGeom = new THREE.BoxGeometry(0.11, 0.08, 0.08);
    const snoutMat = new THREE.MeshStandardMaterial({ color: '#fef08a', roughness: 0.9 });
    const snout = new THREE.Mesh(snoutGeom, snoutMat);
    snout.position.set(0, 0.34, 0.34);
    group.add(snout);

    const noseGeom = new THREE.SphereGeometry(0.02, 4, 4);
    const noseMat = new THREE.MeshBasicMaterial({ color: '#000000' });
    const nose = new THREE.Mesh(noseGeom, noseMat);
    nose.position.set(0, 0.36, 0.39);
    group.add(nose);

    const eyeGeom = new THREE.SphereGeometry(0.02, 4, 4);
    const eyeMat = new THREE.MeshBasicMaterial({ color: '#1e293b' });
    const leftEye = new THREE.Mesh(eyeGeom, eyeMat);
    leftEye.position.set(-0.06, 0.4, 0.33);
    group.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeom, eyeMat);
    rightEye.position.set(0.06, 0.4, 0.33);
    group.add(rightEye);

    const blushGeom = new THREE.SphereGeometry(0.038, 4, 4);
    const blushMat = new THREE.MeshBasicMaterial({ color: '#f472b6', transparent: true, opacity: 0.65 });
    const leftBlush = new THREE.Mesh(blushGeom, blushMat);
    leftBlush.position.set(-0.11, 0.34, 0.3);
    group.add(leftBlush);

    const rightBlush = new THREE.Mesh(blushGeom, blushMat);
    rightBlush.position.set(0.11, 0.34, 0.3);
    group.add(rightBlush);

    const earGeom = new THREE.BoxGeometry(0.04, 0.15, 0.08);
    const earMat = new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.9 });
    
    const leftEar = new THREE.Mesh(earGeom, earMat);
    leftEar.position.set(-0.12, 0.36, 0.24);
    leftEar.rotation.z = -0.15;
    group.add(leftEar);

    const rightEar = new THREE.Mesh(earGeom, earMat);
    rightEar.position.set(0.12, 0.36, 0.24);
    rightEar.rotation.z = 0.15;
    group.add(rightEar);

    const legGeom = new THREE.CylinderGeometry(0.032, 0.03, 0.18, 6);
    const legPositions = [
        [-0.09, 0.09, 0.16],
        [0.09, 0.09, 0.16],
        [-0.09, 0.09, -0.16],
        [0.09, 0.09, -0.16]
    ];
    legPositions.forEach((pos, idx) => {
        const leg = new THREE.Mesh(legGeom, bodyMat);
        leg.name = `leg${idx}`;
        leg.position.set(...pos);
        group.add(leg);
    });

    const tailGeom = new THREE.CylinderGeometry(0.02, 0.02, 0.18, 4);
    const tail = new THREE.Mesh(tailGeom, bodyMat);
    tail.name = "tail";
    tail.position.set(0, 0.32, -0.26);
    tail.rotation.x = Math.PI / 4;
    group.add(tail);

    return group;
}

// --- 核心邏輯更新 ---
function animate() {
    requestAnimationFrame(animate);

    if (gameState !== 'PLAYING') {
        renderer.render(scene, camera);
        return;
    }

    const delta = clock.getDelta();
    const totalTime = clock.getElapsedTime();

    handlePlayerInput(delta);
    updateAnimalsAI(delta, totalTime);
    updateParticles(delta);
    drawMinimap();

    renderer.render(scene, camera);
}

function handlePlayerInput(delta) {
    const isRunningInput = keys.dash;
    
    if (isRunningInput && player.stamina > 0 && (keys.forward || keys.backward || keys.left || keys.right)) {
        if (!player.isDashing) {
            player.isDashing = true;
            playSound('dash');
        }
        player.stamina = Math.max(0, player.stamina - 38 * delta);
    } else {
        player.isDashing = false;
        player.stamina = Math.min(100, player.stamina + 22 * delta);
    }

    const staminaFill = document.getElementById('staminaFill');
    staminaFill.style.width = `${player.stamina}%`;
    if (player.stamina < 15) {
        staminaFill.style.background = '#ef4444';
    } else {
        staminaFill.style.background = 'linear-gradient(90deg, #10b981 0%, #34d399 100%)';
    }

    let moveF = 0;
    if (keys.forward) moveF += 1;
    if (keys.backward) moveF -= 1;

    let rotY = 0;
    if (keys.left) rotY -= 1;
    if (keys.right) rotY += 1;

    const rotateSpeed = 2.4;
    player.angle += rotY * rotateSpeed * delta;

    const currentSpeed = player.isDashing ? CONFIG.player.dashSpeed : CONFIG.player.normalSpeed;
    if (moveF !== 0) {
        const dist = moveF * currentSpeed * delta;
        const dx = Math.cos(player.angle) * dist;
        const dz = Math.sin(player.angle) * dist;

        const nextX = player.x + dx;
        const nextZ = player.z + dz;

        if (!checkWallCollision(nextX, player.z, CONFIG.player.radius)) {
            player.x = nextX;
        }
        if (!checkWallCollision(player.x, nextZ, CONFIG.player.radius)) {
            player.z = nextZ;
        }
    }

    if (playerMesh) {
        playerMesh.position.set(player.x, 0, player.z);
        playerMesh.rotation.y = Math.PI / 2 - player.angle;

        const isMoving = (keys.forward || keys.backward || keys.left || keys.right);
        const swingSpeed = player.isDashing ? 16 : 9;
        const amplitude = player.isDashing ? 0.65 : 0.4;
        
        const body = playerMesh.getObjectByName("playerBody");
        if (body) {
            body.rotation.x = player.isDashing ? 0.24 : (isMoving ? 0.08 : 0);
        }

        const leftLeg = playerMesh.getObjectByName("leftLeg");
        const rightLeg = playerMesh.getObjectByName("rightLeg");
        const leftArm = playerMesh.getObjectByName("leftArm");
        const rightArm = playerMesh.getObjectByName("rightArm");

        if (isMoving) {
            const time = clock.getElapsedTime();
            leftLeg.rotation.x = Math.sin(time * swingSpeed) * amplitude;
            rightLeg.rotation.x = -Math.sin(time * swingSpeed) * amplitude;
            
            leftArm.rotation.x = -Math.sin(time * swingSpeed) * amplitude * 1.1;
            rightArm.rotation.x = Math.sin(time * swingSpeed) * amplitude * 1.1;
        } else {
            leftLeg.rotation.x = 0;
            rightLeg.rotation.x = 0;
            leftArm.rotation.x = 0;
            rightArm.rotation.x = 0;
        }
    }

    updateCamera();
    updateFlashlight();

    // 讓定向陽光及陰影相機的投影中心跟隨主角，防止遠處的陰影因超出投影邊界而被裁切 (Clipping)
    if (sunLight) {
        sunLight.target.position.set(player.x, 0, player.z);
        sunLight.position.set(player.x + 20, 35, player.z + 10);
    }
}

function updateCamera() {
    // 移至更靠近主角身後且向上移，使畫面有一點俯視
    const distBehind = 0.44; // 距離主角身後 0.44 格 (比 0.28 稍遠，遠離相機)
    const camHeight = 0.98;  // 高度移高至 0.98 格 (維持一樣的俯視角度比)
    
    const rawCamX = player.x - Math.cos(player.angle) * distBehind;
    const rawCamZ = player.z - Math.sin(player.angle) * distBehind;
    
    camera.position.x = Math.max(0.35, Math.min(cols - 0.35, rawCamX));
    camera.position.z = Math.max(0.35, Math.min(rows - 0.35, rawCamZ));
    camera.position.y = camHeight;

    const lookX = player.x + Math.cos(player.angle) * 1.25;
    const lookZ = player.z + Math.sin(player.angle) * 1.25;
    camera.lookAt(lookX, 0.18, lookZ);
}

// 綁定相機前方補光燈
function updateFlashlight() {
    const flashlight = scene.getObjectByName("flashlight");
    const target = scene.getObjectByName("flashlightTarget");

    if (flashlight && target) {
        flashlight.position.copy(camera.position);
        const lookX = player.x + Math.cos(player.angle) * 3;
        const lookZ = player.z + Math.sin(player.angle) * 3;
        target.position.set(lookX, CONFIG.player.height - 0.45, lookZ);
    }
}

function checkWallCollision(x, z, radius) {
    const gridX = Math.floor(x);
    const gridZ = Math.floor(z);

    if (gridX < 0 || gridX >= cols || gridZ < 0 || gridZ >= rows) return true;

    for (let r = gridZ - 1; r <= gridZ + 1; r++) {
        for (let c = gridX - 1; c <= gridX + 1; c++) {
            if (r >= 0 && r < rows && c >= 0 && c < cols && mazeGrid[r][c] === 1) {
                const closestX = Math.max(c, Math.min(x, c + 1));
                const closestZ = Math.max(r, Math.min(z, r + 1));

                const dx = x - closestX;
                const dz = z - closestZ;
                const dist = Math.sqrt(dx*dx + dz*dz);
                
                if (dist < radius) return true;
            }
        }
    }
    return false;
}

function updateAnimalsAI(delta, totalTime) {
    animals.forEach((a, index) => {
        if (!a.active) return;

        const cfg = CONFIG.animals[a.type];
        const dxToPlayer = a.x - player.x;
        const dzToPlayer = a.z - player.z;
        const distToPlayer = Math.sqrt(dxToPlayer*dxToPlayer + dzToPlayer*dzToPlayer);

        if (distToPlayer < cfg.detectRange) {
            a.state = 'FLEE';
        } else if (a.state === 'FLEE' && distToPlayer > cfg.detectRange + 1.5) {
            a.state = 'WANDER';
            a.wanderTimer = 0;
        }

        if (a.state === 'FLEE') {
            let fleeX = dxToPlayer / distToPlayer;
            let fleeZ = dzToPlayer / distToPlayer;

            const currentSpeed = cfg.fleeSpeed;
            a.vx = fleeX * currentSpeed;
            a.vz = fleeZ * currentSpeed;

            if (Math.random() < 0.003) {
                playSound(a.type);
            }
        } else {
            a.wanderTimer -= delta;
            if (a.wanderTimer <= 0) {
                if (Math.random() < 0.6) {
                    const angle = Math.random() * Math.PI * 2;
                    a.vx = Math.cos(angle) * cfg.speed;
                    a.vz = Math.sin(angle) * cfg.speed;
                    a.wanderTimer = 1.5 + Math.random() * 2.0;
                } else {
                    a.vx = 0;
                    a.vz = 0;
                    a.wanderTimer = 1.0 + Math.random() * 1.5;
                }
            }
        }

        const nextX = a.x + a.vx * delta;
        const nextZ = a.z + a.vz * delta;

        if (checkWallCollision(nextX, a.z, cfg.radius)) {
            a.vx = -a.vx * 0.8;
            a.wanderTimer = 0;
        } else {
            a.x = nextX;
        }

        if (checkWallCollision(a.x, nextZ, cfg.radius)) {
            a.vz = -a.vz * 0.8;
            a.wanderTimer = 0;
        } else {
            a.z = nextZ;
        }

        a.mesh.position.x = a.x;
        a.mesh.position.z = a.z;

        if (a.vx !== 0 || a.vz !== 0) {
            const angle = Math.atan2(-a.vz, a.vx);
            a.mesh.rotation.y = angle + Math.PI / 2;
        }

        const isMoving = (a.vx !== 0 || a.vz !== 0);
        if (a.type === 'rabbit') {
            if (isMoving) {
                const hopSpeed = a.state === 'FLEE' ? 14.0 : 8.0;
                a.mesh.position.y = Math.max(0, Math.abs(Math.sin(totalTime * hopSpeed + a.bobOffset)) * 0.35);
            } else {
                a.mesh.position.y = 0;
            }
        } else if (a.type === 'cat') {
            a.mesh.position.y = Math.sin(totalTime * 6.0 + a.bobOffset) * 0.02;
            const tail = a.mesh.getObjectByName("tail");
            if (tail) {
                tail.rotation.z = Math.sin(totalTime * 7.0) * 0.25;
            }
        } else if (a.type === 'dog') {
            const dogShakeSpeed = a.state === 'FLEE' ? 12.0 : 6.0;
            a.mesh.position.y = Math.abs(Math.sin(totalTime * dogShakeSpeed + a.bobOffset)) * 0.04;
            
            const tail = a.mesh.getObjectByName("tail");
            if (tail) {
                const wagSpeed = a.state === 'FLEE' ? 18.0 : 8.0;
                tail.rotation.z = Math.sin(totalTime * wagSpeed) * 0.45;
            }

            for (let i = 0; i < 4; i++) {
                const leg = a.mesh.getObjectByName(`leg${i}`);
                if (leg) {
                    const phase = (i === 0 || i === 3) ? 1 : -1;
                    leg.rotation.x = Math.sin(totalTime * dogShakeSpeed + a.bobOffset) * 0.35 * phase;
                }
            }
        }

        if (distToPlayer < (CONFIG.player.radius + cfg.radius)) {
            catchAnimal(index);
        }
    });
}

function catchAnimal(index) {
    const a = animals[index];
    a.active = false;
    scene.remove(a.mesh);

    playSound(a.type);
    playSound('catch');

    triggerCatchFlash();
    spawnScoreBubble();

    caughtCount++;
    updateProgressUI();

    animals.splice(index, 1);

    const level = CONFIG.levels[currentLevelIndex];
    if (caughtCount >= level.targetCount) {
        completeLevel();
    }
}

// 補獲閃光與 +1 特效
function triggerCatchFlash() {
    const flash = document.getElementById('catchFlash');
    flash.classList.add('active');
    setTimeout(() => {
        flash.classList.remove('active');
    }, 120);
}

function spawnScoreBubble() {
    const container = document.getElementById('viewport');
    const bubble = document.createElement('div');
    bubble.className = 'score-bubble';
    bubble.textContent = '+1 🌟';
    
    bubble.style.left = `${container.clientWidth / 2 - 30}px`;
    bubble.style.top = `${container.clientHeight / 2 - 40}px`;

    container.appendChild(bubble);
    setTimeout(() => {
        bubble.remove();
    }, 800);
}

function updateProgressUI() {
    const level = CONFIG.levels[currentLevelIndex];
    document.getElementById('caughtVal').textContent = `${caughtCount} / ${level.targetCount}`;
}

// --- 關卡與結算控制 ---
function completeLevel() {
    gameState = 'LEVEL_COMPLETE';
    playSound('victory');
    if (timerInterval) clearInterval(timerInterval);

    // 停止背景音樂並啟動歡樂五彩紙花慶祝特效
    stopBGM();
    startConfetti();

    let totalCatches = parseInt(localStorage.getItem('animalTagCatches') || '0');
    localStorage.setItem('animalTagCatches', totalCatches + caughtCount);
    
    const timeSpent = 300 - levelTimeLeft;

    if (currentLevelIndex < CONFIG.levels.length - 1) {
        const nextLevelOverlay = document.getElementById('nextLevelOverlay');
        const desc = document.getElementById('nextLevelDesc');
        desc.textContent = `做得好！你花了 ${timeSpent} 秒成功的將小動物們帶回了收容所。下一關挑戰即將開始，準備好了嗎？`;
        nextLevelOverlay.classList.remove('hidden');
    } else {
        const victoryOverlay = document.getElementById('victoryOverlay');
        victoryOverlay.classList.remove('hidden');
    }
}

function startNextLevel() {
    // 停止紙花特效與背景音樂
    stopConfetti();
    stopBGM();
    document.getElementById('nextLevelOverlay').classList.add('hidden');
    currentLevelIndex++;
    buildLevel();
    gameState = 'PLAYING';
    
    const level = CONFIG.levels[currentLevelIndex];
    showLevelAnnouncement(level.name, level.desc);
}

function restartGame() {
    // 停止紙花特效與背景音樂
    stopConfetti();
    stopBGM();
    document.getElementById('victoryOverlay').classList.add('hidden');
    currentLevelIndex = 0;
    buildLevel();
    gameState = 'PLAYING';
    
    const level = CONFIG.levels[currentLevelIndex];
    showLevelAnnouncement(level.name, level.desc);
}

function gameOver() {
    gameState = 'GAMEOVER';
    if (timerInterval) clearInterval(timerInterval);
    playSound('gameover');
    stopBGM(); // 停止背景音樂
    document.getElementById('gameOverOverlay').classList.remove('hidden');
}

function restartLevel() {
    // 確保停止任何紙花特效
    stopConfetti();
    document.getElementById('gameOverOverlay').classList.add('hidden');
    buildLevel();
    gameState = 'PLAYING';
    
    const level = CONFIG.levels[currentLevelIndex];
    showLevelAnnouncement(level.name, level.desc);
}

function showLevelAnnouncement(title, desc) {
    const ann = document.getElementById('levelAnn');
    document.getElementById('levelAnnTitle').textContent = title;
    document.getElementById('levelAnnDesc').textContent = desc;

    ann.classList.add('show-ann');
    setTimeout(() => {
        ann.classList.remove('show-ann');
    }, 3000);
}

function updateParticles(delta) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.mesh.position.x += p.vx * delta;
        p.mesh.position.y += p.vy * delta;
        p.mesh.position.z += p.vz * delta;

        p.vy -= 1.8 * delta;
        p.life -= delta;

        p.mesh.material.opacity = Math.max(0, p.life);
        if (p.life <= 0) {
            scene.remove(p.mesh);
            particles.splice(i, 1);
        }
    }
}

// 2D 小地圖繪製
function drawMinimap() {
    minimapCtx.clearRect(0, 0, minimapCanvas.width, minimapCanvas.height);
    if (!mazeGrid.length) return;

    const cellW = minimapCanvas.width / cols;
    const cellH = minimapCanvas.height / rows;

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (mazeGrid[r][c] === 1) {
                minimapCtx.fillStyle = '#065f46';
            } else {
                minimapCtx.fillStyle = '#022c22';
            }
            minimapCtx.fillRect(c * cellW, r * cellH, cellW, cellH);
        }
    }

    animals.forEach(a => {
        if (!a.active) return;
        
        let color = '#fff';
        if (a.type === 'rabbit') color = '#f472b6';
        else if (a.type === 'cat') color = '#fb923c';
        else if (a.type === 'dog') color = '#facc15';
        
        const dx = a.x - player.x;
        const dz = a.z - player.z;
        const dist = Math.sqrt(dx*dx + dz*dz);
        
        if (dist < 7.5 || currentLevelIndex === 0) {
            minimapCtx.fillStyle = color;
            minimapCtx.beginPath();
            minimapCtx.arc(a.x * cellW, a.z * cellH, cellW * 0.45, 0, Math.PI * 2);
            minimapCtx.fill();
        }
    });

    const px = player.x * cellW;
    const pz = player.z * cellH;

    minimapCtx.fillStyle = '#34d399';
    minimapCtx.beginPath();
    minimapCtx.arc(px, pz, cellW * 0.5, 0, Math.PI * 2);
    minimapCtx.fill();

    minimapCtx.strokeStyle = 'rgba(52, 211, 153, 0.4)';
    minimapCtx.lineWidth = 2;
    minimapCtx.beginPath();
    minimapCtx.moveTo(px, pz);
    minimapCtx.lineTo(px + Math.cos(player.angle) * cellW * 2.2, pz + Math.sin(player.angle) * cellW * 2.2);
    minimapCtx.stroke();
}

// 綠野格子地板紋理
function createGrassTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#064e3b';
    ctx.fillRect(0, 0, 128, 128);

    ctx.fillStyle = '#047857';
    for (let i = 0; i < 200; i++) {
        const w = 1 + Math.random() * 2;
        const h = 2 + Math.random() * 4;
        ctx.fillRect(Math.random() * 128, Math.random() * 128, w, h);
    }

    ctx.strokeStyle = '#022c22';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, 128, 128);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
}

// 灌木牆貼圖
function createHedgeTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#064e3b';
    ctx.fillRect(0, 0, 256, 256);

    ctx.font = '36px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.globalAlpha = 0.6;
    for (let i = 0; i < 30; i++) {
        ctx.fillText(Math.random() < 0.5 ? '🌿' : '🍃', Math.random() * 256, Math.random() * 256);
    }
    ctx.globalAlpha = 1.0;

    ctx.strokeStyle = '#047857';
    ctx.lineWidth = 10;
    ctx.strokeRect(0, 0, 256, 256);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
}

// 鍵盤輸入監聽
function setupInputListeners() {
    window.addEventListener('keydown', (e) => {
        switch (e.code) {
            case 'ArrowUp':
            case 'KeyW':
                keys.forward = true;
                break;
            case 'ArrowDown':
            case 'KeyS':
                keys.backward = true;
                break;
            case 'ArrowLeft':
            case 'KeyA':
                keys.left = true;
                break;
            case 'ArrowRight':
            case 'KeyD':
                keys.right = true;
                break;
            case 'ShiftLeft':
            case 'ShiftRight':
            case 'Space':
                keys.dash = true;
                e.preventDefault();
                break;
        }
    });

    window.addEventListener('keyup', (e) => {
        switch (e.code) {
            case 'ArrowUp':
            case 'KeyW':
                keys.forward = false;
                break;
            case 'ArrowDown':
            case 'KeyS':
                keys.backward = false;
                break;
            case 'ArrowLeft':
            case 'KeyA':
                keys.left = false;
                break;
            case 'ArrowRight':
            case 'KeyD':
                keys.right = false;
                break;
            case 'ShiftLeft':
            case 'ShiftRight':
            case 'Space':
                keys.dash = false;
                break;
        }
    });

    const btnForward = document.getElementById('btnForward');
    const btnBackward = document.getElementById('btnBackward');
    const btnLeft = document.getElementById('btnLeft');
    const btnRight = document.getElementById('btnRight');
    const btnDash = document.getElementById('btnDash');

    function bindMobileBtn(element, keyName) {
        if (!element) return;
        element.addEventListener('touchstart', (e) => {
            keys[keyName] = true;
            touchActive = true;
            e.preventDefault();
        });
        element.addEventListener('touchend', (e) => {
            keys[keyName] = false;
            e.preventDefault();
        });
    }

    bindMobileBtn(btnForward, 'forward');
    bindMobileBtn(btnBackward, 'backward');
    bindMobileBtn(btnLeft, 'left');
    bindMobileBtn(btnRight, 'right');
    bindMobileBtn(btnDash, 'dash');
}

// UI 按鈕綁定
function setupUIEvents() {
    document.getElementById('startBtn').addEventListener('click', () => {
        document.getElementById('startOverlay').classList.add('hidden');
        initAudio();
        currentLevelIndex = 0;
        gameState = 'PLAYING'; // 先設為播放狀態，以利 buildLevel 正常觸發背景音樂
        buildLevel();
        animate();

        const level = CONFIG.levels[currentLevelIndex];
        showLevelAnnouncement(level.name, level.desc);
    });

    document.getElementById('nextLevelBtn').addEventListener('click', () => {
        startNextLevel();
    });

    document.getElementById('winRestartBtn').addEventListener('click', () => {
        restartGame();
    });

    document.getElementById('retryBtn').addEventListener('click', () => {
        restartLevel();
    });

    const muteBtn = document.getElementById('muteBtn');
    muteBtn.addEventListener('click', () => {
        soundEnabled = !soundEnabled;
        muteBtn.textContent = soundEnabled ? '🔊 音效: 開' : '🔇 音效: 關';
        if (soundEnabled) {
            if (gameState === 'PLAYING') startBGM();
        } else {
            stopBGM();
        }
    });
}

// 視窗縮放
window.addEventListener('resize', () => {
    const container = document.getElementById('viewport');
    if (!container || !renderer || !camera) return;

    let width = container.clientWidth || window.innerWidth || 800;
    let height = container.clientHeight || window.innerHeight || 500;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
});

// --- 歡樂過關紙花特效 (Canvas Confetti Effect) ---
let confettiActive = false;
let confettiParticles = [];
const confettiColors = ['#f43f5e', '#ec4899', '#8b5cf6', '#3b82f6', '#06b6d4', '#10b981', '#eab308', '#f97316'];

function startConfetti() {
    const canvas = document.getElementById('confettiCanvas');
    if (!canvas) return;
    canvas.style.display = 'block';
    confettiActive = true;
    confettiParticles = [];

    const resizeCanvas = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // 生成五彩紙花粒子 (150 個)
    for (let i = 0; i < 150; i++) {
        confettiParticles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * -canvas.height - 20,
            r: 4 + Math.random() * 6,
            d: Math.random() * canvas.height,
            color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
            tilt: Math.random() * 10 - 5,
            tiltAngleIncremental: Math.random() * 0.07 + 0.02,
            tiltAngle: 0
        });
    }

    const ctx = canvas.getContext('2d');
    function draw() {
        if (!confettiActive) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            canvas.style.display = 'none';
            return;
        }
        requestAnimationFrame(draw);
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        let activeCount = 0;
        confettiParticles.forEach((p) => {
            p.tiltAngle += p.tiltAngleIncremental;
            p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2;
            p.x += Math.sin(p.tiltAngle);
            p.tilt = Math.sin(p.tiltAngle - activeCount / 3) * 12;

            if (p.y <= canvas.height) {
                activeCount++;
            }

            ctx.beginPath();
            ctx.lineWidth = p.r;
            ctx.strokeStyle = p.color;
            ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
            ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
            ctx.stroke();

            // 落地後循環回頂部
            if (p.y > canvas.height + 20) {
                p.y = -20;
                p.x = Math.random() * canvas.width;
            }
        });
    }
    draw();
}

function stopConfetti() {
    confettiActive = false;
}

// --- 歡樂背景音樂合成器 (Level-Specific Procedural BGM Synthesizer) ---
let bgmInterval = null;
let bgmIndex = 0;

// 每一關專屬的快樂童謠旋律與節奏音符
const levelBGMNotes = [
    // 第一關：追逐小兔兔 (C大調，輕快跳躍)
    [523.25, 659.25, 783.99, 659.25, 698.46, 880.00, 783.99, 659.25, 587.33, 698.46, 659.25, 523.25, 493.88, 587.33, 523.25, 0],
    // 第二關：淘氣貓咪 (D大調，微升音階，節奏稍慢悠閒)
    [587.33, 739.99, 880.00, 739.99, 783.99, 987.77, 880.00, 739.99, 659.25, 783.99, 739.99, 587.33, 554.37, 659.25, 587.33, 0],
    // 第三關：狗狗大賽跑 (E大調，節奏加快，運動奔跑感)
    [659.25, 783.99, 987.77, 783.99, 880.00, 1046.50, 987.77, 783.99, 739.99, 880.00, 783.99, 659.25, 587.33, 739.99, 659.25, 0],
    // 第四關：森林大集合 (C大調完整和弦分解，熱鬧歡樂)
    [523.25, 783.99, 659.25, 783.99, 698.46, 880.00, 783.99, 1046.50, 880.00, 783.99, 698.46, 659.25, 587.33, 493.88, 523.25, 0]
];

// 每一關對應的音符播放間隔毫秒數 (BPM 速度)
const levelBGMSpeeds = [
    280, // 第一關: 280ms/拍 (活潑)
    330, // 第二關: 330ms/拍 (悠閒貓咪)
    215, // 第三關: 215ms/拍 (熱烈奔跑)
    240  // 第四關: 240ms/拍 (熱鬧大集合)
];

function startBGM() {
    if (!soundEnabled) return;
    initAudio();
    if (!audioCtx) return;
    if (bgmInterval) clearInterval(bgmInterval);

    bgmIndex = 0;
    
    // 獲取當前關卡的音符與播放速度
    const notes = levelBGMNotes[currentLevelIndex] || levelBGMNotes[0];
    const speed = levelBGMSpeeds[currentLevelIndex] || levelBGMSpeeds[0];
    const noteDuration = (speed / 1000) * 0.95; // 稍短於間隔時間以利音符斷音 (Staccato)

    const playNextNote = () => {
        // 如果非播放狀態或已被靜音，立刻自我停播
        if (gameState !== 'PLAYING' || !soundEnabled) {
            stopBGM();
            return;
        }

        const note = notes[bgmIndex];
        if (note > 0) {
            try {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                
                // 採用溫和圓潤的三角波，具有 8-bit 木琴般舒服的懷舊質感
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(note, audioCtx.currentTime);
                
                // 設定極淡的主動音量，作為適宜的背景音，不吵雜 (Max 0.05)
                gain.gain.setValueAtTime(0.0, audioCtx.currentTime);
                gain.gain.linearRampToValueAtTime(0.045, audioCtx.currentTime + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + noteDuration);
                
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                
                osc.start();
                osc.stop(audioCtx.currentTime + noteDuration);
            } catch (e) {
                console.warn("背景音樂播放異常:", e);
            }
        }
        
        bgmIndex = (bgmIndex + 1) % notes.length;
    };

    // 啟動定時調用
    bgmInterval = setInterval(playNextNote, speed);
}

function stopBGM() {
    if (bgmInterval) {
        clearInterval(bgmInterval);
        bgmInterval = null;
    }
}
