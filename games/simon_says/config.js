const CONFIG = {
    game: {
        buttonSize: 120,
        gap: 20,
        playDelay: 600, // ms between notes
        lightDuration: 400
    },
    buttons: [
        { id: 0, color: '#ef4444', glow: 'rgba(239, 68, 68, 0.8)', freq: 329.63 }, // E4 (Red)
        { id: 1, color: '#3b82f6', glow: 'rgba(59, 130, 246, 0.8)', freq: 440.00 }, // A4 (Blue)
        { id: 2, color: '#eab308', glow: 'rgba(234, 179, 8, 0.8)', freq: 277.18 },  // C#4 (Yellow)
        { id: 3, color: '#22c55e', glow: 'rgba(34, 197, 94, 0.8)', freq: 164.81 }   // E3 (Green)
    ],
    ui: {
        primaryColor: '#f59e0b', // Amber
        secondaryColor: '#fef3c7',
        glowColor: 'rgba(245, 158, 11, 0.4)'
    }
};
