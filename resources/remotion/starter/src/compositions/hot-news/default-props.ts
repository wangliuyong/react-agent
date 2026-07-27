import type { HotNewsProps } from './types'

/** 横版 16:9 默认文案（内置模板与列表预览共用） */
export const HOT_NEWS_WIDE_DEFAULT_PROPS: HotNewsProps = {
  brandName: '灵犀 · 热点速览',
  dateLabel: '2026年7月27日 · 午间快讯',
  headline: '多模态大模型落地提速，产业应用进入规模化阶段',
  summary:
    '多家头部厂商同日发布端侧推理方案，视频生成与智能体工作流成为本轮竞争焦点，资本市场关注度持续升温。',
  accentColor: '#e63946',
  hotTopicName: '科技',
  tickerLines: [
    '开源视频生成框架支持 4K 批量渲染',
    '半导体板块午后拉升，算力订单环比大增',
    '多地 AI 政务服务试点办事时长缩短三成'
  ],
  items: [
    { tag: '科技', title: '开源视频生成框架更新，支持 4K 与批量渲染管线' },
    { tag: '财经', title: '半导体板块午后拉升，算力基础设施订单环比大增' },
    { tag: '国际', title: '主要经济体央行释放流动性信号，风险资产波动加剧' },
    { tag: '民生', title: '多地推出 AI 辅助政务服务试点，办事时长平均缩短三成' }
  ]
}

/** 竖版 9:16 默认文案（短视频分发） */
export const HOT_NEWS_VERTICAL_DEFAULT_PROPS: HotNewsProps = {
  brandName: '热点 60 秒',
  dateLabel: '突发 · 刚刚',
  headline: '重磅政策发布：人工智能+行动方案全文公布',
  summary: '聚焦制造、医疗、教育三大场景，明确数据安全与模型评测标准。',
  accentColor: '#ff4d4f',
  hotTopicName: '要闻',
  tickerLines: ['行动方案提出 2027 年形成可复制案例', '端侧部署与行业小模型将率先受益'],
  items: [
    { tag: '要闻', title: '行动方案提出 2027 年形成一批可复制推广案例' },
    { tag: '解读', title: '专家：端侧部署与行业小模型将率先受益' },
    { tag: '市场', title: '相关概念股尾盘异动，资金净流入创近月新高' }
  ]
}
