import type { PublishPlan, ScheduledTask } from './types'

/**
 * 内置发布计划与定时任务的固定 id 前缀。
 * 用于首次启动种子写入、手动「导入示例」去重，以及 UI 展示「内置」标签。
 */
export const BUILTIN_ID_PREFIX = 'builtin-'

/** 判断是否为内置种子实体 */
export function isBuiltinSeedId(id: string): boolean {
  return id.startsWith(BUILTIN_ID_PREFIX)
}

/** 内置发布计划固定 id */
export const BUILTIN_PUBLISH_PLAN_IDS = {
  /** 多渠道：AI 热点 + 体育资讯 */
  multiChannel: 'builtin-publish-multi-channel',
  /** 单渠道：小红书科技短讯 */
  xhsQuick: 'builtin-publish-xhs-quick'
} as const

/** 内置定时任务固定 id */
export const BUILTIN_SCHEDULE_TASK_IDS = {
  /** 每日 9:00 执行多渠道发布计划 */
  dailyMulti: 'builtin-schedule-daily-multi',
  /** 每周一 10:00 热点调研指令 */
  weeklyResearch: 'builtin-schedule-weekly-research',
  /** 每周五 18:00 文娱推荐发布 */
  weeklyEntertainment: 'builtin-schedule-weekly-entertainment'
} as const

/**
 * 创建内置发布计划列表。
 * 使用固定 id，便于定时任务关联与重复导入时去重。
 */
export function createBuiltinPublishPlans(now = Date.now()): PublishPlan[] {
  return [
    {
      id: BUILTIN_PUBLISH_PLAN_IDS.multiChannel,
      title: '多渠道内容发布',
      description: 'AI 热点 + 体育资讯，覆盖小红书与抖音',
      kind: 'normal',
      workflowIds: [],
      notifyChannels: [],
      subTasks: [
        {
          id: 'builtin-sub-ai-multi',
          title: '人工智能 · 小红书 + 抖音',
          channels: ['xhs', 'douyin'],
          notifyChannels: [],
          topic: '人工智能',
          autoPublish: true,
          contentPrompt:
            '内容主题：搜罗昨日 ai 最新热门新闻。配图：从相关新闻来源网页用 fetch_web_images 抓取封面图（本地上传可选）。未登录时会暂停等人扫码。'
        },
        {
          id: 'builtin-sub-sports-xhs',
          title: '体育 · 小红书',
          channels: ['xhs'],
          notifyChannels: [],
          topic: '体育',
          autoPublish: true,
          contentPrompt:
            '内容主题：搜罗昨日最新 nba 信息、交易、球星评论等。配图：从相关新闻来源网页抓取（本地上传可选）。未登录时会暂停等人扫码。'
        }
      ],
      createdAt: now,
      updatedAt: now
    },
    {
      id: BUILTIN_PUBLISH_PLAN_IDS.xhsQuick,
      title: '小红书快速发布',
      description: '单渠道科技短讯，适合日常随手发',
      kind: 'normal',
      workflowIds: [],
      notifyChannels: [],
      subTasks: [
        {
          id: 'builtin-sub-tech-xhs',
          title: '科技短讯 · 小红书',
          channels: ['xhs'],
          notifyChannels: [],
          topic: '科技',
          autoPublish: true,
          contentPrompt:
            '内容主题：整理今日 3 条科技行业要闻，每条一句话摘要 + 来源链接。配图：从新闻页抓取封面。语气简洁、适合信息流阅读。'
        }
      ],
      createdAt: now,
      updatedAt: now
    }
  ]
}

/**
 * 创建内置定时任务列表。
 * 默认 enabled: false，避免用户未确认就被调度器自动执行。
 */
export function createBuiltinScheduledTasks(now = Date.now()): ScheduledTask[] {
  return [
    {
      id: BUILTIN_SCHEDULE_TASK_IDS.dailyMulti,
      title: '每日早报 · 多渠道发布',
      description: '每天 9:00 自动执行「多渠道内容发布」计划',
      enabled: false,
      repeat: 'daily',
      timeOfDay: '09:00',
      weekday: 1,
      actionType: 'publish_plan',
      publishPlanId: BUILTIN_PUBLISH_PLAN_IDS.multiChannel,
      createdAt: now,
      updatedAt: now
    },
    {
      id: BUILTIN_SCHEDULE_TASK_IDS.weeklyResearch,
      title: '周一热点调研',
      description: '每周一 10:00 让 Agent 汇总上周 AI 与科技热点',
      enabled: false,
      repeat: 'weekly',
      timeOfDay: '10:00',
      weekday: 1,
      actionType: 'custom_prompt',
      customPrompt:
        '请调研上周人工智能与科技行业的热点事件，整理成 5 条要点摘要，每条包含标题、一句话说明和参考来源链接。输出 Markdown 格式，便于后续改写为发布内容。',
      createdAt: now,
      updatedAt: now
    },
    {
      id: BUILTIN_SCHEDULE_TASK_IDS.weeklyEntertainment,
      title: '周五文娱推荐',
      description: '每周五 18:00 执行「小红书快速发布」计划',
      enabled: false,
      repeat: 'weekly',
      timeOfDay: '18:00',
      weekday: 5,
      actionType: 'publish_plan',
      publishPlanId: BUILTIN_PUBLISH_PLAN_IDS.xhsQuick,
      createdAt: now,
      updatedAt: now
    }
  ]
}
