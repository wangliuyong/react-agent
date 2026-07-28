import { ToolNode } from '@langchain/langgraph/prebuilt'
import type { LangGraphRunnableConfig } from '@langchain/langgraph'
import type { StructuredToolInterface } from '@langchain/core/tools'
import type { ToolCall } from '@langchain/core/messages/tool'
import type { ToolMessage } from '@langchain/core/messages'
import type { Command } from '@langchain/langgraph'
import { queryResolveToolName } from './query-resolve-tool-name'

/**
 * 带工具名模糊匹配的 ToolNode。
 * 为什么：createReactAgent 默认按精确名查找，LLM 轻微拼写偏差会报 Tool not found。
 */
export class FuzzyToolNode extends ToolNode {
  constructor(
    tools: StructuredToolInterface[],
    options?: ConstructorParameters<typeof ToolNode>[1]
  ) {
    super(tools, options)
  }

  /**
   * 覆盖查找：先精确，再 ≥90% 相似度映射到规范名后交给父类执行。
   */
  protected override async runTool(
    call: ToolCall,
    config: LangGraphRunnableConfig,
    state: unknown
  ): Promise<ToolMessage | Command> {
    const names = this.tools.map((t) => t.name)
    const resolved = queryResolveToolName(String(call.name ?? ''), names)
    const remapped: ToolCall =
      resolved && resolved.name !== call.name
        ? { ...call, name: resolved.name }
        : call
    return super.runTool(remapped, config, state)
  }
}
