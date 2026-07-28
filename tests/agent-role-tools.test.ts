import { describe, expect, it, vi } from 'vitest'
import type { AgentTool } from '../electron/main/agent/tools/types'

const toolMocks = vi.hoisted(() => ({
  tools: [
    { name: 'use_skill' },
    { name: 'read_file' },
    { name: 'write_file' }
  ] as AgentTool[]
}))

vi.mock('../electron/main/agent/tools', () => ({
  getAllTools: (): AgentTool[] => toolMocks.tools
}))

import { queryToolsByWhitelist, queryToolsForRole } from '../electron/main/agent/graph/role-tools'

describe('Agent 全局工具注入', () => {
  it('显式 whitelist 参数不再裁剪，始终注入全量', () => {
    expect(queryToolsByWhitelist(['read_file']).map((tool) => tool.name)).toEqual([
      'use_skill',
      'read_file',
      'write_file'
    ])
  })

  it('未设置白名单时提供全部工具', () => {
    expect(queryToolsByWhitelist().map((tool) => tool.name)).toEqual([
      'use_skill',
      'read_file',
      'write_file'
    ])
  })

  it('业务角色拿到全量；supervisor 仍为空', () => {
    expect(queryToolsForRole('scriptwriter').map((t) => t.name)).toEqual([
      'use_skill',
      'read_file',
      'write_file'
    ])
    expect(queryToolsForRole('supervisor')).toEqual([])
  })
})
