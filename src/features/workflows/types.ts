import type {
  WorkflowAgentNode,
  WorkflowAwaitNode,
  WorkflowConditionNode,
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
} from '@shared/types'
import { queryDefaultCollectPrompt } from '@shared/workflow-collect-defaults'

export function createStartNode(partial?: Partial<WorkflowStartNode>): WorkflowStartNode {
  return {
    id: partial?.id ?? crypto.randomUUID(),
    type: 'start',
    title: partial?.title ?? '开始'
  }
}

export function createEndNode(partial?: Partial<WorkflowEndNode>): WorkflowEndNode {
  return {
    id: partial?.id ?? crypto.randomUUID(),
    type: 'end',
    title: partial?.title ?? '结束'
  }
}

/** 新建空流程：强制带唯一开始/结束与初始画布坐标 */
export function createEmptyWorkflow(): WorkflowDefinition {
  const now = Date.now()
  const start = createStartNode()
  const end = createEndNode()
  return {
    id: crypto.randomUUID(),
    title: '未命名流程',
    description: '',
    templateKind: 'generic',
    nodes: [start, end],
    canvas: {
      positions: {
        [start.id]: { x: 80, y: 40 },
        [end.id]: { x: 80, y: 220 }
      },
      edges: []
    },
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
    outputKeys: partial?.outputKeys,
    collectPrompt:
      partial?.collectPrompt ?? queryDefaultCollectPrompt('agent')
  }
}

export function createToolNode(partial?: Partial<WorkflowToolNode>): WorkflowToolNode {
  const toolName = partial?.toolName ?? ''
  return {
    id: crypto.randomUUID(),
    type: 'tool',
    title: partial?.title ?? '工具步骤',
    toolName,
    argsTemplate: partial?.argsTemplate ?? {},
    outputKeys: partial?.outputKeys,
    collectPrompt:
      partial?.collectPrompt ?? queryDefaultCollectPrompt('tool', toolName)
  }
}

export function createAwaitNode(partial?: Partial<WorkflowAwaitNode>): WorkflowAwaitNode {
  return {
    id: crypto.randomUUID(),
    type: 'await_user',
    title: partial?.title ?? '等待确认',
    reason: partial?.reason ?? '请确认后继续',
    // 确认节点默认不跑数据采集，避免确认前多余 Agent 调用
    collectPrompt: partial?.collectPrompt
  }
}

/**
 * 新建统一通知节点。
 * 默认同时开启渠道推送（飞书富文本）与应用内 Toast；可通过 targets 裁剪。
 */
export function createNotifyNode(partial?: Partial<WorkflowNotifyNode>): WorkflowNotifyNode {
  const targets = partial?.targets?.length
    ? Array.from(new Set(partial.targets.filter((t) => t === 'channel' || t === 'toast')))
    : (['channel', 'toast'] as const)
  const wantsChannel = targets.includes('channel')
  const channelId = wantsChannel ? (partial?.channelId ?? 'feishu') : partial?.channelId
  return {
    id: crypto.randomUUID(),
    type: 'notify',
    title: partial?.title ?? '通知',
    targets: [...targets],
    channelId,
    titleTemplate: partial?.titleTemplate,
    contentTemplate: partial?.contentTemplate ?? '{{summary}}',
    msgType:
      partial?.msgType ??
      (channelId === 'feishu' ? 'post' : undefined),
    failSoft: partial?.failSoft ?? true,
    toastLevel: partial?.toastLevel ?? 'info',
    imageKey: partial?.imageKey,
    shareChatId: partial?.shareChatId,
    inputKeys: partial?.inputKeys,
    outputKeys: partial?.outputKeys,
    collectPrompt:
      partial?.collectPrompt ?? queryDefaultCollectPrompt('notify')
  }
}

/**
 * @deprecated 已合并进 createNotifyNode；保留以兼容旧调用，返回仅 Toast 目标的通知节点。
 */
export function createToastNode(partial?: Partial<WorkflowToastNode>): WorkflowNotifyNode {
  return createNotifyNode({
    title: partial?.title ?? '通知',
    targets: ['toast'],
    toastLevel: partial?.level ?? 'info',
    contentTemplate: partial?.contentTemplate ?? '{{summary}}',
    inputKeys: partial?.inputKeys,
    outputKeys: partial?.outputKeys,
    collectPrompt: partial?.collectPrompt
  })
}

/** 新建输入节点：默认采集文字 */
export function createInputNode(partial?: Partial<WorkflowInputNode>): WorkflowInputNode {
  return {
    id: crypto.randomUUID(),
    type: 'input',
    title: partial?.title ?? '用户输入',
    prompt: partial?.prompt ?? '请输入内容后继续流程',
    inputKinds: partial?.inputKinds?.length ? [...partial.inputKinds] : ['text'],
    inputKeys: partial?.inputKeys,
    outputKeys: partial?.outputKeys,
    collectPrompt:
      partial?.collectPrompt ?? queryDefaultCollectPrompt('input')
  }
}

/** 新建输出节点：默认 Markdown 写入用户选定目录 */
export function createOutputNode(partial?: Partial<WorkflowOutputNode>): WorkflowOutputNode {
  return {
    id: crypto.randomUUID(),
    type: 'output',
    title: partial?.title ?? '文件输出',
    outputDir: partial?.outputDir ?? '',
    outputFormat: partial?.outputFormat ?? 'markdown',
    fileNameTemplate: partial?.fileNameTemplate ?? 'output',
    contentTemplate: partial?.contentTemplate ?? '{{summary}}',
    inputKeys: partial?.inputKeys,
    outputKeys: partial?.outputKeys,
    collectPrompt:
      partial?.collectPrompt ?? queryDefaultCollectPrompt('output')
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

/** @deprecated 画布已改为边条件；仅兼容旧数据 / 引擎内部编译 */
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
    defaultKey: partial?.defaultKey,
    matchMode: partial?.matchMode
  }
}

export function createEmptyNode(type: WorkflowNode['type']): WorkflowNode {
  if (type === 'tool') return createToolNode()
  if (type === 'await_user') return createAwaitNode()
  if (type === 'notify') return createNotifyNode()
  // toast 已合并进 notify；旧入口仍返回仅 Toast 目标的通知节点
  if (type === 'toast') return createToastNode()
  if (type === 'input') return createInputNode()
  if (type === 'output') return createOutputNode()
  if (type === 'parallel') return createParallelNode()
  if (type === 'condition') return createConditionNode()
  if (type === 'start') return createStartNode()
  if (type === 'end') return createEndNode()
  return createAgentNode()
}

/** 节点类型中文标签（列表/卡片摘要） */
export function queryNodeTypeLabel(type: WorkflowNode['type']): string {
  const map: Record<WorkflowNode['type'], string> = {
    agent: 'Agent',
    tool: '工具',
    await_user: '确认',
    notify: '通知',
    toast: '通知',
    input: '输入',
    output: '输出',
    parallel: '并行组',
    condition: '条件分支',
    start: '开始',
    end: '结束'
  }
  return map[type]
}

export function isLeafNode(node: WorkflowNode): node is WorkflowLeafNode {
  return (
    node.type === 'agent' ||
    node.type === 'tool' ||
    node.type === 'await_user' ||
    node.type === 'notify' ||
    node.type === 'toast' ||
    node.type === 'input' ||
    node.type === 'output'
  )
}

export function isTerminalNode(
  node: WorkflowNode
): node is WorkflowStartNode | WorkflowEndNode {
  return node.type === 'start' || node.type === 'end'
}
