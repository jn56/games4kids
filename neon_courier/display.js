'use strict';
// Browser fullscreen is optional; the landscape gate works without it.
NC.Display=class {
  constructor(onBlock){
    this.onBlock=onBlock;this.blocked=false;this.busy=false;
    this.gate=document.getElementById('rotate-screen');
    this.status=document.getElementById('display-status');
    this.buttons=[...document.querySelectorAll('[data-fullscreen]')];
    this.surfaces=[...document.querySelectorAll('.masthead,#cover,#hud,#touch-controls,#pause-panel,#result,#info-panel')];
    this.coarse=matchMedia('(pointer: coarse)');
    this.buttons.forEach(button=>button.addEventListener('click',()=>this.toggleFullscreen()));
    window.addEventListener('resize',()=>this.update());
    screen.orientation?.addEventListener('change',()=>this.update());
    this.coarse.addEventListener('change',()=>this.update());
    for(const event of ['fullscreenchange','webkitfullscreenchange'])document.addEventListener(event,()=>{this.syncFullscreen();this.update();});
    this.syncFullscreen();this.update();
  }
  update(){
    const blocked=this.coarse.matches&&innerHeight>innerWidth;
    if(blocked===this.blocked)return;
    this.blocked=blocked;this.gate.hidden=!blocked;
    if(blocked){
      this.previousFocus=document.activeElement;this.onBlock();
      this.surfaces.forEach(el=>el.inert=true);
      this.gate.querySelector('button').focus({preventScroll:true});
    }else{
      this.surfaces.forEach(el=>el.inert=false);
      const resume=document.getElementById('resume');
      const target=resume.getClientRects().length?resume:this.previousFocus;
      if(target?.getClientRects().length)target.focus({preventScroll:true});
    }
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
        if(!request){this.message('此瀏覽器不支援全螢幕，橫放手機即可遊玩。');return;}
        await request.call(root);
        if(this.coarse.matches&&this.fullscreenElement()){
          try{await screen.orientation?.lock?.('landscape');}catch{/* Portrait gate remains available when locking is unsupported. */}
        }
      }
    }catch{this.message('無法開啟或切換全螢幕，仍可橫放手機遊玩。');}
    finally{this.busy=false;this.syncFullscreen();this.update();}
  }
};
