import type { AgentEvent } from '../../../shared/types'
import { getMainWindow } from '../window'

type ThinkingGate = {
  /** 当前 LLM 调用是否仍在输出推理内容 */
  reasoning: boolean
  waiters: Array<() => void>
}

const gates = new Map<string, ThinkingGate>()

function queryGate(sessionId: string): ThinkingGate {
  let gate = gates.get(sessionId)
  if (!gate) {
    gate = { reasoning: false, waiters: [] }
    gates.set(sessionId, gate)
  }
  return gate
}

function emitAgentEvent(event: AgentEvent): void {
  const win = getMainWindow()
  if (win && !win.isDestroyed()) {
    win.webContents.send('event:agent', event)
  }
}

/** 首个 reasoning token 到达：标记推理进行中 */
export function postThinkingReasoningStart(sessionId: string): void {
  queryGate(sessionId).reasoning = true
}

/**
 * 本轮 LLM 推理结束：先发 thinking_complete，再唤醒等待方（工具/回答/下一工作流节点）。
 */
export function postThinkingReasoningComplete(sessionId: string): void {
  const gate = queryGate(sessionId)
  if (!gate.reasoning) return
  gate.reasoning = false
  emitAgentEvent({ type: 'thinking_complete', sessionId })
  for (const resolve of gate.waiters) resolve()
  gate.waiters = []
}

/** 等待当前会话推理阶段结束；无推理时立即返回；超时后强制放行避免工具结果永久阻塞 */
export function queryWaitThinkingSettled(sessionId: string, timeoutMs = 120_000): Promise<void> {
  const gate = queryGate(sessionId)
  if (!gate.reasoning) return Promise.resolve()
  return new Promise((resolve) => {
    let settled = false
    const done = (): void => {
      if (settled) return
      settled = true
      resolve()
    }
    gate.waiters.push(done)
    setTimeout(() => {
      if (!gate.reasoning) return
      gate.reasoning = false
      for (const waiter of gate.waiters) waiter()
      gate.waiters = []
      done()
    }, timeoutMs)
  })
}

/** 会话结束或中止时清理门控状态 */
export function postResetThinkingGate(sessionId: string): void {
  const gate = gates.get(sessionId)
  if (!gate) return
  gate.reasoning = false
  for (const resolve of gate.waiters) resolve()
  gates.delete(sessionId)
}
