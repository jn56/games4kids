'use strict';
Meadow.Audio = class {
  constructor() { this.enabled=false;this.context=null;this.nextMusic=0;this.index=0;this.paused=false; }
  async toggle() {
    if(!this.context){
      const AudioContext=window.AudioContext||window.webkitAudioContext;
      if(!AudioContext)return false;
      try{this.context=new AudioContext();this.master=this.context.createGain();this.master.gain.value=.65;this.master.connect(this.context.destination);}catch(_){return false;}
    }
    this.enabled=!this.enabled;
    try{if(this.context.state==='suspended')await this.context.resume();}catch(_){this.enabled=false;}
    this.master.gain.setTargetAtTime(this.enabled&&!this.paused?.65:0,this.context.currentTime,.05);
    if(this.enabled)this.chime();return this.enabled;
  }
  setPaused(value) { this.paused=value;if(this.context)this.master.gain.setTargetAtTime(this.enabled&&!value?.65:0,this.context.currentTime,.05); }
  note(freq,duration=.5,volume=.05,delay=0) {
    if(!this.enabled||!this.context||this.paused)return;
    const time=this.context.currentTime+delay,osc=this.context.createOscillator(),gain=this.context.createGain();
    osc.type='sine';osc.frequency.value=freq;
    gain.gain.setValueAtTime(0,time);gain.gain.linearRampToValueAtTime(volume,time+.025);gain.gain.exponentialRampToValueAtTime(.0001,time+duration);
    osc.connect(gain);gain.connect(this.master);osc.start(time);osc.stop(time+duration+.05);
    osc.onended=()=>{osc.disconnect();gain.disconnect();};
  }
  chime() { [523.25,659.25,783.99].forEach((f,i)=>this.note(f,.8,.05,i*.13)); }
  update(time,playing) {
    if(!playing||!this.enabled||this.paused||time<this.nextMusic)return;
    const melody=[261.63,329.63,392,329.63,293.66,349.23,440,392];
    this.note(melody[this.index++%melody.length],2.3,.024);this.nextMusic=time+2.6;
  }
};
