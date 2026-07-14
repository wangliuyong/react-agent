import type {
  WorkflowCanvas,
  WorkflowCanvasEdge,
  WorkflowConditionNode,
  WorkflowLeafNode,
  WorkflowNode,
  WorkflowParallelNode
} from '@shared/types'
import { isLeafNode } from '../types'

const COL_GAP = 110
const ROW_GAP = 50

/** 从引擎 nodes 展开画布用的叶子节点（parallel / condition 拆成子叶） */
export function flattenWorkflowLeaves(nodes: WorkflowNode[]): WorkflowLeafNode[] {
  const leaves: WorkflowLeafNode[] = []
  for (const node of nodes) {
    if (node.type === 'parallel') {
      leaves.push(...node.children)
    } else if (node.type === 'condition') {
      for (const arm of node.cases) {
        leaves.push(...arm.nodes)
      }
    } else {
      leaves.push(node)
    }
  }
  return leaves
}

/**
 * 收集 condition 元数据（cases.nodes 清空），供画布编辑态回填。
 * 支路叶子内容以拓扑编译为准。
 */
export function flattenWorkflowConditions(nodes: WorkflowNode[]): WorkflowConditionNode[] {
  return nodes
    .filter((n): n is WorkflowConditionNode => n.type === 'condition')
    .map((n) => ({
      ...n,
      cases: n.cases.map((c) => ({ ...c, nodes: [] }))
    }))
}

/**
 * 由引擎 nodes 推导初始画布（无 canvas 落盘时使用）。
 * 结构：顺序纵向；parallel / condition 扇出后须汇合。
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
    } else if (node.type === 'condition') {
      positions[node.id] = { x: 80, y: 80 + row * ROW_GAP }
      for (const prev of prevIds) {
        edges.push({
          id: `e_${prev}_${node.id}`,
          source: prev,
          target: node.id
        })
      }
      row += 1
      const tipIds: string[] = []
      let maxArm = 0
      node.cases.forEach((arm, i) => {
        maxArm = Math.max(maxArm, arm.nodes.length)
        arm.nodes.forEach((leaf, j) => {
          positions[leaf.id] = {
            x: 80 + i * COL_GAP,
            y: 80 + (row + j) * ROW_GAP
          }
          if (j === 0) {
            edges.push({
              id: `e_${node.id}_${leaf.id}_${arm.key}`,
              source: node.id,
              target: leaf.id,
              branchKey: arm.key
            })
          } else {
            const prevLeaf = arm.nodes[j - 1]
            edges.push({
              id: `e_${prevLeaf.id}_${leaf.id}`,
              source: prevLeaf.id,
              target: leaf.id
            })
          }
        })
        if (arm.nodes.length) {
          tipIds.push(arm.nodes[arm.nodes.length - 1].id)
        }
      })
      row += Math.max(maxArm, 1)
      prevIds = tipIds.length ? tipIds : [node.id]
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
  /** source -> 带 branchKey 的出边明细（条件编译用） */
  outEdges: Map<string, WorkflowCanvasEdge[]>
} {
  const out = new Map<string, string[]>()
  const inn = new Map<string, string[]>()
  const outEdges = new Map<string, WorkflowCanvasEdge[]>()
  for (const e of edges) {
    if (!out.has(e.source)) out.set(e.source, [])
    if (!inn.has(e.target)) inn.set(e.target, [])
    if (!outEdges.has(e.source)) outEdges.set(e.source, [])
    out.get(e.source)!.push(e.target)
    inn.get(e.target)!.push(e.source)
    outEdges.get(e.source)!.push(e)
  }
  return { out, inn, outEdges }
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

function queryIntersection(lists: string[][]): string[] | null {
  if (!lists.length) return []
  return lists.reduce<string[] | null>((acc, cur) => {
    if (acc === null) return null
    return acc.filter((id) => cur.includes(id))
  }, lists[0] ?? [])
}

/**
 * 将画布叶子 + 条件节点 + 连线编译为引擎 nodes。
 * - 无 branchKey 的一源多出 → parallel（AND）
 * - 从 condition 出发且带 branchKey → condition（XOR）
 */
export function compileCanvasToWorkflowNodes(
  leaves: WorkflowLeafNode[],
  conditions: WorkflowConditionNode[],
  canvas: WorkflowCanvas
): { nodes: WorkflowNode[]; error?: string } {
  const byLeaf = new Map(leaves.map((l) => [l.id, l]))
  const byCond = new Map(
    conditions.map((c) => [
      c.id,
      {
        ...c,
        cases: c.cases.map((arm) => ({ ...arm, nodes: [] as WorkflowLeafNode[] }))
      }
    ])
  )
  const allIds = Array.from(byLeaf.keys()).concat(Array.from(byCond.keys()))
  const { out, inn, outEdges } = buildAdjacency(canvas.edges)

  for (const e of canvas.edges) {
    if (!byLeaf.has(e.source) && !byCond.has(e.source)) {
      return { nodes: [], error: '连线引用了不存在的节点，请删除无效连线' }
    }
    if (!byLeaf.has(e.target) && !byCond.has(e.target)) {
      return { nodes: [], error: '连线引用了不存在的节点，请删除无效连线' }
    }
  }

  if (detectCycle(allIds, out)) {
    return { nodes: [], error: '流程图不能有环，请调整连线' }
  }

  if (!allIds.length) return { nodes: [] }

  const sortByPos = (a: string, b: string): number => {
    const pa = canvas.positions[a] ?? { x: 0, y: 0 }
    const pb = canvas.positions[b] ?? { x: 0, y: 0 }
    if (pa.y !== pb.y) return pa.y - pb.y
    return pa.x - pb.x
  }

  const roots = allIds.filter((id) => !(inn.get(id)?.length)).sort(sortByPos)
  if (!roots.length) {
    return { nodes: [], error: '找不到起始节点（每个节点都有入边）' }
  }

  const consumed = new Set<string>()
  const result: WorkflowNode[] = []

  const takeLeaf = (id: string): WorkflowLeafNode | null => {
    const leaf = byLeaf.get(id)
    if (!leaf || consumed.has(id)) return null
    consumed.add(id)
    return leaf
  }

  /** 沿入度为 1 的唯一后继链收集支路叶子，在汇合点（入度>1）前停下 */
  const takeArmChain = (
    startId: string
  ): { chain: WorkflowLeafNode[]; tipOuts: string[] } | { error: string } => {
    const chain: WorkflowLeafNode[] = []
    let cur = startId
    while (true) {
      if (byCond.has(cur)) {
        return { error: '条件支路内不能再嵌套条件节点（首版）' }
      }
      if (!byLeaf.has(cur)) {
        return { error: '条件支路必须连接到步骤节点' }
      }
      const leaf = takeLeaf(cur)
      if (!leaf) {
        return { error: `条件支路节点无法收录：${byLeaf.get(cur)?.title ?? cur}` }
      }
      chain.push(leaf)
      const outs = Array.from(new Set(out.get(cur) ?? []))
      if (outs.length === 0) return { chain, tipOuts: [] }
      if (outs.length > 1) {
        return { error: '条件支路内不能再分叉，请先汇合' }
      }
      const next = outs[0]
      const inDeg = inn.get(next)?.length ?? 0
      // 入度 > 1：多路汇合点，不纳入本支路
      if (inDeg > 1 || byCond.has(next)) {
        return { chain, tipOuts: [next] }
      }
      cur = next
    }
  }

  let frontier = roots

  while (frontier.length) {
    frontier = Array.from(new Set(frontier)).sort(sortByPos)

    if (frontier.length > 1) {
      if (frontier.some((id) => byCond.has(id))) {
        return {
          nodes: [],
          error: '多个前沿节点含条件分支时无法编译，请调整连线使条件单独成段'
        }
      }
      const children: WorkflowLeafNode[] = []
      for (const id of frontier) {
        const leaf = takeLeaf(id)
        if (leaf) children.push(leaf)
      }
      if (!children.length) break

      const parallel: WorkflowParallelNode = {
        id: `parallel_${children.map((c) => c.id).join('_').slice(0, 48)}`,
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

    // —— 条件节点 ——
    if (byCond.has(cur)) {
      if (consumed.has(cur)) break
      consumed.add(cur)
      const meta = byCond.get(cur)!
      const edgesFrom = outEdges.get(cur) ?? []
      if (!edgesFrom.length) {
        return { nodes: [], error: `条件节点「${meta.title}」需要至少一条分支出线` }
      }
      if (edgesFrom.some((e) => !e.branchKey?.trim())) {
        return {
          nodes: [],
          error: `条件节点「${meta.title}」的出线必须带分支标签（branchKey）`
        }
      }

      const caseKeys = new Set(meta.cases.map((c) => c.key))
      const filledCases = meta.cases.map((c) => ({ ...c, nodes: [] as WorkflowLeafNode[] }))
      const tipOutLists: string[][] = []

      for (const arm of filledCases) {
        const armEdges = edgesFrom.filter((e) => e.branchKey === arm.key)
        if (armEdges.length !== 1) {
          return {
            nodes: [],
            error: `条件分支「${arm.label || arm.key}」需要恰好一条出线`
          }
        }
        const taken = takeArmChain(armEdges[0].target)
        if ('error' in taken) return { nodes: [], error: taken.error }
        arm.nodes = taken.chain
        tipOutLists.push(taken.tipOuts)
      }

      for (const e of edgesFrom) {
        const key = e.branchKey!.trim()
        if (!caseKeys.has(key)) {
          return {
            nodes: [],
            error: `连线分支「${key}」不在条件节点「${meta.title}」的 case 列表中`
          }
        }
      }

      const allTerminal = tipOutLists.every((o) => o.length === 0)
      if (!allTerminal) {
        const join = queryIntersection(tipOutLists)
        if (!join || join.length !== 1) {
          return {
            nodes: [],
            error: '条件分支须汇合到同一个后续节点，或各分支均为结束节点'
          }
        }
        result.push({ ...meta, cases: filledCases })
        frontier = join.filter((id) => !consumed.has(id))
      } else {
        result.push({ ...meta, cases: filledCases })
        frontier = []
      }
      continue
    }

    // —— 叶子节点 ——
    const leaf = takeLeaf(cur)
    if (!leaf) break

    const edgesFrom = outEdges.get(cur) ?? []
    const nexts = Array.from(new Set(out.get(cur) ?? [])).sort(sortByPos)
    const hasBranch = edgesFrom.some((e) => e.branchKey?.trim())
    const allBranch =
      edgesFrom.length > 0 && edgesFrom.every((e) => e.branchKey?.trim())
    if (hasBranch && !allBranch) {
      return {
        nodes: [],
        error: '同一节点的出线不能混用并行与条件分支'
      }
    }
    if (allBranch && edgesFrom.length > 0) {
      return {
        nodes: [],
        error: '仅条件节点可使用分支连线；请从条件节点的出口拉线'
      }
    }

    if (nexts.length <= 1) {
      result.push(leaf)
      frontier = nexts.filter((id) => !consumed.has(id))
      continue
    }

    // fan-out：当前节点串行，后继进 parallel（AND）
    result.push(leaf)

    const childLeaves: WorkflowLeafNode[] = []
    for (const nid of nexts) {
      if (byCond.has(nid)) {
        return {
          nodes: [],
          error: '并行分叉的目标不能是条件节点，请先汇合再连接条件'
        }
      }
      const child = takeLeaf(nid)
      if (child) childLeaves.push(child)
    }
    if (!childLeaves.length) {
      frontier = []
      continue
    }

    result.push({
      id: `parallel_from_${cur}`,
      type: 'parallel',
      title: `并行组（${childLeaves.length}）`,
      children: childLeaves
    })

    const outsList = childLeaves.map((c) => Array.from(new Set(out.get(c.id) ?? [])))
    const allTerminal = outsList.every((o) => o.length === 0)
    if (allTerminal) {
      frontier = []
      continue
    }

    const join = queryIntersection(outsList)
    if (!join || join.length !== 1) {
      return {
        nodes: [],
        error: '并行分支须汇合到同一个后续节点，或各分支均为结束节点'
      }
    }

    frontier = join.filter((id) => !consumed.has(id))
  }

  const leftover = allIds.filter((id) => !consumed.has(id))
  if (leftover.length) {
    return {
      nodes: [],
      error: `存在未连通的节点：${leftover
        .map((id) => byLeaf.get(id)?.title ?? byCond.get(id)?.title ?? id)
        .join('、')}，请连线或删除`
    }
  }

  return { nodes: result }
}

/** 合并 canvas：有落盘则用落盘，否则从 nodes 推导；并补全缺坐标 */
export function resolveWorkflowCanvas(
  nodes: WorkflowNode[],
  canvas?: WorkflowCanvas
): WorkflowCanvas {
  const leaves = flattenWorkflowLeaves(nodes)
  const conditions = flattenWorkflowConditions(nodes)
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
  conditions.forEach((c, i) => {
    if (!base.positions[c.id]) {
      base.positions[c.id] = { x: 40, y: 40 + i * ROW_GAP }
    }
  })

  const idSet = new Set([...leaves.map((l) => l.id), ...conditions.map((c) => c.id)])
  base.edges = base.edges.filter((e) => idSet.has(e.source) && idSet.has(e.target))
  return base
}

/** 从画布编辑结果写回 WorkflowDefinition 字段 */
export function applyCanvasToDefinition(
  leaves: WorkflowLeafNode[],
  conditions: WorkflowConditionNode[],
  canvas: WorkflowCanvas
): { nodes: WorkflowNode[]; canvas: WorkflowCanvas; error?: string } {
  const compiled = compileCanvasToWorkflowNodes(leaves, conditions, canvas)
  if (compiled.error) {
    return { nodes: [], canvas, error: compiled.error }
  }
  return { nodes: compiled.nodes, canvas }
}

export function isCanvasLeaf(node: WorkflowNode): node is WorkflowLeafNode {
  return isLeafNode(node)
}
