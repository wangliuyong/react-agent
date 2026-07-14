/**
 * 将 WorkflowDefinition 编译为 LangGraph StateGraph，替代 engine 内 for 循环主路径。
 * 节点业务逻辑复用 engine 导出的 executeTopLevelNode。
 */
import { Command, END, MemorySaver, START, StateGraph, interrupt, isGraphInterrupt } from '@langchain/langgraph'
import type {
  Session,
  TaskItemStatus,
  WorkflowDefinition
} from '../../../shared/types'
import { WorkflowGraphAnnotation, type WorkflowGraphState } from '../agent/graph/state'
import {
  executeTopLevelNodeForGraph,
  finalizeWorkflowRun,
  prepareWorkflowRun
} from './engine-graph-api'

/** 工作流专用进程内 checkpoint；thread_id = runId */
const workflowCheckpointer = new MemorySaver()

/**
 * 编译并执行一次工作流 Run（LangGraph 路径）。
 */
export async function executeWorkflowWithLangGraph(
  runId: string,
  fromStart: boolean
): Promise<void> {
  const prepared = prepareWorkflowRun(runId, fromStart)
  if (!prepared) return

  const { workflow, session, run, specs, statusMap, startIndex, signal } = prepared

  const graph = compileDefinitionToGraph({
    workflow,
    session,
    specs,
    signal,
    initialStatusMap: statusMap,
    startIndex
  })

  const config = {
    configurable: { thread_id: runId },
    recursionLimit: Math.max(50, workflow.nodes.length * 4),
    signal
  }

  let input: Partial<WorkflowGraphState> | Command = {
    sessionId: session.id,
    runId: run.id,
    workflowId: workflow.id,
    context: { ...run.context },
    nodeIndex: startIndex,
    statusMap: Object.fromEntries(statusMap),
    messages: []
  }

  try {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      if (signal.aborted) {
        finalizeWorkflowRun(runId, session.id, 'aborted')
        return
      }

      try {
        const stream = await graph.stream(input as Parameters<typeof graph.stream>[0], {
          ...config,
          streamMode: 'values'
        })
        for await (const _ of stream) {
          if (signal.aborted) {
            finalizeWorkflowRun(runId, session.id, 'aborted')
            return
          }
        }
      } catch (e) {
        if (isGraphInterrupt(e)) {
          const reason = extractReason(e) || '等待用户确认'
          const { waitForUserContinue } = await import('../agent/loop')
          const { queryWorkflowRun, postWorkflowRun } = await import('../store/workflow-runs')
          const live = queryWorkflowRun(runId)
          if (live) {
            postWorkflowRun({
              ...live,
              status: 'awaiting_user',
              updatedAt: Date.now()
            })
          }
          await waitForUserContinue(session.id, reason)
          if (signal.aborted) {
            finalizeWorkflowRun(runId, session.id, 'aborted')
            return
          }
          input = new Command({ resume: true })
          continue
        }
        throw e
      }

      const snap = await graph.getState(config)
      if (hasInterrupt(snap)) {
        const reason = extractReasonFromState(snap) || '等待用户确认'
        const { waitForUserContinue } = await import('../agent/loop')
        await waitForUserContinue(session.id, reason)
        if (signal.aborted) {
          finalizeWorkflowRun(runId, session.id, 'aborted')
          return
        }
        input = new Command({ resume: true })
        continue
      }

      finalizeWorkflowRun(runId, session.id, 'success')
      return
    }
  } catch (e) {
    if (e instanceof Error && e.message === '__aborted__') {
      finalizeWorkflowRun(runId, session.id, 'aborted')
      return
    }
    const message = e instanceof Error ? e.message : String(e)
    finalizeWorkflowRun(runId, session.id, 'failed', message)
  }
}

function compileDefinitionToGraph(params: {
  workflow: WorkflowDefinition
  session: Session
  specs: Array<{ id: string; title: string; parentId?: string }>
  signal: AbortSignal
  initialStatusMap: Map<string, TaskItemStatus>
  startIndex: number
}) {
  const { workflow, session, specs, signal } = params

  /**
   * 推进一个顶层节点；await_user 在叶节点内 interrupt。
   * 结束后 nodeIndex+1，直到越界 → END。
   */
  async function advanceNode(
    state: WorkflowGraphState
  ): Promise<Partial<WorkflowGraphState>> {
    if (signal.aborted) throw new Error('__aborted__')
    const idx = state.nodeIndex
    if (idx >= workflow.nodes.length) {
      return state
    }

    const node = workflow.nodes[idx]
    const statusMap = new Map<string, TaskItemStatus>(
      Object.entries(state.statusMap) as Array<[string, TaskItemStatus]>
    )

    // 从磁盘拉最新 run（context / cursor）
    const { queryWorkflowRun } = await import('../store/workflow-runs')
    let run = queryWorkflowRun(state.runId)
    if (!run) throw new Error('运行实例不存在')

    run = await executeTopLevelNodeForGraph(
      session.id,
      node,
      run,
      statusMap,
      specs,
      session,
      signal
    )

    return {
      context: { ...run.context },
      nodeIndex: idx + 1,
      statusMap: Object.fromEntries(statusMap),
      sessionId: state.sessionId,
      runId: state.runId,
      workflowId: state.workflowId
    }
  }

  function routeAfterAdvance(state: WorkflowGraphState): string {
    if (state.nodeIndex >= workflow.nodes.length) return END
    return 'advance'
  }

  return new StateGraph(WorkflowGraphAnnotation)
    .addNode('advance', advanceNode)
    .addEdge(START, 'advance')
    .addConditionalEdges('advance', routeAfterAdvance, {
      advance: 'advance',
      [END]: END
    })
    .compile({ checkpointer: workflowCheckpointer })
}

function extractReason(err: unknown): string | null {
  if (!isGraphInterrupt(err)) return null
  const interrupts = (err as { interrupts?: Array<{ value?: unknown }> }).interrupts ?? []
  for (const item of interrupts) {
    const v = item?.value as { reason?: string } | string | undefined
    if (typeof v === 'string') return v
    if (v && typeof v === 'object' && typeof v.reason === 'string') return v.reason
  }
  return null
}

function hasInterrupt(state: {
  tasks?: Array<{ interrupts?: unknown[] }>
}): boolean {
  return (state.tasks ?? []).some((t) => (t.interrupts?.length ?? 0) > 0)
}

function extractReasonFromState(state: {
  tasks?: Array<{ interrupts?: Array<{ value?: unknown }> }>
}): string | null {
  for (const task of state.tasks ?? []) {
    for (const item of task.interrupts ?? []) {
      const v = item?.value as { reason?: string } | string | undefined
      if (typeof v === 'string') return v
      if (v && typeof v === 'object' && typeof v.reason === 'string') return v.reason
    }
  }
  return null
}

/** 工作流 await_user 辅助（供外部需要显式 interrupt 时调用） */
export function interruptAwaitUser(sessionId: string, reason: string): void {
  interrupt({ type: 'await_user', sessionId, reason })
}