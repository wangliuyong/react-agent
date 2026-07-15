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
  /**
   * DeepSeek V4 默认 thinking=enabled；工具多轮必须回传 reasoning_content。
   * ChatOpenAI 出站消息不会带上该字段，ReAct 第二轮会 HTTP 400。
   * 官方供应商关闭 thinking，走非思考模式的 Tool Calls（与 Agent 工具循环兼容）。
   * 文档：https://api-docs.deepseek.com/guides/thinking_mode
   */
  const modelKwargs =
    settings.provider === 'deepseek'
      ? { thinking: { type: 'disabled' as const } }
      : undefined

  return {
    apiKey: settings.apiKey,
    model: settings.model,
    configuration: {
      baseURL: settings.baseUrl || provider.defaultBaseUrl
    },
    streaming: true,
    temperature: 0.7,
    ...(modelKwargs ? { modelKwargs } : {})
  }
}

/**
 * 创建对接百炼或 DeepSeek 官方 API 的 LangChain 聊天模型。
 * 应用内唯一 ChatModel 工厂。
 */
export function createChatModel(settings: AppSettings): ChatOpenAI {
  return new ChatOpenAI(queryChatModelConfig(settings))
}
