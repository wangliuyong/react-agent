/** Remotion 视频项目分类：列表 Tab 与筛选维度 */
export type RemotionVideoCategory = 'song' | 'news' | 'product' | 'education' | 'other'

/** 渲染与编辑生命周期 */
export type RemotionVideoStatus = 'draft' | 'rendering' | 'ready' | 'failed'

/** 列表卡片展示用的视频模版（来自内置 remotion-template-* 技能） */
export interface RemotionVideoProject {
  /** 技能 id */
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
  /** 技能内是否含 template/ 可拼装源码 */
  hasTemplateCode?: boolean
  /** 画幅提示 */
  previewKind?: import('@shared/remotion-video-template').RemotionVideoPreviewKind
}
