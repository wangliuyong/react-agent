import { LazyChatMarkdown } from '@/features/chat/components/LazyChatMarkdown'

/**
 * 技能 / 规则详情 Markdown 预览。
 * 复用聊天区的完整 GFM 解析（粗体、有序列表、行内代码、表格、链接等）。
 */
export function SkillMarkdown({ source }: { source: string }): React.ReactElement {
  return <LazyChatMarkdown source={source} />
}
