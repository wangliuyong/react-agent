import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const componentSource = readFileSync(
  new URL(
    '../src/features/channels/components/ChannelsPanel/ChannelsPanel.tsx',
    import.meta.url
  ),
  'utf8'
)

describe('设置页渠道面板登录态检测', () => {
  it('进入设置渠道 Tab 时不自动检测登录态', () => {
    // 自动检测会启动浏览器并产生明显耗时；仅允许用户通过按钮主动触发。
    expect(componentSource).not.toContain('void refreshStatuses()\n  }, [hydrate]')
    expect(componentSource).toContain('// 为什么：不在进入页面时自动检测')
  })
})
