(() => {
  const catalog = [...GameCatalog, {id:'find_mom_3d_v2',name:'找媽媽 V2：回家的四盞燈',icon:'🌲',category:'立體冒險',color:'#23594c',tint:'#e2eee1',description:'方向鍵與空白鍵展開四章冒險，躲蚊子、追猴子！角色可改名，也能親自配音。',preserved:true}, {id:'find_mom_3d',name:'找媽媽（原版）',icon:'🏡',category:'立體冒險',color:'#8b795c',tint:'#f0eadc',description:'走進立體世界，出發尋找媽媽。',preserved:true}];
  let filter='全部', query='', selected=-1;
  const grid=document.getElementById('game-grid');
  function render() {
    const visible=catalog.filter(game => (filter==='全部' || game.category===filter) && `${game.name} ${game.description} ${game.category}`.includes(query));
    grid.replaceChildren();
    selected=-1;
    visible.forEach(game => {
      const card=document.createElement('article'); card.className='game-card'; card.style.setProperty('--accent',game.color); card.style.setProperty('--tint',game.tint);
      const record=game.scoreKey ? GameStorage.number(game.scoreKey) : 0;
      card.innerHTML=`<a class="game-art" href="${game.id}/index.html" aria-label="玩${game.name}"><span aria-hidden="true">${game.icon}</span><i class="art-star" aria-hidden="true">✦</i><i class="art-tiny" aria-hidden="true"></i></a><div class="card-content"><div class="category">${game.category}<small>電腦・手機</small></div><h3><a href="${game.id}/index.html">${game.name}</a></h3><p class="card-description">${game.description}</p><div class="card-foot"><span class="card-record">${game.scoreKey ? `${game.scoreLabel || '最高紀錄'} <b>${record || '—'}</b>` : '來玩一場小冒險'}</span><a class="play-link" href="${game.id}/index.html" aria-label="開始玩${game.name}">開始玩 <span aria-hidden="true">↗</span></a></div></div>`;
      grid.append(card);
    });
    document.getElementById('game-count').textContent=`${visible.length} 款小遊戲`;
    document.getElementById('empty-state').hidden=visible.length>0;
  }
  document.querySelectorAll('[data-filter]').forEach(button => button.onclick=() => {
    filter=button.dataset.filter; document.querySelectorAll('[data-filter]').forEach(item=>item.setAttribute('aria-pressed',String(item===button))); render(); GameAudio.effect('click');
  });
  document.getElementById('game-search').addEventListener('input',event=>{query=event.target.value.trim();render();});
  const music=document.getElementById('music-toggle');
  function sync(){music.textContent=`♫ 音樂 ${GameAudio.musicEnabled?'開':'關'}`;music.setAttribute('aria-pressed',String(!GameAudio.musicEnabled));}
  music.onclick=()=>{GameAudio.unlock();GameAudio.toggleMusic();};
  window.addEventListener('gameaudiochange',sync);window.addEventListener('pageshow',render);
  GameAudio.setTune(2);GameAudio.startMusic();sync();render();
  const keyboardHint=document.createElement('p');keyboardHint.className='home-keyboard-hint';keyboardHint.textContent='方向鍵選遊戲 · 空白鍵開始 · A / D 換分類 · S 切換音樂';grid.before(keyboardHint);
  document.addEventListener('keydown',event=>{
    if(event.code==='Escape'&&event.target.matches('input,textarea')){event.target.blur();event.preventDefault();return;}
    if(event.ctrlKey||event.metaKey||event.altKey||event.target.matches('input,textarea'))return;
    const cards=[...grid.querySelectorAll('.game-card')],columns=getComputedStyle(grid).gridTemplateColumns.split(' ').length;
    if(event.code.startsWith('Arrow')&&cards.length){
      event.preventDefault();const step={ArrowLeft:-1,ArrowRight:1,ArrowUp:-columns,ArrowDown:columns}[event.code];
      selected=selected<0?0:Math.max(0,Math.min(cards.length-1,selected+step));
      cards.forEach((card,i)=>card.classList.toggle('keyboard-selected',i===selected));
      cards[selected].querySelector('a').focus({preventScroll:true});cards[selected].scrollIntoView({block:'nearest'});
    }else if(event.code==='Space'&&!event.repeat&&cards.length){event.preventDefault();cards[Math.max(0,selected)].querySelector('a').click();}
    else if(['KeyA','KeyD'].includes(event.code)){
      event.preventDefault();const buttons=[...document.querySelectorAll('[data-filter]')],index=buttons.findIndex(b=>b.dataset.filter===filter);
      buttons[(index+buttons.length+(event.code==='KeyA'?-1:1))%buttons.length].click();
    }else if(event.code==='KeyS'&&!event.repeat){event.preventDefault();music.click();}
    else if(event.code==='Escape'){document.getElementById('game-search').value='';query='';document.querySelector('[data-filter="全部"]').click();}
  });
})();
