import type { ChatMessage, TaskItem } from '@shared/types'
import { VirtualList } from '@/components/VirtualList'
import { queryAgentPhase, queryAgentStatusLabel } from '../../utils/agent-status'
import { MessageRichContent, queryMediaCountLabel } from '../MessageRichContent'
import { TypingIndicator } from '../TypingIndicator'
import styles from './MessageList.module.css'

const { Text } = Typography

interface MessageListProps {
  messages: ChatMessage[]
  streamingText: string
  tasks: TaskItem[]
  running?: boolean
  activeToolName?: string | null
  /** 等待用户确认时隐藏思考态，避免与确认条冲突 */
  awaitUserReason?: string | null
}

/** 虚拟行类型：将消息、流式输出与 pending 态统一为可滚动条目 */
type MessageVirtualRow =
  | { kind: 'message'; id: string; message: ChatMessage }
  | { kind: 'streaming'; id: string; text: string }
  | {
    kind: 'pending'
    id: string
    phase: ReturnType<typeof queryAgentPhase>
    activeToolName: string | null
    statusLabel: string | null
  }

/** 按角色预估行高，减少首屏跳动；实际高度由 measureElement 校正 */
function estimateMessageRowSize(row: MessageVirtualRow): number {
  if (row.kind === 'streaming' || row.kind === 'pending') return 72
  if (row.message.role === 'user') return 88
  if (row.message.role === 'tool') return 56
  const len = row.message.content.length
  if (len < 120) return 120
  if (len < 400) return 200
  return 320
}

/** 展示组件：消息列表 + 工具结果折叠 + Markdown 预览 + 图片/音视频预览（虚拟滚动） */
export function MessageList({
  messages,
  streamingText,
  tasks,
  running = false,
  activeToolName = null,
  awaitUserReason = null
}: MessageListProps): React.ReactElement {
  const visible = messages.filter((m) => m.role !== 'system')

  const phase = queryAgentPhase({
    running,
    streamingText,
    activeToolName,
    awaitUserReason
  })
  const statusLabel = queryAgentStatusLabel({
    running,
    streamingText,
    activeToolName,
    awaitUserReason
  })

  /**
   * 后端每轮会先 push 一条空的 assistant 占位消息，再由 streaming / pending 区承接实时状态。
   * 若同时渲染占位行与 pending 行，会出现两个 Agent loading。
   */
  const lastAssistant = [...visible].reverse().find((m) => m.role === 'assistant')
  const trailingPlaceholderId =
    running &&
      phase !== 'idle' &&
      lastAssistant?.role === 'assistant' &&
      !lastAssistant.content.trim()
      ? lastAssistant.id
      : null

  const displayMessages = trailingPlaceholderId
    ? visible.filter((m) => m.id !== trailingPlaceholderId)
    : visible

  const showPending =
    Boolean(trailingPlaceholderId) && running && !streamingText && phase !== 'idle'

  /** 合并为虚拟列表数据源 */
  const virtualRows = useMemo<MessageVirtualRow[]>(() => {
    const rows: MessageVirtualRow[] = displayMessages.map((message) => ({
      kind: 'message',
      id: message.id,
      message
    }))

    if (streamingText) {
      rows.push({ kind: 'streaming', id: '__streaming__', text: streamingText })
    }

    if (showPending) {
      rows.push({
        kind: 'pending',
        id: '__pending__',
        phase,
        activeToolName,
        statusLabel
      })
    }

    return rows
  }, [displayMessages, streamingText, showPending, phase, activeToolName, statusLabel])

  const renderVirtualRow = useCallback((row: MessageVirtualRow) => {
    if (row.kind === 'streaming') {
      return (
        <div className={`${styles.row} ${styles.rowAssistant}`}>
          <span className={styles.label}>灵犀</span>
          <div className={`${styles.assistantCard} ${styles.assistantCardStreaming}`}>
            <AssistantBody content={row.text} streaming />
          </div>
        </div>
      )
    }

    if (row.kind === 'pending') {
      return (
        <div className={`${styles.row} ${styles.rowAssistant}`}>
          <span className={styles.label}>灵犀</span>
          <div className={styles.pendingWrap}>
            {row.phase === 'tool' && row.activeToolName ? (
              <div className={styles.toolRunning}>
                <ToolOutlined className={styles.toolIcon} spin />
                <span>{row.statusLabel}</span>
              </div>
            ) : (
              <TypingIndicator label={row.statusLabel ?? '正在思考…'} />
            )}
          </div>
        </div>
      )
    }

    const m = row.message
    if (m.role === 'user') {
      return (
        <div className={`${styles.row} ${styles.rowUser}`}>
          <span className={styles.label}>你</span>
          <div className={styles.userBubble}>
            <MessageRichContent
              content={m.content}
              attachmentPaths={m.attachmentPaths}
              markdownClassName={styles.userMarkdown}
              showDoneAlert={false}
            />
          </div>
        </div>
      )
    }

    if (m.role === 'tool') {
      const mediaLabel = queryMediaCountLabel(m.content)
      return (
        <div className={styles.row}>
          <Collapse
            size="small"
            className={styles.toolBlock}
            items={[
              {
                key: '1',
                label: `工具结果 · ${m.toolName ?? 'tool'}${mediaLabel}`,
                children: (
                  <MessageRichContent
                    content={m.content}
                    markdownClassName={styles.toolMarkdown}
                    showDoneAlert={false}
                  />
                )
              }
            ]}
          />
        </div>
      )
    }

    return (
      <div className={`${styles.row} ${styles.rowAssistant}`}>
        <span className={styles.label}>灵犀</span>
        <div className={styles.assistantCard}>
          <AssistantBody content={m.content} />
        </div>
      </div>
    )
  }, [])

  return (
    <div className={styles.root}>
      {tasks.length > 0 ? (
        <div className={styles.taskInline}>
          {tasks.map((t) => (
            <span
              key={t.id}
              className={[
                styles.taskTag,
                t.parentId && styles.taskTagChild,
                t.status === 'done' && styles.taskTagDone,
                t.status === 'running' && styles.taskTagRunning,
                t.status === 'failed' && styles.taskTagFailed,
                t.status === 'pending' && styles.taskTagPending
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {t.status === 'done' ? '✓ ' : t.status === 'running' ? '… ' : ''}
              {t.parentId ? `↳ ${t.title}` : t.title}
            </span>
          ))}
        </div>
      ) : null}

      <VirtualList
        className={styles.viewport}
        innerClassName={styles.listInner}
        items={virtualRows}
        gap={16}
        overscan={8}
        estimateSize={(_index, row) => estimateMessageRowSize(row)}
        getItemKey={(row) => row.id}
        renderItem={(row) => renderVirtualRow(row)}
        stickToBottom
        stickToBottomDeps={[
          virtualRows.length,
          streamingText,
          running,
          activeToolName,
          showPending
        ]}
      />
    </div>
  )
}

function AssistantBody({
  content,
  streaming = false
}: {
  content: string
  streaming?: boolean
}): React.ReactElement {
  if (!content && streaming) {
    return <TypingIndicator label="正在思考…" />
  }
  if (!content) return <Text type="secondary">…</Text>

  return <MessageRichContent content={content} streaming={streaming} />
}
