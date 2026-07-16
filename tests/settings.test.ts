import { describe, expect, it } from 'vitest'
import { normalizeSettings } from '../electron/main/store/settings'

describe('模型设置归一化', () => {
  it('保留显式选择的 DeepSeek 供应商', () => {
    expect(
      normalizeSettings({
        provider: 'deepseek',
        apiKey: 'sk-deepseek',
        baseUrl: 'https://api.deepseek.com',
        model: 'deepseek-chat'
      })
    ).toEqual(
      expect.objectContaining({
        provider: 'deepseek',
        apiKey: 'sk-deepseek',
        baseUrl: 'https://api.deepseek.com',
        model: 'deepseek-chat'
      })
    )
  })

  it('从旧版 DeepSeek Base URL 推断供应商', () => {
    expect(
      normalizeSettings({
        apiKey: 'legacy-key',
        baseUrl: 'https://api.deepseek.com/v1',
        model: 'deepseek-reasoner'
      }).provider
    ).toBe('deepseek')
  })

  it('缺省 launchAtLogin 时默认为 false', () => {
    expect(
      normalizeSettings({
        apiKey: 'k',
        baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
        model: 'qwen-plus'
      }).launchAtLogin
    ).toBe(false)
  })

  it('保留显式设置的 launchAtLogin', () => {
    expect(
      normalizeSettings({
        launchAtLogin: true,
        apiKey: 'k',
        baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
        model: 'qwen-plus'
      }).launchAtLogin
    ).toBe(true)
  })
})
