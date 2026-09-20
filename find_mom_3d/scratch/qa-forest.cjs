const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
let browser;
const results=[];const pass=name=>{results.push(name);console.log('PASS '+name)};
const url='http://127.0.0.1:4173/find_mom_3d/';
async function firstCompleted(page){
  await page.evaluate(()=>{
    const s=Meadow.Progress.fresh();Object.assign(s,{ribbon:true,metRabbit:true,metHedgehog:true,windSolved:true,windTurns:[1,1,2,1,1,3,0,1,1],flowers:['sun','heart','star'],arrangement:['ribbon','sun','heart','star'],lit:true,completed:true});
    Meadow.Progress.write(s);
  });
  await page.reload();await page.waitForFunction(()=>window.meadowGame);await page.locator('#start-btn').click();
}
(async()=>{
  browser=await chromium.launch({channel:'msedge',headless:true});
  const context=await browser.newContext({viewport:{width:1440,height:900}}),page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const state=()=>page.evaluate(()=>JSON.parse(JSON.stringify(meadowGame.state)));
  const pos=()=>page.evaluate(()=>({x:meadowGame.player.mesh.position.x,z:meadowGame.player.mesh.position.z}));
  const shot=name=>page.screenshot({path:path.join(__dirname,name+'.png')});
  async function finishDialogue(){for(let i=0;i<12&&(await state()).mode==='dialogue';i++)await page.locator('#dialogue-next').click()}
  async function move(x,z){
    for(let i=0;i<45;i++){
      const p=await pos(),dx=x-p.x,dz=z-p.z;if(Math.hypot(dx,dz)<.23)return;
      const axis=Math.abs(dx)>Math.abs(dz)?'x':'z',difference=axis==='x'?dx:dz,key=axis==='x'?(difference>0?'d':'a'):(difference>0?'s':'w');
      await page.keyboard.down(key);await page.waitForTimeout(Math.min(450,Math.max(25,Math.abs(difference)/4.5*1000)));await page.keyboard.up(key);
    }
    throw new Error('Movement stuck: '+JSON.stringify({target:{x,z},position:await pos()}));
  }
  async function interact(id){await page.waitForFunction(id=>meadowGame.interactions.current?.id===id,id);await page.keyboard.press('e');await finishDialogue()}
  async function play(){await page.locator('#song-replay').click();await page.waitForFunction(()=>!meadowGame.song.demo&&meadowGame.song.ready)}
  async function notes(sequence){for(const id of sequence)await page.locator(`[data-note="${id}"]`).click()}
  await page.goto(url);await page.waitForFunction(()=>window.meadowGame);await firstCompleted(page);
  assert.equal((await state()).mode,'complete');await page.locator('#next-chapter-btn').click();await finishDialogue();
  assert.equal((await state()).chapter,2);assert.equal((await state()).completed,true);
  assert.equal(await page.evaluate(()=>meadowGame.worldCache[1].layer.visible),false);
  assert.equal(await page.evaluate(()=>meadowGame.worldCache[1].world.labels.every(l=>l.el.hidden)),true);
  pass('First chapter ending enters an independent forest with preserved first-chapter completion');
  assert.equal(await page.evaluate(()=>meadowGame.world.canWalk(2,-2.8)),false);
  assert.equal(await page.evaluate(()=>meadowGame.world.canWalk(2,-8)),false);
  await move(0,4.1);await interact('music');assert.equal((await state()).mode,'playing');assert.equal((await state()).forest.metOwl,false);
  await move(-1.4,5.5);await interact('owl');assert.equal((await state()).forest.metOwl,true);
  await page.locator('#journal-btn').click();assert.match(await page.locator('#dialogue-text').textContent(),/旋律/);await finishDialogue();
  await move(0,4.1);await interact('music');assert.equal((await state()).mode,'puzzle');
  pass('Owl story and notebook unlock music; gate and river prevent skipping');
  assert.equal(await page.locator('[data-note="leaf"]').isDisabled(),true);
  await page.locator('#song-replay').click();await page.waitForFunction(()=>meadowGame.song.demo?.index===0);
  assert.equal(await page.locator('[data-note="leaf"]').isDisabled(),true);
  await page.keyboard.press('Digit1');assert.deepEqual((await state()).forest.input,[]);
  await page.keyboard.press('Escape');const frozen=await page.evaluate(()=>meadowGame.song.demo.elapsed);
  await page.waitForTimeout(350);assert.equal(await page.evaluate(()=>meadowGame.song.demo.elapsed),frozen);
  await page.locator('#resume-btn').click();await page.waitForFunction(()=>!meadowGame.song.demo&&meadowGame.song.ready);
  await shot('song-desktop');
  await notes(['star']);assert.equal((await state()).forest.round,0);assert.equal((await state()).forest.mistakes[0],1);
  await page.keyboard.press('Digit1');await page.keyboard.press('Digit2');await page.keyboard.press('Digit3');
  assert.equal((await state()).forest.round,1);assert.equal(await page.locator('#song-next').isVisible(),true);
  pass('Visual demonstration works while muted, rejects early input, pauses in place, and accepts keyboard notes');
  await page.locator('#song-next').click();await play();await notes(['star','leaf']);
  await page.locator('#song-close').click();await page.reload();await page.waitForFunction(()=>window.meadowGame);await page.locator('#start-btn').click();
  assert.equal((await state()).chapter,2);assert.equal((await state()).forest.round,1);assert.deepEqual((await state()).forest.input,['star','leaf']);
  await interact('music');assert.equal(await page.locator('[data-note="drop"]').isEnabled(),true);await notes(['drop','leaf']);assert.equal((await state()).forest.round,2);
  pass('Completed rounds and partial melody survive closing the puzzle and reloading');
  await page.locator('#song-next').click();await play();
  await notes(['drop']);assert.equal((await state()).forest.round,2);assert.deepEqual((await state()).forest.input,[]);
  await notes(['drop']);await notes(['drop']);assert.equal((await state()).forest.assists[2],1);assert.equal(await page.locator('#song-score').isVisible(),true);
  await page.locator('#song-hint').click();assert.match(await page.locator('#song-feedback').textContent(),/星星鈴/);
  await page.locator('#song-hint').click();assert.match(await page.locator('#song-score').textContent(),/作答順序/);
  await shot('song-reverse');
  await notes(['star','leaf','star','leaf','drop']);await finishDialogue();
  assert.equal((await state()).forest.round,3);assert.equal((await state()).mode,'playing');
  pass('Five-note reversal rejects the forward order; graduated hints help without erasing earlier rounds');
  await move(2,0);await move(2,-3.35);
  assert.equal(await page.evaluate(()=>meadowGame.world.canWalk(2,-2.8)),true);
  assert.equal(await page.evaluate(()=>meadowGame.world.canWalk(2,-8)),false);
  await move(11,-3.5);await interact('forest-exit');assert.equal((await state()).forest.completed,false);await move(2,-3.35);
  await page.keyboard.press('e');assert.equal((await state()).mode,'dialogue');assert.equal(await page.evaluate(()=>meadowGame.world.hug),true);
  await shot('forest-reunion');await finishDialogue();assert.equal((await state()).mode,'cutscene');
  const before=await pos();await page.keyboard.down('w');await page.waitForTimeout(200);await page.keyboard.up('w');assert.deepEqual(await pos(),before);
  await page.keyboard.press('Escape');const cutTime=await page.evaluate(()=>meadowGame.story.elapsed);await page.waitForTimeout(300);assert.equal(await page.evaluate(()=>meadowGame.story.elapsed),cutTime);
  await page.locator('#resume-btn').click();
  await page.waitForFunction(()=>meadowGame.story.elapsed>2.2);
  await page.reload();await page.waitForFunction(()=>window.meadowGame);await page.locator('#start-btn').click();assert.equal((await state()).mode,'cutscene');
  await page.waitForFunction(()=>meadowGame.story.elapsed>=5.1);
  assert(await page.evaluate(()=>meadowGame.world.mother.mesh.position.z)<-12);
  assert.equal(await page.evaluate(()=>meadowGame.world.bridgeTarget),0);
  await shot('forest-bridge');await page.waitForFunction(()=>meadowGame.state.mode==='dialogue');await finishDialogue();
  assert.equal((await state()).forest.separated,true);assert.equal((await state()).forest.routeKnown,false);
  pass('Real reunion, safe bridge sequence, blocked movement, pause and mid-scene reload all complete correctly');
  await move(11,-3.5);await interact('forest-exit');assert.equal((await state()).forest.completed,false);
  await move(4,-3.8);await interact('owl');assert.equal((await state()).forest.routeKnown,true);
  await shot('forest-route');await move(11,-3.5);
  assert(await page.evaluate(()=>meadowGame.world.owl.mesh.position.x)>7,'Owl accompanies the child toward the exit');
  await interact('forest-exit');assert.equal((await state()).forest.completed,true);
  assert.equal((await state()).mode,'complete');assert.equal(await page.locator('#next-chapter-btn').isVisible(),false);await shot('forest-ending');
  pass('Owl provides the alternate route; second chapter has its own ending without opening unfinished chapters');
  await page.reload();await page.waitForFunction(()=>window.meadowGame);await page.locator('#start-btn').click();assert.equal((await state()).mode,'complete');
  await page.locator('#replay-btn').click();await finishDialogue();assert.equal((await state()).chapter,2);assert.equal((await state()).completed,true);assert.deepEqual((await state()).forest,await page.evaluate(()=>Meadow.Progress.forestFresh()));
  assert.equal(await page.evaluate(()=>meadowGame.worldCache[1].world.labels.every(l=>l.el.hidden)),true);
  pass('Ending survives reload; replay resets only the forest and reuses the correct scene');
  // A v2 save can enter the new chapter; malformed chapter-two milestones cannot skip prerequisites.
  const migrated=await page.evaluate(()=>{const s=Meadow.Progress.read();s.version=2;s.chapter=1;delete s.forest;localStorage.setItem(CONFIG.SAVE_KEY,JSON.stringify(s));return Meadow.Progress.read()});
  assert.equal(migrated.version,3);assert.equal(migrated.completed,true);assert.equal(migrated.chapter,1);
  const invalid=await page.evaluate(()=>{const s=Meadow.Progress.fresh();s.chapter=2;s.forest={metOwl:true,round:3,reunited:true,separated:true,routeKnown:true,completed:true};localStorage.setItem(CONFIG.SAVE_KEY,JSON.stringify(s));return Meadow.Progress.read()});
  assert.equal(invalid.chapter,1);assert.equal(invalid.forest.completed,false);
  pass('Version-two saves migrate and invalid second-chapter milestones are rejected');
  // Simulate disabled storage only after loading a valid chapter-one completion.
  await firstCompleted(page);await page.evaluate(()=>{Storage.prototype.setItem=()=>{throw new Error('blocked')};Storage.prototype.getItem=()=>{throw new Error('blocked')}});
  await page.locator('#next-chapter-btn').click();await finishDialogue();assert.equal((await state()).chapter,2);await page.keyboard.press('Escape');await page.locator('#restart-btn').click();await finishDialogue();assert.equal((await state()).chapter,2);
  pass('Chapter transition and forest restart work with blocked browser storage');
  assert.deepEqual(errors,[]);pass('No browser runtime errors throughout the forest playthrough');
  fs.writeFileSync(path.join(__dirname,'qa-forest-results.json'),JSON.stringify({passed:results.length,checks:results,errors},null,2));
  await browser.close();
})().catch(async error=>{console.error(error);if(browser)await browser.close();process.exitCode=1});
