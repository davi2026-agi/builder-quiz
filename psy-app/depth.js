/* 照见 · 深度层：生年四化 / 自化 / 格局 / 互错综卦
   规则来源：
   - 四化表、格局判定口径、自化检测，参考 Renhuai123/ziwei-doushu（代码 MIT，数据集 CC BY 4.0，作者 王多鱼AI），本页只取公开规则自行实现，未使用其数据集文本
   - 六爻互卦/错卦/综卦取法，参考 hhszzzz/taibu 的 taibu-core（MIT）
*/
'use strict';
(function () {
  const SIHUA = [
    ['廉贞', '破军', '武曲', '太阳'],
    ['天机', '天梁', '紫微', '太阴'],
    ['天同', '天机', '文昌', '廉贞'],
    ['太阴', '天同', '天机', '巨门'],
    ['贪狼', '太阴', '右弼', '天机'],
    ['武曲', '贪狼', '天梁', '文曲'],
    ['太阳', '武曲', '太阴', '天同'],
    ['巨门', '太阳', '文曲', '文昌'],
    ['天梁', '紫微', '左辅', '武曲'],
    ['破军', '巨门', '太阴', '贪狼']
  ];
  const HUA = ['禄', '权', '科', '忌'];
  const HC = { 禄: '#ff8a6b', 权: '#b18cff', 科: '#6fc3ff', 忌: '#8f95a6' };
  const SHA = ['擎羊', '陀罗', '火星', '铃星', '地空', '地劫'];

  const namesOf = p => (p.major || []).map(s => s.n);
  const allOf = p => namesOf(p).concat(p.minor || []);
  const hasAll = (p, x) => allOf(p).includes(x);

  document.head.insertAdjacentHTML('beforeend', `<style>
.zw .cell{position:relative}
.zw .cell .hh{position:absolute;right:3px;top:2px;font-size:8px;line-height:1.3;padding:0 2px;
  border:1px solid;border-radius:3px;background:rgba(0,0,0,.35);font-weight:500;letter-spacing:0}
.zw .cell .hh.sh{right:3px;top:13px;color:#9aa;border-color:rgba(255,255,255,.18)}
.zw .cell.soul .hh, .zw .cell.body .hh{background:rgba(0,0,0,.5)}
.rules{display:flex;gap:6px;flex-wrap:wrap;margin:10px 0 2px}
.rules span{font-size:10.5px;padding:3px 7px;border-radius:99px;border:1px solid var(--line);color:var(--ink3)}
.rules b{font-weight:600}
.pat{margin-top:10px;padding:11px 12px;border-radius:13px;border:1px solid var(--line);background:rgba(255,255,255,.035)}
.pat .ph{display:flex;align-items:center;gap:8px}
.pat .ph b{font-size:13.5px;font-weight:600;color:#fff}
.pat .lv{font-size:9.5px;padding:1px 7px;border-radius:99px;border:1px solid;letter-spacing:.04em}
.pat .lv.excellent{color:#5eead4;border-color:rgba(94,234,212,.45)}
.pat .lv.good{color:#b18cff;border-color:rgba(177,140,255,.45)}
.pat .lv.caution{color:#ffb26b;border-color:rgba(255,178,107,.45)}
.pat p{margin:6px 0 0;font-size:12.5px;line-height:1.75;color:var(--ink2)}
.pat .br{margin-top:7px;font-size:11.5px;line-height:1.6;color:#ffb26b;opacity:.9}
.pat .src{margin-top:6px;font-size:10px;color:var(--ink3);letter-spacing:.02em}
</style>`);

  function huaOf(R) { return SIHUA[R.pillars[0].g] || null; }
  function palHua(p, tb) {
    if (!tb) return [];
    const ns = allOf(p);
    return HUA.filter((h, i) => tb[i] && ns.includes(tb[i]));
  }
  function palSelf(p) {
    const idx = GAN.indexOf(p.stem);
    if (idx < 0) return [];
    const tb = SIHUA[idx], ns = allOf(p);
    return HUA.filter((h, i) => ns.includes(tb[i]));
  }

  function sanFang(zw) {
    const soul = zw.palaces.find(p => p.name === '命宫');
    if (!soul) return null;
    const m = ZHI.indexOf(soul.branch);
    const branches = [m, (m + 4) % 12, (m + 8) % 12, (m + 6) % 12].map(i => ZHI[i]);
    return { soul, list: zw.palaces.filter(p => branches.includes(p.branch)) };
  }

  function judge(R) {
    const zw = R.ziwei;
    if (!zw) return [];
    const sf = sanFang(zw);
    if (!sf) return [];
    const maj = new Set(sf.list.flatMap(namesOf));
    const all = new Set(sf.list.flatMap(allOf));
    const shaN = sf.list.reduce((n, p) => n + allOf(p).filter(x => SHA.includes(x)).length, 0);
    const soulN = namesOf(sf.soul);
    const out = [];
    const bad = shaN >= 3;
    const add = (name, lv, text, src, br) => out.push({ n: name, lv: lv, t: text, src: src, br: br });

    if (soulN.includes('紫微') && soulN.includes('天府'))
      add('紫府同宫', bad ? 'good' : 'excellent',
        '紫微与天府同坐命宫，一主统御、一主库藏。这种人通常不急，喜欢把资源和人都安排到位后再动手；缺点是启动慢，容易等条件齐了才肯走。',
        '依《紫微斗数全书》紫府同宫格立格',
        bad ? '命宫三方煞星 ' + shaN + ' 颗，格不纯，贵气打折' : '');

    if (soulN.includes('紫微') && all.has('左辅') && all.has('右弼'))
      add('君臣庆会', bad ? 'good' : 'excellent',
        '紫微坐命，左辅右弼同会三方。核心能力不是自己多强，而是让人愿意跟着干。这类盘多出现在带队、统筹、跨部门协调的位置上。',
        '依《紫微斗数全书》君臣庆会格立格',
        bad ? '三方煞重，人多但不易拢住' : '');

    const fu = zw.palaces.find(p => hasAll(p, '天府'));
    const xiang = zw.palaces.find(p => hasAll(p, '天相'));
    if (fu && xiang && fu.branch !== xiang.branch
      && sf.list.some(p => p.branch === fu.branch) && sf.list.some(p => p.branch === xiang.branch))
      add('府相朝垣', bad ? 'good' : 'excellent',
        '天府天相分守命宫三方，一守一佐。适合在体系内做事：把流程、钱、人稳住，位置越久越值钱，不宜频繁换赛道。',
        '依《紫微斗数全书》府相朝垣格立格',
        bad ? '三方煞星偏多，稳中带耗' : '');

    if (maj.has('七杀') && maj.has('破军') && maj.has('贪狼'))
      add('杀破狼', shaN >= 3 ? 'caution' : 'good',
        '七杀、破军、贪狼三星会命。典型的“换轨型”命格：不甘于按部就班，每隔几年就要推翻重来一次。前半程靠冲劲，后半程才靠守成，冲动期最容易吃亏。',
        '依《紫微斗数全书》杀破狼格立格',
        shaN >= 3 ? '三方煞星 ' + shaN + ' 颗，动而无成之象，宜先修一件事到底' : '');

    if (maj.has('天机') && maj.has('太阴') && maj.has('天同') && maj.has('天梁'))
      add('机月同梁', bad ? 'good' : 'excellent',
        '机月同梁四星齐会命迁财官。脑子快、心思细、不耐粗活，适合专业岗、研究、文书、医疗、教培这类靠积累吃饭的路子；不适合赌性大的事。',
        '依《紫微斗数全书》机月同梁格立格',
        bad ? '机月同梁忌煞，煞重则谋而不断' : '');

    const sun = zw.palaces.find(p => hasAll(p, '太阳'));
    const moon = zw.palaces.find(p => hasAll(p, '太阴'));
    if (sun && moon && sun.branch === moon.branch && sf.list.some(p => p.branch === sun.branch))
      add('日月同宫', 'good',
        '太阳太阴同宫，明暗同在一位。这类人常常两套标准并存：对外一套、对内一套，白天一个状态、夜里另一个状态。整合得好是通透，整合不好就是反复。',
        '依《紫微斗数全书》日月同宫格立格', '');

    return out.slice(0, 3);
  }

  window.drawZiwei = function () {
    const R = RES, zw = R && R.ziwei; const board = $('#zwBoard');
    if (!zw || !board) return;
    const tb = huaOf(R);
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
      const hs = palHua(p, tb);
      const sh = palSelf(p);
      const badges = hs.map(h => `<span class="hh" style="color:${HC[h]};border-color:${HC[h]}66">${h}</span>`).join('')
        + (sh.length ? `<span class="hh sh">${sh.map(h => '自' + h).join('')}</span>` : '');
      return `<div class="cell ${p.name === '命宫' ? 'soul' : ''} ${p.body ? 'body' : ''}" style="grid-area:${pos[0]}/${pos[1]}">
        <div class="pn">${p.name} ${p.stem}${p.branch}</div>
        <div class="star">${stars || '<span style="color:var(--ink3);font-weight:400">空宫</span>'}</div>
        <div class="mn">${minors}</div>
        ${badges}
      </div>`;
    }).join('');
    const soul = zw.palaces.find(p => p.name === '命宫');
    board.innerHTML = cells + `<div class="mid">
      <b>${zw.five}</b>
      <span>命宫 ${soul ? soul.stem + soul.branch : ''}<br>身宫 ${zw.bodyBranch}<br>${zw.zodiac}年</span>
    </div>`;
  };

  const _cardZiwei = window.cardZiwei;
  window.cardZiwei = function (R) {
    if (!R.ziwei) return _cardZiwei(R);
    const zw = R.ziwei, tb = huaOf(R), sf = sanFang(zw), pats = judge(R);
    const soul = zw.palaces.find(p => p.name === '命宫');
    const maj = soul ? soul.major.map(s => s.n + (s.b ? '（' + s.b + '）' : '')).join('、') : '';
    const hs = soul ? palHua(soul, tb) : [];
    const shs = soul ? palSelf(soul) : [];
    const sanTxt = sf ? sf.list.map(p => `${p.name}·${namesOf(p).join('') || '空宫'}`).join(' / ') : '';
    const selfTxt = shs.length ? ` · 命宫自化${shs.join('')}` : '';
    return `<div class="card" data-ziwei="1">
      <div class="card-h"><div class="ic">紫</div><div class="tt"><b>紫微 · 你落在哪一格</b>
        <i>${zw.five} · 命宫${maj ? ' ' + maj : '无主星'}${pats.length ? ' · ' + pats[0].n : ''}</i></div><span class="chev">›</span></div>
      <div class="card-b"><div class="in">
        <div class="zw" id="zwBoard"></div>
        <div class="rules">
          ${tb ? HUA.map((h, i) => `<span style="color:${HC[h]}"><b>${tb[i]}</b>化${h}</span>`).join('') : ''}
        </div>
        <div class="kv"><b>生年四化</b><span>${tb ? `年干${GAN[R.pillars[0].g]}，${tb[0]}化禄、${tb[1]}化权、${tb[2]}化科、${tb[3]}化忌` : '—'}${hs.length ? `；命宫见${hs.join('')}${selfTxt}` : selfTxt}</span></div>
        <div class="kv"><b>三方四正</b><span>${esc(sanTxt)}</span></div>
        <div class="kv"><b>命宫</b><span>${esc(soul ? soul.stem + soul.branch : '')}${maj ? ' · ' + esc(maj) : ''}</span></div>
        <div class="kv"><b>身宫</b><span>落在${esc(zw.bodyBranch)}宫（${esc((zw.palaces.find(p => p.branch === zw.bodyBranch) || {}).name || '')}），代表你后天用力最多的地方</span></div>
        ${pats.length ? pats.map(p => `<div class="pat">
          <div class="ph"><b>${p.n}</b><span class="lv ${p.lv}">${p.lv === 'excellent' ? '成格' : p.lv === 'good' ? '成形' : '动格'}</span></div>
          <p>${p.t}</p>
          ${p.br ? `<div class="br">破格提示：${p.br}</div>` : ''}
          <div class="src">${p.src}</div>
        </div>`).join('') : `<div class="kv" style="margin-top:10px"><b>成格</b><span>未成常见正格，属杂格。多数盘都是杂格，这不代表差，只代表你的性格靠组合而非单一星曜。</span></div>`}
        <div class="kv"><b>看什么</b><span>命宫主星是“你习惯用什么姿态应对世界”，不是好坏。四化是“力往哪边使”：禄是资源、权是主导、科是名声、忌是死结。</span></div>
      </div></div>
    </div>`;
  };

  const _cardLiuyao = window.cardLiuyao;
  window.cardLiuyao = function (R) {
    let html = _cardLiuyao(R);
    try {
      const L = R.gua.lines;
      const tri = (a, b, c) => BG.find(x => x.lines[0] * 4 + x.lines[1] * 2 + x.lines[2] === (a * 4 + b * 2 + c)) || BG[0];
      const nameOf = (up, low) => GUA64[BG.indexOf(up)][BG.indexOf(low)];
      const huLow = tri(L[1], L[2], L[3]), huUp = tri(L[2], L[3], L[4]);
      const hu = nameOf(huUp, huLow);
      const cuoLow = tri(1 - L[0], 1 - L[1], 1 - L[2]), cuoUp = tri(1 - L[3], 1 - L[4], 1 - L[5]);
      const cuo = nameOf(cuoUp, cuoLow);
      const zoLow = tri(L[3], L[4], L[5]), zoUp = tri(L[0], L[1], L[2]);
      const zo = nameOf(zoUp, zoLow);
      const blk = `<div class="kv"><b>互错综</b><span>互卦 ${esc(hu)}（过程）· 错卦 ${esc(cuo)}（反面）· 综卦 ${esc(zo)}（换个角度看）</span></div>`;
      html = html.replace('<div class="kv"><b>边界</b>', blk + '<div class="kv"><b>边界</b>');
    } catch (e) { }
    return html;
  };

  const _fuse = window.fuse;
  window.fuse = function (R) {
    const F = _fuse(R);
    try {
      const tb = huaOf(R);
      const bump = (k, v, why, src) => {
        F.scores[k] = clamp(Math.round((F.scores[k] || 50) + v), 12, 94);
        F.ev.push({ src: src, k: k, v: v, why: why });
      };
      if (R.ziwei && tb) {
        const pal = h => {
          const st = tb[HUA.indexOf(h)];
          return (R.ziwei.palaces.find(p => allOf(p).includes(st)) || {}).name || '';
        };
        const lu = pal('禄'), quan = pal('权'), ji = pal('忌');
        if (lu === '财帛' || lu === '官禄') bump('drv', 2, `化禄入${lu}：资源到位感强，容易被推着要结果`, '紫微·四化');
        if (quan === '官禄' || quan === '命宫') bump('drv', 1.5, `化权入${quan}：愿意拍板、愿意担责`, '紫微·四化');
        if (ji === '命宫') bump('grit', 1.5, '化忌守命：长期有个解不开的结，也因此比同龄人耐熬', '紫微·四化');
        else if (ji === '福德') bump('warm', -1, '化忌入福德：内耗偏多，不太爱说', '紫微·四化');
      }
      const pats = judge(R);
      const top = pats[0];
      if (top) {
        const K = { 紫府同宫: 'ord', 君臣庆会: 'ord', 府相朝垣: 'ord', 机月同梁: 'ord', 杀破狼: 'drv', 日月同宫: 'open' }[top.n];
        if (K) bump(K, 2, `成${top.n}格：${top.lv === 'excellent' ? '格象完整' : top.lv === 'good' ? '成形但有杂' : '带破格之象'}`, '紫微·格局');
      }
    } catch (e) { }
    return F;
  };

  const _rr = window.renderResult;
  window.renderResult = function () {
    _rr();
    const d = document.querySelector('.disclaim');
    if (d && !d.dataset.src) {
      d.dataset.src = '1';
      d.insertAdjacentHTML('beforeend',
        `<br><br>四化表、格局判定口径与自化检测，参考开源项目 <b>Renhuai123/ziwei-doushu</b>（代码 MIT，数据集 CC BY 4.0，作者 王多鱼AI）；` +
        `六爻的互卦、错卦、综卦取法，参考 <b>hhszzzz/taibu</b> 的 taibu-core（MIT）。` +
        `本页只采用公开的规则与表，没有引入这两个项目的数据集文本。`);
    }
    drawZiwei();
  };

  window.__judge = judge;
})();
