const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');let browser;
const original=['star','leaf','drop','leaf','star','drop','leaf'];
// Keep the answer independent of the production transform to catch a wrong rule.
const answer=['leaf','drop','leaf','star','drop','leaf','star'];
(async()=>{
 browser=await chromium.launch({channel:'msedge',headless:true});const out=path.join(__dirname,'footsteps');fs.mkdirSync(out,{recursive:true});
 for(const touch of [false,true]){
  const p=await browser.newPage({viewport:touch?{width:390,height:844}:{width:1280,height:800},isMobile:touch,hasTouch:touch}),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto('http://127.0.0.1:4173/find_mom_3d/');await p.waitForFunction(()=>window.meadowGame);
  const click=async selector=>touch?p.locator(selector).tap():p.locator(selector).click();
  await p.evaluate(()=>{const g=meadowGame,s=Meadow.Progress.fresh();s.chapter=s.entryChapter=2;s.prologueSeen=true;s.forest.metOwl=true;s.forest.round=1;g.saved=s;g.start(true);g.song.open();const ring=g.song.ring.bind(g.song);window.played=[];g.song.ring=id=>{window.played.push(id);ring(id);};});
  await click('#song-hint');assert(!(await p.locator('#song-feedback').textContent()).includes('第三段'));assert((await p.locator('#song-feedback').textContent()).includes('第 2 音'));assert((await p.locator('.score-order').textContent()).includes('2 → 3 → 4 → 5 → 6 → 7 → 1'));assert.equal(await p.locator('#song-score .score-note').count(),7);
  await p.screenshot({path:path.join(out,touch?'first-hint-phone.png':'first-hint-desktop.png')});
  await click('#song-replay');await p.waitForFunction(()=>meadowGame.song.ready);assert.deepEqual(await p.evaluate(()=>window.played),original);assert.deepEqual(await p.evaluate(()=>Meadow.SongPuzzle.expected(1)),answer);
  // Copying the first original note is incorrect; the next-note hint agrees with the shift.
  await click('[data-note="star"]');assert.equal(await p.evaluate(()=>meadowGame.state.forest.input.length),0);assert.equal(await p.evaluate(()=>meadowGame.state.forest.mistakes[1]),1);
  await click('#song-hint');assert((await p.locator('#song-feedback').textContent()).includes('葉子鈴'));
  for(let i=0;i<3;i++){if(touch)await click(`[data-note="${answer[i]}"]`);else await p.keyboard.press(String({leaf:1,drop:2,star:3}[answer[i]]));assert.equal(await p.locator('#song-input .score-note').count(),i+1);}
  await p.keyboard.press('Escape');await p.waitForTimeout(100);assert.equal(await p.evaluate(()=>meadowGame.state.forest.input.length),3);await click('#resume-btn');await click('#song-close');
  await p.evaluate(()=>{const g=meadowGame;g.saved=Meadow.Progress.read();g.start(true);g.song.open();});assert.equal(await p.locator('#song-input .score-note').count(),3);assert((await p.locator('#song-feedback').textContent()).includes('第 4 個音'));
  await click('#song-hint');assert((await p.locator('#song-feedback').textContent()).includes('不用再換位'));assert.deepEqual(await p.locator('#song-score .score-note').evaluateAll(nodes=>nodes.map(n=>n.className.replace('score-note note-',''))),answer);
  for(const viewport of touch?[{width:390,height:844},{width:844,height:390}]:[{width:1280,height:800}]){
   await p.setViewportSize(viewport);await p.screenshot({path:path.join(out,`answer-${viewport.width}.png`)});assert(await p.locator('#song-close').isVisible());const bounds=await p.locator('#song-score').evaluate(el=>{const r=el.getBoundingClientRect();return [...el.querySelectorAll('.score-note')].every(n=>{const b=n.getBoundingClientRect();return b.left>=r.left&&b.right<=r.right;});});assert(bounds);
  }
  if(touch)await p.setViewportSize({width:390,height:844});
  for(let i=3;i<7;i++){await click(`[data-note="${answer[i]}"]`);assert.equal(await p.locator('#song-input .score-note').count(),i+1);}
  assert.equal(await p.evaluate(()=>meadowGame.state.forest.round),2);assert(await p.locator('#song-screen').isVisible());await click('#song-next');assert.equal(await p.locator('#song-title').textContent(),'回家的回聲');
  // Correct hint text for the two other rules; no blanket reverse instructions.
  await click('#song-hint');assert((await p.locator('#song-feedback').textContent()).includes('最後一音'));await click('#song-hint');await click('#song-hint');assert((await p.locator('#song-feedback').textContent()).includes('不用再倒過來'));
  await p.evaluate(()=>{const g=meadowGame;g.song.close();g.state.forest.round=0;g.state.forest.input=[];g.song.open();});await click('#song-hint');assert((await p.locator('#song-feedback').textContent()).includes('從左到右'));
  assert.deepEqual(errors,[]);console.log(`PASS ${touch?'touch':'keyboard/mouse'}: seven-note playback/shift, all hint levels, wrong-note retry, pause, saved prefix, final note and next-round transition`);await p.close();
 }
 await browser.close();
})().catch(async e=>{console.error(e);if(browser)await browser.close();process.exit(1);});
