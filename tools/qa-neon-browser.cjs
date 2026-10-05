const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
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
 await p.keyboard.press('ArrowLeft');await p.waitForTimeout(300);assert(await p.evaluate(()=>neonGame.run.x< -6));await p.keyboard.press('ArrowRight');
 await p.keyboard.press('Space');await p.waitForTimeout(130);assert(await p.evaluate(()=>neonGame.run.y>0));await p.keyboard.down('ArrowUp');await p.waitForTimeout(600);assert(await p.evaluate(()=>neonGame.run.boosting&&neonGame.run.speed>40));await p.keyboard.up('ArrowUp');
 assert.equal(await p.evaluate(()=>neonGame.audio.context.state),'running');await p.screenshot({path:path.join(out,'run-desktop.png')});
 await p.keyboard.press('Escape');const frozen=await p.evaluate(()=>[neonGame.run.distance,neonGame.run.remaining,neonGame.run.elapsed]);await p.waitForTimeout(350);assert.deepEqual(await p.evaluate(()=>[neonGame.run.distance,neonGame.run.remaining,neonGame.run.elapsed]),frozen);
 await p.locator('#pause-help').click();await p.locator('#info-content').hover();await p.mouse.wheel(0,800);await p.waitForFunction(()=>document.querySelector('.info-panel').scrollTop>0);assert.equal(await p.evaluate(()=>scrollY),0);await p.keyboard.press('Escape');assert.equal(await p.evaluate(()=>neonGame.mode),'paused');await p.keyboard.press('Escape');assert.equal(await p.evaluate(()=>neonGame.mode),'running');
 pass('keyboard start, name/role/contract selection, lane changes, jump, boost, live audio, pause and scrollable help');
 // One entire run uses the rendered game's real clock and actual key presses.
 await p.keyboard.down('ArrowUp');const started=Date.now();let previous=-1;
 while(await p.evaluate(()=>neonGame.mode!=='result')){
  assert(Date.now()-started<180000,'Real-time run must finish');
  const state=await p.evaluate(()=>{const r=neonGame.run,next=r.stops.find(s=>!s.done);let target=r.lane;
   if(next&&next.distance-r.distance<85)target=next.lane;
   else{const h=r.items.find(o=>!o.done&&['tower','barrier','vent'].includes(o.type)&&o.distance>r.distance&&o.distance-r.distance<65);if(h){const blocked=r.items.filter(o=>o.distance===h.distance&&['tower','barrier','vent'].includes(o.type)).map(o=>o.lane);target=[0,1,2].find(l=>!blocked.includes(l));}}
   return{target,lane:r.lane,stop:r.completed,mode:neonGame.mode};});
  if(state.mode==='paused')throw Error('Unexpected pause during live run');
  for(let n=0;n<Math.abs(state.target-state.lane);n++)await p.keyboard.press(state.target<state.lane?'ArrowLeft':'ArrowRight');
  if(state.stop!==previous){previous=state.stop;console.log('LIVE '+state.stop+'/3 delivery gates passed');}
  await p.waitForTimeout(100);
 }
 await p.keyboard.up('ArrowUp');assert.equal(await p.evaluate(()=>neonGame.run.result.delivered),3);assert.equal(await p.evaluate(()=>neonGame.run.result.complete),true);assert(await p.evaluate(()=>neonGame.profile.xp>=220));assert.equal(await p.evaluate(()=>neonGame.profile.runs),1);
 await fit(p,'result');await p.screenshot({path:path.join(out,'result-desktop.png')});const score=await p.evaluate(()=>neonGame.profile.best);await p.waitForTimeout(150);assert.equal(await p.evaluate(()=>neonGame.profile.runs),1);
 pass('complete real-time run through all three districts using actual arrow keys: three deliveries, result, XP and one-time save');
 await p.locator('#result-home').click();await p.locator('#open-career').click();const points=await p.evaluate(()=>NC.points(neonGame.profile));assert(points>0);await p.locator('[data-skill="battery"]').click();assert.equal(await p.evaluate(()=>neonGame.profile.skills.battery),1);assert.equal(await p.evaluate(()=>NC.points(neonGame.profile)),points-1);
 await p.keyboard.press('Escape');await p.locator('#sound').click();assert.equal(await p.evaluate(()=>neonGame.audio.enabled),false);await p.reload();await p.waitForFunction(()=>window.neonGame);
 assert.equal(await p.locator('#pilot-name').inputValue(),'澄 / 07');assert.equal(await p.evaluate(()=>neonGame.profile.skills.battery),1);assert.equal(await p.evaluate(()=>neonGame.profile.best),score);assert.equal(await p.evaluate(()=>neonGame.audio.enabled),false);
 await p.keyboard.press('Space');assert.equal(await p.evaluate(()=>neonGame.run.capacity),112);await p.keyboard.press('Escape');await p.locator('#return-cover').click();pass('skill spending, upgraded next run, renamed profile, score and sound persist after reload');await p.close();
 }
 if(suite!=='core')for(const [width,height] of [[1440,900],[390,844],[320,568],[844,390],[667,375],[568,320]]){
  const ctx=await browser.newContext({viewport:{width,height},hasTouch:true,isMobile:width<900,deviceScaleFactor:width<900?2:1});p=await open(ctx);await fit(p,`${width} cover`);await p.screenshot({path:path.join(out,`cover-${width}x${height}.png`)});
  await p.locator('#launch').click();await p.waitForFunction(()=>neonGame.mode==='running');await fit(p,`${width} running`);
  const mobile=await p.locator('#touch-controls').isVisible();assert(mobile);
  for(const action of ['left','right','jump']){await p.locator(`[data-action="${action}"]`).tap();if(action==='left')assert.equal(await p.evaluate(()=>neonGame.run.lane),0);if(action==='right')assert.equal(await p.evaluate(()=>neonGame.run.lane),1);if(action==='jump'){await p.waitForTimeout(100);assert(await p.evaluate(()=>neonGame.run.y>0));}}
  const boost=p.locator('[data-action="boost"]'),box=await boost.boundingBox();await p.mouse.move(box.x+box.width/2,box.y+box.height/2);await p.mouse.down();await p.waitForTimeout(300);assert(await p.evaluate(()=>neonGame.input.boost));await p.mouse.up();assert.equal(await p.evaluate(()=>neonGame.input.boost),false);
  const controls=await p.locator('#touch-controls button').evaluateAll(bs=>bs.map(b=>{const r=b.getBoundingClientRect();return{x:r.x,y:r.y,right:r.right,bottom:r.bottom,w:r.width,h:r.height};}));
  for(const b of controls){assert(b.x>=47&&width-b.right>=47&&height-b.bottom>=47,JSON.stringify(b));assert(b.w>=44&&b.h>=44);}
  assert(controls[1].right<=controls[2].x,'Touch groups do not overlap');
  for(const side of ['ArrowLeft','ArrowRight','ArrowRight']){
   await p.keyboard.press(side);await p.waitForTimeout(400);
   const visible=await p.evaluate(()=>{const w=neonGame.world,v=w.pilot.position.clone().add(new THREE.Vector3(0,1.5,0)).project(w.camera);return{x:v.x,y:v.y};});assert(Math.abs(visible.x)<.90&&Math.abs(visible.y)<.92,`rider ${width} / ${side} visible: ${JSON.stringify(visible)}`);
  }
  await p.screenshot({path:path.join(out,`run-${width}x${height}.png`)});await p.keyboard.press('Escape');await fit(p,`${width} pause`);
  await p.locator('#pause-help').click();await p.mouse.wheel(0,600);await p.keyboard.press('Escape');await p.setViewportSize({width:height,height:width});await p.waitForTimeout(150);await fit(p,`${width} rotated pause`);
  await p.keyboard.press('Escape');await p.keyboard.down('ArrowUp');await p.evaluate(()=>window.dispatchEvent(new Event('blur')));assert.equal(await p.evaluate(()=>neonGame.mode),'paused');assert.equal(await p.evaluate(()=>neonGame.input.boost),false);await p.keyboard.up('ArrowUp');
  await p.locator('#return-cover').click();await p.setViewportSize({width,height});await p.locator('#launch').click();await p.waitForFunction(()=>neonGame.mode==='running');await p.evaluate(()=>neonGame.run.remaining=.01);await p.waitForFunction(()=>neonGame.mode==='result');await fit(p,`${width} timeout result`);
  await p.keyboard.press('Space');assert.equal(await p.evaluate(()=>neonGame.mode),'countdown');await p.keyboard.press('Escape');await p.locator('#return-cover').click();await p.locator('#open-career').click();await fit(p,`${width} career`);
  pass(`${width}x${height}: no page scrolling, touch inset/hold/release, visible rider in all lanes, pause/orientation, timeout/retry and career`);await ctx.close();
 }
 const blocked=await browser.newContext({viewport:{width:390,height:844}});await blocked.addInitScript(()=>{Storage.prototype.getItem=function(){throw Error('blocked');};Storage.prototype.setItem=function(){throw Error('blocked');};window.AudioContext=undefined;window.webkitAudioContext=undefined;});p=await open(blocked);await p.keyboard.press('Space');await p.waitForFunction(()=>neonGame.mode==='running');await p.evaluate(()=>neonGame.run.remaining=.01);await p.waitForFunction(()=>neonGame.mode==='result');assert.equal(await p.evaluate(()=>neonGame.profile.runs),1);await blocked.close();pass('unavailable audio and blocked storage still allow play, settlement and session progression');
 const corrupt=await browser.newContext();await corrupt.addInitScript(()=>localStorage.setItem('neon_courier_profile_v1','{invalid'));p=await open(corrupt);assert.equal(await p.evaluate(()=>neonGame.profile.name),'夜行者');await p.locator('#launch').click();await p.evaluate(()=>document.getElementById('world').dispatchEvent(new Event('webglcontextlost',{cancelable:true})));assert(await p.locator('#error').isVisible());assert(await p.evaluate(()=>neonGame.ended));await corrupt.close();pass('malformed saved data falls back safely and lost WebGL context shows recovery');
 p=await context.newPage();await p.goto(base+'/');assert.equal(await p.locator('.game-card').count(),19);await p.locator('#game-search').fill('霓光');assert.equal(await p.locator('.game-card').count(),1);await p.locator('.game-art').click();await p.waitForFunction(()=>window.neonGame);pass('homepage has 19 games and a searchable, working new game entry');await p.close();
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,`browser-results-${suite}.json`),JSON.stringify({passes,errors,date:new Date().toISOString()},null,2));await browser.close();
})().catch(async e=>{console.error(e);if(browser)await browser.close();process.exitCode=1;});
