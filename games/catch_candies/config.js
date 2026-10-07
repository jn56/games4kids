const CONFIG = {
    game: {
        width: 400,
        height: 600,
        basketYOffset: 80, // Distance from bottom
        basketWidth: 80,
        basketHeight: 40,
        basketSpeed: 6,
        itemSize: 40,
        itemFallSpeed: 3,
        spawnIntervalMin: 300,
        spawnIntervalMax: 800,
        winScore: 100,
        bombPenalty: 5
    },
    items: [
        { emoji: '🍬', type: 'candy', score: 1, probability: 0.4 },
        { emoji: '🍭', type: 'candy', score: 2, probability: 0.3 },
        { emoji: '🍓', type: 'fruit', score: 3, probability: 0.15 },
        { emoji: '💣', type: 'bomb', score: -5, probability: 0.15 }
    ],
    ui: {
        primaryColor: '#ec4899', // Pink
        secondaryColor: '#fbcfe8',
        glowColor: 'rgba(236, 72, 153, 0.4)'
    }
};
