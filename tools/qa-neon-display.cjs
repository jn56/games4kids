const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=process.env.GAME_BASE||'http://127.0.0.1:4174',out=path.resolve(__dirname,'../.qa/neon-courier');fs.mkdirSync(out,{recursive:true});
let browser;const errors=[];
async function open(context){const p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));await p.goto(base+'/neon_courier/');await p.waitForFunction(()=>window.neonGame?.display);return p;}
async function fit(p){assert(await p.evaluate(()=>{const c=document.querySelector('#world');return c.clientWidth>=c.clientHeight&&Math.abs(neonGame.world.camera.aspect-c.clientWidth/c.clientHeight)<.01&&document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight;}),'Landscape canvas, correct camera aspect and no page scroll');}
(async()=>{
 browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'msedge',headless:true});
 for(const [width,height] of [[320,568],[390,844],[430,932],[844,390],[568,320]]){
  const context=await browser.newContext({viewport:{width,height},hasTouch:true,isMobile:true}),p=await open(context),rotated=height>width;
  await fit(p);assert.equal(await p.evaluate(()=>neonGame.display.rotated),rotated);assert.equal(await p.locator('#rotate-screen').count(),0);assert(await p.locator('#fullscreen').isVisible());assert(await p.locator('#home').isVisible());
  await p.screenshot({path:path.join(out,`stage-cover-${width}x${height}.png`)});
  await p.locator('#launch').click();await p.waitForFunction(()=>neonGame.mode==='running');
  await p.evaluate(()=>{const r=neonGame.run;r.items=[];r.couriers=[];r.forks=[];r.distance=0;r.x=0;r.speed=r.role.speed;r.energy=r.capacity;});
  const pad=await p.locator('#joystick').boundingBox(),cx=pad.x+pad.width/2,cy=pad.y+pad.height/2;
  await p.mouse.move(cx,cy);await p.mouse.down();
  for(const [dx,dy,want] of [[.3,0,1],[-.3,0,-1],[0,.3,0],[0,-.3,0]]){await p.mouse.move(cx+pad.width*(rotated?-dy:dx),cy+pad.height*(rotated?dx:dy));assert.equal(await p.evaluate(()=>neonGame.input.steer),want,'Rotated stick follows visual left/right only');}
  await p.mouse.up();assert.equal(await p.evaluate(()=>neonGame.stick.pointer),null);
  const boost=p.locator('[data-action=boost]');await p.waitForFunction(()=>document.querySelector('[data-action=boost]').classList.contains('ready'));
  const rects=await p.locator('#joystick,#touch-controls button').evaluateAll(els=>els.map(el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,right:innerWidth-r.right,bottom:innerHeight-r.bottom,w:r.width,h:r.height};}));
  for(const r of rects){assert(Math.min(r.x,r.y,r.right,r.bottom)>=55,JSON.stringify(r));}
  for(const r of rects.slice(1))assert(Math.min(r.w,r.h)>=64,'Larger jump/boost targets');
  assert(await boost.evaluate(e=>{const s=getComputedStyle(e),fx=getComputedStyle(e,'::after');return Number(s.opacity)<1&&Number(s.opacity)>.8&&fx.animationName==='boost-ready';}));
  assert(await p.locator('#toast').evaluate(el=>{const s=getComputedStyle(el),h=document.querySelector('#game-stage').clientHeight;return parseFloat(s.top)<h*.3&&Number(s.opacity)>.8&&Number(s.opacity)<1;}),'Central hint is higher and slightly transparent');
  await p.screenshot({path:path.join(out,`stage-ready-${width}x${height}.png`)});
  if(rotated){
   const cdp=await context.newCDPSession(p),b=await boost.boundingBox(),finger=(id,x,y)=>({id,x,y,radiusX:4,radiusY:4,force:1}),thumb=finger(1,cx,cy+pad.height*.25),boostFinger=finger(2,b.x+b.width/2,b.y+b.height/2);
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[finger(1,cx,cy)]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[thumb]});
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[thumb,boostFinger]});assert(await p.evaluate(()=>neonGame.input.steer===1&&neonGame.run.autoBoost),'Rotated native multi-touch steers and boosts together');await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert.equal(await p.evaluate(()=>neonGame.input.steer),0);
  }else await boost.tap();await p.waitForFunction(()=>neonGame.run.boosting&&!document.querySelector('[data-action=boost]').classList.contains('ready'));assert.equal(await boost.getAttribute('aria-pressed'),'true');
  await p.locator('[data-action=jump]').tap();await p.waitForFunction(()=>neonGame.run.y>0);
  await p.evaluate(()=>neonGame.run.energy=.01);await p.waitForFunction(()=>!neonGame.run.autoBoost);assert.equal(await boost.evaluate(e=>e.classList.contains('ready')),false);
  await p.evaluate(()=>neonGame.run.energy=neonGame.run.capacity);await p.waitForFunction(()=>document.querySelector('[data-action=boost]').classList.contains('ready'));
  await p.setViewportSize({width:height,height:width});await p.waitForTimeout(150);await fit(p);assert.equal(await p.evaluate(()=>neonGame.mode),'paused');
  const before=await p.evaluate(()=>[neonGame.run.distance,neonGame.run.remaining]);await p.waitForTimeout(200);assert.deepEqual(await p.evaluate(()=>[neonGame.run.distance,neonGame.run.remaining]),before);await p.locator('#resume').click();await p.waitForFunction(()=>neonGame.mode==='running');
  await p.locator('#home').click();await p.waitForURL('**/index.html');assert.equal(await p.locator('.game-card').count(),19);await p.locator('#game-search').fill('霓光');await p.locator('.game-art').click();await p.waitForFunction(()=>window.neonGame?.display);await fit(p);await context.close();console.log(`PASS ${width}x${height}: direct landscape entry, visual-axis stick, large translucent buttons, ready/depletion/refill effect, rotate/pause/resume, homepage round trip`);
 }
 const desktop=await browser.newContext({viewport:{width:1100,height:740}}),p=await open(desktop);
 await p.locator('#fullscreen').click();await p.waitForFunction(()=>!!document.fullscreenElement);assert.equal(await p.locator('#fullscreen').getAttribute('aria-pressed'),'true');await p.locator('#fullscreen').click();await p.waitForFunction(()=>!document.fullscreenElement);assert.equal(await p.locator('#fullscreen').getAttribute('aria-pressed'),'false');await desktop.close();console.log('PASS native fullscreen enter/exit');
 for(const fallback of ['unavailable','rejected','orientation-rejected']){
  const ctx=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,reducedMotion:'reduce'});
  await ctx.addInitScript(fallback=>{if(fallback==='unavailable'){Element.prototype.requestFullscreen=undefined;Element.prototype.webkitRequestFullscreen=undefined;}else if(fallback==='rejected')Element.prototype.requestFullscreen=()=>Promise.reject(new DOMException('Denied','NotAllowedError'));else screen.orientation.lock=()=>Promise.reject(new DOMException('Unsupported','NotSupportedError'));},fallback);
  const p=await open(ctx);await p.locator('#fullscreen').click();
  if(fallback!=='orientation-rejected')await p.waitForFunction(()=>!document.getElementById('display-status').hidden);else{await p.waitForFunction(()=>!!document.fullscreenElement&&!neonGame.display.busy);await p.locator('#fullscreen').click();await p.waitForFunction(()=>!document.fullscreenElement);}
  await p.locator('#launch').click();await p.waitForFunction(()=>neonGame.mode==='running');await fit(p);await p.evaluate(()=>neonGame.run.energy=neonGame.run.capacity);await p.waitForFunction(()=>document.querySelector('[data-action=boost]').classList.contains('ready'));assert.equal(await p.locator('[data-action=boost]').evaluate(e=>getComputedStyle(e,'::after').animationName),'none');await ctx.close();console.log(`PASS ${fallback}: direct landscape remains playable, reduced-motion ready effect is static`);
 }
 assert.deepEqual(errors,[]);await browser.close();
})().catch(async e=>{console.error(e);await browser?.close();process.exitCode=1;});
