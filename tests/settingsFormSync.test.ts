import { describe, expect, it } from 'vitest'
import {
  queryProviderSwitchFormValues,
  querySettingsFormValues,
  queryShouldSyncSettingsForm
} from '../src/features/settings/components/SettingsPage/settingsFormSync'
import type { AppSettings } from '../shared/types'

const SAVED_SETTINGS: AppSettings = {
  provider: 'deepseek',
  apiKey: 'sk-saved-key',
  baseUrl: 'https://api.deepseek.com',
  model: 'deepseek-reasoner',
  fullAccess: true,
  maxTurns: 28
}

describe('设置页模型与 API 回显同步', () => {
  it('hydrate 完成前不同步，避免把默认空配置写进表单', () => {
    expect(queryShouldSyncSettingsForm(false)).toBe(false)
  })

  it('hydrate 完成后同步完整字段，确保 API Key / Base URL / 模型可回显', () => {
    expect(queryShouldSyncSettingsForm(true)).toBe(true)
    expect(querySettingsFormValues(SAVED_SETTINGS)).toEqual(SAVED_SETTINGS)
  })
})

describe('切换模型供应商时的表单值', () => {
  it('切到其他供应商时使用默认地址/模型，并清空密钥避免串用', () => {
    expect(queryProviderSwitchFormValues('dashscope', SAVED_SETTINGS)).toEqual({
      provider: 'dashscope',
      apiKey: '',
      baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      model: 'qwen-plus'
    })
  })

  it('切回本机已保存的供应商时恢复 API Key / Base URL / 模型', () => {
    expect(queryProviderSwitchFormValues('deepseek', SAVED_SETTINGS)).toEqual({
      provider: 'deepseek',
      apiKey: 'sk-saved-key',
      baseUrl: 'https://api.deepseek.com',
      model: 'deepseek-reasoner'
    })
  })

  it('优先使用该供应商的草稿，避免来回切换丢失未保存输入', () => {
    expect(
      queryProviderSwitchFormValues('dashscope', SAVED_SETTINGS, {
        dashscope: {
          apiKey: 'sk-draft-dashscope',
          baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
          model: 'qwen-max'
        }
      })
    ).toEqual({
      provider: 'dashscope',
      apiKey: 'sk-draft-dashscope',
      baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      model: 'qwen-max'
    })
  })
})
