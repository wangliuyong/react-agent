import {
  queryModelOptions,
  queryProviderOption,
  type AppSettings,
  type ModelOption,
  type ModelProvider
} from '../../../shared/types'

/** OpenAI 兼容 /models 列表项 */
export interface ProviderModelListItem {
  id?: string
  object?: string
  owned_by?: string
}

/** OpenAI 兼容 /models 响应 */
export interface ProviderModelListResponse {
  object?: string
  data?: ProviderModelListItem[]
}

/** 拼出平台模型列表地址；去掉尾部斜杠再追加 /models。 */
export function queryModelsEndpoint(baseUrl: string): string {
  const trimmed = baseUrl.trim().replace(/\/+$/, '')
  return `${trimmed}/models`
}

/**
 * 将平台返回转为聊天/设置页可用的 ModelOption。
 * 为什么：平台只给 id，展示名先用 id，避免硬编码过期文案。
 */
export function queryModelOptionsFromListResponse(
  provider: ModelProvider,
  payload: ProviderModelListResponse
): ModelOption[] {
  const ids = (payload.data ?? [])
    .map((item) => item.id?.trim())
    .filter((id): id is string => Boolean(id))

  // 去重，保持平台返回顺序（避免依赖 downlevelIteration）
  const uniqueIds = Array.from(new Set(ids))
  return uniqueIds.map((id) => ({
    provider,
    value: id,
    label: id
  }))
}

type FetchLike = typeof fetch

/**
 * 从当前供应商 OpenAI 兼容接口拉取可用模型。
 * DeepSeek 等平台会随版本调整模型 id，静态列表容易过期。
 */
export async function queryProviderModels(
  settings: Pick<AppSettings, 'provider' | 'apiKey' | 'baseUrl'>,
  fetchImpl: FetchLike = fetch
): Promise<ModelOption[]> {
  const providerMeta = queryProviderOption(settings.provider)
  const apiKey = settings.apiKey.trim()
  if (!apiKey) {
    throw new Error(`未配置 ${providerMeta.apiKeyLabel}，无法从平台获取模型列表`)
  }

  const baseUrl = (settings.baseUrl || providerMeta.defaultBaseUrl).trim()
  const response = await fetchImpl(queryModelsEndpoint(baseUrl), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json'
    }
  })

  if (!response.ok) {
    throw new Error(`获取模型列表失败（HTTP ${response.status}）`)
  }

  const payload = (await response.json()) as ProviderModelListResponse
  const models = queryModelOptionsFromListResponse(settings.provider, payload)
  if (models.length === 0) {
    // 平台异常空列表时回退静态配置，保证聊天框仍可切换
    return queryModelOptions(settings.provider)
  }
  return models
}
