// 发布前的审核用词检查：旁白、字幕、画面文字、标题描述里出现这些词就不出片。
// 依据：抖音对「封建迷信 / 算命占卜」、广告法极限用语、站外导流的常见限制。只做字面检查，不能代替人工过一遍。
export const BANNED = [
  // 迷信、算命类
  '算命', '占卜', '卜卦', '算卦', '预测', '预知', '运势', '运程', '改运', '转运', '开运', '灵验', '很准', '超准', '准到',
  '命中注定', '命理', '八字', '风水', '开光', '符咒', '化解', '招财', '桃花运', '财运', '大师',
  '封建', '玄学大师', '招桃花',
  // 广告法极限词
  '最准', '最灵', '最好', '最强', '最权威', '全网第一', '排名第一', '唯一', '顶级', '100%',
  // 站外导流
  '微信', 'vx', 'VX', '私信', '加我', '二维码', '链接', '网址', 'http', 'www.', '.com', '.xyz', '淘宝', '小红书',
];

export const STORY_COPY = {
  series: '牌的故事',
  era: '时间往前拨',
  compare: '同一张牌 · 不同年代',
  person: '画这张牌的人',
  next: '下一张牌',
  brand: '晨启塔罗',
  promo: ['一张牌，一段故事', '用大白话读懂牌面'],
  features: '1909 年版牌面 · 78 张白话解读',
  daybreakPromo: '78 张牌 · 白话解读',
  disclaimer: '塔罗文化与艺术科普 · 内容仅供参考',
};

/** 收集一集里所有会公开的文字 */
export function texts(ep) {
  const out = [ep.nameZh, ep.publish?.title, ep.publish?.desc, ...(ep.publish?.tags || [])];
  if (ep.series === 'story') out.push(ep.nameEn, ep.roman, ep.next?.nameZh, ...Object.values(STORY_COPY).flat());
  for (const s of ep.segments) {
    out.push(s.say, s.sub, s.quote, s.label?.t, s.label?.s, ...(s.words || []), ...(s.keywords || []));
    out.push(s.year, s.place, s.name, s.years, s.bio, ...(s.cards || []).map(card => card.caption));
    if (s.mark?.tags) out.push(...s.mark.tags.map(t => t[2]));
  }
  return out.filter(Boolean);
}

export function lint(ep) {
  const hits = [];
  const banned = ep.series === 'story' ? [...BANNED, '准', '灵', '测一测'] : BANNED;
  for (const t of texts(ep)) for (const w of banned) if (String(t).includes(w)) hits.push(`「${w}」出现在：${t}`);
  return hits;
}
