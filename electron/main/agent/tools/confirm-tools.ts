/**
 * 用户确认与多方案选择工具：暂停执行，等待用户从聊天框选择或输入后继续。
 * 完全访问模式下不暂停：返回方案列表，由模型自行择优连续执行。
 */
import type { AgentTool } from './types'

interface PlanChoiceArg {
  id: string
  label: string
  description?: string
}

/** 向用户呈现多个可行方案，暂停直到用户选择或补充说明 */
export const presentPlanChoicesTool: AgentTool = {
  name: 'present_plan_choices',
  description:
    '当存在 2 个及以上可行路径、且当前非完全访问时，调用本工具列出方案并暂停，等待用户从聊天框选择或输入说明后再继续。' +
    '完全访问、自动发布任务、自动流程执行时禁止调用本工具暂停；应自行择优并连续执行。' +
    '返回 JSON：selected（用户选中的方案 id/label）与 userInput（补充说明）；完全访问时返回 skipped=true 与 choices。',
  permission: 'safe',
  parameters: {
    type: 'object',
    properties: {
      reason: {
        type: 'string',
        description: '为何需要用户选择（简要说明背景与差异）'
      },
      choices: {
        type: 'array',
        description: '2~5 个互斥方案',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string', description: '方案唯一 id，如 plan_a' },
            label: { type: 'string', description: '方案标题，如「方案 A：竖版动效」' },
            description: { type: 'string', description: '方案说明（可选）' }
          },
          required: ['id', 'label']
        }
      },
      allowCustomInput: {
        type: 'boolean',
        description: '是否允许用户自由输入而非点选，默认 true'
      }
    },
    required: ['reason', 'choices']
  },
  async execute(args, ctx) {
    const reason = String(args.reason ?? '').trim()
    const rawChoices = Array.isArray(args.choices) ? args.choices : []
    const choices: PlanChoiceArg[] = []
    for (const item of rawChoices) {
      if (!item || typeof item !== 'object') continue
      const row = item as Record<string, unknown>
      const id = String(row.id ?? '').trim()
      const label = String(row.label ?? '').trim()
      if (!id || !label) continue
      const description = row.description != null ? String(row.description).trim() : undefined
      choices.push({ id, label, description: description || undefined })
    }

    if (!reason) {
      return JSON.stringify({ ok: false, message: 'reason 不能为空' })
    }
    if (choices.length < 2) {
      return JSON.stringify({ ok: false, message: '至少需要 2 个方案（choices）' })
    }
    if (choices.length > 5) {
      return JSON.stringify({ ok: false, message: '方案最多 5 个' })
    }

    // 完全访问 / 自动任务与流程：不暂停，交由模型自行择优连续执行
    if (ctx.fullAccess) {
      return JSON.stringify({
        ok: true,
        skipped: true,
        reason,
        choices,
        selected: null,
        userInput: null,
        hint:
          '当前为完全访问模式（或自动发布/流程执行）。请自行选择最合适方案并继续执行，' +
          '不要再次调用 present_plan_choices，也不要等待用户确认。'
      })
    }

    const result = await ctx.emitAwaitUser(reason, choices)

    if (result.choiceId) {
      const selected = choices.find((c) => c.id === result.choiceId)
      return JSON.stringify({
        ok: true,
        selected: selected
          ? { id: selected.id, label: selected.label, description: selected.description }
          : { id: result.choiceId, label: result.choiceLabel ?? result.choiceId },
        userInput: result.userInput ?? null
      })
    }

    if (result.userInput) {
      return JSON.stringify({
        ok: true,
        selected: null,
        userInput: result.userInput,
        hint: '请根据用户说明判断所选方案，并只执行对应路径'
      })
    }

    return JSON.stringify({ ok: false, message: '用户未选择方案也未提供说明' })
  }
}
