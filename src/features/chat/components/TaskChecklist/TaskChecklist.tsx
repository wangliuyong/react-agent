import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react'
import type { TaskItem } from '@shared/types'
import { useAppStore } from '@/stores/app-store'
import {
  queryChecklistTaskStatus,
  type ChecklistTaskStatus
} from './task-status'
import styles from './TaskChecklist.module.css'
import { SummarizeSkillModal } from './SummarizeSkillModal'
import {
  queryCanSummarizeTasksToSkill,
  querySuccessfulTaskCount
} from '@shared/query-can-summarize-tasks'

/** 默认距顶部偏移（位于 header 下方，相对锚定容器） */
const DEFAULT_TOP = 100
/** 指针移动超过该距离视为拖动而非点击 */
const CLICK_MOVE_TOLERANCE = 6

/** 垂直定位锚点选择器（ChatPage .page） */
const ANCHOR_SELECTOR = '[data-task-checklist-anchor]'

/** localStorage 键：记住垂直位置（视口坐标） */
const POSITION_STORAGE_KEY = 'react-agent:task-checklist-position'

interface TaskChecklistProps {
  tasks: TaskItem[]
  visible: boolean
  /** 当前会话 id，用于总结为技能 */
  sessionId?: string | null
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

/** 从 localStorage 读取垂直位置；兼容旧版相对 page 的 offset */
function loadSavedY(anchorTop: number): number {
  try {
    const raw = localStorage.getItem(POSITION_STORAGE_KEY)
    if (!raw) return anchorTop + DEFAULT_TOP
    const parsed = JSON.parse(raw) as { y?: unknown; space?: unknown }
    if (typeof parsed.y !== 'number') return anchorTop + DEFAULT_TOP
    if (parsed.space === 'viewport') return parsed.y
    return anchorTop + parsed.y
  } catch {
    return anchorTop + DEFAULT_TOP
  }
}

/** 持久化垂直位置到 localStorage */
function postSavedY(y: number): void {
  localStorage.setItem(
    POSITION_STORAGE_KEY,
    JSON.stringify({ y, space: 'viewport' })
  )
}

/** 查找 ChatPage 锚定容器 */
function queryAnchorEl(fromEl: HTMLElement): HTMLElement | null {
  return fromEl.closest(ANCHOR_SELECTOR) as HTMLElement | null
}

/** 将 fixed 定位的 top 限制在锚定容器可视范围内 */
function clampFixedVerticalY(
  y: number,
  elementHeight: number,
  anchorEl: HTMLElement
): number {
  const rect = anchorEl.getBoundingClientRect()
  const minY = rect.top
  const maxY = rect.bottom - elementHeight
  return Math.min(Math.max(minY, y), maxY)
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
 * 浮动任务清单：fixed 贴右（right: 0），不随侧边栏折叠移动；仅支持上下拖动。
 * 收起时吸附为右侧圆球；点击圆球展开面板。
 */
const { Text } = Typography

export function TaskChecklist({
  tasks,
  visible,
  sessionId = null,
  running = false,
  awaitUserReason = null,
  canResume = false,
  onAbort,
  onContinue,
  onResume
}: TaskChecklistProps): React.ReactElement | null {
  const rootRef = useRef<HTMLDivElement>(null)
  /** 总结为技能弹窗 */
  const [summarizeOpen, setSummarizeOpen] = useState(false)
  /** 垂直位置（视口坐标，fixed top） */
  const [positionY, setPositionY] = useState<number>(DEFAULT_TOP)
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
  /** 是否已从缓存完成首次定位 */
  const positionInitializedRef = useRef(false)
  /** 同步 positionY 供拖动结束时写入缓存 */
  const positionYRef = useRef(DEFAULT_TOP)

  /** 收起为右侧吸附圆球 */
  const handleCollapseToOrb = useCallback(
    (event: { stopPropagation: () => void; preventDefault: () => void }) => {
      event.stopPropagation()
      event.preventDefault()
      setMorphPhase('to-orb')
      setContentExpanded(false)
    },
    []
  )

  /** 点击圆球展开面板 */
  const handleExpandFromOrb = useCallback(() => {
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

  /** 同步垂直位置：首次读取缓存，之后仅夹紧范围 */
  const syncLayout = useCallback((): void => {
    const el = rootRef.current
    const anchorEl = el ? queryAnchorEl(el) : null
    if (!el || !anchorEl) return
    const height = el.getBoundingClientRect().height
    const anchorTop = anchorEl.getBoundingClientRect().top
    setPositionY((prev) => {
      const baseY = positionInitializedRef.current
        ? prev
        : loadSavedY(anchorTop)
      if (!positionInitializedRef.current) {
        positionInitializedRef.current = true
      }
      return clampFixedVerticalY(baseY, height, anchorEl)
    })
  }, [])

  useEffect(() => {
    positionYRef.current = positionY
  }, [positionY])

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

  /** 拖动中仅更新垂直坐标 */
  const handleDragMove = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (!dragging) return

      const el = rootRef.current
      const anchorEl = el ? queryAnchorEl(el) : null
      if (!el || !anchorEl) return

      const dy = event.clientY - pointerStartYRef.current
      if (Math.abs(dy) > CLICK_MOVE_TOLERANCE) {
        movedDuringDragRef.current = true
      }

      const height = el.getBoundingClientRect().height
      const nextY = clampFixedVerticalY(
        event.clientY - dragOffsetYRef.current,
        height,
        anchorEl
      )
      positionYRef.current = nextY
      setPositionY(nextY)
    },
    [dragging]
  )

  /** 松开：圆球短按展开面板；拖动结束后缓存位置 */
  const handleDragEnd = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (!dragging) return
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId)
      }
      setDragging(false)

      if (movedDuringDragRef.current) {
        const el = rootRef.current
        const anchorEl = el ? queryAnchorEl(el) : null
        if (el && anchorEl) {
          const height = el.getBoundingClientRect().height
          const savedY = clampFixedVerticalY(
            event.clientY - dragOffsetYRef.current,
            height,
            anchorEl
          )
          positionYRef.current = savedY
          postSavedY(savedY)
        }
      }

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

  /** 是否展示「总结为技能」入口 */
  const canSummarizeToSkill = queryCanSummarizeTasksToSkill(tasks, running, awaitUserReason)
  const successfulStepCount = querySuccessfulTaskCount(tasks)

  const setView = useAppStore((s) => s.setView)

  /** 总结为技能弹窗（收起/展开态均需挂载） */
  const summarizeModal = (
    <SummarizeSkillModal
      open={summarizeOpen}
      sessionId={sessionId}
      successfulStepCount={successfulStepCount}
      onClose={() => setSummarizeOpen(false)}
      onPublished={() => setView('skills')}
    />
  )

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
      <>
        <div
          ref={rootRef}
          className={rootClass}
          style={{ top: positionY }}
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
        {summarizeModal}
      </>
    )
  }

  /* ── 展开态：完整任务清单面板 ── */
  return (
    <div
      ref={rootRef}
      className={rootClass}
      style={{ top: positionY }}
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

        {canSummarizeToSkill && sessionId ? (
          <div
            className={styles.summarizeBar}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <Text type="secondary" className={styles.summarizeHint}>
              {successfulStepCount} 个步骤已成功，可总结为可复用技能
            </Text>
            <Button
              type="primary"
              size="small"
              ghost
              icon={<BulbOutlined />}
              className={styles.actionBtn}
              onClick={() => setSummarizeOpen(true)}
            >
              总结为技能
            </Button>
          </div>
        ) : null}
      </Card>

      {summarizeModal}
    </div>
  )
}
