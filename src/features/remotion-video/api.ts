/**
 * Remotion 视频生产 — 渲染进程 API 封装。
 * 查询类统一 query 前缀；修改类统一 post 前缀。
 */
import type {
  RemotionExportRecord,
  PostEnqueueRemotionExportInput,
  PostUpdateRemotionExportInput
} from '@shared/remotion-exports'

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
