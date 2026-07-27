import { describe, expect, it } from 'vitest'
import { queryParseAgentErrorNotice } from '../src/components/AppErrorNotice/query-parse-agent-error-notice'

describe('queryParseAgentErrorNotice', () => {
  it('拆分主文案与上下文 chip 字段', () => {
    expect(
      queryParseAgentErrorNotice(
        'Access denied（工具：fetch_hot_topics，角色：调研员，Agent：role_researcher，连接：文生图 · dashscope · qwen-plus）'
      )
    ).toEqual({
      summary: 'Access denied',
      toolName: 'fetch_hot_topics',
      roleName: '调研员',
      agentName: 'role_researcher',
      connection: '文生图 · dashscope · qwen-plus'
    })
  })

  it('无上下文时整段作为 summary', () => {
    expect(queryParseAgentErrorNotice('简单失败')).toEqual({ summary: '简单失败' })
  })
})
