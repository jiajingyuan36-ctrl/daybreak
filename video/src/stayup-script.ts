// 《报复性熬夜》（RevengeBedtime）口播稿与字幕：唯一来源。改文案只改这里，再跑 npm run tts -- stayup 重新生成配音和时间轴。
// 字幕逐字取自口播（不缩写），每句不超过 13 个字；highlight 里的词用本幕的高亮色。
import type {SceneScript} from './avoidant-script';
export const VOICE='159b7a7b9a8b4a27b21f6d32111718a6';
const cue=(text:string,...highlight:string[])=>({text,highlight});
export const SCENES:SceneScript[]=[
 {id:1,name:'不是不想睡',image:'images/stayup_1.jpg',audio:'audio/stayup_1.mp3',speed:1.10,tail:.12,
  narration:'困得手机都砸脸上两次了，你还是死活不肯闭眼。别怪自己没自制力——你不是不想睡，你是觉得，今天压根没替自己活过。',
  subtitles:[cue('困得手机都砸脸上两次了，','砸脸上两次'),cue('你还是死活不肯闭眼。','死活不肯闭眼'),cue('别怪自己没自制力——','没自制力'),cue('你不是不想睡，','不是不想睡'),cue('你是觉得，'),cue('今天压根没替自己活过。','没替自己活过')]},
 {id:2,name:'白天被掏空',image:'images/stayup_2.jpg',audio:'audio/stayup_2.mp3',speed:1.06,tail:.12,
  narration:'你想想你的一天：从早起闹钟响那一秒开始，时间全是别人的——老板的、课业的、回不完的消息、干不完的活。你像个借来的工具，转了一整天。',
  subtitles:[cue('你想想你的一天：'),cue('从早起闹钟响那一秒开始，','闹钟响'),cue('时间全是别人的——','全是别人的'),cue('老板的、课业的、'),cue('回不完的消息、干不完的活。','回不完','干不完'),cue('你像个借来的工具，','借来的工具'),cue('转了一整天。')]},
 {id:3,name:'凌晨主权夺回',image:'images/stayup_3.jpg',audio:'audio/stayup_3.mp3',speed:1.06,tail:.12,
  narration:'只有等晚上关了灯、世界终于安静下来，你才觉得：哎，从现在开始，这几个小时总算归我了。所以明知道刷的都是没营养的烂视频，你也死活舍不得按那个锁屏键。',
  subtitles:[cue('只有等晚上关了灯、'),cue('世界终于安静下来，','安静下来'),cue('你才觉得：哎，'),cue('从现在开始，'),cue('这几个小时总算归我了。','归我了'),cue('所以明知道'),cue('刷的都是没营养的烂视频，','烂视频'),cue('你也死活舍不得按那个锁屏键。','舍不得按')]},
 {id:4,name:'早八加倍还债',image:'images/stayup_4.jpg',audio:'audio/stayup_4.mp3',speed:1.06,tail:.12,
  narration:'心理学管这叫「报复性熬夜」。说白了，你是在拿凌晨的困意，去报复白天被偷走的人生。可最扎心的是，你偷回来的自由，第二天早上全得靠黑眼圈加倍还回去。',
  subtitles:[cue('心理学管这叫「报复性熬夜」。','报复性熬夜'),cue('说白了，'),cue('你是在拿凌晨的困意，','凌晨的困意'),cue('去报复白天被偷走的人生。','被偷走的人生'),cue('可最扎心的是，'),cue('你偷回来的自由，','偷回来的自由'),cue('第二天早上'),cue('全得靠黑眼圈加倍还回去。','加倍还回去')]},
 {id:5,name:'留半小时给自己',image:'images/stayup_5.jpg',audio:'audio/stayup_5.mp3',speed:.99,tail:.7,
  narration:'所以想早点睡，光靠定闹钟没用。白天哪怕只硬抠出半小时，干点只讨好自己的废柴小事，晚上你才舍得把手机放下。说真的，刷到这条的时候，你那边几点了？',
  subtitles:[cue('所以想早点睡，'),cue('光靠定闹钟没用。','没用'),cue('白天哪怕只硬抠出半小时，','半小时'),cue('干点只讨好自己的废柴小事，','废柴小事'),cue('晚上你才舍得把手机放下。','舍得'),cue('说真的，'),cue('刷到这条的时候，'),cue('你那边几点了？','几点了')]},
];
