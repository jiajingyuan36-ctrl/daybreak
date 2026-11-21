import {AbsoluteFill,interpolate,useCurrentFrame} from 'remotion';
// 安装检查用的 3 秒测试片：竖版 1080×1920，黑底，象牙白的一行字淡入。
export const Check=()=>{const f=useCurrentFrame();const o=interpolate(f,[0,30],[0,1],{extrapolateRight:'clamp'});
 return <AbsoluteFill style={{background:'#09090b',color:'#e9e3d5',justifyContent:'center',alignItems:'center',fontFamily:'serif'}}>
  <div style={{opacity:o,fontSize:72,letterSpacing:'0.3em'}}>DAYBREAK</div>
 </AbsoluteFill>};
