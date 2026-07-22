import { existsSync, readdirSync, readFileSync } from 'fs'
import { join } from 'path'
import type {
  AgentToolCatalog,
  AgentToolCatalogItem,
  AgentToolPermission,
  AgentToolSourceLocation
} from '../../../../shared/types'
import { queryRoleToolInjections } from '../graph/role-tools'
import { getAllTools } from './index'

/** 不参与工具定义扫描的辅助文件 */
const SKIP_FILES = new Set(['index.ts', 'types.ts', 'catalog.ts', 'langchain-adapter.ts'])

/** 解析 tools 源码目录：开发期用仓库路径，打包后走 app 内同源相对路径 */
function queryToolsSourceDir(): string {
  const cwdCandidate = join(process.cwd(), 'electron/main/agent/tools')
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { app } = require('electron') as typeof import('electron')
    const appCandidate = join(app.getAppPath(), 'electron/main/agent/tools')
    if (existsSync(appCandidate)) return appCandidate
  } catch {
    // vitest / 非 Electron 环境：忽略
  }
  return cwdCandidate
}

/**
 * 从工具源文件中定位 `name: 'toolName'` 所属的 export const 定义块。
 * 失败时退回含 name 的上下文窗口，保证详情页仍有可读源码。
 */
function queryExtractToolSource(
  fileContent: string,
  toolName: string
): { sourceCode: string; startLine: number; endLine: number } | null {
  const escaped = toolName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const namePattern = new RegExp(`name:\\s*['"]${escaped}['"]`)
  const nameMatch = namePattern.exec(fileContent)
  if (!nameMatch || nameMatch.index == null) return null

  const nameIndex = nameMatch.index
  const before = fileContent.slice(0, nameIndex)
  const exportMatches = [...before.matchAll(/export\s+const\s+\w+/g)]
  const lastExport = exportMatches.at(-1)

  const fallbackSnippet = (): { sourceCode: string; startLine: number; endLine: number } => {
    const lineStart = before.lastIndexOf('\n') + 1
    const snippet = fileContent.slice(lineStart, Math.min(fileContent.length, nameIndex + 1200))
    const startLine = before.split('\n').length
    return {
      sourceCode: snippet.trimEnd(),
      startLine,
      endLine: startLine + snippet.split('\n').length - 1
    }
  }

  if (lastExport?.index == null) return fallbackSnippet()

  const startIndex = lastExport.index
  const braceStart = fileContent.indexOf('{', startIndex)
  if (braceStart < 0 || braceStart > nameIndex) return fallbackSnippet()

  let depth = 0
  for (let i = braceStart; i < fileContent.length; i++) {
    const ch = fileContent[i]
    if (ch === '{') depth += 1
    else if (ch === '}') {
      depth -= 1
      if (depth === 0) {
        let end = i + 1
        if (fileContent[end] === ';') end += 1
        const block = fileContent.slice(startIndex, end)
        const startLine = fileContent.slice(0, startIndex).split('\n').length
        const endLine = startLine + block.split('\n').length - 1
        return { sourceCode: block.trimEnd(), startLine, endLine }
      }
    }
  }

  return fallbackSnippet()
}

/** 扫描 tools 目录，建立 toolName → 源码位置映射 */
function queryToolSourceMap(): Map<string, AgentToolSourceLocation & { sourceCode: string }> {
  const dir = queryToolsSourceDir()
  const map = new Map<string, AgentToolSourceLocation & { sourceCode: string }>()
  if (!existsSync(dir)) return map

  const files = readdirSync(dir).filter((f) => f.endsWith('.ts') && !SKIP_FILES.has(f))
  for (const file of files) {
    const abs = join(dir, file)
    let content: string
    try {
      content = readFileSync(abs, 'utf-8')
    } catch {
      continue
    }
    const relativePath = `electron/main/agent/tools/${file}`
    const nameRe = /name:\s*['"]([a-z0-9_]+)['"]/g
    let match: RegExpExecArray | null
    while ((match = nameRe.exec(content)) !== null) {
      const toolName = match[1]
      if (map.has(toolName)) continue
      const extracted = queryExtractToolSource(content, toolName)
      if (extracted) {
        map.set(toolName, {
          relativePath,
          startLine: extracted.startLine,
          endLine: extracted.endLine,
          sourceCode: extracted.sourceCode
        })
      } else {
        map.set(toolName, {
          relativePath,
          startLine: 1,
          endLine: content.split('\n').length,
          sourceCode: content
        })
      }
    }
  }
  return map
}

/**
 * 汇总 Agent 工具注册表 + 源码预览 + 各角色注入白名单。
 * 供设置页「工具」Tab 只读浏览。
 */
export function queryAgentToolsCatalog(): AgentToolCatalog {
  const sourceMap = queryToolSourceMap()
  const tools: AgentToolCatalogItem[] = getAllTools().map((tool) => {
    const loc = sourceMap.get(tool.name)
    return {
      name: tool.name,
      description: tool.description,
      permission: tool.permission as AgentToolPermission,
      parameters: tool.parameters,
      source: loc
        ? {
            relativePath: loc.relativePath,
            startLine: loc.startLine,
            endLine: loc.endLine
          }
        : null,
      sourceCode: loc?.sourceCode ?? null
    }
  })

  return {
    tools,
    roleInjections: queryRoleToolInjections(),
    registeredCount: tools.length
  }
}
