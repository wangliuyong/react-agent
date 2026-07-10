import type { ReactElement } from 'react'
import styles from './SkillMarkdown.module.css'

/** 简易 Markdown 渲染：标题、代码块、段落（技能详情专用排版） */
export function SkillMarkdown({ source }: { source: string }): ReactElement {
  const blocks = parseMarkdownBlocks(source)

  return (
    <div className={styles.prose}>
      {blocks.map((block, i) => {
        if (block.type === 'heading') {
          const Tag = (`h${Math.min(block.level + 1, 4)}` as 'h2' | 'h3' | 'h4')
          return (
            <Tag key={i} className={styles.heading}>
              {block.text}
            </Tag>
          )
        }
        if (block.type === 'code') {
          return (
            <pre key={i} className={styles.codeBlock}>
              <code>{block.text}</code>
            </pre>
          )
        }
        if (block.type === 'list') {
          return (
            <ul key={i} className={styles.list}>
              {block.items?.map((item, j) => (
                <li key={j} className={styles.listItem}>
                  {item}
                </li>
              ))}
            </ul>
          )
        }
        return (
          <p key={i} className={styles.paragraph}>
            {block.text}
          </p>
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

    if (line.match(/^[-*]\s+/)) {
      const items: string[] = []
      while (i < lines.length && lines[i].match(/^[-*]\s+/)) {
        items.push(lines[i].replace(/^[-*]\s+/, ''))
        i += 1
      }
      blocks.push({ type: 'list', items })
      continue
    }

    if (!line.trim()) {
      i += 1
      continue
    }

    const paraLines: string[] = [line]
    i += 1
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].startsWith('#') &&
      !lines[i].startsWith('```') &&
      !lines[i].match(/^[-*]\s+/)
    ) {
      paraLines.push(lines[i])
      i += 1
    }
    blocks.push({ type: 'paragraph', text: paraLines.join(' ') })
  }

  return blocks
}
