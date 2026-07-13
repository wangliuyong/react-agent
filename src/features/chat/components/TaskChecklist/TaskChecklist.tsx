import { CheckCircleOutlined } from '@ant-design/icons'
import { Card, List } from 'antd'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { TaskItem } from '@shared/types'
import styles from './TaskChecklist.module.css'

/** 默认距顶部偏移（位于 header 下方） */
const DEFAULT_TOP = 68
/** 默认距右侧边距 */
const DEFAULT_MARGIN = 20

/** localStorage 键：记住用户拖动后的位置 */
const POSITION_STORAGE_KEY = 'react-agent:task-checklist-position'

interface TaskChecklistProps {
  tasks: TaskItem[]
  visible: boolean
}

interface Position {
  x: number
  y: number
}

/** 旧版默认左上角位置（用于迁移，避免 localStorage 残留导致仍显示在左侧） */
const LEGACY_DEFAULT_POSITION = { x: 20, y: 68 }

/** 从 localStorage 读取上次保存的位置；无记录时返回 null，使用右上角默认位置 */
function loadSavedPosition(): Position | null {
  try {
    const raw = localStorage.getItem(POSITION_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Position
    if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
      // 若仍是旧版左上角默认值，视为未自定义，改用右上角
      if (
        parsed.x === LEGACY_DEFAULT_POSITION.x &&
        parsed.y === LEGACY_DEFAULT_POSITION.y
      ) {
        return null
      }
      return parsed
    }
  } catch {
    // 解析失败时使用默认位置
  }
  return null
}

/** 计算右上角默认位置（相对 .page 容器） */
function getDefaultPosition(cardEl: HTMLElement, parentEl: HTMLElement): Position {
  const parentRect = parentEl.getBoundingClientRect()
  const cardRect = cardEl.getBoundingClientRect()
  return {
    x: Math.max(0, parentRect.width - cardRect.width - DEFAULT_MARGIN),
    y: DEFAULT_TOP
  }
}

/** 将位置限制在父容器可视范围内，避免拖出边界 */
function clampPosition(
  pos: Position,
  cardEl: HTMLElement,
  parentEl: HTMLElement
): Position {
  const parentRect = parentEl.getBoundingClientRect()
  const cardRect = cardEl.getBoundingClientRect()
  const maxX = Math.max(0, parentRect.width - cardRect.width)
  const maxY = Math.max(0, parentRect.height - cardRect.height)
  return {
    x: Math.min(Math.max(0, pos.x), maxX),
    y: Math.min(Math.max(0, pos.y), maxY)
  }
}

/**
 * 浮动任务清单：默认固定于聊天页右上角，可拖动，不随消息区滚动。
 * 拖动仅通过标题栏触发，避免与列表内容交互冲突。
 */
export function TaskChecklist({ tasks, visible }: TaskChecklistProps): React.ReactElement | null {
  const cardRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState<Position>(() => loadSavedPosition() ?? { x: 0, y: DEFAULT_TOP })
  const [dragging, setDragging] = useState(false)
  /** 指针按下时，记录指针相对卡片左上角的偏移 */
  const dragOffsetRef = useRef<Position>({ x: 0, y: 0 })

  /** 窗口尺寸变化时重新校正位置，防止卡片超出可视区域 */
  useEffect(() => {
    const handleResize = (): void => {
      const cardEl = cardRef.current
      const parentEl = cardEl?.offsetParent as HTMLElement | null
      if (!cardEl || !parentEl) return
      setPosition((prev) => clampPosition(prev, cardEl, parentEl))
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  /** 首次挂载：无保存位置时对齐右上角，有保存位置则校正到合法范围 */
  useEffect(() => {
    const cardEl = cardRef.current
    const parentEl = cardEl?.offsetParent as HTMLElement | null
    if (!cardEl || !parentEl) return

    const saved = loadSavedPosition()
    const next = saved ?? getDefaultPosition(cardEl, parentEl)
    setPosition(clampPosition(next, cardEl, parentEl))
  }, [visible])

  /** 拖动结束后持久化位置 */
  useEffect(() => {
    if (dragging) return
    localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify(position))
  }, [dragging, position])

  /** 标题栏按下：开始拖动 */
  const handleDragStart = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const cardEl = cardRef.current
    const parentEl = cardEl?.offsetParent as HTMLElement | null
    if (!cardEl || !parentEl) return

    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)

    const cardRect = cardEl.getBoundingClientRect()
    const parentRect = parentEl.getBoundingClientRect()

    dragOffsetRef.current = {
      x: event.clientX - cardRect.left,
      y: event.clientY - cardRect.top
    }

    setDragging(true)
  }, [])

  /** 拖动中：根据指针位置更新卡片坐标 */
  const handleDragMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!dragging) return

      const cardEl = cardRef.current
      const parentEl = cardEl?.offsetParent as HTMLElement | null
      if (!cardEl || !parentEl) return

      const parentRect = parentEl.getBoundingClientRect()
      const nextPos: Position = {
        x: event.clientX - parentRect.left - dragOffsetRef.current.x,
        y: event.clientY - parentRect.top - dragOffsetRef.current.y
      }

      setPosition(clampPosition(nextPos, cardEl, parentEl))
    },
    [dragging]
  )

  /** 松开指针：结束拖动 */
  const handleDragEnd = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    setDragging(false)
  }, [dragging])

  if (!visible || tasks.length === 0) return null

  return (
    <Card
      ref={cardRef}
      size="small"
      title={
        <div
          className={`${styles.dragHandle} ${dragging ? styles.dragging : ''}`}
          onPointerDown={handleDragStart}
          onPointerMove={handleDragMove}
          onPointerUp={handleDragEnd}
          onPointerCancel={handleDragEnd}
        >
          <span>任务清单</span>
        </div>
      }
      className={styles.card}
      style={{ left: position.x, top: position.y }}
      styles={{ body: { padding: '8px 12px' } }}
    >
      <List
        size="small"
        dataSource={tasks}
        renderItem={(item) => (
          <List.Item style={{ padding: '6px 0', border: 'none' }}>
            <span
              className={[
                styles.taskItem,
                item.status === 'done' && styles.taskItemDone,
                item.status === 'running' && styles.taskItemRunning,
                item.status === 'failed' && styles.taskItemFailed
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {item.status === 'done' ? (
                <CheckCircleOutlined className={styles.doneIcon} />
              ) : item.status === 'running' ? (
                <span className={styles.dot} />
              ) : (
                <span className={styles.pending} />
              )}
              <span className={item.status === 'done' ? styles.doneText : undefined}>
                {item.title}
              </span>
            </span>
          </List.Item>
        )}
      />
    </Card>
  )
}
