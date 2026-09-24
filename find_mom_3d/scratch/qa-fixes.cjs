const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path');let browser;
(async()=>{
 browser=await chromium.launch({channel:'msedge',headless:true});const p=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('http://127.0.0.1:4173/find_mom_3d/');await p.waitForFunction(()=>window.meadowGame);
 async function seed(chapter,extra={}){await p.evaluate(({chapter,extra})=>{const g=meadowGame,s=Meadow.Progress.fresh();s.entryChapter=s.chapter=chapter;s.prologueSeen=true;for(const [k,v] of Object.entries(extra))Object.assign(s[k],v);g.saved=s;g.start(true);},{chapter,extra});}
 await seed(2,{forest:{metOwl:true}});await p.evaluate(()=>meadowGame.song.open());
 for(let round=0;round<3;round++){
  await p.locator('#song-replay').tap();await p.waitForFunction(()=>meadowGame.song.ready);
  const expected=await p.evaluate(()=>Meadow.SongPuzzle.expected(meadowGame.song.current));
  const bell=await p.locator('[data-note="leaf"]').elementHandle();
  for(const [i,id] of expected.entries()){await p.locator(`[data-note="${id}"]`).tap();assert.equal(await p.locator('#song-input .score-note').count(),i+1,`round ${round} note ${i+1}`);assert(await bell.evaluate(el=>el.isConnected),'buttons must remain connected');}
  assert(await p.locator('#song-screen').isVisible());
  for(const size of [{width:390,height:844},{width:844,height:390}]){
   await p.setViewportSize(size);
   const result=await p.locator('#song-input').evaluate(el=>{const r=el.getBoundingClientRect();return [...el.children].every(c=>{const a=c.getBoundingClientRect();return a.left>=r.left-1&&a.right<=r.right+1&&a.left>=0&&a.right<=innerWidth;});});assert(result,'all notes fit');
  }
  await p.setViewportSize({width:390,height:844});if(round===2)await p.screenshot({path:path.join(__dirname,'age12','song-complete-phone.png')});
  await p.locator('#song-next').tap();
 }
 assert.equal(await p.evaluate(()=>meadowGame.state.mode),'dialogue');console.log('PASS song: every tap shows exactly N notes, all final notes persist, stable buttons, phone/landscape fit');
 await seed(2,{forest:{metOwl:true,round:3,gustStage:6,reunited:true,separated:true,routeKnown:true}});
 await p.evaluate(()=>meadowGame.trials.start('dash'));await p.locator('#action-start').tap();
 // Wrong lane stays safe; early tap queues. A short tap alone crosses to the next shelter.
 await p.locator('#action-run').tap();assert.equal(await p.evaluate(()=>meadowGame.state.forest.dashFails),0);assert.equal(await p.evaluate(()=>meadowGame.trials.queued),false);
 await p.locator('#action-left').tap();await p.locator('#action-run').tap();await p.waitForFunction(()=>meadowGame.trials.dashRunning);
 await p.keyboard.press('Escape');const travel=await p.evaluate(()=>meadowGame.trials.travel);await p.waitForTimeout(200);assert.equal(await p.evaluate(()=>meadowGame.trials.travel),travel);await p.locator('#resume-btn').tap();
 await p.waitForFunction(()=>meadowGame.trials.stage===1);await p.waitForTimeout(200);assert.equal(await p.evaluate(()=>meadowGame.trials.stage),1);assert.equal(await p.locator('#action-meter').getAttribute('max'),'9');assert.equal(await p.evaluate(()=>meadowGame.trials.queued),false);
 await p.locator('#action-leave').tap();await p.evaluate(()=>meadowGame.start(true));assert.equal(await p.evaluate(()=>meadowGame.state.forest.dashLeg),1);console.log('PASS dash: wrong-lane hint, single-tap departure, automatic stop, pause/resume and saved segment');
 await seed(3,{valley:{metBeaver:true,bridge:3}});await p.evaluate(()=>meadowGame.expedition.start('raft'));await p.locator('#journey-start').tap();
 const brakeLabel=await p.locator('#journey-hit span').elementHandle();const rect=await p.locator('#journey-hit span').boundingBox();await p.mouse.move(rect.x+rect.width/2,rect.y+rect.height/2);await p.mouse.down();await p.waitForTimeout(180);await p.mouse.up();assert(await p.evaluate(()=>meadowGame.expedition.braking));assert(await brakeLabel.evaluate(el=>el.isConnected),'brake label replaced during tap');
 await p.evaluate(()=>{const e=meadowGame.expedition;e.raftX=e.gateCenter;e.roundTime=3;});await p.waitForFunction(()=>meadowGame.state.valley.raftGate===1);const raftNotice=await p.locator('#journey-status').textContent();assert(raftNotice.includes('通過'));await p.waitForTimeout(450);assert.equal(await p.locator('#journey-status').textContent(),raftNotice);console.log('PASS raft: brake click survives animation frames, completion feedback remains readable');
 await seed(4,{hill:{metSquirrel:true}});await p.evaluate(()=>meadowGame.expedition.start('star','hope'));await p.locator('#journey-start').tap();await p.locator('#journey-hit').tap();const failure=await p.locator('#journey-status').textContent();assert(failure.includes('先充滿'));await p.waitForTimeout(400);assert.equal(await p.locator('#journey-status').textContent(),failure);
 await p.evaluate(()=>{const e=meadowGame.expedition;e.focus=2.8;e.aligned=e.exposure=true;e.cooldown=0;e.strike();});const success=await p.locator('#journey-status').textContent();assert(success.includes('拍到了'));await p.waitForTimeout(400);assert.equal(await p.locator('#journey-status').textContent(),success);console.log('PASS star: failed/successful exposure feedback persists between frames');
 await seed(4,{hill:{metSquirrel:true,lights:['hope','memory','courage']}});await p.evaluate(()=>{const g=meadowGame;g.state.hill.signal=true;g.state.hill.escort=1;g.expedition.start('escort');g.expedition.begin();g.expedition.update(.01);});assert((await p.locator('#journey-status').textContent()).includes('佯攻'));console.log('PASS escort: urgent feint warning is not hidden by feedback hold');
 await seed(2,{forest:{metOwl:true,round:3,gustStage:6}});await p.locator('#sound-btn').tap();await p.evaluate(()=>meadowGame.story.interact('mother'));await p.waitForFunction(()=>meadowGame.audio.mood==='calm');
 while(await p.locator('#dialogue-name').textContent()!=='灰爪')await p.locator('#dialogue-next').tap();await p.waitForFunction(()=>meadowGame.audio.mood==='tension');assert(await p.evaluate(()=>meadowGame.audio.musicVoices.size>0));
 await p.keyboard.press('Escape');await p.waitForTimeout(100);assert.equal(await p.evaluate(()=>meadowGame.audio.mood),'tension');assert(await p.evaluate(()=>meadowGame.audio.paused));await p.locator('#resume-btn').tap();
 while(await p.evaluate(()=>meadowGame.state.mode==='dialogue'))await p.locator('#dialogue-next').tap();await p.waitForFunction(()=>meadowGame.story.elapsed>3);assert.equal(await p.evaluate(()=>meadowGame.audio.mood),'tension');await p.waitForFunction(()=>meadowGame.state.forest.separated);await p.waitForFunction(()=>meadowGame.audio.mood==='calm');
 await seed(4,{hill:{metSquirrel:true,lights:['hope','memory','courage'],signal:true,escort:3}});await p.waitForFunction(()=>meadowGame.audio.mood==='tension');await p.waitForFunction(()=>meadowGame.story.elapsed>=1.5);await p.waitForFunction(()=>meadowGame.audio.mood==='calm');await p.locator('#sound-btn').tap();assert.equal(await p.evaluate(()=>meadowGame.audio.enabled),false);console.log('PASS audio: calm → villain dialogue/grapple tension → calm; pause; chapter 4 gate resolves tension; mute');
 assert.deepEqual(errors,[]);await browser.close();
})().catch(async e=>{console.error(e);if(browser)await browser.close();process.exit(1);});
