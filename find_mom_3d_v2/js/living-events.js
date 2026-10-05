'use strict';
Meadow.EventLines=[
  {name:'嗡嗡',text:'嗡嗡！我來了！快揮手或離開這裡。',chapters:[1,2,3,4]},
  {name:'小皮',text:'好香的水果！抓到我，我就還給你！',chapters:[1,2,3,4]},
  {name:'小皮',text:'你抓到我了！水果還你，我們一起玩吧。',chapters:[1,2,3,4]},
  {name:'小米',text:'我揮揮手，蚊子飛走了！',chapters:[1,2,3,4]}
];
// Real-time encounters own their clocks and pooled meshes. They never mutate
// flowers, parcels, quest inventory or a chapter milestone.
Meadow.LivingEvents=class {
  constructor(game){
    this.game=game;this.enabled=true;this.event=null;this.cooldown=24;this.bank=0;this.resolved=0;this.hopTime=0;
    this.statsKey='little-lights-v2-orchard';this.collected=[[],[],[],[]];
    try{const s=JSON.parse(localStorage.getItem(this.statsKey));if(s){this.bank=Number.isInteger(s.bank)?Math.max(0,Math.min(999,s.bank)):0;this.resolved=Number.isInteger(s.resolved)?Math.max(0,Math.min(999,s.resolved)):0;this.collected=this.collected.map((a,i)=>[0,1,2,3,4,5].filter(n=>s.collected?.[i]?.includes(n)));}}catch(_){}
    const A=Meadow.Art;this.root=A.group(game.scene);this.root.visible=false;
    this.monkey=A.group(this.root);this.monkey.visible=false;
    A.part(this.monkey,'ball',0x93623e,[0,.95,0],[.38,.5,.3]);
    A.part(this.monkey,'ball',0xf0cb95,[0,.94,.23],[.22,.32,.13]);
    A.part(this.monkey,'ball',0x93623e,[0,1.65,0],[.44,.4,.35]);
    A.part(this.monkey,'ball',0xf0cb95,[0,1.58,.21],[.33,.26,.22]);
    for(const side of [-1,1]){
      A.part(this.monkey,'ball',0x93623e,[side*.43,1.68,0],[.18,.2,.09]);
      A.part(this.monkey,'ball',0xf0cb95,[side*.44,1.68,.05],[.11,.13,.04]);
      A.part(this.monkey,'ball',0x2a332e,[side*.12,1.73,.41],[.045,.05,.025]);
      const arm=A.part(this.monkey,'cylinder',0x93623e,[side*.42,.98,0],[.09,.7,.09]);arm.rotation.z=side*.35;
      A.part(this.monkey,'ball',0x93623e,[side*.19,.4,0],[.14,.4,.14]);
    }
    const tail=new THREE.Mesh(new THREE.TorusGeometry(.38,.065,8,16,Math.PI*1.5),A.material(0x93623e));tail.position.set(0,.75,-.4);tail.rotation.y=Math.PI/2;this.monkey.add(tail);
    this.monkeyFruit=A.part(this.monkey,'ball',0xf5b64f,[.45,.85,.25],[.18,.2,.18]);
    this.bugs=Array.from({length:5},(_,i)=>{
      const bug=A.group(this.root);bug.visible=false;
      A.part(bug,'ball',0x374744,[0,0,0],[.10,.12,.22]);
      A.part(bug,'cone',0xb29969,[0,0,.26],[.025,.25,.025]).rotation.x=Math.PI/2;
      bug.wings=[-1,1].map(side=>{
        const wing=A.part(bug,'ball',0xd7e8ef,[side*.19,.05,-.02],[.23,.025,.13],false);
        wing.material=new THREE.MeshStandardMaterial({color:0xd7e8ef,transparent:true,opacity:.65,roughness:.35,depthWrite:false});return wing;
      });return bug;
    });
    this.ring=new THREE.Mesh(new THREE.RingGeometry(1.25,1.4,48),new THREE.MeshBasicMaterial({color:0xe9aa48,transparent:true,opacity:.7,side:THREE.DoubleSide,depthWrite:false}));
    this.ring.rotation.x=-Math.PI/2;this.ring.position.y=.13;this.ring.visible=false;this.root.add(this.ring);
    this.fruits=Array.from({length:6},(_,i)=>{
      const mesh=A.group(this.root);A.part(mesh,'ball',i%2?0xf3b448:0xd77950,[0,.45,0],[.24,.26,.24]);
      A.part(mesh,'cylinder',0x735b3c,[0,.75,0],[.035,.14,.035]);A.part(mesh,'ball',0x69955d,[.10,.73,0],[.15,.04,.08]);return {mesh,index:i};
    });
    this.lostFruit=A.group(this.root);A.part(this.lostFruit,'ball',0xf2b54e,[0,.4,0],[.28,.3,.28]);this.lostFruit.visible=false;
    this.panel=document.getElementById('event-hud');this.text=document.getElementById('event-message');this.meter=document.getElementById('event-meter');
    this.reset();
  }
  save(){try{localStorage.setItem(this.statsKey,JSON.stringify({bank:this.bank+(this.event?.stolen?1:0),resolved:this.resolved,collected:this.collected}));}catch(_){}this.hud();}
  hud(){document.getElementById('fruit-count').textContent='水果 '+this.bank;document.getElementById('event-count').textContent='機智應對 '+this.resolved;}
  safeNear(x,z,r=3){
    const w=this.game.world;
    for(let ring=0;ring<8;ring++)for(let n=0;n<16;n++){
      const px=x+Math.sin(n*Math.PI/8)*(r+ring*.45),pz=z+Math.cos(n*Math.PI/8)*(r+ring*.45);
      if(w.canWalk(px,pz)&&w.canWalk(px+.5,pz)&&w.canWalk(px-.5,pz)&&w.canWalk(px,pz+.5)&&w.canWalk(px,pz-.5)&&!(w.portals||[]).some(v=>Math.hypot(px-v.x,pz-v.z)<4))return {x:px,z:pz};
    }
    return {x,z};
  }
  reset(){
    // A stolen fruit is returned if the player changes map/restarts or disables
    // events. Saving while it is held elsewhere also records the refundable one.
    if(this.event?.stolen){this.bank=Math.min(999,this.bank+1);this.event.stolen=false;this.save();}
    this.event=null;this.cooldown=24;this.eventClock=0;this.hopTime=0;this.fatigue=0;if(!this.game.player.riding)this.game.player.speedMultiplier=1;
    this.panel.hidden=true;this.root.visible=false;this.monkey.visible=this.lostFruit.visible=this.ring.visible=false;this.bugs.forEach(b=>b.visible=false);
    const c=this.game.state.chapter;
    this.fruits.forEach((fruit,i)=>{
      const spot=this.safeNear((i%3-1)*5,12+Math.floor(i/3)*6,0);
      fruit.mesh.position.set(spot.x,0,spot.z);fruit.mesh.visible=!this.collected[c-1].includes(i);fruit.home={...spot};
    });this.hud();
  }
  start(kind){
    const g=this.game;if(!this.enabled||this.event||g.state.mode!=='playing'||g.streetRun.active||g.sandbox.riding||g.sandbox.seated)return false;
    const p=g.player.mesh.position,spot=this.safeNear(p.x,p.z,4);
    // Never jump an impassable river between the player and a spawned monkey.
    const reachable=Array.from({length:16},(_,i)=>g.world.canWalk(p.x+(spot.x-p.x)*(i+1)/16,p.z+(spot.z-p.z)*(i+1)/16)).every(Boolean);
    if(!reachable){this.cooldown=8;return false;}
    this.event={kind,phase:'warning',elapsed:0,stolen:false,origin:{x:p.x,z:p.z},position:{...spot},hits:0};
    this.monkey.visible=kind==='monkey';this.monkey.position.set(spot.x,0,spot.z);
    this.bugs.forEach(b=>b.visible=kind==='mosquito');this.ring.visible=true;this.ring.position.set(p.x,.13,p.z);
    const cue=Meadow.EventLines[kind==='mosquito'?0:1];g.voices.playLine(cue.name,cue.text);this.message(kind==='mosquito'?'蚊子靠近！移動避開，或空白鍵揮手。':this.bank?'小皮盯上水果！靠近按空白鍵，讓牠打消念頭。':'小皮來玩追逐！靠近按空白鍵打招呼。');
    return true;
  }
  message(text){this.text.textContent=this.game.identity?.text(text)||text;}
  settle(text){
    this.resolved=Math.min(999,this.resolved+1);this.game.audio.chime();this.game.toast(text,2400);
    this.event=null;this.cooldown=28+Math.random()*20;this.monkey.visible=this.lostFruit.visible=this.ring.visible=false;this.bugs.forEach(b=>b.visible=false);this.panel.hidden=true;this.save();
  }
  hop(){if(this.hopTime<=0)this.hopTime=.5;}
  target(){const e=this.event;if(!e?.stolen)return null;return {position:e.phase==='dropped'?this.lostFruit.position:this.monkey.position,text:'🍊 拿回水果'};}
  respond(){
    const e=this.event,g=this.game;if(!e||g.state.mode!=='playing')return false;
    const p=g.player.mesh.position;
    if(e.kind==='mosquito'){
      this.hop();e.hits++;g.audio.note(880,.12,.04);
      if(e.hits>=2){g.voices.playLine('小米',Meadow.EventLines[3].text);this.settle('揮手成功！蚊子飛走了。');}
      else this.message('再揮一次！空白鍵趕走蚊子。');return true;
    }
    const pos=e.phase==='dropped'?this.lostFruit.position:this.monkey.position;
    if(Math.hypot(pos.x-p.x,pos.z-p.z)>2.6)return false;
    if(e.stolen){this.bank++;e.stolen=false;g.voices.playLine('小皮',Meadow.EventLines[2].text);this.settle('水果拿回來了！');}
    else this.settle('和小皮成為朋友，牠送你一顆水果！'),this.bank++,this.save();
    return true;
  }
  update(dt){
    const g=this.game,playing=g.state.mode==='playing';this.root.visible=playing;
    this.panel.hidden=!playing||!this.event;
    if(!playing)return;
    this.eventClock+=dt;this.hopTime=Math.max(0,this.hopTime-dt);
    if(this.fatigue>0){this.fatigue=Math.max(0,this.fatigue-dt);if(!g.player.riding)g.player.speedMultiplier=this.fatigue>0?.6:1;}
    if(this.hopTime>0&&!g.reducedMotion)g.player.body.position.y+=Math.sin(this.hopTime/.5*Math.PI)*.45;
    const p=g.player.mesh.position,c=g.state.chapter;
    for(const fruit of this.fruits)if(fruit.mesh.visible){
      fruit.mesh.rotation.y=g.reducedMotion?0:this.eventClock*.7;fruit.mesh.position.y=g.reducedMotion?0:Math.sin(this.eventClock*2+fruit.index)*.08;
      if(Math.hypot(fruit.mesh.position.x-p.x,fruit.mesh.position.z-p.z)<.85){fruit.mesh.visible=false;this.collected[c-1].push(fruit.index);this.bank=Math.min(999,this.bank+1);this.save();g.audio.note(783,.2,.04);g.toast('收集水果！小皮偶爾也想來分一口。',1800);}
    }
    if(!this.event){
      if(this.enabled&&!g.streetRun.active&&!g.sandbox.riding&&!g.sandbox.seated){this.cooldown-=dt;if(this.cooldown<=0)this.start(Math.random()<.5?'mosquito':'monkey');}return;
    }
    const e=this.event;e.elapsed+=dt;this.meter.max=e.kind==='mosquito'?10:28;this.meter.value=Math.min(this.meter.max,e.elapsed);
    if(e.kind==='mosquito'){
      const center=e.phase==='warning'?e.origin:p;
      this.bugs.forEach((bug,i)=>{const a=this.eventClock*3+i*Math.PI*2/5,r=e.phase==='warning'?2.3:1.05;bug.position.set(center.x+Math.cos(a)*r,1.7+Math.sin(a*1.7)*.2,center.z+Math.sin(a)*r);bug.rotation.y=-a;bug.wings.forEach((w,n)=>w.rotation.z=g.reducedMotion?0:Math.sin(this.eventClock*38)*(n?1:-1)*.55);});
      if(e.elapsed>=2)e.phase='chase';
      if(Math.hypot(p.x-e.origin.x,p.z-e.origin.z)>5){this.settle('你靈巧地避開了蚊子！');return;}
      if(e.elapsed>=10){this.fatigue=1.6;g.toast('蚊子叮了一下，稍微放慢腳步，很快就恢復。',2200);this.event=null;this.cooldown=35;this.bugs.forEach(b=>b.visible=false);this.ring.visible=false;this.panel.hidden=true;return;}
    }else{
      const m=this.monkey.position;
      if(e.phase==='warning'&&e.elapsed>=2){e.phase='approach';this.message('小皮靠近了！空白鍵和牠打招呼。');}
      if(e.phase==='approach'){
        const d=Math.hypot(p.x-m.x,p.z-m.z);
        if(d>.3)Meadow.Motion.move(g.world,m,(p.x-m.x)/d*3.2*dt,(p.z-m.z)/d*3.2*dt);
        if(d<1.2&&this.bank>0){e.stolen=true;e.phase='flee';this.bank--;this.save();this.message('小皮拿走一顆水果！追上牠按空白鍵拿回來。');}
      }else if(e.phase==='flee'){
        const d=Math.hypot(m.x-p.x,m.z-p.z)||1;
        Meadow.Motion.move(g.world,m,(m.x-p.x)/d*4*dt,(m.z-p.z)/d*4*dt);
      }
      if(e.phase!=='dropped'&&e.elapsed>=13){
        if(e.stolen){e.phase='dropped';this.lostFruit.position.set(e.origin.x,0,e.origin.z);this.lostFruit.visible=true;this.monkey.visible=false;this.message('小皮放下水果了。回到金圈，空白鍵撿回。');}
        else {this.event=null;this.cooldown=30;this.monkey.visible=this.ring.visible=false;return;}
      }
      if(e.phase==='dropped'&&e.elapsed>=28){this.bank++;e.stolen=false;this.settle('朋友把水果送回你的籃子了。');return;}
      m.y=g.reducedMotion?0:Math.abs(Math.sin(this.eventClock*8))*.12;this.monkey.rotation.y=Math.atan2(p.x-m.x,p.z-m.z);
    }
    this.ring.material.opacity=g.reducedMotion?.6:.45+Math.sin(this.eventClock*6)*.2;
    if(this.event){
      const touch=document.getElementById('touch-action');touch.disabled=false;touch.querySelector('span').textContent=e.kind==='mosquito'?'揮手':'互動';
    }
  }
};
