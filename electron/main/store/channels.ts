import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import {
  DEFAULT_PUBLISH_CHANNELS,
  normalizeChannelKind,
  normalizeFeishuMsgType,
  setPublishChannelRegistry,
  type ChannelKind,
  type PublishChannelMeta,
  type PublishChannelUpsertInput
} from '../../../shared/publish-channels'
import { getDataRoot } from './paths'

function getChannelsPath(): string {
  return join(getDataRoot(), 'channels.json')
}

/** 校验渠道 id：小写、数字、连字符、下划线，1～64 字符 */
export function validateChannelId(id: string): void {
  if (!/^[a-z0-9_-]{1,64}$/.test(id)) {
    throw new Error('渠道 id 仅允许小写字母、数字、连字符和下划线，长度 1～64')
  }
}

/**
 * 将磁盘数据与内置默认渠道合并：
 * - 以默认配置为底，保留用户对内置渠道的自定义修改
 * - 新版本新增的内置渠道（如飞书通知）自动补入
 */
function mergeWithDefaults(stored: PublishChannelMeta[]): PublishChannelMeta[] {
  const byId = new Map(stored.map((c) => [c.id, c]))

  for (const def of DEFAULT_PUBLISH_CHANNELS) {
    const existing = byId.get(def.id)
    if (!existing) {
      byId.set(def.id, { ...def, updatedAt: Date.now() })
    } else {
      // 默认字段打底，用户已编辑字段覆盖（便于升级后补全新增字段）
      byId.set(def.id, {
        ...def,
        ...existing,
        kind: normalizeChannelKind(existing.kind ?? def.kind),
        isBuiltin: true,
        updatedAt: existing.updatedAt ?? Date.now()
      })
    }
  }

  return sortChannels(Array.from(byId.values()))
}

function sortChannels(channels: PublishChannelMeta[]): PublishChannelMeta[] {
  return [...channels].sort((a, b) => {
    if (a.isBuiltin !== b.isBuiltin) return a.isBuiltin ? -1 : 1
    const kindOrder = (k: ChannelKind) => (k === 'publish' ? 0 : 1)
    const ka = kindOrder(normalizeChannelKind(a.kind))
    const kb = kindOrder(normalizeChannelKind(b.kind))
    if (ka !== kb) return ka - kb
    return a.label.localeCompare(b.label, 'zh-CN')
  })
}

/** 比较归一化后的渠道列表是否一致（用于判断是否需要回写磁盘） */
function channelsEqual(a: PublishChannelMeta[], b: PublishChannelMeta[]): boolean {
  const norm = (list: PublishChannelMeta[]) =>
    sortChannels(list.map(normalizeChannel)).map((c) => JSON.stringify(c))
  const left = norm(a)
  const right = norm(b)
  return left.length === right.length && left.every((s, i) => s === right[i])
}

function normalizeChannel(raw: PublishChannelMeta): PublishChannelMeta {
  const kind = normalizeChannelKind((raw as { kind?: unknown }).kind)
  return {
    ...raw,
    id: raw.id.trim(),
    kind,
    label: raw.label.trim(),
    description: raw.description.trim(),
    // 为什么：旧数据只有 publishTool；notify 渠道不得 trim 空串导致写盘失败
    publishTool: raw.publishTool?.trim() || undefined,
    notifyTool: raw.notifyTool?.trim() || (kind === 'notify' ? 'notify_message' : undefined),
    notifyConfig:
      kind === 'notify'
        ? {
            webhookUrl: raw.notifyConfig?.webhookUrl?.trim() || undefined,
            secret: raw.notifyConfig?.secret?.trim() || undefined,
            feishuMsgType: normalizeFeishuMsgType(raw.notifyConfig?.feishuMsgType),
            feishuImageKey: raw.notifyConfig?.feishuImageKey?.trim() || undefined,
            feishuShareChatId: raw.notifyConfig?.feishuShareChatId?.trim() || undefined
          }
        : undefined,
    loginCheckUrl: raw.loginCheckUrl?.trim() || undefined,
    titleMaxLength:
      raw.titleMaxLength != null && raw.titleMaxLength > 0 ? raw.titleMaxLength : undefined,
    // 拟人操作默认关闭；旧数据缺省视为 false
    humanized: kind === 'publish' ? Boolean(raw.humanized) : undefined,
    sdkConfig:
      kind === 'publish' && raw.sdkConfig && typeof raw.sdkConfig === 'object'
        ? { ...raw.sdkConfig }
        : undefined,
    agentHint: (raw.agentHint ?? '').trim(),
    isBuiltin: raw.isBuiltin ?? DEFAULT_PUBLISH_CHANNELS.some((d) => d.id === raw.id),
    updatedAt: raw.updatedAt ?? Date.now()
  }
}

function readChannelsFromDisk(): PublishChannelMeta[] {
  const path = getChannelsPath()

  if (!existsSync(path)) {
    const seeded = mergeWithDefaults([])
    return writeChannels(seeded)
  }

  try {
    const parsed = JSON.parse(readFileSync(path, 'utf-8')) as PublishChannelMeta[]
    if (!Array.isArray(parsed)) {
      throw new Error('channels.json 格式无效')
    }
    const stored = parsed.map(normalizeChannel)
    const merged = mergeWithDefaults(stored)
    if (!channelsEqual(stored, merged)) {
      return writeChannels(merged)
    }
    setPublishChannelRegistry(merged)
    return merged
  } catch {
    const seeded = mergeWithDefaults([])
    return writeChannels(seeded)
  }
}

function writeChannels(channels: PublishChannelMeta[]): PublishChannelMeta[] {
  const normalized = channels.map(normalizeChannel)
  writeFileSync(getChannelsPath(), JSON.stringify(normalized, null, 2), 'utf-8')
  setPublishChannelRegistry(normalized)
  return normalized
}

/** 主进程启动时初始化渠道注册表（须在 IPC 注册前调用） */
export function initPublishChannelRegistry(): void {
  readChannelsFromDisk()
}

/** 读：全部渠道（发布 + 通知） */
export function queryPublishChannels(): PublishChannelMeta[] {
  return readChannelsFromDisk()
}

/**
 * 写：初始化/恢复内置渠道为最新默认配置。
 * 自定义渠道保留不变；用于首次升级或手动「恢复内置」。
 */
export function postInitPublishChannels(): PublishChannelMeta[] {
  const channels = readChannelsFromDisk()
  const custom = channels.filter(
    (c) => !DEFAULT_PUBLISH_CHANNELS.some((d) => d.id === c.id)
  )
  return writeChannels(mergeWithDefaults(custom))
}

/** 写：新增或更新渠道（内置渠道不可改 id；创建后不可改 kind） */
export function postPublishChannel(input: PublishChannelUpsertInput): PublishChannelMeta {
  validateChannelId(input.id)
  const channels = readChannelsFromDisk()
  const now = Date.now()
  const existing = channels.find((c) => c.id === input.id)
  const isBuiltin = existing?.isBuiltin ?? DEFAULT_PUBLISH_CHANNELS.some((d) => d.id === input.id)
  const kind = normalizeChannelKind(input.kind)

  if (!input.label.trim()) throw new Error('渠道名称不能为空')
  if (kind === 'publish') {
    if (!input.publishTool?.trim()) throw new Error('发布工具名不能为空')
  } else if (!input.notifyTool?.trim()) {
    throw new Error('通知工具名不能为空')
  }

  // 为什么：类型变更会破坏工作台绑定与工具路由，创建后锁定
  if (existing && normalizeChannelKind(existing.kind) !== kind) {
    throw new Error('渠道类型创建后不可修改')
  }

  const next: PublishChannelMeta = normalizeChannel({
    id: input.id,
    kind,
    label: input.label,
    description: input.description,
    enabled: input.enabled,
    publishTool: input.publishTool,
    titleMaxLength: input.titleMaxLength,
    loginCheckUrl: input.loginCheckUrl,
    humanized: input.humanized,
    sdkConfig: input.sdkConfig,
    notifyTool: input.notifyTool,
    notifyConfig: input.notifyConfig,
    agentHint: input.agentHint,
    isBuiltin,
    updatedAt: now
  })

  const idx = channels.findIndex((c) => c.id === input.id)
  const merged =
    idx >= 0 ? channels.map((c, i) => (i === idx ? next : c)) : [...channels, next]

  writeChannels(merged)
  return next
}

/** 写：删除自定义渠道（内置渠道不可删） */
export function postDeletePublishChannel(id: string): void {
  const channels = readChannelsFromDisk()
  const target = channels.find((c) => c.id === id)
  if (!target) return
  if (target.isBuiltin) {
    throw new Error('内置渠道不可删除')
  }
  writeChannels(channels.filter((c) => c.id !== id))
}
