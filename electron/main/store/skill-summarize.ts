import { HumanMessage, SystemMessage } from '@langchain/core/messages'
import type { SkillUpsertInput } from '../../../shared/types'
import {
  formatContextJson,
  formatMessagesForLlm,
  querySuccessfulTaskExecutionContexts
} from '../../../shared/session-task-context'
import {
  SKILL_SUMMARIZE_LLM_SYSTEM,
  buildFallbackSkillFromTasks,
  parseSkillSummarizeJson
} from '../../../shared/skill-summarize'
import { createChatModel } from '../agent/llm-langchain'
import { querySession } from './sessions'
import { querySettings } from './settings'
import { queryLatestWorkflowRunBySession } from './workflow-runs'

/** 从 LLM 响应中提取文本内容 */
function queryLlmTextContent(content: unknown): string {
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    return content
      .map((block) => {
        if (typeof block === 'string') return block
        if (block && typeof block === 'object' && 'text' in block) {
          return String((block as { text?: unknown }).text ?? '')
        }
        return ''
      })
      .join('')
  }
  return String(content ?? '')
}

/** 构建供 LLM 阅读的任务执行摘要 */
function buildSummarizePrompt(sessionId: string): string {
  const session = querySession(sessionId)
  if (!session) {
    throw new Error('会话不存在')
  }

  const workflowRun = queryLatestWorkflowRunBySession(sessionId)
  const contexts = querySuccessfulTaskExecutionContexts(session, workflowRun?.context)

  if (contexts.length === 0) {
    throw new Error('没有成功执行的步骤可总结，请先完成至少一个任务步骤')
  }

  const sessionTitle = session.title?.trim() || '未命名会话'
  const sessionType = session.type ?? 'chat'

  const stepBlocks = contexts.map((ctx, index) => {
    const messagesText = formatMessagesForLlm(ctx.relatedMessages)
    const contextJson = formatContextJson(ctx.contextSlice)
    return [
      `### 步骤 ${index + 1}：${ctx.task.title}`,
      `状态：${ctx.task.status}`,
      '',
      '关联对话：',
      messagesText,
      '',
      '上下文数据：',
      contextJson || '（无）'
    ].join('\n')
  })

  return [
    `会话标题：${sessionTitle}`,
    `会话类型：${sessionType}`,
    `成功步骤数：${contexts.length}`,
    '',
    '以下为已成功执行的步骤及执行记录（失败/跳过/未执行步骤已剔除）：',
    '',
    stepBlocks.join('\n\n---\n\n')
  ].join('\n')
}

/**
 * 从会话成功步骤总结技能草稿。
 * 优先调用 LLM 生成结构化 SkillUpsertInput；无 API Key 或调用失败时使用规则兜底。
 */
export async function postSummarizeSkillFromSession(sessionId: string): Promise<SkillUpsertInput> {
  const trimmedId = sessionId.trim()
  if (!trimmedId) {
    throw new Error('缺少 sessionId')
  }

  const session = querySession(trimmedId)
  if (!session) {
    throw new Error('会话不存在')
  }

  const contexts = querySuccessfulTaskExecutionContexts(
    session,
    queryLatestWorkflowRunBySession(trimmedId)?.context
  )
  if (contexts.length === 0) {
    throw new Error('没有成功执行的步骤可总结')
  }

  const prompt = buildSummarizePrompt(trimmedId)
  const settings = querySettings()

  if (settings.apiKey) {
    try {
      const model = createChatModel(settings).withConfig({
        response_format: { type: 'json_object' }
      })
      const result = await model.invoke([
        new SystemMessage(SKILL_SUMMARIZE_LLM_SYSTEM),
        new HumanMessage(`请根据以下任务执行记录总结为 Agent Skill：\n\n${prompt}`)
      ])
      const parsed = parseSkillSummarizeJson(queryLlmTextContent(result.content))
      if (parsed) return parsed
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.warn('[skill-summarize] LLM failed, fallback to template:', msg)
    }
  }

  return buildFallbackSkillFromTasks(
    session.title?.trim() || '任务执行',
    contexts.map((ctx) => ctx.task.title)
  )
}
