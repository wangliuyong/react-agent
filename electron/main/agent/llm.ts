import OpenAI from 'openai'
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions'
import type { AppSettings } from '../../../shared/types'

/** 创建阿里云百炼（DashScope）OpenAI 兼容客户端 */
export function createLlmClient(settings: AppSettings): OpenAI {
  if (!settings.apiKey) {
    throw new Error('未配置 API Key，请先在设置中填写阿里云百炼 DASHSCOPE_API_KEY')
  }
  return new OpenAI({
    apiKey: settings.apiKey,
    baseURL: settings.baseUrl || 'https://dashscope.aliyuncs.com/compatible-mode/v1'
  })
}

export interface StreamChatParams {
  client: OpenAI
  model: string
  messages: ChatCompletionMessageParam[]
  tools?: OpenAI.Chat.Completions.ChatCompletionTool[]
  signal?: AbortSignal
  onTextDelta?: (delta: string) => void
}

export interface StreamChatResult {
  content: string
  toolCalls: Array<{
    id: string
    name: string
    arguments: string
  }>
  finishReason: string | null
}

/**
 * 流式调用 Chat Completions，边收边拼 tool_calls。
 * 对齐 Claude Code：模型决定下一步，运行时只负责执行与回灌。
 */
export async function streamChat(params: StreamChatParams): Promise<StreamChatResult> {
  const { client, model, messages, tools, signal, onTextDelta } = params

  const stream = await client.chat.completions.create(
    {
      model,
      messages,
      tools: tools && tools.length > 0 ? tools : undefined,
      stream: true
    },
    { signal }
  )

  let content = ''
  const toolCallMap = new Map<number, { id: string; name: string; arguments: string }>()
  let finishReason: string | null = null

  for await (const chunk of stream) {
    if (signal?.aborted) break
    const choice = chunk.choices[0]
    if (!choice) continue

    if (choice.finish_reason) {
      finishReason = choice.finish_reason
    }

    const delta = choice.delta
    if (delta?.content) {
      content += delta.content
      onTextDelta?.(delta.content)
    }

    if (delta?.tool_calls) {
      for (const tc of delta.tool_calls) {
        const idx = tc.index ?? 0
        const existing = toolCallMap.get(idx) ?? { id: '', name: '', arguments: '' }
        if (tc.id) existing.id = tc.id
        if (tc.function?.name) existing.name += tc.function.name
        if (tc.function?.arguments) existing.arguments += tc.function.arguments
        toolCallMap.set(idx, existing)
      }
    }
  }

  return {
    content,
    toolCalls: Array.from(toolCallMap.values()).filter((t) => t.name),
    finishReason
  }
}
