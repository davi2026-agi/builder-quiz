'use strict';
function wireCommon() {
  const sw = $('#hd-switch'); if (sw) sw.onclick = openProjects;
  $$('.li').forEach(el => { if (el.dataset.open) el.onclick = () => el.dataset.open === 'log' ? openLogDetail(el.dataset.id) : el.dataset.open === 'check' ? openFix(el.dataset.id) : null; });
}

/* 首页 */
function vHome() {
  const p = cur();
  if (!p) return `<div class="empty">还没有工地。<br>点右上角「切换工地」新建一个。</div>`;
  const t = today(), m0 = monthStart(t);
  const logs = S.logs.filter(l => l.pid === p.id);
  const todayLog = logs.find(l => l.date === t);
  const attT = S.att.filter(a => a.pid === p.id && a.date === t).reduce((s, a) => s + num(a.days), 0);
  const mLabor = S.att.filter(a => a.pid === p.id && a.date >= m0)
    .reduce((s, a) => s + num(a.days) * rateOf(a.wid), 0);
  const mOut = S.moves.filter(m => m.pid === p.id && m.type === 'out' && m.date >= m0)
    .reduce((s, m) => s + num(m.qty) * priceOf(m), 0);
  const mLogs = logs.filter(l => l.date >= m0).length;
  const mAtt = S.att.filter(a => a.pid === p.id && a.date >= m0).reduce((s, a) => s + num(a.days), 0);
  const open = S.checks.filter(c => c.pid === p.id && c.result === 'bad' && !c.fixedAt);
  const lows = lowMats(p.id);

  const openHtml = open.length
    ? open.slice(0, 3).map(c => `<div class="li" data-open="check" data-id="${c.id}">
        <div class="r1"><span class="t">${esc(c.itemName)}</span><span class="badge bad">待整改</span></div>
        <div class="r2">${esc(c.note || '未填写描述')}${c.due ? `　·　期限 ${fmtD(c.due)}` : ''}</div>
        <div class="r3"><span>${fmtD2(c.date)}</span>${c.photos && c.photos.length ? `<span>📷 ${c.photos.length}</span>` : ''}</div>
      </div>`).join('')
    : `<div class="empty" style="padding:18px">没有待整改隐患 👍</div>`;

  const lowHtml = lows.length
    ? lows.slice(0, 3).map(m => `<div class="li" onclick=""><div class="r1"><span class="t">${esc(m.name)}</span><span class="badge bad">低于安全库存</span></div>
        <div class="r3"><span>现存 ${stock(p.id, m.id)} ${esc(m.unit)}</span><span>安全库存 ${esc(m.safe)} ${esc(m.unit)}</span></div></div>`).join('')
    : `<div class="empty" style="padding:18px">库存都在安全线以上</div>`;

  return `
  <div class="today">
    <div class="l">
      <div class="t">${fmtD2(t)} · ${todayLog ? '日志已写' : '还没写施工日志'}</div>
      <div class="s">今日出勤 ${attT ? attT + ' 工日' : '未记考勤'}<button type="button" class="lnk" id="quick-att">${attT ? '记工 ›' : '点这里记工 ›'}</button></div>
    </div>
    ${todayLog ? `<button class="done" id="see-log">查看</button>` : `<button class="go" id="new-log">去写日志</button>`}
  </div>
  <div class="sec"><h2>本月概览</h2><span class="more">${t.slice(0, 7)}</span></div>
  <div class="kpi">
    <div class="k"><div class="v">${mLogs}<small>天</small></div><div class="l">施工日志</div></div>
    <div class="k"><div class="v">${mAtt % 1 ? mAtt.toFixed(1) : mAtt}<small>工日</small></div><div class="l">出勤</div></div>
    <div class="k ${open.length ? 'hot' : 'good'}"><div class="v">${open.length}<small>项</small></div><div class="l">待整改隐患</div></div>
  </div>
  <div class="sec"><h2>快速记录</h2></div>
  <div class="qa">
    <button id="q-log"><div class="ic" style="background:#ff6a13">记</div><div><div class="n">施工日志</div><div class="d">完成、人数、照片</div></div></button>
    <button id="q-in"><div class="ic" style="background:#0f766e">入</div><div><div class="n">材料入库</div><div class="d">收货、过磅、单价</div></div></button>
    <button id="q-out"><div class="ic" style="background:#1d4ed8">领</div><div><div class="n">材料领用</div><div class="d">班组领料、扣库存</div></div></button>
    <button id="q-check"><div class="ic" style="background:#b91c1c">检</div><div><div class="n">安全巡检</div><div class="d">隐患拍照、限期整改</div></div></button>
  </div>
  <div class="sec"><h2>待整改隐患</h2><span class="more" onclick="0">共 ${open.length} 项</span></div>
  ${openHtml}
  <div class="sec"><h2>低库存提醒</h2></div>
  ${lowHtml}
  <div class="sec"><h2>本月费用</h2></div>
  <div class="card" style="display:flex;gap:10px;text-align:center">
    <div style="flex:1"><div class="mid">${money(mLabor)}</div><div class="muted">人工费</div></div>
    <div style="width:1px;background:var(--line)"></div>
    <div style="flex:1"><div class="mid">${money(mOut)}</div><div class="muted">材料领用</div></div>
  </div>`;
}

function wireHome() {
  const n = $('#new-log'); if (n) n.onclick = () => openLog();
  const s = $('#see-log'); if (s) s.onclick = () => { route = 'logs'; render(); };
  const qa = $('#quick-att'); if (qa) qa.onclick = openAtt;
  const q = { 'q-log': () => openLog(), 'q-in': () => openMove('in'), 'q-out': () => openMove('out'), 'q-check': openCheck };
  Object.keys(q).forEach(id => { const b = document.getElementById(id); if (b) b.onclick = q[id]; });
}

/* 日志 */
function vLogs() {
  const p = cur();
  const list = S.logs.filter(l => l.pid === p.id).sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  const body = list.length ? list.map(l => `
    <div class="li" data-open="log" data-id="${l.id}">
      <div class="r1"><span class="t">${fmtD2(l.date)}${l.date === today() ? ' · 今天' : ''}</span>
        <span class="tag">${esc(l.weather || '—')}${l.temp ? ' ' + esc(l.temp) + '℃' : ''}</span></div>
      <div class="r2">${esc(l.part || '未填部位')}　出勤 ${num(l.people)} 人</div>
      <div class="r2">${esc((l.done || '').slice(0, 80))}${(l.done || '').length > 80 ? '…' : ''}</div>
      <div class="r3">${l.photos && l.photos.length ? `<span>📷 ${l.photos.length} 张</span>` : '<span>无照片</span>'}${l.issues ? '<span class="tag warn">有问题</span>' : ''}</div>
    </div>`).join('') : `<div class="empty">还没有日志。<br>点右下角「+」写第一条，手机上 1 分钟能录完。</div>`;

  const ws = weekStart(today()), we = addD(ws, 6);
  return `
  <div class="sec"><h2>施工日志</h2><span class="more" id="week-report">生成本周周报 ›</span></div>
  <div class="card" style="display:flex;align-items:center;justify-content:space-between;gap:10px">
    <div><div style="font-size:13.5px;font-weight:800">本周 ${fmtD(ws)} - ${fmtD(we)}</div>
    <div class="muted">共 ${S.logs.filter(l => l.pid === p.id && l.date >= ws && l.date <= we).length} 篇日志</div></div>
    <button class="btn sm primary" id="week-report2">周报</button>
  </div>
  ${body}
  <button class="fab" id="fab">+</button>`;
}

/* 材料 */
function vMats() {
  const p = cur();
  const stockHtml = S.mats.map(m => {
    const q = stock(p.id, m.id), safe = num(m.safe), used = hasFlow(p.id, m.id), low = used && q < safe;
    const badge = !used ? '<span class="badge grey">待入库</span>' : low ? '<span class="badge bad">偏低</span>' : '<span class="badge ok">正常</span>';
    return `<div class="li mat">
      <div class="r1"><span class="t">${esc(m.name)}</span>${badge}</div>
      <div class="mrow">
        <span class="stk">${q % 1 ? q.toFixed(1) : q}<small>${esc(m.unit)}</small></span>
        <span class="muted">安全 ${safe}${esc(m.unit)} · ${money(m.price)}</span>
        <span class="mbtn"><button data-in="${m.id}">入库</button><button data-out="${m.id}">领用</button></span>
      </div>
    </div>`;
  }).join('');

  const flow = S.moves.filter(m => m.pid === p.id).sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)).slice(0, 40);
  const flowHtml = flow.length ? flow.map(m => {
    const mt = matOf(m.matId);
    const inOut = m.type === 'in' ? ['入库', 'ok'] : m.type === 'out' ? ['领用', 'bad'] : ['退库', 'warn'];
    return `<div class="li" data-dm="${m.id}">
      <div class="r1"><span class="t">${esc(mt.name)}</span><span class="tag ${inOut[1]}">${inOut[0]}</span></div>
      <div class="r2">${num(m.qty)} ${esc(mt.unit)}　${money(num(m.qty) * priceOf(m))}${m.party ? '　' + esc(m.party) : ''}</div>
      <div class="r3"><span>${fmtD2(m.date)}</span>${m.note ? `<span>${esc(m.note)}</span>` : ''}</div>
    </div>`;
  }).join('') : `<div class="empty">还没有流水记录。</div>`;

  return `
  <div class="tabs"><button id="t-stock" class="${matTab === 'stock' ? 'on' : ''}">库存</button><button id="t-flow" class="${matTab === 'flow' ? 'on' : ''}">流水</button></div>
  <div class="sec"><h2>${matTab === 'stock' ? '材料库存' : '出入库流水'}</h2>
    <span class="more" id="add-mat">+ 新增材料</span></div>
  ${matTab === 'stock' ? stockHtml : flowHtml}
  <div style="height:10px"></div>
  <div class="row-btns" style="margin-top:14px">
    <button class="btn dark" id="b-in">材料入库</button>
    <button class="btn primary" id="b-out">材料领用</button>
  </div>`;
}
