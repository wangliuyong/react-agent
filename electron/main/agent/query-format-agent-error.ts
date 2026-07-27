/**
 * Agent 报错文案：附带工具名 / 角色名 / Agent 名，便于定位失败位置。
 */
import { AIMessage, ToolMessage, isAIMessage } from '@langchain/core/messages'
import type { BaseMessage } from '@langchain/core/messages'
import { queryAgentRoleLabel } from '../../../shared/agent-role-registry'
import type { AppSettings } from '../../../shared/types'

export interface AgentErrorContext {
  /** 工具英文名，如 fetch_hot_topics */
  toolName?: string | null
  /** 角色 id，如 researcher；或已是展示名 */
  roleId?: string | null
  /** 角色展示名；有值时优先于 roleId 解析 */
  roleName?: string | null
  /** 子图 / Agent 名称，如 role_researcher、workflow_step_agent */
  agentName?: string | null
  /** 实际模型连接标签，如 文生图 / 通用对话 */
  connectionLabel?: string | null
  /** 供应商 id，如 dashscope / deepseek */
  provider?: string | null
  /** 模型 id，如 qwen-plus */
  model?: string | null
}

/**
 * 将原始错误与上下文拼成用户可见文案。
 * 形如：`Access denied（工具：fetch_hot_topics，角色：调研员，Agent：role_researcher，连接：文生图 · dashscope · qwen-plus）`
 */
export function queryFormatAgentErrorMessage(
  message: string,
  ctx: AgentErrorContext = {},
  settings?: Pick<AppSettings, 'customAgentRoles'>
): string {
  const base = message.trim() || '执行失败'
  // 已含角色与 Agent 上下文时避免重复追加（连接信息可再补一次则跳过整段）
  if (/（(?:工具：.+，)?角色：.+，Agent：.+/.test(base)) return base

  const toolName = ctx.toolName?.trim() || ''
  const roleName =
    ctx.roleName?.trim() ||
    (ctx.roleId?.trim() ? queryAgentRoleLabel(ctx.roleId.trim(), settings) : '')
  const agentName = ctx.agentName?.trim() || ''
  const connectionBits = [ctx.connectionLabel, ctx.provider, ctx.model]
    .map((x) => x?.trim())
    .filter(Boolean)
  const connectionText = connectionBits.length ? connectionBits.join(' · ') : ''

  const parts: string[] = []
  if (toolName) parts.push(`工具：${toolName}`)
  if (roleName) parts.push(`角色：${roleName}`)
  if (agentName) parts.push(`Agent：${agentName}`)
  if (connectionText) parts.push(`连接：${connectionText}`)
  if (!parts.length) return base
  return `${base}（${parts.join('，')}）`
}

/** 从消息链倒序取最近一次工具名（tool 结果或 pending tool_calls） */
export function queryLastToolNameFromMessages(messages: BaseMessage[]): string | undefined {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i]
    if (ToolMessage.isInstance(msg)) {
      const name = String(msg.name ?? '').trim()
      if (name) return name
    }
    if (isAIMessage(msg) || AIMessage.isInstance(msg)) {
      const calls = (msg as AIMessage).tool_calls
      if (calls?.length) {
        const name = String(calls[calls.length - 1]?.name ?? '').trim()
        if (name) return name
      }
    }
  }
  return undefined
}
