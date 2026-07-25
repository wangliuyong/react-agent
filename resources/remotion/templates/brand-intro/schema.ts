/**
 * brand-intro 模板 Studio Props schema。
 * apply 后复制为 src/activeSchema.ts，导出名必须为 activeTemplateSchema。
 */
import { z } from 'zod'

export const activeTemplateSchema = z.object({
  title: z.string().describe('主标题'),
  subtitle: z.string().describe('副标题').optional(),
  theme: z.enum(['DARK_TECH', 'PREMIUM_GOLD', 'LIGHT_MINIMAL']).describe('主题'),
  accentColor: z.string().describe('强调色'),
  titleSize: z.number().min(48).max(140).describe('标题字号'),
  animationSpeed: z.number().min(0.5).max(2).describe('动效速度倍率')
})

export type BrandIntroProps = z.infer<typeof activeTemplateSchema>
