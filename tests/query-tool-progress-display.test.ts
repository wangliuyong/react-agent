import { describe, expect, it } from 'vitest'
import {
  queryShouldShowToolProgress,
  queryToolProgressTitle
} from '../src/features/chat/utils/queryToolProgressDisplay'

describe('queryToolProgressDisplay', () => {
  it('仅 remotion_render 展示进度条', () => {
    expect(
      queryShouldShowToolProgress('remotion_render', { percent: 10, phase: 'bundle' })
    ).toBe(true)
    expect(queryShouldShowToolProgress('remotion_studio', { percent: 10, phase: 'bundle' })).toBe(
      false
    )
    expect(queryShouldShowToolProgress('remotion_render', null)).toBe(false)
  })

  it('进度标题使用工具可读名', () => {
    expect(queryToolProgressTitle('remotion_render')).toBe('渲染 Remotion 视频')
  })
})
