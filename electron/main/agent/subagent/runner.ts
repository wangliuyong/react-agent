/**
 * 子 Agent 运行时：隔离 thread 执行 ReAct，仅将摘要回传主 Agent。
 * 对齐 Claude Code Task/Subagent：中间 tool 调用不写入父 session messages。
 */
import {
  AIMessage,
  HumanMessage,
  ToolMessage,
  isAIMessage
} from '@langchain/core/messages'
import type { BaseMessage } from '@langchain/core/messages'
import {
  Command,
  GraphInterrupt,
  INTERRUPT,
  isGraphInterrupt,
  isInterrupted
} from '@langchain/langgraph'
import type {
  ChatMessage,
  SubagentMode,
  SubagentRunMeta,
  TaskItem
} from '../../../../shared/types'
import { querySubagentDefinition } from '../../store/agents'
import { querySettings } from '../../store/settings'
import { querySession, postSession } from '../../store/sessions'
import { buildStepReactGraph } from '../graph/chat-graph'
import { queryToolsForSubagent } from '../graph/role-tools'
import { queryRecursionLimit } from '../graph/react-subgraph'
import { sanitizeMessagesForModel, trimMessagesToCharBudget } from '../token-budget'
import type { ToolContext } from '../tools/types'
import type { AgentEvent } from '../../../../shared/types'

/**
 * 延迟加载 graph-bridge，避免与 tools → task-tool → runner 形成循环依赖。
 */
async function queryGraphBridge() {
  return import('../graph-bridge')
}

function uuidv4(): string {
  return crypto.randomUUID()
}

/** MVP：同一父会话内串行执行子 Agent，避免并发抢占 abort / 工具上下文 */
const parentQueues = new Map<string, Promise<unknown>>()

function enqueueForParent<T>(parentSessionId: string, job: () => Promise<T>): Promise<T> {
  const prev = parentQueues.get(parentSessionId) ?? Promise.resolve()
  const next = prev.then(job, job)
  parentQueues.set(
    parentSessionId,
    next.then(
      () => undefined,
      () => undefined
    )
  )
  return next
}

function queryReasonFromInterruptValue(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) return value
  if (value && typeof value === 'object' && typeof (value as { reason?: unknown }).reason === 'string') {
    return (value as { reason: string }).reason
  }
  return null
}

function extractInterruptReason(err: unknown): string | null {
  if (isGraphInterrupt(err) || err instanceof GraphInterrupt) {
    const interrupts = (err as GraphInterrupt).interrupts ?? []
    for (const item of interrupts) {
      const reason = queryReasonFromInterruptValue(item?.value)
      if (reason) return reason
    }
    return '需要用户确认后继续'
  }
  return null
}

function queryInterruptReasonFromChunk(chunk: unknown): string | null {
  if (!isInterrupted(chunk)) return null
  const list = (chunk as Record<string, Array<{ value?: unknown }>>)[INTERRUPT] ?? []
  for (const item of list) {
    const reason = queryReasonFromInterruptValue(item?.value)
    if (reason) return reason
  }
  return '需要用户确认后继续'
}

function queryInterruptReasonFromState(state: {
  tasks?: Array<{ interrupts?: Array<{ value?: unknown }> }>
}): string | null {
  const tasks = state.tasks ?? []
  for (const task of tasks) {
    for (const item of task.interrupts ?? []) {
      const reason = queryReasonFromInterruptValue(item?.value)
      if (reason) return reason
    }
  }
  return null
}

/** 从子 Agent 消息中提取最终 assistant 文本摘要 */
export function querySubagentSummary(messages: BaseMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const msg = messages[i]
    if (!isAIMessage(msg) && !AIMessage.isInstance(msg)) continue
    const ai = msg as AIMessage
    if (ai.tool_calls?.length) continue
    const content =
      typeof ai.content === 'string'
        ? ai.content
        : Array.isArray(ai.content)
          ? ai.content.map((c) => ('text' in c ? String(c.text) : '')).join('')
          : String(ai.content ?? '')
    if (content.trim()) return content.trim()
  }
  return '子 Agent 已结束，但未产出文本摘要。'
}

/** 父会话 ChatMessage → LangChain 消息（fork 模式） */
function sessionMessagesToLc(messages: ChatMessage[]): BaseMessage[] {
  const out: BaseMessage[] = []
  for (const m of messages) {
    if (m.role === 'user') {
      out.push(new HumanMessage(m.content))
    } else if (m.role === 'assistant') {
      // 与主会话一致：恢复 toolCalls，避免 fork 冷启动历史断裂
      if (m.toolCalls?.length) {
        out.push(
          new AIMessage({
            content: m.content,
            tool_calls: m.toolCalls.map((tc) => ({
              id: tc.id,
              name: tc.name,
              args: tc.args,
              type: 'tool_call' as const
            }))
          })
        )
      } else {
        out.push(new AIMessage(m.content))
      }
    } else if (m.role === 'tool') {
      out.push(
        new ToolMessage({
          content: m.content,
          tool_call_id: m.toolCallId || m.id,
          name: m.toolName
        })
      )
    }
  }
  return sanitizeMessagesForModel(trimMessagesToCharBudget(out))
}

/** 更新父 session 上的 subagentRuns 并落盘 */
function persistSubagentRun(parentSessionId: string, run: SubagentRunMeta): void {
  const session = querySession(parentSessionId)
  if (!session) return
  const runs = [...(session.subagentRuns ?? [])]
  const idx = runs.findIndex((r) => r.runId === run.runId)
  if (idx >= 0) runs[idx] = run
  else runs.push(run)
  session.subagentRuns = runs
  session.updatedAt = Date.now()
  postSession(session)
}

/**
 * 扫描子 Agent 新消息，向 UI 发射 subagent_tool，不写父 session。
 * @returns 新的已同步消息数
 */
function emitSubagentToolEvents(
  emit: (event: AgentEvent) => void,
  parentSessionId: string,
  runId: string,
  prevCount: number,
  messages: BaseMessage[]
): number {
  const fresh = messages.slice(prevCount)
  for (const msg of fresh) {
    if (ToolMessage.isInstance(msg)) {
      const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)
      emit({
        type: 'subagent_tool',
        sessionId: parentSessionId,
        runId,
        toolName: msg.name || 'tool',
        phase: 'result',
        result: content.slice(0, 2_000)
      })
      continue
    }
    if (isAIMessage(msg) || AIMessage.isInstance(msg)) {
      const ai = msg as AIMessage
      if (ai.tool_calls?.length) {
        for (const tc of ai.tool_calls) {
          emit({
            type: 'subagent_tool',
            sessionId: parentSessionId,
            runId,
            toolName: tc.name,
            phase: 'start'
          })
        }
      }
    }
  }
  return messages.length
}

export interface RunSubagentParams {
  parentSessionId: string
  agentType: string
  prompt: string
  mode?: SubagentMode
  /** UI 短描述 */
  description?: string
  attachmentPaths?: string[]
  signal?: AbortSignal
}

/**
 * 启动子 Agent：队列串行 → 隔离 thread → 摘要回传。
 * @returns 最终摘要字符串（供 task 工具返回主 Agent）
 */
export async function runSubagent(params: RunSubagentParams): Promise<string> {
  const {
    parentSessionId,
    agentType,
    prompt,
    mode = 'isolated',
    description,
    attachmentPaths = [],
    signal
  } = params

  return enqueueForParent(parentSessionId, () =>
    runSubagentJob({
      parentSessionId,
      agentType,
      prompt,
      mode,
      description,
      attachmentPaths,
      signal
    })
  )
}

async function runSubagentJob(params: Required<
  Pick<RunSubagentParams, 'parentSessionId' | 'agentType' | 'prompt' | 'mode' | 'attachmentPaths'>
> &
  Pick<RunSubagentParams, 'description' | 'signal'>): Promise<string> {
  const { parentSessionId, agentType, prompt, mode, description, attachmentPaths = [], signal } =
    params

  const bridge = await queryGraphBridge()
  const {
    emitAgentEvent,
    getGraphAbortSignal,
    waitForGraphUserContinue,
    queryGraphResumePayload,
    postGraphAbort
  } = bridge

  const def = querySubagentDefinition(agentType)
  if (!def) {
    throw new Error(`未知子 Agent 类型：${agentType}。可用类型见系统提示中的子 Agent 目录。`)
  }

  const parentSignal = signal ?? getGraphAbortSignal(parentSessionId)
  if (parentSignal?.aborted) {
    throw new Error('用户已中止')
  }

  const runId = uuidv4()
  const run: SubagentRunMeta = {
    runId,
    parentSessionId,
    agentType: def.id,
    mode,
    description: description?.trim() || def.name,
    status: 'running',
    startedAt: Date.now()
  }

  const finish = (status: SubagentRunMeta['status'], summary: string): void => {
    run.status = status
    run.summary = summary
    run.finishedAt = Date.now()
    persistSubagentRun(run.parentSessionId, run)
    emitAgentEvent({
      type: 'subagent_done',
      sessionId: run.parentSessionId,
      runId: run.runId,
      summary,
      status
    })
  }

  persistSubagentRun(parentSessionId, run)
  emitAgentEvent({
    type: 'subagent_start',
    sessionId: parentSessionId,
    run,
    prompt
  })

  const settings = querySettings()
  const tools = queryToolsForSubagent({
    allowlist: def.toolAllowlist,
    denylist: def.toolDenylist,
    forceDenyTask: true
  })
  const toolWhitelist = tools.map((t) => t.name)

  const toolCtx: ToolContext = {
    sessionId: parentSessionId,
    // 子 Agent 跳过危险确认；登录类仍会 await_user
    fullAccess: true,
    attachmentPaths,
    signal: parentSignal,
    emitAwaitUser: async (reason, choices) => {
      return waitForGraphUserContinue(parentSessionId, { reason, choices })
    },
    updateTasks: (updater) => {
      const current = querySession(parentSessionId)
      if (!current) return
      current.tasks = updater(current.tasks) as TaskItem[]
      current.updatedAt = Date.now()
      postSession(current)
      emitAgentEvent({ type: 'task_update', sessionId: parentSessionId, tasks: current.tasks })
    },
    emitToolProgress: (toolName, progress) => {
      emitAgentEvent({ type: 'tool_progress', sessionId: parentSessionId, toolName, progress })
    },
    postAbortAgent: () => {
      postGraphAbort(parentSessionId)
    }
  }

  const modeHint =
    mode === 'fork'
      ? '\n\n## 运行模式\n你继承了父会话的部分对话上下文（fork）。请聚焦当前任务，完成后输出精炼摘要。'
      : '\n\n## 运行模式\n你处于隔离上下文（isolated）。任务说明已自包含；完成后输出精炼摘要供主 Agent 使用。'

  const systemPrompt = `${def.systemPrompt}${modeHint}`
  const maxTurns = def.maxTurns ?? settings.maxTurns

  let agent
  try {
    agent = buildStepReactGraph({
      settings,
      toolCtx,
      systemPrompt,
      toolWhitelist,
      modelRole: def.modelRole ?? 'general'
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    finish('failed', message)
    throw e
  }

  const threadId = `${parentSessionId}:sub:${runId}`
  const config = {
    configurable: { thread_id: threadId },
    recursionLimit: queryRecursionLimit(maxTurns),
    signal: parentSignal
  }

  const humanContent =
    attachmentPaths.length > 0
      ? `${prompt}\n\n[附件]\n${attachmentPaths.join('\n')}`
      : prompt

  let seedMessages: BaseMessage[] = []
  if (mode === 'fork') {
    const session = querySession(parentSessionId)
    if (session?.messages?.length) {
      seedMessages = sessionMessagesToLc(session.messages)
    }
  }
  seedMessages = [...seedMessages, new HumanMessage(humanContent)]

  let synced = 0
  let input: { messages: BaseMessage[] } | Command = { messages: seedMessages }
  let lastMessages: BaseMessage[] = seedMessages

  try {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      if (parentSignal?.aborted) {
        finish('aborted', '用户已中止')
        throw new Error('用户已中止')
      }

      let resumeCommand: Command | null = null
      try {
        const stream = await agent.stream(input as Parameters<typeof agent.stream>[0], {
          ...config,
          streamMode: 'values'
        })
        for await (const state of stream) {
          if (parentSignal?.aborted) {
            finish('aborted', '用户已中止')
            throw new Error('用户已中止')
          }
          const chunkReason = queryInterruptReasonFromChunk(state)
          if (chunkReason) {
            const userInput = await waitForGraphUserContinue(parentSessionId, chunkReason)
            if (parentSignal?.aborted) {
              finish('aborted', '用户已中止')
              throw new Error('用户已中止')
            }
            resumeCommand = new Command({
              resume: queryGraphResumePayload(parentSessionId, userInput)
            })
            break
          }
          if (state && typeof state === 'object' && 'messages' in state) {
            lastMessages = (state as { messages: BaseMessage[] }).messages
            synced = emitSubagentToolEvents(
              emitAgentEvent,
              parentSessionId,
              runId,
              synced,
              lastMessages
            )
          }
        }
        if (resumeCommand) {
          input = resumeCommand
          continue
        }
      } catch (streamErr) {
        if (parentSignal?.aborted) {
          finish('aborted', '用户已中止')
          throw new Error('用户已中止')
        }
        const reason = extractInterruptReason(streamErr)
        if (reason) {
          const userInput = await waitForGraphUserContinue(parentSessionId, reason)
          if (parentSignal?.aborted) {
            finish('aborted', '用户已中止')
            throw new Error('用户已中止')
          }
          input = new Command({ resume: queryGraphResumePayload(parentSessionId, userInput) })
          continue
        }
        throw streamErr
      }

      const snap = await agent.getState(config)
      const interruptReason = queryInterruptReasonFromState(snap)
      if (interruptReason) {
        const userInput = await waitForGraphUserContinue(parentSessionId, interruptReason)
        if (parentSignal?.aborted) {
          finish('aborted', '用户已中止')
          throw new Error('用户已中止')
        }
        input = new Command({ resume: queryGraphResumePayload(parentSessionId, userInput) })
        continue
      }

      if (snap.values && typeof snap.values === 'object' && 'messages' in snap.values) {
        lastMessages = (snap.values as { messages: BaseMessage[] }).messages ?? lastMessages
      }

      const summary = querySubagentSummary(lastMessages)
      finish('done', summary)
      return summary
    }
  } catch (e) {
    if (
      parentSignal?.aborted ||
      (e instanceof Error && e.message === '用户已中止') ||
      (e instanceof Error && e.name === 'AgentUserCancelledError')
    ) {
      finish('aborted', '用户已中止')
      throw new Error('用户已中止')
    }
    const message = e instanceof Error ? e.message : String(e)
    if (/recursion/i.test(message)) {
      const summary = `${querySubagentSummary(lastMessages)}\n\n（达到最大工具轮次）`
      finish('failed', summary)
      return summary
    }
    finish('failed', message)
    throw e
  }
}
