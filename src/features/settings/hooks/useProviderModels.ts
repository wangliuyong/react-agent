import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CustomModelProvider, ModelOption, ModelProvider } from '@shared/types'
import {
  PROVIDER_MODELS_DEBOUNCE_MS,
  queryCanFetchProviderModels,
  queryFriendlyIpcErrorMessage,
  queryProviderModelsFromApi
} from './providerModelsShared'

/** 稳定空数组，避免 `customProviders = []` 每次渲染新建引用触发 effect */
const EMPTY_CUSTOM_PROVIDERS: CustomModelProvider[] = []

interface UseProviderModelsOptions {
  /** 为 false 时不发起请求（如 Tab 未激活） */
  enabled: boolean
  provider: ModelProvider
  apiKey: string
  baseUrl: string
  /** 自定义供应商元数据，用于补齐默认 Base URL */
  customProviders?: CustomModelProvider[]
  /**
   * 是否在凭证就绪时自动拉取。
   * 设置页传 false，仅点「从平台刷新」时请求；聊天页保持 true 拉一次即可。
   */
  autoFetch?: boolean
  /** 递增以手动刷新 */
  refreshToken?: number
}

interface UseProviderModelsResult {
  /** 平台返回的模型；null 表示尚未成功拉取 */
  remoteModels: ModelOption[] | null
  loading: boolean
  error: string | null
  /** 触发重新拉取 */
  refresh: () => void
}

/** 用内容签名比较自定义供应商，避免 Form.watch 新数组引用误触发刷新 */
function queryCustomProvidersSignature(
  customProviders: CustomModelProvider[]
): string {
  if (customProviders.length === 0) return ''
  return customProviders
    .map(
      (p) =>
        `${p.id}|${p.label}|${p.apiKeyLabel}|${p.defaultBaseUrl}|${p.defaultModel}`
    )
    .join(';')
}

/**
 * 单供应商凭证下拉：与「模型与 API」Tab 共用同一套拉取策略。
 * 防抖、最短 Key 校验、IPC 错误友好化均在此统一处理。
 */
export function useProviderModels(options: UseProviderModelsOptions): UseProviderModelsResult {
  const {
    enabled,
    provider,
    apiKey,
    baseUrl,
    customProviders = EMPTY_CUSTOM_PROVIDERS,
    autoFetch = true,
    refreshToken = 0
  } = options
  const [remoteModels, setRemoteModels] = useState<ModelOption[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [manualRefreshToken, setManualRefreshToken] = useState(0)
  /** 已成功（或明确失败）拉取过的凭证指纹，避免同一凭证重复请求 */
  const fetchedCredsRef = useRef<string | null>(null)
  /** 上次已消费的手动刷新计数，仅在计数真正递增时强制重拉 */
  const consumedForceTokenRef = useRef(0)

  const customProvidersSignature = useMemo(
    () => queryCustomProvidersSignature(customProviders),
    [customProviders]
  )

  const forceToken = refreshToken + manualRefreshToken

  const refresh = useCallback(() => {
    setManualRefreshToken((n) => n + 1)
  }, [])

  useEffect(() => {
    if (!enabled) {
      setLoading(false)
      setError(null)
      return
    }

    const trimmedKey = apiKey.trim()
    if (!queryCanFetchProviderModels(trimmedKey)) {
      fetchedCredsRef.current = null
      setRemoteModels(null)
      setLoading(false)
      setError(null)
      return
    }

    const credsKey = `${provider}|${trimmedKey}|${baseUrl.trim()}|${customProvidersSignature}`
    const forceRequested = forceToken > consumedForceTokenRef.current

    if (forceRequested) {
      consumedForceTokenRef.current = forceToken
    } else if (!autoFetch) {
      // 设置页：未点刷新则不请求
      return
    } else if (fetchedCredsRef.current === credsKey) {
      // 聊天页：同一凭证已拉过则跳过，避免流式重渲染反复打 /models
      return
    }

    let cancelled = false
    setError(null)

    const timer = window.setTimeout(() => {
      setLoading(true)
      void queryProviderModelsFromApi({
        provider,
        apiKey: trimmedKey,
        baseUrl,
        customProviders
      })
        .then((models) => {
          if (cancelled) return
          fetchedCredsRef.current = credsKey
          if (models.length > 0) {
            setRemoteModels(models)
            setError(null)
          } else {
            // 保留上次列表，避免空响应把下拉刷成兜底闪烁
            setError('平台返回空列表，已使用本地兜底')
          }
        })
        .catch((err) => {
          if (cancelled) return
          fetchedCredsRef.current = credsKey
          setError(queryFriendlyIpcErrorMessage(err) || '拉取模型列表失败')
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    }, PROVIDER_MODELS_DEBOUNCE_MS)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
    // customProviders 用签名入依赖，避免引用抖动
    // eslint-disable-next-line react-hooks/exhaustive-deps -- customProviders 由 signature 代理
  }, [
    enabled,
    provider,
    apiKey,
    baseUrl,
    customProvidersSignature,
    autoFetch,
    forceToken
  ])

  return { remoteModels, loading, error, refresh }
}
