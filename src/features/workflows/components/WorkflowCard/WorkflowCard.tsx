import type { CSSProperties } from 'react'
import type { WorkflowDefinition } from '@shared/types'
import { flattenWorkflowLeaves } from '../../utils/workflowCanvasGraph'
import cardStyles from '@/components/entity-card'

const { Text } = Typography

interface WorkflowCardProps {
  workflow: WorkflowDefinition
  index: number
  /** 打开详情弹窗（只读浏览 + 元信息） */
  onView: (id: string) => void
  /** 打开画布抽屉编排步骤 */
  onEdit: (id: string) => void
}

/** 流程卡片：操作区图标进入详情/画布，整卡不可点 */
export function WorkflowCard({
  workflow,
  index,
  onView,
  onEdit
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
      className={cardStyles.card}
      style={{ '--card-index': index } as CSSProperties}
    >
      <div className={cardStyles.cardHead}>
        <div className={cardStyles.cardTitleBlock}>
          <Text className={cardStyles.cardTitle} ellipsis={{ tooltip: workflow.title }}>
            {workflow.title}
          </Text>
          <div className={cardStyles.tagRow}>
            {isPublish ? (
              <Tag className={cardStyles.primaryTag}>发布</Tag>
            ) : (
              <Tag className={cardStyles.mutedTag}>通用</Tag>
            )}
          </div>
        </div>
        <div className={cardStyles.cardActions}>
          <Tooltip title="查看详情">
            <Button
              type="text"
              size="small"
              className={cardStyles.actionBtn}
              icon={<EyeOutlined />}
              aria-label={`查看流程 ${workflow.title}`}
              onClick={() => onView(workflow.id)}
            />
          </Tooltip>
          <Tooltip title="编辑画布">
            <Button
              type="text"
              size="small"
              className={cardStyles.actionBtn}
              icon={<EditOutlined />}
              aria-label={`编辑流程 ${workflow.title}`}
              onClick={() => onEdit(workflow.id)}
            />
          </Tooltip>
        </div>
      </div>
      <p className={cardStyles.cardDescription}>
        {workflow.description?.trim() || '暂无描述，使用右上角图标查看详情或编辑画布。'}
      </p>
      <div className={cardStyles.cardFooter}>
        <Text type="secondary" className={cardStyles.footerHint}>
          {isPublish ? '@发布' : '@通用'}
        </Text>
        <Text type="secondary" className={cardStyles.metaLabel}>
          {stepCount} 步 · {updatedLabel}
        </Text>
      </div>
    </Card>
  )
}
