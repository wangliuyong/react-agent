import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const providerSource = readFileSync(
  new URL('../electron/main/media/provider.ts', import.meta.url),
  'utf8'
)
const ttsSource = readFileSync(
  new URL('../electron/main/media/dashscope-tts.ts', import.meta.url),
  'utf8'
)

describe('百炼 TTS Provider 接入', () => {
  it('注册 dashscope-qwen-tts 并在有 Key 时激活', () => {
    expect(providerSource).toContain("queryDashscopeTextToSpeechProvider()")
    expect(providerSource).toContain("activeTts = hasDash ? 'dashscope-qwen-tts' : 'placeholder'")
    expect(providerSource).toContain('refreshActiveTextToSpeechProvider')
  })

  it('使用 qwen3-tts-flash 非流式 HTTP API', () => {
    expect(ttsSource).toContain('qwen3-tts-flash')
    expect(ttsSource).toContain('multimodal-generation/generation')
    expect(ttsSource).toContain("id: 'dashscope-qwen-tts'")
  })
})
