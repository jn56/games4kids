// --- Web Audio API 音效播放器 ---
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
        if (type === 'bounce') {
            // 骰子撞擊聲 (木頭/塑料撞擊)
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(120, time);
            osc.frequency.exponentialRampToValueAtTime(40, time + 0.12);
            
            gain.gain.setValueAtTime(0.4, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 0.12);
            
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(time);
            osc.stop(time + 0.13);
        } else if (type === 'roll') {
            // 拋出時的發射聲
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(80, time);
            osc.frequency.exponentialRampToValueAtTime(320, time + 0.2);
            
            gain.gain.setValueAtTime(0.2, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
            
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(time);
            osc.stop(time + 0.21);
        } else if (type === 'success') {
            // 落地定案時的和弦清脆鐘聲
            const gain = audioCtx.createGain();
            gain.gain.setValueAtTime(0.25, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.6);
            gain.connect(audioCtx.destination);

            const freqs = [523.25, 659.25, 783.99]; // C5, E5, G5 大和弦
            freqs.forEach((f, index) => {
                const osc = audioCtx.createOscillator();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(f, time + index * 0.04);
                
                osc.connect(gain);
                osc.start(time + index * 0.04);
                osc.stop(time + 0.6);
            });
        }
    } catch (e) {
        console.warn("音效播放失敗:", e);
    }
}

// --- Three.js 骰子模擬器主邏輯 ---
let scene, camera, renderer;
let diceMesh, trayFloor, trayBorder;
let clock;

// 物理狀態
let diceState = 'IDLE'; // IDLE, ROLLING, SETTLING
let px = 0, py = 0.6, pz = 0; // 骰子中心點坐標
let vx = 0, vy = 0, vz = 0;   // 線速度
let rx = 0, ry = 0, rz = 0;   // 角速度
let targetQuaternion = new THREE.Quaternion(); // 落地校正目標旋轉
let finalResult = 0; // 最終點數
let isRollingAllowed = true;

// 骰子貼圖快照快取，避免重複創建 Canvas
const canvasCache = {};

// 骰子外觀款式設定
const SKIN_CONFIGS = {
    classic: { bg: '#f8fafc', border: '#e2e8f0', dotRed: '#ef4444', dotBlack: '#334155', metallic: 0.1, roughness: 0.2 },
    amber: { bg: '#fbbf24', border: '#d97706', dotRed: '#7f1d1d', dotBlack: '#7f1d1d', metallic: 0.4, roughness: 0.1 },
    cyan: { bg: '#06b6d4', border: '#0891b2', dotRed: '#ffffff', dotBlack: '#083344', metallic: 0.5, roughness: 0.05 },
    ruby: { bg: '#ef4444', border: '#b91c1c', dotRed: '#ffffff', dotBlack: '#ffffff', metallic: 0.4, roughness: 0.15 },
    emerald: { bg: '#10b981', border: '#047857', dotRed: '#fbbf24', dotBlack: '#ffffff', metallic: 0.4, roughness: 0.15 },
    obsidian: { bg: '#1e293b', border: '#334155', dotRed: '#f97316', dotBlack: '#fbbf24', metallic: 0.8, roughness: 0.25 }
};
let currentSkinName = 'classic';

// 初始化 (使用安全檢查，防範 local 載入時 DOMContentLoaded 已觸發而漏失事件)
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    init3D();
    setupEvents();
    loadRollsCount();
    animate();
} else {
    document.addEventListener('DOMContentLoaded', () => {
        init3D();
        setupEvents();
        loadRollsCount();
        animate();
    });
}

// 初始化 3D 場景
function init3D() {
    const container = document.getElementById('viewport');
    let width = container.clientWidth || window.innerWidth || 600;
    let height = container.clientHeight || window.innerHeight || 400;

    scene = new THREE.Scene();
    scene.background = new THREE.Color('#0b071a');
    scene.fog = new THREE.FogExp2('#0b071a', 0.025);

    // 相機：放在斜上方高處，微微俯視盤面
    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 7.5, 7.5);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('canvas3d'), antialias: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    clock = new THREE.Clock();

    // 燈光設置
    const ambientLight = new THREE.AmbientLight('#ffffff', 0.45);
    scene.add(ambientLight);

    // 主定向光源 (陽光/聚光燈)，投影效果
    const dirLight = new THREE.DirectionalLight('#ffffff', 1.0);
    dirLight.position.set(4, 10, 4);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.bias = -0.001;
    scene.add(dirLight);

    // 額外的紫色氛圍輔助光，增加高級感
    const pointLight = new THREE.PointLight('#a855f7', 1.2, 15);
    pointLight.position.set(-4, 5, -4);
    scene.add(pointLight);

    // 建立托盤 (Roll Tray)
    buildTray();

    // 建立 3D 骰子
    buildDice();
}

// 建立木質天鵝絨圓形托盤
function buildTray() {
    const trayGroup = new THREE.Group();

    // 1. 托盤底部 (天鵝絨紅色圓底)
    const floorGeom = new THREE.CylinderGeometry(4.0, 4.0, 0.15, 64);
    const floorMat = new THREE.MeshStandardMaterial({
        color: '#6b1d2f', // 質感暗紅天鵝絨
        roughness: 0.85,
        metalness: 0.1
    });
    trayFloor = new THREE.Mesh(floorGeom, floorMat);
    trayFloor.position.y = -0.075;
    trayFloor.receiveShadow = true;
    trayGroup.add(trayFloor);

    // 2. 托盤邊框 (Mahogany 深棕紅木質圓環)
    const borderGeom = new THREE.TorusGeometry(4.05, 0.22, 16, 64);
    const borderMat = new THREE.MeshStandardMaterial({
        color: '#2a0d02', // 紅木色
        roughness: 0.18,
        metalness: 0.2
    });
    trayBorder = new THREE.Mesh(borderGeom, borderMat);
    trayBorder.rotation.x = Math.PI / 2;
    trayBorder.position.y = 0.05;
    trayBorder.castShadow = true;
    trayBorder.receiveShadow = true;
    trayGroup.add(trayBorder);

    scene.add(trayGroup);
}

// 繪製單個骰子面貼圖 (Canvas 2D 技術，加入立體高光、圓角投影)
function createFaceTexture(dotCount, skin) {
    const cacheKey = `${dotCount}_${currentSkinName}`;
    if (canvasCache[cacheKey]) return canvasCache[cacheKey];

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // 1. 背景與漸層 (模擬高質感微晶石/寶石反射)
    const grad = ctx.createRadialGradient(128, 128, 20, 128, 128, 180);
    grad.addColorStop(0, skin.bg);
    grad.addColorStop(1, skin.border);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    // 2. 四周微微內縮的亮色包邊線 (Chamfer 立體感)
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.lineWidth = 6;
    drawRoundedRect(ctx, 12, 12, 232, 232, 38);
    ctx.stroke();

    // 3. 繪製圓點 (Dots)
    const isOne = (dotCount === 1);
    ctx.fillStyle = isOne ? skin.dotRed : skin.dotBlack;
    
    // 給點數加上一點點內陰影，顯得更精緻
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = 2;

    const r = isOne ? 36 : 20; // 1 點特別大
    const dotPositions = getDotPositions(dotCount);
    
    dotPositions.forEach(([x, y]) => {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    });

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true; // 強制更新紋理，避免 WebGL 渲染一片黑
    canvasCache[cacheKey] = texture;
    return texture;
}

// 畫圓角矩形輔助函數
function drawRoundedRect(ctx, x, y, width, height, radius) {
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
}

// 返回 1~6 點圓點在 256x256 畫布中的中心座標
function getDotPositions(dotCount) {
    const c = 128; // 中心點
    const l = 64;  // 左/上偏置
    const r = 192; // 右/下偏置
    
    switch (dotCount) {
        case 1: return [[c, c]];
        case 2: return [[l, l], [r, r]];
        case 3: return [[l, l], [c, c], [r, r]];
        case 4: return [[l, l], [r, l], [l, r], [r, r]];
        case 5: return [[l, l], [r, l], [c, c], [l, r], [r, r]];
        case 6: return [[l, l], [r, l], [l, c], [r, c], [l, r], [r, r]];
        default: return [];
    }
}

// 建立或重新貼皮 3D 骰子
function buildDice() {
    const skin = SKIN_CONFIGS[currentSkinName];

    // 立方體材質：右(+X)、左(-X)、頂(+Y)、底(-Y)、前(+Z)、後(-Z)
    // 我們對應的點數為：右1, 左6, 頂2, 底5, 前3, 後4
    const faces = [1, 6, 2, 5, 3, 4];
    const materials = faces.map(dotNum => {
        const tex = createFaceTexture(dotNum, skin);
        return new THREE.MeshStandardMaterial({
            map: tex,
            roughness: skin.roughness,
            metalness: skin.metallic,
            bumpMap: tex,
            bumpScale: 0.005
        });
    });

    if (diceMesh) {
        // 如果已經存在，直接更換材質 (貼皮)
        diceMesh.material.forEach(m => m.dispose());
        diceMesh.material = materials;
    } else {
        // 如果不存在，首次創建
        const diceGeom = new THREE.BoxGeometry(1.2, 1.2, 1.2);
        diceMesh = new THREE.Mesh(diceGeom, materials);
        diceMesh.castShadow = true;
        diceMesh.receiveShadow = true;
        
        // 初始放置於盤面中心
        resetDicePosition();
        scene.add(diceMesh);
    }
}

function resetDicePosition() {
    px = 0;
    py = 0.6; // 骰子寬 1.2，中心高度 0.6
    pz = 0;
    diceMesh.position.set(px, py, pz);
    diceMesh.rotation.set(0, 0, 0); // 2點朝上
    diceState = 'IDLE';
}

// --- 物理更新與動畫迴圈 ---
function animate() {
    requestAnimationFrame(animate);

    const delta = Math.min(clock.getDelta(), 0.03); // 限制單幀最大時間防止穿牆

    if (diceState === 'ROLLING') {
        // 1. 應用重力與線運動
        vy -= 30.0 * delta; // 重力加速度
        px += vx * delta;
        py += vy * delta;
        pz += vz * delta;

        // 2. 應用旋轉運動
        diceMesh.rotation.x += rx * delta;
        diceMesh.rotation.y += ry * delta;
        diceMesh.rotation.z += rz * delta;

        // 3. 圓盤邊緣碰撞 (Mahogany 邊框半徑大約為 3.85)
        const dist2D = Math.sqrt(px*px + pz*pz);
        const maxRadius = 3.45; // 托盤內徑考慮骰子半徑
        if (dist2D > maxRadius) {
            // 計算邊框法向量
            const nx = px / dist2D;
            const nz = pz / dist2D;
            
            // 推回邊框內
            px = nx * maxRadius;
            pz = nz * maxRadius;

            // 彈射速度向量反射 (加入 0.65 恢復係數)
            const dot = vx * nx + vz * nz;
            vx = (vx - 2 * dot * nx) * 0.65;
            vz = (vz - 2 * dot * nz) * 0.65;

            // 微弱偏轉角速度
            rx += (Math.random() - 0.5) * 8;
            ry += (Math.random() - 0.5) * 8;
            rz += (Math.random() - 0.5) * 8;

            playSound('bounce');
        }

        // 4. 底部天鵝絨地板碰撞 (地面高度為 0)
        const floorY = 0.6; // 骰子中心半高
        if (py <= floorY) {
            py = floorY;
            
            if (vy < -2.0) {
                // 向下速度夠大，反彈
                vy = -vy * 0.45; // 反彈恢復係數 0.45
                
                // 地面摩擦力減速
                vx *= 0.72;
                vz *= 0.72;
                rx *= 0.68;
                ry *= 0.68;
                rz *= 0.68;

                playSound('bounce');
            } else {
                // 停止彈跳，進入平滑定案階段 (Settling)
                vy = 0;
                vx = 0;
                vz = 0;
                rx = 0;
                ry = 0;
                rz = 0;
                
                diceState = 'SETTLING';
                determineLandedFace();
            }
        }

        // 寫入 3D 坐標
        diceMesh.position.set(px, py, pz);

    } else if (diceState === 'SETTLING') {
        // 漸漸旋轉平滑過渡到目標對齊角度 (Slerp 內插法)
        diceMesh.quaternion.slerp(targetQuaternion, 0.16);

        // 當旋轉極度接近時，結束滾動，宣佈結果
        if (diceMesh.quaternion.angleTo(targetQuaternion) < 0.005) {
            diceMesh.quaternion.copy(targetQuaternion);
            diceState = 'IDLE';
            isRollingAllowed = true;
            
            playSound('success');
            showResultBanner();
            recordHistory();
        }
    }

    renderer.render(scene, camera);
}

// 判定哪一面朝上，並設定目標四元數 (Snap Align)
function determineLandedFace() {
    // 找出當前世界坐標中 Y 軸方向對應本地面法向量最大的那面
    // 我們對應的點數為：右1(+X), 左6(-X), 頂2(+Y), 底5(-Y), 前3(+Z), 後4(-Z)
    const localDirections = [
        { vec: new THREE.Vector3(1, 0, 0), dotVal: 1, euler: new THREE.Euler(0, 0, Math.PI / 2) },  // +X 朝上 ➔ 點數 1 (需 Z 軸旋轉 +90 度)
        { vec: new THREE.Vector3(-1, 0, 0), dotVal: 6, euler: new THREE.Euler(0, 0, -Math.PI / 2) }, // -X 朝上 ➔ 點數 6 (需 Z 軸旋轉 -90 度)
        { vec: new THREE.Vector3(0, 1, 0), dotVal: 2, euler: new THREE.Euler(0, 0, 0) },            // +Y 朝上 ➔ 點數 2 (不需旋轉)
        { vec: new THREE.Vector3(0, -1, 0), dotVal: 5, euler: new THREE.Euler(Math.PI, 0, 0) },       // -Y 朝上 ➔ 點數 5 (需翻轉 180 度)
        { vec: new THREE.Vector3(0, 0, 1), dotVal: 3, euler: new THREE.Euler(-Math.PI / 2, 0, 0) },   // +Z 朝上 ➔ 點數 3 (需 X 軸旋轉 -90 度)
        { vec: new THREE.Vector3(0, 0, -1), dotVal: 4, euler: new THREE.Euler(Math.PI / 2, 0, 0) }    // -Z 朝上 ➔ 點數 4 (需 X 軸旋轉 +90 度)
    ];

    let maxUpY = -Infinity;
    let bestFace = localDirections[2];

    localDirections.forEach(face => {
        // 將本地朝向轉成當前 3D 世界朝向
        const worldVec = face.vec.clone().applyQuaternion(diceMesh.quaternion);
        if (worldVec.y > maxUpY) {
            maxUpY = worldVec.y;
            bestFace = face;
        }
    });

    finalResult = bestFace.dotVal;

    // 將目標歐拉角轉為世界對齊的四元數
    // 保留當前 y 軸旋轉角，僅校正 x 與 z 軸 (平貼地面)，防止骰子旋轉乾癟
    const currentEuler = new THREE.Euler().setFromQuaternion(diceMesh.quaternion, 'YXZ');
    const targetEuler = new THREE.Euler(bestFace.euler.x, currentEuler.y, bestFace.euler.z, 'YXZ');
    targetQuaternion.setFromEuler(targetEuler);
}

// 拋擲骰子動作
function rollDice() {
    if (!isRollingAllowed || diceState !== 'IDLE') return;

    isRollingAllowed = false;
    document.getElementById('resultBanner').classList.remove('show');

    // 1. 初始化起點高度 (在空中高度拋出)
    px = (Math.random() - 0.5) * 1.5;
    py = 2.8 + Math.random() * 0.8;
    pz = (Math.random() - 0.5) * 1.5;
    diceMesh.position.set(px, py, pz);

    // 2. 給予隨機的強大初速度 (有拋起掉落感)
    vx = (Math.random() - 0.5) * 6;
    vy = 8.0 + Math.random() * 4.0; // 強烈向上的拋力
    vz = (Math.random() - 0.5) * 6;

    // 3. 給予瘋狂旋轉角速度
    rx = 18 + Math.random() * 15;
    ry = 18 + Math.random() * 15;
    rz = 18 + Math.random() * 15;

    playSound('roll');
    diceState = 'ROLLING';
}

// 顯示結果橫幅
function showResultBanner() {
    const banner = document.getElementById('resultBanner');
    const numSpan = document.getElementById('resultNum');
    const textSpan = document.getElementById('resultText');

    numSpan.textContent = finalResult;
    textSpan.textContent = `你擲出了 ${finalResult} 點！🎲`;

    banner.classList.add('show');
}

// 記錄投擲歷史
let rollsCount = 0;
function loadRollsCount() {
    rollsCount = parseInt(localStorage.getItem('rollsCount') || '0');
    updateRollsCountBadge();
}

function updateRollsCountBadge() {
    document.getElementById('rollsCountBadge').textContent = `累積投擲: ${rollsCount} 次`;
}

function recordHistory() {
    rollsCount++;
    localStorage.setItem('rollsCount', rollsCount);
    updateRollsCountBadge();

    const historyList = document.getElementById('historyList');
    const noHistoryTip = document.getElementById('noHistoryTip');
    if (noHistoryTip) {
        noHistoryTip.remove();
    }

    const item = document.createElement('div');
    item.className = 'history-item';
    
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

    item.innerHTML = `
        <span class="history-time">${timeStr}</span>
        <span style="font-weight:600;">拋出點數:</span>
        <span class="history-badge">${finalResult}</span>
    `;

    // 插入到頂端
    historyList.insertBefore(item, historyList.firstChild);

    // 限制顯示前 15 筆
    while (historyList.children.length > 15) {
        historyList.removeChild(historyList.lastChild);
    }
}

// 事件綁定
function setupEvents() {
    // 拋擲點擊
    document.getElementById('rollBtn').addEventListener('click', () => {
        rollDice();
    });

    // 點擊 3D 視角也可以拋擲
    document.getElementById('viewport').addEventListener('click', () => {
        rollDice();
    });

    // 鍵盤空白鍵 (Space)
    window.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            e.preventDefault(); // 防止網頁滾動
            rollDice();
        }
    });

    // 音效切換
    const soundBtn = document.getElementById('soundToggleBtn');
    soundBtn.addEventListener('click', () => {
        soundEnabled = !soundEnabled;
        soundBtn.textContent = soundEnabled ? '🔊 音效: 開' : '🔇 音效: 關';
    });

    // 款式更換
    const skinButtons = document.querySelectorAll('.skin-btn');
    skinButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            skinButtons.forEach(b => b.classList.remove('active'));
            const targetBtn = e.currentTarget;
            targetBtn.classList.add('active');
            
            currentSkinName = targetBtn.dataset.skin;
            buildDice(); // 重新貼皮
            playSound('bounce');
        });
    });
}

// 監聽視窗縮放
function onWindowResize() {
    const container = document.getElementById('viewport');
    let width = container.clientWidth || window.innerWidth || 600;
    let height = container.clientHeight || window.innerHeight || 400;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}
window.addEventListener('resize', onWindowResize);
