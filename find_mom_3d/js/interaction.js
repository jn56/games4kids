'use strict';
Meadow.Interactions = class {
  constructor(game) { this.game=game;this.current=null;this.prompt=document.getElementById('interaction-prompt');this.touch=document.getElementById('touch-action'); }
  candidates() {
    const {world,state}=this.game, items=[];
    if(state.chapter>=3)return this.game.story.candidates();
    if(state.chapter===2){
      items.push({id:'owl',position:world.owl.mesh.position,text:state.forest.separated?'和咕咕一起找新的路':'和咕咕說話'});
      items.push({id:'music',position:world.stand.position,text:state.forest.round===3&&state.forest.gustStage<6?'挑戰疾風小徑':'試奏風鈴旋律'});
      CONFIG.BELLS.forEach(b=>items.push({id:`bell-${b.id}`,position:world.bells.get(b.id).mesh.position,text:`${b.symbol} 敲敲${b.name}`}));
      if(!state.forest.separated)items.push({id:'mother',position:world.mother.mesh.position,text:'媽媽，我找到你了！'});
      items.push({id:'forest-exit',position:world.exit.position,text:'前往月光河谷步道'});
      return items;
    }
    if(!state.ribbon)items.push({id:'ribbon',position:world.ribbon.position,text:'看看紅髮帶'});
    items.push({id:'rabbit',position:world.rabbit.mesh.position,text:state.windSolved&&state.flowers.length===3&&!state.lit?'和阿蹦解開引路燈':'和阿蹦說話'});
    items.push({id:'hedgehog',position:world.hedgehog.mesh.position,text:state.metHedgehog&&!state.windSolved?'修理送信風管':'和栗栗說話'});
    if(state.windSolved&&!state.lit)CONFIG.FLOWERS.forEach(f=>{if(!state.flowers.includes(f.id))items.push({id:f.id,position:world.flowers.get(f.id).mesh.position,text:`收集${f.symbol} ${f.name}與線索`});});
    items.push({id:'lamp',position:world.lamp.position,text:state.windSolved&&state.flowers.length===3&&!state.lit?'排列回憶，解開引路燈':'看看引路燈'});
    items.push({id:'exit',position:world.arch.position,text:state.lit?'和阿蹦一起出發':'看看花拱門'});
    return items;
  }
  update() {
    const {state,player}=this.game;
    this.current=null;
    if(state.mode==='playing'){
      const p=player.mesh.position;let distance=CONFIG.INTERACT_DISTANCE;
      this.candidates().forEach(item=>{const d=Math.hypot(item.position.x-p.x,item.position.z-p.z);if(d<distance){distance=d;this.current=item;}});
    }
    this.prompt.hidden=!this.current;this.touch.disabled=!this.current;
    if(this.current){this.prompt.querySelector('span').textContent=this.current.text;this.touch.setAttribute('aria-label',this.current.text);}
  }
  act() { this.update();if(this.current)this.game.story.interact(this.current.id); }
};
