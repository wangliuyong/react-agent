import {
  queryProviderOption,
  type AppSettings,
  type ModelProvider
} from '@shared/types'

/** 单个供应商下与密钥/地址相关的表单草稿 */
export type ProviderFormDraft = Pick<AppSettings, 'apiKey' | 'baseUrl' | 'model'>

/** 按供应商缓存的草稿（切换时暂存，避免来回切换丢失未保存输入） */
export type ProviderFormDraftMap = Partial<Record<ModelProvider, ProviderFormDraft>>

/**
 * 设置页表单回显策略：
 * - Form.useForm 实例会保留首次写入的值；
 * - hydrate 完成后必须显式 setFieldsValue，不能只依赖 initialValues / remount key。
 */
export function queryShouldSyncSettingsForm(loaded: boolean): boolean {
  return loaded
}

/** 生成写入表单的完整快照，避免部分字段遗漏导致回显不完整。 */
export function querySettingsFormValues(settings: AppSettings): AppSettings {
  return {
    provider: settings.provider,
    apiKey: settings.apiKey,
    baseUrl: settings.baseUrl,
    model: settings.model,
    fullAccess: settings.fullAccess,
    maxTurns: settings.maxTurns,
    launchAtLogin: settings.launchAtLogin
  }
}

/**
 * 切换模型供应商时的表单字段策略：
 * 1. 有该供应商草稿 → 优先恢复草稿（未保存输入不丢）
 * 2. 切回本机已保存供应商 → 恢复已配置的 API Key / Base URL / 模型
 * 3. 切到其他供应商 → 用默认地址/模型，并清空密钥，防止串用
 */
export function queryProviderSwitchFormValues(
  nextProvider: ModelProvider,
  savedSettings: AppSettings,
  drafts?: ProviderFormDraftMap
): Pick<AppSettings, 'provider' | 'apiKey' | 'baseUrl' | 'model'> {
  const draft = drafts?.[nextProvider]
  if (draft) {
    return {
      provider: nextProvider,
      apiKey: draft.apiKey,
      baseUrl: draft.baseUrl,
      model: draft.model
    }
  }

  if (nextProvider === savedSettings.provider) {
    return {
      provider: nextProvider,
      apiKey: savedSettings.apiKey,
      baseUrl: savedSettings.baseUrl,
      model: savedSettings.model
    }
  }

  const nextMeta = queryProviderOption(nextProvider)
  return {
    provider: nextProvider,
    apiKey: '',
    baseUrl: nextMeta.defaultBaseUrl,
    model: nextMeta.defaultModel
  }
}
