// 把等距圆柱月面贴图投影成从地球看到的月球：
// 光照方向来自日月距角（Astronomy Engine MoonPhase），月面朝向来自天平动（Astronomy Engine Libration）。
// 北在上、未计算明暗界线的位置角；只用于展示，不作观测依据。
export interface MoonTexture {data:Uint8ClampedArray;width:number;height:number}
export interface MoonView {elongation:number;libLat:number;libLon:number}
const rad=Math.PI/180;
const smooth=(a:number,b:number,x:number)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t)};
/** 写入 size×size 的 RGBA 像素。贴图经度 0° 在图像正中。 */
export function shadeMoon(out:Uint8ClampedArray,size:number,tex:MoonTexture,view:MoonView){
 const e=view.elongation*rad,lx=Math.sin(e),lz=-Math.cos(e);
 const sb=Math.sin(view.libLat*rad),cb=Math.cos(view.libLat*rad),sl=Math.sin(view.libLon*rad),cl=Math.cos(view.libLon*rad);
 for(let py=0;py<size;py++)for(let px=0;px<size;px++){
  const x=(px+.5)/size*2-1,y=1-(py+.5)/size*2,r2=x*x+y*y,i=(py*size+px)*4;
  if(r2>=1){out[i+3]=0;continue}
  const z=Math.sqrt(1-r2),edge=Math.min(1,(1-Math.sqrt(r2))*size/2);
  const y1=y*cb+z*sb,z1=-y*sb+z*cb,x2=x*cl+z1*sl,z2=-x*sl+z1*cl;
  const lat=Math.asin(Math.max(-1,Math.min(1,y1))),lon=Math.atan2(x2,z2);
  const tu=Math.floor(((lon/(2*Math.PI)+.5)%1+1)%1*tex.width)%tex.width,tv=Math.min(tex.height-1,Math.max(0,Math.floor((.5-lat/Math.PI)*tex.height)));
  const t=(tv*tex.width+tu)*4,albedo=(tex.data[t]*.3+tex.data[t+1]*.59+tex.data[t+2]*.11)/255;
  const d=x*lx+z*lz,lit=smooth(-.045,.11,d)*(.62+.38*Math.sqrt(Math.max(0,d)));
  const v=Math.min(1,albedo*(lit*1.35+.07)*(.9+.1*z));
  out[i]=out[i+1]=out[i+2]=Math.round(v*255);out[i+3]=Math.round(edge*255);
 }
}
