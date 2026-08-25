import { r as reactExports, j as jsxRuntimeExports, H as Handle, P as Position, i as applyNodeChanges, k as applyEdgeChanges, l as addEdge, M as MarkerType, m as index, B as Background, C as Controls, n as MiniMap } from "./vendor-xyflow-ByVkQ6-f.js";
import { I as Icon, d as _extends, d4 as create, aj as useAppStore, aI as FeaturePageHeader, E as Button, at as RefIcon$1, X as RefIcon$2, as as shellStyles, aK as RefIcon$3, S as Spin, aw as Empty, D as appMessage, ax as Tag, aA as Popconfirm, aB as RefIcon$4, av as Drawer, ah as Input, ab as Select } from "./index-BQnnWLUu.js";
import { F as FeaturePageShell, a as FeatureScrollBody } from "./FeatureScrollBody-BTNfhjBJ.js";
import { F as FeaturePageToolbar } from "./FeaturePageToolbar-DU3L1YVp.js";
import { A as Alert } from "./index-BCCKOrpo.js";
import { R as RefIcon$5 } from "./PlayCircleOutlined-y8OhbKwX.js";
import { D as Dropdown } from "./index-DdgcjpRF.js";
import "./LeftOutlined-DLcljnsf.js";
var ArrowLeftOutlined$1 = { "icon": { "tag": "svg", "attrs": { "viewBox": "64 64 896 896", "focusable": "false" }, "children": [{ "tag": "path", "attrs": { "d": "M872 474H286.9l350.2-304c5.6-4.9 2.2-14-5.2-14h-88.5c-3.9 0-7.6 1.4-10.5 3.9L155 487.8a31.96 31.96 0 000 48.3L535.1 866c1.5 1.3 3.3 2 5.2 2h91.5c7.4 0 10.8-9.2 5.2-14L286.9 550H872c4.4 0 8-3.6 8-8v-60c0-4.4-3.6-8-8-8z" } }] }, "name": "arrow-left", "theme": "outlined" };
var ArrowLeftOutlined = function ArrowLeftOutlined2(props, ref) {
  return /* @__PURE__ */ reactExports.createElement(Icon, _extends({}, props, {
    ref,
    icon: ArrowLeftOutlined$1
  }));
};
var RefIcon = /* @__PURE__ */ reactExports.forwardRef(ArrowLeftOutlined);
const AI_VIDEO_DEFAULT_WORKFLOWS = {
  textToImage: "blueprints/Text to Image (Z-Image-Turbo).json",
  storyboard: "user/flux1_dev_uso_reference_image_gen.json",
  videoR2v: "user/video_minimax_h3_r2v.json",
  mergeVideos: "blueprints/Merge Videos.json"
};
function queryAiVideoBaseType(kind2) {
  if (kind2 === "screenwriter" || kind2 === "script_text" || kind2 === "storyboard_text") {
    return "text";
  }
  if (kind2 === "video_gen" || kind2 === "video_merge") {
    return "video";
  }
  return "image";
}
function queryAiVideoDefaultWorkflow(kind2) {
  switch (kind2) {
    case "character":
    case "scene":
    case "prop":
      return AI_VIDEO_DEFAULT_WORKFLOWS.textToImage;
    case "character_views":
    case "storyboard":
      return AI_VIDEO_DEFAULT_WORKFLOWS.storyboard;
    case "video_gen":
      return AI_VIDEO_DEFAULT_WORKFLOWS.videoR2v;
    case "video_merge":
      return AI_VIDEO_DEFAULT_WORKFLOWS.mergeVideos;
    default:
      return void 0;
  }
}
const AI_VIDEO_KIND_LABEL = {
  screenwriter: "编剧",
  script_text: "剧本",
  character: "角色定妆",
  character_views: "角色三视图",
  scene: "场景",
  prop: "道具",
  storyboard: "分镜",
  storyboard_text: "分镜文本",
  video_gen: "生成视频",
  video_merge: "合成视频"
};
const AI_VIDEO_REF_KINDS = [
  "character_views",
  "scene",
  "prop"
];
async function queryAiVideoProjects() {
  return window.api.queryAiVideoProjects();
}
async function queryAiVideoProject(id) {
  return window.api.queryAiVideoProject(id);
}
async function postAiVideoProject(project) {
  return window.api.postAiVideoProject(project);
}
async function postDeleteAiVideoProject(id) {
  return window.api.postDeleteAiVideoProject(id);
}
async function postAiVideoNodeRun(req) {
  return window.api.postAiVideoNodeRun(req);
}
async function postAiVideoCanvasRun(req) {
  return window.api.postAiVideoCanvasRun(req);
}
async function postAiVideoAbortRun(projectId) {
  return window.api.postAiVideoAbortRun(projectId);
}
function onAiVideoNodeEvent(cb) {
  return window.api.onAiVideoNodeEvent(cb);
}
async function queryComfyWorkflows() {
  return window.api.queryComfyWorkflows();
}
async function postCreateAiVideoProject(title2) {
  const id = crypto.randomUUID();
  const now = Date.now();
  const screenwriterId = crypto.randomUUID();
  const project = {
    id,
    title: title2?.trim() || `AI 视频 ${(/* @__PURE__ */ new Date()).toLocaleString("zh-CN")}`,
    createdAt: now,
    updatedAt: now,
    globalSkillIds: [],
    canvas: {
      nodes: [
        {
          id: screenwriterId,
          title: AI_VIDEO_KIND_LABEL.screenwriter,
          type: queryAiVideoBaseType("screenwriter"),
          kind: "screenwriter",
          position: { x: 80, y: 160 },
          prompt: "",
          status: "idle"
        }
      ],
      edges: [],
      viewport: { x: 0, y: 0, zoom: 1 }
    }
  };
  return postAiVideoProject(project);
}
const useAiVideoStore = create((set, get) => ({
  projects: [],
  activeProject: null,
  loaded: false,
  saving: false,
  hydrate: async () => {
    const projects = await queryAiVideoProjects();
    set({ projects, loaded: true });
  },
  postCreate: async (title2) => {
    const project = await postCreateAiVideoProject(title2);
    set((s) => ({
      projects: [project, ...s.projects.filter((p) => p.id !== project.id)],
      activeProject: project
    }));
    return project;
  },
  postOpen: async (id) => {
    const project = await queryAiVideoProject(id);
    if (project) set({ activeProject: project });
    return project;
  },
  postSave: async (project) => {
    set({ saving: true });
    try {
      const saved = await postAiVideoProject(project);
      set((s) => ({
        activeProject: saved,
        projects: [saved, ...s.projects.filter((p) => p.id !== saved.id)].sort(
          (a, b) => b.updatedAt - a.updatedAt
        ),
        saving: false
      }));
      return saved;
    } catch (err) {
      set({ saving: false });
      throw err;
    }
  },
  postDelete: async (id) => {
    await postDeleteAiVideoProject(id);
    set((s) => ({
      projects: s.projects.filter((p) => p.id !== id),
      activeProject: s.activeProject?.id === id ? null : s.activeProject
    }));
  },
  postApplyEvent: (event) => {
    if (event.project) {
      const project = event.project;
      set((s) => ({
        activeProject: s.activeProject?.id === project.id ? project : s.activeProject,
        projects: s.projects.map((p) => p.id === project.id ? project : p)
      }));
      return;
    }
    const { activeProject } = get();
    if (!activeProject || activeProject.id !== event.projectId) return;
    const nodes = activeProject.canvas.nodes.map(
      (n) => n.id === event.nodeId ? {
        ...n,
        status: event.status,
        errorMessage: event.errorMessage,
        result: event.result ?? n.result
      } : n
    );
    set({
      activeProject: {
        ...activeProject,
        canvas: { ...activeProject.canvas, nodes }
      }
    });
  },
  postSetActive: (project) => set({ activeProject: project })
}));
let unsubscribe = null;
function postBindAiVideoEvents() {
  if (unsubscribe) return;
  unsubscribe = onAiVideoNodeEvent((event) => {
    useAiVideoStore.getState().postApplyEvent(event);
  });
}
const grid = "_grid_o7vh8_1";
const projectCard = "_projectCard_o7vh8_8";
const cardMain = "_cardMain_o7vh8_29";
const thumb = "_thumb_o7vh8_41";
const thumbImg = "_thumbImg_o7vh8_54";
const thumbPlaceholder = "_thumbPlaceholder_o7vh8_60";
const body = "_body_o7vh8_66";
const title$1 = "_title_o7vh8_70";
const foot = "_foot_o7vh8_80";
const updated = "_updated_o7vh8_87";
const deleteBtn = "_deleteBtn_o7vh8_92";
const empty$1 = "_empty_o7vh8_99";
const styles$3 = {
  grid,
  projectCard,
  cardMain,
  thumb,
  thumbImg,
  thumbPlaceholder,
  body,
  title: title$1,
  foot,
  updated,
  deleteBtn,
  empty: empty$1
};
function ProjectCard({
  project,
  index: index2,
  onOpen,
  onDelete
}) {
  const [thumb2, setThumb] = reactExports.useState(null);
  const updatedLabel = new Date(project.updatedAt).toLocaleString("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
  reactExports.useEffect(() => {
    let cancelled = false;
    if (!project.thumbnailPath) {
      setThumb(null);
      return;
    }
    void window.api.queryLocalImageDataUrl(project.thumbnailPath).then((url) => {
      if (!cancelled) setThumb(url);
    });
    return () => {
      cancelled = true;
    };
  }, [project.thumbnailPath]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: styles$3.projectCard,
      style: { "--card-index": index2 },
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: styles$3.cardMain, onClick: () => onOpen(project), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$3.thumb, "aria-hidden": true, children: thumb2 ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: thumb2, alt: "", className: styles$3.thumbImg }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$3.thumbPlaceholder, children: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$2, {}) }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$3.body, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: styles$3.title, children: project.title }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$3.foot, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Tag, { bordered: false, children: [
                project.canvas.nodes.length,
                " 节点"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: styles$3.updated, children: [
                "更新 ",
                updatedLabel
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Popconfirm,
          {
            title: "删除此画布？",
            description: "将删除画布配置与本地生成产物",
            okText: "删除",
            cancelText: "取消",
            okButtonProps: { danger: true },
            onConfirm: (e) => {
              e?.stopPropagation();
              onDelete(project.id);
            },
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                type: "text",
                danger: true,
                size: "small",
                className: styles$3.deleteBtn,
                icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$4, {}),
                onClick: (e) => e.stopPropagation()
              }
            )
          }
        )
      ]
    }
  );
}
function AiVideoPage() {
  const setView = useAppStore((s) => s.setView);
  const projects = useAiVideoStore((s) => s.projects);
  const loaded = useAiVideoStore((s) => s.loaded);
  const hydrate = useAiVideoStore((s) => s.hydrate);
  const postCreate = useAiVideoStore((s) => s.postCreate);
  const postOpen = useAiVideoStore((s) => s.postOpen);
  const postDelete = useAiVideoStore((s) => s.postDelete);
  const [creating, setCreating] = reactExports.useState(false);
  reactExports.useEffect(() => {
    postBindAiVideoEvents();
    void hydrate();
  }, [hydrate]);
  const handleCreate = async () => {
    setCreating(true);
    try {
      const project = await postCreate();
      appMessage.success("已创建画布");
      setView("ai-video-canvas");
      void postOpen(project.id);
    } catch (err) {
      appMessage.error(err instanceof Error ? err.message : "创建失败");
    } finally {
      setCreating(false);
    }
  };
  const handleOpen = async (project) => {
    await postOpen(project.id);
    setView("ai-video-canvas");
  };
  const handleDelete = async (id) => {
    try {
      await postDelete(id);
      appMessage.success("已删除");
    } catch {
      appMessage.error("删除失败");
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(FeaturePageShell, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      FeaturePageHeader,
      {
        icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$2, {}),
        title: "AI 视频",
        badge: "ComfyUI",
        badgeVariant: "muted",
        description: "无限画布编排编剧→定妆/场景/道具→分镜→视频→成片，节点调用远程 ComfyUI 工作流",
        extra: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "primary", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$1, {}), loading: creating, onClick: () => void handleCreate(), children: "新增画布" })
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(FeaturePageToolbar, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: shellStyles.resultCount, children: loaded ? `${projects.length} 个项目` : "加载中…" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: shellStyles.toolbarRight, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$3, {}), onClick: () => void hydrate(), children: "刷新" }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(FeatureScrollBody, { children: !loaded ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$3.empty, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Spin, {}) }) : projects.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$3.empty, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Empty, { description: "还没有画布，点击右上角新增" }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$3.grid, children: projects.map((p, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      ProjectCard,
      {
        project: p,
        index: i,
        onOpen: (proj) => void handleOpen(proj),
        onDelete: (id) => void handleDelete(id)
      },
      p.id
    )) }) })
  ] });
}
const node = "_node_1ejgo_1";
const head = "_head_1ejgo_16";
const kind = "_kind_1ejgo_23";
const statusDot = "_statusDot_1ejgo_29";
const title = "_title_1ejgo_35";
const textPreview = "_textPreview_1ejgo_44";
const mediaPreview = "_mediaPreview_1ejgo_57";
const media = "_media_1ejgo_57";
const mediaPlaceholder = "_mediaPlaceholder_1ejgo_72";
const error = "_error_1ejgo_81";
const actions = "_actions_1ejgo_90";
const handle = "_handle_1ejgo_96";
const styles$2 = {
  node,
  head,
  kind,
  statusDot,
  title,
  textPreview,
  mediaPreview,
  media,
  mediaPlaceholder,
  error,
  actions,
  handle
};
const STATUS_COLOR = {
  idle: "var(--db-text-tertiary, #999)",
  running: "var(--db-primary, #1677ff)",
  success: "#52c41a",
  error: "#ff4d4f"
};
function AiVideoFlowNodeInner({ data, selected }) {
  const { node: node2, onRun, onSelect } = data;
  const [preview, setPreview] = reactExports.useState(null);
  reactExports.useEffect(() => {
    let cancelled = false;
    const path = node2.result?.localPath;
    if (!path || node2.type === "text") {
      setPreview(null);
      return;
    }
    const loader = node2.type === "video" ? window.api.queryLocalMediaUrl(path) : window.api.queryLocalImageDataUrl(path);
    void loader.then((url) => {
      if (!cancelled) setPreview(url);
    });
    return () => {
      cancelled = true;
    };
  }, [node2.result?.localPath, node2.type]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: styles$2.node,
      "data-selected": selected || void 0,
      "data-type": node2.type,
      onClick: () => onSelect?.(node2.id),
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Handle, { type: "target", position: Position.Left, className: styles$2.handle }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$2.head, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$2.kind, children: AI_VIDEO_KIND_LABEL[node2.kind] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "span",
            {
              className: styles$2.statusDot,
              style: { background: STATUS_COLOR[node2.status] ?? STATUS_COLOR.idle },
              title: node2.status
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$2.title, children: node2.title }),
        node2.type === "text" ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$2.textPreview, children: (node2.result?.text || node2.prompt || "（空）").slice(0, 160) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$2.mediaPreview, children: preview ? node2.type === "video" ? /* @__PURE__ */ jsxRuntimeExports.jsx("video", { src: preview, className: styles$2.media, muted: true, playsInline: true }) : /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: preview, alt: "", className: styles$2.media }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$2.mediaPlaceholder, children: node2.status === "running" ? /* @__PURE__ */ jsxRuntimeExports.jsx(Spin, { size: "small" }) : "暂无预览" }) }),
        node2.errorMessage ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$2.error, title: node2.errorMessage, children: node2.errorMessage.slice(0, 80) }) : null,
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$2.actions, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            size: "small",
            type: "link",
            loading: node2.status === "running",
            icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$3, {}),
            onClick: (e) => {
              e.stopPropagation();
              onRun?.(node2.id);
            },
            children: node2.status === "error" ? "重试" : "运行"
          }
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Handle, { type: "source", position: Position.Right, className: styles$2.handle })
      ]
    }
  );
}
const AiVideoFlowNode = reactExports.memo(AiVideoFlowNodeInner);
function queryLinkedRefCandidates(project, nodeId) {
  const upstreamIds = new Set(
    project.canvas.edges.filter((e) => e.target === nodeId).map((e) => e.source)
  );
  return project.canvas.nodes.filter(
    (n) => upstreamIds.has(n.id) && AI_VIDEO_REF_KINDS.includes(n.kind)
  );
}
function queryValidateRefsLocal(project, node2) {
  const allowed = new Set(queryLinkedRefCandidates(project, node2.id).map((n) => n.id));
  for (const id of node2.refs ?? []) {
    if (!allowed.has(id)) {
      return `非法 @ 引用：只能选择已连线的角色三视图/场景/道具`;
    }
  }
  return null;
}
const form = "_form_1whwc_1";
const label = "_label_1whwc_7";
const resultBox = "_resultBox_1whwc_14";
const pre = "_pre_1whwc_18";
const styles$1 = {
  form,
  label,
  resultBox,
  pre
};
function NodeInspector({
  open,
  project,
  node: node2,
  skills,
  onClose,
  onChange,
  onRun
}) {
  const [workflows, setWorkflows] = reactExports.useState([]);
  reactExports.useEffect(() => {
    if (!open) return;
    void queryComfyWorkflows().then(setWorkflows).catch(() => setWorkflows([]));
  }, [open]);
  const linkedRefCandidates = reactExports.useMemo(() => {
    if (!node2) return [];
    return queryLinkedRefCandidates(project, node2.id);
  }, [project, node2]);
  const refError = node2 ? queryValidateRefsLocal(project, node2) : null;
  if (!node2) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Drawer, { open, onClose, width: 380, title: "节点属性", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Empty, { description: "选择一个节点" }) });
  }
  const promptValue = node2.manualPrompt ?? node2.prompt;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Drawer,
    {
      open,
      onClose,
      width: 400,
      title: `${AI_VIDEO_KIND_LABEL[node2.kind]} · ${node2.title}`,
      extra: /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          type: "primary",
          icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$5, {}),
          loading: node2.status === "running",
          onClick: () => onRun(node2.id),
          children: node2.status === "error" ? "重试" : "重新生成"
        }
      ),
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$1.form, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: styles$1.label, children: "标题" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            value: node2.title,
            onChange: (e) => onChange({ ...node2, title: e.target.value })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: styles$1.label, children: "提示词 / 输入" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input.TextArea,
          {
            rows: 6,
            value: promptValue,
            placeholder: "支持 @ 引用已连线的角色三视图/场景/道具",
            onChange: (e) => onChange({
              ...node2,
              manualPrompt: e.target.value,
              prompt: e.target.value
            })
          }
        ),
        node2.type !== "text" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: styles$1.label, children: "ComfyUI 工作流" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Select,
            {
              showSearch: true,
              optionFilterProp: "label",
              value: node2.workflowId,
              placeholder: "选择工作流",
              style: { width: "100%" },
              options: workflows.map((w) => ({
                value: w.relativePath,
                label: `${w.category}/${w.name}`
              })),
              onChange: (v) => onChange({ ...node2, workflowId: v })
            }
          )
        ] }) : null,
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: styles$1.label, children: "节点 Skill" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Select,
          {
            mode: "multiple",
            allowClear: true,
            style: { width: "100%" },
            placeholder: "可选，叠加全局 skill",
            value: node2.skillIds ?? [],
            options: skills.map((s) => ({ value: s.id, label: s.name })),
            onChange: (ids) => onChange({ ...node2, skillIds: ids })
          }
        ),
        node2.kind === "storyboard" || node2.kind === "video_gen" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: styles$1.label, children: "@ 引用（仅已连线）" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Select,
            {
              mode: "multiple",
              allowClear: true,
              style: { width: "100%" },
              placeholder: linkedRefCandidates.length ? "选择参考图节点" : "请先连线角色三视图/场景/道具",
              value: node2.refs ?? [],
              options: linkedRefCandidates.map((n) => ({
                value: n.id,
                label: n.title
              })),
              onChange: (ids) => onChange({ ...node2, refs: ids })
            }
          ),
          refError ? /* @__PURE__ */ jsxRuntimeExports.jsx(Alert, { type: "warning", showIcon: true, message: refError }) : null
        ] }) : null,
        node2.errorMessage ? /* @__PURE__ */ jsxRuntimeExports.jsx(Alert, { type: "error", showIcon: true, message: node2.errorMessage }) : null,
        node2.result?.text ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$1.resultBox, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$1.label, children: "文本结果" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: styles$1.pre, children: node2.result.text })
        ] }) : null
      ] })
    }
  );
}
const page = "_page_19aqq_1";
const toolbar = "_toolbar_19aqq_10";
const left = "_left_19aqq_21";
const right = "_right_19aqq_22";
const center = "_center_19aqq_23";
const titleInput = "_titleInput_19aqq_35";
const skillLabel = "_skillLabel_19aqq_40";
const skillSelect = "_skillSelect_19aqq_46";
const canvas = "_canvas_19aqq_52";
const empty = "_empty_19aqq_58";
const styles = {
  page,
  toolbar,
  left,
  right,
  center,
  titleInput,
  skillLabel,
  skillSelect,
  canvas,
  empty
};
const nodeTypes = { aiVideo: AiVideoFlowNode };
const ADD_KINDS = [
  "screenwriter",
  "script_text",
  "character",
  "character_views",
  "scene",
  "prop",
  "storyboard",
  "storyboard_text",
  "video_gen",
  "video_merge"
];
function queryProjectToFlow(project, handlers) {
  const nodes = project.canvas.nodes.map((n) => ({
    id: n.id,
    type: "aiVideo",
    position: n.position,
    data: { node: n, onRun: handlers.onRun, onSelect: handlers.onSelect }
  }));
  const edges = project.canvas.edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    markerEnd: { type: MarkerType.ArrowClosed },
    animated: project.canvas.nodes.some(
      (n) => n.id === e.target && n.status === "running"
    )
  }));
  return { nodes, edges };
}
function queryFlowToProject(project, nodes, edges) {
  const byId = new Map(project.canvas.nodes.map((n) => [n.id, n]));
  const nextNodes = nodes.map((rn) => {
    const prev = byId.get(rn.id);
    const dataNode = rn.data?.node;
    const base = dataNode ?? prev;
    if (!base) {
      return {
        id: rn.id,
        title: "节点",
        type: "text",
        kind: "script_text",
        position: rn.position,
        prompt: "",
        status: "idle"
      };
    }
    return { ...base, position: rn.position };
  });
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
  };
}
function AiVideoCanvasPage() {
  const setView = useAppStore((s) => s.setView);
  const activeProject = useAiVideoStore((s) => s.activeProject);
  const postSave = useAiVideoStore((s) => s.postSave);
  const postOpen = useAiVideoStore((s) => s.postOpen);
  const postSetActive = useAiVideoStore((s) => s.postSetActive);
  const saving = useAiVideoStore((s) => s.saving);
  const [selectedId, setSelectedId] = reactExports.useState(null);
  const [inspectorOpen, setInspectorOpen] = reactExports.useState(false);
  const [skills, setSkills] = reactExports.useState([]);
  const [running, setRunning] = reactExports.useState(false);
  const [rfNodes, setRfNodes] = reactExports.useState([]);
  const [rfEdges, setRfEdges] = reactExports.useState([]);
  reactExports.useEffect(() => {
    postBindAiVideoEvents();
    void window.api.queryProjectSkills().then((list) => {
      setSkills(list.map((s) => ({ id: s.id, name: s.name })));
    });
  }, []);
  const runNodeRef = reactExports.useRef(async () => {
  });
  const selectNodeRef = reactExports.useRef(() => {
  });
  const handleRunNode = reactExports.useCallback(
    async (nodeId) => {
      if (!activeProject) return;
      const draft = queryFlowToProject(activeProject, rfNodes, rfEdges);
      await postSave(draft);
      setRunning(true);
      try {
        const res = await postAiVideoNodeRun({
          projectId: activeProject.id,
          nodeId,
          force: true
        });
        if (!res.ok) appMessage.error(res.message || "运行失败");
        await postOpen(activeProject.id);
      } finally {
        setRunning(false);
      }
    },
    [activeProject, rfNodes, rfEdges, postSave, postOpen]
  );
  runNodeRef.current = handleRunNode;
  selectNodeRef.current = (id) => {
    setSelectedId(id);
    setInspectorOpen(true);
  };
  const syncFromProject = reactExports.useCallback((project) => {
    const { nodes, edges } = queryProjectToFlow(project, {
      onRun: (id) => void runNodeRef.current(id),
      onSelect: (id) => selectNodeRef.current(id)
    });
    setRfNodes(nodes);
    setRfEdges(edges);
  }, []);
  reactExports.useEffect(() => {
    if (activeProject) {
      syncFromProject(activeProject);
    }
  }, [activeProject, syncFromProject]);
  const selectedNode = reactExports.useMemo(() => {
    if (!activeProject || !selectedId) return null;
    return activeProject.canvas.nodes.find((n) => n.id === selectedId) ?? null;
  }, [activeProject, selectedId]);
  const handleSave = async () => {
    if (!activeProject) return;
    const draft = queryFlowToProject(activeProject, rfNodes, rfEdges);
    await postSave(draft);
    appMessage.success("已保存");
  };
  const handleRunAll = async () => {
    if (!activeProject) return;
    await handleSave();
    setRunning(true);
    try {
      const res = await postAiVideoCanvasRun({ projectId: activeProject.id });
      if (!res.ok) appMessage.error(res.message || "批量运行失败");
      else appMessage.success("画布执行完成");
      await postOpen(activeProject.id);
    } finally {
      setRunning(false);
    }
  };
  const onNodesChange = reactExports.useCallback((changes) => {
    setRfNodes((nds) => applyNodeChanges(changes, nds));
  }, []);
  const onEdgesChange = reactExports.useCallback((changes) => {
    setRfEdges((eds) => applyEdgeChanges(changes, eds));
  }, []);
  const onConnect = reactExports.useCallback((connection) => {
    setRfEdges(
      (eds) => addEdge(
        {
          ...connection,
          id: `e-${connection.source}-${connection.target}-${Date.now()}`,
          markerEnd: { type: MarkerType.ArrowClosed }
        },
        eds
      )
    );
  }, []);
  const handleAddNode = (kind2) => {
    if (!activeProject) return;
    const id = crypto.randomUUID();
    const node2 = {
      id,
      title: AI_VIDEO_KIND_LABEL[kind2],
      type: queryAiVideoBaseType(kind2),
      kind: kind2,
      position: { x: 120 + Math.random() * 80, y: 120 + Math.random() * 80 },
      prompt: "",
      workflowId: queryAiVideoDefaultWorkflow(kind2),
      status: "idle"
    };
    const next = {
      ...activeProject,
      canvas: {
        ...activeProject.canvas,
        nodes: [...activeProject.canvas.nodes, node2]
      }
    };
    postSetActive(next);
  };
  const handleNodePatch = (patched) => {
    if (!activeProject) return;
    const withGraph = queryFlowToProject(activeProject, rfNodes, rfEdges);
    const next = {
      ...withGraph,
      canvas: {
        ...withGraph.canvas,
        nodes: withGraph.canvas.nodes.map((n) => n.id === patched.id ? patched : n)
      }
    };
    postSetActive(next);
  };
  const handleGlobalSkills = (ids) => {
    if (!activeProject) return;
    postSetActive({ ...activeProject, globalSkillIds: ids });
  };
  if (!activeProject) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles.empty, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Empty, { description: "未打开画布" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "primary", onClick: () => setView("ai-video"), children: "返回项目列表" })
    ] });
  }
  const addMenuItems = ADD_KINDS.map((kind2) => ({
    key: kind2,
    label: AI_VIDEO_KIND_LABEL[kind2],
    onClick: () => handleAddNode(kind2)
  }));
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles.page, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: styles.toolbar, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles.left, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            type: "text",
            icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon, {}),
            onClick: () => {
              void handleSave().finally(() => setView("ai-video"));
            },
            children: "返回"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            className: styles.titleInput,
            value: activeProject.title,
            onChange: (e) => postSetActive({ ...activeProject, title: e.target.value })
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles.center, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles.skillLabel, children: "全局 Skill" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Select,
          {
            mode: "multiple",
            allowClear: true,
            maxTagCount: 2,
            className: styles.skillSelect,
            placeholder: "对所有节点生效",
            value: activeProject.globalSkillIds,
            options: skills.map((s) => ({ value: s.id, label: s.name })),
            onChange: handleGlobalSkills
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles.right, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Dropdown, { menu: { items: addMenuItems }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$1, {}), children: "添加节点" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { loading: saving, onClick: () => void handleSave(), children: "保存" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            type: "primary",
            icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$5, {}),
            loading: running,
            onClick: () => void handleRunAll(),
            children: "运行全部"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            danger: true,
            disabled: !running,
            onClick: () => void postAiVideoAbortRun(activeProject.id),
            children: "取消"
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles.canvas, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
      index,
      {
        nodes: rfNodes,
        edges: rfEdges,
        nodeTypes,
        onNodesChange,
        onEdgesChange,
        onConnect,
        fitView: true,
        minZoom: 0.2,
        maxZoom: 2,
        deleteKeyCode: ["Backspace", "Delete"],
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Background, { gap: 18, size: 1 }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Controls, {}),
          /* @__PURE__ */ jsxRuntimeExports.jsx(MiniMap, { pannable: true, zoomable: true })
        ]
      }
    ) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      NodeInspector,
      {
        open: inspectorOpen,
        project: activeProject,
        node: selectedNode,
        skills,
        onClose: () => setInspectorOpen(false),
        onChange: handleNodePatch,
        onRun: (id) => void handleRunNode(id)
      }
    )
  ] });
}
export {
  AiVideoCanvasPage,
  AiVideoPage,
  postBindAiVideoEvents,
  useAiVideoStore
};
