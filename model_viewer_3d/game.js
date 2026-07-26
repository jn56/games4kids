let scene, camera, renderer;
let characterGroup, headGroup, torsoGroup, stemGroup, flowerGroup;
let leftArmGroup, rightArmGroup, leftForearmGroup, rightForearmGroup;
let leftLegGroup, rightLegGroup, leftKneeGroup, rightKneeGroup;
let eyeLeft, eyeRight, shadowMesh, stagePedestal;
let particlesGroup = [];

let currentAnimState = 'IDLE';
let animTime = 0;
let jumpProgress = 0;
let isJumping = false;

let targetRotationY = 0;
let currentRotationY = 0;
let isDragging = false;
let previousMouseX = 0;

let soundEnabled = true;
let audioCtx = null;

function initAudio() {
    if (!audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
            audioCtx = new AudioContext();
        }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

function playSound(type) {
    if (!soundEnabled || !audioCtx) return;
    try {
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);

        if (type === 'jump') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(200, now);
            osc.frequency.exponentialRampToValueAtTime(650, now + 0.28);
            gain.gain.setValueAtTime(0.22, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);
            osc.start(now);
            osc.stop(now + 0.28);
        } else if (type === 'land') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(140, now);
            osc.frequency.exponentialRampToValueAtTime(50, now + 0.15);
            gain.gain.setValueAtTime(0.28, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
            osc.start(now);
            osc.stop(now + 0.15);
        } else if (type === 'crouch') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(360, now);
            osc.frequency.exponentialRampToValueAtTime(200, now + 0.2);
            gain.gain.setValueAtTime(0.18, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
            osc.start(now);
            osc.stop(now + 0.2);
        } else if (type === 'runStep') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(220, now);
            osc.frequency.exponentialRampToValueAtTime(90, now + 0.07);
            gain.gain.setValueAtTime(0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.07);
            osc.start(now);
            osc.stop(now + 0.07);
        } else if (type === 'rotate') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(240, now);
            osc.frequency.exponentialRampToValueAtTime(320, now + 0.06);
            gain.gain.setValueAtTime(0.05, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);
            osc.start(now);
            osc.stop(now + 0.06);
        }
    } catch(e) {}
}

function initScene() {
    const container = document.getElementById('viewport');
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x080f1e);
    scene.fog = new THREE.FogExp2(0x080f1e, 0.035);

    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 1.6, 4.8);
    camera.lookAt(0, 1.0, 0);

    renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('canvas3d'), antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfffbeb, 0.95);
    dirLight.position.set(4, 9, 5);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.bias = -0.001;
    scene.add(dirLight);

    const bluePoint = new THREE.PointLight(0x3b82f6, 1.4, 10);
    bluePoint.position.set(-3, 3, 2);
    scene.add(bluePoint);

    const greenPoint = new THREE.PointLight(0x22c55e, 1.0, 8);
    greenPoint.position.set(3, 2, -2);
    scene.add(greenPoint);

    buildStage();
    characterGroup = createPikminMesh();
    scene.add(characterGroup);

    setupInputEvents();
    setupUIControls();
    animate();
}

function buildStage() {
    const stageGroup = new THREE.Group();

    const baseGeom = new THREE.CylinderGeometry(2.4, 2.6, 0.3, 32);
    const baseMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        roughness: 0.5,
        metalness: 0.2
    });
    const base = new THREE.Mesh(baseGeom, baseMat);
    base.position.y = -0.15;
    base.receiveShadow = true;
    stageGroup.add(base);

    const ringGeom = new THREE.TorusGeometry(2.42, 0.04, 16, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x2563eb });
    const ring = new THREE.Mesh(ringGeom, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.01;
    stageGroup.add(ring);

    const grid = new THREE.GridHelper(4.8, 16, 0x3b82f6, 0x1e293b);
    grid.position.y = 0.02;
    stageGroup.add(grid);

    const shadowGeom = new THREE.PlaneGeometry(1.2, 1.2);
    const shadowMat = new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.5,
        depthWrite: false
    });
    shadowMesh = new THREE.Mesh(shadowGeom, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = 0.03;
    stageGroup.add(shadowMesh);

    for (let i = 0; i < 30; i++) {
        const pGeom = new THREE.SphereGeometry(0.015 + Math.random() * 0.02, 6, 6);
        const pMat = new THREE.MeshBasicMaterial({
            color: Math.random() > 0.4 ? 0x60a5fa : (Math.random() > 0.5 ? 0x4ade80 : 0xfef08a),
            transparent: true,
            opacity: 0.3 + Math.random() * 0.5
        });
        const p = new THREE.Mesh(pGeom, pMat);
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 2.2;
        p.position.set(Math.cos(angle) * radius, Math.random() * 2.8, Math.sin(angle) * radius);
        p.userData = {
            speedY: 0.003 + Math.random() * 0.005,
            initialY: p.position.y
        };
        stageGroup.add(p);
        particlesGroup.push(p);
    }

    scene.add(stageGroup);
}

function createPikminMesh() {
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

    return root;
}

function setAnimationState(state) {
    if (state === 'JUMP') {
        if (!isJumping) {
            isJumping = true;
            jumpProgress = 0;
            playSound('jump');
        }
    } else {
        if (currentAnimState !== state) {
            if (state === 'CROUCH') playSound('crouch');
            currentAnimState = state;
        }
    }
    updateUIBadge();
}

function updateUIBadge() {
    const badgeIcon = document.getElementById('statusIcon');
    const badgeText = document.getElementById('statusText');
    const buttons = {
        'IDLE': document.getElementById('btnIdle'),
        'FOLD_ARMS': document.getElementById('btnFoldArms'),
        'JUMP': document.getElementById('btnJump'),
        'CROUCH': document.getElementById('btnCrouch'),
        'RUN': document.getElementById('btnRun')
    };

    Object.values(buttons).forEach(btn => {
        if (btn) btn.classList.remove('active');
    });

    let displayState = isJumping ? 'JUMP' : currentAnimState;
    if (buttons[displayState]) buttons[displayState].classList.add('active');

    if (displayState === 'IDLE') {
        if (badgeIcon) badgeIcon.textContent = '🌸';
        if (badgeText) badgeText.textContent = '當前動作：藍色皮克敏 站立 (Idle)';
    } else if (displayState === 'FOLD_ARMS') {
        if (badgeIcon) badgeIcon.textContent = '🙅';
        if (badgeText) badgeText.textContent = '當前動作：藍色皮克敏 抱胸 (Fold Arms)';
    } else if (displayState === 'JUMP') {
        if (badgeIcon) badgeIcon.textContent = '🦘';
        if (badgeText) badgeText.textContent = '當前動作：藍色皮克敏 跳躍中 (Jump)';
    } else if (displayState === 'CROUCH') {
        if (badgeIcon) badgeIcon.textContent = '🧘';
        if (badgeText) badgeText.textContent = '當前動作：藍色皮克敏 蹲下 (Crouch)';
    } else if (displayState === 'RUN') {
        if (badgeIcon) badgeIcon.textContent = '🏃';
        if (badgeText) badgeText.textContent = '當前動作：藍色皮克敏 奔跑中 (Run)';
    }
}

function updateAnimations(delta) {
    animTime += delta;

    currentRotationY = THREE.MathUtils.lerp(currentRotationY, targetRotationY, 0.12);
    characterGroup.rotation.y = currentRotationY;

    particlesGroup.forEach(p => {
        p.position.y += p.userData.speedY;
        if (p.position.y > 3.0) {
            p.position.y = 0.05;
        }
    });

    if (Math.random() < 0.012) {
        eyeLeft.scale.y = 0.1;
        eyeRight.scale.y = 0.1;
        setTimeout(() => {
            if (eyeLeft && eyeRight) {
                eyeLeft.scale.y = 1;
                eyeRight.scale.y = 1;
            }
        }, 110);
    }

    if (isJumping) {
        jumpProgress += delta * 1.8;
        if (jumpProgress >= 1.0) {
            jumpProgress = 0;
            isJumping = false;
            playSound('land');
            updateUIBadge();
        } else {
            let jumpY = 0;
            if (jumpProgress < 0.15) {
                let prep = jumpProgress / 0.15;
                jumpY = -prep * 0.10;
                characterGroup.position.y = jumpY;
                leftLegGroup.rotation.x = prep * 0.4;
                rightLegGroup.rotation.x = prep * 0.4;
                leftKneeGroup.rotation.x = -prep * 0.3;
                rightKneeGroup.rotation.x = -prep * 0.3;
                stemGroup.rotation.x = -prep * 0.3;
            } else if (jumpProgress < 0.75) {
                let norm = (jumpProgress - 0.15) / 0.60;
                jumpY = Math.sin(norm * Math.PI) * 1.35;
                characterGroup.position.y = jumpY;
                
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
                shadowMesh.scale.setScalar(1 - norm * 0.4);
                shadowMesh.material.opacity = 0.5 - norm * 0.25;
            } else {
                let land = (jumpProgress - 0.75) / 0.25;
                jumpY = -Math.sin(land * Math.PI) * 0.12;
                characterGroup.position.y = jumpY;
                stemGroup.rotation.x *= 0.8;
                shadowMesh.scale.setScalar(1);
                shadowMesh.material.opacity = 0.5;
            }
            return;
        }
    } else {
        characterGroup.position.y = 0;
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

        shadowMesh.scale.setScalar(1.0);
        shadowMesh.material.opacity = 0.5;

    } else if (currentAnimState === 'FOLD_ARMS') {
        const breathe = Math.sin(animTime * 3) * 0.02;
        torsoGroup.position.y = THREE.MathUtils.lerp(torsoGroup.position.y, 0.74 + breathe, 0.1);
        torsoGroup.rotation.x = THREE.MathUtils.lerp(torsoGroup.rotation.x, 0, 0.1);
        torsoGroup.rotation.z = THREE.MathUtils.lerp(torsoGroup.rotation.z, 0, 0.1);
        headGroup.rotation.x = THREE.MathUtils.lerp(headGroup.rotation.x, Math.sin(animTime * 1.5) * 0.04, 0.1);

        stemGroup.rotation.z = THREE.MathUtils.lerp(stemGroup.rotation.z, Math.sin(animTime * 2.5) * 0.08, 0.15);
        stemGroup.rotation.x = THREE.MathUtils.lerp(stemGroup.rotation.x, Math.cos(animTime * 2.0) * 0.05, 0.15);

        leftArmGroup.rotation.x = THREE.MathUtils.lerp(leftArmGroup.rotation.x, -0.6, 0.12);
        leftArmGroup.rotation.y = THREE.MathUtils.lerp(leftArmGroup.rotation.y, 0, 0.12);
        leftArmGroup.rotation.z = THREE.MathUtils.lerp(leftArmGroup.rotation.z, -0.3, 0.12);

        leftForearmGroup.rotation.x = THREE.MathUtils.lerp(leftForearmGroup.rotation.x, -0.7, 0.12);
        leftForearmGroup.rotation.y = THREE.MathUtils.lerp(leftForearmGroup.rotation.y, 0, 0.12);
        leftForearmGroup.rotation.z = THREE.MathUtils.lerp(leftForearmGroup.rotation.z, 1.4, 0.12);

        rightArmGroup.rotation.x = THREE.MathUtils.lerp(rightArmGroup.rotation.x, -0.8, 0.12);
        rightArmGroup.rotation.y = THREE.MathUtils.lerp(rightArmGroup.rotation.y, 0, 0.12);
        rightArmGroup.rotation.z = THREE.MathUtils.lerp(rightArmGroup.rotation.z, 0.3, 0.12);

        rightForearmGroup.rotation.x = THREE.MathUtils.lerp(rightForearmGroup.rotation.x, -0.6, 0.12);
        rightForearmGroup.rotation.y = THREE.MathUtils.lerp(rightForearmGroup.rotation.y, 0, 0.12);
        rightForearmGroup.rotation.z = THREE.MathUtils.lerp(rightForearmGroup.rotation.z, -1.3, 0.12);

        leftLegGroup.position.y = THREE.MathUtils.lerp(leftLegGroup.position.y, -0.32, 0.1);
        leftLegGroup.rotation.x = THREE.MathUtils.lerp(leftLegGroup.rotation.x, 0, 0.1);
        leftKneeGroup.rotation.x = THREE.MathUtils.lerp(leftKneeGroup.rotation.x, 0, 0.1);

        rightLegGroup.position.y = THREE.MathUtils.lerp(rightLegGroup.position.y, -0.32, 0.1);
        rightLegGroup.rotation.x = THREE.MathUtils.lerp(rightLegGroup.rotation.x, 0, 0.1);
        rightKneeGroup.rotation.x = THREE.MathUtils.lerp(rightKneeGroup.rotation.x, 0, 0.1);

        shadowMesh.scale.setScalar(1.0);
        shadowMesh.material.opacity = 0.5;

    } else if (currentAnimState === 'CROUCH') {
        torsoGroup.position.y = THREE.MathUtils.lerp(torsoGroup.position.y, 0.67, 0.15);
        torsoGroup.rotation.x = THREE.MathUtils.lerp(torsoGroup.rotation.x, 0.2, 0.15);
        headGroup.rotation.x = THREE.MathUtils.lerp(headGroup.rotation.x, -0.1, 0.15);

        stemGroup.rotation.x = THREE.MathUtils.lerp(stemGroup.rotation.x, 0.3, 0.15);

        leftArmGroup.rotation.x = THREE.MathUtils.lerp(leftArmGroup.rotation.x, -0.5, 0.15);
        leftArmGroup.rotation.y = THREE.MathUtils.lerp(leftArmGroup.rotation.y, 0, 0.15);
        leftArmGroup.rotation.z = THREE.MathUtils.lerp(leftArmGroup.rotation.z, -0.35, 0.15);
        leftForearmGroup.rotation.set(-0.2, 0, 0);

        rightArmGroup.rotation.x = THREE.MathUtils.lerp(rightArmGroup.rotation.x, -0.5, 0.15);
        rightArmGroup.rotation.y = THREE.MathUtils.lerp(rightArmGroup.rotation.y, 0, 0.15);
        rightArmGroup.rotation.z = THREE.MathUtils.lerp(rightArmGroup.rotation.z, 0.35, 0.15);
        rightForearmGroup.rotation.set(-0.2, 0, 0);

        leftLegGroup.position.y = THREE.MathUtils.lerp(leftLegGroup.position.y, -0.32, 0.15);
        leftLegGroup.rotation.x = THREE.MathUtils.lerp(leftLegGroup.rotation.x, -1.2, 0.15);
        leftKneeGroup.rotation.x = THREE.MathUtils.lerp(leftKneeGroup.rotation.x, 1.4, 0.15);

        rightLegGroup.position.y = THREE.MathUtils.lerp(rightLegGroup.position.y, -0.32, 0.15);
        rightLegGroup.rotation.x = THREE.MathUtils.lerp(rightLegGroup.rotation.x, -1.2, 0.15);
        rightKneeGroup.rotation.x = THREE.MathUtils.lerp(rightKneeGroup.rotation.x, 1.4, 0.15);

        shadowMesh.scale.setScalar(1.3);
        shadowMesh.material.opacity = 0.65;

    } else if (currentAnimState === 'RUN') {
        const runCycle = Math.sin(animTime * 14);
        const bounce = Math.abs(runCycle) * 0.08;
        
        torsoGroup.position.y = THREE.MathUtils.lerp(torsoGroup.position.y, 0.74 + bounce, 0.2);
        torsoGroup.rotation.x = THREE.MathUtils.lerp(torsoGroup.rotation.x, 0.32, 0.2);
        torsoGroup.rotation.z = Math.sin(animTime * 14) * 0.06;
        headGroup.rotation.x = THREE.MathUtils.lerp(headGroup.rotation.x, -0.15, 0.2);

        stemGroup.rotation.z = THREE.MathUtils.lerp(stemGroup.rotation.z, -runCycle * 0.25, 0.15);
        stemGroup.rotation.x = THREE.MathUtils.lerp(stemGroup.rotation.x, -0.6, 0.15);

        leftArmGroup.rotation.x = -0.35 + runCycle * 0.7;
        leftArmGroup.rotation.y = 0;
        leftArmGroup.rotation.z = -0.3;
        leftForearmGroup.rotation.set(-0.7 + runCycle * 0.3, 0, 0);

        rightArmGroup.rotation.x = -0.35 - runCycle * 0.7;
        rightArmGroup.rotation.y = 0;
        rightArmGroup.rotation.z = 0.3;
        rightForearmGroup.rotation.set(-0.7 - runCycle * 0.3, 0, 0);

        leftLegGroup.position.y = -0.32;
        leftLegGroup.rotation.x = -runCycle * 0.9;
        leftKneeGroup.rotation.x = Math.max(0, runCycle * 0.6);

        rightLegGroup.position.y = -0.32;
        rightLegGroup.rotation.x = runCycle * 0.9;
        rightKneeGroup.rotation.x = Math.max(0, -runCycle * 0.6);

        if (Math.abs(runCycle) > 0.92) {
            playSound('runStep');
        }

        shadowMesh.scale.setScalar(0.9 + Math.abs(runCycle) * 0.2);
        shadowMesh.material.opacity = 0.45;
    }
}

function setupInputEvents() {
    const viewport = document.getElementById('viewport');

    window.addEventListener('keydown', (e) => {
        initAudio();
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
            targetRotationY += 0.25;
            playSound('rotate');
        } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
            targetRotationY -= 0.25;
            playSound('rotate');
        } else if (e.key === ' ') {
            setAnimationState('JUMP');
            e.preventDefault();
        }
    });

    viewport.addEventListener('mousedown', (e) => {
        initAudio();
        isDragging = true;
        previousMouseX = e.clientX;
    });

    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const deltaX = e.clientX - previousMouseX;
        previousMouseX = e.clientX;
        targetRotationY += deltaX * 0.01;
    });

    window.addEventListener('mouseup', () => {
        isDragging = false;
    });

    viewport.addEventListener('touchstart', (e) => {
        initAudio();
        if (e.touches.length === 1) {
            isDragging = true;
            previousMouseX = e.touches[0].clientX;
        }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
        if (!isDragging || e.touches.length === 0) return;
        const deltaX = e.touches[0].clientX - previousMouseX;
        previousMouseX = e.touches[0].clientX;
        targetRotationY += deltaX * 0.012;
    }, { passive: true });

    window.addEventListener('touchend', () => {
        isDragging = false;
    });
}

function setupUIControls() {
    const btnIdle = document.getElementById('btnIdle');
    const btnFoldArms = document.getElementById('btnFoldArms');
    const btnJump = document.getElementById('btnJump');
    const btnCrouch = document.getElementById('btnCrouch');
    const btnRun = document.getElementById('btnRun');

    if (btnIdle) {
        btnIdle.addEventListener('click', () => {
            initAudio();
            setAnimationState('IDLE');
        });
    }

    if (btnFoldArms) {
        btnFoldArms.addEventListener('click', () => {
            initAudio();
            setAnimationState('FOLD_ARMS');
        });
    }

    if (btnJump) {
        btnJump.addEventListener('click', () => {
            initAudio();
            setAnimationState('JUMP');
        });
    }

    if (btnCrouch) {
        btnCrouch.addEventListener('click', () => {
            initAudio();
            setAnimationState('CROUCH');
        });
    }

    if (btnRun) {
        btnRun.addEventListener('click', () => {
            initAudio();
            setAnimationState('RUN');
        });
    }

    const btnRotateLeft = document.getElementById('btnRotateLeft');
    if (btnRotateLeft) {
        btnRotateLeft.addEventListener('click', () => {
            initAudio();
            targetRotationY += 0.45;
            playSound('rotate');
        });
    }

    const btnRotateRight = document.getElementById('btnRotateRight');
    if (btnRotateRight) {
        btnRotateRight.addEventListener('click', () => {
            initAudio();
            targetRotationY -= 0.45;
            playSound('rotate');
        });
    }

    function toggleFullscreen() {
        initAudio();
        const doc = document;
        const docEl = doc.documentElement;
        const requestFS = docEl.requestFullscreen || docEl.webkitRequestFullscreen || docEl.mozRequestFullScreen || docEl.msRequestFullscreen;
        const exitFS = doc.exitFullscreen || doc.webkitExitFullscreen || doc.mozCancelFullScreen || doc.msExitFullscreen;
        const isFS = doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement;

        if (!isFS) {
            if (requestFS) requestFS.call(docEl).catch(() => {});
        } else {
            if (exitFS) exitFS.call(doc).catch(() => {});
        }
    }

    const mobileFullscreenBtn = document.getElementById('mobileFullscreenBtn');
    if (mobileFullscreenBtn) mobileFullscreenBtn.addEventListener('click', toggleFullscreen);

    const fullscreenBtn = document.getElementById('fullscreenBtn');
    if (fullscreenBtn) fullscreenBtn.addEventListener('click', toggleFullscreen);

    function toggleMute() {
        initAudio();
        soundEnabled = !soundEnabled;
        const muteBtn = document.getElementById('muteBtn');
        const mobileMuteBtn = document.getElementById('mobileMuteBtn');
        if (muteBtn) muteBtn.textContent = soundEnabled ? '🔊 音效: 開' : '🔇 音效: 關';
        if (mobileMuteBtn) mobileMuteBtn.textContent = soundEnabled ? '🔊' : '🔇';
    }

    const muteBtn = document.getElementById('muteBtn');
    if (muteBtn) muteBtn.addEventListener('click', toggleMute);

    const mobileMuteBtn = document.getElementById('mobileMuteBtn');
    if (mobileMuteBtn) mobileMuteBtn.addEventListener('click', toggleMute);
}

const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();

    updateAnimations(delta);
    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    if (typeof setAppHeight === 'function') setAppHeight();
    const container = document.getElementById('viewport');
    if (!container || !renderer || !camera) return;

    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || window.innerHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
});

window.addEventListener('orientationchange', () => {
    if (typeof setAppHeight === 'function') setAppHeight();
});

window.addEventListener('DOMContentLoaded', () => {
    initScene();
});