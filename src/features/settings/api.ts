import type { AgentToolCatalog } from '@shared/types'

/** 读取 Agent 工具注册表、源码预览与角色注入 */
export async function queryAgentToolsCatalog(): Promise<AgentToolCatalog> {
  return window.api.queryAgentToolsCatalog()
}
