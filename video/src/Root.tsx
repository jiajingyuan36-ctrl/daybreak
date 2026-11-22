import {Composition} from 'remotion';
import {Check} from './Check';
import {Temperance,TemperanceFilm,DURATION,FILM_DURATION,FPS} from './Temperance';
import {Avoidant,calcAvoidant} from './avoidant/Avoidant';
// 每条视频在这里登记一个 Composition。Check 只是装好以后用来确认能渲染的 3 秒测试片。
export const RemotionRoot=()=><>
 <Composition id="Check" component={Check} durationInFrames={90} fps={30} width={1080} height={1920}/>
 <Composition id="Temperance" component={Temperance} durationInFrames={DURATION} fps={FPS} width={1920} height={1080}/>
 <Composition id="TemperanceFilm" component={TemperanceFilm} durationInFrames={FILM_DURATION} fps={FPS} width={1280} height={720}/>
 <Composition id="TemperanceFilmV2" component={TemperanceFilm} defaultProps={{v:'v2'}} durationInFrames={FILM_DURATION} fps={FPS} width={1280} height={720}/>
 {/* 《回避型依恋》心理短视频（竖屏）。时长由配音决定，见 avoidant/Avoidant.tsx 的 calcAvoidant */}
 <Composition id="Avoidant" component={Avoidant} calculateMetadata={calcAvoidant} defaultProps={{beats:{cut1:1.17,flip:3.8,alarm:4.88,end:7.26},hasAudio:true,scene1Frames:223}} durationInFrames={223} fps={30} width={1080} height={1920}/>
</>;
