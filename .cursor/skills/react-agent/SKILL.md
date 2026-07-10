---
name: react-agent
description: >-
  React Agent 跨平台桌面 AI Agent 项目（Electron + React + Playwright + 阿里云百炼）。
  在 react-agent 仓库开发、修 bug、加功能、调 Agent 工具或浏览器自动化时使用。
  根据任务类型加载对应子 skill，避免重复探索代码库。
---

# React Agent 项目技能

## 项目概览

- **首期能力**：小红书图文自动发布
- **模型**：阿里云百炼 DashScope OpenAI 兼容接口
- **数据**：本机 JSON 缓存（`userData/react-agent-data/`），无数据库
- **架构**：单一 ReAct 循环 + 工具注册表 + Playwright 持久化浏览器

## 技能路由

| 任务类型 | 加载 Skill |
|----------|------------|
| 前端 UI / features / CRUD / IPC 渲染层 | [react-agent-feature-dev](../react-agent-feature-dev/SKILL.md) |
| 新增/修改 Agent 工具、SYSTEM_PROMPT、ReAct 循环 | [react-agent-agent-tools](../react-agent-agent-tools/SKILL.md) |
| Playwright 安装加速、Profile 锁、拟人输入、浏览器服务 | [react-agent-browser](../react-agent-browser/SKILL.md) |
| 小红书发布流程、配图策略、xhs 工具 | [react-agent-xhs-publish](../react-agent-xhs-publish/SKILL.md) |
| 热点搜索 → 抓配图 → 小红书发布（端到端） | [react-agent-xhs-hot-topic](../react-agent-xhs-hot-topic/SKILL.md) |

**规则**：先读路由表，只加载 1 个最相关的子 skill，不要一次读全部。

## 目录地图

```
shared/types.ts              # 主/渲染进程共享 DTO
src/features/                # chat | publish | settings | browser
src/stores/app-store.ts      # 仅 view 导航
electron/main/
  agent/loop.ts              # ReAct 循环 + SYSTEM_PROMPT
  agent/tools/               # 工具注册表
  browser/                   # Playwright 服务 + xhs 发布
  store/                     # settings/sessions/plans JSON
  ipc.ts                     # IPC handler
electron/preload/index.ts    # window.api 暴露
scripts/install-browser.mjs  # Playwright 国内加速
doc/                         # 文档一律放此目录
```

## 开发命令

```bash
pnpm install && pnpm install:browser   # 首次
pnpm dev                               # 开发
pnpm typecheck                         # 必跑验证
pnpm build                             # 打包
```

Node ≥ 20，包管理用 **pnpm**。

## 全局约束

1. API 函数：`query*` 读、`post*` 写/删
2. UI：Ant Design + CSS Modules
3. 注释：中文 JSDoc，说明「为什么」
4. 文档：放 `doc/`，不随意改 README
5. 最小改动，不顺手重构

## 任务完成后沉淀

成功实现可复用模式后，更新对应子 skill 的 `SKILL.md` 或 `examples.md`（见各子 skill 末尾章节）。
