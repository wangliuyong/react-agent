import { useCallback, useEffect, useState } from 'react'
import type { ModelOption, ModelProvider } from '@shared/types'
import {
  PROVIDER_MODELS_DEBOUNCE_MS,
  queryCanFetchProviderModels,
  queryFriendlyIpcErrorMessage,
  queryProviderModelsFromApi
} from './providerModelsShared'

interface UseProviderModelsOptions {
  /** 为 false 时不发起请求（如 Tab 未激活） */
  enabled: boolean
  provider: ModelProvider
  apiKey: string
  baseUrl: string
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

/**
 * 单供应商凭证下拉：与「模型与 API」Tab 共用同一套拉取策略。
 * 防抖、最短 Key 校验、IPC 错误友好化均在此统一处理。
 */
export function useProviderModels(options: UseProviderModelsOptions): UseProviderModelsResult {
  const { enabled, provider, apiKey, baseUrl, refreshToken = 0 } = options
  const [remoteModels, setRemoteModels] = useState<ModelOption[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [manualRefreshToken, setManualRefreshToken] = useState(0)

  const refresh = useCallback(() => {
    setManualRefreshToken((n) => n + 1)
  }, [])

  useEffect(() => {
    if (!enabled) {
      setRemoteModels(null)
      setLoading(false)
      setError(null)
      return
    }

    const trimmedKey = apiKey.trim()
    if (!queryCanFetchProviderModels(trimmedKey)) {
      setRemoteModels(null)
      setLoading(false)
      setError(null)
      return
    }

    let cancelled = false
    setRemoteModels(null)
    setError(null)

    const timer = window.setTimeout(() => {
      setLoading(true)
      void queryProviderModelsFromApi({
        provider,
        apiKey: trimmedKey,
        baseUrl
      })
        .then((models) => {
          if (cancelled) return
          if (models.length > 0) {
            setRemoteModels(models)
            setError(null)
          } else {
            setRemoteModels(null)
            setError('平台返回空列表，已使用本地兜底')
          }
        })
        .catch((err) => {
          if (cancelled) return
          setRemoteModels(null)
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
  }, [enabled, provider, apiKey, baseUrl, refreshToken, manualRefreshToken])

  return { remoteModels, loading, error, refresh }
}
