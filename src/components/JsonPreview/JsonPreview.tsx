import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { CaretDownOutlined, CaretRightOutlined } from '@ant-design/icons'
import styles from './JsonPreview.module.css'

export interface JsonPreviewProps {
  /** JSON 字符串；解析失败时回退为纯文本展示 */
  value: string
}

/** 尝试将字符串解析为 JSON；失败返回 null */
function queryParsedJson(value: string): unknown | null {
  const trimmed = value?.trim()
  if (!trimmed) return null
  try {
    return JSON.parse(trimmed) as unknown
  } catch {
    return null
  }
}

/** 判断节点是否可折叠（对象或数组） */
function queryCollapsible(value: unknown): value is Record<string, unknown> | unknown[] {
  return value !== null && typeof value === 'object'
}

/** 对象/数组子项数量，用于折叠时展示摘要 */
function queryChildCount(value: Record<string, unknown> | unknown[]): number {
  return Array.isArray(value) ? value.length : Object.keys(value).length
}

/** 折叠态一行摘要，如 `{3}`、`[2]` */
function queryCollapsedPreview(value: Record<string, unknown> | unknown[]): string {
  const count = queryChildCount(value)
  return Array.isArray(value) ? `[${count}]` : `{${count}}`
}

/** 收集对象/数组树下所有可折叠路径，用于「全部折叠」 */
function queryAllCollapsiblePaths(value: unknown, currentPath: string): string[] {
  if (!queryCollapsible(value)) return []
  const paths = [currentPath]
  const entries = Array.isArray(value)
    ? value.map((item, index) => [String(index), item] as const)
    : Object.entries(value)
  for (const [key, child] of entries) {
    paths.push(...queryAllCollapsiblePaths(child, `${currentPath}.${key}`))
  }
  return paths
}

interface JsonTreeNodeProps {
  /** 字段名或数组下标；根节点无 name */
  name?: string | number
  value: unknown
  /** 用于折叠状态的唯一路径 */
  path: string
  depth: number
  collapsedPaths: ReadonlySet<string>
  onToggle: (path: string) => void
}

/**
 * 递归渲染 JSON 树节点：对象/数组可折叠，原始值语法高亮
 */
function JsonTreeNode({
  name,
  value,
  path,
  depth,
  collapsedPaths,
  onToggle
}: JsonTreeNodeProps): ReactNode {
  const collapsible = queryCollapsible(value)
  const collapsed = collapsible && collapsedPaths.has(path)
  const indentStyle = { paddingLeft: depth * 14 }

  /** 原始值：字符串、数字、布尔、null */
  if (!collapsible) {
    const primitiveClass =
      typeof value === 'string'
        ? styles.primitiveString
        : typeof value === 'number'
          ? styles.primitiveNumber
          : typeof value === 'boolean'
            ? styles.primitiveBoolean
            : styles.primitiveNull

    const display =
      typeof value === 'string'
        ? `"${value}"`
        : value === null
          ? 'null'
          : String(value)

    return (
      <div className={styles.line} style={indentStyle}>
        {depth > 0 ? <span className={styles.toggleSpacer} aria-hidden /> : null}
        {name !== undefined ? (
          <>
            <span className={styles.key}>{typeof name === 'number' ? name : `"${name}"`}</span>
            <span className={styles.colon}>: </span>
          </>
        ) : null}
        <span className={primitiveClass}>{display}</span>
      </div>
    )
  }

  const isArray = Array.isArray(value)
  const openBracket = isArray ? '[' : '{'
  const closeBracket = isArray ? ']' : '}'
  const entries: Array<[string | number, unknown]> = isArray
    ? value.map((item, index) => [index, item] as [number, unknown])
    : Object.entries(value)

  return (
    <div className={styles.node}>
      <div className={styles.line} style={indentStyle}>
        <button
          type="button"
          className={styles.toggle}
          onClick={() => onToggle(path)}
          aria-expanded={!collapsed}
          aria-label={collapsed ? '展开' : '折叠'}
        >
          {collapsed ? <CaretRightOutlined /> : <CaretDownOutlined />}
        </button>
        {name !== undefined ? (
          <>
            <span className={styles.key}>{typeof name === 'number' ? name : `"${name}"`}</span>
            <span className={styles.colon}>: </span>
          </>
        ) : null}
        <span className={styles.bracket}>{openBracket}</span>
        {collapsed ? (
          <>
            <span className={styles.ellipsis}>{queryCollapsedPreview(value)}</span>
            <span className={styles.bracket}>{closeBracket}</span>
          </>
        ) : null}
      </div>

      {!collapsed ? (
        <>
          {entries.map(([childName, childValue]) => (
            <JsonTreeNode
              key={`${path}.${String(childName)}`}
              name={childName}
              value={childValue}
              path={`${path}.${String(childName)}`}
              depth={depth + 1}
              collapsedPaths={collapsedPaths}
              onToggle={onToggle}
            />
          ))}
          <div className={styles.line} style={indentStyle}>
            <span className={styles.toggleSpacer} aria-hidden />
            <span className={styles.bracket}>{closeBracket}</span>
          </div>
        </>
      ) : null}
    </div>
  )
}

/**
 * 可折叠 JSON 预览：解析成功展示树形结构，失败则原样输出文本
 */
export function JsonPreview({ value }: JsonPreviewProps): React.ReactElement {
  const parsed = useMemo(() => queryParsedJson(value), [value])
  const rootPath = 'root'

  /** 记录已折叠节点路径；默认空集表示全部展开 */
  const [collapsedPaths, setCollapsedPaths] = useState<Set<string>>(() => new Set())

  const onToggle = useCallback((path: string) => {
    setCollapsedPaths((prev) => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }, [])

  const onExpandAll = useCallback(() => {
    setCollapsedPaths(new Set())
  }, [])

  const onCollapseAll = useCallback(() => {
    if (!parsed || !queryCollapsible(parsed)) return
    setCollapsedPaths(new Set(queryAllCollapsiblePaths(parsed, rootPath)))
  }, [parsed])

  if (parsed === null) {
    return <pre className={styles.fallback}>{value?.trim() ? value : '{}'}</pre>
  }

  const rootCollapsible = queryCollapsible(parsed)

  return (
    <div className={styles.root}>
      {rootCollapsible ? (
        <div className={styles.toolbar}>
          <button type="button" className={styles.toolbarBtn} onClick={onExpandAll}>
            全部展开
          </button>
          <button type="button" className={styles.toolbarBtn} onClick={onCollapseAll}>
            全部折叠
          </button>
        </div>
      ) : null}
      <div className={styles.tree}>
        <JsonTreeNode
          value={parsed}
          path={rootPath}
          depth={0}
          collapsedPaths={collapsedPaths}
          onToggle={onToggle}
        />
      </div>
    </div>
  )
}
