---
name: 活动倒计时通用模板
description: >-
  Remotion 通用模版：可配置截止日期与主副标题的活动倒计时。
  用户要做促销/活动倒计时时加载。
remotionVideoTemplate: true
category: other
compositionId: EventCountdown
accent: "#c45c8a"
durationSec: 10
status: ready
---

# 活动倒计时通用模板（Remotion 模版）

## 适用场景

- 促销 / 发布会倒计时短片
- 主副标题 + 可配置截止日期

## 标准流程

1. 加载 `react-agent-remotion`
2. `remotion_init_project`：`compositionId=EventCountdown`，短时长约 10s
3. 编写倒计时数字与标题动效
4. `remotion_studio` → `remotion_render`

## Composition 约定

| 字段 | 值 |
|------|-----|
| compositionId | `EventCountdown` |
| 建议时长 | 10s |
