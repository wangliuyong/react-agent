/** Agent 运行阶段，用于 UI 反馈文案 */
export type AgentPhase = 'idle' | 'thinking' | 'streaming' | 'tool'

interface AgentStatusInput {
  running: boolean
  streamingText: string
  activeToolName: string | null
  awaitUserReason: string | null
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
  web_search: '搜索网络',
  read_file: '读取文件',
  write_file: '写入文件',
  list_dir: '浏览目录'
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
  switch (phase) {
    case 'thinking':
      return '正在思考…'
    case 'streaming':
      return '正在生成回复…'
    case 'tool':
      return `正在${queryToolLabel(input.activeToolName!)}…`
    default:
      return null
  }
}
