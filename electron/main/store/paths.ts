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
  // 无头抓取使用独立 profile，避免与拟人发布抢 SingletonLock
  ensureDir(join(root, 'browser-profile-headless'))
  ensureDir(join(root, 'artifacts'))
  ensureDir(join(root, 'videos'))
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

/** 无头后台抓取专用 profile（不与有头拟人发布共用） */
export function getHeadlessBrowserProfileDir(): string {
  return join(getDataRoot(), 'browser-profile-headless')
}

export function getArtifactsDir(): string {
  return join(getDataRoot(), 'artifacts')
}

/** 视频成片与分镜素材输出目录 */
export function getVideosDir(): string {
  const dir = join(getDataRoot(), 'videos')
  ensureDir(dir)
  return dir
}

/** 技能链接导入时的临时克隆/解压目录 */
export function getSkillImportTempDir(): string {
  const dir = join(getDataRoot(), 'skill-import-tmp')
  ensureDir(dir)
  return dir
}

export function getSettingsPath(): string {
  return join(getDataRoot(), 'settings.json')
}

function ensureDir(dir: string): void {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
}
