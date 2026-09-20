'use strict';
// Shared primitive geometry keeps the little handmade world inexpensive to draw.
Meadow.Art = (() => {
  const materials = new Map();
  const geometries = {
    ball: new THREE.SphereGeometry(1, 12, 10),
    pebble: new THREE.IcosahedronGeometry(1, 1),
    box: new THREE.BoxGeometry(1, 1, 1),
    cylinder: new THREE.CylinderGeometry(1, 1, 1, 12),
    cone: new THREE.ConeGeometry(1, 1, 12)
  };
  function material(color) {
    if (!materials.has(color)) materials.set(color, new THREE.MeshStandardMaterial({ color: new THREE.Color(color).convertSRGBToLinear(), roughness: 0.88 }));
    return materials.get(color);
  }
  function part(parent, type, color, position, scale, shadow = true) {
    const mesh = new THREE.Mesh(geometries[type], material(color));
    mesh.position.set(...position); mesh.scale.set(...scale);
    mesh.castShadow = shadow; mesh.receiveShadow = true; parent.add(mesh);
    return mesh;
  }
  function disk(parent, color, x, z, rx, rz, y = 0.025) {
    return part(parent, 'cylinder', color, [x, y, z], [rx, 0.035, rz], false);
  }
  function group(parent, x = 0, z = 0) {
    const result = new THREE.Group(); result.position.set(x, 0, z); parent.add(result); return result;
  }
  function rng(seed) { return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; }; }
  function ribbon(parent, x = 0, y = 0, z = 0, size = 1) {
    const g = group(parent); g.position.set(x, y, z); g.scale.setScalar(size);
    const a = part(g, 'ball', 0xc65d53, [-0.22, 0, 0], [.3, .17, .11]); a.rotation.z = -.35;
    const b = part(g, 'ball', 0xc65d53, [.22, 0, 0], [.3, .17, .11]); b.rotation.z = .35;
    part(g, 'ball', 0xe38d72, [0, 0, .07], [.11, .13, .11]);
    [-1, 1].forEach(s => { const tail = part(g, 'box', 0xc65d53, [s * .13, -.24, 0], [.15, .4, .06]); tail.rotation.z = s * -.3; });
    return g;
  }
  function flower(parent, color, x, z, size = 1, type = 'sun') {
    const g = group(parent, x, z); g.scale.setScalar(size);
    part(g, 'cylinder', 0x648449, [0, .45, 0], [.045, .9, .045]);
    const leaf = part(g, 'ball', 0x7e9a50, [-.18, .35, 0], [.28, .09, .11]); leaf.rotation.z = -.5;
    const bloom = group(g); bloom.position.y = .95;
    // Each quest flower has a different silhouette, as well as its name and symbol.
    if (type === 'heart') {
      part(bloom, 'ball', color, [-.17, .13, 0], [.25, .26, .14]);
      part(bloom, 'ball', color, [.17, .13, 0], [.25, .26, .14]);
      const tip = part(bloom, 'cone', color, [0, -.15, 0], [.38, .55, .18]); tip.rotation.z = Math.PI;
    } else {
      const petals = type === 'star' ? 5 : 8;
      for (let i = 0; i < petals; i++) {
        const a = i / petals * Math.PI * 2;
        const petal = part(bloom, type === 'star' ? 'cone' : 'ball', color, [Math.sin(a) * .26, Math.cos(a) * .26, 0], type === 'star' ? [.18, .52, .14] : [.14, .25, .12]);
        petal.rotation.z = -a;
      }
      part(bloom, 'ball', 0xf9df89, [0, 0, .10], [.18, .18, .13]);
    }
    return g;
  }
  return { material, geometries, part, disk, group, rng, ribbon, flower };
})();
