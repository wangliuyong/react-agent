/**
 * 将 remotion-template-* 技能中的 template/ 拼装进会话 Remotion 工程，
 * 写入 Agent 处理后的 props，并可启动 Studio 预览。
 */

import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync
} from 'fs'
import { join } from 'path'
import { queryBundledResourcesRoot, querySkillsDir } from '../store/resources'
import {
  postInitRemotionProject,
  postStartRemotionStudio,
  queryRemotionProjectDir
} from './remotion-service'

/** skill template/manifest.json 中单条 Composition 声明 */
export interface RemotionTemplateManifestComposition {
  id: string
  componentPath: string
  componentExport: string
  defaultPropsPath?: string
  defaultPropsExport?: string
  width: number
  height: number
  fps: number
  durationInFrames: number
}

export interface RemotionTemplateManifest {
  compositions: RemotionTemplateManifestComposition[]
  /** 相对 template 根的 props 文件，如 compositions/hot-news/default-props.ts */
  propsFile?: string
  propsKind?: string
}

export interface PostApplyRemotionTemplateSkillInput {
  sessionId: string
  skillId: string
  /** 目标 Composition；缺省取 manifest 第一条 */
  compositionId?: string
  /** Agent / UI 处理后的 props（hot-news 等） */
  props?: Record<string, unknown>
  width?: number
  height?: number
  fps?: number
  durationInFrames?: number
  /** 拼装后是否启动 Studio，默认 true */
  openStudio?: boolean
}

export interface PostApplyRemotionTemplateSkillResult {
  ok: boolean
  message: string
  projectDir?: string
  compositionId?: string
  studioUrl?: string
  skillId?: string
}

/** 解析技能模版根目录：优先可写副本，否则内置 resources/skills */
export function queryRemotionTemplateSkillDir(skillId: string): string | null {
  const id = String(skillId ?? '').trim()
  if (!id) return null
  const candidates = [
    join(querySkillsDir(), id),
    join(queryBundledResourcesRoot(), 'skills', id)
  ]
  for (const dir of candidates) {
    if (existsSync(join(dir, 'SKILL.md'))) return dir
  }
  return null
}

function queryLoadManifest(templateRoot: string): RemotionTemplateManifest {
  const path = join(templateRoot, 'manifest.json')
  if (!existsSync(path)) {
    throw new Error(`模版缺少 manifest.json：${path}`)
  }
  const raw = JSON.parse(readFileSync(path, 'utf-8')) as RemotionTemplateManifest
  if (!Array.isArray(raw.compositions) || raw.compositions.length === 0) {
    throw new Error('manifest.json 未声明 compositions')
  }
  return raw
}

/** 将 template 下文件拷入工程 src（保留 compositions 等相对结构） */
function postCopyTemplateIntoProject(templateRoot: string, projectSrc: string): void {
  mkdirSync(projectSrc, { recursive: true })
  const entries = readdirSync(templateRoot, { withFileTypes: true })
  for (const entry of entries) {
    if (entry.name === 'manifest.json') continue
    const from = join(templateRoot, entry.name)
    const to = join(projectSrc, entry.name)
    cpSync(from, to, { recursive: true })
  }
}

/**
 * 根据 manifest 生成 Root.tsx：仅注册当前预览/渲染的焦点 Composition。
 * 不保留 starter Main，也不注册同模版其它画幅变体，避免 Studio 侧栏出现多个条目。
 */
export function queryBuildRootSourceFromManifest(
  manifest: RemotionTemplateManifest,
  focus: {
    compositionId: string
    width: number
    height: number
    fps: number
    durationInFrames: number
  }
): string {
  const focusComp =
    manifest.compositions.find((c) => c.id === focus.compositionId) ??
    manifest.compositions[0]
  if (!focusComp) {
    throw new Error('manifest 未声明任何 Composition')
  }

  const importLines: string[] = [
    `import type { ComponentType } from 'react'`,
    `import { Composition } from 'remotion'`,
    `import { ${focusComp.componentExport} } from '${focusComp.componentPath}'`
  ]
  if (focusComp.defaultPropsPath && focusComp.defaultPropsExport) {
    importLines.push(
      `import { ${focusComp.defaultPropsExport} } from '${focusComp.defaultPropsPath}'`
    )
  }

  const castName = `${focusComp.componentExport}ForComposition`
  const defaultProps =
    focusComp.defaultPropsExport != null
      ? `\n        defaultProps={${focusComp.defaultPropsExport} as unknown as Record<string, unknown>}`
      : ''

  return `${importLines.join('\n')}

const ${castName} = ${focusComp.componentExport} as unknown as ComponentType<Record<string, unknown>>

/**
 * Remotion 根入口：仅当前焦点 Composition（由 remotion_apply_template_skill 生成）。
 */
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="${focusComp.id}"
        component={${castName}}
        durationInFrames={${focus.durationInFrames}}
        fps={${focus.fps}}
        width={${focus.width}}
        height={${focus.height}}${defaultProps}
      />
    </>
  )
}
`
}

/**
 * 将 HotNewsProps JSON 写入 default-props.ts（覆盖宽/竖版常量）。
 */
function postWriteHotNewsDefaultProps(filePath: string, props: Record<string, unknown>): void {
  const propsJson = JSON.stringify(props, null, 2)
  const content = `import type { HotNewsProps } from './types'

/** 由 remotion_apply_template_skill 写入的热点 props（横竖版共用同一文案） */
export const HOT_NEWS_WIDE_DEFAULT_PROPS: HotNewsProps = ${propsJson}

export const HOT_NEWS_VERTICAL_DEFAULT_PROPS: HotNewsProps = ${propsJson}
`
  mkdirSync(join(filePath, '..'), { recursive: true })
  writeFileSync(filePath, content, 'utf-8')
}

/**
 * 拼装技能模版到会话工程，可选启动 Studio。
 */
export async function postApplyRemotionTemplateSkill(
  input: PostApplyRemotionTemplateSkillInput
): Promise<PostApplyRemotionTemplateSkillResult> {
  const skillId = String(input.skillId ?? '').trim()
  const sessionId = String(input.sessionId ?? '').trim()
  if (!skillId || !sessionId) {
    return { ok: false, message: 'skillId 与 sessionId 不能为空' }
  }

  const skillDir = queryRemotionTemplateSkillDir(skillId)
  if (!skillDir) {
    return { ok: false, message: `找不到技能：${skillId}` }
  }

  const templateRoot = join(skillDir, 'template')
  if (!existsSync(join(templateRoot, 'manifest.json'))) {
    return { ok: false, message: `技能未包含可拼装模版：${skillId}/template/manifest.json` }
  }

  let manifest: RemotionTemplateManifest
  try {
    manifest = queryLoadManifest(templateRoot)
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : String(err) }
  }

  const requestedId = String(input.compositionId ?? '').trim()
  const focusComp =
    manifest.compositions.find((c) => c.id === requestedId) ?? manifest.compositions[0]
  const compositionId = focusComp.id
  const width = input.width ?? focusComp.width
  const height = input.height ?? focusComp.height
  const fps = input.fps ?? focusComp.fps
  const durationInFrames = input.durationInFrames ?? focusComp.durationInFrames

  const init = postInitRemotionProject(sessionId, {
    compositionId,
    width,
    height,
    fps,
    durationInFrames
  })
  const projectDir = init.projectDir
  const projectSrc = join(projectDir, 'src')

  try {
    postCopyTemplateIntoProject(templateRoot, projectSrc)

    if (input.props && manifest.propsFile) {
      const propsPath = join(projectSrc, manifest.propsFile)
      if (manifest.propsKind === 'hot-news') {
        postWriteHotNewsDefaultProps(propsPath, input.props)
      } else {
        writeFileSync(
          propsPath,
          `export default ${JSON.stringify(input.props, null, 2)}\n`,
          'utf-8'
        )
      }
    }

    const rootSource = queryBuildRootSourceFromManifest(manifest, {
      compositionId,
      width,
      height,
      fps,
      durationInFrames
    })
    writeFileSync(join(projectSrc, 'Root.tsx'), rootSource, 'utf-8')
  } catch (err) {
    return {
      ok: false,
      message: `拼装模版失败：${err instanceof Error ? err.message : String(err)}`
    }
  }

  const openStudio = input.openStudio !== false
  let studioUrl: string | undefined
  if (openStudio) {
    const studio = await postStartRemotionStudio({
      sessionId,
      projectDir,
      openBrowser: true
    })
    if (studio.ok && studio.url) {
      studioUrl = studio.url
    }
  }

  return {
    ok: true,
    message: studioUrl
      ? `已拼装技能「${skillId}」并打开 Studio：${studioUrl}`
      : `已拼装技能「${skillId}」到 ${projectDir}`,
    projectDir,
    compositionId,
    studioUrl,
    skillId
  }
}

export { queryRemotionProjectDir }
