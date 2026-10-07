'use strict';
Meadow.Owl = class {
  constructor(scene) {
    const A=Meadow.Art;this.mesh=A.group(scene,-2.4,5);this.body=A.group(this.mesh);
    const perch=A.group(scene,-2.4,5);
    A.part(perch,'cylinder',0x796b50,[0,.3,0],[.6,.6,.5]);
    A.part(this.body,'ball',0x99876a,[0,1.15,0],[.65,.79,.47]);
    A.part(this.body,'ball',0xdfd3b4,[0,1.0,.34],[.44,.52,.16]);
    A.part(this.body,'ball',0x99876a,[0,1.86,0],[.71,.56,.45]);
    this.wings=[];
    [-1,1].forEach(s=>{
      const wing=A.part(this.body,'ball',0x766b52,[s*.56,1.15,-.03],[.23,.59,.29]);wing.rotation.z=s*.2;this.wings.push(wing);
      A.part(this.body,'cone',0x99876a,[s*.46,2.28,-.04],[.21,.45,.24]);
      A.part(this.body,'ball',0xf3e2ad,[s*.3,1.89,.36],[.30,.31,.13]);
      A.part(this.body,'ball',0x44534b,[s*.3,1.88,.49],[.11,.13,.045]);
      A.part(this.body,'ball',0xf6f0d4,[s*.27,1.94,.53],[.035,.04,.015]);
      A.part(this.body,'ball',0xba9c58,[s*.25,.57,.35],[.18,.10,.22]);
    });
    const beak=A.part(this.body,'cone',0xd4ae5f,[0,1.66,.57],[.12,.28,.15]);beak.rotation.x=Math.PI/2;
    A.part(this.body,'cylinder',0x7dabb3,[0,1.44,.02],[.53,.14,.4]);
    A.part(this.body,'box',0x7dabb3,[.23,1.14,.52],[.2,.53,.06]);
    A.part(this.body,'ball',0xd8bc72,[.23,1.18,.57],[.07,.07,.02]);
  }
  update(time,player,reduced,flying=false){
    const p=player.mesh.position;this.mesh.rotation.y=Math.atan2(p.x-this.mesh.position.x,p.z-this.mesh.position.z);
    this.body.position.y=(flying?.2:0)+(reduced?0:Math.sin(time*1.5)*(flying?.08:.03));
    this.wings.forEach((wing,i)=>wing.rotation.z=(i?1:-1)*((flying?.9:.2)+(reduced?0:Math.sin(time*(flying?8:1))*(flying?.25:.04))));
  }
};

Meadow.Mother = class {
  constructor(scene) {
    const A=Meadow.Art;this.mesh=A.group(scene,2,-4.3);this.body=A.group(this.mesh);
    [-1,1].forEach(s=>{
      A.part(this.body,'cylinder',0xe3bd99,[s*.2,.3,0],[.10,.6,.11]);
      A.part(this.body,'ball',0x685947,[s*.2,.10,.08],[.16,.1,.24]);
    });
    const dress=new THREE.Mesh(new THREE.CylinderGeometry(.31,.60,1.27,16),A.material(0x729e9b));dress.position.y=1.15;dress.castShadow=true;this.body.add(dress);
    A.part(this.body,'ball',0xf0d4ae,[0,1.66,0],[.32,.28,.24]);
    A.part(this.body,'ball',0x654b3b,[0,2.2,-.10],[.48,.55,.4]);
    A.part(this.body,'ball',0x654b3b,[0,1.9,-.25],[.44,.53,.25]);
    A.part(this.body,'ball',0xf1cdac,[0,2.17,.13],[.38,.4,.3]);
    for(let i=0;i<5;i++)A.part(this.body,'ball',0x654b3b,[-.3+i*.15,2.47,.23],[.15,.19,.16]);
    [-1,1].forEach(s=>{
      A.part(this.body,'ball',0x493e36,[s*.14,2.21,.417],[.03,.045,.025]);
      A.part(this.body,'ball',0xdaab96,[s*.25,2.08,.35],[.07,.035,.02]);
    });
    this.arms=[-1,1].map(s=>{
      const arm=A.group(this.body);arm.position.set(s*.38,1.66,0);
      A.part(arm,'ball',0x8aaeaa,[0,-.13,0],[.15,.24,.16]);
      A.part(arm,'ball',0xf0caa6,[0,-.43,0],[.105,.24,.10]);return arm;
    });
    A.ribbon(this.body,.30,2.55,.04,.67);
    A.part(this.body,'cylinder',0xcc8e72,[0,1.76,0],[.33,.09,.26]);
    this.lantern=A.group(this.mesh,.61,.08);this.lantern.position.y=.7;
    A.part(this.lantern,'box',0xe1b867,[0,0,0],[.24,.34,.22]);
    A.part(this.lantern,'cone',0x817955,[0,.26,0],[.22,.20,.22]);
  }
  update(time,hug,walking,reduced){
    this.arms.forEach((arm,i)=>{arm.rotation.x=hug?-1.15:walking&&!reduced?Math.sin(time*8)*(i?-.3:.3):0;arm.rotation.z=hug?(i?-.25:.25):0;});
    this.body.position.y=walking&&!reduced?Math.abs(Math.sin(time*8))*.035:0;
  }
};

Meadow.Hedgehog = class {
  constructor(scene) {
    const A = Meadow.Art;
    this.mesh = A.group(scene, -6.1, -4.2);
    this.body = A.group(this.mesh);
    A.part(this.body, 'ball', 0x795b43, [0, .91, -.12], [.63, .76, .47]);
    // Soft, blunt spines and a post bag distinguish 栗栗 from the rabbit.
    for (let row = 0; row < 3; row++) {
      for (let i = 0; i < 7; i++) {
        const angle = -.5 + i / 6 * 4.15;
        const spine = A.part(this.body, 'cone', (row + i) % 2 ? 0xa38560 : 0x8d6a4b,
          [Math.sin(angle) * .56, .65 + row * .32, -Math.cos(angle) * .34 - .1], [.14, .32, .14]);
        spine.rotation.z = -Math.sin(angle) * .9;
        spine.rotation.x = -Math.cos(angle) * .9;
      }
    }
    A.part(this.body, 'ball', 0xe6cfaa, [0, 1.18, .29], [.46, .4, .34]);
    A.part(this.body, 'ball', 0xe4c79e, [0, 1.08, .56], [.24, .18, .27]);
    A.part(this.body, 'ball', 0x4e493d, [0, 1.15, .80], [.075, .065, .06]);
    [-1, 1].forEach(s => {
      A.part(this.body, 'ball', 0x534d3d, [s * .17, 1.31, .58], [.03, .04, .023]);
      A.part(this.body, 'ball', 0xc39a72, [s * .39, 1.49, .23], [.12, .14, .11]);
      A.part(this.body, 'ball', 0xe4c79e, [s * .29, .16, .18], [.21, .16, .26]);
      A.part(this.body, 'ball', 0xe4c79e, [s * .5, .7, .19], [.12, .27, .15]);
    });
    A.part(this.body, 'ball', 0x688476, [0, .65, .26], [.40, .35, .25]);
    const strap = A.part(this.body, 'box', 0xb08b53, [.16, .78, .50], [.09, .7, .04]); strap.rotation.z = -.5;
    A.part(this.body, 'box', 0xb48c54, [.34, .48, .40], [.4, .32, .18]);
    const letter = A.part(this.body, 'box', 0xffedc6, [.34, .62, .46], [.28, .23, .035]); letter.rotation.z = -.15;
    A.part(this.body, 'cylinder', 0x688476, [0, 1.63, .09], [.39, .15, .34]);
    A.part(this.body, 'box', 0x587366, [0, 1.59, .41], [.56, .065, .3]);
    A.part(this.body, 'ball', 0xe1bd6d, [0, 1.65, .43], [.07, .065, .03]);
    this.mesh.scale.setScalar(1.18);
  }
  update(time, player, reduced) {
    const p = player.mesh.position, pos = this.mesh.position;
    if (Math.hypot(p.x-pos.x,p.z-pos.z) < 6) this.mesh.rotation.y = Math.atan2(p.x-pos.x,p.z-pos.z);
    this.body.position.y = reduced ? 0 : Math.sin(time * 1.8) * .025;
  }
};

Meadow.Rabbit = class {
  constructor(scene) {
    const A = Meadow.Art; this.mesh = A.group(scene, 1.8, 3.4); this.body = A.group(this.mesh);
    A.part(this.body, 'ball', 0xf0e8d5, [0, .72, 0], [.48, .61, .37]);
    A.part(this.body, 'ball', 0x748e9a, [0, .82, .05], [.48, .4, .36]);
    A.part(this.body, 'ball', 0xf8eed5, [0, .85, .34], [.18, .29, .09]);
    A.part(this.body, 'ball', 0xf5eedb, [0, 1.48, .04], [.49, .44, .4]);
    this.ears = [-1, 1].map(s => {
      const ear = A.group(this.body); ear.position.set(s * .24, 1.76, .03); ear.rotation.z = -s * .14;
      A.part(ear, 'ball', 0xf3ead7, [0, .37, 0], [.15, .53, .13]);
      A.part(ear, 'ball', 0xdab5a9, [0, .39, .10], [.08, .36, .045]); return ear;
    });
    [-1, 1].forEach(s => {
      A.part(this.body, 'ball', 0x3f453e, [s * .16, 1.51, .405], [.038, .055, .024]);
      A.part(this.body, 'ball', 0xdcb5a3, [s * .3, 1.38, .35], [.08, .04, .025]);
      A.part(this.body, 'ball', 0xf0e8d5, [s * .29, .19, .15], [.24, .18, .32]);
      A.part(this.body, 'ball', 0xf0e8d5, [s * .46, .78, .08], [.16, .31, .18]);
    });
    A.part(this.body, 'ball', 0xb18b7e, [0, 1.39, .46], [.065, .05, .04]);
    A.part(this.body, 'ball', 0xf8f3df, [0, .54, -.41], [.24, .23, .23]);
    A.part(this.body, 'ball', 0xd8b76e, [0, 1.14, .4], [.12, .12, .05]);
  }
  update(time, player, follow, dt, reduced, world) {
    const p = player.mesh.position, pos = this.mesh.position;
    if (follow) {
      const x = p.x + 1.45, z = p.z + 1.15;
      const distance = Math.hypot(x - pos.x, z - pos.z);
      if (distance > .15) {
        const step = Math.min(distance, dt * 4.1), direction = Math.atan2(x-pos.x,z-pos.z);
        // Pick a walkable sidestep so the companion cannot walk through water or trees.
        for (const turn of [0,.65,-.65,1.3,-1.3,1.9,-1.9]) {
          const nx=pos.x+Math.sin(direction+turn)*step,nz=pos.z+Math.cos(direction+turn)*step;
          if (world.canWalk(nx,nz)) { pos.x=nx;pos.z=nz;break; }
        }
      }
    }
    const angle = Math.atan2(p.x - pos.x, p.z - pos.z);
    this.mesh.rotation.y += Math.atan2(Math.sin(angle - this.mesh.rotation.y), Math.cos(angle - this.mesh.rotation.y)) * Math.min(1, dt * 3);
    this.body.position.y = reduced ? 0 : Math.sin(time * 2) * .035;
    this.ears[0].rotation.z = -.14 + (reduced ? 0 : Math.sin(time * 1.2) * .04);
  }
};
