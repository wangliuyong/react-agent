import {
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode
} from 'react'
import styles from './ChatCodeBlock.module.css'

/** 超过该行数时显示折叠控件 */
const COLLAPSE_LINE_THRESHOLD = 8
/** 默认折叠的行数门槛 */
const DEFAULT_COLLAPSED_LINE_THRESHOLD = 14
/** 展开后代码区最大高度，超出内部滚动 */
const MAX_EXPANDED_HEIGHT = 420

interface ChatCodeBlockProps {
  children: ReactNode
  /** 流式输出时保持展开，避免折叠状态干扰阅读 */
  streaming?: boolean
}

interface ParsedCodeBlock {
  language: string
  code: string
}

/** 从 react-markdown 的 pre 子节点提取语言与纯文本代码 */
function queryParsePreChildren(children: ReactNode): ParsedCodeBlock {
  const codeChild = Children.toArray(children).find(
    (child): child is ReactElement<{ className?: string; children?: ReactNode }> =>
      isValidElement(child) && child.type === 'code'
  )

  if (!codeChild) {
    return { language: '', code: queryNormalizeCodeText(children) }
  }

  const className = codeChild.props.className ?? ''
  const language = /language-([\w-]+)/.exec(className)?.[1] ?? ''
  return {
    language,
    code: queryNormalizeCodeText(codeChild.props.children)
  }
}

/** 将 code 子节点统一转为字符串，并去掉末尾多余换行 */
function queryNormalizeCodeText(node: ReactNode): string {
  if (node == null || typeof node === 'boolean') return ''
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node).replace(/\n$/, '')
  }
  if (Array.isArray(node)) {
    return node.map(queryNormalizeCodeText).join('').replace(/\n$/, '')
  }
  if (isValidElement<{ children?: ReactNode }>(node)) {
    return queryNormalizeCodeText(node.props.children)
  }
  return String(node).replace(/\n$/, '')
}

function queryCountLines(code: string): number {
  if (!code) return 0
  return code.split('\n').length
}

/** 复制代码到剪贴板 */
function postCopyCode(text: string): void {
  void navigator.clipboard.writeText(text).then(
    () => message.success('已复制'),
    () => message.error('复制失败')
  )
}

/**
 * 聊天 Markdown 代码块：带语言标签、复制与折叠，长代码默认收起。
 */
export function ChatCodeBlock({
  children,
  streaming = false
}: ChatCodeBlockProps): ReactElement {
  const { language, code } = useMemo(() => queryParsePreChildren(children), [children])
  const lineCount = queryCountLines(code)
  const collapsible = lineCount > COLLAPSE_LINE_THRESHOLD
  const defaultCollapsed = collapsible && lineCount > DEFAULT_COLLAPSED_LINE_THRESHOLD
  const [collapsed, setCollapsed] = useState(defaultCollapsed)

  const isCollapsed = streaming ? false : collapsible && collapsed

  const toggleLabel = isCollapsed ? `展开 ${lineCount} 行` : '收起'

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div className={styles.meta}>
          <CodeOutlined className={styles.langIcon} aria-hidden />
          <span className={styles.lang}>{language || 'code'}</span>
          {lineCount > 1 ? <span className={styles.lineCount}>{lineCount} 行</span> : null}
        </div>
        <div className={styles.actions}>
          <Tooltip title="复制代码">
            <Button
              type="text"
              size="small"
              className={styles.actionBtn}
              icon={<CopyOutlined />}
              aria-label="复制代码"
              onClick={() => postCopyCode(code)}
            />
          </Tooltip>
          {collapsible && !streaming ? (
            <Button
              type="text"
              size="small"
              className={styles.actionBtn}
              icon={isCollapsed ? <DownOutlined /> : <UpOutlined />}
              aria-expanded={!isCollapsed}
              onClick={() => setCollapsed((prev) => !prev)}
            >
              {toggleLabel}
            </Button>
          ) : null}
        </div>
      </div>
      {isCollapsed ? (
        <div className={styles.collapsedHint}>代码已折叠，点击「展开」查看完整内容</div>
      ) : (
        <pre
          className={styles.body}
          style={{ maxHeight: MAX_EXPANDED_HEIGHT }}
        >
          <code className={language ? `language-${language}` : undefined}>{code}</code>
        </pre>
      )}
    </div>
  )
}
