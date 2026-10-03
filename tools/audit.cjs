const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm');
fs.mkdirSync(path.join(__dirname,'../.qa'),{recursive:true});const sandbox={window:{}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../shared/catalog.js'),'utf8'),sandbox);
const report=[];let browser;
(async()=>{
  browser=await chromium.launch({headless:true,channel:'msedge'});
  for(const viewport of [{width:1440,height:900},{width:390,height:844},{width:320,height:568},{width:844,height:390}]){
    const context=await browser.newContext({viewport,isMobile:viewport.width<900,hasTouch:viewport.width<900});
    for(const game of sandbox.window.GameCatalog){
      const page=await context.newPage(),errors=[],badRequests=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)badRequests.push(r.url());});
      await page.goto('http://127.0.0.1:4174/'+game.id+'/',{waitUntil:'domcontentloaded'});await page.waitForTimeout(120);
      const measure=()=>page.evaluate(()=>{
        const canvas=document.querySelector('#gameCanvas,#canvas3d'),c=canvas.getBoundingClientRect(),s=document.querySelector('.garden-stage').getBoundingClientRect();
        const inScreen=b=>b.left>=-1&&b.top>=-1&&b.right<=innerWidth+1&&b.bottom<=innerHeight+1;
        const controls=[...document.querySelectorAll('.garden-nav button,.garden-pad button,.overlay button,.garden-menu-items button,.action-btn,.rot-btn')].filter(e=>e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden');
        return{overflowX:document.documentElement.scrollWidth>innerWidth,overflowY:document.documentElement.scrollHeight>innerHeight,canvasVisible:inScreen(c),canvas:{width:c.width,height:c.height},stage:{width:s.width,height:s.height},maxSize:Math.abs(c.width-s.width)<2||Math.abs(c.height-s.height)<2,clippedControls:controls.filter(e=>!inScreen(e.getBoundingClientRect())).map(e=>e.id||e.textContent),hud:document.querySelector('.hud-header')?getComputedStyle(document.querySelector('.hud-header')).display:null};
      });
      const before=await measure();assert(!before.overflowX&&!before.overflowY,game.id+' no page scroll');assert(before.canvasVisible&&before.maxSize,game.id+' largest complete canvas');assert(before.stage.height>=viewport.height*.75,game.id+' stage uses screen');assert.deepEqual(before.clippedControls,[],game.id+' initial controls fit');
      await page.keyboard.press('Space');await page.waitForTimeout(120);assert.equal(await page.evaluate(()=>document.body.dataset.state),'PLAYING',game.id+' keyboard start');
      await page.keyboard.press('Escape');assert(await page.evaluate(()=>GameShell.paused));
      assert.deepEqual((await measure()).clippedControls,[],game.id+' menu fits');
      const music=await page.evaluate(()=>GameAudio.musicEnabled);await page.keyboard.press('ArrowDown');await page.keyboard.press('Space');assert.equal(await page.evaluate(()=>GameAudio.musicEnabled),!music);
      await page.keyboard.press('ArrowDown');const effects=await page.evaluate(()=>GameAudio.effectsEnabled);await page.keyboard.press('Space');assert.equal(await page.evaluate(()=>GameAudio.effectsEnabled),!effects);
      await page.keyboard.press('Escape');assert(!await page.evaluate(()=>GameShell.paused));
      if(viewport.width===390||viewport.width===1440)await page.screenshot({path:path.join(__dirname,'../.qa/immersive-'+game.id+'-'+viewport.width+'.png')});
      if(['animal_tag_3d','pikmin_tag_3d','monster_maze_3d'].includes(game.id))assert.equal((await measure()).hud,'flex',game.id+' visible HUD');
      assert.deepEqual(errors,[],game.id+' errors');assert.deepEqual(badRequests,[],game.id+' requests');
      report.push({game:game.id,...viewport,...before,errors,badRequests});console.log('PASS '+game.id+' '+viewport.width+'x'+viewport.height);
      await page.close();
    }await context.close();
  }
  // A live orientation/viewport change must refit without reloading the game.
  const page=await browser.newPage({viewport:{width:390,height:844}});await page.goto('http://127.0.0.1:4174/stair_jump/');await page.keyboard.press('Space');await page.setViewportSize({width:844,height:390});await page.waitForTimeout(150);assert(await page.evaluate(()=>{const b=document.querySelector('#gameCanvas').getBoundingClientRect();return b.bottom<=innerHeight&&b.right<=innerWidth;}));await page.close();
  fs.writeFileSync(path.join(__dirname,'../.qa/audit.json'),JSON.stringify(report,null,2));await browser.close();
})().catch(async error=>{console.error(error);if(browser)await browser.close();process.exitCode=1;});
