import type { WorkflowDefinition } from '@shared/types'
import styles from './WorkflowList.module.css'

interface WorkflowListProps {
  workflows: WorkflowDefinition[]
  activeId: string | null
  onSelect: (id: string) => void
  onDelete: (id: string) => void
}

/** 流程列表：纯展示，选中与删除由父级编排 */
export function WorkflowList({
  workflows,
  activeId,
  onSelect,
  onDelete
}: WorkflowListProps): React.ReactElement {
  if (workflows.length === 0) {
    return <Empty description="暂无流程，点击右上角新建" />
  }

  return (
    <div className={styles.list}>
      {workflows.map((wf) => (
        <div
          key={wf.id}
          className={`${styles.item} ${wf.id === activeId ? styles.itemActive : ''}`}
          onClick={() => onSelect(wf.id)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') onSelect(wf.id)
          }}
        >
          <div className={styles.itemMain}>
            <div className={styles.title}>{wf.title}</div>
            <div className={styles.meta}>
              {wf.templateKind === 'publish' ? '发布模板' : '通用流程'} · {wf.nodes.length} 步
            </div>
          </div>
          <Popconfirm
            title="删除该流程？"
            description="删除后不可恢复"
            okText="删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
            onConfirm={(e) => {
              e?.stopPropagation()
              onDelete(wf.id)
            }}
            onCancel={(e) => e?.stopPropagation()}
          >
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={(e) => e.stopPropagation()}
            />
          </Popconfirm>
        </div>
      ))}
    </div>
  )
}
