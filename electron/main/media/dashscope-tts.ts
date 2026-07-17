/**
 * 阿里云百炼 Qwen3-TTS 语音合成 Provider（非流式，返回音频 URL 后下载）。
 * 文档：https://help.aliyun.com/zh/model-studio/qwen-tts-api
 * 与万相文生图共用百炼 API Key，无需额外配置项。
 */

import { createWriteStream, mkdirSync } from 'fs'
import { dirname } from 'path'
import { pipeline } from 'stream/promises'
import { Readable } from 'stream'
import { queryHttp, queryHttpJson } from '../net/http-client'
import { querySettings } from '../store/settings'
import { queryModelConnection } from '../../../shared/types'
import type { MediaProviderResult, TextToSpeechProvider } from './provider'

const TTS_URL =
  'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation'

/** 默认系统音色：Cherry 对中文旁白较自然 */
const DEFAULT_VOICE = 'Cherry'
/** 单次合成字符上限（模型侧约 512 Token / 600 字，留余量） */
const MAX_TEXT_CHARS = 500

interface DashscopeTtsResponse {
  code?: string
  message?: string
  output?: {
    finish_reason?: string
    audio?: {
      url?: string
      data?: string
    }
  }
}

async function postDownloadAudio(url: string, outputPath: string): Promise<void> {
  mkdirSync(dirname(outputPath), { recursive: true })
  const res = await queryHttp(url, { timeoutMs: 60_000 })
  const body = res.body
  if (!body) throw new Error('音频下载响应无 body')
  const nodeStream = Readable.fromWeb(body as import('stream/web').ReadableStream)
  await pipeline(nodeStream, createWriteStream(outputPath))
}

/** 解析设置里可用的百炼 Key（优先 video 角色连接） */
function queryDashscopeApiKey(): string | null {
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

async function postSynthesizeWithKey(
  apiKey: string,
  req: { text: string; outputPath?: string }
): Promise<MediaProviderResult> {
  const text = req.text.trim().slice(0, MAX_TEXT_CHARS)
  if (!text) {
    return { ok: false, message: '旁白文本为空，跳过 TTS' }
  }

  try {
    const data = await queryHttpJson<DashscopeTtsResponse>(TTS_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: {
        model: 'qwen3-tts-flash',
        input: {
          text,
          voice: DEFAULT_VOICE,
          language_type: 'Chinese'
        }
      },
      timeoutMs: 60_000
    })

    if (data.code) {
      return {
        ok: false,
        message: `百炼 TTS 失败：${data.message || data.code}`
      }
    }

    const audioUrl = data.output?.audio?.url
    if (!audioUrl) {
      return {
        ok: false,
        message: data.message || 'TTS 成功但未返回音频 URL'
      }
    }

    const outputPath =
      req.outputPath?.trim() || `${process.cwd()}/qwen-tts-${Date.now()}.wav`

    await postDownloadAudio(audioUrl, outputPath)
    return { ok: true, path: outputPath, message: `Qwen-TTS 已保存：${outputPath}` }
  } catch (err) {
    return {
      ok: false,
      message: `百炼 TTS 失败：${err instanceof Error ? err.message : String(err)}`
    }
  }
}

/** 使用百炼 Key 调用 qwen3-tts-flash 合成旁白 wav */
export function queryDashscopeTextToSpeechProvider(): TextToSpeechProvider {
  return {
    id: 'dashscope-qwen-tts',
    async synthesize(req): Promise<MediaProviderResult> {
      const apiKey = queryDashscopeApiKey()
      if (!apiKey) {
        return {
          ok: false,
          message: '未找到已配置 API Key 的百炼连接，无法调用 Qwen-TTS'
        }
      }
      return postSynthesizeWithKey(apiKey, req)
    }
  }
}
