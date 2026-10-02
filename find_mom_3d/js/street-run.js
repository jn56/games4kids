'use strict';
// An optional neighbourhood time trial shares the exploration controls and roads.
Meadow.StreetRun=class {
  constructor(game){this.game=game;this.active=false;this.limit=45;}
  prepare(){
    const w=this.game.world;if(w.streetRun)return;
    const A=Meadow.Art,start=Meadow.Sandbox.spot(w,3,20,.5),mesh=A.group(w.root,start.x,start.z);
    A.part(mesh,'cylinder',0x82765e,[0,.85,0],[.035,1.7,.035]);
    for(let x=0;x<4;x++)for(let y=0;y<3;y++)A.part(mesh,'box',(x+y)%2?0x435e58:0xffe8b8,[.1+x*.17,1.55-y*.17,0],[.17,.17,.035],false);
    const ring=new THREE.Mesh(new THREE.RingGeometry(1.15,1.4,40),new THREE.MeshBasicMaterial({color:0x80ded2,side:THREE.DoubleSide,transparent:true,opacity:.78,depthWrite:false}));
    ring.rotation.x=-Math.PI/2;ring.position.y=.12;w.root.add(ring);ring.visible=false;
    const arrow=A.group(w.root);arrow.visible=false;
    for(const side of [-1,1]){const piece=A.part(arrow,'box',0xffdc81,[side*.28,0,0],[.12,.07,.78],false);piece.rotation.y=side*.8;}
    const positions=[[12,24],[22,23],[25,13],[16,13],[0,20],[-16,10],[-25,10],[-22,22],[-12,24],[0,31],[start.x,start.z]];
    const points=positions.map(([x,z])=>{const p=Meadow.Sandbox.spot(w,x,z,.45);return new THREE.Vector3(p.x,0,p.z);});
    w.streetRun={mesh,ring,arrow,points};
  }
  candidate(){
    this.prepare();if(this.active)return null;
    const best=this.game.sandbox.progress().bestRun;
    return {id:'street-run',position:this.game.world.streetRun.mesh.position,text:'⚑ 環道計時'+(best?' · '+best.toFixed(1)+'s':'')};
  }
  start(){
    const g=this.game;if(g.state.mode!=='playing')return;
    this.prepare();this.active=true;this.elapsed=0;this.index=0;this.chapter=g.state.chapter;g.travel.selected=0;
    g.toast('⚑ 45 秒 · 穿過光圈',1800);g.audio.note(880,.2,.025);g.refresh();
  }
  target(){const points=this.game.world.streetRun?.points;return this.active?{position:points[this.index],text:'⚑ '+Math.ceil(this.limit-this.elapsed)+'s · '+this.index+'/'+points.length}:null;}
  stop(message,refresh=true){
    if(!this.active)return;
    const g=this.game;this.active=false;g.world.streetRun.ring.visible=g.world.streetRun.arrow.visible=false;
    if(message)g.toast(message,2400);if(refresh)g.refresh();
  }
  update(dt){
    const g=this.game,w=g.world,playing=g.state.mode==='playing';this.prepare();
    w.streetRun.mesh.visible=playing&&!this.active;
    if(this.active&&(!['playing','paused','dialogue'].includes(g.state.mode)||this.chapter!==g.state.chapter)){this.stop();return;}
    w.streetRun.ring.visible=w.streetRun.arrow.visible=playing&&this.active;
    if(!playing||!this.active)return;
    this.elapsed+=dt;
    if(this.elapsed>=this.limit){this.stop('⚑ 時間到 · 回旗子再試一次');return;}
    const goal=this.target().position,p=g.player.mesh.position;
    w.streetRun.ring.position.set(goal.x,.12,goal.z);
    w.streetRun.ring.scale.setScalar(g.reducedMotion?1:1+Math.sin(g.time*4)*.06);
    const dx=goal.x-p.x,dz=goal.z-p.z,angle=Math.atan2(dx,dz);
    w.streetRun.arrow.position.set(p.x+Math.sin(angle)*2,.12,p.z+Math.cos(angle)*2);w.streetRun.arrow.rotation.y=angle+Math.PI;
    if(Math.hypot(dx,dz)>1.65)return;
    g.sandbox.burst(goal,0x8de0d1);g.audio.note(660+this.index*35,.15,.018);this.index++;
    if(this.index===w.streetRun.points.length){
      const progress=g.sandbox.progress(),time=Math.round(this.elapsed*10)/10,record=!progress.bestRun||time<progress.bestRun;
      if(record){progress.bestRun=time;g.saveProgress();}
      this.stop('⚑ '+time.toFixed(1)+'s'+(record?' · 新紀錄！':' · 完成！'));
    }
  }
};
