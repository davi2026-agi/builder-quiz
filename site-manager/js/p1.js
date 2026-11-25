'use strict';
/* ---------- 基础 ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = (n) => String(n).padStart(2, '0');
const ds = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const today = () => ds(new Date());
const pd = (s) => { const a = String(s || '').split('-').map(Number); return new Date(a[0] || 1970, (a[1] || 1) - 1, a[2] || 1); };
const addD = (s, n) => { const d = pd(s); d.setDate(d.getDate() + n); return ds(d); };
const weekStart = (s) => { const d = pd(s); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return ds(d); };
const monthStart = (s) => { const d = pd(s); return ds(new Date(d.getFullYear(), d.getMonth(), 1)); };
const monthEnd = (s) => { const d = pd(s); return ds(new Date(d.getFullYear(), d.getMonth() + 1, 0)); };
const uid = (p) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
const num = (v) => { const n = parseFloat(String(v == null ? '' : v).replace(/[^\d.\-]/g, '')); return isNaN(n) ? 0 : n; };
const money = (n) => '¥' + (Math.round((Number(n) || 0) * 100) / 100).toLocaleString('zh-CN');
const WD = ['日', '一', '二', '三', '四', '五', '六'];
const fmtD = (s) => { const d = pd(s); return `${d.getMonth() + 1}月${d.getDate()}日`; };
const fmtD2 = (s) => { const d = pd(s); return `${d.getMonth() + 1}/${d.getDate()} 周${WD[d.getDay()]}`; };
const ago = (s) => { const t = today(); if (s === t) return '今天'; if (s === addD(t, -1)) return '昨天'; return fmtD(s); };

/* ---------- 默认数据 ---------- */
const DEF_MATS = [
  { id: 'm1', name: 'P.O42.5 水泥', unit: '吨', safe: 5, price: 420 },
  { id: 'm2', name: 'HRB400 钢筋 φ12', unit: '吨', safe: 3, price: 4100 },
  { id: 'm3', name: '中砂', unit: '方', safe: 10, price: 150 },
  { id: 'm4', name: '标准砖', unit: '千块', safe: 20, price: 380 },
  { id: 'm5', name: '木模板', unit: '张', safe: 50, price: 48 },
  { id: 'm6', name: '扣件', unit: '个', safe: 200, price: 4.5 }
];
const DEF_ITEMS = [
  { id: 'c1', name: '安全帽 / 反光衣', hint: '现场人员是否规范佩戴' },
  { id: 'c2', name: '临边洞口防护', hint: '栏杆、盖板是否齐全牢固' },
  { id: 'c3', name: '施工用电', hint: '配电箱、漏电保护、线缆私接' },
  { id: 'c4', name: '脚手架 / 支撑', hint: '连墙件、剪刀撑、立杆基础' },
  { id: 'c5', name: '消防器材', hint: '灭火器压力、动火审批' },
  { id: 'c6', name: '起重机械 / 机具', hint: '限位、钢丝绳、持证操作' },
  { id: 'c7', name: '文明施工 / 扬尘', hint: '围挡、洒水、材料堆放' },
  { id: 'c8', name: '实体质量', hint: '养护、垂直度、灰缝、蜂窝麻面' }
];
const WEATHER = ['晴', '多云', '阴', '小雨', '中雨', '大雨', '雪', '大风'];
const PARTS = ['基础', '主体结构', '砌体', '装饰装修', '水电安装', '屋面', '室外配套'];

function firstState() {
  return {
    ver: 1, cur: 'p1',
    projects: [{ id: 'p1', name: '我的第一个工地', addr: '', start: today(), status: '在建' }],
    mats: DEF_MATS.map(x => ({ ...x })),
    items: DEF_ITEMS.map(x => ({ ...x })),
    workers: [], logs: [], moves: [], checks: [], att: []
  };
}

/* ---------- 存储 ---------- */
const KEY = 'site_manager_v1';
let S;
try { S = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { S = null; }
if (!S || !S.ver || !Array.isArray(S.projects) || !S.projects.length) S = firstState();
['mats', 'items', 'workers', 'logs', 'moves', 'checks', 'att'].forEach(k => { if (!Array.isArray(S[k])) S[k] = []; });
if (!S.cur || !S.projects.some(p => p.id === S.cur)) S.cur = S.projects[0].id;

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); }
  catch (e) { toast('本机存储满了：请删掉一些旧照片，或先导出备份'); }
}
const cur = () => S.projects.find(p => p.id === S.cur) || S.projects[0];
const rateOf = (wid) => { const w = S.workers.find(x => x.id === wid); return w ? num(w.rate) : 0; };
const priceOf = (m) => (m.price != null && m.price !== '' ? num(m.price) : (S.mats.find(x => x.id === m.matId) || {}).price ? num(S.mats.find(x => x.id === m.matId).price) : 0);
function stock(pid, matId) {
  return S.moves.filter(m => m.pid === pid && m.matId === matId)
    .reduce((q, m) => q + (m.type === 'out' ? -num(m.qty) : num(m.qty)), 0);
}
const matOf = (id) => S.mats.find(m => m.id === id) || { name: '（已删除材料）', unit: '' };
function hasFlow(pid, matId) { return S.moves.some(m => m.pid === pid && m.matId === matId); }
function lowMats(pid) { return S.mats.filter(m => hasFlow(pid, m.id) && stock(pid, m.id) < num(m.safe)); }

/* ---------- UI 基础 ---------- */
let toastTimer = null;
function toast(msg) {
  let el = $('.toast');
  if (!el) { el = document.createElement('div'); el.className = 'toast'; document.body.appendChild(el); }
  el.textContent = msg; el.classList.add('on');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('on'), 2400);
}

function sheet(html, opts) {
  const wrap = document.createElement('div');
  wrap.className = 'sheet-wrap';
  wrap.innerHTML = `<div class="sheet-mask"></div><div class="sheet"><div class="sheet-bar"></div>${html}</div>`;
  document.body.appendChild(wrap);
  requestAnimationFrame(() => wrap.classList.add('in'));
  const close = () => { wrap.classList.remove('in'); wrap._closed = true; setTimeout(() => wrap.remove(), 300); };
  wrap.close = close;
  wrap.querySelector('.sheet-mask').addEventListener('click', close);
  if (opts && opts.onMount) setTimeout(() => opts.onMount(wrap), 0);
  return wrap;
}
