import type { ChatMessage, TaskItem } from '@shared/types'
import { queryAgentPhase, queryAgentStatusLabel } from '../../utils/agent-status'
import { ChatMarkdown } from '../ChatMarkdown'
import { MessageRichContent, queryMediaCountLabel } from '../MessageRichContent'
import { TypingIndicator } from '../TypingIndicator'
import styles from './MessageList.module.css'

const { Text } = Typography

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
  const bottomRef = useRef<HTMLDivElement>(null)
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

  const showThinking = thinkingText.trim().length > 0

  /** 新消息 / 流式输出 / 思考过程时自动滚到底部（scrollIntoView 由 ChatPage.body 承载滚动） */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages.length, streamingText, thinkingText, running, activeToolName])

  return (
    <div className={styles.list}>
      {tasks.length > 0 && (
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
      )}

      {displayMessages.map((m) => {
        if (m.role === 'user') {
          return (
            <div key={m.id} className={`${styles.row} ${styles.rowUser}`}>
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
            <div key={m.id} className={styles.row}>
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
          <div key={m.id} className={`${styles.row} ${styles.rowAssistant}`}>
            <span className={styles.label}>灵犀</span>
            <div className={styles.assistantCard}>
              <AssistantBody content={m.content} />
            </div>
          </div>
        )
      })}

      {showThinking ? (
        <div className={`${styles.row} ${styles.rowThinking}`}>
          <span className={styles.label}>思考</span>
          <div className={styles.thinkingBox}>
            <ChatMarkdown
              source={thinkingText}
              streaming={running}
              className={styles.thinkingMarkdown}
            />
          </div>
        </div>
      ) : null}

      {streamingText ? (
        <div className={`${styles.row} ${styles.rowAssistant}`}>
          <span className={styles.label}>灵犀</span>
          <div className={`${styles.assistantCard} ${styles.assistantCardStreaming}`}>
            <AssistantBody content={streamingText} streaming />
          </div>
        </div>
      ) : null}

      {showPending ? (
        <div className={`${styles.row} ${styles.rowAssistant}`}>
          <span className={styles.label}>灵犀</span>
          <div className={styles.pendingWrap}>
            {phase === 'tool' && activeToolName ? (
              <div className={styles.toolRunning}>
                <ToolOutlined className={styles.toolIcon} spin />
                <span>{statusLabel}</span>
              </div>
            ) : (
              <TypingIndicator label={statusLabel ?? '正在思考…'} />
            )}
          </div>
        </div>
      ) : null}

      <div ref={bottomRef} className={styles.scrollAnchor} />
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
