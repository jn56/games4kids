const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path');let browser;
(async()=>{
 browser=await chromium.launch({channel:'msedge',headless:true});
 for(const touch of [false,true]){
  const p=await browser.newPage({viewport:touch?{width:390,height:844}:{width:1280,height:800},hasTouch:touch,isMobile:touch,reducedMotion:touch?'reduce':'no-preference'}),errors=[];
  p.on('pageerror',e=>errors.push(e.message));await p.goto('http://127.0.0.1:4173/find_mom_3d/');await p.waitForFunction(()=>window.meadowGame);
  async function press(id,key){if(touch)await p.locator(id).tap();else await p.keyboard.press(key);}
  async function seed(stage=0){await p.evaluate(stage=>{const g=meadowGame,s=Meadow.Progress.fresh();s.chapter=s.entryChapter=2;s.prologueSeen=true;Object.assign(s.forest,{round:3,metOwl:true,gustStage:6,reunited:true,separated:true,routeKnown:true,dashStage:Math.floor(stage/3),dashLeg:stage%3});g.saved=s;g.start(true);g.trials.start('dash');},stage);}
  async function begin(){await p.locator('#action-start')[touch?'tap':'click']();}
  await seed(3);await p.waitForTimeout(500);assert.equal(await p.evaluate(()=>meadowGame.trials.river.elapsed),0,'ready screen must not count down');
  await begin();await press('#pause-btn','Escape');const frozen=await p.evaluate(()=>meadowGame.trials.river.elapsed);await p.waitForTimeout(300);assert.equal(await p.evaluate(()=>meadowGame.trials.river.elapsed),frozen);await p.locator('#resume-btn')[touch?'tap':'click']();
  await p.waitForFunction(()=>meadowGame.trials.panel.dataset.urgent==='true');assert(await p.evaluate(()=>meadowGame.trials.river.stone(3,1).mesh.position.y<0));
  await p.screenshot({path:path.join(__dirname,touch?'river-reaction-phone.png':'river-reaction-desktop.png')});
  await p.waitForFunction(()=>meadowGame.state.forest.dashFails===1);assert.equal(await p.evaluate(()=>meadowGame.trials.stage),3);const retry=await p.evaluate(()=>meadowGame.trials.river.elapsed);await p.waitForTimeout(200);assert.equal(await p.evaluate(()=>meadowGame.trials.river.elapsed),retry,'rescue must not consume the next attempt');
  await p.locator('#action-leave')[touch?'tap':'click']();await p.evaluate(()=>{meadowGame.saved=Meadow.Progress.read();meadowGame.start(true);meadowGame.trials.start('dash');});assert.equal(await p.evaluate(()=>meadowGame.trials.stage),3);assert.equal(await p.evaluate(()=>meadowGame.trials.river.elapsed),0);
  // React to all nine stones using actual controls, including two lane changes.
  await seed();await begin();const end=Date.now()+30000;
  while(await p.evaluate(()=>meadowGame.trials.active)&&Date.now()<end){
   const q=await p.evaluate(()=>{const t=meadowGame.trials;return {jump:!!t.river.jump,lane:t.lane,safe:t.river.safeLane(t.stage),ready:t.river.ready()};});
   if(!q.jump){if(q.lane!==q.safe)await press(q.safe>q.lane?'#action-right':'#action-left',q.safe>q.lane?'ArrowRight':'ArrowLeft');else if(q.ready)await press('#action-run','e');}
   await p.waitForTimeout(25);
  }
  assert.equal(await p.evaluate(()=>meadowGame.state.forest.dashStage),3);assert.equal(await p.evaluate(()=>meadowGame.state.forest.dashFails),0);
  // Late-stage warnings and all controls fit both phone orientations.
  for(const size of [{width:390,height:844},{width:844,height:390}]){
   await p.setViewportSize(size);await seed(8);await begin();await p.waitForFunction(()=>meadowGame.trials.river.ready());await press('#pause-btn','Escape');
   for(const id of ['#action-left','#action-right','#action-run','#wind-meter']){const r=await p.locator(id).boundingBox();assert(r&&r.x>=0&&r.y>=0&&r.x+r.width<=size.width+1&&r.y+r.height<=size.height+1);}
  }
  const limits=await p.evaluate(()=>{const t=meadowGame.trials,r=t.river;t.stage=0;const first=[r.limit(),r.jumpDuration()];t.stage=8;const last=[r.limit(),r.jumpDuration()];meadowGame.state.forest.dashFails=6;return {first,last,assisted:r.limit()};});assert(limits.last[0]<limits.first[0]&&limits.last[1]<limits.first[1]);assert(limits.assisted>limits.last[0]);
  assert.deepEqual(errors,[]);console.log(`PASS ${touch?'touch/reduced motion':'keyboard'}: deadline rescue, sinking stone, pause/ready/retry freeze, save resume, all nine jumps without failure, progressive speed and assistance`);await p.close();
 }
 await browser.close();
})().catch(async e=>{console.error(e);if(browser)await browser.close();process.exit(1);});
