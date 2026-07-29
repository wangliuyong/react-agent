/**
 * 定时任务 / 发布任务「预设用户输入」：启动工作流时写入 run.context，
 * 输入节点有值时直接采用，不再 waitForGraphUserContinue。
 */

/** 写入 WorkflowRun.context 的保留键（不以业务字段污染） */
export const WORKFLOW_PRESET_USER_INPUT_KEY = '__presetUserInput'

/** 去空白；空串视为未配置 */
export function queryNormalizePresetUserInput(raw: unknown): string | undefined {
  if (typeof raw !== 'string') return undefined
  const text = raw.trim()
  return text || undefined
}

/**
 * 组装启动时的 initial context：合并调用方 context，并挂上预设输入保留键。
 */
export function queryBuildWorkflowInitialContext(options?: {
  presetUserInput?: string | null
  initialContext?: Record<string, unknown>
}): Record<string, unknown> {
  const next: Record<string, unknown> = { ...(options?.initialContext ?? {}) }
  const fromOption = queryNormalizePresetUserInput(options?.presetUserInput)
  const fromContext = queryNormalizePresetUserInput(next[WORKFLOW_PRESET_USER_INPUT_KEY])
  const preset = fromOption ?? fromContext
  if (preset) {
    next[WORKFLOW_PRESET_USER_INPUT_KEY] = preset
  } else {
    delete next[WORKFLOW_PRESET_USER_INPUT_KEY]
  }
  return next
}

/** 从运行 context 读取预设用户输入（有值才返回） */
export function queryPresetUserInputFromContext(
  context: Record<string, unknown> | undefined | null
): string | undefined {
  if (!context) return undefined
  return queryNormalizePresetUserInput(context[WORKFLOW_PRESET_USER_INPUT_KEY])
}

/**
 * 输入节点是否可用预设文字跳过等待。
 * 仅当 kinds 含 text 且预设非空；纯附件类节点仍等人上传。
 */
export function queryCanSkipInputWaitWithPreset(
  inputKinds: readonly string[] | undefined,
  preset: string | undefined
): boolean {
  if (!preset?.trim()) return false
  const kinds = inputKinds?.length ? inputKinds : (['text'] as const)
  return kinds.includes('text')
}
