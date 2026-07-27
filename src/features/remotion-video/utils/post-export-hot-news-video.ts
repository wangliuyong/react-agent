import type { HotNewsProps } from '@remotion-starter/compositions/hot-news/types'
import { postAgentChat, postAgentContinue, postCreateSession, querySession } from '@/features/chat/api'

export interface PostExportHotNewsVideoInput {
  compositionId: string
  width: number
  height: number
  fps: number
  durationInFrames: number
  props: HotNewsProps
}

/** 从会话消息中提取 mp4 绝对路径 */
function queryMp4PathFromMessages(messages: { content: string }[]): string | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const text = messages[i].content
    const match = text.match(/(?:渲染成功|Remotion 渲染成功)[^`\n]*[`']?([^\s`']+\.mp4)/i)
    if (match?.[1]) return match[1]
    const pathMatch = text.match(/(\/[^\s`"']+\.mp4)/)
    if (pathMatch?.[1] && text.includes('remotion')) return pathMatch[1]
  }
  return null
}

/**
 * 通过 Agent 初始化工程、写入 default-props 并渲染 mp4。
 * 渲染确认弹窗在后台会话中自动选择「确认渲染」。
 */
export async function postExportHotNewsVideo(
  input: PostExportHotNewsVideoInput
): Promise<string> {
  const session = await postCreateSession('chat')
  const propsJson = JSON.stringify(input.props, null, 2)

  const prompt = [
    '请为当前会话导出 Remotion 热点新闻 mp4，严格按顺序执行工具，不要改模板结构：',
    `1. remotion_init_project：compositionId=${input.compositionId}，width=${input.width}，height=${input.height}，fps=${input.fps}，durationInFrames=${input.durationInFrames}`,
    '2. write_file 覆盖工程内 src/compositions/hot-news/default-props.ts，内容为：',
    `export const HOT_NEWS_WIDE_DEFAULT_PROPS = ${propsJson} as const`,
    `export const HOT_NEWS_VERTICAL_DEFAULT_PROPS = ${propsJson} as const`,
    `3. remotion_render：compositionId=${input.compositionId}，quality=standard`,
    '成功后在回复中明确写出 mp4 绝对路径。'
  ].join('\n')

  await postAgentChat(session.id, prompt)

  const deadline = Date.now() + 600_000
  let renderContinued = false

  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 2000))
    const current = await querySession(session.id)
    if (!current) continue

    const messages = current.messages ?? []
    const mp4 = queryMp4PathFromMessages(messages)
    if (mp4) return mp4

    const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant')
    const awaitMeta = lastAssistant?.awaitMeta
    if (
      !renderContinued &&
      awaitMeta?.choices?.some((c) => c.id === 'render')
    ) {
      await postAgentContinue(session.id, { choiceId: 'render' })
      renderContinued = true
      continue
    }

    const running = (current.tasks ?? []).some(
      (t) => t.status === 'running' || t.status === 'pending'
    )
    if (!running && messages.length > 0 && renderContinued) {
      const retryPath = queryMp4PathFromMessages(messages)
      if (retryPath) return retryPath
      const last = messages[messages.length - 1]
      if (last.role === 'assistant' && last.content.includes('失败')) {
        throw new Error(last.content.slice(0, 400))
      }
    }
  }

  throw new Error('导出超时，请到聊天查看 Agent 执行详情')
}
