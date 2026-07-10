import type {
  ProjectSkill,
  ProjectSkillDetail,
  SkillStates,
  SkillTemplate,
  SkillUpsertInput
} from '@shared/types'

/** 读取项目技能列表 */
export async function queryProjectSkills(): Promise<ProjectSkill[]> {
  return window.api.queryProjectSkills()
}

/** 读取单个技能详情 */
export async function queryProjectSkillDetail(id: string): Promise<ProjectSkillDetail | null> {
  return window.api.queryProjectSkillDetail(id)
}

/** 保存技能启用状态 */
export async function postSkillStates(states: SkillStates): Promise<SkillStates> {
  return window.api.postSkillStates(states)
}

/** 创建或更新技能 */
export async function postProjectSkill(input: SkillUpsertInput): Promise<ProjectSkillDetail> {
  return window.api.postProjectSkill(input)
}

/** 删除技能 */
export async function postDeleteProjectSkill(id: string): Promise<void> {
  return window.api.postDeleteProjectSkill(id)
}

/** 读取内置技能模板列表 */
export async function querySkillTemplates(): Promise<SkillTemplate[]> {
  return window.api.querySkillTemplates()
}

/** 安装技能模板到 .cursor/skills */
export async function postInstallSkillTemplate(
  templateId: string,
  targetId?: string
): Promise<ProjectSkillDetail> {
  return window.api.postInstallSkillTemplate(templateId, targetId)
}
