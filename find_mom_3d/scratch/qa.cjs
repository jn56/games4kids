const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const output = __dirname;
const results=[];
let browser;
function pass(name) { results.push(name);console.log('PASS '+name); }
(async()=>{
  browser=await chromium.launch({headless:true,channel:'msedge'});
  const context=await browser.newContext({viewport:{width:1440,height:900}});
  const page=await context.newPage();const errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  const state=()=>page.evaluate(()=>JSON.parse(JSON.stringify(meadowGame.state)));
  const pos=()=>page.evaluate(()=>({x:meadowGame.player.mesh.position.x,z:meadowGame.player.mesh.position.z}));
  async function finishDialogue(){for(let i=0;i<12&&(await state()).mode==='dialogue';i++)await page.locator('#dialogue-next').click();}
  async function move(x,z){
    for(let i=0;i<40;i++){
      const p=await pos(),dx=x-p.x,dz=z-p.z;
      if(Math.hypot(dx,dz)<.22)return;
      const axis=Math.abs(dx)>Math.abs(dz)?'x':'z',difference=axis==='x'?dx:dz;
      const key=axis==='x'?(difference>0?'d':'a'):(difference>0?'s':'w');
      await page.keyboard.down(key);await page.waitForTimeout(Math.min(450,Math.max(25,Math.abs(difference)/4.5*1000)));await page.keyboard.up(key);
    }
    throw new Error('Movement stuck: '+JSON.stringify({target:{x,z},position:await pos()}));
  }
  async function interact(expected){
    const current=await page.evaluate(()=>meadowGame.interactions.current?.id);
    assert.equal(current,expected,'nearby interaction');await page.keyboard.press('e');await finishDialogue();
  }
  await page.goto('http://127.0.0.1:4173/find_mom_3d/');await page.waitForFunction(()=>window.meadowGame);
  await page.locator('#start-btn').click();
  let before=await pos();await page.keyboard.down('w');await page.waitForTimeout(220);await page.keyboard.up('w');assert.deepEqual(await pos(),before);
  await page.keyboard.press('Escape');assert.equal((await state()).mode,'paused');await page.locator('#resume-btn').click();assert.equal((await state()).mode,'dialogue');await finishDialogue();
  pass('Dialogue blocks movement; pause/resume preserves dialogue');
  await move(0,8.8);await interact('ribbon');assert.equal((await state()).ribbon,true);
  await move(1.3,4.9);await interact('rabbit');assert.equal((await state()).metRabbit,true);
  const flowerCount=await page.evaluate(()=>meadowGame.world.flowers.size);await interact('rabbit');assert.equal(await page.evaluate(()=>meadowGame.world.flowers.size),flowerCount);assert.equal((await state()).flowers.length,0);
  pass('Ribbon and NPC objectives; repeated NPC dialogue does not duplicate flowers');
  await page.screenshot({path:path.join(output,'quest.png')});
  await move(1,-12.5);await interact('exit');assert.equal((await state()).completed,false);assert.equal((await state()).lit,false);
  pass('Exit cannot skip the quest');
  assert.equal(await page.evaluate(()=>meadowGame.interactions.candidates().some(item=>item.id==='sun')),false);
  await move(0,-3);await move(-6.1,-2.7);await interact('hedgehog');
  assert.equal((await state()).metHedgehog,true);assert.equal((await state()).mode,'puzzle');
  await page.screenshot({path:path.join(output,'wind-puzzle.png')});
  before=await pos();await page.keyboard.down('w');await page.waitForTimeout(180);await page.keyboard.up('w');assert.deepEqual(await pos(),before);
  await page.locator('#puzzle-submit').click();assert.equal((await state()).windSolved,false);assert.match(await page.locator('#puzzle-feedback').textContent(),/風走過/);
  await page.locator('[data-tile="0"]').click();const savedTurns=(await state()).windTurns;
  await page.keyboard.press('Escape');assert.equal((await state()).mode,'paused');await page.locator('#resume-btn').click();assert.equal((await state()).mode,'puzzle');
  await page.reload();await page.waitForFunction(()=>window.meadowGame);await page.locator('#start-btn').click();assert.deepEqual((await state()).windTurns,savedTurns);await interact('hedgehog');
  pass('Hedgehog story opens wind puzzle; wrong routes, pause and reload preserve work');
  const turnsBeforeHint=(await state()).windTurns;
  await page.locator('#puzzle-hint').click();await page.locator('#puzzle-hint').click();assert.deepEqual((await state()).windTurns,turnsBeforeHint);
  assert.match(await page.locator('#puzzle-hint').textContent(),/示範/);await page.locator('#puzzle-hint').click();
  const turnsAfterHint=(await state()).windTurns;assert(turnsAfterHint.filter((t,i)=>t!==turnsBeforeHint[i]).length===1);
  const solution=[1,1,2,1,1,3,0,1,1];
  for(let i=0;i<9;i++){const turn=(await state()).windTurns[i];for(let n=0;n<(solution[i]-turn+4)%4;n++)await page.locator(`[data-tile="${i}"]`).click();}
  await page.locator('#puzzle-submit').click();assert.equal((await state()).windSolved,true);await finishDialogue();
  await page.locator('#journal-btn').click();assert.match(await page.locator('#puzzle-stage').textContent(),/前面的休息站/);assert.match(await page.locator('#puzzle-notes').textContent(),/待發現/);await page.locator('#puzzle-close').click();
  pass('Nine connected wind tiles deliver mother’s letter; hints are progressive and journal works');
  await move(3,-8);await move(8,-6.3);await interact('heart');assert.deepEqual((await state()).flowers,['heart']);
  await move(1,-3);await move(-8,1.3);await interact('sun');assert.equal((await state()).flowers.length,2);
  pass('Flowers can be collected in a non-fixed order');
  await page.reload();await page.waitForFunction(()=>window.meadowGame);await page.locator('#start-btn').click();assert.equal((await state()).flowers.length,2);assert.equal((await state()).mode,'playing');
  assert.equal(await page.evaluate(()=>meadowGame.world.flowers.get('sun').bloom.visible),false);
  pass('Reload and continue preserve quest and collected objects');
  await move(-5,0);await move(-5,-8.7);await interact('star');assert.equal((await state()).flowers.length,3);
  await move(0,-5);await move(1.5,2);await interact('rabbit');assert.equal((await state()).lit,false);assert.equal((await state()).mode,'puzzle');
  assert.equal(await page.locator('#puzzle-submit').isDisabled(),true);
  const allOrders=await page.evaluate(()=>{
    const permutations=items=>items.length===0?[[]]:items.flatMap((x,i)=>permutations(items.filter((_,j)=>i!==j)).map(rest=>[x,...rest]));
    return permutations(['sun','heart','star','ribbon']).filter(order=>Meadow.PuzzleRules.lampSolved(order));
  });assert.deepEqual(allOrders,[['ribbon','sun','heart','star']]);
  for(const [i,id] of ['sun','heart','star','ribbon'].entries()){await page.locator(`[data-item="${id}"]`).click();await page.locator(`[data-slot="${i}"]`).click();}
  await page.locator('#puzzle-submit').click();assert.equal((await state()).lit,false);assert.equal((await state()).flowers.length,3);assert.equal(await page.locator('.clue-pass').count(),2);assert.equal(await page.locator('.clue-rethink').count(),1);
  await page.screenshot({path:path.join(output,'lamp-puzzle.png')});
  await page.locator('#puzzle-clear').click();await page.locator('[data-item="ribbon"]').click();await page.locator('[data-slot="0"]').click();
  await page.locator('#puzzle-close').click();await page.reload();await page.waitForFunction(()=>window.meadowGame);await page.locator('#start-btn').click();assert.deepEqual((await state()).arrangement,['ribbon',null,null,null]);await interact('rabbit');
  // Native keyboard activation is supported, without requiring drag-and-drop.
  for(const [i,id] of ['ribbon','sun','heart','star'].entries()){
    if(i===0)continue;
    await page.locator(`[data-item="${id}"]`).focus();await page.keyboard.press('Space');
    await page.locator(`[data-slot="${i}"]`).focus();await page.keyboard.press('Enter');
  }
  await page.locator('#puzzle-submit').click();await finishDialogue();assert.equal((await state()).lit,true);
  await page.screenshot({path:path.join(output,'lantern.png')});
  pass('Only one of 24 arrangements solves lamp; wrong answers and reload preserve flowers and slots; keyboard solves it');
  before=await pos();await page.keyboard.press('Escape');await page.keyboard.down('d');await page.waitForTimeout(220);await page.keyboard.up('d');assert.deepEqual(await pos(),before);await page.locator('#resume-btn').click();
  await page.keyboard.down('a');await page.waitForTimeout(100);await page.evaluate(()=>window.dispatchEvent(new Event('blur')));const blurPosition=await pos();await page.waitForTimeout(200);assert.deepEqual(await pos(),blurPosition);await page.keyboard.up('a');
  pass('Pause freezes movement; blur clears held keys');
  const collision=await page.evaluate(()=>({water:meadowGame.world.canWalk(8.2,4.8),bridge:meadowGame.world.canWalk(10,4.8),outside:meadowGame.world.canWalk(30,0),tree:meadowGame.world.canWalk(-12,7)}));
  assert.deepEqual(collision,{water:false,bridge:true,outside:false,tree:false});
  await move(6,8.4);await move(8.2,8.4);await page.keyboard.down('w');await page.waitForTimeout(1400);await page.keyboard.up('w');assert((await pos()).z>6.6);
  await move(8.2,8.4);await move(10,8.4);await move(10,1.2);assert((await pos()).z<1.5);
  pass('Pond blocks walking and its bridge is traversable; trees and boundaries collide');
  await move(3,-2);await move(1,-12.8);await interact('exit');assert.equal((await state()).completed,true);assert.equal((await state()).mode,'complete');
  assert.equal(await page.locator('#ending-screen').isVisible(),true);await page.screenshot({path:path.join(output,'ending.png')});
  pass('Full keyboard playthrough ends at chapter one completion');
  await page.locator('#replay-btn').click();await finishDialogue();assert.equal((await state()).flowers.length,0);assert.equal((await state()).ribbon,false);assert.equal((await state()).lit,false);
  pass('Replay resets all quest objects and state');
  await page.locator('#sound-btn').click();assert.equal(await page.locator('#sound-btn').getAttribute('aria-pressed'),'true');await page.locator('#sound-btn').click();assert.equal(await page.locator('#sound-btn').getAttribute('aria-pressed'),'false');
  pass('Audio can be enabled and muted');
  // Invalid/stale saves are sanitized rather than granting progress or crashing.
  const invalid=await page.evaluate(()=>{localStorage.setItem(CONFIG.SAVE_KEY,JSON.stringify({version:1,ribbon:false,metRabbit:true,flowers:['star','star','bogus'],lit:true,completed:true}));return Meadow.Progress.read();});assert.equal(invalid.metRabbit,false);assert.deepEqual(invalid.flowers,[]);assert.equal(invalid.completed,false);
  pass('Malformed progress cannot unlock later steps');
  const upgraded=await page.evaluate(()=>{localStorage.setItem(CONFIG.SAVE_KEY,JSON.stringify({version:1,ribbon:true,metRabbit:true,flowers:['sun','heart','star'],lit:true,completed:true,checkpoint:{x:1,z:-12}}));return Meadow.Progress.read();});
  assert.equal(upgraded.version,3);assert.equal(upgraded.flowers.length,3);assert.equal(upgraded.lit,false);assert.equal(upgraded.metHedgehog,false);assert.equal(upgraded.completed,false);
  pass('Old saves keep their flowers but cannot skip the new puzzles');
  const mobile=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  const phone=await mobile.newPage();phone.on('pageerror',e=>errors.push(e.message));await phone.goto('http://127.0.0.1:4173/find_mom_3d/');await phone.waitForFunction(()=>window.meadowGame);
  await phone.screenshot({path:path.join(output,'mobile-cover.png')});await phone.locator('#start-btn').tap();await phone.locator('#dialogue-next').tap();await phone.locator('#dialogue-next').tap();await phone.waitForTimeout(200);
  assert.equal(await phone.locator('#joystick').isVisible(),true);assert.equal(await phone.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  const pad=await phone.locator('#joystick').boundingBox();const cx=pad.x+pad.width/2,cy=pad.y+pad.height/2;
  const cdp=await mobile.newCDPSession(phone);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:cx,y:cy,id:1}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:cx,y:cy-32,id:1}]});await phone.waitForTimeout(520);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  assert(await phone.evaluate(()=>meadowGame.player.mesh.position.z)<10);
  await phone.locator('#touch-action').tap();assert.equal(await phone.evaluate(()=>meadowGame.state.mode),'dialogue');
  await phone.screenshot({path:path.join(output,'mobile-dialogue.png')});await phone.locator('#dialogue-next').tap();await phone.locator('#dialogue-next').tap();
  await phone.screenshot({path:path.join(output,'mobile-playing.png')});
  assert.equal(await phone.evaluate(()=>meadowGame.input.axis.z),0);assert.equal(await phone.evaluate(()=>meadowGame.state.ribbon),true);
  pass('390px touch viewport: joystick, interaction, dialogue and pointer release');
  await phone.setViewportSize({width:844,height:390});await phone.waitForTimeout(200);await phone.screenshot({path:path.join(output,'mobile-landscape.png')});
  assert.equal(await phone.locator('#joystick').isVisible(),true);
  pass('Landscape resize retains visible touch controls');
  // Seed a legitimate checkpoint to inspect the two puzzle layouts on a touch device.
  await phone.evaluate(()=>{const s=Meadow.Progress.fresh();Object.assign(s,{ribbon:true,metRabbit:true,metHedgehog:true,checkpoint:{x:-6.1,z:-2.7}});Meadow.Progress.write(s);});
  await phone.reload();await phone.waitForFunction(()=>window.meadowGame);await phone.locator('#start-btn').tap();await phone.locator('#touch-action').tap();
  assert.equal(await phone.evaluate(()=>meadowGame.state.mode),'puzzle');await phone.locator('[data-tile="0"]').tap();assert.equal(await phone.evaluate(()=>meadowGame.state.windTurns[0]),1);
  await phone.screenshot({path:path.join(output,'wind-landscape.png')});
  await phone.setViewportSize({width:390,height:844});await phone.locator('#puzzle-close').scrollIntoViewIfNeeded();await phone.screenshot({path:path.join(output,'wind-mobile.png')});
  assert.equal(await phone.evaluate(()=>document.querySelector('.puzzle-paper').scrollWidth>document.querySelector('.puzzle-paper').clientWidth),false);
  await phone.locator('#puzzle-close').tap();
  await phone.evaluate(()=>{const s=Meadow.Progress.fresh();Object.assign(s,{ribbon:true,metRabbit:true,metHedgehog:true,windSolved:true,windTurns:[1,1,2,1,1,3,0,1,1],flowers:['sun','heart','star'],checkpoint:{x:4.05,z:4.1}});Meadow.Progress.write(s);});
  await phone.reload();await phone.waitForFunction(()=>window.meadowGame);await phone.locator('#start-btn').tap();await phone.locator('#touch-action').tap();
  assert.equal(await phone.evaluate(()=>meadowGame.challenges.kind),'lamp');
  for(const [i,id] of ['ribbon','sun','heart','star'].entries()){await phone.locator(`[data-item="${id}"]`).tap();await phone.locator(`[data-slot="${i}"]`).tap();}
  await phone.locator('#puzzle-close').scrollIntoViewIfNeeded();await phone.screenshot({path:path.join(output,'lamp-mobile.png')});
  await phone.locator('#puzzle-submit').tap();assert.equal(await phone.evaluate(()=>meadowGame.state.mode),'dialogue');
  pass('Both puzzle layouts support mobile touch and scrolling, portrait and landscape');
  const blockedContext=await browser.newContext();const blocked=await blockedContext.newPage();
  await blocked.addInitScript(()=>{Storage.prototype.setItem=function(){throw new Error('denied');};Storage.prototype.getItem=function(){throw new Error('denied');};});
  await blocked.goto('http://127.0.0.1:4173/find_mom_3d/');await blocked.waitForFunction(()=>window.meadowGame);await blocked.locator('#start-btn').click();assert.equal(await blocked.evaluate(()=>meadowGame.state.mode),'dialogue');
  pass('Blocked local storage still allows play');
  const direct=await browser.newPage();await direct.goto(require('node:url').pathToFileURL(path.resolve(__dirname,'../index.html')).href);await direct.waitForFunction(()=>window.meadowGame);await direct.locator('#start-btn').click();assert.equal(await direct.evaluate(()=>meadowGame.state.mode),'dialogue');
  pass('Direct file opening works without a web server');
  assert.deepEqual(errors,[]);pass('No browser JavaScript or console errors');
  fs.writeFileSync(path.join(output,'qa-results.json'),JSON.stringify({date:new Date().toISOString(),browser:'Microsoft Edge / Playwright',passed:results,errors},null,2));
  await browser.close();
})().catch(async e=>{console.error(e);if(browser)await browser.close();process.exitCode=1;});
