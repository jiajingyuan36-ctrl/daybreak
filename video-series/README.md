# 读一张牌：抖音竖屏系列模板

一集讲一张牌：开场钩子 → 牌名 → 镜头推近逐个读画面符号 → 一句话总结 → 正位 / 逆位 → 金句 → 下一期预告 → 晨启塔罗宣传。
视觉沿用网站：近黑底、暖白字、香槟金细线、星盘细环、1909 RWS 原版牌面、网站同款牌背（`src/card-back.ts`）。

## 出一集

```
node --experimental-strip-types video-series/render.mjs video-series/episodes/01-magician.json --preview mid   # 每段截一帧检查
node --experimental-strip-types video-series/render.mjs video-series/episodes/01-magician.json                 # 出片
```

输出在 `video-series/out/<集名>/`（不进 git）：成片 mp4、封面 `cover.jpg`、字幕 srt、`文案.md`（标题、描述、话题、旁白稿、发布检查）。

## 配音

本地 AI 配音，不联网：sherpa-onnx + Kokoro v1.1-zh（Apache-2.0）。没配置时按字数估算节奏，出无旁白版。

```
python3 -m venv .tts && .tts/bin/pip install sherpa-onnx soundfile numpy
curl -L -o k.tar.bz2 https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/kokoro-multi-lang-v1_1.tar.bz2 && tar xjf k.tar.bz2
export TTS_PY=$PWD/.tts/bin/python TTS_MODEL=$PWD/kokoro-multi-lang-v1_1
export TTS_SID=3 TTS_SPEED=1.1   # 3–57 中文女声，58–102 中文男声；第 1 集用 3（zf_001），1.1 倍速
```

旁白按文本缓存，改了哪句只重配哪句。数字写成汉字（「一九零九年」），读音更稳。

## 写新的一集

复制 `episodes/01-magician.json`，改：

- `card`：牌 ID（`m0`–`m21`、`wands-1` 等，对应 `public/rws/`）
- `hookGlyph` / `hookGlyphAt`：开场在牌上一笔画出的金线符号和位置（牌面像素坐标，原图 600×1029）；目前有 `lemniscate`（∞）
- `segments`：每段一个场景
  - `hook`、`title`、`summary`（`words`）、`upright` / `reversed`（`keywords`）、`quote`（`quote`）、`next`、`promo`
  - `focus`：镜头推到 `[x, y, 放大倍数]`，`mark` 可以是 `ellipse`（圈出）、`points`（点位）、`tags`（贴字），`label` 是画面标题
  - `say` 是旁白，`sub` 是屏幕字幕
- `publish`：标题、描述、话题

放大倍数不要超过 2.2，原图会糊。

## 审核

`lint.mjs` 在出片前检查所有会公开的文字（旁白、字幕、标签、标题、描述、话题），出现下面这些就不出片：

- 迷信、算命类：算命、占卜、预测、运势、改运、灵验、大师等
- 广告法极限词：最好、最强、唯一、全网第一等
- 站外导流：微信、私信、链接、二维码、网址等

这只是字面检查，发布前仍要人工看一遍。

画面方面，这些牌的原版画面不适合直接在抖音公开：

- 有裸体人物：恋人、星星、太阳、审判、世界
- 有骷髅或恶魔：死神、恶魔
- 有悬吊、坠落或受伤的画面：吊人、高塔、宝剑十

做这几张时，用 `focus` 只推近到安全的局部，或者等单独设计处理方式。

发布时：

- 勾选「内容由 AI 生成」
- 不放网址或二维码
- 话题不用 #占卜

## 素材与许可

- 牌面：1909 RWS 扫描，公有领域
- 字体：Noto Serif SC / Cinzel / Cormorant Garamond，均为 SIL OFL 许可
- 配音模型：Kokoro v1.1-zh，Apache-2.0
- 背景音：ffmpeg 程序合成
