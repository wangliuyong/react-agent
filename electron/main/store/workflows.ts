import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import type {
  WorkflowAwaitNode,
  WorkflowAgentNode,
  WorkflowCanvas,
  WorkflowConditionNode,
  WorkflowConditionWhen,
  WorkflowDefinition,
  WorkflowEndNode,
  WorkflowInputNode,
  WorkflowLeafNode,
  WorkflowNode,
  WorkflowNotifyNode,
  WorkflowOutputNode,
  WorkflowParallelNode,
  WorkflowStartNode,
  WorkflowToastNode,
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

function normalizeKeyList(raw: unknown): string[] | undefined {
  if (!Array.isArray(raw)) return undefined
  const keys = raw.map(String).map((s) => s.trim()).filter(Boolean)
  return keys.length ? keys : undefined
}

function isLeafType(
  type: string
): type is WorkflowLeafNode['type'] {
  return (
    type === 'agent' ||
    type === 'tool' ||
    type === 'await_user' ||
    type === 'notify' ||
    type === 'toast' ||
    type === 'input' ||
    type === 'output'
  )
}

function normalizeLeaf(
  raw: WorkflowLeafNode
):
  | WorkflowAgentNode
  | WorkflowToolNode
  | WorkflowAwaitNode
  | WorkflowNotifyNode
  | WorkflowToastNode
  | WorkflowInputNode
  | WorkflowOutputNode {
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
      inputKeys: normalizeKeyList(raw.inputKeys),
      outputKeys: normalizeKeyList(raw.outputKeys)
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
      inputKeys: normalizeKeyList(raw.inputKeys),
      outputKeys: normalizeKeyList(raw.outputKeys)
    }
  }

  if (raw.type === 'notify') {
    const notify = raw as WorkflowNotifyNode
    return {
      ...base,
      type: 'notify',
      channelId: String(notify.channelId || '').trim() || 'feishu',
      titleTemplate:
        notify.titleTemplate != null ? String(notify.titleTemplate) : undefined,
      contentTemplate: String(notify.contentTemplate || '').trim() || '{{summary}}',
      richText:
        String(notify.channelId || 'feishu') === 'feishu'
          ? notify.richText !== false
          : Boolean(notify.richText),
      failSoft: notify.failSoft !== false,
      inputKeys: normalizeKeyList(notify.inputKeys),
      outputKeys: normalizeKeyList(notify.outputKeys)
    }
  }

  if (raw.type === 'toast') {
    const toast = raw as WorkflowToastNode
    const level = toast.level
    const validLevel =
      level === 'success' || level === 'error' || level === 'warning' || level === 'info'
        ? level
        : 'info'
    return {
      ...base,
      type: 'toast',
      level: validLevel,
      contentTemplate: String(toast.contentTemplate || '').trim() || '{{summary}}',
      inputKeys: normalizeKeyList(toast.inputKeys),
      outputKeys: normalizeKeyList(toast.outputKeys)
    }
  }

  if (raw.type === 'input') {
    const inputNode = raw as WorkflowInputNode
    const kinds = Array.isArray(inputNode.inputKinds)
      ? inputNode.inputKinds.filter(
          (k): k is WorkflowInputNode['inputKinds'][number] =>
            k === 'text' || k === 'attachment' || k === 'image' || k === 'video'
        )
      : []
    return {
      ...base,
      type: 'input',
      prompt: String(inputNode.prompt || '').trim() || '请输入内容后继续流程',
      inputKinds: kinds.length ? kinds : ['text'],
      inputKeys: normalizeKeyList(inputNode.inputKeys),
      outputKeys: normalizeKeyList(inputNode.outputKeys)
    }
  }

  if (raw.type === 'output') {
    const outputNode = raw as WorkflowOutputNode
    const format = outputNode.outputFormat
    const validFormat =
      format === 'text' || format === 'markdown' || format === 'json' || format === 'file'
        ? format
        : 'markdown'
    return {
      ...base,
      type: 'output',
      outputDir: String(outputNode.outputDir || '').trim(),
      outputFormat: validFormat,
      fileNameTemplate:
        outputNode.fileNameTemplate != null ? String(outputNode.fileNameTemplate) : 'output',
      contentTemplate: String(outputNode.contentTemplate || '').trim() || '{{summary}}',
      inputKeys: normalizeKeyList(outputNode.inputKeys),
      outputKeys: normalizeKeyList(outputNode.outputKeys)
    }
  }

  if (raw.type === 'await_user') {
    const awaitNode = raw as WorkflowAwaitNode
    return {
      ...base,
      type: 'await_user',
      reason: String(awaitNode.reason || '').trim() || '请确认后继续',
      inputKeys: normalizeKeyList(awaitNode.inputKeys),
      outputKeys: normalizeKeyList(awaitNode.outputKeys)
    }
  }

  return {
    ...base,
    type: 'await_user',
    reason: String((raw as WorkflowAwaitNode).reason || '').trim() || '请确认后继续'
  }
}

function normalizeWhen(raw: unknown): WorkflowConditionWhen | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const w = raw as WorkflowConditionWhen
  return {
    ...(w.expression != null ? { expression: String(w.expression) } : {}),
    ...(w.contextKey != null ? { contextKey: String(w.contextKey) } : {}),
    ...(w.op != null ? { op: w.op } : {}),
    ...(w.value !== undefined ? { value: w.value } : {})
  }
}

function normalizeCondition(raw: WorkflowConditionNode): WorkflowConditionNode {
  const cases = Array.isArray(raw.cases)
    ? raw.cases
        .filter((c) => c && String(c.key || '').trim())
        .map((c) => ({
          key: String(c.key).trim(),
          label: c.label != null ? String(c.label) : undefined,
          when: normalizeWhen(c.when),
          nodes: Array.isArray(c.nodes)
            ? c.nodes
                .filter(
                  (n): n is WorkflowLeafNode =>
                    n != null && isLeafType(String(n.type))
                )
                .map(normalizeLeaf)
            : []
        }))
    : []
  return {
    id: String(raw.id || '').trim() || crypto.randomUUID(),
    type: 'condition',
    title: String(raw.title || '').trim() || '条件分支',
    mode: raw.mode === 'agent' ? 'agent' : 'expression',
    when: normalizeWhen(raw.when),
    prompt: raw.prompt != null ? String(raw.prompt) : undefined,
    toolWhitelist: Array.isArray(raw.toolWhitelist)
      ? raw.toolWhitelist.map(String)
      : undefined,
    cases: cases.length
      ? cases
      : [
          { key: 'true', label: '是', nodes: [] },
          { key: 'false', label: '否', nodes: [] }
        ],
    defaultKey: raw.defaultKey != null ? String(raw.defaultKey) : undefined
  }
}

function normalizeNode(raw: WorkflowNode): WorkflowNode {
  if (raw.type === 'start') {
    const node: WorkflowStartNode = {
      id: String(raw.id || '').trim() || crypto.randomUUID(),
      type: 'start',
      title: String(raw.title || '').trim() || '开始'
    }
    return node
  }
  if (raw.type === 'end') {
    const node: WorkflowEndNode = {
      id: String(raw.id || '').trim() || crypto.randomUUID(),
      type: 'end',
      title: String(raw.title || '').trim() || '结束'
    }
    return node
  }
  if (raw.type === 'condition') {
    return normalizeCondition(raw)
  }
  if (raw.type === 'parallel') {
    const children = Array.isArray(raw.children)
      ? raw.children
          .filter(
            (c): c is WorkflowLeafNode => c != null && isLeafType(String(c.type))
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
        .map((e) => {
          const edge: WorkflowCanvas['edges'][number] = {
            id: String(e.id || `e_${e.source}_${e.target}`),
            source: String(e.source),
            target: String(e.target)
          }
          if (e.label != null && String(e.label).trim()) {
            edge.label = String(e.label).trim()
          }
          const when = normalizeWhen(e.when)
          if (when && (when.expression || when.contextKey)) edge.when = when
          if (e.isDefault === true) edge.isDefault = true
          // 保留旧 branchKey 供前端迁移
          if (e.branchKey != null && String(e.branchKey).trim()) {
            edge.branchKey = String(e.branchKey).trim()
          }
          return edge
        })
    : []
  if (!edges.length && !Object.keys(positions).length) return undefined
  return { positions, edges }
}

/** 确保恰好一个 start / end（缺则补；多则保留第一个） */
function ensureTerminalNodes(nodes: WorkflowNode[]): WorkflowNode[] {
  const starts = nodes.filter((n) => n.type === 'start')
  const ends = nodes.filter((n) => n.type === 'end')
  const rest = nodes.filter((n) => n.type !== 'start' && n.type !== 'end')
  const start: WorkflowStartNode =
    starts[0] ??
    ({
      id: crypto.randomUUID(),
      type: 'start',
      title: '开始'
    } as WorkflowStartNode)
  const end: WorkflowEndNode =
    ends[0] ??
    ({
      id: crypto.randomUUID(),
      type: 'end',
      title: '结束'
    } as WorkflowEndNode)
  return [start, ...rest, end]
}

function normalizeWorkflow(raw: WorkflowDefinition): WorkflowDefinition {
  const now = Date.now()
  const nodes = ensureTerminalNodes(
    Array.isArray(raw.nodes) ? raw.nodes.map(normalizeNode) : []
  )
  return {
    id: String(raw.id || '').trim() || crypto.randomUUID(),
    title: String(raw.title || '').trim() || '未命名流程',
    description: String(raw.description || '').trim(),
    templateKind: raw.templateKind === 'publish' ? 'publish' : 'generic',
    nodes,
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
