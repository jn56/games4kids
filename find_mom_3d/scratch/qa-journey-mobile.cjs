const {chromium}=require('playwright');const assert=require('node:assert/strict');const path=require('node:path');let browser;
(async()=>{
 browser=await chromium.launch({channel:'msedge',headless:true});const p=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('http://127.0.0.1:4173/find_mom_3d/');await p.waitForFunction(()=>window.meadowGame);
 const seed=await p.evaluate(()=>{const s=Meadow.Progress.fresh();Object.assign(s,{chapter:3,prologueSeen:true,ribbon:true,metRabbit:true,metHedgehog:true,windSolved:true,windTurns:[1,1,2,1,1,3,0,1,1],flowers:['sun','heart','star'],arrangement:['ribbon','sun','heart','star'],lit:true,completed:true,checkpoint:{x:0,z:4.4}});Object.assign(s.forest,{metOwl:true,round:3,gustStage:6,dashStage:3,reunited:true,separated:true,routeKnown:true,completed:true});s.valley.metBeaver=true;return s;});
 async function load(s){await p.evaluate(s=>Meadow.Progress.write(s),s);await p.reload();await p.waitForFunction(()=>window.meadowGame);await p.locator('#start-btn').tap();}
 async function dialogue(){for(let n=0;n<30&&await p.evaluate(()=>meadowGame.state.mode==='dialogue');n++)await p.locator('#dialogue-next').tap();}
 async function fit(ids){for(const id of ids){const b=await p.locator(id).boundingBox(),size=p.viewportSize();assert(b&&b.x>=0&&b.y>=0&&b.x+b.width<=size.width+1&&b.y+b.height<=size.height+1,id+' outside viewport');}assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
 await load(seed);await p.locator('#touch-action').tap();await fit(['#journey-start','#journey-leave']);await p.locator('#journey-start').tap();
 for(const [w,h,label] of [[390,844,'phone'],[844,390,'landscape']]){await p.setViewportSize({width:w,height:h});await fit(['#journey-hit','#bridge-timing','#journey-leave']);await p.screenshot({path:path.join(__dirname,'bridge-'+label+'.png')});}
 while(await p.evaluate(()=>meadowGame.state.valley.bridge<3)){await p.waitForFunction(()=>{const e=meadowGame.expedition;return e.cooldown===0&&Math.abs(e.needle-e.bridgeSettings().center)<.05;});await p.locator('#journey-hit').tap();}await dialogue();
 assert.equal(await p.evaluate(()=>meadowGame.state.valley.bridge),3);console.log('PASS touch timing repairs all three bridge spans, portrait and landscape controls fit');
 // Begin at the last raft checkpoint and navigate its final gate with real pointer hold.
 seed.valley.bridge=3;seed.valley.raft=3;seed.checkpoint={x:0,z:-5.3};await p.setViewportSize({width:390,height:844});await load(seed);await p.locator('#touch-action').tap();await p.locator('#journey-start').tap();
 const cdp=await p.context().newCDPSession(p);
 async function hold(id){const b=await p.locator(id).boundingBox();await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:b.x+b.width/2,y:b.y+b.height/2,id:1}]});}
 async function release(){await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
 await hold('#journey-right');await p.waitForFunction(()=>meadowGame.expedition.raftX>1.4);await release();await p.screenshot({path:path.join(__dirname,'raft-phone.png')});await p.waitForFunction(()=>meadowGame.state.valley.raft===4);await dialogue();console.log('PASS touch steering clears final raft gate at normal speed');
 // Late-game fixture tests responsive continuous tracking, assistance and pause input release.
 seed.chapter=4;Object.assign(seed.valley,{raft:4,completed:true});seed.hill.metSquirrel=true;seed.checkpoint={x:-7,z:4.2};await load(seed);await p.locator('#touch-action').tap();await p.locator('#journey-start').tap();
 await p.waitForFunction(()=>meadowGame.state.hill.focusHelp[0]===1,{},{timeout:20000});
 for(const [w,h,label] of [[390,844,'phone'],[844,390,'landscape']]){await p.setViewportSize({width:w,height:h});await fit(['#journey-left','#journey-right','#journey-leave']);await p.screenshot({path:path.join(__dirname,'star-'+label+'.png')});}
 await hold('#journey-left');await p.locator('#pause-btn').tap();await release();assert.equal(await p.evaluate(()=>meadowGame.expedition.held),0);const before=await p.evaluate(()=>meadowGame.expedition.elapsed);await p.waitForTimeout(200);assert.equal(await p.evaluate(()=>meadowGame.expedition.elapsed),before);await p.locator('#resume-btn').tap();
 let held=null;const until=Date.now()+20000;
 while(await p.evaluate(()=>meadowGame.expedition.active)&&Date.now()<until){const q=await p.evaluate(()=>({a:meadowGame.expedition.aim,t:meadowGame.expedition.target})),next=Math.abs(q.a-q.t)<.03?null:q.t>q.a?'#journey-right':'#journey-left';if(next!==held){if(held)await release();if(next)await hold(next);held=next;}await p.waitForTimeout(40);}if(held)await release();await dialogue();assert.deepEqual(await p.evaluate(()=>meadowGame.state.hill.lights),['hope']);
 // Invalid milestones cannot unlock later levels.
 const invalid=await p.evaluate(()=>{const s=Meadow.Progress.fresh();s.chapter=4;s.valley={metBeaver:true,bridge:3,raft:4,completed:true};s.hill={metSquirrel:true,lights:['hope','hope','bad','memory','courage'],signal:true,reunited:true,completed:true};Meadow.Progress.write(s);return Meadow.Progress.read();});assert.equal(invalid.chapter,1);assert.equal(invalid.valley.completed,false);assert.equal(invalid.hill.completed,false);
 assert.deepEqual(errors,[]);console.log('PASS touch star tracking, timed help, pause release, reduced motion, responsive layout and invalid save validation');await browser.close();
})().catch(async e=>{console.error(e);if(browser)await browser.close();process.exit(1);});
