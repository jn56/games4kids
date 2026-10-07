const assert=require('node:assert/strict'),N=require('../neon_courier/model.js'),targetX=require('./neon-pilot.cjs');
const tick=(r,seconds,input={})=>{for(let i=0;i<Math.round(seconds*90);i++)r.step(1/90,input);};
const run=(role='velocity')=>{const p=N.freshProfile();p.role=role;const r=new N.Run(p,92,{traffic:false});r.phase='running';r.items=[];r.forks=[];return r;};
const bad=N.profile({name:'<script>演員</script>',role:'constructor',xp:-5,contract:99,skills:{battery:99},best:NaN});assert.equal(bad.role,'velocity');assert.equal(bad.xp,0);assert.equal(bad.contract,2);assert.equal(bad.skills.battery,0);assert(bad.name.length<=14);
const veteran=N.profile({xp:220*4,skills:{battery:3,magnet:3,clock:3}});assert.deepEqual(veteran.skills,{battery:3,magnet:1,clock:0});assert.equal(N.points(veteran),0);
console.log('PASS profile validation, safe role IDs and skill-point accounting');
{
 assert.equal(Object.keys(N.roles).length,6);assert.deepEqual(N.contracts.map(c=>c.length),[4800,5400,6000]);
 for(const [pikmin,human] of [['pikmin_red','velocity'],['pikmin_yellow','aerial'],['pikmin_blue','resonance']]){
  const p=N.profile({...N.freshProfile(),role:pikmin});assert.equal(p.role,pikmin);assert.equal(N.roles[pikmin].species,'pikmin');
  for(const ability of ['speed','drain','regen','jumps','magnet'])assert.equal(N.roles[pikmin][ability],N.roles[human][ability]);
 }
 const r=run('pikmin_blue');r.x=-N.moveLimit+.1;r.speed=70;r.chain=6;r.energy=60;r.bump('courier',1);
 assert.equal(r.x,-N.moveLimit,'Peer contact cannot push a rider through a wall');assert.equal(r.speed,66.5);assert.equal(r.hits,0);assert.equal(r.chain,6);assert.equal(r.energy,60);
 const before=r.worldX();r.bump('courier',1);assert.equal(r.worldX(),before,'Sustained contact is throttled');assert.equal(r.contacts,1);
}
console.log('PASS six saved roles, Pikmin abilities, doubled routes and bounded harmless courier separation');
{
 const r=run();r.phase='countdown';tick(r,2.3,{boost:true});assert.equal(r.distance,0);assert.equal(r.remaining,r.contract.time);tick(r,.3);assert.equal(r.phase,'running');
 r.phase='paused';const before=JSON.stringify(r);tick(r,8,{boost:true});assert.equal(JSON.stringify(r),before);
}
console.log('PASS countdown and pause freeze simulation timers, events and inputs');
{
 const r=run();tick(r,.1,{steer:.4});assert(r.worldX()>.2&&r.worldX()<.48,'Short input eases into movement');const released=r.worldX();tick(r,.2);assert(r.worldX()-released<.14,'Release stops within a small fraction of rider width');const held=r.worldX();tick(r,.5);assert(Math.abs(r.worldX()-held)<1e-8,"Release stays at the same world position without road-following");tick(r,2,{steer:-1});assert.equal(r.x,-N.moveLimit);tick(r,3,{steer:1});assert.equal(r.x,N.moveLimit);tick(r,.1,{steer:NaN});assert(Number.isFinite(r.x));
 r.jump();tick(r,.12);const first=r.vy;r.jump();tick(r,.06);assert(r.vy<first,'Single jump cannot jump again in mid-air');tick(r,1);assert.equal(r.y,0);
 const a=run('aerial');a.jump();tick(a,.25);a.jump();tick(a,.04);assert.equal(a.jumps,2);assert(a.vy>9);a.jump();tick(a,.2);assert.equal(a.jumps,2);
}
console.log('PASS analog movement, arbitrary stop positions, deck limits, grounded jump, second jump specialization and landing reset');
{
 const r=run();tick(r,2);assert(Math.abs(r.speed-65.625)<.001,'Base speed increased another 25%');tick(r,2,{boost:true});assert(r.speed>84.5,'Boost adds 22 m/s, with at most 3% loss on wall contact');assert(r.energy<70);tick(r,6,{boost:true});assert(r.boostLocked||r.energy<25);const before=r.energy;tick(r,2);assert(r.energy>before);assert.equal(r.boosting,false);
 tick(r,1,{brake:true});assert(r.speed<35);const e=r.energy;r.items=[{type:'boost',distance:r.distance+1,x:r.x,done:false}];tick(r,.15);assert(r.energy>=e);
}
console.log('PASS boost drain, automatic cooldown, recharge, braking and boost pads');
{
 assert.equal(N.roles.velocity.speed,52.5*1.25);assert.equal(N.roles.aerial.speed,49.5*1.25);assert.equal(N.roles.resonance.speed,49.5*1.25);
 const r=run();assert(r.startBoost());tick(r,1);assert(r.autoBoost&&r.boosting&&r.energy<83,'One press runs without a held input');const energy=r.energy;assert.equal(r.startBoost(),false);assert.equal(r.energy,energy,'Repeated taps do not refill or restart');
 r.phase='paused';const paused=JSON.stringify(r);tick(r,3);assert.equal(JSON.stringify(r),paused);r.phase='running';tick(r,5);assert.equal(r.autoBoost,false);assert.equal(r.boosting,false);tick(r,3);assert(r.energy>25);assert.equal(r.boosting,false,'Recharge never restarts a one-shot boost');assert(r.startBoost());tick(r,.2);assert(r.boosting);
 const empty=run();empty.energy=0;assert.equal(empty.startBoost(),false);tick(empty,.3);assert(empty.startBoost());empty.energy=5;empty.hit();assert.equal(empty.autoBoost,false,'Impact that empties stamina also ends auto boost');
 r.finish();assert.equal(r.autoBoost,false);assert.equal(r.startBoost(),false);
}
console.log('PASS exact additional 25% speed increase, one-tap boost, pause/resume, depletion, no automatic restart and fresh reactivation');
{
 const r=run();r.speed=45;r.items=[{type:'barrier',distance:.1,x:0,done:false}];tick(r,.02,{boost:true});assert.equal(r.hits,1);assert(r.stumble>0);assert(r.remaining>99);assert.equal(r.delivered,0);
 r.items=[{type:'tower',distance:r.distance+.1,x:0,done:false}];tick(r,.02);assert.equal(r.hits,1,'Invulnerability prevents duplicate collisions');tick(r,1.4);assert.equal(r.stumble,0);
 const clear=run();clear.jump();tick(clear,.25);clear.items=[{type:'barrier',distance:clear.distance+.1,x:0,done:false}];tick(clear,.02);assert.equal(clear.hits,0);assert(clear.score>=90);
 const tower=run();tower.y=2.2;tower.items=[{type:'tower',distance:.1,x:0,done:false}];tick(tower,.2);assert.equal(tower.hits,1);
}
console.log('PASS swept high-speed collision, harmless slowdown, recovery and jump clearance');
{
 for(const [x,steer,hits] of [[2.45,-1,0],[2.25,1,1]]){const r=run();r.x=x;r.speed=60;r.items=[{type:'tower',distance:.01,x:0,done:false}];r.step(1/90,{steer,boost:true});assert.equal(r.hits,hits,'Collision uses lateral position at the crossing time, not the end of the frame');}
 const r=run();r.x=1.37;r.stops[0].x=1.37;r.stops[0].distance=.1;r.items=[r.stops[0]];tick(r,.2);assert.equal(r.delivered,1,'Delivery accepts an arbitrary horizontal target');
}
console.log('PASS precise diagonal crossing collisions and delivery at a fractional position');
{
 const r=run();r.items=[{type:'signal',distance:1,x:0,height:1.2,done:false}];tick(r,.3);assert.equal(r.signals,1);tick(r,.3);assert.equal(r.signals,1);
 r.event='flow';r.eventTimer=2;const before=r.score;r.items=[{type:'signal',distance:r.distance+1,x:r.x,height:1.2,done:false}];tick(r,.1);assert.equal(r.score-before,70);tick(r,6);assert.equal(r.chain,0);
 for(const kind of ['tailwind','magnet','flow']){r.elapsed=r.nextEvent;r.step(1/90);assert(r.event);assert(r.eventTimer>7);}
}
console.log('PASS pickups score once, double-score event, combo expiry and scheduled city events');
{
 const r=run();r.items=r.stops;r.stops[0].distance=1;r.stops[0].x=0;r.remaining=30;tick(r,.4);assert.equal(r.delivered,1);assert(r.remaining>33);r.stops[1].distance=r.distance+1;r.stops[1].x=-7;tick(r,.2);assert.equal(r.completed,2);assert.equal(r.delivered,1);assert.equal(r.stops[1].status,'missed');
 r.remaining=.01;tick(r,.05);assert.equal(r.result.complete,false);assert(r.result.xp>=45);const score=r.score;r.finish();r.step(1);assert.equal(r.score,score,'Result can only be settled once');
}
console.log('PASS delivery and missed gates, deadline result, XP retained and idempotent settlement');
{
 const r=new N.Run(N.freshProfile(),11,{traffic:false}),f=r.forks[0];r.phase='running';r.items=[];r.distance=f.start-.1;r.speed=r.role.speed;r.x=-2;r.step(1/90);assert.equal(f.choice,null,'Joined entrance must not lock a route');tick(r,.5,{steer:1});assert(r.x>0);assert.equal(f.choice,null,'Can still cross from left to right inside the visible junction');while(f.choice===null)r.step(1/90,{steer:1});assert.equal(f.choice,1);const entryX=r.x;tick(r,.15,{steer:-1});assert(r.x<entryX);assert.equal(f.choice,1,'Choice commits only when the divider actually separates the roads');
 r.x=0;r.items=[{type:'tower',x:0,distance:r.distance+.1,fork:0,branch:0,done:false},{type:'signal',x:0,distance:r.distance+1,height:1.2,fork:0,branch:0,done:false},{type:'signal',x:0,distance:r.distance+1,height:1.2,fork:0,branch:1,done:false}];tick(r,.1);assert.equal(r.hits,0);assert.equal(r.signals,1,'Only chosen-road objects interact');
 r.phase='paused';const before=JSON.stringify(r);tick(r,6,{boost:true});assert.equal(JSON.stringify(r),before);
 for(const side of [0,1]){assert(Math.abs(N.forkOffset(f,f.start,side))<1e-8);assert(Math.abs(N.forkOffset(f,f.end,side))<1e-8);assert(Math.abs(N.forkSlope(f,f.start,side))<1e-8);assert(Math.abs(N.forkSlope(f,f.end,side))<1e-8);assert(Math.abs(N.forkOffset(f,(f.start+f.end)/2,side))>=N.forkSpread);}
}
console.log('PASS fork selection/locking, unchosen-road collision isolation, paused challenges and continuous split/rejoin geometry');
{
 for(const side of [-1,1]){
  const r=new N.Run(N.freshProfile(),17,{traffic:false}),f=r.forks[0];r.phase='running';r.items=[];r.speed=r.role.speed;r.distance=f.start+5;r.x=-side*3;
  tick(r,.65,{steer:side});assert.equal(f.choice,null);assert.equal(Math.sign(r.x),side,'Can switch sides after entering the joined junction');tick(r,.2);
  while(r.distance<f.end+1){const before=r.lateralPosition();r.step(1/90,{steer:f.choice===null?side:0});assert(Math.abs(r.lateralPosition()-before)<.4,'No sideways teleport at selection or rejoining');}
  assert.equal(f.choice,side>0?1:0);assert(r.contacts>0,'Straight travel eventually scrapes the curved fork wall');
  r.distance=f.start+(f.end-f.start)*.88;r.x=0;r.vx=0;r.contacts=0;r.impactCooldown=0;tick(r,.35,{steer:side===1?-1:1});assert.equal(r.contacts,0,'No invisible central wall on the merged deck');
  r.distance=(f.start+f.end)/2;r.x=side>0?-N.moveLimit:N.moveLimit;r.vx=0;tick(r,.15,{steer:-side});assert.equal(r.contacts,1,'Inner fork wall gives one gentle contact');assert.equal(r.hits,0);assert.equal(r.energy,r.capacity);const contacts=r.contacts;tick(r,.2,{steer:-side});assert.equal(r.contacts,contacts,'Sustained contact is throttled');
  r.phase='paused';const frozen=JSON.stringify(r);tick(r,1);assert.equal(JSON.stringify(r),frozen,'Contact animation timers also pause');
 }
 const smooth=run();tick(smooth,.4,{steer:1});const x=smooth.worldX();tick(smooth,.1,{steer:-1});assert(smooth.worldX()<x,'Reversal responds promptly');tick(smooth,.3,{steer:-1});const released=smooth.worldX();tick(smooth,.2);assert(Math.abs(smooth.worldX()-released)<.3);assert.equal(smooth.vx,0);
 const r=run(),other=run();other.x=.6;r.chain=7;r.energy=70;r.couriers=[{run:other,step(){}}];r.step(1/90);assert.equal(r.contacts,1);assert.equal(other.contacts,1);assert(r.impact>0&&other.impact>0);assert.equal(r.chain,7);assert.equal(r.hits,0);assert(r.energy>=70);assert(r.notices.some(n=>n.type==='bump'&&n.kind==='courier'));
 const air=run(),above=run();above.y=3;air.couriers=[{run:above,step(){}}];air.step(1/90);assert.equal(air.contacts,0,'Jumping clear does not collide');
 const apart=new N.Run(N.freshProfile(),17,{traffic:false}),opposite=new N.Run(N.freshProfile(),17,{traffic:false});apart.phase=opposite.phase='running';apart.distance=opposite.distance=(apart.forks[0].start+apart.forks[0].end)/2;apart.forks[0].choice=0;opposite.forks[0].choice=1;apart.couriers=[{run:opposite,step(){}}];apart.step(1/90);assert.equal(apart.contacts,0,'Couriers on opposite fork branches cannot touch');
}
console.log('PASS late junction side changes, continuous selection/merge, smooth reversal/stopping, gentle wall/courier contacts, cooldown and height/branch isolation');
{
 for(const role of Object.keys(N.roles)){
  const r=run(role);r.speed=r.role.speed;const x=r.worldX();tick(r,1);assert(Math.abs(r.worldX()-x)<1e-8,'An untouched rider does not follow the main road curve');assert.equal(r.contacts,0);assert.equal(r.vx,0);
  for(const index of [0,1,2])for(const side of [0,1]){
   const rider=new N.Run({...N.freshProfile(),role},17,{traffic:false}),f=rider.forks[index];rider.phase='running';rider.items=[];rider.distance=f.start+(f.end-f.start)*.15;f.choice=side;const b=rider.lateralBounds();rider.x=side?b.min+1:b.max-1;rider.speed=rider.role.speed;
   let clearSteps=0,wallSteps=0,first=true;
   while(rider.distance<f.start+(f.end-f.start)*.4){
    const before=rider.worldX();rider.notices=[];rider.step(1/90);
    if(Math.abs(rider.worldX()-before)<1e-8)clearSteps++;
    else{const b=rider.lateralBounds();assert(Math.abs(rider.x-b.min)<1e-7||Math.abs(rider.x-b.max)<1e-7,'Uncommanded displacement is allowed only at a real wall');if(first){assert(rider.notices.some(n=>n.type==='bump'&&n.kind==='wall'));first=false;}wallSteps++;}
    assert.equal(rider.vx,0);assert.equal(rider.steering,0);
   }
   assert(clearSteps>2,'Rider goes straight in free space before contact');assert(wallSteps>0&&rider.contacts>0,'Untouched rider really scrapes the fork wall');assert.equal(rider.hits,0);
  }
 }
 const escape=new N.Run(N.freshProfile(),17,{traffic:false}),f=escape.forks[0];escape.phase='running';escape.items=[];f.choice=1;escape.distance=f.start+(f.end-f.start)*.88;escape.x=N.moveLimit;escape.speed=escape.role.speed+22;escape.vx=-1;escape.step(1/90,{steer:-1});assert(escape.contacts>0);assert(escape.vx< -1,'A wall does not erase steering away from it');
}
console.log('PASS all roles: untouched main/fork travel stays straight, sideways correction occurs only at real wall contact, and steering away from a wall remains responsive');
{
 for(const role of Object.keys(N.roles)){
  const r=run(role);tick(r,3.5);assert.equal(r.x,0,'Opening straight cannot look like automatic left steering');assert.equal(r.worldX(),0);assert.equal(r.contacts,0);
  // Strong, visible bends need manual steering. Only an actual wall can
  // displace an untouched rider, even over an entire main-road journey.
  let clearSteps=0,wallSteps=0;
  while(!r.result){const before=r.worldX();r.step(1/90);if(Math.abs(r.worldX()-before)<1e-7)clearSteps++;else{const b=r.lateralBounds();assert(Math.abs(r.x-b.min)<1e-7||Math.abs(r.x-b.max)<1e-7,'No invisible road-following in a stronger bend');wallSteps++;}assert.equal(r.steering,0);assert.equal(r.vx,0);r.notices.length=0;}
  assert(clearSteps>100&&wallSteps>100&&r.contacts>0,'Visible bends retain real wall contacts');
 }
 for(const offset of [-.5,-.04,0,.04,.5]){
  const r=run(),other=run();r.distance=300;other.distance=301;r.speed=r.role.speed;
  other.x=r.worldX()+offset-N.curve(other.distance);r.couriers=[{run:other,step(){}}];const a=r.worldX(),b=other.worldX();r.step(1/90);
  assert.equal(r.contacts,1);assert.equal(other.contacts,1);assert(r.speed<r.role.speed,'Centered contact still has slowdown feedback');
  const push=Math.abs(offset)<.08?0:-Math.sign(offset)*.24;
  assert(Math.abs(r.worldX()-a-push)<1e-7,'Rear/front contact cannot create a biased sideways push');assert(Math.abs(other.worldX()-b+push)<1e-7,'Side contact separates both riders equally');
  assert.equal(r.impactSide,push===0?0:-Math.sign(push));assert.equal(r.hits,0);
 }
 let left=0,right=0;for(let d=235;d<6000;d+=17){const numerical=(N.curve(d+.001)-N.curve(d-.001))/.002;assert(Math.abs(N.tangent(d)-numerical)<1e-7,'Rendered road tangent agrees with collisions');left=Math.min(left,N.curve(d));right=Math.max(right,N.curve(d));}
 assert(left<-N.roadHalfWidth&&right>N.roadHalfWidth,'Both bend directions are wider than half a road and require steering');
}
console.log('PASS centered straight starts, visible left/right bends without automatic steering, symmetric side contacts and aligned contact without drift');
{
 const r=run();r.items=[{type:'ramp',distance:1,x:0,done:false}];tick(r,.2);assert(r.vy>12&&r.y>0,'Ramp launches without a jump button');tick(r,1.5);assert.equal(r.y,0);
 const g=run();g.items=[{type:'speedGate',distance:1,x:0,done:false}];tick(g,.2);assert.equal(g.score,0,'Speed gate needs boosting');const h=run();h.items=[{type:'speedGate',distance:1,x:0,done:false}];tick(h,.2,{boost:true});assert.equal(h.score,160);
 const s=run();s.items=[{type:'skyStar',distance:1,x:0,height:5.8,done:false}];tick(s,.5);assert.equal(s.signals,0,'High stars cannot be collected on the ground');
 const reward=new N.Run(N.freshProfile(),12),f=reward.forks[0];f.choice=0;f.options[0]='charge';const item={goal:true,fork:0,branch:0},time=reward.remaining;for(let i=0;i<12;i++)reward.routePoint(item);assert.equal(f.progress,6);assert.equal(reward.challenges,1);assert.equal(reward.remaining,time+4);assert.equal(reward.energy,reward.capacity);
}
console.log('PASS automatic launch ramps, high-star altitude, boost-only gates and one-time challenge rewards');
{
 let air=false,boost=false,deliveries=0;
 for(let seed=1;seed<=3;seed++)for(let contract=0;contract<3;contract++){
  const p=N.freshProfile();p.contract=contract;const r=new N.Run(p,seed);assert.equal(r.couriers.length,5);assert.equal(new Set(r.couriers.map(c=>c.name)).size,5);assert.equal(new Set(r.couriers.map(c=>c.color)).size,5);
  const items=JSON.stringify(r.items),profile=JSON.stringify(r.profile);assert(r.couriers.every(c=>c.run.couriers.length===0&&c.run.items!==r.items&&c.run.forks!==r.forks));
  tick(r,1);assert(r.couriers.every((c,i)=>c.run.distance===14+i*13),'Countdown freezes fleet');r.phase='paused';const frozen=JSON.stringify(r.couriers);tick(r,2);assert.equal(JSON.stringify(r.couriers),frozen);
  for(let i=0;i<90*100&&r.couriers.some(c=>!c.run.result);i++)for(const c of r.couriers){c.step(1/90);air ||= c.run.y>1;boost ||= c.run.boosting;assert(Number.isFinite(c.run.x)&&c.run.x>=c.run.lateralBounds().min&&c.run.x<=c.run.lateralBounds().max);}
  for(const c of r.couriers){assert(c.run.result?.complete);assert.equal(c.run.delivered,3,`${seed}/${contract}/${c.name} delivers all parcels`);assert(c.run.forks.every(f=>f.choice!==null));assert(c.run.signals>0);deliveries+=c.run.delivered;}
  assert.equal(JSON.stringify(r.items),items,'AI pickups cannot consume player objects');assert.equal(JSON.stringify(r.profile),profile,'AI rewards cannot change player progression');assert.equal(r.delivered,0);
 }
 assert(air&&boost);console.log(`PASS 45 independent AI courier journeys: ${deliveries} deliveries, forks, jumping/boosting, independent pickups/progression and pause/countdown freeze`);
}
let total=0;const kinds=new Set();
for(let seed=1;seed<=4;seed++)for(let contract=0;contract<3;contract++)for(const role of Object.keys(N.roles))for(let choices=0;choices<8;choices++){
 const p=N.freshProfile();p.role=role;p.contract=contract;const r=new N.Run(p,seed,{traffic:false});
 const groups=new Map();for(const item of r.items)if(['tower','barrier','vent'].includes(item.type)){const key=[item.distance,item.fork,item.branch].join(':');if(!groups.has(key))groups.set(key,new Set());groups.get(key).add(item.x);assert(r.stops.every(s=>Math.abs(s.distance-item.distance)>=200));if(item.fork===undefined)assert(r.forks.every(f=>item.distance<f.start-125||item.distance>f.end+45));}
 assert([...groups.values()].every(g=>g.size<=2));assert(r.items.every(o=>Number.isFinite(o.x)&&Math.abs(o.x)<=N.moveLimit));assert(new Set(r.items.map(o=>o.x)).size>12,"Objects are not constrained to three positions");
 for(let i=0;i<90*160&&!r.result;i++){const steer=N.clamp((targetX(r,choices)-r.x)*8/N.strafeSpeed,-1,1);r.step(1/90,{boost:true,steer});r.notices.length=0;}
 const label=`seed ${seed} / ${contract} / ${role} / branches ${choices}`;
 assert(r.result?.complete,label+' can finish');assert.equal(r.delivered,3);assert.equal(r.hits,0,label+' has a collision-free route');assert.equal(r.challenges,3,label+' can complete all route challenges');assert(r.score>0);r.forks.forEach(f=>{assert.equal(f.choice,(choices>>f.index)&1);kinds.add(f.options[f.choice]);});total++;
}
assert.equal(kinds.size,4);console.log(`PASS ${total} complete seeded runs: all eight fork combinations, roles/contracts and four challenge types, with three deliveries and no unavoidable hits`);
// Physics is integrated by fixed steps in the browser; compare direct equal-time steps as a drift guard.
const a=run(),b=run();tick(a,5,{boost:true,steer:.037});for(let i=0;i<150;i++)for(let n=0;n<3;n++)b.step(1/90,{boost:true,steer:.037});assert(Math.abs(a.distance-b.distance)<1e-8);
assert(Math.abs(a.x-b.x)<1e-8);console.log('PASS equivalent 30/90 Hz simulation groups preserve distance and horizontal movement');
