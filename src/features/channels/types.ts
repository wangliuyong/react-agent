import type { PublishChannelMeta, PublishChannelUpsertInput } from '@shared/publish-channels'

/** 新建渠道表单默认值 */
export function createEmptyChannel(): PublishChannelUpsertInput {
  return {
    id: '',
    label: '',
    description: '',
    enabled: true,
    publishTool: '',
    titleMaxLength: undefined,
    loginCheckUrl: '',
    agentHint: '请在此描述 Agent 发布该渠道时的工具名与注意事项。'
  }
}

/** 将展示名称转为建议的渠道 id */
export function slugifyChannelId(label: string): string {
  const slug = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_')
    .slice(0, 64)
  return slug || `channel_${Date.now()}`
}

/** 校验渠道 id 格式（与主进程 validateChannelId 一致） */
export function isValidChannelId(id: string): boolean {
  return /^[a-z0-9_-]{1,64}$/.test(id)
}

/** 渠道元数据 → 编辑 DTO */
export function channelMetaToInput(meta: PublishChannelMeta): PublishChannelUpsertInput {
  return {
    id: meta.id,
    label: meta.label,
    description: meta.description,
    enabled: meta.enabled,
    publishTool: meta.publishTool,
    titleMaxLength: meta.titleMaxLength,
    loginCheckUrl: meta.loginCheckUrl ?? '',
    agentHint: meta.agentHint
  }
}
