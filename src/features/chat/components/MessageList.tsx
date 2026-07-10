import { Alert, Collapse, Tag, Typography } from 'antd'
import type { ChatMessage, TaskItem } from '@shared/types'
import { ChatMarkdown } from './ChatMarkdown'
import { MessageImageGallery } from './MessageImageGallery'
import {
  extractMessageImages,
  stripImagePathsFromDisplayText
} from '../utils/message-images'
import styles from './MessageList.module.css'

const { Text } = Typography

interface MessageListProps {
  messages: ChatMessage[]
  streamingText: string
  tasks: TaskItem[]
}

/** 展示组件：消息列表 + 工具结果折叠 + Markdown 预览 + 图片预览 */
export function MessageList({
  messages,
  streamingText,
  tasks
}: MessageListProps): React.ReactElement {
  const visible = messages.filter((m) => m.role !== 'system')

  return (
    <div className={styles.list}>
      {tasks.length > 0 && (
        <div className={styles.taskInline}>
          {tasks.map((t) => (
            <Tag
              key={t.id}
              color={
                t.status === 'done'
                  ? 'success'
                  : t.status === 'running'
                    ? 'processing'
                    : t.status === 'failed'
                      ? 'error'
                      : 'default'
              }
            >
              {t.status === 'done' ? '✓ ' : t.status === 'running' ? '… ' : ''}
              {t.title}
            </Tag>
          ))}
        </div>
      )}

      {visible.map((m) => {
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
            <span className={styles.label}>Agent</span>
            <div className={styles.assistantCard}>
              <AssistantBody content={m.content} />
            </div>
          </div>
        )
      })}

      {streamingText ? (
        <div className={`${styles.row} ${styles.rowAssistant}`}>
          <span className={styles.label}>Agent</span>
          <div className={`${styles.assistantCard} ${styles.assistantCardStreaming}`}>
            <AssistantBody content={streamingText} streaming />
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
    return (
      <Text type="secondary">
        思考中<span className={styles.cursor} />
      </Text>
    )
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
