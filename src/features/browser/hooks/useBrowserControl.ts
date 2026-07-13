import { postBrowserClose, postBrowserStart, queryBrowserStatus } from '../api'

interface BrowserControl {
  /** Playwright 浏览器是否正在运行 */
  browserRunning: boolean
  /** 启动/关闭请求进行中 */
  loading: boolean
  /** 切换浏览器窗口开/关 */
  toggleBrowser: () => Promise<void>
}

/**
 * 管理顶部「智能体浏览器」按钮状态。
 * 点击后直接启动/关闭 Playwright 有头窗口，不再依赖侧边预览面板。
 */
export function useBrowserControl(): BrowserControl {
  const [browserRunning, setBrowserRunning] = useState(false)
  const [loading, setLoading] = useState(false)

  /** 同步主进程浏览器状态（含用户手动关闭窗口的情况） */
  const syncStatus = useCallback(async () => {
    try {
      const status = await queryBrowserStatus()
      setBrowserRunning(status.running)
    } catch {
      setBrowserRunning(false)
    }
  }, [])

  useEffect(() => {
    void syncStatus()
    const timer = window.setInterval(() => {
      void syncStatus()
    }, 2000)
    return () => window.clearInterval(timer)
  }, [syncStatus])

  const toggleBrowser = useCallback(async () => {
    setLoading(true)
    try {
      const status = browserRunning ? await postBrowserClose() : await postBrowserStart()
      setBrowserRunning(status.running)
    } catch (err) {
      message.error(err instanceof Error ? err.message : '浏览器操作失败')
      await syncStatus()
    } finally {
      setLoading(false)
    }
  }, [browserRunning, syncStatus])

  return { browserRunning, loading, toggleBrowser }
}
