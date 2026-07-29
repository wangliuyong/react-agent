import { describe, expect, it } from 'vitest'
import {
  queryConditionCaseKey,
  queryConditionCaseKeys
} from '../shared/evaluate-workflow-condition'
import type { WorkflowConditionNode } from '../shared/types'

function queryBaseNode(
  partial: Partial<WorkflowConditionNode> & Pick<WorkflowConditionNode, 'cases'>
): WorkflowConditionNode {
  return {
    id: 'cond1',
    type: 'condition',
    title: '信号分流',
    mode: 'expression',
    ...partial
  }
}

describe('queryConditionCaseKeys', () => {
  const cases = [
    {
      key: 'buy',
      label: '买入',
      when: { contextKey: 'stockHasBuy', op: 'eq' as const, value: '1' },
      nodes: []
    },
    {
      key: 'sell',
      label: '卖出',
      when: { contextKey: 'stockHasSell', op: 'eq' as const, value: '1' },
      nodes: []
    },
    {
      key: 'hold',
      label: '观望',
      when: { contextKey: 'stockHasHold', op: 'eq' as const, value: '1' },
      nodes: []
    }
  ]

  it('first（默认）只取第一个命中支路', () => {
    const node = queryBaseNode({ cases, defaultKey: 'hold' })
    const picked = queryConditionCaseKeys(node, {
      stockHasBuy: '1',
      stockHasSell: '1',
      stockHasHold: '0'
    })
    expect(picked).toEqual({ keys: ['buy'] })
    expect(queryConditionCaseKey(node, { stockHasBuy: '1', stockHasSell: '1' })).toEqual({
      key: 'buy'
    })
  })

  it('all 返回所有 when 为真的支路', () => {
    const node = queryBaseNode({ cases, matchMode: 'all' })
    const picked = queryConditionCaseKeys(node, {
      stockHasBuy: '1',
      stockHasSell: '1',
      stockHasHold: '0'
    })
    expect(picked).toEqual({ keys: ['buy', 'sell'] })
  })

  it('all 三路均可同时命中', () => {
    const node = queryBaseNode({ cases, matchMode: 'all' })
    const picked = queryConditionCaseKeys(node, {
      stockHasBuy: '1',
      stockHasSell: '1',
      stockHasHold: '1'
    })
    expect(picked).toEqual({ keys: ['buy', 'sell', 'hold'] })
  })

  it('全未命中时走 defaultKey', () => {
    const node = queryBaseNode({ cases, matchMode: 'all', defaultKey: 'hold' })
    const picked = queryConditionCaseKeys(node, {
      stockHasBuy: '0',
      stockHasSell: '0',
      stockHasHold: '0'
    })
    expect(picked).toEqual({ keys: ['hold'] })
  })

  it('全未命中且无 default 时报错', () => {
    const node = queryBaseNode({ cases, matchMode: 'all' })
    // first 语义仍会报错；all 无 default 允许零命中
    const pickedAll = queryConditionCaseKeys(node, {
      stockHasBuy: '0',
      stockHasSell: '0',
      stockHasHold: '0'
    })
    expect(pickedAll).toEqual({ keys: [] })

    const nodeFirst = queryBaseNode({ cases })
    const pickedFirst = queryConditionCaseKeys(nodeFirst, {
      stockHasBuy: '0',
      stockHasSell: '0',
      stockHasHold: '0'
    })
    expect(pickedFirst).toMatchObject({ error: expect.stringContaining('默认') })
  })
})
