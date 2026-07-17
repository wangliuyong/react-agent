import { ChatOpenAI } from '@langchain/openai'
import {
  queryModelConnection,
  queryProviderOption,
  type AppSettings,
  type ModelRoleKey
} from '../../../shared/types'

/**
 * 按用途解析模型连接并生成 ChatOpenAI 配置。
 * 为什么：编剧/视频/通用等角色可绑定不同连接，避免全局单模型。
 */
export function queryChatModelConfig(
  settings: AppSettings,
  purpose?: ModelRoleKey
): ConstructorParameters<typeof ChatOpenAI>[0] {
  const connection = queryModelConnection(settings, purpose)
  const provider = queryProviderOption(connection.provider)
  if (!connection.apiKey) {
    throw new Error(`未配置 ${provider.apiKeyLabel}（连接：${connection.label}），请先在设置中填写`)
  }
  /**
   * DeepSeek V4 默认 thinking=enabled；工具多轮必须回传 reasoning_content。
   * ChatOpenAI 出站消息不会带上该字段，ReAct 第二轮会 HTTP 400。
   */
  const modelKwargs =
    connection.provider === 'deepseek'
      ? { thinking: { type: 'disabled' as const } }
      : undefined

  return {
    apiKey: connection.apiKey,
    model: connection.model,
    configuration: {
      baseURL: connection.baseUrl || provider.defaultBaseUrl
    },
    streaming: true,
    temperature: 0.7,
    ...(modelKwargs ? { modelKwargs } : {})
  }
}

/**
 * 创建对接百炼 / DeepSeek / OpenAI 兼容 API 的 LangChain 聊天模型。
 * @param purpose 角色或媒体任务键，用于 roleModelMap 选型
 */
export function createChatModel(
  settings: AppSettings,
  purpose?: ModelRoleKey
): ChatOpenAI {
  return new ChatOpenAI(queryChatModelConfig(settings, purpose))
}
