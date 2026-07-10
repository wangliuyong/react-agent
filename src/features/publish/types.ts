import type { PublishPlan, PublishSubTask } from '@shared/types'

export function createEmptyPlan(): PublishPlan {
  const now = Date.now()
  return {
    id: crypto.randomUUID(),
    title: '未命名发布计划',
    description: '',
    subTasks: [],
    createdAt: now,
    updatedAt: now
  }
}

export function createEmptySubTask(partial?: Partial<PublishSubTask>): PublishSubTask {
  return {
    id: crypto.randomUUID(),
    title: '新子任务',
    channel: '小红书',
    topic: '',
    autoPublish: true,
    contentPrompt: '',
    ...partial
  }
}

/** 将子任务转为发给 Agent 的自然语言指令 */
export function buildSubTaskPrompt(sub: PublishSubTask): string {
  return [
    `请帮我在${sub.channel}发布一条内容。`,
    `任务标题：${sub.title}`,
    sub.topic ? `主题标签：${sub.topic}` : '',
    `内容要求：${sub.contentPrompt || '按主题自由发挥'}`,
    `自动发布：${sub.autoPublish ? '是（填好后发布）' : '否（只填好停在待发布）'}`,
    '配图：优先用 fetch_web_images 从相关新闻/内容来源网页抓取；用户本地上传仅为可选。',
    '优先使用 xhs_publish_note（可传 imageSourceUrl 或先 fetch 再传 imagePaths）。'
  ]
    .filter(Boolean)
    .join('\n')
}
