# 灵犀

跨平台 AI 助手桌面应用（Electron + React + Ant Design）。

灵犀通过大模型驱动的 LangGraph 多智能体 ReAct Agent，自动完成内容创作、多渠道发布、流程编排、AI/Remotion 视频生成与消息通知。所有数据保存在本机，无需数据库。

## 核心能力

| 能力 | 说明 |
|------|------|
| 智能对话 | 自然语言描述任务，Supervisor 自动路由多角色协作并调用工具执行 |
| 快捷任务卡 | 新会话欢迎页提供预设任务卡，一键发送常见指令 |
| 聊天执行指令 | 在聊天中发送「执行定时任务/任务/流程 + 名称」直接触发 |
| 小红书 / 抖音发布 | 自动打开创作台、填写内容、上传配图、提交发布 |
| 网页配图 | 从新闻/资讯页抓取配图，自动下载到本地后上传 |
| AI 视频管线 | 剧本 → 分镜 → 场景素材 → 合成成片（万相 T2I/I2V + TTS） |
| Remotion 视频 | 程序化 React 视频：初始化工程 → Studio 预览 → 渲染 mp4（含进度展示） |
| 发布工作台 | 多子任务或串联流程的发布计划，一键串行执行 |
| 流程编排 | 可视化画布（Agent / 工具 / 通知 / 条件 / 并行等节点） |
| 定时任务 | 按日/周/单次触发发布计划、自定义指令或流程 |
| 技能市场 | 管理领域技能，注入 Agent 系统提示；支持模板、链接导入、会话总结 |
| 规则 | MDC 规则启用后注入各角色 system prompt |
| 渠道管理 | 发布渠道（小红书/抖音/视频号）与通知渠道（飞书/Webhook） |
| 业务系统 | 全量历史对话、工作流 context、节点 IO 与通知调试追溯 |
| 智能体浏览器 | Playwright 有头浏览器 + 右侧实时截帧预览，支持登录态复用 |
| 多模型连接 | 多供应商 API、按角色/能力路由；支持思考过程展示 |
| 资产维护 | 浏览、预览、删除 Agent 产出的图片/视频/HTML/文档 |

**模型**：默认对接阿里云百炼（DashScope）OpenAI 兼容接口，支持通义千问、DeepSeek、GLM、Kimi 等；可在设置中配置多条模型连接并按角色映射。

---

## 快速开始

### 环境要求

- Node.js ≥ 20（推荐 `nvm use 20`）
- pnpm ≥ 9
- macOS / Windows / Linux

### 安装与启动

```bash
git clone <repo-url> react-agent
cd react-agent
pnpm install
pnpm install:browser          # 国内镜像加速下载 Playwright Chromium
pnpm install:remotion-browser # Remotion 渲染依赖（可选，使用 Remotion 视频时需要）
pnpm dev
```

`pnpm install:browser` 默认经 npmmirror 加速。若镜像异常，改用官方源：

```bash
pnpm install:browser:official
```

### 首次配置

1. 打开 [阿里云百炼控制台](https://bailian.console.aliyun.com/) 创建 API Key。
2. 启动应用后，侧栏底部进入 **设置** → **模型与 API**。
3. 填写 **DASHSCOPE API Key**、**Base URL**（默认 `https://dashscope.aliyuncs.com/compatible-mode/v1`）、**模型**（默认 `qwen-plus`）。
4. 点击保存。可在 **多模型连接** Tab 配置多条连接与角色映射。

> API Key 仅保存在本机 `userData/react-agent-data/settings.json`，不会提交到 git。

---

## 使用说明

### 界面概览

```
┌─────────────────────────────────────────────────────────────┐
│  灵犀                                                       │
│  + 新任务                                                   │
│  技能市场 / 规则 / 流程 / 渠道 / 发布 / 定时任务              │
│  ── 历史对话 ──                                             │
│  [设置] [折叠]                                              │
├─────────────────────────────────────────────────────────────┤
│  主区：聊天 | 业务系统 | 各功能页 | 设置                       │
│  聊天顶栏：助手 ⇄ 业务系统 | 新会话 | 智能体浏览器             │
└─────────────────────────────────────────────────────────────┘
```

聊天页通过 **+ 新任务** 或点击历史会话进入；顶栏可在 **灵犀 AI 助手** 与 **业务系统** 之间切换。

### 1. 聊天任务（最常用）

点击 **+ 新任务**，用自然语言描述需求，或点击欢迎页快捷任务卡。推荐在指令中说明渠道、主题、配图来源。

**小红书示例：**

> 帮我发一条小红书，内容关于今日 A 股收盘速读，标题不超过 20 字。请从相关新闻网页抓取配图后发布。

**Remotion 视频示例：**

> 请用 Remotion 做一支 15 秒科技感标题短片：初始化项目、打开 Studio 预览，再渲染成片并告诉我输出路径。

**聊天执行指令（无需进入对应页面）：**

| 格式 | 动作 |
|------|------|
| `执行定时任务：名称` | 匹配并执行定时任务 |
| `执行任务：名称` | 匹配并运行发布计划 |
| `执行流程：名称` | 匹配并运行工作流 |

**执行流程：**

1. Supervisor 路由到对应角色管线（通用 / 发布 / 视频）。
2. Agent 调用 `update_task_list` 列出步骤，在聊天区显示任务清单。
3. 按需调用工具（配图、发布、渲染等）；长耗时操作（如 Remotion 渲染）展示进度条。
4. 右侧 **智能体浏览器** 同步展示浏览器操作；未登录时暂停，扫码后点 **继续**。
5. 非「完全访问」模式下，敏感操作（登录、正式发布、渲染）前会再次确认。

**本地上传图片（可选）：** 点击输入框旁回形针选择本地图片。Agent 可通过 `list_attachments` 读取，配图优先从网页获取。

**配图优先级：** `fetch_web_images` / `imagePaths` → `imageSourceUrl` / `imageUrls` → 用户附件

### 2. 发布工作台

适合 **多渠道、多子任务串行发布** 或 **串联流程** 的场景。

1. 侧栏进入 **发布**。
2. 点击 **新建计划** 或 **导入示例**。
3. 为每个子任务配置渠道、主题、内容说明；或选择串联流程模式。
4. 点击 **运行**：自动创建聊天会话，Agent 按顺序执行。
5. 在主聊天窗口与任务清单中查看进度。

### 3. 流程编排

1. 侧栏进入 **流程**。
2. 新建或编辑可视化工作流（Agent、工具、通知、条件、并行等节点）。
3. 点击 **运行** 立即执行，或由定时任务 / 发布计划触发。

### 4. 定时任务

1. 侧栏进入 **定时任务**。
2. 配置重复规则、执行时间与动作类型：
   - **发布计划**：关联工作台计划
   - **自定义指令**：直接发送 Agent 指令
   - **流程**：关联工作流
3. 主进程每 30 秒轮询调度；可 **立即执行** 手动触发。

### 5. 技能市场与规则

- **技能市场**：浏览、启用/禁用 `resources/skills` 下的领域技能；支持模板安装、链接导入、手动编辑、会话总结为技能。运行时 `use_skill` 按需加载完整技能。
- **规则**：管理 MDC 规则，启用后注入各角色 system prompt。

### 6. 渠道管理

- **发布渠道**：小红书、抖音（启用）；视频号（占位）。
- **通知渠道**：飞书、Webhook（可配置）；微信/QQ（占位）。
- 在 **渠道** 页配置与测试；**设置 → 渠道状态** 可查看登录态并清除。

### 7. 智能体浏览器

- 聊天页顶栏可展开浏览器预览面板，实时显示 Playwright 截帧。
- 登录态保存在 `browser-profile/`。
- 设置页可 **清除全部发布渠道登录态**。

### 8. 权限模式

| 模式 | 行为 |
|------|------|
| 需确认（默认） | 登录、正式发布、Remotion 渲染等敏感操作前暂停 |
| 完全访问 | 跳过部分确认（仍建议人工检查发布结果） |

在 **设置 → 模型与 API** 切换「完全访问」开关。

---

## 本地数据

应用数据位于系统 `userData` 下的 `react-agent-data/`：

| 路径 | 内容 |
|------|------|
| `settings.json` | API Key、多模型连接、角色映射、权限配置 |
| `sessions/` | 聊天会话与消息 |
| `publish-plans/` | 发布计划 |
| `scheduled-tasks/` | 定时任务 |
| `workflows.json` | 流程定义 |
| `workflow-runs.json` | 流程运行记录 |
| `channels.json` | 渠道配置 |
| `skill-states.json` | 技能启用状态 |
| `browser-profile/` | 有头浏览器登录 Cookie |
| `browser-profile-headless/` | 无头抓取专用 Profile |
| `artifacts/` | Agent 通用产出文件 |
| `videos/` | 视频成片与分镜素材 |
| `resources/` | 安装版可写技能/规则副本 |

macOS 典型路径：`~/Library/Application Support/lingxifa/react-agent-data/`

---

## 开发命令

```bash
pnpm dev                    # 开发模式（含 sourcemap 与远程调试端口 9222）
pnpm dev:fast               # 精简开发模式
pnpm dev:inspect            # 主进程 inspect 调试
pnpm build                  # 构建主进程 / preload / 渲染进程
pnpm preview                # 预览构建产物
pnpm test                   # Vitest 单元测试
pnpm typecheck              # TypeScript 类型检查
pnpm install:browser        # 安装 Playwright Chromium（国内镜像）
pnpm install:remotion-browser  # 安装 Remotion 渲染依赖
pnpm pack:mac               # macOS 打包
pnpm pack:win               # Windows 打包
```

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 桌面壳 | Electron 34 |
| 构建 | electron-vite + Vite 6 |
| 前端 | React 19 + Ant Design 5 + Zustand |
| Agent | LangChain + LangGraph（Supervisor 多角色 / 工作流图） |
| 视频 | Remotion 4 + 万相 AI 视频管线 |
| 浏览器自动化 | Playwright（Chromium 持久化上下文） |
| 流程画布 | @xyflow/react |
| 数据 | 本地 JSON 文件（无数据库） |

---

## 文档

| 文档 | 说明 |
|------|------|
| [doc/使用手册.md](doc/使用手册.md) | 安装配置、功能详解、常见问题 |
| [doc/项目架构.md](doc/项目架构.md) | 目录结构、Agent 编排、IPC、扩展指南 |

---

## 常见问题

**未配置 API Key** → 先到设置页保存 Key。

**上传控件找不到 / 填不了标题** → 平台 DOM 可能改版，Agent 会回退到 `browser_snapshot` + 原子工具；也可在右侧浏览器手动补全后点继续。

**浏览器锁冲突** → 重启应用；或设置页清除登录态。

**Remotion 渲染失败** → 确认已执行 `pnpm install:remotion-browser`。

更多问题见 [doc/使用手册.md](doc/使用手册.md#16-常见问题)。

---

## License

Private / 内部项目（以仓库实际许可为准）。
