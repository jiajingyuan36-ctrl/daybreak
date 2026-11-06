// 网站地址只在这里写一次；以后换自己的域名，改这一处即可（分享图、日签、链接预览都会跟着变）。
// sitemap.xml 和 robots.txt 由 app/sitemap.ts、app/robots.ts 在构建时按这里的地址生成。
// 自有域名 daybreaktarot.xyz 已接通；旧的 Render 地址仍可打开。
export const SITE_HOST='daybreaktarot.xyz';
export const SITE_URL=`https://${SITE_HOST}`;
/** 「抽牌后问一个问题」的后端（server/，放在 Render，密钥只在那边）。AI_ENABLED 为 false 时网页上不显示这个入口。 */
export const AI_API='https://daybreak-ai.onrender.com';
export const AI_ENABLED=true;
/** 经营者的微信号：深度解读和提建议都用它。不要换成手机号。 */
export const WECHAT='YJJ_080922';
/** 经营者自我介绍，放在每处微信联系方式旁边，让人知道回复为什么慢。 */
export const OPERATOR_NOTE='在线时间：工作日晚上和周末。其他时间回复会慢一些，每条消息都会回。';
/** 一对一深度解读（付费，微信文字交付）。改价格、档位、退款规则只改这里，/deep/、使用条款和牌阵页入口都读它。
 *  price 留空时页面显示“开始前说明”。contact 为空时整个服务显示“即将开放”。 */
export const DEEP_READING={
 contact:[{label:'微信',value:WECHAT}] as {label:string;value:string;href?:string}[],
 format:'微信文字',
 payment:'微信转账',
 delivery:'一般 1 到 3 天内用文字交付',
 followUp:'交付后，可以针对这次解读再追问一次',
 tiers:[
  {name:'一张牌',cards:1,fit:'一个具体的小问题，想听一个清楚的角度',price:''},
  {name:'三张牌',cards:3,fit:'一件事的现状、阻碍和可以怎么做',price:''},
  {name:'凯尔特十字',cards:10,fit:'牵涉很多方面的一件事，或者一段时间的整体状态',price:''},
 ],
 refund:['付款后、开始解读前，可以全额退款。','解读交付后不退款。','如果因为我的原因超过约定时间没有交付，全额退款。'],
};
export const SITE_DESCRIPTION='晨启塔罗：每天早上抽一张塔罗，用大白话说说今天的状态和能做的一件小事；配真实月相和按生辰推算的今日运势。免费，不用注册。';
