---
name: remotion-best-practices
description: >-
  Remotion 最佳实践总览。编写 Composition、字幕、渲染前加载本技能以获取子技能导航。
---

# Remotion 最佳实践

> 来源：[remotion-dev/remotion](https://github.com/remotion-dev/remotion) 官方 Agent Skill，已适配灵犀技能市场。

## 子技能导航（通过 use_skill 加载）

| 技能 id | 何时加载 | 核心内容 |
|---------|----------|---------|
| `react-agent-remotion` | 在灵犀中执行完整 Remotion 工作流（工具对接） | 标准流程、内置工具说明 |
| `remotion-create` | 新建 Remotion 工程与 Composition | 工程初始化、画幅选择、项目结构 |
| `remotion-markup` | 编写 Remotion React 画面与动效 | 动画 API、内置组件库、动画工具函数 |
| `remotion-design-system` | 需要专业视觉设计、配色排版规范时 | 配色系统、排版层级、动效设计原则、质感技巧 |
| `remotion-captions` | 字幕生成与展示 | Caption 数据结构、字幕组件、卡拉OK效果 |
| `remotion-render` | 渲染参数与导出策略 | 渲染前检查、常见问题排查、格式说明 |

## 灵犀内置工具（替代官方 CLI）

官方文档使用 `npx create-video` 与 `npx remotion render`；在灵犀中请使用：

- `remotion_init_project` — 替代 `npx create-video --blank`
- `write_file` — 编辑 `src/Composition.tsx`、`src/Root.tsx`
- `remotion_studio` — 替代 `npx remotion studio`（本地预览）
- `remotion_render` — 替代 `npx remotion render`

## 通用原则

### 编码规范
- React 代码是视频的唯一真实来源（Source of Truth）
- 用 `useCurrentFrame()` + `interpolate()` 做动画，禁止 CSS transition/animation
- 用 `<Sequence>` 控制时间轴片段
- 资源放 `public/`，用 `staticFile()` 引用
- 渲染前确认 `compositionId` 与 `Root.tsx` 一致

### 设计原则（加载 remotion-design-system 获取完整规范）
- **一屏一焦点**：每帧只有一个视觉重心
- **动效有目的**：揭示 / 聚焦 / 连续，不为动而动
- **克制即高级**：留白、简洁、层次分明
- **一致性**：配色、字号、动效节奏保持统一

### Starter 模板内置能力
灵犀内置的 Starter 模板已预装完整开发工具链：

```
src/
├── theme/              # 设计系统
│   ├── colors.ts       # 3 套配色 + 渐变预设
│   └── typography.ts   # 字号层级 + 间距系统
├── lib/                # 工具函数库
│   ├── easings.ts      # 缓动曲线 + Spring 预设
│   └── animations.ts   # 10+ 动画 Hook（淡入/滑入/错落/呼吸/打字机...）
├── components/         # 可复用组件
│   ├── AnimatedText.tsx  # 逐字错落动画文字
│   ├── TitleCard.tsx     # 标题卡片（带装饰线）
│   ├── BarChart.tsx      # 柱状图数据可视化
│   └── Subtitles.tsx     # 字幕 + 卡拉OK高亮
├── Composition.tsx     # 默认示例（展示完整能力）
├── Root.tsx            # Composition 注册入口
└── index.ts            # registerRoot 入口
```

初始化工程后可直接 import 使用，无需从零编写。

## 文档

- 官方文档：https://www.remotion.dev/docs
- API 参考：https://www.remotion.dev/api
- 许可证：https://www.remotion.dev/docs/license
