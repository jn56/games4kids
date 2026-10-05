// Plan a horizontal target using visible objects; tests steer without teleporting.
module.exports=function targetX(r,choices=0){
  const fork=r.forks.find(f=>f.choice===null&&f.start>=r.distance&&f.start-r.distance<90);
  if(fork)return (choices>>fork.index)&1?4:-4;
  const active=r.forkAt();
  if(active){
    const goal=r.items.find(o=>o.fork===active.index&&r.itemActive(o)&&!o.done&&o.distance>r.distance&&['speedGate','styleGate','ramp','skyStar','signal'].includes(o.type));
    return goal?goal.x:r.x;
  }
  const next=r.stops.find(s=>!s.done);if(next&&next.distance-r.distance<100)return next.x;
  const hazard=r.items.find(o=>r.itemActive(o)&&!o.done&&['tower','barrier','vent'].includes(o.type)&&o.distance>r.distance&&o.distance-r.distance<85);
  if(hazard){
    const blocked=r.items.filter(o=>r.itemActive(o)&&o.distance===hazard.distance&&['tower','barrier','vent'].includes(o.type));
    const hint=r.items.find(o=>o.type==='signal'&&o.height===1.2&&o.distance===hazard.distance-14);
    if(hint)return hint.x;
    const candidates=Array.from({length:73},(_,i)=>-9+i*.25).filter(x=>blocked.every(o=>Math.abs(x-o.x)>3.3));
    return candidates.sort((a,b)=>Math.abs(a-r.x)-Math.abs(b-r.x))[0]??r.x;
  }
  return r.x;
};
