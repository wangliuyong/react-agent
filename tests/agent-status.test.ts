import { describe, expect, it } from 'vitest'
import {
  queryAgentBusyLabel,
  queryAgentStatusLabel
} from '../src/features/chat/utils/agent-status'

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

describe('queryAgentBusyLabel', () => {
  it('工具结果之后的思考阶段显示整理工具结果', () => {
    expect(
      queryAgentBusyLabel({
        running: true,
        streamingText: '',
        activeToolName: null,
        awaitUserReason: null,
        afterToolGroup: true
      })
    ).toBe('正在整理工具结果')
  })

  it('无工具组时仍为正在思考', () => {
    expect(
      queryAgentBusyLabel({
        running: true,
        streamingText: '',
        activeToolName: null,
        awaitUserReason: null,
        afterToolGroup: false
      })
    ).toBe('正在思考…')
  })

  it('工具执行中优先工具文案', () => {
    expect(
      queryAgentBusyLabel({
        running: true,
        streamingText: '',
        activeToolName: 'browser_navigate',
        awaitUserReason: null,
        afterToolGroup: true
      })
    ).toBe('正在打开网页…')
  })
})
