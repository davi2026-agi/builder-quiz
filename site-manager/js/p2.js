'use strict';
function ask(msg, okText, fn) {
  const w = sheet(`<div class="sh-t">${esc(msg)}</div>
    <div class="row-btns"><button class="btn ghost" id="no">取消</button><button class="btn danger" id="yes">${esc(okText || '删除')}</button></div>`);
  w.querySelector('#no').onclick = w.close;
  w.querySelector('#yes').onclick = () => { w.close(); fn(); };
  return w;
}

const F = {
  text: (n, l, v, ph, type) => `<label class="fld"><span>${l}</span><input name="${n}" type="${type || 'text'}" value="${esc(v || '')}" placeholder="${esc(ph || '')}"></label>`,
  num: (n, l, v, ph, step) => `<label class="fld"><span>${l}</span><input name="${n}" type="number" inputmode="decimal" step="${step || 'any'}" value="${v == null || v === '' ? '' : esc(v)}" placeholder="${esc(ph || '')}"></label>`,
  area: (n, l, v, ph) => `<label class="fld"><span>${l}</span><textarea name="${n}" placeholder="${esc(ph || '')}">${esc(v || '')}</textarea></label>`,
  date: (n, l, v) => `<label class="fld"><span>${l}</span><input name="${n}" type="date" value="${esc(v || today())}"></label>`,
  sel: (n, l, opts, v) => `<label class="fld"><span>${l}</span><select name="${n}">${opts.map(o => `<option value="${esc(o.v)}"${String(o.v) === String(v) ? ' selected' : ''}>${esc(o.t)}</option>`).join('')}</select></label>`
};
function chipField(name, label, list, val) {
  return `<div class="fld"><span>${label}</span><div class="chips" data-chip="${name}">${list.map(x => `<button type="button" class="chip${x === val ? ' on' : ''}" data-v="${esc(x)}">${esc(x)}</button>`).join('')}</div><input type="hidden" name="${name}" value="${esc(val || '')}"></div>`;
}
function wireChips(scope) {
  $$('.chips', scope).forEach(g => {
    const name = g.dataset.chip;
    const inp = scope.querySelector(`input[name="${name}"]`);
    g.querySelectorAll('.chip').forEach(b => b.onclick = () => {
      g.querySelectorAll('.chip').forEach(x => x.classList.remove('on'));
      b.classList.add('on');
      if (inp) inp.value = b.dataset.v;
    });
  });
}
const photoBlock = () => `<div class="fld"><span>照片（最多 3 张，自动压缩）</span><div class="pb"><div class="thumbs"></div><button type="button" class="add">+ 拍照</button></div></div>`;

/* ---------- 照片 ---------- */
function shrink(file, maxW, q) {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const sc = Math.min(1, (maxW || 900) / img.width);
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * sc); c.height = Math.round(img.height * sc);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        res(c.toDataURL('image/jpeg', q || 0.55));
      } catch (e) { URL.revokeObjectURL(url); rej(e); }
    };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('img')); };
    img.src = url;
  });
}
function pickPhotos(max) {
  return new Promise((res) => {
    if (max <= 0) return res([]);
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = 'image/*'; inp.multiple = true;
    inp.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0';
    document.body.appendChild(inp);
    const done = (v) => { inp.remove(); res(v); };
    inp.onchange = async () => {
      const out = [];
      for (const f of Array.from(inp.files || []).slice(0, max)) {
        try { out.push(await shrink(f)); } catch (e) {}
      }
      done(out);
    };
    inp.oncancel = () => done([]);
    inp.click();
  });
}
function attachPhotos(scope, arr) {
  const thumbs = scope.querySelector('.thumbs');
  const btn = scope.querySelector('.pb .add');
  if (!thumbs || !btn) return;
  const draw = () => {
    thumbs.innerHTML = arr.map((d, i) => `<div class="thumb"><img src="${d}" alt=""><button type="button" class="del" data-i="${i}">✕</button></div>`).join('');
    thumbs.querySelectorAll('.del').forEach(b => b.onclick = () => { arr.splice(+b.dataset.i, 1); draw(); });
  };
  btn.onclick = async () => {
    const got = await pickPhotos(3 - arr.length);
    if (got.length) { arr.push(...got); draw(); }
  };
  draw();
}
function photoRow(list) {
  return list && list.length ? `<div class="pb">${list.map(d => `<div class="thumb"><img src="${d}" alt=""></div>`).join('')}</div>` : '';
}

/* ---------- 视图 ---------- */
let route = 'home';
let matTab = 'stock';
let checkFilter = 'open';

function render() {
  const p = cur();
  $('#hd-name').textContent = p ? p.name : '工地小管家';
  $('#hd-sub').textContent = p ? [p.addr, p.status].filter(Boolean).join(' · ') || '点击右上角切换 / 编辑工地' : '还没有工地';
  $$('.tabbar button').forEach(b => b.classList.toggle('on', b.dataset.r === route));
  const view = $('#view');
  view.innerHTML = route === 'logs' ? vLogs() : route === 'mats' ? vMats() : route === 'checks' ? vChecks() : route === 'more' ? vMore() : vHome();
  if (route === 'logs') $('#fab').onclick = () => openLog();
  if (route === 'checks') $('#fab-checks').onclick = () => openCheck();
  wireCommon();
}
