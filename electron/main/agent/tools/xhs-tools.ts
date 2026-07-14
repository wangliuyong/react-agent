import type { AgentTool } from './types'
import { fetchWebImages } from '../../browser/fetch-web-images'
import { publishXhsNote } from '../../browser/xhs-publish'

/**
 * 从来源网页或图片直链下载配图到本地 artifacts。
 * 发布小红书时优先用此工具；用户本地上传仅为可选补充。
 */
export const fetchWebImagesTool: AgentTool = {
  name: 'fetch_web_images',
  description:
    '从内容来源网页提取并下载配图，或按图片直链下载到本地。' +
    '发布小红书/抖音前应优先调用本工具获取配图；用户上传图片是可选的。' +
    '返回本地绝对路径列表，可交给 xhs_publish_note 或 douyin_publish_note 的 imagePaths。',
  permission: 'safe',
  parameters: {
    type: 'object',
    properties: {
      pageUrl: {
        type: 'string',
        description: '内容来源页 URL（打开后自动挑选较大图片下载）'
      },
      imageUrls: {
        type: 'array',
        items: { type: 'string' },
        description: '图片直链列表（与 pageUrl 可同时使用）'
      },
      maxCount: {
        type: 'number',
        description: '最多下载几张，默认 3，最大 9'
      }
    },
    required: []
  },
  async execute(args, ctx) {
    const pageUrl = args.pageUrl ? String(args.pageUrl) : undefined
    const imageUrls = Array.isArray(args.imageUrls)
      ? (args.imageUrls as unknown[]).map(String)
      : undefined
    if (!pageUrl && (!imageUrls || imageUrls.length === 0)) {
      return '请至少提供 pageUrl 或 imageUrls 之一。'
    }
    const result = await fetchWebImages({
      pageUrl,
      imageUrls,
      maxCount: args.maxCount != null ? Number(args.maxCount) : 3,
      signal: ctx.signal
    })
    return result.message
  }
}

/**
 * 小红书发布：配图优先网页下载路径；用户附件可选。
 */
export const xhsPublishNoteTool: AgentTool = {
  name: 'xhs_publish_note',
  description:
    '在小红书创作平台发布图文笔记。发布前自动浏览发现页热身（刷笔记、停留、点赞），' +
    '步骤间 2～10 秒随机延迟，贝塞尔曲线滚动/鼠标轨迹，配图自动微裁剪去同质化。' +
    '遵守作息（0-6 点不操作）与日≤2篇/周≤10篇限制。' +
    '配图优先使用 imagePaths（通常来自 fetch_web_images）；也可传 imageSourceUrl / imageUrls 由本工具内下载。' +
    '用户本轮上传的附件仅为可选补充。' +
    '若未登录会暂停等待扫码；非完全访问模式下点「发布」前会再次确认。',
  permission: 'dangerous',
  parameters: {
    type: 'object',
    properties: {
      title: { type: 'string', description: '笔记标题，建议不超过 20 字' },
      content: { type: 'string', description: '笔记正文' },
      imagePaths: {
        type: 'array',
        items: { type: 'string' },
        description: '配图本地绝对路径（推荐：先 fetch_web_images 再传入）'
      },
      imageSourceUrl: {
        type: 'string',
        description: '内容来源页 URL；若未给 imagePaths，将自动从该页抓取配图'
      },
      imageUrls: {
        type: 'array',
        items: { type: 'string' },
        description: '图片直链；若未给 imagePaths，将下载后使用'
      },
      autoPublish: {
        type: 'boolean',
        description:
          '是否自动点击发布。产品策略下会被忽略并固定为 false：只填好内容停在待发布，由用户手动发布'
      }
    },
    required: ['title', 'content']
  },
  async execute(args, ctx) {
    let imagePaths =
      (args.imagePaths as string[] | undefined)?.filter(Boolean) ?? []

    // 1) 显式路径 → 2) 来源页/直链下载 → 3) 用户附件（可选）
    if (!imagePaths.length) {
      const pageUrl = args.imageSourceUrl ? String(args.imageSourceUrl) : undefined
      const imageUrls = Array.isArray(args.imageUrls)
        ? (args.imageUrls as unknown[]).map(String)
        : undefined
      if (pageUrl || (imageUrls && imageUrls.length > 0)) {
        const fetched = await fetchWebImages({
          pageUrl,
          imageUrls,
          maxCount: 3,
          signal: ctx.signal
        })
        imagePaths = fetched.paths
        if (!imagePaths.length) {
          return fetched.message
        }
      }
    }

    if (!imagePaths.length && ctx.attachmentPaths.length) {
      imagePaths = [...ctx.attachmentPaths]
    }

    if (!imagePaths.length) {
      return (
        '缺少配图。请先调用 fetch_web_images（传入内容来源 pageUrl 或 imageUrls），' +
        '或在 xhs_publish_note 中传入 imageSourceUrl / imageUrls / imagePaths；' +
        '用户本地上传图片为可选，有则可直接用。'
      )
    }

    const result = await publishXhsNote({
      title: String(args.title ?? ''),
      content: String(args.content ?? ''),
      imagePaths,
      // 任务/流程不自动点发布：忽略模型传入的 true
      autoPublish: false,
      fullAccess: ctx.fullAccess,
      emitAwaitUser: ctx.emitAwaitUser,
      updateTasks: ctx.updateTasks,
      signal: ctx.signal
    })

    return result
  }
}

export const updateTaskListTool: AgentTool = {
  name: 'update_task_list',
  description: '更新当前会话的任务清单，用于向用户展示执行进度。',
  permission: 'safe',
  parameters: {
    type: 'object',
    properties: {
      tasks: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            status: {
              type: 'string',
              enum: ['pending', 'running', 'done', 'failed', 'skipped']
            }
          },
          required: ['id', 'title', 'status']
        }
      }
    },
    required: ['tasks']
  },
  async execute(args, ctx) {
    const tasks = (args.tasks as Array<{
      id: string
      title: string
      status: 'pending' | 'running' | 'done' | 'failed' | 'skipped'
    }>) ?? []
    ctx.updateTasks(() => tasks)
    return `任务清单已更新，共 ${tasks.length} 项`
  }
}
