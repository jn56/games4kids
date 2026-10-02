const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path');let browser;
(async()=>{
  browser=await chromium.launch({channel:'msedge',headless:true,args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']});
  const context=await browser.newContext({permissions:['microphone']}),p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto('http://127.0.0.1:4173/find_mom_3d/');await p.waitForFunction(()=>window.meadowGame);
  for(const [name,size] of Object.entries({desktop:{width:1280,height:800},phone:{width:390,height:844},landscape:{width:844,height:390}})){
    await p.setViewportSize(size);await p.locator('#voice-open').click();await p.waitForFunction(()=>meadowGame.voices.catalog.size>500&&document.getElementById('voice-lines').options.length>0);
    await p.locator('#voice-role').selectOption('媽媽');await p.locator('#voice-search').fill('快逃');
    assert.equal(await p.locator('#voice-text').textContent(),'小米，快逃啊！');
    for(const id of ['voice-close','voice-role','voice-search','voice-record','voice-listen','voice-next','voice-export']){
      await p.locator('#'+id).scrollIntoViewIfNeeded();const r=await p.locator('#'+id).boundingBox();assert(r&&r.x>=0&&r.x+r.width<=size.width+1&&r.y>=0&&r.y+r.height<=size.height+1,id+' fits '+name);
    }
    await p.locator('#voice-record').scrollIntoViewIfNeeded();await p.screenshot({path:path.join(__dirname,'voice-studio-'+name+'.png')});
    await p.keyboard.press('Tab');assert(await p.evaluate(()=>!!document.activeElement.closest('#voice-studio')));
    await p.locator('#voice-close').click();
  }
  await p.setViewportSize({width:1280,height:800});await p.locator('#voice-open').click();
  await p.locator('#voice-record').click();await p.waitForFunction(()=>meadowGame.voices.capture?.recorder?.state==='recording');await p.waitForTimeout(600);await p.locator('#voice-record').click();await p.waitForFunction(()=>meadowGame.voices.records.size===1&&!meadowGame.voices.capture);
  const original=await p.evaluate(()=>[...meadowGame.voices.records.values()][0].blob.size);
  // Full disk/transaction failure must never overwrite a working take or claim success.
  await p.evaluate(()=>{const v=meadowGame.voices;window.writeTake=v.write;v.write=async()=>{throw new DOMException('full','QuotaExceededError');};});
  await p.locator('#voice-record').click();await p.waitForFunction(()=>meadowGame.voices.capture?.recorder?.state==='recording');
  assert(await p.locator('#voice-role').isDisabled());assert(await p.locator('#voice-next').isDisabled());
  await p.waitForTimeout(350);await p.locator('#voice-record').click();await p.waitForFunction(()=>!meadowGame.voices.capture);assert.match(await p.locator('#voice-status').textContent(),/儲存失敗/);
  assert.equal(await p.evaluate(()=>[...meadowGame.voices.records.values()][0].blob.size),original);
  await p.evaluate(()=>meadowGame.voices.write=writeTake);
  const invalid=await p.evaluate(()=>{const v=meadowGame.voices,lines=[...v.catalog.values()].filter(l=>!v.records.has(Meadow.Script.key(l.name,l.text)));return {format:'little-lights-voices',version:1,takes:[{...lines[0],type:'audio/webm',data:'AA=='},{...lines[1],type:'audio/webm',data:'!invalid!'}]};});
  await p.locator('#voice-file').setInputFiles({name:'broken.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(invalid))});await p.waitForFunction(()=>!meadowGame.voices.busy);assert.match(await p.locator('#voice-status').textContent(),/匯入失敗/);assert.equal(await p.evaluate(()=>meadowGame.voices.records.size),1);
  await p.locator('#voice-record').click();await p.waitForFunction(()=>meadowGame.voices.capture?.recorder?.state==='recording');await p.waitForTimeout(300);
  await p.evaluate(()=>{window.tracks=meadowGame.voices.capture.stream.getTracks();meadowGame.voices.capture.started-=31000;});await p.waitForFunction(()=>!meadowGame.voices.capture);assert.equal(await p.evaluate(()=>tracks.every(t=>t.readyState==='ended')),true);
  await p.locator('#voice-close').click();
  // Captions are updated every frame but each recorded cue should start only once.
  await p.locator('#start-btn').click();await p.evaluate(()=>{const g=meadowGame;g.prologue.reset();g.dialogue.close();g.state.mode='cutscene';g.voices.cueCount=0;const play=g.voices.playSequence.bind(g.voices);g.voices.playSequence=lines=>{g.voices.cueCount++;play(lines);};const caption=document.getElementById('story-caption');caption.hidden=false;caption.textContent='媽媽：「小米，快逃啊！」';});
  for(let i=0;i<5;i++)await p.evaluate(()=>document.getElementById('story-caption').textContent='媽媽：「小米，快逃啊！」');
  assert.equal(await p.evaluate(()=>meadowGame.voices.cueCount),1);
  const noDB=await context.newPage();await noDB.addInitScript(()=>Object.defineProperty(window,'indexedDB',{value:{open(){throw new Error('disabled');}}}));await noDB.goto('http://127.0.0.1:4173/find_mom_3d/');await noDB.waitForFunction(()=>window.meadowGame);await noDB.locator('#voice-open').click();assert(await noDB.locator('#voice-record').isDisabled());assert.match(await noDB.locator('#voice-status').textContent(),/無法儲存/);
  assert.deepEqual(errors,[]);console.log('PASS desktop/phone/landscape, keyboard focus, full storage, atomic malformed import, recording time limit, caption cue once, storage-disabled fallback');await browser.close();
})().catch(async error=>{console.error(error);if(browser)await browser.close();process.exit(1);});
