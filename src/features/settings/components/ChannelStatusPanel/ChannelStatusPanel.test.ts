import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const componentSource = readFileSync(
  new URL('./ChannelStatusPanel.tsx', import.meta.url),
  'utf8'
)

describe('设置页渠道状态检测', () => {
  it('进入设置页时不自动检测登录态', () => {
    // 自动检测会启动浏览器并产生明显耗时；设置页只允许用户通过按钮主动触发。
    expect(componentSource).not.toContain('void refreshStatuses()\n  }, [channels.length')
    expect(componentSource).toContain("return { label: '未检测', color: 'muted' }")
  })
})
