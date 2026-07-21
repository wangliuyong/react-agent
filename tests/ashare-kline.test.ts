import { describe, expect, it } from 'vitest'
import {
  queryNormalizeAshareSymbol,
  queryParseAshareSymbols,
  queryParseKlineRow
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
})
