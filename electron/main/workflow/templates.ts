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
    description: '创作 →（可选确认）→ 发布到小红书；可按此模板改主题后再运行。',
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
          '使用 xhs_publish_note 填写上一步内容；传 autoPublish=true 自动点击发布；遵守小红书风控与去同质化要求。未登录时工具会暂停等人扫码。',
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
  },
  {
    id: 'tpl_hot_topics_weibo_baidu',
    title: '今日热点：微博优先，失败回退百度',
    description:
      '先用 fetch_hot_topics 拉微博热搜；失败（hotTopicsOk≠1）则走百度热搜；最后整理摘要并确认。',
    templateKind: 'generic',
    nodes: [
      { id: 'tpl_ht_start', type: 'start', title: '开始' },
      {
        id: 'tpl_ht_weibo',
        type: 'tool',
        title: '获取微博今日热点',
        toolName: 'fetch_hot_topics',
        argsTemplate: { source: 'weibo', maxCount: 20 },
        outputKeys: ['weiboHotRaw']
      },
      {
        id: 'tpl_ht_cond',
        type: 'condition',
        title: '微博是否成功',
        mode: 'expression',
        cases: [
          {
            key: 'weibo_ok',
            label: '微博成功',
            when: { contextKey: 'hotTopicsOk', op: 'eq', value: '1' },
            nodes: [
              {
                id: 'tpl_ht_sum_weibo',
                type: 'agent',
                title: '整理微博热点摘要',
                prompt:
                  '以下是微博今日热点原始列表，请整理成简洁中文摘要：列出 Top 10（标题即可），并加一句总体观察。不要调用浏览器或发布工具。\n\n{{hotTopics}}',
                toolWhitelist: ['update_task_list']
              }
            ]
          },
          {
            key: 'weibo_fail',
            label: '回退百度',
            nodes: [
              {
                id: 'tpl_ht_baidu',
                type: 'tool',
                title: '获取百度今日热点',
                toolName: 'fetch_hot_topics',
                argsTemplate: { source: 'baidu', maxCount: 20 },
                outputKeys: ['baiduHotRaw']
              },
              {
                id: 'tpl_ht_sum_baidu',
                type: 'agent',
                title: '整理百度热点摘要',
                prompt:
                  '微博热搜获取失败，已改用百度。请根据下列百度今日热点整理 Top 10 摘要，并注明来源为百度。不要调用浏览器或发布工具。\n\n{{hotTopics}}',
                toolWhitelist: ['update_task_list']
              }
            ]
          }
        ],
        defaultKey: 'weibo_fail'
      },
      {
        id: 'tpl_ht_await',
        type: 'await_user',
        title: '确认热点摘要',
        reason: '今日热点摘要已生成，请确认后结束流程。'
      },
      { id: 'tpl_ht_end', type: 'end', title: '结束' }
    ],
    canvas: {
      positions: {
        tpl_ht_start: { x: 140, y: 20 },
        tpl_ht_weibo: { x: 140, y: 90 },
        tpl_ht_sum_weibo: { x: 40, y: 180 },
        tpl_ht_baidu: { x: 240, y: 180 },
        tpl_ht_sum_baidu: { x: 240, y: 250 },
        tpl_ht_await: { x: 140, y: 330 },
        tpl_ht_end: { x: 140, y: 400 }
      },
      edges: [
        { id: 'e_ht_s_w', source: 'tpl_ht_start', target: 'tpl_ht_weibo' },
        {
          id: 'e_ht_w_ok',
          source: 'tpl_ht_weibo',
          target: 'tpl_ht_sum_weibo',
          label: '微博成功',
          when: { contextKey: 'hotTopicsOk', op: 'eq', value: '1' }
        },
        {
          id: 'e_ht_w_fail',
          source: 'tpl_ht_weibo',
          target: 'tpl_ht_baidu',
          label: '回退百度',
          isDefault: true
        },
        {
          id: 'e_ht_b_sum',
          source: 'tpl_ht_baidu',
          target: 'tpl_ht_sum_baidu'
        },
        {
          id: 'e_ht_ok_a',
          source: 'tpl_ht_sum_weibo',
          target: 'tpl_ht_await'
        },
        {
          id: 'e_ht_fail_a',
          source: 'tpl_ht_sum_baidu',
          target: 'tpl_ht_await'
        },
        { id: 'e_ht_a_end', source: 'tpl_ht_await', target: 'tpl_ht_end' }
      ]
    },
    createdAt: 0,
    updatedAt: 0
  },
  {
    id: 'tpl_start_end_edge_branch',
    title: '开始/结束与连线条件示例',
    description:
      '演示强制「开始→结束」与连线 XOR：默认走「表达式 true」支路；另一条为 else。可在画布双击虚线边改条件后重跑。',
    templateKind: 'generic',
    nodes: [
      { id: 'tpl_se_start', type: 'start', title: '开始' },
      {
        id: 'tpl_se_intro',
        type: 'agent',
        title: '说明本示例',
        prompt:
          '用两三句话说明：本流程演示开始/结束节点，以及带条件的连线分支；默认会走「命中」支路。不要调用发布类工具。',
        toolWhitelist: ['update_task_list']
      },
      {
        id: 'tpl_se_cond',
        type: 'condition',
        title: '连线条件分叉',
        mode: 'expression',
        cases: [
          {
            key: 'hit',
            label: '命中',
            when: { expression: 'true' },
            nodes: [
              {
                id: 'tpl_se_hit',
                type: 'agent',
                title: '命中支路',
                prompt:
                  '告诉用户：条件边（expression: true）已命中，本步是 XOR 中被执行的一支；另一支应为「已跳过」。不要调用发布类工具。',
                toolWhitelist: ['update_task_list']
              }
            ]
          },
          {
            key: 'else',
            label: '默认',
            nodes: [
              {
                id: 'tpl_se_else',
                type: 'agent',
                title: '默认支路',
                prompt:
                  '告诉用户：当前走到了默认（else）支路。不要调用发布类工具。',
                toolWhitelist: ['update_task_list']
              }
            ]
          }
        ],
        defaultKey: 'else'
      },
      {
        id: 'tpl_se_await',
        type: 'await_user',
        title: '确认后结束',
        reason: '查看任务清单：未选中支路应为「已跳过」。确认后进入结束节点。'
      },
      { id: 'tpl_se_end', type: 'end', title: '结束' }
    ],
    canvas: {
      positions: {
        tpl_se_start: { x: 120, y: 24 },
        tpl_se_intro: { x: 120, y: 90 },
        tpl_se_hit: { x: 40, y: 170 },
        tpl_se_else: { x: 200, y: 170 },
        tpl_se_await: { x: 120, y: 250 },
        tpl_se_end: { x: 120, y: 320 }
      },
      edges: [
        { id: 'e_se_s_i', source: 'tpl_se_start', target: 'tpl_se_intro' },
        {
          id: 'e_se_i_hit',
          source: 'tpl_se_intro',
          target: 'tpl_se_hit',
          label: '命中',
          when: { expression: 'true' }
        },
        {
          id: 'e_se_i_else',
          source: 'tpl_se_intro',
          target: 'tpl_se_else',
          label: '默认',
          isDefault: true
        },
        { id: 'e_se_hit_a', source: 'tpl_se_hit', target: 'tpl_se_await' },
        { id: 'e_se_else_a', source: 'tpl_se_else', target: 'tpl_se_await' },
        { id: 'e_se_a_end', source: 'tpl_se_await', target: 'tpl_se_end' }
      ]
    },
    createdAt: 0,
    updatedAt: 0
  },
  {
    id: 'tpl_feishu_richtext_push',
    title: '飞书富文本推送（模板）',
    description:
      '微博热搜优先、失败回退百度；整理 Markdown 简报。流程结束后由系统转为 msg_type=post 推送飞书，无需人工确认。',
    templateKind: 'generic',
    nodes: [
      { id: 'tpl_fr_start', type: 'start', title: '开始' },
      {
        id: 'tpl_fr_weibo',
        type: 'tool',
        title: '获取微博热搜',
        toolName: 'fetch_hot_topics',
        argsTemplate: { source: 'weibo', maxCount: 20 },
        outputKeys: ['weiboHotRaw']
      },
      {
        id: 'tpl_fr_cond',
        type: 'condition',
        title: '微博是否成功',
        mode: 'expression',
        cases: [
          {
            key: 'weibo_ok',
            label: '微博成功',
            when: { contextKey: 'hotTopicsOk', op: 'eq', value: '1' },
            nodes: [
              {
                id: 'tpl_fr_fmt_weibo',
                type: 'agent',
                title: '整理富文本简报（微博）',
                prompt: [
                  '将下列热点整理为飞书 post 富文本用的 Markdown 简报。',
                  '要求：',
                  '1. 文首二级标题「热点富文本简报」',
                  '2. 列出 Top 8 条科技/互联网相关热点（不足则列综合热点）',
                  '3. 每条：标题 + 一句话说明 + [查看](链接)（无链接可写热搜词条）',
                  '4. 只输出 Markdown；禁止调用 notify_message（流程结束后系统自动 post 推送飞书）',
                  '',
                  '{{hotTopics}}'
                ].join('\n'),
                toolWhitelist: ['update_task_list']
              }
            ]
          },
          {
            key: 'weibo_fail',
            label: '回退百度',
            nodes: [
              {
                id: 'tpl_fr_baidu',
                type: 'tool',
                title: '获取百度热搜',
                toolName: 'fetch_hot_topics',
                argsTemplate: { source: 'baidu', maxCount: 20 },
                outputKeys: ['baiduHotRaw']
              },
              {
                id: 'tpl_fr_fmt_baidu',
                type: 'agent',
                title: '整理富文本简报（百度）',
                prompt: [
                  '微博获取失败，已改用百度热搜。请整理为飞书 post 富文本用的 Markdown 简报。',
                  '要求：',
                  '1. 文首二级标题「热点富文本简报」',
                  '2. 列出 Top 8 条科技/互联网相关热点（不足则列综合热点）',
                  '3. 每条：标题 + 一句话说明 + [查看](链接)（无链接可写热搜词条）',
                  '4. 只输出 Markdown；禁止调用 notify_message（流程结束后系统自动 post 推送飞书）',
                  '',
                  '{{hotTopics}}'
                ].join('\n'),
                toolWhitelist: ['update_task_list']
              }
            ]
          }
        ],
        defaultKey: 'weibo_fail'
      },
      { id: 'tpl_fr_end', type: 'end', title: '结束' }
    ],
    canvas: {
      positions: {
        tpl_fr_start: { x: 140, y: 20 },
        tpl_fr_weibo: { x: 140, y: 90 },
        tpl_fr_fmt_weibo: { x: 40, y: 180 },
        tpl_fr_baidu: { x: 240, y: 180 },
        tpl_fr_fmt_baidu: { x: 240, y: 250 },
        tpl_fr_end: { x: 140, y: 330 }
      },
      edges: [
        { id: 'e_fr_s_w', source: 'tpl_fr_start', target: 'tpl_fr_weibo' },
        {
          id: 'e_fr_w_ok',
          source: 'tpl_fr_weibo',
          target: 'tpl_fr_fmt_weibo',
          label: '微博成功',
          when: { contextKey: 'hotTopicsOk', op: 'eq', value: '1' }
        },
        {
          id: 'e_fr_w_fail',
          source: 'tpl_fr_weibo',
          target: 'tpl_fr_baidu',
          label: '回退百度',
          isDefault: true
        },
        { id: 'e_fr_b_fmt', source: 'tpl_fr_baidu', target: 'tpl_fr_fmt_baidu' },
        { id: 'e_fr_ok_end', source: 'tpl_fr_fmt_weibo', target: 'tpl_fr_end' },
        { id: 'e_fr_fail_end', source: 'tpl_fr_fmt_baidu', target: 'tpl_fr_end' }
      ]
    },
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
