import {Composition} from 'remotion';
import {Check} from './Check';
import {Temperance,TemperanceFilm,DURATION,FILM_DURATION,FPS} from './Temperance';
import {AvoidantAttachment,calcAvoidant,AVOIDANT_FRAMES} from './avoidant/AvoidantAttachment';
// 每条视频在这里登记一个 Composition。Check 只是装好以后用来确认能渲染的 3 秒测试片。
export const RemotionRoot=()=><>
 <Composition id="Check" component={Check} durationInFrames={90} fps={30} width={1080} height={1920}/>
 <Composition id="Temperance" component={Temperance} durationInFrames={DURATION} fps={FPS} width={1920} height={1080}/>
 <Composition id="TemperanceFilm" component={TemperanceFilm} durationInFrames={FILM_DURATION} fps={FPS} width={1280} height={720}/>
 <Composition id="TemperanceFilmV2" component={TemperanceFilm} defaultProps={{v:'v2'}} durationInFrames={FILM_DURATION} fps={FPS} width={1280} height={720}/>
 {/* 《回避型依恋》EP.02（竖屏）。帧数由 src/avoidant-timeline.json 决定，改稿后跑 scripts/avoidant-tts.mjs */}
 <Composition id="AvoidantAttachment" component={AvoidantAttachment} calculateMetadata={calcAvoidant} defaultProps={{bgm:false}} durationInFrames={AVOIDANT_FRAMES} fps={30} width={1080} height={1920}/>
</>;
