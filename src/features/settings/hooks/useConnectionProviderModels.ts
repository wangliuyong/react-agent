import { useEffect, useMemo, useState } from 'react'
import type { ModelConnection, ModelOption } from '@shared/types'
import {
  PROVIDER_MODELS_DEBOUNCE_MS,
  queryCanFetchProviderModels,
  queryConnectionModelsStatusHint,
  queryFriendlyIpcErrorMessage,
  queryProviderModelsCacheKey,
  queryProviderModelsFromApi
} from './providerModelsShared'

interface UseConnectionProviderModelsResult {
  /** cacheKey → 平台模型；undefined 未请求，null 失败 */
  modelsByKey: Record<string, ModelOption[] | null | undefined>
  loadingKeys: Record<string, boolean>
  errorsByKey: Record<string, string | null>
  /** 按连接 id 取模型下拉状态说明 */
  queryModelHint: (conn: ModelConnection) => string | null
  /** 按连接取平台模型（未成功时 undefined） */
  queryRemoteModels: (conn: ModelConnection) => ModelOption[] | null | undefined
  queryIsLoading: (conn: ModelConnection) => boolean
}

/**
 * 多模型连接面板：按「供应商 + Base URL + Key」去重后拉取 /models。
 * 与「模型与 API」Tab 共用同一 IPC 与防抖策略。
 */
export function useConnectionProviderModels(
  connections: ModelConnection[],
  enabled = true,
  customProviders: import('@shared/types').CustomModelProvider[] = []
): UseConnectionProviderModelsResult {
  const [modelsByKey, setModelsByKey] = useState<
    Record<string, ModelOption[] | null | undefined>
  >({})
  const [loadingKeys, setLoadingKeys] = useState<Record<string, boolean>>({})
  const [errorsByKey, setErrorsByKey] = useState<Record<string, string | null>>({})

  /** 凭证指纹：仅在连接集合变化时重新拉取 */
  const credentialsSignature = useMemo(
    () =>
      connections
        .map(
          (c) =>
            `${c.id}:${c.provider}:${c.baseUrl}:${c.apiKey.trim() ? '1' : '0'}:${c.apiKey}`
        )
        .join('|'),
    [connections]
  )

  useEffect(() => {
    if (!enabled) return

    const unique = new Map<string, ModelConnection>()
    for (const conn of connections) {
      const trimmedKey = conn.apiKey.trim()
      if (!queryCanFetchProviderModels(trimmedKey)) continue
      const cacheKey = queryProviderModelsCacheKey(conn)
      if (!unique.has(cacheKey)) unique.set(cacheKey, conn)
    }

    const activeKeys = new Set(unique.keys())

    // 凭证变更后清理失效缓存，避免一直命中旧的失败结果
    setModelsByKey((prev) => {
      const next: Record<string, ModelOption[] | null | undefined> = {}
      for (const key of Array.from(activeKeys)) {
        if (key in prev) next[key] = prev[key]
      }
      return next
    })
    setErrorsByKey((prev) => {
      const next: Record<string, string | null> = {}
      for (const key of Array.from(activeKeys)) {
        if (key in prev) next[key] = prev[key]
      }
      return next
    })

    const controllers: Array<() => void> = []

    for (const [cacheKey, conn] of Array.from(unique.entries())) {
      let cancelled = false
      setLoadingKeys((prev) => ({ ...prev, [cacheKey]: true }))
      setErrorsByKey((prev) => ({ ...prev, [cacheKey]: null }))

      const timer = window.setTimeout(() => {
        void queryProviderModelsFromApi({
          provider: conn.provider,
          apiKey: conn.apiKey,
          baseUrl: conn.baseUrl,
          customProviders
        })
          .then((models) => {
            if (cancelled) return
            setModelsByKey((prev) => ({
              ...prev,
              [cacheKey]: models.length > 0 ? models : null
            }))
            setErrorsByKey((prev) => ({
              ...prev,
              [cacheKey]:
                models.length > 0 ? null : '平台返回空列表，已使用本地兜底'
            }))
          })
          .catch((err) => {
            if (cancelled) return
            setModelsByKey((prev) => ({ ...prev, [cacheKey]: null }))
            setErrorsByKey((prev) => ({
              ...prev,
              [cacheKey]: queryFriendlyIpcErrorMessage(err) || '拉取模型列表失败'
            }))
          })
          .finally(() => {
            if (!cancelled) {
              setLoadingKeys((prev) => ({ ...prev, [cacheKey]: false }))
            }
          })
      }, PROVIDER_MODELS_DEBOUNCE_MS)

      controllers.push(() => {
        cancelled = true
        window.clearTimeout(timer)
      })
    }

    return () => {
      for (const cancel of controllers) cancel()
    }
  }, [enabled, credentialsSignature, connections, customProviders])

  const queryRemoteModels = (conn: ModelConnection): ModelOption[] | null | undefined => {
    if (!queryCanFetchProviderModels(conn.apiKey)) return undefined
    return modelsByKey[queryProviderModelsCacheKey(conn)]
  }

  const queryIsLoading = (conn: ModelConnection): boolean => {
    if (!queryCanFetchProviderModels(conn.apiKey)) return false
    return Boolean(loadingKeys[queryProviderModelsCacheKey(conn)])
  }

  const queryModelHint = (conn: ModelConnection): string | null => {
    const cacheKey = queryProviderModelsCacheKey(conn)
    const remote = modelsByKey[cacheKey]
    return queryConnectionModelsStatusHint({
      apiKey: conn.apiKey,
      loading: Boolean(loadingKeys[cacheKey]),
      remoteCount: Array.isArray(remote) ? remote.length : null,
      error: errorsByKey[cacheKey] ?? null
    })
  }

  return {
    modelsByKey,
    loadingKeys,
    errorsByKey,
    queryModelHint,
    queryRemoteModels,
    queryIsLoading
  }
}
