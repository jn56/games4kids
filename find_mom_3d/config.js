'use strict';
window.Meadow = {};
const CONFIG = Object.freeze({
  PLAYER_SPEED: 5.7,
  PLAYER_RADIUS: 0.34,
  INTERACT_DISTANCE: 2.15,
  SAVE_KEY: 'little-lights-chapter-one-v1',
  WIND_SIZE: 4,
  WIND_START: [2,2,0,0,2,2,0,1,1,2,0,0,2,1,0,1],
  WIND_KINDS: ["straight","straight","straight","bend","bend","straight","straight","bend","bend","straight","straight","bend","straight","straight","straight","bend"],
  WIND_SOLUTION: [1,1,1,2,1,1,1,3,0,1,1,2,1,1,1,3],
  WIND_ROUTE: [0,1,2,3,7,6,5,4,8,9,10,11,15,14,13,12],
  WIND_LINKS: [[1,10],[5,14],[6,9]],
  LAMP_ITEMS: [
    { id: 'sun', name: '太陽花', symbol: '☀' },
    { id: 'heart', name: '愛心花', symbol: '♥' },
    { id: 'star', name: '星星花', symbol: '★' },
    { id: 'ribbon', name: '紅髮帶', symbol: '⋈' },
    { id: 'score', name: '歌譜', symbol: '♪' },
    { id: 'ticket', name: '船票', symbol: '≋' }
  ],
  LAMP_CLUES: [
    { id: 'sun', text: '太陽花與星星花的位置編號相差 4；愛心花在太陽花右方第二格。' },
    { id: 'heart', text: '船票緊接在愛心花左邊；歌譜在船票右方第二格。' },
    { id: 'star', text: '紅髮帶在太陽花左邊；歌譜緊接在星星花左邊。' }
  ],
  START: { x: 0, z: 11 },
  BELLS: [
    { id:'leaf', name:'葉子鈴', symbol:'❧', color:0xadc47d, note:523.25, x:-6, z:1 },
    { id:'drop', name:'水滴鈴', symbol:'●', color:0x83b8cd, note:659.25, x:-2, z:-.3 },
    { id:'star', name:'星星鈴', symbol:'★', color:0xb69dce, note:783.99, x:6, z:1 }
  ],
  SONGS: [
    { name:'問候的小調', sequence:['leaf','drop','star','drop','leaf','star'], reverse:false },
    { name:'媽媽的腳步', sequence:['star','leaf','drop','leaf','star','drop','leaf'], reverse:false, shift:true },
    { name:'回家的回聲', sequence:['drop','leaf','star','leaf','star','drop','star','leaf'], reverse:true }
  ],
  FLOWERS: [
    { id: 'sun', name: '太陽花', symbol: '☀', color: 0xf1c55c, x: -8, z: 0, clue: '風車旁', memory: '像媽媽早上的笑容，暖暖的。' },
    { id: 'heart', name: '愛心花', symbol: '♥', color: 0xec9297, x: 8, z: -5, clue: '池塘後方', memory: '像媽媽抱抱的時候，軟軟的。' },
    { id: 'star', name: '星星花', symbol: '★', color: 0xbaa0df, x: -5, z: -10, clue: '老樹下面', memory: '像媽媽說晚安時，陪著我的小星星。' }
  ]
});

// Items are earned by durable chapter-one milestones. Deriving ownership keeps
// older saves compatible and gives direct chapter starts their travel supplies.
Meadow.Keepsakes = {
  catalog:[
    {id:'score',symbol:'♪',name:'媽媽的歌譜',chapter:2,clue:'森林的第三段是回聲，要從最後一個音倒著敲。'},
    {id:'ticket',symbol:'≋',name:'月光船票',chapter:3,clue:'把船票交給木木。渡河時，要從兩盞浮燈中央穿過。'},
    {id:'lens',symbol:'✧',name:'星光鏡片',chapter:4,clue:'交給觀星員星星，裝上望遠鏡，讓光圈跟著星星。'}
  ],
  items(state){return this.catalog.filter(item=>(state.entryChapter>1)||(item.id==='lens'?state.lit:state.windSolved));},
  has(state,id){return this.items(state).some(item=>item.id===id);},
  forChapter(chapter){return this.catalog.find(item=>item.chapter===chapter);}
};
