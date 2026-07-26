
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
            rabbitCount: 16,
            catCount: 0,
            dogCount: 0,
            desc: "第一關：快去抓住 8 隻蹦蹦跳跳的小兔子！🐇",
            name: "第一關：追逐小兔兔 🐇"
        },
        {
            size: 25,
            targetCount: 10,
            rabbitCount: 0,
            catCount: 18,
            dogCount: 0,
            desc: "第二關：抓住 10 隻愛躲在樹後面的淘氣小貓咪！🐈",
            name: "第二關：尋找頑皮貓 🐈"
        },
        {
            size: 29,
            targetCount: 12,
            rabbitCount: 0,
            catCount: 0,
            dogCount: 22,
            desc: "第三關：挑戰抓住 12 隻奔跑迅速的活潑小狗狗！🐕",
            name: "第三關：狗狗大賽跑 🐕"
        },
        {
            size: 35,
            targetCount: 18,
            rabbitCount: 12,
            catCount: 12,
            dogCount: 12,
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
        rabbit: { speed: 0.9, fleeSpeed: 2.3, detectRange: 5.5, radius: 0.28, color: '#f8fafc' },
        cat: { speed: 0.8, fleeSpeed: 2.1, detectRange: 4.8, radius: 0.26, color: '#f97316' },
        dog: { speed: 1.1, fleeSpeed: 2.6, detectRange: 6.0, radius: 0.32, color: '#ca8a04' }
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
    y: 0.0,
    z: 1.5,
    vy: 0.0,
    angle: 0.0,
    stamina: 100.0,
    isDashing: false
};

const keys = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    dash: false,
    jump: false
};

let animTime = 0;
let currentAnimState = 'IDLE';
let isJumping = false;
let jumpProgress = 0;

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


let torsoGroup, headGroup, eyeLeft, eyeRight, stemGroup, flowerGroup;
let leftArmGroup, leftForearmGroup, rightArmGroup, rightForearmGroup;
let leftLegGroup, leftKneeGroup, rightLegGroup, rightKneeGroup;

function createPlayerMesh() {
    const root = new THREE.Group();

    const pikminBlueMat = new THREE.MeshStandardMaterial({ color: '#1d4ed8', roughness: 0.35, metalness: 0.08 });
    const whiteMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.25 });
    const pupilMat = new THREE.MeshBasicMaterial({ color: '#09090b' });
    const mouthMat = new THREE.MeshBasicMaterial({ color: '#1e1b4b' });
    const sepalMat = new THREE.MeshStandardMaterial({ color: '#16a34a', roughness: 0.4 });
    const yellowMat = new THREE.MeshBasicMaterial({ color: '#facc15' });

    torsoGroup = new THREE.Group();
    torsoGroup.position.y = 0.74;

    const torsoGeom = new THREE.CylinderGeometry(0.075, 0.18, 0.65, 32);
    const torsoMesh = new THREE.Mesh(torsoGeom, pikminBlueMat);
    torsoMesh.castShadow = true;
    torsoGroup.add(torsoMesh);

    const bottomCapGeom = new THREE.SphereGeometry(0.18, 24, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
    const bottomCap = new THREE.Mesh(bottomCapGeom, pikminBlueMat);
    bottomCap.position.y = -0.325;
    bottomCap.castShadow = true;
    torsoGroup.add(bottomCap);

    headGroup = new THREE.Group();
    headGroup.position.set(0, 0.36, 0);

    const headGeom = new THREE.SphereGeometry(0.24, 28, 28);
    const headMesh = new THREE.Mesh(headGeom, pikminBlueMat);
    headMesh.scale.set(0.95, 1.15, 0.95);
    headMesh.castShadow = true;
    headGroup.add(headMesh);

    const eyeGeom = new THREE.SphereGeometry(0.078, 16, 16);
    
    eyeLeft = new THREE.Mesh(eyeGeom, whiteMat);
    eyeLeft.position.set(-0.13, 0.02, 0.16);
    eyeLeft.castShadow = true;
    headGroup.add(eyeLeft);

    eyeRight = new THREE.Mesh(eyeGeom, whiteMat);
    eyeRight.position.set(0.13, 0.02, 0.16);
    eyeRight.castShadow = true;
    headGroup.add(eyeRight);

    const pupilGeom = new THREE.SphereGeometry(0.040, 16, 16);
    const pupilLeft = new THREE.Mesh(pupilGeom, pupilMat);
    pupilLeft.position.set(-0.13, 0.02, 0.225);
    headGroup.add(pupilLeft);

    const pupilRight = new THREE.Mesh(pupilGeom, pupilMat);
    pupilRight.position.set(0.13, 0.02, 0.225);
    headGroup.add(pupilRight);

    const mouthGeom = new THREE.CylinderGeometry(0.028, 0.022, 0.02, 16);
    const mouth = new THREE.Mesh(mouthGeom, mouthMat);
    mouth.rotation.x = Math.PI / 2;
    mouth.position.set(0, -0.11, 0.21);
    headGroup.add(mouth);

    stemGroup = new THREE.Group();
    stemGroup.position.set(0, 0.23, 0);

    const curvePoints = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0.18, -0.04),
        new THREE.Vector3(0.02, 0.38, -0.10),
        new THREE.Vector3(0.04, 0.55, -0.16)
    ];
    const stemCurve = new THREE.CatmullRomCurve3(curvePoints);
    const stemGeom = new THREE.TubeGeometry(stemCurve, 24, 0.026, 12, false);
    const stemMesh = new THREE.Mesh(stemGeom, pikminBlueMat);
    stemMesh.castShadow = true;
    stemGroup.add(stemMesh);

    const stemEnd = stemCurve.getPoint(1);
    const stemTangent = stemCurve.getTangent(1).normalize();
    const upVector = new THREE.Vector3(0, 1, 0);

    const sepalGeom = new THREE.ConeGeometry(0.055, 0.08, 12);
    const sepal = new THREE.Mesh(sepalGeom, sepalMat);
    sepal.position.copy(stemEnd.clone().sub(stemTangent.clone().multiplyScalar(0.04)));
    sepal.quaternion.setFromUnitVectors(upVector, stemTangent.clone().negate());
    stemGroup.add(sepal);

    flowerGroup = new THREE.Group();
    flowerGroup.position.copy(stemEnd);
    flowerGroup.quaternion.setFromUnitVectors(upVector, stemTangent);

    const centerGeom = new THREE.CylinderGeometry(0.045, 0.045, 0.025, 16);
    const centerMesh = new THREE.Mesh(centerGeom, yellowMat);
    centerMesh.position.y = 0.07;
    flowerGroup.add(centerMesh);

    const petalCount = 5;
    for (let i = 0; i < petalCount; i++) {
        const petalPivot = new THREE.Group();
        petalPivot.rotation.y = (i * Math.PI * 2) / petalCount;

        const petalGeom = new THREE.SphereGeometry(0.10, 16, 16);
        const petal = new THREE.Mesh(petalGeom, whiteMat);
        petal.scale.set(1.2, 0.25, 2.2);
        petal.position.set(0, 0.01, 0.12);
        petal.rotation.x = 0.15;
        petal.castShadow = true;

        petalPivot.add(petal);
        flowerGroup.add(petalPivot);
    }
    stemGroup.add(flowerGroup);

    headGroup.add(stemGroup);
    torsoGroup.add(headGroup);

    leftArmGroup = new THREE.Group();
    leftArmGroup.position.set(-0.11, 0.14, 0.0);
    const leftUpperArmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.020, 0.016, 0.16, 8), pikminBlueMat);
    leftUpperArmMesh.position.y = -0.08;
    leftUpperArmMesh.castShadow = true;
    leftArmGroup.add(leftUpperArmMesh);

    leftForearmGroup = new THREE.Group();
    leftForearmGroup.position.set(0, -0.16, 0);
    const leftForearmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.014, 0.15, 8), pikminBlueMat);
    leftForearmMesh.position.y = -0.075;
    leftForearmMesh.castShadow = true;
    leftForearmGroup.add(leftForearmMesh);
    const leftHand = new THREE.Mesh(new THREE.SphereGeometry(0.020, 8, 8), pikminBlueMat);
    leftHand.position.y = -0.15;
    leftForearmGroup.add(leftHand);
    leftArmGroup.add(leftForearmGroup);
    torsoGroup.add(leftArmGroup);

    rightArmGroup = new THREE.Group();
    rightArmGroup.position.set(0.11, 0.14, 0.0);
    const rightUpperArmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.020, 0.016, 0.16, 8), pikminBlueMat);
    rightUpperArmMesh.position.y = -0.08;
    rightUpperArmMesh.castShadow = true;
    rightArmGroup.add(rightUpperArmMesh);

    rightForearmGroup = new THREE.Group();
    rightForearmGroup.position.set(0, -0.16, 0);
    const rightForearmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.014, 0.15, 8), pikminBlueMat);
    rightForearmMesh.position.y = -0.075;
    rightForearmMesh.castShadow = true;
    rightForearmGroup.add(rightForearmMesh);
    const rightHand = new THREE.Mesh(new THREE.SphereGeometry(0.020, 8, 8), pikminBlueMat);
    rightHand.position.y = -0.15;
    rightForearmGroup.add(rightHand);
    rightArmGroup.add(rightForearmGroup);
    torsoGroup.add(rightArmGroup);

    function build3ToedLeg(sideSign) {
        const legGroup = new THREE.Group();
        legGroup.position.set(sideSign * 0.09, -0.32, 0);

        const thighMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.030, 0.18, 8), pikminBlueMat);
        thighMesh.position.y = -0.09;
        thighMesh.castShadow = true;
        legGroup.add(thighMesh);

        const kneeGroup = new THREE.Group();
        kneeGroup.position.set(0, -0.18, 0);

        const kneeJoint = new THREE.Mesh(new THREE.SphereGeometry(0.032, 12, 12), pikminBlueMat);
        kneeJoint.castShadow = true;
        kneeGroup.add(kneeJoint);

        const calfMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.030, 0.025, 0.18, 8), pikminBlueMat);
        calfMesh.position.y = -0.09;
        calfMesh.castShadow = true;
        kneeGroup.add(calfMesh);

        const footGroup = new THREE.Group();
        footGroup.position.set(0, -0.18, 0);

        const footMesh = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.03, 0.10), pikminBlueMat);
        footMesh.position.set(0, -0.015, 0.03);
        footMesh.castShadow = true;
        footGroup.add(footMesh);

        const toeGeom = new THREE.SphereGeometry(0.014, 8, 8);
        toeGeom.scale(1, 0.7, 1.4);

        const toe1 = new THREE.Mesh(toeGeom, pikminBlueMat);
        toe1.position.set(-0.022, -0.015, 0.08);
        footGroup.add(toe1);

        const toe2 = new THREE.Mesh(toeGeom, pikminBlueMat);
        toe2.position.set(0, -0.015, 0.09);
        footGroup.add(toe2);

        const toe3 = new THREE.Mesh(toeGeom, pikminBlueMat);
        toe3.position.set(0.022, -0.015, 0.08);
        footGroup.add(toe3);

        kneeGroup.add(footGroup);
        legGroup.add(kneeGroup);

        return { legGroup, kneeGroup, footGroup };
    }

    const leftLegObj = build3ToedLeg(-1);
    leftLegGroup = leftLegObj.legGroup;
    leftKneeGroup = leftLegObj.kneeGroup;
    torsoGroup.add(leftLegGroup);

    const rightLegObj = build3ToedLeg(1);
    rightLegGroup = rightLegObj.legGroup;
    rightKneeGroup = rightLegObj.kneeGroup;
    torsoGroup.add(rightLegGroup);

    root.add(torsoGroup);
    
    // Original game.js expected playerMesh to have name "playerMesh"
    root.name = "playerMesh";
    
    // Scale Pikmin to match animal_tag_3d original player size
    root.scale.setScalar(0.45);

    return root;
}


function buildLevel() {
    if (wallsGroup) scene.remove(wallsGroup);
    if (treesGroup) scene.remove(treesGroup);
    if (window.rocksGroup) scene.remove(window.rocksGroup);
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


function setAnimationState(state) {
    if (currentAnimState === state) return;
    currentAnimState = state;
}

function updateAnimations(delta) {
    animTime += delta;

    if (isJumping) {
        jumpProgress += delta * 1.8;
        if (jumpProgress < 0.15) {
            let prep = jumpProgress / 0.15;
            leftLegGroup.rotation.x = prep * 0.4;
            rightLegGroup.rotation.x = prep * 0.4;
            leftKneeGroup.rotation.x = -prep * 0.3;
            rightKneeGroup.rotation.x = -prep * 0.3;
            stemGroup.rotation.x = -prep * 0.3;
        } else if (jumpProgress < 0.75) {
            leftArmGroup.rotation.set(
                THREE.MathUtils.lerp(leftArmGroup.rotation.x, -0.8, 0.2),
                0,
                -0.6
            );
            leftForearmGroup.rotation.set(-0.4, 0, 0);

            rightArmGroup.rotation.set(
                THREE.MathUtils.lerp(rightArmGroup.rotation.x, -0.8, 0.2),
                0,
                0.6
            );
            rightForearmGroup.rotation.set(-0.4, 0, 0);

            leftLegGroup.rotation.x = THREE.MathUtils.lerp(leftLegGroup.rotation.x, -0.3, 0.2);
            rightLegGroup.rotation.x = THREE.MathUtils.lerp(rightLegGroup.rotation.x, -0.3, 0.2);
            leftKneeGroup.rotation.x = 0;
            rightKneeGroup.rotation.x = 0;
            stemGroup.rotation.x = THREE.MathUtils.lerp(stemGroup.rotation.x, 0.4, 0.15);
        } else {
            stemGroup.rotation.x *= 0.8;
        }
        return;
    }

    if (currentAnimState === 'IDLE') {
        const breathe = Math.sin(animTime * 3) * 0.02;
        torsoGroup.position.y = THREE.MathUtils.lerp(torsoGroup.position.y, 0.74 + breathe, 0.1);
        torsoGroup.rotation.x = THREE.MathUtils.lerp(torsoGroup.rotation.x, 0, 0.1);
        torsoGroup.rotation.z = THREE.MathUtils.lerp(torsoGroup.rotation.z, 0, 0.1);
        headGroup.rotation.x = THREE.MathUtils.lerp(headGroup.rotation.x, Math.sin(animTime * 1.5) * 0.04, 0.1);

        stemGroup.rotation.z = THREE.MathUtils.lerp(stemGroup.rotation.z, Math.sin(animTime * 2.5) * 0.08, 0.15);
        stemGroup.rotation.x = THREE.MathUtils.lerp(stemGroup.rotation.x, Math.cos(animTime * 2.0) * 0.05, 0.15);

        leftArmGroup.rotation.x = THREE.MathUtils.lerp(leftArmGroup.rotation.x, 0, 0.12);
        leftArmGroup.rotation.y = THREE.MathUtils.lerp(leftArmGroup.rotation.y, 0, 0.12);
        leftArmGroup.rotation.z = THREE.MathUtils.lerp(leftArmGroup.rotation.z, -0.4, 0.12);

        leftForearmGroup.rotation.x = THREE.MathUtils.lerp(leftForearmGroup.rotation.x, -0.15, 0.12);
        leftForearmGroup.rotation.y = THREE.MathUtils.lerp(leftForearmGroup.rotation.y, 0, 0.12);
        leftForearmGroup.rotation.z = THREE.MathUtils.lerp(leftForearmGroup.rotation.z, 0.1, 0.12);

        rightArmGroup.rotation.x = THREE.MathUtils.lerp(rightArmGroup.rotation.x, 0, 0.12);
        rightArmGroup.rotation.y = THREE.MathUtils.lerp(rightArmGroup.rotation.y, 0, 0.12);
        rightArmGroup.rotation.z = THREE.MathUtils.lerp(rightArmGroup.rotation.z, 0.4, 0.12);

        rightForearmGroup.rotation.x = THREE.MathUtils.lerp(rightForearmGroup.rotation.x, -0.15, 0.12);
        rightForearmGroup.rotation.y = THREE.MathUtils.lerp(rightForearmGroup.rotation.y, 0, 0.12);
        rightForearmGroup.rotation.z = THREE.MathUtils.lerp(rightForearmGroup.rotation.z, -0.1, 0.12);

        leftLegGroup.position.y = THREE.MathUtils.lerp(leftLegGroup.position.y, -0.32, 0.1);
        leftLegGroup.rotation.x = THREE.MathUtils.lerp(leftLegGroup.rotation.x, 0, 0.1);
        leftKneeGroup.rotation.x = THREE.MathUtils.lerp(leftKneeGroup.rotation.x, 0, 0.1);

        rightLegGroup.position.y = THREE.MathUtils.lerp(rightLegGroup.position.y, -0.32, 0.1);
        rightLegGroup.rotation.x = THREE.MathUtils.lerp(rightLegGroup.rotation.x, 0, 0.1);
        rightKneeGroup.rotation.x = THREE.MathUtils.lerp(rightKneeGroup.rotation.x, 0, 0.1);

    } else if (currentAnimState === 'RUN') {
        const runCycle = animTime * (player.isDashing ? 16 : 9);
        const amp = player.isDashing ? 0.65 : 0.4;
        
        torsoGroup.position.y = 0.74 + Math.abs(Math.sin(runCycle)) * 0.05;
        torsoGroup.rotation.x = player.isDashing ? 0.24 : 0.08;
        headGroup.rotation.x = 0;
        
        stemGroup.rotation.x = -0.4;
        
        leftLegGroup.rotation.x = Math.sin(runCycle) * amp;
        rightLegGroup.rotation.x = -Math.sin(runCycle) * amp;
        leftKneeGroup.rotation.x = Math.max(0, -Math.sin(runCycle) * amp);
        rightKneeGroup.rotation.x = Math.max(0, Math.sin(runCycle) * amp);
        
        leftArmGroup.rotation.x = -Math.sin(runCycle) * amp * 1.1;
        leftArmGroup.rotation.z = -0.4;
        rightArmGroup.rotation.x = Math.sin(runCycle) * amp * 1.1;
        rightArmGroup.rotation.z = 0.4;
    }
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

        if (!checkWallCollision(nextX, player.y, player.z, CONFIG.player.radius)) {
            player.x = nextX;
        }
        if (!checkWallCollision(player.x, player.y, nextZ, CONFIG.player.radius)) {
            player.z = nextZ;
        }
    }

    // Jump and Gravity Logic
    const floorY = getFloorY(player.x, player.z, player.y);

    if (keys.jump && player.y <= floorY + 0.02 && !isJumping) {
        player.vy = 5.0; // Jump strength
        isJumping = true;
        jumpProgress = 0;
        setAnimationState('JUMP');
    }

    player.vy -= 14.0 * delta; // Gravity
    player.y += player.vy * delta;

    if (player.y <= floorY) {
        player.y = floorY;
        if (player.vy < 0) {
            player.vy = 0;
            if (isJumping) {
                isJumping = false;
                // Optional landing sound here
            }
        }
    }

    // Determine animation state
    const isMoving = moveF !== 0;
    if (isJumping || player.y > floorY + 0.05) {
        // In air
    } else if (isMoving) {
        setAnimationState('RUN');
    } else {
        setAnimationState('IDLE');
    }

    if (playerMesh) {
        playerMesh.position.set(player.x, player.y, player.z);
        playerMesh.rotation.y = Math.PI / 2 - player.angle;

        // Custom Pikmin Animation Loop
        updateAnimations(delta);
    }

    updateCamera();
    updateFlashlight();


    if (sunLight) {
        sunLight.target.position.set(player.x, 0, player.z);
        sunLight.position.set(player.x + 20, 35, player.z + 10);
    }
}

function updateCamera() {

    const distBehind = 0.7; // 拉遠
    const camHeight = 1.4; // 拉高
    
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

const rockHeight = 0.8;

function getFloorY(x, z, currentY = 0) {
    const gridX = Math.floor(x);
    const gridZ = Math.floor(z);
    let maxY = 0.0;

    for (let r = gridZ - 1; r <= gridZ + 1; r++) {
        for (let c = gridX - 1; c <= gridX + 1; c++) {
            if (c >= 0 && c < cols && r >= 0 && r < rows) {
                if (mazeGrid[r][c] === 1) {
                    const isBoundary = (r === 0 || r === rows - 1 || c === 0 || c === cols - 1);
                    if (!isBoundary) {
                        const closestX = Math.max(c + 0.1, Math.min(x, c + 0.9));
                        const closestZ = Math.max(r + 0.1, Math.min(z, r + 0.9));
                        const dx = x - closestX;
                        const dz = z - closestZ;
                        const dist = Math.sqrt(dx * dx + dz * dz);
                        if (dist < 0.185 && currentY >= rockHeight - 0.2) {
                            maxY = Math.max(maxY, rockHeight);
                        }
                    }
                }
            }
        }
    }
    return maxY;
}

function checkWallCollision(x, y, z, radius) {
    const gridX = Math.floor(x);
    const gridZ = Math.floor(z);

    if (gridX < 0 || gridX >= cols || gridZ < 0 || gridZ >= rows) return true;

    for (let r = gridZ - 1; r <= gridZ + 1; r++) {
        for (let c = gridX - 1; c <= gridX + 1; c++) {
            if (r >= 0 && r < rows && c >= 0 && c < cols) {
                const cellType = mazeGrid[r][c];
                
                if (cellType === 1) {
                    const isBoundary = (r === 0 || r === rows - 1 || c === 0 || c === cols - 1);
                    if (isBoundary || y < rockHeight) {
                        const closestX = Math.max(c + 0.1, Math.min(x, c + 0.9));
                        const closestZ = Math.max(r + 0.1, Math.min(z, r + 0.9));

                        const dx = x - closestX;
                        const dz = z - closestZ;
                        const dist = Math.sqrt(dx * dx + dz * dz);
                        
                        if (dist < radius) return true;
                    }
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


        if (!checkWallCollision(targetX, 0, targetZ, radius)) {
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

        let nextX = a.x + a.vx * delta;
        let nextZ = a.z + a.vz * delta;
        const aY = 0; // Animals don't jump for now

        if (checkWallCollision(nextX, aY, a.z, cfg.radius)) {
            nextX = a.x;
            a.vx *= -1;
        }
        if (checkWallCollision(a.x, aY, nextZ, cfg.radius)) {
            nextZ = a.z;
            a.vz *= -1;
        }
        a.x = nextX;
        a.z = nextZ;

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
    
    const camDist = 1.0;
    const camX = player.x + Math.cos(player.angle) * camDist;
    const camZ = player.z + Math.sin(player.angle) * camDist;
    camera.position.set(camX, player.y + 0.35, camZ);
    camera.lookAt(player.x, player.y + 0.30, player.z);

    const pm = scene.getObjectByName("playerMesh");
    if (pm) pm.rotation.y = Math.PI / 2 - player.angle;
    
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
    startBGM();
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
    startBGM();
}

function gameOver() {
    gameState = 'GAMEOVER';
    
    const camDist = 1.0;
    const camX = player.x + Math.cos(player.angle) * camDist;
    const camZ = player.z + Math.sin(player.angle) * camDist;
    camera.position.set(camX, player.y + 0.35, camZ);
    camera.lookAt(player.x, player.y + 0.30, player.z);

    const pm = scene.getObjectByName("playerMesh");
    if (pm) pm.rotation.y = Math.PI / 2 - player.angle;
    
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
    startBGM();
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
            case 'KeyA':
                keys.jump = true;
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
            case 'KeyA':
                keys.jump = false;
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
        btnDash.addEventListener('mousedown', (e) => {
            keys.dash = true;
            e.preventDefault();
        });
        btnDash.addEventListener('mouseup', (e) => {
            keys.dash = false;
            e.preventDefault();
        });
    }

    const btnJump = document.getElementById('btnJump');
    if (btnJump) {
        btnJump.addEventListener('touchstart', (e) => {
            keys.jump = true;
            touchActive = true;
            e.preventDefault();
        });
        btnJump.addEventListener('touchend', (e) => {
            keys.jump = false;
            e.preventDefault();
        });
        btnJump.addEventListener('mousedown', (e) => {
            keys.jump = true;
            e.preventDefault();
        });
        btnJump.addEventListener('mouseup', (e) => {
            keys.jump = false;
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

    function toggleFullscreen() {
        const doc = document;
        const docEl = doc.documentElement;
        const requestFS = docEl.requestFullscreen || docEl.webkitRequestFullscreen || docEl.mozRequestFullScreen || docEl.msRequestFullscreen;
        const exitFS = doc.exitFullscreen || doc.webkitExitFullscreen || doc.mozCancelFullScreen || doc.msExitFullscreen;
        const isFS = doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement;

        if (!isFS) {
            if (requestFS) {
                requestFS.call(docEl).catch(() => {
                    showToast("提示：您的瀏覽器限制全螢幕模式 📱");
                });
            } else {
                showToast("提示：您的瀏覽器限制全螢幕模式 📱");
            }
        } else {
            if (exitFS) {
                exitFS.call(doc).catch(() => {});
            }
        }
    }

    const mobileFullscreenBtn = document.getElementById('mobileFullscreenBtn');
    if (mobileFullscreenBtn) {
        mobileFullscreenBtn.addEventListener('click', toggleFullscreen);
    }

    const fullscreenBtn = document.getElementById('fullscreenBtn');
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', toggleFullscreen);
    }

    const updateFSButtons = () => {
        const isFS = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
        if (mobileFullscreenBtn) {
            mobileFullscreenBtn.style.color = isFS ? '#34d399' : '#a855f7';
        }
        if (fullscreenBtn) {
            fullscreenBtn.textContent = isFS ? '⛶ 退出全螢幕' : '⛶ 全螢幕';
        }
    };

    document.addEventListener('fullscreenchange', updateFSButtons);
    document.addEventListener('webkitfullscreenchange', updateFSButtons);

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
    if (typeof setAppHeight === 'function') setAppHeight();
    const container = document.getElementById('viewport');
    if (!container || !renderer || !camera) return;

    let width = container.clientWidth || window.innerWidth || 800;
    let height = container.clientHeight || window.innerHeight || 500;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
});
window.addEventListener('orientationchange', () => {
    if (typeof setAppHeight === 'function') setAppHeight();
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