import {Composition} from 'remotion';
import {Check} from './Check';
import {Temperance,DURATION,FPS} from './Temperance';
// 每条视频在这里登记一个 Composition。Check 只是装好以后用来确认能渲染的 3 秒测试片。
export const RemotionRoot=()=><>
 <Composition id="Check" component={Check} durationInFrames={90} fps={30} width={1080} height={1920}/>
 <Composition id="Temperance" component={Temperance} durationInFrames={DURATION} fps={FPS} width={1920} height={1080}/>
</>;
