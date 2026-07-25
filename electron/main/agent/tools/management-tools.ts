import { randomUUID } from 'crypto'
import type {
  AgentRuleUpsertInput,
  PublishPlan,
  PublishPlanKind,
  PublishSubTask,
  ScheduledTask,
  ScheduleActionType,
  ScheduleRepeat
} from '../../../../shared/types'
import { normalizePublishPlan } from '../../../../shared/publish-normalize'
import { normalizeScheduleTimesOfDay } from '../../../../shared/schedule-utils'
import { normalizePublishSubTaskChannels } from '../../../../shared/publish-channels'
import { queryRunInBackground } from '../../../../shared/schedule-utils'
import { queryAgentRules } from '../../store/rules'
import { queryPublishPlan, queryPublishPlans } from '../../store/plans'
import { queryScheduledTask, queryScheduledTasks } from '../../store/schedules'
import { queryWorkflow } from '../../store/workflows'
import { validateRuleId } from '../../store/rules'
import {
  postAgentRuleAndNotify,
  postPublishPlanAndSync,
  postScheduledTaskAndNotify
} from '../../store/resource-writes'
import type { AgentTool } from './types'

/** 与渲染层 slugifyRuleId 一致，供 Agent 未传 id 时生成 */
function slugifyRuleId(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_')
    .slice(0, 64)
  return slug || `rule_${Date.now()}`
}

const HH_MM = /^([01]?\d|2[0-3]):[0-5]\d$/

function parseStringArray(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return raw.map((item) => String(item).trim()).filter(Boolean)
}

function formatNextRun(task: ScheduledTask): string {
  if (task.nextRunAt == null) return '未安排'
  return new Date(task.nextRunAt).toLocaleString('zh-CN')
}

function validateScheduledTaskInput(args: Record<string, unknown>): string | null {
  const title = String(args.title ?? '').trim()
  if (!title) return '缺少 title（任务名称）'

  const repeat = String(args.repeat ?? '').trim() as ScheduleRepeat
  if (!['once', 'daily', 'weekly'].includes(repeat)) {
    return 'repeat 须为 once、daily 或 weekly'
  }

  const actionType = String(args.actionType ?? '').trim() as ScheduleActionType
  if (!['publish_plan', 'custom_prompt', 'workflow'].includes(actionType)) {
    return 'actionType 须为 publish_plan、custom_prompt 或 workflow'
  }

  if (repeat === 'once') {
    const runAt = args.runAt
    if (runAt == null || !Number.isFinite(Number(runAt))) {
      return 'repeat 为 once 时必须提供 runAt（Unix 毫秒时间戳）'
    }
  } else {
    const times = parseStringArray(args.timesOfDay)
    if (times.length === 0) {
      return 'daily/weekly 必须提供 timesOfDay（HH:mm 数组，如 ["09:00"]）'
    }
    for (const t of times) {
      if (!HH_MM.test(t)) return `timesOfDay 格式无效：${t}，应为 HH:mm`
    }
    if (repeat === 'weekly') {
      const weekday = args.weekday
      if (weekday == null || !Number.isFinite(Number(weekday))) {
        return 'weekly 必须提供 weekday（0=周日 … 6=周六）'
      }
      const w = Number(weekday)
      if (w < 0 || w > 6) return 'weekday 须在 0～6 之间'
    }
  }

  if (actionType === 'publish_plan') {
    const planId = String(args.publishPlanId ?? '').trim()
    if (!planId) return 'actionType 为 publish_plan 时必须提供 publishPlanId'
    if (!queryPublishPlan(planId)) {
      return `发布计划不存在：${planId}，请先 query_publish_plans 或 post_publish_plan 创建`
    }
  }

  if (actionType === 'workflow') {
    const wfId = String(args.workflowId ?? '').trim()
    if (!wfId) return 'actionType 为 workflow 时必须提供 workflowId'
    if (!queryWorkflow(wfId)) {
      return `工作流不存在：${wfId}`
    }
  }

  if (actionType === 'custom_prompt') {
    const prompt = String(args.customPrompt ?? '').trim()
    if (prompt.length < 10) return 'custom_prompt 类型时 customPrompt 至少 10 个字符'
  }

  return null
}

function buildScheduledTaskFromArgs(args: Record<string, unknown>): ScheduledTask {
  const now = Date.now()
  const id = String(args.id ?? '').trim() || randomUUID()
  const existing = queryScheduledTask(id)
  const repeat = String(args.repeat).trim() as ScheduleRepeat
  const timesOfDay = normalizeScheduleTimesOfDay(
    repeat === 'once'
      ? existing
        ? existing.timesOfDay
        : ['09:00']
      : parseStringArray(args.timesOfDay)
  )
  const actionType = String(args.actionType).trim() as ScheduleActionType

  const enabled =
    args.enabled !== undefined ? Boolean(args.enabled) : (existing?.enabled ?? false)

  const base: ScheduledTask = existing ?? {
    id,
    title: '',
    description: '',
    enabled: false,
    repeat: 'daily',
    timeOfDay: '09:00',
    timesOfDay: ['09:00'],
    weekday: 1,
    actionType: 'publish_plan',
    runInBackground: true,
    runCount: 0,
    createdAt: now,
    updatedAt: now
  }

  return {
    ...base,
    id,
    title: String(args.title).trim(),
    description:
      args.description != null ? String(args.description).trim() : base.description,
    enabled,
    repeat,
    timeOfDay: timesOfDay[0],
    timesOfDay,
    weekday:
      repeat === 'weekly'
        ? Number(args.weekday)
        : repeat === 'once'
          ? base.weekday
          : base.weekday,
    runAt: repeat === 'once' ? Number(args.runAt) : base.runAt,
    actionType,
    publishPlanId:
      actionType === 'publish_plan' ? String(args.publishPlanId).trim() : undefined,
    workflowId: actionType === 'workflow' ? String(args.workflowId).trim() : undefined,
    customPrompt:
      actionType === 'custom_prompt' ? String(args.customPrompt).trim() : undefined,
    notifyChannels: parseStringArray(args.notifyChannels),
    runInBackground:
      args.runInBackground !== undefined
        ? Boolean(args.runInBackground)
        : queryRunInBackground(base),
    updatedAt: now
  }
}

function parseSubTasksFromArgs(raw: unknown): PublishSubTask[] | string {
  if (!Array.isArray(raw) || raw.length === 0) {
    return '至少提供一个 subTasks 子任务（含 title、channels、contentPrompt）'
  }
  const result: PublishSubTask[] = []
  for (let i = 0; i < raw.length; i++) {
    const item = raw[i]
    if (!item || typeof item !== 'object') return `subTasks[${i}] 格式无效`
    const row = item as Record<string, unknown>
    const title = String(row.title ?? '').trim()
    const contentPrompt = String(row.contentPrompt ?? '').trim()
    const channels = normalizePublishSubTaskChannels(
      parseStringArray(row.channels).length > 0 ? parseStringArray(row.channels) : ['xhs']
    )
    if (!title) return `subTasks[${i}].title 不能为空`
    if (!contentPrompt) return `subTasks[${i}].contentPrompt 不能为空`
    result.push({
      id: String(row.id ?? '').trim() || randomUUID(),
      title,
      channels,
      notifyChannels: parseStringArray(row.notifyChannels),
      topic: String(row.topic ?? '').trim(),
      autoPublish: row.autoPublish !== undefined ? Boolean(row.autoPublish) : true,
      contentPrompt
    })
  }
  return result
}

export const queryScheduledTasksTool: AgentTool = {
  name: 'query_scheduled_tasks',
  description:
    '列出已保存的定时任务摘要（id、名称、是否启用、下次执行、动作类型）。创建或关联前可先查询。',
  permission: 'safe',
  parameters: { type: 'object', properties: {} },
  async execute() {
    const tasks = queryScheduledTasks()
    if (tasks.length === 0) return '当前没有定时任务。'
    const lines = tasks.map(
      (t) =>
        `- id=${t.id} | ${t.title} | enabled=${t.enabled} | action=${t.actionType} | 下次=${formatNextRun(t)}`
    )
    return `共 ${tasks.length} 个定时任务：\n${lines.join('\n')}`
  }
}

export const postScheduledTaskTool: AgentTool = {
  name: 'post_scheduled_task',
  description:
    '创建或更新定时任务并保存到本地。默认 enabled=false，需用户确认后再改为 true 才会被调度。' +
    'publish_plan 需有效 publishPlanId；workflow 需 workflowId；custom_prompt 需 customPrompt（≥10字）。',
  permission: 'sensitive',
  parameters: {
    type: 'object',
    properties: {
      id: { type: 'string', description: '可选，传入则更新已有任务' },
      title: { type: 'string', description: '任务名称' },
      description: { type: 'string', description: '备注说明' },
      repeat: { type: 'string', enum: ['once', 'daily', 'weekly'] },
      timesOfDay: {
        type: 'array',
        items: { type: 'string' },
        description: 'daily/weekly 执行时刻 HH:mm'
      },
      weekday: { type: 'number', description: 'weekly 时 0=周日 … 6=周六' },
      runAt: { type: 'number', description: 'once 时 Unix 毫秒时间戳' },
      actionType: {
        type: 'string',
        enum: ['publish_plan', 'custom_prompt', 'workflow']
      },
      publishPlanId: { type: 'string' },
      workflowId: { type: 'string' },
      customPrompt: { type: 'string' },
      notifyChannels: { type: 'array', items: { type: 'string' } },
      runInBackground: { type: 'boolean', description: '默认 true' },
      enabled: { type: 'boolean', description: '默认 false，避免误触发' }
    },
    required: ['title', 'repeat', 'actionType']
  },
  async execute(args) {
    const err = validateScheduledTaskInput(args as Record<string, unknown>)
    if (err) return err
    try {
      const task = buildScheduledTaskFromArgs(args as Record<string, unknown>)
      const saved = postScheduledTaskAndNotify(task)
      return (
        `定时任务已保存：id=${saved.id}，标题「${saved.title}」，enabled=${saved.enabled}，` +
        `下次执行=${formatNextRun(saved)}。` +
        (saved.enabled ? '' : ' 当前未启用，用户确认后可将 enabled 设为 true。')
      )
    } catch (e) {
      return `保存失败：${e instanceof Error ? e.message : String(e)}`
    }
  }
}

export const queryPublishPlansTool: AgentTool = {
  name: 'query_publish_plans',
  description: '列出已保存的发布计划摘要（id、标题、类型、子任务数）。',
  permission: 'safe',
  parameters: { type: 'object', properties: {} },
  async execute() {
    const plans = queryPublishPlans()
    if (plans.length === 0) return '当前没有发布计划。'
    const lines = plans.map(
      (p) =>
        `- id=${p.id} | ${p.title} | kind=${p.kind} | 子任务=${p.subTasks.length} | 流程数=${p.workflowIds.length}`
    )
    return `共 ${plans.length} 个发布计划：\n${lines.join('\n')}`
  }
}

export const postPublishPlanTool: AgentTool = {
  name: 'post_publish_plan',
  description:
    '创建或更新发布计划（kind 默认 normal）。normal 类型至少 1 个子任务，每子任务需 title、channels、contentPrompt。' +
    '保存后会同步镜像工作流，可供定时任务 publish_plan 引用。',
  permission: 'sensitive',
  parameters: {
    type: 'object',
    properties: {
      id: { type: 'string', description: '可选，更新已有计划' },
      title: { type: 'string' },
      description: { type: 'string' },
      kind: { type: 'string', enum: ['normal', 'workflow'] },
      workflowIds: { type: 'array', items: { type: 'string' }, description: 'kind=workflow 时必填' },
      notifyChannels: { type: 'array', items: { type: 'string' } },
      subTasks: {
        type: 'array',
        description: 'normal 类型子任务列表',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            channels: { type: 'array', items: { type: 'string' } },
            contentPrompt: { type: 'string' },
            topic: { type: 'string' },
            autoPublish: { type: 'boolean' },
            notifyChannels: { type: 'array', items: { type: 'string' } }
          }
        }
      }
    },
    required: ['title']
  },
  async execute(args) {
    const title = String(args.title ?? '').trim()
    if (!title) return '缺少 title'
    const now = Date.now()
    const id = String(args.id ?? '').trim() || randomUUID()
    const existing = queryPublishPlan(id)
    const kind = (String(args.kind ?? existing?.kind ?? 'normal').trim() ||
      'normal') as PublishPlanKind

    let subTasks: PublishSubTask[]
    if (kind === 'normal') {
      const parsed = parseSubTasksFromArgs(args.subTasks ?? existing?.subTasks)
      if (typeof parsed === 'string') return parsed
      subTasks = parsed
    } else {
      const workflowIds = parseStringArray(args.workflowIds ?? existing?.workflowIds)
      if (workflowIds.length === 0) {
        return 'kind 为 workflow 时 workflowIds 至少一项'
      }
      subTasks = existing?.subTasks ?? []
      const plan: PublishPlan = normalizePublishPlan({
        id,
        title,
        description:
          args.description != null
            ? String(args.description).trim()
            : (existing?.description ?? ''),
        kind: 'workflow',
        workflowIds,
        workflowId: workflowIds[0],
        notifyChannels: parseStringArray(args.notifyChannels ?? existing?.notifyChannels),
        subTasks,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now
      })
      try {
        const saved = postPublishPlanAndSync(plan)
        return `发布计划已保存：id=${saved.id}，标题「${saved.title}」，类型=workflow，关联流程 ${workflowIds.length} 个。`
      } catch (e) {
        return `保存失败：${e instanceof Error ? e.message : String(e)}`
      }
    }

    const plan: PublishPlan = normalizePublishPlan({
      id,
      title,
      description:
        args.description != null
          ? String(args.description).trim()
          : (existing?.description ?? ''),
      kind: 'normal',
      workflowIds: [],
      notifyChannels: parseStringArray(args.notifyChannels ?? existing?.notifyChannels),
      subTasks,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now
    })

    try {
      const saved = postPublishPlanAndSync(plan)
      return (
        `发布计划已保存：id=${saved.id}，标题「${saved.title}」，子任务 ${saved.subTasks.length} 个。` +
        ' 可在定时任务中设置 actionType=publish_plan 并引用此 id。'
      )
    } catch (e) {
      return `保存失败：${e instanceof Error ? e.message : String(e)}`
    }
  }
}

export const queryAgentRulesTool: AgentTool = {
  name: 'query_agent_rules',
  description: '列出已保存的 Agent 用户规则摘要（id、名称、是否启用）。',
  permission: 'safe',
  parameters: { type: 'object', properties: {} },
  async execute() {
    const rules = queryAgentRules()
    if (rules.length === 0) return '当前没有用户规则。'
    const lines = rules.map(
      (r) => `- id=${r.id} | ${r.name} | enabled=${r.enabled}`
    )
    return `共 ${rules.length} 条规则：\n${lines.join('\n')}`
  }
}

export const postAgentRuleTool: AgentTool = {
  name: 'post_agent_rule',
  description:
    '新增或更新 Agent 用户规则。必填 name、content；id 可省略（由名称生成）。' +
    '保存后从下一轮对话起注入 system prompt。',
  permission: 'sensitive',
  parameters: {
    type: 'object',
    properties: {
      id: { type: 'string', description: '小写字母数字连字符下划线，1～64 字符' },
      name: { type: 'string' },
      description: { type: 'string' },
      content: { type: 'string', description: '规则正文，Markdown' },
      enabled: { type: 'boolean', description: '默认 true' }
    },
    required: ['name', 'content']
  },
  async execute(args) {
    const name = String(args.name ?? '').trim()
    const content = String(args.content ?? '').trim()
    if (!name) return '缺少 name'
    if (!content) return '缺少 content'

    let id = String(args.id ?? '').trim()
    if (!id) id = slugifyRuleId(name)
    try {
      validateRuleId(id)
    } catch (e) {
      return e instanceof Error ? e.message : '规则 id 格式无效'
    }

    const input: AgentRuleUpsertInput = {
      id,
      name,
      description: args.description != null ? String(args.description).trim() : '',
      content,
      enabled: args.enabled !== undefined ? Boolean(args.enabled) : true
    }

    try {
      const saved = postAgentRuleAndNotify(input)
      return (
        `规则已保存：id=${saved.id}，名称「${saved.name}」，enabled=${saved.enabled}。` +
        ' 从下一轮对话起生效。'
      )
    } catch (e) {
      return `保存失败：${e instanceof Error ? e.message : String(e)}`
    }
  }
}

export const managementTools: AgentTool[] = [
  queryScheduledTasksTool,
  postScheduledTaskTool,
  queryPublishPlansTool,
  postPublishPlanTool,
  queryAgentRulesTool,
  postAgentRuleTool
]
