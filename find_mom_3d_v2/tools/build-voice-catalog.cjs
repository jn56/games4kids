// No build dependencies. Collect authored lines plus evaluated dialogue branches.
// Run after changing dialogue: node find_mom_3d_v2/tools/build-voice-catalog.cjs
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),context=vm.createContext({console});context.window=context;
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
for(const file of ['config.js','js/voice-script.js','js/level.js','js/journey-worlds.js','js/challenges.js','js/story.js','js/exploration.js','js/sandbox.js','js/family-stories.js','js/side-stories.js','js/forest-rescue.js','js/forest-story.js','js/journey-story.js'])vm.runInContext(read(file),context,{filename:file});
const M=context.Meadow,C=vm.runInContext('CONFIG',context),catalog=new Map();
let dialogueCalls=0;const exercised=new Set();
function visit(story,id){const before=dialogueCalls;story.interact(id);if(dialogueCalls>before)exercised.add(chapter+':'+id);}
let chapter=1;
function collect(lines){
  for(const line of M.Script.pages(lines)){
    const name=M.Script.role(line.name),key=M.Script.key(name,line.text);
    if(!catalog.has(key))catalog.set(key,{name,text:line.text,chapters:[]});
    const entry=catalog.get(key);if(!entry.chapters.includes(chapter))entry.chapters.push(chapter);
  }
}
vm.runInContext(read('js/living-events.js'),context,{filename:'js/living-events.js'});
for(const line of M.EventLines)for(const c of line.chapters){chapter=c;collect([line]);}
const roles=new Set(['小米','媽媽','阿蹦','栗栗','咕咕','灰爪','木木','星星','旁白','小皮','嗡嗡',...Object.values(M.Residents).flat().map(n=>n.name)]);
// Literal pairs are the shared authoring format in all story modules. Dynamic lines
// below are evaluated through real story methods, never guessed from templates.
const literal="('(?:\\\\.|[^'\\\\])*')";
function literals(file,chapters,source=read(file)){
  const patterns=[new RegExp('(?:\\[\\s*|(?:this\\.line|L)\\(\\s*)'+literal+'\\s*,\\s*'+literal,'g'),new RegExp('name:\\s*'+literal+'\\s*,\\s*text:\\s*'+literal,'g')];
  for(const pattern of patterns)for(const match of source.matchAll(pattern)){
    const name=vm.runInContext(match[1],context),text=vm.runInContext(match[2],context);
    if(!roles.has(M.Script.role(name)))continue;
    for(chapter of chapters)collect([{name,text}]);
  }
}
for(const [file,chapters] of [['js/story.js',[1]],['js/forest-story.js',[2]],['js/forest-rescue.js',[2]],['js/adventure.js',[1]],['game.js',[1,2,3,4]]])literals(file,chapters);
literals('js/journey-story.js',[4],read('js/journey-story.js').split('  beginReunion(){')[1]);
for(const [c,name,text] of M.SceneVoices){chapter=c;collect([{name,text}]);}
const noop=()=>{},position=()=>({x:0,z:0,set:noop,distanceTo:()=>0}),object=()=>({position:position(),rotation:{set:noop},mesh:{position:position(),rotation:{}}});
function game(c){
  chapter=c;const state=M.Progress.fresh();state.chapter=c;state.mode='playing';
  const g={state,world:{residents:M.Residents[c],mother:object(),hug:false,flowers:new Map(C.FLOWERS.map(f=>[f.id,object()]))},player:{setPosition:noop,mesh:object()},dialogue:{lines:[],show:lines=>{dialogueCalls++;collect(lines);g.dialogue.lines=lines;}},audio:{chime:noop},checkpoint:noop,toast:noop,refresh:noop,saveProgress:noop,challenges:{open:noop},song:{open:noop},trials:{start:noop},expedition:{start:noop}};
  return g;
}
// First chapter: every subset of found flowers and every dialogue milestone.
for(let mask=0;mask<32;mask++)for(let flowers=0;flowers<8;flowers++){
  const g=game(1),s=g.state,story=new M.Story(g);
  ['ribbon','metRabbit','metHedgehog','windSolved','lit'].forEach((key,i)=>s[key]=!!(mask&(1<<i)));
  s.flowers=C.FLOWERS.filter((_,i)=>flowers&(1<<i)).map(f=>f.id);
  for(const id of ['ribbon','rabbit','hedgehog','lamp','exit',...C.FLOWERS.map(f=>f.id)])visit(story,id);
}
for(let round=0;round<=3;round++)for(let mask=0;mask<32;mask++){
  const g=game(2),f=g.state.forest,story=Object.create(M.ForestStory.prototype);story.game=g;story.beginCrossing=noop;
  f.round=round;f.gustStage=mask&1?6:0;f.metOwl=!!(mask&2);f.reunited=!!(mask&4);f.separated=!!(mask&8);f.routeKnown=!!(mask&16);f.dashStage=mask&1?3:0;
  for(const id of ['owl','mother','forest-exit'])visit(story,id);story.readJournal();
}
for(const c of [3,4])for(let bridge=0;bridge<=3;bridge++)for(let raft=0;raft<=4;raft++)for(let lights=0;lights<=3;lights++)for(const met of [false,true]){
  const g=game(c),story=new M.JourneyStory(g,c);Object.assign(g.state.valley,{bridge,raft,metBeaver:met});Object.assign(g.state.hill,{metSquirrel:met,lights:['hope','memory','courage'].slice(0,lights),reunited:met&&lights===3});
  story.beginHome=story.beginReunion=noop;g.world.home=object();
  story.intro();for(const id of [c===3?'beaver':'squirrel','mother','home','exit'])visit(story,id);
  story.readJournal();g.state.hill.signal=true;story.readJournal();
  if(c===3)for(const kind of ['bridge','raft'])story.challengeComplete(kind);
  else for(const beacon of ['hope','memory','courage'])story.challengeComplete('star',beacon);
}
for(let c=1;c<=4;c++){
  chapter=c;for(let i=0;i<4;i++)for(const text of [...M.Sandbox.lines[i],M.Sandbox.lines[1][1]])collect([{name:M.Sandbox.names[c][i],text}]);
  chapter=c;for(const npc of M.Residents[c])collect(npc.lines.map(([name,text])=>({name,text})));
  const family=M.FamilyStories.stories[c-1];
  for(const lines of [family.ask,...family.replies,...family.endings,...family.secrets])collect(lines.map(([name,text])=>({name,text})));
  for(let stage=0;stage<=4;stage++)for(const secret of [false,true])for(let i=0;i<5;i++){
    const g=game(c);g.state.sideStories[c-1]=stage;g.state.sideSecrets[c-1]=secret;g.state.familyStories[c-1]=stage;
    M.SideStories.talk(g,g.world.residents[i]);g.state.mode='dialogue';M.SideStories.appendJournal(g);
  }
}
for(const id of ['1:ribbon','1:rabbit','1:hedgehog','1:lamp','1:exit',...C.FLOWERS.map(f=>'1:'+f.id),'2:owl','2:mother','2:forest-exit','3:beaver','3:exit','4:squirrel','4:mother','4:home'])if(!exercised.has(id))throw new Error('Dialogue branch did not execute: '+id);
const result=[...catalog.values()];for(const row of result)row.chapters.sort();
for(const name of [...roles,...M.Sandbox.names.flat()])if(!result.some(line=>line.name===name))throw new Error('Missing voice role: '+name);
const output="'use strict';\n// Generated by tools/build-voice-catalog.cjs; audio keys depend on role + exact text.\nMeadow.VoiceCatalog=[\n"+result.map(row=>'  '+JSON.stringify(row)).join(',\n')+'\n];\n';
const target=path.join(root,'js/voice-catalog.js');
if(process.argv.includes('--check')){if(read('js/voice-catalog.js')!==output)throw new Error('Voice catalogue is stale. Run build-voice-catalog.cjs');}
else fs.writeFileSync(target,output);
console.log(`Voice catalogue: ${result.length} lines, ${new Set(result.map(l=>l.name)).size} roles`);
