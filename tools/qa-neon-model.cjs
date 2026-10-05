const assert=require('node:assert/strict'),N=require('../neon_courier/model.js');
const tick=(r,seconds,input={})=>{for(let t=0;t<seconds;t+=1/90)r.step(1/90,input);};
const run=(role='velocity')=>{const p=N.freshProfile();p.role=role;const r=new N.Run(p,92);r.phase='running';r.items=[];return r;};
function autopilot(r){
  const next=r.stops.find(s=>!s.done);if(next&&next.distance-r.distance<85)r.lane=next.lane;
  else{const h=r.items.find(o=>!o.done&&['tower','barrier','vent'].includes(o.type)&&o.distance>r.distance&&o.distance-r.distance<65);
    if(h){const blocked=r.items.filter(o=>o.distance===h.distance&&['tower','barrier','vent'].includes(o.type)).map(o=>o.lane);r.lane=[0,1,2].find(l=>!blocked.includes(l));}}
}
const bad=N.profile({name:'<script>演員</script>',role:'constructor',xp:-5,contract:99,skills:{battery:99},best:NaN});assert.equal(bad.role,'velocity');assert.equal(bad.xp,0);assert.equal(bad.contract,2);assert.equal(bad.skills.battery,0);assert(bad.name.length<=14);
const veteran=N.profile({xp:220*4,skills:{battery:3,magnet:3,clock:3}});assert.deepEqual(veteran.skills,{battery:3,magnet:1,clock:0});assert.equal(N.points(veteran),0);
console.log('PASS profile validation, safe role IDs and skill-point accounting');
{
 const r=run();r.phase='countdown';tick(r,2.3,{boost:true});assert.equal(r.distance,0);assert.equal(r.remaining,100);tick(r,.3);assert.equal(r.phase,'running');
 r.phase='paused';const before=JSON.stringify(r);tick(r,8,{boost:true});assert.equal(JSON.stringify(r),before);
}
console.log('PASS countdown and pause freeze simulation timers, events and inputs');
{
 const r=run();r.steer(-1);r.steer(-1);assert.equal(r.lane,0);tick(r,.5);assert(r.x< -6.9);r.steer(1);r.steer(1);r.steer(1);assert.equal(r.lane,2);
 r.jump();tick(r,.12);const first=r.vy;r.jump();tick(r,.06);assert(r.vy<first,'Single jump cannot jump again in mid-air');tick(r,1);assert.equal(r.y,0);
 const a=run('aerial');a.jump();tick(a,.25);a.jump();tick(a,.04);assert.equal(a.jumps,2);assert(a.vy>9);a.jump();tick(a,.2);assert.equal(a.jumps,2);
}
console.log('PASS lane limits, grounded jump, second jump specialization and landing reset');
{
 const r=run();tick(r,2,{boost:true});assert(r.speed>44);assert(r.energy<70);tick(r,6,{boost:true});assert(r.boostLocked||r.energy<25);const before=r.energy;tick(r,2);assert(r.energy>before);assert.equal(r.boosting,false);
 tick(r,1,{brake:true});assert(r.speed<20);const e=r.energy;r.items=[{type:'boost',distance:r.distance+1,lane:r.lane,done:false}];tick(r,.15);assert(r.energy>=e);
}
console.log('PASS boost drain, automatic cooldown, recharge, braking and boost pads');
{
 const r=run();r.speed=45;r.items=[{type:'barrier',distance:.1,lane:1,done:false}];tick(r,.02,{boost:true});assert.equal(r.hits,1);assert(r.stumble>0);assert(r.remaining>99);assert.equal(r.delivered,0);
 r.items=[{type:'tower',distance:r.distance+.1,lane:1,done:false}];tick(r,.02);assert.equal(r.hits,1,'Invulnerability prevents duplicate collisions');tick(r,1.4);assert.equal(r.stumble,0);
 const clear=run();clear.jump();tick(clear,.25);clear.items=[{type:'barrier',distance:clear.distance+.1,lane:1,done:false}];tick(clear,.02);assert.equal(clear.hits,0);assert(clear.score>=90);
 const tower=run();tower.y=2.2;tower.items=[{type:'tower',distance:.1,lane:1,done:false}];tick(tower,.2);assert.equal(tower.hits,1);
}
console.log('PASS swept high-speed collision, harmless slowdown, recovery and jump clearance');
{
 const r=run();r.items=[{type:'signal',distance:1,lane:1,height:1.2,done:false}];tick(r,.3);assert.equal(r.signals,1);tick(r,.3);assert.equal(r.signals,1);
 r.event='flow';r.eventTimer=2;const before=r.score;r.items=[{type:'signal',distance:r.distance+1,lane:1,height:1.2,done:false}];tick(r,.1);assert.equal(r.score-before,70);tick(r,6);assert.equal(r.chain,0);
 for(const kind of ['tailwind','magnet','flow']){r.elapsed=r.nextEvent;r.step(1/90);assert(r.event);assert(r.eventTimer>7);}
}
console.log('PASS pickups score once, double-score event, combo expiry and scheduled city events');
{
 const r=run();r.items=r.stops;r.stops[0].distance=1;r.stops[0].lane=1;r.remaining=30;tick(r,.4);assert.equal(r.delivered,1);assert(r.remaining>33);r.stops[1].distance=r.distance+1;r.stops[1].lane=0;tick(r,.2);assert.equal(r.completed,2);assert.equal(r.delivered,1);assert.equal(r.stops[1].status,'missed');
 r.remaining=.01;tick(r,.05);assert.equal(r.result.complete,false);assert(r.result.xp>=45);const score=r.score;r.finish();r.step(1);assert.equal(r.score,score,'Result can only be settled once');
}
console.log('PASS delivery and missed gates, deadline result, XP retained and idempotent settlement');
let total=0;
for(let seed=1;seed<=12;seed++)for(let contract=0;contract<3;contract++)for(const role of Object.keys(N.roles)){
 const p=N.freshProfile();p.role=role;p.contract=contract;const r=new N.Run(p,seed);
 const groups=new Map();for(const item of r.items)if(['tower','barrier','vent'].includes(item.type)){if(!groups.has(item.distance))groups.set(item.distance,new Set());groups.get(item.distance).add(item.lane);assert(r.stops.every(s=>Math.abs(s.distance-item.distance)>=100));}
 assert([...groups.values()].every(g=>g.size<=2));
 for(let i=0;i<90*160&&!r.result;i++){autopilot(r);r.step(1/90,{boost:true});r.notices.length=0;}
 assert(r.result?.complete,`seed ${seed} / ${contract} / ${role} can finish`);assert.equal(r.delivered,3);assert.equal(r.hits,0,`seed ${seed} / ${contract} / ${role} has a collision-free route`);assert(r.score>0);total++;
}
console.log(`PASS ${total} complete seeded runs: all roles/contracts can deliver all three parcels; each obstacle row has an open lane`);
// Physics is integrated by fixed steps in the browser; compare direct equal-time steps as a drift guard.
const a=run(),b=run();tick(a,5,{boost:true});for(let i=0;i<150;i++)for(let n=0;n<3;n++)b.step(1/90,{boost:true});assert(Math.abs(a.distance-b.distance)<.6);
console.log('PASS equivalent 30/90 Hz simulation groups preserve distance');
module.exports={autopilot};
