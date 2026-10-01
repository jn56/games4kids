const {chromium}=require('playwright'),assert=require('node:assert/strict');let browser;
(async()=>{
 browser=await chromium.launch({channel:'msedge',headless:true});const p=await browser.newPage({viewport:{width:390,height:844},hasTouch:true}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('http://127.0.0.1:4173/find_mom_3d/');await p.waitForFunction(()=>window.meadowGame);
 const main=()=>{const {sideStories,sideSecrets,mode,upgraded,...rest}=meadowGame.state;return JSON.stringify(rest);};
 async function open(i){await p.evaluate(i=>{const g=meadowGame,n=g.world.residents[i];g.player.setPosition(n.x,n.z+1.2);g.interactions.update();},i);await p.keyboard.press('e');await p.waitForFunction(()=>meadowGame.state.mode==='dialogue');}
 async function finish(){for(let i=0;i<20&&await p.evaluate(()=>meadowGame.state.mode==='dialogue');i++){const r=await p.locator('#dialogue-next').boundingBox();assert(r.y+r.height<=844);await p.locator('#dialogue-next').tap();}}
 for(let c=1;c<=4;c++){
  await p.evaluate(c=>{const s=Meadow.Progress.fresh();s.chapter=s.entryChapter=c;s.prologueSeen=true;meadowGame.saved=s;meadowGame.start(true);},c);
  const before=await p.evaluate(main);
  await open(2);await finish();assert.equal(await p.evaluate(c=>meadowGame.state.sideStories[c-1],c),0,'out of order cannot complete a step');
  await open(0);await p.evaluate(()=>meadowGame.dialogue.close());assert.equal(await p.evaluate(c=>meadowGame.state.sideStories[c-1],c),0,'unfinished conversation must not award progress');
  for(const [step,npc] of [0,1,2,0].entries()){
   await open(npc);await finish();assert.equal(await p.evaluate(c=>meadowGame.state.sideStories[c-1],c),step+1);
   assert.equal(await p.evaluate(c=>Meadow.Progress.read().sideStories[c-1],c),step+1);
   assert.equal(await p.evaluate(main),before,'side quest must not change the main quest or checkpoint');
   if(step===0){await p.locator('#journal-btn').tap();assert(await p.evaluate(()=>meadowGame.dialogue.lines.some(l=>l.text.includes('下一站'))));await finish();}
   if(step===1)await p.evaluate(()=>{meadowGame.saved=Meadow.Progress.read();meadowGame.start(true);});
  }
  await open(2);await finish();assert.equal(await p.evaluate(c=>meadowGame.state.sideSecrets[c-1],c),true);await open(2);await finish();assert.equal(await p.evaluate(c=>meadowGame.state.sideStories[c-1],c),4);
  await p.evaluate(()=>{meadowGame.dialogue.show([{name:'筆記',text:'旅途回憶'}]);Meadow.SideStories.appendJournal(meadowGame);});assert(await p.evaluate(()=>meadowGame.dialogue.lines.some(l=>l.text.includes('已收藏'))));await finish();
  console.log('PASS chapter '+c+': four-step optional quest, wrong order, cancellation, save/reload, repeatable easter egg, journal, no main-story changes');
 }
 const clean=await p.evaluate(()=>{const s=Meadow.Progress.fresh();s.sideStories=[-3,1.5,99,'4'];s.sideSecrets=[true,true,true,true];Meadow.Progress.write(s);const read=Meadow.Progress.read();return [read.sideStories,read.sideSecrets];});assert.deepEqual(clean,[[0,0,4,0],[false,false,true,false]]);
 assert.deepEqual(errors,[]);await browser.close();
})().catch(async e=>{console.error(e);if(browser)await browser.close();process.exit(1);});
