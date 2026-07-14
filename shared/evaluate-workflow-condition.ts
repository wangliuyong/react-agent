/**
 * 工作流条件求值（纯函数，主进程引擎与编译侧自检共用）。
 *
 * 短表达式白名单：仅允许 `context.标识符`、字面量、`== != > >= < <= && || !`、括号。
 * 禁止函数调用、赋值、属性链下标——避免任意代码执行。
 */
import type { WorkflowConditionNode, WorkflowConditionWhen } from './types'

type EvalOk = { value: unknown }
type EvalErr = { error: string }
type EvalResult = EvalOk | EvalErr

type Token =
  | { kind: 'num'; value: number }
  | { kind: 'str'; value: string }
  | { kind: 'bool'; value: boolean }
  | { kind: 'ident'; value: string }
  | { kind: 'dot' }
  | { kind: 'op'; value: string }
  | { kind: 'lp' }
  | { kind: 'rp' }

function tokenize(src: string): Token[] | EvalErr {
  const tokens: Token[] = []
  let i = 0
  while (i < src.length) {
    const ch = src[i]
    if (/\s/.test(ch)) {
      i += 1
      continue
    }
    if (ch === '(') {
      tokens.push({ kind: 'lp' })
      i += 1
      continue
    }
    if (ch === ')') {
      tokens.push({ kind: 'rp' })
      i += 1
      continue
    }
    if (ch === '.') {
      tokens.push({ kind: 'dot' })
      i += 1
      continue
    }
    if (ch === '"' || ch === "'") {
      const quote = ch
      let j = i + 1
      let out = ''
      while (j < src.length && src[j] !== quote) {
        if (src[j] === '\\' && j + 1 < src.length) {
          out += src[j + 1]
          j += 2
          continue
        }
        out += src[j]
        j += 1
      }
      if (j >= src.length) return { error: '表达式字符串未闭合' }
      tokens.push({ kind: 'str', value: out })
      i = j + 1
      continue
    }
    if (/[0-9]/.test(ch) || (ch === '-' && /[0-9]/.test(src[i + 1] ?? ''))) {
      let j = i + (ch === '-' ? 1 : 0)
      while (j < src.length && /[0-9.]/.test(src[j])) j += 1
      const num = Number(src.slice(i, j))
      if (Number.isNaN(num)) return { error: `非法数字: ${src.slice(i, j)}` }
      tokens.push({ kind: 'num', value: num })
      i = j
      continue
    }
    if (/[a-zA-Z_]/.test(ch)) {
      let j = i + 1
      while (j < src.length && /[a-zA-Z0-9_]/.test(src[j])) j += 1
      const word = src.slice(i, j)
      if (word === 'true') tokens.push({ kind: 'bool', value: true })
      else if (word === 'false') tokens.push({ kind: 'bool', value: false })
      else tokens.push({ kind: 'ident', value: word })
      i = j
      continue
    }
    const two = src.slice(i, i + 2)
    if (['==', '!=', '>=', '<=', '&&', '||'].includes(two)) {
      tokens.push({ kind: 'op', value: two })
      i += 2
      continue
    }
    if (['>', '<', '!'].includes(ch)) {
      tokens.push({ kind: 'op', value: ch })
      i += 1
      continue
    }
    return { error: `表达式含非法字符: ${ch}` }
  }
  return tokens
}

class Parser {
  private pos = 0
  constructor(
    private tokens: Token[],
    private context: Record<string, unknown>
  ) {}

  private peek(): Token | undefined {
    return this.tokens[this.pos]
  }

  private take(): Token | undefined {
    return this.tokens[this.pos++]
  }

  parse(): EvalResult {
    try {
      const v = this.parseOr()
      if (this.pos < this.tokens.length) return { error: '表达式存在多余内容' }
      return { value: v }
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) }
    }
  }

  private parseOr(): unknown {
    let left = this.parseAnd()
    while (this.peek()?.kind === 'op' && (this.peek() as { value: string }).value === '||') {
      this.take()
      const right = this.parseAnd()
      left = Boolean(left) || Boolean(right)
    }
    return left
  }

  private parseAnd(): unknown {
    let left = this.parseCompare()
    while (this.peek()?.kind === 'op' && (this.peek() as { value: string }).value === '&&') {
      this.take()
      const right = this.parseCompare()
      left = Boolean(left) && Boolean(right)
    }
    return left
  }

  private parseCompare(): unknown {
    let left = this.parseUnary()
    const opTok = this.peek()
    if (opTok?.kind === 'op' && ['==', '!=', '>', '>=', '<', '<='].includes(opTok.value)) {
      this.take()
      const right = this.parseUnary()
      return queryCompare(left, opTok.value, right)
    }
    return left
  }

  private parseUnary(): unknown {
    if (this.peek()?.kind === 'op' && (this.peek() as { value: string }).value === '!') {
      this.take()
      return !this.parseUnary()
    }
    return this.parsePrimary()
  }

  private parsePrimary(): unknown {
    const t = this.take()
    if (!t) throw new Error('表达式不完整')
    if (t.kind === 'num' || t.kind === 'str' || t.kind === 'bool') return t.value
    if (t.kind === 'lp') {
      const inner = this.parseOr()
      if (this.take()?.kind !== 'rp') throw new Error('缺少右括号')
      return inner
    }
    if (t.kind === 'ident') {
      if (t.value !== 'context') {
        throw new Error(`仅允许 context.字段，得到: ${t.value}`)
      }
      if (this.take()?.kind !== 'dot') throw new Error('context 后须接 .字段名')
      const field = this.take()
      if (field?.kind !== 'ident') throw new Error('context. 后须为标识符')
      // 禁止再钻多层属性，避免任意对象探测
      if (this.peek()?.kind === 'dot') {
        throw new Error('不允许 context.a.b 多层属性访问')
      }
      return this.context[field.value]
    }
    throw new Error('非法表达式主项')
  }
}

function queryCompare(left: unknown, op: string, right: unknown): boolean {
  if (op === '==') return queryLooseEqual(left, right)
  if (op === '!=') return !queryLooseEqual(left, right)
  const ln = Number(left)
  const rn = Number(right)
  if (Number.isNaN(ln) || Number.isNaN(rn)) return false
  if (op === '>') return ln > rn
  if (op === '>=') return ln >= rn
  if (op === '<') return ln < rn
  if (op === '<=') return ln <= rn
  return false
}

/** 数字优先，否则比字符串——与表单 eq/neq 一致 */
function queryLooseEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true
  const na = Number(a)
  const nb = Number(b)
  if (
    typeof a !== 'boolean' &&
    typeof b !== 'boolean' &&
    a !== '' &&
    b !== '' &&
    !Number.isNaN(na) &&
    !Number.isNaN(nb)
  ) {
    return na === nb
  }
  return String(a) === String(b)
}

function queryEvaluateExpression(
  expression: string,
  context: Record<string, unknown>
): EvalResult {
  const tokens = tokenize(expression.trim())
  if ('error' in tokens) return tokens
  if (!tokens.length) return { error: '表达式为空' }
  return new Parser(tokens, context).parse()
}

function queryFormWhen(
  when: WorkflowConditionWhen,
  context: Record<string, unknown>
): EvalResult {
  const key = (when.contextKey ?? '').trim()
  if (!key) return { error: '请填写 context 字段名' }
  const raw = context[key]
  const op = when.op ?? 'truthy'
  if (op === 'truthy') return { value: Boolean(raw) }
  if (op === 'falsy') return { value: !raw }
  if (op === 'eq') return { value: queryLooseEqual(raw, when.value) }
  if (op === 'neq') return { value: !queryLooseEqual(raw, when.value) }
  return { error: `未知运算符: ${op}` }
}

/** 求值 when：expression 优先，否则表单 */
export function queryEvaluateWhen(
  when: WorkflowConditionWhen | undefined,
  context: Record<string, unknown>
): EvalResult {
  if (!when) return { error: '未配置条件' }
  const expr = when.expression?.trim()
  if (expr) return queryEvaluateExpression(expr, context)
  return queryFormWhen(when, context)
}

function queryPickDefault(
  node: WorkflowConditionNode
): { key: string } | { error: string } {
  if (node.defaultKey && node.cases.some((c) => c.key === node.defaultKey)) {
    return { key: node.defaultKey }
  }
  return { error: '条件无匹配分支且未配置默认支路' }
}

/**
 * 选出要执行的 case.key。
 * agent 模式传入模型解析出的 key；expression 模式从 context 求值。
 */
export function queryConditionCaseKey(
  node: WorkflowConditionNode,
  context: Record<string, unknown>,
  agentSelectedKey?: string
): { key: string } | { error: string } {
  if (!node.cases.length) return { error: '条件节点没有任何分支' }

  if (node.mode === 'agent') {
    const raw = (agentSelectedKey ?? '').trim()
    if (node.cases.some((c) => c.key === raw)) return { key: raw }
    return queryPickDefault(node)
  }

  const evaluated = queryEvaluateWhen(node.when, context)
  if ('error' in evaluated) return evaluated

  const v = evaluated.value
  const keys = new Set(node.cases.map((c) => c.key))

  // If/Else：布尔映射 true/false
  if (typeof v === 'boolean' && keys.has(String(v))) {
    return { key: String(v) }
  }

  if (typeof v === 'string' || typeof v === 'number') {
    const asKey = String(v)
    if (keys.has(asKey)) return { key: asKey }
  }

  // 其它真假值若存在 true/false case，再映射一次
  if (keys.has('true') && keys.has('false')) {
    return { key: v ? 'true' : 'false' }
  }

  return queryPickDefault(node)
}
