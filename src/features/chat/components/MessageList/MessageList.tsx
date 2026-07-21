import type { ChatMessage, TaskItem } from '@shared/types'
import { Fragment } from 'react'
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
  /** 推理进行中时不展示工具/流式回答 */
  thinkingInProgress?: boolean
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
  thinkingInProgress = false,
  tasks,
  running = false,
  activeToolName = null,
  awaitUserReason = null
}: MessageListProps): React.ReactElement {
  /** 列表层滚动容器，自动滚底时直接操作此节点 */
  const listRef = useRef<HTMLDivElement>(null)
  const visible = messages.filter((m) => m.role !== 'system')

  const phase = queryAgentPhase({
    running,
    streamingText: thinkingInProgress ? '' : streamingText,
    activeToolName: thinkingInProgress ? null : activeToolName,
    awaitUserReason
  })
  const statusLabel = queryAgentStatusLabel({
    running,
    streamingText: thinkingInProgress ? '' : streamingText,
    activeToolName: thinkingInProgress ? null : activeToolName,
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
    Boolean(trailingPlaceholderId) &&
    running &&
    !streamingText &&
    !thinkingInProgress &&
    phase !== 'idle'

  const showThinking = thinkingText.trim().length > 0 || thinkingInProgress
  const displayStreamingText = thinkingInProgress ? '' : streamingText

  /** 新消息 / 流式输出 / 思考过程时在 .list 层自动滚到底部 */
  useEffect(() => {
    const listEl = listRef.current
    if (!listEl) return
    listEl.scrollTo({ top: listEl.scrollHeight, behavior: 'smooth' })
  }, [messages.length, streamingText, thinkingText, running, activeToolName])

  return (
    <div ref={listRef} className={styles.list}>
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
          // K 线图需默认展开，否则实时预览被折叠隐藏
          const hasStockChart = m.content.includes('@@stock_chart@@')
          return (
            <div key={m.id} className={styles.row}>
              <Collapse
                size="small"
                className={styles.toolBlock}
                defaultActiveKey={hasStockChart ? ['1'] : undefined}
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
        // assistant：思考过程展示在回答之前（先思考，再决定执行/输出）
        return (
          <Fragment key={m.id}>
            {m.thinkingContent?.trim() ? (
              <div className={`${styles.row} ${styles.rowThinking}`}>
                <span className={styles.label}>思考</span>
                <div className={styles.thinkingBox}>
                  <ChatMarkdown
                    source={m.thinkingContent}
                    className={styles.thinkingMarkdown}
                  />
                </div>
              </div>
            ) : null}
            <div className={`${styles.row} ${styles.rowAssistant}`}>
              <span className={styles.label}>灵犀</span>
              <div className={styles.assistantCard}>
                <AssistantBody content={m.content} />
              </div>
            </div>
          </Fragment>
        )
      })}

      {/* 当前轮次进行中的思考：位于历史消息之后、正式回答/工具之前 */}
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

      {displayStreamingText ? (
        <div className={`${styles.row} ${styles.rowAssistant}`}>
          <span className={styles.label}>灵犀</span>
          <div className={`${styles.assistantCard} ${styles.assistantCardStreaming}`}>
            <AssistantBody content={displayStreamingText} streaming />
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
