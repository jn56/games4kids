// Drive the two story interactions through the same buttons a player uses.
async function finishDialogue(page){
  for(let i=0;i<60&&await page.evaluate(()=>meadowGame.state.mode==='dialogue');i++)await page.locator('#dialogue-next').click();
}
async function helpMother(page,kind){
  await page.waitForFunction(kind=>meadowGame.story.rescue.kind==='dialogue'&&meadowGame.story.rescue.done.has(kind),kind);
  await finishDialogue(page);await page.waitForFunction(kind=>meadowGame.story.rescue.kind===kind,kind);
  for(let i=0;i<(kind==='retreat'?5:3);i++)await page.locator('#rescue-action').click();
  await page.waitForFunction(()=>!['retreat','whistle'].includes(meadowGame.story.rescue.kind));await finishDialogue(page);
}
module.exports={helpMother,finishDialogue};
