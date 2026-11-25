# 【给 Muse】《星月夜》活过来 · 10 秒 · 横屏 16:9

状态：未生成，效果未验证（2026-11-25）。写法依据：content-kit/Muse提示词指南.md（在 claude/adoring-johnson-0og5ov 分支）、.claude/skills/video-prompt/、泰坦尼克 03「锈迹褪去」的首尾帧先例，以及下方「调研」。

---

## 调研结论（写给自己看，不发给 Muse）

1. **同类视频的通行做法是首尾帧**：首帧是原画，尾帧是同构图的写实版，让模型补中间。Kling、Veo 的教程都这样做（来源见文末）。只给首帧时，结尾由模型随意决定，构图会漂。
2. **本项目已在 Muse 上验证过同一种做法**：泰坦尼克 03，首帧残骸、尾帧 1912 年新船，固定机位，「像慢速叠化一样整片变化」，结果被剪进样片。本次方案 B 照搬这个写法。
3. **风险**：一篇 2025 年的论文（Every Painting Awakened）指出，图生视频模型多数用真实视频训练，处理油画时常见两种失败：几乎不动，或动起来就丢了原画的样子。另一篇 Veo 教程说首尾帧差别太大时，中间过渡质量会下降。所以尾帧必须死守原画构图。
4. **「风从左扫到右、扫过的地方变成真的」这种有方向的过渡，没有找到先例**，是本次的新尝试（方案 A）。和方案 B 各出 2 条，正好做对照。
5. **要不要用提示词生成工具**：不用网上的生成器。项目里的 video-prompt 技能和 Muse 指南已经收了官方指南、开源 Muse 技能（masonmosen 等）和我们 8 个项目的实测，比通用生成器更贴 Muse。Muse 本身是智能体，会自己扩写，所以我们给的是方向和锁定条件。

## 镜头设计

| | |
|---|---|
| 第一眼 | 黑底上的整幅原画（原画约 1.26:1，两侧留黑边凑成 16:9；裁成 16:9 会切掉月亮或村庄） |
| 最后一帧 | 同一构图的真实村庄，日出前的蓝调时刻，铺满整个画面 |
| 光 | 一个主光：日出前的冷蓝天光。一处暖光：村里三四扇窗。月牙很淡，不照亮任何东西。柏树近乎剪影 |
| 镜头 | 固定，三脚架。唯一的动作是变化本身 |
| 声音 | 先静，后风声、柏树沙沙、蟋蟀，最后一秒远处一声钟。没有配乐 |

为什么是黎明前：梵高是在圣雷米疗养院的窗前、日出前看到这片景色的。真实的深夜拍不出画里那么亮的天，硬拍会变成「全场打亮」的假光；蓝调时刻天空自己发亮，曝光说得通。

---

## 以下原样发给 Muse

我们要做一条 10 秒的写实短视频：梵高的《星月夜》从一幅油画变成真实的风景。请严格遵守：
1. 不加背景音乐、旁白、字幕。
2. 每条视频一镜到底，不剪辑、不切镜、不加转场，镜头不动。
3. 下面的英文提示词原样使用，不改写、不加词。
4. 画幅是横屏 16:9。

附件：starry_first.jpg（原画居中、两侧黑边，1920×1080）。

**第 1 步：做尾帧。** 用下面的提示词出 3 张图，发给我挑一张。
**第 2 步：做视频。** 用 starry_first.jpg 作为 image_1、我挑出的图作为 image_2，方案 A 和方案 B 各出 2 条。
**第 3 步：发回。** 全部原文件（不压缩），文件名带编号（A1、A2、B1、B2），以及你实际提交的提示词原文。

### 第 1 步 · 尾帧（Edit image_1，image_1 = starry_first.jpg）

```
Edit image_1. Turn this oil painting into a real photograph, in exactly 16:9 aspect ratio, filling the whole frame with no black bars. Keep the composition and the position of every shape exactly as in the painting: a tall Italian cypress in the left foreground, a small white church with a pointed steeple in the lower middle, the low houses of a Provencal village around it, low rolling hills on the right, a thin crescent moon in the upper right. The black bars on both sides become more of the same hills and sky.
Time: the blue hour before sunrise. The sky is a deep, even, cold blue, a little paler near the horizon. No swirls, only a few thin clouds stretched by the wind. The stars are small sharp points; one star to the right of the cypress, the morning star, is clearly brighter than the rest.
Light: the blue sky is the only main light, soft, with no hard direction. The cypress stands against the sky almost in silhouette; only the edges of its foliage catch a little skylight. The village lies in shadow; only three or four windows glow warm yellow, lighting just the wall around them. The moon is faint and lights nothing.
Colour anchors: cold blue, near-black green, warm window yellow, pale grey stone.
Real landscape photograph, 35mm lens, on a tripod, natural noise in the shadows, muted natural colours.
No brushstrokes, no swirls, no star halos, no HDR, no oversaturation, no people, no text or signature anywhere.
```

### 第 2 步 · 方案 A：风从左吹到右

```
image_1 is the first frame and image_2 is the last frame. 10-second shot, in exactly 16:9 aspect ratio, one continuous take, locked-off camera on a tripod, no camera movement, no cuts.
0-2 s: it is still a painting: thick ridges of oil paint, the weave of the canvas. The brushstrokes in the swirling sky begin to flow very slowly along their own direction; the halos around the stars pulse faintly.
2-7 s: a gust of wind enters from the left edge of the frame and travels to the right. It reaches the cypress first: the tree bends once and its painted strokes become real cypress foliage. Wherever the wind passes, the swirls in the sky pull apart into a few thin real clouds, the star halos shrink into small sharp points, and the ridges of paint smooth away. The black bars on both sides fill with the same real hills and sky.
7-10 s: the wind reaches the village on the right; the roofs and the steeple become real stone and tile; the yellow paint in the windows becomes real lamplight. The wind dies. The cypress still sways a little; the thin clouds drift slowly to the right. The shot ends exactly on image_2.
Light: once the change has passed, the cold blue sky before sunrise is the only main light, with a few warm windows. The moon is faint and lights nothing.
Sound: complete silence at first. Then rising wind and the rustle of the cypress, then crickets. In the last second, a single distant church bell. No music, no dialogue.
No HDR, no oversaturation, no people, no text or signature anywhere.
```

### 第 2 步 · 方案 B：整片慢慢叠化（泰坦尼克 03 的写法）

```
image_1 is the first frame and image_2 is the last frame. 10-second shot, in exactly 16:9 aspect ratio, one continuous take, locked-off camera with no camera movement, no cuts.
Action: the oil painting slowly transforms into the real landscape, gradually, across the whole ten seconds, like a slow dissolve. The swirls in the sky loosen into thin drifting clouds; the star halos shrink into small sharp stars; the painted cypress becomes a real tree moving slightly in the wind; the ridges of paint flatten away; the black bars fill with real hills and sky; the yellow windows become real lamplight.
Look: photorealistic by the end, natural noise in the shadows; the colours move from the painting's bright blues and yellows to the muted cold blue of the hour before sunrise.
Sound: silence, then wind in the cypress and crickets. No music, no dialogue.
No HDR, no oversaturation, no people, no text or signature anywhere.
```

### 我会怎么检查

1. 是不是 16:9，有没有残留黑边。
2. 中间有没有切镜，镜头有没有偷偷推近。
3. 最后一帧是不是 image_2 的构图：柏树在左、教堂尖顶在中下、月牙在右上。
4. 光只有一个来源：月亮没有变成照亮村庄的大灯，村庄没有被全场打亮。
5. 画面里有没有冒出文字或签名。
6. 方案 A 的变化是不是从左往右推进，而不是整片同时变。

---

## 备用（不随第一次发送）

- **尾帧做不出来**：去掉方案 A 的第一行，换成「Animate image_1.」，结尾一句改成「The shot ends on a real landscape at the blue hour before sunrise: deep cold blue sky, the cypress almost in silhouette, the village dark except for three or four warm windows.」
- **方案 A 变成整片同时溶解**：只改一处，把风写成看得见的边界：「the change moves like a visible edge from left to right: to its left the world is already real, to its right it is still paint」。
- **黑边总是去不掉或很怪**：先让 Muse 把原画两侧按原画笔触补满 16:9（Edit image_1），再用补好的图做首帧。补出来的笔触是 AI 画的，不是梵高的，近看会露馅，所以排在后面。

## 来源

- 本项目：Muse 提示词指南、泰坦尼克 03 首尾帧（claude/adoring-johnson-0og5ov 分支 content-kit/titanic/）
- Every Painting Awakened（2025）：https://arxiv.org/html/2503.23736v1
- Kling 首尾帧教程：https://tonaai.io/blog/kling-3-start-end-frame-tutorial 、https://www.insmind.com/blog/smooth-ai-video-transitions-kling-start-end-frame
- Runway 图生视频技巧：https://runwayml.com/resources/photo-to-video-tips
- 各模型控制策略（含 Veo 首尾帧）：https://medium.com/@creativeaininja/how-to-actually-control-next-gen-video-ai-runway-kling-veo-and-sora-prompting-strategies-92ef0055658b
- 开源 Muse 提示词技能：https://github.com/masonmosen/muse-video-prompt-skill
- 原画：维基共享资源 Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg（公有领域）
