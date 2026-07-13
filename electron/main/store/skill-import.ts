import { execFile } from 'child_process'
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync
} from 'fs'
import { join } from 'path'
import { promisify } from 'util'
import type { ProjectSkillDetail, SkillImportMethod, SkillImportPreview } from '../../../shared/types'
import { createLlmClient } from '../agent/llm'
import { getSkillImportTempDir } from './paths'
import { querySettings } from './settings'
import {
  getSkillsDir,
  parseSkillMarkdown,
  queryProjectSkillDetail,
  validateSkillId
} from './skills'

const execFileAsync = promisify(execFile)

/** 单次拉取最大体积（512KB），防止异常大文件撑爆内存 */
const MAX_FETCH_BYTES = 512_000

/** 远程请求 / git clone 超时（毫秒） */
const FETCH_TIMEOUT_MS = 30_000
const GIT_CLONE_TIMEOUT_MS = 120_000

/** 大模型返回的技能导入计划 */
interface SkillImportPlan {
  method: SkillImportMethod
  /** git clone 使用的仓库 URL（HTTPS 或 git@） */
  cloneUrl?: string
  /** 可选分支；省略则用仓库默认分支 */
  branch?: string
  /** 仓库内技能目录相对路径（SKILL.md 所在目录，不含文件名） */
  skillDirPath?: string
  /** HTTP 下载时 SKILL.md 完整 URL */
  skillMdUrl?: string
  /** HTTP 下载时可选 examples.md URL */
  examplesMdUrl?: string
  suggestedId: string
  reasoning?: string
}

/** URL 解析结果：raw 地址 + 建议的技能 id（HTTP 直链专用） */
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

/** 生成临时目录名，避免并发导入冲突 */
function createTempImportDir(prefix: string): string {
  const dir = join(getSkillImportTempDir(), `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`)
  mkdirSync(dir, { recursive: true })
  return dir
}

/** 安全删除临时导入目录 */
function cleanupTempDir(dir: string): void {
  try {
    if (existsSync(dir)) {
      rmSync(dir, { recursive: true, force: true })
    }
  } catch {
    // 清理失败不阻断主流程
  }
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
  if (!/^https?:\/\//i.test(url) && !/^git@/i.test(url)) {
    throw new Error('仅支持 http(s) 或 git@ 链接')
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

/** 通过 GitHub API 解析仓库 canonical 名称与默认分支 */
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
        `仓库 ${owner}/${repoName} 不存在或无权访问。请确认链接中的用户名与仓库名拼写正确`
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

/** 用 GET 探测 raw 文件是否存在 */
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

/** 通过 GitHub Contents API 查找 SKILL.md */
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

/** 在 GitHub 仓库默认分支下探测 SKILL.md 位置（HTTP 兜底） */
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

/** 同步解析 + 仓库根链接异步探测（HTTP 下载路径） */
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
 * 规则引擎：从常见 Git 托管链接解析 clone 参数。
 * 用于大模型不可用时的兜底。
 */
function parseGitUrlHeuristic(url: string): SkillImportPlan | null {
  const trimmed = url.trim()

  // git@github.com:owner/repo.git
  const sshMatch = trimmed.match(/^git@([^:]+):(.+?)(?:\.git)?$/i)
  if (sshMatch) {
    const [, host, repoPath] = sshMatch
    return {
      method: 'git_clone',
      cloneUrl: `git@${host}:${repoPath.replace(/\.git$/i, '')}.git`,
      skillDirPath: '',
      suggestedId: slugifyFromSegment(repoPath.split('/').pop() ?? 'imported-skill'),
      reasoning: '识别为 SSH Git 仓库链接'
    }
  }

  // GitHub tree：含分支与目录
  const treeMatch = trimmed.match(
    /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/tree\/([^/]+)\/?(.*)$/i
  )
  if (treeMatch) {
    const [, owner, repo, branch, dirPath] = treeMatch
    const repoName = repo.replace(/\.git$/i, '')
    const normalizedDir = (dirPath || '').replace(/\\/g, '/').replace(/\/+$/, '')
    const skillDir = normalizedDir.replace(/\/SKILL\.md$/i, '')
    return {
      method: 'git_clone',
      cloneUrl: `https://github.com/${owner}/${repoName}.git`,
      branch,
      skillDirPath: skillDir,
      suggestedId: slugifyFromSegment(skillDir.split('/').pop() || repoName),
      reasoning: '识别为 GitHub tree 链接，将 git clone 后定位技能目录'
    }
  }

  // GitHub blob：仍走 clone + 目录推断
  const blobMatch = trimmed.match(
    /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)$/i
  )
  if (blobMatch) {
    const [, owner, repo, branch, filePath] = blobMatch
    const repoName = repo.replace(/\.git$/i, '')
    const normalizedPath = filePath.replace(/\\/g, '/')
    const skillDir = normalizedPath.replace(/\/SKILL\.md$/i, '').replace(/\/[^/]+$/, '')
    return {
      method: 'git_clone',
      cloneUrl: `https://github.com/${owner}/${repoName}.git`,
      branch,
      skillDirPath: skillDir,
      suggestedId: suggestedIdFromSkillPath(normalizedPath),
      reasoning: '识别为 GitHub blob 链接，将 git clone 后定位技能目录'
    }
  }

  // 仓库根或 .git 结尾（GitHub / GitLab / Gitee / Bitbucket）
  const repoRootMatch = trimmed.match(
    /^https:\/\/(?:github|gitlab|gitee|bitbucket)\.(?:com|org)\/([^/]+)\/([^/]+?)(?:\.git)?(?:\/|\?|#|$)/i
  )
  if (repoRootMatch && !/raw\.|raw\.githubusercontent/i.test(trimmed)) {
    const [, owner, repo] = repoRootMatch
    const repoName = repo.replace(/\.git$/i, '')
    const hostMatch = trimmed.match(/^https:\/\/([^/]+)\//i)
    const host = hostMatch?.[1] ?? 'github.com'
    return {
      method: 'git_clone',
      cloneUrl: `https://${host}/${owner}/${repoName}.git`,
      skillDirPath: '',
      suggestedId: slugifyFromSegment(repoName),
      reasoning: '识别为 Git 仓库根链接'
    }
  }

  return null
}

/** 判断链接是否明显为 HTTP 直链（非 Git 仓库页） */
function isObviousHttpDownloadUrl(url: string): boolean {
  const trimmed = url.trim()
  return (
    /^https:\/\/raw\.githubusercontent\.com\//i.test(trimmed) ||
    (/^https?:\/\//i.test(trimmed) && /SKILL\.md(\?|#|$)/i.test(trimmed) && !/github\.com\/[^/]+\/[^/]+\/(tree|blob)\//i.test(trimmed))
  )
}

const SKILL_IMPORT_LLM_SYSTEM = `你是 Cursor Agent 技能导入助手。根据用户提供的链接，判断应使用 git clone 还是 HTTP 下载来获取技能（SKILL.md 及同目录资源）。

规则：
1. Git 仓库链接（GitHub/GitLab/Gitee/Bitbucket 仓库页、tree/blob 路径、.git 结尾、git@ 协议）→ method 必须为 "git_clone"，并给出可执行的 cloneUrl
2. raw 直链、单个文件的 HTTPS 链接、明确指向 SKILL.md 的非 Git 页面 → method 为 "http_download"，给出 skillMdUrl
3. skillDirPath 为仓库内技能目录相对路径（SKILL.md 所在目录，不含 SKILL.md 文件名）；仓库根即 SKILL.md 时填空字符串
4. suggestedId 为小写连字符目录名，1～64 字符

仅返回 JSON 对象，不要 markdown 代码块：
{
  "method": "git_clone" | "http_download",
  "cloneUrl": "git clone 用的 URL（git_clone 时必填）",
  "branch": "可选分支名",
  "skillDirPath": "仓库内技能目录相对路径",
  "skillMdUrl": "HTTP 下载时 SKILL.md 完整 URL",
  "examplesMdUrl": "可选 examples.md URL",
  "suggestedId": "建议技能 id",
  "reasoning": "一句话说明判断理由"
}`

/** 从大模型响应中解析 JSON 计划 */
function parseLlmImportPlanJson(text: string): SkillImportPlan | null {
  const trimmed = text.trim()
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return null

  try {
    const raw = JSON.parse(jsonMatch[0]) as Record<string, unknown>
    const method = raw.method === 'git_clone' || raw.method === 'http_download' ? raw.method : null
    if (!method) return null

    const suggestedId = slugifyFromSegment(String(raw.suggestedId ?? 'imported-skill'))
    const reasoning = typeof raw.reasoning === 'string' ? raw.reasoning : undefined

    if (method === 'git_clone') {
      const cloneUrl = typeof raw.cloneUrl === 'string' ? raw.cloneUrl.trim() : ''
      if (!cloneUrl) return null
      return {
        method,
        cloneUrl,
        branch: typeof raw.branch === 'string' && raw.branch.trim() ? raw.branch.trim() : undefined,
        skillDirPath:
          typeof raw.skillDirPath === 'string' ? raw.skillDirPath.replace(/\\/g, '/').replace(/\/+$/, '') : '',
        suggestedId,
        reasoning
      }
    }

    const skillMdUrl = typeof raw.skillMdUrl === 'string' ? raw.skillMdUrl.trim() : ''
    if (!skillMdUrl) return null
    return {
      method,
      skillMdUrl,
      examplesMdUrl:
        typeof raw.examplesMdUrl === 'string' && raw.examplesMdUrl.trim()
          ? raw.examplesMdUrl.trim()
          : undefined,
      suggestedId,
      reasoning
    }
  } catch {
    return null
  }
}

/**
 * 调用大模型判断技能链接的下载方式。
 * 无 API Key 或调用失败时回退到规则引擎 + HTTP 解析。
 */
async function querySkillImportPlan(url: string): Promise<SkillImportPlan> {
  const trimmed = url.trim()
  if (!trimmed) {
    throw new Error('请输入技能链接')
  }

  // 明显直链优先走 HTTP，避免对 raw 链做无意义 clone
  if (isObviousHttpDownloadUrl(trimmed)) {
    const source = await resolveSkillImportSourceAsync(trimmed)
    return {
      method: 'http_download',
      skillMdUrl: source.skillMdUrl,
      examplesMdUrl: source.examplesMdUrl,
      suggestedId: source.suggestedId,
      reasoning: '识别为 HTTP 直链，将直接下载 SKILL.md'
    }
  }

  const settings = querySettings()
  if (settings.apiKey) {
    try {
      const client = createLlmClient(settings)
      const completion = await client.chat.completions.create({
        model: settings.model,
        messages: [
          { role: 'system', content: SKILL_IMPORT_LLM_SYSTEM },
          { role: 'user', content: `请分析以下技能链接并返回 JSON 导入计划：\n${trimmed}` }
        ],
        response_format: { type: 'json_object' }
      })

      const content = completion.choices[0]?.message?.content ?? ''
      const plan = parseLlmImportPlanJson(content)
      if (plan) {
        if (plan.method === 'http_download' && !plan.skillMdUrl) {
          const source = await resolveSkillImportSourceAsync(trimmed)
          plan.skillMdUrl = source.skillMdUrl
          plan.examplesMdUrl = plan.examplesMdUrl ?? source.examplesMdUrl
        }
        if (plan.method === 'git_clone' && !plan.cloneUrl) {
          throw new Error('大模型未返回有效的 cloneUrl')
        }
        return plan
      }
    } catch (err) {
      // 大模型失败时继续走规则兜底
      const msg = err instanceof Error ? err.message : String(err)
      console.warn('[skill-import] LLM plan failed, fallback to heuristics:', msg)
    }
  }

  const gitPlan = parseGitUrlHeuristic(trimmed)
  if (gitPlan) {
    return gitPlan
  }

  const source = await resolveSkillImportSourceAsync(trimmed)
  return {
    method: 'http_download',
    skillMdUrl: source.skillMdUrl,
    examplesMdUrl: source.examplesMdUrl,
    suggestedId: source.suggestedId,
    reasoning: settings.apiKey
      ? '大模型与规则均未识别为 Git 仓库，使用 HTTP 下载'
      : '未配置 API Key，已用规则识别为 HTTP 下载'
  }
}

/** 浅克隆 Git 仓库到目标目录 */
async function gitCloneRepo(cloneUrl: string, destDir: string, branch?: string): Promise<void> {
  const args = ['clone', '--depth', '1']
  if (branch?.trim()) {
    args.push('--branch', branch.trim(), '--single-branch')
  }
  args.push(cloneUrl, destDir)

  try {
    await execFileAsync('git', args, {
      timeout: GIT_CLONE_TIMEOUT_MS,
      maxBuffer: 4 * 1024 * 1024
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (/not found|command not found|ENOENT/i.test(msg)) {
      throw new Error('未检测到 git 命令，请先安装 Git 并确保在 PATH 中可用')
    }
    throw new Error(`git clone 失败：${msg}`)
  }
}

/** 在克隆目录中递归查找第一个 SKILL.md 所在目录（限制深度） */
function findSkillDirByWalk(repoRoot: string, maxDepth = 5): string | null {
  function walk(dir: string, depth: number): string | null {
    if (depth > maxDepth) return null
    if (existsSync(join(dir, 'SKILL.md'))) {
      return dir
    }
    let entries: string[]
    try {
      entries = readdirSync(dir)
    } catch {
      return null
    }
    for (const name of entries) {
      if (name === '.git' || name === 'node_modules') continue
      const child = join(dir, name)
      try {
        if (!existsSync(child)) continue
        if (!statSync(child).isDirectory()) continue
        const found = walk(child, depth + 1)
        if (found) return found
      } catch {
        continue
      }
    }
    return null
  }
  return walk(repoRoot, 0)
}

/**
 * 在已克隆仓库中定位技能目录。
 * 优先使用大模型/规则给出的 skillDirPath，再尝试常见路径，最后广度优先搜索。
 */
function resolveSkillDirInClone(repoRoot: string, skillDirPath?: string): string {
  const normalizedHint = (skillDirPath ?? '').replace(/\\/g, '/').replace(/\/+$/, '')

  const candidates: string[] = []
  if (normalizedHint) {
    candidates.push(join(repoRoot, normalizedHint))
  }
  candidates.push(
    repoRoot,
    join(repoRoot, '.cursor', 'skills'),
  )

  for (const candidate of candidates) {
    if (existsSync(join(candidate, 'SKILL.md'))) {
      return candidate
    }
  }

  // .cursor/skills/* 下常见布局
  const skillsRoot = join(repoRoot, '.cursor', 'skills')
  if (existsSync(skillsRoot)) {
    for (const entry of readdirSync(skillsRoot, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue
      const dir = join(skillsRoot, entry.name)
      if (existsSync(join(dir, 'SKILL.md'))) {
        return dir
      }
    }
  }

  const walked = findSkillDirByWalk(repoRoot)
  if (walked) {
    return walked
  }

  throw new Error(
    '克隆成功但未找到 SKILL.md。请确认仓库内含技能目录，或使用 tree 链接指向具体技能路径。'
  )
}

/** 从克隆结果安装技能目录到 .cursor/skills/<id> */
function installSkillDirFromClone(sourceDir: string, targetId: string): void {
  validateSkillId(targetId)
  const destDir = join(getSkillsDir(), targetId)
  if (existsSync(destDir)) {
    throw new Error(`技能 id「${targetId}」已存在，请更换目标 id 或先删除旧技能`)
  }

  try {
    cpSync(sourceDir, destDir, { recursive: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    throw new Error(`复制技能目录失败：${msg}`)
  }
}

/** Git clone 导入：克隆 → 定位 SKILL.md 目录 → 复制到技能目录 */
async function importSkillViaGitClone(
  plan: SkillImportPlan,
  targetId?: string
): Promise<ProjectSkillDetail> {
  const cloneUrl = plan.cloneUrl?.trim()
  if (!cloneUrl) {
    throw new Error('Git 导入缺少 cloneUrl')
  }

  const id = slugifyFromSegment(targetId?.trim() || plan.suggestedId)
  validateSkillId(id)

  const tempDir = createTempImportDir('clone')
  try {
    await gitCloneRepo(cloneUrl, tempDir, plan.branch)
    const skillDir = resolveSkillDirInClone(tempDir, plan.skillDirPath)
    const rawSkill = readFileSync(join(skillDir, 'SKILL.md'), 'utf-8')
    assertValidSkillMarkdown(rawSkill)
    installSkillDirFromClone(skillDir, id)
  } finally {
    cleanupTempDir(tempDir)
  }

  const detail = queryProjectSkillDetail(id)
  if (!detail) {
    throw new Error('技能导入后读取失败')
  }
  return detail
}

/** HTTP 下载导入（保留原有 fetch 逻辑） */
async function importSkillViaHttpDownload(
  plan: SkillImportPlan,
  targetId?: string
): Promise<ProjectSkillDetail> {
  const skillMdUrl = plan.skillMdUrl?.trim()
  if (!skillMdUrl) {
    throw new Error('HTTP 导入缺少 skillMdUrl')
  }

  const id = slugifyFromSegment(targetId?.trim() || plan.suggestedId)
  validateSkillId(id)

  const destDir = join(getSkillsDir(), id)
  if (existsSync(destDir)) {
    throw new Error(`技能 id「${id}」已存在，请更换目标 id 或先删除旧技能`)
  }

  const rawSkill = await fetchRemoteText(skillMdUrl)
  assertValidSkillMarkdown(rawSkill)
  const examplesContent = await fetchOptionalExamples(plan.examplesMdUrl)

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

/** 读取本地或远程 SKILL.md 用于预览 */
async function readSkillMarkdownForPreview(plan: SkillImportPlan): Promise<{
  skillMdRef: string
  raw: string
  hasExamples: boolean
}> {
  if (plan.method === 'git_clone') {
    const cloneUrl = plan.cloneUrl?.trim()
    if (!cloneUrl) {
      throw new Error('Git 预览缺少 cloneUrl')
    }
    const tempDir = createTempImportDir('preview')
    try {
      await gitCloneRepo(cloneUrl, tempDir, plan.branch)
      const skillDir = resolveSkillDirInClone(tempDir, plan.skillDirPath)
      const raw = readFileSync(join(skillDir, 'SKILL.md'), 'utf-8')
      assertValidSkillMarkdown(raw)
      const hasExamples = existsSync(join(skillDir, 'examples.md'))
      return {
        skillMdRef: `git:${cloneUrl}${plan.skillDirPath ? `/${plan.skillDirPath}` : ''}/SKILL.md`,
        raw,
        hasExamples
      }
    } finally {
      cleanupTempDir(tempDir)
    }
  }

  const skillMdUrl = plan.skillMdUrl?.trim()
  if (!skillMdUrl) {
    throw new Error('HTTP 预览缺少 skillMdUrl')
  }
  const raw = await fetchRemoteText(skillMdUrl)
  assertValidSkillMarkdown(raw)
  const examplesContent = await fetchOptionalExamples(plan.examplesMdUrl)
  return {
    skillMdRef: skillMdUrl,
    raw,
    hasExamples: Boolean(examplesContent)
  }
}

/**
 * 预览远程技能（不写盘），供 UI 展示建议 id、导入方式与元信息。
 */
export async function querySkillImportPreview(url: string): Promise<SkillImportPreview> {
  const plan = await querySkillImportPlan(url)
  const { skillMdRef, raw, hasExamples } = await readSkillMarkdownForPreview(plan)
  const { name, description } = parseSkillMarkdown(raw)

  return {
    url: url.trim(),
    method: plan.method,
    skillMdUrl: skillMdRef,
    suggestedId: plan.suggestedId,
    name: name || plan.suggestedId,
    description: description || '从链接导入的技能',
    hasExamples,
    reasoning: plan.reasoning
  }
}

/**
 * 从链接导入技能：Git 仓库执行 git clone，其他链接 HTTP 下载。
 * 导入方式由大模型判断（失败时规则兜底）。
 */
export async function postImportSkillFromUrl(
  url: string,
  targetId?: string
): Promise<ProjectSkillDetail> {
  const plan = await querySkillImportPlan(url)
  if (plan.method === 'git_clone') {
    return importSkillViaGitClone(plan, targetId)
  }
  return importSkillViaHttpDownload(plan, targetId)
}
