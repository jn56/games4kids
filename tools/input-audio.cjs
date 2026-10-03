const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
fs.mkdirSync(path.join(__dirname,'../.qa'),{recursive:true});
const sandbox={window:{}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../shared/catalog.js'),'utf8'),sandbox);
const passes=[],errors=[];let browser;
async function start(page){if(await page.locator('#startBtn').count())await page.locator('#startBtn').tap();else if(await page.locator('#rollBtn').count())await page.locator('.garden-pad button').filter({hasText:'拋骰子'}).tap();else if(await page.locator('#btnRun').count())await page.locator('#btnRun').tap();else await page.locator('.garden-toolbar .garden-action').tap();}
async function hold(context,page,locator,move,ms=220,cancel=false){const box=await locator.boundingBox();const session=await context.newCDPSession(page);const touch={x:box.x+box.width/2,y:box.y+box.height/2,id:1};await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[touch]});if(move)await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{...touch,x:touch.x+move.x,y:touch.y+move.y}]});await page.waitForTimeout(ms);const observed=await page.evaluate(()=>({joystick:typeof joystickActive==='boolean'?joystickActive:null,y:typeof joystickY==='number'?joystickY:null}));await session.send('Input.dispatchTouchEvent',{type:cancel?'touchCancel':'touchEnd',touchPoints:[]});await session.detach();return observed;}
(async()=>{
  browser=await chromium.launch({channel:'msedge',headless:true});
  for(const game of sandbox.window.GameCatalog){
    const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true});
    await context.addInitScript(()=>{window.audioNotes=0;const Context=window.AudioContext||window.webkitAudioContext;if(Context){const create=Context.prototype.createOscillator;Context.prototype.createOscillator=function(){window.audioNotes++;return create.call(this);};}});
    const page=await context.newPage();page.on('pageerror',e=>errors.push(game.id+': '+e.message));await page.goto('http://127.0.0.1:4174/'+game.id+'/',{waitUntil:'domcontentloaded'});await start(page);await page.waitForTimeout(450);
    assert(await page.evaluate(()=>GameAudio.context()?.state==='running'),game.id+' audio unlocked');assert(await page.evaluate(()=>audioNotes)>0,game.id+' background melody');
    await page.locator('.garden-menu-button').tap();await page.locator('[data-audio="music"]').tap();assert.equal(await page.evaluate(()=>GameAudio.musicEnabled),false);
    await page.waitForTimeout(120);const before=await page.evaluate(()=>audioNotes);
    const effect=game.id==='pkmadv'?'playFlowerSound()':game.id==='stair_jump'?'playJumpSound()':['maze_adventure','shifting_maze'].includes(game.id)?'playWinSound()':game.id==='simon_says'?'playTone(440,200)':"playSound('catch')";
    await page.evaluate(effect);assert(await page.evaluate(()=>audioNotes)>before,game.id+' effects with music muted');
    await page.locator('[data-audio="effects"]').tap();const muted=await page.evaluate(()=>audioNotes);await page.evaluate(effect);assert.equal(await page.evaluate(()=>audioNotes),muted,game.id+' effects muted');
    await page.reload();assert.equal(await page.evaluate(()=>GameAudio.musicEnabled),false);assert.equal(await page.evaluate(()=>GameAudio.effectsEnabled),false);
    await start(page);
    if(game.id==='hungry_snake'){
      await hold(context,page,page.locator('#gameCanvas'),{x:0,y:-55},40);assert.equal(await page.evaluate(()=>nextDir.y),-1);
    }
    if(game.id==='catch_candies'){
      await page.evaluate(()=>{items=[];});const x=await page.evaluate(()=>basket.x);await hold(context,page,page.locator('.garden-pad button').last(),null,220,true);assert(await page.evaluate(()=>basket.x)>x);assert(!await page.evaluate(()=>keys.ArrowRight));
    }
    if(game.id==='pkmadv'){
      await page.locator('.garden-pad button').first().tap();assert.equal(await page.evaluate(()=>player.lane),0);
    }
    if(game.id==='stair_jump'){
      await page.locator('.garden-pad button').filter({hasText:'跳躍'}).tap();await page.waitForTimeout(90);assert(await page.evaluate(()=>player.vy)<0);
    }
    if(game.id==='flappy_bird'){
      await page.locator('.garden-pad button').tap();assert(await page.evaluate(()=>bird.velocity)<0);
    }
    if(game.id==='memory_match'){
      const card=await page.evaluate(()=>({x:cards[0].x+40,y:cards[0].y+40}));const box=await page.locator('#gameCanvas').boundingBox();await page.touchscreen.tap(box.x+card.x*box.width/400,box.y+card.y*box.height/500);assert(await page.evaluate(()=>cards[0].isFlipped));
    }
    if(['animal_tag_3d','pikmin_tag_3d'].includes(game.id)){
      await page.locator('#joystickTouchArea').scrollIntoViewIfNeeded();
      const input=await hold(context,page,page.locator('#joystickBase'),{x:0,y:-40},300,true);assert.equal(input.joystick,true);assert(input.y<0);
      assert.equal(await page.evaluate(()=>joystickActive),false);assert.equal(await page.evaluate(()=>joystickX),0);assert.equal(await page.evaluate(()=>joystickY),0);
      await hold(context,page,page.locator('#btnDash'),null,100,true);assert(!await page.evaluate(()=>keys.dash));
      if(game.id==='pikmin_tag_3d'){await page.locator('#btnJump').tap();}
    }
    if(game.id==='monster_maze_3d'){
      await hold(context,page,page.locator('#btnForward'),null,220,true);assert(!await page.evaluate(()=>touchControls.forward));const fired=await page.evaluate(()=>lastShootTime);await page.locator('#btnShoot').tap();assert(await page.evaluate(()=>lastShootTime)>fired);
    }
    await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:path.join(__dirname,'../.qa/final-'+game.id+'-390.png'),fullPage:true});
    passes.push(game.id+': 音樂／音效獨立開關、設定保存、手機開始與操作');console.log('PASS '+passes.at(-1));await context.close();
  }
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(__dirname,'../.qa/input-audio.json'),JSON.stringify({passes,errors},null,2));await browser.close();
})().catch(async e=>{console.error(e);if(browser)await browser.close();process.exitCode=1;});
