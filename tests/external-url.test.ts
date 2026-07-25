import { describe, expect, it } from 'vitest'
import {
  queryIsSafeExternalHttpUrl,
  queryNormalizeExternalHttpUrl,
  queryStripTrailingUrlPunctuation
} from '../shared/external-url'

describe('external-url', () => {
  it('接受合法 http(s) URL', () => {
    expect(queryNormalizeExternalHttpUrl('http://localhost:3000')).toBe('http://localhost:3000/')
    expect(queryIsSafeExternalHttpUrl('https://remotion.dev/docs')).toBe(true)
  })

  it('拒绝空协议、相对路径与非 http 协议', () => {
    expect(queryNormalizeExternalHttpUrl('https://')).toBeNull()
    expect(queryNormalizeExternalHttpUrl('http://')).toBeNull()
    expect(queryNormalizeExternalHttpUrl('/Users/wly/a.mp4')).toBeNull()
    expect(queryNormalizeExternalHttpUrl('file:///tmp/a.mp4')).toBeNull()
    expect(queryNormalizeExternalHttpUrl('media://local/x')).toBeNull()
    expect(queryNormalizeExternalHttpUrl('')).toBeNull()
  })

  it('剥离尾部中英文标点后再校验', () => {
    expect(queryStripTrailingUrlPunctuation('http://localhost:3000。')).toBe(
      'http://localhost:3000'
    )
    expect(queryNormalizeExternalHttpUrl('http://127.0.0.1:3123。')).toBe(
      'http://127.0.0.1:3123/'
    )
  })
})
