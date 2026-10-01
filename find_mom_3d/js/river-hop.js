'use strict';
// Keep the existing nine-stone save milestones, but use a fixed-camera drifting river.
Meadow.RiverHop = class {
  constructor(trials){
    this.trials=trials;this.game=trials.game;const A=Meadow.Art;
    this.root=A.group(trials.root);this.root.visible=false;this.jump=null;
    A.part(this.root,'box',0x83a9b1,[0,-1,0],[300,.1,300],false);
    A.part(this.root,'box',0x548f9f,[0,-.17,-12],[9,.35,90],false);
    for(const side of [-1,1]){
      A.part(this.root,'box',0x92aa8e,[side*6,-.1,-12],[3,.3,90]);
      for(let i=0;i<22;i++)A.part(this.root,'pebble',0x9daa94,[side*4.65,.1,24-i*3.8],[.6,.45,.8]);
      for(let i=0;i<12;i++){const tree=A.group(this.root,side*6.3,24-i*7);A.part(tree,'cylinder',0x7e8266,[0,1,0],[.16,2,.16]);A.part(tree,'cone',0x769780,[0,2.3,0],[1.1,2.4,1.1]);}
    }
    this.stones=[];this.spacing=4.5;
    for(let row=0;row<=9;row++)for(let lane=0;lane<3;lane++){
      const mesh=A.group(this.root,(lane-1)*2,6-row*this.spacing);
      A.part(mesh,'cylinder',0xb9b39b,[0,.12,0],[.9,.48,.84]);
      const mushroom=A.group(mesh);mushroom.visible=false;
      A.part(mushroom,'cylinder',0xd8d3ad,[0,.65,0],[.12,.55,.12]);
      A.part(mushroom,'ball',0x9255ad,[0,.98,0],[.5,.23,.43]);
      for(let i=0;i<5;i++)A.part(mushroom,'ball',0xc4ef80,[Math.cos(i*1.26)*.28,1.16,Math.sin(i*1.26)*.23],[.07,.035,.07]);
      const bomb=A.group(mesh);bomb.visible=false;
      A.part(bomb,'ball',0x39404b,[0,.74,0],[.4,.4,.4]);
      A.part(bomb,'cylinder',0x9f8a65,[.05,1.15,0],[.045,.24,.045]);
      const spark=A.part(bomb,'ball',0xffbf55,[.05,1.29,0],[.12,.12,.12]);
      this.stones.push({row,lane,mesh,mushroom,bomb,spark,hazard:null});
    }
    this.ring=new THREE.Mesh(new THREE.RingGeometry(.93,1.05,40),new THREE.MeshBasicMaterial({color:0xffe6a2,side:THREE.DoubleSide}));this.ring.rotation.x=-Math.PI/2;this.root.add(this.ring);
    this.foam=Array.from({length:36},(_,i)=>A.part(this.root,'box',0xc1e1de,[(i%7-3)*1.1,.025,0],[.36,.018,.75],false));
    this.splash=A.group(this.root);this.splash.visible=false;for(let i=0;i<8;i++)A.part(this.splash,'ball',0xd8eeeb,[Math.cos(i*Math.PI/4)*.6,.2,Math.sin(i*Math.PI/4)*.6],[.15,.22,.15],false);
    const before=this.root.children.length;this.owl=new Meadow.Owl(this.root);this.root.children.slice(before).filter(o=>o!==this.owl.mesh).forEach(o=>o.visible=false);this.owl.mesh.scale.setScalar(.6);
  }
  stone(row,lane){return this.stones.find(s=>s.row===row&&s.lane===lane);}
  safeLane(stage){return this.stones.find(s=>s.row===stage+1&&!s.hazard).lane;}
  speed(){return (3.15+this.trials.stage*.15)*(this.game.state.forest.dashFails>=6?.82:1);}
  jumpDuration(){return .62-this.trials.stage*.015;}
  project(position){return position.clone().add(new THREE.Vector3(0,1,0)).project(this.game.camera);}
  outside(position){const p=this.project(position);return p.y< -1||p.y>1||p.x< -1||p.x>1;}
  ready(){
    const target=this.stone(this.trials.stage+1,this.trials.lane),p=target.mesh.position.clone();
    p.z+=this.speed()*this.jumpDuration();const screen=this.project(p);
    return screen.y>-.9&&screen.y<.84;
  }
  setHazard(stone,hazard){stone.hazard=hazard;stone.mushroom.visible=hazard==='mushroom';stone.bomb.visible=hazard==='bomb';}
  start(){
    const t=this.trials,g=this.game;this.startStage=t.stage;this.jump=null;this.elapsed=0;this.flow=0;this.splash.visible=false;t.dashRunning=false;
    this.currentLane=1;t.lane=1;
    // Generate ahead of the player, never while a stone is being approached.
    for(const s of this.stones)this.setHazard(s,null);
    for(let row=t.stage+1;row<=9;row++){
      const count=[0,0,1,1,0,2,1,2,1,2][row],lanes=[0,1,2];
      for(let i=0;i<count;i++){const lane=lanes.splice(Math.floor(Math.random()*lanes.length),1)[0];this.setHazard(this.stone(row,lane),(row+i)%2?'bomb':'mushroom');}
    }
    this.moveStones();g.view.override.set(0,0,1);g.view.focus.copy(g.view.override);g.view.update(0,false,true);g.camera.updateMatrixWorld();this.place();this.paintTimer();
    for(const id of ['action-left','action-right','action-run'])document.getElementById(id).disabled=false;
  }
  moveStones(){for(const s of this.stones){s.mesh.position.z=6-(s.row-this.startStage)*this.spacing+this.flow;}}
  place(){const p=this.stone(this.trials.stage,this.currentLane).mesh.position;this.game.player.setPosition(p.x,p.z);this.game.player.mesh.position.y=.38;}
  paintTimer(){const y=this.project(this.game.player.mesh.position).y,meter=document.getElementById('wind-meter');meter.max=1;meter.value=Math.max(0,Math.min(1,(y+1)/2));this.trials.panel.dataset.urgent=String(y<-.5);}
  launch(){
    const t=this.trials;if(this.jump)return;
    this.jump={elapsed:0,from:this.game.player.mesh.position.clone(),flow:this.flow,lane:t.lane,duration:this.jumpDuration()};t.dashRunning=true;this.game.audio.note(587,.15,.035);
  }
  lose(message){this.lastFailure={message,screen:this.project(this.game.player.mesh.position)};this.jump=null;this.trials.dashRunning=false;this.trials.fail();this.trials.hud(message);}
  update(dt){
    const t=this.trials,g=this.game;this.elapsed+=dt;this.flow+=this.speed()*dt;this.moveStones();
    this.foam.forEach((f,i)=>f.position.z=-26+((this.flow*1.2+i*1.83)%54));
    for(const s of this.stones)if(s.hazard==='bomb')s.spark.scale.setScalar(.12*(g.reducedMotion?1:.9+Math.sin(this.elapsed*9+s.row)*.15));
    const target=this.stone(t.stage+1,t.lane);this.ring.position.set(target.mesh.position.x,.4,target.mesh.position.z);this.ring.material.color.set(target.hazard?0xf08669:0xffe6a2);
    this.owl.mesh.position.set(-3.8,1.1,Math.min(9,g.player.mesh.position.z));this.owl.update(g.time,g.player,g.reducedMotion,true);
    for(const id of ['action-left','action-right','action-run'])document.getElementById(id).disabled=!!this.jump;
    if(this.jump){
      const j=this.jump;j.elapsed+=dt;const u=Math.min(1,j.elapsed/j.duration),dest=this.stone(t.stage+1,j.lane),p=dest.mesh.position;
      // Both endpoints drift with the current, including during flight.
      g.player.mesh.position.set(j.from.x+(p.x-j.from.x)*u,.38+Math.sin(u*Math.PI)*1.9,j.from.z+this.flow-j.flow-this.spacing*u);
      g.player.mesh.rotation.y=Math.atan2(p.x-j.from.x,-this.spacing);g.player.arms.forEach(a=>a.rotation.x=-.8);g.player.legs.forEach((leg,i)=>leg.rotation.x=(i?-.3:.4)*Math.sin(u*Math.PI));
      if(this.outside(g.player.mesh.position)){this.lose('出界！再試一次');return;}
      t.hud('');
      if(u===1){
        if(dest.hazard){
          const message=dest.hazard==='mushroom'?'毒香菇！重試':'炸彈！重試';
          if(j.elapsed<j.duration+.3){this.splash.visible=true;this.splash.position.copy(p);g.player.mesh.position.y=.15;t.hud(message);return;}
          this.lose(message);return;
        }
        this.jump=null;t.dashRunning=false;t.stage++;this.currentLane=j.lane;
        const f=g.state.forest;f.dashStage=Math.floor(t.stage/3);f.dashLeg=t.stage%3;g.saveProgress();g.audio.chime();
        if(t.stage===9){t.complete();return;}
        this.place();for(const id of ['action-left','action-right','action-run'])document.getElementById(id).disabled=false;
      }
    }else{
      this.place();g.player.mesh.rotation.y=Math.PI;
      if(this.outside(g.player.mesh.position)){this.lose('出界！再試一次');return;}
      const danger=target.hazard==='mushroom'?'毒香菇！換邊':target.hazard==='bomb'?'炸彈！換邊':this.project(g.player.mesh.position).y<-.5?'快跳！':this.ready()?'':'等石頭漂近';
      t.hud(danger);
    }
    this.paintTimer();
  }
};
