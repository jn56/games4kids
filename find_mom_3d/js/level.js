'use strict';
Meadow.World = class {
  constructor(scene, empty = false) {
    this.scene = scene; this.colliders = []; this.labels = []; this.flowers = new Map();
    this.random = Meadow.Art.rng(20260919); this.lit = false; this.pathSamples = [];
    const A = Meadow.Art;
    this.root = A.group(scene);
    if (empty) return;
    // A soft-edged, raised garden rather than an endless empty plane.
    const ground = new THREE.Mesh(new THREE.CylinderGeometry(20, 19.3, 1.7, 64), A.material(0xa4af70));
    ground.scale.set(.91, 1, 1); ground.position.set(0, -.91, -1); ground.receiveShadow = true; this.root.add(ground);
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(20.08, 19.85, .22, 64), A.material(0xb5c384));
    rim.scale.set(.91, 1, 1); rim.position.set(0, -.09, -1); rim.receiveShadow = true; this.root.add(rim);
    A.part(this.root, 'box', 0xd7dcc3, [0, -2.05, 0], [300, .1, 300], false);
    this.path([[0, 13], [0, 9], [-.6, 5], [0, 1], [1, -4], [0, -9], [1, -15.5]], 2.1);
    this.path([[0, 2], [-3, 1], [-6, -.4], [-8, 0]], 1.5);
    this.path([[0, -3], [4, -2], [6, -4], [8, -5]], 1.4);
    this.path([[0, -8], [-2, -8], [-5, -10]], 1.4);
    this.path([[0, -3], [-3, -3], [-6.1, -4.2]], 1.25);
    this.path([[2, 6], [5, 7], [10, 8], [10, 5], [10, 1], [8, -5]], 1.1);
    this.buildPond(); this.buildWindmill(); this.buildArch(); this.buildLamp(); this.buildPicnic();
    const trees = [[-12,7,1.25],[-15,1,1.05],[-12,-5,1.3],[-10,-12,1.35],[-6,-15,1.05],[7,-14,1.2],[12,-10,1.05],[15,-4,1.0],[15,6,.9],[12,11,.8],[-9,12,.8]];
    trees.forEach(([x,z,s],i) => this.tree(x,z,s,i % 3));
    this.tree(-6.8,-11.4,1.15,2);
    for (let i = 0; i < 20; i++) {
      const a = i / 20 * Math.PI * 2, x = Math.sin(a) * 17, z = Math.cos(a) * 18 - 1;
      if (z > 10 || (Math.abs(x) < 3 && z < -14)) continue;
      this.bush(x, z, .8 + this.random() * .5);
    }
    this.fence(-13, 10, 5, .35); this.fence(6, -15.5, 5, 0); this.fence(-14, -7, 4, Math.PI / 2);
    for (let i = 0; i < 16; i++) {
      const x = (this.random() - .5) * 29, z = (this.random() - .5) * 29 - 1;
      if (this.nearPath(x, z, 1.8) || this.inPond(x,z)) continue;
      const rock = A.part(this.root, 'pebble', [0xa6ae92,0xb9bca3,0xc3c3a9][i%3], [x, .18, z], [.35 + this.random() * .3, .25, .3]); rock.rotation.y = this.random()*6;
    }
    this.buildFlowerBeds(); this.scatterMeadow(); this.buildBackdrop(); this.buildParticles();
    this.rabbit = new Meadow.Rabbit(scene);
    this.rabbitLabel = this.label(this.rabbit.mesh, '阿蹦 · 花田的朋友', 3.1);
    this.hedgehog = new Meadow.Hedgehog(scene);
    this.hedgehogLabel = this.label(this.hedgehog.mesh, '栗栗 · 風車郵差', 2.65);
    this.buildPostbox();
    this.ribbon = A.group(this.root, 0, 7.5);
    A.part(this.ribbon, 'pebble', 0xc5c2a1, [0, .2, 0], [.67, .24, .47]);
    A.ribbon(this.ribbon, 0, .55, .08, .8);
    this.ribbonLabel = this.label(this.ribbon, '一條熟悉的紅髮帶', 1.45);
    this.hintRing = new THREE.Mesh(new THREE.RingGeometry(.8, .93, 48), new THREE.MeshBasicMaterial({ color: 0xffefb0, transparent:true, opacity:.85, side:THREE.DoubleSide, depthWrite:false }));
    this.hintRing.rotation.x = -Math.PI/2; this.hintRing.position.y = .12; this.root.add(this.hintRing);
    this.guideDots = new THREE.Group(); this.root.add(this.guideDots);
    this.guideMeshes = Array.from({length:12}, () => A.part(this.guideDots, 'ball', 0xffe6a0, [0,.2,0], [.10,.10,.10], false));
    this.setTarget(this.ribbon.position);
  }
  path(points, width) {
    (this.mapRoutes ||= []).push({points,width});
    const curve = new THREE.CatmullRomCurve3(points.map(([x,z]) => new THREE.Vector3(x,.045,z)));
    const positions = [], indices = [], count = 72;
    for (let i=0;i<=count;i++) {
      const t=i/count, p=curve.getPoint(t), tangent=curve.getTangent(t), normal=new THREE.Vector3(-tangent.z,0,tangent.x);
      const w = width * (.5 + Math.sin(t*8)*.035);
      positions.push(p.x+normal.x*w,p.y,p.z+normal.z*w,p.x-normal.x*w,p.y,p.z-normal.z*w);
      this.pathSamples.push({x:p.x,z:p.z,width});
      if(i<count) { const j=i*2; indices.push(j,j+2,j+1,j+1,j+2,j+3); }
    }
    const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3)); geometry.setIndex(indices); geometry.computeVertexNormals();
    const mesh = new THREE.Mesh(geometry,Meadow.Art.material(0xe0cc9e)); mesh.receiveShadow=true; this.root.add(mesh);
  }
  nearPath(x,z,extra=0) { return this.pathSamples.some(p => Math.hypot(p.x-x,p.z-z)<p.width*.5+extra); }
  tree(x,z,scale,type=0) {
    const A=Meadow.Art, g=A.group(this.root,x,z); g.scale.setScalar(scale);
    A.part(g,'cylinder',0x8a7853,[0,1.2,0],[.22,2.4,.25]);
    const branch=A.part(g,'cylinder',0x8a7853,[.4,1.8,0],[.12,1.4,.12]); branch.rotation.z=-.65;
    const colors=[0x809866,0x94a76f,0xb1b876];
    [[0,3.1,0,1.5],[-.8,2.65,.05,1.05],[.9,2.7,.1,1.2],[.2,3.8,-.1,1.0]].forEach(([a,b,c,s],i)=>{
      const foliage=A.part(g,'pebble',colors[(type+i)%3],[a,b,c],[s,s*.85,s*.9]); foliage.rotation.y=i;
    });
    A.disk(g,0x96a76a,0,0,1.4,1.1);
    this.colliders.push({type:'circle',x,z,r:.4*scale});
    return g;
  }
  bush(x,z,size) {
    const A=Meadow.Art,g=A.group(this.root,x,z);
    [-.3,.3].forEach((offset,i)=>A.part(g,'pebble',i?0x93a570:0x81966a,[offset,.4*size,0],[size*.65,size*.55,size*.7]));
  }
  fence(x,z,count,angle) {
    const A=Meadow.Art,g=A.group(this.root,x,z); g.rotation.y=angle;
    for(let i=0;i<count;i++){
      const xx=i*1.05;
      A.part(g,'box',0xe0d6b6,[xx,.52,0],[.13,1.05,.16]);
      A.part(g,'cone',0xe0d6b6,[xx,1.12,0],[.12,.17,.12]);
      if(i<count-1) [.36,.78].forEach(y=>A.part(g,'box',0xd5c8a3,[xx+.5,y,0],[1,.12,.10]));
      this.colliders.push({type:'circle',x:x+Math.cos(angle)*xx,z:z-Math.sin(angle)*xx,r:.2});
    }
  }
  buildPond() {
    const A=Meadow.Art;
    A.disk(this.root,0xbec6a0,10,4.8,3.8,3.1,.048);
    this.water=A.disk(this.root,0x81b9b3,10,4.8,3.3,2.6,.073);
    for(let i=0;i<19;i++){
      const a=i/19*Math.PI*2,x=10+Math.cos(a)*3.5,z=4.8+Math.sin(a)*2.8;
      if(Math.abs(x-10)<.85)continue;
      A.part(this.root,'pebble',0xc3c5a7,[x,.13,z],[.37,.19,.28]);
    }
    this.ripples=[];
    [[11.5,4], [8.4,5.5], [11.8,6]].forEach(([x,z])=>{
      const ring=new THREE.Mesh(new THREE.RingGeometry(.35,.375,32),new THREE.MeshBasicMaterial({color:0xc6e2cf,transparent:true,opacity:.5,side:THREE.DoubleSide}));
      ring.rotation.x=-Math.PI/2;ring.position.set(x,.10,z);this.root.add(ring);this.ripples.push(ring);
      A.disk(this.root,0x7f9b70,x+.2,z+.25,.28,.23,.11);
    });
    for(let i=0;i<16;i++) A.part(this.root,'box',i%2?0xbfa479:0xc9b288,[10,.20,1.65+i*.42],[1.6,.15,.37]);
    [-1,1].forEach(s=>{[2,4.8,7.7].forEach(z=>A.part(this.root,'box',0x9b8865,[10+s*.76,.63,z],[.12,.95,.12]));A.part(this.root,'box',0xd4ba86,[10+s*.76,1.04,4.8],[.10,.1,5.8]);});
  }
  buildPostbox() {
    const A = Meadow.Art;
    this.postbox = A.group(this.root, -7.7, -5.5);
    A.part(this.postbox, 'box', 0x947853, [0,.7,0], [.15,1.4,.17]);
    A.part(this.postbox, 'box', 0x6d8b78, [0,1.5,0], [1.05,.75,.67]);
    A.part(this.postbox, 'ball', 0x6d8b78, [0,1.86,0], [.53,.22,.35]);
    A.part(this.postbox, 'box', 0x405e4f, [0,1.66,.345], [.7,.07,.025]);
    A.part(this.postbox, 'box', 0xf4e6bf, [0,1.36,.35], [.43,.24,.03]);
    A.part(this.postbox, 'ball', 0xc9a15d, [0,1.36,.38], [.045,.045,.02]);
    this.mailFlag = A.part(this.postbox, 'box', 0xcf8b5e, [.65,1.9,.04], [.23,.3,.07]);
    A.part(this.postbox, 'cylinder', 0x8c7853, [.54,1.69,.04], [.025,.7,.025]);
    this.colliders.push({type:'circle',x:-7.7,z:-5.5,r:.58});
  }
  inPond(x,z) { return ((x-10)/3.5)**2+((z-4.8)/2.8)**2<1 && Math.abs(x-10)>.58; }
  buildWindmill() {
    const A=Meadow.Art,g=A.group(this.root,-10,-2.7);
    const tower=new THREE.Mesh(new THREE.CylinderGeometry(.65,.95,2.7,10),A.material(0xe7d7b2));tower.position.y=1.35;tower.castShadow=true;g.add(tower);
    A.part(g,'cone',0xb87553,[0,3,0],[1.05,1.15,1.05]);
    A.part(g,'box',0x7f927c,[0,.65,.85],[.48,1.25,.07]);
    this.windmill=A.group(g);this.windmill.position.set(0,2.3,.9);
    for(let i=0;i<4;i++){
      const blade=A.group(this.windmill);blade.rotation.z=i*Math.PI/2;
      A.part(blade,'box',0x9a855e,[0,.83,0],[.11,1.9,.1]);
      A.part(blade,'box',0xf1e4bf,[.13,1.15,.025],[.45,1.03,.07]);
      for(let j=0;j<4;j++)A.part(blade,'box',0xd0bc91,[.13,.76+j*.25,.07],[.46,.04,.04]);
    }
    A.part(g,'ball',0xa17e4d,[0,2.3,1.02],[.18,.18,.15]);
    this.colliders.push({type:'circle',x:-10,z:-2.7,r:1});
  }
  buildArch() {
    const A=Meadow.Art;this.arch=A.group(this.root,1,-14);
    [-1,1].forEach(s=>{A.part(this.arch,'cylinder',0xcdbd94,[s*1.45,1.6,0],[.16,3.2,.16]);this.colliders.push({type:'circle',x:1+s*1.45,z:-14,r:.3});});
    const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(-1.45,2.8,0),new THREE.Vector3(-1,3.7,0),new THREE.Vector3(0,4,0),new THREE.Vector3(1,3.7,0),new THREE.Vector3(1.45,2.8,0)]);
    const arch=new THREE.Mesh(new THREE.TubeGeometry(curve,24,.16,7,false),A.material(0xcdbd94));arch.castShadow=true;this.arch.add(arch);
    for(let i=0;i<15;i++){
      const p=curve.getPoint(i/14);A.part(this.arch,'ball',i%3?0x839869:0xaabb7c,[p.x,p.y,.1],[.3,.25,.28]);
      if(i%2===0) A.part(this.arch,'ball',i%4?0xe9b69e:0xf7dfad,[p.x,p.y,.32],[.17,.16,.12]);
    }
    this.archLabel=this.label(this.arch,'花田的出口',4.75);
    this.exitLights=[];
    for(let i=0;i<15;i++){
      const z=1-i*1.03,x=.5+Math.sin(i*.65)*.45;
      const m=A.part(this.root,'ball',0xffe9a7,[x,.22,z],[.12,.12,.12],false);m.visible=false;this.exitLights.push(m);
    }
  }
  buildLamp() {
    const A=Meadow.Art;this.lamp=A.group(this.root,4.05,2.7);
    A.part(this.lamp,'cylinder',0xbba77e,[0,.3,0],[.8,.6,.8]);
    A.part(this.lamp,'cylinder',0xe0c89a,[0,.68,0],[.95,.16,.95]);
    A.part(this.lamp,'cylinder',0x96764b,[0,1.37,0],[.07,1.4,.07]);
    A.part(this.lamp,'cone',0x8b9b74,[0,2.51,0],[.65,.5,.65]);
    A.part(this.lamp,'cylinder',0x94764f,[0,1.7,0],[.43,.12,.43]);
    this.lampGlow=new THREE.Mesh(new THREE.SphereGeometry(.33,16,12),new THREE.MeshStandardMaterial({color:0xd4cf9d,emissive:0xffc95d,emissiveIntensity:0,roughness:.6}));
    this.lampGlow.position.y=2;this.lamp.add(this.lampGlow);
    for(let i=0;i<4;i++){const a=i*Math.PI/2;A.part(this.lamp,'cylinder',0x92764e,[Math.cos(a)*.34,2,Math.sin(a)*.34],[.035,.65,.035]);}
    this.lampLight=new THREE.PointLight(0xffd78b,0,8);this.lampLight.position.set(4.05,2.5,2.7);this.scene.add(this.lampLight);
    this.lampLabel=this.label(this.lamp,'等待點亮的引路燈',3.3);
    this.colliders.push({type:'circle',x:4.05,z:2.7,r:.83});
    this.lampFlowers=A.group(this.lamp);
    CONFIG.FLOWERS.forEach((f,i)=>{const a=i/3*Math.PI*2; A.flower(this.lampFlowers,f.color,Math.cos(a)*.55,Math.sin(a)*.55,.5,f.id).position.y=.75;});
    this.lampFlowers.visible=false;
  }
  buildPicnic() {
    const A=Meadow.Art,g=A.group(this.root,-3.2,9.8);g.rotation.y=.15;
    for(let x=0;x<6;x++)for(let z=0;z<5;z++)A.part(g,'box',(x+z)%2?0xedd9b2:0xdab994,[-1.2+x*.4,.052,-.8+z*.4],[.4,.035,.4],false);
    A.part(g,'box',0xa5895b,[-.6,.31,-.3],[.7,.5,.5]);
    const handle=new THREE.Mesh(new THREE.TorusGeometry(.25,.045,6,16,Math.PI),A.material(0x967b51));handle.position.set(-.6,.57,-.3);g.add(handle);
    A.part(g,'ball',0xd18b63,[.45,.16,.25],[.18,.16,.17]);A.disk(g,0xf5e9cc,.4,.2,.45,.45,.095);
    A.part(g,'cylinder',0xd4dfbf,[.65,.24,-.35],[.12,.35,.12]);
    this.colliders.push({type:'circle',x:-3.8,z:9.5,r:.45});
  }
  buildFlowerBeds() {
    const A=Meadow.Art;
    CONFIG.FLOWERS.forEach((f,index)=>{
      const bed=A.group(this.root,f.x,f.z);A.disk(bed,0x94a36a,0,0,1.5,1.25,.07);
      for(let i=0;i<11;i++){
        const a=i/11*Math.PI*2;A.part(bed,'pebble',0xd4c9a7,[Math.cos(a)*1.4,.13,Math.sin(a)*1.18],[.22,.16,.20]);
      }
      const bloom=A.flower(bed,f.color,0,0,1.55,f.id);bloom.rotation.x=-.18;
      for(let i=0;i<4;i++){const a=i*Math.PI/2;A.flower(bed,f.color,Math.cos(a)*.8,Math.sin(a)*.65,.4,f.id);}
      const label=this.label(bed,`${index+1} · ${f.symbol} ${f.name}`,2.65);
      this.flowers.set(f.id,{mesh:bed,bloom,label});
    });
  }
  scatterMeadow() {
    const A=Meadow.Art, grass=[],petals=[],centers=[];
    for(let i=0;i<1800;i++){
      const x=(this.random()-.5)*33,z=(this.random()-.5)*35-1;
      if((x/17)**2+((z+1)/18.5)**2>.92||this.nearPath(x,z,.25)||this.inPond(x,z)||CONFIG.FLOWERS.some(f=>Math.hypot(f.x-x,f.z-z)<1.8))continue;
      const h=.14+this.random()*.3; grass.push([x,h*.5,z,.035,h,.035,0x7f965c]);
      if(i%3===0){
        const color=[0xf4dfae,0xeab39b,0xe6d4b0,0xd8c3df][i%4];
        for(let j=0;j<5;j++){const a=j/5*Math.PI*2;petals.push([x+Math.sin(a)*.08,h+.03,z+Math.cos(a)*.08,.075,.035,.07,color]);}
        centers.push([x,h+.05,z,.047,.04,.047,0xd7b35d]);
      }
    }
    const batch=(geometry,items)=>{
      const mesh=new THREE.InstancedMesh(geometry,new THREE.MeshStandardMaterial({roughness:1}),items.length),dummy=new THREE.Object3D();
      items.forEach(([x,y,z,sx,sy,sz,c],i)=>{dummy.position.set(x,y,z);dummy.scale.set(sx,sy,sz);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);mesh.setColorAt(i,new THREE.Color(c).convertSRGBToLinear());});
      mesh.receiveShadow=true;this.root.add(mesh);
    };
    // Tiny background blossoms need only 20 faces; hero flowers keep their round petals.
    const tinyPetal=new THREE.IcosahedronGeometry(1,0);
    batch(new THREE.ConeGeometry(1,1,4),grass);batch(tinyPetal,petals);batch(tinyPetal,centers);
    // Mushroom clusters are landmarks without adding collision noise.
    [[-11,5],[6,-11],[13,-5],[-8,-7]].forEach(([x,z])=>{
      for(let i=0;i<3;i++){A.part(this.root,'cylinder',0xe6dec1,[x+i*.35,.21,z+i*.22],[.07,.42,.07]);A.part(this.root,'ball',0xc58969,[x+i*.35,.44,z+i*.22],[.25,.14,.24]);}
    });
  }
  buildBackdrop() {
    const A=Meadow.Art;
    for(let i=0;i<11;i++){
      A.part(this.root,'ball',i%2?0xbdc6ac:0xb0bda1,[-45+i*9,-1,-36-this.random()*15],[9+this.random()*5,5+this.random()*6,8],false);
    }
    this.clouds=[];
    [[-18,13,-22],[12,15,-30],[27,10,-16]].forEach(([x,y,z])=>{
      const c=A.group(this.root);c.position.set(x,y,z);for(let i=0;i<4;i++)A.part(c,'ball',0xf1edda,[i*1.2,Math.sin(i)*.5,0],[1.5,1,1],false);this.clouds.push(c);
    });
  }
  buildParticles() {
    const points=new Float32Array(60*3);this.particleSeeds=[];
    for(let i=0;i<60;i++){const x=(this.random()-.5)*29,z=(this.random()-.5)*29;points[i*3]=x;points[i*3+1]=.5+this.random()*3;points[i*3+2]=z;this.particleSeeds.push(points[i*3+1]);}
    this.particles=new THREE.Points(new THREE.BufferGeometry().setAttribute('position',new THREE.BufferAttribute(points,3)),new THREE.PointsMaterial({color:0xffedaf,size:.075,transparent:true,opacity:.75,depthWrite:false}));this.root.add(this.particles);
    const A=Meadow.Art;this.butterflies=[];
    [[-6,1],[7,-3],[-3,-9]].forEach(([x,z],i)=>{
      const b=A.group(this.root,x,z);b.position.y=1.5;
      const wings=[-1,1].map(s=>A.part(b,'ball',i===1?0xf0bd9c:0xf5db90,[s*.14,0,0],[.18,.025,.22],false));
      A.part(b,'ball',0x947c52,[0,0,0],[.03,.03,.16],false);this.butterflies.push({mesh:b,wings,x,z});
    });
  }
  label(object,text,height) {
    const el=document.createElement('div');el.className='world-label';
    const bubble=document.createElement('span');bubble.className='label-bubble';bubble.textContent=text;
    const dot=document.createElement('span');dot.className='label-dot';el.append(bubble,dot);document.getElementById('world-labels').append(el);
    const label={object,el,height,enabled:true};this.labels.push(label);return label;
  }
  updateLabels(camera,show) {
    const v=new THREE.Vector3();
    for(const l of this.labels){
      if(!show||!l.enabled){l.el.hidden=true;continue;}
      l.object.getWorldPosition(v);v.y+=l.height;v.project(camera);
      l.el.hidden=v.z>1||v.z< -1||Math.abs(v.x)>1.15||Math.abs(v.y)>1.15;
      l.el.style.transform=`translate(${(v.x*.5+.5)*innerWidth}px,${(-v.y*.5+.5)*innerHeight}px) translate(-50%,-100%)`;
    }
  }
  canWalk(x,z) {
    const r=CONFIG.PLAYER_RADIUS;
    if((x/CONFIG.MAP_RADIUS_X)**2+((z+1)/CONFIG.MAP_RADIUS_Z)**2>.96||this.inPond(x,z))return false;
    return !this.colliders.some(c=>Math.hypot(x-c.x,z-c.z)<c.r+r);
  }
  setTarget(position) { this.target=position;this.hintRing.visible=!!position; }
  sync(state) {
    this.ribbon.visible=!state.ribbon;this.ribbonLabel.enabled=!state.ribbon;
    this.rabbitLabel.enabled=true;this.archLabel.enabled=state.lit;this.lampLabel.enabled=state.metRabbit&&!state.lit;
    this.hedgehogLabel.enabled=true;
    this.mailFlag.rotation.z=state.windSolved?Math.PI/2:0;
    this.lit=state.lit;this.lampFlowers.visible=state.lit;this.lampGlow.material.emissiveIntensity=state.lit?1.3:0;this.lampLight.intensity=state.lit?1.4:0;
    this.exitLights.forEach(m=>m.visible=state.lit);
    this.flowers.forEach((flower,id)=>{
      const got=state.flowers.includes(id);flower.bloom.visible=!got;flower.label.enabled=state.windSolved&&!got;
      flower.bloom.scale.setScalar(state.windSolved?1.55:.85);
    });
  }
  update(time,dt,player,state,reduced) {
    this.rabbit.update(time,player,state.lit&&state.mode==='playing',dt,reduced,this);
    this.hedgehog.update(time,player,reduced);
    if(!reduced){
      if(state.windSolved)this.windmill.rotation.z-=dt*.55;
      this.ripples.forEach((r,i)=>r.scale.setScalar(1+Math.sin(time+i)*.14));
      this.butterflies.forEach((b,i)=>{b.mesh.position.x=b.x+Math.sin(time*.5+i)*.8;b.mesh.position.z=b.z+Math.cos(time*.45+i)*.8;b.mesh.position.y=1.5+Math.sin(time*1.4+i)*.2;b.wings.forEach((w,j)=>w.rotation.z=Math.sin(time*9)*(j?1:-1)*.8);});
      const array=this.particles.geometry.attributes.position.array;this.particleSeeds.forEach((base,i)=>array[i*3+1]=base+Math.sin(time*.5+i)*.3);this.particles.geometry.attributes.position.needsUpdate=true;
    }
    if(this.target){
      this.hintRing.position.set(this.target.x,.12,this.target.z);this.hintRing.scale.setScalar(reduced?1:1+Math.sin(time*2)*.08);
      const p=player.mesh.position,d=Math.hypot(this.target.x-p.x,this.target.z-p.z);
      this.guideDots.visible=state.mode==='playing'&&d>2.5;
      this.guideMeshes.forEach((dot,i)=>{const t=(i+1)/13;dot.position.set(p.x+(this.target.x-p.x)*t,.15+(reduced?0:Math.sin(time*3-i)*.04),p.z+(this.target.z-p.z)*t);dot.scale.setScalar(.065+Math.sin(t*Math.PI)*.03);});
    }else this.guideDots.visible=false;
    this.hintRing.visible=!!this.target&&state.mode==='playing';
  }
};
