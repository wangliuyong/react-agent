#!/usr/bin/env node
/**
 * 从 resources/lingxi-avatar.png 生成 electron-builder 打包所需的桌面应用图标。
 * macOS: build/icon.icns；通用源图: build/icon.png
 */
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const src = join(root, 'resources/lingxi-avatar.png')
const buildDir = join(root, 'build')
const iconsetDir = join(buildDir, 'icon.iconset')

if (!existsSync(src)) {
  console.error(`[generate-app-icon] 源图不存在: ${src}`)
  process.exit(1)
}

mkdirSync(buildDir, { recursive: true })
cpSync(src, join(buildDir, 'icon.png'))

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

rmSync(iconsetDir, { recursive: true, force: true })
mkdirSync(iconsetDir, { recursive: true })

for (const [size, name] of sizes) {
  const out = join(iconsetDir, name)
  execSync(`sips -z ${size} ${size} "${src}" --out "${out}"`, { stdio: 'inherit' })
}

execSync(`iconutil -c icns "${iconsetDir}" -o "${join(buildDir, 'icon.icns')}"`, {
  stdio: 'inherit'
})
rmSync(iconsetDir, { recursive: true, force: true })

console.log('[generate-app-icon] 已生成 build/icon.png 与 build/icon.icns')
