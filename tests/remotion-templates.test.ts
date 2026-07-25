import { describe, expect, it } from 'vitest'
import {
  isValidRemotionTemplateId,
  parseRemotionTemplateMeta,
  validateRemotionTemplateId
} from '../shared/remotion-template'

describe('remotion-template 类型', () => {
  it('校验合法模板 id', () => {
    expect(isValidRemotionTemplateId('brand-intro')).toBe(true)
    expect(isValidRemotionTemplateId('a')).toBe(true)
    expect(isValidRemotionTemplateId('_templates')).toBe(false)
    expect(isValidRemotionTemplateId('Bad')).toBe(false)
  })

  it('parseRemotionTemplateMeta 补全默认值', () => {
    const meta = parseRemotionTemplateMeta(
      { id: 'karaoke-captions', name: '字幕', tags: ['caption'] },
      'bundled'
    )
    expect(meta.compositionId).toBe('Main')
    expect(meta.origin).toBe('bundled')
    expect(meta.tags).toEqual(['caption'])
  })

  it('非法 meta 抛错', () => {
    expect(() => parseRemotionTemplateMeta({ name: 'x' })).toThrow()
    expect(() => validateRemotionTemplateId('')).toThrow()
  })
})
