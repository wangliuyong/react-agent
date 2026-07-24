import { describe, expect, it } from 'vitest'
import { queryIsUiHiddenChatMessage } from '../shared/query-ui-hidden-message'

describe('queryIsUiHiddenChatMessage', () => {
  it('显式 hidden 标记应隐藏', () => {
    expect(
      queryIsUiHiddenChatMessage({
        role: 'assistant',
        content: '普通回复',
        hidden: true
      })
    ).toBe(true)
  })

  it('system 消息应隐藏', () => {
    expect(
      queryIsUiHiddenChatMessage({
        role: 'system',
        content: '系统提示'
      })
    ).toBe(true)
  })

  it('工作流步骤 user 消息应隐藏（兼容无 hidden 字段的旧数据）', () => {
    expect(
      queryIsUiHiddenChatMessage({
        role: 'user',
        content:
          '【工作流步骤】观望解读\n\n当前综合信号为观望。请解读下列分析报告。'
      })
    ).toBe(true)
  })

  it('条件分支 user 消息应隐藏', () => {
    expect(
      queryIsUiHiddenChatMessage({
        role: 'user',
        content: '【条件分支】信号分流\n\n根据上下文选择唯一分支。'
      })
    ).toBe(true)
  })

  it('普通用户消息与助手回复应展示', () => {
    expect(
      queryIsUiHiddenChatMessage({
        role: 'user',
        content: '帮我看看今天天气'
      })
    ).toBe(false)
    expect(
      queryIsUiHiddenChatMessage({
        role: 'assistant',
        content: '条件「信号分流」选择分支：观望'
      })
    ).toBe(false)
  })
})
