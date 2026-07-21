import { describe, expect, it } from 'vitest'
import {
  queryDecodeSinaText,
  queryNormalizeAshareSymbol,
  queryNormalizeQuotePrice,
  queryNormalizeYmdInput,
  queryParseAshareSymbols,
  queryParseKlineRow,
  queryParseSinaQuoteText,
  queryResolveRangeParams,
  queryResolveRefreshRangeParams,
  queryShanghaiYmd,
  querySinaListSymbol
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

  it('新浪 list 代码与市场前缀', () => {
    expect(querySinaListSymbol('600519')).toBe('sh600519')
    expect(querySinaListSymbol('000001')).toBe('sz000001')
    expect(querySinaListSymbol('430047')).toBe('bj430047')
  })

  it('解析新浪行情文本', () => {
    const text =
      'var hq_str_sh600519="贵州茅台,1338.980,1327.500,1308.000,1344.700,1296.870";'
    expect(queryParseSinaQuoteText(text)).toMatchObject({
      name: '贵州茅台',
      open: 1338.98,
      prevClose: 1327.5,
      price: 1308,
      high: 1344.7,
      low: 1296.87
    })
  })

  it('按 GB18030 解码新浪行情二进制体（避免股票名乱码）', () => {
    // 「长江电力」的 GB18030 字节（与 hq.sinajs.cn 实际响应一致）
    const nameGbk = Uint8Array.of(0xb3, 0xa4, 0xbd, 0xad, 0xb5, 0xe7, 0xc1, 0xa6)
    const prefix = new TextEncoder().encode('var hq_str_sh600900="')
    const suffix = new TextEncoder().encode(',29.000,28.980,28.730,29.540,28.510";')
    const body = new Uint8Array(prefix.length + nameGbk.length + suffix.length)
    body.set(prefix, 0)
    body.set(nameGbk, prefix.length)
    body.set(suffix, prefix.length + nameGbk.length)

    // 误用 UTF-8 会得到替换字符，正确解码应为「长江电力」
    const asUtf8 = new TextDecoder('utf-8').decode(body)
    expect(asUtf8.includes('长江电力')).toBe(false)

    const text = queryDecodeSinaText(body)
    expect(queryParseSinaQuoteText(text)?.name).toBe('长江电力')
  })
})
