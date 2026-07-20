import type { SkillUpsertInput } from './types'
import { slugifySkillImportId, isValidSkillImportId } from './skill-import-json'

/** LLM 总结技能时的系统提示 */
export const SKILL_SUMMARIZE_LLM_SYSTEM = `你是 Cursor Agent 技能编写助手。根据用户提供的任务执行记录，将**已成功执行**的步骤经验总结为可复用的 Agent Skill（SKILL.md 正文）。

要求：
1. 只保留成功执行的步骤与有效经验，忽略失败、跳过、未执行的步骤
2. 正文使用 Markdown，结构参考：
   - # 标题
   - ## 适用场景
   - ## 标准任务清单（有序步骤，可含子步骤）
   - ## 工具与参数（如有）
   - ## 注意事项 / 常见问题
3. description 用于 Agent 自动发现技能，需说明触发场景（1～3 句）
4. name 为展示名称（中文或英文均可）
5. id 为小写连字符目录名，1～64 字符
6. examplesContent 可选，提供 1 个简短示例场景

仅返回 JSON 对象，不要 markdown 代码块：
{
  "id": "建议技能 id",
  "name": "技能名称",
  "description": "触发场景描述",
  "content": "SKILL.md 正文（Markdown，不含 frontmatter）",
  "examplesContent": "可选示例 Markdown"
}`

/** 从大模型 JSON 响应解析 SkillUpsertInput */
export function parseSkillSummarizeJson(text: string): SkillUpsertInput | null {
  const trimmed = text.trim()
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return null

  try {
    const raw = JSON.parse(jsonMatch[0]) as Record<string, unknown>
    const content = typeof raw.content === 'string' ? raw.content.trim() : ''
    if (!content) return null

    const name =
      typeof raw.name === 'string' && raw.name.trim()
        ? raw.name.trim()
        : typeof raw.id === 'string' && raw.id.trim()
          ? raw.id.trim()
          : ''
    if (!name) return null

    const description =
      typeof raw.description === 'string' && raw.description.trim()
        ? raw.description.trim()
        : `从任务执行经验总结的技能：${name}`

    const idSource =
      typeof raw.id === 'string' && raw.id.trim() ? raw.id.trim() : slugifySkillImportId(name)
    const id = slugifySkillImportId(idSource)
    if (!isValidSkillImportId(id)) return null

    const examplesRaw = raw.examplesContent
    const examplesContent =
      typeof examplesRaw === 'string' && examplesRaw.trim() ? examplesRaw.trim() : undefined

    return { id, name, description, content, examplesContent }
  } catch {
    return null
  }
}

/** 无 LLM 时的规则兜底：由成功步骤标题生成基础技能草稿 */
export function buildFallbackSkillFromTasks(
  sessionTitle: string,
  stepTitles: string[]
): SkillUpsertInput {
  const baseName = sessionTitle.trim() || '任务执行经验'
  const id = slugifySkillImportId(`${baseName}-skill`)
  const numberedSteps = stepTitles.map((title, i) => `${i + 1}. ${title}`).join('\n')

  return {
    id,
    name: `${baseName}（经验总结）`,
    description: `从「${baseName}」成功执行步骤总结的可复用流程，适用于类似任务场景。`,
    content: `# ${baseName}

## 适用场景

当需要重复执行与「${baseName}」类似的多步任务时使用本技能。

## 标准任务清单

${numberedSteps}

## 注意事项

- 以上步骤均来自已成功执行的记录，失败或未执行的步骤已剔除
- 执行过程中请用 \`update_task_list\` 同步任务清单状态
`,
    examplesContent: ''
  }
}
