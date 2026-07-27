import {
  DEFAULT_CONNECTION,
  DEFAULT_CONNECTION_ID,
  DEFAULT_SETTINGS,
  queryMergeDefaultRoleModelMap,
  queryMergeDefaultRolePromptOverrides,
  queryNormalizeCustomProviders,
  queryNormalizeProviderModelCatalog,
  queryNormalizeRoleToolWhitelistOverrides,
  queryProviderOption,
  querySeedDefaultConnections,
  querySyncConnectionsProviderCredentials,
  querySyncTopLevelModelToConnections,
  type AppSettings,
  type CustomModelProvider,
  type ModelCapability,
  type ModelConnection,
  type ModelProvider,
  type RoleModelMap,
  type RolePromptOverrides
} from '../../../shared/types'
import { queryNormalizeCustomAgentRoles } from '../../../shared/agent-role-registry'
import { postLaunchAtLogin } from './launch-at-login'
import { getSettingsPath } from './paths'
import { readFileSync, writeFileSync, existsSync } from 'fs'

function queryNormalizeProvider(
  raw: unknown,
  baseUrl: string,
  customProviders: CustomModelProvider[]
): ModelProvider {
  if (
    raw === 'deepseek' ||
    raw === 'dashscope' ||
    raw === 'ofox' ||
    raw === 'openai_compatible'
  ) {
    return raw
  }
  const id = String(raw ?? '').trim()
  if (id.startsWith('custom:') && customProviders.some((item) => item.id === id)) {
    return id as ModelProvider
  }
  if (String(baseUrl).includes('api.deepseek.com')) return 'deepseek'
  if (String(baseUrl).includes('api.ofox.io')) return 'ofox'
  return DEFAULT_SETTINGS.provider
}

function queryNormalizeConnection(
  raw: unknown,
  index: number,
  customProviders: CustomModelProvider[]
): ModelConnection | null {
  if (!raw || typeof raw !== 'object') return null
  const row = raw as Record<string, unknown>
  const id = String(row.id ?? `conn-${index}`).trim() || `conn-${index}`
  const provider = queryNormalizeProvider(row.provider, String(row.baseUrl ?? ''), customProviders)
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
  raw: Partial<AppSettings> & Record<string, unknown>,
  customProviders: CustomModelProvider[]
): ModelConnection[] {
  const fromList = Array.isArray(raw.connections)
    ? (raw.connections as unknown[])
        .map((item, i) => queryNormalizeConnection(item, i, customProviders))
        .filter((c): c is ModelConnection => Boolean(c))
    : []

  if (fromList.length > 0) {
    // 多连接结构下仍可能遗留顶层 apiKey；按 provider 回填空 Key 连接
    const legacyKey = String(raw.apiKey ?? '').trim()
    const legacyProvider = queryNormalizeProvider(
      raw.provider,
      String(raw.baseUrl ?? ''),
      customProviders
    )
    if (!legacyKey) return fromList
    return fromList.map((conn) => {
      if (conn.apiKey.trim()) return conn
      if (conn.provider === legacyProvider) {
        return { ...conn, apiKey: legacyKey }
      }
      return conn
    })
  }

  const provider = queryNormalizeProvider(
    raw.provider,
    String(raw.baseUrl ?? ''),
    customProviders
  )
  return [
    {
      ...DEFAULT_CONNECTION,
      id: DEFAULT_CONNECTION_ID,
      label:
        provider === 'deepseek'
          ? '默认（DeepSeek）'
          : provider === 'ofox'
            ? '默认（OfoxAI）'
            : '默认（阿里云百炼）',
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

  const customProviders = queryNormalizeCustomProviders(raw.customProviders)
  const connections = querySeedDefaultConnections(
    queryMigrateLegacyConnections(raw, customProviders)
  )
  const defaultConnectionId =
    String(raw.defaultConnectionId ?? '').trim() ||
    connections[0]?.id ||
    DEFAULT_CONNECTION_ID

  const connectionIds = new Set(connections.map((c) => c.id))
  const primary =
    connections.find((c) => c.id === defaultConnectionId) ?? connections[0] ?? DEFAULT_CONNECTION

  // 顶层「模型与 API」字段与默认连接可独立；未显式传 provider 时从默认连接/迁移结果推断
  const topProvider =
    'provider' in raw && raw.provider != null
      ? queryNormalizeProvider(
          raw.provider,
          String(merged.baseUrl ?? ''),
          customProviders
        )
      : primary.provider
  const topProviderMeta = queryProviderOption(topProvider, customProviders)
  const topApiKey = String(merged.apiKey ?? '')
  const topBaseUrl = String(merged.baseUrl || topProviderMeta.defaultBaseUrl)
  const topModel = String(merged.model || topProviderMeta.defaultModel)

  const rawRoleMap: RoleModelMap =
    raw.roleModelMap && typeof raw.roleModelMap === 'object'
      ? { ...(raw.roleModelMap as RoleModelMap) }
      : {}
  const roleModelMap = queryMergeDefaultRoleModelMap(
    rawRoleMap,
    connectionIds,
    primary.id
  )

  const rolePromptOverrides = queryMergeDefaultRolePromptOverrides(
    raw.rolePromptOverrides && typeof raw.rolePromptOverrides === 'object'
      ? (raw.rolePromptOverrides as RolePromptOverrides)
      : undefined
  )

  const roleToolWhitelistOverrides = queryNormalizeRoleToolWhitelistOverrides(
    raw.roleToolWhitelistOverrides
  )

  const customAgentRoles = queryNormalizeCustomAgentRoles(raw.customAgentRoles)

  const draftForSync: AppSettings = {
    ...merged,
    provider: topProvider,
    apiKey: topApiKey,
    baseUrl: topBaseUrl,
    model: topModel,
    connections,
    defaultConnectionId: primary.id,
    roleModelMap,
    rolePromptOverrides,
    roleToolWhitelistOverrides,
    customAgentRoles,
    customProviders
  }
  const syncedConnections = querySyncConnectionsProviderCredentials(connections, draftForSync)

  return {
    provider: topProvider,
    apiKey: topApiKey,
    baseUrl: topBaseUrl,
    model: topModel,
    connections: syncedConnections,
    defaultConnectionId: primary.id,
    roleModelMap,
    rolePromptOverrides,
    roleToolWhitelistOverrides,
    customAgentRoles,
    fullAccess: Boolean(merged.fullAccess),
    thinkingEnabled: Boolean(merged.thinkingEnabled),
    maxTurns: Number(merged.maxTurns) || DEFAULT_SETTINGS.maxTurns,
    launchAtLogin: Boolean(merged.launchAtLogin),
    customProviders,
    providerModelCatalog: queryNormalizeProviderModelCatalog(raw.providerModelCatalog)
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
  const nextPartial: Partial<AppSettings> & Record<string, unknown> = { ...current, ...partial }

  // 保存多模型连接时，按供应商统一 API Key；顶层「当前选用」字段由模型与 API 面板维护
  if (partial.connections) {
    const synced = querySyncConnectionsProviderCredentials(partial.connections, {
      ...current,
      ...partial,
      connections: partial.connections
    })
    nextPartial.connections = synced
    // 模型与 API 面板会同时提交 connections 与顶层 provider/apiKey，显式保留避免归一化时被默认连接推断覆盖
    if (partial.provider != null) nextPartial.provider = partial.provider
    if (partial.apiKey != null) nextPartial.apiKey = partial.apiKey
    if (partial.baseUrl != null) nextPartial.baseUrl = partial.baseUrl
    if (partial.model != null) nextPartial.model = partial.model
    const defaultId =
      String(partial.defaultConnectionId ?? current.defaultConnectionId).trim() ||
      synced[0]?.id ||
      DEFAULT_CONNECTION_ID
    const primary = synced.find((c) => c.id === defaultId) ?? synced[0]
    if (primary) {
      // 仅保证 defaultConnectionId 有效；顶层 provider/apiKey/baseUrl/model 由「模型与 API」面板维护，
      // 避免保存连接时把「当前选用」冲回默认连接的供应商
      if (partial.defaultConnectionId == null) {
        nextPartial.defaultConnectionId = primary.id
      }
    }
  }

  // 若只改了顶层 provider / 凭证 / model，校正默认连接与错位的内置聊天连接
  if (
    (partial.apiKey != null ||
      partial.baseUrl != null ||
      partial.model != null ||
      partial.provider != null) &&
    !partial.connections
  ) {
    const synced = querySyncTopLevelModelToConnections(current, partial)
    nextPartial.model = synced.model
    nextPartial.connections = synced.connections
    nextPartial.defaultConnectionId = synced.defaultConnectionId
    if (partial.provider != null) {
      nextPartial.provider = synced.provider
    }
  }
  const next = normalizeSettings(nextPartial)
  writeFileSync(getSettingsPath(), JSON.stringify(next, null, 2), 'utf-8')
  postLaunchAtLogin(next.launchAtLogin)
  return next
}
