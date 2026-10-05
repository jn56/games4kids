'use strict';
Meadow.JourneyStory = class {
  constructor(game,chapter){this.game=game;this.chapter=chapter;this.running=false;}
  say(lines,done){this.game.dialogue.show(lines.map(([name,text])=>({name,text})),done);}
  intro(){
    this.say(this.chapter===3?[['小米','媽媽和灰爪扭打，一起掉進河裡了……我要找到她。'],['木木','我是木木！我接住媽媽的浮木了，她已上岸，正去山丘找星星求助。'],['木木','灰爪也被巡林員救起，送去休息照顧了。'],['小米','媽媽上岸了！謝謝你，木木。我們一起過河去找她。']]:[['小米','媽媽就在山丘那邊！可是天色暗了，她看得見我嗎？'],['星星','我是觀星員星星。媽媽上岸後很累。先點亮三盞燈，再一起接她到避風處。']]);
  }
  objective(){
    const s=this.game.state,v=s.valley,h=s.hill;
    const row=this.chapter===3?(!v.metBeaver?[1,'找木木一起過河','先和戴安全帽的木木說話。','beaver']:v.bridge<3?[2,`修好月光橋 · ${v.bridge} / 3`,'到工作臺，看準時機敲穩橋板。','bench']:v.raft<4?[3,'走過橋，搭上木筏','木筏在中央小島的另一端。','dock']:[4,'和木木走向星光山丘','到對岸步道，帶著勇氣出發。','exit']):(!h.metSquirrel?[1,'找觀星員星星','和戴紫色圍巾的松鼠說話。','squirrel']:h.lights.length<3?[2,`點亮信號燈 · ${h.lights.length} / 3`,'走近未亮的燈，用望遠鏡對準星光。','beacon']:!h.reunited?[3,h.signal?'保護媽媽，走到避風處':'點亮最後的陪伴之光',h.signal?'回到山丘頂，護住媽媽，避開灰爪追擊。':'到山丘頂，讓媽媽看見我們！','signal']:[4,'牽著媽媽，一起回家','走向右邊亮著暖光的小屋。','home']);
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
    return [item('squirrel',w.squirrel,'和星星說話'),...(s.hill.metSquirrel?w.beacons.filter(b=>!s.hill.lights.includes(b.id)).map(b=>item(b.id,b.mesh,`點亮${b.name}`)):[]),...(s.hill.lights.length===3&&!s.hill.reunited?[item('signal',w.signal,s.hill.signal?'接著護送媽媽':'讓媽媽看見我！')]:[]),...(s.hill.reunited?[...(g.player.mesh.position.distanceTo(w.home.position)<CONFIG.INTERACT_DISTANCE?[]:[item('mother',w.mother,'和媽媽說話')]),item('home',w.home,'和媽媽一起回家')]:[])];
  }
  interact(id){
    const g=this.game,s=g.state,v=s.valley,h=s.hill;if(s.mode!=='playing')return;
    if(this.chapter===3){
      if(id==='beaver'){
        if(!v.metBeaver)this.say([['小米','木木，這是媽媽在花田留下的月光船票。'],['木木','船票上畫著兩盞浮燈，要從中央穿過。我會陪你搭木筏。'],['木木','橋板被水沖鬆了。每段要固定三枚鉚釘。先解算式，再瞄準正確數字敲。'],['小米','我還是有一點怕……但我願意試試看。'],['木木','害怕也可以求助。我會一直在旁邊。']],()=>{v.metBeaver=true;g.checkpoint(-2,6);});
        else this.say([['木木',v.raft===4?'剛剛是你幫我看清水路。你已經走了好遠！':v.bridge===3?'從橋走到小島另一端，我們一起搭木筏。':'去工作臺吧，等指針進入金色區域再敲。']]);return;
      }
      if(id==='bench'){g.expedition.start('bridge');return;}
      if(id==='dock'){g.expedition.start('raft');return;}
      if(id==='exit'&&v.raft===4)this.say([['小米','原來勇敢不是不害怕，是害怕的時候也肯試試看。'],['木木','你也知道找人幫忙。看，媽媽的山丘就在前面！']],()=>{v.completed=true;g.checkpoint(0,-13);g.showEnding();});
      return;
    }
    if(id==='squirrel'){
      if(!h.metSquirrel)this.say([['小米','我從花田的引路燈下，帶來了這片星光鏡片！'],['星星','正好是望遠鏡缺的鏡片！裝好了，就能看見星光的光圈。'],['星星','三座信號燈，要用望遠鏡接住星光。左右追蹤充能，等金色曝光窗按 E 拍下；每盞燈拍三次。'],['小米','我帶來了希望、記憶，還有勇氣！'],['星星','想先去哪一盞都可以。每點亮一盞，我都會記住。']],()=>{h.metSquirrel=true;g.checkpoint(-1,8);});
      else this.say([['星星',h.reunited?'你和媽媽的光，終於在一起了。':h.lights.length===3?'三盞燈都亮了！去山丘頂，點亮最後一盞吧。':'找到未亮的燈，追蹤充能後，等金色曝光窗，按 E 拍下三次。']]);return;
    }
    if(Meadow.BEACONS.some(b=>b.id===id)){g.expedition.start('star',id);return;}
    if(id==='signal'&&h.lights.length===3&&!h.reunited){h.signal=true;g.checkpoint(0,-7.7);this.beginReunion();return;}
    if(id==='mother'&&h.reunited){this.say([['媽媽','在河邊是我護著你，剛才是你護著我。謝謝你，小米。'],['小米','媽媽，我們一起走回家吧。']]);return;}
    if(id==='home'&&h.reunited)this.say([['小米','我想把今天的故事，慢慢說給你聽。'],['媽媽','好。我們一起回家，我會好好聽。']],()=>this.beginHome());
  }
  challengeComplete(kind,beacon){
    const g=this.game;
    if(kind==='escort'){this.beginReunion();return;}
    if(kind==='bridge')this.say([['木木','三段橋都穩了！我們走到小島上，再坐木筏去對岸。'],['小米','是我們一起修好的橋！']],()=>g.toast('沿著金色光點走過橋。'));
    else if(kind==='raft')this.say([['木木','靠岸了！謝謝你幫忙看浮燈，我們配合得真好。'],['小米','河水還是很急，但我知道自己可以怎麼做了。']]);
    else {const texts={hope:'花田的朋友，讓我知道可以開口求助。',memory:'媽媽的歌，一直記在我心裡。',courage:'木木陪我過河，我也學會幫忙。'};this.say([['小米',texts[beacon]],['星星',g.state.hill.lights.length===3?'三盞燈亮了！到山丘頂，點亮最後的陪伴之光。':'這道光會照著路。我們去下一盞吧。']]);}
  }
  readJournal(){const item=Meadow.Keepsakes.forChapter(this.chapter);this.say([['小米',item.name+'：'+item.clue],['小米',this.objective().detail],[this.chapter===3?'木木':'星星',this.chapter===3?'每修好一段橋、每穿過一道浮燈，都會記住。失手只要再試這一小步。':'灰爪追來時，帶媽媽走金燈中間。每到安全點都會記住，我會接應你們。']]);}
  beginReunion(){
    if(this.game.state.hill.escort<3){this.beginProtection();return;}
    const g=this.game;this.running='reunion';this.elapsed=0;g.state.mode='cutscene';g.world.cutscene=true;g.world.hug=false;g.input.reset();g.player.setPosition(0,-7.7);g.world.mother.mesh.position.set(4,0,-13);g.refresh();
    g.view.override=new THREE.Vector3(0,0,-9);document.body.classList.add('in-cutscene');g.world.protecting=true;g.world.safetyGate.visible=true;g.world.safetyGate.position.y=2.8;g.world.villain.mesh.visible=true;g.world.villain.mesh.position.set(-.8,0,-13.5);g.world.villain.mesh.rotation.y=0;this.caption('小米護送媽媽進門，伸手拉下木柵門。');
  }
  beginProtection(){
    const g=this.game;this.running='protection';this.elapsed=0;g.state.mode='cutscene';g.world.cutscene=true;g.world.protecting=true;g.world.hug=false;g.input.reset();g.player.setPosition(0,-7.7);
    g.world.safetyGate.visible=false;g.world.villain.mesh.visible=true;g.world.villain.mesh.position.set(-6,0,-10);g.world.villain.mesh.rotation.y=Math.PI/2;g.world.mother.mesh.position.set(4,0,-13);g.world.mother.mesh.rotation.set(0,0,0);g.view.override=new THREE.Vector3(1,0,-9);document.body.classList.add('in-cutscene');this.caption('灰爪追上山丘，伸手衝向疲累的媽媽！');
  }
  caption(text){const el=document.getElementById('story-caption');el.textContent=text;el.hidden=false;}
  endScene(){const g=this.game;this.running=false;g.world.cutscene=false;g.world.hug=false;g.world.protecting=false;g.world.villain.mesh.visible=false;g.world.mother.mesh.rotation.z=0;g.world.mother.mesh.position.y=0;g.view.override=null;document.body.classList.remove('in-cutscene');document.getElementById('story-caption').hidden=true;g.state.mode='playing';}
  beginHome(){
    const g=this.game;this.running='home';this.elapsed=0;g.checkpoint(6.5,9);g.state.mode='cutscene';g.world.cutscene=true;g.world.hug=false;g.input.reset();g.view.override=new THREE.Vector3(7,0,7);document.body.classList.add('in-cutscene');this.caption('四盞燈，一條回家的路。');
  }
  update(dt){
    const g=this.game;if(!this.running||g.state.mode!=='cutscene')return;this.elapsed+=dt;
    const m=g.world.mother.mesh,p=g.player.mesh;
    if(this.running==='protection'){
      const t=this.elapsed,u=Math.min(1,t/1.8),reach=Math.min(1,Math.max(0,(t-1)/1.5));
      m.position.set(4-1.2*u,-.18*Math.sin(u*Math.PI/2),-13+3.1*u);m.rotation.set(0,0,g.reducedMotion?0:.23*Math.sin(u*Math.PI/2));
      p.position.set(1.6*reach,0,-7.7-2*reach);p.rotation.y=-Math.PI/2;g.world.villain.mesh.position.set(-6+6.15*Math.min(1,t/2.5),0,-10);g.world.villain.mesh.rotation.y=Math.PI/2;
      if(t>1.5)this.caption('小米擋在媽媽前面：「不准傷害我媽媽！」');
      if(t>3.6){this.endScene();g.world.villain.mesh.visible=true;this.say([['灰爪','我離開休息站，一路追過來了！你們別想走！'],['媽媽','小米，小心！我的腿還使不上力……'],['小米','不准傷害媽媽！媽媽，牽著我，這次換我保護妳。'],['星星','跟著金燈躲開灰爪！我來接應，你們快進安全門。']],()=>g.expedition.start('escort'));}
    }else if(this.running==='reunion'){

      const close=Math.min(1,this.elapsed/1.5),t=THREE.MathUtils.clamp((this.elapsed-2.2)/3.3,0,1),ease=t*t*(3-2*t);
      g.world.safetyGate.position.y=2.8*(1-close);g.world.protecting=this.elapsed<2.2;
      const enemy=g.world.villain.mesh;enemy.position.set(-.8-Math.max(0,this.elapsed-1.5)*1.5,0,-13.5+1.3*close);enemy.rotation.y=this.elapsed>1.5?-Math.PI/2:0;enemy.visible=this.elapsed<3.5;
      m.position.set(1-ease,0,-8.7+.15*ease);m.rotation.y=0;p.position.set(0,0,-9.6+1.9*Math.min(1,this.elapsed/2.2));p.rotation.y=Math.PI;
      if(this.elapsed>1.5&&t<1)this.caption('木柵門擋住灰爪。媽媽安全了！');
      if(t===1){g.world.hug=true;m.rotation.y=0;this.caption('媽媽，我真的找到你了。');}
      if(this.elapsed>7.4){this.running=false;document.getElementById('story-caption').hidden=true;document.body.classList.remove('in-cutscene');
        this.say([['媽媽','在河邊，我想保護你。剛才，是你護著我，沒有讓灰爪傷害我。'],['小米','媽媽，這次換我保護妳。我也請星星一起幫忙了。'],['星星','木柵門關好了。我已通知巡林員來接手。'],['媽媽','謝謝你，也謝謝朋友們。我們一起回家。']],()=>{this.endScene();g.state.hill.reunited=true;g.checkpoint(0,-7.7);g.audio.chime();});}
    }else{
      const t=Math.min(1,this.elapsed/3);p.position.set(6.65,0,9-t*2);m.position.set(7.4,0,9.1-t*2);p.rotation.y=m.rotation.y=Math.PI;
      if(!g.reducedMotion)g.player.legs.forEach((leg,i)=>leg.rotation.x=Math.sin(this.elapsed*8+i*Math.PI)*.3);
      if(t===1){this.endScene();g.state.hill.completed=true;g.checkpoint(6.5,8);g.audio.chime();g.showEnding();}
    }
  }
};
