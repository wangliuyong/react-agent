import type { ChatMessage, TaskItem, ToolProgressPayload } from '@shared/types'
import { Fragment } from 'react'
import {
  queryAgentBusyLabel,
  queryAgentPhase
} from '../../utils/agent-status'
import {
  queryAgentTimeline,
  queryIsSyntheticToolCallContent,
  queryTimelineEndsWithToolGroup
} from '../../utils/queryAgentTimeline'
import { LazyChatMarkdown } from '../LazyChatMarkdown'
import { MessageRichContent } from '../MessageRichContent'
import { TypingIndicator } from '../TypingIndicator'
import { ToolCallGroup } from './ToolCallGroup'
import { ToolProgressBar } from '../ToolProgressBar/ToolProgressBar'
import { queryShouldShowToolProgress, queryToolProgressTitle } from '../../utils/queryToolProgressDisplay'
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
  /** 长耗时工具进度（如 Remotion 渲染） */
  activeToolProgress?: ToolProgressPayload | null
  /** 等待用户确认时隐藏思考态，避免与确认条冲突 */
  awaitUserReason?: string | null
}

/** 展示组件：执行时间线（叙述 + 已调用 N 个工具）+ 流式/思考态 */
export function MessageList({
  messages,
  streamingText,
  thinkingText = '',
  thinkingInProgress = false,
  tasks,
  running = false,
  activeToolName = null,
  activeToolProgress = null,
  awaitUserReason = null
}: MessageListProps): React.ReactElement {
  const visible = messages.filter((m) => m.role !== 'system')

  const statusInput = {
    running,
    streamingText: thinkingInProgress ? '' : streamingText,
    activeToolName: thinkingInProgress ? null : activeToolName,
    awaitUserReason
  }
  const phase = queryAgentPhase(statusInput)

  /**
   * 后端每轮会先 push 一条空的 assistant 占位消息，再由 streaming / pending 区承接实时状态。
   * 若同时渲染占位行与 pending 行，会出现两个 Agent loading。
   */
  const lastAssistant = [...visible].reverse().find((m) => m.role === 'assistant')
  const trailingPlaceholderId =
    running &&
      phase !== 'idle' &&
      lastAssistant?.role === 'assistant' &&
      !lastAssistant.content.trim() &&
      !(lastAssistant.toolCalls?.length)
      ? lastAssistant.id
      : null

  const displayMessages = trailingPlaceholderId
    ? visible.filter((m) => m.id !== trailingPlaceholderId)
    : visible

  const timeline = queryAgentTimeline(displayMessages)
  const afterToolGroup = queryTimelineEndsWithToolGroup(timeline)
  const statusLabel = queryAgentBusyLabel({
    ...statusInput,
    afterToolGroup
  })

  /**
   * pending 展示条件：
   * - 原逻辑：空 assistant 占位存在时，避免与占位行双 loading
   * - 扩展：工具结果已回且进入 thinking →「正在整理工具结果」（截图态，不依赖占位）
   * - 扩展：工具执行中即使无占位也展示忙碌条
   */
  const showPending =
    running &&
    !streamingText &&
    !thinkingInProgress &&
    phase !== 'idle' &&
    (Boolean(trailingPlaceholderId) ||
      (phase === 'thinking' && afterToolGroup) ||
      (phase === 'tool' && Boolean(activeToolName)))

  const showThinking = thinkingText.trim().length > 0 || thinkingInProgress
  const displayStreamingText = thinkingInProgress ? '' : streamingText
  const showToolProgress = queryShouldShowToolProgress(activeToolName, activeToolProgress)

  return (
    <div className={styles.list}>
      {timeline.map((item) => {
        if (item.kind === 'user') {
          const m = item.message
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

        if (item.kind === 'orphanTool') {
          return (
            <div key={item.message.id} className={styles.row}>
              <ToolCallGroup tools={[item.message]} declaredCount={1} />
            </div>
          )
        }

        // step：思考 → 叙述 → 工具组
        const { assistant: m, tools } = item
        const declaredCount = m.toolCalls?.length ?? 0
        const showToolGroup = declaredCount > 0 || tools.length > 0
        const narrative =
          m.content.trim() && !queryIsSyntheticToolCallContent(m.content)
            ? m.content
            : ''
        const showNarrative = Boolean(narrative)

        return (
          <Fragment key={m.id}>
            {m.thinkingContent?.trim() ? (
              <div className={`${styles.row} ${styles.rowThinking}`}>
                <span className={styles.label}>灵犀</span>
                <div className={styles.thinkingBox}>
                  <LazyChatMarkdown
                    source={m.thinkingContent}
                    className={styles.thinkingMarkdown}
                  />
                </div>
              </div>
            ) : null}
            {showNarrative || showToolGroup ? (
              <div className={`${styles.row} ${styles.rowAssistant}`}>
                <span className={styles.label}>灵犀</span>
                {showNarrative ? (
                  <div className={styles.assistantCard}>
                    <AssistantBody content={narrative} />
                  </div>
                ) : null}
                {showToolGroup ? (
                  <ToolCallGroup tools={tools} declaredCount={declaredCount || tools.length} />
                ) : null}
              </div>
            ) : null}
          </Fragment>
        )
      })}

      {/* 当前轮次进行中的思考：位于历史消息之后、正式回答/工具之前 */}
      {showThinking ? (
        <div className={`${styles.row} ${styles.rowThinking}`}>
          <span className={styles.label}>灵犀</span>
          <div className={styles.thinkingBox}>
            <LazyChatMarkdown
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
              showToolProgress && activeToolProgress ? (
                <ToolProgressBar
                  label={queryToolProgressTitle(activeToolName)}
                  progress={activeToolProgress}
                />
              ) : (
                <div className={styles.toolRunning}>
                  <ToolOutlined className={styles.toolIcon} spin />
                  <span>{statusLabel}</span>
                </div>
              )
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
