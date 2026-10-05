// Test driver plans with visible route data; browser tests send real key events.
module.exports=function chooseLane(r,choices=0){
  const fork=r.forks.find(f=>f.choice===null&&f.start>=r.distance&&f.start-r.distance<90);
  if(fork)return (choices>>fork.index)&1?2:0;
  const active=r.forkAt();
  if(active){
    const goal=r.items.find(o=>o.fork===active.index&&r.itemActive(o)&&!o.done&&o.distance>r.distance&&['speedGate','styleGate','ramp','skyStar','signal'].includes(o.type));
    return goal?goal.lane:1;
  }
  const next=r.stops.find(s=>!s.done);if(next&&next.distance-r.distance<85)return next.lane;
  const hazard=r.items.find(o=>r.itemActive(o)&&!o.done&&['tower','barrier','vent'].includes(o.type)&&o.distance>r.distance&&o.distance-r.distance<75);
  if(hazard){const blocked=r.items.filter(o=>r.itemActive(o)&&o.distance===hazard.distance&&['tower','barrier','vent'].includes(o.type)).map(o=>o.lane);return [0,1,2].find(l=>!blocked.includes(l));}
  return r.lane;
};
