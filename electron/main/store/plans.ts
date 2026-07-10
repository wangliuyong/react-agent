import {
  readdirSync,
  readFileSync,
  writeFileSync,
  unlinkSync,
  existsSync
} from 'fs'
import { join } from 'path'
import type { PublishPlan } from '../../../shared/types'
import { getPlansDir } from './paths'

export function queryPublishPlans(): PublishPlan[] {
  const dir = getPlansDir()
  const files = readdirSync(dir).filter((f) => f.endsWith('.json'))
  const list: PublishPlan[] = []
  for (const file of files) {
    try {
      list.push(JSON.parse(readFileSync(join(dir, file), 'utf-8')) as PublishPlan)
    } catch {
      // skip corrupt
    }
  }
  return list.sort((a, b) => b.updatedAt - a.updatedAt)
}

export function queryPublishPlan(id: string): PublishPlan | null {
  const path = join(getPlansDir(), `${id}.json`)
  if (!existsSync(path)) return null
  try {
    return JSON.parse(readFileSync(path, 'utf-8')) as PublishPlan
  } catch {
    return null
  }
}

export function postPublishPlan(plan: PublishPlan): PublishPlan {
  const path = join(getPlansDir(), `${plan.id}.json`)
  writeFileSync(path, JSON.stringify(plan, null, 2), 'utf-8')
  return plan
}

export function postDeletePublishPlan(id: string): void {
  const path = join(getPlansDir(), `${id}.json`)
  if (existsSync(path)) unlinkSync(path)
}
