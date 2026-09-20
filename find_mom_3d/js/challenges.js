'use strict';

Meadow.PuzzleRules = {
  openings(index, turns) {
    const base = CONFIG.WIND_KINDS[index] === 'bend' ? [0, 1] : [0, 2];
    return base.map(direction => (direction + turns[index]) % 4);
  },
  traceWind(turns) {
    const visited = [];
    let index = 0, incoming = 3;
    const dx = [0, 1, 0, -1], dy = [-1, 0, 1, 0];
    while (visited.length < 10) {
      if (visited.includes(index)) return { solved: false, visited, stop: index, reason: '風繞回原來的地方了。' };
      const openings = this.openings(index, turns);
      if (!openings.includes(incoming)) return { solved: false, visited, stop: index, reason: '這一格的管口，還沒接住吹來的風。' };
      visited.push(index);
      const outgoing = openings.find(direction => direction !== incoming);
      const row = Math.floor(index / 3) + dy[outgoing], col = index % 3 + dx[outgoing];
      if (row < 0 || row > 2 || col < 0 || col > 2) {
        const solved = index === 8 && outgoing === 1 && visited.length === 9;
        return { solved, visited, stop: index, reason: solved ? '九格都通風了！媽媽的信送到了。' : '風從旁邊跑出去了。出口在右下角的右邊。' };
      }
      incoming = (outgoing + 2) % 4;
      index = row * 3 + col;
    }
    return { solved: false, visited, stop: index, reason: '再看看還沒接好的管口。' };
  },
  completeOrder(order) {
    return Array.isArray(order) && order.length === 4 && new Set(order).size === 4 &&
      order.every(id => CONFIG.LAMP_ITEMS.some(item => item.id === id));
  },
  lampChecks(order) {
    if (!this.completeOrder(order)) return [false, false, false];
    const sun = order.indexOf('sun'), heart = order.indexOf('heart'), star = order.indexOf('star'), ribbon = order.indexOf('ribbon');
    return [Math.abs(sun - star) === 2, heart === sun + 1, star > ribbon];
  },
  lampSolved(order) { return this.completeOrder(order) && this.lampChecks(order).every(Boolean); }
};

Meadow.Challenges = class {
  constructor(game) {
    this.game = game;
    this.panel = document.getElementById('puzzle-screen');
    this.kind = null;
    this.selected = null;
    this.feedback = '';
    this.result = null;
    document.getElementById('puzzle-close').addEventListener('click', () => this.close());
    document.getElementById('puzzle-submit').addEventListener('click', () => this.submit());
    document.getElementById('puzzle-hint').addEventListener('click', () => this.hint());
    document.getElementById('puzzle-clear').addEventListener('click', () => this.clear());
    this.panel.addEventListener('click', event => {
      if (this.game.state.mode !== 'puzzle') return;
      const button = event.target.closest('button');
      if (!button) return;
      if (button.dataset.tile !== undefined) this.rotate(Number(button.dataset.tile));
      if (button.dataset.item) this.select(button.dataset.item);
      if (button.dataset.slot !== undefined) this.place(Number(button.dataset.slot));
    });
  }
  open(kind) {
    const s = this.game.state;
    if (s.mode !== 'playing') return;
    if (kind === 'wind' && (!s.metHedgehog || s.windSolved)) return;
    if (kind === 'lamp' && (!s.windSolved || s.flowers.length !== 3 || s.lit)) return;
    if (kind === 'journal' && !s.metHedgehog) return;
    this.kind = kind; this.selected = null; this.result = null; this.feedback = '';
    if (kind !== 'journal') {
      const p = this.game.player.mesh.position;
      s.checkpoint = { x: p.x, z: p.z }; this.game.saveProgress();
    }
    s.mode = 'puzzle'; this.game.input.reset(); this.panel.hidden = false;
    document.body.classList.add('in-puzzle');
    this.game.interactions.update(); this.render();
    document.getElementById('puzzle-close').focus({ preventScroll: true });
  }
  close() {
    if (this.game.state.mode !== 'puzzle') return;
    this.hide(); this.game.state.mode = 'playing';
    this.game.input.reset(); this.game.refresh();
    document.getElementById('puzzle-close').blur();
  }
  hide() {
    this.panel.hidden = true; this.kind = null; this.selected = null; this.result = null;
    document.body.classList.remove('in-puzzle');
  }
  render(focusSelector) {
    const s = this.game.state, wind = this.kind === 'wind', journal = this.kind === 'journal';
    const titles = { wind: '幫風找到送信的路', lamp: '四樣回憶，該怎麼排？', journal: '小米的線索手帳' };
    document.getElementById('puzzle-title').textContent = titles[this.kind];
    document.getElementById('puzzle-kicker').textContent = wind ? '栗栗的風車郵局 · 觀察管口' : journal ? '想一想，也可以翻一翻' : '引路燈的祕密 · 合併三條線索';
    document.getElementById('puzzle-description').textContent = wind ? '點一格轉一下，讓風經過全部九格，從右下方吹出去。' : journal ? '媽媽的信與光花的線索，都好好收在這裡。' : '先選一樣回憶，再點位置放入。從左到右，讓三條線索都成立。';
    document.getElementById('puzzle-stage').innerHTML = wind ? this.windMarkup() : journal ? this.letterMarkup() : this.lampMarkup();
    document.getElementById('puzzle-notes').innerHTML = wind ? this.windNotes() : this.clueMarkup();
    document.getElementById('puzzle-feedback').textContent = this.feedback || (wind ? '可以先沿著管子用手指走一遍，再試著送風。' : journal ? '找到花朵時，新的線索會自動記下來。' : '沒有時間限制。放好的回憶可以點一下取回。');
    const submit = document.getElementById('puzzle-submit');
    submit.hidden = journal;
    submit.textContent = wind ? '試送一陣風 →' : '試著點亮引路燈 ✦';
    submit.disabled = !wind && !Meadow.PuzzleRules.completeOrder(s.arrangement);
    document.getElementById('puzzle-clear').hidden = wind || journal;
    const hint = document.getElementById('puzzle-hint');
    hint.hidden = journal;
    hint.textContent = wind && s.windHints >= 2 ? '示範轉對一格' : !wind && s.lampHints >= 2 ? '看看完整推理' : '給我一點提示';
    if (focusSelector) this.panel.querySelector(focusSelector)?.focus({ preventScroll: true });
  }
  windMarkup() {
    const turns = this.game.state.windTurns;
    const directions = ['上', '右', '下', '左'];
    const tiles = turns.map((turn, i) => {
      const opens = Meadow.PuzzleRules.openings(i, turns);
      const active = this.result?.visited.includes(i), stopped = this.result && !this.result.solved && this.result.stop === i;
      const path = CONFIG.WIND_KINDS[i] === 'bend' ? 'M 50 0 V 35 Q 50 50 65 50 H 100' : 'M 50 0 V 100';
      return `<button class="wind-tile${active ? ' has-wind' : ''}${stopped ? ' wind-stop' : ''}" data-tile="${i}" aria-label="第 ${Math.floor(i / 3) + 1} 列第 ${i % 3 + 1} 格，管口朝${opens.map(d => directions[d]).join('、')}；點一下順時針旋轉"><svg viewBox="0 0 100 100" aria-hidden="true"><g transform="rotate(${turn * 90} 50 50)"><path class="pipe-rim" d="${path}"/><path class="pipe-core" d="${path}"/><path class="pipe-shine" d="${path}"/></g></svg><span class="tile-turn" aria-hidden="true">↻</span></button>`;
    }).join('');
    return `<div class="wind-machine"><div class="wind-inlet">入口：風從這裡吹進 <b>↓</b></div><div class="wind-grid-wrap"><span class="inlet-arrow" aria-hidden="true">→</span><div class="wind-grid">${tiles}</div><span class="outlet-arrow" aria-hidden="true">→</span></div><div class="wind-outlet">右下出口 → 栗栗的郵箱 ✉</div></div>`;
  }
  windNotes() {
    return `<div class="helper-heading"><span>🦔</span><div><strong>栗栗的小提醒</strong><small>慢慢來，管子會等你。</small></div></div><ol class="wind-rules"><li>每格有兩個管口。相鄰的開口要面對面。</li><li>風從左上格的左邊進來。</li><li>讓九格都通風，最後從右下格的右邊離開。</li></ol><div class="wind-counter">已通風 <strong>${this.result?.visited.length || 0}</strong> / 9 格<span>按「試送一陣風」檢查</span></div>`;
  }
  lampMarkup() {
    const s = this.game.state;
    const slots = Array.from({ length: 4 }, (_, i) => {
      const item = CONFIG.LAMP_ITEMS.find(it => it.id === s.arrangement[i]);
      return `<button class="memory-slot${item ? ' filled' : ''}" data-slot="${i}" aria-label="第 ${i + 1} 個位置${item ? '，' + item.name + '，點擊取回' : '，空位'}"><small>${i + 1}</small><span class="memory-symbol ${item?.id || ''}">${item?.symbol || '＋'}</span><span>${item?.name || '放在這裡'}</span></button>`;
    }).join('');
    const items = CONFIG.LAMP_ITEMS.map(item => {
      const used = s.arrangement.includes(item.id);
      return `<button class="memory-choice${this.selected === item.id ? ' selected' : ''}" data-item="${item.id}" ${used ? 'disabled' : ''} aria-pressed="${this.selected === item.id}"><span class="memory-symbol ${item.id}">${item.symbol}</span><span>${item.name}</span><small>${used ? '已放好' : this.selected === item.id ? '選好了，點空位' : '點我選取'}</small></button>`;
    }).join('');
    const instruction = this.selected ? '選好了！點一個空位放入。' : s.arrangement.every(Boolean) ? '想換位置？點上面的回憶取回，再放到空位。' : '從下面選一樣回憶，再點上面的空位。';
    return `<div class="memory-board"><div class="arrange-direction"><span>左邊</span><span>從左往右排 →</span><span>右邊</span></div><div class="memory-slots">${slots}</div><p class="memory-instruction">${instruction}</p><div class="memory-choices">${items}</div></div>`;
  }
  clueMarkup() {
    const s = this.game.state;
    const checks = this.result && this.kind === 'lamp' ? this.result : null;
    return `<h3 class="clue-heading">三朵花的小祕密 <small>${s.flowers.length} / 3</small></h3>${CONFIG.LAMP_CLUES.map((clue, i) => {
      const f = CONFIG.FLOWERS.find(flower => flower.id === clue.id), found = s.flowers.includes(clue.id);
      const status = checks ? (checks[i] ? '符合 ✓' : '再想想 ○') : found ? '已記下' : '待發現';
      return `<div class="clue-card${checks ? checks[i] ? ' clue-pass' : ' clue-rethink' : ''}"><div><strong class="${f.id}">${f.symbol} ${f.name}</strong><span>${status}</span></div><p>${found ? clue.text : `還藏在${f.clue}的光花裡。`}</p></div>`;
    }).join('')}<p class="clue-note">「右邊」是畫面上的右邊。<br>每樣回憶只能放一次；三條線索都要符合。</p>`;
  }
  letterMarkup() {
    return `<div class="letter-sheet"><span class="letter-stamp">✉</span><h3>給我的小米</h3><p>${this.game.state.windSolved ? '我在前面的休息站，很安全。阿蹦和栗栗會陪你走。想你的時候，我也會點亮一盞燈。' : '媽媽的信還卡在風管裡。和栗栗一起修好風管，就能讀到了。'}</p><p class="letter-sign">${this.game.state.windSolved ? '愛你的媽媽 ♡' : '風車郵局 · 待送達'}</p></div>`;
  }
  rotate(index) {
    if (this.kind !== 'wind') return;
    this.game.state.windTurns[index] = (this.game.state.windTurns[index] + 1) % 4;
    this.result = null; this.feedback = '管子轉好了。可以接著轉，或試送一陣風看看。';
    this.game.saveProgress(); this.game.audio.note(440, .08, .02); this.render(`[data-tile="${index}"]`);
  }
  select(id) {
    if (this.kind !== 'lamp' || this.game.state.arrangement.includes(id)) return;
    this.selected = id; this.render(`[data-item="${id}"]`);
  }
  place(index) {
    if (this.kind !== 'lamp') return;
    const order = this.game.state.arrangement;
    if (order[index]) { this.selected = order[index]; order[index] = null; }
    else if (this.selected && !order.includes(this.selected)) { order[index] = this.selected; this.selected = null; }
    else { this.feedback = '先點下面的一樣回憶，再點空位。'; this.render(`[data-slot="${index}"]`); return; }
    this.result = null; this.feedback = '排好後，按「試著點亮引路燈」核對三條線索。';
    this.game.saveProgress(); this.game.audio.note(587, .1, .02); this.render(`[data-slot="${index}"]`);
  }
  clear() {
    if (this.game.state.mode !== 'puzzle' || this.kind !== 'lamp') return;
    this.game.state.arrangement = [null, null, null, null]; this.selected = null; this.result = null;
    this.feedback = '回憶都收回來了。試試別的排列吧。'; this.game.saveProgress(); this.render('#puzzle-clear');
  }
  submit() {
    const g = this.game, s = g.state;
    if (s.mode !== 'puzzle') return;
    if (this.kind === 'wind') {
      this.result = Meadow.PuzzleRules.traceWind(s.windTurns);
      if (this.result.solved) { this.close(); g.story.windComplete(); return; }
      this.feedback = `風走過 ${this.result.visited.length} 格。${this.result.reason} 轉好的管子會保留。`;
      this.render('#puzzle-submit');
    } else if (this.kind === 'lamp' && Meadow.PuzzleRules.completeOrder(s.arrangement)) {
      this.result = Meadow.PuzzleRules.lampChecks(s.arrangement);
      if (this.result.every(Boolean)) { this.close(); g.story.lightLamp(); return; }
      const count = this.result.filter(Boolean).length;
      this.feedback = `有 ${count} 條線索符合！看看旁邊「再想想」的線索，調整回憶的位置。花朵都還在。`;
      this.render('#puzzle-submit');
    }
  }
  hint() {
    const s = this.game.state;
    if (s.mode !== 'puzzle') return;
    if (this.kind === 'wind') {
      s.windHints = Math.min(3, s.windHints + 1);
      if (s.windHints === 1) this.feedback = '先找左上角。風從它的左邊進來，所以那格一定要有朝左的管口。';
      else if (s.windHints === 2) {
        this.result = Meadow.PuzzleRules.traceWind(s.windTurns);
        this.feedback = `看看金框的第 ${Math.floor(this.result.stop / 3) + 1} 列、第 ${this.result.stop % 3 + 1} 格。管口要接住風，也要把風送給下一格。`;
      } else {
        const solution = [1, 1, 2, 1, 1, 3, 0, 1, 1], route = [0, 1, 2, 5, 4, 3, 6, 7, 8];
        const index = route.find(i => Meadow.PuzzleRules.openings(i, s.windTurns).slice().sort().join() !== Meadow.PuzzleRules.openings(i, solution).slice().sort().join());
        if (index === undefined) this.feedback = '管子已經接好了！按「試送一陣風」把信送出去。';
        else {
          s.windTurns[index] = solution[index]; this.result = Meadow.PuzzleRules.traceWind(s.windTurns);
          this.feedback = `栗栗示範轉好了第 ${Math.floor(index / 3) + 1} 列、第 ${index % 3 + 1} 格。接著看看風會往哪裡走？`;
        }
      }
    } else if (this.kind === 'lamp') {
      s.lampHints = Math.min(3, s.lampHints + 1);
      this.feedback = [
        '先看愛心花的線索：把「太陽、愛心」當成一組，兩樣一定要相鄰。',
        '如果太陽在第一格，星星就會在第三格，髮帶只剩第四格，卻不符合星星的線索。試試太陽放第二格。',
        '太陽放第二格，愛心緊接在第三格；隔一樣的星星在第四格，髮帶就在第一格。從左到右：髮帶、太陽、愛心、星星。'
      ][s.lampHints - 1];
    }
    this.game.saveProgress(); this.render('#puzzle-hint');
  }
};
