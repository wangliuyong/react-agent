import { PlusOutlined } from '@ant-design/icons'
import { Button, Tooltip } from 'antd'
import styles from './Sidebar.module.css'

interface SidebarNewChatButtonProps {
  collapsed?: boolean
  onCreate: () => void
}

/** 新对话入口：折叠态为图标按钮，展开态为全宽主按钮 */
export function SidebarNewChatButton({
  collapsed = false,
  onCreate
}: SidebarNewChatButtonProps): React.ReactElement {
  if (collapsed) {
    return (
      <Tooltip title="新对话" placement="right">
        <Button
          type="primary"
          className={styles.collapsedPrimaryBtn}
          icon={<PlusOutlined />}
          onClick={onCreate}
        />
      </Tooltip>
    )
  }

  return (
    <div className={styles.newTask}>
      <Button
        block
        type="primary"
        className={styles.newTaskBtn}
        icon={<PlusOutlined />}
        onClick={onCreate}
      >
        新对话
      </Button>
    </div>
  )
}
