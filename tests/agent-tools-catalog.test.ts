import { describe, expect, it } from 'vitest'
import { queryAgentToolsCatalog } from '../electron/main/agent/tools/catalog'
import { queryRoleToolInjections } from '../electron/main/agent/graph/role-tools'
import { getAllTools } from '../electron/main/agent/tools'

describe('agent tools catalog', () => {
  it('注册表包含 query_ashare_realtime_analysis 且能抽出源码', () => {
    const catalog = queryAgentToolsCatalog()
    expect(catalog.registeredCount).toBe(getAllTools().length)
    expect(catalog.registeredCount).toBeGreaterThan(10)

    const realtime = catalog.tools.find((t) => t.name === 'query_ashare_realtime_analysis')
    expect(realtime).toBeTruthy()
    expect(realtime?.permission).toBe('safe')
    expect(realtime?.source?.relativePath).toContain('stock-tools.ts')
    expect(realtime?.sourceCode).toContain("name: 'query_ashare_realtime_analysis'")
    expect(realtime?.sourceCode).toContain('export const')
  })

  it('角色注入：general 全量，supervisor 无工具，researcher 含 A 股工具', () => {
    const injections = queryRoleToolInjections()
    const byRole = Object.fromEntries(injections.map((r) => [r.role, r]))

    expect(byRole.supervisor.mode).toBe('none')
    expect(byRole.supervisor.toolNames).toEqual([])

    expect(byRole.general.mode).toBe('all')
    expect(byRole.general.toolNames).toContain('query_ashare_realtime_analysis')

    expect(byRole.researcher.mode).toBe('whitelist')
    expect(byRole.researcher.toolNames).toContain('query_ashare_realtime_analysis')
    expect(byRole.researcher.toolNames).toContain('query_ashare_kline')
  })
})
