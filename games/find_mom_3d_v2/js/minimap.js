'use strict';
Meadow.Minimap = class {
  constructor(game){
    this.game=game;this.panel=document.getElementById('minimap');this.canvas=document.getElementById('minimap-canvas');this.ctx=this.canvas.getContext('2d');this.cache=new Map();this.lastDraw=-1;this.collapsed=false;
    this.button=document.getElementById('minimap-toggle');
    this.button.onclick=()=>{this.collapsed=!this.collapsed;this.button.setAttribute('aria-expanded',String(!this.collapsed));document.getElementById('map-toggle-icon').textContent=this.collapsed?'+':'−';document.getElementById('minimap-body').hidden=this.collapsed;this.lastDraw=-1;this.button.blur();};
  }
  // A snug rectangle follows the world's oval bounds instead of padding a square.
  point(x,z){return {x:148+x*3.5,y:160+(z+1)*3.5};}
  terrain(world,state){
    const key=[state.chapter,state.forest.gustStage,state.valley.bridge,Meadow.Travel.unlocked(state)].join(':');
    if(this.cache.has(key))return this.cache.get(key);
    const canvas=document.createElement('canvas');canvas.width=296;canvas.height=320;const ctx=canvas.getContext('2d'),chapter=state.chapter;
    ctx.globalAlpha=.5;
    // The same collision rules drive the map shading and actual movement.
    for(let y=4;y<316;y+=2)for(let x=4;x<292;x+=2){
      const wx=(x-148)/3.5,wz=(y-160)/3.5-1;
      if((wx/CONFIG.MAP_RADIUS_X)**2+((wz+1)/CONFIG.MAP_RADIUS_Z)**2>.96)continue;
      const water=chapter===1?world.inPond(wx,wz):chapter===2?wz>-10.65&&wz< -5.35:chapter===3?wz> -11.4&&wz<3.2:false;
      ctx.fillStyle=world.canWalk(wx,wz)?['','#b6c995','#96bba5','#b1c3af','#b9b3cc'][chapter]:water?'#86b7c7':'#839485';ctx.fillRect(x,y,2,2);
    }
    ctx.save();ctx.beginPath();ctx.ellipse(148,160,CONFIG.MAP_RADIUS_X*3.5*.98,CONFIG.MAP_RADIUS_Z*3.5*.98,0,0,Math.PI*2);ctx.clip();
    ctx.globalAlpha=.92;ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle='#fff0bd';
    for(const route of world.mapRoutes||[]){if(route.unlocked&&Meadow.Travel.unlocked(state)<route.unlocked)continue;ctx.lineWidth=route.width*3.5;ctx.beginPath();route.points.forEach(([x,z],i)=>{const p=this.point(x,z);if(i)ctx.lineTo(p.x,p.y);else ctx.moveTo(p.x,p.y);});ctx.stroke();}
    ctx.restore();
    this.cache.set(key,canvas);return canvas;
  }
  update(){
    const g=this.game,s=g.state,visible=s.mode==='playing';this.panel.hidden=!visible;
    if(!visible||this.collapsed||g.time-this.lastDraw<.1)return;
    this.lastDraw=g.time;const ctx=this.ctx,w=g.world;ctx.clearRect(0,0,296,320);ctx.globalAlpha=1;ctx.drawImage(this.terrain(w,s),0,0);ctx.globalAlpha=.8;
    // Only navigation markers belong here. Friends, toys and locked gates stay
    // in the 3D scene; full chapter information is opened from the pause menu.
    for(const gate of w.portals||[])if(gate.open)this.dot({x:gate.x,z:gate.z},'#527664',4,true);
    ctx.globalAlpha=.95;
    if(w.target){const p=this.point(w.target.x,w.target.z);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(Math.PI/4);ctx.fillStyle='#e6b848';ctx.strokeStyle='#695127';ctx.lineWidth=2;ctx.fillRect(-6,-6,12,12);ctx.strokeRect(-6,-6,12,12);ctx.restore();}
    ctx.globalAlpha=1;
    const p=this.point(g.player.mesh.position.x,g.player.mesh.position.z);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(-g.player.mesh.rotation.y);
    ctx.beginPath();ctx.moveTo(0,12);ctx.lineTo(-8,-8);ctx.lineTo(0,-4);ctx.lineTo(8,-8);ctx.closePath();ctx.fillStyle='#b94e4b';ctx.strokeStyle='#fff9e8';ctx.lineWidth=3;ctx.fill();ctx.stroke();ctx.restore();
  }
  dot(position,color,radius,hollow=false){const p=this.point(position.x,position.z),ctx=this.ctx;ctx.beginPath();ctx.arc(p.x,p.y,radius,0,Math.PI*2);ctx.fillStyle=hollow?'#fff6db':color;ctx.strokeStyle=color;ctx.lineWidth=2.5;ctx.fill();ctx.stroke();}
};
