import { describe, expect, it } from 'vitest'
import { parseChatExecutionCommand } from '../src/features/chat/utils/parseChatExecutionCommand'

describe('parseChatExecutionCommand', () => {
  it('解析执行定时任务指令', () => {
    expect(parseChatExecutionCommand('执行定时任务每日早报')).toEqual({
      kind: 'schedule',
      name: '每日早报'
    })
    expect(parseChatExecutionCommand('执行定时任务：周一热点调研')).toEqual({
      kind: 'schedule',
      name: '周一热点调研'
    })
    expect(parseChatExecutionCommand('运行定时任务 飞书富文本推送')).toEqual({
      kind: 'schedule',
      name: '飞书富文本推送'
    })
  })

  it('解析执行发布任务指令', () => {
    expect(parseChatExecutionCommand('执行任务多渠道内容发布')).toEqual({
      kind: 'publish',
      name: '多渠道内容发布'
    })
    expect(parseChatExecutionCommand('运行任务：飞书富文本推送')).toEqual({
      kind: 'publish',
      name: '飞书富文本推送'
    })
  })

  it('解析执行流程指令', () => {
    expect(parseChatExecutionCommand('执行流程内容审核')).toEqual({
      kind: 'workflow',
      name: '内容审核'
    })
    expect(parseChatExecutionCommand('运行流程: 未命名流程')).toEqual({
      kind: 'workflow',
      name: '未命名流程'
    })
  })

  it('定时任务前缀优先于任务前缀', () => {
    expect(parseChatExecutionCommand('执行定时任务测试')).toEqual({
      kind: 'schedule',
      name: '测试'
    })
  })

  it('非指令消息返回 null', () => {
    expect(parseChatExecutionCommand('帮我写一篇文章')).toBeNull()
    expect(parseChatExecutionCommand('执行')).toBeNull()
    expect(parseChatExecutionCommand('执行任务')).toBeNull()
    expect(parseChatExecutionCommand('  执行流程  ')).toBeNull()
  })
})
