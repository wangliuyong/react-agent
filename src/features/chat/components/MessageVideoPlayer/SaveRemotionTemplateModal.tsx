import { isValidSkillId, slugifySkillId } from '@/features/skills/types'
import { postSaveRemotionTemplateFromChat } from '@/features/remotion-templates/api'
import styles from './SaveRemotionTemplateModal.module.css'

export interface SaveRemotionTemplateModalProps {
  open: boolean
  sessionId: string | null
  videoPath: string
  defaultName?: string
  onClose: () => void
  onSaved?: () => void
}

/**
 * 将当前会话 Remotion 成片存为可复用模板。
 */
export function SaveRemotionTemplateModal({
  open,
  sessionId,
  videoPath,
  defaultName = '我的视频模板',
  onClose,
  onSaved
}: SaveRemotionTemplateModalProps): React.ReactElement {
  const [name, setName] = useState(defaultName)
  const [templateId, setTemplateId] = useState(() => slugifySkillId(defaultName))
  const [tags, setTags] = useState('from-chat')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setName(defaultName)
    setTemplateId(slugifySkillId(defaultName))
    setTags('from-chat')
  }, [open, defaultName])

  const handleOk = async (): Promise<void> => {
    if (!sessionId) {
      message.error('无法识别当前会话')
      return
    }
    const trimmedName = name.trim()
    const id = templateId.trim()
    if (!trimmedName) {
      message.warning('请输入模板名称')
      return
    }
    if (!isValidSkillId(id)) {
      message.warning('模板 id 仅允许小写字母、数字和连字符')
      return
    }
    setSaving(true)
    try {
      await postSaveRemotionTemplateFromChat({
        sessionId,
        name: trimmedName,
        templateId: id,
        tags: tags
          .split(/[,，\s]+/)
          .map((t) => t.trim())
          .filter(Boolean),
        videoPath
      })
      message.success('已保存为 Remotion 模板')
      onSaved?.()
      onClose()
    } catch (err) {
      message.error(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      title="存为 Remotion 模板"
      open={open}
      onCancel={onClose}
      onOk={() => void handleOk()}
      confirmLoading={saving}
      okText="保存"
    >
      <p className={styles.hint}>
        将当前会话的 Remotion 工程快照保存到本地模板库，可在「技能 → 视频模板」或 Agent
        remotion_apply_template 中复用。
      </p>
      <Form layout="vertical">
        <Form.Item label="模板名称" required>
          <Input
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              if (!templateId || templateId === slugifySkillId(name)) {
                setTemplateId(slugifySkillId(e.target.value))
              }
            }}
          />
        </Form.Item>
        <Form.Item label="模板 id" required>
          <Input value={templateId} onChange={(e) => setTemplateId(e.target.value)} />
        </Form.Item>
        <Form.Item label="标签（逗号分隔）">
          <Input value={tags} onChange={(e) => setTags(e.target.value)} />
        </Form.Item>
      </Form>
    </Modal>
  )
}

/** 路径是否像本会话 Remotion 成片输出 */
export function queryIsRemotionSessionVideoPath(filePath: string): boolean {
  return /\/remotion\/[^/]+\/out\//i.test(filePath.replace(/\\/g, '/'))
}
