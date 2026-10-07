const CONFIG = {
    game: {
        laneCount: 3,
        playerX: 100,
        emojiSize: 45,
        initialSpeed: 2.5,
        winScore: 20
    },
    player: {
        // 如果想直接使用包含連續動作的單一圖片 (Sprite Sheet)，請將檔名填在這裡：
        // 這樣就不需要手動分割圖片了！
        spriteSheet: '',
        spriteFrames: 3, // 圖片裡由上到下包含幾個動作
        
        // 如果想使用自己準備的 3 張獨立圖 (跨左腳、站立、跨右腳)，請將檔名填入下方陣列中：
        images: ['walk_left.png', 'walk_stand.png', 'walk_right.png'], 
        
        // 動畫切換速度 (數字越大越慢，預設約為 150)
        
        // 撞到花朵以外物品時的受傷圖檔 (可填寫檔名，例如 'hurt.png')
        hurtImage: '',
        // 如果沒填寫圖檔，預設會使用 Emoji 來連續切換
        emojis: ['🚶‍♀️', '🧍‍♀️', '🏃‍♀️'],
        // 受傷時預設顯示的 Emoji
        hurtEmoji: '😵',
        frameInterval: 150, // 動畫切換的速度 (毫秒)
        hurtDuration: 100 // 受傷表情維持的時間 (毫秒)
    },
    items: [
        { type: 'flower', emoji: '🌸', score: 1, isObstacle: false, weight: 50 },
        { type: 'poop', emoji: '💩', score: -1, isObstacle: false, weight: 45 },
        { type: 'tree', emoji: '🌳', score: 0, isObstacle: true, weight: 35 },
        { type: 'box', emoji: '📦', score: 0, isObstacle: true, weight: 15 }
    ]
};
