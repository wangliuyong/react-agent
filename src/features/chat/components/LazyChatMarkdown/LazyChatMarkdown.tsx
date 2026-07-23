import { lazy, Suspense } from 'react'
import styles from './LazyChatMarkdown.module.css'

/** 按需加载 Markdown 渲染，避免首屏打入 react-markdown 大包 */
const ChatMarkdown = lazy(() =>
  import('../ChatMarkdown').then((m) => ({ default: m.ChatMarkdown }))
)

interface LazyChatMarkdownProps {
  source: string
  streaming?: boolean
  className?: string
}

/** Markdown 懒加载包装：流式场景下用闪烁光标占位 */
export function LazyChatMarkdown(props: LazyChatMarkdownProps): React.ReactElement {
  const fallback = props.streaming ? (
    <span className={styles.cursor} />
  ) : (
    <span className={styles.placeholder} />
  )

  return (
    <Suspense fallback={fallback}>
      <ChatMarkdown {...props} />
    </Suspense>
  )
}
