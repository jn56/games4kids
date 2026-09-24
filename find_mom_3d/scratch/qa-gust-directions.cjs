const {chromium}=require('playwright'),assert=require('node:assert/strict');let browser;
(async()=>{
 browser=await chromium.launch({channel:'msedge',headless:true});
 for(const touch of [false,true]){
  const p=await browser.newPage({viewport:{width:touch?390:1280,height:touch?844:800},isMobile:touch,hasTouch:touch}),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto('http://127.0.0.1:4173/find_mom_3d/');await p.waitForFunction(()=>window.meadowGame);
  await p.evaluate(()=>{const g=meadowGame,s=Meadow.Progress.fresh();s.chapter=s.entryChapter=2;s.prologueSeen=true;s.forest.metOwl=true;s.forest.round=3;g.saved=s;g.start(true);g.trials.start('gust');});
  if(touch)await p.locator('#action-start').tap();else await p.locator('#action-start').click();
  for(let stage=0;stage<18;stage++){
   await p.evaluate(stage=>{const t=meadowGame.trials;t.stage=stage;t.lane=1;t.elapsed=0;t.retry=0;},stage);
   const reverse=[8,14,17].includes(stage);
   for(const [direction,normalLane] of [[-1,0],[-1,0],[1,1],[1,2],[1,2],[-1,1]]){
    if(touch)await p.locator(direction<0?'#action-left':'#action-right').tap();else await p.keyboard.press(direction<0?'ArrowLeft':'ArrowRight');
    assert.equal(await p.evaluate(()=>meadowGame.trials.lane),reverse?2-normalLane:normalLane,`wave ${stage+1}, direction ${direction}`);
   }
   if(!touch){await p.keyboard.press('a');assert.equal(await p.evaluate(()=>meadowGame.trials.lane),reverse?2:0);await p.keyboard.press('d');assert.equal(await p.evaluate(()=>meadowGame.trials.lane),1);}
   if(reverse){assert(await p.locator('#gust-warning').isVisible());assert((await p.locator('#action-left small').textContent()).includes('往右'));}
  }
  console.log(`PASS ${touch?'touch':'arrows and A/D'}: all 18 waves map directions correctly, with visible reversed controls`);
  if(!touch){
   await p.evaluate(()=>{const t=meadowGame.trials;t.stage=0;t.elapsed=0;t.lane=1;meadowGame.state.forest.gustStage=0;meadowGame.state.forest.gustWave=0;});
   const patterns=[[0],[2],[1],[0,1],[1,2],[0,2],[1,2],[0,1],[0,2],[0,1],[0,2],[1,2],[0,2],[1,2],[0,1],[1,2],[0,1],[0,2]],end=Date.now()+75000;
   while(await p.evaluate(()=>meadowGame.trials.active)&&Date.now()<end){const q=await p.evaluate(()=>({stage:meadowGame.trials.stage,lane:meadowGame.trials.lane})),safe=[0,1,2].find(i=>!patterns[q.stage].includes(i));if(q.lane!==safe)await p.keyboard.press((safe>q.lane)!==[8,14,17].includes(q.stage)?'ArrowRight':'ArrowLeft');await p.waitForTimeout(35);}
   assert.equal(await p.evaluate(()=>meadowGame.state.forest.gustStage),6);assert.equal(await p.evaluate(()=>meadowGame.state.forest.gustFails),0);console.log('PASS full 18-wave accelerating run including reversed waves without failures');
  }
  assert.deepEqual(errors,[]);await p.close();
 }
 await browser.close();
})().catch(async e=>{console.error(e);if(browser)await browser.close();process.exit(1);});
