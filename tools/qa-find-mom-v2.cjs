/* Integration acceptance: real browser, real primary-key input, synthetic mic.
   Long story prerequisites use seeded saves; challenge wins use live controls. */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const url=process.env.GAME_URL||'http://127.0.0.1:4174/find_mom_3d_v2/';
const out=path.resolve(__dirname,'../.qa/find-mom-v2');fs.mkdirSync(out,{recursive:true});
const results=[],errors=[];let browser,p;
function pass(name){results.push(name);console.log('PASS '+name);}
async function load(page=p){await page.goto(url);await page.waitForFunction(()=>window.meadowGame);await page.waitForFunction(()=>meadowGame.voices.db||meadowGame.voices.storageError);}
async function seed(chapter,extra={}){
  await p.evaluate(({chapter,extra})=>{const g=meadowGame,s=Meadow.Progress.fresh();s.chapter=s.entryChapter=chapter;s.prologueSeen=true;for(const [key,value] of Object.entries(extra)){if(value&&typeof value==='object'&&!Array.isArray(value))Object.assign(s[key],value);else s[key]=value;}g.saved=s;g.start(true);}, {chapter,extra});
}
async function talk(){for(let i=0;i<70&&await p.evaluate(()=>meadowGame.state.mode==='dialogue');i++){if(await p.locator('#dialogue-next').isHidden())return;await keyTo('#dialogue-next');await p.keyboard.press('Space');}}
async function keyTo(selector){
  if(await p.locator(selector).isHidden()&&await p.locator(selector).evaluate(el=>!!el.closest('#pause-settings'))){await keyTo('#pause-more');await p.keyboard.press('Space');}
  for(let i=0;i<90;i++){
    if(await p.evaluate(selector=>document.activeElement?.matches(selector),selector))return;
    await p.keyboard.press('ArrowRight');
  }
  throw new Error('Cannot reach by keyboard: '+selector+'; active '+await p.evaluate(()=>document.activeElement?.tagName+'#'+document.activeElement?.id+'; mode '+meadowGame.state.mode));
}
async function activate(selector){await keyTo(selector);await p.keyboard.press('Space');}
async function choose(select,value){await keyTo(select);const q=await p.locator(select).evaluate((s,value)=>({now:s.selectedIndex,target:[...s.options].findIndex(o=>o.value===value)}),value);assert(q.target>=0);for(let i=0;i<Math.abs(q.target-q.now);i++)await p.keyboard.press(q.target>q.now?'ArrowDown':'ArrowUp');}
async function pause(){await p.keyboard.press('Escape');assert.equal(await p.evaluate(()=>meadowGame.state.mode),'paused');const time=await p.evaluate(()=>meadowGame.time);await p.waitForTimeout(180);assert.equal(await p.evaluate(()=>meadowGame.time),time);await p.keyboard.press('Escape');}
async function screenshot(name){await p.screenshot({path:path.join(out,name+'.png')});}
async function steerLoop(read,done,limit=85000){let held=null;const end=Date.now()+limit;while(!await p.evaluate(done)&&Date.now()<end){const q=await p.evaluate(read),key=Math.abs(q.x-q.t)<.025?null:q.t>q.x?'ArrowRight':'ArrowLeft';if(key!==held){if(held)await p.keyboard.up(held);if(key)await p.keyboard.down(key);held=key;}if(q.shoot)await p.keyboard.press('Space');await p.waitForTimeout(35);}if(held)await p.keyboard.up(held);assert(await p.evaluate(done),'live steering timed out');}
async function core(){
  await screenshot('cover-desktop');await p.keyboard.press('Space');assert.equal(await p.evaluate(()=>meadowGame.state.mode),'dialogue');
  await talk();assert.equal(await p.evaluate(()=>meadowGame.state.mode),'cutscene');await p.keyboard.press('Space');await talk();assert.equal(await p.evaluate(()=>meadowGame.state.mode),'playing');
  await p.keyboard.down('ArrowUp');await p.waitForTimeout(430);await p.keyboard.up('ArrowUp');assert(await p.evaluate(()=>meadowGame.player.mesh.position.z<CONFIG.START.z));
  await p.keyboard.press('Space');await talk();assert(await p.evaluate(()=>meadowGame.state.ribbon));
  await pause();pass('keyboard title, prologue, walking, ribbon dialogue, pause/resume');
  await p.keyboard.press('Escape');await activate('#pause-characters');await choose('#character-role','小米');await keyTo('#character-name');await p.keyboard.press('Control+A');await p.keyboard.type('小安');await p.keyboard.press('Escape');await activate('#character-save');assert.equal(await p.evaluate(()=>meadowGame.identity.names['小米']),'小安');
  await p.keyboard.press('Escape');await p.keyboard.press('Escape');
  await p.evaluate(()=>meadowGame.dialogue.show([{name:'小米',text:'媽媽，我們一起走回家吧。'}]));await p.waitForTimeout(210);assert.equal(await p.locator('#dialogue-name').textContent(),'小安');await talk();
  await p.reload();await p.waitForFunction(()=>window.meadowGame);assert.equal(await p.evaluate(()=>meadowGame.identity.names['小米']),'小安');pass('all-role name editor with primary keys, renamed dialogue and persistence');
  await seed(1);await p.evaluate(()=>{const l=meadowGame.living;l.reset();l.enabled=true;l.cooldown=.03;});await p.waitForFunction(()=>meadowGame.living.event);await p.evaluate(()=>{meadowGame.living.reset();meadowGame.living.start('mosquito');});
  await p.waitForTimeout(250);const before=await p.evaluate(()=>meadowGame.living.event.elapsed);await p.keyboard.press('Escape');await p.waitForTimeout(250);assert.equal(await p.evaluate(()=>meadowGame.living.event.elapsed),before);await p.keyboard.press('Escape');
  await screenshot('mosquito');await p.keyboard.press('Space');assert.equal(await p.evaluate(()=>meadowGame.living.event.hits),1);await p.keyboard.press('Space');assert.equal(await p.evaluate(()=>meadowGame.living.event),null);
  const main=await p.evaluate(()=>JSON.stringify({flowers:meadowGame.state.flowers,wind:meadowGame.state.windSolved,parcel:meadowGame.state.playgrounds}));
  await p.evaluate(()=>{const l=meadowGame.living;l.reset();l.bank=2;l.save();l.start('monkey');});await p.waitForFunction(()=>meadowGame.living.event?.stolen,null,{timeout:12000});assert.equal(await p.evaluate(()=>meadowGame.living.bank),1);await screenshot('monkey');
  await p.evaluate(()=>{const g=meadowGame,m=g.living.monkey.position;g.player.setPosition(m.x,m.z);});await p.keyboard.press('Space');assert.equal(await p.evaluate(()=>meadowGame.living.bank),2);assert.equal(await p.evaluate(()=>meadowGame.living.event),null);
  assert.equal(await p.evaluate(()=>JSON.stringify({flowers:meadowGame.state.flowers,wind:meadowGame.state.windSolved,parcel:meadowGame.state.playgrounds})),main);
  await p.evaluate(()=>{const l=meadowGame.living;l.start('monkey');l.event.stolen=true;l.bank--;l.save();l.reset();});assert.equal(await p.evaluate(()=>meadowGame.living.bank),2);
  await p.evaluate(()=>{const g=meadowGame;g.living.start('mosquito');g.dialogue.show([{name:'小米',text:'等等，我在讀故事。'}]);});const frozen=await p.evaluate(()=>meadowGame.living.event.elapsed);await p.waitForTimeout(250);assert.equal(await p.evaluate(()=>meadowGame.living.event.elapsed),frozen);await talk();
  await p.evaluate(()=>meadowGame.living.reset());pass('scheduled events, mosquito defence, monkey theft/recovery, story isolation, refunds, dialogue/pause freeze');
  await p.evaluate(()=>{const l=meadowGame.living;l.start('mosquito');l.event.elapsed=9.98;});await p.waitForFunction(()=>!meadowGame.living.event);await p.waitForFunction(()=>meadowGame.player.speedMultiplier<1);await p.waitForFunction(()=>meadowGame.player.speedMultiplier===1);pass('missed mosquito reaction slows briefly and automatically recovers');
  await p.keyboard.press('Escape');await activate('#pause-missions');assert(await p.locator('#errand-board').evaluate(el=>el.open));await activate('#errand-list [data-errand="race"]');assert.equal(await p.evaluate(()=>meadowGame.errands.choice()),'race');
  await p.keyboard.press('Escape');await activate('#pause-journal');assert(['puzzle','dialogue'].includes(await p.evaluate(()=>meadowGame.state.mode)));await talk();pass('keyboard pause menu, mission routing and notes');
  await p.keyboard.press('Escape');await activate('#pause-fullscreen');await p.waitForFunction(()=>!!document.fullscreenElement);await activate('#pause-fullscreen');await p.waitForFunction(()=>!document.fullscreenElement);await p.keyboard.press('Escape');pass('fullscreen accessible through arrows/Space in pause menu');
}
async function chapters(){
  await p.evaluate(()=>meadowGame.living.enabled=false);
  await seed(1,{ribbon:true,metRabbit:true,metHedgehog:true});await p.evaluate(()=>meadowGame.challenges.open('wind'));
  assert.equal(await p.locator('[data-tile]').count(),16);await keyTo('[data-tile="0"]');await p.keyboard.press('ArrowDown');assert.equal(await p.evaluate(()=>document.activeElement.dataset.tile),'4');
  for(let i=0;i<16;i++){const turns=await p.evaluate(i=>(CONFIG.WIND_SOLUTION[i]-meadowGame.state.windTurns[i]+4)%4,i);await keyTo(`[data-tile="${i}"]`);for(let j=0;j<turns;j++)await p.keyboard.press('Space');}
  await screenshot('wind-keyboard');await activate('#puzzle-submit');await talk();assert(await p.evaluate(()=>meadowGame.state.windSolved));
  await p.evaluate(()=>{meadowGame.state.flowers=['sun','heart','star'];meadowGame.challenges.open('lamp');});
  const solution=await p.evaluate(()=>{function perm(a){return a.length?a.flatMap((x,i)=>perm(a.filter((_,j)=>j!==i)).map(v=>[x,...v])):[[]];}return perm(CONFIG.LAMP_ITEMS.map(v=>v.id)).filter(a=>Meadow.PuzzleRules.lampSolved(a));});assert.equal(solution.length,1);
  for(const [i,id] of solution[0].entries()){await activate(`[data-item="${id}"]`);await activate(`[data-slot="${i}"]`);}await activate('#puzzle-submit');await talk();assert(await p.evaluate(()=>meadowGame.state.lit));pass('chapter 1: 16 linked pipes + unique 6-item lamp solved by arrows/Space');
  await seed(2,{forest:{metOwl:true}});await p.evaluate(()=>meadowGame.song.open());
  for(let round=0;round<3;round++){await activate('#song-replay');await p.waitForFunction(()=>meadowGame.song.ready);const expected=await p.evaluate(()=>Meadow.SongPuzzle.expected(meadowGame.state.forest.round));for(const id of expected)await activate(`[data-note="${id}"]`);await activate('#song-next');}await talk();assert.equal(await p.evaluate(()=>meadowGame.state.forest.round),3);
  await p.evaluate(()=>meadowGame.trials.start('gust'));await p.keyboard.press('Space');assert(await p.evaluate(()=>meadowGame.trials.started));await pause();await screenshot('gust');
  const patterns=[[0],[2],[1],[0,1],[1,2],[0,2],[1,2],[0,1],[0,2],[0,1],[0,2],[1,2],[0,2],[1,2],[0,1],[1,2],[0,1],[0,2]],end=Date.now()+95000;
  while(await p.evaluate(()=>meadowGame.trials.active)&&Date.now()<end){const q=await p.evaluate(()=>({stage:meadowGame.trials.stage,lane:meadowGame.trials.lane})),safe=[0,1,2].find(i=>!patterns[q.stage].includes(i));if(q.lane!==safe){const direction=(safe>q.lane?1:-1)*([8,14,17].includes(q.stage)?-1:1);await p.keyboard.press(direction>0?'ArrowRight':'ArrowLeft');}await p.waitForTimeout(40);}assert.equal(await p.evaluate(()=>meadowGame.state.forest.gustStage),6);await talk();
  await p.evaluate(()=>{const g=meadowGame;Object.assign(g.state.forest,{reunited:true,separated:true,routeKnown:true});g.trials.start('dash');});await p.keyboard.press('Space');await screenshot('river-hop');
  const until=Date.now()+75000;while(await p.evaluate(()=>meadowGame.trials.active)&&Date.now()<until){const q=await p.evaluate(()=>({lane:meadowGame.trials.lane,running:meadowGame.trials.dashRunning,ready:meadowGame.trials.river.ready(),safe:meadowGame.trials.river.safeLane(meadowGame.trials.stage)}));if(!q.running){if(q.lane!==q.safe)await p.keyboard.press(q.safe>q.lane?'ArrowRight':'ArrowLeft');else if(q.ready)await p.keyboard.press('Space');}await p.waitForTimeout(35);}assert.equal(await p.evaluate(()=>meadowGame.state.forest.dashStage),3);await talk();pass('chapter 2: 21-note melodies, 18 gust waves and 9 river jumps with primary keys');
  await seed(2,{forest:{metOwl:true,round:3,gustStage:6}});await p.evaluate(()=>meadowGame.story.interact('mother'));await talk();await p.waitForFunction(()=>meadowGame.story.rescue.kind==='dialogue');await talk();
  await p.keyboard.down('ArrowRight');await p.waitForTimeout(1700);await p.keyboard.up('ArrowRight');await p.waitForFunction(()=>meadowGame.story.rescue.kind==='dialogue');await talk();for(let i=0;i<3;i++)await p.keyboard.press('Space');await p.waitForFunction(()=>meadowGame.state.mode==='dialogue');await talk();await p.waitForFunction(()=>meadowGame.state.forest.separated);await talk();pass('mother rescue: retreat, 3 Space whistles and river cutscene');
  await seed(3,{valley:{metBeaver:true}});await p.evaluate(()=>meadowGame.expedition.start('bridge'));await p.keyboard.press('Space');
  for(let i=0;i<9;i++){await p.waitForFunction(()=>{const e=meadowGame.expedition;return e.cooldown===0&&Math.abs(e.needle-e.bridgeSettings().center)<.025;});await p.keyboard.press('Space');}await talk();assert.equal(await p.evaluate(()=>meadowGame.state.valley.bridge),3);
  await p.evaluate(()=>meadowGame.expedition.start('raft'));await p.keyboard.press('Space');await p.keyboard.press('Space');assert(await p.evaluate(()=>meadowGame.expedition.braking));await pause();await screenshot('raft');
  await steerLoop(()=>({x:meadowGame.expedition.raftX,t:meadowGame.expedition.gateCenter}),()=>!meadowGame.expedition.active);await talk();assert.equal(await p.evaluate(()=>meadowGame.state.valley.raft),4);pass('chapter 3: 9 arithmetic strikes, braking + 12 live water gates');
  await seed(4,{hill:{metSquirrel:true}});
  for(const beacon of ['hope','memory','courage']){await p.evaluate(id=>meadowGame.expedition.start('star',id),beacon);await p.keyboard.press('Space');await screenshot('star-'+beacon);await steerLoop(()=>{const e=meadowGame.expedition;return {x:e.aim,t:e.target,shoot:e.focus>=2.8&&e.aligned&&e.exposure&&e.cooldown===0};},()=>!meadowGame.expedition.active);await talk();}
  assert.equal(await p.evaluate(()=>meadowGame.state.hill.lights.length),3);await p.evaluate(()=>meadowGame.story.interact('signal'));await p.waitForFunction(()=>meadowGame.state.mode==='dialogue');await talk();await p.keyboard.press('Space');await screenshot('escort');
  await steerLoop(()=>({x:meadowGame.expedition.escortX,t:meadowGame.expedition.gateCenter-.2}),()=>!meadowGame.expedition.active);assert.equal(await p.evaluate(()=>meadowGame.state.hill.escort),3);await p.waitForFunction(()=>meadowGame.state.mode==='dialogue');await talk();assert(await p.evaluate(()=>meadowGame.state.hill.reunited));pass('chapter 4: 9 star exposures + 9 live pursuit waves, gate and reunion');
}
async function voice(){
  await load();await activate('#voice-open');assert((await p.locator('#voice-lines option').count())>600);await choose('#voice-role','小皮');
  await activate('#voice-record');await p.waitForFunction(()=>meadowGame.voices.capture?.recorder?.state==='recording');await p.waitForTimeout(1100);await activate('#voice-record');await p.waitForFunction(()=>!meadowGame.voices.capture&&meadowGame.voices.records.size===1);
  const size=await p.evaluate(()=>[...meadowGame.voices.records.values()][0].blob.size);assert(size>0);await activate('#voice-listen');await p.waitForFunction(()=>meadowGame.voices.audio&&!meadowGame.voices.audio.paused);
  const downloadPromise=p.waitForEvent('download');await activate('#voice-export');const dl=await downloadPromise,stream=await dl.createReadStream(),chunks=[];for await(const chunk of stream)chunks.push(chunk);const backup=Buffer.concat(chunks);assert.equal(JSON.parse(backup).takes.length,1);
  await activate('#voice-record');await p.waitForFunction(()=>meadowGame.voices.capture?.recorder?.state==='recording');await p.evaluate(()=>window.testTracks=meadowGame.voices.capture.stream.getTracks());await p.keyboard.press('Escape');await p.waitForFunction(()=>testTracks.every(t=>t.readyState==='ended'));assert.equal(await p.evaluate(()=>meadowGame.voices.records.size),1);
  await p.reload();await p.waitForFunction(()=>window.meadowGame);await activate('#voice-open');await p.waitForFunction(()=>meadowGame.voices.records.size===1);await choose('#voice-role','小皮');await activate('#voice-delete');await p.waitForFunction(()=>meadowGame.voices.records.size===0);
  await p.locator('#voice-file').setInputFiles({name:'voice.json',mimeType:'application/json',buffer:backup});await p.waitForFunction(()=>meadowGame.voices.records.size===1);assert.equal(await p.evaluate(()=>[...meadowGame.voices.records.values()][0].blob.size),size);
  await p.keyboard.press('Escape');await activate('#character-open');await choose('#character-role','小皮');await keyTo('#character-name');await p.keyboard.press('Control+A');await p.keyboard.type('皮皮');await p.keyboard.press('Escape');await activate('#character-save');await p.keyboard.press('Escape');
  await seed(1);await p.evaluate(async()=>{if(!meadowGame.audio.enabled)await meadowGame.audio.toggle();meadowGame.dialogue.show([{name:'小皮',text:Meadow.EventLines[1].text}]);});await p.waitForFunction(()=>meadowGame.voices.audio&&!meadowGame.voices.audio.paused);await p.waitForTimeout(180);assert.equal(await p.locator('#dialogue-name').textContent(),'皮皮');
  await p.keyboard.press('Escape');assert.equal(await p.evaluate(()=>meadowGame.voices.audio),null);await p.keyboard.press('Escape');await p.waitForFunction(()=>meadowGame.voices.audio);await talk();
  await p.keyboard.press('Escape');await activate('#pause-voices');await choose('#voice-role','小皮');await p.evaluate(()=>navigator.mediaDevices.getUserMedia=async()=>{throw new DOMException('denied','NotAllowedError');});await activate('#voice-record');await p.waitForFunction(()=>!meadowGame.voices.capture);assert.match(await p.locator('#voice-status').textContent(),/未取得麥克風/);
  await screenshot('voice-studio');pass('47-role catalogue; actual MediaRecorder, playback, export/import, reload, rename-safe take IDs, pause/cancel, denied microphone');
}
async function layout(){
  await load();await seed(1);
  for(const [width,height] of [[1440,900],[390,844],[320,568],[844,390]]){
    await p.setViewportSize({width,height});await p.waitForTimeout(200);await screenshot(`play-${width}`);
    const q=await p.evaluate(()=>({scroll:document.documentElement.scrollHeight>innerHeight,canvas:{w:meadowGame.renderer.domElement.clientWidth,h:meadowGame.renderer.domElement.clientHeight},perspective:meadowGame.camera.isPerspectiveCamera}));assert.equal(q.scroll,false);assert.equal(q.canvas.w,width);assert.equal(q.canvas.h,height);assert(q.perspective);
    await p.keyboard.press('Escape');await screenshot(`pause-${width}`);await activate('#pause-characters');await screenshot(`names-${width}`);await p.keyboard.press('Escape');await activate('#pause-voices');await screenshot(`voice-${width}`);await p.keyboard.press('Escape');await p.keyboard.press('Escape');
  }
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:3});const phone=await context.newPage();await load(phone);await phone.evaluate(()=>{const g=meadowGame,s=Meadow.Progress.fresh();s.prologueSeen=true;g.saved=s;g.start(true);g.living.start('mosquito');});await phone.locator('#touch-action').tap();await phone.locator('#touch-action').tap();assert.equal(await phone.evaluate(()=>meadowGame.living.event),null);
  await phone.evaluate(()=>{const g=meadowGame,n=g.world.rabbit.mesh.position;g.player.setPosition(n.x,n.z+1.7);g.living.start('mosquito');});await phone.locator('#touch-action').tap();await phone.locator('#touch-action').tap();assert.equal(await phone.evaluate(()=>meadowGame.living.event),null);assert.equal(await phone.evaluate(()=>meadowGame.state.mode),'playing');await context.close();
  pass('desktop + 3 mobile layouts, perspective canvas, resize, keyboard menus and touch mosquito defence');
  const denied=await browser.newContext();await denied.addInitScript(()=>{Storage.prototype.getItem=()=>{throw new DOMException('blocked','SecurityError');};Storage.prototype.setItem=()=>{throw new DOMException('blocked','SecurityError');};});const noStore=await denied.newPage();await load(noStore);await noStore.evaluate(()=>{const g=meadowGame,s=Meadow.Progress.fresh();s.prologueSeen=true;g.saved=s;g.start(true);g.saveProgress();});assert.equal(await noStore.evaluate(()=>meadowGame.state.mode),'playing');await denied.close();pass('blocked localStorage keeps game playable');
  await p.evaluate(()=>meadowGame.renderer.getContext().getExtension('WEBGL_lose_context').loseContext());await p.waitForFunction(()=>meadowGame.state.mode==='error');assert(await p.locator('#error-screen').isVisible());pass('WebGL context loss shows recoverable error');
}
(async()=>{
  browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'msedge',headless:true,args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']});
  const ctx=await browser.newContext({viewport:{width:1440,height:900},permissions:['microphone'],acceptDownloads:true});p=await ctx.newPage();p.on('pageerror',e=>errors.push(e.stack||e.message));p.on('response',r=>{if(r.status()>=400)errors.push('HTTP '+r.status()+' '+r.url());});
  await load();const section=process.argv[2]||'all';if(section==='all'||section==='core')await core();if(section==='all'||section==='chapters')await chapters();if(section==='all'||section==='voice')await voice();if(section==='all'||section==='layout')await layout();
  assert.deepEqual(errors,[]);pass('no browser runtime/resource errors');fs.writeFileSync(path.join(out,'results-'+section+'.json'),JSON.stringify({section,passed:results,errors},null,2));await browser.close();
})().catch(async e=>{console.error(e);if(p)await p.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});fs.writeFileSync(path.join(out,'failed.json'),JSON.stringify({passed:results,error:e.stack,errors},null,2));if(browser)await browser.close();process.exit(1);});
