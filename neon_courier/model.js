'use strict';
// Pure simulation: seconds and metres, independent of frame rate and rendering.
const NC = {
  roadHalfWidth:11.5, moveLimit:9.8, strafeSpeed:12, forkSpread:18,
  roles: {
    velocity: {name:'疾風', color:0xdcff78, speed:65.625, drain:18, regen:10, jumps:1, magnet:1.8, description:'基礎速度較快，衝刺耗能較低。'},
    aerial: {name:'躍動', color:0xb89aff, speed:61.875, drain:22, regen:12, jumps:2, magnet:1.8, description:'可在空中再跳一次，越過連續維修平台。'},
    resonance: {name:'共鳴', color:0x75efff, speed:61.875, drain:20, regen:13, jumps:1, magnet:3.5, description:'更遠收集光能，回充較快，容易保持連段。'}
  },
  contracts: [
    {name:'夜市補給',label:'暖身',length:2400,time:108,spacing:88,clients:['阿森 / 屋頂溫室','露可 / 夜市食堂','阿澄 / 星光書店'],parcels:['夜光種子','派對冰茶','首版詩集'],deliveryX:[.8,-5.8,5.3],messages:['種子要趕上午夜的第一場雨。拜託你了！','冰茶還冰著！大家剛好都到了。','詩集收到了。今晚的朗讀會，有你一份。']},
    {name:'屋頂派對',label:'標準',length:2700,time:100,spacing:74,clients:['零 / 天台音樂社','米拉 / 光影展台','伊洛 / 雲上觀測站'],parcels:['演出音軌','全息投影片','流星觀測鏡'],deliveryX:[6.4,-4.6,1.2],messages:['主場還差這段音軌。用你的節奏，把它送來。','投影片已收到。這座城市今晚會亮得不一樣。','觀測鏡到站！流星雨還沒開始，剛剛好。']},
    {name:'星港首映',label:'進階',length:3000,time:98,spacing:62,clients:['伊恩 / 雲端影廳','湊 / 高空舞台','夏凜 / 星港首映'],parcels:['電影母帶','演出耳機','首映邀請函'],deliveryX:[-6.1,4.9,-1.4],messages:['倒數已經開始。這份母帶，交給你了。','耳機到了。謝啦，等會兒記得抬頭看舞台。','最後一份邀請函。你的名字，也在上面。']}
  ],
  districts: ['霓虹街區','雲端花園','星港天際'],
  routes: {
    sprint:{name:'極速環道',hint:'衝刺穿過 3 道光門',short:'速度 +6 · 衝刺門',need:3,color:'#dcff78'},
    sky:{name:'空中躍台',hint:'踩跳台，接住 3 顆高空星',short:'自動彈跳 · 高空星',need:3,color:'#b89aff'},
    slalom:{name:'節奏曲線',hint:'左右穿過 4 道精準環',short:'左右穿環 · 連段',need:4,color:'#ffbdad'},
    charge:{name:'磁力花園',hint:'收集 6 顆光環',short:'遠距吸取 · 回充',need:6,color:'#75efff'}
  },
  // The same continuous fork geometry positions roads, riders and interactables.
  curve(distance){return Math.sin(distance*.0032)*13+Math.sin(distance*.0011)*16;},
  tangent(distance){return Math.cos(distance*.0032)*.0416+Math.cos(distance*.0011)*.0176;},
  forkOffset(fork,distance,side){const t=this.clamp((distance-fork.start)/(fork.end-fork.start),0,1),u=t<.22?t/.22:t>.8?(1-t)/.2:1;return (side===0?-1:1)*this.forkSpread*u*u*(3-2*u);},
  forkSlope(fork,distance,side){const length=fork.end-fork.start,t=this.clamp((distance-fork.start)/length,0,1);if(t>=.22&&t<=.8)return 0;const u=t<.22?t/.22:(1-t)/.2,du=t<.22?1/(.22*length):-1/(.2*length);return (side===0?-1:1)*this.forkSpread*6*u*(1-u)*du;},
  separated(fork,distance){return Math.abs(this.forkOffset(fork,distance,0))>=this.roadHalfWidth;},
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
  constructor(profile,seed=Date.now(),{traffic=true}={}) {
    this.profile=NC.profile(profile);this.role=NC.roles[this.profile.role];this.contract=NC.contracts[this.profile.contract];this.random=NC.random(seed);
    this.phase='countdown';this.countdown=2.4;this.distance=0;this.elapsed=0;this.remaining=this.contract.time+this.profile.skills.clock*3;
    this.x=0;this.vx=0;this.steering=0;this.y=0;this.vy=0;this.jumps=0;this.jumpBuffer=0;this.speed=0;this.boosting=false;this.boostLocked=false;
    this.impact=0;this.impactSide=0;this.impactCooldown=0;this.contacts=0;
    this.capacity=100+12*this.profile.skills.battery;this.energy=this.capacity;this.stumble=0;this.invincible=0;this.autoBoost=false;
    this.score=0;this.chain=0;this.maxChain=0;this.chainLife=0;this.delivered=0;this.hits=0;this.signals=0;this.completed=0;this.notices=[];
    this.event=null;this.eventTimer=0;this.nextEvent=17;this.eventIndex=Math.floor(this.random()*3);this.jumpCooldown=0;
    this.stops=[1,2,3].map((n)=>({type:'delivery',distance:this.contract.length*n/3-30,x:this.contract.deliveryX[n-1],index:n-1,status:'pending',done:false}));
    const section=this.contract.length/3,order=Object.keys(NC.routes);
    for(let i=order.length-1;i>0;i--){const j=Math.floor(this.random()*(i+1));[order[i],order[j]]=[order[j],order[i]];}
    this.forks=[0,1,2].map((index)=>{const pair=index===0?[order[0],order[1]]:index===1?[order[2],order[3]]:[order[1],order[2]];if(this.random()<.5)pair.reverse();return {index,start:section*index+section*.14,end:section*index+section*.76,options:pair,choice:null,progress:0,won:false,exited:false};});
    this.challenges=0;this.items=[];this.buildRoute();this.result=null;this.couriers=traffic?NC.createCouriers(this,seed):[];
  }
  emit(type,data={}){this.notices.push({type,...data});}
  buildRoute(){
    const spacing=this.contract.spacing;
    for(let d=160,index=0;d<this.contract.length-90;d+=spacing,index++){
      if(this.stops.some(s=>Math.abs(s.distance-d)<100)||this.forks.some(f=>d>=f.start-125&&d<=f.end+45))continue;
      // Place objects across the full deck, leaving a clear corridor around safeX.
      const safeX=this.random()*12-6,blocked=[],count=index>2&&this.random()>.48?2:1;
      for(let attempt=0;attempt<40&&blocked.length<count;attempt++){const x=this.random()*16.6-8.3;if(Math.abs(x-safeX)>4.9&&blocked.every(b=>Math.abs(b-x)>5))blocked.push(x);}
      for(const x of blocked){
        const type=['barrier','vent','tower'][Math.floor(this.random()*3)];
        this.items.push({type,x,distance:d,done:false,seed:this.random()});
        if(type!=='tower')this.items.push({type:'signal',x,distance:d+3,height:3.4,done:false});
      }
      for(let i=0;i<3;i++)this.items.push({type:'signal',x:safeX,distance:d-14+i*14,height:1.2,done:false});
      if(index%3===1)this.items.push({type:'boost',x:safeX,distance:d+34,done:false});
    }
    for(let d=42;d<135;d+=22)this.items.push({type:'signal',x:Math.sin(d*.06)*3,distance:d,height:1.2,done:false});
    for(const s of this.stops){for(const offset of [76,56,36])this.items.push({type:'signal',x:s.x,distance:s.distance-offset,height:1.2,done:false});}
    for(const fork of this.forks)this.buildFork(fork);
    this.items.push(...this.stops);this.items.sort((a,b)=>a.distance-b.distance);
  }
  buildFork(fork){
    const length=fork.end-fork.start;
    for(let branch=0;branch<2;branch++){
      const kind=fork.options[branch],put=(type,t,x,extra={})=>this.items.push({type,distance:fork.start+length*t,x,done:false,fork:fork.index,branch,...extra});
      const entry=branch===0?1:-1;
      if(kind==='sprint')for(let i=0;i<3;i++){const t=.32+i*.21,x=entry*[4,.5,-4.2][i]+(this.random()-.5);put('speedGate',t,x,{goal:true});put('boost',t-.03,x);put('signal',t-.025,x,{height:1.2});}
      // Leave enough flight distance even at boosted speed plus a tailwind.
      if(kind==='sky')for(let i=0;i<3;i++){const t=.255+i*108/length,x=entry*[5.6,.4,-4.5][i]+(this.random()-.5);put('ramp',t,x);put('skyStar',t+40/length,x,{height:5.8,goal:true});put('barrier',t+54/length,x);}
      if(kind==='slalom')for(let i=0;i<4;i++)put('styleGate',.30+i*.15,entry*[3.8,-3.8,3.8,-3.8][i]+(this.random()-.5)*.4,{goal:true});
      if(kind==='charge')for(let i=0;i<12;i++){const x=entry*Math.cos(i*.45)*4.6;put('signal',.28+i*.042,x,{height:1.2,goal:true});if(i===5||i===9)put('boost',.30+i*.042,x);}
    }
  }
  forkAt(distance=this.distance){return this.forks.find(f=>distance>=f.start&&distance<f.end)||null;}
  pathOffset(distance=this.distance){const f=this.forkAt(distance);return f&&f.choice!==null?NC.forkOffset(f,distance,f.choice):0;}
  lateralPosition(){return this.pathOffset()+this.x;}
  worldX(){return NC.curve(this.distance)+this.lateralPosition();}
  itemWorldX(item){return NC.curve(item.distance)+item.x+(item.fork===undefined?0:NC.forkOffset(this.forks[item.fork],item.distance,item.branch));}
  aimX(item){return this.itemWorldX(item)-NC.curve(this.distance)-this.pathOffset();}
  lateralLimit(){const f=this.forkAt();return NC.moveLimit+(f&&!NC.separated(f,this.distance)?Math.abs(NC.forkOffset(f,this.distance,0)):0);}
  lateralBounds(){
    const f=this.forkAt();
    if(f&&NC.separated(f,this.distance)){
      // Taper the rider clearance at the divider tip, rather than pushing a
      // centered rider sideways by the full clearance in a single frame.
      const t=NC.clamp((Math.abs(NC.forkOffset(f,this.distance,0))-NC.roadHalfWidth)/Math.min(8,NC.forkSpread-NC.roadHalfWidth),0,1),inner=NC.roadHalfWidth-(NC.roadHalfWidth-NC.moveLimit)*t*t*(3-2*t);
      return f.choice===0?{min:-NC.moveLimit,max:inner}:{min:-inner,max:NC.moveLimit};
    }
    const limit=this.lateralLimit(),offset=this.pathOffset();return {min:-limit-offset,max:limit-offset};
  }
  routeKind(){const f=this.forkAt();return f&&f.choice!==null?f.options[f.choice]:null;}
  itemActive(item){return item.fork===undefined||this.forks[item.fork].choice===item.branch;}
  routePoint(item){
    if(!item.goal||item.fork===undefined)return;const f=this.forks[item.fork];if(f.won||f.choice!==item.branch)return;
    f.progress++;const kind=f.options[f.choice];
    if(f.progress>=NC.routes[kind].need){f.won=true;this.challenges++;this.addChain(500);this.remaining+=4;this.energy=kind==='charge'?this.capacity:Math.min(this.capacity,this.energy+20);this.emit('challenge',{index:f.index,kind});}
  }
  jump(){if(this.phase==='running')this.jumpBuffer=.16;}
  startBoost(){if(!['running','countdown'].includes(this.phase)||this.energy<=0||this.autoBoost)return false;this.autoBoost=true;this.boostLocked=false;return true;}
  racePosition(){return 1+this.couriers.filter(c=>c.run.distance>this.distance).length;}
  bump(kind,side){if(this.impactCooldown>0)return;this.contacts++;this.impact=.28;this.impactSide=side||1;this.impactCooldown=.65;this.speed*=.97;this.emit('bump',{kind,side:this.impactSide});}
  addChain(points){this.chain++;this.maxChain=Math.max(this.maxChain,this.chain);this.chainLife=5.5;this.score+=Math.round(points*(1+Math.min(4,Math.floor(this.chain/5)))*(this.event==='flow'?2:1));}
  hit(){
    if(this.invincible>0)return;
    this.hits++;this.stumble=.95;this.invincible=1.25;this.energy=Math.max(0,this.energy-14);this.chain=0;this.chainLife=0;
    if(this.energy===0&&this.autoBoost){this.autoBoost=false;this.emit('empty');}
    this.emit('stumble');
  }
  step(dt,input={}){
    if(this.phase==='finished'||this.phase==='paused')return;
    if(this.phase==='countdown'){this.countdown-=dt;if(this.countdown<=0){this.phase='running';this.emit('start');}return;}
    this.elapsed+=dt;this.remaining=Math.max(0,this.remaining-dt);this.stumble=Math.max(0,this.stumble-dt);this.invincible=Math.max(0,this.invincible-dt);this.jumpCooldown=Math.max(0,this.jumpCooldown-dt);
    this.impact=Math.max(0,this.impact-dt);this.impactCooldown=Math.max(0,this.impactCooldown-dt);
    if(this.chainLife>0){this.chainLife-=dt;if(this.chainLife<=0)this.chain=0;}
    this.eventTimer=Math.max(0,this.eventTimer-dt);if(this.event&&this.eventTimer<=0){this.event=null;this.emit('eventEnd');}
    if(this.elapsed>=this.nextEvent){this.event=['tailwind','magnet','flow'][this.eventIndex++%3];this.eventTimer=8;this.nextEvent=this.elapsed+22+this.random()*5;this.emit('event',{event:this.event});}
    const wantsBoost=input.boost||this.autoBoost;
    if(!wantsBoost||this.energy>=25)this.boostLocked=false;
    this.boosting=!!wantsBoost&&!input.brake&&!this.boostLocked&&this.energy>0&&this.stumble===0;
    this.energy=NC.clamp(this.energy+(this.boosting?-this.role.drain:this.role.regen)*dt,0,this.capacity);
    if(this.boosting&&this.energy<=0){this.boostLocked=true;this.boosting=false;this.autoBoost=false;this.emit('empty');}
    const kind=this.routeKind();
    const targetSpeed=(this.role.speed+(this.boosting?22:0)+(this.event==='tailwind'?6:0)+(kind==='sprint'?6:0))*(input.brake?.52:1)*(this.stumble>0?.52:1);
    this.speed+=(targetSpeed-this.speed)*(1-Math.exp(-7*dt));
    const oldDistance=this.distance,oldWorldX=this.worldX();
    this.distance=Math.min(this.contract.length,this.distance+this.speed*dt);
    this.steering=Number.isFinite(input.steer)?NC.clamp(input.steer,-1,1):0;
    const targetVX=this.steering*NC.strafeSpeed;
    // Ease into a turn; release or reverse brakes quickly, avoiding long sideways drift.
    const response=!this.steering||Math.sign(this.vx)!==Math.sign(targetVX)?36:13;
    this.vx+=(targetVX-this.vx)*(1-Math.exp(-response*dt));if(Math.abs(this.vx)<.025)this.vx=0;
    const worldX=oldWorldX+this.vx*dt,center=NC.curve(this.distance);
    for(const f of this.forks){
      if(f.choice===null&&NC.separated(f,this.distance)&&this.distance>=f.start&&this.distance<f.end){f.choice=worldX>center?1:0;this.emit('fork',{index:f.index,kind:f.options[f.choice],side:f.choice});}
      if(!f.exited&&this.distance>=f.end){f.exited=true;this.emit('merge',{index:f.index,won:f.won});}
    }
    // The player's world position follows input only. Curved roads change the
    // coordinate frame and collision boundary, never steer the rider for them.
    this.x=worldX-center-this.pathOffset();
    const bounds=this.lateralBounds(),bounded=NC.clamp(this.x,bounds.min,bounds.max);
    if(bounded!==this.x){const side=Math.sign(this.x-bounded);this.bump('wall',side);this.x=bounded;if(this.vx*side>0)this.vx=0;}
    if(this.jumpBuffer>0&&this.jumps<this.role.jumps&&this.jumpCooldown===0){this.vy=11.5;this.jumps++;this.jumpBuffer=0;this.jumpCooldown=.15;this.emit('jump',{double:this.jumps>1});}
    this.jumpBuffer=Math.max(0,this.jumpBuffer-dt);this.vy-=28*dt;this.y+=this.vy*dt;
    if(this.y<=0){if(this.jumps&&this.vy<0)this.emit('land');this.y=0;this.vy=0;this.jumps=0;}
    const magnet=this.role.magnet+this.profile.skills.magnet*.65+(this.event==='magnet'?3:0)+(kind==='charge'?2:0);
    for(const item of this.items){
      if(item.done||!this.itemActive(item)||item.distance<oldDistance-4||item.distance>this.distance+5)continue;
      const crossed=oldDistance<=item.distance&&this.distance>=item.distance;
      const atCrossing=crossed&&this.distance>oldDistance?oldWorldX+(this.worldX()-oldWorldX)*(item.distance-oldDistance)/(this.distance-oldDistance):this.worldX();
      const dx=Math.abs(this.itemWorldX(item)-atCrossing);
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
    for(const courier of this.couriers){
      const other=courier.run,oldGap=other.distance-oldDistance;courier.step(dt);
      const gap=other.distance-this.distance;
      if((Math.abs(gap)<2.7||oldGap*gap<0)&&Math.abs(other.y-this.y)<1.8&&Math.abs(other.worldX()-this.worldX())<1.45){const side=Math.sign(other.worldX()-this.worldX())||1;this.bump('courier',side);other.bump('courier',-side);}
    }
    if(this.distance>=this.contract.length||this.remaining<=0)this.finish();
  }
  finish(){
    if(this.result)return this.result;
    const complete=this.distance>=this.contract.length;
    this.score+=Math.floor(this.distance/3)+Math.floor(this.remaining*12);
    const grade=!complete?'D':this.delivered===3&&this.hits<=2&&this.score>=7500?'S':this.delivered===3?'A':this.delivered===2?'B':'C';
    this.result={score:this.score,delivered:this.delivered,maxChain:this.maxChain,hits:this.hits,grade,complete,challenges:this.challenges,xp:Math.floor(this.distance/32)+this.delivered*45+this.challenges*25+(complete?65:0)};
    this.autoBoost=false;this.boosting=false;this.phase='finished';this.emit('finish',{result:this.result});return this.result;
  }
};
NC.courierStyles=[{name:'小嵐',color:0x71eaff,role:'velocity'},{name:'阿澈',color:0xb89aff,role:'aerial'},{name:'米洛',color:0xffb68e,role:'resonance'},{name:'沐沐',color:0xff87bc,role:'aerial'},{name:'星野',color:0x80baff,role:'velocity'}];
NC.createCouriers=function(parent,seed){return NC.courierStyles.map((style,index)=>new NC.Courier(parent,seed,style,index));};
NC.Courier=class {
  constructor(parent,seed,style,index){
    Object.assign(this,style);this.index=index;this.choices=(seed+index*3)%8;
    const profile={...NC.freshProfile(),contract:parent.profile.contract,role:style.role};
    this.run=new NC.Run(profile,seed,{traffic:false});this.run.phase='running';this.run.distance=14+index*13;this.run.x=[-6,3,-2,7,0][index];
    this.run.role={...this.run.role,speed:this.run.role.speed*(.96+index*.012)};
  }
  target(){
    const r=this.run,pending=r.forks.find(f=>f.choice===null&&r.distance<f.end&&f.start-r.distance<140);
    if(pending){const branch=(this.choices>>pending.index)&1,goal=r.items.find(o=>o.fork===pending.index&&o.branch===branch&&(o.goal||o.type==='ramp'));return goal?r.aimX(goal):(branch?4:-4);}
    const fork=r.forkAt();if(fork){const goal=r.items.find(o=>o.fork===fork.index&&r.itemActive(o)&&!o.done&&o.distance>r.distance&&['ramp','skyStar','speedGate','styleGate','signal'].includes(o.type));if(goal)return r.aimX(goal);return r.aimX({distance:fork.end,x:0});}
    const stop=r.stops.find(s=>!s.done);if(stop&&stop.distance-r.distance<110)return r.aimX(stop);
    const hazard=r.items.find(o=>r.itemActive(o)&&['tower','barrier','vent'].includes(o.type)&&o.distance>r.distance&&o.distance-r.distance<200);
    if(hazard){
      const group=r.items.filter(o=>r.itemActive(o)&&o.distance===hazard.distance&&['tower','barrier','vent'].includes(o.type));
      const clear=r.items.find(o=>o.type==='signal'&&o.height===1.2&&o.distance===hazard.distance-14);if(clear)return r.aimX(clear);
      const candidates=Array.from({length:37},(_,i)=>-9+i*.5).filter(x=>group.every(o=>Math.abs(x-o.x)>3.4));
      if(candidates.length)return candidates.map(x=>r.aimX({...hazard,x})).sort((a,b)=>Math.abs(a-r.x)-Math.abs(b-r.x))[0];
    }
    return Math.sin(r.distance*.012+this.index)*5.5;
  }
  step(dt){
    const r=this.run;if(r.result)return;
    const steer=NC.clamp((this.target()-r.x)*8/NC.strafeSpeed,-1,1),sprint=r.routeKind()==='sprint';
    // Each courier has its own stamina and timing, and consumes only its own pickups.
    const boost=sprint||(r.elapsed+this.index*2)%11<5;
    r.step(dt,{steer,boost});r.notices.length=0;
  }
};
if(typeof window!=='undefined')window.NC=NC;
if(typeof module!=='undefined')module.exports=NC;
