# 设置页必填字段 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让设置页的 Base URL 与模型在保存前完成必填校验。

**Architecture:** 将两项 Ant Design 表单规则放在设置 feature 内的纯配置模块中，页面直接消费规则，测试不依赖 DOM。持久化层保持不变。

**Tech Stack:** React 19、TypeScript、Ant Design 5、Vitest

## Global Constraints

- 仅做设置表单校验，不修改主进程持久化逻辑。
- 使用 Ant Design 官方 `Form.Item.rules` API。
- 错误提示分别为“请填写 Base URL”和“请选择模型”。

---

### Task 1: Base URL 与模型必填校验

**Files:**
- Create: `src/features/settings/components/SettingsPage/settingsValidation.ts`
- Create: `src/features/settings/components/SettingsPage/settingsValidation.test.ts`
- Modify: `src/features/settings/components/SettingsPage/SettingsPage.tsx:1-67`

**Interfaces:**
- Produces: `BASE_URL_RULES` 与 `MODEL_RULES`，均为只读 Ant Design `Rule[]`。
- Consumes: `SettingsPage` 将规则传给对应 `Form.Item`。

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest'
import { BASE_URL_RULES, MODEL_RULES } from './settingsValidation'

describe('设置页必填校验', () => {
  it('要求填写 Base URL', () => {
    expect(BASE_URL_RULES).toContainEqual({
      required: true,
      message: '请填写 Base URL'
    })
  })

  it('要求选择模型', () => {
    expect(MODEL_RULES).toContainEqual({
      required: true,
      message: '请选择模型'
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/features/settings/components/SettingsPage/settingsValidation.test.ts`

Expected: FAIL，因为 `settingsValidation` 模块尚不存在。

- [ ] **Step 3: Write minimal implementation**

在 `settingsValidation.ts` 中导出两个只读规则数组：

```ts
import type { Rule } from 'antd/es/form'

export const BASE_URL_RULES = [
  { required: true, message: '请填写 Base URL' }
] satisfies readonly Rule[]

export const MODEL_RULES = [
  { required: true, message: '请选择模型' }
] satisfies readonly Rule[]
```

在 `SettingsPage.tsx` 导入规则，并分别传给 Base URL 与模型的 `Form.Item`：

```tsx
<Form.Item label="Base URL" name="baseUrl" rules={BASE_URL_RULES}>
  <Input placeholder="https://dashscope.aliyuncs.com/compatible-mode/v1" />
</Form.Item>
<Form.Item label="模型" name="model" rules={MODEL_RULES}>
```

- [ ] **Step 4: Run verification**

Run: `pnpm test src/features/settings/components/SettingsPage/settingsValidation.test.ts && pnpm typecheck`

Expected: 测试通过，两个 TypeScript 项目均无错误。
