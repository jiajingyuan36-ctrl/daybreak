import {AbsoluteFill,interpolate,random,useCurrentFrame,useVideoConfig} from 'remotion';
import {clamp} from '../design/tokens';

// 电影光学后期：35mm 呼吸颗粒（每 2 帧换种子）、柔和暗角、转场漏光、闪白。叠在整幕最上层。
export const Grain=({opacity=.06}:{opacity?:number})=>{const f=useCurrentFrame();const k=Math.floor(f/2);const seed=Math.floor(random('og'+k)*1000);
 return <AbsoluteFill style={{opacity:opacity*(.85+.3*random('ob'+k)),mixBlendMode:'overlay',pointerEvents:'none'}}>
  <svg width="100%" height="100%"><filter id={'og'+k}><feTurbulence type="fractalNoise" baseFrequency=".88" numOctaves={2} seed={seed} stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter><rect width="100%" height="100%" filter={`url(#og${k})`}/></svg>
 </AbsoluteFill>};

export const Vignette=({strength=.42}:{strength?:number})=>
 <AbsoluteFill style={{pointerEvents:'none',background:`radial-gradient(ellipse 78% 62% at 50% 46%,transparent 58%,rgba(0,0,0,${strength}) 100%)`}}/>;

// 漏光：从一侧扫过的暖 / 冷光斑（秒）
export const LightLeak=({at,dur=.6,tone}:{at:number;dur?:number;tone:'warm'|'cold'})=>{const f=useCurrentFrame();const {fps}=useVideoConfig();const t=f/fps;
 const p=interpolate(t,[at,at+dur],[0,1],clamp);if(p<=0||p>=1)return null;
 const col=tone==='warm'?'255,170,90':'150,200,255';const o=Math.sin(Math.PI*p);
 return <AbsoluteFill style={{pointerEvents:'none',mixBlendMode:'screen',opacity:o*.75,
  background:`radial-gradient(ellipse 60% 45% at ${-20+p*140}% ${30+p*25}%,rgba(${col},.85),rgba(${col},.25) 45%,transparent 75%)`}}/>};

// 闪白（帧）
export const Flash=({at,frames=3,color='235,242,255'}:{at:number;frames?:number;color?:string})=>{const f=useCurrentFrame();
 const k=f-at;if(k<0||k>=frames+3)return null;
 const o=k<frames?.9:interpolate(k,[frames,frames+3],[.9,0],clamp);
 return <AbsoluteFill style={{pointerEvents:'none',background:`rgb(${color})`,opacity:o}}/>};

export const OpticalPolish=({grain=.06,vignette=.42}:{grain?:number;vignette?:number})=><><Vignette strength={vignette}/><Grain opacity={grain}/></>;
