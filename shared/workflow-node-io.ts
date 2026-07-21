import type {
  WorkflowCanvas,
  WorkflowLeafNode,
  WorkflowNode
} from './types'

/** 从模板字符串提取 {{contextKey}} 占位符（仅顶层键名） */
export function queryTemplateContextKeys(template: string): string[] {
  const keys = new Set<string>()
  const re = /\{\{\s*([a-zA-Z_][\w.]*)\s*\}\}/g
  let match: RegExpExecArray | null
  while ((match = re.exec(template)) !== null) {
    keys.add(match[1].split('.')[0])
  }
  return Array.from(keys)
}

/** 从 JSON 值深度提取 {{key}} 占位符 */
export function queryJsonTemplateContextKeys(value: unknown): string[] {
  const keys = new Set<string>()
  const walk = (v: unknown): void => {
    if (typeof v === 'string') {
      for (const k of queryTemplateContextKeys(v)) keys.add(k)
      return
    }
    if (Array.isArray(v)) {
      v.forEach(walk)
      return
    }
    if (v && typeof v === 'object') {
      for (const item of Object.values(v as Record<string, unknown>)) walk(item)
    }
  }
  walk(value)
  return Array.from(keys)
}

/** 节点声明的默认输出键（未配置 outputKeys 时引擎实际写入的键） */
export function queryNodeDefaultOutputKeys(node: WorkflowLeafNode): string[] {
  switch (node.type) {
    case 'agent':
      return ['summary']
    case 'tool':
      return node.outputKeys?.length ? node.outputKeys : [node.toolName || 'toolResult']
    case 'await_user':
      return ['userInput']
    case 'notify':
      return [`notify_${node.id}`]
    case 'toast':
      return [`toast_${node.id}`]
    case 'input': {
      const keys: string[] = []
      if (!node.inputKinds.length || node.inputKinds.includes('text')) keys.push('userInput')
      if (node.inputKinds.some((k) => k === 'attachment' || k === 'image' || k === 'video')) {
        keys.push('attachmentPaths')
      }
      return keys.length ? keys : ['userInput']
    }
    case 'output':
      return ['outputPath']
    default:
      return []
  }
}

/** 节点声明的输出键（显式 outputKeys 优先，否则默认） */
export function queryNodeDeclaredOutputKeys(node: WorkflowLeafNode): string[] {
  if (node.outputKeys?.length) return [...node.outputKeys]
  return queryNodeDefaultOutputKeys(node)
}

/** 从节点配置推断需要的输入键（显式 inputKeys 优先，否则从模板推断） */
export function queryNodeInferredInputKeys(node: WorkflowLeafNode): string[] {
  const keys = new Set<string>()

  switch (node.type) {
    case 'agent':
      for (const k of queryTemplateContextKeys(node.prompt)) keys.add(k)
      break
    case 'tool':
      for (const k of queryJsonTemplateContextKeys(node.argsTemplate)) keys.add(k)
      break
    case 'await_user':
      for (const k of queryTemplateContextKeys(node.reason)) keys.add(k)
      break
    case 'notify':
      if (node.titleTemplate) {
        for (const k of queryTemplateContextKeys(node.titleTemplate)) keys.add(k)
      }
      for (const k of queryTemplateContextKeys(node.contentTemplate)) keys.add(k)
      break
    case 'toast':
      for (const k of queryTemplateContextKeys(node.contentTemplate)) keys.add(k)
      break
    case 'input':
      for (const k of queryTemplateContextKeys(node.prompt)) keys.add(k)
      break
    case 'output':
      for (const k of queryTemplateContextKeys(node.contentTemplate)) keys.add(k)
      if (node.fileNameTemplate) {
        for (const k of queryTemplateContextKeys(node.fileNameTemplate)) keys.add(k)
      }
      break
    default:
      break
  }

  return Array.from(keys)
}

/** 节点实际需要的输入键：显式 inputKeys 与模板推断合并去重 */
export function queryNodeRequiredInputKeys(node: WorkflowLeafNode): string[] {
  const explicit = node.inputKeys?.filter(Boolean) ?? []
  const inferred = queryNodeInferredInputKeys(node)
  return Array.from(new Set([...explicit, ...inferred]))
}

/** 查询直接上游节点 id（画布边 target → source） */
export function queryUpstreamNodeIds(canvas: WorkflowCanvas, nodeId: string): string[] {
  return Array.from(
    new Set(canvas.edges.filter((e) => e.target === nodeId).map((e) => e.source))
  )
}

/**
 * 沿画布反向遍历，汇总所有上游节点声明的输出键。
 * 穿过 start/end 终端节点继续向上追溯。
 */
export function queryUpstreamOutputKeys(
  leaves: WorkflowLeafNode[],
  canvas: WorkflowCanvas,
  nodeId: string
): string[] {
  const leafMap = new Map(leaves.map((l) => [l.id, l]))
  const keys = new Set<string>()
  const visited = new Set<string>()

  const walk = (ids: string[]): void => {
    for (const id of ids) {
      if (visited.has(id)) continue
      visited.add(id)
      const leaf = leafMap.get(id)
      if (leaf) {
        for (const k of queryNodeDeclaredOutputKeys(leaf)) keys.add(k)
      }
      const preds = canvas.edges.filter((e) => e.target === id).map((e) => e.source)
      if (preds.length) walk(preds)
    }
  }

  walk(queryUpstreamNodeIds(canvas, nodeId))
  return Array.from(keys).sort()
}

/** 检查节点所需输入是否被上游输出覆盖 */
export function queryIoAlignmentIssues(
  node: WorkflowLeafNode,
  upstreamOutputKeys: string[]
): { missing: string[]; upstream: string[]; required: string[] } {
  const upstream = new Set(upstreamOutputKeys)
  const required = queryNodeRequiredInputKeys(node)
  const missing = required.filter((k) => !upstream.has(k))
  return { missing, upstream: Array.from(upstream).sort(), required }
}

/** 从流程定义展平叶子（与画布 flatten 逻辑一致，供无画布时估算上游） */
export function flattenWorkflowLeavesFromNodes(nodes: WorkflowNode[]): WorkflowLeafNode[] {
  const leaves: WorkflowLeafNode[] = []
  for (const node of nodes) {
    if (node.type === 'parallel') {
      leaves.push(...node.children)
    } else if (node.type === 'condition') {
      for (const arm of node.cases) leaves.push(...arm.nodes)
    } else if (node.type === 'start' || node.type === 'end') {
      /* skip */
    } else {
      leaves.push(node)
    }
  }
  return leaves
}

/** 逗号分隔键名解析 */
export function parseContextKeyList(raw: string | undefined): string[] {
  return (raw ?? '')
    .split(/[,，\s]+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

/** 键名列表格式化展示 */
export function formatContextKeyList(keys: string[]): string {
  return keys.length ? keys.join(', ') : '（无）'
}
