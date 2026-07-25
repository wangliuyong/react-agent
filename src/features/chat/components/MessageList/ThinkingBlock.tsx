import { useEffect, useState } from 'react'
import { LazyChatMarkdown } from '../LazyChatMarkdown'
import { TypingIndicator } from '../TypingIndicator'
import styles from './MessageList.module.css'

interface ThinkingBlockProps {
  /** 思考过程 Markdown 正文 */
  content: string
  /** 流式输出中 */
  streaming?: boolean
  /** 推理尚未结束（可能尚无正文） */
  inProgress?: boolean
}

const THINKING_PANEL_KEY = 'thinking'

/**
 * 思考过程折叠面板：思考中自动展开，完成后自动折叠；用户仍可手动切换。
 */
export function ThinkingBlock({
  content,
  streaming = false,
  inProgress = false
}: ThinkingBlockProps): React.ReactElement {
  const hasBody = content.trim().length > 0
  const headerLabel =
    inProgress && !hasBody ? '正在思考…' : inProgress ? '思考中…' : '已完成思考'

  /** 与 inProgress 同步的展开态；用户手动切换后，下次状态变化会再次对齐 */
  const [activeKeys, setActiveKeys] = useState<string[]>(
    inProgress ? [THINKING_PANEL_KEY] : []
  )

  useEffect(() => {
    setActiveKeys(inProgress ? [THINKING_PANEL_KEY] : [])
  }, [inProgress])

  return (
    <Collapse
      size="small"
      className={styles.thinkingCollapse}
      activeKey={activeKeys}
      onChange={(keys) => {
        setActiveKeys(Array.isArray(keys) ? keys : keys ? [keys] : [])
      }}
      items={[
        {
          key: THINKING_PANEL_KEY,
          label: <span className={styles.thinkingCollapseLabel}>{headerLabel}</span>,
          children: hasBody ? (
            <LazyChatMarkdown
              source={content}
              streaming={streaming}
              className={styles.thinkingMarkdown}
            />
          ) : (
            <TypingIndicator label="正在思考…" />
          )
        }
      ]}
    />
  )
}
