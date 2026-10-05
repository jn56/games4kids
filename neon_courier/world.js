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
    this.makeSky();this.makeCity();this.makeRoad();this.makeProps();this.makeDistricts();this.makePilot();this.resize();
    this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(canvas);this.update(null,0,true);
  }
  material(color,roughness=.7,metalness=0){return new THREE.MeshStandardMaterial({color:new THREE.Color(color).convertSRGBToLinear(),roughness,metalness});}
  glow(color,opacity=1){return new THREE.MeshBasicMaterial({color:new THREE.Color(color).convertSRGBToLinear(),transparent:opacity<1,opacity,toneMapped:false,depthWrite:opacity===1});}
  mesh(geometry,material,x,y,z,sx=1,sy=sx,sz=sx,parent=this.scene){const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.scale.set(sx,sy,sz);parent.add(m);return m;}
  box(material,x,y,z,sx,sy,sz,parent){return this.mesh(this.geometries.box,material,x,y,z,sx,sy,sz,parent);}
  batch(geo,mat,count){const m=new THREE.InstancedMesh(geo,mat,count);m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);m.frustumCulled=false;this.scene.add(m);return m;}
  instance(mesh,index,x,y,z,sx,sy,sz,ry=0,rz=0){const d=this.dummy;d.position.set(x,y,z);d.scale.set(sx,sy,sz);d.rotation.set(0,ry,rz);d.updateMatrix();mesh.setMatrixAt(index,d.matrix);}
  curve(d){return Math.sin(d*.0032)*13+Math.sin(d*.0011)*16;}
  tangent(d){return Math.cos(d*.0032)*.0416+Math.cos(d*.0011)*.0176;}
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
    const canvas=document.createElement('canvas');canvas.width=512;canvas.height=256;const c=canvas.getContext('2d');c.fillStyle='#111c34';c.fillRect(0,0,512,256);c.fillStyle=color;c.font='700 86px "Segoe UI","Microsoft JhengHei",sans-serif';c.textAlign='center';c.fillText(title,256,136);c.font='18px Consolas,sans-serif';c.fillStyle='#b9c8e0';c.fillText(subtitle,256,197);c.fillStyle=color;c.fillRect(25,25,70,4);c.fillRect(417,227,70,4);const texture=new THREE.CanvasTexture(canvas);texture.encoding=THREE.sRGBEncoding;return texture;
  }
  makeRoad(){
    this.road=this.batch(this.geometries.box,this.materials.road,28);this.rails=this.batch(this.geometries.box,this.materials.edge,56);this.railGlow=this.batch(this.geometries.box,this.materials.cyan,56);this.laneMarks=this.batch(this.geometries.box,this.glow(0x6b89b0,.55),112);this.seams=this.batch(this.geometries.box,this.glow(0x73dcea,.20),28);
    this.underRoad=this.batch(this.geometries.box,this.materials.edge,14);this.posts=this.batch(this.geometries.box,this.materials.violet,28);
    this.arches=[];for(let i=0;i<4;i++){const g=new THREE.Group();this.box(this.materials.edge,-12,7,0,.5,14,.6,g);this.box(this.materials.edge,12,7,0,.5,14,.6,g);this.box(this.materials.edge,0,14,0,24.5,.7,.6,g);this.box(this.materials.violet,0,13.6,.34,22,.10,.12,g);this.scene.add(g);this.arches.push(g);}
    // Soft reflected strips on the deck supply a restrained neon sheen without post-processing.
    this.reflections=this.batch(this.geometries.box,this.glow(0x4bd9ff,.09),56);
  }
  makeProps(){
    this.signalRings=this.batch(this.geometries.ring,this.materials.cyan,120);this.signalCores=this.batch(new THREE.OctahedronGeometry(.28),this.materials.white,120);
    this.pools={barrier:[],vent:[],tower:[],boost:[],delivery:[]};for(const type of Object.keys(this.pools))for(let i=0;i<(type==='delivery'?3:12);i++){
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
  makeDistricts(){
    this.gardenTrunks=this.batch(this.geometries.cylinder,this.material(0x536a66,.95),32);
    this.gardenLeaves=this.batch(new THREE.IcosahedronGeometry(1,1),this.material(0x277e75,.83),32);
    this.gardenPots=this.batch(this.geometries.cylinder,this.material(0x819dba,.5,.35),32);
    this.portRings=this.batch(new THREE.TorusGeometry(1,.055,6,40),this.materials.violet,10);
    this.districtLights=this.batch(this.geometries.sphere,this.materials.lime,32);
  }
  updateDistrict(d,index){
    const garden=index===1,port=index===2;
    for(const m of [this.gardenTrunks,this.gardenLeaves,this.gardenPots,this.districtLights])m.visible=garden;
    this.portRings.visible=port;
    if(garden){for(let i=0;i<32;i++){
      const ahead=((Math.floor(i/2)*27-d)%432+432)%432-30,x=this.curve(d+ahead)+(i%2?1:-1)*14.3;
      this.instance(this.gardenPots,i,x,.45,-ahead,1.3,.9,1.3);this.instance(this.gardenTrunks,i,x,2,-ahead,.20,3,.20);
      this.instance(this.gardenLeaves,i,x,3.9,-ahead,1.7,2.1,1.7,i*.7);this.instance(this.districtLights,i,x,5.6,-ahead,.10,.1,.1);
    }for(const m of [this.gardenTrunks,this.gardenLeaves,this.gardenPots,this.districtLights])m.instanceMatrix.needsUpdate=true;}
    if(port){for(let i=0;i<10;i++){const ahead=((i*55-d)%550+550)%550-30;this.instance(this.portRings,i,this.curve(d+ahead),3,-ahead,17,17,17,0,.3);}this.portRings.instanceMatrix.needsUpdate=true;}
  }
  resize(){const width=innerWidth,height=innerHeight;this.renderer.setSize(width,height,false);this.camera.aspect=width/height;this.camera.updateProjectionMatrix();}
  setRole(role){this.materials.jacket.color.set(NC.roles[role].color).convertSRGBToLinear();}
  update(run,dt,cover=false){
    this.time+=dt;const d=cover?this.time*3:(run?.distance||0),t=this.time,bend=this.curve(d),r=this.renderer;
    const district=run?Math.min(2,Math.floor(d/(run.contract.length/3))):0;this.scene.fog.color.lerp(this.colors[district],.02);this.skyMaterial.uniforms.bottom.value.copy(this.scene.fog.color).multiplyScalar(1.4);this.updateDistrict(d,district);
    for(let i=0;i<28;i++){
      const ahead=i*24-48-d%24,abs=d+ahead,c=this.curve(abs),angle=-Math.atan(this.tangent(abs));
      this.instance(this.road,i,c,-.4,-ahead,23,.8,24.1,angle);this.instance(this.seams,i,c,.012,-ahead,22.5,.015,.07,angle);
      for(let side=0;side<2;side++){
        const x=side?11.8:-11.8,index=i*2+side;this.instance(this.rails,index,c+x,.28,-ahead,.35,.6,24.1,angle);this.instance(this.railGlow,index,c+x,.62,-ahead,.10,.06,24.1,angle);
        this.instance(this.reflections,index,c+x*.89,.02,-ahead,1.7,.01,23,angle);
        for(let k=0;k<2;k++)this.instance(this.laneMarks,i*4+side*2+k,c+(side?3.5:-3.5),.025,-ahead+k*12,.065,.025,6,angle);
      }
      if(i%2===0){this.instance(this.underRoad,i/2,c,-7,-ahead,24,1.1,1);for(let side=0;side<2;side++)this.instance(this.posts,i+side,c+(side?14:-14),3,-ahead,.07,6,.09);}
    }
    for(const m of [this.road,this.rails,this.railGlow,this.laneMarks,this.seams,this.underRoad,this.posts,this.reflections])m.instanceMatrix.needsUpdate=true;
    this.cityData.forEach((b,i)=>{const ahead=((b.d-d)%600+600)%600-60,x=this.curve(d+ahead)+b.x*b.side;
      this.instance(this.buildings,i,x,b.h/2-18,-ahead,b.w,b.h,b.depth);this.instance(this.roofLights,i,x,b.h-17.96,-ahead+b.depth/2+.04,b.w,.16,.12);
    });this.buildings.instanceMatrix.needsUpdate=true;this.roofLights.instanceMatrix.needsUpdate=true;
    this.signs.forEach(g=>{const a=((g.userData.distance-d)%570+570)%570-30;g.position.set(this.curve(d+a)+g.userData.side*21,10,-a);g.rotation.y=-g.userData.side*.3;});
    this.arches.forEach((g,i)=>{const a=((i*144-d)%576+576)%576-32;g.position.set(this.curve(d+a),0,-a);g.rotation.y=-Math.atan(this.tangent(d+a));});
    this.fliers.forEach((g,i)=>{const a=((i*70-d*.5-t*(i%2?6:-3))%560+560)%560-40;g.position.set(bend+(i%2?1:-1)*(20+Math.sin(t*.3+i)*8),4+(i%4)*5+Math.sin(t+i)*.4,-a);});
    this.updateItems(run,d,cover);
    const x=cover?bend+5:bend+(run?.x||0),y=cover?.10:run?.y||0;
    this.pilot.position.set(x,y+Math.sin(t*7)*.035,0);this.pilot.rotation.y=cover?-.5:-this.tangent(d);this.pilot.rotation.z=cover?-.08:NC.clamp(((run?.lane||0)-1)*7-(run?.x||0),-4,4)*-.045;
    this.body.rotation.x=run?.boosting?-.20:-.07;this.arms.forEach((a,i)=>a.rotation.x=(run?.boosting?-.6:-.3)+Math.sin(t*4+i)*.035);this.board.rotation.z=Math.sin(t*3)*.035;
    this.shadow.position.x=x;this.shadow.material.opacity=Math.max(.2,1-y*.15);this.shadow.scale.setScalar(1+y*.08);
    for(let i=0;i<12;i++){const active=run?.boosting&&!cover&&!this.reduced;this.instance(this.trails,i,x+(i%2?1:-1)*(1+i*.3),.15+(i%4)*.6,2+i*.4,.025,.025,active?(1+Math.sin(t*18+i)*.4):0);}this.trails.instanceMatrix.needsUpdate=true;
    const portrait=innerWidth<innerHeight;
    const target=cover?new THREE.Vector3(bend+(portrait?10:12),portrait?6:5.8,portrait?16:12):new THREE.Vector3(bend+(run?.x||0)*(portrait?.55:.22),portrait?9:6,portrait?23:11.8);
    if(dt===0)this.camera.position.copy(target);else this.camera.position.lerp(target,1-Math.exp(-dt*5));
    const look=cover?new THREE.Vector3(bend+(portrait?2:0),portrait?2:2,-12):new THREE.Vector3(this.curve(d+24)+(run?.x||0)*(portrait?.40:.13),1.7,-23);
    this.camera.lookAt(look);const fov=(portrait?68:62)+(run?.boosting&&!this.reduced?6:0);this.camera.fov+=(fov-this.camera.fov)*.06;this.camera.updateProjectionMatrix();
    r.render(this.scene,this.camera);
  }
  updateItems(run,d,cover){
    const used={barrier:0,vent:0,tower:0,boost:0,delivery:0};let count=0;
    const items=cover?Array.from({length:20},(_,i)=>({type:'signal',lane:i%3,distance:d+22+i*15,height:1.3})):run?.items||[];
    for(const item of items){const ahead=item.distance-d;if(item.done||ahead< -6||ahead>300)continue;const x=this.curve(item.distance)+(item.lane-1)*7;
      if(item.type==='signal'){
        if(count>=120)continue;this.instance(this.signalRings,count,x,item.height,-ahead,1,1,1,Math.sin(this.time*2+item.distance)*.25);
        this.instance(this.signalCores,count,x,item.height,-ahead,1,1,1,this.time*2,this.time);count++;
      }else{
        const index=used[item.type]++,g=this.pools[item.type]?.[index];if(!g)continue;g.visible=true;g.position.set(x,0,-ahead);g.rotation.y=-Math.atan(this.tangent(item.distance));
        if(g.userData.fan)g.userData.fan.rotation.y=this.time*3;
        if(g.userData.ring)g.userData.ring.rotation.y=this.time*1.5;
        if(item.type==='delivery'&&g.userData.index!==item.index){const old=g.userData.label.material.map;g.userData.label.material.map=this.sign(String(item.index+1).padStart(2,'0'),'DELIVERY / 自動交付');g.userData.index=item.index;old.dispose();}
      }
    }
    for(const [type,pool] of Object.entries(this.pools))for(let i=used[type];i<pool.length;i++)pool[i].visible=false;
    this.signalRings.count=count;this.signalCores.count=count;this.signalRings.instanceMatrix.needsUpdate=true;this.signalCores.instanceMatrix.needsUpdate=true;
  }
};
