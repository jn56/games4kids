'use strict';
Meadow.Dialogue = class {
  constructor(game) {
    this.game=game;this.panel=document.getElementById('dialogue-ui');this.lines=[];this.index=0;this.callback=null;
    document.getElementById('dialogue-next').addEventListener('click',()=>this.next());
    // Tapping the story text also advances it; the next button is a separate target.
    document.getElementById('dialogue-text').addEventListener('click',()=>this.next());
  }
  show(lines,callback,choices=null) {
    // Keep each page short enough for large, comfortably readable text.
    this.lines=Meadow.Script.pages(lines);this.index=0;this.callback=callback;this.choices=choices;
    this.game.world.talkingActors=new Set(lines.map(line=>Meadow.Script.role(line.name)));
    for(const n of [...(this.game.world.residents||[]),...(this.game.world.locals||[])])if(this.game.world.talkingActors.has(n.name))n.dodge=null;
    this.game.state.mode='dialogue';this.game.input.reset();this.panel.hidden=false;
    document.body.classList.add('in-dialogue');this.render();this.game.interactions.update();
    (this.choices&&this.lines.length===1?document.querySelector('#dialogue-choices button'):document.getElementById('dialogue-next')).focus({preventScroll:true});
  }
  render() {
    const line=this.lines[this.index];
    this.game.voices?.playLine(line.name,line.text);
    document.getElementById('dialogue-name').textContent=line.name;
    document.getElementById('dialogue-text').textContent=line.text;
    document.getElementById('dialogue-count').textContent=`${this.index+1} / ${this.lines.length}`;
    Meadow.Portraits.render(document.getElementById('dialogue-portrait'),line,this.game);
    document.getElementById('dialogue-next').innerHTML=this.index===this.lines.length-1?'出發吧 <span>→</span>':'繼續 <span>→</span>';
    const options=document.getElementById('dialogue-choices'),last=this.index===this.lines.length-1&&this.choices;
    options.replaceChildren();options.hidden=!last;document.getElementById('dialogue-next').hidden=!!last;
    if(last)this.choices.forEach(choice=>{
      const button=document.createElement('button');button.className='secondary-btn';button.textContent=choice.label;
      button.onclick=()=>{if(this.game.state.mode!=='dialogue')return;this.close();choice.choose();};options.append(button);
    });
    if(last)options.querySelector('button').focus({preventScroll:true});
  }
  next() {
    if(this.game.state.mode!=='dialogue')return;
    if(this.index===this.lines.length-1&&this.choices)return;
    this.game.audio.note(523,.07,.015);
    if(++this.index<this.lines.length){this.render();return;}
    const done=this.callback;this.close();if(done)done();
  }
  close() {
    this.game.world.talkingActors=null;
    this.game.voices?.stop();this.choices=null;document.getElementById('dialogue-choices').hidden=true;document.getElementById('dialogue-next').hidden=false;
    this.panel.hidden=true;this.callback=null;this.lines=[];
    document.body.classList.remove('in-dialogue');this.game.input.reset();this.game.state.mode='playing';
    document.getElementById('dialogue-next').blur();
  }
};
