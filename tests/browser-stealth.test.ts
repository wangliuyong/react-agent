import { describe, expect, it } from 'vitest'
import {
  CHROMIUM_STEALTH_IGNORE_DEFAULT_ARGS,
  CHROMIUM_STEALTH_LAUNCH_ARGS
} from '../electron/main/browser/browser-stealth'

describe('browser-stealth launch config', () => {
  it('剔除 enable-automation 并关闭 AutomationControlled', () => {
    expect(CHROMIUM_STEALTH_IGNORE_DEFAULT_ARGS).toContain('--enable-automation')
    expect(CHROMIUM_STEALTH_LAUNCH_ARGS.join(' ')).toContain('AutomationControlled')
  })
})
