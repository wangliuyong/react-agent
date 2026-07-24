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
    title: '今日热点：微博优先，多来源回退',
    description:
      '先用 fetch_hot_topics 拉微博热搜；失败（hotTopicsOk≠1）则回退百度；整理摘要并确认。其他来源（douyin/kuaishou/tencent/xhs）可在画布中复制工具节点并改 source。',
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
                  '以下是微博今日热点原始列表，请整理成简洁中文摘要：列出 Top 10（标题即可），并加一句总体观察。注明来源为微博。不要调用浏览器或发布工具。\n\n{{hotTopics}}',
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
      '微博热搜优先、失败回退百度；可扩展为抖音/腾讯等 source。整理 Markdown 简报后由系统转为 msg_type=post 推送飞书，无需人工确认。',
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
                  '4. 文内注明来源平台（微博）',
                  '5. 只输出 Markdown；禁止调用 notify_message（流程结束后系统自动 post 推送飞书）',
                  '',
                  '{{hotTopics}}'
                ].join('\n'),
                toolWhitelist: ['update_task_list'],
                outputKeys: ['summary']
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
                  '4. 文内注明来源平台（百度）',
                  '5. 只输出 Markdown；禁止调用 notify_message（流程结束后系统自动 post 推送飞书）',
                  '',
                  '{{hotTopics}}'
                ].join('\n'),
                toolWhitelist: ['update_task_list'],
                outputKeys: ['summary']
              }
            ]
          }
        ],
        defaultKey: 'weibo_fail'
      },
      {
        id: 'tpl_fr_notify',
        type: 'notify',
        title: '渠道通知',
        channelId: 'feishu',
        contentTemplate: '{{summary}}',
        msgType: 'post',
        failSoft: true
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
        tpl_fr_notify: { x: 140, y: 300 },
        tpl_fr_end: { x: 140, y: 370 }
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
        { id: 'e_fr_ok_notify', source: 'tpl_fr_fmt_weibo', target: 'tpl_fr_notify' },
        { id: 'e_fr_fail_notify', source: 'tpl_fr_fmt_baidu', target: 'tpl_fr_notify' },
        { id: 'e_fr_notify_end', source: 'tpl_fr_notify', target: 'tpl_fr_end' }
      ]
    },
    createdAt: 0,
    updatedAt: 0
  },
  {
    id: 'tpl_one_shot_video',
    title: '一句话成片',
    description: '编剧写剧本与分镜 → 视频角色生成素材 → 剪辑师合成成片。',
    templateKind: 'generic',
    nodes: [
      {
        id: 'tpl_v_script',
        type: 'agent',
        title: '编剧：剧本与分镜',
        prompt:
          '根据用户输入创作短视频剧本并调用 generate_script；' +
          '再拆成 4～8 镜，默认竖版 9:16，调用 generate_storyboard。' +
          '每镜含 visual、narration、durationSec、cameraMotion、style、negativePrompt、aspectRatio、lighting。',
        toolWhitelist: [
          'list_attachments',
          'read_file',
          'generate_script',
          'generate_storyboard',
          'update_task_list'
        ],
        outputKeys: ['scriptPath', 'storyboardPath']
      },
      {
        id: 'tpl_v_assets',
        type: 'agent',
        title: '视频：场景素材',
        prompt:
          '读取上游分镜，调用 generate_scene_assets。流程：万相文生图关键帧 → 图生视频（失败则文生视频兜底）→ Qwen-TTS 旁白。' +
          '素材 mp4/wav 路径会在聊天内可预览；如实汇报每镜成败。',
        toolWhitelist: ['generate_scene_assets', 'read_file', 'update_task_list'],
        outputKeys: ['sceneAssetPaths', 'sceneAssetsManifest']
      },
      {
        id: 'tpl_v_compose',
        type: 'agent',
        title: '剪辑：合成成片',
        prompt:
          '调用 compose_video 合成成片，向用户汇报 videoPath。提醒用户可在聊天内直接播放成片；核查音画同步与叙事连贯。',
        toolWhitelist: ['compose_video', 'update_task_list'],
        outputKeys: ['videoPath']
      },
      {
        id: 'tpl_v_toast',
        type: 'toast',
        title: '成片完成提示',
        level: 'success',
        contentTemplate: '成片流程结束：{{videoPath}}'
      }
    ],
    createdAt: 0,
    updatedAt: 0
  },
  {
    id: 'tpl_daily_weather_notify',
    title: '每日天气 → 多渠道通知',
    description: '查询天气后推送到飞书等通知渠道。',
    templateKind: 'generic',
    nodes: [
      {
        id: 'tpl_w_agent',
        type: 'agent',
        title: '查询天气',
        prompt: '调用 query_weather 获取今日天气，将简报写入回复。',
        toolWhitelist: ['query_weather', 'update_task_list'],
        outputKeys: ['weatherText', 'weatherSummary']
      },
      {
        id: 'tpl_w_notify',
        type: 'notify',
        title: '飞书通知',
        channelId: 'feishu',
        titleTemplate: '今日天气',
        contentTemplate: '{{weatherText}}',
        msgType: 'post',
        failSoft: true
      }
    ],
    createdAt: 0,
    updatedAt: 0
  },
  {
    id: 'tpl_ashare_kline_preview',
    title: 'A 股 K 线预览',
    description:
      '在工具节点配置股票代码（英文逗号分隔），拉取 K 线并在聊天中交互预览；可改 symbols / period / count。',
    templateKind: 'generic',
    nodes: [
      { id: 'tpl_k_start', type: 'start', title: '开始' },
      {
        id: 'tpl_k_fetch',
        type: 'tool',
        title: '获取 A 股 K 线',
        toolName: 'query_ashare_kline',
        argsTemplate: {
          symbols: '600519,000001',
          period: 'daily',
          count: 120
        },
        outputKeys: ['stockKlineSummary']
      },
      {
        id: 'tpl_k_agent',
        type: 'agent',
        title: '解读行情',
        prompt:
          '根据上一步 K 线摘要，用 3～5 句话简要解读各股近期走势与关键价位，不要重复粘贴原始数据表。\n\n{{stockKlineSummary}}',
        toolWhitelist: ['update_task_list'],
        inputKeys: ['stockKlineSummary']
      },
      {
        id: 'tpl_k_await',
        type: 'await_user',
        title: '确认解读',
        reason: 'K 线图与解读已生成，请确认后结束流程。'
      },
      { id: 'tpl_k_end', type: 'end', title: '结束' }
    ],
    canvas: {
      positions: {
        tpl_k_start: { x: 140, y: 20 },
        tpl_k_fetch: { x: 140, y: 90 },
        tpl_k_agent: { x: 140, y: 180 },
        tpl_k_await: { x: 140, y: 270 },
        tpl_k_end: { x: 140, y: 350 }
      },
      edges: [
        { id: 'e_k_s_f', source: 'tpl_k_start', target: 'tpl_k_fetch' },
        { id: 'e_k_f_a', source: 'tpl_k_fetch', target: 'tpl_k_agent' },
        { id: 'e_k_a_w', source: 'tpl_k_agent', target: 'tpl_k_await' },
        { id: 'e_k_w_e', source: 'tpl_k_await', target: 'tpl_k_end' }
      ]
    },
    createdAt: 0,
    updatedAt: 0
  },
  {
    id: 'tpl_ashare_realtime_analysis',
    title: 'A 股实时 K 线 · 综合分析 · 买卖分支',
    description:
      '工具节点配置股票代码（英文逗号分隔）与 range（today/week/month/custom）；' +
      '自动输出 K 线图、技术指标分析、涨跌预测；按 stockSignal 走买入/卖出/观望分支。',
    templateKind: 'generic',
    nodes: [
      { id: 'tpl_ra_start', type: 'start', title: '开始' },
      {
        id: 'tpl_ra_fetch',
        type: 'tool',
        title: '实时 K 线 + 综合分析',
        toolName: 'query_ashare_realtime_analysis',
        argsTemplate: {
          symbols: '600519,000001',
          range: 'today',
          preloadRanges: true
        },
        outputKeys: ['stockAnalysisReport', 'stockKlineSummary']
      },
      {
        id: 'tpl_ra_cond',
        type: 'condition',
        title: '买卖信号分支',
        mode: 'expression',
        cases: [
          {
            key: 'buy_branch',
            label: '买入信号',
            when: { contextKey: 'stockSignal', op: 'eq', value: 'buy' },
            nodes: [
              {
                id: 'tpl_ra_buy',
                type: 'agent',
                title: '买入策略建议',
                prompt:
                  '当前综合信号为买入。请基于下列分析报告，给出建仓思路：入场区间、仓位建议、止损位与持有周期。' +
                  '语气专业简洁，并强调风险。\n\n{{stockAnalysisReport}}',
                toolWhitelist: ['update_task_list'],
                inputKeys: ['stockAnalysisReport']
              }
            ]
          },
          {
            key: 'sell_branch',
            label: '卖出信号',
            when: { contextKey: 'stockSignal', op: 'eq', value: 'sell' },
            nodes: [
              {
                id: 'tpl_ra_sell',
                type: 'agent',
                title: '卖出/减仓建议',
                prompt:
                  '当前综合信号为卖出。请基于下列分析报告，给出减仓或止盈策略：关键阻力位、分批卖出方案与后续观察点。\n\n{{stockAnalysisReport}}',
                toolWhitelist: ['update_task_list'],
                inputKeys: ['stockAnalysisReport']
              }
            ]
          },
          {
            key: 'hold_branch',
            label: '观望',
            nodes: [
              {
                id: 'tpl_ra_hold',
                type: 'agent',
                title: '观望解读',
                prompt:
                  '当前综合信号为观望。请解读下列分析报告，说明为何暂不操作，以及后续需关注的突破/跌破价位。\n\n{{stockAnalysisReport}}',
                toolWhitelist: ['update_task_list'],
                inputKeys: ['stockAnalysisReport']
              }
            ]
          }
        ],
        defaultKey: 'hold_branch'
      },
      {
        id: 'tpl_ra_await',
        type: 'await_user',
        title: '确认分析结论',
        reason: 'K 线图、综合分析与买卖建议已生成，请在聊天中切换周期查看后确认。'
      },
      { id: 'tpl_ra_end', type: 'end', title: '结束' }
    ],
    canvas: {
      positions: {
        tpl_ra_start: { x: 200, y: 20 },
        tpl_ra_fetch: { x: 200, y: 90 },
        tpl_ra_buy: { x: 40, y: 220 },
        tpl_ra_sell: { x: 200, y: 220 },
        tpl_ra_hold: { x: 360, y: 220 },
        tpl_ra_await: { x: 200, y: 310 },
        tpl_ra_end: { x: 200, y: 390 }
      },
      edges: [
        { id: 'e_ra_s_f', source: 'tpl_ra_start', target: 'tpl_ra_fetch' },
        {
          id: 'e_ra_f_buy',
          source: 'tpl_ra_fetch',
          target: 'tpl_ra_buy',
          label: '买入',
          when: { contextKey: 'stockSignal', op: 'eq', value: 'buy' }
        },
        {
          id: 'e_ra_f_sell',
          source: 'tpl_ra_fetch',
          target: 'tpl_ra_sell',
          label: '卖出',
          when: { contextKey: 'stockSignal', op: 'eq', value: 'sell' }
        },
        {
          id: 'e_ra_f_hold',
          source: 'tpl_ra_fetch',
          target: 'tpl_ra_hold',
          label: '观望',
          isDefault: true
        },
        { id: 'e_ra_buy_w', source: 'tpl_ra_buy', target: 'tpl_ra_await' },
        { id: 'e_ra_sell_w', source: 'tpl_ra_sell', target: 'tpl_ra_await' },
        { id: 'e_ra_hold_w', source: 'tpl_ra_hold', target: 'tpl_ra_await' },
        { id: 'e_ra_w_e', source: 'tpl_ra_await', target: 'tpl_ra_end' }
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
