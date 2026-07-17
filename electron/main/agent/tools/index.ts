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
import { queryWeatherTool } from './weather-tools'
import { queryWebDataTool } from './web-data-tools'
import {
  generateScriptTool,
  generateStoryboardTool,
  generateSceneAssetsTool,
  composeVideoTool
} from './video-tools'
import { notifyMessageTool } from './notify-tools'
import { useSkillTool } from './skill-tools'
import type { AgentTool } from './types'

/** 注册全部工具；新增能力只在此追加，不改 Loop */
export function getAllTools(): AgentTool[] {
  return [
    useSkillTool,
    listAttachmentsTool,
    readFileTool,
    writeFileTool,
    updateTaskListTool,
    fetchWebImagesTool,
    fetchHotTopicsTool,
    queryWeatherTool,
    queryWebDataTool,
    generateScriptTool,
    generateStoryboardTool,
    generateSceneAssetsTool,
    composeVideoTool,
    browserNavigateTool,
    browserSnapshotTool,
    browserClickTool,
    browserTypeTool,
    browserUploadTool,
    browserWaitTool,
    xhsPublishNoteTool,
    douyinPublishNoteTool,
    notifyMessageTool
  ]
}

export function getToolByName(name: string): AgentTool | undefined {
  return getAllTools().find((t) => t.name === name)
}
