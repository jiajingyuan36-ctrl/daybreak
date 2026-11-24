// 第 1 期「回避型依恋」的全部屏幕文字。字体子集也从这里抽字（scripts/subset_fonts.py）。
// 时间单位：秒。一屏一句。关键词写成 {色:词}：r 暗红（警报、压抑的念头）、c 冷灰加淡白辉光（冷掉）、a 琥珀（温度、在乎）、w 米白加辉光（强调）。
// 每句停留至少「字数 × 0.18 + 0.8 秒」（scripts/check-ep01.mjs 检查）。stagger 是逐字间隔（毫秒），默认 35。
export type Line={from:number;to:number;text:string;bold?:boolean;stagger?:number;size?:number;line2Delay?:number};
export const CAPTIONS:Line[]=[
 {from:0,to:3.5,text:'对方越对你好，你越想突然冷掉？',bold:true},
 {from:3.5,to:5.4,text:'不是不喜欢。'},
 {from:5.4,to:8.55,text:'是一靠近，心里就拉响{r:警报}。'},
 {from:8.55,to:11.35,text:'心理学管这叫「{c:去激活}」'},
 {from:11.35,to:15.2,text:'把需要别人的那部分，调成{c:静音}。'},
 {from:15.2,to:21,text:'研究让人们“别去想伴侣离开你”。'},
 {from:21,to:28.3,text:'回避型的人，最能忍住不想。'},
 {from:28.3,to:34,text:'可一旦累了、分心了，'},
 {from:34,to:42,text:'被压下去的念头，会更猛地反弹回来。'},
 {from:42,to:44.6,text:'所以他不是冷血。'},
 {from:44.6,to:48,text:'他只是，一直在{w:用力关门}。',stagger:60},
 {from:48,to:53.4,text:'对回避型来说，被追，是压力。'},
 {from:53.4,to:58,text:'被留一条缝，才敢出来。'},
 {from:58,to:65,text:'你是在门外{a:敲门}的人，\n还是在门里{r:抵着门}的人？',size:72,line2Delay:0.8},
];
export const BUBBLE_A='今天好想见你';
export const BUBBLE_B='嗯';
export const KNOB_LABEL='在乎';
export const THOUGHTS=['他会走吗','我是不是不够好','别靠太近'];
// 研究出处：画面右下角的小字，和片尾的完整来源（片尾逐字照抄，不要改拼写）。
export const SOURCE_TAGS:{from:number;to:number;text:string}[]=[
 {from:15.5,to:28.2,text:'Fraley & Shaver, 1997'},
 {from:28.5,to:42,text:'Mikulincer, Dolev & Shaver, 2004'},
];
export const SOURCES=[
 'Fraley, R. C., & Shaver, P. R. (1997). Adult attachment and the suppression of unwanted thoughts. JPSP, 73(5), 1080–1091.',
 'Mikulincer, M., Dolev, T., & Shaver, P. R. (2004). Attachment-related strategies during thought suppression. JPSP, 87(6), 940–956.',
];
export const DISCLAIMER='内容为心理学科普，不构成医疗建议';
