/**
 * AI 视频全屏无限画布：xyflow + 全局 skill + 节点运行。
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type Edge,
  type Node,
  type OnConnect,
  type OnEdgesChange,
  type OnNodesChange,
  MarkerType
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import type { AiVideoCanvasNode, AiVideoNodeKind, AiVideoProject } from '@shared/ai-video'
import {
  AI_VIDEO_KIND_LABEL,
  queryAiVideoBaseType,
  queryAiVideoDefaultWorkflow
} from '@shared/ai-video'
import { useAppStore } from '@/stores/app-store'
import { useAiVideoStore, postBindAiVideoEvents } from '../../hooks/useAiVideoStore'
import { postAiVideoNodeRun, postAiVideoCanvasRun, postAiVideoAbortRun } from '../../api'
import { AiVideoFlowNode, type AiVideoRfNode } from '../nodes/AiVideoFlowNode'
import { NodeInspector } from '../NodeInspector/NodeInspector'
import styles from './AiVideoCanvasPage.module.css'

const nodeTypes = { aiVideo: AiVideoFlowNode }

const ADD_KINDS: AiVideoNodeKind[] = [
  'screenwriter',
  'script_text',
  'character',
  'character_views',
  'scene',
  'prop',
  'storyboard',
  'storyboard_text',
  'video_gen',
  'video_merge'
]

function queryProjectToFlow(
  project: AiVideoProject,
  handlers: {
    onRun: (id: string) => void
    onSelect: (id: string) => void
  }
): { nodes: AiVideoRfNode[]; edges: Edge[] } {
  const nodes: AiVideoRfNode[] = project.canvas.nodes.map((n) => ({
    id: n.id,
    type: 'aiVideo',
    position: n.position,
    data: { node: n, onRun: handlers.onRun, onSelect: handlers.onSelect }
  }))
  const edges: Edge[] = project.canvas.edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    markerEnd: { type: MarkerType.ArrowClosed },
    animated: project.canvas.nodes.some(
      (n) => n.id === e.target && n.status === 'running'
    )
  }))
  return { nodes, edges }
}

function queryFlowToProject(
  project: AiVideoProject,
  nodes: Node[],
  edges: Edge[]
): AiVideoProject {
  const byId = new Map(project.canvas.nodes.map((n) => [n.id, n]))
  const nextNodes: AiVideoCanvasNode[] = nodes.map((rn) => {
    const prev = byId.get(rn.id)
    const dataNode = (rn.data as AiVideoRfNode['data'] | undefined)?.node
    const base = dataNode ?? prev
    if (!base) {
      return {
        id: rn.id,
        title: '节点',
        type: 'text',
        kind: 'script_text',
        position: rn.position,
        prompt: '',
        status: 'idle'
      }
    }
    return { ...base, position: rn.position }
  })
  return {
    ...project,
    canvas: {
      ...project.canvas,
      nodes: nextNodes,
      edges: edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target
      }))
    }
  }
}

export function AiVideoCanvasPage(): React.ReactElement {
  const setView = useAppStore((s) => s.setView)
  const activeProject = useAiVideoStore((s) => s.activeProject)
  const postSave = useAiVideoStore((s) => s.postSave)
  const postOpen = useAiVideoStore((s) => s.postOpen)
  const postSetActive = useAiVideoStore((s) => s.postSetActive)
  const saving = useAiVideoStore((s) => s.saving)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [inspectorOpen, setInspectorOpen] = useState(false)
  const [skills, setSkills] = useState<Array<{ id: string; name: string }>>([])
  const [running, setRunning] = useState(false)
  const [rfNodes, setRfNodes] = useState<AiVideoRfNode[]>([])
  const [rfEdges, setRfEdges] = useState<Edge[]>([])

  useEffect(() => {
    postBindAiVideoEvents()
    void window.api.queryProjectSkills().then((list) => {
      setSkills(list.map((s) => ({ id: s.id, name: s.name })))
    })
  }, [])

  const runNodeRef = useRef<(nodeId: string) => Promise<void>>(async () => {})
  const selectNodeRef = useRef<(id: string) => void>(() => {})

  const handleRunNode = useCallback(
    async (nodeId: string): Promise<void> => {
      if (!activeProject) return
      const draft = queryFlowToProject(activeProject, rfNodes, rfEdges)
      await postSave(draft)
      setRunning(true)
      try {
        const res = await postAiVideoNodeRun({
          projectId: activeProject.id,
          nodeId,
          force: true
        })
        if (!res.ok) message.error(res.message || '运行失败')
        await postOpen(activeProject.id)
      } finally {
        setRunning(false)
      }
    },
    [activeProject, rfNodes, rfEdges, postSave, postOpen]
  )

  runNodeRef.current = handleRunNode
  selectNodeRef.current = (id: string) => {
    setSelectedId(id)
    setInspectorOpen(true)
  }

  const syncFromProject = useCallback((project: AiVideoProject) => {
    const { nodes, edges } = queryProjectToFlow(project, {
      onRun: (id) => void runNodeRef.current(id),
      onSelect: (id) => selectNodeRef.current(id)
    })
    setRfNodes(nodes)
    setRfEdges(edges)
  }, [])

  useEffect(() => {
    if (activeProject) {
      syncFromProject(activeProject)
    }
  }, [activeProject, syncFromProject])

  const selectedNode = useMemo(() => {
    if (!activeProject || !selectedId) return null
    return activeProject.canvas.nodes.find((n) => n.id === selectedId) ?? null
  }, [activeProject, selectedId])

  const handleSave = async (): Promise<void> => {
    if (!activeProject) return
    const draft = queryFlowToProject(activeProject, rfNodes, rfEdges)
    await postSave(draft)
    message.success('已保存')
  }

  const handleRunAll = async (): Promise<void> => {
    if (!activeProject) return
    await handleSave()
    setRunning(true)
    try {
      const res = await postAiVideoCanvasRun({ projectId: activeProject.id })
      if (!res.ok) message.error(res.message || '批量运行失败')
      else message.success('画布执行完成')
      await postOpen(activeProject.id)
    } finally {
      setRunning(false)
    }
  }

  const onNodesChange: OnNodesChange = useCallback((changes) => {
    setRfNodes((nds) => applyNodeChanges(changes, nds) as AiVideoRfNode[])
  }, [])

  const onEdgesChange: OnEdgesChange = useCallback((changes) => {
    setRfEdges((eds) => applyEdgeChanges(changes, eds))
  }, [])

  const onConnect: OnConnect = useCallback((connection: Connection) => {
    setRfEdges((eds) =>
      addEdge(
        {
          ...connection,
          id: `e-${connection.source}-${connection.target}-${Date.now()}`,
          markerEnd: { type: MarkerType.ArrowClosed }
        },
        eds
      )
    )
  }, [])

  const handleAddNode = (kind: AiVideoNodeKind): void => {
    if (!activeProject) return
    const id = crypto.randomUUID()
    const node: AiVideoCanvasNode = {
      id,
      title: AI_VIDEO_KIND_LABEL[kind],
      type: queryAiVideoBaseType(kind),
      kind,
      position: { x: 120 + Math.random() * 80, y: 120 + Math.random() * 80 },
      prompt: '',
      workflowId: queryAiVideoDefaultWorkflow(kind),
      status: 'idle'
    }
    const next: AiVideoProject = {
      ...activeProject,
      canvas: {
        ...activeProject.canvas,
        nodes: [...activeProject.canvas.nodes, node]
      }
    }
    postSetActive(next)
  }

  const handleNodePatch = (patched: AiVideoCanvasNode): void => {
    if (!activeProject) return
    const withGraph = queryFlowToProject(activeProject, rfNodes, rfEdges)
    const next: AiVideoProject = {
      ...withGraph,
      canvas: {
        ...withGraph.canvas,
        nodes: withGraph.canvas.nodes.map((n) => (n.id === patched.id ? patched : n))
      }
    }
    postSetActive(next)
  }

  const handleGlobalSkills = (ids: string[]): void => {
    if (!activeProject) return
    postSetActive({ ...activeProject, globalSkillIds: ids })
  }

  if (!activeProject) {
    return (
      <div className={styles.empty}>
        <Empty description="未打开画布" />
        <Button type="primary" onClick={() => setView('ai-video')}>
          返回项目列表
        </Button>
      </div>
    )
  }

  const addMenuItems = ADD_KINDS.map((kind) => ({
    key: kind,
    label: AI_VIDEO_KIND_LABEL[kind],
    onClick: () => handleAddNode(kind)
  }))

  return (
    <div className={styles.page}>
      <header className={styles.toolbar}>
        <div className={styles.left}>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => {
              void handleSave().finally(() => setView('ai-video'))
            }}
          >
            返回
          </Button>
          <Input
            className={styles.titleInput}
            value={activeProject.title}
            onChange={(e) =>
              postSetActive({ ...activeProject, title: e.target.value })
            }
          />
        </div>
        <div className={styles.center}>
          <span className={styles.skillLabel}>全局 Skill</span>
          <Select
            mode="multiple"
            allowClear
            maxTagCount={2}
            className={styles.skillSelect}
            placeholder="对所有节点生效"
            value={activeProject.globalSkillIds}
            options={skills.map((s) => ({ value: s.id, label: s.name }))}
            onChange={handleGlobalSkills}
          />
        </div>
        <div className={styles.right}>
          <Dropdown menu={{ items: addMenuItems }}>
            <Button icon={<PlusOutlined />}>添加节点</Button>
          </Dropdown>
          <Button loading={saving} onClick={() => void handleSave()}>
            保存
          </Button>
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            loading={running}
            onClick={() => void handleRunAll()}
          >
            运行全部
          </Button>
          <Button
            danger
            disabled={!running}
            onClick={() => void postAiVideoAbortRun(activeProject.id)}
          >
            取消
          </Button>
        </div>
      </header>

      <div className={styles.canvas}>
        <ReactFlow
          nodes={rfNodes}
          edges={rfEdges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
          minZoom={0.2}
          maxZoom={2}
          deleteKeyCode={['Backspace', 'Delete']}
        >
          <Background gap={18} size={1} />
          <Controls />
          <MiniMap pannable zoomable />
        </ReactFlow>
      </div>

      <NodeInspector
        open={inspectorOpen}
        project={activeProject}
        node={selectedNode}
        skills={skills}
        onClose={() => setInspectorOpen(false)}
        onChange={handleNodePatch}
        onRun={(id) => void handleRunNode(id)}
      />
    </div>
  )
}
