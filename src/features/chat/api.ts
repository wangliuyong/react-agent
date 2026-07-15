import type { AppSettings, ModelOption, Session, SessionType } from '@shared/types'
import { createEmptySession } from './types'

/** 读：会话列表 */
export async function querySessions(): Promise<Session[]> {
  return window.api.querySessions()
}

export async function querySession(id: string): Promise<Session | null> {
  return window.api.querySession(id)
}

/** 写：新建或更新会话 */
export async function postSession(session: Session): Promise<Session> {
  return window.api.postSession(session)
}

export async function postDeleteSession(id: string): Promise<void> {
  return window.api.postDeleteSession(id)
}

export async function postCreateSession(type: SessionType = 'chat'): Promise<Session> {
  const session = createEmptySession(crypto.randomUUID(), type)
  return postSession(session)
}

export async function postAgentChat(
  sessionId: string,
  content: string,
  attachmentPaths?: string[]
): Promise<void> {
  return window.api.postAgentChat({ sessionId, content, attachmentPaths })
}

export async function postAgentAbort(sessionId: string): Promise<void> {
  return window.api.postAgentAbort(sessionId)
}

export async function postAgentContinue(sessionId: string): Promise<void> {
  return window.api.postAgentContinue(sessionId)
}

export async function postSelectImages(): Promise<string[]> {
  return window.api.postSelectImages()
}

/** 读取本地图片为 data URL，供聊天预览 */
export async function queryLocalImageDataUrl(filePath: string): Promise<string | null> {
  return window.api.queryLocalImageDataUrl(filePath)
}

/** 从当前供应商平台拉取可用模型（DeepSeek 等 OpenAI 兼容 /models） */
export async function queryProviderModels(
  override?: Partial<Pick<AppSettings, 'provider' | 'apiKey' | 'baseUrl'>>
): Promise<ModelOption[]> {
  return window.api.queryProviderModels(override)
}
