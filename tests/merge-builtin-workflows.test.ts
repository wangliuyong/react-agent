import { describe, expect, it } from 'vitest'
import { mergeBuiltinWorkflowTemplates } from '../electron/main/workflow/templates'
import type { WorkflowDefinition } from '../shared/types'

function queryMinimalAshare(partial: Partial<WorkflowDefinition>): WorkflowDefinition {
  return {
    id: 'tpl_ashare_realtime_analysis',
    title: '自定义标题',
    description: '用户改过的描述',
    templateKind: 'generic',
    nodes: [
      { id: 'tpl_ra_start', type: 'start', title: '开始' },
      {
        id: 'tpl_ra_fetch',
        type: 'tool',
        title: '实时 K 线 + 综合分析',
        toolName: 'query_ashare_realtime_analysis',
        // 已用插值：不属于「硬编码旧模板」，保存后不应被覆盖
        argsTemplate: { symbols: '{{symbols}}', range: 'today' },
        outputKeys: ['stockHasBuy', 'stockHasSell', 'stockHasHold']
      },
      { id: 'tpl_ra_end', type: 'end', title: '结束' }
    ],
    canvas: {
      positions: {},
      edges: [
        {
          id: 'e1',
          source: 'tpl_ra_fetch',
          target: 'tpl_ra_buy',
          when: { contextKey: 'stockHasBuy', op: 'eq', value: '1' },
          matchMode: 'all'
        }
      ]
    },
    createdAt: 1,
    updatedAt: 2,
    ...partial
  }
}

describe('mergeBuiltinWorkflowTemplates', () => {
  it('不覆盖用户已保存的多分支 A 股模板', () => {
    const user = queryMinimalAshare({})
    const { list, refreshed } = mergeBuiltinWorkflowTemplates([user])
    expect(refreshed).toBe(0)
    expect(list.find((w) => w.id === user.id)?.title).toBe('自定义标题')
    expect(list.find((w) => w.id === user.id)?.description).toBe('用户改过的描述')
  })

  it('仍将旧 stockSignal XOR 模板一次性升级', () => {
    const legacy = queryMinimalAshare({
      title: '旧版',
      description: '旧',
      canvas: {
        positions: {},
        edges: [
          {
            id: 'e1',
            source: 'a',
            target: 'b',
            when: { contextKey: 'stockSignal', op: 'eq', value: 'buy' }
          }
        ]
      }
    })
    const { refreshed, list } = mergeBuiltinWorkflowTemplates([legacy])
    expect(refreshed).toBe(1)
    const next = list.find((w) => w.id === legacy.id)!
    expect(next.description).toContain('stockHasBuy')
    expect(next.canvas?.edges?.some((e) => e.matchMode === 'all')).toBe(true)
  })

  it('硬编码茅台/平安 symbols 的内置模板会升级为 {{symbols}}', () => {
    const hardcoded = queryMinimalAshare({
      nodes: [
        { id: 'tpl_ra_start', type: 'start', title: '开始' },
        {
          id: 'tpl_ra_fetch',
          type: 'tool',
          title: '实时 K 线 + 综合分析',
          toolName: 'query_ashare_realtime_analysis',
          argsTemplate: { symbols: '600519,000001' },
          outputKeys: []
        },
        { id: 'tpl_ra_end', type: 'end', title: '结束' }
      ]
    })
    const { refreshed, list } = mergeBuiltinWorkflowTemplates([hardcoded])
    expect(refreshed).toBe(1)
    const tool = list
      .find((w) => w.id === hardcoded.id)
      ?.nodes.find((n) => n.type === 'tool')
    expect(tool && tool.type === 'tool' && tool.argsTemplate.symbols).toBe('{{symbols}}')
  })
})
