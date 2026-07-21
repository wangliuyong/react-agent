import { describe, expect, it } from 'vitest'
import type { WorkflowAgentNode, WorkflowToolNode } from '../shared/types'
import {
  queryIoAlignmentIssues,
  queryJsonTemplateContextKeys,
  queryNodeDeclaredOutputKeys,
  queryNodeRequiredInputKeys,
  queryTemplateContextKeys,
  queryUpstreamOutputKeys
} from '../shared/workflow-node-io'

describe('workflow-node-io', () => {
  it('extracts template context keys', () => {
    expect(queryTemplateContextKeys('hello {{summary}} and {{hotTopics}}')).toEqual([
      'summary',
      'hotTopics'
    ])
  })

  it('extracts keys from args JSON', () => {
    expect(
      queryJsonTemplateContextKeys({ symbols: '{{stockCode}}', count: 10 })
    ).toEqual(['stockCode'])
  })

  it('merges explicit and inferred input keys', () => {
    const node: WorkflowAgentNode = {
      id: 'a1',
      type: 'agent',
      title: '解读',
      prompt: '根据 {{hotTopics}} 总结',
      inputKeys: ['summary']
    }
    expect(queryNodeRequiredInputKeys(node).sort()).toEqual(['hotTopics', 'summary'])
  })

  it('declares default output keys', () => {
    const tool: WorkflowToolNode = {
      id: 't1',
      type: 'tool',
      title: '拉热点',
      toolName: 'fetch_hot_topics',
      argsTemplate: {}
    }
    expect(queryNodeDeclaredOutputKeys(tool)).toEqual(['fetch_hot_topics'])
    expect(
      queryNodeDeclaredOutputKeys({ ...tool, outputKeys: ['weiboHotRaw'] })
    ).toEqual(['weiboHotRaw'])
  })

  it('detects missing upstream outputs', () => {
    const node: WorkflowAgentNode = {
      id: 'a2',
      type: 'agent',
      title: '整理',
      prompt: '{{hotTopics}}'
    }
    const issues = queryIoAlignmentIssues(node, ['summary'])
    expect(issues.missing).toEqual(['hotTopics'])
  })

  it('collects upstream output keys along canvas edges', () => {
    const leaves = [
      {
        id: 'n1',
        type: 'tool' as const,
        title: '工具',
        toolName: 'fetch_hot_topics',
        argsTemplate: {},
        outputKeys: ['hotTopics']
      },
      {
        id: 'n2',
        type: 'agent' as const,
        title: 'Agent',
        prompt: '{{hotTopics}}'
      }
    ]
    const canvas = {
      positions: {},
      edges: [{ id: 'e1', source: 'n1', target: 'n2' }]
    }
    expect(queryUpstreamOutputKeys(leaves, canvas, 'n2')).toEqual(['hotTopics'])
  })
})
