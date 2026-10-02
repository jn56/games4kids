'use strict';
// Small, physical playgrounds share the real map's collision and interaction rules.
Meadow.Sandbox=class {
  static names=[[],['蹦蹦','阿郵','芽芽','叮叮'],['果果','羽羽','蕨蕨','森森'],['泡泡','渡渡','蓮蓮','漂漂'],['小星','晚郵','月芽','光光']];
  static roles=['球友','送貨員','園藝師','巡路人'];
  static colors=[0xe3ac66,0x86b8c6,0x9abc83,0xc7a2c7];
  static places={1:[[-17,18],[17,19],[-18,-18],[17,-20]],2:[[-17,18],[17,19],[-10,33],[10,33]],3:[[-17,18],[17,19],[-17,-22],[17,-22]],4:[[-17,18],[17,19],[-24,-1],[24,-1]]};
  static lines=[['來一球！','再來一球！'],['盒子的顏色，和收件人的圍巾一樣。','這份心意送到了，謝謝！'],['一起把花照顧好吧。','花開了，謝謝你！'],['滑板車可以借你，經過人群慢一點。','聽，風也在跟我們打招呼。']];
  static spot(w,x,z,r=.6){
    for(let ring=0;ring<=12;ring++)for(let n=0;n<(ring?16:1);n++){
      const px=x+Math.sin(n*Math.PI/8)*ring*.45,pz=z+Math.cos(n*Math.PI/8)*ring*.45;
      if(w.portals.some(p=>Math.hypot(px-p.x,pz-p.z)<5)||w.residents.some(p=>Math.hypot(px-p.x,pz-p.z)<4))continue;
      if([0,1,2,3,4,5,6,7].every(i=>w.canWalk(px+Math.sin(i*Math.PI/4)*r,pz+Math.cos(i*Math.PI/4)*r)))return {x:px,z:pz};
    }
    throw new Error('No clear playground spot in chapter '+w.mapChapter);
  }
  static build(w,c){
    const A=Meadow.Art,p=w.playground={items:[],effects:[],goals:0};w.locals=[];
    for(let i=0;i<4;i++){
      const [x,z]=this.places[c][i],home=this.spot(w,x,z,1.25),n={id:'local-'+i,index:i,name:this.names[c][i],kind:['cat','bird','turtle','cat'][i],color:[0xd7bc96,0xa1b6c1,0x9ab29b,0xb9a7c0][i],accent:this.colors[i],x:home.x,z:home.z};
      n.mesh=Meadow.Exploration.character(w.root,n);n.label=w.label(n.mesh,n.name,2.7);n.label.enabled=false;
      n.collider={x:n.x,z:n.z,r:.45};w.colliders.push(n.collider);w.locals.push(n);
      Meadow.Routines.attach(w,n,['sing','mail','garden','inspect'][i],c*13+i);
      // Colour-matched pennants are recognisable without a paragraph of instructions.
      const flag=A.group(w.root,n.x-1.3,n.z-.5);A.part(flag,'cylinder',0x9e896a,[0,.9,0],[.04,1.8,.04]);A.part(flag,'box',n.accent,[.25,1.6,0],[.55,.35,.03]);
      A.disk(w.root,0xc4c2a1,n.x,n.z,2,1.5,.03);
    }
    const add=(kind,x,z,extra={})=>{
      const spot=this.spot(w,x,z,['bench','planter','drum'].includes(kind)?.9:.4),item={id:'toy-'+p.items.length,kind,home:spot,mesh:A.group(w.root,spot.x,spot.z),vx:0,vz:0,age:0,cooldown:0,...extra};
      item.position=item.mesh.position;item.radius=kind==='crate'?.48:kind==='bench'?.75:kind==='planter'?.6:.34;
      if(['crate','bench','planter','chime','drum'].includes(kind)){item.collider={x:spot.x,z:spot.z,r:item.radius};w.colliders.push(item.collider);}
      p.items.push(item);return item;
    };
    const [a,b,d,e]=w.locals;
    p.goal=this.spot(w,a.x+3.4,a.z-4.2,1.8);p.goalMesh=A.group(w.root,p.goal.x,p.goal.z);
    for(const x of [-1.5,1.5])A.part(p.goalMesh,'cylinder',0xf4e5bd,[x,.75,0],[.08,1.5,.08]);
    A.part(p.goalMesh,'box',0xf4e5bd,[0,1.5,0],[3.1,.1,.1]);
    for(let x=-1.25;x<=1.25;x+=.5)A.part(p.goalMesh,'box',0xb7c6aa,[x,.7,-.2],[.025,1.35,.025],false);
    for(let y=.25;y<1.4;y+=.3)A.part(p.goalMesh,'box',0xb7c6aa,[0,y,-.2],[2.8,.025,.025],false);
    p.ball=add('ball',p.goal.x,p.goal.z+3);const ball=A.part(p.ball.mesh,'ball',0xf6e4b2,[0,.37,0],[.37,.37,.37]);p.ball.roll=ball;
    for(let i=0;i<6;i++){const patch=A.part(ball,'ball',this.colors[0],[Math.sin(i*2.4)*.86,Math.cos(i*2.4)*.86,.15],[.25,.25,.25]);patch.rotation.z=i;}
    for(const [x,z] of [[a.x-3,a.z+2.8],[b.x+3,b.z-3]]){
      const item=add('crate',x,z);A.part(item.mesh,'box',0xb99b72,[0,.47,0],[.9,.9,.9]);
      for(const y of [.18,.7])A.part(item.mesh,'box',0x897657,[0,y,.47],[.95,.08,.035]);
    }
    p.scooter=add('scooter',b.x+2.8,b.z+2.5);const bike=p.scooter.mesh;
    A.part(bike,'box',0x7ba4a8,[0,.2,0],[.5,.13,1.4]);A.part(bike,'cylinder',0x71868a,[0,.86,.5],[.045,1.3,.045]);A.part(bike,'box',0xe2bd7d,[0,1.5,.5],[.85,.08,.08]);
    for(const z of [-.5,.5]){const wheel=A.part(bike,'cylinder',0x536566,[0,.18,z],[.2,.55,.2]);wheel.rotation.z=Math.PI/2;}
    for(let i=0;i<4;i++){
      const n=w.locals[i],item=add('parcel',n.x+1.9,n.z+1.8,{number:i,to:(i+1)%4}),color=this.colors[item.to];
      A.part(item.mesh,'box',0xe3c89d,[0,.37,0],[.62,.6,.6]);A.part(item.mesh,'box',color,[0,.69,0],[.15,.025,.63]);A.part(item.mesh,'box',color,[0,.38,.31],[.15,.6,.025]);
    }
    for(let i=0;i<2;i++){
      const item=add('planter',d.x+(i?3:-2.5),d.z+1.6,{number:i});A.part(item.mesh,'cylinder',0xb78467,[0,.23,0],[.55,.4,.55]);A.disk(item.mesh,0x786d54,0,0,.46,.46,.45);
      item.flowers=A.group(item.mesh);item.flowers.position.y=.35;
      for(let j=0;j<3;j++)A.flower(item.flowers,[0xf1c875,0xd9a5b5,0xc4b4d8][j],(j-1)*.25,(j%2)*.2,.65);
      item.flowers.scale.setScalar(.25);
    }
    p.chime=add('chime',e.x+2.7,e.z+1.6);A.part(p.chime.mesh,'cylinder',0x958669,[0,1.15,0],[.08,2.3,.08]);
    A.part(p.chime.mesh,'box',0xcdb88c,[0,2.3,0],[1.6,.1,.15]);p.chime.bells=A.group(p.chime.mesh);
    for(let i=0;i<3;i++){A.part(p.chime.bells,'cylinder',this.colors[i],[i*.5-.5,1.9,0],[.1,.5+i*.1,.1]);}
    const bench=add('bench',e.x-2.8,e.z+2);A.part(bench.mesh,'box',0xb6a380,[0,.48,0],[1.6,.15,.65]);A.part(bench.mesh,'box',0xc7b48e,[0,.9,-.3],[1.6,.55,.1]);
    for(const x of [-.6,.6])A.part(bench.mesh,'box',0x8d826b,[x,.25,0],[.15,.5,.6]);
    const pin=add('pinwheel',a.x-3.3,a.z-2.7);A.part(pin.mesh,'cylinder',0xa3926c,[0,.85,0],[.055,1.7,.055]);pin.spin=A.group(pin.mesh);pin.spin.position.y=1.65;
    for(let i=0;i<4;i++){const vane=A.part(pin.spin,'box',this.colors[i],[Math.sin(i*Math.PI/2)*.3,Math.cos(i*Math.PI/2)*.3,.08],[.24,.6,.055]);vane.rotation.z=-i*Math.PI/2+.35;}
    const drum=add('drum',b.x-2.7,b.z+1);A.part(drum.mesh,'cylinder',0xaa7e6c,[0,.45,0],[.6,.75,.6]);A.disk(drum.mesh,0xf0dbae,0,0,.62,.62,.84);
    p.ring=new THREE.Mesh(new THREE.RingGeometry(.63,.7,32),new THREE.MeshBasicMaterial({color:0xf6d785,side:THREE.DoubleSide,transparent:true,opacity:.9,depthWrite:false}));p.ring.rotation.x=-Math.PI/2;p.ring.visible=false;w.root.add(p.ring);
    // Recycle a fixed pool of particles; repeated play never grows the scene.
    p.effects=Array.from({length:28},()=>{const mesh=A.part(w.root,'ball',0xeed393,[0,0,0],[.09,.09,.09],false);mesh.visible=false;return {mesh,life:0};});
  }
  constructor(game){
    this.game=game;this.held=null;this.riding=null;this.seated=null;this.clock=0;this.releaseButton=document.getElementById('sandbox-release');
    this.releaseButton.onclick=()=>{if(game.state.mode==='playing')this.release(false,this.held?'held':null);};
    window.addEventListener('keydown',event=>{if(event.code==='KeyQ'&&!event.repeat&&game.state.mode==='playing'&&!game.voices.panel.open&&!document.getElementById('chapter-picker').open){event.preventDefault();this.release(false,this.held?'held':null);}});
    this.bellButton=document.getElementById('scooter-bell');this.bellButton.onclick=()=>this.ringBell();
    window.addEventListener('keydown',event=>{if(event.code==='KeyH'&&!event.repeat&&game.state.mode==='playing'&&!game.voices.panel.open){event.preventDefault();this.ringBell();}});
    const A=Meadow.Art;this.can=A.group(game.player.body,.48,.55);this.can.position.y=.8;this.can.visible=false;
    A.part(this.can,'cylinder',0x81afb7,[0,0,0],[.19,.27,.19]);const spout=A.part(this.can,'cylinder',0x9ca985,[.23,0,0],[.04,.4,.04]);spout.rotation.z=-1;
  }
  enter(){
    const w=this.game.world,p=w.playground;this.held=this.riding=this.seated=null;this.waterTime=0;this.can.visible=false;this.game.player.speedMultiplier=1;this.game.player.riding=false;this.bellAt=-10;
    for(const item of p.items){item.mesh.position.set(item.home.x,0,item.home.z);item.mesh.rotation.set(0,0,0);item.vx=item.vz=item.age=item.cooldown=0;item.resetIn=0;item.mesh.scale.setScalar(1);if(item.collider){item.collider.x=item.home.x;item.collider.z=item.home.z;}}
    for(const n of [...w.locals,...w.residents]){n.reaction=0;n.reactionText='';n.dodge=null;n.greetAt=this.clock+1;n.dodgeAt=0;}
    for(const fx of p.effects){fx.life=0;fx.mesh.visible=false;}this.sync();this.ui();
  }
  progress(){return this.game.state.playgrounds[this.game.state.chapter-1];}
  target(){
    const g=this.game,n=this.held&&g.world.locals[this.held.to];if(!n)return null;
    let position=n.mesh.position;const p=g.player.mesh.position;
    if(g.state.chapter===3){
      // Before the river crossing, keep guiding the player through the main challenge.
      if(!g.world.returnCrossing&&p.z>3.2&&position.z<-11.4)return null;
      if(g.world.returnCrossing){
        if(position.z>3.2&&p.z<3.4)position=new THREE.Vector3(5,0,p.z<-11.8&&Math.abs(p.x-5)>1?-12.2:4.2);
        else if(position.z<-11.4&&p.z>-11.8)position=new THREE.Vector3(5,0,p.z>3.4&&Math.abs(p.x-5)>1?4.2:-12.2);
      }
    }
    return {position,label:n.label,text:'✉ '+n.name};
  }
  sync(){
    const p=this.game.world.playground,s=this.progress();if(!p)return;
    p.goals=s.goals;
    for(const item of p.items){
      if(item.kind==='parcel')item.mesh.visible=!s.parcels.includes(item.number);
      if(item.kind==='planter'){item.bloomed=s.flowers.includes(item.number);item.flowers.scale.setScalar(item.bloomed?1:.25);}
    }
  }
  ui(){
    const visible=this.game.state.mode==='playing'&&!!this.held;this.releaseButton.hidden=!visible;
    this.releaseButton.setAttribute('aria-label','放下包裹，鍵盤 Q');
    document.body.classList.toggle('sandbox-busy',!!visible);
    document.body.classList.toggle('sandbox-riding',!!this.riding);
    this.bellButton.hidden=this.game.state.mode!=='playing'||!this.riding;
    const meter=document.getElementById('ride-speed');meter.hidden=this.bellButton.hidden;
    meter.value=Math.min(1,(this.game.player.actualSpeed||0)/(CONFIG.PLAYER_SPEED*1.85));
  }
  release(returnHome=false,only=null){
    const g=this.game,w=g.world;
    for(const item of [only==='riding'?null:this.held,only==='held'?null:this.riding].filter(Boolean)){
      const p=g.player.mesh.position,a=g.player.mesh.rotation.y;let drop=item.home;
      if(!returnHome)for(let i=0;i<8;i++){const x=p.x+Math.sin(a+i*Math.PI/4)*.9,z=p.z+Math.cos(a+i*Math.PI/4)*.9;if(w.canWalk(x,z)){drop={x,z};break;}}
      item.mesh.position.set(drop.x,0,drop.z);item.mesh.rotation.set(0,0,0);
    }
    if(only!=='riding')this.held=null;if(only!=='held')this.riding=null;
    if(this.seated&&only!=='held'){g.player.setPosition(this.seatStart.x,this.seatStart.z);this.seated=null;}
    g.player.mesh.position.y=this.riding?.14:0;g.player.speedMultiplier=this.riding?1.85:1;g.player.riding=!!this.riding;g.player.vx=g.player.vz=0;this.ui();
  }
  candidates(){
    const g=this.game,w=g.world,p=w.playground,items=[];
    if(this.riding||this.seated)return [{id:'toy-release',position:g.player.mesh.position,text:this.riding?'◉ 下車':'↟ 起身'}];
    for(const n of w.locals)items.push({id:n.id,position:n.mesh.position,text:this.held?.to===n.index?'✉ 交給'+n.name:['⚽ 傳球','✉ '+n.name,'✿ '+n.name,'♬ '+n.name][n.index],npc:n});
    for(const item of p.items){
      if(!item.mesh.visible||item===this.held||this.held&&item.kind==='parcel')continue;
      const texts={ball:'⚽ 踢球',crate:'▣ 推一下',scooter:'◉ 借滑板車',parcel:'✉ 送給'+w.locals[item.to]?.name,planter:item.bloomed?'✿ 再澆一點':'✿ 澆水',chime:'♬ 敲風鈴',bench:'☀ 坐一下',pinwheel:'✣ 轉風車',drum:'♫ 敲鼓'};
      items.push({id:item.id,position:item.position,text:texts[item.kind],item});
    }
    return items;
  }
  highlight(current){
    const ring=this.game.world.playground.ring,object=current?.item||current?.npc;ring.visible=this.game.state.mode==='playing'&&!!object;
    if(object)ring.position.set(object.mesh.position.x,.1,object.mesh.position.z);
  }
  burst(position,color=0xf1cf78){
    if(this.game.reducedMotion)return;
    const pool=this.game.world.playground.effects;
    for(let i=0;i<10;i++){const fx=pool.find(f=>f.life<=0);if(!fx)break;fx.life=.7+i*.025;fx.mesh.visible=true;fx.mesh.material=Meadow.Art.material(color);fx.mesh.position.set(position.x,.7,position.z);fx.vx=Math.sin(i*2.4)*1.4;fx.vz=Math.cos(i*2.4)*1.4;fx.vy=1.6+(i%3)*.3;}
  }
  react(n,text='♡',voice=false){
    n.reaction=2.2;n.reactionText=text;n.routine.wait=2.5;
    if(voice)this.game.voices.playLine(n.name,text);this.burst(n.mesh.position,n.accent);this.game.audio.note(660,.15,.014);
  }
  ringBell(){
    const g=this.game;if(!this.riding||g.state.mode!=='playing'||this.clock-this.bellAt<.65)return;
    this.bellAt=this.clock;g.audio.note(1046,.18,.03);g.audio.note(1568,.35,.018);this.burst(g.player.mesh.position,0x91d1cd);
    const move={x:Math.sin(g.player.mesh.rotation.y),z:Math.cos(g.player.mesh.rotation.y)};
    for(const n of [...g.world.locals,...g.world.residents])if(n.mesh.position.distanceTo(g.player.mesh.position)<6){Meadow.Routines.yield(g.world,n,g.player,move,6);this.react(n,'♫');}
  }
  act(current){
    const g=this.game,w=g.world,p=w.playground;
    if(current.id==='toy-release'){this.release(false,this.riding?'riding':null);return;}
    if(current.npc){
      const n=current.npc;
      if(this.held?.to===n.index){const item=this.held;this.held=null;item.mesh.visible=false;const s=this.progress();if(!s.parcels.includes(item.number)){s.parcels.push(item.number);g.saveProgress();}this.react(n,Meadow.Sandbox.lines[1][1],true);g.audio.chime();this.ui();return;}
      this.react(n,Meadow.Sandbox.lines[n.index][0],true);
      if(n.index===0){
        const ball=p.ball,dx=g.player.mesh.position.x-n.mesh.position.x,dz=g.player.mesh.position.z-n.mesh.position.z,len=Math.hypot(dx,dz)||1,x=n.mesh.position.x+dx/len,z=n.mesh.position.z+dz/len;
        if(w.canWalk(x,z)){ball.position.set(x,0,z);ball.resetIn=0;ball.vx=dx/len*3.5;ball.vz=dz/len*3.5;n.kick=.45;}
      }
      return;
    }
    const item=current.item;if(!item||item.cooldown>0)return;item.cooldown=['parcel','scooter','bench'].includes(item.kind)?0:.35;
    const pos=g.player.mesh.position,dx=item.position.x-pos.x,dz=item.position.z-pos.z,len=Math.hypot(dx,dz)||1;
    if(item.kind==='ball'||item.kind==='crate'){item.vx=dx/len*(item.kind==='ball'?8:3);item.vz=dz/len*(item.kind==='ball'?8:3);this.burst(item.position);g.audio.note(180,.1,.025);}
    else if(item.kind==='scooter'){this.riding=item;g.player.riding=true;g.player.vx=g.player.vz=0;this.react(w.locals[1],'♫');g.audio.note(880,.15,.02);}
    else if(item.kind==='parcel'){this.held=item;g.toast('✉ → '+w.locals[item.to].name,1500);this.react(w.locals[item.to],'✉');}
    else if(item.kind==='planter'){
      this.waterTime=1.2;this.burst(item.position,0x8ac3d6);item.bloomed=true;item.flowers.scale.setScalar(1);
      const s=this.progress();if(!s.flowers.includes(item.number)){s.flowers.push(item.number);g.saveProgress();}
      this.react(w.locals[2],Meadow.Sandbox.lines[2][1],true);
    }else if(item.kind==='chime'||item.kind==='pinwheel'||item.kind==='drum'){
      item.age=2.5;this.burst(item.position);g.audio.note([523,659,784][Math.floor(this.clock)%3],.6,.03);
      for(const n of [...w.locals,...w.residents])if(n.mesh.position.distanceTo(item.position)<8)this.react(n,'♫');
    }else if(item.kind==='bench'){
      this.seatStart={x:pos.x,z:pos.z};this.seated=item;g.player.setPosition(item.position.x,item.position.z+.65);g.player.mesh.rotation.y=0;this.burst(item.position);g.input.reset();
    }
    this.ui();
  }
  clearAt(item,x,z){
    const w=this.game.world,r=Math.max(0,item.radius-CONFIG.PLAYER_RADIUS);
    return [0,1,2,3,4,5,6,7].every(i=>w.canWalk(x+Math.sin(i*Math.PI/4)*r,z+Math.cos(i*Math.PI/4)*r,item.collider));
  }
  move(item,dx,dz){
    const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.12));let hit=false;
    for(let i=0;i<steps;i++){
      const p=item.position;
      if(this.clearAt(item,p.x+dx/steps,p.z))p.x+=dx/steps;else{item.vx*=-.35;dx=0;hit=true;}
      if(this.clearAt(item,p.x,p.z+dz/steps))p.z+=dz/steps;else{item.vz*=-.35;dz=0;hit=true;}
    }
    if(item.collider){item.collider.x=item.position.x;item.collider.z=item.position.z;}return hit;
  }
  beforeMove(dt){
    const g=this.game;g.player.riding=!!this.riding;g.player.speedMultiplier=this.riding?1.85:1;
    if(g.state.mode!=='playing')return;
    const move=g.input.movement(),p=g.player.mesh.position;if(this.seated&&(move.x||move.z))this.release();
    if(!move.x&&!move.z)return;
    for(const n of [...g.world.locals,...g.world.residents]){
      if(Meadow.Routines.yield(g.world,n,g.player,move,this.riding?4.2:3)&&this.clock>=(n.dodgeAt||0)){n.dodgeAt=this.clock+2;this.react(n,'！');}
    }
    for(const item of g.world.playground.items)if(['ball','crate'].includes(item.kind)&&!item.resetIn){
      const dx=item.position.x-p.x,dz=item.position.z-p.z,d=Math.hypot(dx,dz);
      if(d<item.radius+.75&&d>.05&&(dx*move.x+dz*move.z)/d>.45){item.vx=move.x*(item.kind==='ball'?4:2.4);item.vz=move.z*(item.kind==='ball'?4:2.4);this.move(item,move.x*dt*2.4,move.z*dt*2.4);}
    }
  }
  update(dt){
    const g=this.game,w=g.world,p=w.playground,playing=g.state.mode==='playing';this.ui();this.can.visible=playing&&this.waterTime>0;
    if(!playing){
      if(this.held)this.held.mesh.visible=false;
      if(!['paused','dialogue'].includes(g.state.mode)&&(this.riding||this.seated))this.release(false,'riding');
      return;
    }
    if(this.held)this.held.mesh.visible=true;
    this.clock+=dt;this.waterTime=Math.max(0,(this.waterTime||0)-dt);
    for(const item of p.items){
      item.cooldown=Math.max(0,item.cooldown-dt);item.age=Math.max(0,item.age-dt);
      if(item.resetIn>0){item.resetIn-=dt;if(item.resetIn<=0){item.position.set(item.home.x,0,item.home.z);item.vx=item.vz=0;}continue;}
      if(item.kind==='ball'||item.kind==='crate'){
        this.move(item,item.vx*dt,item.vz*dt);const drag=Math.exp(-dt*(item.kind==='ball'?1.2:5));item.vx*=drag;item.vz*=drag;
        if(item.roll&&!g.reducedMotion){item.roll.rotation.x+=item.vz*dt*2.5;item.roll.rotation.z-=item.vx*dt*2.5;}
        if(item.kind==='ball'&&Math.abs(item.position.x-p.goal.x)<1.25&&Math.abs(item.position.z-p.goal.z)<.45&&Math.hypot(item.vx,item.vz)>.4){
          const s=this.progress();s.goals=Math.min(99,s.goals+1);p.goals=s.goals;g.saveProgress();item.resetIn=1.3;item.vx=item.vz=0;this.react(w.locals[0],Meadow.Sandbox.lines[0][1],true);g.toast('⚽ '+s.goals,1300);
        }
      }
      if(item.kind==='chime')item.bells.rotation.z=g.reducedMotion?0:Math.sin(this.clock*12)*Math.min(.2,item.age*.15);
      if(item.kind==='pinwheel'&&!g.reducedMotion)item.spin.rotation.z+=dt*(.5+item.age*7);
      if(item.kind==='drum')item.mesh.scale.y=g.reducedMotion?1:1+Math.sin(this.clock*20)*Math.min(.06,item.age*.03);
    }
    const pos=g.player.mesh.position,angle=g.player.mesh.rotation.y;
    if(this.held){this.held.position.set(pos.x+Math.sin(angle)*.6,1.0,pos.z+Math.cos(angle)*.6);this.held.mesh.rotation.y=angle;g.player.arms.forEach(a=>a.rotation.x=-1.2);}
    if(this.riding){this.riding.position.set(pos.x,.01,pos.z);this.riding.mesh.rotation.y=angle;g.player.mesh.position.y=.14;g.player.arms.forEach(a=>a.rotation.x=-.8);}
    if(this.seated){g.player.mesh.position.y=-.15;g.player.legs.forEach(a=>a.rotation.x=-1.4);}
    if(this.can.visible){this.can.rotation.z=-.5;g.player.arms[1].rotation.x=-1.2;}
    for(const n of [...w.locals,...w.residents]){
      const d=n.mesh.position.distanceTo(pos),local=n.id.startsWith('local-');
      if(local&&d<4&&this.clock>(n.greetAt||0)&&!n.reaction){n.greetAt=this.clock+18;this.react(n,this.held?.to===n.index?'✉':'♡');}
      n.label.enabled=!!n.reaction&&d<7||local&&d<3||!local&&n.label.enabled;
      const bubble=n.label.el.querySelector('.label-bubble'),text=n.reaction?n.reactionText:n.name;if(bubble.textContent!==text)bubble.textContent=text;
    }
    for(const fx of p.effects){if(fx.life<=0)continue;fx.life-=dt;fx.mesh.visible=fx.life>0;fx.mesh.position.x+=fx.vx*dt;fx.mesh.position.z+=fx.vz*dt;fx.mesh.position.y+=fx.vy*dt;fx.vy-=dt*4;fx.mesh.scale.setScalar(Math.max(.02,fx.life*.13));}
  }
};
