/**
 * Agent 产出资产：类型分类与展示辅助（主进程 / 渲染进程共用）。
 */

/** 资产所属目录分区 */
export type AgentAssetZone = 'artifacts' | 'videos/scenes' | 'videos/projects' | 'videos/other'

/** 按扩展名划分的预览类别 */
export type AgentAssetKind = 'image' | 'video' | 'audio' | 'html' | 'document' | 'other'

/** 磁盘扫描出的单条资产记录 */
export interface AgentAssetRecord {
  /** 绝对路径 */
  path: string
  /** 文件名 */
  name: string
  /** 字节大小 */
  size: number
  /** 修改时间（ISO 8601） */
  mtime: string
  kind: AgentAssetKind
  zone: AgentAssetZone
}

/** 列举资产的可选筛选 */
export interface QueryAgentAssetsOptions {
  kind?: AgentAssetKind | 'all'
}

/** 删除 / 清空操作结果 */
export interface AgentAssetMutationResult {
  ok: true
  deletedCount: number
}

const IMAGE_EXTS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico', 'avif'])
const VIDEO_EXTS = new Set(['mp4', 'mov', 'webm', 'mkv', 'avi', 'm4v'])
const AUDIO_EXTS = new Set(['mp3', 'wav', 'm4a', 'aac', 'ogg', 'flac'])
const HTML_EXTS = new Set(['html', 'htm'])
const DOC_EXTS = new Set([
  'md',
  'txt',
  'json',
  'csv',
  'xml',
  'pdf',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'yaml',
  'yml',
  'ts',
  'tsx',
  'js',
  'jsx',
  'css',
  'scss'
])

/** 从文件名推断预览类别 */
export function queryAgentAssetKind(fileName: string): AgentAssetKind {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? ''
  if (IMAGE_EXTS.has(ext)) return 'image'
  if (VIDEO_EXTS.has(ext)) return 'video'
  if (AUDIO_EXTS.has(ext)) return 'audio'
  if (HTML_EXTS.has(ext)) return 'html'
  if (DOC_EXTS.has(ext)) return 'document'
  return 'other'
}

/** 分区展示文案 */
export const AGENT_ASSET_ZONE_LABELS: Record<AgentAssetZone, string> = {
  artifacts: '通用产物',
  'videos/scenes': '场景素材',
  'videos/projects': '视频项目',
  'videos/other': '视频'
}

/** 类别展示文案 */
export const AGENT_ASSET_KIND_LABELS: Record<AgentAssetKind, string> = {
  image: '图片',
  video: '视频',
  audio: '音频',
  html: '网页',
  document: '文档',
  other: '其他'
}

/** 格式化字节为人类可读大小 */
export function queryFormatAssetSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}
