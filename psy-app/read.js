/* 照见 · 评断层：判词 + 分维断语 + 我说不准的地方
   写法参量：
   - 解读骨架（命格总览 / 性格 / 感情 / 事业 / 财运 / 健康 / 迁移 / 人际 / 福德）参考 Renhuai123/ziwei-doushu
     的 13 维数据集维度划分（数据集 CC BY 4.0，作者 王多鱼AI），本页只借维度骨架与口径，不引用其断语文本
   - 输出纪律（结论先说、每条断语注明依据、建议针对本盘、拿不准直说两可）参考 hhszzzz/taibu 的解读方法卡
     （methods/*.md，仓库 MIT/AGPL 混合，本页只借方法论，未复制其文本）
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
  const SHA = ['擎羊', '陀罗', '火星', '铃星', '地空', '地劫'];
  const WXN = ['木', '火', '土', '金', '水'];

  document.head.insertAdjacentHTML('beforeend', `<style>
.read{margin:0 0 18px}
.judge{border:1px solid var(--line);border-radius:20px;padding:18px 16px 16px;
  background:linear-gradient(160deg,rgba(255,255,255,.055),rgba(255,255,255,.018))}
.judge .lv{display:inline-flex;gap:6px;align-items:center;font-size:9.5px;letter-spacing:.06em;
  color:var(--ink3);border:1px solid var(--line);border-radius:99px;padding:2px 8px}
.judge .lv b{font-weight:600;color:#fff}
.judge p{margin:11px 0 0;font-size:14px;line-height:1.95;color:#ece9f4}
.judge p em{font-style:normal;color:#ffd9a8}
.judge .k{margin-top:12px;font-size:10.5px;color:var(--ink3);line-height:1.7}
.says{margin-top:6px}
.say{border-top:1px solid rgba(255,255,255,.07);padding:13px 2px 12px}
.say .sh{display:flex;align-items:baseline;gap:8px}
.say .sh b{font-size:13.5px;font-weight:600;color:#fff;letter-spacing:.01em}
.say .sh i{font-size:9.5px;font-style:normal;color:var(--ink3);border:1px solid var(--line);
  border-radius:99px;padding:1px 6px}
.say p{margin:7px 0 0;font-size:12.5px;line-height:1.9;color:var(--ink2)}
.say .do{margin-top:7px;font-size:12px;line-height:1.8;color:#a7e8d6}
.say .ct{margin-top:6px;font-size:10px;line-height:1.6;color:var(--ink3)}
.unsure{margin-top:14px;border:1px solid var(--line);border-radius:16px;padding:13px 14px;
  background:rgba(255,255,255,.022)}
.unsure h4{margin:0 0 8px;font-size:11px;font-weight:600;color:var(--ink3);letter-spacing:.06em}
.unsure li{font-size:11.5px;line-height:1.85;color:var(--ink2);margin:0 0 4px}
.unsure ul{margin:0;padding-left:16px}
</style>`);

  const nm = p => (p.major || []).map(s => s.n);
  const all = p => nm(p).concat(p.minor || []);
  const pal = (zw, n) => zw.palaces.find(p => p.name === n);

  function starLine(stars) {
    if (!stars.length) return '多主星同宫';
    return stars.map(s => s.n + (s.b ? '（' + s.b + '）' : '')).join('、') + '坐命';
  }

  function facts(R) {
    const p = R.pillars, dayGan = p[2].g, wx = R.wx;
    const dayI = GAN_WX[dayGan], dayWx = WXN[dayI];
    const sum = wx.reduce((a, b) => a + b, 0) || 1;
    const maxWx = WXN[wx.indexOf(Math.max(...wx))], minWx = WXN[wx.indexOf(Math.min(...wx))];
    const dayShare = wx[dayI] / sum;
    const ss = R.ssCount, zw = R.ziwei;
    const kh = R.mbti.letters;
    const sc = R.fused.scores;
    const rank = DIMS.map(d => ({ k: d.k, n: d.n, v: sc[d.k] })).sort((a, b) => b.v - a.v);
    const f = {
      R, dayGan, dayWx, maxWx, minWx, dayShare, ss, kh, sc,
      top: rank[0], second: rank[1], low: rank[4], rank,
      soul: [], pats: [], hua: {}, selfHua: [], shaN: 0, zw: zw
    };
    if (zw) {
      const s = pal(zw, '命宫'); f.soul = s ? s.major : [];
      const ti = GAN.indexOf(p[0].g), tb = SIHUA[ti];
      if (tb) {
        HUA.forEach((h, i) => {
          const q = zw.palaces.find(x => all(x).includes(tb[i]));
          f.hua[h] = q ? q.name : '';
        });
      }
      const soulGan = s ? GAN.indexOf(s.stem) : -1;
      if (soulGan >= 0) {
        const st = SIHUA[soulGan];
        HUA.forEach((h, i) => { if (all(s).includes(st[i])) f.selfHua.push(h); });
      }
      f.shaN = zw.palaces.reduce((n, x) => n + all(x).filter(y => SHA.includes(y)).length, 0);
      f.pats = window.__judge ? window.__judge(R) : [];
      f.couple = pal(zw, '夫妻'); f.spirit = pal(zw, '福德');
      f.healthP = pal(zw, '疾厄'); f.moveP = pal(zw, '迁移');
      f.wealthP = pal(zw, '财帛'); f.careerP = pal(zw, '官禄');
      f.homeP = pal(zw, '田宅');
    }
    return f;
  }

  /* ── 判词：三句。命门一句、资本一句、转折一句 ── */
  function verdict(f) {
    const low = f.low.k, top = f.top.k;
    const gate = {
      warm: '你处理事情比处理人顺手：局面越乱你越稳，关系越近你越笨。',
      open: '你不做没把握的事。这条让你少踩坑，也让你错过那些当时看不清、后来变成机会的东西。',
      ord: '你不肯被一种活法定死，代价是你的本事一直是散的，没结成块。',
      drv: '你知道该往前一步，但你总在等一个更合适的时机，而时机很少是因为等才来的。',
      grit: '你不是扛不住，你是扛太久之后会突然断掉，而且断之前一声不响。'
    }[low];
    const cap = {
      ord: '你的本钱是把混乱整理成能跑的结构，别人接手你留下的东西会觉得清楚。',
      drv: '你的本钱是把想法推成结果，别人还在讨论，你已经动手了。',
      warm: '你的本钱是接得住别人的情绪，很多事是靠你没散掉。',
      open: '你的本钱是对没做过的事不害怕，别人看见风险，你看见入口。',
      grit: '你的本钱是在没有反馈的那段时间里还能继续做，这件事多数人做不到。'
    }[top];

    let turn = '';
    const p0 = f.pats[0];
    if (p0) {
      if (p0.lv === 'excellent') turn = `盘面上你是${p0.n}格，格象完整：${p0.n === '府相朝垣' ? '守成是你的正路，位置比速度值钱' : p0.n === '君臣庆会' ? '你的强项不在自己干，在让别人愿意跟着干' : p0.n === '机月同梁' ? '你适合靠积累吃饭的专业路子，不适合赌性大的事' : '这套组合少见，你能同时握住资源与名分'}。`;
      else if (p0.lv === 'caution') turn = `但你是${p0.n}格且带破：换轨的冲动是真的，${p0.br || '格不纯'}。这一条会反复出现，不是一次修完的事。`;
      else turn = `盘上是${p0.n}格，成形但有杂（${p0.br || '三方不够干净'}）。这决定了你走得动，但走不快。`;
    } else {
      turn = `盘上没成常见正格，属杂格。多数人都是杂格——意思是你的性格靠组合，不靠一颗星定调，所以别拿别人的模板套自己。`;
    }
    if (!turn) turn = '';

    const extra = [];
    if (f.hua['忌'] === '命宫') extra.push('化忌守命，你身上有个长期解不开的结，也正因为这个结，你比同龄人耐熬。');
    else if (f.hua['忌'] === '福德') extra.push('化忌在福德，内耗偏多：你把很多话在心里说完了一遍，就没打算再说给对方听。');
    if (f.selfHua.includes('忌')) extra.push('命宫自化忌，你对自己的要求会自己塌一次，再自己重建，别人插不上手。');

    return { gate, cap, turn: turn + (extra.length ? extra[0] : ''), extra };
  }

  /* ── 八段断语 ── */
  function sections(f) {
    const out = [];
    const P = (h, p, why, act, ct) => out.push({ h, p, why, act, ct });

    /* 1 性格底色 */
    {
      const wxLine = {
        木: '你靠不断往外长来维持状态，停下来会难受',
        火: '你要被看见，憋着会先烫到自己',
        土: '你靠稳定和重复拿到安全感',
        金: '你靠边界和标准确认自己站得住',
        水: '你靠观察和适应换到空间'
      }[f.dayWx];
      const starK = {
        武曲: '先算再动，不太会说软话', 天府: '守成，喜欢手里有余量', 紫微: '要位置，也要被当回事',
        天机: '脑子转得快，想多了就不动', 太阳: '想照人，也怕不被看见', 太阴: '感受细，话少',
        贪狼: '想体验，能同时开好几摊', 七杀: '要么不做，要么做绝', 破军: '隔几年就想推翻重来',
        天同: '图安稳，怕麻烦', 天梁: '讲原则，爱当长辈', 巨门: '嘴上功夫好，也容易招口舌',
        廉贞: '要体面，也记仇', 天相: '会做人，不爱撕破脸'
      }[f.soul[0] && f.soul[0].n] || '不靠单颗星定调，随场合切换';
      const tf = f.kh.TF === 'T' ? '你先讲对不对，再讲难不难听' : '你先顾人受不受得住，再谈对错';
      P('性格底色',
        `${wxLine}——这是你的本能。但${f.zw ? '命宫' + starLine(f.soul) : '八字原局'}，实际做法是${starK}。本能和做法并存的你，外人常觉得“看着热，其实算得很清”。${tf}，这是你决定事情时的顺序。`,
        `日主${GAN[f.dayGan]}${f.dayWx}、${f.zw ? '命宫' + starLine(f.soul) : '八字'}、MBTI ${f.R.mbti.type}`,
        f.kh.TF === 'T' ? '开会前把结论写下来，比临场圆场有效：你的强项是判断，不是润滑。' : '先给人一句确认，再讲你的判断；否则对方只听到后半句。',
        '高');
    }

    /* 2 做事与位置 */
    {
      const s = f.ss;
      let shape, shapeWhy;
      if (s.guan >= 2) { shape = '你适合在体系里靠位置吃饭：有明确的权责、有人给你压担子，你反而长得好'; shapeWhy = `官杀 ${s.guan} 个：对规则与评价敏感，也在意“该不该我”`; }
      else if (s.out >= 2) { shape = '你适合靠作品说话：写、讲、做出来给人看，比在组织里熬资历快'; shapeWhy = `食伤 ${s.out} 个：表达与创造欲强，压着会变形`; }
      else if (s.yin >= 2) { shape = '你适合靠资质与积累吃饭：证书、专业深度、别人替不了的手艺'; shapeWhy = `印星 ${s.yin} 个：重体系、重来路`; }
      else if (s.cai >= 2) { shape = '你适合直接对结果负责：给你提成、给你指标，比给你头衔有效'; shapeWhy = `财星 ${s.cai} 个：目标感强，看得到回报才愿意投入`; }
      else { shape = '你不受管，也不爱管人：单干或小团队里最舒展，大组织里会觉得处处别扭'; shapeWhy = '官杀与财星都不重，驱动力来自自己'; }
      const jp = f.kh.JP === 'J' ? '你是先定计划再动手的人，计划本身就是你的安全感' : '你是边走边调的人，计划太细反而会让你不想动';
      P('做事与位置', `${shape}。${jp}。`, shapeWhy + `；MBTI ${f.kh.JP}`,
        jp.startsWith('你是先定') ? '把目标拆到“这周能验收”的颗粒度，你才推得动。' : '给自己设一个两周的硬节点，只交一个粗糙版本，先让它存在。', '高');
    }

    /* 3 钱与资源 */
    {
      const lu = f.hua['禄'] || '', ji = f.hua['忌'] || '';
      let line, why;
      if (f.ss.cai >= 2 && f.dayShare < 0.3) { line = '你看得见钱，但抓钱的手不够硬：财多身弱，机会来了常常接不住'; why = `财星 ${f.ss.cai} 个而日主只占 ${(f.dayShare * 100).toFixed(0)}% 的力量`; }
      else if (lu === '财帛' || lu === '田宅') { line = '钱这件事你比多数人顺：化禄就落在钱与家的位置上，进项不全靠硬拼'; why = `化禄入${lu}`; }
      else if (ji === '财帛') { line = '钱是你的执念也是你的洞：化忌落财帛，越在意越容易在一个地方反复失血'; why = '化忌入财帛'; }
      else if (!f.ss.cai) { line = '你不是赚不到钱，是不拿钱当坐标：能撑住事，但不会主动谈价'; why = '原局无财星'; }
      else { line = '钱要靠一件事反复做深，不适合多头并进：你的财路是窄而深的，不是宽而快的'; why = `财星 ${f.ss.cai} 个，${f.zw ? '财帛宫' + (f.wealthP ? (nm(f.wealthP).join('') || '空宫') : '') : '日主' + f.dayWx}`; }
      P('钱与资源', `${line}。${f.zw && f.wealthP ? '财帛宫' + (nm(f.wealthP).join('') || '空宫，借对宫之力') + '，' : ''}你的钱运不是爆发型，是积累型。`, why,
        '把“能挣多少”换成“这件事我做第几遍”：你的收入曲线跟你对一件事的熟练度同形。', '中');
    }

    /* 4 关系 */
    {
      const cs = f.couple ? nm(f.couple) : [];
      const jiLove = f.hua['忌'] === '夫妻' || f.hua['忌'] === '福德';
      let line;
      if (!f.zw) line = '关系里你先要空间，再要亲密：被追问得太紧会退，退完又会觉得自己凉薄';
      else if (cs.includes('七杀') || cs.includes('破军') || cs.includes('贪狼')) {
        const one = cs.filter(x => ['七杀', '破军', '贪狼'].includes(x)).join('');
        line = `夫妻宫${one}（杀破狼之一）：你在关系里要空间、要新鲜感，最怕被“应该”绑住；稳定不是你的默认状态，是你要一次一次主动选的东西`;
      }
      else if (!cs.length) line = '夫妻宫空宫，借对宫定调：你常常是跟着对方的样子调整自己，久了会忘了自己原来要什么';
      else if (cs.includes('天相') || cs.includes('天府')) line = '夫妻宫' + cs.join('、') + '：你要的是能一起把日子过稳的人，不是让你心跳的人；选错了会觉得“没意思”，其实是“不安全”';
      else line = '夫妻宫' + cs.join('、') + '：你在关系里认真、也较真，容易把“对方不上心”读成“对方不爱”';
      P('关系', `${line}。${f.sc.warm < 45 ? '你的共情度偏低：你会替对方解决问题，但很少先替对方把情绪接住——对方要的往往不是方案。' : '你的共情度不低，问题在于你接得太多，把自己的那部分压下去了。'}`,
        (f.zw ? '夫妻宫' + (cs.join('') || '空宫') : '') + `；共情度 ${f.sc.warm}` + (jiLove ? '；化忌落' + f.hua['忌'] : ''),
        f.sc.warm < 45 ? '下次对方说事，先复述一句“你是觉得……对吗”，再给方案。顺序反了，方案再好也像指责。' : '每周留一次“不解决问题”的谈话，只说感受，你的关系会松很多。', '中');
    }

    /* 5 身体与耗损 */
    {
      const heat = { 火: '偏热、睡不沉、上火快', 木: '情绪堵在肝上，紧的时候肩颈先僵', 土: '湿重、消化慢、容易困', 金: '呼吸道与皮肤偏敏感，换季先反应', 水: '偏寒，怕冷，冬天状态最低' }[f.maxWx];
      const lack = { 木: '缺木：起念头的劲不足，容易拖着不开始', 火: '缺火：热度上不来，做事靠意志硬撑', 土: '缺土：底盘不稳，作息容易乱', 金: '缺金：边界感弱，容易被别人的事占满', 水: '缺水：恢复慢，睡一晚也缓不过来' }[f.minWx];
      P('身体与耗损',
        `五行里${f.maxWx}最旺、${f.minWx}最弱：${heat}；${lack}。这是体质倾向，不是诊断。`,
        `五行 ${WXN.map((w, i) => w + Math.round(f.R.wx[i] * 10) / 10).join(' / ')}${f.healthP ? '；疾厄宫' + (nm(f.healthP).join('') || '空宫') : ''}`,
        `别再靠“扛过去”处理${f.maxWx === '火' ? '睡眠' : '恢复'}：先把作息钉死一个月，比吃什么都管用。`,
        '中');
    }

    /* 6 变动与迁移 */
    {
      const ms = f.moveP ? nm(f.moveP) : [];
      const openLow = f.sc.open < 45;
      let line;
      if (ms.includes('天机') || ms.includes('贪狼') || ms.includes('七杀')) line = '你的盘是“动中得利”的：换城市、换行业、换圈子，往往比在原地熬更容易出结果';
      else if (ms.length) line = '迁移宫' + ms.join('') + '：出去不会更差，但也不会自动更好——你的机会来自“换环境后重建秩序”，不是换环境本身';
      else line = '迁移宫空宫：你不太主动换环境，多是被人或事推着走；一旦动了，适应得比预想快';
      P('变动与迁移', `${line}。${openLow ? '但你的探索欲偏低，你会先想“万一不成”，于是错过那些当时看不清的机会。' : '你的探索欲不低，风险在于动得太勤，每次都没到能收果子的深度。'}`,
        (f.moveP ? '迁移宫' + (ms.join('') || '空宫') : '') + `；探索欲 ${f.sc.open}`,
        openLow ? '给自己定“低成本试错”的规矩：任何新方向，先花两周、小钱试一次，再决定要不要押。' : '每换一次赛道，先问“这次我要带走什么能力”，否则换的是热闹，不是积累。', '中');
    }

    /* 7 内耗 */
    {
      const sp = f.spirit ? nm(f.spirit) : [];
      const jiSp = f.hua['忌'] === '福德';
      let line;
      if (jiSp) line = '化忌落福德：你的内耗是自己给自己的，外面看不出来。你最常做的一件事，是在心里把话说完了';
      else if (sp.includes('七杀') || sp.includes('破军')) line = '福德宫' + sp.join('') + '：你闲不下来，一停下来就觉得自己在浪费时间，休息对你有负罪感';
      else if (sp.includes('贪狼')) line = '福德宫贪狼：你想试的东西太多，兴趣也太多，内耗来自“都想抓、都舍不得放”';
      else if (sp.includes('天同') || sp.includes('天梁')) line = '福德宫' + sp.join('') + '：你其实会享受，只是不敢享受太久，放松一会儿就催自己回去干活';
      else line = '福德宫' + (sp.join('') || '空宫') + '：你的内耗不在大事上，在日常的反复权衡里——买个小东西也要比半天';
      P('内耗', `${line}。${f.selfHua.length ? '加上命宫自化' + f.selfHua.join('') + '，你对自己的评价会自己翻一次，别人劝不动。' : ''}`,
        (f.spirit ? '福德宫' + (sp.join('') || '空宫') : '') + (jiSp ? '；化忌入福德' : '') + (f.selfHua.length ? '；命宫自化' + f.selfHua.join('') : ''),
        '把“想”换成“写”：内耗发生在脑子里，写下来就变成待办，有了边界。',
        '高');
    }

    /* 8 风险点 */
    {
      const br = f.pats[0] && f.pats[0].br;
      const lowK = f.low.k;
      const risk = {
        ord: '你的风险不在做不成，在于同时开了太多口子，最后一个都没收口',
        drv: '你的风险不在能力，在于“再等等”——等到条件齐了，位置已经被人占了',
        warm: '你的风险不在得罪人，在于你根本没意识到已经得罪了：你以为在讲事实，对方听到的是否定',
        open: '你的风险在于对新东西的胃口大过消化能力，摊子铺开之后收不回来',
        grit: '你的风险在于把“还能撑”当成“没问题”，直到某天一次性崩给所有人看'
      }[lowK];
      P('最该防的一件事',
        `${risk}。这是你这套盘最容易反复踩的坑，通常不在大事上，在同一个模式里重演。${br ? '格局上的提示是：' + br + '。' : ''}`,
        `最弱维度 ${f.low.n} ${f.low.v}${f.shaN >= 3 ? '；盘中煞星 ' + f.shaN + ' 颗' : ''}`,
        lowK === 'warm' ? '重要的话先说结论再给理由，中间加一句“我不是否定你”。' : lowK === 'grit' ? '给自己设一个“提前喊停”的阈值，比如连续两周睡不好就先停一件事。' : '给手上所有事做一次减法，只留一件今年必须收口的。',
        '中');
    }
    return out;
  }

  /* ── 我说不准的地方：真话，不是免责套话 ── */
  function unsure(f) {
    const out = [];
    const h = f.R.ctx.h;
    if (h >= 22 || h <= 1) out.push('你生在子时前后，紫微与八字的时柱都卡在换日的边界上，差一小时可能换一张盘。这一项我用的是真太阳时校正后的结果，仍有不确定性。');
    const lng = f.R.ctx.lng;
    if (Math.abs(lng - 120) > 8) out.push(`出生地经度 ${lng}°E，真太阳时相对北京时间偏 ${Math.round((lng - 120) * 4)} 分钟，若你的出生时间本身是记录的整点，时辰归属可能整体偏移一位。`);
    if (!f.R.ziwei) out.push('紫微这一层没排上（引擎未加载），涉及紫微的判断我都用八字与 MBTI 顶替了，权重相应降低。');
    /* 体系分歧：同一维度上正负贡献都出现 */
    const ev = f.R.fused.ev;
    const conflict = DIMS.map(d => {
      const pos = ev.filter(e => e.k === d.k && e.v > 0).reduce((a, e) => a + e.v, 0);
      const neg = ev.filter(e => e.k === d.k && e.v < 0).reduce((a, e) => a + e.v, 0);
      return { n: d.n, pos, neg };
    }).filter(x => x.pos > 2 && x.neg < -2).sort((a, b) => (a.pos + a.neg) - (b.pos + b.neg))[0];
    if (conflict) out.push(`六个体系在“${conflict.n}”上并不一致：有 ${trim(conflict.pos)} 的支持，也有 ${trim(conflict.neg)} 的抵消。我按净分处理了，这意味着这一维的结论是可商量的。`);
    if (f.pats[0] && f.pats[0].br) out.push(`格局判到“${f.pats[0].n}”但有破格之处（${f.pats[0].br}），所以我把等级压了一档，不按成格写。`);
    out.push('没有大运与流年：这里说的都是原局倾向，不是“这几年会怎样”。同一个人在不同大运里，同一套盘的应验完全相反。');
    return out.slice(0, 4);
  }


  /* ── 共识与分歧：六个体系在同一维度上是重复，还是打架 ── */
  function consensus(R) {
    const g = {};
    DIMS.forEach(d => { g[d.k] = { n: d.n, src: new Set(), pos: 0, neg: 0 }; });
    (R.fused.ev || []).forEach(e => {
      const x = g[e.k]; if (!x) return;
      x.src.add(String(e.src).split('·')[0]);
      if (e.v > 0) x.pos += e.v; else x.neg += e.v;
    });
    const items = DIMS.map(d => Object.assign({ k: d.k }, g[d.k], { list: [...g[d.k].src] }));
    const rep = items.filter(x => x.list.length >= 3 && x.pos >= 5).sort((a, b) => b.pos - a.pos).slice(0, 3);
    const con = items.filter(x => x.pos >= 3 && x.neg <= -3).sort((a, b) => Math.abs(a.pos + a.neg) - Math.abs(b.pos + b.neg)).slice(0, 1);
    return { rep, con };
  }

  const NOTE = {
    ord: '你真正的优势不是聪明，是能把事情收口——这件事值钱，也最容易被低估',
    drv: '你要的是结果，不是过程的漂亮',
    warm: '你能接住人，这部分换个人来学不会',
    open: '你对没做过的事不设防，这是你少有的进攻性',
    grit: '你在没反馈的那段时间里还能继续做，这条留着自己用'
  };
  function trim(v) { const r = Math.round(v * 10) / 10; return (r > 0 ? '+' : '') + r; }
  const esc2 = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

  function build(R) {
    const f = facts(R);
    const v = verdict(f);
    const cg = consensus(R);
    const says = sections(f);
    const un = unsure(f);
    const grade = f.pats[0]
      ? (f.pats[0].lv === 'excellent' ? '成色 · 上' : f.pats[0].lv === 'good' ? '成色 · 中上' : '成色 · 中')
      : '成色 · 中';
    return {
      html: `<div class="read">
        <div class="judge">
          <div class="lv">判词<b>${esc2(f.R.arch.name)}</b>${grade}</div>
          <p>${esc2(v.gate)}</p>
          <p>${esc2(v.cap)}</p>
          <p>${esc2(v.turn)}</p>
          <div class="k">判断依据：日主 ${esc2(GAN[f.dayGan] + f.dayWx)}、${esc2(f.zw ? '命宫' + starLine(f.soul) : '八字原局')}、MBTI ${esc2(f.R.mbti.type)}、五维最强 ${esc2(f.top.n + ' ' + f.top.v)}／最弱 ${esc2(f.low.n + ' ' + f.low.v)}。每一条都能在下面的卡片里核对。</div>
        </div>
        ${(cg.rep.length || cg.con.length) ? `<div class="sec-t">哪几件事反复出现</div>
        <div class="says">${cg.rep.map(x => `<div class="say">
          <div class="sh"><b>${esc2(x.n)}</b><i>${esc2(x.list.length)} 个体系同向</i></div>
          <p>${esc2(x.list.join('、'))} 都指向这一项，合计 ${esc2(trim(x.pos))}。${esc2(NOTE[x.k] || '这不是某一个体系的说法，是重复出现的事实')}。重复出现的东西才值得当真——单个体系说你好，可能是它自己的偏好。</p>
        </div>`).join('')}
        ${cg.con.map(x => `<div class="say">
          <div class="sh"><b>${esc2(x.n)}</b><i>体系之间打架</i></div>
          <p>有 ${esc2(trim(x.pos))} 的支持，也有 ${esc2(trim(x.neg))} 的抵消。这一维我不给单一结论：${esc2(x.n)} 于你不是天生高或天生低，是“看场合”——你需要判断的是，在哪种场合你愿意让它高起来。</p>
        </div>`).join('')}</div>` : ''}
        <div class="sec-t">八段断语</div>
        <div class="says">
          ${says.map(s => `<div class="say">
            <div class="sh"><b>${esc2(s.h)}</b><i>可靠度 ${esc2(s.ct)}</i></div>
            <p>${esc2(s.p)}</p>
            <div class="do">做法：${esc2(s.act)}</div>
            <div class="ct">依据：${esc2(s.why)}</div>
          </div>`).join('')}
        </div>
        <div class="unsure">
          <h4>我说不准的地方</h4>
          <ul>${un.map(x => `<li>${esc2(x)}</li>`).join('')}</ul>
        </div>
      </div>`,
      text: [v.gate, v.cap, v.turn].join(''),
      says, unsure: un
    };
  }

  const _rr = window.renderResult;
  window.renderResult = function () {
    _rr();
    const res = build(RES);
    const anchor = document.querySelector('.verdict');
    if (anchor && !document.querySelector('.read')) anchor.insertAdjacentHTML('afterend', res.html);
    window.__read = res;
  };

  window.__readBuild = () => build(RES);
})();
