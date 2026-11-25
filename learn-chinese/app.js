// Hanzi Rush — 应用逻辑（无依赖，数据存 localStorage）
(() => {
  const $ = (s) => document.querySelector(s);
  const screen = $('#screen');
  const KEY = 'hanzi_rush_v1';
  const PER_GAME = 8;
  const MAX_HEARTS = 5;

  // ---------- 状态 ----------
  const today = () => new Date().toISOString().slice(0, 10);
  const yesterday = () => { const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().slice(0, 10); };
  const yday = () => Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 864e5);

  let S = { xp: 0, streak: 0, lastDay: '', hearts: MAX_HEARTS, heartsDay: today(), boxes: {}, games: 0, best: 0, gamesWon: 0 };
  try { Object.assign(S, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) {}
  if (S.heartsDay !== today()) { S.hearts = MAX_HEARTS; S.heartsDay = today(); }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };

  const level = () => Math.floor(S.xp / 100) + 1;
  const levelPct = () => (S.xp % 100);

  // ---------- 转场（iOS 风格：前进右进左出，返回反向，换题淡入） ----------
  const REDUCE = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const EASE = { out: 'cubic-bezier(.22,1,.36,1)', in: 'cubic-bezier(.5,0,.75,0)' };
  function setScreen(html, mode) {
    const old = screen.firstElementChild;
    let ghost = null;
    if (old && !REDUCE) {
      ghost = old.cloneNode(true);
      ghost.classList.add('screen-out');
      ghost.style.cssText += ';position:absolute;inset:0;z-index:3;background:#fbf6ec;padding:14px 18px 28px;display:flex;flex-direction:column;';
    }
    screen.innerHTML = html;
    if (ghost) {
      screen.appendChild(ghost);
      const to = mode === 'back' ? 'translateX(28px) scale(.985)' : mode === 'fwd' ? 'translateX(-28px) scale(.985)' : 'translateY(-8px)';
      const a = ghost.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: to }], { duration: 240, easing: EASE.in, fill: 'forwards' });
      a.onfinish = () => ghost.remove();
    }
    const el = screen.firstElementChild;
    if (el && !REDUCE) {
      const from = mode === 'back' ? 'translateX(-28px)' : mode === 'fwd' ? 'translateX(28px)' : 'translateY(12px)';
      el.animate([{ opacity: 0, transform: from }, { opacity: 1, transform: 'none' }], { duration: mode === 'fade' ? 320 : 440, easing: EASE.out, fill: 'both' });
    }
    return el;
  }
  function countUp(el, to, prefix, suffix) {
    if (!el) return;
    const t0 = performance.now(), d = REDUCE ? 0 : 900;
    const step = (t) => {
      const p = d ? Math.min(1, (t - t0) / d) : 1, e = 1 - Math.pow(1 - p, 4);
      el.textContent = (prefix || '') + Math.round(to * e) + (suffix || '');
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  const MARK_OK = '<svg class="mark" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  const MARK_NO = '<svg class="mark" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17"/></svg>';

  function refreshTop() {
    $('#pill-streak b').textContent = S.streak;
    $('#pill-xp b').textContent = S.xp;
    $('#pill-hearts b').textContent = S.hearts;
    $('#pill-hearts').style.opacity = S.hearts <= 1 ? '.55' : '1';
    $('#levelfill').style.width = levelPct() + '%';
    $('#levelfill').parentElement.title = `Level ${level()} · ${levelPct()}/100 to next`;
  }

  // ---------- 工具 ----------
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const sample = (arr, n) => shuffle(arr).slice(0, n);
  const other = (arr, n, not) => sample(arr.filter(x => x !== not), n);
  const esc = (s) => String(s).replace(/[&<>\"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  let zhVoice = null;
  function pickVoice() {
    const vs = speechSynthesis.getVoices();
    zhVoice = vs.find(v => /zh[-_]CN/i.test(v.lang)) || vs.find(v => /^zh/i.test(v.lang)) || null;
  }
  function speak(text, rate, el) {
    if (!('speechSynthesis' in window)) return;
    pickVoice();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'zh-CN'; if (zhVoice) u.voice = zhVoice;
    u.rate = rate || 0.75;
    const stop = () => { if (el) el.classList.remove('speaking'); };
    u.onstart = () => { if (el) el.classList.add('speaking'); };
    u.onend = stop; u.onerror = stop;
    speechSynthesis.cancel();
    stop();
    speechSynthesis.speak(u);
  }
  if ('speechSynthesis' in window) speechSynthesis.onvoiceschanged = pickVoice;

  function confetti() {
    const colors = ['#d7263d', '#f2b531', '#1b998b', '#2e86de', '#7b4cb3'];
    for (let i = 0; i < 36; i++) {
      const el = document.createElement('div');
      el.className = 'confetti';
      el.style.left = Math.random() * 100 + 'vw';
      el.style.background = colors[i % colors.length];
      el.style.animationDelay = (Math.random() * 0.8) + 's';
      el.style.animationDuration = (2 + Math.random() * 1.6) + 's';
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 4500);
    }
  }
  const vibrate = (ms) => { if (navigator.vibrate) navigator.vibrate(ms); };

  // ---------- 首页 ----------
  function home(mode) {
    refreshTop();
    const w = WORDS[yday() % WORDS.length];
    const review = Object.keys(S.boxes).filter(k => S.boxes[k] === 0).slice(0, 8);
    const reviewHtml = review.length
      ? review.map(k => { const [zh, en] = k.split('|'); return `<span class="chip"><span class="zh">${esc(zh)}</span><span class="en">${esc(en)}</span></span>`; }).join('')
      : '<span class="muted">Nothing yet. Miss a word and it lands here for review.</span>';
    const html = `
      <div class="screen-in">
        <div class="hero">
          <h1>5 minutes a day.<br>中文 comes easy.<small>Level ${level()} · ${S.games} games played</small></h1>
          <div class="big">${esc(w.h[0])}</div>
        </div>
        <div class="wotd">
          <div class="zi" id="wotd-z">${esc(w.h)}</div>
          <div class="meta">
            <div class="k">Word of the day</div>
            <div class="p">${esc(w.p)}</div>
            <div class="e">${esc(w.e)}</div>
          </div>
          <button class="speak" id="wotd-spk" aria-label="hear it">🔊</button>
        </div>
        <div class="games">
          <button class="game c1" data-g="tone"><div class="ic">声</div><div class="n">Tone Trainer</div><div class="d">mā? má? mǎ? Hear the difference.</div><div class="go">▶</div></button>
          <button class="game c2" data-g="meaning"><div class="ic">词</div><div class="n">Word Match</div><div class="d">95 core words, meanings by feel.</div><div class="go">▶</div></button>
          <button class="game c3" data-g="radical"><div class="ic">部</div><div class="n">Radical Quest</div><div class="d">Unlock characters through their parts.</div><div class="go">▶</div></button>
          <button class="game c4" data-g="sentence"><div class="ic">句</div><div class="n">Build a Sentence</div><div class="d">Tap the bricks, speak Chinese.</div><div class="go">▶</div></button>
        </div>
        <div class="section-t">Your record</div>
        <div class="stats">
          <div class="stat"><div class="v">${S.streak}</div><div class="l">day streak</div></div>
          <div class="stat"><div class="v">${S.best}</div><div class="l">best combo</div></div>
          <div class="stat"><div class="v">${S.gamesWon}</div><div class="l">perfect games</div></div>
        </div>
        <div class="section-t">To review</div>
        <div class="review-list">${reviewHtml}</div>
      </div>`;
    setScreen(html, mode === 'fwd' ? 'fwd' : 'back');
    $('#wotd-spk').onclick = () => speak(w.h, 0.75, $('#wotd-spk'));
    $('#wotd-z').onclick = () => speak(w.h, 0.75, $('#wotd-spk'));
    document.querySelectorAll('.game').forEach(b => b.onclick = () => startGame(b.dataset.g));
  }

  // ---------- 出题 ----------
  const srsKey = (zh, en) => zh + '|' + en;
  function pickWords(n) {
    const scored = WORDS.map(w => ({ w, b: S.boxes[srsKey(w.h, w.e)] ?? 0 }));
    scored.sort((a, b) => a.b - b.b || Math.random() - 0.5);
    return sample(scored.slice(0, Math.min(24, scored.length)), n).map(x => x.w);
  }
  function stripTone(p) { return p.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/u:/g, 'ü'); }

  function build(type) {
    const qs = [];
    if (type === 'meaning') {
      pickWords(PER_GAME).forEach(w => {
        const opts = shuffle([w.e, ...other(WORDS.map(x => x.e), 3, w.e)]);
        qs.push({ kind: 'meaning', word: w, prompt: { k: 'What does this mean?', zh: w.h, py: w.p, speak: w.h }, options: opts.map(o => ({ label: esc(o) })), answer: opts.indexOf(w.e),
          ok: `<span class="zh">${esc(w.h)}</span> · ${esc(w.p)} = “${esc(w.e)}”`, no: `Not quite. <span class="zh">${esc(w.h)}</span> (${esc(w.p)}) means “${esc(w.e)}”.` });
      });
    } else if (type === 'tone') {
      const groups = [];
      for (let i = 0; i < TONES.length; i += 4) groups.push(TONES.slice(i, i + 4));
      // 每局 8 题：先随机抽 6 组，再补 2 组；每题从该组的 4 个声调里随机一个
      sample(groups, Math.min(PER_GAME, groups.length)).concat(sample(groups, PER_GAME - Math.min(PER_GAME, groups.length))).slice(0, PER_GAME).forEach(g => {
        const t = g[Math.floor(Math.random() * 4)];
        qs.push({ kind: 'tone', word: { h: t.h, p: t.p, e: t.e }, prompt: { k: 'Listen · which tone is it?', bigpy: stripTone(t.p), speak: t.h },
          options: g.map((x, n) => ({ label: `<span class="py">${esc(x.p)}</span><span class="tl">tone ${n + 1}</span>` })), answer: t.t - 1,
          ok: `<span class="zh">${esc(t.h)}</span> ${esc(t.p)} is tone ${t.t} · “${esc(t.e)}”`, no: `It's tone ${t.t}: <span class="zh">${esc(t.h)}</span> ${esc(t.p)} · “${esc(t.e)}”`,
          extra: g.map(x => `${esc(x.p)} <small>${esc(x.e)}</small>`).join(' &nbsp; ') });
      });
    } else if (type === 'radical') {
      sample(RADICALS, PER_GAME).forEach(r => {
        const opts = shuffle([r, ...other(RADICALS, 3, r)]);
        qs.push({ kind: 'radical', word: { h: r.r, p: '', e: r.e }, prompt: { k: 'Which radical means', zh: `“${r.e}”` },
          options: opts.map(o => ({ label: `<span class="zh">${esc(o.r)}</span>` })), answer: opts.indexOf(r),
          ok: `<span class="zh">${esc(r.r)}</span> = ${esc(r.e)} &nbsp;·&nbsp; ${esc(r.x)}`, no: `“${esc(r.e)}” is <span class="zh">${esc(r.r)}</span> &nbsp;·&nbsp; ${esc(r.x)}` });
      });
    } else {
      sample(SENTENCES, PER_GAME).forEach(s => {
        qs.push({ kind: 'sentence', word: { h: s.h, p: '', e: s.e }, sentence: s });
      });
    }
    return qs;
  }

  // ---------- 游戏流程 ----------
  let G = null;
  function startGame(type) {
    if (S.hearts <= 0) return outOfHearts();
    G = { type, qs: build(type), i: 0, correct: 0, combo: 0, maxCombo: 0, xp: 0, locked: false };
    renderQ();
  }

  function head(title) {
    const pct = (G.i / G.qs.length) * 100;
    return `<div class="ghead"><button class="back" id="g-back" aria-label="quit">✕</button><div class="gtitle">${title}</div><div class="gcount">${G.i + 1} / ${G.qs.length}</div></div>
      <div class="pbar"><div class="pfill" style="width:${pct}%"></div></div>
      <div class="combo" id="combo"></div>`;
  }
  const TITLES = { tone: 'Tone Trainer', meaning: 'Word Match', radical: 'Radical Quest', sentence: 'Build a Sentence' };

  function renderQ() {
    const q = G.qs[G.i];
    let html = head(TITLES[G.type]) + '<div class="screen-in">';
    if (q.kind === 'sentence') {
      html += `<div class="prompt"><div class="k">Tap the bricks in order</div><div class="hint">${esc(q.sentence.e)}</div></div>
        <div class="slots" id="slots"><span class="ph">your sentence…</span></div>
        <div class="bank" id="bank">${shuffle(q.sentence.w.concat(sample(['吗', '很', '不', '我', '你', '的', '了'], 2).filter(x => !q.sentence.w.includes(x)))).map(t => `<button class="tok" data-t="${esc(t)}">${esc(t)}</button>`).join('')}</div>
        <button class="check" id="check" disabled>Check</button><button class="undo" id="undo">Undo last</button><div id="fx"></div>`;
    } else {
      const p = q.prompt;
      html += `<div class="prompt"><div class="k">${p.k}</div>`;
      if (p.zh) html += `<div class="zh">${esc(p.zh)}</div>`;
      if (p.py) html += `<div class="py">${esc(p.py)}</div>`;
      if (p.bigpy) html += `<div class="bigpy">${esc(p.bigpy)}</div><button class="bigplay" id="play" aria-label="play">▶</button>`;
      if (p.speak && p.zh) html += `<div class="autoplay"><button id="spk">🔊 hear it</button></div>`;
      html += `</div><div class="opts ${q.kind === 'radical' ? 'two' : ''}" id="opts">${q.options.map((o, i) => `<button class="opt" data-i="${i}">${o.label}</button>`).join('')}</div><div id="fx"></div>`;
    }
    html += '</div>';
    setScreen(html, G.i === 0 ? 'fwd' : 'fade');
    refreshTop();
    $('#g-back').onclick = () => { if ('speechSynthesis' in window) speechSynthesis.cancel(); home('back'); };
    if (q.kind === 'sentence') return wireSentence(q);
    if (q.prompt.speak) {
      const go = () => speak(q.prompt.speak, 0.75, $('#play') || $('#spk'));
      const pb = $('#play'); if (pb) pb.onclick = go;
      const sb = $('#spk'); if (sb) sb.onclick = go;
      go(); // 进入题目自动朗读
    }
    document.querySelectorAll('.opt').forEach(b => b.onclick = () => choose(q, Number(b.dataset.i), b));
  }

  function comboText() {
    const c = $('#combo'); if (!c) return;
    c.textContent = G.combo >= 2 ? `🔥 ${G.combo} in a row · ×${mult()} XP` : '';
    c.classList.remove('pop'); void c.offsetWidth; c.classList.add('pop');
  }
  const mult = () => G.combo >= 10 ? 3 : G.combo >= 5 ? 2 : 1;

  function choose(q, i, btn) {
    if (G.locked) return; G.locked = true;
    const ok = i === q.answer;
    document.querySelectorAll('.opt').forEach(b => {
      const k = Number(b.dataset.i);
      if (k === q.answer) { b.classList.add('ok'); b.insertAdjacentHTML('afterbegin', MARK_OK); }
      else if (k === i) { b.classList.add('no'); b.insertAdjacentHTML('afterbegin', MARK_NO); }
      else b.classList.add('dim');
      b.disabled = true;
    });
    if (!ok) { btn.classList.add('shake'); }
    settle(q, ok);
  }

  function settle(q, ok, customOk) {
    let gain = 0;
    if (ok) {
      G.combo++; G.maxCombo = Math.max(G.maxCombo, G.combo);
      gain = 10 * mult();
      G.xp += gain; G.correct++;
      vibrate(15);
    } else {
      G.combo = 0;
      S.hearts = Math.max(0, S.hearts - 1);
      vibrate([60, 40, 60]);
    }
    // SRS：答对升一级，答错回到 0 级（首页「To review」优先展示）
    const key = srsKey(q.word.h, q.word.e);
    if (ok) S.boxes[key] = Math.min(5, (S.boxes[key] ?? 0) + 1); else S.boxes[key] = 0;
    save(); refreshTop(); comboText();
    const fx = $('#fx');
    fx.innerHTML = `<div class="feedback ${ok ? '' : 'bad'}"><div class="fk">${ok ? 'Nice! +' + gain + ' XP' : 'Missed it'}</div><div class="fb">${ok ? (customOk || q.ok) : q.no}${q.extra ? `<div class="muted" style="margin-top:8px">${q.extra}</div>` : ''}</div></div>
      <button class="next ${ok ? '' : 'red'}" id="next">${ok ? 'Continue' : 'Got it'}</button>`;
    $('#next').onclick = next;
    if (ok) speak(q.word.h, 0.75, $('#play') || $('#spk'));
  }

  function next() {
    G.i++; G.locked = false;
    if (G.i >= G.qs.length) return finish();
    if (S.hearts <= 0) return outOfHearts(true);
    renderQ();
  }

  // 连词成句
  function wireSentence(q) {
    const picked = [];
    const slots = $('#slots'), bank = $('#bank'), check = $('#check');
    const redraw = () => {
      slots.innerHTML = picked.length ? picked.map(t => `<span class="tok">${esc(t)}</span>`).join('') : '<span class="ph">your sentence…</span>';
      check.disabled = picked.length === 0;
    };
    bank.querySelectorAll('.tok').forEach(b => b.onclick = () => {
      if (b.classList.contains('used') || G.locked) return;
      b.classList.add('used'); picked.push(b.dataset.t); redraw(); vibrate(8);
    });
    $('#undo').onclick = () => {
      if (G.locked) return;
      const last = picked.pop(); if (!last) return;
      const b = [...bank.querySelectorAll('.tok')].reverse().find(x => x.dataset.t === last && x.classList.contains('used'));
      if (b) b.classList.remove('used'); redraw();
    };
    check.onclick = () => {
      if (G.locked) return; G.locked = true;
      const ok = picked.join('|') === q.sentence.w.join('|');
      if (!ok) slots.classList.add('shake');
      const customOk = `<span class="zh">${esc(q.sentence.h)}</span> — “${esc(q.sentence.e)}”`;
      if (!ok) {
        // 展示正确顺序
        slots.innerHTML = q.sentence.w.map(t => `<span class="tok" style="border-color:#1b998b">${esc(t)}</span>`).join('');
        q.no = `The right order is <span class="zh">${esc(q.sentence.h)}</span> — “${esc(q.sentence.e)}”`;
      }
      settle(q, ok, customOk);
    };
  }

  function outOfHearts(midGame) {
    save();
    const html = `<div class="screen-in result">
      <div class="rt">Out of hearts</div><div class="rh">💔 That's it for today</div>
      <div class="rs">${midGame ? `You were on question ${G ? G.i + 1 : 1}. ` : ''}Hearts refill at midnight. Come back tomorrow — your streak is counting on you.</div>
      <div class="xp">${S.xp}</div><div class="xpl">total xp · level ${level()}</div>
      <div class="hearts-note">Tip: a perfect round (8/8) earns you a bonus heart. ❤️</div>
      <button class="again" id="h">Back to home</button></div>`;
    setScreen(html, 'fwd');
    $('#h').onclick = () => home('back');
  }

  function finish() {
    const total = G.qs.length, acc = Math.round(G.correct / total * 100);
    const perfect = G.correct === total;
    // 连续打卡
    if (S.lastDay !== today()) { S.streak = S.lastDay === yesterday() ? S.streak + 1 : 1; S.lastDay = today(); }
    S.xp += G.xp; S.games++; S.best = Math.max(S.best, G.maxCombo);
    if (perfect) { S.gamesWon++; S.hearts = Math.min(MAX_HEARTS, S.hearts + 1); }
    save();
    const rank = perfect ? ['Flawless', 'Not a single miss. You are built for this.'] : acc >= 75 ? ['Strong round', 'A couple of slips — review them below.'] : acc >= 50 ? ['Getting there', 'Half the round is yours. One more go?'] : ['Warm-up done', 'Hard round. The words you missed are queued for review.'];
    const badges = [perfect ? '<span class="badge">★ Perfect</span>' : '', G.maxCombo >= 10 ? '<span class="badge">🔥 10 combo</span>' : G.maxCombo >= 5 ? '<span class="badge">🔥 5 combo</span>' : '', perfect ? '<span class="badge">❤️ +1 heart</span>' : ''].join('');
    const html = `<div class="screen-in result">
      <div class="rt">${TITLES[G.type]} · complete</div>
      <div class="rh">${rank[0]}</div><div class="rs">${rank[1]}</div>
      <div class="xp">+${G.xp}</div><div class="xpl">xp earned · level ${level()}</div>
      <div class="grid">
        <div class="stat"><div class="v jade">${acc}%</div><div class="l">accuracy</div></div>
        <div class="stat"><div class="v gold">${G.maxCombo}</div><div class="l">best combo</div></div>
        <div class="stat"><div class="v">${S.streak}</div><div class="l">day streak</div></div>
      </div>
      <div class="badges">${badges}</div>
      <button class="again" id="a">Play again</button>
      <button class="ghost" id="h">Home</button></div>`;
    setScreen(html, 'fwd');
    countUp($('.result .xp'), G.xp, '+');
    countUp($('.result .grid .stat .v'), acc, '', '%');
    $('#a').onclick = () => startGame(G.type);
    $('#h').onclick = () => home('back');
    refreshTop();
    if (perfect) confetti();
    if (perfect) speak('太棒了');
  }

  home();
})();
