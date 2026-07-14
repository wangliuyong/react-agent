import type { CSSProperties } from 'react'
import type { WorkflowDefinition } from '@shared/types'
import { DB_THEME } from '@/styles/theme-tokens'
import { flattenWorkflowLeaves } from '../../utils/workflowCanvasGraph'
import styles from './WorkflowCard.module.css'

interface WorkflowCardProps {
  workflow: WorkflowDefinition
  index: number
  onOpen: (id: string) => void
}

/** 流程卡片：对齐技能市场浏览卡，点击进入详情弹窗 */
export function WorkflowCard({
  workflow,
  index,
  onOpen
}: WorkflowCardProps): React.ReactElement {
  const stepCount = flattenWorkflowLeaves(workflow.nodes).length
  const isPublish = workflow.templateKind === 'publish'
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
          {isPublish ? (
            <Tag color={DB_THEME.primary} className={styles.kindTag}>
              发布
            </Tag>
          ) : (
            <Tag className={styles.kindTag}>通用</Tag>
          )}
        </div>
        <p className={styles.cardDesc}>
          {workflow.description?.trim() || '暂无描述，点击查看详情并编排画布。'}
        </p>
      </div>
      <div className={styles.cardFooter}>
        <span className={styles.cardAuthor}>{isPublish ? '@发布' : '@通用'}</span>
        <span className={styles.cardUsage}>
          {stepCount} 步 · {updatedLabel}
        </span>
      </div>
    </Card>
  )
}
