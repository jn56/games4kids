'use strict';
Meadow.Audio = class {
  constructor() { this.enabled=false;this.context=null;this.nextMusic=0;this.index=0;this.paused=false;this.mood='calm';this.musicVoices=new Set(); }
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
  note(freq,duration=.5,volume=.05,delay=0,music=false) {
    if(!this.enabled||!this.context||this.paused)return;
    const time=this.context.currentTime+delay,osc=this.context.createOscillator(),gain=this.context.createGain();
    osc.type=music&&this.mood==='tension'?'triangle':'sine';osc.frequency.value=freq;
    gain.gain.setValueAtTime(0,time);gain.gain.linearRampToValueAtTime(volume,time+.025);gain.gain.exponentialRampToValueAtTime(.0001,time+duration);
    osc.connect(gain);gain.connect(this.master);osc.start(time);osc.stop(time+duration+.05);
    const voice={osc,gain};if(music)this.musicVoices.add(voice);
    osc.onended=()=>{this.musicVoices.delete(voice);osc.disconnect();gain.disconnect();};
  }
  chime() { [523.25,659.25,783.99].forEach((f,i)=>this.note(f,.8,.05,i*.13)); }
  setMood(mood) {
    if(mood===this.mood)return;
    this.mood=mood;this.index=0;this.nextMusic=0;
    // Fade only music voices; dialogue cues and played bells keep their own envelopes.
    if(this.context){const now=this.context.currentTime;for(const {osc,gain} of this.musicVoices){gain.gain.cancelScheduledValues(now);gain.gain.setTargetAtTime(0,now,.08);osc.stop(now+.35);}this.musicVoices.clear();}
  }
  update(time,playing,mood='calm') {
    this.setMood(mood);
    if(!playing||!this.enabled||this.paused||time<this.nextMusic)return;
    if(this.mood==='tension'){
      const pulse=[146.83,220,155.56,220,164.81,220,155.56,207.65],beat=this.index++;
      this.note(pulse[beat%pulse.length],.2,.032,0,true);
      if(beat%4===0)this.note(beat%8===0?73.42:77.78,.7,.045,0,true);
      this.nextMusic=time+.3;
    }else{
      const melody=[261.63,329.63,392,329.63,293.66,349.23,440,392];
      this.note(melody[this.index++%melody.length],2.3,.024,0,true);this.nextMusic=time+2.6;
    }
  }
};
