/**
 * 用户确认与多方案选择工具：暂停执行，等待用户从聊天框选择或输入后继续。
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
    '当存在 2 个及以上可行路径时，必须先调用本工具列出方案并暂停，等待用户从聊天框选择或输入说明后再继续。' +
    '禁止在未经用户确认的情况下擅自替用户决定方案。' +
    '返回 JSON：selected（用户选中的方案 id/label）与 userInput（补充说明）。',
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
    const choices: PlanChoiceArg[] = rawChoices
      .map((item) => {
        if (!item || typeof item !== 'object') return null
        const row = item as Record<string, unknown>
        const id = String(row.id ?? '').trim()
        const label = String(row.label ?? '').trim()
        if (!id || !label) return null
        const description = row.description != null ? String(row.description).trim() : undefined
        return { id, label, description: description || undefined }
      })
      .filter((c): c is PlanChoiceArg => c != null)

    if (!reason) {
      return JSON.stringify({ ok: false, message: 'reason 不能为空' })
    }
    if (choices.length < 2) {
      return JSON.stringify({ ok: false, message: '至少需要 2 个方案（choices）' })
    }
    if (choices.length > 5) {
      return JSON.stringify({ ok: false, message: '方案最多 5 个' })
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
