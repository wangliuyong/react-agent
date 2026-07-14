import type { AgentRule, AgentRuleUpsertInput } from '@shared/types'

/** 读：全部 Agent 用户规则 */
export async function queryAgentRules(): Promise<AgentRule[]> {
  return window.api.queryAgentRules()
}

/** 写：新增或更新规则 */
export async function postAgentRule(input: AgentRuleUpsertInput): Promise<AgentRule> {
  return window.api.postAgentRule(input)
}

/** 写：删除规则 */
export async function postDeleteAgentRule(id: string): Promise<void> {
  return window.api.postDeleteAgentRule(id)
}
