'use strict';
function showWeekly() {
  const txt = weeklyText();
  const w = sheet(`<div class="sh-t">本周周报</div><div class="sh-s">可直接复制发群里</div>
    <div class="rep" style="margin-top:10px">${esc(txt)}</div>
    <div class="row-btns"><button class="btn ghost" id="x">关闭</button><button class="btn primary" id="c">复制</button></div>`);
  w.querySelector('#x').onclick = w.close;
  w.querySelector('#c').onclick = () => copy(txt);
}

function monthText() {
  const p = cur(), t = today(), m0 = monthStart(t), m1 = monthEnd(t);
  const logs = S.logs.filter(l => l.pid === p.id && l.date >= m0 && l.date <= m1);
  const att = S.att.filter(a => a.pid === p.id && a.date >= m0 && a.date <= m1);
  const days = att.reduce((s, a) => s + num(a.days), 0);
  const labor = att.reduce((s, a) => s + num(a.days) * rateOf(a.wid), 0);
  const moves = S.moves.filter(m => m.pid === p.id && m.date >= m0 && m.date <= m1);
  const mIn = moves.filter(m => m.type === 'in'), mOut = moves.filter(m => m.type === 'out');
  const inAmt = mIn.reduce((s, m) => s + num(m.qty) * priceOf(m), 0);
  const outAmt = mOut.reduce((s, m) => s + num(m.qty) * priceOf(m), 0);
  const cks = S.checks.filter(c => c.pid === p.id && c.date >= m0 && c.date <= m1);
  const bad = cks.filter(c => c.result === 'bad');
  const fixed = bad.filter(c => c.fixedAt);
  const lows = lowMats(p.id);

  let s = `【月度小结】${p.name}\n${m0.slice(0, 7)}（${m0} ~ ${m1}）\n\n`;
  s += `一、施工日志：${logs.length} 天\n`;
  s += `二、出勤：${days % 1 ? days.toFixed(1) : days} 工日，人工费 ${money(labor)}\n`;
  s += `三、材料：入库 ${mIn.length} 笔 ${money(inAmt)}；领用 ${mOut.length} 笔 ${money(outAmt)}\n`;
  if (lows.length) s += `　　低库存：${lows.map(m => `${m.name}(${stock(p.id, m.id)}${m.unit})`).join('、')}\n`;
  s += `四、安全质量：巡检检查项 ${cks.length} 项，隐患 ${bad.length} 项，已整改 ${fixed.length} 项，整改率 ${bad.length ? Math.round(fixed.length / bad.length * 100) : 100}%\n`;
  const openBad = bad.filter(c => !c.fixedAt);
  if (openBad.length) s += `　　未闭环：${openBad.map(c => c.itemName).join('、')}\n`;
  const issues = logs.filter(l => l.issues).slice(-3);
  if (issues.length) {
    s += `\n五、主要问题\n`;
    issues.forEach(l => { s += `${fmtD(l.date)}：${l.issues.replace(/\n/g, '；')}\n`; });
  }
  const plan = (logs.slice(-1)[0] || {}).plan;
  if (plan) s += `\n六、下月计划\n${plan}\n`;
  return s;
}

function showMonthReport() {
  const txt = monthText();
  const w = sheet(`<div class="sh-t">本月小结</div><div class="sh-s">可直接复制发领导 / 群里</div>
    <div class="rep" style="margin-top:10px">${esc(txt)}</div>
    <div class="row-btns"><button class="btn ghost" id="x">关闭</button><button class="btn primary" id="c">复制</button></div>`);
  w.querySelector('#x').onclick = w.close;
  w.querySelector('#c').onclick = () => copy(txt);
}

function copy(text) {
  const ok = () => toast('已复制，去粘贴吧');
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(ok).catch(() => fallbackCopy(text, ok));
  } else fallbackCopy(text, ok);
}
function fallbackCopy(text, ok) {
  const ta = document.createElement('textarea');
  ta.value = text; ta.style.cssText = 'position:fixed;top:0;left:-9999px';
  document.body.appendChild(ta); ta.select();
  try { document.execCommand('copy'); ok(); } catch (e) { toast('复制失败，请长按文字手动复制'); }
  ta.remove();
}

/* ---------- 导出 ---------- */
function csvRows(rows) {
  return rows.map(r => r.map(v => {
    const s = String(v == null ? '' : v);
    return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }).join(',')).join('\r\n');
}
function download(name, text, mime) {
  const isCsv = !mime || mime.indexOf('csv') >= 0;
  const blob = new Blob([isCsv ? '\ufeff' + text : text], { type: (mime || 'text/csv') + ';charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1200);
}
function exportCsv() {
  const p = cur(), t = today(), m0 = monthStart(t), m1 = monthEnd(t);
  const logs = S.logs.filter(l => l.pid === p.id && l.date >= m0 && l.date <= m1).sort((a, b) => a.date < b.date ? -1 : 1);
  const moves = S.moves.filter(m => m.pid === p.id && m.date >= m0 && m.date <= m1).sort((a, b) => a.date < b.date ? -1 : 1);
  const cks = S.checks.filter(c => c.pid === p.id && c.date >= m0 && c.date <= m1).sort((a, b) => a.date < b.date ? -1 : 1);
  const att = S.att.filter(a => a.pid === p.id && a.date >= m0 && a.date <= m1).sort((a, b) => a.date < b.date ? -1 : 1);

  let out = '';
  out += `施工日志\r\n` + csvRows([['日期', '天气', '气温', '部位', '出勤人数', '今日完成', '明日计划', '存在问题']]
    .concat(logs.map(l => [l.date, l.weather, l.temp, l.part, l.people, l.done, l.plan, l.issues]))) + '\r\n\r\n';
  out += `材料流水\r\n` + csvRows([['日期', '类型', '材料', '数量', '单位', '单价', '金额', '供应商/班组', '备注']]
    .concat(moves.map(m => {
      const mt = matOf(m.matId);
      return [m.date, m.type === 'in' ? '入库' : m.type === 'out' ? '领用' : '退库', mt.name, num(m.qty), mt.unit, priceOf(m), num(m.qty) * priceOf(m), m.party, m.note];
    }))) + '\r\n\r\n';
  out += `安全质量巡检\r\n` + csvRows([['日期', '检查项', '结果', '描述', '整改期限', '整改完成', '整改说明']]
    .concat(cks.map(c => [c.date, c.itemName, c.result === 'ok' ? '合格' : '不合格', c.note, c.due, c.fixedAt || '', c.fixNote || '']))) + '\r\n\r\n';
  out += `考勤\r\n` + csvRows([['日期', '姓名', '班组', '工日', '日工资', '金额']]
    .concat(att.map(a => {
      const w = S.workers.find(x => x.id === a.wid) || { name: '', team: '', rate: 0 };
      return [a.date, w.name, w.team, num(a.days), num(w.rate), num(a.days) * num(w.rate)];
    })));
  download(`工地台账_${p.name}_${m0.slice(0, 7)}.csv`, out);
  toast('CSV 已导出，可在 Excel / WPS 打开');
}
