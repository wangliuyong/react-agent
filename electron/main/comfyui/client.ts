/**
 * ComfyUI HTTP 客户端：上传参考图、提交 prompt、轮询 history、下载 view。
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { basename, dirname, join } from 'path'
import { randomUUID } from 'crypto'
import { queryHttp, queryHttpJson, HttpError } from '../net/http-client'
import { querySettings } from '../store/settings'
import type { ComfyUiStatusResult } from '../../../shared/ai-video'

export interface ComfyUploadResult {
  name: string
  subfolder: string
  type: string
}

export interface ComfyHistoryOutputs {
  [nodeId: string]: {
    images?: Array<{ filename: string; subfolder: string; type: string }>
    gifs?: Array<{ filename: string; subfolder: string; type: string }>
    videos?: Array<{ filename: string; subfolder: string; type: string }>
  }
}

/** 读取设置中的 ComfyUI baseUrl */
export function queryComfyBaseUrl(): string {
  const settings = querySettings()
  const url = settings.comfyUi?.baseUrl?.trim() || 'http://127.0.0.1:8188'
  return url.replace(/\/+$/, '')
}

/** 健康检查：优先 /system_stats，失败再试根路径 */
export async function queryComfyUiStatus(): Promise<ComfyUiStatusResult> {
  const baseUrl = queryComfyBaseUrl()
  const settings = querySettings()
  if (settings.comfyUi && settings.comfyUi.enabled === false) {
    return { ok: false, baseUrl, message: 'ComfyUI 连接已在设置中关闭' }
  }
  try {
    await queryHttp(`${baseUrl}/system_stats`, { timeoutMs: 8_000, retries: 0 })
    return { ok: true, baseUrl, message: '连接成功' }
  } catch (err1) {
    try {
      await queryHttp(`${baseUrl}/`, { timeoutMs: 8_000, retries: 0 })
      return { ok: true, baseUrl, message: '连接成功（根路径）' }
    } catch (err2) {
      const msg =
        err2 instanceof Error
          ? err2.message
          : err1 instanceof Error
            ? err1.message
            : String(err2)
      return { ok: false, baseUrl, message: `连接失败：${msg}` }
    }
  }
}

/**
 * 上传本地图片到 ComfyUI input 目录。
 * 使用 multipart/form-data；Node 18+ FormData + Blob。
 */
export async function postComfyUploadImage(
  localPath: string,
  options?: { overwrite?: boolean; baseUrl?: string }
): Promise<ComfyUploadResult> {
  const baseUrl = options?.baseUrl ?? queryComfyBaseUrl()
  if (!existsSync(localPath)) {
    throw new Error(`参考图不存在：${localPath}`)
  }
  const fileName = basename(localPath).replace(/[^\w.\-]+/g, '_')
  const buffer = await import('fs/promises').then((fs) => fs.readFile(localPath))
  const form = new FormData()
  form.append('image', new Blob([new Uint8Array(buffer)]), fileName)
  form.append('type', 'input')
  form.append('overwrite', options?.overwrite === false ? 'false' : 'true')

  const res = await fetch(`${baseUrl}/upload/image`, {
    method: 'POST',
    body: form
  })
  if (!res.ok) {
    throw new HttpError(`上传图片失败 HTTP ${res.status}`, res.status, `${baseUrl}/upload/image`)
  }
  const json = (await res.json()) as ComfyUploadResult
  if (!json?.name) {
    throw new Error('上传图片响应缺少 name 字段')
  }
  return json
}

/** 提交工作流到队列，返回 prompt_id；失败时带上 ComfyUI 错误正文 */
export async function postComfyPrompt(
  workflow: Record<string, unknown>,
  options?: { clientId?: string; baseUrl?: string }
): Promise<string> {
  const baseUrl = options?.baseUrl ?? queryComfyBaseUrl()
  const clientId = options?.clientId ?? `lingxi-${randomUUID()}`
  const url = `${baseUrl}/prompt`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify({ prompt: workflow, client_id: clientId })
  })
  const text = await res.text()
  let json: { prompt_id?: string; error?: { message?: string; type?: string; details?: string }; node_errors?: unknown } = {}
  try {
    json = text ? (JSON.parse(text) as typeof json) : {}
  } catch {
    /* 非 JSON */
  }
  if (!res.ok) {
    const detail =
      json.error?.message ||
      json.error?.details ||
      (typeof json.error === 'string' ? json.error : '') ||
      text.slice(0, 500) ||
      `HTTP ${res.status}`
    const nodeErr =
      json.node_errors && Object.keys(json.node_errors as object).length
        ? `；节点错误：${JSON.stringify(json.node_errors).slice(0, 400)}`
        : ''
    throw new HttpError(`ComfyUI /prompt 失败：${detail}${nodeErr}`, res.status, url)
  }
  if (!json.prompt_id) {
    throw new Error(`ComfyUI /prompt 未返回 prompt_id：${text.slice(0, 500)}`)
  }
  return json.prompt_id
}

/** 轮询 history 直至完成或超时 */
export async function queryComfyWaitResult(
  promptId: string,
  options?: {
    intervalMs?: number
    timeoutMs?: number
    baseUrl?: string
    signal?: AbortSignal
  }
): Promise<ComfyHistoryOutputs> {
  const baseUrl = options?.baseUrl ?? queryComfyBaseUrl()
  const intervalMs = options?.intervalMs ?? 1_200
  const timeoutMs = options?.timeoutMs ?? 15 * 60_000
  const start = Date.now()

  while (true) {
    if (options?.signal?.aborted) {
      throw new Error('已取消 ComfyUI 任务等待')
    }
    if (Date.now() - start > timeoutMs) {
      throw new Error(`ComfyUI 任务超时（${Math.round(timeoutMs / 1000)}s）：${promptId}`)
    }
    const history = await queryHttpJson<Record<string, { outputs?: ComfyHistoryOutputs }>>(
      `${baseUrl}/history/${promptId}`,
      { timeoutMs: 20_000, signal: options?.signal }
    )
    if (history && promptId in history) {
      return history[promptId]?.outputs ?? {}
    }
    await new Promise((r) => setTimeout(r, intervalMs))
  }
}

/** 从 outputs 取出第一张图片或视频文件描述 */
export function queryComfyFirstMedia(
  outputs: ComfyHistoryOutputs
): { filename: string; subfolder: string; type: string; kind: 'image' | 'video' } | null {
  for (const nodeOut of Object.values(outputs)) {
    if (nodeOut.images?.length) {
      const img = nodeOut.images[0]
      return { ...img, kind: 'image' }
    }
    if (nodeOut.gifs?.length) {
      const g = nodeOut.gifs[0]
      return { ...g, kind: 'video' }
    }
    if (nodeOut.videos?.length) {
      const v = nodeOut.videos[0]
      return { ...v, kind: 'video' }
    }
  }
  return null
}

/** 下载 /view 到本地路径 */
export async function queryComfyDownloadView(
  info: { filename: string; subfolder?: string; type?: string },
  destPath: string,
  options?: { baseUrl?: string }
): Promise<string> {
  const baseUrl = options?.baseUrl ?? queryComfyBaseUrl()
  const params = new URLSearchParams({
    filename: info.filename,
    type: info.type || 'output',
    subfolder: info.subfolder || ''
  })
  const res = await queryHttp(`${baseUrl}/view?${params.toString()}`, {
    timeoutMs: 120_000
  })
  const buf = Buffer.from(await res.arrayBuffer())
  mkdirSync(dirname(destPath), { recursive: true })
  writeFileSync(destPath, buf)
  return destPath
}

/** 提交工作流并下载第一个媒体产物到 destDir */
export async function postComfyRunAndDownload(params: {
  workflow: Record<string, unknown>
  destDir: string
  filePrefix?: string
  signal?: AbortSignal
  baseUrl?: string
}): Promise<{ localPath: string; mediaType: 'image' | 'video'; promptId: string }> {
  const promptId = await postComfyPrompt(params.workflow, { baseUrl: params.baseUrl })
  const outputs = await queryComfyWaitResult(promptId, {
    signal: params.signal,
    baseUrl: params.baseUrl
  })
  const media = queryComfyFirstMedia(outputs)
  if (!media) {
    throw new Error('ComfyUI 任务完成但未找到图片/视频输出')
  }
  const ext = media.filename.includes('.')
    ? media.filename.slice(media.filename.lastIndexOf('.'))
    : media.kind === 'video'
      ? '.mp4'
      : '.png'
  const destPath = join(
    params.destDir,
    `${params.filePrefix ?? 'out'}_${Date.now()}${ext}`
  )
  await queryComfyDownloadView(media, destPath, { baseUrl: params.baseUrl })
  return { localPath: destPath, mediaType: media.kind, promptId }
}
