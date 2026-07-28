import type { ChatMessage, ChatMessageToolCall } from '@shared/types'
import { queryToolArgsRecord, queryToolCallLabel } from '../../utils/agent-status'
import { ASHARE_REALTIME_ANALYSIS_TOOL } from '../../utils/message-charts'
import {
  MessageRichContent,
  queryMediaCountLabel,
  queryToolResultHasLocalFiles
} from '../MessageRichContent'
import styles from './MessageList.module.css'

export interface ToolCallGroupProps {
  /** 本轮已返回的工具结果消息 */
  tools: ChatMessage[]
  /**
   * assistant 声明的 tool_calls 数量。
   * 优先用于标题「已调用 N 个工具」；缺省时退回 tools.length。
   */
  declaredCount?: number
  /** 本轮 assistant 声明的 tool_calls（用于解析 use_skill 的 skillId） */
  toolCalls?: ChatMessageToolCall[]
  /** 技能 id → 展示名 */
  skillNameById?: ReadonlyMap<string, string>
}

/**
 * 截图风格：「已调用 N 个工具」。
 * 默认折叠；含本地落盘文件或组内 K 线时默认展开，便于预览与打开目录。
 */
export function ToolCallGroup({
  tools,
  declaredCount,
  toolCalls,
  skillNameById
}: ToolCallGroupProps): React.ReactElement | null {
  const count = declaredCount && declaredCount > 0 ? declaredCount : tools.length
  if (count <= 0) return null

  const hasInlineStockChart = tools.some(
    (t) =>
      t.content.includes('@@stock_chart@@') && t.toolName !== ASHARE_REALTIME_ANALYSIS_TOOL
  )
  const hasLocalFiles = tools.some((t) => queryToolResultHasLocalFiles(t.content))
  // 有本地文件 / 组内 K 线时整组展开，避免预览被折叠藏住
  const expandGroup = hasInlineStockChart || hasLocalFiles

  const argsByCallId = new Map(
    (toolCalls ?? []).map((tc) => [tc.id, queryToolArgsRecord(tc.args)] as const)
  )

  return (
    <Collapse
      size="small"
      className={`${styles.toolBlock} ${styles.toolCallGroup}`}
      defaultActiveKey={expandGroup ? ['group'] : undefined}
      items={[
        {
          key: 'group',
          label: (
            <span className={styles.toolCallGroupLabel}>
              <ToolOutlined className={styles.toolCallGroupIcon} aria-hidden />
              已调用 {count} 个工具
            </span>
          ),
          children: (
            <div className={styles.toolCallGroupBody}>
              {tools.length === 0 ? (
                <span className={styles.toolCallGroupEmpty}>等待工具结果…</span>
              ) : (
                tools.map((t) => {
                  const mediaLabel = queryMediaCountLabel(t.content)
                  const name = t.toolName ?? 'tool'
                  const args = t.toolCallId ? argsByCallId.get(t.toolCallId) : null
                  const label = queryToolCallLabel(name, args ?? null, {
                    skillNameById,
                    toolContent: t.content
                  })
                  const showChartsInTool =
                    t.content.includes('@@stock_chart@@') &&
                    t.toolName !== ASHARE_REALTIME_ANALYSIS_TOOL
                  const expandTool =
                    showChartsInTool || queryToolResultHasLocalFiles(t.content)
                  return (
                    <Collapse
                      key={t.id}
                      size="small"
                      className={styles.toolCallItem}
                      defaultActiveKey={expandTool ? ['1'] : undefined}
                      items={[
                        {
                          key: '1',
                          label: `${label}${mediaLabel}`,
                          children: (
                            <MessageRichContent
                              content={t.content}
                              markdownClassName={styles.toolMarkdown}
                              showDoneAlert={false}
                              showStockCharts={t.toolName !== ASHARE_REALTIME_ANALYSIS_TOOL}
                            />
                          )
                        }
                      ]}
                    />
                  )
                })
              )}
            </div>
          )
        }
      ]}
    />
  )
}
