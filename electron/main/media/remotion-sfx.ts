/**
 * Remotion 官方 @remotion/sfx 按需接入：会话工程不写 node_modules，通过标记 + Webpack alias 解析。
 */

import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { createRequire } from 'module'
import type { WebpackOverrideFn } from '@remotion/bundler'
import { queryRemotionProjectDir } from './remotion-service'
import { postEnsureRemotionWebpackConfig } from './remotion-webpack'

const requireFromMain = createRequire(__filename)

/** remotion.config.ts 内标记，避免重复注入 */
export const REMOTION_SFX_CONFIG_MARKER = 'LINGXI_REMOTION_SFX_WEBPACK'

/** 会话工程内启用标记文件（内容为 @remotion/sfx ESM 入口绝对路径） */
export const REMOTION_SFX_MARKER_FILE = '.remotion-sfx-enabled'

export interface RemotionSfxEnableResult {
  projectDir: string
  /** 本次是否为重复调用（已启用过） */
  alreadyEnabled: boolean
  sfxModulePath: string
}

/** 解析应用内已安装的 @remotion/sfx ESM 入口（与 remotion 主版本对齐） */
export function queryRemotionSfxModulePath(): string {
  return requireFromMain.resolve('@remotion/sfx/dist/esm/index.mjs')
}

/** 会话工程是否已按需启用 @remotion/sfx */
export function queryIsRemotionSfxEnabled(projectDir: string): boolean {
  return existsSync(join(projectDir, REMOTION_SFX_MARKER_FILE))
}

/**
 * 为会话 Remotion 工程启用官方音效库：
 * - 写入标记文件供渲染 bundle 读取
 * - 更新 remotion.config.ts（含应用依赖 zod + sfx alias），使 Studio 预览也能 resolve
 */
export function postEnableRemotionSfx(sessionId: string): RemotionSfxEnableResult {
  const projectDir = queryRemotionProjectDir(sessionId)
  const entryPoint = join(projectDir, 'src', 'index.ts')
  if (!existsSync(entryPoint)) {
    throw new Error(`找不到 Remotion 入口 ${entryPoint}，请先调用 remotion_init_project`)
  }

  const sfxModulePath = queryRemotionSfxModulePath()
  const markerPath = join(projectDir, REMOTION_SFX_MARKER_FILE)
  const alreadyEnabled = queryIsRemotionSfxEnabled(projectDir)

  writeFileSync(markerPath, sfxModulePath, 'utf-8')
  // 统一写入：应用依赖（zod）+ sfx alias
  postEnsureRemotionWebpackConfig(projectDir)

  return { projectDir, alreadyEnabled, sfxModulePath }
}

/** 渲染/打包时：若已启用，则为 `@remotion/sfx` 配置 Webpack alias */
export function queryRemotionSfxWebpackOverride(projectDir: string): WebpackOverrideFn | undefined {
  const markerPath = join(projectDir, REMOTION_SFX_MARKER_FILE)
  if (!existsSync(markerPath)) return undefined

  const sfxEsmPath = readFileSync(markerPath, 'utf-8').trim()
  if (!sfxEsmPath) return undefined

  return (currentConfig) => ({
    ...currentConfig,
    resolve: {
      ...currentConfig.resolve,
      alias: {
        ...(typeof currentConfig.resolve?.alias === 'object' && currentConfig.resolve.alias !== null
          ? currentConfig.resolve.alias
          : {}),
        '@remotion/sfx': sfxEsmPath
      }
    }
  })
}
