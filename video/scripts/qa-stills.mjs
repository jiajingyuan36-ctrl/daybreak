// 抽帧质检：只打包一次，按帧号批量出静帧到 qa_frames/。node scripts/qa-stills.mjs <CompositionId> <帧号…>
import {bundle} from '@remotion/bundler';
import {renderStill,selectComposition} from '@remotion/renderer';
import {mkdirSync} from 'node:fs';import path from 'node:path';
const [id,...frames]=process.argv.slice(2);
const serveUrl=await bundle({entryPoint:path.resolve('src/index.ts')});
const browserExecutable=process.env.REMOTION_BROWSER||'/opt/pw-browsers/chromium';
const composition=await selectComposition({serveUrl,id,browserExecutable});
mkdirSync('qa_frames',{recursive:true});
for(const fr of frames.map(Number)){await renderStill({serveUrl,composition,frame:fr,output:`qa_frames/frame_${String(fr).padStart(4,'0')}.png`,browserExecutable});console.log('qa_frames/frame_'+String(fr).padStart(4,'0')+'.png');}
