// 第 1 期「回避型依恋」的全部屏幕文字。字体子集也从这里抽字（scripts/subset_fonts.py）。
// 时间单位：秒。一屏一句，最多 14 个字；{} 里的是关键词（琥珀色加辉光），渲染时去掉括号。
export type Line={from:number;to:number;text:string;bold?:boolean};
export const CAPTIONS:Line[]=[
 {from:0,to:3,text:'对方越对你好，你越想突然冷掉？',bold:true},
 {from:3,to:5,text:'不是不喜欢。'},
 {from:5,to:8,text:'是一靠近，心里就拉响{警报}。'},
 {from:8,to:10,text:'心理学管这叫「{去激活}」'},
 {from:10,to:15,text:'把需要别人的那部分，调成{静音}。'},
 // 15 秒以后的句子：做完整版时再按 14 字拆屏、定关键词
 {from:15,to:21,text:'研究让人们“别去想伴侣离开你”，'},
 {from:21,to:28,text:'回避型的人最能忍住不去想。'},
 {from:28,to:34,text:'可一旦累了、分心了，'},
 {from:34,to:42,text:'被压下去的念头会更猛地反弹回来。'},
 {from:42,to:45,text:'所以他不是冷血。'},
 {from:45,to:48,text:'他只是一直在用力关门。'},
 {from:48,to:53,text:'对回避型来说，被追是压力，'},
 {from:53,to:58,text:'被留一条缝，才敢出来。'},
 {from:58,to:61.5,text:'你是在门外敲门的人，',bold:true},
 {from:61.5,to:65,text:'还是在门里抵着门的人？',bold:true},
];
export const BUBBLE_A='今天好想见你';
export const BUBBLE_B='嗯';
export const KNOB_LABEL='在乎';
export const THOUGHTS=['他会走吗','我是不是不够好'];
export const BOX_LABEL='记住这串数字';
export const SOURCES=[
 'Fraley, R. C., & Shaver, P. R. (1997). JPSP, 73(5).',
 'Mikulincer, M., Dolev, T., & Shaver, P. R. (2004). JPSP, 87(6).',
];
export const SOURCE_TAGS=['Fraley & Shaver, 1997','Mikulincer, Dolev & Shaver, 2004'];
export const DISCLAIMER='内容为心理学科普，不构成医疗建议';
