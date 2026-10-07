'use strict';
// Shared by the dialogue UI, recorder and offline catalogue builder.
Meadow.Script={
  role(name){return name.startsWith('媽媽')?'媽媽':name==='旅途小事'?'旁白':name;},
  key(name,text){return JSON.stringify([this.role(name),text]);},
  pages(lines){
    return lines.flatMap(line=>{
      const pages=[];
      for(let rest of line.text.match(/[^。！？]+[。！？]+[」』”]?|[^。！？]+$/gu)||[]){
        while(rest.length>36){
          let cut=36;for(let i=35;i>=14;i--)if('，；：'.includes(rest[i])){cut=i+1;break;}
          pages.push({...line,text:rest.slice(0,cut)});rest=rest.slice(cut);
        }
        if(rest)pages.push({...line,text:rest});
      }
      return pages;
    });
  }
};
// Captions are also recordable; one cue fires per caption, never every animation frame.
Meadow.SceneVoices=[
  [1,'旁白','一陣風，把薄霧帶進了花田……'],
  [2,'旁白','灰爪伸手追來。媽媽立刻擋在小米前面。'],
  [2,'旁白','媽媽抓住灰爪的手臂，兩人扭打著退到河沿。'],
  [2,'旁白','河沿一滑！媽媽和灰爪一起跌進河裡，濺起水花。'],
  [2,'媽媽','小米，快逃啊！','媽媽：「小米，快逃啊！」'],
  [2,'旁白','媽媽抓住浮木，被沖往下游。咕咕護著岸上的小米。'],
  [4,'旁白','小米護送媽媽進門，伸手拉下木柵門。'],
  [4,'旁白','灰爪追上山丘，伸手衝向疲累的媽媽！'],
  [4,'小米','不准傷害我媽媽！','小米擋在媽媽前面：「不准傷害我媽媽！」'],
  [4,'旁白','木柵門擋住灰爪。媽媽安全了！'],
  [4,'小米','媽媽，我真的找到你了。'],
  [4,'旁白','四盞燈，一條回家的路。']
];
