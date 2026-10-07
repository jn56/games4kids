const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=process.env.GAME_BASE||'http://127.0.0.1:4174',out=path.resolve(__dirname,'../.qa/neon-courier');fs.mkdirSync(out,{recursive:true});
let browser;const errors=[],passes=[];
const pass=s=>{passes.push(s);console.log('PASS '+s);};
async function open(ctx){const p=await ctx.newPage();p.on('pageerror',e=>errors.push(e.message));await p.goto(base+'/neon_courier/');await p.waitForFunction(()=>window.neonGame);await p.locator('#launch').click();await p.waitForFunction(()=>neonGame.mode==='running');return p;}
(async()=>{
 browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'msedge',headless:true});
 for(const [width,height] of [[390,844],[844,390]]){
  const ctx=await browser.newContext({viewport:{width,height},hasTouch:true,isMobile:true}),p=await open(ctx);
  let pad=await p.locator('#joystick').boundingBox(),cx=pad.x+pad.width/2,cy=pad.y+pad.height/2;
  await p.mouse.move(cx+pad.width*.30,cy);await p.mouse.down();const pointer=await p.evaluate(()=>neonGame.stick.pointer);assert.notEqual(pointer,null);
  await p.setViewportSize({width,height:height-24});await p.waitForTimeout(120);assert.equal(await p.evaluate(()=>neonGame.stick.pointer),pointer);assert.equal(await p.evaluate(()=>neonGame.input.steer),1);
  await p.mouse.up();await p.setViewportSize({width,height});await p.waitForTimeout(200);
  pad=await p.locator('#joystick').boundingBox();cx=pad.x+pad.width/2;cy=pad.y+pad.height/2;
  await p.mouse.move(cx,cy);await p.mouse.down();
  for(const [dx,expected] of [[.02,0],[.04,1],[.02,1],[0,0],[-.02,0],[-.04,-1],[-.02,-1],[0,0]]){
   await p.mouse.move(cx+pad.width*dx,cy-pad.width*.32);assert.equal(await p.evaluate(()=>neonGame.input.steer),expected,'Vertical-axis hysteresis filters thumb jitter');
  }
  await p.mouse.up();
  // Controlled route position, then native pointer input drives the crossing.
  await p.evaluate(()=>{const r=neonGame.run,f=r.forks[0];r.items=[];r.couriers=[];r.distance=f.start+5;r.x=-3;r.vx=0;r.speed=r.role.speed;r.autoBoost=false;f.choice=null;});
  await p.mouse.move(cx+pad.width*.30,cy);await p.mouse.down();await p.waitForTimeout(550);
  assert(await p.evaluate(()=>neonGame.run.x>1&&neonGame.run.forks[0].choice===null),'Joined fork remains crossable after entry');assert((await p.locator('#fork-title').textContent()).includes('選路'));
  await p.waitForFunction(()=>neonGame.run.forks[0].choice!==null);assert.equal(await p.evaluate(()=>neonGame.run.forks[0].choice),1);await p.mouse.up();pass(`${width}x${height}: height-only resize preserves capture, stick hysteresis, late fork change with native pointer input`);
  // Drive into the actual inner wall; feedback must come from simulation contact.
  await p.evaluate(()=>{const r=neonGame.run,f=r.forks[0];r.distance=(f.start+f.end)/2;r.x=-NC.moveLimit;r.vx=0;r.impactCooldown=0;r.contacts=0;r.chain=5;neonGame.world.update(r,0);});
  await p.keyboard.down('ArrowLeft');await p.waitForFunction(()=>neonGame.world.contactRing.visible);await p.keyboard.up('ArrowLeft');
  assert(await p.evaluate(()=>neonGame.run.contacts===1&&neonGame.run.hits===0&&neonGame.run.chain===5));assert(await p.evaluate(()=>{const w=neonGame.world,v=w.pilot.position.clone().project(w.camera);return Math.abs(v.x)<.9&&Math.abs(v.y)<.9;}));await p.screenshot({path:path.join(out,`contact-${width}.png`)});await p.waitForTimeout(350);assert.equal(await p.evaluate(()=>neonGame.world.contactRing.visible),false);
  await p.evaluate(()=>{const r=neonGame.run;r.distance=0;r.x=0;r.vx=0;r.impactCooldown=0;r.contacts=0;r.couriers=new NC.Run(neonGame.profile,17).couriers;const c=r.couriers[0].run;c.distance=1;c.x=.5;c.speed=r.speed;neonGame.world.update(r,0);});
  await p.waitForFunction(()=>neonGame.run.contacts>0);assert(await p.evaluate(()=>neonGame.run.couriers[0].run.contacts>0&&neonGame.run.hits===0));
  // Exhaust uses real one-tap boost; no injected visual state.
  await p.evaluate(()=>{const r=neonGame.run;r.forks=[];r.items=[];r.couriers=[];r.x=0;r.vx=0;r.distance=100;r.energy=r.capacity;r.autoBoost=false;neonGame.radioTime=0;neonGame.toastTime=0;});
  await p.locator('[data-action="boost"]').tap();await p.waitForFunction(()=>neonGame.world.nitro.visible&&neonGame.world.nitroMist.visible);await p.waitForTimeout(350);await p.screenshot({path:path.join(out,`nitro-${width}.png`)});
  const memory=await p.evaluate(()=>neonGame.world.renderer.info.memory.geometries);await p.waitForTimeout(600);assert.equal(await p.evaluate(()=>neonGame.world.renderer.info.memory.geometries),memory,'Exhaust reuses geometry');
  await p.keyboard.press('Escape');await p.waitForTimeout(80);assert.equal(await p.evaluate(()=>neonGame.world.nitro.visible),false);const energy=await p.evaluate(()=>neonGame.run.energy);await p.waitForTimeout(180);assert.equal(await p.evaluate(()=>neonGame.run.energy),energy);
  await p.keyboard.press('Escape');await p.waitForFunction(()=>neonGame.world.nitro.visible);await p.evaluate(()=>neonGame.run.energy=.01);await p.waitForFunction(()=>!neonGame.world.nitro.visible);assert.equal(await p.evaluate(()=>neonGame.world.nitroMist.visible),false);
  await p.mouse.move(cx+pad.width*.3,cy);await p.mouse.down();await p.setViewportSize({width:height,height:width});await p.waitForTimeout(150);assert.equal(await p.evaluate(()=>neonGame.stick.pointer),null);assert.equal(await p.evaluate(()=>neonGame.input.steer),0);await p.mouse.up();
  assert.equal(await p.evaluate(()=>document.documentElement.scrollHeight>innerHeight||document.documentElement.scrollWidth>innerWidth),false);
  pass(`${width}x${height}: gentle inner-wall feedback, pooled nitro exhaust, pause/resume/depletion, rotation reset and no page scroll`);await ctx.close();
 }
 const ctx=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'}),p=await open(ctx);
 await p.keyboard.down('ArrowUp');await p.waitForFunction(()=>neonGame.world.nitro.visible);assert(await p.evaluate(()=>neonGame.world.reduced&&!neonGame.world.nitroMist.visible&&neonGame.world.jets.every(j=>j.scale.z===.7)));await p.keyboard.up('ArrowUp');
 pass('Reduced-motion preference keeps short steady exhaust and suppresses moving mist');await ctx.close();
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'handling-results.json'),JSON.stringify({passes,errors,date:new Date().toISOString()},null,2));await browser.close();
})().catch(async e=>{console.error(e);if(browser)await browser.close();process.exitCode=1;});
