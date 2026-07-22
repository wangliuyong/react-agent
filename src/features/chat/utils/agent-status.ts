/** Agent 运行阶段，用于 UI 反馈文案 */
export type AgentPhase = 'idle' | 'thinking' | 'streaming' | 'tool'

interface AgentStatusInput {
  running: boolean
  streamingText: string
  activeToolName: string | null
  awaitUserReason: string | null
  /** 当前任务选用的模型连接展示名 */
  activeModelLabel?: string | null
}

/** 常用工具名 → 用户可读文案 */
const TOOL_LABELS: Record<string, string> = {
  browser_navigate: '打开网页',
  browser_snapshot: '查看页面结构',
  browser_click: '点击页面元素',
  browser_type: '输入文本',
  browser_upload: '上传文件',
  browser_wait: '等待页面',
  xhs_publish_note: '发布小红书',
  douyin_publish_note: '发布抖音',
  fetch_web_images: '抓取网页配图',
  fetch_hot_topics: '获取热点',
  query_ashare_kline: 'A股K线',
  query_ashare_realtime_analysis: 'A股实时分析',
  query_weather: '查询天气',
  query_web_data: '获取网页数据',
  generate_script: '生成剧本',
  generate_storyboard: '生成分镜',
  generate_scene_assets: '生成场景素材',
  compose_video: '合成视频',
  notify_message: '发送通知',
  web_search: '搜索网络',
  read_file: '读取文件',
  write_file: '写入文件',
  list_dir: '浏览目录',
  switch_model: '切换模型',
  update_task_list: '更新任务',
  list_attachments: '查看附件',
  use_skill: '加载技能'
}

/** 将 tool 名格式化为可读文案 */
export function queryToolLabel(toolName: string): string {
  return TOOL_LABELS[toolName] ?? toolName.replace(/_/g, ' ')
}

/** 根据 store 状态推导当前 Agent 阶段 */
export function queryAgentPhase(input: AgentStatusInput): AgentPhase {
  if (!input.running || input.awaitUserReason) return 'idle'
  if (input.activeToolName) return 'tool'
  if (input.streamingText) return 'streaming'
  return 'thinking'
}

/** 推导顶栏 / 输入区状态文案；idle 时返回 null */
export function queryAgentStatusLabel(input: AgentStatusInput): string | null {
  const phase = queryAgentPhase(input)
  const modelSuffix = input.activeModelLabel?.trim()
    ? ` · ${input.activeModelLabel.trim()}`
    : ''
  switch (phase) {
    case 'thinking':
      return `正在思考${modelSuffix}…`
    case 'streaming':
      return `正在生成回复${modelSuffix}…`
    case 'tool':
      return `正在${queryToolLabel(input.activeToolName!)}${modelSuffix}…`
    default:
      return null
  }
}

interface AgentBusyLabelInput extends AgentStatusInput {
  /**
   * 时间线末步是否已落工具结果。
   * thinking 阶段为 true 时展示「正在整理工具结果」而非「正在思考」。
   */
  afterToolGroup?: boolean
}

/**
 * 聊天区 pending / 忙碌态文案。
 * 在工具结果已回、模型消化下一轮时优先「整理工具结果」。
 */
export function queryAgentBusyLabel(input: AgentBusyLabelInput): string | null {
  const phase = queryAgentPhase(input)
  if (phase === 'idle') return null
  if (phase === 'thinking' && input.afterToolGroup) {
    const modelSuffix = input.activeModelLabel?.trim()
      ? ` · ${input.activeModelLabel.trim()}`
      : ''
    return `正在整理工具结果${modelSuffix}`
  }
  return queryAgentStatusLabel(input)
}
