/**
 * 工作流「工具步骤」参数 JSON 示例。
 * 与 electron/main/agent/tools 的 parameters 对齐；值可含 {{contextKey}} 供上游插值。
 */

/** 各已注册工具的推荐示例参数（未知工具返回空对象） */
const TOOL_ARGS_EXAMPLES: Record<string, Record<string, unknown>> = {
  use_skill: {
    skillId: 'example-skill-id'
  },
  switch_model: {
    capability: 'reasoning',
    reason: '需要更强推理'
  },
  list_attachments: {},
  read_file: {
    path: '/absolute/path/to/file.txt'
  },
  write_file: {
    filename: 'note.txt',
    content: '{{summary}}'
  },
  update_task_list: {
    tasks: [
      { id: '1', title: '准备素材', status: 'pending' },
      { id: '2', title: '发布内容', status: 'pending' }
    ]
  },
  generate_image: {
    prompt: '竖版海报，简洁现代，主题：{{summary}}'
  },
  fetch_web_images: {
    pageUrl: 'https://example.com/article',
    maxCount: 3
  },
  fetch_hot_topics: {
    source: 'weibo',
    maxCount: 20
  },
  query_ashare_kline: {
    symbols: '600519,000001',
    period: 'daily',
    count: 120
  },
  query_ashare_realtime_analysis: {
    symbols: '600519,000001',
    range: 'today',
    preloadRanges: true
  },
  query_weather: {
    city: '北京'
  },
  query_web_data: {
    url: 'https://example.com',
    preferBrowser: false
  },
  generate_script: {
    title: '{{summary}}',
    script: '场次 1：……\n对白：……',
    sourcePrompt: '{{summary}}'
  },
  generate_storyboard: {
    title: '{{scriptTitle}}',
    logline: '{{summary}}',
    shots: [
      {
        id: 'shot-1',
        visual: '近景，主角站在窗边',
        narration: '旁白示例',
        durationSec: 3,
        aspectRatio: '9:16'
      }
    ]
  },
  generate_scene_assets: {
    storyboardPath: '{{storyboardPath}}'
  },
  compose_video: {
    title: '{{scriptTitle}}',
    sceneDurationSec: 3
  },
  browser_navigate: {
    url: 'https://example.com'
  },
  browser_snapshot: {
    maxLength: 12000
  },
  browser_click: {
    text: '登录'
  },
  browser_type: {
    selector: 'input[type="text"]',
    text: '{{summary}}',
    clear: true
  },
  browser_upload: {
    paths: ['/absolute/path/to/image.png']
  },
  browser_wait: {
    ms: 1500
  },
  xhs_publish_note: {
    title: '{{summary}}',
    content: '{{summary}}',
    publishType: 'image',
    imagePaths: ['{{imagePath}}'],
    autoPublish: true
  },
  douyin_publish_note: {
    title: '{{summary}}',
    content: '{{summary}}',
    imagePaths: ['{{imagePath}}'],
    autoPublish: true
  },
  notify_message: {
    channelId: 'feishu',
    title: '{{workflowTitle}}',
    content: '{{summary}}',
    msgType: 'post'
  }
}

/**
 * 按工具名查询参数示例对象。
 * 未注册或空名时返回 {}，便于表单默认展示。
 */
export function queryToolArgsExample(toolName: string): Record<string, unknown> {
  const key = toolName.trim()
  if (!key) return {}
  const example = TOOL_ARGS_EXAMPLES[key]
  if (!example) return {}
  // 浅拷贝，避免调用方误改共享常量
  return { ...example }
}

/**
 * 将工具参数示例格式化为表单「参数 JSON」文本（缩进 2）。
 */
export function queryFormatToolArgsExampleJson(toolName: string): string {
  return JSON.stringify(queryToolArgsExample(toolName), null, 2)
}
