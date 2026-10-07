'use strict';
Meadow.ForestRescue=class {
  static lines={
    retreat:[['灰爪','讓開！我要帶走那個女孩！'],['媽媽','不准碰她！小米，退到咕咕身邊！'],['小米','媽媽，你也一起來！'],['媽媽','我會想辦法。先到安全的地方！']],
    whistle:[['灰爪','放開我的手！'],['媽媽','只要你還想抓她，我就不放！'],['小米','咕咕，我們怎麼幫媽媽？'],['咕咕','吹三聲求救哨，請河谷的朋友接應！']],
    helped:[['小米','木木！河邊有人需要幫忙！'],['灰爪','誰在吹哨？'],['媽媽','咕咕，帶小米離開河邊！']],
    shout:[['媽媽','小米，快逃啊！']]
  };
  constructor(story){
    this.story=story;this.game=story.game;this.panel=document.getElementById('rescue-ui');this.button=document.getElementById('rescue-action');this.reset();
    this.button.addEventListener('pointerdown',e=>{if(this.kind==='retreat'){this.held=true;this.button.setPointerCapture(e.pointerId);}});
    for(const type of ['pointerup','pointercancel','lostpointercapture'])this.button.addEventListener(type,()=>this.release());
    this.button.onclick=()=>this.press();
    window.addEventListener('blur',()=>this.release());
  }
  reset(){this.kind=null;this.done=new Set();this.progress=0;this.held=false;this.panel.hidden=true;}
  release(){this.held=false;}
  begin(kind){
    this.kind='dialogue';this.done.add(kind);document.getElementById('story-caption').hidden=true;
    this.story.say(Meadow.ForestRescue.lines[kind],()=>{
      this.kind=kind;this.progress=0;this.game.state.mode='cutscene';this.panel.hidden=false;
      document.getElementById('rescue-title').textContent=kind==='retreat'?'到咕咕身邊':'吹哨求援';
      this.button.textContent=kind==='retreat'?'按住 → / D':'吹哨 · E';this.render();this.button.focus({preventScroll:true});
    });
  }
  press(){
    if(this.game.state.mode!=='cutscene'||!['retreat','whistle'].includes(this.kind))return;
    if(this.kind==='retreat')this.progress=Math.min(1,this.progress+.22);
    else {this.progress++;this.game.audio.note(1174,.23,.08);this.game.world.owl.mesh.rotation.y=-Math.PI/2;this.game.world.villain.mesh.rotation.y=Math.PI/2;}
    this.render();
  }
  render(){document.getElementById('rescue-progress').value=this.kind==='retreat'?this.progress:this.progress/3;}
  update(dt){
    if(this.kind==='retreat'){
      if(this.held||this.game.input.movement().x>.2)this.progress=Math.min(1,this.progress+dt*.75);
      this.game.player.mesh.position.x=3.2+2.1*this.progress;this.game.player.mesh.rotation.y=Math.PI/2;
      if(!this.game.reducedMotion)this.game.player.legs.forEach((leg,i)=>leg.rotation.x=Math.sin(this.game.time*11+i*Math.PI)*.4);
      this.render();
    }
    if(this.progress<(this.kind==='whistle'?3:1))return;
    const whistle=this.kind==='whistle';this.kind=null;this.release();this.panel.hidden=true;this.game.input.reset();this.button.blur();
    if(whistle)this.story.say(Meadow.ForestRescue.lines.helped,()=>{this.game.state.mode='cutscene';document.getElementById('story-caption').hidden=false;});
    else {document.getElementById('story-caption').hidden=false;this.game.audio.chime();}
  }
};
