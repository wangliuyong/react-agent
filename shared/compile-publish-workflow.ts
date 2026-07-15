import type {
  WorkflowAgentNode,
  WorkflowDefinition,
  WorkflowNode,
  PublishPlan,
  PublishSubTask
} from './types'
import { normalizeNotifyChannelIds } from './publish-normalize'
import {
  normalizePublishSubTaskChannels,
  queryPublishChannelLabel,
  queryPublishChannelLabels,
  queryPublishChannelMeta
} from './publish-channels'

/**
 * 发布计划 id 与对应工作流 id 对齐，便于定时任务 publishPlanId 直接解析。
 */
export function queryPublishWorkflowId(planId: string): string {
  return planId
}

/**
 * 单个子任务 → 单一 Agent 节点：调研/创作/配图/发布在同一步内串行完成，不再拆成创作+分渠道发布多段流程。
 */
function buildEndToEndAgentNode(sub: PublishSubTask): WorkflowAgentNode {
  const channels = normalizePublishSubTaskChannels(sub.channels)
  const labels = queryPublishChannelLabels(channels)
  const autoPublish = sub.autoPublish !== false
  const publishHint = autoPublish
    ? '调用发布工具时必须传 autoPublish=true，填好后自动点击发布（未登录时工具会暂停等人扫码）。'
    : '调用发布工具时必须传 autoPublish=false，只填好内容停在待发布，勿自动点击发布。'

  const channelBlocks = channels.map((id) => {
    const meta = queryPublishChannelMeta(id)
    const label = queryPublishChannelLabel(id)
    const titleHint =
      meta.titleMaxLength != null ? `标题建议不超过 ${meta.titleMaxLength} 字。` : ''
    return [
      `#### ${label}`,
      titleHint,
      meta.agentHint,
      meta.publishTool ? `必须使用工具 ${meta.publishTool} 完成该渠道发布。` : ''
    ]
      .filter(Boolean)
      .join('\n')
  })

  const notifyIds = normalizeNotifyChannelIds(sub.notifyChannels)
  const notifyLabels = notifyIds.map((id) => queryPublishChannelLabel(id)).join('、')

  const toolWhitelist = Array.from(
    new Set([
      'fetch_hot_topics',
      'fetch_web_images',
      'list_attachments',
      'update_task_list',
      ...channels
        .map((id) => queryPublishChannelMeta(id).publishTool)
        .filter((t): t is string => Boolean(t)),
      ...(notifyIds.length > 0 ? (['notify_message'] as const) : [])
    ])
  )

  const notifyHint =
    notifyIds.length > 0
      ? [
          `发布完成后，依次调用 notify_message，channelId 分别为：${notifyIds.join('、')}（${notifyLabels}），`,
          'content 简要说明本子任务各渠道发布结果。每个渠道只通知一次；成功后禁止重复发送。通知失败可忽略，不要因此判定任务失败。'
        ].join('')
      : ''

  return {
    id: `${sub.id}_run`,
    type: 'agent',
    title: sub.title,
    prompt: [
      channels.length > 1
        ? `请在同一步内完成选题、创作、配图，并依次发布到：${labels}（前一个渠道完成后再发下一个）。`
        : `请在同一步内完成选题、创作、配图并发布到${labels || '目标渠道'}。`,
      `任务标题：${sub.title}`,
      sub.topic ? `主题标签：${sub.topic}` : '',
      `内容要求：${sub.contentPrompt || '按主题自由发挥'}`,
      '若需热点选题，先调用 fetch_hot_topics；再撰写标题与正文。',
      '配图：必须调用 fetch_web_images（传入 pageUrl 或 imageUrls）拿到本地绝对路径后再发布；不要只给「建议来源」而不下载。',
      publishHint,
      ...channelBlocks,
      notifyHint,
      '不要拆成多轮「只创作不发布」；本步结束前应完成全部目标渠道的发布工具调用。'
    ]
      .filter(Boolean)
      .join('\n'),
    toolWhitelist
  }
}

function buildSubTaskNodes(sub: PublishSubTask): WorkflowNode[] {
  return [buildEndToEndAgentNode(sub)]
}

/** 计划级汇总通知节点：全部子任务跑完后调用 */
function buildPlanNotifyNode(plan: PublishPlan): WorkflowAgentNode {
  const ids = normalizeNotifyChannelIds(plan.notifyChannels)
  const labels = ids.map((id) => queryPublishChannelLabel(id)).join('、')
  return {
    id: `${plan.id}_notify_summary`,
    type: 'agent',
    title: '计划结果通知',
    prompt: [
      `请汇总整个发布计划「${plan.title}」的执行结果（成功/失败要点），`,
      `调用 notify_message 通知到：${labels}（channelId: ${ids.join(', ')}）。`,
      '每个渠道只调用一次；成功后禁止再次发送。仅失败时可对该渠道重试 1 次。'
    ].join('\n'),
    toolWhitelist: ['notify_message']
  }
}

/**
 * 将发布计划编译为可执行工作流定义。
 * 每个子任务一个端到端 Agent 节点（调研→创作→配图→发布），末尾可追加计划级通知。
 */
export function compilePublishPlanToWorkflow(plan: PublishPlan): WorkflowDefinition {
  const now = Date.now()
  const nodes = plan.subTasks.flatMap((sub) => buildSubTaskNodes(sub))
  const planNotifyIds = normalizeNotifyChannelIds(plan.notifyChannels)
  if (planNotifyIds.length > 0) {
    nodes.push(buildPlanNotifyNode(plan))
  }
  return {
    id: queryPublishWorkflowId(plan.id),
    title: plan.title,
    description: plan.description || `由发布计划自动同步（${plan.subTasks.length} 个子任务）`,
    templateKind: 'publish',
    nodes,
    createdAt: plan.createdAt || now,
    updatedAt: plan.updatedAt || now
  }
}
