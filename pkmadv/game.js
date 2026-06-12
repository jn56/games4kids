/**
 * 草原走道大冒險！ - 2D 平面簡單版
 */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 遊戲參數設定
const LANE_COUNT = 3;
const LANE_HEIGHT = canvas.height / LANE_COUNT;
const PLAYER_X = 100; // 主角固定在畫面左側
const EMOJI_SIZE = 45; // 尺寸大約 40px - 50px
let currentSpeed = 3.5; // 物品向左移動速度 (動態調整)

let score = 0;
let highScore = localStorage.getItem('pkmadv_highScore') || 0;
let gameState = 'PLAYING'; // 狀態：'PLAYING', 'GAMEOVER'
let items = [];
let lastSpawnTime = 0;
let nextSpawnDelay = 1000;

let player = {
  lane: 1, // 0: 上, 1: 中, 2: 下
  emoji: '👧'
};

let scoreFeedback = {
  active: false,
  timer: 0,
  color: '#333',
  scale: 1
};

// 物品屬性 (加入權重，增加大便和樹的數量)
const ITEM_TYPES = [
  { type: 'flower', emoji: '🌸', score: 1, isObstacle: false, weight: 20 },
  { type: 'poop', emoji: '💩', score: -1, isObstacle: false, weight: 60 },
  { type: 'tree', emoji: '🌳', score: 0, isObstacle: true, weight: 60 },
  { type: 'box', emoji: '📦', score: 0, isObstacle: true, weight: 30 }
];

function getRandomItem() {
  let totalWeight = ITEM_TYPES.reduce((sum, item) => sum + item.weight, 0);
  let r = Math.random() * totalWeight;
  for (let item of ITEM_TYPES) {
    if (r < item.weight) return item;
    r -= item.weight;
  }
  return ITEM_TYPES[0];
}

// 天空的白雲 (靜態或緩慢移動)
const clouds = [
  { x: 150, y: 50 },
  { x: 450, y: 90 },
  { x: 700, y: 40 }
];

// 背景草叢
const bushes = [];
for (let i = 0; i < 15; i++) {
  bushes.push({
    x: Math.random() * 800, // 初始隨機分佈在畫面上
    y: Math.random() * 450,
    emoji: ['🌿', '🌱', '🌾'][Math.floor(Math.random() * 3)]
  });
}

// --- 音樂系統 ---
let audioCtx = null;
let nextNoteTime = 0;
let currentNote = 0;

function initAudio() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContext();
    nextNoteTime = audioCtx.currentTime + 0.1;
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function playNote(time, freq, type = 'square', duration = 0.1, vol = 0.04) {
  if (!audioCtx) return;
  let osc = audioCtx.createOscillator();
  let gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, time);
  osc.connect(gain);
  gain.connect(audioCtx.destination);

  gain.gain.setValueAtTime(vol, time); // 音量
  gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

  osc.start(time);
  osc.stop(time + duration);
}

function playFlowerSound() {
  if (!audioCtx) return;
  playNote(audioCtx.currentTime, 880, 'sine', 0.1);
  playNote(audioCtx.currentTime + 0.1, 1318.51, 'sine', 0.15); // 叮咚
}

function playPoopSound() {
  if (!audioCtx) return;
  playNote(audioCtx.currentTime, 300, 'sawtooth', 0.1);
  playNote(audioCtx.currentTime + 0.1, 200, 'sawtooth', 0.2); // 噗
}

function playGameOverSound() {
  if (!audioCtx) return;
  playNote(audioCtx.currentTime, 400, 'square', 0.2);
  playNote(audioCtx.currentTime + 0.2, 300, 'square', 0.2);
  playNote(audioCtx.currentTime + 0.4, 200, 'square', 0.4); // 登登登
}

function playWinSound() {
  if (!audioCtx) return;
  const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
  notes.forEach((freq, idx) => {
    playNote(audioCtx.currentTime + idx * 0.15, freq, 'square', 0.15, 0.05);
  });
}

function runAudio() {
  if (!audioCtx || gameState !== 'PLAYING') return;
  // 分數越高，BPM 越快
  let bpm = 120 + Math.max(0, score) * 3;
  let beatDuration = 60 / bpm / 2; // 八分音符

  while (nextNoteTime < audioCtx.currentTime + 0.1) {
    const melody = [523.25, 659.25, 783.99, 1046.50, 783.99, 659.25, 587.33, 659.25];
    let freq = melody[currentNote % melody.length];

    // 伴奏 (低音)
    if (currentNote % 4 === 0) {
      playNote(nextNoteTime, 261.63, 'sawtooth', 0.15, 0.02); // 稍微調大一點背景音樂
    }

    // 主旋律
    if (currentNote % 8 !== 7) { // 稍微切分音
      playNote(nextNoteTime, freq, 'square', 0.1, 0.02); // 稍微調大一點背景音樂
    }

    nextNoteTime += beatDuration;
    currentNote++;
  }
}

// 鍵盤監聽
window.addEventListener('keydown', (e) => {
  initAudio();
  if (gameState === 'PLAYING') {
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
      if (player.lane > 0) player.lane--;
    } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
      if (player.lane < LANE_COUNT - 1) player.lane++;
    }
  } else if (gameState === 'GAMEOVER' || gameState === 'WIN') {
    if (e.key === ' ' || e.key === 'Spacebar') {
      resetGame();
    }
  }
});

// 觸控監聽
canvas.addEventListener('touchstart', (e) => {
  e.preventDefault(); // 避免網頁捲動
  initAudio();
  if (gameState === 'PLAYING') {
    let rect = canvas.getBoundingClientRect();
    let touchY = e.touches[0].clientY - rect.top;
    if (touchY < canvas.height / 2) {
      if (player.lane > 0) player.lane--;
    } else {
      if (player.lane < LANE_COUNT - 1) player.lane++;
    }
  } else if (gameState === 'GAMEOVER' || gameState === 'WIN') {
    resetGame();
  }
}, { passive: false });

// 重置遊戲
function resetGame() {
  score = 0;
  items = [];
  player.lane = 1;
  gameState = 'PLAYING';
  lastSpawnTime = performance.now();
  nextSpawnDelay = 480 + Math.random() * 360; // 初始延隔縮小

  // 啟動迴圈
  requestAnimationFrame(gameLoop);
}

// 生成物品
function spawnItem(now) {
  if (now - lastSpawnTime > nextSpawnDelay) {
    let lane = Math.floor(Math.random() * LANE_COUNT);
    let itemInfo = getRandomItem();

    // 防呆機制 1: 避免重疊
    // 新生成的物品 X 必須與前一個物品保持一定安全距離
    let canSpawn = true;
    for (let item of items) {
      if (item.x > canvas.width - 80) { // 如果有物品還在生成點附近，則延後生成
        canSpawn = false;
        break;
      }
    }

    if (!canSpawn) return;

    // 防呆機制 2: 保底路徑
    // 確保同一垂直線上不會三條走道都有障礙物
    if (itemInfo.isObstacle) {
      let recentObstacleLanes = items
        .filter(item => item.isObstacle && item.x > canvas.width - 200)
        .map(item => item.lane);

      let blockedLanes = new Set(recentObstacleLanes);
      blockedLanes.add(lane);

      // 如果這三個都被障礙物佔據，強制替換為花朵
      if (blockedLanes.size === LANE_COUNT) {
        itemInfo = ITEM_TYPES[0]; // 換成 🌸
      }
    }

    items.push({
      x: canvas.width + 50,
      lane: lane,
      ...itemInfo
    });

    lastSpawnTime = now;

    // 動態縮短生成時間 (縮短延隔使總產量增加，但花朵比例下降，維持花朵絕對數量不變)
    let level = Math.floor(Math.max(0, score) / 3);
    let minDelay = Math.max(200, 480 - level * 18); // 最小間隔隨等級下降
    let maxDelay = Math.max(350, 840 - level * 27); // 最大間隔隨等級下降
    nextSpawnDelay = minDelay + Math.random() * (maxDelay - minDelay);
  }
}

// 物理與邏輯更新
function update(now) {
  if (gameState !== 'PLAYING') return;

  runAudio(); // 播放音樂

  // 動態更新速度 (每 3 分微微增加一點速度)
  currentSpeed = 3.5 + Math.floor(Math.max(0, score) / 3) * 0.25;

  // 背景雲朵移動
  clouds.forEach(cloud => {
    cloud.x -= currentSpeed * 0.2;
    if (cloud.x < -100) {
      cloud.x = 800 + 100;
      cloud.y = 30 + Math.random() * 60;
    }
  });

  // 草叢移動
  bushes.forEach(bush => {
    bush.x -= currentSpeed * 0.6;
    if (bush.x < -50) {
      bush.x = 800 + 50;
      bush.y = Math.random() * 450;
    }
  });

  spawnItem(now);

  for (let i = items.length - 1; i >= 0; i--) {
    let item = items[i];
    item.x -= currentSpeed;

    // 碰撞偵測 (Emoji 圖形範圍，以同一走道且 X 距離夠近來判斷)
    if (item.lane === player.lane) {
      let distanceX = Math.abs(item.x - PLAYER_X);
      let hitDistance = item.isObstacle ? EMOJI_SIZE * 0.9 : EMOJI_SIZE * 0.75;
      if (distanceX < hitDistance) { // 碰撞容差
        if (item.isObstacle) {
          // 撞到障礙物 🌳 / 📦
          gameState = 'GAMEOVER';
          playGameOverSound();
        } else {
          // 撞到收集品 🌸 / 💩
          if (item.score < 0) playPoopSound();
          if (item.score > 0) playFlowerSound();

          if (item.score < 0 && score <= 0) {
            gameState = 'GAMEOVER'; // 分數零分碰到大便遊戲結束
            playGameOverSound();
          } else {
            score += item.score;
            if (score < 0) score = 0; // 確保分數不為負數

            // 更新最高紀錄
            if (score > highScore) {
              highScore = score;
              localStorage.setItem('pkmadv_highScore', highScore);
            }

            // 檢查是否破關
            if (score >= 20) {
              gameState = 'WIN';
              playWinSound();
            }

            // 視覺回饋
            scoreFeedback.active = true;
            scoreFeedback.timer = 20; // 閃爍維持幀數
            scoreFeedback.color = item.score > 0 ? '#4caf50' : '#f44336'; // 加分綠色，扣分紅色

            items.splice(i, 1);
          }
        }
        continue;
      }
    }

    // 移出畫面的物品必須被清除
    if (item.x < -100) {
      items.splice(i, 1);
    }
  }

  // 分數閃爍效果更新
  if (scoreFeedback.active) {
    scoreFeedback.timer--;
    scoreFeedback.scale = 1.0 + (scoreFeedback.timer / 20) * 0.5;
    if (scoreFeedback.timer <= 0) {
      scoreFeedback.active = false;
      scoreFeedback.scale = 1.0;
      scoreFeedback.color = '#333';
    }
  }
}

// 繪製畫面
function draw() {
  // 1. 背景顏色 (修改為淺草綠色，讓草叢更融合)
  ctx.fillStyle = '#a8e6cf';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 2. 背景草叢
  ctx.save();
  ctx.globalAlpha = 0.35; // 顏色淡化，避免與物品混淆
  ctx.font = '30px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  bushes.forEach(bush => {
    ctx.fillText(bush.emoji, bush.x, bush.y);
  });
  ctx.restore();

  // 3. 背景白雲
  ctx.save();
  ctx.globalAlpha = 0.6; // 白雲顏色淡化
  ctx.font = '50px sans-serif';
  clouds.forEach(cloud => {
    ctx.fillText('☁️', cloud.x, cloud.y);
  });
  ctx.restore();

  // 3. 繪製走道與分隔線
  // 為了視覺上較好區分，先給走道鋪一層稍微深的顏色或維持背景
  // 分隔線
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4;
  ctx.setLineDash([25, 15]);
  for (let i = 1; i < LANE_COUNT; i++) {
    let y = i * LANE_HEIGHT;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
  ctx.setLineDash([]); // 恢復實線

  // 4. 繪製物品
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let item of items) {
    let itemY = item.lane * LANE_HEIGHT + LANE_HEIGHT / 2;
    if (item.isObstacle) {
      ctx.font = `${EMOJI_SIZE * 1.35}px sans-serif`; // 樹與箱子稍微放大
    } else {
      ctx.font = `${EMOJI_SIZE}px sans-serif`;
    }
    ctx.fillText(item.emoji, item.x, itemY);
  }

  // 5. 繪製主角
  let playerY = player.lane * LANE_HEIGHT + LANE_HEIGHT / 2;
  ctx.font = `${EMOJI_SIZE}px sans-serif`; // 確保主角大小固定，不受物品影響
  ctx.fillText(player.emoji, PLAYER_X, playerY);

  // 6. 右上角顯示分數
  ctx.save();
  ctx.translate(canvas.width - 20, 40);
  if (scoreFeedback.active) {
    ctx.scale(scoreFeedback.scale, scoreFeedback.scale);
    ctx.fillStyle = scoreFeedback.color;
  } else {
    ctx.fillStyle = '#333';
  }
  ctx.font = 'bold 36px "Fredoka", sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  // 文字描邊
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4;
  ctx.strokeText(`Score: ${score}`, 0, 0);
  ctx.fillText(`Score: ${score}`, 0, 0);
  ctx.restore();

  // 7. Game Over 畫面
  if (gameState === 'GAMEOVER') {
    // 半透明遮罩
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 主標題
    ctx.fillStyle = '#d32f2f'; // 紅色
    ctx.font = 'bold 48px "Fredoka", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER!', canvas.width / 2, canvas.height / 2 - 40);

    // 分數顯示
    ctx.fillStyle = '#333';
    ctx.font = 'bold 28px "Fredoka", sans-serif';
    ctx.fillText(`最終得分: ${score}  ,  最高紀錄: ${highScore}`, canvas.width / 2, canvas.height / 2 + 15);

    // 副標題
    ctx.fillStyle = '#555';
    ctx.font = '24px "Fredoka", sans-serif';
    ctx.fillText('按下空白鍵或點擊螢幕再玩一次', canvas.width / 2, canvas.height / 2 + 65);
  } else if (gameState === 'WIN') {
    // 破關畫面
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#f57c00'; // 橘黃色
    ctx.font = 'bold 48px "Fredoka", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🎉 恭喜破關！ 🎉', canvas.width / 2, canvas.height / 2 - 40);

    ctx.fillStyle = '#333';
    ctx.font = 'bold 28px "Fredoka", sans-serif';
    ctx.fillText(`得分: ${score}  ,  最高紀錄: ${highScore}`, canvas.width / 2, canvas.height / 2 + 15);

    ctx.fillStyle = '#555';
    ctx.font = '24px "Fredoka", sans-serif';
    ctx.fillText('按下空白鍵或點擊螢幕再玩一次', canvas.width / 2, canvas.height / 2 + 65);
  }
}

// 遊戲迴圈
function gameLoop(timestamp) {
  update(timestamp);
  draw();
  if (gameState === 'PLAYING') {
    requestAnimationFrame(gameLoop);
  }
}

// 首次啟動
resetGame();
