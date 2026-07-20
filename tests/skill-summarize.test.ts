import { describe, expect, it } from 'vitest'
import {
  buildFallbackSkillFromTasks,
  parseSkillSummarizeJson
} from '../shared/skill-summarize'
import { querySuccessfulTasks } from '../shared/session-task-context'
import {
  queryCanSummarizeTasksToSkill,
  querySuccessfulTaskCount
} from '../shared/query-can-summarize-tasks'
import type { TaskItem } from '../shared/types'

describe('parseSkillSummarizeJson', () => {
  it('解析合法 LLM JSON 响应', () => {
    const raw = JSON.stringify({
      id: 'my-workflow',
      name: '工作流经验',
      description: '重复执行类似流程时使用',
      content: '# 工作流\n\n## 步骤\n1. 打开页面',
      examplesContent: '# 示例'
    })
    const result = parseSkillSummarizeJson(raw)
    expect(result).toMatchObject({
      id: 'my-workflow',
      name: '工作流经验',
      description: '重复执行类似流程时使用'
    })
    expect(result?.content).toContain('# 工作流')
  })

  it('缺少 content 时返回 null', () => {
    expect(parseSkillSummarizeJson('{"name":"x","id":"x"}')).toBeNull()
  })
})

describe('buildFallbackSkillFromTasks', () => {
  it('由步骤标题生成基础技能', () => {
    const skill = buildFallbackSkillFromTasks('小红书发布', ['登录', '上传图片', '发布'])
    expect(skill.name).toContain('小红书发布')
    expect(skill.content).toContain('1. 登录')
    expect(skill.content).toContain('3. 发布')
    expect(skill.id).toMatch(/^[a-z0-9-]+$/)
  })
})

describe('querySuccessfulTasks', () => {
  it('仅保留 done 状态', () => {
    const tasks: TaskItem[] = [
      { id: '1', title: 'A', status: 'done' },
      { id: '2', title: 'B', status: 'failed' },
      { id: '3', title: 'C', status: 'skipped' },
      { id: '4', title: 'D', status: 'pending' }
    ]
    expect(querySuccessfulTasks(tasks).map((t) => t.id)).toEqual(['1'])
  })
})

describe('queryCanSummarizeTasksToSkill', () => {
  const baseTasks: TaskItem[] = [
    { id: '1', title: 'A', status: 'done' },
    { id: '2', title: 'B', status: 'failed' }
  ]

  it('有 done 且无 running/pending 时可总结', () => {
    expect(queryCanSummarizeTasksToSkill(baseTasks, false, null)).toBe(true)
  })

  it('Agent 运行中不可总结', () => {
    expect(queryCanSummarizeTasksToSkill(baseTasks, true, null)).toBe(false)
  })

  it('仍有 pending 步骤不可总结', () => {
    const tasks = [...baseTasks, { id: '3', title: 'C', status: 'pending' as const }]
    expect(queryCanSummarizeTasksToSkill(tasks, false, null)).toBe(false)
  })

  it('无 done 步骤不可总结', () => {
    const tasks = [{ id: '1', title: 'A', status: 'failed' as const }]
    expect(queryCanSummarizeTasksToSkill(tasks, false, null)).toBe(false)
  })
})

describe('querySuccessfulTaskCount', () => {
  it('统计 done 数量', () => {
    const tasks: TaskItem[] = [
      { id: '1', title: 'A', status: 'done' },
      { id: '2', title: 'B', status: 'done' },
      { id: '3', title: 'C', status: 'failed' }
    ]
    expect(querySuccessfulTaskCount(tasks)).toBe(2)
  })
})
