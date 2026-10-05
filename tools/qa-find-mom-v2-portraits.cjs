const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const url=process.env.GAME_URL||'http://127.0.0.1:4174/find_mom_3d_v2/';
const out=path.resolve(__dirname,'../.qa/find-mom-v2/portraits');fs.mkdirSync(out,{recursive:true});
let browser;const errors=[];
(async()=>{
  browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'msedge',headless:true});
  const p=await browser.newPage({viewport:{width:1440,height:900}});p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
  await p.goto(url);await p.waitForFunction(()=>window.meadowGame);
  await p.evaluate(()=>{const g=meadowGame,s=Meadow.Progress.fresh();s.prologueSeen=true;g.saved=s;g.start(true);g.living.enabled=false;});
  const catalogue=await p.evaluate(()=>{
    const P=Meadow.Portraits,roles=[...new Set(Meadow.VoiceCatalog.map(l=>l.name))];
    return roles.map(role=>{const profile=P.profile(role,meadowGame);return {role,kind:profile.kind,expressions:new Set(Object.keys(P.expressions).map(m=>P.svg(profile,m))).size};});
  });
  assert.equal(catalogue.length,47);assert(catalogue.every(r=>r.expressions===4));assert(catalogue.filter(r=>r.kind==='book').every(r=>r.role==='旁白'));
  console.log('PASS 47 roles resolve to their own species/palette, with four different facial expressions');
  await p.evaluate(()=>meadowGame.dialogue.show([
    {name:'栗栗',text:'信就在風車旁。'}, {name:'小米',text:'太好了，謝謝你！'},
    {name:'媽媽（遠處）',text:'小心，快逃！'}, {name:'阿蹦',text:'咦，真的嗎？'}
  ]));
  for(const [speaker,expression,kind] of [['栗栗','neutral','hedgehog'],['小米','happy','girl'],['媽媽','worried','mother'],['阿蹦','surprised','rabbit']]){
    const el=p.locator('#dialogue-portrait');assert.equal(await el.getAttribute('data-speaker'),speaker);assert.equal(await el.getAttribute('data-expression'),expression);assert.equal(await el.getAttribute('data-kind'),kind);assert(await el.isVisible());await p.keyboard.press('Space');
  }
  assert.equal(await p.evaluate(()=>meadowGame.state.mode),'playing');console.log('PASS speaker and expression switch with real Space-driven dialogue pages');
  await p.evaluate(()=>{meadowGame.identity.names['栗栗']='郵差小栗';meadowGame.dialogue.show([{name:'栗栗',text:'請幫我找找這封信。',expression:'worried'}]);meadowGame.identity.update(true);});
  assert.equal(await p.locator('#dialogue-name').textContent(),'郵差小栗');assert.equal(await p.locator('#dialogue-portrait').getAttribute('data-kind'),'hedgehog');assert.equal(await p.getByRole('img',{name:/郵差小栗.*擔心/}).count(),1);
  const authoring=await p.evaluate(()=>Meadow.Script.pages([{name:'栗栗',text:'謝謝你！我們一起出發吧。',expression:'happy'}]).map(l=>l.expression));assert.deepEqual(authoring,['happy','happy']);
  console.log('PASS renamed speaker accessibility, stable portrait identity and authored expression across split pages');
  for(const [width,height] of [[1440,900],[390,844],[320,568],[844,390],[667,375],[568,320]]){
    await p.setViewportSize({width,height});
    await p.evaluate(()=>meadowGame.dialogue.show([{name:'栗栗',text:'沿著風車旁的綠色小路，走到郵箱前面，就能找到媽媽留下的信。',expression:'surprised'}]));
    await p.waitForTimeout(100);
    const boxes=await p.evaluate(()=>['dialogue-ui','dialogue-portrait','dialogue-text','dialogue-next'].map(id=>{const el=document.getElementById(id),r=el.getBoundingClientRect();return {id,visible:!!el.getClientRects().length,x:r.x,y:r.y,right:r.right,bottom:r.bottom,w:r.width,h:r.height};}));
    for(const r of boxes){assert(r.visible&&r.w>0&&r.h>0,JSON.stringify(r));assert(r.x>=0&&r.y>=0&&r.right<=width+1&&r.bottom<=height+1,JSON.stringify(r));}
    const [panel,portrait,text]=boxes;assert(portrait.w>=60);assert(portrait.right<=text.x||portrait.bottom<=text.y+1,'Portrait overlaps story text');
    assert.equal(await p.evaluate(()=>document.documentElement.scrollHeight>innerHeight||document.documentElement.scrollWidth>innerWidth),false);
    await p.screenshot({path:path.join(out,`dialogue-${width}x${height}.png`)});
    await p.evaluate(()=>meadowGame.dialogue.show([{name:'穗穗',text:'要不要一起做生日麵包？',expression:'happy'}],null,[{label:'一起重做',choose(){}},{label:'留下這一個',choose(){}}]));
    await p.waitForTimeout(50);assert(await p.locator('#dialogue-portrait').isVisible());assert(await p.locator('#dialogue-choices button').last().isVisible());
    const fits=await p.locator('#dialogue-ui').evaluate(el=>el.scrollHeight<=el.clientHeight+1);assert(fits,'Choice dialogue clips on '+width+'x'+height);
    await p.keyboard.press('Space');assert.equal(await p.evaluate(()=>meadowGame.state.mode),'playing');
    console.log(`PASS ${width}x${height}: portrait, long dialogue and choice buttons visible without scrolling`);
  }
  const cards=await p.evaluate(()=>Object.entries(Meadow.Portraits.main).flatMap(([name,profile])=>Object.entries(Meadow.Portraits.expressions).map(([mood,label])=>`<div>${Meadow.Portraits.svg(profile,mood)}<p>${name} · ${label}</p></div>`)).join(''));
  const sheet=await browser.newPage({viewport:{width:640,height:900}});await sheet.setContent(`<style>body{margin:0;background:#f7f3e7;color:#24463f;font:14px sans-serif;display:grid;grid-template-columns:repeat(4,1fr);gap:4px;padding:10px}div{text-align:center;border-bottom:1px solid #ddd5c2;padding:5px}svg{width:110px;height:127px}p{margin:4px}</style>${cards}`);await sheet.screenshot({path:path.join(out,'expressions.png'),fullPage:true});
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({roles:catalogue,viewports:6,errors},null,2));await browser.close();
})().catch(async e=>{console.error(e);if(browser)await browser.close();process.exit(1);});
