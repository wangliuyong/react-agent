import { describe, expect, it } from 'vitest'
import type { ChatMessage } from '@shared/types'
import {
  queryAwaitUserChoicesFromMessages,
  queryAwaitUserReasonFromMessages
} from '../src/features/chat/utils/queryAwaitUserReasonFromMessages'

function msg(
  role: ChatMessage['role'],
  content: string,
  id = crypto.randomUUID()
): ChatMessage {
  return { id, role, content, createdAt: Date.now() }
}

describe('queryAwaitUserReasonFromMessages', () => {
  it('从最近一条等待确认消息解析原因', () => {
    expect(
      queryAwaitUserReasonFromMessages([
        msg('assistant', '流程开始'),
        msg('assistant', '等待确认：请确认后继续')
      ])
    ).toBe('请确认后继续')
  })

  it('用户已在等待确认后回复则不再展示挂起原因', () => {
    expect(
      queryAwaitUserReasonFromMessages([
        msg('assistant', '等待确认：请确认后继续'),
        msg('user', '其他')
      ])
    ).toBeNull()
  })

  it('优先取更靠后的等待确认文案', () => {
    expect(
      queryAwaitUserReasonFromMessages([
        msg('assistant', '等待确认：旧原因'),
        msg('assistant', '等待确认：内容与配图已准备好')
      ])
    ).toBe('内容与配图已准备好')
  })

  it('无等待确认消息时返回 null', () => {
    expect(
      queryAwaitUserReasonFromMessages([
        msg('assistant', '正在处理'),
        msg('user', '你好')
      ])
    ).toBeNull()
  })

  it('空列表或空内容前缀时返回合理默认值', () => {
    expect(queryAwaitUserReasonFromMessages([])).toBeNull()
    expect(queryAwaitUserReasonFromMessages(null)).toBeNull()
    expect(queryAwaitUserReasonFromMessages([msg('assistant', '等待确认：')])).toBe(
      '请确认后继续'
    )
  })

  it('从 awaitMeta 解析原因与方案', () => {
    const messages: ChatMessage[] = [
      {
        id: '1',
        role: 'assistant',
        content: '等待确认：请选择渲染方案',
        awaitMeta: {
          reason: '请选择渲染方案',
          choices: [
            { id: 'render', label: '确认渲染' },
            { id: 'cancel', label: '取消' }
          ]
        },
        createdAt: Date.now()
      }
    ]
    expect(queryAwaitUserReasonFromMessages(messages)).toBe('请选择渲染方案')
    expect(queryAwaitUserChoicesFromMessages(messages)?.map((c) => c.id)).toEqual([
      'render',
      'cancel'
    ])
  })

  it('用户已选方案后不再从 awaitMeta 恢复挂起 UI', () => {
    const messages: ChatMessage[] = [
      {
        id: '1',
        role: 'assistant',
        content: '等待确认：请选制作路线',
        awaitMeta: {
          reason: '请选制作路线',
          choices: [
            { id: 'plan_a', label: '方案 A' },
            { id: 'plan_b', label: '方案 B' }
          ]
        },
        createdAt: Date.now()
      },
      msg('user', '【已选：方案 B】'),
      msg('assistant', '好的，开始获取数据')
    ]
    expect(queryAwaitUserReasonFromMessages(messages)).toBeNull()
    expect(queryAwaitUserChoicesFromMessages(messages)).toBeNull()
  })

  it('多轮 await 时只保留最后一轮未回复的挂起', () => {
    const messages: ChatMessage[] = [
      msg('assistant', '等待确认：第一轮'),
      msg('user', '继续'),
      {
        id: '2',
        role: 'assistant',
        content: '等待确认：第二轮',
        awaitMeta: { reason: '第二轮', choices: [{ id: 'x', label: '选项 X' }] },
        createdAt: Date.now()
      }
    ]
    expect(queryAwaitUserReasonFromMessages(messages)).toBe('第二轮')
  })
})
