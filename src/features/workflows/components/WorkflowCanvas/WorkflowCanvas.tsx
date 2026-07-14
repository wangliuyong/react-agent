import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type NodeTypes,
  type OnConnect,
  type OnEdgesChange,
  type OnNodesChange,
  MarkerType
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import type { MenuProps } from 'antd'
import type {
  WorkflowCanvas as WorkflowCanvasModel,
  WorkflowLeafNode,
  WorkflowNode
} from '@shared/types'
import { WorkflowFlowNode, type WorkflowRfNode } from '../WorkflowFlowNode'
import { WorkflowNodeEditModal } from '../WorkflowNodeEditModal'
import { createEmptyNode } from '../../types'
import {
  applyCanvasToDefinition,
  flattenWorkflowLeaves,
  resolveWorkflowCanvas
} from '../../utils/workflowCanvasGraph'
import styles from './WorkflowCanvas.module.css'

const nodeTypes = { workflow: WorkflowFlowNode } as NodeTypes

interface WorkflowCanvasProps {
  /** 切换流程时重挂载画布，避免编辑过程被父级回写打断 */
  workflowId: string
  nodes: WorkflowNode[]
  canvas?: WorkflowCanvasModel
  onChange: (next: { nodes: WorkflowNode[]; canvas: WorkflowCanvasModel }) => void
}

function toRfNodes(
  leaves: WorkflowLeafNode[],
  canvas: WorkflowCanvasModel,
  handlers: {
    onEdit: (id: string) => void
    onDelete: (id: string) => void
  }
): WorkflowRfNode[] {
  return leaves.map((leaf) => ({
    id: leaf.id,
    type: 'workflow',
    position: canvas.positions[leaf.id] ?? { x: 80, y: 80 },
    data: {
      leaf,
      onEdit: handlers.onEdit,
      onDelete: handlers.onDelete
    }
  }))
}

function toRfEdges(canvas: WorkflowCanvasModel): Edge[] {
  return canvas.edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    animated: true,
    markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
    style: { stroke: 'var(--db-primary)', strokeWidth: 1.5 }
  }))
}

function queryLeavesFromRf(rfNodes: WorkflowRfNode[]): WorkflowLeafNode[] {
  return rfNodes.map((n) => n.data.leaf)
}

function queryCanvasFromRf(
  rfNodes: WorkflowRfNode[],
  edges: Edge[]
): WorkflowCanvasModel {
  const positions: Record<string, { x: number; y: number }> = {}
  for (const n of rfNodes) {
    positions[n.id] = { x: n.position.x, y: n.position.y }
  }
  return {
    positions,
    edges: edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target
    }))
  }
}

function queryEdgeStyle(): Partial<Edge> {
  return {
    animated: true,
    markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
    style: { stroke: 'var(--db-primary)', strokeWidth: 1.5 }
  }
}

/**
 * 流程画布：拖拽节点 + 从锚点拉线连接。
 * 一源多目标编译为 parallel；保存坐标与边到 workflow.canvas。
 */
export function WorkflowCanvas({
  workflowId,
  nodes: engineNodes,
  canvas: canvasProp,
  onChange
}: WorkflowCanvasProps): React.ReactElement {
  const [editOpen, setEditOpen] = useState(false)
  const [editingLeaf, setEditingLeaf] = useState<WorkflowLeafNode | null>(null)
  const [graphError, setGraphError] = useState<string | null>(null)

  const engineNodesRef = useRef(engineNodes)
  engineNodesRef.current = engineNodes

  const onEditRef = useRef<(id: string) => void>(() => { })
  const onDeleteRef = useRef<(id: string) => void>(() => { })

  const initialCanvas = resolveWorkflowCanvas(engineNodes, canvasProp)
  const [rfNodes, setNodes, onNodesChangeInternal] = useNodesState<WorkflowRfNode>(
    toRfNodes(flattenWorkflowLeaves(engineNodes), initialCanvas, {
      onEdit: (id) => onEditRef.current(id),
      onDelete: (id) => onDeleteRef.current(id)
    })
  )
  const [rfEdges, setEdges, onEdgesChangeInternal] = useEdgesState(toRfEdges(initialCanvas))

  const emitChange = useCallback(
    (nextNodes: WorkflowRfNode[], nextEdges: Edge[]) => {
      const leaves = queryLeavesFromRf(nextNodes)
      const canvas = queryCanvasFromRf(nextNodes, nextEdges)
      const applied = applyCanvasToDefinition(leaves, canvas)
      if (applied.error) {
        setGraphError(applied.error)
        onChange({ nodes: engineNodesRef.current, canvas })
        return
      }
      setGraphError(null)
      onChange({ nodes: applied.nodes, canvas: applied.canvas })
    },
    [onChange]
  )

  onEditRef.current = (id: string) => {
    const leaf =
      queryLeavesFromRf(rfNodes).find((l) => l.id === id) ??
      flattenWorkflowLeaves(engineNodesRef.current).find((l) => l.id === id) ??
      null
    setEditingLeaf(leaf)
    setEditOpen(true)
  }

  onDeleteRef.current = (id: string) => {
    setNodes((prev) => {
      const nextNodes = prev.filter((n) => n.id !== id)
      setEdges((eds) => {
        const nextEdges = eds.filter((e) => e.source !== id && e.target !== id)
        queueMicrotask(() => emitChange(nextNodes, nextEdges))
        return nextEdges
      })
      return nextNodes
    })
  }

  /** 仅切换流程定义时重置；编辑中的 canvas 回写不触发重载 */
  useEffect(() => {
    const canvas = resolveWorkflowCanvas(engineNodes, canvasProp)
    const leaves = flattenWorkflowLeaves(engineNodes)
    setNodes(
      toRfNodes(leaves, canvas, {
        onEdit: (id) => onEditRef.current(id),
        onDelete: (id) => onDeleteRef.current(id)
      })
    )
    setEdges(toRfEdges(canvas))
    setGraphError(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workflowId])

  const onNodesChange: OnNodesChange<WorkflowRfNode> = useCallback(
    (changes) => {
      onNodesChangeInternal(changes)
      const shouldPersist = changes.some(
        (c) =>
          (c.type === 'position' && 'dragging' in c && c.dragging === false) ||
          c.type === 'remove'
      )
      if (!shouldPersist) return
      queueMicrotask(() => {
        setNodes((ns) => {
          setEdges((es) => {
            emitChange(ns, es)
            return es
          })
          return ns
        })
      })
    },
    [onNodesChangeInternal, emitChange, setNodes, setEdges]
  )

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      onEdgesChangeInternal(changes)
      if (!changes.some((c) => c.type === 'remove' || c.type === 'add')) return
      queueMicrotask(() => {
        setNodes((ns) => {
          setEdges((es) => {
            emitChange(ns, es)
            return es
          })
          return ns
        })
      })
    },
    [onEdgesChangeInternal, emitChange, setNodes, setEdges]
  )

  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => {
        const next = addEdge(
          {
            ...connection,
            id: `e_${connection.source}_${connection.target}_${Date.now()}`,
            ...queryEdgeStyle()
          },
          eds
        )
        queueMicrotask(() => {
          setNodes((ns) => {
            emitChange(ns, next)
            return ns
          })
        })
        return next
      })
    },
    [setEdges, setNodes, emitChange]
  )

  const addLeaf = (leaf: WorkflowLeafNode): void => {
    const offset = rfNodes.length
    const rfNode: WorkflowRfNode = {
      id: leaf.id,
      type: 'workflow',
      position: { x: 120 + (offset % 3) * 48, y: 100 + offset * 40 },
      data: {
        leaf,
        onEdit: (id) => onEditRef.current(id),
        onDelete: (id) => onDeleteRef.current(id)
      }
    }
    setNodes((ns) => {
      const next = [...ns, rfNode]
      queueMicrotask(() => emitChange(next, rfEdges))
      return next
    })
  }

  const addMenu: MenuProps['items'] = [
    {
      key: 'agent',
      label: 'Agent 步骤',
      onClick: () => addLeaf(createEmptyNode('agent') as WorkflowLeafNode)
    },
    {
      key: 'tool',
      label: '工具步骤',
      onClick: () => addLeaf(createEmptyNode('tool') as WorkflowLeafNode)
    },
    {
      key: 'await_user',
      label: '等待确认',
      onClick: () => addLeaf(createEmptyNode('await_user') as WorkflowLeafNode)
    }
  ]

  const handleEditOk = (node: WorkflowNode): void => {
    if (node.type === 'parallel') {
      message.error('画布只用叶子节点；并行请从一个节点连出多条线')
      return
    }
    setNodes((ns) => {
      const exists = ns.some((n) => n.id === node.id)
      const next: WorkflowRfNode[] = exists
        ? ns.map((n) =>
          n.id === node.id
            ? { ...n, data: { ...n.data, leaf: node } }
            : n
        )
        : [
          ...ns,
          {
            id: node.id,
            type: 'workflow',
            position: { x: 140, y: 120 + ns.length * 40 },
            data: {
              leaf: node,
              onEdit: (id) => onEditRef.current(id),
              onDelete: (id) => onDeleteRef.current(id)
            }
          }
        ]
      queueMicrotask(() => emitChange(next, rfEdges))
      return next
    })
    setEditOpen(false)
    setEditingLeaf(null)
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.toolbar}>
        <span className={styles.hint}>双击节点可编辑 · 多条出线表示并行分支</span>
        <Dropdown menu={{ items: addMenu }}>
          <Button type="primary" size="small" icon={<PlusOutlined />}>
            添加节点
          </Button>
        </Dropdown>
      </div>
      {graphError ? (
        <div className={styles.errorBar}>连线未完成编译：{graphError}</div>
      ) : null}
      <div className={styles.canvas}>
        <ReactFlow
          nodes={rfNodes}
          edges={rfEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          deleteKeyCode={['Backspace', 'Delete']}
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={16} size={1} />
          <Controls />
          <MiniMap pannable zoomable />
        </ReactFlow>
      </div>

      <WorkflowNodeEditModal
        open={editOpen}
        node={editingLeaf}
        leafOnly
        onCancel={() => {
          setEditOpen(false)
          setEditingLeaf(null)
        }}
        onOk={handleEditOk}
      />
    </div>
  )
}
