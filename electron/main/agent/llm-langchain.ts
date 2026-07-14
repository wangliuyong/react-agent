import { ChatOpenAI } from '@langchain/openai'
import type { AppSettings } from '../../../shared/types'

/**
 * 创建对接阿里云百炼（DashScope OpenAI 兼容）的 LangChain 聊天模型。
 * 与 llm.ts 的 createLlmClient 共用同一套 settings 字段。
 */
export function createChatModel(settings: AppSettings): ChatOpenAI {
  if (!settings.apiKey) {
    throw new Error('未配置 API Key，请先在设置中填写阿里云百炼 DASHSCOPE_API_KEY')
  }
  return new ChatOpenAI({
    apiKey: settings.apiKey,
    model: settings.model,
    configuration: {
      baseURL: settings.baseUrl || 'https://dashscope.aliyuncs.com/compatible-mode/v1'
    },
    streaming: true,
    temperature: 0.7
  })
}
