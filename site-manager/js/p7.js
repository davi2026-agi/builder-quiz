'use strict';
/* ---------- 考勤 ---------- */
function openWorker() {
  const w = sheet(`<div class="sh-t">添加工人</div>
    <form class="frm">
      ${F.text('name', '姓名 / 称呼', '', '如 张师傅')}
      ${F.text('team', '班组', '', '如 木工班')}
      ${F.num('rate', '日工资（元）', '', '0', '0.01')}
      <button class="btn primary" type="submit">保存</button>
    </form>`, {
    onMount: (sc) => {
      sc.querySelector('form').addEventListener('submit', (e) => {
        e.preventDefault();
        const o = {}; new FormData(e.target).forEach((v, k) => o[k] = v);
        if (!o.name.trim()) return toast('姓名不能为空');
        S.workers.push({ id: uid('w'), name: o.name.trim(), team: o.team || '', rate: num(o.rate) });
        save(); sc.close(); render(); toast('已添加');
      });
    }
  });
}
function openAtt() {
  if (!S.workers.length) {
    toast('先添加工人');
    return openWorker();
  }
  const p = cur();
  const opts = S.workers.map(w => ({ v: w.id, t: `${w.name}${w.team ? '（' + w.team + '）' : ''}` }));
  const w = sheet(`<div class="sh-t">记工</div>
    <div class="sh-s">${esc(p.name)}</div>
    <form class="frm">
      ${F.sel('wid', '工人', opts, S.workers[0].id)}
      <div class="two">${F.num('days', '工日', '1', '0.5 = 半天', '0.5')}${F.date('date', '日期', today())}</div>
      <button class="btn primary" type="submit">保存</button>
    </form>`, {
    onMount: (sc) => {
      sc.querySelector('form').addEventListener('submit', (e) => {
        e.preventDefault();
        const o = {}; new FormData(e.target).forEach((v, k) => o[k] = v);
        if (num(o.days) <= 0) return toast('工日要大于 0');
        S.att.push({ id: uid('a'), pid: p.id, wid: o.wid, days: num(o.days), date: o.date || today() });
        save(); sc.close(); render(); toast('已记工');
      });
    }
  });
}

/* ---------- 项目 ---------- */
function openProjects() {
  const list = S.projects.map(p => `<div class="li" data-p="${p.id}">
      <div class="r1"><span class="t">${esc(p.name)}</span>${p.id === S.cur ? '<span class="badge ok">当前</span>' : ''}</div>
      <div class="r3"><span>${esc(p.addr || '未填地址')}</span><span>${esc(p.status || '')}</span><span>开工 ${fmtD(p.start || today())}</span></div>
    </div>`).join('');
  const w = sheet(`<div class="sh-t">切换工地</div><div class="sh-s">点一行切换；长按/右侧按钮编辑</div>
    ${list}
    <button class="btn primary" id="add" style="margin-top:14px">+ 新建工地</button>`, {
    onMount: (sc) => {
      $$('.li[data-p]', sc).forEach(el => el.onclick = () => {
        S.cur = el.dataset.p; save(); sc.close(); render(); toast('已切换');
      });
      sc.querySelector('#add').onclick = () => { sc.close(); setTimeout(openProjectForm, 300); };
    }
  });
}
function openProjectForm() {
  const w = sheet(`<div class="sh-t">新建工地</div>
    <form class="frm">
      ${F.text('name', '工地名称', '', '如 城南安置房 3#楼')}
      ${F.text('addr', '地址', '', '可不填')}
      ${F.date('start', '开工日期', today())}
      <button class="btn primary" type="submit">创建并切换</button>
    </form>`, {
    onMount: (sc) => {
      sc.querySelector('form').addEventListener('submit', (e) => {
        e.preventDefault();
        const o = {}; new FormData(e.target).forEach((v, k) => o[k] = v);
        if (!o.name.trim()) return toast('名称不能为空');
        const p = { id: uid('p'), name: o.name.trim(), addr: o.addr || '', start: o.start || today(), status: '在建' };
        S.projects.push(p); S.cur = p.id; save(); sc.close(); render(); toast('已创建');
      });
    }
  });
}

/* ---------- 报表 ---------- */
function weeklyText() {
  const p = cur(), t = today(), ws = weekStart(t), we = addD(ws, 6);
  const logs = S.logs.filter(l => l.pid === p.id && l.date >= ws && l.date <= we).sort((a, b) => a.date < b.date ? -1 : 1);
  const att = S.att.filter(a => a.pid === p.id && a.date >= ws && a.date <= we);
  const days = att.reduce((s, a) => s + num(a.days), 0);
  const mIn = S.moves.filter(m => m.pid === p.id && m.type === 'in' && m.date >= ws && m.date <= we);
  const mOut = S.moves.filter(m => m.pid === p.id && m.type === 'out' && m.date >= ws && m.date <= we);
  const cks = S.checks.filter(c => c.pid === p.id && c.date >= ws && c.date <= we);
  const bad = cks.filter(c => c.result === 'bad');

  let s = `【施工周报】${p.name}\n周期：${ws} 至 ${we}\n\n一、本周完成\n`;
  if (!logs.length) s += '（本周无日志记录）\n';
  logs.forEach(l => {
    s += `${fmtD2(l.date)}　${l.part || ''}　出勤 ${num(l.people)} 人\n`;
    if (l.done) s += `  完成：${l.done.replace(/\n/g, '；')}\n`;
    if (l.issues) s += `  问题：${l.issues.replace(/\n/g, '；')}\n`;
  });
  s += `\n二、下周计划\n${(logs[logs.length - 1] || {}).plan || '（未填写）'}\n`;
  s += `\n三、出勤\n本周出勤 ${days % 1 ? days.toFixed(1) : days} 工日`;
  if (att.length) {
    const byW = {};
    att.forEach(a => { byW[a.wid] = (byW[a.wid] || 0) + num(a.days); });
    const txt = Object.keys(byW).map(wid => {
      const w = S.workers.find(x => x.id === wid) || { name: '—' };
      return `${w.name} ${byW[wid] % 1 ? byW[wid].toFixed(1) : byW[wid]}`;
    }).join('，');
    s += `（${txt}）`;
  }
  s += `\n\n四、材料\n入库 ${mIn.length} 笔，${money(mIn.reduce((x, m) => x + num(m.qty) * priceOf(m), 0))}\n`;
  s += `领用 ${mOut.length} 笔，${money(mOut.reduce((x, m) => x + num(m.qty) * priceOf(m), 0))}\n`;
  s += `\n五、安全质量\n巡检检查项 ${cks.length} 项，隐患 ${bad.length} 项，已整改 ${bad.filter(c => c.fixedAt).length} 项\n`;
  bad.filter(c => !c.fixedAt).forEach(c => { s += `· ${c.itemName}：${c.note || '待补描述'}${c.due ? `（期限 ${c.due}）` : ''}\n`; });
  s += `\n${p.name}　${today()}`;
  return s;
}
