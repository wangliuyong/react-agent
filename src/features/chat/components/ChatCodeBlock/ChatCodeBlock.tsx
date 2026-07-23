import {
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode
} from 'react'
import { queryHighlightCode } from '../../utils/code-highlight'
import styles from './ChatCodeBlock.module.css'

/** 超过该行数时允许折叠 */
const COLLAPSE_LINE_THRESHOLD = 6
/** 默认折叠的行数门槛 */
const DEFAULT_COLLAPSED_LINE_THRESHOLD = 12
/** 内联预览最大高度 */
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

interface CodeBodyProps {
  code: string
  language: string
  className?: string
  style?: React.CSSProperties
}

/** 高亮代码正文 */
function CodeBody({ code, language, className, style }: CodeBodyProps): ReactElement {
  const highlighted = useMemo(
    () => queryHighlightCode(code, language),
    [code, language]
  )

  return (
    <pre className={className} style={style}>
      <code
        className={language ? `language-${language}` : undefined}
        // 高亮结果已转义，仅注入 span 标签
        dangerouslySetInnerHTML={{ __html: highlighted }}
      />
    </pre>
  )
}

/**
 * 聊天 Markdown 代码块：参考豆包式浅色预览，顶栏折叠 + 复制 + 全屏。
 */
export function ChatCodeBlock({
  children,
  streaming = false
}: ChatCodeBlockProps): ReactElement | null {
  const { language, code } = useMemo(() => queryParsePreChildren(children), [children])

  const lineCount = queryCountLines(code)
  const collapsible = lineCount > COLLAPSE_LINE_THRESHOLD
  const defaultCollapsed = collapsible && lineCount > DEFAULT_COLLAPSED_LINE_THRESHOLD
  const [collapsed, setCollapsed] = useState(defaultCollapsed)
  const [fullscreenOpen, setFullscreenOpen] = useState(false)

  // 无实质内容时不渲染空代码预览框（须在全部 Hooks 之后，避免流式输出时 Hooks 顺序变化）
  if (!code.trim()) {
    return null
  }

  const isCollapsed = streaming ? false : collapsible && collapsed
  const langLabel = (language || 'code').toLowerCase()

  const handleToggleCollapse = (): void => {
    if (!collapsible || streaming) return
    setCollapsed((prev) => !prev)
  }

  return (
    <>
      <div className={styles.root} data-collapsed={isCollapsed || undefined}>
        <div className={styles.header}>
          <button
            type="button"
            className={styles.langToggle}
            onClick={handleToggleCollapse}
            disabled={!collapsible || streaming}
            aria-expanded={!isCollapsed}
          >
            {collapsible && !streaming ? (
              <UpOutlined
                className={styles.chevron}
                data-collapsed={isCollapsed || undefined}
                aria-hidden
              />
            ) : null}
            <span className={styles.lang}>{langLabel}</span>
          </button>

          <div className={styles.actions}>
            <Tooltip title="复制代码">
              <button
                type="button"
                className={styles.iconBtn}
                aria-label="复制代码"
                onClick={() => postCopyCode(code)}
              >
                <CopyOutlined />
              </button>
            </Tooltip>
            <Tooltip title="全屏查看">
              <button
                type="button"
                className={styles.iconBtn}
                aria-label="全屏查看"
                onClick={() => setFullscreenOpen(true)}
              >
                <FullscreenOutlined />
              </button>
            </Tooltip>
          </div>
        </div>

        {!isCollapsed ? (
          <CodeBody
            code={code}
            language={language}
            className={styles.body}
            style={{ maxHeight: MAX_EXPANDED_HEIGHT }}
          />
        ) : null}
      </div>

      <Modal
        title={langLabel}
        open={fullscreenOpen}
        onCancel={() => setFullscreenOpen(false)}
        footer={null}
        width="min(920px, 92vw)"
        className={styles.fullscreenModal}
        destroyOnHidden
      >
        <div className={styles.modalToolbar}>
          <span className={styles.modalMeta}>{lineCount} 行</span>
          <Button
            type="text"
            size="small"
            icon={<CopyOutlined />}
            onClick={() => postCopyCode(code)}
          >
            复制
          </Button>
        </div>
        <CodeBody code={code} language={language} className={styles.modalBody} />
      </Modal>
    </>
  )
}
