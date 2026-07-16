import type { WorkflowNode } from '@shared/types'
import { queryNodeTypeLabel } from '../../types'
import styles from './WorkflowNodeCard.module.css'

interface WorkflowNodeCardProps {
  node: WorkflowNode
  index: number
  total: number
  onEdit: () => void
  onRemove: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}

function queryNodeSummary(node: WorkflowNode): string {
  if (node.type === 'agent') {
    return node.prompt.slice(0, 80) || '（未填写提示词）'
  }
  if (node.type === 'tool') {
    return node.toolName ? `调用 ${node.toolName}` : '（未选择工具）'
  }
  if (node.type === 'await_user') {
    return node.reason || '等待用户确认'
  }
  if (node.type === 'notify') {
    return node.channelId ? `推送至 ${node.channelId}` : '（未选择渠道）'
  }
  if (node.type === 'toast') {
    return node.contentTemplate?.slice(0, 80) || '（未填写内容）'
  }
  if (node.type === 'condition') {
    return `${node.mode === 'agent' ? 'Agent 选路' : '表达式'} · ${node.cases.length} 路`
  }
  if (node.type === 'start') return '流程入口'
  if (node.type === 'end') return '流程出口'
  return `${node.children.length} 个子步骤`
}

/** 单节点摘要卡片：展示类型与操作，不含业务请求 */
export function WorkflowNodeCard({
  node,
  index,
  total,
  onEdit,
  onRemove,
  onMoveUp,
  onMoveDown
}: WorkflowNodeCardProps): React.ReactElement {
  return (
    <div className={styles.card}>
      <div className={styles.head}>
        <div className={styles.titleRow}>
          <span className={styles.index}>{index + 1}</span>
          <span className={styles.title}>{node.title}</span>
          <Tag>{queryNodeTypeLabel(node.type)}</Tag>
        </div>
        <div className={styles.summary}>{queryNodeSummary(node)}</div>
        {node.type === 'parallel' && node.children.length > 0 && (
          <ul className={styles.children}>
            {node.children.map((c) => (
              <li key={c.id}>
                {c.title}
                <Tag className={styles.childTag}>{queryNodeTypeLabel(c.type)}</Tag>
              </li>
            ))}
          </ul>
        )}
      </div>
      <Space size={0} className={styles.actions}>
        <Button type="link" size="small" disabled={index === 0} onClick={onMoveUp}>
          上移
        </Button>
        <Button type="link" size="small" disabled={index >= total - 1} onClick={onMoveDown}>
          下移
        </Button>
        <Button type="link" size="small" onClick={onEdit}>
          编辑
        </Button>
        <Popconfirm title="删除此步骤？" okText="删除" cancelText="取消" onConfirm={onRemove}>
          <Button type="link" size="small" danger icon={<DeleteOutlined />}>
            删除
          </Button>
        </Popconfirm>
      </Space>
    </div>
  )
}
