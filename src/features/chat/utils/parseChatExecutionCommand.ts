/** 聊天内可识别的执行指令类型 */
export type ChatExecutionCommandKind = 'schedule' | 'publish' | 'workflow'

export interface ChatExecutionCommand {
  kind: ChatExecutionCommandKind
  /** 用户输入中的目标名称（定时任务 / 发布任务 / 流程标题） */
  name: string
}

/**
 * 解析用户消息是否为「执行 xxx」类快捷指令。
 * 支持格式：执行定时任务xxx、执行定时任务：xxx、执行定时任务 xxx
 * 以及 运行定时任务 / 运行任务 / 运行流程 等同义前缀。
 */
export function parseChatExecutionCommand(content: string): ChatExecutionCommand | null {
  const trimmed = content.trim()
  if (!trimmed) return null

  const patterns: Array<{ kind: ChatExecutionCommandKind; regex: RegExp }> = [
    // 必须先匹配「定时任务」，避免被「执行任务」前缀截断
    { kind: 'schedule', regex: /^(?:执行|运行)定时任务[：:\s]*(.+)$/ },
    { kind: 'publish', regex: /^(?:执行|运行)任务[：:\s]*(.+)$/ },
    { kind: 'workflow', regex: /^(?:执行|运行)流程[：:\s]*(.+)$/ }
  ]

  for (const { kind, regex } of patterns) {
    const match = regex.exec(trimmed)
    if (!match) continue
    const name = match[1]?.trim()
    if (!name) return null
    return { kind, name }
  }

  return null
}
