import { useCallback, useEffect, useMemo, useRef, type RefObject } from 'react'
import type { ChatMessage, TaskItem } from '@shared/types'
import { queryAgentPhase, queryAgentStatusLabel } from '../../utils/agent-status'
import { ChatMarkdown } from '../ChatMarkdown'
import { MessageRichContent, queryMediaCountLabel } from '../MessageRichContent'
import { TypingIndicator } from '../TypingIndicator'
import styles from './MessageList.module.css'

const { Text } = Typography

/** 距底部多少像素内视为「贴底」，新内容到达时自动滚动 */
const STICKY_BOTTOM_THRESHOLD_PX = 96

interface MessageListProps {
  messages: ChatMessage[]
  streamingText: string
  /** 模型推理 / Agent 思考过程（流式增量拼接） */
  thinkingText?: string
  tasks: TaskItem[]
  running?: boolean
  activeToolName?: string | null
  /** 等待用户确认时隐藏思考态，避免与确认条冲突 */
  awaitUserReason?: string | null
}

/** 列表行类型：将消息、流式输出与 pending 态统一为可滚动条目 */
type MessageRow =
  | { kind: 'message'; id: string; message: ChatMessage }
  | { kind: 'thinking'; id: string; text: string }
  | { kind: 'streaming'; id: string; text: string }
  | {
      kind: 'pending'
      id: string
      phase: ReturnType<typeof queryAgentPhase>
      activeToolName: string | null
      statusLabel: string | null
    }

/**
 * 聊天列表贴底跟随：用户上滑阅读历史时不抢滚动，回到底部附近后再自动跟随新消息。
 */
function useChatStickToBottom(
  scrollRef: RefObject<HTMLDivElement | null>,
  deps: unknown[]
): () => void {
  const stickToBottomRef = useRef(true)

  const onScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    stickToBottomRef.current = distanceToBottom <= STICKY_BOTTOM_THRESHOLD_PX
  }, [scrollRef])

  useEffect(() => {
    if (!stickToBottomRef.current) return
    const el = scrollRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior: 'auto' })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deps 由调用方按业务传入
  }, deps)

  return onScroll
}

/** 展示组件：消息列表 + 工具结果折叠 + Markdown 预览 + 图片/音视频预览 */
export function MessageList({
  messages,
  streamingText,
  thinkingText = '',
  tasks,
  running = false,
  activeToolName = null,
  awaitUserReason = null
}: MessageListProps): React.ReactElement {
  const scrollRef = useRef<HTMLDivElement>(null)
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

  const rows = useMemo<MessageRow[]>(() => {
    const list: MessageRow[] = displayMessages.map((message) => ({
      kind: 'message',
      id: message.id,
      message
    }))

    const showThinking = thinkingText.trim().length > 0
    if (showThinking) {
      list.push({ kind: 'thinking', id: '__thinking__', text: thinkingText })
    }

    if (streamingText) {
      list.push({ kind: 'streaming', id: '__streaming__', text: streamingText })
    }

    if (showPending) {
      list.push({
        kind: 'pending',
        id: '__pending__',
        phase,
        activeToolName,
        statusLabel
      })
    }

    return list
  }, [displayMessages, thinkingText, streamingText, showPending, phase, activeToolName, statusLabel])

  const onScroll = useChatStickToBottom(scrollRef, [
    rows.length,
    thinkingText,
    streamingText,
    running,
    activeToolName,
    showPending
  ])

  const renderRow = useCallback(
    (row: MessageRow) => {
      if (row.kind === 'thinking') {
        return (
          <div className={`${styles.row} ${styles.rowThinking}`}>
            <span className={styles.label}>思考</span>
            <div className={styles.thinkingBox}>
              <ChatMarkdown
                source={row.text}
                streaming={running}
                className={styles.thinkingMarkdown}
              />
            </div>
          </div>
        )
      }

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
    },
    [running]
  )

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

      <div ref={scrollRef} className={styles.viewport} onScroll={onScroll}>
        <div className={styles.listInner}>
          {rows.map((row) => (
            <div key={row.id}>{renderRow(row)}</div>
          ))}
        </div>
      </div>
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
