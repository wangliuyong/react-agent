/**
 * 流程节点「数据采集」默认说明。
 * 描述 Agent 如何从用户输入 / 上游 context 取值并写入键，供后续 {{key}} 插值。
 */
import type { WorkflowLeafNode, WorkflowNode } from './types'

export type WorkflowCollectNodeType = WorkflowLeafNode['type']

const DEFAULT_GENERIC =
  '根据上游 context 与用户输入（如 userInput），解析本步骤所需字段并写入 context。' +
  '最终只输出一行 JSON 对象（键值对），不要 Markdown 围栏，不要调用 present_plan_choices。'

const DEFAULT_BY_TYPE: Record<WorkflowCollectNodeType, string> = {
  agent:
    '根据上游 context 与用户输入，提炼本 Agent 步骤所需信息并写入 context（如摘要键）。' +
    '最终只输出一行 JSON 对象，不要 Markdown 围栏，禁止 present_plan_choices。',
  tool:
    '根据上游 context 与用户输入（如 userInput），解析本工具所需参数并写入对应 context 键。' +
    '若涉及股票：名称请转为 6 位 A 股代码，多个用英文逗号拼接写入 symbols。' +
    '最终只输出一行 JSON 对象，不要 Markdown 围栏，禁止 present_plan_choices。',
  await_user:
    '根据上游 context 整理确认说明所需字段并写入 context。' +
    '最终只输出一行 JSON 对象，不要 Markdown 围栏，禁止 present_plan_choices。',
  notify:
    '根据上游 context 整理通知正文所需字段（如 summary）并写入 context。' +
    '最终只输出一行 JSON 对象，不要 Markdown 围栏，禁止 present_plan_choices。',
  toast:
    '根据上游 context 整理 Toast 展示所需字段并写入 context。' +
    '最终只输出一行 JSON 对象，不要 Markdown 围栏，禁止 present_plan_choices。',
  input:
    '用户已提交内容后：根据 userInput（及附件路径）解析业务字段并写入 context。' +
    '若为股票名称请转为 6 位代码，多个用英文逗号拼接写入 symbols。' +
    '最终只输出一行 JSON 对象，不要 Markdown 围栏，禁止 present_plan_choices。',
  output:
    '根据上游 context 确认文件输出所需字段并写入 context。' +
    '最终只输出一行 JSON 对象，不要 Markdown 围栏，禁止 present_plan_choices。'
}

/** A 股相关工具的更具体默认说明 */
const ASHRE_TOOL_DEFAULT =
  '根据上游 context 与用户输入（如 userInput），解析股票代码并写入 symbols（6 位 A 股代码，多个英文逗号分隔）。' +
  '输入若是股票名称请先转换为代码。可同时写入 range（today/week/month）。' +
  '最终只输出一行 JSON 对象，例如 {"symbols":"600519,000001","range":"today"}，不要 Markdown 围栏，禁止 present_plan_choices。'

/**
 * 按节点类型（及可选工具名）返回数据采集默认文案。
 */
export function queryDefaultCollectPrompt(
  type: WorkflowNode['type'] | string,
  toolName?: string
): string {
  if (type === 'tool') {
    const name = (toolName ?? '').trim()
    if (name.startsWith('query_ashare') || name.includes('ashare')) {
      return ASHRE_TOOL_DEFAULT
    }
    return DEFAULT_BY_TYPE.tool
  }
  if (type in DEFAULT_BY_TYPE) {
    return DEFAULT_BY_TYPE[type as WorkflowCollectNodeType]
  }
  return DEFAULT_GENERIC
}

/**
 * 当前文案是否仍为「空或某次默认值」，切换类型/工具时可安全替换。
 */
export function queryIsReplaceableCollectPrompt(
  current: string | undefined,
  prevType: string | undefined,
  prevToolName?: string
): boolean {
  const trimmed = (current ?? '').trim()
  if (!trimmed) return true
  if (!prevType) return false
  const prevDefault = queryDefaultCollectPrompt(prevType, prevToolName)
  return trimmed === prevDefault.trim()
}

/**
 * 从 Agent 回复中解析 JSON 对象 patch（允许围栏或前后杂文）。
 */
export function queryParseCollectJsonPatch(text: string):
  | { patch: Record<string, unknown> }
  | { error: string } {
  const trimmed = (text ?? '').trim()
  if (!trimmed) return { error: '数据采集 Agent 未返回内容' }

  const tryParse = (raw: string): Record<string, unknown> | null => {
    try {
      const parsed = JSON.parse(raw) as unknown
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>
      }
      return null
    } catch {
      return null
    }
  }

  const direct = tryParse(trimmed)
  if (direct) return { patch: direct }

  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fence?.[1]) {
    const fromFence = tryParse(fence[1].trim())
    if (fromFence) return { patch: fromFence }
  }

  const brace = trimmed.match(/\{[\s\S]*\}/)
  if (brace?.[0]) {
    const fromBrace = tryParse(brace[0])
    if (fromBrace) return { patch: fromBrace }
  }

  return {
    error: `数据采集结果不是合法 JSON 对象：${trimmed.slice(0, 200)}`
  }
}

/**
 * 将 collect patch 合并进 context（值统一转字符串，便于条件 eq 与插值）。
 */
export function queryMergeCollectPatchToContext(
  context: Record<string, unknown>,
  patch: Record<string, unknown>
): Record<string, unknown> {
  const next = { ...context }
  for (const [key, value] of Object.entries(patch)) {
    const k = key.trim()
    if (!k) continue
    if (value == null) {
      next[k] = ''
      continue
    }
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      next[k] = String(value)
      continue
    }
    next[k] = JSON.stringify(value)
  }
  return next
}
