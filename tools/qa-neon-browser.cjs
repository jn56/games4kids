const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const targetX=require('./neon-pilot.cjs');
const base=process.env.GAME_BASE||'http://127.0.0.1:4174',out=path.resolve(__dirname,'../.qa/neon-courier'),suite=process.argv[2]||'all';fs.mkdirSync(out,{recursive:true});
let browser;const errors=[],passes=[];
function pass(s){passes.push(s);console.log('PASS '+s);}
async function open(context){const p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});await p.goto(base+'/neon_courier/');await p.waitForFunction(()=>window.neonGame);return p;}
async function fit(p,label){
 if(await p.evaluate(()=>neonGame.mode==='info')){
  // These explicitly opened panels are allowed to scroll; every action must be reachable.
  for(const button of await p.locator('#info-panel button').all()){await button.scrollIntoViewIfNeeded();const b=await button.boundingBox(),v=p.viewportSize();assert(b.x>=0&&b.y>=0&&b.x+b.width<=v.width+1&&b.y+b.height<=v.height+1,label+' scrollable action is reachable');}
  assert.equal(await p.evaluate(()=>document.documentElement.scrollHeight>innerHeight||document.documentElement.scrollWidth>innerWidth),false);return;
 }
 const bad=await p.evaluate(()=>{
  const panel=document.querySelector('#'+({cover:'cover',paused:'pause-panel',result:'result',info:'info-panel'}[neonGame.mode]||'hud'));
  const items=[...panel.querySelectorAll('button,input,.panel')].filter(e=>e.getClientRects().length),inside=e=>{const b=e.getBoundingClientRect();return b.x>=-1&&b.y>=-1&&b.right<=innerWidth+1&&b.bottom<=innerHeight+1;};
  return{scroll:document.documentElement.scrollWidth>innerWidth||document.documentElement.scrollHeight>innerHeight,clipped:items.filter(e=>!inside(e)).map(e=>e.id||e.textContent)};
});assert.equal(bad.scroll,false,label+' no page scroll');assert.deepEqual(bad.clipped,[],label+' buttons fit');}
(async()=>{
 browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'msedge',headless:true});const context=await browser.newContext({viewport:{width:1440,height:900}});
 await context.route('https://**/*',r=>r.abort());let p;
 if(suite!=='layout'){
 p=await open(context);await fit(p,'desktop cover');await p.screenshot({path:path.join(out,'cover-desktop.png')});
 await p.locator('#pilot-name').fill('澄 / 07');await p.keyboard.press('Escape');assert.equal(await p.locator('#launch').evaluate(e=>e===document.activeElement),true);
 await p.locator('[data-role="aerial"]').click();assert.equal(await p.evaluate(()=>neonGame.profile.role),'aerial');await p.locator('[data-role="velocity"]').click();
 await p.locator('#contract-next').click();assert.equal(await p.evaluate(()=>neonGame.profile.contract),2);await p.locator('#contract-next').click();await p.locator('#contract-next').click();assert.equal(await p.evaluate(()=>neonGame.profile.contract),1);
 await p.locator('#launch').focus();await p.keyboard.press('Space');assert.equal(await p.evaluate(()=>neonGame.mode),'countdown');await p.waitForFunction(()=>neonGame.mode==='running');
 await p.keyboard.down('ArrowLeft');await p.waitForTimeout(180);await p.keyboard.up('ArrowLeft');const stopped=await p.evaluate(()=>neonGame.run.x);assert(stopped< -1&&stopped> -5,'Short hold stops between former lanes');await p.waitForTimeout(200);assert.equal(await p.evaluate(()=>neonGame.run.x),stopped,'Keyboard release stops without snapping');await p.keyboard.down('ArrowRight');await p.waitForTimeout(100);await p.keyboard.up('ArrowRight');
 await p.keyboard.press('Space');await p.waitForTimeout(130);assert(await p.evaluate(()=>neonGame.run.y>0));await p.keyboard.down('ArrowUp');await p.waitForTimeout(600);assert(await p.evaluate(()=>neonGame.run.boosting&&neonGame.run.speed>40));await p.keyboard.up('ArrowUp');
 assert.equal(await p.evaluate(()=>neonGame.audio.context.state),'running');assert.equal(await p.evaluate(()=>neonGame.run.couriers.length),5);assert.equal(await p.evaluate(()=>neonGame.world.courierModels.length),5);assert(await p.evaluate(()=>neonGame.world.courierModels.filter(g=>g.visible).length>=3));await p.screenshot({path:path.join(out,'run-desktop.png')});
 await p.keyboard.press('Escape');const frozen=await p.evaluate(()=>[neonGame.run.distance,neonGame.run.remaining,neonGame.run.elapsed,...neonGame.run.couriers.map(c=>[c.run.distance,c.run.x,c.run.energy])]);await p.waitForTimeout(350);assert.deepEqual(await p.evaluate(()=>[neonGame.run.distance,neonGame.run.remaining,neonGame.run.elapsed,...neonGame.run.couriers.map(c=>[c.run.distance,c.run.x,c.run.energy])]),frozen);
 await p.locator('#pause-help').click();await p.locator('#info-content').hover();await p.mouse.wheel(0,800);await p.waitForFunction(()=>document.querySelector('.info-panel').scrollTop>0);assert.equal(await p.evaluate(()=>scrollY),0);await p.keyboard.press('Escape');assert.equal(await p.evaluate(()=>neonGame.mode),'paused');await p.keyboard.press('Escape');assert.equal(await p.evaluate(()=>neonGame.mode),'running');
 pass('keyboard start, name/role/contract selection, free horizontal movement/release, jump, boost, live audio, pause and scrollable help');
 // One entire run uses the rendered game's real clock and actual key presses.
 await p.addScriptTag({content:'window.neonTestPilot='+targetX.toString()});
 await p.keyboard.down('ArrowUp');const started=Date.now();let previous=-1,steerKey=null;
 while(await p.evaluate(()=>neonGame.mode!=='result')){
  assert(Date.now()-started<180000,'Real-time run must finish');
  const state=await p.evaluate(()=>{const r=neonGame.run;return{target:neonTestPilot(r,5),x:r.x,stop:r.completed,mode:neonGame.mode};});
  if(state.mode==='paused')throw Error('Unexpected pause during live run');
  const nextKey=Math.abs(state.target-state.x)>.65?(state.target<state.x?'ArrowLeft':'ArrowRight'):null;
  if(nextKey!==steerKey){if(steerKey)await p.keyboard.up(steerKey);if(nextKey)await p.keyboard.down(nextKey);steerKey=nextKey;}
  if(state.stop!==previous){previous=state.stop;console.log('LIVE '+state.stop+'/3 delivery gates passed');}
  await p.waitForTimeout(40);
 }
 await p.keyboard.up('ArrowUp');if(steerKey)await p.keyboard.up(steerKey);assert.equal(await p.evaluate(()=>neonGame.run.result.delivered),3);assert.equal(await p.evaluate(()=>neonGame.run.result.complete),true);assert.equal(await p.evaluate(()=>neonGame.run.challenges),3);assert.deepEqual(await p.evaluate(()=>neonGame.run.forks.map(f=>f.choice)),[1,0,1]);assert(await p.evaluate(()=>neonGame.profile.xp>=220));assert.equal(await p.evaluate(()=>neonGame.profile.runs),1);
 await fit(p,'result');await p.screenshot({path:path.join(out,'result-desktop.png')});const score=await p.evaluate(()=>neonGame.profile.best);await p.waitForTimeout(150);assert.equal(await p.evaluate(()=>neonGame.profile.runs),1);
 pass('complete real-time run using actual arrow keys: right/left/right forks, three challenges, three deliveries, result, XP and one-time save');
 await p.locator('#result-home').click();await p.locator('#open-career').click();const points=await p.evaluate(()=>NC.points(neonGame.profile));assert(points>0);await p.locator('[data-skill="battery"]').click();assert.equal(await p.evaluate(()=>neonGame.profile.skills.battery),1);assert.equal(await p.evaluate(()=>NC.points(neonGame.profile)),points-1);
 await p.keyboard.press('Escape');await p.locator('#sound').click();assert.equal(await p.evaluate(()=>neonGame.audio.enabled),false);await p.reload();await p.waitForFunction(()=>window.neonGame);
 assert.equal(await p.locator('#pilot-name').inputValue(),'澄 / 07');assert.equal(await p.evaluate(()=>neonGame.profile.skills.battery),1);assert.equal(await p.evaluate(()=>neonGame.profile.best),score);assert.equal(await p.evaluate(()=>neonGame.audio.enabled),false);
 await p.keyboard.press('Space');assert.equal(await p.evaluate(()=>neonGame.run.capacity),112);await p.keyboard.press('Escape');await p.locator('#return-cover').click();pass('skill spending, upgraded next run, renamed profile, score and sound persist after reload');await p.close();
 }
 if(suite!=='core')for(const [width,height] of [[1440,900],[390,844],[320,568],[844,390],[667,375],[568,320]]){
  const ctx=await browser.newContext({viewport:{width,height},hasTouch:true,isMobile:width<900,deviceScaleFactor:width<900?2:1});p=await open(ctx);await fit(p,`${width} cover`);await p.screenshot({path:path.join(out,`cover-${width}x${height}.png`)});
  await p.locator('#launch').click();await p.waitForFunction(()=>neonGame.mode==='running');await fit(p,`${width} running`);
  const mobile=await p.locator('#touch-controls').isVisible();assert(mobile);
  const pad=await p.locator('#joystick').boundingBox(),cx=pad.x+pad.width/2,cy=pad.y+pad.height/2;
  await p.mouse.move(cx,cy);await p.mouse.down();await p.mouse.move(cx+3,cy-2);assert.equal(await p.evaluate(()=>neonGame.input.steer),0,'Neutral thumb jitter does not steer');
  await p.mouse.move(cx-pad.width*.32,cy);await p.waitForTimeout(150);const leftX=await p.evaluate(()=>neonGame.run.x);assert(leftX<-.5&&leftX> -6,'Partial hold moves smoothly between old lanes');
  await p.mouse.move(cx+pad.width*.15,cy);assert.equal(await p.evaluate(()=>neonGame.input.steer),1,'Any rightward push steers right');await p.waitForTimeout(120);assert(await p.evaluate(x=>neonGame.run.x>x,leftX));
  await p.mouse.move(cx+pad.width*.32,cy);assert(await p.evaluate(()=>neonGame.input.steer>.9));await p.waitForTimeout(150);await p.mouse.up();const freeX=await p.evaluate(()=>neonGame.run.x);await p.waitForTimeout(150);assert.equal(await p.evaluate(()=>neonGame.run.x),freeX,'Stick release stays at current position');
  await p.mouse.move(cx,cy);await p.mouse.down();
  for(const [dx,dy,expected] of [[0,-.32,0],[.04,-.32,1],[-.04,-.32,-1],[-.04,.32,-1],[.04,.32,1],[0,.32,0]]){await p.mouse.move(cx+pad.width*dx,cy+pad.width*dy);assert.deepEqual(await p.evaluate(()=>[neonGame.input.steer,neonGame.input.boost,neonGame.input.brake]),[expected,false,false],'Any stick angle affects left/right only');}
  await p.mouse.up();assert.deepEqual(await p.evaluate(()=>[neonGame.input.steer,neonGame.stick.pointer]),[0,null]);
  await p.locator('[data-action="jump"]').tap();await p.waitForTimeout(100);assert(await p.evaluate(()=>neonGame.run.y>0));
  const boost=p.locator('[data-action="boost"]'),box=await boost.boundingBox();await boost.tap();await p.waitForTimeout(200);assert(await p.evaluate(()=>neonGame.run.autoBoost&&neonGame.run.boosting));assert.equal(await p.evaluate(()=>neonGame.input.boost),false,'One-tap boost needs no held input');assert.equal(await boost.getAttribute('aria-pressed'),'true');
  // Real multi-touch: steering finger remains captured while another taps boost.
  const cdp=await ctx.newCDPSession(p),finger=(id,x,y)=>({id,x,y,radiusX:4,radiusY:4,force:1}),left=finger(1,cx-pad.width*.32,cy),right=finger(2,box.x+box.width/2,box.y+box.height/2);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[finger(1,cx,cy)]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[left]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[left,right]});assert.equal(await p.evaluate(()=>neonGame.run.autoBoost),true);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[left]});assert.equal(await p.evaluate(()=>neonGame.run.autoBoost),true,'Releasing stick does not cancel latched boost');assert.equal(await p.evaluate(()=>neonGame.stick.pointer),null);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert.equal(await p.evaluate(()=>neonGame.run.autoBoost),true,'Releasing boost finger keeps sprinting');
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[finger(3,cx-pad.width*.2,cy-pad.width*.25)]});assert.equal(await p.evaluate(()=>neonGame.input.steer),-1);await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});assert.equal(await p.evaluate(()=>neonGame.input.steer),0);assert.equal(await p.locator('#joystick-stick').evaluate(e=>e.style.transform),'');
  // Controlled stamina depletion checks the visible button state without waiting for every refill pickup.
  await p.evaluate(()=>neonGame.run.energy=.01);await p.waitForFunction(()=>!neonGame.run.autoBoost);await p.waitForTimeout(200);assert.equal(await boost.getAttribute('aria-pressed'),'false');assert.equal(await p.evaluate(()=>neonGame.run.boosting),false);await boost.tap();await p.waitForTimeout(40);assert.equal(await p.evaluate(()=>neonGame.run.autoBoost),true);await p.evaluate(()=>neonGame.run.energy=.01);await p.waitForFunction(()=>!neonGame.run.autoBoost);
  const controls=await p.locator('#joystick, #touch-controls button').evaluateAll(bs=>bs.map(b=>{const r=b.getBoundingClientRect();return{x:r.x,y:r.y,right:r.right,bottom:r.bottom,w:r.width,h:r.height};}));
  for(const b of controls){assert(b.x>=47&&width-b.right>=47&&height-b.bottom>=47,JSON.stringify(b));assert(b.w>=44&&b.h>=44);}
  assert(controls[0].right<=controls[1].x,'Touch groups do not overlap');
  for(const side of ['ArrowLeft','ArrowRight']){
   await p.keyboard.down(side);await p.waitForTimeout(1350);await p.keyboard.up(side);await p.waitForTimeout(200);assert.equal(await p.evaluate(()=>Math.abs(neonGame.run.x)),9.8,'Deck boundary contains rider');
   const visible=await p.evaluate(()=>{const w=neonGame.world,v=w.pilot.position.clone().add(new THREE.Vector3(0,1.5,0)).project(w.camera);return{x:v.x,y:v.y};});assert(Math.abs(visible.x)<.90&&Math.abs(visible.y)<.92,`rider ${width} / ${side} visible: ${JSON.stringify(visible)}`);
  }
  await p.screenshot({path:path.join(out,`run-${width}x${height}.png`)});
  // Controlled milestones validate the render/layout of both branches without waiting six full runs.
  await p.evaluate(()=>{const r=neonGame.run;r.forks[0].choice=null;r.distance=r.forks[0].start-80;r.x=2.7;});await p.waitForTimeout(150);assert(await p.locator('#fork-card').isVisible());assert.equal(await p.locator('#radio').isVisible(),false);
  for(const side of [0,1]){
   await p.evaluate(side=>{const r=neonGame.run,f=r.forks[0];f.choice=side;r.distance=(f.start+f.end)/2;r.x=(side?1:-1)*NC.moveLimit;},side);await p.waitForTimeout(650);
   const view=await p.evaluate(()=>{const w=neonGame.world,v=w.pilot.position.clone().add(new THREE.Vector3(0,1.5,0)).project(w.camera),b=document.querySelector('#fork-card').getBoundingClientRect(),m=document.querySelector('.mission-card').getBoundingClientRect(),stats=document.querySelector('.ride-stats').getBoundingClientRect(),energy=document.querySelector('.energy').getBoundingClientRect();const overlap=a=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;return{x:v.x,y:v.y,card:{x:b.x,y:b.y,right:b.right,bottom:b.bottom},missionBottom:m.bottom,overlap:overlap(stats)||overlap(energy),radio:!document.querySelector('#radio').hidden};});
   assert(Math.abs(view.x)<.90&&Math.abs(view.y)<.92,`${width} branch ${side} rider visible`);assert(view.card.x>=0&&view.card.right<=width&&view.card.bottom<=height);assert(view.card.y>=view.missionBottom-1,'Fork choices below mission');assert.equal(view.overlap,false,'Fork card clear of score/energy');assert.equal(view.radio,false);
   await p.screenshot({path:path.join(out,`fork-${side}-${width}x${height}.png`)});
  }
  await p.evaluate(()=>{const r=neonGame.run;r.distance=r.forks[0].end+.1;});await p.waitForTimeout(150);assert.equal(await p.locator('#fork-card').isVisible(),false);
  await p.mouse.move(cx,cy);await p.mouse.down();await p.mouse.move(cx,cy-pad.width*.32);await p.keyboard.press('Escape');assert.equal(await p.evaluate(()=>neonGame.stick.pointer),null);assert.equal(await p.evaluate(()=>neonGame.input.boost),false);await p.mouse.up();await fit(p,`${width} pause`);
  await p.locator('#pause-help').click();await p.mouse.wheel(0,600);await p.keyboard.press('Escape');await p.setViewportSize({width:height,height:width});await p.waitForTimeout(150);await fit(p,`${width} rotated pause`);
  await p.keyboard.press('Escape');await p.keyboard.down('ArrowUp');await p.evaluate(()=>window.dispatchEvent(new Event('blur')));assert.equal(await p.evaluate(()=>neonGame.mode),'paused');assert.equal(await p.evaluate(()=>neonGame.input.boost),false);await p.keyboard.up('ArrowUp');
  await p.locator('#return-cover').click();await p.setViewportSize({width,height});await p.locator('#launch').click();await p.waitForFunction(()=>neonGame.mode==='running');await p.evaluate(()=>neonGame.run.remaining=.01);await p.waitForFunction(()=>neonGame.mode==='result');await fit(p,`${width} timeout result`);
  await p.keyboard.press('Space');assert.equal(await p.evaluate(()=>neonGame.mode),'countdown');await p.keyboard.press('Escape');await p.locator('#return-cover').click();await p.locator('#open-career').click();await fit(p,`${width} career`);
  pass(`${width}x${height}: all-angle left/right-only stick, one-tap boost/depletion/restart, multi-touch/cancel, deck edges and fork cameras/HUD, pause/orientation, timeout/retry and career`);await ctx.close();
 }
 const blocked=await browser.newContext({viewport:{width:390,height:844}});await blocked.addInitScript(()=>{Storage.prototype.getItem=function(){throw Error('blocked');};Storage.prototype.setItem=function(){throw Error('blocked');};window.AudioContext=undefined;window.webkitAudioContext=undefined;});p=await open(blocked);await p.keyboard.press('Space');await p.waitForFunction(()=>neonGame.mode==='running');await p.evaluate(()=>neonGame.run.remaining=.01);await p.waitForFunction(()=>neonGame.mode==='result');assert.equal(await p.evaluate(()=>neonGame.profile.runs),1);await blocked.close();pass('unavailable audio and blocked storage still allow play, settlement and session progression');
 const corrupt=await browser.newContext();await corrupt.addInitScript(()=>localStorage.setItem('neon_courier_profile_v1','{invalid'));p=await open(corrupt);assert.equal(await p.evaluate(()=>neonGame.profile.name),'夜行者');await p.locator('#launch').click();await p.evaluate(()=>document.getElementById('world').dispatchEvent(new Event('webglcontextlost',{cancelable:true})));assert(await p.locator('#error').isVisible());assert(await p.evaluate(()=>neonGame.ended));await corrupt.close();pass('malformed saved data falls back safely and lost WebGL context shows recovery');
 p=await context.newPage();await p.goto(base+'/');assert.equal(await p.locator('.game-card').count(),19);await p.locator('#game-search').fill('霓光');assert.equal(await p.locator('.game-card').count(),1);await p.locator('.game-art').click();await p.waitForFunction(()=>window.neonGame);pass('homepage has 19 games and a searchable, working new game entry');await p.close();
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,`browser-results-${suite}.json`),JSON.stringify({passes,errors,date:new Date().toISOString()},null,2));await browser.close();
})().catch(async e=>{console.error(e);if(browser)await browser.close();process.exitCode=1;});
