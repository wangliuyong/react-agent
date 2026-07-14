import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState
} from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  addEdge,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type Node,
  type NodeTypes,
  type OnConnect,
  type OnEdgesChange,
  type OnNodesChange,
  MarkerType
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import type {
  WorkflowCanvas as WorkflowCanvasModel,
  WorkflowConditionNode,
  WorkflowLeafNode,
  WorkflowNode
} from '@shared/types'
import { WorkflowFlowNode, type WorkflowRfNode } from '../WorkflowFlowNode'
import {
  WorkflowConditionFlowNode,
  type WorkflowConditionRfNode
} from '../WorkflowConditionFlowNode'
import { WorkflowNodeEditModal } from '../WorkflowNodeEditModal'
import { createConditionNode, createEmptyNode } from '../../types'
import {
  applyCanvasToDefinition,
  flattenWorkflowConditions,
  flattenWorkflowLeaves,
  resolveWorkflowCanvas
} from '../../utils/workflowCanvasGraph'
import styles from './WorkflowCanvas.module.css'

const nodeTypes = {
  workflow: WorkflowFlowNode,
  workflowCondition: WorkflowConditionFlowNode
} as NodeTypes

/** 画布上可新增的叶子类型 */
export type WorkflowCanvasLeafType = WorkflowLeafNode['type']

export type WorkflowCanvasRfNode = WorkflowRfNode | WorkflowConditionRfNode

/** 供父级（画布编辑区头部）调用的命令式 API */
export interface WorkflowCanvasHandle {
  addLeafByType: (type: WorkflowCanvasLeafType) => void
  /** 追加默认 If/Else 条件节点 */
  addCondition: () => void
}

interface WorkflowCanvasProps {
  workflowId: string
  nodes: WorkflowNode[]
  canvas?: WorkflowCanvasModel
  onChange: (next: { nodes: WorkflowNode[]; canvas: WorkflowCanvasModel }) => void
  isFullscreen?: boolean
  fullscreenContainer?: HTMLElement | null
}

function toRfNodes(
  leaves: WorkflowLeafNode[],
  conditions: WorkflowConditionNode[],
  canvas: WorkflowCanvasModel,
  handlers: {
    onEdit: (id: string) => void
    onDelete: (id: string) => void
  }
): WorkflowCanvasRfNode[] {
  const leafNodes: WorkflowRfNode[] = leaves.map((leaf) => ({
    id: leaf.id,
    type: 'workflow',
    position: canvas.positions[leaf.id] ?? { x: 80, y: 80 },
    data: {
      leaf,
      onEdit: handlers.onEdit,
      onDelete: handlers.onDelete
    }
  }))
  const condNodes: WorkflowConditionRfNode[] = conditions.map((condition) => ({
    id: condition.id,
    type: 'workflowCondition',
    position: canvas.positions[condition.id] ?? { x: 40, y: 40 },
    data: {
      condition,
      onEdit: handlers.onEdit
    }
  }))
  return [...leafNodes, ...condNodes]
}

function toRfEdges(canvas: WorkflowCanvasModel): Edge[] {
  return canvas.edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    sourceHandle: e.branchKey ?? null,
    label: e.branchKey,
    animated: true,
    markerEnd: { type: MarkerType.ArrowClosed, width: 8, height: 8 },
    style: { stroke: 'var(--db-primary)', strokeWidth: 1 },
    labelStyle: { fontSize: 6, fill: 'var(--db-text-secondary)' }
  }))
}

function queryLeavesFromRf(rfNodes: WorkflowCanvasRfNode[]): WorkflowLeafNode[] {
  return rfNodes
    .filter((n): n is WorkflowRfNode => n.type === 'workflow')
    .map((n) => n.data.leaf)
}

function queryConditionsFromRf(rfNodes: WorkflowCanvasRfNode[]): WorkflowConditionNode[] {
  return rfNodes
    .filter((n): n is WorkflowConditionRfNode => n.type === 'workflowCondition')
    .map((n) => n.data.condition)
}

function queryCanvasFromRf(
  rfNodes: WorkflowCanvasRfNode[],
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
      target: e.target,
      ...(e.sourceHandle
        ? { branchKey: String(e.sourceHandle) }
        : {})
    }))
  }
}

function queryEdgeStyle(): Partial<Edge> {
  return {
    animated: true,
    markerEnd: { type: MarkerType.ArrowClosed, width: 8, height: 8 },
    style: { stroke: 'var(--db-primary)', strokeWidth: 1 },
    labelStyle: { fontSize: 6, fill: 'var(--db-text-secondary)' }
  }
}

/**
 * 流程画布：叶子 + 条件节点；无标签多出线 = 并行，条件出口带 branchKey = XOR。
 */
export const WorkflowCanvas = forwardRef<WorkflowCanvasHandle, WorkflowCanvasProps>(
  function WorkflowCanvas(
    {
      workflowId,
      nodes: engineNodes,
      canvas: canvasProp,
      onChange,
      isFullscreen = false,
      fullscreenContainer = null
    },
    ref
  ): React.ReactElement {
    const [editOpen, setEditOpen] = useState(false)
    const [editingNode, setEditingNode] = useState<WorkflowLeafNode | WorkflowConditionNode | null>(
      null
    )
    const [graphError, setGraphError] = useState<string | null>(null)

    const engineNodesRef = useRef(engineNodes)
    engineNodesRef.current = engineNodes

    const onEditRef = useRef<(id: string) => void>(() => {})
    const onDeleteRef = useRef<(id: string) => void>(() => {})

    const initialCanvas = resolveWorkflowCanvas(engineNodes, canvasProp)
    const [rfNodes, setNodes, onNodesChangeInternal] = useNodesState<WorkflowCanvasRfNode>(
      toRfNodes(
        flattenWorkflowLeaves(engineNodes),
        flattenWorkflowConditions(engineNodes),
        initialCanvas,
        {
          onEdit: (id) => onEditRef.current(id),
          onDelete: (id) => onDeleteRef.current(id)
        }
      )
    )
    const [rfEdges, setEdges, onEdgesChangeInternal] = useEdgesState(toRfEdges(initialCanvas))

    const emitChange = useCallback(
      (nextNodes: WorkflowCanvasRfNode[], nextEdges: Edge[]) => {
        const leaves = queryLeavesFromRf(nextNodes)
        const conditions = queryConditionsFromRf(nextNodes)
        const canvas = queryCanvasFromRf(nextNodes, nextEdges)
        const applied = applyCanvasToDefinition(leaves, conditions, canvas)
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
      const fromRfLeaf = queryLeavesFromRf(rfNodes).find((l) => l.id === id)
      const fromRfCond = queryConditionsFromRf(rfNodes).find((c) => c.id === id)
      const fromEngineLeaf = flattenWorkflowLeaves(engineNodesRef.current).find((l) => l.id === id)
      const fromEngineCond = flattenWorkflowConditions(engineNodesRef.current).find(
        (c) => c.id === id
      )
      // 编辑时优先用引擎里的 condition（含已编译的 cases.nodes），RF 上 nodes 常为空
      const engineFull = engineNodesRef.current.find((n) => n.id === id)
      if (engineFull?.type === 'condition') {
        setEditingNode(engineFull)
      } else {
        setEditingNode(fromRfCond ?? fromEngineCond ?? fromRfLeaf ?? fromEngineLeaf ?? null)
      }
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

    useEffect(() => {
      const canvas = resolveWorkflowCanvas(engineNodes, canvasProp)
      setNodes(
        toRfNodes(
          flattenWorkflowLeaves(engineNodes),
          flattenWorkflowConditions(engineNodes),
          canvas,
          {
            onEdit: (id) => onEditRef.current(id),
            onDelete: (id) => onDeleteRef.current(id)
          }
        )
      )
      setEdges(toRfEdges(canvas))
      setGraphError(null)
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [workflowId])

    const onNodesChange: OnNodesChange<WorkflowCanvasRfNode> = useCallback(
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
        setNodes((ns) => {
          const sourceNode = ns.find((n) => n.id === connection.source)
          const isCondition = sourceNode?.type === 'workflowCondition'
          // 条件出口 Handle.id = case.key，写入 branchKey；普通连线不带标签
          const branchKey =
            isCondition && connection.sourceHandle
              ? String(connection.sourceHandle)
              : undefined
          setEdges((eds) => {
            const next = addEdge(
              {
                ...connection,
                id: `e_${connection.source}_${connection.target}_${Date.now()}`,
                sourceHandle: branchKey ?? connection.sourceHandle,
                label: branchKey,
                ...queryEdgeStyle()
              },
              eds
            )
            queueMicrotask(() => emitChange(ns, next))
            return next
          })
          return ns
        })
      },
      [setEdges, setNodes, emitChange]
    )

    const addLeaf = useCallback(
      (leaf: WorkflowLeafNode): void => {
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
      },
      [rfNodes.length, rfEdges, setNodes, emitChange]
    )

    const addCondition = useCallback((): void => {
      const condition = createConditionNode()
      const offset = rfNodes.length
      const rfNode: WorkflowConditionRfNode = {
        id: condition.id,
        type: 'workflowCondition',
        position: { x: 100 + (offset % 3) * 48, y: 90 + offset * 40 },
        data: {
          condition,
          onEdit: (id) => onEditRef.current(id)
        }
      }
      setNodes((ns) => {
        const next = [...ns, rfNode]
        queueMicrotask(() => emitChange(next, rfEdges))
        return next
      })
    }, [rfNodes.length, rfEdges, setNodes, emitChange])

    useImperativeHandle(
      ref,
      () => ({
        addLeafByType: (type) => {
          addLeaf(createEmptyNode(type) as WorkflowLeafNode)
        },
        addCondition
      }),
      [addLeaf, addCondition]
    )

    const handleEditOk = (node: WorkflowNode): void => {
      if (node.type === 'parallel') {
        message.error('画布只用叶子与条件节点；并行请从一个步骤连出多条无标签线')
        return
      }

      if (node.type === 'condition') {
        setNodes((ns) => {
          const next = ns.map((n) => {
            if (n.id !== node.id || n.type !== 'workflowCondition') return n
            return {
              ...n,
              data: { ...n.data, condition: { ...node, cases: node.cases.map((c) => ({ ...c })) } }
            }
          }) as WorkflowCanvasRfNode[]
          // case.key 变更时同步边的 sourceHandle / branchKey
          setEdges((eds) => {
            const keySet = new Set(node.cases.map((c) => c.key))
            const synced = eds.map((e) => {
              if (e.source !== node.id) return e
              const handle = e.sourceHandle ? String(e.sourceHandle) : ''
              if (handle && keySet.has(handle)) {
                return { ...e, label: handle }
              }
              return e
            })
            queueMicrotask(() => emitChange(next, synced))
            return synced
          })
          return next
        })
        setEditOpen(false)
        setEditingNode(null)
        return
      }

      setNodes((ns) => {
        const exists = ns.some((n) => n.id === node.id && n.type === 'workflow')
        const next: WorkflowCanvasRfNode[] = exists
          ? ns.map((n) =>
              n.id === node.id && n.type === 'workflow'
                ? { ...n, data: { ...n.data, leaf: node } }
                : n
            )
          : [
              ...ns,
              {
                id: node.id,
                type: 'workflow' as const,
                position: { x: 140, y: 120 + ns.length * 40 },
                data: {
                  leaf: node,
                  onEdit: (id: string) => onEditRef.current(id),
                  onDelete: (id: string) => onDeleteRef.current(id)
                }
              }
            ]
        queueMicrotask(() => emitChange(next, rfEdges))
        return next
      })
      setEditOpen(false)
      setEditingNode(null)
    }

    return (
      <div className={styles.wrap}>
        {graphError ? (
          <div className={styles.errorBar}>连线未完成编译：{graphError}</div>
        ) : null}
        <div className={styles.canvas}>
          <ReactFlow
            nodes={rfNodes as Node[]}
            edges={rfEdges}
            onNodesChange={onNodesChange as OnNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            deleteKeyCode={['Backspace', 'Delete']}
            proOptions={{ hideAttribution: true }}
          >
            <Background gap={16} size={1} />
            <Controls />
          </ReactFlow>
        </div>

        <WorkflowNodeEditModal
          open={editOpen}
          node={editingNode}
          leafOnly
          allowCondition
          isFullscreen={isFullscreen}
          fullscreenContainer={fullscreenContainer}
          onCancel={() => {
            setEditOpen(false)
            setEditingNode(null)
          }}
          onOk={handleEditOk}
        />
      </div>
    )
  }
)
