(() => {
  'use strict';
  const id = document.body.dataset.game, game = GameCatalog.find(item => item.id === id);
  if (!game) return;
  const allowed = new Set(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','KeyA','KeyS','KeyD','Escape']);
  let hooks, action, stage, menu, ready=false, paused=false, pausedAt=0, wasPlaying=false, menuIndex=0;
  let screenDensity=window.devicePixelRatio||1;
  const consumed = new Set();
  GameAudio.setTune(game.tune);
  document.documentElement.style.setProperty('--garden-accent',game.color);
  function focusGame() { document.querySelector('#gameCanvas,#canvas3d')?.focus({preventScroll:true}); }
  function key(code,down) { window.dispatchEvent(new KeyboardEvent(down?'keydown':'keyup',{code,key:code==='Space'?' ':code.startsWith('Key')?code.slice(3).toLowerCase():code,bubbles:true,cancelable:true})); }
  function bindPad(button,code,held) {
    button.addEventListener('pointerdown',event=>{
      event.preventDefault(); if(paused)return;
      button.setPointerCapture(event.pointerId);button.classList.add('held');GameAudio.unlock();key(code,true);
      if(!held)setTimeout(()=>key(code,false),80);
    });
    const release=()=>{button.classList.remove('held');if(held)key(code,false);};
    ['pointerup','pointercancel','lostpointercapture'].forEach(event=>button.addEventListener(event,release));
  }
  function updateAudio() {
    document.querySelectorAll('[data-audio]').forEach(button=>{
      const music=button.dataset.audio==='music',enabled=music?GameAudio.musicEnabled:GameAudio.effectsEnabled;
      button.textContent=`${music?'♫ 背景音樂':'♪ 遊戲音效'}：${enabled?'開':'關'}`;
      button.setAttribute('aria-pressed',String(enabled));
    });
  }
  function resizeCanvas(canvas,logicalWidth,logicalHeight) {
    const {width,height}=canvas.getBoundingClientRect();if(width<=0||height<=0)return false;
    const density=Math.min(window.devicePixelRatio||1,3);
    const pixelsWide=Math.round(width*density),pixelsHigh=Math.round(height*density);
    canvas.dataset.logicalWidth=logicalWidth;canvas.dataset.logicalHeight=logicalHeight;
    if(canvas.width===pixelsWide&&canvas.height===pixelsHigh)return false;
    canvas.width=pixelsWide;canvas.height=pixelsHigh;
    const context=canvas.getContext('2d');context.setTransform(pixelsWide/logicalWidth,0,0,pixelsHigh/logicalHeight,0,0);
    context.imageSmoothingEnabled=true;context.imageSmoothingQuality='high';return true;
  }
  function resizeRenderer(renderer,width,height) {
    const density=Math.min(window.devicePixelRatio||1,2);
    if(renderer.getPixelRatio()!==density)renderer.setPixelRatio(density);
    renderer.setSize(width,height);
  }
  function fitBoard() {
    const canvas=document.getElementById('gameCanvas');if(!canvas||!stage)return;
    const board=hooks?.board,logicalWidth=board?.width||canvas.width,logicalHeight=board?.height||canvas.height;
    const scale=Math.min(stage.clientWidth/logicalWidth,stage.clientHeight/logicalHeight);
    const width=Math.floor(logicalWidth*scale),height=Math.floor(logicalHeight*scale);
    canvas.parentElement.style.width=`${width}px`;
    canvas.parentElement.style.height=`${height}px`;
    if(board&&resizeCanvas(canvas,logicalWidth,logicalHeight))board.draw();
  }
  function fitMinimap() {
    const map=document.querySelector('.minimap-container'),hud=document.querySelector('.hud-header'),viewport=document.getElementById('viewport');
    if(!map||!hud||!viewport)return;
    const top=Math.ceil(hud.getBoundingClientRect().bottom-viewport.getBoundingClientRect().top+10);
    map.style.top=`${Math.max(8,top)}px`;
    const canvas=map.querySelector('canvas');
    if(canvas&&resizeCanvas(canvas,Number(canvas.dataset.logicalWidth)||canvas.width,Number(canvas.dataset.logicalHeight)||canvas.height))hooks?.minimap?.();
  }
  function poll() {
    if(!hooks||!ready)return;
    // Some browsers change pixel density without emitting a resize event.
    const density=window.devicePixelRatio||1;
    if(density!==screenDensity){screenDensity=density;window.dispatchEvent(new Event('resize'));}
    const state=hooks.status(),active=state==='PLAYING';document.body.dataset.state=state;
    if(active&&!paused)GameAudio.startMusic();else GameAudio.stopMusic();
    action.textContent=active?'Ⅱ 暫停':state==='START'?'▶ 開始':state==='LEVEL_COMPLETE'?'▶ 下一關':'↻ 重玩';
    action.setAttribute('aria-label',active?'暫停遊戲，Esc':'開始、繼續或重玩，空白鍵');
  }
  function start() { if(!hooks)return;GameAudio.unlock();hooks.clear?.();hooks.start?.();focusGame();poll(); }
  function menuItems() { return [...menu.querySelectorAll('[data-menu-item]')]; }
  function selectMenu(index) {
    const items=menuItems();menuIndex=(index+items.length)%items.length;
    items.forEach((item,i)=>item.classList.toggle('selected',i===menuIndex));items[menuIndex].focus({preventScroll:true});
  }
  function pause() {
    if(paused||!ready)return;
    paused=true;pausedAt=performance.now();wasPlaying=hooks?.status()==='PLAYING';hooks?.clear?.();consumed.clear();GameAudio.stopMusic();menu.hidden=false;
    menu.querySelector('[data-resume]').textContent=wasPlaying?'▶ 繼續玩':'▶ 開始／再玩一次';selectMenu(0);
  }
  function resume() {
    if(!paused)return;paused=false;menu.hidden=true;
    if(wasPlaying)hooks?.resume?.(performance.now()-pausedAt);focusGame();poll();
  }
  window.GameShell={register(value){hooks=value;poll();},get paused(){return paused;},pause,resume,resizeRenderer};
  document.addEventListener('DOMContentLoaded',()=>{
    const container=document.querySelector('.game-container');
    const nav=document.createElement('nav');nav.className='garden-nav';nav.setAttribute('aria-label','遊戲導覽');
    nav.innerHTML=`<a class="garden-brand" href="../../index.html" aria-label="返回遊戲小花園">✿</a><h1>${game.icon} ${game.name}</h1><div class="garden-toolbar"><button class="garden-action" type="button"></button><button class="garden-menu-button" type="button" aria-label="選單與說明，Esc">☰<span> Esc</span></button></div>`;
    document.body.prepend(nav);action=nav.querySelector('.garden-action');
    action.onclick=()=>{GameAudio.unlock();hooks.status()==='PLAYING'?pause():start();};nav.querySelector('.garden-menu-button').onclick=pause;
    stage=document.createElement('main');stage.className='garden-stage';stage.setAttribute('aria-label','遊戲區');
    const canvas=document.querySelector('#gameCanvas,#canvas3d');stage.append(canvas.parentElement);container.prepend(stage);
    container.querySelectorAll('.overlay,#congratsMsg,#gameOverMsg').forEach(overlay=>stage.append(overlay));
    const hud=container.querySelector('.hud-header'),info=container.querySelector('.info-bar');if(hud)stage.append(hud);if(info)stage.append(info);
    container.querySelectorAll('.controls-list').forEach(list=>list.textContent=game.controls);
    container.querySelectorAll('.overlay button,#congratsMsg button,#gameOverMsg button').forEach(button=>button.textContent+=' · 空白鍵');
    const footer=document.createElement('footer');footer.className='garden-controls';
    const guide=document.createElement('p');guide.className='garden-guide';guide.textContent=`${game.controls}　Esc 暫停／選單`;footer.append(guide);container.append(footer);
    const pads={
      pkmadv:[['↑','ArrowUp'],['↓','ArrowDown']],hungry_snake:[['←','ArrowLeft'],['↑','ArrowUp'],['↓','ArrowDown'],['→','ArrowRight']],
      maze_adventure:[['←','ArrowLeft',true],['↑','ArrowUp',true],['↓','ArrowDown',true],['→','ArrowRight',true]],
      shifting_maze:[['←','ArrowLeft',true],['↑','ArrowUp',true],['↓','ArrowDown',true],['→','ArrowRight',true]],
      catch_candies:[['←','ArrowLeft',true],['→','ArrowRight',true]],stair_jump:[['←','ArrowLeft',true],['跳躍','Space'],['→','ArrowRight',true]],
      flappy_bird:[['拍翅 ↑','Space']],bubble_pop:[['↖','ArrowLeft',true],['發射','Space'],['↗','ArrowRight',true]],
      monster_maze_3d:[['路線提示','KeyS']],dice_3d:[['← 換款','ArrowLeft'],['拋骰子','Space'],['換款 →','ArrowRight']]
    };
    if(pads[id]){
      const pad=document.createElement('div');pad.className='garden-pad';pad.setAttribute('aria-label','觸控操作');
      pads[id].forEach(([label,code,held])=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.setAttribute('aria-label',label);bindPad(b,code,held);pad.append(b);});footer.append(pad);
    }
    if(id==='model_viewer_3d')footer.append(container.querySelector('.control-bar'));
    if(id==='dice_3d'){
      const history=container.querySelector('#historyList'),panel=document.createElement('aside');
      panel.className='garden-dice-stats';panel.setAttribute('aria-label','骰子投擲紀錄');
      panel.innerHTML='<h2>投擲紀錄</h2><p>最近 15 次</p>';
      panel.append(history);stage.append(panel);stage.classList.add('garden-dice-stage');
      if(hud)document.getElementById('viewport').append(hud);
    }
    menu=document.createElement('div');menu.className='garden-pause';menu.hidden=true;menu.setAttribute('role','dialog');menu.setAttribute('aria-modal','true');menu.setAttribute('aria-labelledby','garden-pause-title');
    menu.innerHTML=`<section><div class="garden-menu-info"><h2 id="garden-pause-title">${game.icon} ${game.name}</h2><p>${game.description}</p><p class="garden-menu-guide">${game.controls}</p><small>↑ ↓ 選擇 · 空白鍵確認 · Esc 返回遊戲</small></div><div class="garden-menu-items"><button type="button" data-menu-item data-resume>▶ 繼續玩</button><button type="button" data-menu-item data-audio="music"></button><button type="button" data-menu-item data-audio="effects"></button><button type="button" data-menu-item data-home>✿ 返回遊戲小花園</button></div></section>`;
    document.body.append(menu);
    menu.querySelector('[data-resume]').onclick=()=>{const active=wasPlaying;resume();if(!active)start();};
    menu.querySelector('[data-home]').onclick=()=>location.href='../../index.html';
    menu.querySelector('[data-audio="music"]').onclick=()=>{GameAudio.unlock();GameAudio.toggleMusic();};
    menu.querySelector('[data-audio="effects"]').onclick=()=>{GameAudio.unlock();GameAudio.toggleEffects();GameAudio.effect('click');};
    menuItems().forEach((item,index)=>item.addEventListener('focus',()=>{menuIndex=index;menuItems().forEach((b,i)=>b.classList.toggle('selected',i===index));}));
    canvas.tabIndex=0;canvas.setAttribute('aria-label',`${game.name}。${game.controls}`);
    ready=true;updateAudio();poll();fitBoard();focusGame();setInterval(poll,150);
    new ResizeObserver(()=>{fitBoard();fitMinimap();requestAnimationFrame(()=>window.dispatchEvent(new Event('resize')));}).observe(stage);
    if(hud&&document.querySelector('.minimap-container'))new ResizeObserver(fitMinimap).observe(hud);
    fitMinimap();
    requestAnimationFrame(()=>window.dispatchEvent(new Event('resize')));
  });
  window.addEventListener('gameaudiochange',updateAudio);window.addEventListener('resize',fitBoard);window.visualViewport?.addEventListener('resize',fitBoard);
  window.addEventListener('resize',fitMinimap);
  window.addEventListener('keydown',event=>{
    if(event.ctrlKey||event.metaKey||event.altKey)return;
    if(!allowed.has(event.code)){event.stopImmediatePropagation();return;}
    event.preventDefault();GameAudio.unlock();
    if(event.code==='Escape'){event.stopImmediatePropagation();if(!event.repeat)paused?resume():pause();return;}
    if(paused){
      event.stopImmediatePropagation();
      if(event.code==='ArrowDown'||event.code==='ArrowRight')selectMenu(menuIndex+1);
      else if(event.code==='ArrowUp'||event.code==='ArrowLeft')selectMenu(menuIndex-1);
      else if(event.code==='Space'&&!event.repeat){consumed.add('Space');menuItems()[menuIndex].click();}
      return;
    }
    if(consumed.has(event.code)){event.stopImmediatePropagation();return;}
    if(event.code==='Space'&&hooks&&hooks.status()!=='PLAYING'){event.stopImmediatePropagation();consumed.add('Space');if(!event.repeat)start();return;}
    if(event.target.closest?.('button,a'))focusGame();
  },true);
  window.addEventListener('keyup',event=>{consumed.delete(event.code);},true);
  window.addEventListener('blur',()=>{hooks?.clear?.();if(hooks?.status()==='PLAYING')pause();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&hooks?.status()==='PLAYING')pause();});
})();
