// 网站地址只在这里写一次；以后换自己的域名，改这一处即可（分享图、日签、链接预览都会跟着变）。
// sitemap.xml 和 robots.txt 由 app/sitemap.ts、app/robots.ts 在构建时按这里的地址生成。
// 自有域名 daybreaktarot.xyz 还没接通，先用 Render 的原地址；接通后改回这里即可。
export const SITE_HOST='daybreak-morning-ritual.onrender.com';
export const SITE_URL=`https://${SITE_HOST}`;
/** 「抽牌后问一个问题」的后端（server/，放在 Render，密钥只在那边）。AI_ENABLED 为 false 时网页上不显示这个入口。 */
export const AI_API='https://daybreak-ai.onrender.com';
export const AI_ENABLED=true;
/** 经营者的微信号：深度解读和提建议都用它。不要换成手机号。 */
export const WECHAT='YJJ_080922';
/** 经营者自我介绍，放在每处微信联系方式旁边，让人知道回复为什么慢。 */
export const OPERATOR_NOTE='我是一名高中生，平时在上课，回复会慢一些，一般在晚上或周末，但每条消息都会回。';
/** 一对一深度解读（付费）。contact 为空时页面显示“即将开放”。 */
export const DEEP_READING:{contact:{label:string;value:string;href?:string}[];price:string}={contact:[{label:'微信',value:WECHAT}],price:''};
export const SITE_DESCRIPTION='晨启塔罗：每天早上抽一张塔罗，用大白话说说今天的状态和能做的一件小事；配真实月相和按生辰推算的今日运势。免费，不用注册。';
