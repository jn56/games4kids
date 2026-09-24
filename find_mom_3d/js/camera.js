'use strict';
Meadow.Camera = class {
  constructor(camera, player) { this.camera = camera; this.player = player; this.focus = new THREE.Vector3(0, 0, -2); this.resize(); }
  resize() {
    const aspect = innerWidth / innerHeight;
    this.portrait = aspect < .85;
    // Portrait follows closely; a wider view preserves the diorama on desktop.
    this.compact = innerHeight < 500 && aspect > 1.3;
    const height = this.compact ? 16 : this.portrait ? 24 : 25;
    this.camera.left = -height * aspect / 2; this.camera.right = height * aspect / 2;
    this.camera.top = height / 2; this.camera.bottom = -height / 2;
    this.camera.updateProjectionMatrix();
  }
  update(dt, cover, reduced) {
    const p = this.player.mesh.position;
    const target = this.override || (cover ? new THREE.Vector3(-2, 0, -1) : new THREE.Vector3(p.x, 0, p.z - 2));
    this.focus.lerp(target, reduced ? 1 : 1 - Math.exp(-3.5 * dt));
    this.camera.position.copy(this.focus).add(new THREE.Vector3(0, 23, 25));
    this.camera.lookAt(this.focus);
  }
};
