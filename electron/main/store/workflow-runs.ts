import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import type { WorkflowRun, WorkflowRunStatus } from '../../../shared/types'
import { getDataRoot } from './paths'

function getRunsPath(): string {
  return join(getDataRoot(), 'workflow-runs.json')
}

const RUN_STATUSES: WorkflowRunStatus[] = [
  'pending',
  'running',
  'awaiting_user',
  'success',
  'failed',
  'aborted'
]

function normalizeRun(raw: WorkflowRun): WorkflowRun {
  const now = Date.now()
  const status = RUN_STATUSES.includes(raw.status) ? raw.status : 'pending'
  return {
    id: String(raw.id || '').trim() || crypto.randomUUID(),
    workflowId: String(raw.workflowId || '').trim(),
    sessionId: String(raw.sessionId || '').trim(),
    status,
    cursorNodeId: raw.cursorNodeId ?? null,
    context:
      raw.context && typeof raw.context === 'object' && !Array.isArray(raw.context)
        ? { ...raw.context }
        : {},
    errorMessage: raw.errorMessage,
    createdAt: raw.createdAt ?? now,
    updatedAt: raw.updatedAt ?? now
  }
}

function readRunsFromDisk(): WorkflowRun[] {
  const path = getRunsPath()
  if (!existsSync(path)) return []
  try {
    const parsed = JSON.parse(readFileSync(path, 'utf-8')) as WorkflowRun[]
    if (!Array.isArray(parsed)) return []
    return parsed.map(normalizeRun)
  } catch {
    return []
  }
}

function writeRuns(runs: WorkflowRun[]): WorkflowRun[] {
  const normalized = runs.map(normalizeRun)
  writeFileSync(getRunsPath(), JSON.stringify(normalized, null, 2), 'utf-8')
  return normalized
}

export function queryWorkflowRuns(): WorkflowRun[] {
  return readRunsFromDisk()
}

export function queryWorkflowRun(id: string): WorkflowRun | null {
  return readRunsFromDisk().find((r) => r.id === id) ?? null
}

/** 按会话查找进行中的运行（用于中断后继续） */
export function queryActiveWorkflowRunBySession(sessionId: string): WorkflowRun | null {
  const active: WorkflowRunStatus[] = ['pending', 'running', 'awaiting_user', 'failed', 'aborted']
  return (
    readRunsFromDisk()
      .filter((r) => r.sessionId === sessionId && active.includes(r.status))
      .sort((a, b) => b.updatedAt - a.updatedAt)[0] ?? null
  )
}

/** 按会话取最近一次工作流运行（含已结束），用于流程任务完成后推送通知 */
export function queryLatestWorkflowRunBySession(sessionId: string): WorkflowRun | null {
  return (
    readRunsFromDisk()
      .filter((r) => r.sessionId === sessionId)
      .sort((a, b) => b.updatedAt - a.updatedAt)[0] ?? null
  )
}

export function postWorkflowRun(run: WorkflowRun): WorkflowRun {
  const list = readRunsFromDisk()
  const next = normalizeRun({ ...run, updatedAt: Date.now() })
  const idx = list.findIndex((r) => r.id === next.id)
  const merged = idx >= 0 ? list.map((r, i) => (i === idx ? next : r)) : [...list, next]
  writeRuns(merged)
  return next
}
