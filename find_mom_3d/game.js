'use strict';
Meadow.Game = class {
  constructor() {
    this.state={...Meadow.Progress.fresh(),mode:'title'};
    this.saved=Meadow.Progress.read();this.reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.scene=new THREE.Scene();this.scene.background=new THREE.Color(0xe5e8d2);this.scene.fog=new THREE.Fog(0xe5e8d2,48,115);
    this.camera=new THREE.OrthographicCamera(-20,20,12,-12,.1,160);
    this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
    this.renderer.setSize(innerWidth,innerHeight);this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));
    this.renderer.outputEncoding=THREE.sRGBEncoding;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=.92;
    this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    document.getElementById('game-container').appendChild(this.renderer.domElement);
    this.renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();this.input.reset();this.audio.setPaused(true);this.state.mode='error';document.getElementById('error-screen').hidden=false;});
    this.hemisphere=new THREE.HemisphereLight(0xfff0d5,0x8c9d73,.7);this.scene.add(this.hemisphere);
    this.sun=new THREE.DirectionalLight(0xffdfa8,1.15);this.sun.position.set(-12,22,8);this.sun.castShadow=true;
    const shadowSize=matchMedia('(pointer:coarse)').matches?1024:2048;
    this.sun.shadow.mapSize.set(shadowSize,shadowSize);Object.assign(this.sun.shadow.camera,{left:-24,right:24,top:24,bottom:-24,near:1,far:65});
    this.sun.shadow.normalBias=.025;this.sun.shadow.bias=-.0002;this.sun.shadow.radius=3;this.scene.add(this.sun);
    this.scene.add(new THREE.AmbientLight(0xfff6dd,.12));
    const firstLayer=new THREE.Group();this.scene.add(firstLayer);
    this.world=new Meadow.World(firstLayer);this.worldCache={1:{layer:firstLayer,world:this.world}};
    this.player=new Meadow.Player(this.scene);this.view=new Meadow.Camera(this.camera,this.player);
    this.audio=new Meadow.Audio();this.input=new Meadow.Input(()=>this.action(),()=>this.togglePause());
    this.interactions=new Meadow.Interactions(this);this.dialogue=new Meadow.Dialogue(this);this.story=new Meadow.Story(this);
    this.challenges=new Meadow.Challenges(this);
    this.song=new Meadow.SongPuzzle(this);this.stories={1:this.story,2:new Meadow.ForestStory(this)};
    this.prologue=new Meadow.Prologue(this);this.trials=new Meadow.ActionTrials(this);
    this.time=0;this.lastTime=performance.now();this.lastHUD=0;this.toastDeadline=0;
    document.body.classList.add('cover');this.bindUI();this.refresh();
    if(this.saved){document.getElementById('start-btn').innerHTML=this.saved.chapter===2?'繼續風鈴森林 <span>→</span>':this.saved.completed?'看看希望之光 <span>→</span>':'繼續小米的冒險 <span>→</span>';document.getElementById('new-game-btn').hidden=false;}
    this.view.update(1,true,true);this.animate=this.animate.bind(this);requestAnimationFrame(this.animate);
  }
  bindUI() {
    const on=(id,fn)=>document.getElementById(id).addEventListener('click',fn);
    on('start-btn',()=>this.start(!!this.saved));on('new-game-btn',()=>this.start(false));
    on('pause-btn',()=>this.togglePause());on('resume-btn',()=>this.togglePause());
    on('restart-btn',()=>this.restartCurrent());on('replay-btn',()=>this.restartCurrent());
    on('next-chapter-btn',()=>this.enterSecond());
    on('hint-btn',()=>{if(this.state.mode==='playing'){this.refreshTarget();this.toast(this.story.target().text,6000);this.audio.note(659,.5,.025);}});
    on('journal-btn',()=>{if(this.state.chapter===2){if(this.state.mode==='playing')this.story.readJournal();}else this.challenges.open('journal');});
    on('sound-btn',async()=>{
      const enabled=await this.audio.toggle(),button=document.getElementById('sound-btn');
      button.setAttribute('aria-pressed',String(enabled));button.setAttribute('aria-label',enabled?'關閉聲音':'開啟聲音');button.title=enabled?'關閉聲音':'開啟聲音';
      if(!this.audio.context)this.toast('這個瀏覽器目前無法播放音效，仍然可以繼續冒險。');
    });
    window.addEventListener('resize',()=>{this.renderer.setSize(innerWidth,innerHeight);this.view.resize();});
    document.addEventListener('visibilitychange',()=>{if(document.hidden){this.input.reset();if(['playing','dialogue','puzzle','cutscene','action'].includes(this.state.mode))this.togglePause();}});
    window.addEventListener('keydown',event=>{
      if(event.key!=='Tab')return;
      const selector=this.state.mode==='paused'?'#pause-screen':this.state.mode==='complete'?'#ending-screen':this.state.mode==='action'?'#action-ui':this.state.mode==='puzzle'?(this.song.active?'#song-screen':'#puzzle-screen'):null;
      if(!selector)return;
      const buttons=[...document.querySelectorAll(`${selector} button`)].filter(button=>!button.disabled&&!button.hidden&&button.getClientRects().length);
      const index=buttons.indexOf(document.activeElement),next=event.shiftKey?(index<=0?buttons.length-1:index-1):(index+1)%buttons.length;
      event.preventDefault();buttons[next].focus();
    });
  }
  start(continuing) {
    this.prologue.reset();this.trials.reset();
    this.dialogue.close();this.challenges.hide();this.song.hide();this.input.reset();this.audio.setPaused(false);
    Object.assign(this.state,continuing&&this.saved?this.saved:Meadow.Progress.fresh(),{mode:'playing'});
    this.stories[2].running=false;document.body.classList.remove('in-cutscene');document.getElementById('story-caption').hidden=true;
    this.loadWorld(this.state.chapter);
    for(const id of ['title-screen','pause-screen','ending-screen','toast'])document.getElementById(id).hidden=true;
    for(const id of ['play-hud','pause-btn','mobile-controls'])document.getElementById(id).hidden=false;
    document.body.classList.remove('cover','in-dialogue');
    const p=this.state.checkpoint;
    this.player.setPosition(this.world.canWalk(p.x,p.z)?p.x:CONFIG.START.x,this.world.canWalk(p.x,p.z)?p.z:CONFIG.START.z);
    if(this.state.chapter===1)this.world.rabbit.mesh.position.set(1.8,0,3.4);
    this.toastDeadline=0;this.refresh();
    if(this.state.chapter===1?this.state.completed:this.state.forest.completed){this.showEnding();return;}
    if(this.state.chapter===2&&this.state.forest.reunited&&!this.state.forest.separated){this.story.beginCrossing();return;}
    if(this.state.chapter===1&&!this.state.prologueSeen){this.saveProgress();this.prologue.start();return;}
    if(!continuing){Meadow.Progress.write(this.state);this.introPending=false;this.story.intro();}
    else this.toast(this.state.upgraded?'栗栗的風車郵局開張了！你的花朵都還在，一起解開新的祕密吧。':'歡迎回來！我們接著上次的小小一步。',5000);
    if(document.activeElement instanceof HTMLElement)document.activeElement.blur();
  }
  loadWorld(chapter) {
    if(!this.worldCache[chapter]){
      const layer=new THREE.Group();this.scene.add(layer);
      this.worldCache[chapter]={layer,world:new Meadow.Forest(layer)};
    }
    for(const [id,entry] of Object.entries(this.worldCache)){
      entry.layer.visible=Number(id)===chapter;entry.world.labels.forEach(label=>label.el.hidden=true);
    }
    this.world=this.worldCache[chapter].world;this.story=this.stories[chapter];this.view.override=null;
    this.world.cutscene=false;this.world.hug=false;this.world.sync(this.state);
    const forest=chapter===2;
    this.scene.background.set(forest?0xaabeb4:0xe5e8d2);this.scene.fog.color.copy(this.scene.background);
    this.sun.color.set(forest?0xd6ede1:0xffdfa8);this.hemisphere.color.set(forest?0xdce8e6:0xfff0d5);
    this.hemisphere.groundColor.set(forest?0x647d72:0x8c9d73);
    document.body.classList.toggle('in-forest',forest);
    document.querySelector('.chapter-tag').innerHTML=forest?'<span class="tiny-sun">♪</span> 第二章 <i></i> 風鈴森林':'<span class="tiny-sun">☀</span> 第一章 <i></i> 黃昏花田';
    document.getElementById('pause-title').textContent=forest?'森林也會等你。':'花田會等你。';
    document.getElementById('restart-btn').textContent=forest?'重新開始第二章':'重新開始第一章';
    document.title=forest?'小米找媽媽 · 第二章：風鈴森林':'小米找媽媽 · 第一章：黃昏花田';
    document.getElementById('game-container').setAttribute('aria-label',forest?'風鈴森林 3D 遊戲場景':'黃昏花田 3D 遊戲場景');
  }
  enterSecond() {
    if(this.state.chapter!==1||!this.state.completed)return;
    this.state.chapter=2;this.state.forest=Meadow.Progress.forestFresh();this.state.checkpoint={...CONFIG.START};
    this.saveProgress();this.start(true);this.story.intro();
  }
  restartCurrent() {
    if(this.state.chapter===1){this.start(false);return;}
    this.state.forest=Meadow.Progress.forestFresh();this.state.checkpoint={...CONFIG.START};
    this.saveProgress();this.start(true);this.story.intro();
  }
  checkpoint(x,z) {
    this.state.checkpoint={x,z};
    this.saveProgress();this.refresh();
  }
  saveProgress() {
    const saved=Meadow.Progress.write(this.state);
    this.saved=(saved&&Meadow.Progress.read())||JSON.parse(JSON.stringify(this.state));
    if(!saved&&!this.storageWarning){this.storageWarning=true;this.toast('這次無法記住進度，請先保持這個頁面開著。',6500);}
  }
  action() {
    if(this.state.mode==='dialogue')this.dialogue.next();
    else if(this.state.mode==='playing')this.interactions.act();
  }
  togglePause() {
    const s=this.state;
    if(s.mode==='paused'){
      s.mode=this.beforePause;document.getElementById('pause-screen').hidden=true;this.audio.setPaused(false);this.input.reset();
      if(s.mode==='dialogue')document.getElementById('dialogue-next').focus({preventScroll:true});
      else if(s.mode==='puzzle')document.getElementById(this.song.active?'song-close':'puzzle-close').focus({preventScroll:true});
      else document.getElementById('resume-btn').blur();
    }else if(['playing','dialogue','puzzle','cutscene','action'].includes(s.mode)){
      this.trials.release();
      this.beforePause=s.mode;s.mode='paused';this.input.reset();this.audio.setPaused(true);document.getElementById('pause-screen').hidden=false;document.getElementById('resume-btn').focus({preventScroll:true});
    }
    this.interactions.update();
  }
  showEnding() {
    const forest=this.state.chapter===2;
    document.getElementById('ending-kicker').textContent=forest?'第二章完成 · 風鈴森林':'第一章完成 · 黃昏花田';
    document.getElementById('ending-title').textContent=forest?'這次，我知道該往哪裡走。':'原來，媽媽也在找我。';
    document.getElementById('ending-description').innerHTML=forest?'媽媽在對岸的休息亭，很安全。<br>你記得她的歌，也找到了新的路。':'你幫小米點亮了第一盞燈。<br>雖然還沒見到媽媽，心裡已經有了光。';
    document.getElementById('ending-award').innerHTML=forest?'02 <span>記憶之光</span> ♪':'01 <span>希望之光</span> ✦';
    document.getElementById('ending-lessons').innerHTML=(forest?['記住旋律，也想通回聲的順序','真正走到媽媽身邊，給她擁抱','再次分開，也學會問路與求助']:['和栗栗修好送信風管','合併三條線索，解開燈的祕密','和朋友一起點亮希望']).map(text=>`<span>✓ ${text}</span>`).join('');
    document.getElementById('next-chapter-btn').hidden=forest;
    document.getElementById('replay-btn').textContent=forest?'再玩一次風鈴森林 ↻':'再逛一次花田 ↻';
    document.getElementById('ending-next').innerHTML=forest?'下一站：月光河谷<br><small>第二章的冒險到這裡。第三、四章尚未開放。</small>':'下一站：風鈴森林<br><small>咕咕和媽媽的歌，在森林裡等你。</small>';
    this.state.mode='complete';this.input.reset();document.getElementById('ending-screen').hidden=false;
    document.getElementById('play-hud').hidden=true;document.getElementById('mobile-controls').hidden=true;document.getElementById('pause-btn').hidden=true;
    document.getElementById(forest?'replay-btn':'next-chapter-btn').focus({preventScroll:true});this.interactions.update();
  }
  toast(text,duration=4000) { const el=document.getElementById('toast');el.textContent=text;el.hidden=false;this.toastDeadline=this.time+duration/1000; }
  refresh() {
    this.world.sync(this.state);
    const objective=this.story.objective();
    document.getElementById('objective-title').textContent=objective.title;
    document.getElementById('objective-detail').textContent=objective.detail;
    document.getElementById('step-count').textContent=`0${objective.step} / 0${objective.total||7}`;
    document.getElementById('emotion-tag').textContent=objective.emotion;
    const forest=this.state.chapter===2;
    document.getElementById('collection').hidden=forest||!this.state.windSolved;
    document.getElementById('forest-hud').hidden=!forest||!this.state.forest.metOwl;
    document.getElementById('journal-btn').hidden=forest?!this.state.forest.metOwl:!this.state.metHedgehog;
    document.getElementById('journal-btn').textContent=forest?'♪ 筆記':'✉ 手帳';
    if(forest){
      document.getElementById('melody-count').textContent=`${this.state.forest.round} / 3`;
      document.getElementById('melody-badges').innerHTML=CONFIG.SONGS.map((song,i)=>`<span class="${i<this.state.forest.round?'done':''}" title="${song.name}" aria-label="${song.name}：${i<this.state.forest.round?'完成':'未完成'}">${i<this.state.forest.round?'✓':'♪'}</span>`).join('');
    }
    document.getElementById('flower-count').textContent=`${this.state.flowers.length} / 3`;
    document.querySelectorAll('.flower-slot').forEach((el,i)=>{const got=this.state.flowers.includes(el.dataset.flower);el.classList.toggle('collected',got);el.querySelector('b').textContent=got?'✓':i+1;el.setAttribute('aria-label',`${CONFIG.FLOWERS[i].name}：${got?'已收集':'還沒找到'}`);});
    this.refreshTarget();
  }
  refreshTarget() {
    const target=this.story.target();this.world.setTarget(target.position);
    this.world.labels.forEach(label=>label.el.classList.toggle('active',label===target.label));
  }
  animate(now) {
    requestAnimationFrame(this.animate);
    const dt=Math.min((now-this.lastTime)/1000,.05);this.lastTime=now;
    if(this.state.mode==='error')return;
    const paused=this.state.mode==='paused';if(!paused)this.time+=dt;
    const playing=this.state.mode==='playing';
    this.player.update(paused?0:dt,this.input,this.world,playing,this.reducedMotion);
    this.prologue.update(dt);this.trials.update(dt);
    if(this.state.chapter===2){this.story.update(dt);this.song.update(dt);}
    if(!paused)this.world.update(this.time,dt,this.player,this.state,this.reducedMotion);
    this.view.update(dt,this.state.mode==='title',this.reducedMotion);
    if(this.trials.active&&this.state.mode==='action'&&!this.reducedMotion&&this.trials.shake>0)this.camera.position.x+=Math.sin(this.time*35)*.045;
    if(this.time-this.lastHUD>.15){this.lastHUD=this.time;this.refreshTarget();}
    this.interactions.update();this.world.updateLabels(this.camera,!['title','complete'].includes(this.state.mode));
    const warmth=this.state.chapter===2?.95:this.state.lit?1.4:1.15;this.sun.intensity+=(warmth-this.sun.intensity)*Math.min(1,dt*.8);
    this.audio.update(this.time,!['paused','title'].includes(this.state.mode));
    if(this.toastDeadline&&this.time>this.toastDeadline){document.getElementById('toast').hidden=true;this.toastDeadline=0;}
    this.renderer.render(this.scene,this.camera);
  }
};
window.addEventListener('DOMContentLoaded',()=>{
  try{window.meadowGame=new Meadow.Game();}
  catch(error){console.error('無法啟動黃昏花田',error);document.getElementById('error-screen').hidden=false;}
});
