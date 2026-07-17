import { describe, expect, it, beforeEach } from 'vitest'
import {
  postRegisterBrowserPublishAdapter,
  queryPublishAdapter
} from '../electron/main/publish/adapter'

describe('queryPublishAdapter', () => {
  beforeEach(() => {
    postRegisterBrowserPublishAdapter('xhs', () => ({
      id: 'browser-humanized',
      async publish() {
        return 'browser-published'
      }
    }))
  })

  it('拟人开启时走浏览器适配器', async () => {
    const adapter = queryPublishAdapter('xhs', true)
    expect(adapter.id).toBe('browser-humanized')
    await expect(
      adapter.publish({ title: 't', content: 'c' })
    ).resolves.toBe('browser-published')
  })

  it('拟人关闭且无 SDK 时返回占位提示', async () => {
    const adapter = queryPublishAdapter('xhs', false)
    expect(adapter.id).toBe('sdk')
    const msg = await adapter.publish({ title: 't', content: 'c' })
    expect(msg).toContain('官方 SDK 发布尚未接入')
    expect(msg).toContain('拟人操作')
  })
})
