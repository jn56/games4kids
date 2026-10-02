'use strict';
// One explicit next step for each optional activity; story progress stays separate.
Meadow.Errands=class {
  constructor(game){
    this.game=game;this.selected=new Map();this.panel=document.getElementById('errand-board');
    document.getElementById('objective-title').onclick=()=>this.open();
    document.getElementById('errand-close').onclick=()=>this.panel.close();
    this.panel.addEventListener('close',()=>{if(game.state.mode==='errands')game.state.mode='playing';game.input.reset();game.refresh();});
  }
  track(kind){this.selected.set(this.game.state.chapter,kind);}
  entries(){
    const g=this.game,s=g.state,c=s.chapter-1,cast=g.world.residents,stage=s.sideStories[c],family=s.familyStories[c];
    const who=cast[[0,1,2,0][Math.min(stage,3)]],relative=cast[family===0?3:4];
    const steps=['問問畫的主人','補完晚安歌','找到紙船的主人','一起設計回家燈'];
    const rows=[
      {kind:'story',title:Meadow.SideStories.stories[c].title,done:stage===4,npc:who,step:stage,total:4,detail:stage===4?'已收藏：'+Meadow.SideStories.stories[c].reward:stage===3?'回去告訴'+who.name:'找'+who.name+'，'+steps[c],trail:[0,1,2,0].map(i=>cast[i].name).join(' → ')},
      {kind:'family',title:Meadow.FamilyStories.stories[c].title,done:family>=3,npc:relative,step:family===0?0:family<3?1:2,total:2,detail:family>=3?'故事完成，還可以回訪聊天':family===0?'找'+relative.name+'，選一個辦法':'找'+relative.name+'，把話帶到',trail:cast[3].name+' → '+cast[4].name}
    ];
    const parcel=g.sandbox.held,item=parcel||g.world.playground.items.find(o=>o.kind==='parcel'&&o.mesh.visible),recipient=parcel&&g.world.locals[parcel.to],delivery=parcel&&g.sandbox.target();
    rows.push({kind:'parcel',title:'幫鄰居送包裹',done:!item,position:parcel?delivery?.position:item?.position,label:delivery?.label,npc:recipient,step:g.sandbox.progress().parcels.length,total:4,detail:parcel?delivery?'交給'+recipient.name:'先完成渡河，再找'+recipient.name:item?'先拿起彩色包裹':'四份包裹都送到了',trail:'拿包裹 → 找收件人 → 按互動交付'});
    rows.push({kind:'race',title:'環道計時',position:g.world.streetRun?.mesh.position,detail:'到黑白旗前按互動',trail:'45 秒內，依序穿過 11 個光圈'});
    return rows;
  }
  choice(){
    const g=this.game,c=g.state.chapter;
    if(this.selected.has(c))return this.selected.get(c);
    return g.sandbox.held?'parcel':g.state.familyStories[c-1]>0&&g.state.familyStories[c-1]<3?'family':g.state.sideStories[c-1]>0&&g.state.sideStories[c-1]<4?'story':'main';
  }
  target(){
    const entry=this.entries().find(row=>row.kind===this.choice());if(!entry||entry.done)return null;
    const position=entry.kind==='parcel'?entry.position:entry.position||entry.npc?.mesh.position;
    if(!position)return null;
    return {position,label:entry.label||entry.npc?.label,text:entry.kind==='race'?'⚑ 找黑白旗':entry.kind==='parcel'?this.game.sandbox.held?'✉ 交給'+entry.npc.name:'✉ 拿包裹':'💬 找'+entry.npc.name};
  }
  open(){
    const g=this.game;if(g.state.mode!=='playing')return;
    g.streetRun.prepare();g.state.mode='errands';g.input.reset();g.voices.stop();
    const list=document.getElementById('errand-list');list.replaceChildren();
    const main=document.createElement('button');main.className='errand-main';main.textContent='♡ 繼續找媽媽';main.onclick=()=>{g.streetRun.stop(null,false);g.travel.selected=0;this.track('main');this.panel.close();};list.append(main);
    for(const entry of this.entries()){
      const card=document.createElement('section'),title=document.createElement('h3'),detail=document.createElement('p'),trail=document.createElement('small'),button=document.createElement('button');
      card.className='errand-card';title.textContent=(entry.done?'✓ ':'')+entry.title;detail.textContent=entry.detail;trail.textContent=entry.trail;
      button.textContent=entry.done?'已完成':'帶我去';button.disabled=!!entry.done;button.dataset.errand=entry.kind;button.setAttribute('aria-label','帶我去：'+entry.title);
      button.onclick=()=>{g.streetRun.stop(null,false);g.travel.selected=0;this.track(entry.kind);this.panel.close();};
      card.append(title,detail,trail,button);list.append(card);
    }
    this.panel.showModal();this.panel.scrollTop=0;
  }
};
