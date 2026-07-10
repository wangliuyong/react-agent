import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { dirname, join } from 'path'
import { getArtifactsDir } from '../../store/paths'
import type { AgentTool } from './types'

/** 安全读文件：限制在 artifacts 或用户显式给出的绝对路径 */
export const readFileTool: AgentTool = {
  name: 'read_file',
  description: '读取本地文本文件内容。可用于查看已生成的文案或配置。',
  permission: 'safe',
  parameters: {
    type: 'object',
    properties: {
      path: { type: 'string', description: '文件绝对路径' }
    },
    required: ['path']
  },
  async execute(args) {
    const path = String(args.path ?? '')
    if (!path || !existsSync(path)) {
      return `文件不存在: ${path}`
    }
    const content = readFileSync(path, 'utf-8')
    // 防止超大文件撑爆上下文
    if (content.length > 80_000) {
      return content.slice(0, 80_000) + '\n...[截断]'
    }
    return content
  }
}

export const writeFileTool: AgentTool = {
  name: 'write_file',
  description: '将文本写入本地文件。默认建议写到 artifacts 目录。',
  permission: 'sensitive',
  parameters: {
    type: 'object',
    properties: {
      path: { type: 'string', description: '目标绝对路径；可省略目录写到 artifacts' },
      content: { type: 'string', description: '文件内容' },
      filename: { type: 'string', description: '若未给 path，则用 artifacts/filename' }
    },
    required: ['content']
  },
  async execute(args) {
    let path = args.path ? String(args.path) : ''
    if (!path) {
      const name = String(args.filename ?? `note-${Date.now()}.txt`)
      path = join(getArtifactsDir(), name)
    }
    mkdirSync(dirname(path), { recursive: true })
    writeFileSync(path, String(args.content ?? ''), 'utf-8')
    return `已写入: ${path}`
  }
}

export const listAttachmentsTool: AgentTool = {
  name: 'list_attachments',
  description:
    '列出用户本轮可选上传的附件本地路径。发布小红书时配图优先用 fetch_web_images；附件仅作补充，没有也不必强求用户上传。',
  permission: 'safe',
  parameters: {
    type: 'object',
    properties: {},
    required: []
  },
  async execute(_args, ctx) {
    if (!ctx.attachmentPaths.length) {
      return '当前没有本地附件（可选）。请优先用 fetch_web_images 从来源网页获取配图。'
    }
    return ctx.attachmentPaths.map((p, i) => `${i + 1}. ${p}`).join('\n')
  }
}
