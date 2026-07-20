import type { SkillUpsertInput } from '@shared/types'
import {
  postProjectSkill,
  postSkillStates,
  postSummarizeSkillFromSession
} from '@/features/skills/api'
import { isValidSkillId, slugifySkillId } from '@/features/skills/types'
import styles from './SummarizeSkillModal.module.css'

interface SummarizeSkillModalProps {
  open: boolean
  sessionId: string | null
  /** 成功步骤数量，用于提示文案 */
  successfulStepCount: number
  onClose: () => void
  /** 发布成功后回调（可选跳转技能页） */
  onPublished?: (skillId: string) => void
}

/**
 * 任务清单「总结为技能」弹窗：
 * 1. 调用主进程 LLM 总结成功步骤
 * 2. 用户预览/编辑后发布到本地技能库（技能市场「我的技能」）
 */
export function SummarizeSkillModal({
  open,
  sessionId,
  successfulStepCount,
  onClose,
  onPublished
}: SummarizeSkillModalProps): React.ReactElement {
  const [form] = Form.useForm<SkillUpsertInput>()
  const [summarizing, setSummarizing] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [draftLoaded, setDraftLoaded] = useState(false)
  const [enableAfterPublish, setEnableAfterPublish] = useState(true)

  /** 打开弹窗时自动拉取 LLM 总结草稿 */
  useEffect(() => {
    if (!open || !sessionId) {
      setDraftLoaded(false)
      return
    }

    let cancelled = false
    setSummarizing(true)
    setDraftLoaded(false)

    void postSummarizeSkillFromSession(sessionId)
      .then((draft) => {
        if (cancelled) return
        form.setFieldsValue(draft)
        setDraftLoaded(true)
      })
      .catch((err) => {
        if (cancelled) return
        message.error(err instanceof Error ? err.message : '总结失败')
        onClose()
      })
      .finally(() => {
        if (!cancelled) setSummarizing(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, sessionId, form, onClose])

  const handlePublish = async (): Promise<void> => {
    try {
      const values = await form.validateFields()
      const normalizedId = slugifySkillId(values.id)
      if (!isValidSkillId(normalizedId)) {
        message.error('技能 id 仅允许小写字母、数字和连字符')
        return
      }

      setPublishing(true)
      const detail = await postProjectSkill({
        ...values,
        id: normalizedId,
        examplesContent: values.examplesContent?.trim() || undefined
      })

      if (enableAfterPublish) {
        await postSkillStates({ [detail.id]: { enabled: true } })
      }

      message.success(
        enableAfterPublish
          ? `技能「${detail.name}」已发布并启用，可在技能市场查看`
          : `技能「${detail.name}」已保存到技能市场`
      )
      onPublished?.(detail.id)
      onClose()
    } catch (err) {
      if (err instanceof Error && err.message !== 'validation') {
        message.error(err.message)
      }
    } finally {
      setPublishing(false)
    }
  }

  return (
    <Modal
      title="总结为技能并发布"
      open={open}
      onCancel={onClose}
      width={720}
      destroyOnHidden
      footer={
        <div className={styles.footer}>
          <Checkbox
            checked={enableAfterPublish}
            onChange={(e) => setEnableAfterPublish(e.target.checked)}
            disabled={summarizing || publishing}
          >
            发布后立即启用
          </Checkbox>
          <Space>
            <Button onClick={onClose} disabled={publishing}>
              取消
            </Button>
            <Button
              type="primary"
              loading={publishing}
              disabled={summarizing || !draftLoaded}
              icon={<CloudUploadOutlined />}
              onClick={() => void handlePublish()}
            >
              发布到技能市场
            </Button>
          </Space>
        </div>
      }
    >
      <Spin spinning={summarizing} tip="正在总结成功步骤经验…">
        <div className={styles.hint}>
          <BulbOutlined className={styles.hintIcon} />
          <span>
            将从 <strong>{successfulStepCount}</strong> 个成功执行的步骤中提炼经验，失败与未执行的步骤已自动剔除。
            发布后将保存到技能市场的「我的技能」。
          </span>
        </div>

        <Form
          form={form}
          layout="vertical"
          disabled={summarizing || publishing}
          className={styles.form}
        >
          <Form.Item
            name="id"
            label="技能 ID（目录名）"
            rules={[
              { required: true, message: '请输入技能 id' },
              {
                validator: (_, value: string) =>
                  isValidSkillId(value) ? Promise.resolve() : Promise.reject(new Error('格式无效'))
              }
            ]}
            extra="仅小写字母、数字、连字符"
          >
            <Input placeholder="my-workflow-skill" />
          </Form.Item>
          <Form.Item
            name="name"
            label="名称"
            rules={[{ required: true, message: '请输入名称' }]}
          >
            <Input
              placeholder="技能展示名称"
              onChange={(e) => {
                form.setFieldValue('id', slugifySkillId(e.target.value))
              }}
            />
          </Form.Item>
          <Form.Item
            name="description"
            label="描述"
            rules={[{ required: true, message: '请输入描述' }]}
            extra="Agent 用此描述判断何时启用该技能"
          >
            <Input.TextArea rows={2} placeholder="描述技能用途与触发场景" />
          </Form.Item>
          <Form.Item
            name="content"
            label="正文（Markdown）"
            rules={[{ required: true, message: '请输入正文' }]}
          >
            <Input.TextArea rows={12} placeholder="# 技能标题&#10;&#10;## 标准任务清单..." />
          </Form.Item>
          <Form.Item name="examplesContent" label="示例（可选）">
            <Input.TextArea rows={4} placeholder="# 示例场景..." />
          </Form.Item>
        </Form>
      </Spin>
    </Modal>
  )
}
