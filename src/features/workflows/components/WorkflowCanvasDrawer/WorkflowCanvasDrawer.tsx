import { useRef } from 'react'
import type { MenuProps } from 'antd'
import type { WorkflowCanvas as WorkflowCanvasModel, WorkflowDefinition } from '@shared/types'
import { DB_THEME } from '@/styles/theme-tokens'
import { useElementFullscreen } from '@/hooks/useElementFullscreen'
import {
  WorkflowCanvas,
  type WorkflowCanvasHandle,
  type WorkflowCanvasLeafType
} from '../WorkflowCanvas'
import { flattenWorkflowLeaves } from '../../utils/workflowCanvasGraph'
import styles from './WorkflowCanvasDrawer.module.css'

interface WorkflowCanvasDrawerProps {
  open: boolean
  draft: WorkflowDefinition | null
  saving: boolean
  running: boolean
  onClose: () => void
  onCanvasChange: (next: {
    nodes: WorkflowDefinition['nodes']
    canvas: WorkflowCanvasModel
  }) => void
  onSave: () => void
  onRun: () => void
}

/** 画布编辑区头部「添加节点」菜单项（条件分支为控制节点，单独 key） */
const ADD_NODE_MENU_TYPES: { key: WorkflowCanvasLeafType | 'condition'; label: string }[] = [
  { key: 'agent', label: 'Agent 步骤' },
  { key: 'tool', label: '工具步骤' },
  { key: 'await_user', label: '等待确认' },
  { key: 'condition', label: '条件分支' }
]

/** 流程画布抽屉：信息架构对齐技能市场详情弹窗，顶栏展示关闭图标 */
export function WorkflowCanvasDrawer({
  open,
  draft,
  saving,
  running,
  onClose,
  onCanvasChange,
  onSave,
  onRun
}: WorkflowCanvasDrawerProps): React.ReactElement {
  const canvasPanelRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<WorkflowCanvasHandle>(null)
  const { isFullscreen, toggleFullscreen, exitFullscreen } =
    useElementFullscreen(canvasPanelRef)

  const stepCount = draft ? flattenWorkflowLeaves(draft.nodes).length : 0
  const isPublish = draft?.templateKind === 'publish'

  /** 关闭抽屉时若仍全屏，先退出，避免残留全屏壳 */
  const handleClose = (): void => {
    if (isFullscreen) {
      void exitFullscreen().finally(() => onClose())
      return
    }
    onClose()
  }

  /** 通过画布命令式 API 追加叶子或条件节点 */
  const addMenu: MenuProps['items'] = ADD_NODE_MENU_TYPES.map(({ key, label }) => ({
    key,
    label,
    onClick: () => {
      if (key === 'condition') {
        canvasRef.current?.addCondition()
        return
      }
      canvasRef.current?.addLeafByType(key)
    }
  }))

  return (
    <Drawer
      title={
        <div className={styles.titleRow}>
          <span className={styles.drawerTitle}>流程画布</span>
          <span className={styles.countBadge}>{stepCount}</span>
        </div>
      }
      placement="right"
      width="80vw"
      open={open}
      onClose={handleClose}
      closable
      closeIcon={<CloseOutlined />}
      destroyOnHidden
      // 详情为 Modal(z≈1000) 时，画布需更高层级才能盖住并交互
      zIndex={1200}
      className={styles.drawer}
      styles={{
        body: {
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }
      }}
    >
      {draft ? (
        <div className={styles.detailBody}>
          <div className={styles.detailHeader}>
            <div className={styles.headerMeta}>
              <code className={styles.detailId}>{draft.id}</code>
              <div className={styles.detailTags}>
                {isPublish ? (
                  <Tag color={DB_THEME.primary}>发布</Tag>
                ) : (
                  <Tag>通用</Tag>
                )}
                <Tag>{stepCount} 步</Tag>
                <Tag className={styles.nameTag}>{draft.title || '未命名流程'}</Tag>
              </div>
            </div>
            <Space wrap>
              <Button onClick={onSave} loading={saving}>
                保存
              </Button>
              <Button
                type="primary"
                icon={<PlayCircleOutlined />}
                loading={running || saving}
                disabled={!draft.nodes.length}
                onClick={onRun}
              >
                立即运行
              </Button>
            </Space>
          </div>

          <p className={styles.description}>
            拖拽节点、从锚点拉线编排步骤。带标签（条件出口）的出线 = 条件分支；无标签多出线 =
            并行。双击节点可编辑。
          </p>

          <div className={styles.canvasPanel} ref={canvasPanelRef}>
            <div className={styles.canvasPanelHead}>
              <div className={styles.canvasPanelIcon}>
                <NodeIndexOutlined />
              </div>
              <div className={styles.canvasPanelText}>
                <div className={styles.canvasPanelTitle}>画布编辑区</div>
                <div className={styles.canvasPanelDesc}>
                  {stepCount > 0
                    ? `当前 ${stepCount} 个步骤，拖拽与连线后记得保存`
                    : '尚未配置步骤，从空白画布开始添加节点'}
                </div>
              </div>
              <div className={styles.canvasPanelActions}>
                <Dropdown
                  menu={{ items: addMenu }}
                  getPopupContainer={
                    isFullscreen && canvasPanelRef.current
                      ? () => canvasPanelRef.current as HTMLElement
                      : undefined
                  }
                >
                  <Button type="primary" size="small" icon={<PlusOutlined />}>
                    添加节点
                  </Button>
                </Dropdown>
                <Button
                  type="text"
                  className={styles.fullscreenBtn}
                  icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
                  title={isFullscreen ? '退出全屏' : '全屏'}
                  aria-label={isFullscreen ? '退出全屏' : '全屏'}
                  onClick={() => void toggleFullscreen()}
                />
              </div>
            </div>
            <div className={styles.drawerBody}>
              <WorkflowCanvas
                ref={canvasRef}
                workflowId={draft.id}
                nodes={draft.nodes}
                canvas={draft.canvas}
                onChange={onCanvasChange}
                isFullscreen={isFullscreen}
                fullscreenContainer={isFullscreen ? canvasPanelRef.current : null}
              />
            </div>
          </div>
        </div>
      ) : null}
    </Drawer>
  )
}
