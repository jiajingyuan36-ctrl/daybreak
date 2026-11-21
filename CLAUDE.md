# DAYBREAK — Claude 接手说明

请在这个现有 Next.js 项目上继续编辑，不要重新创建网站。先阅读 README.md，再检查源代码。

## 当前状态
线上：https://daybreak-morning-ritual.onrender.com/
**main 是唯一的源码主线**（2026-11-05 起）：它包含线上全部内容，以及提问后端 server/。所有改动先在分支上做、测过，再合进 main；不要再各自从部署包还原一份。
部署现在有两种：旧方式是把源码打成 source.tar.gz.b64 推到 cike-yousheng 的 daybreak-render 分支（见下面“部署注意”）；新方式是让 Render 直接从本仓库 main 构建（`npm ci && npm run build`，发布 dist），不再打包。切到新方式之前，旧方式仍然有效（2026-11-05 的上线用的就是旧方式，源码 main@09f323f，部署分支 20e197e）。新增页面（/card/<id>/、/about/）和 sitemap、robots 都是构建时生成，打包后要在线上看一眼 sitemap 条目数（89）。**推送部署分支之前先 git fetch，看有没有别人新推的提交，有就先合并，不要覆盖。**
.github/workflows/ci.yml 在每次推送 main 和每个 PR 上跑类型检查、全部测试、生产构建。.gitattributes 统一用 LF，Windows 上不要把文件改成 CRLF（会让合并整文件冲突）。

## 运行
使用 Node.js 24。在本目录运行：
```
npm ci
npm run dev
npm run typecheck
npm test
npm run build
```
生产构建输出 dist/，可作为静态网站发布。Google 字体在构建时需要网络，构建后同源托管；思源黑体已在 legacy-static/fonts/。网站本身无需 AI API Key。可选的「抽牌后问一个问题」另有一个后端 server/（见 server/README.md），密钥只放在它的 Render 环境变量里，src/site.ts 的 AI_ENABLED 控制网页上是否显示入口。

## 关键文件
- src/plain.ts：78 张牌全部白话文案的唯一来源（关键词、一句话看懂、正逆位今日解析、生活场景、今天可做、晚间回顾）。改文案只改这里。
- src/cards.ts：牌名、编号与稳定 ID，文案从 plain.ts 读取。
- src/knowledge.ts：RWS 牌面符号与原典链接。
- scripts/seed-tarot-data.ts：构建前把上述数据转成 src/data/tarot_cards_78.json，只做格式转换，不生成文字。
- tests/plain.test.ts：文案字数、禁用词、重复句与旧历史兼容检查。
- public/rws/：78 张 1909 年 Rider–Waite–Smith 原版牌面（公有领域，来自维基共享资源 Wikimedia Commons），彩色 WebP，600×1029；thumb/ 为 320 宽小图。src/art.ts 的 cardImage() 生成标签，几何 art() 只用于后备。
- src/card-back.ts：全站牌背「夜空版画」（viewBox 240×400；2026-11-18 前是星盘月相 · 古铜金）。上半部分画一次、下半部分旋转 180° 复用，牌倒过来完全一样；颜色读 engraved.css 里的 --cb-* 变量（深色墨黑底象牙白线、浅色羊皮纸底墨线）。每日抽牌用 cardBack()，牌阵页 78 张用 cardBackSprite() + cardBackUse()。
- src/lib/dipper.ts：北斗七星、辅、北极星与 128 颗背景星（BSC5，背景星由 scripts/build-star-catalog.mjs 生成 src/lib/dipper-stars.ts）；dipperSky(date,lat,lon) 算此刻此地的星空。src/lib/dipper-draw.ts 是仪式里的洗牌/切牌/选位，只用 crypto 随机数，**不得读取任何天文数据**（同一时刻同城的人抽到的牌必须互不相干）。src/dipper-ritual.ts 是北斗仪式的画面与交互；北斗牌阵文案在 src/dipper-copy.ts（也走 plain.test.ts 的检查）；scripts/check-dipper-layout.mjs 检查牌阵四种宽度不重叠。
- src/lib/bazi-fortune.ts：按生辰的今日运势（lunar-javascript 排盘）；src/components/real-moon.tsx：真实月面（three.js 贴图 + Astronomy Engine）。
- prepare-legacy.mjs 用 esbuild 把 src/app.ts 打包成 public/js/app.js。
- src/lib/tarot-catalog.ts、src/types/tarot.ts：现代牌库与类型。
- src/app.ts：今日塔罗、回望、设置的旧版渲染入口。
- src/components/tarot/compendium.tsx：图鉴（/encyclopedia/）：分段筛选、搜索、「我的收集」（只读 daybreak:v1 的抽牌记录），点开是检视台（倾斜跟手 + 金箔反光、正逆位、翻牌背、放大、上一张下一张）。数据全部读 cards/plain/knowledge/astro，不另存文案。
- src/components/tarot/tarot-workbench.tsx：牌阵（其中 encyclopedia 模式已不再被页面使用）。
- src/lib/tarot-consultation.ts：牌阵解释组合。
- src/share.ts：Canvas 分享图。
- src/components/almanac-dashboard.tsx：日历与日签导出。
- legacy-static/epic.css：极简主题的基础样式；app/layout.tsx：字体与共享框架。
- legacy-static/engraved.css：「夜空版画」界面（2026-11-18 起，参考黑底细线版画塔罗）：星空底、标题下的星形分隔线、大牌的双线框和四角扇形光芒、直角双线按钮、页脚远山水面。牌面仍是彩色原版扫描，只换界面。全站的金色统一走 --gold-rgb / --gold-hi-rgb 两个变量（在这里定义），不要再在 epic.css 里写死颜色。装饰图形在 legacy-static/ornaments.css，由 scripts/build-ornaments.mjs 生成（mask-image 取形状，颜色跟主题走）。旧版页面（src/components/legacy-screen.tsx）要在 Next 的样式之后再按 style → epic → ornaments → engraved 的顺序叠一遍（style.css 里有些规则必须被后面的盖住），prepare-legacy.mjs 把这四个文件合成一个压缩的 /legacy.css，旧版页面只链这一个。不要只链 style.css：2026-11-20 试过，抽牌、回望、设置三页的布局会变。

- src/bookmarks.ts、src/components/bookmark-button.tsx、src/components/bookmarks-page.tsx、app/bookmarks/：书签（2026-11-20）。可以收一张牌（牌页、图鉴检视台）或某一天的结果（今日结果页，app.ts 的 dayBookmark）。存在 daybreak:bookmarks:v1，和抽牌记录分开存（React 页面和旧版页面各自读写，互不覆盖）；设置页导出备份时带上 bookmarks，导入时一并恢复。书签页不进 sitemap、不让搜索引擎收录。某一天的书签链到 /history/#day=日期，app.ts 启动时读这个 hash 直接打开那一天。tests/bookmarks.test.ts 覆盖。

- src/card-deep.ts：单张牌页的长内容（感情、学业事业的正逆位，是还是否，常见误读，常见问题；常见问题同时写成 FAQPage 结构化数据）。分批写：大阿卡纳和权杖已完成，圣杯、宝剑、星币按花色补；tests/card-deep.test.ts 检查字数、套话、含糊词和重复句。字体缺字时不要绕开常用词：用 Adobe 思源宋体 2.003 的 SubsetOTF/CN/SourceHanSerifCN-Regular.otf，按 serif-sc-core.txt 加新字重新抽字（保留原有 GSUB/GPOS 特性、名字改成 DaybreakSerif），再运行 node scripts/font-css.mjs。
- src/quiz.ts、src/components/quiz-app.tsx、app/quiz/：性格测试「你是哪张塔罗牌」（/quiz/，结果分享页 /quiz/m0/ … /quiz/m21/）。题目、计分、22 种结果都在 src/quiz.ts（文案走 tests/quiz.test.ts 的套话与字数检查，并模拟随机答题检查 22 种结果分布均匀）；结果图在 src/quiz-poster.ts（牌面人物没穿衣服的 6 张牌改画牌背）；链接预览图由 scripts/build-quiz-og.mjs 生成在 public/og/quiz/。content-kit/quiz/ 里的草稿只是初稿，以 src/quiz.ts 为准。
- server/tone.mjs：「AI 味」套话清单（别慌、你值得、比想象中更、破折号……），网页文案（tests/plain.test.ts）和 AI 回答共用。AI 回答命中时自动重写一次。新写文案或改提示词前先看这份清单；用户反馈出现新的套话就加进去。
- server/ask.mjs、server/index.mjs、src/ai-ask.ts：提问后端与网页端。AI 只解读已抽出的牌，不参与抽牌；牌义用站内文案；不记录问题与回答；轻生相关问题不调用模型。tests/ai-server.test.ts 覆盖。

## 文案语气（2026-11-11 起）
全站解读用「占卜师」语气：简洁，干净，笃定，不讨好。先下判断，再用牌面画面说明；短句，一句一件事；行动用祈使句（「写下……」「今天把……做完」）；不安慰、不铺垫、不升华。笃定但不断言将来（不用一定会、注定），也不用可能、或许、不妨这类含糊词。不吓人（灾祸、小人、第三者）。套话清单见 server/tone.mjs。AI 回答的同一套要求写在 server/ask.mjs 的 SYSTEM 里，改一处要对照另一处。

## 接下来做
- 改文案时保留卡牌ID、本地存储键、历史记录兼容性，保持当前极简视觉；跑 npm test 会检查禁用词与字数。

## 部署注意
源码仓库是 jiajingyuan36-ctrl/daybreak，推送到这里不会更新线上。线上由 Render 从 jiajingyuan36-ctrl/cike-yousheng 的 daybreak-render 分支构建（不要修改该仓库的 main，那是其他项目）：Render 把 source.tar.gz.b64 解包到 app，再 npm ci 与 build，发布 app/dist。更新线上需要重新打包并更新 unpack.mjs 中的 SHA256。

打包时文件清单与原包一致：git ls-files 去掉 .gitignore、.gitattributes、.github/、content-kit/、CLAUDE.md、README.md 和 legacy-static/fonts/SourceHanSansCN.woff2（unpack.mjs 部署时另行下载），再加上 prebuild 生成的 src/data/*.json，全部放在 app/ 下。改了前端文件要把 public/sw.js 的缓存版本号加一。**打包时不要用 tar --mtime 把文件时间固定成同一个值**：Render 会保留上一次的构建缓存，构建工具按文件修改时间判断有没有改动，时间不变就会沿用旧页面（sw.js 照样更新，看起来像发布成功）。2026-11-09 因此有三次发布的页面没有更新。验证上线要看页面内容本身，不能只看 sw.js 版本号。CDN 会缓存约 5 分钟；app.js 是模块脚本，浏览器请求带 Origin 头，CDN 单独缓存一份，验证线上时要等它也刷新。

## 线上测试不要算进访问统计
用浏览器（Playwright 等）打开线上网站做验证之前，先让 Umami 不统计这次访问：在页面加载前设置 localStorage 的 `umami.disabled` 为 `1`（Playwright：`context.addInitScript(()=>localStorage.setItem('umami.disabled','1'))`）。模拟 iPhone 的测试会被 Umami 当成真实手机用户；2026-11-14 的数据（「美国 18 位、抽牌 9 次」）有一大部分是这样来的测试访问。

## 样式注意
epic.css 开头有 `body *{border-radius:0!important;box-shadow:none!important;backdrop-filter:none!important}`，要投影、圆角或毛玻璃必须用更具体的选择器并加 !important；关键帧动画改不动 box-shadow。按压手感统一由 src/tactile.ts（initTactile 挂在 site-chrome，给控件加 .is-pressed/.is-releasing；triggerHaptic 微震；busyButton 菊花→✓）处理；下拉统一用毛玻璃浮层（旧版页面用 src/popover.ts 的 glassSelect 包原生 select，React 头部是 ThemePicker）。抽牌到揭晓（以及换一张）的动画在 src/draw-motion.ts，用 Web Animations API 驱动（全站 CSS 的 !important 规则会吃掉普通 CSS 动画和投影），app.ts 里 drawPhase 不在 idle 时拒绝新的抽牌。**抽牌动画防卡顿（2026-11-17）**：锁定一开始就用浮层 .draw-flight 换下抽中的牌，浮层先浮起再极慢上浮，结果页整页渲染就放在这段上浮里（合成线程上的 transform 动画不受主线程影响），渲染完从浮层当前位置接着飞。动画开始后不要同步读样式或布局，不要给大片元素做 filter: blur，不要在指针移动时改整片牌扇的样式或量 13 张牌，抽牌时不要给牌扇里的牌设 disabled（会重算全部牌背）。改了 draw-motion.ts、app.ts 的抽牌流程或仪式页样式后，先 npm run build 再跑 node scripts/check-draw-jank.mjs（iPhone 13、CPU 降速 4 倍和 6 倍，量点击时网站自己的处理时间、浮层掩护和其余每一帧），不通过不发布。这台测试机的帧时长前后能差一倍，怀疑退化时把上一版也构建出来、在同一台机器上交替跑几次再比较。揭晓时「待揭晓」的类挂在牌自己身上（.tarot.is-pending），不要挂回整个结果区，否则揭晓那一帧要重算整页。视图过渡是“先出后入”（旧 180ms 淡出，新延迟 180ms 淡入），不要改回交叉淡化，否则换一张和换页会叠影。epic.css 给所有 [role=button] 等控件设了 touch-action:manipulation，需要拖动/划动的手势区（牌堆、牌扇、北斗星空）必须用更具体的选择器加 !important 锁回 none，否则一划就被浏览器当成滚动、手势失效。旧版页面还会加载 legacy-static/style.css，其中 .primary 有 min-width 等规则。tests/font.test.ts 会检查源码（含注释）里的每个汉字都在精简字体中，新加汉字前先确认或重新抽字。

包内不含密钥、node_modules、构建缓存或浏览器个人记录。字体及第三方许可证保留。

## 做事与协作底线
1. 汇报先给结论，再给理由和步骤；短句白描，不空谈。
2. 禁止迎合我的既定倾向；发现逻辑漏洞、反例或风险直接指出。
3. 没实际运行或核对过的内容明确标「未验证」，不编造数据、链接或结果。
4. 禁止擅自增加需求之外的功能；复杂任务先确认使用场景、验收标准和「本次不做什么」再动工。
5. 修改局部前先看上下游影响；同一问题基于同一前提连续两次修复失败时，立刻停下查根因与底层假设，不再继续打补丁。
6. 遇到产品立项、开放性方案设计、架构选型、重要决策评审或返工复盘时，主动加载并执行 `uw-mode` Skill。
