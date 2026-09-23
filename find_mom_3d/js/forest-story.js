'use strict';
Meadow.ForestStory = class {
  constructor(game){this.game=game;this.elapsed=0;this.running=false;}
  say(lines,done){this.game.dialogue.show(lines.map(([name,text])=>({name,text})),done);}
  intro(){
    this.say([['阿蹦','前面就是風鈴森林。我回去接栗栗，咕咕會陪你。記得，你可以隨時開口求助。'],['小米','這段歌聲……是媽媽哄我睡覺時唱的！'],['咕咕','小米，歡迎你。我剛看到媽媽，她在橋邊等你。先來和我說說話吧。']]);
  }
  readJournal(){
    const f=this.game.state.forest;
    if(f.routeKnown&&f.dashStage<3){this.say([['咕咕','風停時按住空白鍵或「快跑」。放開就停。每座亭子都會保存進度。']]);return;}
    if(f.round===3&&f.gustStage<6){this.say([['咕咕','按左右方向鍵，或畫面箭頭換跑道。避開亮起的風道，第三陣風後有存點。']]);return;}
    this.say([['小米','花田帶來的媽媽歌譜還在。最後一段是回聲，要從最後一音往回敲。'],['咕咕',`你已經找回 ${f.round} / 3 段旋律。前兩段照原來的順序，第三段從最後一個音倒著敲。`],['咕咕',f.separated?'媽媽在對岸休息亭，很安全。我們會一起走河谷步道。':'需要時可以重播，或請我留下圖案樂譜。旋律裡藏著媽媽的心意。']]);
  }
  interact(id){
    const g=this.game,f=g.state.forest;
    if(g.state.mode!=='playing')return;
    if(id==='owl'){
      if(!f.metOwl){this.say([['小米','我帶著花田信封裡的歌譜，上面寫著回聲要倒著唱。'],['咕咕','這正是打開藤蔓門的歌！用風鈴試試看；需要時，翻開媽媽的歌譜。'],['小米','我可以試試看！我記得她總會唱最後一段給我聽。'],['咕咕','合奏台有三段旋律，會越來越長。先看我示範，再敲一遍。最後一段是回聲，要倒著敲。'],['咕咕','聲音關著也沒關係，每個音都有自己的圖案。卡住了可以重播，或請我留下一點提示。']],()=>{f.metOwl=true;g.checkpoint(-1.4,5.5);g.toast('到風鈴合奏台試奏。每通過一段，藤蔓就會鬆開一點。',6000);});return;}
      if(f.separated&&!f.routeKnown){this.say([['小米','我才剛找到媽媽……現在又和她分開了。'],['咕咕','她在對岸很安全。我們可以走河谷步道！'],['小米','就算害怕，我也想試試。你陪我，好嗎？'],['咕咕','我陪你！風停時快跑，趕到下一座避風亭。']],()=>{f.routeKnown=true;g.checkpoint(3.8,-3.7);g.trials.start('dash');});return;}
      if(f.routeKnown){if(f.dashStage<3){g.trials.start('dash');return;}this.say([['咕咕','媽媽在對岸很安全。我會陪你走右邊的河谷步道，找木木幫忙。']]);return;}
      if(f.round<3){g.song.open();return;}
      if(f.gustStage<6){g.trials.start('gust');return;}
      this.say([['咕咕','藤蔓已經讓路了！走過去，媽媽就在橋前等你。']]);return;
    }
    if(id==='music'||id.startsWith('bell-')){
      if(id.startsWith('bell-')){
        const note=id.slice(5),bell=CONFIG.BELLS.find(b=>b.id===note);g.world.ringBell(note);g.audio.note(bell.note,.7,.07);
      }
      if(!f.metOwl){g.toast('先和咕咕說話，聽聽這些風鈴的祕密。');return;}
      if(f.round<3){g.song.open();return;}
      if(f.gustStage<6){g.trials.start('gust');return;}
      g.toast('三段旋律都完成了。媽媽正在橋邊等你。');return;
    }
    if(id==='mother'){
      if(f.round<3){g.toast('先和咕咕找回三段旋律，讓藤蔓讓路。');return;}
      if(f.gustStage<6){g.trials.start('gust');return;}
      if(f.separated){this.say([['媽媽（對岸）','小米，我在亭子裡，很安全！和咕咕走河谷步道，我們在山丘見。']]);return;}
      if(f.reunited){this.beginCrossing();return;}
      g.world.hug=true;g.player.setPosition(2,-3.35);g.player.mesh.rotation.y=Math.PI;
      this.say([['小米','媽媽！我找到你了！'],['媽媽','小米！讓媽媽抱抱。謝謝你一直想辦法，也謝謝朋友們照顧你。'],['小米','我修好了風管，也記住了你的歌。想你的時候，我就一小步一小步走。'],['媽媽','我們從橋去山丘吧。我先看看另一頭的路；你在咕咕身邊等我確認，好嗎？'],['小米','好，我會等你。']],()=>{f.reunited=true;g.world.hug=false;g.checkpoint(2,-3.35);this.beginCrossing();});return;
    }
    if(id==='forest-exit'){
      if(!f.separated){g.toast('媽媽就在橋邊，我們先去找她。');return;}
      if(!f.routeKnown){g.toast('先和咕咕說說話，一起確認安全的路。');return;}
      if(f.dashStage<3){g.trials.start('dash');return;}
      this.say([['小米','這次，我知道媽媽在哪裡。我要帶著她的歌，走到山丘見她。'],['咕咕','你的記憶之光已經亮了。走吧，河谷裡還有願意幫忙的朋友。']],()=>{f.completed=true;g.checkpoint(11.1,-3.5);g.audio.chime();g.showEnding();});
    }
  }
  songComplete(){
    const g=this.game;if(g.state.forest.round!==3)return;
    g.checkpoint(0,4.5);g.audio.chime();
    this.say([['小米','那個身影……是媽媽！'],['咕咕','風突然變大了！左右換跑道，躲開迎面的陣風。'],['媽媽','我在前面等你，跟著咕咕慢慢來！']],()=>g.trials.start('gust'));
  }
  beginCrossing(){
    const g=this.game;if(g.state.forest.separated||!g.state.forest.reunited)return;
    this.elapsed=0;this.running=true;g.state.mode='cutscene';g.input.reset();
    g.world.cutscene=true;g.world.hug=false;g.world.mother.mesh.position.set(2,0,-4.3);g.world.bridgeTarget=1;
    g.world.owl.mesh.position.set(4,0,-3.2);g.view.override=new THREE.Vector3(2,0,-7);
    document.getElementById('story-caption').hidden=false;document.body.classList.add('in-cutscene');
    document.getElementById('story-caption').textContent='媽媽先去確認橋另一頭。小米留在咕咕身邊等候。';
  }
  update(dt){
    const g=this.game;if(!this.running||g.state.mode!=='cutscene')return;
    this.elapsed+=dt;const t=this.elapsed;
    if(t>1.4){
      const progress=Math.min(1,(t-1.4)/3.6);g.world.mother.mesh.position.z=-4.3-progress*8.2;g.world.mother.mesh.rotation.y=Math.PI;
    }
    if(t>=5.05){
      // The bridge closes only after the mother is safely beyond the far bank.
      g.world.bridgeTarget=0;g.world.mistAmount=Math.min(.4,(t-5.05)*.35);
      g.world.mother.mesh.rotation.y=0;
      document.getElementById('story-caption').textContent='媽媽已經安全走到對岸。霧來了，安全橋正在收起。';
    }
    if(t>=7){
      this.running=false;g.world.cutscene=false;g.view.override=null;document.body.classList.remove('in-cutscene');document.getElementById('story-caption').hidden=true;
      g.state.forest.separated=true;g.state.mode='playing';g.checkpoint(2,-3.35);
      this.say([['媽媽（對岸）','小米，別擔心！我已經在對岸的休息亭，很安全！'],['咕咕','這座橋遇到霧就會收起。我們都在岸上，沒有誰受傷。'],['小米','媽媽……可是我又碰不到你的手了。'],['媽媽（對岸）','我也想牽著你。和咕咕走河谷步道，我會沿著對岸往山丘走，我們在那裡見。']],()=>g.toast('先深呼吸，再和身邊的咕咕說說話。',6000));
    }
  }
  objective(){
    const f=this.game.state.forest;
    if(!f.metOwl)return {step:1,total:5,title:'找到貓頭鷹咕咕',detail:'媽媽就在森林裡。先問問戴藍圍巾的咕咕。',emotion:'希望 · 熟悉的歌聲',target:'owl'};
    if(f.round<3)return {step:2,total:5,title:`找回三段旋律 · ${f.round} / 3`,detail:'到合奏台模仿旋律。最後一段，要把回聲倒著敲。',emotion:'希望 · 我記得媽媽的歌',target:'music'};
    if(f.gustStage<6)return {step:3,total:5,title:'闖過疾風小徑',detail:'到合奏台或找咕咕，左右閃過六陣風。',emotion:'勇敢 · 媽媽就在前面',target:'music'};
    if(!f.reunited)return {step:3,total:5,title:'走到媽媽身邊',detail:'藤蔓已經讓開了。走近媽媽，給她一個擁抱。',emotion:'找回 · 媽媽，我在這裡',target:'mother'};
    if(!f.separated)return {step:3,total:5,title:'等媽媽確認橋另一頭',detail:'留在咕咕身邊，等媽媽的訊息。',emotion:'找回 · 熟悉的擁抱',target:'mother'};
    if(!f.routeKnown)return {step:4,total:5,title:'和咕咕一起想辦法',detail:'媽媽在對岸很安全。找身邊的咕咕，問問另一條路。',emotion:'再失去 · 也可以繼續往前',target:'owl'};
    if(f.dashStage<3)return {step:5,total:5,title:'抓準風停，跑到避風亭',detail:'找咕咕開始。風停時按住快跑，穿越三段小徑。',emotion:'勇敢 · 抓準時機',target:'owl'};
    return {step:5,total:5,title:'前往月光河谷步道',detail:'沿右邊的小路走，媽媽會和你在山丘會合。',emotion:'勇敢 · 這次我知道方向',target:'forest-exit'};
  }
  target(){
    const g=this.game,id=this.objective().target;
    const targets={owl:[g.world.owl.mesh,g.world.owlLabel,'跟著光點找咕咕，他會陪你想辦法。'],music:[g.world.stand,g.world.standLabel,'到合奏台按互動。先播放旋律，再跟著圖案敲；最後一段要倒過來。'],mother:[g.world.mother.mesh,g.world.motherLabel,'媽媽在橋前。穿過藤蔓門，走近她再按互動。'],'forest-exit':[g.world.exit,g.world.exitLabel,'往畫面右邊走，找到「月光河谷步道」路牌，再按互動。']};
    const [object,label,text]=targets[id];const f=g.state.forest;
    return {position:object.position,label,text:f.round===3&&f.gustStage<6?'到合奏台按互動，挑戰疾風小徑。':f.routeKnown&&f.dashStage<3?'找咕咕挑戰風停快跑。風停才出發，每座亭子都能休息。':text};
  }
};
