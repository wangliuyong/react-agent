import { readFileTool, writeFileTool, listAttachmentsTool } from './file-tools'
import {
  browserNavigateTool,
  browserSnapshotTool,
  browserClickTool,
  browserTypeTool,
  browserUploadTool,
  browserWaitTool
} from './browser-tools'
import { xhsPublishNoteTool, updateTaskListTool, fetchWebImagesTool } from './xhs-tools'
import { douyinPublishNoteTool } from './douyin-tools'
import { fetchHotTopicsTool } from './hot-topics'
import { queryAshareKlineTool, queryAshareRealtimeAnalysisTool } from './stock-tools'
import { queryWeatherTool } from './weather-tools'
import { queryWebDataTool } from './web-data-tools'
import { webSearchTool } from './web-search-tools'
import {
  generateScriptTool,
  generateStoryboardTool,
  generateSceneAssetsTool,
  composeVideoTool
} from './video-tools'
import { notifyMessageTool } from './notify-tools'
import { useSkillTool } from './skill-tools'
import { switchModelTool } from './model-tools'
import { generateImageTool } from './image-tools'
import {
  remotionApplyTemplateSkillTool,
  remotionEnableSfxTool,
  remotionInitProjectTool,
  remotionRenderTool,
  remotionStudioTool
} from './remotion-tools'
import { presentPlanChoicesTool } from './confirm-tools'
import { managementTools } from './management-tools'
import type { AgentTool } from './types'
import { queryResolveToolName } from './query-resolve-tool-name'

/** 进程内工具注册表缓存：启动时预热，避免每次图构建重复组装 */
let cachedTools: AgentTool[] | null = null

/** 组装全量工具列表（未缓存时用） */
function queryBuildAllTools(): AgentTool[] {
  return [
    useSkillTool,
    switchModelTool,
    listAttachmentsTool,
    readFileTool,
    writeFileTool,
    updateTaskListTool,
    presentPlanChoicesTool,
    generateImageTool,
    fetchWebImagesTool,
    fetchHotTopicsTool,
    queryAshareKlineTool,
    queryAshareRealtimeAnalysisTool,
    queryWeatherTool,
    webSearchTool,
    queryWebDataTool,
    generateScriptTool,
    generateStoryboardTool,
    generateSceneAssetsTool,
    composeVideoTool,
    remotionInitProjectTool,
    remotionApplyTemplateSkillTool,
    remotionEnableSfxTool,
    remotionStudioTool,
    remotionRenderTool,
    browserNavigateTool,
    browserSnapshotTool,
    browserClickTool,
    browserTypeTool,
    browserUploadTool,
    browserWaitTool,
    xhsPublishNoteTool,
    douyinPublishNoteTool,
    notifyMessageTool,
    ...managementTools
  ]
}

/**
 * 注册全部工具；新增能力只在此追加，不改 Loop。
 * 启动预热后走缓存，保证全局注入同一份实例列表。
 */
export function getAllTools(): AgentTool[] {
  if (!cachedTools) {
    cachedTools = queryBuildAllTools()
  }
  return cachedTools
}

/**
 * 启动时全局注入：预热工具注册表。
 * 为什么：首轮 Agent 建图前完成装载，避免冷启动抖动；后续 getAllTools 直接命中缓存。
 */
export function postWarmAgentTools(): number {
  cachedTools = null
  return getAllTools().length
}

/**
 * 按名称查找工具：精确优先，失败则 ≥90% 相似度模糊命中。
 */
export function getToolByName(name: string): AgentTool | undefined {
  const all = getAllTools()
  const exact = all.find((t) => t.name === name)
  if (exact) return exact
  const resolved = queryResolveToolName(
    name,
    all.map((t) => t.name)
  )
  if (!resolved) return undefined
  return all.find((t) => t.name === resolved.name)
}
