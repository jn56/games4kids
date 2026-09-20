'use strict';
Meadow.Input = class {
  constructor(action, pause) {
    this.keys = new Set(); this.axis = { x: 0, z: 0 }; this.pointerId = null;
    const movement = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
    window.addEventListener('keydown', event => {
      if (event.code === 'Escape' && !event.repeat) { event.preventDefault(); pause(); return; }
      if (movement.includes(event.code)) { event.preventDefault(); this.keys.add(event.code); }
      if (['KeyE', 'Space'].includes(event.code)) {
        // Space on a focused button must activate that button once, not also the game.
        if (event.target instanceof HTMLElement && event.target.closest('button,a') && event.code === 'Space') return;
        event.preventDefault(); if (!event.repeat) action();
      }
    });
    window.addEventListener('keyup', event => this.keys.delete(event.code));
    window.addEventListener('blur', () => this.reset());
    const pad = document.getElementById('joystick');
    this.stick = document.getElementById('joystick-stick');
    const move = event => {
      if (event.pointerId !== this.pointerId) return;
      const r = pad.getBoundingClientRect(), radius = r.width * .32;
      let x = event.clientX - r.left - r.width / 2, z = event.clientY - r.top - r.height / 2;
      const length = Math.hypot(x, z); if (length > radius) { x *= radius / length; z *= radius / length; }
      this.axis.x = x / radius; this.axis.z = z / radius;
      this.stick.style.transform = `translate(${x}px, ${z}px)`;
    };
    pad.addEventListener('pointerdown', event => {
      if (this.pointerId !== null) return;
      event.preventDefault(); this.pointerId = event.pointerId; pad.setPointerCapture(event.pointerId); move(event);
    });
    pad.addEventListener('pointermove', move);
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) pad.addEventListener(type, event => { if (event.pointerId === this.pointerId) this.reset(); });
    document.getElementById('touch-action').addEventListener('click', action);
    document.getElementById('interaction-prompt').addEventListener('click', action);
  }
  movement() {
    let x = this.axis.x, z = this.axis.z;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) x--;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) x++;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) z--;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) z++;
    const length = Math.hypot(x, z);
    return length < .15 ? { x: 0, z: 0 } : { x: x / Math.max(1, length), z: z / Math.max(1, length) };
  }
  reset() { this.keys.clear(); this.axis.x = this.axis.z = 0; this.pointerId = null; this.stick.style.transform = ''; }
};
