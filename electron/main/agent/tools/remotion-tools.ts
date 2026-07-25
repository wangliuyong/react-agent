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
import { postEnableRemotionSfx } from '../../media/remotion-sfx'
import {
  postApplyRemotionTemplate,
  postRemotionInputProps,
  postSaveRemotionTemplateFromChat,
  queryRemotionInputProps,
  queryRemotionTemplates
} from '../../store/remotion-templates'
import { AgentUserCancelledError } from '../agent-user-cancelled'
import { queryIsUserCancelIntent } from '../choice-resolver'
import type { AgentTool } from './types'

/** 在会话目录初始化 Remotion 工程（复制内置 starter 模板） */
export const remotionInitProjectTool: AgentTool = {
  name: 'remotion_init_project',
  description:
    '初始化当前会话的 Remotion React 视频工程（复制内置 starter）。' +
    '优先推荐 remotion_apply_template 选用精品模板；仅在无合适模板或需从零编写时用本工具。' +
    '初始化后可用 write_file 修改 src/ActiveTemplate.tsx / Composition，最后 remotion_render。' +
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
        '需要官方音效时先 use_skill(remotion-sfx)，推荐 src/lib/remotion-sfx.ts 按需取 URL；' +
        '若使用 import from "@remotion/sfx" 则先 remotion_enable_sfx。' +
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
 * 为当前会话 Remotion 工程按需启用官方 @remotion/sfx 包解析。
 * 仅当 Composition 使用 `import { whoosh } from '@remotion/sfx'` 时需要；
 * 使用 src/lib/remotion-sfx.ts CDN 目录时无需调用。
 */
export const remotionEnableSfxTool: AgentTool = {
  name: 'remotion_enable_sfx',
  description:
    '为当前会话 Remotion 工程启用官方音效库 @remotion/sfx 的模块解析（Webpack alias）。' +
    '仅当代码使用 import from "@remotion/sfx" 时必须先调用；' +
    '若使用工程内 src/lib/remotion-sfx.ts 的 REMOTION_SFX 常量（CDN URL）则无需调用。' +
    '调用前须 remotion_init_project。启用后可用 remotion_studio / remotion_render。',
  permission: 'sensitive',
  parameters: {
    type: 'object',
    properties: {
      projectDir: {
        type: 'string',
        description: '工程目录绝对路径；缺省为当前会话 remotion 目录'
      }
    },
    required: []
  },
  async execute(args, ctx) {
    const projectDir = String(args.projectDir ?? queryRemotionProjectDir(ctx.sessionId)).trim()
    let result: ReturnType<typeof postEnableRemotionSfx>
    try {
      result = postEnableRemotionSfx(ctx.sessionId)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return `${msg}\n请先 remotion_init_project。`
    }

    if (result.projectDir !== projectDir) {
      return `会话工程目录为 ${result.projectDir}，与参数 projectDir 不一致，请核对。`
    }

    const status = result.alreadyEnabled ? '（此前已启用，已刷新 alias 配置）' : '已启用官方音效库解析。'
    return queryEncodeWorkflowCtxResult(
      `${status}\n` +
        `工程目录：${result.projectDir}\n` +
        '用法示例：import { whoosh, ding } from "@remotion/sfx"；配合 <Sequence> + <Audio src={whoosh} />。\n' +
        '或无需本工具：import { REMOTION_SFX } from "./lib/remotion-sfx" 按需取 URL。\n' +
        '完整选音指南：use_skill(remotion-sfx)。',
      {
        remotionSfxEnabled: '1',
        remotionProjectDir: result.projectDir
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
    '禁止在未调用本工具成功前声称视频已生成。' +
    '用户在本工具弹窗点「确认渲染」后，工具会在同一次调用内直接导出 mp4；' +
    '禁止再修改 Composition/Root、更换 compositionId 或重新制定渲染方案。',
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
      },
      quality: {
        type: 'string',
        enum: ['fast', 'standard', 'high'],
        description: '渲染画质预设：fast（快速预览，体积小）/ standard（标准平衡，默认）/ high（高质量，体积大）'
      },
      inputProps: {
        type: 'object',
        description:
          '传给 Composition 的 props；缺省读取工程内 .remotion-input-props.json。' +
          'Studio 调参后请先 remotion_update_input_props 再渲染，保证成片与预览一致。'
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
    const quality = args.quality === 'fast' || args.quality === 'high' ? args.quality : 'standard'
    const inputProps =
      args.inputProps != null && typeof args.inputProps === 'object' && !Array.isArray(args.inputProps)
        ? (args.inputProps as Record<string, unknown>)
        : undefined

    const savedProps = queryRemotionInputProps(projectDir)
    const propsHint =
      Object.keys(inputProps ?? savedProps).length > 0
        ? `将使用 inputProps（${Object.keys(inputProps ?? savedProps).length} 个字段）。`
        : '当前无 inputProps，将按 Composition 默认值渲染。'

    // 渲染前强制暂停：高成本不可逆操作，即使用户开启 fullAccess 也需确认
    const confirm = await ctx.emitAwaitUser(
      `即将渲染 Composition「${compositionId}」为 mp4，耗时可能较长。${propsHint}` +
        '若刚在 Studio 右侧 Props 调过参，请先 remotion_update_input_props 再确认。',
      [
        { id: 'render', label: '确认渲染', description: '按当前工程、compositionId 与已保存 props 导出 mp4' },
        { id: 'preview', label: '先预览 Studio', description: '暂不渲染，建议先 remotion_studio' },
        { id: 'cancel', label: '取消', description: '放弃本次渲染' }
      ],
      // 确认结果仅由本工具继续消费，避免落盘 user 消息导致模型误以为要改方案
      { appendUserContinueMessage: false }
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
      quality,
      inputProps,
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

    // 成片已导出：关闭本会话 Studio，释放预览进程占用的端口与 CPU
    postStopRemotionStudios(ctx.sessionId)

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
        '已自动关闭本会话 Remotion Studio 进程。\n' +
        '请在回复中保留上述本地 mp4 路径，便于聊天界面内联预览。\n' +
        '若用户满意效果，可引导点击「存为 Remotion 模板」或调用 remotion_save_template。',
      {
        remotionRenderOk: '1',
        videoPath: result.path,
        remotionCompositionId: compositionId,
        remotionProjectDir: projectDir,
        remotionRenderReused: result.reused ? '1' : '0',
        remotionStudioStopped: '1'
      }
    )
  }
}

/** 列出可用 Remotion 模板（内置 + 用户） */
export const queryRemotionTemplatesTool: AgentTool = {
  name: 'query_remotion_templates',
  description:
    '列出可用的 Remotion 视频模板（内置精品 + 用户自建/导入）。' +
    '用户要做片头、字幕、品牌视频时优先调用，再 remotion_apply_template。' +
    '可用 tag（如 intro/caption/9:16）或关键词过滤。',
  permission: 'safe',
  parameters: {
    type: 'object',
    properties: {
      tag: { type: 'string', description: '按标签过滤，如 intro、caption、9:16' },
      query: { type: 'string', description: '关键词搜索名称/描述/id' },
      origin: {
        type: 'string',
        enum: ['bundled', 'local', 'remote', 'skill-bound', 'from-chat'],
        description: '按来源过滤'
      }
    },
    required: []
  },
  async execute(args) {
    const list = queryRemotionTemplates({
      tag: args.tag != null ? String(args.tag) : undefined,
      query: args.query != null ? String(args.query) : undefined,
      origin:
        args.origin != null
          ? (String(args.origin) as
              | 'bundled'
              | 'local'
              | 'remote'
              | 'skill-bound'
              | 'from-chat')
          : undefined
    })
    if (!list.length) {
      return '未找到匹配模板。可 remotion_init_project 后 write_file 从零编写，或从 GitHub 导入模板。'
    }
    const lines = list.map(
      (t) =>
        `- \`${t.id}\` ${t.name}` +
        `${t.description ? ` — ${t.description}` : ''}` +
        ` [${t.origin}${t.hasSchema ? ', schema' : ''}]` +
        `${t.tags?.length ? ` tags=${t.tags.join(',')}` : ''}` +
        ` ${t.width ?? '?'}x${t.height ?? '?'}`
    )
    return `共 ${list.length} 个模板：\n${lines.join('\n')}\n下一步：remotion_apply_template({ templateId })。`
  }
}

/** 将模板挂载到当前会话工程 */
export const remotionApplyTemplateTool: AgentTool = {
  name: 'remotion_apply_template',
  description:
    '将 Remotion 模板应用到当前会话工程（复制 Composition、写入 props、配置画幅）。' +
    '用户要「用某模板做视频 / 一键片头」时调用。可先 query_remotion_templates。' +
    '应用后可用 remotion_studio 预览，用 remotion_update_input_props 同步 Studio 调参，再 remotion_render。',
  permission: 'sensitive',
  parameters: {
    type: 'object',
    properties: {
      templateId: { type: 'string', description: '模板 id，如 brand-intro、karaoke-captions' },
      props: {
        type: 'object',
        description: '覆盖 defaultProps 的字段（标题、主题等）'
      },
      compositionId: { type: 'string', description: 'Composition id，默认取模板 meta' },
      width: { type: 'number' },
      height: { type: 'number' },
      fps: { type: 'number' },
      durationInFrames: { type: 'number' }
    },
    required: ['templateId']
  },
  async execute(args, ctx) {
    const templateId = String(args.templateId ?? '').trim()
    if (!templateId) return '缺少 templateId'

    try {
      const result = postApplyRemotionTemplate({
        sessionId: ctx.sessionId,
        templateId,
        props:
          args.props != null && typeof args.props === 'object' && !Array.isArray(args.props)
            ? (args.props as Record<string, unknown>)
            : undefined,
        compositionId: args.compositionId != null ? String(args.compositionId) : undefined,
        width: args.width != null ? Number(args.width) : undefined,
        height: args.height != null ? Number(args.height) : undefined,
        fps: args.fps != null ? Number(args.fps) : undefined,
        durationInFrames:
          args.durationInFrames != null ? Number(args.durationInFrames) : undefined
      })
      return queryEncodeWorkflowCtxResult(
        `已应用模板「${result.templateId}」。\n` +
          `工程：${result.projectDir}\n` +
          `compositionId：${result.compositionId}\n` +
          `props：${result.propsPath}\n` +
          '下一步：remotion_studio 预览；调参后 remotion_update_input_props；确认后 remotion_render。',
        {
          remotionProjectOk: '1',
          remotionProjectDir: result.projectDir,
          remotionCompositionId: result.compositionId,
          remotionTemplateId: result.templateId,
          remotionEntryPoint: result.entryPoint
        }
      )
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return `应用模板失败：${msg}`
    }
  }
}

/** 写入会话 .remotion-input-props.json，供渲染与 Studio 参数对齐 */
export const remotionUpdateInputPropsTool: AgentTool = {
  name: 'remotion_update_input_props',
  description:
    '将 Composition props 写入会话工程 .remotion-input-props.json。' +
    '用户在 Studio 右侧 Props 调完效果后，根据其口述或 JSON 调用本工具，再 remotion_render，保证成片一致。' +
    'merge=true（默认）时与已有 props 合并；false 则全量覆盖。',
  permission: 'sensitive',
  parameters: {
    type: 'object',
    properties: {
      props: { type: 'object', description: '要写入的 props 对象' },
      merge: {
        type: 'boolean',
        description: '是否与已有 props 合并，默认 true'
      },
      projectDir: { type: 'string', description: '工程目录；缺省为当前会话 remotion 目录' }
    },
    required: ['props']
  },
  async execute(args, ctx) {
    const projectDir = String(args.projectDir ?? queryRemotionProjectDir(ctx.sessionId)).trim()
    const incoming =
      args.props != null && typeof args.props === 'object' && !Array.isArray(args.props)
        ? (args.props as Record<string, unknown>)
        : null
    if (!incoming) return 'props 必须是对象'

    const merge = args.merge === false ? false : true
    const next = merge ? { ...queryRemotionInputProps(projectDir), ...incoming } : incoming
    const path = postRemotionInputProps(projectDir, next)
    return queryEncodeWorkflowCtxResult(
      `已更新 inputProps：${path}\n字段：${Object.keys(next).join(', ') || '(空)'}\n可 remotion_render 导出。`,
      {
        remotionProjectDir: projectDir,
        remotionInputPropsOk: '1'
      }
    )
  }
}

/** 将当前会话成片工程存为可复用模板 */
export const remotionSaveTemplateTool: AgentTool = {
  name: 'remotion_save_template',
  description:
    '把当前会话 Remotion 工程快照存为用户模板，供下次 remotion_apply_template 复用。' +
    '用户说「存成模板 / 效果很好下次还用」或聊天成片旁一键保存时调用。' +
    '须已有工程（init 或 apply 过）；templateId 仅小写字母数字连字符。',
  permission: 'sensitive',
  parameters: {
    type: 'object',
    properties: {
      name: { type: 'string', description: '模板展示名称' },
      templateId: { type: 'string', description: '模板 id，如 brand-intro-yueshe' },
      tags: {
        type: 'array',
        items: { type: 'string' },
        description: '标签'
      },
      videoPath: { type: 'string', description: '成片路径，复制为 preview.mp4' },
      compositionId: { type: 'string' }
    },
    required: ['name', 'templateId']
  },
  async execute(args, ctx) {
    try {
      const summary = postSaveRemotionTemplateFromChat({
        sessionId: ctx.sessionId,
        name: String(args.name ?? '').trim(),
        templateId: String(args.templateId ?? '').trim(),
        tags: Array.isArray(args.tags) ? args.tags.map((t) => String(t)) : undefined,
        videoPath: args.videoPath != null ? String(args.videoPath) : undefined,
        compositionId: args.compositionId != null ? String(args.compositionId) : undefined
      })
      return (
        `已保存模板「${summary.name}」(\`${summary.id}\`)。\n` +
        `目录：${summary.dir}\n` +
        '下次可用 remotion_apply_template 复用。'
      )
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return `保存模板失败：${msg}`
    }
  }
}
