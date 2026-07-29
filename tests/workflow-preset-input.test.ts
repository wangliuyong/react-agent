import { describe, expect, it } from 'vitest'
import {
  queryBuildWorkflowInitialContext,
  queryCanSkipInputWaitWithPreset,
  queryNormalizePresetUserInput,
  queryPresetUserInputFromContext,
  WORKFLOW_PRESET_USER_INPUT_KEY
} from '../shared/workflow-preset-input'
import { patchAgentOutputToContext } from '../electron/main/workflow/tool-result'

describe('workflow-preset-input', () => {
  it('空串与空白视为未配置', () => {
    expect(queryNormalizePresetUserInput('')).toBeUndefined()
    expect(queryNormalizePresetUserInput('  ')).toBeUndefined()
    expect(queryNormalizePresetUserInput('长江电力')).toBe('长江电力')
  })

  it('组装 initialContext 写入保留键', () => {
    expect(
      queryBuildWorkflowInitialContext({
        presetUserInput: ' 茅台 ',
        initialContext: { range: 'today' }
      })
    ).toEqual({
      range: 'today',
      [WORKFLOW_PRESET_USER_INPUT_KEY]: '茅台'
    })
  })

  it('无预设时不写入保留键', () => {
    expect(queryBuildWorkflowInitialContext({ initialContext: { a: 1 } })).toEqual({
      a: 1
    })
  })

  it('仅 text 类输入节点可跳过等待', () => {
    expect(queryCanSkipInputWaitWithPreset(['text'], '长江电力')).toBe(true)
    expect(queryCanSkipInputWaitWithPreset(undefined, '长江电力')).toBe(true)
    expect(queryCanSkipInputWaitWithPreset(['attachment'], '长江电力')).toBe(false)
    expect(queryCanSkipInputWaitWithPreset(['text'], '')).toBe(false)
  })

  it('预设写入 userInput 后可被 collect 下游使用', () => {
    const ctx = queryBuildWorkflowInitialContext({ presetUserInput: '长江电力' })
    const text = queryPresetUserInputFromContext(ctx)!
    const next = patchAgentOutputToContext(ctx, text, ['userInput'])
    expect(next.userInput).toBe('长江电力')
    expect(next[WORKFLOW_PRESET_USER_INPUT_KEY]).toBe('长江电力')
  })
})
