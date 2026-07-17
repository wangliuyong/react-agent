/**
 * 百炼异步任务公共逻辑：创建任务、轮询、下载产物。
 * 文生图 / 图生视频 / 文生视频共用。
 */

import { createWriteStream, mkdirSync, readFileSync } from 'fs'
import { dirname, extname } from 'path'
import { pipeline } from 'stream/promises'
import { Readable } from 'stream'
import { queryHttp, queryHttpJson } from '../net/http-client'
import { querySettings } from '../store/settings'
import { queryModelConnection } from '../../../shared/types'

export const DASHSCOPE_TASK_URL = 'https://dashscope.aliyuncs.com/api/v1/tasks'
export const DASHSCOPE_VIDEO_SYNTHESIS_URL =
  'https://dashscope.aliyuncs.com/api/v1/services/aigc/video-generation/video-synthesis'

interface DashscopeTaskCreateResponse {
  output?: { task_id?: string; task_status?: string }
  code?: string
  message?: string
}

export interface DashscopeTaskQueryResponse {
  output?: {
    task_status?: string
    video_url?: string
    results?: Array<{ url?: string; code?: string; message?: string }>
  }
  code?: string
  message?: string
}

/** 解析设置里可用的百炼 Key（优先 video 角色连接） */
export function queryDashscopeApiKey(): string | null {
  const settings = querySettings()
  const connection = queryModelConnection(settings, 'video')
  if (connection.provider === 'dashscope' && connection.apiKey.trim()) {
    return connection.apiKey.trim()
  }
  const dash = settings.connections?.find(
    (c) => c.provider === 'dashscope' && c.apiKey.trim()
  )
  if (dash) return dash.apiKey.trim()
  if (settings.provider === 'dashscope' && settings.apiKey.trim()) {
    return settings.apiKey.trim()
  }
  return null
}

/** 创建百炼异步任务，返回 task_id */
export async function postCreateAsyncTask(
  url: string,
  body: Record<string, unknown>,
  apiKey: string
): Promise<string> {
  const created = await queryHttpJson<DashscopeTaskCreateResponse>(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'X-DashScope-Async': 'enable'
    },
    body,
    timeoutMs: 30_000
  })

  const taskId = created.output?.task_id
  if (!taskId) {
    throw new Error(created.message || created.code || '创建异步任务失败（无 task_id）')
  }
  return taskId
}

export interface WaitTaskOptions {
  maxAttempts?: number
  pollIntervalMs?: number
}

/** 轮询任务直到成功，返回完整 query 响应 */
export async function queryWaitTaskResult(
  taskId: string,
  apiKey: string,
  options: WaitTaskOptions = {}
): Promise<DashscopeTaskQueryResponse> {
  const maxAttempts = options.maxAttempts ?? 40
  const pollIntervalMs = options.pollIntervalMs ?? 1500

  for (let i = 0; i < maxAttempts; i++) {
    const data = await queryHttpJson<DashscopeTaskQueryResponse>(
      `${DASHSCOPE_TASK_URL}/${taskId}`,
      {
        headers: { Authorization: `Bearer ${apiKey}` },
        timeoutMs: 30_000
      }
    )
    const status = data.output?.task_status
    if (status === 'SUCCEEDED') return data
    if (status === 'FAILED' || status === 'CANCELED' || status === 'UNKNOWN') {
      throw new Error(data.output?.results?.[0]?.message || data.message || `任务失败：${status}`)
    }
    await new Promise((r) => setTimeout(r, pollIntervalMs))
  }
  throw new Error('异步任务超时，请稍后重试')
}

/** 从任务结果中提取图片或视频 URL */
export function queryResultUrl(data: DashscopeTaskQueryResponse): string {
  const videoUrl = data.output?.video_url
  if (videoUrl) return videoUrl
  const imageUrl = data.output?.results?.[0]?.url
  if (!imageUrl) throw new Error('任务成功但未返回产物 URL')
  return imageUrl
}

/** 下载远程文件到本地 */
export async function postDownloadFile(url: string, outputPath: string): Promise<void> {
  mkdirSync(dirname(outputPath), { recursive: true })
  const res = await queryHttp(url, { timeoutMs: 120_000 })
  const body = res.body
  if (!body) throw new Error('下载响应无 body')
  const nodeStream = Readable.fromWeb(body as import('stream/web').ReadableStream)
  await pipeline(nodeStream, createWriteStream(outputPath))
}

/** 本地图片转 base64 data URL，供万相 I2V img_url 使用 */
export function queryImageDataUrlFromFile(imagePath: string): string {
  const ext = extname(imagePath).toLowerCase()
  const mimeMap: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.gif': 'image/gif'
  }
  const mime = mimeMap[ext] ?? 'image/png'
  const buf = readFileSync(imagePath)
  return `data:${mime};base64,${buf.toString('base64')}`
}
