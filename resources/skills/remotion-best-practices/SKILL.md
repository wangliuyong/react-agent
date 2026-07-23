---
name: remotion-best-practices
description: >-
  Remotion 最佳实践总览。编写 Composition、字幕、渲染前加载本技能以获取子技能导航。
---

# Remotion 最佳实践

> 来源：[remotion-dev/remotion](https://github.com/remotion-dev/remotion) 官方 Agent Skill，已适配灵犀技能市场。

## 子技能导航（通过 use_skill 加载）

| 技能 id | 何时加载 |
|---------|----------|
| `react-agent-remotion` | 在灵犀中执行完整 Remotion 工作流（工具对接） |
| `remotion-create` | 新建 Remotion 工程与 Composition |
| `remotion-markup` | 编写 Remotion React 画面与动效 |
| `remotion-captions` | 字幕生成与展示 |
| `remotion-render` | 渲染参数与导出策略 |

## 灵犀内置工具（替代官方 CLI）

官方文档使用 `npx create-video` 与 `npx remotion render`；在灵犀中请使用：

- `remotion_init_project` — 替代 `npx create-video --blank`
- `write_file` — 编辑 `src/Composition.tsx`、`src/Root.tsx`
- `remotion_studio` — 替代 `npx remotion studio`（本地预览）
- `remotion_render` — 替代 `npx remotion render`

## 通用原则

- React 代码是视频的唯一真实来源（Source of Truth）
- 用 `useCurrentFrame()` + `interpolate()` 做动画，禁止 CSS transition/animation
- 用 `<Sequence>` 控制时间轴片段
- 资源放 `public/`，用 `staticFile()` 引用
- 渲染前确认 `compositionId` 与 `Root.tsx` 一致

## 文档

- 官方文档：https://www.remotion.dev/docs
- API 参考：https://www.remotion.dev/api
- 许可证：https://www.remotion.dev/docs/license
