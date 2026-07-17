import {
  DEFAULT_CONNECTION,
  DEFAULT_CONNECTION_ID,
  DEFAULT_SETTINGS,
  queryMergeDefaultRoleModelMap,
  querySeedDefaultConnections,
  type AppSettings,
  type ModelCapability,
  type ModelConnection,
  type ModelProvider,
  type RoleModelMap
} from '../../../shared/types'
import { postLaunchAtLogin } from './launch-at-login'
import { getSettingsPath } from './paths'
import { readFileSync, writeFileSync, existsSync } from 'fs'

function queryNormalizeProvider(raw: unknown, baseUrl: string): ModelProvider {
  if (raw === 'deepseek' || raw === 'dashscope' || raw === 'openai_compatible') {
    return raw
  }
  if (String(baseUrl).includes('api.deepseek.com')) return 'deepseek'
  return DEFAULT_SETTINGS.provider
}

function queryNormalizeConnection(raw: unknown, index: number): ModelConnection | null {
  if (!raw || typeof raw !== 'object') return null
  const row = raw as Record<string, unknown>
  const id = String(row.id ?? `conn-${index}`).trim() || `conn-${index}`
  const provider = queryNormalizeProvider(row.provider, String(row.baseUrl ?? ''))
  const capabilities = Array.isArray(row.capabilities)
    ? (row.capabilities as unknown[])
        .map(String)
        .filter((c): c is ModelCapability =>
          ['chat', 'reasoning', 'vision', 'longContext', 'creative'].includes(c)
        )
    : (['chat'] as ModelCapability[])
  return {
    id,
    label: String(row.label ?? `连接 ${index + 1}`).trim() || `连接 ${index + 1}`,
    provider,
    apiKey: String(row.apiKey ?? ''),
    baseUrl: String(row.baseUrl ?? ''),
    model: String(row.model ?? 'qwen-plus'),
    capabilities: capabilities.length ? capabilities : ['chat']
  }
}

/**
 * 将旧单模型字段迁移为 connections[0]。
 * 为什么：升级后保留用户已填 Key，避免设置页空白。
 */
function queryMigrateLegacyConnections(
  raw: Partial<AppSettings> & Record<string, unknown>
): ModelConnection[] {
  const fromList = Array.isArray(raw.connections)
    ? (raw.connections as unknown[])
        .map((item, i) => queryNormalizeConnection(item, i))
        .filter((c): c is ModelConnection => Boolean(c))
    : []

  if (fromList.length > 0) return fromList

  const provider = queryNormalizeProvider(raw.provider, String(raw.baseUrl ?? ''))
  return [
    {
      ...DEFAULT_CONNECTION,
      id: DEFAULT_CONNECTION_ID,
      label: provider === 'deepseek' ? '默认（DeepSeek）' : '默认（阿里云百炼）',
      provider,
      apiKey: String(raw.apiKey ?? ''),
      baseUrl: String(raw.baseUrl ?? DEFAULT_CONNECTION.baseUrl),
      model: String(raw.model ?? DEFAULT_CONNECTION.model),
      capabilities: ['chat', 'reasoning', 'creative']
    }
  ]
}

/**
 * 合并默认值、迁移多连接字段并剥离已废弃字段。
 * 首次/仅单连接用户会幂等补齐默认连接套装与角色映射，用户已改项优先保留。
 */
export function normalizeSettings(
  raw: Partial<AppSettings> & Record<string, unknown>
): AppSettings {
  const merged = { ...DEFAULT_SETTINGS, ...raw }
  delete (merged as Record<string, unknown>).agentRuntime

  const connections = querySeedDefaultConnections(queryMigrateLegacyConnections(raw))
  const defaultConnectionId =
    String(raw.defaultConnectionId ?? '').trim() ||
    connections[0]?.id ||
    DEFAULT_CONNECTION_ID

  const connectionIds = new Set(connections.map((c) => c.id))
  const primary =
    connections.find((c) => c.id === defaultConnectionId) ?? connections[0] ?? DEFAULT_CONNECTION

  const rawRoleMap: RoleModelMap =
    raw.roleModelMap && typeof raw.roleModelMap === 'object'
      ? { ...(raw.roleModelMap as RoleModelMap) }
      : {}
  const roleModelMap = queryMergeDefaultRoleModelMap(
    rawRoleMap,
    connectionIds,
    primary.id
  )

  return {
    provider: primary.provider,
    apiKey: primary.apiKey,
    baseUrl: primary.baseUrl,
    model: primary.model,
    connections,
    defaultConnectionId: primary.id,
    roleModelMap,
    fullAccess: Boolean(merged.fullAccess),
    maxTurns: Number(merged.maxTurns) || DEFAULT_SETTINGS.maxTurns,
    launchAtLogin: Boolean(merged.launchAtLogin)
  }
}

/** 仅读盘，不创建文件；避免与 postSettings 互相递归 */
function readSettingsFile(): AppSettings {
  const path = getSettingsPath()
  if (!existsSync(path)) {
    return normalizeSettings({ ...DEFAULT_SETTINGS })
  }
  try {
    const raw = JSON.parse(readFileSync(path, 'utf-8')) as Partial<AppSettings> &
      Record<string, unknown>
    return normalizeSettings(raw)
  } catch {
    return normalizeSettings({ ...DEFAULT_SETTINGS })
  }
}

/** 读取本地设置；文件不存在时写入默认值后返回 */
export function querySettings(): AppSettings {
  const path = getSettingsPath()
  if (!existsSync(path)) {
    const initial = normalizeSettings({ ...DEFAULT_SETTINGS })
    writeFileSync(path, JSON.stringify(initial, null, 2), 'utf-8')
    return initial
  }
  return readSettingsFile()
}

export function postSettings(partial: Partial<AppSettings>): AppSettings {
  const current = readSettingsFile()
  // 若只改了顶层 apiKey/model，同步回写默认连接
  const nextPartial: Partial<AppSettings> & Record<string, unknown> = { ...current, ...partial }
  if (
    (partial.apiKey != null ||
      partial.baseUrl != null ||
      partial.model != null ||
      partial.provider != null) &&
    !partial.connections
  ) {
    const connections = current.connections.map((c) => ({ ...c }))
    const idx = connections.findIndex((c) => c.id === current.defaultConnectionId)
    const target = idx >= 0 ? idx : 0
    const primary = connections[target]
    if (primary) {
      const prevKey = primary.apiKey
      const nextProvider = partial.provider ?? primary.provider
      const nextKey = partial.apiKey ?? primary.apiKey
      const nextBase = partial.baseUrl ?? primary.baseUrl
      connections[target] = {
        ...primary,
        provider: nextProvider,
        apiKey: nextKey,
        baseUrl: nextBase,
        model: partial.model ?? primary.model
      }

      // 默认套装里同供应商的空 Key / 旧 Key 兄弟连接一并更新，免得到处重填
      if (partial.apiKey != null || partial.baseUrl != null || partial.provider != null) {
        for (let i = 0; i < connections.length; i++) {
          if (i === target) continue
          const row = connections[i]
          const sameProvider = row.provider === nextProvider
          const shareableKey = !row.apiKey.trim() || row.apiKey === prevKey
          if (sameProvider && shareableKey) {
            connections[i] = {
              ...row,
              apiKey: nextKey,
              baseUrl: partial.baseUrl != null ? nextBase : row.baseUrl,
              provider: nextProvider
            }
          }
        }
      }
      nextPartial.connections = connections
    }
  }
  const next = normalizeSettings(nextPartial)
  writeFileSync(getSettingsPath(), JSON.stringify(next, null, 2), 'utf-8')
  postLaunchAtLogin(next.launchAtLogin)
  return next
}
