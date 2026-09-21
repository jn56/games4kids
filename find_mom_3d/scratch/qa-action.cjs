const {chromium}=require('playwright');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
let browser;const checks=[];const pass=s=>{checks.push(s);console.log('PASS '+s)};
(async()=>{
 browser=await chromium.launch({channel:'msedge',headless:true});const context=await browser.newContext({viewport:{width:1440,height:900}}),page=await context.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));const base='http://127.0.0.1:4173/find_mom_3d/';
 const state=()=>page.evaluate(()=>JSON.parse(JSON.stringify(meadowGame.state)));
 const dialogue=async()=>{for(let i=0;i<40&&(await state()).mode==='dialogue';i++)await page.locator('#dialogue-next').click()};
 const shot=name=>page.screenshot({path:path.join(__dirname,name+'.png')});
 await page.goto(base);await page.waitForFunction(()=>window.meadowGame);await page.locator('#start-btn').click();
 assert.equal(await page.evaluate(()=>meadowGame.prologue.active),true);await shot('prologue-picnic');await dialogue();assert.equal((await state()).mode,'cutscene');
 await page.waitForTimeout(1000);await page.keyboard.press('Escape');const before=await page.evaluate(()=>meadowGame.prologue.elapsed);await page.waitForTimeout(350);assert.equal(await page.evaluate(()=>meadowGame.prologue.elapsed),before);await page.locator('#resume-btn').click();
 await page.waitForFunction(()=>meadowGame.prologue.elapsed>3);await shot('prologue-mist');await page.waitForFunction(()=>meadowGame.state.mode==='dialogue');await dialogue();
 assert.equal((await state()).mode,'playing');assert.equal((await state()).prologueSeen,true);assert.equal(await page.evaluate(()=>meadowGame.prologue.root.visible),false);
 await page.reload();await page.waitForFunction(()=>window.meadowGame);await page.locator('#start-btn').click();assert.equal(await page.evaluate(()=>meadowGame.prologue.active),false);
 await page.keyboard.press('Escape');await page.locator('#restart-btn').click();assert.equal(await page.locator('#prologue-skip').isVisible(),true);await page.locator('#prologue-skip').click();await dialogue();assert.equal((await state()).prologueSeen,true);
 pass('Picnic prologue animates, pauses, saves completion, and can be skipped on replay');
 // Begin from a valid completed melody to exercise all new story gates and both action games.
 await page.evaluate(()=>{const s=Meadow.Progress.fresh();Object.assign(s,{prologueSeen:true,chapter:2,ribbon:true,metRabbit:true,metHedgehog:true,windSolved:true,windTurns:[1,1,2,1,1,3,0,1,1],flowers:['sun','heart','star'],arrangement:['ribbon','sun','heart','star'],lit:true,completed:true,checkpoint:{x:0,z:4.1}});Object.assign(s.forest,{metOwl:true,round:3});Meadow.Progress.write(s)});
 await page.reload();await page.waitForFunction(()=>window.meadowGame);await page.locator('#start-btn').click();
 assert.equal(await page.evaluate(()=>meadowGame.world.canWalk(2,-2.8)),false);
 await page.keyboard.press('e');assert.equal((await state()).mode,'action');await shot('gust-ready');await page.locator('#action-start').click();
 await page.keyboard.press('ArrowLeft');await page.waitForTimeout(400);await page.keyboard.press('Escape');const frozen=await page.evaluate(()=>meadowGame.trials.elapsed);await page.waitForTimeout(350);assert.equal(await page.evaluate(()=>meadowGame.trials.elapsed),frozen);await page.locator('#resume-btn').click();
 await page.waitForFunction(()=>meadowGame.state.forest.gustFails===1);assert.equal((await state()).forest.round,3);
 for(let n=2;n<=3;n++){await page.waitForFunction(()=>meadowGame.trials.retry<=0);await page.keyboard.press('ArrowLeft');await page.waitForFunction(n=>meadowGame.state.forest.gustFails===n,n)}
 pass('Gust collision returns to safety, preserves melody, pauses correctly, and enables assistance after three misses');
 const patterns=[[0],[2],[1],[0,1],[1,2],[0,2]];
 async function survive(until){
  while(await page.evaluate(until=>meadowGame.trials.active&&meadowGame.trials.stage<until,until)){
   const info=await page.evaluate(()=>({stage:meadowGame.trials.stage,lane:meadowGame.trials.lane}));
   const safe=[0,1,2].find(i=>!patterns[info.stage].includes(i));
   for(let n=0;n<Math.abs(safe-info.lane);n++)await page.keyboard.press(safe>info.lane?'ArrowRight':'ArrowLeft');
   await page.waitForFunction(stage=>meadowGame.trials.stage>stage,info.stage,{timeout:12000});
  }
 }
 await page.waitForFunction(()=>meadowGame.trials.retry<=0);await shot('gust-running');await survive(3);
 assert.equal((await state()).forest.gustStage,3);await page.locator('#action-leave').click();assert.equal((await state()).mode,'playing');
 await page.reload();await page.waitForFunction(()=>window.meadowGame);await page.locator('#start-btn').click();assert.equal((await state()).forest.gustStage,3);
 await page.keyboard.press('e');await page.locator('#action-start').click();await survive(6);await dialogue();
 assert.equal((await state()).forest.gustStage,6);assert.equal(await page.evaluate(()=>meadowGame.world.canWalk(2,-2.8)),true);
 pass('Keyboard dodges all six waves; halfway checkpoint survives exit and reload; gate opens only on success');
 await page.keyboard.press('e');await dialogue();assert.equal((await state()).mode,'cutscene');await page.waitForFunction(()=>meadowGame.state.mode==='dialogue');await dialogue();
 await page.keyboard.down('d');await page.waitForTimeout(400);await page.keyboard.up('d');await page.keyboard.press('e');await dialogue();
 assert.equal((await state()).forest.routeKnown,true);assert.equal((await state()).mode,'action');assert.equal(await page.evaluate(()=>meadowGame.trials.kind),'dash');
 await shot('dash-ready');await page.locator('#action-start').click();await page.keyboard.down('Space');await page.waitForFunction(()=>meadowGame.state.forest.dashFails===1);await page.keyboard.up('Space');
 assert.equal((await state()).forest.dashStage,0);await page.waitForFunction(()=>meadowGame.trials.retry<=0);
 async function sprint(){
  const stage=(await state()).forest.dashStage;
  await page.waitForFunction(()=>meadowGame.trials.phase>1.21&&meadowGame.trials.phase<1.45);
  await page.keyboard.down('Space');await page.waitForFunction(stage=>meadowGame.state.forest.dashStage>stage,stage);await page.keyboard.up('Space');
 }
 await sprint();assert.equal((await state()).forest.dashStage,1);await page.locator('#action-leave').click();await page.reload();await page.waitForFunction(()=>window.meadowGame);await page.locator('#start-btn').click();
 assert.equal((await state()).forest.dashStage,1);await page.keyboard.press('e');await page.locator('#action-start').click();
 await page.waitForFunction(()=>meadowGame.trials.phase>1.25);await page.keyboard.down('Space');await page.waitForTimeout(350);await page.keyboard.press('Escape');const distance=await page.evaluate(()=>meadowGame.trials.travel);await page.waitForTimeout(300);assert.equal(await page.evaluate(()=>meadowGame.trials.travel),distance);await page.keyboard.up('Space');await page.locator('#resume-btn').click();
 // Resume requires a new press; a held key cannot accidentally send the child into wind.
 await page.keyboard.down('Space');await page.waitForFunction(()=>meadowGame.state.forest.dashStage===2);await page.keyboard.up('Space');await shot('dash-running');await sprint();await dialogue();
 assert.equal((await state()).forest.dashStage,3);await page.keyboard.press('e');await dialogue();assert.equal((await state()).forest.completed,true);
 pass('Reunion leads to sprint challenge; gust punishes bad timing, shelters save, pause releases input, and both games gate the ending');
 // Responsive action controls and touch sprinting from the final shelter.
 const phone=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});phone.on('pageerror',e=>errors.push(e.message));await phone.goto(base);await phone.waitForFunction(()=>window.meadowGame);
 const saved=await page.evaluate(()=>Meadow.Progress.read());saved.forest.completed=false;saved.forest.dashStage=2;saved.checkpoint={x:4,z:-3.7};
 await phone.evaluate(s=>Meadow.Progress.write(s),saved);await phone.reload();await phone.waitForFunction(()=>window.meadowGame);await phone.locator('#start-btn').tap();await phone.locator('#touch-action').tap();await phone.locator('#action-start').tap();
 for(const [width,height,label] of [[390,844,'phone'],[844,390,'landscape']]){await phone.setViewportSize({width,height});const r=await phone.locator('#action-run').boundingBox();assert(r.x>=0&&r.y+r.height<=height);await phone.screenshot({path:path.join(__dirname,'dash-'+label+'.png')});}
 await phone.waitForFunction(()=>meadowGame.trials.phase>1.21&&meadowGame.trials.phase<1.4);
 const run=await phone.locator('#action-run').boundingBox(),cdp=await phone.context().newCDPSession(phone);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:run.x+run.width/2,y:run.y+run.height/2,id:1}]});await phone.waitForFunction(()=>meadowGame.state.forest.dashStage===3);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 pass('Portrait and landscape action controls fit; pointer hold completes sprint with reduced motion');
 const gustSave=JSON.parse(JSON.stringify(saved));Object.assign(gustSave.forest,{gustStage:3,gustFails:0,dashStage:0,reunited:false,separated:false,routeKnown:false,completed:false});gustSave.checkpoint={x:0,z:4.1};
 await phone.evaluate(s=>Meadow.Progress.write(s),gustSave);await phone.reload();await phone.waitForFunction(()=>window.meadowGame);await phone.setViewportSize({width:390,height:844});await phone.locator('#start-btn').tap();await phone.locator('#touch-action').tap();await phone.locator('#action-start').tap();await phone.locator('#action-right').tap();
 await phone.waitForFunction(()=>meadowGame.trials.elapsed>2);await phone.screenshot({path:path.join(__dirname,'gust-phone.png')});
 await phone.waitForFunction(()=>meadowGame.trials.stage===4);await phone.locator('#action-left').tap();await phone.locator('#action-left').tap();
 await phone.waitForFunction(()=>meadowGame.trials.stage===5);await phone.locator('#action-right').tap();await phone.waitForFunction(()=>meadowGame.state.forest.gustStage===6);
 assert.equal(await phone.evaluate(()=>meadowGame.state.forest.gustFails),0);pass('Touch dodges the three hardest double-lane waves at normal speed');
 const legacy=await page.evaluate(()=>{const s=Meadow.Progress.read();s.version=3;delete s.forest.gustStage;delete s.forest.dashStage;Meadow.Progress.write(s);return Meadow.Progress.read()});assert.equal(legacy.forest.completed,true);assert.equal(legacy.forest.gustStage,6);assert.equal(legacy.forest.dashStage,3);
 assert.deepEqual(errors,[]);pass('Completed old saves migrate safely; no browser errors');
 fs.writeFileSync(path.join(__dirname,'qa-action-results.json'),JSON.stringify({date:new Date().toISOString(),checks,errors},null,2));await browser.close();
})().catch(async e=>{console.error(e);if(browser)await browser.close();process.exitCode=1});
