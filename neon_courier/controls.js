'use strict';
// A captured, single-finger stick. A dead zone plus hysteresis prevents thumb jitter
// from alternating lanes; a held direction repeats after a deliberate short delay.
NC.TouchStick=class {
  constructor(pad,knob,{active,steer,axes,unlock}){
    Object.assign(this,{pad,knob,active,steer,axes,unlock});this.pointer=null;this.x=this.y=this.direction=this.repeat=0;
    pad.addEventListener('pointerdown',e=>{
      if(!this.active()||this.pointer!==null)return;e.preventDefault();this.pointer=e.pointerId;pad.setPointerCapture(e.pointerId);pad.classList.add('engaged');this.unlock();this.move(e);
    });
    pad.addEventListener('pointermove',e=>{if(e.pointerId===this.pointer){e.preventDefault();this.move(e);}});
    for(const type of ['pointerup','pointercancel','lostpointercapture'])pad.addEventListener(type,e=>{if(e.pointerId===this.pointer)this.reset();});
  }
  move(e){
    const r=this.pad.getBoundingClientRect(),radius=r.width*.34,dx=e.clientX-r.x-r.width/2,dy=e.clientY-r.y-r.height/2,length=Math.hypot(dx,dy),scale=length>radius?radius/length:1;
    this.x=dx*scale/radius;this.y=dy*scale/radius;this.knob.style.transform=`translate(${dx*scale}px,${dy*scale}px)`;
    const direction=Math.abs(this.x)>.32?Math.sign(this.x):Math.abs(this.x)<.18?0:this.direction;
    if(direction!==this.direction){this.direction=direction;this.repeat=.28;if(direction)this.steer(direction);}
    this.axes(Math.abs(this.x)<.65&&this.y<-.65,Math.abs(this.x)<.65&&this.y>.65);
  }
  update(dt){if(this.pointer===null||!this.direction)return;this.repeat-=dt;if(this.repeat<=0){this.steer(this.direction);this.repeat=.23;}}
  reset(){const pointer=this.pointer;this.pointer=null;this.x=this.y=this.direction=this.repeat=0;this.knob.style.transform='';this.pad.classList.remove('engaged');this.axes(false,false);if(pointer!==null&&this.pad.hasPointerCapture(pointer))this.pad.releasePointerCapture(pointer);}
};
