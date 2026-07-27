---
name: react-agent-xhs-publish
description: >-
  React Agent 小红书图文发布：xhs_publish_note 工具、fetch_web_images 配图、
  发布工作台串行执行、登录暂停与发布确认。在 react-agent 中修改小红书发布逻辑、
  配图来源策略或创作台 DOM 适配时使用。
---

# 小红书发布

## 核心文件

| 文件 | 职责 |
|------|------|
| `electron/main/agent/tools/xhs-tools.ts` | `fetch_web_images`、`xhs_publish_note` 工具定义 |
| `electron/main/browser/xhs-publish.ts` | 发布流程编排（拟人操作） |
| `electron/main/browser/xhs-content-rewrite.ts` | 离线同义词 / 口语化改写 |
| `electron/main/store/xhs-behavior-guard.ts` | 时段、频次、无人值守拦截 |
| `electron/main/browser/browser-stealth.ts` | 有头随机分辨率、webdriver/cdc_ 抹除、chrome 对象补齐 |
| `src/features/publish/` | 发布工作台 UI + 计划串行执行 |
| `src/features/publish/types.ts` | `buildSubTaskPrompt` 生成 Agent 指令 |

## 配图优先级（强制）

1. `imagePaths`（通常来自 `fetch_web_images`）
2. `imageSourceUrl` / `imageUrls`（工具内自动下载）
3. 用户本轮附件 `ctx.attachmentPaths`（**可选**）

缺图时返回明确提示，**不要**默认要求用户上传。

## 发布流程（xhs-publish.ts）

1. `xhs-behavior-guard`：发布时段（8:00～23:00，0:00～6:00 禁止）、日/周上限、禁止 `[定时]`/`[流程]` 会话拟人发文
2. `xhs-tools`：本地 `queryRewriteXhsPublishCopy` 后再截断字数
3. 打开小红书首页 → 随机滚动闲逛 → 再进创作台对应 `target`
4. 检测登录 → 未登录 `emitAwaitUser` 等人扫码
5. 图文逐张上传（张间高斯等待，全部完成后额外静置）
6. 逐字输入标题/正文 → 二次轻量滚动
7. 滚到底部发布栏 → `dwellBeforeXhsPublish` → 发布
8. 结束缓冲后 **关闭有头浏览器**（`autoPublish=false` 保留窗口供人工点发布）

**DOM 改版**：优先 `humanClickText` 多文案 fallback；实在不行 `browser_snapshot` + 原子工具。
**拟人**：禁止瞬间滚到底后立刻点发布；与抖音一致需「滚到底 → 停留确认 → 再发布」。

## Agent 工具参数

### fetch_web_images

- `pageUrl` — 来源页，自动挑大图
- `imageUrls` — 直链列表
- `maxCount` — 默认 3，最大 9
- 返回本地绝对路径，交给 `xhs_publish_note.imagePaths`

### xhs_publish_note

- `title`、`content` — 必填
- `publishType` — `image` | `video` | `article` | `audio`（先判断再传）
- `imagePaths` / `imageSourceUrl` / `imageUrls` — 图文配图
- `videoPaths` — 视频本地路径
- `audioPaths` — 播客音频路径
- `autoPublish` — 是否自动点发布
- `permission: 'dangerous'`

## 发布工作台串行执行

`PublishWorkbench.runPlan`：

```typescript
const prompt = [
  `请按顺序串行执行以下 ${plan.subTasks.length} 个小红书发布子任务...`,
  ...plan.subTasks.map((s, i) => `\n### 子任务 ${i + 1}\n${buildSubTaskPrompt(s)}`),
  '\n每完成一个子任务更新任务清单...'
].join('\n')
await sendMessage(prompt)  // 跳转主聊天
```

`buildSubTaskPrompt` 已内置配图与 `xhs_publish_note` 指引。

## 权限模式

| 设置 | 行为 |
|------|------|
| 需确认（默认） | 登录、正式发布前暂停 |
| 完全访问 | 跳过部分确认 |

## 常见问题

| 问题 | 方向 |
|------|------|
| 未配置 API Key | 设置页保存 DashScope Key |
| 找不到上传控件 | DOM 改版，加 selector fallback 或 browser_* 排查 |
| browser closed | 见 [react-agent-browser](../react-agent-browser/SKILL.md) Profile 锁 |

## 验证

```bash
pnpm typecheck
pnpm dev
# 聊天：「帮我发一条小红书…请从新闻网页抓配图」
# 或发布工作台 → 导入示例 → 运行
```

## 沉淀

DOM selector / 发布步骤变更写入 [examples.md](examples.md)。
