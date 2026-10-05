'use strict';
// The stick can rotate freely, but only its left/right half controls movement.
// A small central dead zone avoids drift; vertical motion never changes speed.
NC.TouchStick=class {
  constructor(pad,knob,{active,axes,unlock}){
    Object.assign(this,{pad,knob,active,axes,unlock});this.pointer=null;this.x=this.y=this.direction=0;
    pad.addEventListener('pointerdown',e=>{
      if(!this.active()||this.pointer!==null)return;e.preventDefault();this.pointer=e.pointerId;pad.setPointerCapture(e.pointerId);pad.classList.add('engaged');this.unlock();this.move(e);
    });
    pad.addEventListener('pointermove',e=>{if(e.pointerId===this.pointer){e.preventDefault();this.move(e);}});
    for(const type of ['pointerup','pointercancel','lostpointercapture'])pad.addEventListener(type,e=>{if(e.pointerId===this.pointer)this.reset();});
  }
  move(e){
    const r=this.pad.getBoundingClientRect(),radius=r.width*.34,dx=e.clientX-r.x-r.width/2,dy=e.clientY-r.y-r.height/2,length=Math.hypot(dx,dy),scale=length>radius?radius/length:1;
    this.x=dx*scale/radius;this.y=dy*scale/radius;this.knob.style.transform=`translate(${dx*scale}px,${dy*scale}px)`;
    // Hysteresis around the vertical axis prevents tiny finger jitter flipping sides.
    if(length<radius*.18||Math.abs(dx)<Math.max(1,radius*.04))this.direction=0;
    else if(Math.abs(dx)>=Math.max(2,radius*.10))this.direction=Math.sign(dx);
    this.axes(this.direction);
  }
  reset(){const pointer=this.pointer;this.pointer=null;this.x=this.y=this.direction=0;this.knob.style.transform='';this.pad.classList.remove('engaged');this.axes(0);if(pointer!==null&&this.pad.hasPointerCapture(pointer))this.pad.releasePointerCapture(pointer);}
};
