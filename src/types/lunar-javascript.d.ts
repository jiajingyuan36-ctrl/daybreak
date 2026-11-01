declare module 'lunar-javascript' {
  export interface SolarDate { getYear():number; getMonth():number; getDay():number; getHour():number; getMinute():number; getSecond():number; toYmd():string; toYmdHms():string; getLunar():LunarDate }
  export interface LunarDate { getYear():number; getMonth():number; getDay():number; getYearInChinese():string; getMonthInChinese():string; getDayInChinese():string; getYearInGanZhiByLiChun():string; getMonthInGanZhiExact():string; getDayInGanZhi():string; getDayGan():string; getDayZhi():string; getDayYi():string[]; getDayJi():string[]; getJieQi():string; getJieQiTable():Record<string,SolarDate>; getEightChar():EightChar; getYearShengXiao():string; getDayChongShengXiao():string; getDayPositionXiDesc():string; getDayPositionCaiDesc():string }
  export interface EightChar { getYear():string; getMonth():string; getDay():string; getTime():string; getDayGan():string; getDayZhi():string; getYearZhi():string; getDayNaYin():string }
  export const Solar:{fromYmdHms(year:number,month:number,day:number,hour:number,minute:number,second:number):SolarDate;fromYmd(year:number,month:number,day:number):SolarDate};
  export const Lunar:{fromYmd(year:number,month:number,day:number):LunarDate};
  export const LunarUtil:{SHI_SHEN:Record<string,string>;CHONG:string[];HE_ZHI_6:string[];ZHI:string[];WU_XING_GAN:Record<string,string>;WU_XING_ZHI:Record<string,string>};
  const api:{Solar:typeof Solar;Lunar:typeof Lunar;LunarUtil:typeof LunarUtil};
  export default api;
}
