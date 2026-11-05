export type Style='温柔'|'直接'|'诗意';
export interface Card {id:string;nameZh:string;nameEn:string;arcanaType:'major'|'minor';suit:string;number:number;keywordsUpright:string[];keywordsReversed:string[];meaningUpright:string;meaningReversed:string;reflectionPrompt:string;visualKey:string;action:string;plainIntro:string;lifeAspects:{love:string;work:string;money:string}}
export interface Preferences {zodiacSign?:import('./sky.ts').Sign;themeMode?:import('./theme.ts').ThemeMode;birthDate?:string;birthTime?:string;nickname:string;themes:string[];style:Style;dark:boolean;onboarded:boolean;
 /** 每日抽牌方式：牌扇（默认）或北斗。可选，旧记录没有这个字段 */ ritual?:'fan'|'dipper';
 /** 北斗仪式的观测地。只存在本机，不上传、不写进分享图。lon 缺省时按时区估计 */ observer?:{lat:number;lon?:number};
 /** 北斗分享图上写不写“北纬约 xx°”，默认不写 */ shareLatitude?:boolean}
export interface Reading {title:string;message:string;personal:string;action:string;observe:string;question:string;quote:string}
export interface Day {date:string;cardId:string;reversed:boolean;mood:string;intent:string;themes:string[];reading:Reading;fortune?:import('./fortune.ts').Fortune;
 /** 这张牌是用哪种方式抽的（可选） */ ritual?:'fan'|'dipper';
 /** 北斗仪式抽牌那一刻的真实天空：斗柄方位（罗盘度数）、摇光高度、观测纬度经度、时刻。只用于展示和分享图 */ dipper?:{handleAz:number;alkaidAlt:number;lat:number;lon?:number;at?:string};review?:{actionDone?:boolean;resonance:string;note:string};redraws?:number;
 /** 抽牌后“问一个问题”的提问与回答，只存在本机 */ asks?:{q:string;a:string;at:string;crisis?:boolean}[]}
export interface Data {version:1;preferences:Preferences;days:Record<string,Day>}
