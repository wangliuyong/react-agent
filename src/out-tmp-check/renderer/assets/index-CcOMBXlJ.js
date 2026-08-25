const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./index-CUhl89-q.js","./index-BQnnWLUu.js","./vendor-xyflow-SxuD-EZ_.css","./index-BTx-WhL6.css","./index-DbNBeDpW.css"])))=>i.map(i=>d[i]);
import { B as querySessionType, aj as useAppStore, aq as useSessionStore, Y as useSettingsStore, bI as useScheduleStore, aL as usePublishStore, aM as useWorkflowsStore, cF as useRulesStore, cq as queryAllProviderOptions, aE as RefIcon$1, cK as RefIcon$2, a4 as queryModelLabel, aI as FeaturePageHeader, T as Typography, E as Button, aK as RefIcon$3, d2 as RefIcon$4, ax as Tag, as as shellStyles, cD as RefIcon$5, aW as DB_THEME, ai as RefIcon$6, bv as RefIcon$8, aa as RefIcon$9, X as RefIcon$a, d3 as RefIcon$b, F as __vitePreload } from "./index-BQnnWLUu.js";
import { r as reactExports, j as jsxRuntimeExports } from "./vendor-xyflow-ByVkQ6-f.js";
import { u as useSkillsStore } from "./useSkillsStore-Bec86d-P.js";
import { q as queryBrowserStatus } from "./api-D5SC6S-F.js";
import { F as FeaturePageShell, a as FeatureScrollBody } from "./FeatureScrollBody-BTNfhjBJ.js";
import { R as RefIcon } from "./RocketOutlined-BDmQoSbW.js";
import { R as RefIcon$7 } from "./ApartmentOutlined-D1ymclVm.js";
const version = "0.1.19";
const appManifest = {
  version
};
const WORKBENCH_APP_VERSION = appManifest.version;
const SESSION_TYPE_LABELS = {
  chat: "对话",
  publish: "发布",
  schedule: "定时",
  workflow: "流程"
};
function queryWorkbenchSessionSlices(sessions) {
  return sessions.map((s) => ({
    id: s.id,
    title: s.title || "未命名会话",
    tokenUsed: s.tokenUsed ?? 0,
    type: querySessionType(s),
    createdAt: s.createdAt,
    updatedAt: s.updatedAt
  }));
}
function queryTotalTokenUsed(slices) {
  return slices.reduce((sum, s) => sum + (s.tokenUsed > 0 ? s.tokenUsed : 0), 0);
}
function queryRecentDayLabels(days) {
  const labels = [];
  const now = /* @__PURE__ */ new Date();
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    labels.push(`${d.getMonth() + 1}/${d.getDate()}`);
  }
  return labels;
}
function querySessionActivityByDay(slices, days) {
  const buckets = new Array(days).fill(0);
  const now = /* @__PURE__ */ new Date();
  now.setHours(0, 0, 0, 0);
  const startMs = now.getTime() - (days - 1) * 24 * 60 * 60 * 1e3;
  for (const slice of slices) {
    const t = slice.updatedAt || slice.createdAt;
    if (t < startMs) continue;
    const dayStart = new Date(t);
    dayStart.setHours(0, 0, 0, 0);
    const index = Math.round((dayStart.getTime() - startMs) / (24 * 60 * 60 * 1e3));
    if (index >= 0 && index < days) {
      buckets[index] += 1;
    }
  }
  return buckets;
}
function querySessionTypeBreakdown(slices) {
  const counts = {
    chat: 0,
    publish: 0,
    schedule: 0,
    workflow: 0
  };
  for (const slice of slices) {
    counts[slice.type] += 1;
  }
  return Object.keys(counts).map((type) => ({ name: SESSION_TYPE_LABELS[type], value: counts[type] })).filter((item) => item.value > 0);
}
function queryTopSessionsByToken(slices, limit) {
  return [...slices].filter((s) => s.tokenUsed > 0).sort((a, b) => b.tokenUsed - a.tokenUsed).slice(0, limit).map((s) => ({
    title: s.title.length > 14 ? `${s.title.slice(0, 14)}…` : s.title,
    tokens: s.tokenUsed
  }));
}
function formatWorkbenchCount(value) {
  if (!Number.isFinite(value)) return "0";
  return value.toLocaleString("zh-CN");
}
const shell = "_shell_11fhn_3";
const headerExtra = "_headerExtra_11fhn_7";
const refreshHint = "_refreshHint_11fhn_14";
const section = "_section_11fhn_96";
const sectionHead = "_sectionHead_11fhn_100";
const sectionTitle = "_sectionTitle_11fhn_108";
const sectionDesc = "_sectionDesc_11fhn_115";
const entryGrid = "_entryGrid_11fhn_119";
const entryCard = "_entryCard_11fhn_125";
const entryIcon = "_entryIcon_11fhn_147";
const entryTitle = "_entryTitle_11fhn_174";
const entryDesc = "_entryDesc_11fhn_182";
const soonTag = "_soonTag_11fhn_189";
const split = "_split_11fhn_200";
const modelPanel = "_modelPanel_11fhn_207";
const modelGrid = "_modelGrid_11fhn_214";
const modelRow = "_modelRow_11fhn_221";
const modelLink = "_modelLink_11fhn_241";
const envList = "_envList_11fhn_246";
const styles = {
  shell,
  headerExtra,
  refreshHint,
  section,
  sectionHead,
  sectionTitle,
  sectionDesc,
  entryGrid,
  entryCard,
  entryIcon,
  entryTitle,
  entryDesc,
  soonTag,
  split,
  modelPanel,
  modelGrid,
  modelRow,
  modelLink,
  envList
};
const { Text } = Typography;
const WorkbenchCharts = reactExports.lazy(
  () => __vitePreload(() => import("./index-CUhl89-q.js"), true ? __vite__mapDeps([0,1,2,3,4]) : void 0, import.meta.url).then((m) => ({ default: m.WorkbenchCharts }))
);
const QUICK_ENTRIES = [
  {
    key: "chat",
    title: "智能对话",
    description: "与灵犀助手协作、执行任务",
    icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$1, {}),
    tone: "primary"
  },
  {
    key: "publish",
    title: "发布工作台",
    description: "编排内容发布计划与子任务",
    icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$6, {}),
    tone: "neutral"
  },
  {
    key: "workflows",
    title: "流程编排",
    description: "可视化自动化与节点执行",
    icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$7, {}),
    tone: "neutral"
  },
  {
    key: "schedule",
    title: "定时任务",
    description: "计划触发与后台执行",
    icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$8, {}),
    tone: "neutral"
  },
  {
    key: "skills",
    title: "技能市场",
    description: "项目技能与模板管理",
    icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$9, {}),
    tone: "neutral"
  },
  {
    key: "remotion-video",
    title: "Remotion 视频生产",
    description: "模板化成片、分类管理与批量渲染",
    icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$a, {}),
    tone: "neutral"
  },
  {
    key: "ai-video",
    title: "AI 视频画布",
    description: "ComfyUI 无限画布：编剧到成片",
    icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$b, {}),
    tone: "neutral"
  }
];
const CHART_DAYS = 7;
const TOP_SESSION_LIMIT = 8;
function WorkbenchPage() {
  const setView = useAppStore((s) => s.setView);
  const sessions = useSessionStore((s) => s.sessions);
  const settings = useSettingsStore((s) => s.settings);
  const settingsLoaded = useSettingsStore((s) => s.loaded);
  const schedules = useScheduleStore((s) => s.tasks);
  const plans = usePublishStore((s) => s.plans);
  const skills = useSkillsStore((s) => s.skills);
  const workflows = useWorkflowsStore((s) => s.workflows);
  const rules = useRulesStore((s) => s.rules);
  const [browserRunning, setBrowserRunning] = reactExports.useState(false);
  const [browserUrl, setBrowserUrl] = reactExports.useState("");
  const [refreshing, setRefreshing] = reactExports.useState(false);
  const [lastRefreshAt, setLastRefreshAt] = reactExports.useState(() => Date.now());
  const sessionSlices = reactExports.useMemo(() => queryWorkbenchSessionSlices(sessions), [sessions]);
  const totalTokens = reactExports.useMemo(() => queryTotalTokenUsed(sessionSlices), [sessionSlices]);
  const dayLabels = reactExports.useMemo(() => queryRecentDayLabels(CHART_DAYS), []);
  const activitySeries = reactExports.useMemo(
    () => querySessionActivityByDay(sessionSlices, CHART_DAYS),
    [sessionSlices]
  );
  const typeBreakdown = reactExports.useMemo(
    () => querySessionTypeBreakdown(sessionSlices),
    [sessionSlices]
  );
  const topSessions = reactExports.useMemo(
    () => queryTopSessionsByToken(sessionSlices, TOP_SESSION_LIMIT),
    [sessionSlices]
  );
  const providerCount = queryAllProviderOptions(settings.customProviders ?? []).length;
  const connectionCount = settings.connections?.length ?? 0;
  const enabledSkills = skills.filter((s) => s.enabled).length;
  const enabledSchedules = schedules.filter((t) => t.enabled).length;
  const syncRuntime = reactExports.useCallback(async () => {
    try {
      const status = await queryBrowserStatus();
      setBrowserRunning(status.running);
      setBrowserUrl(status.url || "");
    } catch {
      setBrowserRunning(false);
      setBrowserUrl("");
    }
  }, []);
  reactExports.useEffect(() => {
    void syncRuntime();
  }, [syncRuntime]);
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await syncRuntime();
      setLastRefreshAt(Date.now());
    } finally {
      setRefreshing(false);
    }
  };
  const handleQuickEntry = (entry) => {
    if (entry.key === "soon") return;
    setView(entry.key);
  };
  [
    {
      label: "应用版本",
      value: `v${WORKBENCH_APP_VERSION}`,
      hint: "Electron 桌面端",
      icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon, {})
    },
    {
      label: "会话总数",
      value: formatWorkbenchCount(sessions.length),
      hint: `${formatWorkbenchCount(totalTokens)} Token 累计`,
      icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$1, {})
    },
    // {
    //   label: '智能体浏览器',
    //   value: browserRunning ? '运行中' : '未启动',
    //   hint: browserRunning && browserUrl ? browserUrl : 'Playwright 有头窗口',
    //   icon: <GlobalOutlined />
    // },
    {
      label: "资源概览",
      value: `${plans.length} 发布 · ${workflows.length} 流程`,
      hint: `${enabledSchedules} 个定时启用 · ${rules.length} 条规则`,
      icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$2, {})
    }
  ];
  const modelRows = [
    { label: "默认模型", value: queryModelLabel(settings.model) },
    { label: "默认供应商", value: settings.provider },
    { label: "多模型连接", value: `${connectionCount} 条` },
    { label: "供应商登记", value: `${providerCount} 个` },
    { label: "思考模式", value: settings.thinkingEnabled ? "已开启" : "关闭" },
    { label: "完全访问", value: settings.fullAccess ? "已开启" : "关闭" },
    { label: "最大工具轮次", value: String(settings.maxTurns ?? 40) },
    { label: "已启用技能", value: `${enabledSkills} / ${skills.length}` }
  ];
  const refreshHint2 = new Date(lastRefreshAt).toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(FeaturePageShell, { className: styles.shell, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      FeaturePageHeader,
      {
        icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$4, {}),
        title: "工作台",
        badge: "概览",
        badgeVariant: "muted",
        description: "查看本机运行状态、模型配置与使用统计；更多能力将以卡片形式陆续接入。",
        extra: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles.headerExtra, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Text, { type: "secondary", className: styles.refreshHint, children: [
            "更新于 ",
            refreshHint2
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              type: "default",
              icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$3, {}),
              loading: refreshing,
              onClick: () => void handleRefresh(),
              children: "刷新"
            }
          )
        ] })
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(FeatureScrollBody, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: styles.section, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles.sectionHead, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: styles.sectionTitle, children: "快捷入口" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Text, { type: "secondary", className: styles.sectionDesc, children: "已上线功能可一键跳转；灰色卡片为后续规划占位" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles.entryGrid, children: QUICK_ENTRIES.map((entry, index) => {
          const isSoon = entry.key === "soon";
          return /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              type: "button",
              className: styles.entryCard,
              "data-tone": entry.tone,
              "data-disabled": isSoon || void 0,
              disabled: isSoon,
              onClick: () => handleQuickEntry(entry),
              style: { "--card-index": index },
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles.entryIcon, children: entry.icon }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles.entryTitle, children: entry.title }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles.entryDesc, children: entry.description }),
                isSoon ? /* @__PURE__ */ jsxRuntimeExports.jsx(Tag, { className: styles.soonTag, children: "即将推出" }) : null
              ]
            },
            `${entry.title}-${index}`
          );
        }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles.split, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: styles.section, "aria-label": "模型使用情况", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles.sectionHead, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: styles.sectionTitle, children: "模型与 Agent" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Text, { type: "secondary", className: styles.sectionDesc, children: "摘自当前设置；修改请前往「设置 → 模型与 API」" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles.modelPanel, children: [
            !settingsLoaded ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: shellStyles.pageLoading, role: "status", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: shellStyles.pageLoadingSpinner, "aria-hidden": true }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: shellStyles.pageLoadingText, children: "加载设置…" })
            ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("dl", { className: styles.modelGrid, children: modelRows.map((row) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles.modelRow, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("dt", { children: row.label }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("dd", { children: row.value })
            ] }, row.label)) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                type: "link",
                className: styles.modelLink,
                icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$5, {}),
                onClick: () => setView("settings"),
                children: "打开设置"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: styles.section, "aria-label": "环境信息", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles.sectionHead, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: styles.sectionTitle, children: "运行环境" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Text, { type: "secondary", className: styles.sectionDesc, children: "渲染进程可读信息（无需额外权限）" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: styles.envList, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "用户代理" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("code", { title: navigator.userAgent, children: [
                navigator.userAgent.slice(0, 48),
                "…"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "语言 / 时区" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("code", { children: [
                navigator.language,
                " · ",
                Intl.DateTimeFormat().resolvedOptions().timeZone
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "屏幕" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("code", { children: [
                window.screen.width,
                "×",
                window.screen.height,
                " ·",
                " ",
                window.devicePixelRatio,
                "x DPR"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "主题主色" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("code", { style: { color: DB_THEME.primary }, children: DB_THEME.primary })
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: styles.section, "aria-label": "统计图表", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles.sectionHead, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: styles.sectionTitle, children: "使用统计" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Text, { type: "secondary", className: styles.sectionDesc, children: "基于本地会话数据聚合；Token 仅统计与模型交互（优先 usage，否则按中英文字符估算）" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          reactExports.Suspense,
          {
            fallback: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: shellStyles.pageLoading, role: "status", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: shellStyles.pageLoadingSpinner, "aria-hidden": true }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: shellStyles.pageLoadingText, children: "加载图表…" })
            ] }),
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              WorkbenchCharts,
              {
                dayLabels,
                activitySeries,
                typeBreakdown,
                topSessions
              }
            )
          }
        )
      ] })
    ] })
  ] });
}
export {
  WorkbenchPage
};
