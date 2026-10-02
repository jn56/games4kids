const {chromium}=require('playwright'),assert=require('node:assert/strict');let browser;
const url='http://127.0.0.1:4173/find_mom_3d/';
async function ready(p){await p.goto(url);await p.waitForFunction(()=>window.meadowGame);}
async function finish(p){
  for(let i=0;i<60&&await p.evaluate(()=>meadowGame.state.mode==='dialogue');i++){
    if(await p.locator('#dialogue-next').isHidden())return;
    await p.locator('#dialogue-next').click();
  }
}
async function seed(p,c){await p.evaluate(c=>{const g=meadowGame,s=Meadow.Progress.fresh();s.chapter=s.entryChapter=c;s.prologueSeen=true;g.saved=s;g.start(true);},c);}
async function resident(p,i){await p.evaluate(i=>{const g=meadowGame;Meadow.SideStories.talk(g,g.world.residents[i]);},i);}
(async()=>{
  browser=await chromium.launch({channel:'msedge',headless:true,args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']});
  const context=await browser.newContext({viewport:{width:1280,height:800},permissions:['microphone'],acceptDownloads:true}),p=await context.newPage(),errors=[];
  p.on('pageerror',e=>errors.push(e.message));await ready(p);
  await p.evaluate(()=>{
    const g=meadowGame,show=g.dialogue.show.bind(g.dialogue);window.missingVoiceLines=[];
    g.dialogue.show=(lines,...rest)=>{for(const line of Meadow.Script.pages(lines))if(!g.voices.catalog.has(Meadow.Script.key(line.name,line.text)))missingVoiceLines.push(line);return show(lines,...rest);};
  });
  if(!process.argv.includes('--voice')){
  for(let c=1;c<=4;c++)for(let choice=0;choice<2;choice++){
    await seed(p,c);
    await resident(p,4);await finish(p);assert.equal(await p.evaluate(c=>meadowGame.state.familyStories[c-1],c),0);
    await resident(p,3);await finish(p);
    assert.equal(await p.locator('#dialogue-choices button').count(),2);
    await p.locator('#dialogue-choices button').nth(choice).click();
    assert.equal(await p.evaluate(c=>meadowGame.state.familyStories[c-1],c),0,'no save until reply is finished');await finish(p);
    assert.equal(await p.evaluate(c=>Meadow.Progress.read().familyStories[c-1],c),choice+1);
    await p.evaluate(()=>{meadowGame.saved=Meadow.Progress.read();meadowGame.start(true);});
    await resident(p,4);await finish(p);assert.equal(await p.evaluate(c=>meadowGame.state.familyStories[c-1],c),choice+3);
    for(const i of [3,4]){await resident(p,i);await finish(p);}
    assert.equal(await p.evaluate(c=>Meadow.Progress.read().familySecrets[c-1],c),3);
    assert.equal(await p.evaluate(()=>meadowGame.state.forest.round+meadowGame.state.valley.bridge+meadowGame.state.hill.lights.length),0);
  }
  assert.deepEqual(await p.evaluate(()=>missingVoiceLines),[],'all played new lines must be recordable before playing');
  console.log('PASS eight branching outcomes, eight eggs, save/reload and complete voice coverage');
  // Exercise the whole mother/wolf sequence through actual keyboard and touch UI.
  for(const touch of [false,true]){
    await p.setViewportSize(touch?{width:390,height:844}:{width:1280,height:800});
    await seed(p,2);
    await p.evaluate(()=>{const g=meadowGame;Object.assign(g.state.forest,{metOwl:true,round:3,gustStage:6});g.story.interact('mother');});await finish(p);
    await p.waitForFunction(()=>meadowGame.story.rescue.kind==='dialogue');await finish(p);
    assert.equal(await p.evaluate(()=>meadowGame.story.rescue.kind),'retreat');
    await p.keyboard.press('Escape');const elapsed=await p.evaluate(()=>meadowGame.story.elapsed);await p.waitForTimeout(150);assert.equal(await p.evaluate(()=>meadowGame.story.elapsed),elapsed);await p.locator('#resume-btn').click();
    if(touch){for(let i=0;i<5;i++)await p.locator('#rescue-action').click();}
    else{await p.keyboard.down('ArrowRight');await p.waitForTimeout(1700);await p.keyboard.up('ArrowRight');}
    await p.waitForFunction(()=>meadowGame.story.rescue.kind==='dialogue');await finish(p);
    assert.equal(await p.evaluate(()=>meadowGame.story.rescue.kind),'whistle');
    for(let i=0;i<2;i++)if(touch)await p.locator('#rescue-action').click();else await p.keyboard.press('e');
    assert.equal(await p.evaluate(()=>meadowGame.story.rescue.progress),2);
    await p.keyboard.press('Escape');await p.locator('#resume-btn').click();
    if(touch)await p.locator('#rescue-action').click();else await p.keyboard.press('e');
    await p.waitForFunction(()=>meadowGame.state.mode==='dialogue');await finish(p);
    await p.waitForFunction(()=>meadowGame.story.elapsed>=7.1);
    assert.match(await p.locator('#story-caption').textContent(),/小米，快逃啊/);
    assert(await p.evaluate(()=>meadowGame.world.sweptAway&&meadowGame.world.villain.mesh.visible));
    await p.waitForFunction(()=>meadowGame.state.forest.separated);await finish(p);
    assert(await p.locator('#rescue-ui').isHidden());assert.equal(await p.evaluate(()=>meadowGame.player.mesh.position.z>-5.35),true);
  }
  assert.deepEqual(await p.evaluate(()=>missingVoiceLines),[]);
  console.log('PASS mom/wolf grappling dialogue, two player actions, pause, fall together, shout; desktop and phone');
  }
  // Start fresh UI; recordings use a synthetic Chromium microphone only.
  await p.reload();await p.waitForFunction(()=>window.meadowGame);await p.locator('#voice-open').click();
  await p.waitForFunction(()=>meadowGame.voices.db);assert((await p.locator('#voice-lines option').count())>500);
  await p.locator('#voice-search').fill('快逃');assert.equal(await p.locator('#voice-lines option').count(),1);
  assert.equal(await p.locator('#voice-name').textContent(),'媽媽');
  await p.locator('#voice-record').click();await p.waitForFunction(()=>meadowGame.voices.capture?.recorder?.state==='recording');
  await p.waitForTimeout(1300);await p.locator('#voice-record').click();await p.waitForFunction(()=>!meadowGame.voices.capture&&meadowGame.voices.records.size===1);
  const stored=await p.evaluate(()=>{const v=meadowGame.voices,t=[...v.records.values()][0];return {key:t.key,size:t.blob.size};});assert(stored.size>0);
  await p.locator('#voice-listen').click();await p.waitForFunction(()=>meadowGame.voices.audio&&!meadowGame.voices.audio.paused);
  await p.locator('#voice-role').selectOption('小米');assert.equal(await p.evaluate(()=>meadowGame.voices.audio),null);
  await p.locator('#voice-role').selectOption('媽媽');
  const downloadPromise=p.waitForEvent('download');await p.locator('#voice-export').click();const download=await downloadPromise;
  const stream=await download.createReadStream(),chunks=[];for await(const chunk of stream)chunks.push(chunk);const backup=Buffer.concat(chunks);assert.equal(JSON.parse(backup).takes.length,1);
  await p.reload();await p.waitForFunction(()=>window.meadowGame);await p.locator('#voice-open').click();await p.waitForFunction(()=>meadowGame.voices.records.size===1);await p.locator('#voice-search').fill('快逃');
  await p.locator('#voice-delete').click();await p.waitForFunction(()=>meadowGame.voices.records.size===0);
  await p.locator('#voice-file').setInputFiles({name:'voices.json',mimeType:'application/json',buffer:backup});await p.waitForFunction(()=>meadowGame.voices.records.size===1);
  const original=await p.evaluate(()=>[...meadowGame.voices.records.values()][0].blob.size);assert.equal(original,stored.size);
  // Cancelling a rerecord must release the microphone and preserve the old take.
  await p.locator('#voice-record').click();await p.waitForFunction(()=>meadowGame.voices.capture?.recorder?.state==='recording');
  await p.evaluate(()=>window.testTracks=meadowGame.voices.capture.stream.getTracks());await p.keyboard.press('Escape');
  await p.waitForFunction(()=>!document.getElementById('voice-studio').open&&testTracks.every(t=>t.readyState==='ended'));
  assert.equal(await p.evaluate(()=>testTracks.every(t=>t.readyState==='ended')),true);assert.equal(await p.evaluate(()=>[...meadowGame.voices.records.values()][0].blob.size),stored.size);
  await p.locator('#voice-open').click();
  await p.evaluate(()=>{window.oldGet=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);navigator.mediaDevices.getUserMedia=async()=>{throw new DOMException('denied','NotAllowedError');};});
  await p.locator('#voice-record').click();await p.waitForFunction(()=>!meadowGame.voices.capture);assert.match(await p.locator('#voice-status').textContent(),/未取得麥克風/);
  // A late permission grant after closing must not leave the microphone on.
  await p.evaluate(()=>{navigator.mediaDevices.getUserMedia=()=>new Promise(resolve=>window.grantLate=resolve);});await p.locator('#voice-record').click();await p.keyboard.press('Escape');
  await p.evaluate(async()=>{const stream=await oldGet({audio:true});window.lateTracks=stream.getTracks();grantLate(stream);navigator.mediaDevices.getUserMedia=oldGet;});
  await p.waitForFunction(()=>lateTracks.every(t=>t.readyState==='ended'));
  // Live recorded playback follows the sound toggle, pause and dialogue boundaries.
  await p.locator('#start-btn').click();await p.evaluate(()=>{meadowGame.prologue.reset();meadowGame.dialogue.show([{name:'媽媽',text:'小米，快逃啊！'},{name:'小米',text:'媽媽，我們一起走回家吧。'}]);});
  await p.waitForFunction(()=>meadowGame.voices.audio&&!meadowGame.voices.audio.paused);
  await p.keyboard.press('Escape');assert.equal(await p.evaluate(()=>meadowGame.voices.audio),null);await p.locator('#resume-btn').click();await p.waitForFunction(()=>meadowGame.voices.audio);
  await p.locator('#dialogue-next').click();assert.equal(await p.evaluate(()=>meadowGame.voices.audio),null);
  await p.locator('#sound-btn').click();await p.evaluate(()=>meadowGame.dialogue.show([{name:'媽媽',text:'小米，快逃啊！'}]));assert.equal(await p.evaluate(()=>meadowGame.voices.audio),null);
  assert.deepEqual(errors,[]);console.log('PASS actual MediaRecorder save/reload, preview, export/import, cancel, permission rejection/late grant, playback/pause/mute');
  await browser.close();
})().catch(async error=>{console.error(error);if(browser)await browser.close();process.exit(1);});
