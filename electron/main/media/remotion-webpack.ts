/**
 * 会话 Remotion 工程不安装 node_modules：依赖应用内包，通过 Webpack resolve/alias 解析。
 * 典型场景：模板 schema.ts（activeSchema）中的 `import { z } from 'zod'`。
 */

import { app } from 'electron'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { createRequire } from 'module'
import { dirname, join } from 'path'
import type { WebpackOverrideFn } from '@remotion/bundler'

const requireFromMain = createRequire(__filename)

/** remotion.config.ts 内标记：已注入应用依赖解析 */
export const REMOTION_APP_DEPS_CONFIG_MARKER = 'LINGXI_REMOTION_APP_DEPS'

/**
 * 与 remotion-sfx.ts 保持一致的字面量（避免循环依赖，不从此处 import remotion-sfx）。
 * 会话工程内启用 @remotion/sfx 的标记文件名。
 */
const REMOTION_SFX_MARKER_FILE = '.remotion-sfx-enabled'

/** remotion.config.ts 内 sfx 标记（与 remotion-sfx.ts 一致） */
const REMOTION_SFX_CONFIG_MARKER = 'LINGXI_REMOTION_SFX_WEBPACK'

/** 解析应用 node_modules 目录（Studio / 渲染共用） */
export function queryAppNodeModulesDir(): string {
  try {
    return join(app.getAppPath(), 'node_modules')
  } catch {
    // 单测或非 Electron 上下文：回退到仓库根 node_modules
    return join(dirname(__filename), '../../../node_modules')
  }
}

/** 解析应用内已安装的 zod 入口（schema / @remotion/zod-types 依赖） */
export function queryRemotionZodModulePath(): string {
  return requireFromMain.resolve('zod')
}

/** 可选：@remotion/zod-types（部分模板可能引用） */
export function queryRemotionZodTypesModulePath(): string | null {
  try {
    return requireFromMain.resolve('@remotion/zod-types')
  } catch {
    return null
  }
}

/**
 * Webpack override：把应用 node_modules 与 zod 等依赖加入解析路径。
 * Remotion 默认只 alias 了 react/remotion，会话工程里的 zod 会报 Cannot find module。
 */
export function queryRemotionAppDepsWebpackOverride(): WebpackOverrideFn {
  const appNodeModules = queryAppNodeModulesDir()
  const zodPath = queryRemotionZodModulePath()
  const zodTypesPath = queryRemotionZodTypesModulePath()

  return (currentConfig) => {
    const prevModules = currentConfig.resolve?.modules
    const modules = Array.isArray(prevModules) ? [...prevModules] : ['node_modules']
    if (!modules.includes(appNodeModules)) {
      modules.push(appNodeModules)
    }

    const prevAlias = currentConfig.resolve?.alias
    const alias =
      typeof prevAlias === 'object' && prevAlias !== null ? { ...prevAlias } : {}

    Object.assign(alias, {
      zod: zodPath,
      ...(zodTypesPath ? { '@remotion/zod-types': zodTypesPath } : {})
    })

    return {
      ...currentConfig,
      resolve: {
        ...currentConfig.resolve,
        modules,
        alias
      }
    }
  }
}

/**
 * 组合应用依赖解析 + 可选 @remotion/sfx alias（供 @remotion/bundler bundle 使用）。
 */
export function queryComposeRemotionWebpackOverride(
  projectDir: string
): WebpackOverrideFn {
  const appDepsOverride = queryRemotionAppDepsWebpackOverride()

  return (currentConfig) => {
    let next = appDepsOverride(currentConfig)

    const markerPath = join(projectDir, REMOTION_SFX_MARKER_FILE)
    if (existsSync(markerPath)) {
      const sfxEsmPath = readFileSync(markerPath, 'utf-8').trim()
      if (sfxEsmPath) {
        const prevAlias = next.resolve?.alias
        next = {
          ...next,
          resolve: {
            ...next.resolve,
            alias: {
              ...(typeof prevAlias === 'object' && prevAlias !== null ? prevAlias : {}),
              '@remotion/sfx': sfxEsmPath
            }
          }
        }
      }
    }

    return next
  }
}

/**
 * 写入/覆盖会话工程 remotion.config.ts：
 * - 始终注入应用依赖 resolve（zod 等）
 * - 若已启用 sfx，一并注入 @remotion/sfx alias
 * @returns 是否实际写入了新内容（用于决定是否需重启 Studio）
 */
export function postEnsureRemotionWebpackConfig(projectDir: string): boolean {
  const configPath = join(projectDir, 'remotion.config.ts')
  const appNodeModules = queryAppNodeModulesDir().replace(/\\/g, '/')
  const zodPath = queryRemotionZodModulePath().replace(/\\/g, '/')
  const zodTypesPath = queryRemotionZodTypesModulePath()?.replace(/\\/g, '/') ?? null

  const markerPath = join(projectDir, REMOTION_SFX_MARKER_FILE)
  let sfxEsmPath: string | null = null
  if (existsSync(markerPath)) {
    const raw = readFileSync(markerPath, 'utf-8').trim()
    sfxEsmPath = raw ? raw.replace(/\\/g, '/') : null
  }

  const aliasLines = [
    `      zod: '${zodPath}',`,
    ...(zodTypesPath ? [`      '@remotion/zod-types': '${zodTypesPath}',`] : []),
    ...(sfxEsmPath ? [`      '@remotion/sfx': '${sfxEsmPath}',`] : [])
  ].join('\n')

  const source = `import { Config } from '@remotion/cli/config'

/** 渲染输出覆盖同名文件，避免 Agent 重复渲染失败 */
Config.setOverwriteOutput(true)
Config.setVideoImageFormat('jpeg')

// ${REMOTION_APP_DEPS_CONFIG_MARKER} — 会话工程无 node_modules，解析应用内依赖（zod 等）
${sfxEsmPath ? `// ${REMOTION_SFX_CONFIG_MARKER} — 按需启用 @remotion/sfx（灵犀应用内官方音效库）\n` : ''}Config.overrideWebpackConfig((currentConfig) => ({
  ...currentConfig,
  resolve: {
    ...currentConfig.resolve,
    modules: [
      ...(Array.isArray(currentConfig.resolve?.modules)
        ? currentConfig.resolve.modules
        : ['node_modules']),
      '${appNodeModules}',
    ],
    alias: {
      ...(currentConfig.resolve?.alias ?? {}),
${aliasLines}
    },
  },
}))
`

  const prev = existsSync(configPath) ? readFileSync(configPath, 'utf-8') : ''
  if (prev === source) return false
  writeFileSync(configPath, source, 'utf-8')
  return true
}
