import type {
  WorkflowCanvas,
  WorkflowCanvasEdge,
  WorkflowLeafNode,
  WorkflowNode,
  WorkflowParallelNode
} from '@shared/types'
import { isLeafNode } from '../types'

const COL_GAP = 110
const ROW_GAP = 50

/** 从引擎 nodes 展开画布用的叶子节点（parallel 拆成子叶） */
export function flattenWorkflowLeaves(nodes: WorkflowNode[]): WorkflowLeafNode[] {
  const leaves: WorkflowLeafNode[] = []
  for (const node of nodes) {
    if (node.type === 'parallel') {
      leaves.push(...node.children)
    } else {
      leaves.push(node)
    }
  }
  return leaves
}

/**
 * 由引擎 nodes 推导初始画布（无 canvas 落盘时使用）。
 * 结构：顺序纵向；parallel 子节点横向排开并 fan-out / fan-in。
 */
export function queryCanvasFromNodes(nodes: WorkflowNode[]): WorkflowCanvas {
  const positions: Record<string, { x: number; y: number }> = {}
  const edges: WorkflowCanvasEdge[] = []
  let prevIds: string[] = []
  let row = 0

  for (const node of nodes) {
    if (node.type === 'parallel') {
      const childIds = node.children.map((c) => c.id)
      node.children.forEach((child, i) => {
        positions[child.id] = {
          x: 80 + i * COL_GAP,
          y: 80 + row * ROW_GAP
        }
      })
      for (const prev of prevIds) {
        for (const cid of childIds) {
          edges.push({
            id: `e_${prev}_${cid}`,
            source: prev,
            target: cid
          })
        }
      }
      prevIds = childIds
      row += 1
    } else {
      positions[node.id] = { x: 80, y: 80 + row * ROW_GAP }
      for (const prev of prevIds) {
        edges.push({
          id: `e_${prev}_${node.id}`,
          source: prev,
          target: node.id
        })
      }
      prevIds = [node.id]
      row += 1
    }
  }

  return { positions, edges }
}

function buildAdjacency(edges: WorkflowCanvasEdge[]): {
  out: Map<string, string[]>
  inn: Map<string, string[]>
} {
  const out = new Map<string, string[]>()
  const inn = new Map<string, string[]>()
  for (const e of edges) {
    if (!out.has(e.source)) out.set(e.source, [])
    if (!inn.has(e.target)) inn.set(e.target, [])
    out.get(e.source)!.push(e.target)
    inn.get(e.target)!.push(e.source)
  }
  return { out, inn }
}

function detectCycle(ids: string[], out: Map<string, string[]>): boolean {
  const visiting = new Set<string>()
  const visited = new Set<string>()
  const dfs = (id: string): boolean => {
    if (visiting.has(id)) return true
    if (visited.has(id)) return false
    visiting.add(id)
    for (const n of out.get(id) ?? []) {
      if (dfs(n)) return true
    }
    visiting.delete(id)
    visited.add(id)
    return false
  }
  return ids.some((id) => dfs(id))
}

/**
 * 将画布叶子 + 连线编译为引擎 nodes。
 * 规则：单后继 → 串行；多后继 → parallel（须同时结束或汇合到同一后继）。
 */
export function compileCanvasToWorkflowNodes(
  leaves: WorkflowLeafNode[],
  canvas: WorkflowCanvas
): { nodes: WorkflowNode[]; error?: string } {
  const byId = new Map(leaves.map((l) => [l.id, l]))
  const ids = leaves.map((l) => l.id)
  const { out, inn } = buildAdjacency(canvas.edges)

  for (const e of canvas.edges) {
    if (!byId.has(e.source) || !byId.has(e.target)) {
      return { nodes: [], error: '连线引用了不存在的节点，请删除无效连线' }
    }
  }

  if (detectCycle(ids, out)) {
    return { nodes: [], error: '流程图不能有环，请调整连线' }
  }

  if (!ids.length) return { nodes: [] }

  const sortByPos = (a: string, b: string): number => {
    const pa = canvas.positions[a] ?? { x: 0, y: 0 }
    const pb = canvas.positions[b] ?? { x: 0, y: 0 }
    if (pa.y !== pb.y) return pa.y - pb.y
    return pa.x - pb.x
  }

  const roots = ids.filter((id) => !(inn.get(id)?.length)).sort(sortByPos)
  if (!roots.length) {
    return { nodes: [], error: '找不到起始节点（每个节点都有入边）' }
  }

  const consumed = new Set<string>()
  const result: WorkflowNode[] = []

  const takeLeaf = (id: string): WorkflowLeafNode | null => {
    const leaf = byId.get(id)
    if (!leaf || consumed.has(id)) return null
    consumed.add(id)
    return leaf
  }

  /**
   * 从当前「前沿」推进：
   * - 单节点前沿且单出边 → 串行追加
   * - 单节点前沿且多出边 → 并行组
   * - 多节点前沿 → 视为并行（入边已汇合前的分支）
   */
  let frontier = roots

  while (frontier.length) {
    frontier = Array.from(new Set(frontier)).sort(sortByPos)

    if (frontier.length > 1) {
      // 多根 / 多前沿：打成一个 parallel（或若都无共同语义则按 y 串行拆开）
      const children: WorkflowLeafNode[] = []
      for (const id of frontier) {
        const leaf = takeLeaf(id)
        if (leaf) children.push(leaf)
      }
      if (!children.length) break

      const parallelId = `parallel_${children.map((c) => c.id).join('_').slice(0, 48)}`
      const parallel: WorkflowParallelNode = {
        id: parallelId,
        type: 'parallel',
        title: `并行组（${children.length}）`,
        children
      }
      result.push(parallel)

      const nextSet = new Set<string>()
      for (const c of children) {
        for (const n of out.get(c.id) ?? []) nextSet.add(n)
      }
      frontier = Array.from(nextSet).filter((id) => !consumed.has(id))
      continue
    }

    const cur = frontier[0]
    const leaf = takeLeaf(cur)
    if (!leaf) break

    const nexts = Array.from(new Set(out.get(cur) ?? [])).sort(sortByPos)

    if (nexts.length <= 1) {
      result.push(leaf)
      frontier = nexts.filter((id) => !consumed.has(id))
      continue
    }

    // fan-out：当前节点串行，后继进 parallel
    result.push(leaf)

    const childLeaves: WorkflowLeafNode[] = []
    for (const nid of nexts) {
      const child = takeLeaf(nid)
      if (child) childLeaves.push(child)
    }
    if (!childLeaves.length) {
      frontier = []
      continue
    }

    const parallel: WorkflowParallelNode = {
      id: `parallel_from_${cur}`,
      type: 'parallel',
      title: `并行组（${childLeaves.length}）`,
      children: childLeaves
    }
    result.push(parallel)

    // 检查汇合：各分支出边应交于同一目标，或全无出边
    const outsList = childLeaves.map((c) => Array.from(new Set(out.get(c.id) ?? [])))
    const allTerminal = outsList.every((o) => o.length === 0)
    if (allTerminal) {
      frontier = []
      continue
    }

    const join =
      outsList.length > 0
        ? outsList.reduce<string[] | null>((acc, curOut) => {
            if (acc === null) return null
            return acc.filter((id) => curOut.includes(id))
          }, outsList[0] ?? [])
        : []

    if (!join || join.length !== 1) {
      return {
        nodes: [],
        error: '并行分支须汇合到同一个后续节点，或各分支均为结束节点'
      }
    }

    frontier = join.filter((id) => !consumed.has(id))
  }

  const leftover = ids.filter((id) => !consumed.has(id))
  if (leftover.length) {
    return {
      nodes: [],
      error: `存在未连通的节点：${leftover
        .map((id) => byId.get(id)?.title ?? id)
        .join('、')}，请连线或删除`
    }
  }

  return { nodes: result }
}

/** 合并 canvas：有落盘则用落盘，否则从 nodes 推导；并补全缺坐标的叶子 */
export function resolveWorkflowCanvas(
  nodes: WorkflowNode[],
  canvas?: WorkflowCanvas
): WorkflowCanvas {
  const leaves = flattenWorkflowLeaves(nodes)
  const base = canvas?.edges?.length || canvas?.positions
    ? {
        positions: { ...(canvas?.positions ?? {}) },
        edges: [...(canvas?.edges ?? [])]
      }
    : queryCanvasFromNodes(nodes)

  leaves.forEach((leaf, i) => {
    if (!base.positions[leaf.id]) {
      base.positions[leaf.id] = { x: 80, y: 80 + i * ROW_GAP }
    }
  })

  // 去掉指向已删节点的边
  const idSet = new Set(leaves.map((l) => l.id))
  base.edges = base.edges.filter((e) => idSet.has(e.source) && idSet.has(e.target))
  return base
}

/** 从画布编辑结果写回 WorkflowDefinition 字段 */
export function applyCanvasToDefinition(
  leaves: WorkflowLeafNode[],
  canvas: WorkflowCanvas
): { nodes: WorkflowNode[]; canvas: WorkflowCanvas; error?: string } {
  const compiled = compileCanvasToWorkflowNodes(leaves, canvas)
  if (compiled.error) {
    return { nodes: [], canvas, error: compiled.error }
  }
  return { nodes: compiled.nodes, canvas }
}

export function isCanvasLeaf(node: WorkflowNode): node is WorkflowLeafNode {
  return isLeafNode(node)
}
