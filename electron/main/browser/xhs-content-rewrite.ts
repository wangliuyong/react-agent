import { rand } from './human-behavior'

/**
 * 小红书发布前本地文案防检测改写（不访问小红书，纯离线）。
 * 同义词替换 + 标题装饰 + 正文口语化，降低 AI 文本特征。
 */

/** 赛道可扩展：命中 key 时随机替换为 values 之一 */
const SYNONYM_MAP: Record<string, string[]> = {
  收纳: ['归置', '储物', '整理'],
  实用: ['亲测好用', '省心', '真的香'],
  整洁: ['清爽', '干净利落', '看着舒服'],
  推荐: ['安利', '真心建议', '可以试试'],
  分享: ['唠一唠', '记录一下', '来说说'],
  方法: ['路子', '做法', '小技巧'],
  效果: ['感受', '变化', '体验'],
  必备: ['值得入', '少不了', '真需要'],
  简单: ['不费事', '好上手', '不难'],
  好看: ['上镜', '颜值在线', '挺出片']
}

const TITLE_DECOR = ['✨', '干货', '实测', '分享'] as const

const ORAL_PREFIX = ['其实', '个人觉得', '亲测', '顺带一提', '悄悄说'] as const

const SOFT_SUFFIX = ['啦', '喔', '哒', 'hhh', '哟'] as const

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/** 全文同义词随机替换（每处命中独立抽签） */
export function queryRewriteXhsSynonyms(text: string): string {
  let out = text
  for (const [key, values] of Object.entries(SYNONYM_MAP)) {
    if (!out.includes(key)) continue
    const replacement = pick(values)
    out = out.split(key).join(replacement)
  }
  return out
}

/** 40% 概率在标题头或尾加装饰标签 */
export function queryRewriteXhsTitle(title: string): string {
  const base = queryRewriteXhsSynonyms(title.trim())
  if (Math.random() >= 0.4) return base
  const tag = pick(TITLE_DECOR)
  return Math.random() < 0.5 ? `${tag}${base}` : `${base}${tag}`
}

/**
 * 正文口语化：按标点拆句，句首/句尾随机加口语词。
 */
export function queryRewriteXhsBody(content: string): string {
  const afterSynonym = queryRewriteXhsSynonyms(content)
  const parts = afterSynonym.split(/([，,。！？\n])/g)
  const rebuilt: string[] = []

  for (let i = 0; i < parts.length; i++) {
    const chunk = parts[i]
    if (!chunk) continue
    if (/^[，,。！？\n]$/.test(chunk)) {
      rebuilt.push(chunk)
      continue
    }
    let sentence = chunk.trim()
    if (!sentence) continue

    if (sentence.length > 4 && Math.random() < 0.6) {
      sentence = `${pick(ORAL_PREFIX)}，${sentence}`
    }
    if (sentence.length > 4 && Math.random() < 0.5) {
      sentence = `${sentence}${pick(SOFT_SUFFIX)}`
    }
    rebuilt.push(sentence)
  }

  return rebuilt.join('').replace(/\n{3,}/g, '\n\n')
}

export interface XhsContentRewriteResult {
  title: string
  content: string
  rewritten: boolean
}

/** 发布链路统一入口：标题与正文均做离线改写 */
export function queryRewriteXhsPublishCopy(title: string, content: string): XhsContentRewriteResult {
  const nextTitle = queryRewriteXhsTitle(title)
  const nextContent = queryRewriteXhsBody(content)
  const rewritten = nextTitle !== title || nextContent !== content
  return { title: nextTitle, content: nextContent, rewritten }
}

/** 供单测固定随机：字符输入间隔毫秒（约 0.06～0.08s ±0.03） */
export function queryHumanTypeDelayMs(): number {
  const base = rand(60, 80)
  const jitter = rand(-30, 30)
  return Math.max(35, Math.round(base + jitter))
}
