import type {
  ChannelKind,
  PublishChannelMeta,
  PublishChannelUpsertInput
} from '@shared/publish-channels'

/** 新建渠道表单默认值；kind 由当前 Tab 决定，创建后不可改 */
export function createEmptyChannel(kind: ChannelKind = 'publish'): PublishChannelUpsertInput {
  if (kind === 'notify') {
    return {
      id: '',
      kind: 'notify',
      label: '',
      description: '',
      enabled: true,
      notifyTool: 'notify_message',
      notifyConfig: { webhookUrl: '', secret: '' },
      agentHint: '使用 notify_message 发送；勿在对话中暴露 webhook。'
    }
  }
  return {
    id: '',
    kind: 'publish',
    label: '',
    description: '',
    enabled: true,
    publishTool: '',
    titleMaxLength: undefined,
    loginCheckUrl: '',
    humanized: false,
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
    kind: meta.kind === 'notify' ? 'notify' : 'publish',
    label: meta.label,
    description: meta.description,
    enabled: meta.enabled,
    publishTool: meta.publishTool,
    titleMaxLength: meta.titleMaxLength,
    loginCheckUrl: meta.loginCheckUrl ?? '',
    humanized: Boolean(meta.humanized),
    sdkConfig: {
      appId: meta.sdkConfig?.appId ?? '',
      accessToken: meta.sdkConfig?.accessToken ?? ''
    },
    notifyTool: meta.notifyTool,
    notifyConfig: {
      webhookUrl: meta.notifyConfig?.webhookUrl ?? '',
      secret: meta.notifyConfig?.secret ?? ''
    },
    agentHint: meta.agentHint
  }
}
