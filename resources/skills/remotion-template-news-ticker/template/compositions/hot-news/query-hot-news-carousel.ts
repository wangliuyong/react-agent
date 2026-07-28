/**
 * 热点新闻主段轮播：支持 Agent 指定每条秒数，否则按主段均分；超时后循环。
 * 主标题与分条条带共用同一套索引，避免两处内容不同步。
 */
export interface HotNewsCarouselSlot {
  /** 当前条目索引（对 itemCount 取模循环） */
  index: number
  /** 当前条目内的相对帧，用于入场 spring */
  localFrame: number
  /** 每条占用的帧数 */
  slotFrames: number
}

export interface QueryHotNewsCarouselSlotInput {
  frame: number
  fps: number
  mainDurationInFrames: number
  itemCount: number
  /**
   * Agent 指定的每条展示秒数；合法范围约 3–15 秒。
   * 未提供时回退为「主段时长 / 条数」均分，且不少于 3 秒。
   */
  secondsPerItem?: number
  /** 各条独立秒数（与 items[].seconds 对齐）；某条缺省则用 secondsPerItem */
  itemSeconds?: Array<number | undefined>
}

const MIN_SECONDS_PER_ITEM = 3
const MAX_SECONDS_PER_ITEM = 15

/** 将秒数钳制到可读区间 */
export function queryClampHotNewsItemSeconds(seconds: number): number {
  if (!Number.isFinite(seconds)) return MIN_SECONDS_PER_ITEM
  return Math.min(MAX_SECONDS_PER_ITEM, Math.max(MIN_SECONDS_PER_ITEM, seconds))
}

/**
 * 计算主内容段内当前应展示的条目。
 * 若提供 per-item 秒数表，则按变长时间轴累计切段；否则用统一 slot 循环。
 */
export function queryHotNewsCarouselSlot(
  frameOrInput: number | QueryHotNewsCarouselSlotInput,
  fpsArg?: number,
  mainDurationInFramesArg?: number,
  itemCountArg?: number,
  secondsPerItemArg?: number
): HotNewsCarouselSlot {
  /** 兼容旧签名 (frame, fps, mainDuration, count) 与新对象入参 */
  const input: QueryHotNewsCarouselSlotInput =
    typeof frameOrInput === 'object'
      ? frameOrInput
      : {
          frame: frameOrInput,
          fps: fpsArg ?? 30,
          mainDurationInFrames: mainDurationInFramesArg ?? 1,
          itemCount: itemCountArg ?? 1,
          secondsPerItem: secondsPerItemArg
        }

  const { frame, fps, mainDurationInFrames, itemCount, secondsPerItem, itemSeconds } =
    input
  const count = Math.max(1, itemCount)
  const safeFrame = Math.max(0, frame)
  const defaultSeconds =
    secondsPerItem != null
      ? queryClampHotNewsItemSeconds(secondsPerItem)
      : queryClampHotNewsItemSeconds(mainDurationInFrames / fps / count)

  const hasPerItem =
    Array.isArray(itemSeconds) &&
    itemSeconds.length > 0 &&
    itemSeconds.some((s) => s != null && Number.isFinite(s))

  if (hasPerItem) {
    const secondsList = Array.from({ length: count }, (_, i) =>
      queryClampHotNewsItemSeconds(
        itemSeconds![i] != null && Number.isFinite(itemSeconds![i]!)
          ? Number(itemSeconds![i])
          : defaultSeconds
      )
    )
    const framesList = secondsList.map((s) => Math.max(1, Math.floor(s * fps)))
    const cycleFrames = framesList.reduce((sum, n) => sum + n, 0)
    let cursor = cycleFrames > 0 ? safeFrame % cycleFrames : 0
    for (let i = 0; i < count; i += 1) {
      const slot = framesList[i] ?? 1
      if (cursor < slot) {
        return { index: i, localFrame: cursor, slotFrames: slot }
      }
      cursor -= slot
    }
    return { index: 0, localFrame: 0, slotFrames: framesList[0] ?? 1 }
  }

  const minSlotFrames = Math.max(1, Math.floor(fps * MIN_SECONDS_PER_ITEM))
  const fromAgent =
    secondsPerItem != null
      ? Math.max(1, Math.floor(fps * queryClampHotNewsItemSeconds(secondsPerItem)))
      : null
  const evenly = Math.max(1, Math.floor(mainDurationInFrames / count))
  const slotFrames = fromAgent ?? Math.max(minSlotFrames, evenly)
  const index = Math.floor(safeFrame / slotFrames) % count
  const localFrame = safeFrame % slotFrames
  return { index, localFrame, slotFrames }
}
