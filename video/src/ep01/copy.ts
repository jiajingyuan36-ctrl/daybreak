// 第 1 期「回避型依恋」的全部屏幕文字。字体子集也从这里抽字（scripts/subset_fonts.py）。
export type Line={from:number;to:number;lines:string[];bold?:boolean};
// 时间单位：秒。每次只出现一句；lines 只是这一句在画面上怎么断行。
export const CAPTIONS:Line[]=[
 {from:0,to:3,lines:['对方越对你好，你越想突然冷掉？'],bold:true},
 {from:3,to:8,lines:['不是不喜欢。是一靠近，心里就拉响警报。']},
 {from:8,to:15,lines:['心理学管这叫「去激活」：','把需要别人的那部分，调成静音。']},
 {from:15,to:28,lines:['研究让人们“别去想伴侣离开你”，','回避型的人最能忍住不去想。']},
 {from:28,to:42,lines:['可一旦累了、分心了，','被压下去的念头会更猛地反弹回来。']},
 {from:42,to:48,lines:['所以他不是冷血。他只是一直在用力关门。']},
 {from:48,to:58,lines:['对回避型来说，被追是压力，','被留一条缝，才敢出来。']},
 {from:58,to:65,lines:['你是在门外敲门的人，','还是在门里抵着门的人？'],bold:true},
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
