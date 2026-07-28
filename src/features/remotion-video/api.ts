/**
 * Remotion 视频生产 — 渲染进程 API 封装。
 * 查询类统一 query 前缀；修改类统一 post 前缀。
 */
import type {
  RemotionExportRecord,
  PostEnqueueRemotionExportInput,
  PostUpdateRemotionExportInput
} from '@shared/remotion-exports'
import type { RemotionVideoTemplate } from '@shared/remotion-video-template'
import type { RemotionVideoProject } from './types'

/** 拉取导出列表（进行中 / 成功 / 失败） */
export async function queryRemotionExports(): Promise<RemotionExportRecord[]> {
  return window.api.queryRemotionExports()
}

/** 导出任务入队：立刻出现在导出列表 */
export async function postEnqueueRemotionExport(
  input: PostEnqueueRemotionExportInput
): Promise<RemotionExportRecord> {
  return window.api.postEnqueueRemotionExport(input)
}

/** 回写导出任务状态（后台成功 / 失败） */
export async function postUpdateRemotionExport(
  input: PostUpdateRemotionExportInput
): Promise<RemotionExportRecord | null> {
  return window.api.postUpdateRemotionExport(input)
}

/**
 * 从内置技能市场拉取 Remotion 视频模版列表。
 * 模版定义在 resources/skills 下 remotion-template- 前缀的 SKILL.md，不写死在前端。
 */
export async function queryRemotionVideoTemplates(): Promise<RemotionVideoProject[]> {
  const list = await window.api.queryRemotionVideoTemplates()
  return list.map(queryRemotionTemplateToProject)
}

/** 共享 DTO → 页面卡片实体 */
function queryRemotionTemplateToProject(template: RemotionVideoTemplate): RemotionVideoProject {
  return {
    id: template.id,
    title: template.title,
    description: template.description,
    category: template.category,
    status: template.status,
    accent: template.accent,
    durationSec: template.durationSec,
    compositionId: template.compositionId,
    updatedAt: template.updatedAt,
    previewKind: template.previewKind,
    hasTemplateCode: template.hasTemplateCode
  }
}

export interface PostApplyRemotionTemplateSkillInput {
  sessionId: string
  skillId: string
  compositionId?: string
  props?: Record<string, unknown>
  width?: number
  height?: number
  fps?: number
  durationInFrames?: number
  openStudio?: boolean
}

export interface PostApplyRemotionTemplateSkillResult {
  ok: boolean
  message: string
  projectDir?: string
  compositionId?: string
  studioUrl?: string
  skillId?: string
}

/** 拼装技能模版到会话工程，并可打开 Studio */
export async function postApplyRemotionTemplateSkill(
  input: PostApplyRemotionTemplateSkillInput
): Promise<PostApplyRemotionTemplateSkillResult> {
  return window.api.postApplyRemotionTemplateSkill(input)
}

export interface PostRenderRemotionStudioExportInput {
  sessionId: string
  compositionId: string
  projectDir?: string
  outputFileName?: string
  quality?: 'fast' | 'standard' | 'high'
  title?: string
}

export interface PostRenderRemotionStudioExportResult {
  ok: boolean
  message: string
  path?: string
  record?: RemotionExportRecord
}

/**
 * 直接渲染已启动 Studio 的会话工程（不新建 Agent、不重拼装）。
 * 成功后主进程会关闭该会话 Studio。
 */
export async function postRenderRemotionStudioExport(
  input: PostRenderRemotionStudioExportInput
): Promise<PostRenderRemotionStudioExportResult> {
  return window.api.postRenderRemotionStudioExport(input)
}

/**
 * 在系统文件管理器中定位成片。
 * 文件缺失时回退到父目录（失败任务仍可打开 out 文件夹）。
 */
export async function postRevealExportPath(
  filePath: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const primary = await window.api.postRevealPath(filePath)
  if (primary.ok) return primary

  const parent = filePath.replace(/[/\\][^/\\]+$/, '')
  if (!parent || parent === filePath) return primary
  return window.api.postRevealPath(parent)
}
