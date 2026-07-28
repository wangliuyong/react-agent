import { describe, expect, it } from 'vitest'
import { queryHotNewsContentBudget } from '../src/features/remotion-video/utils/query-hot-news-content-budget'
import { queryNormalizeHotNewsProps } from '../src/features/remotion-video/utils/query-normalize-hot-news-props'

describe('queryNormalizeHotNewsProps', () => {
  const budget = queryHotNewsContentBudget(20)

  it('解析 detail、secondsPerItem 与条目 seconds', () => {
    const props = queryNormalizeHotNewsProps(
      {
        brandName: '灵犀快讯',
        dateLabel: '2026年7月28日',
        headline: '工信部发布算力基建新规划',
        summary: '聚焦东数西算与智算中心布局。',
        secondsPerItem: 5,
        tickerLines: ['算力基建提速'],
        items: [
          {
            tag: '政策',
            title: '工信部发布算力基建新规划',
            detail:
              '工信部印发新规划，明确智算中心建设节奏与绿色算力指标，东部枢纽与西部节点协同推进。',
            seconds: 6
          },
          {
            tag: '市场',
            title: '算力概念股集体走强',
            detail: '消息刺激下相关板块放量上涨，资金关注光模块与服务器环节。'
          }
        ]
      },
      budget
    )

    expect(props).not.toBeNull()
    expect(props!.secondsPerItem).toBe(5)
    expect(props!.items[0].detail).toContain('智算中心')
    expect(props!.items[0].seconds).toBe(6)
    expect(props!.items[1].detail).toContain('光模块')
  })

  it('未给 secondsPerItem 时按时长与条数回填合理秒数', () => {
    const props = queryNormalizeHotNewsProps(
      {
        brandName: '测试',
        dateLabel: '今天',
        headline: '标题',
        summary: '导语内容足够长用于通过校验。',
        items: [
          { tag: '科技', title: '新闻一', detail: '详情一包含足够文字以便展示播报内容。' },
          { tag: '财经', title: '新闻二', detail: '详情二包含足够文字以便展示播报内容。' },
          { tag: '国际', title: '新闻三', detail: '详情三包含足够文字以便展示播报内容。' }
        ]
      },
      budget
    )
    expect(props).not.toBeNull()
    expect(props!.secondsPerItem).toBeGreaterThanOrEqual(budget.minSecondsPerItem)
    expect(props!.secondsPerItem).toBeLessThanOrEqual(budget.maxSecondsPerItem)
  })

  it('缺少必填字段时返回 null', () => {
    expect(queryNormalizeHotNewsProps({ brandName: 'x' }, budget)).toBeNull()
  })
})
