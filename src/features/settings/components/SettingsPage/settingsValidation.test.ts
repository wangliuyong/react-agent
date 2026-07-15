import { describe, expect, it } from 'vitest'
import { BASE_URL_RULES, MODEL_RULES } from './settingsValidation'

describe('设置页必填校验', () => {
  it('要求填写 Base URL', () => {
    expect(BASE_URL_RULES).toContainEqual({
      required: true,
      message: '请填写 Base URL'
    })
  })

  it('要求选择模型', () => {
    expect(MODEL_RULES).toContainEqual({
      required: true,
      message: '请选择模型'
    })
  })
})
