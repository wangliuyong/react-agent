import type {
  WorkflowAgentNode,
  WorkflowAwaitNode,
  WorkflowDefinition,
  WorkflowNode,
  WorkflowParallelNode,
  PublishPlan,
  PublishSubTask
} from './types'
import {
  normalizePublishSubTaskChannels,
  queryPublishChannelLabel,
  queryPublishChannelMeta
} from './publish-channels'

/**
 * 发布计划 id 与对应工作流 id 对齐，便于定时任务 publishPlanId 直接解析。
 */
export function queryPublishWorkflowId(planId: string): string {
  return planId
}

function buildCreateAgentNode(sub: PublishSubTask): WorkflowAgentNode {
  const channels = normalizePublishSubTaskChannels(sub.channels)
  const labels = channels.map((id) => queryPublishChannelLabel(id)).join('、')
  return {
    id: `${sub.id}_create`,
    type: 'agent',
    title: `创作：${sub.title}`,
    prompt: [
      `为以下发布子任务准备标题、正文与配图（先不调用发布工具）：`,
      `任务标题：${sub.title}`,
      sub.topic ? `主题标签：${sub.topic}` : '',
      `内容要求：${sub.contentPrompt || '按主题自由发挥'}`,
      `目标渠道：${labels || '未指定'}`,
      '配图：优先用 fetch_web_images 从相关网页抓取；用户本地上传仅为可选。',
      '完成后用简短中文说明标题/正文要点与配图路径，供后续发布步骤使用。'
    ]
      .filter(Boolean)
      .join('\n'),
    toolWhitelist: ['fetch_web_images', 'list_attachments', 'update_task_list']
  }
}

function buildChannelAgentNode(sub: PublishSubTask, channelId: string): WorkflowAgentNode {
  const meta = queryPublishChannelMeta(channelId)
  const label = queryPublishChannelLabel(channelId)
  const titleHint =
    meta.titleMaxLength != null ? `标题建议不超过 ${meta.titleMaxLength} 字。` : ''

  return {
    id: `${sub.id}_pub_${channelId}`,
    type: 'agent',
    title: `发布到${label}`,
    prompt: [
      `将上一步创作的内容发布到「${label}」。`,
      `任务标题：${sub.title}`,
      sub.topic ? `主题：${sub.topic}` : '',
      // 产品策略：流程/任务执行不自动点发布，一律停在待发布
      '调用发布工具时必须 autoPublish=false，只填好内容停在待发布，勿自动点击发布。',
      titleHint,
      meta.agentHint,
      `必须使用工具 ${meta.publishTool} 完成；不要改发到其他渠道。`
    ]
      .filter(Boolean)
      .join('\n'),
    toolWhitelist: [meta.publishTool, 'fetch_web_images', 'list_attachments', 'update_task_list']
  }
}

function buildSubTaskNodes(sub: PublishSubTask): WorkflowNode[] {
  const nodes: WorkflowNode[] = [buildCreateAgentNode(sub)]
  const channels = normalizePublishSubTaskChannels(sub.channels)

  // 始终在发布前暂停，避免任务/流程无人确认就执行到终态
  const awaitNode: WorkflowAwaitNode = {
    id: `${sub.id}_confirm`,
    type: 'await_user',
    title: `确认发布：${sub.title}`,
    reason: `子任务「${sub.title}」内容已准备好，请确认后继续填写渠道发布页（不会自动点击发布）。`
  }
  nodes.push(awaitNode)

  if (channels.length === 0) {
    return nodes
  }

  if (channels.length === 1) {
    nodes.push(buildChannelAgentNode(sub, channels[0]))
    return nodes
  }

  // 多渠道：阶段内并行组（组内含 agent → 引擎串行推进，但任务清单分层展示）
  const parallel: WorkflowParallelNode = {
    id: `${sub.id}_channels`,
    type: 'parallel',
    title: `多渠道发布：${sub.title}`,
    children: channels.map((id) => buildChannelAgentNode(sub, id))
  }
  nodes.push(parallel)
  return nodes
}

/**
 * 将发布计划编译为可执行工作流定义。
 * 工作流 id 与计划 id 相同，保存/删除计划时可同步 upsert。
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
