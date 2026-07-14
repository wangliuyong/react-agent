import type { WorkflowCanvas as WorkflowCanvasModel, WorkflowDefinition } from '@shared/types'
import { WorkflowCanvas } from '../WorkflowCanvas'
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

/** 流程画布专用抽屉（宽度 80vw），顶栏气质对齐技能页 */
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
  const stepCount = draft ? flattenWorkflowLeaves(draft.nodes).length : 0

  return (
    <Drawer
      title={null}
      placement="right"
      width="80vw"
      open={open}
      onClose={onClose}
      destroyOnHidden
      // 详情为 Modal(z≈1000) 时，画布需更高层级才能盖住并交互
      zIndex={1200}
      className={styles.drawer}
      styles={{
        body: { padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
        header: { display: 'none' }
      }}
    >
      {draft ? (
        <>
          <div className={styles.drawerHeader}>
            <div className={styles.headerMain}>
              <div className={styles.headerIcon}>
                <NodeIndexOutlined />
              </div>
              <div className={styles.headerText}>
                <div className={styles.titleRow}>
                  <h2 className={styles.drawerTitle}>流程画布</h2>
                  <span className={styles.countBadge}>{stepCount}</span>
                </div>
                <p className={styles.workflowName}>{draft.title || '未命名流程'}</p>
                <p className={styles.drawerHint}>
                  拖拽节点、从锚点拉线；一源多出线表示并行分支
                </p>
              </div>
            </div>
            <Space wrap className={styles.headerActions}>
              <Button onClick={onClose}>关闭</Button>
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
          <div className={styles.drawerBody}>
            <WorkflowCanvas
              workflowId={draft.id}
              nodes={draft.nodes}
              canvas={draft.canvas}
              onChange={onCanvasChange}
            />
          </div>
        </>
      ) : null}
    </Drawer>
  )
}
