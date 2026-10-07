const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=process.env.GAME_BASE||'http://127.0.0.1:4174',out=path.resolve(__dirname,'../.qa/neon-courier');fs.mkdirSync(out,{recursive:true});
let browser;const reports=[];
(async()=>{
 browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'msedge',headless:true});
 for(const [width,height] of [[1440,900],[390,844],[844,390]]){
  const ctx=await browser.newContext({viewport:{width,height},hasTouch:true,isMobile:width<900}),p=await ctx.newPage(),errors=[];
  p.on('pageerror',e=>errors.push(e.message));await p.goto(base+'/neon_courier/');await p.waitForFunction(()=>window.neonGame);await p.locator('#launch').click();await p.waitForFunction(()=>neonGame.mode==='running');
  await p.evaluate(()=>{const r=new NC.Run(neonGame.profile,17,{traffic:false});r.phase='running';r.items=[];r.forks=[];r.speed=r.role.speed;neonGame.run=r;neonGame.stick.reset();neonGame.world.update(r,0);});
  const idle=await p.evaluate(()=>neonGame.run.worldX());await p.waitForTimeout(3000);
  assert(await p.evaluate(x=>Math.abs(neonGame.run.worldX()-x)<1e-7&&Math.abs(neonGame.run.x)<.01&&neonGame.run.contacts===0&&neonGame.run.steering===0&&neonGame.run.vx===0&&Math.abs(neonGame.world.pilot.rotation.y)<1e-7&&Math.abs(neonGame.world.lookTarget.x-x)<1e-7,idle),'Opening straight keeps the untouched player centered, with no steering or early scrape');
  const pad=await p.locator('#joystick').boundingBox(),cx=pad.x+pad.width/2,cy=pad.y+pad.height/2;
  await p.mouse.move(cx+pad.width*.30,cy);await p.mouse.down();await p.waitForTimeout(300);await p.mouse.up();await p.waitForTimeout(200);
  const released=await p.evaluate(()=>neonGame.run.worldX());assert(released>idle+1);await p.waitForTimeout(450);
  assert(await p.evaluate(x=>Math.abs(neonGame.run.worldX()-x)<1e-7&&neonGame.run.vx===0&&neonGame.stick.pointer===null&&Math.abs(neonGame.world.pilot.rotation.y)<.003,released),'Released joystick stops sideways travel and returns the player to a forward heading');
  await p.screenshot({path:path.join(out,`manual-idle-${width}.png`)});
  await p.evaluate(()=>{
   const r=new NC.Run(neonGame.profile,17,{traffic:false}),other=new NC.Run(neonGame.profile,17,{traffic:false});
   for(const run of [r,other]){run.phase='running';run.items=[];run.forks=[];run.speed=run.role.speed;run.distance=50;}
   other.distance=51;r.couriers=[{run:other,step(){}}];neonGame.run=r;neonGame.world.update(r,0);
  });
  await p.waitForFunction(()=>neonGame.run.contacts>0);await p.keyboard.press('Escape');
  assert(await p.evaluate(()=>{const r=neonGame.run,w=neonGame.world;return r.worldX()===0&&r.couriers[0].run.worldX()===0&&r.impactSide===0&&w.pilot.position.x===0&&w.contactRing.visible&&w.courierModels[0].userData.contact.visible;}),'Aligned front/rear contact shows feedback without moving the model or camera sideways');
  await p.keyboard.press('Escape');
  const walls=[];
  for(const side of [0,1]){
   await p.evaluate(side=>{
    const r=new NC.Run(neonGame.profile,17,{traffic:false}),f=r.forks[0];r.phase='running';r.items=[];r.speed=r.role.speed;r.distance=f.start+(f.end-f.start)*.15;f.choice=side;const b=r.lateralBounds();r.x=side?b.min+1:b.max-1;
    const original=r.step.bind(r);r.straightTrace=[];
    r.step=(dt,input)=>{const before=r.worldX();original(dt,input);const bounds=r.lateralBounds();r.straightTrace.push({before,after:r.worldX(),x:r.x,vx:r.vx,steer:r.steering,min:bounds.min,max:bounds.max,contacts:r.contacts,wall:r.notices.some(n=>n.type==='bump'&&n.kind==='wall')});};
    neonGame.run=r;neonGame.world.update(r,0);
   },side);
   await p.waitForFunction(()=>neonGame.run.contacts>0);await p.waitForTimeout(60);
   const trace=await p.evaluate(()=>neonGame.run.straightTrace);assert(trace.length>2);
   let straight=0,contact=0;
   for(const frame of trace){assert.equal(frame.steer,0);assert.equal(frame.vx,0);if(Math.abs(frame.after-frame.before)<1e-7)straight++;else{assert(Math.abs(frame.x-frame.min)<1e-7||Math.abs(frame.x-frame.max)<1e-7,'Only physical wall contact can move an untouched player sideways');contact++;}}
   assert(straight>1&&contact>0&&trace.some(t=>t.wall));assert(await p.evaluate(()=>neonGame.world.contactRing.visible&&neonGame.run.hits===0));
   await p.screenshot({path:path.join(out,`manual-wall-${side}-${width}.png`)});walls.push({side,straightSteps:straight,wallSteps:contact});
   // Native pointer steering away from the inner wall must remain available.
   const currentPad=await p.locator('#joystick').boundingBox();await p.mouse.move(currentPad.x+currentPad.width*(side?.80:.20),currentPad.y+currentPad.height/2);await p.mouse.down();await p.waitForTimeout(180);
   assert(await p.evaluate(side=>Math.sign(neonGame.run.vx)===(side?1:-1),side),'Wall contact does not erase input that steers away');await p.mouse.up();
  }
  assert.deepEqual(errors,[]);reports.push({width,height,walls});console.log(`PASS ${width}x${height}: centered opening, native release, aligned contact without drift, wall-only displacement and steering away`);await ctx.close();
 }
 fs.writeFileSync(path.join(out,'manual-steering-results.json'),JSON.stringify(reports,null,2));await browser.close();
})().catch(async e=>{console.error(e);if(browser)await browser.close();process.exitCode=1;});
