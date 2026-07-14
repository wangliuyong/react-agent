import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react'
import type { TaskItem, TaskItemStatus } from '@shared/types'
import styles from './TaskChecklist.module.css'

/** 默认距顶部偏移（位于 header 下方） */
const DEFAULT_TOP = 68
/** 默认距右侧边距 */
const DEFAULT_MARGIN = 20
/** 拖至边缘多少 px 内松手即吸附为圆球 */
const EDGE_SNAP_THRESHOLD = 32
/** 吸附圆球直径 */
const ORB_SIZE = 52
/** 圆球贴边内缩，避免贴死裁切 */
const ORB_EDGE_INSET = 10
/** 面板展开时估算宽度（与 CSS 一致） */
const PANEL_WIDTH = 288
/** 指针移动超过该距离视为拖动而非点击 */
const CLICK_MOVE_TOLERANCE = 6

/** localStorage 键：记住位置与吸附态 */
const POSITION_STORAGE_KEY = 'react-agent:task-checklist-position'

type DockEdge = 'left' | 'right' | 'top' | 'bottom'

interface TaskChecklistProps {
  tasks: TaskItem[]
  visible: boolean
  /** Agent 是否正在执行（含工具调用与流式输出） */
  running?: boolean
  /** 等待用户介入时的原因说明；有值时展示「继续」 */
  awaitUserReason?: string | null
  /** 中断后仍有未完成任务，可恢复执行 */
  canResume?: boolean
  /** 中断当前 Agent 执行 */
  onAbort?: () => void
  /** 从 await_user 挂起状态恢复执行 */
  onContinue?: () => void
  /** 中断后从任务清单继续执行 */
  onResume?: () => void
}

interface Position {
  x: number
  y: number
}

interface PersistedLayout {
  position: Position
  docked: DockEdge | null
}

/** 旧版默认左上角位置（用于迁移，避免 localStorage 残留导致仍显示在左侧） */
const LEGACY_DEFAULT_POSITION = { x: 20, y: 68 }

const DOCK_EDGES: DockEdge[] = ['left', 'right', 'top', 'bottom']

function isDockEdge(value: unknown): value is DockEdge {
  return typeof value === 'string' && DOCK_EDGES.includes(value as DockEdge)
}

/** 从 localStorage 读取上次位置与吸附态 */
function loadSavedLayout(): PersistedLayout | null {
  try {
    const raw = localStorage.getItem(POSITION_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Position & { docked?: unknown }
    if (typeof parsed.x !== 'number' || typeof parsed.y !== 'number') return null
    // 若仍是旧版左上角默认值，视为未自定义，改用右上角
    if (
      parsed.x === LEGACY_DEFAULT_POSITION.x &&
      parsed.y === LEGACY_DEFAULT_POSITION.y &&
      !isDockEdge(parsed.docked)
    ) {
      return null
    }
    return {
      position: { x: parsed.x, y: parsed.y },
      docked: isDockEdge(parsed.docked) ? parsed.docked : null
    }
  } catch {
    // 解析失败时使用默认位置
  }
  return null
}

/** 计算右上角默认位置（相对 .page 容器） */
function getDefaultPosition(el: HTMLElement, parentEl: HTMLElement): Position {
  const parentRect = parentEl.getBoundingClientRect()
  const elRect = el.getBoundingClientRect()
  return {
    x: Math.max(0, parentRect.width - elRect.width - DEFAULT_MARGIN),
    y: DEFAULT_TOP
  }
}

/** 将位置限制在父容器可视范围内 */
function clampPosition(
  pos: Position,
  size: { width: number; height: number },
  parentSize: { width: number; height: number }
): Position {
  const maxX = Math.max(0, parentSize.width - size.width)
  const maxY = Math.max(0, parentSize.height - size.height)
  return {
    x: Math.min(Math.max(0, pos.x), maxX),
    y: Math.min(Math.max(0, pos.y), maxY)
  }
}

/** 读取元素与父容器尺寸，用于吸附/夹紧计算 */
function queryLayoutMetrics(
  el: HTMLElement,
  parentEl: HTMLElement
): {
  size: { width: number; height: number }
  parentSize: { width: number; height: number }
} {
  const parentRect = parentEl.getBoundingClientRect()
  const elRect = el.getBoundingClientRect()
  return {
    size: { width: elRect.width, height: elRect.height },
    parentSize: { width: parentRect.width, height: parentRect.height }
  }
}

/**
 * 根据面板当前位置判断是否贴近边缘；返回最近且在阈值内的边。
 */
function querySnapEdge(
  pos: Position,
  size: { width: number; height: number },
  parentSize: { width: number; height: number }
): DockEdge | null {
  const distances: Record<DockEdge, number> = {
    left: pos.x,
    right: parentSize.width - (pos.x + size.width),
    top: pos.y,
    bottom: parentSize.height - (pos.y + size.height)
  }
  let best: DockEdge | null = null
  let bestDist = Infinity
  for (const edge of DOCK_EDGES) {
    const d = distances[edge]
    if (d < bestDist) {
      bestDist = d
      best = edge
    }
  }
  if (best === null || bestDist > EDGE_SNAP_THRESHOLD) return null
  return best
}

/** 吸附后的圆球坐标：贴边并尽量保持原中心投影 */
function getOrbDockPosition(
  edge: DockEdge,
  current: Position,
  size: { width: number; height: number },
  parentSize: { width: number; height: number }
): Position {
  const centerX = current.x + size.width / 2
  const centerY = current.y + size.height / 2
  let next: Position
  switch (edge) {
    case 'left':
      next = { x: ORB_EDGE_INSET, y: centerY - ORB_SIZE / 2 }
      break
    case 'right':
      next = {
        x: parentSize.width - ORB_SIZE - ORB_EDGE_INSET,
        y: centerY - ORB_SIZE / 2
      }
      break
    case 'top':
      next = { x: centerX - ORB_SIZE / 2, y: ORB_EDGE_INSET }
      break
    case 'bottom':
      next = {
        x: centerX - ORB_SIZE / 2,
        y: parentSize.height - ORB_SIZE - ORB_EDGE_INSET
      }
      break
  }
  return clampPosition(next, { width: ORB_SIZE, height: ORB_SIZE }, parentSize)
}

/** 从圆球展开为面板时的落点：沿吸附边内缩一截 */
function getExpandFromOrbPosition(
  edge: DockEdge,
  orbPos: Position,
  parentSize: { width: number; height: number }
): Position {
  const estimatedHeight = 220
  let next: Position
  switch (edge) {
    case 'left':
      next = { x: DEFAULT_MARGIN, y: orbPos.y }
      break
    case 'right':
      next = {
        x: Math.max(0, parentSize.width - PANEL_WIDTH - DEFAULT_MARGIN),
        y: orbPos.y
      }
      break
    case 'top':
      next = { x: Math.max(0, orbPos.x + ORB_SIZE / 2 - PANEL_WIDTH / 2), y: DEFAULT_TOP }
      break
    case 'bottom':
      next = {
        x: Math.max(0, orbPos.x + ORB_SIZE / 2 - PANEL_WIDTH / 2),
        y: Math.max(0, parentSize.height - estimatedHeight - DEFAULT_MARGIN)
      }
      break
  }
  return clampPosition(
    next,
    { width: PANEL_WIDTH, height: estimatedHeight },
    parentSize
  )
}

/** 渲染单个任务的状态图标 */
function TaskStatusIcon({ status }: { status: TaskItemStatus }): React.ReactElement {
  if (status === 'done') {
    return <CheckCircleFilled className={styles.iconDone} />
  }
  if (status === 'failed') {
    return <CloseCircleFilled className={styles.iconFailed} />
  }
  if (status === 'skipped') {
    return <MinusCircleOutlined className={styles.iconSkipped} />
  }
  if (status === 'running') {
    return (
      <>
        <span className={styles.statusRunningRing} aria-hidden />
        <LoadingOutlined className={styles.iconRunning} spin />
      </>
    )
  }
  return <span className={styles.iconPending} aria-hidden />
}

/** 渲染任务标题样式类名 */
function queryTaskTitleClass(status: TaskItemStatus): string {
  return [
    styles.taskTitle,
    status === 'done' && styles.taskTitleDone,
    status === 'running' && styles.taskTitleRunning,
    status === 'failed' && styles.taskTitleFailed,
    status === 'skipped' && styles.taskTitleSkipped
  ]
    .filter(Boolean)
    .join(' ')
}

/** 渲染任务行样式类名 */
function queryTaskRowClass(status: TaskItemStatus): string {
  return [
    styles.taskRow,
    status === 'done' && styles.taskRowDone,
    status === 'skipped' && styles.taskRowSkipped
  ]
    .filter(Boolean)
    .join(' ')
}

/**
 * 浮动任务清单：默认右上角，可拖动。
 * 拖到窗口边缘松手 → 吸附成小圆球；点击圆球 → 展开面板。
 * 标题栏支持列表折叠（默认展开）；默认半透明，悬停不透明。
 */
const { Text } = Typography

export function TaskChecklist({
  tasks,
  visible,
  running = false,
  awaitUserReason = null,
  canResume = false,
  onAbort,
  onContinue,
  onResume
}: TaskChecklistProps): React.ReactElement | null {
  const rootRef = useRef<HTMLDivElement>(null)
  const saved = useMemo(() => loadSavedLayout(), [])
  const [position, setPosition] = useState<Position>(
    () => saved?.position ?? { x: 0, y: DEFAULT_TOP }
  )
  const [dragging, setDragging] = useState(false)
  /** 任务列表内容展开（折叠箭头），默认展开 */
  const [contentExpanded, setContentExpanded] = useState(true)
  /** 边缘吸附为圆球；非 null 时只渲染圆球 */
  const [docked, setDocked] = useState<DockEdge | null>(() => saved?.docked ?? null)
  /** 吸附/展开形态切换时的过渡动画标记 */
  const [morphPhase, setMorphPhase] = useState<'idle' | 'to-orb' | 'to-panel'>('idle')
  /** 指针按下时相对控件左上角的偏移 */
  const dragOffsetRef = useRef<Position>({ x: 0, y: 0 })
  /** 本次按下起点，用于区分点击与拖动 */
  const pointerStartRef = useRef<Position>({ x: 0, y: 0 })
  const movedDuringDragRef = useRef(false)

  /** 切换列表折叠；阻止冒泡以免触发拖动 */
  const handleToggleContent = useCallback(
    (event: { stopPropagation: () => void; preventDefault: () => void }) => {
      event.stopPropagation()
      event.preventDefault()
      setContentExpanded((prev) => !prev)
    },
    []
  )

  /** 任务进度统计 */
  const progress = useMemo(() => {
    const total = tasks.length
    const done = tasks.filter((t) => t.status === 'done').length
    const percent = total > 0 ? Math.round((done / total) * 100) : 0
    return { total, done, percent }
  }, [tasks])

  const hasRunningTask = tasks.some((t) => t.status === 'running')

  /** 将当前 root 位置夹紧到父容器内 */
  const clampRootToParent = useCallback((pos: Position): Position => {
    const el = rootRef.current
    const parentEl = el?.offsetParent as HTMLElement | null
    if (!el || !parentEl) return pos
    const { size, parentSize } = queryLayoutMetrics(el, parentEl)
    return clampPosition(pos, size, parentSize)
  }, [])

  /** 窗口尺寸变化时校正位置 */
  useEffect(() => {
    const handleResize = (): void => {
      setPosition((prev) => clampRootToParent(prev))
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [clampRootToParent])

  /** 无存档时，首次可见对齐右上角（仅初始化一次，避免折叠时被重置） */
  useEffect(() => {
    if (!visible || docked) return
    if (loadSavedLayout()) return
    const el = rootRef.current
    const parentEl = el?.offsetParent as HTMLElement | null
    if (!el || !parentEl) return
    setPosition(clampRootToParent(getDefaultPosition(el, parentEl)))
    // 仅在变为可见时做默认定位，避免折叠反复重置坐标
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible])

  /** 折叠 / 吸附切换后高度变化，重新夹紧到父容器内 */
  useEffect(() => {
    setPosition((prev) => clampRootToParent(prev))
  }, [docked, contentExpanded, clampRootToParent])

  /** 拖动结束或吸附变化后持久化 */
  useEffect(() => {
    if (dragging) return
    localStorage.setItem(
      POSITION_STORAGE_KEY,
      JSON.stringify({ ...position, docked })
    )
  }, [dragging, position, docked])

  /** 吸附/展开动画结束后清除 morphPhase */
  useEffect(() => {
    if (morphPhase === 'idle') return
    const timer = window.setTimeout(() => setMorphPhase('idle'), 420)
    return () => window.clearTimeout(timer)
  }, [morphPhase])

  /** 指针按下：开始拖动（面板标题栏或圆球） */
  const handleDragStart = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    const el = rootRef.current
    const parentEl = el?.offsetParent as HTMLElement | null
    if (!el || !parentEl) return

    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)

    const elRect = el.getBoundingClientRect()
    dragOffsetRef.current = {
      x: event.clientX - elRect.left,
      y: event.clientY - elRect.top
    }
    pointerStartRef.current = { x: event.clientX, y: event.clientY }
    movedDuringDragRef.current = false
    setDragging(true)
  }, [])

  /** 拖动中更新坐标 */
  const handleDragMove = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (!dragging) return

      const el = rootRef.current
      const parentEl = el?.offsetParent as HTMLElement | null
      if (!el || !parentEl) return

      const dx = event.clientX - pointerStartRef.current.x
      const dy = event.clientY - pointerStartRef.current.y
      if (Math.hypot(dx, dy) > CLICK_MOVE_TOLERANCE) {
        movedDuringDragRef.current = true
      }

      const parentRect = parentEl.getBoundingClientRect()
      const { size, parentSize } = queryLayoutMetrics(el, parentEl)
      const nextPos: Position = {
        x: event.clientX - parentRect.left - dragOffsetRef.current.x,
        y: event.clientY - parentRect.top - dragOffsetRef.current.y
      }
      setPosition(clampPosition(nextPos, size, parentSize))
    },
    [dragging]
  )

  /** 松开：若贴边则吸附为圆球；圆球上若几乎未移动则视为点击展开 */
  const handleDragEnd = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (!dragging) return
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId)
      }
      setDragging(false)

      const el = rootRef.current
      const parentEl = el?.offsetParent as HTMLElement | null
      if (!el || !parentEl) return

      const { size, parentSize } = queryLayoutMetrics(el, parentEl)

      // 圆球模式：短按无位移 → 展开面板
      if (docked && !movedDuringDragRef.current) {
        const expandPos = getExpandFromOrbPosition(docked, position, parentSize)
        setMorphPhase('to-panel')
        setDocked(null)
        setContentExpanded(true)
        setPosition(expandPos)
        return
      }

      // 面板或圆球拖到边缘 → 吸附
      const edge = querySnapEdge(position, size, parentSize)
      if (edge) {
        const orbPos = getOrbDockPosition(edge, position, size, parentSize)
        setMorphPhase('to-orb')
        setDocked(edge)
        setPosition(orbPos)
        return
      }

      // 圆球被拖离边缘且未贴边 → 保持圆球但落在松手处；此处取消吸附、展开为面板更符合「拖出边缘」
      if (docked) {
        setMorphPhase('to-panel')
        setDocked(null)
        setContentExpanded(true)
        setPosition(clampPosition(position, { width: PANEL_WIDTH, height: 200 }, parentSize))
      }
    },
    [dragging, docked, position]
  )

  /** 圆球显式点击展开（键盘/辅助；指针路径已在 dragEnd 处理） */
  const handleOrbActivate = useCallback(() => {
    if (!docked || movedDuringDragRef.current) return
    const el = rootRef.current
    const parentEl = el?.offsetParent as HTMLElement | null
    if (!parentEl) return
    const parentSize = {
      width: parentEl.getBoundingClientRect().width,
      height: parentEl.getBoundingClientRect().height
    }
    setMorphPhase('to-panel')
    setPosition(getExpandFromOrbPosition(docked, position, parentSize))
    setDocked(null)
    setContentExpanded(true)
  }, [docked, position])

  const showActionBar =
    Boolean(awaitUserReason) ||
    (running && Boolean(onAbort)) ||
    (canResume && Boolean(onResume))

  if (!visible || tasks.length === 0) return null

  const rootClass = [
    styles.root,
    dragging ? styles.rootDragging : '',
    morphPhase === 'to-orb' ? styles.rootMorphToOrb : '',
    morphPhase === 'to-panel' ? styles.rootMorphToPanel : ''
  ]
    .filter(Boolean)
    .join(' ')

  /* ── 边缘吸附圆球 ── */
  if (docked) {
    const ringStyle = {
      '--orb-progress': `${progress.percent}`
    } as CSSProperties

    return (
      <div
        ref={rootRef}
        className={rootClass}
        style={{ left: position.x, top: position.y }}
      >
        <button
          type="button"
          className={[
            styles.orb,
            styles[`orbEdge_${docked}`],
            hasRunningTask || running ? styles.orbRunning : '',
            progress.done === progress.total && progress.total > 0 ? styles.orbDone : ''
          ]
            .filter(Boolean)
            .join(' ')}
          style={ringStyle}
          aria-label={`展开任务清单 ${progress.done}/${progress.total}`}
          title="点击展开任务清单"
          onPointerDown={handleDragStart}
          onPointerMove={handleDragMove}
          onPointerUp={handleDragEnd}
          onPointerCancel={handleDragEnd}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              movedDuringDragRef.current = false
              handleOrbActivate()
            }
          }}
        >
          <span className={styles.orbRing} aria-hidden />
          <span className={styles.orbCore}>
            {hasRunningTask || running ? (
              <LoadingOutlined className={styles.orbSpinner} spin />
            ) : (
              <span className={styles.orbCount}>
                {progress.done}/{progress.total}
              </span>
            )}
          </span>
          <span className={styles.orbHint} aria-hidden>
            <UnorderedListOutlined />
          </span>
        </button>
      </div>
    )
  }

  /* ── 完整任务清单面板 ── */
  return (
    <div
      ref={rootRef}
      className={rootClass}
      style={{ left: position.x, top: position.y }}
    >
      <Card
        size="small"
        title={
          <div
            className={`${styles.dragHandle} ${dragging ? styles.dragging : ''}`}
            onPointerDown={handleDragStart}
            onPointerMove={handleDragMove}
            onPointerUp={handleDragEnd}
            onPointerCancel={handleDragEnd}
          >
            <HolderOutlined className={styles.dragIcon} aria-hidden />
            <div className={styles.headerMain}>
              <div className={styles.headerRow}>
                <span className={styles.headerTitle}>任务清单</span>
                <div className={styles.headerActions}>
                  <span
                    className={`${styles.headerMeta} ${progress.done === progress.total ? styles.headerMetaDone : ''}`}
                  >
                    {progress.done}/{progress.total}
                  </span>
                  <button
                    type="button"
                    className={styles.collapseBtn}
                    aria-label={contentExpanded ? '折叠任务清单' : '展开任务清单'}
                    aria-expanded={contentExpanded}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={handleToggleContent}
                  >
                    {contentExpanded ? (
                      <UpOutlined className={styles.collapseIcon} />
                    ) : (
                      <DownOutlined className={styles.collapseIcon} />
                    )}
                  </button>
                </div>
              </div>
              <div className={styles.progressTrack} aria-hidden>
                <div
                  className={styles.progressFill}
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
            </div>
          </div>
        }
        className={[
          styles.card,
          contentExpanded ? '' : styles.cardCollapsed,
          dragging ? styles.cardOpaque : ''
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {contentExpanded ? (
          <>
            <ul className={styles.taskList}>
              {tasks.map((item, index) => (
                <li
                  key={item.id}
                  className={[
                    queryTaskRowClass(item.status),
                    item.parentId ? styles.taskRowChild : ''
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  style={{ '--task-index': index } as CSSProperties}
                >
                  <span className={styles.statusIcon}>
                    <TaskStatusIcon status={item.status} />
                  </span>
                  <div className={styles.taskContent}>
                    <span className={queryTaskTitleClass(item.status)}>{item.title}</span>
                    {item.status === 'running' ? (
                      <span className={`${styles.taskBadge} ${styles.badgeRunning}`}>执行中</span>
                    ) : null}
                    {item.status === 'failed' ? (
                      <span className={`${styles.taskBadge} ${styles.badgeFailed}`}>失败</span>
                    ) : null}
                    {item.status === 'skipped' ? (
                      <span className={`${styles.taskBadge} ${styles.badgeSkipped}`}>已跳过</span>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>

            {showActionBar ? (
              <div
                className={styles.actionBar}
                onPointerDown={(e) => e.stopPropagation()}
              >
                {awaitUserReason ? (
                  <>
                    <Text className={styles.awaitReason} ellipsis={{ tooltip: awaitUserReason }}>
                      {awaitUserReason}
                    </Text>
                    <Button
                      type="primary"
                      size="small"
                      icon={<PlayCircleOutlined />}
                      className={styles.actionBtn}
                      onClick={onContinue}
                    >
                      继续
                    </Button>
                  </>
                ) : canResume ? (
                  <>
                    <Text type="secondary" className={styles.runningHint}>
                      任务已中断，可继续执行
                    </Text>
                    <Button
                      type="primary"
                      size="small"
                      icon={<PlayCircleOutlined />}
                      className={styles.actionBtn}
                      onClick={onResume}
                    >
                      继续
                    </Button>
                  </>
                ) : (
                  <>
                    <Text type="secondary" className={styles.runningHint}>
                      {hasRunningTask ? '任务执行中…' : 'Agent 处理中…'}
                    </Text>
                    <Button
                      danger
                      size="small"
                      icon={<PauseCircleOutlined />}
                      className={styles.actionBtn}
                      onClick={onAbort}
                    >
                      中断
                    </Button>
                  </>
                )}
              </div>
            ) : null}
          </>
        ) : null}
      </Card>
    </div>
  )
}
