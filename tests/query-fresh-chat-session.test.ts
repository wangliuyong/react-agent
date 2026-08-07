import { describe, expect, it } from 'vitest'
import type { Session } from '@shared/types'
import {
  queryExistingFreshChatSession,
  queryHistorySessions,
  queryPromoteSessionToFront
} from '../src/features/chat/utils/queryFreshChatSession'

function createSession(partial: Partial<Session>): Session {
  return {
    id: 's1',
    title: '新对话',
    messages: [],
    tasks: [],
    type: 'chat',
    tokenUsed: 0,
    createdAt: 0,
    updatedAt: 0,
    ...partial
  }
}

describe('queryExistingFreshChatSession', () => {
  it('无空会话时返回 undefined', () => {
    expect(
      queryExistingFreshChatSession([
        createSession({
          id: 'a',
          title: '已聊过',
          messages: [{ id: 'm1', role: 'user', content: 'hi', createdAt: 1 }] as Session['messages']
        })
      ])
    ).toBeUndefined()
  })

  it('多个空会话时取 updatedAt 最新的一条', () => {
    const older = createSession({ id: 'old', updatedAt: 10 })
    const newer = createSession({ id: 'new', updatedAt: 99 })
    expect(queryExistingFreshChatSession([older, newer])?.id).toBe('new')
  })
})

describe('queryPromoteSessionToFront', () => {
  it('将目标会话置顶并刷新 updatedAt', () => {
    const a = createSession({ id: 'a', title: '已聊', updatedAt: 1, messages: [] })
    const b = createSession({ id: 'b', updatedAt: 2 })
    const c = createSession({
      id: 'c',
      title: '历史',
      updatedAt: 3,
      messages: [{ id: 'm1', role: 'user', content: 'x', createdAt: 1 }] as Session['messages']
    })
    const next = queryPromoteSessionToFront([a, b, c], 'b', 1000)
    expect(next.map((s) => s.id)).toEqual(['b', 'a', 'c'])
    expect(next[0]?.updatedAt).toBe(1000)
  })
})

describe('queryHistorySessions', () => {
  it('排除空新对话，保留有内容的会话', () => {
    const fresh = createSession({ id: 'fresh' })
    const filled = createSession({
      id: 'filled',
      title: '天气',
      messages: [{ id: 'm1', role: 'user', content: 'hi', createdAt: 1 }] as Session['messages']
    })
    const result = queryHistorySessions([fresh, filled])
    expect(result.map((s) => s.id)).toEqual(['filled'])
  })
})
