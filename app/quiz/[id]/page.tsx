import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import {pageMeta} from '../../../src/meta';
import {SITE_URL} from '../../../src/site';
import {cardById} from '../../../src/cards';
import {QUIZ_RESULTS,isQuizCard} from '../../../src/quiz';
import {QuizResult} from '../../../src/components/quiz-app';
// 每种结果一个静态页（/quiz/m9/ …），给分享链接用：朋友点开先看到「你朋友是哪张牌」，再去自己测。
// 链接预览图由 scripts/build-quiz-og.mjs 生成在 public/og/quiz/。
export const dynamicParams=false;
export function generateStaticParams(){return Object.keys(QUIZ_RESULTS).map(id=>({id}))}
export async function generateMetadata({params}:{params:Promise<{id:string}>}):Promise<Metadata>{const {id}=await params;if(!isQuizCard(id))return {};const c=cardById(id),r=QUIZ_RESULTS[id];
 return pageMeta(`/quiz/${id}/`,`我是${c.nameZh}：${r.line}`,`${r.look} 你是哪一张？12 道题的塔罗性格测试，一分钟测完。`,{url:`${SITE_URL}/og/quiz/${id}.jpg`,width:1200,height:630,alt:`我是${c.nameZh}：${r.line}`})}
export default async function QuizShared({params}:{params:Promise<{id:string}>}){const {id}=await params;if(!isQuizCard(id))notFound();
 return <main className="page-shell quiz-page"><div className="quiz-stage"><QuizResult id={id} shared/></div></main>}
