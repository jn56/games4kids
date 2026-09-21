'use strict';
Meadow.Dialogue = class {
  constructor(game) {
    this.game=game;this.panel=document.getElementById('dialogue-ui');this.lines=[];this.index=0;this.callback=null;
    document.getElementById('dialogue-next').addEventListener('click',()=>this.next());
    // Tapping the story text also advances it; the next button is a separate target.
    document.getElementById('dialogue-text').addEventListener('click',()=>this.next());
  }
  show(lines,callback) {
    // Keep each page short enough for large, comfortably readable text.
    this.lines=lines.flatMap(line=>{
      const pages=[];let rest=line.text;
      while(rest.length>36){
        const head=rest.slice(0,36);let cut=36;
        for(let i=head.length-1;i>=14;i--)if('，。！？；：'.includes(head[i])){cut=i+1;break;}
        pages.push({...line,text:rest.slice(0,cut)});rest=rest.slice(cut);
      }
      if(rest)pages.push({...line,text:rest});return pages;
    });this.index=0;this.callback=callback;
    this.game.state.mode='dialogue';this.game.input.reset();this.panel.hidden=false;
    document.body.classList.add('in-dialogue');this.render();this.game.interactions.update();
    document.getElementById('dialogue-next').focus({preventScroll:true});
  }
  render() {
    const line=this.lines[this.index];
    document.getElementById('dialogue-name').textContent=line.name;
    document.getElementById('dialogue-text').textContent=line.text;
    document.getElementById('dialogue-count').textContent=`${this.index+1} / ${this.lines.length}`;
    const portrait=document.getElementById('dialogue-portrait');
    portrait.className=`portrait ${line.name==='小米'?'girl':line.name.startsWith('媽媽')?'mom':''}`;
    portrait.textContent=line.name==='小米'?'👧':line.name.startsWith('媽媽')?'♡':line.name==='栗栗'?'🦔':line.name==='咕咕'?'🦉':line.name==='木木'?'🦫':line.name==='星星'?'🐿':'🐰';
    document.getElementById('dialogue-next').innerHTML=this.index===this.lines.length-1?'出發吧 <span>→</span>':'繼續 <span>→</span>';
  }
  next() {
    if(this.game.state.mode!=='dialogue')return;
    this.game.audio.note(523,.07,.015);
    if(++this.index<this.lines.length){this.render();return;}
    const done=this.callback;this.close();if(done)done();
  }
  close() {
    this.panel.hidden=true;this.callback=null;this.lines=[];
    document.body.classList.remove('in-dialogue');this.game.input.reset();this.game.state.mode='playing';
    document.getElementById('dialogue-next').blur();
  }
};
