#!/usr/bin/env node
/**
 * 将 @remotion/studio 界面文案替换为简体中文。
 * Remotion 官方暂无 Studio i18n，故对已安装包的 dist 做幂等字符串替换。
 *
 * 用法：
 *   node scripts/apply-remotion-studio-zh.mjs
 *   node scripts/apply-remotion-studio-zh.mjs --check
 */

import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  realpathSync,
  statSync,
  writeFileSync
} from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..')
const DICT_PATH = join(ROOT, 'resources', 'remotion', 'studio-zh-dict.json')
const MARKER_NAME = '.lingxi-studio-zh'
/** 词典变更时递增，强制重新打补丁 */
const PATCH_VERSION = '1'

const checkOnly = process.argv.includes('--check')

/**
 * 收集所有需打补丁的 @remotion/studio/dist 目录（含 pnpm 嵌套副本）。
 * @returns {string[]}
 */
function queryStudioDistDirs() {
  const found = new Set()

  const tryAdd = (distDir) => {
    if (!distDir || !existsSync(distDir)) return
    try {
      found.add(realpathSync(distDir))
    } catch {
      found.add(distDir)
    }
  }

  // 通过 require 解析主入口对应的包
  try {
    const requireFromRoot = createRequire(join(ROOT, 'package.json'))
    const pkgJson = requireFromRoot.resolve('@remotion/studio/package.json')
    tryAdd(join(dirname(pkgJson), 'dist'))
  } catch {
    // 依赖尚未安装时跳过
  }

  // 扫描 pnpm 虚拟存储中的全部副本
  const pnpmRoot = join(ROOT, 'node_modules', '.pnpm')
  if (existsSync(pnpmRoot)) {
    for (const entry of readdirSync(pnpmRoot)) {
      if (!entry.startsWith('@remotion+studio@')) continue
      tryAdd(
        join(
          pnpmRoot,
          entry,
          'node_modules',
          '@remotion',
          'studio',
          'dist'
        )
      )
    }
  }

  // 扁平 node_modules 回退
  tryAdd(join(ROOT, 'node_modules', '@remotion', 'studio', 'dist'))

  return [...found]
}

/**
 * 收集 studio-shared 中 HTML 模板路径（改 lang）。
 * @returns {string[]}
 */
function queryStudioHtmlFiles() {
  const files = new Set()
  const tryAdd = (p) => {
    if (p && existsSync(p)) {
      try {
        files.add(realpathSync(p))
      } catch {
        files.add(p)
      }
    }
  }

  try {
    const requireFromRoot = createRequire(join(ROOT, 'package.json'))
    const pkgJson = requireFromRoot.resolve('@remotion/studio-shared/package.json')
    tryAdd(join(dirname(pkgJson), 'dist', 'studio-html.js'))
  } catch {
    // ignore
  }

  const pnpmRoot = join(ROOT, 'node_modules', '.pnpm')
  if (existsSync(pnpmRoot)) {
    for (const entry of readdirSync(pnpmRoot)) {
      if (!entry.startsWith('@remotion+studio-shared@')) continue
      tryAdd(
        join(
          pnpmRoot,
          entry,
          'node_modules',
          '@remotion',
          'studio-shared',
          'dist',
          'studio-html.js'
        )
      )
    }
  }

  return [...files]
}

/**
 * 递归收集目录下 .js / .mjs 文件。
 * @param {string} dir
 * @param {string[]} out
 */
function collectJsFiles(dir, out) {
  if (!existsSync(dir)) return
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    let st
    try {
      st = statSync(p)
    } catch {
      continue
    }
    if (st.isDirectory()) {
      // 跳过类型声明目录外的巨大无关树
      if (name === 'node_modules') continue
      collectJsFiles(p, out)
    } else if (/\.(js|mjs)$/.test(name)) {
      out.push(p)
    }
  }
}

/**
 * 对单文件内容应用词典替换（长词优先，避免短词误伤）。
 * @param {string} content
 * @param {Array<[string, string]>} pairs
 */
function applyDict(content, pairs) {
  let next = content
  for (const [en, zh] of pairs) {
    if (en === zh) continue
    // 仅替换 JS 字符串字面量中的完整片段
    const dq = `"${en}"`
    const sq = `'${en}'`
    if (next.includes(dq)) next = next.split(dq).join(`"${zh}"`)
    if (next.includes(sq)) next = next.split(sq).join(`'${zh}'`)
  }
  return next
}

/**
 * 对某个 studio/dist 目录打补丁。
 * @param {string} distDir
 * @param {Array<[string, string]>} pairs
 * @returns {{ changed: boolean, files: number }}
 */
function patchStudioDist(distDir, pairs) {
  const marker = join(distDir, MARKER_NAME)
  if (existsSync(marker)) {
    const ver = readFileSync(marker, 'utf8').trim()
    if (ver === PATCH_VERSION) {
      return { changed: false, files: 0 }
    }
  }

  if (checkOnly) {
    return { changed: true, files: 0 }
  }

  const files = []
  collectJsFiles(distDir, files)
  let touched = 0
  for (const file of files) {
    const before = readFileSync(file, 'utf8')
    const after = applyDict(before, pairs)
    if (after !== before) {
      writeFileSync(file, after, 'utf8')
      touched += 1
    }
  }

  writeFileSync(marker, PATCH_VERSION, 'utf8')
  return { changed: true, files: touched }
}

/**
 * 将 studio HTML 的 lang 改为 zh-CN。
 * @param {string} file
 * @returns {boolean}
 */
function patchStudioHtmlLang(file) {
  const before = readFileSync(file, 'utf8')
  let after = before
  after = after.replace(/lang="en"/g, 'lang="zh-CN"')
  after = after.replace(/lang='en'/g, "lang='zh-CN'")
  if (after === before) return false
  if (checkOnly) return true
  writeFileSync(file, after, 'utf8')
  return true
}

function main() {
  if (!existsSync(DICT_PATH)) {
    console.warn(`[remotion-studio-zh] 词典缺失：${DICT_PATH}`)
    process.exit(0)
  }

  /** @type {Record<string, string>} */
  const dict = JSON.parse(readFileSync(DICT_PATH, 'utf8'))
  const pairs = Object.entries(dict).sort((a, b) => b[0].length - a[0].length)

  const dists = queryStudioDistDirs()
  if (dists.length === 0) {
    console.warn('[remotion-studio-zh] 未找到 @remotion/studio，跳过汉化。')
    process.exit(0)
  }

  let needPatch = false
  let totalFiles = 0
  for (const dist of dists) {
    const result = patchStudioDist(dist, pairs)
    if (result.changed) needPatch = true
    totalFiles += result.files
    if (!checkOnly && result.changed) {
      console.log(`[remotion-studio-zh] 已汉化 ${result.files} 个文件：${dist}`)
    }
  }

  for (const html of queryStudioHtmlFiles()) {
    if (patchStudioHtmlLang(html)) {
      needPatch = true
      if (!checkOnly) {
        console.log(`[remotion-studio-zh] 已设置 lang=zh-CN：${html}`)
      }
    }
  }

  if (checkOnly) {
    if (needPatch) {
      console.error('[remotion-studio-zh] Studio 尚未汉化，请运行：pnpm run apply:studio-zh')
      process.exit(1)
    }
    console.log('[remotion-studio-zh] 已是中文补丁状态。')
    return
  }

  if (!needPatch) {
    console.log('[remotion-studio-zh] 中文补丁已是最新，无需重复应用。')
    return
  }

  console.log(`[remotion-studio-zh] 完成，共更新 ${totalFiles} 个文件。`)
}

main()
