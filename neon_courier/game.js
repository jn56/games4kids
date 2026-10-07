'use strict';
(() => {
  const $=id=>document.getElementById(id), storageKey='neon_courier_profile_v1';
  const game={mode:'cover',run:null,input:{steer:0,boost:false,brake:false},profile:NC.freshProfile(),storageOK:true,toastTime:0,radioTime:0,lastStamp:0,accumulator:0,infoOrigin:'cover',infoFocus:null,ended:false};
  try{game.profile=NC.profile(JSON.parse(localStorage.getItem(storageKey)));}catch{game.storageOK=false;}
  const save=()=>{try{localStorage.setItem(storageKey,JSON.stringify(game.profile));game.storageOK=true;}catch{game.storageOK=false;}};
  const audio=game.audio=new NC.Audio(game.profile.sound);let world,stick=null;
  const held={left:false,right:false,stickX:0,boost:false,brake:false};
  function syncInput(){game.input.steer=NC.clamp(Number(held.right)-Number(held.left)+Number(held.stickX),-1,1);game.input.boost=held.boost;game.input.brake=held.brake;}
  function error(message){game.ended=true;clearInput();audio.quiet();$('error-text').textContent=message;$('error').hidden=false;$('error').querySelector('button').focus({preventScroll:true});}
  try{world=game.world=new NC.World($('world'));}catch(e){error('瀏覽器目前無法顯示 3D 航道。請啟用硬體加速，或換用支援 WebGL 的瀏覽器。');console.warn('WebGL initialization unavailable',e);return;}
  window.neonGame=game;
  function focus(id){$(id).focus({preventScroll:true});}
  function mode(value){
    game.mode=value;document.body.dataset.mode=value;
    for(const id of ['cover','hud','pause-panel','result','info-panel'])$(id).hidden=true;
    const panel={cover:'cover',running:'hud',countdown:'hud',paused:'pause-panel',result:'result',info:'info-panel'}[value];if(panel)$(panel).hidden=false;
    if(value==='paused'||(value==='info'&&game.infoOrigin==='paused'))$('hud').hidden=false;
    $('pause').hidden=!['running','countdown','paused'].includes(value);syncTouch();
    if(value!=='running'&&value!=='countdown'){clearInput();audio.quiet();}
  }
  function syncTouch(){$('touch-controls').hidden=!['running','countdown'].includes(game.mode)||(!matchMedia('(pointer: coarse)').matches&&innerWidth>=850);}
  function clearInput(){for(const key of Object.keys(held))held[key]=false;stick?.reset();syncInput();if(game.run)game.run.steering=game.run.vx=0;document.querySelectorAll('.held').forEach(el=>el.classList.remove('held'));}
  function syncSound(){$('sound').textContent=audio.enabled?'♪':'♪̸';$('sound').setAttribute('aria-label',audio.enabled?'關閉音樂與音效':'開啟音樂與音效');$('sound').setAttribute('aria-pressed',String(audio.enabled));}
  function syncCover(){
    const p=game.profile,rank=NC.rank(p),contract=NC.contracts[p.contract];$('pilot-name').value=p.name;
    $('career-badge').textContent=`LV.${String(rank.lv).padStart(2,'0')} ${rank.title}`;
    document.querySelectorAll('[data-role]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.role===p.role)));
    $('contract-name').textContent=contract.name;$('contract-detail').textContent=`${contract.label} · ${(contract.length/1000).toFixed(1)} km · ${contract.time+p.skills.clock*3} 秒`;
    $('skill-count').textContent=NC.points(p)?`+${NC.points(p)}`:'';$('best-label').textContent=p.best?'BEST / '+p.best.toLocaleString():'首次出發，寫下你的紀錄';
    const family=NC.roles[p.role].species==='pikmin'?'pikmin':'human';showFamily(family);world.setRole(p.role);
  }
  function showFamily(family){
    document.querySelectorAll('[data-family]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.family===family)));
    document.querySelectorAll('[data-role]').forEach(b=>b.hidden=(NC.roles[b.dataset.role].species==='pikmin'?'pikmin':'human')!==family);
  }
  function nameChanged(){game.profile.name=$('pilot-name').value.trim().slice(0,12)||'夜行者';$('pilot-name').value=game.profile.name;save();}
  function toast(text,seconds=1.8){$('toast').textContent=text;$('toast').hidden=false;game.toastTime=seconds;}
  function launch(){
    nameChanged();clearInput();audio.unlock();game.run=new NC.Run(game.profile);game.accumulator=0;game.lastStamp=performance.now();game.toastTime=game.radioTime=0;
    $('toast').hidden=$('radio').hidden=true;$('event').hidden=$('fork-card').hidden=true;$('countdown').hidden=false;
    document.querySelectorAll('[data-stop]').forEach(el=>el.className='');mode('countdown');document.activeElement?.blur();world.setRole(game.profile.role);world.update(game.run,0);hud();
  }
  function pause(){
    if(!['running','countdown'].includes(game.mode))return;
    game.resumePhase=game.run.phase;game.run.phase='paused';mode('paused');focus('resume');
  }
  function resume(){if(game.mode!=='paused')return;game.run.phase=game.resumePhase;mode(game.resumePhase);game.lastStamp=performance.now();game.accumulator=0;document.activeElement?.blur();audio.unlock();}
  function cover(){game.run=null;mode('cover');syncCover();world.update(null,0,true);focus('launch');}
  function finish(result){
    const p=game.profile,before=NC.rank(p).lv;p.runs++;p.xp+=result.xp;const record=result.score>p.best;p.best=Math.max(p.best,result.score);save();
    $('result-eyebrow').textContent=record?'NEW PERSONAL BEST':'SHIFT COMPLETE';$('result-title').textContent=result.complete?(result.delivered===3?'把光送到了。':'配送完成。'):'這班航程，先到這。';
    $('result-caption').textContent=`${p.name}，${result.complete?`分岔挑戰完成 ${result.challenges} / 3。城市記住了這一趟。`:'已完成的交付與經驗都會保留。換個節奏再試一次。'}`;
    $('grade').textContent=result.grade;$('result-score').textContent=result.score.toLocaleString();$('result-deliveries').textContent=result.delivered+' / 3';$('result-combo').textContent=result.maxChain+' FLOW';$('result-xp').textContent='+'+result.xp+' XP';
    const after=NC.rank(p);$('result-growth').textContent=after.lv>before?`升級！LV.${after.lv} ${after.title} · 可分配 ${NC.points(p)} 點技能`:`LV.${after.lv} ${after.title} · 距下級還有 ${220-p.xp%220} XP${NC.points(p)?' · 有技能點待分配':''}`;
    mode('result');audio.effect('finish');focus('again');
  }
  function notices(){
    const r=game.run;for(const n of r.notices.splice(0)){
      if(['signal','jump','clear','charge','stumble','bump','delivery','start'].includes(n.type))audio.effect(n.type);
      if(['star','gate','challenge'].includes(n.type))audio.effect(n.type==='challenge'?'delivery':'clear');if(n.type==='ramp')audio.effect('jump');
      if(n.type==='start'){mode('running');$('countdown').hidden=true;toast('出發！',1);}
      if(n.type==='empty')toast('ϟ 回充中',1);
      if(n.type==='gateMiss'&&n.boost)toast('ϟ 衝刺穿門',1.2);
      if(n.type==='challenge')toast('✓ 挑戰完成',1.2);
      if(n.type==='delivery'){
        const stop=r.stops[n.index];document.querySelector(`[data-stop="${n.index}"]`).className=stop.status;
        toast(n.success?`✓ 送達 ${r.delivered}/3`:'錯過交付點',1.5);
      }
      if(n.type==='event')toast({tailwind:'↗ 順風加速',magnet:'◎ 磁力提升',flow:'積分 ×2'}[n.event],1.2);
      if(n.type==='finish')finish(n.result);
    }
  }
  function hud(){
    const r=game.run;if(!r)return;const next=r.stops.find(s=>!s.done),distance=Math.max(0,Math.ceil((next?.distance??r.contract.length)-r.distance)),direction=next?(next.x< -2.5?'↖':next.x>2.5?'↗':'↑'):'⚑';
    $('mission').textContent=`${direction} ${distance} m`;
    $('mission').setAttribute('aria-label',next?`交付點在${next.x< -2.5?'左':next.x>2.5?'右':'前'}方，距離 ${distance} 公尺`:`終點距離 ${distance} 公尺`);
    const fixed=r.remaining.toFixed(1),[whole,part]=fixed.split('.');$('timer').innerHTML=`${whole}<span>.${part}</span>`;$('timer').parentElement.classList.toggle('urgent',r.remaining<15);
    $('delivery-count').textContent=`✓ ${r.delivered}/3`;$('delivery-count').setAttribute('aria-label',`已送達 ${r.delivered} 件，共 3 件`);$('route-fill').style.width=Math.min(100,r.distance/r.contract.length*100)+'%';
    $('speed').textContent=Math.round(r.speed*3.6);$('score').textContent=String(r.score).padStart(6,'0');$('combo').textContent=`×${1+Math.min(4,Math.floor(r.chain/5))}`;$('combo').hidden=r.chain<5;
    $('energy-value').textContent=Math.round(r.energy/r.capacity*100)+'%';$('energy-fill').style.width=r.energy/r.capacity*100+'%';
    const boostButton=document.querySelector('[data-action="boost"]');boostButton.classList.toggle('held',r.autoBoost);boostButton.setAttribute('aria-pressed',String(r.autoBoost));boostButton.querySelector('small').textContent=r.autoBoost?'衝刺中':'衝刺';
    $('fleet-status').textContent=`⚑ ${r.racePosition()}/6`;
    if(r.phase==='countdown')$('countdown').querySelector('strong').textContent=Math.max(1,Math.ceil(r.countdown));
    const fork=r.forks.find(f=>r.distance>=f.start-160&&r.distance<f.end),card=$('fork-card');card.hidden=!fork||r.phase==='countdown';
    if(fork&&!card.hidden){
      const pending=fork.choice===null;card.classList.toggle('chosen',!pending);$('fork-options').hidden=!pending;$('fork-progress').hidden=pending;
      $('fork-title').textContent=pending?(r.distance<fork.start?`選路 · ${Math.ceil(fork.start-r.distance)} m`:'← 選路 →'):NC.routes[fork.options[fork.choice]].name;
      const actions={sprint:'衝刺穿門',sky:'跳台接星',slalom:'左右穿環',charge:'收集光環'};
      if(pending)document.querySelectorAll('[data-branch]').forEach(el=>{const side=Number(el.dataset.branch),kind=fork.options[side],route=NC.routes[kind];el.querySelector('strong').textContent=(side?'↗ ':'↖ ')+actions[kind];el.style.setProperty('--route-color',route.color);el.classList.toggle('selected',(r.x>0?1:0)===side);});
      else{const kind=fork.options[fork.choice],route=NC.routes[kind];$('fork-progress').textContent=`${actions[kind]} ${fork.progress}/${route.need}`;card.hidden=fork.won;}
    }
  }
  const manual=`<div class="manual"><p>你是霓光城的晴空快遞員。角色會自動前進，一班約一至兩分鐘，依路線與操作節奏變化。把三件包裹送進跑道上的<strong>綠色光門</strong>，再衝過終點。</p><div class="key-row"><span>按住左右平順移動，放開快速停住</span><kbd>← / →</kbd></div><div class="key-row"><span>跳躍；躍動角色可再跳一次</span><kbd>SPACE</kbd></div><div class="key-row"><span>按住衝刺 / 按住緩行</span><kbd>↑ / ↓</kbd></div><div class="key-row"><span>暫停 / 返回</span><kbd>ESC</kbd></div><h3>看路線，也抓節奏</h3><ul><li>青色光環：補充能量，連續收集會提高倍率，最高 ×5。超過 5.5 秒沒接到連段會歸零。</li><li>橘色橫桿、通風口：跳過或從旁邊繞過。橘色警示箱：從旁邊繞過。</li><li>青色地面箭頭：經過就補充 25 點能量。</li><li>綠色交付光門：對準光門穿過即自動交付，獎勵 4 秒與能量。</li><li>失誤會短暫減速並中斷連段，包裹不會掉落。錯過交付點也能繼續完成航程。</li></ul><h3>分岔：選一條你的路</h3><p>每趟有三處分岔。接近路口時，站在跑道左半邊選左路、右半邊選右路；正中央預設左路。兩側還連在一起時可自由改選，等中央護欄真正分開才確定路線。不碰搖桿或方向鍵會直行，彎道要自行左右操控；碰到護欄才會擦撞。支線內仍可自由左右移動，末端重新連成寬跑道。</p><ul><li>極速環道：速度更快，啟動衝刺穿過三道光門。</li><li>空中躍台：踩紫色跳台會自動彈起，在空中接住三顆高空星。</li><li>節奏曲線：自由轉向，連續穿過四道精準環。</li><li>磁力花園：吸取範圍擴大，接住六顆光環。</li></ul><p>每完成一條支線挑戰，加 4 秒、積分、能量及 25 XP；磁力花園會充滿能量。挑戰沒完成也能繼續配送。</p><h3>成為你的那一種快遞員</h3><p>可選三位快遞員，或紅、黃、藍皮克敏。紅皮克敏與疾風擅長衝刺；黃皮克敏與躍動可二段跳；藍皮克敏與共鳴擅長遠距收集。三種皮克敏都有獨立 3D 造型，選好後會自動保存。完成委託累積經驗，每 220 XP 升一級並獲得技能點，最多 9 點，能永久提升能量、收集範圍或委託時間。</p><h3>五位同行外送員</h3><p>小嵐、阿澈、米洛、沐沐、星野由電腦控制，會自行選路、避開設施、踩跳台、衝刺並配送。近處以小色點辨識，各自有獨立能量和包裹；不會搶走你的光環，碰到同行者會輕微彈開、亮起接觸光圈並短暫減速；擦到護欄會輕晃和減速，不扣能量、不打斷連段。左下方顯示你在六位外送員中的即時順位。</p><h3>城市會跟著你變化</h3><p>順風航道提高速度；磁力潮汐擴大收集範圍；追光時刻讓積分加倍。每次路線配置會改變，每組障礙都保留足夠的通行空間。</p><p>手機搖桿可任意旋轉：偏左就向左、偏右就向右，純上下不改變速度，橫移會平順起步、快速停住，垂直附近設有防抖區。右側衝刺點一次就持續到能量耗盡，浮板會噴出青白色氮氣尾焰，放手仍會衝刺；耗盡後自動回充，再點一次可重新啟動。另一顆按鈕用來跳躍，可同時操作。暫停與說明期間倒數停止；切換分頁也會自動暫停。</p><p class="storage-note">角色與最高紀錄只儲存在目前瀏覽器。本遊戲不需要登入或連線，也沒有付費項目。</p></div>`;
  function openInfo(kind){
    game.infoOrigin=game.mode==='paused'?'paused':'cover';game.infoFocus=document.activeElement;game.infoKind=kind;mode('info');
    $('info-kicker').textContent=kind==='career'?'RUNNER PROFILE':'FIELD MANUAL';$('info-title').textContent=kind==='career'?'把專長，練成風格。':'晴空指南';
    if(kind==='career')renderCareer();else $('info-content').innerHTML=manual;focus('close-info');
  }
  function renderCareer(){
    const p=game.profile,rank=NC.rank(p);$('info-content').innerHTML=`<div class="career-summary"><span>LV.${rank.lv} ${rank.title}</span><strong>${NC.points(p)} <small>技能點</small></strong></div><div class="career-xp"><i style="width:${p.xp%220/220*100}%"></i></div>`;
    for(const [key,skill] of Object.entries(NC.skills)){
      const row=document.createElement('div');row.className='skill-card';row.innerHTML=`<div><h3>${skill.name} <small>${p.skills[key]} / 3</small></h3><p>${skill.detail}</p></div><button data-skill="${key}" ${!NC.points(p)||p.skills[key]>=3?'disabled':''}>${p.skills[key]>=3?'已滿級':'升級 +1'}</button>`;
      row.querySelector('button').onclick=()=>{if(!NC.points(p)||p.skills[key]>=3)return;p.skills[key]++;save();renderCareer();syncCover();focus('close-info');};$('info-content').append(row);
    }
    const note=document.createElement('p');note.className='storage-note';note.textContent=`累計 ${p.runs} 班配送 · ${p.xp} XP · 最高 ${p.best.toLocaleString()} 分。${game.storageOK?'成長自動保存，下次接單時生效。':'目前瀏覽器無法保存，成長在本次頁面內仍然有效。'}`;$('info-content').append(note);
  }
  function closeInfo(){if(game.mode!=='info')return;mode(game.infoOrigin);if(game.infoFocus?.isConnected)game.infoFocus.focus({preventScroll:true});}
  document.querySelectorAll('[data-family]').forEach(b=>b.onclick=()=>{const first=Object.keys(NC.roles).find(id=>(NC.roles[id].species==='pikmin'?'pikmin':'human')===b.dataset.family);game.profile.role=first;save();syncCover();});
  $('pilot-name').addEventListener('change',nameChanged);
  document.querySelectorAll('[data-role]').forEach(b=>b.onclick=()=>{game.profile.role=b.dataset.role;save();syncCover();});
  $('contract-next').onclick=()=>{game.profile.contract=(game.profile.contract+1)%3;save();syncCover();};
  $('launch').onclick=launch;$('again').onclick=launch;$('restart').onclick=launch;$('pause').onclick=pause;$('resume').onclick=resume;
  $('return-cover').onclick=cover;$('result-home').onclick=cover;$('open-career').onclick=()=>openInfo('career');$('open-help').onclick=()=>openInfo('help');$('pause-help').onclick=()=>openInfo('help');$('close-info').onclick=closeInfo;
  $('sound').onclick=()=>{audio.toggle();game.profile.sound=audio.enabled;save();syncSound();};
  stick=game.stick=new NC.TouchStick($('joystick'),$('joystick-stick'),{active:()=>['running','countdown'].includes(game.mode),axes:x=>{held.stickX=x;syncInput();},unlock:()=>audio.unlock()});
  for(const button of document.querySelectorAll('[data-action]')){
    let pointer=null;
    button.addEventListener('pointerdown',e=>{
      e.preventDefault();if(!['running','countdown'].includes(game.mode)||pointer!==null)return;pointer=e.pointerId;audio.unlock();button.setPointerCapture(e.pointerId);button.classList.add('held');const a=button.dataset.action;
      if(a==='jump')game.run.jump();if(a==='boost')game.run.startBoost();
    });
    const release=e=>{if(e.pointerId!==pointer)return;pointer=null;if(button.dataset.action!=='boost')button.classList.remove('held');};
    button.addEventListener('pointerup',release);button.addEventListener('pointercancel',release);button.addEventListener('lostpointercapture',release);
  }
  function menuButtons(){const root=$({cover:'cover',paused:'pause-panel',result:'result',info:'info-panel'}[game.mode]);return root?[...root.querySelectorAll('button:not(:disabled),input,a')].filter(e=>e.getClientRects().length):[];}
  document.addEventListener('keydown',e=>{
    if(game.ended)return;
    if(e.ctrlKey||e.metaKey||e.altKey)return;
    if(e.target.matches('input,textarea,[contenteditable=true]')){if(e.code==='Escape'||e.code==='Enter'){e.preventDefault();nameChanged();focus('launch');}return;}
    if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space','Escape'].includes(e.code))return;
    e.preventDefault();audio.unlock();
    if(e.code==='Escape'&&!e.repeat){if(['running','countdown'].includes(game.mode))pause();else if(game.mode==='paused')resume();else if(game.mode==='info')closeInfo();else if(game.mode==='result')cover();return;}
    if(['running','countdown'].includes(game.mode)){
      if(e.code==='ArrowUp')held.boost=true;if(e.code==='ArrowDown')held.brake=true;if(e.code==='ArrowLeft')held.left=true;if(e.code==='ArrowRight')held.right=true;syncInput();
      if(!e.repeat&&e.code==='Space')game.run.jump();return;
    }
    if(e.repeat)return;const buttons=menuButtons();if(!buttons.length)return;let index=buttons.indexOf(document.activeElement);
    if(e.code==='Space'){if(index<0)index=0;const target=buttons[index];if(target.tagName==='INPUT')target.focus();else target.click();}
    else if(e.code.startsWith('Arrow')){const delta=e.code==='ArrowDown'||e.code==='ArrowRight'?1:-1;index=index<0?0:(index+delta+buttons.length)%buttons.length;buttons[index].focus({preventScroll:true});if(game.mode==='info')buttons[index].scrollIntoView({block:'nearest'});}
  });
  document.addEventListener('keyup',e=>{if(e.code==='ArrowUp')held.boost=false;if(e.code==='ArrowDown')held.brake=false;if(e.code==='ArrowLeft')held.left=false;if(e.code==='ArrowRight')held.right=false;syncInput();});
  window.addEventListener('blur',()=>{clearInput();pause();});document.addEventListener('visibilitychange',()=>{if(document.hidden){clearInput();pause();audio.quiet();}});
  let inputWidth=innerWidth,inputOrientation=screen.orientation?.angle;
  window.addEventListener('resize',()=>{const angle=screen.orientation?.angle;if(Math.abs(innerWidth-inputWidth)>4||angle!==inputOrientation)clearInput();inputWidth=innerWidth;inputOrientation=angle;syncTouch();});window.addEventListener('pagehide',()=>audio.quiet());
  $('world').addEventListener('webglcontextlost',e=>{e.preventDefault();pause();error('3D 畫面連線已中斷。角色紀錄已保留，請重新整理再出發。');});
  // Fixed simulation steps prevent tunnelling at high speed and decouple physics from display refresh.
  function frame(now){
    if(game.ended)return;const dt=Math.min(.10,Math.max(0,(now-(game.lastStamp||now))/1000));game.lastStamp=now;
    if(['running','countdown'].includes(game.mode)){
      game.accumulator+=dt;while(game.accumulator>=1/90&&['running','countdown'].includes(game.mode)){game.run.step(1/90,game.input);game.accumulator-=1/90;notices();}
      game.toastTime=Math.max(0,game.toastTime-dt);game.radioTime=Math.max(0,game.radioTime-dt);if(!game.toastTime)$('toast').hidden=true;if(!game.radioTime)$('radio').hidden=true;hud();
    }
    audio.update(dt,game.mode==='running',game.run?.boosting);world.update(game.run,dt,game.mode==='cover'||(game.mode==='info'&&game.infoOrigin==='cover'));
    requestAnimationFrame(frame);
  }
  game.launch=launch;game.pause=pause;game.resume=resume;game.cover=cover;game.openInfo=openInfo;
  syncCover();syncSound();focus('launch');requestAnimationFrame(frame);
})();
