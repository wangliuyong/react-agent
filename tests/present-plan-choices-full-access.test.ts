import { describe, expect, it, vi } from 'vitest'
import { presentPlanChoicesTool } from '../electron/main/agent/tools/confirm-tools'
import type { ToolContext } from '../electron/main/agent/tools/types'

function queryMockCtx(fullAccess: boolean, emitAwaitUser = vi.fn()): ToolContext {
  return {
    sessionId: 's1',
    fullAccess,
    attachmentPaths: [],
    emitAwaitUser,
    updateTasks: () => undefined
  }
}

describe('present_plan_choices', () => {
  const choices = [
    { id: 'a', label: '方案A', description: '热度高' },
    { id: 'b', label: '方案B', description: '稳妥' }
  ]

  it('完全访问时不暂停，返回 skipped 交由模型自行决策', async () => {
    const emitAwaitUser = vi.fn()
    const result = await presentPlanChoicesTool.execute(
      { reason: '请选题', choices },
      queryMockCtx(true, emitAwaitUser)
    )
    const parsed = JSON.parse(result) as {
      ok: boolean
      skipped?: boolean
      choices?: unknown[]
    }

    expect(parsed.ok).toBe(true)
    expect(parsed.skipped).toBe(true)
    expect(parsed.choices).toHaveLength(2)
    expect(emitAwaitUser).not.toHaveBeenCalled()
  })

  it('需确认模式时暂停并等待用户选择', async () => {
    const emitAwaitUser = vi.fn().mockResolvedValue({
      choiceId: 'a',
      choiceLabel: '方案A'
    })
    const result = await presentPlanChoicesTool.execute(
      { reason: '请选题', choices },
      queryMockCtx(false, emitAwaitUser)
    )
    const parsed = JSON.parse(result) as {
      ok: boolean
      selected?: { id: string }
    }

    expect(emitAwaitUser).toHaveBeenCalledOnce()
    expect(parsed.ok).toBe(true)
    expect(parsed.selected?.id).toBe('a')
  })
})
