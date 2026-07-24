/**
 * 用户在工具内确认弹窗选择「取消」时抛出，用于立即终止 ReAct / 工作流 Agent 步，
 * 避免将「用户取消」作为普通 tool 结果交回模型再次发起同类操作。
 */
export class AgentUserCancelledError extends Error {
  constructor(message = '用户已取消操作') {
    super(message)
    this.name = 'AgentUserCancelledError'
  }
}

export function queryIsAgentUserCancelledError(err: unknown): boolean {
  return err instanceof AgentUserCancelledError
}
