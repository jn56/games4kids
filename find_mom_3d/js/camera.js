'use strict';
Meadow.Camera = class {
  constructor(camera, player) { this.camera = camera; this.player = player; this.focus = new THREE.Vector3(0, 0, -2); this.resize(); }
  resize() {
    const aspect = innerWidth / innerHeight;
    this.portrait = aspect < .85;
    // Closer exploration framing makes characters readable on every screen.
    this.compact = innerHeight < 500 && aspect > 1.3;
    this.playHeight=this.compact?13:18;
    this.height=this.override?(this.compact?16:this.portrait?24:25):this.playHeight;
    this.project();
  }
  project(){
    const aspect=innerWidth/innerHeight,height=this.height;
    this.camera.left = -height * aspect / 2; this.camera.right = height * aspect / 2;
    this.camera.top = height / 2; this.camera.bottom = -height / 2;
    this.camera.updateProjectionMatrix();
  }
  update(dt, cover, reduced) {
    const p = this.player.mesh.position;
    const height=this.override||cover?(this.compact?16:this.portrait?24:25):this.playHeight+(this.player.riding?1:0);
    if(Math.abs(height-this.height)>.01){this.height+=(height-this.height)*(reduced?1:1-Math.exp(-5*dt));this.project();}
    const lead=this.player.riding?.14:.07;
    const target = this.override || (cover ? new THREE.Vector3(-2, 0, -1) : new THREE.Vector3(p.x+(this.player.vx||0)*lead, 0, p.z-1.4+(this.player.vz||0)*lead));
    this.focus.lerp(target, reduced ? 1 : 1 - Math.exp(-7 * dt));
    this.camera.position.copy(this.focus).add(new THREE.Vector3(0, 23, 25));
    this.camera.lookAt(this.focus);
  }
};
