# Resources Skills and Rules Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将技能与规则统一迁移到无 `.cursor` 中间层的 `resources/skills`、`resources/rules`，开发环境直接读写仓库资源，安装版读写 userData 副本。

**Architecture:** 新增统一资源路径与初始化模块，集中处理开发/打包路径、只复制缺失文件的种子同步和旧规则迁移。技能存储改用统一技能目录；规则存储改为 `.mdc` 文件，并通过纯函数解析/序列化 frontmatter，保留未知字段。

**Tech Stack:** Electron 34、TypeScript 5.8、Node.js `fs`、Vitest、pnpm

## Global Constraints

- 目标目录固定为 `resources/skills` 与 `resources/rules`，不得增加 `.cursor` 中间层。
- 开发环境直接读写仓库 `resources`；打包环境只读内置 resources，读写 userData 副本。
- 内置资源同步不得覆盖用户已有文件。
- API 查询函数继续使用 `query*` 前缀，写操作继续使用 `post*` 前缀。
- 不删除旧 `.cursor` 与旧 `rules.json`。
- 未获得明确授权前不创建 Git commit。

---

### Task 1: 建立资源路径与初始化边界

**Files:**
- Create: `electron/main/store/resources.ts`
- Create: `electron/main/store/resources.test.ts`
- Modify: `electron/main/store/paths.ts`
- Modify: `electron/main/index.ts`
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`

**Interfaces:**
- Produces: `queryBundledResourcesRoot(): string`
- Produces: `queryWritableResourcesRoot(): string`
- Produces: `querySkillsDir(): string`
- Produces: `queryRulesDir(): string`
- Produces: `initializeResources(): void`

- [ ] **Step 1: 安装并配置 Vitest**

Run: `pnpm add -D vitest`

在 `package.json` 增加：

```json
"test": "vitest run"
```

- [ ] **Step 2: 编写路径与幂等复制失败测试**

测试使用临时目录并 mock Electron `app.isPackaged`、`app.getAppPath()` 与 `process.resourcesPath`，断言：

```ts
expect(queryWritableResourcesRoot()).toBe(projectResources)
expect(querySkillsDir()).toBe(join(projectResources, 'skills'))
expect(queryRulesDir()).toBe(join(projectResources, 'rules'))
```

打包模式断言 writable root 位于 `getDataRoot()/resources`；初始化两次后，用户已修改的文件内容保持不变。

- [ ] **Step 3: 运行测试并确认失败**

Run: `pnpm test -- electron/main/store/resources.test.ts`

Expected: FAIL，原因是 `resources.ts` 尚不存在。

- [ ] **Step 4: 实现资源路径与初始化**

`resources.ts` 使用以下规则：

```ts
export function queryBundledResourcesRoot(): string {
  return app.isPackaged
    ? join(process.resourcesPath, 'resources')
    : join(app.getAppPath(), 'resources')
}

export function queryWritableResourcesRoot(): string {
  return app.isPackaged
    ? join(getDataRoot(), 'resources')
    : queryBundledResourcesRoot()
}
```

`initializeResources()` 创建 `skills`、`rules`，打包环境从 bundled root 递归复制缺失文件，已存在目标文件时跳过。`index.ts` 在注册 IPC 前调用初始化。

- [ ] **Step 5: 运行测试**

Run: `pnpm test -- electron/main/store/resources.test.ts`

Expected: PASS。

### Task 2: 迁移技能资源并统一技能数据源

**Files:**
- Create/Copy: `resources/skills/**`
- Modify: `electron/main/store/skills.ts`
- Modify: `electron/main/store/skill-import.ts`
- Modify: `shared/types.ts`
- Test: `electron/main/store/skills.test.ts`

**Interfaces:**
- Consumes: `querySkillsDir()`
- Produces: 现有技能 IPC API，函数签名不变

- [ ] **Step 1: 编写技能目录行为测试**

覆盖 `queryProjectSkills`、`postProjectSkill`、`postDeleteProjectSkill`、`querySkillTemplates`，断言所有读写都发生在 `resources/skills`，错误信息不再包含 `.cursor/skills`。

- [ ] **Step 2: 运行测试并确认失败**

Run: `pnpm test -- electron/main/store/skills.test.ts`

Expected: FAIL，旧实现仍定位 `.cursor/skills` 与 `resources/skill-templates`。

- [ ] **Step 3: 复制并合并技能**

将 `.cursor/skills/**` 复制到 `resources/skills/**`；再合并 `resources/skill-templates/**` 中缺失的技能。遇到同名技能时保留 `.cursor/skills` 版本。

- [ ] **Step 4: 修改技能存储**

删除 `getProjectRoot()` 和 `getSkillTemplatesDir()` 路径探测，`getSkillsDir()` 委托 `querySkillsDir()`。市场查询也扫描统一目录；安装已存在技能时继续返回明确冲突错误。更新注释和 `shared/types.ts` 的来源描述。

- [ ] **Step 5: 运行技能测试**

Run: `pnpm test -- electron/main/store/skills.test.ts`

Expected: PASS。

### Task 3: 将规则 CRUD 改为 resources/rules 下的 MDC 文件

**Files:**
- Create: `electron/main/store/rule-markdown.ts`
- Create: `electron/main/store/rule-markdown.test.ts`
- Modify: `electron/main/store/rules.ts`
- Copy: `resources/rules/ui-demo.mdc`

**Interfaces:**
- Produces: `parseRuleMarkdown(id: string, raw: string, updatedAt: number): ParsedRuleMarkdown`
- Produces: `buildRuleMarkdown(rule: AgentRule, previousRaw?: string): string`
- Consumes: `queryRulesDir()`
- Preserves: `queryAgentRules()`、`postAgentRule()`、`postDeleteAgentRule()` 与 `queryEnabledRulePrompt()` 签名

- [ ] **Step 1: 编写 MDC 解析与序列化测试**

断言以下输入可解析，缺失 name 时回退文件 id，且 `globs` 等未知字段在编辑后保留：

```md
---
alwaysApply: true
globs: ["src/**/*.tsx"]
---

设计UI都要参考技能市场页面
```

- [ ] **Step 2: 运行解析测试并确认失败**

Run: `pnpm test -- electron/main/store/rule-markdown.test.ts`

Expected: FAIL，解析模块尚不存在。

- [ ] **Step 3: 实现 MDC 解析与序列化**

已知字段为 `name`、`description`、`alwaysApply`、`createdAt`、`updatedAt`；正文映射到 `content`。序列化编辑时从原始 frontmatter 删除并重写已知字段，其他行原样保留。

- [ ] **Step 4: 编写规则文件 CRUD 失败测试**

使用临时 `resources/rules`，断言查询扫描 `*.mdc`、保存写入 `<id>.mdc`、删除仅删除目标文件、启用提示只包含 `alwaysApply: true` 的规则。

- [ ] **Step 5: 运行 CRUD 测试并确认失败**

Run: `pnpm test -- electron/main/store/rules.test.ts`

Expected: FAIL，旧实现仍读写 `rules.json`。

- [ ] **Step 6: 实现规则文件 CRUD**

`rules.ts` 改为读取 `queryRulesDir()`；保存前读取旧原文以保留未知 frontmatter；使用安全 id 校验后写入或删除 `.mdc`。

- [ ] **Step 7: 复制内置规则并运行测试**

复制 `.cursor/rules/ui-demo.mdc` 到 `resources/rules/ui-demo.mdc`。

Run: `pnpm test -- electron/main/store/rule-markdown.test.ts electron/main/store/rules.test.ts`

Expected: PASS。

### Task 4: 迁移旧 rules.json

**Files:**
- Modify: `electron/main/store/resources.ts`
- Modify: `electron/main/store/resources.test.ts`

**Interfaces:**
- Consumes: `buildRuleMarkdown()`
- Produces: `postMigrateLegacyRules(): void`

- [ ] **Step 1: 编写旧规则迁移失败测试**

创建包含两条 `AgentRule` 的 `rules.json`，断言迁移生成对应 `.mdc`；同名文件已存在时不覆盖；旧 JSON 仍保留。

- [ ] **Step 2: 运行测试并确认失败**

Run: `pnpm test -- electron/main/store/resources.test.ts`

Expected: FAIL，迁移函数尚不存在。

- [ ] **Step 3: 实现迁移**

初始化资源目录后解析旧 JSON；逐条校验 id 并仅写入缺失的 `.mdc`。解析错误只记录警告，不修改源文件。

- [ ] **Step 4: 运行迁移测试**

Run: `pnpm test -- electron/main/store/resources.test.ts`

Expected: PASS。

### Task 5: 配置资源打包并完成回归验证

**Files:**
- Modify: `package.json`
- Delete: `resources/skill-templates/**`（内容合并完成后）
- Modify: `doc/项目架构.md`

**Interfaces:**
- Produces: Electron Builder `extraResources` 映射到安装包 `resources`

- [ ] **Step 1: 增加打包配置**

在 `package.json` 增加：

```json
"build": {
  "extraResources": [
    {
      "from": "resources",
      "to": "resources"
    }
  ]
}
```

保留现有 `scripts.build`，避免改变当前构建命令语义。

- [ ] **Step 2: 更新架构文档**

将技能来源更新为 `resources/skills`，规则来源更新为 `resources/rules`，说明安装版使用 userData 副本。

- [ ] **Step 3: 运行全部自动验证**

Run:

```bash
pnpm test
pnpm typecheck
pnpm build
```

Expected: 全部退出码为 0，无 TypeScript 错误。

- [ ] **Step 4: 检查旧路径残留**

搜索生产代码中的 `.cursor/skills`、`.cursor/rules`、`resources/skill-templates`、`rules.json`。允许旧数据迁移代码和设计文档出现，其余运行时路径必须清除。

- [ ] **Step 5: 手动验证**

运行 `pnpm dev`，验证技能市场和规则页面可查询、新建、编辑、启停、删除，Agent 提示能读取启用资源。
