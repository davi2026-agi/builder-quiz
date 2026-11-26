/* 照见 · 匿名计数
   口径：不采集生日、时辰、出生地；只上报页面访问、是否开始、是否算完、原型、五维分档。
   后端：Abacus（开源免注册计数服务），键存放在 zhaojian-2026 命名空间。
   非 github.io 域名不上报，本地调试只看 window.__tz.queue。
*/
'use strict';
(function () {
  const NS = 'zhaojian-2026';
  const API = 'https://abacus.jasoncameron.dev';
  const live = /^davi2026-agi\.github\.io$/.test(location.hostname);
  const Q = [];
  const SC = { 建造者: 'builder', 攻坚者: 'attacker', 协调者: 'coordinator', 感受者: 'feeler', 拓荒者: 'pioneer', 守望者: 'watcher', 托底者: 'anchor', 潜行者: 'stalker', 架构师: 'architect', 带队者: 'leader', 观察者: 'observer' };

  function hit(key) {
    Q.push(key);
    if (!live) return;
    try {
      fetch(API + '/hit/' + NS + '/' + key, { mode: 'cors', cache: 'no-store', keepalive: true }).catch(function () { });
    } catch (e) { }
  }
  function mark(k) {
    try { if (localStorage.getItem(k)) return false; localStorage.setItem(k, String(Date.now())); return true; } catch (e) { return false; }
  }

  hit('pageviews');
  if (mark('zj.uv')) hit('devices');
  if (mark('zj.first')) hit('firstvisit');

  document.addEventListener('click', function (e) {
    const t = e.target && e.target.closest ? e.target.closest('#start,#go') : null;
    if (!t) return;
    if (t.id === 'start') hit('starts');
    if (t.id === 'go') hit('tests');
  }, true);

  function onDone() {
    hit('completes');
    if (mark('zj.done')) hit('doneUsers');
    try {
      const R = window.__psy;
      if (!R || !R.fused) return;
      const name = R.arch && R.arch.name;
      const sk = SC[name];
      if (sk) hit('arch.' + sk);
      ['ord', 'drv', 'warm', 'open', 'grit'].forEach(function (k) {
        const v = R.fused.scores[k];
        hit('dim.' + k + '.' + (v >= 70 ? 'high' : v >= 45 ? 'mid' : 'low'));
      });
    } catch (e) { }
  }

  const _rr = window.renderResult;
  window.renderResult = function () {
    _rr();
    try {
      const d = document.querySelector('.disclaim');
      if (d && !d.dataset.tz) {
        d.dataset.tz = '1';
        d.insertAdjacentHTML('beforeend', '<br><br>统计只记匿名事件：页面访问、是否开始、是否算完、结果类型与五维分档。不采集你的生日、时辰与出生地，也不用于广告。');
      }
    } catch (e) { }
    onDone();
  };

  window.__tz = { queue: Q, live: live, ns: NS };
})();
