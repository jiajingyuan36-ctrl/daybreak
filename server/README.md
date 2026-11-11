# 晨启塔罗 · 提问后端

「抽牌后问一个问题」的后端。零依赖，Node 22+。网页只认识它，不认识 DeepSeek 密钥。

## 做什么
- `POST /api/ask`：收 `{cardId, reversed, mood, question}`，用站内牌义拼好提示词，请 DeepSeek 用占卜师的口吻写一段回答（100–180 字，三小段：判断、关键、今天要做的事），过检查后返回。
- `GET /health`：`{ok:true, ai:<是否配了密钥>}`，网页打开结果页时用它悄悄叫醒免费服务器。
- 抽哪张牌由网页里的随机数决定，这里不参与。

## 保护
- 密钥只读环境变量 `DEEPSEEK_API_KEY`，不写进代码、不写进日志。
- 来源检查（`ALLOWED_ORIGINS`），每人每分钟 3 次、每天 5 次，全站每天 800 次（内存计数，重启清零）。
- 轻生、自伤相关的问题不调用模型，直接返回固定的关怀提示（12356、120、110），不计次数。
- 回答检查：长度、预测用语（一定会、注定…）、玄学用语；不合格返回 422，网页保持原样。
- 套话检查（server/tone.mjs）：回答里有「别慌」「你值得」这类 AI 套话时，带着原回答请模型重写一次，更干净才换；破折号换成逗号。
- 不记录用户的问题和回答，日志只有牌 ID、耗时和状态。

## 环境变量
| 名字 | 必填 | 说明 |
|---|---|---|
| `DEEPSEEK_API_KEY` | 是 | 只放在 Render 的 Environment 里 |
| `PORT` | 否 | Render 自动设置 |
| `DEEPSEEK_MODEL` | 否 | 默认 `deepseek-chat` |
| `DEEPSEEK_BASE_URL` | 否 | 默认 `https://api.deepseek.com`（测试时指向假上游） |
| `ALLOWED_ORIGINS` | 否 | 逗号分隔，默认线上两个域名 + onrender 地址 |
| `ALLOW_LOCAL` | 否 | 设 `1` 允许 localhost 调试 |
| `LIMIT_PER_MINUTE` / `LIMIT_PER_DAY` / `LIMIT_GLOBAL_PER_DAY` | 否 | 默认 3 / 5 / 800 |

## 在 Render 上创建（Web Service）
- Name：`daybreak-ai`（地址就是 `https://daybreak-ai.onrender.com`，网页里的 `AI_API` 指向它）
- Repository：`jiajingyuan36-ctrl/cike-yousheng`，Branch：`daybreak-render`
- Root Directory：留空；Runtime：Node；Instance Type：Free
- Build Command：`base64 -d source.tar.gz.b64 | tar -xz`
- Start Command：`node --experimental-strip-types app/server/index.mjs`
- Health Check Path：`/health`
- Environment：`DEEPSEEK_API_KEY`（新生成的密钥）、`NODE_VERSION`＝`24`

免费服务闲置约 15 分钟会休眠，第一次请求要等半分钟左右；网页在打开结果页时会先发一次不带内容的 `/health` 叫醒它。

## 本机试
```
DEEPSEEK_API_KEY=... ALLOW_LOCAL=1 node --experimental-strip-types server/index.mjs
```
