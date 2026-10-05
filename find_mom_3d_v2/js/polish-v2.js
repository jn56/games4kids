'use strict';
Meadow.PolishV2=class {
  constructor(game){
    this.game=game;this.low=matchMedia('(pointer:coarse)').matches;this.next=0;
    try{const saved=JSON.parse(localStorage.getItem('little-lights-v2-settings'));if(saved){this.low=saved.low===true;game.living.enabled=saved.events!==false;game.reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches||saved.reduced===true;game.input.autoJog=saved.jog!==false;}}catch(_){}
    this.textures=new Map();
    this.environment();
    // Procedural surface grain is shared and generated locally, no network assets.
    this.material=Meadow.Art.material;const original=this.material;
    Meadow.Art.material=color=>{const m=original(color);this.surface(m);return m;};
    this.surfaceMaterials=new WeakSet();this.decorated=new WeakSet();this.canopies=[];this.world();this.quality();game.controls.labels();
    game.renderer.domElement.addEventListener('webglcontextrestored',()=>{
      document.getElementById('error-text').textContent='3D 畫面已恢復。重新整理會載入最近的存點。';
    });
  }
  environment(){
    const g=this.game,canvas=document.createElement('canvas');canvas.width=512;canvas.height=256;const ctx=canvas.getContext('2d');
    const sky=ctx.createLinearGradient(0,0,0,256);sky.addColorStop(0,'#9dbbd4');sky.addColorStop(.45,'#eee7cc');sky.addColorStop(.55,'#b9c6ad');sky.addColorStop(1,'#556f64');ctx.fillStyle=sky;ctx.fillRect(0,0,512,256);
    const sun=ctx.createRadialGradient(345,65,0,345,65,42);sun.addColorStop(0,'#fffce7');sun.addColorStop(.25,'#fff4d1');sun.addColorStop(1,'#fff4d100');ctx.fillStyle=sun;ctx.fillRect(300,20,90,90);
    const texture=new THREE.CanvasTexture(canvas);texture.encoding=THREE.sRGBEncoding;texture.mapping=THREE.EquirectangularReflectionMapping;
    const generator=new THREE.PMREMGenerator(g.renderer);this.environmentTarget=generator.fromEquirectangular(texture);g.scene.environment=this.environmentTarget.texture;generator.dispose();texture.dispose();
    this.rim=new THREE.DirectionalLight(0xc4e7ef,.32);this.rim.position.set(8,12,-15);g.scene.add(this.rim);g.scene.add(this.rim.target);
  }
  grain(kind){
    if(this.textures.has(kind))return this.textures.get(kind);
    const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const ctx=canvas.getContext('2d'),random=Meadow.Art.rng(kind==='wood'?41:87),data=ctx.createImageData(128,128);
    for(let y=0;y<128;y++)for(let x=0;x<128;x++){
      const i=(y*128+x)*4,n=kind==='wood'?Math.sin(x*.28+Math.sin(y*.09)*.8)*7:Math.sin(x*Math.PI)*2;
      const shade=Math.round(222+random()*27+n);data.data[i]=data.data[i+1]=data.data[i+2]=shade;data.data[i+3]=255;
    }ctx.putImageData(data,0,0);
    const tex=new THREE.CanvasTexture(canvas);tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.repeat.set(3,3);tex.anisotropy=Math.min(4,this.game.renderer.capabilities.getMaxAnisotropy());tex.encoding=THREE.sRGBEncoding;this.textures.set(kind,tex);return tex;
  }
  surface(m){
    if(!m?.isMeshStandardMaterial||this.surfaceMaterials.has(m))return;
    this.surfaceMaterials.add(m);m.envMapIntensity=.35;const hsl={};m.color.getHSL(hsl);
    const wood=hsl.h<.15&&hsl.s>.2&&hsl.l<.45;
    if(wood){m.map=this.grain('wood');m.bumpMap=m.map;m.bumpScale=.035;m.roughness=.7;}
    else if(hsl.h>.43&&hsl.h<.6&&hsl.s>.2){m.roughness=.32;m.metalness=.08;m.envMapIntensity=.65;}
    else if(hsl.s<.25){m.roughness=.83;}
    else m.roughness=.78;
    m.needsUpdate=true;
  }
  world(){
    this.canopies=this.canopies.filter(mesh=>{let root=mesh;while(root.parent)root=root.parent;if(root===this.game.scene)return true;mesh.material.dispose();return false;});
    this.game.scene.traverse(mesh=>{if(mesh.isMesh){
      if(Array.isArray(mesh.material))mesh.material.forEach(m=>this.surface(m));else this.surface(mesh.material);
      if(this.decorated.has(mesh)||!mesh.material?.isMeshStandardMaterial||mesh.isInstancedMesh)return;this.decorated.add(mesh);
      // Tree crowns that obscure the player become translucent. Shared source
      // materials are cloned only for these few large crowns, never all meshes.
      const hsl={};mesh.material.color.getHSL(hsl);
      if(mesh.position.y>2.4&&mesh.scale.x>.9&&['IcosahedronGeometry','SphereGeometry'].includes(mesh.geometry.type)&&hsl.h>.15&&hsl.h<.45){
        mesh.material=mesh.material.clone();mesh.material.transparent=true;mesh.material.depthWrite=true;this.canopies.push(mesh);
      }
    }});
    this.game.scene.fog.near=30;this.game.scene.fog.far=105;
  }
  quality(){
    const g=this.game;g.renderer.setPixelRatio(Math.min(devicePixelRatio,this.low?1.25:2));g.renderer.shadowMap.enabled=!this.low;
    g.renderer.setSize(innerWidth,innerHeight);document.body.classList.toggle('quality-low',this.low);
  }
  save(){try{localStorage.setItem('little-lights-v2-settings',JSON.stringify({low:this.low,events:this.game.living.enabled,reduced:this.game.reducedMotion,jog:this.game.input.autoJog}));}catch(_){} }
  update(dt){
    const g=this.game;
    // Cool skylight and warm key light give rounded figures readable volume.
    g.hemisphere.intensity=.48;g.sun.intensity=Math.max(1.22,g.sun.intensity);
    this.rim.position.set(g.view.focus.x+8,12,g.view.focus.z-15);this.rim.target.position.copy(g.view.focus);
    // New challenge arenas are decorated once, not traversed every frame.
    if(this.mode!==g.state.mode){this.mode=g.state.mode;this.world();}
    const p=g.player.mesh.position,position=new THREE.Vector3();
    for(const mesh of this.canopies){mesh.getWorldPosition(position);const obscures=g.state.mode==='playing'&&position.z>p.z-.3&&position.z<p.z+9&&Math.abs(position.x-p.x)<2.2;
      const target=obscures?.28:1;mesh.material.opacity+=(target-mesh.material.opacity)*Math.min(1,dt*8);mesh.material.depthWrite=mesh.material.opacity>.8;}
    if(g.time<this.next)return;this.next=g.time+.25;
    // Keep main instructions consistent even when legacy challenge UIs rebuild.
    for(const el of document.querySelectorAll('#journey-instruction,#action-instruction,#journey-hit small,#action-run small,#rescue-action,#action-left small,#action-right small,#journey-left small,#journey-right small')){
      const clean=el.textContent.replace(/空白鍵 \/ E/g,'空白鍵').replace(/按 E/g,'按空白鍵').replace(/E 切換/g,'空白鍵切換').replace(/\/ A/g,'/ ←').replace(/\/ D/g,'/ →').replace(/ · E/g,' · 空白鍵').replace(/^E$/,'空白鍵');
      if(clean!==el.textContent)el.textContent=clean;
    }
  }
};
