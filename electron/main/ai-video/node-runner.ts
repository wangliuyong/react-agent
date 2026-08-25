/**
 * AI 视频画布节点执行器：编剧 LLM 扩图、ComfyUI 图片/视频节点、合成。
 */

import { BrowserWindow } from 'electron'
import { HumanMessage, SystemMessage } from '@langchain/core/messages'
import { randomUUID } from 'crypto'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import type {
  AiVideoCanvasEdge,
  AiVideoCanvasNode,
  AiVideoNodeEvent,
  AiVideoNodeKind,
  AiVideoProject,
  AiVideoNodeRunRequest,
  AiVideoCanvasRunRequest
} from '../../../shared/ai-video'
import {
  AI_VIDEO_REF_KINDS,
  AI_VIDEO_DEFAULT_WORKFLOWS,
  AI_VIDEO_H3_PROMPT_SKILL_ID,
  queryAiVideoBaseType,
  queryAiVideoDefaultWorkflow,
  queryAiVideoRequiredRefKinds
} from '../../../shared/ai-video'
import { IpcChannels } from '../../../shared/types'
import { createChatModel } from '../agent/llm-langchain'
import { querySettings } from '../store/settings'
import {
  getSkillsDir,
  queryInjectableSkillContent,
  queryInjectableSkillPrompt,
  type SkillInjectContext
} from '../store/skills'
import {
  postAiVideoProject,
  queryAiVideoOutputsDir,
  queryAiVideoProject,
  postPatchAiVideoNode
} from '../store/ai-video-projects'
import { postComfyRunAndDownload, postComfyUploadImage } from '../comfyui/client'
import { queryLoadComfyWorkflowPrompt } from '../comfyui/workflows'
import {
  postPatchComfyWorkflow,
  queryComfyWorkflowSlots
} from '../comfyui/patch-workflow'
import {
  postNormalizeComfyWorkflow,
  queryResolveWorkflowRelativePath,
  queryMissingComfyModels
} from '../comfyui/normalize-workflow'

const abortControllers = new Map<string, AbortController>()

function postBroadcastNodeEvent(event: AiVideoNodeEvent): void {
  for (const win of BrowserWindow.getAllWindows()) {
    win.webContents.send(IpcChannels.onAiVideoNodeEvent, event)
  }
}

function queryEffectivePrompt(node: AiVideoCanvasNode): string {
  return (node.manualPrompt?.trim() || node.prompt || '').trim()
}

function querySkillCtx(project: AiVideoProject, node: AiVideoCanvasNode): SkillInjectContext {
  const ids = [...(project.globalSkillIds ?? []), ...(node.skillIds ?? [])]
  // 分镜视频默认带上官方 H3 提示词技能，即使未勾选全局 skill
  if (node.kind === 'video_gen' && !ids.includes(AI_VIDEO_H3_PROMPT_SKILL_ID)) {
    ids.push(AI_VIDEO_H3_PROMPT_SKILL_ID)
  }
  return { sessionSkillIds: ids }
}

/**
 * 读取官方 h3-prompt-writing 的参考指南全文。
 * 有参考图时优先 I2VA（base）；多参考时用 Ref2VA（ref）。
 */
function queryH3PromptReferenceGuide(refImageCount: number): string {
  const refDir = join(getSkillsDir(), AI_VIDEO_H3_PROMPT_SKILL_ID, 'references')
  const fileName = refImageCount >= 2 ? 'ref-en.txt' : 'base-en.txt'
  const path = join(refDir, fileName)
  if (!existsSync(path)) return ''
  try {
    const text = readFileSync(path, 'utf-8')
    // 控制注入体积，避免撑爆 context
    return text.length > 12000 ? `${text.slice(0, 12000)}\n\n...(指南已截断)` : text
  } catch {
    return ''
  }
}

/** 组装 MiniMax H3 提示词改写所需的技能正文 + 指南 */
function queryH3PromptSkillBlock(
  skillCtx: SkillInjectContext,
  refImageCount: number
): string {
  const skillBody =
    queryInjectableSkillContent(AI_VIDEO_H3_PROMPT_SKILL_ID, skillCtx, 6000) ||
    `# 技能：${AI_VIDEO_H3_PROMPT_SKILL_ID}\n按 MiniMax H3 结构改写视频提示词。`
  const guide = queryH3PromptReferenceGuide(refImageCount)
  const modeHint =
    refImageCount >= 2
      ? '当前模式：Ref2VA（多参考）。按 references/ref-en.txt 六段结构输出。'
      : refImageCount === 1
        ? '当前模式：I2VA（首帧参考）。按 references/base-en.txt，使用 integrated_multimodal_description / overall_soundscape / non_diegetic_music。'
        : '当前模式：T2VA（纯文生视频）。按 references/base-en.txt。'
  return [skillBody, `## 模式提示\n${modeHint}`, guide ? `## H3 官方指南\n${guide}` : '']
    .filter(Boolean)
    .join('\n\n')
}

function queryUpstreamNodes(
  project: AiVideoProject,
  nodeId: string
): AiVideoCanvasNode[] {
  const incoming = project.canvas.edges.filter((e) => e.target === nodeId)
  return incoming
    .map((e) => project.canvas.nodes.find((n) => n.id === e.source))
    .filter((n): n is AiVideoCanvasNode => Boolean(n))
}

/**
 * 按节点语义收集参考图上游：
 * - 三视图 ← 定妆 character
 * - 分镜 ← refs 或入边中的三视图/场景/道具
 * - 视频 ← 分镜图
 * 显式 refs 优先，再按 required kinds 从入边补齐。
 */
function queryReferenceSourceNodes(
  project: AiVideoProject,
  node: AiVideoCanvasNode
): AiVideoCanvasNode[] {
  const upstream = queryUpstreamNodes(project, node.id)
  const byId = new Map(project.canvas.nodes.map((n) => [n.id, n]))
  const required = queryAiVideoRequiredRefKinds(node.kind)
  const picked: AiVideoCanvasNode[] = []
  const seen = new Set<string>()

  const push = (n: AiVideoCanvasNode | undefined): void => {
    if (!n || seen.has(n.id)) return
    if (!n.result?.localPath) return
    seen.add(n.id)
    picked.push(n)
  }

  // 1) 用户 @ / refs
  for (const id of node.refs ?? []) {
    push(byId.get(id))
  }

  // 2) 按业务必填 kind 从入边补齐（保持 character_views → scene → prop 顺序）
  if (required.length) {
    for (const kind of required) {
      for (const u of upstream) {
        if (u.kind === kind) push(u)
      }
    }
  } else {
    // 非强制参考节点：任意上游图片
    for (const u of upstream) {
      if (u.type === 'image') push(u)
    }
  }

  return picked
}

/** 校验必填参考是否齐全 */
function queryAssertRequiredRefs(
  node: AiVideoCanvasNode,
  refs: AiVideoCanvasNode[]
): void {
  const required = queryAiVideoRequiredRefKinds(node.kind)
  if (!required.length) return
  if (refs.length) return

  if (node.kind === 'character_views') {
    throw new Error('三视图需要参考角色定妆图：请先运行定妆节点，并确保已连线到本节点')
  }
  if (node.kind === 'storyboard') {
    throw new Error(
      '分镜图需要参考角色三视图 / 场景 / 道具：请先生成并连线（或 @ 引用）对应节点'
    )
  }
  if (node.kind === 'video_gen') {
    throw new Error('分镜视频需要参考分镜图：请先运行分镜节点并连线到本节点')
  }
}

/** 校验 refs：必须是入边可达，且 kind 符合当前节点允许的参考类型 */
export function queryValidateNodeRefs(
  project: AiVideoProject,
  node: AiVideoCanvasNode
): { ok: true; refs: AiVideoCanvasNode[] } | { ok: false; message: string } {
  const upstream = queryUpstreamNodes(project, node.id)
  const upstreamIds = new Set(upstream.map((n) => n.id))
  const allowedKinds = new Set([
    ...queryAiVideoRequiredRefKinds(node.kind),
    ...AI_VIDEO_REF_KINDS
  ])
  const refs = node.refs ?? []
  const resolved: AiVideoCanvasNode[] = []
  for (const refId of refs) {
    if (!upstreamIds.has(refId)) {
      return {
        ok: false,
        message: `@ 引用 ${refId} 未连接到当前节点，只能引用已连线的上游参考图节点`
      }
    }
    const target = upstream.find((n) => n.id === refId)!
    if (allowedKinds.size && !allowedKinds.has(target.kind)) {
      return {
        ok: false,
        message: `@ 引用「${target.title}」类型不可用（当前节点不允许参考 ${target.kind}）`
      }
    }
    resolved.push(target)
  }
  return { ok: true, refs: resolved }
}

/** 拓扑排序（Kahn） */
function queryTopologicalNodeIds(project: AiVideoProject): string[] {
  const nodes = project.canvas.nodes
  const indeg = new Map(nodes.map((n) => [n.id, 0]))
  const adj = new Map<string, string[]>()
  for (const e of project.canvas.edges) {
    if (!indeg.has(e.source) || !indeg.has(e.target)) continue
    indeg.set(e.target, (indeg.get(e.target) ?? 0) + 1)
    const list = adj.get(e.source) ?? []
    list.push(e.target)
    adj.set(e.source, list)
  }
  const queue = nodes.filter((n) => (indeg.get(n.id) ?? 0) === 0).map((n) => n.id)
  const order: string[] = []
  while (queue.length) {
    const id = queue.shift()!
    order.push(id)
    for (const next of adj.get(id) ?? []) {
      const d = (indeg.get(next) ?? 0) - 1
      indeg.set(next, d)
      if (d === 0) queue.push(next)
    }
  }
  for (const n of nodes) {
    if (!order.includes(n.id)) order.push(n.id)
  }
  return order
}

async function queryLlmJson<T>(params: {
  system: string
  user: string
  skillCtx?: SkillInjectContext
}): Promise<T> {
  const settings = querySettings()
  const model = createChatModel(settings, 'script')
  const skillBlock = params.skillCtx
    ? queryInjectableSkillPrompt(4000, params.skillCtx)
    : ''
  const system = skillBlock
    ? `${params.system}\n\n## 可用技能目录\n${skillBlock}`
    : params.system
  const res = await model.invoke([
    new SystemMessage(system),
    new HumanMessage(params.user)
  ])
  const text = typeof res.content === 'string' ? res.content : JSON.stringify(res.content)
  const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/)
  if (!match) {
    throw new Error('大模型未返回可解析 JSON')
  }
  return JSON.parse(match[0]) as T
}

interface ScreenwriterExpandPayload {
  style: string
  script: string
  characters: Array<{ name: string; description: string; imagePrompt: string }>
  scenes: Array<{ name: string; description: string; imagePrompt: string }>
  props: Array<{ name: string; description: string; imagePrompt: string }>
  storyboards: Array<{
    name: string
    description: string
    imagePrompt: string
    refNames?: string[]
  }>
}

function queryOrCreateAutoNode(
  project: AiVideoProject,
  params: {
    autoKey: string
    kind: AiVideoNodeKind
    title: string
    prompt: string
    position: { x: number; y: number }
    refs?: string[]
  }
): { project: AiVideoProject; nodeId: string } {
  const existing = project.canvas.nodes.find((n) => n.autoKey === params.autoKey)
  if (existing) {
    const nodes = project.canvas.nodes.map((n) =>
      n.id === existing.id
        ? {
            ...n,
            title: params.title,
            prompt: params.prompt,
            workflowId: n.workflowId || queryAiVideoDefaultWorkflow(params.kind),
            refs: params.refs ?? n.refs
          }
        : n
    )
    return {
      project: { ...project, canvas: { ...project.canvas, nodes } },
      nodeId: existing.id
    }
  }
  const id = randomUUID()
  const node: AiVideoCanvasNode = {
    id,
    title: params.title,
    type: queryAiVideoBaseType(params.kind),
    kind: params.kind,
    position: params.position,
    prompt: params.prompt,
    workflowId: queryAiVideoDefaultWorkflow(params.kind),
    status: 'idle',
    autoGenerated: true,
    autoKey: params.autoKey,
    refs: params.refs,
    // 分镜视频节点默认挂官方 H3 提示词 skill（可在 Inspector 调整）
    skillIds:
      params.kind === 'video_gen' ? [AI_VIDEO_H3_PROMPT_SKILL_ID] : undefined
  }
  return {
    project: {
      ...project,
      canvas: {
        ...project.canvas,
        nodes: [...project.canvas.nodes, node]
      }
    },
    nodeId: id
  }
}

function postEnsureEdge(
  project: AiVideoProject,
  source: string,
  target: string
): AiVideoProject {
  if (project.canvas.edges.some((e) => e.source === source && e.target === target)) {
    return project
  }
  const edge: AiVideoCanvasEdge = {
    id: `e-${source.slice(0, 8)}-${target.slice(0, 8)}`,
    source,
    target
  }
  return {
    ...project,
    canvas: { ...project.canvas, edges: [...project.canvas.edges, edge] }
  }
}

async function postRunScreenwriter(
  project: AiVideoProject,
  node: AiVideoCanvasNode,
  signal: AbortSignal
): Promise<AiVideoProject> {
  const userInput = queryEffectivePrompt(node)
  if (!userInput) {
    throw new Error('请先填写编剧大纲或用户输入')
  }
  if (signal.aborted) throw new Error('已取消')

  const payload = await queryLlmJson<ScreenwriterExpandPayload>({
    skillCtx: querySkillCtx(project, node),
    system: `你是资深短剧/AI视频编剧。根据用户输入产出专业剧本结构化 JSON（不要 markdown）。
字段：
- style: 整体视觉风格（后续所有节点必须遵循）
- script: 完整剧本文本
- characters: [{name, description, imagePrompt}] 角色设定与定妆 AI 绘图提示词
- scenes: [{name, description, imagePrompt}]
- props: [{name, description, imagePrompt}]
- storyboards: [{name, description, imagePrompt, refNames}] 分镜；refNames 引用上面角色/场景/道具的 name
只输出 JSON。`,
    user: userInput
  })

  let next = project
  const screenwriterId = node.id

  const scriptRes = queryOrCreateAutoNode(next, {
    autoKey: 'script_text:main',
    kind: 'script_text',
    title: '剧本',
    prompt: '',
    position: { x: node.position.x + 320, y: node.position.y }
  })
  next = scriptRes.project
  next = {
    ...next,
    canvas: {
      ...next.canvas,
      nodes: next.canvas.nodes.map((n) =>
        n.id === scriptRes.nodeId
          ? {
              ...n,
              status: 'success' as const,
              result: {
                text: `【风格】${payload.style}\n\n${payload.script}`,
                mediaType: 'text' as const
              },
              prompt: payload.style
            }
          : n.id === screenwriterId
            ? {
                ...n,
                status: 'success' as const,
                result: {
                  text: payload.script,
                  mediaType: 'text' as const
                }
              }
            : n
      )
    }
  }
  next = postEnsureEdge(next, screenwriterId, scriptRes.nodeId)

  const charViewIds = new Map<string, string>()
  const sceneIds = new Map<string, string>()
  const propIds = new Map<string, string>()

  let col = 0
  for (const ch of payload.characters ?? []) {
    const charRes = queryOrCreateAutoNode(next, {
      autoKey: `character:${ch.name}`,
      kind: 'character',
      title: `定妆·${ch.name}`,
      prompt: `${payload.style}。${ch.imagePrompt || ch.description}`,
      position: { x: node.position.x + 320, y: node.position.y + 180 + col * 140 }
    })
    next = charRes.project
    next = postEnsureEdge(next, screenwriterId, charRes.nodeId)

    const viewsRes = queryOrCreateAutoNode(next, {
      autoKey: `character_views:${ch.name}`,
      kind: 'character_views',
      title: `三视图·${ch.name}`,
      prompt: `${payload.style}。角色三视图，正面侧面背面，白底，保持与定妆图同一角色，${ch.name}，${ch.description}`,
      position: { x: node.position.x + 640, y: node.position.y + 180 + col * 140 },
      refs: [charRes.nodeId]
    })
    next = viewsRes.project
    next = postEnsureEdge(next, charRes.nodeId, viewsRes.nodeId)
    charViewIds.set(ch.name, viewsRes.nodeId)
    col++
  }

  let row = 0
  for (const sc of payload.scenes ?? []) {
    const scRes = queryOrCreateAutoNode(next, {
      autoKey: `scene:${sc.name}`,
      kind: 'scene',
      title: `场景·${sc.name}`,
      prompt: `${payload.style}。${sc.imagePrompt || sc.description}`,
      position: {
        x: node.position.x + 320,
        y: node.position.y + 180 + col * 140 + row * 140
      }
    })
    next = scRes.project
    next = postEnsureEdge(next, screenwriterId, scRes.nodeId)
    sceneIds.set(sc.name, scRes.nodeId)
    row++
  }

  for (const pr of payload.props ?? []) {
    const prRes = queryOrCreateAutoNode(next, {
      autoKey: `prop:${pr.name}`,
      kind: 'prop',
      title: `道具·${pr.name}`,
      prompt: `${payload.style}。${pr.imagePrompt || pr.description}`,
      position: {
        x: node.position.x + 320,
        y: node.position.y + 180 + (col + row) * 140
      }
    })
    next = prRes.project
    next = postEnsureEdge(next, screenwriterId, prRes.nodeId)
    propIds.set(pr.name, prRes.nodeId)
    row++
  }

  let sbIndex = 0
  const storyboardIds: string[] = []
  for (const sb of payload.storyboards ?? []) {
    const sbText = queryOrCreateAutoNode(next, {
      autoKey: `storyboard_text:${sb.name}`,
      kind: 'storyboard_text',
      title: `分镜文·${sb.name}`,
      prompt: sb.description,
      position: { x: node.position.x + 960, y: node.position.y + sbIndex * 160 }
    })
    next = sbText.project
    next = {
      ...next,
      canvas: {
        ...next.canvas,
        nodes: next.canvas.nodes.map((n) =>
          n.id === sbText.nodeId
            ? {
                ...n,
                status: 'success' as const,
                result: { text: sb.description, mediaType: 'text' as const }
              }
            : n
        )
      }
    }

    const refIds: string[] = []
    for (const name of sb.refNames ?? []) {
      const id = charViewIds.get(name) || sceneIds.get(name) || propIds.get(name)
      if (id) refIds.push(id)
    }
    // 未声明 refNames 时，默认挂上全部三视图 + 场景 + 道具，保证分镜有参考
    if (!refIds.length) {
      for (const id of charViewIds.values()) refIds.push(id)
      for (const id of sceneIds.values()) refIds.push(id)
      for (const id of propIds.values()) refIds.push(id)
    }

    const sbImg = queryOrCreateAutoNode(next, {
      autoKey: `storyboard:${sb.name}`,
      kind: 'storyboard',
      title: `分镜·${sb.name}`,
      prompt: `${payload.style}。${sb.imagePrompt || sb.description}`,
      position: { x: node.position.x + 1280, y: node.position.y + sbIndex * 160 },
      refs: refIds
    })
    next = sbImg.project
    next = postEnsureEdge(next, screenwriterId, sbImg.nodeId)
    next = postEnsureEdge(next, sbText.nodeId, sbImg.nodeId)
    for (const refId of refIds) {
      next = postEnsureEdge(next, refId, sbImg.nodeId)
    }

    const vid = queryOrCreateAutoNode(next, {
      autoKey: `video_gen:${sb.name}`,
      kind: 'video_gen',
      title: `视频·${sb.name}`,
      prompt: sb.description,
      position: { x: node.position.x + 1600, y: node.position.y + sbIndex * 160 },
      refs: [sbImg.nodeId]
    })
    next = vid.project
    next = postEnsureEdge(next, sbImg.nodeId, vid.nodeId)
    storyboardIds.push(vid.nodeId)
    sbIndex++
  }

  if (storyboardIds.length) {
    const merge = queryOrCreateAutoNode(next, {
      autoKey: 'video_merge:final',
      kind: 'video_merge',
      title: '合成成片',
      prompt: '按分镜顺序合并全部镜头视频',
      position: { x: node.position.x + 1920, y: node.position.y + 80 }
    })
    next = merge.project
    for (const vidId of storyboardIds) {
      next = postEnsureEdge(next, vidId, merge.nodeId)
    }
  }

  return postAiVideoProject(next)
}

async function queryLlmWorkflowPatch(params: {
  workflowId: string
  workflow: Record<string, unknown>
  prompt: string
  skillCtx: SkillInjectContext
  hasRefs: boolean
  /** 参考图张数：决定 H3 I2VA / Ref2VA 指南 */
  refImageCount?: number
  /** 是否按 MiniMax H3 结构改写正向提示词 */
  rewriteAsH3?: boolean
}): Promise<{
  positivePrompt: string
  negativePrompt?: string
  nodeInputs?: Record<string, Record<string, unknown>>
}> {
  const slots = queryComfyWorkflowSlots(params.workflow)
  const h3Block =
    params.rewriteAsH3 === true
      ? queryH3PromptSkillBlock(params.skillCtx, params.refImageCount ?? (params.hasRefs ? 1 : 0))
      : ''
  try {
    const parsed = await queryLlmJson<{
      positivePrompt?: string
      negativePrompt?: string
      nodeInputs?: Record<string, Record<string, unknown>>
    }>({
      skillCtx: params.skillCtx,
      system: `你是 ComfyUI 工作流参数工程师。根据用户提示词与工作流槽位，输出 JSON：
{ "positivePrompt": string, "negativePrompt"?: string, "nodeInputs"?: { [nodeId]: { ... } } }
nodeInputs 仅在确需覆盖特定节点时使用。不要输出 markdown。
工作流：${params.workflowId}
LoadImage 节点：${slots.loadImageNodeIds.join(',') || '无'}
文本编码节点：${slots.textEncodeNodeIds.join(',') || '无'}
class_types：${slots.classTypes.slice(0, 40).join(', ')}
${params.hasRefs ? '已有参考图将由系统注入 LoadImage，你只需优化提示词。' : ''}
${
  params.rewriteAsH3
    ? `本节点使用 MiniMax H3 视频工作流。positivePrompt 必须严格按下方 H3 skill / 指南改写为英文结构化提示词（保留对白/歌词原文语言）；不要写成普通一句文生视频描述。`
    : ''
}
${h3Block ? `\n## MiniMax H3 Prompt Skill\n${h3Block}` : ''}`,
      user: params.prompt
    })
    return {
      positivePrompt: parsed.positivePrompt?.trim() || params.prompt,
      negativePrompt: parsed.negativePrompt,
      nodeInputs: parsed.nodeInputs
    }
  } catch {
    return { positivePrompt: params.prompt }
  }
}

async function postRunMediaNode(
  project: AiVideoProject,
  node: AiVideoCanvasNode,
  signal: AbortSignal
): Promise<AiVideoProject> {
  let workflowId = queryResolveWorkflowRelativePath(
    node.workflowId || queryAiVideoDefaultWorkflow(node.kind) || ''
  )
  if (!workflowId) {
    throw new Error(`节点「${node.title}」未配置工作流`)
  }

  const refCheck = queryValidateNodeRefs(project, node)
  if (!refCheck.ok) throw new Error(refCheck.message)

  // 按语义强制收集参考图（三视图←定妆，分镜←三视图/场景/道具，视频←分镜）
  const refNodes = queryReferenceSourceNodes(project, node)
  queryAssertRequiredRefs(node, refNodes)

  const uploadedNames: string[] = []
  for (const ref of refNodes) {
    const path = ref.result?.localPath
    if (!path) continue
    const up = await postComfyUploadImage(path)
    uploadedNames.push(up.name)
  }

  // 图生图工作流：LoadImage 槽位不足时用第一张参考图填满，避免未使用 LoadImage 指向缺失文件
  const needsImageRefs =
    node.kind === 'character_views' ||
    node.kind === 'storyboard' ||
    node.kind === 'video_gen'
  if (needsImageRefs && !uploadedNames.length) {
    queryAssertRequiredRefs(node, [])
  }

  if (node.kind === 'video_merge') {
    const videos = queryUpstreamNodes(project, node.id).filter(
      (n) => n.type === 'video' && n.result?.localPath
    )
    if (!videos.length) {
      throw new Error('合成节点需要连接已生成的分镜视频')
    }
    for (const v of videos) {
      const up = await postComfyUploadImage(v.result!.localPath!)
      uploadedNames.push(up.name)
    }
  }

  // 需要参考图的节点强制走图生图 / r2v，避免被误配成纯文生图
  if (node.kind === 'character_views' || node.kind === 'storyboard') {
    workflowId = queryResolveWorkflowRelativePath(
      node.workflowId?.includes('i2i') || node.workflowId?.includes('flux')
        ? node.workflowId
        : AI_VIDEO_DEFAULT_WORKFLOWS.imageToImage
    )
  }
  if (node.kind === 'video_gen') {
    workflowId = queryResolveWorkflowRelativePath(
      node.workflowId || AI_VIDEO_DEFAULT_WORKFLOWS.videoR2v
    )
  }

  const prompt = queryEffectivePrompt(node)
  let workflowIdResolved = workflowId
  let workflow = queryLoadComfyWorkflowPrompt(workflowIdResolved)
  const preferZImage = /z.?image/i.test(workflowIdResolved)
  workflow = await postNormalizeComfyWorkflow(workflow, { preferZImage })

  // 远程缺权重时：参考图节点回退到 Z-Image i2i（仍带参考图），文生图才回退 t2i
  const missing = await queryMissingComfyModels(workflow)
  if (missing.length) {
    const fallback =
      needsImageRefs && uploadedNames.length
        ? AI_VIDEO_DEFAULT_WORKFLOWS.imageToImage
        : AI_VIDEO_DEFAULT_WORKFLOWS.textToImage
    if (workflowIdResolved !== fallback) {
      console.warn(
        `[ai-video] 工作流 ${workflowIdResolved} 缺少模型 ${missing.slice(0, 3).join(', ')}，回退 ${fallback}`
      )
      workflowIdResolved = fallback
      workflow = await postNormalizeComfyWorkflow(
        queryLoadComfyWorkflowPrompt(workflowIdResolved),
        { preferZImage: true }
      )
    }
  }

  // 多参考：在提示词中标注引用了哪些资产，便于模型理解
  const refLabels = refNodes.map((n) => n.title).filter(Boolean)
  const promptWithRefs =
    refLabels.length && (node.kind === 'storyboard' || node.kind === 'character_views')
      ? `${prompt}\n\n【参考图】${refLabels.join('、')}`
      : prompt

  // 分镜视频（MiniMax H3）始终走 H3 skill 改写；其它节点仅在提示词过短时补全
  const isH3Video =
    node.kind === 'video_gen' &&
    (/minimax|h3/i.test(workflowIdResolved) ||
      workflowIdResolved.includes(AI_VIDEO_DEFAULT_WORKFLOWS.videoR2v))
  const shouldRewrite =
    isH3Video || (!isH3Video && promptWithRefs.trim().length <= 8)

  const llmPatch = shouldRewrite
    ? await queryLlmWorkflowPatch({
        workflowId: workflowIdResolved,
        workflow,
        prompt: promptWithRefs || node.title,
        skillCtx: querySkillCtx(project, node),
        hasRefs: uploadedNames.length > 0,
        refImageCount: uploadedNames.length,
        rewriteAsH3: isH3Video
      })
    : { positivePrompt: promptWithRefs }

  // LoadImage 槽位用参考图填满（不足则重复第一张）
  let refNamesForPatch = [...uploadedNames]
  if (refNamesForPatch.length === 1) {
    refNamesForPatch = [refNamesForPatch[0], refNamesForPatch[0], refNamesForPatch[0]]
  } else if (refNamesForPatch.length === 2) {
    refNamesForPatch = [refNamesForPatch[0], refNamesForPatch[1], refNamesForPatch[0]]
  }

  const patched = postPatchComfyWorkflow(workflow, {
    positivePrompt: llmPatch.positivePrompt,
    negativePrompt: llmPatch.negativePrompt,
    referenceImageNames: refNamesForPatch
  })
  const finalWorkflow = await postNormalizeComfyWorkflow(patched, {
    preferZImage: true
  })

  if (signal.aborted) throw new Error('已取消')

  const destDir = queryAiVideoOutputsDir(project.id)
  const out = await postComfyRunAndDownload({
    workflow: finalWorkflow,
    destDir,
    filePrefix: `${node.kind}_${node.id.slice(0, 8)}`,
    signal
  })

  let next = postPatchAiVideoNode(project.id, node.id, {
    status: 'success',
    errorMessage: undefined,
    result: {
      localPath: out.localPath,
      mediaType: out.mediaType
    },
    // 落盘实际使用的参考，便于 UI 展示
    refs: refNodes.map((n) => n.id)
  })
  if (!next) throw new Error('项目不存在')

  if (out.mediaType === 'image' && !next.thumbnailPath) {
    next = postAiVideoProject({ ...next, thumbnailPath: out.localPath })
  }
  return next
}

async function postRunTextPassthrough(
  project: AiVideoProject,
  node: AiVideoCanvasNode
): Promise<AiVideoProject> {
  const text = queryEffectivePrompt(node)
  const updated = postPatchAiVideoNode(project.id, node.id, {
    status: 'success',
    result: { text, mediaType: 'text' }
  })
  if (!updated) throw new Error('项目不存在')
  return updated
}

async function postExecuteNode(
  projectId: string,
  nodeId: string,
  signal: AbortSignal
): Promise<void> {
  const project = queryAiVideoProject(projectId)
  if (!project) throw new Error('项目不存在')
  const node = project.canvas.nodes.find((n) => n.id === nodeId)
  if (!node) throw new Error('节点不存在')

  postPatchAiVideoNode(projectId, nodeId, {
    status: 'running',
    errorMessage: undefined
  })
  postBroadcastNodeEvent({
    projectId,
    nodeId,
    status: 'running',
    progress: 0
  })

  try {
    let next: AiVideoProject
    if (node.kind === 'screenwriter') {
      next = await postRunScreenwriter(project, node, signal)
    } else if (node.type === 'text') {
      next = await postRunTextPassthrough(project, node)
    } else {
      next = await postRunMediaNode(project, node, signal)
    }

    const fresh = next.canvas.nodes.find((n) => n.id === nodeId)
    postBroadcastNodeEvent({
      projectId,
      nodeId,
      status: 'success',
      progress: 100,
      result: fresh?.result,
      project: next
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    postPatchAiVideoNode(projectId, nodeId, {
      status: 'error',
      errorMessage: message
    })
    postBroadcastNodeEvent({
      projectId,
      nodeId,
      status: 'error',
      errorMessage: message
    })
    throw err
  }
}

/** 单节点执行 */
export async function postAiVideoNodeRun(
  req: AiVideoNodeRunRequest
): Promise<{ ok: boolean; message?: string }> {
  const { projectId, nodeId } = req
  const existing = abortControllers.get(projectId)
  if (existing) existing.abort()
  const controller = new AbortController()
  abortControllers.set(projectId, controller)

  try {
    await postExecuteNode(projectId, nodeId, controller.signal)
    return { ok: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { ok: false, message }
  } finally {
    if (abortControllers.get(projectId) === controller) {
      abortControllers.delete(projectId)
    }
  }
}

/** 按拓扑序批量执行；单节点失败不阻断后续独立节点 */
export async function postAiVideoCanvasRun(
  req: AiVideoCanvasRunRequest
): Promise<{ ok: boolean; message?: string }> {
  const project = queryAiVideoProject(req.projectId)
  if (!project) return { ok: false, message: '项目不存在' }

  const existing = abortControllers.get(req.projectId)
  if (existing) existing.abort()
  const controller = new AbortController()
  abortControllers.set(req.projectId, controller)

  const errors: string[] = []
  try {
    const order = queryTopologicalNodeIds(project)
    for (const nodeId of order) {
      if (controller.signal.aborted) {
        return { ok: false, message: `已取消。已失败：${errors.join('；') || '无'}` }
      }
      const fresh = queryAiVideoProject(req.projectId)
      const node = fresh?.canvas.nodes.find((n) => n.id === nodeId)
      // 跳过已成功且无 force 的文本展示节点可再跑；媒体失败需重试，这里一律尝试
      if (!node) continue
      try {
        await postExecuteNode(req.projectId, nodeId, controller.signal)
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        errors.push(`${node.title}: ${message}`)
        // 继续跑拓扑后续节点
      }
    }
    if (errors.length) {
      return {
        ok: false,
        message: `${errors.length} 个节点失败：${errors.slice(0, 5).join('；')}`
      }
    }
    return { ok: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { ok: false, message }
  } finally {
    if (abortControllers.get(req.projectId) === controller) {
      abortControllers.delete(req.projectId)
    }
  }
}

export function postAiVideoAbortRun(projectId: string): void {
  const c = abortControllers.get(projectId)
  if (c) {
    c.abort()
    abortControllers.delete(projectId)
  }
}
