import { describe, expect, it } from 'vitest'
import { queryAgentStatusLabel } from '../src/features/chat/utils/agent-status'

describe('queryAgentStatusLabel', () => {
  it('思考阶段附带当前模型连接名', () => {
    expect(
      queryAgentStatusLabel({
        running: true,
        streamingText: '',
        activeToolName: null,
        awaitUserReason: null,
        activeModelLabel: '调研推理（Qwen Max）'
      })
    ).toBe('正在思考 · 调研推理（Qwen Max）…')
  })

  it('工具阶段附带模型名', () => {
    expect(
      queryAgentStatusLabel({
        running: true,
        streamingText: '',
        activeToolName: 'switch_model',
        awaitUserReason: null,
        activeModelLabel: '创作编剧'
      })
    ).toBe('正在切换模型 · 创作编剧…')
  })
})
