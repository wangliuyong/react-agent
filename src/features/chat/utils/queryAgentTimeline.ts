import type { ChatMessage } from '@shared/types'

/** 用户消息条目 */
export interface TimelineUserItem {
  kind: 'user'
  message: ChatMessage
}

/**
 * 一轮 ReAct：助手叙述 + 本轮发起的工具结果。
 * tools 按 toolCalls 声明顺序排列；尚未返回的工具不会出现在列表中。
 */
export interface TimelineStepItem {
  kind: 'step'
  assistant: ChatMessage
  tools: ChatMessage[]
}

/** 无法配对到 assistant.toolCalls 的孤立 tool（兜底展示，避免丢 K 线等） */
export interface TimelineOrphanToolItem {
  kind: 'orphanTool'
  message: ChatMessage
}

export type TimelineItem = TimelineUserItem | TimelineStepItem | TimelineOrphanToolItem

/** 后端在无正文时写入的合成文案，UI 不应再展示 */
const SYNTHETIC_TOOL_CALL_PREFIX = /^调用工具\s*:/

/**
 * 识别 graph-bridge 在仅有 tool_calls 时写入的合成正文。
 * 例如：`调用工具: browser_navigate, browser_snapshot`
 */
export function queryIsSyntheticToolCallContent(content: string): boolean {
  return SYNTHETIC_TOOL_CALL_PREFIX.test(content.trim())
}

/**
 * 将扁平消息列表归并为执行时间线。
 * - user → 独立条目
 * - assistant(+toolCalls) → step，并吞掉紧随其后且 toolCallId 命中的 tool
 * - 无法配对的 tool → orphanTool
 */
export function queryAgentTimeline(messages: ChatMessage[]): TimelineItem[] {
  const items: TimelineItem[] = []
  let i = 0

  while (i < messages.length) {
    const msg = messages[i]!

    if (msg.role === 'user') {
      items.push({ kind: 'user', message: msg })
      i += 1
      continue
    }

    if (msg.role === 'assistant') {
      const declaredIds = new Set(
        (msg.toolCalls ?? []).map((tc) => tc.id).filter(Boolean)
      )
      const tools: ChatMessage[] = []
      let j = i + 1

      if (declaredIds.size > 0) {
        // 按声明顺序收集结果；允许中间夹杂尚未返回的空洞，但遇非 tool / 非本轮 id 则停止吞并
        const byCallId = new Map<string, ChatMessage>()
        while (j < messages.length) {
          const next = messages[j]!
          if (next.role !== 'tool') break
          const callId = next.toolCallId
          if (!callId || !declaredIds.has(callId)) break
          if (!byCallId.has(callId)) {
            byCallId.set(callId, next)
          }
          j += 1
          // 已收齐全部声明的工具结果时可提前结束
          if (byCallId.size >= declaredIds.size) break
        }
        for (const tc of msg.toolCalls ?? []) {
          const toolMsg = byCallId.get(tc.id)
          if (toolMsg) tools.push(toolMsg)
        }
      }

      items.push({ kind: 'step', assistant: msg, tools })
      i = j
      continue
    }

    if (msg.role === 'tool') {
      items.push({ kind: 'orphanTool', message: msg })
      i += 1
      continue
    }

    // system 等其它角色：跳过
    i += 1
  }

  return items
}

/**
 * 时间线末条是否已收到工具结果（用于「正在整理工具结果」）。
 * 仅有 toolCalls 声明、尚无结果时不算——那是等待执行，不是整理。
 */
export function queryTimelineEndsWithToolGroup(items: TimelineItem[]): boolean {
  const last = items[items.length - 1]
  if (!last) return false
  if (last.kind === 'orphanTool') return true
  if (last.kind === 'step') return last.tools.length > 0
  return false
}
