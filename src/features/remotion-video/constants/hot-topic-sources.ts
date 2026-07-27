/** 与主进程 fetch_hot_topics 的 source 枚举对齐 */
export type HotTopicSource =
  | 'weibo'
  | 'baidu'
  | 'douyin'
  | 'kuaishou'
  | 'tencent'
  | 'tophub'

export const HOT_TOPIC_SOURCE_OPTIONS: { value: HotTopicSource | 'all'; label: string }[] = [
  { value: 'all', label: '全部来源' },
  { value: 'weibo', label: '微博热搜' },
  { value: 'baidu', label: '百度热搜' },
  { value: 'douyin', label: '抖音热点' },
  { value: 'kuaishou', label: '快手热点' },
  { value: 'tencent', label: '腾讯新闻' },
  { value: 'tophub', label: '今日热榜' }
]
