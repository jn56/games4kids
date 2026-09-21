'use strict';
Meadow.JourneyStory = class {
  constructor(game,chapter){this.game=game;this.chapter=chapter;this.running=false;}
  say(lines,done){this.game.dialogue.show(lines.map(([name,text])=>({name,text})),done);}
  intro(){
    this.say(this.chapter===3?[['小米','又和媽媽分開了……河水好急，我有一點怕。'],['木木','我是修橋員木木。媽媽正往山丘走，我陪你過河！'],['小米','我可以先做一小步。木木，我們一起想辦法。']]:[['小米','媽媽就在山丘那邊！可是天色暗了，她看得見我嗎？'],['星星','我是觀星員星星。把沿途的三盞燈點亮，媽媽就能循光走過來。']]);
  }
  objective(){
    const s=this.game.state,v=s.valley,h=s.hill;
    const row=this.chapter===3?(!v.metBeaver?[1,'找木木一起過河','先和戴安全帽的木木說話。','beaver']:v.bridge<3?[2,`修好月光橋 · ${v.bridge} / 3`,'到工作臺，看準時機敲穩橋板。','bench']:v.raft<4?[3,'走過橋，搭上木筏','木筏在中央小島的另一端。','dock']:[4,'和木木走向星光山丘','到對岸步道，帶著勇氣出發。','exit']):(!h.metSquirrel?[1,'找觀星員星星','和戴紫色圍巾的松鼠說話。','squirrel']:h.lights.length<3?[2,`點亮信號燈 · ${h.lights.length} / 3`,'走近未亮的燈，用望遠鏡對準星光。','beacon']:!h.reunited?[3,'點亮最後的陪伴之光','到山丘頂，讓媽媽看見我們！','signal']:[4,'牽著媽媽，一起回家','走向右邊亮著暖光的小屋。','home']);
    return {step:row[0],total:4,title:row[1],detail:row[2],target:row[3],emotion:this.chapter===3?'勇敢 · 一起跨出一小步':'重逢 · 我們一起回家'};
  }
  target(){
    const w=this.game.world,o=this.objective();let object,label;
    if(o.target==='beacon'){const b=w.beacons.find(b=>!this.game.state.hill.lights.includes(b.id));object=b.mesh;label=b.label;}
    else{const names={beaver:['beaver','beaverLabel'],bench:['bench','benchLabel'],dock:['dock','dockLabel'],exit:['exit','exitLabel'],squirrel:['squirrel','squirrelLabel'],signal:['signal','signalLabel'],home:['home','homeLabel']},[key,labelKey]=names[o.target];object=w[key].mesh||w[key];label=w[labelKey];}
    return {position:object.position,label,text:o.detail};
  }
  candidates(){
    const g=this.game,w=g.world,s=g.state;
    const item=(id,object,text)=>({id,position:(object.mesh||object).position,text});
    if(this.chapter===3)return [item('beaver',w.beaver,'和木木說話'),...(s.valley.metBeaver&&s.valley.bridge<3?[item('bench',w.bench,'一起修好月光橋')]:[]),...(s.valley.bridge===3&&s.valley.raft<4?[item('dock',w.dock,'和木木乘木筏')]:[]),...(s.valley.raft===4?[item('exit',w.exit,'前往星光山丘')]:[])];
    return [item('squirrel',w.squirrel,'和星星說話'),...(s.hill.metSquirrel?w.beacons.filter(b=>!s.hill.lights.includes(b.id)).map(b=>item(b.id,b.mesh,`點亮${b.name}`)):[]),...(s.hill.lights.length===3&&!s.hill.reunited?[item('signal',w.signal,'讓媽媽看見我！')]:[]),...(s.hill.reunited?[...(g.player.mesh.position.distanceTo(w.home.position)<CONFIG.INTERACT_DISTANCE?[]:[item('mother',w.mother,'和媽媽說話')]),item('home',w.home,'和媽媽一起回家')]:[])];
  }
  interact(id){
    const g=this.game,s=g.state,v=s.valley,h=s.hill;if(s.mode!=='playing')return;
    if(this.chapter===3){
      if(id==='beaver'){
        if(!v.metBeaver)this.say([['木木','橋板被水沖鬆了。我扶住木頭，你看準時機敲一下。'],['小米','我還是有一點怕……但我願意試試看。'],['木木','害怕也可以求助。我會一直在旁邊。']],()=>{v.metBeaver=true;g.checkpoint(-2,6);});
        else this.say([['木木',v.raft===4?'剛剛是你幫我看清水路。你已經走了好遠！':v.bridge===3?'從橋走到小島另一端，我們一起搭木筏。':'去工作臺吧，等指針進入金色區域再敲。']]);return;
      }
      if(id==='bench'){g.expedition.start('bridge');return;}
      if(id==='dock'){g.expedition.start('raft');return;}
      if(id==='exit'&&v.raft===4)this.say([['小米','原來勇敢不是不害怕，是害怕的時候也肯試試看。'],['木木','你也知道找人幫忙。看，媽媽的山丘就在前面！']],()=>{v.completed=true;g.checkpoint(0,-13);g.showEnding();});
      return;
    }
    if(id==='squirrel'){
      if(!h.metSquirrel)this.say([['星星','三座信號燈，要用望遠鏡接住星光。按住左右，讓光圈跟著星星。'],['小米','我帶來了希望、記憶，還有勇氣！'],['星星','想先去哪一盞都可以。每點亮一盞，我都會記住。']],()=>{h.metSquirrel=true;g.checkpoint(-1,8);});
      else this.say([['星星',h.reunited?'你和媽媽的光，終於在一起了。':h.lights.length===3?'三盞燈都亮了！去山丘頂，點亮最後一盞吧。':'找到未亮的燈，讓光圈跟著星星，直到光充滿。']]);return;
    }
    if(Meadow.BEACONS.some(b=>b.id===id)){g.expedition.start('star',id);return;}
    if(id==='signal'&&h.lights.length===3&&!h.reunited){h.signal=true;g.checkpoint(0,-7.7);this.beginReunion();return;}
    if(id==='mother'&&h.reunited){this.say([['媽媽','一路上一定很不容易。謝謝你告訴朋友，你需要幫忙。'],['小米','媽媽，我們一起走回家吧。']]);return;}
    if(id==='home'&&h.reunited)this.say([['小米','我想把今天的故事，慢慢說給你聽。'],['媽媽','好。我們一起回家，我會好好聽。']],()=>this.beginHome());
  }
  challengeComplete(kind,beacon){
    const g=this.game;
    if(kind==='bridge')this.say([['木木','三段橋都穩了！我們走到小島上，再坐木筏去對岸。'],['小米','是我們一起修好的橋！']],()=>g.toast('沿著金色光點走過橋。'));
    else if(kind==='raft')this.say([['木木','靠岸了！謝謝你幫忙看浮燈，我們配合得真好。'],['小米','河水還是很急，但我知道自己可以怎麼做了。']]);
    else {const texts={hope:'花田的朋友，讓我知道可以開口求助。',memory:'媽媽的歌，一直記在我心裡。',courage:'木木陪我過河，我也學會幫忙。'};this.say([['小米',texts[beacon]],['星星',g.state.hill.lights.length===3?'三盞燈亮了！到山丘頂，點亮最後的陪伴之光。':'這道光會照著路。我們去下一盞吧。']]);}
  }
  readJournal(){this.say([['小米',this.objective().detail],[this.chapter===3?'木木':'星星',this.chapter===3?'每修好一段橋、每穿過一道浮燈，都會記住。失手只要再試這一小步。':'每盞信號燈都會記住。對準星光需要一點練習，我會幫你穩住望遠鏡。']]);}
  beginReunion(){
    const g=this.game;this.running='reunion';this.elapsed=0;g.state.mode='cutscene';g.world.cutscene=true;g.world.hug=false;g.input.reset();g.player.setPosition(0,-7.7);g.world.mother.mesh.position.set(4,0,-13);g.refresh();
    g.view.override=new THREE.Vector3(0,0,-9);document.body.classList.add('in-cutscene');this.caption('媽媽看見了那道光。');
  }
  caption(text){const el=document.getElementById('story-caption');el.textContent=text;el.hidden=false;}
  endScene(){const g=this.game;this.running=false;g.world.cutscene=false;g.world.hug=false;g.view.override=null;document.body.classList.remove('in-cutscene');document.getElementById('story-caption').hidden=true;g.state.mode='playing';}
  beginHome(){
    const g=this.game;this.running='home';this.elapsed=0;g.checkpoint(6.5,9);g.state.mode='cutscene';g.world.cutscene=true;g.world.hug=false;g.input.reset();g.view.override=new THREE.Vector3(7,0,7);document.body.classList.add('in-cutscene');this.caption('四盞燈，一條回家的路。');
  }
  update(dt){
    const g=this.game;if(!this.running||g.state.mode!=='cutscene')return;this.elapsed+=dt;
    const m=g.world.mother.mesh,p=g.player.mesh;
    if(this.running==='reunion'){
      const t=Math.min(1,this.elapsed/3.3),ease=t*t*(3-2*t);m.position.set(4*(1-ease),0,-13+4.45*ease);m.rotation.y=Math.atan2(-4,4.45);p.rotation.y=Math.PI;
      if(t===1){g.world.hug=true;m.rotation.y=0;this.caption('媽媽，我真的找到你了。');}
      if(this.elapsed>5.2){this.running=false;document.getElementById('story-caption').hidden=true;document.body.classList.remove('in-cutscene');
        this.say([['媽媽','小米！我看見你的光了。讓你擔心了，抱抱。'],['小米','我好想你。我怕的時候，有朋友陪我，也有你的歌。'],['媽媽','謝謝大家照顧小米。接下來，我們一起走。']],()=>{this.endScene();g.state.hill.reunited=true;g.checkpoint(0,-7.7);g.audio.chime();});}
    }else{
      const t=Math.min(1,this.elapsed/3);p.position.set(6.65,0,9-t*2);m.position.set(7.4,0,9.1-t*2);p.rotation.y=m.rotation.y=Math.PI;
      if(!g.reducedMotion)g.player.legs.forEach((leg,i)=>leg.rotation.x=Math.sin(this.elapsed*8+i*Math.PI)*.3);
      if(t===1){this.endScene();g.state.hill.completed=true;g.checkpoint(6.5,8);g.audio.chime();g.showEnding();}
    }
  }
};
