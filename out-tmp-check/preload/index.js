"use strict";
const electron = require("electron");
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
  // 事件推送（main → renderer）
  onAgentEvent: "event:agent",
  onBrowserFrame: "event:browser-frame",
  onScheduleUpdate: "event:schedule-update",
  onPublishPlansUpdate: "event:publish-plans-update",
  onAgentRulesUpdate: "event:agent-rules-update",
  /** 在系统文件管理器中显示本地路径 */
  postRevealPath: "post:reveal-path",
  /** 在系统默认浏览器中打开本地文件（HTML 等） */
  postOpenLocalFile: "post:open-local-file"
};
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
  const provider = "dashscope";
  const baseUrl = seed?.baseUrl?.trim() || (provider === "deepseek" ? "https://api.deepseek.com" : provider === "ofox" ? OFOX_COMPAT_BASE : provider === "openai_compatible" ? "https://api.openai.com/v1" : DASHSCOPE_COMPAT_BASE);
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
queryBuildDefaultConnections()[0];
new Set(Object.values(DEFAULT_CONNECTION_IDS));
({
  connections: queryBuildDefaultConnections()
});
const api = {
  querySettings: () => electron.ipcRenderer.invoke(IpcChannels.querySettings),
  postSettings: (settings) => electron.ipcRenderer.invoke(IpcChannels.postSettings, settings),
  queryProviderModels: (override) => electron.ipcRenderer.invoke(IpcChannels.queryProviderModels, override),
  querySessions: () => electron.ipcRenderer.invoke(IpcChannels.querySessions),
  querySession: (id) => electron.ipcRenderer.invoke(IpcChannels.querySession, id),
  postSession: (session) => electron.ipcRenderer.invoke(IpcChannels.postSession, session),
  postDeleteSession: (id) => electron.ipcRenderer.invoke(IpcChannels.postDeleteSession, id),
  queryPublishPlans: () => electron.ipcRenderer.invoke(IpcChannels.queryPublishPlans),
  queryPublishPlan: (id) => electron.ipcRenderer.invoke(IpcChannels.queryPublishPlan, id),
  postPublishPlan: (plan) => electron.ipcRenderer.invoke(IpcChannels.postPublishPlan, plan),
  postDeletePublishPlan: (id) => electron.ipcRenderer.invoke(IpcChannels.postDeletePublishPlan, id),
  postInitPublishPlans: () => electron.ipcRenderer.invoke(IpcChannels.postInitPublishPlans),
  postImportBuiltinPublishPlans: () => electron.ipcRenderer.invoke(IpcChannels.postImportBuiltinPublishPlans),
  queryScheduledTasks: () => electron.ipcRenderer.invoke(IpcChannels.queryScheduledTasks),
  queryScheduledTask: (id) => electron.ipcRenderer.invoke(IpcChannels.queryScheduledTask, id),
  postScheduledTask: (task) => electron.ipcRenderer.invoke(IpcChannels.postScheduledTask, task),
  postDeleteScheduledTask: (id) => electron.ipcRenderer.invoke(IpcChannels.postDeleteScheduledTask, id),
  postRunScheduledTask: (id) => electron.ipcRenderer.invoke(IpcChannels.postRunScheduledTask, id),
  postInitScheduledTasks: () => electron.ipcRenderer.invoke(IpcChannels.postInitScheduledTasks),
  postImportBuiltinScheduledTasks: () => electron.ipcRenderer.invoke(IpcChannels.postImportBuiltinScheduledTasks),
  postAgentChat: (req) => electron.ipcRenderer.invoke(IpcChannels.postAgentChat, req),
  postAgentAbort: (sessionId) => electron.ipcRenderer.invoke(IpcChannels.postAgentAbort, sessionId),
  postAgentResyncRenderer: () => electron.ipcRenderer.invoke(IpcChannels.postAgentResyncRenderer),
  queryAgentActiveRuns: () => electron.ipcRenderer.invoke(IpcChannels.queryAgentActiveRuns),
  postAgentContinue: (sessionId, payload) => electron.ipcRenderer.invoke(IpcChannels.postAgentContinue, sessionId, payload),
  queryBrowserStatus: () => electron.ipcRenderer.invoke(IpcChannels.queryBrowserStatus),
  postBrowserStart: () => electron.ipcRenderer.invoke(IpcChannels.postBrowserStart),
  postBrowserClose: () => electron.ipcRenderer.invoke(IpcChannels.postBrowserClose),
  postBrowserClearProfile: () => electron.ipcRenderer.invoke(IpcChannels.postBrowserClearProfile),
  queryPublishChannels: () => electron.ipcRenderer.invoke(IpcChannels.queryPublishChannels),
  postPublishChannel: (input) => electron.ipcRenderer.invoke(IpcChannels.postPublishChannel, input),
  postDeletePublishChannel: (id) => electron.ipcRenderer.invoke(IpcChannels.postDeletePublishChannel, id),
  postInitPublishChannels: () => electron.ipcRenderer.invoke(IpcChannels.postInitPublishChannels),
  postNotifyChannelTest: (channelId) => electron.ipcRenderer.invoke(IpcChannels.postNotifyChannelTest, channelId),
  queryChannelLoginStatuses: () => electron.ipcRenderer.invoke(IpcChannels.queryChannelLoginStatuses),
  postChannelOpenLogin: (channelId) => electron.ipcRenderer.invoke(IpcChannels.postChannelOpenLogin, channelId),
  queryProjectSkills: () => electron.ipcRenderer.invoke(IpcChannels.queryProjectSkills),
  queryProjectSkillDetail: (id) => electron.ipcRenderer.invoke(IpcChannels.queryProjectSkillDetail, id),
  postSkillStates: (states) => electron.ipcRenderer.invoke(IpcChannels.postSkillStates, states),
  postProjectSkill: (input) => electron.ipcRenderer.invoke(IpcChannels.postProjectSkill, input),
  postDeleteProjectSkill: (id) => electron.ipcRenderer.invoke(IpcChannels.postDeleteProjectSkill, id),
  querySkillTemplates: () => electron.ipcRenderer.invoke(IpcChannels.querySkillTemplates),
  postInstallSkillTemplate: (templateId, targetId) => electron.ipcRenderer.invoke(IpcChannels.postInstallSkillTemplate, templateId, targetId),
  querySkillImportPreview: (url) => electron.ipcRenderer.invoke(IpcChannels.querySkillImportPreview, url),
  postImportSkillFromUrl: (url, targetId) => electron.ipcRenderer.invoke(IpcChannels.postImportSkillFromUrl, url, targetId),
  postSummarizeSkillFromSession: (sessionId) => electron.ipcRenderer.invoke(IpcChannels.postSummarizeSkillFromSession, sessionId),
  queryLocalImageDataUrl: (filePath) => electron.ipcRenderer.invoke(IpcChannels.queryLocalImageDataUrl, filePath),
  queryLocalMediaUrl: (filePath) => electron.ipcRenderer.invoke(IpcChannels.queryLocalMediaUrl, filePath),
  postSaveChatUpload: (input) => electron.ipcRenderer.invoke(IpcChannels.postSaveChatUpload, input),
  queryLocalPathExists: (filePath) => electron.ipcRenderer.invoke(IpcChannels.queryLocalPathExists, filePath),
  queryAshareKlineRefresh: (req) => electron.ipcRenderer.invoke(IpcChannels.queryAshareKlineRefresh, req),
  queryAgentToolsCatalog: () => electron.ipcRenderer.invoke(IpcChannels.queryAgentToolsCatalog),
  queryAgentAssets: (options) => electron.ipcRenderer.invoke(IpcChannels.queryAgentAssets, options),
  postDeleteAgentAsset: (filePath) => electron.ipcRenderer.invoke(IpcChannels.postDeleteAgentAsset, filePath),
  postDeleteAgentAssets: (filePaths) => electron.ipcRenderer.invoke(IpcChannels.postDeleteAgentAssets, filePaths),
  postClearAgentAssets: () => electron.ipcRenderer.invoke(IpcChannels.postClearAgentAssets),
  queryAgentAssetTextPreview: (filePath) => electron.ipcRenderer.invoke(IpcChannels.queryAgentAssetTextPreview, filePath),
  queryRemotionExports: () => electron.ipcRenderer.invoke(IpcChannels.queryRemotionExports),
  postEnqueueRemotionExport: (input) => electron.ipcRenderer.invoke(IpcChannels.postEnqueueRemotionExport, input),
  postUpdateRemotionExport: (input) => electron.ipcRenderer.invoke(IpcChannels.postUpdateRemotionExport, input),
  queryRemotionVideoTemplates: () => electron.ipcRenderer.invoke(IpcChannels.queryRemotionVideoTemplates),
  postApplyRemotionTemplateSkill: (input) => electron.ipcRenderer.invoke(IpcChannels.postApplyRemotionTemplateSkill, input),
  postRenderRemotionStudioExport: (input) => electron.ipcRenderer.invoke(IpcChannels.postRenderRemotionStudioExport, input),
  queryAgentRules: () => electron.ipcRenderer.invoke(IpcChannels.queryAgentRules),
  postAgentRule: (input) => electron.ipcRenderer.invoke(IpcChannels.postAgentRule, input),
  postDeleteAgentRule: (id) => electron.ipcRenderer.invoke(IpcChannels.postDeleteAgentRule, id),
  queryWorkflows: () => electron.ipcRenderer.invoke(IpcChannels.queryWorkflows),
  queryWorkflow: (id) => electron.ipcRenderer.invoke(IpcChannels.queryWorkflow, id),
  postWorkflow: (workflow) => electron.ipcRenderer.invoke(IpcChannels.postWorkflow, workflow),
  postDeleteWorkflow: (id) => electron.ipcRenderer.invoke(IpcChannels.postDeleteWorkflow, id),
  postRunWorkflow: (workflowId, options) => electron.ipcRenderer.invoke(IpcChannels.postRunWorkflow, workflowId, options),
  postResumeWorkflow: (runId) => electron.ipcRenderer.invoke(IpcChannels.postResumeWorkflow, runId),
  queryWorkflowRuns: () => electron.ipcRenderer.invoke(IpcChannels.queryWorkflowRuns),
  queryLatestWorkflowRunBySession: (sessionId) => electron.ipcRenderer.invoke(IpcChannels.queryLatestWorkflowRunBySession, sessionId),
  queryComfyUiStatus: () => electron.ipcRenderer.invoke(IpcChannels.queryComfyUiStatus),
  queryComfyWorkflows: () => electron.ipcRenderer.invoke(IpcChannels.queryComfyWorkflows),
  queryAiVideoProjects: () => electron.ipcRenderer.invoke(IpcChannels.queryAiVideoProjects),
  queryAiVideoProject: (id) => electron.ipcRenderer.invoke(IpcChannels.queryAiVideoProject, id),
  postAiVideoProject: (project) => electron.ipcRenderer.invoke(IpcChannels.postAiVideoProject, project),
  postDeleteAiVideoProject: (id) => electron.ipcRenderer.invoke(IpcChannels.postDeleteAiVideoProject, id),
  postAiVideoNodeRun: (req) => electron.ipcRenderer.invoke(IpcChannels.postAiVideoNodeRun, req),
  postAiVideoCanvasRun: (req) => electron.ipcRenderer.invoke(IpcChannels.postAiVideoCanvasRun, req),
  postAiVideoAbortRun: (projectId) => electron.ipcRenderer.invoke(IpcChannels.postAiVideoAbortRun, projectId),
  onAiVideoNodeEvent: (cb) => {
    const listener = (_event, data) => {
      cb(data);
    };
    electron.ipcRenderer.on(IpcChannels.onAiVideoNodeEvent, listener);
    return () => electron.ipcRenderer.removeListener(IpcChannels.onAiVideoNodeEvent, listener);
  },
  onAgentEvent: (cb) => {
    const listener = (_event, data) => {
      cb(data);
    };
    electron.ipcRenderer.on(IpcChannels.onAgentEvent, listener);
    return () => electron.ipcRenderer.removeListener(IpcChannels.onAgentEvent, listener);
  },
  onBrowserFrame: (cb) => {
    const listener = (_event, data) => {
      cb(data);
    };
    electron.ipcRenderer.on(IpcChannels.onBrowserFrame, listener);
    return () => electron.ipcRenderer.removeListener(IpcChannels.onBrowserFrame, listener);
  },
  onScheduleUpdate: (cb) => {
    const listener = (_event, data) => {
      cb(data);
    };
    electron.ipcRenderer.on(IpcChannels.onScheduleUpdate, listener);
    return () => electron.ipcRenderer.removeListener(IpcChannels.onScheduleUpdate, listener);
  },
  onPublishPlansUpdate: (cb) => {
    const listener = (_event, data) => {
      cb(data);
    };
    electron.ipcRenderer.on(IpcChannels.onPublishPlansUpdate, listener);
    return () => electron.ipcRenderer.removeListener(IpcChannels.onPublishPlansUpdate, listener);
  },
  onAgentRulesUpdate: (cb) => {
    const listener = (_event, data) => {
      cb(data);
    };
    electron.ipcRenderer.on(IpcChannels.onAgentRulesUpdate, listener);
    return () => electron.ipcRenderer.removeListener(IpcChannels.onAgentRulesUpdate, listener);
  },
  postSelectImages: () => electron.ipcRenderer.invoke("dialog:select-images"),
  postSelectDirectory: () => electron.ipcRenderer.invoke("dialog:select-directory"),
  postOpenExternal: (url) => electron.ipcRenderer.invoke("shell:open-external", url),
  postRevealPath: (filePath) => electron.ipcRenderer.invoke(IpcChannels.postRevealPath, filePath),
  postOpenLocalFile: (filePath) => electron.ipcRenderer.invoke(IpcChannels.postOpenLocalFile, filePath)
};
electron.contextBridge.exposeInMainWorld("api", api);
