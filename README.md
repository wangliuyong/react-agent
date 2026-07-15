# 灵犀

跨平台 AI 发布助手桌面应用（Electron + React + Ant Design）。

灵犀通过大模型驱动的 ReAct Agent，自动完成内容创作、网页配图抓取，以及小红书 / 抖音图文发布。所有数据保存在本机，无需数据库。

## 核心能力

| 能力 | 说明 |
|------|------|
| 智能对话 | 自然语言描述任务，Agent 自动拆解步骤并调用工具执行 |
| 小红书发布 | 自动打开创作台、填写标题正文、上传配图、提交发布 |
| 抖音发布 | 创作者中心图文笔记发布（当前仅图文，视频后续支持） |
| 网页配图 | 从新闻/资讯页抓取配图，自动下载到本地后上传 |
| 发布工作台 | 多子任务发布计划，一键串行执行多渠道发布 |
| 定时任务 | 按日/周/单次定时触发发布计划或自定义指令 |
| 项目技能 | 管理 `.cursor/skills` 领域知识，注入 Agent 系统提示 |
| 智能体浏览器 | Playwright 有头浏览器 + 右侧实时截帧预览，支持登录态复用 |

**模型**：默认对接阿里云百炼（DashScope）OpenAI 兼容接口，支持通义千问、DeepSeek、GLM、Kimi 等模型。

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
pnpm install:browser   # 国内镜像加速下载 Playwright Chromium
pnpm dev
```

`pnpm install:browser` 默认经 npmmirror 加速。若镜像异常，改用官方源：

```bash
pnpm install:browser:official
```

### 首次配置

1. 打开 [阿里云百炼控制台](https://bailian.console.aliyun.com/) 创建 API Key。
2. 启动应用后，侧栏进入 **设置**。
3. 填写 **DASHSCOPE API Key**、**Base URL**（默认 `https://dashscope.aliyuncs.com/compatible-mode/v1`）、**模型**（默认 `qwen-plus`）。
4. 点击保存。

> API Key 仅保存在本机 `userData/react-agent-data/settings.json`，不会提交到 git。

---

## 使用说明

### 界面概览

```
┌─────────────────────────────────────────────────────────────┐
│  侧栏                    │  主内容区                          │
│  ─────                   │                                    │
│  + 新任务                │  聊天 / 发布 / 定时 / 技能 / 设置   │
│  历史对话                │                                    │
│  ─────                   │  （聊天页右侧可展开智能体浏览器）    │
│  发布                    │                                    │
│  定时                    │                                    │
│  技能                    │                                    │
│  设置                    │                                    │
└─────────────────────────────────────────────────────────────┘
```

### 1. 聊天发布（最常用）

点击 **+ 新任务**，用自然语言描述需求。推荐在指令中说明渠道、主题、配图来源。

**小红书示例：**

> 帮我发一条小红书，内容关于今日 A 股收盘速读，标题不超过 20 字。请从相关新闻网页抓取配图后发布。

**抖音示例：**

> 把下面内容发到抖音图文：标题「周末露营攻略」，正文写 3 条实用建议，配图从这篇攻略网页抓取。

**执行流程：**

1. Agent 调用 `update_task_list` 列出任务步骤，在聊天区显示任务清单。
2. 调用 `fetch_web_images` 从来源页下载配图（也可在发布工具中传 `imageSourceUrl`）。
3. 生成标题与正文（小红书标题建议 ≤20 字，抖音 ≤30 字）。
4. 调用 `xhs_publish_note` 或 `douyin_publish_note` 打开发布页并自动填写。
5. 右侧 **智能体浏览器** 同步展示操作过程；未登录时暂停，扫码后点 **继续**。
6. 非「完全访问」模式下，正式发布前会再次确认。

**本地上传图片（可选）：**

点击输入框旁回形针，选择本地图片作为附件。Agent 可通过 `list_attachments` 读取，但配图优先从网页获取。

**配图优先级：**

1. `fetch_web_images` / `imagePaths` 下载的本地文件
2. `imageSourceUrl` / `imageUrls`（工具内自动下载）
3. 用户本轮上传的附件

### 2. 发布工作台

适合需要 **多渠道、多子任务串行发布** 的场景。

1. 侧栏进入 **发布**。
2. 点击 **新建计划** 或 **导入示例**（含小红书 + 抖音双渠道示例子任务）。
3. 为每个子任务配置：
   - **渠道**：小红书 / 抖音
   - **主题**：内容标签
   - **内容说明**：给 Agent 的创作指令
   - **自动发布**：关闭时 Agent 填完表单后等人确认
4. 点击 **运行**：自动创建聊天会话，Agent **按顺序**执行各子任务。
5. 在主聊天窗口与任务清单中查看进度。

### 3. 定时任务

1. 侧栏进入 **定时**。
2. 点击 **新建任务**，配置：
   - **重复规则**：单次 / 每天 / 每周
   - **执行时间**：具体时刻或星期几
   - **动作类型**：
     - **发布计划**：关联工作台中的计划，到点自动串行发布
     - **自定义指令**：直接发送一段 Agent 指令
3. 保存后由主进程调度器每 30 秒轮询，到点自动创建会话并执行。
4. 可点击 **立即执行** 手动触发；执行记录会关联到对应聊天会话。

### 4. 项目技能

1. 侧栏进入 **技能**。
2. 浏览、启用/禁用 `.cursor/skills` 下的领域技能（如小红书发布规范、浏览器调试指南）。
3. 支持 **从模板安装**、**从链接导入**、**手动新建/编辑**。
4. 已启用的技能内容会注入 Agent 系统提示，影响工具选择与执行策略。

### 5. 智能体浏览器

- 聊天页右侧可展开浏览器预览面板，实时显示 Playwright 截帧。
- 登录态保存在 `browser-profile/`，下次无需重复扫码。
- 设置页可 **清除小红书登录态**（删除 Profile 目录）。
- 若提示「正在现有的浏览器会话中打开」或 `browser has been closed`，重启 `pnpm dev` 后重试；仍失败则清除登录态。

### 6. 权限模式

| 模式 | 行为 |
|------|------|
| 需确认（默认） | 登录、正式发布等敏感操作前暂停，等人点击「继续」 |
| 完全访问 | 跳过部分确认（仍建议人工检查发布结果） |

在 **设置** 页切换「完全访问」开关。

---

## 本地数据

应用数据位于系统 `userData` 下的 `react-agent-data/`：

| 路径 | 内容 |
|------|------|
| `settings.json` | API Key、模型、权限配置 |
| `sessions/` | 聊天会话与消息 |
| `publish-plans/` | 发布计划 |
| `scheduled-tasks/` | 定时任务 |
| `browser-profile/` | 浏览器登录 Cookie（Playwright Profile） |
| `artifacts/` | Agent 写入的本地文件 |

macOS 典型路径：`~/Library/Application Support/lingxifa/react-agent-data/`

---

## 开发命令

```bash
pnpm dev              # 开发模式（含 sourcemap 与远程调试端口 9222）
pnpm dev:fast         # 精简开发模式
pnpm dev:inspect      # 主进程 inspect 调试
pnpm build            # 构建主进程 / preload / 渲染进程
pnpm preview          # 预览构建产物
pnpm typecheck        # TypeScript 类型检查
pnpm install:browser  # 安装 Playwright Chromium（国内镜像）
```

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 桌面壳 | Electron 34 |
| 构建 | electron-vite + Vite 6 |
| 前端 | React 19 + Ant Design 5 + Zustand |
| Agent | LangChain + LangGraph（Supervisor 多角色 / 工作流图） |
| 浏览器自动化 | Playwright（Chromium 持久化上下文） |
| 数据 | 本地 JSON 文件（无数据库） |

---

## 文档

| 文档 | 说明 |
|------|------|
| [doc/使用手册.md](doc/使用手册.md) | 安装配置、发布流程、常见问题 |
| [doc/项目架构.md](doc/项目架构.md) | 目录结构、Agent 循环、IPC、扩展指南 |

---

## 常见问题

**未配置 API Key** → 先到设置页保存 Key。

**上传控件找不到 / 填不了标题** → 平台 DOM 可能改版，Agent 会回退到 `browser_snapshot` + 原子工具；也可在右侧浏览器手动补全后点继续。

**浏览器锁冲突** → 重启应用；或设置页清除登录态。

**Chromium 弹窗和右侧预览同时出现** → 当前为有头 Playwright 便于登录调试，右侧同步截帧，属预期行为。

更多问题见 [doc/使用手册.md](doc/使用手册.md#8-常见问题)。

---

## License

Private / 内部项目（以仓库实际许可为准）。
