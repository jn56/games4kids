/* UI acceptance: actual wheel/pointer input, mobile control clearance, navigation
   from collapsed menus and independent V1/V2 home cards. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=process.env.BASE_URL||'http://127.0.0.1:4174';
const out=path.resolve(__dirname,'../.qa/find-mom-v2/interface');
fs.mkdirSync(out,{recursive:true});
const results=[],errors=[];let browser;
function pass(name){results.push(name);console.log('PASS '+name);}
async function load(page){
  await page.goto(base+'/find_mom_3d_v2/');await page.waitForFunction(()=>window.meadowGame);
  await page.evaluate(()=>{const g=meadowGame,s=Meadow.Progress.fresh();s.prologueSeen=true;g.saved=s;g.start(true);g.living.enabled=false;});
  await page.waitForTimeout(180);
}
async function fixedScene(page){
  const q=await page.evaluate(()=>({h:innerHeight,w:innerWidth,scrollH:document.documentElement.scrollHeight,scrollW:document.documentElement.scrollWidth,bodyH:document.body.scrollHeight,bodyW:document.body.scrollWidth,x:scrollX,y:scrollY,canvas:{w:meadowGame.renderer.domElement.clientWidth,h:meadowGame.renderer.domElement.clientHeight}}));
  assert(q.scrollH<=q.h&&q.scrollW<=q.w&&q.bodyH<=q.h&&q.bodyW<=q.w,JSON.stringify(q));
  assert.equal(q.x,0);assert.equal(q.y,0);assert.equal(q.canvas.w,q.w);assert.equal(q.canvas.h,q.h);
}
async function keyTo(page,selector){for(let i=0;i<70;i++){if(await page.evaluate(s=>document.activeElement?.matches(s),selector))return;await page.keyboard.press('ArrowRight');}throw Error('Keyboard cannot reach '+selector);}
async function menu(page,width,height){
  await page.locator('#pause-btn').click();await page.waitForTimeout(80);
  assert(await page.locator('#pause-settings').isHidden());assert.equal(await page.locator('#game-info').evaluate(el=>el.open),false);
  const compact=await page.locator('#pause-screen .paper-modal').evaluate(el=>({h:el.clientHeight,scroll:el.scrollHeight,overflow:getComputedStyle(el).overflowY,box:el.getBoundingClientRect().toJSON()}));
  assert(compact.scroll<=compact.h+1,'Closed menu content clipped: '+JSON.stringify(compact));assert.equal(compact.overflow,'hidden');assert(compact.box.y>=0&&compact.box.bottom<=height);
  await page.mouse.move(compact.box.x+20,compact.box.y+20);await page.mouse.wheel(0,420);await page.waitForTimeout(100);await fixedScene(page);
  await page.screenshot({path:path.join(out,`pause-${width}x${height}.png`)});
  await page.locator('#pause-info').click();assert(await page.locator('#game-info').evaluate(el=>el.open));assert.equal(await page.evaluate(()=>meadowGame.state.mode),'paused');
  await page.screenshot({path:path.join(out,`info-${width}x${height}.png`)});
  const info=await page.locator('#game-info').boundingBox();await page.mouse.move(info.x+info.width/2,info.y+info.height/2);await page.mouse.wheel(0,600);await page.waitForTimeout(160);
  const scrolled=await page.locator('#game-info').evaluate(el=>({top:el.scrollTop,h:el.clientHeight,all:el.scrollHeight}));if(scrolled.all>scrolled.h)assert(scrolled.top>0,'Opened information should scroll');
  await page.locator('#info-close').click();assert.equal(await page.locator('#game-info').evaluate(el=>el.open),false);
  await page.locator('#pause-more').click();assert(await page.locator('#pause-settings').isVisible());assert.equal(await page.locator('#pause-more').getAttribute('aria-expanded'),'true');
  const expanded=await page.locator('#pause-screen .paper-modal').evaluate(el=>({h:el.clientHeight,all:el.scrollHeight,overflow:getComputedStyle(el).overflowY}));assert.equal(expanded.overflow,'auto');
  await keyTo(page,'#pause-characters');await page.keyboard.press('Space');assert(await page.locator('#character-studio').evaluate(el=>el.open));await page.keyboard.press('Escape');
  await keyTo(page,'#pause-more');await page.keyboard.press('Space');assert(await page.locator('#pause-settings').isHidden());assert.equal(await page.locator('#pause-screen .paper-modal').evaluate(el=>el.scrollTop),0);
  await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>meadowGame.state.mode),'playing');await fixedScene(page);
  // Reopening starts compact even after the previous visit was expanded.
  await page.keyboard.press('Escape');await keyTo(page,'#pause-more');await page.keyboard.press('Space');await page.keyboard.press('Escape');await page.keyboard.press('Escape');assert(await page.locator('#pause-settings').isHidden());await page.keyboard.press('Escape');
}
(async()=>{
  browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'msedge',headless:true});
  for(const [width,height] of [[1440,900],[390,844],[320,568],[844,390],[667,375],[568,320]]){
    const mobile=width!==1440,context=await browser.newContext({viewport:{width,height},isMobile:mobile,hasTouch:mobile,deviceScaleFactor:mobile?3:1});const page=await context.newPage();
    page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push('HTTP '+r.status()+' '+r.url());});await load(page);await fixedScene(page);
    await page.mouse.wheel(0,800);await page.waitForTimeout(120);await fixedScene(page);
    const map=await page.locator('#minimap').boundingBox(),canvas=await page.locator('#minimap-canvas').boundingBox();assert(map.height<=canvas.height+54,'Map has redundant rows or padding');
    assert.equal(await page.locator('#minimap button').count(),1);assert(await page.locator('#route-strip').isHidden());assert(await page.locator('#orchard-hud').isHidden());
    // Check the projection fills the oval's bounding box with under 4% padding.
    const extent=await page.evaluate(()=>{const m=meadowGame.minimap;return {left:m.point(-CONFIG.MAP_RADIUS_X,-1).x,right:m.canvas.width-m.point(CONFIG.MAP_RADIUS_X,-1).x,top:m.point(0,-1-CONFIG.MAP_RADIUS_Z).y,bottom:m.canvas.height-m.point(0,-1+CONFIG.MAP_RADIUS_Z).y};});assert(Object.values(extent).every(n=>n>=0&&n<=12));
    if(mobile){
      const joystick=await page.locator('#joystick').boundingBox(),action=await page.locator('#touch-action').boundingBox();
      assert(joystick.x>=48&&width-action.x-action.width>=48);assert(height-joystick.y-joystick.height>=48&&height-action.y-action.height>=48);assert(joystick.x+joystick.width+20<=action.x,'Thumb controls overlap');
      // A real drag still moves the player after the control positions change.
      const start=await page.evaluate(()=>meadowGame.player.mesh.position.z);await page.mouse.move(joystick.x+54,joystick.y+54);await page.mouse.down();await page.mouse.move(joystick.x+54,joystick.y+17);await page.waitForTimeout(220);await page.mouse.up();assert(await page.evaluate(z=>meadowGame.player.mesh.position.z<z,start));
      await page.evaluate(()=>{meadowGame.living.enabled=true;meadowGame.living.start('mosquito');});await page.locator('#touch-action').tap();await page.locator('#touch-action').tap();assert.equal(await page.evaluate(()=>meadowGame.living.event),null);await page.evaluate(()=>meadowGame.living.enabled=false);
    }
    await page.screenshot({path:path.join(out,`play-${width}x${height}.png`)});await menu(page,width,height);
    // Riding adds two contextual actions. They must fit the compact menu even
    // in a short landscape viewport and remain operable with the primary keys.
    await page.evaluate(()=>{const g=meadowGame,item=g.world.playground.scooter;g.player.setPosition(item.position.x,item.position.z);g.sandbox.act({item});});await page.keyboard.press('Escape');
    assert(await page.locator('#pause-drop').isVisible());assert(await page.locator('#pause-bell').isVisible());
    const riding=await page.locator('#pause-screen .paper-modal').evaluate(el=>({h:el.clientHeight,all:el.scrollHeight}));assert(riding.all<=riding.h+1,'Contextual menu is clipped: '+JSON.stringify(riding));
    await keyTo(page,'#pause-drop');await page.keyboard.press('Space');assert.equal(await page.evaluate(()=>meadowGame.sandbox.riding),null);assert.equal(await page.evaluate(()=>meadowGame.state.mode),'playing');
    pass(`${width}x${height}: compact map, no scene scroll, comfortable controls, explicit info/settings expansion and keyboard access`);
    if(width===390){await page.setViewportSize({width:844,height:390});await page.waitForTimeout(200);await fixedScene(page);assert.equal(await page.evaluate(()=>meadowGame.state.mode),'playing');pass('Phone rotation preserves play and scene dimensions');}
    await context.close();
  }
  const page=await browser.newPage();await page.goto(base+'/');const links=await page.locator('.game-card').evaluateAll(all=>all.map(card=>card.querySelector('a').getAttribute('href')));
  assert.equal(links.filter(s=>s==='find_mom_3d/index.html'||s==='find_mom_3d/').length,1);assert.equal(links.filter(s=>s==='find_mom_3d_v2/index.html'||s==='find_mom_3d_v2/').length,1);
  for(const game of ['find_mom_3d','find_mom_3d_v2'])assert.equal((await page.request.get(base+'/'+game+'/')).status(),200);pass('Home retains separate working V1 and V2 cards');
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({passed:results,errors},null,2));await browser.close();
})().catch(async e=>{console.error(e);fs.writeFileSync(path.join(out,'failed.json'),JSON.stringify({passed:results,error:e.stack,errors},null,2));if(browser)await browser.close();process.exit(1);});
