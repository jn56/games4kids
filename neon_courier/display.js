'use strict';
// Rotate the entire touch viewport when needed; no fullscreen permission is required.
NC.Display=class {
  constructor(onRotate){
    this.onRotate=onRotate;this.busy=false;
    this.stage=document.getElementById('game-stage');
    this.status=document.getElementById('display-status');
    this.buttons=[...document.querySelectorAll('[data-fullscreen]')];
    this.coarse=matchMedia('(pointer: coarse)');
    this.buttons.forEach(button=>button.addEventListener('click',()=>this.toggleFullscreen()));
    window.addEventListener('resize',()=>this.update());
    screen.orientation?.addEventListener('change',()=>this.update());
    this.coarse.addEventListener('change',()=>this.update());
    for(const event of ['fullscreenchange','webkitfullscreenchange'])document.addEventListener(event,()=>{this.syncFullscreen();this.update();});
    this.syncFullscreen();this.update();
  }
  update(){
    const rotated=this.coarse.matches&&innerHeight>innerWidth;
    if(this.rotated!==undefined&&rotated!==this.rotated)this.onRotate();
    this.rotated=rotated;this.stage.dataset.rotated=String(rotated);
    this.stage.style.width=(rotated?innerHeight:innerWidth)+'px';
    this.stage.style.height=(rotated?innerWidth:innerHeight)+'px';
  }
  fullscreenElement(){return document.fullscreenElement||document.webkitFullscreenElement;}
  syncFullscreen(){
    const active=!!this.fullscreenElement();
    for(const button of this.buttons){
      button.setAttribute('aria-pressed',String(active));
      button.setAttribute('aria-label',active?'離開全螢幕':'全螢幕');
      button.title=active?'離開全螢幕':'全螢幕';
      button.innerHTML=button.id==='fullscreen'?(active?'⊡':'⛶'):(active?'離開全螢幕':'全螢幕 ↗');
    }
  }
  message(text){
    clearTimeout(this.statusTimer);this.status.textContent=text;this.status.hidden=false;
    this.statusTimer=setTimeout(()=>this.status.hidden=true,4500);
  }
  async toggleFullscreen(){
    if(this.busy)return;this.busy=true;
    try{
      if(this.fullscreenElement()){
        await (document.exitFullscreen||document.webkitExitFullscreen).call(document);
        try{screen.orientation?.unlock?.();}catch{}
      }else{
        const root=document.documentElement,request=root.requestFullscreen||root.webkitRequestFullscreen;
        if(!request){this.message('此瀏覽器不支援全螢幕，仍可直接遊玩。');return;}
        await request.call(root);
        if(this.coarse.matches&&this.fullscreenElement()){
          try{await screen.orientation?.lock?.('landscape');}catch{/* The rotated stage already supplies a landscape layout. */}
        }
      }
    }catch{this.message('無法切換全螢幕，仍可直接遊玩。');}
    finally{this.busy=false;this.syncFullscreen();this.update();}
  }
};
