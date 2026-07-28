import type { AgentTool } from './types'

type ToolDocInput = Pick<AgentTool, 'name' | 'description' | 'parameters'>

/**
 * 部分工具的扩展使用说明（Markdown）。
 * 未列出的工具由 queryToolUsageGuide 根据 description + 参数 Schema 自动生成。
 */
const USAGE_GUIDE_OVERRIDES: Record<string, string> = {
  query_scheduled_tasks: `## 何时使用

在创建、修改或关联定时任务前，先列出本地已保存的定时任务，避免重复 id 或引用错误计划。

## 返回内容

每条任务包含：\`id\`、名称、\`enabled\`、\`actionType\`、下次执行时间。

## 示例话术

- 「帮我看看现在有哪些定时任务」
- 「查一下 id 为 xxx 的定时任务是否已启用」`,

  post_scheduled_task: `## 何时使用

用户明确要求「每天九点发一篇」「每周一跑工作流」等需要**持久化到本机调度器**的场景。

## 重要约定

- 新建任务默认 \`enabled=false\`，需用户确认后再改为 \`true\` 才会真正调度。
- \`actionType=publish_plan\` 时 \`publishPlanId\` 必须已存在（可先 \`query_publish_plans\` / \`post_publish_plan\`）。
- \`once\` 用 \`runAt\`（毫秒时间戳）；\`daily\` / \`weekdays\` / \`weekly\` 用 \`timesOfDay\`（\`HH:mm\`），\`weekly\` 还需 \`weekday\`（0=周日 … 6=周六）。
- 循环任务可选 \`activeFrom\` / \`activeUntil\`（毫秒时间戳）限制生效日期区间。

## 示例

\`\`\`json
{
  "title": "工作日早报",
  "repeat": "daily",
  "timesOfDay": ["09:00"],
  "actionType": "custom_prompt",
  "customPrompt": "汇总今日热点并生成简报",
  "enabled": false
}
\`\`\``,

  query_publish_plans: `## 何时使用

需要查看已有发布计划 id、子任务数量，或在保存定时任务前确认 \`publishPlanId\`。

## 返回内容

计划 id、标题、\`kind\`（normal / workflow）、子任务数、关联流程数。`,

  post_publish_plan: `## 何时使用

用户要保存「多平台发布任务模板」或「流程型发布计划」，供后续手动执行或定时任务引用。

## 类型说明

- **normal**：至少 1 个子任务；每子任务需 \`title\`、\`channels\`、\`contentPrompt\`。
- **workflow**：需 \`workflowIds\`（至少一项），子任务可为空。

保存后会同步镜像工作流，可在 \`post_scheduled_task\` 中 \`actionType=publish_plan\` 引用返回的 id。`,

  query_agent_rules: `## 何时使用

查看当前用户规则列表（id、名称、是否启用），在新增或更新规则前避免 id 冲突。

规则启用后从**下一轮对话**起注入 system prompt。`,

  post_agent_rule: `## 何时使用

用户希望长期约束 Agent 行为（语气、格式、禁止事项等），且愿意持久保存为「用户规则」。

## 字段说明

- \`name\`、\`content\`（Markdown）必填；\`id\` 可省略（由名称生成 slug）。
- \`enabled\` 默认 \`true\`；关闭后不再注入。

## 与技能的区别

规则偏**偏好与约束**；技能偏**可安装的操作流程**，通过 \`use_skill\` 按需加载。`,

  use_skill: `## 何时使用

仅当用户任务与「已启用技能」目录中的描述**明确匹配**时再调用；不要凭猜测加载技能。

## 参数

- \`skillId\`：技能市场或本机技能列表中的 id。

## 返回

技能完整 Markdown 说明，供后续步骤遵循。`,

  present_plan_choices: `## 何时使用

存在 **2 个及以上**可行方案且差异会影响结果、且当前为**需确认**模式时，必须先列出方案并暂停，等待用户在聊天中选择或补充说明。

完全访问、自动发布任务、自动流程执行时：**不要**调用本工具；自行择优并连续执行。

不要用于只有一个显然正确路径的简单问题。`,

  xhs_publish_note: `## 何时使用

成稿齐全，且用户确认要发布到**小红书**时调用。

## 发布类型（必判）

调用前根据用户意图选择 \`publishType\`，工具会直达官方入口再填充：

| publishType | 场景 | 入口 |
|-------------|------|------|
| image | 图文笔记（默认） | \`?from=menu&target=image\` |
| video | 上传视频 | \`?from=menu&target=video\` |
| article | 写长文 | \`?from=menu&target=article\` |
| audio | 发播客 | \`?from=menu&target=audio\` |

- 图文需 \`imagePaths\`（或先 \`fetch_web_images\`）
- 视频需 \`videoPaths\`
- 播客需 \`audioPaths\`
- 长文以正文为主，可不传图

## 注意

- 未登录时会暂停等待扫码；以工具返回为准，不要声称已发布成功。
- 尊重频次与深夜禁发等平台规则。`,

  douyin_publish_note: `## 何时使用

成稿、配图齐全，且用户确认要发布到**抖音图文**时调用。登录与结果判定同小红书发布工具。`,

  web_search: `## 何时使用

需要按**关键词**检索公开网页、新闻背景、出处链接时调用。工具内部**优先 Bing，失败自动改百度**；HTTP 失败再无头浏览器兜底。

## 不要用于

- 已有具体文章 URL → 用 \`query_web_data\`
- 今日热搜榜单 → 用 \`fetch_hot_topics\`

## 如何调用

\`\`\`json
{ "query": "某热点事件 最新进展", "maxResults": 8 }
\`\`\`

返回标题、链接与摘要；可再对感兴趣的链接调用 \`query_web_data\` 读正文。`,

  query_web_data: `## 何时使用

用户粘贴了网页链接（掘金、知乎、公众号、CSDN、博客、GitHub 等），需要**阅读 / 总结 / 基于原文创作**时，先调用本工具拉取标题与正文，再作答。不要凭 URL 臆造内容。

需要页面里的图片 / 视频 / 音频时，传 \`mediaTypes\` 按需提取清单；要落盘再设 \`downloadMedia: true\`（会按标题/主题筛选相关项，不整页狂下）。仅发布配图仍可用 \`fetch_web_images\`（务必传 \`topic\`）。

## 如何调用

\`\`\`json
{ "url": "https://juejin.cn/post/xxxxxxxxxxxx" }
\`\`\`

强前端 / SPA 站点（正文 HTTP 抓不到）可加：

\`\`\`json
{ "url": "https://zhuanlan.zhihu.com/p/xxxxxxxxxxxx", "preferBrowser": true }
\`\`\`

按需提取视频与音频（只列 URL，不下载）：

\`\`\`json
{
  "url": "https://example.com/post",
  "mediaTypes": ["video", "audio"],
  "maxMediaCount": 8
}
\`\`\`

提取并下载到本地：

\`\`\`json
{
  "url": "https://example.com/post",
  "mediaTypes": ["image", "video", "audio"],
  "downloadMedia": true
}
\`\`\`

## 参数说明

| 参数 | 必填 | 说明 |
|------|------|------|
| \`url\` | 是 | http/https 链接 |
| \`preferBrowser\` | 否 | \`true\` 时跳过 HTTP，直接无头浏览器 |
| \`maxLength\` | 否 | 正文最大字符数（默认约 20000） |
| \`mediaTypes\` | 否 | \`image\` / \`video\` / \`audio\` 子集；未传则不提取媒体 |
| \`downloadMedia\` | 否 | \`true\` 时下载到 artifacts（默认 false，只列 URL；单文件上限 50MB） |
| \`maxMediaCount\` | 否 | 媒体条数上限（合计，默认 8，上限 20） |

## 返回内容

含标题、URL、可选作者/摘要与正文；若请求了媒体则附「媒体资源」清单（URL，及可选 localPath）。
并写入工作流上下文 \`webDataOk\` / \`webData\` / \`webDataUrl\` / \`webDataTitle\` / \`webDataMedia\`。

## 注意

- 需登录才能看的页面可能失败，应如实告知用户。
- 传了 \`mediaTypes\` 但 HTTP 抽不到媒体时，会自动改用无头浏览器并嗅探网络请求（SPA/音乐站）。
- 热点榜单用 \`fetch_hot_topics\`；只要发布配图用 \`fetch_web_images\`。`,

  query_weather: `## 如何调用

Agent 以 **tool_calls** 调用本工具，参数为 JSON 对象（见下表）。用户指定城市时**必须**传 \`city\`，不要只靠 IP 定位。

\`\`\`json
{ "city": "合肥" }
\`\`\`

不传 \`city\` 时：先按本机 IP 定位；定位失败则默认查询「合肥」。

## 参数说明

| 参数 | 必填 | 说明 |
|------|------|------|
| \`city\` | 否（用户点名城市时**视为必填**） | 城市名，如 \`北京\`、\`上海\`、\`合肥\`；可带「市」后缀 |

## 返回内容

正文为可读天气长文本（实况、3 日预报、24 小时逐时、空气质量等），并写入工作流上下文键：\`weatherOk\`、\`weatherText\`、\`weatherSummary\`、\`weatherCity\`、\`weatherTemperature\` 等。后续步骤应**以工具返回正文为准**排版，不要编造未返回的数值。

## 典型话术 → 调用方式

| 用户意图 | 建议传参 |
|----------|----------|
| 查合肥今天天气 | \`{ "city": "合肥" }\` |
| 查我这边天气（未说城市） | \`{}\` 或省略参数 |
| 上海未来两天预报 | \`{ "city": "上海" }\`，从返回中截取预报段 |

## 与 notify_message 组合（天气早报推飞书）

推荐顺序：**先** \`query_weather\`，**再**根据返回组装正文，**最后** \`notify_message\` 推送（同一渠道+同一正文只调一次 notify）。

1. \`query_weather\` → \`city: "合肥"\`（或用户指定城市）
2. 按约定模板把返回数据填进 \`content\`（见 notify_message 说明中的「模板 B」）
3. \`notify_message\` → \`channelId: "feishu"\`, \`msgType: "post"\`, \`title\` 可选`,

  notify_message: `## 如何调用

Agent 以 **tool_calls** 调用本工具。必须指定**至少一个**通知渠道；**不要**在参数里传 webhook URL（由本机渠道配置托管）。

**单渠道：**

\`\`\`json
{
  "channelId": "feishu",
  "msgType": "post",
  "title": "合肥天气早报",
  "content": "（正文，见下方模板 B）"
}
\`\`\`

**多渠道同时推送：**

\`\`\`json
{
  "channelIds": ["feishu", "webhook"],
  "msgType": "text",
  "content": "纯文本正文"
}
\`\`\`

\`channelId\` 与 \`channelIds\` 二选一；若都传，以 \`channelIds\` 为准。

## 参数说明

| 参数 | 必填 | 说明 |
|------|------|------|
| \`channelId\` | 与 channelIds 至少填一类 | 单渠道 id，常用 \`feishu\`、\`webhook\`（须在设置中已配置 webhook） |
| \`channelIds\` | 同上 | 字符串数组，多渠道 fanout |
| \`content\` | text/post **必填** | 消息正文；飞书 \`post\` 可用 Markdown，含表格/标题会自动排版 |
| \`title\` | 否 | 标题，对 \`text\` / \`post\` 有效 |
| \`msgType\` | 否 | 飞书：\`text\` \| \`post\` \| \`image\` \| \`share_chat\`；缺省用渠道默认（飞书多为 \`post\`） |
| \`imageKey\` | image 时通常需要 | 飞书图片 \`image_key\`，可覆盖渠道配置 |
| \`shareChatId\` | share_chat 时通常需要 | 飞书群名片 id，可覆盖渠道配置 |

## 调用注意

- 工具返回「已发送」后**禁止重复调用**相同渠道+相同正文（会去重）。
- 未配置 webhook / 飞书机器人的渠道会返回失败，需用户在设置里先配好渠道。

## 完整示例：合肥天气 → 模板 B → 飞书 post

**步骤 1** — 拉取天气（有明确城市时必须传参）：

\`\`\`json
{ "name": "query_weather", "arguments": { "city": "合肥" } }
\`\`\`

**步骤 2** — 用步骤 1 返回的实况/预报/逐时/AQI 等字段，按下述「模板 B」组装 \`content\`，再推送：

\`\`\`json
{
  "name": "notify_message",
  "arguments": {
    "channelId": "feishu",
    "msgType": "post",
    "title": "合肥 · 早安天气日报",
    "content": "（按模板 B 填写的完整正文）"
  }
}
\`\`\`

用户话术示例：「查询合肥今日完整天气数据，按模板 B 格式组装简报，通过 notify_message 推送到飞书（channelId=feishu, msgType=post）」

### 模板 B（content 排版参考）

\`\`\`
【合肥 · {日期} 早安天气日报】
━━━━━━━━━━━
🌤 今日概况
━━━━━━━━━━━
天气：☀️/🌤/☁️/🌧（根据实际天气图标）
气温：{最低温}°C ～ {最高温}°C
体感温度：{最低体感}°C ～ {最高体感}°C
当前实况：{当前气温}°C（体感 {体感温度}°C）
湿度：{湿度}%｜风力：{风向风速}
紫外线指数：{UV值}（⚠️极高/高/中等/低）
空气质量：AQI {AQI值}（{等级}）

━━━━━━━━━━━
🌡 分时预报（重点时段）
━━━━━━━━━━━
{挑选 08:00/12:00/14:00/18:00 等关键时段列出}

━━━━━━━━━━━
📅 未来两天
━━━━━━━━━━━
明天 {日期}｜{天气} {最低}~{最高}°C
后天 {日期}｜{天气} {最低}~{最高}°C

━━━━━━━━━━━
💡 出行建议
━━━━━━━━━━━
根据天气生成防晒/带伞/穿衣等实用建议
\`\`\`

将 \`{合肥}\` 换成 \`query_weather\` 返回的 \`weatherCity\` 或用户指定城市；所有数值须来自天气工具返回，缺失项可写「暂无」而非猜测。`
}

/** 将 JSON Schema 风格 parameters 格式化为 Markdown 列表 */
function formatSchemaParameters(parameters: Record<string, unknown>): string {
  const props = parameters.properties
  if (!props || typeof props !== 'object') {
    return '_本工具无参数或参数结构未声明。_'
  }
  const required = Array.isArray(parameters.required)
    ? (parameters.required as string[])
    : []
  const entries = Object.entries(props as Record<string, Record<string, unknown>>)
  if (entries.length === 0) return '_本工具无参数。_'

  return entries
    .map(([key, schema]) => {
      const type = String(schema.type ?? 'any')
      const req = required.includes(key) ? '必填' : '可选'
      const desc =
        typeof schema.description === 'string' ? schema.description.trim() : ''
      const enumVals = Array.isArray(schema.enum)
        ? `，取值：\`${(schema.enum as string[]).join('` | `')}\``
        : ''
      return `- \`${key}\`（${type}，${req}${enumVals}）${desc ? ` — ${desc}` : ''}`
    })
    .join('\n')
}

/**
 * 生成设置页与 Agent 目录展示用的工具使用说明（Markdown）。
 */
export function queryToolUsageGuide(tool: ToolDocInput): string {
  const override = USAGE_GUIDE_OVERRIDES[tool.name]
  if (override) {
    return `## 功能说明\n\n${tool.description}\n\n${override}`
  }

  const params = formatSchemaParameters(tool.parameters)
  return [
    '## 功能说明',
    '',
    tool.description,
    '',
    '## 参数',
    '',
    params,
    '',
    '## 提示',
    '',
    '- 在聊天中描述需求即可，Agent 会根据上下文决定是否调用本工具。',
    '- **敏感**或**危险**类工具可能弹出确认；结论以工具返回文本为准，不要编造执行结果。'
  ].join('\n')
}
