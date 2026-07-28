/**
 * 工作流工具结果前缀：@@workflow_ctx@@{"message","patch"}。
 * 聊天预览提取路径前必须先解码，否则图片/音视频/HTML 路径藏在 JSON 里。
 */

export const WORKFLOW_CTX_PREFIX = '@@workflow_ctx@@'

/**
 * 解码 @@workflow_ctx@@ 前缀，取出供展示与路径扫描的 message 正文。
 */
export function queryDecodeWorkflowCtxMessage(content: string): string {
  if (!content.startsWith(WORKFLOW_CTX_PREFIX)) return content
  try {
    const parsed = JSON.parse(content.slice(WORKFLOW_CTX_PREFIX.length)) as {
      message?: unknown
    }
    return parsed.message != null ? String(parsed.message) : content
  } catch {
    return content
  }
}
