/**
 * 联网实测：模拟音乐站页面提取并下载 audio。
 * 运行：pnpm exec vitest run tests/query-page-media-live.test.ts
 */
import { createServer } from 'http'
import { existsSync, mkdirSync, readFileSync, statSync } from 'fs'
import { join } from 'path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  postDownloadPageMedia,
  queryExtractMediaFromHtml
} from '../electron/main/browser/query-page-media'
import { queryHttp } from '../electron/main/net/http-client'

const SITE_DIR = join(process.cwd(), 'artifacts-tmp', 'demo-music-site')
const OUT_DIR = join(process.cwd(), 'artifacts-tmp', 'web-media-live-music')

let baseUrl = ''
let server: ReturnType<typeof createServer> | null = null

beforeAll(async () => {
  const html = readFileSync(join(SITE_DIR, 'index.html'))
  server = createServer((req, res) => {
    if (req.url === '/' || req.url === '/index.html') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
      res.end(html)
      return
    }
    res.writeHead(404)
    res.end('not found')
  })
  await new Promise<void>((resolve) => {
    server!.listen(0, '127.0.0.1', () => resolve())
  })
  const addr = server.address()
  if (!addr || typeof addr === 'string') throw new Error('server address unavailable')
  baseUrl = `http://127.0.0.1:${addr.port}/`
})

afterAll(async () => {
  if (!server) return
  await new Promise<void>((resolve, reject) => {
    server!.close((err) => (err ? reject(err) : resolve()))
  })
})

describe('query_web_data 媒体提取 · 音乐站实测', () => {
  it(
    '从模拟音乐页提取 audio，并下载较小的 horse.mp3',
    async () => {
      const res = await queryHttp(baseUrl, { timeoutMs: 10_000 })
      const html = await res.text()

      const media = queryExtractMediaFromHtml(html, baseUrl, ['audio'], 8)
      console.log(
        '[music-site] audio candidates:\n',
        media.map((m, i) => `${i + 1}. ${m.title || ''} ${m.url}`).join('\n')
      )

      expect(media.length).toBeGreaterThanOrEqual(2)
      expect(media.every((m) => m.kind === 'audio')).toBe(true)
      expect(media.some((m) => /SoundHelix-Song-1\.mp3/i.test(m.url))).toBe(true)
      expect(media.some((m) => /horse\.mp3/i.test(m.url))).toBe(true)

      // 只下载较小的 horse.mp3，避免拉 ~9MB SoundHelix 拖慢测试
      const small = media.filter((m) => /horse\.mp3/i.test(m.url))
      mkdirSync(OUT_DIR, { recursive: true })
      const dl = await postDownloadPageMedia(small, baseUrl, OUT_DIR)

      console.log('[music-site] download notes:', dl.notes)
      console.log(
        '[music-site] results:',
        dl.items.map((i) => ({
          url: i.url,
          localPath: i.localPath,
          note: i.downloadNote
        }))
      )

      const ok = dl.items.find((i) => i.localPath && existsSync(i.localPath))
      expect(ok).toBeTruthy()
      const size = statSync(ok!.localPath!).size
      console.log(`[music-site] saved ${ok!.localPath} (${size} bytes)`)
      expect(size).toBeGreaterThan(10_000)
    },
    90_000
  )
})
