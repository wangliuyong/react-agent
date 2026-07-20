import { mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  queryLocalMediaUrl,
  queryPathFromMediaUrl,
  queryResolveLocalMediaPath
} from '../electron/main/store/local-media'

const dir = join(tmpdir(), `lingxi-media-test-${Date.now()}`)
const wavPath = join(dir, 'shot_1.wav')
const mp4Path = join(dir, 'shot_1.mp4')
const spacedDir = join(dir, 'Application Support', 'lingxi')
const spacedMp4 = join(spacedDir, 'cat.mp4')

beforeAll(() => {
  mkdirSync(spacedDir, { recursive: true })
  // 最小合法文件头即可通过 exists + 扩展名校验
  writeFileSync(wavPath, Buffer.from('RIFF'))
  writeFileSync(mp4Path, Buffer.from('ftyp'))
  writeFileSync(spacedMp4, Buffer.from('ftyp'))
})

afterAll(() => {
  rmSync(dir, { recursive: true, force: true })
})

describe('local-media URL roundtrip', () => {
  it('解析存在的 wav/mp4', () => {
    expect(queryResolveLocalMediaPath(wavPath)?.kind).toBe('audio')
    expect(queryResolveLocalMediaPath(mp4Path)?.kind).toBe('video')
  })

  it('生成 ?path= 查询串 URL，并可反解回绝对路径', () => {
    const url = queryLocalMediaUrl(mp4Path)
    expect(url).toMatch(/^media:\/\/local\/\?path=/)
    expect(url).toContain(encodeURIComponent(mp4Path))
    expect(queryPathFromMediaUrl(url!)).toBe(mp4Path)
  })

  it('含空格目录 Application Support 可 roundtrip', () => {
    const url = queryLocalMediaUrl(spacedMp4)
    expect(url).toBeTruthy()
    expect(queryPathFromMediaUrl(url!)).toBe(spacedMp4)
  })

  it('兼容 Chromium 规范化后的 pathname（丢失 %2F 编码）', () => {
    // 模拟旧 URL 被解成 media://local/Users/.../a.mp4
    const fake = `media://local${mp4Path.startsWith('/') ? '' : '/'}${mp4Path}`
    // mp4Path is absolute like /var/... → media://local/var/...
    const normalized = `media://local${mp4Path}`
    expect(queryPathFromMediaUrl(normalized)).toBe(mp4Path)
    expect(fake).toBe(normalized)
  })

  it('兼容旧版 encodeURIComponent 整段路径', () => {
    const legacy = `media://local/${encodeURIComponent(wavPath)}`
    expect(queryPathFromMediaUrl(legacy)).toBe(wavPath)
  })
})
