# 读一张牌：抖音竖屏系列模板

一集讲一张牌：开场钩子 → 牌名 → 镜头推近逐个读画面符号 → 一句话总结 → 正位 / 逆位 → 金句 → 下一期预告 → 晨启塔罗宣传。
视觉沿用网站：近黑底、暖白字、香槟金细线、星盘细环、1909 RWS 原版牌面、网站同款牌背（`src/card-back.ts`）。

## 出一集

在仓库根目录安装 Playwright 和 Chromium（或指定已有 Chromium）。FFmpeg 需支持 libx264、AAC、loudnorm 和 amix 的 `normalize` 选项。

```sh
npm install --no-save --package-lock=false playwright
npx playwright install chromium
```

默认在 PATH 查找 `ffmpeg`。也可设置 `FFMPEG_PATH` 为可执行文件路径，`CHROMIUM_PATH` 为 Chromium 或 Chrome 的可执行文件路径。模板从 Google Fonts 载入 OFL 字体。

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

同一旁白稿与配音设置重复渲染时复用配音缓存。数字写成汉字（「一九零九年」），读音更稳。

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

## 故事系列

`series: "story"` 启用「牌的故事」版式。每集 50–75 秒，从今天的牌面讲回历史，中间用年代和版本推进故事，末尾用一句当代读法收束。完整范例是 [第 1 集《愚人》](episodes/story-00-fool.json)。在仓库根目录运行：

```sh
node video-series/render.mjs video-series/episodes/story-00-fool.json --preview mid
node video-series/render.mjs video-series/episodes/story-00-fool.json
```

预览写入每段中点的 `preview-01.png` 等单帧和 `sheet.png` 总览。出片生成同名 MP4、SRT、`cover.jpg` 和 `文案.md`。旁白时长驱动镜头长度，故事系列建议将 `TTS_SPEED` 设在 1.00–1.05。Windows PowerShell 可用 `$env:TTS_PY = 'C:/path/to/python.exe'` 和 `$env:TTS_MODEL = 'C:/path/to/kokoro-multi-lang-v1_1'` 指定本地环境。

每个镜头需要唯一的 `id` 和一个 `scene`。`say` 为旁白，`sub` 为简短屏幕字幕，通常控制在两行内。历史图 `image` 和人物图 `portrait` 使用以 `/video-series/assets/historic/` 开头的仓库路径。

| 场景 | JSON 字段和用法 |
| --- | --- |
| `era` | `year` 为年份或年代字符串，`place` 为地点行。细金线随年代出现。 |
| `compare` | `cards` 填 1–3 项，依次淡入。每项有 `caption`（可用 `\n` 拆成年代和版本）及可选的 `image`。省略 `image` 使用本集的 1909 年版。缺少可用旧图时只填 1909 年版一项，在 `sub` 说明早期版本。可选 `keepLast: true` 在镜尾只留下最后一张。 |
| `story` | `image` 省略时显示本集的 1909 年版。可选 `focus: [x, y, zoom]`，前两项为从图左上角起算的归一化坐标（0–1），第三项为相对整牌的倍率。可选 `label: {t, s}` 显示牌名和小字。 |
| `glance` | 沿用 `story` 的 `image` 和 `focus`。用 `ring: [x, y, rx, ry]` 加 1px 金色细圈，中心及半径分别以原图宽高归一化。每集最多 3 个。 |
| `person` | `name` 为姓名，`years` 为生卒年，`bio` 为一行介绍。有许可清楚的公有领域肖像时可填 `portrait`，否则显示名字与金色菱形。 |
| `hook` / `quote` / `next` / `promo` | 开场用 `sub` 做大字（可用 `\n` 分两行），金句用 `quote`，预告读取 `next.nameZh`，片尾使用固定品牌介绍和免责文字。 |

可用下方短例验证开场、单图回退和片尾。实际集数可参考《愚人》的长度与完整结构。

```json
{
  "series": "story",
  "no": 1,
  "card": "m0",
  "nameZh": "愚人",
  "publish": { "title": "牌的故事 01 愚人", "desc": "从旧牌讲起。", "tags": ["艺术史"] },
  "segments": [
    { "id": "hook", "scene": "hook", "say": "这张牌，以前叫疯子。", "sub": "这张牌\n曾叫「疯子」" },
    { "id": "old", "scene": "compare", "cards": [{ "caption": "1909\n韦特—史密斯版" }], "sub": "更早的版本里，他穿着破衣。", "say": "更早的版本里，他穿着破衣。" },
    { "id": "promo", "scene": "promo", "say": "想接着听，来看看晨启塔罗。" }
  ]
}
```

每集在 `episodes/<集名>.sources.md` 按镜头记录事实出处。新历史图转为 WebP，记入 [CREDITS](CREDITS.md)。渲染器检查主牌和特写镜头数量，历史图与肖像仍需逐张看过。

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
