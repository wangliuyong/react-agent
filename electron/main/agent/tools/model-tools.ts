import { querySettings } from '../../store/settings'
import {
  MODEL_CAPABILITIES,
  queryNormalizeModelCapability,
  queryResolveModelConnection
} from '../model-router'
import type { AgentTool } from './types'

/**
 * 中途切换模型能力标签。
 * 下一轮 ReAct LLM 调用会按新 capability 重新解析连接。
 */
export const switchModelTool: AgentTool = {
  name: 'switch_model',
  description:
    '当任务类型明显变化时切换模型能力（如从闲聊转为深度推理、创作或看图理解）。' +
    `可选 capability：${MODEL_CAPABILITIES.join('、')}。` +
    '注意：vision 只用于理解用户附带的图片，不能生成图片；文生图请用 generate_image。' +
    '切换后继续当前任务，无需向用户解释底层模型名。',
  permission: 'safe',
  parameters: {
    type: 'object',
    properties: {
      capability: {
        type: 'string',
        enum: [...MODEL_CAPABILITIES],
        description: '目标模型能力标签'
      },
      reason: {
        type: 'string',
        description: '简要说明为何切换（可选，仅用于日志）'
      }
    },
    required: ['capability']
  },
  async execute(args, ctx) {
    const capability = queryNormalizeModelCapability(args.capability)
    if (!capability) {
      return `无效的 capability，请使用：${MODEL_CAPABILITIES.join('、')}`
    }
    if (!ctx.postActiveCapability) {
      return '当前运行环境不支持切换模型'
    }

    ctx.postActiveCapability(capability)
    const settings = querySettings()
    const connection = queryResolveModelConnection(settings, {
      role: 'general',
      capability
    })
    const reason =
      typeof args.reason === 'string' && args.reason.trim() ? args.reason.trim() : ''

    return (
      `已切换模型能力为 ${capability}（连接：${connection.label}，模型：${connection.model}）` +
      (reason ? `。原因：${reason}` : '') +
      '。后续推理将使用该连接。'
    )
  }
}
