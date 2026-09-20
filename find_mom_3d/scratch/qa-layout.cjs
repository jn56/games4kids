const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
let browser;
(async () => {
  browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4173/find_mom_3d/');await page.waitForFunction(()=>window.meadowGame);
  for (const kind of ['wind','lamp']) {
    await page.evaluate(kind=>{
      const s=Meadow.Progress.fresh();Object.assign(s,{ribbon:true,metRabbit:true,metHedgehog:true,checkpoint:{x:-6.1,z:-2.7}});
      if(kind==='lamp')Object.assign(s,{windSolved:true,windTurns:[1,1,2,1,1,3,0,1,1],flowers:['sun','heart','star'],checkpoint:{x:4.05,z:4.1}});
      Meadow.Progress.write(s);
    },kind);
    await page.reload();await page.waitForFunction(()=>window.meadowGame);await page.locator('#start-btn').tap();await page.locator('#touch-action').tap();
    for (const [width,height,label] of [[390,844,'mobile'],[844,390,'landscape']]) {
      await page.setViewportSize({width,height});await page.locator('#puzzle-close').scrollIntoViewIfNeeded();
      await page.screenshot({path:path.join(__dirname,`${kind}-${label}.png`)});
      const button=await page.locator('#puzzle-submit').boundingBox();
      assert(button.y>=0&&button.y+button.height<=height,`${kind} ${label}: submit stays in view`);
      if(label==='landscape'){
        const board=await page.locator(kind==='wind'?'.wind-grid':'.memory-board').boundingBox();
        assert(board.y>=0&&board.y+board.height<=height,`${kind} board fully visible`);
      }
      assert.equal(await page.evaluate(()=>document.querySelector('.puzzle-paper').scrollWidth>document.querySelector('.puzzle-paper').clientWidth),false);
      console.log(`PASS ${kind} ${label}: board / action layout`);
    }
    await page.locator('#puzzle-close').tap();
  }
  // Capture the new NPC in the actual garden, without opening a puzzle.
  await page.setViewportSize({width:1440,height:900});
  await page.evaluate(()=>{const s=Meadow.Progress.fresh();Object.assign(s,{ribbon:true,metRabbit:true,checkpoint:{x:-6.1,z:-2.7}});Meadow.Progress.write(s);});
  await page.reload();await page.waitForFunction(()=>window.meadowGame);await page.locator('#start-btn').click();await page.waitForTimeout(1200);
  await page.screenshot({path:path.join(__dirname,'hedgehog.png')});
  assert.deepEqual(errors,[]);await browser.close();
})().catch(async error=>{console.error(error);if(browser)await browser.close();process.exitCode=1;});
