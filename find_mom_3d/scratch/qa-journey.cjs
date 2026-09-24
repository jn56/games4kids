const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const path=require('node:path');
const artifacts=process.env.QA_ARTIFACT_DIR||__dirname;require('node:fs').mkdirSync(artifacts,{recursive:true});
let browser;
(async()=>{
  browser=await chromium.launch({channel:'msedge',headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const state=()=>page.evaluate(()=>JSON.parse(JSON.stringify(meadowGame.state)));
  const pos=()=>page.evaluate(()=>({x:meadowGame.player.mesh.position.x,z:meadowGame.player.mesh.position.z}));
  const shot=name=>page.screenshot({path:path.join(artifacts,name+'.png')});
  async function dialogue(){for(let i=0;i<40&&(await state()).mode==='dialogue';i++)await page.locator('#dialogue-next').click();}
  async function move(x,z){
    for(let i=0;i<65;i++){
      const p=await pos(),dx=x-p.x,dz=z-p.z;if(Math.hypot(dx,dz)<.2)return;
      const horizontal=Math.abs(dx)>Math.abs(dz),difference=horizontal?dx:dz,key=horizontal?(difference>0?'d':'a'):(difference>0?'s':'w');
      await page.keyboard.down(key);await page.waitForTimeout(Math.min(400,Math.max(25,Math.abs(difference)/4.5*1000)));await page.keyboard.up(key);
    }throw Error('Stuck '+JSON.stringify({target:{x,z},position:await pos()}));
  }
  async function interact(id){await page.waitForFunction(id=>meadowGame.interactions.current?.id===id,id,{timeout:4000});await page.keyboard.press('e');await dialogue();}
  async function reload(){await page.reload();await page.waitForFunction(()=>window.meadowGame);await page.locator('#start-btn').click();}
  await page.goto('http://127.0.0.1:4173/find_mom_3d/');await page.waitForFunction(()=>window.meadowGame);
  await page.evaluate(()=>{
    const s=Meadow.Progress.fresh();Object.assign(s,{version:4,chapter:2,prologueSeen:true,ribbon:true,metRabbit:true,metHedgehog:true,windSolved:true,windTurns:[1,1,2,1,1,3,0,1,1],flowers:['sun','heart','star'],arrangement:['ribbon','sun','heart','star'],lit:true,completed:true});
    Object.assign(s.forest,{metOwl:true,round:3,gustStage:6,dashStage:3,reunited:true,separated:true,routeKnown:true,completed:true});Meadow.Progress.write(s);
  });
  await reload();assert.equal((await state()).version,5);assert.equal((await state()).mode,'complete');
  await page.locator('#next-chapter-btn').click();await dialogue();assert.equal((await state()).chapter,3);
  assert.equal(await page.evaluate(()=>meadowGame.world.canWalk(0,2)),false);
  await move(-2.5,8);await interact('beaver');assert.equal((await state()).valley.metBeaver,true);
  await move(0,4.4);await interact('bench');await page.locator('#journey-start').click();
  await page.keyboard.press('Escape');const elapsed=await page.evaluate(()=>meadowGame.expedition.elapsed);await page.waitForTimeout(250);assert.equal(await page.evaluate(()=>meadowGame.expedition.elapsed),elapsed);await page.locator('#resume-btn').click();
  for(let i=0;i<3;i++){
    await page.waitForFunction(()=>{const e=meadowGame.expedition,b=e.bridgeSettings();return e.cooldown===0&&Math.abs(e.needle-b.center)>b.width/2+.08;});await page.keyboard.press('Space');
  }
  assert.equal((await state()).valley.hammerFails,3);await shot('bridge-desktop');
  await page.waitForFunction(()=>{const e=meadowGame.expedition;return e.cooldown===0&&Math.abs(e.needle-e.bridgeSettings().center)<.05;});await page.keyboard.press('Space');assert.equal((await state()).valley.bridge,1);
  await page.locator('#journey-leave').click();await reload();assert.equal((await state()).valley.bridge,1);
  await move(0,4.4);await interact('bench');await page.locator('#journey-start').click();
  while((await state()).valley.bridge<3){await page.waitForFunction(()=>{const e=meadowGame.expedition;return e.cooldown===0&&Math.abs(e.needle-e.bridgeSettings().center)<.06;});await page.keyboard.press('Space');}
  await dialogue();await move(0,4);await move(0,-5.2);await interact('dock');assert.equal((await state()).mode,'journey');await page.locator('#journey-start').click();
  await page.waitForFunction(()=>meadowGame.state.valley.raftFails===1);assert.equal((await state()).valley.raft,0);
  await shot('raft-desktop');
  const deadline=Date.now()+60000;let held=null;
  while((await state()).valley.raft<4&&Date.now()<deadline){
    const q=await page.evaluate(()=>({x:meadowGame.expedition.raftX,target:meadowGame.expedition.gateCenter}));const key=Math.abs(q.target-q.x)<.12?null:q.target>q.x?'ArrowRight':'ArrowLeft';
    if(key!==held){if(held)await page.keyboard.up(held);if(key)await page.keyboard.down(key);held=key;}await page.waitForTimeout(40);
  }
  if(held)await page.keyboard.up(held);await dialogue();assert.equal((await state()).valley.raft,4);await shot('valley-complete-world');
  await move(0,-13.4);await interact('exit');assert.equal((await state()).mode,'complete');
  console.log('PASS chapter 3: keyboard exploration, gated bridge, timing failures/assist, pause, reload, four raft gates, exit');
  await page.locator('#next-chapter-btn').click();await dialogue();assert.equal((await state()).chapter,4);
  await move(-1,8.8);await interact('squirrel');assert.equal((await state()).hill.metSquirrel,true);
  for(const b of [{id:'hope',x:-7,z:4.2},{id:'memory',x:6,z:.2},{id:'courage',x:-3,z:-5.8}]){
    await move(b.x,b.z);await interact(b.id);await page.locator('#journey-start').click();
    if(b.id==='hope'){await page.keyboard.press('Escape');const frozen=await page.evaluate(()=>meadowGame.expedition.elapsed);await page.waitForTimeout(200);assert.equal(await page.evaluate(()=>meadowGame.expedition.elapsed),frozen);await page.locator('#resume-btn').click();await shot('star-desktop');}
    held=null;const until=Date.now()+25000;
    while(await page.evaluate(()=>meadowGame.expedition.active)&&Date.now()<until){
      const q=await page.evaluate(()=>({aim:meadowGame.expedition.aim,target:meadowGame.expedition.target}));const key=Math.abs(q.aim-q.target)<.025?null:q.target>q.aim?'ArrowRight':'ArrowLeft';
      if(key!==held){if(held)await page.keyboard.up(held);if(key)await page.keyboard.down(key);held=key;}await page.waitForTimeout(40);
    }
    if(held)await page.keyboard.up(held);await dialogue();assert.equal((await state()).hill.lights.includes(b.id),true);
    if(b.id==='hope'){await reload();assert.deepEqual((await state()).hill.lights,['hope']);}
  }
  await move(0,-7.7);await interact('signal');assert.equal((await state()).mode,'cutscene');await reload();assert.equal((await state()).mode,'cutscene');
  await page.waitForFunction(()=>meadowGame.state.mode==='dialogue');await dialogue();assert.equal(await page.evaluate(()=>meadowGame.expedition.kind),'escort');await page.locator('#journey-start').click();
  held=null;const escortDeadline=Date.now()+45000;
  while(await page.evaluate(()=>meadowGame.expedition.active)&&Date.now()<escortDeadline){
    const q=await page.evaluate(()=>({x:meadowGame.expedition.escortX,target:meadowGame.expedition.gateCenter})),next=Math.abs(q.x-q.target)<.1?null:q.target>q.x?'ArrowRight':'ArrowLeft';
    if(next!==held){if(held)await page.keyboard.up(held);if(next)await page.keyboard.down(next);held=next;}await page.waitForTimeout(40);
  }
  if(held)await page.keyboard.up(held);assert.equal((await state()).hill.escort,3);
  await page.waitForFunction(()=>meadowGame.world.hug);await shot('reunion-hill');await page.waitForFunction(()=>meadowGame.state.mode==='dialogue');await dialogue();assert.equal((await state()).hill.reunited,true);
  await move(3,-5);await move(3,8.5);await move(7,8.5);await interact('home');await page.waitForFunction(()=>meadowGame.state.mode==='complete');await shot('ending-four-lights');
  assert.equal((await state()).hill.completed,true);assert.equal(await page.locator('#next-chapter-btn').isVisible(),false);await reload();assert.equal((await state()).mode,'complete');
  await page.locator('#replay-btn').click();await dialogue();assert.equal((await state()).chapter,4);assert.equal((await state()).valley.completed,true);assert.equal((await state()).hill.metSquirrel,false);
  assert.deepEqual(errors,[]);console.log('PASS chapter 4: three moving-star trials, persistence, reunion replay, hug, mother follows, walk home, ending, replay');
  await browser.close();
})().catch(async e=>{console.error(e);if(browser)await browser.close();process.exit(1);});
