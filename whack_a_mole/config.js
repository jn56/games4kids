const CONFIG = {
    game: {
        cols: 3,
        rows: 3,
        holeSize: 90,
        gap: 20,
        gameDuration: 30, // seconds
        baseShowTime: 1200, // min time mole stays up
        minWaitTime: 400
    },
    entities: [
        { emoji: '🐹', type: 'mole', score: 10, probability: 0.8 },
        { emoji: '💣', type: 'bomb', score: -15, probability: 0.2 }
    ],
    ui: {
        primaryColor: '#8b5cf6', // Violet
        secondaryColor: '#ddd6fe',
        glowColor: 'rgba(139, 92, 246, 0.4)',
        holeColor: '#1e293b'
    }
};
