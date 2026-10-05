'use strict';
NC.Audio=class {
  constructor(enabled){this.enabled=enabled;this.context=null;this.clock=0;this.beat=0;this.active=false;this.nodes=new Set();}
  unlock(){try{const C=window.AudioContext||window.webkitAudioContext;if(!C)return;if(!this.context){this.context=new C();this.master=this.context.createGain();this.master.gain.value=this.enabled?.20:0;this.master.connect(this.context.destination);}this.context.resume().catch(()=>{});}catch{this.context=null;}}
  toggle(){this.enabled=!this.enabled;this.unlock();if(this.master)this.master.gain.setTargetAtTime(this.enabled?.20:0,this.context.currentTime,.04);return this.enabled;}
  note(hz,length=.12,type='sine',volume=.2,slide=0){
    const c=this.context;if(!this.enabled||!c||c.state!=='running')return;
    const o=c.createOscillator(),g=c.createGain(),now=c.currentTime;o.type=type;o.frequency.setValueAtTime(hz,now);if(slide)o.frequency.exponentialRampToValueAtTime(slide,now+length);
    g.gain.setValueAtTime(.001,now);g.gain.exponentialRampToValueAtTime(volume,now+.008);g.gain.exponentialRampToValueAtTime(.001,now+length);
    o.connect(g);g.connect(this.master);o.start();o.stop(now+length+.03);this.nodes.add(o);o.onended=()=>{o.disconnect();g.disconnect();this.nodes.delete(o);};
  }
  effect(kind){const notes={signal:[880,.08,'sine',.16,1320],jump:[220,.15,'triangle',.18,550],clear:[660,.15,'sine',.22,990],charge:[440,.24,'triangle',.2,880],delivery:[523,.28,'triangle',.22,1046],bump:[125,.07,'sine',.10,85],stumble:[165,.12,'sine',.18,110],start:[660,.2,'triangle',.2,880],finish:[784,.45,'triangle',.2,1568]};if(notes[kind])this.note(...notes[kind]);}
  quiet(){for(const node of this.nodes)try{node.stop();}catch{}this.nodes.clear();this.clock=0;this.active=false;}
  update(dt,active,boost){
    if(!active){if(this.active)this.quiet();this.active=false;return;}this.active=true;if(!this.enabled)return;
    this.clock-=dt;if(this.clock>0)return;this.clock=.25;const n=this.beat++%16;
    if(n%2===0)this.note(95,.13,'sine',.35,42);
    if(n%4===2)this.note(175,.045,'triangle',.09,130);
    const progression=[130.81,155.56,174.61,116.54],root=progression[Math.floor(this.beat/16)%4];
    this.note(root*[1,2,1.5,2.5,2,1.5,3,2][n%8]*(boost?2:1),.14,'triangle',.055);
  }
};
