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
  xhsQuick: 'builtin-publish-xhs-quick',
  /** 流程任务：热点抓取 → 飞书 post 富文本推送 */
  feishuRichtext: 'builtin-publish-feishu-richtext'
} as const

/** 内置工作流固定 id（与 templates.ts 中 tpl_* 对齐） */
export const BUILTIN_WORKFLOW_IDS = {
  /** 热点简报 → 飞书 post 富文本 */
  feishuRichtextPush: 'tpl_feishu_richtext_push'
} as const

/** 内置定时任务固定 id */
export const BUILTIN_SCHEDULE_TASK_IDS = {
  /** 每日 9:00 执行多渠道发布计划 */
  dailyMulti: 'builtin-schedule-daily-multi',
  /** 每周一 10:00 热点调研指令 */
  weeklyResearch: 'builtin-schedule-weekly-research',
  /** 每日 8:00 昨日热点简报并推送飞书 */
  dailyHotPush: 'builtin-schedule-daily-hot-push',
  /** 每日 8:30 执行飞书富文本推送流程 */
  feishuRichtextPush: 'builtin-schedule-feishu-richtext-push',
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
    },
    {
      id: BUILTIN_PUBLISH_PLAN_IDS.feishuRichtext,
      title: '飞书富文本推送',
      description: '抓取微博/百度热搜，整理 Markdown 简报，完成后自动推送飞书 post 富文本',
      kind: 'workflow',
      workflowIds: [BUILTIN_WORKFLOW_IDS.feishuRichtextPush],
      notifyChannels: ['feishu'],
      subTasks: [],
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
      description: '每周一 10:00 汇总上周 AI 与科技热点，并自动推送飞书',
      enabled: false,
      repeat: 'weekly',
      timeOfDay: '10:00',
      weekday: 1,
      actionType: 'custom_prompt',
      customPrompt:
        '请调研上周人工智能与科技行业的热点事件，整理成 5 条要点摘要，每条包含标题、一句话说明和参考来源链接。输出 Markdown 格式，便于后续改写为发布内容。',
      /** 任务成功后主进程自动将正文转为飞书富文本推送 */
      notifyChannels: ['feishu'],
      createdAt: now,
      updatedAt: now
    },
    {
      id: BUILTIN_SCHEDULE_TASK_IDS.dailyHotPush,
      title: '昨日热点推送',
      description: '每天 8:00 抓取微博/百度热搜，筛选科技相关热点并推送飞书',
      enabled: false,
      repeat: 'daily',
      timeOfDay: '08:00',
      weekday: 1,
      actionType: 'custom_prompt',
      customPrompt:
        '请获取昨日微博与百度热搜中与人工智能、科技、互联网相关的热点（优先调用 fetch_hot_topics，source 依次尝试 weibo、baidu）。' +
        '整理成 8 条要点简报，每条包含：标题、一句话说明、可参考的资讯来源或链接。' +
        '输出 Markdown 格式，文首加标题「昨日热点简报」，便于自动推送飞书。',
      /** 任务成功后主进程自动将正文转为飞书富文本推送 */
      notifyChannels: ['feishu'],
      createdAt: now,
      updatedAt: now
    },
    {
      id: BUILTIN_SCHEDULE_TASK_IDS.feishuRichtextPush,
      title: '每日富文本推送',
      description: '每天 8:30 执行「飞书富文本推送」流程，以 post 格式推送到飞书',
      enabled: false,
      repeat: 'daily',
      timeOfDay: '08:30',
      weekday: 1,
      actionType: 'workflow',
      workflowId: BUILTIN_WORKFLOW_IDS.feishuRichtextPush,
      notifyChannels: ['feishu'],
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
