import { describe, expect, it } from 'vitest'
import {
  patchAgentOutputToContext,
  queryAgentStepOutput,
  queryExtractNotifyMarkdown,
  queryMarkdownHeadingTitle
} from '../electron/main/workflow/tool-result'
import { queryWorkflowHasNotifyNode } from '../shared/workflow-notify'
import type { WorkflowNode } from '../shared/types'

describe('queryExtractNotifyMarkdown', () => {
  it('优先提取代码围栏内的 Markdown 正文', () => {
    const raw = [
      '已从微博筛选科技热点，整理如下：',
      '```markdown',
      '## 热点富文本简报',
      '1. 小米汽车 [查看](https://weibo.com)',
      '```'
    ].join('\n')
    expect(queryExtractNotifyMarkdown(raw)).toBe(
      '## 热点富文本简报\n1. 小米汽车 [查看](https://weibo.com)'
    )
  })

  it('无代码围栏时从首个标题行开始截取', () => {
    const raw = '说明文字\n\n## 热点富文本简报\n- 条目'
    expect(queryExtractNotifyMarkdown(raw)).toBe('## 热点富文本简报\n- 条目')
  })
})

describe('queryMarkdownHeadingTitle', () => {
  it('提取二级标题作为推送标题', () => {
    expect(queryMarkdownHeadingTitle('## 热点富文本简报\n- 条目')).toBe('热点富文本简报')
  })
})

describe('queryAgentStepOutput', () => {
  it('只取本步新增消息中的最后一条 assistant 正文', () => {
    const messages = [
      { role: 'user', content: '步骤1' },
      { role: 'assistant', content: '旧回复' },
      { role: 'user', content: '步骤2' },
      { role: 'tool', content: '工具结果' },
      { role: 'assistant', content: '  最终简报  ' }
    ]
    expect(queryAgentStepOutput(messages, 2)).toBe('最终简报')
  })

  it('本步无 assistant 时返回空串', () => {
    const messages = [
      { role: 'user', content: '步骤' },
      { role: 'tool', content: '仅工具' }
    ]
    expect(queryAgentStepOutput(messages, 0)).toBe('')
  })

  it('自动剥离代码围栏与过程说明', () => {
    const messages = [
      { role: 'user', content: '整理简报' },
      {
        role: 'assistant',
        content: '已整理\n```markdown\n## 热点富文本简报\n1. 条目\n```'
      }
    ]
    expect(queryAgentStepOutput(messages, 0)).toBe('## 热点富文本简报\n1. 条目')
  })
})

describe('queryWorkflowHasNotifyNode', () => {
  it('识别条件分支内的渠道通知节点', () => {
    const nodes = [
      {
        id: 'c1',
        type: 'condition',
        title: '分支',
        mode: 'expression',
        cases: [
          {
            key: 'ok',
            label: '是',
            nodes: [
              {
                id: 'n1',
                type: 'notify',
                title: '通知',
                channelId: 'feishu',
                contentTemplate: '{{summary}}'
              }
            ]
          }
        ]
      }
    ] as WorkflowNode[]
    expect(queryWorkflowHasNotifyNode(nodes)).toBe(true)
  })
})

describe('patchAgentOutputToContext', () => {
  it('未配置 outputKeys 时默认写入 summary', () => {
    expect(patchAgentOutputToContext({}, '简报正文')).toEqual({ summary: '简报正文' })
  })

  it('支持自定义 outputKeys', () => {
    expect(
      patchAgentOutputToContext({ x: 1 }, '正文', ['brief', 'summary'])
    ).toEqual({ x: 1, brief: '正文', summary: '正文' })
  })

  it('产出为空时不修改 context', () => {
    expect(patchAgentOutputToContext({ a: 1 }, '')).toEqual({ a: 1 })
  })
})
