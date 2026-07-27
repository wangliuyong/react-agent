/** Remotion 视频项目分类：列表 Tab 与筛选维度 */
export type RemotionVideoCategory = 'song' | 'news' | 'product' | 'education' | 'other'

/** 渲染与编辑生命周期 */
export type RemotionVideoStatus = 'draft' | 'rendering' | 'ready' | 'failed'

/** 列表卡片展示用的视频项目实体（后续可对接 API） */
export interface RemotionVideoProject {
  id: string
  title: string
  description: string
  category: RemotionVideoCategory
  status: RemotionVideoStatus
  /** 预览主色，用于占位缩略图渐变 */
  accent: string
  durationSec: number
  compositionId: string
  updatedAt: number
  /** 可选封面图 URL；无则使用程序化占位 */
  coverUrl?: string
}
