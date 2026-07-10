import type { AgentTool } from './types'
import { getBrowserService } from '../../browser/service'

export const browserNavigateTool: AgentTool = {
  name: 'browser_navigate',
  description: '在智能体浏览器中打开指定 URL。',
  permission: 'safe',
  parameters: {
    type: 'object',
    properties: {
      url: { type: 'string', description: '完整 URL' }
    },
    required: ['url']
  },
  async execute(args) {
    const url = String(args.url ?? '')
    const browser = getBrowserService()
    await browser.ensureStarted()
    await browser.navigate(url)
    return `已导航到: ${url}`
  }
}

export const browserSnapshotTool: AgentTool = {
  name: 'browser_snapshot',
  description: '获取当前页面可访问性摘要（文本树），用于决定下一步点击/输入。',
  permission: 'safe',
  parameters: {
    type: 'object',
    properties: {
      maxLength: { type: 'number', description: '摘要最大字符数，默认 12000' }
    },
    required: []
  },
  async execute(args) {
    const browser = getBrowserService()
    await browser.ensureStarted()
    const max = Number(args.maxLength ?? 12000)
    return browser.snapshot(max)
  }
}

export const browserClickTool: AgentTool = {
  name: 'browser_click',
  description: '用拟人鼠标移动并点击页面元素（非脚本瞬时点击）。优先用可见文本或 CSS 选择器。',
  permission: 'sensitive',
  parameters: {
    type: 'object',
    properties: {
      selector: { type: 'string', description: 'CSS 选择器' },
      text: { type: 'string', description: '可见文本（与 selector 二选一）' }
    },
    required: []
  },
  async execute(args) {
    const browser = getBrowserService()
    await browser.ensureStarted()
    await browser.click({
      selector: args.selector ? String(args.selector) : undefined,
      text: args.text ? String(args.text) : undefined
    })
    return '鼠标点击成功'
  }
}

export const browserTypeTool: AgentTool = {
  name: 'browser_type',
  description: '先鼠标点入输入框，再逐字键盘输入（不使用 fill 脚本赋值）。',
  permission: 'sensitive',
  parameters: {
    type: 'object',
    properties: {
      selector: { type: 'string' },
      text: { type: 'string', description: '要输入的内容' },
      clear: { type: 'boolean', description: '是否先全选清空，默认 true' }
    },
    required: ['text']
  },
  async execute(args) {
    const browser = getBrowserService()
    await browser.ensureStarted()
    await browser.type({
      selector: args.selector ? String(args.selector) : undefined,
      text: String(args.text ?? ''),
      clear: args.clear !== false
    })
    return '键盘输入成功'
  }
}

export const browserUploadTool: AgentTool = {
  name: 'browser_upload',
  description: '向 file input 上传本地文件。',
  permission: 'sensitive',
  parameters: {
    type: 'object',
    properties: {
      selector: { type: 'string', description: 'input[type=file] 选择器，可省略自动查找' },
      paths: {
        type: 'array',
        items: { type: 'string' },
        description: '本地文件绝对路径列表'
      }
    },
    required: ['paths']
  },
  async execute(args) {
    const paths = (args.paths as string[]) ?? []
    const browser = getBrowserService()
    await browser.ensureStarted()
    await browser.upload({
      selector: args.selector ? String(args.selector) : undefined,
      paths
    })
    return `已上传 ${paths.length} 个文件`
  }
}

export const browserWaitTool: AgentTool = {
  name: 'browser_wait',
  description: '等待指定毫秒或等待某选择器出现。',
  permission: 'safe',
  parameters: {
    type: 'object',
    properties: {
      ms: { type: 'number' },
      selector: { type: 'string' }
    },
    required: []
  },
  async execute(args) {
    const browser = getBrowserService()
    await browser.ensureStarted()
    await browser.wait({
      ms: args.ms != null ? Number(args.ms) : undefined,
      selector: args.selector ? String(args.selector) : undefined
    })
    return '等待完成'
  }
}
