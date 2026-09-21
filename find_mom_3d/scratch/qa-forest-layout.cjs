const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const path=require('node:path');
let browser;
(async()=>{
  browser=await chromium.launch({channel:'msedge',headless:true});
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'}),page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4173/find_mom_3d/');await page.waitForFunction(()=>window.meadowGame);
  await page.evaluate(()=>{
    const s=Meadow.Progress.fresh();Object.assign(s,{chapter:2,ribbon:true,metRabbit:true,metHedgehog:true,windSolved:true,windTurns:[1,1,2,1,1,3,0,1,1],flowers:['sun','heart','star'],arrangement:['ribbon','sun','heart','star'],lit:true,completed:true,checkpoint:{x:0,z:4.1}});
    Object.assign(s.forest,{metOwl:true,round:2,assists:[0,0,3]});Meadow.Progress.write(s);
  });
  await page.reload();await page.waitForFunction(()=>window.meadowGame);await page.locator('#start-btn').tap();
  await page.screenshot({path:path.join(__dirname,'forest-mobile.png')});await page.locator('#touch-action').tap();
  for(const [width,height,name] of [[390,844,'mobile'],[844,390,'landscape']]){
    await page.setViewportSize({width,height});await page.locator('#song-close').scrollIntoViewIfNeeded();
    await page.screenshot({path:path.join(__dirname,'song-'+name+'.png')});
    const pane=await page.locator('.song-paper').evaluate(e=>({scroll:e.scrollWidth,client:e.clientWidth}));assert(pane.scroll<=pane.client);
    for(const selector of ['#song-replay','#song-hint','#song-bells']){const r=await page.locator(selector).boundingBox();assert(r.y>=0&&r.y+r.height<=height,`${name}: ${selector} in view`)}
    await page.locator('#song-replay').tap();await page.waitForFunction(()=>!meadowGame.song.demo&&meadowGame.song.ready);
    await page.locator('[data-note="star"]').tap();assert.deepEqual(await page.evaluate(()=>meadowGame.state.forest.input),['star']);
    await page.locator('#song-replay').tap();await page.waitForFunction(()=>!meadowGame.song.demo&&meadowGame.song.ready);
    assert.deepEqual(await page.evaluate(()=>meadowGame.state.forest.input),[]);
    console.log(`PASS ${name}: visible score, controls, touch notes and replay while muted`);
  }
  for(const id of ['star','leaf','star','leaf','drop'])await page.locator(`[data-note="${id}"]`).tap();
  assert.equal(await page.evaluate(()=>meadowGame.state.forest.round),3);
  while(await page.evaluate(()=>meadowGame.state.mode==='dialogue'))await page.locator('#dialogue-next').tap();
  assert.equal(await page.locator('#song-screen').isVisible(),false);
  await page.locator('#action-leave').tap();
  await page.evaluate(()=>{meadowGame.state.forest.gustStage=6;meadowGame.state.forest.reunited=true;meadowGame.checkpoint(2,-3.35)});
  await page.reload();await page.waitForFunction(()=>window.meadowGame);await page.locator('#start-btn').tap();
  await page.setViewportSize({width:390,height:844});await page.waitForFunction(()=>meadowGame.story.elapsed>5.2);
  await page.screenshot({path:path.join(__dirname,'forest-bridge-mobile.png')});
  const positions=await page.evaluate(()=>{
    const check=obj=>{const p=obj.position.clone().project(meadowGame.camera);return Math.abs(p.x)<1&&Math.abs(p.y)<1};
    return {child:check(meadowGame.player.mesh),mother:check(meadowGame.world.mother.mesh)};
  });assert.deepEqual(positions,{child:true,mother:true});
  console.log('PASS Touch completes the reverse melody; both characters remain visible during the mobile bridge scene');
  assert.deepEqual(errors,[]);await browser.close();
})().catch(async e=>{console.error(e);if(browser)await browser.close();process.exitCode=1});
