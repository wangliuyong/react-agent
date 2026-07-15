import { ChatOpenAI } from '@langchain/openai'
import { queryProviderOption, type AppSettings } from '../../../shared/types'

/**
 * 生成 OpenAI 兼容模型配置，集中处理供应商默认地址与错误文案。
 * 独立为纯函数，便于验证不同供应商不会串用模型参数。
 */
export function queryChatModelConfig(
  settings: AppSettings
): ConstructorParameters<typeof ChatOpenAI>[0] {
  const provider = queryProviderOption(settings.provider)
  if (!settings.apiKey) {
    throw new Error(`未配置 ${provider.apiKeyLabel}，请先在设置中填写`)
  }
  return {
    apiKey: settings.apiKey,
    model: settings.model,
    configuration: {
      baseURL: settings.baseUrl || provider.defaultBaseUrl
    },
    streaming: true,
    temperature: 0.7
  }
}

/**
 * 创建对接百炼或 DeepSeek 官方 API 的 LangChain 聊天模型。
 * 应用内唯一 ChatModel 工厂。
 */
export function createChatModel(settings: AppSettings): ChatOpenAI {
  return new ChatOpenAI(queryChatModelConfig(settings))
}
