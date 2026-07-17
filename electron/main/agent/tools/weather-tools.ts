/**
 * 天气工具：优先公共天气 API，失败再无头浏览器兜底。
 */
import { queryHttpJson } from '../../net/http-client'
import { queryWithFallback } from '../../net/data-source'
import { getBrowserService } from '../../browser/service'
import { queryEncodeWorkflowCtxResult } from './hot-topics'
import type { AgentTool } from './types'

export interface WeatherSnapshot {
  city: string
  summary: string
  temperature?: string
  humidity?: string
  wind?: string
  rawText: string
}

/** wttr.in JSON：免 Key，适合本地助手默认天气源 */
async function queryWeatherViaWttr(city?: string): Promise<WeatherSnapshot> {
  const loc = city?.trim() ? encodeURIComponent(city.trim()) : ''
  const url = `https://wttr.in/${loc}?format=j1&lang=zh`
  const data = await queryHttpJson<{
    nearest_area?: Array<{ areaName?: Array<{ value?: string }> }>
    current_condition?: Array<{
      temp_C?: string
      humidity?: string
      windspeedKmph?: string
      weatherDesc?: Array<{ value?: string }>
      lang_zh?: Array<{ value?: string }>
    }>
  }>(url, { timeoutMs: 15_000 })

  const area =
    data.nearest_area?.[0]?.areaName?.[0]?.value?.trim() || city?.trim() || '本地'
  const cur = data.current_condition?.[0]
  if (!cur) throw new Error('wttr.in 无 current_condition')

  const desc =
    cur.lang_zh?.[0]?.value?.trim() ||
    cur.weatherDesc?.[0]?.value?.trim() ||
    '未知'
  const temperature = cur.temp_C ? `${cur.temp_C}°C` : undefined
  const humidity = cur.humidity ? `${cur.humidity}%` : undefined
  const wind = cur.windspeedKmph ? `${cur.windspeedKmph} km/h` : undefined
  const summary = `${area}：${desc}${temperature ? `，气温 ${temperature}` : ''}`
  const rawText = [
    `城市：${area}`,
    `天气：${desc}`,
    temperature ? `气温：${temperature}` : null,
    humidity ? `湿度：${humidity}` : null,
    wind ? `风速：${wind}` : null
  ]
    .filter(Boolean)
    .join('\n')

  return { city: area, summary, temperature, humidity, wind, rawText }
}

async function queryWeatherViaBrowser(city?: string): Promise<WeatherSnapshot> {
  const browser = getBrowserService()
  const q = city?.trim() ? encodeURIComponent(city.trim()) : ''
  const url = q
    ? `https://wttr.in/${q}?lang=zh`
    : 'https://wttr.in/?lang=zh'
  await browser.navigate(url, 'headless')
  await browser.wait({ ms: 1500 }, 'headless')
  const text = await browser.extractText({ maxLength: 8_000 }, 'headless')
  if (!text.trim()) throw new Error('无头浏览器未提取到天气文本')
  const cityLabel = city?.trim() || '本地'
  const summary = text.split('\n').map((l) => l.trim()).find(Boolean) ?? text.slice(0, 80)
  return {
    city: cityLabel,
    summary: `${cityLabel}：${summary}`,
    rawText: text.trim().slice(0, 2000)
  }
}

export const queryWeatherTool: AgentTool = {
  name: 'query_weather',
  description:
    '获取今日天气（默认按本机 IP 定位；可传 city 指定城市）。' +
    '优先调用天气 API；失败时用无头浏览器后台抓取（不弹窗）。' +
    '写入 context.weatherOk / weatherText，便于通知与定时任务使用。',
  permission: 'safe',
  parameters: {
    type: 'object',
    properties: {
      city: {
        type: 'string',
        description: '城市名，如「北京」「上海」；缺省则按 IP 定位'
      }
    },
    required: []
  },
  async execute(args) {
    const city = args.city != null ? String(args.city) : undefined
    const result = await queryWithFallback({
      apiFetchers: [() => queryWeatherViaWttr(city)],
      browserScraper: () => queryWeatherViaBrowser(city),
      failLabel: '获取天气失败',
      formatSuccess: (data, source) =>
        source === 'browser'
          ? `${data.rawText}\n（来源：无头浏览器兜底）`
          : data.rawText
    })

    if (!result.ok || !result.data) {
      return queryEncodeWorkflowCtxResult(result.message, {
        weatherOk: '0',
        weatherText: '',
        weatherSummary: '',
        weatherFetchSource: result.source
      })
    }

    return queryEncodeWorkflowCtxResult(result.message, {
      weatherOk: '1',
      weatherText: result.message,
      weatherSummary: result.data.summary,
      weatherCity: result.data.city,
      weatherFetchSource: result.source
    })
  }
}
