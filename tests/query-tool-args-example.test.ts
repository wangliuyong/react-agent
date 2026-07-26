import { describe, expect, it } from 'vitest'
import {
  queryFormatToolArgsExampleJson,
  queryToolArgsExample
} from '../src/features/workflows/utils/queryToolArgsExample'

describe('queryToolArgsExample', () => {
  it('returns empty object for blank or unknown tool', () => {
    expect(queryToolArgsExample('')).toEqual({})
    expect(queryToolArgsExample('   ')).toEqual({})
    expect(queryToolArgsExample('not_a_real_tool')).toEqual({})
  })

  it('returns fetch_hot_topics example with source and maxCount', () => {
    expect(queryToolArgsExample('fetch_hot_topics')).toEqual({
      source: 'weibo',
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
      JSON.stringify({ source: 'weibo', maxCount: 20 }, null, 2)
    )
    expect(queryFormatToolArgsExampleJson('')).toBe('{}')
  })
})
