const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=process.env.GAME_BASE||'http://127.0.0.1:4174',out=path.resolve(__dirname,'../.qa/neon-courier');fs.mkdirSync(out,{recursive:true});
let browser;const reports=[];
(async()=>{
 browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'msedge',headless:true});
 for(const [width,height] of [[1440,900],[1024,768],[844,390],[667,375],[568,320]]){
  const context=await browser.newContext({viewport:{width,height},hasTouch:true,isMobile:width<900}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.goto(base+'/neon_courier/');await page.waitForFunction(()=>window.neonGame);
  for(const family of ['human','pikmin']){
   await page.locator(`[data-family=${family}]`).click();const roles=await page.locator('[data-role]:visible').evaluateAll(bs=>bs.map(b=>b.dataset.role));assert.equal(roles.length,3);
   for(const role of roles){
    await page.locator(`[data-role=${role}]`).click();
    assert(await page.evaluate(role=>{const w=neonGame.world;return neonGame.profile.role===role&&w.selectedRole===role&&(role.startsWith('pikmin')?!w.body.visible&&Object.entries(w.pikminForms).filter(([,g])=>g.visible).map(([id])=>id).join()===role:w.body.visible&&!Object.values(w.pikminForms).some(g=>g.visible));},role),'The chosen character is actually rendered');
    if(family==='pikmin'){await page.waitForTimeout(120);await page.screenshot({path:path.join(out,`daylight-${role}-${width}.png`)});}
   }
  }
  assert.deepEqual(await page.evaluate(()=>NC.contracts.map(c=>c.length)),[4800,5400,6000]);
  assert(await page.evaluate(()=>{const w=neonGame.world;return w.renderer.shadowMap.enabled&&w.sun.castShadow&&w.deck.receiveShadow&&w.clouds.count>0&&w.scene.fog.color.getHSL({}).l>.7;}),'Daylight lighting, clouds and real shadows are active');
  const clipped=await page.locator('#cover button:not([hidden]),#cover input').evaluateAll(bs=>bs.filter(b=>{const r=b.getBoundingClientRect();return r.x<0||r.y<0||r.right>innerWidth+1||r.bottom>innerHeight+1;}).map(b=>b.dataset.role||b.id));assert.deepEqual(clipped,[],'All six character choices and launch stay reachable without scrolling');
  await page.reload();await page.waitForFunction(()=>window.neonGame);assert.equal(await page.evaluate(()=>neonGame.profile.role),'pikmin_blue');assert(await page.locator('[data-role=pikmin_blue]').isVisible());
  await page.locator('#launch').click();await page.waitForFunction(()=>neonGame.mode==='running');assert.equal(await page.evaluate(()=>neonGame.run.profile.role),'pikmin_blue');await page.waitForTimeout(200);await page.screenshot({path:path.join(out,`daylight-play-${width}.png`)});
  // Real simulation contact, with isolated traffic so both participants can be checked.
  const before=await page.evaluate(()=>{
   const r=new NC.Run(neonGame.profile,17,{traffic:false});r.phase='running';r.items=[];r.forks=[];r.distance=400;r.speed=r.role.speed;
   const other=new NC.Run(neonGame.profile,17,{traffic:false});other.phase='running';other.items=[];other.forks=[];other.distance=401;other.x=r.worldX()+.8-NC.curve(other.distance);other.speed=r.speed;
   r.couriers=[{run:other,step(){}}];neonGame.run=r;neonGame.world.update(r,0);return {x:r.worldX(),otherX:other.worldX(),speed:r.speed};
  });
  await page.waitForFunction(()=>neonGame.run.contacts>0);await page.keyboard.press('Escape');
  const contact=await page.evaluate(()=>{const r=neonGame.run,o=r.couriers[0].run,w=neonGame.world;return {x:r.worldX(),otherX:o.worldX(),count:r.contacts,otherCount:o.contacts,hits:r.hits,ring:w.contactRing.visible,sparks:w.contactSparks.visible,otherRing:w.courierModels[0].userData.contact.visible,impact:r.impact};});
  assert(contact.x<before.x-.20&&contact.otherX>before.otherX+.20,'Both couriers separate slightly on contact');assert.equal(contact.count,1);assert.equal(contact.otherCount,1);assert.equal(contact.hits,0);assert(contact.ring&&contact.sparks&&contact.otherRing,'Both characters show a visible contact response');
  await page.waitForTimeout(350);assert.equal(await page.evaluate(()=>neonGame.run.impact),contact.impact,'Contact response pauses with the game');await page.keyboard.press('Escape');await page.waitForTimeout(350);assert.equal(await page.evaluate(()=>neonGame.world.contactSparks.visible),false);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth||document.documentElement.scrollHeight>innerHeight),false);assert.deepEqual(errors,[]);
  reports.push({width,height,roles:6,contact});console.log(`PASS ${width}x${height}: six selectable/persistent models, daylight shadows, doubled courses, bounded two-sided contact, pause and no overflow`);await context.close();
 }
 fs.writeFileSync(path.join(out,'daylight-results.json'),JSON.stringify(reports,null,2));await browser.close();
})().catch(async e=>{console.error(e);if(browser)await browser.close();process.exitCode=1;});
