import type {
  ChatMessage,
  Session,
  TaskItem,
  TaskItemStatus,
  WorkflowConditionNode,
  WorkflowDefinition,
  WorkflowLeafNode,
  WorkflowNode,
  WorkflowRun,
  WorkflowRunStartResult
} from '../../../shared/types'
import { queryConditionCaseKey } from '../../../shared/evaluate-workflow-condition'
import { formatRunSessionTitle } from '../../../shared/session-run-title'
import { postSession, querySession } from '../store/sessions'
import { queryWorkflow } from '../store/workflows'
import {
  postWorkflowRun,
  queryWorkflowRun
} from '../store/workflow-runs'
import { queryOrMigratePublishWorkflow } from './migrate-publish'
import {
  bindGraphSessionAbort,
  releaseGraphSessionAbort,
  runLangGraphStep,
  waitForGraphUserContinue,
  emitSessionStarted
} from '../agent/graph-bridge'
import { getToolByName } from '../agent/tools'
import type { ToolContext } from '../agent/tools/types'
import { getMainWindow } from '../window'
import { handleScheduleAgentDone } from '../schedule/agent-hook'
import { postNotifyMessage } from '../notify/send'
import { interpolateDeep } from './interpolate'
import {
  interpolatePromptSoft,
  patchAgentOutputToContext,
  queryAgentStepOutput,
  queryDecodeWorkflowToolResult,
  queryMarkdownHeadingTitle
} from './tool-result'
import { isGraphInterrupt } from '@langchain/langgraph'

/** 同一时刻每个会话只跑一个工作流 */
const runningBySession = new Set<string>()

/**
 * 调试输出：节点执行时的上下文与模板解析结果（主进程 console）。
 * @param label 日志阶段说明，如「开始执行」「工具参数已解析」
 * @param node 当前节点标识
 * @param context 节点可用的 WorkflowRun.context
 * @param resolvedInput 模板插值后的实际输入（可选）
 */
function logWorkflowNodeInput(
  label: string,
  node: { id: string; type: string; title?: string },
  context: Record<string, unknown>,
  resolvedInput?: unknown
): void {
  console.log(
    `[workflow] ${label}`,
    JSON.stringify(
      {
        nodeId: node.id,
        nodeType: node.type,
        title: node.title,
        context,
        ...(resolvedInput !== undefined ? { resolvedInput } : {})
      },
      null,
      2
    )
  )
}

function emitTaskUpdate(sessionId: string, tasks: TaskItem[]): void {
  const win = getMainWindow()
  if (win && !win.isDestroyed()) {
    win.webContents.send('event:agent', { type: 'task_update', sessionId, tasks })
  }
}

function emitDone(sessionId: string, reason: string): void {
  const event = { type: 'done' as const, sessionId, reason }
  const win = getMainWindow()
  if (win && !win.isDestroyed()) {
    win.webContents.send('event:agent', event)
  }
  // 与 loop.emit 对齐：定时任务依赖 done 回写 lastRunStatus
  handleScheduleAgentDone(event)
}

function emitError(sessionId: string, message: string): void {
  const win = getMainWindow()
  if (win && !win.isDestroyed()) {
    win.webContents.send('event:agent', { type: 'error', sessionId, message })
  }
}

function emitToolStart(sessionId: string, toolName: string, args: unknown): void {
  const win = getMainWindow()
  if (win && !win.isDestroyed()) {
    win.webContents.send('event:agent', { type: 'tool_start', sessionId, toolName, args })
  }
}

function emitToolResult(sessionId: string, toolName: string, result: string): void {
  const win = getMainWindow()
  if (win && !win.isDestroyed()) {
    win.webContents.send('event:agent', { type: 'tool_result', sessionId, toolName, result })
  }
}

function emitMessage(sessionId: string, message: ChatMessage): void {
  const win = getMainWindow()
  if (win && !win.isDestroyed()) {
    win.webContents.send('event:agent', { type: 'message', sessionId, message })
  }
}

/** 工作流 Toast 节点：推送到渲染进程展示 Ant Design message */
function emitWorkflowToast(
  sessionId: string,
  level: 'success' | 'error' | 'warning' | 'info',
  content: string
): void {
  const win = getMainWindow()
  if (win && !win.isDestroyed()) {
    win.webContents.send('event:agent', {
      type: 'workflow_toast',
      sessionId,
      level,
      content
    })
  }
}

/**
 * 将流程步骤写入会话消息并实时推送到聊天 UI。
 * 纯 tool/condition 流程原先只更新 tasks，不落盘 messages，导致历史空白。
 */
function appendWorkflowMessage(
  session: Session,
  msg: Omit<ChatMessage, 'id' | 'createdAt'>
): ChatMessage {
  // 与 persistSessionTasks 同理：先同步磁盘 messages，防止并行 Agent 写入后被覆盖
  const latest = querySession(session.id)
  if (latest) {
    session.messages = latest.messages
    session.tasks = latest.tasks
    session.title = latest.title
    session.tokenUsed = latest.tokenUsed
  }
  const full: ChatMessage = {
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    ...msg
  }
  session.messages.push(full)
  session.updatedAt = Date.now()
  postSession(session)
  emitMessage(session.id, full)
  return full
}

interface FlatTaskSpec {
  id: string
  title: string
  parentId?: string
}

/** 将流程节点展开为 TaskItem 骨架（parallel / condition 子步带 parentId） */
function flattenTaskSpecs(nodes: WorkflowNode[]): FlatTaskSpec[] {
  const specs: FlatTaskSpec[] = []
  for (const node of nodes) {
    if (node.type === 'parallel') {
      specs.push({ id: node.id, title: node.title })
      for (const child of node.children) {
        specs.push({ id: child.id, title: child.title, parentId: node.id })
      }
    } else if (node.type === 'condition') {
      specs.push({ id: node.id, title: node.title })
      for (const arm of node.cases) {
        for (const child of arm.nodes) {
          specs.push({ id: child.id, title: child.title, parentId: node.id })
        }
      }
    } else if (node.type === 'start' || node.type === 'end') {
      specs.push({ id: node.id, title: node.title })
    } else {
      specs.push({ id: node.id, title: node.title })
    }
  }
  return specs
}

function buildTasks(
  specs: FlatTaskSpec[],
  statusMap: Map<string, TaskItemStatus>
): TaskItem[] {
  return specs.map((s) => ({
    id: s.id,
    title: s.title,
    status: statusMap.get(s.id) ?? 'pending',
    parentId: s.parentId
  }))
}

/**
 * 写回 tasks 前先把磁盘上的 messages（如 Agent ReAct 新增）合并进内存会话，
 * 避免用引擎持有的旧对象覆盖掉 loop 已落盘的聊天记录。
 */
function persistSessionTasks(session: Session, tasks: TaskItem[]): void {
  const latest = querySession(session.id)
  if (latest) {
    session.messages = latest.messages
    session.title = latest.title
    session.tokenUsed = latest.tokenUsed
  }
  session.tasks = tasks
  session.updatedAt = Date.now()
  postSession(session)
  emitTaskUpdate(session.id, tasks)
}

function patchRun(run: WorkflowRun, patch: Partial<WorkflowRun>): WorkflowRun {
  return postWorkflowRun({ ...run, ...patch, updatedAt: Date.now() })
}

function createWorkflowSession(workflow: WorkflowDefinition): Session {
  const now = Date.now()
  return {
    id: crypto.randomUUID(),
    title: formatRunSessionTitle('[流程]', workflow.title, now),
    messages: [],
    tasks: [],
    type: 'workflow',
    tokenUsed: 0,
    createdAt: now,
    updatedAt: now
  }
}

/**
 * 执行 tool 节点；返回合并后的 context（不强制落盘）。
 * 并行组内多个 tool 可同时跑，由调用方统一 patchRun，避免互相覆盖 cursor/status。
 */
async function executeToolNode(
  session: Session,
  node: Extract<WorkflowLeafNode, { type: 'tool' }>,
  context: Record<string, unknown>,
  onAwaitUser?: () => Promise<void>
): Promise<Record<string, unknown>> {
  const sessionId = session.id
  const tool = getToolByName(node.toolName)
  if (!tool) {
    throw new Error(`未知工具: ${node.toolName}`)
  }

  logWorkflowNodeInput('工具节点 · 上下文', node, context)
  const args = interpolateDeep(node.argsTemplate, context) as Record<string, unknown>
  logWorkflowNodeInput('工具节点 · 参数已解析', node, context, args)

  emitToolStart(sessionId, node.toolName, args)

  const toolCtx: ToolContext = {
    sessionId,
    // 工作流 tool 节点与 agent 步一致：跳过敏感确认；未登录仍暂停
    fullAccess: true,
    attachmentPaths: [],
    emitAwaitUser: async (reason) => {
      if (onAwaitUser) await onAwaitUser()
      await waitForGraphUserContinue(sessionId, reason)
    },
    updateTasks: () => {
      /* 引擎权威维护 tasks */
    }
  }

  let rawResult: string
  try {
    rawResult = await tool.execute(args, toolCtx)
  } catch (err) {
    rawResult = `工具执行失败: ${err instanceof Error ? err.message : String(err)}`
    emitToolResult(sessionId, node.toolName, rawResult)
    // 失败也写入聊天，便于排查
    appendWorkflowMessage(session, {
      role: 'tool',
      toolName: node.toolName,
      content: rawResult
    })
    throw new Error(rawResult)
  }

  // 支持 @@workflow_ctx@@ 把 patch 写入 context（如 hotTopicsOk），message 仍作工具日志
  const decoded = queryDecodeWorkflowToolResult(rawResult)
  emitToolResult(sessionId, node.toolName, decoded.message)
  appendWorkflowMessage(session, {
    role: 'tool',
    toolName: node.toolName,
    content: decoded.message
  })

  const nextContext = { ...context, ...decoded.patch }
  if (node.outputKeys?.length) {
    for (const key of node.outputKeys) {
      nextContext[key] = decoded.message
    }
  } else if (!Object.keys(decoded.patch).length) {
    nextContext[node.toolName] = decoded.message
  }
  return nextContext
}

/**
 * 执行渠道通知节点：软插值标题/正文后调用 postNotifyMessage。
 * failSoft 为 true（默认）时发送失败不阻断流程。
 */
async function executeNotifyNode(
  session: Session,
  node: Extract<WorkflowLeafNode, { type: 'notify' }>,
  context: Record<string, unknown>
): Promise<{ context: Record<string, unknown>; summary: string }> {
  logWorkflowNodeInput('通知节点 · 上下文', node, context)
  const title = node.titleTemplate
    ? interpolatePromptSoft(node.titleTemplate, context)
    : undefined
  const content = interpolatePromptSoft(node.contentTemplate, context).trim()
  logWorkflowNodeInput('通知节点 · 内容已解析', node, context, { title, content })
  if (!content) {
    const msg = '通知正文为空，请检查 contentTemplate 或上游 outputKeys'
    appendWorkflowMessage(session, {
      role: 'assistant',
      content: `【${node.title}】${msg}`
    })
    if (node.failSoft === false) {
      throw new Error(msg)
    }
    return { context, summary: msg }
  }

  const useRichText = node.channelId === 'feishu' ? node.richText !== false : Boolean(node.richText)
  const resolvedTitle =
    title?.trim() || (useRichText ? queryMarkdownHeadingTitle(content) : undefined)

  const result = await postNotifyMessage({
    channelId: node.channelId,
    title: resolvedTitle,
    content,
    richText: useRichText
  })

  const summary = result.ok
    ? result.deduped
      ? `通知已去重跳过（${node.channelId}）`
      : `通知已发送至 ${node.channelId}`
    : `通知发送失败：${result.error}`

  appendWorkflowMessage(session, {
    role: 'assistant',
    content: `【${node.title}】${summary}`
  })

  if (!result.ok && node.failSoft === false) {
    throw new Error(summary)
  }

  const nextContext = { ...context }
  if (node.outputKeys?.length) {
    for (const key of node.outputKeys) {
      nextContext[key] = summary
    }
  } else {
    nextContext[`notify_${node.id}`] = summary
  }
  return { context: nextContext, summary }
}

/**
 * 执行 Toast 节点：软插值正文后通过 IPC 触发渲染进程 message。
 */
async function executeToastNode(
  session: Session,
  node: Extract<WorkflowLeafNode, { type: 'toast' }>,
  context: Record<string, unknown>
): Promise<Record<string, unknown>> {
  logWorkflowNodeInput('Toast 节点 · 上下文', node, context)
  const content = interpolatePromptSoft(node.contentTemplate, context).trim()
  const display = content || '（空通知）'
  logWorkflowNodeInput('Toast 节点 · 内容已解析', node, context, { content: display })

  emitWorkflowToast(session.id, node.level, display)
  appendWorkflowMessage(session, {
    role: 'assistant',
    content: `【${node.title}】Toast：${display}`
  })

  const nextContext = { ...context }
  if (node.outputKeys?.length) {
    for (const key of node.outputKeys) {
      nextContext[key] = display
    }
  } else {
    nextContext[`toast_${node.id}`] = display
  }
  return nextContext
}

async function executeLeafNode(
  session: Session,
  node: WorkflowLeafNode,
  run: WorkflowRun,
  signal: AbortSignal
): Promise<WorkflowRun> {
  const sessionId = session.id
  if (signal.aborted) {
    throw new Error('__aborted__')
  }

  run = patchRun(run, { cursorNodeId: node.id, status: 'running' })
  logWorkflowNodeInput('叶节点 · 开始执行', node, run.context)

  if (node.type === 'await_user') {
    run = patchRun(run, { status: 'awaiting_user' })
    appendWorkflowMessage(session, {
      role: 'assistant',
      content: `等待确认：${node.reason || node.title}`
    })
    const reason = node.reason || node.title
    /**
     * 与工具确认一致：直接 promise 等待并推送 await_user 事件。
     * 勿用 LangGraph interrupt()——外层 stream 常漏检，会出现「已写等待确认文案但无继续按钮」。
     */
    await waitForGraphUserContinue(sessionId, reason)
    if (signal.aborted) throw new Error('__aborted__')
    return patchRun(run, { status: 'running' })
  }

  if (node.type === 'tool') {
    const nextContext = await executeToolNode(session, node, run.context, async () => {
      run = patchRun(run, { status: 'awaiting_user' })
    })
    return patchRun(run, { context: nextContext, status: 'running' })
  }

  if (node.type === 'notify') {
    const { context: nextContext } = await executeNotifyNode(session, node, run.context)
    return patchRun(run, { context: nextContext, status: 'running' })
  }

  if (node.type === 'toast') {
    const nextContext = await executeToastNode(session, node, run.context)
    return patchRun(run, { context: nextContext, status: 'running' })
  }

  // agent：本步目标写进会话；prompt 支持 {{contextKey}} 软插值
  const stepPrompt = interpolatePromptSoft(
    [
      `【工作流步骤】${node.title}`,
      node.prompt,
      '完成本步骤目标后直接结束本轮，不要擅自执行后续流程步骤。'
    ]
      .filter(Boolean)
      .join('\n\n'),
    run.context
  )
  logWorkflowNodeInput('Agent 节点 · Prompt 已解析', node, run.context, { stepPrompt })
  const sessionBefore = querySession(sessionId)
  const msgCountBefore = sessionBefore?.messages.length ?? 0

  const stepResult = await runLangGraphStep({
    sessionId,
    prompt: stepPrompt,
    toolWhitelist: node.toolWhitelist
  })

  if (stepResult === 'aborted') throw new Error('__aborted__')
  if (stepResult === 'error' || stepResult === 'max_turns') {
    throw new Error(
      stepResult === 'max_turns' ? `步骤「${node.title}」达到最大轮次` : `步骤「${node.title}」执行失败`
    )
  }

  const sessionAfter = querySession(sessionId)
  const agentOutput = queryAgentStepOutput(sessionAfter?.messages ?? [], msgCountBefore)
  const nextContext = patchAgentOutputToContext(run.context, agentOutput, node.outputKeys)
  return patchRun(run, { context: nextContext, status: 'running' })
}

/** 从 Agent 回复文本中解析分支 key */
function parseAgentBranchKey(text: string, keys: string[]): string {
  const trimmed = text.trim()
  try {
    const parsed = JSON.parse(trimmed) as { key?: unknown }
    if (typeof parsed?.key === 'string' && parsed.key.trim()) {
      return parsed.key.trim()
    }
  } catch {
    /* 非纯 JSON，继续兜底 */
  }
  const m = trimmed.match(/"key"\s*:\s*"([^"]+)"/)
  if (m?.[1]) return m[1].trim()
  if (keys.includes(trimmed)) return trimmed
  for (const k of keys) {
    if (trimmed === k || trimmed.endsWith(k)) return k
  }
  return trimmed
}

/**
 * Agent 选路：受限 ReAct，尽量不给工具（whitelist 指向不存在的名字）。
 * 要求模型只输出 {"key":"..."}。
 */
async function queryAgentBranchKey(
  sessionId: string,
  node: WorkflowConditionNode,
  context: Record<string, unknown>,
  signal: AbortSignal
): Promise<string> {
  if (signal.aborted) throw new Error('__aborted__')
  const keys = node.cases.map((c) => c.key)
  const whitelist =
    node.toolWhitelist && node.toolWhitelist.length > 0
      ? node.toolWhitelist
      : ['__workflow_condition_no_tool__']

  const stepResult = await runLangGraphStep({
    sessionId,
    prompt: [
      `【条件分支】${node.title}`,
      node.prompt?.trim() || '根据上下文选择唯一分支。',
      `可选 key：${keys.join(', ')}`,
      '你必须只输出一行 JSON：{"key":"<上述某一个 key>"}，不要输出其它说明，不要调用工具。',
      `当前 context JSON：${JSON.stringify(context)}`
    ].join('\n\n'),
    toolWhitelist: whitelist
  })

  if (stepResult === 'aborted') throw new Error('__aborted__')
  if (stepResult === 'error' || stepResult === 'max_turns') {
    throw new Error(
      stepResult === 'max_turns'
        ? `条件「${node.title}」Agent 选路达到最大轮次`
        : `条件「${node.title}」Agent 选路失败`
    )
  }

  const sess = querySession(sessionId)
  const lastAssistant = [...(sess?.messages ?? [])]
    .reverse()
    .find((m) => m.role === 'assistant' && m.content?.trim())
  return parseAgentBranchKey(lastAssistant?.content ?? '', keys)
}

async function executeConditionNode(
  sessionId: string,
  node: WorkflowConditionNode,
  run: WorkflowRun,
  statusMap: Map<string, TaskItemStatus>,
  specs: FlatTaskSpec[],
  session: Session,
  signal: AbortSignal
): Promise<WorkflowRun> {
  statusMap.set(node.id, 'running')
  for (const arm of node.cases) {
    for (const child of arm.nodes) statusMap.set(child.id, 'pending')
  }
  persistSessionTasks(session, buildTasks(specs, statusMap))
  logWorkflowNodeInput('条件节点 · 开始执行', node, run.context)

  let selectedKey: string
  if (node.mode === 'agent') {
    const rawKey = await queryAgentBranchKey(sessionId, node, run.context, signal)
    const picked = queryConditionCaseKey(node, run.context, rawKey)
    if ('error' in picked) throw new Error(picked.error)
    selectedKey = picked.key
  } else {
    const picked = queryConditionCaseKey(node, run.context)
    if ('error' in picked) throw new Error(picked.error)
    selectedKey = picked.key
  }

  const prevBranch =
    (run.context.__branchKeys as Record<string, string> | undefined) ?? {}
  run = patchRun(run, {
    context: {
      ...run.context,
      __branchKeys: { ...prevBranch, [node.id]: selectedKey }
    },
    cursorNodeId: node.id,
    status: 'running'
  })

  const chosen = node.cases.find((c) => c.key === selectedKey)
  if (!chosen) throw new Error(`条件分支无 case: ${selectedKey}`)

  // expression 模式无 agent 消息时补一条选路说明；agent 模式已有 ReAct 记录
  if (node.mode !== 'agent') {
    appendWorkflowMessage(session, {
      role: 'assistant',
      content: `条件「${node.title}」选择分支：${chosen.label || selectedKey}`
    })
  }

  for (const arm of node.cases) {
    if (arm.key === selectedKey) continue
    for (const child of arm.nodes) statusMap.set(child.id, 'skipped')
  }
  persistSessionTasks(session, buildTasks(specs, statusMap))

  for (const child of chosen.nodes) {
    statusMap.set(child.id, 'running')
    persistSessionTasks(session, buildTasks(specs, statusMap))
    try {
      run = await executeLeafNode(session, child, run, signal)
      statusMap.set(child.id, 'done')
      persistSessionTasks(session, buildTasks(specs, statusMap))
    } catch (e) {
      if (e instanceof Error && e.message === '__aborted__') throw e
      statusMap.set(child.id, 'failed')
      statusMap.set(node.id, 'failed')
      persistSessionTasks(session, buildTasks(specs, statusMap))
      throw e
    }
  }

  statusMap.set(node.id, 'done')
  persistSessionTasks(session, buildTasks(specs, statusMap))
  return run
}

/**
 * 推进单个顶层节点。
 * parallel：组内若全是 tool → Promise.all 并发；含 agent/await_user 时串行
 * （同 Session 上不能并行跑多段 ReAct，否则消息/abort 会交错）。
 * condition：XOR 只跑选中支路，其余标 skipped。
 */
async function executeTopLevelNode(
  sessionId: string,
  node: WorkflowNode,
  run: WorkflowRun,
  statusMap: Map<string, TaskItemStatus>,
  specs: FlatTaskSpec[],
  session: Session,
  signal: AbortSignal
): Promise<WorkflowRun> {
  if (node.type === 'start' || node.type === 'end') {
    logWorkflowNodeInput(`${node.type === 'start' ? '开始' : '结束'}节点 · 开始执行`, node, run.context)
    statusMap.set(node.id, 'running')
    persistSessionTasks(session, buildTasks(specs, statusMap))
    run = patchRun(run, { cursorNodeId: node.id, status: 'running' })
    appendWorkflowMessage(session, {
      role: 'assistant',
      content: node.type === 'start' ? `流程开始：${node.title}` : `流程结束：${node.title}`
    })
    statusMap.set(node.id, 'done')
    persistSessionTasks(session, buildTasks(specs, statusMap))
    return run
  }

  if (node.type === 'condition') {
    try {
      return await executeConditionNode(
        sessionId,
        node,
        run,
        statusMap,
        specs,
        session,
        signal
      )
    } catch (e) {
      if (e instanceof Error && e.message === '__aborted__') throw e
      if (statusMap.get(node.id) !== 'failed') {
        statusMap.set(node.id, 'failed')
        persistSessionTasks(session, buildTasks(specs, statusMap))
      }
      throw e
    }
  }

  if (node.type !== 'parallel') {
    statusMap.set(node.id, 'running')
    persistSessionTasks(session, buildTasks(specs, statusMap))
    try {
      run = await executeLeafNode(session, node, run, signal)
      statusMap.set(node.id, 'done')
      persistSessionTasks(session, buildTasks(specs, statusMap))
      return run
    } catch (e) {
      if (e instanceof Error && e.message === '__aborted__') throw e
      // GraphInterrupt 是挂起而非失败，原样上抛供外层 resume，勿标 failed
      if (isGraphInterrupt(e)) throw e
      statusMap.set(node.id, 'failed')
      persistSessionTasks(session, buildTasks(specs, statusMap))
      throw e
    }
  }

  statusMap.set(node.id, 'running')
  for (const child of node.children) {
    statusMap.set(child.id, 'pending')
  }
  persistSessionTasks(session, buildTasks(specs, statusMap))
  run = patchRun(run, { cursorNodeId: node.id, status: 'running' })
  logWorkflowNodeInput('并行节点 · 开始执行', node, run.context, {
    childIds: node.children.map((c) => c.id)
  })

  const allTools =
    node.children.length > 0 && node.children.every((c) => c.type === 'tool')

  try {
    if (allTools) {
      for (const child of node.children) statusMap.set(child.id, 'running')
      persistSessionTasks(session, buildTasks(specs, statusMap))

      const baseContext = { ...run.context }
      const settled = await Promise.all(
        node.children.map(async (child) => {
          if (signal.aborted) throw new Error('__aborted__')
          try {
            const nextContext = await executeToolNode(
              session,
              child as Extract<WorkflowLeafNode, { type: 'tool' }>,
              baseContext,
              async () => {
                patchRun(run, { status: 'awaiting_user' })
              }
            )
            statusMap.set(child.id, 'done')
            persistSessionTasks(session, buildTasks(specs, statusMap))
            return { ok: true as const, context: nextContext }
          } catch (e) {
            statusMap.set(child.id, 'failed')
            persistSessionTasks(session, buildTasks(specs, statusMap))
            return { ok: false as const, error: e }
          }
        })
      )

      const failure = settled.find((r) => !r.ok)
      if (failure && !failure.ok) {
        statusMap.set(node.id, 'failed')
        persistSessionTasks(session, buildTasks(specs, statusMap))
        const err = failure.error
        if (err instanceof Error && err.message === '__aborted__') throw err
        throw err instanceof Error ? err : new Error(String(err))
      }

      let merged = { ...baseContext }
      for (const r of settled) {
        if (r.ok) merged = { ...merged, ...r.context }
      }
      statusMap.set(node.id, 'done')
      persistSessionTasks(session, buildTasks(specs, statusMap))
      return patchRun(run, { context: merged, status: 'running' })
    }

    // 含 agent / await：串行，保证 Session ReAct 独占
    for (const child of node.children) {
      statusMap.set(child.id, 'running')
      persistSessionTasks(session, buildTasks(specs, statusMap))
      try {
        run = await executeLeafNode(session, child, run, signal)
        statusMap.set(child.id, 'done')
        persistSessionTasks(session, buildTasks(specs, statusMap))
      } catch (e) {
        if (e instanceof Error && e.message === '__aborted__') throw e
        statusMap.set(child.id, 'failed')
        statusMap.set(node.id, 'failed')
        persistSessionTasks(session, buildTasks(specs, statusMap))
        throw e
      }
    }
    statusMap.set(node.id, 'done')
    persistSessionTasks(session, buildTasks(specs, statusMap))
    return run
  } catch (e) {
    if (!(e instanceof Error && e.message === '__aborted__')) {
      if (statusMap.get(node.id) !== 'failed') {
        statusMap.set(node.id, 'failed')
        persistSessionTasks(session, buildTasks(specs, statusMap))
      }
    }
    throw e
  }
}

function findResumeIndex(nodes: WorkflowNode[], cursorNodeId: string | null): number {
  if (!cursorNodeId) return 0
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i]
    if (n.id === cursorNodeId) return i
    if (n.type === 'parallel' && n.children.some((c) => c.id === cursorNodeId)) {
      return i
    }
    if (
      n.type === 'condition' &&
      n.cases.some((arm) => arm.nodes.some((c) => c.id === cursorNodeId))
    ) {
      return i
    }
  }
  return 0
}

async function executeWorkflowRun(runId: string, fromStart: boolean): Promise<void> {
  const { executeWorkflowWithLangGraph } = await import('./compile-to-langgraph')
  await executeWorkflowWithLangGraph(runId, fromStart)
}

/**
 * 准备 Run 执行上下文（任务骨架、abort、开场消息）。
 * LangGraph 与节点执行共用。
 */
export function __graphApi_prepareWorkflowRun(
  runId: string,
  fromStart: boolean
): {
  workflow: WorkflowDefinition
  session: Session
  run: WorkflowRun
  specs: FlatTaskSpec[]
  statusMap: Map<string, TaskItemStatus>
  startIndex: number
  signal: AbortSignal
} | null {
  let run = queryWorkflowRun(runId)
  if (!run) return null

  const workflow = queryWorkflow(run.workflowId)
  if (!workflow) {
    patchRun(run, { status: 'failed', errorMessage: '工作流定义不存在' })
    emitError(run.sessionId, '工作流定义不存在')
    emitDone(run.sessionId, 'error')
    return null
  }

  const sessionId = run.sessionId
  if (runningBySession.has(sessionId)) {
    return null
  }
  runningBySession.add(sessionId)

  const liveSession = querySession(sessionId)
  if (!liveSession) {
    patchRun(run, { status: 'failed', errorMessage: '会话不存在' })
    emitError(sessionId, '会话不存在')
    emitDone(sessionId, 'error')
    runningBySession.delete(sessionId)
    return null
  }

  const specs = flattenTaskSpecs(workflow.nodes)
  const statusMap = new Map<string, TaskItemStatus>()
  for (const s of specs) {
    statusMap.set(s.id, 'pending')
  }

  const startIndex = fromStart ? 0 : findResumeIndex(workflow.nodes, run.cursorNodeId)
  for (let i = 0; i < startIndex; i++) {
    const n = workflow.nodes[i]
    statusMap.set(n.id, 'done')
    if (n.type === 'parallel') {
      for (const c of n.children) statusMap.set(c.id, 'done')
    }
    if (n.type === 'condition') {
      for (const arm of n.cases) {
        for (const c of arm.nodes) statusMap.set(c.id, 'done')
      }
    }
  }
  persistSessionTasks(liveSession, buildTasks(specs, statusMap))

  const controller = bindGraphSessionAbort(sessionId)
  run = patchRun(run, { status: 'running', errorMessage: undefined })

  if (fromStart) {
    appendWorkflowMessage(liveSession, {
      role: 'assistant',
      content: `开始执行流程「${workflow.title}」。`
    })
  } else {
    appendWorkflowMessage(liveSession, {
      role: 'assistant',
      content: `继续执行流程「${workflow.title}」。`
    })
  }

  return {
    workflow,
    session: liveSession,
    run,
    specs,
    statusMap,
    startIndex,
    signal: controller.signal
  }
}

/** 供 LangGraph advance 节点调用 */
export async function __graphApi_executeTopLevelNode(
  sessionId: string,
  node: WorkflowNode,
  run: WorkflowRun,
  statusMap: Map<string, TaskItemStatus>,
  specs: FlatTaskSpec[],
  session: Session,
  signal: AbortSignal
): Promise<WorkflowRun> {
  return executeTopLevelNode(sessionId, node, run, statusMap, specs, session, signal)
}

/** 结束 Run：写状态、推送事件、释放锁 */
export function __graphApi_finalizeWorkflowRun(
  runId: string,
  sessionId: string,
  outcome: 'success' | 'aborted' | 'failed',
  errorMessage?: string
): void {
  const run = queryWorkflowRun(runId)
  const session = querySession(sessionId)
  try {
    if (!run) return
    if (outcome === 'success') {
      patchRun(run, { status: 'success', cursorNodeId: null })
      if (session) {
        appendWorkflowMessage(session, { role: 'assistant', content: '流程执行完毕。' })
      }
      emitDone(sessionId, 'workflow_success')
    } else if (outcome === 'aborted') {
      patchRun(run, { status: 'aborted' })
      if (session) {
        appendWorkflowMessage(session, { role: 'assistant', content: '流程已中止。' })
      }
      emitDone(sessionId, 'aborted')
    } else {
      const message = errorMessage || '未知错误'
      patchRun(run, { status: 'failed', errorMessage: message })
      if (session) {
        appendWorkflowMessage(session, {
          role: 'assistant',
          content: `流程执行失败：${message}`
        })
      }
      emitError(sessionId, message)
      emitDone(sessionId, 'error')
    }
  } finally {
    releaseGraphSessionAbort(sessionId)
    runningBySession.delete(sessionId)
  }
}

export interface PostRunWorkflowOptions {
  /**
   * 复用已创建的会话（定时任务需带 schedule 类型并 registerScheduleSession）。
   * 未传则新建 type=workflow 会话。
   */
  session?: Session
}

/** 启动工作流：创建（或复用）Session + Run，异步推进节点 */
export async function postRunWorkflow(
  workflowId: string,
  options?: PostRunWorkflowOptions
): Promise<WorkflowRunStartResult> {
  // 发布计划 id 与镜像工作流对齐：缺失时惰性从计划编译
  const workflow =
    queryWorkflow(workflowId) ?? queryOrMigratePublishWorkflow(workflowId)
  if (!workflow) {
    throw new Error('工作流不存在')
  }
  if (!workflow.nodes.length) {
    throw new Error('请先为流程添加至少一个步骤')
  }

  const session = options?.session ?? createWorkflowSession(workflow)
  if (!options?.session) {
    postSession(session)
    emitSessionStarted(session)
  } else if (!querySession(session.id)) {
    postSession(session)
    emitSessionStarted(session)
  }

  const now = Date.now()
  const run = postWorkflowRun({
    id: crypto.randomUUID(),
    workflowId: workflow.id,
    sessionId: session.id,
    status: 'pending',
    cursorNodeId: null,
    context: {},
    createdAt: now,
    updatedAt: now
  })

  void executeWorkflowRun(run.id, true)
  return { run, sessionId: session.id }
}

/**
 * 从失败/中止处继续：复用原 Session，自 cursor 所在顶层节点重试。
 */
export async function postResumeWorkflow(runId: string): Promise<WorkflowRunStartResult> {
  const run = queryWorkflowRun(runId)
  if (!run) {
    throw new Error('运行实例不存在')
  }
  if (run.status === 'running' || run.status === 'awaiting_user') {
    throw new Error('该流程正在执行中')
  }
  if (run.status === 'success') {
    throw new Error('该流程已成功结束')
  }

  const next = patchRun(run, { status: 'pending', errorMessage: undefined })
  void executeWorkflowRun(next.id, false)
  return { run: next, sessionId: next.sessionId }
}
