'use strict';
function wireMats() {
  $('#t-stock').onclick = () => { matTab = 'stock'; render(); };
  $('#t-flow').onclick = () => { matTab = 'flow'; render(); };
  $('#add-mat').onclick = openMat;
  $('#b-in').onclick = () => openMove('in');
  $('#b-out').onclick = () => openMove('out');
  $$('[data-in]').forEach(b => b.onclick = () => openMove('in', b.dataset.in));
  $$('[data-out]').forEach(b => b.onclick = () => openMove('out', b.dataset.out));
  $$('[data-dm]').forEach(el => el.onclick = () => {
    const m = S.moves.find(x => x.id === el.dataset.dm); if (!m) return;
    ask(`删除这条${m.type === 'in' ? '入库' : '领用'}记录？`, '删除', () => {
      S.moves = S.moves.filter(x => x.id !== m.id); save(); render(); toast('已删除');
    });
  });
}

/* 巡检 */
function vChecks() {
  const p = cur();
  const all = S.checks.filter(c => c.pid === p.id).sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  const bad = all.filter(c => c.result === 'bad');
  const openBad = bad.filter(c => !c.fixedAt);
  let list = all;
  if (checkFilter === 'open') list = openBad;
  else if (checkFilter === 'fixed') list = bad.filter(c => c.fixedAt);
  else if (checkFilter === 'ok') list = all.filter(c => c.result === 'ok');

  const cards = list.length ? list.map(c => {
    if (c.result === 'ok') {
      return `<div class="li"><div class="r1"><span class="t">${esc(c.itemName)}</span><span class="badge ok">合格</span></div>
        <div class="r3"><span>${fmtD2(c.date)}</span>${c.note ? `<span>${esc(c.note)}</span>` : ''}</div></div>`;
    }
    return `<div class="li" data-open="check" data-id="${c.id}">
      <div class="r1"><span class="t">${esc(c.itemName)}</span>
        <span class="badge ${c.fixedAt ? 'ok' : 'bad'}">${c.fixedAt ? '已整改' : '待整改'}</span></div>
      <div class="r2">${esc(c.note || '未填写描述')}</div>
      <div class="r3"><span>${fmtD2(c.date)}</span>${c.due ? `<span>期限 ${fmtD(c.due)}</span>` : ''}${c.fixedAt ? `<span>整改 ${fmtD(c.fixedAt.slice(0, 10))}</span>` : '<span class="tag bad">点击整改</span>'}</div>
      ${photoRow(c.photos)}${c.fixPhotos && c.fixPhotos.length ? photoRow(c.fixPhotos) : ''}
    </div>`;
  }).join('') : `<div class="empty">这个筛选下没有记录。</div>`;

  return `
  <div class="sec"><h2>安全质量巡检</h2><span class="more">${openBad.length} 项待整改</span></div>
  <div class="card" style="display:flex;gap:10px;text-align:center">
    <div style="flex:1"><div class="mid">${all.filter(c => c.date >= monthStart(today())).length}</div><div class="muted">本月检查项</div></div>
    <div style="width:1px;background:var(--line)"></div>
    <div style="flex:1"><div class="mid" style="color:var(--bad)">${openBad.length}</div><div class="muted">待整改</div></div>
    <div style="width:1px;background:var(--line)"></div>
    <div style="flex:1"><div class="mid" style="color:var(--ok)">${bad.length ? Math.round(bad.filter(c => c.fixedAt).length / bad.length * 100) : 100}%</div><div class="muted">整改率</div></div>
  </div>
  <div class="chips" style="margin-top:12px">
    <button class="chip ${checkFilter === 'open' ? 'on' : ''}" data-f="open">待整改 ${openBad.length}</button>
    <button class="chip ${checkFilter === 'fixed' ? 'on' : ''}" data-f="fixed">已整改</button>
    <button class="chip ${checkFilter === 'ok' ? 'on' : ''}" data-f="ok">合格记录</button>
    <button class="chip ${checkFilter === 'all' ? 'on' : ''}" data-f="all">全部</button>
  </div>
  ${cards}
  <button class="fab" id="fab-checks">+</button>`;
}

function wireChecks() {
  $$('.chip[data-f]').forEach(b => b.onclick = () => { checkFilter = b.dataset.f; render(); });
}

/* 更多 */
function vMore() {
  const p = cur();
  const t = today(), m0 = monthStart(t);
  const att = S.att.filter(a => a.pid === p.id && a.date >= m0);
  const labor = att.reduce((s, a) => s + num(a.days) * rateOf(a.wid), 0);
  const days = att.reduce((s, a) => s + num(a.days), 0);
  const tAtt = S.att.filter(a => a.pid === p.id && a.date === t);

  const attList = tAtt.length ? tAtt.map(a => {
    const w = S.workers.find(x => x.id === a.wid) || { name: '（已删除）', team: '', rate: 0 };
    return `<div class="li"><div class="r1"><span class="t">${esc(w.name)}</span><span class="tag">${esc(w.team || '')}</span></div>
      <div class="r2">${num(a.days)} 工日 · ${money(num(a.days) * num(w.rate))}</div></div>`;
  }).join('') : `<div class="empty" style="padding:16px">今天还没记工。</div>`;

  const workers = S.workers.length ? S.workers.map(w => `<div class="li"><div class="r1"><span class="t">${esc(w.name)}</span><span class="tag">${esc(w.team || '未分组')}</span></div>
    <div class="r2">日工资 ${money(w.rate)}</div></div>`).join('') : `<div class="empty" style="padding:16px">还没有工人，先添加。</div>`;

  return `
  <div class="sec"><h2>班组考勤</h2><span class="more" id="add-att">+ 记工</span></div>
  <div class="card" style="display:flex;gap:10px;text-align:center">
    <div style="flex:1"><div class="mid">${days % 1 ? days.toFixed(1) : days}</div><div class="muted">本月工日</div></div>
    <div style="width:1px;background:var(--line)"></div>
    <div style="flex:1"><div class="mid">${money(labor)}</div><div class="muted">本月人工费</div></div>
  </div>
  ${attList}
  <div class="sec"><h2>工人 / 班组</h2><span class="more" id="add-worker">+ 添加</span></div>
  ${workers}
  <div class="sec"><h2>报表与导出</h2></div>
  <div class="row-btns">
    <button class="btn dark" id="month-report">月报文字</button>
    <button class="btn primary" id="csv">导出 CSV</button>
  </div>
  <div class="sec"><h2>数据</h2></div>
  <div class="row-btns">
    <button class="btn ghost" id="backup">备份</button>
    <button class="btn ghost" id="restore">恢复</button>
  </div>
  <div class="row-btns">
    <button class="btn ghost" id="demo">载入示例</button>
    <button class="btn danger" id="reset">清空</button>
  </div>
  <p class="muted" style="margin:16px 2px 0">数据只存在这台手机的浏览器里，换手机不会自动同步；照片也占本机存储，重要的另存一份。需要多人看同一份数据，后面接个后端即可。当前工地：${esc(p.name)}</p>`;
}
