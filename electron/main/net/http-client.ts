/**
 * 主进程统一 HTTP 客户端。
 * 为什么：各工具原先散装 fetch（UA/超时/错误处理不一致），集中后便于 API 优先与重试策略统一。
 */

const DEFAULT_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'

export interface HttpRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  headers?: Record<string, string>
  body?: string | Record<string, unknown>
  /** 超时毫秒，默认 20s */
  timeoutMs?: number
  /** 失败重试次数（不含首次），默认 0 */
  retries?: number
  signal?: AbortSignal
}

export class HttpError extends Error {
  readonly status: number
  readonly url: string

  constructor(message: string, status: number, url: string) {
    super(message)
    this.name = 'HttpError'
    this.status = status
    this.url = url
  }
}

function queryMergeSignal(
  timeoutMs: number,
  external?: AbortSignal
): { signal: AbortSignal; cleanup: () => void } {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  const onExternalAbort = (): void => controller.abort()
  if (external) {
    if (external.aborted) {
      controller.abort()
    } else {
      external.addEventListener('abort', onExternalAbort, { once: true })
    }
  }
  return {
    signal: controller.signal,
    cleanup: () => {
      clearTimeout(timer)
      external?.removeEventListener('abort', onExternalAbort)
    }
  }
}

async function queryFetchOnce(
  url: string,
  options: HttpRequestOptions
): Promise<Response> {
  const timeoutMs = options.timeoutMs ?? 20_000
  const { signal, cleanup } = queryMergeSignal(timeoutMs, options.signal)
  try {
    const body =
      options.body == null
        ? undefined
        : typeof options.body === 'string'
          ? options.body
          : JSON.stringify(options.body)

    const headers: Record<string, string> = {
      'User-Agent': DEFAULT_UA,
      Accept: 'application/json,text/plain,*/*',
      ...options.headers
    }
    if (body != null && !headers['Content-Type'] && typeof options.body !== 'string') {
      headers['Content-Type'] = 'application/json'
    }

    const res = await fetch(url, {
      method: options.method ?? 'GET',
      headers,
      body,
      signal
    })
    return res
  } finally {
    cleanup()
  }
}

/** 发起 HTTP 请求；非 2xx 抛 HttpError；支持有限次重试 */
export async function queryHttp(
  url: string,
  options: HttpRequestOptions = {}
): Promise<Response> {
  const retries = Math.max(0, options.retries ?? 0)
  let lastError: unknown
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await queryFetchOnce(url, options)
      if (!res.ok) {
        throw new HttpError(`HTTP ${res.status}`, res.status, url)
      }
      return res
    } catch (err) {
      lastError = err
      if (attempt === retries) break
      // 简单退避，避免瞬时抖动打满接口
      await new Promise((r) => setTimeout(r, 300 * (attempt + 1)))
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError))
}

/**
 * 返回原始 Response，不因非 2xx 抛错。
 * 为什么：飞书等 Webhook 需读业务 code 字段，HTTP 200 也可能业务失败。
 */
export async function queryHttpResponse(
  url: string,
  options: HttpRequestOptions = {}
): Promise<Response> {
  return queryFetchOnce(url, options)
}

/** GET/POST JSON 并解析；解析失败抛错 */
export async function queryHttpJson<T = unknown>(
  url: string,
  options: HttpRequestOptions = {}
): Promise<T> {
  const res = await queryHttp(url, options)
  return (await res.json()) as T
}

/** POST JSON 并期望 JSON 响应（通知 Webhook 等） */
export async function postHttpJson<T = unknown>(
  url: string,
  body: Record<string, unknown>,
  options: Omit<HttpRequestOptions, 'method' | 'body'> = {}
): Promise<T> {
  return queryHttpJson<T>(url, {
    ...options,
    method: 'POST',
    body
  })
}
