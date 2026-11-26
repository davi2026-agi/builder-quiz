/* 照见 · 六面镜子 —— 单页测算引擎与界面 */
'use strict';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const WX = ['木', '火', '土', '金', '水'];
const GAN_WX = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4];
const ZHI_WX = [4, 2, 0, 0, 2, 1, 1, 2, 3, 3, 2, 4];
const GAN_YANG = [1, 0, 1, 0, 1, 0, 1, 0, 1, 0];
const WX_COLOR = ['#5eead4', '#ff8a6b', '#ffd166', '#dfe3ea', '#7c8cff'];
const SHISHEN_NAME = {
  same: ['比肩', '劫财'], out: ['食神', '伤官'], cai: ['偏财', '正财'],
  guan: ['七杀', '正官'], yin: ['偏印', '正印']
};

function shishen(dayGan, otherGan) {
  const me = GAN_WX[dayGan], ot = GAN_WX[otherGan];
  const sameYin = GAN_YANG[dayGan] === GAN_YANG[otherGan];
  const rel = (ot - me + 5) % 5;
  const key = ['same', 'out', 'cai', 'guan', 'yin'][rel];
  return { name: SHISHEN_NAME[key][sameYin ? 0 : 1], key };
}

const XZ = [
  { n: '摩羯座', s: [12, 22], e: [1, 19], el: '土', mode: '本位', k: '把时间当朋友' },
  { n: '水瓶座', s: [1, 20], e: [2, 18], el: '风', mode: '固定', k: '站在人群之外看人群' },
  { n: '双鱼座', s: [2, 19], e: [3, 20], el: '水', mode: '变动', k: '边界很薄，所以能听见' },
  { n: '白羊座', s: [3, 21], e: [4, 19], el: '火', mode: '本位', k: '先动起来再说' },
  { n: '金牛座', s: [4, 20], e: [5, 20], el: '土', mode: '固定', k: '把好东西留得久一点' },
  { n: '双子座', s: [5, 21], e: [6, 21], el: '风', mode: '变动', k: '同时开着很多扇窗' },
  { n: '巨蟹座', s: [6, 22], e: [7, 22], el: '水', mode: '本位', k: '先照顾人，再谈别的' },
  { n: '狮子座', s: [7, 23], e: [8, 22], el: '火', mode: '固定', k: '需要一个被看见的位置' },
  { n: '处女座', s: [8, 23], e: [9, 22], el: '土', mode: '变动', k: '把毛边一点点修掉' },
  { n: '天秤座', s: [9, 23], e: [10, 23], el: '风', mode: '本位', k: '在两边之间找那条线' },
  { n: '天蝎座', s: [10, 24], e: [11, 22], el: '水', mode: '固定', k: '要么不要，要么全部' },
  { n: '射手座', s: [11, 23], e: [12, 21], el: '火', mode: '变动', k: '远处总比这里有意思' }
];
function signOf(m, d) {
  for (const z of XZ) {
    const sm = z.s[0], sd = z.s[1], em = z.e[0], ed = z.e[1];
    if (sm <= em) { if ((m === sm && d >= sd) || (m === em && d <= ed) || (m > sm && m < em)) return z; }
    else { if ((m === sm && d >= sd) || (m === em && d <= ed) || m > sm || m < em) return z; }
  }
  return XZ[0];
}

const BG = [
  { n: '乾', sym: '☰', wx: '金', img: '天', kw: '刚健', lines: [1, 1, 1] },
  { n: '兑', sym: '☱', wx: '金', img: '泽', kw: '悦', lines: [1, 1, 0] },
  { n: '离', sym: '☲', wx: '火', img: '火', kw: '明', lines: [1, 0, 1] },
  { n: '震', sym: '☳', wx: '木', img: '雷', kw: '动', lines: [1, 0, 0] },
  { n: '巽', sym: '☴', wx: '木', img: '风', kw: '入', lines: [0, 1, 1] },
  { n: '坎', sym: '☵', wx: '水', img: '水', kw: '险', lines: [0, 1, 0] },
  { n: '艮', sym: '☶', wx: '土', img: '山', kw: '止', lines: [0, 0, 1] },
  { n: '坤', sym: '☷', wx: '土', img: '地', kw: '顺', lines: [0, 0, 0] }
];
const GUA64 = [
  ['乾为天', '天泽履', '天火同人', '天雷无妄', '天风姤', '天水讼', '天山遁', '天地否'],
  ['泽天夬', '兑为泽', '泽火革', '泽雷随', '泽风大过', '泽水困', '泽山咸', '泽地萃'],
  ['火天大有', '火泽睽', '离为火', '火雷噬嗑', '火风鼎', '火水未济', '火山旅', '火地晋'],
  ['雷天大壮', '雷泽归妹', '雷火丰', '震为雷', '雷风恒', '雷水解', '雷山小过', '雷地豫'],
  ['风天小畜', '风泽中孚', '风火家人', '风雷益', '巽为风', '风水涣', '风山渐', '风地观'],
  ['水天需', '水泽节', '水火既济', '水雷屯', '水风井', '坎为水', '水山蹇', '水地比'],
  ['山天大畜', '山泽损', '山火贲', '山雷颐', '山风蛊', '山水蒙', '艮为山', '山地剥'],
  ['地天泰', '地泽临', '地火明夷', '地雷复', '地风升', '地水师', '地山谦', '坤为地']
];
const WX_SHENG = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' };
const WX_KE = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' };

const ZW_KIND = {
  紫微: { ord: 4, drv: 3 }, 天机: { open: 4, ord: 1 }, 太阳: { drv: 3, warm: 3 },
  武曲: { drv: 4, grit: 2 }, 天同: { warm: 4, open: 1 }, 廉贞: { drv: 3, open: 2 },
  天府: { ord: 4, grit: 2 }, 太阴: { warm: 4, open: 2 }, 贪狼: { open: 4, drv: 2 },
  巨门: { open: 3, grit: 1 }, 天相: { ord: 4, warm: 1 }, 天梁: { ord: 3, warm: 2 },
  七杀: { drv: 4, grit: 4 }, 破军: { drv: 4, open: 3 }
};
const BRIGHT = { 庙: '庙', 旺: '旺', 得: '得', 利: '利', 平: '平', 陷: '陷', 不: '不' };

const QS = [
  { t: '聚会结束，你更常觉得', a: '被充能', b: '被消耗', d: 'EI', f: 'E' },
  { t: '有烦心事时，你更想', a: '找人说说', b: '自己消化', d: 'EI', f: 'E' },
  { t: '进入一个新场合，你通常', a: '先主动搭话', b: '先看一会儿', d: 'EI', f: 'E' },
  { t: '更容易打动你的是', a: '具体的事实', b: '背后的可能', d: 'SN', f: 'S' },
  { t: '别人更常评价你', a: '务实', b: '有想法', d: 'SN', f: 'S' },
  { t: '学新东西时你偏好', a: '先照步骤做', b: '先搞懂原理', d: 'SN', f: 'S' },
  { t: '做决定时你更看重', a: '是否合理', b: '是否顾及人', d: 'TF', f: 'T' },
  { t: '朋友向你抱怨，你先', a: '帮他想办法', b: '接住他的情绪', d: 'TF', f: 'T' },
  { t: '冲突中你更怕', a: '逻辑说不清', b: '伤了关系', d: 'TF', f: 'T' },
  { t: '出门旅行你更习惯', a: '提前排好', b: '走到哪算哪', d: 'JP', f: 'J' },
  { t: '几件事同时压着，你偏好', a: '一件件清掉', b: '同时推进', d: 'JP', f: 'J' },
  { t: '计划被临时打乱，你', a: '会有点烦', b: '无所谓', d: 'JP', f: 'J' }
];
const LETTERS = { EI: ['E', 'I'], SN: ['S', 'N'], TF: ['T', 'F'], JP: ['J', 'P'] };

const CITIES = [
  { n: '北京', lng: 116.4 }, { n: '天津', lng: 117.2 }, { n: '上海', lng: 121.5 },
  { n: '广州', lng: 113.3 }, { n: '深圳', lng: 114.1 }, { n: '成都', lng: 104.1 },
  { n: '西安', lng: 108.9 }, { n: '武汉', lng: 114.3 }, { n: '杭州', lng: 120.2 },
  { n: '沈阳', lng: 123.4 }, { n: '哈尔滨', lng: 126.6 }, { n: '乌鲁木齐', lng: 87.6 }
];

let IZ = null;
function loadEngine() {
  return new Promise(res => {
    const srcs = [
      'https://cdn.jsdelivr.net/npm/iztro@2.4.4/dist/iztro.min.js',
      'https://unpkg.com/iztro@2.4.4/dist/iztro.min.js'
    ];
    let i = 0, done = false;
    const fin = v => { if (!done) { done = true; IZ = v; res(v); } };
    const next = () => {
      if (done) return;
      if (i >= srcs.length) return fin(null);
      const s = document.createElement('script');
      s.src = srcs[i++];
      s.onload = () => { if (!done) { const w = window.iztro; w && w.astro ? fin(w) : fin(null); } };
      s.onerror = () => { s.remove(); next(); };
      setTimeout(() => { if (!done) { s.remove(); next(); } }, 5500);
      document.head.appendChild(s);
    };
    next();
  });
}
const engineReady = loadEngine();

function sunTime(hour, minute, lng) {
  const diff = (lng - 120) * 4;
  let t = hour * 60 + minute + diff;
  t = (t + 1440) % 1440;
  return { h: Math.floor(t / 60), m: Math.round(t % 60) };
}

function jdn(y, m, d) {
  const a = Math.floor((14 - m) / 12), yy = y + 4800 - a, mm = m + 12 * a - 3;
  return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
}

function fallbackBazi(y, m, d, h) {
  const passed = (mm, dd) => (m > mm) || (m === mm && d >= dd);
  let yearGz = y;
  if (!passed(2, 4)) yearGz = y - 1;
  const yi = ((yearGz - 1984) % 60 + 60) % 60;
  const yGan = yi % 10;
  const yz = yi % 12;
  let zhiOfMonth = ((m - 2 + 12) % 12) + 2;
  if (zhiOfMonth > 11) zhiOfMonth -= 12;
  const mGan = ((yGan % 5) * 2 + 2 + ((zhiOfMonth - 2 + 12) % 12)) % 10;
  const idx = (jdn(y, m, d) + 49) % 60;
  const dGan = idx % 10, dZhi = idx % 12;
  const hZhi = (h === 23) ? 0 : Math.floor((h + 1) / 2) % 12;
  const hGan = ((dGan % 5) * 2 + hZhi) % 10;
  return [
    { g: yGan, z: yz, label: '年' }, { g: mGan, z: zhiOfMonth, label: '月' },
    { g: dGan, z: dZhi, label: '日' }, { g: hGan, z: hZhi, label: '时' }
  ];
}

function baziOf(a) {
  const parts = a.chineseDate.split(' ');
  const pillars = parts.map((p, i) => ({
    g: GAN.indexOf(p[0]), z: ZHI.indexOf(p[1]), label: ['年', '月', '日', '时'][i]
  }));
  if (pillars.length < 4 || pillars.some(p => p.g < 0 || p.z < 0)) return null;
  return pillars;
}

function analyze(a, ctx) {
  const y = ctx.y, m = ctx.m, d = ctx.d, h = ctx.h, mi = ctx.mi, gender = ctx.gender, lng = ctx.lng;
  const st = sunTime(h, mi, lng);
  const hourLocal = st.h;

  let pillars = null, ziwei = null, baziSrc = 'iztro';
  if (IZ) {
    try {
      const dateStr = `${y}-${m}-${d}`;
      const ti = hourLocal === 23 ? 12 : (hourLocal === 0 ? 0 : Math.floor((hourLocal + 1) / 2));
      const ast = IZ.astro.bySolar(dateStr, ti, gender === 'male' ? '男' : '女', true);
      pillars = baziOf(ast);
      ziwei = {
        five: ast.fiveElementsClass,
        sign: ast.sign, zodiac: ast.zodiac,
        soulBranch: ast.earthlyBranchOfSoulPalace,
        bodyBranch: ast.earthlyBranchOfBodyPalace,
        palaces: ast.palaces.map(p => ({
          name: p.name, branch: p.earthlyBranch, stem: p.heavenlyStem,
          major: (p.majorStars || []).map(s => ({ n: s.name, b: BRIGHT[s.brightness] || '' })),
          minor: (p.minorStars || []).map(s => s.name),
          body: !!p.isBodyPalace
        }))
      };
    } catch (e) { pillars = null; }
  }
  if (!pillars) { pillars = fallbackBazi(y, m, d, hourLocal); baziSrc = 'local'; }

  const s = signOf(m, d);
  const dayGan = pillars[2].g;
  const list = pillars.slice(0, 4).map((p, i) => ({ g: p.g, z: p.z, label: p.label, ss: i === 2 ? '日主' : shishen(dayGan, p.g).name }));

  const wx = [0, 0, 0, 0, 0];
  pillars.forEach(p => { wx[GAN_WX[p.g]] += 1.2; wx[ZHI_WX[p.z]] += 1; });

  const ssCount = { same: 0, out: 0, cai: 0, guan: 0, yin: 0 };
  pillars.forEach((p, i) => { if (i !== 2) ssCount[shishen(dayGan, p.g).key] += 1; });

  const n1 = ctx.n1 || ((y + m + d) % 8 + 1);
  const n2 = ctx.n2 || ((h + mi) % 8 + 1);
  const up = n1 % 8 || 8, low = n2 % 8 || 8;
  const move = ((n1 + n2) % 6) || 6;
  const upI = up - 1, lowI = low - 1;
  const lines = [];
  for (let i = 0; i < 3; i++) lines.push(BG[lowI].lines[i]);
  for (let i = 0; i < 3; i++) lines.push(BG[upI].lines[i]);
  const changed = lines.slice();
  changed[move - 1] = changed[move - 1] ? 0 : 1;
  const upC = changed[3] * 4 + changed[4] * 2 + changed[5];
  const lowC = changed[0] * 4 + changed[1] * 2 + changed[2];
  const findBg = c => BG.find(x => x.lines[0] * 4 + x.lines[1] * 2 + x.lines[2] === c) || BG[0];
  const ben = { up: BG[upI], low: BG[lowI], name: GUA64[upI][lowI] };
  const bian = { up: findBg(upC), low: findBg(lowC), name: GUA64[BG.indexOf(findBg(upC))][BG.indexOf(findBg(lowC))] };

  const ti = move <= 3 ? ben.up : ben.low;
  const yong = move <= 3 ? ben.low : ben.up;
  let tiYong = '比和';
  if (WX_SHENG[ti.wx] === yong.wx) tiYong = '体生用';
  else if (WX_SHENG[yong.wx] === ti.wx) tiYong = '用生体';
  else if (WX_KE[ti.wx] === yong.wx) tiYong = '体克用';
  else if (WX_KE[yong.wx] === ti.wx) tiYong = '用克体';

  const ans = ctx.mbti || [];
  const dims = { EI: 0, SN: 0, TF: 0, JP: 0 };
  QS.forEach((q, i) => { dims[q.d] += (ans[i] == null ? 0 : ans[i]); });
  const letters = {};
  Object.keys(LETTERS).forEach(k => {
    const L = LETTERS[k][0], R = LETTERS[k][1];
    letters[k] = dims[k] > 0 ? L : (dims[k] < 0 ? R : L);
  });
  const mbtiType = letters.EI + letters.SN + letters.TF + letters.JP;

  return { ctx, pillars: list, wx, ssCount, ziwei, sign: s, baziSrc,
    gua: { ben, bian, move, lines }, meihua: { ti, yong, rel: tiYong },
    mbti: { type: mbtiType, letters, dims } };
}

const DIMS = [
  { k: 'ord', n: '秩序感', d: '把混乱整理成结构' },
  { k: 'drv', n: '进取心', d: '往前推、要结果' },
  { k: 'warm', n: '共情度', d: '接得住别人的情绪' },
  { k: 'open', n: '探索欲', d: '对未知保持开放' },
  { k: 'grit', n: '抗压力', d: '在压力下不散架' }
];

function fuse(R) {
  const base = { ord: 50, drv: 50, warm: 50, open: 50, grit: 50 };
  const ev = [];
  const add = (src, k, v, why) => { base[k] += v; ev.push({ src, k, v, why }); };

  const L = R.mbti.letters;
  if (L.JP === 'J') add('MBTI', 'ord', 5, '偏 J：先定计划再动手');
  else add('MBTI', 'ord', -4, '偏 P：边走边调整');
  if (L.EI === 'E') { add('MBTI', 'drv', 3, '偏 E：从外部获取能量'); add('MBTI', 'warm', -1, '偏 E：话说得快，感受略粗'); }
  else { add('MBTI', 'warm', 3, '偏 I：内在消化多，感受更细'); add('MBTI', 'drv', -1, '偏 I：先想清楚再动'); }
  if (L.TF === 'F') { add('MBTI', 'warm', 5, '偏 F：以人的感受为先'); add('MBTI', 'ord', -2, '偏 F：规则会为人让路'); }
  else { add('MBTI', 'ord', 3, '偏 T：以逻辑与标准为先'); add('MBTI', 'warm', -3, '偏 T：先解决问题'); }
  if (L.SN === 'N') { add('MBTI', 'open', 5, '偏 N：对可能性敏感'); add('MBTI', 'ord', -1, '偏 N：细节容易被跳过'); }
  else { add('MBTI', 'open', -3, '偏 S：偏好已验证的方式'); add('MBTI', 'ord', 2, '偏 S：落实细节'); }
  add('MBTI', 'grit', 2, '四维取中，情绪波动通常较小');

  const sc = R.ssCount;
  if (sc.yin) add('八字', 'ord', sc.yin * 2.5, `印星 ${sc.yin} 个：重积累、重体系`);
  if (sc.yin) add('八字', 'warm', sc.yin * 1.5, `印星 ${sc.yin} 个：对被照顾与被理解敏感`);
  if (sc.guan) add('八字', 'ord', sc.guan * 2.5, `官杀 ${sc.guan} 个：对规则与评价敏感`);
  if (sc.guan) add('八字', 'grit', sc.guan * 2, `官杀 ${sc.guan} 个：长期承压能力`);
  if (sc.out) { add('八字', 'open', sc.out * 3, `食伤 ${sc.out} 个：表达与创造欲强`); add('八字', 'drv', sc.out * 1.5, `食伤 ${sc.out} 个：要把想法推出去`); }
  if (sc.cai) add('八字', 'drv', sc.cai * 3, `财星 ${sc.cai} 个：目标感与结果导向`);
  if (sc.same) add('八字', 'grit', sc.same * 2.5, `比劫 ${sc.same} 个：自我支撑、扛得住`);
  const wxMax = WX[R.wx.indexOf(Math.max(...R.wx))];
  if (wxMax === '土') add('八字', 'ord', 2, '土旺：稳、守、慢');
  if (wxMax === '火') add('八字', 'drv', 2, '火旺：快、热、要表达');
  if (wxMax === '水') add('八字', 'open', 2, '水旺：流动、适应、想得远');
  if (wxMax === '木') add('八字', 'open', 1.5, '木旺：生长欲与向外伸展');
  if (wxMax === '金') add('八字', 'ord', 1.5, '金旺：边界清晰、决断快');

  if (R.ziwei) {
    const soul = R.ziwei.palaces.find(p => p.name === '命宫');
    const majors = soul ? soul.major : [];
    if (!majors.length) add('紫微', 'ord', 1, '命宫无主星：借对宫之力，弹性大于定性');
    majors.forEach(st => {
      const k = ZW_KIND[st.n];
      if (!k) return;
      Object.keys(k).forEach(dim => add('紫微', dim, k[dim] * 0.9, `${st.n}坐命（${st.b}）：${DIMS.find(x => x.k === dim).n}`));
    });
  }

  const elMap = { 火: 'drv', 土: 'ord', 水: 'warm', 风: 'open' };
  add('星座', elMap[R.sign.el], 4, `${R.sign.n}·${R.sign.el}象：${R.sign.k}`);
  if (R.sign.mode === '固定') add('星座', 'grit', 3, `${R.sign.n}为固定宫：一旦认准就不轻易改`);
  if (R.sign.mode === '本位') add('星座', 'drv', 2, `${R.sign.n}为本位宫：习惯自己开局`);
  if (R.sign.mode === '变动') add('星座', 'open', 2, `${R.sign.n}为变动宫：随情境转向`);

  add('六爻', R.gua.ben.up.wx === '金' || R.gua.ben.up.wx === '木' ? 'drv' : 'ord', 2, `上卦${R.gua.ben.up.n}（${R.gua.ben.up.img}）：${R.gua.ben.up.kw}`);
  const lowK = { 乾: 'drv', 震: 'drv', 坤: 'warm', 兑: 'warm', 坎: 'grit', 离: 'open', 巽: 'open', 艮: 'ord' };
  add('六爻', lowK[R.gua.ben.low.n], 3, `下卦${R.gua.ben.low.n}（${R.gua.ben.low.img}）：底层的${R.gua.ben.low.kw}`);

  if (R.meihua.rel === '用生体') add('梅花', 'grit', 3, '用生体：外部在给你补给，恢复力好');
  if (R.meihua.rel === '体克用') add('梅花', 'drv', 3, '体克用：你能推动局面，主导感强');
  if (R.meihua.rel === '用克体') add('梅花', 'grit', -2, '用克体：眼下外压偏大，需要收着用力');
  if (R.meihua.rel === '体生用') add('梅花', 'warm', 2, '体生用：你在往外给，容易顾人忘己');
  if (R.meihua.rel === '比和') add('梅花', 'ord', 2, '体用比和：内外同频，节奏稳');

  const raw = DIMS.map(d => clamp(base[d.k], 0, 100));
  const mn = Math.min(...raw), mx = Math.max(...raw);
  const out = {};
  DIMS.forEach((d, i) => {
    out[d.k] = (mx - mn >= 8)
      ? clamp(Math.round(30 + (raw[i] - mn) / (mx - mn) * 62), 12, 94)
      : clamp(Math.round(50 + (raw[i] - 50) * 2.2), 12, 94);
  });
  return { scores: out, ev, raw };
}

function archetype(sc) {
  const rank = DIMS.map(d => ({ k: d.k, v: sc[d.k] })).sort((a, b) => b.v - a.v);
  const a = rank[0].k, b = rank[1].k, lo = rank[4].k;
  const T = {
    'ord+drv': ['建造者', '你不太相信"灵感"这种东西。你相信排期、验收和复盘，先把事情装进结构里，再让结构替你发力。'],
    'drv+ord': ['建造者', '你要的是把东西真的做出来。计划不是给别人看的，是你自己推进用的地图。'],
    'drv+grit': ['攻坚者', '越是有阻力的事，你越容易上头。你不是不怕难，你是不甘心停在"差一点"。'],
    'grit+drv': ['攻坚者', '你扛事的阈值比多数人高。别人撤退的位置，通常是你开始认真地方。'],
    'warm+ord': ['协调者', '你天然会照顾场上的气氛，但又不放任它散掉。你做的事，多半是让人能一起把事做完。'],
    'ord+warm': ['协调者', '你先把规则理顺，再在里面给人留出余地。你不太喜欢冲突，但你不怕定规矩。'],
    'open+warm': ['感受者', '你对人和气氛的变化很敏感，能听见没说出口的那半句。你的判断常从"感觉不对"开始。'],
    'warm+open': ['感受者', '你先感受到，再想明白。这让你显得体贴，也让你容易替别人多担一层。'],
    'open+drv': ['拓荒者', '你对"还没人做过"这件事有天然的兴趣，而且你不满足于想一想——你会真的开个头。'],
    'drv+open': ['拓荒者', '你要往前走，但不肯走别人走过的路。新鲜感对你不是消遣，是燃料。'],
    'ord+grit': ['守望者', '你擅长长期守住一件事。别人看不到进展的那段时间，正是你最有价值的时候。'],
    'grit+ord': ['守望者', '你不靠爆发力，你靠不出错。你的复利来自"一直在"。'],
    'warm+grit': ['托底者', '你在别人崩的时候反而稳。你不太表达，但你是那个让局面不塌的人。'],
    'grit+warm': ['托底者', '你能承住压力，也承得住别人的情绪。代价是你很少喊累。'],
    'open+grit': ['潜行者', '你在不确定里反而清醒。你不需要想清楚全部才出发，也不容易被一次失败定性。'],
    'grit+open': ['潜行者', '你耐受模糊，也耐受反复。你适合那种"没有标准答案、只能边走边校"的事。'],
    'ord+open': ['架构师', '你既想搞清楚底层逻辑，也想把它组织成可复用的东西。你讨厌重复劳动。'],
    'open+ord': ['架构师', '你先发散，再收敛成结构。你的价值在于把混乱的想法变成能跑的系统。'],
    'drv+warm': ['带队者', '你要结果，但你不靠压人拿结果。你更愿意让人自己愿意往前跑。'],
    'warm+drv': ['带队者', '你先让人安心，再谈目标。你知道人被接住了，才会真的出力。']
  };
  const t = T[a + '+' + b];
  return {
    name: t ? t[0] : '观察者',
    text: t ? t[1] : '你的五个维度比较均衡，没有哪一项压倒性地主导。这不是没有特点，而是你的特点是"看情况切换"——需要结构时给结构，需要温度时给温度。',
    top: DIMS.find(d => d.k === a).n,
    low: DIMS.find(d => d.k === lo).n,
    lowK: lo
  };
}

let CTX = { y: 1990, m: 1, d: 1, h: 12, mi: 0, gender: 'male', lng: 116.4, city: '北京', n1: null, n2: null, mbti: null };
let STEP = 1;
const ANS = new Array(QS.length).fill(null);
let RES = null;

function toast(m) {
  const t = $('#toast'); t.textContent = m; t.classList.add('on');
  clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('on'), 2400);
}

$('#start').onclick = () => {
  $('#intro').hidden = true;
  $('#form').hidden = false;
  STEP = 1; renderForm();
};

function renderForm() {
  $('#prog').style.width = (STEP / 3 * 100) + '%';
  $('#stepLabel').textContent = '0' + STEP + ' / 03 · ' + ['出生信息', '地点与时间校准', '六个问题'][STEP - 1];
  const b = $('#formBody');

  if (STEP === 1) {
    b.innerHTML = `
      <p class="q">先确认你出生那一刻的坐标</p>
      <p class="qs">时间越准，紫微与八字越准。不知道时辰就按正午排。</p>
      <div class="row2">
        <div class="fld"><label>出生年</label><select class="sel" id="fY">${yearsOpt()}</select></div>
        <div class="fld"><label>月 / 日</label>
          <div class="row2">
            <select class="sel" id="fM">${moOpt()}</select>
            <select class="sel" id="fD">${dayOpt()}</select>
          </div>
        </div>
      </div>
      <div class="fld"><label>出生时间（24 小时制）</label>
        <div class="row2">
          <select class="sel" id="fH">${hourOpt()}</select>
          <select class="sel" id="fMi">${['00','10','20','30','40','50'].map(x=>`<option>${x}</option>`).join('')}</select>
        </div>
      </div>
      <div class="fld"><label>性别（紫微盘按阴阳排）</label>
        <div class="seg" id="fG">
          <button data-v="male" class="on">男</button><button data-v="female">女</button>
        </div>
      </div>
      <div class="nav"><button class="pri" id="nA">下一步</button></div>`;
    $('#fY').value = CTX.y; $('#fM').value = CTX.m; $('#fD').value = CTX.d;
    $('#fH').value = CTX.h; $('#fMi').value = '00';
    $$('#fG button').forEach(x => x.onclick = () => { $$('#fG button').forEach(y => y.classList.remove('on')); x.classList.add('on'); CTX.gender = x.dataset.v; });
    $('#fM').onchange = () => { $('#fD').innerHTML = dayOpt(+$('#fM').value, +$('#fY').value); };
    $('#fY').onchange = () => { $('#fD').innerHTML = dayOpt(+$('#fM').value, +$('#fY').value); };
    $('#nA').onclick = () => { CTX.y = +$('#fY').value; CTX.m = +$('#fM').value; CTX.d = +$('#fD').value; CTX.h = +$('#fH').value; CTX.mi = +$('#fMi').value; STEP = 2; renderForm(); };
  }

  if (STEP === 2) {
    b.innerHTML = `
      <p class="q">出生地在哪</p>
      <p class="qs">经度决定真太阳时，时辰会因此偏 10–40 分钟。选城市即可，也可以手动填经度。</p>
      <div class="fld"><label>城市</label>
        <select class="sel" id="cCity">${CITIES.map(c=>`<option value="${c.n}">${c.n} · ${c.lng}°E</option>`).join('')}</select>
      </div>
      <div class="fld"><label>经度（可手动微调，东经为正）</label>
        <input class="inp" id="cLng" type="number" step="0.1" value="${CTX.lng}">
      </div>
      <div class="fld"><label>可选：想同时抽一卦吗，给两个 1–99 的数</label>
        <div class="row2">
          <input class="inp" id="cN1" type="number" min="1" max="99" placeholder="如 37">
          <input class="inp" id="cN2" type="number" min="1" max="99" placeholder="如 58">
        </div>
      </div>
      <div class="nav"><button id="bA">上一步</button><button class="pri" id="nB">下一步</button></div>`;
    $('#cCity').value = CTX.city;
    $('#cCity').onchange = () => { const c = CITIES.find(x => x.n === $('#cCity').value); if (c) $('#cLng').value = c.lng; };
    $('#bA').onclick = () => { STEP = 1; renderForm(); };
    $('#nB').onclick = () => {
      CTX.city = $('#cCity').value;
      CTX.lng = +$('#cLng').value || 116.4;
      const a = +$('#cN1').value, bb = +$('#cN2').value;
      CTX.n1 = a > 0 ? a : null; CTX.n2 = bb > 0 ? bb : null;
      STEP = 3; renderForm();
    };
  }

  if (STEP === 3) {
    b.innerHTML = `
      <p class="q">最后，六个问题</p>
      <p class="qs">不是标准心理量表，只是用来判断你更靠哪一侧。凭第一反应选，别想太久。</p>
      ${QS.map((q, i) => `
        <div class="qi">
          <div class="qt">${i + 1}. ${q.t}</div>
          <div class="scale" data-i="${i}">
            ${[2, 1, 0, -1, -2].map((v, j) => `<button data-v="${v}" class="${ANS[i] === v ? 'on' : ''}">${j === 0 ? q.a : j === 1 ? '偏 ' + q.a : j === 2 ? '都不像' : j === 3 ? '偏 ' + q.b : q.b}</button>`).join('')}
          </div>
        </div>`).join('')}
      <div class="nav"><button id="bB">上一步</button><button class="pri" id="go">开始照见</button></div>`;
    $$('.scale').forEach(sc => $$('button', sc).forEach(btn => {
      btn.onclick = () => {
        const i = +sc.dataset.i;
        $$('button', sc).forEach(x => x.classList.remove('on'));
        btn.classList.add('on');
        ANS[i] = +btn.dataset.v;
      };
    }));
    $('#bB').onclick = () => { STEP = 2; renderForm(); };
    $('#go').onclick = () => {
      if (ANS.some(v => v === null)) return toast('还有题没选');
      CTX.mbti = ANS.slice();
      run();
    };
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function yearsOpt() {
  let s = '';
  for (let y = 2020; y >= 1940; y--) s += `<option value="${y}">${y} 年</option>`;
  return s;
}
function moOpt() { return Array.from({ length: 12 }, (_, i) => `<option value="${i + 1}">${i + 1} 月</option>`).join(''); }
function dayOpt(m = 1, y = 1990) {
  const n = new Date(y, m, 0).getDate();
  return Array.from({ length: n }, (_, i) => `<option value="${i + 1}">${i + 1} 日</option>`).join('');
}
function hourOpt() {
  return Array.from({ length: 24 }, (_, i) => `<option value="${i}">${String(i).padStart(2, '0')} 时</option>`).join('');
}

async function run() {
  const go = $('#go'); if (go) { go.disabled = true; go.textContent = '正在排盘…'; }
  await engineReady;
  RES = analyze(null, CTX);
  const F = fuse(RES);
  RES.fused = F;
  RES.arch = archetype(F.scores);
  window.__psy = RES;
  $('#form').hidden = true;
  $('#result').hidden = false;
  renderResult();
  window.scrollTo({ top: 0, behavior: 'auto' });
}

function renderResult() {
  const R = RES, sc = R.fused.scores, arch = R.arch;
  const sorted = DIMS.map(d => ({ ...d, v: sc[d.k] })).sort((a, b) => b.v - a.v);
  $('#hdRight').textContent = R.mbti.type + ' · ' + R.sign.n;
  $('#resultBody').innerHTML = `
    <div class="verdict">
      <div class="tag">照见结果 · ${esc(R.mbti.type)}</div>
      <h2>${esc(arch.name)}</h2>
      <p>${esc(arch.text)}</p>
      <div class="arche">
        <span>最强：${sorted[0].n} ${sorted[0].v}</span>
        <span>最弱：${sorted[4].n} ${sorted[4].v}</span>
        <span>${R.ziwei ? '紫微 ' + esc(R.ziwei.five) : '紫微未排'}</span>
      </div>
    </div>

    <div class="panel">
      <h3>五个维度</h3>
      <div class="sub">六个体系各自打分，同一把尺子上量出来</div>
      <div class="radar-wrap"><svg id="radar" viewBox="0 0 300 300"></svg></div>
      <div class="dims">
        ${DIMS.map(d => `<div class="dim"><span class="n">${d.n}</span><span class="t"><i data-w="${sc[d.k]}"></i></span><span class="v" data-c="${sc[d.k]}">0</span></div>`).join('')}
      </div>
    </div>

    <div class="sec-t">六面镜子</div>
    <div class="grid">
      ${cardBazi(R)}
      ${cardZiwei(R)}
      ${cardSign(R)}
      ${cardLiuyao(R)}
      ${cardMeihua(R)}
      ${cardMBTI(R)}
    </div>

    <div class="panel ev">
      <h3>这个分数是怎么来的</h3>
      <div class="sub">每一条加减都写出来，可核对、可反驳</div>
      <div style="margin-top:8px">
        ${R.fused.ev.map(e => `<div class="e"><span class="src">${esc(e.src)}</span><span class="txt">${esc(e.why)}</span><span class="d ${e.v < 0 ? 'neg' : ''}">${e.v > 0 ? '+' : ''}${trim(e.v)}</span></div>`).join('')}
      </div>
    </div>

    <div class="disclaim">
      这不是预测。八字、紫微、星座是传统文化里的观察语言，六爻与梅花是当下的象，MBTI 是简化模型——它们都不能决定你会遇到什么。这套工具只做一件事：把不同体系里关于"你"的描述，放到同一把尺子上，让你看见哪些是重复出现的、哪些其实互相矛盾。<br><br>
      数据只存在你这台设备的浏览器里，不上传。排盘引擎来自开源项目 iztro，若网络不通会退回本地简化算法。
    </div>

    <div class="again">
      <button id="re">重新看一次</button>
      <button class="pri" id="share">复制结果摘要</button>
    </div>`;

  $$('.card-h').forEach(h => h.onclick = () => {
    const c = h.parentElement;
    const open = c.classList.contains('open');
    $$('.card').forEach(x => x.classList.remove('open'));
    if (!open) c.classList.add('open');
  });
  $$('.card')[0].classList.add('open');
  drawZiwei();

  animBars();
  drawRadar(sc);
  $('#re').onclick = () => {
    $('#result').hidden = true; $('#form').hidden = false; STEP = 1; renderForm();
    window.scrollTo({ top: 0 });
  };
  $('#share').onclick = () => {
    const txt = `照见 · ${R.mbti.type} / ${R.sign.n} / ${R.arch.name}` +
      DIMS.map(d => `${d.n} ${sc[d.k]}`).join(' · ') +
      `八字 ${R.pillars.map(p => GAN[p.g] + ZHI[p.z]).join(' ')}` +
      `六爻 ${R.gua.ben.name}${R.gua.bian.name !== R.gua.ben.name ? ' 之 ' + R.gua.bian.name : ''}`;
    navigator.clipboard?.writeText(txt).then(() => toast('已复制'), () => toast('复制失败，长按选择吧'));
  };
}

function trim(v) { return Math.round(v * 10) / 10; }

function cardBazi(R) {
  const p = R.pillars;
  const wxSum = R.wx.reduce((a, b) => a + b, 0) || 1;
  return `<div class="card">
    <div class="card-h"><div class="ic">八</div><div class="tt"><b>八字 · 你的底色</b>
      <i>${p.map(x => GAN[x.g] + ZHI[x.z]).join(' ')}${R.baziSrc === 'local' ? ' · 本地近似' : ''}</i></div><span class="chev">›</span></div>
    <div class="card-b"><div class="in">
      <div class="pillars">
        ${p.map(x => `<div class="pil"><div class="lb">${x.label}柱</div><div class="gz"><em>${GAN[x.g]}</em><em>${ZHI[x.z]}</em></div><div class="ss">${x.ss}</div></div>`).join('')}
      </div>
      <div class="wx">
        ${R.wx.map((v, i) => `<div><i style="height:${(v / Math.max(...R.wx, 1) * 100)}%;background:${WX_COLOR[i]}"></i></div>`).join('')}
      </div>
      <div class="wx-l">${WX.map((w, i) => `<span>${w} ${Math.round(R.wx[i] * 10) / 10}</span>`).join('')}</div>
      <div class="kv"><b>日主</b><span>${GAN[p[2].g]}${WX[GAN_WX[p[2].g]]} · ${R.wx[GAN_WX[p[2].g]] >= wxSum * 0.42 ? '偏旺，自我支撑足' : '偏弱，容易被环境带走'}</span></div>
      <div class="kv"><b>十神</b><span>${Object.entries(R.ssCount).filter(([, v]) => v).map(([k, v]) => SHISHEN_NAME[k][0] + '类 ' + v).join('、') || '—'}</span></div>
      <div class="kv"><b>看什么</b><span>印多的人先求稳，食伤多的人先要表达，官杀多的人先看规则，财多的人先看结果。</span></div>
    </div></div>
  </div>`;
}

function cardZiwei(R) {
  if (!R.ziwei) return `<div class="card"><div class="card-h"><div class="ic">紫</div><div class="tt"><b>紫微斗数</b><i>排盘引擎没加载上，本项跳过</i></div></div></div>`;
  const soul = R.ziwei.palaces.find(p => p.name === '命宫');
  const maj = soul ? soul.major.map(s => s.n + (s.b ? '（' + s.b + '）' : '')).join('、') : '';
  return `<div class="card" data-ziwei="1">
    <div class="card-h"><div class="ic">紫</div><div class="tt"><b>紫微 · 你落在哪一格</b>
      <i>${R.ziwei.five} · 命宫${maj ? ' ' + maj : '无主星'}</i></div><span class="chev">›</span></div>
    <div class="card-b"><div class="in">
      <div class="zw" id="zwBoard"></div>
      <div class="kv"><b>命宫</b><span>${esc(soul ? soul.stem + soul.branch : '')}${maj ? ' · ' + esc(maj) : ''}</span></div>
      <div class="kv"><b>身宫</b><span>落在 ${esc(R.ziwei.bodyBranch)} 宫，${esc((R.ziwei.palaces.find(p => p.branch === R.ziwei.bodyBranch) || {}).name || '')}，代表你后天用力最多的地方</span></div>
      <div class="kv"><b>看什么</b><span>命宫主星是"你习惯用什么姿态应对世界"，不是好坏。杀破狼看行动，机月同梁看周旋，紫府看统筹。</span></div>
    </div></div>
  </div>`;
}

function cardSign(R) {
  const s = R.sign;
  return `<div class="card">
    <div class="card-h"><div class="ic">星</div><div class="tt"><b>星座 · 你的季节</b>
      <i>${s.n} · ${s.el}象 · ${s.mode}宫</i></div><span class="chev">›</span></div>
    <div class="card-b"><div class="in">
      <p style="margin:0">${esc(s.k)}。</p>
      <div class="kv"><b>元素</b><span>${s.el}象：${s.el === '火' ? '先行动，后解释' : s.el === '土' ? '先落地，再谈意义' : s.el === '水' ? '先感受，再判断' : '先理解，再投入'}</span></div>
      <div class="kv"><b>模式</b><span>${s.mode}宫：${s.mode === '本位' ? '自己开局' : s.mode === '固定' ? '认准就不改' : '随情境转向'}</span></div>
      <div class="kv"><b>边界</b><span>这一项只看太阳星座，没有算月亮与上升——所以它只说明你"对外呈现的季节"，不说明全部。</span></div>
    </div></div>
  </div>`;
}

function cardLiuyao(R) {
  const g = R.gua;
  const rows = g.lines.map((v, i) => ({ v, i })).reverse();
  return `<div class="card">
    <div class="card-h"><div class="ic">爻</div><div class="tt"><b>六爻 · 此刻的势</b>
      <i>${esc(g.ben.name)}${g.bian.name !== g.ben.name ? ' 之 ' + esc(g.bian.name) : ''} · 动第 ${g.move} 爻</i></div><span class="chev">›</span></div>
    <div class="card-b"><div class="in">
      <div class="gua">
        <div class="g">
          ${rows.map(r => `<div class="l ${r.v ? '' : 'yinx'} ${r.i === g.move - 1 ? 'mv' : ''}">${r.v ? '<i></i>' : '<i></i><i></i>'}</div>`).join('')}
        </div>
        ${g.bian.name !== g.ben.name ? `<div class="g">
          ${rows.map((r, k) => { const idx = 5 - k; const cv = idx === (g.move - 1) ? (r.v ? 0 : 1) : r.v; return `<div class="l ${cv ? '' : 'yinx'}">${cv ? '<i></i>' : '<i></i><i></i>'}</div>`; }).join('')}
        </div>` : ''}
      </div>
      <div class="gname">${esc(g.ben.name)}${g.bian.name !== g.ben.name ? ' → ' + esc(g.bian.name) : ''}</div>
      <div class="gnote">上${g.ben.up.n}（${g.ben.up.img}） · 下${g.ben.low.n}（${g.ben.low.img}） · 动爻 ${g.move}</div>
      <div class="kv"><b>象意</b><span>上面是${g.ben.up.img}，${g.ben.up.kw}；下面是${g.ben.low.img}，${g.ben.low.kw}。${imgSentence(g.ben)}</span></div>
      <div class="kv"><b>动爻</b><span>第 ${g.move} 爻动，说明变化发生在${['最底层','内里','过渡处','外缘','上层','最外层'][g.move - 1]}——那里最不稳，也最可能先动。</span></div>
      <div class="kv"><b>边界</b><span>这一版只做象意层，没有纳甲装卦与六亲，所以看"势"的方向，不看具体应期。</span></div>
    </div></div>
  </div>`;
}
function imgSentence(g) {
  const A = { 天: '刚在上，事情有一个明确的方向', 泽: '悦在上，局面偏松，话说得开', 火: '明在上，看清了才动', 雷: '动在上，起势快，收尾要留意', 风: '入在上，一点点渗进去', 水: '险在上，先别急着过', 山: '止在上，该停一停', 地: '顺在上，接着走就行' }[g.up.img] || '';
  const B = { 天: '底下是刚，硬撑', 泽: '底下是悦，有弹性', 火: '底下有火，憋着一股劲', 雷: '底下在动，根上不安分', 风: '底下是风，心念散', 水: '底下是水，暗流在', 山: '底下是山，稳但沉', 地: '底下是地，厚而慢' }[g.low.img] || '';
  return A + '；' + B + '。';
}

function cardMeihua(R) {
  const m = R.meihua;
  const map = {
    用生体: ['顺', '外面在给你补给，你只需要接住。这时候别硬推，借力比使劲划算。'],
    体克用: ['可控', '局面在你手里，你能推动它。注意别用力过猛，克得太紧会反弹。'],
    用克体: ['收', '外部压力大于你的余量，先守住核心，别同时开三条战线。'],
    体生用: ['耗', '你在往外给，给得多、回得少。这不是坏事，但要记得补。'],
    比和: ['稳', '内外同频，节奏对得上。适合把手上这件事往前推一格。']
  }[m.rel] || ['平', ''];
  return `<div class="card">
    <div class="card-h"><div class="ic">梅</div><div class="tt"><b>梅花易数 · 体与用</b>
      <i>${m.rel} · 体${m.ti.n}(${m.ti.wx}) 用${m.yong.n}(${m.yong.wx})</i></div><span class="chev">›</span></div>
    <div class="card-b"><div class="in">
      <div class="kv"><b>结论</b><span>${map[0]}</span></div>
      <p style="margin:10px 0 0">${map[1]}</p>
      <div class="kv"><b>怎么来的</b><span>两个数起上下卦：${m.ti.n}为体（你），${m.yong.n}为用（事）。${m.ti.wx}与${m.yong.wx}的生克决定这一格的走向。</span></div>
    </div></div>
  </div>`;
}

function cardMBTI(R) {
  const t = R.mbti.type, L = R.mbti.letters, d = R.mbti.dims;
  const max = 6;
  const bar = (a, bb, v) => {
    const pct = Math.min(100, Math.abs(v) / max * 100) / 2;
    return `<div class="r"><span>${a}</span><span class="t"><i style="left:${v > 0 ? (50 - pct) + '%' : '50%'};width:${pct}%"></i></span><span style="text-align:right">${bb}</span></div>`;
  };
  return `<div class="card">
    <div class="card-h"><div class="ic">M</div><div class="tt"><b>MBTI · ${t}</b>
      <i>${describeMBTI(t)}</i></div><span class="chev">›</span></div>
    <div class="card-b"><div class="in">
      <div class="mb">
        ${bar('E', 'I', d.EI)}${bar('S', 'N', d.SN)}${bar('T', 'F', d.TF)}${bar('J', 'P', d.JP)}
      </div>
      <div class="kv"><b>四维</b><span>${L.EI === 'E' ? '外向' : '内向'} · ${L.SN === 'N' ? '直觉' : '实感'} · ${L.TF === 'T' ? '思考' : '情感'} · ${L.JP === 'J' ? '判断' : '知觉'}</span></div>
      <div class="kv"><b>边界</b><span>12 道题的简化版，只用来给五维定一个方向，不能当专业测评结论。</span></div>
    </div></div>
  </div>`;
}
function describeMBTI(t) {
  const E = t[0] === 'E' ? '外面的事让你有劲' : '里面的事让你回血';
  const S = t[1] === 'N' ? '你先看可能' : '你先看事实';
  const T = t[2] === 'F' ? '你先顾人' : '你先讲理';
  const J = t[3] === 'J' ? '你要先定下来' : '你要留活口';
  return `${E}，${S}，${T}，${J}`;
}

function animBars() {
  requestAnimationFrame(() => {
    $$('[data-w]').forEach(el => { el.style.width = el.dataset.w + '%'; });
    $$('[data-c]').forEach(el => {
      const target = +el.dataset.c; let v = 0;
      const step = () => { v += target / 28; if (v < target) { el.textContent = Math.round(v); requestAnimationFrame(step); } else el.textContent = target; };
      step();
    });
  });
}

function drawRadar(sc) {
  const svg = $('#radar'); if (!svg) return;
  const cx = 150, cy = 150, R0 = 96;
  const keys = DIMS.map(d => d.k);
  const ang = i => (-Math.PI / 2) + i * (Math.PI * 2 / keys.length);
  const pt = (i, r) => [cx + Math.cos(ang(i)) * r, cy + Math.sin(ang(i)) * r];
  let g = '';
  [0.25, 0.5, 0.75, 1].forEach(f => {
    const p = keys.map((_, i) => pt(i, R0 * f).join(',')).join(' ');
    g += `<polygon points="${p}" fill="none" stroke="rgba(255,255,255,${f === 1 ? 0.18 : 0.07})" stroke-width="1"/>`;
  });
  keys.forEach((k, i) => {
    const a = pt(i, R0 + 26);
    g += `<text x="${a[0]}" y="${a[1]}" fill="rgba(255,255,255,.55)" font-size="11" text-anchor="middle" dominant-baseline="middle" font-family="inherit">${DIMS[i].n}</text>`;
    const b = pt(i, R0 - 14);
    g += `<text x="${b[0]}" y="${b[1]}" fill="rgba(255,255,255,.75)" font-size="12" font-weight="700" text-anchor="middle" dominant-baseline="middle" font-family="inherit">${sc[k]}</text>`;
  });
  svg.innerHTML = `<defs><radialGradient id="rg"><stop offset="0%" stop-color="rgba(124,140,255,.42)"/><stop offset="100%" stop-color="rgba(160,107,255,.06)"/></radialGradient></defs>` + g +
    `<polygon id="radarPoly" points="${keys.map((_, i) => pt(i, 0).join(',')).join(' ')}" fill="url(#rg)" stroke="rgba(160,107,255,.9)" stroke-width="1.6" stroke-linejoin="round"/>`;
  const poly = svg.querySelector('#radarPoly');
  let t0 = null;
  const tick = ts => {
    if (!t0) t0 = ts;
    const p = Math.min(1, (ts - t0) / 1200);
    const e = 1 - Math.pow(1 - p, 3);
    poly.setAttribute('points', keys.map((k, i) => pt(i, R0 * (sc[k] / 100) * e).join(',')).join(' '));
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function drawZiwei() {
  const R = RES, zw = R && R.ziwei; const board = $('#zwBoard');
  if (!zw || !board) return;
  const POS = {
    巳: [1, 1], 午: [1, 2], 未: [1, 3], 申: [1, 4],
    辰: [2, 1], 酉: [2, 4],
    卯: [3, 1], 戌: [3, 4],
    寅: [4, 1], 丑: [4, 2], 子: [4, 3], 亥: [4, 4]
  };
  const cells = zw.palaces.map(p => {
    const pos = POS[p.branch]; if (!pos) return '';
    const stars = p.major.map(s => `${s.n}${s.b ? '<small style="opacity:.55">' + s.b + '</small>' : ''}`).join('·');
    const minors = p.minor.slice(0, 2).join('·');
    return `<div class="cell ${p.name === '命宫' ? 'soul' : ''} ${p.body ? 'body' : ''}" style="grid-area:${pos[0]}/${pos[1]}">
      <div class="pn">${p.name} ${p.stem}${p.branch}</div>
      <div class="star">${stars || '<span style="color:var(--ink3);font-weight:400">空宫</span>'}</div>
      <div class="mn">${minors}</div>
    </div>`;
  }).join('');
  const soul = zw.palaces.find(p => p.name === '命宫');
  board.innerHTML = cells + `<div class="mid">
    <b>${zw.five}</b>
    <span>命宫 ${soul ? soul.stem + soul.branch : ''}<br>身宫 ${zw.bodyBranch}<br>${zw.zodiac}年</span>
  </div>`;
}

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

engineReady.then(() => { if (!IZ) toast('排盘引擎没加载上，已切到本地简化版'); });
