const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const path=require('node:path');
let browser;
(async()=>{
  browser=await chromium.launch({channel:'msedge',headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const state=()=>page.evaluate(()=>JSON.parse(JSON.stringify(meadowGame.state)));
  async function dialogue(){for(let i=0;i<35&&(await state()).mode==='dialogue';i++)await page.locator('#dialogue-next').click();}
  async function reload(){await page.reload();await page.waitForFunction(()=>window.meadowGame);}
  async function npc(chapter){
    await page.evaluate(c=>{const g=meadowGame,p=c===2?[-2.4,6.2]:c===3?[-3,8.2]:[-2,9.2];g.player.setPosition(...p);g.interactions.update();},chapter);
    await page.keyboard.press('e');await dialogue();
  }
  await page.goto('http://127.0.0.1:4173/find_mom_3d/');await page.waitForFunction(()=>window.meadowGame);
  await page.locator('#select-chapter-btn').click();await page.keyboard.press('Escape');assert.equal(await page.locator('#chapter-picker').isVisible(),false);assert.equal((await state()).mode,'title');
  for(const chapter of [2,3,4,1]){
    if((await state()).mode!=='title')await reload();
    await page.locator('#select-chapter-btn').click();await page.locator(`[data-chapter="${chapter}"]`).click();
    assert.equal((await state()).chapter,chapter);assert.equal((await state()).entryChapter,chapter);assert.equal((await state()).completed,false);
    if(chapter===1){assert.equal(await page.locator('#prologue-skip').isVisible(),true);await page.locator('#prologue-skip').click();await dialogue();assert.equal((await state()).prologueSeen,true);continue;}
    await dialogue();await npc(chapter);
    const field={2:['forest','metOwl'],3:['valley','metBeaver'],4:['hill','metSquirrel']}[chapter];assert.equal((await state())[field[0]][field[1]],true);
    await reload();await page.locator('#start-btn').click();assert.equal((await state()).chapter,chapter);assert.equal((await state())[field[0]][field[1]],true);
    assert.equal((await state()).completed,false);if(chapter>2)assert.equal((await state()).forest.completed,false);if(chapter===4)assert.equal((await state()).valley.completed,false);
  }
  console.log('PASS all four chapters start directly; NPC progress survives reload without awarding skipped chapters; chapter one keeps prologue');
  // Opening and cancelling from pause must preserve the active challenge and saved state.
  await page.keyboard.press('Escape');await page.locator('#pause-chapters-btn').click();await page.locator('[data-chapter="3"]').click();await dialogue();await npc(3);
  await page.evaluate(()=>{meadowGame.player.setPosition(0,4.5);meadowGame.interactions.update();});await page.keyboard.press('e');await page.locator('#journey-start').click();
  await page.keyboard.press('Escape');const paused=await state(),time=await page.evaluate(()=>meadowGame.expedition.elapsed);
  await page.locator('#pause-chapters-btn').click();const savedBefore=await page.evaluate(()=>localStorage.getItem(CONFIG.SAVE_KEY));
  for(let i=0;i<8;i++){await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.closest('#chapter-picker')!==null),true);}
  await page.keyboard.press('Escape');assert.deepEqual(await state(),paused);assert.equal(await page.evaluate(()=>meadowGame.expedition.elapsed),time);assert.equal(await page.evaluate(()=>localStorage.getItem(CONFIG.SAVE_KEY)),savedBefore);
  await page.locator('#resume-btn').click();assert.equal((await state()).mode,'journey');
  await page.keyboard.press('Escape');await page.locator('#pause-chapters-btn').click();await page.locator('[data-chapter="4"]').click();await dialogue();
  assert.equal(await page.evaluate(()=>meadowGame.expedition.active),false);assert.equal(await page.evaluate(()=>meadowGame.expedition.root===null||meadowGame.expedition.root===undefined),true);
  assert.equal(await page.evaluate(()=>Object.entries(meadowGame.worldCache).every(([id,w])=>w.layer.visible===(id==='4'))),true);
  console.log('PASS pause/cancel preserves challenge and save; keyboard focus stays in picker; selecting cleans up old challenge and scene');
  // A selected chapter can still advance normally and retain its explicit entry on reload.
  await page.keyboard.press('Escape');await page.locator('#pause-chapters-btn').click();await page.locator('[data-chapter="2"]').click();await dialogue();
  await page.evaluate(()=>{const g=meadowGame;Object.assign(g.state.forest,{metOwl:true,round:3,gustStage:6,dashStage:3,reunited:true,separated:true,routeKnown:true,completed:true});g.saveProgress();g.showEnding();});
  await page.locator('#ending-chapters-btn').click();await page.locator('#chapter-picker-close').click();assert.equal((await state()).mode,'complete');
  await page.locator('#next-chapter-btn').click();await dialogue();await npc(3);await reload();await page.locator('#start-btn').click();assert.equal((await state()).chapter,3);assert.equal((await state()).entryChapter,2);assert.equal((await state()).valley.metBeaver,true);
  const legacy=await page.evaluate(()=>{const s=Meadow.Progress.fresh();delete s.entryChapter;s.chapter=4;Meadow.Progress.write(s);return Meadow.Progress.read();});assert.equal(legacy.entryChapter,1);assert.equal(legacy.chapter,1);
  const invalid=await page.evaluate(()=>{const s=Meadow.Progress.fresh();s.entryChapter=99;s.chapter=4;Meadow.Progress.write(s);return Meadow.Progress.read();});assert.equal(invalid.chapter,1);
  console.log('PASS selected chapter advances to next, ending picker cancels safely, old saves retain validation');
  await page.evaluate(()=>{Storage.prototype.setItem=()=>{throw Error('blocked')};Storage.prototype.getItem=()=>{throw Error('blocked')};});
  await page.keyboard.press('Escape');await page.locator('#pause-chapters-btn').click();await page.locator('[data-chapter="4"]').click();await dialogue();assert.equal((await state()).chapter,4);await npc(4);await page.keyboard.press('Escape');await page.locator('#restart-btn').click();await dialogue();assert.equal((await state()).chapter,4);assert.equal((await state()).hill.metSquirrel,false);
  console.log('PASS selection and replay work when storage is unavailable');
  const phone=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});phone.on('pageerror',e=>errors.push(e.message));await phone.goto('http://127.0.0.1:4173/find_mom_3d/');await phone.waitForFunction(()=>window.meadowGame);
  for(const [width,height] of [[390,844],[320,568],[844,390]]){
    await phone.setViewportSize({width,height});const entry=await phone.locator('#select-chapter-btn').boundingBox();assert(entry.y+entry.height<=height&&entry.x+entry.width<=width);
    await phone.locator('#select-chapter-btn').tap();for(const id of ['[data-chapter="1"]','[data-chapter="4"]','#chapter-picker-close']){const b=await phone.locator(id).boundingBox();assert(b.x>=0&&b.y>=0&&b.x+b.width<=width&&b.y+b.height<=height,id+' clipped');}
    if(width!==320)await phone.screenshot({path:path.join(__dirname,`chapters-${width<height?'phone':'landscape'}.png`)});
    await phone.locator('#chapter-picker-close').tap();
  }
  await phone.locator('#select-chapter-btn').tap();await phone.locator('[data-chapter="4"]').tap();assert.equal(await phone.evaluate(()=>meadowGame.state.chapter),4);
  assert.deepEqual(errors,[]);console.log('PASS mobile portrait/landscape layout, touch selects fourth chapter, no browser runtime errors');await browser.close();
})().catch(async error=>{console.error(error);if(browser)await browser.close();process.exit(1);});
