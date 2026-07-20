import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const imageToolsSource = readFileSync(
  new URL('../electron/main/agent/tools/image-tools.ts', import.meta.url),
  'utf8'
)
const indexSource = readFileSync(
  new URL('../electron/main/agent/tools/index.ts', import.meta.url),
  'utf8'
)
const promptsSource = readFileSync(
  new URL('../electron/main/agent/graph/prompts.ts', import.meta.url),
  'utf8'
)

describe('独立文生图工具 generate_image', () => {
  it('注册 generate_image 并调用 T2I Provider', () => {
    expect(imageToolsSource).toContain("name: 'generate_image'")
    expect(imageToolsSource).toContain('queryTextToImageProvider')
    expect(imageToolsSource).toContain('querySceneAssetsDir')
    expect(imageToolsSource).toContain('图片路径：')
    expect(indexSource).toContain('generateImageTool')
  })

  it('general 提示词要求用 generate_image 而非幻觉/网图', () => {
    expect(promptsSource).toContain('generate_image')
    expect(promptsSource).toContain('禁止用 fetch_web_images')
    expect(promptsSource).toContain('不能代替文生图')
  })
})
