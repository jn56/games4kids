// Preview with serve.cjs first. Screenshots are local, ignored review artifacts.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path');
let browser;
(async()=>{
  browser=await chromium.launch({channel:'msedge',headless:true});
  const errors=[],p=await browser.newPage({viewport:{width:1440,height:900}});
  const url='http://127.0.0.1:4173/find_mom_3d/';
  async function load(page){page.on('pageerror',e=>errors.push(e.message));await page.goto(url);await page.waitForFunction(()=>window.meadowGame);}
  async function seed(page){await page.evaluate(()=>{const g=meadowGame,s=Meadow.Progress.fresh();s.chapter=s.entryChapter=4;s.prologueSeen=true;s.hill.metSquirrel=true;g.saved=s;g.start(true);});}
  async function talk(){for(let i=0;i<30&&await p.evaluate(()=>meadowGame.state.mode==='dialogue');i++)await p.locator('#dialogue-next').click();}
  async function shot(page,name){await page.screenshot({path:path.join(__dirname,'hill-feedback-'+name+'.png')});}
  async function steer(read,limit=70000){
    let held=null;const end=Date.now()+limit;
    while(await p.evaluate(()=>meadowGame.expedition.active)&&Date.now()<end){
      const q=await p.evaluate(read),key=Math.abs(q.target-q.x)<.025?null:q.target>q.x?'ArrowRight':'ArrowLeft';
      if(key!==held){if(held)await p.keyboard.up(held);if(key)await p.keyboard.down(key);held=key;}
      if(q.shoot)await p.keyboard.press('e');
      await p.waitForTimeout(30);
    }
    if(held)await p.keyboard.up(held);
    assert(!await p.evaluate(()=>meadowGame.expedition.active),'challenge must finish through real keyboard controls');
  }
  await load(p);await seed(p);
  await p.evaluate(()=>meadowGame.expedition.start('star','hope'));await p.locator('#journey-start').click();
  // Verify the two distinct full-charge states, a successful shot, and losing aim.
  const states=await p.evaluate(()=>{
    const g=meadowGame,e=g.expedition,m=document.getElementById('journey-meter');g.state.mode='paused';
    function snapshot(){return {full:e.ui.classList.contains('charge-full'),ready:e.ui.classList.contains('shot-ready'),animation:getComputedStyle(m).animationName,text:m.getAttribute('aria-valuetext')};}
    e.focus=2.8;e.aligned=true;e.exposure=false;e.paint();const waiting=snapshot();
    e.exposure=true;e.paint();const ready=snapshot();
    g.state.mode='journey';e.strike();g.state.mode='paused';const taken={...snapshot(),count:g.state.hill.starLocks[0]};
    e.focus=2.8;e.aim=.52;e.elapsed=0;e.cooldown=0;e.paint();g.state.mode='journey';e.update(.05);g.state.mode='paused';const lost=snapshot();
    e.focus=2.8;e.aligned=true;e.exposure=true;e.cooldown=0;e.paint();
    return {waiting,ready,taken,lost};
  });
  assert(states.waiting.full&&!states.waiting.ready);assert.equal(states.waiting.animation,'camera-charge-pulse');assert.match(states.waiting.text,/等待金光/);
  assert(states.ready.full&&states.ready.ready);assert.match(states.ready.text,/可以拍攝/);
  assert.equal(states.taken.count,1);assert(!states.taken.full&&!states.taken.ready);assert(!states.lost.full&&!states.lost.ready);
  await shot(p,'camera-full-desktop');
  await p.evaluate(()=>{meadowGame.state.mode='journey';meadowGame.togglePause();});
  assert.equal(await p.locator('#journey-meter').evaluate(el=>getComputedStyle(el).animationPlayState),'paused');
  await p.locator('#resume-btn').click();await p.locator('#journey-leave').click();
  assert.equal(await p.locator('#journey-ui').evaluate(el=>el.classList.contains('charge-full')||el.classList.contains('shot-ready')),false);
  // Play all three cameras from empty with keyboard aiming and timed exposures.
  await seed(p);
  for(const beacon of ['hope','memory','courage']){
    await p.evaluate(id=>meadowGame.expedition.start('star',id),beacon);await p.locator('#journey-start').click();
    await p.keyboard.press('e');assert.equal(await p.evaluate(id=>meadowGame.state.hill.starLocks[Meadow.BEACONS.findIndex(b=>b.id===id)],beacon),0);
    await steer(()=>{const e=meadowGame.expedition;return {x:e.aim,target:e.target,shoot:e.ui.classList.contains('shot-ready')};});
    await talk();
  }
  assert.deepEqual(await p.evaluate(()=>meadowGame.state.hill.starLocks),[3,3,3]);
  console.log('PASS camera: visible full-charge pulse, exposure-only shutter cue, reset, pause, and all nine keyboard photos');
  await p.evaluate(()=>{meadowGame.state.hill.signal=true;meadowGame.expedition.start('escort');});await p.locator('#journey-start').click();
  // A daughter inside the opening cannot pass if her mother would hit its edge.
  const collision=await p.evaluate(()=>{
    const g=meadowGame,e=g.expedition;e.escortX=e.gateCenter+.6;e.roundTime=.8+14.5/6.2;e.update(.01);g.state.mode='paused';
    return {fails:g.state.hill.escortFails,wave:g.state.hill.escortWave,guard:e.guardGlow.visible,center:e.gateCenter};
  });
  assert.equal(collision.fails,1);assert.equal(collision.wave,0);assert(collision.guard);assert.equal(collision.center,-2.5);
  // Monitor every frame: the lamps, safety patch and collision lane cannot drift within a wave.
  await p.evaluate(()=>{
    const g=meadowGame,e=g.expedition,update=e.update.bind(e);window.gateTrace={centers:{},drift:0,misalignment:0};
    e.update=function(dt){update(dt);if(!this.active||this.kind!=='escort')return;
      const key=g.state.hill.escort*3+g.state.hill.escortWave,t=window.gateTrace;
      if(t.centers[key]===undefined)t.centers[key]=this.gateCenter;
      t.drift=Math.max(t.drift,Math.abs(t.centers[key]-this.gateCenter));
      t.misalignment=Math.max(t.misalignment,Math.abs(this.safePatch.position.x-this.gateCenter),Math.abs((this.buoys[0].mesh.position.x+this.buoys[1].mesh.position.x)/2-this.gateCenter));
    };g.state.mode='journey';
  });
  await p.keyboard.press('Escape');const frozen=await p.evaluate(()=>meadowGame.expedition.elapsed);await p.waitForTimeout(160);assert.equal(await p.evaluate(()=>meadowGame.expedition.elapsed),frozen);await p.locator('#resume-btn').click();
  await shot(p,'escort-desktop');
  await steer(()=>({x:meadowGame.expedition.escortX,target:meadowGame.expedition.gateCenter-.25}));
  const result=await p.evaluate(()=>({hill:meadowGame.state.hill,trace:window.gateTrace}));
  assert.equal(result.hill.escort,3);assert.equal(result.hill.escortFails,1);assert.equal(Object.keys(result.trace.centers).length,9);assert.equal(result.trace.drift,0);assert(result.trace.misalignment<1e-12);
  await p.waitForFunction(()=>meadowGame.state.mode==='dialogue');await talk();assert(await p.evaluate(()=>meadowGame.state.hill.reunited));
  console.log('PASS escort: mother collision, retry, pause, nine fixed openings via keyboard, and final reunion');
  const phone=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});await load(phone);await seed(phone);
  await phone.evaluate(()=>meadowGame.expedition.start('star','hope'));await phone.locator('#journey-start').tap();
  await phone.evaluate(()=>{const g=meadowGame,e=g.expedition;g.state.mode='paused';e.focus=2.8;e.aligned=true;e.exposure=true;e.paint();});
  assert.equal(await phone.locator('#journey-meter').evaluate(el=>getComputedStyle(el).animationName),'none');
  assert.equal(await phone.locator('#journey-meter').evaluate(el=>getComputedStyle(el).outlineStyle),'solid');
  for(const [w,h,name] of [[390,844,'phone'],[844,390,'landscape']]){
    await phone.setViewportSize({width:w,height:h});
    for(const id of ['#journey-meter','#journey-hit','#journey-left','#journey-right']){const b=await phone.locator(id).boundingBox();assert(b&&b.x>=0&&b.y>=0&&b.x+b.width<=w+1&&b.y+b.height<=h+1,id);}
    await shot(phone,'camera-full-'+name);
  }
  // Allow input without moving the prepared exposure window between touch events.
  await phone.evaluate(()=>{const e=meadowGame.expedition;e.update=()=>{};meadowGame.state.mode='journey';});await phone.locator('#journey-hit').tap();
  assert.equal(await phone.evaluate(()=>meadowGame.state.hill.starLocks[0]),1);assert(!await phone.locator('#journey-ui').evaluate(el=>el.classList.contains('charge-full')));
  await phone.locator('#journey-leave').tap();await phone.reload();await phone.waitForFunction(()=>window.meadowGame);await seed(phone);
  await phone.evaluate(()=>{const g=meadowGame;g.state.hill.signal=true;g.expedition.start('escort');});await phone.locator('#journey-start').tap();
  await phone.setViewportSize({width:390,height:844});
  const cdp=await phone.context().newCDPSession(phone),b=await phone.locator('#journey-left').boundingBox();
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:b.x+b.width/2,y:b.y+b.height/2,id:1}]});
  await phone.waitForFunction(()=>meadowGame.expedition.escortX< -2.65);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  assert.equal(await phone.evaluate(()=>meadowGame.expedition.held),0);
  await phone.waitForFunction(()=>meadowGame.state.hill.escortWave===1);assert.equal(await phone.evaluate(()=>meadowGame.state.hill.escortFails),0);
  await phone.locator('#pause-btn').tap();assert.equal(await phone.evaluate(()=>meadowGame.expedition.held),0);
  await phone.locator('#restart-btn').tap();assert.equal(await phone.evaluate(()=>meadowGame.expedition.active),false);
  assert(!await phone.locator('#journey-ui').evaluate(el=>el.classList.contains('charge-full')||el.classList.contains('shot-ready')));
  assert.deepEqual(errors,[]);console.log('PASS touch: shutter, escort steering/release, restart, portrait/landscape, reduced-motion emphasis; no runtime errors');
  await browser.close();
})().catch(async error=>{console.error(error);if(browser)await browser.close();process.exit(1);});
