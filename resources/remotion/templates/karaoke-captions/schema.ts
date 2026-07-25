/**
 * karaoke-captions 模板 Studio Props schema。
 * apply 后复制为 src/activeSchema.ts。
 */
import { z } from 'zod'

const captionSchema = z.object({
  text: z.string(),
  startMs: z.number(),
  endMs: z.number()
})

export const activeTemplateSchema = z.object({
  headline: z.string().describe('顶部标题'),
  theme: z.enum(['DARK_TECH', 'PREMIUM_GOLD', 'LIGHT_MINIMAL']).describe('主题'),
  accentColor: z.string().describe('强调色'),
  captions: z.array(captionSchema).describe('字幕列表'),
  karaoke: z.boolean().describe('是否卡拉OK高亮'),
  fontSize: z.number().min(28).max(96).describe('字幕字号')
})

export type KaraokeCaptionsProps = z.infer<typeof activeTemplateSchema>
