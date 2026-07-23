import { RobotOutlined } from '@ant-design/icons'
import { Form, Input, Modal, Select } from 'antd'
import { useEffect } from 'react'
import type { ModelConnection, ModelRoleKey } from '@shared/types'
import styles from './EditRoleTaskModal.module.css'

const { TextArea } = Input

export interface EditRoleTaskFormValues {
  connectionId?: string
  promptOverride: string
}

export interface EditRoleTaskModalProps {
  open: boolean
  role: ModelRoleKey | null
  roleLabel: string
  roleDescription: string
  /** 当前映射的连接 id；空表示使用默认连接 */
  connectionId?: string
  promptOverride?: string
  /** 按角色展示的输入提示，通常与默认设定文案一致 */
  promptPlaceholder?: string
  connections: ModelConnection[]
  onCancel: () => void
  onSubmit: (payload: { connectionId?: string; promptOverride: string }) => void
}

/**
 * 维护角色 / 任务的模型连接与补充设定。
 * 卡片仅展示摘要，具体编辑在此弹窗完成。
 */
export function EditRoleTaskModal({
  open,
  role,
  roleLabel,
  roleDescription,
  connectionId,
  promptOverride,
  promptPlaceholder,
  connections,
  onCancel,
  onSubmit
}: EditRoleTaskModalProps): React.ReactElement {
  const [form] = Form.useForm<EditRoleTaskFormValues>()

  useEffect(() => {
    if (!open || !role) return
    form.setFieldsValue({
      connectionId,
      promptOverride: promptOverride ?? ''
    })
  }, [open, role, connectionId, promptOverride, form])

  const handleOk = async (): Promise<void> => {
    const values = await form.validateFields()
    onSubmit({
      connectionId: values.connectionId,
      promptOverride: values.promptOverride.trim()
    })
  }

  return (
    <Modal
      title={`编辑角色 · ${roleLabel}`}
      open={open}
      onCancel={onCancel}
      onOk={() => void handleOk()}
      okText="保存"
      cancelText="取消"
      destroyOnHidden
      className={styles.modal}
      width={560}
    >
      <span className={styles.roleBadge}>
        <RobotOutlined />
        {roleLabel}
      </span>
      <p className={styles.lead}>{roleDescription}</p>
      <Form form={form} layout="vertical" className={styles.form}>
        <Form.Item
          label="模型连接"
          name="connectionId"
          extra="留空则使用默认连接；Supervisor 路由到此角色后按此连接调用模型。"
        >
          <Select
            allowClear
            placeholder="使用默认连接"
            options={connections.map((c) => ({ value: c.id, label: c.label }))}
          />
        </Form.Item>
        <Form.Item
          label="角色设定补充"
          name="promptOverride"
          extra="追加到内置角色说明之后，用于约束语气、输出格式或业务偏好；清空并保存可关闭该角色的补充设定。"
        >
          <TextArea
            className={styles.promptArea}
            rows={6}
            placeholder={
              promptPlaceholder ??
              '追加角色语气、输出格式或业务偏好；留空则仅使用系统内置说明。'
            }
            maxLength={4000}
            showCount
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}
