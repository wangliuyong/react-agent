import { app } from 'electron'
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync
} from 'fs'
import { join } from 'path'
import type { AgentRule } from '../../../shared/types'
import { getDataRoot } from './paths'
import { buildRuleMarkdown } from './rule-markdown'

/** 开发期资源位于仓库，安装版资源由 electron-builder 放到 resourcesPath。 */
export function queryBundledResourcesRoot(): string {
  return app.isPackaged ? join(process.resourcesPath, 'resources') : join(app.getAppPath(), 'resources')
}

/**
 * 开发环境直接维护仓库资源；安装版必须写入 userData，避免修改只读 App Bundle。
 */
export function queryWritableResourcesRoot(): string {
  return app.isPackaged ? join(getDataRoot(), 'resources') : queryBundledResourcesRoot()
}

export function querySkillsDir(): string {
  return join(queryWritableResourcesRoot(), 'skills')
}

export function queryRulesDir(): string {
  return join(queryWritableResourcesRoot(), 'rules')
}

/**
 * 只复制目标目录中缺失的种子文件。
 * 版本升级时绝不覆盖用户已编辑内容，目录初始化因此可安全重复执行。
 */
function copyMissingEntries(sourceDir: string, targetDir: string): void {
  if (!existsSync(sourceDir)) return
  mkdirSync(targetDir, { recursive: true })

  for (const entry of readdirSync(sourceDir, { withFileTypes: true })) {
    const sourcePath = join(sourceDir, entry.name)
    const targetPath = join(targetDir, entry.name)
    if (entry.isDirectory()) {
      copyMissingEntries(sourcePath, targetPath)
      continue
    }
    if (entry.isFile() && !existsSync(targetPath)) {
      copyFileSync(sourcePath, targetPath)
    }
  }
}

/**
 * 将旧版 JSON 规则一次性补入 resources/rules。
 * 迁移只写缺失文件并保留源 JSON，确保失败或回滚时不会丢失用户数据。
 */
export function postMigrateLegacyRules(): void {
  const legacyPath = join(getDataRoot(), 'rules.json')
  if (!existsSync(legacyPath)) return

  try {
    const parsed = JSON.parse(readFileSync(legacyPath, 'utf-8')) as unknown
    if (!Array.isArray(parsed)) throw new Error('rules.json 格式无效')

    const rulesDir = queryRulesDir()
    mkdirSync(rulesDir, { recursive: true })
    for (const item of parsed) {
      if (!item || typeof item !== 'object') continue
      const raw = item as Partial<AgentRule>
      const id = typeof raw.id === 'string' ? raw.id.trim() : ''
      if (!/^[a-z0-9_-]{1,64}$/.test(id)) continue

      const targetPath = join(rulesDir, `${id}.mdc`)
      if (existsSync(targetPath)) continue

      const now = Date.now()
      const rule: AgentRule = {
        id,
        name: typeof raw.name === 'string' && raw.name.trim() ? raw.name.trim() : id,
        description: typeof raw.description === 'string' ? raw.description.trim() : '',
        content: typeof raw.content === 'string' ? raw.content.trim() : '',
        enabled: Boolean(raw.enabled),
        createdAt: typeof raw.createdAt === 'number' ? raw.createdAt : now,
        updatedAt: typeof raw.updatedAt === 'number' ? raw.updatedAt : now
      }
      if (!rule.content) continue
      writeFileSync(targetPath, buildRuleMarkdown(rule), 'utf-8')
    }
  } catch (error) {
    // 旧文件必须原样保留；迁移失败仅告警，不阻断应用启动。
    console.warn(`[resources] 旧规则迁移失败：${legacyPath}`, error)
  }
}

/** 在 IPC 注册前准备技能与规则目录。 */
export function initializeResources(): void {
  const writableRoot = queryWritableResourcesRoot()
  mkdirSync(join(writableRoot, 'skills'), { recursive: true })
  mkdirSync(join(writableRoot, 'rules'), { recursive: true })

  if (app.isPackaged) {
    const bundledRoot = queryBundledResourcesRoot()
    copyMissingEntries(join(bundledRoot, 'skills'), join(writableRoot, 'skills'))
    copyMissingEntries(join(bundledRoot, 'rules'), join(writableRoot, 'rules'))
  }

  postMigrateLegacyRules()
}
