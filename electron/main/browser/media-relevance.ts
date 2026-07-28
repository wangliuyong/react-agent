/**
 * 网页媒体相关性筛选：结合页面截图（屏幕识别）与候选元数据，
 * 用 vision 模型只挑选与主题相关的图/视频，避免一股脑下载整页资源。
 */
import { HumanMessage, SystemMessage } from '@langchain/core/messages'
import type { Page } from 'playwright'
import { createChatModel } from '../agent/llm-langchain'
import { querySettings } from '../store/settings'

/** 供筛选的媒体候选（下载前） */
export interface MediaRelevanceCandidate {
  url: string
  kind: 'image' | 'video' | 'audio'
  /** alt / aria-label / title 等 */
  label?: string
  /** 面积分，越大越可能是主图 */
  score?: number
  /** 是否在视口内（屏幕可见） */
  inViewport?: boolean
}

export interface QuerySelectRelevantMediaOptions {
  /** 搜索/创作主题，例如「齐达内退役」「36氪融资」 */
  topic: string
  candidates: MediaRelevanceCandidate[]
  /** 最多保留几条 */
  maxCount: number
  /** 页面视口截图（PNG），有则走屏幕识别 */
  screenshotPng?: Buffer
  signal?: AbortSignal
}

export interface QuerySelectRelevantMediaResult {
  /** 按相关性筛后的 URL（顺序即推荐优先级） */
  urls: string[]
  /** 选用的策略说明 */
  strategy: 'vision' | 'heuristic'
  note: string
}

const SYSTEM_PROMPT =
  '你是网页配图质检员。根据用户主题与页面截图，从候选列表中选出与主题内容真正相关的图片/视频。' +
  '必须拒绝：网站 Logo、头像、图标、广告、二维码、无关推荐位、纯装饰图。' +
  '只返回 JSON：{"selected":[候选编号,...],"reason":"一句话说明"}。编号从 1 开始。'

/**
 * 从 LLM 返回文本中解析 JSON 对象。
 */
export function queryParseJsonObject(raw: string): Record<string, unknown> | null {
  const text = String(raw ?? '').trim()
  if (!text) return null
  try {
    const direct = JSON.parse(text) as unknown
    if (direct && typeof direct === 'object' && !Array.isArray(direct)) {
      return direct as Record<string, unknown>
    }
  } catch {
    // 尝试从代码块 / 夹杂文本中截取
  }
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const slice = fence?.[1] ?? text
  const start = slice.indexOf('{')
  const end = slice.lastIndexOf('}')
  if (start < 0 || end <= start) return null
  try {
    const obj = JSON.parse(slice.slice(start, end + 1)) as unknown
    if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
      return obj as Record<string, unknown>
    }
  } catch {
    return null
  }
  return null
}

/**
 * 解析 vision/启发式返回的 selected 编号（1-based）→ 0-based 下标。
 */
export function queryParseSelectedIndexes(
  selected: unknown,
  candidateCount: number,
  maxCount: number
): number[] {
  if (!Array.isArray(selected)) return []
  const out: number[] = []
  const seen = new Set<number>()
  for (const item of selected) {
    const n = Number(item)
    if (!Number.isFinite(n)) continue
    const idx = Math.floor(n) - 1
    if (idx < 0 || idx >= candidateCount || seen.has(idx)) continue
    seen.add(idx)
    out.push(idx)
    if (out.length >= maxCount) break
  }
  return out
}

/** 从消息 content 提取纯文本 */
function queryLlmTextContent(content: unknown): string {
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    return content
      .map((block) => {
        if (typeof block === 'string') return block
        if (block && typeof block === 'object' && 'text' in block) {
          return String((block as { text?: unknown }).text ?? '')
        }
        return ''
      })
      .join('')
  }
  return String(content ?? '')
}

/** 主题词简单切分，供启发式匹配 */
export function queryTopicTokens(topic: string): string[] {
  return String(topic ?? '')
    .toLowerCase()
    .split(/[\s,，、|／/·\-_:：;；]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2)
}

/**
 * 无 vision 时的启发式：优先视口内 + 主题词命中标签 + 面积分，并排除明显装饰图。
 */
export function querySelectRelevantMediaHeuristic(
  topic: string,
  candidates: MediaRelevanceCandidate[],
  maxCount: number
): QuerySelectRelevantMediaResult {
  const tokens = queryTopicTokens(topic)
  const ranked = candidates
    .map((c, index) => {
      const hay = `${c.label ?? ''} ${c.url}`.toLowerCase()
      const decorative = /logo|icon|avatar|sprite|emoji|qrcode|二维码|广告|banner-ad/i.test(
        hay
      )
      const hits = tokens.length ? tokens.filter((t) => hay.includes(t)).length : 0
      let score = c.score ?? 0
      if (c.inViewport) score += 80_000
      // 硬降权装饰图：即使 og 面积分很高也不该压过正文配图
      if (decorative) score -= 1_000_000
      if (tokens.length) {
        score += hits * 50_000
        // 主题零命中再降一档，避免无标签大图抢走名额
        if (hits === 0) score -= 40_000
      }
      // 音频通常不靠「屏幕识别」；主题无命中时略降权
      if (c.kind === 'audio' && tokens.length && hits === 0) {
        score -= 30_000
      }
      return { index, score, decorative, hits }
    })
    // 有主题时直接丢掉明显装饰图
    .filter((r) => !(tokens.length && r.decorative))
    .sort((a, b) => b.score - a.score)

  // 有主题词时优先只保留命中项，避免「降权但仍全下」
  const preferred =
    tokens.length > 0 ? ranked.filter((r) => r.hits > 0) : ranked
  const pool = preferred.length > 0 ? preferred : ranked

  const urls = pool.slice(0, maxCount).map((r) => candidates[r.index].url)
  return {
    urls,
    strategy: 'heuristic',
    note: tokens.length
      ? `启发式按主题「${topic}」与视口/标签筛选 ${urls.length}/${candidates.length}`
      : `启发式按视口与尺寸筛选 ${urls.length}/${candidates.length}（未提供主题词）`
  }
}

/**
 * 用 vision 模型 + 页面截图筛选相关媒体；失败时回退启发式。
 */
export async function querySelectRelevantMedia(
  opts: QuerySelectRelevantMediaOptions
): Promise<QuerySelectRelevantMediaResult> {
  const topic = String(opts.topic ?? '').trim()
  const maxCount = Math.min(Math.max(opts.maxCount, 1), 20)
  const candidates = opts.candidates.filter((c) => /^https?:\/\//i.test(c.url))
  if (!candidates.length) {
    return { urls: [], strategy: 'heuristic', note: '无可用候选' }
  }
  if (candidates.length <= maxCount && !opts.screenshotPng && !topic) {
    return {
      urls: candidates.slice(0, maxCount).map((c) => c.url),
      strategy: 'heuristic',
      note: '候选不多，直接采用'
    }
  }

  const fallback = (): QuerySelectRelevantMediaResult =>
    querySelectRelevantMediaHeuristic(topic || '页面主图', candidates, maxCount)

  if (opts.signal?.aborted) throw new Error('用户已中止')

  const settings = querySettings()
  // 无 API Key / 无截图时不硬调 vision
  if (!settings.apiKey || !opts.screenshotPng?.length) {
    return fallback()
  }

  try {
    const model = createChatModel(settings, 'default', 'vision').withConfig({
      temperature: 0.1,
      // 一次性 JSON，不需要流式
      streaming: false
    })

    const listText = candidates
      .map((c, i) => {
        const label = (c.label || '').trim() || '(无标题)'
        const flag = c.inViewport ? '视口内' : '视口外'
        return `${i + 1}. [${c.kind}/${flag}] ${label}\n   URL: ${c.url}`
      })
      .join('\n')

    const b64 = opts.screenshotPng.toString('base64')
    const human = new HumanMessage({
      content: [
        {
          type: 'text',
          text:
            `主题：${topic || '（未指定，请选与正文主内容最相关的配图/视频）'}\n` +
            `最多选 ${maxCount} 个编号。\n\n候选列表：\n${listText}\n\n` +
            '请结合上方截图判断屏幕上可见内容，只选与主题相关的编号。'
        },
        {
          type: 'image_url',
          image_url: { url: `data:image/png;base64,${b64}` }
        }
      ]
    })

    const result = await model.invoke([new SystemMessage(SYSTEM_PROMPT), human], {
      signal: opts.signal
    })
    const parsed = queryParseJsonObject(queryLlmTextContent(result.content))
    const indexes = queryParseSelectedIndexes(parsed?.selected, candidates.length, maxCount)
    if (!indexes.length) {
      console.warn('[media-relevance] vision 未返回有效编号，回退启发式')
      return fallback()
    }
    const urls = indexes.map((i) => candidates[i].url)
    const reason =
      typeof parsed?.reason === 'string' && parsed.reason.trim()
        ? parsed.reason.trim()
        : 'vision 屏幕识别'
    return {
      urls,
      strategy: 'vision',
      note: `屏幕识别选定 ${urls.length}/${candidates.length}：${reason}`
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.warn('[media-relevance] vision failed, fallback:', msg)
    const fb = fallback()
    return { ...fb, note: `${fb.note}（vision 失败：${msg}）` }
  }
}

/**
 * 对当前 Playwright 页截取视口 PNG，供屏幕识别。
 */
export async function queryPageViewportScreenshot(
  page: Page
): Promise<Buffer | null> {
  try {
    const buf = await page.screenshot({ type: 'png', fullPage: false })
    return Buffer.isBuffer(buf) ? buf : Buffer.from(buf)
  } catch (err) {
    console.warn('[media-relevance] screenshot failed:', err)
    return null
  }
}
