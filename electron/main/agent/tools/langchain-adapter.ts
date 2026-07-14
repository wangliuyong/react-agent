import { tool } from '@langchain/core/tools'
import type { StructuredToolInterface } from '@langchain/core/tools'
import type { JsonSchema7Type } from '@langchain/core/utils/json_schema'
import type { AgentTool, ToolContext, ToolPermission } from './types'

/**
 * 发布类工具自带登录/发布确认（工具内 emitAwaitUser），
 * 不再在适配层额外做危险工具门禁，避免双重暂停。
 */
const PUBLISH_TOOLS_INLINE_CONFIRM = new Set(['xhs_publish_note', 'douyin_publish_note'])

export interface AdaptToolsOptions {
  ctx: ToolContext
  /** 是否在适配层对危险工具做确认（默认 true）；确认走 ctx.emitAwaitUser */
  gateDangerous?: boolean
}

/**
 * 将业务 AgentTool 转为 LangChain StructuredTool。
 *
 * 重要：工具执行在 ToolNode 内可能不支持可靠的 LangGraph interrupt。
 * 登录扫码、危险确认一律复用 Bridge 注入的 ctx.emitAwaitUser（promise 等待），
 * 切勿在工具函数内调用 interrupt()——否则会出现「已调用工具但无结果、步骤却被标完成」的假成功。
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

        // 危险工具：非 fullAccess 时先等人确认（promise，非 interrupt）
        if (
          gateDangerous &&
          shouldGatePermission(agentTool.permission, ctx.fullAccess, agentTool.name)
        ) {
          await ctx.emitAwaitUser(`即将执行敏感工具「${agentTool.name}」，确认后继续`)
        }

        try {
          // 直接使用 Bridge 的 emitAwaitUser，保持登录等待与「继续」按钮一致
          return await agentTool.execute(args, ctx)
        } catch (err) {
          // GraphInterrupt 必须向上抛（若未来节点级 interrupt 传入）；勿吞掉
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
