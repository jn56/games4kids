const { chromium } = require('playwright');
const path = require('node:path');
(async () => {
  const browser = await chromium.launch({headless:true,channel:'msedge'});
  const page = await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.goto('http://127.0.0.1:4173/find_mom_3d/');
  await page.waitForFunction(()=>window.meadowGame||!document.querySelector('#error-screen').hidden);
  await page.waitForTimeout(1200);
  await page.screenshot({path:path.join(__dirname,'cover.png')});
  console.log(JSON.stringify({errors,ready:await page.evaluate(()=>!!window.meadowGame),renderer:await page.evaluate(()=>window.meadowGame?.renderer.info.render)}));
  await page.getByRole('button',{name:'陪小米出發'}).click();
  for(let i=0;i<2;i++)await page.locator('#dialogue-next').click();
  await page.waitForTimeout(1500);
  await page.screenshot({path:path.join(__dirname,'playing.png')});
  console.log(JSON.stringify({state:await page.evaluate(()=>window.meadowGame?.state),errors}));
  await browser.close();
})().catch(e=>{console.error(e);process.exitCode=1;});
