/**
 * Remotion 浏览器预检：启动时后台 ensure，避免首次渲染长时间无反馈。
 */

let ensurePromise: Promise<void> | null = null

/** 后台确保 Chrome Headless Shell 已安装（幂等、可重复调用） */
export function postEnsureRemotionBrowser(): Promise<void> {
  if (!ensurePromise) {
    ensurePromise = (async () => {
      try {
        const { ensureBrowser } = await import('@remotion/renderer')
        await ensureBrowser({
          logLevel: 'info',
          onBrowserDownload: () => ({
            version: null,
            onProgress: ({ percent, downloadedBytes, totalSizeInBytes }) => {
              const pct = Math.round(percent * 100)
              const mb = (downloadedBytes / 1024 / 1024).toFixed(1)
              const totalMb = (totalSizeInBytes / 1024 / 1024).toFixed(1)
              console.log(`[remotion] 下载浏览器 ${pct}% (${mb}/${totalMb} MiB)`)
            }
          })
        })
        console.log('[remotion] Chrome Headless Shell 已就绪')
      } catch (err) {
        ensurePromise = null
        const msg = err instanceof Error ? err.message : String(err)
        console.warn(`[remotion] 浏览器预检失败（首次渲染时会重试）: ${msg}`)
        throw err
      }
    })()
  }
  return ensurePromise
}

/** 渲染前等待浏览器就绪（失败不阻断，由 render 再次尝试） */
export async function queryRemotionBrowserReady(): Promise<void> {
  try {
    await postEnsureRemotionBrowser()
  } catch {
    // 已在 postEnsureRemotionBrowser 打日志
  }
}
