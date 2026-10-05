'use strict';
// Pure simulation: seconds and metres, independent of frame rate and rendering.
const NC = {
  roles: {
    velocity: {name:'疾風', color:0xdcff78, speed:35, drain:18, regen:10, jumps:1, magnet:1.8, description:'基礎速度較快，衝刺耗能較低。'},
    aerial: {name:'躍動', color:0xb89aff, speed:33, drain:22, regen:12, jumps:2, magnet:1.8, description:'可在空中再跳一次，越過連續維修平台。'},
    resonance: {name:'共鳴', color:0x75efff, speed:33, drain:20, regen:13, jumps:1, magnet:3.5, description:'更遠收集光能，回充更快，容易保持連段。'}
  },
  contracts: [
    {name:'夜市補給',label:'暖身',length:2400,time:108,spacing:88,clients:['阿森 / 屋頂溫室','露可 / 夜市食堂','阿澄 / 星光書店'],parcels:['夜光種子','派對冰茶','首版詩集'],lanes:[1,0,2],messages:['種子要趕上午夜的第一場雨。拜託你了！','冰茶還冰著！大家剛好都到了。','詩集收到了。今晚的朗讀會，有你一份。']},
    {name:'屋頂派對',label:'標準',length:2700,time:100,spacing:74,clients:['零 / 天台音樂社','米拉 / 光影展台','伊洛 / 雲上觀測站'],parcels:['演出音軌','全息投影片','流星觀測鏡'],lanes:[2,0,1],messages:['主場還差這段音軌。用你的節奏，把它送來。','投影片已收到。這座城市今晚會亮得不一樣。','觀測鏡到站！流星雨還沒開始，剛剛好。']},
    {name:'星港首映',label:'進階',length:3000,time:98,spacing:62,clients:['伊恩 / 雲端影廳','湊 / 高空舞台','夏凜 / 星港首映'],parcels:['電影母帶','演出耳機','首映邀請函'],lanes:[0,2,1],messages:['倒數已經開始。這份母帶，交給你了。','耳機到了。謝啦，等會兒記得抬頭看舞台。','最後一份邀請函。你的名字，也在上面。']}
  ],
  districts: ['霓虹街區','雲端花園','星港天際'],
  routes: {
    sprint:{name:'極速環道',hint:'衝刺穿過 3 道光門',short:'速度 +6 · 衝刺門',need:3,color:'#dcff78'},
    sky:{name:'空中躍台',hint:'踩跳台，接住 3 顆高空星',short:'自動彈跳 · 高空星',need:3,color:'#b89aff'},
    slalom:{name:'節奏曲線',hint:'左右穿過 4 道精準環',short:'左右穿環 · 連段',need:4,color:'#ffbdad'},
    charge:{name:'磁力花園',hint:'收集 6 顆光環',short:'遠距吸取 · 回充',need:6,color:'#75efff'}
  },
  // The same continuous fork geometry positions roads, riders and interactables.
  forkOffset(fork,distance,side){const t=this.clamp((distance-fork.start)/(fork.end-fork.start),0,1);return (side===0?-1:1)*26*Math.sin(Math.PI*t)**2;},
  forkSlope(fork,distance,side){const t=this.clamp((distance-fork.start)/(fork.end-fork.start),0,1);return (side===0?-1:1)*26*Math.PI*Math.sin(2*Math.PI*t)/(fork.end-fork.start);},
  skills: {battery:{name:'超導電容',detail:'每級增加 12 點能量上限。'},magnet:{name:'光流引力',detail:'每級增加 0.65 公尺收集範圍。'},clock:{name:'城市默契',detail:'每級為委託增加 3 秒時間。'}},
  clamp: (x,a,b)=>Math.max(a,Math.min(b,x)),
  random(seed) {return ()=>{let t=seed+=0x6d2b79f5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};},
  freshProfile: ()=>({version:1,name:'夜行者',role:'velocity',contract:1,xp:0,runs:0,best:0,skills:{battery:0,magnet:0,clock:0},sound:true}),
  profile(raw) {
    const p=this.freshProfile();if(!raw||typeof raw!=='object')return p;
    const number=(n,max)=>Number.isFinite(n)?this.clamp(Math.floor(n),0,max):0;
    p.name=typeof raw.name==='string'&&raw.name.trim()?Array.from(raw.name.trim()).slice(0,12).join(''):p.name;
    p.role=Object.hasOwn(this.roles,raw.role)?raw.role:p.role;p.contract=number(raw.contract,2);
    p.xp=number(raw.xp,999999);p.runs=number(raw.runs,999999);p.best=number(raw.best,99999999);p.sound=raw.sound!==false;
    let points=Math.min(9,Math.floor(p.xp/220));for(const key of Object.keys(this.skills)){p.skills[key]=Math.min(points,number(raw.skills?.[key],3));points-=p.skills[key];}
    return p;
  },
  points(p){return Math.max(0,Math.min(9,Math.floor(p.xp/220))-Object.values(p.skills).reduce((a,b)=>a+b,0));},
  rank(p){const lv=Math.floor(p.xp/220)+1;return {lv,title:lv<3?'新晉快遞員':lv<6?'夜航專家':lv<10?'城市傳奇':'光速信使'};}
};

NC.Run=class {
  constructor(profile,seed=Date.now()) {
    this.profile=NC.profile(profile);this.role=NC.roles[this.profile.role];this.contract=NC.contracts[this.profile.contract];this.random=NC.random(seed);
    this.phase='countdown';this.countdown=2.4;this.distance=0;this.elapsed=0;this.remaining=this.contract.time+this.profile.skills.clock*3;
    this.x=0;this.lane=1;this.y=0;this.vy=0;this.jumps=0;this.jumpBuffer=0;this.speed=0;this.boosting=false;this.boostLocked=false;
    this.capacity=100+12*this.profile.skills.battery;this.energy=this.capacity;this.stumble=0;this.invincible=0;
    this.score=0;this.chain=0;this.maxChain=0;this.chainLife=0;this.delivered=0;this.hits=0;this.signals=0;this.completed=0;this.notices=[];
    this.event=null;this.eventTimer=0;this.nextEvent=17;this.eventIndex=Math.floor(this.random()*3);this.jumpCooldown=0;
    this.stops=[1,2,3].map((n)=>({type:'delivery',distance:this.contract.length*n/3-30,lane:this.contract.lanes[n-1],index:n-1,status:'pending',done:false}));
    const section=this.contract.length/3,order=Object.keys(NC.routes);
    for(let i=order.length-1;i>0;i--){const j=Math.floor(this.random()*(i+1));[order[i],order[j]]=[order[j],order[i]];}
    this.forks=[0,1,2].map((index)=>{const pair=index===0?[order[0],order[1]]:index===1?[order[2],order[3]]:[order[1],order[2]];if(this.random()<.5)pair.reverse();return {index,start:section*index+section*.30,end:section*index+section*.76,options:pair,choice:null,progress:0,won:false,exited:false};});
    this.challenges=0;this.items=[];this.buildRoute();this.result=null;
  }
  emit(type,data={}){this.notices.push({type,...data});}
  buildRoute(){
    const spacing=this.contract.spacing;
    for(let d=160,index=0;d<this.contract.length-90;d+=spacing,index++){
      if(this.stops.some(s=>Math.abs(s.distance-d)<100)||this.forks.some(f=>d>=f.start-125&&d<=f.end+45))continue;
      const safe=Math.floor(this.random()*3),blocked=[0,1,2].filter(l=>l!==safe),two=index>2&&this.random()>.48;
      for(const lane of blocked.slice(0,two?2:1)){
        const type=['barrier','vent','tower'][Math.floor(this.random()*3)];
        this.items.push({type,lane,distance:d,done:false,seed:this.random()});
        if(type!=='tower')this.items.push({type:'signal',lane,distance:d+3,height:3.4,done:false});
      }
      for(let i=0;i<3;i++)this.items.push({type:'signal',lane:safe,distance:d-14+i*14,height:1.2,done:false});
      if(index%3===1)this.items.push({type:'boost',lane:safe,distance:d+34,done:false});
    }
    for(let d=42;d<135;d+=22)this.items.push({type:'signal',lane:1,distance:d,height:1.2,done:false});
    for(const s of this.stops){for(const offset of [76,56,36])this.items.push({type:'signal',lane:s.lane,distance:s.distance-offset,height:1.2,done:false});}
    for(const fork of this.forks)this.buildFork(fork);
    this.items.push(...this.stops);this.items.sort((a,b)=>a.distance-b.distance);
  }
  buildFork(fork){
    const length=fork.end-fork.start;
    for(let branch=0;branch<2;branch++){
      const kind=fork.options[branch],put=(type,t,lane,extra={})=>this.items.push({type,distance:fork.start+length*t,lane,done:false,fork:fork.index,branch,...extra});
      if(kind==='sprint')for(let i=0;i<3;i++){const t=.27+i*.23,lane=[1,2,0][i];put('speedGate',t,lane,{goal:true});put('boost',t-.08,lane);put('signal',t-.04,lane,{height:1.2});}
      if(kind==='sky')for(let i=0;i<3;i++){const t=.24+i*.24,lane=i;put('ramp',t,lane);put('skyStar',t+24/length,lane,{height:5.8,goal:true});put('barrier',t+34/length,lane);}
      if(kind==='slalom')for(let i=0;i<4;i++)put('styleGate',.24+i*.17,[0,2,0,2][i],{goal:true});
      if(kind==='charge')for(let i=0;i<12;i++){put('signal',.22+i*.05,[0,0,1,1,2,2,1,1,0,0,1,1][i],{height:1.2,goal:true});if(i===5||i===9)put('boost',.245+i*.05,1);}
    }
  }
  forkAt(distance=this.distance){return this.forks.find(f=>distance>=f.start&&distance<f.end)||null;}
  routeKind(){const f=this.forkAt();return f&&f.choice!==null?f.options[f.choice]:null;}
  itemActive(item){return item.fork===undefined||this.forks[item.fork].choice===item.branch;}
  routePoint(item){
    if(!item.goal||item.fork===undefined)return;const f=this.forks[item.fork];if(f.won||f.choice!==item.branch)return;
    f.progress++;const kind=f.options[f.choice];
    if(f.progress>=NC.routes[kind].need){f.won=true;this.challenges++;this.addChain(500);this.remaining+=4;this.energy=kind==='charge'?this.capacity:Math.min(this.capacity,this.energy+20);this.emit('challenge',{index:f.index,kind});}
  }
  steer(direction){if(this.phase==='running'||this.phase==='countdown')this.lane=NC.clamp(this.lane+direction,0,2);}
  jump(){if(this.phase==='running')this.jumpBuffer=.16;}
  addChain(points){this.chain++;this.maxChain=Math.max(this.maxChain,this.chain);this.chainLife=5.5;this.score+=Math.round(points*(1+Math.min(4,Math.floor(this.chain/5)))*(this.event==='flow'?2:1));}
  hit(){
    if(this.invincible>0)return;
    this.hits++;this.stumble=.95;this.invincible=1.25;this.energy=Math.max(0,this.energy-14);this.chain=0;this.chainLife=0;
    this.emit('stumble');
  }
  step(dt,input={}){
    if(this.phase==='finished'||this.phase==='paused')return;
    if(this.phase==='countdown'){this.countdown-=dt;if(this.countdown<=0){this.phase='running';this.emit('start');}return;}
    this.elapsed+=dt;this.remaining=Math.max(0,this.remaining-dt);this.stumble=Math.max(0,this.stumble-dt);this.invincible=Math.max(0,this.invincible-dt);this.jumpCooldown=Math.max(0,this.jumpCooldown-dt);
    if(this.chainLife>0){this.chainLife-=dt;if(this.chainLife<=0)this.chain=0;}
    this.eventTimer=Math.max(0,this.eventTimer-dt);if(this.event&&this.eventTimer<=0){this.event=null;this.emit('eventEnd');}
    if(this.elapsed>=this.nextEvent){this.event=['tailwind','magnet','flow'][this.eventIndex++%3];this.eventTimer=8;this.nextEvent=this.elapsed+22+this.random()*5;this.emit('event',{event:this.event});}
    if(!input.boost||this.energy>=25)this.boostLocked=false;
    this.boosting=!!input.boost&&!input.brake&&!this.boostLocked&&this.energy>0&&this.stumble===0;
    this.energy=NC.clamp(this.energy+(this.boosting?-this.role.drain:this.role.regen)*dt,0,this.capacity);
    if(this.boosting&&this.energy<=0){this.boostLocked=true;this.boosting=false;this.emit('empty');}
    const kind=this.routeKind();
    const targetSpeed=(this.role.speed+(this.boosting?22:0)+(this.event==='tailwind'?6:0)+(kind==='sprint'?6:0))*(input.brake?.52:1)*(this.stumble>0?.52:1);
    this.speed+=(targetSpeed-this.speed)*(1-Math.exp(-7*dt));
    const oldDistance=this.distance;this.distance=Math.min(this.contract.length,this.distance+this.speed*dt);
    this.x+=((this.lane-1)*7-this.x)*(1-Math.exp(-16*dt));
    for(const f of this.forks){
      if(f.choice===null&&this.distance>=f.start){f.choice=this.lane===2?1:0;this.emit('fork',{index:f.index,kind:f.options[f.choice],side:f.choice});}
      if(!f.exited&&this.distance>=f.end){f.exited=true;this.emit('merge',{index:f.index,won:f.won});}
    }
    if(this.jumpBuffer>0&&this.jumps<this.role.jumps&&this.jumpCooldown===0){this.vy=11.5;this.jumps++;this.jumpBuffer=0;this.jumpCooldown=.15;this.emit('jump',{double:this.jumps>1});}
    this.jumpBuffer=Math.max(0,this.jumpBuffer-dt);this.vy-=28*dt;this.y+=this.vy*dt;
    if(this.y<=0){if(this.jumps&&this.vy<0)this.emit('land');this.y=0;this.vy=0;this.jumps=0;}
    const magnet=this.role.magnet+this.profile.skills.magnet*.65+(this.event==='magnet'?3:0)+(kind==='charge'?2:0);
    for(const item of this.items){
      if(item.done||!this.itemActive(item)||item.distance<oldDistance-4||item.distance>this.distance+5)continue;
      const dx=Math.abs((item.lane-1)*7-this.x),crossed=oldDistance<=item.distance&&this.distance>=item.distance;
      if(item.type==='signal'||item.type==='skyStar'){
        if(Math.abs(item.distance-this.distance)<4.5&&dx<magnet&&Math.abs(this.y+1.1-item.height)<1.8){item.done=true;this.signals++;this.energy=Math.min(this.capacity,this.energy+3);this.addChain(item.type==='skyStar'?160:35);this.routePoint(item);this.emit(item.type==='skyStar'?'star':'signal',{item});}
      }else if(item.type==='delivery'&&crossed){
        item.done=true;this.completed++;const success=dx<3.35;item.status=success?'delivered':'missed';
        if(success){this.delivered++;this.addChain(550);this.remaining+=4;this.energy=Math.min(this.capacity,this.energy+30);}else{this.chain=0;this.chainLife=0;}
        this.emit('delivery',{success,index:item.index});
      }else if(item.type==='boost'&&crossed){if(dx<2.8){item.done=true;this.energy=Math.min(this.capacity,this.energy+25);this.addChain(60);this.emit('charge');}}
      else if(item.type==='ramp'&&crossed){item.done=true;if(dx<2.8&&this.y<.7){this.vy=16.5;this.jumps=1;this.jumpCooldown=.16;this.emit('ramp');}}
      else if((item.type==='speedGate'||item.type==='styleGate')&&crossed){item.done=true;const success=dx<2.7&&(item.type==='styleGate'||this.boosting);if(success){this.addChain(160);this.energy=Math.min(this.capacity,this.energy+8);this.routePoint(item);this.emit('gate');}else this.emit('gateMiss',{boost:item.type==='speedGate'&&dx<2.7});}
      else if(['barrier','vent','tower'].includes(item.type)&&crossed&&dx<2.35){
        item.done=true;if(this.y>(item.type==='tower'?4.8:item.type==='vent'?.55:1.35)){this.addChain(90);this.emit('clear');}else this.hit();
      }
    }
    if(this.distance>=this.contract.length||this.remaining<=0)this.finish();
  }
  finish(){
    if(this.result)return this.result;
    const complete=this.distance>=this.contract.length;
    this.score+=Math.floor(this.distance/3)+Math.floor(this.remaining*12);
    const grade=!complete?'D':this.delivered===3&&this.hits<=2&&this.score>=7500?'S':this.delivered===3?'A':this.delivered===2?'B':'C';
    this.result={score:this.score,delivered:this.delivered,maxChain:this.maxChain,hits:this.hits,grade,complete,challenges:this.challenges,xp:Math.floor(this.distance/32)+this.delivered*45+this.challenges*25+(complete?65:0)};
    this.phase='finished';this.emit('finish',{result:this.result});return this.result;
  }
};
if(typeof window!=='undefined')window.NC=NC;
if(typeof module!=='undefined')module.exports=NC;
