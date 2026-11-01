export type Style='温柔'|'直接'|'诗意';
export interface Card {id:string;nameZh:string;nameEn:string;arcanaType:'major'|'minor';suit:string;number:number;keywordsUpright:string[];keywordsReversed:string[];meaningUpright:string;meaningReversed:string;reflectionPrompt:string;visualKey:string;action:string;plainIntro:string;lifeAspects:{love:string;work:string;money:string}}
export interface Preferences {zodiacSign?:import('./sky.ts').Sign;themeMode?:import('./theme.ts').ThemeMode;birthDate?:string;birthTime?:string;nickname:string;themes:string[];style:Style;dark:boolean;onboarded:boolean}
export interface Reading {title:string;message:string;personal:string;action:string;observe:string;question:string;quote:string}
export interface Day {date:string;cardId:string;reversed:boolean;mood:string;intent:string;themes:string[];reading:Reading;fortune?:import('./fortune.ts').Fortune;review?:{actionDone?:boolean;resonance:string;note:string}}
export interface Data {version:1;preferences:Preferences;days:Record<string,Day>}
