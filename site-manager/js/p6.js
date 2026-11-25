'use strict';
function openMat() {
  const w = sheet(`<div class="sh-t">新增材料</div>
    <form class="frm">
      ${F.text('name', '材料名称', '', '如 碎石 5-25mm')}
      <div class="two">${F.text('unit', '单位', '', '吨 / 方 / 个')}${F.num('safe', '安全库存', '', '0', '0.01')}</div>
      ${F.num('price', '参考单价（元）', '', '0', '0.01')}
      <button class="btn primary" type="submit">保存</button>
    </form>`, {
    onMount: (sc) => {
      sc.querySelector('form').addEventListener('submit', (e) => {
        e.preventDefault();
        const o = {}; new FormData(e.target).forEach((v, k) => o[k] = v);
        if (!o.name.trim()) return toast('材料名称不能为空');
        S.mats.push({ id: uid('m'), name: o.name.trim(), unit: o.unit || '个', safe: num(o.safe), price: num(o.price) });
        save(); sc.close(); render(); toast('已新增');
      });
    }
  });
}

/* ---------- 巡检 ---------- */
function openCheck() {
  const p = cur();
  const rows = S.items.map(it => `<div class="ck" data-id="${it.id}">
      <div class="ck-n">${esc(it.name)}<span class="ck-h">${esc(it.hint || '')}</span></div>
      <div class="seg"><button type="button" data-v="ok">合格</button><button type="button" data-v="bad">不合格</button></div>
      <div class="ck-extra" hidden>
        <label class="fld"><span>问题描述</span><input name="note-${it.id}" placeholder="如 3#楼二层东侧临边缺护栏"></label>
        <label class="fld"><span>整改期限</span><input type="date" name="due-${it.id}" value="${addD(today(), 3)}"></label>
        <div class="fld"><span>隐患照片</span><div class="pb"><div class="thumbs"></div><button type="button" class="add">+ 拍照</button></div></div>
      </div>
    </div>`).join('');
  const picked = {};
  const w = sheet(`<div class="sh-t">安全质量巡检</div>
    <div class="sh-s">${esc(p.name)} · ${fmtD2(today())}　只提交勾选过的项</div>
    <div style="margin-top:10px">${rows}</div>
    <button class="btn primary" id="submit" style="margin-top:16px">提交巡检</button>`, {
    onMount: (sc) => {
      $$('.ck', sc).forEach(ck => {
        const extra = ck.querySelector('.ck-extra');
        const photos = [];
        ck.dataset.result = '';
        ck.querySelectorAll('.seg button').forEach(b => b.onclick = () => {
          ck.querySelectorAll('.seg button').forEach(x => x.classList.remove('on-ok', 'on-bad'));
          ck.dataset.result = b.dataset.v;
          b.classList.add(b.dataset.v === 'ok' ? 'on-ok' : 'on-bad');
          extra.hidden = b.dataset.v !== 'bad';
          if (b.dataset.v === 'bad' && !extra._wired) { attachPhotos(extra, photos); extra._wired = true; }
        });
        ck._get = () => ({ id: ck.dataset.id, result: ck.dataset.result, note: (ck.querySelector(`[name="note-${ck.dataset.id}"]`) || {}).value || '', due: (ck.querySelector(`[name="due-${ck.dataset.id}"]`) || {}).value || '', photos });
      });
      sc.querySelector('#submit').onclick = () => {
        const items = $$('.ck', sc).map(ck => ck._get()).filter(x => x.result);
        if (!items.length) return toast('至少勾选一项');
        const t = today();
        items.forEach(it => {
          const src = S.items.find(x => x.id === it.id) || { name: '检查项' };
          S.checks.push({
            id: uid('ck'), pid: p.id, date: t, itemId: it.id, itemName: src.name,
            result: it.result, note: it.note, due: it.result === 'bad' ? it.due : '', photos: it.photos || [], fixedAt: null, fixNote: '', fixPhotos: []
          });
        });
        save(); sc.close(); checkFilter = 'open'; route = 'checks'; render();
        const bad = items.filter(x => x.result === 'bad').length;
        toast(bad ? `已提交，${bad} 项隐患待整改` : '巡检已提交，全部合格');
      };
    }
  });
}

function openFix(id) {
  const c = S.checks.find(x => x.id === id); if (!c) return;
  if (c.fixedAt) {
    const w = sheet(`<div class="sh-t">${esc(c.itemName)}</div>
      <div class="sh-s">已整改 · ${fmtD(c.fixedAt.slice(0, 10))}</div>
      <div class="fld"><span>整改说明</span><div class="card" style="background:#fbfcfd">${esc(c.fixNote || '（未填写）')}</div></div>
      ${photoRow(c.fixPhotos || [])}
      <div class="row-btns"><button class="btn ghost" id="undo">撤销整改</button><button class="btn primary" id="ok">好的</button></div>`);
    w.querySelector('#ok').onclick = w.close;
    w.querySelector('#undo').onclick = () => { c.fixedAt = null; c.fixNote = ''; c.fixPhotos = []; save(); w.close(); render(); toast('已恢复为待整改'); };
    return;
  }
  const photos = [];
  const w = sheet(`<div class="sh-t">整改：${esc(c.itemName)}</div>
    <div class="sh-s">${fmtD2(c.date)}　${c.due ? '期限 ' + fmtD(c.due) : ''}</div>
    <div class="fld"><span>问题</span><div class="card" style="background:#fdf3e2">${esc(c.note || '（未填写描述）')}</div></div>
    ${photoRow(c.photos || [])}
    <label class="fld"><span>整改说明</span><textarea name="fixNote" placeholder="怎么整改的"></textarea></label>
    <div class="fld"><span>整改后照片</span><div class="pb"><div class="thumbs"></div><button type="button" class="add">+ 拍照</button></div></div>
    <button class="btn primary" id="done" style="margin-top:14px">标记已整改</button>`, {
    onMount: (sc) => {
      attachPhotos(sc, photos);
      sc.querySelector('#done').onclick = () => {
        c.fixedAt = new Date().toISOString().slice(0, 10);
        c.fixNote = sc.querySelector('[name="fixNote"]').value || '';
        c.fixPhotos = photos;
        checkFilter = 'fixed';
        save(); sc.close(); render(); toast('已标记整改完成');
      };
    }
  });
}
