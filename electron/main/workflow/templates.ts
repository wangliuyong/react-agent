import type { WorkflowDefinition } from '../../../shared/types'

/**
 * 预置工作流模板：仅在本地尚不存在对应 id 时写入，不覆盖用户改过的同名流程。
 */
export const BUILTIN_WORKFLOW_TEMPLATES: WorkflowDefinition[] = [
  {
    id: 'tpl_generic_research_confirm',
    title: '调研 → 确认 → 总结',
    description: '通用流程模板：Agent 调研、人工确认、再输出结论。',
    templateKind: 'generic',
    nodes: [
      {
        id: 'tpl_r1',
        type: 'agent',
        title: '调研主题',
        prompt:
          '根据用户最近一条需求调研背景资料，整理 3～5 个要点。可用 fetch_web_images 以外的只读工具；不要发布内容。',
        toolWhitelist: ['list_attachments', 'update_task_list']
      },
      {
        id: 'tpl_r2',
        type: 'await_user',
        title: '确认调研结果',
        reason: '请确认调研要点是否可用，确认后继续生成总结。'
      },
      {
        id: 'tpl_r3',
        type: 'agent',
        title: '输出总结',
        prompt: '基于已确认的调研要点，用简洁中文输出最终总结（标题 + 三条行动建议）。',
        toolWhitelist: ['update_task_list']
      }
    ],
    createdAt: 0,
    updatedAt: 0
  },
  {
    id: 'tpl_publish_xhs_basic',
    title: '小红书图文发布（模板）',
    description: '创作 → 确认 → 发布到小红书；可按此模板改主题后再运行。',
    templateKind: 'publish',
    nodes: [
      {
        id: 'tpl_xhs_1',
        type: 'agent',
        title: '创作笔记',
        prompt:
          '围绕「职场效率」创作一篇小红书图文：标题≤20字，正文口语化并带话题；优先 fetch_web_images 配图。先不要发布。',
        toolWhitelist: ['fetch_web_images', 'list_attachments', 'update_task_list']
      },
      {
        id: 'tpl_xhs_2',
        type: 'await_user',
        title: '确认后发布',
        reason: '内容与配图已准备好，请确认后发布到小红书。'
      },
      {
        id: 'tpl_xhs_3',
        type: 'agent',
        title: '发布到小红书',
        prompt:
          '使用 xhs_publish_note 发布上一步内容；autoPublish=true；遵守小红书风控与去同质化要求。',
        toolWhitelist: ['xhs_publish_note', 'fetch_web_images', 'list_attachments', 'update_task_list']
      }
    ],
    createdAt: 0,
    updatedAt: 0
  },
  {
    id: 'tpl_tool_parallel_demo',
    title: '并行工具示例',
    description: '演示 parallel 组内纯 tool 节点 Promise.all 并发（读附件列表）。',
    templateKind: 'generic',
    nodes: [
      {
        id: 'tpl_p0',
        type: 'agent',
        title: '说明并行',
        prompt: '用一句话告诉用户接下来将并行检查附件列表，然后结束本步。',
        toolWhitelist: ['update_task_list']
      },
      {
        id: 'tpl_p1',
        type: 'parallel',
        title: '并行检查附件',
        children: [
          {
            id: 'tpl_p1a',
            type: 'tool',
            title: '附件检查 A',
            toolName: 'list_attachments',
            argsTemplate: {},
            outputKeys: ['attachmentsA']
          },
          {
            id: 'tpl_p1b',
            type: 'tool',
            title: '附件检查 B',
            toolName: 'list_attachments',
            argsTemplate: {},
            outputKeys: ['attachmentsB']
          }
        ]
      }
    ],
    createdAt: 0,
    updatedAt: 0
  }
]

/** 将缺失的预置模板合并进现有列表（不覆盖已有 id） */
export function mergeBuiltinWorkflowTemplates(
  existing: WorkflowDefinition[]
): { list: WorkflowDefinition[]; added: number } {
  const ids = new Set(existing.map((w) => w.id))
  const now = Date.now()
  const toAdd: WorkflowDefinition[] = []
  for (const tpl of BUILTIN_WORKFLOW_TEMPLATES) {
    if (ids.has(tpl.id)) continue
    toAdd.push({
      ...tpl,
      createdAt: now,
      updatedAt: now
    })
  }
  if (!toAdd.length) return { list: existing, added: 0 }
  return { list: [...existing, ...toAdd], added: toAdd.length }
}
