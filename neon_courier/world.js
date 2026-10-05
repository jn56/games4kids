'use strict';
NC.World=class {
  constructor(canvas){
    this.canvas=canvas;this.time=0;this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;this.coarse=matchMedia('(pointer: coarse)').matches;
    this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance',alpha:false});this.renderer.setPixelRatio(Math.min(devicePixelRatio,this.coarse?1.5:1.75));
    this.renderer.outputEncoding=THREE.sRGBEncoding;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.1;
    this.scene=new THREE.Scene();this.scene.fog=new THREE.FogExp2(0x131c39,.0055);this.camera=new THREE.PerspectiveCamera(62,1,.2,1100);
    this.scene.add(new THREE.HemisphereLight(0xb9d6ff,0x202448,.8));
    const key=new THREE.DirectionalLight(0xd7eaff,1.4);key.position.set(-20,40,15);this.scene.add(key);const rim=new THREE.DirectionalLight(0xba8dff,1);rim.position.set(15,12,-20);this.scene.add(rim);
    this.dummy=new THREE.Object3D();this.colors=[new THREE.Color(0x151c42),new THREE.Color(0x103a48),new THREE.Color(0x3b254a)];
    this.geometries={box:new THREE.BoxGeometry(1,1,1),sphere:new THREE.SphereGeometry(1,16,12),cylinder:new THREE.CylinderGeometry(1,1,1,12),ring:new THREE.TorusGeometry(.8,.12,8,24)};
    this.materials={road:this.material(0x172335,.48,.45),edge:this.material(0x263047,.58,.55),building:this.material(0x142136,.8,.28),dark:this.material(0x12172d,.7,.3),skin:this.material(0xd8ae94,.85),jacket:this.material(0xdcff78,.6,.16),pants:this.material(0x2b3050,.8),visor:this.material(0x285c73,.22,.8),white:this.material(0xd2dcea,.5,.3),lime:this.glow(0xdcff78),cyan:this.glow(0x71eaff),violet:this.glow(0xa998ff),peach:this.glow(0xffc1a0)};
    this.makeSky();this.makeCity();this.makeRoad();this.makeProps();this.makeDistricts();this.makePilot();this.makeRideEffects();this.makeCouriers();this.resize();
    this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(canvas);this.update(null,0,true);
  }
  material(color,roughness=.7,metalness=0){return new THREE.MeshStandardMaterial({color:new THREE.Color(color).convertSRGBToLinear(),roughness,metalness});}
  glow(color,opacity=1){return new THREE.MeshBasicMaterial({color:new THREE.Color(color).convertSRGBToLinear(),transparent:opacity<1,opacity,toneMapped:false,depthWrite:opacity===1});}
  mesh(geometry,material,x,y,z,sx=1,sy=sx,sz=sx,parent=this.scene){const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.scale.set(sx,sy,sz);parent.add(m);return m;}
  box(material,x,y,z,sx,sy,sz,parent){return this.mesh(this.geometries.box,material,x,y,z,sx,sy,sz,parent);}
  batch(geo,mat,count){const m=new THREE.InstancedMesh(geo,mat,count);m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);m.frustumCulled=false;this.scene.add(m);return m;}
  instance(mesh,index,x,y,z,sx,sy,sz,ry=0,rz=0){const d=this.dummy;d.position.set(x,y,z);d.scale.set(sx,sy,sz);d.rotation.set(0,ry,rz);d.updateMatrix();mesh.setMatrixAt(index,d.matrix);}
  curve(d){return NC.curve(d);}
  tangent(d){return NC.tangent(d);}
  center(run,d,side){const f=run?.forkAt(d);return this.curve(d)+(f&&side!==undefined?NC.forkOffset(f,d,side):run?.pathOffset(d)||0);}
  slope(run,d,side){const f=run?.forkAt(d),branch=side??f?.choice;return this.tangent(d)+(f&&branch!=null?NC.forkSlope(f,d,branch):0);}
  spread(run,d){const f=run?.forkAt(d);return f?Math.abs(NC.forkOffset(f,d,0)):0;}
  makeSky(){
    this.skyMaterial=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms:{bottom:{value:new THREE.Color(0x252956)},top:{value:new THREE.Color(0x030916)}},vertexShader:'varying vec3 v;void main(){v=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec3 v;uniform vec3 bottom;uniform vec3 top;void main(){float h=clamp(normalize(v).y*.9,0.,1.);gl_FragColor=vec4(mix(bottom,top,pow(h,.45)),1.);}'});
    this.mesh(new THREE.SphereGeometry(1000,24,16),this.skyMaterial,0,0,0);
    const r=NC.random(930),positions=[];for(let i=0;i<220;i++)positions.push((r()-.5)*1300,30+r()*420,-240-r()*550);
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));this.scene.add(new THREE.Points(geo,new THREE.PointsMaterial({color:0xb5d5ff,size:1.15,transparent:true,opacity:.7,fog:false,toneMapped:false})));
    this.mesh(this.geometries.sphere,this.glow(0xb8b1eb),105,120,-550,31);
    const orbit=this.mesh(new THREE.TorusGeometry(48,.65,6,96),this.glow(0xaaabec,.5),105,120,-550);orbit.rotation.set(.8,.3,-.32);
    const skyline=this.batch(this.geometries.box,this.material(0x15223b,.95),45);for(let i=0;i<45;i++){const h=35+r()*100;this.instance(skyline,i,(i-22)*23,h/2-12,-440-r()*110,12+r()*18,h,17);}skyline.instanceMatrix.needsUpdate=true;
  }
  makeCity(){
    const r=NC.random(779);this.cityData=Array.from({length:90},(_,i)=>({d:Math.floor(i/6)*40,side:i%2?1:-1,x:24+(i%6>>1)*30+r()*12,h:14+r()*65,w:9+r()*11,depth:12+r()*18,color:r()}));
    const canvas=document.createElement('canvas');canvas.width=128;canvas.height=256;const c=canvas.getContext('2d');c.fillStyle='#17223a';c.fillRect(0,0,128,256);
    for(let row=0;row<25;row++)for(let col=0;col<8;col++){c.fillStyle=r()>.25?['#8fa9c2','#6277a0','#c0aacb','#91c3ce'][Math.floor(r()*4)]:'#202b43';c.globalAlpha=.35+r()*.4;c.fillRect(col*16+4,row*10+3,5,3);}c.globalAlpha=1;
    const texture=new THREE.CanvasTexture(canvas);texture.encoding=THREE.sRGBEncoding;
    const mat=new THREE.MeshStandardMaterial({map:texture,color:0x899abd,emissive:0x384059,emissiveMap:texture,emissiveIntensity:.5,roughness:.6,metalness:.3});
    this.buildings=this.batch(this.geometries.box,mat,this.cityData.length);this.roofLights=this.batch(this.geometries.box,this.materials.cyan,this.cityData.length);
    this.signs=[];const titles=[['夜航','NIGHT SHIFT'],['24:00','OPEN ALL NIGHT'],['音浪','ROOFTOP LIVE'],['STAY','IN THE FLOW'],['雲端花園','SKY GARDEN'],['星港','STARPORT']];
    for(let i=0;i<6;i++){
      const group=new THREE.Group();this.scene.add(group);const tex=this.sign(titles[i][0],titles[i][1],i%2?'#b3a3ff':'#a4faff');const panel=this.mesh(new THREE.PlaneGeometry(10,5),new THREE.MeshBasicMaterial({map:tex,toneMapped:false,side:THREE.DoubleSide}),0,0,0,1,1,1,group);
      this.box(this.materials.edge,0,0,-.18,10.4,5.4,.3,group);this.box(i%2?this.materials.violet:this.materials.cyan,0,-2.7,0,10.6,.08,.4,group);group.userData={distance:45+i*94,side:i%2?1:-1};this.signs.push(group);
    }
    this.fliers=[];for(let i=0;i<8;i++){const g=new THREE.Group();this.box(this.materials.dark,0,0,0,3,.55,1.3,g);this.box(i%2?this.materials.cyan:this.materials.violet,0,-.3,0,2.6,.08,1,g);this.box(this.materials.white,.5,.28,0,1,.4,.9,g);this.scene.add(g);this.fliers.push(g);}
  }
  sign(title,subtitle,color='#dcff78'){
    const canvas=document.createElement('canvas');canvas.width=512;canvas.height=256;const c=canvas.getContext('2d');c.fillStyle='#111c34';c.fillRect(0,0,512,256);c.fillStyle=color;c.font=`700 ${title.length>4?64:86}px "Segoe UI","Microsoft JhengHei",sans-serif`;c.textAlign='center';c.fillText(title,256,136);c.font='18px Consolas,sans-serif';c.fillStyle='#b9c8e0';c.fillText(subtitle,256,197);c.fillStyle=color;c.fillRect(25,25,70,4);c.fillRect(417,227,70,4);const texture=new THREE.CanvasTexture(canvas);texture.encoding=THREE.sRGBEncoding;return texture;
  }
  makeRoad(){
    this.rails=this.batch(this.geometries.box,this.materials.edge,224);this.railGlow=this.batch(this.geometries.box,this.materials.white,224);this.seams=this.batch(this.geometries.box,this.glow(0x73dcea,.20),112);
    this.railGlow.material=this.glow(0xffffff);this.routeColors=Object.fromEntries(Object.entries(NC.routes).map(([k,v])=>[k,new THREE.Color(v.color).convertSRGBToLinear()]));this.routeColors.main=new THREE.Color(0x71eaff).convertSRGBToLinear();
    this.underRoad=this.batch(this.geometries.box,this.materials.edge,112);this.posts=this.batch(this.geometries.box,this.materials.violet,224);
    this.arches=[];for(let i=0;i<4;i++){const g=new THREE.Group();this.box(this.materials.edge,-12,7,0,.5,14,.6,g);this.box(this.materials.edge,12,7,0,.5,14,.6,g);this.box(this.materials.edge,0,14,0,24.5,.7,.6,g);this.box(this.materials.violet,0,13.6,.34,22,.10,.12,g);this.scene.add(g);this.arches.push(g);}
    // Soft reflected strips on the deck supply a restrained neon sheen without post-processing.
    this.reflections=this.batch(this.geometries.box,this.glow(0x4bd9ff,.09),224);
    this.forkSigns=Array.from({length:3},()=>{const g=new THREE.Group();g.userData.panels=[];for(const side of [-1,1]){const panel=this.mesh(new THREE.PlaneGeometry(9,4.5),new THREE.MeshBasicMaterial({map:this.sign('分岔','選一條你的路'),toneMapped:false}),side*6,8,0,1,1,1,g);g.userData.panels.push(panel);}this.scene.add(g);g.visible=false;return g;});
    // A continuous ribbon shares every segment boundary; rotated boxes leave
    // triangular cracks on the sharper fork curves.
    this.deckGeometry=new THREE.BufferGeometry();this.deckPositions=new Float32Array(112*18*3);this.deckNormals=new Float32Array(112*18*3);
    this.deckGeometry.setAttribute('position',new THREE.BufferAttribute(this.deckPositions,3).setUsage(THREE.DynamicDrawUsage));this.deckGeometry.setAttribute('normal',new THREE.BufferAttribute(this.deckNormals,3).setUsage(THREE.DynamicDrawUsage));
    this.deck=new THREE.Mesh(this.deckGeometry,this.materials.road);this.deck.frustumCulled=false;this.scene.add(this.deck);
  }
  deckSection(index,run,d,abs,side){
    const near=abs-6,far=abs+6,width=NC.roadHalfWidth*2,left=this.center(run,near,side)-width/2,right=this.center(run,far,side)-width/2,z0=d-near,z1=d-far;
    const a=[left,0,z0],b=[left+width,0,z0],c=[right,0,z1],e=[right+width,0,z1],al=[left,-.8,z0],bl=[left+width,-.8,z0],cl=[right,-.8,z1],el=[right+width,-.8,z1];
    const faces=[[a,b,c,b,e,c],[a,c,al,c,cl,al],[b,bl,e,e,bl,el]],normals=[[0,1,0],[-1,0,0],[1,0,0]];let offset=index*54;
    for(let f=0;f<3;f++)for(const point of faces[f]){this.deckPositions.set(point,offset);this.deckNormals.set(normals[f],offset);offset+=3;}
  }
  makeProps(){
    this.signalRings=this.batch(this.geometries.ring,this.glow(0xffffff),120);this.signalCores=this.batch(new THREE.OctahedronGeometry(.28),this.materials.white,120);
    this.pools={barrier:[],vent:[],tower:[],boost:[],delivery:[],ramp:[],speedGate:[],styleGate:[]};for(const type of Object.keys(this.pools))for(let i=0;i<(type==='delivery'?3:12);i++){
      const g=new THREE.Group();g.visible=false;this.scene.add(g);this.pools[type].push(g);
      if(type==='barrier'){
        this.box(this.materials.edge,-2,.6,0,.25,1.2,.6,g);this.box(this.materials.edge,2,.6,0,.25,1.2,.6,g);this.box(this.materials.peach,0,1.0,0,4.5,.35,.42,g);this.box(this.materials.dark,0,.55,0,4,.42,.3,g);
        for(let n=-2;n<=2;n++)this.box(this.materials.peach,n*.8,.55,.17,.32,.25,.02,g).rotation.z=-.4;
      }else if(type==='tower'){
        this.box(this.materials.edge,0,2,0,4,4,3,g);this.box(this.materials.violet,0,2,1.53,3.55,3.5,.04,g);this.box(this.materials.dark,0,2,1.56,3.35,3.3,.03,g);
        const chevron=this.box(this.materials.violet,-.55,2,1.59,.16,1.25,.02,g);chevron.rotation.z=-.7;this.box(this.materials.violet,.25,2,1.59,.16,1.25,.02,g).rotation.z=.7;
        this.box(this.materials.violet,0,4.1,0,4.3,.15,3.3,g);
      }else if(type==='vent'){
        this.box(this.materials.edge,0,.01,0,5.5,.12,5.5,g);this.box(this.materials.dark,0,.09,0,4.7,.05,4.7,g);
        for(const x of [-2.65,2.65])this.box(this.materials.peach,x,.14,0,.1,.04,5.5,g);
        for(const z of [-2.65,2.65])this.box(this.materials.peach,0,.14,z,5.5,.04,.1,g);
        const fan=new THREE.Group();for(let n=0;n<4;n++){const blade=this.box(this.materials.edge,0,.15,0,3.8,.1,.42,fan);blade.rotation.y=n*Math.PI/4;}g.add(fan);g.userData.fan=fan;
      }else if(type==='boost'){
        this.box(this.glow(0x71eaff,.17),0,.04,0,5,.08,5.5,g);
        for(let n=0;n<3;n++){this.box(this.materials.cyan,-.65,.1,-1+n,1.7,.06,.15,g).rotation.y=-.5;this.box(this.materials.cyan,.65,.1,-1+n,1.7,.06,.15,g).rotation.y=.5;}
      }else if(type==='ramp'){
        this.box(this.materials.edge,0,.25,0,4.8,.5,5,g).rotation.x=.22;
        this.box(this.materials.violet,0,.56,0,4.5,.07,4.7,g).rotation.x=.22;
        for(const x of [-.8,.8])this.box(this.materials.white,x,.87,-.6,.15,.07,1.8,g).rotation.y=x<0?-.65:.65;
        const arrow=this.mesh(new THREE.ConeGeometry(.5,1,4),this.materials.violet,0,2.4,-.6,1,1,1,g);g.userData.arrow=arrow;
      }else if(type==='speedGate'||type==='styleGate'){
        const mat=type==='speedGate'?this.materials.lime:this.materials.peach;
        const ring=this.mesh(new THREE.TorusGeometry(2.65,.13,8,40),mat,0,2.8,0,1,1,1,g);g.userData.gate=ring;
        if(type==='speedGate'){this.box(mat,-.25,3,0,.15,1.5,.1,g).rotation.z=-.45;this.box(mat,.25,2.4,0,.15,1.5,.1,g).rotation.z=-.45;}
        else this.mesh(new THREE.OctahedronGeometry(.4),mat,0,2.8,0,1,1,1,g);
      }else{
        for(const x of [-2.9,2.9]){this.box(this.materials.edge,x,3,0,.42,6,.6,g);this.box(this.materials.lime,x,3,.35,.16,5.6,.10,g);}this.box(this.materials.lime,0,6,0,6.2,.24,.6,g);
        this.box(this.glow(0xdcff78,.1),0,.06,0,6,.05,7,g);const ring=this.mesh(new THREE.TorusGeometry(1,.12,8,32),this.materials.lime,0,3.5,0,1,1,1,g);g.userData.ring=ring;
        const sign=this.mesh(new THREE.PlaneGeometry(5,2.5),new THREE.MeshBasicMaterial({map:this.sign(String(i+1).padStart(2,'0'),'DELIVERY / 自動交付'),toneMapped:false}),0,7.6,0,1,1,1,g);
        g.userData.label=sign;
      }
    }
    this.trails=this.batch(this.geometries.box,this.glow(0x8de8ff,.35),12);
  }
  makePilot(){
    const m=this.materials,g=this.pilot=new THREE.Group();this.scene.add(g);this.body=new THREE.Group();g.add(this.body);
    this.board=new THREE.Group();g.add(this.board);this.box(m.dark,0,.32,0,1.5,.18,3,this.board);this.mesh(this.geometries.sphere,m.dark,0,.32,-1.45,.74,.09,.4,this.board);this.mesh(this.geometries.sphere,m.dark,0,.32,1.45,.74,.09,.4,this.board);
    this.box(m.cyan,0,.20,0,1.25,.06,2.9,this.board);for(const x of [-.65,.65])this.box(m.lime,x,.44,0,.06,.04,2.25,this.board);
    this.legs=[];for(const x of [-.34,.34]){
      const leg=new THREE.Group();leg.position.set(x,1.35,x<0?.28:-.26);this.body.add(leg);this.mesh(this.geometries.cylinder,m.pants,0,-.32,0,.20,.70,.20,leg).rotation.x=x<0?-.16:.16;
      this.box(m.white,0,-.77,-.12,.42,.24,.68,leg);this.box(m.cyan,0,-.9,-.12,.44,.04,.69,leg);this.legs.push(leg);
    }
    this.mesh(this.geometries.sphere,m.jacket,0,1.94,0,.61,.75,.36,this.body);this.box(m.dark,0,1.45,0,.82,.17,.58,this.body);
    this.box(m.dark,0,2.02,.38,.8,1,.4,this.body);this.box(m.cyan,0,2.05,.60,.50,.66,.025,this.body);this.box(m.dark,0,2.05,.63,.31,.47,.025,this.body);this.box(m.lime,0,2.05,.65,.14,.29,.025,this.body);
    this.mesh(this.geometries.cylinder,m.skin,0,2.58,0,.15,.25,.15,this.body);
    this.mesh(this.geometries.sphere,m.skin,0,2.94,-.04,.36,.43,.34,this.body);
    this.mesh(this.geometries.sphere,m.dark,0,3.10,.015,.40,.35,.38,this.body);
    this.mesh(this.geometries.sphere,m.visor,0,3,-.29,.35,.20,.12,this.body);
    this.box(m.cyan,0,3.08,-.385,.50,.055,.06,this.body);
    for(const x of [-.43,.43])this.mesh(this.geometries.cylinder,m.white,x,3.01,0,.13,.12,.13,this.body).rotation.z=Math.PI/2;
    this.arms=[];for(const x of [-.68,.68]){const arm=new THREE.Group();arm.position.set(x,2.35,0);arm.rotation.z=x<0?-.25:.25;this.body.add(arm);this.mesh(this.geometries.cylinder,m.jacket,0,-.32,0,.19,.7,.19,arm);this.mesh(this.geometries.sphere,m.dark,0,-.70,-.05,.17,.19,.17,arm);this.box(m.white,0,-.57,0,.35,.1,.35,arm);this.arms.push(arm);}
    const shadowCanvas=document.createElement('canvas');shadowCanvas.width=64;shadowCanvas.height=64;const ctx=shadowCanvas.getContext('2d'),gradient=ctx.createRadialGradient(32,32,0,32,32,32);gradient.addColorStop(0,'#000a');gradient.addColorStop(1,'#0000');ctx.fillStyle=gradient;ctx.fillRect(0,0,64,64);
    this.shadow=this.mesh(new THREE.PlaneGeometry(3.5,5),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(shadowCanvas),transparent:true,depthWrite:false}),0,.07,0);this.shadow.rotation.x=-Math.PI/2;
  }
  makeRideEffects(){
    const additive=(color,opacity)=>{const m=this.glow(color,opacity);m.blending=THREE.AdditiveBlending;return m;};
    this.nitro=new THREE.Group();this.board.add(this.nitro);this.nitro.visible=false;
    const cone=new THREE.ConeGeometry(1,1,12),outer=additive(0x38cfff,.36),inner=additive(0xe3fbff,.82);
    this.jets=[];
    for(const side of [-1,1]){
      this.mesh(this.geometries.cylinder,this.materials.dark,side*.48,.30,1.46,.23,.32,.23,this.board).rotation.x=Math.PI/2;
      const jet=new THREE.Group();jet.position.set(side*.48,.30,1.62);this.nitro.add(jet);this.jets.push(jet);
      this.mesh(cone,outer,0,0,1.05,.29,2.1,.29,jet).rotation.x=Math.PI/2;
      this.mesh(cone,inner,0,0,.65,.14,1.3,.14,jet).rotation.x=Math.PI/2;
    }
    this.nitroMist=this.batch(new THREE.IcosahedronGeometry(1,1),additive(0x67dfff,.18),16);
    this.contactRing=this.mesh(new THREE.TorusGeometry(.55,.035,6,24),this.glow(0xd8f8ff,.8),0,0,0);this.contactRing.visible=false;this.contactRing.rotation.x=-Math.PI/2;
  }
  updateRideEffects(run,cover){
    const active=!!run?.boosting&&!cover&&run.phase==='running',t=this.time;
    this.nitro.visible=active;this.nitroMist.visible=active&&!this.reduced;
    for(let i=0;i<this.jets.length;i++)this.jets[i].scale.z=this.reduced?.7:1+Math.sin(t*32+i)*.12;
    if(this.nitroMist.visible){for(let i=0;i<16;i++){
      const age=(t*2.8+Math.floor(i/2)/8)%1,side=i%2?1:-1,size=.09+age*.26;
      this.instance(this.nitroMist,i,this.pilot.position.x+side*(.48+age*.3),run.y+.30+age*.15,1.9+age*3.8,size,size*.65,size*2.6);
    }this.nitroMist.instanceMatrix.needsUpdate=true;}
    this.contactRing.visible=!!run?.impact&&!cover;
    if(this.contactRing.visible){const fade=run.impact/.28;this.contactRing.position.set(this.pilot.position.x+run.impactSide*.8,run.y+.35,.15);this.contactRing.scale.setScalar(this.reduced?1:1+(1-fade)*1.2);this.contactRing.material.opacity=fade*.7;}
  }
  makeCouriers(){
    const m=this.materials;this.courierModels=NC.courierStyles.map(style=>{
      const g=new THREE.Group(),coat=this.material(style.color,.62,.12),glow=this.glow(style.color);this.scene.add(g);g.visible=false;
      this.box(m.dark,0,.25,0,1.5,.22,3.1,g);this.box(glow,0,.15,0,1.35,.05,3,g);
      this.box(coat,0,1.9,0,1.05,1.2,.65,g);this.box(m.dark,0,1.95,.55,.9,1.05,.55,g);this.box(glow,0,1.95,.84,.55,.6,.035,g);
      this.mesh(this.geometries.sphere,m.skin,0,2.9,0,.37,.43,.35,g);this.mesh(this.geometries.sphere,m.dark,0,3.08,.02,.40,.28,.38,g);this.box(m.visor,0,2.98,-.33,.58,.24,.1,g);
      for(const side of [-1,1]){this.box(m.pants,side*.3,.9,0,.32,.9,.35,g);this.box(m.white,side*.3,.43,-.15,.4,.2,.65,g);this.box(coat,side*.66,1.85,-.13,.28,.9,.3,g).rotation.x=-.3;}
      const canvas=document.createElement('canvas');canvas.width=256;canvas.height=96;const c=canvas.getContext('2d');c.fillStyle='#101c30dd';c.fillRect(0,0,256,96);c.strokeStyle='#'+style.color.toString(16).padStart(6,'0');c.lineWidth=5;c.strokeRect(3,3,250,90);c.fillStyle=c.strokeStyle;c.font='bold 34px "Microsoft JhengHei",sans-serif';c.textAlign='center';c.fillText(style.name+' · AI',128,61);
      const texture=new THREE.CanvasTexture(canvas);texture.encoding=THREE.sRGBEncoding;const label=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthWrite:false,toneMapped:false}));label.position.y=4.6;label.scale.set(5,1.875,1);g.add(label);
      const trail=this.box(glow,0,.17,2.1,.65,.035,1,g);g.userData={label,trail};return g;
    });
  }
  updateCouriers(run,dt,cover){
    this.courierModels.forEach((g,i)=>{
      const r=run?.couriers[i]?.run,ahead=r?r.distance-run.distance:0;g.visible=!!r&&!cover&&ahead> -6&&ahead<250;if(!g.visible)return;
      g.position.set(r.worldX(),r.y+Math.sin(this.time*6+i)*.035,-ahead);g.rotation.y+=(-Math.atan(r.vx/Math.max(30,r.speed))-g.rotation.y)*(dt?1-Math.exp(-dt*14):1);const bump=this.reduced?0:Math.sin((.28-r.impact)*40)*r.impact*.22*r.impactSide;g.rotation.z+=(-r.vx/NC.strafeSpeed*.14+bump-g.rotation.z)*(dt?1-Math.exp(-dt*14):1);
      g.userData.label.visible=ahead>4&&ahead<135;g.userData.trail.scale.z=r.boosting?2.6:.7;
    });
  }
  makeDistricts(){
    this.gardenTrunks=this.batch(this.geometries.cylinder,this.material(0x536a66,.95),32);
    this.gardenLeaves=this.batch(new THREE.IcosahedronGeometry(1,1),this.material(0x277e75,.83),32);
    this.gardenPots=this.batch(this.geometries.cylinder,this.material(0x819dba,.5,.35),32);
    this.portRings=this.batch(new THREE.TorusGeometry(1,.055,6,40),this.materials.violet,10);
    this.districtLights=this.batch(this.geometries.sphere,this.materials.lime,32);
  }
  updateDistrict(d,index,run){
    const garden=index===1,port=index===2;
    for(const m of [this.gardenTrunks,this.gardenLeaves,this.gardenPots,this.districtLights])m.visible=garden;
    this.portRings.visible=port;
    if(garden){for(let i=0;i<32;i++){
      const ahead=((Math.floor(i/2)*27-d)%432+432)%432-30,x=this.curve(d+ahead)+(i%2?1:-1)*(14.3+this.spread(run,d+ahead));
      this.instance(this.gardenPots,i,x,.45,-ahead,1.3,.9,1.3);this.instance(this.gardenTrunks,i,x,2,-ahead,.20,3,.20);
      this.instance(this.gardenLeaves,i,x,3.9,-ahead,1.7,2.1,1.7,i*.7);this.instance(this.districtLights,i,x,5.6,-ahead,.10,.1,.1);
    }for(const m of [this.gardenTrunks,this.gardenLeaves,this.gardenPots,this.districtLights])m.instanceMatrix.needsUpdate=true;}
    if(port){for(let i=0;i<10;i++){const ahead=((i*55-d)%550+550)%550-30,size=17+this.spread(run,d+ahead);this.instance(this.portRings,i,this.curve(d+ahead),3,-ahead,size,size,size,0,.3);}this.portRings.instanceMatrix.needsUpdate=true;}
  }
  resize(){const width=innerWidth,height=innerHeight;this.renderer.setSize(width,height,false);this.camera.aspect=width/height;if(width<height&&height<650)this.camera.setViewOffset(width,height,0,height*.06,width,height);else this.camera.clearViewOffset();this.camera.updateProjectionMatrix();}
  setRole(role){this.materials.jacket.color.set(NC.roles[role].color).convertSRGBToLinear();}
  update(run,dt,cover=false){
    this.time+=dt;const d=cover?this.time*3:(run?.distance||0),t=this.time,bend=this.center(run,d),r=this.renderer;
    const district=run?Math.min(2,Math.floor(d/(run.contract.length/3))):0;this.scene.fog.color.lerp(this.colors[district],.02);this.skyMaterial.uniforms.bottom.value.copy(this.scene.fog.color).multiplyScalar(1.4);this.updateDistrict(d,district,run);
    let roads=0,rails=0,supports=0,posts=0;
    for(let i=0;i<56;i++){
      const ahead=i*12-48-d%12,abs=d+ahead,f=run?.forkAt(abs);
      for(const branch of f?[0,1]:[undefined]){
        const c=this.center(run,abs,branch),angle=-Math.atan(this.slope(run,abs,branch)),length=12*Math.sqrt(1+this.slope(run,abs,branch)**2)+.25;
        this.deckSection(roads,run,d,abs,branch);this.instance(this.seams,roads,c,.012,-ahead,22.5,.015,.07,angle);roads++;
        for(let side=0;side<2;side++){
          const inner=f&&!NC.separated(f,abs)&&(branch===0?side===1:side===0),x=side?11.8:-11.8;
          if(!inner){this.instance(this.rails,rails,c+x,.28,-ahead,.35,.6,length,angle);this.instance(this.railGlow,rails,c+x,.62,-ahead,.10,.06,length,angle);this.railGlow.setColorAt(rails,this.routeColors[f?f.options[branch]:'main']);this.instance(this.reflections,rails,c+x*.89,.02,-ahead,1.7,.01,length,angle);rails++;}
        }
        if(i%4===0){this.instance(this.underRoad,supports++,c,-7,-ahead,24,1.1,1);for(const side of [-1,1])this.instance(this.posts,posts++,c+side*14,3,-ahead,.07,6,.09);}
      }
    }
    for(const [m,count] of [[this.seams,roads],[this.rails,rails],[this.railGlow,rails],[this.reflections,rails],[this.underRoad,supports],[this.posts,posts]]){m.count=count;m.instanceMatrix.needsUpdate=true;}this.railGlow.instanceColor.needsUpdate=true;
    this.deckGeometry.setDrawRange(0,roads*18);this.deckGeometry.attributes.position.needsUpdate=true;this.deckGeometry.attributes.normal.needsUpdate=true;
    this.forkSigns.forEach((g,i)=>{const f=run?.forks[i],ahead=f?f.start-d:0;g.visible=!!f&&ahead>18&&ahead<360;if(!g.visible)return;g.position.set(this.curve(f.start),0,-ahead);const key=f.options.join('|');if(g.userData.key!==key){g.userData.key=key;g.userData.panels.forEach((p,side)=>{const route=NC.routes[f.options[side]],old=p.material.map;p.material.map=this.sign((side?'↗ ':'↖ ')+route.name,route.short,route.color);old.dispose();});}});
    this.cityData.forEach((b,i)=>{const ahead=((b.d-d)%600+600)%600-60,x=this.curve(d+ahead)+(b.x+this.spread(run,d+ahead))*b.side;
      this.instance(this.buildings,i,x,b.h/2-18,-ahead,b.w,b.h,b.depth);this.instance(this.roofLights,i,x,b.h-17.96,-ahead+b.depth/2+.04,b.w,.16,.12);
    });this.buildings.instanceMatrix.needsUpdate=true;this.roofLights.instanceMatrix.needsUpdate=true;
    this.signs.forEach(g=>{const a=((g.userData.distance-d)%570+570)%570-30;g.position.set(this.curve(d+a)+g.userData.side*(21+this.spread(run,d+a)),10,-a);g.rotation.y=-g.userData.side*.3;});
    this.arches.forEach((g,i)=>{const a=((i*144-d)%576+576)%576-32;g.visible=!run?.forkAt(d+a);g.position.set(this.curve(d+a),0,-a);g.rotation.y=-Math.atan(this.tangent(d+a));});
    this.fliers.forEach((g,i)=>{const a=((i*70-d*.5-t*(i%2?6:-3))%560+560)%560-40;g.position.set(this.curve(d)+(i%2?1:-1)*(20+Math.sin(t*.3+i)*8),4+(i%4)*5+Math.sin(t+i)*.4,-a);});
    this.updateItems(run,d,cover);this.updateCouriers(run,dt,cover);
    const x=cover?bend+5:bend+(run?.x||0),y=cover?.10:run?.y||0;
    const bump=this.reduced?0:Math.sin((.28-(run?.impact||0))*40)*(run?.impact||0)*.3*(run?.impactSide||1);
    this.pilot.position.set(x+bump*.7,y+Math.sin(t*7)*.035,0);const yaw=cover?-.5:-Math.atan((run?.vx||0)/Math.max(30,run?.speed||0));this.pilot.rotation.y+=(yaw-this.pilot.rotation.y)*(dt?1-Math.exp(-dt*14):1);this.pilot.rotation.z+=((cover?-.08:-(run?.vx||0)/NC.strafeSpeed*.15+bump)-this.pilot.rotation.z)*(dt?1-Math.exp(-dt*16):1);
    this.body.rotation.x=run?.boosting?-.20:-.07;this.arms.forEach((a,i)=>a.rotation.x=(run?.boosting?-.6:-.3)+Math.sin(t*4+i)*.035);this.board.rotation.z=Math.sin(t*3)*.035;
    this.shadow.position.x=x;this.shadow.material.opacity=Math.max(.2,1-y*.15);this.shadow.scale.setScalar(1+y*.08);
    for(let i=0;i<12;i++){const active=run?.boosting&&!cover&&!this.reduced;this.instance(this.trails,i,x+(i%2?1:-1)*(1+i*.3),.15+(i%4)*.6,2+i*.4,.025,.025,active?(1+Math.sin(t*18+i)*.4):0);}this.trails.instanceMatrix.needsUpdate=true;
    this.updateRideEffects(run,cover);
    const portrait=innerWidth<innerHeight;
    // Chase the physical rider position, never a blend of branch center and
    // branch-local x: that blend changes abruptly when the coordinate frame switches.
    const target=cover?new THREE.Vector3(bend+(portrait?10:12),portrait?6:5.8,portrait?16:12):new THREE.Vector3(x,(portrait?9:6)+y*.28,portrait?23:11.8);
    if(dt===0)this.camera.position.copy(target);else{
      const cameraX=this.camera.position.x;
      this.camera.position.lerp(target,1-Math.exp(-dt*5));
      if(!cover)this.camera.position.x=cameraX+(target.x-cameraX)*(1-Math.exp(-dt*9));
    }
    // Keep the chase view facing forward. Steering anticipation would continue
    // swinging the view after release and look like automatic rider steering.
    const look=cover?new THREE.Vector3(bend+(portrait?2:0),portrait?2:2,-12):new THREE.Vector3(this.camera.position.x,1.7+y*.12,-23);
    if(!this.lookTarget||dt===0)this.lookTarget=look;else this.lookTarget.lerp(look,1-Math.exp(-dt*9));
    if(!cover)this.lookTarget.x=this.camera.position.x;
    this.camera.lookAt(this.lookTarget);const fov=(portrait?68:62)+(run?.boosting&&!this.reduced?6:0);this.camera.fov+=(fov-this.camera.fov)*.06;this.camera.updateProjectionMatrix();
    r.render(this.scene,this.camera);
  }
  updateItems(run,d,cover){
    const used=Object.fromEntries(Object.keys(this.pools).map(k=>[k,0]));let count=0;
    const items=cover?Array.from({length:20},(_,i)=>({type:'signal',x:Math.sin(i*.7)*5,distance:d+22+i*15,height:1.3})):run?.items||[];
    for(const item of items){const ahead=item.distance-d;if(item.done||ahead< -6||ahead>300)continue;const x=this.center(run,item.distance,item.branch)+item.x;
      if(item.type==='signal'||item.type==='skyStar'){
        if(count>=120)continue;const scale=item.type==='skyStar'?1.35:1;this.instance(this.signalRings,count,x,item.height,-ahead,scale,scale,scale,Math.sin(this.time*2+item.distance)*.25);this.signalRings.setColorAt(count,this.routeColors[item.type==='skyStar'?'sky':'main']);
        this.instance(this.signalCores,count,x,item.height,-ahead,scale,scale,scale,this.time*2,this.time);count++;
      }else{
        const index=used[item.type]++,g=this.pools[item.type]?.[index];if(!g)continue;g.visible=true;g.position.set(x,0,-ahead);g.rotation.y=-Math.atan(this.slope(run,item.distance,item.branch));
        if(g.userData.fan)g.userData.fan.rotation.y=this.time*3;
        if(g.userData.ring)g.userData.ring.rotation.y=this.time*1.5;
        if(g.userData.arrow)g.userData.arrow.position.y=2.4+Math.sin(this.time*4)*.2;
        if(item.type==='delivery'&&g.userData.index!==item.index){const old=g.userData.label.material.map;g.userData.label.material.map=this.sign(String(item.index+1).padStart(2,'0'),'DELIVERY / 自動交付');g.userData.index=item.index;old.dispose();}
      }
    }
    for(const [type,pool] of Object.entries(this.pools))for(let i=used[type];i<pool.length;i++)pool[i].visible=false;
    this.signalRings.count=count;this.signalCores.count=count;this.signalRings.instanceMatrix.needsUpdate=true;this.signalCores.instanceMatrix.needsUpdate=true;if(this.signalRings.instanceColor)this.signalRings.instanceColor.needsUpdate=true;
  }
};
