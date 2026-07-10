import { readFileSync, writeFileSync, existsSync } from 'fs'
import { DEFAULT_SETTINGS, type AppSettings } from '../../../shared/types'
import { getSettingsPath } from './paths'

/** 仅读盘，不创建文件；避免与 postSettings 互相递归 */
function readSettingsFile(): AppSettings {
  const path = getSettingsPath()
  if (!existsSync(path)) {
    return { ...DEFAULT_SETTINGS }
  }
  try {
    const raw = JSON.parse(readFileSync(path, 'utf-8')) as Partial<AppSettings>
    return { ...DEFAULT_SETTINGS, ...raw }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

/** 读取本地设置；文件不存在时写入默认值后返回 */
export function querySettings(): AppSettings {
  const path = getSettingsPath()
  if (!existsSync(path)) {
    // 直接写盘，不要走 postSettings（其内部会再 query，造成死递归）
    writeFileSync(path, JSON.stringify(DEFAULT_SETTINGS, null, 2), 'utf-8')
    return { ...DEFAULT_SETTINGS }
  }
  return readSettingsFile()
}

export function postSettings(partial: Partial<AppSettings>): AppSettings {
  const next = { ...readSettingsFile(), ...partial }
  writeFileSync(getSettingsPath(), JSON.stringify(next, null, 2), 'utf-8')
  return next
}
