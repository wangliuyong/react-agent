/**
 * 工作流规范化单元测试。
 */

import { describe, expect, it } from 'vitest'
import {
  postEnsureComfyOutputNodes,
  queryResolveWorkflowRelativePath
} from '../electron/main/comfyui/normalize-workflow'

describe('normalize-workflow', () => {
  it('缺 SaveImage 时自动挂到 VAEDecode', () => {
    const wf = {
      '1004': {
        class_type: 'VAEDecode',
        inputs: { samples: ['1009', 0], vae: ['1002', 0] }
      }
    }
    const next = postEnsureComfyOutputNodes(wf) as Record<
      string,
      { class_type: string; inputs: { images?: unknown; filename_prefix?: string } }
    >
    const save = Object.values(next).find((n) => n.class_type === 'SaveImage')
    expect(save).toBeTruthy()
    expect(save?.inputs.images).toEqual(['1004', 0])
  })

  it('蓝图 Z-Image 路径改写到 user 实装', () => {
    expect(
      queryResolveWorkflowRelativePath('blueprints/Text to Image (Z-Image-Turbo).json')
    ).toBe('user/image_z_image_turbo.json')
  })

  it('Flux USO 路径改写到 Z-Image 图生图', () => {
    expect(
      queryResolveWorkflowRelativePath('user/flux1_dev_uso_reference_image_gen.json')
    ).toBe('user/image_z_image_turbo_i2i.json')
  })
})
