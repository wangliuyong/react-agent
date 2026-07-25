import type {
  RemotionApplyTemplateResult,
  RemotionTemplateDetail,
  RemotionTemplateMetaUpdateInput,
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

/** 查询模板详情 */
export async function queryRemotionTemplateDetail(
  templateId: string
): Promise<RemotionTemplateDetail | null> {
  return window.api.queryRemotionTemplateDetail(templateId)
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

/** 更新用户模板 meta */
export async function postUpdateRemotionTemplateMeta(
  input: RemotionTemplateMetaUpdateInput
): Promise<RemotionTemplateDetail> {
  return window.api.postUpdateRemotionTemplateMeta(input)
}

/** 复制模板到用户目录 */
export async function postDuplicateRemotionTemplate(
  sourceTemplateId: string,
  targetId: string,
  name?: string
): Promise<RemotionTemplateDetail> {
  return window.api.postDuplicateRemotionTemplate(sourceTemplateId, targetId, name)
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

/** 应用模板到会话 */
export async function postApplyRemotionTemplate(input: {
  sessionId: string
  templateId: string
  props?: Record<string, unknown>
}): Promise<RemotionApplyTemplateResult> {
  return window.api.postApplyRemotionTemplate(input)
}
