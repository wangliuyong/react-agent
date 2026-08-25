/**
 * @ 引用与连线约束工具。
 */

import type { AiVideoCanvasNode, AiVideoProject } from '@shared/ai-video'
import {
  AI_VIDEO_REF_KINDS,
  queryAiVideoRequiredRefKinds
} from '@shared/ai-video'

/** 当前节点入边可达、且可作为参考的节点（按节点 kind 允许的上游类型） */
export function queryLinkedRefCandidates(
  project: AiVideoProject,
  nodeId: string
): AiVideoCanvasNode[] {
  const node = project.canvas.nodes.find((n) => n.id === nodeId)
  if (!node) return []
  const upstreamIds = new Set(
    project.canvas.edges.filter((e) => e.target === nodeId).map((e) => e.source)
  )
  const allowed = new Set([
    ...queryAiVideoRequiredRefKinds(node.kind),
    ...AI_VIDEO_REF_KINDS
  ])
  return project.canvas.nodes.filter(
    (n) => upstreamIds.has(n.id) && allowed.has(n.kind)
  )
}

/** 校验 refs 是否全部合法 */
export function queryValidateRefsLocal(
  project: AiVideoProject,
  node: AiVideoCanvasNode
): string | null {
  const allowed = new Set(queryLinkedRefCandidates(project, node.id).map((n) => n.id))
  for (const id of node.refs ?? []) {
    if (!allowed.has(id)) {
      if (node.kind === 'character_views') {
        return `非法引用：三视图只能参考已连线的角色定妆图`
      }
      if (node.kind === 'storyboard') {
        return `非法 @ 引用：分镜只能选择已连线的角色三视图/场景/道具`
      }
      if (node.kind === 'video_gen') {
        return `非法引用：分镜视频只能参考已连线的分镜图`
      }
      return `非法 @ 引用：只能选择已连线的合法参考节点`
    }
  }
  return null
}

/** 可被 @ 关联的资产节点（角色定妆/三视图/场景/道具），与连线无关，画布内所有资产可选 */
export function queryAssetNodes(project: AiVideoProject): AiVideoCanvasNode[] {
  const ASSET_KINDS = new Set<AiVideoCanvasNode['kind']>([
    'character',
    'character_views',
    'scene',
    'prop'
  ])
  return project.canvas.nodes.filter((n) => ASSET_KINDS.has(n.kind))
}

/** 当前节点上游连线、且为文本类的节点 —— 图像类节点提示词来源 */
export function queryNodePromptSources(
  project: AiVideoProject,
  nodeId: string
): AiVideoCanvasNode[] {
  const upstreamIds = new Set(
    project.canvas.edges.filter((e) => e.target === nodeId).map((e) => e.source)
  )
  return project.canvas.nodes.filter((n) => upstreamIds.has(n.id) && n.type === 'text')
}

/** 文本节点 @ 关联的资产名列表（用于把 @ 文本与 refs 对应校验） */
export function queryLinkedAssetTitles(node: AiVideoCanvasNode): string[] {
  return (node.prompt ?? '')
    .split(/[\s\n]+/)
    .filter((t) => t.startsWith('@'))
    .map((t) => t.slice(1))
}
