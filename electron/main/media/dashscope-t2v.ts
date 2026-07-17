/**
 * 阿里云百炼万相文生视频 Provider。
 * 文档：https://help.aliyun.com/zh/model-studio/text-to-video-api-reference
 */

import type { MediaProviderResult, TextToVideoProvider } from './provider'
import {
  DASHSCOPE_VIDEO_SYNTHESIS_URL,
  postCreateAsyncTask,
  postDownloadFile,
  queryDashscopeApiKey,
  queryResultUrl,
  queryWaitTaskResult
} from './dashscope-task'

/** 优先 2.6，部分区域仅支持 2.7 时在失败时 fallback */
const T2V_MODELS = ['wan2.6-t2v', 'wan2.7-t2v'] as const

const DEFAULT_NEGATIVE =
  '低分辨率、错误、最差质量、低质量、残缺、多余的手指、比例不良、扭曲人脸、肢体崩坏、闪烁、跳帧'

export function queryDashscopeTextToVideoProvider(): TextToVideoProvider {
  return {
    id: 'dashscope-wan-t2v',
    async generate(req): Promise<MediaProviderResult> {
      const apiKey = queryDashscopeApiKey()
      if (!apiKey) {
        return {
          ok: false,
          message: '未找到已配置 API Key 的百炼连接，无法调用万相文生视频'
        }
      }

      const prompt = req.prompt?.trim()
      if (!prompt) {
        return { ok: false, message: '文生视频 prompt 不能为空' }
      }

      const duration = Math.min(15, Math.max(2, Math.round(req.durationSec ?? 5)))
      const ratio = req.aspectRatio ?? '16:9'
      const outputPath =
        req.outputPath?.trim() || `${process.cwd()}/wan-t2v-${Date.now()}.mp4`

      let lastError = '未知错误'
      for (const model of T2V_MODELS) {
        try {
          const taskId = await postCreateAsyncTask(
            DASHSCOPE_VIDEO_SYNTHESIS_URL,
            {
              model,
              input: {
                prompt: prompt.slice(0, 2000),
                negative_prompt: (req.negativePrompt ?? DEFAULT_NEGATIVE).slice(0, 500)
              },
              parameters: {
                resolution: '720P',
                ratio,
                duration,
                prompt_extend: true
              }
            },
            apiKey
          )

          const result = await queryWaitTaskResult(taskId, apiKey, {
            maxAttempts: 120,
            pollIntervalMs: 3000
          })
          const videoUrl = queryResultUrl(result)
          await postDownloadFile(videoUrl, outputPath)
          return {
            ok: true,
            path: outputPath,
            message: `万相文生视频已保存（${model}）：${outputPath}`
          }
        } catch (err) {
          lastError = err instanceof Error ? err.message : String(err)
        }
      }

      return { ok: false, message: `百炼文生视频失败：${lastError}` }
    }
  }
}
