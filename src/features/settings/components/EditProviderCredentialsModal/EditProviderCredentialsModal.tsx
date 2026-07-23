import { Form, Input, Modal, Select } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import {
  queryModelOptionDisplayLabel,
  queryModelOptions,
  queryProviderOption,
  type CustomModelProvider,
  type ModelProvider
} from '@shared/types'
import { useProviderModels } from '../../hooks/useProviderModels'
import { queryProviderModelsStatusHint } from '../../hooks/providerModelsShared'
import { BASE_URL_RULES, MODEL_RULES } from '../SettingsPage/settingsValidation'
import type { ProviderFormDraft } from '../SettingsPage/settingsFormSync'
import styles from './EditProviderCredentialsModal.module.css'

export interface EditProviderCredentialsFormValues {
  apiKey: string
  baseUrl: string
  model: string
}

export interface EditProviderCredentialsModalProps {
  open: boolean
  provider: ModelProvider | null
  providerLabel: string
  initialValues: ProviderFormDraft
  customProviders: CustomModelProvider[]
  onCancel: () => void
  onSubmit: (values: ProviderFormDraft) => void
}

/**
 * 维护单个模型供应商的 API Key、Base URL 与默认模型。
 * 卡片仅展示摘要，具体编辑在此弹窗完成。
 */
export function EditProviderCredentialsModal({
  open,
  provider,
  providerLabel,
  initialValues,
  customProviders,
  onCancel,
  onSubmit
}: EditProviderCredentialsModalProps): React.ReactElement {
  const [form] = Form.useForm<EditProviderCredentialsFormValues>()
  const [modelsRefreshToken, setModelsRefreshToken] = useState(0)
  const watchedApiKey = Form.useWatch('apiKey', form)
  const watchedBaseUrl = Form.useWatch('baseUrl', form)

  const providerOption = provider
    ? queryProviderOption(provider, customProviders)
    : queryProviderOption('dashscope', customProviders)

  const draftApiKey = String(watchedApiKey ?? '').trim()
  const draftBaseUrl =
    String(watchedBaseUrl ?? '').trim() || providerOption.defaultBaseUrl

  const { remoteModels, loading: modelsLoading, error: modelsError } = useProviderModels({
    enabled: open && Boolean(provider),
    provider: provider ?? 'dashscope',
    apiKey: draftApiKey,
    baseUrl: draftBaseUrl,
    customProviders,
    autoFetch: false,
    refreshToken: modelsRefreshToken
  })

  useEffect(() => {
    if (!open || !provider) return
    form.setFieldsValue({
      apiKey: initialValues.apiKey,
      baseUrl: initialValues.baseUrl,
      model: initialValues.model
    })
  }, [open, provider, initialValues, form])

  const modelSelectOptions = useMemo(() => {
    if (!provider) return []
    const fromApi = remoteModels != null
    const providerModels = fromApi ? remoteModels : queryModelOptions(provider)
    return providerModels.map((m) => ({
      value: m.value,
      label: queryModelOptionDisplayLabel(m)
    }))
  }, [provider, remoteModels])

  const modelListExtra = queryProviderModelsStatusHint({
    apiKey: draftApiKey,
    loading: modelsLoading,
    remoteCount: remoteModels?.length ?? null,
    error: modelsError
  })

  const handleOk = async (): Promise<void> => {
    const values = await form.validateFields()
    onSubmit({
      apiKey: values.apiKey,
      baseUrl: values.baseUrl.trim(),
      model: values.model
    })
  }

  return (
    <Modal
      title={`编辑供应商 · ${providerLabel}`}
      open={open}
      onCancel={onCancel}
      onOk={() => void handleOk()}
      okText="确定"
      cancelText="取消"
      destroyOnHidden
      className={styles.modal}
      width={520}
    >
      <span className={styles.providerBadge}>
        <ApiOutlined />
        {providerLabel}
      </span>
      <p className={styles.lead}>
        密钥仅写入本机 Electron userData，不参与任何遥测或同步。
      </p>
      <Form form={form} layout="vertical" className={styles.form}>
        <Form.Item
          label="API Key"
          name="apiKey"
          rules={[{ required: true, message: '请填写 API Key' }]}
        >
          <Input.Password prefix={<ApiOutlined />} placeholder="sk-..." />
        </Form.Item>
        <Form.Item
          label="Base URL"
          name="baseUrl"
          rules={BASE_URL_RULES}
          extra="请输入包含协议的完整服务地址。"
        >
          <Input
            prefix={<GlobalOutlined />}
            placeholder={providerOption.defaultBaseUrl}
          />
        </Form.Item>
        <Form.Item
          label={
            <span className={styles.modelLabelRow}>
              默认模型
              <Button
                type="link"
                size="small"
                icon={<ReloadOutlined />}
                disabled={!draftApiKey || modelsLoading}
                loading={modelsLoading}
                onClick={() => setModelsRefreshToken((n) => n + 1)}
              >
                从平台刷新
              </Button>
            </span>
          }
          name="model"
          rules={MODEL_RULES}
          extra={modelListExtra}
        >
          <Select
            showSearch
            optionFilterProp="label"
            options={modelSelectOptions}
            placeholder={draftApiKey ? '从平台选择模型' : '先填写 API Key'}
            loading={modelsLoading}
            notFoundContent={
              modelsLoading ? '加载中…' : draftApiKey ? '暂无模型' : '请先填写 API Key'
            }
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}
