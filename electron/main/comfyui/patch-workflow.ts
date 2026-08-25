/**
 * ComfyUI API 工作流参数补丁：按 class_type 注入提示词与参考图文件名。
 */

export interface ComfyWorkflowPatch {
  /** 正向提示词 */
  positivePrompt?: string
  /** 负面提示词 */
  negativePrompt?: string
  /** 按顺序填入 LoadImage 节点的服务端文件名 */
  referenceImageNames?: string[]
  /** 额外按节点 id 覆盖 inputs */
  nodeInputs?: Record<string, Record<string, unknown>>
}

interface ComfyNodeDef {
  class_type?: string
  inputs?: Record<string, unknown>
}

function isNodeMap(wf: Record<string, unknown>): boolean {
  const first = Object.values(wf)[0]
  return Boolean(first && typeof first === 'object' && 'class_type' in (first as object))
}

/** 收集指定 class_type 的节点 id（按数字 id 排序） */
export function queryNodesByClassType(
  workflow: Record<string, unknown>,
  classTypes: string[]
): string[] {
  const set = new Set(classTypes)
  const ids = Object.keys(workflow).filter((id) => {
    const node = workflow[id] as ComfyNodeDef | undefined
    return node?.class_type && set.has(node.class_type)
  })
  return ids.sort((a, b) => Number(a) - Number(b) || a.localeCompare(b))
}

/**
 * 启发式注入：CLIPTextEncode 第一个作正向、第二个作负向；
 * LoadImage 按顺序填入参考图；API 包装节点上常见 text/prompt/image 字段。
 */
export function postPatchComfyWorkflow(
  workflow: Record<string, unknown>,
  patch: ComfyWorkflowPatch
): Record<string, unknown> {
  if (!isNodeMap(workflow)) {
    throw new Error('工作流不是 ComfyUI API 节点 map')
  }
  const wf = structuredClone(workflow) as Record<string, ComfyNodeDef>

  const textEncodeIds = queryNodesByClassType(wf as unknown as Record<string, unknown>, [
    'CLIPTextEncode',
    'TextEncodeQwenImageEditPlus',
    'CLIPTextEncodeFlux'
  ])
  if (patch.positivePrompt != null && textEncodeIds[0]) {
    const node = wf[textEncodeIds[0]]
    if (node.inputs) {
      if ('text' in node.inputs) node.inputs.text = patch.positivePrompt
      else if ('prompt' in node.inputs) node.inputs.prompt = patch.positivePrompt
    }
  }
  if (patch.negativePrompt != null && textEncodeIds[1]) {
    const node = wf[textEncodeIds[1]]
    if (node.inputs && 'text' in node.inputs) {
      node.inputs.text = patch.negativePrompt
    }
  }

  // API / Primitive 文本槽
  if (patch.positivePrompt != null) {
    for (const node of Object.values(wf)) {
      if (!node.inputs) continue
      const ct = node.class_type || ''
      if (ct === 'PrimitiveStringMultiline' || ct === 'PrimitiveString') {
        if ('value' in node.inputs) {
          node.inputs.value = patch.positivePrompt
        }
        continue
      }
      if (!/Api|API|MiniMax|Wan|Kling|Seedance/i.test(ct) && !ct.includes('Text')) continue
      if ('text' in node.inputs && (node.inputs.text == null || node.inputs.text === '')) {
        node.inputs.text = patch.positivePrompt
      }
      if ('prompt' in node.inputs && (node.inputs.prompt == null || node.inputs.prompt === '')) {
        node.inputs.prompt = patch.positivePrompt
      }
      if (
        'positive_prompt' in node.inputs &&
        (node.inputs.positive_prompt == null || node.inputs.positive_prompt === '')
      ) {
        node.inputs.positive_prompt = patch.positivePrompt
      }
    }
  }

  const loadImageIds = queryNodesByClassType(wf as unknown as Record<string, unknown>, [
    'LoadImage',
    'LoadImageFromUrl',
    'LoadImageMask'
  ])
  const refs = patch.referenceImageNames ?? []
  for (let i = 0; i < Math.min(loadImageIds.length, refs.length); i++) {
    const node = wf[loadImageIds[i]]
    if (node.inputs && 'image' in node.inputs) {
      node.inputs.image = refs[i]
    }
  }

  // 常见 API 节点单图字段
  if (refs[0]) {
    for (const node of Object.values(wf)) {
      if (!node.inputs) continue
      for (const key of ['image', 'first_frame_image', 'subject_image', 'ref_image']) {
        if (key in node.inputs && (node.inputs[key] == null || node.inputs[key] === '')) {
          node.inputs[key] = refs[0]
        }
      }
    }
  }

  if (patch.nodeInputs) {
    for (const [nodeId, inputs] of Object.entries(patch.nodeInputs)) {
      const node = wf[nodeId]
      if (!node) continue
      node.inputs = { ...(node.inputs ?? {}), ...inputs }
    }
  }

  return wf as unknown as Record<string, unknown>
}

/**
 * 从工作流 JSON 提取可注入槽位摘要，供 LLM 分析生成补丁。
 */
export function queryComfyWorkflowSlots(workflow: Record<string, unknown>): {
  loadImageNodeIds: string[]
  textEncodeNodeIds: string[]
  classTypes: string[]
} {
  const loadImageNodeIds = queryNodesByClassType(workflow, [
    'LoadImage',
    'LoadImageFromUrl',
    'LoadImageMask'
  ])
  const textEncodeNodeIds = queryNodesByClassType(workflow, [
    'CLIPTextEncode',
    'TextEncodeQwenImageEditPlus',
    'CLIPTextEncodeFlux'
  ])
  const classTypes = Array.from(
    new Set(
      Object.values(workflow)
        .map((n) => (n as ComfyNodeDef)?.class_type)
        .filter(Boolean) as string[]
    )
  )
  return { loadImageNodeIds, textEncodeNodeIds, classTypes }
}
