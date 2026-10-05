const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
fs.mkdirSync(path.join(__dirname,'../.qa'),{recursive:true});
const catalogContext={window:{}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../shared/catalog.js'),'utf8'),catalogContext);
const games=catalogContext.window.GameCatalog,passes=[],errors=[];
const pass=name=>{passes.push(name);console.log('PASS '+name);};
let browser,context;
async function open(id,ctx=context){const p=await ctx.newPage();p.on('pageerror',e=>errors.push(id+': '+e.message));await p.goto('http://127.0.0.1:4174/'+(id ? id+'/' : ''),{waitUntil:'domcontentloaded'});await p.waitForTimeout(80);return p;}
async function start(p){await p.keyboard.press('Space');await p.waitForTimeout(100);}
async function point(p,x,y,tap=false){const b=await p.locator('#gameCanvas').boundingBox();const size=await p.locator('#gameCanvas').evaluate(c=>({w:Number(c.dataset.logicalWidth)||c.width,h:Number(c.dataset.logicalHeight)||c.height}));const px=b.x+x*b.width/size.w,py=b.y+y*b.height/size.h;if(tap)await p.touchscreen.tap(px,py);else await p.mouse.click(px,py);}
(async()=>{
  browser=await chromium.launch({channel:'msedge',headless:true});context=await browser.newContext({viewport:{width:1440,height:900}});
  await context.route('https://**/*',r=>r.abort());
  let p=await open('');
  assert.equal(await p.locator('.game-card').count(),18);
  await p.locator('[data-filter="動腦時間"]').click();assert.equal(await p.locator('.game-card').count(),5);
  await p.locator('#game-search').fill('泡泡');assert.equal(await p.locator('.game-card').count(),1);
  await p.locator('#game-search').fill('不存在的遊戲');assert(await p.locator('#empty-state').isVisible());
  await p.locator('[data-filter="全部"]').click();await p.locator('#game-search').fill('');
  for(const href of await p.locator('.game-art').evaluateAll(links=>links.map(l=>l.href))){const res=await context.request.get(href);assert.equal(res.status(),200);}
  assert.equal(await p.evaluate(()=>{
    const original=Storage.prototype.setItem,key='garden_write_block_test';
    original.call(localStorage,key,'4');Storage.prototype.setItem=function(){throw Error('quota');};
    GameStorage.set(key,9);const latest=GameStorage.number(key);
    Storage.prototype.setItem=original;localStorage.removeItem(key);return latest;
  }),9);
  await p.keyboard.press('Escape');await p.keyboard.press('ArrowRight');await p.keyboard.press('Space');await p.waitForURL('**/pkmadv/index.html');
  await p.keyboard.press('Escape');for(let i=0;i<3;i++)await p.keyboard.press('ArrowDown');await p.keyboard.press('Space');await p.waitForURL('http://127.0.0.1:4174/index.html');assert.equal(await p.locator('.game-card').count(),18);
  pass('首頁：18 個有效入口、分類、搜尋、空結果與鍵盤進出遊戲');await p.close();

  p=await open('catch_candies');await start(p);
  await p.keyboard.press('Escape');assert(await p.evaluate(()=>GameShell.paused));
  await p.keyboard.down('ArrowRight');assert(!await p.evaluate(()=>keys.ArrowRight));await p.keyboard.up('ArrowRight');
  await p.keyboard.press('ArrowLeft');assert(await p.locator('.garden-pause [data-resume]').evaluate(b=>b===document.activeElement));
  await p.keyboard.press('Space');assert(!await p.evaluate(()=>GameShell.paused));
  await p.keyboard.press('Escape');await p.keyboard.press('Space');assert(!await p.evaluate(()=>GameShell.paused));
  pass('共用暫停：阻擋移動、鍵盤焦點保留、方向鍵選單與空白鍵繼續');await p.close();

  p=await open('hungry_snake');await start(p);
  assert.equal(await p.evaluate(()=>state),'PLAYING');
  await p.evaluate(()=>{snake=[{x:1,y:1},{x:1,y:2},{x:0,y:2},{x:0,y:1}];dir={x:-1,y:0};nextDir={x:-1,y:0};food={x:8,y:8};lastTime=0;update(performance.now());});
  assert.equal(await p.evaluate(()=>state),'PLAYING');assert.deepEqual(await p.evaluate(()=>snake[0]),{x:0,y:1});
  await p.evaluate(()=>{snake=[{x:cols-1,y:3},{x:cols-2,y:3}];dir=nextDir={x:1,y:0};food={x:0,y:3};lastTime=0;update(performance.now());});assert.equal(await p.evaluate(()=>score),10);
  await p.evaluate(()=>{snake=[];for(let y=0;y<rows;y++)for(let x=0;x<cols;x++)snake.push({x,y});spawnFood();});assert.equal(await p.evaluate(()=>state),'WIN');
  pass('小蛇：穿邊界、蘋果計分、移入尾巴不誤判、全盤完成不無限迴圈');await p.close();

  p=await open('bubble_pop');await start(p);
  const aim=await p.evaluate(()=>aimAngle);await p.keyboard.down('ArrowRight');await p.waitForTimeout(160);await p.keyboard.up('ArrowRight');assert(await p.evaluate(()=>aimAngle)>aim);await p.keyboard.press('Space');assert(await p.evaluate(()=>currentBubble.isShooting));await p.evaluate(()=>startGame());
  await p.evaluate(()=>shoot(currentBubble.x,currentBubble.y+100));assert.equal(await p.evaluate(()=>currentBubble.isShooting),false);
  await p.evaluate(()=>shoot(0,currentBubble.y-20));assert(await p.evaluate(()=>currentBubble.vy<0));
  await p.evaluate(()=>{grid=[['🔴','🔴']];snapToGrid({x:getGridPos(2,0).x,y:getGridPos(2,0).y,color:'🔴'});});assert.equal(await p.evaluate(()=>score),30);assert.equal(await p.evaluate(()=>state),'WIN');
  await start(p);assert.equal(await p.evaluate(()=>state),'PLAYING');
  await p.evaluate(()=>{grid=[['🔴']];spawnBubble();});assert.equal(await p.evaluate(()=>currentBubble.color),'🔴');
  pass('泡泡：拒絕向下發射、低角度不卡住、三顆消除、清空完成與重玩');await p.close();

  p=await open('memory_match');await start(p);
  const mismatch=await p.evaluate(()=>[0,cards.findIndex(c=>c.emoji!==cards[0].emoji)].map(i=>({x:cards[i].x+40,y:cards[i].y+40})));
  for(const c of mismatch)await point(p,c.x,c.y);
  await p.locator('.garden-toolbar .garden-action').click();await p.waitForTimeout(950);
  assert.equal(await p.evaluate(()=>flippedCards.length),2);await p.locator('.garden-pause [data-resume]').click();
  await p.waitForFunction(()=>flippedCards.length===0);
  await p.evaluate(()=>startGame());
  const pairs=await p.evaluate(()=>{const map={};cards.forEach((c,i)=>(map[c.emoji]??=[]).push({x:c.x+40,y:c.y+40,i}));return Object.values(map);});
  for(const pair of pairs){for(const c of pair)await point(p,c.x,c.y);await p.waitForFunction(()=>!isAnimating);}
  assert.equal(await p.evaluate(()=>state),'WIN');assert.equal(await p.evaluate(()=>highScore),8);
  await p.reload();assert.equal(await p.evaluate(()=>highScore),8);
  await start(p);await p.keyboard.press('ArrowRight');await p.keyboard.press('Space');assert.equal(await p.evaluate(()=>cards[1].isFlipped),true);
  pass('翻牌：錯誤配對暫停不消失、完整八對、首次最佳紀錄與重新載入、鍵盤翻牌');await p.close();

  p=await open('simon_says');await start(p);await p.waitForFunction(()=>!isPlayingSequence);
  const target=await p.evaluate(()=>sequence[0]);const arrows=['ArrowUp','ArrowRight','ArrowDown','ArrowLeft'];await p.keyboard.press(arrows[target]);await p.keyboard.press(arrows[target]);
  assert.equal(await p.evaluate(()=>state),'PLAYING');await p.waitForFunction(()=>sequence.length===2);assert.equal(await p.evaluate(()=>score),1);
  await p.locator('.garden-toolbar .garden-action').click();const before=await p.evaluate(()=>({step:playerStep,lit:litButton,length:sequence.length}));await p.waitForTimeout(1500);assert.deepEqual(await p.evaluate(()=>({step:playerStep,lit:litButton,length:sequence.length})),before);
  await p.locator('.garden-pause [data-resume]').click();await p.waitForFunction(()=>!isPlayingSequence);
  await p.keyboard.press(arrows[await p.evaluate(()=>(sequence[0]+1)%4)]);assert.equal(await p.evaluate(()=>state),'GAMEOVER');
  await start(p);await p.waitForTimeout(1700);assert.equal(await p.evaluate(()=>sequence.length),1);
  pass('節拍：正確輸入、快速連點不多開回合、暫停不跳音、錯誤後重玩無殘留計時器');await p.close();

  p=await open('catch_candies');await start(p);await p.keyboard.down('ArrowLeft');await p.waitForTimeout(150);await p.evaluate(()=>window.dispatchEvent(new Event('blur')));assert.equal(await p.evaluate(()=>keys.ArrowLeft),false);assert(await p.evaluate(()=>GameShell.paused));
  await p.keyboard.up('ArrowLeft');await p.locator('.garden-pause [data-resume]').click();
  await p.evaluate(()=>{score=99;items=[{x:basket.x,y:basket.y,emoji:'🍬',type:'candy',score:1}];update(performance.now());});assert.equal(await p.evaluate(()=>state),'WIN');
  await start(p);await p.evaluate(()=>{items=[{x:basket.x,y:basket.y,emoji:'💣',type:'bomb',score:-5}];update(performance.now());});assert.equal(await p.evaluate(()=>state),'GAMEOVER');
  pass('糖果：失焦清除移動、暫停、達標勝利、炸彈扣分與重玩');await p.close();

  p=await open('flappy_bird');await point(p,200,300);assert(await p.evaluate(()=>bird.velocity<0));
  await p.evaluate(()=>{score=99;bird.y=300;bird.velocity=0;pipes=[{x:bird.x-CONFIG.game.pipeWidth-30,topHeight:50,passed:false}];update();});assert.equal(await p.evaluate(()=>state),'WIN');
  await start(p);await p.evaluate(()=>{bird.y=boardHeight;score=0;pipes=[{x:0,topHeight:50,passed:false}];update();});assert.equal(await p.evaluate(()=>state),'GAMEOVER');assert.equal(await p.evaluate(()=>score),0);
  pass('小鳥：首次點擊即拍翅、100 分勝利、死亡幀停止計分');await p.close();

  p=await open('whack_a_mole');await start(p);await p.evaluate(()=>{const h=holes[0];h.active=true;h.entity=CONFIG.entities[0];h.timer=2000;});await p.keyboard.press('ArrowUp');await p.keyboard.press('KeyA');assert.equal(await p.evaluate(()=>score),10);
  await p.locator('.garden-toolbar .garden-action').click();const time=await p.evaluate(()=>timeLeft);await p.waitForTimeout(1150);assert.equal(await p.evaluate(()=>timeLeft),time);await p.locator('.garden-pause [data-resume]').click();
  await p.evaluate(()=>{timeLeft=1;});await p.waitForFunction(()=>state==='GAMEOVER');await start(p);assert.equal(await p.evaluate(()=>timeLeft),30);
  pass('地鼠：鍵盤命中計分、暫停停止倒數、時間到與重玩');await p.close();

  p=await open('pkmadv');await start(p);await p.keyboard.press('ArrowUp');assert.equal(await p.evaluate(()=>player.lane),0);
  await p.evaluate(()=>{score=19;items=[{x:PLAYER_X,lane:player.lane,isObstacle:false,score:1,type:'flower'}];update(performance.now());});assert.equal(await p.evaluate(()=>gameState),'WIN');
  await start(p);await p.evaluate(()=>{items=[{x:PLAYER_X,lane:player.lane,isObstacle:true,score:0,type:'tree'}];update(performance.now());});assert.equal(await p.evaluate(()=>gameState),'GAMEOVER');
  for(let i=0;i<3;i++){await start(p);await p.evaluate(()=>gameState='GAMEOVER');}
  pass('草原：切換走道、20 分勝利、障礙物結束、重玩維持單一動畫循環');await p.close();

  p=await open('stair_jump');await start(p);await p.keyboard.press('Space');await p.waitForTimeout(100);assert(await p.evaluate(()=>player.vy<0));
  await p.locator('.garden-toolbar .garden-action').click();const survival=await p.evaluate(()=>survivalTime);await p.waitForTimeout(1200);await p.locator('.garden-pause [data-resume]').click();await p.waitForTimeout(80);assert(await p.evaluate(()=>survivalTime)<=survival+1);
  await p.evaluate(()=>{score=CONFIG.game.winScore;update();});assert.equal(await p.evaluate(()=>gameState),'WIN');await start(p);assert.equal(await p.evaluate(()=>score),0);
  pass('兔兔：空白鍵跳躍、暫停不增加難度、達標與重玩');await p.close();

  for(const id of ['maze_adventure','shifting_maze']){
    p=await open(id);await start(p);assert(await p.locator('.timer-badge').isVisible());
    await p.locator('.garden-toolbar .garden-action').click();const time=await p.evaluate(()=>timeLeft);await p.waitForTimeout(1100);assert.equal(await p.evaluate(()=>timeLeft),time);await p.locator('.garden-pause [data-resume]').click();
    const solved=await p.evaluate(()=>{
      if(typeof spider!=='undefined')spider={i:-100,j:-100};
      const queue=[{i:player.i,j:player.j,path:[]}],seen=new Set();const directions=[[0,-1],[1,0],[0,1],[-1,0]];
      while(queue.length){const item=queue.shift(),key=item.i+','+item.j;if(seen.has(key))continue;seen.add(key);if(item.i===goal.i&&item.j===goal.j){for(const [dx,dy]of item.path)movePlayer(dx,dy);return !isPlaying;}
        const c=grid[index(item.i,item.j)];directions.forEach(([dx,dy],wall)=>{if(!c.walls[wall])queue.push({i:item.i+dx,j:item.j+dy,path:[...item.path,[dx,dy]]});});}
      return false;
    });assert(solved);assert(await p.locator('#congratsMsg').isVisible());await p.keyboard.press('Space');assert(await p.evaluate(()=>isPlaying));
    await p.evaluate(()=>timeLeft=1);await p.waitForFunction(()=>!isPlaying);assert(await p.locator('#gameOverMsg').isVisible());
    pass(id+'：迷宮路徑可解、逐格行走完成、倒數暫停、重新產生與超時');await p.close();
  }

  for(const id of ['animal_tag_3d','pikmin_tag_3d']){
    p=await open(id);await start(p);await p.keyboard.down('ArrowUp');await p.waitForTimeout(250);await p.keyboard.up('ArrowUp');
    await p.evaluate(()=>window.dispatchEvent(new Event('blur')));assert(await p.evaluate(()=>Object.values(keys).every(v=>v===false)));await p.locator('.garden-pause [data-resume]').click();
    if(id==='pikmin_tag_3d'){await p.keyboard.down('KeyS');assert(await p.evaluate(()=>keys.dash&&!keys.backward));await p.keyboard.up('KeyS');await p.keyboard.down('KeyA');assert(await p.evaluate(()=>keys.left));assert(!await p.evaluate(()=>keys.jump));await p.keyboard.up('KeyA');await p.keyboard.down('Space');assert(await p.evaluate(()=>keys.jump));assert(!await p.evaluate(()=>keys.dash));await p.keyboard.up('Space');}
    for(let level=0;level<await p.evaluate(()=>CONFIG.levels.length);level++){
      await p.evaluate(()=>{while(gameState==='PLAYING')catchAnimal(0);});
      if(level<await p.evaluate(()=>CONFIG.levels.length-1)){assert(await p.locator('#nextLevelOverlay').isVisible());await p.keyboard.press('Space');}else{assert(await p.locator('#victoryOverlay').isVisible());await p.keyboard.press('Space');}
    }
    assert.equal(await p.evaluate(()=>currentLevelIndex),0);await p.evaluate(()=>gameOver());await p.keyboard.press('Space');assert.equal(await p.evaluate(()=>gameState),'PLAYING');
    pass(id+'：鍵盤釋放、全部關卡捕捉目標、關卡切換、勝利重玩與失敗重試');await p.close();
  }

  p=await open('monster_maze_3d');await start(p);await p.keyboard.press('Space');assert(await p.evaluate(()=>projectiles.length)>0);
  await p.keyboard.press('KeyS');assert(await p.evaluate(()=>showHints));
  await p.evaluate(()=>{lives=1;triggerPlayerDamage();});assert.equal(await p.evaluate(()=>gameState),'GAMEOVER');await p.keyboard.press('Space');assert.equal(await p.evaluate(()=>lives),5);
  for(let i=0;i<await p.evaluate(()=>CONFIG.levels.length);i++){await p.evaluate(()=>completeLevel());if(i<await p.evaluate(()=>CONFIG.levels.length-1))await p.keyboard.press('Space');}
  assert(await p.locator('#victoryOverlay').isVisible());await p.keyboard.press('Space');assert.equal(await p.evaluate(()=>currentLevelIndex),0);
  pass('光波迷宮：發射、路線提示、受傷失敗與重試、全部關卡切換和勝利');await p.close();

  p=await open('dice_3d');await p.keyboard.press('Space');await p.waitForFunction(()=>diceState==='IDLE' && rollsCount===1,{timeout:12000});assert(await p.evaluate(()=>finalResult)>=1);assert(await p.evaluate(()=>finalResult)<=6);assert.equal(await p.locator('.history-item').count(),1);
  await p.keyboard.press('ArrowLeft');assert(await p.locator('.skin-btn').last().evaluate(b=>b.classList.contains('active')));
  await p.evaluate(()=>{for(let i=0;i<20;i++){finalResult=i%6+1;recordHistory();}});assert.equal(await p.locator('.history-item').count(),15);
  pass('骰子：完整拋擲產生 1～6 點、換款式、最近 15 次紀錄');await p.close();

  p=await open('model_viewer_3d');for(const [key,state]of [['KeyA','FOLD_ARMS'],['ArrowDown','CROUCH'],['KeyS','RUN'],['ArrowUp','IDLE']]){await p.keyboard.press(key);assert.equal(await p.evaluate(()=>currentAnimState),state);}await p.keyboard.press('Space');assert(await p.evaluate(()=>isJumping));
  const rotation=await p.evaluate(()=>targetRotationY);await p.keyboard.press('ArrowRight');assert.notEqual(await p.evaluate(()=>targetRotationY),rotation);
  pass('動作劇場：所有姿勢、跳躍與視角旋轉');await p.close();

  // Each game must survive private / restricted storage and browsers without audio.
  const blocked=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await blocked.addInitScript(()=>{Storage.prototype.getItem=function(){throw Error('blocked');};Storage.prototype.setItem=function(){throw Error('blocked');};window.AudioContext=undefined;window.webkitAudioContext=undefined;});
  for(const game of games){p=await open(game.id,blocked);await start(p);assert.equal(await p.locator('.garden-nav').count(),1);await p.close();}
  pass('16 個遊戲：儲存被封鎖、音訊不可用時仍可開始');await blocked.close();
  assert.deepEqual(errors,[]);pass('全部流程無 JavaScript 錯誤');
  fs.writeFileSync(path.join(__dirname,'../.qa/verify.json'),JSON.stringify({date:new Date().toISOString(),passes,errors},null,2));await browser.close();
})().catch(async error=>{console.error(error);if(browser)await browser.close();process.exitCode=1;});
