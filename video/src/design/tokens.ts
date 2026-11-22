import {Easing} from 'remotion';

// 全片设计常量：色彩弧线、字体、安全区、缓动。各条视频的引擎组件（src/engine/）都从这里取值。
export const C={
 warm:'#F5F3EE',          // 主字色
 blue:'#7CC4FA',          // 深夜手机冷光
 grey:'#C8C5BE',          // 白天冷灰
 red:'#D94A4A',           // 警示 / 透支
 amber:'#F2C17D',         // 傍晚治愈
 muted:'rgba(245,243,238,0.62)',
 shadow:'0 2px 16px rgba(0,0,0,0.6)',
};
// Songti / PingFang 在渲染机（Linux）上没有，实际落到 Noto Serif SC / Noto Sans SC
export const FONT={
 serif:"'Songti SC','Noto Serif SC',serif",
 sans:"-apple-system,'PingFang SC','Noto Sans SC',sans-serif",
 mono:"'DejaVu Sans Mono','Menlo',monospace",
};
// 抖音竖屏安全区（px）
export const SAFE={top:180,right:140,bottom:280,left:56};
export const W=1080,H=1920;
export const EASE_CINEMA=Easing.bezier(0.16,1,0.3,1);
export const EASE_SNAP=Easing.bezier(0.85,0,0.15,1);
export const clamp={extrapolateLeft:'clamp',extrapolateRight:'clamp'} as const;
// 百分比一律封顶，避免 101% 穿帮
export const pct=(v:number)=>Math.min(100,Math.max(0,Math.round(v)));
// 毛玻璃
export const GLASS={background:'rgba(20,22,26,0.58)',backdropFilter:'blur(16px)',WebkitBackdropFilter:'blur(16px)',border:'1px solid rgba(255,255,255,0.14)',borderRadius:18} as const;

// 商业纪录片色板（StarbucksBank）
export const FIN={
 paper:'#F4EFE6',         // 暖新闻纸白：标题与剪报卡
 gold:'#D4AF37',          // 香槟金：核心金额与高亮
 red:'#C84B4B',           // 朱砂红：划掉、印章
 green:'#1B4332',greenHi:'#2D6A4F', // 深森绿：星巴克条与隐喻色
 ink:'#141517',           // 炭黑油墨
 muted:'rgba(244,239,230,0.62)',
};
