/**
 * 纯函数：按 compositionId 更新 Root.tsx 源码中对应 <Composition /> 的画幅/时长。
 * 若 id 已存在则只改该块；否则改第一块并把 id 设为目标（兼容旧单 Composition 模板）。
 * 为什么：旧实现全局替换第一个 id，会把 Main 改成 HotNews，与已有 HotNews 冲突。
 */

export interface PatchRootCompositionConfig {
  compositionId: string
  width: number
  height: number
  fps: number
  durationInFrames: number
}

/** 匹配自闭合 <Composition ... />（允许多行） */
const COMPOSITION_BLOCK_RE = /<Composition\b[\s\S]*?\/>/g

function queryEscapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** 在单个 Composition 块内更新 duration/fps/width/height（不改 id） */
function queryPatchCompositionMeta(
  block: string,
  config: Omit<PatchRootCompositionConfig, 'compositionId'>
): string {
  /** 兼容数字字面量与常量引用，如 durationInFrames={HOT_NEWS_WIDE_DURATION} */
  return block
    .replace(
      /durationInFrames=\{[^}]+\}/,
      `durationInFrames={${config.durationInFrames}}`
    )
    .replace(/fps=\{[^}]+\}/, `fps={${config.fps}}`)
    .replace(/width=\{[^}]+\}/, `width={${config.width}}`)
    .replace(/height=\{[^}]+\}/, `height={${config.height}}`)
}

/**
 * 返回补丁后的 Root.tsx 全文。
 * - 目标 id 已存在：只更新该 Composition 的元数据
 * - 目标 id 不存在：更新第一块 Composition，并将其 id 改为目标 id
 */
export function queryPatchRootCompositionSource(
  rootSource: string,
  config: PatchRootCompositionConfig
): string {
  const blocks = [...rootSource.matchAll(COMPOSITION_BLOCK_RE)]
  if (blocks.length === 0) return rootSource

  const idRe = new RegExp(`id=["']${queryEscapeRegExp(config.compositionId)}["']`)
  const targetIdx = blocks.findIndex((m) => idRe.test(m[0]))

  const applyAt = (index: number, nextBlock: string): string => {
    const match = blocks[index]
    const start = match.index ?? 0
    return rootSource.slice(0, start) + nextBlock + rootSource.slice(start + match[0].length)
  }

  if (targetIdx >= 0) {
    const patched = queryPatchCompositionMeta(blocks[targetIdx][0], config)
    return applyAt(targetIdx, patched)
  }

  /** 兼容仅含 Main 的旧模板：把第一块改成目标 compositionId */
  let first = blocks[0][0]
  if (/id=["'][^"']*["']/.test(first)) {
    first = first.replace(/id=["'][^"']*["']/, `id="${config.compositionId}"`)
  } else {
    first = first.replace(
      /<Composition\b/,
      `<Composition\n        id="${config.compositionId}"`
    )
  }
  first = queryPatchCompositionMeta(first, config)
  return applyAt(0, first)
}
