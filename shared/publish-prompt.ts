import type { PublishPlan, PublishSubTask } from './types'
import {
  normalizePublishSubTaskChannels,
  queryPublishChannelLabel,
  queryPublishChannelLabels,
  queryPublishChannelMeta
} from './publish-channels'

/**
 * @deprecated 发布执行已切到编排引擎（compilePublishPlanToWorkflow）。
 * 仅保留供调试/兼容旧调用；新代码请勿再依赖本函数驱动执行。
 */
export function buildSubTaskPrompt(sub: PublishSubTask): string {
  const channelIds = normalizePublishSubTaskChannels(sub.channels)
  const channelLabels = queryPublishChannelLabels(channelIds)
  const multiChannel = channelIds.length > 1

  const channelBlocks = channelIds
    .map((id) => {
      const meta = queryPublishChannelMeta(id)
      const label = queryPublishChannelLabel(id)
      const titleHint =
        meta.titleMaxLength != null ? `标题建议不超过 ${meta.titleMaxLength} 字。` : ''
      return [`#### ${label}`, titleHint, meta.agentHint].filter(Boolean).join('\n')
    })
    .join('\n')

  const hasXhs = channelIds.includes('xhs')

  return [
    multiChannel
      ? `请帮我在以下渠道依次发布同一条内容：${channelLabels}。`
      : `请帮我在${channelLabels}发布一条内容。`,
    `任务标题：${sub.title}`,
    sub.topic ? `主题标签：${sub.topic}` : '',
    `内容要求：${sub.contentPrompt || '按主题自由发挥'}`,
    multiChannel ? `渠道执行顺序：${channelLabels}（前一个渠道完成后再执行下一个）。` : '',
    '自动发布：是（填好后自动点发布；未登录时会暂停扫码）',
    '配图：优先用 fetch_web_images 从相关新闻/内容来源网页抓取；用户本地上传仅为可选。',
    hasXhs
      ? '小红书风控：每篇标题/正文结构/话题须差异化，禁止同一模板批量发；发布时间分散在活跃时段，勿短时间连发多篇。'
      : '',
    channelBlocks
  ]
    .filter(Boolean)
    .join('\n')
}

/**
 * @deprecated 请改用 shared/compile-publish-workflow + postRunWorkflow。
 * 调度器与发布工作台主路径已不再调用本函数。
 */
export function buildPublishPlanPrompt(plan: PublishPlan): string {
  if (!plan.subTasks.length) {
    return `发布计划「${plan.title}」暂无子任务，请先在工作台添加子任务。`
  }

  const channelLabels = Array.from(
    new Set(
      plan.subTasks.flatMap((s) =>
        normalizePublishSubTaskChannels(s.channels).map((id) => queryPublishChannelLabel(id))
      )
    )
  )
  const channelDesc = channelLabels.length === 1 ? channelLabels[0] : '多渠道'

  return [
    `请按顺序串行执行以下 ${plan.subTasks.length} 个${channelDesc}发布子任务（计划：${plan.title}）：`,
    ...plan.subTasks.map((s, i) => `\n### 子任务 ${i + 1}\n${buildSubTaskPrompt(s)}`),
    '\n每完成一个子任务更新任务清单。若需要配图请提示我上传。'
  ].join('\n')
}
