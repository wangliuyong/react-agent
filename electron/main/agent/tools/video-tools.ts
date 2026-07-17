/**
 * 视频管线工具：剧本/分镜落盘 → 场景素材 → 成片合成。
 * 创意写作由 scriptwriter 角色 LLM 完成；本文件负责结构化持久化与媒体 Provider 调用。
 */

import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { queryEncodeWorkflowCtxResult } from './hot-topics'
import {
  querySceneAssetsDir,
  queryTextToImageProvider,
  queryTextToSpeechProvider,
  queryVideoComposeProvider,
  refreshActiveTextToImageProvider,
  refreshActiveTextToSpeechProvider
} from '../../media/provider'
import { getVideosDir } from '../../store/paths'
import type { AgentTool } from './types'

export interface StoryboardShot {
  id: string
  /** 画面描述（给文生图） */
  visual: string
  /** 旁白/台词 */
  narration?: string
  /** 建议时长秒 */
  durationSec?: number
}

export interface StoryboardDoc {
  title: string
  logline?: string
  shots: StoryboardShot[]
}

function queryProjectDir(sessionId: string): string {
  const dir = join(getVideosDir(), 'projects', sessionId)
  mkdirSync(dir, { recursive: true })
  return dir
}

/** 将剧本正文落盘，供后续分镜/成片引用 */
export const generateScriptTool: AgentTool = {
  name: 'generate_script',
  description:
    '将剧本正文保存到本地项目目录。可来自用户上传附件解读后的内容，或一句话扩写后的完整剧本。' +
    '写入 context.scriptPath / scriptText。后续应调用 generate_storyboard。',
  permission: 'sensitive',
  parameters: {
    type: 'object',
    properties: {
      title: { type: 'string', description: '剧名/短视频标题' },
      script: { type: 'string', description: '完整剧本文本（含场次、对白等）' },
      sourcePrompt: {
        type: 'string',
        description: '用户原始一句话/段落（可选，便于追溯）'
      }
    },
    required: ['title', 'script']
  },
  async execute(args, ctx) {
    const title = String(args.title ?? '').trim() || '未命名剧本'
    const script = String(args.script ?? '').trim()
    if (!script) return 'script 不能为空'
    const dir = queryProjectDir(ctx.sessionId)
    const scriptPath = join(dir, 'script.md')
    const body = [
      `# ${title}`,
      '',
      args.sourcePrompt ? `> 用户原话：${String(args.sourcePrompt)}` : '',
      '',
      script
    ]
      .filter((l) => l !== undefined)
      .join('\n')
    writeFileSync(scriptPath, body, 'utf-8')
    return queryEncodeWorkflowCtxResult(`剧本已保存：${scriptPath}`, {
      scriptOk: '1',
      scriptPath,
      scriptTitle: title,
      scriptText: script.slice(0, 8_000)
    })
  }
}

/** 分镜 JSON 落盘 */
export const generateStoryboardTool: AgentTool = {
  name: 'generate_storyboard',
  description:
    '根据剧本生成并保存分镜表（JSON）。每镜含 visual（画面描述）、narration（旁白）、durationSec。' +
    '写入 context.storyboardPath。后续由视频角色调用 generate_scene_assets。',
  permission: 'sensitive',
  parameters: {
    type: 'object',
    properties: {
      title: { type: 'string', description: '作品标题' },
      logline: { type: 'string', description: '一句话梗概' },
      shots: {
        type: 'array',
        description: '分镜列表',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            visual: { type: 'string' },
            narration: { type: 'string' },
            durationSec: { type: 'number' }
          },
          required: ['id', 'visual']
        }
      }
    },
    required: ['title', 'shots']
  },
  async execute(args, ctx) {
    const title = String(args.title ?? '').trim() || '未命名分镜'
    const shotsRaw = Array.isArray(args.shots) ? args.shots : []
    const shots: StoryboardShot[] = shotsRaw.map((raw, i) => {
      const row = raw as Record<string, unknown>
      return {
        id: String(row.id ?? `shot-${i + 1}`),
        visual: String(row.visual ?? '').trim(),
        narration: row.narration != null ? String(row.narration) : undefined,
        durationSec: row.durationSec != null ? Number(row.durationSec) : 3
      }
    }).filter((s) => s.visual)

    if (shots.length === 0) {
      return 'shots 不能为空，请至少提供一镜 visual'
    }

    const doc: StoryboardDoc = {
      title,
      logline: args.logline != null ? String(args.logline) : undefined,
      shots
    }
    const dir = queryProjectDir(ctx.sessionId)
    const storyboardPath = join(dir, 'storyboard.json')
    writeFileSync(storyboardPath, JSON.stringify(doc, null, 2), 'utf-8')
    const preview = shots
      .map((s, i) => `${i + 1}. [${s.id}] ${s.visual.slice(0, 60)}`)
      .join('\n')

    return queryEncodeWorkflowCtxResult(
      `分镜已保存（${shots.length} 镜）：${storyboardPath}\n${preview}`,
      {
        storyboardOk: '1',
        storyboardPath,
        storyboardTitle: title,
        shotCount: String(shots.length)
      }
    )
  }
}

/**
 * 按分镜调用文生图 / TTS Provider 生成素材。
 * Provider 未配置时会写入占位说明，不中断整条管线（便于后续只补合成）。
 */
export const generateSceneAssetsTool: AgentTool = {
  name: 'generate_scene_assets',
  description:
    '读取 storyboardPath（或缺省用本会话 storyboard.json），为每镜生成画面/旁白素材。' +
    '优先百炼万相文生图 + Qwen-TTS（需已配置百炼 API Key）；文生图失败时回退本地占位图。' +
    '写入 context.sceneAssetPaths / sceneAudioPaths（JSON 数组字符串）。',
  permission: 'sensitive',
  parameters: {
    type: 'object',
    properties: {
      storyboardPath: {
        type: 'string',
        description: '分镜 JSON 路径；缺省为当前会话 projects/.../storyboard.json'
      }
    },
    required: []
  },
  async execute(args, ctx) {
    refreshActiveTextToImageProvider()
    refreshActiveTextToSpeechProvider()
    const defaultPath = join(queryProjectDir(ctx.sessionId), 'storyboard.json')
    const storyboardPath = String(args.storyboardPath ?? defaultPath).trim()
    if (!existsSync(storyboardPath)) {
      return `找不到分镜文件：${storyboardPath}，请先 generate_storyboard`
    }

    const doc = JSON.parse(readFileSync(storyboardPath, 'utf-8')) as StoryboardDoc
    const sceneDir = querySceneAssetsDir(ctx.sessionId)
    const t2i = queryTextToImageProvider()
    const tts = queryTextToSpeechProvider()

    const assetPaths: string[] = []
    const audioPaths: string[] = []
    const notes: string[] = []
    let imageOk = 0
    let voiceOk = 0
    let voiceTotal = 0

    for (const shot of doc.shots ?? []) {
      const imageOut = join(sceneDir, `${shot.id}.png`)
      const img = await t2i.generate({ prompt: shot.visual, outputPath: imageOut })
      if (img.ok && img.path) {
        assetPaths.push(img.path)
        imageOk += 1
        notes.push(`${shot.id} 画面：${img.path}`)
      } else {
        // 为什么：文生图失败时仍生成可合成的占位 PNG，避免成片步骤无图
        const { postWritePlaceholderImage } = await import('../../media/placeholder-image')
        const stubImg = await postWritePlaceholderImage({
          outputPath: imageOut,
          label: shot.id
        })
        if (stubImg.ok && stubImg.path) {
          assetPaths.push(stubImg.path)
          notes.push(`${shot.id} 画面回退占位图（原因：${img.message}）→ ${stubImg.path}`)
        } else {
          const stub = join(sceneDir, `${shot.id}.txt`)
          writeFileSync(stub, `VISUAL:\n${shot.visual}\n\nNOTE:\n${img.message}`, 'utf-8')
          notes.push(`${shot.id} 画面失败：${img.message}；占位图也失败：${stubImg.message}`)
        }
      }

      if (shot.narration?.trim()) {
        voiceTotal += 1
        const audioOut = join(sceneDir, `${shot.id}.wav`)
        const voice = await tts.synthesize({
          text: shot.narration.trim(),
          outputPath: audioOut
        })
        if (voice.ok && voice.path) {
          audioPaths.push(voice.path)
          voiceOk += 1
          notes.push(`${shot.id} 旁白：${voice.path}`)
        } else {
          notes.push(`${shot.id} 旁白失败：${voice.message}`)
        }
      }
    }

    const manifestPath = join(sceneDir, 'assets-manifest.json')
    writeFileSync(
      manifestPath,
      JSON.stringify({ storyboardPath, assetPaths, audioPaths, notes }, null, 2),
      'utf-8'
    )

    return queryEncodeWorkflowCtxResult(
      `场景素材处理完成（画面 ${imageOk}/${doc.shots.length}，旁白 ${voiceOk}/${voiceTotal}）\n` +
        notes.join('\n'),
      {
        sceneAssetsOk: assetPaths.length > 0 ? '1' : '0',
        sceneAssetPaths: JSON.stringify(assetPaths),
        sceneAudioPaths: JSON.stringify(audioPaths),
        sceneAssetsManifest: manifestPath
      }
    )
  }
}

/** 将分镜素材合成为成片（本地 ffmpeg 兜底） */
export const composeVideoTool: AgentTool = {
  name: 'compose_video',
  description:
    '将场景图片/短视频合成为成片。可传 scenePaths；缺省读取本会话 assets-manifest。' +
    '默认使用本地 ffmpeg 合成 Provider。写入 context.videoPath。',
  permission: 'sensitive',
  parameters: {
    type: 'object',
    properties: {
      scenePaths: {
        type: 'array',
        items: { type: 'string' },
        description: '分镜素材绝对路径列表'
      },
      audioPath: { type: 'string', description: '可选整片旁白音频' },
      title: { type: 'string', description: '成片标题' },
      sceneDurationSec: { type: 'number', description: '每镜时长秒，默认 3' }
    },
    required: []
  },
  async execute(args, ctx) {
    refreshActiveTextToImageProvider()
    refreshActiveTextToSpeechProvider()
    let scenePaths = Array.isArray(args.scenePaths)
      ? (args.scenePaths as unknown[]).map(String).filter(Boolean)
      : []

    let audioPath =
      args.audioPath != null ? String(args.audioPath).trim() || undefined : undefined

    if (!scenePaths.length || !audioPath) {
      const manifestPath = join(querySceneAssetsDir(ctx.sessionId), 'assets-manifest.json')
      if (existsSync(manifestPath)) {
        const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8')) as {
          assetPaths?: string[]
          audioPaths?: string[]
        }
        if (!scenePaths.length) scenePaths = manifest.assetPaths ?? []
        // 多镜旁白时先用首段；完整时间轴对齐后续可在 compose 增强
        if (!audioPath && manifest.audioPaths?.length) {
          audioPath = manifest.audioPaths[0]
        }
      }
    }

    // 无图片时尝试用分镜 visual 文本文件路径（ffmpeg 可能失败，但会落 manifest）
    if (!scenePaths.length) {
      return '缺少 scenePaths，且会话内无 assets-manifest。请先 generate_scene_assets。'
    }

    const compose = queryVideoComposeProvider()
    const result = await compose.compose({
      scenePaths,
      audioPath,
      title: args.title != null ? String(args.title) : undefined,
      sceneDurationSec: args.sceneDurationSec != null ? Number(args.sceneDurationSec) : 3,
      outputPath: join(queryProjectDir(ctx.sessionId), `final-${Date.now()}.mp4`)
    })

    return queryEncodeWorkflowCtxResult(result.message, {
      videoOk: result.ok ? '1' : '0',
      videoPath: result.path ?? '',
      videoMessage: result.message
    })
  }
}
