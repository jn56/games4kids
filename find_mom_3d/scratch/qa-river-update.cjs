const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');let browser;
(async()=>{
 browser=await chromium.launch({channel:'msedge',headless:true});const p=await browser.newPage({viewport:{width:1280,height:800}}),errors=[],out=path.join(__dirname,'river-update');fs.mkdirSync(out,{recursive:true});p.on('pageerror',e=>errors.push(e.stack));
 await p.goto('http://127.0.0.1:4173/find_mom_3d/');await p.waitForFunction(()=>window.meadowGame);
 async function seed(chapter,extra={}){await p.evaluate(({chapter,extra})=>{const g=meadowGame,s=Meadow.Progress.fresh();s.entryChapter=s.chapter=chapter;s.prologueSeen=true;for(const [k,v] of Object.entries(extra))Object.assign(s[k],v);g.saved=s;g.start(true);},{chapter,extra});}
 async function talk(){for(let i=0;i<40&&await p.evaluate(()=>meadowGame.state.mode==='dialogue');i++)await p.locator('#dialogue-next').click();}
 await seed(2,{forest:{metOwl:true,round:3,gustStage:2,gustWave:2}});await p.evaluate(()=>meadowGame.trials.start('gust'));await p.locator('#action-start').click();assert(await p.locator('#gust-warning').isVisible());await p.keyboard.press('ArrowLeft');assert.equal(await p.evaluate(()=>meadowGame.trials.lane),2);await p.keyboard.press('ArrowRight');assert.equal(await p.evaluate(()=>meadowGame.trials.lane),1);
 for(const [width,height] of [[1280,800],[390,844],[844,390],[667,375]]){await p.setViewportSize({width,height});await p.evaluate(()=>{const t=meadowGame.trials;t.stage=8;t.elapsed=0;t.retry=0;});await p.screenshot({path:path.join(out,`reverse-${width}.png`)});const box=await p.locator('#gust-warning').boundingBox();assert(box&&box.x>=0&&box.x+box.width<=width&&box.y+box.height<height-90);}
 const speeds=await p.evaluate(()=>{const t=meadowGame.trials;return Array.from({length:18},(_,i)=>{t.stage=i;return t.gustSpeed();});});assert(speeds.every((v,i)=>i===0||v>speeds[i-1]));console.log('PASS incremental speed and prominent reversed arrow mapping');
 await p.setViewportSize({width:1280,height:800});await seed(2,{forest:{metOwl:true,round:3,gustStage:6,reunited:true,separated:true,routeKnown:true}});await p.evaluate(()=>meadowGame.trials.start('dash'));await p.locator('#action-start').click();assert.equal(await p.locator('#action-title').textContent(),'河上跳石頭');
 // Selecting a destination must leave the girl standing on her current stone.
 const start=await p.evaluate(()=>({x:meadowGame.player.mesh.position.x,z:meadowGame.player.mesh.position.z}));await p.keyboard.press('ArrowLeft');assert.equal(await p.evaluate(()=>meadowGame.player.mesh.position.x),start.x);
 await p.keyboard.press('e');await p.waitForFunction(()=>meadowGame.player.mesh.position.y>1);await p.keyboard.press('Escape');const air=await p.evaluate(()=>meadowGame.player.mesh.position.y);await p.waitForTimeout(120);assert.equal(await p.evaluate(()=>meadowGame.player.mesh.position.y),air);await p.locator('#resume-btn').click();await p.screenshot({path:path.join(out,'jump-air.png')});await p.waitForFunction(()=>meadowGame.trials.stage===1);
 assert.equal(await p.evaluate(()=>meadowGame.state.forest.dashLeg),1);
 // Wrong landing is rescued and preserves the completed stone.
 await p.keyboard.press('e');await p.waitForFunction(()=>meadowGame.state.forest.dashFails===1);assert.equal(await p.evaluate(()=>meadowGame.trials.stage),1);await p.waitForFunction(()=>meadowGame.trials.retry<=0);
 await p.locator('#action-leave').click();await p.evaluate(()=>{const g=meadowGame;g.saved=Meadow.Progress.read();g.start(true);g.trials.start('dash');});await p.locator('#action-start').click();assert.equal(await p.evaluate(()=>meadowGame.trials.stage),1);
 const until=Date.now()+50000;while(await p.evaluate(()=>meadowGame.trials.active)&&Date.now()<until){const q=await p.evaluate(()=>{const t=meadowGame.trials;return {lane:t.lane,target:t.river.safeLane(t.stage),jump:!!t.river.jump,ready:t.river.ready(),retry:t.retry};});if(!q.jump&&q.retry<=0){if(q.lane!==q.target)await p.keyboard.press(q.target>q.lane?'ArrowRight':'ArrowLeft');else if(q.ready)await p.keyboard.press('e');}await p.waitForTimeout(40);}assert.equal(await p.evaluate(()=>meadowGame.state.forest.dashStage),3);await talk();console.log('PASS 9 river jumps, visible arc, stationary selection, pause, rescue and saved progress');
 await seed(2,{forest:{metOwl:true,round:3,gustStage:6,reunited:true}});await p.waitForFunction(()=>document.getElementById('story-caption').textContent.includes('小米，快逃啊'));assert(await p.evaluate(()=>meadowGame.story.elapsed>=6.8));await p.screenshot({path:path.join(out,'mother-shout.png')});
 await seed(3,{valley:{metBeaver:true}});await p.evaluate(()=>meadowGame.expedition.start('bridge'));await p.locator('#journey-start').click();
 for(const [width,height] of [[1280,800],[390,844],[844,390],[320,568],[667,375]]){
  await p.setViewportSize({width,height});
  for(let i=0;i<9;i++){
   await p.evaluate(i=>{const g=meadowGame;g.state.valley.bridge=Math.floor(i/3);g.state.valley.nails=i%3;g.expedition.paint();},i);
   const q=await p.locator('#bridge-question').boundingBox(),bar=await p.locator('#bridge-timing').boundingBox(),hit=await p.locator('#journey-hit').boundingBox();
   assert(Math.abs(q.x+q.width/2-width/2)<3);assert(q.y>=height*.22&&q.y+q.height<=height*.73);assert(q.y+q.height<bar.y);assert(q.x>=0&&q.x+q.width<=width);assert(bar.y+bar.height<=hit.y);
  }
  await p.screenshot({path:path.join(out,`bridge-${width}.png`)});
 }
 await p.evaluate(()=>{meadowGame.state.valley.bridge=0;meadowGame.state.valley.nails=0;meadowGame.expedition.paint();});
 await p.setViewportSize({width:1280,height:800});
 for(let i=0;i<9;i++){assert((await p.locator('#bridge-question-count').textContent()).includes(String(i+1)));await p.waitForFunction(()=>{const e=meadowGame.expedition;return e.cooldown===0&&Math.abs(e.needle-e.bridgeSettings().center)<.025;});await p.keyboard.press('e');}assert.equal(await p.evaluate(()=>meadowGame.state.valley.bridge),3);assert.equal(await p.locator('#bridge-question').isVisible(),false);console.log('PASS mother line after splash; centered bridge question in five viewports and all nine nails');
 assert.deepEqual(errors,[]);await browser.close();
})().catch(async e=>{console.error(e);if(browser)await browser.close();process.exit(1);});
