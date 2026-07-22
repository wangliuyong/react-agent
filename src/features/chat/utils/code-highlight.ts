/**
 * 轻量代码高亮：将纯文本转为带 class 的 HTML，供聊天代码预览使用。
 * 用占位符保护已高亮片段，避免二次匹配破坏 span 属性。
 */

/** HTML 特殊字符转义 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function wrap(className: string, text: string): string {
  return `<span class="${className}">${escapeHtml(text)}</span>`
}

const SLOT_RE = /\x00HL(\d+)\x00/g

interface SlotStash {
  stash: (html: string) => string
  read: (index: number) => string
}

/** 将已高亮片段暂存为占位符，避免后续规则误匹配 */
function createSlotStash(): SlotStash {
  const slots: string[] = []
  return {
    stash(html: string): string {
      const index = slots.length
      slots.push(html)
      return `\x00HL${index}\x00`
    },
    read(index: number): string {
      return slots[index] ?? ''
    }
  }
}

/** 仅处理纯文本片段（不含占位符） */
function applyRules(
  chunk: string,
  rules: Array<{ pattern: RegExp; className: string }>
): string {
  let result = escapeHtml(chunk)
  for (const { pattern, className } of rules) {
    const re = new RegExp(pattern.source, pattern.flags)
    result = result.replace(re, (match) => wrap(className, match))
  }
  return result
}

/** 分段处理：占位符还原为已高亮 HTML，其余片段走规则 */
function processWithRules(
  source: string,
  rules: Array<{ pattern: RegExp; className: string }>,
  stash: SlotStash
): string {
  const re = new RegExp(SLOT_RE.source, 'g')
  let output = ''
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = re.exec(source)) !== null) {
    output += applyRules(source.slice(lastIndex, match.index), rules)
    output += stash.read(Number(match[1]))
    lastIndex = match.index + match[0].length
  }

  output += applyRules(source.slice(lastIndex), rules)
  return output
}

/** 通用：注释、字符串、数字 */
function highlightGeneric(source: string): string {
  const stash = createSlotStash()

  let text = source
  text = text.replace(/(\/\/.*$|\/\*[\s\S]*?\*\/)/gm, (m) => stash.stash(wrap('hl-comment', m)))
  text = text.replace(/('(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`)/g, (m) =>
    stash.stash(wrap('hl-string', m))
  )

  return processWithRules(text, [{ pattern: /\b(-?\d+(?:\.\d+)?)\b/g, className: 'hl-number' }], stash)
}

/** JSON：键名、字符串、布尔/null、数字 */
function highlightJson(source: string): string {
  const stash = createSlotStash()

  let text = source
  text = text.replace(/"([^"\\]|\\.)*"(?=\s*:)/g, (m) => stash.stash(wrap('hl-key', m)))
  text = text.replace(/"([^"\\]|\\.)*"/g, (m) => stash.stash(wrap('hl-string', m)))

  return processWithRules(
    text,
    [
      { pattern: /\b(true|false|null)\b/g, className: 'hl-keyword' },
      { pattern: /\b(-?\d+(?:\.\d+)?)\b/g, className: 'hl-number' }
    ],
    stash
  )
}

/** JS/TS：注释、字符串、关键字、对象键、数字 */
function highlightJsLike(source: string): string {
  const stash = createSlotStash()

  let text = source
  text = text.replace(/(\/\/.*$|\/\*[\s\S]*?\*\/)/gm, (m) => stash.stash(wrap('hl-comment', m)))
  text = text.replace(/('(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`)/g, (m) =>
    stash.stash(wrap('hl-string', m))
  )

  return processWithRules(
    text,
    [
      {
        pattern:
          /\b(const|let|var|function|return|if|else|for|while|switch|case|break|continue|import|export|from|default|class|extends|new|typeof|instanceof|async|await|try|catch|finally|throw|interface|type|enum)\b/g,
        className: 'hl-keyword'
      },
      { pattern: /([A-Za-z_$][\w$]*)(?=\s*:)/g, className: 'hl-key' },
      { pattern: /\b(-?\d+(?:\.\d+)?)\b/g, className: 'hl-number' }
    ],
    stash
  )
}

/**
 * 按语言返回高亮 HTML；未知语言走通用规则。
 */
export function queryHighlightCode(code: string, language: string): string {
  const lang = language.trim().toLowerCase()

  if (lang === 'json') return highlightJson(code)
  if (
    lang === 'javascript' ||
    lang === 'js' ||
    lang === 'typescript' ||
    lang === 'ts' ||
    lang === 'tsx' ||
    lang === 'jsx'
  ) {
    return highlightJsLike(code)
  }

  return highlightGeneric(code)
}
