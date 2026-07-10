import { existsSync, unlinkSync, lstatSync, readlinkSync } from 'fs'
import { join } from 'path'
import { execSync } from 'child_process'
import { getBrowserProfileDir } from '../store/paths'

/** Chromium 用于互斥的锁/会话标记；异常退出后残留会导致「正在现有的浏览器会话中打开」 */
const LOCK_FILES = [
  'SingletonLock',
  'SingletonCookie',
  'SingletonSocket',
  'RunningChromeVersion'
] as const

/**
 * Chromium 持久化 Profile 被占用时会打印「正在现有的浏览器会话中打开」并立刻退出。
 * 启动前清理残留进程与 Singleton* 锁文件，避免用户手动 pkill / rm。
 */
export function releaseBrowserProfileLock(profileDir = getBrowserProfileDir()): void {
  killStaleChromeForTesting(profileDir)
  removeSingletonLocks(profileDir)
}

function removeSingletonLocks(profileDir: string): void {
  for (const name of LOCK_FILES) {
    const p = join(profileDir, name)
    try {
      if (!existsSync(p)) continue
      // SingletonLock 在 macOS 上常为指向 hostname-pid 的符号链接
      if (lstatSync(p).isSymbolicLink()) {
        try {
          readlinkSync(p)
        } catch {
          // ignore broken link read
        }
      }
      unlinkSync(p)
      console.info(`[browser] removed profile lock: ${name}`)
    } catch (err) {
      console.warn(`[browser] failed to remove ${name}:`, err)
    }
  }
}

/**
 * 仅杀掉占用本应用 browser-profile 的 Chrome for Testing，
 * 避免误杀用户日常使用的 Google Chrome。
 */
function killStaleChromeForTesting(profileDir: string): void {
  if (process.platform === 'win32') {
    try {
      execSync(
        'taskkill /F /IM "Google Chrome for Testing.exe" /T',
        { stdio: 'ignore' }
      )
    } catch {
      // 没有进程时 taskkill 非 0，可忽略
    }
    return
  }

  try {
    // 用 profile 路径精确匹配，防止误杀其它 Playwright 实例
    const escaped = profileDir.replace(/'/g, "'\\''")
    execSync(
      `pgrep -f 'Google Chrome for Testing.*${escaped}' | xargs kill -9 2>/dev/null || true`,
      { stdio: 'ignore', shell: '/bin/bash' }
    )
    // 兜底：仍有残留时按进程名清理 Testing 浏览器（不含日常 Chrome）
    execSync(`pkill -9 -f 'Google Chrome for Testing' 2>/dev/null || true`, {
      stdio: 'ignore',
      shell: '/bin/bash'
    })
  } catch {
    // ignore
  }
}

export function isProfileLockError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err)
  return (
    /Target page, context or browser has been closed/i.test(msg) ||
    /正在现有的浏览器会话中打开/i.test(msg) ||
    /browser has been closed/i.test(msg) ||
    /SingletonLock/i.test(msg)
  )
}
