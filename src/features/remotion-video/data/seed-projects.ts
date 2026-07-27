import type { RemotionVideoProject } from '../types'

/**
 * 本地种子数据：列表页首屏展示。
 * 为什么：Remotion 管线尚未接后端，先用与类型对齐的静态数据验证 Tab 与卡片交互。
 */
export const REMOTION_VIDEO_SEED_PROJECTS: RemotionVideoProject[] = [
  {
    id: 'rv-song-aurora',
    title: '极光律动 · MV 竖版',
    description: '歌词逐行高亮 + 频谱条，适配 9:16 短视频分发',
    category: 'song',
    status: 'ready',
    accent: '#5b8def',
    durationSec: 62,
    compositionId: 'SongLyricVertical',
    updatedAt: Date.now() - 3600_000 * 2
  },
  {
    id: 'rv-song-night',
    title: '深夜电台片头',
    description: '黑胶纹理与波形叠化，15s 品牌开场',
    category: 'song',
    status: 'draft',
    accent: '#8b6fd4',
    durationSec: 15,
    compositionId: 'RadioIntro',
    updatedAt: Date.now() - 86400_000
  },
  {
    id: 'rv-news-morning',
    title: '早报快讯三栏',
    description: '标题区 + 滚动字幕 + 角标时间轴，横屏 16:9',
    category: 'news',
    status: 'rendering',
    accent: '#e85d4c',
    durationSec: 45,
    compositionId: 'NewsTickerWide',
    updatedAt: Date.now() - 1800_000
  },
  {
    id: 'rv-news-brief',
    title: '突发简讯竖屏',
    description: '单条新闻大字报式排版，强调可读性',
    category: 'news',
    status: 'ready',
    accent: '#d4a574',
    durationSec: 28,
    compositionId: 'NewsFlashVertical',
    updatedAt: Date.now() - 7200_000
  },
  {
    id: 'rv-product-launch',
    title: '新品卖点轮播',
    description: '三卖点卡片切换 + 价格锚点动效',
    category: 'product',
    status: 'ready',
    accent: '#3d9a8b',
    durationSec: 36,
    compositionId: 'ProductCarousel',
    updatedAt: Date.now() - 4000_000
  },
  {
    id: 'rv-edu-chapter',
    title: '课程章节导览',
    description: '章节序号与知识点 bullet 飞入，适合片头',
    category: 'education',
    status: 'draft',
    accent: '#6b9e3d',
    durationSec: 22,
    compositionId: 'EduChapterIntro',
    updatedAt: Date.now() - 172800_000
  },
  {
    id: 'rv-other-countdown',
    title: '活动倒计时通用模板',
    description: '可配置截止日期与主副标题',
    category: 'other',
    status: 'failed',
    accent: '#c45c8a',
    durationSec: 10,
    compositionId: 'EventCountdown',
    updatedAt: Date.now() - 600_000
  }
]
