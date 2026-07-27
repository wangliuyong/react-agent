import type { AgentTool } from './types'
import { fetchWebImages } from '../../browser/fetch-web-images'
import { queryRewriteXhsPublishCopy } from '../../browser/xhs-content-rewrite'
import { queryClampXhsPublishText } from '../../browser/xhs-content-limits'
import { publishXhsNote } from '../../browser/xhs-publish'
import { queryInferXhsPublishType } from '../../browser/xhs-dom'
import { queryPublishChannelMeta } from '../../../../shared/publish-channels'
import { queryPublishChannels } from '../../store/channels'
import { queryPublishAdapter } from '../../publish/adapter'
import { initPublishAdapters } from '../../publish/register'

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
 * Agent 应判断发布类型并传 publishType，工具会跳转对应官方入口：
 * image / video / article / audio（from=menu&target=*）。
 */
export const xhsPublishNoteTool: AgentTool = {
  name: 'xhs_publish_note',
  description:
    '在小红书创作平台发布笔记。' +
    '必须先判断类型并传 publishType：' +
    'image=图文（默认，需配图）、video=视频（需 videoPaths）、' +
    'article=写长文、audio=发播客（需 audioPaths）。' +
    '字数硬上限：图文/视频/播客标题≤20、正文≤1000；长文标题≤40、正文≤10000（超限自动截断）。' +
    '工具会自动打开对应官方链接：' +
    '?from=menu&target=image|video|article|audio，再填充标题正文。' +
    '渠道「拟人操作」开启时走浏览器拟人流程；关闭时走 SDK 占位。' +
    '拟人发布仅支持用户在场手动触发的一次性会话，禁止定时任务/流程无人值守托管。' +
    '发布前会自动做本地同义词与口语化改写；建议人工通读微调 1～2 处后再发。' +
    '图文配图优先 imagePaths（通常来自 fetch_web_images）。未登录会暂停等人扫码。',
  permission: 'dangerous',
  parameters: {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        description:
          '笔记标题。图文/视频/播客硬上限 20 字，长文 40 字；超限时工具会自动截断'
      },
      content: {
        type: 'string',
        description:
          '笔记正文 / 视频描述 / 长文正文。图文/视频/播客硬上限 1000 字，长文 10000 字；' +
          '撰写时务必不超过上限，超限时工具会自动截断'
      },
      publishType: {
        type: 'string',
        enum: ['image', 'video', 'article', 'audio'],
        description:
          '发布类型。图文=image，视频=video，写长文=article，发播客=audio。' +
          '未传时：有 videoPaths→video，有 audioPaths→audio，' +
          '正文≥140字且无图→article，否则 image。'
      },
      imagePaths: {
        type: 'array',
        items: { type: 'string' },
        description: '图文配图本地绝对路径（publishType=image 时必填，推荐先 fetch_web_images）'
      },
      videoPaths: {
        type: 'array',
        items: { type: 'string' },
        description: '视频本地绝对路径（publishType=video 时必填，如 mp4/mov）'
      },
      audioPaths: {
        type: 'array',
        items: { type: 'string' },
        description: '播客音频本地绝对路径（publishType=audio 时必填）'
      },
      imageSourceUrl: {
        type: 'string',
        description: '内容来源页 URL；图文且未给 imagePaths 时，将自动从该页抓取配图'
      },
      imageUrls: {
        type: 'array',
        items: { type: 'string' },
        description: '图片直链；图文且未给 imagePaths 时将下载后使用'
      },
      autoPublish: {
        type: 'boolean',
        description:
          '是否自动点击发布。任务默认 true；false 时只填好停在待发布。未登录仍会暂停等人扫码。'
      }
    },
    required: ['title', 'content']
  },
  async execute(args, ctx) {
    initPublishAdapters()
    // 为什么：发送前刷新注册表，确保刚改的拟人开关立即生效
    queryPublishChannels()
    const humanized = Boolean(queryPublishChannelMeta('xhs').humanized)

    let imagePaths =
      (args.imagePaths as string[] | undefined)?.filter(Boolean) ?? []
    const videoPaths =
      (args.videoPaths as string[] | undefined)?.filter(Boolean) ?? []
    const audioPaths =
      (args.audioPaths as string[] | undefined)?.filter(Boolean) ?? []

    const publishType = queryInferXhsPublishType({
      publishType: args.publishType,
      imagePaths,
      videoPaths,
      audioPaths,
      content: String(args.content ?? '')
    })

    // 仅图文需要自动抓配图；视频/播客/长文不走配图逻辑
    if (publishType === 'image' && !imagePaths.length) {
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

    if (publishType === 'image' && !imagePaths.length && ctx.attachmentPaths.length) {
      imagePaths = [...ctx.attachmentPaths]
    }

    if (publishType === 'image' && !imagePaths.length) {
      return (
        '图文发布缺少配图。请先调用 fetch_web_images（传入内容来源 pageUrl 或 imageUrls），' +
        '或在 xhs_publish_note 中传入 imageSourceUrl / imageUrls / imagePaths；' +
        '用户本地上传图片为可选，有则可直接用。' +
        '若实际要发视频/长文/播客，请传 publishType=video|article|audio 及对应素材路径。'
      )
    }

    if (publishType === 'video' && !videoPaths.length) {
      return (
        '视频发布缺少 videoPaths。请传入本地视频绝对路径，并设置 publishType=video。' +
        '入口：https://creator.xiaohongshu.com/publish/publish?from=menu&target=video'
      )
    }

    if (publishType === 'audio' && !audioPaths.length) {
      return (
        '播客发布缺少 audioPaths。请传入本地音频绝对路径，并设置 publishType=audio。' +
        '入口：https://creator.xiaohongshu.com/publish/publish?from=menu&target=audio'
      )
    }

    // 离线改写 → 再按平台上限截断
    const rewritten = queryRewriteXhsPublishCopy(
      String(args.title ?? ''),
      String(args.content ?? '')
    )
    const clamped = queryClampXhsPublishText({
      title: rewritten.title,
      content: rewritten.content,
      publishType
    })
    const rewriteNote = rewritten.rewritten
      ? '已对标题/正文做本地防检测改写（同义词+口语化），建议人工再微调。'
      : ''

    if (!humanized) {
      return queryPublishAdapter('xhs', false).publish({
        title: clamped.title,
        content: clamped.content,
        imagePaths,
        signal: ctx.signal,
        emitAwaitUser: ctx.emitAwaitUser
      })
    }

    const result = await publishXhsNote({
      title: clamped.title,
      content: clamped.content,
      imagePaths,
      videoPaths,
      audioPaths,
      publishType,
      autoPublish: args.autoPublish !== false,
      fullAccess: ctx.fullAccess,
      sessionId: ctx.sessionId,
      emitAwaitUser: async (reason) => {
        await ctx.emitAwaitUser(reason)
      },
      updateTasks: ctx.updateTasks,
      signal: ctx.signal
    })
    return rewriteNote ? `${rewriteNote}\n${result}` : result
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
