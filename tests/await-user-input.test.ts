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
})
