'use strict';
Meadow.Routines={
  sync(world,state){
    const poses=(world.workers||[]).map(({actor})=>({actor,position:actor.mesh.position.clone()}));world.sync(state);
    if(world.cutscene)return;
    for(const {actor,position} of poses){const home=actor.routine.home,p=actor.mesh.position;if(Math.hypot(p.x-home.x,p.z-home.z)<.05&&world.canWalk(position.x,position.z))p.copy(position);}
  },
  jobs:{1:['garden','paint','sing','bake','sew'],2:['read','inspect','collect','chime','mail'],3:['cook','measure','fold','hammer','cook'],4:['tea','paint','mail','lantern','sew']},
  attach(world,npc,job,seed,main=false){
    const A=Meadow.Art,prop=A.group(npc.body,.5,.34);prop.position.y=.73;
    if(['garden','tea','collect','cook','bake'].includes(job)){
      A.part(prop,'cylinder',job==='garden'?0x81a6a3:0xcfb180,[0,0,0],[.2,.28,.2]);
      const spout=A.part(prop,'cylinder',0xaba27c,[.22,.07,0],[.055,.38,.055]);spout.rotation.z=-1;
      A.part(prop,'ball',0xe0c9a0,[0,.16,0],[.13,.04,.13]);
    }else if(['read','mail','fold'].includes(job)){
      A.part(prop,'box',0xe5d6b1,[0,0,0],[.46,.35,.06]);A.part(prop,'box',job==='read'?0x8c9cac:0xbb8b80,[0,0,.04],[.03,.31,.025]);
    }else if(job==='sew'){
      A.part(prop,'ball',npc.accent||0xc394a0,[0,0,0],[.22,.22,.22]);const needle=A.part(prop,'box',0xc6c7ba,[.04,.12,.05],[.025,.55,.025]);needle.rotation.z=.5;
    }else if(job==='lantern'||job==='chime'){
      A.part(prop,'box',0x9f9474,[0,.15,0],[.035,.5,.035]);A.part(prop,'ball',0xf3d590,[0,-.12,0],[.2,.27,.2]);
    }else{
      A.part(prop,'cylinder',0xa9916c,[0,.1,0],[.035,.65,.035]);
      A.part(prop,job==='hammer'?'box':'ball',job==='paint'?0x809aaf:0xb9bb9d,[0,.4,0],job==='hammer'?[.32,.15,.15]:[.09,.14,.07]);
    }
    npc.routine={job,seed,prop,main,clock:seed,wait:(seed%4)*.7,point:0,phase:0,blocked:0,home:{x:npc.mesh.position.x,z:npc.mesh.position.z},walking:false};
  },
  setup(world,chapter){
    world.residents.forEach((npc,i)=>this.attach(world,npc,this.jobs[chapter][i],chapter*7+i));
    const workers=chapter===1?[[world.hedgehog,'mail',()=>true],[world.rabbit,'garden',s=>!s.lit]]:chapter===2?[[world.owl,'inspect',s=>!s.forest.reunited]]:chapter===3?[[world.beaver,'hammer',()=>true]]:[[world.squirrel,'inspect',()=>true]];
    world.workers=workers.map(([actor,job,available],i)=>{this.attach(world,actor,job,chapter*3+i,true);return {actor,available};});
  },
  step(world,npc,dt,player,reduced){
    const r=npc.routine,p=npc.mesh.position,target=player.mesh.position;
    if(Math.hypot(p.x-r.home.x,p.z-r.home.z)>5){r.home={x:p.x,z:p.z};r.point=0;r.wait=1;}
    r.walking=false;r.clock+=dt;
    const reacting=(npc.reaction||0)>0;if(reacting)npc.reaction=Math.max(0,npc.reaction-dt);
    const nearby=reacting||Math.hypot(p.x-target.x,p.z-target.z)<2.55;
    if(nearby){npc.mesh.rotation.y=Math.atan2(target.x-p.x,target.z-p.z);}
    else if(r.wait>0){r.wait-=dt;npc.mesh.rotation.y=Math.atan2(r.home.x+1.8-p.x,r.home.z-1.1-p.z);}
    else{
      const points=r.main?[[1.2,0],[.2,1.2],[-.8,.8],[0,0]]:[[1.6,.35],[-.4,1.6],[-1.2,2.7],[0,0]],goal=points[r.point];
      const x=r.home.x+goal[0],z=r.home.z+goal[1],distance=Math.hypot(x-p.x,z-p.z);
      if(distance<.12){r.wait=2.4+(r.seed%4)*.5;r.point=(r.point+1)%points.length;r.blocked=0;}
      else{
        const angle=Math.atan2(x-p.x,z-p.z),step=Math.min(distance,dt*(npc.kind==='turtle'?.5:.74));
        for(const turn of [0,.55,-.55,1,-1]){
          const nx=p.x+Math.sin(angle+turn)*step,nz=p.z+Math.cos(angle+turn)*step;
          if(Math.hypot(nx-r.home.x,nz-r.home.z)>3.5||!world.canWalk(nx,nz,npc.collider))continue;
          p.x=nx;p.z=nz;npc.mesh.rotation.y=angle+turn;r.walking=true;r.phase+=step*12;r.blocked=0;break;
        }
        if(!r.walking){r.blocked+=dt;if(r.blocked>1){r.point=(r.point+1)%points.length;r.wait=.8;r.blocked=0;}}
      }
    }
    if(npc.dodge){const d=Math.hypot(npc.dodge.x-p.x,npc.dodge.z-p.z),t=Math.min(1,dt*2.8/Math.max(.01,d)),x=p.x+(npc.dodge.x-p.x)*t,z=p.z+(npc.dodge.z-p.z)*t;if(world.canWalk(x,z,npc.collider)){p.x=x;p.z=z;r.walking=true;r.phase+=dt*10;}else npc.dodge=null;if(d<.04)npc.dodge=null;}
    if(npc.collider){npc.collider.x=p.x;npc.collider.z=p.z;}
    const working=!nearby&&!r.walking&&r.wait>0,swing=reduced?0:r.walking?Math.sin(r.phase)*.4:0;
    npc.body.position.y=reduced?0:r.walking?Math.abs(Math.sin(r.phase))*.045:0;
    npc.body.rotation.x=working&&!reduced?.045+Math.sin(r.clock*2)*.035:0;
    npc.legs?.forEach((leg,i)=>leg.rotation.x=(i?1:-1)*swing);
    if(npc.kick>0){npc.kick=Math.max(0,npc.kick-dt);if(npc.legs?.[0])npc.legs[0].rotation.x=-.9;}
    npc.arms?.forEach((arm,i)=>arm.rotation.x=r.walking?(i?-1:1)*swing:working&&!reduced?-.45+Math.sin(r.clock*3+i)*.18:0);
    if(reacting&&npc.arms?.[0])npc.arms[0].rotation.x=-2.2+(reduced?0:Math.sin(r.clock*9)*.2);
    r.prop.rotation.x=reduced?0:working?Math.sin(r.clock*(r.job==='hammer'?5:2.3))*.3:swing*.3;
    r.prop.rotation.z=working&&['garden','tea'].includes(r.job)?-.5:0;
    r.activity=nearby?'chat':r.walking?'walk':working?'work':'rest';
  },
  update(world,dt,player,state,reduced){
    if(!['playing','dialogue'].includes(state.mode))return;
    for(const npc of [...(world.residents||[]),...(world.locals||[])])this.step(world,npc,dt,player,reduced);
    for(const {actor,available} of world.workers||[]){
      actor.routine.prop.visible=!world.cutscene&&available(state);
      if(actor.routine.prop.visible)this.step(world,actor,dt,player,reduced);
    }
  }
};
