# 【给 Muse】《光，退回山顶》第二轮修改需求

谢谢你剪的第一版！整体氛围很好，星空、冰川尽头的金山、峰顶的红光都很有冲击力。这一轮主要解决「山看起来不真实」的问题，并请你把**原始素材**交给我，剪辑由我来做。

---

## 一、第一版的反馈

### 保留的（做得很好）
- **星空**：银河、星星和山的比例都很好。但山要换成和前面一样的珠峰，见第五节镜头 F
- **冰川河谷**，以及河谷尽头那座金色的山（约 18–28 秒）
- **峰顶的红光**：最后的红光在峰顶燃烧（约 33–37 秒）
- **万山之上**（开头的群峰云海）：画质很好，保留，后期我会挪到别的位置

### 需要改的
1. **山体不真实（最重要）**：峰顶金字塔上有一层层整齐的横向条纹，中间还有一道笔直的黑色斜带，看起来像人工画上去的，不像真实的山。这是我上一版提示词写错了：我要求了「明显的黄褐色岩带」和「深色的斜向冰沟」，模型画得太规整、太夸张。这一版已经删掉这两句，改成自然的山体描述。
2. **前后镜头的山不一致**：星空镜头里的山是圆顶，和前面的金字塔不是同一座。这一版改成在定妆照的基础上先做一张夜景版，再用它生成视频。
3. **开头就出现了粉金色的光**：开场应该是下午的白光，金光要留到后面的「日照金山」。这一版加了一个下午版的开场镜头 A2。

---

## 二、这一轮请做的事（按优先级）

| 优先级 | 内容 | 说明 |
|---|---|---|
| ★★★ | **新的山的定妆照**（3 张） | 用第四节的新提示词；挑最像真实照片、山体最自然的一张 |
| ★★★ | **镜头 B、D、E** 重新生成（每个 2 个版本） | 用新的定妆照作为 image_1 |
| ★★ | **夜景定妆照** + **镜头 F** 重新生成 | 先把新定妆照改成夜景，再生成星空视频 |
| ★★ | **镜头 A2 · 下午版开场**（2 个版本） | 文字生成 |
| ★★ | **镜头 K · 金色北壁**（2 个版本） | 用新的定妆照作为 image_1 |
| ★ | 第二批其余镜头 **G、H、I、J、L**（每个 1–2 个版本） | 提示词见第六节，和上一版基本一致 |
| — | **镜头 A（原万山之上）、C（冰川河谷）** | 不用重拍，请把原始文件发给我 |

额度不够的话，就按优先级从上往下做。

---

## 三、交付要求（很重要）

1. **请发原始单条素材**：每个镜头一个独立的视频文件，**不要剪辑，不要加字幕，不要加黑边，不要加音乐，不要调色**。剪辑、字幕、配乐都由我来做。
2. **文件名标上镜头字母和版本号**，例如 `B-1.mp4`、`B-2.mp4`、`F-1.mp4`、`A2-1.mp4`。定妆照命名为 `still-day-1.png`、`still-night-1.png`。
3. **第一版里用过的原始素材也请一起发给我**，尤其是 A（万山之上）和 C（冰川河谷）。
4. **把你实际提交给生成工具的提示词原文发给我**（每个镜头一份），方便我核对。
5. **提示词请原样使用**，不改写，不加词，也不要加描述情绪或风格的词。
6. 所有画面：横屏 16:9，一镜到底，没有人、建筑、道路、帐篷、文字、水印。

---

## 四、新的山的定妆照（日间）· 原样使用

> 生成 3 张，挑山体最自然、最像真实照片的一张，命名为 still-day-1.png。

```
Photorealistic landscape photograph, 16:9 landscape frame. The north face of Mount Everest seen from the Rongbuk valley in Tibet, mid-afternoon in autumn. Mount Everest's north face: a massive, slightly asymmetrical pyramid of dark rock and snow, with natural, irregular, weathered ridges, buttresses and snow gullies, like a real photograph of the mountain. It stands alone at the head of the valley. The long north-east ridge descends to the left skyline, with a few rough rock pinnacles; the west ridge descends to the right. A thin white banner cloud streams from the summit toward the left. Bright sunlight from the right, deep clean blue sky, thin crystal-clear high-altitude air. In front of the mountain, grey-brown glacial moraine and frozen braided river channels lead the eye toward the peak. Shot on a large-format cinema camera with a 200mm telephoto lens, natural colours, true-to-life contrast, fine realistic detail in rock and snow. Nature documentary photograph. No people, no buildings, no text.
```

---

## 五、需要重新生成的镜头

### 镜头 A2 · 下午版开场（文字生成，2 个版本）

> 新增镜头，作为全片的第一个画面。重点是**下午的白光，不要金色或粉色**。

```
10-second shot, 16:9 landscape, one continuous take, very slow lateral aerial drift from right to left. The Himalaya seen from a high mountain pass in Tibet in the early afternoon: a row of the world's highest peaks rises above a sea of white clouds that fills the valleys below. In the centre, rising above all others, a massive, slightly asymmetrical pyramid of dark rock and snow with natural, irregular ridges: Mount Everest, a thin white banner cloud streaming from its summit to the left. Early afternoon, bright neutral sunlight from the right, crisp white snow, deep blue sky; the light is white and clear, with no golden or pink light yet. The cloud sea moves slowly. Natural colours, crystal-clear air, epic scale, nature documentary. Sound: high-altitude wind only. No people, no buildings, no text, no music.
```

### 镜头 B · 云旗（用新的 still-day-1 作为 image_1，2 个版本）

```
Animate image_1. 10-second shot, 16:9 landscape, one continuous take, locked-off 400mm telephoto camera with an almost imperceptible slow push in toward the summit pyramid. Keep the mountain exactly as in image_1: the same natural, irregular rock and snow. The white banner cloud tears continuously off the summit and streams to the left in the powerful jet-stream wind; fine spindrift snow blows off the north-east ridge and glitters in the sun. Clear afternoon sunlight from the right, deep blue sky. Real-time speed for the wind and snow. Fine realistic detail, natural colours, nature documentary. Sound: a deep, roaring high-altitude wind. No people, no text, no music.
```

### 镜头 D · 日照金山（用新的 still-day-1 作为 image_1，2 个版本）

```
Animate image_1. 10-second shot, 16:9 landscape, one continuous take, gentle time-lapse at about 60 times real speed, with a very slow push in. Keep the mountain exactly as in image_1: the same natural, irregular rock and snow. Sunset, with the sun low on the right: the whole valley and the lower slopes fall into deep blue shadow, while the entire upper north face of Everest glows with warm golden light. During the shot, the line between shadow and light climbs slowly up the face. The banner cloud at the summit glows gold. The sky behind turns from pale blue to soft peach near the horizon. Rich but natural colours: golden rock and snow against a cold blue valley. Nature documentary, crystal-clear air. Sound: wind only. No people, no text, no music.
```

### 镜头 E · 最后的红（用新的 still-day-1 作为 image_1，2 个版本）

> 第一版的红光很棒，请保持那样的颜色强度。关键是**最后要熄灭**：峰尖最后一点红光消失，山变成冷蓝色。

```
Animate image_1. 10-second shot, 16:9 landscape, one continuous take, gentle time-lapse at about 60 times real speed, locked-off telephoto framing of the summit pyramid. Keep the mountain exactly as in image_1: the same natural, irregular rock and snow. The last light of sunset: the golden light on the summit turns deep orange, then crimson red, as the earth's shadow climbs the face from below. The lit area shrinks upward until only the very tip of the summit glows red, like an ember, and then it goes out: the whole mountain turns cold blue-white under a deep blue twilight sky. The banner cloud fades from pink to grey. Natural colours, nature documentary. Sound: wind only. No people, no text, no music.
```

### 夜景定妆照（在 still-day-1 的基础上修改，生成 2 张）

> 先做这张，再用它生成镜头 F。命名为 still-night-1.png。

```
Edit image_1: the same mountain, the same framing and the same composition, but at night under a clear starry sky. The snow pyramid of Mount Everest glows faintly blue-white in the starlight; the valley in front is dark; the sky is deep black-blue with thousands of stars and the Milky Way rising from the lower left, passing behind and to the left of the summit. Keep the shape of the mountain exactly as in image_1. Natural, realistic night-sky colours, no artificial glow. No people, no lights, no text.
```

### 镜头 F · 星空（用 still-night-1 作为 image_1，2 个版本）

```
Animate image_1. 10-second shot, 16:9 landscape, one continuous take, time-lapse, locked-off camera. Keep the mountain exactly as in image_1. The stars wheel slowly across the sky and the Milky Way drifts slowly; a faint thin cloud drifts from the summit. The snow pyramid stays faintly lit in blue-white starlight. Natural, realistic night-sky colours, no artificial glow, no star flares, nature documentary. Sound: a quiet night wind. No people, no buildings, no lights, no text, no music.
```

### 镜头 K · 金色北壁（用新的 still-day-1 作为 image_1，2 个版本）

```
Animate image_1. 10-second shot, 16:9 landscape, one continuous take, 600mm telephoto framing of the upper part of the summit pyramid, a very slow tilt upward. Keep the mountain exactly as in image_1: the same natural, irregular rock and snow. Sunset light from the right grazes the rock face, painting it warm gold; every ledge, buttress and snow gully is sharp and natural. The north-east ridge forms the left skyline. A thin veil of snow blows across the summit and glows gold. Real-time speed. Natural colours, fine realistic detail, nature documentary. Sound: wind. No people, no text, no music.
```

---

## 六、第二批其余镜头（文字生成，每个 1–2 个版本）

### 镜头 G · 山的肌理

```
10-second shot, 16:9 landscape, one continuous take, macro close-up, a very slow lateral slide. Grey layered limestone high on Mount Everest: thin, naturally uneven sedimentary layers run diagonally from lower left to upper right; fine cracks hold thin bands of snow. Low, raking afternoon light from the right reveals the texture of the rock. Tiny grains of snow blow across the rock surface in the wind. 100mm macro lens, shallow depth of field, fine realistic detail, natural colours, nature documentary. Sound: close wind and the hiss of snow grains. No people, no text, no music.
```

### 镜头 H · 雪粒

```
10-second shot, 16:9 landscape, one continuous take, locked-off low camera at the crest of a high snow ridge in the Himalaya. The sharp edge of the snow ridge runs diagonally from lower left to upper right. The sun is behind the ridge, backlighting it. Strong wind lifts layer after layer of fine powder snow off the crest; the blowing snow glows and sparkles in the backlight against a deep blue sky. 85mm lens, real-time speed, natural colours, nature documentary. Sound: hissing snow and strong wind. No people, no text, no music.
```

### 镜头 I · 冰塔林

```
10-second shot, 16:9 landscape, one continuous take, a slow, low aerial glide forward between the ice pinnacles of the East Rongbuk glacier on the north side of Mount Everest. On both sides, towering white and pale-blue ice pinnacles, tens of metres high, irregular and natural like a forest of ice; between them, far away, the summit of Everest is visible. Late-afternoon sunlight from the right; the thin edges of the ice glow pale blue. Wide-angle 24mm lens, natural colours, realistic ice texture, epic scale, nature documentary. Sound: wind and an occasional deep creak of ice. No people, no tents, no text, no music.
```

### 镜头 J · 河谷暗下

```
10-second shot, 16:9 landscape, one continuous take, locked-off high viewpoint looking down at a wide glacial valley in the Tibetan Himalaya: grey-brown moraine, braided frozen river channels, warm evening light on the valley floor. Time-lapse at about 120 times real speed: the shadow of the mountains sweeps across the valley from left to right, steadily swallowing the warm light until the whole valley is in cool blue shadow, while the distant peaks above are still lit. Natural colours, crystal-clear air, nature documentary. Sound: wind. No people, no roads, no buildings, no text, no music.
```

### 镜头 L · 地球影

```
10-second shot, 16:9 landscape, one continuous take, locked-off wide-angle view toward the eastern sky above a range of snow peaks in the Himalaya, just after sunset. The snow peaks are cold blue-white along the lower third of the frame. Above the horizon lies a soft blue-grey band, the shadow of the earth, and above it a soft pink band of afterglow, fading into deep blue higher up. Time-lapse at about 60 times real speed: the blue-grey band slowly rises and the pink slowly fades. Soft, natural, delicate colours, with the sun out of frame. Nature documentary. Sound: quiet wind. No people, no text, no music.
```

---

## 七、自检清单（交付前请逐条看一遍）

1. **山体自然**：岩石和雪的分布不规则，像真实照片；没有整齐的条纹或笔直的线
2. **同一座山**：B、D、E、F、K 和定妆照是同一座山，形状一致
3. **光的方向**：从画面右侧照来，影子投向左侧；云旗向左
4. **光的顺序**：A2 是下午的白光；D 是金光；E 最后峰尖熄灭、山变冷蓝
5. **画面真实**：不像游戏 CG，没有过度饱和，没有发光特效
6. **没有**人、建筑、道路、帐篷、文字、水印
7. **原始素材**：一镜到底，没有剪辑、字幕、黑边、音乐、调色
8. 文件名标好镜头字母和版本号；提示词原文一并附上

谢谢！素材到了以后，剪辑、调色、字幕和配乐都由我来做。
