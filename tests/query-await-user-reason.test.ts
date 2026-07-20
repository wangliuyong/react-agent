import { describe, expect, it } from 'vitest'
import type { ChatMessage } from '@shared/types'
import { queryAwaitUserReasonFromMessages } from '../src/features/chat/utils/queryAwaitUserReasonFromMessages'

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
        msg('assistant', '等待确认：请确认后继续'),
        msg('user', '其他')
      ])
    ).toBe('请确认后继续')
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
})
