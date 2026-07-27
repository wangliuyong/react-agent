/**
 * 工作流「工具步骤」参数 JSON 示例。
 * 与 electron/main/agent/tools 的 parameters 对齐；值可含 {{contextKey}} 供上游插值。
 */

import { queryJsonTemplateContextKeys } from '@shared/workflow-node-io'

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
 * 各工具执行后典型写入 workflow context 的字段（与 @@workflow_ctx@@ 对齐，值为示意）。
 * 仅列出有明确 context patch 的工具；其余工具在预览中只展示参数 JSON 引用的入参键。
 */
const TOOL_CONTEXT_OUTPUT_EXAMPLES: Record<string, Record<string, unknown>> = {
  fetch_hot_topics: {
    hotTopicsOk: '1',
    hotSource: 'weibo',
    hotTopics: '…榜单正文…',
    hotFetchSource: 'api'
  },
  query_ashare_kline: {
    stockKlineOk: '1',
    stockSymbols: '600519,000001',
    stockKlineSummary: '…K 线摘要…'
  },
  query_ashare_realtime_analysis: {
    stockAnalysisOk: '1',
    stockSymbols: '600519,000001',
    stockKlineSummary: '…',
    stockAnalysisReport: '…',
    stockSignal: 'hold'
  },
  query_weather: {
    weatherOk: '1',
    weatherText: '…',
    weatherSummary: '…',
    weatherCity: '北京'
  },
  query_web_data: {
    webDataOk: '1',
    webData: '…正文…',
    webDataUrl: 'https://example.com',
    webDataTitle: '…',
    webDataSource: 'api'
  },
  generate_script: {
    scriptOk: '1',
    scriptPath: '/path/to/projects/…/script.md',
    scriptTitle: '…',
    scriptText: '…'
  },
  generate_storyboard: {
    storyboardOk: '1',
    storyboardPath: '/path/to/projects/…/storyboard.json',
    storyboardTitle: '…',
    shotCount: '3'
  },
  generate_scene_assets: {
    sceneAssetsOk: '1',
    sceneAssetPaths: '["…"]',
    sceneVideoPaths: '["…"]',
    sceneAudioPaths: '["…"]',
    sceneAssetsManifest: '/path/to/assets-manifest.json'
  },
  compose_video: {
    videoOk: '1',
    videoPath: '/path/to/output.mp4',
    videoMessage: '…'
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

/**
 * 从工具参数示例中提取需在 context 中提供的入参键（{{key}} 占位符）。
 */
export function queryToolContextInputKeys(toolName: string): string[] {
  return queryJsonTemplateContextKeys(queryToolArgsExample(toolName))
}

/**
 * 单工具典型 context 结构：入参键为 null，出参键为示意值。
 */
export function queryToolContextExample(toolName: string): Record<string, unknown> {
  const key = toolName.trim()
  if (!key) return {}

  const preview: Record<string, unknown> = {}
  for (const inputKey of queryToolContextInputKeys(key)) {
    preview[inputKey] = null
  }
  const outputs = TOOL_CONTEXT_OUTPUT_EXAMPLES[key]
  if (outputs) {
    for (const [k, v] of Object.entries(outputs)) {
      preview[k] = v
    }
  }
  return preview
}

/**
 * 表单 Context 预览：合并上游输出键与当前工具典型 context（上游键优先展示为 null）。
 */
export function queryToolContextPreview(
  toolName: string,
  upstreamOutputKeys: string[]
): Record<string, unknown> {
  const toolPreview = queryToolContextExample(toolName)
  const merged: Record<string, unknown> = {}

  for (const k of upstreamOutputKeys) {
    merged[k] = toolPreview[k] ?? null
  }
  for (const [k, v] of Object.entries(toolPreview)) {
    if (!(k in merged)) {
      merged[k] = v
    }
  }
  return merged
}

/**
 * 将 context 预览格式化为表单只读 JSON 文本。
 */
export function queryFormatToolContextPreviewJson(
  toolName: string,
  upstreamOutputKeys: string[]
): string {
  const preview = queryToolContextPreview(toolName, upstreamOutputKeys)
  return JSON.stringify(preview, null, 2)
}
