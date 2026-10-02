const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path');let browser;
(async()=>{
 browser=await chromium.launch({channel:'msedge',headless:true});const p=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('http://127.0.0.1:4173/find_mom_3d/');await p.waitForFunction(()=>window.meadowGame);
 const seed=chapter=>p.evaluate(chapter=>{const g=meadowGame,s=Meadow.Progress.fresh();s.chapter=chapter;s.entryChapter=4;s.prologueSeen=true;g.saved=s;g.start(true);g.input.reset();},chapter);
 for(let c=1;c<=4;c++){
  await seed(c);
  const results=await p.evaluate(()=>{
   const g=meadowGame,w=g.world;g.state.mode='paused';const failures=[];
   // Reproduce an NPC walking into the player's collision circle. All 36 actors must allow escape.
   for(const n of [...w.locals,...w.residents]){
    let angle=null;for(let i=0;i<16;i++){const a=i*Math.PI/8;if([.45,.65,.9,1.2,1.8].every(r=>w.canWalk(n.mesh.position.x+Math.sin(a)*r,n.mesh.position.z+Math.cos(a)*r,n.collider))){angle=a;break;}}
    if(angle===null){failures.push(n.id+' no free exit');continue;}
    const x=Math.sin(angle),z=Math.cos(angle),q=n.mesh.position;g.player.setPosition(q.x+x*.45,q.z+z*.45);
    for(let i=0;i<20;i++)g.player.update(1/60,{movement:()=>({x,z})},w,true,true);
    if(Math.hypot(g.player.mesh.position.x-q.x,g.player.mesh.position.z-q.z)<1)failures.push(n.id+' stuck');
   }
   // An actor gives way while we keep holding the same direction, with no steering correction.
   const n=w.locals[1],q=n.mesh.position;n.dodge=null;n.routine.wait=5;g.player.setPosition(q.x,q.z+2.5);const start=g.player.mesh.position.z;g.input.keys.add('ArrowUp');g.state.mode='playing';
   let minGap=10;for(let i=0;i<65;i++){g.sandbox.beforeMove(1/60);g.player.update(1/60,g.input,w,true,true);Meadow.Routines.step(w,n,1/60,g.player,true);minGap=Math.min(minGap,q.distanceTo(g.player.mesh.position));}
   g.input.reset();const moved=start-g.player.mesh.position.z;g.state.mode='paused';
   // Every time-trial checkpoint lies in the connected southern road network.
   g.streetRun.prepare();const walk=new Set(),queue=[[0,20]],key=(x,z)=>x+','+z;walk.add(key(0,20));
   for(let head=0;head<queue.length;head++){const [x,z]=queue[head];for(const [dx,dz] of [[.5,0],[-.5,0],[0,.5],[0,-.5]]){const nx=x+dx,nz=z+dz,k=key(nx,nz);if(walk.has(k)||nx<-32||nx>32||nz<5||nz>37||!w.canWalk(nx,nz))continue;walk.add(k);queue.push([nx,nz]);}}
   const unreachable=w.streetRun.points.filter(q=>!queue.some(([x,z])=>Math.hypot(x-q.x,z-q.z)<1.4)).map(q=>q.toArray());
   return {failures,moved,minGap,unreachable};
  });assert.deepEqual(results.failures,[]);assert(results.moved>4,JSON.stringify({c,...results}));assert(results.minGap>=.76,JSON.stringify({c,...results}));assert.deepEqual(results.unreachable,[]);console.log('PASS chapter '+c+': overlap escape, continuous NPC passing and reachable circuit',JSON.stringify(results));
 }
 await seed(1);
 assert(await p.evaluate(()=>{
  const c={x:0,z:0,r:.8},w={colliders:[c],canWalk(x,z,ignore,origin){return !Meadow.Motion.blocked(c,x,z,ignore,origin);}},p={x:.95,z:-1.5};
  for(let i=0;i<30;i++)Meadow.Motion.move(w,p,0,.1);return p.z>.9&&Math.hypot(p.x,p.z)>=1.14;
 }),'glancing collision should slide');
 await seed(2);assert(await p.evaluate(()=>{const g=meadowGame;g.state.mode='paused';g.player.setPosition(0,-1.3);g.player.speedMultiplier=8;for(let i=0;i<30;i++)g.player.update(.05,{movement:()=>({x:0,z:-1})},g.world,true,true);return g.player.mesh.position.z>=-2.4;}),'fast movement tunnelled through hedge');
 await seed(3);assert(await p.evaluate(()=>{const g=meadowGame;g.state.mode='paused';g.player.setPosition(15,5);g.player.speedMultiplier=8;for(let i=0;i<30;i++)g.player.update(.05,{movement:()=>({x:0,z:-1})},g.world,true,true);return g.player.mesh.position.z>=3.2;}),'fast movement crossed river');
 console.log('PASS wall sliding and swept collision at high speed against gate and river');
 await seed(1);
 async function distance(sprint){await p.evaluate(()=>meadowGame.player.setPosition(0,15));if(sprint)await p.keyboard.down('Shift');await p.keyboard.down('ArrowDown');await p.waitForTimeout(650);await p.keyboard.up('ArrowDown');await p.keyboard.up('Shift');return p.evaluate(()=>meadowGame.player.mesh.position.z-15);}
 const walk=await distance(false),run=await distance(true);assert(run>walk*1.25,JSON.stringify({walk,run}));
 await p.evaluate(()=>{const g=meadowGame;g.sandbox.act({item:g.world.playground.scooter});g.player.setPosition(0,15);});await p.keyboard.down('ArrowDown');await p.waitForTimeout(600);assert(await p.evaluate(()=>meadowGame.player.actualSpeed>8));await p.keyboard.up('ArrowDown');await p.waitForTimeout(400);assert(await p.evaluate(()=>meadowGame.player.actualSpeed<.1));
 await p.evaluate(()=>{const g=meadowGame,n=g.world.locals[1];g.player.setPosition(n.mesh.position.x,n.mesh.position.z+2.4);g.player.mesh.rotation.y=Math.PI;});await p.keyboard.press('h');assert(await p.evaluate(()=>meadowGame.world.locals[1].reactionText==='♫'&&!!meadowGame.world.locals[1].dodge));
 await p.keyboard.press('Escape');assert(await p.locator('#scooter-bell').isHidden());await p.locator('#resume-btn').click();
 console.log('PASS actual Shift sprint, vehicle acceleration/braking and H bell with NPC reaction');
 // The race starts through the normal interaction, pauses, fails, retries, saves, and cancels on travel.
 await p.evaluate(()=>{const g=meadowGame,q=g.world.streetRun.mesh.position;g.player.setPosition(q.x,q.z+.9);g.interactions.update();});assert.equal(await p.evaluate(()=>meadowGame.interactions.current.id),'street-run');await p.keyboard.press('e');assert(await p.evaluate(()=>meadowGame.streetRun.active&&!!meadowGame.sandbox.riding));
 await p.keyboard.press('Escape');const time=await p.evaluate(()=>meadowGame.streetRun.elapsed);await p.waitForTimeout(250);assert.equal(await p.evaluate(()=>meadowGame.streetRun.elapsed),time);await p.locator('#resume-btn').click();
 await p.evaluate(()=>{meadowGame.streetRun.elapsed=44.99;meadowGame.streetRun.update(.02);});assert.equal(await p.evaluate(()=>meadowGame.streetRun.active),false);assert.equal(await p.evaluate(()=>meadowGame.sandbox.progress().bestRun),0);
 await p.evaluate(()=>{const g=meadowGame;g.streetRun.start();for(const q of g.world.streetRun.points){g.player.setPosition(q.x,q.z);g.streetRun.update(1);} });assert.equal(await p.evaluate(()=>meadowGame.sandbox.progress().bestRun),11);assert.equal(await p.evaluate(()=>meadowGame.streetRun.active),false);
 await p.reload();await p.waitForFunction(()=>window.meadowGame);await p.locator('#start-btn').click();assert.equal(await p.evaluate(()=>meadowGame.sandbox.progress().bestRun),11);
 await p.evaluate(()=>meadowGame.streetRun.start());await p.locator('#hint-btn').click();assert.equal(await p.evaluate(()=>meadowGame.streetRun.active),false);assert.equal(await p.locator('#hint-btn').getAttribute('aria-label'),'指向目前任務');
 await p.evaluate(()=>{meadowGame.streetRun.start();meadowGame.travel.go(2);});await p.waitForFunction(()=>meadowGame.state.chapter===2&&!meadowGame.travel.active);assert.equal(await p.evaluate(()=>meadowGame.streetRun.active),false);
 console.log('PASS mounted race entry, pause, timeout, replay, record persistence, cancellation and chapter travel');
 await seed(1);const alpha=await p.evaluate(()=>{
  const g=meadowGame,m=g.minimap;g.time+=1;m.lastDraw=-1;m.update();const terrain=m.terrain(g.world,g.state).getContext('2d'),off=m.point(3,18),road=m.point(0,18),self=m.point(g.player.mesh.position.x,g.player.mesh.position.z);
  const a=(ctx,p)=>ctx.getImageData(Math.round(p.x),Math.round(p.y),1,1).data[3];const first=a(m.ctx,off);for(let i=0;i<15;i++){g.time+=.2;m.update();}return {off:a(terrain,off),road:a(terrain,road),self:a(m.ctx,{x:self.x,y:self.y+3}),first,last:a(m.ctx,off),height:g.camera.top*2,width:m.panel.getBoundingClientRect().width};
 });assert(alpha.off<170&&alpha.road>220&&alpha.self>245,JSON.stringify(alpha));assert.equal(alpha.first,alpha.last);assert(alpha.height<19&&alpha.width===160,JSON.stringify(alpha));
 await p.screenshot({path:path.join(__dirname,'free-roam-desktop.png')});
 const touch=await browser.newPage({hasTouch:true,isMobile:true,viewport:{width:390,height:844}});touch.on('pageerror',e=>errors.push(e.message));await touch.goto('http://127.0.0.1:4173/find_mom_3d/');await touch.waitForFunction(()=>window.meadowGame);await touch.evaluate(()=>{const g=meadowGame,s=Meadow.Progress.fresh();s.prologueSeen=true;g.saved=s;g.start(true);g.sandbox.act({item:g.world.playground.scooter});});
 for(const viewport of [{width:390,height:844},{width:320,height:568},{width:844,height:390},{width:568,height:320}]){
  await touch.setViewportSize(viewport);await touch.waitForTimeout(120);const boxes=await touch.evaluate(()=>Object.fromEntries(['joystick','touch-action','scooter-bell','minimap'].map(id=>{const r=document.getElementById(id).getBoundingClientRect();return [id,{x:r.x,y:r.y,w:r.width,h:r.height}];})));
  const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;for(const [id,r] of Object.entries(boxes)){assert(r.x>=0&&r.y>=0&&r.x+r.w<=viewport.width+1&&r.y+r.h<=viewport.height+1,JSON.stringify({id,r}));if(id!=='scooter-bell')assert(!overlap(r,boxes['scooter-bell']),JSON.stringify({viewport,boxes}));}await touch.locator('#scooter-bell').tap();await touch.screenshot({path:path.join(__dirname,'free-roam-'+viewport.width+'.png')});
 }
 await touch.setViewportSize({width:390,height:844});await touch.evaluate(()=>{meadowGame.sandbox.release();meadowGame.player.setPosition(0,20);});const box=await touch.locator('#joystick').boundingBox(),x=box.x+box.width/2,y=box.y+box.height/2;await touch.mouse.move(x,y);await touch.mouse.down();await touch.mouse.move(x+box.width*.32,y);await touch.waitForTimeout(200);assert(await touch.evaluate(()=>meadowGame.player.sprinting));await touch.mouse.up();assert(await touch.evaluate(()=>!meadowGame.input.sprinting()));
 assert.deepEqual(errors,[]);console.log('PASS transparent terrain/opaque roads and player, no alpha buildup, closer camera, phone/landscape layout and touch sprint');await browser.close();
})().catch(async e=>{console.error(e);if(browser)await browser.close();process.exit(1);});
