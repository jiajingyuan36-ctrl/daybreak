// 网站地址只在这里写一次；以后换自己的域名，改这一处即可（分享图、日签、链接预览都会跟着变）。
export const SITE_HOST='daybreak-morning-ritual.onrender.com';
export const SITE_URL=`https://${SITE_HOST}`;
/** 一对一深度解读（付费）。contact 为空时页面显示“即将开放”；拿到联系方式后按 {label:'微信',value:'xxx'} 填进来即可。 */
export const DEEP_READING:{contact:{label:string;value:string;href?:string}[];price:string}={contact:[],price:''};
export const SITE_DESCRIPTION='每天抽一张塔罗，用大白话说说今天的状态和能做的一件小事；配真实月相和按生辰推算的今日运势。免费，不用注册。';
