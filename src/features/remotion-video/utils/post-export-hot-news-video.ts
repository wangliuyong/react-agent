/**
 * Remotion 热点新闻导出：入队后后台跑 Agent 渲染，
 * UI 立刻可在「导出列表」看到任务，无需阻塞等待成片。
 */
import type { HotNewsProps } from '../types/hot-news-props'
import type { RemotionExportRecord } from '@shared/remotion-exports'
import { postAgentChat, postAgentContinue, postCreateSession, querySession } from '@/features/chat/api'
import {
  postEnqueueRemotionExport,
  postUpdateRemotionExport
} from '../api'

export interface PostExportHotNewsVideoInput {
  /** 技能 id，如 remotion-template-hot-news */
  skillId: string
  compositionId: string
  width: number
  height: number
  fps: number
  durationInFrames: number
  props?: HotNewsProps
  /** 列表展示标题（模板名） */
  title?: string
}

export interface PostEnqueueHotNewsExportResult {
  /** 已写入导出列表的任务 */
  record: RemotionExportRecord
  /** 后台 Agent 会话 id */
  sessionId: string
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
 * 在已有会话中执行 Agent 导出，并轮询直到成功 / 失败 / 超时。
 * 供入队后的后台任务调用；不直接面向 UI。
 */
async function postRunHotNewsExportJob(input: {
  sessionId: string
  exportId: string
  skillId: string
  compositionId: string
  width: number
  height: number
  fps: number
  durationInFrames: number
  props?: HotNewsProps
  outputFileName: string
}): Promise<string> {
  const propsHint = input.props
    ? `props=${JSON.stringify(input.props)}`
    : '不传 props（使用技能 template 内默认文案）'

  const prompt = [
    '请为当前会话导出 Remotion 模版 mp4，严格按顺序执行工具：',
    `1. remotion_apply_template_skill：skillId=${input.skillId}，compositionId=${input.compositionId}，width=${input.width}，height=${input.height}，fps=${input.fps}，durationInFrames=${input.durationInFrames}，openStudio=false，${propsHint}`,
    `2. remotion_render：compositionId=${input.compositionId}，quality=standard，outputFileName=${input.outputFileName}`,
    '禁止手写整套 Composition；必须使用技能 template 拼装结果。',
    '成功后在回复中明确写出 mp4 绝对路径。'
  ].join('\n')

  await postAgentChat(input.sessionId, prompt)
  await postUpdateRemotionExport({
    id: input.exportId,
    status: 'exporting',
    progressPercent: 8
  })

  const deadline = Date.now() + 600_000
  let renderContinued = false

  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 1500))
    const current = await querySession(input.sessionId)
    if (!current) continue

    const messages = current.messages ?? []
    const mp4 = queryMp4PathFromMessages(messages)
    if (mp4) {
      await postUpdateRemotionExport({
        id: input.exportId,
        status: 'success',
        outputPath: mp4,
        progressPercent: 100
      })
      return mp4
    }

    const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant')
    const awaitMeta = lastAssistant?.awaitMeta
    if (!renderContinued && awaitMeta?.choices?.some((c) => c.id === 'render')) {
      await postUpdateRemotionExport({
        id: input.exportId,
        status: 'exporting',
        progressPercent: 18
      })
      await postAgentContinue(input.sessionId, { choiceId: 'render' })
      renderContinued = true
      await postUpdateRemotionExport({
        id: input.exportId,
        status: 'exporting',
        progressPercent: 22
      })
      continue
    }

    // 渲染已开始后，进度由主进程 remotion job 写入；此处保持「导出中」心跳
    if (renderContinued) {
      const list = await window.api.queryRemotionExports()
      const live = list.find((item) => item.id === input.exportId)
      if (live?.status === 'success' && live.outputPath) {
        return live.outputPath
      }
      if (live?.status === 'failed') {
        throw new Error(live.errorMessage || '导出失败')
      }
    } else {
      // 准备阶段心跳，避免列表一直显示 0%
      await postUpdateRemotionExport({
        id: input.exportId,
        status: 'exporting',
        progressPercent: 12
      })
    }

    const running = (current.tasks ?? []).some(
      (t) => t.status === 'running' || t.status === 'pending'
    )
    if (!running && messages.length > 0 && renderContinued) {
      const retryPath = queryMp4PathFromMessages(messages)
      if (retryPath) {
        await postUpdateRemotionExport({
          id: input.exportId,
          status: 'success',
          outputPath: retryPath,
          progressPercent: 100
        })
        return retryPath
      }
      const last = messages[messages.length - 1]
      if (last.role === 'assistant' && last.content.includes('失败')) {
        const errMsg = last.content.slice(0, 400)
        await postUpdateRemotionExport({
          id: input.exportId,
          status: 'failed',
          errorMessage: errMsg
        })
        throw new Error(errMsg)
      }
    }
  }

  const timeoutMsg = '导出超时，请到聊天查看 Agent 执行详情'
  await postUpdateRemotionExport({
    id: input.exportId,
    status: 'failed',
    errorMessage: timeoutMsg
  })
  throw new Error(timeoutMsg)
}

/**
 * 导出入队：立刻写入「导出中」记录并启动后台 Agent 渲染。
 * 调用方应马上提示用户去导出列表查看，不必 await 成片路径。
 */
export async function postEnqueueHotNewsExport(
  input: PostExportHotNewsVideoInput
): Promise<PostEnqueueHotNewsExportResult> {
  const session = await postCreateSession('chat')
  const outputFileName = `hot-news-${Date.now()}.mp4`

  const record = await postEnqueueRemotionExport({
    sessionId: session.id,
    compositionId: input.compositionId,
    fileName: outputFileName,
    title: input.title
  })

  // 后台跑完再回写成功/失败；入队 API 立即返回
  void postRunHotNewsExportJob({
    sessionId: session.id,
    exportId: record.id,
    skillId: input.skillId,
    compositionId: input.compositionId,
    width: input.width,
    height: input.height,
    fps: input.fps,
    durationInFrames: input.durationInFrames,
    props: input.props,
    outputFileName
  }).catch(async (err) => {
    const message = err instanceof Error ? err.message : '导出失败'
    try {
      await postUpdateRemotionExport({
        id: record.id,
        status: 'failed',
        errorMessage: message
      })
    } catch {
      // 回写失败时忽略，避免未处理 rejection
    }
  })

  return { record, sessionId: session.id }
}

/**
 * @deprecated 请改用 postEnqueueHotNewsExport；保留兼容旧调用。
 * 通过 Agent 初始化工程、写入 default-props 并渲染 mp4（阻塞直到完成）。
 */
export async function postExportHotNewsVideo(
  input: PostExportHotNewsVideoInput
): Promise<string> {
  const { record, sessionId } = await postEnqueueHotNewsExport(input)
  const deadline = Date.now() + 600_000

  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 2000))
    const list = await window.api.queryRemotionExports()
    const current = list.find((item) => item.id === record.id)
    if (!current) continue
    if (current.status === 'success' && current.outputPath) {
      return current.outputPath
    }
    if (current.status === 'failed') {
      throw new Error(current.errorMessage || '导出失败')
    }
  }

  // 兜底：直接查会话（防止列表未刷新）
  const session = await querySession(sessionId)
  const mp4 = session ? queryMp4PathFromMessages(session.messages ?? []) : null
  if (mp4) return mp4
  throw new Error('导出超时，请到聊天查看 Agent 执行详情')
}
