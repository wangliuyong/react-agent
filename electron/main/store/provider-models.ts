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

/** 百炼国际站 OpenAI 兼容 Base URL */
const DASHSCOPE_INTL_COMPAT_BASE = 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1'

/** 百炼 Coding Plan（国内 / 国际）OpenAI 兼容 Base URL */
const DASHSCOPE_CODING_CN_BASE = 'https://coding.dashscope.aliyuncs.com/v1'
const DASHSCOPE_CODING_INTL_BASE = 'https://coding-intl.dashscope.aliyuncs.com/v1'

/** 拼出平台模型列表地址；去掉尾部斜杠再追加 /models。 */
export function queryModelsEndpoint(baseUrl: string): string {
  const trimmed = baseUrl.trim().replace(/\/+$/, '')
  return `${trimmed}/models`
}

/**
 * 规范化百炼 OpenAI 兼容 Base URL。
 * 为什么：用户常漏填 `/v1`，会请求到 `/compatible-mode/models` 导致 404。
 */
export function queryNormalizeDashscopeCompatBaseUrl(baseUrl: string): string {
  const trimmed = baseUrl.trim().replace(/\/+$/, '')
  const fallback = queryProviderOption('dashscope').defaultBaseUrl
  if (!trimmed) return fallback
  if (trimmed.endsWith('/compatible-mode')) return `${trimmed}/v1`
  return trimmed
}

/**
 * 百炼模型列表候选 Base URL（按优先级）。
 * 为什么：国内 / 国际 / Coding Plan 的 Key 与端点必须匹配，401 时依次尝试常见端点。
 */
export function queryDashscopeModelsBaseUrlCandidates(baseUrl: string): string[] {
  const preferred = queryNormalizeDashscopeCompatBaseUrl(baseUrl)
  const defaults = queryProviderOption('dashscope').defaultBaseUrl
  const ordered = [
    preferred,
    defaults,
    DASHSCOPE_INTL_COMPAT_BASE,
    DASHSCOPE_CODING_CN_BASE,
    DASHSCOPE_CODING_INTL_BASE
  ]
  const seen = new Set<string>()
  const result: string[] = []
  for (const url of ordered) {
    const norm = url.trim().replace(/\/+$/, '')
    if (!norm || seen.has(norm)) continue
    seen.add(norm)
    result.push(norm)
  }
  return result
}

/**
 * 解析拉取 /models 所需的供应商凭证。
 * 优先使用调用方传入的草稿；顶层 Key 为空时回退到同供应商连接。
 */
export function queryResolveProviderModelsCredentials(
  saved: AppSettings,
  override?: Partial<Pick<AppSettings, 'provider' | 'apiKey' | 'baseUrl'>>
): Pick<AppSettings, 'provider' | 'apiKey' | 'baseUrl'> & {
  customProviders: AppSettings['customProviders']
} {
  const provider = override?.provider ?? saved.provider
  const providerMeta = queryProviderOption(provider, saved.customProviders ?? [])
  let apiKey = String(override?.apiKey ?? saved.apiKey ?? '').trim()
  let baseUrl = String(override?.baseUrl ?? saved.baseUrl ?? '').trim()

  if (!apiKey) {
    const matched = saved.connections?.find(
      (conn) => conn.provider === provider && conn.apiKey.trim()
    )
    if (matched) apiKey = matched.apiKey.trim()
  }

  if (!baseUrl) {
    baseUrl = providerMeta.defaultBaseUrl
  }

  if (provider === 'dashscope') {
    baseUrl = queryNormalizeDashscopeCompatBaseUrl(baseUrl)
  }

  return { provider, apiKey, baseUrl, customProviders: saved.customProviders ?? [] }
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

interface ProviderModelsFetchFailure {
  status: number
  detail: string
  baseUrl: string
}

/** 单次 GET {baseUrl}/models 并解析为 ModelOption */
async function queryFetchProviderModelsOnce(
  provider: ModelProvider,
  apiKey: string,
  baseUrl: string,
  fetchImpl: FetchLike
): Promise<ModelOption[] | ProviderModelsFetchFailure> {
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
    return { status: response.status, detail, baseUrl }
  }

  const payload = (await response.json()) as ProviderModelListResponse
  const models = queryModelOptionsFromListResponse(provider, payload)
  if (models.length === 0) {
    return queryModelOptions(provider)
  }
  return models
}

function queryIsRetryableProviderModelsStatus(status: number): boolean {
  return status === 401 || status === 403 || status === 404
}

function queryFormatProviderModelsError(failure: ProviderModelsFetchFailure): string {
  const suffix = failure.detail ? `：${failure.detail}` : ''
  return `获取模型列表失败（HTTP ${failure.status}）${suffix}`
}

/**
 * 百炼：依次尝试国内 / 国际 / Coding Plan 等兼容端点。
 * 非百炼：仅请求用户配置的 Base URL。
 */
async function queryFetchProviderModelsWithFallback(
  settings: Pick<AppSettings, 'provider' | 'apiKey' | 'baseUrl'> & {
    customProviders?: AppSettings['customProviders']
  },
  fetchImpl: FetchLike
): Promise<ModelOption[]> {
  const providerMeta = queryProviderOption(settings.provider, settings.customProviders ?? [])
  const apiKey = settings.apiKey.trim()
  const baseUrl = (settings.baseUrl || providerMeta.defaultBaseUrl).trim()

  const candidates =
    settings.provider === 'dashscope'
      ? queryDashscopeModelsBaseUrlCandidates(baseUrl)
      : [baseUrl.trim().replace(/\/+$/, '') || providerMeta.defaultBaseUrl]

  let lastFailure: ProviderModelsFetchFailure | null = null

  for (const candidate of candidates) {
    try {
      const result = await queryFetchProviderModelsOnce(
        settings.provider,
        apiKey,
        candidate,
        fetchImpl
      )
      if (Array.isArray(result)) {
        return result
      }
      lastFailure = result
      if (!queryIsRetryableProviderModelsStatus(result.status)) {
        break
      }
    } catch (err) {
      lastFailure = {
        status: 0,
        detail: err instanceof Error ? err.message : String(err),
        baseUrl: candidate
      }
    }
  }

  if (lastFailure) {
    const hint =
      settings.provider === 'dashscope'
        ? '；请确认 API Key 与 Base URL 区域一致（国内 / 国际 / Coding Plan）'
        : ''
    throw new Error(`${queryFormatProviderModelsError(lastFailure)}${hint}`)
  }

  return queryModelOptions(settings.provider)
}

/**
 * 从当前供应商 OpenAI 兼容接口拉取可用模型。
 * 百炼 / DeepSeek / 兼容网关均支持 GET {baseUrl}/models。
 */
export async function queryProviderModels(
  settings: Pick<AppSettings, 'provider' | 'apiKey' | 'baseUrl'> & {
    customProviders?: AppSettings['customProviders']
  },
  fetchImpl: FetchLike = fetch
): Promise<ModelOption[]> {
  const providerMeta = queryProviderOption(settings.provider, settings.customProviders ?? [])
  const apiKey = settings.apiKey.trim()
  if (!apiKey) {
    throw new Error(`未配置 ${providerMeta.apiKeyLabel}，无法从平台获取模型列表`)
  }

  return queryFetchProviderModelsWithFallback(settings, fetchImpl)
}
