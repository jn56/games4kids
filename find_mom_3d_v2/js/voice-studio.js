'use strict';
Meadow.VoiceStudio=class {
  constructor(game){
    this.game=game;this.panel=document.getElementById('voice-studio');this.records=new Map();this.catalog=new Map();this.capture=null;this.busy=false;
    for(const line of Meadow.VoiceCatalog)this.catalog.set(Meadow.Script.key(line.name,line.text),line);
    this.enabled=true;try{this.enabled=localStorage.getItem('little-lights-use-voices')!=='off';}catch(_){}
    this.el('use').checked=this.enabled;
    const roles=[...new Set([...this.catalog.values()].map(l=>l.name))];
    for(const name of roles)this.el('role').add(new Option(name,name));
    this.el('open').onclick=()=>this.open();this.el('close').onclick=()=>this.panel.close();
    this.panel.addEventListener('close',()=>{this.stopRecording(false);this.stop();this.game.input.reset();});
    this.panel.addEventListener('cancel',()=>{this.stopRecording(false);this.stop();});
    this.el('role').onchange=()=>this.showWholeRole();
    for(const id of ['chapter','missing'])this.el(id).onchange=()=>this.renderList();
    this.el('scope-reset').onclick=()=>this.showWholeRole();
    this.el('search').oninput=()=>this.renderList();
    this.el('lines').onchange=()=>{this.stop();this.renderLine();};
    this.el('record').onclick=()=>this.capture?this.stopRecording(true):this.record();
    this.el('listen').onclick=()=>this.preview();this.el('delete').onclick=()=>this.remove();
    this.el('previous').onclick=()=>this.move(-1);this.el('next').onclick=()=>this.move(1);
    this.el('export').onclick=()=>this.export();this.el('import').onclick=()=>this.el('file').click();
    this.el('file').onchange=()=>{const file=this.el('file').files[0];if(file)this.import(file);this.el('file').value='';};
    this.el('use').onchange=()=>{this.enabled=this.el('use').checked;this.stop();try{localStorage.setItem('little-lights-use-voices',this.enabled?'on':'off');}catch(_){}};
    document.addEventListener('visibilitychange',()=>{if(document.hidden){this.stopRecording(false);this.stop();}});
    window.addEventListener('pagehide',()=>{this.stopRecording(false);this.stop();});
    const caption=document.getElementById('story-caption');
    new MutationObserver(()=>{
      if(caption.hidden){this.lastCaption='';if(this.game.state.mode==='cutscene')this.stop();return;}
      const text=caption.textContent;if(text===this.lastCaption||this.game.state.mode!=='cutscene')return;this.lastCaption=text;
      const cue=Meadow.SceneVoices.find(([,name,line,display])=>(display||line)===text);
      if(cue)this.playSequence(Meadow.Script.pages([{name:cue[1],text:cue[2]}]));
    }).observe(caption,{childList:true,attributes:true,attributeFilter:['hidden']});
    this.ready=this.load();
  }
  el(id){return document.getElementById('voice-'+id);}
  status(text){if(this.el('status').textContent!==text)this.el('status').textContent=text;}
  async load(){
    try{
      this.db=await new Promise((resolve,reject)=>{
        const request=indexedDB.open('little-lights-voices',1);
        request.onupgradeneeded=()=>request.result.createObjectStore('takes',{keyPath:'key'});
        request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);
        request.onblocked=()=>this.status('請關閉其他配音室分頁，再重新整理。');
      });
      this.db.onversionchange=()=>{this.db.close();this.db=null;this.status('配音資料已更新，請重新整理。');this.renderLine();};
      const takes=await new Promise((resolve,reject)=>{
        const tx=this.db.transaction('takes','readonly'),request=tx.objectStore('takes').getAll();
        tx.oncomplete=()=>resolve(request.result);tx.onabort=()=>reject(tx.error);tx.onerror=()=>{};
      });
      for(const take of takes)if(take.blob instanceof Blob&&take.blob.size)this.records.set(take.key,take);
    }catch(_){this.db=null;this.storageError=true;}
  }
  async write(takes,removeKey){
    if(!this.db)throw new Error('storage');
    await new Promise((resolve,reject)=>{
      const tx=this.db.transaction('takes','readwrite'),store=tx.objectStore('takes');
      for(const take of takes)store.put(take);if(removeKey)store.delete(removeKey);
      tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);tx.onerror=()=>{};
    });
  }
  async open(){
    if(!['title','paused','complete'].includes(this.game.state.mode))return;
    this.stop();this.game.input.reset();this.panel.showModal();this.status('載入配音…');await this.ready;
    this.renderList();this.status(this.storageError?'無法儲存配音，請使用可保存網站資料的瀏覽器。':'錄音只存在這個瀏覽器，可匯出備份。');
  }
  filtered(){
    const role=this.el('role').value,chapter=Number(this.el('chapter').value),query=this.el('search').value.trim(),missing=this.el('missing').checked;
    return [...this.catalog].filter(([key,line])=>(!role||line.name===role)&&(!chapter||line.chapters.includes(chapter))&&(!query||line.text.includes(query)||line.name.includes(query))&&(!missing||!this.records.has(key)));
  }
  showWholeRole(){this.el('chapter').value='0';this.el('search').value='';this.el('missing').checked=false;this.renderList();}
  renderList(preferred=this.el('lines').value){
    this.stop();
    const list=this.el('lines');list.replaceChildren();
    for(const [i,[key,line]] of this.filtered().entries())list.add(new Option(`${this.records.has(key)?'●':'○'} ${i+1}. ${this.el('role').value?'':line.name+'｜'}${line.text}`,key));
    if([...list.options].some(o=>o.value===preferred))list.value=preferred;
    else list.selectedIndex=list.options.length?0:-1;
    this.renderLine();
  }
  renderLine(){
    const key=this.el('lines').value,line=this.catalog.get(key),locked=!!this.capture||this.busy,take=this.records.get(key);
    this.el('name').textContent=line?line.name:'';this.el('text').textContent=line?line.text:'沒有符合的台詞';
    const role=this.el('role').value,rows=[...this.catalog].filter(([,row])=>!role||row.name===role),recorded=rows.filter(([key])=>this.records.has(key)).length;
    this.el('count').textContent=`${this.el('role').options.length-1} 位角色 · ${this.catalog.size} 句台詞`;
    this.el('scope').textContent=`${role||'全部角色'}：已錄 ${recorded} / ${rows.length} 句 · 顯示 ${this.el('lines').options.length} 句`;
    for(const option of this.el('role').options){if(!option.value)continue;const own=[...this.catalog].filter(([,row])=>row.name===option.value);option.textContent=option.value+' · '+own.filter(([key])=>this.records.has(key)).length+'/'+own.length;}
    for(const id of ['role','chapter','search','missing','lines','previous','next','import','export','scope-reset'])this.el(id).disabled=locked;
    this.el('record').disabled=!line||!this.db||this.busy||!!this.capture?.pending||!!this.capture?.stopping;
    this.el('record').textContent=this.capture?'■ 停止並儲存':take?'● 重錄這句':'● 錄這一句';
    this.el('record').classList.toggle('recording',!!this.capture);
    this.el('listen').disabled=locked||!take;this.el('delete').disabled=locked||!take;
    this.el('previous').disabled=locked||this.el('lines').selectedIndex<=0;
    this.el('next').disabled=locked||this.el('lines').selectedIndex>=this.el('lines').options.length-1;
  }
  move(delta){const list=this.el('lines');list.selectedIndex=Math.max(0,Math.min(list.options.length-1,list.selectedIndex+delta));this.stop();this.status('');this.renderLine();}
  async record(){
    if(this.capture||this.busy||!this.db)return;
    if(!window.isSecureContext||!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){this.status('此瀏覽器無法錄音。請用 HTTPS 網址，並開啟麥克風權限。');return;}
    const key=this.el('lines').value,line=this.catalog.get(key);if(!line)return;
    this.stop();const capture={key,line,pending:true,chunks:[],cancelled:false};this.capture=capture;this.status('請允許使用麥克風…');this.renderLine();
    try{
      const stream=await navigator.mediaDevices.getUserMedia({audio:true,video:false});
      if(capture.cancelled||this.capture!==capture||!this.panel.open){stream.getTracks().forEach(t=>t.stop());return;}
      capture.stream=stream;capture.pending=false;
      const mimeType=['audio/webm;codecs=opus','audio/mp4','audio/ogg;codecs=opus'].find(t=>MediaRecorder.isTypeSupported(t));
      const recorder=new MediaRecorder(stream,mimeType?{mimeType}:{});capture.recorder=recorder;
      recorder.ondataavailable=e=>{if(e.data.size)capture.chunks.push(e.data);};
      recorder.onerror=()=>{this.stopRecording(false);this.status('錄音中斷，原本的配音已保留。');};
      recorder.onstop=()=>this.finishRecording(capture);
      recorder.start();capture.started=performance.now();
      this.timer=setInterval(()=>{
        const seconds=Math.floor((performance.now()-capture.started)/1000);this.status(`錄音中 ${seconds} / 30 秒`);
        if(seconds>=30)this.stopRecording(true);
      },250);
      this.status('錄音中 0 / 30 秒');this.renderLine();
    }catch(error){
      capture.stream?.getTracks().forEach(t=>t.stop());
      if(this.capture!==capture)return;this.capture=null;
      this.status(error.name==='NotAllowedError'?'未取得麥克風權限，可在網址列設定後再試。':error.name==='NotFoundError'?'找不到麥克風，請接上後再試。':'麥克風無法使用，請關閉其他錄音程式後再試。');this.renderLine();
    }
  }
  stopRecording(save){
    const capture=this.capture;if(!capture)return;
    if(!save)capture.cancelled=true;
    clearInterval(this.timer);capture.stopping=true;
    if(capture.recorder?.state==='recording')capture.recorder.stop();
    capture.stream?.getTracks().forEach(t=>t.stop());
    if(capture.pending||!save){this.capture=null;this.status('本次錄音已取消。');}
    else this.status('儲存中…');
    this.renderLine();
  }
  async finishRecording(capture){
    if(capture.cancelled)return;
    const blob=new Blob(capture.chunks,{type:capture.recorder.mimeType||capture.chunks[0]?.type||'audio/webm'});
    try{
      if(!blob.size||performance.now()-capture.started<250)throw new Error('empty');
      const take={key:capture.key,name:capture.line.name,text:capture.line.text,blob};
      await this.write([take]);this.records.set(take.key,take);this.status('已儲存，可以試聽或錄下一句。');
    }catch(error){this.status(error.message==='empty'?'錄音太短，請再錄一次。':'儲存失敗，原本的配音已保留。請匯出備份、釋放空間後再試。');}
    if(this.capture===capture)this.capture=null;this.renderList(capture.key);
  }
  async remove(){
    const key=this.el('lines').value;if(!this.records.has(key)||this.capture||this.busy)return;
    this.stop();this.busy=true;this.renderLine();
    try{await this.write([],key);this.records.delete(key);this.status('已刪除這一句配音。');}catch(_){this.status('刪除失敗，配音仍保留。');}
    this.busy=false;this.renderList(key);
  }
  stop(){
    this.playToken=(this.playToken||0)+1;
    if(this.audio){this.audio.pause();this.audio.removeAttribute('src');this.audio.load();this.audio=null;}
    if(this.url){URL.revokeObjectURL(this.url);this.url=null;}
    this.game.audio?.duck(false);
  }
  async play(take,preview=false,done=null){
    this.stop();if(!take)return;
    const token=this.playToken;this.url=URL.createObjectURL(take.blob);this.audio=new Audio(this.url);this.audio.volume=1;
    this.audio.onended=()=>{if(token===this.playToken){this.stop();if(preview)this.status('試聽結束。');if(done)done();}};
    this.audio.onerror=()=>{if(token===this.playToken){this.stop();if(preview)this.status('這段錄音無法播放，請重新錄音。');}};
    this.game.audio.duck(true);
    try{await this.audio.play();if(preview&&token===this.playToken)this.status('試聽中…');}
    catch(_){if(token===this.playToken){this.stop();if(preview)this.status('無法播放，請再按一次試聽或重新錄音。');}}
  }
  preview(){if(!this.capture&&!this.busy)this.play(this.records.get(this.el('lines').value),true);}
  playLine(name,text){
    this.stop();if(!this.enabled||!this.game.audio.enabled||this.game.audio.paused||this.panel.open)return;
    const pages=Meadow.Script.pages([{name,text}]);if(pages.length>1){this.playSequence(pages);return;}
    this.play(this.records.get(Meadow.Script.key(name,text)));
  }
  playSequence(lines){
    this.stop();if(!this.enabled||!this.game.audio.enabled||this.game.audio.paused||this.panel.open)return;
    const takes=lines.map(line=>this.records.get(Meadow.Script.key(line.name,line.text))).filter(Boolean);
    const next=()=>{const take=takes.shift();if(take)this.play(take,false,next);};next();
  }
  async activate(){
    await this.ready;
    if(this.enabled&&this.records.size&&!this.game.soundChosen&&!this.game.audio.enabled){
      const enabled=await this.game.audio.toggle(),button=document.getElementById('sound-btn');
      button.setAttribute('aria-pressed',String(enabled));button.setAttribute('aria-label',enabled?'關閉聲音':'開啟聲音');
      if(this.game.state.mode==='dialogue'){const line=this.game.dialogue.lines[this.game.dialogue.index];this.playLine(line.name,line.text);}
    }
  }
  async export(){
    if(this.busy||this.capture)return;this.busy=true;this.renderLine();
    try{
      const takes=[];
      for(const take of this.records.values()){
        const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.onerror=reject;reader.readAsDataURL(take.blob);});
        takes.push({name:take.name,text:take.text,type:take.blob.type,data});
      }
      const blob=new Blob([JSON.stringify({format:'little-lights-voices',version:1,takes})],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
      a.href=url;a.download='小米找媽媽-配音-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);this.status(`已匯出 ${takes.length} 句配音。`);
    }catch(_){this.status('匯出失敗，請再試一次。');}
    this.busy=false;this.renderLine();
  }
  async import(file){
    if(this.busy||this.capture)return;this.busy=true;this.stop();this.renderLine();
    try{
      if(file.size>60*1024*1024)throw new Error('large');
      const data=JSON.parse(await file.text());
      if(data.format!=='little-lights-voices'||data.version!==1||!Array.isArray(data.takes)||data.takes.length>3000)throw new Error('format');
      const takes=[],seen=new Set();
      for(const row of data.takes){
        if(typeof row.name!=='string'||typeof row.text!=='string'||typeof row.data!=='string'||row.data.length>4*1024*1024||typeof row.type!=='string'||!/^audio\/(webm|mp4|ogg|wav|mpeg)(;[^\r\n]*)?$/.test(row.type))throw new Error('format');
        const key=Meadow.Script.key(row.name,row.text);
        if(!this.catalog.has(key)||this.records.has(key)||seen.has(key))continue;
        const bytes=Uint8Array.from(atob(row.data),c=>c.charCodeAt(0));if(!bytes.length)throw new Error('empty');
        seen.add(key);takes.push({key,name:Meadow.Script.role(row.name),text:row.text,blob:new Blob([bytes],{type:row.type})});
      }
      await this.write(takes);for(const take of takes)this.records.set(take.key,take);
      this.status(`已匯入 ${takes.length} 句，保留原有配音。`);
    }catch(_){this.status('匯入失敗：請選擇配音室匯出的備份，並確認儲存空間足夠。');}
    this.busy=false;this.renderList();
  }
};
