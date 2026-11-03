// 生成浅色模式背景里的星盘线稿：public/textures/astrolabe.svg。
// 仿中世纪欧洲星盘的铜版刻线：外圈刻度和罗马数字、回归线与赤道、地平高度圈、偏心的黄道环、指向亮星的星针、窥衡。
// 只画细线，颜色和透明度在 SVG 里定死，CSS 直接当背景图用。用法：node scripts/astrolabe-svg.mjs
import {writeFileSync,mkdirSync} from 'node:fs';
const f=n=>Number(n.toFixed(2)),rad=d=>d*Math.PI/180,P=(r,d)=>[f(r*Math.sin(rad(d))),f(-r*Math.cos(rad(d)))];
const out=[];const add=s=>out.push(s);
// 外缘：双圈 + 度数刻度（每 2° 短刻，每 10° 长刻）+ 十二个罗马数字
add('<circle r="486"/><circle r="474" stroke-width="1.6"/><circle r="440"/>');
for(let d=0;d<360;d+=2){const [x1,y1]=P(474,d),[x2,y2]=P(d%10?466:456,d);add(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`)}
const roman=['XII','I','II','III','IIII','V','VI','VII','VIII','IX','X','XI'];
roman.forEach((r,i)=>{const [x,y]=P(448-2,i*30);add(`<text x="${x}" y="${y}" transform="rotate(${i*30} ${x} ${y})" dy="-2">${r}</text>`)});
// 盘面：南回归线、赤道、北回归线
add('<circle r="410" stroke-width="1.3"/><circle r="262"/><circle r="168"/>');
// 方位线：从中心放射，只画在两条回归线之间，虚线
for(let d=0;d<360;d+=15){const [x1,y1]=P(168,d),[x2,y2]=P(410,d);add(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke-dasharray="2 6"/>`)}
// 地平高度圈：一组向上偏心的圆，被外盘裁掉
add('<g clip-path="url(#plate)">');for(let i=0;i<9;i++){const cy=f(70-i*30),r=f(380-i*38);add(`<circle cy="${cy}" r="${r}" stroke-width="${i===0?1.3:.8}"/>`)}add('</g>');
// 黄道环（网架）：偏心双圈 + 每 10° 一格
const ecy=-96,er=300;add(`<circle cy="${ecy}" r="${er}" stroke-width="1.5"/><circle cy="${ecy}" r="${er-22}"/>`);
for(let d=0;d<360;d+=10){const a=rad(d),x1=f((er-22)*Math.sin(a)),y1=f(ecy-(er-22)*Math.cos(a)),x2=f(er*Math.sin(a)),y2=f(ecy-er*Math.cos(a));add(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`)}
// 星针：网架上的火焰形指针，尖端点一颗小星
for(const [r,d] of [[350,22],[230,70],[380,128],[300,170],[200,215],[360,250],[250,300],[390,330],[140,110],[120,280]]){const [x,y]=P(r,d),[bx,by]=P(r-34,d-4),[cx,cy]=P(r-34,d+4);add(`<path d="M${bx} ${by}Q${f((bx+x)/2+6)} ${f((by+y)/2)} ${x} ${y}Q${f((cx+x)/2-6)} ${f((cy+y)/2)} ${cx} ${cy}"/><circle cx="${x}" cy="${y}" r="3.2" fill="currentColor" stroke="none"/>`)}
// 网架的支撑弧和中心星芒
add('<path d="M-410 0H410M0 -410V410" stroke-width=".7"/>');
for(let d=0;d<360;d+=45){const [x,y]=P(d%90?34:58,d),[l1,l2]=P(10,d-90),[r1,r2]=P(10,d+90);add(`<path d="M${l1} ${l2}L${x} ${y}L${r1} ${r2}"/>`)}
add('<circle r="12"/><circle r="4"/>');
// 窥衡（alidade）：斜穿盘面的长尺
add('<g transform="rotate(-28)"><rect x="-470" y="-9" width="940" height="18" rx="2"/><line x1="-470" y1="0" x2="470" y2="0" stroke-dasharray="1 5"/></g>');
const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="-500 -500 1000 1000" width="1000" height="1000">
<defs><clipPath id="plate"><circle r="410"/></clipPath></defs>
<g fill="none" stroke="currentColor" stroke-width=".9" color="#5b4426" font-family="Cinzel,Trajan Pro,'Times New Roman',serif" font-size="20" text-anchor="middle" letter-spacing="2" opacity=".13" style="color:#5b4426">
${out.join('\n').replace(/<text /g,'<text fill="currentColor" stroke="none" ')}
</g></svg>`;
mkdirSync('public/textures',{recursive:true});writeFileSync('public/textures/astrolabe.svg',svg);console.log('astrolabe.svg',svg.length,'bytes');
