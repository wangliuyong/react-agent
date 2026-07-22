import { describe, expect, it } from 'vitest'
import { queryHighlightCode } from '../src/features/chat/utils/code-highlight'

describe('queryHighlightCode', () => {
  it('转义 HTML 并高亮 JS 字符串与数字', () => {
    const html = queryHighlightCode('const x = "<script>";\n// comment\nconst n = 12;', 'javascript')
    expect(html).toContain('&lt;script&gt;')
    expect(html).toContain('class="hl-string"')
    expect(html).toContain('class="hl-number"')
    expect(html).toContain('class="hl-comment"')
  })

  it('高亮 JSON 键名', () => {
    const html = queryHighlightCode('{"name": "demo", "count": 3}', 'json')
    expect(html).toContain('class="hl-key"')
    expect(html).toContain('class="hl-string"')
    expect(html).toContain('class="hl-number"')
  })
})
