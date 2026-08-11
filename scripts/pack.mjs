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
import { readFileSync, writeFileSync } from 'node:fs'
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

  // macOS 本机 OCR：打包前编译 Vision 二进制（随 resources 拷贝进安装包）
  if (platform === 'mac' || platform === 'mac:arm64' || platform === 'mac:x64') {
    const ocrSwift = join(root, 'resources/ocr/RecognizeText.swift')
    const ocrBin = join(root, 'resources/ocr/RecognizeText')
    console.log('[pack] 编译本机 OCR（macOS Vision）')
    execSync(`swiftc -O -o ${JSON.stringify(ocrBin)} ${JSON.stringify(ocrSwift)}`, {
      cwd: root,
      stdio: 'inherit',
      shell: true
    })
  }

  const ebTail = builderExtraArgs(extraArgs, explicitVersion)
  const builderCmd = ['electron-builder', ...builderPlatformArgs, ...ebTail]
    .map((part) => (/\s/.test(part) ? JSON.stringify(part) : part))
    .join(' ')

  console.log(`[pack] pnpm build`)
  execSync('pnpm build', { cwd: root, stdio: 'inherit' })

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
