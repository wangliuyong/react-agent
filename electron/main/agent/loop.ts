function uuidv4(): string { return crypto.randomUUID() }
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions'
import type { AgentEvent, ChatMessage, Session, TaskItem } from '../../../shared/types'
import { querySettings } from '../store/settings'
import { querySession, postSession } from '../store/sessions'
import { createLlmClient, streamChat } from './llm'
import { getAllTools, getToolByName } from './tools'
import { toOpenAiTools, type ToolContext } from './tools/types'
import { getMainWindow } from '../window'
import { queryEnabledSkillPrompt } from '../store/skills'
import { queryEnabledRulePrompt } from '../store/rules'
import { handleScheduleAgentDone } from '../schedule/agent-hook'

const BASE_SYSTEM_PROMPT = `你是跨平台桌面 AI 发布助手「灵犀」，擅长通过工具完成内容创作与多渠道发布自动化。

当前核心能力：帮助用户在小红书、抖音创作者中心发布图文笔记（视频号后续支持）。

工作方式（ReAct）：
1. 先用 update_task_list 列出清晰的任务步骤
2. 配图优先从网页获取：调用 fetch_web_images（传入内容来源 pageUrl，或 imageUrls 直链）
3. 用户本地上传图片仅为可选补充：可先 list_attachments；有附件可直接用，无附件不要强求用户上传
4. 生成合适的标题与正文（小红书标题建议 ≤20 字，抖音标题建议 ≤30 字）
5. 按目标渠道调用发布工具：
   - 小红书 → xhs_publish_note
   - 抖音图文 → douyin_publish_note
   把 fetch_web_images 得到的本地路径传入 imagePaths；也可直接传 imageSourceUrl 让工具内下载
6. 若发布失败，再用 browser_* 原子工具（拟人点击/打字）排查并重试
7. 每完成一步更新任务清单状态
8. 不要建议用脚本直接改 DOM；所有交互都应通过工具完成

注意：
- 未登录时工具会暂停等待用户扫码，你应告知用户去右侧「智能体浏览器」登录
- 不要编造已发布成功；以工具返回为准
- 用中文回复用户

小红书风控与内容规范（发布前必须遵守）：
- 行为：xhs_publish_note 已内置浏览热身、随机延迟与频次限制；勿建议用户绕过
- 节奏：单账号日更≤2篇、周更≤10篇；深夜0:00-6:00不发布；勿整点准点连发
- 内容：每篇笔记标题句式、正文结构、话题标签必须差异化，禁止一套模板只换关键词批量生成
- 配图：优先 fetch_web_images；发布前工具会对图片做轻量裁剪/缩放处理，仍建议结合原创素材
- 互动：若未来做评论/私信，须针对笔记内容生成不同回复，延迟≥5秒，禁止秒回与统一话术`

/**
 * 基础提示 + 用户规则（Always Apply）+ 项目技能。
 * 规则优先于技能：长期偏好/约束应覆盖技能中的一般性说明。
 */
function buildSystemPrompt(): string {
  const ruleBlock = queryEnabledRulePrompt()
  const skillBlock = queryEnabledSkillPrompt()
  const parts = [BASE_SYSTEM_PROMPT]

  if (ruleBlock) {
    parts.push(`## 用户规则（必须优先遵循）\n\n${ruleBlock}`)
  }
  if (skillBlock) {
    parts.push(`## 项目技能（开发规范与领域知识，请优先遵循）\n\n${skillBlock}`)
  }
  return parts.join('\n\n')
}

/** 每个会话一个 AbortController，支持停止 */
const abortMap = new Map<string, AbortController>()

/** await_user 时挂起，continue 时 resolve */
const continueWaiters = new Map<string, { resolve: () => void; reject: (e: Error) => void }>()

/**
 * 记录「带 tool_calls 的 assistant」元数据。
 * 本地 Session 用简化消息存储，调用 API 时再还原 tool_calls。
 */
interface PendingToolCallMeta {
  assistantMessageId: string
  toolCalls: Array<{ id: string; name: string; arguments: string }>
}

const pendingToolMeta = new Map<string, PendingToolCallMeta[]>()

function emit(event: AgentEvent): void {
  const win = getMainWindow()
  if (win && !win.isDestroyed()) {
    win.webContents.send('event:agent', event)
  }
  handleScheduleAgentDone(event)
}

function persistSession(session: Session): void {
  session.updatedAt = Date.now()
  postSession(session)
}

function appendMessage(session: Session, msg: Omit<ChatMessage, 'id' | 'createdAt'>): ChatMessage {
  const full: ChatMessage = {
    id: uuidv4(),
    createdAt: Date.now(),
    ...msg
  }
  session.messages.push(full)
  return full
}

/**
 * 将本地 Session 转为 OpenAI messages。
 * 若某条 assistant 后紧跟 tool 消息，从 pendingToolMeta / tool 字段还原 tool_calls。
 */
function buildApiMessages(session: Session): ChatCompletionMessageParam[] {
  const msgs: ChatCompletionMessageParam[] = [{ role: 'system', content: buildSystemPrompt() }]
  const recent = session.messages.slice(-50)
  const metas = pendingToolMeta.get(session.id) ?? []

  let i = 0
  while (i < recent.length) {
    const m = recent[i]
    if (m.role === 'user') {
      msgs.push({ role: 'user', content: m.content })
      i += 1
      continue
    }
    if (m.role === 'assistant') {
      const toolMsgs: ChatMessage[] = []
      let j = i + 1
      while (j < recent.length && recent[j].role === 'tool') {
        toolMsgs.push(recent[j])
        j += 1
      }
      if (toolMsgs.length > 0) {
        const meta = metas.find((x) => x.assistantMessageId === m.id)
        const toolCalls =
          meta?.toolCalls.map((tc) => ({
            id: tc.id,
            type: 'function' as const,
            function: { name: tc.name, arguments: tc.arguments || '{}' }
          })) ??
          toolMsgs.map((t) => ({
            id: t.toolCallId || uuidv4(),
            type: 'function' as const,
            function: { name: t.toolName || 'unknown', arguments: '{}' }
          }))

        msgs.push({
          role: 'assistant',
          content: m.content || null,
          tool_calls: toolCalls
        })
        for (let k = 0; k < toolMsgs.length; k++) {
          const t = toolMsgs[k]
          msgs.push({
            role: 'tool',
            tool_call_id: toolCalls[k]?.id || t.toolCallId || 'unknown',
            content: t.content
          })
        }
        i = j
      } else if (m.content) {
        msgs.push({ role: 'assistant', content: m.content })
        i += 1
      } else {
        i += 1
      }
      continue
    }
    i += 1
  }
  return msgs
}

export function postAgentAbort(sessionId: string): void {
  abortMap.get(sessionId)?.abort()
  abortMap.delete(sessionId)
  const waiter = continueWaiters.get(sessionId)
  if (waiter) {
    waiter.reject(new Error('用户已中止'))
    continueWaiters.delete(sessionId)
  }
}

export function postAgentContinue(sessionId: string): void {
  const waiter = continueWaiters.get(sessionId)
  if (waiter) {
    waiter.resolve()
    continueWaiters.delete(sessionId)
  }
}

/**
 * 为会话绑定 AbortController（工作流引擎在整次 Run 期间持有）。
 * 会先中止该会话上一次执行，避免双循环抢事件。
 */
export function bindSessionAbort(sessionId: string): AbortController {
  postAgentAbort(sessionId)
  const controller = new AbortController()
  abortMap.set(sessionId, controller)
  return controller
}

/** 释放引擎持有的 abort 句柄（不主动 abort） */
export function releaseSessionAbort(sessionId: string): void {
  abortMap.delete(sessionId)
}

/** 供工作流 await_user 节点与敏感工具确认复用 */
export async function waitForUserContinue(sessionId: string, reason: string): Promise<void> {
  emit({ type: 'await_user', sessionId, reason })
  await new Promise<void>((resolve, reject) => {
    continueWaiters.set(sessionId, { resolve, reject })
  })
}

/**
 * Claude Code 式 ReAct 主循环：
 * 调模型 → 若有 tool_calls 则执行并回灌 → 直到 end_turn / 中止 / 达上限。
 */
export async function runAgentChat(params: {
  sessionId: string
  content: string
  attachmentPaths?: string[]
}): Promise<void> {
  const { sessionId, content, attachmentPaths = [] } = params
  const settings = querySettings()
  let session = querySession(sessionId)
  if (!session) {
    throw new Error(`会话不存在: ${sessionId}`)
  }

  postAgentAbort(sessionId)
  const controller = new AbortController()
  abortMap.set(sessionId, controller)

  const userMsg = appendMessage(session, {
    role: 'user',
    content:
      attachmentPaths.length > 0
        ? `${content}\n\n[附件]\n${attachmentPaths.join('\n')}`
        : content,
    attachmentPaths: attachmentPaths.length > 0 ? attachmentPaths : undefined
  })
  if (session.title === '新对话' || session.title === '新会话') {
    session.title = content.slice(0, 24) || '新对话'
  }
  persistSession(session)
  emit({ type: 'message', sessionId, message: userMsg })

  let client
  try {
    client = createLlmClient(settings)
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    emit({ type: 'error', sessionId, message })
    emit({ type: 'done', sessionId, reason: 'error' })
    return
  }

  const openAiTools = toOpenAiTools(getAllTools())

  const toolCtx: ToolContext = {
    sessionId,
    fullAccess: settings.fullAccess,
    attachmentPaths,
    signal: controller.signal,
    emitAwaitUser: async (reason) => {
      await waitForUserContinue(sessionId, reason)
    },
    updateTasks: (updater) => {
      const current = querySession(sessionId) ?? session
      if (!current) return
      current.tasks = updater(current.tasks) as TaskItem[]
      session = current
      persistSession(current)
      emit({ type: 'task_update', sessionId, tasks: current.tasks })
    }
  }

  let turns = 0
  try {
    while (turns < settings.maxTurns) {
      if (controller.signal.aborted) {
        emit({ type: 'done', sessionId, reason: 'aborted' })
        return
      }
      turns += 1
      session = querySession(sessionId) ?? session

      const assistantId = uuidv4()
      let assistantContent = ''
      const placeholder: ChatMessage = {
        id: assistantId,
        role: 'assistant',
        content: '',
        createdAt: Date.now()
      }
      session.messages.push(placeholder)
      persistSession(session)
      emit({ type: 'message', sessionId, message: placeholder })

      // 组装 API 消息时排除刚插入的空 assistant 占位
      const apiMessages = buildApiMessages({
        ...session,
        messages: session.messages.filter((m) => m.id !== assistantId)
      })

      const result = await streamChat({
        client,
        model: settings.model,
        messages: apiMessages,
        tools: openAiTools,
        signal: controller.signal,
        onTextDelta: (delta) => {
          assistantContent += delta
          emit({ type: 'text_delta', sessionId, delta })
        }
      })

      assistantContent = result.content || assistantContent
      session = querySession(sessionId) ?? session
      const idx = session.messages.findIndex((m) => m.id === assistantId)
      if (idx >= 0) {
        session.messages[idx] = {
          ...session.messages[idx],
          content:
            assistantContent ||
            (result.toolCalls.length
              ? `调用工具: ${result.toolCalls.map((t) => t.name).join(', ')}`
              : '')
        }
      }
      session.tokenUsed += Math.ceil((assistantContent.length + content.length) / 4)
      persistSession(session)
      if (idx >= 0) {
        emit({ type: 'message', sessionId, message: session.messages[idx] })
      }

      if (!result.toolCalls.length) {
        emit({ type: 'done', sessionId, reason: 'end_turn' })
        return
      }

      const toolCallPayload = result.toolCalls.map((tc) => ({
        id: tc.id || uuidv4(),
        name: tc.name,
        arguments: tc.arguments || '{}'
      }))

      // 保存 tool_calls 元数据，供下一轮 buildApiMessages 还原
      const metas = pendingToolMeta.get(sessionId) ?? []
      metas.push({ assistantMessageId: assistantId, toolCalls: toolCallPayload })
      pendingToolMeta.set(sessionId, metas)

      for (const tc of toolCallPayload) {
        if (controller.signal.aborted) {
          emit({ type: 'done', sessionId, reason: 'aborted' })
          return
        }
        let args: Record<string, unknown> = {}
        try {
          args = JSON.parse(tc.arguments || '{}') as Record<string, unknown>
        } catch {
          args = {}
        }

        emit({ type: 'tool_start', sessionId, toolName: tc.name, args })

        const tool = getToolByName(tc.name)
        let toolResult: string
        if (!tool) {
          toolResult = `未知工具: ${tc.name}`
        } else {
          try {
            const publishToolsWithInlineConfirm = new Set([
              'xhs_publish_note',
              'douyin_publish_note'
            ])
            if (
              tool.permission === 'dangerous' &&
              !settings.fullAccess &&
              !publishToolsWithInlineConfirm.has(tool.name)
            ) {
              await waitForUserContinue(sessionId, `即将执行敏感工具「${tool.name}」，确认后继续`)
            }
            toolResult = await tool.execute(args, toolCtx)
          } catch (err) {
            toolResult = `工具执行失败: ${err instanceof Error ? err.message : String(err)}`
          }
        }

        emit({ type: 'tool_result', sessionId, toolName: tc.name, result: toolResult })

        session = querySession(sessionId) ?? session
        const toolMsg = appendMessage(session, {
          role: 'tool',
          content: toolResult,
          toolName: tc.name,
          toolCallId: tc.id
        })
        persistSession(session)
        emit({ type: 'message', sessionId, message: toolMsg })
      }
    }
    emit({ type: 'done', sessionId, reason: 'max_turns' })
  } catch (e) {
    if (controller.signal.aborted) {
      emit({ type: 'done', sessionId, reason: 'aborted' })
      return
    }
    const message = e instanceof Error ? e.message : String(e)
    emit({ type: 'error', sessionId, message })
    emit({ type: 'done', sessionId, reason: 'error' })
  } finally {
    abortMap.delete(sessionId)
  }
}

export type AgentStepResult = 'completed' | 'aborted' | 'error' | 'max_turns'

/**
 * 工作流单步：在已有会话上追加一步目标并跑受限 ReAct。
 * 不重置 abortMap（由引擎 bindSessionAbort 持有），步间可继续用同一 signal。
 */
export async function runAgentStep(params: {
  sessionId: string
  prompt: string
  toolWhitelist?: string[]
  attachmentPaths?: string[]
}): Promise<AgentStepResult> {
  const { sessionId, prompt, toolWhitelist, attachmentPaths = [] } = params
  const settings = querySettings()
  let session = querySession(sessionId)
  if (!session) {
    throw new Error(`会话不存在: ${sessionId}`)
  }

  let controller = abortMap.get(sessionId)
  if (!controller || controller.signal.aborted) {
    controller = new AbortController()
    abortMap.set(sessionId, controller)
  }

  const userMsg = appendMessage(session, {
    role: 'user',
    content:
      attachmentPaths.length > 0
        ? `${prompt}\n\n[附件]\n${attachmentPaths.join('\n')}`
        : prompt,
    attachmentPaths: attachmentPaths.length > 0 ? attachmentPaths : undefined
  })
  persistSession(session)
  emit({ type: 'message', sessionId, message: userMsg })

  let client
  try {
    client = createLlmClient(settings)
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    emit({ type: 'error', sessionId, message })
    return 'error'
  }

  const allTools = getAllTools()
  const tools =
    toolWhitelist && toolWhitelist.length > 0
      ? allTools.filter((t) => toolWhitelist.includes(t.name))
      : allTools
  const openAiTools = toOpenAiTools(tools)

  const toolCtx: ToolContext = {
    sessionId,
    fullAccess: settings.fullAccess,
    attachmentPaths,
    signal: controller.signal,
    emitAwaitUser: async (reason) => {
      await waitForUserContinue(sessionId, reason)
    },
    updateTasks: (updater) => {
      // 工作流运行时阶段结构由引擎权威维护；此处仍允许模型微调标题/状态供调试
      const current = querySession(sessionId) ?? session
      if (!current) return
      current.tasks = updater(current.tasks) as TaskItem[]
      session = current
      persistSession(current)
      emit({ type: 'task_update', sessionId, tasks: current.tasks })
    }
  }

  let turns = 0
  try {
    while (turns < settings.maxTurns) {
      if (controller.signal.aborted) {
        return 'aborted'
      }
      turns += 1
      session = querySession(sessionId) ?? session

      const assistantId = uuidv4()
      let assistantContent = ''
      const placeholder: ChatMessage = {
        id: assistantId,
        role: 'assistant',
        content: '',
        createdAt: Date.now()
      }
      session.messages.push(placeholder)
      persistSession(session)
      emit({ type: 'message', sessionId, message: placeholder })

      const apiMessages = buildApiMessages({
        ...session,
        messages: session.messages.filter((m) => m.id !== assistantId)
      })

      const result = await streamChat({
        client,
        model: settings.model,
        messages: apiMessages,
        tools: openAiTools,
        signal: controller.signal,
        onTextDelta: (delta) => {
          assistantContent += delta
          emit({ type: 'text_delta', sessionId, delta })
        }
      })

      assistantContent = result.content || assistantContent
      session = querySession(sessionId) ?? session
      const idx = session.messages.findIndex((m) => m.id === assistantId)
      if (idx >= 0) {
        session.messages[idx] = {
          ...session.messages[idx],
          content:
            assistantContent ||
            (result.toolCalls.length
              ? `调用工具: ${result.toolCalls.map((t) => t.name).join(', ')}`
              : '')
        }
      }
      session.tokenUsed += Math.ceil((assistantContent.length + prompt.length) / 4)
      persistSession(session)
      if (idx >= 0) {
        emit({ type: 'message', sessionId, message: session.messages[idx] })
      }

      if (!result.toolCalls.length) {
        return 'completed'
      }

      const toolCallPayload = result.toolCalls.map((tc) => ({
        id: tc.id || uuidv4(),
        name: tc.name,
        arguments: tc.arguments || '{}'
      }))

      const metas = pendingToolMeta.get(sessionId) ?? []
      metas.push({ assistantMessageId: assistantId, toolCalls: toolCallPayload })
      pendingToolMeta.set(sessionId, metas)

      for (const tc of toolCallPayload) {
        if (controller.signal.aborted) {
          return 'aborted'
        }
        let args: Record<string, unknown> = {}
        try {
          args = JSON.parse(tc.arguments || '{}') as Record<string, unknown>
        } catch {
          args = {}
        }

        emit({ type: 'tool_start', sessionId, toolName: tc.name, args })

        const tool = getToolByName(tc.name)
        let toolResult: string
        if (!tool) {
          toolResult = `未知工具: ${tc.name}`
        } else if (toolWhitelist?.length && !toolWhitelist.includes(tc.name)) {
          toolResult = `工具「${tc.name}」不在本步骤白名单内`
        } else {
          try {
            const publishToolsWithInlineConfirm = new Set([
              'xhs_publish_note',
              'douyin_publish_note'
            ])
            if (
              tool.permission === 'dangerous' &&
              !settings.fullAccess &&
              !publishToolsWithInlineConfirm.has(tool.name)
            ) {
              await waitForUserContinue(sessionId, `即将执行敏感工具「${tool.name}」，确认后继续`)
            }
            toolResult = await tool.execute(args, toolCtx)
          } catch (err) {
            toolResult = `工具执行失败: ${err instanceof Error ? err.message : String(err)}`
          }
        }

        emit({ type: 'tool_result', sessionId, toolName: tc.name, result: toolResult })

        session = querySession(sessionId) ?? session
        const toolMsg = appendMessage(session, {
          role: 'tool',
          content: toolResult,
          toolName: tc.name,
          toolCallId: tc.id
        })
        persistSession(session)
        emit({ type: 'message', sessionId, message: toolMsg })
      }
    }
    return 'max_turns'
  } catch (e) {
    if (controller.signal.aborted) {
      return 'aborted'
    }
    const message = e instanceof Error ? e.message : String(e)
    emit({ type: 'error', sessionId, message })
    return 'error'
  }
}
