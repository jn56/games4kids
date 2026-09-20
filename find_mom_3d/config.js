'use strict';
window.Meadow = {};
const CONFIG = Object.freeze({
  PLAYER_SPEED: 4.5,
  PLAYER_RADIUS: 0.34,
  INTERACT_DISTANCE: 2.15,
  SAVE_KEY: 'little-lights-chapter-one-v1',
  WIND_START: [0, 0, 0, 3, 0, 0, 2, 0, 0],
  WIND_KINDS: ['straight', 'straight', 'bend', 'bend', 'straight', 'bend', 'bend', 'straight', 'straight'],
  LAMP_ITEMS: [
    { id: 'sun', name: '太陽花', symbol: '☀' },
    { id: 'heart', name: '愛心花', symbol: '♥' },
    { id: 'star', name: '星星花', symbol: '★' },
    { id: 'ribbon', name: '紅髮帶', symbol: '⋈' }
  ],
  LAMP_CLUES: [
    { id: 'sun', text: '太陽花和星星花中間，剛好隔著一樣東西。' },
    { id: 'heart', text: '愛心花緊接在太陽花的右邊。' },
    { id: 'star', text: '星星花在紅髮帶的右邊，不一定相鄰。' }
  ],
  START: { x: 0, z: 11 },
  BELLS: [
    { id:'leaf', name:'葉子鈴', symbol:'❧', color:0xadc47d, note:523.25, x:-6, z:1 },
    { id:'drop', name:'水滴鈴', symbol:'●', color:0x83b8cd, note:659.25, x:-2, z:-.3 },
    { id:'star', name:'星星鈴', symbol:'★', color:0xb69dce, note:783.99, x:6, z:1 }
  ],
  SONGS: [
    { name:'問候的小調', sequence:['leaf','drop','star'], reverse:false },
    { name:'媽媽的腳步', sequence:['star','leaf','drop','leaf'], reverse:false },
    { name:'回家的回聲', sequence:['drop','leaf','star','leaf','star'], reverse:true }
  ],
  FLOWERS: [
    { id: 'sun', name: '太陽花', symbol: '☀', color: 0xf1c55c, x: -8, z: 0, clue: '風車旁', memory: '像媽媽早上的笑容，暖暖的。' },
    { id: 'heart', name: '愛心花', symbol: '♥', color: 0xec9297, x: 8, z: -5, clue: '池塘後方', memory: '像媽媽抱抱的時候，軟軟的。' },
    { id: 'star', name: '星星花', symbol: '★', color: 0xbaa0df, x: -5, z: -10, clue: '老樹下面', memory: '像媽媽說晚安時，陪著我的小星星。' }
  ]
});
