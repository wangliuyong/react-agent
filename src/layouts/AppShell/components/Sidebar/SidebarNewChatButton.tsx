import { FormOutlined } from '@ant-design/icons'
import { Tooltip } from 'antd'
import { queryNewChatShortcutLabel } from '../../hooks/useNewChatShortcut'
import styles from './Sidebar.module.css'

interface SidebarNewChatButtonProps {
  /** 折叠态仅展示图标 */
  collapsed?: boolean
  /** 当前是否处于新对话空会话（高亮态） */
  active?: boolean
  onCreate: () => void
}

/** 新对话入口：豆包式导航项 — 图标 + 文案 + 快捷键提示 */
export function SidebarNewChatButton({
  collapsed = false,
  active = false,
  onCreate
}: SidebarNewChatButtonProps): React.ReactElement {
  const shortcut = queryNewChatShortcutLabel()

  if (collapsed) {
    return (
      <Tooltip title={`新对话 ${shortcut}`} placement="right">
        <button
          type="button"
          className={styles.collapsedNavItem}
          data-active={active}
          aria-label="新对话"
          onClick={onCreate}
        >
          <FormOutlined />
        </button>
      </Tooltip>
    )
  }

  return (
    <div className={styles.newChatWrap}>
      <button
        type="button"
        className={styles.newChatItem}
        data-active={active}
        aria-label={`新对话，快捷键 ${shortcut}`}
        onClick={onCreate}
      >
        <span className={styles.navIcon}>
          <FormOutlined />
        </span>
        <span className={styles.newChatLabel}>新对话</span>
        <span className={styles.shortcutHint}>{shortcut}</span>
      </button>
    </div>
  )
}
