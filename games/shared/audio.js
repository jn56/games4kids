(() => {
  'use strict';
  const cache = new Map();
  window.GameStorage = {
    get(key, fallback = null) { if (cache.has(key)) return cache.get(key); try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; } },
    set(key, value) { cache.set(key, String(value)); try { localStorage.setItem(key, String(value)); } catch {} },
    number(key, fallback = 0) { const value = Number(this.get(key, fallback)); return Number.isFinite(value) && value >= 0 ? value : fallback; }
  };
  let prefs;
  try { prefs = JSON.parse(GameStorage.get('playgarden_audio', '{}')); } catch { prefs = {}; }
  if (!prefs || typeof prefs !== 'object') prefs = {};
  let musicEnabled = prefs.music !== false, effectsEnabled = prefs.effects !== false;
  let audioContext, musicBus, effectsBus, timer, step = 0, playing = false, unlocked = false, tune = 0;
  const melodies = [
    [0,4,7,12,7,4,2,4], [0,7,9,7,4,2,4,7], [0,2,4,7,4,2,-1,2], [0,3,7,10,7,3,2,5],
    [0,4,5,7,4,2,0,7], [0,7,4,9,7,4,2,4], [0,2,7,9,7,4,2,0], [0,4,9,7,2,7,4,0]
  ];
  function init() {
    if (audioContext) return audioContext;
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) return null;
    try {
      audioContext = new Context(); musicBus = audioContext.createGain(); effectsBus = audioContext.createGain();
      musicBus.connect(audioContext.destination); effectsBus.connect(audioContext.destination); sync();
    } catch { return null; }
    return audioContext;
  }
  function sync() {
    if (audioContext) {
      musicBus.gain.setTargetAtTime(musicEnabled && !document.hidden ? 0.16 : 0, audioContext.currentTime, .025);
      effectsBus.gain.setTargetAtTime(effectsEnabled && !document.hidden ? 0.5 : 0, audioContext.currentTime, .015);
    }
    window.dispatchEvent(new CustomEvent('gameaudiochange'));
  }
  function note(freq, duration, bus, delay = 0, volume = .16, type = 'triangle') {
    if (!audioContext || audioContext.state !== 'running') return;
    const at = audioContext.currentTime + delay, osc = audioContext.createOscillator(), gain = audioContext.createGain();
    osc.type = type; osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, at); gain.gain.linearRampToValueAtTime(volume, at + .012);
    gain.gain.exponentialRampToValueAtTime(.0001, at + duration);
    osc.connect(gain); gain.connect(bus); osc.start(at); osc.stop(at + duration + .025);
    osc.onended = () => { osc.disconnect(); gain.disconnect(); };
  }
  function schedule() {
    if (!playing || !musicEnabled || !unlocked || document.hidden) return;
    const melody = melodies[tune % melodies.length], semitone = melody[step % melody.length];
    const root = 220 * 2 ** ((tune % 3) / 12);
    note(root * 2 ** (semitone / 12), .32, musicBus, 0, .17, tune % 2 ? 'sine' : 'triangle');
    if (step % 4 === 0) note(root / 2, .7, musicBus, 0, .1, 'sine');
    step++; timer = setTimeout(schedule, 260 + (tune % 4) * 35);
  }
  function restart() { clearTimeout(timer); if (playing && musicEnabled && unlocked && !document.hidden) schedule(); }
  async function unlock() {
    unlocked = true;
    const context = init();
    if (context?.state === 'suspended') { try { await context.resume(); } catch {} }
    if (!timer) restart();
  }
  window.GameAudio = {
    context: init, unlock,
    setTune(value) { tune = value; step = 0; },
    startMusic() { if (playing) return; playing = true; restart(); },
    stopMusic() { playing = false; clearTimeout(timer); timer = null; },
    toggleMusic() { musicEnabled = !musicEnabled; GameStorage.set('playgarden_audio', JSON.stringify({music:musicEnabled,effects:effectsEnabled})); sync(); restart(); },
    toggleEffects() { effectsEnabled = !effectsEnabled; GameStorage.set('playgarden_audio', JSON.stringify({music:musicEnabled,effects:effectsEnabled})); sync(); },
    get musicEnabled() { return musicEnabled; }, get effectsEnabled() { return effectsEnabled; },
    get playing() { return playing; },
    tone(freq, duration = .2) { if (effectsEnabled) { init(); note(freq, duration, effectsBus); } },
    effect(type) {
      if (!effectsEnabled) return; init();
      const success = /win|success|complete|victory/.test(type), failure = /over|lose|bomb|error|damage|mismatch|poop/.test(type);
      const notes = success ? [523,659,784,1047] : failure ? [220,165,110] : /jump|flap/.test(type) ? [330,550] : /catch|eat|flower|match|pop|score/.test(type) ? [660,880] : [440];
      notes.forEach((freq,index) => note(freq, failure ? .2 : .12, effectsBus, index * .09, .13, 'sine'));
    }
  };
  document.addEventListener('pointerdown', unlock, { passive:true });
  document.addEventListener('keydown', event => { if (!event.metaKey && !event.ctrlKey) unlock(); });
  document.addEventListener('visibilitychange', () => {
    clearTimeout(timer); timer = null; sync();
    if (document.hidden) { if (audioContext?.state === 'running') audioContext.suspend().catch(() => {}); }
    else if (unlocked) unlock();
  });
  window.addEventListener('pagehide', () => { GameAudio.stopMusic(); if (audioContext) audioContext.suspend().catch(() => {}); });
})();
