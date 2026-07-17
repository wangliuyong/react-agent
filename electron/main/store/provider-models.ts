import {
  queryModelCategory,
  queryModelOptions,
  queryProviderOption,
  type AppSettings,
  type ModelOption,
  type ModelProvider
} from '../../../shared/types'

/** OpenAI 兼容 /models 列表项（百炼等可能附带 owned_by） */
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
 * 补齐本地已知文案，并写入模型类型便于下拉展示。
 */
export function queryModelOptionsFromListResponse(
  provider: ModelProvider,
  payload: ProviderModelListResponse
): ModelOption[] {
  const items = (payload.data ?? []).filter((item) => Boolean(item.id?.trim()))
  const seen = new Set<string>()
  const uniqueItems: ProviderModelListItem[] = []
  for (const item of items) {
    const id = item.id!.trim()
    if (seen.has(id)) continue
    seen.add(id)
    uniqueItems.push(item)
  }

  const staticByValue = new Map(
    queryModelOptions(provider).map((option) => [option.value, option])
  )
  return uniqueItems.map((item) => {
    const id = item.id!.trim()
    const known = staticByValue.get(id)
    const category = queryModelCategory(id)
    const ownedBy = item.owned_by?.trim()
    return {
      provider,
      value: id,
      label: known?.label ?? id,
      description: known?.description ?? (ownedBy ? `来源 ${ownedBy}` : undefined),
      category
    }
  })
}

type FetchLike = typeof fetch

/**
 * 从当前供应商 OpenAI 兼容接口拉取可用模型。
 * 百炼 / DeepSeek / 兼容网关均支持 GET {baseUrl}/models。
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
    let detail = ''
    try {
      detail = (await response.text()).slice(0, 200)
    } catch {
      /* ignore */
    }
    throw new Error(
      `获取模型列表失败（HTTP ${response.status}）${detail ? `：${detail}` : ''}`
    )
  }

  const payload = (await response.json()) as ProviderModelListResponse
  const models = queryModelOptionsFromListResponse(settings.provider, payload)
  if (models.length === 0) {
    // 平台异常空列表时回退静态配置，保证聊天框仍可切换
    return queryModelOptions(settings.provider)
  }
  return models
}
