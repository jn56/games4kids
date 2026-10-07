/* One source for the names, rules and controls shown in the hub and games. */
window.GameCatalog = [
  { id:'pkmadv', name:'花花草原快跑', icon:'🌸', category:'反應挑戰', color:'#16866b', tint:'#dff2df', description:'在三條草原走道間閃躲樹木與木箱，收集 20 朵花。小心便便會扣分！', controls:"↑ ↓ 切換走道 · 空白鍵開始／重玩", scoreKey:'pkmadv_highScore', tune:0 },
  { id:'stair_jump', name:'兔兔跳上天', icon:'🐰', category:'反應挑戰', color:'#7954b3', tint:'#eee4fa', description:'左右移動、抓準時機跳上移動階梯，一階一階挑戰更高的天空！', controls:"← → 或 A D 移動 · 空白鍵跳躍", scoreKey:'stair_jump_high_score', tune:1 },
  { id:'maze_adventure', name:'小狐狸的旋轉迷宮', icon:'🦊', category:'動腦時間', color:'#bd7734', tint:'#fff0d8', description:'在 60 秒內幫小狐狸找到家。迷宮會慢慢旋轉，仔細看好路線再出發！', controls:"↑ ↓ ← → 移動 · 空白鍵開始／重玩", tune:2 },
  { id:'shifting_maze', name:'魔法師的變變迷宮', icon:'🧙', category:'動腦時間', color:'#8755a3', tint:'#f2e5f7', description:'60 秒內找到出口！部分牆壁每 5 秒變換位置，還要避開巡邏的蜘蛛。', controls:"↑ ↓ ← → 移動 · 空白鍵開始／重玩", tune:3 },
  { id:'hungry_snake', name:'小蛇的蘋果派對', icon:'🐍', category:'反應挑戰', color:'#31894d', tint:'#e4f4d9', description:'吃蘋果、長長大！每顆蘋果加 10 分。穿過邊緣會從另一側出現，記得避開自己的身體。', controls:"↑ ↓ ← → 轉向 · 空白鍵開始／重玩", scoreKey:'hungry_snake_highScore', tune:4 },
  { id:'catch_candies', name:'糖果接接樂', icon:'🍬', category:'反應挑戰', color:'#c25b7d', tint:'#ffe5ee', description:'移動籃子接住糖果，收集分數達成目標！避開炸彈，分數低於零就要重新挑戰。', controls:"← → 移動 · 空白鍵開始／重玩", scoreKey:'catch_candies_highScore', tune:5 },
  { id:'flappy_bird', name:'小鳥的雲朵旅行', icon:'🐦', category:'反應挑戰', color:'#2785a3', tint:'#dff2fa', description:'輕輕拍翅膀，飛過雲朵之間的空隙。每通過一組雲朵加 1 分，挑戰 100 分！', controls:"↑ 或空白鍵拍翅 · 空白鍵開始／重玩", scoreKey:'flappy_bird_highScore', tune:6 },
  { id:'bubble_pop', name:'彩虹泡泡發射站', icon:'🫧', category:'動腦時間', color:'#397cbd', tint:'#e1edff', description:'瞄準並發射泡泡，連起 3 顆以上同色泡泡就能消除。累積 300 分過關！', controls:"← → 或 A D 瞄準 · 空白鍵發射", scoreKey:'bubble_pop_highScore', tune:7 },
  { id:'memory_match', name:'動物翻翻好朋友', icon:'🦁', category:'動腦時間', color:'#be7b36', tint:'#fdefdc', description:'每次翻開兩張卡片，找到所有一樣的動物。沒有時間限制，試試用更少次數完成！', controls:"↑ ↓ ← → 選牌 · 空白鍵翻牌", scoreKey:'memory_match_highScore', scoreLabel:'最少配對次數', tune:8 },
  { id:'simon_says', name:'跟著彩色節拍走', icon:'🎵', category:'動腦時間', color:'#b28120', tint:'#fff3ca', description:'看亮燈、聽節拍，依照相同順序按回去。每一輪都會多一個音，看看能記住多少！', controls:"↑ → ↓ ← 對應區塊箭頭 · 按亮燈順序重複", scoreKey:'simon_says_highScore', tune:9 },
  { id:'whack_a_mole', name:'地鼠出來玩', icon:'🐹', category:'反應挑戰', color:'#9861ac', tint:'#eee2f8', description:'在時間內點中冒出頭的地鼠，累積更多分數！看清楚再出手，炸彈會扣分。', controls:"方向鍵選洞、空白鍵敲打 · A S D 敲目前這排的左中右", scoreKey:'whack_a_mole_highScore', tune:10 },
  { id:'animal_tag_3d', name:'森林動物追追樂', icon:'🐕', category:'立體冒險', color:'#218276', tint:'#dcf1e8', description:'在立體森林裡追上並碰到兔子、貓咪和小狗，完成每關的捕捉目標。用耐力加速，探索不同森林！', controls:"↑ ↓ 前後移動 · ← → 轉向 · 按住空白鍵加速", tune:11 },
  { id:'pikmin_tag_3d', name:'皮克敏森林追追樂', icon:'🌱', category:'立體冒險', color:'#638d32', tint:'#e9f1d8', description:'帶著藍色皮克敏追上森林動物，爬上高台、跳過地形，完成每關的捕捉任務！', controls:"↑ ↓ 前後移動 · ← → 轉向 · S 加速 · 空白鍵跳躍", tune:12 },
  { id:'monster_maze_3d', name:'光波勇士迷宮探險', icon:'👾', category:'立體冒險', color:'#5668b5', tint:'#e6e9ff', description:'探索立體迷宮，發射光波暫時擊暈怪物，避開蜘蛛，找到發光傳送門完成挑戰！', controls:"↑ ↓ 前後移動 · ← → 轉向 · 空白鍵發射 · S 路線提示", scoreKey:'monster_maze_3d_highScore', tune:13 },
  { id:'dice_3d', name:'幸運骰子實驗室', icon:'🎲', category:'自由玩玩', color:'#ab7630', tint:'#fcf0d5', description:'挑一款喜歡的骰子，拋出今日的幸運點數！看看立體骰子滾動，回顧最近 15 次結果。', controls:"← → 換款式 · 空白鍵拋骰子", tune:14 },
  { id:'model_viewer_3d', name:'皮克敏動作小劇場', icon:'🌼', category:'自由玩玩', color:'#2888a1', tint:'#dff2f5', description:'讓藍色皮克敏站立、抱胸、跳躍、蹲下或奔跑。旋轉舞台，從不同角度看可愛的小動作！', controls:"← → 旋轉 · ↑ 站立 · ↓ 蹲下 · A 抱胸 · S 奔跑 · 空白鍵跳躍", tune:15 }
];
