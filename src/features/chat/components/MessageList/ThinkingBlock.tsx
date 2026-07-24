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

/**
 * 思考过程：默认折叠，避免挤占主阅读流；与工具组折叠交互一致。
 */
export function ThinkingBlock({
  content,
  streaming = false,
  inProgress = false
}: ThinkingBlockProps): React.ReactElement {
  const hasBody = content.trim().length > 0
  const headerLabel =
    inProgress && !hasBody ? '正在思考…' : inProgress ? '思考中' : '已完成思考'

  return (
    <Collapse
      size="small"
      className={styles.thinkingCollapse}
      items={[
        {
          key: 'thinking',
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
