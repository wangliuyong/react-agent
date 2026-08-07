import type { AgentEvent } from '../../../shared/types'
import { getMainWindow } from '../window'

/** 推理无增量默认超时（与历史 wait 超时一致） */
export const THINKING_STALL_TIMEOUT_MS = 120_000

type ThinkingGate = {
  /** 当前 LLM 调用是否仍在输出推理内容 */
  reasoning: boolean
  waiters: Array<() => void>
  /** Start 时武装的 stall 定时器；无人 wait 时也能超时收尾 */
  stallTimer: ReturnType<typeof setTimeout> | null
  stallTimeoutMs: number
}

const gates = new Map<string, ThinkingGate>()

/** stall 超时时中止挂死的 LLM 流（由 graph-bridge 绑定，避免循环依赖） */
type ThinkingStallAbortHandler = (sessionId: string) => void
let stallAbortHandler: ThinkingStallAbortHandler | null = null

/** 绑定 stall 超时后的会话 abort 回调（仅 abort signal，不走用户中止全量清理） */
export function postBindThinkingStallAbort(handler: ThinkingStallAbortHandler): void {
  stallAbortHandler = handler
}

function queryGate(sessionId: string): ThinkingGate {
  let gate = gates.get(sessionId)
  if (!gate) {
    gate = {
      reasoning: false,
      waiters: [],
      stallTimer: null,
      stallTimeoutMs: THINKING_STALL_TIMEOUT_MS
    }
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

/** 清除 stall 定时器 */
function clearStallTimer(gate: ThinkingGate): void {
  if (gate.stallTimer == null) return
  clearTimeout(gate.stallTimer)
  gate.stallTimer = null
}

/**
 * 武装 / 刷新 stall 超时：超时后走正式 complete，并 abort 挂死流。
 * 为什么：LLM 卡在流式阶段时尚无人 queryWaitThinkingSettled，旧逻辑永不超时。
 */
function armStallTimer(sessionId: string, gate: ThinkingGate): void {
  clearStallTimer(gate)
  gate.stallTimer = setTimeout(() => {
    gate.stallTimer = null
    if (!gate.reasoning) return
    postThinkingReasoningComplete(sessionId)
    stallAbortHandler?.(sessionId)
  }, gate.stallTimeoutMs)
}

/**
 * 首个 reasoning token 到达（或正文 token 刷新）：标记推理进行中并武装 stall。
 * @param stallTimeoutMs 可注入短超时供单测；默认 120s
 */
export function postThinkingReasoningStart(
  sessionId: string,
  stallTimeoutMs: number = THINKING_STALL_TIMEOUT_MS
): void {
  const gate = queryGate(sessionId)
  gate.reasoning = true
  gate.stallTimeoutMs = stallTimeoutMs
  armStallTimer(sessionId, gate)
}

/**
 * 本轮 LLM 推理结束：先发 thinking_complete，再唤醒等待方（工具/回答/下一工作流节点）。
 */
export function postThinkingReasoningComplete(sessionId: string): void {
  const gate = queryGate(sessionId)
  if (!gate.reasoning) return
  clearStallTimer(gate)
  gate.reasoning = false
  emitAgentEvent({ type: 'thinking_complete', sessionId })
  for (const resolve of gate.waiters) resolve()
  gate.waiters = []
}

/**
 * 等待当前会话推理阶段结束；无推理时立即返回。
 * 超时走正式 complete（通知 UI），避免静默清 flag 导致回答被 thinkingInProgress 隐藏。
 */
export function queryWaitThinkingSettled(
  sessionId: string,
  timeoutMs: number = THINKING_STALL_TIMEOUT_MS
): Promise<void> {
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
      // 统一走 complete，保证 UI 收到 thinking_complete
      postThinkingReasoningComplete(sessionId)
    }, timeoutMs)
  })
}

/**
 * 会话结束或中止时清理门控状态。
 * 若仍在推理中，先发 thinking_complete 再清理，避免 UI 卡在「思考中」。
 */
export function postResetThinkingGate(sessionId: string): void {
  const gate = gates.get(sessionId)
  if (!gate) return
  if (gate.reasoning) {
    postThinkingReasoningComplete(sessionId)
  } else {
    clearStallTimer(gate)
    for (const resolve of gate.waiters) resolve()
    gate.waiters = []
  }
  gates.delete(sessionId)
}
