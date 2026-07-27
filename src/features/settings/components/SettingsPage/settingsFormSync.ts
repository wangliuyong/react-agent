import {
  queryAlignConnectionsToActiveProvider,
  queryAllProviderOptions,
  queryProviderCredentialsFromSettings,
  queryProviderOption,
  type AppSettings,
  type CustomModelProvider,
  type ModelConnection,
  type ModelProvider,
  type ProviderModelCatalog
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
  // 为什么：不把 connections 写入主表单，避免保存时用旧 connections 覆盖多模型面板
  return {
    provider: settings.provider,
    apiKey: settings.apiKey,
    baseUrl: settings.baseUrl,
    model: settings.model,
    connections: settings.connections ?? [],
    defaultConnectionId: settings.defaultConnectionId,
    roleModelMap: settings.roleModelMap ?? {},
    rolePromptOverrides: settings.rolePromptOverrides ?? {},
    roleToolWhitelistOverrides: settings.roleToolWhitelistOverrides ?? {},
    customAgentRoles: settings.customAgentRoles ?? [],
    fullAccess: settings.fullAccess,
    thinkingEnabled: settings.thinkingEnabled,
    maxTurns: settings.maxTurns,
    launchAtLogin: settings.launchAtLogin,
    customProviders: settings.customProviders ?? [],
    providerModelCatalog: settings.providerModelCatalog ?? {}
  }
}

/** 主表单提交时只提交默认连接相关字段 */
export function querySettingsMainFormPatch(
  values: Pick<
    AppSettings,
    | 'provider'
    | 'apiKey'
    | 'baseUrl'
    | 'model'
    | 'fullAccess'
    | 'maxTurns'
    | 'customProviders'
  >
): Partial<AppSettings> {
  return {
    provider: values.provider,
    apiKey: values.apiKey,
    baseUrl: values.baseUrl,
    model: values.model,
    fullAccess: values.fullAccess,
    maxTurns: values.maxTurns,
    customProviders: values.customProviders ?? []
  }
}

/**
 * 切换模型供应商时的表单字段策略：
 * 1. 有该供应商草稿 → 优先恢复草稿（未保存输入不丢）
 * 2. 切回本机已保存供应商 → 恢复已配置的 API Key / Base URL / 模型
 * 3. 切到其他供应商 → 从多模型连接或默认地址恢复该供应商凭证，避免串用
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

  const creds = queryProviderCredentialsFromSettings(savedSettings, nextProvider)
  return {
    provider: nextProvider,
    apiKey: creds.apiKey,
    baseUrl: creds.baseUrl,
    model: creds.model
  }
}

/** 从已保存设置初始化各供应商凭证草稿 */
export function queryInitialProviderDrafts(settings: AppSettings): ProviderFormDraftMap {
  const drafts: ProviderFormDraftMap = {}
  const customProviders = settings.customProviders ?? []
  for (const option of queryAllProviderOptions(customProviders)) {
    drafts[option.value] = queryProviderCredentialsFromSettings(settings, option.value)
  }
  return drafts
}

type ProviderCredentialDefaults = Pick<
  ReturnType<typeof queryProviderOption>,
  'defaultBaseUrl' | 'defaultModel'
>

/**
 * 合并供应商草稿与本机已保存凭证。
 * 为什么：仅改运行参数点保存时，草稿里可能仍是空 Key，不能覆盖磁盘上已有密钥。
 */
export function queryMergeProviderDraftWithSaved(
  draft: ProviderFormDraft | undefined,
  saved: ProviderFormDraft,
  defaults: ProviderCredentialDefaults
): ProviderFormDraft {
  const base = draft ?? saved
  return {
    apiKey: base.apiKey.trim() ? base.apiKey : saved.apiKey,
    baseUrl: (base.baseUrl || saved.baseUrl || defaults.defaultBaseUrl).trim(),
    model: (base.model || saved.model || defaults.defaultModel).trim()
  }
}

/** 为仅有凭证、尚无业务连接行的供应商补一条连接，供多供应商 Key 持久化 */
function queryProviderCredentialConnectionId(provider: ModelProvider): string {
  return `cred-${provider}`
}

/**
 * 将各供应商草稿同步回多模型连接中同 provider 的连接行；
 * 若该供应商在 connections 中不存在，则追加一条仅用于保存凭证的连接。
 */
export function queryApplyProviderDraftsToConnections(
  connections: ModelConnection[],
  drafts: ProviderFormDraftMap,
  customProviders: CustomModelProvider[]
): ModelConnection[] {
  let next = connections.map((conn) => {
    const draft = drafts[conn.provider]
    if (!draft) return conn
    const meta = queryProviderOption(conn.provider, customProviders)
    const merged = queryMergeProviderDraftWithSaved(
      draft,
      {
        apiKey: conn.apiKey,
        baseUrl: conn.baseUrl,
        model: conn.model
      },
      meta
    )
    return {
      ...conn,
      apiKey: merged.apiKey,
      baseUrl: merged.baseUrl || meta.defaultBaseUrl,
      model: merged.model || meta.defaultModel
    }
  })

  for (const option of queryAllProviderOptions(customProviders)) {
    const draft = drafts[option.value]
    if (!draft?.apiKey.trim()) continue
    if (next.some((conn) => conn.provider === option.value)) continue
    const merged = queryMergeProviderDraftWithSaved(
      draft,
      {
        apiKey: '',
        baseUrl: option.defaultBaseUrl,
        model: option.defaultModel
      },
      option
    )
    next = [
      ...next,
      {
        id: queryProviderCredentialConnectionId(option.value),
        label: `${option.label}（凭证）`,
        provider: option.value,
        apiKey: merged.apiKey,
        baseUrl: merged.baseUrl || option.defaultBaseUrl,
        model: merged.model || option.defaultModel,
        capabilities: ['chat']
      }
    ]
  }

  return next
}

/** 模型与 API 面板一次性保存：当前选用供应商写顶层，其余凭证写回连接 */
export function queryModelApiSavePatch(params: {
  activeProvider: ModelProvider
  drafts: ProviderFormDraftMap
  settings: AppSettings
  maxTurns: number
  fullAccess: boolean
  thinkingEnabled: boolean
  customProviders: CustomModelProvider[]
  providerModelCatalog: ProviderModelCatalog
}): Partial<AppSettings> {
  const {
    activeProvider,
    drafts,
    settings,
    maxTurns,
    fullAccess,
    thinkingEnabled,
    customProviders
  } = params
  const activeMeta = queryProviderOption(activeProvider, customProviders)
  const savedActive = queryProviderCredentialsFromSettings(settings, activeProvider)
  const activeDraft = queryMergeProviderDraftWithSaved(
    drafts[activeProvider],
    savedActive,
    activeMeta
  )
  const aligned = queryAlignConnectionsToActiveProvider({
    connections: settings.connections ?? [],
    activeProvider,
    activeCreds: {
      apiKey: activeDraft.apiKey,
      baseUrl: activeDraft.baseUrl,
      model: activeDraft.model
    },
    defaultConnectionId: settings.defaultConnectionId,
    catalog: params.providerModelCatalog,
    customProviders
  })
  // 为什么：须在对齐内置连接之后再写回各供应商草稿，否则对齐会把旧 provider 行改成新 provider 并冲掉 Key
  const connections = queryApplyProviderDraftsToConnections(
    aligned.connections,
    drafts,
    customProviders
  )
  return {
    provider: activeProvider,
    apiKey: activeDraft.apiKey,
    baseUrl: activeDraft.baseUrl,
    model: aligned.model,
    maxTurns,
    fullAccess,
    thinkingEnabled,
    customProviders,
    providerModelCatalog: params.providerModelCatalog,
    connections,
    defaultConnectionId: aligned.defaultConnectionId
  }
}
