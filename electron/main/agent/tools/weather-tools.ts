/**
 * 天气工具：优先 Open-Meteo（地理编码 + 全量实况/预报 + 空气质量），
 * 失败再走 wttr.in API / 无头浏览器兜底。
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
  /** 体感温度 */
  feelsLike?: string
  humidity?: string
  wind?: string
  /** 今日气温区间 */
  tempMin?: string
  tempMax?: string
  /** 紫外线指数（今日最大或当前） */
  uvIndex?: string
  /** 空气质量摘要（若拉取成功） */
  airQuality?: string
  rawText: string
}

/** IP 定位失败或未传 city 时的默认城市（与工具参数说明一致） */
const DEFAULT_CITY_WHEN_NO_LOC = '合肥'

/** 逐小时预报条数（自当前时刻起） */
const HOURLY_FORECAST_COUNT = 24

/** 多日预报天数 */
const DAILY_FORECAST_DAYS = 3

/** Open-Meteo WMO 天气代码 → 中文简述 */
const WMO_WEATHER_ZH: Record<number, string> = {
  0: '晴',
  1: '大部晴朗',
  2: '局部多云',
  3: '阴',
  45: '雾',
  48: '雾凇',
  51: '小毛毛雨',
  53: '毛毛雨',
  55: '大毛毛雨',
  56: '冻毛毛雨',
  57: '冻毛毛雨',
  61: '小雨',
  63: '中雨',
  65: '大雨',
  66: '冻雨',
  67: '冻雨',
  71: '小雪',
  73: '中雪',
  75: '大雪',
  77: '雪粒',
  80: '小阵雨',
  81: '阵雨',
  82: '大阵雨',
  85: '小阵雪',
  86: '大阵雪',
  95: '雷暴',
  96: '雷暴伴小冰雹',
  99: '雷暴伴大冰雹'
}

function queryWmoWeatherZh(code: number): string {
  return WMO_WEATHER_ZH[code] ?? `天气代码 ${code}`
}

/** 将 Open-Meteo 风向角度转为中文 */
function queryWindDirectionZh(deg: number): string {
  const dirs = ['北', '东北', '东', '东南', '南', '西南', '西', '西北'] as const
  const idx = Math.round(deg / 45) % 8
  return `${dirs[idx]}风`
}

function queryFormatTempC(value: number | string | undefined): string | undefined {
  if (value == null || value === '') return undefined
  const n = typeof value === 'number' ? value : Number(value)
  if (Number.isNaN(n)) return undefined
  return `${Math.round(n * 10) / 10}°C`
}

function queryFormatNum(
  value: number | string | undefined,
  digits = 1,
  suffix = ''
): string | undefined {
  if (value == null || value === '') return undefined
  const n = typeof value === 'number' ? value : Number(value)
  if (Number.isNaN(n)) return undefined
  const rounded = digits === 0 ? Math.round(n) : Math.round(n * 10 ** digits) / 10 ** digits
  return `${rounded}${suffix}`
}

function queryFormatPct(value: number | string | undefined): string | undefined {
  return queryFormatNum(value, 0, '%')
}

function queryFormatMm(value: number | string | undefined): string | undefined {
  return queryFormatNum(value, 1, ' mm')
}

function queryFormatKmh(value: number | string | undefined): string | undefined {
  return queryFormatNum(value, 1, ' km/h')
}

function queryFormatHpa(value: number | string | undefined): string | undefined {
  return queryFormatNum(value, 1, ' hPa')
}

/** 秒 → 「Xh Ym」可读时长 */
function queryFormatDurationSec(sec: number | undefined): string | undefined {
  if (sec == null || Number.isNaN(sec)) return undefined
  const h = Math.floor(sec / 3600)
  const m = Math.round((sec % 3600) / 60)
  if (h <= 0) return `${m} 分钟`
  return m > 0 ? `${h} 小时 ${m} 分钟` : `${h} 小时`
}

/** 从 ISO 本地时间串取日期 YYYY-MM-DD */
function queryFormatDateLabel(iso: string): string {
  const m = iso.match(/^(\d{4}-\d{2}-\d{2})/)
  return m?.[1] ?? iso
}

/** 从 ISO 本地时间串取 HH:mm */
function queryFormatHourLabel(iso: string): string {
  const m = iso.match(/T(\d{2}:\d{2})/)
  return m?.[1] ?? iso
}

/** 选取从参考时刻起的未来若干小时索引 */
function queryUpcomingHourlyIndices(
  times: string[],
  fromIso: string,
  count: number
): number[] {
  const fromMs = new Date(fromIso).getTime()
  const out: number[] = []
  for (let i = 0; i < times.length && out.length < count; i++) {
    if (new Date(times[i]).getTime() >= fromMs) out.push(i)
  }
  return out
}

/** 拼装多段详细天气正文（工具结果 / 通知模板共用） */
function queryBuildWeatherRawText(sections: Array<{ title: string; lines: string[] }>): string {
  return sections
    .filter((s) => s.lines.some((l) => l.trim()))
    .map((s) => [`【${s.title}】`, ...s.lines.filter((l) => l.trim())].join('\n'))
    .join('\n\n')
}

/**
 * 规范化用户/模型传入的城市名，提升地理编码命中率。
 * Open-Meteo 对「深圳市」常无结果，对「深圳」可命中。
 */
function queryNormalizeCityName(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return trimmed
  const stripped = trimmed.replace(/(特别行政区|自治州|地区|盟|市|省|区|县)$/u, '').trim()
  return stripped || trimmed
}

interface OpenMeteoGeocodeResult {
  name?: string
  latitude?: number
  longitude?: number
  admin1?: string
  country_code?: string
}

/** Open-Meteo 免费地理编码：优先中国大陆结果 */
async function queryGeocodeViaOpenMeteo(city: string): Promise<{
  label: string
  latitude: number
  longitude: number
}> {
  const queryName = queryNormalizeCityName(city)
  const url =
    'https://geocoding-api.open-meteo.com/v1/search?' +
    `name=${encodeURIComponent(queryName)}&count=10&language=zh&format=json`
  const data = await queryHttpJson<{ results?: OpenMeteoGeocodeResult[] }>(url, {
    timeoutMs: 12_000
  })
  const results = data.results ?? []
  if (results.length === 0) {
    throw new Error(`未找到城市「${city}」（检索词：${queryName}）`)
  }
  const cnHits = results.filter((r) => r.country_code === 'CN')
  const pick = cnHits[0] ?? results[0]
  const lat = pick.latitude
  const lon = pick.longitude
  if (lat == null || lon == null) {
    throw new Error(`城市「${city}」坐标无效`)
  }
  const label = [pick.name, pick.admin1].filter(Boolean).join('·') || queryName
  return { label, latitude: lat, longitude: lon }
}

/** 空气质量：失败不阻断主天气流程 */
async function queryAirQualityViaOpenMeteo(
  latitude: number,
  longitude: number
): Promise<{ summary: string; lines: string[] } | null> {
  try {
    const url =
      'https://air-quality-api.open-meteo.com/v1/air-quality?' +
      `latitude=${latitude}&longitude=${longitude}` +
      '&current=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,us_aqi' +
      '&timezone=Asia%2FShanghai'
    const data = await queryHttpJson<{
      current?: {
        pm10?: number
        pm2_5?: number
        carbon_monoxide?: number
        nitrogen_dioxide?: number
        sulphur_dioxide?: number
        ozone?: number
        us_aqi?: number
      }
    }>(url, { timeoutMs: 10_000 })
    const a = data.current
    if (!a) return null
    const lines = [
      a.us_aqi != null ? `美国 AQI：${Math.round(a.us_aqi)}` : '',
      a.pm2_5 != null ? `PM2.5：${queryFormatNum(a.pm2_5, 1, ' μg/m³')}` : '',
      a.pm10 != null ? `PM10：${queryFormatNum(a.pm10, 1, ' μg/m³')}` : '',
      a.ozone != null ? `臭氧 O₃：${queryFormatNum(a.ozone, 1, ' μg/m³')}` : '',
      a.nitrogen_dioxide != null
        ? `二氧化氮 NO₂：${queryFormatNum(a.nitrogen_dioxide, 1, ' μg/m³')}`
        : '',
      a.sulphur_dioxide != null
        ? `二氧化硫 SO₂：${queryFormatNum(a.sulphur_dioxide, 1, ' μg/m³')}`
        : '',
      a.carbon_monoxide != null
        ? `一氧化碳 CO：${queryFormatNum(a.carbon_monoxide, 1, ' μg/m³')}`
        : ''
    ].filter(Boolean)
    if (lines.length === 0) return null
    const summary =
      a.us_aqi != null
        ? `AQI ${Math.round(a.us_aqi)}`
        : a.pm2_5 != null
          ? `PM2.5 ${queryFormatNum(a.pm2_5, 1)}`
          : '已获取'
    return { summary, lines }
  } catch {
    return null
  }
}

/** Open-Meteo：全量实况 + 多日 + 逐小时 + 空气质量 */
async function queryWeatherViaOpenMeteo(city: string): Promise<WeatherSnapshot> {
  const geo = await queryGeocodeViaOpenMeteo(city)
  const forecastUrl =
    'https://api.open-meteo.com/v1/forecast?' +
    `latitude=${geo.latitude}&longitude=${geo.longitude}` +
    '&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m' +
    '&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,sunrise,sunset,daylight_duration,sunshine_duration,uv_index_max,precipitation_sum,rain_sum,showers_sum,snowfall_sum,precipitation_hours,precipitation_probability_max,wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant' +
    '&hourly=temperature_2m,relative_humidity_2m,dew_point_2m,apparent_temperature,precipitation_probability,precipitation,rain,showers,snowfall,weather_code,cloud_cover,visibility,wind_speed_10m,wind_direction_10m,wind_gusts_10m,uv_index,is_day' +
    `&forecast_days=${DAILY_FORECAST_DAYS}&timezone=Asia%2FShanghai`

  const [forecast, air] = await Promise.all([
    queryHttpJson<{
      elevation?: number
      current?: {
        time?: string
        temperature_2m?: number
        relative_humidity_2m?: number
        apparent_temperature?: number
        is_day?: number
        precipitation?: number
        rain?: number
        showers?: number
        snowfall?: number
        weather_code?: number
        cloud_cover?: number
        pressure_msl?: number
        surface_pressure?: number
        wind_speed_10m?: number
        wind_direction_10m?: number
        wind_gusts_10m?: number
      }
      daily?: {
        time?: string[]
        weather_code?: number[]
        temperature_2m_max?: number[]
        temperature_2m_min?: number[]
        apparent_temperature_max?: number[]
        apparent_temperature_min?: number[]
        sunrise?: string[]
        sunset?: string[]
        daylight_duration?: number[]
        sunshine_duration?: number[]
        uv_index_max?: number[]
        precipitation_sum?: number[]
        rain_sum?: number[]
        showers_sum?: number[]
        snowfall_sum?: number[]
        precipitation_hours?: number[]
        precipitation_probability_max?: number[]
        wind_speed_10m_max?: number[]
        wind_gusts_10m_max?: number[]
        wind_direction_10m_dominant?: number[]
      }
      hourly?: {
        time?: string[]
        temperature_2m?: number[]
        relative_humidity_2m?: number[]
        dew_point_2m?: number[]
        apparent_temperature?: number[]
        precipitation_probability?: number[]
        precipitation?: number[]
        rain?: number[]
        showers?: number[]
        snowfall?: number[]
        weather_code?: number[]
        cloud_cover?: number[]
        visibility?: number[]
        wind_speed_10m?: number[]
        wind_direction_10m?: number[]
        wind_gusts_10m?: number[]
        uv_index?: number[]
        is_day?: number[]
      }
    }>(forecastUrl, { timeoutMs: 15_000 }),
    queryAirQualityViaOpenMeteo(geo.latitude, geo.longitude)
  ])

  const cur = forecast.current
  if (!cur) throw new Error('Open-Meteo 无 current 实况')

  const desc = queryWmoWeatherZh(cur.weather_code ?? -1)
  const temperature = queryFormatTempC(cur.temperature_2m)
  const feelsLike = queryFormatTempC(cur.apparent_temperature)
  const humidity = queryFormatPct(cur.relative_humidity_2m)
  const windSpeed = queryFormatKmh(cur.wind_speed_10m)
  const windDir =
    cur.wind_direction_10m != null ? queryWindDirectionZh(cur.wind_direction_10m) : undefined
  const windGust = queryFormatKmh(cur.wind_gusts_10m)
  const wind = windSpeed && windDir ? `${windDir} ${windSpeed}` : windSpeed
  const dayNight = cur.is_day === 1 ? '白天' : cur.is_day === 0 ? '夜间' : undefined

  const daily = forecast.daily
  const tempMax = queryFormatTempC(daily?.temperature_2m_max?.[0])
  const tempMin = queryFormatTempC(daily?.temperature_2m_min?.[0])
  const uvMax = queryFormatNum(daily?.uv_index_max?.[0], 1)

  const hourly = forecast.hourly
  const hourIndices = queryUpcomingHourlyIndices(
    hourly?.time ?? [],
    cur.time ?? new Date().toISOString(),
    HOURLY_FORECAST_COUNT
  )
  const hourlyLines = hourIndices.map((i) => {
    const t = hourly?.time?.[i] ?? ''
    const code = hourly?.weather_code?.[i]
    const hDesc = code != null ? queryWmoWeatherZh(code) : '—'
    const temp = queryFormatTempC(hourly?.temperature_2m?.[i])
    const feel = queryFormatTempC(hourly?.apparent_temperature?.[i])
    const hum = queryFormatPct(hourly?.relative_humidity_2m?.[i])
    const dew = queryFormatTempC(hourly?.dew_point_2m?.[i])
    const prob = queryFormatPct(hourly?.precipitation_probability?.[i])
    const precip = queryFormatMm(hourly?.precipitation?.[i])
    const rain = queryFormatMm(hourly?.rain?.[i])
    const cloud = queryFormatPct(hourly?.cloud_cover?.[i])
    const visM = hourly?.visibility?.[i]
    const vis =
      visM != null ? `${queryFormatNum(visM / 1000, 1, ' km')}` : undefined
    const wSpeed = queryFormatKmh(hourly?.wind_speed_10m?.[i])
    const wDir =
      hourly?.wind_direction_10m?.[i] != null
        ? queryWindDirectionZh(hourly.wind_direction_10m[i])
        : undefined
    const gust = queryFormatKmh(hourly?.wind_gusts_10m?.[i])
    const uv = queryFormatNum(hourly?.uv_index?.[i], 1)
    const parts = [
      hDesc,
      temp ? `气温 ${temp}` : '',
      feel ? `体感 ${feel}` : '',
      hum ? `湿度 ${hum}` : '',
      dew ? `露点 ${dew}` : '',
      prob ? `降水概率 ${prob}` : '',
      precip && precip !== '0 mm' ? `降水 ${precip}` : '',
      rain && rain !== '0 mm' ? `降雨 ${rain}` : '',
      cloud ? `云量 ${cloud}` : '',
      vis ? `能见度 ${vis}` : '',
      wDir || wSpeed ? `风 ${[wDir, wSpeed].filter(Boolean).join(' ')}` : '',
      gust ? `阵风 ${gust}` : '',
      uv ? `紫外线 ${uv}` : ''
    ].filter(Boolean)
    const date = queryFormatDateLabel(t)
    return `${date} ${queryFormatHourLabel(t)}｜${parts.join('，')}`
  })

  const dayCount = Math.min(DAILY_FORECAST_DAYS, daily?.time?.length ?? 0)
  const dailyLines: string[] = []
  for (let d = 0; d < dayCount; d++) {
    const date = daily?.time?.[d] ?? `第 ${d + 1} 天`
    const dDesc =
      daily?.weather_code?.[d] != null ? queryWmoWeatherZh(daily.weather_code[d]) : '—'
    const tMin = queryFormatTempC(daily?.temperature_2m_min?.[d])
    const tMax = queryFormatTempC(daily?.temperature_2m_max?.[d])
    const fMin = queryFormatTempC(daily?.apparent_temperature_min?.[d])
    const fMax = queryFormatTempC(daily?.apparent_temperature_max?.[d])
    const sunrise = daily?.sunrise?.[d] ? queryFormatHourLabel(daily.sunrise[d]) : undefined
    const sunset = daily?.sunset?.[d] ? queryFormatHourLabel(daily.sunset[d]) : undefined
    const daylight = queryFormatDurationSec(daily?.daylight_duration?.[d])
    const sunshine = queryFormatDurationSec(daily?.sunshine_duration?.[d])
    const uv = queryFormatNum(daily?.uv_index_max?.[d], 1)
    const precipSum = queryFormatMm(daily?.precipitation_sum?.[d])
    const rainSum = queryFormatMm(daily?.rain_sum?.[d])
    const showerSum = queryFormatMm(daily?.showers_sum?.[d])
    const snowSum = queryFormatMm(daily?.snowfall_sum?.[d])
    const precipHours = queryFormatNum(daily?.precipitation_hours?.[d], 1, ' 小时')
    const precipProb = queryFormatPct(daily?.precipitation_probability_max?.[d])
    const windMax = queryFormatKmh(daily?.wind_speed_10m_max?.[d])
    const gustMax = queryFormatKmh(daily?.wind_gusts_10m_max?.[d])
    const windDom =
      daily?.wind_direction_10m_dominant?.[d] != null
        ? queryWindDirectionZh(daily.wind_direction_10m_dominant[d])
        : undefined
    dailyLines.push(
      [
        `${date}｜${dDesc}`,
        tMin && tMax ? `气温 ${tMin}～${tMax}` : '',
        fMin && fMax ? `体感 ${fMin}～${fMax}` : '',
        sunrise && sunset ? `日出 ${sunrise} / 日落 ${sunset}` : '',
        daylight ? `日照时长 ${daylight}` : '',
        sunshine ? `晴空日照 ${sunshine}` : '',
        uv ? `紫外线最大 ${uv}` : '',
        precipSum ? `降水总量 ${precipSum}` : '',
        rainSum && rainSum !== '0 mm' ? `降雨 ${rainSum}` : '',
        showerSum && showerSum !== '0 mm' ? `阵雨 ${showerSum}` : '',
        snowSum && snowSum !== '0 mm' ? `降雪 ${snowSum}` : '',
        precipHours ? `降水时长 ${precipHours}` : '',
        precipProb ? `最大降水概率 ${precipProb}` : '',
        windDom || windMax ? `主导风 ${[windDom, windMax].filter(Boolean).join(' ')}` : '',
        gustMax ? `最大阵风 ${gustMax}` : ''
      ]
        .filter(Boolean)
        .join('；')
    )
  }

  const summary = `${geo.label}：${desc}${temperature ? `，气温 ${temperature}` : ''}${
    feelsLike ? `，体感 ${feelsLike}` : ''
  }${tempMin && tempMax ? `；今日 ${tempMin}～${tempMax}` : ''}${
    air?.summary ? `；空气质量 ${air.summary}` : ''
  }`

  const rawText = queryBuildWeatherRawText([
    {
      title: '实况',
      lines: [
        `城市：${geo.label}`,
        forecast.elevation != null ? `海拔：${queryFormatNum(forecast.elevation, 0, ' m')}` : '',
        cur.time ? `观测时间：${cur.time.replace('T', ' ')}` : '',
        dayNight ? `昼夜：${dayNight}` : '',
        `天气：${desc}`,
        temperature ? `气温：${temperature}` : '',
        feelsLike ? `体感：${feelsLike}` : '',
        humidity ? `相对湿度：${humidity}` : '',
        wind ? `风力：${wind}` : '',
        windGust ? `阵风：${windGust}` : '',
        queryFormatPct(cur.cloud_cover) ? `云量：${queryFormatPct(cur.cloud_cover)}` : '',
        queryFormatHpa(cur.pressure_msl) ? `海平面气压：${queryFormatHpa(cur.pressure_msl)}` : '',
        queryFormatHpa(cur.surface_pressure)
          ? `地表气压：${queryFormatHpa(cur.surface_pressure)}`
          : '',
        cur.precipitation != null ? `当前降水：${queryFormatMm(cur.precipitation) ?? '0 mm'}` : '',
        cur.rain != null && cur.rain > 0 ? `降雨：${queryFormatMm(cur.rain)}` : '',
        cur.showers != null && cur.showers > 0 ? `阵雨：${queryFormatMm(cur.showers)}` : '',
        cur.snowfall != null && cur.snowfall > 0 ? `降雪：${queryFormatMm(cur.snowfall)}` : ''
      ]
    },
    {
      title: `多日预报（${dayCount} 天）`,
      lines: dailyLines.length ? dailyLines : ['暂无多日预报']
    },
    {
      title: `未来 ${hourIndices.length || HOURLY_FORECAST_COUNT} 小时`,
      lines: hourlyLines.length ? hourlyLines : ['暂无逐小时预报']
    },
    {
      title: '空气质量',
      lines: air?.lines?.length ? air.lines : ['空气质量暂不可用']
    }
  ])

  return {
    city: geo.label,
    summary,
    temperature,
    feelsLike,
    humidity,
    wind,
    tempMin,
    tempMax,
    uvIndex: uvMax,
    airQuality: air?.summary,
    rawText
  }
}

/** wttr.in JSON：免 Key，适合 IP 定位；尽量展开全部字段 */
async function queryWeatherViaWttr(city?: string): Promise<WeatherSnapshot> {
  const loc = city?.trim() ? encodeURIComponent(queryNormalizeCityName(city)) : ''
  const url = `https://wttr.in/${loc}?format=j1&lang=zh`
  const data = await queryHttpJson<{
    nearest_area?: Array<{
      areaName?: Array<{ value?: string }>
      region?: Array<{ value?: string }>
      country?: Array<{ value?: string }>
    }>
    current_condition?: Array<{
      temp_C?: string
      FeelsLikeC?: string
      humidity?: string
      windspeedKmph?: string
      winddir16Point?: string
      winddirDegree?: string
      WindGustKmph?: string
      precipMM?: string
      pressure?: string
      visibility?: string
      uvIndex?: string
      cloudcover?: string
      observation_time?: string
      weatherDesc?: Array<{ value?: string }>
      lang_zh?: Array<{ value?: string }>
    }>
    weather?: Array<{
      date?: string
      maxtempC?: string
      mintempC?: string
      avgtempC?: string
      totalSnow_cm?: string
      sunHour?: string
      uvIndex?: string
      astronomy?: Array<{
        sunrise?: string
        sunset?: string
        moonrise?: string
        moonset?: string
        moon_phase?: string
        moon_illumination?: string
      }>
      hourly?: Array<{
        time?: string
        tempC?: string
        FeelsLikeC?: string
        humidity?: string
        DewPointC?: string
        weatherDesc?: Array<{ value?: string }>
        chanceofrain?: string
        chanceofthunder?: string
        chanceofsnow?: string
        precipMM?: string
        windspeedKmph?: string
        winddir16Point?: string
        WindGustKmph?: string
        cloudcover?: string
        visibility?: string
        uvIndex?: string
        pressure?: string
      }>
    }>
  }>(url, { timeoutMs: 15_000 })

  const nearest = data.nearest_area?.[0]
  const area =
    [nearest?.areaName?.[0]?.value, nearest?.region?.[0]?.value, nearest?.country?.[0]?.value]
      .filter(Boolean)
      .join('·') ||
    city?.trim() ||
    '本地'
  const cur = data.current_condition?.[0]
  if (!cur) throw new Error('wttr.in 无 current_condition')

  const desc =
    cur.lang_zh?.[0]?.value?.trim() ||
    cur.weatherDesc?.[0]?.value?.trim() ||
    '未知'
  const temperature = queryFormatTempC(cur.temp_C)
  const feelsLike = queryFormatTempC(cur.FeelsLikeC)
  const humidity = cur.humidity ? `${cur.humidity}%` : undefined
  const wind = cur.winddir16Point
    ? `${cur.winddir16Point} ${cur.windspeedKmph ?? ''} km/h`.trim()
    : cur.windspeedKmph
      ? `${cur.windspeedKmph} km/h`
      : undefined
  const today = data.weather?.[0]
  const tempMax = queryFormatTempC(today?.maxtempC)
  const tempMin = queryFormatTempC(today?.mintempC)

  const dailyLines = (data.weather ?? []).slice(0, DAILY_FORECAST_DAYS).map((day) => {
    const astro = day.astronomy?.[0]
    return [
      `${day.date ?? '—'}｜`,
      day.mintempC && day.maxtempC ? `气温 ${day.mintempC}～${day.maxtempC}°C` : '',
      day.avgtempC ? `均温 ${day.avgtempC}°C` : '',
      day.uvIndex ? `紫外线 ${day.uvIndex}` : '',
      day.sunHour ? `日照 ${day.sunHour} 小时` : '',
      day.totalSnow_cm && Number(day.totalSnow_cm) > 0 ? `降雪 ${day.totalSnow_cm} cm` : '',
      astro?.sunrise && astro?.sunset ? `日出 ${astro.sunrise} / 日落 ${astro.sunset}` : '',
      astro?.moon_phase ? `月相 ${astro.moon_phase}` : '',
      astro?.moon_illumination ? `月照 ${astro.moon_illumination}%` : '',
      astro?.moonrise ? `月出 ${astro.moonrise}` : '',
      astro?.moonset ? `月落 ${astro.moonset}` : ''
    ]
      .filter(Boolean)
      .join('；')
  })

  const nowHour = new Date().getHours()
  const hourlyLines =
    today?.hourly
      ?.filter((h) => {
        // wttr 的 time 为 0/300/600…（HHMM）
        const slot = Math.floor(Number(h.time ?? -1) / 100)
        return slot >= nowHour
      })
      .map((h) => {
        const slot = Math.floor(Number(h.time ?? 0) / 100)
        const label = `${String(slot).padStart(2, '0')}:00`
        const hDesc = h.weatherDesc?.[0]?.value?.trim() ?? '—'
        const parts = [
          hDesc,
          h.tempC ? `气温 ${h.tempC}°C` : '',
          h.FeelsLikeC ? `体感 ${h.FeelsLikeC}°C` : '',
          h.humidity ? `湿度 ${h.humidity}%` : '',
          h.DewPointC ? `露点 ${h.DewPointC}°C` : '',
          h.chanceofrain ? `降雨概率 ${h.chanceofrain}%` : '',
          h.chanceofthunder ? `雷暴概率 ${h.chanceofthunder}%` : '',
          h.chanceofsnow ? `降雪概率 ${h.chanceofsnow}%` : '',
          h.precipMM ? `降水 ${h.precipMM} mm` : '',
          h.winddir16Point || h.windspeedKmph
            ? `风 ${[h.winddir16Point, h.windspeedKmph ? `${h.windspeedKmph} km/h` : '']
                .filter(Boolean)
                .join(' ')}`
            : '',
          h.WindGustKmph ? `阵风 ${h.WindGustKmph} km/h` : '',
          h.cloudcover ? `云量 ${h.cloudcover}%` : '',
          h.visibility ? `能见度 ${h.visibility} km` : '',
          h.pressure ? `气压 ${h.pressure} mb` : '',
          h.uvIndex ? `紫外线 ${h.uvIndex}` : ''
        ].filter(Boolean)
        return `${label}｜${parts.join('，')}`
      }) ?? []

  const summary = `${area}：${desc}${temperature ? `，气温 ${temperature}` : ''}${
    feelsLike ? `，体感 ${feelsLike}` : ''
  }${tempMin && tempMax ? `；今日 ${tempMin}～${tempMax}` : ''}`

  const rawText = queryBuildWeatherRawText([
    {
      title: '实况',
      lines: [
        `城市：${area}`,
        cur.observation_time ? `观测时间（UTC）：${cur.observation_time}` : '',
        `天气：${desc}`,
        temperature ? `气温：${temperature}` : '',
        feelsLike ? `体感：${feelsLike}` : '',
        humidity ? `相对湿度：${humidity}` : '',
        wind ? `风力：${wind}` : '',
        cur.WindGustKmph ? `阵风：${cur.WindGustKmph} km/h` : '',
        cur.winddirDegree ? `风向角度：${cur.winddirDegree}°` : '',
        cur.cloudcover ? `云量：${cur.cloudcover}%` : '',
        cur.precipMM ? `降水量：${cur.precipMM} mm` : '',
        cur.pressure ? `气压：${cur.pressure} mb` : '',
        cur.visibility ? `能见度：${cur.visibility} km` : '',
        cur.uvIndex ? `紫外线指数：${cur.uvIndex}` : ''
      ]
    },
    {
      title: `多日预报（${dailyLines.length || DAILY_FORECAST_DAYS} 天）`,
      lines: dailyLines.length ? dailyLines : ['暂无多日预报']
    },
    {
      title: '今日剩余时段',
      lines: hourlyLines.length ? hourlyLines : ['暂无逐小时预报']
    }
  ])

  return {
    city: area,
    summary,
    temperature,
    feelsLike,
    humidity,
    wind,
    tempMin,
    tempMax,
    uvIndex: cur.uvIndex,
    rawText
  }
}

async function queryWeatherViaBrowser(city?: string): Promise<WeatherSnapshot> {
  const browser = getBrowserService()
  const normalized = city?.trim() ? queryNormalizeCityName(city) : ''
  const q = normalized ? encodeURIComponent(normalized) : ''
  // 文本版包含较完整的多日与小时细节
  const url = q
    ? `https://wttr.in/${q}?lang=zh`
    : 'https://wttr.in/?lang=zh'
  await browser.navigate(url, 'headless')
  await browser.wait({ ms: 1500 }, 'headless')
  const text = await browser.extractText({ maxLength: 12_000 }, 'headless')
  if (!text.trim()) throw new Error('无头浏览器未提取到天气文本')
  const cityLabel = city?.trim() || '本地'
  const summary = text.split('\n').map((l) => l.trim()).find(Boolean) ?? text.slice(0, 80)
  return {
    city: cityLabel,
    summary: `${cityLabel}：${summary}`,
    rawText: text.trim().slice(0, 10_000)
  }
}

function queryParseCityArg(raw: unknown): string | undefined {
  if (raw == null) return undefined
  const s = String(raw).trim()
  return s || undefined
}

export const queryWeatherTool: AgentTool = {
  name: 'query_weather',
  description:
    '获取指定城市的完整天气细节（默认按本机 IP 定位；可传 city）。' +
    '包含：实况全字段、3 日预报（高低温/体感/日出日落/日照/紫外线/降水分项/主导风）、未来 24 小时逐时、空气质量（PM2.5/PM10/AQI 等）。' +
    '优先 Open-Meteo；失败再 wttr.in / 无头浏览器兜底。' +
    '写入 context.weatherOk / weatherText / weatherSummary 等字段。',
  permission: 'safe',
  parameters: {
    type: 'object',
    properties: {
      city: {
        type: 'string',
        description:
          '城市名，如「北京」「上海」「深圳」；可带「市」后缀；缺省则按 IP 定位；若 IP 无法定位则默认「合肥」'
      }
    },
    required: []
  },
  async execute(args) {
    const city = queryParseCityArg(args.city)

    // 有 city：Open-Meteo 优先（中文地名准确）；无 city：先 wttr IP，再默认合肥
    const apiFetchers = city
      ? [() => queryWeatherViaOpenMeteo(city), () => queryWeatherViaWttr(city)]
      : [
          () => queryWeatherViaWttr(undefined),
          () => queryWeatherViaOpenMeteo(DEFAULT_CITY_WHEN_NO_LOC)
        ]

    const result = await queryWithFallback({
      apiFetchers,
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
      weatherTemperature: result.data.temperature ?? '',
      weatherFeelsLike: result.data.feelsLike ?? '',
      weatherHumidity: result.data.humidity ?? '',
      weatherWind: result.data.wind ?? '',
      weatherTempMin: result.data.tempMin ?? '',
      weatherTempMax: result.data.tempMax ?? '',
      weatherUvIndex: result.data.uvIndex ?? '',
      weatherAirQuality: result.data.airQuality ?? '',
      weatherFetchSource: result.source
    })
  }
}
