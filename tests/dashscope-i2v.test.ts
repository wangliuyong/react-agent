import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const providerSource = readFileSync(
  new URL('../electron/main/media/provider.ts', import.meta.url),
  'utf8'
)
const i2vSource = readFileSync(
  new URL('../electron/main/media/dashscope-i2v.ts', import.meta.url),
  'utf8'
)

describe('百炼 I2V Provider 接入', () => {
  it('注册 dashscope-wan-i2v 并在有 Key 时激活', () => {
    expect(providerSource).toContain('queryDashscopeImageToVideoProvider()')
    expect(providerSource).toContain("activeI2v = hasDash ? 'dashscope-wan-i2v' : 'placeholder'")
    expect(providerSource).toContain('refreshActiveVideoProviders')
  })

  it('使用 wan2.2-i2v-flash 与 base64 img_url', () => {
    expect(i2vSource).toContain('wan2.2-i2v-flash')
    expect(i2vSource).toContain('img_url')
    expect(i2vSource).toContain('queryImageDataUrlFromFile')
    expect(i2vSource).toContain("id: 'dashscope-wan-i2v'")
  })
})
