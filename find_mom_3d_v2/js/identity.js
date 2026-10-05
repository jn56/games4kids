'use strict';
// Original role IDs and script text remain stable for saves and recorded takes.
Meadow.Identity=class {
  constructor(game){
    this.game=game;this.names={};this.key='little-lights-v2-names';this.sources=new WeakMap();this.next=0;
    try{const data=JSON.parse(localStorage.getItem(this.key));if(data&&typeof data==='object'&&!Array.isArray(data))for(const [role,name] of Object.entries(data))if(this.roles().includes(role)&&this.valid(name))this.names[role]=name;}catch(_){}
    this.panel=document.getElementById('character-studio');this.role=document.getElementById('character-role');this.input=document.getElementById('character-name');
    for(const role of this.roles())this.role.add(new Option(role,role));
    const open=()=>{this.panel.showModal();game.input.reset();this.load();};
    document.getElementById('character-open').onclick=open;document.getElementById('pause-characters').onclick=open;
    this.role.onchange=()=>this.load();document.getElementById('character-save').onclick=()=>this.save();
    document.getElementById('character-reset').onclick=()=>{delete this.names[this.role.value];this.persist();this.load();};
    document.getElementById('character-close').onclick=()=>this.panel.close();
    this.panel.addEventListener('close',()=>game.input.reset());
  }
  roles(){return [...new Set(Meadow.VoiceCatalog.map(line=>line.name))];}
  valid(name){return typeof name==='string'&&name.trim().length>0&&[...name].length<=12&&!/[\u0000-\u001f\u007f<>]/u.test(name);}
  display(role){return this.names[Meadow.Script.role(role)]||role;}
  text(text){
    text=text.replace(/按 E/g,'按空白鍵').replace(/WASD／方向鍵/g,'方向鍵');
    const keys=Object.keys(this.names).sort((a,b)=>b.length-a.length);if(!keys.length)return text;
    const pattern=keys.map(key=>key.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|');
    return text.replace(new RegExp(pattern,'gu'),role=>this.names[role]);
  }
  load(){this.input.value=this.names[this.role.value]||this.role.value;document.getElementById('character-status').textContent='最多 12 個字。按 Esc 結束文字輸入，再用方向鍵選「保存名稱」。';}
  save(){
    const name=this.input.value.trim().normalize('NFC');
    if(!this.valid(name)){document.getElementById('character-status').textContent='請填 1～12 個字，避免控制字元與 < >。';return;}
    if(name===this.role.value)delete this.names[this.role.value];else this.names[this.role.value]=name;
    this.persist();
  }
  persist(){
    let stored=true;try{localStorage.setItem(this.key,JSON.stringify(this.names));}catch(_){stored=false;}
    document.getElementById('character-status').textContent=stored?'名稱已保存。原本錄好的配音仍然可用。':'名稱已套用；瀏覽器目前無法保存，關閉後會還原。';
    this.next=0;this.applyWorld();this.update(true);
  }
  replace(el){
    if(!el||el.closest('#character-studio'))return;
    const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);let node;
    while((node=walker.nextNode())){
      const current=node.nodeValue,source=this.sources.get(node),base=source&&current===source.last?source.base:current,last=this.text(base);
      if(current!==last)node.nodeValue=last;this.sources.set(node,{base,last});
    }
  }
  applyWorld(){for(const world of Object.values(this.game.worldCache))for(const label of world.world.labels)this.replace(label.el.querySelector('.label-bubble'));}
  update(force=false){
    const now=performance.now()/1000;if(!force&&now<this.next)return;this.next=now+.16;
    const selectors='.label-bubble,#dialogue-name,#dialogue-text,#story-caption,#voice-name,#voice-text,#voice-scope,#voice-role option,#voice-lines option,#objective-title,#interaction-prompt span,#toast,#errand-list h3,#errand-list p,#errand-list small,#ending-title,#ending-description,#ending-next,#puzzle-title,#puzzle-stage h3,#puzzle-stage p,#puzzle-notes p,#puzzle-notes li,.cover-description,#start-btn,#new-game-btn';
    document.querySelectorAll(selectors).forEach(el=>this.replace(el));
  }
};
