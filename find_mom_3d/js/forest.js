'use strict';
Meadow.Forest = class extends Meadow.World {
  constructor(scene) {
    super(scene,true);
    const A=Meadow.Art;
    this.bridgeOpen=0;this.bridgeTarget=0;this.gateOpen=0;this.mistAmount=0;this.cutscene=false;
    this.hug=false;this.bellPulses={};this.bells=new Map();
    const ground=new THREE.Mesh(new THREE.CylinderGeometry(20,19.4,1.7,64),A.material(0x729783));
    ground.scale.set(.91,1,1);ground.position.set(0,-.91,-1);ground.receiveShadow=true;this.root.add(ground);
    A.part(this.root,'box',0x9cafad,[0,-2.04,0],[300,.1,300],false);
    this.path([[0,13],[0,10],[-1,6],[0,3],[0,0],[2,-3],[2,-5.6]],2.05);
    this.path([[-1,5],[-5,4],[-6,1]],1.45);
    this.path([[0,3],[5,3],[6,1]],1.45);
    this.path([[3,-3],[7,-2.6],[10,-3],[13,-3]],1.5);
    this.path([[2,-10.5],[2,-12.5],[6,-13]],1.5);
    this.buildRiver();this.buildGate();this.buildShelter();this.buildBells();
    [[-14,7,1.15],[-12,1,1.1],[-14,-5,1.2],[-9,-12,1.3],[-5,-15,1.1],[10,-12,1.2],[14,-5,1.05],[13,3,1.2],[10,10,1.1],[-7,12,.85],[-9,6,.85],[8,6,.8],[-4,-2,.75]].forEach(([x,z,s],i)=>this.tree(x,z,s,i));
    for(let i=0;i<24;i++){
      const x=(this.random()-.5)*30,z=(this.random()-.5)*30;
      if((z<-5.3&&z>-10.8)||this.nearPath(x,z,1)||Math.hypot(x,z)<3)continue;
      this.mushrooms(x,z,.6+this.random()*.5,i);
    }
    this.buildParticles();
    this.particles.material.color.set(0xd5f9b6);this.particles.material.size=.11;
    this.butterflies.forEach(b=>b.mesh.visible=false);
    // Low polygon ferns frame the paths without obscuring the player.
    for(let i=0;i<90;i++){
      const x=(this.random()-.5)*30,z=(this.random()-.5)*29;
      if((z<-5&&z>-11)||this.nearPath(x,z,.4))continue;
      const fern=A.group(this.root,x,z);
      for(let j=0;j<3;j++){const leaf=A.part(fern,'ball',0x8ab091,[(j-1)*.18,.18,0],[.12,.34,.075],false);leaf.rotation.z=(j-1)*-.55;}
    }
    this.owl=new Meadow.Owl(scene);this.owlLabel=this.label(this.owl.mesh,'咕咕 · 森林守信人',3.05);
    this.mother=new Meadow.Mother(scene);this.motherLabel=this.label(this.mother.mesh,'媽媽就在那裡',3.1);
    this.exit=A.group(this.root,12,-3);A.part(this.exit,'cylinder',0x867753,[0,.9,0],[.09,1.8,.09]);
    A.part(this.exit,'box',0xd2c49a,[0,1.6,0],[1.7,.45,.13]);
    const arrow=A.part(this.exit,'cone',0xd2c49a,[1,1.6,0],[.35,.65,.09]);arrow.rotation.z=-Math.PI/2;
    this.exitLabel=this.label(this.exit,'月光河谷步道 →',2.25);
    this.mist=new THREE.Group();this.root.add(this.mist);this.mistMaterials=[];
    for(let i=0;i<6;i++){
      const material=new THREE.MeshBasicMaterial({color:0xe5eee6,transparent:true,opacity:0,depthWrite:false});
      const cloud=new THREE.Mesh(A.geometries.ball,material);cloud.scale.set(4.5,.35,1.3);cloud.position.set(-13+i*5,.75+(i%2)*.3,-8+(i%2)*.7);this.mist.add(cloud);this.mistMaterials.push(material);
    }
    this.hintRing=new THREE.Mesh(new THREE.RingGeometry(.7,.82,40),new THREE.MeshBasicMaterial({color:0xe2eebb,transparent:true,opacity:.8,side:THREE.DoubleSide,depthWrite:false}));
    this.hintRing.rotation.x=-Math.PI/2;this.hintRing.position.y=.12;this.root.add(this.hintRing);
    this.guideDots=A.group(this.root);this.guideMeshes=Array.from({length:12},()=>A.part(this.guideDots,'ball',0xe8e2ad,[0,.15,0],[.08,.08,.08],false));
    this.setTarget(this.owl.mesh.position);
  }
  tree(x,z,scale,index) {
    const A=Meadow.Art,g=A.group(this.root,x,z);g.scale.setScalar(scale);
    A.part(g,'cylinder',0x627464,[0,1.5,0],[.28,3,.33]);
    for(let i=0;i<3;i++){
      const canopy=A.part(g,'cone',[0x547a66,0x658b70,0x77977a][(index+i)%3],[0,2.6+i*1.2,0],[1.65-i*.34,2.3-i*.15,1.55-i*.32]);canopy.rotation.y=i;
    }
    A.disk(g,0x6a8d74,0,0,1.2,.9);
    this.colliders.push({type:'circle',x,z,r:.43*scale});
    return g;
  }
  mushrooms(x,z,scale,index) {
    const A=Meadow.Art,g=A.group(this.root,x,z);g.scale.setScalar(scale);
    for(let i=0;i<3;i++){
      A.part(g,'cylinder',0xd4ddd0,[i*.35,.26,i*.2],[.07,.52,.07]);
      A.part(g,'ball',index%2?0x99b5c4:0xbfa9c4,[i*.35,.52,i*.2],[.29,.16,.27]);
      for(let j=0;j<3;j++)A.part(g,'ball',0xe6edc7,[i*.35+Math.cos(j*2)*.15,.64,i*.2+Math.sin(j*2)*.13],[.04,.025,.04],false);
    }
  }
  buildRiver() {
    const A=Meadow.Art;
    A.part(this.root,'box',0x648e93,[0,.025,-8],[34,.06,4.6],false);
    for(let i=0;i<26;i++){
      const x=-16+i*1.28;
      if(Math.abs(x-2)<1.6)continue;
      [-1,1].forEach(s=>A.part(this.root,'pebble',0x9eafa0,[x,.12,-8+s*2.37],[.58,.25,.4]));
    }
    this.waterStreaks=[];
    for(let i=0;i<15;i++)this.waterStreaks.push(A.part(this.root,'box',0x9dbdb7,[-15+i*2,.071,-7.2+(i%3)*-.75],[.9,.008,.03],false));
    this.bridgeLeaves=[];
    [-1,1].forEach(s=>{
      const hinge=A.group(this.root,2,-8+s*2.3);hinge.position.y=.13;
      for(let i=0;i<7;i++)A.part(hinge,'box',i%2?0xc0af82:0xae9b70,[0,0,-s*(.16+i*.33)],[2,.13,.30]);
      [-1,1].forEach(side=>{
        A.part(hinge,'box',0x8f8d66,[side*.91,.44,-s*1.14],[.075,.07,2.25]);
        for(let i=0;i<3;i++)A.part(hinge,'box',0xa89970,[side*.91,.23,-s*(.1+i*1.0)],[.08,.55,.08]);
      });
      hinge.rotation.x=s*1.42;this.bridgeLeaves.push({mesh:hinge,side:s});
    });
    for(const z of [-5.5,-10.5])for(const x of [.7,3.3]){
      A.part(this.root,'cylinder',0x8a8460,[x,.84,z],[.13,1.68,.13]);
      A.part(this.root,'ball',0xf0dba1,[x,1.78,z],[.19,.22,.19]);
    }
  }
  buildGate() {
    const A=Meadow.Art;this.vines=[];
    for(let x=-15;x<=15;x+=1.2)if(x<0||x>4)this.bush(x,-2.75,.8);
    [-1,1].forEach(s=>{
      const gate=A.group(this.root,2+s*1.8,-2.5);
      A.part(gate,'cylinder',0x6c875c,[0,1.25,0],[.16,2.5,.18]);
      for(let i=0;i<4;i++){
        const branch=A.part(gate,'cylinder',0x7a9361,[-s*.7,.55+i*.47,0],[.07,1.65,.07]);branch.rotation.z=s*1.1;
        A.part(gate,'ball',0x93ad71,[-s*1.15,.68+i*.47,.05],[.24,.14,.11]);
      }
      this.vines.push({mesh:gate,side:s});
    });
  }
  buildShelter() {
    const A=Meadow.Art,g=A.group(this.root,6,-13.5);
    A.part(g,'box',0xb5b28d,[0,.08,0],[4,.16,3]);
    [-1,1].forEach(s=>[-1,1].forEach(t=>A.part(g,'cylinder',0x8a8668,[s*1.6,1.4,t*1.1],[.12,2.8,.12])));
    const roof=A.part(g,'cone',0x779386,[0,3,0],[2.7,1.1,2.15]);roof.rotation.y=Math.PI/4;
    A.part(g,'box',0xaeb493,[0,.55,0],[2.2,.14,.6]);
    A.part(g,'box',0xaeb493,[0,.85,-.25],[2.2,.45,.09]);
    A.part(g,'ball',0xf3dc9c,[0,2.2,.2],[.20,.3,.20]);
  }
  buildBells() {
    const A=Meadow.Art;
    for(const config of CONFIG.BELLS){
      const g=A.group(this.root,config.x,config.z);
      A.disk(g,0x98ab86,0,0,1.25,1.05,.035);
      [-1,1].forEach(s=>A.part(g,'cylinder',0x8a8966,[s*.8,1.3,0],[.1,2.6,.1]));
      A.part(g,'box',0xa8aa7c,[0,2.63,0],[2.0,.17,.19]);
      A.part(g,'cylinder',0x9c8a51,[0,2.25,0],[.035,.6,.035]);
      const hanging=A.group(g);hanging.position.y=1.9;
      const bell=new THREE.Mesh(new THREE.CylinderGeometry(.24,.48,.65,18),new THREE.MeshStandardMaterial({color:new THREE.Color(config.color).convertSRGBToLinear(),roughness:.45,metalness:.15,emissive:0xffe8a1,emissiveIntensity:0}));bell.castShadow=true;bell.position.y=-.25;hanging.add(bell);
      A.part(hanging,'cylinder',config.color,[0,-.58,0],[.5,.1,.5]);A.part(hanging,'ball',0xd6bd75,[0,-.70,0],[.12,.14,.12]);
      this.bells.set(config.id,{mesh:g,hanging,bell,label:this.label(g,`${config.symbol} ${config.name}`,3.25)});
      this.colliders.push({type:'circle',x:config.x-.8,z:config.z,r:.18},{type:'circle',x:config.x+.8,z:config.z,r:.18});
    }
    this.stand=A.group(this.root,0,3.0);A.part(this.stand,'cylinder',0x9b9470,[0,.53,0],[.13,1.06,.13]);
    const board=A.part(this.stand,'box',0xd9d4b0,[0,1.08,0],[1.1,.12,.65]);board.rotation.x=.2;
    A.part(this.stand,'box',0x8b9771,[0,1.14,0],[.74,.025,.45]);
    this.standLabel=this.label(this.stand,'風鈴合奏台',1.9);
  }
  ringBell(id) { this.bellPulses[id]=1; }
  sync(state) {
    const f=state.forest;this.currentState=f;
    this.owlLabel.enabled=true;this.standLabel.enabled=f.metOwl&&f.round<3;
    this.motherLabel.enabled=f.round===3&&!f.reunited;
    this.exitLabel.enabled=f.routeKnown;
    this.bells.forEach(b=>b.label.enabled=f.metOwl&&f.round<3);
    this.gateTarget=f.round/3;
    if(!this.cutscene){
      this.bridgeTarget=0;
      this.mother.mesh.position.set(f.separated?4.4:2,0,f.separated?-12.5:-4.3);
      this.mother.mesh.rotation.y=0;
      this.owl.mesh.position.set(f.separated?4:-2.4,0,f.separated?-3.2:5);
      this.mistAmount=f.separated?.3:0;
    }
  }
  canWalk(x,z) {
    if((x/16.3)**2+((z+1)/17.6)**2>.96||z>13.5||z< -15.5)return false;
    if(z>-10.65&&z< -5.35&&(Math.abs(x-2)>.72||this.bridgeOpen<.98))return false;
    // A low hedge closes the bank approach until the song opens the vine gate.
    if(z< -2.4&&z> -3.1&&(Math.abs(x-2)>1.25||!this.currentState||this.currentState.round<3))return false;
    return !this.colliders.some(c=>Math.hypot(x-c.x,z-c.z)<c.r+CONFIG.PLAYER_RADIUS);
  }
  update(time,dt,player,state,reduced) {
    const f=state.forest;
    this.owl.update(time,player,reduced,f.reunited);this.mother.update(time,this.hug,this.cutscene&&this.mother.mesh.position.z>-12,reduced);
    if(f.routeKnown&&state.mode==='playing'){
      const p=player.mesh.position,pos=this.owl.mesh.position,dx=p.x-1.1-pos.x,dz=p.z+.2-pos.z;
      const distance=Math.hypot(dx,dz),angle=Math.atan2(dx,dz),step=Math.min(distance,dt*4.1);
      if(distance>.15)for(const turn of [0,.65,-.65,1.3,-1.3]){
        const x=pos.x+Math.sin(angle+turn)*step,z=pos.z+Math.cos(angle+turn)*step;
        if(this.canWalk(x,z)){pos.x=x;pos.z=z;break;}
      }
    }
    if(this.hug)player.arms.forEach(arm=>arm.rotation.x=-1.05);
    this.gateOpen+=(this.gateTarget-this.gateOpen)*Math.min(1,dt*3);
    this.vines.forEach(v=>v.mesh.rotation.y=v.side*this.gateOpen*Math.PI*.48);
    this.bridgeOpen+=(this.bridgeTarget-this.bridgeOpen)*Math.min(1,dt*4);
    this.bridgeLeaves.forEach(leaf=>leaf.mesh.rotation.x=leaf.side*(1-this.bridgeOpen)*1.42);
    this.mistMaterials.forEach((material,i)=>{material.opacity=this.mistAmount;this.mist.children[i].position.x=-13+i*5+(reduced?0:Math.sin(time*.22+i)*.5);});
    this.bells.forEach((b,id)=>{
      this.bellPulses[id]=Math.max(0,(this.bellPulses[id]||0)-dt*1.5);
      b.bell.material.emissiveIntensity=this.bellPulses[id]*.8;
      b.hanging.rotation.z=reduced?0:Math.sin(time*12)*this.bellPulses[id]*.22;
    });
    if(!reduced){
      this.waterStreaks.forEach((line,i)=>line.position.x=-15+i*2+Math.sin(time*.5+i)*.5);
      const points=this.particles.geometry.attributes.position;
      this.particleSeeds.forEach((base,i)=>points.array[i*3+1]=base+Math.sin(time*.7+i)*.25);points.needsUpdate=true;
    }
    this.hintRing.visible=!!this.target&&state.mode==='playing';
    this.guideDots.visible=!!this.target&&state.mode==='playing';
    if(this.target){
      const p=player.mesh.position;this.hintRing.position.set(this.target.x,.12,this.target.z);
      if(p.distanceTo(this.target)<2)this.guideDots.visible=false;
      this.guideMeshes.forEach((dot,i)=>{const t=(i+1)/13;dot.position.set(p.x+(this.target.x-p.x)*t,.15,p.z+(this.target.z-p.z)*t);});
    }
  }
};
