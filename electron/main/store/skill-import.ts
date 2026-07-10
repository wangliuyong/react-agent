import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'
import type { ProjectSkillDetail, SkillImportPreview } from '../../../shared/types'
import {
  getSkillsDir,
  parseSkillMarkdown,
  queryProjectSkillDetail,
  validateSkillId
} from './skills'

/** 单次拉取最大体积（512KB），防止异常大文件撑爆内存 */
const MAX_FETCH_BYTES = 512_000

/** 远程请求超时（毫秒） */
const FETCH_TIMEOUT_MS = 30_000

/** URL 解析结果：raw 地址 + 建议的技能 id */
interface ResolvedImportSource {
  skillMdUrl: string
  examplesMdUrl?: string
  suggestedId: string
}

/**
 * 将展示名称或路径片段转为合法技能 id。
 * 与渲染层 slugifySkillId 规则一致，便于两端预览一致。
 */
function slugifyFromSegment(segment: string): string {
  const slug = segment
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-')
    .slice(0, 64)
  return slug || `skill-${Date.now()}`
}

/** 从 SKILL.md 路径推断目录名作为默认 id */
function suggestedIdFromSkillPath(path: string): string {
  const normalized = path.replace(/\\/g, '/').replace(/\/SKILL\.md$/i, '')
  const last = normalized.split('/').filter(Boolean).pop() ?? 'imported-skill'
  return slugifyFromSegment(last)
}

/**
 * 解析用户输入的 GitHub / 直链 URL，得到可 fetch 的 raw 地址。
 * 支持：GitHub blob/tree、raw.githubusercontent.com、任意 HTTPS 直链 SKILL.md。
 */
export function resolveSkillImportSource(input: string): ResolvedImportSource {
  const url = input.trim()
  if (!url) {
    throw new Error('请输入技能链接')
  }
  if (!/^https?:\/\//i.test(url)) {
    throw new Error('仅支持 http(s) 链接')
  }

  // GitHub blob：.../blob/<branch>/<path>/SKILL.md
  const blobMatch = url.match(
    /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)$/i
  )
  if (blobMatch) {
    const [, owner, repo, branch, filePath] = blobMatch
    const repoName = repo.replace(/\.git$/i, '')
    const rawBase = `https://raw.githubusercontent.com/${owner}/${repoName}/${branch}`
    const normalizedPath = filePath.replace(/\\/g, '/')

    if (/SKILL\.md$/i.test(normalizedPath)) {
      const dir = normalizedPath.replace(/\/SKILL\.md$/i, '')
      return {
        skillMdUrl: `${rawBase}/${normalizedPath}`,
        examplesMdUrl: dir ? `${rawBase}/${dir}/examples.md` : undefined,
        suggestedId: suggestedIdFromSkillPath(normalizedPath)
      }
    }

    // blob 指向技能目录内其他文件时，仍尝试同目录 SKILL.md
    const dir = normalizedPath.replace(/\/[^/]+$/, '')
    return {
      skillMdUrl: `${rawBase}/${dir}/SKILL.md`,
      examplesMdUrl: `${rawBase}/${dir}/examples.md`,
      suggestedId: suggestedIdFromSkillPath(dir)
    }
  }

  // GitHub tree：.../tree/<branch>/<path>
  const treeMatch = url.match(
    /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/tree\/([^/]+)\/?(.*)$/i
  )
  if (treeMatch) {
    const [, owner, repo, branch, dirPath] = treeMatch
    const repoName = repo.replace(/\.git$/i, '')
    const rawBase = `https://raw.githubusercontent.com/${owner}/${repoName}/${branch}`
    const normalizedDir = (dirPath || '').replace(/\\/g, '/').replace(/\/+$/, '')

    if (!normalizedDir) {
      throw new Error('请提供技能目录路径，例如 .cursor/skills/my-skill')
    }

    if (/SKILL\.md$/i.test(normalizedDir)) {
      const dir = normalizedDir.replace(/\/SKILL\.md$/i, '')
      return {
        skillMdUrl: `${rawBase}/${normalizedDir}`,
        examplesMdUrl: dir ? `${rawBase}/${dir}/examples.md` : undefined,
        suggestedId: suggestedIdFromSkillPath(normalizedDir)
      }
    }

    return {
      skillMdUrl: `${rawBase}/${normalizedDir}/SKILL.md`,
      examplesMdUrl: `${rawBase}/${normalizedDir}/examples.md`,
      suggestedId: suggestedIdFromSkillPath(normalizedDir)
    }
  }

  // raw.githubusercontent.com 或 gist 等直链
  if (/^https:\/\/raw\.githubusercontent\.com\//i.test(url) || /\.md(\?|$)/i.test(url)) {
    if (!/SKILL\.md(\?|$)/i.test(url)) {
      throw new Error('直链需指向 SKILL.md 文件，或改用 GitHub 目录/tree 链接')
    }
    const pathWithoutQuery = url.split('?')[0]
    return {
      skillMdUrl: url,
      examplesMdUrl: pathWithoutQuery.replace(/\/SKILL\.md$/i, '/examples.md'),
      suggestedId: suggestedIdFromSkillPath(pathWithoutQuery)
    }
  }

  throw new Error(
    '无法识别链接格式。支持：GitHub 仓库/tree/blob 链接、raw.githubusercontent.com 直链'
  )
}

/**
 * 通过 GitHub API 解析仓库 canonical 名称与默认分支。
 * 注意：用户名中的 0/O 等字符必须正确，API 不会纠正 whiteOdew → white0dew。
 */
async function fetchGithubRepoMeta(
  owner: string,
  repo: string
): Promise<{ owner: string; repo: string; defaultBranch: string }> {
  const repoName = repo.replace(/\.git$/i, '')
  const apiUrl = `https://api.github.com/repos/${owner}/${repoName}`
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const res = await fetch(apiUrl, {
      signal: controller.signal,
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'react-agent-skill-import/1.0'
      }
    })
    if (res.status === 404) {
      throw new Error(
        `仓库 ${owner}/${repoName} 不存在或无权访问。请确认链接中的用户名与仓库名拼写正确（如 white0dew 中的 0 是数字零）`
      )
    }
    if (!res.ok) {
      throw new Error(`GitHub API HTTP ${res.status}`)
    }
    const data = (await res.json()) as {
      full_name?: string
      default_branch?: string
    }
    const fullName = data.full_name ?? `${owner}/${repoName}`
    const [canonicalOwner, canonicalRepo] = fullName.split('/')
    return {
      owner: canonicalOwner,
      repo: canonicalRepo,
      defaultBranch: data.default_branch ?? 'main'
    }
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('GitHub API 请求超时')
    }
    throw err instanceof Error ? err : new Error(String(err))
  } finally {
    clearTimeout(timer)
  }
}

/** 用 GET 探测 raw 文件是否存在（raw.githubusercontent.com 对 HEAD 不可靠） */
async function probeRawFileExists(url: string, signal: AbortSignal): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: 'GET',
      signal,
      headers: {
        Range: 'bytes=0-0',
        'User-Agent': 'react-agent-skill-import/1.0'
      }
    })
    return res.ok || res.status === 206
  } catch {
    return false
  }
}

/** 通过 GitHub Contents API 查找 SKILL.md，返回 raw download_url */
async function findSkillMdViaGithubApi(
  owner: string,
  repo: string,
  branch: string,
  paths: string[],
  signal: AbortSignal
): Promise<{ skillMdUrl: string; skillPath: string } | null> {
  for (const path of paths) {
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${encodeURIComponent(branch)}`
    try {
      const res = await fetch(apiUrl, {
        signal,
        headers: {
          Accept: 'application/vnd.github+json',
          'User-Agent': 'react-agent-skill-import/1.0'
        }
      })
      if (!res.ok) continue
      const data = (await res.json()) as { download_url?: string }
      if (data.download_url) {
        return { skillMdUrl: data.download_url, skillPath: path }
      }
    } catch {
      // 尝试下一个路径
    }
  }
  return null
}

/**
 * 在 GitHub 仓库的默认分支下探测 SKILL.md 位置。
 * 优先 GitHub API（避免 raw HEAD 不可靠与用户名大小写问题），再 GET 探测兜底。
 */
async function resolveGithubRepoRootSource(
  owner: string,
  repo: string
): Promise<ResolvedImportSource> {
  const meta = await fetchGithubRepoMeta(owner, repo)
  const slug = slugifyFromSegment(meta.repo)
  const branches = [meta.defaultBranch, 'main', 'master'].filter(
    (b, i, arr) => arr.indexOf(b) === i
  )

  const pathCandidates = [
    'SKILL.md',
    `.cursor/skills/${slug}/SKILL.md`,
    `.cursor/skills/${meta.repo}/SKILL.md`,
    `${meta.repo}/SKILL.md`
  ]

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    for (const branch of branches) {
      const found = await findSkillMdViaGithubApi(
        meta.owner,
        meta.repo,
        branch,
        pathCandidates,
        controller.signal
      )
      if (found) {
        const dir = found.skillPath.replace(/\/SKILL\.md$/i, '')
        const examplesRel = dir ? `${dir}/examples.md` : 'examples.md'
        return {
          skillMdUrl: found.skillMdUrl,
          examplesMdUrl: `https://raw.githubusercontent.com/${meta.owner}/${meta.repo}/${branch}/${examplesRel}`,
          suggestedId: slugifyFromSegment(dir.split('/').pop() ?? meta.repo)
        }
      }

      // API 未命中时，GET 探测 raw（带 canonical owner/repo）
      const rawBase = `https://raw.githubusercontent.com/${meta.owner}/${meta.repo}/${branch}`
      for (const path of pathCandidates) {
        const skillMdUrl = `${rawBase}/${path}`
        const exists = await probeRawFileExists(skillMdUrl, controller.signal)
        if (exists) {
          const dir = path.replace(/\/SKILL\.md$/i, '')
          return {
            skillMdUrl,
            examplesMdUrl: dir ? `${rawBase}/${dir}/examples.md` : `${rawBase}/examples.md`,
            suggestedId: slugifyFromSegment(dir.split('/').pop() ?? meta.repo)
          }
        }
      }
    }
  } finally {
    clearTimeout(timer)
  }

  throw new Error(
    `未在 ${meta.owner}/${meta.repo} 找到 SKILL.md。` +
      `请确认仓库根目录存在 SKILL.md，或改用 tree 链接指向技能目录。`
  )
}

/** 同步解析 + 仓库根链接异步探测 */
async function resolveSkillImportSourceAsync(input: string): Promise<ResolvedImportSource> {
  const url = input.trim()
  try {
    return resolveSkillImportSource(url)
  } catch (err) {
    const repoRootMatch = url.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+)\/?(?:\?.*)?$/i)
    if (repoRootMatch) {
      const [, owner, repoRaw] = repoRootMatch
      return resolveGithubRepoRootSource(owner, repoRaw.replace(/\.git$/i, ''))
    }
    throw err
  }
}

/** 带超时与体积限制的 HTTP GET 文本拉取 */
async function fetchRemoteText(url: string): Promise<string> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'text/plain, text/markdown, */*',
        'User-Agent': 'react-agent-skill-import/1.0'
      }
    })

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`)
    }

    const text = await res.text()
    if (text.length > MAX_FETCH_BYTES) {
      throw new Error(`内容超过 ${MAX_FETCH_BYTES / 1024}KB 限制`)
    }
    return text
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('请求超时，请检查网络或链接是否可访问')
    }
    const msg = err instanceof Error ? err.message : String(err)
    throw new Error(`拉取失败（${url}）：${msg}`)
  } finally {
    clearTimeout(timer)
  }
}

/** 可选拉取 examples.md，404 时静默忽略 */
async function fetchOptionalExamples(url?: string): Promise<string | undefined> {
  if (!url) return undefined
  try {
    const text = await fetchRemoteText(url)
    const trimmed = text.trim()
    return trimmed || undefined
  } catch {
    return undefined
  }
}

/** 校验拉取到的 SKILL.md 内容有效 */
function assertValidSkillMarkdown(raw: string): void {
  const trimmed = raw.trim()
  if (!trimmed) {
    throw new Error('SKILL.md 内容为空')
  }
  if (trimmed.length < 10) {
    throw new Error('SKILL.md 内容过短，可能不是有效的技能文件')
  }
}

/**
 * 预览远程技能（不写盘），供 UI 展示建议 id 与元信息。
 */
export async function querySkillImportPreview(url: string): Promise<SkillImportPreview> {
  const source = await resolveSkillImportSourceAsync(url)
  const raw = await fetchRemoteText(source.skillMdUrl)
  assertValidSkillMarkdown(raw)

  const { name, description } = parseSkillMarkdown(raw)
  const examplesContent = await fetchOptionalExamples(source.examplesMdUrl)

  return {
    url: url.trim(),
    skillMdUrl: source.skillMdUrl,
    suggestedId: source.suggestedId,
    name: name || source.suggestedId,
    description: description || '从链接导入的技能',
    hasExamples: Boolean(examplesContent)
  }
}

/**
 * 从 GitHub 或 HTTPS 链接拉取 SKILL.md（及可选 examples.md）并安装到 .cursor/skills。
 */
export async function postImportSkillFromUrl(
  url: string,
  targetId?: string
): Promise<ProjectSkillDetail> {
  const source = await resolveSkillImportSourceAsync(url)
  const id = slugifyFromSegment(targetId?.trim() || source.suggestedId)
  validateSkillId(id)

  const destDir = join(getSkillsDir(), id)
  if (existsSync(destDir)) {
    throw new Error(`技能 id「${id}」已存在，请更换目标 id 或先删除旧技能`)
  }

  const rawSkill = await fetchRemoteText(source.skillMdUrl)
  assertValidSkillMarkdown(rawSkill)

  const examplesContent = await fetchOptionalExamples(source.examplesMdUrl)

  try {
    mkdirSync(destDir, { recursive: true })
    writeFileSync(join(destDir, 'SKILL.md'), rawSkill.endsWith('\n') ? rawSkill : `${rawSkill}\n`, 'utf-8')
    if (examplesContent) {
      writeFileSync(
        join(destDir, 'examples.md'),
        examplesContent.endsWith('\n') ? examplesContent : `${examplesContent}\n`,
        'utf-8'
      )
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    throw new Error(`写入技能失败（请确认 .cursor/skills 可写）：${msg}`)
  }

  const detail = queryProjectSkillDetail(id)
  if (!detail) {
    throw new Error('技能导入后读取失败')
  }
  return detail
}
