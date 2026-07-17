/**
 * 注册 media:// 自定义协议，安全地向渲染进程提供本地音视频文件。
 */

import { protocol } from 'electron'
import { createReadStream, statSync } from 'fs'
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
        corsEnabled: true
      }
    }
  ])
}

/** 在 app.whenReady() 之后调用 */
export function postRegisterMediaProtocolHandler(): void {
  protocol.handle('media', async (request) => {
    const abs = queryPathFromMediaUrl(request.url)
    if (!abs) {
      return new Response('Not Found', { status: 404 })
    }

    try {
      const stat = statSync(abs)
      const ext = abs.slice(abs.lastIndexOf('.')).toLowerCase()
      const mimeMap: Record<string, string> = {
        '.wav': 'audio/wav',
        '.mp3': 'audio/mpeg',
        '.m4a': 'audio/mp4',
        '.aac': 'audio/aac',
        '.ogg': 'audio/ogg',
        '.mp4': 'video/mp4',
        '.mov': 'video/quicktime',
        '.webm': 'video/webm',
        '.mkv': 'video/x-matroska'
      }
      const mime = mimeMap[ext] ?? 'application/octet-stream'

      // 支持 Range 请求，便于视频 seek
      const rangeHeader = request.headers.get('Range')
      if (rangeHeader) {
        const match = /^bytes=(\d+)-(\d*)$/.exec(rangeHeader)
        if (match) {
          const start = Number(match[1])
          const end = match[2] ? Number(match[2]) : stat.size - 1
          const chunkSize = end - start + 1
          const stream = createReadStream(abs, { start, end })
          const nodeStream = stream as unknown as ReadableStream
          return new Response(nodeStream, {
            status: 206,
            headers: {
              'Content-Type': mime,
              'Content-Length': String(chunkSize),
              'Content-Range': `bytes ${start}-${end}/${stat.size}`,
              'Accept-Ranges': 'bytes'
            }
          })
        }
      }

      const stream = createReadStream(abs)
      const nodeStream = stream as unknown as ReadableStream
      return new Response(nodeStream, {
        status: 200,
        headers: {
          'Content-Type': mime,
          'Content-Length': String(stat.size),
          'Accept-Ranges': 'bytes'
        }
      })
    } catch {
      return new Response('Not Found', { status: 404 })
    }
  })
}
