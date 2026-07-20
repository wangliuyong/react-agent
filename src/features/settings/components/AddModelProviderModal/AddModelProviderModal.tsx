import { Form, Input, Modal } from 'antd'
import { useEffect } from 'react'
import {
  queryNewCustomProviderId,
  type CustomModelProvider
} from '@shared/types'
import { BASE_URL_RULES, OPTIONAL_URL_RULES } from '../SettingsPage/settingsValidation'
import styles from './AddModelProviderModal.module.css'

export interface AddModelProviderFormValues {
  label: string
  defaultBaseUrl: string
  /** 模型列表完整获取链接；留空则使用 Base URL + /models */
  modelsUrl: string
  defaultModel: string
}

export interface AddModelProviderModalProps {
  open: boolean
  onCancel: () => void
  /** 提交后由父级登记供应商（不自动启用），并写入 customProviders */
  onSubmit: (provider: CustomModelProvider) => void | Promise<void>
}

const DEFAULT_FORM: AddModelProviderFormValues = {
  label: '',
  defaultBaseUrl: 'https://api.openai.com/v1',
  modelsUrl: '',
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
    const modelsUrl = values.modelsUrl.trim()
    await onSubmit({
      id: queryNewCustomProviderId(),
      label: values.label.trim(),
      // 为什么：自定义供应商密钥标签统一为 API Key，不再让用户配置
      apiKeyLabel: 'API Key',
      defaultBaseUrl: values.defaultBaseUrl.trim(),
      defaultModel: values.defaultModel.trim() || 'gpt-4o-mini',
      ...(modelsUrl ? { modelsUrl } : {})
    })
    form.resetFields()
  }

  return (
    <Modal
      title="添加模型供应商"
      open={open}
      onCancel={onCancel}
      onOk={() => void handleOk()}
      okText="添加"
      cancelText="取消"
      destroyOnClose
      className={styles.modal}
      width={480}
    >
      <p className={styles.lead}>
        自定义供应商按 OpenAI 兼容协议接入，添加后可在供应商下拉中选用，不会自动切换当前供应商。
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
          label="默认 Base URL"
          name="defaultBaseUrl"
          rules={BASE_URL_RULES}
          extra="须包含协议，切换到此供应商时会预填。"
        >
          <Input placeholder="https://api.example.com/v1" />
        </Form.Item>
        <Form.Item
          label="模型列表获取链接"
          name="modelsUrl"
          rules={OPTIONAL_URL_RULES}
          extra="留空则使用 Base URL + /models；部分网关需填写完整列表地址。"
        >
          <Input placeholder="https://api.example.com/v1/models" />
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
