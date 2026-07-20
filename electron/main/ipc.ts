import { ipcMain } from 'electron'
import { rmSync, existsSync } from 'fs'
import { IpcChannels } from '../../shared/types'
import type {
  AgentChatRequest,
  AgentRuleUpsertInput,
  AppSettings,
  PublishPlan,
  ScheduledTask,
  Session,
  SkillStates,
  SkillUpsertInput
} from '../../shared/types'
import { querySettings, postSettings } from './store/settings'
import {
  queryProviderModels,
  queryResolveProviderModelsCredentials
} from './store/provider-models'
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
  postDeletePublishPlan,
  postInitPublishPlans,
  postImportBuiltinPublishPlans
} from './store/plans'
import {
  queryScheduledTasks,
  queryScheduledTask,
  postScheduledTask,
  postDeleteScheduledTask,
  postInitScheduledTasks,
  postImportBuiltinScheduledTasks
} from './store/schedules'
import { triggerScheduledTask } from './schedule/scheduler'
import {
  runLangGraphChat,
  postGraphAbort,
  postGraphContinue
} from './agent/graph-bridge'
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
import { postSummarizeSkillFromSession } from './store/skill-summarize'
import { queryLocalImageDataUrl } from './store/local-image'
import { queryLocalMediaUrl } from './store/local-media'
import {
  queryAllChannelLoginStatuses,
  postOpenChannelLogin
} from './browser/channel-login'
import {
  queryPublishChannels,
  postPublishChannel,
  postDeletePublishChannel,
  postInitPublishChannels
} from './store/channels'
import {
  queryAgentRules,
  postAgentRule,
  postDeleteAgentRule
} from './store/rules'
import {
  queryWorkflows,
  queryWorkflow,
  postWorkflow,
  postDeleteWorkflow
} from './store/workflows'
import { postRunWorkflow, postResumeWorkflow } from './workflow/engine'
import {
  queryWorkflowRuns,
  queryLatestWorkflowRunBySession
} from './store/workflow-runs'
import {
  postDeletePublishPlanWorkflow,
  syncPublishPlanWorkflow
} from './workflow/migrate-publish'
import { createBuiltinPublishPlans } from '../../shared/builtin-seeds'
import type { PublishChannelUpsertInput } from '../../shared/publish-channels'
import type { WorkflowDefinition } from '../../shared/types'
import { postNotifyMessage } from './notify/send'

/** 注册全部 IPC；读 query* / 写 post* */
export function registerIpcHandlers(): void {
  ipcMain.handle(IpcChannels.querySettings, () => querySettings())
  ipcMain.handle(IpcChannels.postSettings, (_e, partial: Partial<AppSettings>) =>
    postSettings(partial)
  )
  // 默认读盘；设置页可传入未保存的草稿覆盖
  ipcMain.handle(
    IpcChannels.queryProviderModels,
    (
      _e,
      override?: Partial<Pick<AppSettings, 'provider' | 'apiKey' | 'baseUrl'>>
    ) => {
      const saved = querySettings()
      return queryProviderModels(queryResolveProviderModelsCredentials(saved, override))
    }
  )

  ipcMain.handle(IpcChannels.querySessions, () => querySessions())
  ipcMain.handle(IpcChannels.querySession, (_e, id: string) => querySession(id))
  ipcMain.handle(IpcChannels.postSession, (_e, session: Session) => postSession(session))
  ipcMain.handle(IpcChannels.postDeleteSession, (_e, id: string) => postDeleteSession(id))

  ipcMain.handle(IpcChannels.queryPublishPlans, () => queryPublishPlans())
  ipcMain.handle(IpcChannels.queryPublishPlan, (_e, id: string) => queryPublishPlan(id))
  ipcMain.handle(IpcChannels.postPublishPlan, (_e, plan: PublishPlan) => {
    const saved = postPublishPlan(plan)
    // 与编排引擎镜像同步（不放 store/plans，避免与 migrate-publish 循环依赖）
    try {
      syncPublishPlanWorkflow(saved)
    } catch {
      /* 执行时会惰性迁移 */
    }
    return saved
  })
  ipcMain.handle(IpcChannels.postDeletePublishPlan, (_e, id: string) => {
    // 先按分类决定是否删镜像工作流（需读盘），再删计划文件
    postDeletePublishPlanWorkflow(id)
    postDeletePublishPlan(id)
  })

  /** 同步内置发布计划到编排引擎镜像工作流 */
  const syncBuiltinPublishPlans = (): PublishPlan[] => {
    const plans = queryPublishPlans()
    for (const seed of createBuiltinPublishPlans()) {
      const saved = plans.find((plan) => plan.id === seed.id)
      if (saved) {
        try {
          syncPublishPlanWorkflow(saved)
        } catch {
          /* 执行时会惰性迁移 */
        }
      }
    }
    return plans
  }

  ipcMain.handle(IpcChannels.postInitPublishPlans, () => {
    postInitPublishPlans()
    return syncBuiltinPublishPlans()
  })
  ipcMain.handle(IpcChannels.postImportBuiltinPublishPlans, () => {
    postImportBuiltinPublishPlans()
    return syncBuiltinPublishPlans()
  })

  ipcMain.handle(IpcChannels.queryScheduledTasks, () => queryScheduledTasks())
  ipcMain.handle(IpcChannels.queryScheduledTask, (_e, id: string) => queryScheduledTask(id))
  ipcMain.handle(IpcChannels.postScheduledTask, (_e, task: ScheduledTask) =>
    postScheduledTask(task)
  )
  ipcMain.handle(IpcChannels.postDeleteScheduledTask, (_e, id: string) =>
    postDeleteScheduledTask(id)
  )
  ipcMain.handle(IpcChannels.postRunScheduledTask, async (_e, id: string) =>
    triggerScheduledTask(id, true)
  )

  ipcMain.handle(IpcChannels.postInitScheduledTasks, () => postInitScheduledTasks())
  ipcMain.handle(IpcChannels.postImportBuiltinScheduledTasks, () =>
    postImportBuiltinScheduledTasks()
  )

  ipcMain.handle(IpcChannels.postAgentChat, async (_e, req: AgentChatRequest) => {
    // 异步跑 LangGraph；事件经 webContents.send 推送
    void runLangGraphChat(req)
  })
  ipcMain.handle(IpcChannels.postAgentAbort, (_e, sessionId: string) => {
    postGraphAbort(sessionId)
  })
  ipcMain.handle(IpcChannels.postAgentContinue, (_e, sessionId: string, userInput?: string) => {
    postGraphContinue(sessionId, userInput)
  })

  ipcMain.handle(IpcChannels.queryBrowserStatus, () => getBrowserService().getStatus())
  ipcMain.handle(IpcChannels.postBrowserStart, async () => {
    await getBrowserService().ensureStarted()
    return getBrowserService().getStatus()
  })
  ipcMain.handle(IpcChannels.postBrowserClose, async () => {
    await getBrowserService().close()
    return getBrowserService().getStatus()
  })
  ipcMain.handle(IpcChannels.postBrowserClearProfile, async () => {
    await getBrowserService().close()
    releaseBrowserProfileLock()
    const dir = getBrowserProfileDir()
    if (existsSync(dir)) {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  ipcMain.handle(IpcChannels.queryPublishChannels, () => queryPublishChannels())
  ipcMain.handle(IpcChannels.postPublishChannel, (_e, input: PublishChannelUpsertInput) =>
    postPublishChannel(input)
  )
  ipcMain.handle(IpcChannels.postDeletePublishChannel, (_e, id: string) =>
    postDeletePublishChannel(id)
  )
  ipcMain.handle(IpcChannels.postInitPublishChannels, () => postInitPublishChannels())
  ipcMain.handle(IpcChannels.postNotifyChannelTest, async (_e, channelId: string) => {
    return postNotifyMessage({
      channelId: String(channelId),
      title: '灵犀通知测试',
      content: '这是一条来自渠道页的测试消息。'
    })
  })

  ipcMain.handle(IpcChannels.queryChannelLoginStatuses, () => queryAllChannelLoginStatuses())
  ipcMain.handle(IpcChannels.postChannelOpenLogin, async (_e, channelId: string) =>
    postOpenChannelLogin(channelId)
  )

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
  ipcMain.handle(IpcChannels.postSummarizeSkillFromSession, (_e, sessionId: string) =>
    postSummarizeSkillFromSession(sessionId)
  )
  ipcMain.handle(IpcChannels.queryLocalImageDataUrl, (_e, filePath: string) =>
    queryLocalImageDataUrl(filePath)
  )
  ipcMain.handle(IpcChannels.queryLocalMediaUrl, (_e, filePath: string) =>
    queryLocalMediaUrl(filePath)
  )

  ipcMain.handle(IpcChannels.queryAgentRules, () => queryAgentRules())
  ipcMain.handle(IpcChannels.postAgentRule, (_e, input: AgentRuleUpsertInput) =>
    postAgentRule(input)
  )
  ipcMain.handle(IpcChannels.postDeleteAgentRule, (_e, id: string) => postDeleteAgentRule(id))

  ipcMain.handle(IpcChannels.queryWorkflows, () => queryWorkflows())
  ipcMain.handle(IpcChannels.queryWorkflow, (_e, id: string) => queryWorkflow(id))
  ipcMain.handle(IpcChannels.postWorkflow, (_e, workflow: WorkflowDefinition) =>
    postWorkflow(workflow)
  )
  ipcMain.handle(IpcChannels.postDeleteWorkflow, (_e, id: string) => postDeleteWorkflow(id))
  ipcMain.handle(IpcChannels.postRunWorkflow, async (_e, workflowId: string) =>
    postRunWorkflow(workflowId)
  )
  ipcMain.handle(IpcChannels.postResumeWorkflow, async (_e, runId: string) =>
    postResumeWorkflow(runId)
  )
  ipcMain.handle(IpcChannels.queryWorkflowRuns, () => queryWorkflowRuns())
  ipcMain.handle(IpcChannels.queryLatestWorkflowRunBySession, (_e, sessionId: string) =>
    queryLatestWorkflowRunBySession(sessionId)
  )
}
