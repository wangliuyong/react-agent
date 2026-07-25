#!/usr/bin/env node
/**
 * 将 Remotion Studio 界面文案替换为中文（覆盖 node_modules/@remotion/studio/dist）。
 * 仅替换 JSX/展示用字符串（children、label、placeholder、title 等），避免破坏运行时逻辑。
 */
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync
} from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

/** 解析 --app-root（Electron 打包后 node_modules 所在应用根目录） */
function queryAppRootFromArgv() {
  const idx = process.argv.indexOf('--app-root')
  if (idx >= 0 && process.argv[idx + 1]) {
    return process.argv[idx + 1]
  }
  return join(__dirname, '../../..')
}

/** 在 appRoot 下解析 @remotion/studio 的 dist 目录 */
function queryStudioDistDir(appRoot) {
  const requireFromApp = createRequire(join(appRoot, 'package.json'))
  try {
    const pkgPath = requireFromApp.resolve('@remotion/studio/package.json')
    return { distDir: join(dirname(pkgPath), 'dist'), pkgPath }
  } catch {
    return null
  }
}

/** 解析 @remotion/studio-shared 的 studio-html.js（修改 html lang） */
function queryStudioHtmlPath(appRoot) {
  const requireFromApp = createRequire(join(appRoot, 'package.json'))
  try {
    return requireFromApp.resolve('@remotion/studio-shared/dist/studio-html.js')
  } catch {
    return null
  }
}

function queryReplacementsPath() {
  return join(__dirname, 'replacements.json')
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * 在单文件内容中应用一条英→中替换（限定展示属性，降低误伤概率）。
 */
function applyOneReplacement(content, english, chinese) {
  const e = escapeRegExp(english)
  const zh = chinese.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  const propGroup =
    '(children|label|placeholder|title|tag|durationInFrames|fps)'
  let next = content
  next = next.replace(new RegExp(`${propGroup}:\\s*"${e}"`, 'g'), `$1: "${zh}"`)
  next = next.replace(new RegExp(`return\\s+"${e}";`, 'g'), `return "${zh}";`)
  next = next.replace(new RegExp(`\\["${e}"`, 'g'), `["${zh}"`)
  next = next.replace(new RegExp(`,\\s*"${e}"`, 'g'), `, "${zh}"`)
  return next
}

function walkFiles(dir, onFile) {
  if (!existsSync(dir)) return
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    const st = statSync(full)
    if (st.isDirectory()) {
      walkFiles(full, onFile)
    } else if (/\.(js|mjs)$/.test(name)) {
      onFile(full)
    }
  }
}

function postPatchStudioHtmlLang(htmlPath) {
  if (!htmlPath || !existsSync(htmlPath)) return false
  const raw = readFileSync(htmlPath, 'utf8')
  if (!raw.includes('lang="en"')) return false
  writeFileSync(htmlPath, raw.replace('lang="en"', 'lang="zh-CN"'), 'utf8')
  return true
}

/**
 * 应用 Studio 汉化补丁。
 * @returns {{ ok: boolean; message: string; filesPatched: number }}
 */
export function postApplyRemotionStudioZh(options = {}) {
  const appRoot = options.appRoot ?? queryAppRootFromArgv()
  const silent = Boolean(options.silent)

  const studio = queryStudioDistDir(appRoot)
  if (!studio) {
    const message = '[remotion-studio-zh] 未安装 @remotion/studio，跳过汉化。'
    if (!silent) console.warn(message)
    return { ok: false, message, filesPatched: 0 }
  }

  const replacementsPath = queryReplacementsPath()
  if (!existsSync(replacementsPath)) {
    const message = `[remotion-studio-zh] 缺少词典：${replacementsPath}`
    if (!silent) console.warn(message)
    return { ok: false, message, filesPatched: 0 }
  }

  const replacements = JSON.parse(readFileSync(replacementsPath, 'utf8'))
  const version = JSON.parse(readFileSync(studio.pkgPath, 'utf8')).version
  const markerPath = join(studio.distDir, '.lingxi-studio-zh')
  if (
    !options.force &&
    existsSync(markerPath) &&
    readFileSync(markerPath, 'utf8').trim() === version
  ) {
    const message = `[remotion-studio-zh] 已为 @remotion/studio@${version} 应用汉化，跳过。`
    if (!silent) console.log(message)
    return { ok: true, message, filesPatched: 0 }
  }

  const entries = Object.entries(replacements).sort((a, b) => b[0].length - a[0].length)
  let filesPatched = 0

  walkFiles(studio.distDir, (filePath) => {
    const original = readFileSync(filePath, 'utf8')
    let patched = original
    for (const [en, zh] of entries) {
      if (typeof zh !== 'string' || !en) continue
      patched = applyOneReplacement(patched, en, zh)
    }
    if (patched !== original) {
      writeFileSync(filePath, patched, 'utf8')
      filesPatched += 1
    }
  })

  const htmlPath = queryStudioHtmlPath(appRoot)
  if (postPatchStudioHtmlLang(htmlPath)) {
    filesPatched += 1
  }

  mkdirSync(dirname(markerPath), { recursive: true })
  writeFileSync(markerPath, version, 'utf8')

  const message = `[remotion-studio-zh] 已汉化 Remotion Studio（@remotion/studio@${version}），修改 ${filesPatched} 个文件。`
  if (!silent) console.log(message)
  return { ok: true, message, filesPatched }
}

const isMain =
  process.argv[1] &&
  (process.argv[1].endsWith('apply.mjs') ||
    process.argv[1].includes('apply-remotion-studio-zh'))

if (isMain) {
  const force = process.argv.includes('--force')
  postApplyRemotionStudioZh({ force })
}
