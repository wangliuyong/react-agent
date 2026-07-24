import { describe, expect, it } from 'vitest'
import {
  queryAgentBusyLabel,
  queryAgentStatusLabel,
  querySkillNameFromToolContent,
  queryToolCallLabel
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

  it('加载技能时展示技能名', () => {
    expect(
      queryAgentStatusLabel({
        running: true,
        streamingText: '',
        activeToolName: 'use_skill',
        activeToolArgs: { skillId: 'writing-guide' },
        skillNameById: new Map([['writing-guide', '写作指南']]),
        awaitUserReason: null
      })
    ).toBe('正在加载技能：写作指南…')
  })

  it('无技能目录时回退为 skillId', () => {
    expect(
      queryAgentStatusLabel({
        running: true,
        streamingText: '',
        activeToolName: 'use_skill',
        activeToolArgs: { skillId: 'writing-guide' },
        awaitUserReason: null
      })
    ).toBe('正在加载技能：writing-guide…')
  })

  it('Remotion 渲染附带进度说明', () => {
    expect(
      queryAgentStatusLabel({
        running: true,
        streamingText: '',
        activeToolName: 'remotion_render',
        awaitUserReason: null,
        activeToolProgress: { percent: 45, phase: 'render', message: '渲染视频 45%' }
      })
    ).toBe('正在渲染 Remotion 视频（渲染视频 45%）')
  })
})

describe('queryToolCallLabel', () => {
  it('use_skill 优先用目录名，其次从工具正文解析', () => {
    expect(
      queryToolCallLabel('use_skill', { skillId: 'writing-guide' }, {
        skillNameById: new Map([['writing-guide', '写作指南']])
      })
    ).toBe('加载技能：写作指南')

    expect(
      queryToolCallLabel('use_skill', { skillId: 'writing-guide' }, {
        toolContent: '# 技能：写作指南\n\n正文'
      })
    ).toBe('加载技能：写作指南')
  })

  it('其它工具保持原标签', () => {
    expect(queryToolCallLabel('browser_navigate')).toBe('打开网页')
  })
})

describe('querySkillNameFromToolContent', () => {
  it('解析技能标题行', () => {
    expect(querySkillNameFromToolContent('# 技能：写作指南\n\nx')).toBe('写作指南')
    expect(querySkillNameFromToolContent('无标题')).toBeNull()
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
