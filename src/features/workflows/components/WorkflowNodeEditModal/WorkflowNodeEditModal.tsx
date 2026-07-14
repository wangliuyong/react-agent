import type {
  WorkflowAgentNode,
  WorkflowAwaitNode,
  WorkflowConditionCase,
  WorkflowConditionNode,
  WorkflowLeafNode,
  WorkflowNode,
  WorkflowParallelNode,
  WorkflowToolNode
} from '@shared/types'
import {
  createAgentNode,
  createAwaitNode,
  createConditionNode,
  createParallelNode,
  createToolNode,
  isLeafNode
} from '../../types'

/** 常用工具名快捷选项（亦可手输） */
const TOOL_NAME_OPTIONS = [
  { value: 'fetch_hot_topics', label: 'fetch_hot_topics' },
  { value: 'fetch_web_images', label: 'fetch_web_images' },
  { value: 'xhs_publish_note', label: 'xhs_publish_note' },
  { value: 'douyin_publish_note', label: 'douyin_publish_note' },
  { value: 'browser_navigate', label: 'browser_navigate' },
  { value: 'list_attachments', label: 'list_attachments' }
]

interface WorkflowNodeEditModalProps {
  open: boolean
  node: WorkflowNode | null
  /** 是否在创建并行组内的叶子（禁止再选 parallel） */
  leafOnly?: boolean
  /** 允许编辑/展示条件节点（画布） */
  allowCondition?: boolean
  isFullscreen?: boolean
  fullscreenContainer?: HTMLElement | null
  onCancel: () => void
  onOk: (node: WorkflowNode) => void
}

interface CaseFormRow {
  key: string
  label?: string
}

interface FormValues {
  type: WorkflowNode['type']
  title: string
  prompt?: string
  toolWhitelist?: string
  toolName?: string
  argsJson?: string
  reason?: string
  /** condition */
  mode?: 'expression' | 'agent'
  branchShape?: 'ifelse' | 'switch'
  contextKey?: string
  op?: 'eq' | 'neq' | 'truthy' | 'falsy'
  value?: string
  useAdvancedExpression?: boolean
  expression?: string
  defaultKey?: string
  cases?: CaseFormRow[]
}

function nodeToFormValues(node: WorkflowNode): FormValues {
  const base: FormValues = { type: node.type, title: node.title }
  if (node.type === 'agent') {
    return {
      ...base,
      prompt: node.prompt,
      toolWhitelist: node.toolWhitelist?.join(', ') ?? ''
    }
  }
  if (node.type === 'tool') {
    return {
      ...base,
      toolName: node.toolName,
      argsJson: JSON.stringify(node.argsTemplate ?? {}, null, 2)
    }
  }
  if (node.type === 'await_user') {
    return { ...base, reason: node.reason }
  }
  if (node.type === 'condition') {
    const keys = node.cases.map((c) => c.key)
    const isIfElse =
      keys.length === 2 && keys.includes('true') && keys.includes('false')
    return {
      ...base,
      mode: node.mode,
      branchShape: isIfElse ? 'ifelse' : 'switch',
      contextKey: node.when?.contextKey ?? '',
      op: node.when?.op ?? 'truthy',
      value: node.when?.value != null ? String(node.when.value) : '',
      useAdvancedExpression: Boolean(node.when?.expression?.trim()),
      expression: node.when?.expression ?? '',
      prompt: node.prompt ?? '',
      toolWhitelist: node.toolWhitelist?.join(', ') ?? '',
      defaultKey: node.defaultKey,
      cases: node.cases.map((c) => ({ key: c.key, label: c.label }))
    }
  }
  return base
}

/** 保留旧 case 的 nodes（画布编译权威），按 key 对齐 */
function mergeConditionCases(
  rows: CaseFormRow[],
  prev: WorkflowConditionNode | null
): WorkflowConditionCase[] {
  const prevByKey = new Map((prev?.cases ?? []).map((c) => [c.key, c.nodes]))
  const result: WorkflowConditionCase[] = []
  for (const r of rows) {
    const key = (r.key ?? '').trim()
    if (!key) continue
    const prevNodes = prevByKey.get(key)
    result.push({
      key,
      label: (r.label ?? '').trim() || undefined,
      nodes: prevNodes ? [...prevNodes] : []
    })
  }
  return result
}

function buildNodeFromValues(values: FormValues, prev: WorkflowNode | null): WorkflowNode {
  const title = values.title.trim() || '未命名步骤'
  const id = prev?.id ?? crypto.randomUUID()

  if (values.type === 'condition') {
    const prevCond = prev?.type === 'condition' ? prev : null
    let caseRows = values.cases ?? []
    if (values.branchShape === 'ifelse') {
      caseRows = [
        { key: 'true', label: caseRows.find((c) => c.key === 'true')?.label || '是' },
        { key: 'false', label: caseRows.find((c) => c.key === 'false')?.label || '否' }
      ]
    }
    if (!caseRows.length) {
      throw new Error('请至少配置一个分支')
    }
    const whitelist = (values.toolWhitelist ?? '')
      .split(/[,，\s]+/)
      .map((s) => s.trim())
      .filter(Boolean)
    const when =
      values.mode === 'expression'
        ? values.useAdvancedExpression
          ? { expression: (values.expression ?? '').trim() }
          : {
              contextKey: (values.contextKey ?? '').trim(),
              op: values.op ?? 'truthy',
              value:
                values.op === 'eq' || values.op === 'neq'
                  ? (values.value ?? '').trim()
                  : undefined
            }
        : undefined
    if (
      values.mode === 'expression' &&
      values.useAdvancedExpression &&
      !(values.expression ?? '').trim()
    ) {
      throw new Error('请填写高级表达式')
    }
    if (
      values.mode === 'expression' &&
      !values.useAdvancedExpression &&
      !(values.contextKey ?? '').trim()
    ) {
      throw new Error('请填写 context 字段名')
    }
    const node: WorkflowConditionNode = {
      id,
      type: 'condition',
      title,
      mode: values.mode === 'agent' ? 'agent' : 'expression',
      when,
      prompt: values.mode === 'agent' ? (values.prompt ?? '').trim() : undefined,
      toolWhitelist:
        values.mode === 'agent' && whitelist.length ? whitelist : undefined,
      cases: mergeConditionCases(caseRows, prevCond),
      defaultKey: (values.defaultKey ?? '').trim() || undefined
    }
    if (values.mode === 'agent' && !node.prompt) {
      throw new Error('请填写 Agent 选路提示词')
    }
    return node
  }

  if (values.type === 'agent') {
    const whitelist = (values.toolWhitelist ?? '')
      .split(/[,，\s]+/)
      .map((s) => s.trim())
      .filter(Boolean)
    const node: WorkflowAgentNode = {
      id,
      type: 'agent',
      title,
      prompt: (values.prompt ?? '').trim(),
      toolWhitelist: whitelist.length ? whitelist : undefined
    }
    return node
  }

  if (values.type === 'tool') {
    let argsTemplate: Record<string, unknown> = {}
    const raw = (values.argsJson ?? '').trim() || '{}'
    try {
      const parsed = JSON.parse(raw) as unknown
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        argsTemplate = parsed as Record<string, unknown>
      } else {
        throw new Error('参数必须是 JSON 对象')
      }
    } catch (e) {
      throw new Error(e instanceof Error ? e.message : '参数 JSON 无效')
    }
    const node: WorkflowToolNode = {
      id,
      type: 'tool',
      title,
      toolName: (values.toolName ?? '').trim(),
      argsTemplate
    }
    if (!node.toolName) throw new Error('请填写工具名')
    return node
  }

  if (values.type === 'await_user') {
    const node: WorkflowAwaitNode = {
      id,
      type: 'await_user',
      title,
      reason: (values.reason ?? '').trim() || '请确认后继续'
    }
    return node
  }

  const prevChildren =
    prev && prev.type === 'parallel' ? prev.children : ([] as WorkflowLeafNode[])
  const node: WorkflowParallelNode = {
    id,
    type: 'parallel',
    title,
    children: prevChildren
  }
  return node
}

/** 节点编辑弹窗：按类型切换字段；条件节点只改元数据，支路步骤在画布编排 */
export function WorkflowNodeEditModal({
  open,
  node,
  leafOnly = false,
  allowCondition = false,
  isFullscreen = false,
  fullscreenContainer = null,
  onCancel,
  onOk
}: WorkflowNodeEditModalProps): React.ReactElement {
  const [form] = Form.useForm<FormValues>()
  const type = Form.useWatch('type', form) as WorkflowNode['type'] | undefined
  const mode = Form.useWatch('mode', form)
  const branchShape = Form.useWatch('branchShape', form)
  const useAdvanced = Form.useWatch('useAdvancedExpression', form)
  const op = Form.useWatch('op', form)
  const isEditingCondition = node?.type === 'condition'

  useEffect(() => {
    if (!open) return
    if (node) {
      form.setFieldsValue(nodeToFormValues(node))
    } else {
      form.setFieldsValue(nodeToFormValues(createAgentNode()))
    }
  }, [open, node, form])

  const typeOptions = useMemo(() => {
    const all: { value: WorkflowNode['type']; label: string }[] = [
      { value: 'agent', label: 'Agent 步骤' },
      { value: 'tool', label: '工具步骤' },
      { value: 'await_user', label: '等待确认' },
      { value: 'parallel', label: '并行组' },
      { value: 'condition', label: '条件分支' }
    ]
    let opts = all
    if (leafOnly) opts = opts.filter((o) => o.value !== 'parallel')
    if (!allowCondition) opts = opts.filter((o) => o.value !== 'condition')
    return opts
  }, [leafOnly, allowCondition])

  const handleOk = async (): Promise<void> => {
    try {
      const values = await form.validateFields()
      if (isEditingCondition) {
        values.type = 'condition'
      }
      const basePrev =
        node ??
        (values.type === 'tool'
          ? createToolNode()
          : values.type === 'await_user'
            ? createAwaitNode()
            : values.type === 'parallel'
              ? createParallelNode()
              : values.type === 'condition'
                ? createConditionNode()
                : createAgentNode())
      const next = buildNodeFromValues(values, node ?? basePrev)
      if (leafOnly && !isLeafNode(next) && next.type !== 'condition') {
        message.error('此处只能添加叶子步骤或条件分支')
        return
      }
      onOk(next)
    } catch (err) {
      if (err instanceof Error && err.message) {
        message.error(err.message)
      }
    }
  }

  return (
    <Modal
      title={
        isEditingCondition ? '编辑条件分支' : node ? '编辑步骤' : '添加步骤'
      }
      open={open}
      onCancel={onCancel}
      onOk={() => void handleOk()}
      okText="保存"
      cancelText="取消"
      destroyOnHidden
      width={560}
      getContainer={
        isFullscreen && fullscreenContainer
          ? () => fullscreenContainer
          : undefined
      }
    >
      <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
        {!isEditingCondition && (
          <Form.Item name="type" label="类型" rules={[{ required: true }]}>
            <Select options={typeOptions} />
          </Form.Item>
        )}
        {isEditingCondition && <Form.Item name="type" hidden><Input /></Form.Item>}

        <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
          <Input placeholder="步骤名称" />
        </Form.Item>

        {(type === 'condition' || isEditingCondition) && (
          <>
            <Form.Item name="mode" label="判定模式" initialValue="expression">
              <Radio.Group
                options={[
                  { value: 'expression', label: '表达式' },
                  { value: 'agent', label: 'Agent 选路' }
                ]}
              />
            </Form.Item>
            <Form.Item name="branchShape" label="分支形态" initialValue="ifelse">
              <Radio.Group
                options={[
                  { value: 'ifelse', label: 'If / Else' },
                  { value: 'switch', label: 'Switch 多路' }
                ]}
              />
            </Form.Item>

            {mode !== 'agent' && (
              <>
                <Form.Item
                  name="useAdvancedExpression"
                  label="高级表达式"
                  valuePropName="checked"
                  tooltip="开启后用短表达式覆盖表单条件"
                >
                  <Switch />
                </Form.Item>
                {useAdvanced ? (
                  <Form.Item
                    name="expression"
                    label="表达式"
                    extra='示例：context.status == "ok"（仅允许 context.字段、字面量与比较运算）'
                  >
                    <Input.TextArea rows={3} placeholder='context.ok == true' />
                  </Form.Item>
                ) : (
                  <>
                    <Form.Item name="contextKey" label="Context 字段">
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
                        <Input placeholder="期望值" />
                      </Form.Item>
                    )}
                  </>
                )}
              </>
            )}

            {mode === 'agent' && (
              <>
                <Form.Item name="prompt" label="选路提示词">
                  <Input.TextArea
                    rows={3}
                    placeholder="说明如何根据上下文选择分支 key"
                  />
                </Form.Item>
                <Form.Item
                  name="toolWhitelist"
                  label="工具白名单"
                  tooltip="选路一般无需工具；留空则禁止工具调用"
                >
                  <Input placeholder="通常留空" />
                </Form.Item>
              </>
            )}

            {branchShape === 'switch' && (
              <Form.List name="cases">
                {(fields, { add, remove }) => (
                  <div>
                    <div style={{ marginBottom: 8 }}>分支列表</div>
                    {fields.map((field) => (
                      <Space key={field.key} align="baseline" style={{ display: 'flex' }}>
                        <Form.Item
                          {...field}
                          name={[field.name, 'key']}
                          rules={[{ required: true, message: 'key' }]}
                        >
                          <Input placeholder="key" style={{ width: 120 }} />
                        </Form.Item>
                        <Form.Item {...field} name={[field.name, 'label']}>
                          <Input placeholder="标签" style={{ width: 120 }} />
                        </Form.Item>
                        <Button type="link" danger onClick={() => remove(field.name)}>
                          删除
                        </Button>
                      </Space>
                    ))}
                    <Button type="dashed" onClick={() => add({ key: '', label: '' })} block>
                      添加分支
                    </Button>
                  </div>
                )}
              </Form.List>
            )}

            <Form.Item name="defaultKey" label="默认支路 key" tooltip="无匹配时走该 key">
              <Input placeholder="可选" />
            </Form.Item>

            <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
              各支路步骤请在画布上从条件出口连线编排，并汇合到同一后续节点。带标签出线 =
              条件分支；无标签多出线 = 并行。
            </Typography.Paragraph>
          </>
        )}

        {type === 'agent' && (
          <>
            <Form.Item
              name="prompt"
              label="目标 / 提示词"
              rules={[{ required: true, message: '请填写步骤目标' }]}
            >
              <Input.TextArea rows={4} placeholder="本步骤希望 Agent 完成的事" />
            </Form.Item>
            <Form.Item
              name="toolWhitelist"
              label="工具白名单"
              tooltip="逗号分隔；留空表示可用全部工具"
            >
              <Input placeholder="例如 fetch_web_images, xhs_publish_note" />
            </Form.Item>
          </>
        )}

        {type === 'tool' && (
          <>
            <Form.Item
              name="toolName"
              label="工具名"
              rules={[{ required: true, message: '请填写工具名' }]}
              extra={`常用：${TOOL_NAME_OPTIONS.map((o) => o.value).join('、')}`}
            >
              <Input placeholder="xhs_publish_note" />
            </Form.Item>
            <Form.Item
              name="argsJson"
              label="参数 JSON"
              tooltip="支持 {{contextKey}} 插值，引用上游上下文"
              initialValue="{}"
            >
              <Input.TextArea rows={5} placeholder='{"title":"{{title}}"}' />
            </Form.Item>
          </>
        )}

        {type === 'await_user' && (
          <Form.Item name="reason" label="确认说明">
            <Input.TextArea rows={3} placeholder="展示给用户的暂停原因" />
          </Form.Item>
        )}

        {type === 'parallel' && (
          <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
            保存后可在并行组内添加子步骤（仅叶子）。组内全是「工具」时并发执行；含 Agent/确认时串行，避免同会话
            ReAct 交错。
          </Typography.Paragraph>
        )}
      </Form>
    </Modal>
  )
}
