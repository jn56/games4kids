const CONFIG = {
    // 關卡設定
    levels: [
        {
            cols: 11,
            rows: 11,
            timeLimit: 90, // 秒
            monsterCount: 2,
            name: "第一關：初試身手 🧱"
        },
        {
            cols: 23,
            rows: 23,
            timeLimit: 180, // 秒
            monsterCount: 5,
            name: "第二關：迷宮高手 🌀"
        },
        {
            cols: 45,
            rows: 45,
            timeLimit: 300, // 秒
            monsterCount: 12,
            name: "第三關：終極挑戰 👑"
        }
    ],
    // 玩家屬性
    player: {
        height: 0.6,          // 視角高度 (Y 軸)
        radius: 0.25,         // 玩家碰撞半徑
        speed: 3.5,           // 移動速度
        rotateSpeed: 2.2,     // 旋轉速度 (弧度/秒)
        maxLives: 5,          // 初始愛心數
        hitCooldown: 1500     // 受傷無敵時間 (毫秒)
    },
    // 小怪物屬性 (調慢速度，讓小朋友更容易閃避)
    monster: {
        radius: 0.3,          // 怪物碰撞半徑
        speed: 0.6,           // 巡邏速度 (原 1.0)
        chaseSpeed: 1.2,      // 追逐速度 (原 2.0)
        detectRange: 4.5,     // 發現玩家的距離
        stunDuration: 4000,    // 擊暈時間 (毫秒)
        spawnSafeRange: 3.0   // 初始生成時距離玩家的安全距離
    },
    // 光波射擊屬性
    projectile: {
        speed: 12.0,          // 光球飛行速度
        cooldown: 800,        // 射擊冷卻時間 (毫秒)
        radius: 0.1,          // 光球半徑
        maxRange: 15.0        // 最大射程
    },
    // 明亮可愛風配色 (以草綠、天藍、鮮豔花朵色為主)
    theme: {
        floorColor: "#86efac",       // 淺綠色草地
        wallColor: "#16a34a",        // 翠綠色灌木叢牆壁
        wallWireColor: "#4ade80",    // 牆壁邊緣發光線條
        skyColor: "#bae6fd",         // 天藍色天空
        portalColor: "#db2777",      // 桃紅色終點傳送門
        monsterColor: "#f97316",     // 亮橘色小怪物 (對比明顯)
        monsterStunColor: "#a855f7", // 紫色 (暈眩時)
        shootColor: "#fbbf24"        // 閃亮金黃色發光光波
    }
};
