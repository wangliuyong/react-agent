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
  /**
   * 下一节点已开始（流式回答 / 工具执行等）。
   * 思考完成后仍保持展开，直到该标志为 true 才折叠。
   */
  nextNodeStarted?: boolean
}

const THINKING_PANEL_KEY = 'thinking'

/**
 * 思考过程折叠面板：
 * - 思考中：自动展开
 * - 思考完成：保持展开
 * - 进入下一节点执行：自动折叠上一轮已完成思考
 * 用户仍可手动切换。
 */
export function ThinkingBlock({
  content,
  streaming = false,
  inProgress = false,
  nextNodeStarted = false
}: ThinkingBlockProps): React.ReactElement {
  const hasBody = content.trim().length > 0
  const headerLabel =
    inProgress && !hasBody ? '正在思考…' : inProgress ? '思考中…' : '已完成思考'

  /** 初始：思考中或尚未进入下一节点时展开 */
  const [activeKeys, setActiveKeys] = useState<string[]>(
    inProgress || !nextNodeStarted ? [THINKING_PANEL_KEY] : []
  )

  useEffect(() => {
    if (inProgress) {
      // 思考中：强制展开
      setActiveKeys([THINKING_PANEL_KEY])
      return
    }
    if (nextNodeStarted) {
      // 下一节点已开始：折叠已完成的思考
      setActiveKeys([])
    }
    // 思考刚完成且下一节点未开始：保持展开，不主动折叠
  }, [inProgress, nextNodeStarted])

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
