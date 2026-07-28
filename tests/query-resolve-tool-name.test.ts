import { describe, expect, it } from 'vitest'
import {
  queryLevenshteinDistance,
  queryNormalizeToolName,
  queryResolveToolName,
  queryToolNameSimilarity
} from '../electron/main/agent/tools/query-resolve-tool-name'
import { getAllTools, getToolByName, postWarmAgentTools } from '../electron/main/agent/tools'
import { queryToolsByWhitelist, queryToolsForRole } from '../electron/main/agent/graph/role-tools'

const CANDIDATES = [
  'fetch_hot_topics',
  'query_weather',
  'browser_navigate',
  'remotion_render'
] as const

describe('queryResolveToolName 模糊匹配', () => {
  it('归一化大小写与分隔符', () => {
    expect(queryNormalizeToolName('Fetch-Hot Topics')).toBe('fetch_hot_topics')
  })

  it('精确命中（含归一化）', () => {
    const hit = queryResolveToolName('Fetch_Hot_Topics', CANDIDATES)
    expect(hit).toMatchObject({ name: 'fetch_hot_topics', exact: true, similarity: 1 })
  })

  it('少一个字母仍 ≥90% 命中', () => {
    // fetch_hot_topic vs fetch_hot_topics → 15/16 ≈ 0.9375
    const hit = queryResolveToolName('fetch_hot_topic', CANDIDATES)
    expect(hit?.name).toBe('fetch_hot_topics')
    expect(hit?.exact).toBe(false)
    expect(hit!.similarity).toBeGreaterThanOrEqual(0.9)
  })

  it('差异过大不命中', () => {
    expect(queryResolveToolName('fetch_hot', CANDIDATES)).toBeUndefined()
    expect(queryResolveToolName('totally_unknown_tool', CANDIDATES)).toBeUndefined()
  })

  it('相似度与编辑距离公式一致', () => {
    expect(queryLevenshteinDistance('kitten', 'sitting')).toBe(3)
    expect(queryToolNameSimilarity('ab', 'ab')).toBe(1)
    expect(queryToolNameSimilarity('a', 'b')).toBe(0)
  })
})

describe('全局工具注入', () => {
  it('启动预热后 getAllTools 有缓存且非空', () => {
    const n = postWarmAgentTools()
    expect(n).toBeGreaterThan(10)
    expect(getAllTools().length).toBe(n)
  })

  it('各业务角色运行时拿到全量工具（不再按白名单裁剪）', () => {
    const allNames = new Set(getAllTools().map((t) => t.name))
    for (const role of [
      'general',
      'researcher',
      'writer',
      'publisher',
      'scriptwriter',
      'videographer',
      'editor'
    ] as const) {
      const tools = queryToolsForRole(role)
      expect(tools.map((t) => t.name).sort()).toEqual(Array.from(allNames).sort())
    }
    expect(queryToolsForRole('supervisor')).toEqual([])
  })

  it('工作流 whitelist 参数不再裁剪运行时工具', () => {
    const all = getAllTools()
    expect(queryToolsByWhitelist(['query_weather']).length).toBe(all.length)
  })

  it('getToolByName 支持模糊命中', () => {
    expect(getToolByName('fetch_hot_topics')?.name).toBe('fetch_hot_topics')
    expect(getToolByName('fetch_hot_topic')?.name).toBe('fetch_hot_topics')
    expect(getToolByName('no_such_tool_zzzz')).toBeUndefined()
  })
})
