/**
 * 本地占位图：用 ffmpeg lavfi 生成纯色帧，保证无外部 t2i 时也能走合成链路。
 */

import { spawn } from 'child_process'
import { existsSync, mkdirSync } from 'fs'
import { dirname } from 'path'

function queryFfmpegBin(): string {
  for (const bin of ['ffmpeg', '/usr/local/bin/ffmpeg', '/opt/homebrew/bin/ffmpeg']) {
    if (bin === 'ffmpeg' || existsSync(bin)) return bin
  }
  return 'ffmpeg'
}

/**
 * 生成 1280x720 占位 PNG；失败时返回错误信息。
 * 为什么：文生图未配置时仍需可合成的图片路径，避免整条视频管线卡死。
 */
export async function postWritePlaceholderImage(opts: {
  outputPath: string
  label?: string
}): Promise<{ ok: boolean; path?: string; message: string }> {
  mkdirSync(dirname(opts.outputPath), { recursive: true })
  const label = (opts.label ?? 'scene').replace(/[:\\]/g, ' ').slice(0, 40)
  const bin = queryFfmpegBin()
  // drawtext 在部分 ffmpeg 构建中不可用；纯色帧足够 concat 合成
  const args = [
    '-y',
    '-f',
    'lavfi',
    '-i',
    `color=c=0x2c3e50:s=1280x720:d=1`,
    '-frames:v',
    '1',
    opts.outputPath
  ]

  return new Promise((resolve) => {
    const child = spawn(bin, args, { stdio: ['ignore', 'pipe', 'pipe'] })
    let stderr = ''
    child.stderr?.on('data', (chunk: Buffer) => {
      stderr += chunk.toString()
    })
    child.on('error', (err) => {
      resolve({
        ok: false,
        message: `占位图生成失败（ffmpeg 不可用）：${err.message}（镜头：${label}）`
      })
    })
    child.on('close', (code) => {
      if (code === 0 && existsSync(opts.outputPath)) {
        resolve({
          ok: true,
          path: opts.outputPath,
          message: `已生成本地占位图：${opts.outputPath}`
        })
      } else {
        resolve({
          ok: false,
          message: `占位图 ffmpeg 退出码 ${code}：${stderr.slice(-300) || '未知错误'}`
        })
      }
    })
  })
}
