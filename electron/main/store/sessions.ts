import {
  readdirSync,
  readFileSync,
  writeFileSync,
  unlinkSync,
  existsSync
} from 'fs'
import { join } from 'path'
import type { Session } from '../../../shared/types'
import { getSessionsDir } from './paths'

export function querySessions(): Session[] {
  const dir = getSessionsDir()
  const files = readdirSync(dir).filter((f) => f.endsWith('.json'))
  const list: Session[] = []
  for (const file of files) {
    try {
      const raw = JSON.parse(readFileSync(join(dir, file), 'utf-8')) as Session
      list.push(raw)
    } catch {
      // 损坏文件跳过，避免拖垮列表
    }
  }
  return list.sort((a, b) => b.updatedAt - a.updatedAt)
}

export function querySession(id: string): Session | null {
  const path = join(getSessionsDir(), `${id}.json`)
  if (!existsSync(path)) return null
  try {
    return JSON.parse(readFileSync(path, 'utf-8')) as Session
  } catch {
    return null
  }
}

export function postSession(session: Session): Session {
  const path = join(getSessionsDir(), `${session.id}.json`)
  writeFileSync(path, JSON.stringify(session, null, 2), 'utf-8')
  return session
}

export function postDeleteSession(id: string): void {
  const path = join(getSessionsDir(), `${id}.json`)
  if (existsSync(path)) unlinkSync(path)
}
