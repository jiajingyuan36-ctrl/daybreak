import {interpolate,useCurrentFrame,useVideoConfig} from 'remotion';
import {C,FONT,SAFE,clamp} from '../design/tokens';

// 抖音安全区电影字幕：bottom 305px，无底框，多层柔影，逐词情绪高亮。每句不超过 13 字（稿子里已切好）。
export type SubCue={text:string;highlight:string[];from:number;to:number};
export const CinemaSubtitle=({cues,color}:{cues:SubCue[];color:string})=>{const f=useCurrentFrame();const {fps}=useVideoConfig();const t=f/fps;
 const c=cues.find(x=>t>=x.from&&t<x.to);if(!c)return null;
 const o=Math.min(interpolate(t,[c.from,c.from+.1],[0,1],clamp),interpolate(t,[c.to-.06,c.to],[1,0],clamp));
 const parts=c.highlight.length?c.text.split(new RegExp(`(${c.highlight.join('|')})`)):[c.text];
 return <div style={{position:'absolute',left:SAFE.left,right:SAFE.right,bottom:305,textAlign:'center',whiteSpace:'nowrap',opacity:o,translate:`0px ${(1-o)*5}px`,
  fontFamily:FONT.sans,fontWeight:700,fontSize:44,letterSpacing:'.02em',color:C.warm,
  textShadow:'0 1px 2px rgba(0,0,0,.85),0 2px 10px rgba(0,0,0,.6),0 0 30px rgba(0,0,0,.5)'}}>
  {parts.map((p,i)=>c.highlight.includes(p)?<span key={i} style={{color}}>{p}</span>:<span key={i}>{p}</span>)}
 </div>};
