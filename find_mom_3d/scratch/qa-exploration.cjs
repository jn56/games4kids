const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');let browser;
(async()=>{
 browser=await chromium.launch({channel:'msedge',headless:true});const p=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('http://127.0.0.1:4173/find_mom_3d/');await p.waitForFunction(()=>window.meadowGame);const out=path.join(__dirname,'expanded');fs.mkdirSync(out,{recursive:true});
 async function seed(chapter){await p.evaluate(chapter=>{const s=Meadow.Progress.fresh();s.chapter=s.entryChapter=chapter;s.prologueSeen=true;meadowGame.saved=s;meadowGame.start(true);},chapter);await p.waitForTimeout(100);}
 for(let chapter=1;chapter<=4;chapter++){
  await seed(chapter);
  const report=await p.evaluate(()=>{
   const g=meadowGame,w=g.world,c=g.state.chapter;let oldArea=0,newArea=0;
   for(let x=-41;x<=41;x+=.5)for(let z=-45;z<=43;z+=.5){if(!w.canWalk(x,z))continue;newArea++;if((x/16.3)**2+((z+1)/17.6)**2<.96&&z<(c<3?13.5:14)&&z>(c<3?-15.5:-16))oldArea++;}
   const step=.5,sizeX=165,sizeZ=181,walk=new Uint8Array(sizeX*sizeZ),visited=new Uint8Array(walk.length);
   const pos=i=>({x:(i%sizeX)*step-41,z:Math.floor(i/sizeX)*step-45});
   for(let i=0;i<walk.length;i++){const {x,z}=pos(i);walk[i]=w.canWalk(x,z)?1:0;}
   const start=Math.round((11+45)/step)*sizeX+Math.round(41/step),queue=[start];visited[start]=1;
   for(let head=0;head<queue.length;head++){const i=queue[head];for(const n of [i-1,i+1,i-sizeX,i+sizeX]){if(n<0||n>=walk.length||visited[n]||!walk[n]||Math.abs(n%sizeX-i%sizeX)>1)continue;visited[n]=1;queue.push(n);}}
   return {chapter:c,ratio:newArea/oldArea,residents:w.residents.map(n=>({name:n.name,reachable:queue.some(i=>{const p=pos(i);return Math.hypot(p.x-n.x,p.z-n.z)<1.8;})})),routes:w.mapRoutes.length};
  });assert(report.ratio>=4,JSON.stringify(report));assert.equal(report.residents.length,3);assert(report.residents.every(n=>n.reachable),JSON.stringify(report));console.log('PASS terrain',JSON.stringify(report));
  for(let i=0;i<3;i++){
   const before=await p.evaluate(i=>{const g=meadowGame,n=g.world.residents[i];g.player.setPosition(n.x,n.z+1.3);g.view.update(1,false,true);return JSON.stringify(g.state);},i);await p.waitForTimeout(100);
   assert((await p.locator('#interaction-prompt').textContent()).includes(report.residents[i].name));await p.keyboard.press('e');assert.equal(await p.locator('#dialogue-name').textContent(),report.residents[i].name);assert.equal(await p.locator('#minimap').isVisible(),false);
   for(let n=0;n<12&&await p.evaluate(()=>meadowGame.state.mode==='dialogue');n++)await p.locator('#dialogue-next').click();
   assert.equal(await p.evaluate(()=>JSON.stringify(meadowGame.state)),before,'optional conversation changed quest state');
   if(i===0)await p.screenshot({path:path.join(out,`chapter-${chapter}-outer.png`)});
  }
  // Every chapter's enlarged corner follows the camera; boundaries and story gates still apply.
  const checks=await p.evaluate(()=>{const g=meadowGame,w=g.world,p=g.player.mesh.position,v=p.clone().project(g.camera);return {inView:Math.abs(v.x)<.6&&Math.abs(v.y)<.7,outside:w.canWalk(43,10),gate:g.state.chapter===2?w.canWalk(30,-2.8):g.state.chapter===3?w.canWalk(30,-4):g.state.chapter===4?w.canWalk(25,-12):false};});assert(checks.inView);assert(!checks.outside&&!checks.gate);
  assert(await p.locator('#minimap').isVisible());await p.locator('#minimap-toggle').click();assert.equal(await p.locator('#minimap-body').isVisible(),false);await p.locator('#minimap-toggle').click();
 }
 await seed(1);await p.keyboard.down('ArrowDown');await p.waitForTimeout(1800);await p.keyboard.up('ArrowDown');assert(await p.evaluate(()=>meadowGame.player.mesh.position.z>15),'real movement still stops at old boundary');
 const saved=await p.evaluate(()=>{const g=meadowGame;g.checkpoint(25,13.3);g.start(true);return {saved:g.saved.checkpoint,p:{x:g.player.mesh.position.x,z:g.player.mesh.position.z}};});assert.equal(saved.saved.x,25);assert.equal(saved.p.x,25);
 for(const viewport of [{width:390,height:844},{width:844,height:390},{width:320,height:568}]){
  await p.setViewportSize(viewport);await p.waitForTimeout(150);const boxes=await p.evaluate(()=>Object.fromEntries(['minimap','pause-btn','sound-btn','objective-title'].map(id=>{const r=document.getElementById(id).getBoundingClientRect();return [id,{x:r.x,y:r.y,right:r.right,bottom:r.bottom}];})));
  for(const b of Object.values(boxes))assert(b.x>=0&&b.y>=0&&b.right<=viewport.width+1&&b.bottom<=viewport.height+1,JSON.stringify(boxes));
  const m=boxes.minimap,q=boxes['objective-title'];assert(m.x>=q.right||q.x>=m.right||m.y>=q.bottom||q.y>=m.bottom,'map overlaps objective');
  await p.screenshot({path:path.join(out,`map-${viewport.width}.png`)});
 }
 assert.deepEqual(errors,[]);console.log('PASS 12 dialogue-only NPCs, camera follow, real outer-boundary movement, outer checkpoint reload, map toggle and responsive layout; no runtime errors');await browser.close();
})().catch(async e=>{console.error(e);if(browser)await browser.close();process.exit(1);});
