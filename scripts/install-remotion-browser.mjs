#!/usr/bin/env node
/**
 * Remotion Chrome Headless Shell 国内镜像预装。
 * 避免首次 remotion_render 从 Google 官方源慢速下载 ~90MB 导致界面长时间「执行中」。
 */
import { spawnSync } from 'node:child_process'
import { createWriteStream, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'
import { arch, platform } from 'node:os'

const MIRROR_CFT = 'https://cdn.npmmirror.com/binaries/chrome-for-testing'
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..')

/** Remotion 4.0.496 对应 Chrome 版本 */
const CHROME_VERSION = '149.0.7790.0'

function queryPlatformKey() {
  const p = platform()
  const a = arch()
  if (p === 'darwin' && a === 'arm64') return 'mac-arm64'
  if (p === 'darwin') return 'mac-x64'
  if (p === 'win32') return 'win64'
  if (p === 'linux' && a === 'arm64') return 'linux-arm64'
  if (p === 'linux') return 'linux64'
  throw new Error(`不支持的平台: ${p} ${a}`)
}

function queryZipName(platformKey) {
  if (platformKey === 'mac-arm64') return 'chrome-headless-shell-mac-arm64.zip'
  if (platformKey === 'mac-x64') return 'chrome-headless-shell-mac-x64.zip'
  if (platformKey === 'win64') return 'chrome-headless-shell-win64.zip'
  if (platformKey === 'linux64') return 'chrome-headless-shell-linux64.zip'
  if (platformKey === 'linux-arm64') return 'chrome-headless-shell-linux-arm64.zip'
  throw new Error(`未知平台键: ${platformKey}`)
}

function queryRemotionBrowserRoot() {
  return join(ROOT, 'node_modules', '.remotion', 'chrome-headless-shell')
}

function queryOfficialUrl(platformKey) {
  const zip = queryZipName(platformKey)
  return `https://storage.googleapis.com/chrome-for-testing-public/${CHROME_VERSION}/${platformKey}/${zip}`
}

function queryMirrorUrl(platformKey) {
  const zip = queryZipName(platformKey)
  return `${MIRROR_CFT}/${CHROME_VERSION}/${platformKey}/${zip}`
}

async function download(url, dest) {
  mkdirSync(dirname(dest), { recursive: true })
  console.log(`↓ ${url}`)
  const res = await fetch(url, { redirect: 'follow' })
  if (!res.ok || !res.body) {
    throw new Error(`下载失败 HTTP ${res.status}: ${url}`)
  }
  const total = Number(res.headers.get('content-length') || 0)
  let received = 0
  let lastPct = -1
  const file = createWriteStream(dest)
  const reader = res.body.getReader()
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    file.write(Buffer.from(value))
    received += value.byteLength
    if (total > 0) {
      const pct = Math.floor((received / total) * 100)
      if (pct >= lastPct + 10) {
        lastPct = pct
        console.log(
          `  … ${pct}% (${(received / 1024 / 1024).toFixed(1)} / ${(total / 1024 / 1024).toFixed(1)} MiB)`
        )
      }
    }
  }
  await new Promise((resolve, reject) => {
    file.end(() => resolve())
    file.on('error', reject)
  })
}

function unzip(zipPath, destDir) {
  mkdirSync(destDir, { recursive: true })
  if (platform() === 'win32') {
    execSync(
      `powershell -NoProfile -Command "Expand-Archive -Force -Path '${zipPath}' -DestinationPath '${destDir}'"`,
      { stdio: 'inherit' }
    )
  } else {
    execSync(`unzip -qo "${zipPath}" -d "${destDir}"`, { stdio: 'inherit' })
  }
}

function queryIsInstalled(browserRoot, platformKey) {
  const versionPath = join(browserRoot, 'VERSION')
  const shellDir = join(browserRoot, platformKey)
  if (!existsSync(versionPath) || !existsSync(shellDir)) return false
  const version = readFileSync(versionPath, 'utf-8').trim()
  return version === CHROME_VERSION
}

async function main() {
  const platformKey = queryPlatformKey()
  const browserRoot = queryRemotionBrowserRoot()
  mkdirSync(browserRoot, { recursive: true })

  if (queryIsInstalled(browserRoot, platformKey)) {
    console.log(`Remotion Chrome Headless Shell 已就绪（${CHROME_VERSION} / ${platformKey}）`)
    return
  }

  console.log(`安装 Remotion Chrome Headless Shell ${CHROME_VERSION} (${platformKey})…`)
  const tmpDir = join(browserRoot, '.tmp-download')
  mkdirSync(tmpDir, { recursive: true })
  const zipName = queryZipName(platformKey)
  const zipPath = join(tmpDir, zipName)
  const mirrorUrl = queryMirrorUrl(platformKey)
  const officialUrl = queryOfficialUrl(platformKey)

  try {
    try {
      await download(mirrorUrl, zipPath)
    } catch (err) {
      console.warn(`镜像下载失败，回退官方源: ${err instanceof Error ? err.message : err}`)
      await download(officialUrl, zipPath)
    }

    const platformDir = join(browserRoot, platformKey)
    if (existsSync(platformDir)) {
      rmSync(platformDir, { recursive: true, force: true })
    }
    unzip(zipPath, browserRoot)
    writeFileSync(join(browserRoot, 'VERSION'), `${CHROME_VERSION}\n`, 'utf-8')
    console.log('✓ Remotion 浏览器安装完成')
  } finally {
    rmSync(tmpDir, { recursive: true, force: true })
  }

  // 校验 ensureBrowser 可识别
  const check = spawnSync(
    process.execPath,
    ['-e', "import('@remotion/renderer').then(m=>m.ensureBrowser()).then(()=>console.log('ensureBrowser ok'))"],
    { cwd: ROOT, stdio: 'inherit', env: { ...process.env } }
  )
  if (check.status !== 0) {
    console.warn('ensureBrowser 校验未通过，但文件已落盘，可尝试 remotion_render')
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
