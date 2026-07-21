import { describe, expect, it } from 'vitest'
import {
  queryNormalizeAshareSymbol,
  queryNormalizeQuotePrice,
  queryNormalizeYmdInput,
  queryParseAshareSymbols,
  queryParseKlineRow,
  queryResolveRangeParams,
  queryResolveRefreshRangeParams,
  queryShanghaiYmd
} from '../electron/main/net/ashare-kline'

describe('ashare-kline', () => {
  it('解析逗号分隔股票代码', () => {
    expect(queryParseAshareSymbols('600519,000001')).toEqual(['600519', '000001'])
    expect(queryParseAshareSymbols(['SH600519', 'sz000001'])).toEqual(['SH600519', 'sz000001'])
  })

  it('规范化为东方财富 secid', () => {
    expect(queryNormalizeAshareSymbol('600519').secid).toBe('1.600519')
    expect(queryNormalizeAshareSymbol('sz000001').secid).toBe('0.000001')
  })

  it('解析 K 线行', () => {
    const bar = queryParseKlineRow('2026-07-18,1680,1698,1702,1675,123456,987654321,1.2')
    expect(bar).toMatchObject({
      date: '2026-07-18',
      open: 1680,
      close: 1698,
      high: 1702,
      low: 1675,
      volume: 123456
    })
  })

  it('解析时间范围参数', () => {
    const today = queryResolveRangeParams({ range: 'today' })
    expect(today.klt).toBe(5)
    expect(today.period).toBe('intraday')
    expect(today.beg).toBe(queryShanghaiYmd())

    const custom = queryResolveRangeParams({
      range: 'custom',
      startDate: '2026-01-01',
      endDate: '2026-06-30'
    })
    expect(custom.beg).toBe('20260101')
    expect(custom.end).toBe('20260630')
  })

  it('行情价格统一 /100', () => {
    expect(queryNormalizeQuotePrice(1087)).toBe(10.87)
    expect(queryNormalizeQuotePrice(130169)).toBe(1301.69)
  })

  it('日期入参兼容数字 YYYYMMDD', () => {
    expect(queryNormalizeYmdInput(20260721)).toBe('20260721')
    expect(queryNormalizeYmdInput('2026-07-21')).toBe('20260721')
  })

  it('刷新请求仅 custom 携带日期', () => {
    expect(
      queryResolveRefreshRangeParams({
        symbol: '600900',
        range: 'today',
        startDate: '20260701',
        endDate: '20260721'
      })
    ).toEqual({ range: 'today' })

    expect(
      queryResolveRefreshRangeParams({
        symbol: '600900',
        range: 'custom',
        startDate: 20260701,
        endDate: 20260721
      })
    ).toEqual({
      range: 'custom',
      startDate: '20260701',
      endDate: '20260721'
    })
  })
})
