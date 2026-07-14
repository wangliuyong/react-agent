import type { WorkflowCanvasEdge, WorkflowConditionWhen } from '@shared/types'

export interface WorkflowEdgeEditValue {
  label?: string
  when?: WorkflowConditionWhen
  isDefault?: boolean
}

interface WorkflowEdgeEditModalProps {
  open: boolean
  edge: WorkflowCanvasEdge | null
  isFullscreen?: boolean
  fullscreenContainer?: HTMLElement | null
  onCancel: () => void
  onOk: (patch: WorkflowEdgeEditValue) => void
}

interface FormValues {
  label?: string
  isDefault?: boolean
  useAdvancedExpression?: boolean
  expression?: string
  contextKey?: string
  op?: 'eq' | 'neq' | 'truthy' | 'falsy'
  value?: string
}

/** 双击连线：编辑标签、条件表达式或默认（else）边 */
export function WorkflowEdgeEditModal({
  open,
  edge,
  isFullscreen = false,
  fullscreenContainer = null,
  onCancel,
  onOk
}: WorkflowEdgeEditModalProps): React.ReactElement {
  const [form] = Form.useForm<FormValues>()
  const isDefault = Form.useWatch('isDefault', form)
  const useAdvanced = Form.useWatch('useAdvancedExpression', form)
  const op = Form.useWatch('op', form)

  useEffect(() => {
    if (!open || !edge) return
    const when = edge.when
    form.setFieldsValue({
      label: edge.label ?? '',
      isDefault: Boolean(edge.isDefault),
      useAdvancedExpression: Boolean(when?.expression?.trim()),
      expression: when?.expression ?? '',
      contextKey: when?.contextKey ?? '',
      op: when?.op ?? 'truthy',
      value: when?.value != null ? String(when.value) : ''
    })
  }, [open, edge, form])

  const handleOk = async (): Promise<void> => {
    try {
      const values = await form.validateFields()
      if (values.isDefault) {
        onOk({
          label: values.label?.trim() || '默认',
          isDefault: true,
          when: undefined
        })
        return
      }
      let when: WorkflowConditionWhen | undefined
      if (values.useAdvancedExpression) {
        const expression = (values.expression ?? '').trim()
        if (!expression) {
          message.error('请填写表达式，或勾选「默认边」')
          return
        }
        when = { expression }
      } else if ((values.contextKey ?? '').trim()) {
        when = {
          contextKey: values.contextKey!.trim(),
          op: values.op ?? 'truthy',
          value:
            values.op === 'eq' || values.op === 'neq'
              ? (values.value ?? '').trim()
              : undefined
        }
      } else {
        // 清除条件 → 无条件边（可参与并行）
        onOk({
          label: values.label?.trim() || undefined,
          isDefault: false,
          when: undefined
        })
        return
      }
      onOk({
        label: values.label?.trim() || undefined,
        isDefault: false,
        when
      })
    } catch {
      /* validateFields */
    }
  }

  return (
    <Modal
      title="编辑连线"
      open={open}
      onCancel={onCancel}
      onOk={() => void handleOk()}
      okText="保存"
      cancelText="取消"
      destroyOnHidden
      width={480}
      getContainer={
        isFullscreen && fullscreenContainer
          ? () => fullscreenContainer
          : undefined
      }
    >
      <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
        <Form.Item name="label" label="标签">
          <Input placeholder="边上显示的文字，可选" />
        </Form.Item>
        <Form.Item
          name="isDefault"
          label="默认边（else）"
          valuePropName="checked"
          tooltip="无其它条件命中时走这条；同一源最多一条"
        >
          <Switch />
        </Form.Item>

        {!isDefault && (
          <>
            <Form.Item
              name="useAdvancedExpression"
              label="高级表达式"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
            {useAdvanced ? (
              <Form.Item
                name="expression"
                label="表达式"
                extra='示例：context.status == "ok"；留空则清除条件'
              >
                <Input.TextArea rows={3} placeholder="context.ok == true" />
              </Form.Item>
            ) : (
              <>
                <Form.Item
                  name="contextKey"
                  label="Context 字段"
                  extra="留空则清除条件（无条件连线）"
                >
                  <Input placeholder="例如 ok / status" />
                </Form.Item>
                <Form.Item name="op" label="运算符" initialValue="truthy">
                  <Select
                    options={[
                      { value: 'truthy', label: '为真' },
                      { value: 'falsy', label: '为假' },
                      { value: 'eq', label: '等于' },
                      { value: 'neq', label: '不等于' }
                    ]}
                  />
                </Form.Item>
                {(op === 'eq' || op === 'neq') && (
                  <Form.Item name="value" label="比较值">
                    <Input />
                  </Form.Item>
                )}
              </>
            )}
          </>
        )}

        <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
          同一节点上：全部无条件多出线 = 并行；任一带条件/默认 = 条件分支（只走一路）。
        </Typography.Paragraph>
      </Form>
    </Modal>
  )
}
