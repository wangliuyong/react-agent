import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import type {
  WorkflowAwaitNode,
  WorkflowAgentNode,
  WorkflowCanvas,
  WorkflowDefinition,
  WorkflowLeafNode,
  WorkflowNode,
  WorkflowParallelNode,
  WorkflowToolNode
} from '../../../shared/types'
import { mergeBuiltinWorkflowTemplates } from '../workflow/templates'
import { getDataRoot } from './paths'

function getWorkflowsPath(): string {
  return join(getDataRoot(), 'workflows.json')
}

function sortWorkflows(list: WorkflowDefinition[]): WorkflowDefinition[] {
  return [...list].sort((a, b) => b.updatedAt - a.updatedAt)
}

function normalizeLeaf(
  raw: WorkflowLeafNode
): WorkflowAgentNode | WorkflowToolNode | WorkflowAwaitNode {
  const base = {
    id: String(raw.id || '').trim() || crypto.randomUUID(),
    title: String(raw.title || '').trim() || '未命名步骤'
  }

  if (raw.type === 'agent') {
    return {
      ...base,
      type: 'agent',
      prompt: String(raw.prompt || '').trim(),
      toolWhitelist: Array.isArray(raw.toolWhitelist)
        ? raw.toolWhitelist.map(String).filter(Boolean)
        : undefined,
      outputKeys: Array.isArray(raw.outputKeys)
        ? raw.outputKeys.map(String).filter(Boolean)
        : undefined
    }
  }

  if (raw.type === 'tool') {
    return {
      ...base,
      type: 'tool',
      toolName: String(raw.toolName || '').trim(),
      argsTemplate:
        raw.argsTemplate && typeof raw.argsTemplate === 'object' && !Array.isArray(raw.argsTemplate)
          ? (raw.argsTemplate as Record<string, unknown>)
          : {},
      outputKeys: Array.isArray(raw.outputKeys)
        ? raw.outputKeys.map(String).filter(Boolean)
        : undefined
    }
  }

  return {
    ...base,
    type: 'await_user',
    reason: String((raw as WorkflowAwaitNode).reason || '').trim() || '请确认后继续'
  }
}

function normalizeNode(raw: WorkflowNode): WorkflowNode {
  if (raw.type === 'parallel') {
    const children = Array.isArray(raw.children)
      ? raw.children
          .filter(
            (c): c is WorkflowLeafNode =>
              c != null &&
              (c.type === 'agent' || c.type === 'tool' || c.type === 'await_user')
          )
          .map(normalizeLeaf)
      : []
    const node: WorkflowParallelNode = {
      id: String(raw.id || '').trim() || crypto.randomUUID(),
      type: 'parallel',
      title: String(raw.title || '').trim() || '并行组',
      children
    }
    return node
  }
  return normalizeLeaf(raw)
}

function normalizeCanvas(raw: WorkflowCanvas | undefined): WorkflowCanvas | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const positions: Record<string, { x: number; y: number }> = {}
  if (raw.positions && typeof raw.positions === 'object') {
    for (const [id, pos] of Object.entries(raw.positions)) {
      if (pos && typeof pos.x === 'number' && typeof pos.y === 'number') {
        positions[id] = { x: pos.x, y: pos.y }
      }
    }
  }
  const edges = Array.isArray(raw.edges)
    ? raw.edges
        .filter((e) => e && e.source && e.target)
        .map((e) => ({
          id: String(e.id || `e_${e.source}_${e.target}`),
          source: String(e.source),
          target: String(e.target)
        }))
    : []
  if (!edges.length && !Object.keys(positions).length) return undefined
  return { positions, edges }
}

function normalizeWorkflow(raw: WorkflowDefinition): WorkflowDefinition {
  const now = Date.now()
  return {
    id: String(raw.id || '').trim() || crypto.randomUUID(),
    title: String(raw.title || '').trim() || '未命名流程',
    description: String(raw.description || '').trim(),
    templateKind: raw.templateKind === 'publish' ? 'publish' : 'generic',
    nodes: Array.isArray(raw.nodes) ? raw.nodes.map(normalizeNode) : [],
    canvas: normalizeCanvas(raw.canvas),
    createdAt: raw.createdAt ?? now,
    updatedAt: raw.updatedAt ?? now
  }
}

function readWorkflowsFromDisk(): WorkflowDefinition[] {
  const path = getWorkflowsPath()
  if (!existsSync(path)) return []

  try {
    const parsed = JSON.parse(readFileSync(path, 'utf-8')) as WorkflowDefinition[]
    if (!Array.isArray(parsed)) return []
    return sortWorkflows(parsed.map(normalizeWorkflow))
  } catch {
    return []
  }
}

function writeWorkflows(list: WorkflowDefinition[]): WorkflowDefinition[] {
  const normalized = sortWorkflows(list.map(normalizeWorkflow))
  writeFileSync(getWorkflowsPath(), JSON.stringify(normalized, null, 2), 'utf-8')
  return normalized
}

/** 读：全部工作流定义（首次会合并预置模板） */
export function queryWorkflows(): WorkflowDefinition[] {
  const existing = readWorkflowsFromDisk()
  const { list, added } = mergeBuiltinWorkflowTemplates(existing)
  if (added > 0) {
    return writeWorkflows(list)
  }
  return list
}

/** 读：单个工作流 */
export function queryWorkflow(id: string): WorkflowDefinition | null {
  return readWorkflowsFromDisk().find((w) => w.id === id) ?? null
}

/** 写：新增或更新工作流（整对象 upsert） */
export function postWorkflow(input: WorkflowDefinition): WorkflowDefinition {
  if (!input.title.trim()) throw new Error('流程标题不能为空')

  const list = readWorkflowsFromDisk()
  const now = Date.now()
  const existing = list.find((w) => w.id === input.id)
  const next = normalizeWorkflow({
    ...input,
    createdAt: existing?.createdAt ?? input.createdAt ?? now,
    updatedAt: now
  })

  const idx = list.findIndex((w) => w.id === next.id)
  const merged = idx >= 0 ? list.map((w, i) => (i === idx ? next : w)) : [...list, next]
  writeWorkflows(merged)
  return next
}

/** 写：删除工作流 */
export function postDeleteWorkflow(id: string): void {
  const list = readWorkflowsFromDisk()
  if (!list.some((w) => w.id === id)) return
  writeWorkflows(list.filter((w) => w.id !== id))
}
