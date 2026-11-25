'use strict';
function wireMore() {
  $('#add-att').onclick = openAtt;
  $('#add-worker').onclick = openWorker;
  $('#month-report').onclick = showMonthReport;
  $('#csv').onclick = exportCsv;
  $('#backup').onclick = doBackup;
  $('#restore').onclick = doRestore;
  $('#demo').onclick = loadDemo;
  $('#reset').onclick = () => ask('清空所有本地数据？不可恢复，建议先备份。', '清空', () => {
    localStorage.removeItem(KEY); S = firstState(); save(); toast('已清空'); render();
  });
}

/* ---------- 施工日志 ---------- */
function openLog(id) {
  const p = cur();
  const l = id ? S.logs.find(x => x.id === id) : null;
  const t = today();
  const attT = S.att.filter(a => a.pid === p.id && a.date === t).length;
  const photos = l ? (l.photos || []).slice() : [];
  const w = sheet(`<div class="sh-t">${l ? '编辑施工日志' : '写施工日志'}</div>
    <div class="sh-s">${esc(p.name)}</div>
    <form class="frm">
      ${F.date('date', '日期', l ? l.date : t)}
      ${chipField('weather', '天气', WEATHER, l ? l.weather : '晴')}
      <div class="two">${F.num('temp', '气温（℃）', l ? l.temp : '', '如 12')}${F.num('people', '出勤人数', l ? l.people : (attT || ''), '自动带出考勤')}</div>
      ${chipField('part', '施工部位', PARTS, l ? (PARTS.includes(String(l.part || '').split('·')[0]) ? String(l.part).split('·')[0] : '') : '')}
      ${F.text('part2', '具体部位 / 工序', l ? String(l.part || '').split('·').slice(1).join('·') : '', '如 3#楼 三层顶板 钢筋绑扎')}
      ${F.area('done', '今日完成', l ? l.done : '', '干了什么、多少量、进度到哪')}
      ${F.area('plan', '明日计划', l ? l.plan : '', '明天安排')}
      ${F.area('issues', '存在问题', l ? l.issues : '', '材料、人员、天气、协调问题（没有可留空）')}
      ${photoBlock()}
      <button class="btn primary" type="submit">${l ? '保存修改' : '保存日志'}</button>
    </form>`, {
    onMount: (sc) => {
      wireChips(sc);
      attachPhotos(sc, photos);
      sc.querySelector('form').addEventListener('submit', (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const o = {};
        fd.forEach((v, k) => o[k] = v);
        const rec = {
          id: l ? l.id : uid('l'),
          pid: p.id,
          date: o.date || t,
          weather: o.weather || '',
          temp: o.temp,
          people: num(o.people),
          part: (o.part && o.part2) ? `${o.part}·${o.part2}` : (o.part2 || o.part || ''),
          done: o.done || '',
          plan: o.plan || '',
          issues: o.issues || '',
          photos
        };
        if (l) Object.assign(l, rec); else S.logs.push(rec);
        save(); sc.close(); render(); toast(l ? '已保存' : '日志已保存');
      });
    }
  });
}

function openLogDetail(id) {
  const l = S.logs.find(x => x.id === id); if (!l) return;
  const w = sheet(`<div class="sh-t">${fmtD2(l.date)}</div>
    <div class="sh-s">${esc(l.part || '')}　${esc(l.weather || '')}${l.temp ? ' ' + esc(l.temp) + '℃' : ''}　出勤 ${num(l.people)} 人</div>
    ${l.done ? `<div class="fld"><span>今日完成</span><div class="card" style="background:#fbfcfd">${esc(l.done)}</div></div>` : ''}
    ${l.plan ? `<div class="fld"><span>明日计划</span><div class="card" style="background:#fbfcfd">${esc(l.plan)}</div></div>` : ''}
    ${l.issues ? `<div class="fld"><span>存在问题</span><div class="card" style="background:#fdf3e2">${esc(l.issues)}</div></div>` : ''}
    ${l.photos && l.photos.length ? `<div class="fld"><span>照片</span>${photoRow(l.photos)}</div>` : ''}
    <div class="row-btns"><button class="btn ghost" id="del">删除</button><button class="btn primary" id="edit">编辑</button></div>`);
  w.querySelector('#edit').onclick = () => { w.close(); setTimeout(() => openLog(l.id), 320); };
  w.querySelector('#del').onclick = () => ask('删除这篇日志？', '删除', () => {
    S.logs = S.logs.filter(x => x.id !== l.id); save(); render(); toast('已删除');
  });
}

/* ---------- 材料 ---------- */
function openMove(type, matId) {
  const p = cur();
  if (!S.mats.length) return toast('先新增材料');
  const t = today();
  const mats = S.mats.map(m => ({ v: m.id, t: `${m.name}（${m.unit}）` }));
  const inType = type === 'in';
  const w = sheet(`<div class="sh-t">${inType ? '材料入库' : '材料领用'}</div>
    <div class="sh-s">${esc(p.name)}</div>
    <form class="frm">
      ${F.sel('matId', '材料', mats, matId || S.mats[0].id)}
      <div class="two">${F.num('qty', inType ? '入库数量' : '领用数量', '', '0', '0.01')}${F.num('price', '单价（元）', '', '可留空，用参考价', '0.01')}</div>
      ${F.text('party', inType ? '供应商 / 车号' : '领用班组', '', inType ? '如 宏大商砼 浙A12345' : '如 木工班 张师傅')}
      ${F.date('date', '日期', t)}
      ${F.text('note', '备注', '', '如 过磅 28.6 吨、票号 00123')}
      <button class="btn ${inType ? 'dark' : 'primary'}" type="submit">保存</button>
    </form>`, {
    onMount: (sc) => {
      sc.querySelector('form').addEventListener('submit', (e) => {
        e.preventDefault();
        const o = {}; new FormData(e.target).forEach((v, k) => o[k] = v);
        if (!num(o.qty)) return toast('数量要大于 0');
        S.moves.push({
          id: uid('mv'), pid: p.id, type: inType ? 'in' : 'out', matId: o.matId,
          qty: num(o.qty), price: o.price === '' ? null : num(o.price),
          party: o.party || '', date: o.date || t, note: o.note || ''
        });
        save(); sc.close(); render(); toast(inType ? '已入库' : '已领用');
      });
    }
  });
}
