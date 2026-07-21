import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent
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
  TaskItemStatus,
  WorkflowCanvas as WorkflowCanvasModel,
  WorkflowCanvasEdge,
  WorkflowLeafNode,
  WorkflowNode,
  WorkflowTerminalNode
} from '@shared/types'
import { WorkflowFlowNode, type WorkflowRfNode } from '../WorkflowFlowNode'
import {
  WorkflowTerminalFlowNode,
  type WorkflowTerminalRfNode
} from '../WorkflowTerminalFlowNode'
import { WorkflowNodeEditModal } from '../WorkflowNodeEditModal'
import {
  WorkflowEdgeEditModal,
  type WorkflowEdgeEditValue
} from '../WorkflowEdgeEditModal'
import { createEmptyNode } from '../../types'
import {
  applyCanvasToDefinition,
  flattenWorkflowLeaves,
  flattenWorkflowTerminals,
  resolveWorkflowCanvas
} from '../../utils/workflowCanvasGraph'
import { queryUpstreamOutputKeys } from '@shared/workflow-node-io'
import styles from './WorkflowCanvas.module.css'

const nodeTypes = {
  workflow: WorkflowFlowNode,
  workflowTerminal: WorkflowTerminalFlowNode
} as NodeTypes

export type WorkflowCanvasLeafType = WorkflowLeafNode['type']
export type WorkflowCanvasRfNode = WorkflowRfNode | WorkflowTerminalRfNode

export interface WorkflowCanvasHandle {
  addLeafByType: (type: WorkflowCanvasLeafType) => void
}

interface WorkflowCanvasProps {
  workflowId: string
  nodes: WorkflowNode[]
  canvas?: WorkflowCanvasModel
  onChange: (next: { nodes: WorkflowNode[]; canvas: WorkflowCanvasModel }) => void
  isFullscreen?: boolean
  fullscreenContainer?: HTMLElement | null
  /**
   * 正在执行的节点 id。
   * 指向这些节点的入边会开启流动动画；空数组表示默认静止。
   */
  activeNodeIds?: string[]
  /** 各叶子节点执行态；完成/失败后由节点自行展示对应样式 */
  nodeStatuses?: Record<string, TaskItemStatus>
}

function queryEdgeLabel(e: WorkflowCanvasEdge): string | undefined {
  if (e.label?.trim()) return e.label.trim()
  if (e.isDefault) return '默认'
  if (e.when?.expression?.trim()) return e.when.expression.trim()
  if (e.when?.contextKey) {
    return `${e.when.contextKey}${e.when.op ? ` ${e.when.op}` : ''}`
  }
  return undefined
}

function edgeHasCondition(e: WorkflowCanvasEdge): boolean {
  if (e.isDefault) return true
  return Boolean(e.when?.expression?.trim() || e.when?.contextKey?.trim())
}

/**
 * 判断入边是否应开启流动动画。
 * - 仅当目标节点正在执行时考虑动画
 * - 默认支路边（isDefault）永不动画
 * - 来源节点已跳过（未命中支路）的汇聚边不动画
 */
function queryEdgeShouldAnimate(
  edge: { target: string; source: string; data?: unknown },
  activeNodeIds: string[],
  nodeStatuses: Record<string, TaskItemStatus> = {}
): boolean {
  const active = new Set(activeNodeIds)
  if (!active.has(edge.target)) return false

  const data = (edge.data ?? {}) as Partial<WorkflowCanvasEdge>
  if (data.isDefault) return false

  if (nodeStatuses[edge.source] === 'skipped') return false

  return true
}

function toRfNodes(
  leaves: WorkflowLeafNode[],
  terminals: WorkflowTerminalNode[],
  canvas: WorkflowCanvasModel,
  handlers: { onEdit: (id: string) => void; onDelete: (id: string) => void },
  nodeStatuses: Record<string, TaskItemStatus> = {}
): WorkflowCanvasRfNode[] {
  const leafNodes: WorkflowRfNode[] = leaves.map((leaf) => ({
    id: leaf.id,
    type: 'workflow',
    position: canvas.positions[leaf.id] ?? { x: 80, y: 80 },
    data: {
      leaf,
      execStatus: nodeStatuses[leaf.id],
      onEdit: handlers.onEdit,
      onDelete: handlers.onDelete
    }
  }))
  const terminalNodes: WorkflowTerminalRfNode[] = terminals.map((terminal) => ({
    id: terminal.id,
    type: 'workflowTerminal',
    position: canvas.positions[terminal.id] ?? {
      x: 80,
      y: terminal.type === 'start' ? 24 : 280
    },
    deletable: false,
    data: { terminal }
  }))
  return [...terminalNodes, ...leafNodes]
}

function toRfEdges(
  canvas: WorkflowCanvasModel,
  activeNodeIds: string[] = [],
  nodeStatuses: Record<string, TaskItemStatus> = {}
): Edge[] {
  return canvas.edges.map((e) => {
    const label = queryEdgeLabel(e)
    const conditional = edgeHasCondition(e)
    const shouldAnimate = queryEdgeShouldAnimate(e, activeNodeIds, nodeStatuses)
    return {
      id: e.id,
      source: e.source,
      target: e.target,
      label,
      // 默认静止；仅命中支路且目标节点执行中时流动
      animated: shouldAnimate,
      className: [
        conditional ? 'wf-edge-conditional' : 'wf-edge-default',
        shouldAnimate ? 'wf-edge-executing' : ''
      ]
        .filter(Boolean)
        .join(' '),
      markerEnd: { type: MarkerType.ArrowClosed, width: 8, height: 8 },
      style: {
        strokeWidth: shouldAnimate ? 2 : 1,
        strokeDasharray: '4 3'
      },
      labelStyle: { fontSize: 6, fill: 'var(--db-text-secondary)' },
      data: {
        label: e.label,
        when: e.when,
        isDefault: e.isDefault
      } satisfies Partial<WorkflowCanvasEdge>
    }
  })
}

function queryLeavesFromRf(rfNodes: WorkflowCanvasRfNode[]): WorkflowLeafNode[] {
  return rfNodes
    .filter((n): n is WorkflowRfNode => n.type === 'workflow')
    .map((n) => n.data.leaf)
}

function queryTerminalsFromRf(rfNodes: WorkflowCanvasRfNode[]): WorkflowTerminalNode[] {
  return rfNodes
    .filter((n): n is WorkflowTerminalRfNode => n.type === 'workflowTerminal')
    .map((n) => n.data.terminal)
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
    edges: edges.map((e) => {
      const data = (e.data ?? {}) as Partial<WorkflowCanvasEdge>
      const edge: WorkflowCanvasEdge = {
        id: e.id,
        source: e.source,
        target: e.target
      }
      if (data.label) edge.label = data.label
      if (data.when) edge.when = data.when
      if (data.isDefault) edge.isDefault = true
      return edge
    })
  }
}

/** 新建/编辑连线样式：默认无流动动画 */
function queryEdgeStyle(conditional = false): Partial<Edge> {
  return {
    animated: false,
    className: conditional ? 'wf-edge-conditional' : 'wf-edge-default',
    markerEnd: { type: MarkerType.ArrowClosed, width: 8, height: 8 },
    style: {
      strokeWidth: 1,
      strokeDasharray: '4 3'
    },
    labelStyle: { fontSize: 6, fill: 'var(--db-text-secondary)' }
  }
}

/**
 * 流程画布：开始/结束 + 叶子；双击连线编辑条件；无条件多出线=并行。
 */
export const WorkflowCanvas = forwardRef<WorkflowCanvasHandle, WorkflowCanvasProps>(
  function WorkflowCanvas(
    {
      workflowId,
      nodes: engineNodes,
      canvas: canvasProp,
      onChange,
      isFullscreen = false,
      fullscreenContainer = null,
      activeNodeIds = [],
      nodeStatuses = {}
    },
    ref
  ): React.ReactElement {
    const [editOpen, setEditOpen] = useState(false)
    const [editingLeaf, setEditingLeaf] = useState<WorkflowLeafNode | null>(null)
    const [upstreamOutputKeys, setUpstreamOutputKeys] = useState<string[]>([])
    const [edgeEditOpen, setEdgeEditOpen] = useState(false)
    const [editingEdge, setEditingEdge] = useState<WorkflowCanvasEdge | null>(null)
    const [graphError, setGraphError] = useState<string | null>(null)

    const engineNodesRef = useRef(engineNodes)
    engineNodesRef.current = engineNodes
    const onEditRef = useRef<(id: string) => void>(() => {})
    const onDeleteRef = useRef<(id: string) => void>(() => {})

    const initialCanvas = resolveWorkflowCanvas(engineNodes, canvasProp)
    const [rfNodes, setNodes, onNodesChangeInternal] = useNodesState<WorkflowCanvasRfNode>(
      toRfNodes(
        flattenWorkflowLeaves(engineNodes),
        flattenWorkflowTerminals(engineNodes),
        initialCanvas,
        {
          onEdit: (id) => onEditRef.current(id),
          onDelete: (id) => onDeleteRef.current(id)
        },
        nodeStatuses
      )
    )
    const [rfEdges, setEdges, onEdgesChangeInternal] = useEdgesState(
      toRfEdges(initialCanvas, activeNodeIds, nodeStatuses)
    )

    /**
     * 执行进度变化时，只更新入边的流动态，避免整图重置拖拽/选中。
     * 命中支路入边 → animated；默认支路 / 已跳过来源边保持静止。
     */
    useEffect(() => {
      setEdges((eds) =>
        eds.map((e) => {
          const shouldAnimate = queryEdgeShouldAnimate(e, activeNodeIds, nodeStatuses)
          const baseClass = e.className?.includes('wf-edge-conditional')
            ? 'wf-edge-conditional'
            : 'wf-edge-default'
          const nextClass = shouldAnimate ? `${baseClass} wf-edge-executing` : baseClass
          if (e.animated === shouldAnimate && e.className === nextClass) return e
          return {
            ...e,
            animated: shouldAnimate,
            className: nextClass,
            style: {
              ...e.style,
              strokeWidth: shouldAnimate ? 2 : 1
            }
          }
        })
      )
    }, [activeNodeIds, nodeStatuses, setEdges])

    /**
     * 节点执行态变化时，只 patch leaf 节点的 execStatus，保留位置与选中。
     */
    useEffect(() => {
      setNodes((ns) =>
        ns.map((n): WorkflowCanvasRfNode => {
          if (n.type !== 'workflow') return n
          const nextStatus = nodeStatuses[n.id]
          const prevStatus = n.data.execStatus
          if (prevStatus === nextStatus) return n
          return {
            ...n,
            data: {
              ...n.data,
              execStatus: nextStatus
            }
          }
        })
      )
    }, [nodeStatuses, setNodes])

    const emitChange = useCallback(
      (nextNodes: WorkflowCanvasRfNode[], nextEdges: Edge[]) => {
        const leaves = queryLeavesFromRf(nextNodes)
        const terminals = queryTerminalsFromRf(nextNodes)
        const canvas = queryCanvasFromRf(nextNodes, nextEdges)
        const applied = applyCanvasToDefinition(leaves, terminals, canvas)
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
      const leaves =
        queryLeavesFromRf(rfNodes).length > 0
          ? queryLeavesFromRf(rfNodes)
          : flattenWorkflowLeaves(engineNodesRef.current)
      const leaf = leaves.find((l) => l.id === id) ?? null
      if (!leaf) return
      const canvas = queryCanvasFromRf(rfNodes, rfEdges)
      setUpstreamOutputKeys(queryUpstreamOutputKeys(leaves, canvas, id))
      setEditingLeaf(leaf)
      setEditOpen(true)
    }

    onDeleteRef.current = (id: string) => {
      const term = queryTerminalsFromRf(rfNodes).find((t) => t.id === id)
      if (term) {
        message.warning('开始/结束节点不可删除')
        return
      }
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
          flattenWorkflowTerminals(engineNodes),
          canvas,
          {
            onEdit: (id) => onEditRef.current(id),
            onDelete: (id) => onDeleteRef.current(id)
          },
          nodeStatuses
        )
      )
      setEdges(toRfEdges(canvas, activeNodeIds, nodeStatuses))
      setGraphError(null)
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [workflowId])

    const onNodesChange: OnNodesChange<WorkflowCanvasRfNode> = useCallback(
      (changes) => {
        // 阻止删除开始/结束
        const filtered = changes.filter((c) => {
          if (c.type !== 'remove') return true
          const n = rfNodes.find((x) => x.id === c.id)
          return n?.type !== 'workflowTerminal'
        })
        if (filtered.length !== changes.length) {
          message.warning('开始/结束节点不可删除')
        }
        onNodesChangeInternal(filtered)
        const shouldPersist = filtered.some(
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
      [onNodesChangeInternal, emitChange, setNodes, setEdges, rfNodes]
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
          setEdges((eds) => {
            const next = addEdge(
              {
                ...connection,
                id: `e_${connection.source}_${connection.target}_${Date.now()}`,
                data: {},
                ...queryEdgeStyle(false)
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

    const onEdgeDoubleClick = useCallback(
      (_: ReactMouseEvent, edge: Edge) => {
        const data = (edge.data ?? {}) as Partial<WorkflowCanvasEdge>
        setEditingEdge({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          label: data.label,
          when: data.when,
          isDefault: data.isDefault
        })
        setEdgeEditOpen(true)
      },
      []
    )

    const handleEdgeEditOk = (patch: WorkflowEdgeEditValue): void => {
      if (!editingEdge) return
      setEdges((eds) => {
        const next = eds.map((e) => {
          if (e.id !== editingEdge.id) return e
          const data: Partial<WorkflowCanvasEdge> = {
            label: patch.label,
            when: patch.when,
            isDefault: patch.isDefault
          }
          const model: WorkflowCanvasEdge = {
            id: e.id,
            source: e.source,
            target: e.target,
            ...data
          }
          const label = queryEdgeLabel(model)
          const conditional = edgeHasCondition(model)
          return {
            ...e,
            label,
            data,
            ...queryEdgeStyle(conditional)
          }
        })
        queueMicrotask(() => {
          setNodes((ns) => {
            emitChange(ns, next)
            return ns
          })
        })
        return next
      })
      setEdgeEditOpen(false)
      setEditingEdge(null)
    }

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

    useImperativeHandle(
      ref,
      () => ({
        addLeafByType: (type) => {
          addLeaf(createEmptyNode(type) as WorkflowLeafNode)
        }
      }),
      [addLeaf]
    )

    const handleEditOk = (node: WorkflowNode): void => {
      if (
        node.type === 'parallel' ||
        node.type === 'condition' ||
        node.type === 'start' ||
        node.type === 'end'
      ) {
        message.error('画布请添加步骤节点；并行/条件请用连线表达')
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
      setEditingLeaf(null)
      setUpstreamOutputKeys([])
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
            onNodeClick={(_, node) => {
              if (node.type === 'workflow') onEditRef.current(node.id)
            }}
            onEdgeDoubleClick={onEdgeDoubleClick}
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
          node={editingLeaf}
          leafOnly
          upstreamOutputKeys={upstreamOutputKeys}
          isFullscreen={isFullscreen}
          fullscreenContainer={fullscreenContainer}
          onCancel={() => {
            setEditOpen(false)
            setEditingLeaf(null)
            setUpstreamOutputKeys([])
          }}
          onOk={handleEditOk}
        />

        <WorkflowEdgeEditModal
          open={edgeEditOpen}
          edge={editingEdge}
          isFullscreen={isFullscreen}
          fullscreenContainer={fullscreenContainer}
          onCancel={() => {
            setEdgeEditOpen(false)
            setEditingEdge(null)
          }}
          onOk={handleEdgeEditOk}
        />
      </div>
    )
  }
)
