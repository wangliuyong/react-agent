/**
 * Agent / 全局错误通知卡片。
 * 美学：故障仪表盘 — 左侧危险色轨 + 上下文 chip，贴合豆包蓝产品气质，避免默认 antd 红块。
 */
import { CloseOutlined, WarningFilled } from '@ant-design/icons'
import { queryParseAgentErrorNotice } from './query-parse-agent-error-notice'
import styles from './AppErrorNotice.module.css'

export interface AppErrorNoticeProps {
  title?: string
  content: string
  onClose?: () => void
  /** 嵌入聊天时间线时铺满宽度，去掉 toast 浮层尺寸限制 */
  embedded?: boolean
}

export function AppErrorNotice({
  title = '执行失败',
  content,
  onClose,
  embedded = false
}: AppErrorNoticeProps): React.ReactElement {
  const parts = queryParseAgentErrorNotice(content)
  const chips: { label: string; value: string }[] = []
  if (parts.roleName) chips.push({ label: '角色', value: parts.roleName })
  if (parts.agentName) chips.push({ label: 'Agent', value: parts.agentName })
  if (parts.toolName) chips.push({ label: '工具', value: parts.toolName })
  if (parts.connection) chips.push({ label: '连接', value: parts.connection })

  return (
    <div
      className={`${styles.card}${embedded ? ` ${styles.embedded}` : ''}`}
      role="alert"
    >
      <div className={styles.rail} aria-hidden />
      <div className={styles.body}>
        {onClose ? (
          <button
            type="button"
            className={styles.close}
            onClick={onClose}
            aria-label="关闭错误提示"
          >
            <CloseOutlined />
          </button>
        ) : null}

        <p className={styles.summary}>{parts.summary}</p>

        {chips.length > 0 ? (
          <ul className={styles.chips} aria-label="错误上下文">
            {chips.map((chip) => (
              <li key={chip.label} className={styles.chip}>
                <span className={styles.chipLabel}>{chip.label}</span>
                <span className={styles.chipValue} title={chip.value}>
                  {chip.value}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  )
}
