import type { CSSProperties } from 'react'
import type { WorkflowDefinition } from '@shared/types'
import { flattenWorkflowLeaves } from '../../utils/workflowCanvasGraph'
import styles from './WorkflowCard.module.css'

interface WorkflowCardProps {
  workflow: WorkflowDefinition
  index: number
  onOpen: (id: string) => void
  onRun: (id: string) => void
  onDelete: (id: string) => void
  running?: boolean
}

/** 流程市场卡片：纯展示，点击打开维护抽屉 */
export function WorkflowCard({
  workflow,
  index,
  onOpen,
  onRun,
  onDelete,
  running = false
}: WorkflowCardProps): React.ReactElement {
  const stepCount = flattenWorkflowLeaves(workflow.nodes).length
  const updatedLabel = new Date(workflow.updatedAt).toLocaleString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  return (
    <Card
      variant="borderless"
      hoverable
      className={styles.card}
      style={{ '--card-index': index } as CSSProperties}
      onClick={() => onOpen(workflow.id)}
    >
      <div className={styles.cardHead}>
        <div className={styles.cardTitleRow}>
          <span className={styles.cardTitle}>{workflow.title}</span>
          {workflow.templateKind === 'publish' ? (
            <Tag color="processing">发布</Tag>
          ) : (
            <Tag>通用</Tag>
          )}
        </div>
        <p className={styles.cardDesc}>
          {workflow.description?.trim() || '暂无描述，点击在抽屉中编排节点与连线。'}
        </p>
      </div>
      <div className={styles.cardFooter}>
        <span className={styles.cardMeta}>
          {stepCount} 步 · {updatedLabel}
        </span>
        <Space size={0} onClick={(e) => e.stopPropagation()}>
          <Button
            type="link"
            size="small"
            icon={<PlayCircleOutlined />}
            loading={running}
            disabled={!workflow.nodes.length}
            onClick={() => onRun(workflow.id)}
          >
            运行
          </Button>
          <Popconfirm
            title="删除该流程？"
            description="删除后不可恢复"
            okText="删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
            onConfirm={() => onDelete(workflow.id)}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      </div>
    </Card>
  )
}
