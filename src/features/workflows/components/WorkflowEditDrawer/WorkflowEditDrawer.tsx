import type { WorkflowDefinition } from '@shared/types'
import { WorkflowMetaForm } from '../WorkflowMetaForm'
import { flattenWorkflowLeaves } from '../../utils/workflowCanvasGraph'
import styles from './WorkflowEditDrawer.module.css'

interface WorkflowEditDrawerProps {
  open: boolean
  draft: WorkflowDefinition | null
  saving: boolean
  running: boolean
  onClose: () => void
  onPatch: (
    patch: Partial<
      Pick<WorkflowDefinition, 'title' | 'description' | 'templateKind' | 'nodes' | 'canvas'>
    >
  ) => void
  onOpenCanvas: () => void
  onSave: () => void
  onRun: () => void
}

/** 流程基本信息抽屉；画布在独立的 WorkflowCanvasDrawer 中维护 */
export function WorkflowEditDrawer({
  open,
  draft,
  saving,
  running,
  onClose,
  onPatch,
  onOpenCanvas,
  onSave,
  onRun
}: WorkflowEditDrawerProps): React.ReactElement {
  const stepCount = draft ? flattenWorkflowLeaves(draft.nodes).length : 0

  return (
    <Drawer
      title={null}
      placement="right"
      width={440}
      open={open}
      onClose={onClose}
      destroyOnHidden
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
                <FormOutlined />
              </div>
              <div className={styles.headerText}>
                <div className={styles.titleRow}>
                  <h2 className={styles.drawerTitle}>流程详情</h2>
                  {draft.templateKind === 'publish' ? (
                    <Tag color="processing">发布</Tag>
                  ) : (
                    <Tag>通用</Tag>
                  )}
                </div>
                <p className={styles.workflowName}>{draft.title || '未命名流程'}</p>
                <div className={styles.metaRow}>
                  <code className={styles.idBadge}>{draft.id}</code>
                  <span className={styles.metaDot}>·</span>
                  <span className={styles.metaText}>{stepCount} 步</span>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.drawerBody}>
            <div className={styles.sectionLabel}>基本信息</div>
            <WorkflowMetaForm workflow={draft} onChange={onPatch} />

            <div className={styles.canvasEntry}>
              <div className={styles.canvasEntryMain}>
                <div className={styles.canvasEntryTitle}>流程画布</div>
                <div className={styles.canvasEntryDesc}>
                  当前 {stepCount} 个步骤。在独立抽屉中拖拽节点与连线。
                </div>
              </div>
              <Button type="primary" icon={<AppstoreOutlined />} onClick={onOpenCanvas}>
                打开画布
              </Button>
            </div>
          </div>

          <div className={styles.drawerFooter}>
            <Button onClick={onClose}>关闭</Button>
            <Space>
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
        </>
      ) : null}
    </Drawer>
  )
}
