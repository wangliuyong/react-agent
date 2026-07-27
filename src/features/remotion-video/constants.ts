import type { RemotionVideoCategory } from './types'

/** 分类 Tab 配置：与 Segmented 选项一一对应 */
export const REMOTION_VIDEO_CATEGORY_TABS: {
  key: RemotionVideoCategory | 'all'
  label: string
}[] = [
  { key: 'all', label: '全部' },
  { key: 'song', label: '歌曲' },
  { key: 'news', label: '新闻' },
  { key: 'product', label: '产品' },
  { key: 'education', label: '教育' },
  { key: 'other', label: '其他' }
]

/** 分类中文标签（卡片角标） */
export const REMOTION_VIDEO_CATEGORY_LABEL: Record<RemotionVideoCategory, string> = {
  song: '歌曲',
  news: '新闻',
  product: '产品',
  education: '教育',
  other: '其他'
}

/** 状态中文与 Ant Design Tag 语义色 */
export const REMOTION_VIDEO_STATUS_META: Record<
  import('./types').RemotionVideoStatus,
  { label: string; tone: 'default' | 'processing' | 'success' | 'error' }
> = {
  draft: { label: '草稿', tone: 'default' },
  rendering: { label: '渲染中', tone: 'processing' },
  ready: { label: '可导出', tone: 'success' },
  failed: { label: '失败', tone: 'error' }
}
