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
    if(!['bridge','raft','star','escort'].includes(kind))return;
    if(kind==='escort'&&(s.chapter!==4||!h.signal||h.escort===3||h.reunited))return;
    if((kind==='raft'&&!Meadow.Keepsakes.has(s,'ticket'))||(kind==='star'&&!Meadow.Keepsakes.has(s,'lens'))){g.toast(kind==='raft'?'需要花田信封裡的月光船票。':'需要引路燈下的星光鏡片。');return;}
    if(kind==='bridge'&&(s.chapter!==3||!v.metBeaver||v.bridge===3))return;
    if(kind==='raft'&&(s.chapter!==3||v.bridge!==3||v.raft===4))return;
    if(kind==='star'&&(s.chapter!==4||!h.metSquirrel||!Meadow.BEACONS.some(b=>b.id===beacon)||h.lights.includes(beacon)))return;
    this.kind=kind;this.beacon=beacon;this.active=true;this.running=false;this.elapsed=0;this.needle=.5;this.cooldown=0;this.focus=0;this.aim=0;this.roundTime=0;this.failTimer=0;this.braking=false;this.brakeCharge=1.8;this.statusUntil=0;this.release();g.input.reset();
    this.returnPoint=kind==='bridge'?{x:-1.5,z:4.5}:kind==='raft'?{x:0,z:-5.3}:{x:g.player.mesh.position.x,z:g.player.mesh.position.z};
    g.player.mesh.rotation.y=Math.PI;
    g.checkpoint(this.returnPoint.x,this.returnPoint.z);s.mode='journey';
    document.body.classList.add('in-journey');this.ui.hidden=false;
    document.getElementById('journey-ready').hidden=false;
    document.getElementById('journey-steer').hidden=kind==='bridge';
    document.getElementById('journey-hit').hidden=kind==='escort';
    document.getElementById('journey-hit').classList.toggle('multi-action',kind!=='bridge');
    document.getElementById('journey-hit').innerHTML='<span>'+(kind==='raft'?'煞船':kind==='star'?'拍攝':'敲一下')+'</span><small>空白鍵 / E</small>';
    document.getElementById('bridge-timing').hidden=kind!=='bridge';
    document.getElementById('journey-title').textContent={bridge:'一起修好月光橋',raft:'木木掌舵，你來引路',star:'追上星光'}[kind];
    document.getElementById('journey-instruction').textContent={bridge:'先心算，再在正確數字區按空白鍵敲擊。每段三枚鉚釘，共九枚。',raft:'十二道移動水門！← → 掌舵，空白鍵切換煞船；煞船最多 1.8 秒，放開後回充。',star:'← → 對準星星充能；星星變金色時按空白鍵拍下。每盞燈需三次成功曝光。'}[kind];
    if(kind==='escort'){
      document.getElementById('journey-title').textContent='媽媽，這次換我保護妳';
      document.getElementById('journey-instruction').textContent='灰爪追來了！按住 ← →，帶媽媽躲進金燈中間，避開灰爪推來的樹枝。';
    }
    for(const side of ['left','right'])document.getElementById(`journey-${side}`).setAttribute('aria-label',`${side==='left'?'向左':'向右'}${kind==='raft'?'划船':'移動光圈'}`);
    if(kind==='escort')for(const side of ['left','right'])document.getElementById(`journey-${side}`).setAttribute('aria-label',`${side==='left'?'向左':'向右'}護送媽媽`);
    if(kind==='bridge'){g.player.setPosition(-1.5,4.5);g.view.override=new THREE.Vector3(0,0,1);}
    else {this.buildArena();g.worldCache[s.chapter].layer.visible=false;g.view.override=new THREE.Vector3(0,0,kind==='raft'?1:-1);}
    this.setStatus('準備好了再開始。');this.paint();document.getElementById('journey-start').focus({preventScroll:true});
  }
  buildArena(){
    const g=this.game,A=Meadow.Art;this.root=new THREE.Group();g.scene.add(this.root);
    if(this.kind==='escort'){this.buildEscort();return;}
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
    if(this.kind==='escort')this.setStatus('我在前面帶路，媽媽跟緊我！');
    if(this.kind==='bridge')this.setStatus(this.bridgeSettings().question+' = ? 找對數字再敲！');
  }
  setStatus(text,hold=1.4){
    if(hold===0&&this.elapsed<this.statusUntil)return;
    document.getElementById('journey-status').textContent=text;
    if(hold>0)this.statusUntil=this.elapsed+hold;
  }
  bridgeSettings(){
    const v=this.game.state.valley,rows=[['3×4−5',7,[7,9,12]],['18÷3+2',8,[6,10,8]],['2、5、8、下一個？',11,[9,11,13]],['(7+5)÷2',6,[6,8,10]],['24÷4+3',9,[7,11,9]],['1、2、4、8、下一個？',16,[12,16,18]],['5×3−8',7,[9,7,8]],['30−4×6',6,[6,24,10]],['2、6、12、20、下一個？',30,[28,32,30]]];
    const [question,answer,options]=rows[v.bridge*3+v.nails]||rows[8];return {question,options,center:[.22,.5,.78][options.indexOf(answer)],width:[.14,.12,.10][v.bridge]+(v.hammerFails>=6?.05:0)};
  }
  strike(){
    const g=this.game,v=g.state.valley;if(!this.active||!this.running||g.state.mode!=='journey'||this.cooldown>0)return;
    if(this.kind==='raft'){this.braking=!this.braking&&this.brakeCharge>.15;return;}
    if(this.kind==='star'){
      this.cooldown=.35;const i=Meadow.BEACONS.findIndex(b=>b.id===this.beacon),h=g.state.hill;
      if(this.focus>=2.8&&this.aligned&&this.exposure){h.starLocks[i]++;this.focus=0;this.roundTime=0;g.saveProgress();g.audio.chime();if(h.starLocks[i]===3){h.lights.push(this.beacon);g.saveProgress();this.finish();return;}this.setStatus('拍到了！換下一顆星。');}
      else {this.focus=Math.max(0,this.focus-1.2);this.setStatus('先充滿，再等星星變金色！');}this.paint();return;
    }
    if(this.kind!=='bridge')return;
    this.cooldown=.35;const {center,width}=this.bridgeSettings();
    if(Math.abs(this.needle-center)<=width/2){v.nails++;if(v.nails===3){v.bridge++;v.nails=0;}g.saveProgress();g.refresh();g.audio.chime();if(v.bridge===3){this.finish();return;}this.setStatus('固定好了！ '+this.bridgeSettings().question+' = ?');}
    else{v.hammerFails++;g.saveProgress();this.setStatus('重算並瞄準：'+this.bridgeSettings().question+' = ?');g.audio.note(220,.1,.02);}this.paint();
  }
  paint(){
    const s=this.game.state,progress=this.kind==='bridge'?s.valley.bridge*3+s.valley.nails:this.kind==='raft'?s.valley.raft*3+s.valley.raftGate:this.kind==='escort'?s.hill.escort*3+s.hill.escortWave:s.hill.starLocks[Meadow.BEACONS.findIndex(b=>b.id===this.beacon)],total=this.kind==='raft'?12:this.kind==='star'?3:9;
    document.getElementById('journey-progress').textContent=`${progress} / ${total}`;
    const meter=document.getElementById('journey-meter');meter.max=this.kind==='star'?2.8:total;meter.value=this.kind==='star'?this.focus:progress;
    meter.setAttribute('aria-label',this.kind==='star'?'星光對準進度':'挑戰完成進度');
    if(this.kind==='bridge'){const {options,width}=this.bridgeSettings(),zone=document.getElementById('bridge-zone');zone.innerHTML=options.map((n,i)=>`<span class="bridge-answer" style="left:${([.22,.5,.78][i]-width/2)*100}%;width:${width*100}%">${n}</span>`).join('');}
  }
  update(dt){
    const g=this.game;if(!this.active||g.state.mode!=='journey'||!this.running)return;
    this.elapsed+=dt;this.cooldown=Math.max(0,this.cooldown-dt);const v=g.state.valley;
    if(this.kind==='bridge'){
      this.needle=.5+.46*Math.sin(this.elapsed*(2.6+v.bridge*.4+v.nails*.12));document.getElementById('bridge-needle').style.left=`${this.needle*100}%`;
      document.getElementById('journey-hit').disabled=this.cooldown>0;
      return;
    }
    const movement=this.held||g.input.movement().x;
    if(this.kind==='escort'){this.updateEscort(dt,movement);return;}
    if(this.kind==='raft'){
      g.player.mesh.position.y=.3;this.helper.update(g.time,g.player,g.reducedMotion,true);
      this.wakes.forEach((line,i)=>{line.position.z=((this.elapsed*4+i*2)%30)-15;});
      if(this.failTimer>0){this.failTimer-=dt;return;}
      this.raftX=THREE.MathUtils.clamp(this.raftX+movement*5.8*dt+Math.sin(this.elapsed*2.1)*.7*dt,-4.5,4.5);
      this.boat.position.x=this.raftX;g.player.mesh.position.x=this.raftX;
      const gateIndex=v.raft*3+v.raftGate;this.gateCenter=[-2.5,1.8,-.7,2.4,-2.1,1.2,-2.4,.4,2.2,1.7,-2.3,.3][gateIndex]+Math.sin(this.elapsed*1.6)*.45;const assist=v.raftFails>=6,gap=assist?1.25:.95;
      this.brakeCharge=THREE.MathUtils.clamp(this.brakeCharge+dt*(this.braking?-1:.45),0,1.8);if(this.brakeCharge===0)this.braking=false;
      const brake=document.getElementById('journey-hit');brake.querySelector('span').textContent=this.braking?'放開':'煞船';brake.querySelector('small').textContent=this.brakeCharge.toFixed(1)+' 秒 · E';this.setStatus(this.braking?'煞船中，趁機修正方向！':'預判移動入口，連續掌舵！',0);
      this.buoys.forEach(b=>b.mesh.position.x=this.gateCenter+b.side*gap);
      this.rocks.forEach(r=>r.visible=Math.abs(r.position.x-this.gateCenter)>gap+.3);
      this.roundTime+=dt*(this.braking?.45:1);this.gate.position.z=-9+Math.max(0,this.roundTime-.45)*([7.8,8.5,9.2,10][v.raft]*(assist?.8:1));
      if(this.gate.position.z>=6.5){
        if(Math.abs(this.raftX-this.gateCenter)>gap-.25){v.raftFails++;this.failTimer=1.1;this.setStatus(v.raftFails>=6?'木木放慢水流，再試這一道就好！':'木木穩住木筏了！往金色浮燈中間划。');g.saveProgress();this.roundTime=0;this.gate.position.z=-9;}
        else {v.raftGate++;if(v.raftGate===3){v.raft++;v.raftGate=0;}g.saveProgress();g.audio.chime();this.roundTime=0;this.gate.position.z=-9;this.paint();if(v.raft===4){this.finish();return;}this.setStatus(`第 ${v.raft*3+v.raftGate} 道通過！看前方的浮燈。`);}
      }
    }else{
      const index=Meadow.BEACONS.findIndex(b=>b.id===this.beacon),h=g.state.hill,help=h.focusHelp[index];
      this.aim=THREE.MathUtils.clamp(this.aim+movement*.95*dt,-.52,.52);
      this.target=.34*Math.sin(this.elapsed*([1.05,1.25,1.45][index])/(1+help*.25)+index)+.08*Math.sin(this.elapsed*1.7);
      const aligned=Math.abs(this.aim-this.target)<[.095,.08,.065][index]+help*.02;
      this.focus=THREE.MathUtils.clamp(this.focus+dt*(aligned?1:-.8),0,2.8);
      this.aligned=aligned;this.exposure=this.elapsed%3>1.6;this.star.traverse(o=>{if(o.isMesh)o.material=Meadow.Art.material(this.exposure?0xffde8f:0x929bbd);});
      this.setStatus(this.focus>=2.8?(this.exposure?'金色曝光窗！對準後按 E 拍下':'能量已滿，等金色曝光窗。'):'追蹤星光充能，再等金色曝光窗。',0);
      this.star.position.x=this.target*8;this.ring.position.x=this.aim*8;this.ring.material.color.set(aligned?0xffdc86:0xd7eee7);
      if(!g.reducedMotion)this.star.rotation.z=Math.sin(this.elapsed)*.1;
      this.helper.update(g.time,g.player,g.reducedMotion);this.roundTime+=dt;
      if(this.roundTime>=30&&help<3){h.focusHelp[index]++;this.roundTime=0;g.saveProgress();this.setStatus('星星幫你穩住望遠鏡，更容易對準囉。');}
      this.paint();
    }
  }
  finish(){
    const g=this.game,kind=this.kind,beacon=this.beacon;this.leave();
    if(kind==='raft'){g.player.setPosition(0,-12.3);g.checkpoint(0,-12.3);}
    g.audio.chime();g.story.challengeComplete(kind,beacon);
  }
  buildEscort(){
    const g=this.game,A=Meadow.Art;
    A.part(this.root,'box',0x777795,[0,-.3,0],[18,.5,35]);
    A.part(this.root,'box',0xb7ac9b,[0,-.02,0],[11,.06,32]);
    for(const side of [-1,1])for(let z=-13;z<14;z+=4){
      const tree=A.group(this.root,side*6.5,z);A.part(tree,'cylinder',0x7d716e,[0,1,0],[.16,2,.16]);A.part(tree,'cone',0x737e9e,[0,2.3,0],[1.1,2.3,1.1]);
    }
    this.escortMother=new Meadow.Mother(this.root);this.escortMother.mesh.rotation.y=Math.PI;
    this.helper=new Meadow.Squirrel(this.root);this.helper.mesh.position.set(4.5,0,-5);
    this.lantern=A.group(this.root);A.part(this.lantern,'cylinder',0x94794d,[0,.8,0],[.04,1.3,.04]);A.part(this.lantern,'ball',0xffe19e,[0,1.5,0],[.21,.3,.21]);
    this.gate=A.group(this.root,0,-11);
    this.pursuer=new Meadow.Grayclaw(this.gate);this.pursuer.mesh.visible=true;this.pursuer.mesh.position.set(2.8,0,1.2);
    this.warningBands=[-1,1].map(()=>{const mat=new THREE.MeshBasicMaterial({color:0xcc875b,transparent:true,opacity:.22,depthWrite:false});const mesh=new THREE.Mesh(A.geometries.box,mat);this.root.add(mesh);mesh.position.y=.03;return mesh;});
    this.guardGlow=new THREE.Mesh(new THREE.TorusGeometry(.85,.065,8,32),new THREE.MeshBasicMaterial({color:0xffe5a2}));this.root.add(this.guardGlow);this.guardGlow.visible=false;
    this.buoys=[-1,1].map(side=>{const mesh=A.group(this.gate);A.part(mesh,'cylinder',0xb89d69,[0,.4,0],[.09,.8,.09]);A.part(mesh,'ball',0xffe19e,[0,.95,0],[.22,.3,.22]);return {mesh,side};});
    this.branches=Array.from({length:15},(_,i)=>{const b=A.group(this.gate,(i-7)*.7,0);const stick=A.part(b,'cylinder',0x857264,[0,.35,0],[.1,1.25,.1]);stick.rotation.z=1.2;A.part(b,'ball',0x9caa88,[.4,.45,0],[.3,.09,.22]);return b;});
    this.safePatch=A.part(this.gate,'box',0xe1c67f,[0,.035,0],[2.5,.04,1.5],false);
    this.windLines=Array.from({length:18},(_,i)=>A.part(this.root,'box',0xc3cbd3,[(i%6)*2-5,.4+(i%3)*.4,-10+i],[.025,.025,.9],false));
    this.escortX=0;g.player.setPosition(0,4);this.escortMother.mesh.position.set(.5,0,5.7);
    g.view.override=new THREE.Vector3(0,0,0);
    this.layoutEscort();
  }
  layoutEscort(){
    const h=this.game.state.hill,index=h.escort*3+h.escortWave,base=[-2.5,1.8,-.8,2.4,-2.2,.3,-1.9,2.1,-.5][index];
    this.feint=index>=3&&this.roundTime<.55;this.gateCenter=(this.feint?-base:base)+(index>=3?Math.sin(this.elapsed*1.5)*.3:0);this.gap=h.escortFails>=6?1.4:1.05;
    this.buoys.forEach(b=>b.mesh.position.x=this.gateCenter+b.side*this.gap);
    this.branches.forEach(b=>b.visible=Math.abs(b.position.x-this.gateCenter)>this.gap+.2);
    this.safePatch.position.x=this.gateCenter;this.safePatch.scale.x=this.gap*2;
    const left=this.gateCenter-this.gap,right=this.gateCenter+this.gap;
    this.warningBands[0].position.set((-5.5+left)/2,.03,0);this.warningBands[0].scale.set(left+5.5,.02,26);
    this.warningBands[1].position.set((right+5.5)/2,.03,0);this.warningBands[1].scale.set(5.5-right,.02,26);
    this.pursuer.mesh.position.x=this.gateCenter<0?2.8:-2.8;
  }
  updateEscort(dt,movement){
    const g=this.game,h=g.state.hill;this.layoutEscort();
    this.escortMother.update(g.time,false,this.failTimer<=0,g.reducedMotion);this.helper.update(g.time,g.player,g.reducedMotion);
    this.pursuer.update(g.time,g.reducedMotion,'reach');
    if(!g.reducedMotion)this.windLines.forEach((line,i)=>line.position.z=((this.elapsed*6+i*2)%28)-14);
    if(this.failTimer>0){this.failTimer=Math.max(0,this.failTimer-dt);g.player.arms.forEach(a=>a.rotation.x=-1.25);return;}
    this.guardGlow.visible=false;
    this.escortX=THREE.MathUtils.clamp(this.escortX+movement*4*dt,-4.3,4.3);
    g.player.setPosition(this.escortX,4);this.escortMother.mesh.position.set(this.escortX+.5,0,5.7);this.lantern.position.set(this.escortX-.5,0,3.8);
    if(!g.reducedMotion)g.player.legs.forEach((leg,i)=>leg.rotation.x=Math.sin(this.elapsed*8+i*Math.PI)*.35);
    g.player.arms[0].rotation.x=-.9;
    this.roundTime+=dt;const warning=h.escortFails>=6?1.25:.8,speed=[6.2,7,7.8][h.escort]*(h.escortFails>=6?.8:1);
    this.gate.position.z=-11+Math.max(0,this.roundTime-warning)*speed;
    this.setStatus(this.feint?'佯攻！先等金燈穩定再選路。':this.roundTime<warning?'看穩金燈，灰爪要衝了！':'護住媽媽，跟緊移動的安全路！');
    // His charge and pushed branches must miss both daughter and mother.
    if(this.gate.position.z>=3.4&&this.gate.position.z<=6.4&&Math.max(Math.abs(this.escortX-this.gateCenter),Math.abs(this.escortX+.5-this.gateCenter))>this.gap-.25){
      h.escortFails=Math.min(99,h.escortFails+1);this.failTimer=1.1;this.roundTime=0;this.gate.position.z=-11;g.saveProgress();this.layoutEscort();
      this.guardGlow.visible=true;this.guardGlow.position.set(this.escortX,1.2,3.65);g.player.arms.forEach(a=>a.rotation.x=-1.25);
      this.setStatus(h.escortFails>=6?'星星用燈光牽制灰爪，安全路變寬了！':'小米舉燈護住媽媽，拉她退回安全點！');return;
    }
    if(this.gate.position.z>7){h.escortWave++;if(h.escortWave===3){h.escort++;h.escortWave=0;}g.saveProgress();g.audio.chime();this.paint();if(h.escort===3){this.finish();return;}this.roundTime=0;this.gate.position.z=-11;this.failTimer=.65;this.layoutEscort();this.setStatus('媽媽安全了！下一段繼續牽緊。');}
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
