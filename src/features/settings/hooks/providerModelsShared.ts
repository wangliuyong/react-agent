import { queryProviderOption, type AppSettings, type ModelOption, type ModelProvider } from '@shared/types'

/** API Key 过短时不请求平台，避免输入过程中误报 401 */
export const MIN_PROVIDER_API_KEY_LENGTH = 8

/** 防抖毫秒：与设置页「模型与 API」一致 */
export const PROVIDER_MODELS_DEBOUNCE_MS = 400

/** 剥离 Electron IPC 包装，仅展示业务错误文案 */
export function queryFriendlyIpcErrorMessage(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err)
  const match = raw.match(/Error:\s+(.+)$/)
  return match?.[1]?.trim() || raw
}

/** 同一供应商 + Base URL + Key 共用一份平台模型缓存 */
export function queryProviderModelsCacheKey(
  creds: Pick<AppSettings, 'provider' | 'baseUrl' | 'apiKey'>
): string {
  return `${creds.provider}|${creds.baseUrl.trim()}|${creds.apiKey.trim()}`
}

/** 解析用于拉取 /models 的凭证（补齐默认 Base URL） */
export function queryProviderModelsRequest(
  creds: Pick<AppSettings, 'provider' | 'apiKey' | 'baseUrl'> & {
    customProviders?: AppSettings['customProviders']
  }
): Pick<AppSettings, 'provider' | 'apiKey' | 'baseUrl'> {
  const providerMeta = queryProviderOption(creds.provider, creds.customProviders ?? [])
  return {
    provider: creds.provider,
    apiKey: creds.apiKey.trim(),
    baseUrl: (creds.baseUrl.trim() || providerMeta.defaultBaseUrl).trim()
  }
}

/** 是否满足发起平台 /models 请求的条件 */
export function queryCanFetchProviderModels(apiKey: string): boolean {
  return apiKey.trim().length >= MIN_PROVIDER_API_KEY_LENGTH
}

/** 调用主进程拉取平台模型列表（百炼多端点回退等在主进程实现） */
export async function queryProviderModelsFromApi(
  creds: Pick<AppSettings, 'provider' | 'apiKey' | 'baseUrl'> & {
    customProviders?: AppSettings['customProviders']
  }
): Promise<ModelOption[]> {
  return window.api.queryProviderModels(queryProviderModelsRequest(creds))
}

/** 生成「默认模型」下拉下方的状态说明文案 */
export function queryProviderModelsStatusHint(input: {
  apiKey: string
  loading: boolean
  remoteCount: number | null
  error: string | null
}): string {
  const apiKey = input.apiKey.trim()
  if (!apiKey) return '填写 API Key 后将从平台 /models 拉取可选模型'
  if (!queryCanFetchProviderModels(apiKey)) return 'API Key 过短，请填写完整密钥后再拉取'
  if (input.loading) return '正在从平台拉取模型列表…'
  if (input.remoteCount != null && input.remoteCount > 0) {
    return `已从平台加载 ${input.remoteCount} 个模型（可搜索）`
  }
  if (input.error) return `${input.error}；当前显示本地兜底列表`
  return '填写 API Key 后可从平台拉取可选模型'
}

/** 生成连接卡片内模型下拉的状态说明 */
export function queryConnectionModelsStatusHint(input: {
  apiKey: string
  loading: boolean
  remoteCount: number | null
  error: string | null
}): string | null {
  const apiKey = input.apiKey.trim()
  if (!apiKey) return null
  if (!queryCanFetchProviderModels(apiKey)) return 'API Key 过短，请填写完整后再拉取'
  if (input.loading) return '正在从平台拉取…'
  if (input.remoteCount != null && input.remoteCount > 0) {
    return `已从平台加载 ${input.remoteCount} 个模型`
  }
  if (input.error) return `${input.error}；当前显示本地兜底列表`
  return null
}

export type ProviderModelsCredential = Pick<AppSettings, 'provider' | 'apiKey' | 'baseUrl'>

export type ProviderModelsCredentialInput = ProviderModelsCredential & {
  /** 业务侧唯一标识，多连接面板用 cacheKey */
  id: string
}
