import type { AgentToolCatalog } from '@shared/types'
import type {
  AgentAssetMutationResult,
  AgentAssetRecord,
  QueryAgentAssetsOptions
} from '@shared/agent-assets'

/** 读取 Agent 工具注册表、源码预览与角色注入 */
export async function queryAgentToolsCatalog(): Promise<AgentToolCatalog> {
  return window.api.queryAgentToolsCatalog()
}

/** 列举 Agent 生成的本地文件资产 */
export async function queryAgentAssets(
  options?: QueryAgentAssetsOptions
): Promise<AgentAssetRecord[]> {
  return window.api.queryAgentAssets(options)
}

/** 删除单个 Agent 产出文件 */
export async function postDeleteAgentAsset(filePath: string): Promise<AgentAssetMutationResult> {
  return window.api.postDeleteAgentAsset(filePath)
}

/** 批量删除 Agent 产出文件 */
export async function postDeleteAgentAssets(filePaths: string[]): Promise<AgentAssetMutationResult> {
  if (typeof window.api.postDeleteAgentAssets === 'function') {
    return window.api.postDeleteAgentAssets(filePaths)
  }
  let deletedCount = 0
  for (const filePath of filePaths) {
    const result = await window.api.postDeleteAgentAsset(filePath)
    deletedCount += result.deletedCount
  }
  return { ok: true, deletedCount }
}

/** 一键清空全部 Agent 产出 */
export async function postClearAgentAssets(): Promise<AgentAssetMutationResult> {
  return window.api.postClearAgentAssets()
}

/** 读取文本类资产预览内容 */
export async function queryAgentAssetTextPreview(filePath: string): Promise<string | null> {
  return window.api.queryAgentAssetTextPreview(filePath)
}
