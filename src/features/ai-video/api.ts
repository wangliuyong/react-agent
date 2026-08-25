/**
 * AI 视频画布前端 API（IPC 封装，读 query* / 写 post*）。
 */

import type {
  AiVideoProject,
  AiVideoNodeEvent,
  AiVideoNodeRunRequest,
  AiVideoCanvasRunRequest,
  ComfyWorkflowMeta,
  ComfyUiStatusResult
} from '@shared/ai-video'
import {
  AI_VIDEO_DEFAULT_GLOBAL_SKILL_IDS,
  AI_VIDEO_KIND_LABEL,
  queryAiVideoBaseType,
  queryAiVideoDefaultWorkflow
} from '@shared/ai-video'

export async function queryAiVideoProjects(): Promise<AiVideoProject[]> {
  return window.api.queryAiVideoProjects()
}

export async function queryAiVideoProject(id: string): Promise<AiVideoProject | null> {
  return window.api.queryAiVideoProject(id)
}

export async function postAiVideoProject(project: AiVideoProject): Promise<AiVideoProject> {
  return window.api.postAiVideoProject(project)
}

export async function postDeleteAiVideoProject(id: string): Promise<void> {
  return window.api.postDeleteAiVideoProject(id)
}

export async function postAiVideoNodeRun(
  req: AiVideoNodeRunRequest
): Promise<{ ok: boolean; message?: string }> {
  return window.api.postAiVideoNodeRun(req)
}

export async function postAiVideoCanvasRun(
  req: AiVideoCanvasRunRequest
): Promise<{ ok: boolean; message?: string }> {
  return window.api.postAiVideoCanvasRun(req)
}

export async function postAiVideoAbortRun(projectId: string): Promise<void> {
  return window.api.postAiVideoAbortRun(projectId)
}

export function onAiVideoNodeEvent(cb: (event: AiVideoNodeEvent) => void): () => void {
  return window.api.onAiVideoNodeEvent(cb)
}

export async function queryComfyWorkflows(): Promise<ComfyWorkflowMeta[]> {
  return window.api.queryComfyWorkflows()
}

export async function queryComfyUiStatus(): Promise<ComfyUiStatusResult> {
  return window.api.queryComfyUiStatus()
}

/** 新建带编剧节点的空项目 */
export async function postCreateAiVideoProject(title?: string): Promise<AiVideoProject> {
  const id = crypto.randomUUID()
  const now = Date.now()
  const screenwriterId = crypto.randomUUID()
  const project: AiVideoProject = {
    id,
    title: title?.trim() || `AI 视频 ${new Date().toLocaleString('zh-CN')}`,
    createdAt: now,
    updatedAt: now,
    globalSkillIds: [...AI_VIDEO_DEFAULT_GLOBAL_SKILL_IDS],
    canvas: {
      nodes: [
        {
          id: screenwriterId,
          title: AI_VIDEO_KIND_LABEL.screenwriter,
          type: queryAiVideoBaseType('screenwriter'),
          kind: 'screenwriter',
          position: { x: 80, y: 160 },
          prompt: '',
          status: 'idle'
        }
      ],
      edges: [],
      viewport: { x: 0, y: 0, zoom: 1 }
    }
  }
  return postAiVideoProject(project)
}

export { queryAiVideoDefaultWorkflow, AI_VIDEO_KIND_LABEL }
