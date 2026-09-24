'use strict';
Meadow.Progress = {
  valleyFresh(){return {metBeaver:false,bridge:0,hammerFails:0,nails:0,raft:0,raftGate:0,raftFails:0,completed:false};},
  hillFresh(){return {metSquirrel:false,lights:[],focusHelp:[0,0,0],starLocks:[0,0,0],signal:false,escortWave:0,escort:0,escortFails:0,reunited:false,completed:false};},
  forestFresh() {
    return { metOwl:false, round:0, input:[], mistakes:[0,0,0], assists:[0,0,0], gustStage:0, gustWave:0, dashStage:0, dashLeg:0, gustFails:0, dashFails:0, reunited:false, separated:false, routeKnown:false, completed:false };
  },
  fresh() {
    return { version:6, prologueSeen:false, chapter:1, entryChapter:1, forest:this.forestFresh(),valley:this.valleyFresh(),hill:this.hillFresh(), ribbon:false, metRabbit:false, metHedgehog:false,
      windSolved:false, windTurns:[...CONFIG.WIND_START], windHints:0,
      flowers:[], arrangement:Array(6).fill(null), lampHints:0,
      lit:false, completed:false, checkpoint:{...CONFIG.START} };
  },
  read() {
    try{
      const raw=JSON.parse(localStorage.getItem(CONFIG.SAVE_KEY));if(!raw||![1,2,3,4,5,6].includes(raw.version))return null;
      if(raw.version<6){
        const old=[1,1,2,1,1,3,0,1,1],bends=[2,3,5,6];
        const valid=Array.isArray(raw.windTurns)&&raw.windTurns.length===9&&raw.windTurns.every((n,i)=>Number.isInteger(n)&&n>=0&&n<4&&(bends.includes(i)?n===old[i]:n%2===old[i]%2));
        raw.windTurns=raw.windSolved&&valid?[...CONFIG.WIND_SOLUTION]:[...CONFIG.WIND_START];
        const lit=Array.isArray(raw.arrangement)&&raw.arrangement.join()===['ribbon','sun','heart','star'].join();
        raw.arrangement=raw.lit&&lit?['ribbon','sun','ticket','heart','score','star']:Array(6).fill(null);
        if(raw.forest)raw.forest.input=[];
      }
      const state=this.fresh();state.ribbon=raw.ribbon===true;state.metRabbit=state.ribbon&&raw.metRabbit===true;
      state.entryChapter=raw.version>=5&&[1,2,3,4].includes(raw.entryChapter)?raw.entryChapter:1;
      state.prologueSeen=raw.version<4||raw.prologueSeen===true||state.ribbon;
      state.metHedgehog=state.metRabbit&&raw.metHedgehog===true;
      if(Array.isArray(raw.windTurns)&&raw.windTurns.length===16&&raw.windTurns.every(n=>Number.isInteger(n)&&n>=0&&n<4))state.windTurns=[...raw.windTurns];
      state.windSolved=state.metHedgehog&&raw.windSolved===true&&Meadow.PuzzleRules.traceWind(state.windTurns).solved;
      state.flowers=state.metRabbit&&Array.isArray(raw.flowers)?CONFIG.FLOWERS.filter(f=>raw.flowers.includes(f.id)).map(f=>f.id):[];
      const seen=new Set();
      state.arrangement=Array.from({length:6},(_,i)=>{
        const id=Array.isArray(raw.arrangement)?raw.arrangement[i]:null;
        if((id==='ribbon'?state.ribbon:['score','ticket'].includes(id)?state.windSolved:state.flowers.includes(id))&&!seen.has(id)){seen.add(id);return id;}
        return null;
      });
      for(const field of ['windHints','lampHints'])state[field]=Number.isInteger(raw[field])?Math.max(0,Math.min(3,raw[field])):0;
      state.lit=state.windSolved&&state.flowers.length===3&&Meadow.PuzzleRules.lampSolved(state.arrangement)&&raw.lit===true;
      state.completed=state.lit&&raw.completed===true;
      const savedForest=raw.forest||{},f=state.forest;
      f.metOwl=(state.completed||state.entryChapter>=2)&&savedForest.metOwl===true;
      f.round=f.metOwl&&Number.isInteger(savedForest.round)?Math.max(0,Math.min(3,savedForest.round)):0;
      if(f.round<3&&Array.isArray(savedForest.input)){
        const song=CONFIG.SONGS[f.round],expected=Meadow.SongPuzzle.expected(f.round);
        for(let i=0;i<Math.min(savedForest.input.length,expected.length-1);i++){
          if(savedForest.input[i]!==expected[i])break;
          f.input.push(savedForest.input[i]);
        }
      }
      for(const field of ['mistakes','assists'])f[field]=Array.from({length:3},(_,i)=>Number.isInteger(savedForest[field]?.[i])?Math.max(0,Math.min(field==='assists'?3:99,savedForest[field][i])):0);
      f.gustStage=f.round===3?(raw.version<4&&savedForest.reunited?6:[0,1,2,3,4,5,6].includes(savedForest.gustStage)?savedForest.gustStage:0):0;
      for(const key of ['gustFails','dashFails'])f[key]=Number.isInteger(savedForest[key])?Math.max(0,Math.min(99,savedForest[key])):0;
      f.reunited=f.gustStage===6&&savedForest.reunited===true;
      f.separated=f.reunited&&savedForest.separated===true;
      f.routeKnown=f.separated&&savedForest.routeKnown===true;
      f.dashStage=f.routeKnown?(raw.version<4&&savedForest.completed?3:Number.isInteger(savedForest.dashStage)?Math.max(0,Math.min(3,savedForest.dashStage)):0):0;
      f.completed=f.routeKnown&&f.dashStage===3&&savedForest.completed===true;
      f.gustWave=f.round===3&&f.gustStage<6&&Number.isInteger(savedForest.gustWave)?Math.max(0,Math.min(2,savedForest.gustWave)):0;
      f.dashLeg=f.routeKnown&&f.dashStage<3&&Number.isInteger(savedForest.dashLeg)?Math.max(0,Math.min(2,savedForest.dashLeg)):0;
      const rv=raw.valley||{},v=state.valley,rh=raw.hill||{},h=state.hill;
      const count=(n,max)=>Number.isInteger(n)?Math.max(0,Math.min(max,n)):0;
      v.metBeaver=(f.completed||state.entryChapter>=3)&&rv.metBeaver===true;v.bridge=v.metBeaver?count(rv.bridge,3):0;
      v.raft=v.bridge===3?count(rv.raft,4):0;v.completed=v.raft===4&&rv.completed===true;
      v.nails=v.metBeaver&&v.bridge<3?count(rv.nails,2):0;v.raftGate=v.bridge===3&&v.raft<4?count(rv.raftGate,2):0;
      v.hammerFails=count(rv.hammerFails,99);v.raftFails=count(rv.raftFails,99);
      h.metSquirrel=(v.completed||state.entryChapter===4)&&rh.metSquirrel===true;
      h.lights=h.metSquirrel&&Array.isArray(rh.lights)?['hope','memory','courage'].filter(id=>rh.lights.includes(id)):[];
      h.focusHelp=Array.from({length:3},(_,i)=>count(rh.focusHelp?.[i],3));
      h.starLocks=Array.from({length:3},(_,i)=>h.lights.includes(['hope','memory','courage'][i])?3:h.metSquirrel?count(rh.starLocks?.[i],2):0);
      h.signal=h.lights.length===3&&rh.signal===true;
      // Preserve old completed reunions; new saves must finish the escort first.
      h.escort=h.signal?(rh.escort===undefined&&rh.reunited===true?3:count(rh.escort,3)):0;
      h.escortWave=h.signal&&h.escort<3?count(rh.escortWave,2):0;
      h.escortFails=count(rh.escortFails,99);
      h.reunited=h.signal&&h.escort===3&&rh.reunited===true;h.completed=h.reunited&&rh.completed===true;
      state.chapter=raw.chapter===4&&(v.completed||state.entryChapter===4)?4:raw.chapter>=3&&(f.completed||state.entryChapter>=3)?3:raw.chapter>=2&&(state.completed||state.entryChapter>=2)?2:1;
      state.upgraded=raw.version===1&&state.metRabbit;
      const p=raw.checkpoint;if(p&&Number.isFinite(p.x)&&Number.isFinite(p.z)&&Math.abs(p.x)<16&&Math.abs(p.z)<16)state.checkpoint={x:p.x,z:p.z};
      return state;
    }catch(_){return null;}
  },
  write(state) {
    try{
      const {version,prologueSeen,chapter,entryChapter,forest,valley,hill,ribbon,metRabbit,metHedgehog,windSolved,windTurns,windHints,flowers,arrangement,lampHints,lit,completed,checkpoint}=state;
      localStorage.setItem(CONFIG.SAVE_KEY,JSON.stringify({version,prologueSeen,chapter,entryChapter,forest,valley,hill,ribbon,metRabbit,metHedgehog,windSolved,windTurns,windHints,flowers,arrangement,lampHints,lit,completed,checkpoint}));return true;
    }catch(_){return false;}
  }
};
Meadow.Story = class {
  constructor(game) { this.game=game; }
  line(name,text) { return {name,text}; }
  say(lines,done) { this.game.dialogue.show(lines,done); }
  intro() {
    this.say([this.line('小米','媽媽？剛剛還一起野餐的……媽媽去哪裡了？'),this.line('小米','先深呼吸。小路上有一條紅髮帶，好像是媽媽的！')],()=>this.game.toast('用 WASD／方向鍵或搖桿走近髮帶，再按互動。',6000));
  }
  interact(id) {
    const g=this.game,s=g.state,L=(name,text)=>this.line(name,text);
    if(s.mode!=='playing')return;
    if(id==='ribbon'&&!s.ribbon){
      this.say([L('小米','是媽媽的髮帶！上面還有我送她的小蝴蝶結。'),L('小米','媽媽一定來過這裡。那邊的兔子朋友，也許知道她在哪裡。')],()=>{
        s.ribbon=true;g.checkpoint(0,7.5);g.audio.chime();g.toast('找到線索：媽媽的紅髮帶');
      });return;
    }
    if(id==='rabbit'){
      if(!s.ribbon){this.say([L('阿蹦','嗨，我是花田管理員阿蹦。我會陪你找媽媽。'),L('阿蹦','我們先看看小路上的紅髮帶，是你認識的嗎？')]);return;}
      if(!s.metRabbit){
        this.say([L('小米','阿蹦，你有看到我的媽媽嗎？她有一條這樣的紅髮帶。'),L('阿蹦','有呀！她也在找你，沿著小路去前面的休息站了。她還留了一封信。'),L('阿蹦','信在風車郵局。去找戴綠帽子的刺蝟栗栗，他是這裡的郵差。'),L('阿蹦','我們要先修好風管，讓光花醒來，再解開引路燈的祕密。我會陪你一起想。')],()=>{
          s.metRabbit=true;g.checkpoint(1,4.5);g.toast('新的朋友：到風車旁，找刺蝟郵差栗栗。',5500);
        });return;
      }
      if(!s.windSolved){this.say([L('阿蹦','栗栗在風車旁的綠色郵箱附近。媽媽的信交給他保管了。'),L('阿蹦','修好風管，光花才會醒來。看準管口，一格一格接就好。')]);return;}
      if(s.flowers.length===3&&!s.lit){g.challenges.open('lamp');return;}
      if(s.lit){this.say([L('阿蹦','我陪著你呢！跟著金色光點，走到花拱門吧。')]);return;}
      const missing=CONFIG.FLOWERS.filter(f=>!s.flowers.includes(f.id));
      this.say([L('阿蹦',`你已經找到 ${s.flowers.length} 朵光花了。慢慢來，每一小步都很棒。`),L('阿蹦',`可以去${missing[0].clue}，找找「${missing[0].symbol} ${missing[0].name}」。需要時按「給我提示」喔。`)]);return;
    }
    if(id==='hedgehog'){
      if(!s.metRabbit){this.say([L('栗栗','你好，我是郵差栗栗。你在找媽媽嗎？阿蹦剛才和她說過話，先去問問他吧！')]);return;}
      if(!s.metHedgehog){
        this.say([L('栗栗','小米！你媽媽託我送一封信。她很安全，可是信卡在風管裡了……'),L('栗栗','我一著急，就把管子轉得亂七八糟。現在連光花也不開了。'),L('小米','我也有一點著急。我們先看一格，再接下一格，好不好？'),L('栗栗','好！點一下就能轉管子。讓風走過十六格，從左下方吹出來，就能送信了。')],()=>{
          s.metHedgehog=true;g.checkpoint(-6.1,-2.7);g.challenges.open('wind');
        });return;
      }
      if(!s.windSolved){g.challenges.open('wind');return;}
      if(s.lit){this.say([L('栗栗','引路燈亮了！我也把「小米正和阿蹦一起過去」寄給媽媽了。'),L('小米','謝謝你，栗栗！這次，我們都沒有急著亂轉了。')]);return;}
      this.say([L('栗栗','媽媽的信和光花的線索，都收在你的手帳裡。想看就翻開吧！'),L('栗栗',s.flowers.length===3?'回到引路燈，把三朵花、髮帶、歌譜與船票排好。三條線索都符合，燈才會亮。':'每找到一朵光花，就會多一條點燈線索。到時候把線索合起來想。')]);return;
    }
    const flower=CONFIG.FLOWERS.find(f=>f.id===id);
    if(flower&&s.windSolved&&!s.flowers.includes(id)){
      s.flowers.push(id);g.checkpoint(flower.x,flower.z+1.5);g.audio.chime();
      const clue=CONFIG.LAMP_CLUES.find(item=>item.id===id);
      this.say([L('小米',`找到${flower.name}了！${flower.memory}`),L('小米',`花瓣上有一行字：「${clue.text}」我把它記進手帳。`)],()=>{
        g.toast(s.flowers.length===3?'三條線索都找到了！回到引路燈，試著排出正確順序。':`收好${flower.symbol} ${flower.name}，也記下了一條線索。`,5000);
      });return;
    }
    if(id==='lamp'){
      if(s.windSolved&&s.flowers.length===3&&!s.lit){g.challenges.open('lamp');return;}
      this.say([L(s.lit?'小米':'阿蹦',s.lit?'暖暖的光，好像媽媽牽著我的手。':!s.metRabbit?'這是花田的引路燈。先和我說說你在找誰吧！':!s.windSolved?'栗栗正等你幫忙修好送信風管，我們先去找他。':'這盞燈有四個位置。先找齊三朵光花的線索，再用髮帶和花朵解開祕密。')]);return;
    }
    if(id==='exit'){
      if(!s.lit){this.say([L('小米','引路燈還沒亮。我先和朋友一起解開祕密，再往森林走。')]);return;}
      this.say([L('栗栗','小米，回信送出去了！我告訴媽媽，你修好了風管，也解開了燈的祕密。'),L('媽媽（遠遠的聲音）','小米——我收到信了！我在休息站等你，跟著阿蹦慢慢走！'),L('小米','是媽媽！媽媽，我在這裡！'),L('阿蹦','聽到了嗎？她也一直在找你。我們帶著這盞燈，一起出發。'),L('小米','嗯！原來先看一看、想一想，真的可以找到路。')],()=>{
        s.completed=true;g.checkpoint(1,-12.5);s.mode='complete';g.audio.chime();g.showEnding();
      });
    }
  }
  windComplete() {
    const g=this.game,s=g.state;
    if(s.windSolved||!s.metHedgehog||!Meadow.PuzzleRules.traceWind(s.windTurns).solved)return;
    s.windSolved=true;g.checkpoint(-6.1,-2.7);g.audio.chime();
    this.say([this.line('栗栗','風來了！信送到了，光花也醒過來了！'),this.line('小米','信封裡有媽媽的歌譜，還有一張月光船票！'),this.line('栗栗','歌譜寫著「森林的回聲要倒著唱」。船票畫著兩盞燈，要從中間穿過。'),this.line('媽媽（信上的字）','小米，我在前面的休息站，很安全。阿蹦和栗栗會陪你走。想你的時候，我也會點亮一盞燈。'),this.line('小米','媽媽也在想我……栗栗，我想把引路燈點亮，讓她知道我來了。'),this.line('栗栗','三朵光花各藏著一條線索。找齊後，把它們、紅髮帶、歌譜和船票放進六個位置；三條線索都要符合。')],()=>g.toast('歌譜與月光船票收好了，線索也記進手帳。',6000));
  }
  lightLamp() {
    const g=this.game,s=g.state;
    if(s.lit||!s.windSolved||s.flowers.length!==3||!Meadow.PuzzleRules.lampSolved(s.arrangement))return;
    this.say([this.line('阿蹦','三條線索都符合了！你不只找到花，還想出了它們的位置。'),this.line('小米','原來髮帶也能幫忙。就像媽媽還牽著我的手。'),this.line('阿蹦','燈下的小抽屜打開了！這是媽媽留下的星光鏡片。'),this.line('小米','到了山丘，把鏡片交給觀星員，就能用望遠鏡找星光。'),this.line('栗栗','我去寄回信！告訴媽媽，你正帶著希望之光，一步一步走過去。'),this.line('小米','我還有一點怕，但我知道可以慢慢想，也可以找朋友幫忙。')],()=>{
      s.lit=true;g.checkpoint(1,1.1);g.audio.chime();g.toast('收好星光鏡片，帶著三樣小物出發！',6000);
    });
  }
  objective() {
    const s=this.game.state;
    if(!s.ribbon)return {step:1,title:'找找媽媽的線索',detail:'沿著小路，看看那條紅色髮帶。',emotion:'失去 · 一點想念',target:'ribbon'};
    if(!s.metRabbit)return {step:2,title:'向兔子阿蹦求助',detail:'和穿藍背心的兔子說說話。',emotion:'希望 · 我可以開口求助',target:'rabbit'};
    if(!s.metHedgehog)return {step:3,title:'找到風車郵差栗栗',detail:'綠色郵箱旁的刺蝟，保管著媽媽的信。',emotion:'希望 · 一封媽媽的信',target:'hedgehog'};
    if(!s.windSolved)return {step:4,title:'修好十六格送信風管',detail:'找栗栗打開風管。旋轉管口，讓風從入口走到出口。',emotion:'希望 · 一格一格想辦法',target:'hedgehog'};
    if(s.flowers.length<3)return {step:5,title:`收集光花與線索 · ${s.flowers.length} / 3`,detail:'風車旁、池塘後方、老樹下。每朵花都有一個祕密。',emotion:'希望 · 找到線索，再想一想',target:'flower'};
    if(!s.lit)return {step:6,title:'解開引路燈的排列',detail:'回到引路燈，合併三條線索，排好花朵、髮帶、歌譜與船票。',emotion:'希望 · 我可以自己想出來',target:'lamp'};
    return {step:7,title:'跟著微光，走向花拱門',detail:'阿蹦陪你出發，栗栗幫你寄出回信。',emotion:'希望 · 我不是一個人',target:'exit'};
  }
  target() {
    const g=this.game,o=this.objective();
    if(o.target==='ribbon')return {position:g.world.ribbon.position,label:g.world.ribbonLabel,text:'沿著小路，找那條紅色髮帶。'};
    if(o.target==='rabbit')return {position:g.world.rabbit.mesh.position,label:g.world.rabbitLabel,text:'往花田中央，找穿藍背心的阿蹦。'};
    if(o.target==='hedgehog')return {position:g.world.hedgehog.mesh.position,label:g.world.hedgehogLabel,text:'風車旁的綠色郵箱附近，有一隻戴綠帽子的刺蝟。找他修好風管。'};
    if(o.target==='lamp')return {position:g.world.lamp.position,label:g.world.lampLabel,text:'回到花田中央的引路燈，按互動排回憶。先把「太陽、愛心」看成相鄰的一組。'};
    if(o.target==='exit')return {position:g.world.arch.position,label:g.world.archLabel,text:'跟著金色光點，走到花朵拱門，再按互動。'};
    const p=g.player.mesh.position,remaining=CONFIG.FLOWERS.filter(f=>!g.state.flowers.includes(f.id));
    remaining.sort((a,b)=>Math.hypot(a.x-p.x,a.z-p.z)-Math.hypot(b.x-p.x,b.z-p.z));
    const f=remaining[0],item=g.world.flowers.get(f.id);
    return {position:item.mesh.position,label:item.label,text:`${f.symbol} ${f.name}在${f.clue}。跟著腳邊的小光點走。`};
  }
};
