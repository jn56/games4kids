const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path');let browser;
(async()=>{
 browser=await chromium.launch({channel:'msedge',headless:true});const p=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('http://127.0.0.1:4173/find_mom_3d/');await p.waitForFunction(()=>window.meadowGame);
 const seed=c=>p.evaluate(c=>{const g=meadowGame,s=Meadow.Progress.fresh();s.chapter=s.entryChapter=c;s.prologueSeen=true;g.saved=s;g.start(true);},c);
 async function finish(){for(let i=0;i<45&&await p.evaluate(()=>meadowGame.state.mode==='dialogue');i++){if(await p.locator('#dialogue-next').isHidden())return;await p.locator('#dialogue-next').click();}}
 for(let c=1;c<=4;c++){
  await seed(c);
  // Approach an NPC with actual keyboard input, then let go and talk.
  const initial=await p.evaluate(()=>{const g=meadowGame,n=g.world.residents[0];n.dodge=null;n.routine.wait=10;g.player.setPosition(n.mesh.position.x,n.mesh.position.z+3);g.view.update(1,false,true);return n.mesh.position.toArray();});
  await p.keyboard.down('ArrowUp');await p.waitForTimeout(280);await p.keyboard.up('ArrowUp');await p.waitForTimeout(140);
  assert.equal(await p.evaluate(()=>meadowGame.interactions.current?.id),`resident-${c}-0`);
  assert(await p.evaluate(a=>meadowGame.world.residents[0].mesh.position.distanceTo(new THREE.Vector3(...a))<.91,initial));
  const stopped=await p.evaluate(()=>meadowGame.world.residents[0].mesh.position.toArray());await p.waitForTimeout(300);assert.deepEqual(await p.evaluate(()=>meadowGame.world.residents[0].mesh.position.toArray()),stopped,'NPC must wait when player releases movement');
  await p.keyboard.press('e');assert.equal(await p.evaluate(()=>meadowGame.state.mode),'dialogue');await p.waitForTimeout(250);assert.deepEqual(await p.evaluate(()=>meadowGame.world.residents[0].mesh.position.toArray()),stopped,'speaker must not dodge while talking');await finish();
  assert.equal(await p.evaluate(()=>meadowGame.state.sideStories[meadowGame.state.chapter-1]),1);
  assert(await p.evaluate(()=>{const g=meadowGame,t=g.errands.target();return t.label===g.world.residents[1].label&&document.getElementById('objective-title').textContent.includes(g.world.residents[1].name);}));
  await p.locator('#objective-title').click();assert.equal(await p.evaluate(()=>meadowGame.state.mode),'errands');assert(await p.locator('#errand-board').isVisible());
  assert((await p.locator('#errand-list').textContent()).includes(await p.evaluate(()=>meadowGame.world.residents[1].name)));
  await p.locator('[data-errand="family"]').click();assert.equal(await p.evaluate(()=>meadowGame.errands.choice()),'family');assert(await p.evaluate(()=>meadowGame.errands.target().label===meadowGame.world.residents[3].label));
  await p.locator('#objective-title').click();await p.locator('[data-errand="story"]').click();assert.equal(await p.evaluate(()=>meadowGame.errands.choice()),'story');
  for(const index of [1,2,0]){
   await p.evaluate(index=>{const g=meadowGame,n=g.world.residents[index];g.player.setPosition(n.mesh.position.x,n.mesh.position.z+1.4);g.interactions.current=null;g.interactions.update();},index);await p.keyboard.press('e');assert.equal(await p.evaluate(()=>meadowGame.state.mode),'dialogue');await finish();
  }
  assert.equal(await p.evaluate(()=>meadowGame.state.sideStories[meadowGame.state.chapter-1]),4);assert.equal(await p.evaluate(()=>meadowGame.errands.choice()),'main');
  await p.locator('#objective-title').click();assert(await p.locator('[data-errand="story"]').isDisabled());await p.keyboard.press('Escape');assert.equal(await p.evaluate(()=>meadowGame.state.mode),'playing');
  console.log('PASS chapter '+c+': keyboard approach, stationary conversation, clear tracked steps, board switching and completed quest');
 }
 // Played dynamic lines that the old generator silently skipped must all be recordable.
 for(const c of [1,3,4]){
  await seed(c);const missing=await p.evaluate(c=>{const g=meadowGame;if(c===1){Object.assign(g.state,{ribbon:true,metRabbit:true,metHedgehog:true,windSolved:true});g.story.interact(CONFIG.FLOWERS[0].id);}else if(c===3)g.story.interact('beaver');else{g.state.hill.reunited=true;g.story.interact('mother');}return g.dialogue.lines.filter(line=>!g.voices.catalog.has(Meadow.Script.key(line.name,line.text)));},c);assert.deepEqual(missing,[]);await finish();
 }
 await seed(2);await p.evaluate(()=>{const g=meadowGame;Object.assign(g.state.forest,{metOwl:true,round:3,gustStage:6,separated:true});g.story.interact('music');});assert.match(await p.locator('#toast').textContent(),/咕咕/);assert.doesNotMatch(await p.locator('#toast').textContent(),/橋邊等/);
 console.log('PASS recorded coverage for live flower/beaver/mother dialogue and correct post-flood guidance');
 // Opening the task board is a real pause, including vehicles, parcels and timers.
 await seed(1);await p.evaluate(()=>{const g=meadowGame;g.sandbox.act({item:g.world.playground.items.find(o=>o.kind==='parcel')});g.sandbox.act({item:g.world.playground.scooter});g.streetRun.start();});
 await p.locator('#objective-title').click();const frozen=await p.evaluate(()=>({time:meadowGame.streetRun.elapsed,people:meadowGame.world.residents.map(n=>n.mesh.position.toArray())}));await p.waitForTimeout(300);assert.deepEqual(await p.evaluate(()=>({time:meadowGame.streetRun.elapsed,people:meadowGame.world.residents.map(n=>n.mesh.position.toArray())})),frozen);assert(await p.evaluate(()=>!!meadowGame.sandbox.held&&!!meadowGame.sandbox.riding));await p.keyboard.press('Escape');assert(await p.evaluate(()=>meadowGame.streetRun.active&&meadowGame.state.mode==='playing'));
 await p.locator('#objective-title').click();await p.locator('[data-errand="parcel"]').click();assert.equal(await p.evaluate(()=>meadowGame.streetRun.active),false);assert(await p.evaluate(()=>meadowGame.errands.target().text.includes(meadowGame.world.locals[1].name)));
 console.log('PASS mission selection pause preserves parcel, scooter and timer; delivery has a named destination');
 // All roles are present before discovering them, including formerly omitted dynamic lines.
 await p.reload();await p.waitForFunction(()=>window.meadowGame);await p.locator('#voice-open').click();await p.waitForFunction(()=>document.getElementById('voice-lines').options.length>0);
 const stats=await p.evaluate(()=>{const v=meadowGame.voices,roles=new Set([...v.catalog.values()].map(l=>l.name)),cast=[...Object.values(Meadow.Residents).flat().map(n=>n.name),...Meadow.Sandbox.names.flat(), '小米','媽媽','阿蹦','栗栗','咕咕','木木','星星','灰爪','旁白'];return {roles:roles.size,lines:v.catalog.size,missing:cast.filter(n=>!roles.has(n))};});assert.deepEqual(stats.missing,[]);assert.equal(stats.roles,45);assert(stats.lines>=627);
 for(const [role,phrase] of [['阿蹦','你已經找到 2 朵光花了。'],['木木','每段要固定三枚鉚釘。'],['星星','正好是望遠鏡缺的鏡片！'],['媽媽','在河邊是我護著你，剛才是你護著我。']]){
  await p.locator('#voice-chapter').selectOption('2');await p.locator('#voice-search').fill('不存在的字');await p.locator('#voice-missing').check();await p.locator('#voice-role').selectOption(role);
  assert.equal(await p.locator('#voice-chapter').inputValue(),'0');assert.equal(await p.locator('#voice-search').inputValue(),'');assert.equal(await p.locator('#voice-missing').isChecked(),false);
  assert(await p.evaluate(({role,phrase})=>{const v=meadowGame.voices;return v.catalog.has(Meadow.Script.key(role,phrase))&&document.getElementById('voice-lines').options.length===[...v.catalog.values()].filter(l=>l.name===role).length;},{role,phrase}));
 }
 await p.locator('#voice-search').fill('沒有');await p.locator('#voice-scope-reset').click();assert((await p.locator('#voice-lines option').count())>0);await p.locator('#voice-close').click();
 console.log('PASS '+stats.roles+' roles / '+stats.lines+' sentences, all author roles, dynamic dialogue and fresh role filters');
 const touch=await browser.newPage({hasTouch:true,isMobile:true,viewport:{width:390,height:844}});touch.on('pageerror',e=>errors.push(e.message));await touch.goto('http://127.0.0.1:4173/find_mom_3d/');await touch.waitForFunction(()=>window.meadowGame);await touch.evaluate(()=>{const g=meadowGame,s=Meadow.Progress.fresh();s.prologueSeen=true;g.saved=s;g.start(true);});
 for(const size of [{width:390,height:844},{width:320,height:568},{width:844,height:390}]){
  await touch.setViewportSize(size);await touch.locator('#objective-title').tap();
  for(const kind of ['story','family','parcel','race']){const b=touch.locator(`[data-errand="${kind}"]`);await b.scrollIntoViewIfNeeded();const r=await b.boundingBox();assert(r.x>=0&&r.y>=0&&r.x+r.width<=size.width+1&&r.y+r.height<=size.height+1,kind+JSON.stringify(r));}
  await touch.locator('[data-errand="story"]').scrollIntoViewIfNeeded();await touch.screenshot({path:path.join(__dirname,'errands-'+size.width+'.png')});await touch.locator('[data-errand="story"]').tap();assert.equal(await touch.evaluate(()=>meadowGame.errands.choice()),'story');
 }
 // Use the mobile interaction button to actually start a conversation.
 await touch.evaluate(()=>{const g=meadowGame,n=g.world.residents[0];g.player.setPosition(n.mesh.position.x,n.mesh.position.z+1.4);g.view.update(1,false,true);g.interactions.update();});await touch.locator('#touch-action').tap();assert.equal(await touch.evaluate(()=>meadowGame.state.mode),'dialogue');await touch.screenshot({path:path.join(__dirname,'talk-mobile.png')});
 assert.deepEqual(errors,[]);console.log('PASS touch task selection in three sizes and actual NPC conversation');await browser.close();
})().catch(async e=>{console.error(e);if(browser)await browser.close();process.exit(1);});
