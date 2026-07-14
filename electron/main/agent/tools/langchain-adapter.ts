import { tool } from '@langchain/core/tools'
import { interrupt } from '@langchain/langgraph'
import type { StructuredToolInterface } from '@langchain/core/tools'
import type { JsonSchema7Type } from '@langchain/core/utils/json_schema'
import type { AgentTool, ToolContext, ToolPermission } from './types'

/** 发布类工具自带确认 UI，避免 Graph interrupt 与工具内 await 双重暂停 */
const PUBLISH_TOOLS_INLINE_CONFIRM = new Set(['xhs_publish_note', 'douyin_publish_note'])

export interface AdaptToolsOptions {
  ctx: ToolContext
  /** 是否在适配层对危险工具做 interrupt 确认（默认 true） */
  gateDangerous?: boolean
}

/**
 * 将业务 AgentTool 转为 LangChain StructuredTool。
 * 权限门与 emitAwaitUser 统一走 LangGraph interrupt，由 Bridge 映射为 await_user 事件。
 */
export function adaptAgentTools(
  agentTools: AgentTool[],
  options: AdaptToolsOptions
): StructuredToolInterface[] {
  const { ctx, gateDangerous = true } = options

  return agentTools.map((agentTool) => {
    const schema = (agentTool.parameters ?? {
      type: 'object',
      properties: {}
    }) as JsonSchema7Type

    return tool(
      async (rawArgs: Record<string, unknown>) => {
        const args = (rawArgs && typeof rawArgs === 'object' ? rawArgs : {}) as Record<
          string,
          unknown
        >

        // 危险工具：非 fullAccess 时先 interrupt，用户点「继续」后 resume
        if (
          gateDangerous &&
          shouldGatePermission(agentTool.permission, ctx.fullAccess, agentTool.name)
        ) {
          interrupt({
            type: 'await_user',
            sessionId: ctx.sessionId,
            reason: `即将执行敏感工具「${agentTool.name}」，确认后继续`
          })
        }

        // 工具内 emitAwaitUser（如登录扫码）同样转 interrupt
        const bridgedCtx: ToolContext = {
          ...ctx,
          emitAwaitUser: async (reason: string) => {
            interrupt({
              type: 'await_user',
              sessionId: ctx.sessionId,
              reason
            })
          }
        }

        try {
          return await agentTool.execute(args, bridgedCtx)
        } catch (err) {
          // GraphInterrupt 必须向上抛，供检查点暂停；勿吞掉
          if (isGraphInterrupt(err)) throw err
          return `工具执行失败: ${err instanceof Error ? err.message : String(err)}`
        }
      },
      {
        name: agentTool.name,
        description: agentTool.description,
        schema
      }
    )
  })
}

function shouldGatePermission(
  permission: ToolPermission,
  fullAccess: boolean,
  toolName: string
): boolean {
  if (fullAccess) return false
  if (PUBLISH_TOOLS_INLINE_CONFIRM.has(toolName)) return false
  return permission === 'dangerous'
}

/** 识别 LangGraph 中断错误（包版本差异时用 name/message 兜底） */
export function isGraphInterrupt(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false
  const e = err as { name?: string; constructor?: { name?: string } }
  return e.name === 'GraphInterrupt' || e.constructor?.name === 'GraphInterrupt'
}
