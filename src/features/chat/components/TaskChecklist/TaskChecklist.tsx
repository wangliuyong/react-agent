import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react'
import type { TaskItem } from '@shared/types'
import {
  queryChecklistTaskStatus,
  type ChecklistTaskStatus
} from './task-status'
import styles from './TaskChecklist.module.css'

/** 默认距顶部偏移（位于 header 下方） */
const DEFAULT_TOP = 68
/** 默认距右侧边距 */
const DEFAULT_MARGIN = 20
/** 面板宽度（与 CSS .card 一致） */
const PANEL_WIDTH = 288
/** 吸附圆球直径（与 CSS .orb 一致） */
const ORB_SIZE = 52
/** 指针移动超过该距离视为拖动而非点击 */
const CLICK_MOVE_TOLERANCE = 6

/** localStorage 键：记住垂直位置 */
const POSITION_STORAGE_KEY = 'react-agent:task-checklist-position'

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

/** 从 localStorage 读取上次垂直位置（兼容旧版 { x, y, docked } 格式） */
function loadSavedY(): number | null {
  try {
    const raw = localStorage.getItem(POSITION_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { y?: unknown }
    if (typeof parsed.y === 'number') return parsed.y
  } catch {
    // 解析失败时使用默认位置
  }
  return null
}

/** 计算右侧固定时的 left 坐标 */
function queryRightX(parentWidth: number, elementWidth: number): number {
  return Math.max(0, parentWidth - elementWidth - DEFAULT_MARGIN)
}

/** 计算右侧固定时的 left 坐标（相对 .page 容器，读取 DOM 尺寸） */
function queryRightAlignedX(
  el: HTMLElement,
  parentEl: HTMLElement
): number {
  const parentRect = parentEl.getBoundingClientRect()
  const elRect = el.getBoundingClientRect()
  return queryRightX(parentRect.width, elRect.width)
}

/** 将垂直位置限制在父容器可视范围内 */
function clampVerticalY(
  y: number,
  size: { height: number },
  parentSize: { height: number }
): number {
  const maxY = Math.max(0, parentSize.height - size.height)
  return Math.min(Math.max(0, y), maxY)
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

/** 渲染单个任务的状态图标 */
function TaskStatusIcon({ status }: { status: ChecklistTaskStatus }): React.ReactElement {
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
  if (status === 'paused') {
    return <PauseCircleOutlined className={styles.iconPaused} />
  }
  return <span className={styles.iconPending} aria-hidden />
}

/** 渲染任务标题样式类名 */
function queryTaskTitleClass(status: ChecklistTaskStatus): string {
  return [
    styles.taskTitle,
    status === 'done' && styles.taskTitleDone,
    status === 'running' && styles.taskTitleRunning,
    status === 'paused' && styles.taskTitlePaused,
    status === 'failed' && styles.taskTitleFailed,
    status === 'skipped' && styles.taskTitleSkipped
  ]
    .filter(Boolean)
    .join(' ')
}

/** 渲染任务行样式类名 */
function queryTaskRowClass(status: ChecklistTaskStatus): string {
  return [
    styles.taskRow,
    status === 'done' && styles.taskRowDone,
    status === 'skipped' && styles.taskRowSkipped
  ]
    .filter(Boolean)
    .join(' ')
}

/**
 * 浮动任务清单：固定在页面右侧，仅支持上下拖动。
 * 收起时吸附为右侧圆球；点击圆球展开面板。
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
  const savedY = useMemo(() => loadSavedY(), [])
  /** 垂直位置（水平始终贴右对齐） */
  const [positionY, setPositionY] = useState<number>(() => savedY ?? DEFAULT_TOP)
  /** 右侧固定时的 left 坐标，随容器/面板尺寸变化重算 */
  const [rightX, setRightX] = useState(0)
  const [dragging, setDragging] = useState(false)
  /** 任务列表展开；false 时渲染右侧吸附圆球 */
  const [contentExpanded, setContentExpanded] = useState(true)
  /** 面板 ↔ 圆球切换时的过渡动画 */
  const [morphPhase, setMorphPhase] = useState<'idle' | 'to-orb' | 'to-panel'>('idle')
  /** 指针按下时相对控件顶部的垂直偏移 */
  const dragOffsetYRef = useRef(0)
  /** 本次按下起点，用于区分圆球点击与拖动 */
  const pointerStartYRef = useRef(0)
  const movedDuringDragRef = useRef(false)
  /** 面板是否曾展示过（区分首次入场 vs 圆球展开） */
  const hasShownPanelRef = useRef(false)

  /** 收起为右侧吸附圆球 */
  const handleCollapseToOrb = useCallback(
    (event: { stopPropagation: () => void; preventDefault: () => void }) => {
      event.stopPropagation()
      event.preventDefault()
      const parentEl = rootRef.current?.offsetParent as HTMLElement | null
      if (parentEl) {
        const parentWidth = parentEl.getBoundingClientRect().width
        setRightX(queryRightX(parentWidth, ORB_SIZE))
      }
      setMorphPhase('to-orb')
      setContentExpanded(false)
    },
    []
  )

  /** 点击圆球展开面板 */
  const handleExpandFromOrb = useCallback(() => {
    const parentEl = rootRef.current?.offsetParent as HTMLElement | null
    if (parentEl) {
      const parentWidth = parentEl.getBoundingClientRect().width
      setRightX(queryRightX(parentWidth, PANEL_WIDTH))
    }
    setMorphPhase('to-panel')
    setContentExpanded(true)
  }, [])

  /** 任务进度统计 */
  const progress = useMemo(() => {
    const total = tasks.length
    const done = tasks.filter((t) => t.status === 'done').length
    const percent = total > 0 ? Math.round((done / total) * 100) : 0
    return { total, done, percent }
  }, [tasks])

  // 持久化任务状态在中断时仍为 running，只有 Agent 真正执行时才显示动态执行态。
  const hasRunningTask = running && tasks.some((t) => t.status === 'running')

  /** 同步右侧水平坐标，并将垂直位置夹紧到父容器内 */
  const syncLayout = useCallback((): void => {
    const el = rootRef.current
    const parentEl = el?.offsetParent as HTMLElement | null
    if (!el || !parentEl) return
    const { size, parentSize } = queryLayoutMetrics(el, parentEl)
    setRightX(queryRightAlignedX(el, parentEl))
    setPositionY((prev) => clampVerticalY(prev, size, parentSize))
  }, [])

  /** 窗口尺寸变化时校正位置 */
  useEffect(() => {
    window.addEventListener('resize', syncLayout)
    return () => window.removeEventListener('resize', syncLayout)
  }, [syncLayout])

  /** 首次可见或形态切换后，绘制前同步位置，避免展开/收起时闪烁 */
  useLayoutEffect(() => {
    if (!visible) return
    syncLayout()
    if (contentExpanded) {
      hasShownPanelRef.current = true
    }
  }, [visible, contentExpanded, syncLayout])

  /** 拖动结束后持久化垂直位置 */
  useEffect(() => {
    if (dragging) return
    localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify({ y: positionY }))
  }, [dragging, positionY])

  /** 形态切换动画结束后清除 morphPhase */
  useEffect(() => {
    if (morphPhase === 'idle') return
    const timer = window.setTimeout(() => setMorphPhase('idle'), 420)
    return () => window.clearTimeout(timer)
  }, [morphPhase])

  /** 指针按下：开始垂直拖动（面板标题栏或圆球） */
  const handleDragStart = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    const el = rootRef.current
    if (!el) return

    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)

    const elRect = el.getBoundingClientRect()
    dragOffsetYRef.current = event.clientY - elRect.top
    pointerStartYRef.current = event.clientY
    movedDuringDragRef.current = false
    setDragging(true)
  }, [])

  /** 拖动中仅更新垂直坐标，水平始终贴右 */
  const handleDragMove = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (!dragging) return

      const el = rootRef.current
      const parentEl = el?.offsetParent as HTMLElement | null
      if (!el || !parentEl) return

      const dy = event.clientY - pointerStartYRef.current
      if (Math.abs(dy) > CLICK_MOVE_TOLERANCE) {
        movedDuringDragRef.current = true
      }

      const parentRect = parentEl.getBoundingClientRect()
      const { size, parentSize } = queryLayoutMetrics(el, parentEl)
      const nextY = event.clientY - parentRect.top - dragOffsetYRef.current
      setPositionY(clampVerticalY(nextY, size, parentSize))
      setRightX(queryRightAlignedX(el, parentEl))
    },
    [dragging]
  )

  /** 松开：圆球短按展开面板，否则结束拖动 */
  const handleDragEnd = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (!dragging) return
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId)
      }
      setDragging(false)

      if (!contentExpanded && !movedDuringDragRef.current) {
        handleExpandFromOrb()
      }
    },
    [dragging, contentExpanded, handleExpandFromOrb]
  )

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

  /* ── 收起态：右侧吸附圆球 ── */
  if (!contentExpanded) {
    const ringStyle = {
      '--orb-progress': `${progress.percent}`
    } as CSSProperties

    return (
      <div
        ref={rootRef}
        className={rootClass}
        style={{ left: rightX, top: positionY }}
      >
        <button
          type="button"
          className={[
            styles.orb,
            styles.orbEdge_right,
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
              handleExpandFromOrb()
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

  /* ── 展开态：完整任务清单面板 ── */
  return (
    <div
      ref={rootRef}
      className={rootClass}
      style={{ left: rightX, top: positionY }}
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
                    aria-label="收起为圆球"
                    aria-expanded
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={handleCollapseToOrb}
                  >
                    <UpOutlined className={styles.collapseIcon} />
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
          dragging ? styles.cardOpaque : '',
          !hasShownPanelRef.current && morphPhase !== 'to-panel' ? styles.cardFirstAppear : ''
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <ul className={styles.taskList}>
              {tasks.map((item, index) => {
                const displayStatus = queryChecklistTaskStatus(item.status, {
                  running,
                  canResume
                })

                return (
                  <li
                    key={item.id}
                    data-status={displayStatus}
                    className={[
                      queryTaskRowClass(displayStatus),
                      item.parentId ? styles.taskRowChild : ''
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    style={{ '--task-index': index } as CSSProperties}
                  >
                    <span className={styles.statusIcon}>
                      <TaskStatusIcon status={displayStatus} />
                    </span>
                    <div className={styles.taskContent}>
                      <span className={queryTaskTitleClass(displayStatus)}>{item.title}</span>
                      {displayStatus === 'running' ? (
                        <span className={`${styles.taskBadge} ${styles.badgeRunning}`}>执行中</span>
                      ) : null}
                      {displayStatus === 'paused' ? (
                        <span className={`${styles.taskBadge} ${styles.badgePaused}`}>已暂停</span>
                      ) : null}
                      {displayStatus === 'failed' ? (
                        <span className={`${styles.taskBadge} ${styles.badgeFailed}`}>失败</span>
                      ) : null}
                      {displayStatus === 'skipped' ? (
                        <span className={`${styles.taskBadge} ${styles.badgeSkipped}`}>已跳过</span>
                      ) : null}
                    </div>
                  </li>
                )
              })}
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
      </Card>
    </div>
  )
}
