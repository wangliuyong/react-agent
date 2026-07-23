import type { ToolProgressPayload } from '@shared/types'
import { queryToolLabel } from './agent-status'

/** 是否应对当前工具展示进度条 */
export function queryShouldShowToolProgress(
  toolName: string | null | undefined,
  progress: ToolProgressPayload | null | undefined
): boolean {
  if (!toolName || !progress) return false
  return toolName === 'remotion_render'
}

/** 进度条主标题（工具可读名） */
export function queryToolProgressTitle(toolName: string): string {
  return queryToolLabel(toolName)
}
