const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path');let browser;
(async()=>{
 browser=await chromium.launch({channel:'msedge',headless:true});
 for(const [width,height,touch] of [[1280,800,false],[390,844,true],[844,390,true]]){
  const p=await browser.newPage({viewport:{width,height},hasTouch:touch,isMobile:touch,reducedMotion:touch?'reduce':'no-preference'}),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto('http://127.0.0.1:4173/find_mom_3d/');await p.waitForFunction(()=>window.meadowGame);
  async function press(id,key){if(touch)await p.locator(id).tap();else await p.keyboard.press(key);}
  async function seed(stage=0){await p.evaluate(stage=>{const g=meadowGame,s=Meadow.Progress.fresh();s.chapter=s.entryChapter=2;s.prologueSeen=true;Object.assign(s.forest,{metOwl:true,round:3,gustStage:6,reunited:true,separated:true,routeKnown:true,dashStage:Math.floor(stage/3),dashLeg:stage%3});g.saved=s;g.start(true);g.trials.start('dash');},stage);}
  async function begin(){await p.locator('#action-start')[touch?'tap':'click']();}
  async function steer(lane){while(await p.evaluate(()=>meadowGame.trials.lane)!==lane){const right=lane>await p.evaluate(()=>meadowGame.trials.lane);await press(right?'#action-right':'#action-left',right?'ArrowRight':'ArrowLeft');}}
  await seed();await p.waitForTimeout(150);assert.equal(await p.evaluate(()=>meadowGame.trials.river.flow),0);await begin();
  const before=await p.evaluate(()=>({stones:meadowGame.trials.river.stones.map(s=>s.mesh.position.z),z:meadowGame.player.mesh.position.z,camera:meadowGame.camera.position.z}));await p.waitForTimeout(300);
  const after=await p.evaluate(()=>({stones:meadowGame.trials.river.stones.map(s=>s.mesh.position.z),z:meadowGame.player.mesh.position.z,camera:meadowGame.camera.position.z}));assert(after.stones.every((z,i)=>z>before.stones[i]));assert(after.z>before.z);assert.equal(after.camera,before.camera);
  await press('#pause-btn','Escape');const frozen=await p.evaluate(()=>meadowGame.trials.river.flow);await p.waitForTimeout(200);assert.equal(await p.evaluate(()=>meadowGame.trials.river.flow),frozen);await p.locator('#resume-btn')[touch?'tap':'click']();
  await p.waitForFunction(()=>meadowGame.state.forest.dashFails===1);assert.equal(await p.evaluate(()=>meadowGame.trials.stage),0);assert(await p.evaluate(()=>meadowGame.trials.river.lastFailure.screen.y< -1),'idle loss must occur below actual viewport');
  for(const [stage,hazard] of [[1,'mushroom'],[2,'bomb']]){
   await seed(stage);assert(await p.evaluate(()=>{const r=meadowGame.trials.river;return Array.from({length:9},(_,i)=>i+1).every(row=>r.stones.some(s=>s.row===row&&!s.hazard));}));await begin();
   const lane=await p.evaluate(({stage,hazard})=>meadowGame.trials.river.stones.find(s=>s.row===stage+1&&s.hazard===hazard).lane,{stage,hazard});await steer(lane);
   await p.screenshot({path:path.join(__dirname,`river-${hazard}-${width}.png`)});await press('#action-run','e');await p.waitForFunction(()=>meadowGame.state.forest.dashFails===1);
   assert.equal(await p.evaluate(()=>meadowGame.trials.stage),stage);assert((await p.locator('#action-status').textContent()).includes(hazard==='bomb'?'炸彈':'毒香菇'));
  }
  await seed();await begin();const until=Date.now()+40000;let pausedInAir=false;
  while(await p.evaluate(()=>meadowGame.trials.active)&&Date.now()<until){
   const q=await p.evaluate(()=>{const t=meadowGame.trials;return {stage:t.stage,jump:!!t.river.jump,lane:t.lane,target:t.river.safeLane(t.stage),ready:t.river.ready(),retry:t.retry};});
   if(q.jump&&!pausedInAir){await press('#pause-btn','Escape');const z=await p.evaluate(()=>meadowGame.player.mesh.position.z);await p.waitForTimeout(150);assert.equal(await p.evaluate(()=>meadowGame.player.mesh.position.z),z);await p.locator('#resume-btn')[touch?'tap':'click']();pausedInAir=true;}
   if(!q.jump&&q.retry<=0){if(q.lane!==q.target)await steer(q.target);else if(q.ready)await press('#action-run','e');}
   await p.waitForTimeout(30);
  }
  assert.equal(await p.evaluate(()=>meadowGame.state.forest.dashStage),3);assert.equal(await p.evaluate(()=>meadowGame.state.forest.dashFails),0);assert(pausedInAir);
  await seed(5);await begin();await p.locator('#action-leave')[touch?'tap':'click']();await p.evaluate(()=>{meadowGame.saved=Meadow.Progress.read();meadowGame.start(true);meadowGame.trials.start('dash');});assert.equal(await p.evaluate(()=>meadowGame.trials.stage),5);assert.equal(await p.evaluate(()=>meadowGame.player.mesh.position.z),6);
  for(const id of ['#action-left','#action-right','#action-run','#wind-meter']){const box=await p.locator(id).boundingBox();assert(box&&box.x>=0&&box.y>=0&&box.x+box.width<=width+1&&box.y+box.height<=height+1);}
  assert.deepEqual(errors,[]);console.log(`PASS ${width}x${height}: all stones/player drift, camera stays fixed, actual offscreen loss, mushroom/bomb failures, safe route, nine jumps, pause and resume checkpoint`);await p.close();
 }
 await browser.close();
})().catch(async e=>{console.error(e);if(browser)await browser.close();process.exit(1);});
