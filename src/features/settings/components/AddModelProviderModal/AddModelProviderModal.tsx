import { Form, Input, Modal } from 'antd'
import { useEffect } from 'react'
import {
  queryNewCustomProviderId,
  type CustomModelProvider
} from '@shared/types'
import { BASE_URL_RULES } from '../SettingsPage/settingsValidation'
import styles from './AddModelProviderModal.module.css'

export interface AddModelProviderFormValues {
  label: string
  apiKeyLabel: string
  defaultBaseUrl: string
  defaultModel: string
}

export interface AddModelProviderModalProps {
  open: boolean
  onCancel: () => void
  /** 提交后由父级写入表单 customProviders 并切换选中项 */
  onSubmit: (provider: CustomModelProvider) => void
}

const DEFAULT_FORM: AddModelProviderFormValues = {
  label: '',
  apiKeyLabel: 'API Key',
  defaultBaseUrl: 'https://api.openai.com/v1',
  defaultModel: 'gpt-4o-mini'
}

/**
 * 添加自定义 OpenAI 兼容模型供应商。
 * 为什么：内置三家不足以覆盖用户自建的网关 / 私有部署，需可扩展且仅存本机。
 */
export function AddModelProviderModal({
  open,
  onCancel,
  onSubmit
}: AddModelProviderModalProps): React.ReactElement {
  const [form] = Form.useForm<AddModelProviderFormValues>()

  useEffect(() => {
    if (!open) return
    form.setFieldsValue(DEFAULT_FORM)
  }, [open, form])

  const handleOk = async (): Promise<void> => {
    const values = await form.validateFields()
    onSubmit({
      id: queryNewCustomProviderId(),
      label: values.label.trim(),
      apiKeyLabel: values.apiKeyLabel.trim() || 'API Key',
      defaultBaseUrl: values.defaultBaseUrl.trim(),
      defaultModel: values.defaultModel.trim() || 'gpt-4o-mini'
    })
    form.resetFields()
  }

  return (
    <Modal
      title="添加模型供应商"
      open={open}
      onCancel={onCancel}
      onOk={() => void handleOk()}
      okText="添加并选用"
      cancelText="取消"
      destroyOnClose
      className={styles.modal}
      width={480}
    >
      <p className={styles.lead}>
        自定义供应商按 OpenAI 兼容协议接入，填写服务地址后即可拉取 /models 列表。
      </p>
      <Form form={form} layout="vertical" className={styles.form}>
        <Form.Item
          label="供应商名称"
          name="label"
          rules={[{ required: true, message: '请填写供应商名称' }]}
        >
          <Input placeholder="如：月之暗面、MiniMax、本地网关" maxLength={32} />
        </Form.Item>
        <Form.Item
          label="API Key 标签"
          name="apiKeyLabel"
          extra="将显示在密钥输入框旁，便于区分不同平台。"
        >
          <Input placeholder="API Key" maxLength={40} />
        </Form.Item>
        <Form.Item
          label="默认 Base URL"
          name="defaultBaseUrl"
          rules={BASE_URL_RULES}
          extra="须包含协议，切换到此供应商时会预填。"
        >
          <Input placeholder="https://api.example.com/v1" />
        </Form.Item>
        <Form.Item
          label="默认模型"
          name="defaultModel"
          extra="拉取平台列表失败或尚未配置 Key 时的兜底模型 id。"
        >
          <Input placeholder="gpt-4o-mini" />
        </Form.Item>
      </Form>
    </Modal>
  )
}
