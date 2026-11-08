export const chinaDateTimeFormatter=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});

export function chinaDateString(date:Date):string {
 if(!Number.isFinite(date.valueOf()))throw new RangeError('无效时间');
 const parts=chinaDateTimeFormatter.formatToParts(date);
 const part=(key:Intl.DateTimeFormatPartTypes)=>parts.find(value=>value.type===key)!.value;
 return `${part('year')}-${part('month')}-${part('day')}`;
}

/** 无时刻的公历日期采用中国历书民用日；固定正午使生日/日签与设备时区无关。 */
export function dateAtChinaNoon(dateStr:string):Date {
 if(!/^\d{4}-\d{2}-\d{2}$/.test(dateStr))throw new RangeError('日期格式须为 YYYY-MM-DD');
 const date=new Date(`${dateStr}T12:00:00+08:00`);
 const year=Number(dateStr.slice(0,4));
 if(!Number.isFinite(date.valueOf())||chinaDateString(date)!==dateStr||year<1900||year>2100)throw new RangeError('支持1900—2100年的有效公历日期');
 return date;
}
