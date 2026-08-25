import { r as reactExports, j as jsxRuntimeExports } from "./vendor-xyflow-ByVkQ6-f.js";
import { B as querySessionType, av as Drawer, S as Spin, ar as Segmented, aw as Empty, ax as Tag, a5 as Tooltip, E as Button, ay as RefIcon$2, T as Typography, D as appMessage, aq as useSessionStore, az as SESSION_TYPE_FILTER_OPTIONS, aA as Popconfirm, aB as RefIcon$3, ah as Input, aC as RefIcon$4, ab as Select, aD as SESSION_TYPE_ICONS, aE as RefIcon$5, aa as RefIcon$7, aF as RefIcon$8, aG as queryLatestWorkflowRunBySession, aj as useAppStore, aH as useBusinessStore, aI as FeaturePageHeader, aJ as RefIcon$9, aK as RefIcon$a } from "./index-BQnnWLUu.js";
import { R as RefIcon } from "./CaretRightOutlined-B57Sb4cd.js";
import { R as RefIcon$1 } from "./CaretDownOutlined-CqBxlPI3.js";
import { C as Checkbox } from "./index-CTeoHogA.js";
import { P as Pagination } from "./Pagination-IjXhoAki.js";
import { R as RefIcon$6 } from "./ApartmentOutlined-D1ymclVm.js";
import "./LeftOutlined-DLcljnsf.js";
const WORKFLOW_NODE_EXECUTIONS_KEY = "__nodeExecutions__";
function queryNodeExecutions(context) {
  const raw = context?.[WORKFLOW_NODE_EXECUTIONS_KEY];
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  return raw;
}
function queryNodeExecution(context, nodeId) {
  return queryNodeExecutions(context)[nodeId];
}
function queryMessagesForNodeExecution(messages, record) {
  if (!record?.messageRange) return [];
  const { from, to } = record.messageRange;
  if (from < 0 || to <= from || from >= messages.length) return [];
  return messages.slice(from, Math.min(to, messages.length));
}
const WORKFLOW_STEP_PREFIX = "【工作流步骤】";
const WORKFLOW_CONDITION_PREFIX = "【条件分支】";
function queryNormalizeTitle(title) {
  return title.trim().replace(/\s+/g, " ");
}
function queryTaskTitlesMatch(a, b) {
  const na = queryNormalizeTitle(a);
  const nb = queryNormalizeTitle(b);
  if (!na || !nb) return false;
  return na === nb || na.includes(nb) || nb.includes(na);
}
function queryWorkflowStepTitleFromContent(content2) {
  const text = content2.trim();
  if (text.startsWith(WORKFLOW_STEP_PREFIX)) {
    return text.slice(WORKFLOW_STEP_PREFIX.length).split("\n")[0]?.trim() || null;
  }
  if (text.startsWith(WORKFLOW_CONDITION_PREFIX)) {
    return text.slice(WORKFLOW_CONDITION_PREFIX.length).split("\n")[0]?.trim() || null;
  }
  return null;
}
function queryMessageAnchorIndex(messages, task, execution) {
  if (execution?.messageRange) {
    return execution.messageRange.from;
  }
  const prompt = execution?.input?.prompt;
  if (typeof prompt === "string" && prompt.trim()) {
    const trimmedPrompt = prompt.trim();
    const firstLine = trimmedPrompt.split("\n")[0]?.trim();
    const byFull = messages.findIndex(
      (m) => m.role === "user" && (m.content ?? "").trim() === trimmedPrompt
    );
    if (byFull >= 0) return byFull;
    if (firstLine) {
      const byLine = messages.findIndex(
        (m) => m.role === "user" && (m.content ?? "").trim().startsWith(firstLine)
      );
      if (byLine >= 0) return byLine;
    }
  }
  const title = execution?.title ?? task.title;
  if (title.trim()) {
    const marker = `${WORKFLOW_STEP_PREFIX}${title.trim()}`;
    const byMarker = messages.findIndex((m) => (m.content ?? "").includes(marker));
    if (byMarker >= 0) return byMarker;
    const bracket2 = `【${title.trim()}】`;
    const byBracket = messages.findIndex((m) => (m.content ?? "").includes(bracket2));
    if (byBracket >= 0) return byBracket;
  }
  for (let i = 0; i < messages.length; i++) {
    const stepTitle = queryWorkflowStepTitleFromContent(messages[i].content ?? "");
    if (stepTitle && queryTaskTitlesMatch(stepTitle, task.title)) {
      return i;
    }
  }
  return -1;
}
function queryRelatedMessagesLegacy(session, task) {
  const title = task.title.trim();
  if (!title) return [];
  return session.messages.filter((msg) => {
    const content2 = msg.content ?? "";
    if (content2.includes(title)) return true;
    if (content2.includes(`${WORKFLOW_STEP_PREFIX}${title}`)) return true;
    if (content2.includes(`【${title}】`)) return true;
    if (msg.toolName && title.toLowerCase().includes(msg.toolName.toLowerCase())) return true;
    if (content2.includes(`等待确认：${title}`)) return true;
    return false;
  });
}
function queryRelatedMessagesByTask(session, tasks, workflowContext) {
  const messages = session.messages;
  const result = new Map(tasks.map((t) => [t.id, []]));
  if (messages.length === 0 || tasks.length === 0) return result;
  const anchors = [];
  for (const task of tasks) {
    const execution = queryNodeExecution(workflowContext, task.id);
    if (execution?.messageRange) {
      anchors.push({ taskId: task.id, from: execution.messageRange.from, execution });
      continue;
    }
    const from = queryMessageAnchorIndex(messages, task, execution);
    if (from >= 0) {
      anchors.push({ taskId: task.id, from, execution });
    }
  }
  anchors.sort((a, b) => a.from - b.from || (a.execution?.executedAt ?? 0) - (b.execution?.executedAt ?? 0));
  for (let i = 0; i < anchors.length; i++) {
    const { taskId, from, execution } = anchors[i];
    let to = messages.length;
    if (execution?.messageRange) {
      to = execution.messageRange.to;
    } else if (i + 1 < anchors.length) {
      to = anchors[i + 1].from;
    }
    const slice = messages.slice(from, Math.max(from, to));
    if (slice.length > 0) {
      result.set(taskId, slice);
    }
  }
  for (const task of tasks) {
    const execution = queryNodeExecution(workflowContext, task.id);
    const ranged = queryMessagesForNodeExecution(messages, execution);
    if (ranged.length > 0) {
      result.set(task.id, ranged);
      continue;
    }
    if ((result.get(task.id)?.length ?? 0) > 0) continue;
    const legacy = queryRelatedMessagesLegacy(session, task);
    if (legacy.length > 0) {
      result.set(task.id, legacy);
      continue;
    }
    const toolName = execution?.input?.toolName;
    if (typeof toolName === "string" && toolName) {
      const toolMsgs = messages.filter((m) => m.role === "tool" && m.toolName === toolName);
      if (toolMsgs.length > 0) {
        result.set(task.id, toolMsgs);
      }
    }
  }
  const assigned = /* @__PURE__ */ new Set();
  for (const list2 of Array.from(result.values())) {
    for (const m of list2) assigned.add(m.id);
  }
  const unassigned = messages.filter((m) => !assigned.has(m.id));
  if (unassigned.length > 0 && anchors.length === 0) {
    const activeTasks = tasks.filter((t) => t.status !== "pending" && t.status !== "skipped");
    const targets = activeTasks.length > 0 ? activeTasks : tasks;
    if (targets.length === 1) {
      result.set(targets[0].id, messages);
    } else if (targets.length > 1) {
      const chunk = Math.ceil(messages.length / targets.length);
      targets.forEach((task, index) => {
        if ((result.get(task.id)?.length ?? 0) > 0) return;
        result.set(task.id, messages.slice(index * chunk, (index + 1) * chunk));
      });
    }
  }
  return result;
}
const RELATED_MESSAGES_PURPOSE = "区分对话双方，完整留存一轮交互的输入与输出记录。";
function queryMessageRoleTooltip(role) {
  switch (role) {
    case "user":
      return "代表用户下发的指令、提问";
    case "assistant":
      return "代表 AI 助手输出的回复内容（天气简报、流程结束提示都属于这一类）";
    case "system":
      return "系统提示或内部约束，一般不直接对用户展示";
    case "tool":
      return "工具调用结果，供助手继续推理或写入工作流上下文";
    default:
      return void 0;
  }
}
function formatContextJson(value) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}
function queryNotifyDebugFromNodeOutput(output) {
  for (const [key2, value] of Object.entries(output)) {
    if (!key2.startsWith("notify_")) continue;
    if (typeof value === "string") return { summary: value };
    if (value && typeof value === "object") {
      const record = value;
      const summary2 = typeof record.summary === "string" ? record.summary : String(record.summary ?? "");
      const requestPath = typeof record.requestPath === "string" ? record.requestPath : void 0;
      const requestBody = record.requestBody && typeof record.requestBody === "object" ? record.requestBody : void 0;
      const requestHeaders = record.requestHeaders && typeof record.requestHeaders === "object" ? record.requestHeaders : void 0;
      const deduped = record.deduped === true;
      return { summary: summary2, requestPath, requestBody, requestHeaders, deduped };
    }
  }
  return void 0;
}
function queryNotifyDebugFromContextSlice(contextSlice) {
  for (const [key2, value] of Object.entries(contextSlice)) {
    if (!key2.startsWith("notify_")) continue;
    if (typeof value === "string") {
      return { summary: value };
    }
    if (value && typeof value === "object") {
      const record = value;
      const summary2 = typeof record.summary === "string" ? record.summary : String(record.summary ?? "");
      const requestPath = typeof record.requestPath === "string" ? record.requestPath : void 0;
      const requestBody = record.requestBody && typeof record.requestBody === "object" ? record.requestBody : void 0;
      const requestHeaders = record.requestHeaders && typeof record.requestHeaders === "object" ? record.requestHeaders : void 0;
      const deduped = record.deduped === true;
      return { summary: summary2, requestPath, requestBody, requestHeaders, deduped };
    }
  }
  return void 0;
}
function queryContextSliceForTask(context, task) {
  if (!context) return {};
  const slice = {};
  for (const [key2, value] of Object.entries(context)) {
    if (key2 === task.id || key2.includes(task.id) || key2 === `toast_${task.id}` || task.title && key2.toLowerCase().includes(task.title.slice(0, 8).toLowerCase())) {
      slice[key2] = value;
    }
  }
  return slice;
}
function querySessionContextSummary(session, workflowRun) {
  return {
    session,
    workflowRun,
    workflowContextJson: formatContextJson(workflowRun?.context ?? {}),
    messageCount: session.messages.length,
    taskCount: session.tasks?.length ?? 0
  };
}
function queryNodeExecutionContexts(session, workflowRun) {
  const tasks = session.tasks ?? [];
  const context = workflowRun?.context;
  const relatedByTask = queryRelatedMessagesByTask(session, tasks, context);
  if (tasks.length === 0) {
    return [
      {
        task: {
          id: session.id,
          title: "对话",
          status: "done"
        },
        relatedMessages: session.messages,
        contextSlice: context ?? {},
        contextJson: formatContextJson(context ?? {}),
        nodeInput: {},
        nodeInputJson: "{}",
        nodeOutput: {},
        nodeOutputJson: "{}"
      }
    ];
  }
  return tasks.map((task) => {
    const execution = queryNodeExecution(context, task.id);
    const contextSlice = execution?.contextSnapshot ?? queryContextSliceForTask(context, task);
    const nodeInput = execution?.input ?? {};
    const nodeOutput = execution?.output ?? {};
    const notifyDebug = queryNotifyDebugFromNodeOutput(nodeOutput) ?? queryNotifyDebugFromContextSlice(contextSlice);
    return {
      task,
      relatedMessages: relatedByTask.get(task.id) ?? [],
      contextSlice,
      contextJson: formatContextJson(contextSlice),
      nodeInput,
      nodeInputJson: formatContextJson(nodeInput),
      nodeOutput,
      nodeOutputJson: formatContextJson(nodeOutput),
      notifyDebug,
      skipped: nodeOutput.skipped === true
    };
  });
}
function querySessionTypeLabel(type) {
  switch (type) {
    case "publish":
      return "发布";
    case "schedule":
      return "定时";
    case "workflow":
      return "流程";
    default:
      return "对话";
  }
}
function queryTaskStatusColor(status) {
  switch (status) {
    case "running":
      return "processing";
    case "done":
      return "success";
    case "failed":
      return "error";
    case "skipped":
      return "warning";
    default:
      return "default";
  }
}
function queryTaskStatusLabel(status) {
  switch (status) {
    case "pending":
      return "待执行";
    case "running":
      return "执行中";
    case "done":
      return "已完成";
    case "failed":
      return "失败";
    case "skipped":
      return "已跳过";
    default:
      return status;
  }
}
const root = "_root_1myu1_1";
const toolbar$1 = "_toolbar_1myu1_9";
const toolbarBtn = "_toolbarBtn_1myu1_16";
const tree = "_tree_1myu1_32";
const fallback = "_fallback_1myu1_42";
const node = "_node_1myu1_55";
const line = "_line_1myu1_59";
const toggle = "_toggle_1myu1_67";
const toggleSpacer = "_toggleSpacer_1myu1_86";
const key = "_key_1myu1_93";
const colon = "_colon_1myu1_97";
const bracket = "_bracket_1myu1_101";
const ellipsis = "_ellipsis_1myu1_105";
const primitiveString = "_primitiveString_1myu1_111";
const primitiveNumber = "_primitiveNumber_1myu1_116";
const primitiveBoolean = "_primitiveBoolean_1myu1_120";
const primitiveNull = "_primitiveNull_1myu1_124";
const styles$3 = {
  root,
  toolbar: toolbar$1,
  toolbarBtn,
  tree,
  fallback,
  node,
  line,
  toggle,
  toggleSpacer,
  key,
  colon,
  bracket,
  ellipsis,
  primitiveString,
  primitiveNumber,
  primitiveBoolean,
  primitiveNull
};
function queryParsedJson(value) {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
}
function queryCollapsible(value) {
  return value !== null && typeof value === "object";
}
function queryChildCount(value) {
  return Array.isArray(value) ? value.length : Object.keys(value).length;
}
function queryCollapsedPreview(value) {
  const count = queryChildCount(value);
  return Array.isArray(value) ? `[${count}]` : `{${count}}`;
}
function queryAllCollapsiblePaths(value, currentPath) {
  if (!queryCollapsible(value)) return [];
  const paths = [currentPath];
  const entries = Array.isArray(value) ? value.map((item, index) => [String(index), item]) : Object.entries(value);
  for (const [key2, child] of entries) {
    paths.push(...queryAllCollapsiblePaths(child, `${currentPath}.${key2}`));
  }
  return paths;
}
function JsonTreeNode({
  name,
  value,
  path,
  depth,
  collapsedPaths,
  onToggle
}) {
  const collapsible = queryCollapsible(value);
  const collapsed = collapsible && collapsedPaths.has(path);
  const indentStyle = { paddingLeft: depth * 14 };
  if (!collapsible) {
    const primitiveClass = typeof value === "string" ? styles$3.primitiveString : typeof value === "number" ? styles$3.primitiveNumber : typeof value === "boolean" ? styles$3.primitiveBoolean : styles$3.primitiveNull;
    const display = typeof value === "string" ? `"${value}"` : value === null ? "null" : String(value);
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$3.line, style: indentStyle, children: [
      depth > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$3.toggleSpacer, "aria-hidden": true }) : null,
      name !== void 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$3.key, children: typeof name === "number" ? name : `"${name}"` }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$3.colon, children: ": " })
      ] }) : null,
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: primitiveClass, children: display })
    ] });
  }
  const isArray = Array.isArray(value);
  const openBracket = isArray ? "[" : "{";
  const closeBracket = isArray ? "]" : "}";
  const entries = isArray ? value.map((item, index) => [index, item]) : Object.entries(value);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$3.node, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$3.line, style: indentStyle, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          className: styles$3.toggle,
          onClick: () => onToggle(path),
          "aria-expanded": !collapsed,
          "aria-label": collapsed ? "展开" : "折叠",
          children: collapsed ? /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon, {}) : /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$1, {})
        }
      ),
      name !== void 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$3.key, children: typeof name === "number" ? name : `"${name}"` }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$3.colon, children: ": " })
      ] }) : null,
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$3.bracket, children: openBracket }),
      collapsed ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$3.ellipsis, children: queryCollapsedPreview(value) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$3.bracket, children: closeBracket })
      ] }) : null
    ] }),
    !collapsed ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      entries.map(([childName, childValue]) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        JsonTreeNode,
        {
          name: childName,
          value: childValue,
          path: `${path}.${String(childName)}`,
          depth: depth + 1,
          collapsedPaths,
          onToggle
        },
        `${path}.${String(childName)}`
      )),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$3.line, style: indentStyle, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$3.toggleSpacer, "aria-hidden": true }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$3.bracket, children: closeBracket })
      ] })
    ] }) : null
  ] });
}
function JsonPreview({ value }) {
  const parsed = reactExports.useMemo(() => queryParsedJson(value), [value]);
  const rootPath = "root";
  const [collapsedPaths, setCollapsedPaths] = reactExports.useState(() => /* @__PURE__ */ new Set());
  const onToggle = reactExports.useCallback((path) => {
    setCollapsedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }, []);
  const onExpandAll = reactExports.useCallback(() => {
    setCollapsedPaths(/* @__PURE__ */ new Set());
  }, []);
  const onCollapseAll = reactExports.useCallback(() => {
    if (!parsed || !queryCollapsible(parsed)) return;
    setCollapsedPaths(new Set(queryAllCollapsiblePaths(parsed, rootPath)));
  }, [parsed]);
  if (parsed === null) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: styles$3.fallback, children: value?.trim() ? value : "{}" });
  }
  const rootCollapsible = queryCollapsible(parsed);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$3.root, children: [
    rootCollapsible ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$3.toolbar, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: styles$3.toolbarBtn, onClick: onExpandAll, children: "全部展开" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: styles$3.toolbarBtn, onClick: onCollapseAll, children: "全部折叠" })
    ] }) : null,
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$3.tree, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      JsonTreeNode,
      {
        value: parsed,
        path: rootPath,
        depth: 0,
        collapsedPaths,
        onToggle
      }
    ) })
  ] });
}
const drawer = "_drawer_1heyv_3";
const titleRow = "_titleRow_1heyv_18";
const drawerTitle = "_drawerTitle_1heyv_25";
const typeTag$1 = "_typeTag_1heyv_33";
const toneChat = "_toneChat_1heyv_42";
const tonePublish = "_tonePublish_1heyv_47";
const toneSchedule = "_toneSchedule_1heyv_52";
const toneWorkflow = "_toneWorkflow_1heyv_57";
const spinWrap = "_spinWrap_1heyv_63";
const body$1 = "_body_1heyv_73";
const bodyGlow = "_bodyGlow_1heyv_82";
const summary = "_summary_1heyv_92";
const summaryMain = "_summaryMain_1heyv_106";
const summaryTitle = "_summaryTitle_1heyv_111";
const summarySub = "_summarySub_1heyv_122";
const statRow = "_statRow_1heyv_128";
const statChip = "_statChip_1heyv_134";
const statValue = "_statValue_1heyv_147";
const statLabel = "_statLabel_1heyv_155";
const paneSwitch = "_paneSwitch_1heyv_161";
const paneSegmented = "_paneSegmented_1heyv_169";
const paneOption = "_paneOption_1heyv_206";
const paneBadge = "_paneBadge_1heyv_215";
const paneContent = "_paneContent_1heyv_239";
const overviewPane = "_overviewPane_1heyv_250";
const panel$1 = "_panel_1heyv_291";
const flexCoulmn = "_flexCoulmn_1heyv_298";
const overviewMeta = "_overviewMeta_1heyv_322";
const overviewMetaGrid = "_overviewMetaGrid_1heyv_326";
const overviewMetaCell = "_overviewMetaCell_1heyv_333";
const overviewMetaCellWide = "_overviewMetaCellWide_1heyv_344";
const overviewMetaLabel = "_overviewMetaLabel_1heyv_348";
const overviewMetaValue = "_overviewMetaValue_1heyv_355";
const overviewMetaId = "_overviewMetaId_1heyv_362";
const idValue = "_idValue_1heyv_369";
const idCopy = "_idCopy_1heyv_373";
const overviewSectionTitle = "_overviewSectionTitle_1heyv_377";
const overviewSectionHint = "_overviewSectionHint_1heyv_385";
const overviewEmptyRun = "_overviewEmptyRun_1heyv_392";
const overviewRun = "_overviewRun_1heyv_396";
const overviewRunHead = "_overviewRunHead_1heyv_407";
const overviewRunGrid = "_overviewRunGrid_1heyv_415";
const overviewContext = "_overviewContext_1heyv_421";
const idRow = "_idRow_1heyv_430";
const idLabel = "_idLabel_1heyv_441";
const metaLabel = "_metaLabel_1heyv_489";
const mono = "_mono_1heyv_504";
const nodesLayout = "_nodesLayout_1heyv_510";
const nodeRail = "_nodeRail_1heyv_521";
const nodeRailHead = "_nodeRailHead_1heyv_532";
const nodeRailCount = "_nodeRailCount_1heyv_545";
const nodeRailList = "_nodeRailList_1heyv_559";
const nodeRailItem = "_nodeRailItem_1heyv_569";
const nodeRailItemActive = "_nodeRailItemActive_1heyv_591";
const nodeIndex = "_nodeIndex_1heyv_596";
const nodeRailMain = "_nodeRailMain_1heyv_611";
const nodeRailTitle = "_nodeRailTitle_1heyv_619";
const nodeRailSub = "_nodeRailSub_1heyv_629";
const nodeStatusTag = "_nodeStatusTag_1heyv_636";
const skippedHint = "_skippedHint_1heyv_643";
const msgCount = "_msgCount_1heyv_648";
const nodeDetail = "_nodeDetail_1heyv_653";
const nodeDetailHead = "_nodeDetailHead_1heyv_665";
const nodeDetailTitleRow = "_nodeDetailTitleRow_1heyv_675";
const nodeDetailTitle = "_nodeDetailTitle_1heyv_675";
const nodeIdRow = "_nodeIdRow_1heyv_691";
const detailTabs = "_detailTabs_1heyv_699";
const detailTab = "_detailTab_1heyv_699";
const detailTabActive = "_detailTabActive_1heyv_759";
const detailTabLabel = "_detailTabLabel_1heyv_770";
const detailTabCount = "_detailTabCount_1heyv_774";
const nodeDetailBody = "_nodeDetailBody_1heyv_798";
const subLabel = "_subLabel_1heyv_808";
const hintUnderline = "_hintUnderline_1heyv_815";
const messagePane = "_messagePane_1heyv_826";
const messagePaneHead = "_messagePaneHead_1heyv_834";
const messageList = "_messageList_1heyv_841";
const messageItem = "_messageItem_1heyv_850";
const messageMeta = "_messageMeta_1heyv_860";
const messageMetaActions = "_messageMetaActions_1heyv_870";
const roleName = "_roleName_1heyv_878";
const roleAssistant = "_roleAssistant_1heyv_886";
const roleTool = "_roleTool_1heyv_890";
const roleSystem = "_roleSystem_1heyv_894";
const messageTool = "_messageTool_1heyv_898";
const messageTime = "_messageTime_1heyv_907";
const messageCard = "_messageCard_1heyv_914";
const roleUser = "_roleUser_1heyv_939";
const messageBody = "_messageBody_1heyv_955";
const codeLabel = "_codeLabel_1heyv_970";
const codeBody = "_codeBody_1heyv_977";
const jsonPreviewBody = "_jsonPreviewBody_1heyv_982";
const emptyHint = "_emptyHint_1heyv_987";
const emptyState = "_emptyState_1heyv_992";
const loadingPlaceholder = "_loadingPlaceholder_1heyv_1002";
const styles$2 = {
  drawer,
  titleRow,
  drawerTitle,
  typeTag: typeTag$1,
  toneChat,
  tonePublish,
  toneSchedule,
  toneWorkflow,
  spinWrap,
  body: body$1,
  bodyGlow,
  summary,
  summaryMain,
  summaryTitle,
  summarySub,
  statRow,
  statChip,
  statValue,
  statLabel,
  paneSwitch,
  paneSegmented,
  paneOption,
  paneBadge,
  paneContent,
  overviewPane,
  panel: panel$1,
  flexCoulmn,
  overviewMeta,
  overviewMetaGrid,
  overviewMetaCell,
  overviewMetaCellWide,
  overviewMetaLabel,
  overviewMetaValue,
  overviewMetaId,
  idValue,
  idCopy,
  overviewSectionTitle,
  overviewSectionHint,
  overviewEmptyRun,
  overviewRun,
  overviewRunHead,
  overviewRunGrid,
  overviewContext,
  idRow,
  idLabel,
  metaLabel,
  mono,
  nodesLayout,
  nodeRail,
  nodeRailHead,
  nodeRailCount,
  nodeRailList,
  nodeRailItem,
  nodeRailItemActive,
  nodeIndex,
  nodeRailMain,
  nodeRailTitle,
  nodeRailSub,
  nodeStatusTag,
  skippedHint,
  msgCount,
  nodeDetail,
  nodeDetailHead,
  nodeDetailTitleRow,
  nodeDetailTitle,
  nodeIdRow,
  detailTabs,
  detailTab,
  detailTabActive,
  detailTabLabel,
  detailTabCount,
  nodeDetailBody,
  subLabel,
  hintUnderline,
  messagePane,
  messagePaneHead,
  messageList,
  messageItem,
  messageMeta,
  messageMetaActions,
  roleName,
  roleAssistant,
  roleTool,
  roleSystem,
  messageTool,
  messageTime,
  messageCard,
  roleUser,
  messageBody,
  codeLabel,
  codeBody,
  jsonPreviewBody,
  emptyHint,
  emptyState,
  loadingPlaceholder
};
function formatTime$1(ts) {
  return new Date(ts).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}
function postCopyText(text, successTip = "已复制") {
  void navigator.clipboard.writeText(text).then(
    () => appMessage.success(successTip),
    () => appMessage.error("复制失败")
  );
}
function queryDefaultNodeId(nodes) {
  if (nodes.length === 0) return null;
  const failed = nodes.find((n) => n.task.status === "failed");
  if (failed) return failed.task.id;
  const running = nodes.find((n) => n.task.status === "running");
  if (running) return running.task.id;
  return nodes[nodes.length - 1]?.task.id ?? null;
}
function querySessionToneClass$1(type) {
  switch (type) {
    case "publish":
      return styles$2.tonePublish;
    case "schedule":
      return styles$2.toneSchedule;
    case "workflow":
      return styles$2.toneWorkflow;
    default:
      return styles$2.toneChat;
  }
}
function queryWorkflowRunStatusColor(status) {
  switch (status) {
    case "success":
      return "success";
    case "failed":
      return "error";
    case "running":
      return "processing";
    case "awaiting_user":
      return "warning";
    default:
      return "default";
  }
}
function queryRoleToneClass(role) {
  switch (role) {
    case "user":
      return styles$2.roleUser;
    case "assistant":
      return styles$2.roleAssistant;
    case "tool":
      return styles$2.roleTool;
    default:
      return styles$2.roleSystem;
  }
}
function CodeBlock({
  value,
  label = "内容",
  emptyHint: emptyHint2 = "{}",
  hint,
  /** 为 true 时尝试以可折叠 JSON 树预览；解析失败则回退纯文本 */
  jsonPreview = false
}) {
  const text = value?.trim() ? value : emptyHint2;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("article", { className: styles$2.messageItem, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: styles$2.messageMeta, children: [
      hint ? /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, { title: hint, placement: "topLeft", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `${styles$2.codeLabel} ${styles$2.hintUnderline}`, tabIndex: 0, children: label }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$2.codeLabel, children: label }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$2.messageMetaActions, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, { title: "复制", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          type: "text",
          size: "small",
          icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$2, {}),
          onClick: () => postCopyText(text),
          "aria-label": `复制${label}`
        }
      ) }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$2.messageCard, children: jsonPreview ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `${styles$2.messageBody} ${styles$2.codeBody} ${styles$2.jsonPreviewBody}`, children: /* @__PURE__ */ jsxRuntimeExports.jsx(JsonPreview, { value: text }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: `${styles$2.messageBody} ${styles$2.codeBody}`, children: text }) })
  ] });
}
function MessageRoleLabel({ role }) {
  const tip = queryMessageRoleTooltip(role);
  if (!tip) return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$2.roleName, children: role });
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, { title: tip, placement: "topLeft", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `${styles$2.roleName} ${styles$2.hintUnderline}`, tabIndex: 0, children: role }) });
}
function RelatedMessageCard({ msg }) {
  const content2 = msg.content ?? "";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("article", { className: `${styles$2.messageItem} ${queryRoleToneClass(msg.role)}`, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: styles$2.messageMeta, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(MessageRoleLabel, { role: msg.role }),
      msg.toolName ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$2.messageTool, children: msg.toolName }) : null,
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$2.messageMetaActions, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$2.messageTime, children: formatTime$1(msg.createdAt) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, { title: "复制消息", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            type: "text",
            size: "small",
            icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$2, {}),
            onClick: () => postCopyText(content2),
            "aria-label": "复制消息内容"
          }
        ) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$2.messageCard, children: /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: styles$2.messageBody, children: content2 }) })
  ] });
}
function IdRow({
  label,
  value,
  copyTip
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$2.idRow, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$2.idLabel, children: label }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: styles$2.idValue, children: value }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, { title: copyTip, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      Button,
      {
        type: "text",
        size: "small",
        icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$2, {}),
        onClick: () => postCopyText(value, copyTip.replace(/^复制/, "已复制")),
        "aria-label": copyTip,
        className: styles$2.idCopy
      }
    ) })
  ] });
}
function OverviewPane({
  summary: summary2
}) {
  const session = summary2.session;
  const run = summary2.workflowRun;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$2.overviewPane, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: `${styles$2.panel} ${styles$2.overviewMeta}`, "aria-label": "会话档案", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$2.overviewMetaGrid, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$2.overviewMetaCell, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$2.overviewMetaLabel, children: "创建时间" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$2.overviewMetaValue, children: formatTime$1(session.createdAt) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `${styles$2.overviewMetaCell} ${styles$2.overviewMetaCellWide}`, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$2.overviewMetaLabel, children: "会话 ID" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: styles$2.overviewMetaId, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: styles$2.idValue, children: session.id }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, { title: "复制会话 ID", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              type: "text",
              size: "small",
              icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$2, {}),
              onClick: () => postCopyText(session.id, "已复制会话 ID"),
              "aria-label": "复制会话 ID",
              className: styles$2.idCopy
            }
          ) })
        ] })
      ] })
    ] }) }),
    run ? /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: `${styles$2.panel} ${styles$2.overviewRun}`, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$2.overviewRunHead, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: styles$2.overviewSectionTitle, children: "工作流运行" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Tag, { color: queryWorkflowRunStatusColor(run.status), children: run.status })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$2.overviewRunGrid, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(IdRow, { label: "Run ID", value: run.id, copyTip: "复制 Run ID" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(IdRow, { label: "Workflow ID", value: run.workflowId, copyTip: "复制 Workflow ID" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$2.idRow, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$2.idLabel, children: "当前节点" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: styles$2.idValue, children: run.cursorNodeId ?? "无" })
        ] })
      ] })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: `${styles$2.panel} ${styles$2.overviewEmptyRun}`, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: styles$2.overviewSectionTitle, children: "工作流运行" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: styles$2.overviewSectionHint, children: "当前会话暂无关联的工作流运行记录" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: `${styles$2.panel} ${styles$2.overviewContext}  ${styles$2.flexCoulmn}`, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: styles$2.overviewSectionTitle, children: "Workflow Context" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: styles$2.overviewSectionHint, children: "节点执行可读的全局上下文快照" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CodeBlock, { label: "全局 Context", value: summary2.workflowContextJson || "{}", jsonPreview: true })
    ] })
  ] });
}
function NodesPane({
  nodes
}) {
  const [activeId, setActiveId] = reactExports.useState(() => queryDefaultNodeId(nodes));
  const [detailPane, setDetailPane] = reactExports.useState("messages");
  reactExports.useEffect(() => {
    setActiveId(queryDefaultNodeId(nodes));
  }, [nodes]);
  const active = reactExports.useMemo(
    () => nodes.find((n) => n.task.id === activeId) ?? nodes[0] ?? null,
    [nodes, activeId]
  );
  reactExports.useEffect(() => {
    if (!active) return;
    if (active.relatedMessages.length > 0) setDetailPane("messages");
    else if (active.notifyDebug) setDetailPane("notify");
    else setDetailPane("output");
  }, [active]);
  if (nodes.length === 0) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Empty, { description: "暂无任务节点", className: styles$2.emptyState });
  }
  const detailOptions = [
    {
      value: "messages",
      label: "消息",
      count: active?.relatedMessages.length ?? 0
    },
    { value: "input", label: "入参" },
    { value: "output", label: "出参" },
    { value: "context", label: "Context" },
    ...active?.notifyDebug ? [{ value: "notify", label: "通知" }] : []
  ];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$2.nodesLayout, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("aside", { className: styles$2.nodeRail, "aria-label": "节点轨迹", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$2.nodeRailHead, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "执行轨迹" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$2.nodeRailCount, children: nodes.length })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$2.nodeRailList, children: nodes.map((node2, index) => {
        const selected = node2.task.id === active?.task.id;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            type: "button",
            className: `${styles$2.nodeRailItem} ${selected ? styles$2.nodeRailItemActive : ""}`,
            onClick: () => setActiveId(node2.task.id),
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$2.nodeIndex, children: index + 1 }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: styles$2.nodeRailMain, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$2.nodeRailTitle, children: node2.task.title }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: styles$2.nodeRailSub, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Tag,
                    {
                      color: queryTaskStatusColor(node2.task.status),
                      className: styles$2.nodeStatusTag,
                      children: queryTaskStatusLabel(node2.task.status)
                    }
                  ),
                  node2.skipped ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$2.skippedHint, children: "跳过" }) : null,
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: styles$2.msgCount, children: [
                    node2.relatedMessages.length,
                    " 条消息"
                  ] })
                ] })
              ] })
            ]
          },
          node2.task.id
        );
      }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$2.nodeDetail, children: active ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: styles$2.nodeDetailHead, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$2.nodeDetailTitleRow, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: styles$2.nodeDetailTitle, children: active.task.title }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Tag, { color: queryTaskStatusColor(active.task.status), children: queryTaskStatusLabel(active.task.status) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$2.nodeIdRow, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$2.metaLabel, children: "节点 ID" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: styles$2.mono, children: active.task.id }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, { title: "复制节点 ID", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              type: "text",
              size: "small",
              icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$2, {}),
              onClick: () => postCopyText(active.task.id, "已复制节点 ID"),
              "aria-label": "复制节点 ID"
            }
          ) })
        ] }),
        active.skipped ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography.Text, { type: "secondary", className: styles$2.emptyHint, children: [
          "该节点已跳过",
          typeof active.nodeOutput.reason === "string" ? `：${active.nodeOutput.reason}` : ""
        ] }) : null,
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$2.detailTabs, role: "tablist", "aria-label": "节点详情分段", children: detailOptions.map((opt) => {
          const selected = detailPane === opt.value;
          return /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              type: "button",
              role: "tab",
              "aria-selected": selected,
              className: `${styles$2.detailTab} ${selected ? styles$2.detailTabActive : ""}`,
              onClick: () => setDetailPane(opt.value),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$2.detailTabLabel, children: opt.label }),
                typeof opt.count === "number" ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$2.detailTabCount, children: opt.count }) : null
              ]
            },
            opt.value
          );
        }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$2.nodeDetailBody, children: [
        detailPane === "input" ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$2.messageList, children: /* @__PURE__ */ jsxRuntimeExports.jsx(CodeBlock, { label: "入参", value: active.nodeInputJson || "{}", jsonPreview: true }) }) : null,
        detailPane === "output" ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$2.messageList, children: /* @__PURE__ */ jsxRuntimeExports.jsx(CodeBlock, { label: "出参", value: active.nodeOutputJson || "{}", jsonPreview: true }) }) : null,
        detailPane === "context" ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$2.messageList, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          CodeBlock,
          {
            label: "Context",
            hint: "节点执行时可用的 workflow context 快照",
            value: active.contextJson || "{}",
            jsonPreview: true
          }
        ) }) : null,
        detailPane === "notify" && active.notifyDebug ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$2.messageList, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            CodeBlock,
            {
              label: "发送结果",
              value: active.notifyDebug.summary,
              emptyHint: "无",
              hint: active.notifyDebug.deduped ? "本次命中短时去重，未实际发起 HTTP 请求" : void 0,
              jsonPreview: true
            }
          ),
          active.notifyDebug.requestPath ? /* @__PURE__ */ jsxRuntimeExports.jsx(CodeBlock, { label: "请求路径", value: active.notifyDebug.requestPath }) : null,
          active.notifyDebug.requestHeaders && Object.keys(active.notifyDebug.requestHeaders).length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            CodeBlock,
            {
              label: "请求头",
              value: formatContextJson(active.notifyDebug.requestHeaders),
              jsonPreview: true
            }
          ) : null,
          active.notifyDebug.requestBody ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            CodeBlock,
            {
              label: "请求体",
              value: formatContextJson(active.notifyDebug.requestBody),
              jsonPreview: true
            }
          ) : null
        ] }) : null,
        detailPane === "messages" ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$2.messagePane, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$2.messagePaneHead, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, { title: RELATED_MESSAGES_PURPOSE, placement: "topLeft", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `${styles$2.subLabel} ${styles$2.hintUnderline}`, tabIndex: 0, children: "关联消息" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: styles$2.msgCount, children: [
              active.relatedMessages.length,
              " 条"
            ] })
          ] }),
          active.relatedMessages.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            Empty,
            {
              image: Empty.PRESENTED_IMAGE_SIMPLE,
              description: "未匹配到与该节点标题相关的消息",
              className: styles$2.emptyState
            }
          ) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$2.messageList, children: active.relatedMessages.map((msg) => /* @__PURE__ */ jsxRuntimeExports.jsx(RelatedMessageCard, { msg }, msg.id)) })
        ] }) : null
      ] })
    ] }) : null })
  ] });
}
function SessionContextDrawer({
  open,
  loading,
  contextSummary,
  nodeContexts,
  onClose
}) {
  const [pane, setPane] = reactExports.useState("nodes");
  reactExports.useEffect(() => {
    if (!open) return;
    setPane(nodeContexts.length > 0 ? "nodes" : "overview");
  }, [open, contextSummary?.session.id, nodeContexts.length]);
  const session = contextSummary?.session ?? null;
  const sessionType = session ? querySessionType(session) : "chat";
  const title = /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$2.titleRow, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$2.drawerTitle, children: "对话上下文" }),
    session ? /* @__PURE__ */ jsxRuntimeExports.jsx(Tag, { className: `${styles$2.typeTag} ${querySessionToneClass$1(sessionType)}`, children: querySessionTypeLabel(sessionType) }) : null
  ] });
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Drawer,
    {
      title,
      width: "min(1080px, 86vw)",
      open,
      onClose,
      destroyOnHidden: true,
      className: styles$2.drawer,
      styles: { body: { padding: 0, display: "flex", flexDirection: "column" } },
      children: /* @__PURE__ */ jsxRuntimeExports.jsx(Spin, { spinning: loading, className: styles$2.spinWrap, children: contextSummary ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$2.body, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$2.bodyGlow, "aria-hidden": true }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: styles$2.summary, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$2.summaryMain, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: styles$2.summaryTitle, children: contextSummary.session.title }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: styles$2.summarySub, children: [
              "更新于 ",
              formatTime$1(contextSummary.session.updatedAt),
              contextSummary.workflowRun ? ` · 运行 ${contextSummary.workflowRun.status}` : ""
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$2.statRow, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$2.statChip, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$2.statValue, children: contextSummary.messageCount }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$2.statLabel, children: "消息" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$2.statChip, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$2.statValue, children: contextSummary.taskCount }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$2.statLabel, children: "节点" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$2.statChip, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$2.statValue, children: contextSummary.session.tokenUsed.toLocaleString("zh-CN") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$2.statLabel, children: "Token" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$2.paneSwitch, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          Segmented,
          {
            value: pane,
            onChange: setPane,
            className: styles$2.paneSegmented,
            options: [
              {
                value: "nodes",
                label: /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: styles$2.paneOption, children: [
                  "节点轨迹",
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$2.paneBadge, children: nodeContexts.length })
                ] })
              },
              {
                value: "overview",
                label: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$2.paneOption, children: "会话概览" })
              }
            ]
          }
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$2.paneContent, children: pane === "overview" ? /* @__PURE__ */ jsxRuntimeExports.jsx(OverviewPane, { summary: contextSummary }) : /* @__PURE__ */ jsxRuntimeExports.jsx(NodesPane, { nodes: nodeContexts }) })
      ] }) : !loading ? /* @__PURE__ */ jsxRuntimeExports.jsx(Empty, { description: "暂无上下文", className: styles$2.emptyState }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$2.loadingPlaceholder }) })
    }
  );
}
const page = "_page_1rwt2_3";
const toolbar = "_toolbar_1rwt2_25";
const toolbarRight = "_toolbarRight_1rwt2_38";
const resultCount = "_resultCount_1rwt2_46";
const searchInput = "_searchInput_1rwt2_52";
const sortSelect = "_sortSelect_1rwt2_56";
const body = "_body_1rwt2_61";
const list = "_list_1rwt2_72";
const empty = "_empty_1rwt2_78";
const pagination = "_pagination_1rwt2_88";
const sessionCard = "_sessionCard_1rwt2_115";
const sessionCardSelected = "_sessionCardSelected_1rwt2_137";
const sessionCardMain = "_sessionCardMain_1rwt2_142";
const sessionAvatar = "_sessionAvatar_1rwt2_149";
const sessionInfo = "_sessionInfo_1rwt2_160";
const sessionTitleRow = "_sessionTitleRow_1rwt2_168";
const sessionTitle = "_sessionTitle_1rwt2_168";
const sessionMeta = "_sessionMeta_1rwt2_187";
const sessionMetaItem = "_sessionMetaItem_1rwt2_196";
const sessionAside = "_sessionAside_1rwt2_202";
const sessionTime = "_sessionTime_1rwt2_209";
const sessionActions = "_sessionActions_1rwt2_217";
const tone_chat = "_tone_chat_1rwt2_224";
const tone_publish = "_tone_publish_1rwt2_229";
const tone_schedule = "_tone_schedule_1rwt2_234";
const tone_workflow = "_tone_workflow_1rwt2_239";
const typeTag = "_typeTag_1rwt2_245";
const typeTag_chat = "_typeTag_chat_1rwt2_255";
const typeTag_publish = "_typeTag_publish_1rwt2_260";
const typeTag_schedule = "_typeTag_schedule_1rwt2_265";
const typeTag_workflow = "_typeTag_workflow_1rwt2_270";
const styles$1 = {
  page,
  toolbar,
  toolbarRight,
  resultCount,
  searchInput,
  sortSelect,
  body,
  list,
  empty,
  pagination,
  sessionCard,
  sessionCardSelected,
  sessionCardMain,
  sessionAvatar,
  sessionInfo,
  sessionTitleRow,
  sessionTitle,
  sessionMeta,
  sessionMetaItem,
  sessionAside,
  sessionTime,
  sessionActions,
  tone_chat,
  tone_publish,
  tone_schedule,
  tone_workflow,
  typeTag,
  typeTag_chat,
  typeTag_publish,
  typeTag_schedule,
  typeTag_workflow
};
const DEFAULT_PAGE_SIZE = 12;
const PAGE_SIZE_OPTIONS = [12, 24, 48, 96];
function formatTime(ts) {
  return new Date(ts).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}
function formatRelativeTime(ts) {
  const diff = Date.now() - ts;
  const minutes = Math.floor(diff / 6e4);
  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} 天前`;
  return formatTime(ts);
}
function matchSessionQuery(session, query) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return session.title.toLowerCase().includes(q) || session.id.toLowerCase().includes(q);
}
function sortSessions(list2, sort) {
  const next = [...list2];
  switch (sort) {
    case "updated_asc":
      return next.sort((a, b) => a.updatedAt - b.updatedAt);
    case "token_desc":
      return next.sort((a, b) => b.tokenUsed - a.tokenUsed);
    default:
      return next.sort((a, b) => b.updatedAt - a.updatedAt);
  }
}
function querySessionToneClass(type) {
  switch (type) {
    case "publish":
      return styles$1.tone_publish;
    case "schedule":
      return styles$1.tone_schedule;
    case "workflow":
      return styles$1.tone_workflow;
    default:
      return styles$1.tone_chat;
  }
}
function querySessionTypeTagClass(type) {
  switch (type) {
    case "publish":
      return styles$1.typeTag_publish;
    case "schedule":
      return styles$1.typeTag_schedule;
    case "workflow":
      return styles$1.typeTag_workflow;
    default:
      return styles$1.typeTag_chat;
  }
}
function HistorySessionCard({
  session,
  index,
  selected,
  onSelect,
  onViewContext,
  onDelete
}) {
  const type = querySessionType(session);
  const title = session.title || "未命名对话";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "article",
    {
      className: `${styles$1.sessionCard} ${selected ? styles$1.sessionCardSelected : ""}`,
      style: { "--card-index": index },
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Checkbox,
          {
            checked: selected,
            onChange: (e) => onSelect(session.id, e.target.checked),
            "aria-label": `选择对话 ${title}`
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$1.sessionCardMain, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `${styles$1.sessionAvatar} ${querySessionToneClass(type)}`, children: SESSION_TYPE_ICONS[type] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$1.sessionInfo, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$1.sessionTitleRow, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, { title, children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$1.sessionTitle, children: title }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Tag, { className: `${styles$1.typeTag} ${querySessionTypeTagClass(type)}`, children: querySessionTypeLabel(type) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$1.sessionMeta, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: styles$1.sessionMetaItem, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$5, {}),
                session.messages.length,
                " 条消息"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: styles$1.sessionMetaItem, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$6, {}),
                session.tasks?.length ?? 0,
                " 个节点"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: styles$1.sessionMetaItem, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$7, {}),
                session.tokenUsed.toLocaleString("zh-CN"),
                " Token"
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$1.sessionAside, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, { title: formatTime(session.updatedAt), children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$1.sessionTime, children: formatRelativeTime(session.updatedAt) }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$1.sessionActions, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, { title: "查看上下文", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                type: "text",
                size: "small",
                icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$8, {}),
                onClick: () => onViewContext(session)
              }
            ) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Popconfirm,
              {
                title: "确定删除该对话？",
                description: "删除后不可恢复，关联的工作流上下文记录仍会保留。",
                onConfirm: () => onDelete(session.id),
                okText: "删除",
                cancelText: "取消",
                okButtonProps: { danger: true },
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "text", size: "small", danger: true, icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$3, {}) })
              }
            )
          ] })
        ] })
      ]
    }
  );
}
function HistoryConversations({
  onHeaderChange
}) {
  const sessions = useSessionStore((s) => s.sessions);
  const hydrate = useSessionStore((s) => s.hydrate);
  const removeSession = useSessionStore((s) => s.removeSession);
  const [search, setSearch] = reactExports.useState("");
  const [typeFilter, setTypeFilter] = reactExports.useState("all");
  const [sort, setSort] = reactExports.useState("updated_desc");
  const [page2, setPage] = reactExports.useState(1);
  const [pageSize, setPageSize] = reactExports.useState(DEFAULT_PAGE_SIZE);
  const [selectedIds, setSelectedIds] = reactExports.useState([]);
  const [refreshing, setRefreshing] = reactExports.useState(false);
  const [deleting, setDeleting] = reactExports.useState(false);
  const [drawerOpen, setDrawerOpen] = reactExports.useState(false);
  const [drawerLoading, setDrawerLoading] = reactExports.useState(false);
  const [contextSummary, setContextSummary] = reactExports.useState(null);
  const [nodeContexts, setNodeContexts] = reactExports.useState([]);
  reactExports.useEffect(() => {
    void hydrate();
  }, [hydrate]);
  reactExports.useEffect(() => {
    setPage(1);
  }, [search, typeFilter, sort]);
  const filteredSessions = reactExports.useMemo(() => {
    let list2 = sessions.filter((s) => matchSessionQuery(s, search));
    if (typeFilter !== "all") {
      list2 = list2.filter((s) => querySessionType(s) === typeFilter);
    }
    return sortSessions(list2, sort);
  }, [sessions, search, typeFilter, sort]);
  reactExports.useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(filteredSessions.length / pageSize));
    if (page2 > maxPage) {
      setPage(maxPage);
    }
  }, [filteredSessions.length, page2, pageSize]);
  const pagedSessions = reactExports.useMemo(() => {
    const start = (page2 - 1) * pageSize;
    return filteredSessions.slice(start, start + pageSize);
  }, [filteredSessions, page2, pageSize]);
  const handlePaginationChange = (nextPage, nextPageSize) => {
    setPage(nextPage);
    if (nextPageSize !== pageSize) {
      setPageSize(nextPageSize);
    }
  };
  const handleRefresh = reactExports.useCallback(async () => {
    setRefreshing(true);
    try {
      await hydrate();
      appMessage.success("已刷新");
    } finally {
      setRefreshing(false);
    }
  }, [hydrate]);
  reactExports.useEffect(() => {
    onHeaderChange?.({
      count: filteredSessions.length,
      refreshing,
      onRefresh: handleRefresh
    });
    return () => onHeaderChange?.(null);
  }, [filteredSessions.length, refreshing, handleRefresh, onHeaderChange]);
  const handleViewContext = async (session) => {
    setDrawerOpen(true);
    setDrawerLoading(true);
    setContextSummary(null);
    setNodeContexts([]);
    try {
      const workflowRun = await queryLatestWorkflowRunBySession(session.id);
      const summary2 = querySessionContextSummary(session, workflowRun);
      const nodes = queryNodeExecutionContexts(session, workflowRun);
      setContextSummary(summary2);
      setNodeContexts(nodes);
    } catch (err) {
      appMessage.error(err instanceof Error ? err.message : "加载上下文失败");
      setDrawerOpen(false);
    } finally {
      setDrawerLoading(false);
    }
  };
  const handleSelectOne = (id, checked) => {
    setSelectedIds(
      (prev) => checked ? [...prev, id] : prev.filter((item) => item !== id)
    );
  };
  const handleSelectPage = (checked) => {
    const pageIds = pagedSessions.map((s) => s.id);
    if (checked) {
      setSelectedIds((prev) => [.../* @__PURE__ */ new Set([...prev, ...pageIds])]);
    } else {
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    }
  };
  const handleDeleteOne = async (id) => {
    try {
      await removeSession(id);
      setSelectedIds((keys) => keys.filter((k) => k !== id));
      appMessage.success("已删除");
    } catch (err) {
      appMessage.error(err instanceof Error ? err.message : "删除失败");
    }
  };
  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    const count = selectedIds.length;
    setDeleting(true);
    try {
      for (const id of selectedIds) {
        await removeSession(id);
      }
      setSelectedIds([]);
      appMessage.success(`已删除 ${count} 条对话`);
    } catch (err) {
      appMessage.error(err instanceof Error ? err.message : "批量删除失败");
    } finally {
      setDeleting(false);
    }
  };
  const pageAllSelected = pagedSessions.length > 0 && pagedSessions.every((s) => selectedIds.includes(s.id));
  const pageIndeterminate = pagedSessions.some((s) => selectedIds.includes(s.id)) && !pageAllSelected;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$1.page, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$1.toolbar, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Segmented,
        {
          value: typeFilter,
          onChange: (v) => setTypeFilter(v),
          options: SESSION_TYPE_FILTER_OPTIONS
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$1.toolbarRight, children: [
        pagedSessions.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          Checkbox,
          {
            checked: pageAllSelected,
            indeterminate: pageIndeterminate,
            onChange: (e) => handleSelectPage(e.target.checked),
            children: "本页全选"
          }
        ) : null,
        selectedIds.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          Popconfirm,
          {
            title: `确定删除选中的 ${selectedIds.length} 条对话？`,
            onConfirm: () => void handleBatchDelete(),
            okText: "批量删除",
            cancelText: "取消",
            okButtonProps: { danger: true },
            children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { danger: true, loading: deleting, icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$3, {}), children: [
              "删除 (",
              selectedIds.length,
              ")"
            ] })
          }
        ) : null,
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: styles$1.resultCount, children: [
          filteredSessions.length,
          " 条"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            allowClear: true,
            prefix: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$4, {}),
            placeholder: "搜索标题或 ID",
            value: search,
            onChange: (e) => setSearch(e.target.value),
            className: styles$1.searchInput
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Select,
          {
            value: sort,
            onChange: setSort,
            className: styles$1.sortSelect,
            options: [
              { label: "最近更新", value: "updated_desc" },
              { label: "最早更新", value: "updated_asc" },
              { label: "Token 用量", value: "token_desc" }
            ]
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$1.body, children: filteredSessions.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(
      Empty,
      {
        image: Empty.PRESENTED_IMAGE_SIMPLE,
        description: search || typeFilter !== "all" ? "没有匹配的对话" : "暂无历史对话",
        className: styles$1.empty
      }
    ) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$1.list, children: pagedSessions.map((session, index) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      HistorySessionCard,
      {
        session,
        index,
        selected: selectedIds.includes(session.id),
        onSelect: handleSelectOne,
        onViewContext: (s) => void handleViewContext(s),
        onDelete: (id) => void handleDeleteOne(id)
      },
      session.id
    )) }) }),
    filteredSessions.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("footer", { className: styles$1.pagination, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      Pagination,
      {
        current: page2,
        pageSize,
        total: filteredSessions.length,
        showSizeChanger: true,
        showQuickJumper: true,
        pageSizeOptions: PAGE_SIZE_OPTIONS,
        showTotal: (total, range) => total > 0 ? `第 ${range[0]}-${range[1]} 条，共 ${total} 条` : "共 0 条",
        onChange: handlePaginationChange
      }
    ) }) : null,
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      SessionContextDrawer,
      {
        open: drawerOpen,
        loading: drawerLoading,
        contextSummary,
        nodeContexts,
        onClose: () => setDrawerOpen(false)
      }
    )
  ] });
}
const panel = "_panel_zsppr_3";
const header = "_header_zsppr_25";
const headerLeft = "_headerLeft_zsppr_37";
const headerCenter = "_headerCenter_zsppr_45";
const headerRight = "_headerRight_zsppr_49";
const modeSwitch = "_modeSwitch_zsppr_53";
const modeLabel = "_modeLabel_zsppr_76";
const content = "_content_zsppr_80";
const styles = {
  panel,
  header,
  headerLeft,
  headerCenter,
  headerRight,
  modeSwitch,
  modeLabel,
  content
};
function BusinessPanel() {
  const setView = useAppStore((s) => s.setView);
  const activeMenu = useBusinessStore((s) => s.activeMenu);
  const [historyHeader, setHistoryHeader] = reactExports.useState(null);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles.panel, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: `${styles.header} app-drag`, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles.headerLeft, children: activeMenu === "history" && historyHeader ? /* @__PURE__ */ jsxRuntimeExports.jsx(
        FeaturePageHeader,
        {
          variant: "embedded",
          draggable: false,
          icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$9, {}),
          title: "历史对话",
          badge: historyHeader.count,
          description: "管理全部会话记录，查看工作流 context 与各节点执行上下文"
        }
      ) : null }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `${styles.headerCenter} app-no-drag`, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        Segmented,
        {
          className: styles.modeSwitch,
          options: [
            { label: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles.modeLabel, children: "灵犀AI助手" }), value: "assistant" },
            { label: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles.modeLabel, children: "业务系统" }), value: "business" }
          ],
          value: "business",
          onChange: (value) => {
            if (value === "assistant") setView("chat");
          }
        }
      ) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `${styles.headerRight} app-no-drag`, children: activeMenu === "history" && historyHeader ? /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$a, {}),
          loading: historyHeader.refreshing,
          onClick: () => void historyHeader.onRefresh(),
          children: "刷新"
        }
      ) : null })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("main", { className: styles.content, children: activeMenu === "history" ? /* @__PURE__ */ jsxRuntimeExports.jsx(HistoryConversations, { onHeaderChange: setHistoryHeader }) : null })
  ] });
}
export {
  BusinessPanel
};
