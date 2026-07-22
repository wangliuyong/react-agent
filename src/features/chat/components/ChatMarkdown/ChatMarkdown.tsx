import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Components } from 'react-markdown'
import { ChatCodeBlock } from '../ChatCodeBlock'
import styles from './ChatMarkdown.module.css'

interface ChatMarkdownProps {
  /** Markdown 源文本（图片路径等应在外部预处理后再传入） */
  source: string
  /** 流式输出时在末尾展示闪烁光标 */
  streaming?: boolean
  className?: string
}

/** 在浏览器中打开 http(s) 链接，Electron 走系统默认浏览器 */
function openExternalLink(href: string): void {
  if (!/^https?:\/\//i.test(href)) return
  void window.api.postOpenExternal(href)
}

/** 根据是否流式输出构建 Markdown 组件映射 */
function createMarkdownComponents(streaming: boolean): Components {
  return {
    a: ({ href, children }) => (
      <a
        href={href}
        className={styles.link}
        onClick={(event) => {
          if (href && /^https?:\/\//i.test(href)) {
            event.preventDefault()
            openExternalLink(href)
          }
        }}
      >
        {children}
      </a>
    ),
    pre: ({ children }) => <ChatCodeBlock streaming={streaming}>{children}</ChatCodeBlock>,
    code: ({ className, children, ...props }) => {
      const isBlock = Boolean(className?.includes('language-'))
      if (isBlock) {
        return (
          <code className={className} {...props}>
            {children}
          </code>
        )
      }
      return (
        <code className={styles.inlineCode} {...props}>
          {children}
        </code>
      )
    },
    table: ({ children }) => (
      <div className={styles.tableWrap}>
        <table className={styles.table}>{children}</table>
      </div>
    )
  }
}

/** 聊天消息 Markdown 渲染：GFM 表格、代码块、列表、链接等 */
export function ChatMarkdown({
  source,
  streaming = false,
  className
}: ChatMarkdownProps): React.ReactElement {
  const markdownComponents = useMemo(
    () => createMarkdownComponents(streaming),
    [streaming]
  )

  return (
    <div className={[styles.prose, className].filter(Boolean).join(' ')}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {source}
      </ReactMarkdown>
      {streaming ? <span className={styles.cursor} /> : null}
    </div>
  )
}
