import { create } from 'zustand'
import {
  isNotifyChannelConfigured,
  normalizeChannelKind,
  type PublishChannelMeta,
  type PublishChannelUpsertInput
} from '@shared/publish-channels'
import {
  postDeletePublishChannel,
  postInitPublishChannels,
  postPublishChannel,
  queryPublishChannels,
  syncPublishChannelRegistry
} from '../api'
import { createEmptyChannel } from '../types'

interface ChannelsState {
  channels: PublishChannelMeta[]
  loading: boolean
  hydrate: () => Promise<void>
  createChannelDraft: () => PublishChannelUpsertInput
  saveChannel: (input: PublishChannelUpsertInput) => Promise<PublishChannelMeta>
  removeChannel: (id: string) => Promise<void>
  /** 恢复内置渠道为默认配置，自定义渠道不受影响 */
  initBuiltinChannels: () => Promise<PublishChannelMeta[]>
}

export const useChannelsStore = create<ChannelsState>((set, get) => ({
  channels: [],
  loading: false,

  hydrate: async () => {
    set({ loading: true })
    try {
      let channels = await queryPublishChannels()
      // 首次升级或磁盘为空时，自动写入内置渠道
      if (channels.length === 0) {
        channels = await postInitPublishChannels()
      }
      syncPublishChannelRegistry(channels)
      set({ channels })
    } finally {
      set({ loading: false })
    }
  },

  createChannelDraft: () => createEmptyChannel('publish'),

  saveChannel: async (input) => {
    const saved = await postPublishChannel(input)
    const channels = get().channels
    const exists = channels.some((c) => c.id === saved.id)
    const next = exists
      ? channels.map((c) => (c.id === saved.id ? saved : c))
      : [...channels, saved]
    syncPublishChannelRegistry(next)
    set({ channels: next })
    return saved
  },

  removeChannel: async (id) => {
    await postDeletePublishChannel(id)
    const next = get().channels.filter((c) => c.id !== id)
    syncPublishChannelRegistry(next)
    set({ channels: next })
  },

  initBuiltinChannels: async () => {
    const channels = await postInitPublishChannels()
    syncPublishChannelRegistry(channels)
    set({ channels })
    return channels
  }
}))

/** 已启用发布渠道（工作台 Select 用） */
export function queryEnabledPublishChannelsFromStore(
  channels: PublishChannelMeta[]
): PublishChannelMeta[] {
  return channels.filter((c) => normalizeChannelKind(c.kind) === 'publish' && c.enabled)
}

/** 已启用且已配置的通知渠道（工作台 Select 用） */
export function queryEnabledNotifyChannelsFromStore(
  channels: PublishChannelMeta[]
): PublishChannelMeta[] {
  return channels.filter(
    (c) =>
      normalizeChannelKind(c.kind) === 'notify' &&
      c.enabled &&
      isNotifyChannelConfigured(c)
  )
}

/** @deprecated 请使用 queryEnabledPublishChannelsFromStore */
export function queryEnabledChannelsFromStore(
  channels: PublishChannelMeta[]
): PublishChannelMeta[] {
  return queryEnabledPublishChannelsFromStore(channels)
}
