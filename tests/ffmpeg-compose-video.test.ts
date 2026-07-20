import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const providerSource = readFileSync(
  new URL('../electron/main/media/provider.ts', import.meta.url),
  'utf8'
)
const videoToolsSource = readFileSync(
  new URL('../electron/main/agent/tools/video-tools.ts', import.meta.url),
  'utf8'
)

describe('ffmpeg 合成视频片段', () => {
  it('provider 区分视频与静图 concat 逻辑', () => {
    expect(providerSource).toContain('queryIsVideoPath')
    expect(providerSource).toContain('audio-concat')
    expect(providerSource).toContain('audioPaths')
  })

  it('compose 参数先列齐全部 -i，再写 -filter:v', () => {
    // 从 compose 参数组装处截取，避免误匹配其它 ffmpeg 调用
    const composeBlock = providerSource.slice(
      providerSource.indexOf('// ffmpeg 顺序'),
      providerSource.indexOf('const run = await postRunFfmpeg(args)')
    )
    expect(composeBlock).toContain("...(hasAudio ? ['-i', mergedAudio as string] : [])")
    expect(composeBlock).toContain("'-filter:v'")
    expect(composeBlock.indexOf("'-i'")).toBeLessThan(composeBlock.indexOf("'-filter:v'"))
    expect(composeBlock.indexOf("hasAudio ? ['-i'")).toBeLessThan(
      composeBlock.indexOf("'-filter:v'")
    )
    // 禁止再把音频 -i splice 到输出选项中间
    expect(composeBlock).not.toContain('args.splice')
  })

  it('generate_scene_assets 走 I2V 失败后 T2V 兜底', () => {
    expect(videoToolsSource).toContain('i2v.generate')
    expect(videoToolsSource).toContain('t2v.generate')
    expect(videoToolsSource).toContain('sceneVideoPaths')
  })
})
