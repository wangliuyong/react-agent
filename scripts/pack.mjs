#!/usr/bin/env node
/**
 * Electron 打包入口。
 *
 * - 未指定版本：读取 package.json 的 version，将 patch 段 +1（如 0.1.5 → 0.1.6）并写回。
 * - 指定版本：使用给定 semver，写回 package.json 后再打包。
 *
 * 指定版本的方式（任选其一）：
 *   pnpm pack:mac -- 0.2.0
 *   PACK_VERSION=0.2.0 pnpm pack:mac
 *
 * 平台参数（由 package.json scripts 传入）：
 *   mac | mac:arm64 | mac:x64 | win
 */
import { execSync } from 'node:child_process'
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const pkgPath = join(root, 'package.json')

/** electron-builder 平台与 CLI 参数映射 */
const PLATFORM_BUILDER_ARGS = {
  mac: ['--mac'],
  'mac:arm64': ['--mac', '--arm64'],
  'mac:x64': ['--mac', '--x64'],
  win: ['--win', '--x64'],
}

const SEMVER_CORE = /^\d+\.\d+\.\d+$/

/**
 * 判断是否为 x.y.z 形式的核心版本号（不含 prerelease/build）。
 * @param {string} value
 */
function isSemverCore(value) {
  return SEMVER_CORE.test(value.trim())
}

/**
 * 将 patch 段 +1，仅处理主版本.次版本.修订号 三段式。
 * @param {string} version
 * @returns {string}
 */
function bumpPatchVersion(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)(?:-.+)?$/.exec(version.trim())
  if (!match) {
    throw new Error(`无法解析版本号「${version}」，需要形如 0.1.5`)
  }
  const patch = Number(match[3]) + 1
  return `${match[1]}.${match[2]}.${patch}`
}

/**
 * 从环境变量、pnpm 透传参数中解析目标版本；未指定则返回 null。
 * @param {string[]} extraArgs `pnpm pack:mac -- ...` 之后的参数
 */
function resolveExplicitVersion(extraArgs) {
  const fromEnv = process.env.PACK_VERSION?.trim()
  if (fromEnv) {
    if (!isSemverCore(fromEnv)) {
      throw new Error(`PACK_VERSION 无效：${fromEnv}，需要形如 0.1.6`)
    }
    return fromEnv
  }

  const first = extraArgs[0]?.trim()
  if (first && isSemverCore(first)) {
    return first
  }

  return null
}

/**
 * 更新 package.json 中的 version 字段。
 * @param {string} nextVersion
 */
function writePackageVersion(nextVersion) {
  const raw = readFileSync(pkgPath, 'utf-8')
  const pkg = JSON.parse(raw)
  const previous = pkg.version
  pkg.version = nextVersion
  writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`, 'utf-8')
  console.log(`[pack] 版本 ${previous} → ${nextVersion}`)
}

/**
 * 解析 electron-builder 额外参数（去掉已用作版本号的首个 semver）。
 * @param {string[]} extraArgs
 * @param {string | null} explicitVersion
 */
function builderExtraArgs(extraArgs, explicitVersion) {
  if (!explicitVersion) {
    return extraArgs
  }
  if (extraArgs[0]?.trim() === explicitVersion) {
    return extraArgs.slice(1)
  }
  return extraArgs
}

/**
 * 生成需从安装包中剔除的跨平台原生二进制 glob。
 * Remotion / rspack / esbuild 会把多平台 optional 包放进依赖树，
 * 若不按目标架构排除，mac arm64 包会多出数百 MB。
 *
 * @param {string} platformKey pack 脚本平台键（mac | mac:arm64 | mac:x64 | win）
 * @returns {string[]}
 */
function nativeBinaryExcludeGlobs(platformKey) {
  /** @type {string[]} */
  const excludes = []

  /**
   * 追加某一平台族的排除规则（同时覆盖扁平 node_modules 与 pnpm 虚拟路径）。
   * @param {string} scopePkg 如 `@esbuild/darwin-x64` 或 `@rspack/binding-win32-x64-msvc`
   */
  const excludePkg = (scopePkg) => {
    excludes.push(`!**/node_modules/${scopePkg}`)
    excludes.push(`!**/node_modules/${scopePkg}/**`)
    // pnpm：@scope/name → @scope+name@…
    const plus = scopePkg.replace('/', '+')
    excludes.push(`!**/node_modules/.pnpm/${plus}@*`)
    excludes.push(`!**/node_modules/.pnpm/${plus}@*/**`)
  }

  const isMac = platformKey === 'mac' || platformKey.startsWith('mac:')
  const isWin = platformKey === 'win'

  // mac 包不需要 Windows 原生二进制
  if (isMac) {
    for (const name of [
      '@esbuild/win32-arm64',
      '@esbuild/win32-ia32',
      '@esbuild/win32-x64',
      '@rspack/binding-win32-arm64-msvc',
      '@rspack/binding-win32-ia32-msvc',
      '@rspack/binding-win32-x64-msvc',
      '@remotion/compositor-win32-x64-msvc',
    ]) {
      excludePkg(name)
    }
  }

  // Windows 包不需要 darwin 原生二进制
  if (isWin) {
    for (const name of [
      '@esbuild/darwin-arm64',
      '@esbuild/darwin-x64',
      '@rspack/binding-darwin-arm64',
      '@rspack/binding-darwin-x64',
      '@remotion/compositor-darwin-arm64',
      '@remotion/compositor-darwin-x64',
    ]) {
      excludePkg(name)
    }
  }

  // 按目标 CPU 去掉另一边的 darwin / win 二进制
  const arch =
    platformKey === 'mac:arm64'
      ? 'arm64'
      : platformKey === 'mac:x64' || platformKey === 'win'
        ? 'x64'
        : process.arch === 'arm64'
          ? 'arm64'
          : 'x64'

  if (isMac) {
    const dropArch = arch === 'arm64' ? 'x64' : 'arm64'
    for (const name of [
      `@esbuild/darwin-${dropArch}`,
      `@rspack/binding-darwin-${dropArch}`,
      `@remotion/compositor-darwin-${dropArch}`,
    ]) {
      excludePkg(name)
    }
  }

  if (isWin && arch === 'x64') {
    for (const name of [
      '@rspack/binding-win32-arm64-msvc',
      '@rspack/binding-win32-ia32-msvc',
      '@esbuild/win32-arm64',
      '@esbuild/win32-ia32',
    ]) {
      excludePkg(name)
    }
  }

  return excludes
}

/**
 * 写出合并了架构排除规则的临时 electron-builder 配置，避免把异架构原生包打进安装包。
 * @param {object} buildConfig package.json 的 build 字段
 * @param {string} platformKey
 * @returns {string} 配置文件路径
 */
function writePackBuilderConfig(buildConfig, platformKey) {
  const outDir = join(root, 'dist')
  mkdirSync(outDir, { recursive: true })
  const configPath = join(outDir, 'electron-builder.pack.json')
  const archExcludes = nativeBinaryExcludeGlobs(platformKey)
  const files = [
    ...(Array.isArray(buildConfig.files) ? buildConfig.files : ['**/*']),
    ...archExcludes,
  ]
  const config = {
    ...buildConfig,
    files,
  }
  writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, 'utf-8')
  console.log(`[pack] 已排除异架构原生二进制 ${archExcludes.length} 条规则 → ${configPath}`)
  return configPath
}

/**
 * 解析目标 OS / CPU，用于决定保留哪一套原生 optional 包。
 * @param {string} platformKey
 * @returns {{ os: 'darwin' | 'win32', arch: 'arm64' | 'x64' }}
 */
function resolveNativeTarget(platformKey) {
  if (platformKey === 'win') {
    return { os: 'win32', arch: 'x64' }
  }
  if (platformKey === 'mac:arm64') {
    return { os: 'darwin', arch: 'arm64' }
  }
  if (platformKey === 'mac:x64') {
    return { os: 'darwin', arch: 'x64' }
  }
  return {
    os: 'darwin',
    arch: process.arch === 'arm64' ? 'arm64' : 'x64',
  }
}

/**
 * 判断 pnpm 虚拟目录名是否为「当前打包目标」应保留的原生包。
 * @param {string} dirName
 * @param {{ os: string, arch: string }} target
 */
function shouldKeepPnpmNativeDir(dirName, target) {
  const keepTokens =
    target.os === 'win32'
      ? [`win32-${target.arch}`, `win32-${target.arch}-msvc`]
      : [`darwin-${target.arch}`]

  const families = ['@esbuild+', '@rspack+binding-', '@remotion+compositor-']
  for (const prefix of families) {
    if (!dirName.startsWith(prefix)) {
      continue
    }
    const rest = dirName.slice(prefix.length).replace(/@[^@]+$/, '')
    return keepTokens.some((token) => rest === token || rest.startsWith(`${token}-`))
  }
  return true
}

/**
 * 在打包前从 node_modules/.pnpm 删除异架构原生包。
 * electron-builder 对 files 排除规则在 pnpm optional 依赖上不完全可靠，
 * 物理删除是保证体积的兜底手段。
 * @param {string} platformKey
 */
function pruneForeignNativePackages(platformKey) {
  const target = resolveNativeTarget(platformKey)
  const pnpmDir = join(root, 'node_modules', '.pnpm')
  let removed = 0
  for (const name of readdirSync(pnpmDir)) {
    if (
      !name.startsWith('@esbuild+') &&
      !name.startsWith('@rspack+binding-') &&
      !name.startsWith('@remotion+compositor-')
    ) {
      continue
    }
    if (shouldKeepPnpmNativeDir(name, target)) {
      continue
    }
    rmSync(join(pnpmDir, name), { recursive: true, force: true })
    removed += 1
  }
  console.log(`[pack] 已清理异架构原生包 ${removed} 个（保留 ${target.os}-${target.arch}）`)
}

function main() {
  const platform = process.argv[2]
  const extraArgs = process.argv.slice(3)

  const builderPlatformArgs = PLATFORM_BUILDER_ARGS[platform]
  if (!builderPlatformArgs) {
    console.error(`[pack] 未知平台「${platform}」，支持：${Object.keys(PLATFORM_BUILDER_ARGS).join(', ')}`)
    process.exit(1)
  }

  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
  const explicitVersion = resolveExplicitVersion(extraArgs)
  const nextVersion = explicitVersion ?? bumpPatchVersion(pkg.version)

  if (!isSemverCore(nextVersion)) {
    throw new Error(`目标版本无效：${nextVersion}`)
  }

  writePackageVersion(nextVersion)

  // writePackageVersion 已改写 package.json，重新读取以拿到最新 build 配置
  const pkgAfter = JSON.parse(readFileSync(pkgPath, 'utf-8'))
  const ebTail = builderExtraArgs(extraArgs, explicitVersion)
  const packConfigPath = writePackBuilderConfig(pkgAfter.build ?? {}, platform)
  const builderCmd = [
    'electron-builder',
    ...builderPlatformArgs,
    '--config',
    packConfigPath,
    ...ebTail,
  ]
    .map((part) => (/\s/.test(part) ? JSON.stringify(part) : part))
    .join(' ')

  console.log(`[pack] pnpm build`)
  execSync('pnpm build', { cwd: root, stdio: 'inherit' })

  // 必须在 electron-builder 之前执行：否则异架构 optional 仍会被打进 asar
  pruneForeignNativePackages(platform)

  console.log(`[pack] ${builderCmd}`)
  execSync(builderCmd, { cwd: root, stdio: 'inherit', shell: true })
}

try {
  main()
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`[pack] 失败：${message}`)
  process.exit(1)
}
