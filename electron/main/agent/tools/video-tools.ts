/**
 * 视频管线工具：剧本/分镜落盘 → 场景素材（T2I→I2V/T2V→TTS）→ 成片合成。
 */

import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { queryEncodeWorkflowCtxResult } from './hot-topics'
import {
  querySceneAssetsDir,
  queryImageToVideoProvider,
  queryTextToImageProvider,
  queryTextToSpeechProvider,
  queryTextToVideoProvider,
  queryVideoComposeProvider,
  refreshActiveTextToImageProvider,
  refreshActiveTextToSpeechProvider,
  refreshActiveVideoProviders
} from '../../media/provider'
import { getVideosDir } from '../../store/paths'
import type { AgentTool } from './types'

export interface StoryboardShot {
  id: string
  /** 画面描述（给文生图/文生视频） */
  visual: string
  /** 旁白/台词 */
  narration?: string
  /** 建议时长秒 */
  durationSec?: number
  /** 镜头运镜：推/拉/环绕/跟拍 */
  cameraMotion?: string
  /** 风格：写实/电影/动画 */
  style?: string
  /** 负面提示词 */
  negativePrompt?: string
  /** 画幅 9:16 / 16:9 / 1:1 */
  aspectRatio?: string
  /** 光影色调 */
  lighting?: string
}

export interface StoryboardDoc {
  title: string
  logline?: string
  shots: StoryboardShot[]
}

const DEFAULT_NEGATIVE =
  '低分辨率、扭曲人脸、肢体崩坏、闪烁、跳帧、多余手指、比例不良'

function queryProjectDir(sessionId: string): string {
  const dir = join(getVideosDir(), 'projects', sessionId)
  mkdirSync(dir, { recursive: true })
  return dir
}

/** 组装单镜精细化提示词 */
function queryEnrichedVisualPrompt(shot: StoryboardShot): string {
  const parts = [shot.visual]
  if (shot.cameraMotion?.trim()) parts.push(`镜头：${shot.cameraMotion.trim()}`)
  if (shot.style?.trim()) parts.push(`风格：${shot.style.trim()}`)
  if (shot.lighting?.trim()) parts.push(`光影：${shot.lighting.trim()}`)
  return parts.join('，')
}

function queryMotionPrompt(shot: StoryboardShot): string {
  const motion = shot.cameraMotion?.trim() || '镜头缓慢推进'
  return `${motion}，画面自然流畅，${shot.visual.slice(0, 200)}`
}

function queryAspectRatio(shot: StoryboardShot): '9:16' | '16:9' | '1:1' | '4:3' | '3:4' {
  const raw = shot.aspectRatio?.trim()
  if (raw === '9:16' || raw === '16:9' || raw === '1:1' || raw === '4:3' || raw === '3:4') {
    return raw
  }
  return '9:16'
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
    '根据剧本生成并保存分镜表（JSON）。每镜含 visual、narration、durationSec、' +
    'cameraMotion（推/拉/环绕/跟拍）、style（写实/电影/动画）、negativePrompt、aspectRatio（9:16/16:9）、lighting。' +
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
            durationSec: { type: 'number' },
            cameraMotion: { type: 'string' },
            style: { type: 'string' },
            negativePrompt: { type: 'string' },
            aspectRatio: { type: 'string' },
            lighting: { type: 'string' }
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
        durationSec: row.durationSec != null ? Number(row.durationSec) : 3,
        cameraMotion: row.cameraMotion != null ? String(row.cameraMotion) : undefined,
        style: row.style != null ? String(row.style) : undefined,
        negativePrompt: row.negativePrompt != null ? String(row.negativePrompt) : undefined,
        aspectRatio: row.aspectRatio != null ? String(row.aspectRatio) : undefined,
        lighting: row.lighting != null ? String(row.lighting) : undefined
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
 * 按分镜调用 T2I → I2V（失败则 T2V 兜底）→ TTS 生成素材。
 */
export const generateSceneAssetsTool: AgentTool = {
  name: 'generate_scene_assets',
  description:
    '读取 storyboardPath，为每镜生成关键帧/动效视频/旁白。' +
    '流程：万相文生图 → 万相图生视频；I2V 失败时文生视频兜底；旁白走 Qwen-TTS。' +
    '写入 context.sceneAssetPaths / sceneVideoPaths / sceneAudioPaths。',
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
    refreshActiveVideoProviders()
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
    const i2v = queryImageToVideoProvider()
    const t2v = queryTextToVideoProvider()
    const tts = queryTextToSpeechProvider()

    const sceneAssetPaths: string[] = []
    const sceneVideoPaths: string[] = []
    const sceneImagePaths: string[] = []
    const audioPaths: string[] = []
    const notes: string[] = []
    let imageOk = 0
    let videoOk = 0
    let voiceOk = 0
    let voiceTotal = 0

    for (const shot of doc.shots ?? []) {
      const enrichedPrompt = queryEnrichedVisualPrompt(shot)
      const imageOut = join(sceneDir, `${shot.id}.png`)
      const videoOut = join(sceneDir, `${shot.id}.mp4`)
      const duration = Math.min(15, Math.max(2, shot.durationSec ?? 5))

      const img = await t2i.generate({ prompt: enrichedPrompt, outputPath: imageOut })
      let imagePath: string | undefined
      if (img.ok && img.path) {
        imagePath = img.path
        sceneImagePaths.push(img.path)
        imageOk += 1
        notes.push(`${shot.id} 关键帧：${img.path}`)
      } else {
        const { postWritePlaceholderImage } = await import('../../media/placeholder-image')
        const stubImg = await postWritePlaceholderImage({
          outputPath: imageOut,
          label: shot.id
        })
        if (stubImg.ok && stubImg.path) {
          imagePath = stubImg.path
          sceneImagePaths.push(stubImg.path)
          notes.push(`${shot.id} 关键帧回退占位图（${img.message}）→ ${stubImg.path}`)
        } else {
          notes.push(`${shot.id} 关键帧失败：${img.message}`)
        }
      }

      let composePath: string | undefined = imagePath
      if (imagePath) {
        const motionPrompt = queryMotionPrompt(shot)
        const i2vResult = await i2v.generate({
          imagePath,
          prompt: motionPrompt,
          durationSec: duration,
          outputPath: videoOut
        })
        if (i2vResult.ok && i2vResult.path) {
          sceneVideoPaths.push(i2vResult.path)
          composePath = i2vResult.path
          videoOk += 1
          notes.push(`${shot.id} 图生视频：${i2vResult.path}`)
        } else {
          notes.push(`${shot.id} 图生视频失败：${i2vResult.message}，尝试文生视频兜底`)
          const t2vResult = await t2v.generate({
            prompt: enrichedPrompt,
            negativePrompt: shot.negativePrompt ?? DEFAULT_NEGATIVE,
            aspectRatio: queryAspectRatio(shot),
            durationSec: duration,
            outputPath: videoOut
          })
          if (t2vResult.ok && t2vResult.path) {
            sceneVideoPaths.push(t2vResult.path)
            composePath = t2vResult.path
            videoOk += 1
            notes.push(`${shot.id} 文生视频兜底：${t2vResult.path}`)
          } else {
            notes.push(`${shot.id} 文生视频也失败：${t2vResult.message}，合成将使用静图`)
          }
        }
      }

      if (composePath) {
        sceneAssetPaths.push(composePath)
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
      JSON.stringify(
        {
          storyboardPath,
          sceneAssetPaths,
          sceneVideoPaths,
          sceneImagePaths,
          audioPaths,
          notes
        },
        null,
        2
      ),
      'utf-8'
    )

    return queryEncodeWorkflowCtxResult(
      `场景素材处理完成（关键帧 ${imageOk}/${doc.shots.length}，视频 ${videoOk}/${doc.shots.length}，旁白 ${voiceOk}/${voiceTotal}）\n` +
        notes.join('\n'),
      {
        sceneAssetsOk: sceneAssetPaths.length > 0 ? '1' : '0',
        sceneAssetPaths: JSON.stringify(sceneAssetPaths),
        sceneVideoPaths: JSON.stringify(sceneVideoPaths),
        sceneAudioPaths: JSON.stringify(audioPaths),
        sceneAssetsManifest: manifestPath
      }
    )
  }
}

/** 将分镜素材合成为成片（本地 ffmpeg） */
export const composeVideoTool: AgentTool = {
  name: 'compose_video',
  description:
    '将场景视频片段/静图合成为成片。可传 scenePaths；缺省读取本会话 assets-manifest。' +
    '支持多段旁白 concat。写入 context.videoPath。',
  permission: 'sensitive',
  parameters: {
    type: 'object',
    properties: {
      scenePaths: {
        type: 'array',
        items: { type: 'string' },
        description: '分镜素材绝对路径列表（优先 mp4）'
      },
      audioPath: { type: 'string', description: '可选整片旁白音频' },
      title: { type: 'string', description: '成片标题' },
      sceneDurationSec: { type: 'number', description: '静图每镜时长秒，默认 3' }
    },
    required: []
  },
  async execute(args, ctx) {
    refreshActiveVideoProviders()
    let scenePaths = Array.isArray(args.scenePaths)
      ? (args.scenePaths as unknown[]).map(String).filter(Boolean)
      : []

    let audioPath =
      args.audioPath != null ? String(args.audioPath).trim() || undefined : undefined
    let audioPaths: string[] = []

    const manifestPath = join(querySceneAssetsDir(ctx.sessionId), 'assets-manifest.json')
    if (existsSync(manifestPath)) {
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8')) as {
        sceneAssetPaths?: string[]
        sceneVideoPaths?: string[]
        audioPaths?: string[]
      }
      if (!scenePaths.length) {
        scenePaths = manifest.sceneAssetPaths ?? manifest.sceneVideoPaths ?? []
      }
      audioPaths = manifest.audioPaths ?? []
      if (!audioPath && audioPaths.length === 1) {
        audioPath = audioPaths[0]
      }
    }

    if (!scenePaths.length) {
      return '缺少 scenePaths，且会话内无 assets-manifest。请先 generate_scene_assets。'
    }

    const compose = queryVideoComposeProvider()
    const result = await compose.compose({
      scenePaths,
      audioPath,
      audioPaths: audioPath ? undefined : audioPaths,
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
