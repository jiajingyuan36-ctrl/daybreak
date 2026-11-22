// 《回避型依恋》Scene 1 的时间点（秒）。
// 配音到位前用需求里的 2.2s / 3.5s；配音生成后跑 scripts/avoidant-beats.mjs，
// 按音频里的停顿量出「别骂自己冷血」和「其实」的起点，填回这里。
export type Scene1Beats={
 flip:number;   // 说到「别骂自己冷血」：聊天退后，「不是冷血」浮现
 alarm:number;  // 说到「其实，是你的大脑…」：震动，「亲密警报」弹出
 end:number;    // 配音结束（不含末尾 0.15s 留白）
};
export const DEFAULT_BEATS:Scene1Beats={flip:2.2,alarm:3.5,end:4.85};
export const TAIL=0.15; // 配音结束后只留 0.15s

// 字幕：按三个时间点切成四句；gold 里的词用琥珀金高亮
export const cues=(b:Scene1Beats)=>[
 {from:0,to:b.flip*.42,text:'对方越对你好，',gold:['对你好']},
 {from:b.flip*.42,to:b.flip,text:'你越想把手机扣过去、突然冷掉。',gold:['冷掉']},
 {from:b.flip,to:b.alarm,text:'别骂自己冷血。',gold:['冷血']},
 {from:b.alarm,to:b.end+TAIL,text:'其实，是你的大脑拉响了「亲密警报」。',gold:['亲密警报']},
];
