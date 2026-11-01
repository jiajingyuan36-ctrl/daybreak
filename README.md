# DAYBREAK 晨启

每天早上抽一张塔罗，用大白话说说今天的状态，和一件十分钟就能做完的小事。

线上：https://daybreak-morning-ritual.onrender.com/

- 1909 年原版 Rider–Waite–Smith 彩色牌面，78 张牌正逆位都有白话解析
- 抽完牌不满意，每天可以换三次
- 每张牌标注金色黎明会《Book T》的星座、行星或元素对应；首页显示当天太阳和月亮所在的星座
- 首页月亮按当天真实月相绘制
- 填一次生辰，每天多一份按八字推算的今日运势
- 五种牌阵，凯尔特十字的位置含义按 Waite《The Pictorial Key to the Tarot》（1911）原文
- 不用注册，所有记录只存在浏览器本地

## 运行

需要 Node.js 24。

```
npm ci
npm run dev        # 本地开发
npm test           # 测试
npm run typecheck  # 类型检查
npm run build      # 静态导出到 dist/
```

`dist/` 是纯静态网站，可以直接放到任何静态托管。

## 目录

| 路径 | 内容 |
| --- | --- |
| `src/plain.ts` | 78 张牌的全部白话文案，改文案只改这里 |
| `src/cards.ts` | 牌名、编号与稳定 ID |
| `src/knowledge.ts` | 牌面符号与原典链接 |
| `src/lib/bazi-fortune.ts` | 按生辰的今日运势 |
| `src/lib/tarot-catalog.ts` | 牌阵与位置含义 |
| `src/components/real-moon.tsx` | 真实月面 |
| `src/app.ts` | 今日抽牌、回望、设置页面 |
| `src/components/tarot/tarot-workbench.tsx` | 牌阵与图鉴 |
| `app/` | Next.js 页面 |
| `legacy-static/epic.css` | 主题样式 |

## 素材与许可

- 牌面：1909 年 Rider–Waite–Smith 彩色扫描，公有领域，来自[维基共享资源](https://commons.wikimedia.org/wiki/Category:Rider-Waite-Smith_tarot_deck_(TaionWC))
- 占星对应：金色黎明会《Book T》（S. L. MacGregor Mathers 编，约 1888 年；收录于 Israel Regardie《The Golden Dawn》），只用七颗古典行星
- 星座定义：托勒密《四书》，公有领域，见[古腾堡计划 Ashmand 译本](https://gutenberg.org/files/70850/70850-h/70850-h.htm)
- Waite 原文：公有领域，引自 [Wikisource](https://en.wikisource.org/wiki/The_Pictorial_Key_to_the_Tarot)
- 月面贴图：three.js 示例素材（MIT）
- 天文计算：[Astronomy Engine](https://github.com/cosinekitty/astronomy)（MIT）
- 八字排盘：[lunar-javascript](https://github.com/6tail/lunar-javascript)（MIT）
- 字体：思源黑体（SIL OFL 1.1）

第三方许可证原文见 `legacy-static/` 与 `public/licenses/`。

本项目自身的代码与文案保留所有权利。
