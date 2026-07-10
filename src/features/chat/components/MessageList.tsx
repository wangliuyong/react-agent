import { Alert, Collapse, Table, Tag, Typography } from 'antd'
import type { ChatMessage, TaskItem } from '@shared/types'
import styles from './MessageList.module.css'

const { Text, Paragraph } = Typography

interface MessageListProps {
  messages: ChatMessage[]
  streamingText: string
  tasks: TaskItem[]
}

/** 展示组件：消息列表 + 工具结果折叠；不含请求副作用 */
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
          return (
            <div key={m.id} className={styles.userBubble}>
              <Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{m.content}</Paragraph>
            </div>
          )
        }
        if (m.role === 'tool') {
          return (
            <Collapse
              key={m.id}
              size="small"
              className={styles.toolBlock}
              items={[
                {
                  key: '1',
                  label: `工具结果 · ${m.toolName ?? 'tool'}`,
                  children: (
                    <Text code style={{ whiteSpace: 'pre-wrap', display: 'block' }}>
                      {m.content}
                    </Text>
                  )
                }
              ]}
            />
          )
        }
        // assistant：尝试解析简单 markdown 表格（| 分隔）
        return (
          <div key={m.id} className={styles.assistantBlock}>
            <AssistantBody content={m.content} />
          </div>
        )
      })}

      {streamingText ? (
        <div className={styles.assistantBlock}>
          <Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{streamingText}</Paragraph>
        </div>
      ) : null}
    </div>
  )
}

function AssistantBody({ content }: { content: string }): React.ReactElement {
  if (!content) return <Text type="secondary">…</Text>

  // 极简表格检测：连续含 | 的行
  const lines = content.split('\n')
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
        {/执行完毕/.test(content) ? <Alert type="success" showIcon message="执行完毕" /> : null}
      </>
    )
  }

  return (
    <>
      <Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{content}</Paragraph>
      {/执行完毕/.test(content) ? (
        <Alert type="success" showIcon message="执行完毕" style={{ marginTop: 8 }} />
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
