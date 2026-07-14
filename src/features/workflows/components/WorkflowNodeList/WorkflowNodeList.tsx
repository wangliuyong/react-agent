import type { MenuProps } from 'antd'
import type { WorkflowLeafNode, WorkflowNode, WorkflowParallelNode } from '@shared/types'
import { WorkflowNodeCard } from '../WorkflowNodeCard'
import { WorkflowNodeEditModal } from '../WorkflowNodeEditModal'
import { createEmptyNode } from '../../types'
import styles from './WorkflowNodeList.module.css'

interface WorkflowNodeListProps {
  nodes: WorkflowNode[]
  onChange: (nodes: WorkflowNode[]) => void
}

type EditTarget =
  | { kind: 'root'; index: number | null }
  | { kind: 'child'; parentIndex: number; childIndex: number | null }

/** 节点列表容器：排序 / 增删 / 打开编辑；数据经 onChange 上抛 */
export function WorkflowNodeList({
  nodes,
  onChange
}: WorkflowNodeListProps): React.ReactElement {
  const [editOpen, setEditOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null)
  const [editingNode, setEditingNode] = useState<WorkflowNode | null>(null)

  const openEditRoot = (index: number): void => {
    setEditTarget({ kind: 'root', index })
    setEditingNode(nodes[index] ?? null)
    setEditOpen(true)
  }

  const openCreateChild = (parentIndex: number): void => {
    setEditTarget({ kind: 'child', parentIndex, childIndex: null })
    setEditingNode(null)
    setEditOpen(true)
  }

  const openEditChild = (parentIndex: number, childIndex: number): void => {
    const parent = nodes[parentIndex]
    if (!parent || parent.type !== 'parallel') return
    setEditTarget({ kind: 'child', parentIndex, childIndex })
    setEditingNode(parent.children[childIndex] ?? null)
    setEditOpen(true)
  }

  const moveRoot = (index: number, delta: number): void => {
    const nextIndex = index + delta
    if (nextIndex < 0 || nextIndex >= nodes.length) return
    const next = [...nodes]
    const [item] = next.splice(index, 1)
    next.splice(nextIndex, 0, item)
    onChange(next)
  }

  const removeRoot = (index: number): void => {
    onChange(nodes.filter((_, i) => i !== index))
  }

  const handleEditOk = (node: WorkflowNode): void => {
    if (!editTarget) return

    if (editTarget.kind === 'root') {
      if (editTarget.index == null) {
        onChange([...nodes, node])
      } else {
        onChange(nodes.map((n, i) => (i === editTarget.index ? node : n)))
      }
    } else {
      if (node.type === 'parallel') {
        message.error('并行组内不能再嵌套并行组')
        return
      }
      const leaf = node as WorkflowLeafNode
      const next = nodes.map((n, i) => {
        if (i !== editTarget.parentIndex || n.type !== 'parallel') return n
        const children =
          editTarget.childIndex == null
            ? [...n.children, leaf]
            : n.children.map((c, ci) => (ci === editTarget.childIndex ? leaf : c))
        const parallel: WorkflowParallelNode = { ...n, children }
        return parallel
      })
      onChange(next)
    }

    setEditOpen(false)
    setEditTarget(null)
    setEditingNode(null)
  }

  const addMenuItems: MenuProps['items'] = [
    {
      key: 'agent',
      label: 'Agent 步骤',
      onClick: () => {
        setEditTarget({ kind: 'root', index: null })
        setEditingNode(createEmptyNode('agent'))
        setEditOpen(true)
      }
    },
    {
      key: 'tool',
      label: '工具步骤',
      onClick: () => {
        setEditTarget({ kind: 'root', index: null })
        setEditingNode(createEmptyNode('tool'))
        setEditOpen(true)
      }
    },
    {
      key: 'await_user',
      label: '等待确认',
      onClick: () => {
        setEditTarget({ kind: 'root', index: null })
        setEditingNode(createEmptyNode('await_user'))
        setEditOpen(true)
      }
    },
    {
      key: 'parallel',
      label: '并行组',
      onClick: () => {
        setEditTarget({ kind: 'root', index: null })
        setEditingNode(createEmptyNode('parallel'))
        setEditOpen(true)
      }
    }
  ]

  return (
    <div className={styles.wrap}>
      <div className={styles.toolbar}>
        <span className={styles.toolbarLabel}>步骤编排</span>
        <Dropdown menu={{ items: addMenuItems }}>
          <Button type="primary" size="small" icon={<PlusOutlined />}>
            添加步骤
          </Button>
        </Dropdown>
      </div>

      {nodes.length === 0 ? (
        <Empty description="暂无步骤。先添加 Agent / 工具 / 确认 节点。" />
      ) : (
        <div className={styles.list}>
          {nodes.map((node, index) => (
            <div key={node.id} className={styles.block}>
              <WorkflowNodeCard
                node={node}
                index={index}
                total={nodes.length}
                onEdit={() => openEditRoot(index)}
                onRemove={() => removeRoot(index)}
                onMoveUp={() => moveRoot(index, -1)}
                onMoveDown={() => moveRoot(index, 1)}
              />
              {node.type === 'parallel' && (
                <div className={styles.parallelKids}>
                  <div className={styles.parallelBar}>
                    <span>并行子步骤</span>
                    <Button type="link" size="small" onClick={() => openCreateChild(index)}>
                      添加子步骤
                    </Button>
                  </div>
                  {node.children.length === 0 ? (
                    <div className={styles.parallelEmpty}>组内暂无叶子步骤</div>
                  ) : (
                    node.children.map((child, childIndex) => (
                      <div key={child.id} className={styles.childRow}>
                        <span className={styles.childTitle}>
                          {child.title}
                          <Tag>{child.type}</Tag>
                        </span>
                        <Space size={0}>
                          <Button
                            type="link"
                            size="small"
                            onClick={() => openEditChild(index, childIndex)}
                          >
                            编辑
                          </Button>
                          <Popconfirm
                            title="删除子步骤？"
                            onConfirm={() => {
                              const next = nodes.map((n, i) => {
                                if (i !== index || n.type !== 'parallel') return n
                                return {
                                  ...n,
                                  children: n.children.filter((_, ci) => ci !== childIndex)
                                }
                              })
                              onChange(next)
                            }}
                          >
                            <Button type="link" size="small" danger>
                              删除
                            </Button>
                          </Popconfirm>
                        </Space>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <WorkflowNodeEditModal
        open={editOpen}
        node={editingNode}
        leafOnly={editTarget?.kind === 'child'}
        onCancel={() => {
          setEditOpen(false)
          setEditTarget(null)
          setEditingNode(null)
        }}
        onOk={handleEditOk}
      />
    </div>
  )
}
