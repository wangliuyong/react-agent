import type {
  WorkflowAgentNode,
  WorkflowDefinition,
  WorkflowNode,
  PublishPlan,
  PublishSubTask
} from './types'
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
      `必须使用工具 ${meta.publishTool} 完成该渠道发布。`
    ]
      .filter(Boolean)
      .join('\n')
  })

  const toolWhitelist = Array.from(
    new Set([
      'fetch_hot_topics',
      'fetch_web_images',
      'list_attachments',
      'update_task_list',
      ...channels.map((id) => queryPublishChannelMeta(id).publishTool)
    ])
  )

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

/**
 * 将发布计划编译为可执行工作流定义。
 * 每个子任务一个端到端 Agent 节点（调研→创作→配图→发布），不再分多段流程。
 */
export function compilePublishPlanToWorkflow(plan: PublishPlan): WorkflowDefinition {
  const now = Date.now()
  const nodes = plan.subTasks.flatMap((sub) => buildSubTaskNodes(sub))
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
