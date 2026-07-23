import { describe, expect, it } from 'vitest'
import {
  formatUserContinueMessage,
  queryIsUserCancelIntent,
  resolveUserContinue
} from '../electron/main/agent/choice-resolver'
import type { UserChoiceOption } from '../shared/types'

const choices: UserChoiceOption[] = [
  { id: 'plan_a', label: '方案 A：竖版动效' },
  { id: 'plan_b', label: '方案 B：横版幻灯' },
  { id: 'cancel', label: '取消' }
]

describe('resolveUserContinue', () => {
  it('显式 choiceId 直传', () => {
    expect(resolveUserContinue({ choiceId: 'plan_b' }, choices)).toEqual({
      userInput: undefined,
      choiceId: 'plan_b',
      choiceLabel: '方案 B：横版幻灯'
    })
  })

  it('文字匹配方案序号', () => {
    expect(resolveUserContinue({ userInput: '我选方案2' }, choices)).toEqual({
      userInput: '我选方案2',
      choiceId: 'plan_b',
      choiceLabel: '方案 B：横版幻灯'
    })
  })

  it('字母方案匹配', () => {
    expect(resolveUserContinue({ userInput: '选B' }, choices)).toEqual({
      userInput: '选B',
      choiceId: 'plan_b',
      choiceLabel: '方案 B：横版幻灯'
    })
  })

  it('label 子串唯一匹配', () => {
    expect(resolveUserContinue({ userInput: '确认渲染竖版' }, [
      { id: 'render', label: '确认渲染' },
      { id: 'preview', label: '先预览 Studio' }
    ])).toEqual({
      userInput: '确认渲染竖版',
      choiceId: 'render',
      choiceLabel: '确认渲染'
    })
  })

  it('无匹配时保留 userInput', () => {
    expect(resolveUserContinue({ userInput: '随便说说' }, choices)).toEqual({
      userInput: '随便说说'
    })
  })
})

describe('formatUserContinueMessage', () => {
  it('组合选择与补充说明', () => {
    expect(
      formatUserContinueMessage({
        choiceLabel: '方案 A',
        userInput: '色调偏暖'
      })
    ).toBe('【已选：方案 A】色调偏暖')
  })
})

describe('queryIsUserCancelIntent', () => {
  it('cancel choiceId', () => {
    expect(queryIsUserCancelIntent({ choiceId: 'cancel' })).toBe(true)
  })

  it('文字取消', () => {
    expect(queryIsUserCancelIntent({ userInput: '先不要了' })).toBe(true)
  })
})
