/**
 * 用户确认恢复：将按钮 choiceId 或聊天文字解析为结构化方案选择。
 */
import type { AgentContinuePayload, UserChoiceOption } from '../../../shared/types'

/** 用户点击继续后解析出的结构化结果 */
export interface UserContinueResult {
  userInput?: string
  choiceId?: string
  choiceLabel?: string
}

/** 兼容旧版仅传字符串 userInput 的 IPC 载荷 */
export function normalizeContinuePayload(
  payload?: AgentContinuePayload | string
): AgentContinuePayload {
  if (typeof payload === 'string') {
    return { userInput: payload }
  }
  return payload ?? {}
}

/**
 * 合并显式 choiceId 与文字匹配，产出 Agent/工具可消费的继续结果。
 */
export function resolveUserContinue(
  payload: AgentContinuePayload,
  choices?: UserChoiceOption[]
): UserContinueResult {
  const userInput = payload.userInput?.trim() || undefined

  if (payload.choiceId && choices?.length) {
    const match = choices.find((c) => c.id === payload.choiceId)
    if (match) {
      return { userInput, choiceId: match.id, choiceLabel: match.label }
    }
  }

  if (userInput && choices?.length) {
    const fromText = resolveChoiceFromText(userInput, choices)
    if (fromText) {
      return { userInput, choiceId: fromText.id, choiceLabel: fromText.label }
    }
  }

  if (payload.choiceId) {
    return { userInput, choiceId: payload.choiceId }
  }

  return { userInput }
}

/** 将选择结果格式化为写入会话的用户消息 */
export function formatUserContinueMessage(result: UserContinueResult): string | undefined {
  const { userInput, choiceLabel } = result
  if (!choiceLabel && !userInput) return undefined
  const parts: string[] = []
  if (choiceLabel) parts.push(`【已选：${choiceLabel}】`)
  if (userInput) parts.push(userInput)
  return parts.join('') || undefined
}

function resolveChoiceFromText(
  text: string,
  choices: UserChoiceOption[]
): UserChoiceOption | null {
  const trimmed = text.trim()
  if (!trimmed) return null

  for (const choice of choices) {
    if (trimmed === choice.id || trimmed === choice.label) return choice
  }

  const index = parseChoiceIndex(trimmed, choices.length)
  if (index != null) return choices[index] ?? null

  const labelMatches = choices.filter(
    (c) => trimmed.includes(c.label) || c.label.includes(trimmed)
  )
  if (labelMatches.length === 1) return labelMatches[0] ?? null

  const idMatches = choices.filter((c) =>
    trimmed.toLowerCase().includes(c.id.toLowerCase())
  )
  if (idMatches.length === 1) return idMatches[0] ?? null

  return null
}

/** 从「方案1」「选A」「第一个」等表述解析 choices 下标 */
function parseChoiceIndex(text: string, count: number): number | null {
  const numMatch = text.match(/(?:方案|选|第)?\s*(\d+)\s*(?:个|项|号)?/i)
  if (numMatch) {
    const n = parseInt(numMatch[1]!, 10)
    if (n >= 1 && n <= count) return n - 1
  }

  const letterMatch = text.match(/(?:方案|选)?\s*([A-Za-z])\b/i)
  if (letterMatch) {
    const idx = letterMatch[1]!.toUpperCase().charCodeAt(0) - 'A'.charCodeAt(0)
    if (idx >= 0 && idx < count) return idx
  }

  const chineseNums: Record<string, number> = {
    一: 1,
    二: 2,
    三: 3,
    四: 4,
    五: 5
  }
  const cnMatch = text.match(/第([一二三四五])个/)
  if (cnMatch) {
    const n = chineseNums[cnMatch[1]!]
    if (n && n >= 1 && n <= count) return n - 1
  }

  return null
}

/** 用户输入是否表达取消意图（危险工具门禁等） */
export function queryIsUserCancelIntent(result: UserContinueResult): boolean {
  if (result.choiceId === 'cancel') return true
  const text = result.userInput?.trim() ?? ''
  if (!text) return false
  return /取消|不要|算了|停止|中止/.test(text)
}
