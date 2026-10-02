const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path');let browser;
(async()=>{
 browser=await chromium.launch({channel:'msedge',headless:true});const p=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('http://127.0.0.1:4173/find_mom_3d/');await p.waitForFunction(()=>window.meadowGame);
 await p.evaluate(()=>{const g=meadowGame,s=Meadow.Progress.fresh();s.prologueSeen=true;s.ribbon=true;g.saved=s;g.start(true);g.saveProgress();});const saved=await p.evaluate(()=>localStorage.getItem(CONFIG.SAVE_KEY));
 await p.locator('#fullscreen-btn').click();await p.waitForFunction(()=>!!document.fullscreenElement&&document.getElementById('fullscreen-btn').getAttribute('aria-pressed')==='true');assert.equal(await p.locator('#fullscreen-btn').getAttribute('aria-label'),'離開全螢幕');
 assert(await p.evaluate(()=>{const size=meadowGame.renderer.getSize(new THREE.Vector2());return size.x===innerWidth&&size.y===innerHeight;}));
 await p.locator('#fullscreen-btn').click();await p.waitForFunction(()=>!document.fullscreenElement);assert.equal(await p.locator('#fullscreen-btn').getAttribute('aria-pressed'),'false');
 await p.locator('#fullscreen-btn').click();await p.waitForFunction(()=>!!document.fullscreenElement);await p.keyboard.press('Escape');await p.waitForFunction(()=>!document.fullscreenElement);assert.equal(await p.evaluate(()=>meadowGame.state.mode),'playing');
 await p.keyboard.press('Escape');assert.equal(await p.evaluate(()=>meadowGame.state.mode),'paused');await p.locator('#resume-btn').click();assert.equal(await p.evaluate(()=>localStorage.getItem(CONFIG.SAVE_KEY)),saved);
 // A browser-originated exit also updates the icon and clears any held movement.
 await p.locator('#fullscreen-btn').click();await p.waitForFunction(()=>!!document.fullscreenElement);await p.evaluate(()=>{meadowGame.input.keys.add('ArrowUp');return document.exitFullscreen();});await p.waitForFunction(()=>document.getElementById('fullscreen-btn').getAttribute('aria-pressed')==='false');assert.equal(await p.evaluate(()=>meadowGame.input.keys.size),0);
 await p.evaluate(()=>{window.realFullscreen=document.documentElement.requestFullscreen;document.documentElement.requestFullscreen=()=>Promise.reject(new Error('denied'));});await p.locator('#fullscreen-btn').click();await p.waitForFunction(()=>!meadowGame.fullscreen.busy);assert.equal(await p.locator('#fullscreen-btn').isEnabled(),true);assert.equal(await p.locator('#fullscreen-btn').getAttribute('aria-pressed'),'false');assert.match(await p.locator('#toast').textContent(),/無法切換/);
 await p.evaluate(()=>{document.documentElement.requestFullscreen=undefined;document.documentElement.webkitRequestFullscreen=undefined;});await p.locator('#fullscreen-btn').click();assert.match(await p.locator('#toast').textContent(),/不支援/);await p.evaluate(()=>document.documentElement.requestFullscreen=realFullscreen);
 console.log('PASS real fullscreen entry/exit, Escape then pause, external exit, renderer sizing, save preservation, rejected/unsupported requests');
 const touch=await browser.newPage({hasTouch:true,isMobile:true,viewport:{width:390,height:844}});touch.on('pageerror',e=>errors.push(e.message));await touch.goto('http://127.0.0.1:4173/find_mom_3d/');await touch.waitForFunction(()=>window.meadowGame);await touch.evaluate(()=>{const g=meadowGame,s=Meadow.Progress.fresh();s.prologueSeen=true;g.saved=s;g.start(true);});
 for(const viewport of [{width:390,height:844},{width:844,height:390},{width:320,height:568},{width:568,height:320},{width:1024,height:768}]){
  await touch.setViewportSize(viewport);await touch.waitForTimeout(150);
  const boxes=await touch.evaluate(()=>Object.fromEntries(['joystick','touch-action','minimap','fullscreen-btn','sound-btn','pause-btn','brand'].map(id=>{const el=id==='brand'?document.querySelector('.brand'):document.getElementById(id),r=el.getBoundingClientRect();return [id,{x:r.x,y:r.y,w:r.width,h:r.height}];})));
  for(const [id,r] of Object.entries(boxes))assert(r.w>0&&r.x>=0&&r.y>=0&&r.x+r.w<=viewport.width+1&&r.y+r.h<=viewport.height+1,id+JSON.stringify(r));
  assert(boxes.joystick.x>=36&&viewport.height-boxes.joystick.y-boxes.joystick.h>=47.9);assert(viewport.width-boxes['touch-action'].x-boxes['touch-action'].w>=36&&viewport.height-boxes['touch-action'].y-boxes['touch-action'].h>=59.9);
  const overlaps=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
  for(const [a,b] of [['joystick','touch-action'],['touch-action','minimap'],['brand','fullscreen-btn'],['fullscreen-btn','sound-btn'],['sound-btn','pause-btn']])assert(!overlaps(boxes[a],boxes[b]),a+' overlaps '+b+JSON.stringify(boxes));
  await touch.screenshot({path:path.join(__dirname,`controls-${viewport.width}.png`)});
 }
 // Exercise the moved pad and action target using pointer input at their new bounds.
 await touch.setViewportSize({width:390,height:844});await touch.evaluate(()=>{meadowGame.player.setPosition(0,20);});const pad=await touch.locator('#joystick').boundingBox(),x=pad.x+pad.width/2,y=pad.y+pad.height/2;
 await touch.mouse.move(x,y);await touch.mouse.down();await touch.mouse.move(x+pad.width*.28,y);await touch.waitForTimeout(450);await touch.mouse.up();assert(await touch.evaluate(()=>meadowGame.player.mesh.position.x>1));assert.equal(await touch.evaluate(()=>meadowGame.input.axis.x),0);
 await touch.evaluate(()=>{const g=meadowGame,o=g.world.playground.scooter;g.player.setPosition(o.position.x,o.position.z+1.1);g.view.update(1,false,true);g.interactions.update();});await touch.locator('#touch-action').tap();assert(await touch.evaluate(()=>!!meadowGame.sandbox.riding));await touch.locator('#touch-action').tap();assert(await touch.evaluate(()=>!meadowGame.sandbox.riding));
 assert.deepEqual(errors,[]);console.log('PASS comfortable edge margins and non-overlapping UI at five sizes, actual joystick drag and touch interaction');await browser.close();
})().catch(async error=>{console.error(error);if(browser)await browser.close();process.exit(1);});
