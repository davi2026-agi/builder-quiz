/* 今天 · 生活助手 — 天气驱动的穿衣与运动建议 */
const $=s=>document.querySelector(s);
const KEY='life_v1';
const DEF={lat:39.0842,lon:117.2009,city:'天津',steps:0,done:[],notify:false,cache:null,upd:0};

let S=load();
function load(){
  try{return Object.assign({},DEF,JSON.parse(localStorage.getItem(KEY)||'{}'))}catch(e){return {...DEF}}
}
function save(){localStorage.setItem(KEY,JSON.stringify(S))}

/* URL 参数：?steps=8000&city=天津&lat=&lon= */
function readParams(){
  const p=new URLSearchParams(location.search);
  if(p.get('steps')){S.steps=Math.max(0,+p.get('steps')||0)}
  if(p.get('city'))S.city=p.get('city')
  if(p.get('lat')&&p.get('lon')){S.lat=+p.get('lat');S.lon=+p.get('lon')}
  if(p.get('steps')||p.get('city'))save();
}
readParams();

/* ---------- 天气码 → 文案与图形 ---------- */
const WX={
  0:['晴','sun'],1:['晴间多云','sun'],2:['多云','cloud'],3:['阴','cloud'],
  45:['有雾','fog'],48:['雾凇','fog'],
  51:['小毛雨','rain'],53:['毛毛雨','rain'],55:['密毛雨','rain'],
  56:['冻雨','rain'],57:['冻雨','rain'],
  61:['小雨','rain'],63:['中雨','rain'],65:['大雨','rain'],
  66:['冻雨','rain'],67:['冻雨','rain'],
  71:['小雪','snow'],73:['中雪','snow'],75:['大雪','snow'],77:['雪粒','snow'],
  80:['阵雨','rain'],81:['强阵雨','rain'],82:['暴雨','rain'],
  85:['阵雪','snow'],86:['强阵雪','snow'],
  95:['雷阵雨','storm'],96:['雷雨冰雹','storm'],99:['强雷雨','storm']
};
const wx=c=>WX[c]||['多云','cloud'];
function icon(kind,size=44,cls=''){
  const g={
    sun:'<circle cx="24" cy="24" r="9" fill="#FFD60A"/><g stroke="#FFD60A" stroke-width="2.4" stroke-linecap="round">'+
        [0,45,90,135,180,225,270,315].map(a=>{const r=a*Math.PI/180;const x1=24+13*Math.cos(r),y1=24+13*Math.sin(r),x2=24+18*Math.cos(r),y2=24+18*Math.sin(r);return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/>`}).join('')+'</g>',
    cloud:'<path d="M14 33c0-4 3-7 7-7 2-4 6-6 10-5 4 1 6 4 6 8h-1c3 0 5 2 5 5s-2 5-5 5H18c-2 0-4-2-4-4z" fill="#E9EEF6" opacity=".95"/><ellipse cx="26" cy="38" rx="12" ry="3" fill="#000" opacity=".12"/>',
    rain:'<ellipse cx="25" cy="22" rx="12" ry="8" fill="#DDE5F2"/><g stroke="#4AA3FF" stroke-width="2.6" stroke-linecap="round"><line x1="18" y1="32" x2="16" y2="39"/><line x1="24" y1="32" x2="22" y2="41"/><line x1="30" y1="32" x2="28" y2="39"/></g>',
    snow:'<ellipse cx="25" cy="21" rx="12" ry="8" fill="#E8EFFA"/><g stroke="#8FB8FF" stroke-width="2.2" stroke-linecap="round"><line x1="18" y1="33" x2="18" y2="39"/><line x1="25" y1="33" x2="25" y2="40"/><line x1="32" y1="33" x2="32" y2="39"/></g>',
    storm:'<ellipse cx="24" cy="20" rx="12" ry="8" fill="#DCE3EE"/><path d="M26 28l-6 9h4l-2 8 8-11h-4l2-6z" fill="#FFD60A"/>',
    fog:'<g stroke="#C9D2DE" stroke-width="2.6" stroke-linecap="round"><line x1="12" y1="20" x2="36" y2="20"/><line x1="10" y1="26" x2="38" y2="26"/><line x1="14" y1="32" x2="34" y2="32"/></g>'
  }[kind]||'';
  return `<svg class="${cls}" viewBox="0 0 48 48" width="${size}" height="${size}" aria-hidden="true">${g}</svg>`;
}

/* ---------- 取数 ---------- */
async function fetchWeather(){
  const u=`https://api.open-meteo.com/v1/forecast?latitude=${S.lat}&longitude=${S.lon}`
   +`&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,is_day`
   +`&hourly=temperature_2m,precipitation_probability,weather_code`
   +`&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max,sunrise,sunset`
   +`&timezone=auto&forecast_days=2`;
  const r=await fetch(u,{cache:'no-store'});
  if(!r.ok)throw new Error('weather '+r.status);
  const d=await r.json();
  const c=d.current, day=d.daily, hr=d.hourly;
  const times=hr.time, nowIso=c.time.slice(0,13);
  let idx=times.findIndex(t=>t.slice(0,13)===nowIso); if(idx<0)idx=0;
  const w={
    temp:Math.round(c.temperature_2m), feels:Math.round(c.apparent_temperature),
    hum:c.relative_humidity_2m, wind:Math.round(c.wind_speed_10m),
    code:c.weather_code, isDay:c.is_day===1, now:c.time,
    tmax:Math.round(day.temperature_2m_max[0]), tmin:Math.round(day.temperature_2m_min[0]),
    rainMax:day.precipitation_probability_max[0]||0, uv:Math.round(day.uv_index_max[0]||0),
    tmax1:Math.round(day.temperature_2m_max[1]), tmin1:Math.round(day.temperature_2m_min[1]),
    rainMax1:day.precipitation_probability_max[1]||0,
    sunrise:day.sunrise[0].slice(11,16), sunset:day.sunset[0].slice(11,16),
    hours:times, pp:hr.precipitation_probability, ht:hr.temperature_2m
  };
  S.cache=w; S.upd=Date.now(); save();
  return w;
}

/* ---------- 穿衣引擎 ---------- */
function cloth(w){
  const f=w.feels, layers=[], chips=[];
  let big='', sub='';
  if(f>=28){big='一件短袖就够';sub='别加外套，室内空调处再补一件薄的';layers.push(['上身','短袖 / 背心'],['下装','短裤 / 薄裙'],['鞋','透气运动鞋']) }
  else if(f>=24){big='短袖 + 薄外搭';sub='室内空调和地铁里会凉，备一件薄开衫';layers.push(['上身','短袖，包里加薄开衫'],['下装','薄长裤 / 裙装'],['鞋','透气运动鞋']) }
  else if(f>=20){big='长袖 + 薄开衫';sub='早晚偏凉，中午可脱一层';layers.push(['上身','长袖T / 薄衬衫 + 薄开衫'],['下装','长裤 / 牛仔'],['鞋','运动鞋 / 乐福鞋']) }
  else if(f>=16){big='卫衣或针织 + 轻外套';sub='昼夜温差大，按早上温度穿';layers.push(['上身','卫衣 / 针织衫 + 夹克'],['下装','长裤'],['鞋','运动鞋 / 短靴']) }
  else if(f>=11){big='毛衣 + 风衣/夹克';sub='风一起就显冷，外层的防风比厚度重要';layers.push(['上身','毛衣或加绒卫衣 + 风衣'],['下装','长裤 + 薄秋裤可选'],['鞋','运动鞋 / 靴子']) }
  else if(f>=6){big='毛衣 + 厚外套';sub='早晚接近个位数，别只穿卫衣';layers.push(['上身','毛衣 + 棉服 / 薄羽绒'],['下装','加绒长裤'],['鞋','保暖运动鞋']) }
  else if(f>=0){big='羽绒 + 围巾';sub='重点护住脖子和手，风大时体感再低 3–4℃';layers.push(['上身','保暖内衣 + 毛衣 + 羽绒'],['下装','加绒裤 / 防风裤'],['鞋','厚底保暖鞋'],['随身','围巾 + 手套']) }
  else {big='厚羽绒 + 全套保暖';sub='裸露皮肤十分钟就会疼，帽子和手套必须带';layers.push(['上身','保暖内衣 + 毛衣 + 厚羽绒'],['下装','加绒裤 + 防风外层'],['随身','帽子 + 手套 + 围巾']) }
  if(w.rainMax>=50){chips.push(`降水概率 ${w.rainMax}%，带伞和防水鞋`);layers.push(['随身','折叠伞 / 防水鞋'])}
  else if(w.rainMax>=30){chips.push(`降水概率 ${w.rainMax}%，包里塞把轻便伞`)}
  if(w.uv>=6)chips.push(`紫外线指数 ${w.uv}，帽子+墨镜+防晒`);
  if(w.wind>=20)chips.push(`风速 ${w.wind} km/h，外层要防风`);
  if(w.tmax-w.tmin>=8)chips.push(`昼夜温差 ${w.tmax-w.tmin}℃，叠穿更稳`);
  return {big,sub,layers,chips};
}

/* 从 nowH 之后挑一个合适的 2–3 小时窗口 */
function pickWin(w,nowH,n){
  const date=w.now.slice(0,10);
  let start=-1;
  for(let i=0;i<w.hours.length;i++){
    if(w.hours[i].slice(0,10)===date && +w.hours[i].slice(11,13)>=nowH+1){start=i;break}
  }
  if(start<0)return '';
  let best=null;
  for(let i=start;i<Math.min(w.hours.length-n+1,start+13);i++){
    const p=Math.max(...w.pp.slice(i,i+n));
    const t0=w.ht[i],t1=w.ht[i+n-1];
    if(Math.min(t0,t1)<3||Math.max(t0,t1)>31)continue;
    if(!best||p<best.p)best={p,i};
  }
  if(!best)return '';
  const a=+w.hours[best.i].slice(11,13), b=Math.min(23,+w.hours[Math.min(best.i+n-1,w.hours.length-1)].slice(11,13)+1);
  return `${a}:00–${b}:00`;
}

/* ---------- 运动引擎 ---------- */
function exercise(w,nowH){
  if(nowH>=20||nowH<6){
    return {title:'睡前 8 分钟拉伸',sub:'这个点别再上强度了，把紧绷放掉；明天早上 7:00–9:00 再补一次 30 分钟',indoor:true,
      dur:'8 分钟',intensity:'低',win:'睡前，洗完澡后',
      moves:['靠墙小腿拉伸 每侧 40 秒 × 2','坐姿体前屈 40 秒 × 2，别弹振','仰卧抱膝 30 秒 × 2，放松下背','4-7-8 呼吸 4 轮：吸 4 秒、屏 7 秒、呼 8 秒'],
      why:`已过 ${nowH}:00，现在练强度会影响入睡`};
  }
  const indoor=w.rainMax>=60||w.feels>=33||w.feels<=-3||w.wind>=35;
  let title,sub,dur,intensity,moves,win,why;
  if(indoor){
    title='室内 30 分钟循环';sub='外面不适合跑，屋里把心率拉起来';
    dur='28–32 分钟';intensity='中等（能说话但不想说长句）';
    win='任意时段，饭后 1 小时';
    moves=['开合跳 3 组 × 30 秒，组间歇 30 秒','自重深蹲 3 组 × 15 次','平板支撑 3 组 × 40 秒','最后 5 分钟拉伸腿后侧和髋'];
    why=w.rainMax>=60?`降水概率 ${w.rainMax}%`:(w.feels>=33?`体感 ${w.feels}℃ 太热`:(w.feels<=-3?`体感 ${w.feels}℃ 太冷`:`风速 ${w.wind} km/h`));
  }else{
    const cool=w.feels>=10&&w.feels<=24;
    title=cool?'户外 快走 + 慢跑':'户外 快走（控强度）';
    sub=cool?'今天温度正好，别浪费':'温度不理想，用快走代替跑，别硬顶';
    dur=cool?'38–42 分钟':'30–35 分钟';
    intensity=cool?'中等（心率 120–140）':'偏低（心率 100–120）';
    win=pickWin(w,nowH,3)||pickWin(w,nowH,2)||'明天早上 7:00–9:00';
    moves=['前 5 分钟慢走热身，踝关节绕环','主段 25 分钟：走 3 分钟 / 跑 2 分钟循环','后 8 分钟慢走降心率','收尾 4 分钟拉伸小腿与股四头'];
    why=`降水概率低（${w.rainMax}%），体感 ${w.feels}℃`;
  }
  return {title,sub,dur,intensity,moves,win,why,indoor};
}

/* ---------- 渲染 ---------- */
function fmtDate(d){
  const M=['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
  const W=['周日','周一','周二','周三','周四','周五','周六'];
  return `${M[d.getMonth()]}${d.getDate()}日 ${W[d.getDay()]}`;
}
function daysAgo(n){const d=new Date();d.setDate(d.getDate()-n);return d.toISOString().slice(0,10)}
function today(){return new Date().toISOString().slice(0,10)}
function render(){
  const w=S.cache, now=new Date(), h=now.getHours();
  if(!w){
    $('#app').innerHTML=`<div class="nav"><span class="t">今天</span><button id="refresh">重试</button></div>
      <div class="lt"><h1>今天</h1><p>${fmtDate(now)}</p></div>
      <div class="card" style="margin-top:16px"><div class="verdict"><div class="big">正在取天气…</div>
      <div class="sub">需要联网。第一次打开会请求定位；不给定位就用默认城市。</div></div></div>`;
    $('#refresh')&&($('#refresh').onclick=()=>boot());
    return;
  }
  const cond=wx(w.code)[0];
  const c=cloth(w), e=exercise(w,h);
  const doneToday=S.done.includes(today());
  const week=[6,5,4,3,2,1,0].map(n=>S.done.includes(daysAgo(n)));
  $('#app').innerHTML=`
  <div class="nav"><span class="t"></span><button id="more">设置</button></div>
  <div class="lt"><h1>今天</h1><p>${fmtDate(now)} · ${esc(S.city)} · ${h<6?'夜深了':h<11?'早上好':h<14?'中午好':h<18?'下午好':'晚上好'}</p></div>

  <div class="hero ${w.isDay?'':'night'}">
    <div class="city">${esc(S.city)} · ${w.isDay?'白天':'夜间'}</div>
    <div class="deg">${w.temp}<sup>°</sup></div>
    <div class="cond">${cond} · 体感 ${w.feels}°</div>
    <div class="sum">${[h<9?`最高 ${w.tmax}° / 最低 ${w.tmin}°`:null,`降水概率 ${w.rainMax}%${w.rainMax>=30?'，带伞':''}`].filter(Boolean).join(' · ')}</div>
    <div class="metrics">
      <div><b>${w.tmax}°</b><span>最高</span></div>
      <div><b>${w.tmin}°</b><span>最低</span></div>
      <div><b>${w.rainMax}%</b><span>降水</span></div>
      <div><b>${w.wind}</b><span>风速 km/h</span></div>
      <div><b>${w.hum}%</b><span>湿度</span></div>
      <div><b>${w.uv}</b><span>紫外线峰值</span></div>
    </div>
  </div>

  <div class="sec">怎么穿</div>
  <div class="card">
    <div class="verdict"><div class="big">${c.big}</div><div class="sub">${c.sub}</div></div>
    ${c.layers.map(([k,v])=>`<div class="row"><div class="body"><div class="k">${k}</div><div class="v">${v}</div></div></div>`).join('')}
    ${c.chips.length?`<div class="chips" style="padding:12px 16px 14px">${c.chips.map(x=>`<span class="chip">${x}</span>`).join('')}</div>`:''}
  </div>

  <div class="sec">怎么练</div>
  <div class="card">
    <div class="plan">
      <div class="h"><span class="n">${e.title}</span><span class="s">${e.indoor?'室内':'户外'}</span></div>
      <div class="sub" style="color:var(--ink2);font-size:15px;margin-top:4px">${e.sub}</div>
      <div class="kv">
        <div><b>${e.dur}</b><span>时长</span></div>
        <div><b style="white-space:nowrap">${e.win}</b><span>建议时段</span></div>
        <div><b>${e.intensity.split('（')[0]}</b><span>强度</span></div>
      </div>
      <div class="steps"><ul style="margin:0;padding:0">${e.moves.map(m=>`<li><i>·</i><span>${m}</span></li>`).join('')}</ul></div>
      <div class="tip" style="margin:10px 0 0">为什么是这套：${e.why}。</div>
      <div class="dots">${week.map(x=>`<span class="dot ${x?'on':''}"></span>`).join('')}</div>
      <div class="tip" style="margin:6px 0 0">7 天内完成 ${week.filter(Boolean).length} 次</div>
    </div>
  </div>
  <button class="btn ${doneToday?'done':''}" id="check">${doneToday?'今天已完成 ✓ 点此取消':'完成今天的运动'}</button>

  <div class="sec">今天走了多少</div>
  <div class="card">
    <div class="row"><div class="ic">步</div><div class="body"><div class="k">步数（手填或快捷指令带入）</div>
      <div class="v" id="steps">${S.steps?S.steps.toLocaleString()+' 步':'未记录'}</div></div><button class="tr" id="setSteps" style="background:none;border:0;color:var(--blue);font-size:15px">修改</button></div>
    <div class="row"><div class="ic">明</div><div class="body"><div class="k">明天</div><div class="v">${w.tmin1}° ~ ${w.tmax1}°，降水 ${w.rainMax1}%</div></div></div>
  </div>

  <div class="sec">每天主动提醒</div>
  <div class="card">
    <div class="row"><div class="ic">铃</div><div class="body"><div class="k">早 7:30 穿衣 / 晚 20:30 明日预告${window.Android?' · 系统通知':''}</div>
      <div class="v">${S.notify?'已开启':'未开启'}</div></div><div class="tog ${S.notify?'on':''}" id="togNoti"><i></i></div></div>
    <div class="row"><div class="ic">装</div><div class="body"><div class="k">安装到手机桌面</div><div class="v">全屏无地址栏，断网也能开</div></div>
      <button class="tr" id="install" style="background:none;border:0;color:var(--blue);font-size:15px">安装</button></div>
  </div>
  <div class="tip">天气数据来自 Open-Meteo（免费、无需 Key），约每 30 分钟更新一次。定位只在本地使用，不上传。${window.Android?'提醒由系统通知发出，App 不用打开。':'网页版提醒只在页面打开时生效，装成 App 后才是系统级通知。'}</div>
  <div class="tip" id="upd">更新于 ${new Date(S.upd).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'})} · <a href="#" id="reload" style="color:var(--blue);text-decoration:none">刷新</a></div>
  <div class="sheet" id="sheet"><div class="mask"></div><div class="panel" id="panel"></div></div>`;
  wire();pushTips();
}
function esc(s){return String(s).replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}

function wire(){
  $('#check').onclick=()=>{
    const t=today();
    S.done=S.done.includes(t)?S.done.filter(d=>d!==t):S.done.concat(t);
    save();render();toast(S.done.includes(t)?'记上了，明天见':'已取消');
  };
  $('#setSteps').onclick=()=>{
    const v=prompt('今天走了多少步？',S.steps||'');
    if(v===null)return;
    S.steps=Math.max(0,parseInt(v.replace(/[^0-9]/g,''))||0);save();render();
  };
  $('#reload').onclick=e=>{e.preventDefault();boot(true)};
  $('#more').onclick=openSettings;
  $('#togNoti').onclick=async()=>{
    const native=!!(window.Android&&window.Android.setNotify);
    if(!S.notify){
      if(native){
        S.notify=true;save();window.Android.setNotify(true);render();
        toast('已开启：每天 7:30 与 20:30 各一条系统通知');
        return;
      }
      if(!('Notification' in window)){toast('这台设备不支持网页通知');return}
      const p=await Notification.requestPermission();
      if(p!=='granted'){toast('系统里拒绝了通知权限');return}
      S.notify=true;save();render();schedLoop();
    }else{
      S.notify=false;save();if(native)window.Android.setNotify(false);render();
    }
  };
  $('#install').onclick=openInstall;
  const m=$('#sheet .mask');if(m)m.onclick=closeSheet;
}

/* ---------- 设置面板 ---------- */
function openSettings(){
  const p=$('#panel');
  p.innerHTML=`<div class="bar"></div><h2>设置</h2>
  <div class="card" style="margin:0 20px">
    <div class="row"><div class="body"><div class="k">城市</div><div class="v">${esc(S.city)}</div></div>
      <button class="tr" id="geo" style="background:none;border:0;color:var(--blue)">用我的定位</button></div>
    <div class="row"><div class="body"><div class="k">坐标</div><div class="v">${S.lat.toFixed(3)}, ${S.lon.toFixed(3)}</div></div></div>
    <div class="row"><div class="body"><div class="k">步数自动带入</div><div class="v" style="font-size:14px;font-weight:400;color:var(--ink2)">链接后加 ?steps=8000 即可，配合快捷指令每天自动填</div></div></div>
  </div>
  <button class="btn" id="closeSet">完成</button>`;
  $('#sheet').classList.add('show');
  $('#closeSet').onclick=closeSheet;
  $('#geo').onclick=()=>{
    if(!navigator.geolocation){toast('此浏览器不支持定位');return}
    navigator.geolocation.getCurrentPosition(pos=>{
      S.lat=+pos.coords.latitude.toFixed(4);S.lon=+pos.coords.longitude.toFixed(4);
      S.city='当前位置';save();closeSheet();boot(true);toast('已切到你的定位');
    },()=>toast('定位被拒绝，继续用默认城市'));
  };
}
function openInstall(){
  const p=$('#panel'), ios=/iPhone|iPad|iPod/.test(navigator.userAgent);
  p.innerHTML=`<div class="bar"></div><h2>装到桌面</h2>
  ${ios?`<p>用 Safari 打开这个链接，然后：</p>
  <ol><li>点底部「分享」按钮</li><li>选「添加到主屏幕」</li><li>确认，桌面上就有「今天」</li></ol>
  <p style="margin-top:12px">装好后是全屏的，没有地址栏，断网也能打开（天气会自动用上次缓存）。</p>
  <p>想让它每天早上主动提醒，再做一步自动化：快捷指令 → 自动化 → 每天 7:30 → 打开 URL，选这个链接。iOS 会直接拉起页面，页面再发通知。</p>`
  :`<p>安卓 Chrome / Edge：</p>
  <ol><li>右上角菜单</li><li>选「安装应用」或「添加到主屏幕」</li><li>确认安装</li></ol>
  <p style="margin-top:12px">装好后可离线打开。定时提醒可用系统「日历/自动化」每天打开一次这个页面。</p>`}
  <button class="btn" id="closeIns">知道了</button>`;
  $('#sheet').classList.add('show');
  $('#closeIns').onclick=closeSheet;
}
function closeSheet(){$('#sheet').classList.remove('show')}

/* ---------- 原生桥 ---------- */
function pushTips(){
  if(!(window.Android&&window.Android.saveTip))return;
  const w=S.cache;if(!w)return;
  try{
    const c=cloth(w);
    const am=`${w.temp}°，体感 ${w.feels}°。${c.big}。${c.sub}`;
    const f=midOf(w.tmin1,w.tmax1);
    const tc=cloth({...w,feels:f,rainMax:w.rainMax1});
    const pm=`明天 ${w.tmin1}~${w.tmax1}°，降水 ${w.rainMax1}%。${tc.big}`;
    window.Android.saveTip(am,pm);
  }catch(e){}
}

/* ---------- 通知 ---------- */
let lastNoti='';
function schedLoop(){
  if(!S.notify)return;
  const now=new Date(), hm=now.getHours()*100+now.getMinutes();
  const key=today()+'-'+(hm>=1230?'pm':'am');
  if(lastNoti===key)return;
  if(hm>=730&&hm<800){lastNoti=key;notify('7:30 穿衣提醒',clothSummary())}
  else if(hm>=2030&&hm<2100){lastNoti=key;notify('20:30 明天怎么穿',tomorrowSummary())}
}
function clothSummary(){const w=S.cache;if(!w)return '打开看看今天怎么穿';const c=cloth(w);return `${w.temp}°，${c.big}。${c.sub}`}
function tomorrowSummary(){const w=S.cache;if(!w)return '明天记得看天气';const f=midOf(w.tmin1,w.tmax1);
  const c=cloth({...w,feels:f,rainMax:w.rainMax1});
  return `明天 ${w.tmin1}~${w.tmax1}°，降水 ${w.rainMax1}%。${c.big}`}
function midOf(a,b){return Math.round((a+b)/2)}
async function notify(title,body){
  try{
    if(navigator.serviceWorker&&navigator.serviceWorker.controller){
      const reg=await navigator.serviceWorker.ready;
      reg.showNotification(title,{body,tag:'daily'});
    }else if(window.Notification&&Notification.permission==='granted'){
      new Notification(title,{body});
    }
  }catch(e){}
  toast(title+'：'+body);
}
function toast(msg){
  const d=document.createElement('div');
  d.textContent=msg;
  d.style.cssText='position:fixed;left:50%;bottom:calc(28px + env(safe-area-inset-bottom));transform:translateX(-50%);'+
   'background:#000c;color:#fff;font-size:14px;padding:10px 16px;border-radius:12px;z-index:30;max-width:80%;'+
   'backdrop-filter:blur(8px);transition:opacity .3s';
  document.body.appendChild(d);
  setTimeout(()=>{d.style.opacity='0';setTimeout(()=>d.remove(),320)},2200);
}

/* ---------- 启动 ---------- */
let booting=false;
async function boot(force){
  if(booting)return;booting=true;
  if(force)renderLoading();
  try{await fetchWeather()}catch(e){
    if(!S.cache){booting=false;render();return}
  }
  booting=false;
  if(window.Android&&window.Android.setNotify&&!S.notifyInit){S.notify=true;S.notifyInit=true;save();try{window.Android.setNotify(true)}catch(e){}}
  render();
  if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
  schedLoop();
}
function renderLoading(){
  $('#app').innerHTML=`<div class="nav"><span class="t">今天</span></div><div class="lt"><h1>今天</h1><p>${fmtDate(new Date())}</p></div>
  <div class="card" style="margin-top:16px"><div class="verdict"><div class="big">正在更新… <span class="spin" style="border-color:#007aff55;border-top-color:#007aff"></span></div>
  <div class="sub">正在拉取实时天气与今日建议。</div></div></div>`;
}
boot();
setInterval(()=>{if(!document.hidden)boot(false)},30*60*1000);
setInterval(schedLoop,60*1000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)boot(false)});
window.__LA={get state(){return S},cloth,exercise,wx,fetchWeather,pushTips};
