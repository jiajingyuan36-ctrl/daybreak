# DAYBREAK — Claude 接手说明

请在这个现有 Next.js 项目上继续编辑，不要重新创建网站。先阅读 README.md，再检查源代码。

## 当前状态
线上：https://daybreak-morning-ritual.onrender.com/
本仓库与线上版本一致（部署分支提交 c39c523）。50 项测试、类型检查与生产构建通过。

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
- public/rws/：78 张 1909 年 Rider–Waite–Smith 原版牌面（公有领域，来自 github.com/metabismuth/tarot-json），黑白 WebP，350×600；thumb/ 为 160 宽小图。src/art.ts 的 cardImage() 生成标签，几何 art() 只用于牌背和后备。
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
- 改文案时保留卡牌ID、本地存储键、历史记录兼容性，保持当前极简黑白视觉；跑 npm test 会检查禁用词与字数。

## 部署注意
源码仓库是 jiajingyuan36-ctrl/daybreak，推送到这里不会更新线上。线上由 Render 从 jiajingyuan36-ctrl/cike-yousheng 的 daybreak-render 分支构建（不要修改该仓库的 main，那是其他项目）：Render 把 source.tar.gz.b64 解包到 app，再 npm ci 与 build，发布 app/dist。更新线上需要重新打包并更新 unpack.mjs 中的 SHA256。

包内不含密钥、node_modules、构建缓存或浏览器个人记录。字体及第三方许可证保留。
