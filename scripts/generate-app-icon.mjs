#!/usr/bin/env node
/**
 * 从 resources/lingxi-avatar.png 生成 electron-builder 打包所需的桌面应用图标。
 * - 去除外围白色背景（保留图标内白色图形）
 * - macOS: build/icon.icns；通用源图: build/icon.png
 * - 同步更新 src/assets 与 src/public 中的头像
 */
import { existsSync, mkdirSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'
import sharp from 'sharp'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const src = join(root, 'resources/lingxi-avatar.png')
const buildDir = join(root, 'build')
const iconsetDir = join(buildDir, 'icon.iconset')

/** 与 UI 共用的头像副本，保持与 resources 源图一致 */
const avatarCopies = [
  join(root, 'src/assets/lingxi-avatar.png'),
  join(root, 'src/public/lingxi-avatar.png')
]

/** 侧边栏 / favicon 用小图，避免 900KB+ PNG 进入 renderer 包 */
const avatarSmCopies = [
  join(root, 'src/assets/lingxi-avatar-sm.webp'),
  join(root, 'src/public/lingxi-avatar-sm.webp')
]

if (!existsSync(src)) {
  console.error(`[generate-app-icon] 源图不存在: ${src}`)
  process.exit(1)
}

/**
 * 从四边泛洪填充近白色像素并设为透明。
 * 仅去除与画布边缘连通的白色区域，不影响蓝色图标内的白色「灵」字图形。
 */
async function removeOuterWhiteBackground(inputPath) {
  const { data, info } = await sharp(inputPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width, height, channels } = info
  const pixels = new Uint8Array(data)

  const isNearWhite = (byteIndex) => {
    const r = pixels[byteIndex]
    const g = pixels[byteIndex + 1]
    const b = pixels[byteIndex + 2]
    return r > 235 && g > 235 && b > 235
  }

  const visited = new Uint8Array(width * height)
  const queue = []

  // 从四边种子点开始泛洪
  for (let x = 0; x < width; x++) {
    for (const y of [0, height - 1]) {
      const idx = y * width + x
      if (!visited[idx] && isNearWhite(idx * channels)) {
        visited[idx] = 1
        queue.push(idx)
      }
    }
  }
  for (let y = 0; y < height; y++) {
    for (const x of [0, width - 1]) {
      const idx = y * width + x
      if (!visited[idx] && isNearWhite(idx * channels)) {
        visited[idx] = 1
        queue.push(idx)
      }
    }
  }

  while (queue.length) {
    const idx = queue.pop()
    const x = idx % width
    const y = Math.floor(idx / width)
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1]
    ]) {
      const nx = x + dx
      const ny = y + dy
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue
      const nidx = ny * width + nx
      if (visited[nidx] || !isNearWhite(nidx * channels)) continue
      visited[nidx] = 1
      queue.push(nidx)
    }
  }

  for (let idx = 0; idx < width * height; idx++) {
    if (visited[idx]) {
      pixels[idx * channels + 3] = 0
    }
  }

  return sharp(pixels, { raw: { width, height, channels } }).png().toBuffer()
}

const sizes = [
  ['16', 'icon_16x16.png'],
  ['32', 'icon_16x16@2x.png'],
  ['32', 'icon_32x32.png'],
  ['64', 'icon_32x32@2x.png'],
  ['128', 'icon_128x128.png'],
  ['256', 'icon_128x128@2x.png'],
  ['256', 'icon_256x256.png'],
  ['512', 'icon_256x256@2x.png'],
  ['512', 'icon_512x512.png'],
  ['1024', 'icon_512x512@2x.png']
]

mkdirSync(buildDir, { recursive: true })

const transparentPng = await removeOuterWhiteBackground(src)

// 写回源图与 UI 副本
await sharp(transparentPng).toFile(src)
for (const copyPath of avatarCopies) {
  mkdirSync(dirname(copyPath), { recursive: true })
  await sharp(transparentPng).toFile(copyPath)
}

// 64px WebP 供 UI 内联引用，显著减小首包体积
const avatarSmBuffer = await sharp(transparentPng).resize(64, 64).webp({ quality: 86 }).toBuffer()
for (const copyPath of avatarSmCopies) {
  mkdirSync(dirname(copyPath), { recursive: true })
  await sharp(avatarSmBuffer).toFile(copyPath)
}

await sharp(transparentPng).toFile(join(buildDir, 'icon.png'))

rmSync(iconsetDir, { recursive: true, force: true })
mkdirSync(iconsetDir, { recursive: true })

for (const [size, name] of sizes) {
  const out = join(iconsetDir, name)
  await sharp(transparentPng).resize(Number(size), Number(size)).png().toFile(out)
}

execSync(`iconutil -c icns "${iconsetDir}" -o "${join(buildDir, 'icon.icns')}"`, {
  stdio: 'inherit'
})
rmSync(iconsetDir, { recursive: true, force: true })

console.log('[generate-app-icon] 已生成透明背景图标：build/icon.png、build/icon.icns、lingxi-avatar-sm.webp')
