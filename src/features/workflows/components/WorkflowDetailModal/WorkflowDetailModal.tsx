import type { WorkflowDefinition } from '@shared/types'
import { DB_THEME } from '@/styles/theme-tokens'
import { WorkflowMetaForm } from '../WorkflowMetaForm'
import { flattenWorkflowLeaves } from '../../utils/workflowCanvasGraph'
import styles from './WorkflowDetailModal.module.css'

interface WorkflowDetailModalProps {
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
  onDelete: (id: string) => void
}

/** 流程详情弹窗：信息架构对齐技能市场详情 Modal；画布仍走独立抽屉 */
export function WorkflowDetailModal({
  open,
  draft,
  saving,
  running,
  onClose,
  onPatch,
  onOpenCanvas,
  onSave,
  onRun,
  onDelete
}: WorkflowDetailModalProps): React.ReactElement {
  const stepCount = draft ? flattenWorkflowLeaves(draft.nodes).length : 0
  const isPublish = draft?.templateKind === 'publish'

  return (
    <Modal
      title={draft?.title?.trim() || '流程详情'}
      open={open}
      onCancel={onClose}
      footer={
        draft ? (
          <div className={styles.footer}>
            <span></span>
            {/* <Button onClick={onClose}>关闭</Button> */}
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
        ) : null
      }
      width={760}
      destroyOnHidden
      className={styles.detailModal}
    >
      {!draft ? (
        <Empty description="未找到流程详情" />
      ) : (
        <div className={styles.detailBody}>
          <div className={styles.detailHeader}>
            <div>
              <code className={styles.detailId}>{draft.id}</code>
              <div className={styles.detailTags}>
                {isPublish ? (
                  <Tag color={DB_THEME.primary}>发布</Tag>
                ) : (
                  <Tag>通用</Tag>
                )}
                <Tag>{stepCount} 步</Tag>
              </div>
            </div>
            <Space wrap>
              <Button type="primary" icon={<NodeIndexOutlined />} onClick={onOpenCanvas}>
                打开画布
              </Button>
              <Popconfirm
                title="确定删除该流程？"
                description="删除后不可恢复"
                okText="删除"
                cancelText="取消"
                okButtonProps={{ danger: true }}
                onConfirm={() => onDelete(draft.id)}
              >
                <Button danger icon={<DeleteOutlined />}>
                  删除
                </Button>
              </Popconfirm>
            </Space>
          </div>

          {draft.description?.trim() ? (
            <p className={styles.description}>{draft.description}</p>
          ) : null}

          <div>
            <h3 className={styles.sectionLabel}>基本信息</h3>
            <WorkflowMetaForm workflow={draft} onChange={onPatch} />
          </div>

          <div className={styles.canvasEntry}>
            <div className={styles.canvasEntryIcon}>
              <AppstoreOutlined />
            </div>
            <div className={styles.canvasEntryMain}>
              <div className={styles.canvasEntryTitle}>流程画布</div>
              <div className={styles.canvasEntryDesc}>
                {stepCount > 0
                  ? `已配置 ${stepCount} 个步骤，在独立抽屉中拖拽连线编排`
                  : '尚未配置步骤，打开画布添加节点与连线'}
              </div>
            </div>
            <Button icon={<NodeIndexOutlined />} onClick={onOpenCanvas}>
              编辑画布
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
