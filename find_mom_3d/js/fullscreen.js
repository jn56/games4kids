'use strict';
Meadow.Fullscreen=class {
  constructor(game){
    this.game=game;this.button=document.getElementById('fullscreen-btn');this.busy=false;
    this.button.addEventListener('click',()=>this.toggle());
    for(const event of ['fullscreenchange','webkitfullscreenchange'])document.addEventListener(event,()=>{
      game.input.reset();this.sync();game.renderer.setSize(innerWidth,innerHeight);game.view.resize();
    });
    this.sync();
  }
  active(){return !!(document.fullscreenElement||document.webkitFullscreenElement);}
  sync(){
    const active=this.active(),label=active?'離開全螢幕':'全螢幕';
    this.button.setAttribute('aria-pressed',String(active));this.button.setAttribute('aria-label',label);this.button.title=label;
  }
  async toggle(){
    if(this.busy)return;
    const active=this.active(),target=active?document:document.documentElement;
    const method=active?(document.exitFullscreen||document.webkitExitFullscreen):(target.requestFullscreen||target.webkitRequestFullscreen);
    if(!method){this.game.toast('此瀏覽器不支援全螢幕。',2600);return;}
    this.busy=true;this.button.disabled=true;this.game.input.reset();
    try{await method.call(target);}
    catch(_){this.game.toast('暫時無法切換全螢幕，請再試一次。',2600);}
    finally{this.busy=false;this.button.disabled=false;this.sync();this.button.blur();}
  }
};
