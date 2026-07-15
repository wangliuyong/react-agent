# Resources 技能与规则统一存储设计

> 日期：2026-07-15  
> 状态：已确认  

> 相关：`resources/`、`.cursor/skills/`、`.cursor/rules/`、`electron/main/store/skills.ts`、`electron/main/store/rules.ts`

## 背景与目标

当前技能与规则的数据源不一致：

- 项目技能直接读写 `.cursor/skills`
- 技能市场模板读取 `resources/skill-templates`
- 规则维护读写 `userData/react-agent-data/rules.json`
- `.cursor/rules` 尚未接入应用

本次将仓库 `.cursor` 中的技能与规则分别复制到 `resources/skills`、`resources/rules`，目标目录不保留 `.cursor` 中间层，并让技能市场、技能维护、规则维护及 Agent 提示注入统一基于 `resources` 目录结构。

## 方案选择

采用“开发环境直接维护 resources，安装版使用 userData 可写副本”的组合方案。

其他方案不采用：

1. 所有环境直接写 `resources`：安装版可能位于只读 App Bundle，且升级会覆盖用户修改。
2. 所有环境只写 `userData`：无法方便地在开发期维护和提交内置技能、规则。

## 目录结构

仓库内置资源：

```text
resources/
├── skills/
│   └── <skill-id>/
│       ├── SKILL.md
│       └── examples.md
└── rules/
    └── <rule-id>.mdc
```

安装版运行时资源：

```text
userData/react-agent-data/
└── resources/
    ├── skills/
    └── rules/
```

原有 `resources/skill-templates` 合并到 `resources/skills`，避免同一技能存在两套模板目录。

## 路径策略

新增统一资源路径解析：

- 开发环境：读写 `<projectRoot>/resources`
- 打包环境内置源：读取 `process.resourcesPath/resources`
- 打包环境可写目录：读写 `<getDataRoot()>/resources`

业务存储模块不再自行通过 `process.cwd()` 推测项目 `.cursor` 位置，而是依赖统一的 resources 路径函数。

## 初始化与迁移

### 仓库迁移

1. 复制 `.cursor/skills` 到 `resources/skills`
2. 复制 `.cursor/rules` 到 `resources/rules`
3. 将 `resources/skill-templates` 中不存在的技能合并到新技能目录
4. 去重同名技能，以 `.cursor/skills` 中的现有内容为准

### 安装版初始化

首次启动时：

1. 创建 `userData/react-agent-data/resources/skills` 与 `userData/react-agent-data/resources/rules`
2. 从打包内置资源复制技能与规则
3. 后续 CRUD 仅操作 userData 副本

初始化必须幂等：目标文件已存在时不覆盖，避免升级或重启破坏用户修改。

### 旧规则迁移

现有 `rules.json` 转换为 `.mdc`：

- `id` 作为文件名
- `name`、`description`、`enabled` 写入 frontmatter
- `enabled` 映射为 `alwaysApply`
- `content` 写入 Markdown 正文
- 已存在同名 `.mdc` 时不覆盖

迁移成功后保留旧 JSON 文件，避免不可逆数据丢失；新代码不再写入该文件。

## 技能市场与技能维护

统一技能数据源为 `resources/skills`：

- 技能市场展示资源目录中的全部技能
- 技能详情、创建、编辑、删除均操作当前环境的可写资源目录
- 技能启用状态继续保存在 `skill-states.json`
- Agent 提示注入从统一技能目录读取已启用技能

本期不再区分“市场模板”和“项目技能”两套实体，现有页面交互可保留，但底层使用同一个目录。

## 规则维护

规则页面改为扫描 `resources/rules/*.mdc`：

- 查询时解析 frontmatter 与 Markdown 正文
- 新建、编辑时序列化为 `.mdc`
- 删除时删除对应文件
- 启停通过 `alwaysApply` 字段持久化
- 保留不认识的 frontmatter 字段，避免破坏 Cursor 原生规则

Agent 提示注入改为读取启用的 `.mdc` 规则，不再读取 `rules.json`。

## 打包

Electron Builder 配置需显式将仓库 `resources` 复制到应用的 `process.resourcesPath/resources`，不依赖默认文件匹配规则。

打包后的内置资源只读，所有用户修改写入 userData 副本。

## 错误处理

- 内置资源不存在：创建空的可写目录，记录告警但不阻止应用启动
- 单个技能或规则解析失败：跳过该项并记录具体文件路径
- 初始化复制失败：保留原始错误并让技能/规则页面显示加载失败
- 规则迁移失败：不删除或修改旧 `rules.json`

## 测试与验证

至少覆盖：

1. 开发环境与打包环境路径解析
2. 首次资源复制及重复执行幂等性
3. 现有文件不会被内置资源覆盖
4. 技能目录扫描、详情、保存、删除与启用状态
5. `.mdc` 解析、序列化及未知 frontmatter 保留
6. `rules.json` 到 `.mdc` 的无损迁移
7. Agent 提示能读取启用规则和技能
8. `pnpm typecheck`
9. 开发环境手动验证技能市场和规则维护 CRUD
10. 打包后验证内置资源可读、userData 副本可写

## 不在本期范围

- 云端技能市场或远程资源同步
- 多工作区资源隔离
- 内置资源版本冲突合并界面
- 删除旧 `.cursor` 源目录
- 自动删除旧 `rules.json`
