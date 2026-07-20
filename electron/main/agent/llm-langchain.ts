import { ChatOpenAI } from '@langchain/openai'
import {
  queryProviderOption,
  type AppSettings,
  type ModelCapability,
  type ModelRoleKey
} from '../../../shared/types'
import { queryResolveModelConnection } from './model-router'

/**
 * 按用途 / 能力解析模型连接并生成 ChatOpenAI 配置。
 * 为什么：编剧/视频/通用等角色可绑定不同连接；任务内容还可按 capability 覆盖选型。
 */
export function queryChatModelConfig(
  settings: AppSettings,
  purpose?: ModelRoleKey,
  capability?: ModelCapability
): ConstructorParameters<typeof ChatOpenAI>[0] {
  const connection = queryResolveModelConnection(settings, {
    role: purpose,
    capability
  })
  const provider = queryProviderOption(connection.provider, settings.customProviders ?? [])
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
 * @param capability 任务能力标签；有值时优先按 capabilities 选连接
 */
export function createChatModel(
  settings: AppSettings,
  purpose?: ModelRoleKey,
  capability?: ModelCapability
): ChatOpenAI {
  return new ChatOpenAI(queryChatModelConfig(settings, purpose, capability))
}

/**
 * 按最新 capability 动态创建模型的工厂（供 createReactAgent 的 llm 函数形态使用）。
 * 为什么：ReAct 循环内 switch_model 改 capability 后，下一轮 LLM 调用需重新选型。
 */
export function createCapabilityRoutedModel(
  settings: AppSettings,
  role: ModelRoleKey,
  queryCapability: () => ModelCapability | '' | undefined
): () => ChatOpenAI {
  return () => {
    const raw = queryCapability()
    const capability =
      raw === 'chat' ||
      raw === 'reasoning' ||
      raw === 'vision' ||
      raw === 'longContext' ||
      raw === 'creative'
        ? raw
        : undefined
    return createChatModel(settings, role, capability)
  }
}
