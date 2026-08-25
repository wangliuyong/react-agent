/**
 * 扫描 resources/workflows-api 下的 ComfyUI API 工作流 JSON。
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'fs'
import { basename, join, relative } from 'path'
import type { ComfyWorkflowMeta } from '../../../shared/ai-video'
import { queryBundledResourcesRoot } from '../store/resources'

/** workflows-api 根目录 */
export function queryWorkflowsApiRoot(): string {
  return join(queryBundledResourcesRoot(), 'workflows-api')
}

const CATEGORIES = ['blueprints', 'templates', 'user'] as const

function walkJsonFiles(dir: string, acc: string[]): void {
  if (!existsSync(dir)) return
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      walkJsonFiles(full, acc)
      continue
    }
    if (entry.isFile() && entry.name.endsWith('.json')) {
      acc.push(full)
    }
  }
}

/** 列举全部 API 工作流元数据 */
export function queryComfyWorkflows(): ComfyWorkflowMeta[] {
  const root = queryWorkflowsApiRoot()
  if (!existsSync(root)) return []

  const list: ComfyWorkflowMeta[] = []
  for (const category of CATEGORIES) {
    const dir = join(root, category)
    if (!existsSync(dir)) continue
    const files: string[] = []
    walkJsonFiles(dir, files)
    for (const full of files) {
      const relativePath = relative(root, full).replace(/\\/g, '/')
      const name = basename(full, '.json')
      list.push({
        id: relativePath,
        name,
        category,
        relativePath
      })
    }
  }
  return list.sort((a, b) => a.relativePath.localeCompare(b.relativePath, 'zh-CN'))
}

/**
 * 读取 API 工作流 JSON，返回可提交的 prompt 对象。
 * 兼容外层包一层 `{ prompt: {...} }` 或直接是节点 map。
 */
export function queryLoadComfyWorkflowPrompt(
  relativePath: string
): Record<string, unknown> {
  const root = queryWorkflowsApiRoot()
  const full = join(root, relativePath)
  if (!existsSync(full) || !statSync(full).isFile()) {
    throw new Error(`工作流不存在：${relativePath}`)
  }
  const raw = JSON.parse(readFileSync(full, 'utf-8')) as unknown
  if (!raw || typeof raw !== 'object') {
    throw new Error(`工作流 JSON 无效：${relativePath}`)
  }
  const obj = raw as Record<string, unknown>
  if (obj.prompt && typeof obj.prompt === 'object') {
    return structuredClone(obj.prompt) as Record<string, unknown>
  }
  // 直接是节点 map
  return structuredClone(obj) as Record<string, unknown>
}
