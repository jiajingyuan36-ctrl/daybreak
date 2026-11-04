# DAYBREAK — Claude 接手说明

请在这个现有 Next.js 项目上继续编辑，不要重新创建网站。先阅读 README.md，再检查源代码。

## 当前状态
线上：https://daybreak-morning-ritual.onrender.com/
本仓库 main 合并本次 PR 后与线上版本一致（部署分支 daybreak-render 提交 f74ce8e，源码 4a03e9e）。68 项测试、类型检查与生产构建通过。

## 运行
使用 Node.js 24。在本目录运行：
```
npm ci
npm run dev
npm run typecheck
npm test
npm run build
```
生产构建输出 dist/，可作为静态网站发布。Google 字体在构建时需要网络，构建后同源托管；思源黑体已在 legacy-static/fonts/。无需 AI API Key。

## 关键文件
- src/plain.ts：78 张牌全部白话文案的唯一来源（关键词、一句话看懂、正逆位今日解析、生活场景、今天可做、晚间回顾）。改文案只改这里。
- src/cards.ts：牌名、编号与稳定 ID，文案从 plain.ts 读取。
- src/knowledge.ts：RWS 牌面符号与原典链接。
- scripts/seed-tarot-data.ts：构建前把上述数据转成 src/data/tarot_cards_78.json，只做格式转换，不生成文字。
- tests/plain.test.ts：文案字数、禁用词、重复句与旧历史兼容检查。
- public/rws/：78 张 1909 年 Rider–Waite–Smith 原版牌面（公有领域，来自维基共享资源 Wikimedia Commons），彩色 WebP，600×1029；thumb/ 为 320 宽小图。src/art.ts 的 cardImage() 生成标签，几何 art() 只用于牌背和后备。
- src/lib/bazi-fortune.ts：按生辰的今日运势（lunar-javascript 排盘）；src/components/real-moon.tsx：真实月面（three.js 贴图 + Astronomy Engine）。
- prepare-legacy.mjs 用 esbuild 把 src/app.ts 打包成 public/js/app.js。
- src/lib/tarot-catalog.ts、src/types/tarot.ts：现代牌库与类型。
- src/app.ts：今日塔罗、回望、设置的旧版渲染入口。
- src/components/tarot/tarot-workbench.tsx：图鉴与牌阵。
- src/lib/tarot-consultation.ts：牌阵解释组合。
- src/share.ts：Canvas 分享图。
- src/components/almanac-dashboard.tsx：日历与日签导出。
- legacy-static/epic.css：当前极简主题；app/layout.tsx：字体与共享框架。

## 接下来做
- 改文案时保留卡牌ID、本地存储键、历史记录兼容性，保持当前极简视觉；跑 npm test 会检查禁用词与字数。

## 部署注意
源码仓库是 jiajingyuan36-ctrl/daybreak，推送到这里不会更新线上。线上由 Render 从 jiajingyuan36-ctrl/cike-yousheng 的 daybreak-render 分支构建（不要修改该仓库的 main，那是其他项目）：Render 把 source.tar.gz.b64 解包到 app，再 npm ci 与 build，发布 app/dist。更新线上需要重新打包并更新 unpack.mjs 中的 SHA256。

打包时文件清单与原包一致：git ls-files 去掉 .gitignore、CLAUDE.md、README.md 和 legacy-static/fonts/SourceHanSansCN.woff2（unpack.mjs 部署时另行下载），再加上 prebuild 生成的 src/data/*.json，全部放在 app/ 下。改了前端文件要把 public/sw.js 的缓存版本号加一。CDN 会缓存约 5 分钟；app.js 是模块脚本，浏览器请求带 Origin 头，CDN 单独缓存一份，验证线上时要等它也刷新。

## 样式注意
epic.css 开头有 `body *{border-radius:0!important;box-shadow:none!important;backdrop-filter:none!important}`，要投影、圆角或毛玻璃必须用更具体的选择器并加 !important；关键帧动画改不动 box-shadow。按压手感统一由 src/tactile.ts（initTactile 挂在 site-chrome，给控件加 .is-pressed/.is-releasing；triggerHaptic 微震；busyButton 菊花→✓）处理；下拉统一用毛玻璃浮层（旧版页面用 src/popover.ts 的 glassSelect 包原生 select，React 头部是 ThemePicker）。视图过渡是“先出后入”（旧 180ms 淡出，新延迟 180ms 淡入），不要改回交叉淡化，否则换一张和换页会叠影。旧版页面还会加载 legacy-static/style.css，其中 .primary 有 min-width 等规则。tests/font.test.ts 会检查源码（含注释）里的每个汉字都在精简字体中，新加汉字前先确认或重新抽字。

包内不含密钥、node_modules、构建缓存或浏览器个人记录。字体及第三方许可证保留。
