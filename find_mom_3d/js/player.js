'use strict';
Meadow.Player = class {
  constructor(scene) {
    const A = Meadow.Art;
    this.mesh = A.group(scene, CONFIG.START.x, CONFIG.START.z);
    this.body = A.group(this.mesh);
    this.phase = 0;
    this.legs = [-1, 1].map(s => {
      const leg = A.group(this.body); leg.position.set(s * .16, .45, 0);
      A.part(leg, 'cylinder', 0xf2d2ad, [0, -.19, 0], [.095, .38, .095]);
      A.part(leg, 'ball', 0x695345, [0, -.37, .055], [.12, .10, .19]); return leg;
    });
    const skirt = new THREE.Mesh(new THREE.CylinderGeometry(.22, .48, .65, 16), A.material(0xd17d55));
    skirt.position.y = .73; skirt.castShadow = true; this.body.add(skirt);
    A.part(this.body, 'ball', 0xf7e2b5, [0, 1.05, 0], [.27, .34, .19]);
    A.part(this.body, 'box', 0xd17d55, [0, 1.06, .17], [.36, .38, .08]);
    [-1, 1].forEach(s => A.part(this.body, 'box', 0xc07550, [s * .16, 1.24, .12], [.07, .3, .13]));
    this.arms = [-1, 1].map(s => {
      const arm = A.group(this.body); arm.position.set(s * .31, 1.15, 0);
      A.part(arm, 'ball', 0xf5dfb3, [0, -.08, 0], [.13, .2, .15]);
      A.part(arm, 'ball', 0xf4cda9, [0, -.30, 0], [.10, .19, .10]); return arm;
    });
    A.part(this.body, 'ball', 0x513c32, [0, 1.65, -.03], [.44, .46, .38]);
    A.part(this.body, 'ball', 0xf4ccaa, [0, 1.61, .13], [.35, .34, .29]);
    for (let i = 0; i < 5; i++) A.part(this.body, 'ball', 0x513c32, [-.27 + i * .13, 1.89 - Math.abs(i - 2) * .018, .24], [.135, .17, .16]);
    [-1, 1].forEach(s => {
      A.part(this.body, 'ball', 0x513c32, [s * .43, 1.49, -.05], [.16, .3, .17]);
      A.part(this.body, 'ball', 0xe7bc72, [s * .4, 1.64, -.03], [.11, .07, .13]);
      A.part(this.body, 'ball', 0x493d37, [s * .125, 1.65, .393], [.032, .042, .025], false);
      A.part(this.body, 'ball', 0xe5a18e, [s * .23, 1.52, .35], [.066, .032, .015], false);
    });
    A.part(this.body, 'ball', 0xedb68f, [0, 1.55, .43], [.045, .044, .035]);
    A.ribbon(this.body, .34, 1.94, .08, .48);
    A.part(this.body, 'box', 0x978558, [0, .99, -.25], [.4, .45, .19]);
    this.mesh.scale.setScalar(1.1);
    this.mesh.rotation.y = Math.PI;
    this.shadow = A.disk(scene, 0x647957, CONFIG.START.x, CONFIG.START.z, .44, .35, .009);
  }
  update(dt, input, world, canMove, reducedMotion) {
    const move = canMove ? input.movement() : { x: 0, z: 0 };
    const oldX = this.mesh.position.x, oldZ = this.mesh.position.z;
    const dx = move.x * CONFIG.PLAYER_SPEED * dt, dz = move.z * CONFIG.PLAYER_SPEED * dt;
    if (world.canWalk(oldX + dx, oldZ)) this.mesh.position.x += dx;
    if (world.canWalk(this.mesh.position.x, oldZ + dz)) this.mesh.position.z += dz;
    const walking = Math.hypot(this.mesh.position.x - oldX, this.mesh.position.z - oldZ) > .001;
    if (walking) {
      this.phase += dt * 11;
      const target = Math.atan2(move.x, move.z), current = this.mesh.rotation.y;
      const diff = Math.atan2(Math.sin(target - current), Math.cos(target - current));
      this.mesh.rotation.y += diff * (1 - Math.exp(-14 * dt));
    }
    const swing = walking && !reducedMotion ? Math.sin(this.phase) * .5 : 0;
    this.legs[0].rotation.x = swing; this.legs[1].rotation.x = -swing;
    this.arms[0].rotation.x = -swing * .7; this.arms[1].rotation.x = swing * .7;
    this.body.position.y = walking && !reducedMotion ? Math.abs(Math.sin(this.phase)) * .055 : 0;
    this.shadow.position.x = this.mesh.position.x; this.shadow.position.z = this.mesh.position.z;
  }
  setPosition(x, z) { this.mesh.position.set(x, 0, z); }
};
