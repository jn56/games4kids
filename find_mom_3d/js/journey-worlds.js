'use strict';
Meadow.Beaver = class {
  constructor(scene,x=-3,z=7){
    const A=Meadow.Art;this.mesh=A.group(scene,x,z);this.body=A.group(this.mesh);
    const tail=A.part(this.body,'ball',0x775b49,[0,.19,-.72],[.43,.14,.75]);tail.rotation.y=.2;
    for(let i=0;i<4;i++)A.part(this.body,'box',0x9c8060,[0,.33,-.4-i*.18],[.55,.018,.018],false);
    A.part(this.body,'ball',0x96734f,[0,.76,0],[.55,.67,.4]);
    A.part(this.body,'ball',0x728994,[0,.67,.22],[.48,.44,.27]);
    A.part(this.body,'ball',0xae8860,[0,1.48,.04],[.56,.46,.43]);
    A.part(this.body,'ball',0xd8b38a,[0,1.33,.42],[.36,.23,.17]);
    A.part(this.body,'ball',0x514e43,[0,1.44,.58],[.12,.09,.07]);
    [-1,1].forEach(s=>{
      A.part(this.body,'ball',0xb3936a,[s*.43,1.8,0],[.17,.19,.12]);
      A.part(this.body,'ball',0x384741,[s*.2,1.59,.423],[.04,.05,.02]);
      A.part(this.body,'box',0xffefd3,[s*.085,1.16,.52],[.13,.22,.06]);
      A.part(this.body,'ball',0xae8860,[s*.32,.14,.16],[.24,.15,.31]);
      A.part(this.body,'ball',0xae8860,[s*.52,.8,.13],[.15,.3,.18]);
    });
    A.part(this.body,'ball',0xd4b76b,[0,1.85,.02],[.58,.22,.46]);
    A.part(this.body,'box',0xc2a65f,[0,1.78,.4],[1.15,.07,.43]);
    this.hammer=A.group(this.body,.64,.22);this.hammer.position.y=.6;
    A.part(this.hammer,'cylinder',0xa68a58,[0,.22,0],[.06,.7,.06]);
    A.part(this.hammer,'box',0x818f91,[0,.58,0],[.42,.22,.22]);
  }
  update(time,player,reduced,working=false){
    const p=player.mesh.position;this.mesh.rotation.y=Math.atan2(p.x-this.mesh.position.x,p.z-this.mesh.position.z);
    this.body.position.y=reduced?0:Math.sin(time*1.8)*.025;
    this.hammer.rotation.x=working&&!reduced?Math.sin(time*9)*.6:0;
  }
};
Meadow.Squirrel = class {
  constructor(scene){
    const A=Meadow.Art;this.mesh=A.group(scene,-2,8);this.body=A.group(this.mesh);
    const tail=A.group(this.body,0,-.5);tail.rotation.x=-.25;
    A.part(tail,'ball',0xb07a57,[0,.75,0],[.4,.85,.34]);A.part(tail,'ball',0xbe926c,[0,1.35,.12],[.43,.4,.32]);
    A.part(this.body,'ball',0xb58a65,[0,.68,.07],[.39,.57,.3]);A.part(this.body,'ball',0xe5cba0,[0,.66,.3],[.25,.37,.1]);
    A.part(this.body,'ball',0xb58a65,[0,1.4,.14],[.43,.38,.36]);
    [-1,1].forEach(s=>{
      A.part(this.body,'cone',0xa97655,[s*.27,1.84,.02],[.17,.44,.13]);
      A.part(this.body,'ball',0x403d43,[s*.15,1.46,.46],[.035,.05,.025]);
      A.part(this.body,'ball',0xc39166,[s*.23,.14,.2],[.18,.15,.26]);
      A.part(this.body,'ball',0xc39166,[s*.36,.75,.23],[.1,.28,.13]);
    });
    A.part(this.body,'ball',0x5b4d47,[0,1.32,.53],[.07,.055,.06]);
    A.part(this.body,'cylinder',0x9d93bc,[0,1.1,.1],[.33,.12,.3]);
    A.part(this.body,'box',0x9d93bc,[-.17,.86,.36],[.15,.45,.05]);
    A.part(this.body,'ball',0xebce82,[-.17,.86,.40],[.07,.08,.025]);
  }
  update(time,player,reduced){const p=player.mesh.position;this.mesh.rotation.y=Math.atan2(p.x-this.mesh.position.x,p.z-this.mesh.position.z);this.body.position.y=reduced?0:Math.sin(time*2)*.03;}
};

Meadow.JourneyWorld = class extends Meadow.World {
  constructor(scene){super(scene,true);this.cutscene=false;this.hug=false;}
  ground(color,backdrop){const A=Meadow.Art;const base=A.part(this.root,'cylinder',color,[0,-.85,-1],[18.2,1.6,20]);base.receiveShadow=true;A.part(this.root,'box',backdrop,[0,-1.72,0],[300,.1,300],false);}
  tree(x,z,color=0x648584){
    const A=Meadow.Art,g=A.group(this.root,x,z);A.part(g,'cylinder',0x777b72,[0,1.4,0],[.23,2.8,.28]);
    for(let i=0;i<3;i++)A.part(g,'ball',color,[(i-1)*.55,2.4+(i%2)*.7,0],[1.1,1.3,.95]);
    this.colliders.push({x,z,r:.3});return g;
  }
  lantern(x,z,color=0xffd895){
    const A=Meadow.Art,g=A.group(this.root,x,z);A.part(g,'cylinder',0x8d8974,[0,.9,0],[.07,1.8,.07]);
    const glass=new THREE.Mesh(A.geometries.ball,new THREE.MeshBasicMaterial({color}));glass.scale.set(.18,.27,.18);glass.position.y=1.83;g.add(glass);
    A.part(g,'cone',0x837b6f,[0,2.11,0],[.3,.22,.3]);return g;
  }
  guide(){
    const A=Meadow.Art;this.hintRing=new THREE.Mesh(new THREE.RingGeometry(.72,.84,36),new THREE.MeshBasicMaterial({color:0xf6d98c,side:THREE.DoubleSide}));
    this.hintRing.rotation.x=-Math.PI/2;this.root.add(this.hintRing);this.guideDots=A.group(this.root);
    this.guideMeshes=Array.from({length:12},()=>A.part(this.guideDots,'ball',0xf6dca4,[0,.12,0],[.065,.065,.065],false));
    this.buildParticles();this.butterflies.forEach(b=>b.mesh.visible=false);
  }
  guides(time,player,state,reduced){
    this.hintRing.visible=this.guideDots.visible=!!this.target&&state.mode==='playing';
    if(this.target){
      const p=player.mesh.position;this.hintRing.position.set(this.target.x,.13,this.target.z);
      if(p.distanceTo(this.target)<2)this.guideDots.visible=false;
      this.guideMeshes.forEach((dot,i)=>{const t=(i+1)/13;dot.position.set(p.x+(this.target.x-p.x)*t,.13,p.z+(this.target.z-p.z)*t);});
    }
    if(!reduced){const a=this.particles.geometry.attributes.position;this.particleSeeds.forEach((base,i)=>a.array[i*3+1]=base+Math.sin(time*.6+i)*.2);a.needsUpdate=true;}
  }
  bounds(x,z){return (x/CONFIG.MAP_RADIUS_X)**2+((z+1)/CONFIG.MAP_RADIUS_Z)**2<.96&&!this.colliders.some(c=>Math.hypot(x-c.x,z-c.z)<c.r+CONFIG.PLAYER_RADIUS);}
};

Meadow.Valley = class extends Meadow.JourneyWorld {
  constructor(scene){
    super(scene);const A=Meadow.Art;this.ground(0x758b93,0x839fa9);
    A.part(this.root,'box',0x528eaa,[0,-.005,-4.2],[34,.05,14.4],false);
    A.part(this.root,'cylinder',0xa5b8a5,[0,.0,-4],[3.15,.08,3.2]);
    this.path([[0,13],[0,9],[-2,7],[0,4]],2.1);this.path([[0,-12],[0,-15]],1.8);
    this.path([[-2,7],[-6,6]],1.3);
    for(const z of [3.1,-11.5])for(let x=-14;x<=14;x+=1.3)A.part(this.root,'pebble',0xb1b9ab,[x,.13,z],[.55,.25,.38]);
    for(const [x,z] of [[-12,8],[-9,4],[11,5],[13,10],[-11,-12],[10,-13],[-7,12]])this.tree(x,z);
    this.waterLines=Array.from({length:36},(_,i)=>A.part(this.root,'box',0x9fced2,[(i%9)*3.4-14,.04,-10+Math.floor(i/9)*3],[1.1,.01,.04],false));
    this.bridge=[];
    for(let section=0;section<3;section++){
      const span=A.group(this.root,0,2.1-section*2.1);
      for(let j=0;j<7;j++)A.part(span,'box',j%2?0xc8b48d:0xb4a07b,[0,.13,.88-j*.3],[2.3,.15,.27]);
      for(const s of [-1,1]){
        A.part(span,'box',0x9a8c71,[s*1.04,.72,0],[.08,.09,2.05]);
        for(const z of [-.8,.8])A.part(span,'cylinder',0x9a8c71,[s*1.04,.41,z],[.065,.8,.065]);
      }
      span.visible=false;this.bridge.push(span);
    }
    this.workbench=A.group(this.root,0,4.3);this.bench=this.workbench;A.part(this.workbench,'box',0xaf9770,[1.7,.6,0],[1.2,.14,.8]);
    A.part(this.workbench,'box',0x8a8470,[1.7,.28,0],[.2,.55,.65]);
    this.benchLabel=this.label(this.workbench,'木木的修橋台',2.0);
    this.beaver=new Meadow.Beaver(scene);this.beaverLabel=this.label(this.beaver.mesh,'木木 · 橋樑工匠',2.65);
    this.dock=A.group(this.root,0,-5.6);
    for(let i=0;i<5;i++)A.part(this.dock,'box',0xad9873,[(i-2)*.4,.12,0],[.37,.14,1.9]);
    this.dockLabel=this.label(this.dock,'木筏碼頭',2.0);
    this.raft=A.group(this.root,.2,-7.1);
    for(let i=0;i<5;i++){const log=A.part(this.raft,'cylinder',0xb29971,[(i-2)*.36,.04,0],[.2,2.1,.2]);log.rotation.x=Math.PI/2;}
    for(const x of [-.6,.6])A.part(this.raft,'box',0x8b8062,[x,.24,0],[.1,.08,1.9]);
    this.exit=A.group(this.root,0,-14.2);A.part(this.exit,'cylinder',0x8e8774,[0,1.05,0],[.09,2.1,.09]);A.part(this.exit,'box',0xd8d0af,[0,1.9,0],[1.8,.45,.1]);
    this.exitLabel=this.label(this.exit,'星光山丘 ↑',2.6);
    for(const [x,z] of [[-2.3,4],[2.3,-3],[-2,-12],[2,-14]])this.lantern(x,z);
    // A small riverside workshop gives 木木 a home, not just a quest marker.
    const hut=A.group(this.root,-7,7);A.part(hut,'box',0x9a947e,[0,1.1,0],[2.7,2.2,2.3]);
    const roof=A.part(hut,'cone',0x6d8588,[0,2.6,0],[2.3,1.2,2]);roof.rotation.y=Math.PI/4;
    A.part(hut,'box',0xd4bd77,[0,1.15,1.16],[.75,.9,.035]);this.colliders.push({x:-7,z:7,r:1.6});
    this.guide();
  }
  sync(state){
    this.current=state.valley;const v=this.current;
    this.bridge.forEach((span,i)=>{if(v.bridge>i&&!span.visible)span.position.y=1.5;span.visible=v.bridge>i;});
    this.beaverLabel.enabled=true;this.benchLabel.enabled=v.metBeaver&&v.bridge<3;this.dockLabel.enabled=v.bridge===3&&v.raft<4;this.exitLabel.enabled=v.raft===4;
    this.beaver.mesh.position.set(v.raft===4?-2:-3,0,v.raft===4?-12:7);this.raft.visible=v.raft<4;
  }
  canWalk(x,z){
    if(!this.bounds(x,z))return false;
    if(z>3.2||z<-11.4)return true;
    if(Math.hypot(x,z+4)<2.95)return true;
    return this.current?.bridge===3&&Math.abs(x)<.86&&z>=-4&&z<=3.3;
  }
  update(time,dt,player,state,reduced){
    this.beaver.update(time,player,reduced,state.mode==='journey');
    this.bridge.forEach(span=>span.position.y*=Math.max(0,1-dt*5));
    if(!reduced){this.waterLines.forEach((l,i)=>l.position.x=(i%9)*3.4-14+Math.sin(time*.7+i)*.55);this.raft.position.y=Math.sin(time*2)*.05;}
    this.guides(time,player,state,reduced);
  }
};

Meadow.BEACONS=[{id:'hope',name:'希望之光',x:-7,z:3,color:0xf1c978},{id:'memory',name:'記憶之光',x:6,z:-1,color:0x94d8db},{id:'courage',name:'勇氣之光',x:-3,z:-7,color:0xc4a5e8}];
Meadow.Hill = class extends Meadow.JourneyWorld {
  constructor(scene){
    super(scene);const A=Meadow.Art;this.ground(0x777795,0x777c9b);
    this.path([[0,13],[0,9],[-2,7],[-7,3],[-3,1],[6,-1],[3,-4],[-3,-7],[0,-9]],1.8);
    this.path([[0,-9],[3,-5],[3,2],[7,8]],1.65);
    for(const [x,z] of [[-12,8],[-12,-3],[-10,-11],[10,-9],[13,1],[12,9]])this.tree(x,z,0x737e9e);
    for(let i=0;i<48;i++){
      const x=(this.random()-.5)*30,z=(this.random()-.5)*29;
      if(this.nearPath(x,z,.6))continue;
      const tuft=A.group(this.root,x,z);for(let j=0;j<3;j++)A.part(tuft,'ball',i%2?0xa5a2ba:0xb1adbd,[(j-1)*.16,.15,0],[.09,.3,.05],false);
    }
    this.beacons=Meadow.BEACONS.map(b=>{
      const mesh=A.group(this.root,b.x,b.z);A.disk(mesh,0x9698ad,0,0,1.35,1.15,.04);
      A.part(mesh,'cylinder',0xa6a1a7,[0,.95,0],[.2,1.9,.25]);
      const orb=new THREE.Mesh(A.geometries.ball,new THREE.MeshStandardMaterial({color:b.color,emissive:b.color,emissiveIntensity:0,roughness:.5}));orb.scale.set(.42,.55,.42);orb.position.y=2;mesh.add(orb);
      A.part(mesh,'cone',0xc2b993,[0,2.6,0],[.62,.35,.62]);
      const beam=new THREE.Mesh(new THREE.CylinderGeometry(.1,.5,6,16),new THREE.MeshBasicMaterial({color:b.color,transparent:true,opacity:.13,depthWrite:false}));beam.position.y=5;mesh.add(beam);
      this.colliders.push({x:b.x,z:b.z,r:.3});return {...b,mesh,orb,beam,label:this.label(mesh,b.name,3.1)};
    });
    this.squirrel=new Meadow.Squirrel(scene);this.squirrelLabel=this.label(this.squirrel.mesh,'星星 · 觀星員',2.6);
    this.signal=A.group(this.root,0,-9);A.disk(this.signal,0xb7a6ac,0,0,1.4,1.1,.04);
    A.part(this.signal,'cylinder',0xaaa3b0,[0,.75,0],[.42,1.5,.55]);
    this.signalOrb=new THREE.Mesh(A.geometries.ball,new THREE.MeshBasicMaterial({color:0xffe1a0}));this.signalOrb.position.y=1.7;this.signalOrb.scale.set(.5,.5,.5);this.signal.add(this.signalOrb);
    this.signalLabel=this.label(this.signal,'點亮陪伴之光',2.7);
    this.gates=[];
    for(const x of [-1,1]){const gate=A.group(this.root,x*1.5,-10.8);A.part(gate,'cylinder',0x9a8a99,[0,1,0],[.13,2,.13]);A.part(gate,'box',0x9f95b0,[-x*.65,1.1,0],[1.4,.09,.09]);this.gates.push({mesh:gate,side:x});}
    for(let x=-13;x<=13;x+=1.4)if(Math.abs(x)>2)A.part(this.root,'ball',0x85839f,[x,.37,-10.8],[.78,.56,.56]);
    this.mother=new Meadow.Mother(scene);this.mother.mesh.position.set(4,0,-13);
    this.motherLabel=this.label(this.mother.mesh,'媽媽',3.0);
    this.villain=new Meadow.Grayclaw(scene);
    this.safetyGate=A.group(this.root,0,-10.8);
    for(const y of [.55,1.25])A.part(this.safetyGate,'box',0x9a8270,[0,y,0],[4.6,.22,.25]);
    for(const x of [-2,-1,0,1,2])A.part(this.safetyGate,'box',0x9a8270,[x,.9,0],[.18,1.7,.2]);
    this.safetyGate.visible=false;
    const house=A.group(this.root,7,5.8);A.part(house,'box',0xc1b7b0,[0,1.4,0],[3.5,2.8,2.8]);
    const roof=A.part(house,'cone',0x85839b,[0,3.25,0],[2.9,1.5,2.5]);roof.rotation.y=Math.PI/4;
    A.part(house,'box',0x8d7c75,[0,.9,1.42],[1.8,1.8,.07]);
    for(const x of [-1.12,1.12])A.part(house,'box',0xf0d8a0,[x,1.65,1.43],[.6,.8,.05]);
    this.colliders.push({x:7,z:5.8,r:1.8});this.home=A.group(this.root,7,7.5);this.homeLabel=this.label(this.home,'和媽媽一起回家',2.0);
    this.lantern(5.2,8);this.lantern(8.8,8);
    const moon=new THREE.Mesh(A.geometries.ball,new THREE.MeshBasicMaterial({color:0xf8e8bd}));moon.scale.set(1.6,1.6,.4);moon.position.set(-8,7,-14);this.root.add(moon);
    const stars=new Float32Array(75*3);for(let i=0;i<75;i++){stars[i*3]=(this.random()-.5)*34;stars[i*3+1]=5+this.random()*7;stars[i*3+2]=-7-this.random()*14;}
    this.root.add(new THREE.Points(new THREE.BufferGeometry().setAttribute('position',new THREE.BufferAttribute(stars,3)),new THREE.PointsMaterial({color:0xffedc4,size:.095,depthWrite:false})));
    this.friends=A.group(scene);this.rabbit=new Meadow.Rabbit(this.friends);this.hedgehog=new Meadow.Hedgehog(this.friends);this.owl=new Meadow.Owl(this.friends);this.beaver=new Meadow.Beaver(this.friends);
    this.rabbit.mesh.position.set(-3,0,-6);this.hedgehog.mesh.position.set(2.8,0,-6);this.owl.mesh.position.set(-4.2,0,-7.8);this.beaver.mesh.position.set(4.2,0,-7.8);
    this.guide();this.particles.material.size=.10;
  }
  sync(state){
    const h=state.hill;this.current=h;
    this.beacons.forEach(b=>{const lit=h.lights.includes(b.id);b.orb.material.emissiveIntensity=lit?.9:0;b.beam.visible=lit;b.label.enabled=h.metSquirrel&&!lit;});
    this.squirrelLabel.enabled=true;this.signalLabel.enabled=h.lights.length===3&&!h.reunited;
    this.signalOrb.visible=h.lights.length===3;this.motherLabel.enabled=h.reunited;this.homeLabel.enabled=h.reunited;
    this.friends.visible=h.signal;this.gates.forEach(g=>g.mesh.rotation.y=h.signal?g.side*1.4:0);
    if(!this.cutscene){this.protecting=false;this.villain.mesh.visible=false;this.safetyGate.visible=h.reunited;this.safetyGate.position.y=0;this.mother.mesh.rotation.z=0;if(!h.reunited)this.mother.mesh.position.set(4,0,-13);}
  }
  canWalk(x,z){return this.bounds(x,z)&&z>=-10.3;}
  update(time,dt,player,state,reduced){
    const h=state.hill;this.squirrel.update(time,player,reduced);
    let walking=this.cutscene&&!this.hug;
    if(h.reunited&&!this.cutscene&&state.mode==='playing'){
      const p=player.mesh.position,m=this.mother.mesh.position,dx=p.x+1.1-m.x,dz=p.z+.4-m.z,d=Math.hypot(dx,dz);walking=d>.15;
      if(walking){const a=Math.atan2(dx,dz),step=Math.min(d,dt*4.3);for(const turn of [0,.6,-.6,1.2,-1.2]){const x=m.x+Math.sin(a+turn)*step,z=m.z+Math.cos(a+turn)*step;if(this.canWalk(x,z)){m.set(x,0,z);break;}}this.mother.mesh.rotation.y=a;}
    }
    this.mother.update(time,this.hug,walking,reduced);if(this.hug)player.arms.forEach(a=>a.rotation.x=-1.05);
    if(this.protecting){this.mother.arms.forEach(a=>a.rotation.x=-.85);player.arms.forEach(a=>a.rotation.x=-1.15);}
    if(this.villain.mesh.visible)this.villain.update(time,reduced,'reach');
    if(this.friends.visible){this.hedgehog.update(time,player,reduced);this.owl.update(time,player,reduced,true);this.beaver.update(time,player,reduced);}
    this.beacons.forEach((b,i)=>{if(!reduced)b.orb.position.y=2+Math.sin(time*1.5+i)*.035;});
    this.guides(time,player,state,reduced);
  }
};
