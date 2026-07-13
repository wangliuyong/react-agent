import { app } from 'electron'
import { join } from 'path'
import { mkdirSync, existsSync } from 'fs'

/**
 * 本地缓存根目录（无数据库，全部落盘到 userData）。
 * 结构：
 *   settings.json
 *   sessions/
 *   publish-plans/
 *   browser-profile/
 *   artifacts/
 */
export function getDataRoot(): string {
  const root = join(app.getPath('userData'), 'react-agent-data')
  ensureDir(root)
  ensureDir(join(root, 'sessions'))
  ensureDir(join(root, 'publish-plans'))
  ensureDir(join(root, 'scheduled-tasks'))
  ensureDir(join(root, 'browser-profile'))
  ensureDir(join(root, 'artifacts'))
  return root
}

export function getSessionsDir(): string {
  return join(getDataRoot(), 'sessions')
}

export function getPlansDir(): string {
  return join(getDataRoot(), 'publish-plans')
}

export function getSchedulesDir(): string {
  return join(getDataRoot(), 'scheduled-tasks')
}

export function getBrowserProfileDir(): string {
  return join(getDataRoot(), 'browser-profile')
}

export function getArtifactsDir(): string {
  return join(getDataRoot(), 'artifacts')
}

export function getSettingsPath(): string {
  return join(getDataRoot(), 'settings.json')
}

function ensureDir(dir: string): void {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
}
