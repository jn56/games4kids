const CONFIG = {
    game: {
        laneCount: 3,
        playerX: 100,
        emojiSize: 45,
        initialSpeed: 2.5,
        winScore: 20
    },
    player: {
        emoji: '👧'
    },
    items: [
        { type: 'flower', emoji: '🌸', score: 1, isObstacle: false, weight: 50 },
        { type: 'poop', emoji: '💩', score: -1, isObstacle: false, weight: 45 },
        { type: 'tree', emoji: '🌳', score: 0, isObstacle: true, weight: 35 },
        { type: 'box', emoji: '📦', score: 0, isObstacle: true, weight: 15 }
    ]
};
