import { ipcMain } from 'electron'
import { rmSync, existsSync } from 'fs'
import { IpcChannels } from '../../shared/types'
import type { AgentChatRequest, AppSettings, PublishPlan, Session, SkillStates, SkillUpsertInput } from '../../shared/types'
import { querySettings, postSettings } from './store/settings'
import {
  querySessions,
  querySession,
  postSession,
  postDeleteSession
} from './store/sessions'
import {
  queryPublishPlans,
  queryPublishPlan,
  postPublishPlan,
  postDeletePublishPlan
} from './store/plans'
import { runAgentChat, postAgentAbort, postAgentContinue } from './agent/loop'
import { getBrowserService } from './browser/service'
import { getBrowserProfileDir } from './store/paths'
import { releaseBrowserProfileLock } from './browser/profile-lock'
import {
  queryProjectSkills,
  queryProjectSkillDetail,
  postSkillStates,
  postProjectSkill,
  postDeleteProjectSkill,
  querySkillTemplates,
  postInstallSkillTemplate
} from './store/skills'
import { querySkillImportPreview, postImportSkillFromUrl } from './store/skill-import'

/** 注册全部 IPC；读 query* / 写 post* */
export function registerIpcHandlers(): void {
  ipcMain.handle(IpcChannels.querySettings, () => querySettings())
  ipcMain.handle(IpcChannels.postSettings, (_e, partial: Partial<AppSettings>) =>
    postSettings(partial)
  )

  ipcMain.handle(IpcChannels.querySessions, () => querySessions())
  ipcMain.handle(IpcChannels.querySession, (_e, id: string) => querySession(id))
  ipcMain.handle(IpcChannels.postSession, (_e, session: Session) => postSession(session))
  ipcMain.handle(IpcChannels.postDeleteSession, (_e, id: string) => postDeleteSession(id))

  ipcMain.handle(IpcChannels.queryPublishPlans, () => queryPublishPlans())
  ipcMain.handle(IpcChannels.queryPublishPlan, (_e, id: string) => queryPublishPlan(id))
  ipcMain.handle(IpcChannels.postPublishPlan, (_e, plan: PublishPlan) => postPublishPlan(plan))
  ipcMain.handle(IpcChannels.postDeletePublishPlan, (_e, id: string) =>
    postDeletePublishPlan(id)
  )

  ipcMain.handle(IpcChannels.postAgentChat, async (_e, req: AgentChatRequest) => {
    // 异步跑 loop，事件通过 webContents.send 推送
    void runAgentChat(req)
  })
  ipcMain.handle(IpcChannels.postAgentAbort, (_e, sessionId: string) => {
    postAgentAbort(sessionId)
  })
  ipcMain.handle(IpcChannels.postAgentContinue, (_e, sessionId: string) => {
    postAgentContinue(sessionId)
  })

  ipcMain.handle(IpcChannels.queryBrowserStatus, () => getBrowserService().getStatus())
  ipcMain.handle(IpcChannels.postBrowserClearProfile, async () => {
    await getBrowserService().close()
    releaseBrowserProfileLock()
    const dir = getBrowserProfileDir()
    if (existsSync(dir)) {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  ipcMain.handle(IpcChannels.queryProjectSkills, () => queryProjectSkills())
  ipcMain.handle(IpcChannels.queryProjectSkillDetail, (_e, id: string) =>
    queryProjectSkillDetail(id)
  )
  ipcMain.handle(IpcChannels.postSkillStates, (_e, states: SkillStates) =>
    postSkillStates(states)
  )
  ipcMain.handle(IpcChannels.postProjectSkill, (_e, input: SkillUpsertInput) =>
    postProjectSkill(input)
  )
  ipcMain.handle(IpcChannels.postDeleteProjectSkill, (_e, id: string) =>
    postDeleteProjectSkill(id)
  )
  ipcMain.handle(IpcChannels.querySkillTemplates, () => querySkillTemplates())
  ipcMain.handle(IpcChannels.postInstallSkillTemplate, (_e, templateId: string, targetId?: string) =>
    postInstallSkillTemplate(templateId, targetId)
  )
  ipcMain.handle(IpcChannels.querySkillImportPreview, (_e, url: string) =>
    querySkillImportPreview(url)
  )
  ipcMain.handle(IpcChannels.postImportSkillFromUrl, (_e, url: string, targetId?: string) =>
    postImportSkillFromUrl(url, targetId)
  )
}
