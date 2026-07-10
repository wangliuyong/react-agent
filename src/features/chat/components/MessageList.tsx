import { Alert, Collapse, Table, Tag, Typography } from 'antd'
import type { ChatMessage, TaskItem } from '@shared/types'
import { MessageImageGallery } from './MessageImageGallery'
import {
  extractMessageImages,
  stripImagePathsFromDisplayText
} from '../utils/message-images'
import styles from './MessageList.module.css'

const { Text, Paragraph } = Typography

interface MessageListProps {
  messages: ChatMessage[]
  streamingText: string
  tasks: TaskItem[]
}

/** 展示组件：消息列表 + 工具结果折叠 + 图片预览 */
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
                {text ? (
                  <Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{text}</Paragraph>
                ) : null}
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
                        <Text code style={{ whiteSpace: 'pre-wrap', display: 'block' }}>
                          {m.content}
                        </Text>
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

  const lines = displayText.split('\n')
  const tableStart = lines.findIndex((l) => l.trim().startsWith('|') && l.includes('|', 1))
  if (tableStart >= 0) {
    const tableLines = []
    let i = tableStart
    while (i < lines.length && lines[i].includes('|')) {
      tableLines.push(lines[i])
      i += 1
    }
    const parsed = parseMdTable(tableLines)
    const before = lines.slice(0, tableStart).join('\n').trim()
    const after = lines.slice(i).join('\n').trim()
    return (
      <>
        {before ? <Paragraph style={{ whiteSpace: 'pre-wrap' }}>{before}</Paragraph> : null}
        <MessageImageGallery images={images} />
        {parsed ? (
          <Table
            size="small"
            pagination={false}
            columns={parsed.columns}
            dataSource={parsed.data}
            style={{ marginBottom: 12 }}
          />
        ) : null}
        {after ? <Paragraph style={{ whiteSpace: 'pre-wrap' }}>{after}</Paragraph> : null}
        {streaming ? <span className={styles.cursor} /> : null}
        {/执行完毕/.test(content) ? (
          <Alert type="success" showIcon message="执行完毕" className={styles.doneAlert} />
        ) : null}
      </>
    )
  }

  return (
    <>
      {displayText ? (
        <Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
          {displayText}
          {streaming ? <span className={styles.cursor} /> : null}
        </Paragraph>
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

function parseMdTable(lines: string[]): {
  columns: Array<{ title: string; dataIndex: string }>
  data: Array<Record<string, string>>
} | null {
  if (lines.length < 2) return null
  const headers = splitRow(lines[0])
  const body = lines.slice(1).filter((l) => !/^\|\s*-+/.test(l))
  const columns = headers.map((h, idx) => ({ title: h, dataIndex: `c${idx}` }))
  const data = body.map((row, ri) => {
    const cells = splitRow(row)
    const obj: Record<string, string> = { key: String(ri) }
    headers.forEach((_, idx) => {
      obj[`c${idx}`] = cells[idx] ?? ''
    })
    return obj
  })
  return { columns, data }
}

function splitRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((c) => c.trim())
}
