const CONFIG = {
    // 玩家設定
    player: {
        width: 22,
        height: 22,
        speed: 2.5,
        gravity: 0.15,
        jumpForce: -6,
        colorStart: '#c084fc',
        colorEnd: '#a855f7',
        glowColor: 'rgba(168, 85, 247, 0.8)'
    },
    // 平台設定
    platform: {
        baseWidth: 75,
        height: 12,
        baseSpeed: 0.75,
        colorStart: '#22d3ee',
        colorEnd: '#06b6d4',
        glowColor: 'rgba(6, 182, 212, 0.4)'
    },
    // 遊戲設定
    game: {
        winScore: 300,
        scorePerPlatform: 10
    }
};
