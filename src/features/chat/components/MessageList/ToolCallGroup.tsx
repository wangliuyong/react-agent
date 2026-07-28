import { useEffect, useState } from 'react'
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

const GROUP_KEY = 'group'
const TOOL_PANEL_KEY = '1'

function queryShouldExpandTool(tool: ChatMessage): boolean {
  const showChartsInTool =
    tool.content.includes('@@stock_chart@@') &&
    tool.toolName !== ASHARE_REALTIME_ANALYSIS_TOOL
  return showChartsInTool || queryToolResultHasLocalFiles(tool.content)
}

/**
 * 截图风格：「已调用 N 个工具」。
 * 默认折叠；含本地落盘文件或组内 K 线时展开。
 * 为什么用受控 activeKey：工具结果是流式后到的，defaultActiveKey 只在首挂生效，
 * 刚输出时面板已挂载为空/无文件态，刷新后才带文件挂载才会展开。
 */
export function ToolCallGroup({
  tools,
  declaredCount,
  toolCalls,
  skillNameById
}: ToolCallGroupProps): React.ReactElement | null {
  const count = declaredCount && declaredCount > 0 ? declaredCount : tools.length

  const hasInlineStockChart = tools.some(
    (t) =>
      t.content.includes('@@stock_chart@@') && t.toolName !== ASHARE_REALTIME_ANALYSIS_TOOL
  )
  const hasLocalFiles = tools.some((t) => queryToolResultHasLocalFiles(t.content))
  const expandGroup = hasInlineStockChart || hasLocalFiles

  const [groupKeys, setGroupKeys] = useState<string[]>(expandGroup ? [GROUP_KEY] : [])
  /** 各工具子面板展开键；有文件/K 线后自动写入 */
  const [toolKeysById, setToolKeysById] = useState<Record<string, string[]>>(() => {
    const init: Record<string, string[]> = {}
    for (const t of tools) {
      if (queryShouldExpandTool(t)) init[t.id] = [TOOL_PANEL_KEY]
    }
    return init
  })

  // 文件/K 线后到：自动展开整组（不反向强制折叠，尊重用户手动操作）
  useEffect(() => {
    if (expandGroup) {
      setGroupKeys([GROUP_KEY])
    }
  }, [expandGroup])

  // 各工具结果内容到位后再展开对应子项
  const toolExpandSig = tools
    .map((t) => `${t.id}:${queryShouldExpandTool(t) ? '1' : '0'}`)
    .join('|')
  useEffect(() => {
    setToolKeysById((prev) => {
      let changed = false
      const next = { ...prev }
      for (const t of tools) {
        if (!queryShouldExpandTool(t)) continue
        const cur = next[t.id]
        if (!cur?.includes(TOOL_PANEL_KEY)) {
          next[t.id] = [TOOL_PANEL_KEY]
          changed = true
        }
      }
      return changed ? next : prev
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 以 toolExpandSig 稳定依赖
  }, [toolExpandSig])

  if (count <= 0) return null

  const argsByCallId = new Map(
    (toolCalls ?? []).map((tc) => [tc.id, queryToolArgsRecord(tc.args)] as const)
  )

  return (
    <Collapse
      size="small"
      className={`${styles.toolBlock} ${styles.toolCallGroup}`}
      activeKey={groupKeys}
      onChange={(keys) => {
        setGroupKeys(Array.isArray(keys) ? keys.map(String) : keys ? [String(keys)] : [])
      }}
      items={[
        {
          key: GROUP_KEY,
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
                  return (
                    <Collapse
                      key={t.id}
                      size="small"
                      className={styles.toolCallItem}
                      activeKey={toolKeysById[t.id] ?? []}
                      onChange={(keys) => {
                        const next = Array.isArray(keys)
                          ? keys.map(String)
                          : keys
                            ? [String(keys)]
                            : []
                        setToolKeysById((prev) => ({ ...prev, [t.id]: next }))
                      }}
                      items={[
                        {
                          key: TOOL_PANEL_KEY,
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
