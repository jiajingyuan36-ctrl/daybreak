# 今日塔罗竖图

生成 1242 × 1660 像素 PNG：顶部日期与「今日塔罗」，中间 1909 年原版牌面，下面为牌名、正逆位、对应的三个关键词及「今天可做」。使用深色底、金色细框和本地精简衬线字体。逆位时仅将牌面旋转 180°，文字保持正向。

文案只读 `src/data/tarot_cards_78.json`；关键词随正逆位切换，`today_action` 是原数据中的牌级字段，正逆位共用。图片不包含网址、二维码、品牌推广或引导站外的文字。脚本使用内嵌本地素材，渲染时阻断 HTTP 请求。

## 使用

需要 Node.js 24、项目依赖，以及 Playwright。先生成或刷新牌库：

```sh
npm run prebuild
node scripts/build-xhs.mjs m0 upright --date 2026-11-12
node scripts/build-xhs.mjs cups-2 reversed --date 2026-11-12
node scripts/build-xhs.mjs --samples --date 2026-11-12
```

正逆位也可以写成 `正位` / `逆位`。省略 `--date` 时使用上海时区的当天日期。文件保存在本目录，以 `日期-牌id-方向.png` 命名；重复生成同一日期、同一张牌、同一方向会覆盖该文件。参数无效、文案缺失、字体缺字或排版越界时会报错退出。

`--samples` 生成七张不同牌，包含大小阿卡纳、四种花色和两种方向：愚人正位、女祭司逆位、星星正位、权杖王牌正位、圣杯二逆位、宝剑四正位、星币九逆位。

## 独立安装绘图依赖

与现有 `scripts/xhs-covers.mjs` 一样，不将 Playwright 加入网站生产依赖。可以安装到仓库外的工具目录，再通过 `NODE_PATH` 指定。下面为 PowerShell 示例：

```powershell
$xhsTools = Join-Path $env:TEMP 'daybreak-xhs-tools'
npm install --prefix $xhsTools --no-package-lock playwright
$env:NODE_PATH = Join-Path $xhsTools 'node_modules'
node scripts/build-xhs.mjs --samples --channel chrome
```

已安装 Chrome 或 Edge 时可使用 `--channel chrome` / `--channel msedge`。若使用 Playwright 自带的 Chromium，先运行工具目录中的 `node_modules/playwright/cli.js install chromium`，然后省略 `--channel`。

本目录七张样图日期为 2026-11-12。尺寸以明确要求的 1242 × 1660 为准，接近 3:4。
