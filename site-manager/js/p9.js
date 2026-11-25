'use strict';
/* ---------- 备份 ---------- */
function doBackup() {
  const stamp = today().replace(/-/g, '');
  download(`工地小管家备份_${stamp}.json`, JSON.stringify(S), 'application/json');
  toast('备份已导出');
}
function doRestore() {
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = '.json,application/json';
  inp.style.cssText = 'position:fixed;left:-9999px';
  document.body.appendChild(inp);
  inp.onchange = () => {
    const f = inp.files && inp.files[0]; if (!f) return inp.remove();
    const rd = new FileReader();
    rd.onload = () => {
      try {
        const d = JSON.parse(rd.result);
        if (!d || !Array.isArray(d.projects) || !d.projects.length) throw new Error('bad');
        S = d;
        ['mats', 'items', 'workers', 'logs', 'moves', 'checks', 'att'].forEach(k => { if (!Array.isArray(S[k])) S[k] = []; });
        if (!S.cur || !S.projects.some(p => p.id === S.cur)) S.cur = S.projects[0].id;
        save(); render(); toast('已恢复');
      } catch (e) { toast('文件不对，恢复失败'); }
      inp.remove();
    };
    rd.readAsText(f);
  };
  inp.click();
}

/* ---------- 示例数据 ---------- */
function loadDemo() {
  ask('载入示例数据？会追加到当前数据里。', '载入', () => {
    const p = cur(), t = today();
    ['w1', 'w2', 'w3'].forEach((id, i) => {
      if (!S.workers.some(w => w.id === id)) S.workers.push({ id, name: ['张师傅', '李师傅', '王师傅'][i], team: ['木工班', '钢筋班', '瓦工班'][i], rate: [320, 350, 300][i] });
    });
    S.logs.push({
      id: uid('l'), pid: p.id, date: addD(t, -1), weather: '晴', temp: '12', people: 12,
      part: '主体结构·3#楼三层顶板', done: '三层顶板模板支设完成 480㎡；钢筋绑扎完成 60%。', plan: '继续顶板钢筋绑扎，预计下午验收。', issues: '钢筋到货晚了一天，需催供应商。', photos: []
    });
    S.moves.push({ id: uid('mv'), pid: p.id, type: 'in', matId: 'm1', qty: 20, price: 415, party: '宏大商砼', date: addD(t, -2), note: '票号 0012' });
    S.moves.push({ id: uid('mv'), pid: p.id, type: 'out', matId: 'm1', qty: 8, price: 420, party: '泥工班', date: addD(t, -1), note: '' });
    S.moves.push({ id: uid('mv'), pid: p.id, type: 'out', matId: 'm5', qty: 120, price: 48, party: '木工班', date: t, note: '三层顶板' });
    S.checks.push({ id: uid('ck'), pid: p.id, date: t, itemId: 'c2', itemName: '临边洞口防护', result: 'bad', note: '3#楼三层东侧临边缺 2 处护栏', due: addD(t, 2), photos: [], fixedAt: null, fixNote: '', fixPhotos: [] });
    S.att.push({ id: uid('a'), pid: p.id, wid: 'w1', days: 1, date: t });
    S.att.push({ id: uid('a'), pid: p.id, wid: 'w2', days: 1, date: t });
    save(); render(); toast('示例数据已载入');
  });
}

/* ---------- 路由 ---------- */
$$('.tabbar button').forEach(b => b.onclick = () => { route = b.dataset.r; render(); window.scrollTo(0, 0); });

const _render = render;
render = function () {
  _render();
  if (route === 'home') wireHome();
  if (route === 'logs') {
    const a = $('#week-report'), c = $('#week-report2');
    if (a) a.onclick = showWeekly;
    if (c) c.onclick = showWeekly;
  }
  if (route === 'mats') wireMats();
  if (route === 'checks') wireChecks();
  if (route === 'more') wireMore();
};

render();

/* service worker：信号差也能打开（仅 https） */
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}

/* 测试/调试入口 */
window.__SM = { get state() { return S; }, render, today, today2: () => today() };
