'use strict';
Meadow.Prologue = class {
  constructor(game){this.game=game;this.active=false;document.getElementById('prologue-skip').onclick=()=>{if(this.active&&game.state.mode!=='paused')this.finish();};}
  start(){
    const g=this.game,A=Meadow.Art;
    if(!this.root){
      this.root=A.group(g.worldCache[1].layer);this.mother=new Meadow.Mother(this.root);
      this.clouds=Array.from({length:5},(_,i)=>{
        const m=new THREE.Mesh(A.geometries.ball,new THREE.MeshBasicMaterial({color:0xf0e9d4,transparent:true,opacity:0,depthWrite:false}));
        m.scale.set(2.5,1.3,1.2);m.position.set(-7+i*2,1,7.9);this.root.add(m);return m;
      });
      this.ribbon=A.ribbon(this.root,0,0,0,.8);
      this.butterfly=A.group(this.root,-5,9.4);this.butterfly.position.y=1.8;
      A.part(this.butterfly,'ball',0xaa8651,[0,0,0],[.04,.15,.05]);
      this.wings=[-1,1].map(s=>A.part(this.butterfly,'ball',0xe6bb56,[s*.16,.02,0],[.2,.16,.035]));
    }
    this.active=true;this.elapsed=0;this.animating=false;this.root.visible=true;this.ribbon.visible=false;
    this.clouds.forEach(m=>m.material.opacity=0);this.mother.mesh.visible=true;this.mother.mesh.position.set(-1.7,0,10);
    this.mother.mesh.rotation.y=-Math.PI/2;g.player.setPosition(-4.7,10.5);g.player.mesh.rotation.y=Math.PI/2;
    this.butterfly.visible=true;this.butterfly.position.set(-5,1.8,9.4);
    g.world.ribbon.visible=false;g.view.override=new THREE.Vector3(-2,0,8.5);
    document.body.classList.add('in-prologue');document.getElementById('prologue-skip').hidden=false;
    g.dialogue.show([{name:'媽媽',text:'今天在花田野餐，晚一點一起去山丘看星星。'},{name:'小米',text:'金色蝴蝶！我就在旁邊看看。'},{name:'媽媽',text:'好，別走遠，要看得到媽媽喔。'}],()=>{
      g.state.mode='cutscene';this.animating=true;document.body.classList.add('in-cutscene');
      document.getElementById('story-caption').hidden=false;
      document.getElementById('story-caption').textContent='一陣風，把薄霧帶進了花田……';
    });
  }
  update(dt){
    const g=this.game;if(!this.active||g.state.mode==='paused')return;
    this.mother.update(g.time,false,this.animating,g.reducedMotion);
    this.wings.forEach((w,i)=>w.rotation.y=g.reducedMotion?0:Math.sin(g.time*12)*(i?1:-1)*.9);
    if(!this.animating)return;
    this.elapsed+=dt;const t=this.elapsed;
    g.player.setPosition(-4.7-Math.min(t/3,1)*1.2,10.5-Math.min(t/3,1)*1.1);
    g.player.mesh.rotation.y=-2.3;
    this.butterfly.position.set(-5-Math.min(t/3,1)*1.3,1.8,9.4-Math.min(t/3,1));
    if(!g.reducedMotion){const swing=t<3?Math.sin(t*11)*.45:0;g.player.legs[0].rotation.x=swing;g.player.legs[1].rotation.x=-swing;}
    this.mother.mesh.position.set(-1.7+Math.min(t/5,1)*1.7,0,10-Math.min(t/5,1)*4);
    this.mother.mesh.rotation.y=Math.PI;
    this.clouds.forEach((m,i)=>{m.material.opacity=Math.min(.72,t*.2);m.position.x=-8+i*2.5+(g.reducedMotion?0:Math.sin(t*.8+i)*.5);});
    this.ribbon.visible=t>1&&t<5;
    this.ribbon.position.set(Math.sin(t)*.65,Math.max(.4,2.7-t*.42),8-t*.12);
    this.ribbon.rotation.z=g.reducedMotion?0:Math.sin(t*6)*.4;
    if(t>4.4)this.mother.mesh.visible=false;
    if(t>5.5){
      this.animating=false;document.getElementById('story-caption').hidden=true;document.body.classList.remove('in-cutscene');
      g.dialogue.show([{name:'媽媽（霧的另一邊）',text:'小米！你在哪裡？'},{name:'小米',text:'媽媽的聲音變遠了……我們走散了。'}],()=>this.finish());
    }
  }
  reset(){
    this.active=false;this.animating=false;if(this.root)this.root.visible=false;
    document.body.classList.remove('in-prologue');document.getElementById('prologue-skip').hidden=true;
  }
  finish(){
    const g=this.game;g.dialogue.close();this.reset();g.view.override=null;
    document.body.classList.remove('in-cutscene');document.getElementById('story-caption').hidden=true;
    g.state.prologueSeen=true;g.player.setPosition(CONFIG.START.x,CONFIG.START.z);g.checkpoint(CONFIG.START.x,CONFIG.START.z);g.story.intro();
  }
};

Meadow.ActionTrials = class {
  constructor(game){
    this.game=game;this.active=false;this.panel=document.getElementById('action-ui');
    document.getElementById('action-start').onclick=()=>this.begin();
    document.getElementById('action-leave').onclick=()=>{if(game.state.mode==='action')this.leave();};
    document.getElementById('action-left').onclick=()=>this.steer(-1);
    document.getElementById('action-right').onclick=()=>this.steer(1);
    const run=document.getElementById('action-run');
    run.addEventListener('click',e=>{if(e.detail===0)this.requestDash();});
    run.addEventListener('pointerdown',e=>{if(!this.active||game.state.mode!=='action')return;e.preventDefault();run.setPointerCapture(e.pointerId);this.requestDash();});
    for(const event of ['pointerup','pointercancel','lostpointercapture'])run.addEventListener(event,()=>this.release());
    window.addEventListener('keydown',e=>{
      if(!this.active||game.state.mode!=='action'||!this.started)return;
      if(['ArrowLeft','KeyA','ArrowRight','KeyD'].includes(e.code)&&!e.repeat){e.preventDefault();this.steer(['ArrowLeft','KeyA'].includes(e.code)?-1:1);}
      if(['Space','KeyE','ArrowUp','KeyW'].includes(e.code)&&!e.repeat){if(e.code==='Space'&&e.target.closest?.('button'))return;e.preventDefault();this.requestDash();}
    });
    window.addEventListener('keyup',e=>{if(['Space','KeyE','ArrowUp','KeyW'].includes(e.code))this.release();});
    window.addEventListener('blur',()=>{this.release();if(this.active&&game.state.mode==='action')game.togglePause();});
  }
  release(){this.holding=false;this.needsRelease=false;}
  requestDash(){
    if(!this.active||!this.started||this.kind!=='dash'||this.game.state.mode!=='action'||this.dashRunning)return;
    if(this.lane!==this.safeLane()){this.noticeUntil=this.elapsedVisual+1.5;this.hud('先選金色跑道，再按一下出發。');return;}
    this.queued=true;
  }
  safeLane(){return [0,2,1,2,0,1,0,2,1][this.stage];}
  build(){
    if(this.root)return;const A=Meadow.Art,g=this.game;this.root=A.group(g.scene);this.root.visible=false;
    A.part(this.root,'cylinder',0x638776,[0,-.6,0],[8,.95,15]);
    A.part(this.root,'box',0x8aa49d,[0,-1.3,0],[300,.1,300],false);
    A.part(this.root,'box',0xd1c399,[0,-.07,0],[6.4,.1,23]);
    this.roadDashes=[];
    this.laneMarks=[];this.bands=[];
    for(let lane=0;lane<3;lane++){
      const x=(lane-1)*2;
      const mat=new THREE.MeshBasicMaterial({color:0xe7b45c,transparent:true,opacity:0,depthWrite:false});
      const strip=new THREE.Mesh(A.geometries.box,mat);strip.position.set(x,.01,0);strip.scale.set(1.8,.02,22);this.root.add(strip);this.laneMarks.push(strip);
      const band=A.group(this.root,x,-8);this.bands.push(band);
      const arrow=A.part(band,'cone',0xb77540,[0,.13,.15],[.48,.9,.08],false);arrow.rotation.x=Math.PI/2;
      for(let j=0;j<4;j++){
        const cloud=new THREE.Mesh(A.geometries.ball,new THREE.MeshBasicMaterial({color:0xd8e7d3,transparent:true,opacity:.75}));
        cloud.scale.set(.48,.25,.30);cloud.position.set((j-1.5)*.45,.4+(j%2)*.25,0);band.add(cloud);
        const leaf=A.part(band,'ball',0x6b8f5b,[(j-1.5)*.45,1,.12],[.18,.055,.09]);leaf.rotation.z=.4;
      }
      for(let z=-10;z<=10;z+=2)this.roadDashes.push(A.part(this.root,'box',0xa7a17c,[x-.95,.018,z],[.045,.025,.8],false));
    }
    this.shelters=[];
    for(let i=0;i<4;i++){
      const hut=A.group(this.root,0,7-i*4);this.shelters.push(hut);
      A.disk(hut,0x91ad88,0,0,2.8,.65,.025);
      for(const s of [-1,1]){
        A.part(hut,'cylinder',0x8d8766,[s*2.8,1.1,0],[.12,2.2,.12]);
        A.part(hut,'ball',0xf2d799,[s*2.8,2.35,0],[.22,.3,.22]);
      }
      const arch=A.part(hut,'box',0xa4b584,[0,2.7,0],[5.8,.18,.55]);arch.visible=i>0;
    }
    this.trees=[];
    for(let i=0;i<12;i++){
      const tree=A.group(this.root,(i%2?1:-1)*(5+i%3*.65),-11+Math.floor(i/2)*4.3);this.trees.push(tree);
      A.part(tree,'cylinder',0x6d7f63,[0,1.5,0],[.18,3,.2]);
      for(let j=0;j<3;j++)A.part(tree,'cone',j%2?0x769675:0x5b816d,[0,2+j*.9,0],[1.5-j*.28,2,1.5-j*.28]);
    }
    this.leaves=Array.from({length:32},(_,i)=>A.part(this.root,'ball',i%2?0x9fb178:0xc4c99b,[0,1,0],[.13,.04,.08],false));
    this.finishRing=new THREE.Mesh(new THREE.RingGeometry(.8,1,32),new THREE.MeshBasicMaterial({color:0xf4d893,side:THREE.DoubleSide}));
    this.finishRing.rotation.x=-Math.PI/2;this.finishRing.position.set(0,.04,-6);this.root.add(this.finishRing);
  }
  start(kind){
    const g=this.game,f=g.state.forest;
    if(this.active||g.state.chapter!==2||g.state.mode!=='playing'||(kind==='gust'?f.round<3||f.gustStage>=6:!f.routeKnown||f.dashStage>=3))return;
    this.build();this.kind=kind;this.active=true;this.started=false;this.lane=1;this.elapsed=0;this.elapsedVisual=0;this.retry=0;this.shake=0;this.phase=0;this.travel=0;this.dashRunning=false;this.queued=false;this.noticeUntil=0;this.release();
    this.stage=kind==='gust'?f.gustStage*3+f.gustWave:f.dashStage*3+f.dashLeg;this.failed=false;
    g.checkpoint(kind==='gust'?0:4,kind==='gust'?4.1:-3.7);
    this.returnPosition={...g.state.checkpoint};g.state.mode='action';g.input.reset();
    g.worldCache[2].layer.visible=false;this.root.visible=true;this.panel.hidden=false;document.body.classList.add('in-action');
    const startZ=7;
    g.view.override=new THREE.Vector3(0,0,kind==='dash'?startZ-3:1);g.view.focus.copy(g.view.override);g.player.setPosition(0,startZ);g.player.mesh.rotation.y=Math.PI;
    this.shelters.forEach(s=>s.visible=kind==='dash');this.bands.forEach(b=>b.visible=false);this.laneMarks.forEach(m=>m.material.opacity=0);
    document.getElementById('action-title').textContent=kind==='gust'?'疾風小徑':'風停快跑';
    document.getElementById('action-instruction').textContent=kind==='gust'?'十八波陣風！← → 換道；出現「逆風」時左右交換。':'← → 選金色跑道，按一下出發。風大會等候，抵達下一亭自動停下。共九段！';
    document.getElementById('action-ready').hidden=false;
    document.getElementById('action-steer').hidden=false;document.getElementById('action-run').hidden=kind!=='dash';
    document.getElementById('wind-meter').hidden=kind!=='dash';
    this.hud('準備好了再出發');document.getElementById('action-start').focus();g.interactions.update();
  }
  begin(){if(!this.active||this.game.state.mode!=='action')return;this.started=true;this.release();document.getElementById('action-ready').hidden=true;document.getElementById('action-start').blur();}
  steer(direction){if(this.active&&this.started&&this.game.state.mode==='action'&&!this.dashRunning)this.lane=Math.max(0,Math.min(2,this.lane+(this.kind==='gust'&&this.stage>=12&&this.stage%3===2?-direction:direction)));}
  hud(text){
    document.getElementById('action-status').textContent=text;
    document.getElementById('action-progress').textContent=`${this.stage} / ${this.kind==='gust'?18:9}`;
    document.getElementById('action-meter').value=this.stage;document.getElementById('action-meter').max=this.kind==='gust'?18:9;
  }
  fail(){
    const g=this.game,f=g.state.forest;f[this.kind+'Fails']=Math.min(99,f[this.kind+'Fails']+1);
    this.stage=f[this.kind+'Stage']*3+f[this.kind==='gust'?'gustWave':'dashLeg'];this.retry=1.05;this.elapsed=0;this.phase=0;this.travel=0;this.lane=1;this.shake=.35;this.release();
    g.player.setPosition(0,7);g.saveProgress();g.audio.note(196,.3,.035);
    this.hud(f[this.kind+'Fails']>=6?'風慢一點了，再試一次！':'咕咕接住你了！回到安全點');
    this.bands.forEach(b=>b.visible=false);this.laneMarks.forEach(m=>m.material.opacity=0);
  }
  update(dt){
    const g=this.game;if(!this.active||g.state.mode!=='action')return;
    this.elapsedVisual=(this.elapsedVisual||0)+dt;const t=this.elapsedVisual;
    if(!g.reducedMotion){
      this.trees.forEach((tree,i)=>tree.rotation.z=Math.sin(t*2+i)*.045);
      this.leaves.forEach((leaf,i)=>{leaf.position.set(((t*5+i*2.1)%16)-8,1+(i%6)*.5,((i*3.3+t*2)%24)-12);leaf.rotation.z=t*3+i;});
    }
    if(!this.started)return;
    if(this.retry>0){this.retry-=dt;return;}
    this.shake=Math.max(0,this.shake-dt);
    if(this.kind==='gust')this.updateGust(dt);else this.updateDash(dt);
    if(!this.active)return;
    const running=this.kind==='gust'||this.dashRunning;
    if(running&&!g.reducedMotion){
      if(this.kind==='gust')this.roadDashes.forEach((mark,i)=>mark.position.z=((Math.floor(i%11)*2+t*5)%22)-11);
      g.player.phase+=dt*13;const swing=Math.sin(g.player.phase)*.55;
      g.player.legs[0].rotation.x=swing;g.player.legs[1].rotation.x=-swing;g.player.arms[0].rotation.x=-swing;g.player.arms[1].rotation.x=swing;
      g.player.body.position.y=Math.abs(swing)*.1;
    }
    g.player.shadow.position.copy(g.player.mesh.position);g.player.shadow.position.y=.009;
  }
  updateGust(dt){
    const g=this.game,f=g.state.forest;this.elapsed+=dt;
    const patterns=[[0],[2],[1],[0,1],[1,2],[0,2],[1,2],[0,1],[0,2],[0,1],[0,2],[1,2],[0,2],[1,2],[0,1],[1,2],[0,1],[0,2]],lanes=patterns[this.stage];
    const assisted=f.gustFails>=6,warn=assisted?1.1:.55,speed=assisted?8:9+Math.floor(this.stage/6)*1.4;
    const z=-9+Math.max(0,this.elapsed-warn)*speed;
    const p=g.player.mesh.position;p.x+=((this.lane-1)*2-p.x)*Math.min(1,dt*14);
    this.laneMarks.forEach((m,i)=>{m.material.color.set(0xda963d);m.material.opacity=lanes.includes(i)?.34:0;});
    this.bands.forEach((b,i)=>{b.visible=lanes.includes(i);b.position.z=z;});
    this.hud(this.stage>=12&&this.stage%3===2?'↔ 逆風！左右操作交換':this.elapsed<warn?'看準空跑道！':'連續閃避！');
    if(z>=6.2&&z<=7.8&&lanes.some(i=>Math.abs(p.x-(i-1)*2)<1.05)){this.fail();return;}
    if(z>10){
      this.stage++;this.elapsed=0;g.audio.note(659,.15,.025);
      f.gustStage=Math.floor(this.stage/3);f.gustWave=this.stage%3;g.saveProgress();
      if(this.stage===18)this.complete();
    }
  }
  updateDash(dt){
    const g=this.game,f=g.state.forest,calm=2.35,period=.85+calm+.5;
    this.phase=(this.phase+dt)%period;
    const gust=this.phase<.85,warning=this.phase>=.85+calm;
    const wind=gust?'gust':warning?'warning':'calm';
    if(this.panel.dataset.wind!==wind)g.audio.note(gust?164:warning?294:523,.22,.03);
    this.panel.dataset.wind=wind;
    const meter=document.getElementById('wind-meter');meter.max=calm;meter.value=gust?0:Math.max(0,.85+calm-this.phase);
    this.bands.forEach((b,i)=>{b.visible=gust;b.position.set((i-1)*2,.15,((this.phase*13+i*3)%18)-8);});
    const safeLane=this.safeLane();
    this.laneMarks.forEach((m,i)=>{m.material.color.set(i===safeLane?0xe7c66d:0xb16f62);m.material.opacity=i===safeLane?.35:.12;});
    // A tap reserves departure; leave only when the entire crossing fits in the calm window.
    if(this.queued&&!this.dashRunning&&this.lane===safeLane&&!gust&&.85+calm-this.phase>=4/3.4+.1){this.dashRunning=true;this.queued=false;}
    if(this.dashRunning)this.travel=Math.min(4,this.travel+dt*3.4);
    const z=7-this.travel;g.player.setPosition((this.lane-1)*2,z);g.view.override.set(0,0,z-3);
    for(const id of ['action-left','action-right','action-run'])document.getElementById(id).disabled=this.dashRunning;
    if(this.elapsedVisual>=this.noticeUntil)this.hud(this.dashRunning?'快到了！抵達避風亭會自動停下。':this.queued?'已準備出發，等風停就跑！':'走'+['左','中','右'][safeLane]+'邊金色道，按一下出發'+(gust||warning?' · 風大會等候':' · 現在風停了！'));
    if(this.travel>=4){
      this.stage++;f.dashStage=Math.floor(this.stage/3);f.dashLeg=this.stage%3;g.saveProgress();g.audio.chime();
      this.dashRunning=false;this.queued=false;
      for(const id of ['action-left','action-right','action-run'])document.getElementById(id).disabled=false;
      if(this.stage===9){this.complete();return;}
      this.travel=0;this.phase=0;
      this.hud('安全抵達！選好下一段金色跑道。');
    }
  }
  complete(){
    const g=this.game,kind=this.kind;g.state.forest[kind+'Stage']=kind==='gust'?6:3;g.state.forest[kind==='gust'?'gustWave':'dashLeg']=0;
    this.leave(true);g.player.setPosition(kind==='gust'?2:11,-3.5);g.checkpoint(kind==='gust'?2:11,-3.5);g.audio.chime();
    g.story.say(kind==='gust'?[['咕咕','你闖過疾風了！媽媽就在前面。']]:[['小米','我抓到風停的時機了！往河谷出發吧。']]);
  }
  leave(completed=false){
    if(!this.active)return;const g=this.game,p=this.returnPosition;
    this.reset();g.state.mode='playing';g.player.setPosition(p.x,p.z);g.refresh();if(!completed)g.toast('最近的存點已保留，準備好再挑戰。');
  }
  reset(){
    this.active=false;this.started=false;this.dashRunning=false;this.queued=false;this.release();
    for(const id of ['action-left','action-right','action-run'])document.getElementById(id).disabled=false;
    if(this.root)this.root.visible=false;
    this.panel.hidden=true;delete this.panel.dataset.wind;document.body.classList.remove('in-action');
    this.game.view.override=null;if(this.game.worldCache[2])this.game.worldCache[2].layer.visible=this.game.state.chapter===2;
  }
};
