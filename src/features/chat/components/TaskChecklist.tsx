import { CheckCircleOutlined } from '@ant-design/icons'
import { Card, List, Typography } from 'antd'
import type { TaskItem } from '@shared/types'
import styles from './TaskChecklist.module.css'

const { Text } = Typography

interface TaskChecklistProps {
  tasks: TaskItem[]
  visible: boolean
}

/** 浮动任务清单（对齐截图「任务清单」） */
export function TaskChecklist({ tasks, visible }: TaskChecklistProps): React.ReactElement | null {
  if (!visible || tasks.length === 0) return null

  return (
    <Card
      size="small"
      title="任务清单"
      className={styles.card}
      styles={{ body: { padding: '8px 12px' } }}
    >
      <List
        size="small"
        dataSource={tasks}
        renderItem={(item) => (
          <List.Item style={{ padding: '6px 0', border: 'none' }}>
            <Text
              type={item.status === 'done' ? 'success' : item.status === 'failed' ? 'danger' : undefined}
              delete={item.status === 'done'}
            >
              {item.status === 'done' ? (
                <CheckCircleOutlined style={{ marginRight: 6 }} />
              ) : item.status === 'running' ? (
                <span className={styles.dot} />
              ) : (
                <span className={styles.pending} />
              )}
              {item.title}
            </Text>
          </List.Item>
        )}
      />
    </Card>
  )
}
