import {
  readdirSync,
  readFileSync,
  writeFileSync,
  unlinkSync,
  existsSync
} from 'fs'
import { join } from 'path'
import type { PublishPlan } from '../../../shared/types'
import { createBuiltinPublishPlans } from '../../../shared/builtin-seeds'
import { normalizePublishPlan } from '../../../shared/publish-normalize'
import { getPlansDir } from './paths'

/** 读盘时归一化子任务 channels（兼容旧版单 channel 与中文 label） */
function normalizePlan(plan: PublishPlan): PublishPlan {
  return normalizePublishPlan(plan)
}

export function queryPublishPlans(): PublishPlan[] {
  const dir = getPlansDir()
  const files = readdirSync(dir).filter((f) => f.endsWith('.json'))
  const list: PublishPlan[] = []
  for (const file of files) {
    try {
      list.push(normalizePlan(JSON.parse(readFileSync(join(dir, file), 'utf-8')) as PublishPlan))
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
    return normalizePlan(JSON.parse(readFileSync(path, 'utf-8')) as PublishPlan)
  } catch {
    return null
  }
}

export function postPublishPlan(plan: PublishPlan): PublishPlan {
  const normalized = normalizePublishPlan(plan)
  const path = join(getPlansDir(), `${normalized.id}.json`)
  writeFileSync(path, JSON.stringify(normalized, null, 2), 'utf-8')
  return normalized
}

export function postDeletePublishPlan(id: string): void {
  const path = join(getPlansDir(), `${id}.json`)
  if (existsSync(path)) unlinkSync(path)
}

/**
 * 写：导入尚未存在的内置发布计划（按固定 id 去重）。
 * 返回导入后的完整计划列表。
 */
export function postImportBuiltinPublishPlans(): PublishPlan[] {
  const existingIds = new Set(queryPublishPlans().map((plan) => plan.id))
  for (const plan of createBuiltinPublishPlans()) {
    if (!existingIds.has(plan.id)) {
      postPublishPlan(plan)
    }
  }
  return queryPublishPlans()
}

/**
 * 写：首次启动或磁盘为空时写入内置发布计划。
 * 已有用户数据时不覆盖。
 */
export function postInitPublishPlans(): PublishPlan[] {
  if (queryPublishPlans().length > 0) {
    return queryPublishPlans()
  }
  return postImportBuiltinPublishPlans()
}
