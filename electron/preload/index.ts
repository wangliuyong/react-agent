import { contextBridge, ipcRenderer } from 'electron'
import { IpcChannels } from '../../shared/types'
import type {
  AgentChatRequest,
  AgentEvent,
  AppSettings,
  BrowserFramePayload,
  ElectronApi,
  ProjectSkill,
  ProjectSkillDetail,
  PublishPlan,
  Session,
  SkillStates,
  SkillTemplate,
  SkillUpsertInput
} from '../../shared/types'

/** Preload：向渲染进程暴露安全 API 面 */
const api: ElectronApi = {
  querySettings: () => ipcRenderer.invoke(IpcChannels.querySettings),
  postSettings: (settings: Partial<AppSettings>) =>
    ipcRenderer.invoke(IpcChannels.postSettings, settings),

  querySessions: () => ipcRenderer.invoke(IpcChannels.querySessions),
  querySession: (id: string) => ipcRenderer.invoke(IpcChannels.querySession, id),
  postSession: (session: Session) => ipcRenderer.invoke(IpcChannels.postSession, session),
  postDeleteSession: (id: string) => ipcRenderer.invoke(IpcChannels.postDeleteSession, id),

  queryPublishPlans: () => ipcRenderer.invoke(IpcChannels.queryPublishPlans),
  queryPublishPlan: (id: string) => ipcRenderer.invoke(IpcChannels.queryPublishPlan, id),
  postPublishPlan: (plan: PublishPlan) => ipcRenderer.invoke(IpcChannels.postPublishPlan, plan),
  postDeletePublishPlan: (id: string) =>
    ipcRenderer.invoke(IpcChannels.postDeletePublishPlan, id),

  postAgentChat: (req: AgentChatRequest) => ipcRenderer.invoke(IpcChannels.postAgentChat, req),
  postAgentAbort: (sessionId: string) =>
    ipcRenderer.invoke(IpcChannels.postAgentAbort, sessionId),
  postAgentContinue: (sessionId: string) =>
    ipcRenderer.invoke(IpcChannels.postAgentContinue, sessionId),

  queryBrowserStatus: () => ipcRenderer.invoke(IpcChannels.queryBrowserStatus),
  postBrowserClearProfile: () => ipcRenderer.invoke(IpcChannels.postBrowserClearProfile),

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

  postSelectImages: () => ipcRenderer.invoke('dialog:select-images')
}

contextBridge.exposeInMainWorld('api', api)
