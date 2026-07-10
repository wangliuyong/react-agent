import type { ReactElement } from 'react'
import { Typography } from 'antd'

const { Title, Paragraph } = Typography

/** 简易 Markdown 渲染：标题、代码块、段落 */
export function SkillMarkdown({ source }: { source: string }): ReactElement {
  const blocks = parseMarkdownBlocks(source)

  return (
    <div>
      {blocks.map((block, i) => {
        if (block.type === 'heading') {
          const level = Math.min(block.level + 2, 5) as 2 | 3 | 4 | 5
          return (
            <Title key={i} level={level} style={{ marginTop: i === 0 ? 0 : 20 }}>
              {block.text}
            </Title>
          )
        }
        if (block.type === 'code') {
          return (
            <pre
              key={i}
              style={{
                background: '#f5f5f5',
                padding: 12,
                borderRadius: 8,
                overflow: 'auto',
                fontSize: 13,
                lineHeight: 1.5
              }}
            >
              <code>{block.text}</code>
            </pre>
          )
        }
        if (block.type === 'list') {
          return (
            <ul key={i} style={{ paddingLeft: 20, margin: '8px 0' }}>
              {block.items?.map((item, j) => (
                <li key={j} style={{ marginBottom: 4 }}>
                  {item}
                </li>
              ))}
            </ul>
          )
        }
        return (
          <Paragraph key={i} style={{ margin: '8px 0' }}>
            {block.text}
          </Paragraph>
        )
      })}
    </div>
  )
}

type Block =
  | { type: 'heading'; level: number; text: string }
  | { type: 'code'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'paragraph'; text: string }

function parseMarkdownBlocks(source: string): Block[] {
  const lines = source.split('\n')
  const blocks: Block[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // 代码块
    if (line.startsWith('```')) {
      const codeLines: string[] = []
      i += 1
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i])
        i += 1
      }
      blocks.push({ type: 'code', text: codeLines.join('\n') })
      i += 1
      continue
    }

    // 标题
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/)
    if (headingMatch) {
      blocks.push({
        type: 'heading',
        level: headingMatch[1].length,
        text: headingMatch[2]
      })
      i += 1
      continue
    }

    // 无序列表
    if (line.match(/^[-*]\s+/)) {
      const items: string[] = []
      while (i < lines.length && lines[i].match(/^[-*]\s+/)) {
        items.push(lines[i].replace(/^[-*]\s+/, ''))
        i += 1
      }
      blocks.push({ type: 'list', items })
      continue
    }

    // 空行跳过
    if (!line.trim()) {
      i += 1
      continue
    }

    // 段落（合并连续非空行）
    const paraLines: string[] = [line]
    i += 1
    while (i < lines.length && lines[i].trim() && !lines[i].startsWith('#') && !lines[i].startsWith('```') && !lines[i].match(/^[-*]\s+/)) {
      paraLines.push(lines[i])
      i += 1
    }
    blocks.push({ type: 'paragraph', text: paraLines.join(' ') })
  }

  return blocks
}
