import { describe, expect, it } from 'vitest'
import {
  queryFormatToolArgsExampleJson,
  queryFormatToolContextPreviewJson,
  queryToolArgsExample,
  queryToolContextExample,
  queryToolContextInputKeys,
  queryToolContextPreview
} from '../src/features/workflows/utils/queryToolArgsExample'

describe('queryToolArgsExample', () => {
  it('returns empty object for blank or unknown tool', () => {
    expect(queryToolArgsExample('')).toEqual({})
    expect(queryToolArgsExample('   ')).toEqual({})
    expect(queryToolArgsExample('not_a_real_tool')).toEqual({})
  })

  it('returns fetch_hot_topics example with source and maxCount', () => {
    expect(queryToolArgsExample('fetch_hot_topics')).toEqual({
      source: 'tophub',
      maxCount: 20
    })
  })

  it('returns list_attachments as empty object', () => {
    expect(queryToolArgsExample('list_attachments')).toEqual({})
  })

  it('returns publish examples with {{contextKey}} placeholders', () => {
    expect(queryToolArgsExample('xhs_publish_note')).toMatchObject({
      title: '{{summary}}',
      content: '{{summary}}',
      publishType: 'image'
    })
    expect(queryToolArgsExample('notify_message')).toMatchObject({
      channelId: 'feishu',
      content: '{{summary}}'
    })
  })

  it('formats pretty JSON for the form field', () => {
    expect(queryFormatToolArgsExampleJson('fetch_hot_topics')).toBe(
      JSON.stringify({ source: 'tophub', maxCount: 20 }, null, 2)
    )
    expect(queryFormatToolArgsExampleJson('')).toBe('{}')
  })

  it('extracts context input keys from args placeholders', () => {
    expect(queryToolContextInputKeys('write_file')).toEqual(['summary'])
    expect(queryToolContextInputKeys('fetch_hot_topics')).toEqual([])
    expect(queryToolContextInputKeys('xhs_publish_note').sort()).toEqual(
      ['imagePath', 'summary'].sort()
    )
  })

  it('builds tool context example with outputs', () => {
    expect(queryToolContextExample('fetch_hot_topics')).toMatchObject({
      hotTopicsOk: '1',
      hotSource: 'weibo'
    })
    expect(queryToolContextExample('write_file')).toEqual({ summary: null })
  })

  it('merges upstream keys into context preview', () => {
    expect(
      queryToolContextPreview('fetch_hot_topics', ['summary'])
    ).toMatchObject({
      summary: null,
      hotTopicsOk: '1'
    })
    expect(queryFormatToolContextPreviewJson('fetch_hot_topics', [])).toContain(
      'hotTopicsOk'
    )
  })
})
