'use strict';
// Small swept steps keep fast movement inside banks and gates. Contacts slide;
// an existing overlap may be left, but may never be made deeper.
Meadow.Motion={
  blocked(c,x,z,ignore,origin){
    if(c.disabled||c===ignore)return false;
    const radius=c.r+CONFIG.PLAYER_RADIUS,d=Math.hypot(x-c.x,z-c.z);
    if(d>=radius)return false;
    return !origin||d<=Math.hypot(origin.x-c.x,origin.z-c.z)+.000001;
  },
  move(world,p,dx,dz,ignore=null){
    if(Math.hypot(dx,dz)<.0000001)return;
    const count=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.1));
    for(let i=0;i<count;i++){
      const sx=dx/count,sz=dz/count,origin={x:p.x,z:p.z};
      const clear=(x,z)=>world.canWalk(x,z,ignore,origin);
      if(clear(p.x+sx,p.z+sz)){p.x+=sx;p.z+=sz;continue;}
      let slid=false;
      for(const c of world.colliders){
        if(!this.blocked(c,p.x+sx,p.z+sz,ignore,origin))continue;
        const distance=Math.hypot(p.x-c.x,p.z-c.z);if(distance<.001)continue;
        const nx=(p.x-c.x)/distance,nz=(p.z-c.z)/distance,dot=sx*nx+sz*nz;
        const tx=sx-Math.min(0,dot)*nx,tz=sz-Math.min(0,dot)*nz;
        if(Math.hypot(tx,tz)>.00001&&clear(p.x+tx,p.z+tz)){p.x+=tx;p.z+=tz;slid=true;break;}
      }
      if(slid)continue;
      if(sx&&clear(p.x+sx,p.z))p.x+=sx;
      if(sz&&clear(p.x,p.z+sz))p.z+=sz;
    }
  }
};
