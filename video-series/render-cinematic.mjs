import {readFileSync, writeFileSync, mkdirSync, existsSync, renameSync, rmSync} from 'node:fs';
import {spawn, spawnSync} from 'node:child_process';
import {once} from 'node:events';
import {stripTypeScriptTypes} from 'node:module';
import {basename, dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {cardBack} from '../src/card-back.ts';
import {lint} from './lint.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const episodePath = process.argv[2];
if (!episodePath) throw Error('用法：node video-series/render-cinematic.mjs <episode.json> [--preview]');
const ep = JSON.parse(readFileSync(episodePath, 'utf8'));
const hits = lint(ep);
if (hits.length) throw Error(hits.join('\n'));
if (ep.layout !== 'cinematic' || ep.card !== 'm2' || ep.domain !== 'daybreaktarot.xyz') {
  throw Error('本版七幕镜头为《女祭司》的 Daybreak 官网宣传版设计');
}
const preview = process.argv.includes('--preview');
const remix = process.argv.includes('--remix');
const slug = basename(episodePath, '.json');
const out = join(here, 'out', slug);
const voice = join(out, 'voice');
const ffmpeg = process.env.FFMPEG_PATH || 'ffmpeg';
const python = process.env.TTS_PY || 'python';
const fps = 30;
const duration = 45;
mkdirSync(voice, {recursive: true});

function run(command, args) {
  const {error, status} = spawnSync(command, args, {stdio: 'inherit'});
  if (error || status !== 0) throw error ?? Error(`${command} 退出代码 ${status}`);
}
const dataUrl = (path, mime) => `data:${mime};base64,${readFileSync(path).toString('base64')}`;
const backColors = '--cb-bg-a:#17151E;--cb-bg-b:#0F0F11;--cb-glow:#C5A059;--cb-f0:#7A5C29;--cb-f1:#C5A059;--cb-f2:#FFF2CC;--cb-f3:#D4AF37;--cb-f4:#6B4F22;--cb-hl:#FFF2CC';
const back = cardBack().replace('<svg ', `<svg style="${backColors}" `);
const assets = {
  back: 'data:image/svg+xml;base64,' + Buffer.from(back).toString('base64'),
  front: dataUrl(join(root, 'public/rws/m2.webp'), 'image/webp'),
  milan: dataUrl(join(root, ep.images.milan), 'image/webp'),
  lyon: dataUrl(join(root, ep.images.lyon), 'image/webp'),
  texture: dataUrl(join(root, 'public/moon/moon-1024.webp'), 'image/webp'),
};
const fontDirectory = join(root, 'legacy-static/fonts');
const siteFonts = readFileSync(join(fontDirectory, 'serif-sc.css'), 'utf8')
  .replaceAll('DaybreakSerif', 'Daybreak')
  .replace(/url\('\/fonts\/([^'?]+)[^']*'\)/g, (_, file) => `url('${dataUrl(join(fontDirectory, file), 'font/woff2')}')`);
const roman = dataUrl(join(here, 'assets/cinematic/cormorant-garamond-italic.woff2'), 'font/woff2');
const fontLicense = ['notoserifsc', 'cormorantgaramond'].map(name =>
  readFileSync(join(root, 'public/licenses', name + '-OFL.txt'), 'utf8')).join('\n\n');
const moon = stripTypeScriptTypes(readFileSync(join(root, 'src/lib/moon-render.ts'), 'utf8')).replace(/^export /gm, '');
const film = readFileSync(join(here, 'cinematic/film.js'), 'utf8');
const scriptJson = value => JSON.stringify(value).replaceAll('<', '\\u003c');

function voiceTiming() {
  const lines = ep.segments.map(s => ({id: s.id, text: s.say}));
  const sid = process.env.TTS_SID || '3';
  const speed = process.env.TTS_SPEED || '1.03';
  const key = JSON.stringify({lines, sid, speed});
  const keyPath = join(voice, 'key.json'), durationsPath = join(voice, 'durations.json');
  const cached = existsSync(keyPath) && existsSync(durationsPath)
    && readFileSync(keyPath, 'utf8') === key && lines.every(s => existsSync(join(voice, s.id + '.wav')));
  if (!cached && process.env.TTS_MODEL) {
    const input = join(voice, 'in.json');
    writeFileSync(input, JSON.stringify(lines));
    rmSync(keyPath, {force: true});
    run(python, [join(here, 'tts.py'), process.env.TTS_MODEL, input, voice, sid, speed]);
    writeFileSync(keyPath, key);
  }
  const voiced = cached || Boolean(process.env.TTS_MODEL);
  const measured = voiced ? JSON.parse(readFileSync(durationsPath, 'utf8')) : {};
  const timeline = ep.segments.map(s => {
    const duration = measured[s.id] ?? s.say.length / 4.8;
    const tempo = Math.max(1, duration / (s.before - s.at - .08));
    if (voiced && tempo > 1.18) throw Error(`${s.id} 的旁白超出镜头节拍，请缩短文案`);
    return {...s, tempo, end: s.at + duration / tempo};
  });
  return {voiced, timeline};
}

function html(timeline, audio) {
  const controls = audio ? `<div class="controls"><button id="sound">开启声音</button><button id="replay">重播</button></div>
<audio preload="auto" src="${audio}"></audio>` : '';
  return `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>DAYBREAK · 牌的故事 03 女祭司</title>
<!-- Embedded fonts and their licenses
${fontLicense}
-->
<style>
${siteFonts}
@font-face{font-family:Cinematic;src:url('${roman}') format('woff2');font-weight:100 900}
*{box-sizing:border-box}
body{margin:0;min-height:100svh;background:#0F0F11;display:grid;place-items:center;font-family:Daybreak,serif;color:#F4EFE6}
canvas{display:block;width:min(100vw,56.25svh);height:auto}
.recording canvas{width:1080px}
.controls{position:fixed;bottom:16px;display:flex;gap:10px}
button{font:inherit;background:#171512;color:#F4EFE6;border:1px solid #7A5C29;padding:8px 16px;border-radius:22px;cursor:pointer}
button:focus-visible{outline:2px solid #FFF2CC}
</style></head><body class="${audio ? '' : 'recording'}">
<canvas width="1080" height="1920" aria-label="牌的故事 03 女祭司，四十五秒电影短片"></canvas>
${controls}
<script>${moon}\n${film}
window.filmReady = filmInit(${scriptJson(ep)}, ${scriptJson(assets)}, ${scriptJson(timeline)});
if (document.querySelector('audio')) {
  window.filmReady.then(() => {
    const audio = document.querySelector('audio');
    const sound = document.getElementById('sound');
    let begin = performance.now(), elapsed = 0, soundOn = false, frame;
    function draw(now) {
      elapsed = soundOn ? (audio.ended ? 45 : audio.currentTime) : Math.min(45, (now - begin) / 1000);
      filmRender(elapsed);
      frame = elapsed < 45 ? requestAnimationFrame(draw) : undefined;
    }
    function resumeDrawing() {
      if (frame === undefined) frame = requestAnimationFrame(draw);
    }
    sound.addEventListener('click', async () => {
      if (soundOn) {
        audio.pause();
        begin = performance.now() - elapsed * 1000;
        soundOn = false;
        sound.textContent = '开启声音';
        return;
      }
      audio.currentTime = elapsed < 45 ? elapsed : 0;
      try {
        await audio.play();
        soundOn = true;
        sound.textContent = '静音';
        resumeDrawing();
      } catch {
        sound.textContent = '重试声音';
      }
    });
    document.getElementById('replay').addEventListener('click', () => {
      begin = performance.now();
      audio.currentTime = 0;
      if (soundOn) audio.play();
      resumeDrawing();
    });
    resumeDrawing();
  });
}
</script></body></html>`;
}

function mixAudio(voiced, timeline) {
  const score = join(out, '_score.wav');
  run(python, [join(here, 'cinematic/score.py'), score]);
  const target = join(out, '_mix.m4a');
  const args = ['-y', '-loglevel', 'error', '-i', score];
  const duck = timeline.reduce((combined, {at, end}) => {
    const envelope = `clip(min((t-${(at-.16).toFixed(3)})/.16,(${(end+.32).toFixed(3)}-t)/.32),0,1)`;
    return `max(${combined},${envelope})`;
  }, '0');
  const level = voiced ? `0.72-0.49*(${duck})` : '0.72';
  let filters = `[0:a]volume='${level}':eval=frame[score];`;
  if (voiced) {
    timeline.forEach((s, i) => {
      args.push('-i', join(voice, s.id + '.wav'));
      const ms = Math.round(s.at * 1000);
      const stretch = s.tempo > 1 ? `atempo=${s.tempo.toFixed(6)},` : '';
      filters += `[${i+1}:a]aresample=48000,${stretch}adelay=${ms}:all=1,pan=stereo|c0=c0|c1=c0[v${i}];`;
    });
    filters += '[score]' + timeline.map((_, i) => `[v${i}]`).join('')
      + `amix=inputs=${timeline.length+1}:duration=first:normalize=0,`;
  } else filters += '[score]';
  filters += 'loudnorm=I=-16:TP=-1.5:LRA=8[a]';
  run(ffmpeg, [...args, '-filter_complex', filters, '-map', '[a]', '-ac', '2', '-ar', '48000',
    '-c:a', 'aac', '-b:a', '192k', '-t', String(duration), '-movflags', '+faststart', target]);
  return target;
}

async function encode(page, silent) {
  const encoder = spawn(ffmpeg, ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps),
    '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'fast', '-crf', '18', '-pix_fmt', 'yuv420p', silent],
  {stdio: ['pipe', 'inherit', 'inherit']});
  const finished = once(encoder, 'close');
  finished.catch(() => {});
  encoder.stdin.on('error', () => {});
  try {
    await once(encoder, 'spawn');
    for (let i = 0; i < duration * fps; i++) {
      const frame = await page.evaluate(t => {
        filmRender(t);
        return document.querySelector('canvas').toDataURL('image/jpeg', .94).split(',')[1];
      }, i / fps);
      await new Promise((done, reject) => encoder.stdin.write(Buffer.from(frame, 'base64'), error => error ? reject(error) : done()));
      if (i % 225 === 0) console.log(`帧 ${i}/${duration * fps}`);
    }
    encoder.stdin.end();
    const [code] = await finished;
    if (code !== 0) throw Error(`视频编码失败：${code}`);
  } finally {
    if (encoder.exitCode === null) encoder.kill();
  }
}

const {voiced, timeline} = voiceTiming();
console.log('✓ 审核词检查通过 · 45 秒 · 7 幕');
for (const s of timeline) console.log(s.id, s.at.toFixed(2), s.end.toFixed(2), s.tempo.toFixed(3));
const target = join(out, slug + '.mp4');
function finish(picture, audio) {
  const muxed = join(out, '_muxed.mp4');
  run(ffmpeg, ['-y','-loglevel','error','-i',picture,'-i',audio,'-map','0:v','-map','1:a','-c','copy',
    '-movflags','+faststart','-t',String(duration),muxed]);
  renameSync(muxed, target);
  writeFileSync(join(out,slug+'.html'), html(timeline,dataUrl(audio,'audio/mp4')));
  const timestamp = t => new Date(Math.round(t * 1000)).toISOString().slice(11,23).replace('.',',');
  writeFileSync(join(out,slug+'.srt'),timeline.map((s,i) =>
    `${i+1}\n${timestamp(s.at)} --> ${timestamp(s.end)}\n${s.say}\n`).join('\n'));
  const {title, desc, tags} = ep.publish;
  writeFileSync(join(out,'文案.md'), `# 牌的故事 03 · 女祭司\n\n${title}\n\n${desc}\n\n${tags.map(t=>'#'+t).join(' ')}\n\n## 旁白稿\n\n${timeline.map(s=>`- [${s.at.toFixed(2)}s] ${s.say}`).join('\n')}\n\n## 发布检查\n\n- [ ] 检查片尾域名与目标渠道的规则\n- [ ] 勾选「内容由 AI 生成」\n- [ ] 试听配乐、卡点与旁白\n`);
  console.log('✓ 成片与单文件播放器已写入', out);
}

async function renderPicture() {
  const browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH});
  try {
    const page = await browser.newPage({viewport: {width:1080, height:1920}, deviceScaleFactor:1});
    await page.setContent(html(timeline), {waitUntil: 'load'});
    await page.evaluate(() => filmReady);
    for (const [i, t] of [4.4, 8.7, 12.55, 15.8, 18.7, 21.4, 23.5, 25.8, 30.35, 32.8, 37.7, 42.35].entries()) {
      await page.evaluate(t => filmRender(t), t);
      await page.screenshot({path: join(out, `preview-${String(i+1).padStart(2,'0')}.png`)});
    }
    run(ffmpeg, ['-y','-loglevel','error','-framerate','1','-i',join(out,'preview-%02d.png'),'-vf',
      'scale=240:426:flags=lanczos,tile=4x3:nb_frames=12:padding=8:margin=8:color=0x0F0F11',
      '-frames:v','1',join(out,'sheet.png')]);
    if (!preview) {
      const audio = mixAudio(voiced, timeline);
      const silent = join(out, '_picture.mp4');
      await encode(page, silent);
      await page.evaluate(() => filmRender(4.4));
      await page.screenshot({path:join(out,'cover.jpg'),type:'jpeg',quality:94});
      finish(silent, audio);
      rmSync(silent, {force:true});
    }
  } finally {
    await browser.close();
  }
}

if (remix) {
  if (!existsSync(target)) throw Error('先渲染成片，再用 --remix 重做音轨');
  finish(target, mixAudio(voiced, timeline));
} else {
  await renderPicture();
}
