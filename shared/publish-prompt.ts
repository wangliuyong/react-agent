import type { PublishPlan, PublishSubTask } from './types'

/** 将子任务转为发给 Agent 的自然语言指令（主进程定时任务与渲染进程发布工作台共用） */
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

/** 将发布计划转为串行执行的 Agent 指令 */
export function buildPublishPlanPrompt(plan: PublishPlan): string {
  if (!plan.subTasks.length) {
    return `发布计划「${plan.title}」暂无子任务，请先在工作台添加子任务。`
  }
  return [
    `请按顺序串行执行以下 ${plan.subTasks.length} 个小红书发布子任务（计划：${plan.title}）：`,
    ...plan.subTasks.map((s, i) => `\n### 子任务 ${i + 1}\n${buildSubTaskPrompt(s)}`),
    '\n每完成一个子任务更新任务清单。若需要配图请提示我上传。'
  ].join('\n')
}
