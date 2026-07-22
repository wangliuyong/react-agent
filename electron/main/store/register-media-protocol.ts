/**
 * 注册 media:// 自定义协议，安全地向渲染进程提供本地音视频与 HTML 文件。
 */

import { net, protocol } from 'electron'
import { pathToFileURL } from 'url'
import { queryPathFromMediaUrl } from './local-media'

/** 必须在 app.whenReady() 之前调用 */
export function registerMediaScheme(): void {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: 'media',
      privileges: {
        standard: true,
        secure: true,
        supportFetchAPI: true,
        stream: true,
        corsEnabled: true,
        bypassCSP: true
      }
    }
  ])
}

/**
 * 在 app.whenReady() 之后调用。
 * 用 net.fetch(file://) 提供文件：自动支持 Range，避免 Node Stream 强转 ReadableStream 失败。
 */
export function postRegisterMediaProtocolHandler(): void {
  protocol.handle('media', (request) => {
    const abs = queryPathFromMediaUrl(request.url)
    if (!abs) {
      return new Response('Not Found', { status: 404 })
    }

    try {
      // 仅转发 Range，便于 <video> seek；避免把 Host: local 等头带到 file://
      const headers = new Headers()
      const range = request.headers.get('Range')
      if (range) headers.set('Range', range)
      return net.fetch(pathToFileURL(abs).href, { headers })
    } catch {
      return new Response('Not Found', { status: 404 })
    }
  })
}
