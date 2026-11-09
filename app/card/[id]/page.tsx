import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import {pageMeta} from '../../../src/meta';
import {SITE_URL} from '../../../src/site';
import {cards} from '../../../src/cards';
import {knowledgeById} from '../../../src/knowledge';
import {cardAstro,ASTRO_SOURCE_LEAD,ASTRO_SOURCE_LINK,ASTRO_SOURCE_URL} from '../../../src/astro';
import {TarotPlate} from '../../../src/components/tarot/tarot-plate';
import {EditorialSection} from '../../../src/components/tarot/editorial-section';
import {cardImageUrl} from '../../../src/art';
// 每张牌一个静态页面（/card/m0/ … /card/pentacles-14/），给搜索和分享用。
// 文字全部来自 plain.ts / knowledge.ts / astro.ts，这里只排版，不另写牌义。
export const dynamicParams=false;
export function generateStaticParams(){return cards.map(c=>({id:c.id}))}
const find=(id:string)=>cards.find(c=>c.id===id);
// 星座符号（♈–♓）在很多手机上默认显示成彩色 emoji，加 U+FE0E 让它按文字显示
const textGlyph=(s:string)=>s.replace(/([\u2648-\u2653])/g,'$1\uFE0E');
const short=(s:string,n=110)=>[...s].length>n?[...s].slice(0,n-1).join('')+'…':s;
export async function generateMetadata({params}:{params:Promise<{id:string}>}):Promise<Metadata>{const {id}=await params;const c=find(id);if(!c)return {};
 // 每张牌自己的分享图由 scripts/build-card-og.mjs 生成在 public/og/cards/
 return pageMeta(`/card/${c.id}/`,`${c.nameZh}（${c.nameEn}）正位与逆位含义`,short(`${c.nameZh}：${c.plainIntro}`),{url:`${SITE_URL}/og/cards/${c.id}.jpg`,width:1200,height:630,alt:`${c.nameZh}（${c.nameEn}）· 今天，你会抽到哪一张？`})}
export default async function CardPage({params}:{params:Promise<{id:string}>}){const {id}=await params;const c=find(id);if(!c)notFound();
 const k=knowledgeById(c.id),astro=cardAstro(c.id),i=cards.indexOf(c),prev=cards[(i+77)%78],next=cards[(i+1)%78];
 const group=c.arcanaType==='major'?`大阿卡纳 · ${String(c.number).padStart(2,'0')}`:`小阿卡纳 · ${c.suit}`;
 return <main className="page-shell legal-page card-page">
  <nav className="card-crumb" aria-label="位置"><a href="/encyclopedia/">图鉴</a><span aria-hidden="true">›</span><span>{c.nameZh}</span></nav>
  <header className="card-head"><TarotPlate className="card-art" src={cardImageUrl(c.id)} alt={`${c.nameZh}（1909 年原版韦特塔罗）`} width={350} height={600}/><div><p className="card-group">{group}</p><h1>{c.nameZh}</h1><p className="card-en">{c.nameEn}</p><p className="card-intro">{c.plainIntro}</p></div></header>
  <EditorialSection number="I" title="正位" heading="h2"><ul className="card-keys" aria-label="正位关键词">{c.keywordsUpright.map(x=><li key={x}>{x}</li>)}</ul><p>{c.meaningUpright}</p></EditorialSection>
  <EditorialSection number="II" title="逆位" heading="h2"><ul className="card-keys" aria-label="逆位关键词">{c.keywordsReversed.map(x=><li key={x}>{x}</li>)}</ul><p>{c.meaningReversed}</p></EditorialSection>
  <section><h2>放到生活里</h2><dl className="card-life"><div><dt>关系</dt><dd>{c.lifeAspects.love}</dd></div><div><dt>学业事业</dt><dd>{c.lifeAspects.work}</dd></div><div><dt>资源与精力</dt><dd>{c.lifeAspects.money}</dd></div></dl></section>
  <EditorialSection number="III" title="今天可做" heading="h2" className="ritual-ticket"><p>{c.action}</p><p className="card-question">晚上可以问问自己：{c.reflectionPrompt}</p></EditorialSection>
  <section><h2>牌面符号</h2><p>{k.symbols}</p><p className="card-meta">元素：{k.element}</p>{astro&&<p className="card-meta">星座对应：{textGlyph(astro.label)}{astro.title?`（${astro.title.zh}）`:''}。{astro.plain}</p>}</section>
  <section className="card-source"><h2>出处与说明</h2><p>{k.tradition}{k.editorialNote}</p><p><a href={k.source} target="_blank" rel="noreferrer">韦特《塔罗图解》原文（维基文库）</a></p>{astro&&<p>{ASTRO_SOURCE_LEAD}<a href={ASTRO_SOURCE_URL} target="_blank" rel="noreferrer">{ASTRO_SOURCE_LINK}</a>。</p>}<p>塔罗在这里是帮你整理想法的工具，不预测确定的结果。</p></section>
  <div className="card-cta"><a className="card-draw" href="/ritual/"><span aria-hidden="true">✦</span>抽今天的牌</a><a href="/encyclopedia/">看全部 78 张</a></div>
  <nav className="card-pager" aria-label="上一张和下一张"><a href={`/card/${prev.id}/`} rel="prev"><small>上一张</small>{prev.nameZh}</a><a href={`/card/${next.id}/`} rel="next"><small>下一张</small>{next.nameZh}</a></nav>
 </main>}
