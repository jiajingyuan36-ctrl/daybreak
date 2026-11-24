import {Composition} from 'remotion';
import {Check} from './Check';
import {Temperance,TemperanceFilm,DURATION,FILM_DURATION,FPS} from './Temperance';
import {AvoidantAttachment,calcAvoidant,AVOIDANT_FRAMES} from './avoidant/AvoidantAttachment';
import {RevengeBedtime,calcRevenge,REVENGE_FRAMES} from './revenge/RevengeBedtime';
import {StarbucksBank,calcSbux,SBUX_FRAMES} from './sbux/StarbucksBank';
import {Everest,EVEREST_FRAMES} from './everest/Everest';
import {Titanic,TITANIC_FRAMES} from './titanic/Titanic';
// 每条视频在这里登记一个 Composition。Check 只是装好以后用来确认能渲染的 3 秒测试片。
export const RemotionRoot=()=><>
 <Composition id="Check" component={Check} durationInFrames={90} fps={30} width={1080} height={1920}/>
 <Composition id="Temperance" component={Temperance} durationInFrames={DURATION} fps={FPS} width={1920} height={1080}/>
 <Composition id="TemperanceFilm" component={TemperanceFilm} durationInFrames={FILM_DURATION} fps={FPS} width={1280} height={720}/>
 <Composition id="TemperanceFilmV2" component={TemperanceFilm} defaultProps={{v:'v2'}} durationInFrames={FILM_DURATION} fps={FPS} width={1280} height={720}/>
 {/* 《回避型依恋》EP.02（竖屏）。帧数由 src/avoidant-timeline.json 决定，改稿后跑 npm run tts -- avoidant */}
 <Composition id="AvoidantAttachment" component={AvoidantAttachment} calculateMetadata={calcAvoidant} defaultProps={{bgm:false}} durationInFrames={AVOIDANT_FRAMES} fps={30} width={1080} height={1920}/>
 {/* 《报复性熬夜》RevengeBedtime（竖屏）。帧数由 src/stayup-timeline.json 决定，改稿后跑 npm run tts -- stayup */}
 <Composition id="RevengeBedtime" component={RevengeBedtime} calculateMetadata={calcRevenge} defaultProps={{bgm:false}} durationInFrames={REVENGE_FRAMES} fps={30} width={1080} height={1920}/>
 {/* 《光，退回山顶》珠峰纪录短片（横屏 2.39:1 黑边）。素材：python3 scripts/film-prep.py everest <素材目录>；声音：python3 scripts/generate-everest-audio.py */}
 <Composition id="Everest" component={Everest} defaultProps={{captions:true}} durationInFrames={EVEREST_FRAMES} fps={24} width={1920} height={1080}/>
 <Composition id="EverestClean" component={Everest} defaultProps={{captions:false}} durationInFrames={EVEREST_FRAMES} fps={24} width={1920} height={1080}/>
 {/* 《两小时四十分》泰坦尼克号（横屏 2.39:1 黑边）。素材：python3 scripts/film-prep.py titanic <素材目录>；声音：python3 scripts/generate-titanic-audio.py */}
 <Composition id="Titanic" component={Titanic} defaultProps={{captions:true}} durationInFrames={TITANIC_FRAMES} fps={24} width={1920} height={1080}/>
 {/* 《星巴克：不付利息的「银行」》StarbucksBank（竖屏）。帧数由 src/sbux-timeline.json 决定，改稿后跑 npm run tts -- sbux */}
 <Composition id="StarbucksBank" component={StarbucksBank} calculateMetadata={calcSbux} defaultProps={{bgm:false}} durationInFrames={SBUX_FRAMES} fps={30} width={1080} height={1920}/>
</>;
