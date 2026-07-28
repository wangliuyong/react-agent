import { describe, expect, it } from 'vitest'
import {
  queryIsRemotionVideoTemplateSkillId,
  queryRemotionVideoTemplateFromSkillMd
} from '../shared/remotion-video-template'

describe('remotion video template skill parse', () => {
  it('识别 remotion-template-* id', () => {
    expect(queryIsRemotionVideoTemplateSkillId('remotion-template-hot-news')).toBe(true)
    expect(queryIsRemotionVideoTemplateSkillId('react-agent-remotion')).toBe(false)
  })

  it('从 SKILL.md frontmatter 解析模版卡片字段', () => {
    const raw = `---
name: 热点新闻
description: >-
  片头闪屏与分条轮播
remotionVideoTemplate: true
category: news
compositionId: HotNews
accent: "#e63946"
durationSec: 20
status: ready
previewKind: hot-news-wide
---

# 正文
`
    const parsed = queryRemotionVideoTemplateFromSkillMd(
      'remotion-template-hot-news',
      raw,
      1_700_000_000_000,
      true
    )
    expect(parsed).toEqual(
      expect.objectContaining({
        id: 'remotion-template-hot-news',
        title: '热点新闻',
        category: 'news',
        compositionId: 'HotNews',
        accent: '#e63946',
        durationSec: 20,
        status: 'ready',
        previewKind: 'hot-news-wide',
        hasTemplateCode: true
      })
    )
  })

  it('显式 remotionVideoTemplate: false 时跳过', () => {
    const raw = `---
name: x
description: y
remotionVideoTemplate: false
---

# body
`
    expect(
      queryRemotionVideoTemplateFromSkillMd('remotion-template-x', raw, Date.now())
    ).toBeNull()
  })
})
