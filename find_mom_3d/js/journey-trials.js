'use strict';
Meadow.JourneyTrials = class {
  constructor(game){
    this.game=game;this.active=false;this.held=0;
    this.ui=document.getElementById('journey-ui');
    document.getElementById('journey-start').onclick=()=>this.begin();
    document.getElementById('journey-leave').onclick=()=>this.leave();
    document.getElementById('journey-hit').onclick=()=>this.strike();
    for(const [id,direction] of [['journey-left',-1],['journey-right',1]]){
      const button=document.getElementById(id);
      button.addEventListener('pointerdown',e=>{if(this.game.state.mode!=='journey')return;e.preventDefault();button.setPointerCapture(e.pointerId);this.held=direction;});
      for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,()=>this.release());
    }
    window.addEventListener('blur',()=>{this.release();if(this.game.state.mode==='journey')this.game.togglePause();});
  }
  release(){this.held=0;}
  start(kind,beacon=null){
    const g=this.game,s=g.state,v=s.valley,h=s.hill;
    if(s.mode!=='playing'||this.active)return;
    if((kind==='raft'&&!Meadow.Keepsakes.has(s,'ticket'))||(kind==='star'&&!Meadow.Keepsakes.has(s,'lens'))){g.toast(kind==='raft'?'需要花田信封裡的月光船票。':'需要引路燈下的星光鏡片。');return;}
    if(kind==='bridge'&&(s.chapter!==3||!v.metBeaver||v.bridge===3))return;
    if(kind==='raft'&&(s.chapter!==3||v.bridge!==3||v.raft===4))return;
    if(kind==='star'&&(s.chapter!==4||!h.metSquirrel||!Meadow.BEACONS.some(b=>b.id===beacon)||h.lights.includes(beacon)))return;
    this.kind=kind;this.beacon=beacon;this.active=true;this.running=false;this.elapsed=0;this.needle=.5;this.cooldown=0;this.focus=0;this.aim=0;this.roundTime=0;this.failTimer=0;this.release();g.input.reset();
    this.returnPoint=kind==='bridge'?{x:-1.5,z:4.5}:kind==='raft'?{x:0,z:-5.3}:{x:g.player.mesh.position.x,z:g.player.mesh.position.z};
    g.player.mesh.rotation.y=Math.PI;
    g.checkpoint(this.returnPoint.x,this.returnPoint.z);s.mode='journey';
    document.body.classList.add('in-journey');this.ui.hidden=false;
    document.getElementById('journey-ready').hidden=false;
    document.getElementById('journey-steer').hidden=kind==='bridge';
    document.getElementById('journey-hit').hidden=kind!=='bridge';
    document.getElementById('bridge-timing').hidden=kind!=='bridge';
    document.getElementById('journey-title').textContent={bridge:'一起修好月光橋',raft:'木木掌舵，你來引路',star:'追上星光'}[kind];
    document.getElementById('journey-instruction').textContent={bridge:'指針進入金色區域時，按空白鍵或「敲一下」。修好三段橋！',raft:'木木收好船票了！按住 ← → 或 A / D，照船票的提示，穿過兩盞金色浮燈中央。',star:'星光鏡片裝好了！按住 ← → 或 A / D，讓光圈跟著星星，直到信號燈亮起。'}[kind];
    for(const side of ['left','right'])document.getElementById(`journey-${side}`).setAttribute('aria-label',`${side==='left'?'向左':'向右'}${kind==='raft'?'划船':'移動光圈'}`);
    if(kind==='bridge'){g.player.setPosition(-1.5,4.5);g.view.override=new THREE.Vector3(0,0,1);}
    else {this.buildArena();g.worldCache[s.chapter].layer.visible=false;g.view.override=new THREE.Vector3(0,0,kind==='raft'?1:-1);}
    this.setStatus('準備好了再開始。');this.paint();document.getElementById('journey-start').focus({preventScroll:true});
  }
  buildArena(){
    const g=this.game,A=Meadow.Art;this.root=new THREE.Group();g.scene.add(this.root);
    if(this.kind==='raft'){
      A.part(this.root,'box',0x538fa5,[0,-.28,0],[16,.5,40]);
      for(const x of [-7,7]){A.part(this.root,'box',0x839996,[x,.02,0],[2,.5,40]);for(let z=-16;z<20;z+=3)A.part(this.root,'pebble',0x9fa7a4,[x,.5,z],[.7,.65,.9]);}
      this.boat=A.group(this.root,0,7);for(let x=-1;x<=1;x+=.5)A.part(this.boat,'cylinder',0xb18e69,[x,.15,0],[.25,2.6,.25]).rotation.x=Math.PI/2;
      this.helper=new Meadow.Beaver(this.boat,0,1);this.helper.mesh.scale.setScalar(.7);
      this.gate=A.group(this.root,0,-9);this.gateCenter=0;
      this.buoys=[-1,1].map(side=>{const b=A.group(this.gate);A.part(b,'cylinder',0xdec078,[0,.4,0],[.22,.8,.22]);A.part(b,'ball',0xffe0a0,[0,.9,0],[.3,.3,.3]);return {mesh:b,side};});
      this.rocks=[];for(let x=-5;x<=5;x+=.7)this.rocks.push(A.part(this.gate,'pebble',0x899b9e,[x,.12,0],[.48,.55,.7]));
      this.wakes=[];for(let i=0;i<18;i++)this.wakes.push(A.part(this.root,'box',0xa0ced5,[(i%5-2)*2.4,.01,(i*2)%28-14],[.5,.015,1.2],false));
      this.raftX=0;g.player.setPosition(0,7);g.player.mesh.position.y=.3;
    }else{
      A.part(this.root,'cylinder',0x9293ae,[0,-.2,0],[9,.35,9]);
      this.star=new THREE.Group();this.root.add(this.star);this.star.position.set(0,3.1,-3);
      for(let i=0;i<5;i++){const ray=A.part(this.star,'cone',0xffde8f,[Math.sin(i*Math.PI*2/5)*.22,Math.cos(i*Math.PI*2/5)*.22,0],[.16,.65,.12]);ray.rotation.z=-i*Math.PI*2/5;}
      this.ring=new THREE.Mesh(new THREE.TorusGeometry(.68,.045,8,48),new THREE.MeshBasicMaterial({color:0xd7eee7}));this.root.add(this.ring);this.ring.rotation.x=-.6;this.ring.position.set(0,3.1,-3);
      for(let i=0;i<38;i++)A.part(this.root,'ball',0xdad4c2,[Math.sin(i*43)*8,2+Math.abs(Math.cos(i*12))*5,-6-Math.abs(Math.sin(i*9))*7],[.035,.035,.035],false);
      const scope=A.group(this.root,0,4);A.part(scope,'cylinder',0xbfb6aa,[0,.7,0],[.08,1.4,.08]);const tube=A.part(scope,'cylinder',0xaaa0bb,[0,1.5,0],[.28,1.4,.28]);tube.rotation.x=-.9;
      const lens=new THREE.Mesh(new THREE.CircleGeometry(.24,24),new THREE.MeshBasicMaterial({color:0x9edcde,side:THREE.DoubleSide,transparent:true,opacity:.8}));lens.rotation.x=-Math.PI/2;tube.add(lens);lens.position.y=.505;
      this.helper=new Meadow.Squirrel(this.root);this.helper.mesh.position.set(2,0,4);
      g.player.setPosition(-1,4.5);
    }
  }
  begin(){
    if(!this.active||this.game.state.mode!=='journey')return;
    this.running=true;document.getElementById('journey-ready').hidden=true;document.activeElement?.blur();this.elapsed=0;
    this.setStatus(this.kind==='bridge'?'看準金色區域，再敲一下。':this.kind==='raft'?'跟著金色浮燈！':'讓光圈跟上星星。');
  }
  setStatus(text){document.getElementById('journey-status').textContent=text;}
  bridgeSettings(){const v=this.game.state.valley;return {center:[.35,.68,.5][v.bridge]??.5,width:[.28,.22,.18][v.bridge]+(v.hammerFails>=3?.15:0)};}
  strike(){
    const g=this.game,v=g.state.valley;if(!this.active||this.kind!=='bridge'||!this.running||g.state.mode!=='journey'||this.cooldown>0)return;
    this.cooldown=.65;const {center,width}=this.bridgeSettings();
    if(Math.abs(this.needle-center)<=width/2){v.bridge++;g.saveProgress();g.refresh();g.audio.chime();this.setStatus(`第 ${v.bridge} 段橋穩穩的！`);if(v.bridge===3){this.finish();return;}}
    else{v.hammerFails++;g.saveProgress();this.setStatus(v.hammerFails>=3?'木木幫忙扶穩了，金色區域變寬囉。':'差一點！等指針走進金色區域再敲。');g.audio.note(220,.1,.02);}
    this.paint();
  }
  paint(){
    const s=this.game.state,progress=this.kind==='bridge'?s.valley.bridge:this.kind==='raft'?s.valley.raft:s.hill.lights.length,total=this.kind==='raft'?4:3;
    document.getElementById('journey-progress').textContent=`${progress} / ${total}`;
    const meter=document.getElementById('journey-meter');meter.max=this.kind==='star'?2.2:total;meter.value=this.kind==='star'?this.focus:progress;
    meter.setAttribute('aria-label',this.kind==='star'?'星光對準進度':'挑戰完成進度');
    if(this.kind==='bridge'){const {center,width}=this.bridgeSettings(),zone=document.getElementById('bridge-zone');zone.style.left=`${(center-width/2)*100}%`;zone.style.width=`${width*100}%`;}
  }
  update(dt){
    const g=this.game;if(!this.active||g.state.mode!=='journey'||!this.running)return;
    this.elapsed+=dt;this.cooldown=Math.max(0,this.cooldown-dt);const v=g.state.valley;
    if(this.kind==='bridge'){
      this.needle=.5+.46*Math.sin(this.elapsed*(1.7+v.bridge*.3));document.getElementById('bridge-needle').style.left=`${this.needle*100}%`;
      document.getElementById('journey-hit').disabled=this.cooldown>0;
      return;
    }
    const movement=this.held||g.input.movement().x;
    if(this.kind==='raft'){
      g.player.mesh.position.y=.3;this.helper.update(g.time,g.player,g.reducedMotion,true);
      this.wakes.forEach((line,i)=>{line.position.z=((this.elapsed*4+i*2)%30)-15;});
      if(this.failTimer>0){this.failTimer-=dt;return;}
      this.raftX=THREE.MathUtils.clamp(this.raftX+movement*4.1*dt+Math.sin(this.elapsed*1.6)*.27*dt,-4.5,4.5);
      this.boat.position.x=this.raftX;g.player.mesh.position.x=this.raftX;
      this.gateCenter=[-2.2,2.1,-1.6,1.6][v.raft];const assist=v.raftFails>=3,gap=assist?1.45:1.12;
      this.buoys.forEach(b=>b.mesh.position.x=this.gateCenter+b.side*gap);
      this.rocks.forEach(r=>r.visible=Math.abs(r.position.x-this.gateCenter)>gap+.3);
      this.roundTime+=dt;this.gate.position.z=-9+Math.max(0,this.roundTime-.8)*([5.2,6,6.8,7.3][v.raft]*(assist?.75:1));
      if(this.gate.position.z>=6.5){
        if(Math.abs(this.raftX-this.gateCenter)>gap-.25){v.raftFails++;this.failTimer=1.1;this.setStatus(v.raftFails>=3?'木木放慢水流，再試這一道就好！':'木木穩住木筏了！往金色浮燈中間划。');g.saveProgress();this.roundTime=0;this.gate.position.z=-9;}
        else {v.raft++;g.saveProgress();g.audio.chime();this.roundTime=0;this.paint();if(v.raft===4){this.finish();return;}this.setStatus(`第 ${v.raft} 道通過！看前方的浮燈。`);}
      }
    }else{
      const index=Meadow.BEACONS.findIndex(b=>b.id===this.beacon),h=g.state.hill,help=h.focusHelp[index];
      this.aim=THREE.MathUtils.clamp(this.aim+movement*.62*dt,-.52,.52);
      this.target=.34*Math.sin(this.elapsed*([.65,.85,1.05][index])/(1+help*.25)+index)+.08*Math.sin(this.elapsed*1.7);
      const aligned=Math.abs(this.aim-this.target)<[.16,.14,.12][index]+help*.04;
      this.focus=THREE.MathUtils.clamp(this.focus+dt*(aligned?1:-.4),0,2.2);
      this.star.position.x=this.target*8;this.ring.position.x=this.aim*8;this.ring.material.color.set(aligned?0xffdc86:0xd7eee7);
      if(!g.reducedMotion)this.star.rotation.z=Math.sin(this.elapsed)*.1;
      this.helper.update(g.time,g.player,g.reducedMotion);this.roundTime+=dt;
      if(this.roundTime>=8&&help<3){h.focusHelp[index]++;this.roundTime=0;g.saveProgress();this.setStatus('星星幫你穩住望遠鏡，更容易對準囉。');}
      this.paint();if(this.focus>=2.2){h.lights.push(this.beacon);g.saveProgress();this.finish();}
    }
  }
  finish(){
    const g=this.game,kind=this.kind,beacon=this.beacon;this.leave();
    if(kind==='raft'){g.player.setPosition(0,-12.3);g.checkpoint(0,-12.3);}
    g.audio.chime();g.story.challengeComplete(kind,beacon);
  }
  leave(){
    if(!this.active)return;const g=this.game;this.reset();g.state.mode='playing';g.player.setPosition(this.returnPoint.x,this.returnPoint.z);g.refresh();document.activeElement?.blur();
  }
  reset(){
    const g=this.game;this.active=false;this.running=false;this.release();g.input.reset();this.ui.hidden=true;document.body.classList.remove('in-journey');g.view.override=null;
    document.getElementById('journey-hit').disabled=false;
    if(this.root){g.scene.remove(this.root);this.root.traverse(o=>{if(o.geometry&&!Object.values(Meadow.Art.geometries).includes(o.geometry))o.geometry.dispose();if(o.material?.isMeshBasicMaterial)o.material.dispose();});this.root=null;}
    if(g.worldCache[g.state.chapter])g.worldCache[g.state.chapter].layer.visible=true;
  }
};
