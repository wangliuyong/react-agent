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
    expect(realtime?.usageGuide).toContain('功能说明')
    expect(realtime?.usageGuide).toContain(realtime!.description)
  })

  it('角色注入：general 全量，supervisor 无工具，researcher 含 A 股工具', () => {
    const injections = queryRoleToolInjections({})
    const byRole = Object.fromEntries(injections.map((r) => [r.role, r]))

    expect(byRole.supervisor.mode).toBe('none')
    expect(byRole.supervisor.toolNames).toEqual([])

    expect(byRole.general.mode).toBe('all')
    expect(byRole.general.toolNames).toContain('query_ashare_realtime_analysis')
    expect(byRole.general.customized).toBe(false)

    expect(byRole.researcher.mode).toBe('whitelist')
    expect(byRole.researcher.toolNames).toContain('query_ashare_realtime_analysis')
    expect(byRole.researcher.toolNames).toContain('query_ashare_kline')
    expect(byRole.scriptwriter.toolNames).toContain('query_web_data')
  })

  it('用户覆盖可把 scriptwriter 设为全量或收紧名单', () => {
    const all = queryRoleToolInjections({ scriptwriter: null })
    const scriptAll = all.find((r) => r.role === 'scriptwriter')
    expect(scriptAll?.mode).toBe('all')
    expect(scriptAll?.customized).toBe(true)

    const tight = queryRoleToolInjections({
      scriptwriter: ['query_web_data', 'update_task_list']
    })
    const scriptTight = tight.find((r) => r.role === 'scriptwriter')
    expect(scriptTight?.mode).toBe('whitelist')
    expect(scriptTight?.toolNames).toEqual(['query_web_data', 'update_task_list'])
  })

  it('query_weather / notify_message 使用说明含调用示例与参数', () => {
    const catalog = queryAgentToolsCatalog()
    const weather = catalog.tools.find((t) => t.name === 'query_weather')
    const notify = catalog.tools.find((t) => t.name === 'notify_message')
    expect(weather?.usageGuide).toContain('"city": "合肥"')
    expect(weather?.usageGuide).toContain('notify_message')
    expect(notify?.usageGuide).toContain('channelId')
    expect(notify?.usageGuide).toContain('msgType')
    expect(notify?.usageGuide).toContain('模板 B')
    expect(notify?.usageGuide).toContain('query_weather')
  })
})
