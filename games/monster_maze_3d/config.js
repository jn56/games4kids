const CONFIG = {
    // 關卡設定
    levels: [
        {
            cols: 11,
            rows: 11,
            timeLimit: 150,
            monsterCount: 2,
            spiderCount: 0,
            name: "第一關：初試身手 🧱"
        },
        {
            cols: 23,
            rows: 23,
            timeLimit: 240,
            monsterCount: 5,
            spiderCount: 0,
            name: "第二關：迷宮高手 🌀"
        },
        {
            cols: 33,
            rows: 33,
            timeLimit: 300,
            monsterCount: 8,
            spiderCount: 0,
            name: "第三關：終極挑戰 👑"
        },
        {
            cols: 55,
            rows: 55,
            timeLimit: 0, // 0 = 無限時間
            monsterCount: 72,
            spiderCount: 18,
            name: "第四關：蜘蛛巢穴 🕷️"
        }
    ],
    // 玩家屬性
    player: {
        height: 0.95,
        radius: 0.25,
        speed: 3.5,
        rotateSpeed: 2.2,
        maxLives: 5,
        hitCooldown: 1500
    },
    // 小怪物屬性
    monster: {
        radius: 0.3,
        speed: 0.54,
        chaseSpeed: 1.08,
        detectRange: 4.5,
        stunDuration: 4000,
        spawnSafeRange: 3.0
    },
    // 蜘蛛屬性
    spider: {
        radius: 0.35,
        speed: 0.5,
        chaseSpeed: 1.0,
        detectRange: 6.0,
        stunDuration: 3000,
        webCooldown: 4000,     // 吐絲冷卻時間 (毫秒)
        webSpeed: 5.0,         // 蛛絲飛行速度
        webSlowDuration: 3000, // 被蛛絲黏住的減速時間 (毫秒)
        webSlowFactor: 0.3     // 被黏住時速度降至 30%
    },
    // 光波射擊屬性
    projectile: {
        speed: 12.0,
        cooldown: 100,
        radius: 0.1,
        maxRange: 15.0
    },
    // 明亮可愛風配色
    theme: {
        floorColor: "#0f172a",
        wallColor: "#0f2d19",
        wallWireColor: "#86efac",
        skyColor: "#bae6fd",
        portalColor: "#db2777",
        monsterColor: "#f97316",
        monsterStunColor: "#a855f7",
        shootColor: "#fbbf24",
        spiderColor: "#581c87",       // 深紫色蜘蛛
        spiderWebColor: "#e2e8f0"     // 灰白色蛛絲
    }
};
