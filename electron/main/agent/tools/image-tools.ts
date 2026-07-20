/**
 * 独立文生图工具：走万相 T2I Provider，供「生成一张图」类请求使用。
 * 与视频管线 generate_scene_assets 解耦，不要求分镜文件。
 */

import { join } from 'path'
import {
  querySceneAssetsDir,
  queryTextToImageProvider
} from '../../media/provider'
import type { AgentTool } from './types'

/**
 * 按用户描述调用文生图 Provider，返回本地 png 路径供聊天内联预览。
 * 为什么：此前仅有视频分镜内的 T2I，闲聊「生成一张猫图」无工具可调，模型会幻觉成功。
 */
export const generateImageTool: AgentTool = {
  name: 'generate_image',
  description:
    '用万相文生图（AI 原创）按文字描述生成图片并保存到本地。' +
    '用户要求「生成/画一张图」且不要网图时必须调用本工具；' +
    '禁止用 fetch_web_images 代替；禁止在未调用本工具成功前声称已生成图片。' +
    '成功时回复中务必包含工具返回的本地 png 绝对路径，便于界面预览。',
  permission: 'safe',
  parameters: {
    type: 'object',
    properties: {
      prompt: {
        type: 'string',
        description: '画面描述（主体、场景、风格、光影等），建议中文或中英混合，尽量具体'
      },
      fileName: {
        type: 'string',
        description: '可选输出文件名（不含目录），默认按时间戳生成 .png'
      }
    },
    required: ['prompt']
  },
  async execute(args, ctx) {
    const prompt = String(args.prompt ?? '').trim()
    if (!prompt) {
      return 'prompt 不能为空，请描述要生成的画面内容'
    }

    const rawName = String(args.fileName ?? '').trim()
    const safeName = rawName
      ? rawName.replace(/[^\w.\u4e00-\u9fff-]+/g, '_').replace(/\.+$/, '')
      : `gen-${Date.now()}`
    const fileName = safeName.toLowerCase().endsWith('.png') ? safeName : `${safeName}.png`
    const outputPath = join(querySceneAssetsDir(ctx.sessionId), fileName)

    const t2i = queryTextToImageProvider()
    const result = await t2i.generate({ prompt: prompt.slice(0, 500), outputPath })

    if (!result.ok || !result.path) {
      return (
        `文生图失败：${result.message}` +
        '。请检查设置中是否已配置有效的阿里云百炼 API Key（媒体生成连接）。' +
        '不要向用户声称图片已生成。'
      )
    }

    return (
      `文生图成功。\n` +
      `图片路径：${result.path}\n` +
      `说明：${result.message}\n` +
      `请在回复中保留上述本地路径，以便聊天界面内联预览；不要声称这是网图。`
    )
  }
}
