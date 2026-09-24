'use strict';
// The old dashStage/dashLeg save slots now record the nine stepping stones.
Meadow.RiverHop = class {
  constructor(trials){
    this.trials=trials;this.game=trials.game;const A=Meadow.Art;
    this.root=A.group(trials.root);this.root.visible=false;this.jump=null;
    A.part(this.root,'box',0x83a9b1,[0,-1,0],[300,.1,300],false);
    A.part(this.root,'box',0x548f9f,[0,-.17,-10],[9,.35,53],false);
    for(const side of [-1,1]){
      A.part(this.root,'box',0x92aa8e,[side*6,-.1,-10],[3,.3,54]);
      for(let i=0;i<14;i++)A.part(this.root,'pebble',0x9daa94,[side*4.65,.1,12-i*3.8],[.6,.45,.8]);
      for(let i=0;i<7;i++){const tree=A.group(this.root,side*6.3,10-i*7);A.part(tree,'cylinder',0x7e8266,[0,1,0],[.16,2,.16]);A.part(tree,'cone',0x769780,[0,2.3,0],[1.1,2.4,1.1]);}
    }
    A.part(this.root,'cylinder',0xc7bc94,[0,.16,7],[3.1,.4,1.7]);
    A.part(this.root,'box',0xbac49b,[0,.15,-31],[8,.3,4]);
    this.stones=[];
    for(let row=1;row<=9;row++)for(let lane=0;lane<3;lane++){
      const safe=lane===this.safeLane(row-1),mesh=A.group(this.root,(lane-1)*2,7-row*4);
      A.part(mesh,'cylinder',safe?0xb9b39b:0x668994,[0,safe?.12:-.1,0],[safe?.88:.6,safe?.48:.3,safe?.82:.6]);
      if(!safe){const crack=A.part(mesh,'box',0x456c78,[0,.06,0],[.07,.025,.65]);crack.rotation.y=.4;}
      const light=A.disk(mesh,0xf1d181,0,0,.57,.53,.37);light.visible=false;
      this.stones.push({row,lane,safe,mesh,light});
    }
    this.ring=new THREE.Mesh(new THREE.RingGeometry(.9,1.02,40),new THREE.MeshBasicMaterial({color:0xffe6a2,side:THREE.DoubleSide}));this.ring.rotation.x=-Math.PI/2;this.root.add(this.ring);
    this.foam=Array.from({length:28},(_,i)=>A.part(this.root,'box',0xc1e1de,[(i%7-3)*1.1,.025,0],[.36,.018,.75],false));
    this.wave=A.group(this.root);for(let i=0;i<10;i++)A.part(this.wave,'ball',0xc1e1de,[-3.7+i*.82,.15,0],[.55,.16,.25],false);
    const before=this.root.children.length;this.owl=new Meadow.Owl(this.root);this.root.children.slice(before).filter(o=>o!==this.owl.mesh).forEach(o=>o.visible=false);this.owl.mesh.scale.setScalar(.6);
  }
  safeLane(stage){return [0,2,1,2,0,1,0,2,1][stage];}
  ready(){const t=this.trials;return t.stage<3||(t.elapsedVisual+t.stage*.31)%2.9>.8&&(t.elapsedVisual+t.stage*.31)%2.9<2.55;}
  stone(row,lane){return this.stones.find(s=>s.row===row&&s.lane===lane);}
  start(){this.jump=null;this.currentLane=this.trials.stage===0?1:this.safeLane(this.trials.stage-1);this.trials.lane=this.currentLane;this.place();}
  place(){const t=this.trials,g=this.game,stone=this.stone(t.stage,this.currentLane);g.player.setPosition(stone?stone.mesh.position.x:0,7-t.stage*4);g.player.mesh.position.y=.38;g.view.override.set(0,0,g.player.mesh.position.z-3);}
  launch(){
    const t=this.trials,g=this.game;
    if(this.jump)return;
    if(!this.ready()){t.noticeUntil=t.elapsedVisual+.8;t.hud('浪還蓋著石頭，等金光亮起再跳！');return;}
    this.jump={elapsed:0,from:g.player.mesh.position.clone(),lane:t.lane,valid:t.lane===this.safeLane(t.stage)};t.dashRunning=true;g.audio.note(587,.15,.035);
  }
  update(dt){
    const t=this.trials,g=this.game,time=t.elapsedVisual,ready=this.ready();
    this.foam.forEach((f,i)=>f.position.z=13-((time*4+i*1.83)%51));
    for(const s of this.stones){
      s.mesh.position.x=(s.lane-1)*2+(s.row>=4&&s.safe?Math.sin(time*1.3+s.row)*.24:0);
      s.light.visible=s.safe&&(s.row<=t.stage||s.row===t.stage+1&&ready);
    }
    const target=this.stone(t.stage+1,t.lane);this.ring.position.set(target.mesh.position.x,.42,target.mesh.position.z);this.ring.material.color.set(t.lane===this.safeLane(t.stage)?ready?0xffdc7a:0xc6e4ee:0xf0a28f);
    this.wave.visible=!ready;this.wave.position.z=target.mesh.position.z+.5+Math.sin(time*5)*.3;
    this.owl.mesh.position.set(-3.8,1.1,7-t.stage*4);this.owl.update(g.time,g.player,g.reducedMotion,true);
    for(const id of ['action-left','action-right','action-run'])document.getElementById(id).disabled=!!this.jump;
    t.panel.dataset.wind=ready?'calm':'gust';
    if(this.jump){
      const j=this.jump;j.elapsed+=dt;const u=Math.min(1,j.elapsed/.82),dest=this.stone(t.stage+1,j.lane).mesh.position;
      g.player.mesh.position.set(j.from.x+(dest.x-j.from.x)*u,.38+Math.sin(u*Math.PI)*1.9,j.from.z+(dest.z-j.from.z)*u);
      g.player.mesh.rotation.y=Math.atan2(dest.x-j.from.x,dest.z-j.from.z);g.player.arms.forEach(a=>a.rotation.x=-.8);g.player.legs.forEach((leg,i)=>leg.rotation.x=(i?-.3:.4)*Math.sin(u*Math.PI));
      t.hud('跳！落穩後再選下一顆。');
      if(u===1){
        const valid=j.valid;this.jump=null;t.dashRunning=false;
        for(const id of ['action-left','action-right','action-run'])document.getElementById(id).disabled=false;
        if(!valid){t.fail();return;}
        t.stage++;const f=g.state.forest;f.dashStage=Math.floor(t.stage/3);f.dashLeg=t.stage%3;g.saveProgress();g.audio.chime();
        if(t.stage===9){t.complete();return;}
        this.currentLane=j.lane;this.place();t.hud('站穩了！看看下一顆金色石頭。');
      }
    }else{
      this.place();g.player.mesh.rotation.y=Math.PI;
      if(time>=t.noticeUntil)t.hud(ready?'選'+['左','中','右'][this.safeLane(t.stage)]+'邊金色石頭，按一下跳躍！':'白浪來了，先站穩，等金光亮起！');
    }
    g.view.override.set(0,0,g.player.mesh.position.z-3);
  }
};
