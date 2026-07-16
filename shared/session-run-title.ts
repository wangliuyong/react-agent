/**
 * 任务/流程每次执行时的会话标题：前缀 + 名称 + 执行时刻，便于侧边栏区分多次运行。
 */
export function formatRunSessionTitle(prefix: string, name: string, runAt = Date.now()): string {
  const label = new Date(runAt).toLocaleString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
  const trimmed = name.trim() || '未命名'
  return `${prefix} ${trimmed} · ${label}`
}
