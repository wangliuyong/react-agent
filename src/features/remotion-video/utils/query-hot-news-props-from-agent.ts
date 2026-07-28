import type { HotNewsProps } from '@remotion-starter/compositions/hot-news/types'
import type { HotTopicSource } from '../constants/hot-topic-sources'
import type { RemotionVideoCategory } from '../types'
import { postCreateSession } from '@/features/chat/api'
import { postAgentChat } from '@/features/chat/api'
import { querySession } from '@/features/chat/api'
import {
  DEFAULT_HOT_NEWS_DURATION_SEC,
  queryHotNewsContentBudget
} from './query-hot-news-content-budget'
import { queryNormalizeHotNewsProps } from './query-normalize-hot-news-props'

const HOT_NEWS_JSON_SCHEMA = `{
  "brandName": "string",
  "dateLabel": "string",
  "headline": "string（单条主标题，勿拼接多条）",
  "summary": "string（总导语，1-2句）",
  "hotTopicName": "string (2-6字，中部红色角标，如 芯片)",
  "secondsPerItem": "number（每条默认展示秒数，由你根据用户要求与成片时长智能决定）",
  "tickerLines": ["string (底部 LIVE 滚动快讯，每条一句)"],
  "accentColor": "string (可选，如 #e63946)",
  "items": [{
    "tag": "string",
    "title": "string（热点标题）",
    "detail": "string（该条详细播报，2-4句，必须来自检索到的具体信息，禁止只重复 title）",
    "seconds": "number（可选，本条单独展示秒数；缺省用 secondsPerItem）"
  }]
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

export interface QueryHotNewsPropsFromAgentInput {
  userBrief: string
  hotSource: HotTopicSource | 'all'
  newsCategory: RemotionVideoCategory
  compositionId: string
  /** 用户已填的热点名称，优先写入 JSON */
  hotTopicName?: string
  /** 用户已填的滚动快讯（每行一条） */
  tickerLinesText?: string
  /** 成片时长（秒），作为 Agent 决策条数/节奏的上限参考 */
  durationSec?: number
}

/**
 * 调用 Agent：拉热点标题 → 查每条详情 → 智能决定条数与展示时长 → 输出 HotNewsProps。w
 * 为什么独立会话：避免污染用户当前聊天上下文，且可在 Remotion 页静默完成。
 */
export async function queryHotNewsPropsFromAgent(
  input: QueryHotNewsPropsFromAgentInput
): Promise<HotNewsProps> {
  const session = await postCreateSession('chat')
  const durationSec = input.durationSec ?? DEFAULT_HOT_NEWS_DURATION_SEC
  const budget = queryHotNewsContentBudget(durationSec)
  const sourceHint =
    input.hotSource === 'all'
      ? '热点来源：全部（先 fetch_hot_topics 多源综合，再筛选）'
      : `热点来源：${input.hotSource}（请调用 fetch_hot_topics，source=${input.hotSource}）`

  const prompt = [
    '你是 Remotion 热点新闻视频的内容导演兼文案编辑。最终只输出一个符合 schema 的 JSON，不要 Markdown 说明。',
    `模板 compositionId：${input.compositionId}`,
    sourceHint,
    `视频分类：${input.newsCategory}`,
    `成片总时长：约 ${budget.durationSec} 秒（片头约占 10%，主段可轮播约 ${Math.max(6, budget.durationSec - 3)} 秒）。`,
    '',
    '【必须遵守的工作流程】',
    '1) 调用 fetch_hot_topics 获取今日热点标题列表（可按来源重试）。',
    `2) 结合「用户素材或要求」与成片时长，智能决定：展示条数（${budget.minItems}-${budget.maxItems}）、` +
      `全局 secondsPerItem（${budget.minSecondsPerItem}-${budget.maxSecondsPerItem} 秒）。` +
      '用户若明确说了「每条几秒 / 播几条 / 节奏快慢」，必须优先服从；否则按：详情越长秒数越大、总条数×秒数≈主段时长。',
    '3) 对选中的每条标题，必须再查具体信息后再写 detail：',
    '   - 优先：browser_navigate 打开百度/必应/新闻站搜索该标题，或打开相关报道页，再用 browser_snapshot 阅读要点；',
    '   - 若已有明确文章 URL：用 query_web_data 拉取正文；',
    '   - 禁止仅把 title 改写一句当作 detail；detail 需包含事件背景、关键主体或进展等可核验信息。',
    `4) 每条 detail 控制在 ${budget.detailMinChars}-${budget.detailMaxChars} 字（2-4 句，适合大屏播报）。`,
    '5) 汇总输出 JSON。',
    '',
    input.hotTopicName?.trim()
      ? `用户指定热点名称（hotTopicName）：${input.hotTopicName.trim()}，JSON 中必须使用该值。`
      : '请根据内容生成 hotTopicName（2-6 字）。',
    input.tickerLinesText?.trim()
      ? `用户已指定底部滚动快讯（tickerLines，必须使用以下内容，每行一条）：\n${input.tickerLinesText.trim()}`
      : `用户未填写 LIVE 滚动快讯：你必须根据 items 自动生成 tickerLines（${budget.minTickerLines}-${budget.maxTickerLines} 条，每条 12-28 字）。`,
    '用户素材或要求：',
    input.userBrief.trim() || '（用户未填写，请根据当前热点智能选题并查详情）',
    '',
    '输出字段 schema：',
    HOT_NEWS_JSON_SCHEMA,
    '',
    `规则：headline 必须是单条主标题（不超过 ${budget.headlineMaxChars} 字），禁止用逗号/顿号拼接多条；`,
    `summary 不超过 ${budget.summaryMaxChars} 字；items 共 ${budget.minItems}-${budget.maxItems} 条且每条必须有 detail；`,
    'tag 2-8 字；secondsPerItem 必填；可选为个别条目设 items[].seconds。',
    '模板会按 secondsPerItem（或条目 seconds）轮播：主标题展示 title+detail，中部条带同步切换。',
    '只回复一个 JSON 对象。'
  ].join('\n')

  await postAgentChat(session.id, prompt)

  /** 查详情可能多轮工具调用，放宽到 4 分钟 */
  const deadline = Date.now() + 240_000
  let last: Awaited<ReturnType<typeof querySession>> = null
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 1500))
    last = await querySession(session.id)
    const assistant = [...(last?.messages ?? [])]
      .reverse()
      .find((m) => m.role === 'assistant' && m.content.trim())
    if (assistant) {
      const parsed = queryJsonObjectFromText(assistant.content)
      const props = parsed ? queryNormalizeHotNewsProps(parsed, budget) : null
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
