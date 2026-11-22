// 《回避型依恋》Scene 1 的时间点（秒）。
// 配音到位前用需求里的 2.2s / 3.5s；配音生成后跑 scripts/avoidant-beats.mjs，
// 按音频里的停顿量出「别骂自己冷血」和「其实」的起点，填回这里。
export type Scene1Beats={
 cut1:number;   // 第一句字幕「对方越对你好，」结束
 flip:number;   // 说到「别骂自己冷血」：聊天退后，「不是冷血」浮现
 alarm:number;  // 说到「其实，是你的大脑…」：震动，「亲密警报」弹出
 end:number;    // 配音结束（不含末尾 0.15s 留白）
};
// 2026-11-22 Fish Audio s2.1-pro-free 生成的 avoid_1.mp3（7.26s），按停顿量出
export const DEFAULT_BEATS:Scene1Beats={cut1:1.17,flip:3.8,alarm:4.88,end:7.26};
export const TAIL=0.15; // 配音结束后只留 0.15s

// 字幕：按三个时间点切成四句；gold 里的词用琥珀金高亮
export const cues=(b:Scene1Beats)=>[
 {from:0,to:b.cut1,text:'对方越对你好，',gold:['对你好']},
 {from:b.cut1,to:b.flip,text:'你越想把手机扣过去、突然冷掉。',gold:['冷掉']},
 {from:b.flip,to:b.alarm,text:'别骂自己冷血。',gold:['冷血']},
 {from:b.alarm,to:b.end+TAIL,text:'其实，是你的大脑拉响了「亲密警报」。',gold:['亲密警报']},
];
