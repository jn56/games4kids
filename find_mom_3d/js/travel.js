'use strict';
Meadow.Travel=class {
  static names=['','花田','森林','河谷','山丘'];
  static icons=['','✿','♬','≋','✦'];
  static colors=[0,0xd5b567,0x729d85,0x82adb9,0xa39bbd];
  static links={
    1:[{to:2,x:0,z:-35,dx:0,dz:-1,road:[[0,-14],[0,-25],[0,-40]],pair:1}],
    2:[{to:1,x:0,z:37,dx:0,dz:1,road:[[0,26],[0,41]],pair:1},{to:3,x:35,z:6,dx:1,dz:0,road:[[16,13],[23,6],[39,6]],pair:2}],
    3:[{to:2,x:-35,z:6,dx:-1,dz:0,road:[[-39,6],[-27,6],[-15,8],[-10,11],[-3,10]],pair:2},{to:4,x:0,z:-35,dx:0,dz:-1,road:[[0,-14],[0,-26],[0,-40]],pair:3}],
    4:[{to:3,x:0,z:37,dx:0,dz:1,road:[[0,26],[0,41]],pair:3}]
  };
  static unlocked(s){return Math.max(s.entryChapter||1,s.completed?2:1,s.forest.completed?3:1,s.valley.completed?4:1);}
  static build(world,chapter){
    const A=Meadow.Art;
    world.portals=this.links[chapter].map(data=>{
      world.path(data.road,3.1);
      const mesh=A.group(world.root,data.x,data.z);mesh.rotation.y=Math.atan2(data.dx,data.dz);
      // Both ends of a trail share a crest, paving and vegetation.
      A.disk(mesh,0xc5bb99,0,0,2.15,2.1,.06);
      for(const x of [-1.8,1.8]){
        A.part(mesh,'cylinder',0x897b64,[x,1.45,0],[.16,2.9,.16]);
        const crown=A.part(mesh,'ball',this.colors[data.pair+1],[x,3,0],[.3,.34,.3]);
        crown.material=A.material(this.colors[data.pair+1]);
      }
      A.part(mesh,'box',0xc6b58c,[0,2.9,0],[3.9,.18,.3]);
      const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const ctx=canvas.getContext('2d');
      ctx.fillStyle='#fcf2d9';ctx.beginPath();ctx.arc(64,64,59,0,Math.PI*2);ctx.fill();ctx.fillStyle='#39584c';ctx.font='bold 74px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(this.icons[data.to],64,67);
      const badge=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(canvas),depthTest:true}));badge.position.set(0,3.05,0);badge.scale.set(1.05,1.05,1);mesh.add(badge);
      const barrier=A.part(mesh,'box',0x967850,[0,.9,0],[3.3,.12,.14]);
      const collider={x:data.x,z:data.z,r:1.2,disabled:true};world.colliders.push(collider);
      const chevrons=A.group(mesh);for(let n=0;n<3;n++)for(const s of [-1,1]){const arrow=A.part(chevrons,'box',0xf9e3a4,[s*.19,.13,-.7+n*.65],[.1,.035,.6],false);arrow.rotation.y=s*.7;}
      // Ferns, river reeds and star lanterns repeat across each shared border.
      for(const side of [-1,1])for(let i=0;i<3;i++){
        const x=side*(2.7+i*.65),z=-1+i*.8;
        if(data.pair===1){A.part(mesh,'cylinder',0x8c8165,[x,1,z],[.1,2,.1]);A.part(mesh,'ball',0x8eaa85,[x,2,z],[.6,.9,.6]);A.flower(mesh,0xebcc7f,x,z, .4);}
        else if(data.pair===2){A.part(mesh,'cylinder',0x8eaa88,[x,.65,z],[.035,1.3,.035]);A.part(mesh,'ball',0xc4ad7f,[x,1.25,z],[.08,.18,.08]);A.part(mesh,'pebble',0xa9b7ad,[x,.18,z+.3],[.3,.2,.35]);}
        else{A.part(mesh,'cylinder',0x8b8191,[x,.7,z],[.055,1.4,.055]);A.part(mesh,'ball',0xf1d48b,[x,1.5,z],[.17,.24,.17]);}
      }
      const label=world.label(mesh,this.names[data.to],3.9);label.enabled=false;
      return {...data,id:'travel-'+data.to,mesh,barrier,collider,chevrons,label,position:mesh.position,arrival:{x:data.x-data.dx*2.8,z:data.z-data.dz*2.8}};
    });
    if(chapter===3){
      world.path([[5,4.2],[4,7],[0,10]],1.8);world.path([[5,-12],[3,-15],[0,-18]],1.8);
      world.returnBridge=A.group(world.root,5,-4.2);world.returnBridge.visible=false;
      for(let i=0;i<48;i++)A.part(world.returnBridge,'box',i%2?0xc4ac83:0xb19c78,[0,.16,-7.2+i*.31],[1.85,.16,.29]);
      for(const x of [-.99,.99]){A.part(world.returnBridge,'box',0x9a8970,[x,.8,0],[.06,.06,15]);for(let z=-7;z<=7;z+=2)A.part(world.returnBridge,'cylinder',0x9a8970,[x,.45,z],[.05,.85,.05]);}
      world.mapRoutes.push({points:[[5,3.4],[5,-11.6]],width:1.8,unlocked:4});
    }
  }
  constructor(game){
    this.game=game;this.selected=0;this.active=null;this.cooldown=0;this.overlay=document.getElementById('travel-fade');
    document.getElementById('map-back').onclick=()=>this.point(-1);document.getElementById('map-next').onclick=()=>this.point(1);
    document.getElementById('ending-explore').onclick=()=>this.explore();
  }
  sync(){
    const g=this.game,unlocked=Meadow.Travel.unlocked(g.state);
    for(const gate of g.world.portals||[]){gate.open=gate.to<=unlocked;gate.barrier.visible=!gate.open;gate.chevrons.visible=gate.open;gate.collider.disabled=gate.open;}
    g.world.returnCrossing=unlocked>=4;
    if(g.world.returnBridge)g.world.returnBridge.visible=g.world.returnCrossing;
    document.getElementById('map-place').textContent=Meadow.Travel.names[g.state.chapter];
    for(const [id,direction] of [['map-back',-1],['map-next',1]]){
      const button=document.getElementById(id),to=g.state.chapter+direction,gate=g.world.portals?.find(p=>p.to===to);
      button.hidden=!gate;button.disabled=!!gate&&!gate.open;
      button.textContent=direction<0?'← '+(Meadow.Travel.icons[to]||''):(Meadow.Travel.icons[to]||'')+' →';
      button.setAttribute('aria-label',(gate?.open?'指向':'尚未開通：')+(Meadow.Travel.names[to]||'')+'入口');
      button.setAttribute('aria-pressed',String(this.selected===to));button.title=Meadow.Travel.names[to]||'';
    }
    document.querySelectorAll('#route-strip span').forEach((el,i)=>{el.classList.toggle('here',i+1===g.state.chapter);el.classList.toggle('open',i+1<=unlocked);el.setAttribute('aria-current',i+1===g.state.chapter?'location':'false');});
  }
  point(direction){
    const to=this.game.state.chapter+direction,gate=this.game.world.portals.find(p=>p.to===to);
    if(!gate?.open)return;this.selected=this.selected===to?0:to;this.game.refresh();
  }
  target(){
    const g=this.game,to=this.selected||(g.chapterComplete()&&g.state.chapter<4?g.state.chapter+1:0),gate=g.world.portals?.find(p=>p.to===to);
    if(!gate?.open)return null;
    let position=gate.position;const p=g.player.mesh.position;
    // Guide travellers via the open return bridge, never straight through the river.
    if(g.state.chapter===3&&g.world.returnCrossing){
      if(gate.z>3.2&&p.z<3.4)position=new THREE.Vector3(5,0,p.z<-11.8&&Math.abs(p.x-5)>1?-12.2:4.2);
      else if(gate.z<-11.4&&p.z>-11.8)position=new THREE.Vector3(5,0,p.z>3.4&&Math.abs(p.x-5)>1?4.2:-12.2);
    }
    return {position,label:gate.label,text:Meadow.Travel.names[to],gate};
  }
  candidates(){return (this.game.world.portals||[]).map(p=>({...p,text:(p.open?'':'🔒 ')+Meadow.Travel.icons[p.to]+' '+Meadow.Travel.names[p.to]}));}
  go(to){
    const g=this.game,from=g.state.chapter;
    if(this.active||!['playing','complete'].includes(g.state.mode)||Math.abs(to-from)!==1||to<1||to>4)return;
    if(to>Meadow.Travel.unlocked(g.state)){this.selected=0;g.refresh();g.toast(['','先點亮引路燈','先走完河上跳石','先到河的對岸'][from]||'先完成這一段',2000);return;}
    this.active={to,from,time:0,loaded:false,first:!g.state.visited[to-1]};g.state.mode='travel';g.input.reset();g.voices.stop();
    g.toastDeadline=0;document.getElementById('toast').hidden=true;
    this.overlay.hidden=false;this.overlay.style.opacity='0';document.getElementById('travel-place').textContent=Meadow.Travel.icons[to]+' '+Meadow.Travel.names[to];
    document.body.classList.add('travelling');document.getElementById('ending-screen').hidden=true;g.interactions.update();
  }
  explore(){
    const g=this.game;if(g.state.mode!=='complete')return;
    document.getElementById('ending-screen').hidden=true;g.state.mode='playing';g.input.reset();
    for(const id of ['play-hud','mobile-controls','pause-btn'])document.getElementById(id).hidden=false;
    g.refresh();g.saveProgress();
  }
  update(dt){
    const g=this.game;
    if(this.active){
      const trip=this.active;trip.time+=dt;const mid=g.reducedMotion?.04:.24,end=g.reducedMotion?.14:.6;
      this.overlay.style.opacity=String(trip.time<mid?trip.time/mid:Math.max(0,(end-trip.time)/(end-mid)));
      if(!trip.loaded&&trip.time>=mid){
        trip.loaded=true;g.state.chapter=trip.to;g.state.visited[trip.to-1]=true;g.loadWorld(trip.to);this.selected=0;this.sync();
        const gate=g.world.portals.find(p=>p.to===trip.from),p=gate.arrival;
        g.player.setPosition(p.x,p.z);g.placeCompanion();g.player.mesh.rotation.y=Math.atan2(-gate.dx,-gate.dz);g.view.update(1,false,true);g.checkpoint(p.x,p.z);
      }
      if(trip.time>=end){
        this.active=null;this.cooldown=g.time+1;this.overlay.hidden=true;document.body.classList.remove('travelling');g.state.mode='playing';g.input.reset();
        for(const id of ['play-hud','pause-btn','mobile-controls'])document.getElementById(id).hidden=false;
        if(trip.first&&trip.to>trip.from)g.story.intro();
      }
      return;
    }
    const p=g.player.mesh.position;
    for(const gate of g.world.portals||[]){
      const dx=p.x-gate.x,dz=p.z-gate.z;gate.label.enabled=g.state.mode==='playing'&&Math.hypot(dx,dz)<7;
      if(g.state.mode!=='playing'||g.time<this.cooldown||!gate.open)continue;
      const forward=dx*gate.dx+dz*gate.dz,side=Math.abs(dx*gate.dz-dz*gate.dx),move=g.input.movement();
      if(forward>.35&&forward<2&&side<1.5&&move.x*gate.dx+move.z*gate.dz>.2){this.go(gate.to);break;}
    }
  }
};

Meadow.JourneyUI={
  summary(g){
    const s=g.state,c=s.chapter,route=g.travel?.target();if(route)return '↗ '+route.text;
    if(c===1)return !s.ribbon?'⋈ 找髮帶':!s.metRabbit?'💬 阿蹦':!s.metHedgehog?'💬 栗栗':!s.windSolved?'✣ 修風管':s.flowers.length<3?'✿ '+s.flowers.length+' / 3':!s.lit?'✦ 點燈':'✿ 自由探索';
    if(c===2){const f=s.forest;return !f.metOwl?'💬 咕咕':f.round<3?'♬ '+f.round+' / 3':f.gustStage<6?'≋ 疾風小徑':!f.reunited?'♡ 媽媽':!f.routeKnown?'💬 咕咕':f.dashStage<3?'◒ 河上跳石':'♬ 自由探索';}
    if(c===3){const v=s.valley;return !v.metBeaver?'💬 木木':v.bridge<3?'⚒ 修橋 '+v.bridge+' / 3':v.raft<4?'≋ 渡河 '+v.raft+' / 4':'≋ 自由探索';}
    const h=s.hill;return !h.metSquirrel?'💬 星星':h.lights.length<3?'✦ '+h.lights.length+' / 3':!h.reunited?'♡ 保護媽媽':h.completed?'♡ 一起散步':'⌂ 回家';
  }
};
