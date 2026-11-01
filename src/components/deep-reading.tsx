import {DEEP_READING} from '../site';
export function DeepContact(){const c=DEEP_READING.contact;return c.length?<ul className="deep-contact">{c.map(x=><li key={x.label}><span>{x.label}</span>{x.href?<a href={x.href} target="_blank" rel="noreferrer">{x.value}</a>:<strong>{x.value}</strong>}</li>)}</ul>:<p className="deep-soon">即将开放。</p>}
/** 牌阵页底部的付费深度解读入口。 */
export function DeepReadingNote(){return <section className="deep-note" aria-labelledby="deep-note-title"><p className="fortune-kicker">付费 · 一对一</p><h2 id="deep-note-title">深度解读</h2><p>想把一件事聊透？解读师会根据你的问题和处境，用完整牌阵逐张讲给你听，再给出具体的建议。</p><DeepContact/><a className="deep-more" href="/deep/">了解怎么进行</a></section>}
