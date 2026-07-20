import { Form, Input, Modal, Select } from 'antd'
import { useEffect, useMemo } from 'react'
import {
  queryAllProviderOptions,
  queryModelOptionDisplayLabel,
  queryModelOptions,
  queryProviderCredentialsFromSettings,
  type AppSettings,
  type ModelConnection,
  type ModelOption,
  type ModelProvider
} from '@shared/types'
import { useConnectionProviderModels } from '../../hooks/useConnectionProviderModels'
import { CAPABILITY_OPTIONS } from '../ModelConnectionsPanel/connectionPanelShared'
import styles from './EditModelConnectionModal.module.css'

const { Text } = Typography

export interface EditModelConnectionFormValues {
  label: string
  provider: ModelProvider
  model: string
  capabilities: import('@shared/types').ModelCapability[]
}

export interface EditModelConnectionModalProps {
  open: boolean
  /** 编辑目标；新增时由父级传入带新 id 的草稿 */
  connection: ModelConnection | null
  settings: AppSettings
  onCancel: () => void
  /** 确认后将完整连接对象回传父级 */
  onSubmit: (connection: ModelConnection) => void
}

function querySelectOptions(
  models: ModelOption[],
  currentModel: string,
  provider: ModelProvider
): { value: string; label: string }[] {
  const options = models.map((m) => ({
    value: m.value,
    label: queryModelOptionDisplayLabel(m)
  }))
  if (currentModel && !models.some((m) => m.value === currentModel)) {
    options.unshift({
      value: currentModel,
      label: queryModelOptionDisplayLabel({
        provider,
        value: currentModel,
        label: currentModel
      })
    })
  }
  return options
}

/**
 * 编辑单条模型连接：供应商、模型与能力标签。
 * 卡片仅展示摘要，具体维护在此弹窗完成。
 */
export function EditModelConnectionModal({
  open,
  connection,
  settings,
  onCancel,
  onSubmit
}: EditModelConnectionModalProps): React.ReactElement {
  const [form] = Form.useForm<EditModelConnectionFormValues>()
  const watchedProvider = Form.useWatch('provider', form)
  const watchedModel = Form.useWatch('model', form)

  /** 弹窗内临时连接，用于拉取平台模型列表 */
  const draftConnection = useMemo((): ModelConnection | null => {
    if (!connection) return null
    const provider = (watchedProvider ?? connection.provider) as ModelProvider
    const creds = queryProviderCredentialsFromSettings(settings, provider)
    return {
      ...connection,
      provider,
      model: String(watchedModel ?? connection.model),
      apiKey: connection.provider === provider ? connection.apiKey : creds.apiKey,
      baseUrl: connection.provider === provider ? connection.baseUrl : creds.baseUrl
    }
  }, [connection, settings, watchedModel, watchedProvider])

  const draftList = useMemo(
    () => (draftConnection ? [draftConnection] : []),
    [draftConnection]
  )

  const { queryRemoteModels, queryIsLoading, queryModelHint } = useConnectionProviderModels(
    draftList,
    open && Boolean(draftConnection),
    settings.customProviders ?? []
  )

  const providerOptions = useMemo(
    () =>
      queryAllProviderOptions(settings.customProviders ?? []).map((option) => ({
        value: option.value,
        label: option.label
      })),
    [settings.customProviders]
  )

  useEffect(() => {
    if (!open || !connection) return
    form.setFieldsValue({
      label: connection.label,
      provider: connection.provider,
      model: connection.model,
      capabilities: connection.capabilities
    })
  }, [open, connection, form])

  const handleOk = async (): Promise<void> => {
    if (!connection) return
    const values = await form.validateFields()
    const provider = values.provider
    const creds = queryProviderCredentialsFromSettings(settings, provider)
    onSubmit({
      ...connection,
      label: values.label.trim() || connection.label,
      provider,
      model: values.model,
      capabilities: values.capabilities,
      apiKey: connection.provider === provider ? connection.apiKey : creds.apiKey,
      baseUrl: connection.provider === provider ? connection.baseUrl : creds.baseUrl
    })
  }

  const remote = draftConnection ? queryRemoteModels(draftConnection) : undefined
  const modelOptions = draftConnection
    ? querySelectOptions(
        Array.isArray(remote) ? remote : queryModelOptions(draftConnection.provider),
        draftConnection.model,
        draftConnection.provider
      )
    : []
  const modelsLoading = draftConnection ? queryIsLoading(draftConnection) : false
  const modelHint = draftConnection ? queryModelHint(draftConnection) : null

  return (
    <Modal
      title={connection ? `编辑连接 · ${connection.label}` : '编辑连接'}
      open={open}
      onCancel={onCancel}
      onOk={() => void handleOk()}
      okText="保存"
      cancelText="取消"
      destroyOnClose
      className={styles.modal}
      width={520}
    >
      <p className={styles.lead}>
        连接凭证继承自「模型与 API」中对应供应商的配置；此处维护名称、模型与能力标签。
      </p>
      <Form form={form} layout="vertical" className={styles.form}>
        <Form.Item
          label="连接名称"
          name="label"
          rules={[{ required: true, message: '请填写连接名称' }]}
        >
          <Input placeholder="如：百炼 Qwen Plus" maxLength={48} />
        </Form.Item>
        <Form.Item
          label="供应商"
          name="provider"
          rules={[{ required: true, message: '请选择供应商' }]}
        >
          <Select
            options={providerOptions}
            onChange={(provider: ModelProvider) => {
              const creds = queryProviderCredentialsFromSettings(settings, provider)
              form.setFieldValue('model', creds.model)
            }}
          />
        </Form.Item>
        <Form.Item
          label="模型"
          name="model"
          rules={[{ required: true, message: '请选择或填写模型' }]}
        >
          <Select
            showSearch
            optionFilterProp="label"
            options={modelOptions}
            loading={modelsLoading}
            placeholder={
              draftConnection?.apiKey.trim()
                ? '从平台选择模型'
                : '请先在「模型与 API」中配置 API Key'
            }
          />
          {modelHint ? (
            <Text type="secondary" className={styles.modelHint}>
              {modelHint}
            </Text>
          ) : null}
        </Form.Item>
        <Form.Item label="能力标签" name="capabilities">
          <Select mode="multiple" options={CAPABILITY_OPTIONS} />
        </Form.Item>
      </Form>
    </Modal>
  )
}
