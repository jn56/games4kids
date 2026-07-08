const CONFIG = {
    maze: {
        cols: 10,
        rows: 10
    },
    game: {
        timeLimit: 60,
        shiftInterval: 5000,
        movingWallsCount: { min: 5, max: 10 },
        spiderSpeed: 500 // ms per move
    },
    graphics: {
        playerEmoji: '🧙',
        goalEmoji: '🚪',
        spiderEmoji: '🕷️',
        wallColor: '#6b21a8', // Purple
        floorColor: '#f3e8ff', // Light purple
        shiftingWallColor: '#ec4899', // Pink highlight when moving
        movingWallColor: '#0ea5e9' // Cyan for fixed moving walls
    }
};
