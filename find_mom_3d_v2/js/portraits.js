'use strict';
// Small vector busts share the world's species and colours. Stable script role
// IDs choose the picture; player-defined display names never change that ID.
Meadow.Portraits={
  expressions:{neutral:'平靜',happy:'開心',worried:'擔心',surprised:'驚訝'},
  main:{
    小米:{kind:'girl',color:0xf4ccaa,accent:0xd17d55,hair:0x513c32},
    媽媽:{kind:'mother',color:0xf1cdac,accent:0x729e9b,hair:0x654b3b},
    阿蹦:{kind:'rabbit',color:0xf5eedb,accent:0x748e9a},
    栗栗:{kind:'hedgehog',color:0xe6cfaa,accent:0x688476},
    咕咕:{kind:'owl',color:0x99876a,accent:0x7dabb3},
    木木:{kind:'beaver',color:0xae8860,accent:0x728994},
    星星:{kind:'squirrel',color:0xb58a65,accent:0x9d93bc},
    灰爪:{kind:'wolf',color:0x93958e,accent:0x646e68},
    小皮:{kind:'monkey',color:0x93623e,accent:0xd7ae79},
    嗡嗡:{kind:'mosquito',color:0x697e79,accent:0xb9d4d8},
    旁白:{kind:'book',color:0xf3e5bf,accent:0x8d9d7a}
  },
  cache:new Map(),serial:0,
  profile(name,game){
    const role=Meadow.Script.role(name);
    if(this.main[role])return this.main[role];
    const npc=[...(game?.world?.residents||[]),...(game?.world?.locals||[]),...Object.values(Meadow.Residents||{}).flat()].find(n=>n.name===role);
    if(npc)return {kind:npc.kind,color:npc.color,accent:npc.accent};
    for(const names of Meadow.Sandbox?.names||[]){const i=names.indexOf(role);if(i>=0)return {kind:['cat','bird','turtle','cat'][i],color:[0xd7bc96,0xa1b6c1,0x9ab29b,0xb9a7c0][i],accent:Meadow.Sandbox.colors[i]};}
    return this.main.旁白;
  },
  expression(line){
    if(Object.hasOwn(this.expressions,line.expression))return line.expression;
    const text=line.text;
    if(/太好了|謝謝|開心|真好|成功|好棒|找到你|終於|笑出來|哈哈|我回來了|安全了|水果還你/.test(text))return 'happy';
    if(/不要怕|別害怕|不用擔心|不必擔心|別擔心|沒關係|別著急/.test(text))return 'neutral';
    if(/害怕|擔心|迷路|危險|受傷|快逃|小心|救命|哭|難過|不見了|跌進|放開|不准傷害|好累/.test(text))return 'worried';
    if(/咦|哇|怎麼|什麼|原來|真的嗎|[？?]/.test(text))return 'surprised';
    return 'neutral';
  },
  hex(n){return '#'+n.toString(16).padStart(6,'0');},
  tint(n,amount){return this.hex([16,8,0].reduce((value,shift)=>value+Math.round(((n>>shift)&255)*(1-amount)+255*amount)*2**shift,0));},
  svg(profile,mood){
    const key=JSON.stringify([profile,mood]);if(this.cache.has(key))return this.cache.get(key);
    const {kind,color,accent}=profile,c=this.hex(color),a=this.hex(accent),id='speaker-'+this.serial++;
    const ellipse=(x,y,rx,ry,fill,more='')=>`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}" ${more}/>`;
    const path=(d,fill,more='')=>`<path d="${d}" fill="${fill}" ${more}/>`;
    const stroke=d=>path(d,'none','stroke="#493f36" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"');
    const fur=`url(#${id})`,cream='#f8e9c9',ink='#3e4037';
    let back='',head='',detail='',front='';
    const human=kind==='girl'||kind==='mother',bird=kind==='bird'||kind==='owl';
    if(human){
      const hair=this.hex(profile.hair);
      back+=ellipse(64,80,44,49,hair);
      if(kind==='girl')for(const x of [23,105])back+=ellipse(x,91,12,24,hair);
      head+=ellipse(64,79,34,37,fur);
      front+=path('M29 66 Q25 32 64 32 Q103 32 99 64 Q89 54 85 48 Q83 65 71 61 Q70 50 65 46 Q57 66 47 59 Q43 65 29 66',hair);
      front+=path('M94 38 Q77 24 80 44 Q87 50 94 44 Q110 56 113 38 Q105 30 94 38','#ca6256')+ellipse(95,41,5,6,'#e99b7b');
    }else if(kind==='book'){
      head+=path('M14 49 Q37 41 64 52 Q91 41 114 49 L114 115 Q89 109 64 119 Q39 109 14 115 Z',a);
      head+=path('M20 43 Q42 37 64 49 Q86 37 108 43 L108 107 Q85 104 64 114 Q43 104 20 107 Z',cream);
      detail+=path('M64 51V109','none','stroke="#d9c7a0" stroke-width="2"');
    }else{
      if(kind==='rabbit')for(const x of [44,84]){back+=ellipse(x,34,12,29,fur,`transform="rotate(${x<64?-12:12} ${x} 34)"`);back+=ellipse(x,32,6,21,'#dda99b',`transform="rotate(${x<64?-12:12} ${x} 32)"`);}
      if(['cat','wolf','squirrel','owl'].includes(kind)){
        back+=path('M25 61 L23 23 Q40 25 52 51 M76 51 Q88 25 105 23 L103 61',fur);
        detail+=path('M31 51 L29 33 L44 49 M84 49 L99 33 L97 51','#d7b3a0');
      }
      if(kind==='hedgehog'){
        const points=Array.from({length:30},(_,i)=>{const angle=i*Math.PI/15,r=i%2?42:52;return `${64+Math.sin(angle)*r},${78+Math.cos(angle)*r}`;}).join(' ');
        back+=`<polygon points="${points}" fill="#886748"/>`;
      }
      if(kind==='monkey')for(const x of [17,111]){back+=ellipse(x,77,16,20,fur)+ellipse(x,78,10,13,'#d9b98f');}
      if(kind==='beaver')for(const x of [32,96])back+=ellipse(x,48,12,13,fur);
      if(kind==='squirrel')back+=path('M94 138 Q134 105 112 88 Q91 78 95 105 Q118 98 106 115 L91 127',a);
      if(kind==='turtle')back+=ellipse(64,104,47,35,a);
      if(kind==='mosquito'){
        back+=ellipse(25,102,18,31,'#d4e6e6','transform="rotate(-35 25 102)"')+ellipse(103,102,18,31,'#d4e6e6','transform="rotate(35 103 102)"');
        back+=stroke('M53 53 Q49 31 39 23 M75 53 Q79 31 89 23')+ellipse(39,23,4,4,a)+ellipse(89,23,4,4,a);
      }
      head+=ellipse(64,79,kind==='mosquito'?32:40,37,fur);
      if(['cat','wolf','beaver','squirrel','rabbit'].includes(kind))detail+=ellipse(64,92,26,19,cream);
      if(kind==='hedgehog')detail+=ellipse(64,87,31,26,'#f1dcbc');
      if(kind==='monkey')detail+=path('M31 83 Q22 49 47 52 Q59 53 64 60 Q69 53 81 52 Q106 49 97 83 Q108 110 64 113 Q20 110 31 83','#e8c89e');
      if(kind==='bird'){
        detail+=ellipse(64,87,30,27,this.tint(color,.5));
        front+=path('M55 43 Q50 13 65 23 L71 43',a);
      }
      if(kind==='owl')detail+=ellipse(47,75,21,26,cream)+ellipse(81,75,21,26,cream);
      if(kind==='turtle')for(const x of [48,64,80])detail+=ellipse(x,x===64?51:55,5,3,a,'opacity=".5"');
      if(kind==='cat')detail+=stroke('M32 88 L14 84 M32 95 L14 98 M96 88 L114 84 M96 95 L114 98');
      if(['rabbit','cat','wolf','beaver','squirrel','hedgehog'].includes(kind))front+=ellipse(64,88,kind==='wolf'?8:5,kind==='wolf'?5:3,ink);
      if(kind==='beaver')front+=path('M58 99 H70 V111 Q64 114 58 111 Z','#fff8df','stroke="#c4ad86" stroke-width="1"')+path('M64 100V111','none','stroke="#c4ad86"');
      if(kind==='hedgehog')front+=path('M29 49 Q26 25 65 30 Q103 31 99 51 Z',a)+path('M24 50 Q66 43 103 51 L99 58 Q60 51 26 57 Z','#547360');
      if(kind==='beaver')front+=path('M25 48 Q25 25 64 26 Q103 25 103 48 Z','#d6b86d')+path('M19 48 Q64 42 109 48 L108 55 H20 Z','#c3a357');
      if(kind==='mosquito')front+=path('M86 90 L106 108','none','stroke="#a89469" stroke-width="4" stroke-linecap="round"');
    }
    const eyes=mood==='happy'?stroke('M43 76 Q49 66 55 76 M73 76 Q79 66 85 76'):
      [49,79].map(x=>ellipse(x,74,mood==='surprised'?6:4,mood==='surprised'?9:6,ink)+ellipse(x-1,72,1.5,2,'#fff7df')).join('');
    const brows=mood==='worried'?stroke('M42 63 Q50 65 55 60 M73 60 Q78 65 86 63'):mood==='surprised'?stroke('M43 57 Q49 51 55 57 M73 57 Q79 51 85 57'):'';
    let mouth=mood==='happy'?path('M52 96 Q64 103 76 96 Q74 113 64 113 Q54 113 52 96',ink)+ellipse(64,109,6,3,'#db8f82'):
      mood==='worried'?stroke('M55 103 Q64 96 73 103'):mood==='surprised'?ellipse(64,101,5,7,ink):stroke('M56 99 Q64 105 72 99');
    if(bird)mouth=path(`M54 87 Q64 81 74 87 L64 ${mood==='surprised'||mood==='happy'?103:96} Z`,'#d2a454')+path('M55 87 L64 92 L73 87','none','stroke="#a97c3f" stroke-width="1.5"');
    const cheeks=ellipse(36,88,6,3,'#dc9e87','opacity=".46"')+ellipse(92,88,6,3,'#dc9e87','opacity=".46"');
    const sweat=mood==='worried'?path('M103 65 Q92 80 103 82 Q114 80 103 65','#87b9c2'):'';
    const clothes=kind==='book'?'':path('M23 146 Q24 112 64 112 Q104 112 105 146 Z',human?a:c)+path('M38 115 Q64 129 90 115 L86 125 Q64 134 42 125 Z',a);
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 148" aria-hidden="true"><defs><linearGradient id="${id}" x2=".3" y2="1"><stop stop-color="${this.tint(color,.3)}"/><stop offset="1" stop-color="${c}"/></linearGradient></defs><circle cx="64" cy="81" r="59" fill="${a}" opacity=".16"/>${back}${clothes}${head}${detail}${cheeks}${eyes}${brows}${mouth}${front}${sweat}</svg>`;
    this.cache.set(key,svg);return svg;
  },
  render(element,line,game){
    const role=Meadow.Script.role(line.name),mood=this.expression(line),profile=this.profile(role,game);
    element.dataset.speaker=role;element.dataset.expression=mood;element.dataset.kind=profile.kind;
    element.innerHTML=this.svg(profile,mood)+`<span id="portrait-expression" class="portrait-description">${this.expressions[mood]}的表情</span>`;
  }
};
