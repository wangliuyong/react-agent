/**
 * Remotion 导出记录：主进程落盘历史与渲染进程抽屉共用。
 */

/** 导出生命周期：进行中 / 成功 / 失败 */
export type RemotionExportStatus = 'exporting' | 'success' | 'failed'

/** 单条导出任务（磁盘 mp4 或进行中/失败记录） */
export interface RemotionExportRecord {
  /** 稳定 id：sessionId + 文件名，便于去重与覆盖更新 */
  id: string
  sessionId: string
  compositionId: string
  /** 成片绝对路径（失败时仍保留预期输出路径） */
  outputPath: string
  fileName: string
  status: RemotionExportStatus
  createdAt: number
  updatedAt: number
  /** 列表展示用标题（模板名），缺省回退 fileName */
  title?: string
  /** 导出中进度 0–100；成功/失败可省略 */
  progressPercent?: number
  /** 失败原因摘要 */
  errorMessage?: string
  /** 成功时文件字节数 */
  size?: number
}

/** 入队参数：点击「导出视频」时立刻落盘一条「导出中」记录 */
export interface PostEnqueueRemotionExportInput {
  sessionId: string
  compositionId: string
  fileName: string
  title?: string
}

/** 更新导出任务状态（后台任务成功/失败回写） */
export interface PostUpdateRemotionExportInput {
  id: string
  status: RemotionExportStatus
  outputPath?: string
  errorMessage?: string
  progressPercent?: number
  size?: number
}

/** 导出状态中文与 Tag 语义色 */
export const REMOTION_EXPORT_STATUS_META: Record<
  RemotionExportStatus,
  { label: string; tone: 'processing' | 'success' | 'error' }
> = {
  exporting: { label: '导出中', tone: 'processing' },
  success: { label: '导出成功', tone: 'success' },
  failed: { label: '导出失败', tone: 'error' }
}
