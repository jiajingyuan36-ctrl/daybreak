'use client';
import {useState} from 'react';
import {DEEP_READING,OPERATOR_NOTE} from '../site';
/** 一个可复制的联系方式。微信号没法直接点开，所以给一个“复制”按钮。 */
function ContactValue({label,value,href}:{label:string;value:string;href?:string}){const [copied,setCopied]=useState(false);
 async function copy(){try{await navigator.clipboard.writeText(value)}catch{const t=document.createElement('textarea');t.value=value;document.body.appendChild(t);t.select();try{document.execCommand('copy')}catch{}t.remove()}setCopied(true);setTimeout(()=>setCopied(false),1800)}
 return <>{href?<a href={href} target="_blank" rel="noreferrer">{value}</a>:<strong>{value}</strong>}<button type="button" className={`copy-contact${copied?' is-done':''}`} onClick={copy} aria-live="polite">{copied?<><span className="done-mark" aria-hidden="true">✓</span>已复制</>:`复制${label==='微信'?'微信号':''}`}</button></>}
/** 联系方式加经营者说明；remark 是加好友时请对方写的备注，extra 是这个场景下额外想说的话。 */
export function ContactCard({remark,extra}:{remark:string;extra?:string}){const c=DEEP_READING.contact;if(!c.length)return <p className="deep-soon">即将开放。</p>;
 return <div className="contact-card"><ul className="deep-contact">{c.map(x=><li key={x.label}><span>{x.label}</span><ContactValue label={x.label} value={x.value} href={x.href}/></li>)}</ul><p className="contact-note">加好友时请备注「{remark}」。{OPERATOR_NOTE}{extra||''}</p></div>}
export function DeepContact(){return <ContactCard remark="解读" extra="你说的事只用于这次解读，不会给别人看。形式和价格开始前都会说清楚，先来随便聊聊也欢迎。"/>}
/** 牌阵页底部的付费深度解读入口。 */
// 毛玻璃名片：顶部一枚小星芒，标题、服务范围的胶囊标签、说明，联系方式单独一条并能一键复制
export function DeepReadingNote(){return <section className="deep-note deep-card" aria-labelledby="deep-note-title"><svg className="deep-mark" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2L13.6 10.4L22 12L13.6 13.6L12 22L10.4 13.6L2 12L10.4 10.4Z"/><circle cx="12" cy="12" r="7.5"/></svg><h2 id="deep-note-title">付费 · 一对一深度解读</h2><ul className="deep-pills" aria-label="服务范围"><li>一件具体的事</li><li>按牌阵大小分档</li><li>微信文字逐张讲解</li></ul><p>想把一件事聊透？我会根据你的问题和处境，用合适的牌阵逐张讲给你听，再落到你能做的具体事情上。不预测结果，开始前说清楚价格。</p><DeepContact/><a className="deep-more" href="/deep/">了解怎么进行</a></section>}
