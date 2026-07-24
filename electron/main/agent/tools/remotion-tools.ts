/**
 * Remotion 程序化视频工具：初始化 React 视频工程 + 渲染 mp4。
 * 配合 resources/skills 下的 remotion-* 技能，由 Agent 编写 Composition 后调用渲染。
 */

import { join } from 'path'
import { queryEncodeWorkflowCtxResult } from './hot-topics'
import {
  postInitRemotionProject,
  postCancelRemotionRenderSession,
  postRenderRemotionVideo,
  postStartRemotionStudio,
  postStopRemotionStudios,
  queryRemotionProjectDir
} from '../../media/remotion-service'
import { AgentUserCancelledError } from '../agent-user-cancelled'
import { queryIsUserCancelIntent } from '../choice-resolver'
import type { AgentTool } from './types'

/** 在会话目录初始化 Remotion 工程（复制内置 starter 模板） */
export const remotionInitProjectTool: AgentTool = {
  name: 'remotion_init_project',
  description:
    '初始化当前会话的 Remotion React 视频工程（复制内置模板到本地）。' +
    '用户要用 Remotion / React 代码做动效视频、字幕视频、数据可视化视频时必须先调用。' +
    '初始化后用 write_file 修改 src/Composition.tsx 或新增组件并在 src/Root.tsx 注册 Composition，' +
    '最后调用 remotion_render 导出 mp4。' +
    '与 AI 分镜管线（generate_storyboard 等）不同：Remotion 适合精确动效、字幕、图表、品牌模板。',
  permission: 'sensitive',
  parameters: {
    type: 'object',
    properties: {
      compositionId: {
        type: 'string',
        description: 'Composition id，默认 Main，需与 Root.tsx 中 <Composition id> 一致'
      },
      width: { type: 'number', description: '画布宽度，默认 1920（横版 16:9）' },
      height: { type: 'number', description: '画布高度，默认 1080（横版 16:9）' },
      fps: { type: 'number', description: '帧率，默认 30' },
      durationInFrames: { type: 'number', description: '总帧数，默认 150（30fps 约 5 秒）' }
    },
    required: []
  },
  async execute(args, ctx) {
    const width = args.width != null ? Number(args.width) : undefined
    const height = args.height != null ? Number(args.height) : undefined
    const fps = args.fps != null ? Number(args.fps) : undefined
    const durationInFrames =
      args.durationInFrames != null ? Number(args.durationInFrames) : undefined

    const result = postInitRemotionProject(ctx.sessionId, {
      compositionId: args.compositionId != null ? String(args.compositionId) : undefined,
      width: Number.isFinite(width) ? width : undefined,
      height: Number.isFinite(height) ? height : undefined,
      fps: Number.isFinite(fps) ? fps : undefined,
      durationInFrames: Number.isFinite(durationInFrames) ? durationInFrames : undefined
    })

    const hint = result.created
      ? '已从内置模板创建工程。'
      : '工程已存在，已更新 Root.tsx 画幅/时长配置。'

    return queryEncodeWorkflowCtxResult(
      `${hint}\n` +
        `工程目录：${result.projectDir}\n` +
        `入口：${result.entryPoint}\n` +
        `默认 compositionId：${result.compositionId}\n` +
        '下一步：用 write_file 编写 src/Composition.tsx，必要时修改 src/Root.tsx；' +
        '可用 remotion_studio 预览，确认后 remotion_render 导出 mp4。',
      {
        remotionProjectOk: '1',
        remotionProjectDir: result.projectDir,
        remotionCompositionId: result.compositionId,
        remotionEntryPoint: result.entryPoint
      }
    )
  }
}

/**
 * 启动 Remotion Studio 本地预览（时间轴 / 实时预览）。
 * 用户要求预览、调参、看效果时调用；最终成片仍需 remotion_render。
 */
export const remotionStudioTool: AgentTool = {
  name: 'remotion_studio',
  description:
    '启动 Remotion Studio 本地预览服务器，并在系统浏览器打开。' +
    '用户要求「预览 / 看效果 / 打开 Studio / 调时间轴」时调用。' +
    '必须先 remotion_init_project（可已写好 Composition）。' +
    '同一会话重复调用会复用已启动实例。' +
    'Studio 仅供预览，最终成片请再调用 remotion_render。',
  permission: 'sensitive',
  parameters: {
    type: 'object',
    properties: {
      projectDir: {
        type: 'string',
        description: '工程目录绝对路径；缺省为当前会话 remotion 目录'
      },
      openBrowser: {
        type: 'boolean',
        description: '是否用系统浏览器打开 Studio，默认 true'
      }
    },
    required: []
  },
  async execute(args, ctx) {
    const projectDir = String(args.projectDir ?? queryRemotionProjectDir(ctx.sessionId)).trim()
    const openBrowser = args.openBrowser === false ? false : true

    const result = await postStartRemotionStudio({
      sessionId: ctx.sessionId,
      projectDir,
      openBrowser,
      signal: ctx.signal
    })

    if (!result.ok || !result.url) {
      return `${result.message}\n不要向用户声称预览已打开。`
    }

    return queryEncodeWorkflowCtxResult(
      `${result.message}\n` +
        `Studio URL：${result.url}\n` +
        `工程目录：${projectDir}\n` +
        `${result.reused ? '（复用已有实例）' : '（新启动）'}\n` +
        '请将 URL 告知用户；确认画面无误后再 remotion_render 导出 mp4。',
      {
        remotionStudioOk: '1',
        remotionStudioUrl: result.url,
        remotionProjectDir: projectDir
      }
    )
  }
}

/** 渲染 Remotion 工程为 mp4 成片 */
export const remotionRenderTool: AgentTool = {
  name: 'remotion_render',
  description:
    '将当前会话 Remotion 工程渲染为 mp4。' +
    '必须先 remotion_init_project 并写好 Composition 代码。' +
    'compositionId 必须与 src/Root.tsx 中注册的 id 一致。' +
    '同一会话同时只允许一个渲染：若已有进行中的渲染会复用该任务，不会并行启动第二个。' +
    '成功时返回本地 mp4 绝对路径，回复中务必保留该路径供聊天内联预览。' +
    '禁止在未调用本工具成功前声称视频已生成。',
  permission: 'sensitive',
  parameters: {
    type: 'object',
    properties: {
      compositionId: {
        type: 'string',
        description: '要渲染的 Composition id，默认 Main'
      },
      outputFileName: {
        type: 'string',
        description: '输出文件名（不含目录），默认 remotion-{timestamp}.mp4'
      },
      projectDir: {
        type: 'string',
        description: '工程目录绝对路径；缺省为当前会话 remotion 目录'
      }
    },
    required: []
  },
  async execute(args, ctx) {
    const compositionId = String(args.compositionId ?? 'Main').trim() || 'Main'
    const projectDir = String(args.projectDir ?? queryRemotionProjectDir(ctx.sessionId)).trim()
    const rawName = String(args.outputFileName ?? '').trim()
    const safeName = rawName
      ? rawName.replace(/[^\w.\u4e00-\u9fff-]+/g, '_').replace(/\.+$/, '')
      : `remotion-${Date.now()}`
    const fileName = safeName.toLowerCase().endsWith('.mp4') ? safeName : `${safeName}.mp4`
    const outputPath = join(projectDir, 'out', fileName)

    // 渲染前强制暂停：高成本不可逆操作，即使用户开启 fullAccess 也需确认
    const confirm = await ctx.emitAwaitUser(
      `即将渲染 Composition「${compositionId}」为 mp4，耗时可能较长。请确认是否继续。`,
      [
        { id: 'render', label: '确认渲染', description: '开始导出 mp4' },
        { id: 'preview', label: '先预览 Studio', description: '暂不渲染，建议先 remotion_studio' },
        { id: 'cancel', label: '取消', description: '放弃本次渲染' }
      ]
    )
    if (queryIsUserCancelIntent(confirm)) {
      // 先停渲染与 Studio，再中止 Agent，避免后台进程残留
      postCancelRemotionRenderSession(ctx.sessionId)
      postStopRemotionStudios(ctx.sessionId)
      ctx.postAbortAgent?.()
      throw new AgentUserCancelledError('用户取消 Remotion 渲染')
    }
    if (confirm.choiceId === 'preview') {
      return '用户选择先预览；请调用 remotion_studio 后再渲染。'
    }

    const result = await postRenderRemotionVideo({
      sessionId: ctx.sessionId,
      projectDir,
      compositionId,
      outputPath,
      signal: ctx.signal,
      onProgress: (progress) => {
        ctx.emitToolProgress?.(remotionRenderTool.name, {
          percent: progress.percent,
          phase: progress.phase,
          message: progress.message
        })
      }
    })

    if (!result.ok || !result.path) {
      return (
        `${result.message}\n` +
        '不要向用户声称视频已生成。可检查 Composition 代码、compositionId 与 Root.tsx 是否一致。'
      )
    }

    // 渲染成功后自动勾选任务清单中的「渲染/导出」步骤，避免长时间执行后 UI 仍显示执行中
    ctx.updateTasks((tasks) =>
      tasks.map((t) =>
        t.status === 'running' && /渲染|导出|mp4|成片|remotion/i.test(t.title)
          ? { ...t, status: 'done' as const }
          : t
      )
    )

    const reuseHint = result.reused ? '（复用同会话已在进行的渲染）\n' : ''
    return queryEncodeWorkflowCtxResult(
      `Remotion 视频渲染成功。\n` +
        reuseHint +
        `视频路径：${result.path}\n` +
        `compositionId：${compositionId}\n` +
        `工程目录：${projectDir}\n` +
        '请在回复中保留上述本地 mp4 路径，便于聊天界面内联预览。',
      {
        remotionRenderOk: '1',
        videoPath: result.path,
        remotionCompositionId: compositionId,
        remotionProjectDir: projectDir,
        remotionRenderReused: result.reused ? '1' : '0'
      }
    )
  }
}
