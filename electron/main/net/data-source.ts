/**
 * 数据获取兜底：优先调用 API，全部失败后再走无头浏览器抓取。
 * 为什么：网络信息应尽量走官方/公开 API，浏览器仅作兜底且不弹窗打扰用户。
 */

export type DataSourceKind = 'api' | 'browser' | 'none'

export interface DataSourceResult<T> {
  ok: boolean
  data?: T
  /** 最终采用的来源 */
  source: DataSourceKind
  /** 各路失败原因，便于调试与工作流 context */
  errors: string[]
  message: string
}

export interface QueryWithFallbackParams<T> {
  /** 按优先级排列的 API 拉取函数；任一成功即返回 */
  apiFetchers: Array<() => Promise<T>>
  /** 全部 API 失败后的无头浏览器抓取；可省略表示无浏览器兜底 */
  browserScraper?: () => Promise<T>
  /** 成功时的展示文案工厂 */
  formatSuccess?: (data: T, source: Exclude<DataSourceKind, 'none'>) => string
  /** 全部失败时的文案前缀 */
  failLabel?: string
}

/**
 * 依次尝试 API →（可选）无头浏览器。
 * 不向外抛错：调用方根据 ok / source 决定是否写入 workflow context。
 */
export async function queryWithFallback<T>(
  params: QueryWithFallbackParams<T>
): Promise<DataSourceResult<T>> {
  const errors: string[] = []

  for (let i = 0; i < params.apiFetchers.length; i++) {
    try {
      const data = await params.apiFetchers[i]()
      const message =
        params.formatSuccess?.(data, 'api') ?? `API 获取成功（第 ${i + 1} 路）`
      return { ok: true, data, source: 'api', errors, message }
    } catch (err) {
      errors.push(`api[${i}]: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  if (params.browserScraper) {
    try {
      const data = await params.browserScraper()
      const message = params.formatSuccess?.(data, 'browser') ?? '无头浏览器兜底成功'
      return { ok: true, data, source: 'browser', errors, message }
    } catch (err) {
      errors.push(`browser: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  const failLabel = params.failLabel ?? '数据获取失败'
  return {
    ok: false,
    source: 'none',
    errors,
    message: `${failLabel}：${errors.join('; ') || '无可用数据源'}`
  }
}
