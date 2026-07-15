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

import { queryToolsByWhitelist } from '../electron/main/agent/graph/role-tools'

describe('工作流工具白名单', () => {
  it('显式白名单未授权时不提供 use_skill', () => {
    expect(queryToolsByWhitelist(['read_file']).map((tool) => tool.name)).toEqual(['read_file'])
  })

  it('未设置白名单时提供全部工具', () => {
    expect(queryToolsByWhitelist().map((tool) => tool.name)).toEqual([
      'use_skill',
      'read_file',
      'write_file'
    ])
  })
})
