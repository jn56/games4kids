const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=process.env.GAME_BASE||'http://127.0.0.1:4174',out=path.resolve(__dirname,'../.qa/neon-courier');fs.mkdirSync(out,{recursive:true});
let browser;const errors=[];
async function open(context){const p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));await p.goto(base+'/neon_courier/');await p.waitForFunction(()=>window.neonGame?.display);return p;}
async function frozen(p){
 const state=()=>p.evaluate(()=>{const r=neonGame.run;return [r.distance,r.remaining,r.countdown,...r.couriers.map(c=>c.run.distance)];});
 const before=await state();await p.waitForTimeout(350);assert.deepEqual(await state(),before,'Portrait freezes player, clock, countdown and all five couriers');
}
(async()=>{
 browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'msedge',headless:true});
 for(const [width,height] of [[320,568],[390,844],[430,932],[768,1024]]){
  const context=await browser.newContext({viewport:{width,height},hasTouch:true,isMobile:true}),p=await open(context);
  assert(await p.locator('#rotate-screen').isVisible());assert(await p.locator('#cover').evaluate(el=>el.inert));
  await p.keyboard.press('Space');await p.evaluate(()=>neonGame.launch());assert.equal(await p.evaluate(()=>neonGame.run),null,'Portrait cannot launch through keyboard or game API');
  await p.screenshot({path:path.join(out,`rotate-${width}.png`)});
  await p.setViewportSize({width:height,height:width});await p.waitForFunction(()=>!neonGame.display.blocked);
  await p.locator('#launch').click();await p.setViewportSize({width,height});await p.waitForFunction(()=>neonGame.display.blocked);
  assert.equal(await p.evaluate(()=>neonGame.mode),'paused');await frozen(p);await p.evaluate(()=>neonGame.resume());assert.equal(await p.evaluate(()=>neonGame.mode),'paused');
  await p.setViewportSize({width:height,height:width});await p.waitForFunction(()=>!neonGame.display.blocked);assert.equal(await p.evaluate(()=>neonGame.mode),'paused');
  await p.locator('#resume').click();await p.waitForFunction(()=>neonGame.mode==='running');
  const pad=await p.locator('#joystick').boundingBox();await p.mouse.move(pad.x+pad.width*.75,pad.y+pad.height*.5);await p.mouse.down();assert.equal(await p.evaluate(()=>neonGame.input.steer),1);
  await p.setViewportSize({width,height});await p.waitForFunction(()=>neonGame.display.blocked);await p.mouse.up();
  assert.deepEqual(await p.evaluate(()=>[neonGame.input.steer,neonGame.run.vx,neonGame.stick.pointer]),[0,0,null]);await frozen(p);
  await p.setViewportSize({width:height,height:width});await p.waitForFunction(()=>!neonGame.display.blocked);await p.locator('#resume').click();
  const boxes=await p.locator('#joystick,#touch-controls button').evaluateAll(els=>els.map(el=>{const r=el.getBoundingClientRect();return {left:r.left,right:innerWidth-r.right,bottom:innerHeight-r.bottom,top:r.top,w:r.width,h:r.height};}));
  for(const b of boxes){assert(b.left>=55&&b.right>=55&&b.bottom>=55&&b.top>=0,JSON.stringify(b));assert(b.w>=44&&b.h>=44);}
  assert.equal(await p.evaluate(()=>document.documentElement.scrollHeight>innerHeight||document.documentElement.scrollWidth>innerWidth),false);
  assert(await p.evaluate(()=>{const w=neonGame.world;return w.materials.road.map&&w.materials.road.bumpMap&&w.deckGeometry.attributes.uv.count===w.deckGeometry.attributes.position.count&&w.roofCaps.count===90;}));
  await p.keyboard.press('Escape');await p.screenshot({path:path.join(out,`racing-paused-${height}.png`)});await p.locator('#resume').click();await p.waitForTimeout(250);await p.screenshot({path:path.join(out,`racing-run-${height}.png`)});
  console.log(`PASS ${width}x${height}: portrait gate, countdown/race/traffic freeze, explicit resume, cleared input, landscape controls inset >= 56px, asphalt UVs and no overflow`);await context.close();
 }
 // A narrow desktop window still works; use real browser fullscreen, not a simulated flag.
 const desktop=await browser.newContext({viewport:{width:1100,height:740}}),p=await open(desktop);
 await p.locator('#fullscreen').click();await p.waitForFunction(()=>!!document.fullscreenElement);assert.equal(await p.locator('#fullscreen').getAttribute('aria-pressed'),'true');
 await p.locator('#fullscreen').click();await p.waitForFunction(()=>!document.fullscreenElement);assert.equal(await p.locator('#fullscreen').getAttribute('aria-pressed'),'false');
 await p.setViewportSize({width:390,height:844});await p.waitForTimeout(100);assert.equal(await p.locator('#rotate-screen').isVisible(),false);await p.locator('#launch').click();await p.waitForFunction(()=>neonGame.mode==='running');await desktop.close();console.log('PASS real fullscreen enter/exit and narrow desktop play');
 for(const fallback of ['unavailable','rejected','orientation-rejected']){
  const ctx=await browser.newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true});
  await ctx.addInitScript(fallback=>{
   if(fallback==='unavailable'){Element.prototype.requestFullscreen=undefined;Element.prototype.webkitRequestFullscreen=undefined;}
   else if(fallback==='rejected')Element.prototype.requestFullscreen=()=>Promise.reject(new DOMException('Denied','NotAllowedError'));
   else screen.orientation.lock=()=>Promise.reject(new DOMException('Unsupported','NotSupportedError'));
  },fallback);
  const p=await open(ctx);await p.locator('#fullscreen').click();
  if(fallback!=='orientation-rejected'){await p.waitForFunction(()=>!document.getElementById('display-status').hidden);assert.equal(await p.locator('#fullscreen').getAttribute('aria-pressed'),'false');}
  else{await p.waitForFunction(()=>!!document.fullscreenElement&&!neonGame.display.busy);await p.locator('#fullscreen').click();await p.waitForFunction(()=>!document.fullscreenElement);}
  await p.locator('#launch').click();await p.waitForFunction(()=>neonGame.mode==='running');await p.setViewportSize({width:390,height:844});await p.waitForFunction(()=>neonGame.display.blocked);await frozen(p);await ctx.close();console.log(`PASS ${fallback}: playable fallback and enforced portrait pause`);
 }
 assert.deepEqual(errors,[]);await browser.close();
})().catch(async e=>{console.error(e);await browser?.close();process.exitCode=1;});
