const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const output = path.join(__dirname, '../.qa');
const catalog = {window:{}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../shared/catalog.js'),'utf8'),catalog);
const games = catalog.window.GameCatalog.map(game=>game.id);
const sizes = [{width:1440,height:900}, {width:390,height:844}, {width:320,height:568}, {width:844,height:390}];
let browser;
const errors = [];
async function open(context, id) {
  const page = await context.newPage();
  page.on('pageerror', e => errors.push(id + ': ' + e.message));
  await page.goto('http://127.0.0.1:4174/' + id + '/');
  await page.waitForTimeout(100);
  return page;
}
async function tapBoard(page, point) {
  const b = await page.locator('#gameCanvas').boundingBox();
  const logical = await page.locator('#gameCanvas').evaluate(c => ({width:+c.dataset.logicalWidth,height:+c.dataset.logicalHeight}));
  await page.touchscreen.tap(b.x + point.x * b.width / logical.width, b.y + point.y * b.height / logical.height);
}
(async () => {
  fs.mkdirSync(output, {recursive:true});
  browser = await chromium.launch({headless:true, channel:'msedge'});
  for (const viewport of sizes) {
    const context = await browser.newContext({viewport, deviceScaleFactor:viewport.width < 900 ? 3 : 2, hasTouch:true});
    for (const id of games) {
      const page = await open(context, id);
      await page.keyboard.press('Space');
      await page.waitForTimeout(120);
      if (id === 'dice_3d') await page.evaluate(() => {for(let i=0;i<15;i++){finalResult=i%6+1;recordHistory();}});
      const result = await page.evaluate(() => {
        const c = document.querySelector('#gameCanvas,#canvas3d'), box = c.getBoundingClientRect();
        const stats = document.querySelector('.garden-dice-stats'), map = document.querySelector('.minimap-container');
        const inside = (inner, outer) => inner.top >= outer.top - 1 && inner.bottom <= outer.bottom + 1 && inner.left >= outer.left - 1 && inner.right <= outer.right + 1;
        return {
          noScroll:document.documentElement.scrollWidth <= innerWidth && document.documentElement.scrollHeight <= innerHeight,
          sharp:Math.abs(c.width-box.width*Math.min(devicePixelRatio,c.id==='canvas3d'?2:3))<=1 && Math.abs(c.height-box.height*Math.min(devicePixelRatio,c.id==='canvas3d'?2:3))<=1,
          mapSharp:!map || (()=>{const canvas=map.querySelector('canvas'),b=canvas.getBoundingClientRect(),density=Math.min(devicePixelRatio,3);return Math.abs(canvas.width-b.width*density)<=1 && Math.abs(canvas.height-b.height*density)<=1;})(),
          sidebar:!stats || (stats.getBoundingClientRect().left >= box.right && [...stats.querySelectorAll('.history-item')].every(row => inside(row.getBoundingClientRect(),stats.getBoundingClientRect()) && [...row.children].filter(e=>e.getClientRects().length).every(e=>inside(e.getBoundingClientRect(),row.getBoundingClientRect())))),
          mapClear:!map || map.getBoundingClientRect().top >= document.querySelector('.hud-header').getBoundingClientRect().bottom + 8
        };
      });
      assert(result.noScroll, id+' no scrolling');
      assert(result.sidebar, id+' sidebar and record contents fit');
      assert(result.mapClear, id+' minimap clears HUD');
      assert(result.sharp,id+' crisp high density canvas');
      assert(result.mapSharp,id+' crisp high density minimap');
      if (id === 'dice_3d') {
        assert(await page.evaluate(() => {
          camera.updateMatrixWorld();
          return Array.from({length:64},(_,i) => new THREE.Vector3(4.27*Math.cos(i*Math.PI/32),0,4.27*Math.sin(i*Math.PI/32)).project(camera)).every(p=>Math.abs(p.x)<1 && Math.abs(p.y)<1);
        }), 'entire dice tray fits camera');
      }
      if (id.endsWith('tag_3d') || id === 'monster_maze_3d') {
        await page.evaluate(() => {document.querySelector('.hud-header').style.minHeight='115px';});
        await page.waitForTimeout(100);
        assert(await page.evaluate(()=>document.querySelector('.minimap-container').getBoundingClientRect().top >= document.querySelector('.hud-header').getBoundingClientRect().bottom+8),id+' taller HUD reflows minimap');
        await page.evaluate(() => {document.querySelector('.hud-header').style.minHeight='';});
        await page.waitForTimeout(100);
      }
      if (viewport.width===390 || viewport.width===1440) await page.screenshot({path:path.join(output,`display-${id}-${viewport.width}.png`),scale:'css'});
      await page.keyboard.press('Escape');
      await page.setViewportSize({width:viewport.height,height:viewport.width});
      await page.waitForTimeout(100);
      assert(await page.evaluate(()=>{const c=document.querySelector('#gameCanvas,#canvas3d'),b=c.getBoundingClientRect(),ratio=Math.min(devicePixelRatio,c.id==='canvas3d'?2:3);return Math.abs(c.width-b.width*ratio)<=1 && Math.abs(c.height-b.height*ratio)<=1;}),id+' resolution follows orientation while paused');
      if (id.endsWith('tag_3d') || id==='monster_maze_3d') assert(await page.evaluate(()=>{const c=document.querySelector('#minimapCanvas');return c.getContext('2d').getImageData(0,0,c.width,c.height).data.some(value=>value!==0);}),id+' minimap redraws while paused');
      console.log('PASS display '+id+' '+viewport.width+'x'+viewport.height);
      await page.close();
    }
    await context.close();
  }
  const touch = await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:3,hasTouch:true,isMobile:true});
  let page = await open(touch, 'memory_match');
  await page.keyboard.press('Space');
  const pair = await page.evaluate(() => cards.filter(c=>c.emoji===cards[0].emoji).map(c=>({x:c.x+c.w/2,y:c.y+c.h/2})));
  await tapBoard(page,pair[0]);
  await page.setViewportSize({width:844,height:390});
  await page.waitForTimeout(120);
  assert.equal(await page.evaluate(()=>flippedCards.length),1);
  await tapBoard(page,pair[1]);
  await page.waitForFunction(()=>matchedPairs===1);
  console.log('PASS memory: high density touch and rotation preserve card selection');
  await page.close();
  page = await open(touch,'simon_says');
  await page.evaluate(()=>window.coverBeforeStart=canvas.toDataURL());
  await page.keyboard.press('Space');
  assert(await page.evaluate(()=>canvas.toDataURL()!==window.coverBeforeStart),'Simon redraws immediately after start');
  await page.waitForFunction(()=>!isPlayingSequence);
  const target = await page.evaluate(()=>{const [x,y]=[[65,-65],[65,65],[-65,65],[-65,-65]][sequence[0]];return{x:cx+x,y:cy+y};});
  await tapBoard(page,target);
  await page.waitForFunction(()=>sequence.length===2);
  await page.setViewportSize({width:844,height:390});
  await page.waitForFunction(()=>!isPlayingSequence);
  assert.equal(await page.evaluate(()=>sequence.length),2);
  for(const i of await page.evaluate(()=>[...sequence])) {await page.keyboard.press(['ArrowUp','ArrowRight','ArrowDown','ArrowLeft'][i]);await page.waitForTimeout(240);}
  await page.waitForFunction(()=>sequence.length===3);
  console.log('PASS Simon: immediate start, high density touch, rotation and keyboard sequence');
  await page.close();
  const poses=[];
  for(const id of ['animal_tag_3d','pikmin_tag_3d']) {
    page=await open(touch,id);await page.keyboard.press('Space');await page.keyboard.press('Escape');
    poses.push(await page.evaluate(()=>{player.x=3;player.z=3;player.angle=.7;player.y=0;updateCamera();return{position:camera.position.toArray(),rotation:camera.quaternion.toArray(),fov:camera.fov};}));
    await page.close();
  }
  assert.deepEqual(poses[0].position,[3-Math.cos(.7)*.44,.98,3-Math.sin(.7)*.44],'animal chase camera remains unchanged');
  assert.deepEqual(poses[1].position,[3-Math.cos(.7)*1.4,1.9,3-Math.sin(.7)*1.4],'Pikmin camera sits farther back and higher');
  assert.equal(poses[1].fov,70,'Pikmin uses a narrower field of view');
  console.log('PASS chase camera: wider forest view with the same 70-degree lens');
  for (const id of ['maze_adventure','animal_tag_3d','model_viewer_3d']) {
    page=await open(touch,id);await page.keyboard.press('Space');await page.keyboard.press('Escape');
    const session=await touch.newCDPSession(page);
    for (const density of [1,2]) {
      await session.send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:density,mobile:true});
      await page.waitForFunction(expected=>{const c=document.querySelector('#gameCanvas,#canvas3d'),b=c.getBoundingClientRect();return Math.abs(c.width-b.width*expected)<=1 && Math.abs(c.height-b.height*expected)<=1;},density);
    }
    await session.detach();await page.close();
    console.log('PASS '+id+': density change redraws at the same viewport size');
  }
  assert.deepEqual(errors,[],'no JavaScript errors');
  await browser.close();
})().catch(async error => {console.error(error);if(browser)await browser.close();process.exitCode=1;});
