/**
 * ComfyUI 工作流规范化：补齐 null 必填项、确保存在输出节点。
 * blueprints 多为模板占位（null），直接 /prompt 会 400（prompt_no_outputs / 缺模型名）。
 */

import { queryComfyBaseUrl } from './client'
import { queryHttpJson } from '../net/http-client'

interface ComfyNodeDef {
  class_type?: string
  inputs?: Record<string, unknown>
}

/** Z-Image Turbo 在远程机上的已知可用权重（与 user/image_z_image_turbo.json 对齐） */
const Z_IMAGE_DEFAULTS = {
  unet_name: 'z_image_turbo_bf16.safetensors',
  clip_name: 'qwen_3_4b.safetensors',
  vae_name: 'ae.safetensors',
  width: 1024,
  height: 1024,
  steps: 8,
  seed: 0
} as const

/** 数值类 null 的通用默认 */
const NUMERIC_DEFAULTS: Record<string, number> = {
  width: 1024,
  height: 1024,
  steps: 8,
  seed: 0,
  noise_seed: 0,
  cfg: 1,
  denoise: 1,
  batch_size: 1,
  shift: 3
}

function queryMaxNodeId(workflow: Record<string, ComfyNodeDef>): number {
  let max = 0
  for (const id of Object.keys(workflow)) {
    const n = Number(id)
    if (Number.isFinite(n) && n > max) max = n
  }
  return max
}

function queryHasOutputNode(workflow: Record<string, ComfyNodeDef>): boolean {
  const outputTypes = new Set([
    'SaveImage',
    'SaveVideo',
    'SaveAnimatedWEBP',
    'SaveAnimatedPNG',
    'VHS_VideoCombine',
    'PreviewImage',
    'PreviewVideo'
  ])
  return Object.values(workflow).some((n) => n.class_type && outputTypes.has(n.class_type))
}

/** 若只有 VAEDecode / CreateVideo 而无 Save*，自动挂输出节点，避免 prompt_no_outputs */
export function postEnsureComfyOutputNodes(
  workflow: Record<string, unknown>
): Record<string, unknown> {
  const wf = structuredClone(workflow) as Record<string, ComfyNodeDef>
  if (queryHasOutputNode(wf)) return wf as unknown as Record<string, unknown>

  let nextId = queryMaxNodeId(wf) + 1

  // 优先挂 SaveImage 到 VAEDecode
  const decodeIds = Object.keys(wf).filter((id) => wf[id]?.class_type === 'VAEDecode')
  for (const decodeId of decodeIds) {
    const id = String(nextId++)
    wf[id] = {
      class_type: 'SaveImage',
      inputs: {
        images: [decodeId, 0],
        filename_prefix: 'lingxi/ai-video'
      }
    }
  }

  // CreateVideo → SaveVideo
  const createVideoIds = Object.keys(wf).filter((id) => wf[id]?.class_type === 'CreateVideo')
  for (const videoId of createVideoIds) {
    const id = String(nextId++)
    wf[id] = {
      class_type: 'SaveVideo',
      inputs: {
        video: [videoId, 0],
        filename_prefix: 'lingxi/ai-video',
        format: 'auto',
        codec: 'auto'
      }
    }
  }

  if (!queryHasOutputNode(wf)) {
    throw new Error(
      '工作流缺少输出节点（SaveImage/SaveVideo）。请改用 user/ 下已带输出的工作流，或在 ComfyUI 中另存 API 格式。'
    )
  }

  return wf as unknown as Record<string, unknown>
}

/**
 * 填充 null / 空字符串必填项。
 * 优先 Z-Image 已知权重；其余数值用通用默认；模型名可从远程 /models 选第一个。
 */
export async function postFillNullComfyInputs(
  workflow: Record<string, unknown>,
  options?: { baseUrl?: string; preferZImage?: boolean }
): Promise<Record<string, unknown>> {
  const wf = structuredClone(workflow) as Record<string, ComfyNodeDef>
  const preferZImage = options?.preferZImage !== false

  // 缓存远程模型列表（失败则跳过）
  const modelCache = new Map<string, string[]>()
  const queryModels = async (folder: string): Promise<string[]> => {
    if (modelCache.has(folder)) return modelCache.get(folder)!
    try {
      const baseUrl = options?.baseUrl ?? queryComfyBaseUrl()
      const list = await queryHttpJson<string[]>(`${baseUrl}/models/${folder}`, {
        timeoutMs: 8_000,
        retries: 0
      })
      const names = Array.isArray(list) ? list.map(String) : []
      modelCache.set(folder, names)
      return names
    } catch {
      modelCache.set(folder, [])
      return []
    }
  }

  const pickModel = async (
    folder: string,
    preferred?: string
  ): Promise<string | undefined> => {
    const list = await queryModels(folder)
    if (preferred && list.includes(preferred)) return preferred
    // 模糊匹配 preferred 关键字
    if (preferred) {
      const key = preferred.replace(/\.[^.]+$/, '').toLowerCase()
      const hit = list.find((n) => n.toLowerCase().includes(key.split('_')[0] || key))
      if (hit) return hit
    }
    return list[0]
  }

  for (const node of Object.values(wf)) {
    if (!node?.inputs || !node.class_type) continue
    const inputs = node.inputs
    const ct = node.class_type

    for (const [key, value] of Object.entries(inputs)) {
      if (value !== null && value !== '') continue

      if (key in NUMERIC_DEFAULTS && typeof NUMERIC_DEFAULTS[key] === 'number') {
        inputs[key] = NUMERIC_DEFAULTS[key]
        continue
      }

      if (ct === 'UNETLoader' && key === 'unet_name') {
        inputs[key] =
          (await pickModel(
            'unet',
            preferZImage ? Z_IMAGE_DEFAULTS.unet_name : undefined
          )) ?? Z_IMAGE_DEFAULTS.unet_name
        continue
      }
      if (ct === 'CLIPLoader' && key === 'clip_name') {
        inputs[key] =
          (await pickModel(
            'clip',
            preferZImage ? Z_IMAGE_DEFAULTS.clip_name : undefined
          )) ?? Z_IMAGE_DEFAULTS.clip_name
        continue
      }
      if (ct === 'VAELoader' && key === 'vae_name') {
        inputs[key] =
          (await pickModel(
            'vae',
            preferZImage ? Z_IMAGE_DEFAULTS.vae_name : undefined
          )) ?? Z_IMAGE_DEFAULTS.vae_name
        continue
      }
      if (ct === 'CheckpointLoaderSimple' && key === 'ckpt_name') {
        inputs[key] = (await pickModel('checkpoints')) ?? 'v1-5-pruned-emaonly.safetensors'
        continue
      }
    }

    // EmptySD3LatentImage 尺寸
    if (ct === 'EmptySD3LatentImage') {
      if (inputs.width == null) inputs.width = Z_IMAGE_DEFAULTS.width
      if (inputs.height == null) inputs.height = Z_IMAGE_DEFAULTS.height
    }
  }

  return wf as unknown as Record<string, unknown>
}

/** 一站式规范化：填 null → 保证输出节点 */
export async function postNormalizeComfyWorkflow(
  workflow: Record<string, unknown>,
  options?: { baseUrl?: string; preferZImage?: boolean }
): Promise<Record<string, unknown>> {
  const filled = await postFillNullComfyInputs(workflow, options)
  return postEnsureComfyOutputNodes(filled)
}

/**
 * 将易失败的蓝图路径改写为仓库内已填好权重的 user 工作流。
 */
export function queryResolveWorkflowRelativePath(relativePath: string): string {
  const normalized = relativePath.replace(/\\/g, '/')
  if (
    normalized === 'blueprints/Text to Image (Z-Image-Turbo).json' ||
    normalized.endsWith('/Text to Image (Z-Image-Turbo).json') ||
    normalized === 'user/Text_to_Image_Z-Image-Turbo.json'
  ) {
    return 'user/image_z_image_turbo.json'
  }
  // 远程常见未装 Flux USO；参考图链路改到 Z-Image 图生图
  if (
    normalized === 'user/flux1_dev_uso_reference_image_gen.json' ||
    normalized.endsWith('flux1_dev_uso_reference_image_gen.json')
  ) {
    return 'user/image_z_image_turbo_i2i.json'
  }
  return normalized
}

/**
 * 检查工作流引用的本地模型文件是否在 ComfyUI 上存在。
 * 缺模型则返回缺失列表（用于回退到 Z-Image）。
 */
export async function queryMissingComfyModels(
  workflow: Record<string, unknown>,
  options?: { baseUrl?: string }
): Promise<string[]> {
  const baseUrl = options?.baseUrl ?? queryComfyBaseUrl()
  const folderByKey: Record<string, string> = {
    unet_name: 'unet',
    clip_name: 'clip',
    vae_name: 'vae',
    ckpt_name: 'checkpoints',
    lora_name: 'loras',
    control_net_name: 'controlnet'
  }
  const needed = new Map<string, Set<string>>()
  for (const node of Object.values(workflow) as Array<{ inputs?: Record<string, unknown> }>) {
    if (!node?.inputs) continue
    for (const [key, val] of Object.entries(node.inputs)) {
      const folder = folderByKey[key]
      if (!folder || typeof val !== 'string' || !val.trim()) continue
      if (!needed.has(folder)) needed.set(folder, new Set())
      needed.get(folder)!.add(val)
    }
  }
  const missing: string[] = []
  for (const [folder, names] of needed) {
    let available: string[] = []
    try {
      available = await queryHttpJson<string[]>(`${baseUrl}/models/${folder}`, {
        timeoutMs: 8_000,
        retries: 0
      })
    } catch {
      continue
    }
    const set = new Set(available)
    for (const name of names) {
      if (!set.has(name)) missing.push(`${folder}/${name}`)
    }
  }
  return missing
}
