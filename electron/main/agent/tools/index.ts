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
import type { AgentTool } from './types'

/** 注册全部工具；新增能力只在此追加，不改 Loop */
export function getAllTools(): AgentTool[] {
  return [
    listAttachmentsTool,
    readFileTool,
    writeFileTool,
    updateTaskListTool,
    fetchWebImagesTool,
    browserNavigateTool,
    browserSnapshotTool,
    browserClickTool,
    browserTypeTool,
    browserUploadTool,
    browserWaitTool,
    xhsPublishNoteTool,
    douyinPublishNoteTool
  ]
}

export function getToolByName(name: string): AgentTool | undefined {
  return getAllTools().find((t) => t.name === name)
}
