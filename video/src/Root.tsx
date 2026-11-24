import {Composition} from 'remotion';
import {Check} from './Check';
import {Episode01} from './ep01/Episode';
// 每条视频在这里登记一个 Composition。Check 只是装好以后用来确认能渲染的 3 秒测试片。
export const RemotionRoot=()=><>
 <Composition id="Check" component={Check} durationInFrames={90} fps={30} width={1080} height={1920}/>
 {/* 第 1 期「回避型依恋」，70 秒。分段看片：npx remotion render Ep01 out/x.mp4 --frames=450-1259 */}
 <Composition id="Ep01" component={Episode01} durationInFrames={2100} fps={30} width={1920} height={1080}/>
</>;
