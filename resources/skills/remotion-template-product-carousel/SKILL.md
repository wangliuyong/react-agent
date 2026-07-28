---
name: 新品卖点轮播
description: >-
  Remotion 产品模版：三卖点卡片切换 + 价格锚点动效。
  用户要做电商/新品卖点短视频时加载本技能。
remotionVideoTemplate: true
category: product
compositionId: ProductCarousel
accent: "#3d9a8b"
durationSec: 36
status: ready
---

# 新品卖点轮播（Remotion 模版）

## 适用场景

- 电商新品卖点轮播
- 价格锚点与三卡片切换动效

## 标准流程

1. 加载 `react-agent-remotion`、`remotion-design-system`
2. `remotion_init_project`：`compositionId=ProductCarousel`
3. 编写卖点卡片与价格锚点 Composition
4. `remotion_studio` → `remotion_render`

## Composition 约定

| 字段 | 值 |
|------|-----|
| compositionId | `ProductCarousel` |
| 建议时长 | 36s |
