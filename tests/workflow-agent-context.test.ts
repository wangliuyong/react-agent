import { describe, expect, it } from 'vitest'
import {
  patchAgentOutputToContext,
  queryAgentStepOutput
} from '../electron/main/workflow/tool-result'

describe('queryAgentStepOutput', () => {
  it('只取本步新增消息中的最后一条 assistant 正文', () => {
    const messages = [
      { role: 'user', content: '步骤1' },
      { role: 'assistant', content: '旧回复' },
      { role: 'user', content: '步骤2' },
      { role: 'tool', content: '工具结果' },
      { role: 'assistant', content: '  最终简报  ' }
    ]
    expect(queryAgentStepOutput(messages, 2)).toBe('最终简报')
  })

  it('本步无 assistant 时返回空串', () => {
    const messages = [
      { role: 'user', content: '步骤' },
      { role: 'tool', content: '仅工具' }
    ]
    expect(queryAgentStepOutput(messages, 0)).toBe('')
  })
})

describe('patchAgentOutputToContext', () => {
  it('未配置 outputKeys 时默认写入 summary', () => {
    expect(patchAgentOutputToContext({}, '简报正文')).toEqual({ summary: '简报正文' })
  })

  it('支持自定义 outputKeys', () => {
    expect(
      patchAgentOutputToContext({ x: 1 }, '正文', ['brief', 'summary'])
    ).toEqual({ x: 1, brief: '正文', summary: '正文' })
  })

  it('产出为空时不修改 context', () => {
    expect(patchAgentOutputToContext({ a: 1 }, '')).toEqual({ a: 1 })
  })
})
