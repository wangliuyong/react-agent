import { queryNewChatShortcutLabel } from '../../hooks/useNewChatShortcut'
import styles from './Sidebar.module.css'

interface SidebarNewChatButtonProps {
  collapsed?: boolean
  active?: boolean
  onCreate: () => void
}

/** 新对话入口：固定 DOM，折叠时淡出文案与快捷键 */
export function SidebarNewChatButton({
  collapsed = false,
  active = false,
  onCreate
}: SidebarNewChatButtonProps): React.ReactElement {
  const shortcut = queryNewChatShortcutLabel()

  const button = (
    <button
      type="button"
      className={styles.newChatItem}
      data-active={active}
      data-collapsed={collapsed || undefined}
      aria-label={`新对话，快捷键 ${shortcut}`}
      onClick={onCreate}
    >
      <span className={styles.navIcon}>
        <PlusOutlined />
      </span>
      <span className={`${styles.sidebarLabel} ${styles.newChatLabel}`}>新对话</span>
      <span className={`${styles.sidebarLabel} ${styles.shortcutHint}`}>{shortcut}</span>
    </button>
  )

  if (!collapsed) {
    return <div className={styles.newChatWrap}>{button}</div>
  }

  return (
    <div className={styles.newChatWrap} data-collapsed="true">
      <Tooltip title={`新对话 ${shortcut}`} placement="right" mouseEnterDelay={0.35}>
        {button}
      </Tooltip>
    </div>
  )
}
