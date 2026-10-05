const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=process.env.GAME_BASE||'http://127.0.0.1:4174',out=path.resolve(__dirname,'../.qa/neon-courier');fs.mkdirSync(out,{recursive:true});
let browser;
(async()=>{
 browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'msedge',headless:true});const reports=[];
 for(const [width,height] of [[1440,900],[390,844],[844,390]]){
  const ctx=await browser.newContext({viewport:{width,height}}),page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(base+'/neon_courier/');await page.waitForFunction(()=>window.neonGame);await page.evaluate(()=>neonGame.ended=true);
  const report=await page.evaluate(()=>{
   const w=neonGame.world,p=NC.freshProfile(),snap=()=>({camera:w.camera.position.clone(),look:w.lookTarget.clone(),yaw:w.pilot.rotation.y,pilot:w.pilot.position.clone()});const pairs=[],rides=[],snapshots=[];
   for(const side of [0,1]){
    // One physical pose expressed before and after route selection must have the same view.
    const r=new NC.Run(p,17,{traffic:false}),f=r.forks[0];r.phase='running';r.distance=f.start+(f.end-f.start)*.23;r.x=side?4:-4;r.speed=r.role.speed;w.update(r,0);const before=snap();
    f.choice=side;r.x-=r.pathOffset();w.update(r,0);const after=snap();pairs.push({side,camera:before.camera.distanceTo(after.camera),look:before.look.distanceTo(after.look),yaw:Math.abs(before.yaw-after.yaw),pilot:before.pilot.distanceTo(after.pilot)});
    for(const startX of [side?4:-4,side?.01:-.01]){
     const run=new NC.Run(p,17,{traffic:false}),fork=run.forks[0];run.phase='running';run.items=[];run.distance=fork.start-35;run.x=startX;run.speed=run.role.speed+22;run.energy=10000;run.capacity=10000;w.update(run,0);
     let accumulator=0,last=null,maxScreenStep=0,maxScreenX=0,maxYawStep=0,maxWorldStep=0,choice=null,selectedFrame=null;const frames=[];
     while(run.distance<fork.end+30){
      const oldX=run.lateralPosition();accumulator+=1/60;while(accumulator>=1/90){run.step(1/90,{boost:true});accumulator-=1/90;}w.update(run,1/60);
      const v=w.pilot.position.clone().add(new THREE.Vector3(0,1.5,0)).project(w.camera),state={d:run.distance,screenX:v.x,yaw:w.pilot.rotation.y,cameraX:w.camera.position.x,worldX:run.lateralPosition()};
      if(last){maxScreenStep=Math.max(maxScreenStep,Math.abs(v.x-last.screenX));maxYawStep=Math.max(maxYawStep,Math.abs(state.yaw-last.yaw));}maxWorldStep=Math.max(maxWorldStep,Math.abs(run.lateralPosition()-oldX));
      if(choice!==fork.choice){choice=fork.choice;selectedFrame=frames.length;}maxScreenX=Math.max(maxScreenX,Math.abs(v.x));
      if(innerWidth===390&&startX===4&&selectedFrame!==null&&[0,15,45].includes(frames.length-selectedFrame))snapshots.push({name:`fork-transition-${frames.length-selectedFrame}.png`,data:w.canvas.toDataURL()});
      frames.push(state);last=state;
     }
     rides.push({side,startX,maxScreenStep,maxScreenX,maxYawStep,maxWorldStep,selectedFrame,choice,frames});
    }
   }
   return {pairs,rides,snapshots};
  });
  for(const shot of report.snapshots)fs.writeFileSync(path.join(out,shot.name),Buffer.from(shot.data.split(',')[1],'base64'));delete report.snapshots;
  reports.push({width,height,...report});fs.writeFileSync(path.join(out,'fork-camera-results.json'),JSON.stringify(reports,null,2));
  assert.deepEqual(errors,[]);
  for(const p of report.pairs){assert(p.pilot<1e-7,'Selection preserves physical position');assert(p.camera<1e-7&&p.look<1e-7,'Camera must not reframe when only the route coordinate system changes');assert(p.yaw<1e-7,'Heading must not snap on route selection');}
  for(const r of report.rides){assert.equal(r.choice,r.side);assert(r.maxScreenStep<.025,'No sudden sideways jump on screen');assert(r.maxScreenX<.9,'Rider stays visible throughout split/rejoin');assert(r.maxYawStep<.045,'Turns blend continuously');assert(r.maxWorldStep<.65,'No sudden displacement at the divider tip');}
  console.log(`PASS ${width}x${height}: no coordinate-switch reframe; both branches and centered entries remain smooth through split/rejoin`);
  await ctx.close();
 }
 await browser.close();console.log('PASS fork camera continuity across coordinate changes, both branches, centered/offset entries and desktop/portrait/landscape');
})().catch(async e=>{console.error(e);if(browser)await browser.close();process.exitCode=1;});
