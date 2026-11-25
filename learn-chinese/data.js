// Hanzi Rush — 学习数据（全部为 HSK 1–2 公版词表 + 自编例句）

// 词义游戏：h 汉字  p 拼音  e 英文
const WORDS = [
  { h: '你好', p: 'nǐ hǎo', e: 'hello' }, { h: '谢谢', p: 'xièxie', e: 'thank you' }, { h: '再见', p: 'zàijiàn', e: 'goodbye' },
  { h: '是', p: 'shì', e: 'to be' }, { h: '不', p: 'bù', e: 'no / not' }, { h: '我', p: 'wǒ', e: 'I / me' }, { h: '你', p: 'nǐ', e: 'you' },
  { h: '他', p: 'tā', e: 'he' }, { h: '她', p: 'tā', e: 'she' }, { h: '我们', p: 'wǒmen', e: 'we' }, { h: '爱', p: 'ài', e: 'to love' },
  { h: '喜欢', p: 'xǐhuan', e: 'to like' }, { h: '吃', p: 'chī', e: 'to eat' }, { h: '喝', p: 'hē', e: 'to drink' }, { h: '水', p: 'shuǐ', e: 'water' },
  { h: '茶', p: 'chá', e: 'tea' }, { h: '咖啡', p: 'kāfēi', e: 'coffee' }, { h: '米饭', p: 'mǐfàn', e: 'rice' }, { h: '面条', p: 'miàntiáo', e: 'noodles' },
  { h: '中国', p: 'Zhōngguó', e: 'China' }, { h: '中文', p: 'Zhōngwén', e: 'Chinese language' }, { h: '人', p: 'rén', e: 'person' }, { h: '学生', p: 'xuésheng', e: 'student' },
  { h: '老师', p: 'lǎoshī', e: 'teacher' }, { h: '朋友', p: 'péngyou', e: 'friend' }, { h: '猫', p: 'māo', e: 'cat' }, { h: '狗', p: 'gǒu', e: 'dog' },
  { h: '鱼', p: 'yú', e: 'fish' }, { h: '书', p: 'shū', e: 'book' }, { h: '手机', p: 'shǒujī', e: 'mobile phone' }, { h: '电脑', p: 'diànnǎo', e: 'computer' },
  { h: '钱', p: 'qián', e: 'money' }, { h: '家', p: 'jiā', e: 'home' }, { h: '学校', p: 'xuéxiào', e: 'school' }, { h: '今天', p: 'jīntiān', e: 'today' },
  { h: '明天', p: 'míngtiān', e: 'tomorrow' }, { h: '昨天', p: 'zuótiān', e: 'yesterday' }, { h: '早上', p: 'zǎoshang', e: 'morning' }, { h: '晚上', p: 'wǎnshang', e: 'evening' },
  { h: '好', p: 'hǎo', e: 'good' }, { h: '大', p: 'dà', e: 'big' }, { h: '小', p: 'xiǎo', e: 'small' }, { h: '多', p: 'duō', e: 'many / much' },
  { h: '少', p: 'shǎo', e: 'few / little' }, { h: '新', p: 'xīn', e: 'new' }, { h: '旧', p: 'jiù', e: 'old (things)' }, { h: '热', p: 'rè', e: 'hot' },
  { h: '冷', p: 'lěng', e: 'cold' }, { h: '快', p: 'kuài', e: 'fast' }, { h: '慢', p: 'màn', e: 'slow' }, { h: '高', p: 'gāo', e: 'tall / high' },
  { h: '去', p: 'qù', e: 'to go' }, { h: '来', p: 'lái', e: 'to come' }, { h: '看', p: 'kàn', e: 'to look / watch' }, { h: '说', p: 'shuō', e: 'to speak' },
  { h: '听', p: 'tīng', e: 'to listen' }, { h: '读', p: 'dú', e: 'to read' }, { h: '写', p: 'xiě', e: 'to write' }, { h: '买', p: 'mǎi', e: 'to buy' },
  { h: '睡觉', p: 'shuìjiào', e: 'to sleep' }, { h: '工作', p: 'gōngzuò', e: 'to work / job' }, { h: '学习', p: 'xuéxí', e: 'to study' }, { h: '汉字', p: 'Hànzì', e: 'Chinese character' },
  { h: '一', p: 'yī', e: 'one' }, { h: '二', p: 'èr', e: 'two' }, { h: '三', p: 'sān', e: 'three' }, { h: '四', p: 'sì', e: 'four' },
  { h: '五', p: 'wǔ', e: 'five' }, { h: '六', p: 'liù', e: 'six' }, { h: '七', p: 'qī', e: 'seven' }, { h: '八', p: 'bā', e: 'eight' },
  { h: '九', p: 'jiǔ', e: 'nine' }, { h: '十', p: 'shí', e: 'ten' }, { h: '天', p: 'tiān', e: 'day / sky' }, { h: '年', p: 'nián', e: 'year' },
  { h: '山', p: 'shān', e: 'mountain' }, { h: '海', p: 'hǎi', e: 'sea' }, { h: '花', p: 'huā', e: 'flower' }, { h: '月亮', p: 'yuèliang', e: 'moon' },
  { h: '太阳', p: 'tàiyang', e: 'sun' }, { h: '雨', p: 'yǔ', e: 'rain' }, { h: '快乐', p: 'kuàilè', e: 'happy' }, { h: '难过', p: 'nánguò', e: 'sad' },
  { h: '饿', p: 'è', e: 'hungry' }, { h: '渴', p: 'kě', e: 'thirsty' }, { h: '累', p: 'lèi', e: 'tired' }, { h: '妈妈', p: 'māma', e: 'mom' },
  { h: '爸爸', p: 'bàba', e: 'dad' }, { h: '哥哥', p: 'gēge', e: 'older brother' }, { h: '姐姐', p: 'jiějie', e: 'older sister' }, { h: '孩子', p: 'háizi', e: 'child' },
  { h: '很', p: 'hěn', e: 'very' }, { h: '太', p: 'tài', e: 'too / extremely' }, { h: '因为', p: 'yīnwèi', e: 'because' }, { h: '但是', p: 'dànshì', e: 'but' }
];

// 声调游戏：最小对立对  p 带调拼音  h 汉字  e 英文  t 声调
const TONES = [
  { p: 'mā', h: '妈', e: 'mom', t: 1 }, { p: 'má', h: '麻', e: 'hemp', t: 2 }, { p: 'mǎ', h: '马', e: 'horse', t: 3 }, { p: 'mà', h: '骂', e: 'to scold', t: 4 },
  { p: 'nī', h: '妮', e: 'girl', t: 1 }, { p: 'ní', h: '泥', e: 'mud', t: 2 }, { p: 'nǐ', h: '你', e: 'you', t: 3 }, { p: 'nì', h: '腻', e: 'greasy', t: 4 },
  { p: 'shī', h: '诗', e: 'poem', t: 1 }, { p: 'shí', h: '十', e: 'ten', t: 2 }, { p: 'shǐ', h: '史', e: 'history', t: 3 }, { p: 'shì', h: '是', e: 'to be', t: 4 },
  { p: 'yī', h: '一', e: 'one', t: 1 }, { p: 'yí', h: '姨', e: 'aunt', t: 2 }, { p: 'yǐ', h: '椅', e: 'chair', t: 3 }, { p: 'yì', h: '意', e: 'meaning', t: 4 },
  { p: 'hāo', h: '蒿', e: 'wormwood', t: 1 }, { p: 'háo', h: '毫', e: 'tiny bit', t: 2 }, { p: 'hǎo', h: '好', e: 'good', t: 3 }, { p: 'hào', h: '号', e: 'number', t: 4 },
  { p: 'bā', h: '八', e: 'eight', t: 1 }, { p: 'bá', h: '拔', e: 'to pull out', t: 2 }, { p: 'bǎ', h: '把', e: 'handle', t: 3 }, { p: 'bà', h: '爸', e: 'dad', t: 4 },
  { p: 'wēn', h: '温', e: 'warm', t: 1 }, { p: 'wén', h: '文', e: 'writing', t: 2 }, { p: 'wěn', h: '吻', e: 'kiss', t: 3 }, { p: 'wèn', h: '问', e: 'to ask', t: 4 }
];

// 偏旁游戏：r 偏旁  e 含义  x 例字
const RADICALS = [
  { r: '氵', e: 'water', x: '海 sea · 河 river' }, { r: '亻', e: 'person', x: '他 he · 你 you' }, { r: '口', e: 'mouth', x: '吃 eat · 喝 drink' },
  { r: '心', e: 'heart', x: '想 think · 爱 love' }, { r: '扌', e: 'hand', x: '打 hit · 找 find' }, { r: '女', e: 'woman', x: '她 she · 妈 mom' },
  { r: '日', e: 'sun', x: '明 bright · 早 morning' }, { r: '月', e: 'moon', x: '朋 friend · 明 bright' }, { r: '木', e: 'tree / wood', x: '林 forest · 桌 desk' },
  { r: '火', e: 'fire', x: '烧 burn · 炒 stir-fry' }, { r: '土', e: 'earth', x: '地 ground · 坐 sit' }, { r: '饣', e: 'food', x: '饭 rice · 饿 hungry' },
  { r: '讠', e: 'speech', x: '说 speak · 话 words' }, { r: '目', e: 'eye', x: '看 look · 眼 eye' }, { r: '山', e: 'mountain', x: '岛 island · 岩 rock' }, { r: '雨', e: 'rain', x: '雷 thunder · 雪 snow' }
];

// 连词成句：h 整句  e 英文  w 词块（按正确顺序）
const SENTENCES = [
  { h: '我爱你。', e: 'I love you.', w: ['我', '爱', '你'] },
  { h: '你好吗？', e: 'How are you?', w: ['你', '好吗'] },
  { h: '我是学生。', e: 'I am a student.', w: ['我', '是', '学生'] },
  { h: '我叫小明。', e: 'My name is Xiaoming.', w: ['我', '叫', '小明'] },
  { h: '我想喝水。', e: 'I want to drink water.', w: ['我', '想', '喝', '水'] },
  { h: '今天天气很好。', e: 'The weather is nice today.', w: ['今天', '天气', '很', '好'] },
  { h: '你吃米饭吗？', e: 'Do you eat rice?', w: ['你', '吃', '米饭', '吗'] },
  { h: '这本书很有意思。', e: 'This book is very interesting.', w: ['这本', '书', '很', '有意思'] },
  { h: '我会说一点儿中文。', e: 'I speak a little Chinese.', w: ['我', '会', '说', '一点儿', '中文'] },
  { h: '请给我一杯咖啡。', e: 'Please give me a coffee.', w: ['请', '给', '我', '一杯', '咖啡'] },
  { h: '明天我们去公园。', e: 'Tomorrow we go to the park.', w: ['明天', '我们', '去', '公园'] },
  { h: '你家在哪里？', e: 'Where is your home?', w: ['你家', '在', '哪里'] },
  { h: '我喜欢中国菜。', e: 'I like Chinese food.', w: ['我', '喜欢', '中国菜'] },
  { h: '现在几点？', e: 'What time is it now?', w: ['现在', '几点'] },
  { h: '对不起，我不懂。', e: "Sorry, I don't understand.", w: ['对不起', '我', '不懂'] },
  { h: '很高兴认识你。', e: 'Nice to meet you.', w: ['很', '高兴', '认识', '你'] },
  { h: '我要学中文。', e: 'I want to learn Chinese.', w: ['我', '要', '学', '中文'] },
  { h: '你从哪里来？', e: 'Where are you from?', w: ['你', '从', '哪里', '来'] }
];

const TONE_LABELS = ['', 'ā', 'á', 'ǎ', 'à'];
