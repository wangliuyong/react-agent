#!/usr/bin/env node
/**
 * Playwright Chromium 国内加速安装。
 *
 * 背景：Playwright ≥1.58 的 Chromium 走 Chrome for Testing，官方 URL 带 builds/cft/，
 * 而 npmmirror 的 chrome-for-testing 路径没有该前缀，直接设 PLAYWRIGHT_DOWNLOAD_HOST 会 404。
 * 本脚本把 dry-run 得到的下载地址改写到 npmmirror，再手动解压到 Playwright 缓存目录。
 */
import { spawnSync, execSync } from 'node:child_process'
import { createWriteStream, existsSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { pipeline } from 'node:stream/promises'
import { homedir, platform as osPlatform, arch as osArch } from 'node:os'
import { Readable } from 'node:stream'

const MIRROR_CFT = 'https://cdn.npmmirror.com/binaries/chrome-for-testing'
const MIRROR_PW = 'https://cdn.npmmirror.com/binaries/playwright'

function getDefaultBrowsersPath() {
  const fromEnv = process.env.PLAYWRIGHT_BROWSERS_PATH
  // Cursor/沙箱会注入临时 PLAYWRIGHT_BROWSERS_PATH，安装到那里对用户本机无效
  const isSandboxPath =
    !fromEnv ||
    fromEnv === '0' ||
    /cursor-sandbox-cache|\/var\/folders\//.test(fromEnv)

  if (fromEnv && !isSandboxPath) {
    return fromEnv
  }

  const home = homedir()
  if (process.platform === 'darwin') {
    return join(home, 'Library', 'Caches', 'ms-playwright')
  }
  if (process.platform === 'win32') {
    return join(process.env.LOCALAPPDATA || join(home, 'AppData', 'Local'), 'ms-playwright')
  }
  return join(home, '.cache', 'ms-playwright')
}

/** 把官方 dry-run URL 改写成 npmmirror */
function toMirrorUrl(officialUrl) {
  // Chrome for Testing: .../builds/cft/{ver}/{platform}/chrome-*.zip
  const cft = officialUrl.match(
    /\/builds\/cft\/([^/]+)\/([^/]+)\/(chrome[^/]+\.zip)/
  )
  if (cft) {
    const [, ver, plat, file] = cft
    return `${MIRROR_CFT}/${ver}/${plat}/${file}`
  }

  // ffmpeg / 其它 playwright builds（去掉 dbazure 前缀）
  const pw = officialUrl.match(/\/(?:dbazure\/download\/playwright\/)?builds\/(.+\.zip)/)
  if (pw) {
    return `${MIRROR_PW}/builds/${pw[1]}`
  }

  return null
}

function parseDryRun(output) {
  const items = []
  const locRe = /Install location:\s+(\S+)/g
  const urlRe = /Download url:\s+(\S+)/g
  const locs = [...output.matchAll(locRe)].map((m) => m[1])
  const urls = [...output.matchAll(urlRe)].map((m) => m[1])
  const names = output
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('Install') && !l.startsWith('Download'))

  // dry-run 每个组件一块：名称行 + location + url（可能还有 fallback）
  let nameIdx = 0
  for (let i = 0; i < Math.min(locs.length, urls.length); i++) {
    const folder = locs[i].split(/[/\\]/).pop()
    items.push({
      name: names[nameIdx] || folder,
      folder,
      downloadUrl: urls[i]
    })
    nameIdx += 1
  }
  return items
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
        console.log(`  … ${pct}% (${(received / 1024 / 1024).toFixed(1)} / ${(total / 1024 / 1024).toFixed(1)} MiB)`)
      }
    }
  }
  await new Promise((resolve, reject) => {
    file.end(() => resolve())
    file.on('error', reject)
  })
  console.log(`✓ 已保存 ${(received / 1024 / 1024).toFixed(1)} MiB`)
}

function unzip(zipPath, destDir) {
  mkdirSync(destDir, { recursive: true })
  if (process.platform === 'win32') {
    execSync(
      `powershell -NoProfile -Command "Expand-Archive -Force -Path '${zipPath}' -DestinationPath '${destDir}'"`,
      { stdio: 'inherit' }
    )
  } else {
    execSync(`unzip -qo "${zipPath}" -d "${destDir}"`, { stdio: 'inherit' })
  }
}

function markInstalled(dir) {
  writeFileSync(join(dir, 'DEPENDENCIES_VALIDATED'), '')
  writeFileSync(join(dir, 'INSTALLATION_COMPLETE'), '')
}

async function main() {
  // 强制用用户真实缓存目录，避免沙箱临时路径
  const browsersPath = getDefaultBrowsersPath()
  process.env.PLAYWRIGHT_BROWSERS_PATH = browsersPath
  mkdirSync(browsersPath, { recursive: true })
  console.log(`缓存目录: ${browsersPath}`)
  console.log(`平台: ${osPlatform()} ${osArch()}`)

  const dry = spawnSync('pnpm', ['exec', 'playwright', 'install', 'chromium', '--dry-run'], {
    encoding: 'utf-8',
    env: { ...process.env, PLAYWRIGHT_BROWSERS_PATH: browsersPath },
    shell: process.platform === 'win32'
  })
  const dryOut = `${dry.stdout || ''}${dry.stderr || ''}`
  if (!dryOut.includes('Download url')) {
    console.error(dryOut)
    throw new Error('playwright --dry-run 失败')
  }

  const items = parseDryRun(dryOut)
  if (!items.length) {
    console.error(dryOut)
    throw new Error('未能解析 dry-run 输出')
  }

  // 有头浏览器场景：装 chromium + ffmpeg 即可，跳过 headless shell 以节省时间
  const selected = items.filter(
    (it) => !/headless.?shell/i.test(it.name) && !/headless.?shell/i.test(it.folder)
  )
  console.log(`将安装 ${selected.length} 个组件（已跳过 headless shell）\n`)

  const tmpDir = join(browsersPath, '.tmp-download')
  mkdirSync(tmpDir, { recursive: true })

  try {
    for (const item of selected) {
      const installDir = join(browsersPath, item.folder)

      if (existsSync(join(installDir, 'INSTALLATION_COMPLETE'))) {
        console.log(`跳过（已安装）: ${item.name}`)
        continue
      }

      const mirrorUrl = toMirrorUrl(item.downloadUrl)
      if (!mirrorUrl) {
        console.warn(`无镜像映射，回退官方: ${item.downloadUrl}`)
      }
      const url = mirrorUrl || item.downloadUrl
      const zipName = decodeURIComponent(url.split('/').pop())
      const zipPath = join(tmpDir, zipName)

      try {
        await download(url, zipPath)
      } catch (err) {
        if (mirrorUrl && url === mirrorUrl) {
          console.warn(`镜像失败，回退官方: ${err.message}`)
          await download(item.downloadUrl, zipPath)
        } else {
          throw err
        }
      }

      if (existsSync(installDir)) {
        rmSync(installDir, { recursive: true, force: true })
      }
      mkdirSync(installDir, { recursive: true })
      console.log(`解压到 ${installDir}`)
      unzip(zipPath, installDir)
      markInstalled(installDir)
      console.log(`✓ 完成: ${item.name}\n`)
    }
    console.log('全部完成。可直接 pnpm dev')
  } finally {
    rmSync(tmpDir, { recursive: true, force: true })
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
