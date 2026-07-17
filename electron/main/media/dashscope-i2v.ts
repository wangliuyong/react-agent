/**
 * 阿里云百炼万相图生视频 Provider（首帧生视频）。
 * 文档：https://help.aliyun.com/zh/model-studio/image-to-video-guide
 */

import { existsSync } from 'fs'
import type { ImageToVideoProvider, MediaProviderResult } from './provider'
import {
  DASHSCOPE_VIDEO_SYNTHESIS_URL,
  postCreateAsyncTask,
  postDownloadFile,
  queryDashscopeApiKey,
  queryImageDataUrlFromFile,
  queryResultUrl,
  queryWaitTaskResult
} from './dashscope-task'

/** 无声、5s、720P，成本与速度平衡 */
const I2V_MODEL = 'wan2.2-i2v-flash'

export function queryDashscopeImageToVideoProvider(): ImageToVideoProvider {
  return {
    id: 'dashscope-wan-i2v',
    async generate(req): Promise<MediaProviderResult> {
      const apiKey = queryDashscopeApiKey()
      if (!apiKey) {
        return {
          ok: false,
          message: '未找到已配置 API Key 的百炼连接，无法调用万相图生视频'
        }
      }

      const imagePath = req.imagePath?.trim()
      if (!imagePath || !existsSync(imagePath)) {
        return { ok: false, message: `图生视频需要有效的首帧图片：${imagePath ?? '空'}` }
      }

      const duration = Math.min(5, Math.max(3, Math.round(req.durationSec ?? 5)))
      const outputPath =
        req.outputPath?.trim() || `${process.cwd()}/wan-i2v-${Date.now()}.mp4`

      try {
        const imgUrl = queryImageDataUrlFromFile(imagePath)
        const taskId = await postCreateAsyncTask(
          DASHSCOPE_VIDEO_SYNTHESIS_URL,
          {
            model: I2V_MODEL,
            input: {
              prompt: (req.prompt ?? '镜头缓慢推进，画面自然流畅').slice(0, 800),
              img_url: imgUrl
            },
            parameters: {
              resolution: '720P',
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
        return { ok: true, path: outputPath, message: `万相图生视频已保存：${outputPath}` }
      } catch (err) {
        return {
          ok: false,
          message: `百炼图生视频失败：${err instanceof Error ? err.message : String(err)}`
        }
      }
    }
  }
}
