'use strict';
// A single capture-phase router prevents Space from triggering two subsystems.
Meadow.ControlsV2=class {
  constructor(game){
    this.game=game;
    this.editing=null;
    document.addEventListener('pointerdown',e=>{if(e.target.matches?.('input:not([type=checkbox]),textarea'))this.editing=e.target;},true);
    window.addEventListener('keydown',e=>this.key(e),true);
    window.addEventListener('keyup',e=>{game.input.keys.delete(e.code);if(e.code==='Space')game.trials.release();},true);
    window.addEventListener('blur',()=>{game.input.reset();if(['playing','dialogue','puzzle','action','journey','cutscene'].includes(game.state.mode))game.togglePause();});
    const paused=(id,fn)=>document.getElementById(id).onclick=()=>{game.togglePause();fn();};
    paused('pause-missions',()=>game.errands.open());paused('pause-journal',()=>document.getElementById('journal-btn').click());
    const info=document.getElementById('game-info');
    document.getElementById('pause-info').onclick=()=>{info.showModal();info.scrollTop=0;document.getElementById('info-close').focus({preventScroll:true});};
    document.getElementById('info-close').onclick=()=>info.close();
    info.addEventListener('close',()=>document.getElementById('pause-info').focus({preventScroll:true}));
    document.getElementById('pause-more').onclick=()=>this.settings(document.getElementById('pause-settings').hidden);
    document.getElementById('pause-voices').onclick=()=>game.voices.open();
    document.getElementById('pause-sound').onclick=()=>document.getElementById('sound-btn').click();
    document.getElementById('pause-jog').onclick=()=>{game.input.autoJog=game.input.autoJog===false;this.labels();game.polish.save();};
    document.getElementById('pause-events').onclick=()=>{game.living.enabled=!game.living.enabled;game.living.reset();this.labels();game.polish.save();};
    document.getElementById('pause-motion').onclick=()=>{game.reducedMotion=!game.reducedMotion;this.labels();game.polish.save();};
    document.getElementById('pause-quality').onclick=()=>{game.polish.low=!game.polish.low;game.polish.quality();game.polish.save();this.labels();};
    paused('pause-drop',()=>game.sandbox.release(false,game.sandbox.held?'held':null));
    document.getElementById('pause-map').onclick=()=>{document.getElementById('minimap-toggle').click();this.labels();};
    document.getElementById('pause-fullscreen').onclick=()=>game.fullscreen.toggle();
    document.getElementById('pause-bell').onclick=()=>{game.togglePause();game.sandbox.ringBell();};
    paused('pause-leave-challenge',()=>{if(game.state.mode==='puzzle'){if(game.song.active)game.song.close();else game.challenges.close();}else if(game.state.mode==='action')game.trials.leave();else if(game.state.mode==='journey')game.expedition.leave();});
    document.getElementById('touch-action').onclick=()=>{if(game.state.mode==='playing')this.exploreAction();};
    this.labels();document.getElementById('start-btn').focus({preventScroll:true});
  }
  settings(open){
    document.getElementById('pause-settings').hidden=!open;
    const button=document.getElementById('pause-more');button.setAttribute('aria-expanded',String(open));button.textContent=open?'收起其他設定 −':'其他設定 ＋';
    if(!open)document.querySelector('#pause-screen .paper-modal').scrollTop=0;
  }
  labels(){
    const g=this.game;
    document.getElementById('pause-jog').textContent='移動：'+(g.input.autoJog===false?'散步':'輕快跑步');
    document.getElementById('pause-events').textContent='即時事件：'+(g.living.enabled?'開啟':'關閉');
    document.getElementById('pause-motion').textContent='減少動態：'+(g.reducedMotion?'開啟':'關閉');
    document.getElementById('pause-quality').textContent='畫質：'+(g.polish?.low?'流暢':'精緻');
    document.getElementById('pause-map').textContent='小地圖：'+(g.minimap.collapsed?'展開':'收起');
    const mode=g.beforePause||'playing';
    for(const id of ['pause-missions','pause-journal'])document.getElementById(id).disabled=mode!=='playing';
    document.getElementById('pause-drop').disabled=mode!=='playing'||!g.sandbox.held&&!g.sandbox.riding&&!g.sandbox.seated;
    document.getElementById('pause-bell').disabled=mode!=='playing'||!g.sandbox.riding;
    document.getElementById('pause-leave-challenge').disabled=!['puzzle','action','journey'].includes(mode);
    for(const id of ['pause-drop','pause-bell','pause-leave-challenge']){const button=document.getElementById(id);button.hidden=button.disabled;}
  }
  scope(){
    const g=this.game;
    for(const id of ['game-info','character-studio','voice-studio','chapter-picker','errand-board'])if(document.getElementById(id).open)return document.getElementById(id);
    const id={title:'title-screen',paused:'pause-screen',complete:'ending-screen',error:'error-screen',dialogue:'dialogue-ui',puzzle:g.song.active?'song-screen':'puzzle-screen',action:'action-ready',journey:'journey-ready'}[g.state.mode];
    return id?document.getElementById(id):null;
  }
  controls(scope){return [...scope.querySelectorAll('button,a,select,input:not([type=file])')].filter(el=>!el.disabled&&el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden');}
  focus(el){el?.focus({preventScroll:true});el?.scrollIntoView({block:'nearest',inline:'nearest'});}
  navigate(code,scope){
    const list=this.controls(scope);if(!list.length)return;
    const current=document.activeElement,index=list.indexOf(current),forward=['ArrowRight','ArrowDown'].includes(code);
    if(index<0){this.focus(list[0]);return;}
    // Up/down scan every control, even in a long scrolling menu. Left/right
    // also move between columns; the 4×4 wind board uses real row navigation.
    if(current.dataset.tile!==undefined){
      const tile=Number(current.dataset.tile),step={ArrowLeft:-1,ArrowRight:1,ArrowUp:-4,ArrowDown:4}[code],next=tile+step;
      if(next>=0&&next<16){this.focus(scope.querySelector(`[data-tile="${next}"]`));return;}
    }
    this.focus(list[(index+list.length+(forward?1:-1))%list.length]);
  }
  exploreAction(){
    const g=this.game;if(g.living.respond())return;
    g.interactions.update();if(g.interactions.current)g.interactions.act();else g.living.hop();
  }
  key(e){
    const g=this.game,code=e.code;if(e.ctrlKey||e.metaKey||e.altKey)return;
    const textField=e.target instanceof HTMLElement&&e.target.matches('input:not([type=checkbox]),textarea');
    if(textField&&code==='Escape'){e.preventDefault();e.stopImmediatePropagation();this.editing=null;e.target.blur();return;}
    const editing=textField&&(this.editing===e.target||!['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(code));
    if(editing){this.editing=e.target;e.stopImmediatePropagation();return;}
    if(!['Space','Escape','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyA','KeyS','KeyD','KeyE','KeyQ','KeyH','KeyW','ShiftLeft','ShiftRight','Digit1','Digit2','Digit3'].includes(code))return;
    e.preventDefault();e.stopImmediatePropagation();
    if(code==='Escape'){
      if(e.repeat)return;const modal=document.querySelector('dialog[open]');if(modal){if(modal.id==='errand-board')g.errands.close();else modal.close();return;}
      g.togglePause();if(g.state.mode==='paused')this.labels();return;
    }
    if(['KeyE','KeyQ','KeyH','KeyW','ShiftLeft','ShiftRight','Digit1','Digit2','Digit3'].includes(code))return;
    if(['KeyA','KeyS','KeyD'].includes(code)){
      if(g.state.mode==='playing'&&code==='KeyS'&&!e.repeat){if(g.sandbox.held)g.sandbox.release(false,'held');else if(g.sandbox.riding)g.sandbox.ringBell();}return;
    }
    const mode=g.state.mode;
    const scope=this.scope();
    const modal=document.querySelector('dialog[open]');
    if(mode==='playing'&&!modal){
      if(code.startsWith('Arrow')){g.input.keys.add(code);document.activeElement?.blur();}
      else if(code==='Space'&&!e.repeat)this.exploreAction();return;
    }
    if(mode==='action'&&g.trials.started&&!modal){
      if(['ArrowLeft','ArrowRight'].includes(code)&&!e.repeat)g.trials.steer(code==='ArrowLeft'?-1:1);
      else if(code==='Space'&&!e.repeat)g.trials.requestDash();return;
    }
    if(mode==='journey'&&g.expedition.running&&!modal){
      if(code.startsWith('Arrow'))g.input.keys.add(code);else if(code==='Space'&&!e.repeat)g.expedition.strike();return;
    }
    if(mode==='cutscene'&&!modal){
      if(code.startsWith('Arrow'))g.input.keys.add(code);
      else if(code==='Space'&&!e.repeat){if(g.prologue.active)g.prologue.finish();else if(g.state.chapter===2)g.story.rescue.press();}return;
    }
    if(!scope)return;
    if(code.startsWith('Arrow')){
      if(e.target instanceof HTMLSelectElement&&['ArrowUp','ArrowDown'].includes(code)){
        const select=e.target,index=Math.max(0,Math.min(select.options.length-1,select.selectedIndex+(code==='ArrowUp'?-1:1)));
        select.selectedIndex=index;select.dispatchEvent(new Event('change',{bubbles:true}));return;
      }
      this.navigate(code,scope);return;
    }
    if(code==='Space'&&!e.repeat){
      const list=this.controls(scope),active=list.includes(document.activeElement)?document.activeElement:list[0];
      if(active?.matches('input[type=checkbox],button,a'))active.click();
      else if(active?.matches('input,select')){this.focus(active);if(active.matches('input')){this.editing=active;active.select();}}
      // Dynamic puzzle markup may replace the focused node. Restore its first
      // usable control; render() handles tile/item focus where applicable.
      if(!scope.contains(document.activeElement)&&this.scope()===scope)this.focus(this.controls(scope)[0]);
    }
  }
};
