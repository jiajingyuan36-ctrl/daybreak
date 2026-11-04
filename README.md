# 晨启塔罗 DAYBREAK

每天早上抽一张塔罗，用大白话说说今天的状态，和一件十分钟就能做完的小事。

线上：https://daybreak-morning-ritual.onrender.com/

- 1909 年原版 Rider–Waite–Smith 彩色牌面，78 张牌正逆位都有白话解析
- 抽完牌不满意，每天可以换三次
- 每张牌标注金色黎明会《Book T》的星座、行星或元素对应；首页显示当天太阳和月亮所在的星座
- 十二星座页：每个星座的元素、性质、守护星、入旺，以及对应的大牌、守护星牌和三个旬的小牌
- 两个人的星座：按两个太阳星座的相位、元素和性质讲相处方式，再抽三张牌看看你们之间
- 首页月亮按当天真实月相绘制
- 填一次生辰，每天多一份按八字推算的今日运势
- 五种牌阵，凯尔特十字的位置含义按 Waite《The Pictorial Key to the Tarot》（1911）原文
- 北斗仪式（可在抽牌页或设置里切换）：在按此刻时间和观测地计算的真实星空里，依次点亮北斗七星，斗柄转向哪里，就从那里取出今天的牌；抽到哪张只由浏览器的密码学随机数决定，星空只决定画面
- 北斗七星牌阵：七张牌按北斗的形状摆开，位置用七颗星的星名（位置含义为本站设计）；抽牌后可导出 9:16 北斗竖图
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
| `src/astro.ts` / `src/zodiac.ts` | 星座对应、日月位置、十二星座页内容 |
| `src/app.ts` | 今日抽牌、回望、设置页面 |
| `src/lib/dipper.ts` | 北斗七星星表与此刻星空的计算（dipperSky） |
| `src/dipper-ritual.ts` | 北斗仪式的画面与交互 |
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
- 星表：Yale Bright Star Catalogue 第五版（Hoffleit & Warren 1991，公有领域，[原始数据](http://tdc-www.harvard.edu/catalogs/bsc5.html)），经 [brettonw/YaleBrightStarCatalog](https://github.com/brettonw/YaleBrightStarCatalog)（MIT）转成 JSON；北斗七星、辅、北极星的坐标与任务说明里的 Hipparcos 近似值逐颗核对。生成脚本 `scripts/build-star-catalog.mjs`
- 「斗柄东指，天下皆春」：《鹖冠子·环流》，原文见[维基文库](https://zh.wikisource.org/wiki/%E9%B6%A1%E5%86%A0%E5%AD%90#%E7%92%B0%E6%B5%81)
- 字体：思源黑体（SIL OFL 1.1）

第三方许可证原文见 `legacy-static/` 与 `public/licenses/`。

本项目自身的代码与文案保留所有权利。
