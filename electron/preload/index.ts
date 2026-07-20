import { contextBridge, ipcRenderer } from 'electron'
import { IpcChannels } from '../../shared/types'
import type {
  AgentChatRequest,
  AgentEvent,
  AgentRuleUpsertInput,
  AppSettings,
  ModelOption,
  BrowserFramePayload,
  ChannelLoginStatus,
  ElectronApi,
  ProjectSkill,
  ProjectSkillDetail,
  PublishPlan,
  ScheduledTask,
  Session,
  SkillStates,
  SkillTemplate,
  SkillUpsertInput,
  SkillImportPreview,
  PublishChannelMeta,
  PublishChannelUpsertInput,
  WorkflowDefinition
} from '../../shared/types'
const api: ElectronApi = {
  querySettings: () => ipcRenderer.invoke(IpcChannels.querySettings),
  postSettings: (settings: Partial<AppSettings>) =>
    ipcRenderer.invoke(IpcChannels.postSettings, settings),
  queryProviderModels: (override) =>
    ipcRenderer.invoke(IpcChannels.queryProviderModels, override),

  querySessions: () => ipcRenderer.invoke(IpcChannels.querySessions),
  querySession: (id: string) => ipcRenderer.invoke(IpcChannels.querySession, id),
  postSession: (session: Session) => ipcRenderer.invoke(IpcChannels.postSession, session),
  postDeleteSession: (id: string) => ipcRenderer.invoke(IpcChannels.postDeleteSession, id),

  queryPublishPlans: () => ipcRenderer.invoke(IpcChannels.queryPublishPlans),
  queryPublishPlan: (id: string) => ipcRenderer.invoke(IpcChannels.queryPublishPlan, id),
  postPublishPlan: (plan: PublishPlan) => ipcRenderer.invoke(IpcChannels.postPublishPlan, plan),
  postDeletePublishPlan: (id: string) =>
    ipcRenderer.invoke(IpcChannels.postDeletePublishPlan, id),
  postInitPublishPlans: () => ipcRenderer.invoke(IpcChannels.postInitPublishPlans),
  postImportBuiltinPublishPlans: () =>
    ipcRenderer.invoke(IpcChannels.postImportBuiltinPublishPlans),

  queryScheduledTasks: () => ipcRenderer.invoke(IpcChannels.queryScheduledTasks),
  queryScheduledTask: (id: string) => ipcRenderer.invoke(IpcChannels.queryScheduledTask, id),
  postScheduledTask: (task: ScheduledTask) =>
    ipcRenderer.invoke(IpcChannels.postScheduledTask, task),
  postDeleteScheduledTask: (id: string) =>
    ipcRenderer.invoke(IpcChannels.postDeleteScheduledTask, id),
  postRunScheduledTask: (id: string) =>
    ipcRenderer.invoke(IpcChannels.postRunScheduledTask, id),
  postInitScheduledTasks: () => ipcRenderer.invoke(IpcChannels.postInitScheduledTasks),
  postImportBuiltinScheduledTasks: () =>
    ipcRenderer.invoke(IpcChannels.postImportBuiltinScheduledTasks),

  postAgentChat: (req: AgentChatRequest) => ipcRenderer.invoke(IpcChannels.postAgentChat, req),
  postAgentAbort: (sessionId: string) =>
    ipcRenderer.invoke(IpcChannels.postAgentAbort, sessionId),
  postAgentContinue: (sessionId: string, userInput?: string) =>
    ipcRenderer.invoke(IpcChannels.postAgentContinue, sessionId, userInput),

  queryBrowserStatus: () => ipcRenderer.invoke(IpcChannels.queryBrowserStatus),
  postBrowserStart: () => ipcRenderer.invoke(IpcChannels.postBrowserStart),
  postBrowserClose: () => ipcRenderer.invoke(IpcChannels.postBrowserClose),
  postBrowserClearProfile: () => ipcRenderer.invoke(IpcChannels.postBrowserClearProfile),
  queryPublishChannels: () => ipcRenderer.invoke(IpcChannels.queryPublishChannels),
  postPublishChannel: (input) => ipcRenderer.invoke(IpcChannels.postPublishChannel, input),
  postDeletePublishChannel: (id: string) =>
    ipcRenderer.invoke(IpcChannels.postDeletePublishChannel, id),
  postInitPublishChannels: () => ipcRenderer.invoke(IpcChannels.postInitPublishChannels),
  postNotifyChannelTest: (channelId: string) =>
    ipcRenderer.invoke(IpcChannels.postNotifyChannelTest, channelId),

  queryChannelLoginStatuses: () => ipcRenderer.invoke(IpcChannels.queryChannelLoginStatuses),
  postChannelOpenLogin: (channelId: string) =>
    ipcRenderer.invoke(IpcChannels.postChannelOpenLogin, channelId),

  queryProjectSkills: () => ipcRenderer.invoke(IpcChannels.queryProjectSkills),
  queryProjectSkillDetail: (id: string) =>
    ipcRenderer.invoke(IpcChannels.queryProjectSkillDetail, id),
  postSkillStates: (states: SkillStates) =>
    ipcRenderer.invoke(IpcChannels.postSkillStates, states),
  postProjectSkill: (input: SkillUpsertInput) =>
    ipcRenderer.invoke(IpcChannels.postProjectSkill, input),
  postDeleteProjectSkill: (id: string) =>
    ipcRenderer.invoke(IpcChannels.postDeleteProjectSkill, id),
  querySkillTemplates: () => ipcRenderer.invoke(IpcChannels.querySkillTemplates),
  postInstallSkillTemplate: (templateId: string, targetId?: string) =>
    ipcRenderer.invoke(IpcChannels.postInstallSkillTemplate, templateId, targetId),
  querySkillImportPreview: (url: string) =>
    ipcRenderer.invoke(IpcChannels.querySkillImportPreview, url),
  postImportSkillFromUrl: (url: string, targetId?: string) =>
    ipcRenderer.invoke(IpcChannels.postImportSkillFromUrl, url, targetId),
  queryLocalImageDataUrl: (filePath: string) =>
    ipcRenderer.invoke(IpcChannels.queryLocalImageDataUrl, filePath),
  queryLocalMediaUrl: (filePath: string) =>
    ipcRenderer.invoke(IpcChannels.queryLocalMediaUrl, filePath),

  queryAgentRules: () => ipcRenderer.invoke(IpcChannels.queryAgentRules),
  postAgentRule: (input: AgentRuleUpsertInput) =>
    ipcRenderer.invoke(IpcChannels.postAgentRule, input),
  postDeleteAgentRule: (id: string) => ipcRenderer.invoke(IpcChannels.postDeleteAgentRule, id),

  queryWorkflows: () => ipcRenderer.invoke(IpcChannels.queryWorkflows),
  queryWorkflow: (id: string) => ipcRenderer.invoke(IpcChannels.queryWorkflow, id),
  postWorkflow: (workflow: WorkflowDefinition) =>
    ipcRenderer.invoke(IpcChannels.postWorkflow, workflow),
  postDeleteWorkflow: (id: string) => ipcRenderer.invoke(IpcChannels.postDeleteWorkflow, id),
  postRunWorkflow: (workflowId: string) =>
    ipcRenderer.invoke(IpcChannels.postRunWorkflow, workflowId),
  postResumeWorkflow: (runId: string) =>
    ipcRenderer.invoke(IpcChannels.postResumeWorkflow, runId),
  queryWorkflowRuns: () => ipcRenderer.invoke(IpcChannels.queryWorkflowRuns),
  queryLatestWorkflowRunBySession: (sessionId: string) =>
    ipcRenderer.invoke(IpcChannels.queryLatestWorkflowRunBySession, sessionId),

  onAgentEvent: (cb) => {
    const listener = (_event: Electron.IpcRendererEvent, data: AgentEvent): void => {
      cb(data)
    }
    ipcRenderer.on(IpcChannels.onAgentEvent, listener)
    return () => ipcRenderer.removeListener(IpcChannels.onAgentEvent, listener)
  },

  onBrowserFrame: (cb) => {
    const listener = (_event: Electron.IpcRendererEvent, data: BrowserFramePayload): void => {
      cb(data)
    }
    ipcRenderer.on(IpcChannels.onBrowserFrame, listener)
    return () => ipcRenderer.removeListener(IpcChannels.onBrowserFrame, listener)
  },

  onScheduleUpdate: (cb) => {
    const listener = (_event: Electron.IpcRendererEvent, data: ScheduledTask[]): void => {
      cb(data)
    }
    ipcRenderer.on(IpcChannels.onScheduleUpdate, listener)
    return () => ipcRenderer.removeListener(IpcChannels.onScheduleUpdate, listener)
  },

  postSelectImages: () => ipcRenderer.invoke('dialog:select-images'),
  postOpenExternal: (url: string) => ipcRenderer.invoke('shell:open-external', url),
  postRevealPath: (filePath: string) =>
    ipcRenderer.invoke(IpcChannels.postRevealPath, filePath)
}

contextBridge.exposeInMainWorld('api', api)
