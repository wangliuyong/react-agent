import type { AgentTool } from './types'
import { fetchWebImages } from '../../browser/fetch-web-images'
import { publishDouyinNote } from '../../browser/douyin-publish'
import { DOUYIN_TITLE_MAX_LENGTH } from '../../browser/douyin-dom'
import { queryPublishChannelMeta } from '../../../../shared/publish-channels'
import { queryPublishChannels } from '../../store/channels'
import { queryPublishAdapter } from '../../publish/adapter'
import { initPublishAdapters } from '../../publish/register'

/**
 * 抖音图文发布：按渠道「拟人操作」开关选择浏览器或 SDK 占位。
 */
export const douyinPublishNoteTool: AgentTool = {
  name: 'douyin_publish_note',
  description:
    '在抖音创作者中心发布图文笔记（非视频）。' +
    '渠道「拟人操作」开启时走浏览器拟人输入；关闭时走 SDK（未接入会明确提示）。' +
    '配图优先使用 imagePaths（通常来自 fetch_web_images）。',
  permission: 'dangerous',
  parameters: {
    type: 'object',
    properties: {
      title: { type: 'string', description: '作品标题，不超过 20 字' },
      content: { type: 'string', description: '作品描述/正文' },
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
          '是否自动点击发布。任务默认 true；false 时只填好停在待发布。未登录仍会暂停等人扫码。'
      }
    },
    required: ['title', 'content']
  },
  async execute(args, ctx) {
    initPublishAdapters()
    queryPublishChannels()
    const humanized = Boolean(queryPublishChannelMeta('douyin').humanized)

    let imagePaths =
      (args.imagePaths as string[] | undefined)?.filter(Boolean) ?? []

    if (!imagePaths.length) {
      const pageUrl = args.imageSourceUrl ? String(args.imageSourceUrl) : undefined
      const imageUrls = Array.isArray(args.imageUrls)
        ? (args.imageUrls as unknown[]).map(String)
        : undefined
      if (pageUrl || (imageUrls && imageUrls.length > 0)) {
        const fetched = await fetchWebImages({
          pageUrl,
          imageUrls,
          topic: [String(args.title ?? ''), String(args.content ?? '')]
            .filter(Boolean)
            .join(' ')
            .slice(0, 200),
          maxCount: 3,
          subdir: 'douyin-images',
          signal: ctx.signal
        })
        imagePaths = fetched.paths
        if (!imagePaths.length) {
          return fetched.message
        }
      }
    }

    // 本地附件可能含音视频；图文发布只取图片后缀，避免触发「不支持的文件格式」
    if (!imagePaths.length && ctx.attachmentPaths.length) {
      const imageExt = /\.(jpe?g|png|webp|gif|bmp|avif|heic|heif|tiff?)$/i
      imagePaths = ctx.attachmentPaths.filter((p) => imageExt.test(p))
    }

    if (!imagePaths.length) {
      return (
        '缺少配图。请先调用 fetch_web_images（传入内容来源 pageUrl 或 imageUrls），' +
        '或在 douyin_publish_note 中传入 imageSourceUrl / imageUrls / imagePaths；' +
        '用户本地上传图片为可选，有则可直接用。'
      )
    }

    // 抖音创作者中心标题硬上限 20 字；渠道配置可更严，取更小值
    const metaMax = queryPublishChannelMeta('douyin').titleMaxLength
    const titleMax =
      metaMax != null && metaMax > 0
        ? Math.min(metaMax, DOUYIN_TITLE_MAX_LENGTH)
        : DOUYIN_TITLE_MAX_LENGTH
    const title = String(args.title ?? '').slice(0, titleMax)
    const content = String(args.content ?? '')

    if (!humanized) {
      return queryPublishAdapter('douyin', false).publish({
        title,
        content,
        imagePaths,
        signal: ctx.signal,
        emitAwaitUser: ctx.emitAwaitUser
      })
    }

    return publishDouyinNote({
      title,
      content,
      imagePaths,
      autoPublish: args.autoPublish !== false,
      fullAccess: ctx.fullAccess,
      emitAwaitUser: ctx.emitAwaitUser,
      updateTasks: ctx.updateTasks,
      signal: ctx.signal
    })
  }
}
