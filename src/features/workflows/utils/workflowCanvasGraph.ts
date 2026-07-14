import type {
  WorkflowCanvas,
  WorkflowCanvasEdge,
  WorkflowConditionNode,
  WorkflowConditionWhen,
  WorkflowEndNode,
  WorkflowLeafNode,
  WorkflowNode,
  WorkflowParallelNode,
  WorkflowStartNode,
  WorkflowTerminalNode
} from '@shared/types'
import { isLeafNode } from '../types'

const COL_GAP = 110
const ROW_GAP = 50

function edgeHasCondition(e: WorkflowCanvasEdge): boolean {
  if (e.isDefault) return true
  const w = e.when
  if (!w) return false
  return Boolean(w.expression?.trim() || w.contextKey?.trim())
}

/** 叶子：parallel/condition 子步展开；不含 start/end */
export function flattenWorkflowLeaves(nodes: WorkflowNode[]): WorkflowLeafNode[] {
  const leaves: WorkflowLeafNode[] = []
  for (const node of nodes) {
    if (node.type === 'parallel') {
      leaves.push(...node.children)
    } else if (node.type === 'condition') {
      for (const arm of node.cases) leaves.push(...arm.nodes)
    } else if (node.type === 'start' || node.type === 'end') {
      /* skip */
    } else {
      leaves.push(node)
    }
  }
  return leaves
}

export function flattenWorkflowTerminals(nodes: WorkflowNode[]): WorkflowTerminalNode[] {
  return nodes.filter(
    (n): n is WorkflowTerminalNode => n.type === 'start' || n.type === 'end'
  )
}

/** @deprecated 画布不再持有 condition；仅用于旧数据迁移 */
export function flattenWorkflowConditions(nodes: WorkflowNode[]): WorkflowConditionNode[] {
  return nodes
    .filter((n): n is WorkflowConditionNode => n.type === 'condition')
    .map((n) => ({
      ...n,
      cases: n.cases.map((c) => ({ ...c, nodes: [] }))
    }))
}

function whenFromLegacyBranchKey(key: string): WorkflowConditionWhen | undefined {
  if (key === 'true') return { expression: 'true' }
  if (key === 'false') return { expression: 'false' }
  return { contextKey: 'branch', op: 'eq', value: key }
}

/**
 * 把引擎里的 condition 节点展开为「边条件」画布形态（不再放置 condition 节点）。
 */
export function queryCanvasFromNodes(nodes: WorkflowNode[]): WorkflowCanvas {
  const positions: Record<string, { x: number; y: number }> = {}
  const edges: WorkflowCanvasEdge[] = []
  let prevIds: string[] = []
  let row = 0

  for (const node of nodes) {
    if (node.type === 'start' || node.type === 'end') {
      positions[node.id] = { x: 80, y: 80 + row * ROW_GAP }
      for (const prev of prevIds) {
        edges.push({ id: `e_${prev}_${node.id}`, source: prev, target: node.id })
      }
      prevIds = [node.id]
      row += 1
      continue
    }

    if (node.type === 'parallel') {
      const childIds = node.children.map((c) => c.id)
      node.children.forEach((child, i) => {
        positions[child.id] = { x: 80 + i * COL_GAP, y: 80 + row * ROW_GAP }
      })
      for (const prev of prevIds) {
        for (const cid of childIds) {
          edges.push({ id: `e_${prev}_${cid}`, source: prev, target: cid })
        }
      }
      prevIds = childIds
      row += 1
      continue
    }

    if (node.type === 'condition') {
      // 不画 condition 节点：前驱 → 各支路首叶（带 when / isDefault）
      const tipIds: string[] = []
      let maxArm = 0
      const sources = prevIds.length ? prevIds : []
      node.cases.forEach((arm, i) => {
        maxArm = Math.max(maxArm, arm.nodes.length)
        arm.nodes.forEach((leaf, j) => {
          positions[leaf.id] = {
            x: 80 + i * COL_GAP,
            y: 80 + (row + j) * ROW_GAP
          }
          if (j === 0) {
            const isDef = node.defaultKey === arm.key
            for (const prev of sources) {
              edges.push({
                id: `e_${prev}_${leaf.id}_${arm.key}`,
                source: prev,
                target: leaf.id,
                label: arm.label || arm.key,
                when: isDef
                  ? undefined
                  : arm.when ?? whenFromLegacyBranchKey(arm.key),
                isDefault: isDef || undefined
              })
            }
          } else {
            edges.push({
              id: `e_${arm.nodes[j - 1].id}_${leaf.id}`,
              source: arm.nodes[j - 1].id,
              target: leaf.id
            })
          }
        })
        if (arm.nodes.length) tipIds.push(arm.nodes[arm.nodes.length - 1].id)
      })
      row += Math.max(maxArm, 1)
      prevIds = tipIds.length ? tipIds : prevIds
      continue
    }

    positions[node.id] = { x: 80, y: 80 + row * ROW_GAP }
    for (const prev of prevIds) {
      edges.push({ id: `e_${prev}_${node.id}`, source: prev, target: node.id })
    }
    prevIds = [node.id]
    row += 1
  }

  return { positions, edges }
}

function buildAdjacency(edges: WorkflowCanvasEdge[]): {
  out: Map<string, string[]>
  inn: Map<string, string[]>
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
 * 画布 → 引擎 nodes。
 * 必须恰好 1 start + 1 end；边 when/isDefault → 内部 condition；无条件多出 → parallel。
 */
export function compileCanvasToWorkflowNodes(
  leaves: WorkflowLeafNode[],
  terminals: WorkflowTerminalNode[],
  canvas: WorkflowCanvas
): { nodes: WorkflowNode[]; error?: string } {
  const byLeaf = new Map(leaves.map((l) => [l.id, l]))
  const starts = terminals.filter((t): t is WorkflowStartNode => t.type === 'start')
  const ends = terminals.filter((t): t is WorkflowEndNode => t.type === 'end')
  if (starts.length !== 1) {
    return { nodes: [], error: '流程必须恰好有一个开始节点' }
  }
  if (ends.length !== 1) {
    return { nodes: [], error: '流程必须恰好有一个结束节点' }
  }
  const start = starts[0]
  const end = ends[0]
  const byTerminal = new Map<string, WorkflowTerminalNode>([
    [start.id, start],
    [end.id, end]
  ])
  const allIds = Array.from(byLeaf.keys()).concat([start.id, end.id])
  const { out, inn, outEdges } = buildAdjacency(canvas.edges)

  for (const e of canvas.edges) {
    if (!byLeaf.has(e.source) && !byTerminal.has(e.source)) {
      return { nodes: [], error: '连线引用了不存在的节点，请删除无效连线' }
    }
    if (!byLeaf.has(e.target) && !byTerminal.has(e.target)) {
      return { nodes: [], error: '连线引用了不存在的节点，请删除无效连线' }
    }
  }

  if (detectCycle(allIds, out)) {
    return { nodes: [], error: '流程图不能有环，请调整连线' }
  }

  if ((inn.get(start.id)?.length ?? 0) > 0) {
    return { nodes: [], error: '开始节点不能有入边' }
  }
  if ((out.get(end.id)?.length ?? 0) > 0) {
    return { nodes: [], error: '结束节点不能有出边' }
  }

  const sortByPos = (a: string, b: string): number => {
    const pa = canvas.positions[a] ?? { x: 0, y: 0 }
    const pb = canvas.positions[b] ?? { x: 0, y: 0 }
    if (pa.y !== pb.y) return pa.y - pb.y
    return pa.x - pb.x
  }

  const consumed = new Set<string>()
  const result: WorkflowNode[] = []

  const takeLeaf = (id: string): WorkflowLeafNode | null => {
    const leaf = byLeaf.get(id)
    if (!leaf || consumed.has(id)) return null
    consumed.add(id)
    return leaf
  }

  const takeArmChain = (
    startId: string
  ): { chain: WorkflowLeafNode[]; tipOuts: string[] } | { error: string } => {
    const chain: WorkflowLeafNode[] = []
    let cur = startId
    while (true) {
      if (cur === end.id) return { chain, tipOuts: [end.id] }
      if (cur === start.id) return { error: '支路不能再次进入开始节点' }
      if (!byLeaf.has(cur)) {
        return { error: '条件支路必须连接到步骤节点或结束' }
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
      if (inDeg > 1 || next === end.id) {
        return { chain, tipOuts: [next] }
      }
      cur = next
    }
  }

  // 必须从 start 出发
  let frontier = [start.id]
  consumed.add(start.id)
  result.push(start)

  while (frontier.length) {
    frontier = Array.from(new Set(frontier)).sort(sortByPos)

    if (frontier.length === 1 && frontier[0] === end.id) {
      if (!consumed.has(end.id)) {
        consumed.add(end.id)
        result.push(end)
      }
      frontier = []
      break
    }

    if (frontier.length > 1) {
      if (frontier.some((id) => id === start.id || id === end.id)) {
        return {
          nodes: [],
          error: '并行前沿不能包含开始/结束节点，请调整连线'
        }
      }
      const children: WorkflowLeafNode[] = []
      for (const id of frontier) {
        const leaf = takeLeaf(id)
        if (leaf) children.push(leaf)
      }
      if (!children.length) break
      result.push({
        id: `parallel_${children.map((c) => c.id).join('_').slice(0, 48)}`,
        type: 'parallel',
        title: `并行组（${children.length}）`,
        children
      })
      const nextSet = new Set<string>()
      for (const c of children) {
        for (const n of out.get(c.id) ?? []) nextSet.add(n)
      }
      frontier = Array.from(nextSet).filter((id) => !consumed.has(id) || id === end.id)
      frontier = frontier.filter((id) => id === end.id || !consumed.has(id))
      continue
    }

    const cur = frontier[0]
    if (cur === end.id) {
      consumed.add(end.id)
      result.push(end)
      frontier = []
      continue
    }

    if (cur === start.id) {
      // 已推入 result；推进出边
      const edgesFrom = outEdges.get(cur) ?? []
      const nexts = Array.from(new Set(out.get(cur) ?? [])).sort(sortByPos)
      if (!nexts.length) {
        return { nodes: [], error: '开始节点需要至少一条出线' }
      }
      if (nexts.length === 1) {
        frontier = nexts
        continue
      }
      const anyCond = edgesFrom.some(edgeHasCondition)
      const allCond = edgesFrom.every(edgeHasCondition)
      if (anyCond && !allCond) {
        return { nodes: [], error: '同一节点的出线不能混用并行与条件分支' }
      }
      if (anyCond) {
        const compiled = compileXorFromEdges(
          `cond_from_${cur}`,
          '条件分支',
          edgesFrom,
          takeArmChain
        )
        if ('error' in compiled) return { nodes: [], error: compiled.error }
        result.push(compiled.node)
        frontier = compiled.join
        continue
      }
      // parallel fan-out from start
      const childLeaves: WorkflowLeafNode[] = []
      for (const nid of nexts) {
        if (nid === end.id) {
          return { nodes: [], error: '并行分支目标不能直接是结束节点（请先放步骤）' }
        }
        const child = takeLeaf(nid)
        if (child) childLeaves.push(child)
      }
      result.push({
        id: `parallel_from_${cur}`,
        type: 'parallel',
        title: `并行组（${childLeaves.length}）`,
        children: childLeaves
      })
      const outsList = childLeaves.map((c) => Array.from(new Set(out.get(c.id) ?? [])))
      if (outsList.every((o) => o.length === 0)) {
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
      frontier = join.filter((id) => !consumed.has(id) || id === end.id)
      continue
    }

    // 普通叶子
    const leaf = takeLeaf(cur)
    if (!leaf) {
      // 可能已在 XOR 支路中消费
      break
    }

    const edgesFrom = outEdges.get(cur) ?? []
    const nexts = Array.from(new Set(out.get(cur) ?? [])).sort(sortByPos)

    if (nexts.length === 0) {
      result.push(leaf)
      return { nodes: [], error: `步骤「${leaf.title}」未连接到后续或结束节点` }
    }

    if (nexts.length === 1) {
      result.push(leaf)
      frontier = nexts
      continue
    }

    const anyCond = edgesFrom.some(edgeHasCondition)
    const allCond = edgesFrom.every(edgeHasCondition)
    if (anyCond && !allCond) {
      return { nodes: [], error: '同一节点的出线不能混用并行与条件分支' }
    }

    result.push(leaf)

    if (anyCond) {
      const compiled = compileXorFromEdges(
        `cond_from_${cur}`,
        `条件（${leaf.title}）`,
        edgesFrom,
        takeArmChain
      )
      if ('error' in compiled) return { nodes: [], error: compiled.error }
      result.push(compiled.node)
      frontier = compiled.join
      continue
    }

    const childLeaves: WorkflowLeafNode[] = []
    for (const nid of nexts) {
      if (nid === end.id) {
        return { nodes: [], error: '并行分支目标不能直接是结束节点' }
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
    if (outsList.every((o) => o.length === 0)) {
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
    frontier = join.filter((id) => !consumed.has(id) || id === end.id)
  }

  if (!consumed.has(end.id)) {
    // 若前沿已空但仍未到 end
    if (!result.some((n) => n.type === 'end')) {
      return { nodes: [], error: '流程必须能到达结束节点' }
    }
  }

  const leftover = allIds.filter((id) => !consumed.has(id))
  if (leftover.length) {
    return {
      nodes: [],
      error: `存在未连通的节点：${leftover
        .map(
          (id) =>
            byLeaf.get(id)?.title ?? byTerminal.get(id)?.title ?? id
        )
        .join('、')}，请连线或删除`
    }
  }

  // 保证 end 在结果末尾一次
  if (!result.some((n) => n.type === 'end')) {
    result.push(end)
  }

  return { nodes: result }
}

function compileXorFromEdges(
  id: string,
  title: string,
  edgesFrom: WorkflowCanvasEdge[],
  takeArmChain: (
    startId: string
  ) => { chain: WorkflowLeafNode[]; tipOuts: string[] } | { error: string }
): { node: WorkflowConditionNode; join: string[] } | { error: string } {
  const defaults = edgesFrom.filter((e) => e.isDefault)
  if (defaults.length > 1) {
    return { error: '同一节点最多一条默认（else）连线' }
  }
  const tipOutLists: string[][] = []
  const cases: WorkflowConditionNode['cases'] = []
  let defaultKey: string | undefined

  for (const e of edgesFrom) {
    const key = e.id
    const taken = takeArmChain(e.target)
    if ('error' in taken) return { error: taken.error }
    tipOutLists.push(taken.tipOuts)
    if (e.isDefault) {
      defaultKey = key
      cases.push({
        key,
        label: e.label || '默认',
        nodes: taken.chain
      })
    } else {
      if (!edgeHasCondition(e) || !e.when) {
        return { error: '条件分支的每条出线都须配置条件或标记为默认' }
      }
      cases.push({
        key,
        label: e.label || key.slice(0, 8),
        when: e.when,
        nodes: taken.chain
      })
    }
  }

  if (!cases.some((c) => c.when) && !defaultKey) {
    return { error: '条件分支至少需要一条带条件的出线' }
  }

  const allTerminal = tipOutLists.every((o) => o.length === 0)
  let join: string[] = []
  if (!allTerminal) {
    const j = queryIntersection(tipOutLists)
    if (!j || j.length !== 1) {
      return {
        error: '条件分支须汇合到同一个后续节点，或各分支均为结束节点'
      }
    }
    join = j
  }

  const node: WorkflowConditionNode = {
    id,
    type: 'condition',
    title,
    mode: 'expression',
    cases,
    defaultKey
  }
  return { node, join }
}

export function resolveWorkflowCanvas(
  nodes: WorkflowNode[],
  canvas?: WorkflowCanvas
): WorkflowCanvas {
  const leaves = flattenWorkflowLeaves(nodes)
  const terminals = flattenWorkflowTerminals(nodes)
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
  terminals.forEach((t, i) => {
    if (!base.positions[t.id]) {
      base.positions[t.id] = {
        x: 80,
        y: t.type === 'start' ? 24 : 280 + i * ROW_GAP
      }
    }
  })

  // 去掉指向旧 condition 画布节点的边（迁移后不应再有）
  const idSet = new Set([
    ...leaves.map((l) => l.id),
    ...terminals.map((t) => t.id)
  ])
  base.edges = base.edges.filter((e) => idSet.has(e.source) && idSet.has(e.target))
  return base
}

export function applyCanvasToDefinition(
  leaves: WorkflowLeafNode[],
  terminals: WorkflowTerminalNode[],
  canvas: WorkflowCanvas
): { nodes: WorkflowNode[]; canvas: WorkflowCanvas; error?: string } {
  const compiled = compileCanvasToWorkflowNodes(leaves, terminals, canvas)
  if (compiled.error) {
    return { nodes: [], canvas, error: compiled.error }
  }
  return { nodes: compiled.nodes, canvas }
}

export function isCanvasLeaf(node: WorkflowNode): node is WorkflowLeafNode {
  return isLeafNode(node)
}
