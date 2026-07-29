import { describe, expect, it } from 'vitest'
import { patchAgentOutputToContext } from '../electron/main/workflow/tool-result'

describe('确认节点用户输入写入 context', () => {
  it('默认写入 userInput 键', () => {
    expect(patchAgentOutputToContext({}, '请用 B 方案', ['userInput'])).toEqual({
      userInput: '请用 B 方案'
    })
  })

  it('支持自定义 outputKeys', () => {
    expect(
      patchAgentOutputToContext({ x: 1 }, '补充说明', ['feedback', 'userInput'])
    ).toEqual({
      x: 1,
      feedback: '补充说明',
      userInput: '补充说明'
    })
  })

  it('空输入不修改 context', () => {
    expect(patchAgentOutputToContext({ a: 1 }, '')).toEqual({ a: 1 })
  })

  it('continue 结果可直接作为 userInput，无需再追加消息', () => {
    // 引擎侧：text 取自 continueResult.userInput；postGraphContinue 已写 user 气泡
    const continueUserInput = '长江电力'
    const ctx = patchAgentOutputToContext({}, continueUserInput, ['userInput'])
    expect(ctx.userInput).toBe('长江电力')
  })
})
