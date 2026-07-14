import type { ChatMessage, TaskItem } from '@shared/types'
import { queryAgentPhase, queryAgentStatusLabel } from '../../utils/agent-status'
import { ChatMarkdown } from '../ChatMarkdown'
import { MessageImageGallery } from '../MessageImageGallery'
import { TypingIndicator } from '../TypingIndicator'
import {
  extractMessageImages,
  stripImagePathsFromDisplayText
} from '../../utils/message-images'
import styles from './MessageList.module.css'

const { Text } = Typography

interface MessageListProps {
  messages: ChatMessage[]
  streamingText: string
  tasks: TaskItem[]
  running?: boolean
  activeToolName?: string | null
}

/** 展示组件：消息列表 + 工具结果折叠 + Markdown 预览 + 图片预览 */
export function MessageList({
  messages,
  streamingText,
  tasks,
  running = false,
  activeToolName = null
}: MessageListProps): React.ReactElement {
  const bottomRef = useRef<HTMLDivElement>(null)
  const visible = messages.filter((m) => m.role !== 'system')

  const phase = queryAgentPhase({ running, streamingText, activeToolName, awaitUserReason: null })
  const statusLabel = queryAgentStatusLabel({
    running,
    streamingText,
    activeToolName,
    awaitUserReason: null
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

  /** 新消息 / 流式输出时自动滚到底部 */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages.length, streamingText, running, activeToolName])

  return (
    <div className={styles.list}>
      {tasks.length > 0 && (
        <div className={styles.taskInline}>
          {tasks.map((t) => (
            <span
              key={t.id}
              className={[
                styles.taskTag,
                t.status === 'done' && styles.taskTagDone,
                t.status === 'running' && styles.taskTagRunning,
                t.status === 'failed' && styles.taskTagFailed,
                t.status === 'pending' && styles.taskTagPending
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {t.status === 'done' ? '✓ ' : t.status === 'running' ? '… ' : ''}
              {t.title}
            </span>
          ))}
        </div>
      )}

      {displayMessages.map((m) => {
        if (m.role === 'user') {
          const images = extractMessageImages(m.content, m.attachmentPaths)
          const text = stripImagePathsFromDisplayText(m.content, images)
          return (
            <div key={m.id} className={`${styles.row} ${styles.rowUser}`}>
              <span className={styles.label}>你</span>
              <div className={styles.userBubble}>
                {text ? <ChatMarkdown source={text} className={styles.userMarkdown} /> : null}
                <MessageImageGallery images={images} />
              </div>
            </div>
          )
        }
        if (m.role === 'tool') {
          const images = extractMessageImages(m.content)
          return (
            <div key={m.id} className={styles.row}>
              <Collapse
                size="small"
                className={styles.toolBlock}
                items={[
                  {
                    key: '1',
                    label: `工具结果 · ${m.toolName ?? 'tool'}${images.length ? ` · ${images.length} 张图` : ''}`,
                    children: (
                      <>
                        <MessageImageGallery images={images} />
                        <ChatMarkdown source={m.content} className={styles.toolMarkdown} />
                      </>
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

  const images = extractMessageImages(content)
  const displayText = stripImagePathsFromDisplayText(content, images)

  return (
    <>
      {displayText ? (
        <ChatMarkdown source={displayText} streaming={streaming} />
      ) : streaming ? (
        <span className={styles.cursor} />
      ) : null}
      <MessageImageGallery images={images} />
      {/执行完毕/.test(content) ? (
        <Alert type="success" showIcon message="执行完毕" className={styles.doneAlert} />
      ) : null}
    </>
  )
}
