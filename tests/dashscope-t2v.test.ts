import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const providerSource = readFileSync(
  new URL('../electron/main/media/provider.ts', import.meta.url),
  'utf8'
)
const t2vSource = readFileSync(
  new URL('../electron/main/media/dashscope-t2v.ts', import.meta.url),
  'utf8'
)

describe('百炼 T2V Provider 接入', () => {
  it('注册 dashscope-wan-t2v 并在有 Key 时激活', () => {
    expect(providerSource).toContain('queryDashscopeTextToVideoProvider()')
    expect(providerSource).toContain("activeT2v = hasDash ? 'dashscope-wan-t2v' : 'placeholder'")
    expect(providerSource).toContain('queryTextToVideoProvider')
  })

  it('请求体含 negative_prompt 与 ratio', () => {
    expect(t2vSource).toContain('negative_prompt')
    expect(t2vSource).toContain('ratio')
    expect(t2vSource).toContain('wan2.6-t2v')
    expect(t2vSource).toContain("id: 'dashscope-wan-t2v'")
  })
})
