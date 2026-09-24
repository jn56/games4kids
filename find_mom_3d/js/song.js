'use strict';
Meadow.SongPuzzle = class {
  constructor(game) {
    this.game=game;this.panel=document.getElementById('song-screen');this.active=false;this.demo=null;
    document.getElementById('song-close').addEventListener('click',()=>this.close());
    document.getElementById('song-replay').addEventListener('click',()=>this.play());
    document.getElementById('song-hint').addEventListener('click',()=>this.hint());
    document.getElementById('song-next').addEventListener('click',()=>this.nextRound());
    document.getElementById('song-sound').addEventListener('click',()=>document.getElementById('sound-btn').click());
    document.getElementById('song-bells').addEventListener('click',event=>{const button=event.target.closest('[data-note]');if(button)this.answer(button.dataset.note);});
    window.addEventListener('keydown',event=>{
      if(this.active&&this.game.state.mode==='puzzle'&&['Digit1','Digit2','Digit3'].includes(event.code)&&!event.repeat){event.preventDefault();this.answer(CONFIG.BELLS[Number(event.code.slice(-1))-1].id);}
    });
  }
  static expected(round) { const song=CONFIG.SONGS[round];return song.reverse?[...song.sequence].reverse():song.shift?[...song.sequence.slice(1),song.sequence[0]]:[...song.sequence]; }
  open() {
    const g=this.game,f=g.state.forest;
    if(g.state.chapter!==2||g.state.mode!=='playing'||!f.metOwl||f.round>=3)return;
    if(!Meadow.Keepsakes.has(g.state,'score')){g.toast('需要花田信封裡的媽媽歌譜。');return;}
    this.active=true;this.current=f.round;this.ready=f.input.length>0;this.stageDone=false;this.demo=null;this.lit=null;
    this.feedback=f.input.length?`接著上次的第 ${f.input.length+1} 個音。重播會從本段第一音重新作答。`:'先按「播放旋律」，看圖案亮起的先後。聲音關著也沒關係。';
    const p=g.player.mesh.position;g.checkpoint(p.x,p.z);
    g.state.mode='puzzle';g.input.reset();this.panel.hidden=false;document.body.classList.add('in-puzzle');g.interactions.update();
    this.render();document.getElementById('song-replay').focus({preventScroll:true});
  }
  hide() { this.active=false;this.demo=null;this.panel.hidden=true;document.body.classList.remove('in-puzzle'); }
  close() {
    if(!this.active||this.game.state.mode!=='puzzle')return;
    const completed=this.stageDone&&this.game.state.forest.round===3;
    this.hide();this.game.state.mode='playing';this.game.input.reset();this.game.refresh();document.getElementById('song-close').blur();
    if(completed)this.game.story.songComplete();
  }
  play() {
    if(!this.active||this.game.state.mode!=='puzzle'||this.stageDone||this.demo)return;
    const g=this.game;g.state.forest.input=[];g.saveProgress();
    this.ready=false;this.lit=null;this.demo={elapsed:0,index:-1};
    this.feedback='咕咕在示範。看清楚每一個圖案，播完再輪到你。';this.render();
  }
  update(dt) {
    if(!this.active||!this.demo||this.game.state.mode!=='puzzle')return;
    const song=CONFIG.SONGS[this.current];this.demo.elapsed+=dt;
    const index=Math.floor((this.demo.elapsed-.4)/.48);
    if(index>=0&&index<song.sequence.length&&index!==this.demo.index){
      this.demo.index=index;this.lit=song.sequence[index];this.ring(this.lit);this.render();
    }
    if(this.demo.elapsed>.4+song.sequence.length*.48+.25){
      this.demo=null;this.lit=null;this.ready=true;
      this.feedback=song.shift?'輪到你！把第一音移到最後，其餘維持順序。':song.reverse?'輪到你！這一段是回聲，請從最後一個音倒著敲回來。':'輪到你！照剛才的順序敲風鈴，不用急。';this.render();
    }
  }
  ring(id) {
    const bell=CONFIG.BELLS.find(b=>b.id===id);if(!bell)return;
    this.game.audio.note(bell.note,.65,.065);this.game.world.ringBell(id);
  }
  answer(id) {
    const g=this.game,f=g.state.forest;
    if(!this.active||g.state.mode!=='puzzle'||!this.ready||this.demo||this.stageDone||!CONFIG.BELLS.some(b=>b.id===id))return;
    const expected=Meadow.SongPuzzle.expected(this.current);this.ring(id);
    if(id!==expected[f.input.length]){
      f.input=[];f.mistakes[this.current]++;
      if(f.mistakes[this.current]>=6)f.assists[this.current]=Math.max(1,f.assists[this.current]);
      this.feedback=f.mistakes[this.current]>=6?'這段有一點難，我把圖示樂譜留下來陪你。重新試這一段，前面通過的都還在。':'這個音和旋律不一樣。從本段第一個音再試試，前面通過的都還在。';
    }else{
      f.input.push(id);this.feedback=`記住了 ${f.input.length} / ${expected.length} 個音。接著想想下一個。`;
      if(f.input.length===expected.length){
        f.round++;f.input=[];this.stageDone=true;this.feedback='這段旋律完成了！你的耳朵和眼睛，都記得媽媽的歌。';g.audio.chime();
        g.saveProgress();g.refresh();

      }
    }
    g.saveProgress();this.render();
    if(this.stageDone)document.getElementById('song-next').focus({preventScroll:true});
    else this.panel.querySelector(`[data-note="${id}"]`)?.focus({preventScroll:true});
  }
  nextRound() {
    if(!this.active||this.game.state.mode!=='puzzle'||!this.stageDone)return;
    if(this.game.state.forest.round===3){this.close();return;}
    this.current=this.game.state.forest.round;this.stageDone=false;this.ready=false;this.lit=null;
    this.feedback=CONFIG.SONGS[this.current].shift?'這一段要把第一音移到最後，再敲回來。':CONFIG.SONGS[this.current].reverse?'最後一段多一個小挑戰：聽完後，要倒著敲回來。':'這一段多一個音。可以把它分成兩小段記。';
    this.render();document.getElementById('song-replay').focus({preventScroll:true});
  }
  hint() {
    if(!this.active||this.game.state.mode!=='puzzle'||this.demo||this.stageDone)return;
    const f=this.game.state.forest;f.assists[this.current]=Math.min(3,f.assists[this.current]+1);
    const expected=Meadow.SongPuzzle.expected(this.current),level=f.assists[this.current];
    const song=CONFIG.SONGS[this.current];
    if(level===1)this.feedback=song.shift?'從原旋律的第 2 音開始，依序敲到第 7 音，最後補上第 1 音。':song.reverse?'這段是回聲：從原旋律的最後一音，往回敲到第一音。':'這段照原旋律，從左到右依序敲回來。';
    else if(level===2)this.feedback=`下一個是「${CONFIG.BELLS.find(b=>b.id===expected[f.input.length]).name}」。先完成這一小步。`;
    else this.feedback=song.shift?'下面已排好換位後的作答順序，從左到右敲，不用再換位。':song.reverse?'下面已排好倒序後的作答順序，從左到右敲，不用再倒過來。':'下面是作答順序，從左到右依序敲回來。';
    this.game.saveProgress();this.render();
  }
  symbol(id) {
    const shapes={leaf:'<path d="M27 4C12 3 4 10 6 20c7 7 20 1 21-16Z"/><path d="m5 28 15-16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>',drop:'<path d="M16 3C12 10 5 15 5 21a11 11 0 0 0 22 0c0-6-7-11-11-18Z"/>',star:'<path d="m16 2 4.3 9 9.7 1.4-7 6.9 1.7 9.7-8.7-4.6L7.3 29 9 19.3l-7-6.9 9.7-1.4Z"/>'};
    return `<svg viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">${shapes[id]}</svg>`;
  }
  noteMarkup(id) {const note=CONFIG.BELLS.find(b=>b.id===id);return `<span class="score-note note-${id}" role="img" aria-label="${note.name}">${this.symbol(id)}</span>`;}
  render() {
    const f=this.game.state.forest,song=CONFIG.SONGS[this.current],assist=f.assists[this.current];
    document.getElementById('song-kicker').textContent=`咕咕的風鈴課 · 第 ${this.current+1} / 3 段`;
    document.getElementById('song-title').textContent=song.name;
    document.getElementById('song-rule').textContent=song.reverse?'回聲挑戰：記住 8 個音，再「倒著」敲回來。':song.shift?'換位挑戰：把第一音移到最後，其餘保持順序。':'記住 '+song.sequence.length+' 個音，再照「相同順序」敲一次。';
    document.getElementById('song-progress').innerHTML=CONFIG.SONGS.map((s,i)=>`<span class="song-round ${i<f.round?'done':i===this.current?'current':''}">${i<f.round?'✓':i+1} ${s.name}</span>`).join('');
    const active=CONFIG.BELLS.find(b=>b.id===this.lit);
    document.getElementById('song-demonstration').innerHTML=active?`<span class="demo-symbol note-${active.id}">${this.symbol(active.id)}</span><strong>${active.name}</strong><small>第 ${this.demo.index+1} 個音</small>`:`<span class="demo-symbol">${this.stageDone?'✦':this.ready?'♪':'🦉'}</span><strong>${this.stageDone?'這一段完成了':this.ready?'換你敲敲看':'咕咕準備好了'}</strong><small>${this.stageDone?(f.round===3?'準備好就繼續找媽媽':'準備好再到下一段'):this.ready?'沒有時間限制':'可以聽聲音，也可以只看圖案'}</small>`;
    document.getElementById('song-score').hidden=assist<1||!!this.demo||this.stageDone;
    const sequence=assist>=3?Meadow.SongPuzzle.expected(this.current):song.sequence;
    const positions=song.shift?[...song.sequence.slice(1).map((_,i)=>i+2),1]:song.reverse?song.sequence.map((_,i)=>song.sequence.length-i):song.sequence.map((_,i)=>i+1);
    document.getElementById('song-score').innerHTML=`<span>${assist>=3?'作答順序 →':song.shift||song.reverse?'原旋律（還要換順序）':'原旋律 →'}</span><div style="--score-count:${sequence.length}">${sequence.map((id,i)=>`<span class="score-step">${this.noteMarkup(id)}<small>${i+1}</small></span>`).join('')}</div>${assist<3&&(song.shift||song.reverse)?`<p class="score-order">作答：原第 ${positions.join(' → ')} 音</p>`:''}`;

    document.getElementById('song-input').innerHTML=Array.from({length:song.sequence.length},(_,i)=>this.stageDone?this.noteMarkup(Meadow.SongPuzzle.expected(this.current)[i]):f.input[i]?this.noteMarkup(f.input[i]):'<span class="input-note">'+(i+1)+'</span>').join('');
    const bells=document.getElementById('song-bells');
    if(!bells.children.length)bells.innerHTML=CONFIG.BELLS.map((b,i)=>`<button class="song-bell note-${b.id}${this.lit===b.id?' ringing':''}" data-note="${b.id}" ${!this.ready||this.demo||this.stageDone?'disabled':''}><span class="bell-silhouette">${this.symbol(b.id)}</span><strong>${b.name}</strong><small>鍵盤 ${i+1} 或點一下</small></button>`).join('');
    for(const button of bells.children){button.disabled=!this.ready||!!this.demo||this.stageDone;button.classList.toggle('ringing',this.lit===button.dataset.note);}
    document.getElementById('song-feedback').textContent=this.feedback;
    document.getElementById('song-replay').textContent=this.ready?'再聽／看一次 ↻':'播放旋律 ▶';
    document.getElementById('song-replay').disabled=!!this.demo||this.stageDone;
    document.getElementById('song-hint').disabled=!!this.demo||this.stageDone;
    document.getElementById('song-hint').textContent='翻媽媽的歌譜';
    document.getElementById('song-next').hidden=!this.stageDone;
    document.getElementById('song-next').textContent=f.round===3?'完成合奏 →':'下一段 →';
  }
};
