import type {Metadata} from 'next';
import {pageMeta} from '../../src/meta';
import {SITE_URL} from '../../src/site';
import {QuizApp} from '../../src/components/quiz-app';
// 性格测试入口。题目、计分和 22 种结果都在 src/quiz.ts。
export const metadata:Metadata=pageMeta('/quiz/','你是哪张塔罗牌？12 道题的性格测试','12 道生活里的小选择，在 22 张大阿卡纳里找到最像你的那一张：你的样子、你的盲点、今天做一件事。性格测试，不算命，一分钟测完。',{url:`${SITE_URL}/og/quiz/cover.jpg`,width:1200,height:630,alt:'你是哪张塔罗牌？晨启塔罗性格测试'});
export default function Quiz(){return <main className="page-shell quiz-page"><QuizApp/></main>}
