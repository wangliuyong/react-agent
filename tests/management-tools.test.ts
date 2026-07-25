import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { AgentTool } from '../electron/main/agent/tools/types'

const storeMocks = vi.hoisted(() => ({
  scheduled: [] as Array<{ id: string; title: string; enabled: boolean; nextRunAt?: number; actionType: string }>,
  plans: [] as Array<{ id: string; title: string; kind: string; subTasks: unknown[]; workflowIds: string[] }>,
  rules: [] as Array<{ id: string; name: string; enabled: boolean }>,
  postScheduled: vi.fn(),
  postPlan: vi.fn(),
  postRule: vi.fn(),
  syncWorkflow: vi.fn(),
  emitSchedule: vi.fn(),
  emitPlans: vi.fn(),
  emitRules: vi.fn(),
  queryPlan: vi.fn(),
  queryWorkflow: vi.fn(),
  queryScheduledTask: vi.fn()
}))

vi.mock('../electron/main/store/schedules', () => ({
  queryScheduledTasks: () => storeMocks.scheduled,
  queryScheduledTask: (id: string) => storeMocks.queryScheduledTask(id)
}))

vi.mock('../electron/main/store/plans', () => ({
  queryPublishPlans: () => storeMocks.plans,
  queryPublishPlan: (id: string) => storeMocks.queryPlan(id)
}))

vi.mock('../electron/main/store/workflows', () => ({
  queryWorkflow: (id: string) => storeMocks.queryWorkflow(id)
}))

vi.mock('../electron/main/store/rules', () => ({
  queryAgentRules: () => storeMocks.rules,
  validateRuleId: (id: string) => {
    if (!/^[a-z0-9_-]{1,64}$/.test(id)) throw new Error('规则 id 无效')
  }
}))

vi.mock('../electron/main/store/resource-writes', () => ({
  postScheduledTaskAndNotify: (task: unknown) => storeMocks.postScheduled(task),
  postPublishPlanAndSync: (plan: unknown) => storeMocks.postPlan(plan),
  postAgentRuleAndNotify: (input: unknown) => storeMocks.postRule(input)
}))

import { managementTools } from '../electron/main/agent/tools/management-tools'

function toolByName(name: string): AgentTool {
  const t = managementTools.find((x) => x.name === name)
  if (!t) throw new Error(`missing tool ${name}`)
  return t
}

const ctx = {} as Parameters<AgentTool['execute']>[1]

describe('management tools', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    storeMocks.scheduled = []
    storeMocks.plans = []
    storeMocks.rules = []
    storeMocks.queryPlan.mockReturnValue(null)
    storeMocks.queryWorkflow.mockReturnValue(null)
    storeMocks.queryScheduledTask.mockReturnValue(null)
    storeMocks.postScheduled.mockImplementation((task) => ({
      ...(task as object),
      nextRunAt: Date.now() + 3600_000
    }))
    storeMocks.postPlan.mockImplementation((plan) => plan)
    storeMocks.postRule.mockImplementation((input) => ({
      ...(input as object),
      updatedAt: Date.now(),
      createdAt: Date.now()
    }))
  })

  it('post_scheduled_task 缺少 title 时返回错误', async () => {
    const result = await toolByName('post_scheduled_task').execute(
      { repeat: 'daily', actionType: 'custom_prompt', customPrompt: '1234567890', timesOfDay: ['09:00'] },
      ctx
    )
    expect(result).toContain('缺少 title')
    expect(storeMocks.postScheduled).not.toHaveBeenCalled()
  })

  it('post_scheduled_task custom_prompt 过短时报错', async () => {
    const result = await toolByName('post_scheduled_task').execute(
      {
        title: '测试',
        repeat: 'daily',
        actionType: 'custom_prompt',
        customPrompt: '短',
        timesOfDay: ['09:00']
      },
      ctx
    )
    expect(result).toContain('至少 10')
  })

  it('post_scheduled_task 校验通过时落盘', async () => {
    const result = await toolByName('post_scheduled_task').execute(
      {
        title: '早报',
        repeat: 'daily',
        actionType: 'custom_prompt',
        customPrompt: '每天搜索 AI 热点并摘要',
        timesOfDay: ['09:00']
      },
      ctx
    )
    expect(storeMocks.postScheduled).toHaveBeenCalledOnce()
    expect(result).toContain('定时任务已保存')
  })

  it('post_publish_plan 缺少子任务时报错', async () => {
    const result = await toolByName('post_publish_plan').execute({ title: '计划A' }, ctx)
    expect(result).toContain('subTasks')
    expect(storeMocks.postPlan).not.toHaveBeenCalled()
  })

  it('post_publish_plan 含子任务时调用 postPublishPlanAndSync', async () => {
    const result = await toolByName('post_publish_plan').execute(
      {
        title: '热点计划',
        subTasks: [
          {
            title: '小红书',
            channels: ['xhs'],
            contentPrompt: '根据热点写笔记'
          }
        ]
      },
      ctx
    )
    expect(storeMocks.postPlan).toHaveBeenCalledOnce()
    expect(result).toContain('发布计划已保存')
  })

  it('post_agent_rule 缺少 content 时报错', async () => {
    const result = await toolByName('post_agent_rule').execute({ name: '风格' }, ctx)
    expect(result).toContain('缺少 content')
  })

  it('post_agent_rule 成功保存', async () => {
    const result = await toolByName('post_agent_rule').execute(
      { name: '回复风格', content: '回答须简洁分点' },
      ctx
    )
    expect(storeMocks.postRule).toHaveBeenCalledOnce()
    expect(result).toContain('规则已保存')
    expect(result).toContain('下一轮')
  })

  it('query 工具在无数据时返回提示', async () => {
    expect(await toolByName('query_scheduled_tasks').execute({}, ctx)).toContain('没有')
    expect(await toolByName('query_publish_plans').execute({}, ctx)).toContain('没有')
    expect(await toolByName('query_agent_rules').execute({}, ctx)).toContain('没有')
  })
})
