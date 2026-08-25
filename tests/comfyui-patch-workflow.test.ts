/**
 * ComfyUI 工作流参数补丁单元测试。
 */

import { describe, expect, it } from 'vitest'
import { postPatchComfyWorkflow, queryComfyWorkflowSlots } from '../electron/main/comfyui/patch-workflow'

describe('postPatchComfyWorkflow', () => {
  it('注入正向提示词与参考图文件名', () => {
    const wf = {
      '1001': {
        class_type: 'LoadImage',
        inputs: { image: 'old.png' }
      },
      '1006': {
        class_type: 'CLIPTextEncode',
        inputs: { text: null as string | null }
      },
      '1007': {
        class_type: 'CLIPTextEncode',
        inputs: { text: 'neg' }
      }
    }
    const patched = postPatchComfyWorkflow(wf, {
      positivePrompt: 'a cat',
      negativePrompt: 'blurry',
      referenceImageNames: ['ref_a.png']
    }) as typeof wf

    expect(patched['1006'].inputs.text).toBe('a cat')
    expect(patched['1007'].inputs.text).toBe('blurry')
    expect(patched['1001'].inputs.image).toBe('ref_a.png')
  })

  it('queryComfyWorkflowSlots 列出槽位', () => {
    const slots = queryComfyWorkflowSlots({
      '3': { class_type: 'LoadImage', inputs: {} },
      '6': { class_type: 'CLIPTextEncode', inputs: {} }
    })
    expect(slots.loadImageNodeIds).toEqual(['3'])
    expect(slots.textEncodeNodeIds).toEqual(['6'])
  })
})
