'use client';
import {useState} from 'react';
import {DEEP_READING,OPERATOR_NOTE} from '../site';
/** 一个可复制的联系方式。微信号没法直接点开，所以给一个“复制”按钮。 */
function ContactValue({value,href}:{value:string;href?:string}){const [copied,setCopied]=useState(false);
 async function copy(){try{await navigator.clipboard.writeText(value)}catch{const t=document.createElement('textarea');t.value=value;document.body.appendChild(t);t.select();try{document.execCommand('copy')}catch{}t.remove()}setCopied(true);setTimeout(()=>setCopied(false),1800)}
 return <>{href?<a href={href} target="_blank" rel="noreferrer">{value}</a>:<strong>{value}</strong>}<button type="button" className="copy-contact" onClick={copy}>{copied?'已复制':'复制'}</button></>}
/** 联系方式加经营者说明；remark 是加好友时请对方写的备注，extra 是这个场景下额外想说的话。 */
export function ContactCard({remark,extra}:{remark:string;extra?:string}){const c=DEEP_READING.contact;if(!c.length)return <p className="deep-soon">即将开放。</p>;
 return <div className="contact-card"><ul className="deep-contact">{c.map(x=><li key={x.label}><span>{x.label}</span><ContactValue value={x.value} href={x.href}/></li>)}</ul><p className="contact-note">加好友时请备注「{remark}」。{OPERATOR_NOTE}{extra||''}</p></div>}
export function DeepContact(){return <ContactCard remark="解读" extra="你说的事只用于这次解读，不会给别人看。形式和价格开始前都会说清楚，先来随便聊聊也欢迎。"/>}
/** 牌阵页底部的付费深度解读入口。 */
export function DeepReadingNote(){return <section className="deep-note" aria-labelledby="deep-note-title"><p className="fortune-kicker">付费 · 一对一</p><h2 id="deep-note-title">深度解读</h2><p>想把一件事聊透？解读师会根据你的问题和处境，用完整牌阵逐张讲给你听，再给出具体的建议。</p><DeepContact/><a className="deep-more" href="/deep/">了解怎么进行</a></section>}
