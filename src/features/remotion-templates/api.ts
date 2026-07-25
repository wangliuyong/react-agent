import type {
  RemotionApplyTemplateResult,
  RemotionTemplateOrigin,
  RemotionTemplateSummary
} from '@shared/remotion-template'

export interface RemotionTemplateListFilter {
  tag?: string
  query?: string
  origin?: RemotionTemplateOrigin
}

/** 查询 Remotion 模板列表 */
export async function queryRemotionTemplateList(
  filter?: RemotionTemplateListFilter
): Promise<RemotionTemplateSummary[]> {
  return window.api.queryRemotionTemplates(filter)
}

/** 从 GitHub / HTTPS 仓库导入模板 */
export async function postImportRemotionTemplateFromUrl(
  url: string,
  targetId?: string
): Promise<RemotionTemplateSummary[]> {
  return window.api.postImportRemotionTemplateFromUrl(url, targetId)
}

/** 删除用户本地模板 */
export async function postDeleteRemotionTemplate(templateId: string): Promise<void> {
  return window.api.postDeleteRemotionTemplate(templateId)
}

/** 从聊天成片保存模板 */
export async function postSaveRemotionTemplateFromChat(input: {
  sessionId: string
  name: string
  templateId: string
  tags?: string[]
  videoPath?: string
}): Promise<RemotionTemplateSummary> {
  return window.api.postSaveRemotionTemplateFromChat(input)
}

/** 应用模板到会话（供设置页等扩展；聊天内主要由 Agent 工具完成） */
export async function postApplyRemotionTemplate(input: {
  sessionId: string
  templateId: string
  props?: Record<string, unknown>
}): Promise<RemotionApplyTemplateResult> {
  return window.api.postApplyRemotionTemplate(input)
}
