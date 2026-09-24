const {chromium}=require('playwright');const assert=require('node:assert/strict');const path=require('node:path');let browser;
(async()=>{
 browser=await chromium.launch({channel:'msedge',headless:true});const p=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 async function dialogue(){for(let i=0;i<50&&await p.evaluate(()=>meadowGame.state.mode==='dialogue');i++)await p.locator('#dialogue-next').click();}
 async function reload(){await p.reload();await p.waitForFunction(()=>window.meadowGame);await p.locator('#start-btn').click();}
 const pose=()=>p.evaluate(()=>{const g=meadowGame,w=g.world;return {t:g.story.elapsed,mode:g.state.mode,player:g.player.mesh.position.toArray(),mom:w.mother.mesh.position.toArray(),villain:w.villain.mesh.visible,enemy:w.villain.mesh.position.toArray(),struggling:w.struggling,falling:w.falling,tilt:[w.mother.mesh.rotation.x,w.villain.mesh.rotation.x],protecting:w.protecting,swept:w.sweptAway,float:w.floatwood.visible};});
 await p.goto('http://127.0.0.1:4173/find_mom_3d/');await p.waitForFunction(()=>window.meadowGame);
 await p.locator('#select-chapter-btn').click();await p.locator('[data-chapter="2"]').click();await dialogue();
 await p.evaluate(()=>{const g=meadowGame;Object.assign(g.state.forest,{metOwl:true,round:3,gustStage:6});g.checkpoint(2,-3.35);g.player.setPosition(2,-3.35);g.interactions.update();});
 await p.keyboard.press('e');assert.equal(await p.evaluate(()=>meadowGame.world.hug),true);await dialogue();
 await p.waitForFunction(()=>meadowGame.story.elapsed>2.1);let q=await pose();assert(q.villain&&q.protecting&&!q.swept);assert(q.player[0]>3.8&&q.player[2]>-5.35);
 await p.screenshot({path:path.join(__dirname,'forest-protection.png')});
 await p.waitForFunction(()=>meadowGame.story.elapsed>4.1);q=await pose();assert(q.struggling&&!q.swept&&q.villain);assert(Math.hypot(q.mom[0]-q.enemy[0],q.mom[2]-q.enemy[2])<1.5);assert(q.mom[2]>-5.35&&q.enemy[2]>-5.35);await p.screenshot({path:path.join(__dirname,'forest-grapple.png')});
 await p.keyboard.press('Escape');const frozen=await pose();await p.waitForTimeout(300);assert.deepEqual(await pose(),frozen);await p.locator('#resume-btn').click();
 await p.waitForFunction(()=>meadowGame.story.elapsed>6.2);q=await pose();assert(q.swept&&q.falling&&q.villain&&!q.float);assert(q.tilt[0]>.4&&q.tilt[1]<-.4);assert(q.mom[2]<-5.35&&q.enemy[2]<-5.35);assert(q.player[2]>-5.35);await p.screenshot({path:path.join(__dirname,'forest-fall-together.png')});
 await p.keyboard.press('Escape');const fallen=await pose();await p.waitForTimeout(200);assert.deepEqual(await pose(),fallen);await p.locator('#resume-btn').click();await p.waitForFunction(()=>meadowGame.story.elapsed>7.2);q=await pose();assert(q.swept&&q.float&&q.villain&&!q.falling);
 await p.screenshot({path:path.join(__dirname,'forest-swept-away.png')});
 await reload();assert.equal((await pose()).mode,'cutscene');assert((await pose()).t<1);assert.equal(await p.evaluate(()=>meadowGame.state.forest.separated),false);
 await p.waitForFunction(()=>meadowGame.story.elapsed>8);q=await pose();assert(q.swept&&q.villain&&q.mom[0]>7&&q.enemy[0]>6);
 await p.waitForFunction(()=>meadowGame.state.mode==='dialogue');assert.equal(await p.evaluate(()=>meadowGame.world.mother.mesh.visible||meadowGame.world.villain.mesh.visible),false);assert.equal(await p.evaluate(()=>meadowGame.state.forest.separated),true);assert.match(await p.locator('#dialogue-text').textContent(),/保護我.*灰爪|一起掉進河裡/);await dialogue();
 assert.equal(await p.evaluate(()=>meadowGame.interactions.candidates().some(i=>i.id==='mother')),false);assert.equal(await p.evaluate(()=>meadowGame.world.canWalk(2,-8)),false);
 await reload();assert.equal((await pose()).mode,'playing');assert.equal(await p.evaluate(()=>meadowGame.world.mother.mesh.visible),false);
 await p.evaluate(()=>meadowGame.story.interact('owl'));await dialogue();assert.equal(await p.evaluate(()=>meadowGame.trials.kind),'dash');assert.equal(await p.evaluate(()=>meadowGame.state.forest.routeKnown),true);await p.locator('#action-leave').click();
 // Completed route still leads into the new rescue explanation in chapter three.
 await p.evaluate(()=>{const g=meadowGame;g.state.forest.dashStage=3;g.story.interact('forest-exit');});await dialogue();await p.locator('#next-chapter-btn').click();assert.match(await p.locator('#dialogue-text').textContent(),/灰爪|沖走/);await p.locator('#dialogue-next').click();assert.match(await p.locator('#dialogue-text').textContent(),/接住.*浮木/);await dialogue();
 console.log('PASS mother grapples with villain, both tumble and drift downstream, child stays on bank; pause/reload; downstream rescue story and route remain playable');
 // Replay the scene with touch controls, reduced motion and responsive cameras.
 const phone=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});phone.on('pageerror',e=>errors.push(e.message));await phone.goto('http://127.0.0.1:4173/find_mom_3d/');await phone.waitForFunction(()=>window.meadowGame);
 const seed=await p.evaluate(()=>{const s=Meadow.Progress.fresh();s.entryChapter=s.chapter=2;s.prologueSeen=true;Object.assign(s.forest,{metOwl:true,round:3,gustStage:6,reunited:true});return s;});
 await phone.evaluate(s=>Meadow.Progress.write(s),seed);await phone.reload();await phone.waitForFunction(()=>window.meadowGame);await phone.locator('#start-btn').tap();await phone.waitForFunction(()=>meadowGame.story.elapsed>7.2);await phone.locator('#pause-btn').tap();const still=await phone.evaluate(()=>meadowGame.story.elapsed);await phone.waitForTimeout(200);assert.equal(await phone.evaluate(()=>meadowGame.story.elapsed),still);await phone.locator('#resume-btn').tap();
 await phone.screenshot({path:path.join(__dirname,'forest-flood-phone.png')});await phone.setViewportSize({width:844,height:390});await phone.screenshot({path:path.join(__dirname,'forest-flood-landscape.png')});
 await phone.waitForFunction(()=>meadowGame.state.mode==='dialogue');assert.equal(await phone.evaluate(()=>meadowGame.state.forest.separated),true);
 await phone.locator('#pause-btn').tap();await phone.locator('#restart-btn').tap();assert.equal(await phone.evaluate(()=>meadowGame.world.villain.mesh.visible||meadowGame.world.floatwood.visible||meadowGame.world.flood.visible),false);assert.equal(await phone.evaluate(()=>meadowGame.world.mother.mesh.visible),true);assert.equal(await phone.evaluate(()=>meadowGame.world.struggling||meadowGame.world.falling||meadowGame.world.mother.mesh.rotation.x!==0||meadowGame.world.villain.mesh.rotation.x!==0),false);
 assert.deepEqual(errors,[]);console.log('PASS touch pause, portrait/landscape flood scene, reduced motion and replay cleanup; no runtime errors');await browser.close();
})().catch(async e=>{console.error(e);if(browser)await browser.close();process.exit(1);});
