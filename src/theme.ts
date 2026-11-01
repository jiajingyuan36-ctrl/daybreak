export type ThemeMode='auto'|'dark'|'light';
export function isDark(mode:ThemeMode='auto',date=new Date()){const h=date.getHours();return mode==='dark'||mode==='auto'&&(h<7||h>=19)}
