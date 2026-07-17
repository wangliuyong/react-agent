/**
 * 阿里云百炼万相文生图 Provider（异步任务 + 轮询）。
 * 文档：https://help.aliyun.com/zh/model-studio/text-to-image-v2-api-reference
 */

import { createWriteStream } from 'fs'
import { mkdirSync } from 'fs'
import { dirname } from 'path'
import { pipeline } from 'stream/promises'
import { Readable } from 'stream'
import { queryHttpJson, queryHttp } from '../net/http-client'
import { querySettings } from '../store/settings'
import { queryModelConnection } from '../../../shared/types'
import type { MediaProviderResult, TextToImageProvider } from './provider'

const CREATE_URL =
  'https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis'
const TASK_URL = 'https://dashscope.aliyuncs.com/api/v1/tasks'

interface DashscopeTaskCreateResponse {
  output?: { task_id?: string; task_status?: string }
  code?: string
  message?: string
}

interface DashscopeTaskQueryResponse {
  output?: {
    task_status?: string
    results?: Array<{ url?: string; code?: string; message?: string }>
  }
  code?: string
  message?: string
}

async function postDownloadImage(url: string, outputPath: string): Promise<void> {
  mkdirSync(dirname(outputPath), { recursive: true })
  const res = await queryHttp(url, { timeoutMs: 60_000 })
  const body = res.body
  if (!body) throw new Error('图片下载响应无 body')
  // Node fetch body → Node Readable
  const nodeStream = Readable.fromWeb(body as import('stream/web').ReadableStream)
  await pipeline(nodeStream, createWriteStream(outputPath))
}

async function queryWaitTask(
  taskId: string,
  apiKey: string,
  maxAttempts = 40
): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    const data = await queryHttpJson<DashscopeTaskQueryResponse>(`${TASK_URL}/${taskId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      timeoutMs: 30_000
    })
    const status = data.output?.task_status
    if (status === 'SUCCEEDED') {
      const url = data.output?.results?.[0]?.url
      if (!url) throw new Error('文生图成功但未返回图片 URL')
      return url
    }
    if (status === 'FAILED' || status === 'CANCELED' || status === 'UNKNOWN') {
      throw new Error(data.output?.results?.[0]?.message || data.message || `任务失败：${status}`)
    }
    await new Promise((r) => setTimeout(r, 1500))
  }
  throw new Error('文生图任务超时，请稍后重试')
}

/** 使用默认连接中的百炼 Key 调用 wanx2.1-t2i-turbo */
export function queryDashscopeTextToImageProvider(): TextToImageProvider {
  return {
    id: 'dashscope-wanx',
    async generate(req): Promise<MediaProviderResult> {
      const settings = querySettings()
      const connection = queryModelConnection(settings, 'video')
      const apiKey = connection.apiKey.trim()
      if (!apiKey || connection.provider !== 'dashscope') {
        // 若默认连接不是百炼，尝试任意一条 dashscope 连接
        const dash = settings.connections?.find(
          (c) => c.provider === 'dashscope' && c.apiKey.trim()
        )
        if (!dash) {
          return {
            ok: false,
            message: '未找到已配置 API Key 的百炼连接，无法调用万相文生图'
          }
        }
        return postGenerateWithKey(dash.apiKey.trim(), req)
      }
      return postGenerateWithKey(apiKey, req)
    }
  }
}

async function postGenerateWithKey(
  apiKey: string,
  req: { prompt: string; outputPath?: string }
): Promise<MediaProviderResult> {
  try {
    const created = await queryHttpJson<DashscopeTaskCreateResponse>(CREATE_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'X-DashScope-Async': 'enable'
      },
      body: {
        model: 'wanx2.1-t2i-turbo',
        input: { prompt: req.prompt.slice(0, 500) },
        parameters: { size: '1280*720', n: 1 }
      },
      timeoutMs: 30_000
    })

    const taskId = created.output?.task_id
    if (!taskId) {
      return {
        ok: false,
        message: created.message || created.code || '创建文生图任务失败（无 task_id）'
      }
    }

    const imageUrl = await queryWaitTask(taskId, apiKey)
    const outputPath =
      req.outputPath?.trim() ||
      `${process.cwd()}/wanx-${Date.now()}.png`

    await postDownloadImage(imageUrl, outputPath)
    return { ok: true, path: outputPath, message: `万相文生图已保存：${outputPath}` }
  } catch (err) {
    return {
      ok: false,
      message: `百炼文生图失败：${err instanceof Error ? err.message : String(err)}`
    }
  }
}
