
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

            const playYip = (delay, pitch) => {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = 'triangle';
                

                osc.frequency.setValueAtTime(pitch, time + delay);
                osc.frequency.exponentialRampToValueAtTime(pitch * 1.6, time + delay + 0.07);
                
                gain.gain.setValueAtTime(0.18, time + delay);
                gain.gain.exponentialRampToValueAtTime(0.01, time + delay + 0.07);
                
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start(time + delay);
                osc.stop(time + delay + 0.08);
            };

            playYip(0, 480);
            playYip(0.08, 560);
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
        radius: 0.18
    },
    animals: {
        rabbit: { speed: 1.5, fleeSpeed: 3.5, detectRange: 5.5, radius: 0.28, color: '#f8fafc' },
        cat: { speed: 1.3, fleeSpeed: 3.2, detectRange: 4.8, radius: 0.26, color: '#f97316' },
        dog: { speed: 1.8, fleeSpeed: 4.0, detectRange: 6.0, radius: 0.32, color: '#ca8a04' }
    }
};


let scene, camera, renderer;
let clock;
let currentLevelIndex = 0;
let gameState = 'START';
let mazeGrid = [];
let cols = 0, rows = 0;
let wallsGroup = null;
let treesGroup = null;
let playerMesh = null;
let sunLight = null;


let joystickActive = false;
let joystickTouchId = null;
let joystickStartX = 0;
let joystickStartY = 0;
let joystickX = 0;
let joystickY = 0;


const player = {
    x: 1.5,
    z: 1.5,
    angle: 0.0,
    stamina: 100.0,
    isDashing: false
};


const keys = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    dash: false
};

let touchActive = false;
let minimapCanvas, minimapCtx;


let animals = [];
let particles = [];
let caughtCount = 0;
let levelTimeLeft = 300;
let totalTimeElapsed = 0;
let timerInterval = null;


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
    scene.background = new THREE.Color('#bae6fd');
    scene.fog = new THREE.FogExp2('#bae6fd', 0.035);

    camera = new THREE.PerspectiveCamera(90, width / height, 0.1, 100);
    camera.position.set(player.x, CONFIG.player.height, player.z);

    renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('canvas3d'), antialias: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    clock = new THREE.Clock();

    minimapCanvas = document.getElementById('minimapCanvas');
    minimapCtx = minimapCanvas.getContext('2d');


    const ambientLight = new THREE.AmbientLight('#ffffff', 0.7);
    scene.add(ambientLight);


    sunLight = new THREE.DirectionalLight('#fffbeb', 1.1);
    sunLight.position.set(20, 35, 10);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    

    sunLight.shadow.camera.left = -22;
    sunLight.shadow.camera.right = 22;
    sunLight.shadow.camera.top = 22;
    sunLight.shadow.camera.bottom = -22;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 100;
    

    sunLight.shadow.bias = -0.00005;
    scene.add(sunLight);
    scene.add(sunLight.target);


    const sunGeom = new THREE.SphereGeometry(2.8, 16, 16);
    const sunMat = new THREE.MeshBasicMaterial({ color: '#fef08a' });
    const sunMesh = new THREE.Mesh(sunGeom, sunMat);
    sunMesh.position.set(20, 26, -30);
    scene.add(sunMesh);


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


    const flashlight = new THREE.SpotLight('#ffffff', 0.15, 15, Math.PI / 6, 0.5, 1.0);
    flashlight.name = "flashlight";
    scene.add(flashlight);

    const flashlightTarget = new THREE.Object3D();
    flashlightTarget.name = "flashlightTarget";
    scene.add(flashlightTarget);
    flashlight.target = flashlightTarget;


    playerMesh = createPlayerMesh();
    scene.add(playerMesh);

    setupInputListeners();
    setupUIEvents();
}


function createPlayerMesh() {
    const group = new THREE.Group();

    const bodyGeom = new THREE.BoxGeometry(0.14, 0.30, 0.10);
    const bodyMat = new THREE.MeshStandardMaterial({ color: '#2563eb', roughness: 0.7 });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    body.name = "playerBody";
    body.position.y = 0.43;
    body.castShadow = true;
    group.add(body);


    const headGeom = new THREE.SphereGeometry(0.038, 8, 8);
    const headMat = new THREE.MeshStandardMaterial({ color: '#fed7aa', roughness: 0.8 });
    const head = new THREE.Mesh(headGeom, headMat);
    head.position.set(0, 0.65, 0);
    head.castShadow = true;
    group.add(head);


    const hairGeom = new THREE.BoxGeometry(0.08, 0.04, 0.08);
    const hairMat = new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.9 });
    const hair = new THREE.Mesh(hairGeom, hairMat);
    hair.position.set(0, 0.678, -0.012);
    group.add(hair);


    const bangsGeom = new THREE.BoxGeometry(0.08, 0.016, 0.024);
    const bangs = new THREE.Mesh(bangsGeom, hairMat);
    bangs.position.set(0, 0.69, 0.02);
    group.add(bangs);


    const legGeom = new THREE.CylinderGeometry(0.018, 0.015, 0.34, 6);
    const pantsMat = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.8 });
    
    const leftLeg = new THREE.Mesh(legGeom, pantsMat);
    leftLeg.name = "leftLeg";
    leftLeg.position.set(-0.035, 0.17, 0);
    leftLeg.castShadow = true;
    group.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeom, pantsMat);
    rightLeg.name = "rightLeg";
    rightLeg.position.set(0.035, 0.17, 0);
    rightLeg.castShadow = true;
    group.add(rightLeg);


    const armGeom = new THREE.CylinderGeometry(0.022, 0.018, 0.26, 6);
    
    const leftArm = new THREE.Mesh(armGeom, bodyMat);
    leftArm.name = "leftArm";
    leftArm.position.set(-0.09, 0.44, 0);
    leftArm.castShadow = true;
    group.add(leftArm);

    const rightArm = new THREE.Mesh(armGeom, bodyMat);
    rightArm.name = "rightArm";
    rightArm.position.set(0.09, 0.44, 0);
    rightArm.castShadow = true;
    group.add(rightArm);

    return group;
}


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

                    mazeGrid[r][c] = 2;

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
    if (typeof syncMobileHUD === 'function') syncMobileHUD();
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        if (gameState === 'PLAYING') {
            levelTimeLeft--;
            document.getElementById('timeVal').textContent = `${levelTimeLeft} 秒`;
            if (typeof syncMobileHUD === 'function') syncMobileHUD();
            if (levelTimeLeft <= 0) {
                gameOver();
            }
        }
    }, 1000);


    if (gameState === 'PLAYING') {
        startBGM();
    }
}


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
    const isMovingInput = joystickActive ? (Math.abs(joystickX) > 0.15 || Math.abs(joystickY) > 0.15) : (keys.forward || keys.backward || keys.left || keys.right);
    
    if (isRunningInput && player.stamina > 0 && isMovingInput) {
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
    let rotY = 0;

    if (joystickActive) {
        moveF = -joystickY;
        rotY = joystickX;
    } else {
        if (keys.forward) moveF += 1;
        if (keys.backward) moveF -= 1;
        if (keys.left) rotY -= 1;
        if (keys.right) rotY += 1;
    }

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

        const isMoving = joystickActive ? (Math.abs(joystickX) > 0.1 || Math.abs(joystickY) > 0.1) : (keys.forward || keys.backward || keys.left || keys.right);
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


    if (sunLight) {
        sunLight.target.position.set(player.x, 0, player.z);
        sunLight.position.set(player.x + 20, 35, player.z + 10);
    }
}

function updateCamera() {

    const distBehind = 0.44;
    const camHeight = 0.98;
    
    const rawCamX = player.x - Math.cos(player.angle) * distBehind;
    const rawCamZ = player.z - Math.sin(player.angle) * distBehind;
    
    camera.position.x = Math.max(0.35, Math.min(cols - 0.35, rawCamX));
    camera.position.z = Math.max(0.35, Math.min(rows - 0.35, rawCamZ));
    camera.position.y = camHeight;

    const lookX = player.x + Math.cos(player.angle) * 1.25;
    const lookZ = player.z + Math.sin(player.angle) * 1.25;
    camera.lookAt(lookX, 0.18, lookZ);
}


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
            if (r >= 0 && r < rows && c >= 0 && c < cols) {
                const cellType = mazeGrid[r][c];
                
                if (cellType === 1) {

                    const closestX = Math.max(c + 0.1, Math.min(x, c + 0.9));
                    const closestZ = Math.max(r + 0.1, Math.min(z, r + 0.9));

                    const dx = x - closestX;
                    const dz = z - closestZ;
                    const dist = Math.sqrt(dx * dx + dz * dz);
                    
                    if (dist < radius) return true;
                } else if (cellType === 2) {

                    const treeX = c + 0.5;
                    const treeZ = r + 0.5;
                    const dx = x - treeX;
                    const dz = z - treeZ;
                    const dist = Math.sqrt(dx * dx + dz * dz);
                    
                    const treeCollisionRadius = 0.10;
                    if (dist < (treeCollisionRadius + radius)) {
                        return true;
                    }
                }
            }
        }
    }
    return false;
}


function findSmartFleeDirection(a, fleeX, fleeZ, radius) {

    const angles = [
        0, 
        Math.PI / 6, -Math.PI / 6, 
        Math.PI / 3, -Math.PI / 3, 
        Math.PI / 2, -Math.PI / 2, 
        2 * Math.PI / 3, -2 * Math.PI / 3,
        5 * Math.PI / 6, -5 * Math.PI / 6,
        Math.PI
    ];
    const baseAngle = Math.atan2(fleeZ, fleeX);
    const lookahead = 0.8;

    for (let i = 0; i < angles.length; i++) {
        const testAngle = baseAngle + angles[i];
        const testX = Math.cos(testAngle);
        const testZ = Math.sin(testAngle);

        const targetX = a.x + testX * lookahead;
        const targetZ = a.z + testZ * lookahead;


        if (!checkWallCollision(targetX, targetZ, radius)) {
            return { x: testX, z: testZ };
        }
    }


    return { x: fleeX, z: fleeZ };
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


            const smartDir = findSmartFleeDirection(a, fleeX, fleeZ, cfg.radius);

            const currentSpeed = cfg.fleeSpeed;
            a.vx = smartDir.x * currentSpeed;
            a.vz = smartDir.z * currentSpeed;

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

const ChineseNumerals = ['一', '二', '三', '四', '五', '六'];

function showToast(message) {
    const oldToast = document.getElementById('hudToast');
    if (oldToast) oldToast.remove();

    const toast = document.createElement('div');
    toast.id = 'hudToast';
    toast.style.position = 'absolute';
    toast.style.top = '70px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.background = 'rgba(15, 23, 42, 0.85)';
    toast.style.color = '#fff';
    toast.style.padding = '8px 18px';
    toast.style.borderRadius = '12px';
    toast.style.border = '1px solid rgba(56, 189, 248, 0.3)';
    toast.style.boxShadow = '0 8px 20px rgba(0,0,0,0.4), 0 0 10px rgba(56, 189, 248, 0.1)';
    toast.style.fontSize = '0.9rem';
    toast.style.fontWeight = '600';
    toast.style.zIndex = '9999';
    toast.style.pointerEvents = 'none';
    toast.style.transition = 'opacity 0.3s, transform 0.3s';
    toast.style.opacity = '0';
    toast.style.transform = 'translate(-50%, -10px)';
    
    toast.textContent = message;
    const container = document.getElementById('viewport');
    if (container) {
        container.appendChild(toast);
    }

    toast.offsetHeight;

    toast.style.opacity = '1';
    toast.style.transform = 'translate(-50%, 0)';

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translate(-50%, -10px)';
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 2800);
}

function syncMobileHUD() {
    const level = CONFIG.levels[currentLevelIndex];
    if (!level) return;
    const chLevel = ChineseNumerals[currentLevelIndex] || (currentLevelIndex + 1);
    
    const mLvl = document.getElementById('mobileLevelVal');
    const mCgt = document.getElementById('mobileCaughtVal');
    const mTim = document.getElementById('mobileTimeVal');
    
    if (mLvl) mLvl.textContent = `第${chLevel}關`;
    if (mCgt) mCgt.textContent = `${caughtCount}/${level.targetCount}`;
    if (mTim) mTim.textContent = levelTimeLeft;
}

function updateProgressUI() {
    const level = CONFIG.levels[currentLevelIndex];
    document.getElementById('caughtVal').textContent = `${caughtCount} / ${level.targetCount}`;
    syncMobileHUD();
}


function completeLevel() {
    gameState = 'LEVEL_COMPLETE';
    playSound('victory');
    if (timerInterval) clearInterval(timerInterval);


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
    stopBGM();
    document.getElementById('gameOverOverlay').classList.remove('hidden');
}

function restartLevel() {

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


function drawMinimap() {
    minimapCtx.clearRect(0, 0, minimapCanvas.width, minimapCanvas.height);
    if (!mazeGrid.length) return;

    const cellW = minimapCanvas.width / cols;
    const cellH = minimapCanvas.height / rows;

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (mazeGrid[r][c] === 1) {

                minimapCtx.fillStyle = '#065f46';
                minimapCtx.fillRect(c * cellW, r * cellH, cellW, cellH);
            } else if (mazeGrid[r][c] === 2) {

                minimapCtx.fillStyle = '#022c22';
                minimapCtx.fillRect(c * cellW, r * cellH, cellW, cellH);
                
                minimapCtx.fillStyle = '#16a34a';
                minimapCtx.beginPath();
                minimapCtx.arc((c + 0.5) * cellW, (r + 0.5) * cellH, cellW * 0.3, 0, Math.PI * 2);
                minimapCtx.fill();
            } else {

                minimapCtx.fillStyle = '#022c22';
                minimapCtx.fillRect(c * cellW, r * cellH, cellW, cellH);
            }
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


    const btnDash = document.getElementById('btnDash');
    if (btnDash) {
        btnDash.addEventListener('touchstart', (e) => {
            keys.dash = true;
            touchActive = true;
            e.preventDefault();
        });
        btnDash.addEventListener('touchend', (e) => {
            keys.dash = false;
            e.preventDefault();
        });
    }


    const joystickZone = document.getElementById('joystickTouchArea');
    const joystickBase = document.getElementById('joystickBase');
    const joystickKnob = document.getElementById('joystickKnob');

    if (joystickZone && joystickBase && joystickKnob) {

        const maxRadius = 45;

        joystickZone.addEventListener('touchstart', (e) => {
            if (joystickActive) return;
            
            const touch = e.changedTouches[0];
            joystickTouchId = touch.identifier;
            joystickActive = true;
            touchActive = true;
            

            joystickZone.classList.add('active');


            const rect = joystickBase.getBoundingClientRect();
            joystickStartX = rect.left + rect.width / 2;
            joystickStartY = rect.top + rect.height / 2;

            updateJoystick(touch.clientX, touch.clientY);
            e.preventDefault();
        }, { passive: false });

        joystickZone.addEventListener('touchmove', (e) => {
            if (!joystickActive) return;
            

            for (let i = 0; i < e.touches.length; i++) {
                if (e.touches[i].identifier === joystickTouchId) {
                    updateJoystick(e.touches[i].clientX, e.touches[i].clientY);
                    break;
                }
            }
            e.preventDefault();
        }, { passive: false });

        const endJoystick = (e) => {
            if (!joystickActive) return;
            

            let isJoystickRelease = false;
            if (e.changedTouches) {
                for (let i = 0; i < e.changedTouches.length; i++) {
                    if (e.changedTouches[i].identifier === joystickTouchId) {
                        isJoystickRelease = true;
                        break;
                    }
                }
            } else {
                isJoystickRelease = true;
            }

            if (isJoystickRelease) {
                joystickActive = false;
                joystickTouchId = null;
                joystickX = 0;
                joystickY = 0;
                

                joystickZone.classList.remove('active');
                joystickKnob.style.left = '50%';
                joystickKnob.style.top = '50%';
            }
        };

        joystickZone.addEventListener('touchend', endJoystick, { passive: false });
        joystickZone.addEventListener('touchcancel', endJoystick, { passive: false });

        function updateJoystick(clientX, clientY) {
            let dx = clientX - joystickStartX;
            let dy = clientY - joystickStartY;
            const dist = Math.sqrt(dx * dx + dy * dy);


            if (dist > maxRadius) {
                dx = (dx / dist) * maxRadius;
                dy = (dy / dist) * maxRadius;
            }


            joystickKnob.style.left = `calc(50% + ${dx}px)`;
            joystickKnob.style.top = `calc(50% + ${dy}px)`;


            joystickX = dx / maxRadius;
            joystickY = dy / maxRadius;
        }
    }
}


function setupUIEvents() {
    document.getElementById('startBtn').addEventListener('click', () => {
        document.getElementById('startOverlay').classList.add('hidden');
        initAudio();
        currentLevelIndex = 0;
        gameState = 'PLAYING';
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

    const mobileInfoBtn = document.getElementById('mobileInfoBtn');
    if (mobileInfoBtn) {
        mobileInfoBtn.addEventListener('click', () => {
            const chLevel = ChineseNumerals[currentLevelIndex] || (currentLevelIndex + 1);
            const levelName = `第${chLevel}關`;
            const infoText = `森林守護者，加油！🐾 目前是「${levelName}」，你已成功收容 ${caughtCount} 隻調皮的小傢伙（目標 ${CONFIG.levels[currentLevelIndex].targetCount} 隻），時間還剩 ${levelTimeLeft} 秒喔！快快追上牠們吧！❤️`;
            showToast(infoText);
        });
    }
}


window.addEventListener('resize', () => {
    const container = document.getElementById('viewport');
    if (!container || !renderer || !camera) return;

    let width = container.clientWidth || window.innerWidth || 800;
    let height = container.clientHeight || window.innerHeight || 500;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
});


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


let bgmInterval = null;
let bgmIndex = 0;


const levelBGMNotes = [

    [523.25, 659.25, 783.99, 659.25, 698.46, 880.00, 783.99, 659.25, 587.33, 698.46, 659.25, 523.25, 493.88, 587.33, 523.25, 0],

    [587.33, 739.99, 880.00, 739.99, 783.99, 987.77, 880.00, 739.99, 659.25, 783.99, 739.99, 587.33, 554.37, 659.25, 587.33, 0],

    [659.25, 783.99, 987.77, 783.99, 880.00, 1046.50, 987.77, 783.99, 739.99, 880.00, 783.99, 659.25, 587.33, 739.99, 659.25, 0],

    [523.25, 783.99, 659.25, 783.99, 698.46, 880.00, 783.99, 1046.50, 880.00, 783.99, 698.46, 659.25, 587.33, 493.88, 523.25, 0]
];


const levelBGMSpeeds = [
    280,
    330,
    215,
    240
];

function startBGM() {
    if (!soundEnabled) return;
    initAudio();
    if (!audioCtx) return;
    if (bgmInterval) clearInterval(bgmInterval);

    bgmIndex = 0;
    

    const notes = levelBGMNotes[currentLevelIndex] || levelBGMNotes[0];
    const speed = levelBGMSpeeds[currentLevelIndex] || levelBGMSpeeds[0];
    const noteDuration = (speed / 1000) * 0.95;

    const playNextNote = () => {

        if (gameState !== 'PLAYING' || !soundEnabled) {
            stopBGM();
            return;
        }

        const note = notes[bgmIndex];
        if (note > 0) {
            try {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(note, audioCtx.currentTime);
                

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


    bgmInterval = setInterval(playNextNote, speed);
}

function stopBGM() {
    if (bgmInterval) {
        clearInterval(bgmInterval);
        bgmInterval = null;
    }
}