import { execFile } from 'child_process'
import { existsSync } from 'fs'
import { extname, join, basename } from 'path'
import { promisify } from 'util'
import { queryBundledResourcesRoot } from '../store/resources'

const execFileAsync = promisify(execFile)

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.tif', '.tiff', '.heic'])

export type LocalOcrResult =
  | { ok: true; text: string; engine: 'macos-vision' }
  | { ok: false; error: string; engine?: string }

function queryOcrDir(): string {
  return join(queryBundledResourcesRoot(), 'ocr')
}

/** 预编译二进制（pack 时生成）；开发态可手动 swiftc */
export function queryLocalOcrBinaryPath(): string {
  return join(queryOcrDir(), 'RecognizeText')
}

export function queryLocalOcrScriptPath(): string {
  return join(queryOcrDir(), 'RecognizeText.swift')
}

export function queryIsLocalOcrImagePath(filePath: string): boolean {
  return IMAGE_EXT.has(extname(filePath).toLowerCase())
}

/**
 * 本机图片文字识别。
 * macOS：系统 Vision 框架（与 Live Text 同源），优先跑预编译二进制，否则 `swift` 解释脚本。
 * 不依赖云端视觉模型，避免文本 API 收到 image_url 报 400。
 */
export async function queryLocalImageOcr(filePath: string): Promise<LocalOcrResult> {
  const abs = String(filePath ?? '').trim()
  if (!abs) return { ok: false, error: '路径为空' }
  if (!existsSync(abs)) return { ok: false, error: '文件不存在' }
  if (!queryIsLocalOcrImagePath(abs)) {
    return { ok: false, error: '非支持的图片格式' }
  }

  if (process.platform !== 'darwin') {
    return { ok: false, error: '本机 OCR 当前仅支持 macOS Vision' }
  }

  const binary = queryLocalOcrBinaryPath()
  const script = queryLocalOcrScriptPath()

  let command: string
  let args: string[]
  if (existsSync(binary)) {
    command = binary
    args = [abs]
  } else if (existsSync(script) && existsSync('/usr/bin/swift')) {
    command = '/usr/bin/swift'
    args = [script, abs]
  } else {
    return {
      ok: false,
      error: `OCR 工具缺失（需 ${binary} 或 ${script} + swift）`
    }
  }

  try {
    const { stdout } = await execFileAsync(command, args, {
      timeout: 60_000,
      maxBuffer: 4 * 1024 * 1024,
      env: {
        ...process.env,
        SWIFT_DETERMINISTIC_HASHING: '1'
      }
    })
    return { ok: true, text: String(stdout ?? '').trim(), engine: 'macos-vision' }
  } catch (e) {
    const err = e as { message?: string; stderr?: string | Buffer }
    const detail =
      (typeof err.stderr === 'string' && err.stderr.trim()) ||
      (Buffer.isBuffer(err.stderr) && err.stderr.toString('utf8').trim()) ||
      err.message ||
      String(e)
    return { ok: false, error: detail.slice(0, 500), engine: 'macos-vision' }
  }
}

/**
 * 对附件中的图片逐张 OCR，拼成可注入用户消息的文本块。
 */
export async function queryLocalOcrBlocksForAttachments(
  attachmentPaths: string[]
): Promise<string[]> {
  const blocks: string[] = []
  for (const raw of attachmentPaths) {
    const path = String(raw ?? '').trim()
    if (!path || !queryIsLocalOcrImagePath(path)) continue
    const name = basename(path)
    const result = await queryLocalImageOcr(path)
    if (result.ok) {
      if (result.text) {
        blocks.push(`[本机识字 · ${name}]\n${result.text}`)
      } else {
        blocks.push(`[本机识字 · ${name}]\n（未识别到文字）`)
      }
    } else {
      blocks.push(`[本机识字 · ${name}]\n（识别失败：${result.error}）`)
    }
  }
  return blocks
}

/** 是否具备本机 OCR 运行条件 */
export function queryLocalOcrAvailable(): boolean {
  if (process.platform !== 'darwin') return false
  if (existsSync(queryLocalOcrBinaryPath())) return true
  return existsSync(queryLocalOcrScriptPath()) && existsSync('/usr/bin/swift')
}
