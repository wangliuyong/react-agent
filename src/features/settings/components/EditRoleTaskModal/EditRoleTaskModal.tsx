import { RobotOutlined } from '@ant-design/icons'
import { Alert, Button, Form, Input, Modal, Select, Space, Switch } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import type { ModelConnection, ModelRoleKey } from '@shared/types'
import { queryIsChatPipelineRole } from '@shared/types'
import { queryToolLabel } from '@/features/chat/utils/agent-status'
import { queryAgentToolsCatalog } from '../../api'
import styles from './EditRoleTaskModal.module.css'

const { TextArea } = Input

export interface EditRoleTaskFormValues {
  connectionId?: string
  promptOverride: string
  customSystemPrompt?: string
  /** true = 注入全部已注册工具 */
  toolInjectAll: boolean
  toolNames: string[]
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
  /**
   * 当前生效的工具名单；null = 全量。
   * 仅聊天管线角色（general / researcher 等）展示与保存。
   */
  toolWhitelist?: string[] | null
  /** 内置默认名单，用于「恢复默认」；null = 默认全量 */
  defaultToolWhitelist?: string[] | null
  /** 用户是否已自定义过该角色工具注入 */
  toolWhitelistCustomized?: boolean
  /** 自定义角色：编辑主系统说明（仅自定义角色展示） */
  customSystemPrompt?: string
  connections: ModelConnection[]
  /** 自定义角色可删除；内置角色为 false */
  canDeleteRole?: boolean
  onCancel: () => void
  onSubmit: (payload: {
    connectionId?: string
    promptOverride: string
    /**
     * 仅聊天管线角色返回：
     * - undefined：媒体任务等不维护工具注入
     * - 'default'：清除覆盖，恢复内置
     * - null：全量工具
     * - string[]：显式白名单
     */
    toolWhitelist?: string[] | null | 'default'
    customSystemPrompt?: string
  }) => void
  onDelete?: () => void
}

function querySameToolList(a: string[] | null, b: string[] | null): boolean {
  if (a === null && b === null) return true
  if (a === null || b === null) return false
  if (a.length !== b.length) return false
  const sa = [...a].sort()
  const sb = [...b].sort()
  return sa.every((name, i) => name === sb[i])
}

/**
 * 维护角色 / 任务的模型连接、补充设定与工具注入。
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
  toolWhitelist = null,
  defaultToolWhitelist = null,
  toolWhitelistCustomized = false,
  customSystemPrompt,
  connections,
  canDeleteRole = false,
  onCancel,
  onSubmit,
  onDelete
}: EditRoleTaskModalProps): React.ReactElement {
  const [form] = Form.useForm<EditRoleTaskFormValues>()
  const [toolOptions, setToolOptions] = useState<{ value: string; label: string }[]>([])
  const [toolsLoading, setToolsLoading] = useState(false)

  const canEditTools = Boolean(role && queryIsChatPipelineRole(role))
  const toolInjectAll = Form.useWatch('toolInjectAll', form)
  const watchedToolNames = Form.useWatch('toolNames', form)

  useEffect(() => {
    if (!open || !role) return
    form.setFieldsValue({
      connectionId,
      promptOverride: promptOverride ?? '',
      customSystemPrompt: customSystemPrompt ?? '',
      toolInjectAll: canEditTools ? toolWhitelist === null : false,
      toolNames: canEditTools && Array.isArray(toolWhitelist) ? [...toolWhitelist] : []
    })
  }, [
    open,
    role,
    connectionId,
    promptOverride,
    customSystemPrompt,
    toolWhitelist,
    canEditTools,
    form
  ])

  useEffect(() => {
    if (!open || !canEditTools) return
    let cancelled = false
    setToolsLoading(true)
    void queryAgentToolsCatalog()
      .then((catalog) => {
        if (cancelled) return
        setToolOptions(
          catalog.tools.map((t) => ({
            value: t.name,
            label: `${queryToolLabel(t.name)}（${t.name}）`
          }))
        )
      })
      .catch(() => {
        if (!cancelled) setToolOptions([])
      })
      .finally(() => {
        if (!cancelled) setToolsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, canEditTools])

  const mergedToolOptions = useMemo(() => {
    const names = watchedToolNames ?? []
    const known = new Set(toolOptions.map((o) => o.value))
    const extras = names
      .filter((n) => n && !known.has(n))
      .map((n) => ({ value: n, label: n }))
    return extras.length ? [...toolOptions, ...extras] : toolOptions
  }, [toolOptions, watchedToolNames])

  const handleOk = async (): Promise<void> => {
    const values = await form.validateFields()
    let nextTools: string[] | null | 'default' | undefined
    if (canEditTools) {
      const resolved: string[] | null = values.toolInjectAll
        ? null
        : (values.toolNames ?? []).map((n) => String(n).trim()).filter(Boolean)
      // 与内置默认一致则清除覆盖，避免无意义的持久化差异
      nextTools = querySameToolList(resolved, defaultToolWhitelist) ? 'default' : resolved
    }
    onSubmit({
      connectionId: values.connectionId,
      promptOverride: values.promptOverride.trim(),
      toolWhitelist: nextTools,
      customSystemPrompt: canDeleteRole ? String(values.customSystemPrompt ?? '').trim() : undefined
    })
  }

  const handleRestoreDefault = (): void => {
    if (!canEditTools) return
    form.setFieldsValue({
      toolInjectAll: defaultToolWhitelist === null,
      toolNames: Array.isArray(defaultToolWhitelist) ? [...defaultToolWhitelist] : []
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
      width={600}
      footer={(_, { OkBtn, CancelBtn }) => (
        <div className={styles.footer}>
          {canDeleteRole && onDelete ? (
            <Button danger type="text" onClick={onDelete}>
              删除角色
            </Button>
          ) : (
            <span />
          )}
          <Space>
            <CancelBtn />
            <OkBtn />
          </Space>
        </div>
      )}
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
            rows={4}
            placeholder={
              promptPlaceholder ??
              '追加角色语气、输出格式或业务偏好；留空则仅使用系统内置说明。'
            }
            maxLength={4000}
            showCount
          />
        </Form.Item>

        {canDeleteRole ? (
          <Form.Item
            label="角色系统说明"
            name="customSystemPrompt"
            rules={[{ required: true, message: '请填写角色系统说明' }]}
            extra="自定义角色的核心指令（Markdown），保存后写入角色定义。"
          >
            <TextArea className={styles.promptArea} rows={6} maxLength={8000} showCount />
          </Form.Item>
        ) : null}

        {canEditTools ? (
          <>
            <div className={styles.toolsHeader}>
              <span className={styles.toolsTitle}>工具注入</span>
              <Space size={8}>
                {toolWhitelistCustomized ? (
                  <span className={styles.customHint}>已自定义</span>
                ) : null}
                <Button type="link" size="small" onClick={handleRestoreDefault}>
                  恢复默认
                </Button>
              </Space>
            </div>
            <Alert
              type="info"
              showIcon
              className={styles.toolsAlert}
              message="仅影响聊天多角色管线。关闭「全量」且名单为空时，该角色将无法调用任何工具。"
            />
            <Form.Item
              label="注入全部已注册工具"
              name="toolInjectAll"
              valuePropName="checked"
              extra="开启后与 general 默认行为一致，忽略下方名单。"
            >
              <Switch />
            </Form.Item>
            <Form.Item
              label="工具白名单"
              name="toolNames"
              extra={
                toolInjectAll
                  ? '当前为全量注入，名单仅作参考；关闭上方开关后生效。'
                  : '勾选该角色可调用的工具；保存后随「保存连接」写入本机。'
              }
            >
              <Select
                mode="multiple"
                allowClear
                showSearch
                loading={toolsLoading}
                disabled={Boolean(toolInjectAll)}
                placeholder="选择工具"
                options={mergedToolOptions}
                optionFilterProp="label"
                maxTagCount="responsive"
              />
            </Form.Item>
          </>
        ) : null}
      </Form>
    </Modal>
  )
}
