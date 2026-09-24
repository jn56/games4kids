'use strict';
Meadow.ForestStory = class {
  constructor(game){this.game=game;this.elapsed=0;this.running=false;}
  say(lines,done){this.game.dialogue.show(lines.map(([name,text])=>({name,text})),done);}
  intro(){
    this.say([['阿蹦','前面就是風鈴森林。我回去接栗栗，咕咕會陪你。記得，你可以隨時開口求助。'],['小米','這段歌聲……是媽媽哄我睡覺時唱的！'],['咕咕','小米，歡迎你。我剛看到媽媽，她在橋邊等你。先來和我說說話吧。']]);
  }
  readJournal(){
    const f=this.game.state.forest;
    if(f.routeKnown&&f.dashStage<3){this.say([['咕咕','左右選金色石頭，按一下 E 或「跳躍」。後段等白浪退開再跳，每顆落點都保存。']]);return;}
    if(f.round===3&&f.gustStage<6){this.say([['咕咕','十八波風會越來越快，每波都會存點。看到橘色「逆風」警告時，左右相反，記得看按鈕上的方向！']]);return;}
    this.say([['小米','花田帶來的媽媽歌譜還在。最後一段是回聲，要從最後一音往回敲。'],['咕咕',`你已經找回 ${f.round} / 3 段旋律。第一段正序，第二段把首音移到最後，第三段倒序。`],['咕咕',f.separated?'媽媽抓著浮木，被水流帶往河谷。我們沿岸去找木木接應。':'需要時可以重播，或請我留下圖案樂譜。旋律裡藏著媽媽的心意。']]);
  }
  interact(id){
    const g=this.game,f=g.state.forest;
    if(g.state.mode!=='playing')return;
    if(id==='owl'){
      if(!f.metOwl){this.say([['小米','我帶著花田信封裡的歌譜，上面寫著回聲要倒著唱。'],['咕咕','這正是打開藤蔓門的歌！用風鈴試試看；需要時，翻開媽媽的歌譜。'],['小米','我可以試試看！我記得她總會唱最後一段給我聽。'],['咕咕','三段旋律：六音正序、七音把第一音移到最後、八音倒序。看清規則，再敲回來。'],['咕咕','聲音關著也沒關係，每個音都有自己的圖案。卡住了可以重播，或請我留下一點提示。']],()=>{f.metOwl=true;g.checkpoint(-1.4,5.5);g.toast('到風鈴合奏台試奏。每通過一段，藤蔓就會鬆開一點。',6000);});return;}
      if(f.separated&&!f.routeKnown){this.say([['小米','我才剛找到媽媽……現在又和她分開了。'],['咕咕','我看見她抓住浮木了！河谷的木木能接應，我們沿岸去找他。'],['小米','就算害怕，我也想試試。你陪我，好嗎？'],['咕咕','我陪你！這裡有一串淺灘石頭，選穩落點，一顆一顆跳過去。']],()=>{f.routeKnown=true;g.checkpoint(3.8,-3.7);g.trials.start('dash');});return;}
      if(f.routeKnown){if(f.dashStage<3){g.trials.start('dash');return;}this.say([['咕咕','媽媽和灰爪都被沖往下游了。我陪你沿河谷步道，找木木接應媽媽。']]);return;}
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
      if(f.separated){this.say([['小米','媽媽被水流帶往河谷了。我要和咕咕沿岸去找她。']]);return;}
      if(f.reunited){this.beginCrossing();return;}
      g.world.hug=true;g.player.setPosition(2,-3.35);g.player.mesh.rotation.y=Math.PI;
      this.say([['小米','媽媽！我找到你了！'],['媽媽','小米！讓媽媽抱抱。謝謝你一直想辦法，也謝謝朋友們照顧你。'],['小米','我修好了風管，也記住了你的歌。想你的時候，我就一小步一小步走。'],['灰爪','找到你了，小女孩！跟我走！'],['媽媽','不准靠近她！小米，到咕咕身邊去！']],()=>{f.reunited=true;g.world.hug=false;g.checkpoint(2,-3.35);this.beginCrossing();});return;
    }
    if(id==='forest-exit'){
      if(!f.separated){g.toast('媽媽就在橋邊，我們先去找她。');return;}
      if(!f.routeKnown){g.toast('先和咕咕說說話，一起確認安全的路。');return;}
      if(f.dashStage<3){g.trials.start('dash');return;}
      this.say([['小米','媽媽被沖往下游了。我要帶著她的歌，沿河谷去找她。'],['咕咕','你的記憶之光已經亮了。走吧，河谷裡還有願意幫忙的朋友。']],()=>{f.completed=true;g.checkpoint(11.1,-3.5);g.audio.chime();g.showEnding();});
    }
  }
  songComplete(){
    const g=this.game;if(g.state.forest.round!==3)return;
    g.checkpoint(0,4.5);g.audio.chime();
    this.say([['小米','那個身影……是媽媽！'],['咕咕','風突然變大了！左右換跑道，躲開迎面的陣風。'],['媽媽','我在前面等你，跟著咕咕慢慢來！']],()=>g.trials.start('gust'));
  }
  beginCrossing(){
    const g=this.game,w=g.world;if(g.state.forest.separated||!g.state.forest.reunited)return;
    this.elapsed=0;this.running=true;g.state.mode='cutscene';g.input.reset();
    w.cutscene=true;w.hug=false;w.protecting=false;w.struggling=false;w.falling=false;w.sweptAway=false;w.bridgeTarget=0;
    w.mother.mesh.visible=true;w.mother.mesh.position.set(2,0,-4.3);w.mother.mesh.rotation.set(0,0,0);
    w.villain.mesh.visible=true;w.villain.mesh.position.set(-7,0,-3.8);w.villain.mesh.rotation.set(0,Math.PI/2,0);
    w.flood.visible=w.floatwood.visible=w.spray.visible=false;w.mistAmount=0;
    g.player.setPosition(2,-3.35);w.owl.mesh.position.set(6,0,-3.2);g.view.override=new THREE.Vector3(1,0,-5.5);
    document.getElementById('story-caption').hidden=false;document.body.classList.add('in-cutscene');
    document.getElementById('story-caption').textContent='灰爪伸手追來。媽媽立刻擋在小米前面。';
  }
  update(dt){
    const g=this.game;if(!this.running||g.state.mode!=='cutscene')return;
    this.elapsed+=dt;const t=this.elapsed,w=g.world,m=w.mother.mesh,v=w.villain.mesh,p=g.player.mesh;
    const clamp=x=>Math.max(0,Math.min(1,x)),caption=document.getElementById('story-caption');
    const approach=clamp(t/2.8);v.position.set(-7+8*approach,0,-3.8-.8*approach);
    const shelter=clamp(t/2);p.position.set(2+2*shelter,0,-3.35+.25*shelter);p.rotation.y=-Math.PI/2;
    w.protecting=t>=1&&t<2.8;w.struggling=t>=2.8&&t<5.6;w.falling=t>=5.6&&t<6.8;
    if(t<2.8){const block=clamp(t/2.5);m.position.set(2,0,-4.3+.25*block);m.rotation.y=-Math.PI/2;}
    if(w.struggling){
      // Face each other, grip at arm's length, and stumble toward the river together.
      const grapple=clamp((t-2.8)/2.8),angle=.46+(g.reducedMotion?0:Math.sin(grapple*Math.PI*4)*.32);
      const cx=1.5+2.5*grapple,cz=-4.3-.65*grapple,dx=Math.cos(angle)*.65,dz=Math.sin(angle)*.65;
      m.position.set(cx+dx,0,cz+dz);v.position.set(cx-dx,0,cz-dz);
      m.rotation.y=Math.atan2(v.position.x-m.position.x,v.position.z-m.position.z);v.rotation.y=m.rotation.y+Math.PI;
      m.rotation.z=g.reducedMotion?0:Math.sin(t*8)*.12;v.rotation.z=-m.rotation.z;
      caption.textContent='媽媽抓住灰爪的手臂，兩人扭打著退到河沿。';
    }
    if(t>=5.6){
      w.protecting=false;w.sweptAway=true;w.floatwood.visible=t>=6.8;w.spray.visible=true;
      const fall=clamp((t-5.6)/1.2),drift=clamp((t-6.8)/4.9),dx=Math.cos(.46)*.65,dz=Math.sin(.46)*.65;
      const cx=4+fall*.8+drift*9.6,cz=-4.95-fall*2.6;
      m.position.set(cx+dx,-.3*fall,cz+dz);v.position.set(cx-dx,-.3*fall,cz-dz);
      const tumble=g.reducedMotion?0:Math.sin(fall*Math.PI)*.75;
      m.rotation.set(tumble,fall<1?-Math.PI/2-.46:Math.PI/2,tumble*.35);
      v.rotation.set(-tumble,fall<1?Math.PI/2-.46:Math.PI/2,-tumble*.35);
      w.flood.visible=t<7.1;w.flood.position.x=1+(t-5.6)*8;
      w.owl.mesh.position.set(6,0,-3.2);g.view.override.set(2+drift*5,0,-5.5);
      const shouting=t>=6.8&&t<9.6;caption.classList.toggle('shout',shouting);
      if(shouting)m.rotation.y=0;
      caption.textContent=w.falling?'河沿一滑！媽媽和灰爪一起跌進河裡，濺起水花。':shouting?'媽媽：「小米，快逃啊！」':'媽媽抓住浮木，被沖往下游。咕咕護著岸上的小米。';
    }
    if(t>=12){
      this.running=false;w.cutscene=false;g.view.override=null;document.body.classList.remove('in-cutscene');caption.hidden=true;caption.classList.remove('shout');
      g.state.forest.separated=true;g.state.mode='playing';g.checkpoint(4,-3.2);
      this.say([['小米','媽媽為了保護我，和灰爪一起掉進河裡，被水沖走了！'],['咕咕','媽媽抓住浮木了，灰爪也被沖往下游。別跳水，我陪你沿岸走。'],['咕咕','我會吹響河谷的求救哨，請木木在下游接應。'],['小米','好。我們帶著船票，一起去找木木。']],()=>g.toast('和咕咕確認通往河谷的路。',5000));
    }
  }
  objective(){
    const f=this.game.state.forest;
    if(!f.metOwl)return {step:1,total:5,title:'找到貓頭鷹咕咕',detail:'媽媽就在森林裡。先問問戴藍圍巾的咕咕。',emotion:'希望 · 熟悉的歌聲',target:'owl'};
    if(f.round<3)return {step:2,total:5,title:`找回三段旋律 · ${f.round} / 3`,detail:'到合奏台模仿旋律。最後一段，要把回聲倒著敲。',emotion:'希望 · 我記得媽媽的歌',target:'music'};
    if(f.gustStage<6)return {step:3,total:5,title:'闖過疾風小徑',detail:'到合奏台或找咕咕，左右閃過十八波陣風。',emotion:'勇敢 · 媽媽就在前面',target:'music'};
    if(!f.reunited)return {step:3,total:5,title:'走到媽媽身邊',detail:'藤蔓已經讓開了。走近媽媽，給她一個擁抱。',emotion:'找回 · 媽媽，我在這裡',target:'mother'};
    if(!f.separated)return {step:3,total:5,title:'留在咕咕身邊',detail:'媽媽擋住灰爪，先和咕咕待在岸上。',emotion:'找回 · 熟悉的擁抱',target:'mother'};
    if(!f.routeKnown)return {step:4,total:5,title:'和咕咕一起想辦法',detail:'媽媽被水帶往河谷。找咕咕，沿岸去找木木接應。',emotion:'再失去 · 也可以繼續往前',target:'owl'};
    if(f.dashStage<3)return {step:5,total:5,title:'沿著河上石頭前進',detail:'找咕咕開始。左右選金色石頭，等浪退，按一下跳過九顆石頭。',emotion:'勇敢 · 抓準時機',target:'owl'};
    return {step:5,total:5,title:'前往月光河谷步道',detail:'沿右邊的小路走，到河谷找接應媽媽的木木。',emotion:'勇敢 · 這次我知道方向',target:'forest-exit'};
  }
  target(){
    const g=this.game,id=this.objective().target;
    const targets={owl:[g.world.owl.mesh,g.world.owlLabel,'跟著光點找咕咕，他會陪你想辦法。'],music:[g.world.stand,g.world.standLabel,'到合奏台按互動。先播放旋律，再跟著圖案敲；最後一段要倒過來。'],mother:[g.world.mother.mesh,g.world.motherLabel,'媽媽在橋前。穿過藤蔓門，走近她再按互動。'],'forest-exit':[g.world.exit,g.world.exitLabel,'往畫面右邊走，找到「月光河谷步道」路牌，再按互動。']};
    const [object,label,text]=targets[id];const f=g.state.forest;
    return {position:object.position,label,text:f.round===3&&f.gustStage<6?'到合奏台按互動，挑戰疾風小徑。':f.routeKnown&&f.dashStage<3?'找咕咕挑戰河上跳石頭。左右選落點，等金光亮起再跳。':text};
  }
};
