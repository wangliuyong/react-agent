import { describe, expect, it } from 'vitest'
import {
  queryProviderSwitchFormValues,
  querySettingsFormValues,
  querySettingsMainFormPatch,
  queryShouldSyncSettingsForm,
  queryModelApiSavePatch,
  queryInitialProviderDrafts
} from '../src/features/settings/components/SettingsPage/settingsFormSync'
import type { AppSettings } from '../shared/types'
import { DEFAULT_CONNECTION, DEFAULT_CONNECTION_ID, queryBuildDefaultConnections } from '../shared/types'
import { normalizeSettings } from '../electron/main/store/settings'

const SAVED_SETTINGS: AppSettings = {
  provider: 'deepseek',
  apiKey: 'sk-saved-key',
  baseUrl: 'https://api.deepseek.com',
  model: 'deepseek-reasoner',
  connections: [
    {
      ...DEFAULT_CONNECTION,
      id: DEFAULT_CONNECTION_ID,
      label: '默认（DeepSeek）',
      provider: 'deepseek',
      apiKey: 'sk-saved-key',
      baseUrl: 'https://api.deepseek.com',
      model: 'deepseek-reasoner'
    }
  ],
  defaultConnectionId: DEFAULT_CONNECTION_ID,
  roleModelMap: {},
  rolePromptOverrides: {},
  fullAccess: true,
  thinkingEnabled: false,
  maxTurns: 28,
  launchAtLogin: false,
  customProviders: []
}

describe('设置页模型与 API 回显同步', () => {
  it('hydrate 完成前不同步，避免把默认空配置写进表单', () => {
    expect(queryShouldSyncSettingsForm(false)).toBe(false)
  })

  it('hydrate 完成后同步完整字段，确保 API Key / Base URL / 模型可回显', () => {
    expect(queryShouldSyncSettingsForm(true)).toBe(true)
    expect(querySettingsFormValues(SAVED_SETTINGS)).toEqual(SAVED_SETTINGS)
  })

  it('主表单提交补丁不含 connections，避免覆盖多模型面板', () => {
    expect(
      querySettingsMainFormPatch({
        provider: 'dashscope',
        apiKey: 'sk-new',
        baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
        model: 'qwen-plus',
        fullAccess: false,
        maxTurns: 40,
        customProviders: []
      })
    ).toEqual({
      provider: 'dashscope',
      apiKey: 'sk-new',
      baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      model: 'qwen-plus',
      fullAccess: false,
      maxTurns: 40,
      customProviders: []
    })
  })
})

describe('切换模型供应商时的表单值', () => {
  it('切到其他供应商时从多模型连接恢复该供应商 API Key', () => {
    expect(
      queryProviderSwitchFormValues('dashscope', {
        ...SAVED_SETTINGS,
        provider: 'deepseek',
        connections: [
          ...SAVED_SETTINGS.connections,
          {
            ...DEFAULT_CONNECTION,
            id: 'conn-dashscope',
            label: '百炼',
            provider: 'dashscope',
            apiKey: 'sk-dashscope-from-conn',
            baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
            model: 'qwen-max',
            capabilities: ['chat']
          }
        ]
      })
    ).toEqual({
      provider: 'dashscope',
      apiKey: 'sk-dashscope-from-conn',
      baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      model: 'qwen-max'
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

describe('模型与 API 保存补丁', () => {
  it('切换当前选用供应商时写入顶层 provider，并同步各连接凭证', () => {
    const settings: AppSettings = {
      ...SAVED_SETTINGS,
      connections: queryBuildDefaultConnections({
        apiKey: 'sk-deepseek',
        provider: 'deepseek',
        baseUrl: 'https://api.deepseek.com'
      })
    }
    const drafts = queryInitialProviderDrafts(settings)
    drafts.dashscope = {
      apiKey: 'sk-dashscope',
      baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      model: 'qwen-plus'
    }

    const patch = queryModelApiSavePatch({
      activeProvider: 'dashscope',
      drafts,
      settings,
      maxTurns: 40,
      fullAccess: false,
      thinkingEnabled: false,
      customProviders: []
    })

    expect(patch.provider).toBe('dashscope')
    expect(patch.apiKey).toBe('sk-dashscope')
    expect(
      normalizeSettings({
        ...settings,
        ...patch
      }).provider
    ).toBe('dashscope')
  })
})
