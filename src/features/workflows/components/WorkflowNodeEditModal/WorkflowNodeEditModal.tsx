import type {
  WorkflowAgentNode,
  WorkflowAwaitNode,
  WorkflowLeafNode,
  WorkflowNode,
  WorkflowParallelNode,
  WorkflowToolNode
} from '@shared/types'
import {
  createAgentNode,
  createAwaitNode,
  createParallelNode,
  createToolNode,
  isLeafNode
} from '../../types'

/** 常用工具名快捷选项（亦可手输） */
const TOOL_NAME_OPTIONS = [
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
  onCancel: () => void
  onOk: (node: WorkflowNode) => void
}

interface FormValues {
  type: WorkflowNode['type']
  title: string
  prompt?: string
  toolWhitelist?: string
  toolName?: string
  argsJson?: string
  reason?: string
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
  return base
}

function buildNodeFromValues(values: FormValues, prev: WorkflowNode | null): WorkflowNode {
  const title = values.title.trim() || '未命名步骤'
  const id = prev?.id ?? crypto.randomUUID()

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

/** 节点编辑弹窗：按类型切换字段；展示组件，校验失败用 message */
export function WorkflowNodeEditModal({
  open,
  node,
  leafOnly = false,
  onCancel,
  onOk
}: WorkflowNodeEditModalProps): React.ReactElement {
  const [form] = Form.useForm<FormValues>()
  const type = Form.useWatch('type', form) as WorkflowNode['type'] | undefined

  useEffect(() => {
    if (!open) return
    if (node) {
      form.setFieldsValue(nodeToFormValues(node))
    } else {
      const draft = leafOnly ? createAgentNode() : createAgentNode()
      form.setFieldsValue(nodeToFormValues(draft))
    }
  }, [open, node, leafOnly, form])

  const typeOptions = useMemo(() => {
    const all: { value: WorkflowNode['type']; label: string }[] = [
      { value: 'agent', label: 'Agent 步骤' },
      { value: 'tool', label: '工具步骤' },
      { value: 'await_user', label: '等待确认' },
      { value: 'parallel', label: '并行组' }
    ]
    return leafOnly ? all.filter((o) => o.value !== 'parallel') : all
  }, [leafOnly])

  const handleOk = async (): Promise<void> => {
    try {
      const values = await form.validateFields()
      // 切换类型时保留 id，避免列表抖动
      const basePrev =
        node ??
        (values.type === 'tool'
          ? createToolNode()
          : values.type === 'await_user'
            ? createAwaitNode()
            : values.type === 'parallel'
              ? createParallelNode()
              : createAgentNode())
      const next = buildNodeFromValues(values, node ?? basePrev)
      if (leafOnly && !isLeafNode(next)) {
        message.error('并行组内只能添加叶子步骤')
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
      title={node ? '编辑步骤' : '添加步骤'}
      open={open}
      onCancel={onCancel}
      onOk={() => void handleOk()}
      okText="保存"
      cancelText="取消"
      destroyOnHidden
      width={560}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
        <Form.Item name="type" label="类型" rules={[{ required: true }]}>
          <Select options={typeOptions} />
        </Form.Item>
        <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
          <Input placeholder="步骤名称" />
        </Form.Item>

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
