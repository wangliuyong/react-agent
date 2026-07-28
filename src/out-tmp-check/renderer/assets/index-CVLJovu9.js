import { r as reactExports, j as jsxRuntimeExports, H as Handle, P as Position, u as useNodesState, h as useEdgesState, i as addEdge, k as index, B as Background, C as Controls, M as MarkerType } from "./vendor-xyflow-C3K48oRM.js";
import { I as Icon, d as _extends, ae as Card, aM as cardStyles, T as Typography, aq as Tag, $ as Tooltip, B as Button, ay as RefIcon$2, aN as RefIcon$3, a7 as Form, a9 as Input, a4 as Select, a8 as Modal, ap as Empty, aP as DB_THEME, a0 as Space, at as Popconfirm, au as RefIcon$4, cP as RefIcon$5, z as appMessage, ac as RefIcon$7, aG as useChannelsStore, aI as queryEnabledNotifyChannelsFromStore, cQ as createAgentNode, aT as Switch, cR as queryFeishuMsgType, cS as postSelectDirectory, cT as createToolNode, cU as createInputNode, cV as createOutputNode, cW as createAwaitNode, cX as createNotifyNode, cY as createParallelNode, cZ as createConditionNode, c_ as isLeafNode, c$ as createEmptyNode, ao as Drawer, am as RefIcon$8, R as RefIcon$a, aF as useWorkflowsStore, aj as useSessionStore, ab as useAppStore, aB as FeaturePageHeader, aD as RefIcon$b, ak as Segmented, al as shellStyles, av as RefIcon$c, S as Spin } from "./index-D2SMd1bE.js";
import { R as RefIcon$6 } from "./PlayCircleOutlined-QtbVtiGy.js";
import { R as Radio } from "./index-DL0mINbx.js";
import { C as Checkbox } from "./index-BMGYYAHO.js";
import { D as Dropdown } from "./index-BDNh-rpT.js";
import { R as RefIcon$9 } from "./FullscreenOutlined-CcMTXdYK.js";
import { F as FeaturePageShell, a as FeatureScrollBody } from "./FeatureScrollBody-CxFpEk7V.js";
import { F as FeaturePageToolbar } from "./FeaturePageToolbar-CnaQ0apm.js";
var FullscreenExitOutlined$1 = { "icon": { "tag": "svg", "attrs": { "viewBox": "64 64 896 896", "focusable": "false" }, "children": [{ "tag": "path", "attrs": { "d": "M391 240.9c-.8-6.6-8.9-9.4-13.6-4.7l-43.7 43.7L200 146.3a8.03 8.03 0 00-11.3 0l-42.4 42.3a8.03 8.03 0 000 11.3L280 333.6l-43.9 43.9a8.01 8.01 0 004.7 13.6L401 410c5.1.6 9.5-3.7 8.9-8.9L391 240.9zm10.1 373.2L240.8 633c-6.6.8-9.4 8.9-4.7 13.6l43.9 43.9L146.3 824a8.03 8.03 0 000 11.3l42.4 42.3c3.1 3.1 8.2 3.1 11.3 0L333.7 744l43.7 43.7A8.01 8.01 0 00391 783l18.9-160.1c.6-5.1-3.7-9.4-8.8-8.8zm221.8-204.2L783.2 391c6.6-.8 9.4-8.9 4.7-13.6L744 333.6 877.7 200c3.1-3.1 3.1-8.2 0-11.3l-42.4-42.3a8.03 8.03 0 00-11.3 0L690.3 279.9l-43.7-43.7a8.01 8.01 0 00-13.6 4.7L614.1 401c-.6 5.2 3.7 9.5 8.8 8.9zM744 690.4l43.9-43.9a8.01 8.01 0 00-4.7-13.6L623 614c-5.1-.6-9.5 3.7-8.9 8.9L633 783.1c.8 6.6 8.9 9.4 13.6 4.7l43.7-43.7L824 877.7c3.1 3.1 8.2 3.1 11.3 0l42.4-42.3c3.1-3.1 3.1-8.2 0-11.3L744 690.4z" } }] }, "name": "fullscreen-exit", "theme": "outlined" };
var FullscreenExitOutlined = function FullscreenExitOutlined2(props, ref) {
  return /* @__PURE__ */ reactExports.createElement(Icon, _extends({}, props, {
    ref,
    icon: FullscreenExitOutlined$1
  }));
};
var RefIcon$1 = /* @__PURE__ */ reactExports.forwardRef(FullscreenExitOutlined);
var NodeIndexOutlined$1 = { "icon": { "tag": "svg", "attrs": { "viewBox": "64 64 896 896", "focusable": "false" }, "children": [{ "tag": "path", "attrs": { "d": "M843.5 737.4c-12.4-75.2-79.2-129.1-155.3-125.4S550.9 676 546 752c-153.5-4.8-208-40.7-199.1-113.7 3.3-27.3 19.8-41.9 50.1-49 18.4-4.3 38.8-4.9 57.3-3.2 1.7.2 3.5.3 5.2.5 11.3 2.7 22.8 5 34.3 6.8 34.1 5.6 68.8 8.4 101.8 6.6 92.8-5 156-45.9 159.2-132.7 3.1-84.1-54.7-143.7-147.9-183.6-29.9-12.8-61.6-22.7-93.3-30.2-14.3-3.4-26.3-5.7-35.2-7.2-7.9-75.9-71.5-133.8-147.8-134.4-76.3-.6-140.9 56.1-150.1 131.9s40 146.3 114.2 163.9c74.2 17.6 149.9-23.3 175.7-95.1 9.4 1.7 18.7 3.6 28 5.8 28.2 6.6 56.4 15.4 82.4 26.6 70.7 30.2 109.3 70.1 107.5 119.9-1.6 44.6-33.6 65.2-96.2 68.6-27.5 1.5-57.6-.9-87.3-5.8-8.3-1.4-15.9-2.8-22.6-4.3-3.9-.8-6.6-1.5-7.8-1.8l-3.1-.6c-2.2-.3-5.9-.8-10.7-1.3-25-2.3-52.1-1.5-78.5 4.6-55.2 12.9-93.9 47.2-101.1 105.8-15.7 126.2 78.6 184.7 276 188.9 29.1 70.4 106.4 107.9 179.6 87 73.3-20.9 119.3-93.4 106.9-168.6zM329.1 345.2a83.3 83.3 0 11.01-166.61 83.3 83.3 0 01-.01 166.61zM695.6 845a83.3 83.3 0 11.01-166.61A83.3 83.3 0 01695.6 845z" } }] }, "name": "node-index", "theme": "outlined" };
var NodeIndexOutlined = function NodeIndexOutlined2(props, ref) {
  return /* @__PURE__ */ reactExports.createElement(Icon, _extends({}, props, {
    ref,
    icon: NodeIndexOutlined$1
  }));
};
var RefIcon = /* @__PURE__ */ reactExports.forwardRef(NodeIndexOutlined);
const COL_GAP = 110;
const ROW_GAP = 50;
function edgeHasCondition$1(e) {
  if (e.isDefault) return true;
  const w = e.when;
  if (!w) return false;
  return Boolean(w.expression?.trim() || w.contextKey?.trim());
}
function flattenWorkflowLeaves(nodes) {
  const leaves = [];
  for (const node2 of nodes) {
    if (node2.type === "parallel") {
      leaves.push(...node2.children);
    } else if (node2.type === "condition") {
      for (const arm of node2.cases) leaves.push(...arm.nodes);
    } else if (node2.type === "start" || node2.type === "end") ;
    else {
      leaves.push(node2);
    }
  }
  return leaves;
}
function flattenWorkflowTerminals(nodes) {
  return nodes.filter(
    (n) => n.type === "start" || n.type === "end"
  );
}
function whenFromLegacyBranchKey(key) {
  if (key === "true") return { expression: "true" };
  if (key === "false") return { expression: "false" };
  return { contextKey: "branch", op: "eq", value: key };
}
function queryCanvasFromNodes(nodes) {
  const positions = {};
  const edges = [];
  let prevIds = [];
  let row = 0;
  for (const node2 of nodes) {
    if (node2.type === "start" || node2.type === "end") {
      positions[node2.id] = { x: 80, y: 80 + row * ROW_GAP };
      for (const prev of prevIds) {
        edges.push({ id: `e_${prev}_${node2.id}`, source: prev, target: node2.id });
      }
      prevIds = [node2.id];
      row += 1;
      continue;
    }
    if (node2.type === "parallel") {
      const childIds = node2.children.map((c) => c.id);
      node2.children.forEach((child, i) => {
        positions[child.id] = { x: 80 + i * COL_GAP, y: 80 + row * ROW_GAP };
      });
      for (const prev of prevIds) {
        for (const cid of childIds) {
          edges.push({ id: `e_${prev}_${cid}`, source: prev, target: cid });
        }
      }
      prevIds = childIds;
      row += 1;
      continue;
    }
    if (node2.type === "condition") {
      const tipIds = [];
      let maxArm = 0;
      const sources = prevIds.length ? prevIds : [];
      node2.cases.forEach((arm, i) => {
        maxArm = Math.max(maxArm, arm.nodes.length);
        arm.nodes.forEach((leaf, j) => {
          positions[leaf.id] = {
            x: 80 + i * COL_GAP,
            y: 80 + (row + j) * ROW_GAP
          };
          if (j === 0) {
            const isDef = node2.defaultKey === arm.key;
            for (const prev of sources) {
              edges.push({
                id: `e_${prev}_${leaf.id}_${arm.key}`,
                source: prev,
                target: leaf.id,
                label: arm.label || arm.key,
                when: isDef ? void 0 : arm.when ?? whenFromLegacyBranchKey(arm.key),
                isDefault: isDef || void 0
              });
            }
          } else {
            edges.push({
              id: `e_${arm.nodes[j - 1].id}_${leaf.id}`,
              source: arm.nodes[j - 1].id,
              target: leaf.id
            });
          }
        });
        if (arm.nodes.length) tipIds.push(arm.nodes[arm.nodes.length - 1].id);
      });
      row += Math.max(maxArm, 1);
      prevIds = tipIds.length ? tipIds : prevIds;
      continue;
    }
    positions[node2.id] = { x: 80, y: 80 + row * ROW_GAP };
    for (const prev of prevIds) {
      edges.push({ id: `e_${prev}_${node2.id}`, source: prev, target: node2.id });
    }
    prevIds = [node2.id];
    row += 1;
  }
  return { positions, edges };
}
function buildAdjacency(edges) {
  const out = /* @__PURE__ */ new Map();
  const inn = /* @__PURE__ */ new Map();
  const outEdges = /* @__PURE__ */ new Map();
  for (const e of edges) {
    if (!out.has(e.source)) out.set(e.source, []);
    if (!inn.has(e.target)) inn.set(e.target, []);
    if (!outEdges.has(e.source)) outEdges.set(e.source, []);
    out.get(e.source).push(e.target);
    inn.get(e.target).push(e.source);
    outEdges.get(e.source).push(e);
  }
  return { out, inn, outEdges };
}
function detectCycle(ids, out) {
  const visiting = /* @__PURE__ */ new Set();
  const visited = /* @__PURE__ */ new Set();
  const dfs = (id) => {
    if (visiting.has(id)) return true;
    if (visited.has(id)) return false;
    visiting.add(id);
    for (const n of out.get(id) ?? []) {
      if (dfs(n)) return true;
    }
    visiting.delete(id);
    visited.add(id);
    return false;
  };
  return ids.some((id) => dfs(id));
}
function queryIntersection(lists) {
  if (!lists.length) return [];
  return lists.reduce((acc, cur) => {
    if (acc === null) return null;
    return acc.filter((id) => cur.includes(id));
  }, lists[0] ?? []);
}
function compileCanvasToWorkflowNodes(leaves, terminals, canvas2) {
  const byLeaf = new Map(leaves.map((l) => [l.id, l]));
  const starts = terminals.filter((t) => t.type === "start");
  const ends = terminals.filter((t) => t.type === "end");
  if (starts.length !== 1) {
    return { nodes: [], error: "流程必须恰好有一个开始节点" };
  }
  if (ends.length !== 1) {
    return { nodes: [], error: "流程必须恰好有一个结束节点" };
  }
  const start2 = starts[0];
  const end2 = ends[0];
  const byTerminal = /* @__PURE__ */ new Map([
    [start2.id, start2],
    [end2.id, end2]
  ]);
  const allIds = Array.from(byLeaf.keys()).concat([start2.id, end2.id]);
  const { out, inn, outEdges } = buildAdjacency(canvas2.edges);
  for (const e of canvas2.edges) {
    if (!byLeaf.has(e.source) && !byTerminal.has(e.source)) {
      return { nodes: [], error: "连线引用了不存在的节点，请删除无效连线" };
    }
    if (!byLeaf.has(e.target) && !byTerminal.has(e.target)) {
      return { nodes: [], error: "连线引用了不存在的节点，请删除无效连线" };
    }
  }
  if (detectCycle(allIds, out)) {
    return { nodes: [], error: "流程图不能有环，请调整连线" };
  }
  if ((inn.get(start2.id)?.length ?? 0) > 0) {
    return { nodes: [], error: "开始节点不能有入边" };
  }
  if ((out.get(end2.id)?.length ?? 0) > 0) {
    return { nodes: [], error: "结束节点不能有出边" };
  }
  const sortByPos = (a, b) => {
    const pa = canvas2.positions[a] ?? { x: 0, y: 0 };
    const pb = canvas2.positions[b] ?? { x: 0, y: 0 };
    if (pa.y !== pb.y) return pa.y - pb.y;
    return pa.x - pb.x;
  };
  const consumed = /* @__PURE__ */ new Set();
  const result = [];
  const takeLeaf = (id) => {
    const leaf = byLeaf.get(id);
    if (!leaf || consumed.has(id)) return null;
    consumed.add(id);
    return leaf;
  };
  const takeArmChain = (startId) => {
    const chain = [];
    let cur = startId;
    while (true) {
      if (cur === end2.id) return { chain, tipOuts: [end2.id] };
      if (cur === start2.id) return { error: "支路不能再次进入开始节点" };
      if (!byLeaf.has(cur)) {
        return { error: "条件支路必须连接到步骤节点或结束" };
      }
      const leaf = takeLeaf(cur);
      if (!leaf) {
        return { error: `条件支路节点无法收录：${byLeaf.get(cur)?.title ?? cur}` };
      }
      chain.push(leaf);
      const outs = Array.from(new Set(out.get(cur) ?? []));
      if (outs.length === 0) return { chain, tipOuts: [] };
      if (outs.length > 1) {
        return { error: "条件支路内不能再分叉，请先汇合" };
      }
      const next = outs[0];
      const inDeg = inn.get(next)?.length ?? 0;
      if (inDeg > 1 || next === end2.id) {
        return { chain, tipOuts: [next] };
      }
      cur = next;
    }
  };
  let frontier = [start2.id];
  consumed.add(start2.id);
  result.push(start2);
  while (frontier.length) {
    frontier = Array.from(new Set(frontier)).sort(sortByPos);
    if (frontier.length === 1 && frontier[0] === end2.id) {
      if (!consumed.has(end2.id)) {
        consumed.add(end2.id);
        result.push(end2);
      }
      frontier = [];
      break;
    }
    if (frontier.length > 1) {
      if (frontier.some((id) => id === start2.id || id === end2.id)) {
        return {
          nodes: [],
          error: "并行前沿不能包含开始/结束节点，请调整连线"
        };
      }
      const children = [];
      for (const id of frontier) {
        const leaf2 = takeLeaf(id);
        if (leaf2) children.push(leaf2);
      }
      if (!children.length) break;
      result.push({
        id: `parallel_${children.map((c) => c.id).join("_").slice(0, 48)}`,
        type: "parallel",
        title: `并行组（${children.length}）`,
        children
      });
      const nextSet = /* @__PURE__ */ new Set();
      for (const c of children) {
        for (const n of out.get(c.id) ?? []) nextSet.add(n);
      }
      frontier = Array.from(nextSet).filter((id) => !consumed.has(id) || id === end2.id);
      frontier = frontier.filter((id) => id === end2.id || !consumed.has(id));
      continue;
    }
    const cur = frontier[0];
    if (cur === end2.id) {
      consumed.add(end2.id);
      result.push(end2);
      frontier = [];
      continue;
    }
    if (cur === start2.id) {
      const edgesFrom2 = outEdges.get(cur) ?? [];
      const nexts2 = Array.from(new Set(out.get(cur) ?? [])).sort(sortByPos);
      if (!nexts2.length) {
        return { nodes: [], error: "开始节点需要至少一条出线" };
      }
      if (nexts2.length === 1) {
        frontier = nexts2;
        continue;
      }
      const anyCond2 = edgesFrom2.some(edgeHasCondition$1);
      const allCond2 = edgesFrom2.every(edgeHasCondition$1);
      if (anyCond2 && !allCond2) {
        return { nodes: [], error: "同一节点的出线不能混用并行与条件分支" };
      }
      if (anyCond2) {
        const compiled = compileXorFromEdges(
          `cond_from_${cur}`,
          "条件分支",
          edgesFrom2,
          takeArmChain
        );
        if ("error" in compiled) return { nodes: [], error: compiled.error };
        result.push(compiled.node);
        frontier = compiled.join;
        continue;
      }
      const childLeaves2 = [];
      for (const nid of nexts2) {
        if (nid === end2.id) {
          return { nodes: [], error: "并行分支目标不能直接是结束节点（请先放步骤）" };
        }
        const child = takeLeaf(nid);
        if (child) childLeaves2.push(child);
      }
      result.push({
        id: `parallel_from_${cur}`,
        type: "parallel",
        title: `并行组（${childLeaves2.length}）`,
        children: childLeaves2
      });
      const outsList2 = childLeaves2.map((c) => Array.from(new Set(out.get(c.id) ?? [])));
      if (outsList2.every((o) => o.length === 0)) {
        frontier = [];
        continue;
      }
      const join2 = queryIntersection(outsList2);
      if (!join2 || join2.length !== 1) {
        return {
          nodes: [],
          error: "并行分支须汇合到同一个后续节点，或各分支均为结束节点"
        };
      }
      frontier = join2.filter((id) => !consumed.has(id) || id === end2.id);
      continue;
    }
    const leaf = takeLeaf(cur);
    if (!leaf) {
      break;
    }
    const edgesFrom = outEdges.get(cur) ?? [];
    const nexts = Array.from(new Set(out.get(cur) ?? [])).sort(sortByPos);
    if (nexts.length === 0) {
      result.push(leaf);
      return { nodes: [], error: `步骤「${leaf.title}」未连接到后续或结束节点` };
    }
    if (nexts.length === 1) {
      result.push(leaf);
      frontier = nexts;
      continue;
    }
    const anyCond = edgesFrom.some(edgeHasCondition$1);
    const allCond = edgesFrom.every(edgeHasCondition$1);
    if (anyCond && !allCond) {
      return { nodes: [], error: "同一节点的出线不能混用并行与条件分支" };
    }
    result.push(leaf);
    if (anyCond) {
      const compiled = compileXorFromEdges(
        `cond_from_${cur}`,
        `条件（${leaf.title}）`,
        edgesFrom,
        takeArmChain
      );
      if ("error" in compiled) return { nodes: [], error: compiled.error };
      result.push(compiled.node);
      frontier = compiled.join;
      continue;
    }
    const childLeaves = [];
    for (const nid of nexts) {
      if (nid === end2.id) {
        return { nodes: [], error: "并行分支目标不能直接是结束节点" };
      }
      const child = takeLeaf(nid);
      if (child) childLeaves.push(child);
    }
    if (!childLeaves.length) {
      frontier = [];
      continue;
    }
    result.push({
      id: `parallel_from_${cur}`,
      type: "parallel",
      title: `并行组（${childLeaves.length}）`,
      children: childLeaves
    });
    const outsList = childLeaves.map((c) => Array.from(new Set(out.get(c.id) ?? [])));
    if (outsList.every((o) => o.length === 0)) {
      frontier = [];
      continue;
    }
    const join = queryIntersection(outsList);
    if (!join || join.length !== 1) {
      return {
        nodes: [],
        error: "并行分支须汇合到同一个后续节点，或各分支均为结束节点"
      };
    }
    frontier = join.filter((id) => !consumed.has(id) || id === end2.id);
  }
  if (!consumed.has(end2.id)) {
    if (!result.some((n) => n.type === "end")) {
      return { nodes: [], error: "流程必须能到达结束节点" };
    }
  }
  const leftover = allIds.filter((id) => !consumed.has(id));
  if (leftover.length) {
    return {
      nodes: [],
      error: `存在未连通的节点：${leftover.map(
        (id) => byLeaf.get(id)?.title ?? byTerminal.get(id)?.title ?? id
      ).join("、")}，请连线或删除`
    };
  }
  if (!result.some((n) => n.type === "end")) {
    result.push(end2);
  }
  return { nodes: result };
}
function compileXorFromEdges(id, title2, edgesFrom, takeArmChain) {
  const defaults = edgesFrom.filter((e) => e.isDefault);
  if (defaults.length > 1) {
    return { error: "同一节点最多一条默认（else）连线" };
  }
  const tipOutLists = [];
  const cases = [];
  let defaultKey;
  for (const e of edgesFrom) {
    const key = e.id;
    const taken = takeArmChain(e.target);
    if ("error" in taken) return { error: taken.error };
    tipOutLists.push(taken.tipOuts);
    if (e.isDefault) {
      defaultKey = key;
      cases.push({
        key,
        label: e.label || "默认",
        nodes: taken.chain
      });
    } else {
      if (!edgeHasCondition$1(e) || !e.when) {
        return { error: "条件分支的每条出线都须配置条件或标记为默认" };
      }
      cases.push({
        key,
        label: e.label || key.slice(0, 8),
        when: e.when,
        nodes: taken.chain
      });
    }
  }
  if (!cases.some((c) => c.when) && !defaultKey) {
    return { error: "条件分支至少需要一条带条件的出线" };
  }
  const allTerminal = tipOutLists.every((o) => o.length === 0);
  let join = [];
  if (!allTerminal) {
    const j = queryIntersection(tipOutLists);
    if (!j || j.length !== 1) {
      return {
        error: "条件分支须汇合到同一个后续节点，或各分支均为结束节点"
      };
    }
    join = j;
  }
  const node2 = {
    id,
    type: "condition",
    title: title2,
    mode: "expression",
    cases,
    defaultKey
  };
  return { node: node2, join };
}
function resolveWorkflowCanvas(nodes, canvas2) {
  const leaves = flattenWorkflowLeaves(nodes);
  const terminals = flattenWorkflowTerminals(nodes);
  const base = canvas2?.edges?.length || canvas2?.positions ? {
    positions: { ...canvas2?.positions ?? {} },
    edges: [...canvas2?.edges ?? []]
  } : queryCanvasFromNodes(nodes);
  leaves.forEach((leaf, i) => {
    if (!base.positions[leaf.id]) {
      base.positions[leaf.id] = { x: 80, y: 80 + i * ROW_GAP };
    }
  });
  terminals.forEach((t, i) => {
    if (!base.positions[t.id]) {
      base.positions[t.id] = {
        x: 80,
        y: t.type === "start" ? 24 : 280 + i * ROW_GAP
      };
    }
  });
  const idSet = /* @__PURE__ */ new Set([
    ...leaves.map((l) => l.id),
    ...terminals.map((t) => t.id)
  ]);
  base.edges = base.edges.filter((e) => idSet.has(e.source) && idSet.has(e.target));
  return base;
}
function applyCanvasToDefinition(leaves, terminals, canvas2) {
  const compiled = compileCanvasToWorkflowNodes(leaves, terminals, canvas2);
  if (compiled.error) {
    return { nodes: [], canvas: canvas2, error: compiled.error };
  }
  return { nodes: compiled.nodes, canvas: canvas2 };
}
const { Text } = Typography;
function WorkflowCard({
  workflow,
  index: index2,
  onView,
  onEdit
}) {
  const stepCount = flattenWorkflowLeaves(workflow.nodes).length;
  const isPublish = workflow.templateKind === "publish";
  const updatedLabel = new Date(workflow.updatedAt).toLocaleString("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    Card,
    {
      variant: "borderless",
      className: cardStyles.card,
      style: { "--card-index": index2 },
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cardStyles.cardHead, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cardStyles.cardTitleBlock, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Text, { className: cardStyles.cardTitle, ellipsis: { tooltip: workflow.title }, children: workflow.title }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cardStyles.tagRow, children: isPublish ? /* @__PURE__ */ jsxRuntimeExports.jsx(Tag, { className: cardStyles.primaryTag, children: "发布" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Tag, { className: cardStyles.mutedTag, children: "通用" }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cardStyles.cardActions, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, { title: "查看详情", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                type: "text",
                size: "small",
                className: cardStyles.actionBtn,
                icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$2, {}),
                "aria-label": `查看流程 ${workflow.title}`,
                onClick: () => onView(workflow.id)
              }
            ) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, { title: "编辑画布", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                type: "text",
                size: "small",
                className: cardStyles.actionBtn,
                icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$3, {}),
                "aria-label": `编辑流程 ${workflow.title}`,
                onClick: () => onEdit(workflow.id)
              }
            ) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: cardStyles.cardDescription, children: workflow.description?.trim() || "暂无描述，使用右上角图标查看详情或编辑画布。" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cardStyles.cardFooter, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Text, { type: "secondary", className: cardStyles.footerHint, children: isPublish ? "@发布" : "@通用" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Text, { type: "secondary", className: cardStyles.metaLabel, children: [
            stepCount,
            " 步 · ",
            updatedLabel
          ] })
        ] })
      ]
    }
  );
}
const form = "_form_16mof_1";
const item = "_item_16mof_5";
const styles$6 = {
  form,
  item
};
const KIND_OPTIONS = [
  { value: "generic", label: "通用流程" },
  { value: "publish", label: "发布模板" }
];
function WorkflowMetaForm({
  workflow,
  onChange
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Form, { layout: "vertical", className: styles$6.form, requiredMark: false, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Form.Item, { label: "标题", className: styles$6.item, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      Input,
      {
        value: workflow.title,
        placeholder: "流程展示名称",
        onChange: (e) => onChange({ title: e.target.value })
      }
    ) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Form.Item, { label: "类型", className: styles$6.item, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      Select,
      {
        value: workflow.templateKind,
        options: KIND_OPTIONS,
        onChange: (value) => onChange({ templateKind: value }),
        style: { width: "100%" }
      }
    ) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Form.Item,
      {
        label: "描述",
        className: styles$6.item,
        extra: "用于列表卡片展示，帮助快速识别流程用途",
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input.TextArea,
          {
            value: workflow.description,
            placeholder: "可选：说明该流程解决什么问题",
            rows: 3,
            onChange: (e) => onChange({ description: e.target.value })
          }
        )
      }
    )
  ] });
}
const detailModal = "_detailModal_1t4cp_3";
const detailBody$1 = "_detailBody_1t4cp_12";
const detailHeader$1 = "_detailHeader_1t4cp_18";
const detailId$1 = "_detailId_1t4cp_28";
const detailTags$1 = "_detailTags_1t4cp_38";
const description$1 = "_description_1t4cp_45";
const sectionLabel = "_sectionLabel_1t4cp_68";
const canvasEntry = "_canvasEntry_1t4cp_85";
const canvasEntryIcon = "_canvasEntryIcon_1t4cp_95";
const canvasEntryMain = "_canvasEntryMain_1t4cp_108";
const canvasEntryTitle = "_canvasEntryTitle_1t4cp_113";
const canvasEntryDesc = "_canvasEntryDesc_1t4cp_119";
const footer = "_footer_1t4cp_126";
const styles$5 = {
  detailModal,
  detailBody: detailBody$1,
  detailHeader: detailHeader$1,
  detailId: detailId$1,
  detailTags: detailTags$1,
  description: description$1,
  sectionLabel,
  canvasEntry,
  canvasEntryIcon,
  canvasEntryMain,
  canvasEntryTitle,
  canvasEntryDesc,
  footer
};
function WorkflowDetailModal({
  open,
  draft,
  saving,
  running,
  onClose,
  onPatch,
  onOpenCanvas,
  onSave,
  onRun,
  onDelete
}) {
  const stepCount = draft ? flattenWorkflowLeaves(draft.nodes).length : 0;
  const isPublish = draft?.templateKind === "publish";
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Modal,
    {
      title: draft?.title?.trim() || "流程详情",
      open,
      onCancel: onClose,
      footer: draft ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$5.footer, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", {}),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Space, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: onSave, loading: saving, children: "保存" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              type: "primary",
              icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$6, {}),
              loading: running || saving,
              disabled: !draft.nodes.length,
              onClick: onRun,
              children: "立即运行"
            }
          )
        ] })
      ] }) : null,
      width: 760,
      destroyOnHidden: true,
      className: styles$5.detailModal,
      children: !draft ? /* @__PURE__ */ jsxRuntimeExports.jsx(Empty, { description: "未找到流程详情" }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$5.detailBody, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$5.detailHeader, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: styles$5.detailId, children: draft.id }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$5.detailTags, children: [
              isPublish ? /* @__PURE__ */ jsxRuntimeExports.jsx(Tag, { color: DB_THEME.primary, children: "发布" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Tag, { children: "通用" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Tag, { children: [
                stepCount,
                " 步"
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Space, { wrap: true, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "primary", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon, {}), onClick: onOpenCanvas, children: "打开画布" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Popconfirm,
              {
                title: "确定删除该流程？",
                description: "删除后不可恢复",
                okText: "删除",
                cancelText: "取消",
                okButtonProps: { danger: true },
                onConfirm: () => onDelete(draft.id),
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { danger: true, icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$4, {}), children: "删除" })
              }
            )
          ] })
        ] }),
        draft.description?.trim() ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: styles$5.description, children: draft.description }) : null,
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: styles$5.sectionLabel, children: "基本信息" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(WorkflowMetaForm, { workflow: draft, onChange: onPatch })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$5.canvasEntry, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$5.canvasEntryIcon, children: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$5, {}) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$5.canvasEntryMain, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$5.canvasEntryTitle, children: "流程画布" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$5.canvasEntryDesc, children: stepCount > 0 ? `已配置 ${stepCount} 个步骤，在独立抽屉中拖拽连线编排` : "尚未配置步骤，打开画布添加节点与连线" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon, {}), onClick: onOpenCanvas, children: "编辑画布" })
        ] })
      ] })
    }
  );
}
function useElementFullscreen(targetRef) {
  const [isFullscreen, setIsFullscreen] = reactExports.useState(false);
  const syncFullscreenState = reactExports.useCallback(() => {
    setIsFullscreen(document.fullscreenElement === targetRef.current);
  }, [targetRef]);
  reactExports.useEffect(() => {
    document.addEventListener("fullscreenchange", syncFullscreenState);
    syncFullscreenState();
    return () => {
      document.removeEventListener("fullscreenchange", syncFullscreenState);
      if (document.fullscreenElement === targetRef.current) {
        void document.exitFullscreen().catch(() => {
        });
      }
    };
  }, [syncFullscreenState, targetRef]);
  const exitFullscreen = reactExports.useCallback(async () => {
    if (!document.fullscreenElement) return;
    if (typeof document.exitFullscreen !== "function") {
      appMessage.warning("当前环境不支持退出全屏");
      return;
    }
    try {
      await document.exitFullscreen();
    } catch {
      appMessage.warning("退出全屏失败");
    }
  }, []);
  const toggleFullscreen = reactExports.useCallback(async () => {
    const el = targetRef.current;
    if (!el) {
      appMessage.warning("全屏目标未就绪");
      return;
    }
    if (document.fullscreenElement === el) {
      await exitFullscreen();
      return;
    }
    if (typeof el.requestFullscreen !== "function") {
      appMessage.warning("当前环境不支持全屏");
      return;
    }
    try {
      await el.requestFullscreen();
    } catch {
      appMessage.warning("无法进入全屏，请检查系统或浏览器权限");
    }
  }, [targetRef, exitFullscreen]);
  return { isFullscreen, toggleFullscreen, exitFullscreen };
}
const node$1 = "_node_14lf3_3";
const selected$1 = "_selected_14lf3_28";
const agent = "_agent_14lf3_34";
const tool = "_tool_14lf3_38";
const await_user = "_await_user_14lf3_42";
const notify = "_notify_14lf3_46";
const toast = "_toast_14lf3_50";
const input = "_input_14lf3_54";
const output = "_output_14lf3_58";
const body = "_body_14lf3_62";
const title$1 = "_title_14lf3_69";
const statusMark = "_statusMark_14lf3_83";
const status_running = "_status_running_14lf3_97";
const wfNodePulse = "_wfNodePulse_14lf3_1";
const statusSpinner = "_statusSpinner_14lf3_108";
const status_done = "_status_done_14lf3_114";
const status_failed = "_status_failed_14lf3_125";
const status_skipped = "_status_skipped_14lf3_136";
const handle$1 = "_handle_14lf3_156";
const styles$4 = {
  node: node$1,
  selected: selected$1,
  agent,
  tool,
  await_user,
  notify,
  toast,
  input,
  output,
  body,
  title: title$1,
  statusMark,
  status_running,
  wfNodePulse,
  statusSpinner,
  status_done,
  status_failed,
  status_skipped,
  handle: handle$1
};
function queryExecStatusLabel(status) {
  switch (status) {
    case "running":
      return "执行中";
    case "done":
      return "成功";
    case "failed":
      return "失败";
    case "skipped":
      return "已跳过";
    case "pending":
    default:
      return "待执行";
  }
}
function queryExecStatusMark(status) {
  switch (status) {
    case "running":
      return null;
    case "done":
      return "✓";
    case "failed":
      return "!";
    case "skipped":
      return "–";
    default:
      return "";
  }
}
function WorkflowFlowNode({
  data,
  selected: selected2
}) {
  const { leaf, execStatus, onEdit } = data;
  const statusClass = execStatus && execStatus !== "pending" ? styles$4[`status_${execStatus}`] : "";
  const statusLabel = execStatus ? queryExecStatusLabel(execStatus) : void 0;
  const statusMark2 = execStatus ? queryExecStatusMark(execStatus) : "";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: [styles$4.node, selected2 ? styles$4.selected : "", styles$4[leaf.type], statusClass].filter(Boolean).join(" "),
      onDoubleClick: () => onEdit(leaf.id),
      title: statusLabel ? `${leaf.title || "未命名步骤"} · ${statusLabel}` : "双击编辑",
      "aria-label": statusLabel,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Handle, { type: "target", position: Position.Top, className: styles$4.handle }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$4.body, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$4.title, children: leaf.title || "未命名步骤" }),
          execStatus === "running" ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$4.statusMark, "aria-hidden": true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$7, { className: styles$4.statusSpinner, spin: true }) }) : statusMark2 ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$4.statusMark, "aria-hidden": true, children: statusMark2 }) : null
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Handle, { type: "source", position: Position.Bottom, className: styles$4.handle })
      ]
    }
  );
}
const node = "_node_vxh26_1";
const start = "_start_vxh26_21";
const end = "_end_vxh26_26";
const selected = "_selected_vxh26_31";
const title = "_title_vxh26_44";
const handle = "_handle_vxh26_53";
const styles$3 = {
  node,
  start,
  end,
  selected,
  title,
  handle
};
function WorkflowTerminalFlowNode({
  data,
  selected: selected2
}) {
  const { terminal } = data;
  const isStart = terminal.type === "start";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: `${styles$3.node} ${isStart ? styles$3.start : styles$3.end} ${selected2 ? styles$3.selected : ""}`,
      title: isStart ? "流程开始（不可删除）" : "流程结束（不可删除）",
      children: [
        !isStart && /* @__PURE__ */ jsxRuntimeExports.jsx(Handle, { type: "target", position: Position.Top, className: styles$3.handle }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$3.title, children: terminal.title }),
        isStart && /* @__PURE__ */ jsxRuntimeExports.jsx(Handle, { type: "source", position: Position.Bottom, className: styles$3.handle })
      ]
    }
  );
}
function queryNotifyTargets(node2) {
  const raw = node2.targets?.filter((t) => t === "channel" || t === "toast") ?? [];
  if (raw.length) return Array.from(new Set(raw));
  return ["channel"];
}
function queryTemplateContextKeys(template) {
  const keys = /* @__PURE__ */ new Set();
  const re = /\{\{\s*([a-zA-Z_][\w.]*)\s*\}\}/g;
  let match;
  while ((match = re.exec(template)) !== null) {
    keys.add(match[1].split(".")[0]);
  }
  return Array.from(keys);
}
function queryJsonTemplateContextKeys(value) {
  const keys = /* @__PURE__ */ new Set();
  const walk = (v) => {
    if (typeof v === "string") {
      for (const k of queryTemplateContextKeys(v)) keys.add(k);
      return;
    }
    if (Array.isArray(v)) {
      v.forEach(walk);
      return;
    }
    if (v && typeof v === "object") {
      for (const item2 of Object.values(v)) walk(item2);
    }
  };
  walk(value);
  return Array.from(keys);
}
function queryNodeDefaultOutputKeys(node2) {
  switch (node2.type) {
    case "agent":
      return ["summary"];
    case "tool":
      return node2.outputKeys?.length ? node2.outputKeys : [node2.toolName || "toolResult"];
    case "await_user":
      return ["userInput"];
    case "notify":
      return [`notify_${node2.id}`];
    case "toast":
      return [`toast_${node2.id}`];
    case "input": {
      const keys = [];
      if (!node2.inputKinds.length || node2.inputKinds.includes("text")) keys.push("userInput");
      if (node2.inputKinds.some((k) => k === "attachment" || k === "image" || k === "video")) {
        keys.push("attachmentPaths");
      }
      return keys.length ? keys : ["userInput"];
    }
    case "output":
      return ["outputPath"];
    default:
      return [];
  }
}
function queryNodeDeclaredOutputKeys(node2) {
  if (node2.outputKeys?.length) return [...node2.outputKeys];
  return queryNodeDefaultOutputKeys(node2);
}
function queryNodeInferredInputKeys(node2) {
  const keys = /* @__PURE__ */ new Set();
  switch (node2.type) {
    case "agent":
      for (const k of queryTemplateContextKeys(node2.prompt)) keys.add(k);
      break;
    case "tool":
      for (const k of queryJsonTemplateContextKeys(node2.argsTemplate)) keys.add(k);
      break;
    case "await_user":
      for (const k of queryTemplateContextKeys(node2.reason)) keys.add(k);
      break;
    case "notify":
      if (node2.titleTemplate) {
        for (const k of queryTemplateContextKeys(node2.titleTemplate)) keys.add(k);
      }
      for (const k of queryTemplateContextKeys(node2.contentTemplate)) keys.add(k);
      break;
    case "toast":
      for (const k of queryTemplateContextKeys(node2.contentTemplate)) keys.add(k);
      break;
    case "input":
      for (const k of queryTemplateContextKeys(node2.prompt)) keys.add(k);
      break;
    case "output":
      for (const k of queryTemplateContextKeys(node2.contentTemplate)) keys.add(k);
      if (node2.fileNameTemplate) {
        for (const k of queryTemplateContextKeys(node2.fileNameTemplate)) keys.add(k);
      }
      break;
  }
  return Array.from(keys);
}
function queryNodeRequiredInputKeys(node2) {
  const explicit = node2.inputKeys?.filter(Boolean) ?? [];
  const inferred = queryNodeInferredInputKeys(node2);
  return Array.from(/* @__PURE__ */ new Set([...explicit, ...inferred]));
}
function queryUpstreamNodeIds(canvas2, nodeId) {
  return Array.from(
    new Set(canvas2.edges.filter((e) => e.target === nodeId).map((e) => e.source))
  );
}
function queryUpstreamOutputKeys(leaves, canvas2, nodeId) {
  const leafMap = new Map(leaves.map((l) => [l.id, l]));
  const keys = /* @__PURE__ */ new Set();
  const visited = /* @__PURE__ */ new Set();
  const walk = (ids) => {
    for (const id of ids) {
      if (visited.has(id)) continue;
      visited.add(id);
      const leaf = leafMap.get(id);
      if (leaf) {
        for (const k of queryNodeDeclaredOutputKeys(leaf)) keys.add(k);
      }
      const preds = canvas2.edges.filter((e) => e.target === id).map((e) => e.source);
      if (preds.length) walk(preds);
    }
  };
  walk(queryUpstreamNodeIds(canvas2, nodeId));
  return Array.from(keys).sort();
}
function queryIoAlignmentIssues(node2, upstreamOutputKeys) {
  const upstream = new Set(upstreamOutputKeys);
  const required = queryNodeRequiredInputKeys(node2);
  const missing = required.filter((k) => !upstream.has(k));
  return { missing, upstream: Array.from(upstream).sort(), required };
}
function parseContextKeyList(raw) {
  return (raw ?? "").split(/[,，\s]+/).map((s) => s.trim()).filter(Boolean);
}
function formatContextKeyList(keys) {
  return keys.length ? keys.join(", ") : "（无）";
}
const TOOL_ARGS_EXAMPLES = {
  use_skill: {
    skillId: "example-skill-id"
  },
  switch_model: {
    capability: "reasoning",
    reason: "需要更强推理"
  },
  list_attachments: {},
  read_file: {
    path: "/absolute/path/to/file.txt"
  },
  write_file: {
    filename: "note.txt",
    content: "{{summary}}"
  },
  update_task_list: {
    tasks: [
      { id: "1", title: "准备素材", status: "pending" },
      { id: "2", title: "发布内容", status: "pending" }
    ]
  },
  generate_image: {
    prompt: "竖版海报，简洁现代，主题：{{summary}}"
  },
  fetch_web_images: {
    pageUrl: "https://example.com/article",
    maxCount: 3
  },
  fetch_hot_topics: {
    source: "tophub",
    maxCount: 20
  },
  query_ashare_kline: {
    symbols: "600519,000001",
    period: "daily",
    count: 120
  },
  query_ashare_realtime_analysis: {
    symbols: "600519,000001",
    range: "today",
    preloadRanges: true
  },
  query_weather: {
    city: "北京"
  },
  query_web_data: {
    url: "https://example.com",
    preferBrowser: false,
    mediaTypes: ["image", "video", "audio"],
    downloadMedia: false,
    maxMediaCount: 8
  },
  generate_script: {
    title: "{{summary}}",
    script: "场次 1：……\n对白：……",
    sourcePrompt: "{{summary}}"
  },
  generate_storyboard: {
    title: "{{scriptTitle}}",
    logline: "{{summary}}",
    shots: [
      {
        id: "shot-1",
        visual: "近景，主角站在窗边",
        narration: "旁白示例",
        durationSec: 3,
        aspectRatio: "9:16"
      }
    ]
  },
  generate_scene_assets: {
    storyboardPath: "{{storyboardPath}}"
  },
  compose_video: {
    title: "{{scriptTitle}}",
    sceneDurationSec: 3
  },
  browser_navigate: {
    url: "https://example.com"
  },
  browser_snapshot: {
    maxLength: 12e3
  },
  browser_click: {
    text: "登录"
  },
  browser_type: {
    selector: 'input[type="text"]',
    text: "{{summary}}",
    clear: true
  },
  browser_upload: {
    paths: ["/absolute/path/to/image.png"]
  },
  browser_wait: {
    ms: 1500
  },
  xhs_publish_note: {
    title: "{{summary}}",
    content: "{{summary}}",
    publishType: "image",
    imagePaths: ["{{imagePath}}"],
    autoPublish: true
  },
  douyin_publish_note: {
    title: "{{summary}}",
    content: "{{summary}}",
    imagePaths: ["{{imagePath}}"],
    autoPublish: true
  },
  notify_message: {
    channelId: "feishu",
    title: "{{workflowTitle}}",
    content: "{{summary}}",
    msgType: "post"
  }
};
const TOOL_CONTEXT_OUTPUT_EXAMPLES = {
  fetch_hot_topics: {
    hotTopicsOk: "1",
    hotSource: "weibo",
    hotTopics: "…榜单正文…",
    hotFetchSource: "api"
  },
  query_ashare_kline: {
    stockKlineOk: "1",
    stockSymbols: "600519,000001",
    stockKlineSummary: "…K 线摘要…"
  },
  query_ashare_realtime_analysis: {
    stockAnalysisOk: "1",
    stockSymbols: "600519,000001",
    stockKlineSummary: "…",
    stockAnalysisReport: "…",
    stockSignal: "hold"
  },
  query_weather: {
    weatherOk: "1",
    weatherText: "…",
    weatherSummary: "…",
    weatherCity: "北京"
  },
  query_web_data: {
    webDataOk: "1",
    webData: "…正文…",
    webDataUrl: "https://example.com",
    webDataTitle: "…",
    webDataSource: "api",
    webDataMedia: '[{"kind":"video","url":"https://…","localPath":""}]'
  },
  generate_script: {
    scriptOk: "1",
    scriptPath: "/path/to/projects/…/script.md",
    scriptTitle: "…",
    scriptText: "…"
  },
  generate_storyboard: {
    storyboardOk: "1",
    storyboardPath: "/path/to/projects/…/storyboard.json",
    storyboardTitle: "…",
    shotCount: "3"
  },
  generate_scene_assets: {
    sceneAssetsOk: "1",
    sceneAssetPaths: '["…"]',
    sceneVideoPaths: '["…"]',
    sceneAudioPaths: '["…"]',
    sceneAssetsManifest: "/path/to/assets-manifest.json"
  },
  compose_video: {
    videoOk: "1",
    videoPath: "/path/to/output.mp4",
    videoMessage: "…"
  }
};
function queryToolArgsExample(toolName) {
  const key = toolName.trim();
  if (!key) return {};
  const example = TOOL_ARGS_EXAMPLES[key];
  if (!example) return {};
  return { ...example };
}
function queryToolContextInputKeys(toolName) {
  return queryJsonTemplateContextKeys(queryToolArgsExample(toolName));
}
function queryToolContextExample(toolName) {
  const key = toolName.trim();
  if (!key) return {};
  const preview = {};
  for (const inputKey of queryToolContextInputKeys(key)) {
    preview[inputKey] = null;
  }
  const outputs = TOOL_CONTEXT_OUTPUT_EXAMPLES[key];
  if (outputs) {
    for (const [k, v] of Object.entries(outputs)) {
      preview[k] = v;
    }
  }
  return preview;
}
function queryToolContextPreview(toolName, upstreamOutputKeys) {
  const toolPreview = queryToolContextExample(toolName);
  const merged = {};
  for (const k of upstreamOutputKeys) {
    merged[k] = toolPreview[k] ?? null;
  }
  for (const [k, v] of Object.entries(toolPreview)) {
    if (!(k in merged)) {
      merged[k] = v;
    }
  }
  return merged;
}
function queryFormatToolContextPreviewJson(toolName, upstreamOutputKeys) {
  const preview = queryToolContextPreview(toolName, upstreamOutputKeys);
  return JSON.stringify(preview, null, 2);
}
const TOOL_NAME_OPTIONS = [
  { value: "use_skill", label: "use_skill（加载技能）" },
  { value: "switch_model", label: "switch_model（切换模型）" },
  { value: "list_attachments", label: "list_attachments（查看附件）" },
  { value: "read_file", label: "read_file（读取文件）" },
  { value: "write_file", label: "write_file（写入文件）" },
  { value: "update_task_list", label: "update_task_list（更新任务）" },
  { value: "generate_image", label: "generate_image（生成图片）" },
  { value: "fetch_web_images", label: "fetch_web_images（抓取网页配图）" },
  { value: "fetch_hot_topics", label: "fetch_hot_topics（获取热点：微博/百度/抖音/快手/腾讯/今日热榜）" },
  { value: "query_ashare_kline", label: "query_ashare_kline（A股K线）" },
  { value: "query_ashare_realtime_analysis", label: "query_ashare_realtime_analysis（实时K线+分析）" },
  { value: "query_weather", label: "query_weather（查询天气）" },
  { value: "query_web_data", label: "query_web_data（读取链接正文/按需媒体）" },
  { value: "generate_script", label: "generate_script（生成剧本）" },
  { value: "generate_storyboard", label: "generate_storyboard（生成分镜）" },
  { value: "generate_scene_assets", label: "generate_scene_assets（生成场景素材）" },
  { value: "compose_video", label: "compose_video（合成视频）" },
  { value: "browser_navigate", label: "browser_navigate（打开网页）" },
  { value: "browser_snapshot", label: "browser_snapshot（查看页面结构）" },
  { value: "browser_click", label: "browser_click（点击页面）" },
  { value: "browser_type", label: "browser_type（输入文本）" },
  { value: "browser_upload", label: "browser_upload（上传文件）" },
  { value: "browser_wait", label: "browser_wait（等待页面）" },
  { value: "xhs_publish_note", label: "xhs_publish_note（发布小红书）" },
  { value: "douyin_publish_note", label: "douyin_publish_note（发布抖音）" },
  { value: "notify_message", label: "notify_message（渠道通知）" }
];
function queryToolSelectOptions(selected2) {
  const values = Array.isArray(selected2) ? selected2 : selected2 ? [selected2] : [];
  const known = new Set(TOOL_NAME_OPTIONS.map((o) => o.value));
  const extras = values.map((v) => v.trim()).filter(Boolean).filter((v) => !known.has(v)).map((v) => ({ value: v, label: v }));
  return extras.length ? [...TOOL_NAME_OPTIONS, ...extras] : TOOL_NAME_OPTIONS;
}
function formatKeysForForm(keys) {
  return keys?.join(", ") ?? "";
}
function queryIsBlankToolArgsJson(raw) {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return true;
  try {
    const parsed = JSON.parse(trimmed);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return false;
    return Object.keys(parsed).length === 0;
  } catch {
    return false;
  }
}
function queryFormatArgsJsonForForm(example) {
  if (Object.keys(example).length === 0) return "{}";
  return JSON.stringify(example, null, 2);
}
function nodeToFormValues(node2) {
  const base = {
    type: node2.type,
    title: node2.title,
    inputKeys: formatKeysForForm("inputKeys" in node2 ? node2.inputKeys : void 0),
    outputKeys: formatKeysForForm("outputKeys" in node2 ? node2.outputKeys : void 0)
  };
  if (node2.type === "agent") {
    return {
      ...base,
      prompt: node2.prompt,
      toolWhitelist: node2.toolWhitelist ? [...node2.toolWhitelist] : []
    };
  }
  if (node2.type === "tool") {
    return {
      ...base,
      toolName: node2.toolName,
      argsJson: JSON.stringify(node2.argsTemplate ?? {}, null, 2)
    };
  }
  if (node2.type === "await_user") {
    return {
      ...base,
      reason: node2.reason
    };
  }
  if (node2.type === "input") {
    return {
      ...base,
      inputPrompt: node2.prompt,
      inputKinds: node2.inputKinds?.length ? [...node2.inputKinds] : ["text"]
    };
  }
  if (node2.type === "output") {
    return {
      ...base,
      outputDir: node2.outputDir,
      outputFormat: node2.outputFormat,
      fileNameTemplate: node2.fileNameTemplate ?? "output",
      contentTemplate: node2.contentTemplate
    };
  }
  if (node2.type === "notify") {
    return {
      ...base,
      targets: queryNotifyTargets(node2),
      channelId: node2.channelId,
      titleTemplate: node2.titleTemplate ?? "",
      contentTemplate: node2.contentTemplate,
      msgType: queryFeishuMsgType({
        msgType: node2.msgType,
        richText: node2.richText,
        channelId: node2.channelId
      }),
      imageKey: node2.imageKey ?? "",
      shareChatId: node2.shareChatId ?? "",
      failSoft: node2.failSoft !== false,
      toastLevel: node2.toastLevel ?? "info"
    };
  }
  if (node2.type === "toast") {
    return {
      ...base,
      type: "notify",
      targets: ["toast"],
      toastLevel: node2.level,
      contentTemplate: node2.contentTemplate
    };
  }
  if (node2.type === "condition") {
    const keys = node2.cases.map((c) => c.key);
    const isIfElse = keys.length === 2 && keys.includes("true") && keys.includes("false");
    return {
      ...base,
      mode: node2.mode,
      branchShape: isIfElse ? "ifelse" : "switch",
      contextKey: node2.when?.contextKey ?? "",
      op: node2.when?.op ?? "truthy",
      value: node2.when?.value != null ? String(node2.when.value) : "",
      useAdvancedExpression: Boolean(node2.when?.expression?.trim()),
      expression: node2.when?.expression ?? "",
      prompt: node2.prompt ?? "",
      toolWhitelist: node2.toolWhitelist ? [...node2.toolWhitelist] : [],
      defaultKey: node2.defaultKey,
      cases: node2.cases.map((c) => ({ key: c.key, label: c.label }))
    };
  }
  return base;
}
function mergeConditionCases(rows, prev) {
  const prevByKey = new Map((prev?.cases ?? []).map((c) => [c.key, c.nodes]));
  const result = [];
  for (const r of rows) {
    const key = (r.key ?? "").trim();
    if (!key) continue;
    const prevNodes = prevByKey.get(key);
    result.push({
      key,
      label: (r.label ?? "").trim() || void 0,
      nodes: prevNodes ? [...prevNodes] : []
    });
  }
  return result;
}
function buildNodeFromValues(values, prev) {
  const title2 = values.title.trim() || "未命名步骤";
  const id = prev?.id ?? crypto.randomUUID();
  const inputKeys = parseContextKeyList(values.inputKeys);
  const outputKeys = parseContextKeyList(values.outputKeys);
  const withIo = (node22) => ({
    ...node22,
    ...inputKeys.length ? { inputKeys } : {},
    ...outputKeys.length ? { outputKeys } : {}
  });
  if (values.type === "condition") {
    const prevCond = prev?.type === "condition" ? prev : null;
    let caseRows = values.cases ?? [];
    if (values.branchShape === "ifelse") {
      caseRows = [
        { key: "true", label: caseRows.find((c) => c.key === "true")?.label || "是" },
        { key: "false", label: caseRows.find((c) => c.key === "false")?.label || "否" }
      ];
    }
    if (!caseRows.length) {
      throw new Error("请至少配置一个分支");
    }
    const whitelist = (values.toolWhitelist ?? []).map((s) => s.trim()).filter(Boolean);
    const when = values.mode === "expression" ? values.useAdvancedExpression ? { expression: (values.expression ?? "").trim() } : {
      contextKey: (values.contextKey ?? "").trim(),
      op: values.op ?? "truthy",
      value: values.op === "eq" || values.op === "neq" ? (values.value ?? "").trim() : void 0
    } : void 0;
    if (values.mode === "expression" && values.useAdvancedExpression && !(values.expression ?? "").trim()) {
      throw new Error("请填写高级表达式");
    }
    if (values.mode === "expression" && !values.useAdvancedExpression && !(values.contextKey ?? "").trim()) {
      throw new Error("请填写 context 字段名");
    }
    const node22 = {
      id,
      type: "condition",
      title: title2,
      mode: values.mode === "agent" ? "agent" : "expression",
      when,
      prompt: values.mode === "agent" ? (values.prompt ?? "").trim() : void 0,
      toolWhitelist: values.mode === "agent" && whitelist.length ? whitelist : void 0,
      cases: mergeConditionCases(caseRows, prevCond),
      defaultKey: (values.defaultKey ?? "").trim() || void 0
    };
    if (values.mode === "agent" && !node22.prompt) {
      throw new Error("请填写 Agent 选路提示词");
    }
    return node22;
  }
  if (values.type === "agent") {
    const whitelist = (values.toolWhitelist ?? []).map((s) => s.trim()).filter(Boolean);
    const node22 = withIo({
      id,
      type: "agent",
      title: title2,
      prompt: (values.prompt ?? "").trim(),
      toolWhitelist: whitelist.length ? whitelist : void 0
    });
    return node22;
  }
  if (values.type === "tool") {
    let argsTemplate = {};
    const raw = (values.argsJson ?? "").trim() || "{}";
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        argsTemplate = parsed;
      } else {
        throw new Error("参数必须是 JSON 对象");
      }
    } catch (e) {
      throw new Error(e instanceof Error ? e.message : "参数 JSON 无效");
    }
    const node22 = withIo({
      id,
      type: "tool",
      title: title2,
      toolName: (values.toolName ?? "").trim(),
      argsTemplate
    });
    if (!node22.toolName) throw new Error("请填写工具名");
    return node22;
  }
  if (values.type === "input") {
    const kinds = (values.inputKinds ?? []).filter(
      (k) => k === "text" || k === "attachment" || k === "image" || k === "video"
    );
    if (!kinds.length) throw new Error("请至少选择一种输入类型");
    const node22 = withIo({
      id,
      type: "input",
      title: title2,
      prompt: (values.inputPrompt ?? "").trim() || "请输入内容后继续流程",
      inputKinds: kinds
    });
    return node22;
  }
  if (values.type === "output") {
    const format = values.outputFormat ?? "markdown";
    const validFormat = format === "text" || format === "markdown" || format === "json" || format === "file" ? format : "markdown";
    const node22 = withIo({
      id,
      type: "output",
      title: title2,
      outputDir: (values.outputDir ?? "").trim(),
      outputFormat: validFormat,
      fileNameTemplate: (values.fileNameTemplate ?? "").trim() || "output",
      contentTemplate: (values.contentTemplate ?? "").trim() || "{{summary}}"
    });
    if (!node22.outputDir) throw new Error("请选择输出目录");
    return node22;
  }
  if (values.type === "await_user") {
    const node22 = withIo({
      id,
      type: "await_user",
      title: title2,
      reason: (values.reason ?? "").trim() || "请确认后继续"
    });
    return node22;
  }
  if (values.type === "notify") {
    const targetsRaw = (values.targets ?? []).filter(
      (t) => t === "channel" || t === "toast"
    );
    const targets = targetsRaw.length ? Array.from(new Set(targetsRaw)) : ["channel", "toast"];
    const wantsChannel = targets.includes("channel");
    const wantsToast = targets.includes("toast");
    if (!wantsChannel && !wantsToast) {
      throw new Error("请至少选择一种通知方式");
    }
    const channelId = wantsChannel ? (values.channelId ?? "").trim() || "feishu" : (values.channelId ?? "").trim() || void 0;
    if (wantsChannel && !channelId) throw new Error("请选择通知渠道");
    const toastLevel = values.toastLevel ?? "info";
    const validLevel = toastLevel === "success" || toastLevel === "error" || toastLevel === "warning" || toastLevel === "info" ? toastLevel : "info";
    const msgType = wantsChannel ? values.msgType ?? queryFeishuMsgType({ channelId }) : void 0;
    const node22 = withIo({
      id,
      type: "notify",
      title: title2,
      targets,
      channelId,
      titleTemplate: (values.titleTemplate ?? "").trim() || void 0,
      contentTemplate: (values.contentTemplate ?? "").trim() || "{{summary}}",
      msgType,
      imageKey: (values.imageKey ?? "").trim() || void 0,
      shareChatId: (values.shareChatId ?? "").trim() || void 0,
      failSoft: values.failSoft !== false,
      toastLevel: wantsToast ? validLevel : void 0
    });
    return node22;
  }
  const prevChildren = prev && prev.type === "parallel" ? prev.children : [];
  const node2 = {
    id,
    type: "parallel",
    title: title2,
    children: prevChildren
  };
  return node2;
}
function WorkflowNodeEditModal({
  open,
  node: node2,
  upstreamOutputKeys = [],
  leafOnly = false,
  allowCondition = false,
  isFullscreen = false,
  fullscreenContainer = null,
  onCancel,
  onOk
}) {
  const [form2] = Form.useForm();
  const channels = useChannelsStore((s) => s.channels);
  const notifyChannelOptions = reactExports.useMemo(
    () => queryEnabledNotifyChannelsFromStore(channels).map((c) => ({
      value: c.id,
      label: c.label
    })),
    [channels]
  );
  const type = Form.useWatch("type", form2);
  const mode = Form.useWatch("mode", form2);
  const branchShape = Form.useWatch("branchShape", form2);
  const useAdvanced = Form.useWatch("useAdvancedExpression", form2);
  const op = Form.useWatch("op", form2);
  const notifyChannelId = Form.useWatch("channelId", form2);
  const notifyMsgType = Form.useWatch("msgType", form2);
  const notifyTargets = Form.useWatch("targets", form2);
  const wantsNotifyChannel = (notifyTargets ?? []).includes("channel");
  const wantsNotifyToast = (notifyTargets ?? []).includes("toast");
  const toolWhitelist = Form.useWatch("toolWhitelist", form2);
  const toolName = Form.useWatch("toolName", form2);
  const argsJson = Form.useWatch("argsJson", form2);
  const isEditingCondition = node2?.type === "condition";
  const initialToolNameRef = reactExports.useRef(void 0);
  const toolSelectOptions = reactExports.useMemo(
    () => queryToolSelectOptions(
      [...toolWhitelist ?? [], ...toolName ? [toolName] : []].filter(Boolean)
    ),
    [toolWhitelist, toolName]
  );
  reactExports.useEffect(() => {
    if (!open) {
      initialToolNameRef.current = void 0;
      return;
    }
    if (node2) {
      form2.setFieldsValue(nodeToFormValues(node2));
      initialToolNameRef.current = node2.type === "tool" ? node2.toolName?.trim() || void 0 : void 0;
    } else {
      form2.setFieldsValue(nodeToFormValues(createAgentNode()));
      initialToolNameRef.current = void 0;
    }
  }, [open, node2, form2]);
  reactExports.useEffect(() => {
    if (!open || type !== "tool") return;
    const selected2 = (toolName ?? "").trim();
    if (!selected2) return;
    if (initialToolNameRef.current === selected2) return;
    if (!queryIsBlankToolArgsJson(argsJson)) return;
    form2.setFieldValue(
      "argsJson",
      queryFormatArgsJsonForForm(queryToolArgsExample(selected2))
    );
    const currentInputKeys = parseContextKeyList(form2.getFieldValue("inputKeys"));
    if (!currentInputKeys.length) {
      const inferred = queryToolContextInputKeys(selected2);
      if (inferred.length) {
        form2.setFieldValue("inputKeys", inferred.join(", "));
      }
    }
  }, [open, type, toolName, argsJson, form2]);
  const toolContextPreviewJson = reactExports.useMemo(
    () => queryFormatToolContextPreviewJson((toolName ?? "").trim(), upstreamOutputKeys),
    [toolName, upstreamOutputKeys]
  );
  const typeOptions = reactExports.useMemo(() => {
    const all = [
      { value: "input", label: "输入节点" },
      { value: "output", label: "输出节点" },
      { value: "agent", label: "Agent 步骤" },
      { value: "tool", label: "工具步骤" },
      { value: "notify", label: "通知" },
      { value: "await_user", label: "等待确认" },
      { value: "parallel", label: "并行组" },
      { value: "condition", label: "条件分支" }
    ];
    let opts = all;
    if (leafOnly) opts = opts.filter((o) => o.value !== "parallel");
    if (!allowCondition) opts = opts.filter((o) => o.value !== "condition");
    return opts;
  }, [leafOnly, allowCondition]);
  const handleOk = async () => {
    try {
      const values = await form2.validateFields();
      if (isEditingCondition) {
        values.type = "condition";
      }
      const basePrev = node2 ?? (values.type === "tool" ? createToolNode() : values.type === "input" ? createInputNode() : values.type === "output" ? createOutputNode() : values.type === "await_user" ? createAwaitNode() : values.type === "notify" ? createNotifyNode() : values.type === "parallel" ? createParallelNode() : values.type === "condition" ? createConditionNode() : createAgentNode());
      const next = buildNodeFromValues(values, node2 ?? basePrev);
      if (leafOnly && !isLeafNode(next) && next.type !== "condition") {
        appMessage.error("此处只能添加叶子步骤或条件分支");
        return;
      }
      if (isLeafNode(next)) {
        const issues = queryIoAlignmentIssues(next, upstreamOutputKeys);
        if (issues.missing.length) {
          appMessage.warning(
            `上游可能缺少输出字段：${issues.missing.join(", ")}（上游可用：${formatContextKeyList(upstreamOutputKeys)}）`
          );
        }
      }
      onOk(next);
    } catch (err) {
      if (err instanceof Error && err.message) {
        appMessage.error(err.message);
      }
    }
  };
  const showIoFields = type === "agent" || type === "tool" || type === "await_user" || type === "notify" || type === "input" || type === "output";
  const defaultOutputHintByType = {
    agent: "summary",
    tool: "工具名或自定义键",
    await_user: "userInput",
    notify: "notify_<节点id>",
    input: "userInput, attachmentPaths",
    output: "outputPath"
  };
  const handlePickOutputDir = async () => {
    const dir = await postSelectDirectory();
    if (dir) form2.setFieldValue("outputDir", dir);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Modal,
    {
      title: isEditingCondition ? "编辑条件分支" : node2 ? "编辑步骤" : "添加步骤",
      open,
      onCancel,
      onOk: () => void handleOk(),
      okText: "保存",
      cancelText: "取消",
      destroyOnHidden: true,
      width: 560,
      getContainer: isFullscreen && fullscreenContainer ? () => fullscreenContainer : void 0,
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Form, { form: form2, layout: "vertical", style: { marginTop: 12 }, children: [
        !isEditingCondition && /* @__PURE__ */ jsxRuntimeExports.jsx(
          Form.Item,
          {
            name: "type",
            label: "类型",
            rules: [{ required: true }],
            tooltip: node2 ? "类型在添加节点时选定，编辑时不可更改" : void 0,
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(Select, { options: typeOptions, disabled: Boolean(node2) })
          }
        ),
        isEditingCondition && /* @__PURE__ */ jsxRuntimeExports.jsx(Form.Item, { name: "type", hidden: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, {}) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Form.Item, { name: "title", label: "标题", rules: [{ required: true, message: "请输入标题" }], children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { placeholder: "步骤名称" }) }),
        showIoFields && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Form.Item,
            {
              name: "inputKeys",
              label: "输入字段",
              tooltip: "声明本节点需要从上游 context 读取的键；留空则从模板 {{key}} 自动推断",
              extra: `上游可用输出：${formatContextKeyList(upstreamOutputKeys)}`,
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { placeholder: "格式：逗号分隔，如 summary, hotTopics" })
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Form.Item,
            {
              name: "outputKeys",
              label: "输出字段",
              tooltip: "本节点写入 context 的键名，供下游 {{key}} 引用",
              extra: type ? `留空时默认：${defaultOutputHintByType[type] ?? "—"}` : void 0,
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { placeholder: "格式：逗号分隔，如 summary, videoPath" })
            }
          )
        ] }),
        (type === "condition" || isEditingCondition) && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Form.Item, { name: "mode", label: "判定模式", initialValue: "expression", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            Radio.Group,
            {
              options: [
                { value: "expression", label: "表达式" },
                { value: "agent", label: "Agent 选路" }
              ]
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Form.Item, { name: "branchShape", label: "分支形态", initialValue: "ifelse", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            Radio.Group,
            {
              options: [
                { value: "ifelse", label: "If / Else" },
                { value: "switch", label: "Switch 多路" }
              ]
            }
          ) }),
          mode !== "agent" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Form.Item,
              {
                name: "useAdvancedExpression",
                label: "高级表达式",
                valuePropName: "checked",
                tooltip: "开启后用短表达式覆盖表单条件",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(Switch, {})
              }
            ),
            useAdvanced ? /* @__PURE__ */ jsxRuntimeExports.jsx(
              Form.Item,
              {
                name: "expression",
                label: "表达式",
                extra: '示例：context.status == "ok"（仅允许 context.字段、字面量与比较运算）',
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input.TextArea, { rows: 3, placeholder: "context.ok == true" })
              }
            ) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Form.Item, { name: "contextKey", label: "Context 字段", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { placeholder: "例如 ok / status" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Form.Item, { name: "op", label: "运算符", initialValue: "truthy", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                Select,
                {
                  options: [
                    { value: "truthy", label: "为真" },
                    { value: "falsy", label: "为假" },
                    { value: "eq", label: "等于" },
                    { value: "neq", label: "不等于" }
                  ]
                }
              ) }),
              (op === "eq" || op === "neq") && /* @__PURE__ */ jsxRuntimeExports.jsx(Form.Item, { name: "value", label: "比较值", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { placeholder: "期望值" }) })
            ] })
          ] }),
          mode === "agent" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Form.Item, { name: "prompt", label: "选路提示词", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input.TextArea,
              {
                rows: 3,
                placeholder: "说明如何根据上下文选择分支 key"
              }
            ) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Form.Item,
              {
                name: "toolWhitelist",
                label: "工具白名单",
                tooltip: "选路一般无需工具；留空则禁止工具调用",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Select,
                  {
                    mode: "tags",
                    showSearch: true,
                    allowClear: true,
                    placeholder: "选择工具；通常留空",
                    options: toolSelectOptions,
                    optionFilterProp: "label"
                  }
                )
              }
            )
          ] }),
          branchShape === "switch" && /* @__PURE__ */ jsxRuntimeExports.jsx(Form.List, { name: "cases", children: (fields, { add, remove }) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { marginBottom: 8 }, children: "分支列表" }),
            fields.map((field) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Space, { align: "baseline", style: { display: "flex" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Form.Item,
                {
                  ...field,
                  name: [field.name, "key"],
                  rules: [{ required: true, message: "key" }],
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { placeholder: "key", style: { width: 120 } })
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Form.Item, { ...field, name: [field.name, "label"], children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { placeholder: "标签", style: { width: 120 } }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "link", danger: true, onClick: () => remove(field.name), children: "删除" })
            ] }, field.key)),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "dashed", onClick: () => add({ key: "", label: "" }), block: true, children: "添加分支" })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Form.Item, { name: "defaultKey", label: "默认支路 key", tooltip: "无匹配时走该 key", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { placeholder: "可选" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Typography.Paragraph, { type: "secondary", style: { marginBottom: 0 }, children: "各支路步骤请在画布上从条件出口连线编排，并汇合到同一后续节点。带标签出线 = 条件分支；无标签多出线 = 并行。" })
        ] }),
        type === "agent" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Form.Item,
            {
              name: "prompt",
              label: "目标 / 提示词",
              rules: [{ required: true, message: "请填写步骤目标" }],
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input.TextArea, { rows: 4, placeholder: "本步骤希望 Agent 完成的事；可用 {{contextKey}} 引用上游输出" })
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Form.Item,
            {
              name: "toolWhitelist",
              label: "工具白名单",
              tooltip: "留空表示可用全部工具",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                Select,
                {
                  mode: "tags",
                  showSearch: true,
                  allowClear: true,
                  placeholder: "选择工具；留空表示可用全部",
                  options: toolSelectOptions,
                  optionFilterProp: "label"
                }
              )
            }
          )
        ] }),
        type === "tool" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Form.Item,
            {
              name: "toolName",
              label: "工具名",
              rules: [{ required: true, message: "请选择工具名" }],
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                Select,
                {
                  showSearch: true,
                  allowClear: true,
                  placeholder: "选择工具",
                  options: toolSelectOptions,
                  optionFilterProp: "label"
                }
              )
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Form.Item,
            {
              name: "argsJson",
              label: "参数 JSON",
              tooltip: "支持 {{contextKey}} 插值，引用上游上下文",
              initialValue: "{}",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input.TextArea, { rows: 5, placeholder: '{"title":"{{summary}}"}；JSON 对象，值支持 {{contextKey}}' })
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Form.Item,
            {
              label: "Context",
              tooltip: "入参键（null）来自参数 JSON 的 {{key}}；示例值为本工具执行后典型写入的 context 字段",
              extra: (toolName ?? "").trim() ? "切换工具会自动更新；可与上游输出键合并展示" : "请选择工具以查看典型 context 字段",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input.TextArea,
                {
                  rows: Math.min(
                    12,
                    Math.max(3, toolContextPreviewJson.split("\n").length + 1)
                  ),
                  readOnly: true,
                  value: toolContextPreviewJson
                }
              )
            }
          )
        ] }),
        type === "await_user" && /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Form.Item, { name: "reason", label: "确认说明", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input.TextArea,
          {
            rows: 3,
            placeholder: "展示给用户的暂停原因；可用 {{contextKey}} 引用上游摘要"
          }
        ) }) }),
        type === "input" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Form.Item,
            {
              name: "inputKinds",
              label: "采集类型",
              rules: [{ required: true, message: "请至少选择一种输入类型" }],
              tooltip: "执行到此节点时暂停，等待用户提供对应类型的内容",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                Select,
                {
                  mode: "multiple",
                  placeholder: "选择：文字 / 附件 / 图片 / 视频",
                  options: [
                    { value: "text", label: "文字" },
                    { value: "attachment", label: "附件" },
                    { value: "image", label: "图片" },
                    { value: "video", label: "视频" }
                  ]
                }
              )
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Form.Item,
            {
              name: "inputPrompt",
              label: "采集说明",
              rules: [{ required: true, message: "请填写采集说明" }],
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input.TextArea,
                {
                  rows: 3,
                  placeholder: "向用户说明需要提供什么，如：请上传产品图并补充一句卖点"
                }
              )
            }
          )
        ] }),
        type === "output" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Form.Item,
            {
              name: "outputDir",
              label: "输出目录",
              rules: [{ required: true, message: "请选择输出目录" }],
              extra: "绝对路径；运行时将内容写入该文件夹",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  placeholder: "/Users/你/文稿/流程输出",
                  addonAfter: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "link", size: "small", onClick: () => void handlePickOutputDir(), children: "选择文件夹" })
                }
              )
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Form.Item, { name: "outputFormat", label: "输出格式", initialValue: "markdown", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            Select,
            {
              options: [
                { value: "text", label: "纯文本 (.txt)" },
                { value: "markdown", label: "Markdown (.md)" },
                { value: "json", label: "JSON (.json)" },
                { value: "file", label: "复制文件（content 为源路径 {{key}}）" }
              ]
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Form.Item,
            {
              name: "fileNameTemplate",
              label: "文件名",
              tooltip: "不含扩展名时按格式自动补全；支持 {{contextKey}}",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { placeholder: "例如 report 或 {{workflowTitle}}" })
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Form.Item,
            {
              name: "contentTemplate",
              label: "写入内容",
              rules: [{ required: true, message: "请填写内容模板" }],
              tooltip: "支持 {{contextKey}} 引用上游 outputKeys；file 格式填源文件路径",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input.TextArea, { rows: 4, placeholder: "{{summary}}" })
            }
          )
        ] }),
        type === "notify" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Form.Item,
            {
              name: "targets",
              label: "通知方式",
              rules: [
                {
                  validator: async (_, value) => {
                    const list = value ?? [];
                    if (!list.includes("channel") && !list.includes("toast")) {
                      throw new Error("请至少选择一种通知方式");
                    }
                  }
                }
              ],
              initialValue: ["channel", "toast"],
              tooltip: "可同时推送到渠道与应用内 Toast",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                Checkbox.Group,
                {
                  options: [
                    { value: "channel", label: "渠道推送" },
                    { value: "toast", label: "应用内 Toast" }
                  ]
                }
              )
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Form.Item,
            {
              name: "contentTemplate",
              label: "通知内容",
              rules: [
                {
                  validator: async (_, value) => {
                    if (!wantsNotifyChannel) {
                      if (!String(value ?? "").trim()) throw new Error("请填写通知内容");
                      return;
                    }
                    const mt = form2.getFieldValue("msgType") ?? queryFeishuMsgType({ channelId: form2.getFieldValue("channelId") });
                    if (mt === "image" || mt === "share_chat") return;
                    if (!String(value ?? "").trim()) throw new Error("请填写通知内容");
                  }
                }
              ],
              tooltip: "支持 {{contextKey}} 插值；渠道为图片/群名片时可留空",
              initialValue: "{{summary}}",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input.TextArea, { rows: 4, placeholder: "{{summary}}" })
            }
          ),
          wantsNotifyToast ? /* @__PURE__ */ jsxRuntimeExports.jsx(Form.Item, { name: "toastLevel", label: "Toast 级别", initialValue: "info", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            Select,
            {
              options: [
                { value: "success", label: "成功" },
                { value: "info", label: "信息" },
                { value: "warning", label: "警告" },
                { value: "error", label: "错误" }
              ]
            }
          ) }) : null,
          wantsNotifyChannel ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Form.Item,
              {
                name: "channelId",
                label: "通知渠道",
                rules: [{ required: true, message: "请选择渠道" }],
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Select,
                  {
                    placeholder: "选择已启用的通知渠道",
                    options: notifyChannelOptions,
                    notFoundContent: "请先在设置 → 渠道中配置并启用通知渠道"
                  }
                )
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Form.Item,
              {
                name: "titleTemplate",
                label: "推送标题",
                tooltip: "支持 {{contextKey}} 引用上游节点 outputKeys 写入的字段",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { placeholder: "例如：{{workflowTitle}}" })
              }
            ),
            notifyChannelId === "feishu" ? /* @__PURE__ */ jsxRuntimeExports.jsx(
              Form.Item,
              {
                name: "msgType",
                label: "飞书通知类型",
                tooltip: "对应飞书自定义机器人 msg_type",
                initialValue: "post",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Select,
                  {
                    options: [
                      { value: "text", label: "文本" },
                      { value: "post", label: "富文本（Markdown）" },
                      { value: "image", label: "图片消息" },
                      { value: "share_chat", label: "群名片" }
                    ]
                  }
                )
              }
            ) : null,
            notifyChannelId === "feishu" && notifyMsgType === "image" ? /* @__PURE__ */ jsxRuntimeExports.jsx(
              Form.Item,
              {
                name: "imageKey",
                label: "image_key",
                tooltip: "飞书图片上传 API 返回的 key；可留空以使用设置 → 渠道中的默认配置",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { placeholder: "img_xxx 或留空使用渠道配置" })
              }
            ) : null,
            notifyChannelId === "feishu" && notifyMsgType === "share_chat" ? /* @__PURE__ */ jsxRuntimeExports.jsx(
              Form.Item,
              {
                name: "shareChatId",
                label: "share_chat_id",
                tooltip: "群 ID；可留空以使用设置 → 渠道中的默认配置",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { placeholder: "oc_xxx 或留空使用渠道配置" })
              }
            ) : null,
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Form.Item,
              {
                name: "failSoft",
                label: "失败时继续",
                valuePropName: "checked",
                tooltip: "开启后渠道发送失败不阻断流程",
                initialValue: true,
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(Switch, {})
              }
            )
          ] }) : null
        ] }),
        type === "parallel" && /* @__PURE__ */ jsxRuntimeExports.jsx(Typography.Paragraph, { type: "secondary", style: { marginBottom: 0 }, children: "保存后可在并行组内添加子步骤（仅叶子）。组内全是「工具」时并发执行；含 Agent/确认时串行，避免同会话 ReAct 交错。" })
      ] })
    }
  );
}
function WorkflowEdgeEditModal({
  open,
  edge,
  isFullscreen = false,
  fullscreenContainer = null,
  onCancel,
  onOk
}) {
  const [form2] = Form.useForm();
  const isDefault = Form.useWatch("isDefault", form2);
  const useAdvanced = Form.useWatch("useAdvancedExpression", form2);
  const op = Form.useWatch("op", form2);
  reactExports.useEffect(() => {
    if (!open || !edge) return;
    const when = edge.when;
    form2.setFieldsValue({
      label: edge.label ?? "",
      isDefault: Boolean(edge.isDefault),
      useAdvancedExpression: Boolean(when?.expression?.trim()),
      expression: when?.expression ?? "",
      contextKey: when?.contextKey ?? "",
      op: when?.op ?? "truthy",
      value: when?.value != null ? String(when.value) : ""
    });
  }, [open, edge, form2]);
  const handleOk = async () => {
    try {
      const values = await form2.validateFields();
      if (values.isDefault) {
        onOk({
          label: values.label?.trim() || "默认",
          isDefault: true,
          when: void 0
        });
        return;
      }
      let when;
      if (values.useAdvancedExpression) {
        const expression = (values.expression ?? "").trim();
        if (!expression) {
          appMessage.error("请填写表达式，或勾选「默认边」");
          return;
        }
        when = { expression };
      } else if ((values.contextKey ?? "").trim()) {
        when = {
          contextKey: values.contextKey.trim(),
          op: values.op ?? "truthy",
          value: values.op === "eq" || values.op === "neq" ? (values.value ?? "").trim() : void 0
        };
      } else {
        onOk({
          label: values.label?.trim() || void 0,
          isDefault: false,
          when: void 0
        });
        return;
      }
      onOk({
        label: values.label?.trim() || void 0,
        isDefault: false,
        when
      });
    } catch {
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Modal,
    {
      title: "编辑连线",
      open,
      onCancel,
      onOk: () => void handleOk(),
      okText: "保存",
      cancelText: "取消",
      destroyOnHidden: true,
      width: 480,
      getContainer: isFullscreen && fullscreenContainer ? () => fullscreenContainer : void 0,
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Form, { form: form2, layout: "vertical", style: { marginTop: 12 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Form.Item, { name: "label", label: "标签", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { placeholder: "边上显示的文字，可选" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Form.Item,
          {
            name: "isDefault",
            label: "默认边（else）",
            valuePropName: "checked",
            tooltip: "无其它条件命中时走这条；同一源最多一条",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(Switch, {})
          }
        ),
        !isDefault && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Form.Item,
            {
              name: "useAdvancedExpression",
              label: "高级表达式",
              valuePropName: "checked",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(Switch, {})
            }
          ),
          useAdvanced ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            Form.Item,
            {
              name: "expression",
              label: "表达式",
              extra: '示例：context.status == "ok"；留空则清除条件',
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input.TextArea, { rows: 3, placeholder: "context.ok == true" })
            }
          ) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Form.Item,
              {
                name: "contextKey",
                label: "Context 字段",
                extra: "留空则清除条件（无条件连线）",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { placeholder: "例如 ok / status" })
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Form.Item, { name: "op", label: "运算符", initialValue: "truthy", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              Select,
              {
                options: [
                  { value: "truthy", label: "为真" },
                  { value: "falsy", label: "为假" },
                  { value: "eq", label: "等于" },
                  { value: "neq", label: "不等于" }
                ]
              }
            ) }),
            (op === "eq" || op === "neq") && /* @__PURE__ */ jsxRuntimeExports.jsx(Form.Item, { name: "value", label: "比较值", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, {}) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Typography.Paragraph, { type: "secondary", style: { marginBottom: 0 }, children: "同一节点上：全部无条件多出线 = 并行；任一带条件/默认 = 条件分支（只走一路）。" })
      ] })
    }
  );
}
const wrap = "_wrap_fj3kl_1";
const errorBar = "_errorBar_fj3kl_12";
const canvas = "_canvas_fj3kl_21";
const styles$2 = {
  wrap,
  errorBar,
  canvas
};
const nodeTypes = {
  workflow: WorkflowFlowNode,
  workflowTerminal: WorkflowTerminalFlowNode
};
function queryEdgeLabel(e) {
  if (e.label?.trim()) return e.label.trim();
  if (e.isDefault) return "默认";
  if (e.when?.expression?.trim()) return e.when.expression.trim();
  if (e.when?.contextKey) {
    return `${e.when.contextKey}${e.when.op ? ` ${e.when.op}` : ""}`;
  }
  return void 0;
}
function edgeHasCondition(e) {
  if (e.isDefault) return true;
  return Boolean(e.when?.expression?.trim() || e.when?.contextKey?.trim());
}
function queryEdgeShouldAnimate(edge, activeNodeIds, nodeStatuses = {}) {
  const active = new Set(activeNodeIds);
  if (!active.has(edge.target)) return false;
  const data = edge.data ?? {};
  if (data.isDefault) return false;
  if (nodeStatuses[edge.source] === "skipped") return false;
  return true;
}
function toRfNodes(leaves, terminals, canvas2, handlers, nodeStatuses = {}) {
  const leafNodes = leaves.map((leaf) => ({
    id: leaf.id,
    type: "workflow",
    position: canvas2.positions[leaf.id] ?? { x: 80, y: 80 },
    data: {
      leaf,
      execStatus: nodeStatuses[leaf.id],
      onEdit: handlers.onEdit,
      onDelete: handlers.onDelete
    }
  }));
  const terminalNodes = terminals.map((terminal) => ({
    id: terminal.id,
    type: "workflowTerminal",
    position: canvas2.positions[terminal.id] ?? {
      x: 80,
      y: terminal.type === "start" ? 24 : 280
    },
    deletable: false,
    data: { terminal }
  }));
  return [...terminalNodes, ...leafNodes];
}
function toRfEdges(canvas2, activeNodeIds = [], nodeStatuses = {}) {
  return canvas2.edges.map((e) => {
    const label = queryEdgeLabel(e);
    const conditional = edgeHasCondition(e);
    const shouldAnimate = queryEdgeShouldAnimate(e, activeNodeIds, nodeStatuses);
    return {
      id: e.id,
      source: e.source,
      target: e.target,
      label,
      // 默认静止；仅命中支路且目标节点执行中时流动
      animated: shouldAnimate,
      className: [
        conditional ? "wf-edge-conditional" : "wf-edge-default",
        shouldAnimate ? "wf-edge-executing" : ""
      ].filter(Boolean).join(" "),
      markerEnd: { type: MarkerType.ArrowClosed, width: 8, height: 8 },
      style: {
        strokeWidth: shouldAnimate ? 2 : 1,
        strokeDasharray: "4 3"
      },
      labelStyle: { fontSize: 6, fill: "var(--db-text-secondary)" },
      data: {
        label: e.label,
        when: e.when,
        isDefault: e.isDefault
      }
    };
  });
}
function queryLeavesFromRf(rfNodes) {
  return rfNodes.filter((n) => n.type === "workflow").map((n) => n.data.leaf);
}
function queryTerminalsFromRf(rfNodes) {
  return rfNodes.filter((n) => n.type === "workflowTerminal").map((n) => n.data.terminal);
}
function queryCanvasFromRf(rfNodes, edges) {
  const positions = {};
  for (const n of rfNodes) {
    positions[n.id] = { x: n.position.x, y: n.position.y };
  }
  return {
    positions,
    edges: edges.map((e) => {
      const data = e.data ?? {};
      const edge = {
        id: e.id,
        source: e.source,
        target: e.target
      };
      if (data.label) edge.label = data.label;
      if (data.when) edge.when = data.when;
      if (data.isDefault) edge.isDefault = true;
      return edge;
    })
  };
}
function queryEdgeStyle(conditional = false) {
  return {
    animated: false,
    className: conditional ? "wf-edge-conditional" : "wf-edge-default",
    markerEnd: { type: MarkerType.ArrowClosed, width: 8, height: 8 },
    style: {
      strokeWidth: 1,
      strokeDasharray: "4 3"
    },
    labelStyle: { fontSize: 6, fill: "var(--db-text-secondary)" }
  };
}
function queryPositionBesideStart(rfNodes) {
  const start2 = rfNodes.find(
    (n) => n.type === "workflowTerminal" && n.data.terminal.type === "start"
  );
  const baseX = (start2?.position.x ?? 80) + 200;
  const baseY = start2?.position.y ?? 40;
  const nearbyCount = rfNodes.filter(
    (n) => n.type === "workflow" && Math.abs(n.position.x - baseX) < 48
  ).length;
  return { x: baseX, y: baseY + nearbyCount * 72 };
}
const WorkflowCanvas = reactExports.forwardRef(
  function WorkflowCanvas2({
    workflowId,
    nodes: engineNodes,
    canvas: canvasProp,
    onChange,
    isFullscreen = false,
    fullscreenContainer = null,
    activeNodeIds = [],
    nodeStatuses = {}
  }, ref) {
    const [editOpen, setEditOpen] = reactExports.useState(false);
    const [editingLeaf, setEditingLeaf] = reactExports.useState(null);
    const [upstreamOutputKeys, setUpstreamOutputKeys] = reactExports.useState([]);
    const [edgeEditOpen, setEdgeEditOpen] = reactExports.useState(false);
    const [editingEdge, setEditingEdge] = reactExports.useState(null);
    const [graphError, setGraphError] = reactExports.useState(null);
    const engineNodesRef = reactExports.useRef(engineNodes);
    engineNodesRef.current = engineNodes;
    const onEditRef = reactExports.useRef(() => {
    });
    const onDeleteRef = reactExports.useRef(() => {
    });
    const initialCanvas = resolveWorkflowCanvas(engineNodes, canvasProp);
    const [rfNodes, setNodes, onNodesChangeInternal] = useNodesState(
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
    );
    const [rfEdges, setEdges, onEdgesChangeInternal] = useEdgesState(
      toRfEdges(initialCanvas, activeNodeIds, nodeStatuses)
    );
    reactExports.useEffect(() => {
      setEdges(
        (eds) => eds.map((e) => {
          const shouldAnimate = queryEdgeShouldAnimate(e, activeNodeIds, nodeStatuses);
          const baseClass = e.className?.includes("wf-edge-conditional") ? "wf-edge-conditional" : "wf-edge-default";
          const nextClass = shouldAnimate ? `${baseClass} wf-edge-executing` : baseClass;
          if (e.animated === shouldAnimate && e.className === nextClass) return e;
          return {
            ...e,
            animated: shouldAnimate,
            className: nextClass,
            style: {
              ...e.style,
              strokeWidth: shouldAnimate ? 2 : 1
            }
          };
        })
      );
    }, [activeNodeIds, nodeStatuses, setEdges]);
    reactExports.useEffect(() => {
      setNodes(
        (ns) => ns.map((n) => {
          if (n.type !== "workflow") return n;
          const nextStatus = nodeStatuses[n.id];
          const prevStatus = n.data.execStatus;
          if (prevStatus === nextStatus) return n;
          return {
            ...n,
            data: {
              ...n.data,
              execStatus: nextStatus
            }
          };
        })
      );
    }, [nodeStatuses, setNodes]);
    const emitChange = reactExports.useCallback(
      (nextNodes, nextEdges) => {
        const leaves = queryLeavesFromRf(nextNodes);
        const terminals = queryTerminalsFromRf(nextNodes);
        const canvas2 = queryCanvasFromRf(nextNodes, nextEdges);
        const applied = applyCanvasToDefinition(leaves, terminals, canvas2);
        if (applied.error) {
          setGraphError(applied.error);
          onChange({ nodes: engineNodesRef.current, canvas: canvas2 });
          return;
        }
        setGraphError(null);
        onChange({ nodes: applied.nodes, canvas: applied.canvas });
      },
      [onChange]
    );
    onEditRef.current = (id) => {
      const leaves = queryLeavesFromRf(rfNodes).length > 0 ? queryLeavesFromRf(rfNodes) : flattenWorkflowLeaves(engineNodesRef.current);
      const leaf = leaves.find((l) => l.id === id) ?? null;
      if (!leaf) return;
      const canvas2 = queryCanvasFromRf(rfNodes, rfEdges);
      setUpstreamOutputKeys(queryUpstreamOutputKeys(leaves, canvas2, id));
      setEditingLeaf(leaf);
      setEditOpen(true);
    };
    onDeleteRef.current = (id) => {
      const term = queryTerminalsFromRf(rfNodes).find((t) => t.id === id);
      if (term) {
        appMessage.warning("开始/结束节点不可删除");
        return;
      }
      setNodes((prev) => {
        const nextNodes = prev.filter((n) => n.id !== id);
        setEdges((eds) => {
          const nextEdges = eds.filter((e) => e.source !== id && e.target !== id);
          queueMicrotask(() => emitChange(nextNodes, nextEdges));
          return nextEdges;
        });
        return nextNodes;
      });
    };
    reactExports.useEffect(() => {
      const canvas2 = resolveWorkflowCanvas(engineNodes, canvasProp);
      setNodes(
        toRfNodes(
          flattenWorkflowLeaves(engineNodes),
          flattenWorkflowTerminals(engineNodes),
          canvas2,
          {
            onEdit: (id) => onEditRef.current(id),
            onDelete: (id) => onDeleteRef.current(id)
          },
          nodeStatuses
        )
      );
      setEdges(toRfEdges(canvas2, activeNodeIds, nodeStatuses));
      setGraphError(null);
    }, [workflowId]);
    const onNodesChange = reactExports.useCallback(
      (changes) => {
        const filtered = changes.filter((c) => {
          if (c.type !== "remove") return true;
          const n = rfNodes.find((x) => x.id === c.id);
          return n?.type !== "workflowTerminal";
        });
        if (filtered.length !== changes.length) {
          appMessage.warning("开始/结束节点不可删除");
        }
        onNodesChangeInternal(filtered);
        const shouldPersist = filtered.some(
          (c) => c.type === "position" && "dragging" in c && c.dragging === false || c.type === "remove"
        );
        if (!shouldPersist) return;
        queueMicrotask(() => {
          setNodes((ns) => {
            setEdges((es) => {
              emitChange(ns, es);
              return es;
            });
            return ns;
          });
        });
      },
      [onNodesChangeInternal, emitChange, setNodes, setEdges, rfNodes]
    );
    const onEdgesChange = reactExports.useCallback(
      (changes) => {
        onEdgesChangeInternal(changes);
        if (!changes.some((c) => c.type === "remove" || c.type === "add")) return;
        queueMicrotask(() => {
          setNodes((ns) => {
            setEdges((es) => {
              emitChange(ns, es);
              return es;
            });
            return ns;
          });
        });
      },
      [onEdgesChangeInternal, emitChange, setNodes, setEdges]
    );
    const onConnect = reactExports.useCallback(
      (connection) => {
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
            );
            queueMicrotask(() => emitChange(ns, next));
            return next;
          });
          return ns;
        });
      },
      [setEdges, setNodes, emitChange]
    );
    const onEdgeDoubleClick = reactExports.useCallback(
      (_, edge) => {
        const data = edge.data ?? {};
        setEditingEdge({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          label: data.label,
          when: data.when,
          isDefault: data.isDefault
        });
        setEdgeEditOpen(true);
      },
      []
    );
    const handleEdgeEditOk = (patch) => {
      if (!editingEdge) return;
      setEdges((eds) => {
        const next = eds.map((e) => {
          if (e.id !== editingEdge.id) return e;
          const data = {
            label: patch.label,
            when: patch.when,
            isDefault: patch.isDefault
          };
          const model = {
            id: e.id,
            source: e.source,
            target: e.target,
            ...data
          };
          const label = queryEdgeLabel(model);
          const conditional = edgeHasCondition(model);
          return {
            ...e,
            label,
            data,
            ...queryEdgeStyle(conditional)
          };
        });
        queueMicrotask(() => {
          setNodes((ns) => {
            emitChange(ns, next);
            return ns;
          });
        });
        return next;
      });
      setEdgeEditOpen(false);
      setEditingEdge(null);
    };
    const addLeaf = reactExports.useCallback(
      (leaf) => {
        setNodes((ns) => {
          const rfNode = {
            id: leaf.id,
            type: "workflow",
            position: queryPositionBesideStart(ns),
            data: {
              leaf,
              onEdit: (id) => onEditRef.current(id),
              onDelete: (id) => onDeleteRef.current(id)
            }
          };
          const next = [...ns, rfNode];
          queueMicrotask(() => emitChange(next, rfEdges));
          return next;
        });
      },
      [rfEdges, setNodes, emitChange]
    );
    reactExports.useImperativeHandle(
      ref,
      () => ({
        addLeafByType: (type) => {
          addLeaf(createEmptyNode(type));
        }
      }),
      [addLeaf]
    );
    const handleEditOk = (node2) => {
      if (node2.type === "parallel" || node2.type === "condition" || node2.type === "start" || node2.type === "end") {
        appMessage.error("画布请添加步骤节点；并行/条件请用连线表达");
        return;
      }
      setNodes((ns) => {
        const exists = ns.some((n) => n.id === node2.id && n.type === "workflow");
        const next = exists ? ns.map(
          (n) => n.id === node2.id && n.type === "workflow" ? { ...n, data: { ...n.data, leaf: node2 } } : n
        ) : [
          ...ns,
          {
            id: node2.id,
            type: "workflow",
            position: queryPositionBesideStart(ns),
            data: {
              leaf: node2,
              onEdit: (id) => onEditRef.current(id),
              onDelete: (id) => onDeleteRef.current(id)
            }
          }
        ];
        queueMicrotask(() => emitChange(next, rfEdges));
        return next;
      });
      setEditOpen(false);
      setEditingLeaf(null);
      setUpstreamOutputKeys([]);
    };
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$2.wrap, children: [
      graphError ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$2.errorBar, children: [
        "连线未完成编译：",
        graphError
      ] }) : null,
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$2.canvas, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
        index,
        {
          nodes: rfNodes,
          edges: rfEdges,
          onNodesChange,
          onEdgesChange,
          onConnect,
          onEdgeDoubleClick,
          nodeTypes,
          fitView: true,
          deleteKeyCode: ["Backspace", "Delete"],
          proOptions: { hideAttribution: true },
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Background, { gap: 16, size: 1 }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Controls, {})
          ]
        }
      ) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        WorkflowNodeEditModal,
        {
          open: editOpen,
          node: editingLeaf,
          leafOnly: true,
          upstreamOutputKeys,
          isFullscreen,
          fullscreenContainer,
          onCancel: () => {
            setEditOpen(false);
            setEditingLeaf(null);
            setUpstreamOutputKeys([]);
          },
          onOk: handleEditOk
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        WorkflowEdgeEditModal,
        {
          open: edgeEditOpen,
          edge: editingEdge,
          isFullscreen,
          fullscreenContainer,
          onCancel: () => {
            setEdgeEditOpen(false);
            setEditingEdge(null);
          },
          onOk: handleEdgeEditOk
        }
      )
    ] });
  }
);
const drawer = "_drawer_1cumc_3";
const titleRow = "_titleRow_1cumc_13";
const drawerTitle = "_drawerTitle_1cumc_20";
const countBadge = "_countBadge_1cumc_29";
const detailBody = "_detailBody_1cumc_44";
const detailHeader = "_detailHeader_1cumc_67";
const headerMeta = "_headerMeta_1cumc_80";
const detailId = "_detailId_1cumc_85";
const detailTags = "_detailTags_1cumc_95";
const nameTag = "_nameTag_1cumc_103";
const description = "_description_1cumc_109";
const canvasPanel = "_canvasPanel_1cumc_134";
const canvasPanelHead = "_canvasPanelHead_1cumc_147";
const canvasPanelIcon = "_canvasPanelIcon_1cumc_156";
const canvasPanelText = "_canvasPanelText_1cumc_169";
const canvasPanelTitle = "_canvasPanelTitle_1cumc_174";
const canvasPanelDesc = "_canvasPanelDesc_1cumc_180";
const canvasPanelActions = "_canvasPanelActions_1cumc_187";
const fullscreenBtn = "_fullscreenBtn_1cumc_195";
const drawerBody = "_drawerBody_1cumc_216";
const styles$1 = {
  drawer,
  titleRow,
  drawerTitle,
  countBadge,
  detailBody,
  detailHeader,
  headerMeta,
  detailId,
  detailTags,
  nameTag,
  description,
  canvasPanel,
  canvasPanelHead,
  canvasPanelIcon,
  canvasPanelText,
  canvasPanelTitle,
  canvasPanelDesc,
  canvasPanelActions,
  fullscreenBtn,
  drawerBody
};
const ADD_NODE_MENU_TYPES = [
  { key: "input", label: "输入节点" },
  { key: "output", label: "输出节点" },
  { key: "agent", label: "Agent 步骤" },
  { key: "tool", label: "工具步骤" },
  { key: "notify", label: "通知" },
  { key: "await_user", label: "等待确认" }
];
function WorkflowCanvasDrawer({
  open,
  draft,
  saving,
  running,
  activeNodeIds = [],
  nodeStatuses = {},
  onClose,
  onCanvasChange,
  onSave,
  onRun
}) {
  const canvasPanelRef = reactExports.useRef(null);
  const canvasRef = reactExports.useRef(null);
  const { isFullscreen, toggleFullscreen, exitFullscreen } = useElementFullscreen(canvasPanelRef);
  const stepCount = draft ? flattenWorkflowLeaves(draft.nodes).length : 0;
  const isPublish = draft?.templateKind === "publish";
  const handleClose = () => {
    if (isFullscreen) {
      void exitFullscreen().finally(() => onClose());
      return;
    }
    onClose();
  };
  const addMenu = ADD_NODE_MENU_TYPES.map(({ key, label }) => ({
    key,
    label,
    onClick: () => canvasRef.current?.addLeafByType(key)
  }));
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Drawer,
    {
      title: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$1.titleRow, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$1.drawerTitle, children: "流程画布" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$1.countBadge, children: stepCount })
      ] }),
      placement: "right",
      width: "80vw",
      open,
      onClose: handleClose,
      closable: true,
      closeIcon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$a, {}),
      destroyOnHidden: true,
      zIndex: 1200,
      className: styles$1.drawer,
      styles: {
        body: {
          padding: 0,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden"
        }
      },
      children: draft ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$1.detailBody, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$1.detailHeader, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$1.headerMeta, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: styles$1.detailId, children: draft.id }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$1.detailTags, children: [
              isPublish ? /* @__PURE__ */ jsxRuntimeExports.jsx(Tag, { color: DB_THEME.primary, children: "发布" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Tag, { children: "通用" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Tag, { children: [
                stepCount,
                " 步"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Tag, { className: styles$1.nameTag, children: draft.title || "未命名流程" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Space, { wrap: true, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: onSave, loading: saving, children: "保存" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                type: "primary",
                icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$6, {}),
                loading: running || saving,
                disabled: !draft.nodes.length,
                onClick: onRun,
                children: "立即运行"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: styles$1.description, children: "流程从「开始」到「结束」。单击节点可编辑；连线默认为虚线，双击可设条件。" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$1.canvasPanel, ref: canvasPanelRef, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$1.canvasPanelHead, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$1.canvasPanelIcon, children: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon, {}) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$1.canvasPanelText, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$1.canvasPanelTitle, children: "画布编辑区" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$1.canvasPanelDesc, children: stepCount > 0 ? `当前 ${stepCount} 个步骤，拖拽与连线后记得保存` : "尚未配置步骤，从空白画布开始添加节点" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$1.canvasPanelActions, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Dropdown,
                {
                  menu: { items: addMenu },
                  getPopupContainer: isFullscreen && canvasPanelRef.current ? () => canvasPanelRef.current : void 0,
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "primary", size: "small", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$8, {}), children: "添加节点" })
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  type: "text",
                  className: styles$1.fullscreenBtn,
                  icon: isFullscreen ? /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$1, {}) : /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$9, {}),
                  title: isFullscreen ? "退出全屏" : "全屏",
                  "aria-label": isFullscreen ? "退出全屏" : "全屏",
                  onClick: () => void toggleFullscreen()
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$1.drawerBody, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            WorkflowCanvas,
            {
              ref: canvasRef,
              workflowId: draft.id,
              nodes: draft.nodes,
              canvas: draft.canvas,
              onChange: onCanvasChange,
              isFullscreen,
              fullscreenContainer: isFullscreen ? canvasPanelRef.current : null,
              activeNodeIds,
              nodeStatuses
            }
          ) })
        ] })
      ] }) : null
    }
  );
}
const searchInput = "_searchInput_nuau4_3";
const sortSelect = "_sortSelect_nuau4_7";
const empty = "_empty_nuau4_11";
const styles = {
  searchInput,
  sortSelect,
  empty
};
function queryActiveNodeIdsFromTasks(tasks) {
  return tasks.filter((t) => t.status === "running").map((t) => t.id);
}
function queryNodeStatusesFromTasks(tasks) {
  const map = {};
  for (const t of tasks) {
    map[t.id] = t.status;
  }
  return map;
}
function matchWorkflowQuery(wf, query) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return wf.title.toLowerCase().includes(q) || wf.description.toLowerCase().includes(q) || wf.id.toLowerCase().includes(q);
}
function sortWorkflows(list, sort) {
  const next = [...list];
  if (sort === "name_asc") return next.sort((a, b) => a.title.localeCompare(b.title, "zh-CN"));
  if (sort === "name_desc") return next.sort((a, b) => b.title.localeCompare(a.title, "zh-CN"));
  return next.sort((a, b) => b.updatedAt - a.updatedAt);
}
function WorkflowsPage() {
  const workflows = useWorkflowsStore((s) => s.workflows);
  const loading = useWorkflowsStore((s) => s.loading);
  const running = useWorkflowsStore((s) => s.running);
  const hydrate = useWorkflowsStore((s) => s.hydrate);
  const createDraft = useWorkflowsStore((s) => s.createDraft);
  const saveWorkflow = useWorkflowsStore((s) => s.saveWorkflow);
  const removeWorkflow = useWorkflowsStore((s) => s.removeWorkflow);
  const runWorkflow = useWorkflowsStore((s) => s.runWorkflow);
  const beginExternalRun = useSessionStore((s) => s.beginExternalRun);
  const hydrateSessions = useSessionStore((s) => s.hydrate);
  const setView = useAppStore((s) => s.setView);
  const [kind, setKind] = reactExports.useState("all");
  const [search, setSearch] = reactExports.useState("");
  const [sort, setSort] = reactExports.useState("updated_desc");
  const [detailOpen, setDetailOpen] = reactExports.useState(false);
  const [canvasDrawerOpen, setCanvasDrawerOpen] = reactExports.useState(false);
  const [draft, setDraft] = reactExports.useState(null);
  const [saving, setSaving] = reactExports.useState(false);
  const [canvasRunSessionId, setCanvasRunSessionId] = reactExports.useState(null);
  const [canvasActiveNodeIds, setCanvasActiveNodeIds] = reactExports.useState([]);
  const [canvasNodeStatuses, setCanvasNodeStatuses] = reactExports.useState({});
  reactExports.useEffect(() => {
    void hydrate();
  }, [hydrate]);
  reactExports.useEffect(() => {
    if (!canvasRunSessionId) return;
    const unbind = window.api.onAgentEvent((event) => {
      if (event.sessionId !== canvasRunSessionId) return;
      if (event.type === "task_update") {
        setCanvasActiveNodeIds(queryActiveNodeIdsFromTasks(event.tasks));
        setCanvasNodeStatuses(queryNodeStatusesFromTasks(event.tasks));
        return;
      }
      if (event.type === "done") {
        setCanvasActiveNodeIds([]);
        setCanvasRunSessionId(null);
        if (event.reason === "workflow_success") {
          appMessage.success("流程执行完成");
        } else if (event.reason === "aborted") {
          appMessage.warning("流程已中止");
        }
        return;
      }
      if (event.type === "error") {
        setCanvasActiveNodeIds([]);
        setCanvasRunSessionId(null);
        appMessage.error(event.message || "流程执行失败");
      }
    });
    return unbind;
  }, [canvasRunSessionId]);
  const filtered = reactExports.useMemo(() => {
    let list = workflows;
    if (kind === "generic") list = list.filter((w) => w.templateKind === "generic");
    if (kind === "publish") list = list.filter((w) => w.templateKind === "publish");
    list = list.filter((w) => matchWorkflowQuery(w, search));
    return sortWorkflows(list, sort);
  }, [workflows, kind, search, sort]);
  const cloneDraft = (wf) => ({
    ...wf,
    nodes: [...wf.nodes],
    canvas: wf.canvas ? {
      positions: { ...wf.canvas.positions },
      edges: [...wf.canvas.edges]
    } : void 0
  });
  const openDetail = (id) => {
    const wf = workflows.find((w) => w.id === id);
    if (!wf) return;
    setDraft(cloneDraft(wf));
    setDetailOpen(true);
  };
  const openWorkflowCanvas = (id) => {
    const wf = workflows.find((w) => w.id === id);
    if (!wf) return;
    setDraft(cloneDraft(wf));
    setDetailOpen(false);
    setCanvasDrawerOpen(true);
  };
  const closeDetail = () => {
    setDetailOpen(false);
    setCanvasDrawerOpen(false);
    setDraft(null);
    setCanvasActiveNodeIds([]);
    setCanvasNodeStatuses({});
    setCanvasRunSessionId(null);
  };
  const openCanvasDrawer = () => {
    if (!draft) return;
    setCanvasDrawerOpen(true);
  };
  const closeCanvasDrawer = () => {
    setCanvasDrawerOpen(false);
    setCanvasActiveNodeIds([]);
    setCanvasNodeStatuses({});
    setCanvasRunSessionId(null);
  };
  const patchDraft = (patch) => {
    setDraft((prev) => prev ? { ...prev, ...patch } : prev);
  };
  const handleCanvasChange = (next) => {
    patchDraft({ nodes: next.nodes, canvas: next.canvas });
  };
  const handleCreate = async () => {
    try {
      const created = await createDraft();
      setDraft(cloneDraft(created));
      setDetailOpen(true);
      appMessage.success("已创建，可在弹窗中完善信息并编排画布");
    } catch (err) {
      appMessage.error(err instanceof Error ? err.message : "创建失败");
    }
  };
  const handleSave = async () => {
    if (!draft) return;
    if (!draft.title.trim()) {
      appMessage.warning("请填写流程标题");
      return;
    }
    setSaving(true);
    try {
      const saved = await saveWorkflow(draft);
      setDraft(cloneDraft(saved));
      appMessage.success("流程已保存");
      closeDetail();
    } catch (err) {
      appMessage.error(err instanceof Error ? err.message : "保存失败");
    } finally {
      setSaving(false);
    }
  };
  const handleDelete = async (id) => {
    try {
      await removeWorkflow(id);
      if (draft?.id === id) closeDetail();
      appMessage.success("已删除");
    } catch (err) {
      appMessage.error(err instanceof Error ? err.message : "删除失败");
    }
  };
  const handleRun = async (workflowId, options) => {
    const id = draft?.id;
    if (!id) return;
    const stayOnCanvas = Boolean(options?.stayOnCanvas);
    setSaving(true);
    try {
      let targetId = id;
      if (draft && draft.id === id) {
        if (!draft.nodes.length) {
          appMessage.warning("请先添加步骤再运行");
          return;
        }
        if (!draft.title.trim()) {
          appMessage.warning("请填写流程标题");
          return;
        }
        const saved = await saveWorkflow(draft);
        setDraft(cloneDraft(saved));
        targetId = saved.id;
      } else {
        const wf = workflows.find((w) => w.id === id);
        if (!wf?.nodes.length) {
          appMessage.warning("请先添加步骤再运行");
          return;
        }
      }
      const sessionId = await runWorkflow(targetId, { silent: stayOnCanvas });
      if (stayOnCanvas) {
        setCanvasRunSessionId(sessionId);
        setCanvasActiveNodeIds([]);
        setCanvasNodeStatuses({});
        appMessage.success("流程已启动，可在画布查看执行动画");
        return;
      }
      await hydrateSessions();
      beginExternalRun(sessionId);
      closeDetail();
      setView("chat");
      appMessage.success("流程已启动，已跳转到会话");
    } catch (err) {
      appMessage.error(err instanceof Error ? err.message : "启动失败");
    } finally {
      setSaving(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(FeaturePageShell, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      FeaturePageHeader,
      {
        icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$5, {}),
        title: "流程",
        badge: workflows.length,
        description: "卡片浏览流程，点击查看详情；在画布中拖拽连线编排并运行",
        extra: /* @__PURE__ */ jsxRuntimeExports.jsxs(Space, { wrap: true, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$b, {}),
              onClick: async () => {
                await hydrate();
                appMessage.success("已刷新");
              },
              children: "刷新"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "primary", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$8, {}), onClick: () => void handleCreate(), children: "新建流程" })
        ] })
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(FeaturePageToolbar, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Segmented,
        {
          value: kind,
          onChange: (v) => setKind(v),
          options: [
            { label: "全部", value: "all" },
            { label: "通用", value: "generic" },
            { label: "发布", value: "publish" }
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: shellStyles.toolbarRight, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: shellStyles.resultCount, children: [
          filtered.length,
          " 项"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            allowClear: true,
            prefix: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$c, {}),
            placeholder: "搜索流程...",
            value: search,
            onChange: (e) => setSearch(e.target.value),
            className: styles.searchInput
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Select,
          {
            value: sort,
            onChange: setSort,
            className: styles.sortSelect,
            options: [
              { label: "最近更新", value: "updated_desc" },
              { label: "名称 A→Z", value: "name_asc" },
              { label: "名称 Z→A", value: "name_desc" }
            ]
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(FeatureScrollBody, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Spin, { spinning: loading && workflows.length === 0, children: filtered.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(
      Empty,
      {
        image: Empty.PRESENTED_IMAGE_SIMPLE,
        description: workflows.length === 0 ? "暂无流程" : "暂无匹配的流程",
        className: styles.empty,
        children: workflows.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "primary", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$8, {}), onClick: () => void handleCreate(), children: "新建流程" }) : null
      }
    ) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cardStyles.grid, children: filtered.map((wf, index2) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      WorkflowCard,
      {
        workflow: wf,
        index: index2,
        onView: openDetail,
        onEdit: openWorkflowCanvas
      },
      wf.id
    )) }) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      WorkflowDetailModal,
      {
        open: detailOpen,
        draft,
        saving,
        running,
        onClose: closeDetail,
        onPatch: patchDraft,
        onOpenCanvas: openCanvasDrawer,
        onSave: () => void handleSave(),
        onRun: () => void handleRun(),
        onDelete: (id) => void handleDelete(id)
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      WorkflowCanvasDrawer,
      {
        open: canvasDrawerOpen,
        draft,
        saving,
        running: running || Boolean(canvasRunSessionId),
        activeNodeIds: canvasActiveNodeIds,
        nodeStatuses: canvasNodeStatuses,
        onClose: closeCanvasDrawer,
        onCanvasChange: handleCanvasChange,
        onSave: () => void handleSave(),
        onRun: () => void handleRun(void 0, { stayOnCanvas: true })
      }
    )
  ] });
}
export {
  WorkflowsPage
};
