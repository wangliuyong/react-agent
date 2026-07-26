import { Form, Input, Modal } from 'antd'
import { useEffect } from 'react'
import type { CustomAgentRole } from '@shared/types'
import styles from './AddCustomRoleModal.module.css'

const { TextArea } = Input

export interface AddCustomRoleFormValues {
  label: string
  description: string
  systemPrompt: string
}

export interface AddCustomRoleModalProps {
  open: boolean
  onCancel: () => void
  onSubmit: (payload: Omit<CustomAgentRole, 'id' | 'createdAt' | 'updatedAt'>) => void
}

/**
 * 新建用户自定义聊天角色（id 由主面板按 label 生成 custom_*）。
 */
export function AddCustomRoleModal({
  open,
  onCancel,
  onSubmit
}: AddCustomRoleModalProps): React.ReactElement {
  const [form] = Form.useForm<AddCustomRoleFormValues>()

  useEffect(() => {
    if (!open) return
    form.setFieldsValue({
      label: '',
      description: '',
      systemPrompt: ''
    })
  }, [open, form])

  const handleOk = async (): Promise<void> => {
    const values = await form.validateFields()
    onSubmit({
      label: values.label.trim(),
      description: values.description.trim(),
      systemPrompt: values.systemPrompt.trim(),
      toolWhitelist: null
    })
  }

  return (
    <Modal
      title="添加自定义角色"
      open={open}
      onCancel={onCancel}
      onOk={() => void handleOk()}
      okText="创建"
      cancelText="取消"
      destroyOnHidden
      className={styles.modal}
      width={560}
    >
      <p className={styles.lead}>
        自定义角色会出现在角色卡片列表中，可由 Supervisor 路由直达（单步执行后结束）。内置角色不可删除。
      </p>
      <Form form={form} layout="vertical" className={styles.form}>
        <Form.Item
          label="角色名称"
          name="label"
          rules={[{ required: true, message: '请填写角色名称' }]}
        >
          <Input placeholder="如：法务顾问、数据分析师" maxLength={40} showCount />
        </Form.Item>
        <Form.Item label="卡片摘要" name="description">
          <Input placeholder="在设置卡片上展示的简短说明" maxLength={120} showCount />
        </Form.Item>
        <Form.Item
          label="角色系统说明"
          name="systemPrompt"
          rules={[{ required: true, message: '请填写角色职责与输出要求' }]}
          extra="Markdown；会追加在通用能力基座之后，作为该角色的核心指令。"
        >
          <TextArea
            rows={8}
            placeholder="描述该角色负责什么、禁止什么、输出格式等…"
            maxLength={8000}
            showCount
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}
