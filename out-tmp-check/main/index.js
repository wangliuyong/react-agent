"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const electron = require("electron");
const fs = require("fs");
const path = require("path");
const messages = require("@langchain/core/messages");
const langgraph = require("@langchain/langgraph");
const child_process = require("child_process");
const util = require("util");
const crypto$1 = require("crypto");
const openai = require("@langchain/openai");
const node_async_hooks = require("node:async_hooks");
const base = require("@langchain/core/callbacks/base");
const tools = require("@langchain/core/tools");
const playwright = require("playwright");
const promises = require("stream/promises");
const stream = require("stream");
const module$1 = require("module");
const langchain = require("langchain");
const url = require("url");
const IpcChannels = {
  // 设置
  querySettings: "query:settings",
  postSettings: "post:settings",
  /** 从当前供应商平台拉取可用模型（OpenAI 兼容 /models） */
  queryProviderModels: "query:provider-models",
  // 会话
  querySessions: "query:sessions",
  querySession: "query:session",
  postSession: "post:session",
  postDeleteSession: "post:session:delete",
  // 发布计划
  queryPublishPlans: "query:publish-plans",
  queryPublishPlan: "query:publish-plan",
  postPublishPlan: "post:publish-plan",
  postDeletePublishPlan: "post:publish-plan:delete",
  /** 首次启动写入内置发布计划（磁盘为空时） */
  postInitPublishPlans: "post:publish-plans:init",
  /** 导入缺失的内置发布计划（手动「导入示例」） */
  postImportBuiltinPublishPlans: "post:publish-plans:import-builtin",
  // 定时任务
  queryScheduledTasks: "query:scheduled-tasks",
  queryScheduledTask: "query:scheduled-task",
  postScheduledTask: "post:scheduled-task",
  postDeleteScheduledTask: "post:scheduled-task:delete",
  postRunScheduledTask: "post:scheduled-task:run",
  /** 首次启动写入内置定时任务（磁盘为空时） */
  postInitScheduledTasks: "post:scheduled-tasks:init",
  /** 导入缺失的内置定时任务（手动「导入示例」） */
  postImportBuiltinScheduledTasks: "post:scheduled-tasks:import-builtin",
  // Agent
  postAgentChat: "post:agent:chat",
  postAgentAbort: "post:agent:abort",
  /**
   * 渲染进程冷启动 / 刷新后与主进程对齐：返回仍在执行的会话快照，不中止 Agent。
   * @deprecated 优先使用 queryAgentActiveRuns；保留通道以兼容旧 preload
   */
  postAgentResyncRenderer: "post:agent:resync-renderer",
  /** 查询主进程内存中仍在执行 / 等待确认的 Agent 会话 */
  queryAgentActiveRuns: "query:agent:active-runs",
  postAgentContinue: "post:agent:continue",
  // 浏览器
  queryBrowserStatus: "query:browser:status",
  postBrowserStart: "post:browser:start",
  postBrowserClose: "post:browser:close",
  postBrowserClearProfile: "post:browser:clear-profile",
  // 发布渠道
  queryPublishChannels: "query:publish-channels",
  postPublishChannel: "post:publish-channel",
  postDeletePublishChannel: "post:publish-channel:delete",
  postInitPublishChannels: "post:publish-channels:init",
  /** 通知渠道测试发送（飞书 Webhook 等） */
  postNotifyChannelTest: "post:notify-channel:test",
  // 发布渠道登录态
  queryChannelLoginStatuses: "query:channel-login-statuses",
  postChannelOpenLogin: "post:channel:open-login",
  // 项目技能（resources/skills）
  queryProjectSkills: "query:project-skills",
  queryProjectSkillDetail: "query:project-skill-detail",
  postSkillStates: "post:skill-states",
  postProjectSkill: "post:project-skill",
  postDeleteProjectSkill: "post:project-skill:delete",
  querySkillTemplates: "query:skill-templates",
  postInstallSkillTemplate: "post:skill-template:install",
  querySkillImportPreview: "query:skill-import-preview",
  postImportSkillFromUrl: "post:skill-import-from-url",
  /** 从会话成功步骤总结技能草稿（LLM + 规则兜底） */
  postSummarizeSkillFromSession: "post:skill-summarize-from-session",
  queryLocalImageDataUrl: "query:local-image-data-url",
  /** 本地音视频 → media:// URL，供聊天内联播放 */
  queryLocalMediaUrl: "query:local-media-url",
  /** 聊天粘贴/拖入：将二进制落盘到 chat-uploads */
  postSaveChatUpload: "post:chat-upload:save",
  /** 校验本地文件/目录是否存在（产物按钮展示前过滤） */
  queryLocalPathExists: "query:local-path-exists",
  /** A 股 K 线实时刷新（聊天预览轮询） */
  queryAshareKlineRefresh: "query:ashare-kline-refresh",
  /** Agent 工具注册表 + 角色注入（设置页只读） */
  queryAgentToolsCatalog: "query:agent-tools-catalog",
  /** 设置页：列举 Agent 生成的本地文件 */
  queryAgentAssets: "query:agent-assets",
  /** 设置页：删除单个 Agent 产出文件 */
  postDeleteAgentAsset: "post:agent-asset:delete",
  /** 设置页：批量删除 Agent 产出文件 */
  postDeleteAgentAssets: "post:agent-assets:delete-batch",
  /** 设置页：一键清空全部 Agent 产出 */
  postClearAgentAssets: "post:agent-assets:clear",
  /** 设置页：读取文本类资产预览 */
  queryAgentAssetTextPreview: "query:agent-asset:text-preview",
  /** Remotion 视频页：导出列表（进行中 / 成功 / 失败） */
  queryRemotionExports: "query:remotion-exports",
  /** Remotion 视频页：导出任务入队 */
  postEnqueueRemotionExport: "post:remotion-export:enqueue",
  /** Remotion 视频页：导出任务更新 */
  postUpdateRemotionExport: "post:remotion-export:update",
  /** Remotion 视频页：从内置技能读取模版列表 */
  queryRemotionVideoTemplates: "query:remotion-video-templates",
  /** Remotion：拼装技能模版并可选打开 Studio */
  postApplyRemotionTemplateSkill: "post:remotion-template:apply",
  /** Remotion：直接渲染已启动 Studio 的会话工程 */
  postRenderRemotionStudioExport: "post:remotion-studio:export",
  // Agent 用户规则（持久指令，注入 SYSTEM_PROMPT）
  queryAgentRules: "query:agent-rules",
  postAgentRule: "post:agent-rule",
  postDeleteAgentRule: "post:agent-rule:delete",
  // 工作流编排
  queryWorkflows: "query:workflows",
  queryWorkflow: "query:workflow",
  postWorkflow: "post:workflow",
  postDeleteWorkflow: "post:workflow:delete",
  postRunWorkflow: "post:workflow:run",
  postResumeWorkflow: "post:workflow:resume",
  /** 业务系统：读取工作流运行记录（含 context） */
  queryWorkflowRuns: "query:workflow-runs",
  queryLatestWorkflowRunBySession: "query:workflow-run:by-session",
  // ComfyUI / AI 视频画布
  queryComfyUiStatus: "query:comfyui:status",
  queryComfyWorkflows: "query:comfyui:workflows",
  queryAiVideoProjects: "query:ai-video:projects",
  queryAiVideoProject: "query:ai-video:project",
  postAiVideoProject: "post:ai-video:project",
  postDeleteAiVideoProject: "post:ai-video:project:delete",
  postAiVideoNodeRun: "post:ai-video:node:run",
  postAiVideoCanvasRun: "post:ai-video:canvas:run",
  postAiVideoAbortRun: "post:ai-video:abort",
  onAiVideoNodeEvent: "event:ai-video:node",
  onScheduleUpdate: "event:schedule-update",
  onPublishPlansUpdate: "event:publish-plans-update",
  onAgentRulesUpdate: "event:agent-rules-update"
};
const CHAT_PIPELINE_AGENT_ROLES = [
  "general",
  "researcher",
  "writer",
  "publisher",
  "scriptwriter",
  "videographer",
  "editor"
];
function queryIsChatPipelineRole(role) {
  if (role.startsWith("custom_")) return true;
  return CHAT_PIPELINE_AGENT_ROLES.includes(role);
}
function queryNormalizeRoleToolWhitelistOverrides(raw) {
  if (!raw || typeof raw !== "object") return {};
  const out = {};
  for (const [key, val] of Object.entries(raw)) {
    if (!queryIsChatPipelineRole(key)) continue;
    if (val === null) {
      out[key] = null;
      continue;
    }
    if (Array.isArray(val)) {
      const names = val.map((item) => String(item).trim()).filter(Boolean);
      out[key] = names;
    }
  }
  return out;
}
function queryNormalizeRoleSkillIds(raw) {
  if (!raw || typeof raw !== "object") return {};
  const out = {};
  for (const [key, val] of Object.entries(raw)) {
    if (!queryIsChatPipelineRole(key)) continue;
    if (!Array.isArray(val)) continue;
    const ids = Array.from(
      new Set(val.map((item) => String(item).trim()).filter(Boolean))
    );
    if (ids.length > 0) {
      out[key] = ids;
    }
  }
  return out;
}
const DEFAULT_CONNECTION_ID = "conn-default";
const DEFAULT_CONNECTION_IDS = {
  default: "conn-default",
  fast: "conn-fast",
  reason: "conn-reason",
  creative: "conn-creative",
  media: "conn-media"
};
const DASHSCOPE_COMPAT_BASE = "https://dashscope.aliyuncs.com/compatible-mode/v1";
const OFOX_COMPAT_BASE = "https://api.ofox.io/v1";
function queryBuildDefaultConnections(seed) {
  const apiKey = seed?.apiKey?.trim() ?? "";
  const provider = seed?.provider ?? "dashscope";
  const baseUrl = seed?.baseUrl?.trim() || (provider === "deepseek" ? "https://api.deepseek.com" : provider === "ofox" ? OFOX_COMPAT_BASE : provider === "openai_compatible" ? "https://api.openai.com/v1" : DASHSCOPE_COMPAT_BASE);
  if (provider === "deepseek") {
    return [
      {
        id: DEFAULT_CONNECTION_IDS.default,
        label: "通用对话（DeepSeek Flash）",
        provider: "deepseek",
        apiKey,
        baseUrl,
        model: "deepseek-v4-flash",
        capabilities: ["chat"]
      },
      {
        id: DEFAULT_CONNECTION_IDS.fast,
        label: "路由调度（DeepSeek Flash）",
        provider: "deepseek",
        apiKey,
        baseUrl,
        model: "deepseek-v4-flash",
        capabilities: ["chat"]
      },
      {
        id: DEFAULT_CONNECTION_IDS.reason,
        label: "调研推理（DeepSeek Pro）",
        provider: "deepseek",
        apiKey,
        baseUrl,
        model: "deepseek-v4-pro",
        capabilities: ["reasoning", "chat"]
      },
      {
        id: DEFAULT_CONNECTION_IDS.creative,
        label: "创作编剧（DeepSeek Flash）",
        provider: "deepseek",
        apiKey,
        baseUrl,
        model: "deepseek-v4-flash",
        // 撰稿/编剧走角色映射；creative 能力仅留给文生图/图生成视频连接
        capabilities: ["chat"]
      },
      // 媒体（万相/TTS）；creative 供明确文生图/图生成视频时选型
      {
        id: DEFAULT_CONNECTION_IDS.media,
        label: "媒体生成（百炼 · 万相/TTS）",
        provider: "dashscope",
        apiKey: "",
        baseUrl: DASHSCOPE_COMPAT_BASE,
        model: "qwen-plus",
        capabilities: ["vision", "creative"]
      }
    ];
  }
  if (provider === "ofox") {
    return [
      {
        id: DEFAULT_CONNECTION_IDS.default,
        label: "通用对话（GPT-4o Mini）",
        provider: "ofox",
        apiKey,
        baseUrl,
        model: "openai/gpt-4o-mini",
        capabilities: ["chat"]
      },
      {
        id: DEFAULT_CONNECTION_IDS.fast,
        label: "路由调度（GPT-4o Mini）",
        provider: "ofox",
        apiKey,
        baseUrl,
        model: "openai/gpt-4o-mini",
        capabilities: ["chat"]
      },
      {
        id: DEFAULT_CONNECTION_IDS.reason,
        label: "调研推理（Claude Sonnet）",
        provider: "ofox",
        apiKey,
        baseUrl,
        model: "anthropic/claude-sonnet-4.6",
        capabilities: ["reasoning", "chat", "longContext"]
      },
      {
        id: DEFAULT_CONNECTION_IDS.creative,
        label: "创作编剧（GPT-4o）",
        provider: "ofox",
        apiKey,
        baseUrl,
        model: "openai/gpt-4o",
        // 撰稿/编剧走角色映射；creative 能力仅留给文生图/图生成视频连接
        capabilities: ["chat", "vision"]
      },
      // 媒体（万相/TTS）；creative 供明确文生图/图生成视频时选型
      {
        id: DEFAULT_CONNECTION_IDS.media,
        label: "媒体生成（百炼 · 万相/TTS）",
        provider: "dashscope",
        apiKey: "",
        baseUrl: DASHSCOPE_COMPAT_BASE,
        model: "qwen-plus",
        capabilities: ["vision", "creative"]
      }
    ];
  }
  return [
    {
      id: DEFAULT_CONNECTION_IDS.default,
      label: "通用对话（Qwen Plus）",
      provider: "dashscope",
      apiKey,
      baseUrl: baseUrl || DASHSCOPE_COMPAT_BASE,
      model: "qwen-plus",
      capabilities: ["chat"]
    },
    {
      id: DEFAULT_CONNECTION_IDS.fast,
      label: "路由调度（Qwen Turbo）",
      provider: "dashscope",
      apiKey,
      baseUrl: baseUrl || DASHSCOPE_COMPAT_BASE,
      model: "qwen-turbo",
      capabilities: ["chat"]
    },
    {
      id: DEFAULT_CONNECTION_IDS.reason,
      label: "调研推理（Qwen Max）",
      provider: "dashscope",
      apiKey,
      baseUrl: baseUrl || DASHSCOPE_COMPAT_BASE,
      model: "qwen-max",
      capabilities: ["reasoning", "chat", "longContext"]
    },
    {
      id: DEFAULT_CONNECTION_IDS.creative,
      label: "创作编剧（Qwen Plus）",
      provider: "dashscope",
      apiKey,
      baseUrl: baseUrl || DASHSCOPE_COMPAT_BASE,
      model: "qwen-plus",
      // 撰稿/编剧走角色映射；creative 能力仅留给文生图/图生成视频连接
      capabilities: ["chat"]
    },
    {
      id: DEFAULT_CONNECTION_IDS.media,
      label: "媒体生成（百炼 · 万相/TTS）",
      provider: "dashscope",
      apiKey,
      baseUrl: baseUrl || DASHSCOPE_COMPAT_BASE,
      model: "qwen-plus",
      // vision + creative：识图与明确文生图/图生成视频；勿带 chat，避免对话误选
      capabilities: ["vision", "creative"]
    }
  ];
}
const DEFAULT_CONNECTION = queryBuildDefaultConnections()[0];
const DEFAULT_ROLE_MODEL_MAP = {
  supervisor: DEFAULT_CONNECTION_IDS.fast,
  general: DEFAULT_CONNECTION_IDS.default,
  researcher: DEFAULT_CONNECTION_IDS.reason,
  writer: DEFAULT_CONNECTION_IDS.creative,
  publisher: DEFAULT_CONNECTION_IDS.default,
  scriptwriter: DEFAULT_CONNECTION_IDS.creative,
  videographer: DEFAULT_CONNECTION_IDS.media,
  editor: DEFAULT_CONNECTION_IDS.default,
  script: DEFAULT_CONNECTION_IDS.creative,
  storyboard: DEFAULT_CONNECTION_IDS.creative,
  video: DEFAULT_CONNECTION_IDS.media,
  default: DEFAULT_CONNECTION_IDS.default
};
const DEFAULT_ROLE_PROMPT_OVERRIDES = {
  general: "你是一名高级资深的全能桌面 AI 助手，拥有跨领域复杂任务编排与问题诊断经验。善于把模糊需求拆解为清晰步骤，结论先行、表达简洁；不确定时主动追问，绝不编造工具结果或未完成的操作。优先用事实与数据支撑观点，中文回复，语气专业、可靠、亲和。",
  researcher: "你是一名高级资深的内容调研员与信息架构师，擅长从热点与网络素材中提炼可落地的选题方向。你只负责调研与汇总，不写终稿、不发布。输出须结构化：选题建议（2～3 条）、核心要点（bullet）、可用配图路径清单；注重来源可信度、差异化角度，避免同质化热点套路。",
  writer: "你是一名高级资深的新媒体撰稿人与品牌文案专家，精通小红书与抖音平台调性与传播规律。基于调研素材撰写标题、正文与话题标签；小红书标题≤20 字、正文≤1000 字，抖音标题≤20 字。文风有代入感、信息密度高，每篇须有明显差异，禁止模板化换词。你只撰稿，不调用发布工具。",
  publisher: "你是一名高级资深的社媒运营与多渠道发布专家，熟悉小红书、抖音图文发布流程与平台风控。严格以工具返回结果为准，绝不声称发布成功除非工具明确成功。发布前核对标题、正文、配图路径齐全；尊重频次限制与深夜禁发规则；失败时给出可操作的排查与重试建议。",
  scriptwriter: "你是一名高级资深的短视频编剧与分镜策划师，擅长将创意扩展为可拍摄的完整剧本与精细化分镜。默认竖版 9:16，4～8 镜、每镜 2～15 秒，叙事起承转合完整。旁白口语化，画面描述具体（主体+场景+动作+运镜+光影），negativePrompt 须防人脸扭曲与肢体崩坏。只完成剧本与分镜落盘，不生成素材、不合成成片。",
  videographer: "你是一名高级资深的 AI 视频生成工程师，精通文生图、图生视频与 TTS 旁白管线。你根据上游分镜调用渲染工具，不擅自改写剧本。如实汇报每镜 T2I/I2V/TTS 成败与 manifest 路径；API 异常时说明原因并建议补救，不夸大渲染效果。",
  editor: "你是一名高级资深的视频剪辑师与后期统筹，负责多镜素材的音画对齐、粗剪拼接与成片导出。全片须审核叙事连贯、音画同步、无畸形闪烁残留；成片路径以 compose_video 返回为准。保留 manifest 便于二次修改，需要时可通知用户成片已就绪。",
  script: "你是一名高级资深的短视频剧本创作者，专注于将用户一句话需求扩展为结构完整、可拍摄的剧本文档。明确主题、受众、时长、画幅与整体风格；情节有起承转合，旁白适合口播，输出可直接供分镜环节使用。",
  storyboard: "你是一名高级资深的分镜师与视觉提示词工程师，擅长把剧本拆解为 4～8 个可渲染镜头。每镜须含 visual、narration、durationSec、cameraMotion、style、negativePrompt、aspectRatio；画面描述足够具体以供 AI 生成，镜头间叙事连贯、节奏分明。",
  video: "你是一名高级资深的 AI 视听制作专家，负责驱动从场景素材到成片的完整视频生成任务。按 manifest 或分镜顺序推进 T2I/I2V/TTS 与合成，逐步汇报进度与文件路径；失败如实说明，不跳步声称完成。"
};
const DEFAULT_TEMPLATE_IDS = new Set(Object.values(DEFAULT_CONNECTION_IDS));
function querySeedDefaultConnections(existing) {
  if (existing.length === 0) {
    return queryBuildDefaultConnections();
  }
  const onlyTemplatesOrSingle = existing.length === 1 || existing.every((c) => DEFAULT_TEMPLATE_IDS.has(c.id));
  if (!onlyTemplatesOrSingle) {
    return existing;
  }
  const primary = existing[0];
  const templates = queryBuildDefaultConnections({
    apiKey: primary.apiKey,
    provider: primary.provider,
    baseUrl: primary.baseUrl
  });
  const byId = new Map(existing.map((c) => [c.id, c]));
  const merged = [];
  for (const template of templates) {
    const prev = byId.get(template.id);
    if (prev) {
      merged.push({
        ...template,
        ...prev,
        apiKey: prev.apiKey.trim() || (prev.provider === primary.provider ? primary.apiKey : prev.apiKey),
        capabilities: prev.capabilities?.length ? prev.capabilities : template.capabilities
      });
      byId.delete(template.id);
    } else {
      merged.push({
        ...template,
        apiKey: template.provider === primary.provider ? primary.apiKey : template.apiKey
      });
    }
  }
  for (const leftover of byId.values()) {
    merged.push(leftover);
  }
  return merged;
}
function queryMergeDefaultRoleModelMap(existing, connectionIds, fallbackId) {
  const next = { ...DEFAULT_ROLE_MODEL_MAP };
  for (const [role, connId] of Object.entries(DEFAULT_ROLE_MODEL_MAP)) {
    if (!connectionIds.has(connId)) {
      next[role] = fallbackId;
    }
  }
  if (existing) {
    for (const [role, connId] of Object.entries(existing)) {
      if (connId && connectionIds.has(connId)) {
        next[role] = connId;
      }
    }
  }
  return next;
}
function queryMergeDefaultRolePromptOverrides(existing) {
  const next = { ...DEFAULT_ROLE_PROMPT_OVERRIDES };
  if (!existing) return next;
  for (const [role, text] of Object.entries(existing)) {
    const trimmed = String(text ?? "").trim();
    if (trimmed) {
      next[role] = trimmed;
    } else if (role in existing) {
      next[role] = "";
    }
  }
  return next;
}
const DEFAULT_SETTINGS = {
  provider: "dashscope",
  apiKey: "",
  baseUrl: DASHSCOPE_COMPAT_BASE,
  model: "qwen-plus",
  connections: queryBuildDefaultConnections(),
  defaultConnectionId: DEFAULT_CONNECTION_ID,
  roleModelMap: { ...DEFAULT_ROLE_MODEL_MAP },
  rolePromptOverrides: { ...DEFAULT_ROLE_PROMPT_OVERRIDES },
  roleToolWhitelistOverrides: {},
  roleSkillIds: {},
  customAgentRoles: [],
  fullAccess: false,
  thinkingEnabled: false,
  maxTurns: 40,
  launchAtLogin: false,
  closeToTray: true,
  customProviders: [],
  providerModelCatalog: {},
  comfyUi: {
    baseUrl: "http://127.0.0.1:8188",
    enabled: true
  }
};
function queryNewProviderModelRecordId() {
  const suffix = Math.random().toString(36).slice(2, 8);
  return `pm-${Date.now().toString(36)}-${suffix}`;
}
function queryNormalizeProviderModelCatalog(raw) {
  if (!raw || typeof raw !== "object") return {};
  const result = {};
  for (const [providerKey, list] of Object.entries(raw)) {
    if (!Array.isArray(list)) continue;
    const seen = /* @__PURE__ */ new Set();
    const records = [];
    for (const item of list) {
      if (!item || typeof item !== "object") continue;
      const row = item;
      const modelId = String(row.modelId ?? row.value ?? "").trim();
      if (!modelId || seen.has(modelId)) continue;
      seen.add(modelId);
      const displayName = String(row.displayName ?? row.label ?? "").trim();
      const contextWindow = String(row.contextWindow ?? "").trim();
      const size = String(row.size ?? "").trim();
      const category = String(row.category ?? "").trim();
      const description = String(row.description ?? "").trim();
      const id = String(row.id ?? "").trim() || queryNewProviderModelRecordId();
      records.push({
        id,
        modelId,
        ...displayName ? { displayName } : {},
        ...contextWindow ? { contextWindow } : {},
        ...size ? { size } : {},
        ...category ? { category } : {},
        ...description ? { description } : {},
        ...row.supportsThinking === true ? { supportsThinking: true } : {},
        ...row.supportsVision === true ? { supportsVision: true } : {}
      });
    }
    if (records.length > 0) {
      result[providerKey] = records;
    }
  }
  return result;
}
function queryProviderModelCatalogForProvider(catalog, provider) {
  return catalog?.[provider] ?? [];
}
function queryModelOptionsFromProviderRecords(provider, records) {
  return records.map((record) => {
    const modelId = record.modelId.trim();
    const metaParts = [
      record.size?.trim(),
      record.contextWindow?.trim() ? `上下文 ${record.contextWindow.trim()}` : ""
    ].filter(Boolean);
    const description = record.description?.trim() || (metaParts.length > 0 ? metaParts.join(" · ") : void 0);
    return {
      provider,
      value: modelId,
      label: record.displayName?.trim() || modelId,
      description,
      category: record.category?.trim() || queryModelCategory(modelId)
    };
  });
}
function queryChatModelOptionsFromCatalog(provider, catalog) {
  return queryModelOptionsFromProviderRecords(
    provider,
    queryProviderModelCatalogForProvider(catalog, provider)
  );
}
const MODEL_PROVIDER_OPTIONS = [
  {
    value: "dashscope",
    label: "阿里云百炼",
    apiKeyLabel: "API Key",
    defaultBaseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    defaultModel: "qwen-plus"
  },
  {
    value: "deepseek",
    label: "DeepSeek",
    apiKeyLabel: "API Key",
    defaultBaseUrl: "https://api.deepseek.com",
    /** 与平台当前推荐一致；拉取 /models 失败时也用此默认 */
    defaultModel: "deepseek-v4-flash"
  },
  {
    value: "ofox",
    label: "OfoxAI",
    apiKeyLabel: "API Key",
    /** OpenAI 兼容协议：https://api.ofox.io/v1；目录与 https://ofox.io/zh/models 一致 */
    defaultBaseUrl: OFOX_COMPAT_BASE,
    /** 拉取 /models 失败时的兜底；模型 id 需带 provider 前缀 */
    defaultModel: "openai/gpt-4o-mini",
    modelsUrl: `${OFOX_COMPAT_BASE}/models`
  },
  {
    value: "openai_compatible",
    label: "OpenAI 兼容",
    apiKeyLabel: "API Key",
    defaultBaseUrl: "https://api.openai.com/v1",
    defaultModel: "gpt-4o-mini"
  }
];
function queryModelCategory(modelId) {
  const id = modelId.trim().toLowerCase();
  if (!id) return "未知";
  if (/(^|[-_/])(vl|vision|qvq|ocr|image-understand|visual)([-_/]|$)/.test(id) || id.includes("qwen-vl") || id.includes("qwen2-vl") || id.includes("qwen2.5-vl")) {
    return "视觉理解";
  }
  if (/(tts|cosyvoice|speech|audio|asr|paraformer|sambert)/.test(id) || id.includes("qwen-audio")) {
    return "语音";
  }
  if (/(wanx|wan2\.|t2i|text2image|image-synthesis|flux|stable-diffusion)/.test(id)) {
    return "文生图";
  }
  if (/(i2v|image2video|video-generation|animate|kling)/.test(id)) {
    return "图生视频";
  }
  if (/(embedding|text-embedding|bge-)/.test(id)) {
    return "向量嵌入";
  }
  if (/rerank/.test(id)) {
    return "重排序";
  }
  if (/(coder|code)/.test(id)) {
    return "代码";
  }
  if (/math/.test(id)) {
    return "数学";
  }
  if (/omni/.test(id)) {
    return "全模态";
  }
  if (/(long|longcontext)/.test(id)) {
    return "长文本";
  }
  if (/(reasoner|reasoning|thinking|r1|qwq)/.test(id) || id.includes("deepseek-r1")) {
    return "深度推理";
  }
  if (/(turbo|flash)/.test(id)) {
    return "高速对话";
  }
  if (/(max|plus|pro|chat)/.test(id) || /^qwen/.test(id) || /^deepseek/.test(id)) {
    return "文本对话";
  }
  if (/(^|\/)(gpt-|o1|o3|o4|claude|gemini)/.test(id)) {
    return "文本对话";
  }
  return "通用模型";
}
function queryModelSupportsThinking(model) {
  const id = model.trim().toLowerCase();
  if (!id) return false;
  if (/deepseek/.test(id)) return true;
  if (/(reasoner|reasoning|thinking|r1|qwq)/.test(id)) return true;
  if (/^qwen3/.test(id)) return true;
  if (/kimi-k2/i.test(id)) return true;
  if (/^glm-/.test(id)) return true;
  return false;
}
function queryThinkingModelKwargs(settings, model, provider) {
  if (!queryModelSupportsThinking(model)) return void 0;
  if (provider === "deepseek") {
    return {
      thinking: { type: settings.thinkingEnabled ? "enabled" : "disabled" }
    };
  }
  return { enable_thinking: settings.thinkingEnabled };
}
const MODEL_OPTIONS = [
  { provider: "dashscope", value: "qwen-plus", label: "Qwen Plus", description: "均衡，推荐默认" },
  { provider: "dashscope", value: "qwen-max", label: "Qwen Max", description: "能力最强" },
  {
    provider: "dashscope",
    value: "qwen-turbo",
    label: "Qwen Turbo",
    description: "速度快、成本低"
  },
  { provider: "dashscope", value: "qwen-long", label: "Qwen Long", description: "超长上下文" },
  /**
   * DeepSeek 官方模型（与 GET /models 文档示例一致）：
   * https://api-docs.deepseek.com/zh-cn/api/list-models
   * 聊天/设置优先实时拉取；此处作无 Key / 请求失败时的静态兜底。
   */
  {
    provider: "deepseek",
    value: "deepseek-v4-flash",
    label: "DeepSeek V4 Flash",
    description: "高速推理，推荐默认"
  },
  {
    provider: "deepseek",
    value: "deepseek-v4-pro",
    label: "DeepSeek V4 Pro",
    description: "更强推理能力"
  },
  /**
   * OfoxAI 静态兜底（拉取 /models 失败时使用）。
   * 模型命名：provider/model-name，见 https://ofox.io/zh/docs/integrations/openai-sdk
   */
  {
    provider: "ofox",
    value: "openai/gpt-4o-mini",
    label: "GPT-4o Mini",
    description: "高速低成本，推荐默认"
  },
  {
    provider: "ofox",
    value: "openai/gpt-4o",
    label: "GPT-4o",
    description: "均衡多模态"
  },
  {
    provider: "ofox",
    value: "anthropic/claude-sonnet-4.6",
    label: "Claude Sonnet 4.6",
    description: "强推理与长上下文"
  },
  // 阿里云百炼中的 DeepSeek 模型
  { provider: "dashscope", value: "deepseek-v4-flash", label: "deepseek-v4-flash" },
  { provider: "dashscope", value: "deepseek-v4-pro", label: "deepseek-v4-pro" },
  // Qwen 3.x
  {
    provider: "dashscope",
    value: "qwen3.6-flash-2026-04-16",
    label: "qwen3.6-flash-2026-04-16"
  },
  { provider: "dashscope", value: "qwen3.5-ocr", label: "qwen3.5-ocr" },
  { provider: "dashscope", value: "qwen3.6-35b-a3b", label: "qwen3.6-35b-a3b" },
  {
    provider: "dashscope",
    value: "qwen3.7-max-2026-05-17",
    label: "qwen3.7-max-2026-05-17"
  },
  {
    provider: "dashscope",
    value: "qwen3.7-max-2026-06-08",
    label: "qwen3.7-max-2026-06-08"
  },
  { provider: "dashscope", value: "qwen3.7-max-preview", label: "qwen3.7-max-preview" },
  {
    provider: "dashscope",
    value: "qwen3.5-plus-2026-04-20",
    label: "qwen3.5-plus-2026-04-20"
  },
  { provider: "dashscope", value: "qwen3.6-max-preview", label: "qwen3.6-max-preview" },
  { provider: "dashscope", value: "qwen3.7-max", label: "qwen3.7-max" },
  {
    provider: "dashscope",
    value: "qwen3.7-max-2026-05-20",
    label: "qwen3.7-max-2026-05-20"
  },
  {
    provider: "dashscope",
    value: "qwen3.7-plus-2026-05-26",
    label: "qwen3.7-plus-2026-05-26"
  },
  { provider: "dashscope", value: "qwen3.6-flash", label: "qwen3.6-flash" },
  // GLM
  { provider: "dashscope", value: "glm-5.1", label: "glm-5.1" },
  { provider: "dashscope", value: "glm-5.2", label: "glm-5.2" },
  // Kimi
  {
    provider: "dashscope",
    value: "kimi-k2.7-code",
    label: "kimi-k2.7-code",
    description: "代码能力强"
  },
  { provider: "dashscope", value: "kimi-k2.6", label: "kimi-k2.6" }
];
function queryIsCustomModelProvider(provider) {
  return String(provider).startsWith("custom:");
}
function queryNormalizeCustomProviders(raw) {
  if (!Array.isArray(raw)) return [];
  const seen = /* @__PURE__ */ new Set();
  const result = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item;
    const id = String(row.id ?? "").trim();
    if (!id.startsWith("custom:") || seen.has(id)) continue;
    const label = String(row.label ?? "").trim();
    if (!label) continue;
    seen.add(id);
    const modelsUrl = String(row.modelsUrl ?? "").trim();
    result.push({
      id,
      label,
      // 为什么：自定义供应商统一用「API Key」，不再支持自定义标签
      apiKeyLabel: "API Key",
      defaultBaseUrl: String(row.defaultBaseUrl ?? "").trim(),
      defaultModel: String(row.defaultModel ?? "").trim() || "gpt-4o-mini",
      ...modelsUrl ? { modelsUrl } : {}
    });
  }
  return result;
}
function queryProviderOption(provider, customProviders = []) {
  const builtIn = MODEL_PROVIDER_OPTIONS.find((option) => option.value === provider);
  if (builtIn) return builtIn;
  const custom = customProviders.find((item) => item.id === provider);
  if (custom) {
    return {
      value: custom.id,
      label: custom.label,
      apiKeyLabel: custom.apiKeyLabel || "API Key",
      defaultBaseUrl: custom.defaultBaseUrl,
      defaultModel: custom.defaultModel,
      ...custom.modelsUrl?.trim() ? { modelsUrl: custom.modelsUrl.trim() } : {}
    };
  }
  if (provider.startsWith("custom:")) {
    const fallbackLabel = provider.slice("custom:".length) || "自定义供应商";
    return {
      value: provider,
      label: fallbackLabel,
      apiKeyLabel: "API Key",
      defaultBaseUrl: "",
      defaultModel: "gpt-4o-mini"
    };
  }
  return MODEL_PROVIDER_OPTIONS[0];
}
function queryModelOptions(provider) {
  return MODEL_OPTIONS.filter((option) => option.provider === provider);
}
const CHAT_TEMPLATE_CONNECTION_IDS = /* @__PURE__ */ new Set([
  DEFAULT_CONNECTION_IDS.default,
  DEFAULT_CONNECTION_IDS.fast,
  DEFAULT_CONNECTION_IDS.reason,
  DEFAULT_CONNECTION_IDS.creative
]);
function queryIsModelAllowedForProvider(provider, modelId, catalog) {
  const id = modelId.trim();
  if (!id) return false;
  if (provider === "openai_compatible" || queryIsCustomModelProvider(provider)) {
    return true;
  }
  const fromCatalog = queryChatModelOptionsFromCatalog(provider, catalog);
  if (fromCatalog.some((m) => m.value === id)) return true;
  if (queryModelOptions(provider).some((m) => m.value === id)) return true;
  const catalogRecords = queryProviderModelCatalogForProvider(catalog, provider);
  if (catalogRecords.length > 0) return false;
  if (provider === "deepseek") {
    return !id.includes("/") && /^deepseek-/.test(id);
  }
  if (provider === "dashscope") {
    return !id.includes("/");
  }
  if (provider === "ofox") return id.includes("/");
  return false;
}
function queryResolveModelForProvider(provider, preferred, catalog, customProviders = []) {
  const id = preferred.trim();
  if (queryIsModelAllowedForProvider(provider, id, catalog)) return id;
  return queryProviderOption(provider, customProviders).defaultModel;
}
function queryAlignConnectionsToActiveProvider(params) {
  const customProviders = params.customProviders ?? [];
  const activeProvider = params.activeProvider;
  const meta = queryProviderOption(activeProvider, customProviders);
  const apiKey = params.activeCreds.apiKey;
  const baseUrl = params.activeCreds.baseUrl.trim() || meta.defaultBaseUrl;
  const model = queryResolveModelForProvider(
    activeProvider,
    params.activeCreds.model,
    params.catalog,
    customProviders
  );
  const templates = queryBuildDefaultConnections({
    apiKey,
    provider: activeProvider,
    baseUrl
  });
  const templateById = new Map(templates.map((t) => [t.id, t]));
  let connections = params.connections.map((conn) => {
    if (!CHAT_TEMPLATE_CONNECTION_IDS.has(conn.id)) return conn;
    const template = templateById.get(conn.id);
    if (!template) return conn;
    if (conn.provider === activeProvider) {
      const nextModel2 = conn.id === DEFAULT_CONNECTION_IDS.default ? model : queryResolveModelForProvider(
        activeProvider,
        conn.model,
        params.catalog,
        customProviders
      );
      return {
        ...conn,
        model: nextModel2,
        baseUrl: conn.baseUrl.trim() || baseUrl,
        capabilities: template.capabilities?.length ? template.capabilities : conn.capabilities
      };
    }
    const nextModel = conn.id === DEFAULT_CONNECTION_IDS.default ? model : queryResolveModelForProvider(
      activeProvider,
      template.model,
      params.catalog,
      customProviders
    );
    return {
      ...conn,
      provider: activeProvider,
      apiKey,
      baseUrl,
      model: nextModel,
      capabilities: template.capabilities?.length ? template.capabilities : conn.capabilities
    };
  });
  let defaultConnectionId = params.defaultConnectionId;
  const defaultConn = connections.find((c) => c.id === defaultConnectionId);
  if (!defaultConn || defaultConn.provider !== activeProvider) {
    const preferred = connections.find((c) => c.id === DEFAULT_CONNECTION_IDS.default) ?? connections.find((c) => c.provider === activeProvider);
    if (preferred?.provider === activeProvider) {
      defaultConnectionId = preferred.id;
    } else {
      const id = `cred-${activeProvider}`;
      const existingIdx = connections.findIndex((c) => c.id === id);
      const row = {
        id,
        label: `${meta.label}（凭证）`,
        provider: activeProvider,
        apiKey,
        baseUrl,
        model,
        capabilities: ["chat"]
      };
      if (existingIdx >= 0) connections[existingIdx] = { ...connections[existingIdx], ...row };
      else connections = [...connections, row];
      defaultConnectionId = id;
    }
  }
  return { connections, defaultConnectionId, model };
}
function querySyncTopLevelModelToConnections(current, partial) {
  const customProviders = current.customProviders ?? [];
  const catalog = partial.providerModelCatalog ?? current.providerModelCatalog;
  const activeProvider = partial.provider ?? current.provider;
  const aligned = queryAlignConnectionsToActiveProvider({
    connections: current.connections.map((c) => ({ ...c })),
    activeProvider,
    activeCreds: {
      apiKey: partial.apiKey ?? current.apiKey,
      baseUrl: partial.baseUrl ?? current.baseUrl,
      model: partial.model ?? current.model
    },
    defaultConnectionId: current.defaultConnectionId,
    catalog,
    customProviders
  });
  const connections = aligned.connections.map((conn) => {
    if (conn.id !== aligned.defaultConnectionId) return conn;
    return {
      ...conn,
      provider: activeProvider,
      apiKey: partial.apiKey ?? current.apiKey ?? conn.apiKey,
      baseUrl: (partial.baseUrl ?? current.baseUrl ?? conn.baseUrl).trim() || conn.baseUrl,
      model: aligned.model
    };
  });
  return {
    connections,
    defaultConnectionId: aligned.defaultConnectionId,
    model: aligned.model,
    provider: activeProvider
  };
}
function queryModelConnection(settings, purpose) {
  const connections = settings.connections?.length > 0 ? settings.connections : [
    {
      id: DEFAULT_CONNECTION_ID,
      label: "默认",
      provider: settings.provider,
      apiKey: settings.apiKey,
      baseUrl: settings.baseUrl,
      model: settings.model,
      capabilities: ["chat"]
    }
  ];
  if (purpose && settings.roleModelMap?.[purpose]) {
    const mapped = connections.find((c) => c.id === settings.roleModelMap[purpose]);
    if (mapped) return mapped;
  }
  const defaultId = settings.defaultConnectionId || connections[0]?.id;
  const byDefault = connections.find((c) => c.id === defaultId);
  if (byDefault) return byDefault;
  return connections[0];
}
function queryModelConnectionByCapability(settings, capability) {
  const connections = settings.connections ?? [];
  const preferred = queryModelConnection(settings, "default");
  if (preferred.capabilities?.includes(capability) && preferred.apiKey.trim()) {
    return preferred;
  }
  const hit = connections.find((c) => c.capabilities?.includes(capability) && c.apiKey.trim());
  return hit ?? preferred;
}
function queryProviderCredentialsFromSettings(settings, provider) {
  const customProviders = settings.customProviders ?? [];
  if (settings.provider === provider) {
    const topKey = settings.apiKey.trim();
    if (topKey) {
      return {
        apiKey: settings.apiKey,
        baseUrl: settings.baseUrl.trim() || queryProviderOption(provider, customProviders).defaultBaseUrl,
        model: settings.model.trim() || queryProviderOption(provider, customProviders).defaultModel
      };
    }
  }
  const fromConn = settings.connections?.find(
    (conn) => conn.provider === provider && conn.apiKey.trim()
  );
  if (fromConn) {
    const meta2 = queryProviderOption(provider, customProviders);
    return {
      apiKey: fromConn.apiKey,
      baseUrl: fromConn.baseUrl.trim() || meta2.defaultBaseUrl,
      model: fromConn.model.trim() || meta2.defaultModel
    };
  }
  const meta = queryProviderOption(provider, customProviders);
  return {
    apiKey: "",
    baseUrl: meta.defaultBaseUrl,
    model: meta.defaultModel
  };
}
function querySyncConnectionsProviderCredentials(connections, settings) {
  const customProviders = settings.customProviders ?? [];
  const providerCreds = /* @__PURE__ */ new Map();
  const providerIds = /* @__PURE__ */ new Set([
    ...MODEL_PROVIDER_OPTIONS.map((option) => option.value),
    ...customProviders.map((provider) => provider.id),
    ...connections.map((conn) => conn.provider)
  ]);
  for (const provider of providerIds) {
    providerCreds.set(provider, queryProviderCredentialsFromSettings(settings, provider));
  }
  for (const conn of connections) {
    const key = conn.apiKey.trim();
    if (!key) continue;
    const meta = queryProviderOption(conn.provider, customProviders);
    providerCreds.set(conn.provider, {
      apiKey: conn.apiKey,
      baseUrl: conn.baseUrl.trim() || meta.defaultBaseUrl,
      model: conn.model.trim() || meta.defaultModel
    });
  }
  return connections.map((conn) => {
    const creds = providerCreds.get(conn.provider) ?? queryProviderCredentialsFromSettings(settings, conn.provider);
    const meta = queryProviderOption(conn.provider, customProviders);
    return {
      ...conn,
      apiKey: conn.apiKey.trim() ? conn.apiKey : creds.apiKey,
      baseUrl: conn.baseUrl.trim() ? conn.baseUrl : creds.baseUrl || meta.defaultBaseUrl,
      model: conn.model.trim() ? conn.model : creds.model || meta.defaultModel
    };
  });
}
const BUILTIN_ROLE_TASK_IDS = [
  "general",
  "researcher",
  "writer",
  "publisher",
  "scriptwriter",
  "videographer",
  "editor",
  "script",
  "storyboard",
  "video"
];
new Set(BUILTIN_ROLE_TASK_IDS);
const CUSTOM_AGENT_ROLE_PREFIX = "custom_";
function queryIsCustomAgentRoleId(roleId) {
  return roleId.startsWith(CUSTOM_AGENT_ROLE_PREFIX);
}
function queryPostCustomAgentRoleId(label, existingIds) {
  const used = new Set(existingIds);
  const base2 = label.trim().toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 32);
  const stem = base2 || "role";
  let candidate = `${CUSTOM_AGENT_ROLE_PREFIX}${stem}`;
  let n = 2;
  while (used.has(candidate)) {
    candidate = `${CUSTOM_AGENT_ROLE_PREFIX}${stem}_${n}`;
    n += 1;
  }
  return candidate;
}
function queryCustomAgentRole(roles, id) {
  return roles?.find((r) => r.id === id);
}
function queryCustomAgentRoleIds(settings) {
  return (settings.customAgentRoles ?? []).map((r) => r.id);
}
function queryNormalizeCustomAgentRoles(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  const seen = /* @__PURE__ */ new Set();
  const now = Date.now();
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item;
    let id = String(row.id ?? "").trim();
    if (!queryIsCustomAgentRoleId(id)) {
      id = queryPostCustomAgentRoleId(String(row.label ?? "role"), seen);
    }
    if (!id || seen.has(id)) continue;
    const label = String(row.label ?? id).trim() || id;
    const description = String(row.description ?? "").trim();
    const systemPrompt = String(row.systemPrompt ?? "").trim();
    if (!systemPrompt) continue;
    let toolWhitelist = null;
    if (row.toolWhitelist === null) {
      toolWhitelist = null;
    } else if (Array.isArray(row.toolWhitelist)) {
      const names = row.toolWhitelist.map((t) => String(t).trim()).filter(Boolean);
      toolWhitelist = names;
    }
    const createdAt = Number(row.createdAt) || now;
    const updatedAt = Number(row.updatedAt) || createdAt;
    seen.add(id);
    out.push({
      id,
      label,
      description,
      systemPrompt,
      toolWhitelist,
      createdAt,
      updatedAt
    });
  }
  return out;
}
function queryRoleTaskCardMetaList(settings) {
  const builtin = [
    {
      value: "general",
      label: "通用助手",
      description: "闲聊、问答、单步工具与通用任务编排",
      builtin: true
    },
    {
      value: "researcher",
      label: "调研员",
      description: "热点调研、素材收集与配图路径汇总",
      builtin: true
    },
    {
      value: "writer",
      label: "撰稿人",
      description: "基于调研结果撰写标题、正文与话题标签",
      builtin: true
    },
    {
      value: "publisher",
      label: "发布员",
      description: "按成稿与配图完成小红书 / 抖音渠道发布",
      builtin: true
    },
    {
      value: "scriptwriter",
      label: "编剧",
      description: "创意脚本、分镜拆分与提示词精细化",
      builtin: true
    },
    {
      value: "videographer",
      label: "视频制作",
      description: "场景素材生成、T2I / I2V 渲染与校验",
      builtin: true
    },
    {
      value: "editor",
      label: "剪辑师",
      description: "音画对齐、粗剪拼接与成片导出",
      builtin: true
    },
    {
      value: "script",
      label: "剧本任务",
      description: "独立剧本生成任务使用的模型连接",
      builtin: true
    },
    {
      value: "storyboard",
      label: "分镜任务",
      description: "独立分镜生成任务使用的模型连接",
      builtin: true
    },
    {
      value: "video",
      label: "视频任务",
      description: "独立视频生成任务使用的模型连接",
      builtin: true
    }
  ];
  const custom = (settings.customAgentRoles ?? []).map((r) => ({
    value: r.id,
    label: r.label,
    description: r.description || "用户自定义聊天角色",
    builtin: false
  }));
  return [...builtin, ...custom];
}
function queryAgentRoleLabel(role, settings) {
  if (role === "supervisor") return "调度器";
  const card = queryRoleTaskCardMetaList(settings ?? { customAgentRoles: [] }).find(
    (c) => c.value === role
  );
  if (card) return card.label;
  const custom = queryCustomAgentRole(settings?.customAgentRoles, role);
  return custom?.label ?? role;
}
function postLaunchAtLogin(enabled) {
  if (!enabled) {
    electron.app.setLoginItemSettings({ openAtLogin: false });
    return;
  }
  if (electron.app.isPackaged) {
    electron.app.setLoginItemSettings({ openAtLogin: true });
    return;
  }
  const entry = process.argv[1];
  electron.app.setLoginItemSettings({
    openAtLogin: true,
    path: process.execPath,
    args: entry ? [path.resolve(entry)] : []
  });
}
function getDataRoot() {
  const root = path.join(electron.app.getPath("userData"), "react-agent-data");
  ensureDir(root);
  ensureDir(path.join(root, "sessions"));
  ensureDir(path.join(root, "publish-plans"));
  ensureDir(path.join(root, "scheduled-tasks"));
  ensureDir(path.join(root, "browser-profile"));
  ensureDir(path.join(root, "browser-profile-headless"));
  ensureDir(path.join(root, "artifacts"));
  ensureDir(path.join(root, "videos"));
  return root;
}
function getSessionsDir() {
  return path.join(getDataRoot(), "sessions");
}
function getPlansDir() {
  return path.join(getDataRoot(), "publish-plans");
}
function getSchedulesDir() {
  return path.join(getDataRoot(), "scheduled-tasks");
}
function getBrowserProfileDir() {
  return path.join(getDataRoot(), "browser-profile");
}
function getHeadlessBrowserProfileDir() {
  return path.join(getDataRoot(), "browser-profile-headless");
}
function getArtifactsDir() {
  return path.join(getDataRoot(), "artifacts");
}
function getChatUploadsDir() {
  const dir = path.join(getDataRoot(), "chat-uploads");
  ensureDir(dir);
  return dir;
}
function getVideosDir() {
  const dir = path.join(getDataRoot(), "videos");
  ensureDir(dir);
  return dir;
}
function getSkillImportTempDir() {
  const dir = path.join(getDataRoot(), "skill-import-tmp");
  ensureDir(dir);
  return dir;
}
function getSettingsPath() {
  return path.join(getDataRoot(), "settings.json");
}
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}
function queryNormalizeProvider(raw, baseUrl, customProviders) {
  if (raw === "deepseek" || raw === "dashscope" || raw === "ofox" || raw === "openai_compatible") {
    return raw;
  }
  const id = String(raw ?? "").trim();
  if (id.startsWith("custom:") && customProviders.some((item) => item.id === id)) {
    return id;
  }
  if (String(baseUrl).includes("api.deepseek.com")) return "deepseek";
  if (String(baseUrl).includes("api.ofox.io")) return "ofox";
  return DEFAULT_SETTINGS.provider;
}
function queryNormalizeConnection(raw, index2, customProviders) {
  if (!raw || typeof raw !== "object") return null;
  const row = raw;
  const id = String(row.id ?? `conn-${index2}`).trim() || `conn-${index2}`;
  const provider = queryNormalizeProvider(row.provider, String(row.baseUrl ?? ""), customProviders);
  const capabilities = Array.isArray(row.capabilities) ? row.capabilities.map(String).filter(
    (c) => ["chat", "reasoning", "vision", "longContext", "creative"].includes(c)
  ) : ["chat"];
  return {
    id,
    label: String(row.label ?? `连接 ${index2 + 1}`).trim() || `连接 ${index2 + 1}`,
    provider,
    apiKey: String(row.apiKey ?? ""),
    baseUrl: String(row.baseUrl ?? ""),
    model: String(row.model ?? "qwen-plus"),
    capabilities: capabilities.length ? capabilities : ["chat"]
  };
}
function queryMigrateLegacyConnections(raw, customProviders) {
  const fromList = Array.isArray(raw.connections) ? raw.connections.map((item, i) => queryNormalizeConnection(item, i, customProviders)).filter((c) => Boolean(c)) : [];
  if (fromList.length > 0) {
    const legacyKey = String(raw.apiKey ?? "").trim();
    const legacyProvider = queryNormalizeProvider(
      raw.provider,
      String(raw.baseUrl ?? ""),
      customProviders
    );
    if (!legacyKey) return fromList;
    return fromList.map((conn) => {
      if (conn.apiKey.trim()) return conn;
      if (conn.provider === legacyProvider) {
        return { ...conn, apiKey: legacyKey };
      }
      return conn;
    });
  }
  const provider = queryNormalizeProvider(
    raw.provider,
    String(raw.baseUrl ?? ""),
    customProviders
  );
  return [
    {
      ...DEFAULT_CONNECTION,
      id: DEFAULT_CONNECTION_ID,
      label: provider === "deepseek" ? "默认（DeepSeek）" : provider === "ofox" ? "默认（OfoxAI）" : "默认（阿里云百炼）",
      provider,
      apiKey: String(raw.apiKey ?? ""),
      baseUrl: String(raw.baseUrl ?? DEFAULT_CONNECTION.baseUrl),
      model: String(raw.model ?? DEFAULT_CONNECTION.model),
      capabilities: ["chat", "reasoning"]
    }
  ];
}
function normalizeSettings(raw) {
  const merged = { ...DEFAULT_SETTINGS, ...raw };
  delete merged.agentRuntime;
  const customProviders = queryNormalizeCustomProviders(raw.customProviders);
  const connections = querySeedDefaultConnections(
    queryMigrateLegacyConnections(raw, customProviders)
  );
  const defaultConnectionId = String(raw.defaultConnectionId ?? "").trim() || connections[0]?.id || DEFAULT_CONNECTION_ID;
  const connectionIds = new Set(connections.map((c) => c.id));
  const primary = connections.find((c) => c.id === defaultConnectionId) ?? connections[0] ?? DEFAULT_CONNECTION;
  const topProvider = "provider" in raw && raw.provider != null ? queryNormalizeProvider(
    raw.provider,
    String(merged.baseUrl ?? ""),
    customProviders
  ) : primary.provider;
  const topProviderMeta = queryProviderOption(topProvider, customProviders);
  const topApiKey = String(merged.apiKey ?? "");
  const topBaseUrl = String(merged.baseUrl || topProviderMeta.defaultBaseUrl);
  const topModel = String(merged.model || topProviderMeta.defaultModel);
  const rawRoleMap = raw.roleModelMap && typeof raw.roleModelMap === "object" ? { ...raw.roleModelMap } : {};
  const roleModelMap = queryMergeDefaultRoleModelMap(
    rawRoleMap,
    connectionIds,
    primary.id
  );
  const rolePromptOverrides = queryMergeDefaultRolePromptOverrides(
    raw.rolePromptOverrides && typeof raw.rolePromptOverrides === "object" ? raw.rolePromptOverrides : void 0
  );
  const roleToolWhitelistOverrides = queryNormalizeRoleToolWhitelistOverrides(
    raw.roleToolWhitelistOverrides
  );
  const roleSkillIds = queryNormalizeRoleSkillIds(raw.roleSkillIds);
  const customAgentRoles = queryNormalizeCustomAgentRoles(raw.customAgentRoles);
  const draftForSync = {
    provider: topProvider,
    apiKey: topApiKey,
    baseUrl: topBaseUrl,
    model: topModel,
    connections,
    defaultConnectionId: primary.id,
    customProviders
  };
  const syncedConnections = querySyncConnectionsProviderCredentials(connections, draftForSync);
  return {
    provider: topProvider,
    apiKey: topApiKey,
    baseUrl: topBaseUrl,
    model: topModel,
    connections: syncedConnections,
    defaultConnectionId: primary.id,
    roleModelMap,
    rolePromptOverrides,
    roleToolWhitelistOverrides,
    roleSkillIds,
    customAgentRoles,
    fullAccess: Boolean(merged.fullAccess),
    thinkingEnabled: Boolean(merged.thinkingEnabled),
    maxTurns: Number(merged.maxTurns) || DEFAULT_SETTINGS.maxTurns,
    launchAtLogin: Boolean(merged.launchAtLogin),
    // 缺省 true：关闭窗口进托盘，与状态栏图标能力配套
    closeToTray: merged.closeToTray == null ? true : Boolean(merged.closeToTray),
    customProviders,
    providerModelCatalog: queryNormalizeProviderModelCatalog(raw.providerModelCatalog),
    comfyUi: queryNormalizeComfyUi(raw.comfyUi ?? merged.comfyUi)
  };
}
function queryNormalizeComfyUi(raw) {
  const fallback = DEFAULT_SETTINGS.comfyUi;
  if (!raw || typeof raw !== "object") return { ...fallback };
  const obj = raw;
  const baseUrl = String(obj.baseUrl ?? fallback.baseUrl).trim() || fallback.baseUrl;
  return {
    baseUrl: baseUrl.replace(/\/+$/, ""),
    enabled: obj.enabled == null ? true : Boolean(obj.enabled)
  };
}
function readSettingsFile() {
  const path2 = getSettingsPath();
  if (!fs.existsSync(path2)) {
    return normalizeSettings({ ...DEFAULT_SETTINGS });
  }
  try {
    const raw = JSON.parse(fs.readFileSync(path2, "utf-8"));
    return normalizeSettings(raw);
  } catch {
    return normalizeSettings({ ...DEFAULT_SETTINGS });
  }
}
function querySettings() {
  const path2 = getSettingsPath();
  if (!fs.existsSync(path2)) {
    const initial = normalizeSettings({ ...DEFAULT_SETTINGS });
    fs.writeFileSync(path2, JSON.stringify(initial, null, 2), "utf-8");
    return initial;
  }
  return readSettingsFile();
}
function postSettings(partial) {
  const current = readSettingsFile();
  const nextPartial = { ...current, ...partial };
  if (partial.connections) {
    const synced = querySyncConnectionsProviderCredentials(partial.connections, {
      ...current,
      ...partial,
      connections: partial.connections
    });
    nextPartial.connections = synced;
    if (partial.provider != null) nextPartial.provider = partial.provider;
    if (partial.apiKey != null) nextPartial.apiKey = partial.apiKey;
    if (partial.baseUrl != null) nextPartial.baseUrl = partial.baseUrl;
    if (partial.model != null) nextPartial.model = partial.model;
    const defaultId = String(partial.defaultConnectionId ?? current.defaultConnectionId).trim() || synced[0]?.id || DEFAULT_CONNECTION_ID;
    const primary = synced.find((c) => c.id === defaultId) ?? synced[0];
    if (primary) {
      if (partial.defaultConnectionId == null) {
        nextPartial.defaultConnectionId = primary.id;
      }
    }
  }
  if ((partial.apiKey != null || partial.baseUrl != null || partial.model != null || partial.provider != null) && !partial.connections) {
    const synced = querySyncTopLevelModelToConnections(current, partial);
    nextPartial.model = synced.model;
    nextPartial.connections = synced.connections;
    nextPartial.defaultConnectionId = synced.defaultConnectionId;
    if (partial.provider != null) {
      nextPartial.provider = synced.provider;
    }
  }
  const next = normalizeSettings(nextPartial);
  fs.writeFileSync(getSettingsPath(), JSON.stringify(next, null, 2), "utf-8");
  postLaunchAtLogin(next.launchAtLogin);
  return next;
}
const DASHSCOPE_INTL_COMPAT_BASE = "https://dashscope-intl.aliyuncs.com/compatible-mode/v1";
const DASHSCOPE_CODING_CN_BASE = "https://coding.dashscope.aliyuncs.com/v1";
const DASHSCOPE_CODING_INTL_BASE = "https://coding-intl.dashscope.aliyuncs.com/v1";
function queryModelsEndpoint(baseUrl, modelsUrl) {
  const custom = modelsUrl?.trim();
  if (custom) return custom.replace(/\/+$/, "");
  const trimmed = baseUrl.trim().replace(/\/+$/, "");
  return `${trimmed}/models`;
}
function queryNormalizeDashscopeCompatBaseUrl(baseUrl) {
  const trimmed = baseUrl.trim().replace(/\/+$/, "");
  const fallback = queryProviderOption("dashscope").defaultBaseUrl;
  if (!trimmed) return fallback;
  if (trimmed.endsWith("/compatible-mode")) return `${trimmed}/v1`;
  return trimmed;
}
function queryNormalizeOfoxCompatBaseUrl(baseUrl) {
  const trimmed = baseUrl.trim().replace(/\/+$/, "");
  const fallback = queryProviderOption("ofox").defaultBaseUrl;
  if (!trimmed) return fallback;
  if (trimmed === "https://api.ofox.io") return fallback;
  return trimmed;
}
function queryDashscopeModelsBaseUrlCandidates(baseUrl) {
  const preferred = queryNormalizeDashscopeCompatBaseUrl(baseUrl);
  const defaults = queryProviderOption("dashscope").defaultBaseUrl;
  const ordered = [
    preferred,
    defaults,
    DASHSCOPE_INTL_COMPAT_BASE,
    DASHSCOPE_CODING_CN_BASE,
    DASHSCOPE_CODING_INTL_BASE
  ];
  const seen = /* @__PURE__ */ new Set();
  const result = [];
  for (const url2 of ordered) {
    const norm = url2.trim().replace(/\/+$/, "");
    if (!norm || seen.has(norm)) continue;
    seen.add(norm);
    result.push(norm);
  }
  return result;
}
function queryResolveProviderModelsCredentials(saved, override) {
  const provider = override?.provider ?? saved.provider;
  const providerMeta = queryProviderOption(provider, saved.customProviders ?? []);
  let apiKey = String(override?.apiKey ?? saved.apiKey ?? "").trim();
  let baseUrl = String(override?.baseUrl ?? saved.baseUrl ?? "").trim();
  if (!apiKey) {
    const matched = saved.connections?.find(
      (conn) => conn.provider === provider && conn.apiKey.trim()
    );
    if (matched) apiKey = matched.apiKey.trim();
  }
  if (!baseUrl) {
    baseUrl = providerMeta.defaultBaseUrl;
  }
  if (provider === "dashscope") {
    baseUrl = queryNormalizeDashscopeCompatBaseUrl(baseUrl);
  }
  if (provider === "ofox") {
    baseUrl = queryNormalizeOfoxCompatBaseUrl(baseUrl);
  }
  return { provider, apiKey, baseUrl, customProviders: saved.customProviders ?? [] };
}
function queryTruncateProviderModelDescription(text, maxLength = 120) {
  const trimmed = text.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength - 1)}…`;
}
function queryOfoxModelSupportsAgentChat(item) {
  const endpoints = item.supported_endpoints;
  if (!Array.isArray(endpoints) || endpoints.length === 0) return true;
  return endpoints.some(
    (endpoint) => endpoint === "/v1/chat/completions" || endpoint === "/v1/responses" || endpoint === "/v1/messages"
  );
}
function queryCategoryFromOfoxArchitecture(item) {
  const modality = item.architecture?.modality?.trim().toLowerCase();
  if (!modality) return void 0;
  if (modality.includes("video")) return "视频生成";
  if (modality.includes("->image") || modality.endsWith("image")) return "文生图";
  if (modality.includes("embedding")) return "向量嵌入";
  if (/audio|speech|tts|asr/.test(modality)) return "语音";
  return void 0;
}
function queryModelOptionsFromListResponse(provider, payload) {
  const items = (payload.data ?? []).filter((item) => Boolean(item.id?.trim()));
  const seen = /* @__PURE__ */ new Set();
  const uniqueItems = [];
  for (const item of items) {
    const id = item.id.trim();
    if (seen.has(id)) continue;
    seen.add(id);
    if (provider === "ofox" && !queryOfoxModelSupportsAgentChat(item)) continue;
    uniqueItems.push(item);
  }
  const staticByValue = new Map(
    queryModelOptions(provider).map((option) => [option.value, option])
  );
  return uniqueItems.map((item) => {
    const id = item.id.trim();
    const known = staticByValue.get(id);
    const platformName = item.name?.trim();
    const platformDescription = item.description?.trim();
    const category = queryCategoryFromOfoxArchitecture(item) ?? queryModelCategory(id);
    const ownedBy = item.owned_by?.trim();
    return {
      provider,
      value: id,
      label: known?.label ?? platformName ?? id,
      description: known?.description ?? (platformDescription ? queryTruncateProviderModelDescription(platformDescription) : ownedBy ? `来源 ${ownedBy}` : void 0),
      category
    };
  });
}
async function queryFetchProviderModelsOnce(provider, apiKey, modelsEndpoint, fetchImpl, baseUrlForError) {
  const response = await fetchImpl(modelsEndpoint, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json"
    }
  });
  if (!response.ok) {
    let detail = "";
    try {
      detail = (await response.text()).slice(0, 200);
    } catch {
    }
    return { status: response.status, detail, baseUrl: baseUrlForError };
  }
  const payload = await response.json();
  const models = queryModelOptionsFromListResponse(provider, payload);
  if (models.length === 0) {
    return queryModelOptions(provider);
  }
  return models;
}
function queryIsRetryableProviderModelsStatus(status) {
  return status === 401 || status === 403 || status === 404;
}
function queryFormatProviderModelsError(failure) {
  if (failure.status === 0) {
    const detail = failure.detail?.trim();
    const reason = detail && !/^fetch failed$/i.test(detail) ? detail : "网络不可达、代理或 DNS 异常";
    const endpoint = failure.baseUrl ? `（${failure.baseUrl}）` : "";
    return `无法连接模型列表服务${endpoint}：${reason}`;
  }
  const suffix = failure.detail ? `：${failure.detail}` : "";
  return `获取模型列表失败（HTTP ${failure.status}）${suffix}`;
}
async function queryFetchProviderModelsWithFallback(settings, fetchImpl) {
  const providerMeta = queryProviderOption(settings.provider, settings.customProviders ?? []);
  const apiKey = settings.apiKey.trim();
  const baseUrl = (settings.baseUrl || providerMeta.defaultBaseUrl).trim();
  const customModelsUrl = providerMeta.modelsUrl?.trim();
  if (customModelsUrl) {
    const endpoint = queryModelsEndpoint(baseUrl, customModelsUrl);
    try {
      const result = await queryFetchProviderModelsOnce(
        settings.provider,
        apiKey,
        endpoint,
        fetchImpl,
        endpoint
      );
      if (Array.isArray(result)) return result;
      throw new Error(queryFormatProviderModelsError(result));
    } catch (err) {
      if (err instanceof Error && err.message.startsWith("获取模型列表失败")) throw err;
      throw new Error(
        `获取模型列表失败：${err instanceof Error ? err.message : String(err)}`
      );
    }
  }
  const candidates = settings.provider === "dashscope" ? queryDashscopeModelsBaseUrlCandidates(baseUrl) : [baseUrl.trim().replace(/\/+$/, "") || providerMeta.defaultBaseUrl];
  let lastFailure = null;
  for (const candidate of candidates) {
    try {
      const result = await queryFetchProviderModelsOnce(
        settings.provider,
        apiKey,
        queryModelsEndpoint(candidate),
        fetchImpl,
        candidate
      );
      if (Array.isArray(result)) {
        return result;
      }
      lastFailure = result;
      if (!queryIsRetryableProviderModelsStatus(result.status)) {
        break;
      }
    } catch (err) {
      lastFailure = {
        status: 0,
        detail: err instanceof Error ? err.message : String(err),
        baseUrl: candidate
      };
    }
  }
  if (lastFailure) {
    const hint = settings.provider === "dashscope" ? "；请确认 API Key 与 Base URL 区域一致（国内 / 国际 / Coding Plan）" : "";
    throw new Error(`${queryFormatProviderModelsError(lastFailure)}${hint}`);
  }
  return queryModelOptions(settings.provider);
}
async function queryProviderModels(settings, fetchImpl = fetch) {
  const providerMeta = queryProviderOption(settings.provider, settings.customProviders ?? []);
  const apiKey = settings.apiKey.trim();
  if (!apiKey) {
    throw new Error(`未配置 ${providerMeta.apiKeyLabel}，无法从平台获取模型列表`);
  }
  return queryFetchProviderModelsWithFallback(settings, fetchImpl);
}
function querySessions() {
  const dir = getSessionsDir();
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
  const list = [];
  for (const file of files) {
    try {
      const raw = JSON.parse(fs.readFileSync(path.join(dir, file), "utf-8"));
      list.push(raw);
    } catch {
    }
  }
  return list.sort((a, b) => b.updatedAt - a.updatedAt);
}
function querySession(id) {
  const path$1 = path.join(getSessionsDir(), `${id}.json`);
  if (!fs.existsSync(path$1)) return null;
  try {
    return JSON.parse(fs.readFileSync(path$1, "utf-8"));
  } catch {
    return null;
  }
}
function postSession(session) {
  const path$1 = path.join(getSessionsDir(), `${session.id}.json`);
  fs.writeFileSync(path$1, JSON.stringify(session, null, 2), "utf-8");
  return session;
}
function postDeleteSession(id) {
  const path$1 = path.join(getSessionsDir(), `${id}.json`);
  if (fs.existsSync(path$1)) fs.unlinkSync(path$1);
}
const BUILTIN_PUBLISH_PLAN_IDS = {
  /** 多渠道：AI 热点 + 体育资讯 */
  multiChannel: "builtin-publish-multi-channel",
  /** 单渠道：小红书科技短讯 */
  xhsQuick: "builtin-publish-xhs-quick",
  /** 流程任务：热点抓取 → 飞书 post 富文本推送 */
  feishuRichtext: "builtin-publish-feishu-richtext"
};
const BUILTIN_WORKFLOW_IDS = {
  /** 热点简报 → 飞书 post 富文本 */
  feishuRichtextPush: "tpl_feishu_richtext_push"
};
const BUILTIN_SCHEDULE_TASK_IDS = {
  /** 每日 9:00 执行多渠道发布计划 */
  dailyMulti: "builtin-schedule-daily-multi",
  /** 每周一 10:00 热点调研指令 */
  weeklyResearch: "builtin-schedule-weekly-research",
  /** 每日 8:00 昨日热点简报并推送飞书 */
  dailyHotPush: "builtin-schedule-daily-hot-push",
  /** 每日 7:30 天气推送（可多通知渠道） */
  dailyWeatherPush: "builtin-schedule-daily-weather-push",
  /** 每日 8:30 执行飞书富文本推送流程 */
  feishuRichtextPush: "builtin-schedule-feishu-richtext-push",
  /** 每周五 18:00 文娱推荐发布 */
  weeklyEntertainment: "builtin-schedule-weekly-entertainment"
};
function createBuiltinPublishPlans(now = Date.now()) {
  return [
    {
      id: BUILTIN_PUBLISH_PLAN_IDS.multiChannel,
      title: "多渠道内容发布",
      description: "AI 热点 + 体育资讯，覆盖小红书与抖音",
      kind: "normal",
      workflowIds: [],
      notifyChannels: [],
      subTasks: [
        {
          id: "builtin-sub-ai-multi",
          title: "人工智能 · 小红书 + 抖音",
          channels: ["xhs", "douyin"],
          notifyChannels: [],
          topic: "人工智能",
          autoPublish: true,
          contentPrompt: "内容主题：搜罗昨日 ai 最新热门新闻。热点：优先 fetch_hot_topics（source 依次 tophub、weibo、douyin、baidu）。配图：从相关新闻来源网页用 fetch_web_images 抓取封面图（本地上传可选）。未登录时会暂停等人扫码。"
        },
        {
          id: "builtin-sub-sports-xhs",
          title: "体育 · 小红书",
          channels: ["xhs"],
          notifyChannels: [],
          topic: "体育",
          autoPublish: true,
          contentPrompt: "内容主题：搜罗昨日最新 nba 信息、交易、球星评论等。配图：从相关新闻来源网页抓取（本地上传可选）。未登录时会暂停等人扫码。"
        }
      ],
      createdAt: now,
      updatedAt: now
    },
    {
      id: BUILTIN_PUBLISH_PLAN_IDS.xhsQuick,
      title: "小红书快速发布",
      description: "单渠道科技短讯，适合日常随手发",
      kind: "normal",
      workflowIds: [],
      notifyChannels: [],
      subTasks: [
        {
          id: "builtin-sub-tech-xhs",
          title: "科技短讯 · 小红书",
          channels: ["xhs"],
          notifyChannels: [],
          topic: "科技",
          autoPublish: true,
          contentPrompt: "内容主题：整理今日 3 条科技行业要闻，每条一句话摘要 + 来源链接。配图：从新闻页抓取封面。语气简洁、适合信息流阅读。"
        }
      ],
      createdAt: now,
      updatedAt: now
    },
    {
      id: BUILTIN_PUBLISH_PLAN_IDS.feishuRichtext,
      title: "飞书富文本推送",
      description: "抓取多平台热搜（微博/百度/抖音/腾讯等），整理 Markdown 简报，完成后自动推送飞书 post 富文本",
      kind: "workflow",
      workflowIds: [BUILTIN_WORKFLOW_IDS.feishuRichtextPush],
      notifyChannels: ["feishu"],
      subTasks: [],
      createdAt: now,
      updatedAt: now
    }
  ];
}
function createBuiltinScheduledTasks(now = Date.now()) {
  return [
    {
      id: BUILTIN_SCHEDULE_TASK_IDS.dailyMulti,
      title: "每日早报 · 多渠道发布",
      description: "每天 9:00 自动执行「多渠道内容发布」计划",
      enabled: false,
      repeat: "daily",
      timeOfDay: "09:00",
      weekday: 1,
      actionType: "publish_plan",
      publishPlanId: BUILTIN_PUBLISH_PLAN_IDS.multiChannel,
      createdAt: now,
      updatedAt: now
    },
    {
      id: BUILTIN_SCHEDULE_TASK_IDS.weeklyResearch,
      title: "周一热点调研",
      description: "每周一 10:00 汇总上周 AI 与科技热点，并自动推送飞书",
      enabled: false,
      repeat: "weekly",
      timeOfDay: "10:00",
      weekday: 1,
      actionType: "custom_prompt",
      customPrompt: "请调研上周人工智能与科技行业的热点事件（可调用 fetch_hot_topics，优先 source=tophub，不足再试 weibo/baidu/douyin），整理成 5 条要点摘要，每条包含标题、一句话说明和参考来源链接。输出 Markdown 格式，便于后续改写为发布内容。",
      /** 任务成功后主进程自动将正文转为飞书富文本推送 */
      notifyChannels: ["feishu"],
      createdAt: now,
      updatedAt: now
    },
    {
      id: BUILTIN_SCHEDULE_TASK_IDS.dailyHotPush,
      title: "昨日热点推送",
      description: "每天 8:00 抓取多平台热搜，筛选科技相关热点并推送飞书",
      enabled: false,
      repeat: "daily",
      timeOfDay: "08:00",
      weekday: 1,
      actionType: "custom_prompt",
      customPrompt: "请获取昨日热搜中与人工智能、科技、互联网相关的热点（优先调用 fetch_hot_topics，source 依次尝试 tophub、weibo、baidu、douyin）。整理成 8 条要点简报，每条包含：标题、一句话说明、可参考的资讯来源或链接。输出 Markdown 格式，文首加标题「昨日热点简报」，便于自动推送飞书。",
      /** 任务成功后主进程自动将正文转为飞书富文本推送 */
      notifyChannels: ["feishu"],
      createdAt: now,
      updatedAt: now
    },
    {
      id: BUILTIN_SCHEDULE_TASK_IDS.dailyWeatherPush,
      title: "每日天气推送",
      description: "每天 7:30 查询本地天气并推送到已配置通知渠道（支持多渠道）",
      enabled: false,
      repeat: "daily",
      timeOfDay: "07:30",
      weekday: 1,
      actionType: "custom_prompt",
      customPrompt: "请调用 query_weather 获取今日天气（可不传 city，按本机定位）。整理成简洁中文简报（城市、天气、气温、湿度、穿衣建议一句），文首标题「今日天气」。若已配置多个通知渠道，可调用 notify_message 并传 channelIds 同时推送。",
      notifyChannels: ["feishu"],
      createdAt: now,
      updatedAt: now
    },
    {
      id: BUILTIN_SCHEDULE_TASK_IDS.feishuRichtextPush,
      title: "飞书富文本推送 · 每日自动",
      description: "每天 8:30 执行「飞书富文本推送」流程任务，将 post 富文本推送到飞书",
      enabled: false,
      repeat: "daily",
      timeOfDay: "08:30",
      weekday: 1,
      actionType: "publish_plan",
      publishPlanId: BUILTIN_PUBLISH_PLAN_IDS.feishuRichtext,
      notifyChannels: ["feishu"],
      createdAt: now,
      updatedAt: now
    },
    {
      id: BUILTIN_SCHEDULE_TASK_IDS.weeklyEntertainment,
      title: "周五文娱推荐",
      description: "每周五 18:00 执行「小红书快速发布」计划",
      enabled: false,
      repeat: "weekly",
      timeOfDay: "18:00",
      weekday: 5,
      actionType: "publish_plan",
      publishPlanId: BUILTIN_PUBLISH_PLAN_IDS.xhsQuick,
      createdAt: now,
      updatedAt: now
    }
  ];
}
const FEISHU_NOTIFY_MSG_TYPES = [
  "text",
  "post",
  "image",
  "share_chat"
];
const LEGACY_FEISHU_AGENT_HINTS = /* @__PURE__ */ new Set([
  "使用 notify_message, channelId 传 feishu; 勿在参数中填写 webhook。",
  "使用 notify_message，channelId 传 feishu；勿在参数中填写 webhook。",
  "使用 notify_message，channelId 传 feishu；勿在参数中填写 webhook。可选 msgType：text / post / image / share_chat；post 时 content 可用 Markdown；image 需传 imageKey；share_chat 需传 shareChatId。"
]);
function queryShouldRefreshFeishuAgentHint(current, channelId = "feishu") {
  const trimmed = current.trim();
  if (!trimmed) return true;
  if (LEGACY_FEISHU_AGENT_HINTS.has(trimmed)) return true;
  const id = channelId.trim() || "feishu";
  for (const msgType of FEISHU_NOTIFY_MSG_TYPES) {
    if (trimmed === queryFeishuNotifyAgentHint({ channelId: id, feishuMsgType: msgType })) {
      return true;
    }
  }
  return false;
}
function queryFeishuNotifyAgentHint(opts) {
  const channelId = opts.channelId?.trim() || "feishu";
  const msgType = opts.feishuMsgType ?? "post";
  const lines = [
    `调用 notify_message，channelId 传「${channelId}」；禁止在参数或对话中填写 webhook / 签名密钥。`,
    "同一渠道 + 同一正文只调用一次；工具返回成功后立即结束，禁止重复发送。"
  ];
  switch (msgType) {
    case "post":
      lines.splice(
        1,
        0,
        "本渠道默认 msgType=post（富文本）：title 填卡片标题，content 填 Markdown 正文（支持 # 标题、列表、表格、链接、粗体）。",
        "正文含 Markdown 结构时可省略 msgType；纯文本短通知可显式传 msgType=text。",
        "若机器人启用了「自定义关键词」安全设置，正文须包含该关键词。"
      );
      break;
    case "text":
      lines.splice(
        1,
        0,
        "本渠道默认 msgType=text（纯文本）：content 填正文，可选 title 作为首行前缀。",
        "若机器人启用了「自定义关键词」安全设置，正文须包含该关键词。"
      );
      break;
    case "image":
      lines.splice(
        1,
        0,
        "本渠道默认 msgType=image：须传 imageKey（飞书上传图片 API 获取）；content 可留空。",
        "若渠道页已配置 image_key，调用时可省略 imageKey。"
      );
      break;
    case "share_chat":
      lines.splice(
        1,
        0,
        "本渠道默认 msgType=share_chat：须传 shareChatId；content 可留空。",
        "若渠道页已配置 share_chat_id，调用时可省略 shareChatId。"
      );
      break;
  }
  return lines.join("\n");
}
function queryWebhookNotifyAgentHint(channelId = "webhook") {
  return [
    `调用 notify_message，channelId 传「${channelId}」；禁止在参数或对话中填写 webhook URL / 签名密钥。`,
    "content 填通知正文，可选 title；不支持飞书专属 msgType / imageKey。",
    "同一渠道 + 同一正文只调用一次；工具返回成功后立即结束，禁止重复发送。"
  ].join("\n");
}
function normalizeFeishuMsgType(raw) {
  if (typeof raw !== "string") return void 0;
  const trimmed = raw.trim();
  return FEISHU_NOTIFY_MSG_TYPES.includes(trimmed) ? trimmed : void 0;
}
function queryFeishuMsgType(opts) {
  const explicit = normalizeFeishuMsgType(opts.msgType);
  if (explicit) return explicit;
  if (opts.richText === false) return "text";
  if (opts.richText === true) return "post";
  if (opts.channelDefault) return opts.channelDefault;
  if (opts.channelId === "feishu") return "post";
  return "text";
}
function normalizeChannelKind(raw) {
  return raw === "notify" ? "notify" : "publish";
}
const DEFAULT_PUBLISH_CHANNELS = [
  {
    id: "xhs",
    kind: "publish",
    label: "小红书",
    description: "图文笔记发布，支持网页配图抓取；可开启拟人浏览器或走 SDK 占位通道。",
    enabled: true,
    publishTool: "xhs_publish_note",
    titleMaxLength: 20,
    loginCheckUrl: "https://creator.xiaohongshu.com/publish/publish?from=menu&target=image",
    humanized: false,
    agentHint: "优先使用 xhs_publish_note。先判断类型并传 publishType：image=图文（配图）、video=视频（videoPaths）、article=长文、audio=播客（audioPaths）。工具会自动打开 from=menu&target=对应类型 的官方入口再填充。字数硬上限（务必遵守，超限工具会截断）：图文/视频/播客标题≤20、正文≤1000；长文标题≤40、正文≤10000。图文可传 imageSourceUrl 或先 fetch_web_images 再传 imagePaths。渠道「拟人操作」关闭时走 SDK（未接入会提示）；开启后才用浏览器拟人发布。内容须去同质化：每篇标题结构、正文段落、话题标签需差异化，禁止模板批量替换关键词。拟人模式下工具会自动随机延迟、配图微处理；遵守日≤2篇/周≤10篇、深夜0-6点不操作。",
    isBuiltin: true
  },
  {
    id: "douyin",
    kind: "publish",
    label: "抖音",
    description: "创作者中心图文发布；可开启拟人浏览器或走 SDK 占位通道。视频后续接入。",
    enabled: true,
    publishTool: "douyin_publish_note",
    titleMaxLength: 20,
    loginCheckUrl: "https://creator.douyin.com/creator-micro/content/upload",
    humanized: false,
    agentHint: "优先使用 douyin_publish_note 发布图文笔记（可传 imageSourceUrl 或先 fetch 再传 imagePaths）。渠道「拟人操作」关闭时走 SDK（未接入会提示）；开启后才用浏览器拟人发布。当前仅支持图文，视频发布后续支持。",
    isBuiltin: true
  },
  {
    id: "wechat_channels",
    kind: "publish",
    label: "视频号",
    description: "微信视频号发布能力预留中，接入后将支持图文与短视频。",
    enabled: false,
    publishTool: "wechat_channels_publish_note",
    agentHint: "视频号发布能力尚未接入，请勿调用发布工具。",
    isBuiltin: true
  },
  {
    id: "feishu",
    kind: "notify",
    label: "飞书",
    description: "通过自定义机器人 Webhook 推送通知；支持文本、富文本、图片消息与群名片。",
    enabled: true,
    notifyTool: "notify_message",
    notifyConfig: { feishuMsgType: "post" },
    agentHint: queryFeishuNotifyAgentHint({ channelId: "feishu", feishuMsgType: "post" }),
    isBuiltin: true
  },
  {
    id: "webhook",
    kind: "notify",
    label: "通用 Webhook",
    description: "向任意 HTTP Webhook 推送 JSON 文本通知（企业微信/钉钉等可自配）。",
    enabled: true,
    notifyTool: "notify_message",
    notifyConfig: {},
    agentHint: queryWebhookNotifyAgentHint("webhook"),
    isBuiltin: true
  },
  {
    id: "wechat_notify",
    kind: "notify",
    label: "微信",
    description: "微信通知能力预留中。",
    enabled: false,
    notifyTool: "notify_message",
    agentHint: "微信通知尚未接入，请勿调用。",
    isBuiltin: true
  },
  {
    id: "qq_notify",
    kind: "notify",
    label: "QQ",
    description: "QQ 通知能力预留中。",
    enabled: false,
    notifyTool: "notify_message",
    agentHint: "QQ 通知尚未接入，请勿调用。",
    isBuiltin: true
  }
];
let runtimeChannels = [...DEFAULT_PUBLISH_CHANNELS];
function setPublishChannelRegistry(channels) {
  runtimeChannels = channels.length ? channels : [...DEFAULT_PUBLISH_CHANNELS];
}
function getPublishChannels() {
  return runtimeChannels;
}
function getChannelByIdMap() {
  return new Map(runtimeChannels.map((c) => [c.id, c]));
}
const LEGACY_LABEL_TO_ID = {
  小红书: "xhs",
  抖音: "douyin",
  视频号: "wechat_channels"
};
function normalizePublishChannelId(raw) {
  const trimmed = String(raw).trim();
  if (getChannelByIdMap().has(trimmed)) {
    return trimmed;
  }
  const fromLabel = LEGACY_LABEL_TO_ID[trimmed];
  if (fromLabel) return fromLabel;
  return "xhs";
}
function queryPublishChannelLabel(id) {
  const trimmed = String(id).trim();
  const direct = getChannelByIdMap().get(trimmed);
  if (direct) return direct.label;
  const normalized = normalizePublishChannelId(trimmed);
  return getChannelByIdMap().get(normalized)?.label ?? trimmed;
}
function queryPublishChannelMeta(id) {
  const trimmed = String(id).trim();
  const direct = getChannelByIdMap().get(trimmed);
  if (direct) return direct;
  const normalized = normalizePublishChannelId(trimmed);
  return getChannelByIdMap().get(normalized) ?? runtimeChannels[0] ?? DEFAULT_PUBLISH_CHANNELS[0];
}
function normalizePublishSubTaskChannels(raw) {
  if (Array.isArray(raw)) {
    const ids = raw.map((item) => normalizePublishChannelId(String(item))).filter((id, index2, arr) => arr.indexOf(id) === index2);
    return ids.length ? ids : ["xhs"];
  }
  const channels = raw.channels;
  if (Array.isArray(channels) && channels.length > 0) {
    const ids = channels.map((item) => normalizePublishChannelId(String(item))).filter((id, index2, arr) => arr.indexOf(id) === index2);
    return ids.length ? ids : ["xhs"];
  }
  if (raw.channel != null && String(raw.channel).trim()) {
    return [normalizePublishChannelId(String(raw.channel))];
  }
  return ["xhs"];
}
function queryPublishChannelLabels(ids) {
  const normalized = normalizePublishSubTaskChannels(ids);
  return normalized.map((id) => queryPublishChannelLabel(id)).join("、");
}
const WORKFLOW_PRESET_USER_INPUT_KEY = "__presetUserInput";
function queryNormalizePresetUserInput(raw) {
  if (typeof raw !== "string") return void 0;
  const text = raw.trim();
  return text || void 0;
}
function queryBuildWorkflowInitialContext(options) {
  const next = { ...options?.initialContext ?? {} };
  const fromOption = queryNormalizePresetUserInput(options?.presetUserInput);
  const fromContext = queryNormalizePresetUserInput(next[WORKFLOW_PRESET_USER_INPUT_KEY]);
  const preset = fromOption ?? fromContext;
  if (preset) {
    next[WORKFLOW_PRESET_USER_INPUT_KEY] = preset;
  } else {
    delete next[WORKFLOW_PRESET_USER_INPUT_KEY];
  }
  return next;
}
function queryPresetUserInputFromContext(context) {
  if (!context) return void 0;
  return queryNormalizePresetUserInput(context[WORKFLOW_PRESET_USER_INPUT_KEY]);
}
function queryCanSkipInputWaitWithPreset(inputKinds, preset) {
  if (!preset?.trim()) return false;
  const kinds = inputKinds?.length ? inputKinds : ["text"];
  return kinds.includes("text");
}
function normalizeNotifyChannelIds(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map((id) => String(id ?? "").trim()).filter(Boolean).filter((id, i, arr) => arr.indexOf(id) === i);
}
function normalizePublishSubTask(sub) {
  const { channel: _legacyChannel, ...rest } = sub;
  return {
    ...rest,
    channels: normalizePublishSubTaskChannels(sub),
    notifyChannels: normalizeNotifyChannelIds(sub.notifyChannels)
  };
}
function normalizePublishPlanKind(kind) {
  return kind === "workflow" ? "workflow" : "normal";
}
function normalizePublishPlanWorkflowIds(plan) {
  const fromArray = Array.isArray(plan.workflowIds) ? plan.workflowIds.map((id) => String(id ?? "").trim()).filter(Boolean) : [];
  const fromLegacy = typeof plan.workflowId === "string" && plan.workflowId.trim() ? [plan.workflowId.trim()] : [];
  const merged = fromArray.length > 0 ? fromArray : fromLegacy;
  const seen = /* @__PURE__ */ new Set();
  const result = [];
  for (const id of merged) {
    if (seen.has(id)) continue;
    seen.add(id);
    result.push(id);
  }
  return result;
}
function normalizePublishPlan(plan) {
  const kind = normalizePublishPlanKind(plan.kind);
  const workflowIds = kind === "workflow" ? normalizePublishPlanWorkflowIds(plan) : [];
  return {
    ...plan,
    kind,
    workflowIds,
    // 写盘时去掉单字段，避免与数组分叉
    workflowId: void 0,
    notifyChannels: normalizeNotifyChannelIds(plan.notifyChannels),
    presetUserInput: queryNormalizePresetUserInput(plan.presetUserInput),
    subTasks: plan.subTasks.map(
      (sub) => normalizePublishSubTask(sub)
    )
  };
}
function normalizePlan(plan) {
  return normalizePublishPlan(plan);
}
function queryPublishPlans() {
  const dir = getPlansDir();
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
  const list = [];
  for (const file of files) {
    try {
      list.push(normalizePlan(JSON.parse(fs.readFileSync(path.join(dir, file), "utf-8"))));
    } catch {
    }
  }
  return list.sort((a, b) => b.updatedAt - a.updatedAt);
}
function queryPublishPlan(id) {
  const path$1 = path.join(getPlansDir(), `${id}.json`);
  if (!fs.existsSync(path$1)) return null;
  try {
    return normalizePlan(JSON.parse(fs.readFileSync(path$1, "utf-8")));
  } catch {
    return null;
  }
}
function postPublishPlan(plan) {
  const normalized = normalizePublishPlan(plan);
  const path$1 = path.join(getPlansDir(), `${normalized.id}.json`);
  fs.writeFileSync(path$1, JSON.stringify(normalized, null, 2), "utf-8");
  return normalized;
}
function postDeletePublishPlan(id) {
  const path$1 = path.join(getPlansDir(), `${id}.json`);
  if (fs.existsSync(path$1)) fs.unlinkSync(path$1);
}
function postImportBuiltinPublishPlans() {
  const existingIds = new Set(queryPublishPlans().map((plan) => plan.id));
  for (const plan of createBuiltinPublishPlans()) {
    if (!existingIds.has(plan.id)) {
      postPublishPlan(plan);
    }
  }
  return queryPublishPlans();
}
function postInitPublishPlans() {
  if (queryPublishPlans().length > 0) {
    return queryPublishPlans();
  }
  return postImportBuiltinPublishPlans();
}
const WORKDAY_SET = /* @__PURE__ */ new Set([1, 2, 3, 4, 5]);
function parseTimeOfDay(timeOfDay) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(timeOfDay.trim());
  if (!match) return { hours: 9, minutes: 0 };
  const hours = Math.min(23, Math.max(0, Number(match[1])));
  const minutes = Math.min(59, Math.max(0, Number(match[2])));
  return { hours, minutes };
}
function formatTimeOfDayLabel(timeOfDay) {
  const { hours, minutes } = parseTimeOfDay(timeOfDay);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}
function normalizeScheduleTimesOfDay(times) {
  const seen = /* @__PURE__ */ new Set();
  const result = [];
  for (const raw of times) {
    const label = formatTimeOfDayLabel(raw);
    if (seen.has(label)) continue;
    seen.add(label);
    result.push(label);
  }
  result.sort();
  return result.length > 0 ? result : ["09:00"];
}
function queryScheduleTimesOfDay(task) {
  if (task.timesOfDay?.length) {
    return normalizeScheduleTimesOfDay(task.timesOfDay);
  }
  if (task.timeOfDay?.trim()) {
    return normalizeScheduleTimesOfDay([task.timeOfDay]);
  }
  return ["09:00"];
}
function isWorkday(date) {
  return WORKDAY_SET.has(date.getDay());
}
function normalizeScheduleActiveRange(repeat, activeFrom, activeUntil) {
  if (repeat === "once") return {};
  const from = activeFrom != null && Number.isFinite(activeFrom) ? Number(activeFrom) : void 0;
  let until = activeUntil != null && Number.isFinite(activeUntil) ? Number(activeUntil) : void 0;
  if (from != null && until != null && until < from) {
    until = from;
  }
  return {
    ...from != null ? { activeFrom: from } : {},
    ...until != null ? { activeUntil: until } : {}
  };
}
function computeNextRunAtForTime(task, hours, minutes, fromTime) {
  const next = new Date(fromTime);
  next.setSeconds(0, 0);
  next.setHours(hours, minutes, 0, 0);
  if (task.repeat === "daily") {
    if (next.getTime() <= fromTime) {
      next.setDate(next.getDate() + 1);
    }
    return next.getTime();
  }
  if (task.repeat === "weekdays") {
    for (let i = 0; i < 8; i++) {
      if (isWorkday(next) && next.getTime() > fromTime) {
        return next.getTime();
      }
      next.setDate(next.getDate() + 1);
      next.setHours(hours, minutes, 0, 0);
    }
    return null;
  }
  if (task.repeat === "weekly") {
    const targetWeekday = task.weekday ?? 1;
    const currentWeekday = next.getDay();
    let daysToAdd = (targetWeekday - currentWeekday + 7) % 7;
    if (daysToAdd === 0 && next.getTime() <= fromTime) {
      daysToAdd = 7;
    }
    next.setDate(next.getDate() + daysToAdd);
    return next.getTime();
  }
  return null;
}
function computeNextRunAt(task, fromTime = Date.now()) {
  if (!task.enabled) return null;
  if (task.repeat === "once") {
    if (task.runAt != null && task.runAt > fromTime) return task.runAt;
    return null;
  }
  let effectiveFrom = fromTime;
  if (task.activeFrom != null && task.activeFrom > effectiveFrom) {
    effectiveFrom = task.activeFrom;
  }
  if (task.activeUntil != null && effectiveFrom > task.activeUntil) {
    return null;
  }
  const times = queryScheduleTimesOfDay(task);
  let best = null;
  for (const time of times) {
    const { hours, minutes } = parseTimeOfDay(time);
    const candidate = computeNextRunAtForTime(task, hours, minutes, effectiveFrom);
    if (candidate != null && (best == null || candidate < best)) {
      best = candidate;
    }
  }
  if (best != null && task.activeUntil != null && best > task.activeUntil) {
    return null;
  }
  return best;
}
function queryScheduledTaskRunCount(task) {
  if (typeof task.runCount === "number" && task.runCount >= 0) {
    return task.runCount;
  }
  return task.lastRunAt != null ? 1 : 0;
}
function incrementScheduledTaskRunCount(task) {
  return queryScheduledTaskRunCount(task) + 1;
}
function queryRunInBackground(task) {
  return task.runInBackground !== false;
}
function normalizeScheduledTask(task) {
  const timesOfDay = queryScheduleTimesOfDay(task);
  const next = {
    ...task,
    timesOfDay,
    /** 保留首项，兼容仍读取 timeOfDay 的旧逻辑 */
    timeOfDay: timesOfDay[0],
    notifyChannels: normalizeNotifyChannelIds(task.notifyChannels),
    /** 旧任务无字段时默认后台执行 */
    runInBackground: queryRunInBackground(task),
    presetUserInput: queryNormalizePresetUserInput(task.presetUserInput),
    updatedAt: Date.now(),
    nextRunAt: computeNextRunAt(task) ?? void 0
  };
  return next;
}
function queryScheduledTasks() {
  const dir = getSchedulesDir();
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
  const list = [];
  for (const file of files) {
    try {
      list.push(JSON.parse(fs.readFileSync(path.join(dir, file), "utf-8")));
    } catch {
    }
  }
  return list.sort((a, b) => {
    const aNext = a.nextRunAt ?? Number.MAX_SAFE_INTEGER;
    const bNext = b.nextRunAt ?? Number.MAX_SAFE_INTEGER;
    if (aNext !== bNext) return aNext - bNext;
    return b.updatedAt - a.updatedAt;
  });
}
function queryScheduledTask(id) {
  const path$1 = path.join(getSchedulesDir(), `${id}.json`);
  if (!fs.existsSync(path$1)) return null;
  try {
    return JSON.parse(fs.readFileSync(path$1, "utf-8"));
  } catch {
    return null;
  }
}
function postScheduledTask(task) {
  const normalized = normalizeScheduledTask(task);
  const path$1 = path.join(getSchedulesDir(), `${normalized.id}.json`);
  fs.writeFileSync(path$1, JSON.stringify(normalized, null, 2), "utf-8");
  return normalized;
}
function postDeleteScheduledTask(id) {
  const path$1 = path.join(getSchedulesDir(), `${id}.json`);
  if (fs.existsSync(path$1)) fs.unlinkSync(path$1);
}
function postImportBuiltinScheduledTasks() {
  postInitPublishPlans();
  const existingIds = new Set(queryScheduledTasks().map((task) => task.id));
  for (const task of createBuiltinScheduledTasks()) {
    if (!existingIds.has(task.id)) {
      postScheduledTask(task);
    }
  }
  return queryScheduledTasks();
}
function postInitScheduledTasks() {
  if (queryScheduledTasks().length > 0) {
    return queryScheduledTasks();
  }
  return postImportBuiltinScheduledTasks();
}
const KNOWN_FRONTMATTER_KEYS = /* @__PURE__ */ new Set([
  "name",
  "description",
  "alwaysApply",
  "createdAt",
  "updatedAt"
]);
function splitRuleMarkdown(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/);
  if (!match) {
    return { frontmatterLines: [], body: raw.trim() };
  }
  return {
    frontmatterLines: match[1].split(/\r?\n/),
    body: match[2].trim()
  };
}
function queryFrontmatterValue(lines, key) {
  const prefix = `${key}:`;
  const line = lines.find((item) => item.startsWith(prefix));
  return line?.slice(prefix.length).trim();
}
function parseString(value) {
  if (!value) return "";
  if (value.startsWith('"') && value.endsWith('"') || value.startsWith("'") && value.endsWith("'")) {
    try {
      return value.startsWith('"') ? JSON.parse(value) : value.slice(1, -1);
    } catch {
      return value.slice(1, -1);
    }
  }
  return value;
}
function parseTimestamp(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
function parseRuleMarkdown(id, raw, fileUpdatedAt) {
  const { frontmatterLines, body } = splitRuleMarkdown(raw);
  const name = parseString(queryFrontmatterValue(frontmatterLines, "name")).trim();
  const description = parseString(
    queryFrontmatterValue(frontmatterLines, "description")
  ).trim();
  return {
    id,
    name: name || id,
    description,
    content: body,
    enabled: queryFrontmatterValue(frontmatterLines, "alwaysApply") === "true",
    createdAt: parseTimestamp(
      queryFrontmatterValue(frontmatterLines, "createdAt"),
      fileUpdatedAt
    ),
    updatedAt: parseTimestamp(
      queryFrontmatterValue(frontmatterLines, "updatedAt"),
      fileUpdatedAt
    )
  };
}
function buildRuleMarkdown(rule, previousRaw = "") {
  const previous = splitRuleMarkdown(previousRaw);
  const unknownLines = previous.frontmatterLines.filter((line) => {
    const keyMatch = line.match(/^([A-Za-z][\w-]*):/);
    return !keyMatch || !KNOWN_FRONTMATTER_KEYS.has(keyMatch[1]);
  });
  const knownLines = [
    `name: ${JSON.stringify(rule.name.trim())}`,
    `description: ${JSON.stringify(rule.description.trim())}`,
    `alwaysApply: ${rule.enabled}`,
    `createdAt: ${rule.createdAt}`,
    `updatedAt: ${rule.updatedAt}`
  ];
  const frontmatter = [...knownLines, ...unknownLines].join("\n");
  return `---
${frontmatter}
---

${rule.content.trim()}
`;
}
function queryBundledResourcesRoot() {
  return electron.app.isPackaged ? path.join(process.resourcesPath, "resources") : path.join(electron.app.getAppPath(), "resources");
}
function queryWritableResourcesRoot() {
  return electron.app.isPackaged ? path.join(getDataRoot(), "resources") : queryBundledResourcesRoot();
}
function querySkillsDir() {
  return path.join(queryWritableResourcesRoot(), "skills");
}
function queryRulesDir() {
  return path.join(queryWritableResourcesRoot(), "rules");
}
function copyMissingEntries(sourceDir, targetDir) {
  if (!fs.existsSync(sourceDir)) return;
  fs.mkdirSync(targetDir, { recursive: true });
  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);
    if (entry.isDirectory()) {
      copyMissingEntries(sourcePath, targetPath);
      continue;
    }
    if (entry.isFile() && !fs.existsSync(targetPath)) {
      fs.copyFileSync(sourcePath, targetPath);
    }
  }
}
function postMigrateLegacyRules() {
  const legacyPath = path.join(getDataRoot(), "rules.json");
  if (!fs.existsSync(legacyPath)) return;
  try {
    const parsed = JSON.parse(fs.readFileSync(legacyPath, "utf-8"));
    if (!Array.isArray(parsed)) throw new Error("rules.json 格式无效");
    const rulesDir = queryRulesDir();
    fs.mkdirSync(rulesDir, { recursive: true });
    for (const item of parsed) {
      if (!item || typeof item !== "object") continue;
      const raw = item;
      const id = typeof raw.id === "string" ? raw.id.trim() : "";
      if (!/^[a-z0-9_-]{1,64}$/.test(id)) continue;
      const targetPath = path.join(rulesDir, `${id}.mdc`);
      if (fs.existsSync(targetPath)) continue;
      const now = Date.now();
      const rule = {
        id,
        name: typeof raw.name === "string" && raw.name.trim() ? raw.name.trim() : id,
        description: typeof raw.description === "string" ? raw.description.trim() : "",
        content: typeof raw.content === "string" ? raw.content.trim() : "",
        enabled: Boolean(raw.enabled),
        createdAt: typeof raw.createdAt === "number" ? raw.createdAt : now,
        updatedAt: typeof raw.updatedAt === "number" ? raw.updatedAt : now
      };
      if (!rule.content) continue;
      fs.writeFileSync(targetPath, buildRuleMarkdown(rule), "utf-8");
    }
  } catch (error) {
    console.warn(`[resources] 旧规则迁移失败：${legacyPath}`, error);
  }
}
function initializeResources() {
  const writableRoot = queryWritableResourcesRoot();
  fs.mkdirSync(path.join(writableRoot, "skills"), { recursive: true });
  fs.mkdirSync(path.join(writableRoot, "rules"), { recursive: true });
  if (electron.app.isPackaged) {
    const bundledRoot = queryBundledResourcesRoot();
    copyMissingEntries(path.join(bundledRoot, "skills"), path.join(writableRoot, "skills"));
    copyMissingEntries(path.join(bundledRoot, "rules"), path.join(writableRoot, "rules"));
  }
  postMigrateLegacyRules();
}
function validateRuleId(id) {
  if (typeof id !== "string" || !/^[a-z0-9_-]{1,64}$/.test(id)) {
    throw new Error("规则 id 仅允许小写字母、数字、连字符和下划线，长度 1～64");
  }
}
function sortRules(rules) {
  return [...rules].sort((a, b) => b.updatedAt - a.updatedAt);
}
function readRulesFromDisk() {
  const dir = queryRulesDir();
  if (!fs.existsSync(dir)) return [];
  const rules = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith(".mdc")) continue;
    const path$1 = path.join(dir, entry.name);
    const id = entry.name.slice(0, -".mdc".length);
    try {
      validateRuleId(id);
      const stat = fs.statSync(path$1);
      rules.push(parseRuleMarkdown(id, fs.readFileSync(path$1, "utf-8"), stat.mtimeMs));
    } catch (error) {
      console.warn(`[rules] 跳过无法解析的规则文件：${path$1}`, error);
    }
  }
  return sortRules(rules);
}
function queryAgentRules() {
  return readRulesFromDisk();
}
function postAgentRule(input) {
  validateRuleId(input.id);
  if (!input.name.trim()) throw new Error("规则名称不能为空");
  if (!input.content.trim()) throw new Error("规则正文不能为空");
  const dir = queryRulesDir();
  fs.mkdirSync(dir, { recursive: true });
  const path$1 = path.join(dir, `${input.id}.mdc`);
  const now = Date.now();
  const previousRaw = fs.existsSync(path$1) ? fs.readFileSync(path$1, "utf-8") : "";
  const existing = previousRaw ? parseRuleMarkdown(input.id, previousRaw, fs.statSync(path$1).mtimeMs) : null;
  const next = {
    id: input.id,
    name: input.name.trim(),
    description: input.description.trim(),
    content: input.content.trim(),
    enabled: Boolean(input.enabled),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now
  };
  fs.writeFileSync(path$1, buildRuleMarkdown(next, previousRaw), "utf-8");
  return next;
}
function postDeleteAgentRule(id) {
  validateRuleId(id);
  const path$1 = path.join(queryRulesDir(), `${id}.mdc`);
  if (fs.existsSync(path$1)) fs.unlinkSync(path$1);
}
function queryEnabledRulePrompt(maxChars = 8e3) {
  const rules = queryAgentRules().filter((r) => r.enabled);
  if (!rules.length) return "";
  const parts = [];
  let total = 0;
  for (const rule of rules) {
    const chunk = `### 规则：${rule.name}
${rule.description ? `> ${rule.description}

` : ""}${rule.content}`;
    if (total + chunk.length > maxChars) {
      parts.push(chunk.slice(0, maxChars - total) + "\n\n...(规则内容已截断)");
      break;
    }
    parts.push(chunk);
    total += chunk.length;
  }
  return parts.join("\n\n---\n\n");
}
function queryPublishWorkflowId(planId) {
  return planId;
}
function buildEndToEndAgentNode(sub) {
  const channels = normalizePublishSubTaskChannels(sub.channels);
  const labels = queryPublishChannelLabels(channels);
  const autoPublish = sub.autoPublish !== false;
  const publishHint = autoPublish ? "调用发布工具时必须传 autoPublish=true，填好后自动点击发布（未登录时工具会暂停等人扫码）。" : "调用发布工具时必须传 autoPublish=false，只填好内容停在待发布，勿自动点击发布。";
  const channelBlocks = channels.map((id) => {
    const meta = queryPublishChannelMeta(id);
    const label = queryPublishChannelLabel(id);
    const titleHint = meta.titleMaxLength != null ? `标题建议不超过 ${meta.titleMaxLength} 字。` : "";
    return [
      `#### ${label}`,
      titleHint,
      meta.agentHint,
      meta.publishTool ? `必须使用工具 ${meta.publishTool} 完成该渠道发布。` : ""
    ].filter(Boolean).join("\n");
  });
  const notifyIds = normalizeNotifyChannelIds(sub.notifyChannels);
  const notifyLabels = notifyIds.map((id) => queryPublishChannelLabel(id)).join("、");
  const toolWhitelist = Array.from(
    /* @__PURE__ */ new Set([
      "fetch_hot_topics",
      "fetch_web_images",
      "list_attachments",
      "update_task_list",
      ...channels.map((id) => queryPublishChannelMeta(id).publishTool).filter((t) => Boolean(t)),
      ...notifyIds.length > 0 ? ["notify_message"] : []
    ])
  );
  const notifyHint = notifyIds.length > 0 ? [
    `发布完成后，依次调用 notify_message，channelId 分别为：${notifyIds.join("、")}（${notifyLabels}），`,
    "content 简要说明本子任务各渠道发布结果。每个渠道只通知一次；成功后禁止重复发送。通知失败可忽略，不要因此判定任务失败。"
  ].join("") : "";
  return {
    id: `${sub.id}_run`,
    type: "agent",
    title: sub.title,
    prompt: [
      channels.length > 1 ? `请在同一步内完成选题、创作、配图，并依次发布到：${labels}（前一个渠道完成后再发下一个）。` : `请在同一步内完成选题、创作、配图并发布到${labels || "目标渠道"}。`,
      `任务标题：${sub.title}`,
      sub.topic ? `主题标签：${sub.topic}` : "",
      `内容要求：${sub.contentPrompt || "按主题自由发挥"}`,
      "若需热点选题，先调用 fetch_hot_topics（综合首选 tophub；抖音渠道用 douyin、小红书用 weibo/baidu/douyin；亦可 kuaishou/tencent）；自行择优选题后直接撰写标题与正文，禁止调用 present_plan_choices 等待用户确认。",
      "配图：必须调用 fetch_web_images（传入 pageUrl 或 imageUrls）拿到本地绝对路径后再发布；不要只给「建议来源」而不下载。",
      publishHint,
      ...channelBlocks,
      notifyHint,
      "不要拆成多轮「只创作不发布」；本步结束前应完成全部目标渠道的发布工具调用。"
    ].filter(Boolean).join("\n"),
    toolWhitelist
  };
}
function buildSubTaskNodes(sub) {
  return [buildEndToEndAgentNode(sub)];
}
function buildPlanNotifyNode(plan) {
  const ids = normalizeNotifyChannelIds(plan.notifyChannels);
  const labels = ids.map((id) => queryPublishChannelLabel(id)).join("、");
  return {
    id: `${plan.id}_notify_summary`,
    type: "agent",
    title: "计划结果通知",
    prompt: [
      `请汇总整个发布计划「${plan.title}」的执行结果（成功/失败要点），`,
      `调用 notify_message 通知到：${labels}（channelId: ${ids.join(", ")}）。`,
      "每个渠道只调用一次；成功后禁止再次发送。仅失败时可对该渠道重试 1 次。"
    ].join("\n"),
    toolWhitelist: ["notify_message"]
  };
}
function compilePublishPlanToWorkflow(plan) {
  const now = Date.now();
  const nodes = plan.subTasks.flatMap((sub) => buildSubTaskNodes(sub));
  const planNotifyIds = normalizeNotifyChannelIds(plan.notifyChannels);
  if (planNotifyIds.length > 0) {
    nodes.push(buildPlanNotifyNode(plan));
  }
  return {
    id: queryPublishWorkflowId(plan.id),
    title: plan.title,
    description: plan.description || `由发布计划自动同步（${plan.subTasks.length} 个子任务）`,
    templateKind: "publish",
    nodes,
    createdAt: plan.createdAt || now,
    updatedAt: plan.updatedAt || now
  };
}
function queryNotifyTargets(node) {
  const raw = node.targets?.filter((t) => t === "channel" || t === "toast") ?? [];
  if (raw.length) return Array.from(new Set(raw));
  return ["channel"];
}
function queryNotifyHasChannel(node) {
  return queryNotifyTargets(node).includes("channel");
}
function queryNotifyHasToast(node) {
  return queryNotifyTargets(node).includes("toast");
}
function queryWorkflowHasNotifyNode(nodes) {
  for (const node of nodes) {
    if (node.type === "notify" && queryNotifyHasChannel(node)) return true;
    if (node.type === "parallel") {
      if (node.children.some(
        (child) => child.type === "notify" && queryNotifyHasChannel(child)
      )) {
        return true;
      }
    }
    if (node.type === "condition") {
      for (const arm of node.cases) {
        if (arm.nodes.some(
          (child) => child.type === "notify" && queryNotifyHasChannel(child)
        )) {
          return true;
        }
      }
    }
  }
  return false;
}
const BUILTIN_WORKFLOW_TEMPLATES = [
  {
    id: "tpl_generic_research_confirm",
    title: "调研 → 确认 → 总结",
    description: "通用流程模板：Agent 调研、人工确认、再输出结论。",
    templateKind: "generic",
    nodes: [
      {
        id: "tpl_r1",
        type: "agent",
        title: "调研主题",
        prompt: "根据用户最近一条需求调研背景资料，整理 3～5 个要点。可用 fetch_web_images 以外的只读工具；不要发布内容。",
        toolWhitelist: ["list_attachments", "update_task_list"]
      },
      {
        id: "tpl_r2",
        type: "await_user",
        title: "确认调研结果",
        reason: "请确认调研要点是否可用，确认后继续生成总结。"
      },
      {
        id: "tpl_r3",
        type: "agent",
        title: "输出总结",
        prompt: "基于已确认的调研要点，用简洁中文输出最终总结（标题 + 三条行动建议）。",
        toolWhitelist: ["update_task_list"]
      }
    ],
    createdAt: 0,
    updatedAt: 0
  },
  {
    id: "tpl_publish_xhs_basic",
    title: "小红书图文发布（模板）",
    description: "创作 →（可选确认）→ 发布到小红书；可按此模板改主题后再运行。",
    templateKind: "publish",
    nodes: [
      {
        id: "tpl_xhs_1",
        type: "agent",
        title: "创作笔记",
        prompt: "围绕「职场效率」创作一篇小红书图文：标题≤20字，正文口语化并带话题；优先 fetch_web_images 配图。先不要发布。",
        toolWhitelist: ["fetch_web_images", "list_attachments", "update_task_list"]
      },
      {
        id: "tpl_xhs_2",
        type: "await_user",
        title: "确认后发布",
        reason: "内容与配图已准备好，请确认后发布到小红书。"
      },
      {
        id: "tpl_xhs_3",
        type: "agent",
        title: "发布到小红书",
        prompt: "使用 xhs_publish_note 填写上一步内容；传 autoPublish=true 自动点击发布；遵守小红书风控与去同质化要求。未登录时工具会暂停等人扫码。",
        toolWhitelist: ["xhs_publish_note", "fetch_web_images", "list_attachments", "update_task_list"]
      }
    ],
    createdAt: 0,
    updatedAt: 0
  },
  {
    id: "tpl_tool_parallel_demo",
    title: "并行工具示例",
    description: "演示 parallel 组内纯 tool 节点 Promise.all 并发（读附件列表）。",
    templateKind: "generic",
    nodes: [
      {
        id: "tpl_p0",
        type: "agent",
        title: "说明并行",
        prompt: "用一句话告诉用户接下来将并行检查附件列表，然后结束本步。",
        toolWhitelist: ["update_task_list"]
      },
      {
        id: "tpl_p1",
        type: "parallel",
        title: "并行检查附件",
        children: [
          {
            id: "tpl_p1a",
            type: "tool",
            title: "附件检查 A",
            toolName: "list_attachments",
            argsTemplate: {},
            outputKeys: ["attachmentsA"]
          },
          {
            id: "tpl_p1b",
            type: "tool",
            title: "附件检查 B",
            toolName: "list_attachments",
            argsTemplate: {},
            outputKeys: ["attachmentsB"]
          }
        ]
      }
    ],
    createdAt: 0,
    updatedAt: 0
  },
  {
    id: "tpl_hot_topics_weibo_baidu",
    title: "今日热点：微博优先，多来源回退",
    description: "先用 fetch_hot_topics 拉微博热搜；失败（hotTopicsOk≠1）则回退百度；整理摘要并确认。综合调研也可直接用 tophub；其他来源（douyin/kuaishou/tencent）可在画布中复制工具节点并改 source。",
    templateKind: "generic",
    nodes: [
      { id: "tpl_ht_start", type: "start", title: "开始" },
      {
        id: "tpl_ht_weibo",
        type: "tool",
        title: "获取微博今日热点",
        toolName: "fetch_hot_topics",
        argsTemplate: { source: "weibo", maxCount: 20 },
        outputKeys: ["weiboHotRaw"]
      },
      {
        id: "tpl_ht_cond",
        type: "condition",
        title: "微博是否成功",
        mode: "expression",
        cases: [
          {
            key: "weibo_ok",
            label: "微博成功",
            when: { contextKey: "hotTopicsOk", op: "eq", value: "1" },
            nodes: [
              {
                id: "tpl_ht_sum_weibo",
                type: "agent",
                title: "整理微博热点摘要",
                prompt: "以下是微博今日热点原始列表，请整理成简洁中文摘要：列出 Top 10（标题即可），并加一句总体观察。注明来源为微博。不要调用浏览器或发布工具。\n\n{{hotTopics}}",
                toolWhitelist: ["update_task_list"]
              }
            ]
          },
          {
            key: "weibo_fail",
            label: "回退百度",
            nodes: [
              {
                id: "tpl_ht_baidu",
                type: "tool",
                title: "获取百度今日热点",
                toolName: "fetch_hot_topics",
                argsTemplate: { source: "baidu", maxCount: 20 },
                outputKeys: ["baiduHotRaw"]
              },
              {
                id: "tpl_ht_sum_baidu",
                type: "agent",
                title: "整理百度热点摘要",
                prompt: "微博热搜获取失败，已改用百度。请根据下列百度今日热点整理 Top 10 摘要，并注明来源为百度。不要调用浏览器或发布工具。\n\n{{hotTopics}}",
                toolWhitelist: ["update_task_list"]
              }
            ]
          }
        ],
        defaultKey: "weibo_fail"
      },
      {
        id: "tpl_ht_await",
        type: "await_user",
        title: "确认热点摘要",
        reason: "今日热点摘要已生成，请确认后结束流程。"
      },
      { id: "tpl_ht_end", type: "end", title: "结束" }
    ],
    canvas: {
      positions: {
        tpl_ht_start: { x: 140, y: 20 },
        tpl_ht_weibo: { x: 140, y: 90 },
        tpl_ht_sum_weibo: { x: 40, y: 180 },
        tpl_ht_baidu: { x: 240, y: 180 },
        tpl_ht_sum_baidu: { x: 240, y: 250 },
        tpl_ht_await: { x: 140, y: 330 },
        tpl_ht_end: { x: 140, y: 400 }
      },
      edges: [
        { id: "e_ht_s_w", source: "tpl_ht_start", target: "tpl_ht_weibo" },
        {
          id: "e_ht_w_ok",
          source: "tpl_ht_weibo",
          target: "tpl_ht_sum_weibo",
          label: "微博成功",
          when: { contextKey: "hotTopicsOk", op: "eq", value: "1" }
        },
        {
          id: "e_ht_w_fail",
          source: "tpl_ht_weibo",
          target: "tpl_ht_baidu",
          label: "回退百度",
          isDefault: true
        },
        {
          id: "e_ht_b_sum",
          source: "tpl_ht_baidu",
          target: "tpl_ht_sum_baidu"
        },
        {
          id: "e_ht_ok_a",
          source: "tpl_ht_sum_weibo",
          target: "tpl_ht_await"
        },
        {
          id: "e_ht_fail_a",
          source: "tpl_ht_sum_baidu",
          target: "tpl_ht_await"
        },
        { id: "e_ht_a_end", source: "tpl_ht_await", target: "tpl_ht_end" }
      ]
    },
    createdAt: 0,
    updatedAt: 0
  },
  {
    id: "tpl_start_end_edge_branch",
    title: "开始/结束与连线条件示例",
    description: "演示强制「开始→结束」与连线 XOR：默认走「表达式 true」支路；另一条为 else。可在画布双击虚线边改条件后重跑。",
    templateKind: "generic",
    nodes: [
      { id: "tpl_se_start", type: "start", title: "开始" },
      {
        id: "tpl_se_intro",
        type: "agent",
        title: "说明本示例",
        prompt: "用两三句话说明：本流程演示开始/结束节点，以及带条件的连线分支；默认会走「命中」支路。不要调用发布类工具。",
        toolWhitelist: ["update_task_list"]
      },
      {
        id: "tpl_se_cond",
        type: "condition",
        title: "连线条件分叉",
        mode: "expression",
        cases: [
          {
            key: "hit",
            label: "命中",
            when: { expression: "true" },
            nodes: [
              {
                id: "tpl_se_hit",
                type: "agent",
                title: "命中支路",
                prompt: "告诉用户：条件边（expression: true）已命中，本步是 XOR 中被执行的一支；另一支应为「已跳过」。不要调用发布类工具。",
                toolWhitelist: ["update_task_list"]
              }
            ]
          },
          {
            key: "else",
            label: "默认",
            nodes: [
              {
                id: "tpl_se_else",
                type: "agent",
                title: "默认支路",
                prompt: "告诉用户：当前走到了默认（else）支路。不要调用发布类工具。",
                toolWhitelist: ["update_task_list"]
              }
            ]
          }
        ],
        defaultKey: "else"
      },
      {
        id: "tpl_se_await",
        type: "await_user",
        title: "确认后结束",
        reason: "查看任务清单：未选中支路应为「已跳过」。确认后进入结束节点。"
      },
      { id: "tpl_se_end", type: "end", title: "结束" }
    ],
    canvas: {
      positions: {
        tpl_se_start: { x: 120, y: 24 },
        tpl_se_intro: { x: 120, y: 90 },
        tpl_se_hit: { x: 40, y: 170 },
        tpl_se_else: { x: 200, y: 170 },
        tpl_se_await: { x: 120, y: 250 },
        tpl_se_end: { x: 120, y: 320 }
      },
      edges: [
        { id: "e_se_s_i", source: "tpl_se_start", target: "tpl_se_intro" },
        {
          id: "e_se_i_hit",
          source: "tpl_se_intro",
          target: "tpl_se_hit",
          label: "命中",
          when: { expression: "true" }
        },
        {
          id: "e_se_i_else",
          source: "tpl_se_intro",
          target: "tpl_se_else",
          label: "默认",
          isDefault: true
        },
        { id: "e_se_hit_a", source: "tpl_se_hit", target: "tpl_se_await" },
        { id: "e_se_else_a", source: "tpl_se_else", target: "tpl_se_await" },
        { id: "e_se_a_end", source: "tpl_se_await", target: "tpl_se_end" }
      ]
    },
    createdAt: 0,
    updatedAt: 0
  },
  {
    id: "tpl_feishu_richtext_push",
    title: "飞书富文本推送（模板）",
    description: "微博热搜优先、失败回退百度；可扩展为抖音/腾讯等 source。整理 Markdown 简报后由系统转为 msg_type=post 推送飞书，无需人工确认。",
    templateKind: "generic",
    nodes: [
      { id: "tpl_fr_start", type: "start", title: "开始" },
      {
        id: "tpl_fr_weibo",
        type: "tool",
        title: "获取微博热搜",
        toolName: "fetch_hot_topics",
        argsTemplate: { source: "weibo", maxCount: 20 },
        outputKeys: ["weiboHotRaw"]
      },
      {
        id: "tpl_fr_cond",
        type: "condition",
        title: "微博是否成功",
        mode: "expression",
        cases: [
          {
            key: "weibo_ok",
            label: "微博成功",
            when: { contextKey: "hotTopicsOk", op: "eq", value: "1" },
            nodes: [
              {
                id: "tpl_fr_fmt_weibo",
                type: "agent",
                title: "整理富文本简报（微博）",
                prompt: [
                  "将下列热点整理为飞书 post 富文本用的 Markdown 简报。",
                  "要求：",
                  "1. 文首二级标题「热点富文本简报」",
                  "2. 列出 Top 8 条科技/互联网相关热点（不足则列综合热点）",
                  "3. 每条：标题 + 一句话说明 + [查看](链接)（无链接可写热搜词条）",
                  "4. 文内注明来源平台（微博）",
                  "5. 只输出 Markdown；（流程结束后系统自动 post 推送飞书）",
                  "",
                  "{{hotTopics}}"
                ].join("\n"),
                toolWhitelist: ["update_task_list"],
                outputKeys: ["summary"]
              }
            ]
          },
          {
            key: "weibo_fail",
            label: "回退百度",
            nodes: [
              {
                id: "tpl_fr_baidu",
                type: "tool",
                title: "获取百度热搜",
                toolName: "fetch_hot_topics",
                argsTemplate: { source: "baidu", maxCount: 20 },
                outputKeys: ["baiduHotRaw"]
              },
              {
                id: "tpl_fr_fmt_baidu",
                type: "agent",
                title: "整理富文本简报（百度）",
                prompt: [
                  "微博获取失败，已改用百度热搜。请整理为飞书 post 富文本用的 Markdown 简报。",
                  "要求：",
                  "1. 文首二级标题「热点富文本简报」",
                  "2. 列出 Top 8 条科技/互联网相关热点（不足则列综合热点）",
                  "3. 每条：标题 + 一句话说明 + [查看](链接)（无链接可写热搜词条）",
                  "4. 文内注明来源平台（百度）",
                  "5. 只输出 Markdown；禁止调用 notify_message（流程结束后系统自动 post 推送飞书）",
                  "",
                  "{{hotTopics}}"
                ].join("\n"),
                toolWhitelist: ["update_task_list"],
                outputKeys: ["summary"]
              }
            ]
          }
        ],
        defaultKey: "weibo_fail"
      },
      {
        id: "tpl_fr_notify",
        type: "notify",
        title: "通知",
        channelId: "feishu",
        contentTemplate: "{{summary}}",
        msgType: "post",
        failSoft: true
      },
      { id: "tpl_fr_end", type: "end", title: "结束" }
    ],
    canvas: {
      positions: {
        tpl_fr_start: { x: 140, y: 20 },
        tpl_fr_weibo: { x: 140, y: 90 },
        tpl_fr_fmt_weibo: { x: 40, y: 180 },
        tpl_fr_baidu: { x: 240, y: 180 },
        tpl_fr_fmt_baidu: { x: 240, y: 250 },
        tpl_fr_notify: { x: 140, y: 300 },
        tpl_fr_end: { x: 140, y: 370 }
      },
      edges: [
        { id: "e_fr_s_w", source: "tpl_fr_start", target: "tpl_fr_weibo" },
        {
          id: "e_fr_w_ok",
          source: "tpl_fr_weibo",
          target: "tpl_fr_fmt_weibo",
          label: "微博成功",
          when: { contextKey: "hotTopicsOk", op: "eq", value: "1" }
        },
        {
          id: "e_fr_w_fail",
          source: "tpl_fr_weibo",
          target: "tpl_fr_baidu",
          label: "回退百度",
          isDefault: true
        },
        { id: "e_fr_b_fmt", source: "tpl_fr_baidu", target: "tpl_fr_fmt_baidu" },
        { id: "e_fr_ok_notify", source: "tpl_fr_fmt_weibo", target: "tpl_fr_notify" },
        { id: "e_fr_fail_notify", source: "tpl_fr_fmt_baidu", target: "tpl_fr_notify" },
        { id: "e_fr_notify_end", source: "tpl_fr_notify", target: "tpl_fr_end" }
      ]
    },
    createdAt: 0,
    updatedAt: 0
  },
  {
    id: "tpl_one_shot_video",
    title: "一句话成片",
    description: "编剧写剧本与分镜 → 视频角色生成素材 → 剪辑师合成成片。",
    templateKind: "generic",
    nodes: [
      {
        id: "tpl_v_script",
        type: "agent",
        title: "编剧：剧本与分镜",
        prompt: "根据用户输入创作短视频剧本并调用 generate_script；再拆成 4～8 镜，默认竖版 9:16，调用 generate_storyboard。每镜含 visual、narration、durationSec、cameraMotion、style、negativePrompt、aspectRatio、lighting。",
        toolWhitelist: [
          "list_attachments",
          "read_file",
          "generate_script",
          "generate_storyboard",
          "update_task_list"
        ],
        outputKeys: ["scriptPath", "storyboardPath"]
      },
      {
        id: "tpl_v_assets",
        type: "agent",
        title: "视频：场景素材",
        prompt: "读取上游分镜，调用 generate_scene_assets。流程：万相文生图关键帧 → 图生视频（失败则文生视频兜底）→ Qwen-TTS 旁白。素材 mp4/wav 路径会在聊天内可预览；如实汇报每镜成败。",
        toolWhitelist: ["generate_scene_assets", "read_file", "update_task_list"],
        outputKeys: ["sceneAssetPaths", "sceneAssetsManifest"]
      },
      {
        id: "tpl_v_compose",
        type: "agent",
        title: "剪辑：合成成片",
        prompt: "调用 compose_video 合成成片，向用户汇报 videoPath。提醒用户可在聊天内直接播放成片；核查音画同步与叙事连贯。",
        toolWhitelist: ["compose_video", "update_task_list"],
        outputKeys: ["videoPath"]
      },
      {
        id: "tpl_v_notify",
        type: "notify",
        title: "成片完成提示",
        targets: ["toast"],
        toastLevel: "success",
        contentTemplate: "成片流程结束：{{videoPath}}"
      }
    ],
    createdAt: 0,
    updatedAt: 0
  },
  {
    id: "tpl_daily_weather_notify",
    title: "每日天气 → 多渠道通知",
    description: "查询天气后推送到飞书等通知渠道。",
    templateKind: "generic",
    nodes: [
      {
        id: "tpl_w_agent",
        type: "agent",
        title: "查询天气",
        prompt: "调用 query_weather 获取今日天气，将简报写入回复。",
        toolWhitelist: ["query_weather", "update_task_list"],
        outputKeys: ["weatherText", "weatherSummary"]
      },
      {
        id: "tpl_w_notify",
        type: "notify",
        title: "飞书通知",
        targets: ["channel"],
        channelId: "feishu",
        titleTemplate: "今日天气",
        contentTemplate: "{{weatherText}}",
        msgType: "post",
        failSoft: true
      }
    ],
    createdAt: 0,
    updatedAt: 0
  },
  {
    id: "tpl_ashare_kline_preview",
    title: "A 股 K 线预览",
    description: "在工具节点配置股票代码（英文逗号分隔），拉取 K 线并在聊天中交互预览；可改 symbols / period / count。",
    templateKind: "generic",
    nodes: [
      { id: "tpl_k_start", type: "start", title: "开始" },
      {
        id: "tpl_k_fetch",
        type: "tool",
        title: "获取 A 股 K 线",
        toolName: "query_ashare_kline",
        argsTemplate: {
          symbols: "{{symbols}}",
          period: "daily",
          count: 120
        },
        collectPrompt: '根据上游 context 与用户输入（如 userInput），解析股票代码并写入 symbols（6 位 A 股代码，多个英文逗号分隔）。输入若是股票名称请先转换为代码。最终只输出一行 JSON，例如 {"symbols":"600900"}，不要 Markdown，禁止 present_plan_choices。',
        outputKeys: ["stockKlineSummary"]
      },
      {
        id: "tpl_k_agent",
        type: "agent",
        title: "解读行情",
        prompt: "根据上一步 K 线摘要，用 3～5 句话简要解读各股近期走势与关键价位，不要重复粘贴原始数据表。\n\n{{stockKlineSummary}}",
        toolWhitelist: ["update_task_list"],
        inputKeys: ["stockKlineSummary"]
      },
      {
        id: "tpl_k_await",
        type: "await_user",
        title: "确认解读",
        reason: "K 线图与解读已生成，请确认后结束流程。"
      },
      { id: "tpl_k_end", type: "end", title: "结束" }
    ],
    canvas: {
      positions: {
        tpl_k_start: { x: 140, y: 20 },
        tpl_k_fetch: { x: 140, y: 90 },
        tpl_k_agent: { x: 140, y: 180 },
        tpl_k_await: { x: 140, y: 270 },
        tpl_k_end: { x: 140, y: 350 }
      },
      edges: [
        { id: "e_k_s_f", source: "tpl_k_start", target: "tpl_k_fetch" },
        { id: "e_k_f_a", source: "tpl_k_fetch", target: "tpl_k_agent" },
        { id: "e_k_a_w", source: "tpl_k_agent", target: "tpl_k_await" },
        { id: "e_k_w_e", source: "tpl_k_await", target: "tpl_k_end" }
      ]
    },
    createdAt: 0,
    updatedAt: 0
  },
  {
    id: "tpl_ashare_realtime_analysis",
    title: "A 股实时 K 线 · 综合分析 · 买卖分支",
    description: "工具节点配置股票代码（英文逗号分隔）与 range（today/week/month/custom）；每只股票独立分析，按 stockHasBuy/Sell/Hold 可同时走买入、卖出、观望多条分支；各支路仅注入对应分组报告。",
    templateKind: "generic",
    nodes: [
      { id: "tpl_ra_start", type: "start", title: "开始" },
      {
        id: "tpl_ra_fetch",
        type: "tool",
        title: "实时 K 线 + 综合分析",
        toolName: "query_ashare_realtime_analysis",
        argsTemplate: {
          symbols: "{{symbols}}",
          range: "today",
          preloadRanges: true
        },
        collectPrompt: '根据上游 context 与用户输入（如 userInput），解析股票代码并写入 symbols（6 位 A 股代码，多个英文逗号分隔）。输入若是股票名称请先转换为代码。最终只输出一行 JSON，例如 {"symbols":"600900"}，不要 Markdown，禁止 present_plan_choices。',
        outputKeys: [
          "stockAnalysisReport",
          "stockKlineSummary",
          "stockHasBuy",
          "stockHasSell",
          "stockHasHold",
          "stockBuyReport",
          "stockSellReport",
          "stockHoldReport"
        ]
      },
      {
        id: "tpl_ra_cond",
        type: "condition",
        title: "买卖信号分支",
        mode: "expression",
        matchMode: "all",
        cases: [
          {
            key: "buy_branch",
            label: "买入信号",
            when: { contextKey: "stockHasBuy", op: "eq", value: "1" },
            nodes: [
              {
                id: "tpl_ra_buy",
                type: "agent",
                title: "买入策略建议",
                prompt: "以下股票综合信号为买入。请基于报告给出建仓思路：入场区间、仓位建议、止损位与持有周期。语气专业简洁，并强调风险。\n\n{{stockBuyReport}}",
                toolWhitelist: ["update_task_list"],
                inputKeys: ["stockBuyReport"]
              }
            ]
          },
          {
            key: "sell_branch",
            label: "卖出信号",
            when: { contextKey: "stockHasSell", op: "eq", value: "1" },
            nodes: [
              {
                id: "tpl_ra_sell",
                type: "agent",
                title: "卖出/减仓建议",
                prompt: "以下股票综合信号为卖出。请基于报告给出减仓或止盈策略：关键阻力位、分批卖出方案与后续观察点。\n\n{{stockSellReport}}",
                toolWhitelist: ["update_task_list"],
                inputKeys: ["stockSellReport"]
              }
            ]
          },
          {
            key: "hold_branch",
            label: "观望",
            when: { contextKey: "stockHasHold", op: "eq", value: "1" },
            nodes: [
              {
                id: "tpl_ra_hold",
                type: "agent",
                title: "观望解读",
                prompt: "以下股票综合信号为观望。请解读报告，说明为何暂不操作，以及后续需关注的突破/跌破价位。\n\n{{stockHoldReport}}",
                toolWhitelist: ["update_task_list"],
                inputKeys: ["stockHoldReport"]
              }
            ]
          }
        ]
        // 无 default：三路均有 when；失败时工具会置 stockHasHold=1
      },
      {
        id: "tpl_ra_await",
        type: "await_user",
        title: "确认分析结论",
        reason: "K 线图、综合分析与买卖建议已生成，请在聊天中切换周期查看后确认。"
      },
      { id: "tpl_ra_end", type: "end", title: "结束" }
    ],
    canvas: {
      positions: {
        tpl_ra_start: { x: 280, y: 24 },
        tpl_ra_fetch: { x: 260, y: 120 },
        tpl_ra_buy: { x: 40, y: 280 },
        tpl_ra_sell: { x: 260, y: 280 },
        tpl_ra_hold: { x: 480, y: 280 },
        tpl_ra_await: { x: 260, y: 420 },
        tpl_ra_end: { x: 280, y: 540 }
      },
      edges: [
        { id: "e_ra_s_f", source: "tpl_ra_start", target: "tpl_ra_fetch" },
        {
          id: "e_ra_f_buy",
          source: "tpl_ra_fetch",
          target: "tpl_ra_buy",
          label: "买入",
          when: { contextKey: "stockHasBuy", op: "eq", value: "1" },
          matchMode: "all"
        },
        {
          id: "e_ra_f_sell",
          source: "tpl_ra_fetch",
          target: "tpl_ra_sell",
          label: "卖出",
          when: { contextKey: "stockHasSell", op: "eq", value: "1" },
          matchMode: "all"
        },
        {
          id: "e_ra_f_hold",
          source: "tpl_ra_fetch",
          target: "tpl_ra_hold",
          label: "观望",
          when: { contextKey: "stockHasHold", op: "eq", value: "1" },
          matchMode: "all"
        },
        { id: "e_ra_buy_w", source: "tpl_ra_buy", target: "tpl_ra_await" },
        { id: "e_ra_sell_w", source: "tpl_ra_sell", target: "tpl_ra_await" },
        { id: "e_ra_hold_w", source: "tpl_ra_hold", target: "tpl_ra_await" },
        { id: "e_ra_w_e", source: "tpl_ra_await", target: "tpl_ra_end" }
      ]
    },
    createdAt: 0,
    updatedAt: 0
  }
];
const ASHRE_REALTIME_TEMPLATE_ID = "tpl_ashare_realtime_analysis";
function queryToolHasHardcodedAshareSymbols(node) {
  if (node.type !== "tool") return false;
  if (!String(node.toolName || "").includes("ashare")) return false;
  const symbols = node.argsTemplate?.symbols;
  if (typeof symbols !== "string") return false;
  if (symbols.includes("{{")) return false;
  return /600519|000001/.test(symbols);
}
function queryIsLegacyAshareRealtimeTemplate(w) {
  if (w.id !== ASHRE_REALTIME_TEMPLATE_ID) return false;
  const edgeLegacy = w.canvas?.edges?.some(
    (e) => e.when?.contextKey === "stockSignal"
  );
  if (edgeLegacy) return true;
  if (w.nodes.some(
    (n) => n.type === "condition" && n.cases.some((c) => c.when?.contextKey === "stockSignal")
  )) {
    return true;
  }
  return w.nodes.some((n) => queryToolHasHardcodedAshareSymbols(n));
}
function mergeBuiltinWorkflowTemplates(existing) {
  const byId = new Map(existing.map((w) => [w.id, w]));
  const now = Date.now();
  let added = 0;
  let refreshed = 0;
  const list = [...existing];
  for (const tpl of BUILTIN_WORKFLOW_TEMPLATES) {
    const prev = byId.get(tpl.id);
    if (!prev) {
      list.push({
        ...tpl,
        createdAt: now,
        updatedAt: now
      });
      added += 1;
      continue;
    }
    if (tpl.id === ASHRE_REALTIME_TEMPLATE_ID && queryIsLegacyAshareRealtimeTemplate(prev)) {
      const idx = list.findIndex((w) => w.id === tpl.id);
      if (idx >= 0) {
        list[idx] = {
          ...tpl,
          createdAt: prev.createdAt,
          updatedAt: now
        };
        refreshed += 1;
      }
    }
  }
  return { list, added, refreshed };
}
function getWorkflowsPath() {
  return path.join(getDataRoot(), "workflows.json");
}
function sortWorkflows(list) {
  return [...list].sort((a, b) => b.updatedAt - a.updatedAt);
}
function normalizeKeyList(raw) {
  if (!Array.isArray(raw)) return void 0;
  const keys = raw.map(String).map((s) => s.trim()).filter(Boolean);
  return keys.length ? keys : void 0;
}
function isLeafType(type) {
  return type === "agent" || type === "tool" || type === "await_user" || type === "notify" || type === "toast" || type === "input" || type === "output";
}
function normalizeLeaf(raw) {
  const base2 = {
    id: String(raw.id || "").trim() || crypto.randomUUID(),
    title: String(raw.title || "").trim() || "未命名步骤"
  };
  const collectPrompt = "collectPrompt" in raw && raw.collectPrompt != null ? String(raw.collectPrompt).trim() || void 0 : void 0;
  if (raw.type === "agent") {
    return {
      ...base2,
      type: "agent",
      prompt: String(raw.prompt || "").trim(),
      toolWhitelist: Array.isArray(raw.toolWhitelist) ? raw.toolWhitelist.map(String).filter(Boolean) : void 0,
      inputKeys: normalizeKeyList(raw.inputKeys),
      outputKeys: normalizeKeyList(raw.outputKeys),
      collectPrompt
    };
  }
  if (raw.type === "tool") {
    return {
      ...base2,
      type: "tool",
      toolName: String(raw.toolName || "").trim(),
      argsTemplate: raw.argsTemplate && typeof raw.argsTemplate === "object" && !Array.isArray(raw.argsTemplate) ? raw.argsTemplate : {},
      inputKeys: normalizeKeyList(raw.inputKeys),
      outputKeys: normalizeKeyList(raw.outputKeys),
      collectPrompt
    };
  }
  if (raw.type === "notify") {
    const notify = raw;
    const targets = queryNotifyTargets(notify);
    const wantsChannel = targets.includes("channel");
    const channelId = wantsChannel ? String(notify.channelId || "").trim() || "feishu" : notify.channelId?.trim() || void 0;
    const toastLevel = notify.toastLevel;
    const validToastLevel = toastLevel === "success" || toastLevel === "error" || toastLevel === "warning" || toastLevel === "info" ? toastLevel : "info";
    return {
      ...base2,
      type: "notify",
      targets,
      channelId,
      titleTemplate: notify.titleTemplate != null ? String(notify.titleTemplate) : void 0,
      contentTemplate: String(notify.contentTemplate || "").trim() || "{{summary}}",
      msgType: wantsChannel ? queryFeishuMsgType({
        msgType: notify.msgType,
        richText: notify.richText,
        channelId: channelId ?? "feishu"
      }) : void 0,
      imageKey: notify.imageKey?.trim() || void 0,
      shareChatId: notify.shareChatId?.trim() || void 0,
      failSoft: notify.failSoft !== false,
      toastLevel: targets.includes("toast") ? validToastLevel : void 0,
      inputKeys: normalizeKeyList(notify.inputKeys),
      outputKeys: normalizeKeyList(notify.outputKeys),
      collectPrompt
    };
  }
  if (raw.type === "toast") {
    const toast = raw;
    const level = toast.level;
    const validLevel = level === "success" || level === "error" || level === "warning" || level === "info" ? level : "info";
    return {
      ...base2,
      type: "notify",
      targets: ["toast"],
      contentTemplate: String(toast.contentTemplate || "").trim() || "{{summary}}",
      toastLevel: validLevel,
      inputKeys: normalizeKeyList(toast.inputKeys),
      outputKeys: normalizeKeyList(toast.outputKeys),
      collectPrompt
    };
  }
  if (raw.type === "input") {
    const inputNode = raw;
    const kinds = Array.isArray(inputNode.inputKinds) ? inputNode.inputKinds.filter(
      (k) => k === "text" || k === "attachment" || k === "image" || k === "video"
    ) : [];
    return {
      ...base2,
      type: "input",
      prompt: String(inputNode.prompt || "").trim() || "请输入内容后继续流程",
      inputKinds: kinds.length ? kinds : ["text"],
      inputKeys: normalizeKeyList(inputNode.inputKeys),
      outputKeys: normalizeKeyList(inputNode.outputKeys),
      collectPrompt
    };
  }
  if (raw.type === "output") {
    const outputNode = raw;
    const format = outputNode.outputFormat;
    const validFormat = format === "text" || format === "markdown" || format === "json" || format === "file" ? format : "markdown";
    return {
      ...base2,
      type: "output",
      outputDir: String(outputNode.outputDir || "").trim(),
      outputFormat: validFormat,
      fileNameTemplate: outputNode.fileNameTemplate != null ? String(outputNode.fileNameTemplate) : "output",
      contentTemplate: String(outputNode.contentTemplate || "").trim() || "{{summary}}",
      inputKeys: normalizeKeyList(outputNode.inputKeys),
      outputKeys: normalizeKeyList(outputNode.outputKeys),
      collectPrompt
    };
  }
  if (raw.type === "await_user") {
    const awaitNode = raw;
    return {
      ...base2,
      type: "await_user",
      reason: String(awaitNode.reason || "").trim() || "请确认后继续",
      inputKeys: normalizeKeyList(awaitNode.inputKeys),
      outputKeys: normalizeKeyList(awaitNode.outputKeys),
      choices: Array.isArray(awaitNode.choices) ? awaitNode.choices : void 0,
      collectPrompt
    };
  }
  return {
    ...base2,
    type: "await_user",
    reason: String(raw.reason || "").trim() || "请确认后继续",
    collectPrompt
  };
}
function normalizeWhen(raw) {
  if (!raw || typeof raw !== "object") return void 0;
  const w = raw;
  return {
    ...w.expression != null ? { expression: String(w.expression) } : {},
    ...w.contextKey != null ? { contextKey: String(w.contextKey) } : {},
    ...w.op != null ? { op: w.op } : {},
    ...w.value !== void 0 ? { value: w.value } : {}
  };
}
function normalizeCondition(raw) {
  const cases = Array.isArray(raw.cases) ? raw.cases.filter((c) => c && String(c.key || "").trim()).map((c) => ({
    key: String(c.key).trim(),
    label: c.label != null ? String(c.label) : void 0,
    when: normalizeWhen(c.when),
    nodes: Array.isArray(c.nodes) ? c.nodes.filter(
      (n) => n != null && isLeafType(String(n.type))
    ).map(normalizeLeaf) : []
  })) : [];
  return {
    id: String(raw.id || "").trim() || crypto.randomUUID(),
    type: "condition",
    title: String(raw.title || "").trim() || "条件分支",
    mode: raw.mode === "agent" ? "agent" : "expression",
    when: normalizeWhen(raw.when),
    prompt: raw.prompt != null ? String(raw.prompt) : void 0,
    toolWhitelist: Array.isArray(raw.toolWhitelist) ? raw.toolWhitelist.map(String) : void 0,
    cases: cases.length ? cases : [
      { key: "true", label: "是", nodes: [] },
      { key: "false", label: "否", nodes: [] }
    ],
    defaultKey: raw.defaultKey != null ? String(raw.defaultKey) : void 0,
    matchMode: raw.matchMode === "all" ? "all" : void 0
  };
}
function normalizeNode$1(raw) {
  if (raw.type === "start") {
    const node = {
      id: String(raw.id || "").trim() || crypto.randomUUID(),
      type: "start",
      title: String(raw.title || "").trim() || "开始"
    };
    return node;
  }
  if (raw.type === "end") {
    const node = {
      id: String(raw.id || "").trim() || crypto.randomUUID(),
      type: "end",
      title: String(raw.title || "").trim() || "结束"
    };
    return node;
  }
  if (raw.type === "condition") {
    return normalizeCondition(raw);
  }
  if (raw.type === "parallel") {
    const children = Array.isArray(raw.children) ? raw.children.filter(
      (c) => c != null && isLeafType(String(c.type))
    ).map(normalizeLeaf) : [];
    const node = {
      id: String(raw.id || "").trim() || crypto.randomUUID(),
      type: "parallel",
      title: String(raw.title || "").trim() || "并行组",
      children
    };
    return node;
  }
  return normalizeLeaf(raw);
}
function normalizeCanvas$1(raw) {
  if (!raw || typeof raw !== "object") return void 0;
  const positions = {};
  if (raw.positions && typeof raw.positions === "object") {
    for (const [id, pos] of Object.entries(raw.positions)) {
      if (pos && typeof pos.x === "number" && typeof pos.y === "number") {
        positions[id] = { x: pos.x, y: pos.y };
      }
    }
  }
  const edges = Array.isArray(raw.edges) ? raw.edges.filter((e) => e && e.source && e.target).map((e) => {
    const edge = {
      id: String(e.id || `e_${e.source}_${e.target}`),
      source: String(e.source),
      target: String(e.target)
    };
    if (e.label != null && String(e.label).trim()) {
      edge.label = String(e.label).trim();
    }
    const when = normalizeWhen(e.when);
    if (when && (when.expression || when.contextKey)) edge.when = when;
    if (e.isDefault === true) edge.isDefault = true;
    if (e.matchMode === "all") edge.matchMode = "all";
    if (e.branchKey != null && String(e.branchKey).trim()) {
      edge.branchKey = String(e.branchKey).trim();
    }
    return edge;
  }) : [];
  if (!edges.length && !Object.keys(positions).length) return void 0;
  return { positions, edges };
}
function ensureTerminalNodes(nodes) {
  const starts = nodes.filter((n) => n.type === "start");
  const ends = nodes.filter((n) => n.type === "end");
  const rest = nodes.filter((n) => n.type !== "start" && n.type !== "end");
  const start = starts[0] ?? {
    id: crypto.randomUUID(),
    type: "start",
    title: "开始"
  };
  const end = ends[0] ?? {
    id: crypto.randomUUID(),
    type: "end",
    title: "结束"
  };
  return [start, ...rest, end];
}
function normalizeWorkflow(raw) {
  const now = Date.now();
  const nodes = ensureTerminalNodes(
    Array.isArray(raw.nodes) ? raw.nodes.map(normalizeNode$1) : []
  );
  return {
    id: String(raw.id || "").trim() || crypto.randomUUID(),
    title: String(raw.title || "").trim() || "未命名流程",
    description: String(raw.description || "").trim(),
    templateKind: raw.templateKind === "publish" ? "publish" : "generic",
    nodes,
    canvas: normalizeCanvas$1(raw.canvas),
    createdAt: raw.createdAt ?? now,
    updatedAt: raw.updatedAt ?? now
  };
}
function readWorkflowsFromDisk() {
  const path2 = getWorkflowsPath();
  if (!fs.existsSync(path2)) return [];
  try {
    const parsed = JSON.parse(fs.readFileSync(path2, "utf-8"));
    if (!Array.isArray(parsed)) return [];
    return sortWorkflows(parsed.map(normalizeWorkflow));
  } catch {
    return [];
  }
}
function writeWorkflows(list) {
  const normalized = sortWorkflows(list.map(normalizeWorkflow));
  fs.writeFileSync(getWorkflowsPath(), JSON.stringify(normalized, null, 2), "utf-8");
  return normalized;
}
function queryWorkflows() {
  const existing = readWorkflowsFromDisk();
  const { list, added, refreshed } = mergeBuiltinWorkflowTemplates(existing);
  if (added > 0 || refreshed > 0) {
    return writeWorkflows(list);
  }
  return list;
}
function queryWorkflow(id) {
  return readWorkflowsFromDisk().find((w) => w.id === id) ?? null;
}
function postWorkflow(input) {
  if (!input.title.trim()) throw new Error("流程标题不能为空");
  const list = readWorkflowsFromDisk();
  const now = Date.now();
  const existing = list.find((w) => w.id === input.id);
  const next = normalizeWorkflow({
    ...input,
    createdAt: existing?.createdAt ?? input.createdAt ?? now,
    updatedAt: now
  });
  const idx = list.findIndex((w) => w.id === next.id);
  const merged = idx >= 0 ? list.map((w, i) => i === idx ? next : w) : [...list, next];
  writeWorkflows(merged);
  return next;
}
function postDeleteWorkflow(id) {
  const list = readWorkflowsFromDisk();
  if (!list.some((w) => w.id === id)) return;
  writeWorkflows(list.filter((w) => w.id !== id));
}
function remapLeaf(node, prefix) {
  return { ...node, id: `${prefix}__${node.id}` };
}
function remapNode(node, prefix) {
  if (node.type === "parallel") {
    const parallel = {
      ...node,
      id: `${prefix}__${node.id}`,
      children: node.children.map((c) => remapLeaf(c, prefix))
    };
    return parallel;
  }
  if (node.type === "condition") {
    const condition = {
      ...node,
      id: `${prefix}__${node.id}`,
      cases: node.cases.map((arm) => ({
        ...arm,
        nodes: arm.nodes.map((c) => remapLeaf(c, prefix))
      }))
    };
    return condition;
  }
  if (node.type === "start" || node.type === "end") {
    return { ...node, id: `${prefix}__${node.id}` };
  }
  return remapLeaf(node, prefix);
}
function compileWorkflowPlanToDefinition(plan) {
  const ids = normalizePublishPlanWorkflowIds(plan);
  const now = Date.now();
  const nodes = [];
  for (let i = 0; i < ids.length; i++) {
    const wid = ids[i];
    const child = queryWorkflow(wid);
    if (!child?.nodes.length) continue;
    const prefix = `sub${i}_${wid}`;
    for (const n of child.nodes) {
      nodes.push(remapNode(n, prefix));
    }
  }
  return {
    id: plan.id,
    title: plan.title,
    description: plan.description || `由流程任务自动组合（${ids.length} 个子流程）`,
    templateKind: "publish",
    nodes,
    createdAt: plan.createdAt || now,
    updatedAt: plan.updatedAt || now
  };
}
function syncPublishPlanWorkflow(plan) {
  const kind = normalizePublishPlanKind(plan.kind);
  const compiled = kind === "workflow" ? compileWorkflowPlanToDefinition(plan) : compilePublishPlanToWorkflow(plan);
  if (!compiled.nodes.length) {
    return null;
  }
  const existing = queryWorkflow(compiled.id);
  return postWorkflow({
    ...compiled,
    createdAt: existing?.createdAt ?? compiled.createdAt
  });
}
function postDeletePublishPlanWorkflow(planId) {
  postDeleteWorkflow(planId);
}
function queryOrMigratePublishWorkflow(planId) {
  const plan = queryPublishPlan(planId);
  if (!plan) {
    return queryWorkflow(planId);
  }
  if (normalizePublishPlanKind(plan.kind) === "workflow") {
    if (!normalizePublishPlanWorkflowIds(plan).length) {
      return queryWorkflow(planId);
    }
    return syncPublishPlanWorkflow(plan);
  }
  if (!plan.subTasks.length) {
    return queryWorkflow(planId);
  }
  return syncPublishPlanWorkflow(plan);
}
function queryPublishPlanRunnableWorkflowId(planId) {
  return queryOrMigratePublishWorkflow(planId)?.id ?? null;
}
let mainWindow$1 = null;
function setMainWindow(win) {
  mainWindow$1 = win;
}
function getMainWindow() {
  return mainWindow$1;
}
function emitScheduleUpdate() {
  const win = getMainWindow();
  if (win && !win.isDestroyed()) {
    win.webContents.send(IpcChannels.onScheduleUpdate, queryScheduledTasks());
  }
}
function emitPublishPlansUpdate() {
  const win = getMainWindow();
  if (win && !win.isDestroyed()) {
    win.webContents.send(IpcChannels.onPublishPlansUpdate, queryPublishPlans());
  }
}
function emitAgentRulesUpdate() {
  const win = getMainWindow();
  if (win && !win.isDestroyed()) {
    win.webContents.send(IpcChannels.onAgentRulesUpdate, queryAgentRules());
  }
}
function postScheduledTaskAndNotify(task) {
  const saved = postScheduledTask(task);
  emitScheduleUpdate();
  return saved;
}
function postPublishPlanAndSync(plan) {
  const saved = postPublishPlan(plan);
  try {
    syncPublishPlanWorkflow(saved);
  } catch {
  }
  emitPublishPlansUpdate();
  return saved;
}
function postAgentRuleAndNotify(input) {
  const saved = postAgentRule(input);
  emitAgentRulesUpdate();
  return saved;
}
function formatRunSessionTitle(prefix, name, runAt = Date.now()) {
  const label = new Date(runAt).toLocaleString("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
  const trimmed = name.trim() || "未命名";
  return `${prefix} ${trimmed} · ${label}`;
}
function pauseRunningTasks(tasks) {
  return tasks.map(
    (t) => t.status === "running" ? { ...t, status: "pending" } : t
  );
}
function queryHasRunningTasks(tasks) {
  return tasks.some((t) => t.status === "running");
}
const execFileAsync$1 = util.promisify(child_process.execFile);
const IMAGE_EXT$4 = /* @__PURE__ */ new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp", ".tif", ".tiff", ".heic"]);
function queryOcrDir() {
  return path.join(queryBundledResourcesRoot(), "ocr");
}
function queryLocalOcrBinaryPath() {
  return path.join(queryOcrDir(), "RecognizeText");
}
function queryLocalOcrScriptPath() {
  return path.join(queryOcrDir(), "RecognizeText.swift");
}
function queryIsLocalOcrImagePath(filePath) {
  return IMAGE_EXT$4.has(path.extname(filePath).toLowerCase());
}
async function queryLocalImageOcr(filePath) {
  const abs = String(filePath ?? "").trim();
  if (!abs) return { ok: false, error: "路径为空" };
  if (!fs.existsSync(abs)) return { ok: false, error: "文件不存在" };
  if (!queryIsLocalOcrImagePath(abs)) {
    return { ok: false, error: "非支持的图片格式" };
  }
  if (process.platform !== "darwin") {
    return { ok: false, error: "本机 OCR 当前仅支持 macOS Vision" };
  }
  const binary = queryLocalOcrBinaryPath();
  const script = queryLocalOcrScriptPath();
  let command;
  let args;
  if (fs.existsSync(binary)) {
    command = binary;
    args = [abs];
  } else if (fs.existsSync(script) && fs.existsSync("/usr/bin/swift")) {
    command = "/usr/bin/swift";
    args = [script, abs];
  } else {
    return {
      ok: false,
      error: `OCR 工具缺失（需 ${binary} 或 ${script} + swift）`
    };
  }
  try {
    const { stdout } = await execFileAsync$1(command, args, {
      timeout: 6e4,
      maxBuffer: 4 * 1024 * 1024,
      env: {
        ...process.env,
        SWIFT_DETERMINISTIC_HASHING: "1"
      }
    });
    return { ok: true, text: String(stdout ?? "").trim(), engine: "macos-vision" };
  } catch (e) {
    const err = e;
    const detail = typeof err.stderr === "string" && err.stderr.trim() || Buffer.isBuffer(err.stderr) && err.stderr.toString("utf8").trim() || err.message || String(e);
    return { ok: false, error: detail.slice(0, 500), engine: "macos-vision" };
  }
}
async function queryLocalOcrBlocksForAttachments(attachmentPaths) {
  const blocks = [];
  for (const raw of attachmentPaths) {
    const path$1 = String(raw ?? "").trim();
    if (!path$1 || !queryIsLocalOcrImagePath(path$1)) continue;
    const name = path.basename(path$1);
    const result = await queryLocalImageOcr(path$1);
    if (result.ok) {
      if (result.text) {
        blocks.push(`[本机识字 · ${name}]
${result.text}`);
      } else {
        blocks.push(`[本机识字 · ${name}]
（未识别到文字）`);
      }
    } else {
      blocks.push(`[本机识字 · ${name}]
（识别失败：${result.error}）`);
    }
  }
  return blocks;
}
const IMAGE_EXT$3 = /* @__PURE__ */ new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp", ".tif", ".tiff", ".heic"]);
function queryIsImagePath(filePath) {
  return IMAGE_EXT$3.has(path.extname(filePath).toLowerCase());
}
async function queryEnrichContentWithLocalOcr(text, attachmentPaths = []) {
  const paths = attachmentPaths.map((p) => p.trim()).filter(Boolean);
  const userText = text.trim();
  if (!paths.length) return userText;
  const imagePaths = paths.filter((p) => queryIsImagePath(p));
  const otherPaths = paths.filter((p) => !queryIsImagePath(p));
  const parts = [];
  if (userText) parts.push(userText);
  if (imagePaths.length) {
    const ocrBlocks = await queryLocalOcrBlocksForAttachments(imagePaths);
    if (ocrBlocks.length) {
      parts.push(ocrBlocks.join("\n\n"));
    }
  }
  const attachLines = [
    ...imagePaths.map((p) => p),
    ...otherPaths.map((p) => p)
  ];
  if (attachLines.length) {
    parts.push(`[附件]
${attachLines.join("\n")}`);
  }
  if (imagePaths.length) {
    parts.push("（图片文字已由本机系统识别并写入上方，请直接使用识别结果）");
  }
  return parts.join("\n\n");
}
function queryBuildHumanMessageFromStoredContent(content) {
  return new messages.HumanMessage(content);
}
function queryExtractTextFromContent(content) {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content.map((block) => {
      if (block && typeof block === "object" && "type" in block && block.type === "text" && "text" in block) {
        return String(block.text ?? "");
      }
      return "";
    }).join("");
  }
  if (content == null) return "";
  return String(content);
}
const LEGACY_EMBEDDED_HINT = "（上方已内嵌图片像素，请直接识图/OCR，无需 read_file）";
function queryProjectMessageWithoutImages(message) {
  const isHuman = messages.HumanMessage.isInstance(message) || message.getType?.() === "human";
  if (!isHuman) return message;
  const content = message.content;
  if (typeof content === "string" || !Array.isArray(content)) return message;
  const hasImage = content.some(
    (block) => block && typeof block === "object" && "type" in block && block.type === "image_url"
  );
  if (!hasImage) return message;
  let text = queryExtractTextFromContent(content);
  if (text.includes(LEGACY_EMBEDDED_HINT)) {
    text = text.split(LEGACY_EMBEDDED_HINT).join("").trim();
  }
  return new messages.HumanMessage({ content: text });
}
function getRunsPath() {
  return path.join(getDataRoot(), "workflow-runs.json");
}
const RUN_STATUSES = [
  "pending",
  "running",
  "awaiting_user",
  "success",
  "failed",
  "aborted"
];
function normalizeRun(raw) {
  const now = Date.now();
  const status = RUN_STATUSES.includes(raw.status) ? raw.status : "pending";
  return {
    id: String(raw.id || "").trim() || crypto.randomUUID(),
    workflowId: String(raw.workflowId || "").trim(),
    sessionId: String(raw.sessionId || "").trim(),
    status,
    cursorNodeId: raw.cursorNodeId ?? null,
    context: raw.context && typeof raw.context === "object" && !Array.isArray(raw.context) ? { ...raw.context } : {},
    errorMessage: raw.errorMessage,
    createdAt: raw.createdAt ?? now,
    updatedAt: raw.updatedAt ?? now
  };
}
function readRunsFromDisk() {
  const path2 = getRunsPath();
  if (!fs.existsSync(path2)) return [];
  try {
    const parsed = JSON.parse(fs.readFileSync(path2, "utf-8"));
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeRun);
  } catch {
    return [];
  }
}
function writeRuns(runs) {
  const normalized = runs.map(normalizeRun);
  fs.writeFileSync(getRunsPath(), JSON.stringify(normalized, null, 2), "utf-8");
  return normalized;
}
function queryWorkflowRuns() {
  return readRunsFromDisk();
}
function queryWorkflowRun(id) {
  return readRunsFromDisk().find((r) => r.id === id) ?? null;
}
function queryActiveWorkflowRunBySession(sessionId) {
  const active = ["pending", "running", "awaiting_user", "failed", "aborted"];
  return readRunsFromDisk().filter((r) => r.sessionId === sessionId && active.includes(r.status)).sort((a, b) => b.updatedAt - a.updatedAt)[0] ?? null;
}
function queryLatestWorkflowRunBySession(sessionId) {
  return readRunsFromDisk().filter((r) => r.sessionId === sessionId).sort((a, b) => b.updatedAt - a.updatedAt)[0] ?? null;
}
function postWorkflowRun(run) {
  const list = readRunsFromDisk();
  const next = normalizeRun({ ...run, updatedAt: Date.now() });
  const idx = list.findIndex((r) => r.id === next.id);
  const merged = idx >= 0 ? list.map((r, i) => i === idx ? next : r) : [...list, next];
  writeRuns(merged);
  return next;
}
const workflowRuns = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  postWorkflowRun,
  queryActiveWorkflowRunBySession,
  queryLatestWorkflowRunBySession,
  queryWorkflowRun,
  queryWorkflowRuns
}, Symbol.toStringTag, { value: "Module" }));
function getChannelsPath() {
  return path.join(getDataRoot(), "channels.json");
}
function validateChannelId(id) {
  if (!/^[a-z0-9_-]{1,64}$/.test(id)) {
    throw new Error("渠道 id 仅允许小写字母、数字、连字符和下划线，长度 1～64");
  }
}
function mergeWithDefaults(stored) {
  const byId = new Map(stored.map((c) => [c.id, c]));
  for (const def of DEFAULT_PUBLISH_CHANNELS) {
    const existing = byId.get(def.id);
    if (!existing) {
      byId.set(def.id, { ...def, updatedAt: Date.now() });
    } else {
      byId.set(def.id, {
        ...def,
        ...existing,
        kind: normalizeChannelKind(existing.kind ?? def.kind),
        isBuiltin: true,
        updatedAt: existing.updatedAt ?? Date.now()
      });
    }
  }
  return sortChannels(Array.from(byId.values()));
}
function sortChannels(channels) {
  return [...channels].sort((a, b) => {
    if (a.isBuiltin !== b.isBuiltin) return a.isBuiltin ? -1 : 1;
    const kindOrder = (k) => k === "publish" ? 0 : 1;
    const ka = kindOrder(normalizeChannelKind(a.kind));
    const kb = kindOrder(normalizeChannelKind(b.kind));
    if (ka !== kb) return ka - kb;
    return a.label.localeCompare(b.label, "zh-CN");
  });
}
function channelsEqual(a, b) {
  const norm = (list) => sortChannels(list.map(normalizeChannel)).map((c) => JSON.stringify(c));
  const left = norm(a);
  const right = norm(b);
  return left.length === right.length && left.every((s, i) => s === right[i]);
}
function normalizeChannel(raw) {
  const kind = normalizeChannelKind(raw.kind);
  const notifyConfig = kind === "notify" ? {
    webhookUrl: raw.notifyConfig?.webhookUrl?.trim() || void 0,
    secret: raw.notifyConfig?.secret?.trim() || void 0,
    feishuMsgType: normalizeFeishuMsgType(raw.notifyConfig?.feishuMsgType),
    feishuImageKey: raw.notifyConfig?.feishuImageKey?.trim() || void 0,
    feishuShareChatId: raw.notifyConfig?.feishuShareChatId?.trim() || void 0
  } : void 0;
  let agentHint = (raw.agentHint ?? "").trim();
  if ((raw.id === "feishu" || raw.id.endsWith("_feishu")) && queryShouldRefreshFeishuAgentHint(agentHint, raw.id)) {
    agentHint = queryFeishuNotifyAgentHint({
      channelId: raw.id,
      feishuMsgType: notifyConfig?.feishuMsgType ?? "post"
    });
  } else if (raw.id === "webhook" && !agentHint) {
    agentHint = queryWebhookNotifyAgentHint("webhook");
  }
  return {
    ...raw,
    id: raw.id.trim(),
    kind,
    label: raw.label.trim(),
    description: raw.description.trim(),
    // 为什么：旧数据只有 publishTool；notify 渠道不得 trim 空串导致写盘失败
    publishTool: raw.publishTool?.trim() || void 0,
    notifyTool: raw.notifyTool?.trim() || (kind === "notify" ? "notify_message" : void 0),
    notifyConfig,
    loginCheckUrl: raw.loginCheckUrl?.trim() || void 0,
    titleMaxLength: raw.titleMaxLength != null && raw.titleMaxLength > 0 ? raw.titleMaxLength : void 0,
    // 拟人操作默认关闭；旧数据缺省视为 false
    humanized: kind === "publish" ? Boolean(raw.humanized) : void 0,
    sdkConfig: kind === "publish" && raw.sdkConfig && typeof raw.sdkConfig === "object" ? { ...raw.sdkConfig } : void 0,
    agentHint,
    isBuiltin: raw.isBuiltin ?? DEFAULT_PUBLISH_CHANNELS.some((d) => d.id === raw.id),
    updatedAt: raw.updatedAt ?? Date.now()
  };
}
function readChannelsFromDisk() {
  const path2 = getChannelsPath();
  if (!fs.existsSync(path2)) {
    const seeded = mergeWithDefaults([]);
    return writeChannels(seeded);
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(path2, "utf-8"));
    if (!Array.isArray(parsed)) {
      throw new Error("channels.json 格式无效");
    }
    const stored = parsed.map(normalizeChannel);
    const merged = mergeWithDefaults(stored);
    if (!channelsEqual(stored, merged)) {
      return writeChannels(merged);
    }
    setPublishChannelRegistry(merged);
    return merged;
  } catch {
    const seeded = mergeWithDefaults([]);
    return writeChannels(seeded);
  }
}
function writeChannels(channels) {
  const normalized = channels.map(normalizeChannel);
  fs.writeFileSync(getChannelsPath(), JSON.stringify(normalized, null, 2), "utf-8");
  setPublishChannelRegistry(normalized);
  return normalized;
}
function initPublishChannelRegistry() {
  readChannelsFromDisk();
}
function queryPublishChannels() {
  return readChannelsFromDisk();
}
function postInitPublishChannels() {
  const channels = readChannelsFromDisk();
  const custom = channels.filter(
    (c) => !DEFAULT_PUBLISH_CHANNELS.some((d) => d.id === c.id)
  );
  return writeChannels(mergeWithDefaults(custom));
}
function postPublishChannel(input) {
  validateChannelId(input.id);
  const channels = readChannelsFromDisk();
  const now = Date.now();
  const existing = channels.find((c) => c.id === input.id);
  const isBuiltin = existing?.isBuiltin ?? DEFAULT_PUBLISH_CHANNELS.some((d) => d.id === input.id);
  const kind = normalizeChannelKind(input.kind);
  if (!input.label.trim()) throw new Error("渠道名称不能为空");
  if (kind === "publish") {
    if (!input.publishTool?.trim()) throw new Error("发布工具名不能为空");
  } else if (!input.notifyTool?.trim()) {
    throw new Error("通知工具名不能为空");
  }
  if (existing && normalizeChannelKind(existing.kind) !== kind) {
    throw new Error("渠道类型创建后不可修改");
  }
  const next = normalizeChannel({
    id: input.id,
    kind,
    label: input.label,
    description: input.description,
    enabled: input.enabled,
    publishTool: input.publishTool,
    titleMaxLength: input.titleMaxLength,
    loginCheckUrl: input.loginCheckUrl,
    humanized: input.humanized,
    sdkConfig: input.sdkConfig,
    notifyTool: input.notifyTool,
    notifyConfig: input.notifyConfig,
    agentHint: input.agentHint,
    isBuiltin,
    updatedAt: now
  });
  const idx = channels.findIndex((c) => c.id === input.id);
  const merged = idx >= 0 ? channels.map((c, i) => i === idx ? next : c) : [...channels, next];
  writeChannels(merged);
  return next;
}
function postDeletePublishChannel(id) {
  const channels = readChannelsFromDisk();
  const target = channels.find((c) => c.id === id);
  if (!target) return;
  if (target.isBuiltin) {
    throw new Error("内置渠道不可删除");
  }
  writeChannels(channels.filter((c) => c.id !== id));
}
const DEFAULT_UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";
class HttpError extends Error {
  constructor(message, status, url2) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.url = url2;
  }
}
class HttpTimeoutError extends Error {
  constructor(url2, timeoutMs) {
    super(`请求超时（${Math.round(timeoutMs / 1e3)}s）：${url2}`);
    this.name = "HttpTimeoutError";
    this.url = url2;
    this.timeoutMs = timeoutMs;
  }
}
function queryMergeSignal(timeoutMs, external) {
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  const onExternalAbort = () => controller.abort();
  if (external) {
    if (external.aborted) {
      controller.abort();
    } else {
      external.addEventListener("abort", onExternalAbort, { once: true });
    }
  }
  return {
    signal: controller.signal,
    timedOut: () => timedOut,
    cleanup: () => {
      clearTimeout(timer);
      external?.removeEventListener("abort", onExternalAbort);
    }
  };
}
async function queryFetchOnce(url2, options) {
  const timeoutMs = options.timeoutMs ?? 2e4;
  const { signal, cleanup, timedOut } = queryMergeSignal(timeoutMs, options.signal);
  try {
    const body = options.body == null ? void 0 : typeof options.body === "string" ? options.body : JSON.stringify(options.body);
    const headers = {
      "User-Agent": DEFAULT_UA,
      Accept: "application/json,text/plain,*/*",
      ...options.headers
    };
    if (body != null && !headers["Content-Type"] && typeof options.body !== "string") {
      headers["Content-Type"] = "application/json";
    }
    const res = await fetch(url2, {
      method: options.method ?? "GET",
      headers,
      body,
      signal
    });
    return res;
  } catch (err) {
    if (timedOut()) {
      throw new HttpTimeoutError(url2, timeoutMs);
    }
    throw err;
  } finally {
    cleanup();
  }
}
async function queryHttp(url2, options = {}) {
  const retries = Math.max(0, options.retries ?? 0);
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await queryFetchOnce(url2, options);
      if (!res.ok) {
        throw new HttpError(`HTTP ${res.status}`, res.status, url2);
      }
      return res;
    } catch (err) {
      lastError = err;
      if (attempt === retries) break;
      await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}
async function queryHttpResponse(url2, options = {}) {
  return queryFetchOnce(url2, options);
}
async function queryHttpJson(url2, options = {}) {
  const res = await queryHttp(url2, options);
  return await res.json();
}
async function postHttpJson(url2, body, options = {}) {
  return queryHttpJson(url2, {
    ...options,
    method: "POST",
    body
  });
}
function queryFeishuSign(secret, timestamp) {
  const stringToSign = `${timestamp}
${secret}`;
  return crypto$1.createHmac("sha256", stringToSign).digest("base64");
}
function throwFeishuWebhookError(data, httpStatus) {
  const bizCode = data.code ?? data.StatusCode;
  const detail = data.msg || data.StatusMessage || `飞书通知失败 HTTP ${httpStatus}`;
  if (bizCode === 19021) {
    throw new Error("签名校验失败：请核对签名密钥，或关闭机器人「签名校验」后重试");
  }
  if (bizCode === 19024) {
    throw new Error("未命中自定义关键词：请在机器人安全设置中查看关键词，并在消息中包含该词");
  }
  if (bizCode === 19022) {
    throw new Error("IP 不在白名单：本机出口 IP 未加入飞书机器人白名单");
  }
  throw new Error(detail);
}
function queryFeishuWebhookRequest(opts) {
  const requestBody = {
    msg_type: opts.msgType,
    content: opts.content
  };
  if (opts.secret?.trim()) {
    const timestamp = String(Math.floor(Date.now() / 1e3));
    requestBody.timestamp = timestamp;
    requestBody.sign = queryFeishuSign(opts.secret.trim(), timestamp);
  }
  return { requestPath: opts.webhookUrl, requestBody };
}
async function postFeishuWebhook(opts) {
  const { requestPath, requestBody } = queryFeishuWebhookRequest(opts);
  const res = await queryHttpResponse(requestPath, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: requestBody,
    timeoutMs: 15e3
  });
  const data = await res.json().catch(() => ({}));
  const bizCode = data.code ?? data.StatusCode;
  if (!res.ok || bizCode != null && bizCode !== 0) {
    throwFeishuWebhookError(data, res.status);
  }
}
async function postFeishuWebhookText(opts) {
  await postFeishuWebhook({
    webhookUrl: opts.webhookUrl,
    secret: opts.secret,
    msgType: "text",
    content: { text: opts.text }
  });
}
function queryFeishuPostWebhookContent(post, locale = "zh_cn") {
  return {
    post: {
      [locale]: {
        title: post.title,
        content: post.content
      }
    }
  };
}
async function postFeishuWebhookPost(opts) {
  const locale = opts.locale ?? "zh_cn";
  await postFeishuWebhook({
    webhookUrl: opts.webhookUrl,
    secret: opts.secret,
    msgType: "post",
    content: queryFeishuPostWebhookContent(opts.post, locale)
  });
}
async function postFeishuWebhookImage(opts) {
  await postFeishuWebhook({
    webhookUrl: opts.webhookUrl,
    secret: opts.secret,
    msgType: "image",
    content: { image_key: opts.imageKey }
  });
}
async function postFeishuWebhookShareChat(opts) {
  await postFeishuWebhook({
    webhookUrl: opts.webhookUrl,
    secret: opts.secret,
    msgType: "share_chat",
    content: { share_chat_id: opts.shareChatId }
  });
}
function queryLooksLikeMarkdown(text) {
  const s = text.trim();
  if (!s) return false;
  return /^#{1,6}\s/m.test(s) || /^\|.+\|$/m.test(s) || /\*\*[^*]+\*\*/.test(s) || /\[.+?\]\(.+?\)/.test(s) || /^[-*+]\s/m.test(s) || /^\d+\.\s/m.test(s) || /^>\s/m.test(s);
}
function stripInlineMarkdown(text) {
  return text.replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\*([^*]+)\*/g, "$1").replace(/__([^_]+)__/g, "$1").replace(/_([^_]+)_/g, "$1").replace(/`([^`]+)`/g, "$1").trim();
}
function parseMarkdownTableRow(line) {
  const trimmed = line.trim();
  if (!trimmed.startsWith("|") || !trimmed.endsWith("|")) return null;
  const cells = trimmed.slice(1, -1).split("|").map((c) => stripInlineMarkdown(c));
  return cells.length >= 2 && cells.some(Boolean) ? cells : null;
}
function queryIsTableSeparator(line) {
  return /^\|[\s\-:|]+\|$/.test(line.trim());
}
function formatTableCells(cells) {
  return cells.filter(Boolean).join("    ");
}
function markdownToFeishuLines(markdown) {
  const result = [];
  let tableHeaders = null;
  let inTable = false;
  for (const rawLine of markdown.split("\n")) {
    const trimmed = rawLine.trim();
    if (!trimmed) {
      if (result.length > 0 && result[result.length - 1] !== "") {
        result.push("");
      }
      tableHeaders = null;
      inTable = false;
      continue;
    }
    if (queryIsTableSeparator(trimmed)) {
      continue;
    }
    const tableCells = parseMarkdownTableRow(trimmed);
    if (tableCells) {
      inTable = true;
      if (!tableHeaders) {
        tableHeaders = tableCells;
        result.push(formatTableCells(tableCells));
      } else {
        result.push(formatTableCells(tableCells));
      }
      continue;
    }
    if (inTable) {
      tableHeaders = null;
      inTable = false;
    }
    const headerMatch = trimmed.match(/^#{1,6}\s+(.+)$/);
    if (headerMatch) {
      if (result.length > 0 && result[result.length - 1] !== "") {
        result.push("");
      }
      result.push(stripInlineMarkdown(headerMatch[1]));
      continue;
    }
    if (trimmed.startsWith(">")) {
      result.push(stripInlineMarkdown(trimmed.replace(/^>\s?/, "")));
      continue;
    }
    const bulletMatch = trimmed.match(/^[-*+]\s+(.+)$/);
    if (bulletMatch) {
      result.push(`• ${stripInlineMarkdown(bulletMatch[1])}`);
      continue;
    }
    const orderedMatch = trimmed.match(/^\d+\.\s+(.+)$/);
    if (orderedMatch) {
      result.push(`${orderedMatch[0].match(/^\d+/)?.[0]}. ${stripInlineMarkdown(orderedMatch[1])}`);
      continue;
    }
    if (/^[-*_]{3,}\s*$/.test(trimmed)) {
      result.push("────────");
      continue;
    }
    result.push(stripInlineMarkdown(trimmed));
  }
  const compact = [];
  for (const line of result) {
    if (line === "" && compact[compact.length - 1] === "") continue;
    compact.push(line);
  }
  return compact.filter((l) => l !== "").length ? compact.filter((l, i, arr) => !(l === "" && i === arr.length - 1)) : [];
}
function parseMarkdownLineToPostElements(line) {
  const elements = [];
  const linkRe = /\[([^\]]+)\]\(([^)]+)\)/g;
  let lastIndex = 0;
  let match;
  while ((match = linkRe.exec(line)) !== null) {
    const before = line.slice(lastIndex, match.index);
    if (before) elements.push({ tag: "text", text: before });
    elements.push({ tag: "a", text: match[1], href: match[2] });
    lastIndex = match.index + match[0].length;
  }
  const rest = line.slice(lastIndex);
  if (rest) elements.push({ tag: "text", text: rest });
  if (elements.length === 0) elements.push({ tag: "text", text: line });
  return elements;
}
function markdownToFeishuPost(markdown, options = {}) {
  const lines = markdownToFeishuLines(markdown);
  const rows = lines.map((line) => {
    if (!line.trim()) {
      return [{ tag: "text", text: " " }];
    }
    return parseMarkdownLineToPostElements(line);
  });
  if (options.atUserId) {
    const atEl = { tag: "at", user_id: options.atUserId };
    if (rows.length > 0) {
      rows[0] = [atEl, ...rows[0]];
    } else {
      rows.push([atEl]);
    }
  }
  if (rows.length === 0) {
    rows.push([{ tag: "text", text: "（无内容）" }]);
  }
  return {
    title: options.title?.trim() || "通知",
    content: rows
  };
}
async function postFeishuWebhookRichText(opts) {
  await postFeishuWebhookPost({
    webhookUrl: opts.webhookUrl,
    secret: opts.secret,
    post: opts.post
  });
}
function queryGenericWebhookRequest(opts) {
  const requestBody = {
    msg_type: "text",
    text: opts.text,
    title: opts.title,
    channel: "webhook"
  };
  const requestHeaders = {};
  if (opts.secret?.trim()) {
    requestHeaders.Authorization = `Bearer ${opts.secret.trim()}`;
  }
  return { requestPath: opts.webhookUrl, requestBody, requestHeaders };
}
async function postGenericWebhookText(opts) {
  const { requestPath, requestBody, requestHeaders } = queryGenericWebhookRequest(opts);
  await postHttpJson(requestPath, requestBody, {
    headers: requestHeaders,
    timeoutMs: 15e3
  });
}
const NOTIFY_DEDUPE_MS = 12e4;
const recentNotifyAt = /* @__PURE__ */ new Map();
function queryNotifyDedupeKey(args) {
  return [
    args.channelId,
    args.msgType,
    args.title?.trim() ?? "",
    args.content.trim(),
    args.imageKey?.trim() ?? "",
    args.shareChatId?.trim() ?? ""
  ].join("\0");
}
async function postNotifyMessage(args) {
  queryPublishChannels();
  const meta = queryPublishChannelMeta(args.channelId);
  if (normalizeChannelKind(meta.kind) !== "notify") {
    return { ok: false, error: `渠道 ${args.channelId} 不是通知渠道` };
  }
  if (meta.id === "wechat_notify" || meta.id === "qq_notify") {
    return { ok: false, error: `${meta.label} 通知能力尚未接入` };
  }
  const webhookUrl = meta.notifyConfig?.webhookUrl?.trim();
  if (!webhookUrl) {
    return { ok: false, error: `${meta.label} Webhook 未配置，请先在设置 → 渠道中填写并保存` };
  }
  const channelDefault = meta.notifyConfig?.feishuMsgType;
  let msgType = queryFeishuMsgType({
    msgType: args.msgType,
    richText: args.richText,
    channelId: meta.id,
    channelDefault: meta.id === "feishu" ? channelDefault : void 0
  });
  if (meta.id === "feishu" && msgType === "text" && queryLooksLikeMarkdown(args.content)) {
    msgType = "post";
  }
  const imageKey = args.imageKey?.trim() || meta.notifyConfig?.feishuImageKey?.trim() || void 0;
  const shareChatId = args.shareChatId?.trim() || meta.notifyConfig?.feishuShareChatId?.trim() || void 0;
  const dedupeKey = queryNotifyDedupeKey({
    channelId: args.channelId,
    msgType,
    title: args.title,
    content: args.content,
    imageKey,
    shareChatId
  });
  const lastAt = recentNotifyAt.get(dedupeKey);
  if (lastAt != null && Date.now() - lastAt < NOTIFY_DEDUPE_MS) {
    console.info(`[notify] deduped channelId=${meta.id} msgType=${msgType}`);
    return { ok: true, deduped: true };
  }
  const text = args.title?.trim() ? `${args.title.trim()}
${args.content}` : args.content;
  const buildRequestSnapshot = () => {
    if (meta.id === "feishu") {
      if (msgType === "image") {
        if (!imageKey) return void 0;
        return queryFeishuWebhookRequest({
          webhookUrl,
          secret: meta.notifyConfig?.secret,
          msgType: "image",
          content: { image_key: imageKey }
        });
      }
      if (msgType === "share_chat") {
        if (!shareChatId) return void 0;
        return queryFeishuWebhookRequest({
          webhookUrl,
          secret: meta.notifyConfig?.secret,
          msgType: "share_chat",
          content: { share_chat_id: shareChatId }
        });
      }
      if (msgType === "post") {
        const post = markdownToFeishuPost(args.content, {
          atUserId: args.atUserId,
          title: args.title
        });
        return queryFeishuWebhookRequest({
          webhookUrl,
          secret: meta.notifyConfig?.secret,
          msgType: "post",
          content: queryFeishuPostWebhookContent(post)
        });
      }
      return queryFeishuWebhookRequest({
        webhookUrl,
        secret: meta.notifyConfig?.secret,
        msgType: "text",
        content: { text }
      });
    }
    if (meta.id === "webhook") {
      const { requestPath, requestBody, requestHeaders } = queryGenericWebhookRequest({
        webhookUrl,
        secret: meta.notifyConfig?.secret,
        title: args.title,
        text
      });
      return { requestPath, requestBody, requestHeaders };
    }
    return void 0;
  };
  const request = buildRequestSnapshot();
  try {
    if (meta.id === "feishu") {
      if (msgType === "image") {
        if (!imageKey) {
          return {
            ok: false,
            error: "图片消息缺少 image_key：请在设置 → 渠道中配置，或在通知参数中传入 imageKey",
            request
          };
        }
        await postFeishuWebhookImage({
          webhookUrl,
          secret: meta.notifyConfig?.secret,
          imageKey
        });
      } else if (msgType === "share_chat") {
        if (!shareChatId) {
          return {
            ok: false,
            error: "群名片缺少 share_chat_id：请在设置 → 渠道中配置，或在通知参数中传入 shareChatId",
            request
          };
        }
        await postFeishuWebhookShareChat({
          webhookUrl,
          secret: meta.notifyConfig?.secret,
          shareChatId
        });
      } else if (msgType === "post") {
        const post = markdownToFeishuPost(args.content, {
          atUserId: args.atUserId,
          title: args.title
        });
        await postFeishuWebhookRichText({
          webhookUrl,
          secret: meta.notifyConfig?.secret,
          post
        });
      } else {
        await postFeishuWebhookText({
          webhookUrl,
          secret: meta.notifyConfig?.secret,
          text
        });
      }
    } else if (meta.id === "webhook") {
      await postGenericWebhookText({
        webhookUrl,
        secret: meta.notifyConfig?.secret,
        title: args.title,
        text
      });
    } else {
      return { ok: false, error: `未知通知渠道：${meta.id}` };
    }
    recentNotifyAt.set(dedupeKey, Date.now());
    console.info(`[notify] ok channelId=${meta.id} msgType=${msgType}`);
    return { ok: true, request };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.warn(`[notify] fail channelId=${meta.id} msgType=${msgType} error=${error}`);
    return { ok: false, error, request };
  }
}
async function postNotifyMessageFanout(args) {
  const unique = Array.from(new Set(args.channelIds.map((id) => id.trim()).filter(Boolean)));
  const settled = await Promise.all(
    unique.map(async (channelId) => {
      const result = await postNotifyMessage({
        channelId,
        title: args.title,
        content: args.content,
        msgType: args.msgType,
        imageKey: args.imageKey,
        shareChatId: args.shareChatId,
        richText: args.richText,
        atUserId: args.atUserId
      });
      return { channelId, ...result };
    })
  );
  return {
    results: settled,
    okCount: settled.filter((r) => r.ok).length,
    failCount: settled.filter((r) => !r.ok).length
  };
}
async function postScheduleTaskNotify(args) {
  const { taskTitle, content, notifyChannelIds } = args;
  const body = content.trim();
  if (!body || notifyChannelIds.length === 0) return;
  const fanout = await postNotifyMessageFanout({
    channelIds: notifyChannelIds,
    title: taskTitle,
    content: body,
    msgType: "post",
    atUserId: "all"
  });
  for (const r of fanout.results) {
    if (!r.ok) {
      console.warn(
        `[schedule-notify] fail task="${taskTitle}" channel=${r.channelId} error=${r.error}`
      );
    }
  }
}
const WORKFLOW_CTX_PREFIX = "@@workflow_ctx@@";
function queryDecodeWorkflowToolResult(result) {
  if (!result.startsWith(WORKFLOW_CTX_PREFIX)) {
    return { message: result, patch: {} };
  }
  try {
    const parsed = JSON.parse(result.slice(WORKFLOW_CTX_PREFIX.length));
    const patch = parsed.patch && typeof parsed.patch === "object" && !Array.isArray(parsed.patch) ? parsed.patch : {};
    return {
      message: parsed.message != null ? String(parsed.message) : result,
      patch
    };
  } catch {
    return { message: result, patch: {} };
  }
}
function queryMergeToolResultToContext(context, decoded, options) {
  const nextContext = { ...context, ...decoded.patch };
  const outputKeys = options?.outputKeys;
  if (outputKeys?.length) {
    for (const key of outputKeys) {
      if (Object.prototype.hasOwnProperty.call(decoded.patch, key)) continue;
      nextContext[key] = decoded.message;
    }
  } else if (!Object.keys(decoded.patch).length && options?.toolName) {
    nextContext[options.toolName] = decoded.message;
  }
  return nextContext;
}
function interpolatePromptSoft(template, context) {
  return template.replace(/\{\{(\w+)\}\}/g, (_full, key) => {
    if (!(key in context)) return "";
    const v = context[key];
    if (v == null) return "";
    return typeof v === "string" ? v : JSON.stringify(v);
  });
}
function queryExtractNotifyMarkdown(text) {
  const trimmed = text.trim();
  if (!trimmed) return "";
  const fenceRe = /```(?:markdown|md)?\s*\n([\s\S]*?)```/gi;
  const fenced = [];
  let match;
  while ((match = fenceRe.exec(trimmed)) !== null) {
    const body = match[1]?.trim();
    if (body) fenced.push(body);
  }
  if (fenced.length > 0) {
    return fenced.sort((a, b) => b.length - a.length)[0];
  }
  const headingIdx = trimmed.search(/^#{1,6}\s+/m);
  if (headingIdx >= 0) return trimmed.slice(headingIdx).trim();
  return trimmed;
}
function queryMarkdownHeadingTitle(markdown) {
  const m = markdown.match(/^#{1,6}\s+(.+)$/m);
  return m?.[1]?.trim() || void 0;
}
function queryAgentStepOutput(messages2, fromIndex) {
  const newMessages = messages2.slice(fromIndex);
  const lastAssistant = [...newMessages].reverse().find((m) => m.role === "assistant" && m.content?.trim());
  const raw = lastAssistant?.content?.trim() ?? "";
  return queryExtractNotifyMarkdown(raw);
}
function patchAgentOutputToContext(context, output, outputKeys) {
  if (!output) return context;
  const nextContext = { ...context };
  const keys = outputKeys?.length ? outputKeys : ["summary"];
  for (const key of keys) {
    nextContext[key] = output;
  }
  return nextContext;
}
const sessionTaskMap = /* @__PURE__ */ new Map();
const runningTaskIds = /* @__PURE__ */ new Set();
const WORKFLOW_ASSISTANT_SKIP = /* @__PURE__ */ new Set(["流程执行完毕。", "流程已中止。"]);
function shouldSkipWorkflowAssistant(text) {
  if (WORKFLOW_ASSISTANT_SKIP.has(text)) return true;
  if (text.startsWith("渠道通知：")) return true;
  if (text.startsWith("流程开始：") || text.startsWith("流程结束：")) return true;
  if (text.startsWith("流程执行失败：")) return true;
  return false;
}
function queryLastAssistantContent(messages2) {
  for (let i = messages2.length - 1; i >= 0; i--) {
    const msg = messages2[i];
    if (msg.role === "assistant") {
      const text = msg.content?.trim();
      if (!text || shouldSkipWorkflowAssistant(text)) continue;
      return queryExtractNotifyMarkdown(text);
    }
  }
  return null;
}
function postTaskResultFeishuNotify(args) {
  const { title, sessionId, notifyChannelIds } = args;
  if (notifyChannelIds.length === 0) return;
  const session = querySession(sessionId);
  const content = session ? queryLastAssistantContent(session.messages) : null;
  if (!content) return;
  void postScheduleTaskNotify({
    taskTitle: title,
    content,
    notifyChannelIds
  });
}
function registerScheduleSession(sessionId, taskId) {
  sessionTaskMap.set(sessionId, taskId);
  runningTaskIds.add(taskId);
}
function isScheduleTaskRunning(taskId) {
  return runningTaskIds.has(taskId);
}
function markScheduleTaskRunning(taskId) {
  runningTaskIds.add(taskId);
}
function handleScheduleAgentDone(event) {
  if (event.type !== "done") return;
  const success = event.reason === "end_turn" || event.reason === "max_turns" || event.reason === "workflow_success";
  const taskId = sessionTaskMap.get(event.sessionId);
  if (taskId) {
    sessionTaskMap.delete(event.sessionId);
    runningTaskIds.delete(taskId);
    const task = queryScheduledTask(taskId);
    if (task) {
      const next = {
        ...task,
        lastRunStatus: success ? "success" : "failed",
        updatedAt: Date.now()
      };
      if (task.repeat === "once") {
        next.enabled = false;
        next.nextRunAt = void 0;
      } else {
        next.nextRunAt = computeNextRunAt({ ...next, enabled: next.enabled }) ?? void 0;
      }
      postScheduledTask(next);
      emitScheduleUpdate();
      if (success) {
        postTaskResultFeishuNotify({
          title: task.title,
          sessionId: event.sessionId,
          notifyChannelIds: normalizeNotifyChannelIds(task.notifyChannels)
        });
      }
    }
    return;
  }
  if (success && event.reason === "workflow_success") {
    const run = queryLatestWorkflowRunBySession(event.sessionId);
    const workflowId = run?.workflowId;
    if (!workflowId) return;
    const workflow = queryWorkflow(workflowId);
    if (workflow && queryWorkflowHasNotifyNode(workflow.nodes)) return;
    const plan = queryPublishPlan(workflowId);
    if (!plan) return;
    postTaskResultFeishuNotify({
      title: plan.title,
      sessionId: event.sessionId,
      notifyChannelIds: normalizeNotifyChannelIds(plan.notifyChannels)
    });
  }
}
const THINKING_STALL_TIMEOUT_MS = 12e4;
const gates = /* @__PURE__ */ new Map();
let stallAbortHandler = null;
function postBindThinkingStallAbort(handler) {
  stallAbortHandler = handler;
}
function queryGate(sessionId) {
  let gate = gates.get(sessionId);
  if (!gate) {
    gate = {
      reasoning: false,
      waiters: [],
      stallTimer: null,
      stallTimeoutMs: THINKING_STALL_TIMEOUT_MS
    };
    gates.set(sessionId, gate);
  }
  return gate;
}
function emitAgentEvent$3(event) {
  const win = getMainWindow();
  if (win && !win.isDestroyed()) {
    win.webContents.send("event:agent", event);
  }
}
function clearStallTimer(gate) {
  if (gate.stallTimer == null) return;
  clearTimeout(gate.stallTimer);
  gate.stallTimer = null;
}
function armStallTimer(sessionId, gate) {
  clearStallTimer(gate);
  gate.stallTimer = setTimeout(() => {
    gate.stallTimer = null;
    if (!gate.reasoning) return;
    postThinkingReasoningComplete(sessionId);
    stallAbortHandler?.(sessionId);
  }, gate.stallTimeoutMs);
}
function postThinkingReasoningStart(sessionId, stallTimeoutMs = THINKING_STALL_TIMEOUT_MS) {
  const gate = queryGate(sessionId);
  gate.reasoning = true;
  gate.stallTimeoutMs = stallTimeoutMs;
  armStallTimer(sessionId, gate);
}
function postThinkingReasoningComplete(sessionId) {
  const gate = queryGate(sessionId);
  if (!gate.reasoning) return;
  clearStallTimer(gate);
  gate.reasoning = false;
  emitAgentEvent$3({ type: "thinking_complete", sessionId });
  for (const resolve of gate.waiters) resolve();
  gate.waiters = [];
}
function queryWaitThinkingSettled(sessionId, timeoutMs = THINKING_STALL_TIMEOUT_MS) {
  const gate = queryGate(sessionId);
  if (!gate.reasoning) return Promise.resolve();
  return new Promise((resolve) => {
    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      resolve();
    };
    gate.waiters.push(done);
    setTimeout(() => {
      if (!gate.reasoning) return;
      postThinkingReasoningComplete(sessionId);
    }, timeoutMs);
  });
}
function postResetThinkingGate(sessionId) {
  const gate = gates.get(sessionId);
  if (!gate) return;
  if (gate.reasoning) {
    postThinkingReasoningComplete(sessionId);
  } else {
    clearStallTimer(gate);
    for (const resolve of gate.waiters) resolve();
    gate.waiters = [];
  }
  gates.delete(sessionId);
}
const thinkingRoundtripAls = new node_async_hooks.AsyncLocalStorage();
function postInjectReasoningContent(lcMessages, apiMessages) {
  const reasonings = [];
  for (const message of lcMessages) {
    if (!messages.isAIMessage(message) && !messages.AIMessage.isInstance(message)) continue;
    const ai = message;
    if (!ai.tool_calls?.length) continue;
    const reasoning = ai.additional_kwargs?.reasoning_content;
    if (typeof reasoning === "string" && reasoning.trim()) {
      reasonings.push(reasoning);
    }
  }
  if (!reasonings.length) return apiMessages;
  let reasoningIndex = 0;
  return apiMessages.map((msg) => {
    if (msg.role !== "assistant") return msg;
    const toolCalls = msg.tool_calls;
    if (!Array.isArray(toolCalls) || toolCalls.length === 0) return msg;
    if (typeof msg.reasoning_content === "string" && msg.reasoning_content.trim()) {
      return msg;
    }
    const next = reasonings[reasoningIndex];
    if (next == null) return msg;
    reasoningIndex += 1;
    return { ...msg, reasoning_content: next };
  });
}
function createThinkingRoundtripFetch(baseFetch) {
  const fetchFn = baseFetch ?? globalThis.fetch.bind(globalThis);
  return async (input, init) => {
    const lcMessages = thinkingRoundtripAls.getStore();
    if (lcMessages && init?.body && typeof init.body === "string") {
      try {
        const body = JSON.parse(init.body);
        if (Array.isArray(body.messages)) {
          const patched = {
            ...body,
            messages: postInjectReasoningContent(lcMessages, body.messages)
          };
          return fetchFn(input, { ...init, body: JSON.stringify(patched) });
        }
      } catch {
      }
    }
    return fetchFn(input, init);
  };
}
class ThinkingRoundtripCallbackHandler extends base.BaseCallbackHandler {
  constructor() {
    super(...arguments);
    this.name = "thinking_roundtrip";
  }
  handleChatModelStart(_llm, messages2, _runId, _parentRunId, _extraParams, _tags, _metadata, _runName) {
    const flat = messages2.flat();
    if (flat.length) {
      thinkingRoundtripAls.enterWith(flat);
    }
  }
}
const thinkingRoundtripCallback = new ThinkingRoundtripCallbackHandler();
const MODEL_CAPABILITIES = [
  "chat",
  "reasoning",
  "vision",
  "longContext",
  "creative"
];
const LONG_CONTEXT_CHAR_THRESHOLD = 12e3;
const REASONING_RE = /推理|分析|证明|调试|排障|根因|算法|复杂度|对比方案|为什么|怎么实现|排查|定位问题/;
const CREATIVE_MEDIA_RE = /文生图|图生视频|图生成视频|文生视频|\bt2i\b|\bi2v\b|\bt2v\b/i;
const VISION_HINT_RE = /看图|识图|识别图片|OCR|截图|图片里|这张图/;
function queryNormalizeModelCapability(value) {
  if (typeof value !== "string") return void 0;
  const trimmed = value.trim();
  return MODEL_CAPABILITIES.includes(trimmed) ? trimmed : void 0;
}
function queryHasExplicitCreativeMediaIntent(text) {
  return CREATIVE_MEDIA_RE.test(text.trim());
}
function querySanitizeModelCapability(capability, userText) {
  if (!capability) return void 0;
  if (capability === "creative" && !queryHasExplicitCreativeMediaIntent(userText)) {
    return "chat";
  }
  return capability;
}
function queryInferModelCapability(text, _attachmentPaths = []) {
  if (queryHasExplicitCreativeMediaIntent(text)) {
    return "creative";
  }
  if (VISION_HINT_RE.test(text)) {
    return "vision";
  }
  if (text.length >= LONG_CONTEXT_CHAR_THRESHOLD) {
    return "longContext";
  }
  if (REASONING_RE.test(text)) {
    return "reasoning";
  }
  return "chat";
}
function queryResolveModelConnection(settings, opts = {}) {
  if (opts.role) {
    const byRole = queryModelConnection(settings, opts.role);
    if (!opts.capability) return byRole;
    if (byRole.apiKey.trim() && byRole.capabilities?.includes(opts.capability)) {
      return byRole;
    }
    const sameProvider = (settings.connections ?? []).find(
      (c) => c.provider === byRole.provider && c.capabilities?.includes(opts.capability) && c.apiKey.trim()
    );
    if (sameProvider) return sameProvider;
    if (opts.capability === "vision" || opts.capability === "creative") {
      const byCap = queryModelConnectionByCapability(settings, opts.capability);
      if (byCap.capabilities?.includes(opts.capability) && byCap.apiKey.trim()) {
        return byCap;
      }
    }
    return byRole;
  }
  if (opts.capability) {
    const byCap = queryModelConnectionByCapability(settings, opts.capability);
    if (byCap.capabilities?.includes(opts.capability) && byCap.apiKey.trim()) {
      return byCap;
    }
  }
  return queryModelConnection(settings, "default");
}
const PUBLISH_INTENT_RE = /发布到|发布一篇|发布一条|发布笔记|发布图文|发到|发一篇|发一条|发条|帮我发|发小红书|发抖音|上架|投稿|自动发布|创作并发布|写完.*发布|并发布|然后发布|再发布/;
const PUBLISH_NEGATE_RE = /不要发布|先不发布|暂不发布|别发布|不要发|先不发/;
const CONTENT_PIPELINE_RE = /热点|撰稿|配图|图文|创作|文案|写一篇|写文案|深入解析|小红书|抖音|选题|成稿/;
function queryHasExplicitPublishIntent(text) {
  const trimmed = text.trim();
  if (!trimmed) return false;
  if (PUBLISH_NEGATE_RE.test(trimmed)) return false;
  if (PUBLISH_INTENT_RE.test(trimmed)) return true;
  return /发布/.test(trimmed);
}
function queryParseSupervisorRoute(text, customRoleIds = /* @__PURE__ */ new Set()) {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  try {
    const parsed = JSON.parse(jsonMatch[0]);
    const nextRaw = typeof parsed.next === "string" ? parsed.next.trim() : "";
    const capability = queryNormalizeModelCapability(parsed.capability);
    if (customRoleIds.has(nextRaw)) {
      return capability ? { nextAgent: nextRaw, pipelineKind: "general", capability } : { nextAgent: nextRaw, pipelineKind: "general" };
    }
    let pipelineKind;
    if (nextRaw === "general" || nextRaw === "content" || nextRaw === "publish" || nextRaw === "video") {
      pipelineKind = nextRaw;
    }
    if (!pipelineKind) return null;
    const nextAgent = queryPipelineEntryRole(pipelineKind);
    return capability ? { nextAgent, pipelineKind, capability } : { nextAgent, pipelineKind };
  } catch {
    return null;
  }
}
function queryResolveSupervisorRoute(supervisorText, userText, customRoleIds = /* @__PURE__ */ new Set()) {
  const parsed = queryParseSupervisorRoute(supervisorText, customRoleIds);
  if (parsed) {
    const pipelineKind2 = querySanitizeSupervisorNext(parsed.pipelineKind, userText);
    return {
      nextAgent: queryPipelineEntryRole(pipelineKind2),
      pipelineKind: pipelineKind2,
      capability: querySanitizeModelCapability(parsed.capability, userText)
    };
  }
  const inferred = queryInferSupervisorNext(supervisorText, userText);
  const pipelineKind = querySanitizeSupervisorNext(inferred, userText);
  return {
    nextAgent: queryPipelineEntryRole(pipelineKind),
    pipelineKind
  };
}
function queryInferSupervisorNext(supervisorText, userText) {
  const blob = supervisorText + userText;
  if (/剧本|分镜|成片|生成视频|一句话.*视频|短剧|口播视频/.test(blob)) {
    return "video";
  }
  if (queryHasExplicitPublishIntent(userText)) {
    return "publish";
  }
  if (CONTENT_PIPELINE_RE.test(userText) || CONTENT_PIPELINE_RE.test(supervisorText)) {
    return "content";
  }
  return "general";
}
function queryIsRemotionTemplatePropsOnlyTask(userText) {
  const text = userText.trim();
  if (!text) return false;
  if (/remotion_render|generate_script|generate_storyboard|一句话成片|生成视频成片/.test(
    text
  )) {
    return false;
  }
  return /compositionId/.test(text) && /符合 schema 的 JSON|只输出一个[\s\S]{0,24}JSON/.test(text);
}
function querySanitizeSupervisorNext(next, userText) {
  if (next === "video" && queryIsRemotionTemplatePropsOnlyTask(userText)) {
    return "general";
  }
  if (next !== "publish") return next;
  if (queryHasExplicitPublishIntent(userText)) return "publish";
  if (CONTENT_PIPELINE_RE.test(userText)) return "content";
  return "general";
}
function queryPipelineEntryRole(next) {
  if (next === "publish" || next === "content") return "researcher";
  if (next === "video") return "scriptwriter";
  return "general";
}
function queryChatModelConfig(settings, purpose, capability) {
  const connection = queryResolveModelConnection(settings, {
    role: purpose,
    capability
  });
  const provider = queryProviderOption(connection.provider, settings.customProviders ?? []);
  if (!connection.apiKey) {
    throw new Error(`未配置 ${provider.apiKeyLabel}（连接：${connection.label}），请先在设置中填写`);
  }
  const modelKwargs = queryThinkingModelKwargs(
    settings,
    connection.model,
    connection.provider
  );
  return {
    apiKey: connection.apiKey,
    model: connection.model,
    configuration: {
      baseURL: connection.baseUrl || provider.defaultBaseUrl
    },
    streaming: true,
    temperature: 0.7,
    ...modelKwargs ? { modelKwargs } : {}
  };
}
function createChatModel(settings, purpose, capability) {
  const config = queryChatModelConfig(settings, purpose, capability) ?? {};
  const prevFetch = config.configuration?.fetch;
  return new openai.ChatOpenAI({
    ...config,
    callbacks: [thinkingRoundtripCallback],
    configuration: {
      ...config.configuration,
      fetch: createThinkingRoundtripFetch(prevFetch)
    }
  });
}
function createCapabilityRoutedModel(settings, role, queryCapability) {
  return () => {
    const raw = queryCapability();
    const capability = raw === "chat" || raw === "reasoning" || raw === "vision" || raw === "longContext" || raw === "creative" ? raw : void 0;
    return createChatModel(settings, role, capability);
  };
}
function emitAgentEvent$2(event) {
  const win = getMainWindow();
  if (win && !win.isDestroyed()) {
    win.webContents.send("event:agent", event);
  }
}
function queryReasoningDelta(fields) {
  const message = fields?.chunk?.message;
  const reasoning = message?.additional_kwargs?.reasoning_content;
  return typeof reasoning === "string" ? reasoning : "";
}
function queryReasoningFromLlmResult(output) {
  for (const generationGroup of output.generations) {
    for (const generation of generationGroup) {
      const message = generation.message;
      const reasoning = message?.additional_kwargs?.reasoning_content;
      if (typeof reasoning === "string" && reasoning.trim()) {
        return reasoning;
      }
    }
  }
  return "";
}
function createSessionStreamHandler(sessionId) {
  let streamedReasoningLen = 0;
  let reasoningStarted = false;
  const postReasoningStart = () => {
    if (reasoningStarted) {
      postThinkingReasoningStart(sessionId);
      return;
    }
    reasoningStarted = true;
    postThinkingReasoningStart(sessionId);
  };
  const postReasoningEnd = () => {
    if (!reasoningStarted) return;
    reasoningStarted = false;
    streamedReasoningLen = 0;
    postThinkingReasoningComplete(sessionId);
  };
  return base.BaseCallbackHandler.fromMethods({
    handleLLMNewToken(token, _idx, _runId, _parentRunId, _tags, fields) {
      const reasoningDelta = queryReasoningDelta(fields);
      if (reasoningDelta) {
        postReasoningStart();
        streamedReasoningLen += reasoningDelta.length;
        emitAgentEvent$2({ type: "thinking_delta", sessionId, delta: reasoningDelta });
        return;
      }
      if (reasoningStarted && token) {
        postThinkingReasoningStart(sessionId);
      }
    },
    handleLLMEnd(output) {
      const fullReasoning = queryReasoningFromLlmResult(output);
      if (fullReasoning) {
        if (!reasoningStarted) {
          postReasoningStart();
          emitAgentEvent$2({ type: "thinking_delta", sessionId, delta: fullReasoning });
          streamedReasoningLen = fullReasoning.length;
        } else if (fullReasoning.length > streamedReasoningLen) {
          const tail = fullReasoning.slice(streamedReasoningLen);
          if (tail.trim()) {
            emitAgentEvent$2({ type: "thinking_delta", sessionId, delta: tail });
          }
          streamedReasoningLen = fullReasoning.length;
        }
      }
      postReasoningEnd();
    },
    /** 流失败时对称收尾，避免 gate 卡在 reasoning=true */
    handleLLMError() {
      postReasoningEnd();
    }
  });
}
const TOKEN_PER_EN_CHAR = 0.3;
const TOKEN_PER_ZH_CHAR = 0.6;
const CJK_CHAR_RE = /[\u3400-\u9FFF\uF900-\uFAFF]/;
function emitAgentEvent$1(event) {
  const win = getMainWindow();
  if (win && !win.isDestroyed()) {
    win.webContents.send("event:agent", event);
  }
}
function queryEstimateTokensFromText(text) {
  if (!text) return 0;
  let tokens = 0;
  for (const char of text) {
    tokens += CJK_CHAR_RE.test(char) ? TOKEN_PER_ZH_CHAR : TOKEN_PER_EN_CHAR;
  }
  return tokens;
}
function queryTextFromMessageContent(content) {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) {
    if (content == null) return "";
    try {
      return JSON.stringify(content);
    } catch {
      return String(content);
    }
  }
  const parts = [];
  for (const part of content) {
    if (typeof part === "string") {
      parts.push(part);
      continue;
    }
    if (!part || typeof part !== "object") continue;
    const record = part;
    if (typeof record.text === "string") {
      parts.push(record.text);
    }
  }
  return parts.join("");
}
function queryTextFromBaseMessage(message) {
  const parts = [queryTextFromMessageContent(message.content)];
  if (messages.isAIMessage(message) || messages.AIMessage.isInstance(message)) {
    const toolCalls = message.tool_calls;
    if (toolCalls?.length) {
      try {
        parts.push(JSON.stringify(toolCalls));
      } catch {
      }
    }
    const reasoning = message.additional_kwargs?.reasoning_content;
    if (typeof reasoning === "string" && reasoning) {
      parts.push(reasoning);
    }
  }
  return parts.join("");
}
function queryTextFromLlmResult(result) {
  const parts = [];
  for (const generationGroup of result.generations) {
    for (const generation of generationGroup) {
      const message = generation.message;
      if (message && typeof message === "object") {
        parts.push(queryTextFromBaseMessage(message));
        continue;
      }
      if (typeof generation.text === "string" && generation.text) {
        parts.push(generation.text);
      }
    }
  }
  return parts.join("");
}
function queryTokensFromUsageRecord(usage) {
  if (!usage || typeof usage !== "object") return 0;
  const record = usage;
  if (typeof record.totalTokens === "number" && record.totalTokens > 0) {
    return record.totalTokens;
  }
  if (typeof record.total_tokens === "number" && record.total_tokens > 0) {
    return record.total_tokens;
  }
  const prompt = record.promptTokens ?? record.prompt_tokens ?? record.input_tokens ?? 0;
  const completion = record.completionTokens ?? record.completion_tokens ?? record.output_tokens ?? 0;
  const sum = prompt + completion;
  return sum > 0 ? sum : 0;
}
function queryTokensFromUsageMetadata(usage) {
  if (!usage) return 0;
  return queryTokensFromUsageRecord(usage);
}
function queryTokensFromLlmResult(result) {
  const llmOutput = result.llmOutput;
  if (llmOutput) {
    const fromOutput = queryTokensFromUsageRecord(llmOutput.tokenUsage) || queryTokensFromUsageRecord(llmOutput.usage);
    if (fromOutput > 0) return fromOutput;
  }
  let total = 0;
  for (const generationGroup of result.generations) {
    for (const generation of generationGroup) {
      const message = generation.message;
      if (message && typeof message === "object" && "usage_metadata" in message) {
        total += queryTokensFromUsageMetadata(
          message.usage_metadata
        );
      }
      const responseMetadata = message && typeof message === "object" && "response_metadata" in message ? message.response_metadata : void 0;
      if (responseMetadata) {
        total += queryTokensFromUsageRecord(responseMetadata.tokenUsage) || queryTokensFromUsageRecord(responseMetadata.usage);
      }
    }
  }
  return total;
}
function postSessionTokenDelta(sessionId, delta) {
  if (!Number.isFinite(delta) || delta <= 0) return;
  const session = querySession(sessionId);
  if (!session) return;
  session.tokenUsed += Math.round(delta);
  session.updatedAt = Date.now();
  postSession(session);
  emitAgentEvent$1({
    type: "token_update",
    sessionId,
    tokenUsed: session.tokenUsed,
    delta: Math.round(delta)
  });
}
function createSessionTokenUsageHandler(sessionId) {
  const promptTextByRunId = /* @__PURE__ */ new Map();
  return base.BaseCallbackHandler.fromMethods({
    handleLLMStart(_llm, prompts, runId) {
      promptTextByRunId.set(runId, prompts.join(""));
    },
    handleChatModelStart(_llm, messages2, runId) {
      const text = messages2.flat().map((message) => queryTextFromBaseMessage(message)).join("");
      promptTextByRunId.set(runId, text);
    },
    handleLLMEnd(output, runId) {
      const fromUsage = queryTokensFromLlmResult(output);
      if (fromUsage > 0) {
        promptTextByRunId.delete(runId);
        postSessionTokenDelta(sessionId, fromUsage);
        return;
      }
      const promptText = promptTextByRunId.get(runId) ?? "";
      promptTextByRunId.delete(runId);
      const completionText = queryTextFromLlmResult(output);
      const estimated = queryEstimateTokensFromText(promptText + completionText);
      postSessionTokenDelta(sessionId, estimated);
    },
    handleLLMError(_error, runId) {
      promptTextByRunId.delete(runId);
    }
  });
}
function withSessionTokenUsage(model, sessionId) {
  return model.withConfig({
    callbacks: [
      thinkingRoundtripCallback,
      createSessionTokenUsageHandler(sessionId),
      createSessionStreamHandler(sessionId)
    ]
  });
}
const TOOL_RESULT_MAX_CHARS = 12e3;
const HISTORY_MAX_CHARS = 24e3;
function compactToolResult(content, maxChars = TOOL_RESULT_MAX_CHARS) {
  if (content.length <= maxChars) return content;
  const marker = `

...[工具结果已截断，原始长度: ${content.length} 字符]...

`;
  if (maxChars <= marker.length) {
    return marker.slice(0, maxChars);
  }
  const availableChars = maxChars - marker.length;
  const headChars = Math.ceil(availableChars * 0.75);
  const tailChars = availableChars - headChars;
  return content.slice(0, headChars) + marker + content.slice(-tailChars);
}
function queryLatestHumanMessage(messages$1) {
  for (let index2 = messages$1.length - 1; index2 >= 0; index2 -= 1) {
    const message = messages$1[index2];
    if (messages.HumanMessage.isInstance(message) || message.getType?.() === "human") {
      return message;
    }
  }
  return void 0;
}
function sanitizeMessagesForModel(messages$1) {
  const out = [];
  let index2 = 0;
  while (index2 < messages$1.length) {
    const message = messages$1[index2];
    if (messages.isAIMessage(message) || messages.AIMessage.isInstance(message)) {
      const ai = message;
      const toolCalls = (ai.tool_calls ?? []).filter((tc) => Boolean(tc.id));
      if (!toolCalls.length) {
        out.push(message);
        index2 += 1;
        continue;
      }
      const neededIds = toolCalls.map((tc) => String(tc.id));
      const neededNameById = new Map(
        toolCalls.map((tc) => [String(tc.id), String(tc.name || "tool")])
      );
      const collected = /* @__PURE__ */ new Map();
      let cursor = index2 + 1;
      while (cursor < messages$1.length && messages.ToolMessage.isInstance(messages$1[cursor])) {
        const toolMsg = messages$1[cursor];
        const callId = String(toolMsg.tool_call_id ?? "");
        if (neededNameById.has(callId) && !collected.has(callId)) {
          collected.set(callId, toolMsg);
        }
        cursor += 1;
      }
      if (collected.size < neededIds.length) {
        let lookAhead = cursor;
        while (lookAhead < messages$1.length && collected.size < neededIds.length) {
          const candidate = messages$1[lookAhead];
          if ((messages.isAIMessage(candidate) || messages.AIMessage.isInstance(candidate)) && (candidate.tool_calls?.length ?? 0) > 0) {
            break;
          }
          if (messages.ToolMessage.isInstance(candidate)) {
            const toolMsg = candidate;
            const callId = String(toolMsg.tool_call_id ?? "");
            if (neededNameById.has(callId) && !collected.has(callId)) {
              collected.set(callId, toolMsg);
            }
          }
          lookAhead += 1;
        }
      }
      out.push(message);
      for (const callId of neededIds) {
        const existing = collected.get(callId);
        if (existing) {
          out.push(existing);
          continue;
        }
        out.push(
          new messages.ToolMessage({
            content: "工具调用未完成或已中断（系统已自动跳过）",
            tool_call_id: callId,
            name: neededNameById.get(callId) || "tool"
          })
        );
      }
      index2 = cursor;
      continue;
    }
    if (messages.ToolMessage.isInstance(message)) {
      index2 += 1;
      continue;
    }
    out.push(message);
    index2 += 1;
  }
  return out;
}
function trimMessagesToCharBudget(messages$1, maxChars = HISTORY_MAX_CHARS) {
  const selected = [];
  let usedChars = 0;
  for (let index2 = messages$1.length - 1; index2 >= 0; index2 -= 1) {
    const message = messages$1[index2];
    const chars = queryMessageCharLength(message);
    if (selected.length > 0 && usedChars + chars > maxChars) break;
    selected.unshift(message);
    usedChars += chars;
  }
  while (selected.length > 0 && messages.ToolMessage.isInstance(selected[0])) {
    selected.shift();
  }
  return sanitizeMessagesForModel(selected);
}
function queryMessageCharLength(message) {
  if (typeof message.content === "string") return message.content.length;
  try {
    return JSON.stringify(message.content).length;
  } catch {
    return String(message.content ?? "").length;
  }
}
class AgentUserCancelledError extends Error {
  constructor(message = "用户已取消操作") {
    super(message);
    this.name = "AgentUserCancelledError";
  }
}
function queryIsAgentUserCancelledError(err) {
  return err instanceof AgentUserCancelledError;
}
function queryIsAbortError(err) {
  if (!err || typeof err !== "object") return false;
  const e = err;
  if (e.name === "AbortError") return true;
  const msg = String(e.message ?? "");
  return /operation was aborted/i.test(msg) || /The operation was aborted/i.test(msg) || /signal is aborted/i.test(msg);
}
function normalizeContinuePayload(payload) {
  if (typeof payload === "string") {
    return { userInput: payload };
  }
  return payload ?? {};
}
function resolveUserContinue(payload, choices) {
  const userInput = payload.userInput?.trim() || void 0;
  if (payload.choiceId && choices?.length) {
    const match = choices.find((c) => c.id === payload.choiceId);
    if (match) {
      return { userInput, choiceId: match.id, choiceLabel: match.label };
    }
  }
  if (userInput && choices?.length) {
    const fromText = resolveChoiceFromText(userInput, choices);
    if (fromText) {
      return { userInput, choiceId: fromText.id, choiceLabel: fromText.label };
    }
  }
  if (payload.choiceId) {
    return { userInput, choiceId: payload.choiceId };
  }
  return { userInput };
}
function formatUserContinueMessage(result) {
  const { userInput, choiceLabel } = result;
  if (!choiceLabel && !userInput) return void 0;
  const parts = [];
  if (choiceLabel) parts.push(`【已选：${choiceLabel}】`);
  if (userInput) parts.push(userInput);
  return parts.join("") || void 0;
}
function resolveChoiceFromText(text, choices) {
  const trimmed = text.trim();
  if (!trimmed) return null;
  for (const choice of choices) {
    if (trimmed === choice.id || trimmed === choice.label) return choice;
  }
  const index2 = parseChoiceIndex(trimmed, choices.length);
  if (index2 != null) return choices[index2] ?? null;
  const labelMatches = choices.filter(
    (c) => trimmed.includes(c.label) || c.label.includes(trimmed)
  );
  if (labelMatches.length === 1) return labelMatches[0] ?? null;
  const idMatches = choices.filter(
    (c) => trimmed.toLowerCase().includes(c.id.toLowerCase())
  );
  if (idMatches.length === 1) return idMatches[0] ?? null;
  return null;
}
function parseChoiceIndex(text, count) {
  const numMatch = text.match(/(?:方案|选|第)?\s*(\d+)\s*(?:个|项|号)?/i);
  if (numMatch) {
    const n = parseInt(numMatch[1], 10);
    if (n >= 1 && n <= count) return n - 1;
  }
  const letterMatch = text.match(/(?:方案|选)?\s*([A-Za-z])\b/i);
  if (letterMatch) {
    const idx = letterMatch[1].toUpperCase().charCodeAt(0) - "A".charCodeAt(0);
    if (idx >= 0 && idx < count) return idx;
  }
  const chineseNums = {
    一: 1,
    二: 2,
    三: 3,
    四: 4,
    五: 5
  };
  const cnMatch = text.match(/第([一二三四五])个/);
  if (cnMatch) {
    const n = chineseNums[cnMatch[1]];
    if (n && n >= 1 && n <= count) return n - 1;
  }
  return null;
}
function queryIsUserCancelIntent(result) {
  if (result.choiceId === "cancel") return true;
  const text = result.userInput?.trim() ?? "";
  if (!text) return false;
  return /取消|不要|算了|停止|中止/.test(text);
}
function queryFormatAgentErrorMessage(message, ctx = {}, settings) {
  const base2 = message.trim() || "执行失败";
  if (/（(?:工具：.+，)?角色：.+，Agent：.+/.test(base2)) return base2;
  const toolName = ctx.toolName?.trim() || "";
  const roleName = ctx.roleName?.trim() || (ctx.roleId?.trim() ? queryAgentRoleLabel(ctx.roleId.trim(), settings) : "");
  const agentName = ctx.agentName?.trim() || "";
  const connectionBits = [ctx.connectionLabel, ctx.provider, ctx.model].map((x) => x?.trim()).filter(Boolean);
  const connectionText = connectionBits.length ? connectionBits.join(" · ") : "";
  const parts = [];
  if (toolName) parts.push(`工具：${toolName}`);
  if (roleName) parts.push(`角色：${roleName}`);
  if (agentName) parts.push(`Agent：${agentName}`);
  if (connectionText) parts.push(`连接：${connectionText}`);
  if (!parts.length) return base2;
  return `${base2}（${parts.join("，")}）`;
}
function queryLastToolNameFromMessages(messages$1) {
  for (let i = messages$1.length - 1; i >= 0; i--) {
    const msg = messages$1[i];
    if (messages.ToolMessage.isInstance(msg)) {
      const name = String(msg.name ?? "").trim();
      if (name) return name;
    }
    if (messages.isAIMessage(msg) || messages.AIMessage.isInstance(msg)) {
      const calls = msg.tool_calls;
      if (calls?.length) {
        const name = String(calls[calls.length - 1]?.name ?? "").trim();
        if (name) return name;
      }
    }
  }
  return void 0;
}
const PUBLISH_TOOLS_INLINE_CONFIRM = /* @__PURE__ */ new Set(["xhs_publish_note", "douyin_publish_note"]);
function adaptAgentTools(agentTools, options) {
  const { ctx, gateDangerous = true } = options;
  return agentTools.map((agentTool) => {
    const schema = agentTool.parameters ?? {
      type: "object",
      properties: {}
    };
    return tools.tool(
      async (rawArgs) => {
        const args = rawArgs && typeof rawArgs === "object" ? rawArgs : {};
        if (gateDangerous && shouldGatePermission(agentTool.permission, ctx.fullAccess, agentTool.name)) {
          const confirm = await ctx.emitAwaitUser(`即将执行敏感工具「${agentTool.name}」`, [
            { id: "confirm", label: "确认执行" },
            { id: "cancel", label: "取消" }
          ]);
          if (queryIsUserCancelIntent(confirm)) {
            return "用户取消执行";
          }
        }
        try {
          const result = await agentTool.execute(args, ctx);
          return compactToolResult(result);
        } catch (err) {
          if (isGraphInterrupt(err)) throw err;
          if (queryIsAgentUserCancelledError(err)) throw err;
          const raw = err instanceof Error ? err.message : String(err);
          const settings = querySettings();
          return queryFormatAgentErrorMessage(
            `工具执行失败: ${raw}`,
            {
              toolName: agentTool.name,
              roleId: ctx.activeRole,
              agentName: ctx.agentName
            },
            settings
          );
        }
      },
      {
        name: agentTool.name,
        description: agentTool.description,
        schema
      }
    );
  });
}
function shouldGatePermission(permission, fullAccess, toolName) {
  if (fullAccess) return false;
  if (PUBLISH_TOOLS_INLINE_CONFIRM.has(toolName)) return false;
  return permission === "dangerous";
}
function isGraphInterrupt(err) {
  if (!err || typeof err !== "object") return false;
  const e = err;
  return e.name === "GraphInterrupt" || e.constructor?.name === "GraphInterrupt";
}
const AgentGraphAnnotation = langgraph.Annotation.Root({
  messages: langgraph.Annotation({
    reducer: langgraph.messagesStateReducer,
    default: () => []
  }),
  sessionId: langgraph.Annotation,
  activeAgent: langgraph.Annotation({
    reducer: (_prev, next) => next,
    default: () => "supervisor"
  }),
  /** 下一跳路由目标（supervisor 写入） */
  nextAgent: langgraph.Annotation({
    reducer: (_prev, next) => next,
    default: () => "general"
  }),
  /**
   * 管线种类（supervisor 写入）。
   * content = 调研→撰文后结束；publish = 调研→撰文→发布。
   */
  pipelineKind: langgraph.Annotation({
    reducer: (_prev, next) => next,
    default: () => "general"
  }),
  /**
   * 当前任务模型能力；空字符串表示未显式指定（走 roleModelMap）。
   * Supervisor / 规则推断 / switch_model 写入。
   */
  activeCapability: langgraph.Annotation({
    reducer: (_prev, next) => next,
    default: () => ""
  }),
  attachmentPaths: langgraph.Annotation({
    reducer: (_prev, next) => next,
    default: () => []
  }),
  tasks: langgraph.Annotation({
    reducer: (_prev, next) => next,
    default: () => []
  })
});
const WorkflowGraphAnnotation = langgraph.Annotation.Root({
  messages: langgraph.Annotation({
    reducer: langgraph.messagesStateReducer,
    default: () => []
  }),
  sessionId: langgraph.Annotation,
  runId: langgraph.Annotation,
  workflowId: langgraph.Annotation,
  context: langgraph.Annotation({
    reducer: (_prev, next) => next,
    default: () => ({})
  }),
  /** 当前顶层节点下标 */
  nodeIndex: langgraph.Annotation({
    reducer: (_prev, next) => next,
    default: () => 0
  }),
  /** 任务状态：nodeId → status */
  statusMap: langgraph.Annotation({
    reducer: (_prev, next) => next,
    default: () => ({})
  })
});
const CATEGORIES$1 = /* @__PURE__ */ new Set([
  "song",
  "news",
  "product",
  "education",
  "other"
]);
const STATUSES = /* @__PURE__ */ new Set([
  "draft",
  "rendering",
  "ready",
  "failed"
]);
const PREVIEW_KINDS = /* @__PURE__ */ new Set([
  "hot-news-wide",
  "hot-news-vertical"
]);
function queryIsRemotionVideoTemplateSkillId(id) {
  return id.startsWith("remotion-template-");
}
function queryRemotionVideoTemplateFromSkillMd(skillId, raw, updatedAt, hasTemplateCode = false) {
  if (!queryIsRemotionVideoTemplateSkillId(skillId) && !/remotionVideoTemplate:\s*true/.test(raw)) {
    return null;
  }
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return null;
  const frontmatter = match[1];
  const fields = queryParseFrontmatterScalars(frontmatter);
  if (fields.remotionVideoTemplate === "false") return null;
  if (fields.remotionVideoTemplate !== "true" && !queryIsRemotionVideoTemplateSkillId(skillId)) {
    return null;
  }
  const title = (fields.name || skillId).trim();
  const description = (fields.description || "").trim();
  const categoryRaw = (fields.category || "other").trim();
  const category = CATEGORIES$1.has(categoryRaw) ? categoryRaw : "other";
  const statusRaw = (fields.status || "ready").trim();
  const status = STATUSES.has(statusRaw) ? statusRaw : "ready";
  const accent = (fields.accent || "#5b8def").trim();
  const durationSec = Math.max(1, Number.parseInt(fields.durationSec || "15", 10) || 15);
  const compositionId = (fields.compositionId || "Main").trim() || "Main";
  const previewRaw = (fields.previewKind || "").trim();
  const previewKind = PREVIEW_KINDS.has(previewRaw) ? previewRaw : void 0;
  const templateDir = (fields.templateDir || "template").trim() || "template";
  return {
    id: skillId,
    title,
    description,
    category,
    status,
    accent,
    durationSec,
    compositionId,
    updatedAt,
    templateDir,
    hasTemplateCode,
    previewKind
  };
}
function queryParseFrontmatterScalars(frontmatter) {
  const fields = {};
  const descBlock = frontmatter.match(
    /description:\s*(?:>-|>\||>)\s*\r?\n([\s\S]*?)(?:\r?\n[a-zA-Z_]|$)/
  );
  if (descBlock) {
    fields.description = descBlock[1].split("\n").map((l) => l.trim()).filter(Boolean).join(" ");
  }
  for (const line of frontmatter.split("\n")) {
    const m = line.match(/^([a-zA-Z][a-zA-Z0-9_]*)\s*:\s*(.+)$/);
    if (!m) continue;
    const key = m[1];
    let value = m[2].trim();
    if (value.startsWith(">") && key === "description") continue;
    if (value.startsWith('"') && value.endsWith('"') || value.startsWith("'") && value.endsWith("'")) {
      value = value.slice(1, -1);
    }
    if (key === "description" && fields.description) continue;
    fields[key] = value;
  }
  return fields;
}
function getSkillStatesPath() {
  return path.join(getDataRoot(), "skill-states.json");
}
function getSkillsDir() {
  return querySkillsDir();
}
function getSkillTemplatesDir() {
  return path.join(queryBundledResourcesRoot(), "skills");
}
function queryIsBuiltinSkillId(id) {
  return id.startsWith("react-agent-") || id.startsWith("remotion-");
}
function isBuiltinSkillId(id) {
  return queryIsBuiltinSkillId(id);
}
const DEFAULT_ENABLED_REMOTION_SKILL_IDS = [
  "react-agent-remotion",
  "remotion-best-practices",
  "remotion-create",
  "remotion-markup",
  "remotion-render",
  "remotion-captions"
];
function queryBundledRemotionTemplateSkillIds() {
  const templatesDir = getSkillTemplatesDir();
  if (!fs.existsSync(templatesDir)) return [];
  return fs.readdirSync(templatesDir, { withFileTypes: true }).filter((d) => d.isDirectory() && d.name.startsWith("remotion-template-")).map((d) => d.name);
}
function postEnsureRemotionSkillsEnabled() {
  const templatesDir = getSkillTemplatesDir();
  const skillsDir = getSkillsDir();
  fs.mkdirSync(skillsDir, { recursive: true });
  const ensureIds = [
    ...DEFAULT_ENABLED_REMOTION_SKILL_IDS,
    ...queryBundledRemotionTemplateSkillIds()
  ];
  for (const id of ensureIds) {
    const destDir = path.join(skillsDir, id);
    const srcDir = path.join(templatesDir, id);
    if (!fs.existsSync(path.join(destDir, "SKILL.md")) && fs.existsSync(path.join(srcDir, "SKILL.md"))) {
      try {
        fs.cpSync(srcDir, destDir, { recursive: true });
      } catch (err) {
        console.warn(`[skills] 安装 Remotion 技能失败：${id}`, err);
      }
    }
  }
  const states = readSkillStates();
  let changed = false;
  for (const id of ensureIds) {
    if (!fs.existsSync(path.join(skillsDir, id, "SKILL.md"))) continue;
    if (states[id] === void 0) {
      states[id] = { enabled: true };
      changed = true;
    }
  }
  if (changed) writeSkillStates(states);
}
function validateSkillId(id) {
  if (!/^[a-z0-9-]{1,64}$/.test(id)) {
    throw new Error("技能 id 仅允许小写字母、数字和连字符，长度 1～64");
  }
  if (id.startsWith(".") || id === "_templates") {
    throw new Error("技能 id 使用了保留名称");
  }
}
function parseSkillMarkdown(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) {
    return { name: "", description: "", body: raw };
  }
  const frontmatter = match[1];
  const body = match[2].trim();
  let name = "";
  let description = "";
  const descBlock = frontmatter.match(
    /description:\s*(?:>-|>\||>)\s*\r?\n([\s\S]*?)(?:\r?\n[a-zA-Z_]|$)/
  );
  if (descBlock) {
    description = descBlock[1].split("\n").map((l) => l.trim()).filter(Boolean).join(" ");
  }
  for (const line of frontmatter.split("\n")) {
    const nameMatch = line.match(/^name:\s*(.+)$/);
    if (nameMatch) {
      name = nameMatch[1].trim();
      continue;
    }
    if (!description) {
      const descMatch = line.match(/^description:\s*(.+)$/);
      if (descMatch && !descMatch[1].startsWith(">")) {
        description = descMatch[1].trim();
      }
    }
  }
  return { name, description, body };
}
function buildSkillMarkdown(name, description, body) {
  const descLines = description.trim().split(/\s+/).reduce((lines, word) => {
    const last = lines[lines.length - 1] ?? "";
    if (!last || last.length + word.length + 1 > 72) {
      lines.push(word);
    } else {
      lines[lines.length - 1] = `${last} ${word}`;
    }
    return lines;
  }, []).map((l) => `  ${l}`).join("\n");
  return `---
name: ${name}
description: >-
${descLines}
---

${body.trim()}
`;
}
function readSkillStates() {
  const path2 = getSkillStatesPath();
  if (!fs.existsSync(path2)) return {};
  try {
    return JSON.parse(fs.readFileSync(path2, "utf-8"));
  } catch {
    return {};
  }
}
function writeSkillStates(states) {
  fs.writeFileSync(getSkillStatesPath(), JSON.stringify(states, null, 2), "utf-8");
}
function toProjectSkill(id, name, description, hasExamples, updatedAt, enabled) {
  return {
    id,
    name,
    description,
    enabled,
    hasExamples,
    updatedAt,
    isBuiltin: isBuiltinSkillId(id)
  };
}
function queryProjectSkills() {
  const dir = getSkillsDir();
  if (!fs.existsSync(dir)) return [];
  const states = readSkillStates();
  const entries = fs.readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory());
  const skills = [];
  for (const entry of entries) {
    const skillPath = path.join(dir, entry.name, "SKILL.md");
    if (!fs.existsSync(skillPath)) continue;
    const raw = fs.readFileSync(skillPath, "utf-8");
    const { name, description } = parseSkillMarkdown(raw);
    const examplesPath = path.join(dir, entry.name, "examples.md");
    const stat = fs.statSync(skillPath);
    skills.push(
      toProjectSkill(
        entry.name,
        name || entry.name,
        description,
        fs.existsSync(examplesPath),
        stat.mtimeMs,
        // 内置始终视为已注入；自定义缺省不全局注入
        queryIsBuiltinSkillId(entry.name) ? true : states[entry.name]?.enabled ?? false
      )
    );
  }
  return skills.sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
}
function queryProjectSkillDetail(id) {
  const dir = path.join(getSkillsDir(), id);
  const skillPath = path.join(dir, "SKILL.md");
  if (!fs.existsSync(skillPath)) return null;
  const raw = fs.readFileSync(skillPath, "utf-8");
  const { name, description, body } = parseSkillMarkdown(raw);
  const examplesPath = path.join(dir, "examples.md");
  const states = readSkillStates();
  return {
    ...toProjectSkill(
      id,
      name || id,
      description,
      fs.existsSync(examplesPath),
      fs.statSync(skillPath).mtimeMs,
      queryIsBuiltinSkillId(id) ? true : states[id]?.enabled ?? false
    ),
    content: body,
    examplesContent: fs.existsSync(examplesPath) ? fs.readFileSync(examplesPath, "utf-8").trim() : void 0,
    /** 可写技能目录绝对路径，详情弹窗用于在文件管理器中打开 */
    dirPath: dir
  };
}
function postProjectSkill(input) {
  validateSkillId(input.id);
  if (!input.name.trim()) throw new Error("技能名称不能为空");
  if (!input.description.trim()) throw new Error("技能描述不能为空");
  if (!input.content.trim()) throw new Error("技能正文不能为空");
  const skillDir = path.join(getSkillsDir(), input.id);
  const skillPath = path.join(skillDir, "SKILL.md");
  const examplesPath = path.join(skillDir, "examples.md");
  try {
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(
      skillPath,
      buildSkillMarkdown(input.name.trim(), input.description.trim(), input.content),
      "utf-8"
    );
    const examples = input.examplesContent?.trim();
    if (examples) {
      fs.writeFileSync(examplesPath, `${examples}
`, "utf-8");
    } else if (fs.existsSync(examplesPath)) {
      fs.unlinkSync(examplesPath);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`写入技能失败（请确认 resources/skills 可写）：${msg}`);
  }
  const detail = queryProjectSkillDetail(input.id);
  if (!detail) throw new Error("技能保存后读取失败");
  if (!queryIsBuiltinSkillId(input.id)) {
    const states = readSkillStates();
    if (states[input.id] === void 0) {
      states[input.id] = { enabled: false };
      writeSkillStates(states);
    }
  }
  return detail;
}
function postDeleteProjectSkill(id) {
  validateSkillId(id);
  const skillDir = path.join(getSkillsDir(), id);
  if (!fs.existsSync(skillDir)) {
    throw new Error("技能不存在");
  }
  try {
    fs.rmSync(skillDir, { recursive: true, force: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`删除技能失败：${msg}`);
  }
  const states = readSkillStates();
  if (states[id]) {
    delete states[id];
    writeSkillStates(states);
  }
}
function querySkillTemplates() {
  const dir = getSkillTemplatesDir();
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory());
  const templates = [];
  for (const entry of entries) {
    const skillPath = path.join(dir, entry.name, "SKILL.md");
    if (!fs.existsSync(skillPath)) continue;
    const raw = fs.readFileSync(skillPath, "utf-8");
    const { name, description } = parseSkillMarkdown(raw);
    templates.push({
      id: entry.name,
      name: name || entry.name,
      description
    });
  }
  return templates.sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
}
function queryRemotionVideoTemplates() {
  const dir = getSkillTemplatesDir();
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory());
  const templates = [];
  for (const entry of entries) {
    const skillPath = path.join(dir, entry.name, "SKILL.md");
    if (!fs.existsSync(skillPath)) continue;
    let raw;
    let updatedAt = Date.now();
    try {
      raw = fs.readFileSync(skillPath, "utf-8");
      updatedAt = fs.statSync(skillPath).mtimeMs;
    } catch {
      continue;
    }
    const skillDir = path.join(dir, entry.name);
    const templateDirName = "template";
    const hasTemplateCode = fs.existsSync(path.join(skillDir, templateDirName, "manifest.json"));
    const parsed = queryRemotionVideoTemplateFromSkillMd(
      entry.name,
      raw,
      updatedAt,
      hasTemplateCode
    );
    if (parsed) templates.push(parsed);
  }
  return templates.sort((a, b) => b.updatedAt - a.updatedAt);
}
function postInstallSkillTemplate(templateId, targetId) {
  const templatesDir = getSkillTemplatesDir();
  const srcDir = path.join(templatesDir, templateId);
  if (!fs.existsSync(path.join(srcDir, "SKILL.md"))) {
    throw new Error("模板不存在");
  }
  const id = targetId?.trim() || templateId;
  validateSkillId(id);
  const destDir = path.join(getSkillsDir(), id);
  if (fs.existsSync(destDir)) {
    throw new Error(`技能 id「${id}」已存在，请更换目标 id`);
  }
  try {
    fs.cpSync(srcDir, destDir, { recursive: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`安装模板失败：${msg}`);
  }
  const detail = queryProjectSkillDetail(id);
  if (!detail) throw new Error("模板安装后读取失败");
  if (!queryIsBuiltinSkillId(id)) {
    const states = readSkillStates();
    if (states[id] === void 0) {
      states[id] = { enabled: false };
      writeSkillStates(states);
    }
  }
  return detail;
}
function postSkillStates(states) {
  const merged = { ...readSkillStates() };
  for (const [id, state] of Object.entries(states)) {
    if (queryIsBuiltinSkillId(id)) continue;
    merged[id] = state;
  }
  writeSkillStates(merged);
  return merged;
}
function querySelectedCustomSkillIdSet(ctx) {
  const ids = [...ctx.sessionSkillIds ?? [], ...ctx.roleSkillIds ?? []];
  return new Set(ids.map((id) => id.trim()).filter(Boolean));
}
function queryInjectableSkills(ctx = {}) {
  const selected = querySelectedCustomSkillIdSet(ctx);
  return queryProjectSkills().filter((skill) => {
    if (skill.isBuiltin) return true;
    return skill.enabled || selected.has(skill.id);
  });
}
function queryBuildSkillCatalogPrompt(skills, maxChars) {
  if (!skills.length) return "";
  const entries = skills.map(
    (skill) => `- \`${skill.id}\`：${skill.name}${skill.description ? ` — ${skill.description}` : ""}`
  );
  const included = [];
  let usedChars = 0;
  for (const entry of entries) {
    const separatorChars = included.length > 0 ? 1 : 0;
    if (usedChars + separatorChars + entry.length > maxChars) break;
    included.push(entry);
    usedChars += separatorChars + entry.length;
  }
  const catalog = included.join("\n");
  return included.length < entries.length ? `${catalog}${catalog ? "\n" : ""}...(技能目录已截断)` : catalog;
}
function queryInjectableSkillPrompt(maxChars = 12e3, ctx = {}) {
  return queryBuildSkillCatalogPrompt(queryInjectableSkills(ctx), maxChars);
}
function queryFormatSkillContent(detail, maxChars) {
  const sections = [
    `# 技能：${detail.name}`,
    detail.description ? `> ${detail.description}` : "",
    detail.content,
    detail.examplesContent ? `## 示例

${detail.examplesContent}` : ""
  ].filter(Boolean);
  const content = sections.join("\n\n");
  return content.length > maxChars ? `${content.slice(0, Math.max(0, maxChars))}

...(技能内容已截断)` : content;
}
function queryInjectableSkillContent(id, ctx = {}, maxChars = 12e3) {
  const skill = queryInjectableSkills(ctx).find((item) => item.id === id);
  if (!skill) return null;
  const detail = queryProjectSkillDetail(skill.id);
  if (!detail) return null;
  return queryFormatSkillContent(detail, maxChars);
}
const LANGUAGE_OUTPUT_CONSTRAINT = `## 输出语言（强制，不可违反）

你必须全程使用简体中文：
- 思考推理（reasoning / thinking / 内心分析）必须用简体中文书写，禁止用英文思考
- 对用户的正式回复、任务进度说明、方案解释必须用简体中文
- 代码标识符、API 名、文件路径、CSS 属性名、命令行、JSON 字段名可保留英文原文；其前后说明文字仍须中文
- 即使用户消息含英文技术词，或当前任务是写代码 / Remotion / CSS，思考与解释仍必须中文
- 禁止出现整段英文 reasoning；若发现自己在用英文思考，立即改用中文继续`;
const BASE_CAPABILITY = `你是跨平台桌面全能助手「灵犀」，可完成内容创作、多渠道发布、天气通知与视频生产。

当前核心能力：
- 小红书 / 抖音图文发布（渠道可开关「拟人操作」；关闭走 SDK 占位）
- 热点 / 天气等网络信息：优先 fetch_hot_topics（推荐 tophub 聚合，或 weibo/baidu；亦可 douyin/kuaishou/tencent）与 query_weather，失败再无头浏览器后台抓取
- 关键词网络搜索：优先 web_search（内部先 Bing，失败自动改百度），不要一上来就 browser 开搜索引擎；已有文章链接用 query_web_data
- 用户粘贴的网页链接（掘金/知乎/公众号/博客等）：用 query_web_data 拉取标题与正文后再总结或创作
- A 股行情：query_ashare_realtime_analysis（实时K线+综合分析+买卖信号，优先用）；query_ashare_kline（仅基础K线）
- AI 文生图：generate_image（万相原创图，非网图）
- 剧本→分镜→场景素材→成片（视频/图像/TTS 走可插拔 Provider）
- Remotion 程序化视频：remotion_init_project → 编写 Composition → remotion_studio 预览 → remotion_render（React 动效/字幕/图表）
- Remotion 技能模版出片：use_skill(remotion-template-*) → remotion_apply_template_skill（拷贝 template/ + 写入 props）→ remotion_studio → remotion_render
- 多通知渠道并行推送
- 定时任务 / 发布计划 / 用户规则：可用 query_scheduled_tasks、post_scheduled_task、query_publish_plans、post_publish_plan、query_agent_rules、post_agent_rule 创建与管理本地配置；新建定时任务默认未启用（enabled=false），需用户确认后再启用；新规则从下一轮对话起注入

注意：
- 所有输出（含思考推理与正式回复）必须使用简体中文；详见文末「输出语言」硬约束
- 拟人发布未登录时工具会暂停等待用户扫码
- 多方案选择：需确认模式下，存在 2+ 可行路径时必须先调用 present_plan_choices 列出方案并等待用户选择；完全访问模式、自动发布任务、自动流程执行时自行择优并连续执行，禁止调用 present_plan_choices 暂停等人（流程画布显式「等待确认」节点、未登录扫码、remotion_render 除外）
- remotion_render 会系统级暂停等待用户确认后才真正渲染；用户点「确认渲染」后工具在同一次调用内按当前 compositionId 与工程代码直接导出，禁止再改 Composition/Root 或换方案；用户点「取消」后不得再次调用 remotion_render 或要求用户重复确认
- 不要编造已发布 / 已成片 / 已生成图片成功；以工具返回为准

小红书风控与内容规范（拟人发布前必须遵守）：
- 行为：拟人模式下 xhs_publish_note 已内置随机延迟与频次限制
- 节奏：单账号日更≤6篇、周更≤30篇；深夜0:00-6:00不发布
- 内容：每篇笔记须差异化，禁止一套模板只换关键词`;
function queryFullAccessModeBlock(fullAccess) {
  if (fullAccess) {
    return [
      "## 执行模式：完全访问",
      "当前为完全访问：自动发布任务与流程按顺序连续执行，自行决策选题/方案，禁止调用 present_plan_choices 等待用户确认。",
      "仅当流程画布含「等待确认」节点、未登录需扫码、或 remotion_render 时才会暂停。"
    ].join("\n");
  }
  return [
    "## 执行模式：需确认",
    "存在多个可行路径时，必须先调用 present_plan_choices 列出 2~5 个清晰方案，不得擅自替用户决定；收到 selected.id 后只执行对应方案。"
  ].join("\n");
}
const ROLE_PROMPTS = {
  supervisor: `你是路由调度器。根据用户最新意图，只输出一个 JSON：{"next":"<目标>","capability":"<能力>"}。
可选 next：
- general：闲聊、问答、排障、天气/A股行情查询、单步工具、非完整管线
- content：需要调研→撰文的内容生产（用户只要创作/解析/成稿/选题，未明确要求发布）
- publish：用户明确要求发布到小红书/抖音等渠道时，才走调研→撰文→发布
- video：剧本/分镜/生成视频/一句话成片等视频生产管线

路由硬规则：
- 出现「创作内容」「深入解析」「只写/先写」「不要发布」等 → content（禁止 publish）
- 仅当用户明确说「发布/发一篇/发到小红书或抖音」等 → publish
- 「热点」「小红书」「抖音」「撰稿」「配图」本身不等于要发布，无发布动词时用 content
- Remotion 模版仅要求输出 props JSON / 热点文案调研（含 compositionId + 只输出 JSON）→ general（禁止 video；勿进剧本→成片管线）

可选 capability（按任务内容选型，供下游选用合适模型）：
- chat(普通对话)：普通对话、撰稿文案、工具编排（含「生成一张图」等单步工具）
- reasoning(深度分析)：深度分析、调试排障、复杂推理
- creative(文生图/图生成视频)：仅当用户明确要求文生图、图生成视频、图生视频、文生视频时选用对应媒体连接；普通创作/撰稿禁止选 creative
- vision(看图理解)：看图、识图、OCR、截图理解（仅当用户附带图片需理解时；文生图不要选 vision；图片可能已内嵌在用户消息中）
- longContext(长文本阅读)：超长文本阅读/摘要

不要调用工具，不要输出其它说明。`,
  general: `${BASE_CAPABILITY}

工作方式（ReAct）：
1. 先用 update_task_list 列出清晰的任务步骤（若任务多于一步）
2. 按需调用工具完成用户目标
3. 每完成一步更新任务清单状态
4. 不要建议用脚本直接改 DOM；所有交互都应通过工具完成
5. 通知类工具（notify_message）成功后立即结束；禁止对相同渠道/相同正文重复发送
   - 飞书可选 msgType：post 推送 Markdown 富文本；image 需 imageKey；share_chat 需 shareChatId
6. 天气用 query_weather；热点用 fetch_hot_topics（推荐 source：tophub 聚合全网，或 weibo/baidu；亦可 douyin/kuaishou/tencent）
7. 关键词搜网页/新闻背景：优先 web_search（内部 Bing→百度）；已有 http(s) 链接再 query_web_data；不要凭空编造检索结果
8. 用户粘贴 http(s) 链接并要求阅读/总结/基于该文创作时：必须先调用 query_web_data（传 url）；不要凭链接臆造正文；SPA 站可设 preferBrowser=true；需要页面图片/视频/音频时传 mediaTypes（如 ["video","audio"]），要落盘再设 downloadMedia=true（会按主题筛选，勿指望整页全下）；仅发布配图仍可用 fetch_web_images（务必传 topic）
9. A 股/股票行情、实时分析、买卖建议：必须调用 query_ashare_realtime_analysis（传 symbols，如 600519；range 默认 today）；仅要历史K线时用 query_ashare_kline
10. 用户要求「生成/画一张图」且不要网图时：必须调用 generate_image；禁止用 fetch_web_images；禁止未拿到工具成功结果就声称已生成
11. generate_image 成功后，回复中保留工具返回的本地 png 路径，便于界面预览
12. 汇总/发布前后的「配图预览」须写出本地绝对路径（或 Markdown 图片），禁止只写「图1」占位；表格推荐：| 预览 | 路径 | 说明 |，路径列填 fetch_web_images / generate_image 返回的绝对路径，便于界面内联查看
13. 用户消息中的 [本机识字] 段来自 macOS Vision 本地识别；请直接使用，无需 read_file 读图，也无需为此 switch_model 为 vision
14. 若任务类型中途明显变化（如从闲聊转为深度推理/文生图或图生成视频/看图），可调用 switch_model 切换模型能力；普通撰稿保持 chat，不要切 creative
15. 用户要用 Remotion / React 代码做动效、字幕、数据可视化视频时：先 use_skill 加载 react-agent-remotion 或 remotion-best-practices；若选用内置成片模版（remotion-template-*）则调用 remotion_apply_template_skill 拼装 template/ 与 props，再 remotion_studio 预览（可选）→ remotion_render；自由创作时 remotion_init_project → write_file；禁止未渲染成功就声称成片已生成
16. fetch_web_images 必须传 topic（搜索/创作主题）；下载媒体只保留与主题相关的图视频，禁止不传主题就整页狂下
16. 用户要「每天几点执行」「建发布计划」「加一条规则」时：先 query_* 了解现状，再用 post_* 落盘；定时任务默认 enabled=false，向用户说明可在确认后再次 post 并设 enabled=true；规则保存后说明下一轮对话生效
17. 用户只要求创作/解析/成稿、未明确说「发布/发一篇/发到某渠道」时：禁止调用 xhs_publish_note / douyin_publish_note；可成稿后询问是否发布`,
  researcher: `${BASE_CAPABILITY}

你是「调研员」角色。只负责热点/素材调研与配图收集，不要写最终成稿，不要调用发布工具。
优先：fetch_hot_topics（综合调研首选 tophub；抖音选题用 douyin；小红书选题用 weibo/baidu/douyin；快手优先 kuaishou，内部走聚合兜底）、web_search（关键词检索，内部 Bing→百度）、query_web_data（用户粘贴的文章/网页链接；需媒体时传 mediaTypes，落盘传 downloadMedia）、fetch_web_images、browser_navigate/snapshot、list_attachments。
涉及 A 股/股票行情时：调用 query_ashare_realtime_analysis（实时K线+分析）；仅基础K线用 query_ashare_kline。
完成后用简洁中文汇总：选题建议、可用图片本地绝对路径（便于界面预览）、要点 bullet。
若需要更强推理可 switch_model 为 reasoning；仅明确文生图/图生成视频时再切 creative。`,
  writer: `${BASE_CAPABILITY}

你是「撰稿人」角色。基于对话中的调研结果撰写标题与正文；不要调用发布工具。
- 小红书标题建议 ≤20 字，抖音标题不超过 20 字
- 用户给出参考链接时：先 query_web_data 读取正文，再基于原文撰写（勿臆造）
- 可用 update_task_list / write_file / read_file / switch_model
- 输出清晰的标题、正文、话题标签建议
- 若用户未要求发布：成稿即止，可询问是否需要发布，但不要自行进入发布流程`,
  publisher: `${BASE_CAPABILITY}

你是「发布员」角色。仅在用户明确要求发布时，根据已写好的标题正文与配图/视频路径完成渠道发布。
- 小红书 → xhs_publish_note：先判断类型并传 publishType（image 图文 / video 视频 / article 长文 / audio 播客），工具会自动打开 from=menu&target=* 对应入口再填充
- 抖音图文 → douyin_publish_note
- 若用户只要求创作/解析/成稿、未要求发布：不要调用发布工具，直接汇总文稿与配图路径后结束
- 失败后可用 browser_* 排查重试（仅拟人模式）
- 不要编造已发布成功；以工具返回为准
- 任务类型变化时可 switch_model`,
  scriptwriter: `${BASE_CAPABILITY}

你是「编剧」角色，负责文生视频流程第 1 步：创意脚本与精细化提示词。
流程：
1. 热点选题：优先 fetch_hot_topics（tophub/weibo/baidu/douyin 等）；需要打开报道页时用 browser_navigate + browser_snapshot
2. 关键词查背景/出处：优先 web_search（Bing→百度）；用户粘贴 http(s) 文章/网页链接时：先 query_web_data（传 url）读取标题与正文，勿臆造；掘金/知乎等 SPA 可 preferBrowser=true；需要页面媒体传 mediaTypes；需要配图可 fetch_web_images
3. 若有本地附件，再 list_attachments；图片文字见消息中的 [本机识字] 段，勿用 read_file 读二进制
4. 明确主题、用途、时长、画幅（默认竖版 9:16）、整体风格
5. 扩写完整剧本后调用 generate_script 落盘
6. 拆成 4～8 镜，调用 generate_storyboard。每镜必须填写：
   - visual（主体+场景+动作）
   - narration（旁白）
   - durationSec（2～15 秒）
   - cameraMotion（推/拉/环绕/跟拍）
   - style（写实/电影/动画）
   - negativePrompt（防人脸扭曲、肢体崩坏、闪烁跳帧）
   - aspectRatio（9:16 / 16:9 / 1:1）
   - lighting（光影色调，可选）
7. 不要调用 generate_scene_assets 或 compose_video（交给后续角色）
8. 若用户明确要求 Remotion / React 代码视频：加载 react-agent-remotion，调用 remotion_init_project 并 write_file 编写 Composition（可跳过 generate_storyboard 管线）
9. 创作向任务保持 chat（或角色默认连接）；仅明确文生图/图生成视频时 switch_model 为 creative；看图理解附件时为 vision
完成后汇报剧名、镜数、画幅与文件路径。`,
  videographer: `${BASE_CAPABILITY}

你是「视频制作」角色，负责流程第 2～3 步：AI 渲染与素材校验。
1. 若需参考网页/文章链接，先 query_web_data 读取正文（勿臆造）；需要页面音视频等媒体时传 mediaTypes，落盘传 downloadMedia=true
2. 读取上游分镜，调用 generate_scene_assets（万相 T2I 关键帧 → I2V 动效，失败则 T2V 兜底 → Qwen-TTS 旁白）
3. 若上游为 Remotion 工程：调用 remotion_render 导出 mp4，不要 generate_scene_assets
4. 不要重新写剧本；不要 compose_video
5. 百炼 API Key 已配置时走万相视频 + TTS；未配置或单镜失败时如实汇报并继续
6. 提醒用户：各镜 mp4/wav/png 路径会在聊天界面内联预览
7. 需要时可 switch_model
完成后汇总每镜 T2I/I2V/TTS 成败与 manifest 路径。`,
  editor: `${BASE_CAPABILITY}

你是「剪辑师」角色，负责流程第 3～7 步：粗剪拼接、音画对齐、审核与导出。
1. 调用 compose_video 将场景视频/静图合成为成片（优先 mp4 片段，多段旁白自动 concat）
2. 优先使用会话内 assets-manifest；也可显式传 scenePaths
3. 全片审核：音画同步、叙事连贯、是否有畸形/闪烁残留；有问题在回复中说明
4. 成片路径以工具返回为准；提醒用户可在聊天内直接播放 videoPath
5. 保留 manifest 与提示词版本路径，便于二次修改
6. 可按需 notify_message 通知用户（飞书 msgType=post 可推 Markdown 富文本）
7. 需要时可 switch_model
不要重新生成分镜。`
};
const ROLE_CONTEXT_BUDGETS = {
  general: { ruleChars: 4e3, skillChars: 4e3 },
  researcher: { ruleChars: 3e3, skillChars: 3500 },
  writer: { ruleChars: 3e3, skillChars: 3e3 },
  publisher: { ruleChars: 4e3, skillChars: 4e3 },
  scriptwriter: { ruleChars: 3500, skillChars: 3500 },
  videographer: { ruleChars: 2500, skillChars: 2500 },
  editor: { ruleChars: 2500, skillChars: 2500 }
};
function buildRoleSystemPrompt(role, rolePromptOverrides, settings, skillCtx) {
  const fullAccess = Boolean(settings?.fullAccess);
  const modeBlock = queryFullAccessModeBlock(fullAccess);
  const resolvedSkillCtx = {
    sessionSkillIds: skillCtx?.sessionSkillIds ?? [],
    roleSkillIds: skillCtx?.roleSkillIds ?? settings?.roleSkillIds?.[role] ?? []
  };
  if (role === "supervisor") {
    let prompt = ROLE_PROMPTS.supervisor;
    const customs = settings?.customAgentRoles ?? [];
    if (customs.length > 0) {
      prompt += "\n\n可选 next（用户自定义角色，单步执行后结束；任务明确匹配时优先直达）：\n" + customs.map(
        (c) => `- \`${c.id}\`（${c.label}）${c.description ? `：${c.description}` : ""}`
      ).join("\n") + '\n示例：{"next":"custom_xxx","capability":"chat"}';
    }
    return prompt;
  }
  if (queryIsCustomAgentRoleId(role)) {
    const def = queryCustomAgentRole(settings?.customAgentRoles, role);
    const parts2 = [
      BASE_CAPABILITY,
      modeBlock,
      def?.systemPrompt?.trim() || "你是用户自定义助手，请严格遵循上述能力与用户角色说明。"
    ];
    const override2 = rolePromptOverrides?.[role]?.trim();
    if (override2) {
      parts2.push(`## 用户角色设定（必须遵循）

${override2}`);
    }
    const budget2 = ROLE_CONTEXT_BUDGETS.general;
    const ruleBlock2 = queryEnabledRulePrompt(budget2.ruleChars);
    const skillBlock2 = queryInjectableSkillPrompt(budget2.skillChars, resolvedSkillCtx);
    if (ruleBlock2) {
      parts2.push(
        `## 用户规则（必须优先遵循）

以下规则适用于全部模型输出，包括思考推理过程与对用户的正式回复：

${ruleBlock2}`
      );
    }
    if (skillBlock2) {
      parts2.push(
        `## 可用技能目录

${skillBlock2}

仅当当前任务与某项技能描述明确匹配时，调用 \`use_skill\` 读取该技能的完整说明；不相关的技能不要加载。`
      );
    }
    parts2.push(LANGUAGE_OUTPUT_CONSTRAINT);
    return parts2.join("\n\n");
  }
  const builtin = role;
  const parts = [ROLE_PROMPTS[builtin], modeBlock];
  const override = rolePromptOverrides?.[role]?.trim();
  if (override) {
    parts.push(`## 用户角色设定（必须遵循）

${override}`);
  }
  const budget = ROLE_CONTEXT_BUDGETS[builtin];
  const ruleBlock = queryEnabledRulePrompt(budget.ruleChars);
  const skillBlock = queryInjectableSkillPrompt(budget.skillChars, resolvedSkillCtx);
  if (ruleBlock) {
    parts.push(
      `## 用户规则（必须优先遵循）

以下规则适用于全部模型输出，包括思考推理过程与对用户的正式回复：

${ruleBlock}`
    );
  }
  if (skillBlock) {
    parts.push(
      `## 可用技能目录

${skillBlock}

仅当当前任务与某项技能描述明确匹配时，调用 \`use_skill\` 读取该技能的完整说明；不相关的技能不要加载。`
    );
  }
  parts.push(LANGUAGE_OUTPUT_CONSTRAINT);
  return parts.join("\n\n");
}
const readFileTool = {
  name: "read_file",
  description: "读取本地文本文件内容。可用于查看已生成的文案或配置。",
  permission: "safe",
  parameters: {
    type: "object",
    properties: {
      path: { type: "string", description: "文件绝对路径" }
    },
    required: ["path"]
  },
  async execute(args) {
    const path2 = String(args.path ?? "");
    if (!path2 || !fs.existsSync(path2)) {
      return `文件不存在: ${path2}`;
    }
    const content = fs.readFileSync(path2, "utf-8");
    if (content.length > 8e4) {
      return content.slice(0, 8e4) + "\n...[截断]";
    }
    return content;
  }
};
const writeFileTool = {
  name: "write_file",
  description: "将文本写入本地文件。默认建议写到 artifacts 目录。",
  permission: "sensitive",
  parameters: {
    type: "object",
    properties: {
      path: { type: "string", description: "目标绝对路径；可省略目录写到 artifacts" },
      content: { type: "string", description: "文件内容" },
      filename: { type: "string", description: "若未给 path，则用 artifacts/filename" }
    },
    required: ["content"]
  },
  async execute(args) {
    let path$1 = args.path ? String(args.path) : "";
    if (!path$1) {
      const name = String(args.filename ?? `note-${Date.now()}.txt`);
      path$1 = path.join(getArtifactsDir(), name);
    }
    fs.mkdirSync(path.dirname(path$1), { recursive: true });
    fs.writeFileSync(path$1, String(args.content ?? ""), "utf-8");
    return `已写入: ${path$1}`;
  }
};
const listAttachmentsTool = {
  name: "list_attachments",
  description: "列出用户本轮可选上传的附件本地路径。发布小红书时配图优先用 fetch_web_images；附件仅作补充，没有也不必强求用户上传。",
  permission: "safe",
  parameters: {
    type: "object",
    properties: {},
    required: []
  },
  async execute(_args, ctx) {
    if (!ctx.attachmentPaths.length) {
      return "当前没有本地附件（可选）。请优先用 fetch_web_images 从来源网页获取配图。";
    }
    return ctx.attachmentPaths.map((p, i) => `${i + 1}. ${p}`).join("\n");
  }
};
const LOCK_FILES = [
  "SingletonLock",
  "SingletonCookie",
  "SingletonSocket",
  "RunningChromeVersion"
];
function releaseBrowserProfileLock(profileDir = getBrowserProfileDir()) {
  killStaleChromeForTesting(profileDir);
  removeSingletonLocks(profileDir);
}
function removeSingletonLocks(profileDir) {
  for (const name of LOCK_FILES) {
    const p = path.join(profileDir, name);
    try {
      if (!fs.existsSync(p)) continue;
      if (fs.lstatSync(p).isSymbolicLink()) {
        try {
          fs.readlinkSync(p);
        } catch {
        }
      }
      fs.unlinkSync(p);
      console.info(`[browser] removed profile lock: ${name}`);
    } catch (err) {
      console.warn(`[browser] failed to remove ${name}:`, err);
    }
  }
}
function killStaleChromeForTesting(profileDir) {
  if (process.platform === "win32") {
    try {
      child_process.execSync(
        'taskkill /F /IM "Google Chrome for Testing.exe" /T',
        { stdio: "ignore" }
      );
    } catch {
    }
    return;
  }
  try {
    const escaped = profileDir.replace(/'/g, "'\\''");
    child_process.execSync(
      `pgrep -f 'Google Chrome for Testing.*${escaped}' | xargs kill -9 2>/dev/null || true`,
      { stdio: "ignore", shell: "/bin/bash" }
    );
    child_process.execSync(`pkill -9 -f 'Google Chrome for Testing' 2>/dev/null || true`, {
      stdio: "ignore",
      shell: "/bin/bash"
    });
  } catch {
  }
}
function isProfileLockError(err) {
  const msg = err instanceof Error ? err.message : String(err);
  return /Target page, context or browser has been closed/i.test(msg) || /正在现有的浏览器会话中打开/i.test(msg) || /browser has been closed/i.test(msg) || /SingletonLock/i.test(msg);
}
function rand(min, max) {
  return min + Math.random() * (max - min);
}
function sleep$1(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
const HUMAN_MIN_PAUSE_MS = 300;
function queryGaussianDelayMs(baseSeconds, spreadSeconds) {
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(Math.max(u1, 1e-6))) * Math.cos(2 * Math.PI * u2);
  const seconds = baseSeconds + z * spreadSeconds;
  return Math.max(HUMAN_MIN_PAUSE_MS, Math.round(seconds * 1e3));
}
async function humanGaussianPause(baseSeconds, spreadSeconds) {
  await sleep$1(queryGaussianDelayMs(baseSeconds, spreadSeconds));
}
async function humanStepPause(opts) {
  const min = opts?.min ?? 2e3;
  const max = opts?.max ?? 1e4;
  await sleep$1(rand(min, max));
}
async function humanGaussianStepPause(opts) {
  const min = opts?.min ?? 2e3;
  const max = opts?.max ?? 1e4;
  const base2 = (min + max) / 2 / 1e3;
  const spread = (max - min) / 2 / 1e3 / 3;
  await humanGaussianPause(base2, Math.max(spread, 0.15));
}
async function humanMicroPause() {
  await sleep$1(rand(400, 1200));
}
function cubicBezier(t, p0, p1, p2, p3) {
  const u = 1 - t;
  return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
}
function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}
async function humanBezierMoveTo(page, target, from, opts) {
  const viewport = page.viewportSize() ?? { width: 1280, height: 800 };
  const start = {
    x: rand(viewport.width * 0.2, viewport.width * 0.8),
    y: rand(viewport.height * 0.2, viewport.height * 0.7)
  };
  const jitter = 90;
  const steps = Math.max(10, Math.floor(rand(14, 26)));
  const cp1 = {
    x: start.x + rand(-jitter, jitter),
    y: start.y + rand(-jitter * 0.8, jitter * 0.8)
  };
  const cp2 = {
    x: target.x + rand(-jitter * 0.7, jitter * 0.7),
    y: target.y + rand(-jitter * 0.6, jitter * 0.6)
  };
  for (let i = 1; i <= steps; i++) {
    const t = easeInOut(i / steps);
    const x = cubicBezier(t, start.x, cp1.x, cp2.x, target.x);
    const y = cubicBezier(t, start.y, cp1.y, cp2.y, target.y);
    await page.mouse.move(x, y);
    if (Math.random() < 0.12) {
      await sleep$1(rand(40, 180));
    } else {
      await sleep$1(rand(8, 28));
    }
  }
  await sleep$1(rand(50, 150));
}
async function humanBezierScroll(page, opts) {
  const direction = opts?.direction ?? "down";
  const total = opts?.distance ?? (direction === "down" ? rand(380, 920) : rand(280, 680)) * (direction === "up" ? -1 : 1);
  const steps = Math.floor(rand(9, 18));
  for (let i = 1; i <= steps; i++) {
    const t = easeInOut(i / steps);
    const prev = easeInOut((i - 1) / steps);
    const delta = total * (t - prev);
    await page.mouse.wheel(0, delta);
    if (Math.random() < 0.22) {
      await sleep$1(rand(120, 480));
    } else {
      await sleep$1(rand(18, 55));
    }
  }
  await sleep$1(rand(600, 2200));
}
async function humanXhsHomeBrowse(page, opts) {
  const timesMin = 2;
  const timesMax = 5;
  const times = Math.floor(rand(timesMin, timesMax + 1));
  for (let i = 0; i < times; i++) {
    const direction = Math.random() < 0.72 ? "down" : "up";
    await humanBezierScroll(page, {
      direction,
      distance: rand(300, 900) * (direction === "up" ? -1 : 1)
    });
    await humanGaussianPause(rand(0.8, 1.6), 0.35);
  }
  await page.evaluate(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  });
  await humanGaussianPause(0.6, 0.2);
}
async function humanXhsAfterFillBrowse(page) {
  for (let i = 0; i < 2; i++) {
    await humanBezierScroll(page, {
      direction: Math.random() < 0.65 ? "down" : "up",
      distance: rand(180, 420) * (Math.random() < 0.65 ? 1 : -1)
    });
    await humanGaussianPause(0.5, 0.2);
  }
}
const SYNONYM_MAP = {
  收纳: ["归置", "储物", "整理"],
  实用: ["亲测好用", "省心", "真的香"],
  整洁: ["清爽", "干净利落", "看着舒服"],
  推荐: ["安利", "真心建议", "可以试试"],
  分享: ["唠一唠", "记录一下", "来说说"],
  方法: ["路子", "做法", "小技巧"],
  效果: ["感受", "变化", "体验"],
  必备: ["值得入", "少不了", "真需要"],
  简单: ["不费事", "好上手", "不难"],
  好看: ["上镜", "颜值在线", "挺出片"]
};
const TITLE_DECOR = ["✨", "干货", "实测", "分享"];
const ORAL_PREFIX = ["其实", "个人觉得", "亲测", "顺带一提", "悄悄说"];
const SOFT_SUFFIX = ["啦", "喔", "哒", "hhh", "哟"];
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function queryRewriteXhsSynonyms(text) {
  let out = text;
  for (const [key, values] of Object.entries(SYNONYM_MAP)) {
    if (!out.includes(key)) continue;
    const replacement = pick(values);
    out = out.split(key).join(replacement);
  }
  return out;
}
function queryRewriteXhsTitle(title) {
  const base2 = queryRewriteXhsSynonyms(title.trim());
  if (Math.random() >= 0.4) return base2;
  const tag = pick(TITLE_DECOR);
  return Math.random() < 0.5 ? `${tag}${base2}` : `${base2}${tag}`;
}
function queryRewriteXhsBody(content) {
  const afterSynonym = queryRewriteXhsSynonyms(content);
  const parts = afterSynonym.split(/([，,。！？\n])/g);
  const rebuilt = [];
  for (let i = 0; i < parts.length; i++) {
    const chunk = parts[i];
    if (!chunk) continue;
    if (/^[，,。！？\n]$/.test(chunk)) {
      rebuilt.push(chunk);
      continue;
    }
    let sentence = chunk.trim();
    if (!sentence) continue;
    if (sentence.length > 4 && Math.random() < 0.6) {
      sentence = `${pick(ORAL_PREFIX)}，${sentence}`;
    }
    if (sentence.length > 4 && Math.random() < 0.5) {
      sentence = `${sentence}${pick(SOFT_SUFFIX)}`;
    }
    rebuilt.push(sentence);
  }
  return rebuilt.join("").replace(/\n{3,}/g, "\n\n");
}
function queryRewriteXhsPublishCopy(title, content) {
  const nextTitle = queryRewriteXhsTitle(title);
  const nextContent = queryRewriteXhsBody(content);
  const rewritten = nextTitle !== title || nextContent !== content;
  return { title: nextTitle, content: nextContent, rewritten };
}
function queryHumanTypeDelayMs() {
  const base2 = rand(60, 80);
  const jitter = rand(-30, 30);
  return Math.max(35, Math.round(base2 + jitter));
}
function queryMimeTypeFromFilePath(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const map = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".bmp": "image/bmp",
    ".avif": "image/avif"
  };
  return map[ext] ?? "application/octet-stream";
}
async function humanMoveTo(page, target, _steps = 18) {
  await humanBezierMoveTo(page, target);
}
async function humanClickLocator(page, locator, opts) {
  await locator.waitFor({ state: "visible", timeout: opts?.timeout ?? 15e3 });
  await locator.scrollIntoViewIfNeeded().catch(() => void 0);
  const box = await locator.boundingBox();
  if (!box) {
    await locator.click({ delay: rand(40, 90), timeout: opts?.timeout ?? 15e3 });
    return;
  }
  const x = box.x + box.width * rand(0.35, 0.65);
  const y = box.y + box.height * rand(0.35, 0.65);
  await humanMoveTo(page, { x, y }, rand(14, 28));
  await sleep$1(rand(50, 150));
  await page.mouse.down();
  await sleep$1(rand(40, 100));
  await page.mouse.up();
  await sleep$1(rand(80, 200));
}
async function humanClickAt(page, x, y) {
  await humanMoveTo(page, { x, y }, rand(14, 28));
  await sleep$1(rand(50, 150));
  await page.mouse.down();
  await sleep$1(rand(40, 100));
  await page.mouse.up();
  await sleep$1(rand(80, 200));
}
async function humanClickText(page, texts, opts) {
  for (const text of texts) {
    try {
      const loc = page.getByText(text, { exact: false }).first();
      if (await loc.isVisible({ timeout: opts?.timeoutPer ?? 1500 })) {
        await humanClickLocator(page, loc);
        return true;
      }
    } catch {
    }
  }
  return false;
}
async function humanTypeInto(page, locator, text, opts) {
  const clear = opts?.clear !== false;
  const useLegacyDelay = opts?.delayMin != null || opts?.delayMax != null;
  const delayMin = opts?.delayMin ?? 60;
  const delayMax = opts?.delayMax ?? 80;
  await humanClickLocator(page, locator);
  if (clear) {
    const mod = process.platform === "darwin" ? "Meta" : "Control";
    await page.keyboard.down(mod);
    await page.keyboard.press("KeyA");
    await page.keyboard.up(mod);
    await sleep$1(rand(40, 90));
    await page.keyboard.press("Backspace");
    await sleep$1(rand(60, 140));
  }
  for (const ch of text) {
    const perCharDelay = useLegacyDelay ? rand(delayMin, delayMax) : queryHumanTypeDelayMs();
    await page.keyboard.type(ch, { delay: perCharDelay });
    if (ch === "\n" || ch === "，" || ch === "。" || ch === "、") {
      await humanGaussianPause(0.12, 0.05);
    }
  }
  await sleep$1(rand(100, 250));
}
async function humanTypeBySelectors(page, selectors, text, opts) {
  for (const sel of selectors) {
    try {
      const loc = page.locator(sel).first();
      if (!await loc.isVisible({ timeout: 1500 })) continue;
      await humanTypeInto(page, loc, text, opts);
      return true;
    } catch {
    }
  }
  return false;
}
async function humanDropLocalFiles(page, dropTarget, paths) {
  if (!paths.length) return;
  await dropTarget.waitFor({ state: "visible", timeout: 12e3 });
  await dropTarget.scrollIntoViewIfNeeded().catch(() => void 0);
  const box = await dropTarget.boundingBox();
  if (box) {
    await humanMoveTo(page, {
      x: box.x + box.width * rand(0.4, 0.6),
      y: box.y + box.height * rand(0.4, 0.6)
    });
    await sleep$1(rand(80, 180));
  }
  const payloads = paths.map((p) => ({
    name: path.basename(p),
    mimeType: queryMimeTypeFromFilePath(p),
    // base64 避免大图用 number[] 序列化占内存
    b64: fs.readFileSync(p).toString("base64")
  }));
  await dropTarget.evaluate((el, files) => {
    const dt = new DataTransfer();
    for (const f of files) {
      const binary = atob(f.b64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      dt.items.add(new File([bytes], f.name, { type: f.mimeType }));
    }
    for (const type of ["dragenter", "dragover", "drop"]) {
      el.dispatchEvent(
        new DragEvent(type, {
          bubbles: true,
          cancelable: true,
          dataTransfer: dt
        })
      );
    }
  }, payloads);
  await sleep$1(rand(900, 1600));
}
async function humanUploadFiles(page, paths, opts) {
  const triggers = opts?.triggerTexts ?? ["上传图文", "上传图片", "上传", "添加图片", "从本地上传"];
  const input = opts?.fileInputSelector ? page.locator(opts.fileInputSelector).first() : page.locator("input[type=file]").first();
  const attached = await input.waitFor({ state: "attached", timeout: 3e3 }).then(
    () => true,
    () => false
  );
  if (attached) {
    await input.setInputFiles(paths);
    await sleep$1(rand(800, 1500));
    return;
  }
  let trigger = null;
  for (const text of triggers) {
    const loc = page.getByText(text, { exact: false }).first();
    if (await loc.isVisible({ timeout: 1200 }).catch(() => false)) {
      trigger = loc;
      break;
    }
  }
  if (!trigger) {
    await input.waitFor({ state: "attached", timeout: 1e4 });
    await input.setInputFiles(paths);
    await sleep$1(rand(800, 1500));
    return;
  }
  const chooserPromise = page.waitForEvent("filechooser", { timeout: 12e3 });
  await humanClickLocator(page, trigger);
  const chooser = await chooserPromise;
  await chooser.setFiles(paths);
  await sleep$1(rand(800, 1500));
}
const CHROMIUM_STEALTH_IGNORE_DEFAULT_ARGS = ["--enable-automation"];
const CHROMIUM_STEALTH_LAUNCH_ARGS = [
  "--disable-blink-features=AutomationControlled",
  "--no-first-run",
  "--no-default-browser-check"
];
const HEADED_WINDOW_TOO_SMALL_RATIO = 0.6;
function queryIsHeadedWindowPlacementTooSmall(placement, workArea) {
  const width = Math.max(0, placement.right - placement.left);
  const height = Math.max(0, placement.bottom - placement.top);
  if (workArea.width <= 0 || workArea.height <= 0) return false;
  return width < workArea.width * HEADED_WINDOW_TOO_SMALL_RATIO || height < workArea.height * HEADED_WINDOW_TOO_SMALL_RATIO;
}
function queryNormalHeadedWindowPlacement(workArea) {
  const left = workArea.x;
  const top = workArea.y;
  const right = workArea.x + workArea.width;
  const bottom = workArea.y + workArea.height;
  return {
    left,
    top,
    right,
    bottom,
    maximized: false,
    work_area_left: left,
    work_area_top: top,
    work_area_right: right,
    work_area_bottom: bottom
  };
}
function postResetHeadedWindowPlacementIfTooSmall(profileDir, workArea) {
  const prefsPath = path.join(profileDir, "Default", "Preferences");
  if (!fs.existsSync(prefsPath)) return false;
  let data;
  try {
    data = JSON.parse(fs.readFileSync(prefsPath, "utf8"));
  } catch {
    return false;
  }
  const browser = data.browser ?? {};
  const placement = browser.window_placement;
  if (placement && typeof placement.left === "number" && typeof placement.top === "number" && typeof placement.right === "number" && typeof placement.bottom === "number" && !queryIsHeadedWindowPlacementTooSmall(placement, workArea)) {
    return false;
  }
  browser.window_placement = queryNormalHeadedWindowPlacement(workArea);
  data.browser = browser;
  fs.writeFileSync(prefsPath, JSON.stringify(data));
  return true;
}
function installStealthInPage() {
  const maskWebdriver = () => {
    try {
      Object.defineProperty(navigator, "webdriver", {
        get: () => void 0,
        configurable: true
      });
    } catch {
    }
    try {
      const navProto = Object.getPrototypeOf(navigator);
      if ("webdriver" in navProto) {
        Object.defineProperty(navProto, "webdriver", {
          get: () => void 0,
          configurable: true
        });
      }
    } catch {
    }
  };
  const purgeLegacyAutomationGlobals = () => {
    const suspicious = /^(cdc_|\$cdc_|__webdriver|__driver|__selenium|__fxdriver|__phantom|__nightmare|_Selenium|_WEBDRIVER|calledSelenium|webdriverAsyncExecutor)/i;
    const scrub = (obj) => {
      let names = [];
      try {
        names = Object.getOwnPropertyNames(obj);
      } catch {
        return;
      }
      for (const key of names) {
        if (!suspicious.test(key)) continue;
        try {
          delete obj[key];
        } catch {
          try {
            Object.defineProperty(obj, key, {
              get: () => void 0,
              configurable: true
            });
          } catch {
          }
        }
      }
    };
    scrub(window);
    scrub(document);
  };
  const patchChromeRuntime = () => {
    const w = window;
    if (!w.chrome) {
      w.chrome = { runtime: {} };
    } else if (!w.chrome.runtime) {
      w.chrome.runtime = {};
    }
  };
  const patchNavigatorLocales = () => {
    try {
      Object.defineProperty(navigator, "languages", {
        get: () => ["zh-CN", "zh", "en-US", "en"],
        configurable: true
      });
      Object.defineProperty(navigator, "language", {
        get: () => "zh-CN",
        configurable: true
      });
    } catch {
    }
  };
  const patchPermissionsQuery = () => {
    const original = navigator.permissions?.query?.bind(navigator.permissions);
    if (!original) return;
    navigator.permissions.query = (parameters) => {
      if (parameters.name === "notifications") {
        return Promise.resolve({
          state: Notification.permission,
          onchange: null
        });
      }
      return original(parameters);
    };
  };
  const patchCanvas = () => {
    const proto = HTMLCanvasElement.prototype;
    const original = proto.toDataURL;
    proto.toDataURL = function toDataURL(...args) {
      const ctx = this.getContext("2d");
      if (ctx) {
        const noise = (Math.random() - 0.5) * 0.4;
        ctx.fillStyle = `rgba(0,0,0,${Math.abs(noise) / 1e3})`;
        ctx.fillRect(0, 0, 1, 1);
      }
      return original.apply(this, args);
    };
  };
  maskWebdriver();
  purgeLegacyAutomationGlobals();
  patchChromeRuntime();
  patchNavigatorLocales();
  patchPermissionsQuery();
  patchCanvas();
  window.setTimeout(() => {
    maskWebdriver();
    purgeLegacyAutomationGlobals();
  }, 0);
}
async function postApplyBrowserStealthScripts(context) {
  await context.addInitScript(installStealthInPage);
}
function queryPrimaryWorkArea() {
  try {
    const wa = electron.screen.getPrimaryDisplay().workArea;
    if (wa.width > 0 && wa.height > 0) {
      return { x: wa.x, y: wa.y, width: wa.width, height: wa.height };
    }
  } catch {
  }
  return { x: 0, y: 25, width: 1440, height: 875 };
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
class BrowserContextSlot {
  constructor(mode, profileDir, notifyOpen) {
    this.mode = mode;
    this.profileDir = profileDir;
    this.notifyOpen = notifyOpen;
    this.context = null;
    this.page = null;
    this.lastUrl = "";
    this.lastTitle = "";
    this.starting = null;
  }
  async ensureStarted() {
    if (this.page && !this.page.isClosed()) {
      return this.page;
    }
    if (this.starting) {
      return this.starting;
    }
    this.starting = this.launchWithRetry().finally(() => {
      this.starting = null;
    });
    return this.starting;
  }
  async launchWithRetry(maxAttempts = 3) {
    let lastError;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await this.close();
        releaseBrowserProfileLock(this.profileDir);
        await sleep(attempt === 1 ? 200 : 600);
        if (this.mode === "headed") {
          const reset = postResetHeadedWindowPlacementIfTooSmall(
            this.profileDir,
            queryPrimaryWorkArea()
          );
          if (reset) {
            console.info("[browser:headed] reset abnormally small window_placement before launch");
          }
        }
        this.context = await playwright.chromium.launchPersistentContext(this.profileDir, {
          headless: this.mode === "headless",
          viewport: this.mode === "headed" ? null : { width: 1280, height: 800 },
          locale: "zh-CN",
          timezoneId: "Asia/Shanghai",
          ignoreDefaultArgs: [...CHROMIUM_STEALTH_IGNORE_DEFAULT_ARGS],
          args: [...CHROMIUM_STEALTH_LAUNCH_ARGS]
        });
        await postApplyBrowserStealthScripts(this.context);
        const pages = this.context.pages();
        this.page = pages[0] ?? await this.context.newPage();
        if (this.page.isClosed()) {
          throw new Error("Target page, context or browser has been closed");
        }
        this.page.on("framenavigated", async () => {
          try {
            this.lastUrl = this.page?.url() ?? "";
            this.lastTitle = await this.page?.title() ?? "";
          } catch {
          }
        });
        this.context.on("close", () => {
          this.context = null;
          this.page = null;
        });
        return this.page;
      } catch (err) {
        lastError = err;
        this.context = null;
        this.page = null;
        if (!isProfileLockError(err) || attempt === maxAttempts) {
          break;
        }
        console.warn(
          `[browser:${this.mode}] launch attempt ${attempt}/${maxAttempts} failed, retrying…`,
          err instanceof Error ? err.message : err
        );
        releaseBrowserProfileLock(this.profileDir);
        await sleep(800 * attempt);
      }
    }
    throw lastError instanceof Error ? lastError : new Error(String(lastError ?? `浏览器启动失败(${this.mode})`));
  }
  async navigate(url2) {
    const page = await this.ensureStarted();
    await page.goto(url2, { waitUntil: "domcontentloaded", timeout: 6e4 });
    this.lastUrl = page.url();
    try {
      this.lastTitle = await page.title();
    } catch {
    }
    if (!this.notifyOpen) return;
    const win = getMainWindow();
    if (win && !win.isDestroyed()) {
      win.webContents.send("event:agent", {
        type: "browser_open",
        sessionId: "",
        url: url2
      });
    }
  }
  async snapshot(maxLength = 12e3) {
    const page = await this.ensureStarted();
    const snapshot = await page.locator("body").ariaSnapshot().catch(async () => {
      const text2 = await page.innerText("body");
      return text2;
    });
    const text = typeof snapshot === "string" ? snapshot : String(snapshot);
    return text.length > maxLength ? text.slice(0, maxLength) + "\n...[截断]" : text;
  }
  async click(opts) {
    const page = await this.ensureStarted();
    if (opts.selector) {
      await humanClickLocator(page, page.locator(opts.selector).first());
      return;
    }
    if (opts.text) {
      const ok = await humanClickText(page, [opts.text]);
      if (!ok) throw new Error(`未找到可点击文本: ${opts.text}`);
      return;
    }
    throw new Error("browser_click 需要 selector 或 text");
  }
  async type(opts) {
    const page = await this.ensureStarted();
    const locator = opts.selector ? page.locator(opts.selector).first() : page.locator("textarea:visible, input:visible, [contenteditable=true]:visible").first();
    await humanTypeInto(page, locator, opts.text, { clear: opts.clear !== false });
  }
  async upload(opts) {
    const page = await this.ensureStarted();
    await humanUploadFiles(page, opts.paths, {
      fileInputSelector: opts.selector
    });
  }
  async wait(opts) {
    const page = await this.ensureStarted();
    if (opts.selector) {
      await page.locator(opts.selector).first().waitFor({ state: "visible", timeout: 6e4 });
    }
    if (opts.ms) {
      await page.waitForTimeout(opts.ms);
    }
    if (!opts.selector && !opts.ms) {
      await page.waitForTimeout(1e3);
    }
  }
  /**
   * 无头模式下从页面提取纯文本（数据兜底用）。
   * 可选 CSS 选择器缩小范围。
   */
  async extractText(opts) {
    const page = await this.ensureStarted();
    const maxLength = opts?.maxLength ?? 2e4;
    const locator = opts?.selector ? page.locator(opts.selector).first() : page.locator("body");
    const text = await locator.innerText().catch(() => "");
    return text.length > maxLength ? text.slice(0, maxLength) + "\n...[截断]" : text;
  }
  getPage() {
    return this.page;
  }
  getStatus() {
    return {
      running: Boolean(this.page && !this.page.isClosed()),
      url: this.lastUrl,
      title: this.lastTitle
    };
  }
  async close() {
    if (this.context) {
      await this.context.close().catch(() => void 0);
    }
    this.context = null;
    this.page = null;
    releaseBrowserProfileLock(this.profileDir);
  }
}
class BrowserService {
  constructor() {
    this.headed = new BrowserContextSlot(
      "headed",
      getBrowserProfileDir(),
      true
    );
    this.headless = new BrowserContextSlot(
      "headless",
      getHeadlessBrowserProfileDir(),
      false
    );
  }
  slot(mode = "headed") {
    return mode === "headless" ? this.headless : this.headed;
  }
  /** 默认有头；数据兜底传 headless */
  async ensureStarted(mode = "headed") {
    return this.slot(mode).ensureStarted();
  }
  async navigate(url2, mode = "headed") {
    return this.slot(mode).navigate(url2);
  }
  async snapshot(maxLength = 12e3, mode = "headed") {
    return this.slot(mode).snapshot(maxLength);
  }
  async click(opts, mode = "headed") {
    return this.slot(mode).click(opts);
  }
  async type(opts, mode = "headed") {
    return this.slot(mode).type(opts);
  }
  async upload(opts, mode = "headed") {
    return this.slot(mode).upload(opts);
  }
  async wait(opts, mode = "headed") {
    return this.slot(mode).wait(opts);
  }
  async extractText(opts, mode = "headless") {
    return this.slot(mode).extractText(opts);
  }
  getPage(mode = "headed") {
    return this.slot(mode).getPage();
  }
  /** UI 状态仅反映有头浏览器（用户可见的智能体浏览器） */
  getStatus() {
    return this.headed.getStatus();
  }
  async clearProfileAndRestart() {
    await this.close();
    releaseBrowserProfileLock(getBrowserProfileDir());
    releaseBrowserProfileLock(getHeadlessBrowserProfileDir());
  }
  /**
   * 关闭有头智能体浏览器（用户可见窗口）。
   * 发布成功后调用，释放窗口与 profile 锁；无头抓取上下文不受影响。
   */
  async closeHeaded() {
    await this.headed.close();
  }
  async close() {
    await Promise.all([this.headed.close(), this.headless.close()]);
  }
}
let singleton = null;
function getBrowserService() {
  if (!singleton) singleton = new BrowserService();
  return singleton;
}
const browserNavigateTool = {
  name: "browser_navigate",
  description: "在智能体浏览器中打开指定 URL。",
  permission: "safe",
  parameters: {
    type: "object",
    properties: {
      url: { type: "string", description: "完整 URL" }
    },
    required: ["url"]
  },
  async execute(args) {
    const url2 = String(args.url ?? "");
    const browser = getBrowserService();
    await browser.ensureStarted();
    await browser.navigate(url2);
    return `已导航到: ${url2}`;
  }
};
const browserSnapshotTool = {
  name: "browser_snapshot",
  description: "获取当前页面可访问性摘要（文本树），用于决定下一步点击/输入。",
  permission: "safe",
  parameters: {
    type: "object",
    properties: {
      maxLength: { type: "number", description: "摘要最大字符数，默认 12000" }
    },
    required: []
  },
  async execute(args) {
    const browser = getBrowserService();
    await browser.ensureStarted();
    const max = Number(args.maxLength ?? 12e3);
    return browser.snapshot(max);
  }
};
const browserClickTool = {
  name: "browser_click",
  description: "用拟人鼠标移动并点击页面元素（非脚本瞬时点击）。优先用可见文本或 CSS 选择器。",
  permission: "sensitive",
  parameters: {
    type: "object",
    properties: {
      selector: { type: "string", description: "CSS 选择器" },
      text: { type: "string", description: "可见文本（与 selector 二选一）" }
    },
    required: []
  },
  async execute(args) {
    const browser = getBrowserService();
    await browser.ensureStarted();
    await browser.click({
      selector: args.selector ? String(args.selector) : void 0,
      text: args.text ? String(args.text) : void 0
    });
    return "鼠标点击成功";
  }
};
const browserTypeTool = {
  name: "browser_type",
  description: "先鼠标点入输入框，再逐字键盘输入（不使用 fill 脚本赋值）。",
  permission: "sensitive",
  parameters: {
    type: "object",
    properties: {
      selector: { type: "string" },
      text: { type: "string", description: "要输入的内容" },
      clear: { type: "boolean", description: "是否先全选清空，默认 true" }
    },
    required: ["text"]
  },
  async execute(args) {
    const browser = getBrowserService();
    await browser.ensureStarted();
    await browser.type({
      selector: args.selector ? String(args.selector) : void 0,
      text: String(args.text ?? ""),
      clear: args.clear !== false
    });
    return "键盘输入成功";
  }
};
const browserUploadTool = {
  name: "browser_upload",
  description: "向 file input 上传本地文件。",
  permission: "sensitive",
  parameters: {
    type: "object",
    properties: {
      selector: { type: "string", description: "input[type=file] 选择器，可省略自动查找" },
      paths: {
        type: "array",
        items: { type: "string" },
        description: "本地文件绝对路径列表"
      }
    },
    required: ["paths"]
  },
  async execute(args) {
    const paths = args.paths ?? [];
    const browser = getBrowserService();
    await browser.ensureStarted();
    await browser.upload({
      selector: args.selector ? String(args.selector) : void 0,
      paths
    });
    return `已上传 ${paths.length} 个文件`;
  }
};
const browserWaitTool = {
  name: "browser_wait",
  description: "等待指定毫秒或等待某选择器出现。",
  permission: "safe",
  parameters: {
    type: "object",
    properties: {
      ms: { type: "number" },
      selector: { type: "string" }
    },
    required: []
  },
  async execute(args) {
    const browser = getBrowserService();
    await browser.ensureStarted();
    await browser.wait({
      ms: args.ms != null ? Number(args.ms) : void 0,
      selector: args.selector ? String(args.selector) : void 0
    });
    return "等待完成";
  }
};
function queryNormalizeMarkdownImageSrc(src) {
  const trimmed = String(src ?? "").trim().replace(/^["'`]+|["'`]+$/g, "").replace(/[，,;；]+$/g, "");
  if (trimmed.startsWith("<") && trimmed.endsWith(">")) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}
function queryIsLocalAbsPath(src) {
  if (!src || src.startsWith("//")) return false;
  return src.startsWith("/") || /^[A-Za-z]:[\\/]/.test(src);
}
function queryFormatMarkdownImage(alt, src) {
  const path2 = queryNormalizeMarkdownImageSrc(src);
  const safeAlt = String(alt ?? "").replace(/[\[\]]/g, "");
  const needsBracket = queryIsLocalAbsPath(path2) && /[\s()<>]/.test(path2);
  const dest = needsBracket ? `<${path2}>` : path2;
  return `![${safeAlt}](${dest})`;
}
const SYSTEM_PROMPT = '你是网页配图质检员。根据用户主题与页面截图，从候选列表中选出与主题内容真正相关的图片/视频。必须拒绝：网站 Logo、头像、图标、广告、二维码、无关推荐位、纯装饰图。只返回 JSON：{"selected":[候选编号,...],"reason":"一句话说明"}。编号从 1 开始。';
function queryParseJsonObject(raw) {
  const text = String(raw ?? "").trim();
  if (!text) return null;
  try {
    const direct = JSON.parse(text);
    if (direct && typeof direct === "object" && !Array.isArray(direct)) {
      return direct;
    }
  } catch {
  }
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const slice = fence?.[1] ?? text;
  const start = slice.indexOf("{");
  const end = slice.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    const obj = JSON.parse(slice.slice(start, end + 1));
    if (obj && typeof obj === "object" && !Array.isArray(obj)) {
      return obj;
    }
  } catch {
    return null;
  }
  return null;
}
function queryParseSelectedIndexes(selected, candidateCount, maxCount) {
  if (!Array.isArray(selected)) return [];
  const out = [];
  const seen = /* @__PURE__ */ new Set();
  for (const item of selected) {
    const n = Number(item);
    if (!Number.isFinite(n)) continue;
    const idx = Math.floor(n) - 1;
    if (idx < 0 || idx >= candidateCount || seen.has(idx)) continue;
    seen.add(idx);
    out.push(idx);
    if (out.length >= maxCount) break;
  }
  return out;
}
function queryLlmTextContent$1(content) {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content.map((block) => {
      if (typeof block === "string") return block;
      if (block && typeof block === "object" && "text" in block) {
        return String(block.text ?? "");
      }
      return "";
    }).join("");
  }
  return String(content ?? "");
}
function queryTopicTokens(topic) {
  return String(topic ?? "").toLowerCase().split(/[\s,，、|／/·\-_:：;；]+/).map((t) => t.trim()).filter((t) => t.length >= 2);
}
function querySelectRelevantMediaHeuristic(topic, candidates, maxCount) {
  const tokens = queryTopicTokens(topic);
  const ranked = candidates.map((c, index2) => {
    const hay = `${c.label ?? ""} ${c.url}`.toLowerCase();
    const decorative = /logo|icon|avatar|sprite|emoji|qrcode|二维码|广告|banner-ad/i.test(
      hay
    );
    const hits = tokens.length ? tokens.filter((t) => hay.includes(t)).length : 0;
    let score = c.score ?? 0;
    if (c.inViewport) score += 8e4;
    if (decorative) score -= 1e6;
    if (tokens.length) {
      score += hits * 5e4;
      if (hits === 0) score -= 4e4;
    }
    if (c.kind === "audio" && tokens.length && hits === 0) {
      score -= 3e4;
    }
    return { index: index2, score, decorative, hits };
  }).filter((r) => !(tokens.length && r.decorative)).sort((a, b) => b.score - a.score);
  const preferred = tokens.length > 0 ? ranked.filter((r) => r.hits > 0) : ranked;
  const pool = preferred.length > 0 ? preferred : ranked;
  const urls = pool.slice(0, maxCount).map((r) => candidates[r.index].url);
  return {
    urls,
    strategy: "heuristic",
    note: tokens.length ? `启发式按主题「${topic}」与视口/标签筛选 ${urls.length}/${candidates.length}` : `启发式按视口与尺寸筛选 ${urls.length}/${candidates.length}（未提供主题词）`
  };
}
async function querySelectRelevantMedia(opts) {
  const topic = String(opts.topic ?? "").trim();
  const maxCount = Math.min(Math.max(opts.maxCount, 1), 20);
  const candidates = opts.candidates.filter((c) => /^https?:\/\//i.test(c.url));
  if (!candidates.length) {
    return { urls: [], strategy: "heuristic", note: "无可用候选" };
  }
  if (candidates.length <= maxCount && !opts.screenshotPng && !topic) {
    return {
      urls: candidates.slice(0, maxCount).map((c) => c.url),
      strategy: "heuristic",
      note: "候选不多，直接采用"
    };
  }
  const fallback = () => querySelectRelevantMediaHeuristic(topic || "页面主图", candidates, maxCount);
  if (opts.signal?.aborted) throw new Error("用户已中止");
  const settings = querySettings();
  if (!settings.apiKey || !opts.screenshotPng?.length) {
    return fallback();
  }
  try {
    const model = createChatModel(settings, "default", "vision").withConfig({
      temperature: 0.1,
      // 一次性 JSON，不需要流式
      streaming: false
    });
    const listText = candidates.map((c, i) => {
      const label = (c.label || "").trim() || "(无标题)";
      const flag = c.inViewport ? "视口内" : "视口外";
      return `${i + 1}. [${c.kind}/${flag}] ${label}
   URL: ${c.url}`;
    }).join("\n");
    const b64 = opts.screenshotPng.toString("base64");
    const human = new messages.HumanMessage({
      content: [
        {
          type: "text",
          text: `主题：${topic || "（未指定，请选与正文主内容最相关的配图/视频）"}
最多选 ${maxCount} 个编号。

候选列表：
${listText}

请结合上方截图判断屏幕上可见内容，只选与主题相关的编号。`
        },
        {
          type: "image_url",
          image_url: { url: `data:image/png;base64,${b64}` }
        }
      ]
    });
    const result = await model.invoke([new messages.SystemMessage(SYSTEM_PROMPT), human], {
      signal: opts.signal
    });
    const parsed = queryParseJsonObject(queryLlmTextContent$1(result.content));
    const indexes = queryParseSelectedIndexes(parsed?.selected, candidates.length, maxCount);
    if (!indexes.length) {
      console.warn("[media-relevance] vision 未返回有效编号，回退启发式");
      return fallback();
    }
    const urls = indexes.map((i) => candidates[i].url);
    const reason = typeof parsed?.reason === "string" && parsed.reason.trim() ? parsed.reason.trim() : "vision 屏幕识别";
    return {
      urls,
      strategy: "vision",
      note: `屏幕识别选定 ${urls.length}/${candidates.length}：${reason}`
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn("[media-relevance] vision failed, fallback:", msg);
    const fb = fallback();
    return { ...fb, note: `${fb.note}（vision 失败：${msg}）` };
  }
}
async function queryPageViewportScreenshot(page) {
  try {
    const buf = await page.screenshot({ type: "png", fullPage: false });
    return Buffer.isBuffer(buf) ? buf : Buffer.from(buf);
  } catch (err) {
    console.warn("[media-relevance] screenshot failed:", err);
    return null;
  }
}
const FETCH_SAFE_IMAGE_EXTS = /* @__PURE__ */ new Set([".jpg", ".jpeg", ".png", ".webp"]);
function queryIsFetchSafeImageExt(extOrPath) {
  const ext = (extOrPath.startsWith(".") ? extOrPath : path.extname(extOrPath)).toLowerCase();
  return FETCH_SAFE_IMAGE_EXTS.has(ext);
}
function postNormalizeFetchedImageToSafeFormat(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return null;
  if (queryIsFetchSafeImageExt(filePath)) return filePath;
  const dir = path.dirname(filePath);
  const base2 = path.basename(filePath, path.extname(filePath)) || "image";
  const outPath = path.join(dir, `${base2}.jpg`);
  try {
    const img = electron.nativeImage.createFromPath(filePath);
    if (img.isEmpty()) {
      console.warn("[fetchWebImages] 无法解码非安全格式图片:", filePath);
      return null;
    }
    fs.writeFileSync(outPath, img.toJPEG(90));
    if (outPath !== filePath) {
      try {
        fs.unlinkSync(filePath);
      } catch {
      }
    }
    console.info("[fetchWebImages] normalized", filePath, "→", outPath);
    return outPath;
  } catch (err) {
    console.warn("[fetchWebImages] normalize failed:", filePath, err);
    return null;
  }
}
async function fetchWebImages(opts) {
  const maxCount = Math.min(Math.max(opts.maxCount ?? 3, 1), 9);
  const subdir = opts.subdir ?? "xhs-images";
  const topic = String(opts.topic ?? "").trim();
  const outDir = path.join(getArtifactsDir(), subdir, String(Date.now()));
  fs.mkdirSync(outDir, { recursive: true });
  const candidates = [];
  let screenshotPng = null;
  let filterNote = "";
  if (opts.imageUrls?.length) {
    for (const u of opts.imageUrls) {
      if (u && /^https?:\/\//i.test(u) && !candidates.some((c) => c.url === u)) {
        candidates.push({ url: u, kind: "image", label: u.split("/").pop() });
      }
    }
  }
  if (opts.pageUrl) {
    if (opts.signal?.aborted) throw new Error("用户已中止");
    const fromPage = await extractImageCandidatesFromPage(opts.pageUrl, maxCount * 4);
    screenshotPng = fromPage.screenshotPng;
    for (const c of fromPage.candidates) {
      if (!candidates.some((x) => x.url === c.url)) candidates.push(c);
    }
  }
  if (!candidates.length) {
    return {
      paths: [],
      sources: [],
      message: "未找到可用图片。请提供 pageUrl（内容来源页）或 imageUrls（图片直链）；也可让用户可选地上传本地图片。"
    };
  }
  let urlsToDownload = candidates.map((c) => c.url);
  if (topic || screenshotPng) {
    const selected = await querySelectRelevantMedia({
      topic: topic || "页面正文主图",
      candidates,
      maxCount,
      screenshotPng: screenshotPng ?? void 0,
      signal: opts.signal
    });
    urlsToDownload = selected.urls;
    filterNote = selected.note;
    console.info("[fetchWebImages] relevance:", selected.strategy, selected.note);
  } else {
    urlsToDownload = candidates.slice(0, maxCount).map((c) => c.url);
  }
  if (!urlsToDownload.length) {
    return {
      paths: [],
      sources: [],
      message: `候选 ${candidates.length} 张经相关性筛选后无一保留` + (filterNote ? `（${filterNote}）` : "") + "。请换更明确的 topic，或改传 imageUrls。"
    };
  }
  const paths = [];
  const sources = [];
  let index2 = 0;
  for (const url2 of urlsToDownload) {
    if (paths.length >= maxCount) break;
    if (opts.signal?.aborted) throw new Error("用户已中止");
    try {
      const saved = await downloadImageToFile(url2, outDir, index2, {
        pageUrl: opts.pageUrl
      });
      if (saved) {
        paths.push(saved);
        sources.push(url2);
        index2 += 1;
      }
    } catch (err) {
      console.warn("[fetchWebImages] download failed:", url2, err);
    }
  }
  if (!paths.length) {
    return {
      paths: [],
      sources: [],
      message: `候选 ${urlsToDownload.length} 张均下载失败（常见原因：CDN 防盗链 403，如抖音/小红书图床）。请换来源 pageUrl、改传可访问的 imageUrls，或让用户本地上传配图。`
    };
  }
  const head = filterNote ? `已按相关性保存 ${paths.length} 张配图（${filterNote}）：
` : `已从网页保存 ${paths.length} 张配图到本地：
`;
  return {
    paths,
    sources,
    message: head + paths.map((p, i) => {
      const name = p.replace(/\\/g, "/").split("/").pop() || `image-${i + 1}`;
      return `${i + 1}. ${queryFormatMarkdownImage(name, p)}
   ← ${sources[i]}`;
    }).join("\n")
  };
}
async function extractImageCandidatesFromPage(pageUrl, limit) {
  const browser = getBrowserService();
  await browser.ensureStarted();
  await browser.navigate(pageUrl);
  const page = browser.getPage();
  if (!page) return { candidates: [], screenshotPng: null };
  await page.waitForTimeout(1800);
  const raw = await page.evaluate((max) => {
    const abs = (src) => {
      try {
        return new URL(src, location.href).href;
      } catch {
        return "";
      }
    };
    const list = [];
    const seen = /* @__PURE__ */ new Set();
    const push = (rawUrl, score, label, inViewport) => {
      if (!rawUrl || rawUrl.startsWith("data:")) return;
      const full = abs(rawUrl);
      if (!full || !/^https?:\/\//i.test(full) || seen.has(full)) return;
      if (/\.(svg)(\?|$)/i.test(full)) return;
      let s = score;
      if (/sprite|icon|logo|avatar|emoji|pixel|1x1/i.test(full + label)) {
        s -= 50;
      }
      seen.add(full);
      list.push({ url: full, score: s, label: label.slice(0, 120), inViewport });
    };
    const vh = window.innerHeight || 800;
    const vw = window.innerWidth || 1200;
    for (const img of Array.from(document.images)) {
      const w = img.naturalWidth || img.width || 0;
      const h = img.naturalHeight || img.height || 0;
      const area = w * h;
      if (area > 0 && (w < 120 || h < 120)) continue;
      const src = img.currentSrc || img.src || img.getAttribute("data-src") || img.getAttribute("data-original") || "";
      const rect = img.getBoundingClientRect();
      const inViewport = rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.right > 0 && rect.top < vh && rect.left < vw;
      const label = img.getAttribute("alt") || img.getAttribute("title") || img.getAttribute("aria-label") || "";
      push(src, area || 1e4, label, inViewport);
      const srcset = img.getAttribute("srcset");
      if (srcset) {
        const best = srcset.split(",").map((p) => p.trim().split(/\s+/)[0]).filter(Boolean).pop();
        if (best) push(best, (area || 1e4) + 1, label, inViewport);
      }
    }
    for (const sel of [
      'meta[property="og:image"]',
      'meta[name="twitter:image"]',
      'meta[property="og:image:url"]'
    ]) {
      const el = document.querySelector(sel);
      const content = el?.getAttribute("content");
      if (content) push(content, 5e5, "og:image", true);
    }
    for (const el of Array.from(document.querySelectorAll('[style*="background"]'))) {
      const bg = getComputedStyle(el).backgroundImage;
      const m = bg.match(/url\(["']?(https?:[^"')]+)["']?\)/i);
      if (m) {
        const rect = el.getBoundingClientRect();
        const inViewport = rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.right > 0 && rect.top < vh && rect.left < vw;
        push(m[1], 2e4, "background", inViewport);
      }
    }
    list.sort((a, b) => b.score - a.score);
    return list.slice(0, max);
  }, limit);
  const screenshotPng = await queryPageViewportScreenshot(page);
  const candidates = raw.map((c) => ({
    url: c.url,
    kind: "image",
    label: c.label,
    score: c.score,
    inViewport: c.inViewport
  }));
  return { candidates, screenshotPng };
}
function queryImageDownloadReferer(imageUrl, pageUrl) {
  try {
    const imgHost = new URL(imageUrl).hostname.toLowerCase();
    if (pageUrl && /^https?:\/\//i.test(pageUrl)) {
      const pageHost = new URL(pageUrl).hostname.toLowerCase();
      if (imageUrl.includes(pageHost) || queryIsCdnRelatedToPage(imgHost, pageHost)) {
        return pageUrl;
      }
    }
    if (/douyinpic\.com|byteimg\.com|bytednsdoc\.com|ibyteimg\.com/i.test(imgHost)) {
      return "https://www.douyin.com/";
    }
    if (/xhscdn\.com|xiaohongshu\.com|xhslink\.com/i.test(imgHost)) {
      return "https://www.xiaohongshu.com/";
    }
    if (/weibo\.cn|weibo\.com|sinaimg\.cn/i.test(imgHost)) {
      return "https://weibo.com/";
    }
    if (pageUrl && /^https?:\/\//i.test(pageUrl)) return pageUrl;
    return `${new URL(imageUrl).protocol}//${new URL(imageUrl).host}/`;
  } catch {
    return pageUrl && /^https?:\/\//i.test(pageUrl) ? pageUrl : "";
  }
}
function queryIsCdnRelatedToPage(imgHost, pageHost) {
  if (imgHost.includes(pageHost) || pageHost.includes(imgHost)) return true;
  const pairs = [
    [/douyinpic\.com|byteimg\.com|ibyteimg\.com/i, /douyin\.com/i],
    [/xhscdn\.com/i, /xiaohongshu\.com|xhslink\.com/i],
    [/sinaimg\.cn/i, /weibo\.(com|cn)/i]
  ];
  return pairs.some(([cdn, site]) => cdn.test(imgHost) && site.test(pageHost));
}
function queryPreferHttpsImageUrl(url2) {
  try {
    const u = new URL(url2);
    if (u.protocol === "http:") {
      u.protocol = "https:";
      return u.toString();
    }
  } catch {
  }
  return url2;
}
async function downloadImageToFile(url2, outDir, index2, opts) {
  const candidates = [queryPreferHttpsImageUrl(url2)];
  if (candidates[0] !== url2) candidates.push(url2);
  let lastError;
  for (const tryUrl of candidates) {
    try {
      return await downloadImageOnce(tryUrl, outDir, index2, opts?.pageUrl);
    } catch (err) {
      lastError = err;
      const status = err instanceof HttpError ? err.status : 0;
      if (status === 403 || status === 401) {
        try {
          return await downloadImageViaBrowserRequest(tryUrl, outDir, index2, opts?.pageUrl);
        } catch (browserErr) {
          lastError = browserErr;
        }
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}
async function downloadImageOnce(url2, outDir, index2, pageUrl) {
  const referer = queryImageDownloadReferer(url2, pageUrl);
  const res = await queryHttp(url2, {
    timeoutMs: 3e4,
    headers: {
      Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
      ...referer ? { Referer: referer } : {}
    }
  });
  if (!res.body) {
    throw new Error("响应无 body");
  }
  const contentType = res.headers.get("content-type") || "";
  if (contentType && !contentType.startsWith("image/") && !contentType.includes("octet-stream")) {
    if (!/\.(jpe?g|png|webp|gif|bmp)(\?|$)/i.test(url2)) {
      throw new Error(`非图片类型: ${contentType}`);
    }
  }
  const ext = guessExt(url2, contentType);
  const filePath = path.join(outDir, `image-${index2 + 1}${ext}`);
  await promises.pipeline(
    stream.Readable.fromWeb(res.body),
    fs.createWriteStream(filePath)
  );
  if (!fs.existsSync(filePath)) return null;
  return postNormalizeFetchedImageToSafeFormat(filePath);
}
async function downloadImageViaBrowserRequest(url2, outDir, index2, pageUrl) {
  const browser = getBrowserService();
  await browser.ensureStarted();
  const page = browser.getPage();
  if (!page) throw new Error("浏览器未就绪，无法兜底下载图片");
  const referer = queryImageDownloadReferer(url2, pageUrl);
  const response = await page.context().request.get(url2, {
    timeout: 3e4,
    headers: {
      Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
      ...referer ? { Referer: referer } : {}
    }
  });
  if (!response.ok()) {
    throw new HttpError(`HTTP ${response.status()}`, response.status(), url2);
  }
  const contentType = response.headers()["content-type"] || "";
  const ext = guessExt(url2, contentType);
  const filePath = path.join(outDir, `image-${index2 + 1}${ext}`);
  fs.writeFileSync(filePath, await response.body());
  if (!fs.existsSync(filePath)) return null;
  return postNormalizeFetchedImageToSafeFormat(filePath);
}
function guessExt(url2, contentType) {
  const fromType = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif"
  };
  for (const [k, v] of Object.entries(fromType)) {
    if (contentType.includes(k)) return v;
  }
  const pathPart = url2.split("?")[0];
  const ext = path.extname(pathPart).toLowerCase();
  if ([".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext)) {
    return ext === ".jpeg" ? ".jpg" : ext;
  }
  return ".jpg";
}
const XHS_TITLE_MAX_LENGTH = {
  image: 20,
  video: 20,
  audio: 20,
  /** 长文标题略宽于图文 */
  article: 40
};
const XHS_CONTENT_MAX_LENGTH = {
  image: 1e3,
  video: 1e3,
  audio: 1e3,
  article: 1e4
};
function queryClampXhsPublishText(input) {
  const titleMax = XHS_TITLE_MAX_LENGTH[input.publishType];
  const contentMax = XHS_CONTENT_MAX_LENGTH[input.publishType];
  const rawTitle = String(input.title ?? "");
  const rawContent = String(input.content ?? "");
  const titleTruncated = rawTitle.length > titleMax;
  const contentTruncated = rawContent.length > contentMax;
  return {
    title: titleTruncated ? rawTitle.slice(0, titleMax) : rawTitle,
    content: contentTruncated ? rawContent.slice(0, contentMax) : rawContent,
    titleTruncated,
    contentTruncated,
    titleMax,
    contentMax
  };
}
const OBSERVATION_DAYS = 14;
const OBSERVATION_START = "2026-08-04";
const LIMITS = {
  publishPerDayStable: 1,
  publishPerDayObservation: 1,
  publishPerWeekStable: 7,
  publishPerWeekObservation: 3,
  minHoursBetweenPublishObservation: 48
};
function getStorePath() {
  return path.join(getDataRoot(), "xhs-behavior-stats.json");
}
function todayKey() {
  const d = /* @__PURE__ */ new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function parseDateKey(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function isDateInRange(key, start, end) {
  const t = parseDateKey(key).getTime();
  return t >= parseDateKey(start).getTime() && t <= parseDateKey(end).getTime();
}
function queryInObservationPeriod() {
  const today = todayKey();
  if (parseDateKey(today) < parseDateKey(OBSERVATION_START)) return false;
  const end = new Date(parseDateKey(OBSERVATION_START));
  end.setDate(end.getDate() + OBSERVATION_DAYS);
  const endKey = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-${String(end.getDate()).padStart(2, "0")}`;
  return isDateInRange(today, OBSERVATION_START, endKey);
}
function readStore() {
  const path2 = getStorePath();
  if (!fs.existsSync(path2)) return { days: {} };
  try {
    return JSON.parse(fs.readFileSync(path2, "utf-8"));
  } catch {
    return { days: {} };
  }
}
function writeStore(store) {
  fs.writeFileSync(getStorePath(), JSON.stringify(store, null, 2), "utf-8");
}
function ensureToday(store) {
  const key = todayKey();
  if (!store.days[key]) {
    store.days[key] = { date: key, publish: 0, like: 0, comment: 0, follow: 0 };
  }
  return store.days[key];
}
function queryPublishCountLast7Days(store) {
  const keys = Object.keys(store.days).sort().slice(-7);
  return keys.reduce((sum, k) => sum + (store.days[k]?.publish ?? 0), 0);
}
function queryXhsPublishWindowBlock() {
  const now = /* @__PURE__ */ new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  const windowStart = 8 * 60;
  const windowEnd = 23 * 60;
  const inWindow = minutes >= windowStart && minutes <= windowEnd;
  if (inWindow) return null;
  return "当前不在允许的小红书脚本发布时段（8:00～23:00）。请改在允许时段由本人在场手动启动发布；深夜 0:00～6:00 亦禁止自动化。";
}
function queryXhsQuietHoursBlock() {
  const hour = (/* @__PURE__ */ new Date()).getHours();
  if (hour >= 0 && hour < 6) {
    return "当前为深夜静默时段（0:00～6:00），已暂停小红书自动化操作以降低风控风险。请稍后再试。";
  }
  return null;
}
function queryXhsOffPeakPublishWarning() {
  const block = queryXhsPublishWindowBlock();
  return block;
}
function queryXhsUnattendedBlock(sessionId) {
  if (!sessionId) return null;
  const session = querySession(sessionId);
  if (!session) return null;
  if (session.title.startsWith("[定时]")) {
    return "检测到当前会话来自定时任务自动触发。小红书发布已禁止无人值守执行，请由本人在场于聊天中手动发起发布，或关闭相关定时任务中的小红书步骤。";
  }
  if (session.title.startsWith("[流程]")) {
    return "检测到当前会话来自流程自动编排。小红书拟人发布仅支持人工主动触发的一次性会话，请在工作台手动执行发布步骤，勿用定时/后台流程托管发文。";
  }
  return null;
}
function queryObservationIntervalBlock(store) {
  if (!queryInObservationPeriod()) return null;
  const last = store.lastPublishAt;
  if (!last) return null;
  const elapsedH = (Date.now() - last) / (1e3 * 60 * 60);
  if (elapsedH < LIMITS.minHoursBetweenPublishObservation) {
    const waitH = Math.ceil(LIMITS.minHoursBetweenPublishObservation - elapsedH);
    return `解封观察期内每 2 天最多发布 1 条。距上次发布未满 48 小时，请约 ${waitH} 小时后再试，或改用手动网页发布。`;
  }
  return null;
}
function assertXhsBehaviorAllowed(action, sessionId) {
  const unattended = queryXhsUnattendedBlock(sessionId);
  if (unattended) throw new Error(unattended);
  const quiet = queryXhsQuietHoursBlock();
  if (quiet) throw new Error(quiet);
  const windowBlock = queryXhsPublishWindowBlock();
  if (windowBlock) throw new Error(windowBlock);
  const store = readStore();
  const today = ensureToday(store);
  const observation = queryInObservationPeriod();
  const dayLimit = observation ? LIMITS.publishPerDayObservation : LIMITS.publishPerDayStable;
  const weekLimit = observation ? LIMITS.publishPerWeekObservation : LIMITS.publishPerWeekStable;
  const intervalBlock = queryObservationIntervalBlock(store);
  if (intervalBlock) throw new Error(intervalBlock);
  if (today.publish >= dayLimit) {
    throw new Error(`今日已发布 ${today.publish} 篇笔记，已达安全上限（≤${dayLimit} 篇/日）。请明日再试。`);
  }
  const weekPublish = queryPublishCountLast7Days(store);
  if (weekPublish >= weekLimit) {
    throw new Error(
      `近 7 日已发布 ${weekPublish} 篇，已达${observation ? "观察期" : ""}安全上限（≤${weekLimit} 篇/周）。请降低发布频率。`
    );
  }
}
function postRecordXhsBehavior(action) {
  const store = readStore();
  const today = ensureToday(store);
  today[action] += 1;
  {
    store.lastPublishAt = Date.now();
  }
  writeStore(store);
}
function postVaryXhsPublishImages(imagePaths, outDir) {
  if (!imagePaths.length) return [];
  fs.mkdirSync(outDir, { recursive: true });
  const results = [];
  for (let i = 0; i < imagePaths.length; i++) {
    const src = imagePaths[i];
    if (!fs.existsSync(src)) continue;
    const ext = path.extname(src).toLowerCase();
    const base2 = path.basename(src, ext);
    const outPath = path.join(outDir, `${base2}-varied-${i + 1}.jpg`);
    try {
      const varied = varySingleImage(src);
      if (varied) {
        fs.writeFileSync(outPath, varied);
        results.push(outPath);
      } else {
        results.push(src);
      }
    } catch (err) {
      console.warn("[xhs-image-variation] skip:", src, err);
      results.push(src);
    }
  }
  return results.length ? results : [...imagePaths];
}
function varySingleImage(inputPath) {
  const img = electron.nativeImage.createFromPath(inputPath);
  if (img.isEmpty()) return null;
  const size = img.getSize();
  if (size.width < 80 || size.height < 80) return null;
  const cropRatio = rand(0.02, 0.05);
  const cropX = Math.floor(size.width * cropRatio * rand(0.3, 1));
  const cropY = Math.floor(size.height * cropRatio * rand(0.3, 1));
  const cropW = size.width - cropX - Math.floor(size.width * cropRatio * rand(0.3, 1));
  const cropH = size.height - cropY - Math.floor(size.height * cropRatio * rand(0.3, 1));
  let processed = img.crop({
    x: Math.max(0, cropX),
    y: Math.max(0, cropY),
    width: Math.max(64, cropW),
    height: Math.max(64, cropH)
  });
  const scale = rand(0.95, 1.03);
  const newW = Math.max(64, Math.floor(processed.getSize().width * scale));
  processed = processed.resize({ width: newW });
  const quality = Math.floor(rand(82, 93));
  return processed.toJPEG(quality);
}
const XHS_PUBLISH_BASE_URL = "https://creator.xiaohongshu.com/publish/publish";
const XHS_PUBLISH_URLS = {
  video: `${XHS_PUBLISH_BASE_URL}?from=menu&target=video`,
  image: `${XHS_PUBLISH_BASE_URL}?from=menu&target=image`,
  article: `${XHS_PUBLISH_BASE_URL}?from=menu&target=article`,
  audio: `${XHS_PUBLISH_BASE_URL}?from=menu&target=audio`
};
const XHS_PUBLISH_TYPE_LABELS = {
  image: "上传图文",
  video: "上传视频",
  article: "写长文",
  audio: "发播客"
};
function queryMatchXhsImageTabLabel(text) {
  const n = text.replace(/\s+/g, "");
  if (!n) return false;
  if (n.includes("长文") || n.includes("视频") || n.includes("播客")) return false;
  return n === "上传图文" || n === "图文" || n.includes("上传图文") || n === "图片";
}
function queryNormalizeXhsPublishType(raw) {
  if (raw == null) return null;
  const n = String(raw).trim().toLowerCase().replace(/\s+/g, "");
  if (!n) return null;
  if (n === "image" || n === "img" || n.includes("图文") || n === "图片" || n === "note") {
    return "image";
  }
  if (n === "video" || n.includes("视频")) return "video";
  if (n === "article" || n === "long" || n.includes("长文") || n.includes("文章")) {
    return "article";
  }
  if (n === "audio" || n === "podcast" || n.includes("播客") || n.includes("音频")) {
    return "audio";
  }
  return null;
}
function queryInferXhsPublishType(input) {
  const explicit = queryNormalizeXhsPublishType(input.publishType);
  if (explicit) return explicit;
  const videos = (input.videoPaths ?? []).filter(Boolean);
  if (videos.length > 0) return "video";
  const audios = (input.audioPaths ?? []).filter(Boolean);
  if (audios.length > 0) return "audio";
  const images = (input.imagePaths ?? []).filter(Boolean);
  const contentLen = (input.content ?? "").trim().length;
  if (contentLen >= 140 && images.length === 0) return "article";
  return "image";
}
function queryBuildXhsPublishUrl(type) {
  return XHS_PUBLISH_URLS[type] ?? XHS_PUBLISH_URLS.image;
}
function queryIsXhsImagePublishModeFromSignals(signals) {
  const tab = (signals.activeTabText || "").replace(/\s+/g, "");
  if (tab) {
    if (queryMatchXhsImageTabLabel(tab)) return true;
    if (tab.includes("视频") || tab.includes("长文") || tab.includes("播客")) return false;
  }
  const body = signals.bodyText || "";
  const accept = (signals.fileAccept || "").toLowerCase();
  if (/拖拽图片|上传图片/.test(body)) return true;
  if (accept.includes("image") && !accept.includes("video")) return true;
  if (/拖拽视频|上传视频/.test(body)) return false;
  if (accept.includes("video") && !accept.includes("image")) return false;
  return false;
}
async function removeXhsPopoverOverlay(page) {
  await page.evaluate(() => {
    document.querySelectorAll("div.d-popover, div.d-modal-mask").forEach((el) => {
      el.remove();
    });
  });
  await humanClickAt(page, 380 + Math.random() * 80, 28 + Math.random() * 40);
  await humanMicroPause();
}
async function queryXhsPublishModeSignals(page) {
  return page.evaluate(() => {
    const tabSelectors = [
      "div.creator-tab",
      '[class*="creator-tab"]',
      '[role="tab"]',
      '.header-tabs [class*="tab"]'
    ];
    const tabs = [];
    for (const sel of tabSelectors) {
      document.querySelectorAll(sel).forEach((el) => tabs.push(el));
    }
    let activeTabText = "";
    for (const tab of tabs) {
      const text = (tab.innerText || tab.textContent || "").trim();
      if (!text) continue;
      const cls = typeof tab.className === "string" ? tab.className : "";
      const active = /active|selected|current|is-active|tab-active/i.test(cls) || tab.getAttribute("aria-selected") === "true" || tab.getAttribute("data-active") === "true";
      if (active) {
        activeTabText = text;
        break;
      }
    }
    const input = document.querySelector(
      '.upload-input, input[type="file"]'
    );
    return {
      activeTabText,
      bodyText: (document.body?.innerText || "").slice(0, 4e3),
      fileAccept: input?.accept || ""
    };
  });
}
async function queryIsXhsImagePublishMode(page) {
  const signals = await queryXhsPublishModeSignals(page);
  return queryIsXhsImagePublishModeFromSignals(signals);
}
async function queryCreatorTabHit(page) {
  return page.evaluate(() => {
    const matchLabel = (raw) => {
      const n = raw.replace(/\s+/g, "");
      if (!n) return false;
      if (n.includes("长文") || n.includes("视频") || n.includes("播客")) return false;
      return n === "上传图文" || n === "图文" || n.includes("上传图文") || n === "图片";
    };
    const selectors = [
      "div.creator-tab",
      '[class*="creator-tab"]',
      '[role="tab"]',
      '.header-tabs [class*="tab"]'
    ];
    const seen = /* @__PURE__ */ new Set();
    for (const sel of selectors) {
      const tabs = Array.from(document.querySelectorAll(sel));
      for (const tab of tabs) {
        if (seen.has(tab)) continue;
        seen.add(tab);
        const text = (tab.innerText || tab.textContent || "").trim();
        if (!matchLabel(text)) continue;
        const rect = tab.getBoundingClientRect();
        if (rect.width < 2 || rect.height < 2) continue;
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        const target = document.elementFromPoint(x, y);
        const blocked = !(target === tab || tab.contains(target));
        return { x, y, blocked };
      }
    }
    return null;
  });
}
async function postClickXhsImageTabInDom(page) {
  return page.evaluate(() => {
    const matchLabel = (raw) => {
      const n = raw.replace(/\s+/g, "");
      if (!n) return false;
      if (n.includes("长文") || n.includes("视频") || n.includes("播客")) return false;
      return n === "上传图文" || n === "图文" || n.includes("上传图文") || n === "图片";
    };
    const nodes = Array.from(
      document.querySelectorAll(
        'div.creator-tab, [class*="creator-tab"], [role="tab"], button, span, a, div'
      )
    );
    for (const el of nodes) {
      const text = (el.innerText || el.textContent || "").trim();
      if (text.length > 12) continue;
      if (!matchLabel(text)) continue;
      const rect = el.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) continue;
      el.click();
      return true;
    }
    return false;
  });
}
async function clickXhsImageTab(page, timeoutMs = 18e3) {
  const deadline = Date.now() + timeoutMs;
  await page.locator('div.upload-content, div.creator-tab, [class*="creator-tab"]').first().waitFor({ state: "visible", timeout: Math.min(timeoutMs, 12e3) }).catch(() => void 0);
  if (await queryIsXhsImagePublishMode(page)) return true;
  let navigatedFallback = false;
  while (Date.now() < deadline) {
    if (await queryIsXhsImagePublishMode(page)) return true;
    await removeXhsPopoverOverlay(page);
    const hit = await queryCreatorTabHit(page);
    if (hit) {
      if (hit.blocked) {
        await removeXhsPopoverOverlay(page);
        await sleep$1(250);
        await postClickXhsImageTabInDom(page);
      } else {
        await humanClickAt(page, hit.x, hit.y);
      }
      await humanStepPause({ min: 700, max: 1600 });
      if (await queryIsXhsImagePublishMode(page)) return true;
    } else {
      await humanClickText(page, ["上传图文", "图文"], { timeoutPer: 1200 });
      await humanStepPause({ min: 500, max: 1200 });
      if (await queryIsXhsImagePublishMode(page)) return true;
      await postClickXhsImageTabInDom(page);
      await sleep$1(600);
      if (await queryIsXhsImagePublishMode(page)) return true;
    }
    if (!navigatedFallback && Date.now() + 2500 < deadline) {
      navigatedFallback = true;
      await page.goto(queryBuildXhsPublishUrl("image"), { waitUntil: "domcontentloaded" }).catch(() => void 0);
      await humanStepPause({ min: 1500, max: 3200 });
      if (await queryIsXhsImagePublishMode(page)) return true;
    }
    await sleep$1(280);
  }
  return queryIsXhsImagePublishMode(page);
}
async function waitForXhsPublishReady(page, timeoutMs = 15e3) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const ready = await page.evaluate(() => {
      const widgets = Array.from(document.querySelectorAll("xhs-publish-btn"));
      for (const widget of widgets) {
        if (widget.getAttribute("is-publish") === "false") continue;
        const rect = widget.getBoundingClientRect();
        if (rect.width < 2 || rect.height < 2) continue;
        if (widget.getAttribute("submit-disabled") === "true") return false;
        return true;
      }
      const oldBtn = document.querySelector(
        ".publish-page-publish-btn button.bg-red"
      );
      if (oldBtn && !oldBtn.disabled) return true;
      return false;
    });
    if (ready) return true;
    await sleep$1(500);
  }
  return false;
}
async function invokeXhsPublishAction(page, mode) {
  return page.evaluate((actionMode) => {
    const widgets = Array.from(document.querySelectorAll("xhs-publish-btn"));
    const publishNames = ["_onPublish", "_onSubmit", "onPublish", "_handlePublish"];
    const draftNames = ["_onSave", "_onSaveDraft", "onSave", "_handleSave"];
    const names = actionMode === "publish" ? publishNames : draftNames;
    const disabledAttr = actionMode === "publish" ? "submit-disabled" : "save-disabled";
    for (const widget of widgets) {
      const rect = widget.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) continue;
      if (widget.getAttribute("is-publish") === "false") continue;
      if (widget.getAttribute(disabledAttr) === "true") {
        return { ok: false, method: "disabled", error: "按钮处于禁用状态" };
      }
      const host = widget;
      for (const name of names) {
        const fn = host[name];
        if (typeof fn === "function") {
          try {
            ;
            fn.call(widget);
            return { ok: true, method: name };
          } catch (e) {
            return { ok: false, method: name, error: String(e) };
          }
        }
      }
      const types = ["pointerover", "pointerenter", "pointerdown", "pointerup", "click"];
      for (const type of types) {
        widget.dispatchEvent(
          new PointerEvent(type, { bubbles: true, cancelable: true, view: window })
        );
      }
      return { ok: true, method: "dispatchEvent" };
    }
    return { ok: false, method: "none", error: "未找到 xhs-publish-btn" };
  }, mode);
}
async function queryXhsPublishClickPoint(page) {
  return page.evaluate(() => {
    const widgets = Array.from(document.querySelectorAll("xhs-publish-btn"));
    for (const widget of widgets) {
      if (widget.getAttribute("is-publish") === "false") continue;
      if (widget.getAttribute("submit-disabled") === "true") continue;
      const rect = widget.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) continue;
      return {
        x: rect.left + rect.width * 0.65,
        y: rect.top + rect.height / 2
      };
    }
    return null;
  });
}
async function clickLegacyPublishButton(page) {
  const btn = page.locator(".publish-page-publish-btn button.bg-red").first();
  try {
    if (await btn.isVisible({ timeout: 1200 })) {
      await humanClickLocator(page, btn);
      return true;
    }
  } catch {
  }
  return false;
}
async function scrollXhsPublishFooterIntoView(page) {
  const rounds = Math.floor(rand(2, 4));
  for (let i = 0; i < rounds; i++) {
    await humanBezierScroll(page, {
      direction: "down",
      distance: rand(380, 720)
    });
  }
  await page.evaluate(() => {
    const forceBottom = (el) => {
      const target = el instanceof Document ? el.documentElement : el;
      try {
        target.scrollTop = target.scrollHeight;
      } catch {
      }
    };
    forceBottom(document);
    forceBottom(document.body);
    document.querySelectorAll('[class*="scroll"], [class*="content"], main, [role="main"]').forEach((el) => {
      const h = el;
      if (h.scrollHeight > h.clientHeight + 80) forceBottom(h);
    });
    const widget = document.querySelector("xhs-publish-btn") || document.querySelector(".publish-page-publish-btn");
    widget?.scrollIntoView({ block: "center", inline: "center" });
  });
  await sleep$1(rand(280, 520));
  await humanBezierScroll(page, { direction: "down", distance: rand(120, 280) });
}
async function dwellBeforeXhsPublish(page) {
  const vp = page.viewportSize() ?? { width: 1280, height: 800 };
  await humanBezierMoveTo(page, {
    x: rand(vp.width * 0.55, vp.width * 0.92),
    y: rand(vp.height * 0.75, vp.height * 0.95)
  });
  await sleep$1(rand(400, 900));
  if (Math.random() < 0.55) {
    await humanBezierScroll(page, {
      direction: Math.random() < 0.4 ? "up" : "down",
      distance: rand(50, 140)
    });
    await humanBezierScroll(page, { direction: "down", distance: rand(70, 180) });
  }
  await humanStepPause({ min: 3500, max: 9e3 });
  await humanBezierMoveTo(page, {
    x: rand(vp.width * 0.7, vp.width * 0.96),
    y: rand(vp.height * 0.8, vp.height * 0.97)
  });
  await sleep$1(rand(350, 800));
}
async function clickXhsPublishButton(page) {
  await removeXhsPopoverOverlay(page);
  const ready = await waitForXhsPublishReady(page);
  if (!ready) return false;
  await scrollXhsPublishFooterIntoView(page);
  await dwellBeforeXhsPublish(page);
  await removeXhsPopoverOverlay(page);
  const invoked = await invokeXhsPublishAction(page, "publish");
  if (invoked.ok) {
    await sleep$1(rand(500, 900));
    if (await clickXhsConfirmDialog(page)) return true;
  }
  const point = await queryXhsPublishClickPoint(page);
  if (point) {
    await humanClickAt(page, point.x, point.y);
    await sleep$1(rand(500, 900));
    if (await clickXhsConfirmDialog(page)) return true;
    return true;
  }
  if (await clickLegacyPublishButton(page)) {
    await clickXhsConfirmDialog(page);
    return true;
  }
  return false;
}
async function clickXhsConfirmDialog(page) {
  const texts = ["确认发布", "发布", "确定"];
  for (const text of texts) {
    try {
      const btn = page.getByRole("button", { name: text }).first();
      if (await btn.isVisible({ timeout: 800 })) {
        await humanClickLocator(page, btn, { timeout: 3e3 });
        await sleep$1(800);
        return true;
      }
    } catch {
    }
  }
  return false;
}
async function uploadXhsImages(page, imagePaths) {
  for (let i = 0; i < imagePaths.length; i++) {
    const selector = i === 0 ? '.upload-input, input[type="file"]' : 'input[type="file"]';
    const input = page.locator(selector).first();
    await input.waitFor({ state: "attached", timeout: 15e3 });
    await input.setInputFiles(imagePaths[i]);
    await humanGaussianPause(2.35, 0.85);
    await page.locator(".img-preview-area .pr").nth(i).waitFor({ state: "attached", timeout: 6e4 }).catch(() => sleep$1(2e3));
  }
  await humanGaussianPause(3, 0.4);
}
async function uploadXhsMediaFiles(page, mediaPaths) {
  if (!mediaPaths.length) return;
  const input = page.locator('.upload-input, input[type="file"]').first();
  await input.waitFor({ state: "attached", timeout: 15e3 });
  try {
    await input.setInputFiles(mediaPaths);
  } catch {
    await input.setInputFiles(mediaPaths[0]);
  }
  await humanStepPause({ min: 2e3, max: 4500 });
}
async function ensureXhsArticleEditor(page) {
  const editor = page.locator('[contenteditable="true"], textarea, input[placeholder*="标题"]').first();
  if (await editor.isVisible({ timeout: 1500 }).catch(() => false)) return true;
  const clicked = await humanClickText(page, ["新的创作", "开始创作", "写长文"], {
    timeoutPer: 2e3
  });
  if (clicked) {
    await humanStepPause({ min: 1200, max: 2500 });
  }
  return editor.isVisible({ timeout: 5e3 }).catch(() => false);
}
async function keyboardSubmitXhsPublish(page) {
  const widget = page.locator("xhs-publish-btn").first();
  try {
    if (!await widget.isVisible({ timeout: 2e3 })) return false;
    const box = await widget.boundingBox();
    if (!box) return false;
    await humanMoveTo(page, { x: box.x + 4, y: box.y + box.height / 2 });
    await page.mouse.click(box.x + 4, box.y + box.height / 2);
    await sleep$1(200);
    await page.keyboard.press("Tab");
    await sleep$1(120);
    await page.keyboard.press("Tab");
    await sleep$1(120);
    await page.keyboard.press("Enter");
    await sleep$1(500);
    return true;
  } catch {
    return false;
  }
}
function assertNotAborted$1(signal) {
  if (signal?.aborted) throw new Error("用户已中止");
}
async function publishXhsNote(params) {
  const {
    title,
    content,
    imagePaths = [],
    videoPaths = [],
    audioPaths = [],
    autoPublish,
    fullAccess,
    emitAwaitUser,
    updateTasks,
    signal,
    sessionId
  } = params;
  const publishType = queryInferXhsPublishType({
    publishType: params.publishType,
    imagePaths,
    videoPaths,
    audioPaths,
    content
  });
  const typeLabel = XHS_PUBLISH_TYPE_LABELS[publishType];
  const publishUrl = queryBuildXhsPublishUrl(publishType);
  assertXhsBehaviorAllowed("publish", sessionId);
  const offPeakWarn = queryXhsOffPeakPublishWarning();
  const setTasks = (items) => updateTasks(() => items);
  const browser = getBrowserService();
  const teardownBrowser = async () => {
    await humanGaussianPause(2.5, 0.8);
    await browser.closeHeaded();
  };
  const mediaStepTitle = publishType === "image" ? "切换图文并上传配图" : publishType === "video" ? "打开视频页并上传视频" : publishType === "audio" ? "打开播客页并上传音频" : "打开长文页并进入编辑器";
  setTasks([
    { id: "0", title: `打开小红书创作平台（${typeLabel}）`, status: "running" },
    { id: "1", title: "确认登录状态", status: "pending" },
    { id: "2", title: mediaStepTitle, status: "pending" },
    { id: "3", title: "填写标题正文并发布", status: "pending" }
  ]);
  const page = await browser.ensureStarted();
  assertNotAborted$1(signal);
  await browser.navigate("https://www.xiaohongshu.com/explore");
  await page.waitForLoadState("domcontentloaded").catch(() => void 0);
  await humanGaussianStepPause({ min: 2500, max: 5500 });
  await humanXhsHomeBrowse(page);
  assertNotAborted$1(signal);
  await browser.navigate(publishUrl);
  await page.waitForLoadState("domcontentloaded").catch(() => void 0);
  await humanGaussianStepPause({ min: 2e3, max: 5e3 });
  assertNotAborted$1(signal);
  setTasks([
    { id: "0", title: `打开小红书创作平台（${typeLabel}）`, status: "done" },
    { id: "1", title: "确认登录状态", status: "running" },
    { id: "2", title: mediaStepTitle, status: "pending" },
    { id: "3", title: "填写标题正文并发布", status: "pending" }
  ]);
  const needLogin = await detectNeedLogin$2(page);
  if (needLogin) {
    await emitAwaitUser(
      "检测到未登录小红书。请在右侧「智能体浏览器」或弹出的 Chromium 窗口中完成登录，然后点击「继续」。"
    );
    assertNotAborted$1(signal);
    await browser.navigate(publishUrl);
    await humanGaussianStepPause({ min: 2e3, max: 4500 });
  }
  setTasks([
    { id: "0", title: `打开小红书创作平台（${typeLabel}）`, status: "done" },
    { id: "1", title: "确认登录状态", status: "done" },
    { id: "2", title: mediaStepTitle, status: "running" },
    { id: "3", title: "填写标题正文并发布", status: "pending" }
  ]);
  await removeXhsPopoverOverlay(page);
  let mediaSummary = "";
  if (publishType === "image") {
    const prep = await prepareImagePublish(page, imagePaths);
    if (prep.error) {
      await teardownBrowser();
      return prep.error;
    }
    mediaSummary = prep.summary;
  } else if (publishType === "video") {
    const prep = await prepareVideoPublish(page, videoPaths);
    if (prep.error) {
      await teardownBrowser();
      return prep.error;
    }
    mediaSummary = prep.summary;
  } else if (publishType === "audio") {
    const prep = await prepareAudioPublish(page, audioPaths);
    if (prep.error) {
      await teardownBrowser();
      return prep.error;
    }
    mediaSummary = prep.summary;
  } else {
    const prep = await prepareArticlePublish(page);
    if (prep.error) {
      await teardownBrowser();
      return prep.error;
    }
    mediaSummary = prep.summary;
  }
  await humanGaussianStepPause({ min: 1500, max: 4e3 });
  assertNotAborted$1(signal);
  const clamped = queryClampXhsPublishText({ title, content, publishType });
  const titleText = clamped.title;
  const contentText = clamped.content;
  const clampNote = clamped.titleTruncated || clamped.contentTruncated ? `已按上限截断（标题≤${clamped.titleMax}、正文≤${clamped.contentMax}）。` : "";
  const titleFilled = await humanTypeBySelectors(
    page,
    [
      'input[placeholder*="标题"]',
      'textarea[placeholder*="标题"]',
      "div.title-container input",
      '[class*="title"] input',
      '[class*="title"] textarea',
      'input[placeholder*="填写标题"]'
    ],
    titleText
  );
  if (!titleFilled) {
    const editable = page.locator('[contenteditable="true"]').first();
    if (await editable.isVisible({ timeout: 2e3 }).catch(() => false)) {
      await humanTypeInto(page, editable, titleText);
    }
  }
  await humanGaussianStepPause({ min: 1500, max: 4e3 });
  const bodyFilled = await humanTypeBySelectors(
    page,
    [
      'div[contenteditable="true"]',
      'textarea[placeholder*="正文"]',
      'textarea[placeholder*="输入"]',
      'textarea[placeholder*="描述"]',
      'textarea[placeholder*="说说"]',
      '[class*="editor"] [contenteditable="true"]'
    ],
    contentText
  );
  if (!bodyFilled) {
    await teardownBrowser();
    return `${mediaSummary}已打开「${typeLabel}」页（${publishUrl}），但未能自动定位标题/正文输入框。${clampNote}标题草稿: ${titleText}
正文草稿: ${contentText}
请用 browser_snapshot + browser_type 继续填写。`;
  }
  await humanXhsAfterFillBrowse(page);
  await humanGaussianStepPause({ min: 2500, max: 6e3 });
  setTasks([
    { id: "0", title: `打开小红书创作平台（${typeLabel}）`, status: "done" },
    { id: "1", title: "确认登录状态", status: "done" },
    { id: "2", title: mediaStepTitle, status: "done" },
    { id: "3", title: "填写标题正文并发布", status: "running" }
  ]);
  if (!autoPublish) {
    await scrollXhsPublishFooterIntoView(page);
    await dwellBeforeXhsPublish(page);
    setTasks([
      { id: "0", title: `打开小红书创作平台（${typeLabel}）`, status: "done" },
      { id: "1", title: "确认登录状态", status: "done" },
      { id: "2", title: mediaStepTitle, status: "done" },
      { id: "3", title: "填写标题正文并发布", status: "pending" }
    ]);
    return `已按「${typeLabel}」打开创作台并填写标题与正文（${publishUrl}）。${mediaSummary}${clampNote}停在待发布状态（autoPublish=false）。页面已拟人滚到底部并停留确认；用户可在浏览器中检查后手动点「发布」。${offPeakWarn ? `
⚠️ ${offPeakWarn}` : ""}`;
  }
  if (!fullAccess) {
    await scrollXhsPublishFooterIntoView(page);
    await emitAwaitUser(
      `内容已填好（类型：${typeLabel}），页面已滚到底部发布栏。确认无误后点击「继续」，将触发小红书「发布」操作。`
    );
    assertNotAborted$1(signal);
  }
  await removeXhsPopoverOverlay(page);
  await humanMicroPause();
  let published = await clickXhsPublishButton(page);
  if (!published) {
    published = await keyboardSubmitXhsPublish(page);
    if (published) await clickXhsConfirmDialog(page);
  }
  if (!published) {
    await teardownBrowser();
    return `未能触发「发布」（创作台使用 closed Shadow DOM 的 xhs-publish-btn）。类型「${typeLabel}」内容应已填好，请在右侧浏览器手动点击底部红色「发布」按钮。`;
  }
  await humanGaussianStepPause({ min: 2500, max: 5e3 });
  postRecordXhsBehavior("publish");
  await teardownBrowser();
  setTasks([
    { id: "0", title: `打开小红书创作平台（${typeLabel}）`, status: "done" },
    { id: "1", title: "确认登录状态", status: "done" },
    { id: "2", title: mediaStepTitle, status: "done" },
    { id: "3", title: "填写标题正文并发布", status: "done" }
  ]);
  return `已触发「${typeLabel}」发布流程。标题「${titleText}」。入口 ${publishUrl}。${clampNote}智能体浏览器已自动关闭。${offPeakWarn ? `
⚠️ ${offPeakWarn}` : ""}【执行完毕】`;
}
async function prepareImagePublish(page, imagePaths) {
  if (!imagePaths.length) {
    return {
      error: "图文发布缺少配图。请先 fetch_web_images，或传入 imagePaths / imageSourceUrl / imageUrls。",
      summary: ""
    };
  }
  const tabOk = await clickXhsImageTab(page);
  const onImage = tabOk || await queryIsXhsImagePublishMode(page);
  if (!onImage) {
    return {
      error: "未能进入「上传图文」页（可能被浮层遮挡、草稿恢复到视频页或页面改版）。请手动打开：https://creator.xiaohongshu.com/publish/publish?from=menu&target=image，或清空草稿箱后重试。",
      summary: ""
    };
  }
  const inputCount = await page.locator("input[type=file], .upload-input").count();
  if (inputCount === 0) {
    return {
      error: "已打开图文页，但未找到上传控件。请用 browser_snapshot 排查后 browser_upload。",
      summary: ""
    };
  }
  const variedDir = path.join(getArtifactsDir(), "xhs-varied", String(Date.now()));
  const uploadPaths = postVaryXhsPublishImages(imagePaths, variedDir);
  try {
    await uploadXhsImages(page, uploadPaths);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { error: `图文页打开成功，但上传配图失败：${msg}`, summary: "" };
  }
  return { summary: `配图 ${uploadPaths.length} 张。` };
}
async function prepareVideoPublish(page, videoPaths) {
  if (!videoPaths.length) {
    return {
      error: "视频发布缺少本地视频文件。请在 xhs_publish_note 传入 videoPaths（绝对路径），并将 publishType 设为 video。",
      summary: ""
    };
  }
  const inputCount = await page.locator("input[type=file], .upload-input").count();
  if (inputCount === 0) {
    return {
      error: "已打开视频发布页，但未找到上传控件。请确认入口为 https://creator.xiaohongshu.com/publish/publish?from=menu&target=video",
      summary: ""
    };
  }
  try {
    await uploadXhsMediaFiles(page, videoPaths);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { error: `视频上传失败：${msg}`, summary: "" };
  }
  return { summary: `视频 ${videoPaths.length} 个。` };
}
async function prepareAudioPublish(page, audioPaths) {
  if (!audioPaths.length) {
    return {
      error: "播客发布缺少本地音频文件。请在 xhs_publish_note 传入 audioPaths，并将 publishType 设为 audio。",
      summary: ""
    };
  }
  const inputCount = await page.locator("input[type=file], .upload-input").count();
  if (inputCount === 0) {
    return {
      error: "已打开播客发布页，但未找到上传控件。请确认入口为 https://creator.xiaohongshu.com/publish/publish?from=menu&target=audio",
      summary: ""
    };
  }
  try {
    await uploadXhsMediaFiles(page, audioPaths);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { error: `音频上传失败：${msg}`, summary: "" };
  }
  return { summary: `音频 ${audioPaths.length} 个。` };
}
async function prepareArticlePublish(page) {
  const ok = await ensureXhsArticleEditor(page);
  if (!ok) {
    return {
      error: "已打开长文入口，但未能进入编辑器。请手动点击「新的创作」，或打开：https://creator.xiaohongshu.com/publish/publish?from=menu&target=article",
      summary: ""
    };
  }
  return { summary: "已进入长文编辑器。" };
}
async function detectNeedLogin$2(page) {
  const url2 = page.url();
  if (/login|passport|signin/i.test(url2)) return true;
  const loginVisible = await page.getByText(/登录|扫码登录|手机号登录/, { exact: false }).first().isVisible().catch(() => false);
  const editorVisible = await page.locator('div.upload-content, input[type=file], [contenteditable="true"], textarea').first().isVisible().catch(() => false);
  if (editorVisible) return false;
  return loginVisible;
}
const browserFactories = {};
const sdkFactories = {};
function postRegisterBrowserPublishAdapter(channelId, factory) {
  browserFactories[channelId] = factory;
}
function querySdkPlaceholder(channelId) {
  const label = channelId === "xhs" ? "小红书" : "抖音";
  return {
    id: "sdk",
    async publish() {
      return `${label} 官方 SDK 发布尚未接入。请在设置 → 渠道中开启「拟人操作」以使用浏览器发布，或配置 SDK 凭证后重试。`;
    }
  };
}
function queryPublishAdapter(channelId, humanized) {
  const sdkFactory = sdkFactories[channelId];
  return sdkFactory ? sdkFactory() : querySdkPlaceholder(channelId);
}
const DOUYIN_SAFE_IMAGE_EXTS = /* @__PURE__ */ new Set([".jpg", ".jpeg"]);
function queryIsDouyinSafeImagePath(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return DOUYIN_SAFE_IMAGE_EXTS.has(ext);
}
function postPrepareDouyinPublishImages(imagePaths, outDir) {
  if (!imagePaths.length) return [];
  fs.mkdirSync(outDir, { recursive: true });
  const results = [];
  for (let i = 0; i < imagePaths.length; i++) {
    const src = imagePaths[i];
    if (!src || !fs.existsSync(src)) continue;
    if (queryIsDouyinSafeImagePath(src)) {
      results.push(src);
      continue;
    }
    const ext = path.extname(src).toLowerCase();
    const base2 = path.basename(src, ext) || `image-${i + 1}`;
    const outPath = path.join(outDir, `${base2}-douyin-${i + 1}.jpg`);
    try {
      const img = electron.nativeImage.createFromPath(src);
      if (img.isEmpty()) {
        console.warn("[douyin-image-prepare] 无法解码，跳过:", src);
        continue;
      }
      fs.writeFileSync(outPath, img.toJPEG(90));
      results.push(outPath);
      console.info("[douyin-image-prepare] converted", src, "→", outPath);
    } catch (err) {
      console.warn("[douyin-image-prepare] convert failed:", src, err);
    }
  }
  return results;
}
const DOUYIN_PUBLISH_URL = "https://creator.douyin.com/creator-micro/content/upload";
const DOUYIN_TITLE_MAX_LENGTH = 20;
function queryNormalizeDouyinDraftText(raw) {
  return String(raw ?? "").replace(/[\u200B-\u200D\uFEFF]/g, "").replace(/\r\n?/g, "\n").replace(/[ \t\f\v]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}
function queryDouyinTextLooksFilled(expected, actual) {
  const exp = queryNormalizeDouyinDraftText(expected);
  const act = queryNormalizeDouyinDraftText(actual);
  if (!exp) return true;
  if (!act) return false;
  if (act.includes(exp) || exp.includes(act)) return true;
  const chunks = exp.split(/[\n。！？!?；;]+/).map((s) => s.trim()).filter((s) => s.length >= 4);
  if (chunks.length === 0) {
    const minLen = Math.max(2, Math.floor(exp.length * 0.7));
    return act.includes(exp.slice(0, minLen));
  }
  const hit = chunks.filter((c) => act.includes(c)).length;
  return hit >= Math.ceil(chunks.length * 0.5);
}
function queryVerifyDouyinFilledDraft(params) {
  const expectedTitle = queryNormalizeDouyinDraftText(params.expectedTitle).slice(
    0,
    DOUYIN_TITLE_MAX_LENGTH
  );
  const expectedContent = queryNormalizeDouyinDraftText(params.expectedContent);
  const title = queryNormalizeDouyinDraftText(params.actual.title);
  const content = queryNormalizeDouyinDraftText(params.actual.content);
  const issues = [];
  if (params.titleFilledSeparately && expectedTitle) {
    if (!queryDouyinTextLooksFilled(expectedTitle, title)) {
      if (!queryDouyinTextLooksFilled(expectedTitle, content)) {
        issues.push("标题未正确写入");
      }
    }
  }
  const bodyExpected = params.titleFilledSeparately || !expectedTitle ? expectedContent : queryNormalizeDouyinDraftText(`${expectedTitle}
${expectedContent}`);
  if (bodyExpected && !queryDouyinTextLooksFilled(bodyExpected, content)) {
    if (params.titleFilledSeparately && expectedContent && queryDouyinTextLooksFilled(expectedContent, content)) ;
    else if (!params.titleFilledSeparately && expectedContent && queryDouyinTextLooksFilled(expectedContent, content)) ;
    else {
      issues.push("作品描述未正确写入");
    }
  }
  if (!title && !content) {
    issues.push("页面未读到任何已填文案");
  }
  return { ok: issues.length === 0, title, content, issues };
}
async function removeDouyinOverlay(page) {
  await page.evaluate(() => {
    document.querySelectorAll('[class*="guide"], [class*="mask"], [class*="modal"], [class*="popover"]').forEach((el) => {
      const style = window.getComputedStyle(el);
      const z = Number(style.zIndex);
      if (style.position !== "fixed" && style.position !== "absolute") return;
      if (!Number.isFinite(z) || z < 1e3) return;
      const rect = el.getBoundingClientRect();
      const coversViewport = rect.width >= window.innerWidth * 0.5 && rect.height >= window.innerHeight * 0.4;
      if (!coversViewport) return;
      el.style.pointerEvents = "none";
      el.style.display = "none";
    });
  });
  await sleep$1(120);
}
function queryIsDouyinPublishUrl(url2) {
  try {
    const u = new URL(url2);
    if (!/creator\.douyin\.com$/i.test(u.hostname) && !/\.douyin\.com$/i.test(u.hostname)) {
      return false;
    }
    return /\/content\/(upload|post|publish|edit)|\/creator-micro\/content/i.test(u.pathname);
  } catch {
    return /creator\.douyin\.com.*content/i.test(url2);
  }
}
function queryIsDouyinCreatorHomeUrl(url2) {
  try {
    const u = new URL(url2);
    if (!/creator\.douyin\.com/i.test(u.hostname)) return false;
    const path2 = u.pathname.replace(/\/+$/, "") || "/";
    return path2 === "/" || path2 === "/creator-micro" || /\/creator-micro\/home$/i.test(path2) || /\/home$/i.test(path2);
  } catch {
    return /creator\.douyin\.com\/(creator-micro\/)?home?/i.test(url2);
  }
}
async function ensureDouyinPublishPage(page) {
  if (queryIsDouyinPublishUrl(page.url())) return true;
  console.warn("[douyin-dom] 检测到已离开发布页:", page.url());
  return false;
}
async function lockDouyinPublishStay(page) {
  await page.evaluate(() => {
    const w = window;
    if (w.__raDouyinLockInstalled) return;
    w.__raDouyinLockInstalled = true;
    const isForbiddenNavTarget = (el) => {
      if (!el || !(el instanceof Element)) return false;
      const hit = el.closest('a,button,[role="link"],[role="button"],[class*="menu"],[class*="nav"]') ?? el;
      const text = (hit.innerText || hit.textContent || "").replace(/\s+/g, " ").trim();
      if (/^首页$|^主页$|^Home$/i.test(text)) return true;
      const href = (hit.closest("a")?.getAttribute("href") || hit.getAttribute("href") || "").trim();
      if (/\/home\b|creator-micro\/?(\?|#|$)/i.test(href)) return true;
      if (hit.closest('a[class*="logo"], [class*="logo"] a, a[href="/"], a[href="/creator-micro"]')) {
        return true;
      }
      const rect = hit.getBoundingClientRect();
      if (rect.right <= 220 && rect.width > 0 && rect.height > 0) {
        if (/首页|内容管理|互动|数据|成长|资金|直播|小店/.test(text)) return true;
      }
      return false;
    };
    const onClick = (e) => {
      if (!isForbiddenNavTarget(e.target)) return;
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation?.();
      console.warn("[douyin-lock] blocked navigation click");
    };
    document.addEventListener("click", onClick, true);
    document.addEventListener("auxclick", onClick, true);
    const origPush = history.pushState.bind(history);
    const origReplace = history.replaceState.bind(history);
    const blockUrl = (url2) => {
      const s = String(url2 ?? "");
      if (!s) return false;
      return /\/home\b/i.test(s) || /creator-micro\/?(\?|#|$)/i.test(s);
    };
    history.pushState = ((data, unused, url2) => {
      if (blockUrl(url2)) {
        console.warn("[douyin-lock] blocked pushState", url2);
        return;
      }
      return origPush(data, unused, url2);
    });
    history.replaceState = ((data, unused, url2) => {
      if (blockUrl(url2)) {
        console.warn("[douyin-lock] blocked replaceState", url2);
        return;
      }
      return origReplace(data, unused, url2);
    });
    w.__raDouyinLockCleanup = () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("auxclick", onClick, true);
      history.pushState = origPush;
      history.replaceState = origReplace;
      w.__raDouyinLockInstalled = false;
      w.__raDouyinLockCleanup = void 0;
    };
  });
  const onFrameNavigated = async () => {
    try {
      const url2 = page.url();
      if (queryIsDouyinPublishUrl(url2)) return;
      if (!queryIsDouyinCreatorHomeUrl(url2)) return;
      console.warn("[douyin-lock] navigated to creator home after fill, goBack:", url2);
      await page.goBack({ waitUntil: "domcontentloaded" }).catch(() => void 0);
    } catch {
    }
  };
  page.on("framenavigated", onFrameNavigated);
  return async () => {
    page.off("framenavigated", onFrameNavigated);
    await page.evaluate(() => {
      const w = window;
      w.__raDouyinLockCleanup?.();
    }).catch(() => void 0);
  };
}
async function clickDouyinImageTab(page, timeoutMs = 15e3) {
  const texts = ["发布图文", "图文"];
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    for (const text of texts) {
      try {
        const loc = page.getByText(text, { exact: true }).first();
        if (await loc.isVisible({ timeout: 1200 }).catch(() => false)) {
          const box = await loc.boundingBox().catch(() => null);
          if (box && box.x < 200) continue;
          await humanClickLocator(page, loc);
          await sleep$1(800);
          return true;
        }
      } catch {
      }
    }
    await removeDouyinOverlay(page);
    await sleep$1(300);
  }
  return false;
}
function queryParseDouyinAddedImageCount(text) {
  const m = String(text ?? "").match(/已添加\s*(\d+)\s*张/);
  if (!m) return 0;
  const n = Number(m[1]);
  return Number.isFinite(n) && n > 0 ? n : 0;
}
async function queryDouyinImageDropTarget(page) {
  const byClass = page.locator(
    '[class*="upload-drag"], [class*="drag-area"], [class*="upload-dragger"], [class*="container-drag"]'
  ).filter({ hasText: /上传|拖入|图片/ }).first();
  if (await byClass.isVisible({ timeout: 800 }).catch(() => false)) return byClass;
  const dropHint = page.getByText(/直接将图片文件拖入此区域|将图片文件拖入此区域|拖入此区域/).first();
  if (await dropHint.isVisible({ timeout: 900 }).catch(() => false)) {
    const ancestor = dropHint.locator(
      'xpath=ancestor::div[.//input[@type="file"] or contains(@class,"upload") or contains(@class,"drag") or contains(@class,"drop")][1]'
    );
    if (await ancestor.count().catch(() => 0) > 0) return ancestor;
    const block = page.locator("div").filter({ hasText: /拖入此区域/ }).first();
    if (await block.isVisible({ timeout: 500 }).catch(() => false)) return block;
    return dropHint;
  }
  const uploadBlock = page.locator('[class*="upload"]').filter({ hasText: /点击上传|上传图文|拖入/ }).first();
  if (await uploadBlock.isVisible({ timeout: 600 }).catch(() => false)) return uploadBlock;
  const fileInput = page.locator('input[type="file"]').first();
  if (await fileInput.count().catch(() => 0) > 0) {
    return fileInput.locator(
      'xpath=ancestor::div[contains(@class,"upload") or contains(@class,"drag")][1]'
    );
  }
  return null;
}
async function postUploadDouyinFilesViaChooser(page, paths, triggerTexts) {
  let trigger = null;
  for (const text of triggerTexts) {
    const loc = page.getByText(text, { exact: false }).first();
    if (await loc.isVisible({ timeout: 1200 }).catch(() => false)) {
      trigger = loc;
      break;
    }
  }
  if (!trigger) return false;
  const chooserPromise = page.waitForEvent("filechooser", { timeout: 12e3 });
  await humanClickLocator(page, trigger);
  const chooser = await chooserPromise;
  await chooser.setFiles(paths);
  return true;
}
async function uploadDouyinImages(page, imagePaths) {
  if (!imagePaths.length) return;
  const needed = imagePaths.length;
  try {
    const dropTarget = await queryDouyinImageDropTarget(page);
    if (dropTarget) {
      await humanDropLocalFiles(page, dropTarget, imagePaths);
      await sleep$1(2e3);
      const count = await queryDouyinImagePreviewCount(page);
      if (count >= needed) return;
      if (count > 0) {
        const remaining = imagePaths.slice(count);
        if (!remaining.length) return;
        const again = await queryDouyinImageDropTarget(page);
        if (again) {
          await humanDropLocalFiles(page, again, remaining);
          await sleep$1(1500);
          if (await queryDouyinImagePreviewCount(page) >= needed) return;
        }
        const ok = await postUploadDouyinFilesViaChooser(page, remaining, [
          "继续添加",
          "添加图片",
          "添加"
        ]);
        await sleep$1(1500);
        if (ok || await queryDouyinImagePreviewCount(page) > 0) return;
      }
    }
  } catch (err) {
    console.warn("[douyin-upload] 拖入失败，回退 setInputFiles:", err);
  }
  const fileInput = page.locator('input[type="file"]').first();
  const hasInput = await fileInput.waitFor({ state: "attached", timeout: 8e3 }).then(
    () => true,
    () => false
  );
  if (hasInput) {
    try {
      await fileInput.setInputFiles(imagePaths);
      await sleep$1(2e3);
      const count = await queryDouyinImagePreviewCount(page);
      if (count >= needed) return;
      if (count > 0) {
        const remaining = imagePaths.slice(count);
        if (!remaining.length) return;
        const ok = await postUploadDouyinFilesViaChooser(page, remaining, [
          "继续添加",
          "添加图片",
          "添加"
        ]);
        await sleep$1(1500);
        if (ok || await queryDouyinImagePreviewCount(page) > 0) return;
      }
    } catch {
    }
  }
  let uploaded = await queryDouyinImagePreviewCount(page);
  for (let i = uploaded; i < imagePaths.length; i++) {
    const dropTarget = await queryDouyinImageDropTarget(page);
    if (dropTarget) {
      try {
        await humanDropLocalFiles(page, dropTarget, [imagePaths[i]]);
        uploaded += 1;
        await sleep$1(i === 0 ? 1800 : 1200);
        continue;
      } catch {
      }
    }
    const input = page.locator('input[type="file"]').first();
    const attached = await input.waitFor({ state: "attached", timeout: 4e3 }).then(
      () => true,
      () => false
    );
    if (attached) {
      await input.setInputFiles(imagePaths[i]);
    } else {
      const ok = await postUploadDouyinFilesViaChooser(page, [imagePaths[i]], [
        "继续添加",
        "添加图片",
        "添加",
        "上传图片",
        "上传"
      ]);
      if (!ok) {
        if (uploaded > 0 || await queryDouyinImagePreviewCount(page) > 0) {
          return;
        }
        throw new Error("未找到可用于继续上传的拖放区域或文件选择控件");
      }
    }
    uploaded += 1;
    await sleep$1(i === 0 ? 1800 : 1200);
  }
}
async function queryDouyinImagePreviewCount(page) {
  const candidates = [
    '[class*="preview"] img',
    '[class*="thumb"] img',
    '[class*="image-list"] img',
    '[class*="upload"] img',
    ".semi-upload-picture-card img"
  ];
  let max = 0;
  for (const sel of candidates) {
    try {
      const n = await page.locator(sel).count();
      if (n > max) max = n;
    } catch {
    }
  }
  try {
    const bodyText = await page.locator("body").innerText({ timeout: 2e3 });
    const fromLabel = queryParseDouyinAddedImageCount(bodyText);
    if (fromLabel > max) max = fromLabel;
  } catch {
  }
  return max;
}
const DOUYIN_TITLE_SELECTORS = [
  'input[placeholder*="标题"]',
  'textarea[placeholder*="标题"]',
  '[class*="title"] input',
  '[class*="title"] textarea',
  'input[placeholder*="作品标题"]'
];
const DOUYIN_BODY_SELECTORS = [
  'div[contenteditable="true"][data-placeholder*="描述"]',
  'div[contenteditable="true"][placeholder*="描述"]',
  '[class*="desc"] [contenteditable="true"]',
  '[class*="editor"] [contenteditable="true"]',
  'textarea[placeholder*="描述"]',
  'textarea[placeholder*="作品"]',
  'textarea[placeholder*="添加"]',
  'div[contenteditable="true"]'
];
async function queryLocatorDraftText(page, selectors) {
  for (const sel of selectors) {
    try {
      const loc = page.locator(sel).first();
      if (!await loc.isVisible({ timeout: 800 }).catch(() => false)) continue;
      const tag = await loc.evaluate((el) => el.tagName.toLowerCase()).catch(() => "");
      if (tag === "input" || tag === "textarea") {
        const v = await loc.inputValue().catch(() => "");
        if (v.trim()) return v;
      }
      const text = await loc.innerText().catch(async () => await loc.textContent() ?? "");
      if (text.trim()) return text;
    } catch {
    }
  }
  return "";
}
async function queryDouyinFilledDraft(page) {
  const title = await queryLocatorDraftText(page, DOUYIN_TITLE_SELECTORS);
  let content = await queryLocatorDraftText(page, DOUYIN_BODY_SELECTORS);
  if (!content.trim()) {
    const editables = page.locator('[contenteditable="true"]');
    const n = await editables.count().catch(() => 0);
    for (let i = 0; i < n; i++) {
      const loc = editables.nth(i);
      if (!await loc.isVisible().catch(() => false)) continue;
      const text = await loc.innerText().catch(async () => await loc.textContent() ?? "") ?? "";
      const normalized = queryNormalizeDouyinDraftText(text);
      if (!normalized) continue;
      if (title && queryNormalizeDouyinDraftText(title) === normalized) continue;
      content = text;
      break;
    }
  }
  return { title, content };
}
async function humanReviewDouyinFilledContent(page) {
  const vp = page.viewportSize() ?? { width: 1280, height: 800 };
  await humanBezierMoveTo(page, {
    x: rand(vp.width * 0.42, vp.width * 0.78),
    y: rand(vp.height * 0.38, vp.height * 0.62)
  });
  await humanGaussianPause(0.5, 0.2);
  await humanBezierScroll(page, {
    direction: "down",
    distance: rand(120, 280)
  });
  await humanStepPause({ min: 1200, max: 2800 });
}
async function queryVerifyDouyinFilledContent(page, params) {
  await humanReviewDouyinFilledContent(page);
  const actual = await queryDouyinFilledDraft(page);
  return queryVerifyDouyinFilledDraft({
    expectedTitle: params.expectedTitle,
    expectedContent: params.expectedContent,
    actual,
    titleFilledSeparately: params.titleFilledSeparately
  });
}
async function queryDouyinPublishButtonVisible(page) {
  const stash = page.getByText("暂存离开", { exact: true }).last();
  if (await stash.isVisible({ timeout: 400 }).catch(() => false)) return true;
  for (const name of ["发布", "立即发布", "确认发布"]) {
    const btn = page.getByRole("button", { name }).last();
    if (!await btn.isVisible({ timeout: 300 }).catch(() => false)) continue;
    const box = await btn.boundingBox().catch(() => null);
    const vp = page.viewportSize() ?? { width: 1280, height: 800 };
    if (box && box.y >= vp.height * 0.55 && box.x >= vp.width * 0.35) return true;
  }
  return false;
}
async function postForceDouyinPageBottom(page) {
  await page.evaluate(() => {
    const forceBottom = (el) => {
      const target = el instanceof Document ? el.documentElement : el;
      try {
        target.scrollTop = target.scrollHeight;
      } catch {
      }
    };
    forceBottom(document);
    forceBottom(document.body);
    document.querySelectorAll('[class*="scroll"], [class*="content"], main, [role="main"]').forEach((el) => {
      const h = el;
      if (h.scrollHeight > h.clientHeight + 80) forceBottom(h);
    });
  });
  await sleep$1(rand(200, 400));
}
async function scrollDouyinPublishFooterIntoView(page) {
  const maxRounds = 8;
  for (let i = 0; i < maxRounds; i++) {
    if (await queryDouyinPublishButtonVisible(page)) break;
    await humanBezierScroll(page, {
      direction: "down",
      distance: rand(420, 780)
    });
    await sleep$1(rand(180, 420));
  }
  await postForceDouyinPageBottom(page);
  for (const text of ["暂存离开", "立即发布", "发布"]) {
    try {
      const el = page.getByText(text, { exact: true }).last();
      if (await el.isVisible({ timeout: 800 }).catch(() => false)) {
        await el.scrollIntoViewIfNeeded().catch(() => void 0);
        await sleep$1(rand(200, 450));
        break;
      }
    } catch {
    }
  }
  if (!await queryDouyinPublishButtonVisible(page)) {
    await humanBezierScroll(page, { direction: "down", distance: rand(180, 360) });
  }
}
async function dwellBeforeDouyinPublish(page) {
  const vp = page.viewportSize() ?? { width: 1280, height: 800 };
  await humanBezierMoveTo(page, {
    x: rand(vp.width * 0.55, vp.width * 0.92),
    y: rand(vp.height * 0.78, vp.height * 0.95)
  });
  await sleep$1(rand(400, 900));
  if (Math.random() < 0.55) {
    await humanBezierScroll(page, {
      direction: Math.random() < 0.35 ? "up" : "down",
      distance: rand(60, 160)
    });
    await humanBezierScroll(page, { direction: "down", distance: rand(80, 200) });
  }
  await humanStepPause({ min: 3500, max: 9e3 });
  await humanBezierMoveTo(page, {
    x: rand(vp.width * 0.72, vp.width * 0.96),
    y: rand(vp.height * 0.82, vp.height * 0.97)
  });
  await sleep$1(rand(350, 800));
}
async function clickDouyinPublishButton(page) {
  if (!await ensureDouyinPublishPage(page)) return false;
  await removeDouyinOverlay(page);
  await scrollDouyinPublishFooterIntoView(page);
  await dwellBeforeDouyinPublish(page);
  await removeDouyinOverlay(page);
  if (!await ensureDouyinPublishPage(page)) return false;
  const vp = page.viewportSize() ?? { width: 1280, height: 800 };
  const candidates = ["发布", "立即发布", "确认发布"];
  const isFooterPublishHit = (box) => {
    if (!box) return false;
    return box.y >= vp.height * 0.55 && box.x >= vp.width * 0.35;
  };
  try {
    const footer = page.getByText("暂存离开", { exact: true }).first();
    if (await footer.isVisible({ timeout: 1e3 }).catch(() => false)) {
      const row = footer.locator(
        'xpath=ancestor::*[contains(@class,"footer") or contains(@class,"bottom") or contains(@class,"action") or contains(@class,"bar")][1]'
      );
      const inRow = row.getByRole("button", { name: /发布/ }).last();
      if (await inRow.isVisible({ timeout: 800 }).catch(() => false)) {
        await humanClickLocator(page, inRow, { timeout: 5e3 });
        await sleep$1(rand(700, 1200));
        return true;
      }
      const near = footer.locator("xpath=..").getByText("发布", { exact: true }).last();
      if (await near.isVisible({ timeout: 600 }).catch(() => false)) {
        await humanClickLocator(page, near, { timeout: 5e3 });
        await sleep$1(rand(700, 1200));
        return true;
      }
    }
  } catch {
  }
  for (const text of candidates) {
    try {
      const btn = page.getByRole("button", { name: text }).last();
      if (!await btn.isVisible({ timeout: 1200 })) continue;
      const box = await btn.boundingBox().catch(() => null);
      if (!isFooterPublishHit(box)) continue;
      await btn.scrollIntoViewIfNeeded().catch(() => void 0);
      await humanClickLocator(page, btn, { timeout: 5e3 });
      await sleep$1(rand(700, 1200));
      return true;
    } catch {
    }
  }
  for (const text of candidates) {
    try {
      const el = page.getByText(text, { exact: true }).last();
      if (!await el.isVisible({ timeout: 800 })) continue;
      const box = await el.boundingBox().catch(() => null);
      if (!isFooterPublishHit(box)) continue;
      await el.scrollIntoViewIfNeeded().catch(() => void 0);
      await humanClickLocator(page, el, { timeout: 3e3 });
      await sleep$1(rand(700, 1200));
      return true;
    } catch {
    }
  }
  return false;
}
async function clickDouyinConfirmDialog(page) {
  const texts = ["确认发布", "发布", "确定", "继续发布"];
  for (const text of texts) {
    try {
      const btn = page.getByRole("button", { name: text }).first();
      if (await btn.isVisible({ timeout: 800 })) {
        await humanClickLocator(page, btn, { timeout: 3e3 });
        await sleep$1(800);
        return true;
      }
    } catch {
    }
  }
  return false;
}
function assertNotAborted(signal) {
  if (signal?.aborted) throw new Error("用户已中止");
}
async function publishDouyinNote(params) {
  const {
    title,
    content,
    imagePaths,
    autoPublish,
    fullAccess,
    emitAwaitUser,
    updateTasks,
    signal
  } = params;
  const setTasks = (items) => updateTasks(() => items);
  setTasks([
    { id: "1", title: "打开抖音创作者中心", status: "running" },
    { id: "2", title: "确认登录状态", status: "pending" },
    { id: "3", title: "切换图文并上传配图", status: "pending" },
    { id: "4", title: "填写文案并发布", status: "pending" }
  ]);
  const browser = getBrowserService();
  const page = await browser.ensureStarted();
  assertNotAborted(signal);
  await browser.navigate(DOUYIN_PUBLISH_URL);
  await page.waitForLoadState("domcontentloaded").catch(() => void 0);
  await page.waitForTimeout(2500);
  assertNotAborted(signal);
  setTasks([
    { id: "1", title: "打开抖音创作者中心", status: "done" },
    { id: "2", title: "确认登录状态", status: "running" },
    { id: "3", title: "切换图文并上传配图", status: "pending" },
    { id: "4", title: "填写文案并发布", status: "pending" }
  ]);
  const needLogin = await detectNeedLogin$1(page);
  if (needLogin) {
    await emitAwaitUser(
      "检测到未登录抖音创作者中心。请在右侧「智能体浏览器」中完成登录，然后点击「继续」。"
    );
    assertNotAborted(signal);
    await browser.navigate(DOUYIN_PUBLISH_URL);
    await page.waitForTimeout(2500);
  }
  setTasks([
    { id: "1", title: "打开抖音创作者中心", status: "done" },
    { id: "2", title: "确认登录状态", status: "done" },
    { id: "3", title: "切换图文并上传配图", status: "running" },
    { id: "4", title: "填写文案并发布", status: "pending" }
  ]);
  await removeDouyinOverlay(page);
  const tabOk = await clickDouyinImageTab(page);
  if (!tabOk) {
    const fileInputCount = await page.locator('input[type="file"]').count();
    if (fileInputCount === 0) {
      return "未能切换到「发布图文」或找到上传控件（页面可能改版）。请在智能体浏览器中手动切换到图文上传后，用 browser_snapshot 继续。";
    }
  }
  await page.waitForTimeout(600);
  const inputCount = await page.locator('input[type="file"]').count();
  if (inputCount === 0) {
    return "未找到图片上传控件。页面结构可能已变更。请用 browser_snapshot 查看当前页，再用 browser_upload 手动上传。";
  }
  const preparedPaths = postPrepareDouyinPublishImages(
    imagePaths,
    path.join(getArtifactsDir(), "douyin-prepared")
  );
  if (!preparedPaths.length) {
    return "配图无法转为可上传的 JPEG（抖音图文实际仅稳妥支持 jpg/jpeg）。请改用 jpg，或重新 fetch_web_images 后重试。";
  }
  try {
    await uploadDouyinImages(page, preparedPaths);
  } catch (e) {
    const previewCount = await queryDouyinImagePreviewCount(page);
    if (previewCount > 0) {
      console.warn(
        "[douyin-publish] 上传过程报错但检测到预览图，继续填写文案:",
        e instanceof Error ? e.message : e
      );
    } else {
      const msg = e instanceof Error ? e.message : String(e);
      return `切换图文成功，但上传配图失败：${msg}`;
    }
  }
  await page.waitForTimeout(1800);
  assertNotAborted(signal);
  const titleText = title.slice(0, DOUYIN_TITLE_MAX_LENGTH);
  const fullText = titleText ? `${titleText}
${content}` : content;
  const fillDouyinCopy = async () => {
    const titleFilled = await humanTypeBySelectors(
      page,
      [
        'input[placeholder*="标题"]',
        'textarea[placeholder*="标题"]',
        '[class*="title"] input',
        '[class*="title"] textarea',
        'input[placeholder*="作品标题"]'
      ],
      titleText
    );
    const bodyFilled = await humanTypeBySelectors(
      page,
      [
        'div[contenteditable="true"][data-placeholder*="描述"]',
        'div[contenteditable="true"][placeholder*="描述"]',
        '[class*="desc"] [contenteditable="true"]',
        '[class*="editor"] [contenteditable="true"]',
        'textarea[placeholder*="描述"]',
        'textarea[placeholder*="作品"]',
        'textarea[placeholder*="添加"]',
        'div[contenteditable="true"]'
      ],
      titleFilled ? content : fullText
    );
    if (bodyFilled || titleFilled) {
      return { titleFilledSeparately: titleFilled, located: true };
    }
    const descNear = page.getByText(/作品描述|添加作品描述|写下作品描述/, { exact: false }).locator("..").locator('[contenteditable="true"], textarea').first();
    if (await descNear.isVisible({ timeout: 2e3 }).catch(() => false)) {
      await humanTypeInto(page, descNear, fullText);
      return { titleFilledSeparately: false, located: true };
    }
    const editable = page.locator('[contenteditable="true"]').first();
    if (await editable.isVisible({ timeout: 2e3 }).catch(() => false)) {
      await humanTypeInto(page, editable, fullText);
      return { titleFilledSeparately: false, located: true };
    }
    return { titleFilledSeparately: false, located: false };
  };
  let fillMeta = await fillDouyinCopy();
  if (!fillMeta.located) {
    return `配图已上传，但未能自动定位文案输入框。标题草稿: ${title}
正文草稿: ${content}
请用 browser_snapshot + browser_type 继续填写。`;
  }
  setTasks([
    { id: "1", title: "打开抖音创作者中心", status: "done" },
    { id: "2", title: "确认登录状态", status: "done" },
    { id: "3", title: "切换图文并上传配图", status: "done" },
    { id: "4", title: "填写文案并发布", status: "running" }
  ]);
  const unlockStay = await lockDouyinPublishStay(page);
  try {
    let verify = await queryVerifyDouyinFilledContent(page, {
      expectedTitle: titleText,
      expectedContent: content,
      titleFilledSeparately: fillMeta.titleFilledSeparately
    });
    if (!verify.ok) {
      console.warn("[douyin-publish] 首次填写校验未通过，尝试重填:", verify.issues.join("；"));
      fillMeta = await fillDouyinCopy();
      if (fillMeta.located) {
        verify = await queryVerifyDouyinFilledContent(page, {
          expectedTitle: titleText,
          expectedContent: content,
          titleFilledSeparately: fillMeta.titleFilledSeparately
        });
      }
    }
    if (!verify.ok) {
      await scrollDouyinPublishFooterIntoView(page);
      return `配图已上传，但填写内容校验未通过（${verify.issues.join("；")}）。期望标题: ${titleText}
期望正文: ${content}
页面回读标题: ${verify.title || "（空）"}
页面回读正文: ${verify.content || "（空）"}
请用 browser_snapshot 检查后手动修正，再点「发布」。`;
    }
    assertNotAborted(signal);
    if (!queryIsDouyinPublishUrl(page.url())) {
      return `文案已填写，但页面已离开抖音发布页（当前: ${page.url()}），未继续点击发布。请重新打开创作者上传页后重试，或用 browser_snapshot 检查。`;
    }
    if (!autoPublish) {
      await scrollDouyinPublishFooterIntoView(page);
      await dwellBeforeDouyinPublish(page);
      setTasks([
        { id: "1", title: "打开抖音创作者中心", status: "done" },
        { id: "2", title: "确认登录状态", status: "done" },
        { id: "3", title: "切换图文并上传配图", status: "done" },
        { id: "4", title: "填写文案并发布", status: "pending" }
      ]);
      return `已上传配图 ${preparedPaths.length} 张并填写文案，内容校验通过，停在待发布状态（autoPublish=false）。页面已拟人滚到发布按钮并停留确认；用户可在浏览器中检查后手动点「发布」。`;
    }
    if (!fullAccess) {
      await scrollDouyinPublishFooterIntoView(page);
      if (!await ensureDouyinPublishPage(page)) {
        return "内容已填好，但页面已离开发布页，无法等待确认发布。请重新打开上传页后重试。";
      }
      await emitAwaitUser(
        "内容已填好且校验通过，页面已滚到发布按钮。确认无误后点击「继续」，将触发抖音「发布」操作。"
      );
      assertNotAborted(signal);
    }
    if (!await ensureDouyinPublishPage(page)) {
      return "内容已填好，但页面已离开发布页，无法自动点击发布。请重新打开上传页后重试。";
    }
    await removeDouyinOverlay(page);
    let published = await clickDouyinPublishButton(page);
    if (published) {
      await clickDouyinConfirmDialog(page);
    }
    if (!published) {
      return "未能自动触发「发布」按钮（页面可能改版）。内容应已填好，请在右侧浏览器手动点击「发布」。";
    }
    await page.waitForTimeout(3e3);
    await browser.closeHeaded();
    setTasks([
      { id: "1", title: "打开抖音创作者中心", status: "done" },
      { id: "2", title: "确认登录状态", status: "done" },
      { id: "3", title: "切换图文并上传配图", status: "done" },
      { id: "4", title: "填写文案并发布", status: "done" }
    ]);
    return `已触发抖音发布流程。标题「${title}」。智能体浏览器已自动关闭。【执行完毕】`;
  } finally {
    await unlockStay().catch(() => void 0);
  }
}
async function detectNeedLogin$1(page) {
  const url2 = page.url();
  if (/login|passport|signin|sso/i.test(url2)) return true;
  const loginVisible = await page.getByText(/登录|扫码登录|手机号登录/, { exact: false }).first().isVisible().catch(() => false);
  const editorVisible = await page.locator('input[type=file], [contenteditable="true"], textarea').first().isVisible().catch(() => false);
  if (editorVisible) return false;
  return loginVisible;
}
let registered = false;
function initPublishAdapters() {
  if (registered) return;
  registered = true;
  postRegisterBrowserPublishAdapter("xhs", () => ({
    id: "browser-humanized",
    async publish(params) {
      return publishXhsNote({
        title: params.title,
        content: params.content,
        imagePaths: params.imagePaths ?? [],
        autoPublish: true,
        fullAccess: true,
        emitAwaitUser: async (reason) => {
          params.emitAwaitUser?.(reason);
        },
        updateTasks: () => void 0,
        signal: params.signal
      });
    }
  }));
  postRegisterBrowserPublishAdapter("douyin", () => ({
    id: "browser-humanized",
    async publish(params) {
      return publishDouyinNote({
        title: params.title,
        content: params.content,
        imagePaths: params.imagePaths ?? [],
        autoPublish: true,
        fullAccess: true,
        emitAwaitUser: async (reason) => {
          params.emitAwaitUser?.(reason);
        },
        updateTasks: () => void 0,
        signal: params.signal
      });
    }
  }));
}
const fetchWebImagesTool = {
  name: "fetch_web_images",
  description: "从内容来源网页提取并下载配图，或按图片直链下载到本地。会先截取页面屏幕并用识图模型筛选与主题相关的图，拒绝 Logo/广告/无关推荐，避免整页资源一股脑下载。发布小红书/抖音前应优先调用本工具获取配图；用户上传图片是可选的。返回本地绝对路径列表，可交给 xhs_publish_note 或 douyin_publish_note 的 imagePaths。",
  permission: "safe",
  parameters: {
    type: "object",
    properties: {
      pageUrl: {
        type: "string",
        description: "内容来源页 URL（打开后自动挑选较大图片下载）"
      },
      imageUrls: {
        type: "array",
        items: { type: "string" },
        description: "图片直链列表（与 pageUrl 可同时使用）"
      },
      topic: {
        type: "string",
        description: "搜索/创作主题（强烈建议传入，如「齐达内退役」「36氪融资」）。用于屏幕识别筛选相关配图；不传则按页面主图启发式筛选"
      },
      maxCount: {
        type: "number",
        description: "最多下载几张，默认 3，最大 9"
      }
    },
    required: []
  },
  async execute(args, ctx) {
    const pageUrl = args.pageUrl ? String(args.pageUrl) : void 0;
    const imageUrls = Array.isArray(args.imageUrls) ? args.imageUrls.map(String) : void 0;
    if (!pageUrl && (!imageUrls || imageUrls.length === 0)) {
      return "请至少提供 pageUrl 或 imageUrls 之一。";
    }
    const result = await fetchWebImages({
      pageUrl,
      imageUrls,
      topic: args.topic != null ? String(args.topic) : void 0,
      maxCount: args.maxCount != null ? Number(args.maxCount) : 3,
      signal: ctx.signal
    });
    return result.message;
  }
};
const xhsPublishNoteTool = {
  name: "xhs_publish_note",
  description: "在小红书创作平台发布笔记。必须先判断类型并传 publishType：image=图文（默认，需配图）、video=视频（需 videoPaths）、article=写长文、audio=发播客（需 audioPaths）。字数硬上限：图文/视频/播客标题≤20、正文≤1000；长文标题≤40、正文≤10000（超限自动截断）。工具会自动打开对应官方链接：?from=menu&target=image|video|article|audio，再填充标题正文。渠道「拟人操作」开启时走浏览器拟人流程；关闭时走 SDK 占位。拟人发布仅支持用户在场手动触发的一次性会话，禁止定时任务/流程无人值守托管。发布前会自动做本地同义词与口语化改写；建议人工通读微调 1～2 处后再发。图文配图优先 imagePaths（通常来自 fetch_web_images）。未登录会暂停等人扫码。",
  permission: "dangerous",
  parameters: {
    type: "object",
    properties: {
      title: {
        type: "string",
        description: "笔记标题。图文/视频/播客硬上限 20 字，长文 40 字；超限时工具会自动截断"
      },
      content: {
        type: "string",
        description: "笔记正文 / 视频描述 / 长文正文。图文/视频/播客硬上限 1000 字，长文 10000 字；撰写时务必不超过上限，超限时工具会自动截断"
      },
      publishType: {
        type: "string",
        enum: ["image", "video", "article", "audio"],
        description: "发布类型。图文=image，视频=video，写长文=article，发播客=audio。未传时：有 videoPaths→video，有 audioPaths→audio，正文≥140字且无图→article，否则 image。"
      },
      imagePaths: {
        type: "array",
        items: { type: "string" },
        description: "图文配图本地绝对路径（publishType=image 时必填，推荐先 fetch_web_images）"
      },
      videoPaths: {
        type: "array",
        items: { type: "string" },
        description: "视频本地绝对路径（publishType=video 时必填，如 mp4/mov）"
      },
      audioPaths: {
        type: "array",
        items: { type: "string" },
        description: "播客音频本地绝对路径（publishType=audio 时必填）"
      },
      imageSourceUrl: {
        type: "string",
        description: "内容来源页 URL；图文且未给 imagePaths 时，将自动从该页抓取配图"
      },
      imageUrls: {
        type: "array",
        items: { type: "string" },
        description: "图片直链；图文且未给 imagePaths 时将下载后使用"
      },
      autoPublish: {
        type: "boolean",
        description: "是否自动点击发布。任务默认 true；false 时只填好停在待发布。未登录仍会暂停等人扫码。"
      }
    },
    required: ["title", "content"]
  },
  async execute(args, ctx) {
    initPublishAdapters();
    queryPublishChannels();
    const humanized = Boolean(queryPublishChannelMeta("xhs").humanized);
    let imagePaths = args.imagePaths?.filter(Boolean) ?? [];
    const videoPaths = args.videoPaths?.filter(Boolean) ?? [];
    const audioPaths = args.audioPaths?.filter(Boolean) ?? [];
    const publishType = queryInferXhsPublishType({
      publishType: args.publishType,
      imagePaths,
      videoPaths,
      audioPaths,
      content: String(args.content ?? "")
    });
    if (publishType === "image" && !imagePaths.length) {
      const pageUrl = args.imageSourceUrl ? String(args.imageSourceUrl) : void 0;
      const imageUrls = Array.isArray(args.imageUrls) ? args.imageUrls.map(String) : void 0;
      if (pageUrl || imageUrls && imageUrls.length > 0) {
        const fetched = await fetchWebImages({
          pageUrl,
          imageUrls,
          topic: [String(args.title ?? ""), String(args.content ?? "")].filter(Boolean).join(" ").slice(0, 200),
          maxCount: 3,
          signal: ctx.signal
        });
        imagePaths = fetched.paths;
        if (!imagePaths.length) {
          return fetched.message;
        }
      }
    }
    if (publishType === "image" && !imagePaths.length && ctx.attachmentPaths.length) {
      imagePaths = [...ctx.attachmentPaths];
    }
    if (publishType === "image" && !imagePaths.length) {
      return "图文发布缺少配图。请先调用 fetch_web_images（传入内容来源 pageUrl 或 imageUrls），或在 xhs_publish_note 中传入 imageSourceUrl / imageUrls / imagePaths；用户本地上传图片为可选，有则可直接用。若实际要发视频/长文/播客，请传 publishType=video|article|audio 及对应素材路径。";
    }
    if (publishType === "video" && !videoPaths.length) {
      return "视频发布缺少 videoPaths。请传入本地视频绝对路径，并设置 publishType=video。入口：https://creator.xiaohongshu.com/publish/publish?from=menu&target=video";
    }
    if (publishType === "audio" && !audioPaths.length) {
      return "播客发布缺少 audioPaths。请传入本地音频绝对路径，并设置 publishType=audio。入口：https://creator.xiaohongshu.com/publish/publish?from=menu&target=audio";
    }
    const rewritten = queryRewriteXhsPublishCopy(
      String(args.title ?? ""),
      String(args.content ?? "")
    );
    const clamped = queryClampXhsPublishText({
      title: rewritten.title,
      content: rewritten.content,
      publishType
    });
    const rewriteNote = rewritten.rewritten ? "已对标题/正文做本地防检测改写（同义词+口语化），建议人工再微调。" : "";
    if (!humanized) {
      return queryPublishAdapter("xhs").publish({
        title: clamped.title,
        content: clamped.content,
        imagePaths,
        signal: ctx.signal,
        emitAwaitUser: ctx.emitAwaitUser
      });
    }
    const result = await publishXhsNote({
      title: clamped.title,
      content: clamped.content,
      imagePaths,
      videoPaths,
      audioPaths,
      publishType,
      autoPublish: args.autoPublish !== false,
      fullAccess: ctx.fullAccess,
      sessionId: ctx.sessionId,
      emitAwaitUser: async (reason) => {
        await ctx.emitAwaitUser(reason);
      },
      updateTasks: ctx.updateTasks,
      signal: ctx.signal
    });
    return rewriteNote ? `${rewriteNote}
${result}` : result;
  }
};
const updateTaskListTool = {
  name: "update_task_list",
  description: "更新当前会话的任务清单，用于向用户展示执行进度。",
  permission: "safe",
  parameters: {
    type: "object",
    properties: {
      tasks: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string" },
            title: { type: "string" },
            status: {
              type: "string",
              enum: ["pending", "running", "done", "failed", "skipped"]
            }
          },
          required: ["id", "title", "status"]
        }
      }
    },
    required: ["tasks"]
  },
  async execute(args, ctx) {
    const tasks = args.tasks ?? [];
    ctx.updateTasks(() => tasks);
    return `任务清单已更新，共 ${tasks.length} 项`;
  }
};
const douyinPublishNoteTool = {
  name: "douyin_publish_note",
  description: "在抖音创作者中心发布图文笔记（非视频）。渠道「拟人操作」开启时走浏览器拟人输入；关闭时走 SDK（未接入会明确提示）。配图优先使用 imagePaths（通常来自 fetch_web_images）。",
  permission: "dangerous",
  parameters: {
    type: "object",
    properties: {
      title: { type: "string", description: "作品标题，不超过 20 字" },
      content: { type: "string", description: "作品描述/正文" },
      imagePaths: {
        type: "array",
        items: { type: "string" },
        description: "配图本地绝对路径（推荐：先 fetch_web_images 再传入）"
      },
      imageSourceUrl: {
        type: "string",
        description: "内容来源页 URL；若未给 imagePaths，将自动从该页抓取配图"
      },
      imageUrls: {
        type: "array",
        items: { type: "string" },
        description: "图片直链；若未给 imagePaths，将下载后使用"
      },
      autoPublish: {
        type: "boolean",
        description: "是否自动点击发布。任务默认 true；false 时只填好停在待发布。未登录仍会暂停等人扫码。"
      }
    },
    required: ["title", "content"]
  },
  async execute(args, ctx) {
    initPublishAdapters();
    queryPublishChannels();
    const humanized = Boolean(queryPublishChannelMeta("douyin").humanized);
    let imagePaths = args.imagePaths?.filter(Boolean) ?? [];
    if (!imagePaths.length) {
      const pageUrl = args.imageSourceUrl ? String(args.imageSourceUrl) : void 0;
      const imageUrls = Array.isArray(args.imageUrls) ? args.imageUrls.map(String) : void 0;
      if (pageUrl || imageUrls && imageUrls.length > 0) {
        const fetched = await fetchWebImages({
          pageUrl,
          imageUrls,
          topic: [String(args.title ?? ""), String(args.content ?? "")].filter(Boolean).join(" ").slice(0, 200),
          maxCount: 3,
          subdir: "douyin-images",
          signal: ctx.signal
        });
        imagePaths = fetched.paths;
        if (!imagePaths.length) {
          return fetched.message;
        }
      }
    }
    if (!imagePaths.length && ctx.attachmentPaths.length) {
      const imageExt = /\.(jpe?g|png|webp|gif|bmp|avif|heic|heif|tiff?)$/i;
      imagePaths = ctx.attachmentPaths.filter((p) => imageExt.test(p));
    }
    if (!imagePaths.length) {
      return "缺少配图。请先调用 fetch_web_images（传入内容来源 pageUrl 或 imageUrls），或在 douyin_publish_note 中传入 imageSourceUrl / imageUrls / imagePaths；用户本地上传图片为可选，有则可直接用。";
    }
    const metaMax = queryPublishChannelMeta("douyin").titleMaxLength;
    const titleMax = metaMax != null && metaMax > 0 ? Math.min(metaMax, DOUYIN_TITLE_MAX_LENGTH) : DOUYIN_TITLE_MAX_LENGTH;
    const title = String(args.title ?? "").slice(0, titleMax);
    const content = String(args.content ?? "");
    if (!humanized) {
      return queryPublishAdapter("douyin").publish({
        title,
        content,
        imagePaths,
        signal: ctx.signal,
        emitAwaitUser: ctx.emitAwaitUser
      });
    }
    return publishDouyinNote({
      title,
      content,
      imagePaths,
      autoPublish: args.autoPublish !== false,
      fullAccess: ctx.fullAccess,
      emitAwaitUser: ctx.emitAwaitUser,
      updateTasks: ctx.updateTasks,
      signal: ctx.signal
    });
  }
};
async function queryWithFallback(params) {
  const errors = [];
  for (let i = 0; i < params.apiFetchers.length; i++) {
    try {
      const data = await params.apiFetchers[i]();
      const message = params.formatSuccess?.(data, "api") ?? `API 获取成功（第 ${i + 1} 路）`;
      return { ok: true, data, source: "api", errors, message };
    } catch (err) {
      errors.push(`api[${i}]: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  if (params.browserScraper) {
    try {
      const data = await params.browserScraper();
      const message = params.formatSuccess?.(data, "browser") ?? "无头浏览器兜底成功";
      return { ok: true, data, source: "browser", errors, message };
    } catch (err) {
      errors.push(`browser: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  const failLabel = params.failLabel ?? "数据获取失败";
  return {
    ok: false,
    source: "none",
    errors,
    message: `${failLabel}：${errors.join("; ") || "无可用数据源"}`
  };
}
const HOT_SOURCE_META = {
  weibo: {
    label: "微博热搜",
    pageUrl: "https://s.weibo.com/top/summary?cate=realtimehot",
    noise: /登录|热搜|实时|微博|榜单|Visitor/
  },
  baidu: {
    label: "百度热搜",
    pageUrl: "https://top.baidu.com/board?tab=realtime",
    noise: /登录|热搜|实时|百度|榜单/
  },
  douyin: {
    label: "抖音热点",
    pageUrl: "https://www.douyin.com/hot",
    noise: /登录|热点|抖音|热榜|推荐|关注/
  },
  kuaishou: {
    label: "快手热点",
    pageUrl: "https://www.kuaishou.com/?isHome=1",
    noise: /登录|热点|快手|热榜|推荐|关注/
  },
  tencent: {
    label: "腾讯新闻热点",
    pageUrl: "https://news.qq.com/",
    noise: /登录|腾讯|新闻|热点|推荐|客户端|下载/
  },
  tophub: {
    label: "今日热榜榜中榜",
    pageUrl: "https://tophub.today/hot",
    noise: /登录|今日热榜|榜中榜|热榜|推荐|夜间模式|App|开放平台|赞助商/
  }
};
const TOPHUB_BOARD_IDS = {
  weibo: "KqndgxeLl9",
  baidu: "Jb0vmloB1G",
  douyin: "DpQvNABoNE",
  kuaishou: "MZd7PrPerO",
  tencent: "12owgX0oNV"
};
const HOT_SOURCE_LIST = Object.keys(HOT_SOURCE_META);
const REQUEST_GAP_MS = 2500;
function queryEncodeWorkflowCtxResult(message, patch) {
  return `${WORKFLOW_CTX_PREFIX}${JSON.stringify({ message, patch })}`;
}
function queryFormatList(items, sourceLabel) {
  const lines = items.map((t, i) => `${i + 1}. ${t}`);
  return [`【${sourceLabel}】今日热点（共 ${items.length} 条）`, ...lines].join("\n");
}
function queryRequireHotItems(items, minCount = 3, maxCount = 25) {
  const unique = Array.from(new Set(items.map((t) => t.trim()).filter(Boolean)));
  if (unique.length < minCount) {
    throw new Error(`热点条数过少（${unique.length}）`);
  }
  return unique.slice(0, maxCount);
}
function querySleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
function queryWithRequestGap(fetchers) {
  return fetchers.map((fn, index2) => async () => {
    if (index2 > 0) await querySleep(REQUEST_GAP_MS);
    return fn();
  });
}
function collectWeiboDescs(node, out) {
  if (!node) return;
  if (Array.isArray(node)) {
    for (const item of node) collectWeiboDescs(item, out);
    return;
  }
  if (typeof node !== "object") return;
  const row = node;
  const title = String(row.desc || row.word || row.note || "").trim();
  if (title && title.length < 40 && !title.includes("http")) out.push(title);
  if (row.card_group != null) collectWeiboDescs(row.card_group, out);
  if (row.cards != null) collectWeiboDescs(row.cards, out);
  if (row.data != null) collectWeiboDescs(row.data, out);
}
async function queryWeiboHotTopicsApi() {
  const endpoints = [
    {
      url: "https://weibo.com/ajax/side/hotSearch",
      headers: { Referer: "https://weibo.com/", "X-Requested-With": "XMLHttpRequest" }
    },
    {
      url: "https://m.weibo.cn/api/container/getIndex?containerid=106003type%3D25%26t%3D3%26disable_hot%3D1%26filter_type%3Drealtimehot",
      headers: {
        Referer: "https://m.weibo.cn/",
        "MWeibo-Pwa": "1",
        "X-Requested-With": "XMLHttpRequest"
      }
    }
  ];
  const errors = [];
  for (let i = 0; i < endpoints.length; i++) {
    const ep = endpoints[i];
    if (i > 0) await querySleep(REQUEST_GAP_MS);
    try {
      const data = await queryHttpJson(ep.url, { headers: ep.headers });
      const items = [];
      collectWeiboDescs(data, items);
      const realtime = data?.data?.realtime;
      if (Array.isArray(realtime)) {
        for (const r of realtime) {
          const w = String(r.word || "").trim();
          if (w) items.push(w);
        }
      }
      return queryRequireHotItems(items);
    } catch (e) {
      errors.push(`${ep.url} → ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  throw new Error(errors.join("; ") || "微博热搜 API 不可用");
}
function collectBaiduWords(node, out) {
  if (!node) return;
  if (Array.isArray(node)) {
    for (const item of node) collectBaiduWords(item, out);
    return;
  }
  if (typeof node !== "object") return;
  const row = node;
  const title = String(row.word || row.query || row.desc || "").trim();
  if (title) out.push(title);
  if (row.content != null) collectBaiduWords(row.content, out);
  if (row.cards != null) collectBaiduWords(row.cards, out);
  if (row.topContent != null) collectBaiduWords(row.topContent, out);
}
function queryParseBaiduBoardHtml(html) {
  const match = html.match(/<!--s-data:([\s\S]*?)-->/);
  if (!match?.[1]) {
    throw new Error("百度热榜页未找到 s-data 内嵌 JSON");
  }
  const payload = JSON.parse(match[1]);
  const items = [];
  collectBaiduWords(payload.data ?? payload, items);
  return items;
}
async function queryBaiduHotTopicsApi() {
  const url2 = "https://top.baidu.com/api/board?platform=wise&tab=realtime";
  const data = await queryHttpJson(url2, {
    headers: { Referer: "https://top.baidu.com/board?tab=realtime" }
  });
  if (data.success === false) {
    throw new Error("百度热搜接口 success=false");
  }
  const items = [];
  collectBaiduWords(data.data, items);
  return queryRequireHotItems(items);
}
async function queryBaiduHotTopicsHtml() {
  const res = await queryHttp("https://top.baidu.com/board?tab=realtime", {
    headers: {
      Referer: "https://top.baidu.com/",
      Accept: "text/html,application/xhtml+xml,*/*"
    },
    timeoutMs: 3e4,
    retries: 1
  });
  const html = await res.text();
  return queryRequireHotItems(queryParseBaiduBoardHtml(html));
}
async function queryDouyinHotTopicsApi() {
  const errors = [];
  try {
    const data = await queryHttpJson("https://www.iesdouyin.com/web/api/v2/hotsearch/billboard/word/", {
      headers: { Referer: "https://www.douyin.com/" }
    });
    const items = (data.word_list ?? []).map((row) => String(row.word || "").trim()).filter(Boolean);
    return queryRequireHotItems(items);
  } catch (e) {
    errors.push(`iesdouyin → ${e instanceof Error ? e.message : String(e)}`);
  }
  await querySleep(REQUEST_GAP_MS);
  try {
    const data = await queryHttpJson(
      "https://www.douyin.com/aweme/v1/web/hot/search/list/?device_platform=webapp&aid=6383&channel=channel_pc_web&detail_list=1",
      { headers: { Referer: "https://www.douyin.com/" } }
    );
    const wordList = data.data?.word_list ?? data.word_list ?? [];
    const items = wordList.map((row) => String(row.word || "").trim()).filter(Boolean);
    return queryRequireHotItems(items);
  } catch (e) {
    errors.push(`douyin-web → ${e instanceof Error ? e.message : String(e)}`);
  }
  throw new Error(errors.join("; ") || "抖音热点 API 不可用");
}
async function queryKuaishouHotTopicsApi() {
  const data = await postHttpJson(
    "https://www.kuaishou.com/graphql",
    {
      operationName: "visionHotRank",
      variables: { page: "home" },
      query: "query visionHotRank($page: String) { visionHotRank(page: $page) { result items { id name hotValue } } }"
    },
    {
      headers: {
        Origin: "https://www.kuaishou.com",
        Referer: "https://www.kuaishou.com/"
      }
    }
  );
  if (Array.isArray(data.errors) && data.errors.length > 0) {
    throw new Error(data.errors.map((e) => e.message || "GraphQL error").join("; "));
  }
  const items = (data.data?.visionHotRank?.items ?? []).map((row) => String(row.name || row.id || "").trim()).filter(Boolean);
  return queryRequireHotItems(items);
}
async function queryTencentHotTopicsApi() {
  const data = await queryHttpJson("https://r.inews.qq.com/gw/event/hot_ranking_list?page_size=50", {
    headers: { Referer: "https://news.qq.com/" }
  });
  if (data.ret != null && data.ret !== 0) {
    throw new Error(`腾讯新闻接口 ret=${data.ret}`);
  }
  const newsList = data.idlist?.[0]?.newslist ?? [];
  const items = newsList.map((row) => String(row.title || "").trim()).filter((title) => title && !title.includes("用户最关注的热点"));
  return queryRequireHotItems(items);
}
function queryParseTophubHtmlTitles(html) {
  const items = [];
  const re = /itemid="[^"]*">([^<]+)<\/a>/g;
  let match;
  while ((match = re.exec(html)) !== null) {
    const title = match[1].replace(/\s+/g, " ").trim();
    if (title.length >= 2 && title.length <= 120) {
      items.push(title);
    }
  }
  return items;
}
async function queryTophubPageTitles(pathOrUrl) {
  const url2 = pathOrUrl.startsWith("http") ? pathOrUrl : `https://tophub.today${pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`}`;
  const res = await queryHttp(url2, {
    headers: {
      Referer: "https://tophub.today/",
      Accept: "text/html,application/xhtml+xml,*/*"
    },
    timeoutMs: 3e4,
    retries: 1
  });
  const html = await res.text();
  return queryRequireHotItems(queryParseTophubHtmlTitles(html));
}
async function queryTophubHotTopicsApi() {
  return queryTophubPageTitles("/hot");
}
async function queryTophubBoardForSource(source) {
  const boardId = TOPHUB_BOARD_IDS[source];
  if (!boardId) {
    throw new Error(`${source} 无对应 Tophub 子榜`);
  }
  return queryTophubPageTitles(`/n/${boardId}`);
}
async function queryHotTopicsViaBrowser(source) {
  const meta = HOT_SOURCE_META[source];
  const browser = getBrowserService();
  await browser.navigate(meta.pageUrl, "headless");
  const waitMs = source === "tophub" || source === "kuaishou" || source === "tencent" ? 3500 : 2e3;
  await browser.wait({ ms: waitMs }, "headless");
  if (source === "tophub") {
    const page = browser.getPage("headless");
    if (page) {
      const domTitles = await page.evaluate(() => {
        const out = [];
        for (const el of Array.from(document.querySelectorAll("a[itemid]"))) {
          const text2 = (el.textContent || "").replace(/\s+/g, " ").trim();
          if (text2.length >= 2 && text2.length <= 120) out.push(text2);
        }
        return out;
      }).catch(() => []);
      try {
        return queryRequireHotItems(domTitles);
      } catch {
      }
    }
  }
  const text = await browser.extractText({ maxLength: 3e4 }, "headless");
  const lines = text.split(/\n+/).map((l) => l.replace(/^\d+[\s.、]*/, "").trim()).filter((l) => l.length >= 2 && l.length <= 50 && !meta.noise.test(l));
  return queryRequireHotItems(lines);
}
function queryApiFetchers(source) {
  switch (source) {
    case "weibo":
      return queryWithRequestGap([
        queryWeiboHotTopicsApi,
        () => queryTophubBoardForSource("weibo")
      ]);
    case "baidu":
      return queryWithRequestGap([
        queryBaiduHotTopicsApi,
        queryBaiduHotTopicsHtml,
        () => queryTophubBoardForSource("baidu")
      ]);
    case "douyin":
      return queryWithRequestGap([
        queryDouyinHotTopicsApi,
        () => queryTophubBoardForSource("douyin")
      ]);
    case "kuaishou":
      return queryWithRequestGap([
        () => queryTophubBoardForSource("kuaishou"),
        queryKuaishouHotTopicsApi
      ]);
    case "tencent":
      return queryWithRequestGap([
        queryTencentHotTopicsApi,
        () => queryTophubBoardForSource("tencent")
      ]);
    case "tophub":
      return [queryTophubHotTopicsApi];
  }
}
function isHotTopicSource(value) {
  return HOT_SOURCE_LIST.includes(value);
}
const fetchHotTopicsTool = {
  name: "fetch_hot_topics",
  description: "获取今日热点榜单。source：weibo（微博）、baidu（百度）、douyin（抖音）、kuaishou（快手）、tencent（腾讯新闻）、tophub（今日热榜榜中榜，聚合全网，推荐综合调研首选）。日常建议优先 weibo/baidu/tophub；快手官网反爬强，内部会优先走 Tophub 子榜。仅抓取公开榜单标题，控制请求频率；API/HTML 失败时再无头浏览器兜底。成功时写入 context.hotTopicsOk=1 与 hotTopics 文本；失败时 hotTopicsOk=0。",
  permission: "safe",
  parameters: {
    type: "object",
    properties: {
      source: {
        type: "string",
        enum: HOT_SOURCE_LIST,
        description: "热点来源：推荐 tophub（聚合）/ weibo / baidu；也可 douyin / kuaishou / tencent"
      },
      maxCount: {
        type: "number",
        description: "最多返回条数，默认 20，最大 30"
      }
    },
    required: ["source"]
  },
  async execute(args) {
    const sourceRaw = String(args.source ?? "").trim();
    const maxCount = Math.min(30, Math.max(3, Number(args.maxCount ?? 20) || 20));
    if (!isHotTopicSource(sourceRaw)) {
      return queryEncodeWorkflowCtxResult(
        `source 必须是 ${HOT_SOURCE_LIST.join(" | ")}`,
        {
          hotTopicsOk: "0",
          hotSource: sourceRaw,
          hotTopics: ""
        }
      );
    }
    const source = sourceRaw;
    const label = HOT_SOURCE_META[source].label;
    const browserScraper = source === "kuaishou" ? void 0 : () => queryHotTopicsViaBrowser(source);
    const result = await queryWithFallback({
      apiFetchers: queryApiFetchers(source),
      browserScraper,
      failLabel: `获取${label}失败`,
      formatSuccess: (items, src) => {
        const text = queryFormatList(items.slice(0, maxCount), label);
        return src === "browser" ? `${text}
（来源：无头浏览器兜底）` : text;
      }
    });
    if (!result.ok || !result.data) {
      return queryEncodeWorkflowCtxResult(result.message, {
        hotTopicsOk: "0",
        hotSource: source,
        hotTopics: "",
        hotFetchSource: result.source
      });
    }
    return queryEncodeWorkflowCtxResult(result.message, {
      hotTopicsOk: "1",
      hotSource: source,
      hotTopics: result.message,
      hotFetchSource: result.source
    });
  }
};
const STOCK_CHART_PREFIX = "@@stock_chart@@";
function queryBuildStockChartBlock(charts, options) {
  const payload = {
    charts,
    liveRefresh: options?.liveRefresh
  };
  return `${STOCK_CHART_PREFIX}${JSON.stringify(payload)}`;
}
const PERIOD_KLT = {
  intraday: 5,
  daily: 101
};
const RANGE_LABEL = {
  today: "当天",
  week: "本周",
  month: "本月",
  custom: "自定义"
};
const EASTMONEY_CIRCUIT_MS = 5 * 6e4;
let eastmoneyCircuitUntil = 0;
function queryEastMoneyCircuitOpen() {
  return Date.now() < eastmoneyCircuitUntil;
}
function postOpenEastMoneyCircuit(kind, err) {
  const wasOpen = queryEastMoneyCircuitOpen();
  eastmoneyCircuitUntil = Date.now() + EASTMONEY_CIRCUIT_MS;
  if (wasOpen) return;
  const msg = err instanceof Error ? err.message : String(err);
  console.warn(
    `[ashare-kline] eastmoney ${kind} unavailable (${msg}), use sina for ${EASTMONEY_CIRCUIT_MS / 6e4}m`
  );
}
function queryShanghaiYmd(date = /* @__PURE__ */ new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const y = parts.find((p) => p.type === "year")?.value ?? "1970";
  const m = parts.find((p) => p.type === "month")?.value ?? "01";
  const d = parts.find((p) => p.type === "day")?.value ?? "01";
  return `${y}${m}${d}`;
}
function queryNormalizeYmdInput(raw) {
  const s = String(raw ?? "").trim().replace(/-/g, "");
  if (!/^\d{8}$/.test(s)) {
    throw new Error(`无效日期：${raw}，请使用 YYYY-MM-DD`);
  }
  return s;
}
function queryShanghaiWeekStartYmd(date = /* @__PURE__ */ new Date()) {
  const shDate = new Date(
    date.toLocaleString("en-US", { timeZone: "Asia/Shanghai" })
  );
  const day = shDate.getDay();
  const diff = day === 0 ? 6 : day - 1;
  shDate.setDate(shDate.getDate() - diff);
  return queryShanghaiYmd(shDate);
}
function queryShanghaiMonthStartYmd(date = /* @__PURE__ */ new Date()) {
  const shDate = new Date(
    date.toLocaleString("en-US", { timeZone: "Asia/Shanghai" })
  );
  shDate.setDate(1);
  return queryShanghaiYmd(shDate);
}
function queryResolveRangeParams(params) {
  const today = queryShanghaiYmd();
  switch (params.range) {
    case "today":
      return { beg: today, end: today, klt: PERIOD_KLT.intraday, period: "intraday" };
    case "week":
      return {
        beg: queryShanghaiWeekStartYmd(),
        end: today,
        klt: PERIOD_KLT.daily,
        period: "daily"
      };
    case "month":
      return {
        beg: queryShanghaiMonthStartYmd(),
        end: today,
        klt: PERIOD_KLT.daily,
        period: "daily"
      };
    case "custom": {
      const beg = params.startDate ? queryNormalizeYmdInput(params.startDate) : queryShanghaiMonthStartYmd();
      const end = params.endDate ? queryNormalizeYmdInput(params.endDate) : today;
      return { beg, end, klt: PERIOD_KLT.daily, period: "daily" };
    }
    default:
      return { beg: queryShanghaiMonthStartYmd(), end: today, klt: PERIOD_KLT.daily, period: "daily" };
  }
}
function queryNormalizeAshareSymbol(raw) {
  let code = String(raw ?? "").trim().toUpperCase().replace(/^(SH|SZ|BJ)\.?/i, "").replace(/\.(SH|SZ|BJ)$/i, "");
  if (!/^\d{6}$/.test(code)) {
    throw new Error(`无效 A 股代码：${raw}`);
  }
  const market = code.startsWith("6") ? "1" : "0";
  return { code, secid: `${market}.${code}` };
}
function queryParseAshareSymbols(input) {
  if (Array.isArray(input)) {
    return input.flatMap((item) => queryParseAshareSymbols(item));
  }
  if (typeof input === "string") {
    return input.split(/[,，\s]+/).map((s) => s.trim()).filter(Boolean);
  }
  return [];
}
function queryParseKlineRow(row) {
  const parts = row.split(",");
  if (parts.length < 6) return null;
  const [date, open, close, high, low, volume] = parts;
  const bar = {
    date: date.trim(),
    open: Number(open),
    close: Number(close),
    high: Number(high),
    low: Number(low),
    volume: Number(volume)
  };
  if ([bar.open, bar.close, bar.high, bar.low].some((n) => !Number.isFinite(n))) {
    return null;
  }
  return bar;
}
function queryNormalizeQuotePrice(raw) {
  if (!Number.isFinite(raw) || raw === 0) return 0;
  return raw / 100;
}
function querySinaListSymbol(code) {
  if (code.startsWith("6")) return `sh${code}`;
  if (code.startsWith("4") || code.startsWith("8")) return `bj${code}`;
  return `sz${code}`;
}
function queryParseSinaQuoteText(text) {
  const match = text.match(/="([^"]*)"/);
  if (!match?.[1]) return null;
  const parts = match[1].split(",");
  if (parts.length < 6) return null;
  const open = Number(parts[1]);
  const prevClose = Number(parts[2]);
  const price = Number(parts[3]);
  const high = Number(parts[4]);
  const low = Number(parts[5]);
  if (![open, prevClose, price, high, low].every(Number.isFinite)) return null;
  return { name: parts[0], open, prevClose, price, high, low };
}
function queryDecodeSinaText(input) {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  return new TextDecoder("gb18030").decode(bytes);
}
async function queryReadSinaResponseText(res) {
  return queryDecodeSinaText(await res.arrayBuffer());
}
async function queryEastMoneyLiveQuote(symbol) {
  const { code, secid } = queryNormalizeAshareSymbol(symbol);
  const url2 = `https://push2.eastmoney.com/api/qt/stock/get?secid=${encodeURIComponent(secid)}&fields=f43,f44,f45,f46,f47,f48,f57,f58,f60,f169,f170`;
  const data = await queryHttpJson(url2, {
    headers: { Referer: "https://quote.eastmoney.com/" },
    timeoutMs: 8e3,
    // 对端直接掐连接时重试无意义，尽快降级新浪
    retries: 0
  });
  const d = data.data ?? {};
  const price = queryNormalizeQuotePrice(Number(d.f43 ?? 0));
  const open = queryNormalizeQuotePrice(Number(d.f46 ?? 0));
  const high = queryNormalizeQuotePrice(Number(d.f44 ?? 0));
  const low = queryNormalizeQuotePrice(Number(d.f45 ?? 0));
  const changeAmount = queryNormalizeQuotePrice(Number(d.f169 ?? 0));
  const changePct = Number(d.f170 ?? 0) / 100;
  if (!Number.isFinite(price) || price <= 0) {
    throw new Error(`${code} 实时行情不可用`);
  }
  return {
    price,
    changePct,
    changeAmount,
    high,
    low,
    open,
    updatedAt: Date.now()
  };
}
async function querySinaLiveQuote(symbol) {
  const { code } = queryNormalizeAshareSymbol(symbol);
  const listCode = querySinaListSymbol(code);
  const url2 = `https://hq.sinajs.cn/list=${listCode}`;
  const res = await queryHttp(url2, {
    headers: { Referer: "https://finance.sina.com.cn/" },
    timeoutMs: 1e4,
    retries: 1
  });
  const parsed = queryParseSinaQuoteText(await queryReadSinaResponseText(res));
  if (!parsed || !Number.isFinite(parsed.price) || parsed.price <= 0) {
    throw new Error(`${code} 新浪实时行情不可用`);
  }
  const changeAmount = parsed.price - parsed.prevClose;
  const changePct = parsed.prevClose > 0 ? changeAmount / parsed.prevClose * 100 : 0;
  return {
    price: parsed.price,
    changePct,
    changeAmount,
    high: parsed.high,
    low: parsed.low,
    open: parsed.open,
    updatedAt: Date.now()
  };
}
async function queryAshareLiveQuote(symbol) {
  if (queryEastMoneyCircuitOpen()) {
    return querySinaLiveQuote(symbol);
  }
  try {
    return await queryEastMoneyLiveQuote(symbol);
  } catch (emErr) {
    postOpenEastMoneyCircuit("quote", emErr);
    return querySinaLiveQuote(symbol);
  }
}
async function queryFetchEastMoneyBars(secid, beg, end, klt, lmt) {
  const url2 = `https://push2his.eastmoney.com/api/qt/stock/kline/get?secid=${encodeURIComponent(secid)}&fields1=f1,f2,f3,f4,f5,f6&fields2=f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61&klt=${klt}&fqt=1&beg=${beg}&end=${end}&lmt=${lmt}`;
  const data = await queryHttpJson(url2, {
    headers: { Referer: "https://quote.eastmoney.com/" },
    timeoutMs: 8e3,
    retries: 0
  });
  const bars = (data.data?.klines ?? []).map(queryParseKlineRow).filter((b) => b != null);
  return { bars, name: String(data.data?.name ?? "") };
}
function querySinaKlineScale(klt) {
  return klt === PERIOD_KLT.intraday ? 5 : 240;
}
function queryFilterSinaBars(bars, beg, end, intraday) {
  if (intraday) {
    const dayPrefix = `${beg.slice(0, 4)}-${beg.slice(4, 6)}-${beg.slice(6, 8)}`;
    return bars.filter((b) => b.date.startsWith(dayPrefix));
  }
  return bars.filter((b) => {
    const ymd = b.date.replace(/-/g, "").slice(0, 8);
    return ymd >= beg && ymd <= end;
  });
}
async function queryFetchSinaBars(code, beg, end, klt, lmt) {
  const listCode = querySinaListSymbol(code);
  const scale = querySinaKlineScale(klt);
  const datalen = Math.min(1023, Math.max(30, lmt));
  const url2 = `https://money.finance.sina.com.cn/quotes_service/api/json_v2.php/CN_MarketData.getKLineData?symbol=${encodeURIComponent(listCode)}&scale=${scale}&ma=no&datalen=${datalen}`;
  const rows = await queryHttpJson(url2, {
    headers: { Referer: "https://finance.sina.com.cn/" },
    timeoutMs: 15e3,
    retries: 1
  });
  const intraday = scale === 5;
  const bars = (Array.isArray(rows) ? rows : []).map((row) => {
    const bar = {
      date: row.day,
      open: Number(row.open),
      high: Number(row.high),
      low: Number(row.low),
      close: Number(row.close),
      volume: Number(row.volume)
    };
    if ([bar.open, bar.high, bar.low, bar.close].some((n) => !Number.isFinite(n))) {
      return null;
    }
    return bar;
  }).filter((b) => b != null);
  const filtered = queryFilterSinaBars(bars, beg, end, intraday);
  let name = code;
  try {
    const quoteRes = await queryHttp(
      `https://hq.sinajs.cn/list=${encodeURIComponent(listCode)}`,
      {
        headers: { Referer: "https://finance.sina.com.cn/" },
        timeoutMs: 8e3,
        retries: 0
      }
    );
    const parsed = queryParseSinaQuoteText(await queryReadSinaResponseText(quoteRes));
    if (parsed?.name) name = parsed.name;
  } catch {
  }
  return { bars: filtered, name };
}
async function queryFetchAshareBars(code, secid, beg, end, klt, lmt) {
  if (queryEastMoneyCircuitOpen()) {
    return queryFetchSinaBars(code, beg, end, klt, lmt);
  }
  try {
    return await queryFetchEastMoneyBars(secid, beg, end, klt, lmt);
  } catch (emErr) {
    postOpenEastMoneyCircuit("kline", emErr);
    return queryFetchSinaBars(code, beg, end, klt, lmt);
  }
}
async function queryAshareKlineByRange(symbol, rangeParams, count = 500) {
  const { code, secid } = queryNormalizeAshareSymbol(symbol);
  const { beg, end, klt, period } = queryResolveRangeParams(rangeParams);
  const lmt = Math.min(1e3, Math.max(30, Math.floor(count) || 500));
  let { bars, name } = await queryFetchAshareBars(code, secid, beg, end, klt, lmt);
  if (bars.length === 0 && rangeParams.range === "today") {
    const fallback = await queryFetchAshareBars(code, secid, beg, end, PERIOD_KLT.daily, lmt);
    bars = fallback.bars;
    name = fallback.name || name;
  }
  if (bars.length === 0) {
    throw new Error(`${code} 未返回 K 线（${RANGE_LABEL[rangeParams.range]}，可能停牌）`);
  }
  let quote;
  try {
    quote = await queryAshareLiveQuote(symbol);
  } catch {
  }
  return {
    symbol: code,
    name: name || code,
    range: rangeParams.range,
    period,
    bars,
    startDate: beg,
    endDate: end,
    quote
  };
}
async function queryAshareKline(symbol, period = "daily", count = 120) {
  const range = period === "intraday" ? "today" : period === "weekly" ? "week" : "month";
  if (period === "daily") {
    return queryAshareKlineByRange(symbol, { range: "month" }, count);
  }
  return queryAshareKlineByRange(symbol, { range }, count);
}
async function queryAshareKlineMultiRange(symbol, primaryRange, custom) {
  const ranges = primaryRange === "custom" ? ["today", "week", "month", "custom"] : ["today", "week", "month"];
  const rangeBars = {};
  let primary = null;
  for (const range of ranges) {
    try {
      const chart = await queryAshareKlineByRange(symbol, {
        range,
        startDate: range === "custom" ? custom?.startDate : void 0,
        endDate: range === "custom" ? custom?.endDate : void 0
      });
      rangeBars[range] = chart.bars;
      if (range === primaryRange) primary = chart;
    } catch {
    }
  }
  if (!primary) {
    primary = await queryAshareKlineByRange(symbol, {
      range: primaryRange,
      startDate: custom?.startDate,
      endDate: custom?.endDate
    });
    rangeBars[primaryRange] = primary.bars;
  }
  return {
    ...primary,
    rangeBars
  };
}
async function queryAshareKlineBatch(symbols, period = "daily", count = 120) {
  const unique = Array.from(new Set(symbols.map((s) => s.trim()).filter(Boolean)));
  const charts = [];
  const errors = [];
  for (const symbol of unique) {
    try {
      charts.push(await queryAshareKline(symbol, period, count));
    } catch (e) {
      errors.push(`${symbol}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  return { charts, errors };
}
function queryFormatKlineSummary(charts) {
  return charts.map((c) => {
    const last = c.bars[c.bars.length - 1];
    const rangeLabel = RANGE_LABEL[c.range] ?? c.range;
    const quotePart = c.quote != null ? `，现价 ${c.quote.price.toFixed(2)}（${c.quote.changePct >= 0 ? "+" : ""}${c.quote.changePct.toFixed(2)}%）` : "";
    return `- ${c.name}（${c.symbol}）${rangeLabel}：${c.bars.length} 根，最新 ${last.date} 收 ${last.close.toFixed(2)}${quotePart}`;
  }).join("\n");
}
function querySma(values, period) {
  const out = [];
  for (let i = 0; i < values.length; i++) {
    if (i + 1 < period) {
      out.push(NaN);
      continue;
    }
    const slice = values.slice(i + 1 - period, i + 1);
    out.push(slice.reduce((a, b) => a + b, 0) / period);
  }
  return out;
}
function queryEma(values, period) {
  const out = [];
  const k = 2 / (period + 1);
  for (let i = 0; i < values.length; i++) {
    if (i === 0) {
      out.push(values[0]);
      continue;
    }
    out.push(values[i] * k + out[i - 1] * (1 - k));
  }
  return out;
}
function queryRsi(closes, period = 14) {
  const out = new Array(closes.length).fill(NaN);
  if (closes.length <= period) return out;
  let gain = 0;
  let loss = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gain += diff;
    else loss -= diff;
  }
  let avgGain = gain / period;
  let avgLoss = loss / period;
  out[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const g = diff > 0 ? diff : 0;
    const l = diff < 0 ? -diff : 0;
    avgGain = (avgGain * (period - 1) + g) / period;
    avgLoss = (avgLoss * (period - 1) + l) / period;
    out[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }
  return out;
}
function queryMacd(closes) {
  const ema12 = queryEma(closes, 12);
  const ema26 = queryEma(closes, 26);
  const dif = ema12.map((v, i) => v - ema26[i]);
  const dea = queryEma(dif, 9);
  const hist = dif.map((v, i) => v - dea[i]);
  return { dif, dea, hist };
}
function queryLastValid(values) {
  for (let i = values.length - 1; i >= 0; i--) {
    if (Number.isFinite(values[i])) return values[i];
  }
  return void 0;
}
function queryDetectCross(fast, slow, index2) {
  if (index2 < 1) return null;
  const prevFast = fast[index2 - 1];
  const prevSlow = slow[index2 - 1];
  const curFast = fast[index2];
  const curSlow = slow[index2];
  if (![prevFast, prevSlow, curFast, curSlow].every(Number.isFinite)) return null;
  if (prevFast <= prevSlow && curFast > curSlow) return "golden";
  if (prevFast >= prevSlow && curFast < curSlow) return "death";
  return null;
}
function queryExtractTradeSignals(bars, ma5, ma20, rsi, macdHist) {
  const signals = [];
  const start = Math.max(20, bars.length - 30);
  for (let i = start; i < bars.length; i++) {
    const bar = bars[i];
    const cross = queryDetectCross(ma5, ma20, i);
    if (cross === "golden") {
      signals.push({
        type: "buy",
        date: bar.date,
        price: bar.close,
        reason: "MA5 上穿 MA20（金叉）"
      });
    } else if (cross === "death") {
      signals.push({
        type: "sell",
        date: bar.date,
        price: bar.close,
        reason: "MA5 下穿 MA20（死叉）"
      });
    }
    const rsiVal = rsi[i];
    const prevRsi = rsi[i - 1];
    if (Number.isFinite(rsiVal) && Number.isFinite(prevRsi)) {
      if (prevRsi < 30 && rsiVal >= 30) {
        signals.push({
          type: "buy",
          date: bar.date,
          price: bar.close,
          reason: "RSI 脱离超卖区（<30）"
        });
      } else if (prevRsi > 70 && rsiVal <= 70) {
        signals.push({
          type: "sell",
          date: bar.date,
          price: bar.close,
          reason: "RSI 脱离超买区（>70）"
        });
      }
    }
    const hist = macdHist[i];
    const prevHist = macdHist[i - 1];
    if (Number.isFinite(hist) && Number.isFinite(prevHist)) {
      if (prevHist <= 0 && hist > 0) {
        signals.push({
          type: "buy",
          date: bar.date,
          price: bar.close,
          reason: "MACD 柱由负转正"
        });
      } else if (prevHist >= 0 && hist < 0) {
        signals.push({
          type: "sell",
          date: bar.date,
          price: bar.close,
          reason: "MACD 柱由正转负"
        });
      }
    }
  }
  const seen = /* @__PURE__ */ new Set();
  return signals.reverse().filter((s) => {
    const key = `${s.type}:${s.date}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).reverse().slice(-8);
}
function queryPredictPrice(bars, indicators, trend) {
  const last = bars[bars.length - 1];
  let score = 0;
  if (indicators.ma5 != null && indicators.ma20 != null) {
    score += indicators.ma5 > indicators.ma20 ? 1.5 : -1.5;
  }
  if (indicators.rsi14 != null) {
    if (indicators.rsi14 < 35) score += 1;
    else if (indicators.rsi14 > 65) score -= 1;
    else if (indicators.rsi14 > 50) score += 0.3;
    else score -= 0.3;
  }
  if (indicators.macdHist != null) {
    score += indicators.macdHist > 0 ? 0.8 : -0.8;
  }
  const recent = bars.slice(-5);
  const momentum = recent.length >= 2 ? (recent[recent.length - 1].close - recent[0].open) / recent[0].open : 0;
  score += momentum > 0.02 ? 0.5 : momentum < -0.02 ? -0.5 : 0;
  if (trend === "bullish") score += 0.5;
  if (trend === "bearish") score -= 0.5;
  let direction = "sideways";
  if (score >= 1.2) direction = "up";
  else if (score <= -1.2) direction = "down";
  const confidence = Math.min(85, Math.max(35, Math.round(50 + Math.abs(score) * 12)));
  const changePctEstimate = direction === "up" ? 1.5 + confidence * 0.03 : direction === "down" ? -(1.5 + confidence * 0.03) : 0;
  const targetPrice = direction === "up" ? last.close * (1 + changePctEstimate / 100) : direction === "down" ? last.close * (1 + changePctEstimate / 100) : last.close;
  const lows = bars.slice(-20).map((b) => b.low);
  const stopLoss = direction === "up" ? Math.min(...lows) : Math.max(...bars.slice(-20).map((b) => b.high));
  return {
    direction,
    confidence,
    horizon: "短期 3～5 个交易日",
    targetPrice: Number(targetPrice.toFixed(2)),
    stopLoss: Number(stopLoss.toFixed(2)),
    changePctEstimate: Number(changePctEstimate.toFixed(2))
  };
}
function queryScoreOverallSignal(tradeSignals, trend, prediction, indicators) {
  let score = 0;
  const reasons = [];
  const recent = tradeSignals.slice(-3);
  const weights = [0.5, 0.8, 1.2];
  recent.forEach((sig, i) => {
    const w = weights[weights.length - recent.length + i] ?? 0.5;
    if (sig.type === "buy") {
      score += w;
      reasons.push(`近信号买入+${w}`);
    } else {
      score -= w;
      reasons.push(`近信号卖出-${w}`);
    }
  });
  if (trend === "bullish") {
    score += 1;
    reasons.push("均线多头+1");
  } else if (trend === "bearish") {
    score -= 1;
    reasons.push("均线空头-1");
  }
  if (prediction.direction === "up") {
    const w = prediction.confidence >= 55 ? 1.2 : 0.5;
    score += w;
    reasons.push(`预测看涨+${w}`);
  } else if (prediction.direction === "down") {
    const w = prediction.confidence >= 55 ? 1.2 : 0.5;
    score -= w;
    reasons.push(`预测看跌-${w}`);
  }
  if (indicators.ma5 != null && indicators.ma20 != null) {
    if (indicators.ma5 > indicators.ma20) {
      score += 0.4;
      reasons.push("MA5>MA20+0.4");
    } else if (indicators.ma5 < indicators.ma20) {
      score -= 0.4;
      reasons.push("MA5<MA20-0.4");
    }
  }
  let overallSignal = "hold";
  if (score >= 1.2) overallSignal = "buy";
  else if (score <= -1.2) overallSignal = "sell";
  const reason = reasons.length > 0 ? `得分 ${score.toFixed(1)} → ${overallSignal}（${reasons.slice(0, 4).join("；")}）` : `得分 ${score.toFixed(1)} → hold`;
  return { score, overallSignal, reason };
}
function queryBuildSummary(chart, trend, indicators, prediction, overallSignal, tradeSignals, scoreReason) {
  const trendLabel = { bullish: "偏多", bearish: "偏空", neutral: "震荡" }[trend];
  const signalLabel = { buy: "买入", sell: "卖出", hold: "观望" }[overallSignal];
  const dirLabel = { up: "看涨", down: "看跌", sideways: "横盘" }[prediction.direction];
  const lastSignal = tradeSignals[tradeSignals.length - 1];
  const lines = [
    `【${chart.name}（${chart.symbol}）】`,
    `- 趋势：${trendLabel}；综合信号：**${signalLabel}**`,
    scoreReason ? `- 打分：${scoreReason}` : "",
    `- 预测：${dirLabel}（置信度 ${prediction.confidence}%），${prediction.horizon}`,
    prediction.targetPrice != null ? `- 参考目标价 ${prediction.targetPrice}，止损参考 ${prediction.stopLoss}` : "",
    indicators.ma5 != null && indicators.ma20 != null ? `- 均线：MA5=${indicators.ma5.toFixed(2)}，MA20=${indicators.ma20.toFixed(2)}` : "",
    indicators.rsi14 != null ? `- RSI14=${indicators.rsi14.toFixed(1)}` : "",
    lastSignal ? `- 最近信号：${lastSignal.type === "buy" ? "买入" : "卖出"} @ ${lastSignal.price}（${lastSignal.reason}）` : ""
  ];
  return lines.filter(Boolean).join("\n");
}
function queryAnalyzeStockChart(chart) {
  const bars = chart.bars;
  const closes = bars.map((b) => b.close);
  const ma5 = querySma(closes, 5);
  const ma10 = querySma(closes, 10);
  const ma20 = querySma(closes, 20);
  const rsi = queryRsi(closes, 14);
  const { dif, dea, hist } = queryMacd(closes);
  const indicators = {
    ma5: queryLastValid(ma5),
    ma10: queryLastValid(ma10),
    ma20: queryLastValid(ma20),
    rsi14: queryLastValid(rsi),
    macdDif: queryLastValid(dif),
    macdDea: queryLastValid(dea),
    macdHist: queryLastValid(hist)
  };
  let trend = "neutral";
  if (indicators.ma5 != null && indicators.ma10 != null && indicators.ma20 != null && indicators.ma5 > indicators.ma10 && indicators.ma10 > indicators.ma20) {
    trend = "bullish";
  } else if (indicators.ma5 != null && indicators.ma10 != null && indicators.ma20 != null && indicators.ma5 < indicators.ma10 && indicators.ma10 < indicators.ma20) {
    trend = "bearish";
  }
  const tradeSignals = queryExtractTradeSignals(bars, ma5, ma20, rsi, hist);
  const prediction = queryPredictPrice(bars, indicators, trend);
  const scored = queryScoreOverallSignal(tradeSignals, trend, prediction, indicators);
  const overallSignal = scored.overallSignal;
  return {
    symbol: chart.symbol,
    name: chart.name,
    trend,
    overallSignal,
    prediction,
    indicators,
    tradeSignals,
    summary: queryBuildSummary(
      chart,
      trend,
      indicators,
      prediction,
      overallSignal,
      tradeSignals,
      scored.reason
    )
  };
}
function queryFormatAnalysisReport(charts) {
  return charts.map((c) => c.analysis?.summary ?? `${c.name}（${c.symbol}）暂无分析`).join("\n\n");
}
function queryBuildRealtimeAnalysisContext(charts) {
  const buy = [];
  const sell = [];
  const hold = [];
  for (const c of charts) {
    const sig = c.analysis?.overallSignal ?? "hold";
    if (sig === "buy") buy.push(c);
    else if (sig === "sell") sell.push(c);
    else hold.push(c);
  }
  const fmt = (list) => list.map((c) => c.analysis?.summary ?? `${c.name}（${c.symbol}）暂无分析`).join("\n\n");
  const buyN = buy.length;
  const sellN = sell.length;
  const holdN = hold.length;
  let stockSignal = "hold";
  if (buyN > sellN && buyN > holdN) stockSignal = "buy";
  else if (sellN > buyN && sellN > holdN) stockSignal = "sell";
  return {
    stockHasBuy: buyN > 0 ? "1" : "0",
    stockHasSell: sellN > 0 ? "1" : "0",
    stockHasHold: holdN > 0 ? "1" : "0",
    stockBuySymbols: buy.map((c) => c.symbol).join(","),
    stockSellSymbols: sell.map((c) => c.symbol).join(","),
    stockHoldSymbols: hold.map((c) => c.symbol).join(","),
    stockBuyReport: fmt(buy),
    stockSellReport: fmt(sell),
    stockHoldReport: fmt(hold),
    stockSignal,
    stockAnalysisReport: queryFormatAnalysisReport(charts)
  };
}
const VALID_PERIODS = /* @__PURE__ */ new Set(["daily", "weekly", "monthly"]);
const VALID_RANGES = /* @__PURE__ */ new Set(["today", "week", "month", "custom"]);
function queryParsePeriod(raw) {
  const period = String(raw ?? "daily").trim();
  return VALID_PERIODS.has(period) ? period : "daily";
}
function queryParseRange(raw) {
  const range = String(raw ?? "today").trim();
  return VALID_RANGES.has(range) ? range : "today";
}
async function queryAshareRealtimeAnalysisCharts(symbols, range, options = {}) {
  const charts = [];
  const errors = [];
  const preloadRanges = options.preloadRanges !== false;
  const count = options.count ?? 500;
  for (const symbol of symbols) {
    try {
      let chart;
      if (preloadRanges) {
        chart = await queryAshareKlineMultiRange(symbol, range, {
          startDate: options.startDate,
          endDate: options.endDate
        });
      } else {
        chart = await queryAshareKlineByRange(
          symbol,
          { range, startDate: options.startDate, endDate: options.endDate },
          count
        );
      }
      chart.analysis = queryAnalyzeStockChart(chart);
      charts.push(chart);
    } catch (e) {
      errors.push(`${symbol}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  return { charts, errors };
}
const queryAshareKlineTool = {
  name: "query_ashare_kline",
  description: "获取 A 股股票 K 线数据，并在聊天界面展示可交互 K 线图。symbols 为股票代码，多个用英文逗号分隔，如 600519,000001；period 可选 daily（日K）/ weekly（周K）/ monthly（月K）；count 为 K 线条数，默认 120。",
  permission: "safe",
  parameters: {
    type: "object",
    properties: {
      symbols: {
        oneOf: [
          { type: "string", description: "股票代码，英文逗号分隔，如 600519,000001" },
          { type: "array", items: { type: "string" }, description: "股票代码数组" }
        ],
        description: "一只或多只 A 股代码"
      },
      period: {
        type: "string",
        enum: ["daily", "weekly", "monthly"],
        description: "K 线周期，默认 daily"
      },
      count: { type: "number", description: "K 线条数，默认 120，最大 500" }
    },
    required: ["symbols"]
  },
  async execute(args) {
    const symbols = queryParseAshareSymbols(args.symbols);
    const period = queryParsePeriod(args.period);
    const count = Math.min(500, Math.max(10, Number(args.count ?? 120) || 120));
    if (symbols.length === 0) {
      return queryEncodeWorkflowCtxResult("请提供至少一个 A 股股票代码（英文逗号分隔）。", {
        stockKlineOk: "0",
        stockSymbols: "",
        stockKlineSummary: ""
      });
    }
    const { charts, errors } = await queryAshareKlineBatch(symbols, period, count);
    if (charts.length === 0) {
      const errText = errors.length ? errors.join("；") : "全部股票拉取失败";
      return queryEncodeWorkflowCtxResult(`获取 K 线失败：${errText}`, {
        stockKlineOk: "0",
        stockSymbols: symbols.join(","),
        stockKlineSummary: ""
      });
    }
    const summaryLines = [
      `已获取 ${charts.length} 只股票 K 线：`,
      queryFormatKlineSummary(charts)
    ];
    if (errors.length) summaryLines.push("", `部分失败：${errors.join("；")}`);
    const chartBlock = queryBuildStockChartBlock(charts);
    return queryEncodeWorkflowCtxResult(`${summaryLines.join("\n")}
${chartBlock}`, {
      stockKlineOk: "1",
      stockSymbols: charts.map((c) => c.symbol).join(","),
      stockKlineSummary: summaryLines.join("\n"),
      stockChartJson: JSON.stringify({ charts }),
      stockKlineErrors: errors.join("；")
    });
  }
};
const queryAshareRealtimeAnalysisTool = {
  name: "query_ashare_realtime_analysis",
  description: "获取 A 股实时 K 线、技术指标综合分析、买入/卖出信号与短期涨跌预测，并在聊天界面可交互预览。symbols：股票代码，多个英文逗号分隔；每只股票独立分析；range：today（当天）/ week（本周）/ month（本月）/ custom（自定义，需 startDate/endDate）；preloadRanges=true 时预加载今天/本周/本月三套数据供聊天内切换；输出 stockHasBuy/stockHasSell/stockHasHold（1/0）与分组报告，供多分支同时命中；另输出 stockSignal（多数票，平票 hold）兼容旧 XOR 条件。",
  permission: "safe",
  parameters: {
    type: "object",
    properties: {
      symbols: {
        oneOf: [
          { type: "string", description: "如 600519,000001" },
          { type: "array", items: { type: "string" } }
        ]
      },
      range: {
        type: "string",
        enum: ["today", "week", "month", "custom"],
        description: "时间范围，默认 today（当天实时分时）"
      },
      startDate: {
        type: "string",
        description: "自定义起始日期 YYYY-MM-DD（range=custom 时必填）"
      },
      endDate: {
        type: "string",
        description: "自定义结束日期 YYYY-MM-DD（range=custom 时必填）"
      },
      preloadRanges: {
        type: "boolean",
        description: "是否预加载今天/本周/本月数据供聊天切换，默认 true"
      },
      count: { type: "number", description: "K 线最大条数，默认 500" }
    },
    required: ["symbols"]
  },
  async execute(args) {
    const symbols = queryParseAshareSymbols(args.symbols);
    const range = queryParseRange(args.range);
    const startDate = args.startDate ? String(args.startDate) : void 0;
    const endDate = args.endDate ? String(args.endDate) : void 0;
    const preloadRanges = args.preloadRanges !== false;
    const count = Math.min(1e3, Math.max(30, Number(args.count ?? 500) || 500));
    if (symbols.length === 0) {
      return queryEncodeWorkflowCtxResult("请提供至少一个 A 股股票代码（英文逗号分隔）。", {
        stockAnalysisOk: "0",
        stockSignal: "hold",
        stockHasBuy: "0",
        stockHasSell: "0",
        stockHasHold: "1",
        stockHoldReport: "未提供股票代码，无法分析。",
        stockSymbols: ""
      });
    }
    if (range === "custom" && (!startDate || !endDate)) {
      return queryEncodeWorkflowCtxResult(
        "range=custom 时请同时提供 startDate 与 endDate（YYYY-MM-DD）。",
        {
          stockAnalysisOk: "0",
          stockSignal: "hold",
          stockHasBuy: "0",
          stockHasSell: "0",
          stockHasHold: "1",
          stockHoldReport: "自定义区间缺少 startDate/endDate。",
          stockSymbols: symbols.join(",")
        }
      );
    }
    const { charts, errors } = await queryAshareRealtimeAnalysisCharts(symbols, range, {
      startDate,
      endDate,
      preloadRanges,
      count
    });
    if (charts.length === 0) {
      const errText = errors.length ? errors.join("；") : "全部股票拉取失败";
      return queryEncodeWorkflowCtxResult(`实时 K 线分析失败：${errText}`, {
        stockAnalysisOk: "0",
        stockSignal: "hold",
        stockHasBuy: "0",
        stockHasSell: "0",
        stockHasHold: "1",
        stockHoldReport: `分析失败：${errText}`,
        stockSymbols: symbols.join(",")
      });
    }
    const signalCtx = queryBuildRealtimeAnalysisContext(charts);
    const analysisReport = signalCtx.stockAnalysisReport;
    const summaryLines = [
      `已分析 ${charts.length} 只股票（范围：${range}）：`,
      queryFormatKlineSummary(charts),
      "",
      "--- 综合分析 ---",
      analysisReport
    ];
    if (errors.length) summaryLines.push("", `部分失败：${errors.join("；")}`);
    const signalSummary = charts.map(
      (c) => `${c.name}（${c.symbol}）：${c.analysis?.overallSignal === "buy" ? "买入" : c.analysis?.overallSignal === "sell" ? "卖出" : "观望"}`
    ).join("；");
    const liveRefresh = false;
    const chartBlock = queryBuildStockChartBlock(charts, { liveRefresh });
    const message = `${summaryLines.join("\n")}
${chartBlock}`;
    return queryEncodeWorkflowCtxResult(message, {
      stockAnalysisOk: "1",
      stockSymbols: charts.map((c) => c.symbol).join(","),
      stockKlineSummary: summaryLines.join("\n"),
      ...signalCtx,
      stockSignalSummary: signalSummary,
      stockChartJson: JSON.stringify({ charts, liveRefresh }),
      stockRange: range,
      stockKlineErrors: errors.join("；")
    });
  }
};
const DEFAULT_CITY_WHEN_NO_LOC = "合肥";
const HOURLY_FORECAST_COUNT = 24;
const DAILY_FORECAST_DAYS = 3;
const WMO_WEATHER_ZH = {
  0: "晴",
  1: "大部晴朗",
  2: "局部多云",
  3: "阴",
  45: "雾",
  48: "雾凇",
  51: "小毛毛雨",
  53: "毛毛雨",
  55: "大毛毛雨",
  56: "冻毛毛雨",
  57: "冻毛毛雨",
  61: "小雨",
  63: "中雨",
  65: "大雨",
  66: "冻雨",
  67: "冻雨",
  71: "小雪",
  73: "中雪",
  75: "大雪",
  77: "雪粒",
  80: "小阵雨",
  81: "阵雨",
  82: "大阵雨",
  85: "小阵雪",
  86: "大阵雪",
  95: "雷暴",
  96: "雷暴伴小冰雹",
  99: "雷暴伴大冰雹"
};
function queryWmoWeatherZh(code) {
  return WMO_WEATHER_ZH[code] ?? `天气代码 ${code}`;
}
function queryWindDirectionZh(deg) {
  const dirs = ["北", "东北", "东", "东南", "南", "西南", "西", "西北"];
  const idx = Math.round(deg / 45) % 8;
  return `${dirs[idx]}风`;
}
function queryFormatTempC(value) {
  if (value == null || value === "") return void 0;
  const n = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(n)) return void 0;
  return `${Math.round(n * 10) / 10}°C`;
}
function queryFormatNum(value, digits = 1, suffix = "") {
  if (value == null || value === "") return void 0;
  const n = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(n)) return void 0;
  const rounded = digits === 0 ? Math.round(n) : Math.round(n * 10 ** digits) / 10 ** digits;
  return `${rounded}${suffix}`;
}
function queryFormatPct(value) {
  return queryFormatNum(value, 0, "%");
}
function queryFormatMm(value) {
  return queryFormatNum(value, 1, " mm");
}
function queryFormatKmh(value) {
  return queryFormatNum(value, 1, " km/h");
}
function queryFormatHpa(value) {
  return queryFormatNum(value, 1, " hPa");
}
function queryFormatDurationSec(sec) {
  if (sec == null || Number.isNaN(sec)) return void 0;
  const h = Math.floor(sec / 3600);
  const m = Math.round(sec % 3600 / 60);
  if (h <= 0) return `${m} 分钟`;
  return m > 0 ? `${h} 小时 ${m} 分钟` : `${h} 小时`;
}
function queryFormatDateLabel(iso) {
  const m = iso.match(/^(\d{4}-\d{2}-\d{2})/);
  return m?.[1] ?? iso;
}
function queryFormatHourLabel(iso) {
  const m = iso.match(/T(\d{2}:\d{2})/);
  return m?.[1] ?? iso;
}
function queryUpcomingHourlyIndices(times, fromIso, count) {
  const fromMs = new Date(fromIso).getTime();
  const out = [];
  for (let i = 0; i < times.length && out.length < count; i++) {
    if (new Date(times[i]).getTime() >= fromMs) out.push(i);
  }
  return out;
}
function queryBuildWeatherRawText(sections) {
  return sections.filter((s) => s.lines.some((l) => l.trim())).map((s) => [`【${s.title}】`, ...s.lines.filter((l) => l.trim())].join("\n")).join("\n\n");
}
function queryNormalizeCityName(raw) {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;
  const stripped = trimmed.replace(/(特别行政区|自治州|地区|盟|市|省|区|县)$/u, "").trim();
  return stripped || trimmed;
}
async function queryGeocodeViaOpenMeteo(city) {
  const queryName = queryNormalizeCityName(city);
  const url2 = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(queryName)}&count=10&language=zh&format=json`;
  const data = await queryHttpJson(url2, {
    timeoutMs: 12e3
  });
  const results = data.results ?? [];
  if (results.length === 0) {
    throw new Error(`未找到城市「${city}」（检索词：${queryName}）`);
  }
  const cnHits = results.filter((r) => r.country_code === "CN");
  const pick2 = cnHits[0] ?? results[0];
  const lat = pick2.latitude;
  const lon = pick2.longitude;
  if (lat == null || lon == null) {
    throw new Error(`城市「${city}」坐标无效`);
  }
  const label = [pick2.name, pick2.admin1].filter(Boolean).join("·") || queryName;
  return { label, latitude: lat, longitude: lon };
}
async function queryAirQualityViaOpenMeteo(latitude, longitude) {
  try {
    const url2 = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&current=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,us_aqi&timezone=Asia%2FShanghai`;
    const data = await queryHttpJson(url2, { timeoutMs: 1e4 });
    const a = data.current;
    if (!a) return null;
    const lines = [
      a.us_aqi != null ? `美国 AQI：${Math.round(a.us_aqi)}` : "",
      a.pm2_5 != null ? `PM2.5：${queryFormatNum(a.pm2_5, 1, " μg/m³")}` : "",
      a.pm10 != null ? `PM10：${queryFormatNum(a.pm10, 1, " μg/m³")}` : "",
      a.ozone != null ? `臭氧 O₃：${queryFormatNum(a.ozone, 1, " μg/m³")}` : "",
      a.nitrogen_dioxide != null ? `二氧化氮 NO₂：${queryFormatNum(a.nitrogen_dioxide, 1, " μg/m³")}` : "",
      a.sulphur_dioxide != null ? `二氧化硫 SO₂：${queryFormatNum(a.sulphur_dioxide, 1, " μg/m³")}` : "",
      a.carbon_monoxide != null ? `一氧化碳 CO：${queryFormatNum(a.carbon_monoxide, 1, " μg/m³")}` : ""
    ].filter(Boolean);
    if (lines.length === 0) return null;
    const summary = a.us_aqi != null ? `AQI ${Math.round(a.us_aqi)}` : a.pm2_5 != null ? `PM2.5 ${queryFormatNum(a.pm2_5, 1)}` : "已获取";
    return { summary, lines };
  } catch {
    return null;
  }
}
async function queryWeatherViaOpenMeteo(city) {
  const geo = await queryGeocodeViaOpenMeteo(city);
  const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${geo.latitude}&longitude=${geo.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,sunrise,sunset,daylight_duration,sunshine_duration,uv_index_max,precipitation_sum,rain_sum,showers_sum,snowfall_sum,precipitation_hours,precipitation_probability_max,wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant&hourly=temperature_2m,relative_humidity_2m,dew_point_2m,apparent_temperature,precipitation_probability,precipitation,rain,showers,snowfall,weather_code,cloud_cover,visibility,wind_speed_10m,wind_direction_10m,wind_gusts_10m,uv_index,is_day&forecast_days=${DAILY_FORECAST_DAYS}&timezone=Asia%2FShanghai`;
  const [forecast, air] = await Promise.all([
    queryHttpJson(forecastUrl, { timeoutMs: 15e3 }),
    queryAirQualityViaOpenMeteo(geo.latitude, geo.longitude)
  ]);
  const cur = forecast.current;
  if (!cur) throw new Error("Open-Meteo 无 current 实况");
  const desc = queryWmoWeatherZh(cur.weather_code ?? -1);
  const temperature = queryFormatTempC(cur.temperature_2m);
  const feelsLike = queryFormatTempC(cur.apparent_temperature);
  const humidity = queryFormatPct(cur.relative_humidity_2m);
  const windSpeed = queryFormatKmh(cur.wind_speed_10m);
  const windDir = cur.wind_direction_10m != null ? queryWindDirectionZh(cur.wind_direction_10m) : void 0;
  const windGust = queryFormatKmh(cur.wind_gusts_10m);
  const wind = windSpeed && windDir ? `${windDir} ${windSpeed}` : windSpeed;
  const dayNight = cur.is_day === 1 ? "白天" : cur.is_day === 0 ? "夜间" : void 0;
  const daily = forecast.daily;
  const tempMax = queryFormatTempC(daily?.temperature_2m_max?.[0]);
  const tempMin = queryFormatTempC(daily?.temperature_2m_min?.[0]);
  const uvMax = queryFormatNum(daily?.uv_index_max?.[0], 1);
  const hourly = forecast.hourly;
  const hourIndices = queryUpcomingHourlyIndices(
    hourly?.time ?? [],
    cur.time ?? (/* @__PURE__ */ new Date()).toISOString(),
    HOURLY_FORECAST_COUNT
  );
  const hourlyLines = hourIndices.map((i) => {
    const t = hourly?.time?.[i] ?? "";
    const code = hourly?.weather_code?.[i];
    const hDesc = code != null ? queryWmoWeatherZh(code) : "—";
    const temp = queryFormatTempC(hourly?.temperature_2m?.[i]);
    const feel = queryFormatTempC(hourly?.apparent_temperature?.[i]);
    const hum = queryFormatPct(hourly?.relative_humidity_2m?.[i]);
    const dew = queryFormatTempC(hourly?.dew_point_2m?.[i]);
    const prob = queryFormatPct(hourly?.precipitation_probability?.[i]);
    const precip = queryFormatMm(hourly?.precipitation?.[i]);
    const rain = queryFormatMm(hourly?.rain?.[i]);
    const cloud = queryFormatPct(hourly?.cloud_cover?.[i]);
    const visM = hourly?.visibility?.[i];
    const vis = visM != null ? `${queryFormatNum(visM / 1e3, 1, " km")}` : void 0;
    const wSpeed = queryFormatKmh(hourly?.wind_speed_10m?.[i]);
    const wDir = hourly?.wind_direction_10m?.[i] != null ? queryWindDirectionZh(hourly.wind_direction_10m[i]) : void 0;
    const gust = queryFormatKmh(hourly?.wind_gusts_10m?.[i]);
    const uv = queryFormatNum(hourly?.uv_index?.[i], 1);
    const parts = [
      hDesc,
      temp ? `气温 ${temp}` : "",
      feel ? `体感 ${feel}` : "",
      hum ? `湿度 ${hum}` : "",
      dew ? `露点 ${dew}` : "",
      prob ? `降水概率 ${prob}` : "",
      precip && precip !== "0 mm" ? `降水 ${precip}` : "",
      rain && rain !== "0 mm" ? `降雨 ${rain}` : "",
      cloud ? `云量 ${cloud}` : "",
      vis ? `能见度 ${vis}` : "",
      wDir || wSpeed ? `风 ${[wDir, wSpeed].filter(Boolean).join(" ")}` : "",
      gust ? `阵风 ${gust}` : "",
      uv ? `紫外线 ${uv}` : ""
    ].filter(Boolean);
    const date = queryFormatDateLabel(t);
    return `${date} ${queryFormatHourLabel(t)}｜${parts.join("，")}`;
  });
  const dayCount = Math.min(DAILY_FORECAST_DAYS, daily?.time?.length ?? 0);
  const dailyLines = [];
  for (let d = 0; d < dayCount; d++) {
    const date = daily?.time?.[d] ?? `第 ${d + 1} 天`;
    const dDesc = daily?.weather_code?.[d] != null ? queryWmoWeatherZh(daily.weather_code[d]) : "—";
    const tMin = queryFormatTempC(daily?.temperature_2m_min?.[d]);
    const tMax = queryFormatTempC(daily?.temperature_2m_max?.[d]);
    const fMin = queryFormatTempC(daily?.apparent_temperature_min?.[d]);
    const fMax = queryFormatTempC(daily?.apparent_temperature_max?.[d]);
    const sunrise = daily?.sunrise?.[d] ? queryFormatHourLabel(daily.sunrise[d]) : void 0;
    const sunset = daily?.sunset?.[d] ? queryFormatHourLabel(daily.sunset[d]) : void 0;
    const daylight = queryFormatDurationSec(daily?.daylight_duration?.[d]);
    const sunshine = queryFormatDurationSec(daily?.sunshine_duration?.[d]);
    const uv = queryFormatNum(daily?.uv_index_max?.[d], 1);
    const precipSum = queryFormatMm(daily?.precipitation_sum?.[d]);
    const rainSum = queryFormatMm(daily?.rain_sum?.[d]);
    const showerSum = queryFormatMm(daily?.showers_sum?.[d]);
    const snowSum = queryFormatMm(daily?.snowfall_sum?.[d]);
    const precipHours = queryFormatNum(daily?.precipitation_hours?.[d], 1, " 小时");
    const precipProb = queryFormatPct(daily?.precipitation_probability_max?.[d]);
    const windMax = queryFormatKmh(daily?.wind_speed_10m_max?.[d]);
    const gustMax = queryFormatKmh(daily?.wind_gusts_10m_max?.[d]);
    const windDom = daily?.wind_direction_10m_dominant?.[d] != null ? queryWindDirectionZh(daily.wind_direction_10m_dominant[d]) : void 0;
    dailyLines.push(
      [
        `${date}｜${dDesc}`,
        tMin && tMax ? `气温 ${tMin}～${tMax}` : "",
        fMin && fMax ? `体感 ${fMin}～${fMax}` : "",
        sunrise && sunset ? `日出 ${sunrise} / 日落 ${sunset}` : "",
        daylight ? `日照时长 ${daylight}` : "",
        sunshine ? `晴空日照 ${sunshine}` : "",
        uv ? `紫外线最大 ${uv}` : "",
        precipSum ? `降水总量 ${precipSum}` : "",
        rainSum && rainSum !== "0 mm" ? `降雨 ${rainSum}` : "",
        showerSum && showerSum !== "0 mm" ? `阵雨 ${showerSum}` : "",
        snowSum && snowSum !== "0 mm" ? `降雪 ${snowSum}` : "",
        precipHours ? `降水时长 ${precipHours}` : "",
        precipProb ? `最大降水概率 ${precipProb}` : "",
        windDom || windMax ? `主导风 ${[windDom, windMax].filter(Boolean).join(" ")}` : "",
        gustMax ? `最大阵风 ${gustMax}` : ""
      ].filter(Boolean).join("；")
    );
  }
  const summary = `${geo.label}：${desc}${temperature ? `，气温 ${temperature}` : ""}${feelsLike ? `，体感 ${feelsLike}` : ""}${tempMin && tempMax ? `；今日 ${tempMin}～${tempMax}` : ""}${air?.summary ? `；空气质量 ${air.summary}` : ""}`;
  const rawText = queryBuildWeatherRawText([
    {
      title: "实况",
      lines: [
        `城市：${geo.label}`,
        forecast.elevation != null ? `海拔：${queryFormatNum(forecast.elevation, 0, " m")}` : "",
        cur.time ? `观测时间：${cur.time.replace("T", " ")}` : "",
        dayNight ? `昼夜：${dayNight}` : "",
        `天气：${desc}`,
        temperature ? `气温：${temperature}` : "",
        feelsLike ? `体感：${feelsLike}` : "",
        humidity ? `相对湿度：${humidity}` : "",
        wind ? `风力：${wind}` : "",
        windGust ? `阵风：${windGust}` : "",
        queryFormatPct(cur.cloud_cover) ? `云量：${queryFormatPct(cur.cloud_cover)}` : "",
        queryFormatHpa(cur.pressure_msl) ? `海平面气压：${queryFormatHpa(cur.pressure_msl)}` : "",
        queryFormatHpa(cur.surface_pressure) ? `地表气压：${queryFormatHpa(cur.surface_pressure)}` : "",
        cur.precipitation != null ? `当前降水：${queryFormatMm(cur.precipitation) ?? "0 mm"}` : "",
        cur.rain != null && cur.rain > 0 ? `降雨：${queryFormatMm(cur.rain)}` : "",
        cur.showers != null && cur.showers > 0 ? `阵雨：${queryFormatMm(cur.showers)}` : "",
        cur.snowfall != null && cur.snowfall > 0 ? `降雪：${queryFormatMm(cur.snowfall)}` : ""
      ]
    },
    {
      title: `多日预报（${dayCount} 天）`,
      lines: dailyLines.length ? dailyLines : ["暂无多日预报"]
    },
    {
      title: `未来 ${hourIndices.length || HOURLY_FORECAST_COUNT} 小时`,
      lines: hourlyLines.length ? hourlyLines : ["暂无逐小时预报"]
    },
    {
      title: "空气质量",
      lines: air?.lines?.length ? air.lines : ["空气质量暂不可用"]
    }
  ]);
  return {
    city: geo.label,
    summary,
    temperature,
    feelsLike,
    humidity,
    wind,
    tempMin,
    tempMax,
    uvIndex: uvMax,
    airQuality: air?.summary,
    rawText
  };
}
async function queryWeatherViaWttr(city) {
  const loc = city?.trim() ? encodeURIComponent(queryNormalizeCityName(city)) : "";
  const url2 = `https://wttr.in/${loc}?format=j1&lang=zh`;
  const data = await queryHttpJson(url2, { timeoutMs: 15e3 });
  const nearest = data.nearest_area?.[0];
  const area = [nearest?.areaName?.[0]?.value, nearest?.region?.[0]?.value, nearest?.country?.[0]?.value].filter(Boolean).join("·") || city?.trim() || "本地";
  const cur = data.current_condition?.[0];
  if (!cur) throw new Error("wttr.in 无 current_condition");
  const desc = cur.lang_zh?.[0]?.value?.trim() || cur.weatherDesc?.[0]?.value?.trim() || "未知";
  const temperature = queryFormatTempC(cur.temp_C);
  const feelsLike = queryFormatTempC(cur.FeelsLikeC);
  const humidity = cur.humidity ? `${cur.humidity}%` : void 0;
  const wind = cur.winddir16Point ? `${cur.winddir16Point} ${cur.windspeedKmph ?? ""} km/h`.trim() : cur.windspeedKmph ? `${cur.windspeedKmph} km/h` : void 0;
  const today = data.weather?.[0];
  const tempMax = queryFormatTempC(today?.maxtempC);
  const tempMin = queryFormatTempC(today?.mintempC);
  const dailyLines = (data.weather ?? []).slice(0, DAILY_FORECAST_DAYS).map((day) => {
    const astro = day.astronomy?.[0];
    return [
      `${day.date ?? "—"}｜`,
      day.mintempC && day.maxtempC ? `气温 ${day.mintempC}～${day.maxtempC}°C` : "",
      day.avgtempC ? `均温 ${day.avgtempC}°C` : "",
      day.uvIndex ? `紫外线 ${day.uvIndex}` : "",
      day.sunHour ? `日照 ${day.sunHour} 小时` : "",
      day.totalSnow_cm && Number(day.totalSnow_cm) > 0 ? `降雪 ${day.totalSnow_cm} cm` : "",
      astro?.sunrise && astro?.sunset ? `日出 ${astro.sunrise} / 日落 ${astro.sunset}` : "",
      astro?.moon_phase ? `月相 ${astro.moon_phase}` : "",
      astro?.moon_illumination ? `月照 ${astro.moon_illumination}%` : "",
      astro?.moonrise ? `月出 ${astro.moonrise}` : "",
      astro?.moonset ? `月落 ${astro.moonset}` : ""
    ].filter(Boolean).join("；");
  });
  const nowHour = (/* @__PURE__ */ new Date()).getHours();
  const hourlyLines = today?.hourly?.filter((h) => {
    const slot = Math.floor(Number(h.time ?? -1) / 100);
    return slot >= nowHour;
  }).map((h) => {
    const slot = Math.floor(Number(h.time ?? 0) / 100);
    const label = `${String(slot).padStart(2, "0")}:00`;
    const hDesc = h.weatherDesc?.[0]?.value?.trim() ?? "—";
    const parts = [
      hDesc,
      h.tempC ? `气温 ${h.tempC}°C` : "",
      h.FeelsLikeC ? `体感 ${h.FeelsLikeC}°C` : "",
      h.humidity ? `湿度 ${h.humidity}%` : "",
      h.DewPointC ? `露点 ${h.DewPointC}°C` : "",
      h.chanceofrain ? `降雨概率 ${h.chanceofrain}%` : "",
      h.chanceofthunder ? `雷暴概率 ${h.chanceofthunder}%` : "",
      h.chanceofsnow ? `降雪概率 ${h.chanceofsnow}%` : "",
      h.precipMM ? `降水 ${h.precipMM} mm` : "",
      h.winddir16Point || h.windspeedKmph ? `风 ${[h.winddir16Point, h.windspeedKmph ? `${h.windspeedKmph} km/h` : ""].filter(Boolean).join(" ")}` : "",
      h.WindGustKmph ? `阵风 ${h.WindGustKmph} km/h` : "",
      h.cloudcover ? `云量 ${h.cloudcover}%` : "",
      h.visibility ? `能见度 ${h.visibility} km` : "",
      h.pressure ? `气压 ${h.pressure} mb` : "",
      h.uvIndex ? `紫外线 ${h.uvIndex}` : ""
    ].filter(Boolean);
    return `${label}｜${parts.join("，")}`;
  }) ?? [];
  const summary = `${area}：${desc}${temperature ? `，气温 ${temperature}` : ""}${feelsLike ? `，体感 ${feelsLike}` : ""}${tempMin && tempMax ? `；今日 ${tempMin}～${tempMax}` : ""}`;
  const rawText = queryBuildWeatherRawText([
    {
      title: "实况",
      lines: [
        `城市：${area}`,
        cur.observation_time ? `观测时间（UTC）：${cur.observation_time}` : "",
        `天气：${desc}`,
        temperature ? `气温：${temperature}` : "",
        feelsLike ? `体感：${feelsLike}` : "",
        humidity ? `相对湿度：${humidity}` : "",
        wind ? `风力：${wind}` : "",
        cur.WindGustKmph ? `阵风：${cur.WindGustKmph} km/h` : "",
        cur.winddirDegree ? `风向角度：${cur.winddirDegree}°` : "",
        cur.cloudcover ? `云量：${cur.cloudcover}%` : "",
        cur.precipMM ? `降水量：${cur.precipMM} mm` : "",
        cur.pressure ? `气压：${cur.pressure} mb` : "",
        cur.visibility ? `能见度：${cur.visibility} km` : "",
        cur.uvIndex ? `紫外线指数：${cur.uvIndex}` : ""
      ]
    },
    {
      title: `多日预报（${dailyLines.length || DAILY_FORECAST_DAYS} 天）`,
      lines: dailyLines.length ? dailyLines : ["暂无多日预报"]
    },
    {
      title: "今日剩余时段",
      lines: hourlyLines.length ? hourlyLines : ["暂无逐小时预报"]
    }
  ]);
  return {
    city: area,
    summary,
    temperature,
    feelsLike,
    humidity,
    wind,
    tempMin,
    tempMax,
    uvIndex: cur.uvIndex,
    rawText
  };
}
async function queryWeatherViaBrowser(city) {
  const browser = getBrowserService();
  const normalized = city?.trim() ? queryNormalizeCityName(city) : "";
  const q = normalized ? encodeURIComponent(normalized) : "";
  const url2 = q ? `https://wttr.in/${q}?lang=zh` : "https://wttr.in/?lang=zh";
  await browser.navigate(url2, "headless");
  await browser.wait({ ms: 1500 }, "headless");
  const text = await browser.extractText({ maxLength: 12e3 }, "headless");
  if (!text.trim()) throw new Error("无头浏览器未提取到天气文本");
  const cityLabel = city?.trim() || "本地";
  const summary = text.split("\n").map((l) => l.trim()).find(Boolean) ?? text.slice(0, 80);
  return {
    city: cityLabel,
    summary: `${cityLabel}：${summary}`,
    rawText: text.trim().slice(0, 1e4)
  };
}
function queryParseCityArg(raw) {
  if (raw == null) return void 0;
  const s = String(raw).trim();
  return s || void 0;
}
const queryWeatherTool = {
  name: "query_weather",
  description: "获取指定城市的完整天气细节（默认按本机 IP 定位；可传 city）。包含：实况全字段、3 日预报（高低温/体感/日出日落/日照/紫外线/降水分项/主导风）、未来 24 小时逐时、空气质量（PM2.5/PM10/AQI 等）。优先 Open-Meteo；失败再 wttr.in / 无头浏览器兜底。写入 context.weatherOk / weatherText / weatherSummary 等字段。",
  permission: "safe",
  parameters: {
    type: "object",
    properties: {
      city: {
        type: "string",
        description: "城市名，如「北京」「上海」「深圳」；可带「市」后缀；缺省则按 IP 定位；若 IP 无法定位则默认「合肥」"
      }
    },
    required: []
  },
  async execute(args) {
    const city = queryParseCityArg(args.city);
    const apiFetchers = city ? [() => queryWeatherViaOpenMeteo(city), () => queryWeatherViaWttr(city)] : [
      () => queryWeatherViaWttr(void 0),
      () => queryWeatherViaOpenMeteo(DEFAULT_CITY_WHEN_NO_LOC)
    ];
    const result = await queryWithFallback({
      apiFetchers,
      browserScraper: () => queryWeatherViaBrowser(city),
      failLabel: "获取天气失败",
      formatSuccess: (data, source) => source === "browser" ? `${data.rawText}
（来源：无头浏览器兜底）` : data.rawText
    });
    if (!result.ok || !result.data) {
      return queryEncodeWorkflowCtxResult(result.message, {
        weatherOk: "0",
        weatherText: "",
        weatherSummary: "",
        weatherFetchSource: result.source
      });
    }
    return queryEncodeWorkflowCtxResult(result.message, {
      weatherOk: "1",
      weatherText: result.message,
      weatherSummary: result.data.summary,
      weatherCity: result.data.city,
      weatherTemperature: result.data.temperature ?? "",
      weatherFeelsLike: result.data.feelsLike ?? "",
      weatherHumidity: result.data.humidity ?? "",
      weatherWind: result.data.wind ?? "",
      weatherTempMin: result.data.tempMin ?? "",
      weatherTempMax: result.data.tempMax ?? "",
      weatherUvIndex: result.data.uvIndex ?? "",
      weatherAirQuality: result.data.airQuality ?? "",
      weatherFetchSource: result.source
    });
  }
};
const MAX_MEDIA_FILE_BYTES = 50 * 1024 * 1024;
const ALL_KINDS = ["image", "video", "audio"];
const IMAGE_EXT$2 = /\.(jpe?g|png|webp|gif|bmp|avif|tiff?)(\?|#|$)/i;
const VIDEO_EXT$2 = /\.(mp4|webm|ogv|mov|m4v|mkv|m3u8)(\?|#|$)/i;
const AUDIO_EXT$2 = /\.(mp3|wav|ogg|oga|m4a|aac|flac|opus|wma)(\?|#|$)/i;
const BARE_MEDIA_URL_RE = /https?:\/\/[^\s"'<>\\]+?\.(?:mp3|wav|ogg|oga|m4a|aac|flac|opus|wma|mp4|webm|ogv|mov|m4v|mkv|m3u8|jpe?g|png|webp|gif)(?:\?[^\s"'<>\\]*)?/gi;
function queryNormalizeMediaTypes(raw) {
  if (raw == null) return [];
  const list = Array.isArray(raw) ? raw : [raw];
  const seen = /* @__PURE__ */ new Set();
  for (const item of list) {
    const k = String(item ?? "").trim().toLowerCase();
    if (ALL_KINDS.includes(k)) seen.add(k);
  }
  return ALL_KINDS.filter((k) => seen.has(k));
}
function queryNormalizeMaxMediaCount(raw) {
  const n = Number(raw ?? 8);
  if (!Number.isFinite(n)) return 8;
  return Math.min(20, Math.max(1, Math.floor(n)));
}
function queryDecodeMediaHtmlEntities(text) {
  return text.replace(/&amp;/gi, "&").replace(/&quot;/gi, '"').replace(/&#39;/g, "'").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}
function queryAbsoluteMediaUrl(raw, pageUrl) {
  const src = queryDecodeMediaHtmlEntities(raw.trim());
  if (!src || src.startsWith("data:") || src.startsWith("blob:")) return "";
  try {
    const abs = new URL(src, pageUrl).href;
    if (!/^https?:\/\//i.test(abs)) return "";
    return abs;
  } catch {
    return "";
  }
}
function queryKindFromUrlOrMime(url2, mimeHint) {
  const mime = (mimeHint || "").toLowerCase();
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  if (VIDEO_EXT$2.test(url2)) return "video";
  if (AUDIO_EXT$2.test(url2)) return "audio";
  if (IMAGE_EXT$2.test(url2)) return "image";
  return null;
}
function queryAttr(tag, name) {
  const decoded = queryDecodeMediaHtmlEntities(tag);
  const re = new RegExp(`\\b${name}=["']([^"']+)["']`, "i");
  const m = re.exec(decoded);
  return m?.[1]?.trim() || "";
}
function queryMergeMediaItems(...lists) {
  const seen = /* @__PURE__ */ new Set();
  const out = [];
  for (const list of lists) {
    for (const item of list) {
      if (!item.url || seen.has(item.url)) continue;
      seen.add(item.url);
      out.push(item);
    }
  }
  return out;
}
function queryExtractMediaFromHtml(html, pageUrl, kinds, limit) {
  if (!kinds.length || limit < 1) return [];
  const want = new Set(kinds);
  const seen = /* @__PURE__ */ new Set();
  const items = [];
  const push = (rawUrl, kind, extra) => {
    if (items.length >= limit) return;
    const url2 = queryAbsoluteMediaUrl(rawUrl, pageUrl);
    if (!url2 || seen.has(url2)) return;
    const resolved = kind ?? queryKindFromUrlOrMime(url2, extra?.mimeHint) ?? null;
    if (!resolved || !want.has(resolved)) return;
    if (resolved === "image" && /sprite|icon|logo|avatar|emoji|pixel|1x1/i.test(url2)) {
      return;
    }
    seen.add(url2);
    items.push({
      kind: resolved,
      url: url2,
      title: extra?.title || void 0,
      mimeHint: extra?.mimeHint || void 0
    });
  };
  const decodedHtml = queryDecodeMediaHtmlEntities(html);
  const metaRe = /<meta[^>]+(?:property|name)=["']([^"']+)["'][^>]+content=["']([^"']*)["'][^>]*>|<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']([^"']+)["'][^>]*>/gi;
  let metaMatch;
  while ((metaMatch = metaRe.exec(decodedHtml)) !== null) {
    const key = (metaMatch[1] || metaMatch[4] || "").toLowerCase();
    const content = (metaMatch[2] || metaMatch[3] || "").trim();
    if (!content) continue;
    if (key === "og:image" || key === "og:image:url" || key === "twitter:image") {
      push(content, "image");
    } else if (key === "og:video" || key === "og:video:url" || key === "og:video:secure_url" || key === "twitter:player:stream") {
      push(content, "video");
    } else if (key === "og:audio" || key === "og:audio:url" || key === "og:audio:secure_url") {
      push(content, "audio");
    }
  }
  const ldRe = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let ldMatch;
  while ((ldMatch = ldRe.exec(decodedHtml)) !== null) {
    try {
      const data = JSON.parse(ldMatch[1].trim());
      const nodes = Array.isArray(data) ? data : [data];
      for (const node of nodes) {
        queryPushJsonLdMedia(node, push);
      }
    } catch {
    }
  }
  if (want.has("image")) {
    const imgRe = /<img\b[^>]*>/gi;
    let imgTag;
    while ((imgTag = imgRe.exec(decodedHtml)) !== null) {
      const tag = imgTag[0];
      const src = queryAttr(tag, "src") || queryAttr(tag, "data-src") || queryAttr(tag, "data-original") || queryAttr(tag, "data-lazy-src") || queryAttr(tag, "data-url");
      const alt = queryAttr(tag, "alt") || queryAttr(tag, "title");
      push(src, "image", { title: alt || void 0 });
      const srcset = queryAttr(tag, "srcset");
      if (srcset) {
        const best = srcset.split(",").map((p) => p.trim().split(/\s+/)[0]).filter(Boolean).pop();
        if (best) push(best, "image", { title: alt || void 0 });
      }
    }
  }
  const mediaBlockRe = /<(video|audio)\b([^>]*)>([\s\S]*?)<\/\1>|<(video|audio)\b([^>]*)\/>/gi;
  let block;
  while ((block = mediaBlockRe.exec(decodedHtml)) !== null) {
    const kind = block[1] || block[4] || "";
    if (!want.has(kind)) continue;
    const openAttrs = block[2] || block[5] || "";
    const inner = block[3] || "";
    const title = queryAttr(openAttrs, "title") || queryAttr(openAttrs, "aria-label");
    const selfSrc = queryAttr(openAttrs, "src");
    if (selfSrc) push(selfSrc, kind, { title: title || void 0 });
    const sourceRe = /<source\b[^>]*>/gi;
    let srcTag;
    while ((srcTag = sourceRe.exec(inner)) !== null) {
      const s = srcTag[0];
      const src = queryAttr(s, "src");
      const type = queryAttr(s, "type");
      push(src, kind, { title: title || void 0, mimeHint: type || void 0 });
    }
  }
  const hrefRe = /(?:href|src|data-src|data-url)=["']([^"']+)["']/gi;
  let hrefMatch;
  while ((hrefMatch = hrefRe.exec(decodedHtml)) !== null) {
    const raw = hrefMatch[1];
    const guessed = queryKindFromUrlOrMime(raw);
    if (guessed && want.has(guessed)) push(raw, guessed);
  }
  BARE_MEDIA_URL_RE.lastIndex = 0;
  let bare;
  while ((bare = BARE_MEDIA_URL_RE.exec(decodedHtml)) !== null) {
    const raw = bare[0].replace(/[.,);]+$/, "");
    const guessed = queryKindFromUrlOrMime(raw);
    if (guessed && want.has(guessed)) push(raw, guessed);
  }
  return items.slice(0, limit);
}
function queryPushJsonLdMedia(node, push) {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    for (const child of node) queryPushJsonLdMedia(child, push);
    return;
  }
  const obj = node;
  const typeRaw = obj["@type"];
  const type = String(Array.isArray(typeRaw) ? typeRaw[0] : typeRaw || "").toLowerCase();
  const contentUrl = typeof obj.contentUrl === "string" ? obj.contentUrl : "";
  const url2 = typeof obj.url === "string" ? obj.url : "";
  const name = typeof obj.name === "string" ? obj.name : void 0;
  const encoding = typeof obj.encodingFormat === "string" ? obj.encodingFormat : void 0;
  let kind = null;
  if (type.includes("audio")) kind = "audio";
  else if (type.includes("video")) kind = "video";
  else if (type.includes("image")) kind = "image";
  if (contentUrl) push(contentUrl, kind, { title: name, mimeHint: encoding });
  if (url2 && kind) push(url2, kind, { title: name, mimeHint: encoding });
  for (const v of Object.values(obj)) {
    if (v && typeof v === "object") queryPushJsonLdMedia(v, push);
  }
}
function queryKindFromNetworkResponse(url2, contentType, kinds) {
  const want = new Set(kinds);
  const ct = (contentType || "").toLowerCase().split(";")[0].trim();
  let kind = null;
  if (ct.startsWith("audio/")) kind = "audio";
  else if (ct.startsWith("video/")) kind = "video";
  else if (ct.startsWith("image/") && !ct.includes("svg")) kind = "image";
  else kind = queryKindFromUrlOrMime(url2);
  if (!kind || !want.has(kind)) return null;
  if (kind === "image" && /sprite|icon|logo|avatar|emoji|pixel|1x1/i.test(url2)) return null;
  return kind;
}
async function queryExtractMediaInPage(page, kinds, limit, extraFromNetwork = []) {
  if (!kinds.length || limit < 1) return [];
  const raw = await page.evaluate(
    (args) => {
      const { kinds: wantKinds, limit: max } = args;
      const want = new Set(wantKinds);
      const seen = /* @__PURE__ */ new Set();
      const list = [];
      const abs = (src) => {
        try {
          if (!src || src.startsWith("data:") || src.startsWith("blob:")) return "";
          return new URL(src, location.href).href;
        } catch {
          return "";
        }
      };
      const kindFromUrl = (url2) => {
        if (/\.(mp4|webm|ogv|mov|m4v|mkv|m3u8)(\?|#|$)/i.test(url2)) return "video";
        if (/\.(mp3|wav|ogg|oga|m4a|aac|flac|opus|wma)(\?|#|$)/i.test(url2)) return "audio";
        if (/\.(jpe?g|png|webp|gif|bmp|avif)(\?|#|$)/i.test(url2)) return "image";
        return null;
      };
      const push = (kind, rawUrl, score, extra) => {
        if (!want.has(kind)) return;
        const url2 = abs(rawUrl);
        if (!url2 || !/^https?:\/\//i.test(url2) || seen.has(url2)) return;
        if (kind === "image" && /sprite|icon|logo|avatar|emoji|pixel|1x1/i.test(url2)) {
          return;
        }
        seen.add(url2);
        list.push({
          kind,
          url: url2,
          title: extra?.title,
          mimeHint: extra?.mimeHint,
          score
        });
      };
      const meta = (key) => {
        const el = document.querySelector(`meta[property="${key}"]`) || document.querySelector(`meta[name="${key}"]`);
        return el?.getAttribute("content")?.trim() || "";
      };
      if (want.has("image")) {
        for (const key of ["og:image", "og:image:url", "twitter:image"]) {
          const c = meta(key);
          if (c) push("image", c, 5e5);
        }
        for (const img of Array.from(document.images)) {
          const w = img.naturalWidth || img.width || 0;
          const h = img.naturalHeight || img.height || 0;
          const area = w * h;
          if (area > 0 && (w < 120 || h < 120)) continue;
          const src = img.currentSrc || img.src || img.getAttribute("data-src") || img.getAttribute("data-original") || "";
          push("image", src, area || 1e4, { title: img.alt || void 0 });
          const srcset = img.getAttribute("srcset");
          if (srcset) {
            const best = srcset.split(",").map((p) => p.trim().split(/\s+/)[0]).filter(Boolean).pop();
            if (best) push("image", best, (area || 1e4) + 1, { title: img.alt || void 0 });
          }
        }
      }
      if (want.has("video")) {
        for (const key of [
          "og:video",
          "og:video:url",
          "og:video:secure_url",
          "twitter:player:stream"
        ]) {
          const c = meta(key);
          if (c) push("video", c, 5e5);
        }
        for (const el of Array.from(document.querySelectorAll("video"))) {
          const v = el;
          const title = v.getAttribute("title") || v.getAttribute("aria-label") || void 0;
          const src = v.currentSrc || v.src || v.getAttribute("src") || "";
          if (src) push("video", src, 2e5, { title });
          for (const s of Array.from(v.querySelectorAll("source"))) {
            push("video", s.getAttribute("src") || "", 18e4, {
              title,
              mimeHint: s.getAttribute("type") || void 0
            });
          }
        }
      }
      if (want.has("audio")) {
        for (const key of ["og:audio", "og:audio:url", "og:audio:secure_url"]) {
          const c = meta(key);
          if (c) push("audio", c, 5e5);
        }
        for (const el of Array.from(document.querySelectorAll("audio"))) {
          const a = el;
          const title = a.getAttribute("title") || a.getAttribute("aria-label") || void 0;
          const src = a.currentSrc || a.src || a.getAttribute("src") || "";
          if (src) push("audio", src, 2e5, { title });
          for (const s of Array.from(a.querySelectorAll("source"))) {
            push("audio", s.getAttribute("src") || "", 18e4, {
              title,
              mimeHint: s.getAttribute("type") || void 0
            });
          }
        }
      }
      try {
        for (const entry of performance.getEntriesByType("resource")) {
          const name = entry.name || "";
          const k = kindFromUrl(name);
          if (k) push(k, name, 15e4);
        }
      } catch {
      }
      const bareRe = /https?:\/\/[^\s"'<>\\]+?\.(?:mp3|wav|ogg|oga|m4a|aac|flac|opus|wma|mp4|webm|ogv|mov|m4v|mkv|m3u8)(?:\?[^\s"'<>\\]*)?/gi;
      for (const script of Array.from(document.scripts)) {
        const text = script.textContent || "";
        if (!text || text.length > 5e5) continue;
        bareRe.lastIndex = 0;
        let m;
        while ((m = bareRe.exec(text)) !== null) {
          const raw2 = m[0].replace(/[.,);]+$/, "");
          const k = kindFromUrl(raw2);
          if (k) push(k, raw2, 12e4);
        }
      }
      list.sort((a, b) => b.score - a.score);
      return list.slice(0, max).map(({ kind, url: url2, title, mimeHint }) => ({
        kind,
        url: url2,
        title,
        mimeHint
      }));
    },
    { kinds, limit }
  );
  return queryMergeMediaItems(extraFromNetwork, raw).slice(0, limit);
}
function queryAttachMediaNetworkSniffer(page, kinds) {
  const sniffed = [];
  const seen = /* @__PURE__ */ new Set();
  const onResponse = (response) => {
    try {
      const url2 = response.url();
      if (!url2 || !/^https?:\/\//i.test(url2) || seen.has(url2)) return;
      const headers = response.headers();
      const ct = headers["content-type"] || headers["Content-Type"] || "";
      const kind = queryKindFromNetworkResponse(url2, ct, kinds);
      if (!kind) return;
      const status = response.status();
      if (status >= 400) return;
      seen.add(url2);
      sniffed.push({ kind, url: url2, mimeHint: ct.split(";")[0] || void 0 });
    } catch {
    }
  };
  page.on("response", onResponse);
  return {
    getItems: () => [...sniffed],
    dispose: () => {
      page.off("response", onResponse);
    }
  };
}
function queryAcceptHeader(kind) {
  if (kind === "image") {
    return "image/avif,image/webp,image/apng,image/*,*/*;q=0.8";
  }
  if (kind === "video") {
    return "video/mp4,video/webm,video/*,*/*;q=0.8";
  }
  return "audio/mpeg,audio/mp4,audio/*,*/*;q=0.8";
}
function queryGuessMediaExt(kind, url2, contentType) {
  const fromType = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "image/avif": ".avif",
    "video/mp4": ".mp4",
    "video/webm": ".webm",
    "video/quicktime": ".mov",
    "audio/mpeg": ".mp3",
    "audio/mp3": ".mp3",
    "audio/wav": ".wav",
    "audio/x-wav": ".wav",
    "audio/mp4": ".m4a",
    "audio/aac": ".aac",
    "audio/ogg": ".ogg",
    "audio/flac": ".flac"
  };
  for (const [k, v] of Object.entries(fromType)) {
    if (contentType.includes(k)) return v;
  }
  const pathPart = url2.split("?")[0];
  const ext = path.extname(pathPart).toLowerCase();
  const allowed = kind === "image" ? [".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif", ".bmp"] : kind === "video" ? [".mp4", ".webm", ".mov", ".m4v", ".mkv", ".ogv"] : [".mp3", ".wav", ".m4a", ".aac", ".ogg", ".oga", ".flac", ".opus"];
  if (allowed.includes(ext)) return ext === ".jpeg" ? ".jpg" : ext;
  return kind === "image" ? ".jpg" : kind === "video" ? ".mp4" : ".mp3";
}
function queryContentTypeMatchesKind(kind, contentType, url2) {
  const ct = contentType.toLowerCase();
  if (!ct || ct.includes("octet-stream")) return true;
  if (kind === "image") {
    return ct.startsWith("image/") || IMAGE_EXT$2.test(url2);
  }
  if (kind === "video") {
    return ct.startsWith("video/") || VIDEO_EXT$2.test(url2);
  }
  return ct.startsWith("audio/") || AUDIO_EXT$2.test(url2);
}
async function postDownloadMediaOnce(item, outDir, index2, pageUrl) {
  const url2 = queryPreferHttpsImageUrl(item.url);
  const referer = queryImageDownloadReferer(url2, pageUrl);
  const res = await queryHttp(url2, {
    timeoutMs: 6e4,
    headers: {
      Accept: queryAcceptHeader(item.kind),
      ...referer ? { Referer: referer } : {}
    }
  });
  const contentType = res.headers.get("content-type") || "";
  if (!queryContentTypeMatchesKind(item.kind, contentType, url2)) {
    throw new Error(`非${item.kind}类型: ${contentType}`);
  }
  const lenHeader = res.headers.get("content-length");
  if (lenHeader) {
    const len = Number(lenHeader);
    if (Number.isFinite(len) && len > MAX_MEDIA_FILE_BYTES) {
      throw new Error(`文件过大（${Math.round(len / 1024 / 1024)}MB，上限 50MB）`);
    }
  }
  if (!res.body) throw new Error("响应无 body");
  const ext = queryGuessMediaExt(item.kind, url2, contentType);
  const filePath = path.join(outDir, `${item.kind}-${index2 + 1}${ext}`);
  const reader = stream.Readable.fromWeb(res.body);
  let total = 0;
  const counter = new stream.Transform({
    transform(chunk, _enc, cb) {
      total += chunk.length;
      if (total > MAX_MEDIA_FILE_BYTES) {
        cb(new Error("文件过大（超过 50MB 上限）"));
        return;
      }
      cb(null, chunk);
    }
  });
  await promises.pipeline(reader, counter, fs.createWriteStream(filePath));
  if (!fs.existsSync(filePath)) throw new Error("写入失败");
  return filePath;
}
async function postDownloadMediaViaBrowser(item, outDir, index2, pageUrl) {
  const browser = getBrowserService();
  await browser.ensureStarted();
  const page = browser.getPage("headless") || browser.getPage();
  if (!page) throw new Error("浏览器未就绪，无法兜底下载媒体");
  const url2 = queryPreferHttpsImageUrl(item.url);
  const referer = queryImageDownloadReferer(url2, pageUrl);
  const response = await page.context().request.get(url2, {
    timeout: 6e4,
    headers: {
      Accept: queryAcceptHeader(item.kind),
      ...referer ? { Referer: referer } : {}
    }
  });
  if (!response.ok()) {
    throw new HttpError(`HTTP ${response.status()}`, response.status(), url2);
  }
  const body = await response.body();
  if (body.byteLength > MAX_MEDIA_FILE_BYTES) {
    throw new Error(`文件过大（${Math.round(body.byteLength / 1024 / 1024)}MB，上限 50MB）`);
  }
  const contentType = response.headers()["content-type"] || "";
  if (!queryContentTypeMatchesKind(item.kind, contentType, url2)) {
    throw new Error(`非${item.kind}类型: ${contentType}`);
  }
  const ext = queryGuessMediaExt(item.kind, url2, contentType);
  const filePath = path.join(outDir, `${item.kind}-${index2 + 1}${ext}`);
  fs.writeFileSync(filePath, body);
  if (!fs.existsSync(filePath)) throw new Error("写入失败");
  return filePath;
}
async function postDownloadPageMedia(items, pageUrl, outDir, options) {
  const dir = outDir ?? path.join(getArtifactsDir(), "web-media", String(Date.now()));
  fs.mkdirSync(dir, { recursive: true });
  const notes = [];
  let toDownload = items;
  const topic = String(options?.topic ?? "").trim();
  if ((topic || options?.screenshotPng) && items.length > 0) {
    const selected = await querySelectRelevantMedia({
      topic: topic || "页面正文相关媒体",
      candidates: items.map((m) => ({
        url: m.url,
        kind: m.kind,
        label: m.title,
        inViewport: true
      })),
      // 下载时再收紧：最多保留约一半候选或 6 条，避免「全相关」时仍整页落盘
      maxCount: Math.min(items.length, options?.maxKeep ?? 6),
      screenshotPng: options?.screenshotPng,
      signal: options?.signal
    });
    const keep = new Set(selected.urls);
    const skipped = items.filter((m) => !keep.has(m.url));
    toDownload = items.filter((m) => keep.has(m.url));
    if (skipped.length) {
      notes.push(
        `相关性筛选跳过 ${skipped.length} 条（${selected.note}）`
      );
    } else {
      notes.push(selected.note);
    }
    for (const m of skipped) {
      notes.push(`跳过无关 ${m.kind}: ${m.url}`);
    }
  }
  const result = [];
  const skippedSet = new Set(
    items.filter((m) => !toDownload.some((d) => d.url === m.url)).map((m) => m.url)
  );
  for (let i = 0; i < items.length; i++) {
    const item = { ...items[i] };
    if (skippedSet.has(item.url)) {
      item.downloadNote = "与主题不相关，已跳过下载";
      result.push(item);
      continue;
    }
    try {
      try {
        item.localPath = await postDownloadMediaOnce(item, dir, i, pageUrl);
      } catch (err) {
        const status = err instanceof HttpError ? err.status : 0;
        if (status === 403 || status === 401) {
          item.localPath = await postDownloadMediaViaBrowser(item, dir, i, pageUrl);
        } else {
          throw err;
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      item.downloadNote = msg;
      notes.push(`${item.kind} ${item.url}: ${msg}`);
      console.warn("[postDownloadPageMedia] failed:", item.url, err);
    }
    result.push(item);
  }
  return { items: result, outDir: dir, notes };
}
function queryFormatMediaSection(items) {
  if (!items.length) return "—— 媒体资源 ——\n（未发现匹配的媒体）";
  const lines = ["—— 媒体资源 ——"];
  items.forEach((m, i) => {
    const title = m.title ? ` 「${m.title}」` : "";
    let local = "";
    if (m.localPath) {
      if (m.kind === "image") {
        const name = m.localPath.replace(/\\/g, "/").split("/").pop() || "image";
        local = `
   本地路径：${queryFormatMarkdownImage(name, m.localPath)}`;
      } else {
        local = `
   本地路径：${m.localPath}`;
      }
    }
    const note = m.downloadNote ? `
   下载: ${m.downloadNote}` : "";
    lines.push(`${i + 1}. [${m.kind}]${title}
   URL: ${m.url}${local}${note}`);
  });
  return lines.join("\n");
}
const MAX_CONTENT_CHARS = 2e4;
const MIN_CONTENT_CHARS = 80;
const SITE_PROFILES = [
  {
    test: /juejin\.cn/i,
    selectors: [".article-content", "#article-root", ".markdown-body", "article"],
    waitMs: 2200
  },
  {
    test: /(zhuanlan\.zhihu\.com|www\.zhihu\.com)/i,
    selectors: [
      ".Post-RichText",
      ".RichText.ztext",
      ".QuestionRichText",
      ".RichContent-inner",
      "article"
    ],
    waitMs: 2800
  },
  {
    test: /mp\.weixin\.qq\.com/i,
    selectors: ["#js_content", ".rich_media_content"],
    waitMs: 1800
  },
  {
    test: /csdn\.net/i,
    selectors: ["#content_views", ".article_content", "#article_content", "article"],
    waitMs: 1800
  },
  {
    test: /jianshu\.com/i,
    selectors: ["article._2rhmJa", "article", ".article"],
    waitMs: 1800
  },
  {
    test: /segmentfault\.com/i,
    selectors: [".article", ".fmt", "article"],
    waitMs: 1800
  },
  {
    test: /cnblogs\.com/i,
    selectors: ["#cnblogs_post_body", ".postBody", "article"],
    waitMs: 1500
  },
  {
    test: /sspai\.com/i,
    selectors: [".article-content", ".content", "article"],
    waitMs: 1800
  },
  {
    test: /xiaohongshu\.com/i,
    selectors: ["#detail-desc", ".note-text", "article"],
    waitMs: 2500
  },
  {
    test: /medium\.com/i,
    selectors: ["article", "section"],
    waitMs: 2e3
  },
  {
    test: /(github\.com)/i,
    selectors: [".markdown-body", "article", "#readme"],
    waitMs: 1500
  }
];
const GENERIC_CONTENT_SELECTORS = [
  "article",
  "main article",
  '[role="main"] article',
  "main",
  '[role="main"]',
  ".post-content",
  ".article-content",
  ".entry-content",
  "#content",
  ".content"
];
function querySiteProfile(url2) {
  return SITE_PROFILES.find((p) => p.test.test(url2));
}
function queryMetaContent(html, ...keys) {
  for (const key of keys) {
    const re = new RegExp(
      `<meta[^>]+(?:name|property)=["']${key}["'][^>]+content=["']([^"']*)["'][^>]*>|<meta[^>]+content=["']([^"']*)["'][^>]+(?:name|property)=["']${key}["'][^>]*>`,
      "i"
    );
    const m = re.exec(html);
    const val = (m?.[1] ?? m?.[2] ?? "").trim();
    if (val) return queryDecodeHtmlEntities(val);
  }
  return "";
}
function queryDecodeHtmlEntities(text) {
  return text.replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&quot;/gi, '"').replace(/&#39;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}
function queryHtmlTitle(html) {
  const m = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  return m ? queryDecodeHtmlEntities(m[1].replace(/\s+/g, " ").trim()) : "";
}
function queryExtractBySelectors(html, selectors) {
  for (const sel of selectors) {
    let re = null;
    if (sel.startsWith("#")) {
      const id = sel.slice(1).split(/[\s.>]/)[0];
      re = new RegExp(
        `<([a-z0-9]+)[^>]*\\sid=["']${id}["'][^>]*>([\\s\\S]*?)<\\/\\1>`,
        "i"
      );
    } else if (sel.startsWith(".") && !sel.includes(" ")) {
      const cls = sel.slice(1).split(".")[0];
      re = new RegExp(
        `<([a-z0-9]+)[^>]*\\sclass=["'][^"']*\\b${cls}\\b[^"']*["'][^>]*>([\\s\\S]*?)<\\/\\1>`,
        "i"
      );
    } else if (/^[a-z][a-z0-9]*$/i.test(sel)) {
      re = new RegExp(`<(${sel})[^>]*>([\\s\\S]*?)<\\/${sel}>`, "i");
    }
    if (!re) continue;
    const m = re.exec(html);
    if (!m?.[2]) continue;
    const text = queryStripHtmlToText(m[2]);
    if (text.length >= MIN_CONTENT_CHARS) return text;
  }
  return "";
}
function queryStripHtmlToText(html) {
  return queryDecodeHtmlEntities(
    html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<noscript[\s\S]*?<\/noscript>/gi, " ").replace(/<!--[\s\S]*?-->/g, " ").replace(/<br\s*\/?>/gi, "\n").replace(/<\/(p|div|h[1-6]|li|tr|section|article)>/gi, "\n").replace(/<[^>]+>/g, " ").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").replace(/[ \t]{2,}/g, " ").trim()
  );
}
function queryTruncate(text, max = MAX_CONTENT_CHARS) {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}
…[已截断，原文共约 ${text.length} 字]`;
}
function queryFormatLinkContent(snap, sourceLabel) {
  const lines = [
    `【链接内容】${snap.title || "（无标题）"}`,
    `URL: ${snap.url}`,
    snap.author ? `作者: ${snap.author}` : "",
    snap.description ? `摘要: ${snap.description}` : "",
    "",
    "—— 正文 ——",
    snap.content,
    "",
    snap.media ? queryFormatMediaSection(snap.media) : "",
    snap.media ? "" : "",
    `（来源：${sourceLabel}）`
  ];
  return lines.filter((l) => l !== "").join("\n");
}
async function queryWebDataViaHttp(url2, mediaOpts) {
  const res = await queryHttp(url2, {
    timeoutMs: 2e4,
    retries: 1,
    headers: {
      Accept: "text/html,application/xhtml+xml,application/json,text/plain,*/*",
      "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8"
    }
  });
  const contentType = res.headers.get("content-type") || "";
  const text = await res.text();
  if (!text.trim()) throw new Error("HTTP 响应体为空");
  if (contentType.includes("application/json") || /^\s*[\[{]/.test(text.trim())) {
    const body = queryTruncate(text.trim());
    if (body.length < 2) throw new Error("JSON 响应过短");
    return { title: "JSON 数据", url: url2, content: body };
  }
  const title = queryMetaContent(text, "og:title", "twitter:title") || queryHtmlTitle(text) || "";
  const description = queryMetaContent(text, "og:description", "description", "twitter:description") || void 0;
  const author = queryMetaContent(text, "author", "og:article:author", "article:author") || void 0;
  const profile = querySiteProfile(url2);
  const selectors = [
    ...profile?.selectors ?? [],
    ...GENERIC_CONTENT_SELECTORS
  ];
  let content = queryExtractBySelectors(text, selectors);
  if (!content) {
    content = queryStripHtmlToText(text);
  }
  content = queryTruncate(content);
  if (content.length < MIN_CONTENT_CHARS) {
    throw new Error("HTTP 提取正文过短，改用浏览器兜底");
  }
  const media = mediaOpts && mediaOpts.kinds.length > 0 ? queryExtractMediaFromHtml(text, url2, mediaOpts.kinds, mediaOpts.maxCount) : void 0;
  if (mediaOpts && mediaOpts.kinds.length > 0 && (!media || media.length === 0)) {
    throw new Error("HTTP 未发现请求的媒体资源，改用浏览器兜底");
  }
  return { title, url: url2, content, author, description, media };
}
async function queryExtractInPage(page, selectors) {
  return page.evaluate(
    (sels) => {
      const pickText = (el) => {
        if (!el) return "";
        const clone = el.cloneNode(true);
        clone.querySelectorAll("script,style,noscript,svg,nav,footer,aside,iframe").forEach((n) => n.remove());
        return (clone.innerText || clone.textContent || "").replace(/\s+\n/g, "\n").trim();
      };
      let best = "";
      for (const sel of sels) {
        try {
          const nodes = Array.from(document.querySelectorAll(sel));
          for (const node of nodes) {
            const t = pickText(node);
            if (t.length > best.length) best = t;
          }
        } catch {
        }
      }
      if (best.length < 80) {
        const body = pickText(document.body);
        if (body.length > best.length) best = body;
      }
      const meta = (key) => {
        const el = document.querySelector(`meta[property="${key}"]`) || document.querySelector(`meta[name="${key}"]`);
        return el?.getAttribute("content")?.trim() || "";
      };
      return {
        title: document.title || meta("og:title") || "",
        content: best,
        author: meta("author") || meta("og:article:author") || "",
        description: meta("og:description") || meta("description") || ""
      };
    },
    selectors
  );
}
async function queryWebDataViaBrowser(url2, mediaOpts) {
  const browser = getBrowserService();
  const profile = querySiteProfile(url2);
  const waitMs = profile?.waitMs ?? 1800;
  const selectors = [...profile?.selectors ?? [], ...GENERIC_CONTENT_SELECTORS];
  await browser.ensureStarted("headless");
  const page = browser.getPage("headless");
  if (!page) throw new Error("无头浏览器页面不可用");
  const sniffer = mediaOpts && mediaOpts.kinds.length > 0 ? queryAttachMediaNetworkSniffer(page, mediaOpts.kinds) : null;
  try {
    await browser.navigate(url2, "headless");
    await browser.wait({ ms: waitMs }, "headless");
    const primary = profile?.selectors?.[0];
    if (primary) {
      await page.locator(primary).first().waitFor({ state: "visible", timeout: 4e3 }).catch(() => void 0);
    }
    const extracted = await queryExtractInPage(page, selectors);
    const content = queryTruncate((extracted.content || "").trim());
    if (content.length < MIN_CONTENT_CHARS) {
      throw new Error("无头浏览器未提取到足够正文（可能需登录或页面受限）");
    }
    let media;
    if (mediaOpts && mediaOpts.kinds.length > 0) {
      media = await queryExtractMediaInPage(
        page,
        mediaOpts.kinds,
        mediaOpts.maxCount,
        sniffer?.getItems() ?? []
      );
    }
    const screenshotPng = mediaOpts && mediaOpts.kinds.length > 0 ? await queryPageViewportScreenshot(page) ?? void 0 : void 0;
    return {
      title: extracted.title,
      url: url2,
      content,
      author: extracted.author || void 0,
      description: extracted.description || void 0,
      media,
      screenshotPng
    };
  } finally {
    sniffer?.dispose();
  }
}
const queryWebDataTool = {
  name: "query_web_data",
  description: "根据用户粘贴或提供的 URL 获取网页正文（标题、摘要、正文）。适用于掘金、知乎专栏/问答、微信公众号、CSDN、简书、博客、GitHub README 及一般网站；优先 HTTP 解析，失败则无头浏览器后台抓取（不弹窗）。可选 mediaTypes=[image|video|audio] 按需提取页面媒体清单；HTTP 抽不到媒体时自动无头浏览器兜底并嗅探网络请求；downloadMedia=true 时下载到 artifacts（单文件上限 50MB）；下载前会按标题/正文主题做屏幕识别筛选，跳过无关 Logo/广告。热点榜单请用 fetch_hot_topics；天气用 query_weather；仅发布配图仍可用 fetch_web_images。",
  permission: "safe",
  parameters: {
    type: "object",
    properties: {
      url: {
        type: "string",
        description: "目标链接（http/https），例如掘金文章、知乎专栏、普通网页 URL"
      },
      preferBrowser: {
        type: "boolean",
        description: "为 true 时跳过 HTTP，直接无头浏览器（默认 false；SPA/强前端站可设 true）"
      },
      maxLength: {
        type: "number",
        description: `正文最大字符数，默认 ${MAX_CONTENT_CHARS}，上限 ${MAX_CONTENT_CHARS}`
      },
      mediaTypes: {
        type: "array",
        items: { type: "string", enum: ["image", "video", "audio"] },
        description: '按需提取的媒体类型子集；未传或空数组则不提取媒体（默认）。例：["video","audio"] 只列视频与音频 URL'
      },
      downloadMedia: {
        type: "boolean",
        description: "为 true 且已提取到媒体时，下载到 artifacts/web-media/ 并回填 localPath（默认 false，只列 URL）。会按页面主题筛选相关项，不会整页资源全量落盘"
      },
      mediaTopic: {
        type: "string",
        description: "下载媒体时的相关性主题（可选）。不传则用页面标题+摘要；用于跳过无关图/视频"
      },
      maxMediaCount: {
        type: "number",
        description: "媒体条数上限（各类型合计），默认 8，上限 20"
      }
    },
    required: ["url"]
  },
  async execute(args) {
    const url2 = String(args.url ?? "").trim();
    if (!/^https?:\/\//i.test(url2)) {
      return queryEncodeWorkflowCtxResult("url 必须以 http/https 开头", {
        webDataOk: "0",
        webData: "",
        webDataUrl: url2,
        webDataTitle: ""
      });
    }
    const preferBrowser = Boolean(args.preferBrowser);
    const maxLength = Math.min(
      MAX_CONTENT_CHARS,
      Math.max(1e3, Number(args.maxLength ?? MAX_CONTENT_CHARS) || MAX_CONTENT_CHARS)
    );
    const mediaKinds = queryNormalizeMediaTypes(args.mediaTypes);
    const maxMediaCount = queryNormalizeMaxMediaCount(args.maxMediaCount);
    const downloadMedia = Boolean(args.downloadMedia);
    const mediaTopic = args.mediaTopic != null ? String(args.mediaTopic).trim() : "";
    const mediaOpts = mediaKinds.length > 0 ? { kinds: mediaKinds, maxCount: maxMediaCount } : void 0;
    const sourceLabel = (source) => source === "browser" ? `无头浏览器兜底 · ${url2}` : `HTTP · ${url2}`;
    const result = await queryWithFallback({
      apiFetchers: preferBrowser ? [] : [() => queryWebDataViaHttp(url2, mediaOpts)],
      browserScraper: () => queryWebDataViaBrowser(url2, mediaOpts),
      failLabel: "链接内容获取失败",
      formatSuccess: (data, source) => {
        const clipped = {
          ...data,
          content: queryTruncate(data.content, maxLength)
        };
        return queryFormatLinkContent(clipped, sourceLabel(source));
      }
    });
    if (!result.ok || result.data == null) {
      return queryEncodeWorkflowCtxResult(result.message, {
        webDataOk: "0",
        webData: "",
        webDataUrl: url2,
        webDataTitle: "",
        webDataSource: result.source,
        webDataMedia: "[]"
      });
    }
    let snap = {
      ...result.data,
      content: queryTruncate(result.data.content, maxLength)
    };
    if (downloadMedia && snap.media && snap.media.length > 0) {
      const topic = mediaTopic || [snap.title, snap.description].filter(Boolean).join(" ").trim() || snap.content.slice(0, 80);
      const dl = await postDownloadPageMedia(snap.media, url2, void 0, {
        topic,
        screenshotPng: snap.screenshotPng
      });
      snap = { ...snap, media: dl.items };
    }
    const message = queryFormatLinkContent(
      snap,
      sourceLabel(result.source === "browser" ? "browser" : "api")
    );
    return queryEncodeWorkflowCtxResult(message, {
      webDataOk: "1",
      webData: message,
      webDataUrl: url2,
      webDataTitle: snap.title,
      webDataSource: result.source,
      webDataMedia: JSON.stringify(
        (snap.media ?? []).map((m) => ({
          kind: m.kind,
          url: m.url,
          title: m.title ?? "",
          localPath: m.localPath ?? "",
          downloadNote: m.downloadNote ?? ""
        }))
      )
    });
  }
};
const DEFAULT_MAX_RESULTS = 8;
const MAX_RESULTS_CAP = 15;
const MIN_RESULTS = 2;
const HTML_HEADERS = {
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8"
};
function queryStripHtmlText(raw) {
  return String(raw ?? "").replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&#(\d+);/g, (_, n) => {
    const code = Number(n);
    return Number.isFinite(code) ? String.fromCodePoint(code) : " ";
  }).replace(/\s+/g, " ").trim();
}
function queryIsJunkSearchUrl(url2) {
  const u = url2.toLowerCase();
  return !u || u.startsWith("javascript:") || u.includes("baidu.php") || u.includes("/aclick?") || u.includes("go.microsoft.com/fwlink");
}
function queryNormalizeSearchItems(items, maxCount) {
  const seen = /* @__PURE__ */ new Set();
  const out = [];
  for (const item of items) {
    const title = queryStripHtmlText(item.title).slice(0, 160);
    const url2 = String(item.url ?? "").trim();
    const snippet = queryStripHtmlText(item.snippet).slice(0, 280);
    if (!title || title.length < 2) continue;
    if (queryIsJunkSearchUrl(url2)) continue;
    const key = `${title}::${url2}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ title, url: url2, snippet });
    if (out.length >= maxCount) break;
  }
  return out;
}
function queryParseBingSearchHtml(html) {
  const items = [];
  const blocks = html.match(/<li class="b_algo"[\s\S]*?<\/li>/gi) ?? [];
  for (const block of blocks) {
    const titleMatch = block.match(/<h2[^>]*>\s*<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i) ?? block.match(
      /<a[^>]*href="([^"]+)"[^>]*h="ID=SERP[^"]*"[^>]*>([\s\S]*?)<\/a>/i
    );
    if (!titleMatch) continue;
    const snipMatch = block.match(/<p class="b_lineclamp[^"]*"[^>]*>([\s\S]*?)<\/p>/i) ?? block.match(/<div class="b_caption"[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/i);
    items.push({
      title: titleMatch[2],
      url: titleMatch[1],
      snippet: snipMatch?.[1] ?? ""
    });
  }
  return items;
}
function queryParseBaiduSearchHtml(html) {
  const items = [];
  const blocks = html.match(
    /<div[^>]*class="[^"]*c-container[^"]*"[\s\S]*?(?=<div[^>]*class="[^"]*c-container|$)/gi
  ) ?? [];
  for (const block of blocks) {
    const mu = block.match(/\smu="(https?:\/\/[^"]+)"/i)?.[1];
    const titleMatch = block.match(
      /<h3[^>]*>[\s\S]*?<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i
    );
    if (!titleMatch) continue;
    const snipMatch = block.match(/class="c-abstract[^"]*"[^>]*>([\s\S]*?)<\/(?:span|div|p)>/i) ?? block.match(
      /class="[^"]*content-right_[^"]*"[^>]*>([\s\S]*?)<\/span>/i
    ) ?? block.match(/data-content="([^"]+)"/i);
    items.push({
      title: titleMatch[2],
      url: mu || titleMatch[1],
      snippet: snipMatch?.[1] ?? ""
    });
  }
  return items;
}
function queryRequireSearchItems(items, engine, html) {
  const lower = html.toLowerCase();
  if (/captcha|验证码|unusual traffic|access denied|robot check|安全验证/.test(
    lower
  )) {
    throw new Error(`${engine} 搜索页疑似验证码/拦截`);
  }
  if (items.length < MIN_RESULTS) {
    throw new Error(`${engine} 有效结果不足（${items.length} 条）`);
  }
  return items;
}
async function queryBingSearchHttp(query, maxCount) {
  const url2 = "https://www.bing.com/search?" + new URLSearchParams({
    q: query,
    setlang: "zh-CN",
    ensearch: "0"
  }).toString();
  const res = await queryHttp(url2, {
    headers: { ...HTML_HEADERS, Referer: "https://www.bing.com/" },
    timeoutMs: 18e3,
    retries: 1
  });
  const html = await res.text();
  const parsed = queryNormalizeSearchItems(queryParseBingSearchHtml(html), maxCount);
  return queryRequireSearchItems(parsed, "bing", html);
}
async function queryBaiduSearchHttp(query, maxCount) {
  const url2 = "https://www.baidu.com/s?" + new URLSearchParams({
    wd: query,
    rn: String(Math.min(20, Math.max(10, maxCount + 2)))
  }).toString();
  const res = await queryHttp(url2, {
    headers: { ...HTML_HEADERS, Referer: "https://www.baidu.com/" },
    timeoutMs: 18e3,
    retries: 1
  });
  const html = await res.text();
  const parsed = queryNormalizeSearchItems(queryParseBaiduSearchHtml(html), maxCount);
  return queryRequireSearchItems(parsed, "baidu", html);
}
async function querySearchViaBrowser(engine, query, maxCount) {
  const pageUrl = engine === "bing" ? `https://www.bing.com/search?q=${encodeURIComponent(query)}&setlang=zh-CN` : `https://www.baidu.com/s?wd=${encodeURIComponent(query)}`;
  const browser = getBrowserService();
  await browser.navigate(pageUrl, "headless");
  await browser.wait({ ms: engine === "bing" ? 1600 : 2200 }, "headless");
  const page = browser.getPage("headless");
  if (!page) throw new Error("无头浏览器未就绪");
  const html = await page.content();
  const parsed = queryNormalizeSearchItems(
    engine === "bing" ? queryParseBingSearchHtml(html) : queryParseBaiduSearchHtml(html),
    maxCount
  );
  return queryRequireSearchItems(parsed, engine, html);
}
function queryFormatSearchResults(query, engine, items, via) {
  const engineLabel = engine === "bing" ? "Bing" : "百度";
  const lines = [
    `网络搜索「${query}」（引擎：${engineLabel}${via === "browser" ? " · 无头浏览器" : ""}）`,
    ""
  ];
  items.forEach((item, i) => {
    lines.push(`${i + 1}. ${item.title}`);
    lines.push(`   链接：${item.url}`);
    if (item.snippet) lines.push(`   摘要：${item.snippet}`);
  });
  return lines.join("\n");
}
const webSearchTool = {
  name: "web_search",
  description: "按关键词搜索公开网页。内部优先 Bing，失败自动改百度；HTTP 直抓失败时再无头浏览器兜底。适合查新闻/背景/出处链接；已有具体文章 URL 时请用 query_web_data。不要用本工具代替 fetch_hot_topics（热搜榜单）。",
  permission: "safe",
  parameters: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "搜索关键词或短句（建议中文）"
      },
      maxResults: {
        type: "number",
        description: `最多返回条数，默认 ${DEFAULT_MAX_RESULTS}，最大 ${MAX_RESULTS_CAP}`
      }
    },
    required: ["query"]
  },
  async execute(args) {
    const query = String(args.query ?? "").trim();
    if (!query) return "query 不能为空";
    const maxCount = Math.min(
      MAX_RESULTS_CAP,
      Math.max(3, Number(args.maxResults ?? DEFAULT_MAX_RESULTS) || DEFAULT_MAX_RESULTS)
    );
    let usedEngine = "bing";
    const result = await queryWithFallback({
      apiFetchers: [
        async () => {
          usedEngine = "bing";
          return queryBingSearchHttp(query, maxCount);
        },
        async () => {
          usedEngine = "baidu";
          return queryBaiduSearchHttp(query, maxCount);
        }
      ],
      browserScraper: async () => {
        try {
          usedEngine = "bing";
          return await querySearchViaBrowser("bing", query, maxCount);
        } catch (bingErr) {
          usedEngine = "baidu";
          try {
            return await querySearchViaBrowser("baidu", query, maxCount);
          } catch (baiduErr) {
            throw new Error(
              `浏览器兜底失败：Bing=${bingErr instanceof Error ? bingErr.message : String(bingErr)}; 百度=${baiduErr instanceof Error ? baiduErr.message : String(baiduErr)}`
            );
          }
        }
      },
      failLabel: "网络搜索失败",
      formatSuccess: (items, source) => queryFormatSearchResults(
        query,
        usedEngine,
        items,
        source === "browser" ? "browser" : "http"
      )
    });
    if (!result.ok || !result.data) {
      return `${result.message}
可稍后重试，或改用 browser_navigate 打开搜索页后 browser_snapshot。`;
    }
    return result.message;
  }
};
const CREATE_URL = "https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis";
const TASK_URL = "https://dashscope.aliyuncs.com/api/v1/tasks";
async function postDownloadImage(url2, outputPath) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  const res = await queryHttp(url2, { timeoutMs: 6e4 });
  const body = res.body;
  if (!body) throw new Error("图片下载响应无 body");
  const nodeStream = stream.Readable.fromWeb(body);
  await promises.pipeline(nodeStream, fs.createWriteStream(outputPath));
}
async function queryWaitTask(taskId, apiKey, maxAttempts = 40) {
  for (let i = 0; i < maxAttempts; i++) {
    const data = await queryHttpJson(`${TASK_URL}/${taskId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      timeoutMs: 3e4
    });
    const status = data.output?.task_status;
    if (status === "SUCCEEDED") {
      const url2 = data.output?.results?.[0]?.url;
      if (!url2) throw new Error("文生图成功但未返回图片 URL");
      return url2;
    }
    if (status === "FAILED" || status === "CANCELED" || status === "UNKNOWN") {
      throw new Error(data.output?.results?.[0]?.message || data.message || `任务失败：${status}`);
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  throw new Error("文生图任务超时，请稍后重试");
}
function queryDashscopeTextToImageProvider() {
  return {
    id: "dashscope-wanx",
    async generate(req) {
      const settings = querySettings();
      const connection = queryModelConnection(settings, "video");
      const apiKey = connection.apiKey.trim();
      if (!apiKey || connection.provider !== "dashscope") {
        const dash = settings.connections?.find(
          (c) => c.provider === "dashscope" && c.apiKey.trim()
        );
        if (!dash) {
          return {
            ok: false,
            message: "未找到已配置 API Key 的百炼连接，无法调用万相文生图"
          };
        }
        return postGenerateWithKey(dash.apiKey.trim(), req);
      }
      return postGenerateWithKey(apiKey, req);
    }
  };
}
async function postGenerateWithKey(apiKey, req) {
  try {
    const created = await queryHttpJson(CREATE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "X-DashScope-Async": "enable"
      },
      body: {
        model: "wanx2.1-t2i-turbo",
        input: { prompt: req.prompt.slice(0, 500) },
        parameters: { size: "1280*720", n: 1 }
      },
      timeoutMs: 3e4
    });
    const taskId = created.output?.task_id;
    if (!taskId) {
      return {
        ok: false,
        message: created.message || created.code || "创建文生图任务失败（无 task_id）"
      };
    }
    const imageUrl = await queryWaitTask(taskId, apiKey);
    const outputPath = req.outputPath?.trim() || `${process.cwd()}/wanx-${Date.now()}.png`;
    await postDownloadImage(imageUrl, outputPath);
    return { ok: true, path: outputPath, message: `万相文生图已保存：${outputPath}` };
  } catch (err) {
    return {
      ok: false,
      message: `百炼文生图失败：${err instanceof Error ? err.message : String(err)}`
    };
  }
}
const TTS_URL = "https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation";
const DEFAULT_VOICE = "Cherry";
const MAX_TEXT_CHARS = 500;
async function postDownloadAudio(url2, outputPath) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  const res = await queryHttp(url2, { timeoutMs: 6e4 });
  const body = res.body;
  if (!body) throw new Error("音频下载响应无 body");
  const nodeStream = stream.Readable.fromWeb(body);
  await promises.pipeline(nodeStream, fs.createWriteStream(outputPath));
}
function queryDashscopeApiKey$1() {
  const settings = querySettings();
  const connection = queryModelConnection(settings, "video");
  if (connection.provider === "dashscope" && connection.apiKey.trim()) {
    return connection.apiKey.trim();
  }
  const dash = settings.connections?.find(
    (c) => c.provider === "dashscope" && c.apiKey.trim()
  );
  if (dash) return dash.apiKey.trim();
  if (settings.provider === "dashscope" && settings.apiKey.trim()) {
    return settings.apiKey.trim();
  }
  return null;
}
async function postSynthesizeWithKey(apiKey, req) {
  const text = req.text.trim().slice(0, MAX_TEXT_CHARS);
  if (!text) {
    return { ok: false, message: "旁白文本为空，跳过 TTS" };
  }
  try {
    const data = await queryHttpJson(TTS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: {
        model: "qwen3-tts-flash",
        input: {
          text,
          voice: DEFAULT_VOICE,
          language_type: "Chinese"
        }
      },
      timeoutMs: 6e4
    });
    if (data.code) {
      return {
        ok: false,
        message: `百炼 TTS 失败：${data.message || data.code}`
      };
    }
    const audioUrl = data.output?.audio?.url;
    if (!audioUrl) {
      return {
        ok: false,
        message: data.message || "TTS 成功但未返回音频 URL"
      };
    }
    const outputPath = req.outputPath?.trim() || `${process.cwd()}/qwen-tts-${Date.now()}.wav`;
    await postDownloadAudio(audioUrl, outputPath);
    return { ok: true, path: outputPath, message: `Qwen-TTS 已保存：${outputPath}` };
  } catch (err) {
    return {
      ok: false,
      message: `百炼 TTS 失败：${err instanceof Error ? err.message : String(err)}`
    };
  }
}
function queryDashscopeTextToSpeechProvider() {
  return {
    id: "dashscope-qwen-tts",
    async synthesize(req) {
      const apiKey = queryDashscopeApiKey$1();
      if (!apiKey) {
        return {
          ok: false,
          message: "未找到已配置 API Key 的百炼连接，无法调用 Qwen-TTS"
        };
      }
      return postSynthesizeWithKey(apiKey, req);
    }
  };
}
const DASHSCOPE_TASK_URL = "https://dashscope.aliyuncs.com/api/v1/tasks";
const DASHSCOPE_VIDEO_SYNTHESIS_URL = "https://dashscope.aliyuncs.com/api/v1/services/aigc/video-generation/video-synthesis";
function queryDashscopeApiKey() {
  const settings = querySettings();
  const connection = queryModelConnection(settings, "video");
  if (connection.provider === "dashscope" && connection.apiKey.trim()) {
    return connection.apiKey.trim();
  }
  const dash = settings.connections?.find(
    (c) => c.provider === "dashscope" && c.apiKey.trim()
  );
  if (dash) return dash.apiKey.trim();
  if (settings.provider === "dashscope" && settings.apiKey.trim()) {
    return settings.apiKey.trim();
  }
  return null;
}
async function postCreateAsyncTask(url2, body, apiKey) {
  const created = await queryHttpJson(url2, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "X-DashScope-Async": "enable"
    },
    body,
    timeoutMs: 3e4
  });
  const taskId = created.output?.task_id;
  if (!taskId) {
    throw new Error(created.message || created.code || "创建异步任务失败（无 task_id）");
  }
  return taskId;
}
async function queryWaitTaskResult(taskId, apiKey, options = {}) {
  const maxAttempts = options.maxAttempts ?? 40;
  const pollIntervalMs = options.pollIntervalMs ?? 1500;
  for (let i = 0; i < maxAttempts; i++) {
    const data = await queryHttpJson(
      `${DASHSCOPE_TASK_URL}/${taskId}`,
      {
        headers: { Authorization: `Bearer ${apiKey}` },
        timeoutMs: 3e4
      }
    );
    const status = data.output?.task_status;
    if (status === "SUCCEEDED") return data;
    if (status === "FAILED" || status === "CANCELED" || status === "UNKNOWN") {
      throw new Error(data.output?.results?.[0]?.message || data.message || `任务失败：${status}`);
    }
    await new Promise((r) => setTimeout(r, pollIntervalMs));
  }
  throw new Error("异步任务超时，请稍后重试");
}
function queryResultUrl(data) {
  const videoUrl = data.output?.video_url;
  if (videoUrl) return videoUrl;
  const imageUrl = data.output?.results?.[0]?.url;
  if (!imageUrl) throw new Error("任务成功但未返回产物 URL");
  return imageUrl;
}
async function postDownloadFile(url2, outputPath) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  const res = await queryHttp(url2, { timeoutMs: 12e4 });
  const body = res.body;
  if (!body) throw new Error("下载响应无 body");
  const nodeStream = stream.Readable.fromWeb(body);
  await promises.pipeline(nodeStream, fs.createWriteStream(outputPath));
}
function queryImageDataUrlFromFile(imagePath) {
  const ext = path.extname(imagePath).toLowerCase();
  const mimeMap = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".gif": "image/gif"
  };
  const mime = mimeMap[ext] ?? "image/png";
  const buf = fs.readFileSync(imagePath);
  return `data:${mime};base64,${buf.toString("base64")}`;
}
const I2V_MODEL = "wan2.2-i2v-flash";
function queryDashscopeImageToVideoProvider() {
  return {
    id: "dashscope-wan-i2v",
    async generate(req) {
      const apiKey = queryDashscopeApiKey();
      if (!apiKey) {
        return {
          ok: false,
          message: "未找到已配置 API Key 的百炼连接，无法调用万相图生视频"
        };
      }
      const imagePath = req.imagePath?.trim();
      if (!imagePath || !fs.existsSync(imagePath)) {
        return { ok: false, message: `图生视频需要有效的首帧图片：${imagePath ?? "空"}` };
      }
      const duration = Math.min(5, Math.max(3, Math.round(req.durationSec ?? 5)));
      const outputPath = req.outputPath?.trim() || `${process.cwd()}/wan-i2v-${Date.now()}.mp4`;
      try {
        const imgUrl = queryImageDataUrlFromFile(imagePath);
        const taskId = await postCreateAsyncTask(
          DASHSCOPE_VIDEO_SYNTHESIS_URL,
          {
            model: I2V_MODEL,
            input: {
              prompt: (req.prompt ?? "镜头缓慢推进，画面自然流畅").slice(0, 800),
              img_url: imgUrl
            },
            parameters: {
              resolution: "720P",
              duration,
              prompt_extend: true
            }
          },
          apiKey
        );
        const result = await queryWaitTaskResult(taskId, apiKey, {
          maxAttempts: 120,
          pollIntervalMs: 3e3
        });
        const videoUrl = queryResultUrl(result);
        await postDownloadFile(videoUrl, outputPath);
        return { ok: true, path: outputPath, message: `万相图生视频已保存：${outputPath}` };
      } catch (err) {
        return {
          ok: false,
          message: `百炼图生视频失败：${err instanceof Error ? err.message : String(err)}`
        };
      }
    }
  };
}
const T2V_MODELS = ["wan2.6-t2v", "wan2.7-t2v"];
const DEFAULT_NEGATIVE$1 = "低分辨率、错误、最差质量、低质量、残缺、多余的手指、比例不良、扭曲人脸、肢体崩坏、闪烁、跳帧";
function queryDashscopeTextToVideoProvider() {
  return {
    id: "dashscope-wan-t2v",
    async generate(req) {
      const apiKey = queryDashscopeApiKey();
      if (!apiKey) {
        return {
          ok: false,
          message: "未找到已配置 API Key 的百炼连接，无法调用万相文生视频"
        };
      }
      const prompt = req.prompt?.trim();
      if (!prompt) {
        return { ok: false, message: "文生视频 prompt 不能为空" };
      }
      const duration = Math.min(15, Math.max(2, Math.round(req.durationSec ?? 5)));
      const ratio = req.aspectRatio ?? "16:9";
      const outputPath = req.outputPath?.trim() || `${process.cwd()}/wan-t2v-${Date.now()}.mp4`;
      let lastError = "未知错误";
      for (const model of T2V_MODELS) {
        try {
          const taskId = await postCreateAsyncTask(
            DASHSCOPE_VIDEO_SYNTHESIS_URL,
            {
              model,
              input: {
                prompt: prompt.slice(0, 2e3),
                negative_prompt: (req.negativePrompt ?? DEFAULT_NEGATIVE$1).slice(0, 500)
              },
              parameters: {
                resolution: "720P",
                ratio,
                duration,
                prompt_extend: true
              }
            },
            apiKey
          );
          const result = await queryWaitTaskResult(taskId, apiKey, {
            maxAttempts: 120,
            pollIntervalMs: 3e3
          });
          const videoUrl = queryResultUrl(result);
          await postDownloadFile(videoUrl, outputPath);
          return {
            ok: true,
            path: outputPath,
            message: `万相文生视频已保存（${model}）：${outputPath}`
          };
        } catch (err) {
          lastError = err instanceof Error ? err.message : String(err);
        }
      }
      return { ok: false, message: `百炼文生视频失败：${lastError}` };
    }
  };
}
function queryFfmpegBin$1() {
  for (const bin of ["ffmpeg", "/usr/local/bin/ffmpeg", "/opt/homebrew/bin/ffmpeg"]) {
    if (bin === "ffmpeg" || fs.existsSync(bin)) return bin;
  }
  return "ffmpeg";
}
async function postWritePlaceholderImage(opts) {
  fs.mkdirSync(path.dirname(opts.outputPath), { recursive: true });
  const label = (opts.label ?? "scene").replace(/[:\\]/g, " ").slice(0, 40);
  const bin = queryFfmpegBin$1();
  const args = [
    "-y",
    "-f",
    "lavfi",
    "-i",
    `color=c=0x2c3e50:s=1280x720:d=1`,
    "-frames:v",
    "1",
    opts.outputPath
  ];
  return new Promise((resolve) => {
    const child = child_process.spawn(bin, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    child.stderr?.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", (err) => {
      resolve({
        ok: false,
        message: `占位图生成失败（ffmpeg 不可用）：${err.message}（镜头：${label}）`
      });
    });
    child.on("close", (code) => {
      if (code === 0 && fs.existsSync(opts.outputPath)) {
        resolve({
          ok: true,
          path: opts.outputPath,
          message: `已生成本地占位图：${opts.outputPath}`
        });
      } else {
        resolve({
          ok: false,
          message: `占位图 ffmpeg 退出码 ${code}：${stderr.slice(-300) || "未知错误"}`
        });
      }
    });
  });
}
const t2iProviders = /* @__PURE__ */ new Map();
const i2vProviders = /* @__PURE__ */ new Map();
const t2vProviders = /* @__PURE__ */ new Map();
const ttsProviders = /* @__PURE__ */ new Map();
const composeProviders = /* @__PURE__ */ new Map();
let activeT2i = "placeholder";
let activeI2v = "placeholder";
let activeT2v = "placeholder";
let activeTts = "placeholder";
let activeCompose = "ffmpeg-local";
function postRegisterTextToImageProvider(provider) {
  t2iProviders.set(provider.id, provider);
}
function postRegisterImageToVideoProvider(provider) {
  i2vProviders.set(provider.id, provider);
}
function postRegisterTextToVideoProvider(provider) {
  t2vProviders.set(provider.id, provider);
}
function postRegisterTextToSpeechProvider(provider) {
  ttsProviders.set(provider.id, provider);
}
function postRegisterVideoComposeProvider(provider) {
  composeProviders.set(provider.id, provider);
}
function queryPlaceholderT2i() {
  return {
    id: "placeholder",
    async generate(req) {
      return {
        ok: false,
        message: `文生图 Provider 未配置，无法根据「${req.prompt.slice(0, 40)}」生成画面。请在设置中接入可插拔图像 Provider 后重试。`
      };
    }
  };
}
function queryPlaceholderI2v() {
  return {
    id: "placeholder",
    async generate() {
      return {
        ok: false,
        message: "图生视频 Provider 未配置。请在设置中接入可插拔视频 Provider 后重试。"
      };
    }
  };
}
function queryPlaceholderT2v() {
  return {
    id: "placeholder",
    async generate() {
      return {
        ok: false,
        message: "文生视频 Provider 未配置。请在设置中接入可插拔视频 Provider 后重试。"
      };
    }
  };
}
function queryPlaceholderTts() {
  return {
    id: "placeholder",
    async synthesize() {
      return {
        ok: false,
        message: "TTS Provider 未配置。请在设置中接入语音合成 Provider 后重试。"
      };
    }
  };
}
function queryFfmpegBin() {
  const candidates = ["ffmpeg", "/usr/local/bin/ffmpeg", "/opt/homebrew/bin/ffmpeg"];
  for (const bin of candidates) {
    try {
      if (bin === "ffmpeg") return "ffmpeg";
      if (fs.existsSync(bin)) return bin;
    } catch {
    }
  }
  return "ffmpeg";
}
function postRunFfmpeg(args) {
  const bin = queryFfmpegBin();
  if (!bin) {
    return Promise.resolve({ ok: false, message: "未找到 ffmpeg，请先安装后再合成视频" });
  }
  return new Promise((resolve) => {
    const child = child_process.spawn(bin, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    child.stderr?.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", (err) => {
      resolve({
        ok: false,
        message: `ffmpeg 启动失败：${err.message}。请确认已安装 ffmpeg 并在 PATH 中。`
      });
    });
    child.on("close", (code) => {
      if (code === 0) {
        resolve({ ok: true, message: "ffmpeg 合成成功" });
      } else {
        resolve({
          ok: false,
          message: `ffmpeg 退出码 ${code}：${stderr.slice(-500) || "未知错误"}`
        });
      }
    });
  });
}
function queryIsVideoPath(filePath) {
  return /\.(mp4|mov|webm|mkv)$/i.test(filePath);
}
function queryEscapeConcatPath(filePath) {
  return filePath.replace(/'/g, "'\\''");
}
function queryLocalFfmpegCompose() {
  return {
    id: "ffmpeg-local",
    async compose(req) {
      const outDir = path.join(getVideosDir(), "outputs");
      fs.mkdirSync(outDir, { recursive: true });
      const outputPath = req.outputPath?.trim() || path.join(outDir, `compose-${Date.now()}.mp4`);
      if (!req.scenePaths.length) {
        return { ok: false, message: "compose 需要至少一张分镜素材路径" };
      }
      const duration = Math.max(1, req.sceneDurationSec ?? 3);
      const ts = Date.now();
      let mergedAudio = req.audioPath;
      const audioList = (req.audioPaths ?? []).filter((p) => fs.existsSync(p));
      if (!mergedAudio && audioList.length === 1) {
        mergedAudio = audioList[0];
      } else if (!mergedAudio && audioList.length > 1) {
        const audioListPath = path.join(outDir, `audio-concat-${ts}.txt`);
        const audioLines = audioList.map((p) => `file '${queryEscapeConcatPath(p)}'`);
        fs.writeFileSync(audioListPath, audioLines.join("\n"), "utf-8");
        mergedAudio = path.join(outDir, `merged-audio-${ts}.wav`);
        const audioRun = await postRunFfmpeg([
          "-y",
          "-f",
          "concat",
          "-safe",
          "0",
          "-i",
          audioListPath,
          "-c",
          "copy",
          mergedAudio
        ]);
        if (!audioRun.ok) {
          mergedAudio = audioList[0];
        }
      }
      const listPath = path.join(outDir, `concat-${ts}.txt`);
      const lines = [];
      for (const p of req.scenePaths) {
        const escaped = queryEscapeConcatPath(p);
        lines.push(`file '${escaped}'`);
        if (!queryIsVideoPath(p)) {
          lines.push(`duration ${duration}`);
        }
      }
      const last = req.scenePaths[req.scenePaths.length - 1];
      lines.push(`file '${queryEscapeConcatPath(last)}'`);
      fs.writeFileSync(listPath, lines.join("\n"), "utf-8");
      const scaleFilter = "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2";
      const hasAudio = Boolean(mergedAudio && fs.existsSync(mergedAudio));
      const args = hasAudio ? [
        "-y",
        "-f",
        "concat",
        "-safe",
        "0",
        "-i",
        listPath,
        "-i",
        mergedAudio,
        "-filter_complex",
        `[0:v]${scaleFilter}[vout]`,
        "-map",
        "[vout]",
        "-map",
        "1:a:0",
        "-pix_fmt",
        "yuv420p",
        "-shortest",
        outputPath
      ] : [
        "-y",
        "-f",
        "concat",
        "-safe",
        "0",
        "-i",
        listPath,
        "-filter:v",
        scaleFilter,
        "-pix_fmt",
        "yuv420p",
        outputPath
      ];
      const run = await postRunFfmpeg(args);
      if (!run.ok) {
        const manifestPath = outputPath.replace(/\.mp4$/i, ".manifest.json");
        const ffmpegCommand = `ffmpeg ${args.map((arg) => /\s/.test(arg) ? `"${arg}"` : arg).join(" ")}`;
        fs.writeFileSync(
          manifestPath,
          JSON.stringify(
            {
              title: req.title,
              scenePaths: req.scenePaths,
              audioPath: mergedAudio,
              audioPaths: req.audioPaths,
              sceneDurationSec: duration,
              ffmpegCommand,
              error: run.message
            },
            null,
            2
          ),
          "utf-8"
        );
        return {
          ok: false,
          path: manifestPath,
          message: `${run.message}；已写入分镜清单：${manifestPath}`
        };
      }
      return { ok: true, path: outputPath, message: `成片已生成：${outputPath}` };
    }
  };
}
function queryLocalPlaceholderT2i() {
  return {
    id: "local-placeholder",
    async generate(req) {
      const outputPath = req.outputPath?.trim() || path.join(getVideosDir(), "scenes", `placeholder-${Date.now()}.png`);
      return postWritePlaceholderImage({
        outputPath,
        label: req.prompt.slice(0, 40)
      });
    }
  };
}
function queryHasDashscopeKey() {
  try {
    const settings = querySettings();
    return Boolean(
      settings.connections?.some((c) => c.provider === "dashscope" && c.apiKey.trim()) || settings.provider === "dashscope" && settings.apiKey.trim()
    );
  } catch {
    return false;
  }
}
let mediaInited = false;
function initMediaProviders() {
  if (mediaInited) return;
  mediaInited = true;
  postRegisterTextToImageProvider(queryPlaceholderT2i());
  postRegisterTextToImageProvider(queryLocalPlaceholderT2i());
  postRegisterTextToImageProvider(queryDashscopeTextToImageProvider());
  postRegisterImageToVideoProvider(queryPlaceholderI2v());
  postRegisterImageToVideoProvider(queryDashscopeImageToVideoProvider());
  postRegisterTextToVideoProvider(queryPlaceholderT2v());
  postRegisterTextToVideoProvider(queryDashscopeTextToVideoProvider());
  postRegisterTextToSpeechProvider(queryPlaceholderTts());
  postRegisterTextToSpeechProvider(queryDashscopeTextToSpeechProvider());
  postRegisterVideoComposeProvider(queryLocalFfmpegCompose());
  refreshActiveVideoProviders();
}
function refreshActiveTextToImageProvider() {
  initMediaProviders();
  if (queryHasDashscopeKey()) {
    activeT2i = "dashscope-wanx";
  } else if (activeT2i === "dashscope-wanx" || activeT2i === "placeholder") {
    activeT2i = "local-placeholder";
  }
}
function refreshActiveTextToSpeechProvider() {
  initMediaProviders();
  activeTts = queryHasDashscopeKey() ? "dashscope-qwen-tts" : "placeholder";
}
function refreshActiveVideoProviders() {
  initMediaProviders();
  const hasDash = queryHasDashscopeKey();
  activeT2i = hasDash ? "dashscope-wanx" : "local-placeholder";
  activeI2v = hasDash ? "dashscope-wan-i2v" : "placeholder";
  activeT2v = hasDash ? "dashscope-wan-t2v" : "placeholder";
  activeTts = hasDash ? "dashscope-qwen-tts" : "placeholder";
  activeCompose = "ffmpeg-local";
}
function queryTextToImageProvider() {
  return t2iProviders.get(activeT2i) ?? queryPlaceholderT2i();
}
function queryImageToVideoProvider() {
  return i2vProviders.get(activeI2v) ?? queryPlaceholderI2v();
}
function queryTextToVideoProvider() {
  return t2vProviders.get(activeT2v) ?? queryPlaceholderT2v();
}
function queryTextToSpeechProvider() {
  return ttsProviders.get(activeTts) ?? queryPlaceholderTts();
}
function queryVideoComposeProvider() {
  return composeProviders.get(activeCompose) ?? queryLocalFfmpegCompose();
}
function querySceneAssetsDir(sessionId) {
  const dir = path.join(getVideosDir(), "scenes", sessionId ?? "default");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}
const DEFAULT_NEGATIVE = "低分辨率、扭曲人脸、肢体崩坏、闪烁、跳帧、多余手指、比例不良";
function queryProjectDir(sessionId) {
  const dir = path.join(getVideosDir(), "projects", sessionId);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}
function queryEnrichedVisualPrompt(shot) {
  const parts = [shot.visual];
  if (shot.cameraMotion?.trim()) parts.push(`镜头：${shot.cameraMotion.trim()}`);
  if (shot.style?.trim()) parts.push(`风格：${shot.style.trim()}`);
  if (shot.lighting?.trim()) parts.push(`光影：${shot.lighting.trim()}`);
  return parts.join("，");
}
function queryMotionPrompt(shot) {
  const motion = shot.cameraMotion?.trim() || "镜头缓慢推进";
  return `${motion}，画面自然流畅，${shot.visual.slice(0, 200)}`;
}
function queryAspectRatio(shot) {
  const raw = shot.aspectRatio?.trim();
  if (raw === "9:16" || raw === "16:9" || raw === "1:1" || raw === "4:3" || raw === "3:4") {
    return raw;
  }
  return "16:9";
}
const generateScriptTool = {
  name: "generate_script",
  description: "将剧本正文保存到本地项目目录。可来自用户上传附件解读后的内容，或一句话扩写后的完整剧本。写入 context.scriptPath / scriptText。后续应调用 generate_storyboard。",
  permission: "sensitive",
  parameters: {
    type: "object",
    properties: {
      title: { type: "string", description: "剧名/短视频标题" },
      script: { type: "string", description: "完整剧本文本（含场次、对白等）" },
      sourcePrompt: {
        type: "string",
        description: "用户原始一句话/段落（可选，便于追溯）"
      }
    },
    required: ["title", "script"]
  },
  async execute(args, ctx) {
    const title = String(args.title ?? "").trim() || "未命名剧本";
    const script = String(args.script ?? "").trim();
    if (!script) return "script 不能为空";
    const dir = queryProjectDir(ctx.sessionId);
    const scriptPath = path.join(dir, "script.md");
    const body = [
      `# ${title}`,
      "",
      args.sourcePrompt ? `> 用户原话：${String(args.sourcePrompt)}` : "",
      "",
      script
    ].filter((l) => l !== void 0).join("\n");
    fs.writeFileSync(scriptPath, body, "utf-8");
    return queryEncodeWorkflowCtxResult(`剧本已保存：${scriptPath}`, {
      scriptOk: "1",
      scriptPath,
      scriptTitle: title,
      scriptText: script.slice(0, 8e3)
    });
  }
};
const generateStoryboardTool = {
  name: "generate_storyboard",
  description: "根据剧本生成并保存分镜表（JSON）。每镜含 visual、narration、durationSec、cameraMotion（推/拉/环绕/跟拍）、style（写实/电影/动画）、negativePrompt、aspectRatio（9:16/16:9）、lighting。写入 context.storyboardPath。后续由视频角色调用 generate_scene_assets。",
  permission: "sensitive",
  parameters: {
    type: "object",
    properties: {
      title: { type: "string", description: "作品标题" },
      logline: { type: "string", description: "一句话梗概" },
      shots: {
        type: "array",
        description: "分镜列表",
        items: {
          type: "object",
          properties: {
            id: { type: "string" },
            visual: { type: "string" },
            narration: { type: "string" },
            durationSec: { type: "number" },
            cameraMotion: { type: "string" },
            style: { type: "string" },
            negativePrompt: { type: "string" },
            aspectRatio: { type: "string" },
            lighting: { type: "string" }
          },
          required: ["id", "visual"]
        }
      }
    },
    required: ["title", "shots"]
  },
  async execute(args, ctx) {
    const title = String(args.title ?? "").trim() || "未命名分镜";
    const shotsRaw = Array.isArray(args.shots) ? args.shots : [];
    const shots = shotsRaw.map((raw, i) => {
      const row = raw;
      return {
        id: String(row.id ?? `shot-${i + 1}`),
        visual: String(row.visual ?? "").trim(),
        narration: row.narration != null ? String(row.narration) : void 0,
        durationSec: row.durationSec != null ? Number(row.durationSec) : 3,
        cameraMotion: row.cameraMotion != null ? String(row.cameraMotion) : void 0,
        style: row.style != null ? String(row.style) : void 0,
        negativePrompt: row.negativePrompt != null ? String(row.negativePrompt) : void 0,
        aspectRatio: row.aspectRatio != null ? String(row.aspectRatio) : void 0,
        lighting: row.lighting != null ? String(row.lighting) : void 0
      };
    }).filter((s) => s.visual);
    if (shots.length === 0) {
      return "shots 不能为空，请至少提供一镜 visual";
    }
    const doc = {
      title,
      logline: args.logline != null ? String(args.logline) : void 0,
      shots
    };
    const dir = queryProjectDir(ctx.sessionId);
    const storyboardPath = path.join(dir, "storyboard.json");
    fs.writeFileSync(storyboardPath, JSON.stringify(doc, null, 2), "utf-8");
    const preview = shots.map((s, i) => `${i + 1}. [${s.id}] ${s.visual.slice(0, 60)}`).join("\n");
    return queryEncodeWorkflowCtxResult(
      `分镜已保存（${shots.length} 镜）：${storyboardPath}
${preview}`,
      {
        storyboardOk: "1",
        storyboardPath,
        storyboardTitle: title,
        shotCount: String(shots.length)
      }
    );
  }
};
const generateSceneAssetsTool = {
  name: "generate_scene_assets",
  description: "读取 storyboardPath，为每镜生成关键帧/动效视频/旁白。流程：万相文生图 → 万相图生视频；I2V 失败时文生视频兜底；旁白走 Qwen-TTS。写入 context.sceneAssetPaths / sceneVideoPaths / sceneAudioPaths。",
  permission: "sensitive",
  parameters: {
    type: "object",
    properties: {
      storyboardPath: {
        type: "string",
        description: "分镜 JSON 路径；缺省为当前会话 projects/.../storyboard.json"
      }
    },
    required: []
  },
  async execute(args, ctx) {
    refreshActiveVideoProviders();
    refreshActiveTextToImageProvider();
    refreshActiveTextToSpeechProvider();
    const defaultPath = path.join(queryProjectDir(ctx.sessionId), "storyboard.json");
    const storyboardPath = String(args.storyboardPath ?? defaultPath).trim();
    if (!fs.existsSync(storyboardPath)) {
      return `找不到分镜文件：${storyboardPath}，请先 generate_storyboard`;
    }
    const doc = JSON.parse(fs.readFileSync(storyboardPath, "utf-8"));
    const sceneDir = querySceneAssetsDir(ctx.sessionId);
    const t2i = queryTextToImageProvider();
    const i2v = queryImageToVideoProvider();
    const t2v = queryTextToVideoProvider();
    const tts = queryTextToSpeechProvider();
    const sceneAssetPaths = [];
    const sceneVideoPaths = [];
    const sceneImagePaths = [];
    const audioPaths = [];
    const notes = [];
    let imageOk = 0;
    let videoOk = 0;
    let voiceOk = 0;
    let voiceTotal = 0;
    for (const shot of doc.shots ?? []) {
      const enrichedPrompt = queryEnrichedVisualPrompt(shot);
      const imageOut = path.join(sceneDir, `${shot.id}.png`);
      const videoOut = path.join(sceneDir, `${shot.id}.mp4`);
      const duration = Math.min(15, Math.max(2, shot.durationSec ?? 5));
      const img = await t2i.generate({ prompt: enrichedPrompt, outputPath: imageOut });
      let imagePath;
      if (img.ok && img.path) {
        imagePath = img.path;
        sceneImagePaths.push(img.path);
        imageOk += 1;
        notes.push(`${shot.id} 关键帧：${img.path}`);
      } else {
        const stubImg = await postWritePlaceholderImage({
          outputPath: imageOut,
          label: shot.id
        });
        if (stubImg.ok && stubImg.path) {
          imagePath = stubImg.path;
          sceneImagePaths.push(stubImg.path);
          notes.push(`${shot.id} 关键帧回退占位图（${img.message}）→ ${stubImg.path}`);
        } else {
          notes.push(`${shot.id} 关键帧失败：${img.message}`);
        }
      }
      let composePath = imagePath;
      if (imagePath) {
        const motionPrompt = queryMotionPrompt(shot);
        const i2vResult = await i2v.generate({
          imagePath,
          prompt: motionPrompt,
          durationSec: duration,
          outputPath: videoOut
        });
        if (i2vResult.ok && i2vResult.path) {
          sceneVideoPaths.push(i2vResult.path);
          composePath = i2vResult.path;
          videoOk += 1;
          notes.push(`${shot.id} 图生视频：${i2vResult.path}`);
        } else {
          notes.push(`${shot.id} 图生视频失败：${i2vResult.message}，尝试文生视频兜底`);
          const t2vResult = await t2v.generate({
            prompt: enrichedPrompt,
            negativePrompt: shot.negativePrompt ?? DEFAULT_NEGATIVE,
            aspectRatio: queryAspectRatio(shot),
            durationSec: duration,
            outputPath: videoOut
          });
          if (t2vResult.ok && t2vResult.path) {
            sceneVideoPaths.push(t2vResult.path);
            composePath = t2vResult.path;
            videoOk += 1;
            notes.push(`${shot.id} 文生视频兜底：${t2vResult.path}`);
          } else {
            notes.push(`${shot.id} 文生视频也失败：${t2vResult.message}，合成将使用静图`);
          }
        }
      }
      if (composePath) {
        sceneAssetPaths.push(composePath);
      }
      if (shot.narration?.trim()) {
        voiceTotal += 1;
        const audioOut = path.join(sceneDir, `${shot.id}.wav`);
        const voice = await tts.synthesize({
          text: shot.narration.trim(),
          outputPath: audioOut
        });
        if (voice.ok && voice.path) {
          audioPaths.push(voice.path);
          voiceOk += 1;
          notes.push(`${shot.id} 旁白：${voice.path}`);
        } else {
          notes.push(`${shot.id} 旁白失败：${voice.message}`);
        }
      }
    }
    const manifestPath = path.join(sceneDir, "assets-manifest.json");
    fs.writeFileSync(
      manifestPath,
      JSON.stringify(
        {
          storyboardPath,
          sceneAssetPaths,
          sceneVideoPaths,
          sceneImagePaths,
          audioPaths,
          notes
        },
        null,
        2
      ),
      "utf-8"
    );
    return queryEncodeWorkflowCtxResult(
      `场景素材处理完成（关键帧 ${imageOk}/${doc.shots.length}，视频 ${videoOk}/${doc.shots.length}，旁白 ${voiceOk}/${voiceTotal}）
` + notes.join("\n"),
      {
        sceneAssetsOk: sceneAssetPaths.length > 0 ? "1" : "0",
        sceneAssetPaths: JSON.stringify(sceneAssetPaths),
        sceneVideoPaths: JSON.stringify(sceneVideoPaths),
        sceneAudioPaths: JSON.stringify(audioPaths),
        sceneAssetsManifest: manifestPath
      }
    );
  }
};
const composeVideoTool = {
  name: "compose_video",
  description: "将场景视频片段/静图合成为成片。可传 scenePaths；缺省读取本会话 assets-manifest。支持多段旁白 concat。写入 context.videoPath。",
  permission: "sensitive",
  parameters: {
    type: "object",
    properties: {
      scenePaths: {
        type: "array",
        items: { type: "string" },
        description: "分镜素材绝对路径列表（优先 mp4）"
      },
      audioPath: { type: "string", description: "可选整片旁白音频" },
      title: { type: "string", description: "成片标题" },
      sceneDurationSec: { type: "number", description: "静图每镜时长秒，默认 3" }
    },
    required: []
  },
  async execute(args, ctx) {
    refreshActiveVideoProviders();
    let scenePaths = Array.isArray(args.scenePaths) ? args.scenePaths.map(String).filter(Boolean) : [];
    let audioPath = args.audioPath != null ? String(args.audioPath).trim() || void 0 : void 0;
    let audioPaths = [];
    const manifestPath = path.join(querySceneAssetsDir(ctx.sessionId), "assets-manifest.json");
    if (fs.existsSync(manifestPath)) {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
      if (!scenePaths.length) {
        scenePaths = manifest.sceneAssetPaths ?? manifest.sceneVideoPaths ?? [];
      }
      audioPaths = manifest.audioPaths ?? [];
      if (!audioPath && audioPaths.length === 1) {
        audioPath = audioPaths[0];
      }
    }
    if (!scenePaths.length) {
      return "缺少 scenePaths，且会话内无 assets-manifest。请先 generate_scene_assets。";
    }
    const compose = queryVideoComposeProvider();
    const result = await compose.compose({
      scenePaths,
      audioPath,
      audioPaths: audioPath ? void 0 : audioPaths,
      title: args.title != null ? String(args.title) : void 0,
      sceneDurationSec: args.sceneDurationSec != null ? Number(args.sceneDurationSec) : 3,
      outputPath: path.join(queryProjectDir(ctx.sessionId), `final-${Date.now()}.mp4`)
    });
    return queryEncodeWorkflowCtxResult(result.message, {
      videoOk: result.ok ? "1" : "0",
      videoPath: result.path ?? "",
      videoMessage: result.message
    });
  }
};
const notifyMessageTool = {
  name: "notify_message",
  description: "向通知渠道发送消息（飞书、通用 webhook 等）。可传 channelId（单渠道）或 channelIds（多渠道同时通知）；不要传 webhook。飞书可选 msgType：post（Markdown 富文本，含表格/标题会自动排版）、text（纯文本）、image（需 imageKey）、share_chat（需 shareChatId）。同一渠道+同一正文只需调用一次；工具返回成功后禁止再次调用。",
  permission: "safe",
  parameters: {
    type: "object",
    properties: {
      channelId: { type: "string", description: "单个通知渠道 id，如 feishu / webhook" },
      channelIds: {
        type: "array",
        items: { type: "string" },
        description: "多个通知渠道 id，同时推送"
      },
      title: { type: "string", description: "可选标题（text / post 有效）" },
      content: { type: "string", description: "正文（text / post 必填；image / share_chat 可留空）" },
      msgType: {
        type: "string",
        enum: ["text", "post", "image", "share_chat"],
        description: "飞书消息类型；缺省使用渠道配置或 text"
      },
      imageKey: {
        type: "string",
        description: "飞书图片消息 image_key；可覆盖渠道配置"
      },
      shareChatId: {
        type: "string",
        description: "飞书群名片 share_chat_id；可覆盖渠道配置"
      }
    }
  },
  async execute(args) {
    const content = String(args.content ?? "");
    const title = args.title != null ? String(args.title) : void 0;
    const msgType = args.msgType != null ? String(args.msgType).trim() : void 0;
    const imageKey = args.imageKey != null ? String(args.imageKey).trim() : void 0;
    const shareChatId = args.shareChatId != null ? String(args.shareChatId).trim() : void 0;
    const needsContent = !msgType || msgType === "text" || msgType === "post";
    if (needsContent && !content.trim()) return "缺少 content";
    const fromArray = Array.isArray(args.channelIds) ? args.channelIds.map(String).filter(Boolean) : [];
    const single = args.channelId != null ? String(args.channelId).trim() : "";
    const channelIds = fromArray.length > 0 ? fromArray : single ? [single] : [];
    if (channelIds.length === 0) {
      return "请提供 channelId 或 channelIds";
    }
    const sendArgs = { title, content, msgType, imageKey, shareChatId };
    if (channelIds.length === 1) {
      const result = await postNotifyMessage({
        channelId: channelIds[0],
        ...sendArgs
      });
      if (!result.ok) return `通知失败：${result.error}`;
      if (result.deduped) {
        return `已发送通知到 ${channelIds[0]}（相同内容短时去重，未重复推送）。任务已完成，请立即结束，不要再次调用本工具。`;
      }
      return `已发送通知到 ${channelIds[0]}。任务已完成，请立即结束，不要再次调用本工具。`;
    }
    const fanout = await postNotifyMessageFanout({ channelIds, ...sendArgs });
    const lines = fanout.results.map(
      (r) => r.ok ? `- ${r.channelId}: 成功${r.deduped ? "（去重）" : ""}` : `- ${r.channelId}: 失败（${r.error}）`
    );
    return `多渠道通知完成：成功 ${fanout.okCount} / 失败 ${fanout.failCount}
` + lines.join("\n") + "\n任务已完成，请立即结束，不要再次调用本工具。";
  }
};
const useSkillTool = {
  name: "use_skill",
  description: "读取一个已注入技能的完整操作说明。仅当用户任务与可用技能目录中的描述明确匹配时调用。",
  permission: "safe",
  parameters: {
    type: "object",
    properties: {
      skillId: {
        type: "string",
        description: "可用技能目录中的技能 id"
      }
    },
    required: ["skillId"]
  },
  async execute(args, ctx) {
    const skillId = String(args.skillId ?? "").trim();
    if (!skillId) return "请提供要使用的技能 id";
    const content = queryInjectableSkillContent(skillId, ctx.skillInjectCtx ?? {});
    return content ?? `技能「${skillId}」未注入或不存在（请在聊天框「学习技能」或角色设定中选用）`;
  }
};
const switchModelTool = {
  name: "switch_model",
  description: `当任务类型明显变化时切换模型能力（如从闲聊转为深度推理、文生图/图生成视频或看图理解）。可选 capability：${MODEL_CAPABILITIES.join("、")}。注意：creative 仅用于明确的文生图/图生成视频选型；vision 只用于理解用户附带的图片，不能生成图片；单步文生图也可用 generate_image。切换后继续当前任务，无需向用户解释底层模型名。`,
  permission: "safe",
  parameters: {
    type: "object",
    properties: {
      capability: {
        type: "string",
        enum: [...MODEL_CAPABILITIES],
        description: "目标模型能力标签"
      },
      reason: {
        type: "string",
        description: "简要说明为何切换（可选，仅用于日志）"
      }
    },
    required: ["capability"]
  },
  async execute(args, ctx) {
    const capability = queryNormalizeModelCapability(args.capability);
    if (!capability) {
      return `无效的 capability，请使用：${MODEL_CAPABILITIES.join("、")}`;
    }
    if (!ctx.postActiveCapability) {
      return "当前运行环境不支持切换模型";
    }
    ctx.postActiveCapability(capability);
    const settings = querySettings();
    const connection = queryResolveModelConnection(settings, {
      role: "general",
      capability
    });
    const reason = typeof args.reason === "string" && args.reason.trim() ? args.reason.trim() : "";
    return `已切换模型能力为 ${capability}（连接：${connection.label}，模型：${connection.model}）` + (reason ? `。原因：${reason}` : "") + "。后续推理将使用该连接。";
  }
};
const generateImageTool = {
  name: "generate_image",
  description: "用万相文生图（AI 原创）按文字描述生成图片并保存到本地。用户要求「生成/画一张图」且不要网图时必须调用本工具；禁止用 fetch_web_images 代替；禁止在未调用本工具成功前声称已生成图片。成功时回复中务必包含工具返回的本地 png 绝对路径，便于界面预览。",
  permission: "safe",
  parameters: {
    type: "object",
    properties: {
      prompt: {
        type: "string",
        description: "画面描述（主体、场景、风格、光影等），建议中文或中英混合，尽量具体"
      },
      fileName: {
        type: "string",
        description: "可选输出文件名（不含目录），默认按时间戳生成 .png"
      }
    },
    required: ["prompt"]
  },
  async execute(args, ctx) {
    const prompt = String(args.prompt ?? "").trim();
    if (!prompt) {
      return "prompt 不能为空，请描述要生成的画面内容";
    }
    const rawName = String(args.fileName ?? "").trim();
    const safeName = rawName ? rawName.replace(/[^\w.\u4e00-\u9fff-]+/g, "_").replace(/\.+$/, "") : `gen-${Date.now()}`;
    const fileName = safeName.toLowerCase().endsWith(".png") ? safeName : `${safeName}.png`;
    const outputPath = path.join(querySceneAssetsDir(ctx.sessionId), fileName);
    const t2i = queryTextToImageProvider();
    const result = await t2i.generate({ prompt: prompt.slice(0, 500), outputPath });
    if (!result.ok || !result.path) {
      return `文生图失败：${result.message}。请检查设置中是否已配置有效的阿里云百炼 API Key（媒体生成连接）。不要向用户声称图片已生成。`;
    }
    return `文生图成功。
图片路径：${result.path}
${queryFormatMarkdownImage("生成图片", result.path)}
说明：${result.message}
请在回复中保留上述本地路径或 markdown 图片，以便聊天界面内联预览；不要声称这是网图。`;
  }
};
const requireFromMain$1 = module$1.createRequire(__filename);
const REMOTION_SFX_CONFIG_MARKER = "LINGXI_REMOTION_SFX_WEBPACK";
const REMOTION_SFX_MARKER_FILE = ".remotion-sfx-enabled";
function queryRemotionSfxModulePath() {
  return requireFromMain$1.resolve("@remotion/sfx/dist/esm/index.mjs");
}
function queryIsRemotionSfxEnabled(projectDir) {
  return fs.existsSync(path.join(projectDir, REMOTION_SFX_MARKER_FILE));
}
function postEnableRemotionSfx(sessionId) {
  const projectDir = queryRemotionProjectDir(sessionId);
  const entryPoint = path.join(projectDir, "src", "index.ts");
  if (!fs.existsSync(entryPoint)) {
    throw new Error(`找不到 Remotion 入口 ${entryPoint}，请先调用 remotion_init_project`);
  }
  const sfxModulePath = queryRemotionSfxModulePath();
  const markerPath = path.join(projectDir, REMOTION_SFX_MARKER_FILE);
  const alreadyEnabled = queryIsRemotionSfxEnabled(projectDir);
  fs.writeFileSync(markerPath, sfxModulePath, "utf-8");
  postPatchRemotionConfigForSfx(projectDir, sfxModulePath);
  return { projectDir, alreadyEnabled, sfxModulePath };
}
function queryRemotionSfxWebpackOverride(projectDir) {
  const markerPath = path.join(projectDir, REMOTION_SFX_MARKER_FILE);
  if (!fs.existsSync(markerPath)) return void 0;
  const sfxEsmPath = fs.readFileSync(markerPath, "utf-8").trim();
  if (!sfxEsmPath) return void 0;
  return (currentConfig) => ({
    ...currentConfig,
    resolve: {
      ...currentConfig.resolve,
      alias: {
        ...typeof currentConfig.resolve?.alias === "object" && currentConfig.resolve.alias !== null ? currentConfig.resolve.alias : {},
        "@remotion/sfx": sfxEsmPath
      }
    }
  });
}
function postPatchRemotionConfigForSfx(projectDir, sfxEsmPath) {
  const configPath = path.join(projectDir, "remotion.config.ts");
  const escapedPath = sfxEsmPath.replace(/\\/g, "/");
  const source = `import { Config } from '@remotion/cli/config'

/** 渲染输出覆盖同名文件，避免 Agent 重复渲染失败 */
Config.setOverwriteOutput(true)
Config.setVideoImageFormat('jpeg')

// ${REMOTION_SFX_CONFIG_MARKER} — 按需启用 @remotion/sfx（灵犀应用内官方音效库）
Config.overrideWebpackConfig((currentConfig) => ({
  ...currentConfig,
  resolve: {
    ...currentConfig.resolve,
    alias: {
      ...(currentConfig.resolve?.alias ?? {}),
      '@remotion/sfx': '${escapedPath}',
    },
  },
}))
`;
  fs.writeFileSync(configPath, source, "utf-8");
}
const COMPOSITION_BLOCK_RE = /<Composition\b[\s\S]*?\/>/g;
function queryEscapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function queryPatchCompositionMeta(block, config) {
  return block.replace(
    /durationInFrames=\{[^}]+\}/,
    `durationInFrames={${config.durationInFrames}}`
  ).replace(/fps=\{[^}]+\}/, `fps={${config.fps}}`).replace(/width=\{[^}]+\}/, `width={${config.width}}`).replace(/height=\{[^}]+\}/, `height={${config.height}}`);
}
function queryPatchRootCompositionSource(rootSource, config) {
  const blocks = [...rootSource.matchAll(COMPOSITION_BLOCK_RE)];
  if (blocks.length === 0) return rootSource;
  const idRe = new RegExp(`id=["']${queryEscapeRegExp(config.compositionId)}["']`);
  const targetIdx = blocks.findIndex((m) => idRe.test(m[0]));
  const applyAt = (index2, nextBlock) => {
    const match = blocks[index2];
    const start = match.index ?? 0;
    return rootSource.slice(0, start) + nextBlock + rootSource.slice(start + match[0].length);
  };
  if (targetIdx >= 0) {
    const patched = queryPatchCompositionMeta(blocks[targetIdx][0], config);
    return applyAt(targetIdx, patched);
  }
  let first = blocks[0][0];
  if (/id=["'][^"']*["']/.test(first)) {
    first = first.replace(/id=["'][^"']*["']/, `id="${config.compositionId}"`);
  } else {
    first = first.replace(
      /<Composition\b/,
      `<Composition
        id="${config.compositionId}"`
    );
  }
  first = queryPatchCompositionMeta(first, config);
  return applyAt(0, first);
}
const requireFromMain = module$1.createRequire(__filename);
const QUALITY_PRESETS = {
  /** 快速预览：体积小，速度快，画质一般 */
  fast: { crf: 28, concurrency: 2 },
  /** 标准平衡：默认选项，速度与画质兼顾 */
  standard: { crf: 23, concurrency: 4 },
  /** 高质量：画质好，体积大，渲染慢 */
  high: { crf: 18, concurrency: 6 }
};
const studioBySession = /* @__PURE__ */ new Map();
const renderBySession = /* @__PURE__ */ new Map();
function queryExportHistoryPath() {
  const dir = path.join(getVideosDir(), "remotion");
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, "exports-history.json");
}
function queryLoadExportHistory() {
  const path2 = queryExportHistoryPath();
  if (!fs.existsSync(path2)) return [];
  try {
    const raw = JSON.parse(fs.readFileSync(path2, "utf-8"));
    if (!Array.isArray(raw)) return [];
    return raw.filter(
      (item) => Boolean(item) && typeof item === "object" && typeof item.id === "string" && typeof item.outputPath === "string"
    );
  } catch {
    return [];
  }
}
function postSaveExportHistory(records) {
  const sorted = [...records].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 200);
  fs.writeFileSync(queryExportHistoryPath(), JSON.stringify(sorted, null, 2), "utf-8");
}
function postUpsertExportRecord(next, history2 = queryLoadExportHistory()) {
  const idx = history2.findIndex((item) => item.id === next.id);
  if (idx >= 0) {
    history2[idx] = { ...history2[idx], ...next };
  } else {
    history2.push(next);
  }
  postSaveExportHistory(history2);
  return history2;
}
function queryExportRecordId(sessionId, outputPath) {
  return `${sessionId}:${path.basename(outputPath)}`;
}
function postSyncSessionExportingRecords(sessionId, patch) {
  const history2 = queryLoadExportHistory();
  let changed = false;
  const now = Date.now();
  for (let i = 0; i < history2.length; i++) {
    const item = history2[i];
    if (item.sessionId !== sessionId || item.status !== "exporting") continue;
    const next = {
      ...item,
      updatedAt: now,
      progressPercent: (() => {
        if (patch.progressPercent == null) return item.progressPercent;
        return Math.max(patch.progressPercent, item.progressPercent ?? 0);
      })(),
      compositionId: patch.compositionId ?? item.compositionId,
      errorMessage: patch.errorMessage ?? item.errorMessage,
      size: patch.size ?? item.size
    };
    if (patch.outputPath) {
      next.outputPath = patch.outputPath;
      next.fileName = path.basename(patch.outputPath);
    }
    if (patch.status) {
      next.status = patch.status;
      if (patch.status === "success") next.progressPercent = 100;
    }
    history2[i] = next;
    changed = true;
  }
  if (changed) postSaveExportHistory(history2);
}
let lastExportProgressWriteAt = 0;
function postThrottleSyncExportProgress(sessionId, progress, compositionId, outputPath) {
  const now = Date.now();
  if (now - lastExportProgressWriteAt < 800 && progress.percent < 100) return;
  lastExportProgressWriteAt = now;
  postSyncSessionExportingRecords(sessionId, {
    progressPercent: progress.percent,
    compositionId,
    outputPath
  });
}
function queryLatestSessionMp4(sessionId) {
  const outDir = path.join(queryRemotionProjectDir(sessionId), "out");
  if (!fs.existsSync(outDir)) return null;
  let files;
  try {
    files = fs.readdirSync(outDir);
  } catch {
    return null;
  }
  let best = null;
  for (const name of files) {
    if (!name.toLowerCase().endsWith(".mp4")) continue;
    const full = path.join(outDir, name);
    try {
      const st = fs.statSync(full);
      if (!st.isFile() || st.size <= 0) continue;
      if (!best || st.mtimeMs > best.mtime) {
        best = { path: full, size: st.size, mtime: st.mtimeMs };
      }
    } catch {
    }
  }
  return best;
}
function postReconcileExportingRecords(history2) {
  let changed = false;
  const now = Date.now();
  const next = history2.map((record) => {
    if (record.status !== "exporting") return record;
    if (renderBySession.has(record.sessionId)) return record;
    if (fs.existsSync(record.outputPath)) {
      try {
        const st = fs.statSync(record.outputPath);
        if (st.isFile() && st.size > 0) {
          changed = true;
          return {
            ...record,
            status: "success",
            progressPercent: 100,
            size: st.size,
            updatedAt: now
          };
        }
      } catch {
      }
    }
    const latest = queryLatestSessionMp4(record.sessionId);
    if (latest) {
      changed = true;
      return {
        ...record,
        status: "success",
        outputPath: latest.path,
        fileName: path.basename(latest.path),
        progressPercent: 100,
        size: latest.size,
        updatedAt: now
      };
    }
    const session = querySession(record.sessionId);
    if (!session) return record;
    const tasks = session.tasks ?? [];
    const busy = tasks.some((t) => t.status === "running" || t.status === "pending");
    const sessionFresh = now - session.updatedAt < 2e4;
    const messages2 = session.messages ?? [];
    const lastAssistant = [...messages2].reverse().find((m) => m.role === "assistant");
    const awaitingRender = Boolean(
      lastAssistant?.awaitMeta?.choices?.some((c) => c.id === "render")
    );
    if (busy || sessionFresh || awaitingRender) {
      const prep = awaitingRender ? Math.max(record.progressPercent ?? 0, 18) : Math.max(record.progressPercent ?? 0, busy ? 12 : 6);
      if (prep !== (record.progressPercent ?? 0)) {
        changed = true;
        return { ...record, progressPercent: prep, updatedAt: now };
      }
      return record;
    }
    const idleMs = now - Math.max(record.updatedAt, session.updatedAt);
    if (idleMs > 12e4 && messages2.length > 0) {
      const last = messages2[messages2.length - 1];
      const errMsg = last.role === "assistant" && last.content ? last.content.slice(0, 400) : "导出未完成（会话已结束且未生成成片）";
      changed = true;
      return {
        ...record,
        status: "failed",
        errorMessage: errMsg,
        updatedAt: now
      };
    }
    return record;
  });
  if (changed) postSaveExportHistory(next);
  return changed ? queryLoadExportHistory() : history2;
}
function queryDiskRemotionMp4Records(existingIds) {
  const remotionRoot = path.join(getVideosDir(), "remotion");
  if (!fs.existsSync(remotionRoot)) return [];
  const discovered = [];
  let sessionDirs;
  try {
    sessionDirs = fs.readdirSync(remotionRoot);
  } catch {
    return [];
  }
  for (const sessionId of sessionDirs) {
    if (sessionId === "exports-history.json") continue;
    const outDir = path.join(remotionRoot, sessionId, "out");
    if (!fs.existsSync(outDir)) continue;
    let files;
    try {
      files = fs.readdirSync(outDir);
    } catch {
      continue;
    }
    for (const name of files) {
      if (!name.toLowerCase().endsWith(".mp4")) continue;
      const outputPath = path.join(outDir, name);
      const id = queryExportRecordId(sessionId, outputPath);
      if (existingIds.has(id)) continue;
      let st;
      try {
        st = fs.statSync(outputPath);
      } catch {
        continue;
      }
      if (!st.isFile()) continue;
      const mtime = st.mtimeMs;
      discovered.push({
        id,
        sessionId,
        compositionId: "Main",
        outputPath,
        fileName: name,
        status: "success",
        createdAt: mtime,
        updatedAt: mtime,
        size: st.size
      });
    }
  }
  return discovered;
}
function queryRemotionExports() {
  let history2 = postReconcileExportingRecords(queryLoadExportHistory());
  const byId = new Map(history2.map((item) => [item.id, item]));
  for (const job of Array.from(renderBySession.values())) {
    const percent = job.lastProgress?.percent ?? 0;
    const exactId = queryExportRecordId(job.sessionId, job.outputPath);
    const prevExact = byId.get(exactId);
    byId.set(exactId, {
      id: exactId,
      sessionId: job.sessionId,
      compositionId: job.compositionId,
      outputPath: job.outputPath,
      fileName: path.basename(job.outputPath),
      status: "exporting",
      createdAt: prevExact?.createdAt ?? Date.now(),
      updatedAt: Date.now(),
      title: prevExact?.title,
      progressPercent: percent || prevExact?.progressPercent || 0
    });
    for (const record of Array.from(byId.values())) {
      if (record.sessionId !== job.sessionId || record.status !== "exporting") continue;
      if (record.id === exactId) continue;
      byId.set(record.id, {
        ...record,
        compositionId: job.compositionId,
        // 展示实际渲染路径，便于打开目录 / 完成后查看
        outputPath: job.outputPath,
        fileName: path.basename(job.outputPath),
        progressPercent: percent || record.progressPercent || 0,
        updatedAt: Date.now()
      });
    }
  }
  for (const disk of queryDiskRemotionMp4Records(new Set(Array.from(byId.keys())))) {
    byId.set(disk.id, disk);
  }
  for (const record of Array.from(byId.values())) {
    if (record.status !== "success") continue;
    if (!fs.existsSync(record.outputPath)) continue;
    try {
      const st = fs.statSync(record.outputPath);
      if (st.isFile()) {
        record.size = st.size;
      }
    } catch {
    }
  }
  return Array.from(byId.values()).sort((a, b) => b.updatedAt - a.updatedAt);
}
function postEnqueueRemotionExport(input) {
  const fileName = String(input.fileName ?? "").trim() || `remotion-${Date.now()}.mp4`;
  const safeName = fileName.toLowerCase().endsWith(".mp4") ? fileName : `${fileName}.mp4`;
  const sessionId = String(input.sessionId ?? "").trim();
  if (!sessionId) {
    throw new Error("sessionId 不能为空");
  }
  const compositionId = String(input.compositionId ?? "Main").trim() || "Main";
  const outputPath = path.join(queryRemotionProjectDir(sessionId), "out", safeName);
  const now = Date.now();
  const id = queryExportRecordId(sessionId, outputPath);
  const history2 = queryLoadExportHistory();
  const prev = history2.find((item) => item.id === id);
  const record = {
    id,
    sessionId,
    compositionId,
    outputPath,
    fileName: safeName,
    status: "exporting",
    createdAt: prev?.createdAt ?? now,
    updatedAt: now,
    title: input.title?.trim() || prev?.title,
    progressPercent: 0
  };
  postUpsertExportRecord(record, history2);
  return record;
}
function postUpdateRemotionExport(input) {
  const id = String(input.id ?? "").trim();
  if (!id) return null;
  const history2 = queryLoadExportHistory();
  const prev = history2.find((item) => item.id === id);
  if (!prev) return null;
  const outputPath = input.outputPath?.trim() || prev.outputPath;
  let size = input.size;
  if (input.status === "success" && size == null && fs.existsSync(outputPath)) {
    try {
      size = fs.statSync(outputPath).size;
    } catch {
    }
  }
  const next = {
    ...prev,
    status: input.status,
    outputPath,
    fileName: path.basename(outputPath),
    updatedAt: Date.now(),
    // 导出中不允许进度回退，避免准备阶段心跳覆盖真实渲染进度
    progressPercent: (() => {
      if (input.status === "success") return 100;
      const incoming = input.progressPercent;
      if (incoming == null) return prev.progressPercent;
      if (input.status === "exporting") {
        return Math.max(incoming, prev.progressPercent ?? 0);
      }
      return incoming;
    })(),
    errorMessage: input.status === "failed" ? input.errorMessage?.slice(0, 400) : void 0,
    size: input.status === "success" ? size : prev.size
  };
  postUpsertExportRecord(next, history2);
  return next;
}
function queryIsChildAlive(child) {
  return Boolean(child.pid) && !child.killed && child.exitCode == null;
}
function queryRemotionProjectDir(sessionId) {
  const dir = path.join(getVideosDir(), "remotion", sessionId);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}
function postInitRemotionProject(sessionId, config = {}) {
  const projectDir = queryRemotionProjectDir(sessionId);
  const marker = path.join(projectDir, ".remotion-initialized");
  const compositionId = String(config.compositionId ?? "Main").trim() || "Main";
  const width = config.width ?? 1920;
  const height = config.height ?? 1080;
  const fps = config.fps ?? 30;
  const durationInFrames = config.durationInFrames ?? 150;
  let created = false;
  if (!fs.existsSync(marker)) {
    const starterDir = path.join(queryBundledResourcesRoot(), "remotion", "starter");
    if (!fs.existsSync(path.join(starterDir, "src", "index.ts"))) {
      throw new Error(`内置 Remotion 模板缺失：${starterDir}`);
    }
    fs.cpSync(starterDir, projectDir, { recursive: true });
    fs.writeFileSync(marker, (/* @__PURE__ */ new Date()).toISOString(), "utf-8");
    created = true;
  }
  postPatchRootComposition(projectDir, {
    compositionId,
    width,
    height,
    fps,
    durationInFrames
  });
  return {
    projectDir,
    created,
    compositionId,
    entryPoint: path.join(projectDir, "src", "index.ts")
  };
}
function postPatchRootComposition(projectDir, config) {
  const rootPath = path.join(projectDir, "src", "Root.tsx");
  if (!fs.existsSync(rootPath)) return;
  const rootSource = fs.readFileSync(rootPath, "utf-8");
  const next = queryPatchRootCompositionSource(rootSource, config);
  if (next !== rootSource) {
    fs.writeFileSync(rootPath, next, "utf-8");
  }
}
function createRemotionProgressReporter(onProgress) {
  let lastPercent = -1;
  let lastPhase = "";
  return (input) => {
    if (!onProgress) return;
    if (input.phase === lastPhase && input.percent === lastPercent) return;
    lastPhase = input.phase;
    lastPercent = input.percent;
    onProgress(input);
  };
}
function queryBundleOverallPercent(bundlePercent) {
  return 10 + Math.round(Math.max(0, Math.min(100, bundlePercent)) * 0.2);
}
function queryRenderOverallPercent(renderRatio) {
  return 30 + Math.round(Math.max(0, Math.min(1, renderRatio)) * 70);
}
function queryRemotionCliPath() {
  try {
    return requireFromMain.resolve("@remotion/cli/remotion-cli.js");
  } catch {
    const candidates = [
      path.join(electron.app.getAppPath(), "node_modules", "@remotion", "cli", "remotion-cli.js"),
      path.join(__dirname, "../../../node_modules/@remotion/cli/remotion-cli.js")
    ];
    const found = candidates.find((p) => fs.existsSync(p));
    if (found) return found;
    throw new Error("找不到 @remotion/cli，请确认已安装 remotion 依赖");
  }
}
function queryStudioUrlFromOutput(chunk) {
  const httpMatch = chunk.match(/https?:\/\/(?:localhost|127\.0\.0\.1):\d+\b/);
  if (httpMatch) return httpMatch[0];
  const portMatch = chunk.match(/(?:Already running on port|Server ready.*?port)\s+(\d+)/i);
  if (portMatch) return `http://localhost:${portMatch[1]}`;
  return null;
}
async function postStartRemotionStudio(input) {
  const entryPoint = path.join(input.projectDir, "src", "index.ts");
  if (!fs.existsSync(entryPoint)) {
    return {
      ok: false,
      message: `找不到入口 ${entryPoint}，请先调用 remotion_init_project`
    };
  }
  const existing = studioBySession.get(input.sessionId);
  if (existing && queryIsChildAlive(existing.process)) {
    if (existing.projectDir === input.projectDir) {
      if (input.openBrowser !== false) {
        await electron.shell.openExternal(existing.url);
      }
      return {
        ok: true,
        reused: true,
        url: existing.url,
        message: `Remotion Studio 已在运行：${existing.url}`
      };
    }
    try {
      existing.process.kill();
    } catch {
    }
    studioBySession.delete(input.sessionId);
  } else if (existing) {
    studioBySession.delete(input.sessionId);
  }
  let cliPath;
  try {
    cliPath = queryRemotionCliPath();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, message: msg };
  }
  const appRoot = electron.app.getAppPath();
  const nodePathParts = [
    path.join(appRoot, "node_modules"),
    process.env.NODE_PATH
  ].filter(Boolean);
  return new Promise((resolve) => {
    let settled = false;
    let outputBuf = "";
    const child = child_process.spawn(
      process.execPath,
      [cliPath, "studio", entryPoint, "--no-open"],
      {
        cwd: input.projectDir,
        env: {
          ...process.env,
          ELECTRON_RUN_AS_NODE: "1",
          NODE_PATH: nodePathParts.join(process.platform === "win32" ? ";" : ":")
        },
        stdio: ["ignore", "pipe", "pipe"]
      }
    );
    const finish = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(result);
    };
    const timer = setTimeout(() => {
      if (!settled) {
        child.kill();
        finish({
          ok: false,
          message: "启动 Remotion Studio 超时（60s）。请检查工程代码是否有语法错误。"
        });
      }
    }, 6e4);
    const onChunk = async (buf) => {
      const text = buf.toString("utf-8");
      outputBuf += text;
      const url2 = queryStudioUrlFromOutput(text) ?? queryStudioUrlFromOutput(outputBuf);
      if (!url2 || settled) return;
      studioBySession.set(input.sessionId, {
        process: child,
        url: url2,
        projectDir: input.projectDir
      });
      if (input.openBrowser !== false) {
        try {
          await electron.shell.openExternal(url2);
        } catch {
        }
      }
      finish({
        ok: true,
        reused: false,
        url: url2,
        message: `Remotion Studio 已启动：${url2}`
      });
    };
    child.stdout?.on("data", (buf) => {
      void onChunk(buf);
    });
    child.stderr?.on("data", (buf) => {
      void onChunk(buf);
    });
    child.on("error", (err) => {
      studioBySession.delete(input.sessionId);
      finish({
        ok: false,
        message: `启动 Remotion Studio 失败：${err.message}`
      });
    });
    child.on("exit", (code) => {
      studioBySession.delete(input.sessionId);
      if (!settled) {
        finish({
          ok: false,
          message: `Remotion Studio 进程退出（code=${code}）。输出：${outputBuf.slice(-800) || "无"}`
        });
      }
    });
    input.signal?.addEventListener("abort", () => {
      child.kill();
      finish({ ok: false, message: "Studio 启动已取消" });
    });
  });
}
function queryRemotionStudioAlive(sessionId) {
  const id = String(sessionId ?? "").trim();
  if (!id) return { alive: false };
  const existing = studioBySession.get(id);
  if (!existing || !queryIsChildAlive(existing.process)) {
    if (existing) studioBySession.delete(id);
    return { alive: false };
  }
  return { alive: true, url: existing.url, projectDir: existing.projectDir };
}
async function postRenderRemotionStudioExport(input) {
  const sessionId = String(input.sessionId ?? "").trim();
  if (!sessionId) {
    return { ok: false, message: "sessionId 不能为空" };
  }
  const studio = queryRemotionStudioAlive(sessionId);
  const projectDir = String(input.projectDir ?? "").trim() || studio.projectDir || queryRemotionProjectDir(sessionId);
  if (!fs.existsSync(path.join(projectDir, "src", "index.ts"))) {
    return {
      ok: false,
      message: "未找到已拼装的 Remotion 工程，请先「生成并预览」或「预览模版」启动 Studio"
    };
  }
  if (!studio.alive) {
    return {
      ok: false,
      message: "Studio 未在运行。请先预览启动 Studio，再导出当前画面"
    };
  }
  const compositionId = String(input.compositionId ?? "Main").trim() || "Main";
  const rawName = String(input.outputFileName ?? "").trim();
  const safeName = rawName ? rawName.replace(/[^\w.\u4e00-\u9fff-]+/g, "_").replace(/\.+$/, "") : `studio-export-${Date.now()}`;
  const fileName = safeName.toLowerCase().endsWith(".mp4") ? safeName : `${safeName}.mp4`;
  const outputPath = path.join(projectDir, "out", fileName);
  const record = postEnqueueRemotionExport({
    sessionId,
    compositionId,
    fileName,
    title: input.title
  });
  const result = await postRenderRemotionVideo({
    sessionId,
    projectDir,
    compositionId,
    outputPath,
    quality: input.quality ?? "standard"
  });
  if (!result.ok || !result.path) {
    postUpdateRemotionExport({
      id: record.id,
      status: "failed",
      errorMessage: result.message.slice(0, 400)
    });
    return {
      ok: false,
      message: result.message,
      record: { ...record, status: "failed", errorMessage: result.message.slice(0, 400) }
    };
  }
  postStopRemotionStudios(sessionId);
  const updated = postUpdateRemotionExport({
    id: record.id,
    status: "success",
    outputPath: result.path,
    progressPercent: 100
  });
  return {
    ok: true,
    message: `已从 Studio 工程导出：${result.path}`,
    path: result.path,
    record: updated ?? {
      ...record,
      status: "success",
      outputPath: result.path,
      progressPercent: 100
    }
  };
}
function postStopRemotionStudios(sessionId) {
  const entries = sessionId ? [[sessionId, studioBySession.get(sessionId)]].filter(
    (row) => Boolean(row[1])
  ) : [...studioBySession.entries()];
  for (const [id, entry] of entries) {
    try {
      entry.process.kill();
    } catch {
    }
    studioBySession.delete(id);
  }
}
function postCancelRemotionRenderSession(sessionId) {
  const job = renderBySession.get(sessionId);
  if (!job) return;
  try {
    job.abortController.abort();
    const now = Date.now();
    const id = queryExportRecordId(sessionId, job.outputPath);
    const history2 = queryLoadExportHistory();
    const prev = history2.find((item) => item.id === id);
    postUpsertExportRecord(
      {
        id,
        sessionId,
        compositionId: job.compositionId,
        outputPath: job.outputPath,
        fileName: path.basename(job.outputPath),
        status: "failed",
        createdAt: prev?.createdAt ?? now,
        updatedAt: now,
        errorMessage: "用户取消导出",
        progressPercent: job.lastProgress?.percent
      },
      history2
    );
  } finally {
    if (renderBySession.get(sessionId) === job) {
      renderBySession.delete(sessionId);
    }
  }
}
async function postRenderRemotionVideo(input) {
  const existing = renderBySession.get(input.sessionId);
  if (existing) {
    if (input.onProgress) {
      existing.progressListeners.add(input.onProgress);
      if (existing.lastProgress) {
        input.onProgress(existing.lastProgress);
      }
    }
    const result = await existing.promise;
    if (input.onProgress) {
      existing.progressListeners.delete(input.onProgress);
    }
    return {
      ...result,
      reused: true,
      message: result.ok ? `复用同会话进行中的渲染：${result.path ?? existing.outputPath}` : result.message
    };
  }
  const entryPoint = path.join(input.projectDir, "src", "index.ts");
  if (!fs.existsSync(entryPoint)) {
    return {
      ok: false,
      message: `找不到入口 ${entryPoint}，请先调用 remotion_init_project`
    };
  }
  fs.mkdirSync(path.dirname(input.outputPath), { recursive: true });
  const progressListeners = /* @__PURE__ */ new Set();
  if (input.onProgress) {
    progressListeners.add(input.onProgress);
  }
  const jobAbort = new AbortController();
  if (input.signal?.aborted) {
    jobAbort.abort();
  } else if (input.signal) {
    input.signal.addEventListener("abort", () => jobAbort.abort(), { once: true });
  }
  const renderSignal = jobAbort.signal;
  const job = {
    sessionId: input.sessionId,
    compositionId: input.compositionId,
    outputPath: input.outputPath,
    progressListeners,
    abortController: jobAbort,
    promise: Promise.resolve({ ok: false, message: "渲染未启动" })
  };
  const exportId = queryExportRecordId(input.sessionId, input.outputPath);
  const exportStartedAt = Date.now();
  const existingHistory = queryLoadExportHistory();
  const existingSameSession = existingHistory.find(
    (item) => item.sessionId === input.sessionId && item.status === "exporting"
  );
  postUpsertExportRecord({
    id: existingSameSession?.id ?? exportId,
    sessionId: input.sessionId,
    compositionId: input.compositionId,
    outputPath: input.outputPath,
    fileName: path.basename(input.outputPath),
    status: "exporting",
    createdAt: existingSameSession?.createdAt ?? exportStartedAt,
    updatedAt: exportStartedAt,
    title: existingSameSession?.title,
    progressPercent: 0
  });
  postSyncSessionExportingRecords(input.sessionId, {
    progressPercent: 0,
    compositionId: input.compositionId,
    outputPath: input.outputPath
  });
  const broadcastProgress = (progress) => {
    job.lastProgress = progress;
    postThrottleSyncExportProgress(
      input.sessionId,
      progress,
      input.compositionId,
      input.outputPath
    );
    for (const listener of Array.from(job.progressListeners)) {
      try {
        listener(progress);
      } catch {
      }
    }
  };
  const report = createRemotionProgressReporter(broadcastProgress);
  job.promise = (async () => {
    const qualityPreset = input.quality ?? "standard";
    const preset = QUALITY_PRESETS[qualityPreset];
    const crf = input.crf ?? preset.crf;
    const concurrency = input.concurrency ?? preset.concurrency;
    const postFinalizeExportRecord = (result) => {
      const now = Date.now();
      if (result.ok && result.path) {
        let size;
        try {
          if (fs.existsSync(result.path)) {
            size = fs.statSync(result.path).size;
          }
        } catch {
        }
        postUpsertExportRecord({
          id: existingSameSession?.id ?? exportId,
          sessionId: input.sessionId,
          compositionId: input.compositionId,
          outputPath: result.path,
          fileName: path.basename(result.path),
          status: "success",
          createdAt: existingSameSession?.createdAt ?? exportStartedAt,
          updatedAt: now,
          title: existingSameSession?.title,
          progressPercent: 100,
          size
        });
        postSyncSessionExportingRecords(input.sessionId, {
          status: "success",
          outputPath: result.path,
          progressPercent: 100,
          size,
          compositionId: input.compositionId
        });
        return;
      }
      postUpsertExportRecord({
        id: existingSameSession?.id ?? exportId,
        sessionId: input.sessionId,
        compositionId: input.compositionId,
        outputPath: input.outputPath,
        fileName: path.basename(input.outputPath),
        status: "failed",
        createdAt: existingSameSession?.createdAt ?? exportStartedAt,
        updatedAt: now,
        title: existingSameSession?.title,
        errorMessage: result.message.slice(0, 400),
        progressPercent: job.lastProgress?.percent
      });
      postSyncSessionExportingRecords(input.sessionId, {
        status: "failed",
        errorMessage: result.message.slice(0, 400),
        progressPercent: job.lastProgress?.percent,
        compositionId: input.compositionId
      });
    };
    try {
      report({ phase: "browser", percent: 0, message: "准备浏览器（首次可能下载）…" });
      console.log(`[remotion] 准备浏览器（画质=${qualityPreset}, crf=${crf}）…`);
      const { ensureBrowser } = await import("@remotion/renderer");
      await ensureBrowser({
        logLevel: "info",
        onBrowserDownload: () => ({
          version: null,
          onProgress: ({ percent }) => {
            if (renderSignal.aborted) {
              throw new Error("渲染已取消");
            }
            const pct = Math.round(percent * 100);
            report({
              phase: "browser",
              percent: Math.round(pct * 0.1),
              message: `下载浏览器 ${pct}%`
            });
          }
        })
      });
      report({ phase: "bundle", percent: 10, message: "打包 Composition…" });
      console.log("[remotion] 打包 Composition…");
      const { bundle } = await import("@remotion/bundler");
      const { renderMedia, selectComposition } = await import("@remotion/renderer");
      let bundleLocation;
      try {
        const sfxWebpackOverride = queryRemotionSfxWebpackOverride(input.projectDir);
        bundleLocation = await bundle({
          entryPoint,
          rootDir: input.projectDir,
          ...sfxWebpackOverride ? { webpackOverride: sfxWebpackOverride } : {},
          onProgress: ({ progress }) => {
            if (renderSignal.aborted) {
              throw new Error("渲染已取消");
            }
            const overall = queryBundleOverallPercent(progress);
            report({
              phase: "bundle",
              percent: overall,
              message: `打包 Composition ${progress}%`
            });
            if (progress % 25 === 0) {
              console.log(`[remotion] 打包进度 ${progress}%`);
            }
          }
        });
      } catch (bundleErr) {
        const msg = bundleErr instanceof Error ? bundleErr.message : String(bundleErr);
        const result = {
          ok: false,
          errorType: "bundle",
          message: `打包失败（代码语法错误或依赖缺失）：${msg}
请检查：
1. Composition.tsx / Root.tsx 是否有 TypeScript 语法错误
2. import 的文件路径是否正确
3. 是否引用了不存在的依赖包`
        };
        postFinalizeExportRecord(result);
        return result;
      }
      report({ phase: "render", percent: 30, message: "开始渲染视频…" });
      console.log("[remotion] 选择 Composition 并渲染…");
      let composition;
      try {
        composition = await selectComposition({
          serveUrl: bundleLocation,
          id: input.compositionId,
          inputProps: {}
        });
      } catch (compErr) {
        const msg = compErr instanceof Error ? compErr.message : String(compErr);
        const result = {
          ok: false,
          errorType: "composition",
          message: `找不到 Composition「${input.compositionId}」：${msg}
请确认 Root.tsx 中 <Composition id="..."> 与渲染参数 compositionId 拼写完全一致。`
        };
        postFinalizeExportRecord(result);
        return result;
      }
      try {
        await renderMedia({
          composition,
          serveUrl: bundleLocation,
          codec: "h264",
          crf,
          concurrency,
          outputLocation: input.outputPath,
          onProgress: ({ progress }) => {
            if (renderSignal.aborted) {
              throw new Error("渲染已取消");
            }
            const pct = Math.round(progress * 100);
            const overall = queryRenderOverallPercent(progress);
            report({
              phase: "render",
              percent: overall,
              message: `渲染视频 ${pct}%`
            });
            if (pct % 10 === 0) {
              console.log(`[remotion] 渲染进度 ${pct}%`);
            }
          }
        });
      } catch (renderErr) {
        const msg = renderErr instanceof Error ? renderErr.message : String(renderErr);
        const result = {
          ok: false,
          errorType: "render",
          message: `渲染失败：${msg}
常见原因：
1. 组件运行时错误（某帧计算异常）
2. 引用的图片/音频素材不存在
3. public/ 目录中的资源路径错误
建议先用 remotion_studio 预览定位问题帧`
        };
        postFinalizeExportRecord(result);
        return result;
      }
      report({ phase: "render", percent: 100, message: "渲染完成" });
      const success = {
        ok: true,
        message: `Remotion 渲染成功（${qualityPreset} 画质）：${input.outputPath}`,
        path: input.outputPath
      };
      postFinalizeExportRecord(success);
      return success;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const result = {
        ok: false,
        errorType: "unknown",
        message: `Remotion 渲染失败：${msg}。请检查 Composition 代码是否有语法错误，compositionId 是否与 Root.tsx 中 id 一致。`
      };
      postFinalizeExportRecord(result);
      return result;
    } finally {
      if (renderBySession.get(input.sessionId) === job) {
        renderBySession.delete(input.sessionId);
      }
    }
  })();
  renderBySession.set(input.sessionId, job);
  return job.promise;
}
const remotionService = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  postCancelRemotionRenderSession,
  postEnqueueRemotionExport,
  postInitRemotionProject,
  postRenderRemotionStudioExport,
  postRenderRemotionVideo,
  postStartRemotionStudio,
  postStopRemotionStudios,
  postUpdateRemotionExport,
  queryRemotionExports,
  queryRemotionProjectDir,
  queryRemotionStudioAlive
}, Symbol.toStringTag, { value: "Module" }));
const remotionInitProjectTool = {
  name: "remotion_init_project",
  description: "初始化当前会话的 Remotion React 视频工程（复制内置模板到本地）。用户要用 Remotion / React 代码做动效视频、字幕视频、数据可视化视频时必须先调用。初始化后用 write_file 修改 src/Composition.tsx 或新增组件并在 src/Root.tsx 注册 Composition，最后调用 remotion_render 导出 mp4。与 AI 分镜管线（generate_storyboard 等）不同：Remotion 适合精确动效、字幕、图表、品牌模板。",
  permission: "sensitive",
  parameters: {
    type: "object",
    properties: {
      compositionId: {
        type: "string",
        description: "Composition id，默认 Main，需与 Root.tsx 中 <Composition id> 一致"
      },
      width: { type: "number", description: "画布宽度，默认 1920（横版 16:9）" },
      height: { type: "number", description: "画布高度，默认 1080（横版 16:9）" },
      fps: { type: "number", description: "帧率，默认 30" },
      durationInFrames: { type: "number", description: "总帧数，默认 150（30fps 约 5 秒）" }
    },
    required: []
  },
  async execute(args, ctx) {
    const width = args.width != null ? Number(args.width) : void 0;
    const height = args.height != null ? Number(args.height) : void 0;
    const fps = args.fps != null ? Number(args.fps) : void 0;
    const durationInFrames = args.durationInFrames != null ? Number(args.durationInFrames) : void 0;
    const result = postInitRemotionProject(ctx.sessionId, {
      compositionId: args.compositionId != null ? String(args.compositionId) : void 0,
      width: Number.isFinite(width) ? width : void 0,
      height: Number.isFinite(height) ? height : void 0,
      fps: Number.isFinite(fps) ? fps : void 0,
      durationInFrames: Number.isFinite(durationInFrames) ? durationInFrames : void 0
    });
    const hint = result.created ? "已从内置模板创建工程。" : "工程已存在，已更新 Root.tsx 画幅/时长配置。";
    return queryEncodeWorkflowCtxResult(
      `${hint}
工程目录：${result.projectDir}
入口：${result.entryPoint}
默认 compositionId：${result.compositionId}
下一步：用 write_file 编写 src/Composition.tsx，必要时修改 src/Root.tsx；需要官方音效时先 use_skill(remotion-sfx)，推荐 src/lib/remotion-sfx.ts 按需取 URL；若使用 import from "@remotion/sfx" 则先 remotion_enable_sfx。可用 remotion_studio 预览，确认后 remotion_render 导出 mp4。`,
      {
        remotionProjectOk: "1",
        remotionProjectDir: result.projectDir,
        remotionCompositionId: result.compositionId,
        remotionEntryPoint: result.entryPoint
      }
    );
  }
};
const remotionEnableSfxTool = {
  name: "remotion_enable_sfx",
  description: '为当前会话 Remotion 工程启用官方音效库 @remotion/sfx 的模块解析（Webpack alias）。仅当代码使用 import from "@remotion/sfx" 时必须先调用；若使用工程内 src/lib/remotion-sfx.ts 的 REMOTION_SFX 常量（CDN URL）则无需调用。调用前须 remotion_init_project。启用后可用 remotion_studio / remotion_render。',
  permission: "sensitive",
  parameters: {
    type: "object",
    properties: {
      projectDir: {
        type: "string",
        description: "工程目录绝对路径；缺省为当前会话 remotion 目录"
      }
    },
    required: []
  },
  async execute(args, ctx) {
    const projectDir = String(args.projectDir ?? queryRemotionProjectDir(ctx.sessionId)).trim();
    let result;
    try {
      result = postEnableRemotionSfx(ctx.sessionId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return `${msg}
请先 remotion_init_project。`;
    }
    if (result.projectDir !== projectDir) {
      return `会话工程目录为 ${result.projectDir}，与参数 projectDir 不一致，请核对。`;
    }
    const status = result.alreadyEnabled ? "（此前已启用，已刷新 alias 配置）" : "已启用官方音效库解析。";
    return queryEncodeWorkflowCtxResult(
      `${status}
工程目录：${result.projectDir}
用法示例：import { whoosh, ding } from "@remotion/sfx"；配合 <Sequence> + <Audio src={whoosh} />。
或无需本工具：import { REMOTION_SFX } from "./lib/remotion-sfx" 按需取 URL。
完整选音指南：use_skill(remotion-sfx)。`,
      {
        remotionSfxEnabled: "1",
        remotionProjectDir: result.projectDir
      }
    );
  }
};
const remotionStudioTool = {
  name: "remotion_studio",
  description: "启动 Remotion Studio 本地预览服务器，并在系统浏览器打开。用户要求「预览 / 看效果 / 打开 Studio / 调时间轴」时调用。必须先 remotion_init_project（可已写好 Composition）。同一会话重复调用会复用已启动实例。Studio 仅供预览，最终成片请再调用 remotion_render。",
  permission: "sensitive",
  parameters: {
    type: "object",
    properties: {
      projectDir: {
        type: "string",
        description: "工程目录绝对路径；缺省为当前会话 remotion 目录"
      },
      openBrowser: {
        type: "boolean",
        description: "是否用系统浏览器打开 Studio，默认 true"
      }
    },
    required: []
  },
  async execute(args, ctx) {
    const projectDir = String(args.projectDir ?? queryRemotionProjectDir(ctx.sessionId)).trim();
    const openBrowser = args.openBrowser === false ? false : true;
    const result = await postStartRemotionStudio({
      sessionId: ctx.sessionId,
      projectDir,
      openBrowser,
      signal: ctx.signal
    });
    if (!result.ok || !result.url) {
      return `${result.message}
不要向用户声称预览已打开。`;
    }
    return queryEncodeWorkflowCtxResult(
      `${result.message}
Studio URL：${result.url}
工程目录：${projectDir}
${result.reused ? "（复用已有实例）" : "（新启动）"}
请将 URL 告知用户；确认画面无误后再 remotion_render 导出 mp4。`,
      {
        remotionStudioOk: "1",
        remotionStudioUrl: result.url,
        remotionProjectDir: projectDir
      }
    );
  }
};
const remotionRenderTool = {
  name: "remotion_render",
  description: "将当前会话 Remotion 工程渲染为 mp4。必须先 remotion_init_project 并写好 Composition 代码。compositionId 必须与 src/Root.tsx 中注册的 id 一致。同一会话同时只允许一个渲染：若已有进行中的渲染会复用该任务，不会并行启动第二个。成功时返回本地 mp4 绝对路径，回复中务必保留该路径供聊天内联预览。禁止在未调用本工具成功前声称视频已生成。用户在本工具弹窗点「确认渲染」后，工具会在同一次调用内直接导出 mp4；禁止再修改 Composition/Root、更换 compositionId 或重新制定渲染方案。",
  permission: "sensitive",
  parameters: {
    type: "object",
    properties: {
      compositionId: {
        type: "string",
        description: "要渲染的 Composition id，默认 Main"
      },
      outputFileName: {
        type: "string",
        description: "输出文件名（不含目录），默认 remotion-{timestamp}.mp4"
      },
      projectDir: {
        type: "string",
        description: "工程目录绝对路径；缺省为当前会话 remotion 目录"
      },
      quality: {
        type: "string",
        enum: ["fast", "standard", "high"],
        description: "渲染画质预设：fast（快速预览，体积小）/ standard（标准平衡，默认）/ high（高质量，体积大）"
      }
    },
    required: []
  },
  async execute(args, ctx) {
    const compositionId = String(args.compositionId ?? "Main").trim() || "Main";
    const projectDir = String(args.projectDir ?? queryRemotionProjectDir(ctx.sessionId)).trim();
    const rawName = String(args.outputFileName ?? "").trim();
    const safeName = rawName ? rawName.replace(/[^\w.\u4e00-\u9fff-]+/g, "_").replace(/\.+$/, "") : `remotion-${Date.now()}`;
    const fileName = safeName.toLowerCase().endsWith(".mp4") ? safeName : `${safeName}.mp4`;
    const outputPath = path.join(projectDir, "out", fileName);
    const quality = args.quality === "fast" || args.quality === "high" ? args.quality : "standard";
    const confirm = await ctx.emitAwaitUser(
      `即将渲染 Composition「${compositionId}」为 mp4，耗时可能较长。请确认是否继续。`,
      [
        { id: "render", label: "确认渲染", description: "按当前工程与 compositionId 直接导出 mp4" },
        { id: "preview", label: "先预览 Studio", description: "暂不渲染，建议先 remotion_studio" },
        { id: "cancel", label: "取消", description: "放弃本次渲染" }
      ],
      // 确认结果仅由本工具继续消费，避免落盘 user 消息导致模型误以为要改方案
      { appendUserContinueMessage: false }
    );
    if (queryIsUserCancelIntent(confirm)) {
      postCancelRemotionRenderSession(ctx.sessionId);
      postStopRemotionStudios(ctx.sessionId);
      ctx.postAbortAgent?.();
      throw new AgentUserCancelledError("用户取消 Remotion 渲染");
    }
    if (confirm.choiceId === "preview") {
      return "用户选择先预览；请调用 remotion_studio 后再渲染。";
    }
    const result = await postRenderRemotionVideo({
      sessionId: ctx.sessionId,
      projectDir,
      compositionId,
      outputPath,
      quality,
      signal: ctx.signal,
      onProgress: (progress) => {
        ctx.emitToolProgress?.(remotionRenderTool.name, {
          percent: progress.percent,
          phase: progress.phase,
          message: progress.message
        });
      }
    });
    if (!result.ok || !result.path) {
      return `${result.message}
不要向用户声称视频已生成。可检查 Composition 代码、compositionId 与 Root.tsx 是否一致。`;
    }
    postStopRemotionStudios(ctx.sessionId);
    ctx.updateTasks(
      (tasks) => tasks.map(
        (t) => t.status === "running" && /渲染|导出|mp4|成片|remotion/i.test(t.title) ? { ...t, status: "done" } : t
      )
    );
    const reuseHint = result.reused ? "（复用同会话已在进行的渲染）\n" : "";
    return queryEncodeWorkflowCtxResult(
      `Remotion 视频渲染成功。
` + reuseHint + `视频路径：${result.path}
compositionId：${compositionId}
工程目录：${projectDir}
已自动关闭本会话 Remotion Studio 进程。
请在回复中保留上述本地 mp4 路径，便于聊天界面内联预览。`,
      {
        remotionRenderOk: "1",
        videoPath: result.path,
        remotionCompositionId: compositionId,
        remotionProjectDir: projectDir,
        remotionRenderReused: result.reused ? "1" : "0",
        remotionStudioStopped: "1"
      }
    );
  }
};
const remotionApplyTemplateSkillTool = {
  name: "remotion_apply_template_skill",
  description: "将 remotion-template-* 技能目录中的 template/ Composition 拷入当前会话 Remotion 工程，写入处理后的 props，并打开 remotion_studio 预览。视频生产页与「用某模版出片」时应优先调用本工具，而不是手写整套 Composition。skillId 例如 remotion-template-hot-news；props 为 HotNewsProps 等 JSON。",
  permission: "sensitive",
  parameters: {
    type: "object",
    properties: {
      skillId: {
        type: "string",
        description: "技能 id，如 remotion-template-hot-news"
      },
      compositionId: {
        type: "string",
        description: "要预览/渲染的 Composition id；缺省用 manifest 第一条"
      },
      props: {
        type: "object",
        description: "写入 default-props 的业务数据（如 HotNewsProps）"
      },
      width: { type: "number" },
      height: { type: "number" },
      fps: { type: "number" },
      durationInFrames: { type: "number" },
      openStudio: {
        type: "boolean",
        description: "是否打开 Studio，默认 true"
      }
    },
    required: ["skillId"]
  },
  async execute(args, ctx) {
    const { postApplyRemotionTemplateSkill } = await Promise.resolve().then(() => require("./chunks/remotion-apply-template-skill-urwZ5NRS.js"));
    const skillId = String(args.skillId ?? "").trim();
    const compositionId = args.compositionId != null ? String(args.compositionId).trim() : void 0;
    const props = args.props && typeof args.props === "object" && !Array.isArray(args.props) ? args.props : void 0;
    const width = args.width != null ? Number(args.width) : void 0;
    const height = args.height != null ? Number(args.height) : void 0;
    const fps = args.fps != null ? Number(args.fps) : void 0;
    const durationInFrames = args.durationInFrames != null ? Number(args.durationInFrames) : void 0;
    const openStudio = args.openStudio !== false;
    const result = await postApplyRemotionTemplateSkill({
      sessionId: ctx.sessionId,
      skillId,
      compositionId,
      props,
      width: Number.isFinite(width) ? width : void 0,
      height: Number.isFinite(height) ? height : void 0,
      fps: Number.isFinite(fps) ? fps : void 0,
      durationInFrames: Number.isFinite(durationInFrames) ? durationInFrames : void 0,
      openStudio
    });
    if (!result.ok) {
      return `拼装失败：${result.message}`;
    }
    return queryEncodeWorkflowCtxResult(
      `${result.message}
工程目录：${result.projectDir}
compositionId：${result.compositionId}
` + (result.studioUrl ? `Studio：${result.studioUrl}
` : "") + "确认画面后可 remotion_render 导出 mp4。",
      {
        remotionProjectOk: "1",
        remotionProjectDir: result.projectDir ?? "",
        remotionCompositionId: result.compositionId ?? "",
        remotionStudioUrl: result.studioUrl ?? "",
        remotionTemplateSkillId: skillId
      }
    );
  }
};
const presentPlanChoicesTool = {
  name: "present_plan_choices",
  description: "当存在 2 个及以上可行路径、且当前非完全访问时，调用本工具列出方案并暂停，等待用户从聊天框选择或输入说明后再继续。完全访问、自动发布任务、自动流程执行时禁止调用本工具暂停；应自行择优并连续执行。返回 JSON：selected（用户选中的方案 id/label）与 userInput（补充说明）；完全访问时返回 skipped=true 与 choices。",
  permission: "safe",
  parameters: {
    type: "object",
    properties: {
      reason: {
        type: "string",
        description: "为何需要用户选择（简要说明背景与差异）"
      },
      choices: {
        type: "array",
        description: "2~5 个互斥方案",
        items: {
          type: "object",
          properties: {
            id: { type: "string", description: "方案唯一 id，如 plan_a" },
            label: { type: "string", description: "方案标题，如「方案 A：竖版动效」" },
            description: { type: "string", description: "方案说明（可选）" }
          },
          required: ["id", "label"]
        }
      },
      allowCustomInput: {
        type: "boolean",
        description: "是否允许用户自由输入而非点选，默认 true"
      }
    },
    required: ["reason", "choices"]
  },
  async execute(args, ctx) {
    const reason = String(args.reason ?? "").trim();
    const rawChoices = Array.isArray(args.choices) ? args.choices : [];
    const choices = [];
    for (const item of rawChoices) {
      if (!item || typeof item !== "object") continue;
      const row = item;
      const id = String(row.id ?? "").trim();
      const label = String(row.label ?? "").trim();
      if (!id || !label) continue;
      const description = row.description != null ? String(row.description).trim() : void 0;
      choices.push({ id, label, description: description || void 0 });
    }
    if (!reason) {
      return JSON.stringify({ ok: false, message: "reason 不能为空" });
    }
    if (choices.length < 2) {
      return JSON.stringify({ ok: false, message: "至少需要 2 个方案（choices）" });
    }
    if (choices.length > 5) {
      return JSON.stringify({ ok: false, message: "方案最多 5 个" });
    }
    if (ctx.fullAccess) {
      return JSON.stringify({
        ok: true,
        skipped: true,
        reason,
        choices,
        selected: null,
        userInput: null,
        hint: "当前为完全访问模式（或自动发布/流程执行）。请自行选择最合适方案并继续执行，不要再次调用 present_plan_choices，也不要等待用户确认。"
      });
    }
    const result = await ctx.emitAwaitUser(reason, choices);
    if (result.choiceId) {
      const selected = choices.find((c) => c.id === result.choiceId);
      return JSON.stringify({
        ok: true,
        selected: selected ? { id: selected.id, label: selected.label, description: selected.description } : { id: result.choiceId, label: result.choiceLabel ?? result.choiceId },
        userInput: result.userInput ?? null
      });
    }
    if (result.userInput) {
      return JSON.stringify({
        ok: true,
        selected: null,
        userInput: result.userInput,
        hint: "请根据用户说明判断所选方案，并只执行对应路径"
      });
    }
    return JSON.stringify({ ok: false, message: "用户未选择方案也未提供说明" });
  }
};
function slugifyRuleId(name) {
  const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").replace(/_+/g, "_").slice(0, 64);
  return slug || `rule_${Date.now()}`;
}
const HH_MM = /^([01]?\d|2[0-3]):[0-5]\d$/;
function parseStringArray(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => String(item).trim()).filter(Boolean);
}
function formatNextRun(task) {
  if (task.nextRunAt == null) return "未安排";
  return new Date(task.nextRunAt).toLocaleString("zh-CN");
}
function validateScheduledTaskInput(args) {
  const title = String(args.title ?? "").trim();
  if (!title) return "缺少 title（任务名称）";
  const repeat = String(args.repeat ?? "").trim();
  if (!["once", "daily", "weekdays", "weekly"].includes(repeat)) {
    return "repeat 须为 once、daily、weekdays 或 weekly";
  }
  const actionType = String(args.actionType ?? "").trim();
  if (!["publish_plan", "custom_prompt", "workflow"].includes(actionType)) {
    return "actionType 须为 publish_plan、custom_prompt 或 workflow";
  }
  if (repeat === "once") {
    const runAt = args.runAt;
    if (runAt == null || !Number.isFinite(Number(runAt))) {
      return "repeat 为 once 时必须提供 runAt（Unix 毫秒时间戳）";
    }
  } else {
    const times = parseStringArray(args.timesOfDay);
    if (times.length === 0) {
      return 'daily/weekdays/weekly 必须提供 timesOfDay（HH:mm 数组，如 ["09:00"]）';
    }
    for (const t of times) {
      if (!HH_MM.test(t)) return `timesOfDay 格式无效：${t}，应为 HH:mm`;
    }
    if (repeat === "weekly") {
      const weekday = args.weekday;
      if (weekday == null || !Number.isFinite(Number(weekday))) {
        return "weekly 必须提供 weekday（0=周日 … 6=周六）";
      }
      const w = Number(weekday);
      if (w < 0 || w > 6) return "weekday 须在 0～6 之间";
    }
  }
  if (actionType === "publish_plan") {
    const planId = String(args.publishPlanId ?? "").trim();
    if (!planId) return "actionType 为 publish_plan 时必须提供 publishPlanId";
    if (!queryPublishPlan(planId)) {
      return `发布计划不存在：${planId}，请先 query_publish_plans 或 post_publish_plan 创建`;
    }
  }
  if (actionType === "workflow") {
    const wfId = String(args.workflowId ?? "").trim();
    if (!wfId) return "actionType 为 workflow 时必须提供 workflowId";
    if (!queryWorkflow(wfId)) {
      return `工作流不存在：${wfId}`;
    }
  }
  if (actionType === "custom_prompt") {
    const prompt = String(args.customPrompt ?? "").trim();
    if (prompt.length < 10) return "custom_prompt 类型时 customPrompt 至少 10 个字符";
  }
  if (repeat !== "once") {
    const from = args.activeFrom;
    const until = args.activeUntil;
    if (from != null && !Number.isFinite(Number(from))) {
      return "activeFrom 须为 Unix 毫秒时间戳";
    }
    if (until != null && !Number.isFinite(Number(until))) {
      return "activeUntil 须为 Unix 毫秒时间戳";
    }
    if (from != null && until != null && Number.isFinite(Number(from)) && Number.isFinite(Number(until)) && Number(until) < Number(from)) {
      return "activeUntil 不得早于 activeFrom";
    }
  }
  return null;
}
function buildScheduledTaskFromArgs(args) {
  const now = Date.now();
  const id = String(args.id ?? "").trim() || crypto$1.randomUUID();
  const existing = queryScheduledTask(id);
  const repeat = String(args.repeat).trim();
  const timesOfDay = normalizeScheduleTimesOfDay(
    repeat === "once" ? existing ? existing.timesOfDay : ["09:00"] : parseStringArray(args.timesOfDay)
  );
  const actionType = String(args.actionType).trim();
  const activeRange = normalizeScheduleActiveRange(
    repeat,
    args.activeFrom != null ? Number(args.activeFrom) : void 0,
    args.activeUntil != null ? Number(args.activeUntil) : void 0
  );
  const enabled = args.enabled !== void 0 ? Boolean(args.enabled) : existing?.enabled ?? false;
  const base2 = existing ?? {
    id,
    title: "",
    description: "",
    enabled: false,
    repeat: "daily",
    timeOfDay: "09:00",
    timesOfDay: ["09:00"],
    weekday: 1,
    actionType: "publish_plan",
    runInBackground: true,
    runCount: 0,
    createdAt: now,
    updatedAt: now
  };
  return {
    ...base2,
    id,
    title: String(args.title).trim(),
    description: args.description != null ? String(args.description).trim() : base2.description,
    enabled,
    repeat,
    timeOfDay: timesOfDay[0],
    timesOfDay,
    weekday: repeat === "weekly" ? Number(args.weekday) : repeat === "once" ? base2.weekday : base2.weekday,
    runAt: repeat === "once" ? Number(args.runAt) : base2.runAt,
    activeFrom: repeat === "once" ? void 0 : activeRange.activeFrom ?? base2.activeFrom,
    activeUntil: repeat === "once" ? void 0 : activeRange.activeUntil ?? base2.activeUntil,
    actionType,
    publishPlanId: actionType === "publish_plan" ? String(args.publishPlanId).trim() : void 0,
    workflowId: actionType === "workflow" ? String(args.workflowId).trim() : void 0,
    customPrompt: actionType === "custom_prompt" ? String(args.customPrompt).trim() : void 0,
    notifyChannels: parseStringArray(args.notifyChannels),
    runInBackground: args.runInBackground !== void 0 ? Boolean(args.runInBackground) : queryRunInBackground(base2),
    presetUserInput: args.presetUserInput != null ? String(args.presetUserInput).trim() || void 0 : base2.presetUserInput,
    updatedAt: now
  };
}
function parseSubTasksFromArgs(raw) {
  if (!Array.isArray(raw) || raw.length === 0) {
    return "至少提供一个 subTasks 子任务（含 title、channels、contentPrompt）";
  }
  const result = [];
  for (let i = 0; i < raw.length; i++) {
    const item = raw[i];
    if (!item || typeof item !== "object") return `subTasks[${i}] 格式无效`;
    const row = item;
    const title = String(row.title ?? "").trim();
    const contentPrompt = String(row.contentPrompt ?? "").trim();
    const channels = normalizePublishSubTaskChannels(
      parseStringArray(row.channels).length > 0 ? parseStringArray(row.channels) : ["xhs"]
    );
    if (!title) return `subTasks[${i}].title 不能为空`;
    if (!contentPrompt) return `subTasks[${i}].contentPrompt 不能为空`;
    result.push({
      id: String(row.id ?? "").trim() || crypto$1.randomUUID(),
      title,
      channels,
      notifyChannels: parseStringArray(row.notifyChannels),
      topic: String(row.topic ?? "").trim(),
      autoPublish: row.autoPublish !== void 0 ? Boolean(row.autoPublish) : true,
      contentPrompt
    });
  }
  return result;
}
const queryScheduledTasksTool = {
  name: "query_scheduled_tasks",
  description: "列出已保存的定时任务摘要（id、名称、是否启用、下次执行、动作类型）。创建或关联前可先查询。",
  permission: "safe",
  parameters: { type: "object", properties: {} },
  async execute() {
    const tasks = queryScheduledTasks();
    if (tasks.length === 0) return "当前没有定时任务。";
    const lines = tasks.map(
      (t) => `- id=${t.id} | ${t.title} | enabled=${t.enabled} | action=${t.actionType} | 下次=${formatNextRun(t)}`
    );
    return `共 ${tasks.length} 个定时任务：
${lines.join("\n")}`;
  }
};
const postScheduledTaskTool = {
  name: "post_scheduled_task",
  description: "创建或更新定时任务并保存到本地。默认 enabled=false，需用户确认后再改为 true 才会被调度。publish_plan 需有效 publishPlanId；workflow 需 workflowId；custom_prompt 需 customPrompt（≥10字）。",
  permission: "sensitive",
  parameters: {
    type: "object",
    properties: {
      id: { type: "string", description: "可选，传入则更新已有任务" },
      title: { type: "string", description: "任务名称" },
      description: { type: "string", description: "备注说明" },
      repeat: { type: "string", enum: ["once", "daily", "weekdays", "weekly"] },
      timesOfDay: {
        type: "array",
        items: { type: "string" },
        description: "daily/weekdays/weekly 执行时刻 HH:mm"
      },
      weekday: { type: "number", description: "weekly 时 0=周日 … 6=周六" },
      runAt: { type: "number", description: "once 时 Unix 毫秒时间戳" },
      activeFrom: {
        type: "number",
        description: "循环任务生效起点（Unix 毫秒，含当日）"
      },
      activeUntil: {
        type: "number",
        description: "循环任务生效终点（Unix 毫秒，含当日）"
      },
      actionType: {
        type: "string",
        enum: ["publish_plan", "custom_prompt", "workflow"]
      },
      publishPlanId: { type: "string" },
      workflowId: { type: "string" },
      customPrompt: { type: "string" },
      notifyChannels: { type: "array", items: { type: "string" } },
      runInBackground: { type: "boolean", description: "默认 true" },
      enabled: { type: "boolean", description: "默认 false，避免误触发" },
      presetUserInput: {
        type: "string",
        description: "预设用户输入；有值时跳过流程输入节点等待"
      }
    },
    required: ["title", "repeat", "actionType"]
  },
  async execute(args) {
    const err = validateScheduledTaskInput(args);
    if (err) return err;
    try {
      const task = buildScheduledTaskFromArgs(args);
      const saved = postScheduledTaskAndNotify(task);
      return `定时任务已保存：id=${saved.id}，标题「${saved.title}」，enabled=${saved.enabled}，下次执行=${formatNextRun(saved)}。` + (saved.enabled ? "" : " 当前未启用，用户确认后可将 enabled 设为 true。");
    } catch (e) {
      return `保存失败：${e instanceof Error ? e.message : String(e)}`;
    }
  }
};
const queryPublishPlansTool = {
  name: "query_publish_plans",
  description: "列出已保存的发布计划摘要（id、标题、类型、子任务数）。",
  permission: "safe",
  parameters: { type: "object", properties: {} },
  async execute() {
    const plans = queryPublishPlans();
    if (plans.length === 0) return "当前没有发布计划。";
    const lines = plans.map(
      (p) => `- id=${p.id} | ${p.title} | kind=${p.kind} | 子任务=${p.subTasks.length} | 流程数=${p.workflowIds.length}`
    );
    return `共 ${plans.length} 个发布计划：
${lines.join("\n")}`;
  }
};
const postPublishPlanTool = {
  name: "post_publish_plan",
  description: "创建或更新发布计划（kind 默认 normal）。normal 类型至少 1 个子任务，每子任务需 title、channels、contentPrompt。保存后会同步镜像工作流，可供定时任务 publish_plan 引用。",
  permission: "sensitive",
  parameters: {
    type: "object",
    properties: {
      id: { type: "string", description: "可选，更新已有计划" },
      title: { type: "string" },
      description: { type: "string" },
      kind: { type: "string", enum: ["normal", "workflow"] },
      workflowIds: { type: "array", items: { type: "string" }, description: "kind=workflow 时必填" },
      notifyChannels: { type: "array", items: { type: "string" } },
      presetUserInput: {
        type: "string",
        description: "预设用户输入；有值时跳过流程输入节点等待"
      },
      subTasks: {
        type: "array",
        description: "normal 类型子任务列表",
        items: {
          type: "object",
          properties: {
            id: { type: "string" },
            title: { type: "string" },
            channels: { type: "array", items: { type: "string" } },
            contentPrompt: { type: "string" },
            topic: { type: "string" },
            autoPublish: { type: "boolean" },
            notifyChannels: { type: "array", items: { type: "string" } }
          }
        }
      }
    },
    required: ["title"]
  },
  async execute(args) {
    const title = String(args.title ?? "").trim();
    if (!title) return "缺少 title";
    const now = Date.now();
    const id = String(args.id ?? "").trim() || crypto$1.randomUUID();
    const existing = queryPublishPlan(id);
    const kind = String(args.kind ?? existing?.kind ?? "normal").trim() || "normal";
    let subTasks;
    if (kind === "normal") {
      const parsed = parseSubTasksFromArgs(args.subTasks ?? existing?.subTasks);
      if (typeof parsed === "string") return parsed;
      subTasks = parsed;
    } else {
      const workflowIds = parseStringArray(args.workflowIds ?? existing?.workflowIds);
      if (workflowIds.length === 0) {
        return "kind 为 workflow 时 workflowIds 至少一项";
      }
      subTasks = existing?.subTasks ?? [];
      const plan2 = normalizePublishPlan({
        id,
        title,
        description: args.description != null ? String(args.description).trim() : existing?.description ?? "",
        kind: "workflow",
        workflowIds,
        workflowId: workflowIds[0],
        notifyChannels: parseStringArray(args.notifyChannels ?? existing?.notifyChannels),
        presetUserInput: args.presetUserInput != null ? String(args.presetUserInput).trim() || void 0 : existing?.presetUserInput,
        subTasks,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now
      });
      try {
        const saved = postPublishPlanAndSync(plan2);
        return `发布计划已保存：id=${saved.id}，标题「${saved.title}」，类型=workflow，关联流程 ${workflowIds.length} 个。`;
      } catch (e) {
        return `保存失败：${e instanceof Error ? e.message : String(e)}`;
      }
    }
    const plan = normalizePublishPlan({
      id,
      title,
      description: args.description != null ? String(args.description).trim() : existing?.description ?? "",
      kind: "normal",
      workflowIds: [],
      notifyChannels: parseStringArray(args.notifyChannels ?? existing?.notifyChannels),
      presetUserInput: args.presetUserInput != null ? String(args.presetUserInput).trim() || void 0 : existing?.presetUserInput,
      subTasks,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now
    });
    try {
      const saved = postPublishPlanAndSync(plan);
      return `发布计划已保存：id=${saved.id}，标题「${saved.title}」，子任务 ${saved.subTasks.length} 个。 可在定时任务中设置 actionType=publish_plan 并引用此 id。`;
    } catch (e) {
      return `保存失败：${e instanceof Error ? e.message : String(e)}`;
    }
  }
};
const queryAgentRulesTool = {
  name: "query_agent_rules",
  description: "列出已保存的 Agent 用户规则摘要（id、名称、是否启用）。",
  permission: "safe",
  parameters: { type: "object", properties: {} },
  async execute() {
    const rules = queryAgentRules();
    if (rules.length === 0) return "当前没有用户规则。";
    const lines = rules.map(
      (r) => `- id=${r.id} | ${r.name} | enabled=${r.enabled}`
    );
    return `共 ${rules.length} 条规则：
${lines.join("\n")}`;
  }
};
const postAgentRuleTool = {
  name: "post_agent_rule",
  description: "新增或更新 Agent 用户规则。必填 name、content；id 可省略（由名称生成）。保存后从下一轮对话起注入 system prompt。",
  permission: "sensitive",
  parameters: {
    type: "object",
    properties: {
      id: { type: "string", description: "小写字母数字连字符下划线，1～64 字符" },
      name: { type: "string" },
      description: { type: "string" },
      content: { type: "string", description: "规则正文，Markdown" },
      enabled: { type: "boolean", description: "默认 true" }
    },
    required: ["name", "content"]
  },
  async execute(args) {
    const name = String(args.name ?? "").trim();
    const content = String(args.content ?? "").trim();
    if (!name) return "缺少 name";
    if (!content) return "缺少 content";
    let id = String(args.id ?? "").trim();
    if (!id) id = slugifyRuleId(name);
    try {
      validateRuleId(id);
    } catch (e) {
      return e instanceof Error ? e.message : "规则 id 格式无效";
    }
    const input = {
      id,
      name,
      description: args.description != null ? String(args.description).trim() : "",
      content,
      enabled: args.enabled !== void 0 ? Boolean(args.enabled) : true
    };
    try {
      const saved = postAgentRuleAndNotify(input);
      return `规则已保存：id=${saved.id}，名称「${saved.name}」，enabled=${saved.enabled}。 从下一轮对话起生效。`;
    } catch (e) {
      return `保存失败：${e instanceof Error ? e.message : String(e)}`;
    }
  }
};
const managementTools = [
  queryScheduledTasksTool,
  postScheduledTaskTool,
  queryPublishPlansTool,
  postPublishPlanTool,
  queryAgentRulesTool,
  postAgentRuleTool
];
function queryNormalizeToolName(name) {
  return name.trim().toLowerCase().replace(/[\s-]+/g, "_");
}
function queryLevenshteinDistance(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  const curr = new Array(b.length + 1);
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    const ca = a.charCodeAt(i - 1);
    for (let j = 1; j <= b.length; j++) {
      const cost = ca === b.charCodeAt(j - 1) ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1,
        curr[j - 1] + 1,
        prev[j - 1] + cost
      );
    }
    for (let j = 0; j <= b.length; j++) prev[j] = curr[j];
  }
  return prev[b.length];
}
function queryToolNameSimilarity(a, b) {
  const left = queryNormalizeToolName(a);
  const right = queryNormalizeToolName(b);
  if (!left && !right) return 1;
  if (!left || !right) return 0;
  if (left === right) return 1;
  const maxLen = Math.max(left.length, right.length);
  return 1 - queryLevenshteinDistance(left, right) / maxLen;
}
function queryResolveToolName(requested, candidates, options) {
  const threshold = 0.9;
  const req = queryNormalizeToolName(requested);
  if (!req || candidates.length === 0) return void 0;
  let best;
  for (const candidate of candidates) {
    const normalized = queryNormalizeToolName(candidate);
    if (!normalized) continue;
    if (normalized === req) {
      return { name: candidate, similarity: 1, exact: true };
    }
    const similarity = queryToolNameSimilarity(req, normalized);
    if (similarity < threshold) continue;
    if (!best || similarity > best.similarity) {
      best = { name: candidate, similarity, exact: false };
    }
  }
  return best;
}
let cachedTools = null;
function queryBuildAllTools() {
  return [
    useSkillTool,
    switchModelTool,
    listAttachmentsTool,
    readFileTool,
    writeFileTool,
    updateTaskListTool,
    presentPlanChoicesTool,
    generateImageTool,
    fetchWebImagesTool,
    fetchHotTopicsTool,
    queryAshareKlineTool,
    queryAshareRealtimeAnalysisTool,
    queryWeatherTool,
    webSearchTool,
    queryWebDataTool,
    generateScriptTool,
    generateStoryboardTool,
    generateSceneAssetsTool,
    composeVideoTool,
    remotionInitProjectTool,
    remotionApplyTemplateSkillTool,
    remotionEnableSfxTool,
    remotionStudioTool,
    remotionRenderTool,
    browserNavigateTool,
    browserSnapshotTool,
    browserClickTool,
    browserTypeTool,
    browserUploadTool,
    browserWaitTool,
    xhsPublishNoteTool,
    douyinPublishNoteTool,
    notifyMessageTool,
    ...managementTools
  ];
}
function getAllTools() {
  if (!cachedTools) {
    cachedTools = queryBuildAllTools();
  }
  return cachedTools;
}
function postWarmAgentTools() {
  cachedTools = null;
  return getAllTools().length;
}
function getToolByName(name) {
  const all = getAllTools();
  const exact = all.find((t) => t.name === name);
  if (exact) return exact;
  const resolved = queryResolveToolName(
    name,
    all.map((t) => t.name)
  );
  if (!resolved) return void 0;
  return all.find((t) => t.name === resolved.name);
}
const index = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  getAllTools,
  getToolByName,
  postWarmAgentTools
}, Symbol.toStringTag, { value: "Module" }));
const ROLE_WHITELIST = {
  general: null,
  researcher: [
    "use_skill",
    "switch_model",
    "fetch_hot_topics",
    "query_ashare_kline",
    "query_ashare_realtime_analysis",
    "query_weather",
    "web_search",
    "query_web_data",
    "fetch_web_images",
    "list_attachments",
    "read_file",
    "update_task_list",
    "browser_navigate",
    "browser_snapshot",
    "browser_click",
    "browser_type",
    "browser_upload",
    "browser_wait"
  ],
  writer: [
    "use_skill",
    "switch_model",
    "update_task_list",
    "present_plan_choices",
    "web_search",
    "query_web_data",
    "fetch_web_images",
    "query_weather",
    "read_file",
    "write_file",
    "generate_image",
    "remotion_init_project",
    "remotion_apply_template_skill",
    "remotion_enable_sfx",
    "remotion_studio",
    "list_attachments"
  ],
  publisher: [
    "use_skill",
    "switch_model",
    "fetch_web_images",
    "xhs_publish_note",
    "douyin_publish_note",
    "notify_message",
    "browser_navigate",
    "browser_snapshot",
    "browser_click",
    "browser_type",
    "browser_upload",
    "browser_wait",
    "update_task_list",
    "list_attachments"
  ],
  scriptwriter: [
    "use_skill",
    "switch_model",
    "present_plan_choices",
    // 视频选题常需热点榜 + 打开报道页读详情（与 researcher 调研能力对齐）
    "fetch_hot_topics",
    "web_search",
    "query_web_data",
    "fetch_web_images",
    "browser_navigate",
    "browser_snapshot",
    "list_attachments",
    "read_file",
    "write_file",
    "generate_script",
    "generate_storyboard",
    "remotion_init_project",
    "remotion_apply_template_skill",
    "remotion_enable_sfx",
    "remotion_studio",
    "update_task_list"
  ],
  videographer: [
    "use_skill",
    "switch_model",
    "present_plan_choices",
    "query_web_data",
    "read_file",
    "write_file",
    "generate_image",
    "generate_scene_assets",
    "browser_navigate",
    "browser_snapshot",
    "remotion_init_project",
    "remotion_apply_template_skill",
    "remotion_enable_sfx",
    "remotion_studio",
    "remotion_render",
    "update_task_list",
    "list_attachments"
  ],
  editor: [
    "use_skill",
    "switch_model",
    "query_web_data",
    "compose_video",
    "remotion_init_project",
    "remotion_apply_template_skill",
    "remotion_enable_sfx",
    "remotion_studio",
    "remotion_render",
    "notify_message",
    "read_file",
    "write_file",
    "update_task_list",
    "list_attachments"
  ]
};
function queryDefaultRoleToolWhitelist(role) {
  const list = ROLE_WHITELIST[role];
  return list === null ? null : [...list];
}
function queryDefaultToolsForCustomRole(def) {
  if (!def) return null;
  if (def.toolWhitelist === null) return null;
  if (Array.isArray(def.toolWhitelist)) return [...def.toolWhitelist];
  return null;
}
function queryResolvedRoleToolWhitelist(role, overrides, customRoles) {
  let map = overrides;
  if (map === void 0) {
    try {
      map = querySettings().roleToolWhitelistOverrides ?? {};
    } catch {
      map = {};
    }
  }
  if (Object.prototype.hasOwnProperty.call(map, role)) {
    const override = map[role];
    if (override === null) return null;
    if (Array.isArray(override)) return [...override];
  }
  if (queryIsCustomAgentRoleId(role)) {
    const roles = customRoles ?? (() => {
      try {
        return querySettings().customAgentRoles ?? [];
      } catch {
        return [];
      }
    })();
    return queryDefaultToolsForCustomRole(queryCustomAgentRole(roles, role));
  }
  return queryDefaultRoleToolWhitelist(role);
}
function queryToolsForRole(role, _overrides, _customRoles) {
  if (role === "supervisor") return [];
  return getAllTools();
}
function queryToolsByWhitelist(_whitelist) {
  return getAllTools();
}
function queryRoleToolInjections(overrides, customRoles) {
  let map = overrides;
  if (map === void 0) {
    try {
      map = querySettings().roleToolWhitelistOverrides ?? {};
    } catch {
      map = {};
    }
  }
  let customs = customRoles;
  if (customs === void 0) {
    try {
      customs = querySettings().customAgentRoles ?? [];
    } catch {
      customs = [];
    }
  }
  const allNames = getAllTools().map((t) => t.name);
  const roles = [
    "supervisor",
    "general",
    "researcher",
    "writer",
    "publisher",
    "scriptwriter",
    "videographer",
    "editor",
    ...(customs ?? []).map((r) => r.id)
  ];
  return roles.map((role) => {
    if (role === "supervisor") {
      return {
        role,
        mode: "none",
        toolNames: [],
        defaultToolNames: [],
        customized: false
      };
    }
    const customized = Object.prototype.hasOwnProperty.call(map, role);
    const defaults = queryIsCustomAgentRoleId(role) ? queryDefaultToolsForCustomRole(queryCustomAgentRole(customs, role)) : queryDefaultRoleToolWhitelist(role);
    const list = queryResolvedRoleToolWhitelist(role, map, customs);
    if (!list) {
      return {
        role,
        mode: "all",
        toolNames: allNames,
        defaultToolNames: defaults,
        customized
      };
    }
    return {
      role,
      mode: "whitelist",
      toolNames: [...list],
      defaultToolNames: defaults,
      customized
    };
  });
}
function createReactSubgraph(params) {
  const { llm, tools: tools2, systemPrompt, checkpointer, name } = params;
  const middleware = [];
  if (typeof llm === "function") {
    middleware.push(
      langchain.createMiddleware({
        name: "DynamicCapabilityModel",
        wrapModelCall: async (request, handler) => {
          const model2 = await Promise.resolve(llm());
          return handler({ ...request, model: model2 });
        }
      })
    );
  }
  if (tools2.length > 0) {
    const toolNames = tools2.map((t) => t.name);
    middleware.push(
      langchain.createMiddleware({
        name: "FuzzyToolName",
        wrapToolCall: async (request, handler) => {
          const resolved = queryResolveToolName(String(request.toolCall.name ?? ""), toolNames);
          if (!resolved || resolved.name === request.toolCall.name) {
            return handler(request);
          }
          const tool = tools2.find((t) => t.name === resolved.name);
          return handler({
            ...request,
            toolCall: { ...request.toolCall, name: resolved.name },
            ...tool ? { tool } : {}
          });
        }
      })
    );
  }
  const model = typeof llm === "function" ? (() => {
    const resolved = llm();
    if (resolved && typeof resolved.then === "function") {
      throw new Error(
        "createReactSubgraph: llm 工厂首次解析须同步返回模型（异步请在 wrapModelCall 内处理）"
      );
    }
    return resolved;
  })() : llm;
  const agent = langchain.createAgent({
    model,
    tools: tools2,
    systemPrompt,
    checkpointer,
    name: name ?? "react_agent",
    middleware
  });
  return agent.graph;
}
function queryRecursionLimit(maxTurns) {
  return Math.max(8, maxTurns * 2);
}
const chatCheckpointer = new langgraph.MemorySaver();
function querySkillCtxForRole(role, settings, sessionId) {
  const session = querySession(sessionId);
  return {
    sessionSkillIds: session?.selectedSkillIds ?? [],
    roleSkillIds: settings.roleSkillIds?.[role] ?? []
  };
}
function buildChatGraph(params) {
  const { settings, toolCtx, capabilityBox, onModelResolved } = params;
  const recursionLimit = queryRecursionLimit(settings.maxTurns);
  function postResolveForRole(role, capability) {
    const conn = queryResolveModelConnection(settings, {
      role,
      capability: capability || void 0
    });
    if (capability) {
      onModelResolved?.({
        capability,
        model: conn.model,
        connectionLabel: conn.label
      });
    }
  }
  function queryRoleLlmFactory(role) {
    const factory = createCapabilityRoutedModel(settings, role, () => capabilityBox.current);
    return () => withSessionTokenUsage(factory(), toolCtx.sessionId);
  }
  async function runRoleAgent(role, state) {
    if (!capabilityBox.current) {
      const inferred = queryInferModelCapability(
        lastUserText(state.messages),
        state.attachmentPaths
      );
      capabilityBox.current = inferred;
    }
    postResolveForRole(role, capabilityBox.current);
    toolCtx.activeRole = role;
    toolCtx.agentName = `role_${role}`;
    const skillCtx = querySkillCtxForRole(role, settings, toolCtx.sessionId);
    toolCtx.skillInjectCtx = skillCtx;
    const tools2 = adaptAgentTools(
      queryToolsForRole(
        role,
        settings.roleToolWhitelistOverrides,
        settings.customAgentRoles
      ),
      { ctx: toolCtx }
    );
    const roleInputMessages = trimMessagesToCharBudget(state.messages);
    const agent = createReactSubgraph({
      llm: queryRoleLlmFactory(role),
      tools: tools2,
      systemPrompt: buildRoleSystemPrompt(
        role,
        settings.rolePromptOverrides,
        settings,
        skillCtx
      ),
      name: `role_${role}`
    });
    const result = await agent.invoke(
      { messages: roleInputMessages },
      { recursionLimit }
    );
    const all = result.messages;
    const delta = all.slice(roleInputMessages.length);
    return {
      messages: delta,
      activeAgent: role,
      activeCapability: capabilityBox.current
    };
  }
  async function supervisorNode(state) {
    toolCtx.activeRole = "supervisor";
    toolCtx.agentName = "supervisor";
    const llm = withSessionTokenUsage(createChatModel(settings, "supervisor"), toolCtx.sessionId);
    const latestUserMessage = queryLatestHumanMessage(state.messages);
    const latestForRoute = latestUserMessage ? queryProjectMessageWithoutImages(latestUserMessage) : void 0;
    const reply = await llm.invoke(
      latestForRoute ? [
        new messages.SystemMessage(buildRoleSystemPrompt("supervisor", void 0, settings)),
        latestForRoute
      ] : [new messages.SystemMessage(buildRoleSystemPrompt("supervisor", void 0, settings))]
    );
    const text = typeof reply.content === "string" ? reply.content : Array.isArray(reply.content) ? reply.content.map((c) => "text" in c ? c.text : "").join("") : String(reply.content ?? "");
    const userText = lastUserText(state.messages);
    const customIds = new Set(queryCustomAgentRoleIds(settings));
    const route = queryResolveSupervisorRoute(text, userText, customIds);
    const nextAgent = route.nextAgent;
    const nextTarget = route.pipelineKind;
    const capability = querySanitizeModelCapability(
      route.capability ?? queryInferModelCapability(userText, state.attachmentPaths),
      userText
    ) ?? "chat";
    capabilityBox.current = capability;
    postResolveForRole(nextAgent, capability);
    return {
      nextAgent,
      pipelineKind: nextTarget,
      activeAgent: "supervisor",
      activeCapability: capability,
      messages: [new messages.AIMessage({ content: `[路由] → ${nextAgent} · ${capability} · ${nextTarget}` })]
    };
  }
  const customRoles = settings.customAgentRoles ?? [];
  let builder = new langgraph.StateGraph(AgentGraphAnnotation).addNode("supervisor", supervisorNode).addNode("general", async (state) => runRoleAgent("general", state)).addNode("researcher", async (state) => runRoleAgent("researcher", state)).addNode("writer", async (state) => runRoleAgent("writer", state)).addNode("publisher", async (state) => runRoleAgent("publisher", state)).addNode("scriptwriter", async (state) => runRoleAgent("scriptwriter", state)).addNode("videographer", async (state) => runRoleAgent("videographer", state)).addNode("editor", async (state) => runRoleAgent("editor", state));
  for (const cr of customRoles) {
    const roleId = cr.id;
    builder = builder.addNode(
      cr.id,
      async (state) => runRoleAgent(roleId, state)
    );
  }
  const supervisorBranches = {
    general: "general",
    researcher: "researcher",
    scriptwriter: "scriptwriter"
  };
  for (const cr of customRoles) {
    supervisorBranches[cr.id] = cr.id;
  }
  builder = builder.addEdge(langgraph.START, "supervisor").addConditionalEdges(
    "supervisor",
    (state) => state.nextAgent || "general",
    supervisorBranches
  ).addEdge("general", langgraph.END).addEdge("researcher", "writer").addConditionalEdges(
    "writer",
    (state) => state.pipelineKind === "publish" ? "publisher" : langgraph.END,
    {
      publisher: "publisher",
      [langgraph.END]: langgraph.END
    }
  ).addEdge("publisher", langgraph.END).addEdge("scriptwriter", "videographer").addEdge("videographer", "editor").addEdge("editor", langgraph.END);
  for (const cr of customRoles) {
    builder = builder.addEdge(cr.id, langgraph.END);
  }
  return builder.compile({ checkpointer: chatCheckpointer });
}
function lastUserText(messages2) {
  const message = queryLatestHumanMessage(messages2);
  return queryExtractTextFromContent(message?.content);
}
function buildStepReactGraph(params) {
  const {
    settings,
    toolCtx,
    systemPrompt,
    stepPrompt = "",
    attachmentPaths = [],
    modelRole = "general",
    onModelResolved
  } = params;
  const capabilityBox = params.capabilityBox ?? { current: "" };
  if (!capabilityBox.current) {
    capabilityBox.current = queryInferModelCapability(stepPrompt, attachmentPaths);
  }
  if (!toolCtx.postActiveCapability) {
    toolCtx.postActiveCapability = (capability) => {
      capabilityBox.current = capability;
    };
  }
  if (!toolCtx.queryActiveCapability) {
    toolCtx.queryActiveCapability = () => capabilityBox.current || void 0;
  }
  const conn = queryResolveModelConnection(settings, {
    role: modelRole,
    capability: capabilityBox.current || void 0
  });
  if (capabilityBox.current) {
    onModelResolved?.({
      capability: capabilityBox.current,
      model: conn.model,
      connectionLabel: conn.label
    });
  }
  toolCtx.activeRole = modelRole;
  toolCtx.agentName = "workflow_step_agent";
  const factory = createCapabilityRoutedModel(
    settings,
    modelRole,
    () => capabilityBox.current
  );
  const tools2 = adaptAgentTools(queryToolsByWhitelist(), { ctx: toolCtx });
  return createReactSubgraph({
    llm: () => withSessionTokenUsage(factory(), toolCtx.sessionId),
    tools: tools2,
    systemPrompt,
    checkpointer: chatCheckpointer,
    name: "workflow_step_agent"
  });
}
const abortMap = /* @__PURE__ */ new Map();
const pendingAwaitBySession = /* @__PURE__ */ new Map();
const continueWaiters = /* @__PURE__ */ new Map();
postBindThinkingStallAbort((sessionId) => {
  abortMap.get(sessionId)?.abort();
});
function uuidv4() {
  return crypto.randomUUID();
}
function normalizeAwaitRequest(request) {
  if (typeof request === "string") {
    return { reason: request };
  }
  return request;
}
function markAwaitUserResolved(sessionId, interruptId) {
  const session = querySession(sessionId);
  if (!session) return;
  let fallbackIndex = null;
  for (let i = session.messages.length - 1; i >= 0; i--) {
    const m = session.messages[i];
    if (m.role !== "assistant" || !m.awaitMeta) continue;
    if (interruptId && m.awaitMeta.interruptId === interruptId) {
      delete m.awaitMeta;
      persistSession(session);
      return;
    }
    if (!m.awaitMeta.interruptId && fallbackIndex === null) {
      fallbackIndex = i;
    }
  }
  if (fallbackIndex == null) return;
  delete session.messages[fallbackIndex].awaitMeta;
  persistSession(session);
}
function appendAwaitUserPlaceholder(sessionId, params) {
  const session = querySession(sessionId);
  if (!session) return;
  const content = `等待确认：${params.reason}`;
  const placeholder = appendMessage(session, {
    role: "assistant",
    content,
    awaitMeta: {
      reason: params.reason,
      choices: params.choices,
      interruptId: params.interruptId
    }
  });
  persistSession(session);
  emitAgentEvent({ type: "message", sessionId, message: placeholder });
}
function emitAgentEvent(event) {
  const win = getMainWindow();
  if (win && !win.isDestroyed()) {
    win.webContents.send("event:agent", event);
  }
  handleScheduleAgentDone(event);
}
function postEmitAgentError(sessionId, rawMessage, ctx) {
  const settings = querySettings();
  const toolName = ctx?.toolName?.trim() || (ctx?.messages ? queryLastToolNameFromMessages(ctx.messages) : void 0);
  const roleId = ctx?.roleId?.trim() || void 0;
  const capability = ctx?.capability === "chat" || ctx?.capability === "reasoning" || ctx?.capability === "vision" || ctx?.capability === "longContext" || ctx?.capability === "creative" ? ctx.capability : void 0;
  let connectionLabel;
  let provider;
  let model;
  try {
    const conn = queryResolveModelConnection(settings, {
      role: roleId,
      capability
    });
    connectionLabel = conn.label;
    provider = conn.provider;
    model = conn.model;
  } catch {
  }
  const message = queryFormatAgentErrorMessage(
    rawMessage,
    {
      toolName,
      roleId,
      agentName: ctx?.agentName,
      connectionLabel,
      provider,
      model
    },
    settings
  );
  const session = querySession(sessionId);
  if (session) {
    const errorMsg = appendMessage(session, {
      role: "assistant",
      content: message,
      errorMeta: { title: "执行失败" }
    });
    persistSession(session);
    emitAgentEvent({ type: "message", sessionId, message: errorMsg });
  }
  emitAgentEvent({ type: "error", sessionId, message });
}
function emitSessionStarted(session) {
  emitAgentEvent({ type: "session_started", sessionId: session.id, session });
}
function persistSession(session) {
  session.updatedAt = Date.now();
  postSession(session);
}
function appendMessage(session, msg) {
  const full = {
    id: uuidv4(),
    createdAt: Date.now(),
    ...msg
  };
  session.messages.push(full);
  return full;
}
function pauseRunningSessionTasks(sessionId) {
  const session = querySession(sessionId);
  if (!session?.tasks?.length || !queryHasRunningTasks(session.tasks)) return;
  session.tasks = pauseRunningTasks(session.tasks);
  persistSession(session);
  emitAgentEvent({ type: "task_update", sessionId, tasks: session.tasks });
}
function queryGraphActiveRuns() {
  const sessionIds = /* @__PURE__ */ new Set([
    ...abortMap.keys(),
    ...continueWaiters.keys(),
    ...pendingAwaitBySession.keys()
  ]);
  return Array.from(sessionIds).map((sessionId) => {
    const pending = pendingAwaitBySession.get(sessionId);
    const awaitingUser = Boolean(pending) || continueWaiters.has(sessionId);
    return {
      sessionId,
      awaitingUser,
      awaitReason: pending?.reason,
      awaitChoices: pending?.choices
    };
  });
}
function postGraphResyncAfterRendererLoad() {
  return queryGraphActiveRuns();
}
function postGraphAbort(sessionId) {
  abortMap.get(sessionId)?.abort();
  abortMap.delete(sessionId);
  pendingAwaitBySession.delete(sessionId);
  const waiter = continueWaiters.get(sessionId);
  if (waiter) {
    waiter.reject(new Error("用户已中止"));
    continueWaiters.delete(sessionId);
  }
  postCancelRemotionRenderSession(sessionId);
  postStopRemotionStudios(sessionId);
  pauseRunningSessionTasks(sessionId);
}
function postGraphContinue(sessionId, payload) {
  const waiter = continueWaiters.get(sessionId);
  if (!waiter) return;
  const normalized = normalizeContinuePayload(payload);
  const pending = pendingAwaitBySession.get(sessionId);
  const result = resolveUserContinue(normalized, pending?.choices);
  markAwaitUserResolved(sessionId, pending?.interruptId);
  const appendContinue = pending?.appendUserContinueMessage !== false;
  pendingAwaitBySession.delete(sessionId);
  if (appendContinue) {
    appendUserContinueMessage(sessionId, result);
  }
  waiter.resolve(result);
  continueWaiters.delete(sessionId);
}
function appendUserContinueMessage(sessionId, result) {
  const normalized = typeof result === "string" ? { userInput: result } : result ?? {};
  const content = formatUserContinueMessage(normalized);
  if (!content) return void 0;
  const session = querySession(sessionId);
  if (!session) return content;
  const userMsg = appendMessage(session, { role: "user", content });
  persistSession(session);
  emitAgentEvent({ type: "message", sessionId, message: userMsg });
  return content;
}
function queryGraphResumePayload(sessionId, result) {
  const normalized = typeof result === "string" ? { userInput: result } : result ?? {};
  const content = formatUserContinueMessage(normalized);
  return content ?? true;
}
function bindGraphSessionAbort(sessionId) {
  postGraphAbort(sessionId);
  const controller = new AbortController();
  abortMap.set(sessionId, controller);
  return controller;
}
function releaseGraphSessionAbort(sessionId) {
  abortMap.delete(sessionId);
}
async function waitForGraphUserContinue(sessionId, request, options) {
  const normalized = normalizeAwaitRequest(request);
  const interruptId = uuidv4();
  pendingAwaitBySession.set(sessionId, {
    reason: normalized.reason,
    choices: normalized.choices,
    interruptId,
    appendUserContinueMessage: normalized.appendUserContinueMessage !== false
  });
  if (!options?.skipPlaceholder) {
    appendAwaitUserPlaceholder(sessionId, { ...normalized, interruptId });
  }
  emitAgentEvent({
    type: "await_user",
    sessionId,
    reason: normalized.reason,
    choices: normalized.choices,
    interruptId
  });
  return new Promise((resolve, reject) => {
    continueWaiters.set(sessionId, { resolve, reject });
  });
}
async function waitForGraphUserResumeCommand(sessionId, reason) {
  const result = await waitForGraphUserContinue(sessionId, reason, { skipPlaceholder: true });
  return new langgraph.Command({ resume: queryGraphResumePayload(sessionId, result) });
}
function buildToolContext(sessionId, attachmentPaths, signal, fullAccess, capabilityBox) {
  const postActiveCapability = (capability) => {
    if (capabilityBox) {
      capabilityBox.current = capability;
    }
    const settings = querySettings();
    const connection = queryResolveModelConnection(settings, {
      role: "general",
      capability
    });
    emitAgentEvent({
      type: "model_switch",
      sessionId,
      capability,
      model: connection.model,
      connectionLabel: connection.label
    });
  };
  return {
    sessionId,
    fullAccess,
    attachmentPaths,
    signal,
    activeRole: "supervisor",
    agentName: "supervisor",
    skillInjectCtx: {
      sessionSkillIds: querySession(sessionId)?.selectedSkillIds ?? [],
      roleSkillIds: []
    },
    emitAwaitUser: async (reason, choices, options) => {
      return waitForGraphUserContinue(sessionId, {
        reason,
        choices,
        appendUserContinueMessage: options?.appendUserContinueMessage
      });
    },
    updateTasks: (updater) => {
      const current = querySession(sessionId);
      if (!current) return;
      current.tasks = updater(current.tasks);
      persistSession(current);
      emitAgentEvent({ type: "task_update", sessionId, tasks: current.tasks });
    },
    queryActiveCapability: capabilityBox ? () => capabilityBox.current || void 0 : void 0,
    postActiveCapability: capabilityBox ? postActiveCapability : void 0,
    emitToolProgress: (toolName, progress) => {
      emitAgentEvent({ type: "tool_progress", sessionId, toolName, progress });
    },
    // 工具内用户点「取消」：立即中止本会话 Agent，避免模型再次发起同类确认
    postAbortAgent: () => {
      postGraphAbort(sessionId);
    }
  };
}
function sessionToLcMessages(session) {
  const out = [];
  for (const m of session.messages) {
    if (m.role === "user") {
      out.push(queryProjectMessageWithoutImages(queryBuildHumanMessageFromStoredContent(m.content)));
      continue;
    }
    if (m.role === "assistant") {
      if (m.awaitMeta) continue;
      const reasoning = typeof m.thinkingContent === "string" && m.thinkingContent.trim() ? m.thinkingContent.trim() : void 0;
      if (m.toolCalls?.length) {
        out.push(
          new messages.AIMessage({
            content: m.content,
            tool_calls: m.toolCalls.map((tc) => ({
              id: tc.id,
              name: tc.name,
              args: tc.args,
              type: "tool_call"
            })),
            // DeepSeek thinking：带 tool_calls 的 assistant 必须在后续请求中回传 reasoning_content
            ...reasoning ? { additional_kwargs: { reasoning_content: reasoning } } : {}
          })
        );
      } else {
        out.push(
          new messages.AIMessage({
            content: m.content,
            ...reasoning ? { additional_kwargs: { reasoning_content: reasoning } } : {}
          })
        );
      }
      continue;
    }
    if (m.role === "tool") {
      if (!m.toolCallId) continue;
      out.push(
        new messages.ToolMessage({
          content: m.content,
          tool_call_id: m.toolCallId,
          name: m.toolName
        })
      );
    }
  }
  return sanitizeMessagesForModel(trimMessagesToCharBudget(out));
}
async function syncNewMessagesToSession(sessionId, prevCount, messages$1) {
  let session = querySession(sessionId);
  if (!session) return prevCount;
  const fresh = messages$1.slice(prevCount);
  for (const msg of fresh) {
    session = querySession(sessionId) ?? session;
    if (!session) break;
    if (messages.HumanMessage.isInstance(msg)) continue;
    await queryWaitThinkingSettled(sessionId);
    if (messages.ToolMessage.isInstance(msg)) {
      const content = typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content);
      const toolMsg = appendMessage(session, {
        role: "tool",
        content,
        toolName: msg.name,
        toolCallId: msg.tool_call_id
      });
      persistSession(session);
      emitAgentEvent({
        type: "tool_result",
        sessionId,
        toolName: msg.name || "tool",
        result: content
      });
      emitAgentEvent({ type: "message", sessionId, message: toolMsg });
      continue;
    }
    if (messages.isAIMessage(msg) || messages.AIMessage.isInstance(msg)) {
      const ai = msg;
      const content = typeof ai.content === "string" ? ai.content : Array.isArray(ai.content) ? ai.content.map((c) => "text" in c ? String(c.text) : "").join("") : String(ai.content ?? "");
      const reasoningRaw = ai.additional_kwargs?.reasoning_content;
      const thinkingContent = typeof reasoningRaw === "string" && reasoningRaw.trim() ? reasoningRaw.trim() : void 0;
      await queryWaitThinkingSettled(sessionId);
      if (ai.tool_calls?.length) {
        postThinkingReasoningComplete(sessionId);
        for (const tc of ai.tool_calls) {
          emitAgentEvent({
            type: "tool_start",
            sessionId,
            toolName: tc.name,
            args: tc.args
          });
        }
      }
      if (content.startsWith("[路由]")) continue;
      if (content.trim() || ai.tool_calls?.length) {
        const display = content.trim() || (ai.tool_calls?.length ? `调用工具: ${ai.tool_calls.map((t) => t.name).join(", ")}` : "");
        const toolCalls = ai.tool_calls?.filter((tc) => Boolean(tc.id) && Boolean(tc.name)).map((tc) => ({
          id: String(tc.id),
          name: String(tc.name),
          args: tc.args ?? {}
        }));
        const assistantMsg = appendMessage(session, {
          role: "assistant",
          content: display,
          ...thinkingContent ? { thinkingContent } : {},
          ...toolCalls?.length ? { toolCalls } : {}
        });
        persistSession(session);
        emitAgentEvent({ type: "message", sessionId, message: assistantMsg });
        if (content.trim()) {
          emitAgentEvent({ type: "text_delta", sessionId, delta: content });
        }
      }
    }
  }
  return messages$1.length;
}
function queryReasonFromInterruptValue(value) {
  if (typeof value === "string" && value.trim()) return value;
  if (value && typeof value === "object" && typeof value.reason === "string") {
    return value.reason;
  }
  return null;
}
function extractInterruptReason(err) {
  if (langgraph.isGraphInterrupt(err) || err instanceof langgraph.GraphInterrupt) {
    const interrupts = err.interrupts ?? [];
    for (const item of interrupts) {
      const reason = queryReasonFromInterruptValue(item?.value);
      if (reason) return reason;
    }
    return "需要用户确认后继续";
  }
  return null;
}
function queryInterruptReasonFromChunk(chunk) {
  if (!langgraph.isInterrupted(chunk)) return null;
  const list = chunk[langgraph.INTERRUPT] ?? [];
  for (const item of list) {
    const reason = queryReasonFromInterruptValue(item?.value);
    if (reason) return reason;
  }
  return "需要用户确认后继续";
}
function queryInterruptReasonFromState(state) {
  const fromValues = queryInterruptReasonFromChunk(state.values);
  if (fromValues) return fromValues;
  const tasks = state.tasks ?? [];
  for (const task of tasks) {
    for (const item of task.interrupts ?? []) {
      const reason = queryReasonFromInterruptValue(item?.value);
      if (reason) return reason;
    }
  }
  return null;
}
function queryHasDanglingToolCalls(messages$1) {
  for (let i = messages$1.length - 1; i >= 0; i--) {
    const msg = messages$1[i];
    if (messages.ToolMessage.isInstance(msg)) return false;
    if (messages.isAIMessage(msg) || messages.AIMessage.isInstance(msg)) {
      const ai = msg;
      return Boolean(ai.tool_calls?.length);
    }
  }
  return false;
}
async function runLangGraphChat(params) {
  const { sessionId, content, attachmentPaths = [] } = params;
  const settings = querySettings();
  let session = querySession(sessionId);
  if (!session) throw new Error(`会话不存在: ${sessionId}`);
  const controller = bindGraphSessionAbort(sessionId);
  const enrichedContent = await queryEnrichContentWithLocalOcr(content, attachmentPaths);
  const userMsg = appendMessage(session, {
    role: "user",
    // enriched 已含 OCR + [附件] 路径列表
    content: enrichedContent,
    attachmentPaths: attachmentPaths.length > 0 ? attachmentPaths : void 0
  });
  if (session.title === "新对话" || session.title === "新会话") {
    session.title = content.slice(0, 24) || "新对话";
  }
  persistSession(session);
  emitAgentEvent({ type: "message", sessionId, message: userMsg });
  const capabilityBox = { current: "" };
  const toolCtx = buildToolContext(
    sessionId,
    attachmentPaths,
    controller.signal,
    settings.fullAccess,
    capabilityBox
  );
  let graph;
  try {
    graph = buildChatGraph({
      settings,
      toolCtx,
      capabilityBox,
      onModelResolved: ({ capability, model, connectionLabel }) => {
        emitAgentEvent({
          type: "model_switch",
          sessionId,
          capability,
          model,
          connectionLabel
        });
      }
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    postEmitAgentError(sessionId, message, {
      roleId: toolCtx.activeRole ?? "supervisor",
      agentName: toolCtx.agentName ?? "supervisor",
      capability: toolCtx.queryActiveCapability?.()
    });
    emitAgentEvent({ type: "done", sessionId, reason: "error" });
    abortMap.delete(sessionId);
    return;
  }
  const history2 = sessionToLcMessages(querySession(sessionId));
  const prior = history2.slice(0, -1);
  const human = queryBuildHumanMessageFromStoredContent(enrichedContent);
  const config = {
    configurable: { thread_id: sessionId },
    recursionLimit: queryRecursionLimit(settings.maxTurns),
    signal: controller.signal
  };
  const checkpointSnap = await graph.getState(config);
  const checkpointMessages = checkpointSnap.values && typeof checkpointSnap.values === "object" && "messages" in checkpointSnap.values ? checkpointSnap.values.messages ?? [] : [];
  const hasCheckpoint = checkpointMessages.length > 0;
  let synced = hasCheckpoint ? checkpointMessages.length : prior.length;
  let input = {
    messages: hasCheckpoint ? [human] : [...prior, human],
    sessionId,
    attachmentPaths,
    activeAgent: "supervisor",
    nextAgent: "general",
    activeCapability: ""
  };
  let lastGraphMessages = hasCheckpoint ? checkpointMessages : [...prior, human];
  try {
    while (true) {
      if (controller.signal.aborted) {
        postResetThinkingGate(sessionId);
        emitAgentEvent({ type: "done", sessionId, reason: "aborted" });
        return;
      }
      let resumeCommand = null;
      try {
        const stream2 = await graph.stream(input, {
          ...config,
          streamMode: "values"
        });
        for await (const state of stream2) {
          if (controller.signal.aborted) {
            postResetThinkingGate(sessionId);
            emitAgentEvent({ type: "done", sessionId, reason: "aborted" });
            return;
          }
          const chunkReason = queryInterruptReasonFromChunk(state);
          if (chunkReason) {
            resumeCommand = await waitForGraphUserResumeCommand(sessionId, chunkReason);
            if (controller.signal.aborted) {
              postResetThinkingGate(sessionId);
              emitAgentEvent({ type: "done", sessionId, reason: "aborted" });
              return;
            }
            break;
          }
          if (state && typeof state === "object" && "messages" in state) {
            const s = state;
            lastGraphMessages = s.messages;
            synced = await syncNewMessagesToSession(sessionId, synced, s.messages);
            if (s.activeAgent) {
              emitAgentEvent({ type: "agent_role", sessionId, role: s.activeAgent });
            }
          }
        }
        if (resumeCommand) {
          input = resumeCommand;
          continue;
        }
      } catch (streamErr) {
        const reason = extractInterruptReason(streamErr);
        if (reason) {
          const cmd = await waitForGraphUserResumeCommand(sessionId, reason);
          if (controller.signal.aborted) {
            postResetThinkingGate(sessionId);
            emitAgentEvent({ type: "done", sessionId, reason: "aborted" });
            return;
          }
          input = cmd;
          continue;
        }
        throw streamErr;
      }
      const snap = await graph.getState(config);
      const interruptReason = queryInterruptReasonFromState(snap);
      if (interruptReason) {
        const cmd = await waitForGraphUserResumeCommand(sessionId, interruptReason);
        if (controller.signal.aborted) {
          postResetThinkingGate(sessionId);
          emitAgentEvent({ type: "done", sessionId, reason: "aborted" });
          return;
        }
        input = cmd;
        continue;
      }
      const finalMessages = snap.values && typeof snap.values === "object" && "messages" in snap.values ? snap.values.messages ?? [] : [];
      if (finalMessages.length) lastGraphMessages = finalMessages;
      if (queryHasDanglingToolCalls(finalMessages)) {
        postEmitAgentError(sessionId, "工具调用未完成（可能登录确认被中断），请重试本轮", {
          roleId: toolCtx.activeRole,
          agentName: toolCtx.agentName,
          capability: toolCtx.queryActiveCapability?.(),
          messages: finalMessages
        });
        postResetThinkingGate(sessionId);
        emitAgentEvent({ type: "done", sessionId, reason: "error" });
        return;
      }
      await queryWaitThinkingSettled(sessionId);
      emitAgentEvent({ type: "done", sessionId, reason: "end_turn" });
      postResetThinkingGate(sessionId);
      return;
    }
  } catch (e) {
    if (controller.signal.aborted || queryIsAgentUserCancelledError(e) || queryIsAbortError(e)) {
      postResetThinkingGate(sessionId);
      emitAgentEvent({ type: "done", sessionId, reason: "aborted" });
      return;
    }
    const message = e instanceof Error ? e.message : String(e);
    if (/recursion/i.test(message)) {
      postEmitAgentError(sessionId, "达到最大工具轮次", {
        roleId: toolCtx.activeRole,
        agentName: toolCtx.agentName,
        capability: toolCtx.queryActiveCapability?.(),
        messages: lastGraphMessages
      });
      postResetThinkingGate(sessionId);
      emitAgentEvent({ type: "done", sessionId, reason: "max_turns" });
      return;
    }
    postEmitAgentError(sessionId, message, {
      roleId: toolCtx.activeRole,
      agentName: toolCtx.agentName,
      capability: toolCtx.queryActiveCapability?.(),
      messages: lastGraphMessages
    });
    postResetThinkingGate(sessionId);
    emitAgentEvent({ type: "done", sessionId, reason: "error" });
  } finally {
    abortMap.delete(sessionId);
  }
}
async function runLangGraphStep(params) {
  const { sessionId, prompt, toolWhitelist, attachmentPaths = [], hideFromUi = false } = params;
  const settings = querySettings();
  let session = querySession(sessionId);
  if (!session) throw new Error(`会话不存在: ${sessionId}`);
  let controller = abortMap.get(sessionId);
  if (!controller || controller.signal.aborted) {
    controller = new AbortController();
    abortMap.set(sessionId, controller);
  }
  const enrichedPrompt = await queryEnrichContentWithLocalOcr(prompt, attachmentPaths);
  const userMsg = appendMessage(session, {
    role: "user",
    content: enrichedPrompt,
    attachmentPaths: attachmentPaths.length > 0 ? attachmentPaths : void 0,
    // 过程注入 prompt：落盘但不在用户侧气泡展示
    ...hideFromUi ? { hidden: true } : {}
  });
  persistSession(session);
  emitAgentEvent({ type: "message", sessionId, message: userMsg });
  const capabilityBox = { current: "" };
  const toolCtx = buildToolContext(
    sessionId,
    attachmentPaths,
    controller.signal,
    true,
    capabilityBox
  );
  const skillCtx = {
    sessionSkillIds: session.selectedSkillIds ?? [],
    roleSkillIds: settings.roleSkillIds?.general ?? []
  };
  toolCtx.skillInjectCtx = skillCtx;
  let agent;
  try {
    agent = buildStepReactGraph({
      settings,
      toolCtx,
      systemPrompt: buildRoleSystemPrompt("general", void 0, {
        ...settings,
        fullAccess: true
      }, skillCtx),
      toolWhitelist,
      stepPrompt: prompt,
      attachmentPaths,
      capabilityBox,
      onModelResolved: ({ capability, model, connectionLabel }) => {
        emitAgentEvent({
          type: "model_switch",
          sessionId,
          capability,
          model,
          connectionLabel
        });
      }
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    postEmitAgentError(sessionId, message, {
      roleId: toolCtx.activeRole ?? "general",
      agentName: toolCtx.agentName ?? "workflow_step_agent",
      capability: toolCtx.queryActiveCapability?.()
    });
    return "error";
  }
  const threadId = `${sessionId}:step:${uuidv4()}`;
  const config = {
    configurable: { thread_id: threadId },
    recursionLimit: queryRecursionLimit(settings.maxTurns),
    signal: controller.signal
  };
  const human = queryBuildHumanMessageFromStoredContent(enrichedPrompt);
  let synced = 0;
  let input = { messages: [human] };
  let lastStepMessages = [human];
  try {
    while (true) {
      if (controller.signal.aborted) {
        postResetThinkingGate(sessionId);
        return "aborted";
      }
      let resumeCommand = null;
      try {
        const stream2 = await agent.stream(input, {
          ...config,
          streamMode: "values"
        });
        for await (const state of stream2) {
          if (controller.signal.aborted) {
            postResetThinkingGate(sessionId);
            return "aborted";
          }
          const chunkReason = queryInterruptReasonFromChunk(state);
          if (chunkReason) {
            resumeCommand = await waitForGraphUserResumeCommand(sessionId, chunkReason);
            if (controller.signal.aborted) {
              postResetThinkingGate(sessionId);
              return "aborted";
            }
            break;
          }
          if (state && typeof state === "object" && "messages" in state) {
            const messages2 = state.messages;
            lastStepMessages = messages2;
            synced = await syncNewMessagesToSession(sessionId, synced, messages2);
          }
        }
        if (resumeCommand) {
          input = resumeCommand;
          continue;
        }
      } catch (streamErr) {
        const reason = extractInterruptReason(streamErr);
        if (reason) {
          const cmd = await waitForGraphUserResumeCommand(sessionId, reason);
          if (controller.signal.aborted) {
            postResetThinkingGate(sessionId);
            return "aborted";
          }
          input = cmd;
          continue;
        }
        throw streamErr;
      }
      const snap = await agent.getState(config);
      const interruptReason = queryInterruptReasonFromState(snap);
      if (interruptReason) {
        const cmd = await waitForGraphUserResumeCommand(sessionId, interruptReason);
        if (controller.signal.aborted) {
          postResetThinkingGate(sessionId);
          return "aborted";
        }
        input = cmd;
        continue;
      }
      const finalMessages = snap.values && typeof snap.values === "object" && "messages" in snap.values ? snap.values.messages ?? [] : [];
      if (finalMessages.length) lastStepMessages = finalMessages;
      if (queryHasDanglingToolCalls(finalMessages)) {
        postEmitAgentError(
          sessionId,
          "发布工具调用未完成（常见于抖音登录等待被当作步骤结束）。请重新执行该发布步骤。",
          {
            roleId: toolCtx.activeRole,
            agentName: toolCtx.agentName,
            capability: toolCtx.queryActiveCapability?.(),
            messages: finalMessages
          }
        );
        postResetThinkingGate(sessionId);
        return "error";
      }
      await queryWaitThinkingSettled(sessionId);
      postResetThinkingGate(sessionId);
      return "completed";
    }
  } catch (e) {
    if (controller.signal.aborted || queryIsAgentUserCancelledError(e) || queryIsAbortError(e)) {
      postResetThinkingGate(sessionId);
      return "aborted";
    }
    const message = e instanceof Error ? e.message : String(e);
    if (/recursion/i.test(message)) {
      postResetThinkingGate(sessionId);
      return "max_turns";
    }
    postEmitAgentError(sessionId, message, {
      roleId: toolCtx.activeRole,
      agentName: toolCtx.agentName,
      capability: toolCtx.queryActiveCapability?.(),
      messages: lastStepMessages
    });
    postResetThinkingGate(sessionId);
    return "error";
  }
}
function tokenize(src) {
  const tokens = [];
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (/\s/.test(ch)) {
      i += 1;
      continue;
    }
    if (ch === "(") {
      tokens.push({ kind: "lp" });
      i += 1;
      continue;
    }
    if (ch === ")") {
      tokens.push({ kind: "rp" });
      i += 1;
      continue;
    }
    if (ch === ".") {
      tokens.push({ kind: "dot" });
      i += 1;
      continue;
    }
    if (ch === '"' || ch === "'") {
      const quote = ch;
      let j = i + 1;
      let out = "";
      while (j < src.length && src[j] !== quote) {
        if (src[j] === "\\" && j + 1 < src.length) {
          out += src[j + 1];
          j += 2;
          continue;
        }
        out += src[j];
        j += 1;
      }
      if (j >= src.length) return { error: "表达式字符串未闭合" };
      tokens.push({ kind: "str", value: out });
      i = j + 1;
      continue;
    }
    if (/[0-9]/.test(ch) || ch === "-" && /[0-9]/.test(src[i + 1] ?? "")) {
      let j = i + (ch === "-" ? 1 : 0);
      while (j < src.length && /[0-9.]/.test(src[j])) j += 1;
      const num = Number(src.slice(i, j));
      if (Number.isNaN(num)) return { error: `非法数字: ${src.slice(i, j)}` };
      tokens.push({ kind: "num", value: num });
      i = j;
      continue;
    }
    if (/[a-zA-Z_]/.test(ch)) {
      let j = i + 1;
      while (j < src.length && /[a-zA-Z0-9_]/.test(src[j])) j += 1;
      const word = src.slice(i, j);
      if (word === "true") tokens.push({ kind: "bool", value: true });
      else if (word === "false") tokens.push({ kind: "bool", value: false });
      else tokens.push({ kind: "ident", value: word });
      i = j;
      continue;
    }
    const two = src.slice(i, i + 2);
    if (["==", "!=", ">=", "<=", "&&", "||"].includes(two)) {
      tokens.push({ kind: "op", value: two });
      i += 2;
      continue;
    }
    if ([">", "<", "!"].includes(ch)) {
      tokens.push({ kind: "op", value: ch });
      i += 1;
      continue;
    }
    return { error: `表达式含非法字符: ${ch}` };
  }
  return tokens;
}
class Parser {
  constructor(tokens, context) {
    this.tokens = tokens;
    this.context = context;
    this.pos = 0;
  }
  peek() {
    return this.tokens[this.pos];
  }
  take() {
    return this.tokens[this.pos++];
  }
  parse() {
    try {
      const v = this.parseOr();
      if (this.pos < this.tokens.length) return { error: "表达式存在多余内容" };
      return { value: v };
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) };
    }
  }
  parseOr() {
    let left = this.parseAnd();
    while (this.peek()?.kind === "op" && this.peek().value === "||") {
      this.take();
      const right = this.parseAnd();
      left = Boolean(left) || Boolean(right);
    }
    return left;
  }
  parseAnd() {
    let left = this.parseCompare();
    while (this.peek()?.kind === "op" && this.peek().value === "&&") {
      this.take();
      const right = this.parseCompare();
      left = Boolean(left) && Boolean(right);
    }
    return left;
  }
  parseCompare() {
    let left = this.parseUnary();
    const opTok = this.peek();
    if (opTok?.kind === "op" && ["==", "!=", ">", ">=", "<", "<="].includes(opTok.value)) {
      this.take();
      const right = this.parseUnary();
      return queryCompare(left, opTok.value, right);
    }
    return left;
  }
  parseUnary() {
    if (this.peek()?.kind === "op" && this.peek().value === "!") {
      this.take();
      return !this.parseUnary();
    }
    return this.parsePrimary();
  }
  parsePrimary() {
    const t = this.take();
    if (!t) throw new Error("表达式不完整");
    if (t.kind === "num" || t.kind === "str" || t.kind === "bool") return t.value;
    if (t.kind === "lp") {
      const inner = this.parseOr();
      if (this.take()?.kind !== "rp") throw new Error("缺少右括号");
      return inner;
    }
    if (t.kind === "ident") {
      if (t.value !== "context") {
        throw new Error(`仅允许 context.字段，得到: ${t.value}`);
      }
      if (this.take()?.kind !== "dot") throw new Error("context 后须接 .字段名");
      const field = this.take();
      if (field?.kind !== "ident") throw new Error("context. 后须为标识符");
      if (this.peek()?.kind === "dot") {
        throw new Error("不允许 context.a.b 多层属性访问");
      }
      return this.context[field.value];
    }
    throw new Error("非法表达式主项");
  }
}
function queryCompare(left, op, right) {
  if (op === "==") return queryLooseEqual(left, right);
  if (op === "!=") return !queryLooseEqual(left, right);
  const ln = Number(left);
  const rn = Number(right);
  if (Number.isNaN(ln) || Number.isNaN(rn)) return false;
  if (op === ">") return ln > rn;
  if (op === ">=") return ln >= rn;
  if (op === "<") return ln < rn;
  if (op === "<=") return ln <= rn;
  return false;
}
function queryLooseEqual(a, b) {
  if (a === b) return true;
  const na = Number(a);
  const nb = Number(b);
  if (typeof a !== "boolean" && typeof b !== "boolean" && a !== "" && b !== "" && !Number.isNaN(na) && !Number.isNaN(nb)) {
    return na === nb;
  }
  return String(a) === String(b);
}
function queryEvaluateExpression(expression, context) {
  const tokens = tokenize(expression.trim());
  if ("error" in tokens) return tokens;
  if (!tokens.length) return { error: "表达式为空" };
  return new Parser(tokens, context).parse();
}
function queryFormWhen(when, context) {
  const key = (when.contextKey ?? "").trim();
  if (!key) return { error: "请填写 context 字段名" };
  const raw = context[key];
  const op = when.op ?? "truthy";
  if (op === "truthy") return { value: Boolean(raw) };
  if (op === "falsy") return { value: !raw };
  if (op === "eq") return { value: queryLooseEqual(raw, when.value) };
  if (op === "neq") return { value: !queryLooseEqual(raw, when.value) };
  return { error: `未知运算符: ${op}` };
}
function queryEvaluateWhen(when, context) {
  if (!when) return { error: "未配置条件" };
  const expr = when.expression?.trim();
  if (expr) return queryEvaluateExpression(expr, context);
  return queryFormWhen(when, context);
}
function queryPickDefault(node) {
  if (node.defaultKey && node.cases.some((c) => c.key === node.defaultKey)) {
    return { key: node.defaultKey };
  }
  return { error: "条件无匹配分支且未配置默认支路" };
}
function queryConditionCaseKeys(node, context, agentSelectedKey) {
  if (!node.cases.length) return { error: "条件节点没有任何分支" };
  if (node.mode === "agent") {
    const raw = (agentSelectedKey ?? "").trim();
    if (node.cases.some((c) => c.key === raw)) return { keys: [raw] };
    const def2 = queryPickDefault(node);
    if ("error" in def2) return def2;
    return { keys: [def2.key] };
  }
  const matchAll = node.matchMode === "all";
  const edged = node.cases.filter((c) => c.when != null);
  if (edged.length > 0) {
    const matched = [];
    for (const c of edged) {
      const evaluated2 = queryEvaluateWhen(c.when, context);
      if ("error" in evaluated2) {
        return { error: `分支「${c.label || c.key}」：${evaluated2.error}` };
      }
      if (evaluated2.value) {
        matched.push(c.key);
        if (!matchAll) break;
      }
    }
    if (matched.length) return { keys: matched };
    if (matchAll && !node.defaultKey) return { keys: [] };
    const def2 = queryPickDefault(node);
    if ("error" in def2) return def2;
    return { keys: [def2.key] };
  }
  const evaluated = queryEvaluateWhen(node.when, context);
  if ("error" in evaluated) return evaluated;
  const v = evaluated.value;
  const keys = new Set(node.cases.map((c) => c.key));
  if (typeof v === "boolean" && keys.has(String(v))) {
    return { keys: [String(v)] };
  }
  if (typeof v === "string" || typeof v === "number") {
    const asKey = String(v);
    if (keys.has(asKey)) return { keys: [asKey] };
  }
  if (keys.has("true") && keys.has("false")) {
    return { keys: [v ? "true" : "false"] };
  }
  const def = queryPickDefault(node);
  if ("error" in def) return def;
  return { keys: [def.key] };
}
function queryParseCollectJsonPatch(text) {
  const trimmed = (text ?? "").trim();
  if (!trimmed) return { error: "数据采集 Agent 未返回内容" };
  const tryParse = (raw) => {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  };
  const direct = tryParse(trimmed);
  if (direct) return { patch: direct };
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence?.[1]) {
    const fromFence = tryParse(fence[1].trim());
    if (fromFence) return { patch: fromFence };
  }
  const brace = trimmed.match(/\{[\s\S]*\}/);
  if (brace?.[0]) {
    const fromBrace = tryParse(brace[0]);
    if (fromBrace) return { patch: fromBrace };
  }
  return {
    error: `数据采集结果不是合法 JSON 对象：${trimmed.slice(0, 200)}`
  };
}
function queryMergeCollectPatchToContext(context, patch) {
  const next = { ...context };
  for (const [key, value] of Object.entries(patch)) {
    const k = key.trim();
    if (!k) continue;
    if (value == null) {
      next[k] = "";
      continue;
    }
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      next[k] = String(value);
      continue;
    }
    next[k] = JSON.stringify(value);
  }
  return next;
}
function interpolateDeep(value, context) {
  if (typeof value === "string") {
    return value.replace(/\{\{(\w+)\}\}/g, (_full, key) => {
      if (!(key in context)) {
        throw new Error(`缺少上下文变量: ${key}`);
      }
      const v = context[key];
      if (v == null) return "";
      return typeof v === "string" ? v : JSON.stringify(v);
    });
  }
  if (Array.isArray(value)) {
    return value.map((item) => interpolateDeep(item, context));
  }
  if (value && typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = interpolateDeep(v, context);
    }
    return out;
  }
  return value;
}
const WORKFLOW_NODE_EXECUTIONS_KEY = "__nodeExecutions__";
const WORKFLOW_INTERNAL_CONTEXT_KEYS = /* @__PURE__ */ new Set([
  WORKFLOW_NODE_EXECUTIONS_KEY,
  "__branchKeys"
]);
function queryNodeExecutions(context) {
  const raw = context?.[WORKFLOW_NODE_EXECUTIONS_KEY];
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  return raw;
}
function queryNodeExecution(context, nodeId) {
  return queryNodeExecutions(context)[nodeId];
}
function queryContextSnapshotForDisplay(context) {
  const snapshot = {};
  for (const [key, value] of Object.entries(context)) {
    if (WORKFLOW_INTERNAL_CONTEXT_KEYS.has(key)) continue;
    snapshot[key] = value;
  }
  return snapshot;
}
function queryContextOutputDiff(before, after) {
  const output = {};
  for (const [key, value] of Object.entries(after)) {
    if (WORKFLOW_INTERNAL_CONTEXT_KEYS.has(key)) continue;
    const prev = before[key];
    if (!(key in before) || JSON.stringify(prev) !== JSON.stringify(value)) {
      output[key] = value;
    }
  }
  return output;
}
function patchNodeExecution(context, record) {
  const prev = queryNodeExecutions(context);
  return {
    ...context,
    [WORKFLOW_NODE_EXECUTIONS_KEY]: {
      ...prev,
      [record.nodeId]: record
    }
  };
}
function patchContextWithNodeExecution(beforeContext, afterContext, node, input, outputOverride, messageRange) {
  const record = {
    nodeId: node.id,
    nodeType: node.type,
    title: node.title,
    contextSnapshot: queryContextSnapshotForDisplay(beforeContext),
    input,
    output: outputOverride ?? queryContextOutputDiff(beforeContext, afterContext),
    executedAt: Date.now(),
    ...messageRange ? { messageRange } : {}
  };
  return patchNodeExecution(afterContext, record);
}
function queryMessagesForNodeExecution(messages2, record) {
  if (!record?.messageRange) return [];
  const { from, to } = record.messageRange;
  if (from < 0 || to <= from || from >= messages2.length) return [];
  return messages2.slice(from, Math.min(to, messages2.length));
}
function patchContextWithSkippedNode(context, node, reason) {
  const record = {
    nodeId: node.id,
    nodeType: node.type,
    title: node.title,
    contextSnapshot: queryContextSnapshotForDisplay(context),
    input: {},
    output: { skipped: true, reason },
    executedAt: Date.now()
  };
  return patchNodeExecution(context, record);
}
function mergeParallelNodeContexts(base2, childContexts) {
  let merged = { ...base2 };
  const executions = { ...queryNodeExecutions(base2) };
  for (const ctx of childContexts) {
    for (const [key, value] of Object.entries(ctx)) {
      if (WORKFLOW_INTERNAL_CONTEXT_KEYS.has(key)) continue;
      merged[key] = value;
    }
    Object.assign(executions, queryNodeExecutions(ctx));
  }
  return {
    ...merged,
    [WORKFLOW_NODE_EXECUTIONS_KEY]: executions
  };
}
const runningBySession = /* @__PURE__ */ new Set();
function querySessionMessageLength(sessionId) {
  return querySession(sessionId)?.messages.length ?? 0;
}
function logWorkflowNodeInput(label, node, context, resolvedInput) {
  console.log(
    `[workflow] ${label}`,
    JSON.stringify(
      {
        nodeId: node.id,
        nodeType: node.type,
        title: node.title,
        context,
        ...resolvedInput !== void 0 ? { resolvedInput } : {}
      },
      null,
      2
    )
  );
}
function emitTaskUpdate(sessionId, tasks) {
  const win = getMainWindow();
  if (win && !win.isDestroyed()) {
    win.webContents.send("event:agent", { type: "task_update", sessionId, tasks });
  }
}
function emitDone(sessionId, reason) {
  const event = { type: "done", sessionId, reason };
  const win = getMainWindow();
  if (win && !win.isDestroyed()) {
    win.webContents.send("event:agent", event);
  }
  handleScheduleAgentDone(event);
}
function emitError(sessionId, message) {
  const win = getMainWindow();
  if (win && !win.isDestroyed()) {
    win.webContents.send("event:agent", { type: "error", sessionId, message });
  }
}
function emitToolStart(sessionId, toolName, args) {
  const win = getMainWindow();
  if (win && !win.isDestroyed()) {
    win.webContents.send("event:agent", { type: "tool_start", sessionId, toolName, args });
  }
}
function emitToolResult(sessionId, toolName, result) {
  const win = getMainWindow();
  if (win && !win.isDestroyed()) {
    win.webContents.send("event:agent", { type: "tool_result", sessionId, toolName, result });
  }
}
function emitMessage(sessionId, message) {
  const win = getMainWindow();
  if (win && !win.isDestroyed()) {
    win.webContents.send("event:agent", { type: "message", sessionId, message });
  }
}
function emitWorkflowToast(sessionId, level, content) {
  const win = getMainWindow();
  if (win && !win.isDestroyed()) {
    win.webContents.send("event:agent", {
      type: "workflow_toast",
      sessionId,
      level,
      content
    });
  }
}
function appendWorkflowMessage(session, msg) {
  const latest = querySession(session.id);
  if (latest) {
    session.messages = latest.messages;
    session.tasks = latest.tasks;
    session.title = latest.title;
    session.tokenUsed = latest.tokenUsed;
  }
  const full = {
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    ...msg
  };
  session.messages.push(full);
  session.updatedAt = Date.now();
  postSession(session);
  emitMessage(session.id, full);
  return full;
}
function flattenTaskSpecs(nodes) {
  const specs = [];
  for (const node of nodes) {
    if (node.type === "parallel") {
      specs.push({ id: node.id, title: node.title });
      for (const child of node.children) {
        specs.push({ id: child.id, title: child.title, parentId: node.id });
      }
    } else if (node.type === "condition") {
      specs.push({ id: node.id, title: node.title });
      for (const arm of node.cases) {
        for (const child of arm.nodes) {
          specs.push({ id: child.id, title: child.title, parentId: node.id });
        }
      }
    } else if (node.type === "start" || node.type === "end") {
      specs.push({ id: node.id, title: node.title });
    } else {
      specs.push({ id: node.id, title: node.title });
    }
  }
  return specs;
}
function buildTasks(specs, statusMap) {
  return specs.map((s) => ({
    id: s.id,
    title: s.title,
    status: statusMap.get(s.id) ?? "pending",
    parentId: s.parentId
  }));
}
function persistSessionTasks(session, tasks) {
  const latest = querySession(session.id);
  if (latest) {
    session.messages = latest.messages;
    session.title = latest.title;
    session.tokenUsed = latest.tokenUsed;
  }
  session.tasks = tasks;
  session.updatedAt = Date.now();
  postSession(session);
  emitTaskUpdate(session.id, tasks);
}
function patchRun(run, patch) {
  return postWorkflowRun({ ...run, ...patch, updatedAt: Date.now() });
}
function createWorkflowSession(workflow) {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    title: formatRunSessionTitle("[流程]", workflow.title, now),
    messages: [],
    tasks: [],
    type: "workflow",
    tokenUsed: 0,
    createdAt: now,
    updatedAt: now
  };
}
async function executeToolNode(session, node, context, onAwaitUser) {
  const beforeContext = context;
  const sessionId = session.id;
  const messageFrom = querySessionMessageLength(sessionId);
  const tool = getToolByName(node.toolName);
  if (!tool) {
    throw new Error(`未知工具: ${node.toolName}`);
  }
  logWorkflowNodeInput("工具节点 · 上下文", node, context);
  const args = interpolateDeep(node.argsTemplate, context);
  logWorkflowNodeInput("工具节点 · 参数已解析", node, context, args);
  emitToolStart(sessionId, node.toolName, args);
  const toolCtx = {
    sessionId,
    // 工作流 tool 节点与 agent 步一致：跳过敏感确认；未登录仍暂停
    fullAccess: true,
    attachmentPaths: [],
    emitAwaitUser: async (reason, choices) => {
      if (onAwaitUser) await onAwaitUser();
      return waitForGraphUserContinue(
        sessionId,
        { reason, choices },
        { skipPlaceholder: true }
      );
    },
    updateTasks: () => {
    },
    // Remotion 等工具确认取消时中止整次 Run
    postAbortAgent: () => {
      postGraphAbort(sessionId);
    }
  };
  let rawResult;
  try {
    rawResult = await tool.execute(args, toolCtx);
  } catch (err) {
    if (queryIsAgentUserCancelledError(err)) {
      throw new Error("__aborted__");
    }
    rawResult = `工具执行失败: ${err instanceof Error ? err.message : String(err)}`;
    emitToolResult(sessionId, node.toolName, rawResult);
    appendWorkflowMessage(session, {
      role: "tool",
      toolName: node.toolName,
      content: rawResult
    });
    throw new Error(rawResult);
  }
  const decoded = queryDecodeWorkflowToolResult(rawResult);
  emitToolResult(sessionId, node.toolName, decoded.message);
  appendWorkflowMessage(session, {
    role: "tool",
    toolName: node.toolName,
    content: decoded.message
  });
  const nextContext = queryMergeToolResultToContext(context, decoded, {
    outputKeys: node.outputKeys,
    toolName: node.toolName
  });
  return patchContextWithNodeExecution(
    beforeContext,
    nextContext,
    node,
    {
      toolName: node.toolName,
      args
    },
    void 0,
    { from: messageFrom, to: querySessionMessageLength(sessionId) }
  );
}
async function executeNotifyNode(session, node, context) {
  const beforeContext = context;
  const messageFrom = querySessionMessageLength(session.id);
  const targets = queryNotifyTargets(node);
  const wantsChannel = queryNotifyHasChannel(node);
  const wantsToast = queryNotifyHasToast(node);
  logWorkflowNodeInput("通知节点 · 上下文", node, context, { targets });
  const content = interpolatePromptSoft(node.contentTemplate, context).trim();
  const display = content || "（空通知）";
  const summaries = [];
  let nextContext = { ...context };
  const output = {};
  if (wantsToast) {
    const level = node.toastLevel ?? "info";
    logWorkflowNodeInput("通知节点 · Toast 内容已解析", node, context, { content: display });
    emitWorkflowToast(session.id, level, display);
    summaries.push(`Toast：${display}`);
    if (node.outputKeys?.length) {
      for (const key of node.outputKeys) {
        nextContext[key] = display;
        output[key] = display;
      }
    } else {
      nextContext[`toast_${node.id}`] = display;
      output[`toast_${node.id}`] = display;
    }
  }
  if (!wantsChannel) {
    const summary2 = summaries.join("；") || display;
    appendWorkflowMessage(session, {
      role: "assistant",
      content: `【${node.title}】${summary2}`
    });
    return {
      context: patchContextWithNodeExecution(
        beforeContext,
        nextContext,
        node,
        { targets, content: display },
        output,
        { from: messageFrom, to: querySessionMessageLength(session.id) }
      ),
      summary: summary2
    };
  }
  const channelId = (node.channelId ?? "").trim() || "feishu";
  const title = node.titleTemplate ? interpolatePromptSoft(node.titleTemplate, context) : void 0;
  const msgType = queryFeishuMsgType({
    msgType: node.msgType,
    richText: node.richText,
    channelId
  });
  const imageKey = node.imageKey ? interpolatePromptSoft(node.imageKey, context).trim() || void 0 : void 0;
  const shareChatId = node.shareChatId ? interpolatePromptSoft(node.shareChatId, context).trim() || void 0 : void 0;
  logWorkflowNodeInput("通知节点 · 渠道内容已解析", node, context, {
    channelId,
    title,
    content,
    msgType,
    imageKey,
    shareChatId
  });
  const nodeInput = {
    targets,
    channelId,
    title,
    content,
    msgType,
    imageKey,
    shareChatId
  };
  const needsContent = msgType === "text" || msgType === "post";
  if (needsContent && !content) {
    const msg = "通知正文为空，请检查 contentTemplate 或上游 outputKeys";
    appendWorkflowMessage(session, {
      role: "assistant",
      content: `【${node.title}】${msg}`
    });
    if (node.failSoft === false) {
      throw new Error(msg);
    }
    return {
      context: patchContextWithNodeExecution(beforeContext, context, node, nodeInput, { error: msg }),
      summary: msg
    };
  }
  const resolvedTitle = title?.trim() || (msgType === "post" ? queryMarkdownHeadingTitle(content) : void 0);
  const result = await postNotifyMessage({
    channelId,
    title: resolvedTitle,
    content,
    msgType,
    imageKey,
    shareChatId
  });
  const channelSummary = result.ok ? result.deduped ? `通知已去重跳过（${channelId}）` : `通知已发送至 ${channelId}` : `通知发送失败：${result.error}`;
  summaries.push(channelSummary);
  if (!result.ok && node.failSoft === false) {
    throw new Error(channelSummary);
  }
  const notifyRecord = { summary: channelSummary };
  if (result.request?.requestPath) {
    notifyRecord.requestPath = result.request.requestPath;
  }
  if (result.request?.requestBody) {
    notifyRecord.requestBody = result.request.requestBody;
  }
  if (result.request?.requestHeaders && Object.keys(result.request.requestHeaders).length > 0) {
    notifyRecord.requestHeaders = result.request.requestHeaders;
  }
  if (result.ok && result.deduped) {
    notifyRecord.deduped = true;
  }
  if (node.outputKeys?.length) {
    const outVal = summaries.join("；");
    for (const key of node.outputKeys) {
      nextContext[key] = outVal;
      output[key] = outVal;
    }
  } else {
    nextContext[`notify_${node.id}`] = notifyRecord;
    output[`notify_${node.id}`] = notifyRecord;
  }
  const summary = summaries.join("；");
  appendWorkflowMessage(session, {
    role: "assistant",
    content: `【${node.title}】${summary}`
  });
  return {
    context: patchContextWithNodeExecution(
      beforeContext,
      nextContext,
      node,
      nodeInput,
      output,
      { from: messageFrom, to: querySessionMessageLength(session.id) }
    ),
    summary
  };
}
async function executeToastNode(session, node, context) {
  const legacy = {
    id: node.id,
    type: "notify",
    title: node.title,
    targets: ["toast"],
    contentTemplate: node.contentTemplate,
    toastLevel: node.level,
    inputKeys: node.inputKeys,
    outputKeys: node.outputKeys
  };
  const { context: nextContext } = await executeNotifyNode(session, legacy, context);
  return nextContext;
}
const INPUT_KIND_LABELS = {
  text: "文字",
  attachment: "附件",
  image: "图片",
  video: "视频"
};
async function executeCollectPrompt(sessionId, node, context, collectPrompt) {
  const instruction = interpolatePromptSoft(collectPrompt, context).trim();
  if (!instruction) return context;
  const stepPrompt = [
    `【工作流数据采集】${node.title}`,
    "【自动执行】请根据下列说明从当前上下文与会话中取值，最终只输出一行 JSON 对象（键值写入流程 context）。",
    "禁止 Markdown 代码围栏，禁止调用 present_plan_choices，禁止向用户提问。",
    "",
    "【取值说明】",
    instruction,
    "",
    "【当前 context 摘要】",
    JSON.stringify(
      Object.fromEntries(
        Object.entries(context).filter(([k]) => !k.startsWith("__")).slice(0, 40).map(([k, v]) => [
          k,
          typeof v === "string" && v.length > 200 ? `${v.slice(0, 200)}…` : v
        ])
      )
    )
  ].join("\n");
  logWorkflowNodeInput("数据采集 · 开始", node, context, { instruction });
  const sessionBefore = querySession(sessionId);
  const msgCountBefore = sessionBefore?.messages.length ?? 0;
  const stepResult = await runLangGraphStep({
    sessionId,
    prompt: stepPrompt,
    // 不开放工具：强制直接输出 JSON，避免数据采集再拉行情导致超时/Abort 误报
    toolWhitelist: ["__workflow_collect_no_tool__"],
    hideFromUi: true
  });
  if (stepResult === "aborted") throw new Error("__aborted__");
  if (stepResult === "error" || stepResult === "max_turns") {
    throw new Error(
      stepResult === "max_turns" ? `步骤「${node.title}」数据采集达到最大轮次` : `步骤「${node.title}」数据采集失败`
    );
  }
  const sessionAfter = querySession(sessionId);
  const agentOutput = queryAgentStepOutput(sessionAfter?.messages ?? [], msgCountBefore);
  const parsed = queryParseCollectJsonPatch(agentOutput);
  if ("error" in parsed) {
    throw new Error(`步骤「${node.title}」${parsed.error}`);
  }
  const nextContext = queryMergeCollectPatchToContext(context, parsed.patch);
  logWorkflowNodeInput("数据采集 · 已写入 context", node, nextContext, {
    patchKeys: Object.keys(parsed.patch)
  });
  return nextContext;
}
async function executeInputNode(session, node, context, signal) {
  const beforeContext = context;
  const sessionId = session.id;
  const messageFrom = querySessionMessageLength(sessionId);
  const kinds = node.inputKinds.length ? node.inputKinds : ["text"];
  const kindHint = kinds.map((k) => INPUT_KIND_LABELS[k] ?? k).join("、");
  const reason = node.prompt?.trim() || `请提供：${kindHint}`;
  const nodeInput = { reason, kinds, prompt: node.prompt };
  const presetText = queryPresetUserInputFromContext(context);
  const usePreset = queryCanSkipInputWaitWithPreset(kinds, presetText);
  appendWorkflowMessage(session, {
    role: "assistant",
    content: usePreset ? `【${node.title}】已使用预设输入，跳过等待。` : `【${node.title}】${reason}`,
    // 仅真正等待时挂 awaitMeta，避免预设路径仍显示「继续」条
    awaitMeta: usePreset ? void 0 : { reason }
  });
  let text = "";
  let attachmentPaths = [];
  if (usePreset && presetText) {
    logWorkflowNodeInput("输入节点 · 采用预设", node, context, {
      ...nodeInput,
      presetUserInput: presetText
    });
    appendUserContinueMessage(sessionId, { userInput: presetText });
    text = presetText;
  } else {
    logWorkflowNodeInput("输入节点 · 等待用户", node, context, nodeInput);
    const continueResult = await waitForGraphUserContinue(sessionId, reason, {
      skipPlaceholder: true
    });
    if (signal.aborted) throw new Error("__aborted__");
    text = continueResult.userInput?.trim() ?? "";
    const latest = querySession(sessionId);
    const userMessages = (latest?.messages ?? []).filter((m) => m.role === "user");
    const lastUser = userMessages[userMessages.length - 1];
    attachmentPaths = lastUser?.attachmentPaths?.filter(Boolean) ?? [];
  }
  let nextContext = { ...context };
  const outputKeys = node.outputKeys?.length ? node.outputKeys : [];
  const textKey = outputKeys[0] ?? "userInput";
  const fileKey = outputKeys[1] ?? "attachmentPaths";
  if (kinds.includes("text") && text) {
    nextContext = patchAgentOutputToContext(nextContext, text, [textKey]);
  }
  const needsFiles = kinds.some((k) => k === "attachment" || k === "image" || k === "video");
  if (needsFiles && attachmentPaths.length) {
    nextContext[fileKey] = attachmentPaths;
  }
  const collectPrompt = node.collectPrompt?.trim();
  if (collectPrompt) {
    nextContext = await executeCollectPrompt(sessionId, node, nextContext, collectPrompt);
  }
  logWorkflowNodeInput("输入节点 · 已采集", node, nextContext);
  const output = {};
  if (kinds.includes("text") && text) output[textKey] = text;
  if (needsFiles && attachmentPaths.length) output[fileKey] = attachmentPaths;
  if (collectPrompt) {
    for (const [k, v] of Object.entries(nextContext)) {
      if (!(k in beforeContext) || beforeContext[k] !== v) output[k] = v;
    }
  }
  return patchContextWithNodeExecution(
    beforeContext,
    nextContext,
    node,
    nodeInput,
    output,
    { from: messageFrom, to: querySessionMessageLength(sessionId) }
  );
}
function queryOutputFileExtension(format) {
  switch (format) {
    case "markdown":
      return ".md";
    case "json":
      return ".json";
    case "file":
      return "";
    case "text":
    default:
      return ".txt";
  }
}
async function executeOutputNode(session, node, context) {
  const beforeContext = context;
  const sessionId = session.id;
  const messageFrom = querySessionMessageLength(sessionId);
  logWorkflowNodeInput("输出节点 · 上下文", node, context);
  const outputDir = node.outputDir.trim();
  if (!outputDir) {
    throw new Error("输出节点未配置输出目录，请在画布中编辑并选择文件夹");
  }
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  const fileNameRaw = interpolatePromptSoft(node.fileNameTemplate ?? "output", context).trim() || "output";
  const ext = queryOutputFileExtension(node.outputFormat);
  const fileName = fileNameRaw.includes(".") || !ext ? fileNameRaw : `${fileNameRaw}${ext}`;
  const targetPath = path.join(outputDir, fileName);
  const nodeInput = {
    outputDir,
    fileName,
    outputFormat: node.outputFormat,
    contentTemplate: interpolatePromptSoft(node.contentTemplate, context).trim()
  };
  if (node.outputFormat === "file") {
    const sourcePath = interpolatePromptSoft(node.contentTemplate, context).trim();
    if (!sourcePath) throw new Error("file 格式需在内容模板中指定源文件路径，如 {{videoPath}}");
    if (!fs.existsSync(sourcePath)) {
      throw new Error(`源文件不存在: ${sourcePath}`);
    }
    fs.copyFileSync(sourcePath, targetPath);
  } else {
    const content = interpolatePromptSoft(node.contentTemplate, context).trim();
    if (!content) {
      throw new Error("输出内容为空，请检查 contentTemplate 或上游 outputKeys");
    }
    if (node.outputFormat === "json") {
      try {
        JSON.parse(content);
      } catch {
        throw new Error("json 格式要求内容为合法 JSON");
      }
    }
    fs.writeFileSync(targetPath, content, "utf-8");
  }
  logWorkflowNodeInput("输出节点 · 已写入", node, context, { targetPath });
  appendWorkflowMessage(session, {
    role: "assistant",
    content: `【${node.title}】已写入：${targetPath}`
  });
  const nextContext = { ...context };
  const keys = node.outputKeys?.length ? node.outputKeys : ["outputPath"];
  const output = { targetPath };
  for (const key of keys) {
    nextContext[key] = targetPath;
    output[key] = targetPath;
  }
  return patchContextWithNodeExecution(
    beforeContext,
    nextContext,
    node,
    nodeInput,
    output,
    { from: messageFrom, to: querySessionMessageLength(sessionId) }
  );
}
async function executeLeafNode(session, node, run, signal) {
  const sessionId = session.id;
  if (signal.aborted) {
    throw new Error("__aborted__");
  }
  run = patchRun(run, { cursorNodeId: node.id, status: "running" });
  logWorkflowNodeInput("叶节点 · 开始执行", node, run.context);
  if (node.type === "input") {
    const hasPreset = queryCanSkipInputWaitWithPreset(
      node.inputKinds,
      queryPresetUserInputFromContext(run.context)
    );
    if (!hasPreset) {
      run = patchRun(run, { status: "awaiting_user" });
    }
    const nextContext2 = await executeInputNode(session, node, run.context, signal);
    return patchRun(run, { context: nextContext2, status: "running" });
  }
  const collectPrompt = node.type !== "await_user" && "collectPrompt" in node ? node.collectPrompt?.trim() : void 0;
  if (collectPrompt) {
    const collected = await executeCollectPrompt(
      sessionId,
      node,
      run.context,
      collectPrompt
    );
    run = patchRun(run, { context: collected });
  }
  if (node.type === "output") {
    const nextContext2 = await executeOutputNode(session, node, run.context);
    return patchRun(run, { context: nextContext2, status: "running" });
  }
  if (node.type === "await_user") {
    const beforeContext2 = run.context;
    const messageFrom = querySessionMessageLength(sessionId);
    run = patchRun(run, { status: "awaiting_user" });
    const reason = node.reason || node.title;
    appendWorkflowMessage(session, {
      role: "assistant",
      content: `等待确认：${reason}`,
      awaitMeta: {
        reason,
        choices: node.choices
      }
    });
    const continueResult = await waitForGraphUserContinue(
      sessionId,
      { reason, choices: node.choices },
      { skipPlaceholder: true }
    );
    if (signal.aborted) throw new Error("__aborted__");
    let nextContext2 = run.context;
    const outputKeys2 = node.outputKeys?.length ? node.outputKeys : node.choices?.length ? ["userInput", "userChoiceId"] : ["userInput"];
    const output2 = {};
    const messageText = formatUserContinueMessage(continueResult);
    if (messageText) {
      nextContext2 = patchAgentOutputToContext(run.context, messageText, outputKeys2);
      if (continueResult.choiceId && outputKeys2.includes("userChoiceId")) {
        nextContext2 = { ...nextContext2, userChoiceId: continueResult.choiceId };
        output2.userChoiceId = continueResult.choiceId;
      }
      for (const key of outputKeys2) {
        if (key in nextContext2) output2[key] = nextContext2[key];
      }
    }
    const patched2 = patchContextWithNodeExecution(
      beforeContext2,
      nextContext2,
      node,
      { reason },
      output2,
      { from: messageFrom, to: querySessionMessageLength(sessionId) }
    );
    return patchRun(run, { context: patched2, status: "running" });
  }
  if (node.type === "tool") {
    const nextContext2 = await executeToolNode(session, node, run.context, async () => {
      run = patchRun(run, { status: "awaiting_user" });
    });
    return patchRun(run, { context: nextContext2, status: "running" });
  }
  if (node.type === "notify") {
    const { context: nextContext2 } = await executeNotifyNode(session, node, run.context);
    return patchRun(run, { context: nextContext2, status: "running" });
  }
  if (node.type === "toast") {
    const nextContext2 = await executeToastNode(session, node, run.context);
    return patchRun(run, { context: nextContext2, status: "running" });
  }
  const beforeContext = run.context;
  const stepPrompt = interpolatePromptSoft(
    [
      `【工作流步骤】${node.title}`,
      // 自动流程：连续执行，禁止方案选择暂停；画布「等待确认」节点仍会暂停
      "【自动执行】请自行决策并按顺序连续完成，禁止调用 present_plan_choices 等待用户确认。",
      node.prompt
    ].filter(Boolean).join("\n\n"),
    run.context
  );
  logWorkflowNodeInput("Agent 节点 · Prompt 已解析", node, run.context, { stepPrompt });
  const sessionBefore = querySession(sessionId);
  const msgCountBefore = sessionBefore?.messages.length ?? 0;
  const stepResult = await runLangGraphStep({
    sessionId,
    prompt: stepPrompt,
    toolWhitelist: node.toolWhitelist,
    hideFromUi: true
  });
  if (stepResult === "aborted") throw new Error("__aborted__");
  if (stepResult === "error" || stepResult === "max_turns") {
    throw new Error(
      stepResult === "max_turns" ? `步骤「${node.title}」达到最大轮次` : `步骤「${node.title}」执行失败`
    );
  }
  const sessionAfter = querySession(sessionId);
  const agentOutput = queryAgentStepOutput(sessionAfter?.messages ?? [], msgCountBefore);
  const nextContext = patchAgentOutputToContext(run.context, agentOutput, node.outputKeys);
  const outputKeys = node.outputKeys?.length ? node.outputKeys : ["summary"];
  const output = {};
  for (const key of outputKeys) {
    if (key in nextContext) output[key] = nextContext[key];
  }
  const patched = patchContextWithNodeExecution(
    beforeContext,
    nextContext,
    node,
    { prompt: stepPrompt, toolWhitelist: node.toolWhitelist },
    output,
    {
      from: msgCountBefore,
      to: sessionAfter?.messages.length ?? msgCountBefore
    }
  );
  return patchRun(run, { context: patched, status: "running" });
}
function parseAgentBranchKey(text, keys) {
  const trimmed = text.trim();
  try {
    const parsed = JSON.parse(trimmed);
    if (typeof parsed?.key === "string" && parsed.key.trim()) {
      return parsed.key.trim();
    }
  } catch {
  }
  const m = trimmed.match(/"key"\s*:\s*"([^"]+)"/);
  if (m?.[1]) return m[1].trim();
  if (keys.includes(trimmed)) return trimmed;
  for (const k of keys) {
    if (trimmed === k || trimmed.endsWith(k)) return k;
  }
  return trimmed;
}
async function queryAgentBranchKey(sessionId, node, context, signal) {
  if (signal.aborted) throw new Error("__aborted__");
  const keys = node.cases.map((c) => c.key);
  const whitelist = node.toolWhitelist && node.toolWhitelist.length > 0 ? node.toolWhitelist : ["__workflow_condition_no_tool__"];
  const stepResult = await runLangGraphStep({
    sessionId,
    prompt: [
      `【条件分支】${node.title}`,
      node.prompt?.trim() || "根据上下文选择唯一分支。",
      `可选 key：${keys.join(", ")}`,
      '你必须只输出一行 JSON：{"key":"<上述某一个 key>"}，不要输出其它说明，不要调用工具。',
      `当前 context JSON：${JSON.stringify(context)}`
    ].join("\n\n"),
    toolWhitelist: whitelist,
    hideFromUi: true
  });
  if (stepResult === "aborted") throw new Error("__aborted__");
  if (stepResult === "error" || stepResult === "max_turns") {
    throw new Error(
      stepResult === "max_turns" ? `条件「${node.title}」Agent 选路达到最大轮次` : `条件「${node.title}」Agent 选路失败`
    );
  }
  const sess = querySession(sessionId);
  const lastAssistant = [...sess?.messages ?? []].reverse().find((m) => m.role === "assistant" && m.content?.trim());
  return parseAgentBranchKey(lastAssistant?.content ?? "", keys);
}
async function executeConditionNode(sessionId, node, run, statusMap, specs, session, signal) {
  const beforeContext = run.context;
  statusMap.set(node.id, "running");
  for (const arm of node.cases) {
    for (const child of arm.nodes) statusMap.set(child.id, "pending");
  }
  persistSessionTasks(session, buildTasks(specs, statusMap));
  logWorkflowNodeInput("条件节点 · 开始执行", node, run.context);
  let selectedKeys;
  if (node.mode === "agent") {
    const rawKey = await queryAgentBranchKey(sessionId, node, run.context, signal);
    const picked = queryConditionCaseKeys(node, run.context, rawKey);
    if ("error" in picked) throw new Error(picked.error);
    selectedKeys = picked.keys;
  } else {
    const picked = queryConditionCaseKeys(node, run.context);
    if ("error" in picked) throw new Error(picked.error);
    selectedKeys = picked.keys;
  }
  const selectedSet = new Set(selectedKeys);
  const chosenArms = node.cases.filter((c) => selectedSet.has(c.key));
  if (selectedKeys.length && !chosenArms.length) {
    throw new Error(`条件分支无匹配 case: ${selectedKeys.join(",")}`);
  }
  const branchLabels = chosenArms.map((c) => c.label || c.key);
  const keysJoined = selectedKeys.join(",");
  const prevBranch = run.context.__branchKeys ?? {};
  const branchContext = {
    ...run.context,
    __branchKeys: keysJoined ? { ...prevBranch, [node.id]: keysJoined } : prevBranch
  };
  run = patchRun(run, {
    context: patchContextWithNodeExecution(
      beforeContext,
      branchContext,
      node,
      { mode: node.mode, caseKeys: node.cases.map((c) => c.key), matchMode: node.matchMode ?? "first" },
      {
        branchKey: keysJoined || "(none)",
        branchLabel: branchLabels.length ? branchLabels.join("、") : "无"
      }
    ),
    cursorNodeId: node.id,
    status: "running"
  });
  if (node.mode !== "agent") {
    appendWorkflowMessage(session, {
      role: "assistant",
      content: branchLabels.length ? `条件「${node.title}」命中分支：${branchLabels.join("、")}` : `条件「${node.title}」未命中任何分支，已跳过`
    });
  }
  for (const arm of node.cases) {
    if (selectedSet.has(arm.key)) continue;
    for (const child of arm.nodes) {
      statusMap.set(child.id, "skipped");
      run = patchRun(run, {
        context: patchContextWithSkippedNode(
          run.context,
          child,
          `未选中分支：${arm.label || arm.key}`
        )
      });
    }
  }
  persistSessionTasks(session, buildTasks(specs, statusMap));
  for (const chosen of chosenArms) {
    for (const child of chosen.nodes) {
      statusMap.set(child.id, "running");
      persistSessionTasks(session, buildTasks(specs, statusMap));
      try {
        run = await executeLeafNode(session, child, run, signal);
        statusMap.set(child.id, "done");
        persistSessionTasks(session, buildTasks(specs, statusMap));
      } catch (e) {
        if (e instanceof Error && e.message === "__aborted__") throw e;
        statusMap.set(child.id, "failed");
        statusMap.set(node.id, "failed");
        persistSessionTasks(session, buildTasks(specs, statusMap));
        throw e;
      }
    }
  }
  statusMap.set(node.id, "done");
  persistSessionTasks(session, buildTasks(specs, statusMap));
  return run;
}
async function executeTopLevelNode(sessionId, node, run, statusMap, specs, session, signal) {
  if (node.type === "start" || node.type === "end") {
    const beforeContext = run.context;
    logWorkflowNodeInput(`${node.type === "start" ? "开始" : "结束"}节点 · 开始执行`, node, run.context);
    statusMap.set(node.id, "running");
    persistSessionTasks(session, buildTasks(specs, statusMap));
    run = patchRun(run, { cursorNodeId: node.id, status: "running" });
    appendWorkflowMessage(session, {
      role: "assistant",
      content: node.type === "start" ? `流程开始：${node.title}` : `流程结束：${node.title}`
    });
    const patched = patchContextWithNodeExecution(
      beforeContext,
      run.context,
      node,
      { context: queryContextSnapshotForDisplay(beforeContext) },
      node.type === "end" ? { context: queryContextSnapshotForDisplay(run.context) } : {}
    );
    statusMap.set(node.id, "done");
    persistSessionTasks(session, buildTasks(specs, statusMap));
    return patchRun(run, { context: patched });
  }
  if (node.type === "condition") {
    try {
      return await executeConditionNode(
        sessionId,
        node,
        run,
        statusMap,
        specs,
        session,
        signal
      );
    } catch (e) {
      if (e instanceof Error && e.message === "__aborted__") throw e;
      if (statusMap.get(node.id) !== "failed") {
        statusMap.set(node.id, "failed");
        persistSessionTasks(session, buildTasks(specs, statusMap));
      }
      throw e;
    }
  }
  if (node.type !== "parallel") {
    statusMap.set(node.id, "running");
    persistSessionTasks(session, buildTasks(specs, statusMap));
    try {
      run = await executeLeafNode(session, node, run, signal);
      statusMap.set(node.id, "done");
      persistSessionTasks(session, buildTasks(specs, statusMap));
      return run;
    } catch (e) {
      if (e instanceof Error && e.message === "__aborted__") throw e;
      if (langgraph.isGraphInterrupt(e)) throw e;
      statusMap.set(node.id, "failed");
      persistSessionTasks(session, buildTasks(specs, statusMap));
      throw e;
    }
  }
  statusMap.set(node.id, "running");
  for (const child of node.children) {
    statusMap.set(child.id, "pending");
  }
  persistSessionTasks(session, buildTasks(specs, statusMap));
  run = patchRun(run, { cursorNodeId: node.id, status: "running" });
  logWorkflowNodeInput("并行节点 · 开始执行", node, run.context, {
    childIds: node.children.map((c) => c.id)
  });
  const allTools = node.children.length > 0 && node.children.every((c) => c.type === "tool");
  try {
    if (allTools) {
      for (const child of node.children) statusMap.set(child.id, "running");
      persistSessionTasks(session, buildTasks(specs, statusMap));
      const baseContext = { ...run.context };
      const settled = await Promise.all(
        node.children.map(async (child) => {
          if (signal.aborted) throw new Error("__aborted__");
          try {
            const nextContext = await executeToolNode(
              session,
              child,
              baseContext,
              async () => {
                patchRun(run, { status: "awaiting_user" });
              }
            );
            statusMap.set(child.id, "done");
            persistSessionTasks(session, buildTasks(specs, statusMap));
            return { ok: true, context: nextContext };
          } catch (e) {
            statusMap.set(child.id, "failed");
            persistSessionTasks(session, buildTasks(specs, statusMap));
            return { ok: false, error: e };
          }
        })
      );
      const failure = settled.find((r) => !r.ok);
      if (failure && !failure.ok) {
        statusMap.set(node.id, "failed");
        persistSessionTasks(session, buildTasks(specs, statusMap));
        const err = failure.error;
        if (err instanceof Error && err.message === "__aborted__") throw err;
        throw err instanceof Error ? err : new Error(String(err));
      }
      let merged = mergeParallelNodeContexts(
        baseContext,
        settled.filter((r) => r.ok).map((r) => r.context)
      );
      const parallelBefore2 = run.context;
      merged = patchContextWithNodeExecution(
        parallelBefore2,
        merged,
        node,
        { childIds: node.children.map((c) => c.id), mode: "parallel_tools" },
        void 0
      );
      statusMap.set(node.id, "done");
      persistSessionTasks(session, buildTasks(specs, statusMap));
      return patchRun(run, { context: merged, status: "running" });
    }
    const parallelBefore = run.context;
    for (const child of node.children) {
      statusMap.set(child.id, "running");
      persistSessionTasks(session, buildTasks(specs, statusMap));
      try {
        run = await executeLeafNode(session, child, run, signal);
        statusMap.set(child.id, "done");
        persistSessionTasks(session, buildTasks(specs, statusMap));
      } catch (e) {
        if (e instanceof Error && e.message === "__aborted__") throw e;
        statusMap.set(child.id, "failed");
        statusMap.set(node.id, "failed");
        persistSessionTasks(session, buildTasks(specs, statusMap));
        throw e;
      }
    }
    statusMap.set(node.id, "done");
    persistSessionTasks(session, buildTasks(specs, statusMap));
    const patched = patchContextWithNodeExecution(
      parallelBefore,
      run.context,
      node,
      { childIds: node.children.map((c) => c.id), mode: "parallel_serial" },
      void 0
    );
    return patchRun(run, { context: patched, status: "running" });
  } catch (e) {
    if (!(e instanceof Error && e.message === "__aborted__")) {
      if (statusMap.get(node.id) !== "failed") {
        statusMap.set(node.id, "failed");
        persistSessionTasks(session, buildTasks(specs, statusMap));
      }
    }
    throw e;
  }
}
function findResumeIndex(nodes, cursorNodeId) {
  if (!cursorNodeId) return 0;
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i];
    if (n.id === cursorNodeId) return i;
    if (n.type === "parallel" && n.children.some((c) => c.id === cursorNodeId)) {
      return i;
    }
    if (n.type === "condition" && n.cases.some((arm) => arm.nodes.some((c) => c.id === cursorNodeId))) {
      return i;
    }
  }
  return 0;
}
async function executeWorkflowRun(runId, fromStart) {
  const { executeWorkflowWithLangGraph } = await Promise.resolve().then(() => require("./chunks/compile-to-langgraph-D05HLVfT.js"));
  await executeWorkflowWithLangGraph(runId, fromStart);
}
function __graphApi_prepareWorkflowRun(runId, fromStart) {
  let run = queryWorkflowRun(runId);
  if (!run) return null;
  const workflow = queryWorkflow(run.workflowId);
  if (!workflow) {
    patchRun(run, { status: "failed", errorMessage: "工作流定义不存在" });
    emitError(run.sessionId, "工作流定义不存在");
    emitDone(run.sessionId, "error");
    return null;
  }
  const sessionId = run.sessionId;
  if (runningBySession.has(sessionId)) {
    return null;
  }
  runningBySession.add(sessionId);
  const liveSession = querySession(sessionId);
  if (!liveSession) {
    patchRun(run, { status: "failed", errorMessage: "会话不存在" });
    emitError(sessionId, "会话不存在");
    emitDone(sessionId, "error");
    runningBySession.delete(sessionId);
    return null;
  }
  const specs = flattenTaskSpecs(workflow.nodes);
  const statusMap = /* @__PURE__ */ new Map();
  for (const s of specs) {
    statusMap.set(s.id, "pending");
  }
  const startIndex = fromStart ? 0 : findResumeIndex(workflow.nodes, run.cursorNodeId);
  for (let i = 0; i < startIndex; i++) {
    const n = workflow.nodes[i];
    statusMap.set(n.id, "done");
    if (n.type === "parallel") {
      for (const c of n.children) statusMap.set(c.id, "done");
    }
    if (n.type === "condition") {
      for (const arm of n.cases) {
        for (const c of arm.nodes) statusMap.set(c.id, "done");
      }
    }
  }
  persistSessionTasks(liveSession, buildTasks(specs, statusMap));
  const controller = bindGraphSessionAbort(sessionId);
  run = patchRun(run, { status: "running", errorMessage: void 0 });
  if (fromStart) {
    appendWorkflowMessage(liveSession, {
      role: "assistant",
      content: `开始执行流程「${workflow.title}」。`
    });
  } else {
    appendWorkflowMessage(liveSession, {
      role: "assistant",
      content: `继续执行流程「${workflow.title}」。`
    });
  }
  return {
    workflow,
    session: liveSession,
    run,
    specs,
    statusMap,
    startIndex,
    signal: controller.signal
  };
}
async function __graphApi_executeTopLevelNode(sessionId, node, run, statusMap, specs, session, signal) {
  return executeTopLevelNode(sessionId, node, run, statusMap, specs, session, signal);
}
function __graphApi_finalizeWorkflowRun(runId, sessionId, outcome, errorMessage) {
  const run = queryWorkflowRun(runId);
  const session = querySession(sessionId);
  try {
    if (!run) return;
    if (outcome === "success") {
      patchRun(run, { status: "success", cursorNodeId: null });
      if (session) {
        appendWorkflowMessage(session, { role: "assistant", content: "流程执行完毕。" });
      }
      emitDone(sessionId, "workflow_success");
    } else if (outcome === "aborted") {
      patchRun(run, { status: "aborted" });
      if (session) {
        appendWorkflowMessage(session, { role: "assistant", content: "流程已中止。" });
      }
      emitDone(sessionId, "aborted");
    } else {
      const message = errorMessage || "未知错误";
      patchRun(run, { status: "failed", errorMessage: message });
      if (session) {
        appendWorkflowMessage(session, {
          role: "assistant",
          content: `流程执行失败：${message}`
        });
      }
      emitError(sessionId, message);
      emitDone(sessionId, "error");
    }
  } finally {
    releaseGraphSessionAbort(sessionId);
    runningBySession.delete(sessionId);
  }
}
async function postRunWorkflow(workflowId, options) {
  const workflow = queryWorkflow(workflowId) ?? queryOrMigratePublishWorkflow(workflowId);
  if (!workflow) {
    throw new Error("工作流不存在");
  }
  if (!workflow.nodes.length) {
    throw new Error("请先为流程添加至少一个步骤");
  }
  const silent = Boolean(options?.silent);
  const session = options?.session ?? createWorkflowSession(workflow);
  if (!options?.session) {
    postSession(session);
    if (!silent) {
      emitSessionStarted(session);
    }
  } else if (!querySession(session.id)) {
    postSession(session);
    if (!silent) {
      emitSessionStarted(session);
    }
  }
  const now = Date.now();
  const initialContext = queryBuildWorkflowInitialContext({
    presetUserInput: options?.presetUserInput,
    initialContext: options?.initialContext
  });
  const run = postWorkflowRun({
    id: crypto.randomUUID(),
    workflowId: workflow.id,
    sessionId: session.id,
    status: "pending",
    cursorNodeId: null,
    context: initialContext,
    createdAt: now,
    updatedAt: now
  });
  void executeWorkflowRun(run.id, true);
  return { run, sessionId: session.id };
}
async function postResumeWorkflow(runId) {
  const run = queryWorkflowRun(runId);
  if (!run) {
    throw new Error("运行实例不存在");
  }
  if (run.status === "running" || run.status === "awaiting_user") {
    throw new Error("该流程正在执行中");
  }
  if (run.status === "success") {
    throw new Error("该流程已成功结束");
  }
  const next = patchRun(run, { status: "pending", errorMessage: void 0 });
  void executeWorkflowRun(next.id, false);
  return { run: next, sessionId: next.sessionId };
}
const TICK_MS = 3e4;
let tickTimer = null;
function createScheduleSession(task) {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    title: formatRunSessionTitle("[定时]", task.title, now),
    messages: [],
    tasks: [],
    type: "schedule",
    tokenUsed: 0,
    createdAt: now,
    updatedAt: now
  };
}
function postScheduleRunSession(session, silent) {
  postSession(session);
  if (!silent) {
    emitSessionStarted(session);
  }
}
function buildScheduleCustomPrompt(userPrompt, hasAutoNotify) {
  const lines = [
    "[定时任务自动触发]",
    "",
    "执行约束（必须遵守）：",
    "1. 严格按下方指令完成任务；",
    "2. 完成调研/整理后直接结束，不要再调用任何工具；"
  ];
  if (hasAutoNotify) {
    lines.push(
      "3. 任务结果将由系统自动转为飞书富文本推送",
      "4. 禁止对相同渠道重复发送通知。"
    );
  } else {
    lines.push(
      "3. 任一相关工具返回成功后立即结束，不要再调用任何工具；",
      "4. 禁止对相同渠道、相同正文重复发送通知。"
    );
  }
  lines.push("", userPrompt);
  return lines.join("\n");
}
async function postRunScheduleCustomPrompt(sessionId, prompt, hasAutoNotify) {
  bindGraphSessionAbort(sessionId);
  try {
    const result = await runLangGraphStep({
      sessionId,
      prompt: buildScheduleCustomPrompt(prompt, hasAutoNotify)
    });
    const reason = result === "completed" ? "end_turn" : result === "max_turns" ? "max_turns" : result === "aborted" ? "aborted" : "error";
    emitAgentEvent({ type: "done", sessionId, reason });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    emitAgentEvent({ type: "error", sessionId, message });
    emitAgentEvent({ type: "done", sessionId, reason: "error" });
  } finally {
    releaseGraphSessionAbort(sessionId);
  }
}
function markTaskFailed(task) {
  const failed = {
    ...task,
    lastRunAt: Date.now(),
    lastRunStatus: "failed",
    updatedAt: Date.now()
  };
  if (task.repeat === "once") {
    failed.enabled = false;
    failed.nextRunAt = void 0;
  } else {
    failed.nextRunAt = computeNextRunAt({ ...task, enabled: true }) ?? void 0;
  }
  const saved = postScheduledTask(failed);
  emitScheduleUpdate();
  return saved;
}
function resolveWorkflowId(task) {
  if (task.actionType === "workflow") {
    const id = task.workflowId?.trim();
    if (!id) return null;
    return queryWorkflow(id) ? id : null;
  }
  if (task.actionType === "publish_plan") {
    if (!task.publishPlanId) return null;
    if (!queryPublishPlan(task.publishPlanId)) return null;
    return queryPublishPlanRunnableWorkflowId(task.publishPlanId);
  }
  return null;
}
async function triggerScheduledTask(taskId, manual = false) {
  const task = queryScheduledTask(taskId);
  if (!task) return null;
  if (!manual && !task.enabled) return task;
  if (isScheduleTaskRunning(taskId)) return task;
  if (task.actionType === "custom_prompt") {
    const prompt = task.customPrompt?.trim();
    if (!prompt) {
      return markTaskFailed({ ...task, runCount: incrementScheduledTaskRunCount(task) });
    }
    const runInBackground2 = queryRunInBackground(task);
    markScheduleTaskRunning(taskId);
    const session2 = createScheduleSession(task);
    postScheduleRunSession(session2, runInBackground2);
    registerScheduleSession(session2.id, taskId);
    const running2 = {
      ...task,
      runCount: incrementScheduledTaskRunCount(task),
      lastRunAt: Date.now(),
      lastRunStatus: "running",
      lastSessionId: session2.id,
      updatedAt: Date.now()
    };
    postScheduledTask(running2);
    emitScheduleUpdate();
    void postRunScheduleCustomPrompt(
      session2.id,
      prompt,
      normalizeNotifyChannelIds(task.notifyChannels).length > 0
    );
    return running2;
  }
  const workflowId = resolveWorkflowId(task);
  if (!workflowId) {
    return markTaskFailed({ ...task, runCount: incrementScheduledTaskRunCount(task) });
  }
  const runInBackground = queryRunInBackground(task);
  markScheduleTaskRunning(taskId);
  const session = createScheduleSession(task);
  postScheduleRunSession(session, runInBackground);
  registerScheduleSession(session.id, taskId);
  const running = {
    ...task,
    runCount: incrementScheduledTaskRunCount(task),
    lastRunAt: Date.now(),
    lastRunStatus: "running",
    lastSessionId: session.id,
    updatedAt: Date.now()
  };
  postScheduledTask(running);
  emitScheduleUpdate();
  try {
    const taskPreset = queryNormalizePresetUserInput(task.presetUserInput);
    const planPreset = task.actionType === "publish_plan" && task.publishPlanId ? queryNormalizePresetUserInput(
      queryPublishPlan(task.publishPlanId)?.presetUserInput
    ) : void 0;
    await postRunWorkflow(workflowId, {
      session,
      presetUserInput: taskPreset ?? planPreset
    });
  } catch {
    return markTaskFailed({ ...running, lastRunStatus: "failed" });
  }
  return running;
}
function tick() {
  const now = Date.now();
  const tasks = queryScheduledTasks();
  for (const task of tasks) {
    if (!task.enabled || task.lastRunStatus === "running") continue;
    if (task.nextRunAt == null || task.nextRunAt > now) continue;
    void triggerScheduledTask(task.id, false);
  }
}
function startScheduleService() {
  if (tickTimer) return;
  tick();
  tickTimer = setInterval(tick, TICK_MS);
}
function isValidSkillImportId(id) {
  return /^[a-z0-9-]{1,64}$/.test(id) && !id.startsWith(".") && id !== "_templates";
}
function slugifySkillImportId(raw) {
  const slug = raw.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").replace(/-+/g, "-").slice(0, 64);
  return slug || `skill-${Date.now()}`;
}
function parseSkillImportJson(raw) {
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error("JSON 解析失败，请检查文件内容");
  }
  const items = Array.isArray(data) ? data : [data];
  if (items.length === 0) {
    throw new Error("JSON 为空，至少需要一条技能");
  }
  return items.map((item, index2) => normalizeSkillImportItem(item, index2));
}
function normalizeSkillImportItem(item, index2) {
  const label = `第 ${index2 + 1} 条`;
  if (!item || typeof item !== "object" || Array.isArray(item)) {
    throw new Error(`${label}不是有效的技能对象`);
  }
  const o = item;
  const content = typeof o.content === "string" ? o.content.trim() : "";
  if (!content) {
    throw new Error(
      `${label}缺少 content 正文（旧版摘要导出无法导入，请先用新版「导出」生成完整 JSON）`
    );
  }
  const name = typeof o.name === "string" && o.name.trim() ? o.name.trim() : typeof o.id === "string" && o.id.trim() ? o.id.trim() : "";
  if (!name) {
    throw new Error(`${label}缺少 name`);
  }
  const description = typeof o.description === "string" && o.description.trim() ? o.description.trim() : "从 JSON 导入的技能";
  const idSource = typeof o.id === "string" && o.id.trim() ? o.id.trim() : slugifySkillImportId(name);
  const id = slugifySkillImportId(idSource);
  if (!isValidSkillImportId(id)) {
    throw new Error(`${label}技能 id「${id}」格式无效`);
  }
  const examplesRaw = o.examplesContent;
  const examplesContent = typeof examplesRaw === "string" && examplesRaw.trim() ? examplesRaw.trim() : void 0;
  return {
    id,
    name,
    description,
    content,
    examplesContent
  };
}
function isLikelySkillJsonUrl(url2) {
  try {
    const pathname = new URL(url2.trim()).pathname;
    return /\.json$/i.test(pathname);
  } catch {
    return false;
  }
}
const execFileAsync = util.promisify(child_process.execFile);
const MAX_FETCH_BYTES = 512e3;
const FETCH_TIMEOUT_MS = 3e4;
const GIT_CLONE_TIMEOUT_MS = 12e4;
function slugifyFromSegment(segment) {
  const slug = segment.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").replace(/-+/g, "-").slice(0, 64);
  return slug || `skill-${Date.now()}`;
}
function suggestedIdFromSkillPath(path2) {
  const normalized = path2.replace(/\\/g, "/").replace(/\/SKILL\.md$/i, "");
  const last = normalized.split("/").filter(Boolean).pop() ?? "imported-skill";
  return slugifyFromSegment(last);
}
function createTempImportDir(prefix) {
  const dir = path.join(getSkillImportTempDir(), `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}
function cleanupTempDir(dir) {
  try {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  } catch {
  }
}
function resolveSkillImportSource(input) {
  const url2 = input.trim();
  if (!url2) {
    throw new Error("请输入技能链接");
  }
  if (!/^https?:\/\//i.test(url2) && !/^git@/i.test(url2)) {
    throw new Error("仅支持 http(s) 或 git@ 链接");
  }
  const blobMatch = url2.match(
    /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)$/i
  );
  if (blobMatch) {
    const [, owner, repo, branch, filePath] = blobMatch;
    const repoName = repo.replace(/\.git$/i, "");
    const rawBase = `https://raw.githubusercontent.com/${owner}/${repoName}/${branch}`;
    const normalizedPath = filePath.replace(/\\/g, "/");
    if (/SKILL\.md$/i.test(normalizedPath)) {
      const dir2 = normalizedPath.replace(/\/SKILL\.md$/i, "");
      return {
        skillMdUrl: `${rawBase}/${normalizedPath}`,
        examplesMdUrl: dir2 ? `${rawBase}/${dir2}/examples.md` : void 0,
        suggestedId: suggestedIdFromSkillPath(normalizedPath)
      };
    }
    const dir = normalizedPath.replace(/\/[^/]+$/, "");
    return {
      skillMdUrl: `${rawBase}/${dir}/SKILL.md`,
      examplesMdUrl: `${rawBase}/${dir}/examples.md`,
      suggestedId: suggestedIdFromSkillPath(dir)
    };
  }
  const treeMatch = url2.match(
    /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/tree\/([^/]+)\/?(.*)$/i
  );
  if (treeMatch) {
    const [, owner, repo, branch, dirPath] = treeMatch;
    const repoName = repo.replace(/\.git$/i, "");
    const rawBase = `https://raw.githubusercontent.com/${owner}/${repoName}/${branch}`;
    const normalizedDir = (dirPath || "").replace(/\\/g, "/").replace(/\/+$/, "");
    if (!normalizedDir) {
      throw new Error("请提供技能目录路径，例如 .cursor/skills/my-skill");
    }
    if (/SKILL\.md$/i.test(normalizedDir)) {
      const dir = normalizedDir.replace(/\/SKILL\.md$/i, "");
      return {
        skillMdUrl: `${rawBase}/${normalizedDir}`,
        examplesMdUrl: dir ? `${rawBase}/${dir}/examples.md` : void 0,
        suggestedId: suggestedIdFromSkillPath(normalizedDir)
      };
    }
    return {
      skillMdUrl: `${rawBase}/${normalizedDir}/SKILL.md`,
      examplesMdUrl: `${rawBase}/${normalizedDir}/examples.md`,
      suggestedId: suggestedIdFromSkillPath(normalizedDir)
    };
  }
  if (/^https:\/\/raw\.githubusercontent\.com\//i.test(url2) || /\.md(\?|$)/i.test(url2)) {
    if (!/SKILL\.md(\?|$)/i.test(url2)) {
      throw new Error("直链需指向 SKILL.md 文件，或改用 GitHub 目录/tree 链接");
    }
    const pathWithoutQuery = url2.split("?")[0];
    return {
      skillMdUrl: url2,
      examplesMdUrl: pathWithoutQuery.replace(/\/SKILL\.md$/i, "/examples.md"),
      suggestedId: suggestedIdFromSkillPath(pathWithoutQuery)
    };
  }
  throw new Error(
    "无法识别链接格式。支持：GitHub 仓库/tree/blob 链接、raw.githubusercontent.com 直链"
  );
}
async function fetchGithubRepoMeta(owner, repo) {
  const repoName = repo.replace(/\.git$/i, "");
  const apiUrl = `https://api.github.com/repos/${owner}/${repoName}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(apiUrl, {
      signal: controller.signal,
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "react-agent-skill-import/1.0"
      }
    });
    if (res.status === 404) {
      throw new Error(
        `仓库 ${owner}/${repoName} 不存在或无权访问。请确认链接中的用户名与仓库名拼写正确`
      );
    }
    if (!res.ok) {
      throw new Error(`GitHub API HTTP ${res.status}`);
    }
    const data = await res.json();
    const fullName = data.full_name ?? `${owner}/${repoName}`;
    const [canonicalOwner, canonicalRepo] = fullName.split("/");
    return {
      owner: canonicalOwner,
      repo: canonicalRepo,
      defaultBranch: data.default_branch ?? "main"
    };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("GitHub API 请求超时");
    }
    throw err instanceof Error ? err : new Error(String(err));
  } finally {
    clearTimeout(timer);
  }
}
async function probeRawFileExists(url2, signal) {
  try {
    const res = await fetch(url2, {
      method: "GET",
      signal,
      headers: {
        Range: "bytes=0-0",
        "User-Agent": "react-agent-skill-import/1.0"
      }
    });
    return res.ok || res.status === 206;
  } catch {
    return false;
  }
}
async function findSkillMdViaGithubApi(owner, repo, branch, paths, signal) {
  for (const path2 of paths) {
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path2}?ref=${encodeURIComponent(branch)}`;
    try {
      const res = await fetch(apiUrl, {
        signal,
        headers: {
          Accept: "application/vnd.github+json",
          "User-Agent": "react-agent-skill-import/1.0"
        }
      });
      if (!res.ok) continue;
      const data = await res.json();
      if (data.download_url) {
        return { skillMdUrl: data.download_url, skillPath: path2 };
      }
    } catch {
    }
  }
  return null;
}
async function resolveGithubRepoRootSource(owner, repo) {
  const meta = await fetchGithubRepoMeta(owner, repo);
  const slug = slugifyFromSegment(meta.repo);
  const branches = [meta.defaultBranch, "main", "master"].filter(
    (b, i, arr) => arr.indexOf(b) === i
  );
  const pathCandidates = [
    "SKILL.md",
    `.cursor/skills/${slug}/SKILL.md`,
    `.cursor/skills/${meta.repo}/SKILL.md`,
    `${meta.repo}/SKILL.md`
  ];
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    for (const branch of branches) {
      const found = await findSkillMdViaGithubApi(
        meta.owner,
        meta.repo,
        branch,
        pathCandidates,
        controller.signal
      );
      if (found) {
        const dir = found.skillPath.replace(/\/SKILL\.md$/i, "");
        const examplesRel = dir ? `${dir}/examples.md` : "examples.md";
        return {
          skillMdUrl: found.skillMdUrl,
          examplesMdUrl: `https://raw.githubusercontent.com/${meta.owner}/${meta.repo}/${branch}/${examplesRel}`,
          suggestedId: slugifyFromSegment(dir.split("/").pop() ?? meta.repo)
        };
      }
      const rawBase = `https://raw.githubusercontent.com/${meta.owner}/${meta.repo}/${branch}`;
      for (const path2 of pathCandidates) {
        const skillMdUrl = `${rawBase}/${path2}`;
        const exists = await probeRawFileExists(skillMdUrl, controller.signal);
        if (exists) {
          const dir = path2.replace(/\/SKILL\.md$/i, "");
          return {
            skillMdUrl,
            examplesMdUrl: dir ? `${rawBase}/${dir}/examples.md` : `${rawBase}/examples.md`,
            suggestedId: slugifyFromSegment(dir.split("/").pop() ?? meta.repo)
          };
        }
      }
    }
  } finally {
    clearTimeout(timer);
  }
  throw new Error(
    `未在 ${meta.owner}/${meta.repo} 找到 SKILL.md。请确认仓库根目录存在 SKILL.md，或改用 tree 链接指向技能目录。`
  );
}
async function resolveSkillImportSourceAsync(input) {
  const url2 = input.trim();
  try {
    return resolveSkillImportSource(url2);
  } catch (err) {
    const repoRootMatch = url2.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+)\/?(?:\?.*)?$/i);
    if (repoRootMatch) {
      const [, owner, repoRaw] = repoRootMatch;
      return resolveGithubRepoRootSource(owner, repoRaw.replace(/\.git$/i, ""));
    }
    throw err;
  }
}
async function fetchRemoteText(url2) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url2, {
      signal: controller.signal,
      headers: {
        Accept: "application/json, text/plain, text/markdown, */*",
        "User-Agent": "react-agent-skill-import/1.0"
      }
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const text = await res.text();
    if (text.length > MAX_FETCH_BYTES) {
      throw new Error(`内容超过 ${MAX_FETCH_BYTES / 1024}KB 限制`);
    }
    return text;
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("请求超时，请检查网络或链接是否可访问");
    }
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`拉取失败（${url2}）：${msg}`);
  } finally {
    clearTimeout(timer);
  }
}
async function fetchOptionalExamples(url2) {
  if (!url2) return void 0;
  try {
    const text = await fetchRemoteText(url2);
    const trimmed = text.trim();
    return trimmed || void 0;
  } catch {
    return void 0;
  }
}
function assertValidSkillMarkdown(raw) {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new Error("SKILL.md 内容为空");
  }
  if (trimmed.length < 10) {
    throw new Error("SKILL.md 内容过短，可能不是有效的技能文件");
  }
}
function parseGitUrlHeuristic(url2) {
  const trimmed = url2.trim();
  const sshMatch = trimmed.match(/^git@([^:]+):(.+?)(?:\.git)?$/i);
  if (sshMatch) {
    const [, host, repoPath] = sshMatch;
    return {
      method: "git_clone",
      cloneUrl: `git@${host}:${repoPath.replace(/\.git$/i, "")}.git`,
      skillDirPath: "",
      suggestedId: slugifyFromSegment(repoPath.split("/").pop() ?? "imported-skill"),
      reasoning: "识别为 SSH Git 仓库链接"
    };
  }
  const treeMatch = trimmed.match(
    /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/tree\/([^/]+)\/?(.*)$/i
  );
  if (treeMatch) {
    const [, owner, repo, branch, dirPath] = treeMatch;
    const repoName = repo.replace(/\.git$/i, "");
    const normalizedDir = (dirPath || "").replace(/\\/g, "/").replace(/\/+$/, "");
    const skillDir = normalizedDir.replace(/\/SKILL\.md$/i, "");
    return {
      method: "git_clone",
      cloneUrl: `https://github.com/${owner}/${repoName}.git`,
      branch,
      skillDirPath: skillDir,
      suggestedId: slugifyFromSegment(skillDir.split("/").pop() || repoName),
      reasoning: "识别为 GitHub tree 链接，将 git clone 后定位技能目录"
    };
  }
  const blobMatch = trimmed.match(
    /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)$/i
  );
  if (blobMatch) {
    const [, owner, repo, branch, filePath] = blobMatch;
    const repoName = repo.replace(/\.git$/i, "");
    const normalizedPath = filePath.replace(/\\/g, "/");
    const skillDir = normalizedPath.replace(/\/SKILL\.md$/i, "").replace(/\/[^/]+$/, "");
    return {
      method: "git_clone",
      cloneUrl: `https://github.com/${owner}/${repoName}.git`,
      branch,
      skillDirPath: skillDir,
      suggestedId: suggestedIdFromSkillPath(normalizedPath),
      reasoning: "识别为 GitHub blob 链接，将 git clone 后定位技能目录"
    };
  }
  const repoRootMatch = trimmed.match(
    /^https:\/\/(?:github|gitlab|gitee|bitbucket)\.(?:com|org)\/([^/]+)\/([^/]+?)(?:\.git)?(?:\/|\?|#|$)/i
  );
  if (repoRootMatch && !/raw\.|raw\.githubusercontent/i.test(trimmed)) {
    const [, owner, repo] = repoRootMatch;
    const repoName = repo.replace(/\.git$/i, "");
    const hostMatch = trimmed.match(/^https:\/\/([^/]+)\//i);
    const host = hostMatch?.[1] ?? "github.com";
    return {
      method: "git_clone",
      cloneUrl: `https://${host}/${owner}/${repoName}.git`,
      skillDirPath: "",
      suggestedId: slugifyFromSegment(repoName),
      reasoning: "识别为 Git 仓库根链接"
    };
  }
  return null;
}
function isObviousHttpDownloadUrl(url2) {
  const trimmed = url2.trim();
  return /^https:\/\/raw\.githubusercontent\.com\//i.test(trimmed) || /^https?:\/\//i.test(trimmed) && /SKILL\.md(\?|#|$)/i.test(trimmed) && !/github\.com\/[^/]+\/[^/]+\/(tree|blob)\//i.test(trimmed);
}
const SKILL_IMPORT_LLM_SYSTEM = `你是 Cursor Agent 技能导入助手。根据用户提供的链接，判断应使用 git clone 还是 HTTP 下载来获取技能（SKILL.md 及同目录资源）。

规则：
1. Git 仓库链接（GitHub/GitLab/Gitee/Bitbucket 仓库页、tree/blob 路径、.git 结尾、git@ 协议）→ method 必须为 "git_clone"，并给出可执行的 cloneUrl
2. raw 直链、单个文件的 HTTPS 链接、明确指向 SKILL.md 的非 Git 页面 → method 为 "http_download"，给出 skillMdUrl
3. skillDirPath 为仓库内技能目录相对路径（SKILL.md 所在目录，不含 SKILL.md 文件名）；仓库根即 SKILL.md 时填空字符串
4. suggestedId 为小写连字符目录名，1～64 字符

仅返回 JSON 对象，不要 markdown 代码块：
{
  "method": "git_clone" | "http_download",
  "cloneUrl": "git clone 用的 URL（git_clone 时必填）",
  "branch": "可选分支名",
  "skillDirPath": "仓库内技能目录相对路径",
  "skillMdUrl": "HTTP 下载时 SKILL.md 完整 URL",
  "examplesMdUrl": "可选 examples.md URL",
  "suggestedId": "建议技能 id",
  "reasoning": "一句话说明判断理由"
}`;
function parseLlmImportPlanJson(text) {
  const trimmed = text.trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  try {
    const raw = JSON.parse(jsonMatch[0]);
    const method = raw.method === "git_clone" || raw.method === "http_download" ? raw.method : null;
    if (!method) return null;
    const suggestedId = slugifyFromSegment(String(raw.suggestedId ?? "imported-skill"));
    const reasoning = typeof raw.reasoning === "string" ? raw.reasoning : void 0;
    if (method === "git_clone") {
      const cloneUrl = typeof raw.cloneUrl === "string" ? raw.cloneUrl.trim() : "";
      if (!cloneUrl) return null;
      return {
        method,
        cloneUrl,
        branch: typeof raw.branch === "string" && raw.branch.trim() ? raw.branch.trim() : void 0,
        skillDirPath: typeof raw.skillDirPath === "string" ? raw.skillDirPath.replace(/\\/g, "/").replace(/\/+$/, "") : "",
        suggestedId,
        reasoning
      };
    }
    const skillMdUrl = typeof raw.skillMdUrl === "string" ? raw.skillMdUrl.trim() : "";
    if (!skillMdUrl) return null;
    return {
      method,
      skillMdUrl,
      examplesMdUrl: typeof raw.examplesMdUrl === "string" && raw.examplesMdUrl.trim() ? raw.examplesMdUrl.trim() : void 0,
      suggestedId,
      reasoning
    };
  } catch {
    return null;
  }
}
async function querySkillImportPlan(url2) {
  const trimmed = url2.trim();
  if (!trimmed) {
    throw new Error("请输入技能链接");
  }
  if (isObviousHttpDownloadUrl(trimmed)) {
    const source2 = await resolveSkillImportSourceAsync(trimmed);
    return {
      method: "http_download",
      skillMdUrl: source2.skillMdUrl,
      examplesMdUrl: source2.examplesMdUrl,
      suggestedId: source2.suggestedId,
      reasoning: "识别为 HTTP 直链，将直接下载 SKILL.md"
    };
  }
  const settings = querySettings();
  if (settings.apiKey) {
    try {
      const model = createChatModel(settings).withConfig({
        response_format: { type: "json_object" }
      });
      const result = await model.invoke([
        new messages.SystemMessage(SKILL_IMPORT_LLM_SYSTEM),
        new messages.HumanMessage(`请分析以下技能链接并返回 JSON 导入计划：
${trimmed}`)
      ]);
      const rawContent = result.content;
      const content = typeof rawContent === "string" ? rawContent : Array.isArray(rawContent) ? rawContent.map((block) => {
        if (typeof block === "string") return block;
        if (block && typeof block === "object" && "text" in block) {
          return String(block.text ?? "");
        }
        return "";
      }).join("") : String(rawContent ?? "");
      const plan = parseLlmImportPlanJson(content);
      if (plan) {
        if (plan.method === "http_download" && !plan.skillMdUrl) {
          const source2 = await resolveSkillImportSourceAsync(trimmed);
          plan.skillMdUrl = source2.skillMdUrl;
          plan.examplesMdUrl = plan.examplesMdUrl ?? source2.examplesMdUrl;
        }
        if (plan.method === "git_clone" && !plan.cloneUrl) {
          throw new Error("大模型未返回有效的 cloneUrl");
        }
        return plan;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn("[skill-import] LLM plan failed, fallback to heuristics:", msg);
    }
  }
  const gitPlan = parseGitUrlHeuristic(trimmed);
  if (gitPlan) {
    return gitPlan;
  }
  const source = await resolveSkillImportSourceAsync(trimmed);
  return {
    method: "http_download",
    skillMdUrl: source.skillMdUrl,
    examplesMdUrl: source.examplesMdUrl,
    suggestedId: source.suggestedId,
    reasoning: settings.apiKey ? "大模型与规则均未识别为 Git 仓库，使用 HTTP 下载" : "未配置 API Key，已用规则识别为 HTTP 下载"
  };
}
async function gitCloneRepo(cloneUrl, destDir, branch) {
  const args = ["clone", "--depth", "1"];
  if (branch?.trim()) {
    args.push("--branch", branch.trim(), "--single-branch");
  }
  args.push(cloneUrl, destDir);
  try {
    await execFileAsync("git", args, {
      timeout: GIT_CLONE_TIMEOUT_MS,
      maxBuffer: 4 * 1024 * 1024
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/not found|command not found|ENOENT/i.test(msg)) {
      throw new Error("未检测到 git 命令，请先安装 Git 并确保在 PATH 中可用");
    }
    throw new Error(`git clone 失败：${msg}`);
  }
}
function findSkillDirByWalk(repoRoot, maxDepth = 5) {
  function walk(dir, depth) {
    if (depth > maxDepth) return null;
    if (fs.existsSync(path.join(dir, "SKILL.md"))) {
      return dir;
    }
    let entries;
    try {
      entries = fs.readdirSync(dir);
    } catch {
      return null;
    }
    for (const name of entries) {
      if (name === ".git" || name === "node_modules") continue;
      const child = path.join(dir, name);
      try {
        if (!fs.existsSync(child)) continue;
        if (!fs.statSync(child).isDirectory()) continue;
        const found = walk(child, depth + 1);
        if (found) return found;
      } catch {
        continue;
      }
    }
    return null;
  }
  return walk(repoRoot, 0);
}
function resolveSkillDirInClone(repoRoot, skillDirPath) {
  const normalizedHint = (skillDirPath ?? "").replace(/\\/g, "/").replace(/\/+$/, "");
  const candidates = [];
  if (normalizedHint) {
    candidates.push(path.join(repoRoot, normalizedHint));
  }
  candidates.push(
    repoRoot,
    path.join(repoRoot, ".cursor", "skills")
  );
  for (const candidate of candidates) {
    if (fs.existsSync(path.join(candidate, "SKILL.md"))) {
      return candidate;
    }
  }
  const skillsRoot = path.join(repoRoot, ".cursor", "skills");
  if (fs.existsSync(skillsRoot)) {
    for (const entry of fs.readdirSync(skillsRoot, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const dir = path.join(skillsRoot, entry.name);
      if (fs.existsSync(path.join(dir, "SKILL.md"))) {
        return dir;
      }
    }
  }
  const walked = findSkillDirByWalk(repoRoot);
  if (walked) {
    return walked;
  }
  throw new Error(
    "克隆成功但未找到 SKILL.md。请确认仓库内含技能目录，或使用 tree 链接指向具体技能路径。"
  );
}
function installSkillDirFromClone(sourceDir, targetId) {
  validateSkillId(targetId);
  const destDir = path.join(getSkillsDir(), targetId);
  if (fs.existsSync(destDir)) {
    throw new Error(`技能 id「${targetId}」已存在，请更换目标 id 或先删除旧技能`);
  }
  try {
    fs.cpSync(sourceDir, destDir, { recursive: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`复制技能目录失败：${msg}`);
  }
}
async function importSkillViaGitClone(plan, targetId) {
  const cloneUrl = plan.cloneUrl?.trim();
  if (!cloneUrl) {
    throw new Error("Git 导入缺少 cloneUrl");
  }
  const id = slugifyFromSegment(targetId?.trim() || plan.suggestedId);
  validateSkillId(id);
  const tempDir = createTempImportDir("clone");
  try {
    await gitCloneRepo(cloneUrl, tempDir, plan.branch);
    const skillDir = resolveSkillDirInClone(tempDir, plan.skillDirPath);
    const rawSkill = fs.readFileSync(path.join(skillDir, "SKILL.md"), "utf-8");
    assertValidSkillMarkdown(rawSkill);
    installSkillDirFromClone(skillDir, id);
  } finally {
    cleanupTempDir(tempDir);
  }
  const detail = queryProjectSkillDetail(id);
  if (!detail) {
    throw new Error("技能导入后读取失败");
  }
  return detail;
}
async function importSkillViaHttpDownload(plan, targetId) {
  const skillMdUrl = plan.skillMdUrl?.trim();
  if (!skillMdUrl) {
    throw new Error("HTTP 导入缺少 skillMdUrl");
  }
  const id = slugifyFromSegment(targetId?.trim() || plan.suggestedId);
  validateSkillId(id);
  const destDir = path.join(getSkillsDir(), id);
  if (fs.existsSync(destDir)) {
    throw new Error(`技能 id「${id}」已存在，请更换目标 id 或先删除旧技能`);
  }
  const rawSkill = await fetchRemoteText(skillMdUrl);
  assertValidSkillMarkdown(rawSkill);
  const examplesContent = await fetchOptionalExamples(plan.examplesMdUrl);
  try {
    fs.mkdirSync(destDir, { recursive: true });
    fs.writeFileSync(path.join(destDir, "SKILL.md"), rawSkill.endsWith("\n") ? rawSkill : `${rawSkill}
`, "utf-8");
    if (examplesContent) {
      fs.writeFileSync(
        path.join(destDir, "examples.md"),
        examplesContent.endsWith("\n") ? examplesContent : `${examplesContent}
`,
        "utf-8"
      );
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`写入技能失败（请确认 resources/skills 可写）：${msg}`);
  }
  const detail = queryProjectSkillDetail(id);
  if (!detail) {
    throw new Error("技能导入后读取失败");
  }
  return detail;
}
async function readSkillMarkdownForPreview(plan) {
  if (plan.method === "git_clone") {
    const cloneUrl = plan.cloneUrl?.trim();
    if (!cloneUrl) {
      throw new Error("Git 预览缺少 cloneUrl");
    }
    const tempDir = createTempImportDir("preview");
    try {
      await gitCloneRepo(cloneUrl, tempDir, plan.branch);
      const skillDir = resolveSkillDirInClone(tempDir, plan.skillDirPath);
      const raw2 = fs.readFileSync(path.join(skillDir, "SKILL.md"), "utf-8");
      assertValidSkillMarkdown(raw2);
      const hasExamples = fs.existsSync(path.join(skillDir, "examples.md"));
      return {
        skillMdRef: `git:${cloneUrl}${plan.skillDirPath ? `/${plan.skillDirPath}` : ""}/SKILL.md`,
        raw: raw2,
        hasExamples
      };
    } finally {
      cleanupTempDir(tempDir);
    }
  }
  const skillMdUrl = plan.skillMdUrl?.trim();
  if (!skillMdUrl) {
    throw new Error("HTTP 预览缺少 skillMdUrl");
  }
  const raw = await fetchRemoteText(skillMdUrl);
  assertValidSkillMarkdown(raw);
  const examplesContent = await fetchOptionalExamples(plan.examplesMdUrl);
  return {
    skillMdRef: skillMdUrl,
    raw,
    hasExamples: Boolean(examplesContent)
  };
}
async function querySkillImportPreview(url2) {
  const trimmed = url2.trim();
  if (!trimmed) {
    throw new Error("请输入技能链接");
  }
  if (isLikelySkillJsonUrl(trimmed)) {
    return previewJsonImportFromUrl(trimmed);
  }
  const plan = await querySkillImportPlan(trimmed);
  const { skillMdRef, raw, hasExamples } = await readSkillMarkdownForPreview(plan);
  const { name, description } = parseSkillMarkdown(raw);
  return {
    url: trimmed,
    method: plan.method,
    skillMdUrl: skillMdRef,
    suggestedId: plan.suggestedId,
    name: name || plan.suggestedId,
    description: description || "从链接导入的技能",
    hasExamples,
    reasoning: plan.reasoning
  };
}
async function postImportSkillFromUrl(url2, targetId) {
  const trimmed = url2.trim();
  if (!trimmed) {
    throw new Error("请输入技能链接");
  }
  if (isLikelySkillJsonUrl(trimmed)) {
    const text = await fetchRemoteText(trimmed);
    const items = parseSkillImportJson(text);
    return postImportSkillsFromJson(items, targetId);
  }
  const plan = await querySkillImportPlan(trimmed);
  if (plan.method === "git_clone") {
    return importSkillViaGitClone(plan, targetId);
  }
  return importSkillViaHttpDownload(plan, targetId);
}
async function previewJsonImportFromUrl(url2) {
  const text = await fetchRemoteText(url2);
  const items = parseSkillImportJson(text);
  const first = items[0];
  return {
    url: url2,
    method: "json",
    skillMdUrl: url2,
    suggestedId: first.id,
    name: items.length === 1 ? first.name : `${items.length} 个技能`,
    description: items.length === 1 ? first.description : items.map((s) => s.name).join("、"),
    hasExamples: items.some((s) => Boolean(s.examplesContent?.trim())),
    reasoning: "识别为技能 JSON，将按条写入 resources/skills",
    jsonItems: items.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      hasExamples: Boolean(s.examplesContent?.trim())
    }))
  };
}
function postImportSkillsFromJson(items, targetId) {
  if (items.length === 0) {
    throw new Error("没有可导入的技能");
  }
  const normalizedTarget = targetId?.trim() ? slugifySkillImportId(targetId.trim()) : "";
  if (normalizedTarget && !isValidSkillImportId(normalizedTarget)) {
    throw new Error("目标 id 格式无效，请使用小写字母、数字和连字符");
  }
  const toWrite = items.length === 1 && normalizedTarget ? [{ ...items[0], id: normalizedTarget }] : items;
  let last = null;
  for (const input of toWrite) {
    last = postProjectSkill(input);
  }
  if (!last) {
    throw new Error("导入失败：未写入任何技能");
  }
  return last;
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
function queryWorkflowStepTitleFromContent(content) {
  const text = content.trim();
  if (text.startsWith(WORKFLOW_STEP_PREFIX)) {
    return text.slice(WORKFLOW_STEP_PREFIX.length).split("\n")[0]?.trim() || null;
  }
  if (text.startsWith(WORKFLOW_CONDITION_PREFIX)) {
    return text.slice(WORKFLOW_CONDITION_PREFIX.length).split("\n")[0]?.trim() || null;
  }
  return null;
}
function queryMessageAnchorIndex(messages2, task, execution) {
  if (execution?.messageRange) {
    return execution.messageRange.from;
  }
  const prompt = execution?.input?.prompt;
  if (typeof prompt === "string" && prompt.trim()) {
    const trimmedPrompt = prompt.trim();
    const firstLine = trimmedPrompt.split("\n")[0]?.trim();
    const byFull = messages2.findIndex(
      (m) => m.role === "user" && (m.content ?? "").trim() === trimmedPrompt
    );
    if (byFull >= 0) return byFull;
    if (firstLine) {
      const byLine = messages2.findIndex(
        (m) => m.role === "user" && (m.content ?? "").trim().startsWith(firstLine)
      );
      if (byLine >= 0) return byLine;
    }
  }
  const title = execution?.title ?? task.title;
  if (title.trim()) {
    const marker = `${WORKFLOW_STEP_PREFIX}${title.trim()}`;
    const byMarker = messages2.findIndex((m) => (m.content ?? "").includes(marker));
    if (byMarker >= 0) return byMarker;
    const bracket = `【${title.trim()}】`;
    const byBracket = messages2.findIndex((m) => (m.content ?? "").includes(bracket));
    if (byBracket >= 0) return byBracket;
  }
  for (let i = 0; i < messages2.length; i++) {
    const stepTitle = queryWorkflowStepTitleFromContent(messages2[i].content ?? "");
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
    const content = msg.content ?? "";
    if (content.includes(title)) return true;
    if (content.includes(`${WORKFLOW_STEP_PREFIX}${title}`)) return true;
    if (content.includes(`【${title}】`)) return true;
    if (msg.toolName && title.toLowerCase().includes(msg.toolName.toLowerCase())) return true;
    if (content.includes(`等待确认：${title}`)) return true;
    return false;
  });
}
function queryRelatedMessagesByTask(session, tasks, workflowContext) {
  const messages2 = session.messages;
  const result = new Map(tasks.map((t) => [t.id, []]));
  if (messages2.length === 0 || tasks.length === 0) return result;
  const anchors = [];
  for (const task of tasks) {
    const execution = queryNodeExecution(workflowContext, task.id);
    if (execution?.messageRange) {
      anchors.push({ taskId: task.id, from: execution.messageRange.from, execution });
      continue;
    }
    const from = queryMessageAnchorIndex(messages2, task, execution);
    if (from >= 0) {
      anchors.push({ taskId: task.id, from, execution });
    }
  }
  anchors.sort((a, b) => a.from - b.from || (a.execution?.executedAt ?? 0) - (b.execution?.executedAt ?? 0));
  for (let i = 0; i < anchors.length; i++) {
    const { taskId, from, execution } = anchors[i];
    let to = messages2.length;
    if (execution?.messageRange) {
      to = execution.messageRange.to;
    } else if (i + 1 < anchors.length) {
      to = anchors[i + 1].from;
    }
    const slice = messages2.slice(from, Math.max(from, to));
    if (slice.length > 0) {
      result.set(taskId, slice);
    }
  }
  for (const task of tasks) {
    const execution = queryNodeExecution(workflowContext, task.id);
    const ranged = queryMessagesForNodeExecution(messages2, execution);
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
      const toolMsgs = messages2.filter((m) => m.role === "tool" && m.toolName === toolName);
      if (toolMsgs.length > 0) {
        result.set(task.id, toolMsgs);
      }
    }
  }
  const assigned = /* @__PURE__ */ new Set();
  for (const list of Array.from(result.values())) {
    for (const m of list) assigned.add(m.id);
  }
  const unassigned = messages2.filter((m) => !assigned.has(m.id));
  if (unassigned.length > 0 && anchors.length === 0) {
    const activeTasks = tasks.filter((t) => t.status !== "pending" && t.status !== "skipped");
    const targets = activeTasks.length > 0 ? activeTasks : tasks;
    if (targets.length === 1) {
      result.set(targets[0].id, messages2);
    } else if (targets.length > 1) {
      const chunk = Math.ceil(messages2.length / targets.length);
      targets.forEach((task, index2) => {
        if ((result.get(task.id)?.length ?? 0) > 0) return;
        result.set(task.id, messages2.slice(index2 * chunk, (index2 + 1) * chunk));
      });
    }
  }
  return result;
}
function queryRelatedMessagesForTask(session, task, workflowContext) {
  return queryRelatedMessagesByTask(session, [task], workflowContext).get(task.id) ?? [];
}
function formatContextJson(value) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}
function queryContextSliceForTask(context, task) {
  if (!context) return {};
  const slice = {};
  for (const [key, value] of Object.entries(context)) {
    if (key === task.id || key.includes(task.id) || key === `toast_${task.id}` || task.title && key.toLowerCase().includes(task.title.slice(0, 8).toLowerCase())) {
      slice[key] = value;
    }
  }
  return slice;
}
function querySuccessfulTasks(tasks) {
  return tasks.filter((task) => task.status === "done");
}
function querySuccessfulTaskExecutionContexts(session, workflowContext) {
  const successfulTasks = querySuccessfulTasks(session.tasks ?? []);
  return successfulTasks.map((task) => ({
    task,
    relatedMessages: queryRelatedMessagesForTask(session, task, workflowContext),
    contextSlice: queryContextSliceForTask(workflowContext, task)
  }));
}
function formatMessagesForLlm(messages2, maxChars = 4e3) {
  const lines = [];
  let total = 0;
  for (const msg of messages2) {
    const role = msg.role === "user" ? "用户" : msg.role === "assistant" ? "助手" : msg.role;
    const toolSuffix = msg.toolName ? ` [工具: ${msg.toolName}]` : "";
    const content = (msg.content ?? "").trim();
    if (!content) continue;
    const line = `- ${role}${toolSuffix}: ${content.slice(0, 800)}`;
    if (total + line.length > maxChars) {
      lines.push("- …（后续消息已截断）");
      break;
    }
    lines.push(line);
    total += line.length;
  }
  return lines.length > 0 ? lines.join("\n") : "（无关联对话）";
}
const SKILL_SUMMARIZE_LLM_SYSTEM = `你是 Cursor Agent 技能编写助手。根据用户提供的任务执行记录，将**已成功执行**的步骤经验总结为可复用的 Agent Skill（SKILL.md 正文）。

要求：
1. 只保留成功执行的步骤与有效经验，忽略失败、跳过、未执行的步骤
2. 正文使用 Markdown，结构参考：
   - # 标题
   - ## 适用场景
   - ## 标准任务清单（有序步骤，可含子步骤）
   - ## 工具与参数（如有）
   - ## 注意事项 / 常见问题
3. description 用于 Agent 自动发现技能，需说明触发场景（1～3 句）
4. name 为展示名称（中文或英文均可）
5. id 为小写连字符目录名，1～64 字符
6. examplesContent 可选，提供 1 个简短示例场景

仅返回 JSON 对象，不要 markdown 代码块：
{
  "id": "建议技能 id",
  "name": "技能名称",
  "description": "触发场景描述",
  "content": "SKILL.md 正文（Markdown，不含 frontmatter）",
  "examplesContent": "可选示例 Markdown"
}`;
function parseSkillSummarizeJson(text) {
  const trimmed = text.trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  try {
    const raw = JSON.parse(jsonMatch[0]);
    const content = typeof raw.content === "string" ? raw.content.trim() : "";
    if (!content) return null;
    const name = typeof raw.name === "string" && raw.name.trim() ? raw.name.trim() : typeof raw.id === "string" && raw.id.trim() ? raw.id.trim() : "";
    if (!name) return null;
    const description = typeof raw.description === "string" && raw.description.trim() ? raw.description.trim() : `从任务执行经验总结的技能：${name}`;
    const idSource = typeof raw.id === "string" && raw.id.trim() ? raw.id.trim() : slugifySkillImportId(name);
    const id = slugifySkillImportId(idSource);
    if (!isValidSkillImportId(id)) return null;
    const examplesRaw = raw.examplesContent;
    const examplesContent = typeof examplesRaw === "string" && examplesRaw.trim() ? examplesRaw.trim() : void 0;
    return { id, name, description, content, examplesContent };
  } catch {
    return null;
  }
}
function buildFallbackSkillFromTasks(sessionTitle, stepTitles) {
  const baseName = sessionTitle.trim() || "任务执行经验";
  const id = slugifySkillImportId(`${baseName}-skill`);
  const numberedSteps = stepTitles.map((title, i) => `${i + 1}. ${title}`).join("\n");
  return {
    id,
    name: `${baseName}（经验总结）`,
    description: `从「${baseName}」成功执行步骤总结的可复用流程，适用于类似任务场景。`,
    content: `# ${baseName}

## 适用场景

当需要重复执行与「${baseName}」类似的多步任务时使用本技能。

## 标准任务清单

${numberedSteps}

## 注意事项

- 以上步骤均来自已成功执行的记录，失败或未执行的步骤已剔除
- 执行过程中请用 \`update_task_list\` 同步任务清单状态
`,
    examplesContent: ""
  };
}
function queryLlmTextContent(content) {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content.map((block) => {
      if (typeof block === "string") return block;
      if (block && typeof block === "object" && "text" in block) {
        return String(block.text ?? "");
      }
      return "";
    }).join("");
  }
  return String(content ?? "");
}
function buildSummarizePrompt(sessionId) {
  const session = querySession(sessionId);
  if (!session) {
    throw new Error("会话不存在");
  }
  const workflowRun = queryLatestWorkflowRunBySession(sessionId);
  const contexts = querySuccessfulTaskExecutionContexts(session, workflowRun?.context);
  if (contexts.length === 0) {
    throw new Error("没有成功执行的步骤可总结，请先完成至少一个任务步骤");
  }
  const sessionTitle = session.title?.trim() || "未命名会话";
  const sessionType = session.type ?? "chat";
  const stepBlocks = contexts.map((ctx, index2) => {
    const messagesText = formatMessagesForLlm(ctx.relatedMessages);
    const contextJson = formatContextJson(ctx.contextSlice);
    return [
      `### 步骤 ${index2 + 1}：${ctx.task.title}`,
      `状态：${ctx.task.status}`,
      "",
      "关联对话：",
      messagesText,
      "",
      "上下文数据：",
      contextJson || "（无）"
    ].join("\n");
  });
  return [
    `会话标题：${sessionTitle}`,
    `会话类型：${sessionType}`,
    `成功步骤数：${contexts.length}`,
    "",
    "以下为已成功执行的步骤及执行记录（失败/跳过/未执行步骤已剔除）：",
    "",
    stepBlocks.join("\n\n---\n\n")
  ].join("\n");
}
async function postSummarizeSkillFromSession(sessionId) {
  const trimmedId = sessionId.trim();
  if (!trimmedId) {
    throw new Error("缺少 sessionId");
  }
  const session = querySession(trimmedId);
  if (!session) {
    throw new Error("会话不存在");
  }
  const contexts = querySuccessfulTaskExecutionContexts(
    session,
    queryLatestWorkflowRunBySession(trimmedId)?.context
  );
  if (contexts.length === 0) {
    throw new Error("没有成功执行的步骤可总结");
  }
  const prompt = buildSummarizePrompt(trimmedId);
  const settings = querySettings();
  if (settings.apiKey) {
    try {
      const model = createChatModel(settings).withConfig({
        response_format: { type: "json_object" }
      });
      const result = await model.invoke([
        new messages.SystemMessage(SKILL_SUMMARIZE_LLM_SYSTEM),
        new messages.HumanMessage(`请根据以下任务执行记录总结为 Agent Skill：

${prompt}`)
      ]);
      const parsed = parseSkillSummarizeJson(queryLlmTextContent(result.content));
      if (parsed) return parsed;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn("[skill-summarize] LLM failed, fallback to template:", msg);
    }
  }
  return buildFallbackSkillFromTasks(
    session.title?.trim() || "任务执行",
    contexts.map((ctx) => ctx.task.title)
  );
}
const IMAGE_EXT$1 = /* @__PURE__ */ new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp", ".svg"]);
const MAX_BYTES = 8 * 1024 * 1024;
const MIME$1 = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".bmp": "image/bmp",
  ".svg": "image/svg+xml"
};
function queryLocalImageDataUrl(filePath) {
  if (!filePath?.trim()) return null;
  const abs = path.normalize(path.resolve(filePath.trim()));
  const ext = path.extname(abs).toLowerCase();
  if (!IMAGE_EXT$1.has(ext)) return null;
  if (!fs.existsSync(abs)) return null;
  const size = fs.statSync(abs).size;
  if (size > MAX_BYTES) return null;
  try {
    const buf = fs.readFileSync(abs);
    const mime = MIME$1[ext] ?? "application/octet-stream";
    return `data:${mime};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}
const IMAGE_EXT = /* @__PURE__ */ new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp"]);
const VIDEO_EXT$1 = /* @__PURE__ */ new Set([".mp4", ".mov", ".webm", ".mkv"]);
const AUDIO_EXT$1 = /* @__PURE__ */ new Set([".wav", ".mp3", ".m4a", ".aac", ".ogg"]);
const ALLOWED_EXT = /* @__PURE__ */ new Set([
  ...Array.from(IMAGE_EXT),
  ...Array.from(VIDEO_EXT$1),
  ...Array.from(AUDIO_EXT$1)
]);
const MIME_TO_EXT = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/bmp": ".bmp",
  "video/mp4": ".mp4",
  "video/quicktime": ".mov",
  "video/webm": ".webm",
  "video/x-matroska": ".mkv",
  "audio/wav": ".wav",
  "audio/x-wav": ".wav",
  "audio/mpeg": ".mp3",
  "audio/mp3": ".mp3",
  "audio/mp4": ".m4a",
  "audio/aac": ".aac",
  "audio/ogg": ".ogg"
};
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_MEDIA_BYTES = 64 * 1024 * 1024;
function querySanitizeBasename(name) {
  return name.replace(/[/\\?%*:|"<>]/g, "_").trim() || "paste";
}
function queryChatUploadExt(name, mimeType) {
  const mime = (mimeType ?? "").trim().toLowerCase();
  if (mime && MIME_TO_EXT[mime]) return MIME_TO_EXT[mime];
  const rawName = (name ?? "").trim();
  const ext = path.extname(rawName).toLowerCase();
  if (ALLOWED_EXT.has(ext)) return ext;
  if (mime.startsWith("image/")) return ".png";
  return "";
}
function queryMaxBytes(ext) {
  return IMAGE_EXT.has(ext) ? MAX_IMAGE_BYTES : MAX_MEDIA_BYTES;
}
function postSaveChatUpload(input) {
  const base64 = typeof input?.base64 === "string" ? input.base64.trim() : "";
  if (!base64) {
    return { ok: false, error: "附件内容为空" };
  }
  const ext = queryChatUploadExt(input.name, input.mimeType);
  if (!ext || !ALLOWED_EXT.has(ext)) {
    return { ok: false, error: "不支持的附件类型（仅图片 / 视频 / 音频）" };
  }
  let buf;
  try {
    buf = Buffer.from(base64, "base64");
  } catch {
    return { ok: false, error: "附件解码失败" };
  }
  if (!buf.length) {
    return { ok: false, error: "附件内容为空" };
  }
  const maxBytes = queryMaxBytes(ext);
  if (buf.length > maxBytes) {
    const maxMb = Math.round(maxBytes / (1024 * 1024));
    return { ok: false, error: `附件过大（上限 ${maxMb}MB）` };
  }
  const stem = querySanitizeBasename(
    (input.name ?? "paste").replace(/\.[^.]+$/, "") || "paste"
  );
  const fileName = `${stem}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
  const abs = path.join(getChatUploadsDir(), fileName);
  try {
    fs.writeFileSync(abs, buf);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: `写入失败：${msg}` };
  }
  return { ok: true, path: abs };
}
const AUDIO_EXT = /* @__PURE__ */ new Set([".wav", ".mp3", ".m4a", ".aac", ".ogg"]);
const VIDEO_EXT = /* @__PURE__ */ new Set([".mp4", ".mov", ".webm", ".mkv"]);
const HTML_EXT = /* @__PURE__ */ new Set([".html", ".htm"]);
const MIME = {
  ".wav": "audio/wav",
  ".mp3": "audio/mpeg",
  ".m4a": "audio/mp4",
  ".aac": "audio/aac",
  ".ogg": "audio/ogg",
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
  ".webm": "video/webm",
  ".mkv": "video/x-matroska",
  ".html": "text/html",
  ".htm": "text/html"
};
function queryResolveLocalMediaPath(filePath) {
  if (!filePath?.trim()) return null;
  const abs = path.normalize(path.resolve(filePath.trim()));
  const ext = path.extname(abs).toLowerCase();
  const mime = MIME[ext];
  if (!mime) return null;
  if (!fs.existsSync(abs)) return null;
  if (!AUDIO_EXT.has(ext) && !VIDEO_EXT.has(ext) && !HTML_EXT.has(ext)) return null;
  const kind = AUDIO_EXT.has(ext) ? "audio" : VIDEO_EXT.has(ext) ? "video" : "html";
  return { abs, kind, mime };
}
function queryLocalMediaUrl(filePath) {
  const resolved = queryResolveLocalMediaPath(filePath);
  if (!resolved) return null;
  return `media://local/?path=${encodeURIComponent(resolved.abs)}`;
}
function queryPathFromMediaUrl(url2) {
  if (!url2?.trim()) return null;
  try {
    const parsed = new URL(url2);
    if (parsed.protocol !== "media:") return null;
    const fromQuery = parsed.searchParams.get("path");
    if (fromQuery?.trim()) {
      return queryResolveLocalMediaPath(fromQuery)?.abs ?? null;
    }
    let raw = decodeURIComponent(parsed.pathname || "");
    if (raw.startsWith("/")) raw = raw.slice(1);
    if (!raw) return null;
    let candidate = decodeURIComponent(raw);
    if (!candidate.startsWith("/") && !/^[A-Za-z]:[\\/]/.test(candidate)) {
      candidate = `/${candidate}`;
    }
    return queryResolveLocalMediaPath(candidate)?.abs ?? null;
  } catch {
    const prefix = "media://local/";
    if (!url2.startsWith(prefix)) return null;
    try {
      const rest = url2.slice(prefix.length);
      const qIndex = rest.indexOf("?");
      if (qIndex >= 0) {
        const params = new URLSearchParams(rest.slice(qIndex + 1));
        const p = params.get("path");
        if (p) return queryResolveLocalMediaPath(p)?.abs ?? null;
      }
      const decoded = decodeURIComponent(qIndex >= 0 ? rest.slice(0, qIndex) : rest);
      const candidate = decoded.startsWith("/") ? decoded : `/${decoded}`;
      return queryResolveLocalMediaPath(candidate)?.abs ?? null;
    } catch {
      return null;
    }
  }
}
async function detectNeedLogin(page) {
  const url2 = page.url();
  if (/login|passport|signin|sso/i.test(url2)) return true;
  const loginVisible = await page.getByText(/登录|扫码登录|手机号登录/, { exact: false }).first().isVisible().catch(() => false);
  const editorVisible = await page.locator(
    'div.upload-content, input[type=file], [contenteditable="true"], textarea'
  ).first().isVisible().catch(() => false);
  if (editorVisible) return false;
  return loginVisible;
}
async function queryChannelLoginStatus(channelId) {
  const meta = queryPublishChannelMeta(channelId);
  const checkedAt = Date.now();
  if (!meta.enabled || !meta.loginCheckUrl) {
    return {
      channelId,
      state: "unsupported",
      checkedAt,
      message: "该渠道尚未接入"
    };
  }
  try {
    const browser = getBrowserService();
    const page = await browser.ensureStarted();
    await page.goto(meta.loginCheckUrl, {
      waitUntil: "domcontentloaded",
      timeout: 6e4
    });
    await page.waitForTimeout(2e3);
    const needLogin = await detectNeedLogin(page);
    return {
      channelId,
      state: needLogin ? "logged_out" : "logged_in",
      checkedAt,
      message: needLogin ? "请在浏览器中扫码或账号登录" : "创作者中心已登录"
    };
  } catch (err) {
    return {
      channelId,
      state: "error",
      checkedAt,
      message: err instanceof Error ? err.message : String(err)
    };
  }
}
async function queryAllChannelLoginStatuses() {
  const results = [];
  for (const channel of getPublishChannels()) {
    if (normalizeChannelKind(channel.kind) !== "publish") continue;
    results.push(await queryChannelLoginStatus(channel.id));
  }
  return results;
}
async function postOpenChannelLogin(channelId) {
  const meta = queryPublishChannelMeta(channelId);
  if (!meta.enabled || !meta.loginCheckUrl) {
    throw new Error(`${meta.label} 尚未接入，暂无法打开登录页`);
  }
  const browser = getBrowserService();
  await browser.navigate(meta.loginCheckUrl);
  return browser.getStatus();
}
const IMAGE_EXTS = /* @__PURE__ */ new Set(["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico", "avif"]);
const VIDEO_EXTS = /* @__PURE__ */ new Set(["mp4", "mov", "webm", "mkv", "avi", "m4v"]);
const AUDIO_EXTS = /* @__PURE__ */ new Set(["mp3", "wav", "m4a", "aac", "ogg", "flac"]);
const HTML_EXTS = /* @__PURE__ */ new Set(["html", "htm"]);
const DOC_EXTS = /* @__PURE__ */ new Set([
  "md",
  "txt",
  "json",
  "csv",
  "xml",
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "yaml",
  "yml",
  "ts",
  "tsx",
  "js",
  "jsx",
  "css",
  "scss"
]);
function queryAgentAssetKind(fileName) {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  if (IMAGE_EXTS.has(ext)) return "image";
  if (VIDEO_EXTS.has(ext)) return "video";
  if (AUDIO_EXTS.has(ext)) return "audio";
  if (HTML_EXTS.has(ext)) return "html";
  if (DOC_EXTS.has(ext)) return "document";
  return "other";
}
const SKIP_DIR_NAMES = /* @__PURE__ */ new Set([
  "node_modules",
  ".git",
  ".cache",
  ".turbo",
  ".next",
  "dist",
  "build",
  "coverage",
  "__pycache__"
]);
function queryAllowedRoots() {
  return [path.resolve(getArtifactsDir()), path.resolve(getVideosDir())];
}
function queryIsAllowedAssetPath(filePath) {
  const normalized = path.resolve(String(filePath ?? "").trim());
  if (!normalized) return false;
  return queryAllowedRoots().some(
    (root) => normalized === root || normalized.startsWith(`${root}${path.sep}`)
  );
}
function queryZoneFromPath(absPath, artifactsRoot, videosRoot) {
  const normalized = path.resolve(absPath);
  if (normalized.startsWith(`${artifactsRoot}${path.sep}`) || normalized === artifactsRoot) {
    return "artifacts";
  }
  const rel = path.relative(videosRoot, normalized).replace(/\\/g, "/");
  if (rel.startsWith("scenes/")) return "videos/scenes";
  if (rel.startsWith("projects/")) return "videos/projects";
  return "videos/other";
}
function queryIsRemotionProjectsRoot(dir) {
  return path.basename(dir) === "remotion" && path.basename(path.dirname(dir)) === "videos";
}
function walkFiles(dir, out) {
  if (!fs.existsSync(dir)) return;
  let entries;
  try {
    entries = fs.readdirSync(dir);
  } catch {
    return;
  }
  const remotionRoot = queryIsRemotionProjectsRoot(dir);
  for (const name of entries) {
    if (SKIP_DIR_NAMES.has(name)) continue;
    const full = path.join(dir, name);
    let st;
    try {
      st = fs.statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      if (remotionRoot) {
        walkFiles(path.join(full, "out"), out);
        walkFiles(path.join(full, "public"), out);
        continue;
      }
      walkFiles(full, out);
    } else if (st.isFile()) {
      out.push(full);
    }
  }
}
function queryAgentAssets(options) {
  const artifactsRoot = path.resolve(getArtifactsDir());
  const videosRoot = path.resolve(getVideosDir());
  const kindFilter = options?.kind ?? "all";
  const files = [];
  walkFiles(artifactsRoot, files);
  walkFiles(videosRoot, files);
  const records = files.map((filePath) => {
    const st = fs.statSync(filePath);
    const name = filePath.split(/[/\\]/).pop() ?? filePath;
    return {
      path: filePath,
      name,
      size: st.size,
      mtime: st.mtime.toISOString(),
      kind: queryAgentAssetKind(name),
      zone: queryZoneFromPath(filePath, artifactsRoot, videosRoot)
    };
  });
  const filtered = kindFilter === "all" ? records : records.filter((r) => r.kind === kindFilter);
  return filtered.sort((a, b) => b.mtime.localeCompare(a.mtime));
}
function postDeleteAgentAsset(filePath) {
  const normalized = path.resolve(String(filePath ?? "").trim());
  if (!queryIsAllowedAssetPath(normalized)) {
    throw new Error("不允许删除该路径");
  }
  if (!fs.existsSync(normalized)) {
    return { ok: true, deletedCount: 0 };
  }
  const st = fs.statSync(normalized);
  if (!st.isFile()) {
    throw new Error("仅支持删除文件");
  }
  fs.unlinkSync(normalized);
  return { ok: true, deletedCount: 1 };
}
function postClearAgentAssets() {
  const roots = queryAllowedRoots();
  let deletedCount = 0;
  for (const root of roots) {
    if (!fs.existsSync(root)) continue;
    const files = [];
    walkFiles(root, files);
    deletedCount += files.length;
    fs.rmSync(root, { recursive: true, force: true });
  }
  getArtifactsDir();
  getVideosDir();
  return { ok: true, deletedCount };
}
function postDeleteAgentAssets(paths) {
  let deletedCount = 0;
  for (const p of paths) {
    const result = postDeleteAgentAsset(p);
    deletedCount += result.deletedCount;
  }
  return { ok: true, deletedCount };
}
const TEXT_PREVIEW_MAX_BYTES = 512e3;
function queryAgentAssetTextPreview(filePath) {
  const normalized = path.resolve(String(filePath ?? "").trim());
  if (!queryIsAllowedAssetPath(normalized) || !fs.existsSync(normalized)) return null;
  const st = fs.statSync(normalized);
  if (!st.isFile() || st.size > TEXT_PREVIEW_MAX_BYTES) return null;
  try {
    return fs.readFileSync(normalized, "utf-8");
  } catch {
    return null;
  }
}
function queryComfyBaseUrl() {
  const settings = querySettings();
  const url2 = settings.comfyUi?.baseUrl?.trim() || "http://127.0.0.1:8188";
  return url2.replace(/\/+$/, "");
}
async function queryComfyUiStatus() {
  const baseUrl = queryComfyBaseUrl();
  const settings = querySettings();
  if (settings.comfyUi && settings.comfyUi.enabled === false) {
    return { ok: false, baseUrl, message: "ComfyUI 连接已在设置中关闭" };
  }
  try {
    await queryHttp(`${baseUrl}/system_stats`, { timeoutMs: 8e3, retries: 0 });
    return { ok: true, baseUrl, message: "连接成功" };
  } catch (err1) {
    try {
      await queryHttp(`${baseUrl}/`, { timeoutMs: 8e3, retries: 0 });
      return { ok: true, baseUrl, message: "连接成功（根路径）" };
    } catch (err2) {
      const msg = err2 instanceof Error ? err2.message : err1 instanceof Error ? err1.message : String(err2);
      return { ok: false, baseUrl, message: `连接失败：${msg}` };
    }
  }
}
async function postComfyUploadImage(localPath, options) {
  const baseUrl = queryComfyBaseUrl();
  if (!fs.existsSync(localPath)) {
    throw new Error(`参考图不存在：${localPath}`);
  }
  const fileName = path.basename(localPath).replace(/[^\w.\-]+/g, "_");
  const buffer = await import("fs/promises").then((fs2) => fs2.readFile(localPath));
  const form = new FormData();
  form.append("image", new Blob([new Uint8Array(buffer)]), fileName);
  form.append("type", "input");
  form.append("overwrite", "true");
  const res = await fetch(`${baseUrl}/upload/image`, {
    method: "POST",
    body: form
  });
  if (!res.ok) {
    throw new HttpError(`上传图片失败 HTTP ${res.status}`, res.status, `${baseUrl}/upload/image`);
  }
  const json = await res.json();
  if (!json?.name) {
    throw new Error("上传图片响应缺少 name 字段");
  }
  return json;
}
async function postComfyPrompt(workflow, options) {
  const baseUrl = options?.baseUrl ?? queryComfyBaseUrl();
  const clientId = options?.clientId ?? `lingxi-${crypto$1.randomUUID()}`;
  const res = await postHttpJson(
    `${baseUrl}/prompt`,
    { prompt: workflow, client_id: clientId },
    { timeoutMs: 6e4 }
  );
  if (!res.prompt_id) {
    throw new Error(`ComfyUI /prompt 未返回 prompt_id：${JSON.stringify(res)}`);
  }
  return res.prompt_id;
}
async function queryComfyWaitResult(promptId, options) {
  const baseUrl = options?.baseUrl ?? queryComfyBaseUrl();
  const intervalMs = options?.intervalMs ?? 1200;
  const timeoutMs = options?.timeoutMs ?? 15 * 6e4;
  const start = Date.now();
  while (true) {
    if (options?.signal?.aborted) {
      throw new Error("已取消 ComfyUI 任务等待");
    }
    if (Date.now() - start > timeoutMs) {
      throw new Error(`ComfyUI 任务超时（${Math.round(timeoutMs / 1e3)}s）：${promptId}`);
    }
    const history2 = await queryHttpJson(
      `${baseUrl}/history/${promptId}`,
      { timeoutMs: 2e4, signal: options?.signal }
    );
    if (history2 && promptId in history2) {
      return history2[promptId]?.outputs ?? {};
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}
function queryComfyFirstMedia(outputs) {
  for (const nodeOut of Object.values(outputs)) {
    if (nodeOut.images?.length) {
      const img = nodeOut.images[0];
      return { ...img, kind: "image" };
    }
    if (nodeOut.gifs?.length) {
      const g = nodeOut.gifs[0];
      return { ...g, kind: "video" };
    }
    if (nodeOut.videos?.length) {
      const v = nodeOut.videos[0];
      return { ...v, kind: "video" };
    }
  }
  return null;
}
async function queryComfyDownloadView(info, destPath, options) {
  const baseUrl = options?.baseUrl ?? queryComfyBaseUrl();
  const params = new URLSearchParams({
    filename: info.filename,
    type: info.type || "output",
    subfolder: info.subfolder || ""
  });
  const res = await queryHttp(`${baseUrl}/view?${params.toString()}`, {
    timeoutMs: 12e4
  });
  const buf = Buffer.from(await res.arrayBuffer());
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.writeFileSync(destPath, buf);
  return destPath;
}
async function postComfyRunAndDownload(params) {
  const promptId = await postComfyPrompt(params.workflow, { baseUrl: params.baseUrl });
  const outputs = await queryComfyWaitResult(promptId, {
    signal: params.signal,
    baseUrl: params.baseUrl
  });
  const media = queryComfyFirstMedia(outputs);
  if (!media) {
    throw new Error("ComfyUI 任务完成但未找到图片/视频输出");
  }
  const ext = media.filename.includes(".") ? media.filename.slice(media.filename.lastIndexOf(".")) : media.kind === "video" ? ".mp4" : ".png";
  const destPath = path.join(
    params.destDir,
    `${params.filePrefix ?? "out"}_${Date.now()}${ext}`
  );
  await queryComfyDownloadView(media, destPath, { baseUrl: params.baseUrl });
  return { localPath: destPath, mediaType: media.kind, promptId };
}
function queryWorkflowsApiRoot() {
  return path.join(queryBundledResourcesRoot(), "workflows-api");
}
const CATEGORIES = ["blueprints", "templates", "user"];
function walkJsonFiles(dir, acc) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkJsonFiles(full, acc);
      continue;
    }
    if (entry.isFile() && entry.name.endsWith(".json")) {
      acc.push(full);
    }
  }
}
function queryComfyWorkflows() {
  const root = queryWorkflowsApiRoot();
  if (!fs.existsSync(root)) return [];
  const list = [];
  for (const category of CATEGORIES) {
    const dir = path.join(root, category);
    if (!fs.existsSync(dir)) continue;
    const files = [];
    walkJsonFiles(dir, files);
    for (const full of files) {
      const relativePath = path.relative(root, full).replace(/\\/g, "/");
      const name = path.basename(full, ".json");
      list.push({
        id: relativePath,
        name,
        category,
        relativePath
      });
    }
  }
  return list.sort((a, b) => a.relativePath.localeCompare(b.relativePath, "zh-CN"));
}
function queryLoadComfyWorkflowPrompt(relativePath) {
  const root = queryWorkflowsApiRoot();
  const full = path.join(root, relativePath);
  if (!fs.existsSync(full) || !fs.statSync(full).isFile()) {
    throw new Error(`工作流不存在：${relativePath}`);
  }
  const raw = JSON.parse(fs.readFileSync(full, "utf-8"));
  if (!raw || typeof raw !== "object") {
    throw new Error(`工作流 JSON 无效：${relativePath}`);
  }
  const obj = raw;
  if (obj.prompt && typeof obj.prompt === "object") {
    return structuredClone(obj.prompt);
  }
  return structuredClone(obj);
}
const AI_VIDEO_DEFAULT_WORKFLOWS = {
  textToImage: "blueprints/Text to Image (Z-Image-Turbo).json",
  storyboard: "user/flux1_dev_uso_reference_image_gen.json",
  videoR2v: "user/video_minimax_h3_r2v.json",
  mergeVideos: "blueprints/Merge Videos.json"
};
function queryAiVideoBaseType(kind) {
  if (kind === "screenwriter" || kind === "script_text" || kind === "storyboard_text") {
    return "text";
  }
  if (kind === "video_gen" || kind === "video_merge") {
    return "video";
  }
  return "image";
}
function queryAiVideoDefaultWorkflow(kind) {
  switch (kind) {
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
function getProjectsRoot() {
  const dir = path.join(getDataRoot(), "ai-video-projects");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}
function queryAiVideoProjectDir(projectId) {
  const dir = path.join(getProjectsRoot(), projectId);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}
function queryAiVideoOutputsDir(projectId) {
  const dir = path.join(queryAiVideoProjectDir(projectId), "outputs");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}
function getProjectJsonPath(projectId) {
  return path.join(queryAiVideoProjectDir(projectId), "project.json");
}
function normalizeNode(raw) {
  const id = String(raw.id || "").trim();
  if (!id) return null;
  const kind = raw.kind;
  if (!kind) return null;
  const type = raw.type ?? queryAiVideoBaseType(kind);
  return {
    id,
    title: String(raw.title || "").trim() || AI_VIDEO_KIND_LABEL[kind] || "未命名",
    type,
    kind,
    position: {
      x: Number(raw.position?.x) || 0,
      y: Number(raw.position?.y) || 0
    },
    prompt: String(raw.prompt ?? ""),
    manualPrompt: raw.manualPrompt != null ? String(raw.manualPrompt) : void 0,
    workflowId: raw.workflowId?.trim() || queryAiVideoDefaultWorkflow(kind) || void 0,
    skillIds: Array.isArray(raw.skillIds) ? raw.skillIds.map(String).filter(Boolean) : void 0,
    status: raw.status ?? "idle",
    errorMessage: raw.errorMessage,
    result: raw.result,
    refs: Array.isArray(raw.refs) ? raw.refs.map(String).filter(Boolean) : void 0,
    autoGenerated: Boolean(raw.autoGenerated),
    autoKey: raw.autoKey
  };
}
function normalizeCanvas(raw) {
  if (!raw || typeof raw !== "object") {
    return { nodes: [], edges: [] };
  }
  const c = raw;
  const nodes = (Array.isArray(c.nodes) ? c.nodes : []).map((n) => normalizeNode(n)).filter((n) => n != null);
  const edges = (Array.isArray(c.edges) ? c.edges : []).map((e) => ({
    id: String(e.id || `${e.source}-${e.target}`),
    source: String(e.source),
    target: String(e.target)
  })).filter((e) => e.source && e.target);
  return {
    nodes,
    edges,
    viewport: c.viewport
  };
}
function normalizeProject(raw) {
  const now = Date.now();
  const id = String(raw.id || "").trim() || crypto$1.randomUUID();
  return {
    id,
    title: String(raw.title || "").trim() || "未命名画布",
    thumbnailPath: raw.thumbnailPath,
    createdAt: typeof raw.createdAt === "number" ? raw.createdAt : now,
    updatedAt: typeof raw.updatedAt === "number" ? raw.updatedAt : now,
    globalSkillIds: Array.isArray(raw.globalSkillIds) ? raw.globalSkillIds.map(String).filter(Boolean) : [],
    canvas: normalizeCanvas(raw.canvas)
  };
}
function queryAiVideoProjects() {
  const root = getProjectsRoot();
  const list = [];
  for (const name of fs.readdirSync(root, { withFileTypes: true })) {
    if (!name.isDirectory()) continue;
    const path2 = getProjectJsonPath(name.name);
    if (!fs.existsSync(path2)) continue;
    try {
      const raw = JSON.parse(fs.readFileSync(path2, "utf-8"));
      list.push(normalizeProject({ ...raw, id: name.name }));
    } catch {
    }
  }
  return list.sort((a, b) => b.updatedAt - a.updatedAt);
}
function queryAiVideoProject(id) {
  const path2 = getProjectJsonPath(id);
  if (!fs.existsSync(path2)) return null;
  try {
    const raw = JSON.parse(fs.readFileSync(path2, "utf-8"));
    return normalizeProject({ ...raw, id });
  } catch {
    return null;
  }
}
function postAiVideoProject(project) {
  const normalized = normalizeProject({
    ...project,
    updatedAt: Date.now()
  });
  const path2 = getProjectJsonPath(normalized.id);
  fs.mkdirSync(queryAiVideoProjectDir(normalized.id), { recursive: true });
  fs.writeFileSync(path2, JSON.stringify(normalized, null, 2), "utf-8");
  return normalized;
}
function postDeleteAiVideoProject(id) {
  const dir = path.join(getProjectsRoot(), id);
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}
function postPatchAiVideoNode(projectId, nodeId, patch) {
  const project = queryAiVideoProject(projectId);
  if (!project) return null;
  const nodes = project.canvas.nodes.map(
    (n) => n.id === nodeId ? normalizeNode({ ...n, ...patch, id: n.id }) : n
  );
  return postAiVideoProject({
    ...project,
    canvas: { ...project.canvas, nodes }
  });
}
function isNodeMap(wf) {
  const first = Object.values(wf)[0];
  return Boolean(first && typeof first === "object" && "class_type" in first);
}
function queryNodesByClassType(workflow, classTypes) {
  const set = new Set(classTypes);
  const ids = Object.keys(workflow).filter((id) => {
    const node = workflow[id];
    return node?.class_type && set.has(node.class_type);
  });
  return ids.sort((a, b) => Number(a) - Number(b) || a.localeCompare(b));
}
function postPatchComfyWorkflow(workflow, patch) {
  if (!isNodeMap(workflow)) {
    throw new Error("工作流不是 ComfyUI API 节点 map");
  }
  const wf = structuredClone(workflow);
  const textEncodeIds = queryNodesByClassType(wf, [
    "CLIPTextEncode",
    "TextEncodeQwenImageEditPlus",
    "CLIPTextEncodeFlux"
  ]);
  if (patch.positivePrompt != null && textEncodeIds[0]) {
    const node = wf[textEncodeIds[0]];
    if (node.inputs) {
      if ("text" in node.inputs) node.inputs.text = patch.positivePrompt;
      else if ("prompt" in node.inputs) node.inputs.prompt = patch.positivePrompt;
    }
  }
  if (patch.negativePrompt != null && textEncodeIds[1]) {
    const node = wf[textEncodeIds[1]];
    if (node.inputs && "text" in node.inputs) {
      node.inputs.text = patch.negativePrompt;
    }
  }
  if (patch.positivePrompt != null) {
    for (const node of Object.values(wf)) {
      if (!node.inputs) continue;
      const ct = node.class_type || "";
      if (!/Api|API|MiniMax|Wan|Kling|Seedance/i.test(ct) && !ct.includes("Text")) continue;
      if ("text" in node.inputs && (node.inputs.text == null || node.inputs.text === "")) {
        node.inputs.text = patch.positivePrompt;
      }
      if ("prompt" in node.inputs && (node.inputs.prompt == null || node.inputs.prompt === "")) {
        node.inputs.prompt = patch.positivePrompt;
      }
      if ("positive_prompt" in node.inputs && (node.inputs.positive_prompt == null || node.inputs.positive_prompt === "")) {
        node.inputs.positive_prompt = patch.positivePrompt;
      }
    }
  }
  const loadImageIds = queryNodesByClassType(wf, [
    "LoadImage",
    "LoadImageFromUrl",
    "LoadImageMask"
  ]);
  const refs = patch.referenceImageNames ?? [];
  for (let i = 0; i < Math.min(loadImageIds.length, refs.length); i++) {
    const node = wf[loadImageIds[i]];
    if (node.inputs && "image" in node.inputs) {
      node.inputs.image = refs[i];
    }
  }
  if (refs[0]) {
    for (const node of Object.values(wf)) {
      if (!node.inputs) continue;
      for (const key of ["image", "first_frame_image", "subject_image", "ref_image"]) {
        if (key in node.inputs && (node.inputs[key] == null || node.inputs[key] === "")) {
          node.inputs[key] = refs[0];
        }
      }
    }
  }
  if (patch.nodeInputs) {
    for (const [nodeId, inputs] of Object.entries(patch.nodeInputs)) {
      const node = wf[nodeId];
      if (!node) continue;
      node.inputs = { ...node.inputs ?? {}, ...inputs };
    }
  }
  return wf;
}
function queryComfyWorkflowSlots(workflow) {
  const loadImageNodeIds = queryNodesByClassType(workflow, [
    "LoadImage",
    "LoadImageFromUrl",
    "LoadImageMask"
  ]);
  const textEncodeNodeIds = queryNodesByClassType(workflow, [
    "CLIPTextEncode",
    "TextEncodeQwenImageEditPlus",
    "CLIPTextEncodeFlux"
  ]);
  const classTypes = Array.from(
    new Set(
      Object.values(workflow).map((n) => n?.class_type).filter(Boolean)
    )
  );
  return { loadImageNodeIds, textEncodeNodeIds, classTypes };
}
const abortControllers = /* @__PURE__ */ new Map();
function postBroadcastNodeEvent(event) {
  for (const win of electron.BrowserWindow.getAllWindows()) {
    win.webContents.send(IpcChannels.onAiVideoNodeEvent, event);
  }
}
function queryEffectivePrompt(node) {
  return (node.manualPrompt?.trim() || node.prompt || "").trim();
}
function querySkillCtx(project, node) {
  return {
    sessionSkillIds: [...project.globalSkillIds ?? [], ...node.skillIds ?? []]
  };
}
function queryUpstreamNodes(project, nodeId) {
  const incoming = project.canvas.edges.filter((e) => e.target === nodeId);
  return incoming.map((e) => project.canvas.nodes.find((n) => n.id === e.source)).filter((n) => Boolean(n));
}
function queryValidateNodeRefs(project, node) {
  const upstream = queryUpstreamNodes(project, node.id);
  const upstreamIds = new Set(upstream.map((n) => n.id));
  const refs = node.refs ?? [];
  const resolved = [];
  for (const refId of refs) {
    if (!upstreamIds.has(refId)) {
      return {
        ok: false,
        message: `@ 引用 ${refId} 未连接到当前节点，只能引用已连线的角色三视图/场景/道具`
      };
    }
    const target = upstream.find((n) => n.id === refId);
    if (!AI_VIDEO_REF_KINDS.includes(target.kind)) {
      return {
        ok: false,
        message: `@ 引用「${target.title}」类型不可用，仅支持角色三视图/场景/道具`
      };
    }
    resolved.push(target);
  }
  return { ok: true, refs: resolved };
}
function queryTopologicalNodeIds(project) {
  const nodes = project.canvas.nodes;
  const indeg = new Map(nodes.map((n) => [n.id, 0]));
  const adj = /* @__PURE__ */ new Map();
  for (const e of project.canvas.edges) {
    if (!indeg.has(e.source) || !indeg.has(e.target)) continue;
    indeg.set(e.target, (indeg.get(e.target) ?? 0) + 1);
    const list = adj.get(e.source) ?? [];
    list.push(e.target);
    adj.set(e.source, list);
  }
  const queue = nodes.filter((n) => (indeg.get(n.id) ?? 0) === 0).map((n) => n.id);
  const order = [];
  while (queue.length) {
    const id = queue.shift();
    order.push(id);
    for (const next of adj.get(id) ?? []) {
      const d = (indeg.get(next) ?? 0) - 1;
      indeg.set(next, d);
      if (d === 0) queue.push(next);
    }
  }
  for (const n of nodes) {
    if (!order.includes(n.id)) order.push(n.id);
  }
  return order;
}
async function queryLlmJson(params) {
  const settings = querySettings();
  const model = createChatModel(settings, "script");
  const skillBlock = params.skillCtx ? queryInjectableSkillPrompt(4e3, params.skillCtx) : "";
  const system = skillBlock ? `${params.system}

## 可用技能目录
${skillBlock}` : params.system;
  const res = await model.invoke([
    new messages.SystemMessage(system),
    new messages.HumanMessage(params.user)
  ]);
  const text = typeof res.content === "string" ? res.content : JSON.stringify(res.content);
  const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  if (!match) {
    throw new Error("大模型未返回可解析 JSON");
  }
  return JSON.parse(match[0]);
}
function queryOrCreateAutoNode(project, params) {
  const existing = project.canvas.nodes.find((n) => n.autoKey === params.autoKey);
  if (existing) {
    const nodes = project.canvas.nodes.map(
      (n) => n.id === existing.id ? {
        ...n,
        title: params.title,
        prompt: params.prompt,
        workflowId: n.workflowId || queryAiVideoDefaultWorkflow(params.kind)
      } : n
    );
    return {
      project: { ...project, canvas: { ...project.canvas, nodes } },
      nodeId: existing.id
    };
  }
  const id = crypto$1.randomUUID();
  const node = {
    id,
    title: params.title,
    type: queryAiVideoBaseType(params.kind),
    kind: params.kind,
    position: params.position,
    prompt: params.prompt,
    workflowId: queryAiVideoDefaultWorkflow(params.kind),
    status: "idle",
    autoGenerated: true,
    autoKey: params.autoKey
  };
  return {
    project: {
      ...project,
      canvas: {
        ...project.canvas,
        nodes: [...project.canvas.nodes, node]
      }
    },
    nodeId: id
  };
}
function postEnsureEdge(project, source, target) {
  if (project.canvas.edges.some((e) => e.source === source && e.target === target)) {
    return project;
  }
  const edge = {
    id: `e-${source.slice(0, 8)}-${target.slice(0, 8)}`,
    source,
    target
  };
  return {
    ...project,
    canvas: { ...project.canvas, edges: [...project.canvas.edges, edge] }
  };
}
async function postRunScreenwriter(project, node, signal) {
  const userInput = queryEffectivePrompt(node);
  if (!userInput) {
    throw new Error("请先填写编剧大纲或用户输入");
  }
  if (signal.aborted) throw new Error("已取消");
  const payload = await queryLlmJson({
    skillCtx: querySkillCtx(project, node),
    system: `你是资深短剧/AI视频编剧。根据用户输入产出专业剧本结构化 JSON（不要 markdown）。
字段：
- style: 整体视觉风格（后续所有节点必须遵循）
- script: 完整剧本文本
- characters: [{name, description, imagePrompt}] 角色设定与定妆 AI 绘图提示词
- scenes: [{name, description, imagePrompt}]
- props: [{name, description, imagePrompt}]
- storyboards: [{name, description, imagePrompt, refNames}] 分镜；refNames 引用上面角色/场景/道具的 name
只输出 JSON。`,
    user: userInput
  });
  let next = project;
  const screenwriterId = node.id;
  const scriptRes = queryOrCreateAutoNode(next, {
    autoKey: "script_text:main",
    kind: "script_text",
    title: "剧本",
    prompt: "",
    position: { x: node.position.x + 320, y: node.position.y }
  });
  next = scriptRes.project;
  next = {
    ...next,
    canvas: {
      ...next.canvas,
      nodes: next.canvas.nodes.map(
        (n) => n.id === scriptRes.nodeId ? {
          ...n,
          status: "success",
          result: {
            text: `【风格】${payload.style}

${payload.script}`,
            mediaType: "text"
          },
          prompt: payload.style
        } : n.id === screenwriterId ? {
          ...n,
          status: "success",
          result: {
            text: payload.script,
            mediaType: "text"
          }
        } : n
      )
    }
  };
  next = postEnsureEdge(next, screenwriterId, scriptRes.nodeId);
  const charViewIds = /* @__PURE__ */ new Map();
  const sceneIds = /* @__PURE__ */ new Map();
  const propIds = /* @__PURE__ */ new Map();
  let col = 0;
  for (const ch of payload.characters ?? []) {
    const charRes = queryOrCreateAutoNode(next, {
      autoKey: `character:${ch.name}`,
      kind: "character",
      title: `定妆·${ch.name}`,
      prompt: `${payload.style}。${ch.imagePrompt || ch.description}`,
      position: { x: node.position.x + 320, y: node.position.y + 180 + col * 140 }
    });
    next = charRes.project;
    next = postEnsureEdge(next, screenwriterId, charRes.nodeId);
    const viewsRes = queryOrCreateAutoNode(next, {
      autoKey: `character_views:${ch.name}`,
      kind: "character_views",
      title: `三视图·${ch.name}`,
      prompt: `${payload.style}。角色三视图，正面侧面背面，白底，${ch.name}，${ch.description}`,
      position: { x: node.position.x + 640, y: node.position.y + 180 + col * 140 }
    });
    next = viewsRes.project;
    next = postEnsureEdge(next, charRes.nodeId, viewsRes.nodeId);
    charViewIds.set(ch.name, viewsRes.nodeId);
    col++;
  }
  let row = 0;
  for (const sc of payload.scenes ?? []) {
    const scRes = queryOrCreateAutoNode(next, {
      autoKey: `scene:${sc.name}`,
      kind: "scene",
      title: `场景·${sc.name}`,
      prompt: `${payload.style}。${sc.imagePrompt || sc.description}`,
      position: {
        x: node.position.x + 320,
        y: node.position.y + 180 + col * 140 + row * 140
      }
    });
    next = scRes.project;
    next = postEnsureEdge(next, screenwriterId, scRes.nodeId);
    sceneIds.set(sc.name, scRes.nodeId);
    row++;
  }
  for (const pr of payload.props ?? []) {
    const prRes = queryOrCreateAutoNode(next, {
      autoKey: `prop:${pr.name}`,
      kind: "prop",
      title: `道具·${pr.name}`,
      prompt: `${payload.style}。${pr.imagePrompt || pr.description}`,
      position: {
        x: node.position.x + 320,
        y: node.position.y + 180 + (col + row) * 140
      }
    });
    next = prRes.project;
    next = postEnsureEdge(next, screenwriterId, prRes.nodeId);
    propIds.set(pr.name, prRes.nodeId);
    row++;
  }
  let sbIndex = 0;
  const storyboardIds = [];
  for (const sb of payload.storyboards ?? []) {
    const sbText = queryOrCreateAutoNode(next, {
      autoKey: `storyboard_text:${sb.name}`,
      kind: "storyboard_text",
      title: `分镜文·${sb.name}`,
      prompt: sb.description,
      position: { x: node.position.x + 960, y: node.position.y + sbIndex * 160 }
    });
    next = sbText.project;
    next = {
      ...next,
      canvas: {
        ...next.canvas,
        nodes: next.canvas.nodes.map(
          (n) => n.id === sbText.nodeId ? {
            ...n,
            status: "success",
            result: { text: sb.description, mediaType: "text" }
          } : n
        )
      }
    };
    const refIds = [];
    for (const name of sb.refNames ?? []) {
      const id = charViewIds.get(name) || sceneIds.get(name) || propIds.get(name);
      if (id) refIds.push(id);
    }
    const sbImg = queryOrCreateAutoNode(next, {
      autoKey: `storyboard:${sb.name}`,
      kind: "storyboard",
      title: `分镜·${sb.name}`,
      prompt: `${payload.style}。${sb.imagePrompt || sb.description}`,
      position: { x: node.position.x + 1280, y: node.position.y + sbIndex * 160 }
    });
    next = sbImg.project;
    next = {
      ...next,
      canvas: {
        ...next.canvas,
        nodes: next.canvas.nodes.map(
          (n) => n.id === sbImg.nodeId ? { ...n, refs: refIds } : n
        )
      }
    };
    next = postEnsureEdge(next, screenwriterId, sbImg.nodeId);
    next = postEnsureEdge(next, sbText.nodeId, sbImg.nodeId);
    for (const refId of refIds) {
      next = postEnsureEdge(next, refId, sbImg.nodeId);
    }
    const vid = queryOrCreateAutoNode(next, {
      autoKey: `video_gen:${sb.name}`,
      kind: "video_gen",
      title: `视频·${sb.name}`,
      prompt: sb.description,
      position: { x: node.position.x + 1600, y: node.position.y + sbIndex * 160 }
    });
    next = vid.project;
    next = postEnsureEdge(next, sbImg.nodeId, vid.nodeId);
    storyboardIds.push(vid.nodeId);
    sbIndex++;
  }
  if (storyboardIds.length) {
    const merge = queryOrCreateAutoNode(next, {
      autoKey: "video_merge:final",
      kind: "video_merge",
      title: "合成成片",
      prompt: "按分镜顺序合并全部镜头视频",
      position: { x: node.position.x + 1920, y: node.position.y + 80 }
    });
    next = merge.project;
    for (const vidId of storyboardIds) {
      next = postEnsureEdge(next, vidId, merge.nodeId);
    }
  }
  return postAiVideoProject(next);
}
async function queryLlmWorkflowPatch(params) {
  const slots = queryComfyWorkflowSlots(params.workflow);
  try {
    const parsed = await queryLlmJson({
      skillCtx: params.skillCtx,
      system: `你是 ComfyUI 工作流参数工程师。根据用户提示词与工作流槽位，输出 JSON：
{ "positivePrompt": string, "negativePrompt"?: string, "nodeInputs"?: { [nodeId]: { ... } } }
nodeInputs 仅在确需覆盖特定节点时使用。不要输出 markdown。
工作流：${params.workflowId}
LoadImage 节点：${slots.loadImageNodeIds.join(",") || "无"}
文本编码节点：${slots.textEncodeNodeIds.join(",") || "无"}
class_types：${slots.classTypes.slice(0, 40).join(", ")}
${params.hasRefs ? "已有参考图将由系统注入 LoadImage，你只需优化提示词。" : ""}`,
      user: params.prompt
    });
    return {
      positivePrompt: parsed.positivePrompt?.trim() || params.prompt,
      negativePrompt: parsed.negativePrompt,
      nodeInputs: parsed.nodeInputs
    };
  } catch {
    return { positivePrompt: params.prompt };
  }
}
async function postRunMediaNode(project, node, signal) {
  const workflowId = node.workflowId || queryAiVideoDefaultWorkflow(node.kind);
  if (!workflowId) {
    throw new Error(`节点「${node.title}」未配置工作流`);
  }
  const refCheck = queryValidateNodeRefs(project, node);
  if (!refCheck.ok) throw new Error(refCheck.message);
  const refNodes = refCheck.refs.length > 0 ? refCheck.refs : queryUpstreamNodes(project, node.id).filter(
    (n) => n.type === "image" && n.result?.localPath
  );
  const uploadedNames = [];
  for (const ref of refNodes) {
    const path2 = ref.result?.localPath;
    if (!path2) continue;
    const up = await postComfyUploadImage(path2);
    uploadedNames.push(up.name);
  }
  if (node.kind === "video_gen") {
    const storyboard = queryUpstreamNodes(project, node.id).find(
      (n) => n.kind === "storyboard"
    );
    if (storyboard?.result?.localPath && !uploadedNames.length) {
      const up = await postComfyUploadImage(storyboard.result.localPath);
      uploadedNames.push(up.name);
    }
  }
  if (node.kind === "video_merge") {
    const videos = queryUpstreamNodes(project, node.id).filter(
      (n) => n.type === "video" && n.result?.localPath
    );
    if (!videos.length) {
      throw new Error("合成节点需要连接已生成的分镜视频");
    }
    for (const v of videos) {
      const up = await postComfyUploadImage(v.result.localPath);
      uploadedNames.push(up.name);
    }
  }
  const prompt = queryEffectivePrompt(node);
  const workflow = queryLoadComfyWorkflowPrompt(workflowId);
  const llmPatch = await queryLlmWorkflowPatch({
    workflowId,
    workflow,
    prompt: prompt || node.title,
    skillCtx: querySkillCtx(project, node),
    hasRefs: uploadedNames.length > 0
  });
  const patched = postPatchComfyWorkflow(workflow, {
    positivePrompt: llmPatch.positivePrompt,
    negativePrompt: llmPatch.negativePrompt,
    referenceImageNames: uploadedNames,
    nodeInputs: llmPatch.nodeInputs
  });
  if (signal.aborted) throw new Error("已取消");
  const destDir = queryAiVideoOutputsDir(project.id);
  const out = await postComfyRunAndDownload({
    workflow: patched,
    destDir,
    filePrefix: `${node.kind}_${node.id.slice(0, 8)}`,
    signal
  });
  let next = postPatchAiVideoNode(project.id, node.id, {
    status: "success",
    errorMessage: void 0,
    result: {
      localPath: out.localPath,
      mediaType: out.mediaType
    }
  });
  if (!next) throw new Error("项目不存在");
  if (out.mediaType === "image" && !next.thumbnailPath) {
    next = postAiVideoProject({ ...next, thumbnailPath: out.localPath });
  }
  return next;
}
async function postRunTextPassthrough(project, node) {
  const text = queryEffectivePrompt(node);
  const updated = postPatchAiVideoNode(project.id, node.id, {
    status: "success",
    result: { text, mediaType: "text" }
  });
  if (!updated) throw new Error("项目不存在");
  return updated;
}
async function postExecuteNode(projectId, nodeId, signal) {
  const project = queryAiVideoProject(projectId);
  if (!project) throw new Error("项目不存在");
  const node = project.canvas.nodes.find((n) => n.id === nodeId);
  if (!node) throw new Error("节点不存在");
  postPatchAiVideoNode(projectId, nodeId, {
    status: "running",
    errorMessage: void 0
  });
  postBroadcastNodeEvent({
    projectId,
    nodeId,
    status: "running",
    progress: 0
  });
  try {
    let next;
    if (node.kind === "screenwriter") {
      next = await postRunScreenwriter(project, node, signal);
    } else if (node.type === "text") {
      next = await postRunTextPassthrough(project, node);
    } else {
      next = await postRunMediaNode(project, node, signal);
    }
    const fresh = next.canvas.nodes.find((n) => n.id === nodeId);
    postBroadcastNodeEvent({
      projectId,
      nodeId,
      status: "success",
      progress: 100,
      result: fresh?.result,
      project: next
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    postPatchAiVideoNode(projectId, nodeId, {
      status: "error",
      errorMessage: message
    });
    postBroadcastNodeEvent({
      projectId,
      nodeId,
      status: "error",
      errorMessage: message
    });
    throw err;
  }
}
async function postAiVideoNodeRun(req) {
  const { projectId, nodeId } = req;
  const existing = abortControllers.get(projectId);
  if (existing) existing.abort();
  const controller = new AbortController();
  abortControllers.set(projectId, controller);
  try {
    await postExecuteNode(projectId, nodeId, controller.signal);
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, message };
  } finally {
    if (abortControllers.get(projectId) === controller) {
      abortControllers.delete(projectId);
    }
  }
}
async function postAiVideoCanvasRun(req) {
  const project = queryAiVideoProject(req.projectId);
  if (!project) return { ok: false, message: "项目不存在" };
  const existing = abortControllers.get(req.projectId);
  if (existing) existing.abort();
  const controller = new AbortController();
  abortControllers.set(req.projectId, controller);
  try {
    const order = queryTopologicalNodeIds(project);
    for (const nodeId of order) {
      if (controller.signal.aborted) throw new Error("已取消");
      await postExecuteNode(req.projectId, nodeId, controller.signal);
    }
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, message };
  } finally {
    if (abortControllers.get(req.projectId) === controller) {
      abortControllers.delete(req.projectId);
    }
  }
}
function postAiVideoAbortRun(projectId) {
  const c = abortControllers.get(projectId);
  if (c) {
    c.abort();
    abortControllers.delete(projectId);
  }
}
function registerIpcHandlers() {
  electron.ipcMain.handle(IpcChannels.querySettings, () => querySettings());
  electron.ipcMain.handle(
    IpcChannels.postSettings,
    (_e, partial) => postSettings(partial)
  );
  electron.ipcMain.handle(
    IpcChannels.queryProviderModels,
    async (_e, override) => {
      const saved = querySettings();
      const creds = queryResolveProviderModelsCredentials(saved, override);
      try {
        const models = await queryProviderModels(creds);
        return { models };
      } catch (err) {
        const fetchError = err instanceof Error ? err.message : `拉取模型列表失败：${String(err)}`;
        console.warn("[query:provider-models]", fetchError);
        return { models: [], fetchError };
      }
    }
  );
  electron.ipcMain.handle(IpcChannels.querySessions, () => querySessions());
  electron.ipcMain.handle(IpcChannels.querySession, (_e, id) => querySession(id));
  electron.ipcMain.handle(IpcChannels.postSession, (_e, session) => postSession(session));
  electron.ipcMain.handle(IpcChannels.postDeleteSession, (_e, id) => postDeleteSession(id));
  electron.ipcMain.handle(IpcChannels.queryPublishPlans, () => queryPublishPlans());
  electron.ipcMain.handle(IpcChannels.queryPublishPlan, (_e, id) => queryPublishPlan(id));
  electron.ipcMain.handle(
    IpcChannels.postPublishPlan,
    (_e, plan) => postPublishPlanAndSync(plan)
  );
  electron.ipcMain.handle(IpcChannels.postDeletePublishPlan, (_e, id) => {
    postDeletePublishPlanWorkflow(id);
    postDeletePublishPlan(id);
  });
  const syncBuiltinPublishPlans = () => {
    const plans = queryPublishPlans();
    for (const seed of createBuiltinPublishPlans()) {
      const saved = plans.find((plan) => plan.id === seed.id);
      if (saved) {
        try {
          syncPublishPlanWorkflow(saved);
        } catch {
        }
      }
    }
    return plans;
  };
  electron.ipcMain.handle(IpcChannels.postInitPublishPlans, () => {
    postInitPublishPlans();
    return syncBuiltinPublishPlans();
  });
  electron.ipcMain.handle(IpcChannels.postImportBuiltinPublishPlans, () => {
    postImportBuiltinPublishPlans();
    return syncBuiltinPublishPlans();
  });
  electron.ipcMain.handle(IpcChannels.queryScheduledTasks, () => queryScheduledTasks());
  electron.ipcMain.handle(IpcChannels.queryScheduledTask, (_e, id) => queryScheduledTask(id));
  electron.ipcMain.handle(
    IpcChannels.postScheduledTask,
    (_e, task) => postScheduledTaskAndNotify(task)
  );
  electron.ipcMain.handle(
    IpcChannels.postDeleteScheduledTask,
    (_e, id) => postDeleteScheduledTask(id)
  );
  electron.ipcMain.handle(
    IpcChannels.postRunScheduledTask,
    async (_e, id) => triggerScheduledTask(id, true)
  );
  electron.ipcMain.handle(IpcChannels.postInitScheduledTasks, () => postInitScheduledTasks());
  electron.ipcMain.handle(
    IpcChannels.postImportBuiltinScheduledTasks,
    () => postImportBuiltinScheduledTasks()
  );
  electron.ipcMain.handle(IpcChannels.postAgentChat, async (_e, req) => {
    void runLangGraphChat(req);
  });
  electron.ipcMain.handle(IpcChannels.postAgentAbort, (_e, sessionId) => {
    postGraphAbort(sessionId);
  });
  electron.ipcMain.handle(IpcChannels.postAgentResyncRenderer, () => {
    return postGraphResyncAfterRendererLoad();
  });
  electron.ipcMain.handle(IpcChannels.queryAgentActiveRuns, () => {
    return queryGraphActiveRuns();
  });
  electron.ipcMain.handle(
    IpcChannels.postAgentContinue,
    (_e, sessionId, payload) => {
      postGraphContinue(sessionId, payload);
    }
  );
  electron.ipcMain.handle(IpcChannels.queryBrowserStatus, () => getBrowserService().getStatus());
  electron.ipcMain.handle(IpcChannels.postBrowserStart, async () => {
    await getBrowserService().ensureStarted();
    return getBrowserService().getStatus();
  });
  electron.ipcMain.handle(IpcChannels.postBrowserClose, async () => {
    await getBrowserService().close();
    return getBrowserService().getStatus();
  });
  electron.ipcMain.handle(IpcChannels.postBrowserClearProfile, async () => {
    await getBrowserService().close();
    releaseBrowserProfileLock();
    const dir = getBrowserProfileDir();
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
  electron.ipcMain.handle(IpcChannels.queryPublishChannels, () => queryPublishChannels());
  electron.ipcMain.handle(
    IpcChannels.postPublishChannel,
    (_e, input) => postPublishChannel(input)
  );
  electron.ipcMain.handle(
    IpcChannels.postDeletePublishChannel,
    (_e, id) => postDeletePublishChannel(id)
  );
  electron.ipcMain.handle(IpcChannels.postInitPublishChannels, () => postInitPublishChannels());
  electron.ipcMain.handle(IpcChannels.postNotifyChannelTest, async (_e, channelId) => {
    const id = String(channelId);
    queryPublishChannels();
    const meta = queryPublishChannelMeta(id);
    const msgType = queryFeishuMsgType({
      msgType: meta.notifyConfig?.feishuMsgType,
      channelId: meta.id,
      // 测试发送：渠道未配类型时默认 post（富文本）
      channelDefault: "post"
    });
    if (msgType === "image") {
      return postNotifyMessage({
        channelId: id,
        content: "",
        msgType: "image",
        imageKey: meta.notifyConfig?.feishuImageKey
      });
    }
    if (msgType === "share_chat") {
      return postNotifyMessage({
        channelId: id,
        content: "",
        msgType: "share_chat",
        shareChatId: meta.notifyConfig?.feishuShareChatId
      });
    }
    if (msgType === "post") {
      return postNotifyMessage({
        channelId: id,
        title: "灵犀通知测试",
        content: "这是一条**富文本**测试消息。\n详见 [飞书自定义机器人文档](https://open.feishu.cn/document/client-docs/bot-v3/add-custom-bot)",
        msgType: "post"
      });
    }
    return postNotifyMessage({
      channelId: id,
      title: "灵犀通知测试",
      content: "这是一条来自设置 → 渠道的测试消息。",
      msgType: "text"
    });
  });
  electron.ipcMain.handle(IpcChannels.queryChannelLoginStatuses, () => queryAllChannelLoginStatuses());
  electron.ipcMain.handle(
    IpcChannels.postChannelOpenLogin,
    async (_e, channelId) => postOpenChannelLogin(channelId)
  );
  electron.ipcMain.handle(IpcChannels.queryProjectSkills, () => queryProjectSkills());
  electron.ipcMain.handle(
    IpcChannels.queryProjectSkillDetail,
    (_e, id) => queryProjectSkillDetail(id)
  );
  electron.ipcMain.handle(
    IpcChannels.postSkillStates,
    (_e, states) => postSkillStates(states)
  );
  electron.ipcMain.handle(
    IpcChannels.postProjectSkill,
    (_e, input) => postProjectSkill(input)
  );
  electron.ipcMain.handle(
    IpcChannels.postDeleteProjectSkill,
    (_e, id) => postDeleteProjectSkill(id)
  );
  electron.ipcMain.handle(IpcChannels.querySkillTemplates, () => querySkillTemplates());
  electron.ipcMain.handle(
    IpcChannels.postInstallSkillTemplate,
    (_e, templateId, targetId) => postInstallSkillTemplate(templateId, targetId)
  );
  electron.ipcMain.handle(IpcChannels.queryRemotionVideoTemplates, () => queryRemotionVideoTemplates());
  electron.ipcMain.handle(IpcChannels.postApplyRemotionTemplateSkill, async (_e, input) => {
    const { postApplyRemotionTemplateSkill } = await Promise.resolve().then(() => require("./chunks/remotion-apply-template-skill-urwZ5NRS.js"));
    return postApplyRemotionTemplateSkill(input);
  });
  electron.ipcMain.handle(IpcChannels.postRenderRemotionStudioExport, async (_e, input) => {
    const { postRenderRemotionStudioExport: postRenderRemotionStudioExport2 } = await Promise.resolve().then(() => remotionService);
    return postRenderRemotionStudioExport2(input);
  });
  electron.ipcMain.handle(
    IpcChannels.querySkillImportPreview,
    (_e, url2) => querySkillImportPreview(url2)
  );
  electron.ipcMain.handle(
    IpcChannels.postImportSkillFromUrl,
    (_e, url2, targetId) => postImportSkillFromUrl(url2, targetId)
  );
  electron.ipcMain.handle(
    IpcChannels.postSummarizeSkillFromSession,
    (_e, sessionId) => postSummarizeSkillFromSession(sessionId)
  );
  electron.ipcMain.handle(
    IpcChannels.queryLocalImageDataUrl,
    (_e, filePath) => queryLocalImageDataUrl(filePath)
  );
  electron.ipcMain.handle(
    IpcChannels.queryLocalMediaUrl,
    (_e, filePath) => queryLocalMediaUrl(filePath)
  );
  electron.ipcMain.handle(IpcChannels.postSaveChatUpload, (_e, input) => postSaveChatUpload(input));
  electron.ipcMain.handle(IpcChannels.queryLocalPathExists, (_e, filePath) => {
    const raw = String(filePath ?? "").trim();
    if (!raw) return false;
    return fs.existsSync(path.normalize(path.resolve(raw)));
  });
  electron.ipcMain.handle(IpcChannels.queryAshareKlineRefresh, async (_e, req) => {
    const symbol = String(req?.symbol ?? "").trim();
    if (!symbol) return null;
    const range = req?.range ?? "today";
    const startDate = req?.startDate != null ? String(req.startDate) : void 0;
    const endDate = req?.endDate != null ? String(req.endDate) : void 0;
    const { charts } = await queryAshareRealtimeAnalysisCharts([symbol], range, {
      startDate,
      endDate,
      // 与工具默认一致：预加载今天/本周/本月，刷新后切周期仍有数据
      preloadRanges: true
    });
    return charts[0] ?? null;
  });
  electron.ipcMain.handle(IpcChannels.queryAgentToolsCatalog, async () => {
    const { queryAgentToolsCatalog } = await Promise.resolve().then(() => require("./chunks/catalog-jQ-3zCdg.js"));
    return queryAgentToolsCatalog();
  });
  electron.ipcMain.handle(IpcChannels.queryAgentAssets, (_e, options) => queryAgentAssets(options));
  electron.ipcMain.handle(
    IpcChannels.postDeleteAgentAsset,
    (_e, filePath) => postDeleteAgentAsset(filePath)
  );
  electron.ipcMain.handle(
    IpcChannels.postDeleteAgentAssets,
    (_e, filePaths) => postDeleteAgentAssets(filePaths)
  );
  electron.ipcMain.handle(IpcChannels.postClearAgentAssets, () => postClearAgentAssets());
  electron.ipcMain.handle(
    IpcChannels.queryAgentAssetTextPreview,
    (_e, filePath) => queryAgentAssetTextPreview(filePath)
  );
  electron.ipcMain.handle(IpcChannels.queryRemotionExports, () => queryRemotionExports());
  electron.ipcMain.handle(
    IpcChannels.postEnqueueRemotionExport,
    (_e, input) => postEnqueueRemotionExport(input)
  );
  electron.ipcMain.handle(
    IpcChannels.postUpdateRemotionExport,
    (_e, input) => postUpdateRemotionExport(input)
  );
  electron.ipcMain.handle(IpcChannels.queryAgentRules, () => queryAgentRules());
  electron.ipcMain.handle(
    IpcChannels.postAgentRule,
    (_e, input) => postAgentRuleAndNotify(input)
  );
  electron.ipcMain.handle(IpcChannels.postDeleteAgentRule, (_e, id) => postDeleteAgentRule(id));
  electron.ipcMain.handle(IpcChannels.queryWorkflows, () => queryWorkflows());
  electron.ipcMain.handle(IpcChannels.queryWorkflow, (_e, id) => queryWorkflow(id));
  electron.ipcMain.handle(
    IpcChannels.postWorkflow,
    (_e, workflow) => postWorkflow(workflow)
  );
  electron.ipcMain.handle(IpcChannels.postDeleteWorkflow, (_e, id) => postDeleteWorkflow(id));
  electron.ipcMain.handle(
    IpcChannels.postRunWorkflow,
    async (_e, workflowId, options) => postRunWorkflow(workflowId, options)
  );
  electron.ipcMain.handle(
    IpcChannels.postResumeWorkflow,
    async (_e, runId) => postResumeWorkflow(runId)
  );
  electron.ipcMain.handle(IpcChannels.queryWorkflowRuns, () => queryWorkflowRuns());
  electron.ipcMain.handle(
    IpcChannels.queryLatestWorkflowRunBySession,
    (_e, sessionId) => queryLatestWorkflowRunBySession(sessionId)
  );
  electron.ipcMain.handle(IpcChannels.queryComfyUiStatus, () => queryComfyUiStatus());
  electron.ipcMain.handle(IpcChannels.queryComfyWorkflows, () => queryComfyWorkflows());
  electron.ipcMain.handle(IpcChannels.queryAiVideoProjects, () => queryAiVideoProjects());
  electron.ipcMain.handle(IpcChannels.queryAiVideoProject, (_e, id) => queryAiVideoProject(id));
  electron.ipcMain.handle(
    IpcChannels.postAiVideoProject,
    (_e, project) => postAiVideoProject(project)
  );
  electron.ipcMain.handle(
    IpcChannels.postDeleteAiVideoProject,
    (_e, id) => postDeleteAiVideoProject(id)
  );
  electron.ipcMain.handle(
    IpcChannels.postAiVideoNodeRun,
    async (_e, req) => postAiVideoNodeRun(req)
  );
  electron.ipcMain.handle(
    IpcChannels.postAiVideoCanvasRun,
    async (_e, req) => postAiVideoCanvasRun(req)
  );
  electron.ipcMain.handle(IpcChannels.postAiVideoAbortRun, (_e, projectId) => {
    postAiVideoAbortRun(projectId);
  });
}
let ensurePromise = null;
function postEnsureRemotionBrowser() {
  if (!ensurePromise) {
    ensurePromise = (async () => {
      try {
        const { ensureBrowser } = await import("@remotion/renderer");
        await ensureBrowser({
          logLevel: "info",
          onBrowserDownload: () => ({
            version: null,
            onProgress: ({ percent, downloadedBytes, totalSizeInBytes }) => {
              const pct = Math.round(percent * 100);
              const mb = (downloadedBytes / 1024 / 1024).toFixed(1);
              const totalMb = (totalSizeInBytes / 1024 / 1024).toFixed(1);
              console.log(`[remotion] 下载浏览器 ${pct}% (${mb}/${totalMb} MiB)`);
            }
          })
        });
        console.log("[remotion] Chrome Headless Shell 已就绪");
      } catch (err) {
        ensurePromise = null;
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`[remotion] 浏览器预检失败（首次渲染时会重试）: ${msg}`);
        throw err;
      }
    })();
  }
  return ensurePromise;
}
let tray = null;
function resolveTrayIconPath() {
  const candidates = [
    path.join(__dirname, "../../resources/lingxi-avatar.png"),
    path.join(process.resourcesPath, "resources/lingxi-avatar.png")
  ];
  return candidates.find((p) => fs.existsSync(p)) ?? candidates[0];
}
function queryTrayIcon() {
  const iconPath = resolveTrayIconPath();
  if (!fs.existsSync(iconPath)) {
    return electron.nativeImage.createEmpty();
  }
  const source = electron.nativeImage.createFromPath(iconPath);
  if (source.isEmpty()) return source;
  const size = process.platform === "darwin" ? 22 : 16;
  return source.resize({ width: size, height: size, quality: "best" });
}
function postShowMainWindow(createWindow2) {
  let win = getMainWindow();
  if (!win || win.isDestroyed()) {
    createWindow2?.();
    win = getMainWindow();
  }
  if (!win || win.isDestroyed()) return;
  if (win.isMinimized()) win.restore();
  win.show();
  win.focus();
  if (process.platform === "darwin") {
    electron.app.dock?.show();
  }
}
function postHideWindowSafely(win) {
  if (win.isDestroyed()) return;
  if (win.isFullScreen()) {
    win.once("leave-full-screen", () => {
      if (!win.isDestroyed()) win.hide();
    });
    win.setFullScreen(false);
    return;
  }
  win.hide();
}
function queryCloseToTrayEnabled() {
  return querySettings().closeToTray;
}
function postCreateTray(createWindow2) {
  if (tray && !tray.isDestroyed()) {
    postRefreshTrayMenu(createWindow2);
    return;
  }
  const icon = queryTrayIcon();
  tray = new electron.Tray(icon.isEmpty() ? electron.nativeImage.createEmpty() : icon);
  tray.setToolTip("灵犀 · AI助手");
  postRefreshTrayMenu(createWindow2);
  tray.on("click", () => {
    postShowMainWindow(createWindow2);
  });
  tray.on("double-click", () => {
    postShowMainWindow(createWindow2);
  });
}
function postRefreshTrayMenu(createWindow2) {
  if (!tray || tray.isDestroyed()) return;
  const contextMenu = electron.Menu.buildFromTemplate([
    {
      label: "打开灵犀",
      click: () => postShowMainWindow(createWindow2)
    },
    { type: "separator" },
    {
      label: "退出",
      click: () => {
        electron.app.quit();
      }
    }
  ]);
  tray.setContextMenu(contextMenu);
}
function postDestroyTray() {
  if (tray && !tray.isDestroyed()) {
    tray.destroy();
  }
  tray = null;
}
function postHandleWindowClose(event, win, isQuitting2) {
  if (isQuitting2()) return false;
  if (!queryCloseToTrayEnabled()) return false;
  if (!tray || tray.isDestroyed()) return false;
  event.preventDefault();
  postHideWindowSafely(win);
  return true;
}
function registerMediaScheme() {
  electron.protocol.registerSchemesAsPrivileged([
    {
      scheme: "media",
      privileges: {
        standard: true,
        secure: true,
        supportFetchAPI: true,
        stream: true,
        corsEnabled: true,
        bypassCSP: true
      }
    }
  ]);
}
function postRegisterMediaProtocolHandler() {
  electron.protocol.handle("media", (request) => {
    const abs = queryPathFromMediaUrl(request.url);
    if (!abs) {
      return new Response("Not Found", { status: 404 });
    }
    try {
      const headers = new Headers();
      const range = request.headers.get("Range");
      if (range) headers.set("Range", range);
      return electron.net.fetch(url.pathToFileURL(abs).href, { headers });
    } catch {
      return new Response("Not Found", { status: 404 });
    }
  });
}
registerMediaScheme();
let mainWindow = null;
let isQuitting = false;
function resolveAppIconPath() {
  const candidates = [
    path.join(__dirname, "../../resources/lingxi-avatar.png"),
    path.join(process.resourcesPath, "resources/lingxi-avatar.png")
  ];
  return candidates.find((p) => fs.existsSync(p)) ?? candidates[0];
}
function applyAppIcon() {
  const iconPath = resolveAppIconPath();
  if (!fs.existsSync(iconPath)) return;
  const icon = electron.nativeImage.createFromPath(iconPath);
  if (icon.isEmpty()) return;
  if (process.platform === "darwin") {
    electron.app.dock?.setIcon(icon);
  }
}
function createWindow() {
  const iconPath = resolveAppIconPath();
  const icon = fs.existsSync(iconPath) ? electron.nativeImage.createFromPath(iconPath) : void 0;
  const windowIcon = icon && !icon.isEmpty() ? icon : void 0;
  mainWindow = new electron.BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    title: "灵犀 · AI助手",
    ...windowIcon ? { icon: windowIcon } : {},
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    trafficLightPosition: { x: 16, y: 16 },
    backgroundColor: "#f5f5f7",
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });
  setMainWindow(mainWindow);
  mainWindow.on("close", (event) => {
    if (!mainWindow) return;
    postHandleWindowClose(event, mainWindow, () => isQuitting);
  });
  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
    if (process.env.OPEN_DEVTOOLS === "1") {
      mainWindow.webContents.once("did-finish-load", () => {
        mainWindow?.webContents.openDevTools({ mode: "detach" });
      });
    }
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
  mainWindow.on("closed", () => {
    mainWindow = null;
    setMainWindow(null);
  });
}
electron.app.whenReady().then(() => {
  applyAppIcon();
  getDataRoot();
  postRegisterMediaProtocolHandler();
  registerIpcHandlers();
  createWindow();
  postCreateTray(createWindow);
  void Promise.resolve().then(async () => {
    const { postWarmAgentTools: postWarmAgentTools2 } = await Promise.resolve().then(() => index);
    postWarmAgentTools2();
    initializeResources();
    postEnsureRemotionSkillsEnabled();
    void postEnsureRemotionBrowser().catch(() => {
    });
    initPublishChannelRegistry();
    initPublishAdapters();
    initMediaProviders();
    startScheduleService();
    postLaunchAtLogin(querySettings().launchAtLogin);
  });
  electron.app.on("activate", () => {
    postShowMainWindow(createWindow);
  });
});
electron.app.on("window-all-closed", () => {
  if (process.platform === "darwin") return;
  if (querySettings().closeToTray) return;
  electron.app.quit();
});
electron.app.on("before-quit", () => {
  isQuitting = true;
  postDestroyTray();
  postStopRemotionStudios();
  void getBrowserService().close();
  releaseBrowserProfileLock();
});
electron.ipcMain.handle("shell:open-external", async (_e, url2) => {
  await electron.shell.openExternal(url2);
});
electron.ipcMain.handle("post:reveal-path", async (_e, filePath) => {
  const { existsSync: existsSync2, statSync } = await import("fs");
  const { normalize, resolve } = await import("path");
  const raw = String(filePath ?? "").trim();
  if (!raw) return { ok: false, error: "路径为空" };
  const target = normalize(resolve(raw));
  if (!existsSync2(target)) return { ok: false, error: "文件不存在" };
  if (statSync(target).isDirectory()) {
    const openError = await electron.shell.openPath(target);
    if (openError) return { ok: false, error: openError };
  } else {
    electron.shell.showItemInFolder(target);
  }
  return { ok: true };
});
electron.ipcMain.handle("post:open-local-file", async (_e, filePath) => {
  const { existsSync: existsSync2 } = await import("fs");
  const { normalize, resolve } = await import("path");
  const { pathToFileURL } = await import("url");
  const raw = String(filePath ?? "").trim();
  if (!raw) return { ok: false, error: "路径为空" };
  const target = normalize(resolve(raw));
  if (!existsSync2(target)) return { ok: false, error: "文件不存在" };
  await electron.shell.openExternal(pathToFileURL(target).href);
  return { ok: true };
});
electron.ipcMain.handle("dialog:select-images", async () => {
  const result = await electron.dialog.showOpenDialog({
    properties: ["openFile", "multiSelections"],
    filters: [
      {
        name: "媒体文件",
        extensions: [
          "png",
          "jpg",
          "jpeg",
          "webp",
          "gif",
          "bmp",
          "mp4",
          "mov",
          "webm",
          "mkv",
          "wav",
          "mp3",
          "m4a",
          "aac",
          "ogg"
        ]
      },
      { name: "图片", extensions: ["png", "jpg", "jpeg", "webp", "gif", "bmp"] },
      { name: "视频", extensions: ["mp4", "mov", "webm", "mkv"] },
      { name: "音频", extensions: ["wav", "mp3", "m4a", "aac", "ogg"] }
    ]
  });
  return result.canceled ? [] : result.filePaths;
});
electron.ipcMain.handle("dialog:select-directory", async () => {
  const result = await electron.dialog.showOpenDialog({
    properties: ["openDirectory", "createDirectory"]
  });
  if (result.canceled || !result.filePaths.length) return null;
  return result.filePaths[0];
});
exports.WorkflowGraphAnnotation = WorkflowGraphAnnotation;
exports.__graphApi_executeTopLevelNode = __graphApi_executeTopLevelNode;
exports.__graphApi_finalizeWorkflowRun = __graphApi_finalizeWorkflowRun;
exports.__graphApi_prepareWorkflowRun = __graphApi_prepareWorkflowRun;
exports.getAllTools = getAllTools;
exports.postInitRemotionProject = postInitRemotionProject;
exports.postStartRemotionStudio = postStartRemotionStudio;
exports.queryBundledResourcesRoot = queryBundledResourcesRoot;
exports.queryGraphResumePayload = queryGraphResumePayload;
exports.queryRemotionProjectDir = queryRemotionProjectDir;
exports.queryRoleToolInjections = queryRoleToolInjections;
exports.querySettings = querySettings;
exports.querySkillsDir = querySkillsDir;
exports.waitForGraphUserContinue = waitForGraphUserContinue;
exports.workflowRuns = workflowRuns;
