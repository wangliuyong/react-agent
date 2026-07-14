import type {
  WorkflowAgentNode,
  WorkflowAwaitNode,
  WorkflowConditionNode,
  WorkflowDefinition,
  WorkflowLeafNode,
  WorkflowNode,
  WorkflowParallelNode,
  WorkflowToolNode
} from '@shared/types'

/** 新建空流程（generic） */
export function createEmptyWorkflow(): WorkflowDefinition {
  const now = Date.now()
  return {
    id: crypto.randomUUID(),
    title: '未命名流程',
    description: '',
    templateKind: 'generic',
    nodes: [],
    createdAt: now,
    updatedAt: now
  }
}

export function createAgentNode(partial?: Partial<WorkflowAgentNode>): WorkflowAgentNode {
  return {
    id: crypto.randomUUID(),
    type: 'agent',
    title: partial?.title ?? 'Agent 步骤',
    prompt: partial?.prompt ?? '',
    toolWhitelist: partial?.toolWhitelist,
    outputKeys: partial?.outputKeys
  }
}

export function createToolNode(partial?: Partial<WorkflowToolNode>): WorkflowToolNode {
  return {
    id: crypto.randomUUID(),
    type: 'tool',
    title: partial?.title ?? '工具步骤',
    toolName: partial?.toolName ?? '',
    argsTemplate: partial?.argsTemplate ?? {},
    outputKeys: partial?.outputKeys
  }
}

export function createAwaitNode(partial?: Partial<WorkflowAwaitNode>): WorkflowAwaitNode {
  return {
    id: crypto.randomUUID(),
    type: 'await_user',
    title: partial?.title ?? '等待确认',
    reason: partial?.reason ?? '请确认后继续'
  }
}

export function createParallelNode(partial?: Partial<WorkflowParallelNode>): WorkflowParallelNode {
  return {
    id: crypto.randomUUID(),
    type: 'parallel',
    title: partial?.title ?? '并行组',
    children: partial?.children ? [...partial.children] : []
  }
}

/** 默认 If/Else（true/false）；cases.nodes 由画布编译填入 */
export function createConditionNode(
  partial?: Partial<WorkflowConditionNode>
): WorkflowConditionNode {
  return {
    id: crypto.randomUUID(),
    type: 'condition',
    title: partial?.title ?? '条件分支',
    mode: partial?.mode ?? 'expression',
    when: partial?.when ?? { contextKey: '', op: 'truthy' },
    prompt: partial?.prompt,
    toolWhitelist: partial?.toolWhitelist,
    cases: partial?.cases?.length
      ? partial.cases.map((c) => ({ ...c, nodes: c.nodes ? [...c.nodes] : [] }))
      : [
          { key: 'true', label: '是', nodes: [] },
          { key: 'false', label: '否', nodes: [] }
        ],
    defaultKey: partial?.defaultKey
  }
}

export function createEmptyNode(type: WorkflowNode['type']): WorkflowNode {
  if (type === 'tool') return createToolNode()
  if (type === 'await_user') return createAwaitNode()
  if (type === 'parallel') return createParallelNode()
  if (type === 'condition') return createConditionNode()
  return createAgentNode()
}

/** 节点类型中文标签（列表/卡片摘要） */
export function queryNodeTypeLabel(type: WorkflowNode['type']): string {
  const map: Record<WorkflowNode['type'], string> = {
    agent: 'Agent',
    tool: '工具',
    await_user: '确认',
    parallel: '并行组',
    condition: '条件分支'
  }
  return map[type]
}

export function isLeafNode(node: WorkflowNode): node is WorkflowLeafNode {
  return node.type === 'agent' || node.type === 'tool' || node.type === 'await_user'
}
