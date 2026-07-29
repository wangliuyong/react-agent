import { describe, expect, it } from 'vitest'
import {
  queryDecodeWorkflowToolResult,
  queryMergeToolResultToContext,
  WORKFLOW_CTX_PREFIX
} from '../electron/main/workflow/tool-result'

describe('queryMergeToolResultToContext', () => {
  it('保留 patch 中的 stockHas*，不被 outputKeys 用 message 覆盖', () => {
    const raw =
      WORKFLOW_CTX_PREFIX +
      JSON.stringify({
        message: '长文分析报告…',
        patch: {
          stockHasBuy: '0',
          stockHasSell: '0',
          stockHasHold: '1',
          stockHoldReport: '观望摘要'
        }
      })
    const decoded = queryDecodeWorkflowToolResult(raw)
    const ctx = queryMergeToolResultToContext({}, decoded, {
      outputKeys: [
        'stockAnalysisReport',
        'stockHasBuy',
        'stockHasSell',
        'stockHasHold',
        'stockHoldReport'
      ]
    })
    expect(ctx.stockHasHold).toBe('1')
    expect(ctx.stockHasBuy).toBe('0')
    expect(ctx.stockHoldReport).toBe('观望摘要')
    // patch 未提供的 outputKey 才写入整段 message
    expect(ctx.stockAnalysisReport).toBe('长文分析报告…')
  })
})
