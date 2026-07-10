import { useMemo } from 'react'
import {
  Alert,
  Button,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  Typography,
  Space,
  message
} from 'antd'
import { MODEL_OPTIONS } from '@shared/types'
import { useSettingsStore } from '../hooks/useSettingsStore'
import styles from './SettingsPage.module.css'

const { Title, Paragraph, Text } = Typography

export function SettingsPage(): React.ReactElement {
  const settings = useSettingsStore((s) => s.settings)
  const postSettings = useSettingsStore((s) => s.postSettings)

  /** 若用户曾保存自定义 model id，合并进选项避免 Select 显示异常 */
  const modelSelectOptions = useMemo(() => {
    const options = MODEL_OPTIONS.map((m) => ({
      value: m.value,
      label: m.description ? `${m.label} — ${m.description}` : m.label
    }))
    if (!MODEL_OPTIONS.some((m) => m.value === settings.model)) {
      options.unshift({ value: settings.model, label: settings.model })
    }
    return options
  }, [settings.model])

  return (
    <div className={styles.page}>
      <Title level={3}>设置</Title>
      <Paragraph type="secondary">
        API Key 仅保存在本机 userData，不会上传。默认对接阿里云百炼 OpenAI 兼容接口。
      </Paragraph>

      <Form
        layout="vertical"
        key={JSON.stringify(settings)}
        initialValues={settings}
        onFinish={async (values: typeof settings) => {
          await postSettings(values)
          message.success('已保存')
        }}
        style={{ maxWidth: 560 }}
      >
        <Form.Item
          label="DASHSCOPE API Key"
          name="apiKey"
          rules={[{ required: true, message: '请填写 API Key' }]}
        >
          <Input.Password placeholder="sk-..." />
        </Form.Item>
        <Form.Item label="Base URL" name="baseUrl">
          <Input placeholder="https://dashscope.aliyuncs.com/compatible-mode/v1" />
        </Form.Item>
        <Form.Item label="模型" name="model">
          <Select
            showSearch
            optionFilterProp="label"
            options={modelSelectOptions}
            placeholder="选择模型"
          />
        </Form.Item>
        <Form.Item label="最大工具轮次" name="maxTurns">
          <InputNumber min={5} max={100} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item label="完全访问" name="fullAccess" valuePropName="checked">
          <Switch />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">
            保存
          </Button>
        </Form.Item>
      </Form>

      <Alert
        type="info"
        showIcon
        style={{ marginTop: 24, maxWidth: 560 }}
        message="小红书登录态"
        description={
          <Space direction="vertical">
            <Text>
              浏览器 Profile 保存在本机。若登录异常，可清除后重新扫码。
            </Text>
            <Button
              danger
              onClick={async () => {
                await window.api.postBrowserClearProfile()
                message.success('已清除浏览器登录态')
              }}
            >
              清除小红书登录态
            </Button>
          </Space>
        }
      />
    </div>
  )
}
