import type { HotNewsProps } from '@remotion-starter/compositions/hot-news/types'
import type { HotTopicSource } from '../constants/hot-topic-sources'
import type { RemotionVideoCategory } from '../types'
import { postCreateSession } from '@/features/chat/api'
import { postAgentChat } from '@/features/chat/api'
import { querySession } from '@/features/chat/api'

const HOT_NEWS_JSON_SCHEMA = `{
  "brandName": "string",
  "dateLabel": "string",
  "headline": "string",
  "summary": "string",
  "hotTopicName": "string (2-6字，中部红色角标，如 芯片)",
  "tickerLines": ["string (底部 LIVE 滚动快讯，每条一句)"],
  "accentColor": "string (可选，如 #e63946)",
  "items": [{ "tag": "string", "title": "string" }]
}`

/** 从 assistant 回复中提取 JSON 对象 */
function queryJsonObjectFromText(text: string): Record<string, unknown> | null {
  const trimmed = text.trim()
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const candidate = fence ? fence[1].trim() : trimmed
  const start = candidate.indexOf('{')
  const end = candidate.lastIndexOf('}')
  if (start < 0 || end <= start) return null
  try {
    return JSON.parse(candidate.slice(start, end + 1)) as Record<string, unknown>
  } catch {
    return null
  }
}

function queryNormalizeHotNewsProps(raw: Record<string, unknown>): HotNewsProps | null {
  const brandName = String(raw.brandName ?? '').trim()
  const dateLabel = String(raw.dateLabel ?? '').trim()
  const headline = String(raw.headline ?? '').trim()
  const summary = String(raw.summary ?? '').trim()
  const itemsRaw = raw.items
  if (!brandName || !headline || !summary || !Array.isArray(itemsRaw)) return null
  const items = itemsRaw
    .map((row) => {
      if (!row || typeof row !== 'object') return null
      const tag = String((row as { tag?: string }).tag ?? '').trim()
      const title = String((row as { title?: string }).title ?? '').trim()
      if (!tag || !title) return null
      return { tag, title }
    })
    .filter((x): x is { tag: string; title: string } => Boolean(x))
  if (items.length < 1) return null
  const accentColor = raw.accentColor != null ? String(raw.accentColor).trim() : undefined
  const hotTopicName =
    raw.hotTopicName != null ? String(raw.hotTopicName).trim().slice(0, 8) : undefined
  const tickerRaw = raw.tickerLines
  let tickerLines = Array.isArray(tickerRaw)
    ? tickerRaw
        .map((line) => String(line ?? '').trim())
        .filter(Boolean)
        .slice(0, 12)
    : undefined
  /** 用户未手填快讯时，Agent 应生成 tickerLines；仍缺失则用 items 标题兜底 */
  if (!tickerLines?.length) {
    tickerLines = items.map((item) => item.title).filter(Boolean).slice(0, 8)
  }
  return {
    brandName,
    dateLabel: dateLabel || new Date().toLocaleDateString('zh-CN'),
    headline,
    summary,
    items: items.slice(0, 6),
    ...(hotTopicName ? { hotTopicName } : {}),
    tickerLines,
    ...(accentColor ? { accentColor } : {})
  }
}

export interface QueryHotNewsPropsFromAgentInput {
  userBrief: string
  hotSource: HotTopicSource | 'all'
  newsCategory: RemotionVideoCategory
  compositionId: string
  /** 用户已填的热点名称，优先写入 JSON */
  hotTopicName?: string
  /** 用户已填的滚动快讯（每行一条） */
  tickerLinesText?: string
}

/**
 * 调用 Agent 将用户输入整理为 HotNewsProps JSON。
 * 为什么独立会话：避免污染用户当前聊天上下文，且可在 Remotion 页静默完成。
 */
export async function queryHotNewsPropsFromAgent(
  input: QueryHotNewsPropsFromAgentInput
): Promise<HotNewsProps> {
  const session = await postCreateSession('chat')
  const sourceHint =
    input.hotSource === 'all'
      ? '热点来源：全部（可先 fetch_hot_topics 多源综合，或根据用户文案提炼）'
      : `热点来源：${input.hotSource}（请调用 fetch_hot_topics，source=${input.hotSource}）`

  const prompt = [
    '你是 Remotion 热点新闻模板文案编辑。只做一件事：输出符合模板的 JSON，不要 Markdown 说明。',
    `模板 compositionId：${input.compositionId}`,
    sourceHint,
    `视频分类：${input.newsCategory}`,
    input.hotTopicName?.trim()
      ? `用户指定热点名称（hotTopicName）：${input.hotTopicName.trim()}，JSON 中必须使用该值。`
      : '请根据内容生成 hotTopicName（2-6 字）。',
    input.tickerLinesText?.trim()
      ? `用户已指定底部滚动快讯（tickerLines，必须使用以下内容，每行一条）：\n${input.tickerLinesText.trim()}`
      : '用户未填写 LIVE 滚动快讯：你必须根据 headline、summary、items 自动生成 tickerLines（3-6 条，每条 12-28 字，适合底部滚动字幕）。',
    '用户素材或要求：',
    input.userBrief.trim() || '（用户未填写，请根据当前热点生成一版合理快讯）',
    '',
    '输出字段 schema：',
    HOT_NEWS_JSON_SCHEMA,
    '',
    '规则：headline 不超过 40 字；summary 80 字内；items 3-5 条；tag 2-4 字；tickerLines 必填 3-6 条。',
    '只回复一个 JSON 对象。'
  ].join('\n')

  await postAgentChat(session.id, prompt)

  const deadline = Date.now() + 120_000
  let last: Awaited<ReturnType<typeof querySession>> = null
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 1500))
    last = await querySession(session.id)
    const assistant = [...(last?.messages ?? [])]
      .reverse()
      .find((m) => m.role === 'assistant' && m.content.trim())
    if (assistant) {
      const parsed = queryJsonObjectFromText(assistant.content)
      const props = parsed ? queryNormalizeHotNewsProps(parsed) : null
      if (props) {
        return queryApplyUserTickerOverride(props, input.tickerLinesText)
      }
    }
    const stillRunning = (last?.tasks ?? []).some(
      (t) => t.status === 'running' || t.status === 'pending'
    )
    if (!stillRunning && assistant) break
  }

  throw new Error('Agent 未能返回有效的热点新闻模板 JSON，请简化输入后重试')
}

/** 用户手填快讯时覆盖 Agent 结果；未填则保留 Agent 生成的 tickerLines */
function queryApplyUserTickerOverride(
  props: HotNewsProps,
  tickerLinesText?: string
): HotNewsProps {
  const manual = tickerLinesText
    ?.split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
  if (!manual?.length) return props
  return { ...props, tickerLines: manual.slice(0, 12) }
}
