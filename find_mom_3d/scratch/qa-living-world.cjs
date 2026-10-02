const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path');let browser;
(async()=>{
 browser=await chromium.launch({channel:'msedge',headless:true});const p=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('http://127.0.0.1:4173/find_mom_3d/');await p.waitForFunction(()=>window.meadowGame);
 async function finish(){for(let i=0;i<50&&await p.evaluate(()=>meadowGame.state.mode==='dialogue');i++)await p.locator('#dialogue-next').click();}
 async function seed(c,all=false){await p.evaluate(({c,all})=>{
  const g=meadowGame,s=Meadow.Progress.fresh();s.chapter=s.entryChapter=c;s.prologueSeen=true;
  if(all){
   const permutations=a=>a.length?a.flatMap((x,i)=>permutations(a.filter((_,j)=>j!==i)).map(rest=>[x,...rest])):[[]];
   Object.assign(s,{entryChapter:1,ribbon:true,metRabbit:true,metHedgehog:true,windSolved:true,windTurns:[...CONFIG.WIND_SOLUTION],flowers:['sun','heart','star'],arrangement:permutations(CONFIG.LAMP_ITEMS.map(i=>i.id)).find(a=>Meadow.PuzzleRules.lampSolved(a)),lit:true,completed:true,visited:[true,true,true,true],sideStories:[1,2,3,4],familyStories:[1,2,3,4]});
   Object.assign(s.forest,{metOwl:true,round:3,gustStage:6,reunited:true,separated:true,routeKnown:true,dashStage:3,completed:true});
   Object.assign(s.valley,{metBeaver:true,bridge:3,raft:4,completed:true});
   Object.assign(s.hill,{metSquirrel:true,lights:['hope','memory','courage'],signal:true,escort:3,reunited:true,completed:true});
  }
  g.saved=s;g.start(true);g.saveProgress();
 },{c,all});}
 const snapshot=()=>p.evaluate(()=>{const {chapter,checkpoint,visited,mode,upgraded,...rest}=Meadow.Progress.read();return JSON.stringify(rest);});
 // Fresh saves have a real entrance, but cannot skip the current challenge.
 await seed(1);await p.evaluate(()=>meadowGame.travel.go(2));assert.equal(await p.evaluate(()=>meadowGame.state.chapter),1);assert.equal(await p.evaluate(()=>meadowGame.travel.active),null);
 // Every pair works in both directions and restores every chapter's milestones.
 await seed(1,true);const saved=await snapshot();
 for(const to of [2,3,4,3,2,1]){
  const gate=await p.evaluate(to=>{const g=meadowGame,gate=g.world.portals.find(p=>p.to===to);g.travel.cooldown=0;g.player.setPosition(gate.x-gate.dx*1.6,gate.z-gate.dz*1.6);g.view.update(1,false,true);return {dx:gate.dx,dz:gate.dz,open:gate.open,walk:g.world.canWalk(g.player.mesh.position.x,g.player.mesh.position.z)};},to);
  assert(gate.open&&gate.walk,JSON.stringify(gate));
  const key=gate.dx>0?'ArrowRight':gate.dx<0?'ArrowLeft':gate.dz>0?'ArrowDown':'ArrowUp';await p.keyboard.down(key);await p.waitForFunction(to=>meadowGame.state.chapter===to&&!meadowGame.travel.active,to);await p.keyboard.up(key);await finish();
  assert.equal(await snapshot(),saved,'travel must preserve milestones and NPC choices');
  const arrival=await p.evaluate(()=>{const g=meadowGame,p=g.player.mesh.position;return {chapter:g.state.chapter,x:p.x,z:p.z,walk:g.world.canWalk(p.x,p.z),near:g.world.colliders.filter(c=>Math.hypot(c.x-p.x,c.z-p.z)<c.r+1)};});assert(arrival.walk,JSON.stringify(arrival));
  await p.waitForTimeout(200);assert.equal(await p.evaluate(()=>meadowGame.state.chapter),to,'arrival cannot bounce back');
  await p.reload();await p.waitForFunction(()=>window.meadowGame);await p.locator('#start-btn').click();assert.equal(await p.evaluate(()=>meadowGame.state.chapter),to);assert.equal(await p.evaluate(()=>meadowGame.state.mode),'playing');assert.equal(await snapshot(),saved);
  if(to===4)assert(await p.evaluate(()=>{const g=meadowGame,m=g.world.mother.mesh.position;return m.distanceTo(g.player.mesh.position)<2&&g.world.canWalk(m.x,m.z);}), 'reunited mother returns beside the player after reload');
 }
 console.log('PASS all six physical crossings, no bouncing, milestone/side-story persistence and reload');
 // Portal approaches connect to actual gameplay terrain, rather than isolated patches.
 for(let chapter=1;chapter<=4;chapter++){
  await seed(chapter,true);
  const connected=await p.evaluate(()=>{
   const g=meadowGame,w=g.world,step=.5,width=165,height=177,walk=new Uint8Array(width*height),seen=new Uint8Array(walk.length),pos=i=>({x:i%width*step-41,z:Math.floor(i/width)*step-45});
   for(let i=0;i<walk.length;i++){const p=pos(i);walk[i]=w.canWalk(p.x,p.z)?1:0;}
   const start=112*width+82,queue=[start];seen[start]=1;
   for(let head=0;head<queue.length;head++){const i=queue[head];for(const n of [i-1,i+1,i-width,i+width]){if(n<0||n>=walk.length||seen[n]||!walk[n]||Math.abs(n%width-i%width)>1)continue;seen[n]=1;queue.push(n);}}
   return w.portals.map(gate=>({to:gate.to,reachable:queue.some(i=>{const p=pos(i);return Math.hypot(p.x-gate.arrival.x,p.z-gate.arrival.z)<.6;})}));
  });assert(connected.every(gate=>gate.reachable),JSON.stringify({chapter,connected}));
 }
 // Crossing an entrance plays its introduction once; revisits retain an unfinished melody.
 await seed(2);await p.evaluate(()=>{const g=meadowGame;g.state.chapter=1;g.state.visited[1]=false;g.loadWorld(1);g.travel.go(2);});await p.waitForFunction(()=>meadowGame.state.mode==='dialogue'&&!meadowGame.travel.active);assert.equal(await p.locator('#dialogue-name').textContent(),'阿蹦');await finish();
 await p.evaluate(()=>{const g=meadowGame;g.state.forest.metOwl=true;g.state.forest.round=1;g.state.forest.input=Meadow.SongPuzzle.expected(1).slice(0,2);g.state.familyStories[1]=2;g.saveProgress();});const unfinished=await snapshot();
 for(const to of [1,2]){await p.evaluate(to=>meadowGame.travel.go(to),to);await p.waitForFunction(to=>meadowGame.state.chapter===to&&!meadowGame.travel.active,to);assert.equal(await p.evaluate(()=>meadowGame.state.mode),'playing');assert.equal(await snapshot(),unfinished);}
 console.log('PASS connected walking routes, introductions once, unfinished melody and NPC choices survive round trips');
 // The return bridge must connect both banks even when the player selected chapter 4 first.
 await seed(4);await p.evaluate(()=>meadowGame.travel.go(3));await p.waitForFunction(()=>meadowGame.state.chapter===3&&!meadowGame.travel.active);await finish();
 assert(await p.evaluate(()=>meadowGame.world.returnBridge.visible));
 const walk=await p.evaluate(()=>{const w=meadowGame.world;return Array.from({length:149},(_,i)=>w.canWalk(5,-11.5+i*.1)).every(Boolean);});assert(walk,'the full return bridge is walkable');
 await p.evaluate(()=>{meadowGame.player.setPosition(5,-12);meadowGame.view.update(1,false,true);});await p.keyboard.down('ArrowDown');await p.waitForFunction(()=>meadowGame.player.mesh.position.z>3.5);await p.keyboard.up('ArrowDown');
 assert.equal(await p.evaluate(()=>meadowGame.state.valley.bridge),0,'return bridge never awards puzzle completion');
 await p.evaluate(()=>meadowGame.travel.go(2));await p.waitForFunction(()=>meadowGame.state.chapter===2&&!meadowGame.travel.active);assert(await p.evaluate(()=>meadowGame.world.canWalk(meadowGame.player.mesh.position.x,meadowGame.player.mesh.position.z)));assert.equal(await p.evaluate(()=>meadowGame.state.forest.round),0);
 console.log('PASS direct chapter selection can backtrack across river without false completion');
 // Residents use actual walking positions for collision, interactions, and map dots.
 for(let c=1;c<=4;c++){
  await seed(c);await p.evaluate(()=>meadowGame.player.setPosition(0,12));
  const result=await p.evaluate(()=>{
   const g=meadowGame,start=g.world.residents.map(n=>n.mesh.position.clone()),distance=Array(5).fill(0),activities=Array.from({length:5},()=>new Set());let safe=true;
   for(let i=0;i<1400;i++){
    const before=g.world.residents.map(n=>n.mesh.position.clone());Meadow.Routines.update(g.world,.04,g.player,g.state,false);
    g.world.residents.forEach((n,j)=>{distance[j]+=n.mesh.position.distanceTo(before[j]);activities[j].add(n.routine.activity);safe&&=g.world.canWalk(n.mesh.position.x,n.mesh.position.z,n.collider)&&Math.hypot(n.mesh.position.x-n.x,n.mesh.position.z-n.z)<=3.51&&Math.abs(n.collider.x-n.mesh.position.x)<.001&&Math.abs(n.collider.z-n.mesh.position.z)<.001;});
   }
   return {distance,activities:activities.map(a=>[...a]),safe};
  });assert(result.safe,JSON.stringify(result));assert(result.distance.every(d=>d>2),JSON.stringify(result));assert(result.activities.every(a=>a.includes('walk')&&a.includes('work')),JSON.stringify(result));
  await p.evaluate(()=>{const g=meadowGame,n=g.world.residents[0];g.player.setPosition(n.mesh.position.x,n.mesh.position.z+1.35);g.view.update(1,false,true);});await p.waitForTimeout(150);
  const still=await p.evaluate(()=>meadowGame.world.residents[0].mesh.position.toArray());await p.waitForTimeout(250);assert.deepEqual(await p.evaluate(()=>meadowGame.world.residents[0].mesh.position.toArray()),still);
  await p.keyboard.press('e');assert.equal(await p.locator('#dialogue-name').textContent(),await p.evaluate(()=>meadowGame.world.residents[0].name));await finish();
  await p.keyboard.press('Escape');const paused=await p.evaluate(()=>meadowGame.world.residents.map(n=>n.mesh.position.toArray()));await p.waitForTimeout(200);assert.deepEqual(await p.evaluate(()=>meadowGame.world.residents.map(n=>n.mesh.position.toArray())),paused);await p.locator('#resume-btn').click();
 }
 console.log('PASS all 20 residents walk/work, avoid obstacles, carry moving colliders, stop for conversation and freeze on pause');
 for(const size of [{width:1280,height:800},{width:390,height:844},{width:844,height:390},{width:320,height:568}]){
  await p.setViewportSize(size);await seed(2,true);await p.waitForTimeout(150);
  for(const id of ['objective-title','hint-btn','journal-btn','minimap','map-back','map-next']){
   const r=await p.locator('#'+id).boundingBox();assert(r&&r.x>=0&&r.y>=0&&r.x+r.width<=size.width+1&&r.y+r.height<=size.height+1,id+JSON.stringify(r));
  }
  await p.locator('#map-back').click();assert.equal(await p.evaluate(()=>meadowGame.travel.selected),1);assert.match(await p.locator('#objective-title').textContent(),/花田/);await p.locator('#hint-btn').click();assert.equal(await p.evaluate(()=>meadowGame.travel.selected),0);
  await p.screenshot({path:path.join(__dirname,`living-world-${size.width}.png`)});
 }
 await seed(4,true);await p.evaluate(()=>meadowGame.showEnding());await p.locator('#ending-explore').click();assert.equal(await p.evaluate(()=>meadowGame.state.mode),'playing');assert(await p.locator('#play-hud').isVisible());
 assert.deepEqual(errors,[]);console.log('PASS compact HUD and map exit guidance at desktop/phone/landscape sizes, continue exploring after ending');
 const touch=await browser.newPage({hasTouch:true,isMobile:true,viewport:{width:844,height:390}});touch.on('pageerror',e=>errors.push(e.message));await touch.emulateMedia({reducedMotion:'reduce'});await touch.goto('http://127.0.0.1:4173/find_mom_3d/');await touch.waitForFunction(()=>window.meadowGame);
 await touch.evaluate(()=>{const g=meadowGame,s=Meadow.Progress.fresh();s.chapter=s.entryChapter=4;s.prologueSeen=true;g.saved=s;g.start(true);const gate=g.world.portals[0];g.player.setPosition(gate.x-gate.dx*2,gate.z-gate.dz*2);g.view.update(1,false,true);g.interactions.update();});
 await touch.locator('#touch-action').tap();await touch.waitForFunction(()=>meadowGame.state.chapter===3&&!meadowGame.travel.active);assert.equal(await touch.evaluate(()=>meadowGame.state.mode),'playing');
 const controls=await touch.evaluate(()=>['minimap','touch-action','joystick','pause-btn'].map(id=>{const r=document.getElementById(id).getBoundingClientRect();return {id,x:r.x,y:r.y,w:r.width,h:r.height};}));for(const r of controls)assert(r.w>0&&r.x>=0&&r.y>=0&&r.x+r.w<=845&&r.y+r.h<=391,JSON.stringify(r));
 const map=controls[0],action=controls[1];assert(map.x+map.w<=action.x||action.x+action.w<=map.x||map.y+map.h<=action.y||action.y+action.h<=map.y,'map must not cover the touch action');
 await touch.screenshot({path:path.join(__dirname,'living-world-touch.png')});assert.deepEqual(errors,[]);console.log('PASS real touch portal interaction, reduced motion and landscape controls');await browser.close();
})().catch(async error=>{console.error(error);if(browser)await browser.close();process.exit(1);});
