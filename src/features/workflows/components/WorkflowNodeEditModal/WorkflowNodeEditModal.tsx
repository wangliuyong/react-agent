import type {
  WorkflowAgentNode,
  WorkflowAwaitNode,
  WorkflowConditionCase,
  WorkflowConditionNode,
  WorkflowInputKind,
  WorkflowInputNode,
  WorkflowLeafNode,
  WorkflowNode,
  WorkflowNotifyNode,
  WorkflowOutputFormat,
  WorkflowOutputNode,
  WorkflowParallelNode,
  WorkflowToastLevel,
  WorkflowToastNode,
  WorkflowToolNode
} from '@shared/types'
import type { FeishuNotifyMsgType } from '@shared/publish-channels'
import { queryFeishuMsgType } from '@shared/publish-channels'
import {
  queryIoAlignmentIssues,
  parseContextKeyList,
  formatContextKeyList
} from '@shared/workflow-node-io'
import { useChannelsStore, queryEnabledNotifyChannelsFromStore } from '@/features/channels'
import { postSelectDirectory } from '../../api'
import {
  createAgentNode,
  createAwaitNode,
  createConditionNode,
  createInputNode,
  createNotifyNode,
  createOutputNode,
  createParallelNode,
  createToastNode,
  createToolNode,
  isLeafNode
} from '../../types'

/** 已注册工具下拉选项（与 electron/main/agent/tools 对齐） */
const TOOL_NAME_OPTIONS: { value: string; label: string }[] = [
  { value: 'use_skill', label: 'use_skill（加载技能）' },
  { value: 'switch_model', label: 'switch_model（切换模型）' },
  { value: 'list_attachments', label: 'list_attachments（查看附件）' },
  { value: 'read_file', label: 'read_file（读取文件）' },
  { value: 'write_file', label: 'write_file（写入文件）' },
  { value: 'update_task_list', label: 'update_task_list（更新任务）' },
  { value: 'generate_image', label: 'generate_image（生成图片）' },
  { value: 'fetch_web_images', label: 'fetch_web_images（抓取网页配图）' },
  { value: 'fetch_hot_topics', label: 'fetch_hot_topics（获取热点）' },
  { value: 'query_ashare_kline', label: 'query_ashare_kline（A股K线）' },
  { value: 'query_ashare_realtime_analysis', label: 'query_ashare_realtime_analysis（实时K线+分析）' },
  { value: 'query_weather', label: 'query_weather（查询天气）' },
  { value: 'query_web_data', label: 'query_web_data（获取网页数据）' },
  { value: 'generate_script', label: 'generate_script（生成剧本）' },
  { value: 'generate_storyboard', label: 'generate_storyboard（生成分镜）' },
  { value: 'generate_scene_assets', label: 'generate_scene_assets（生成场景素材）' },
  { value: 'compose_video', label: 'compose_video（合成视频）' },
  { value: 'browser_navigate', label: 'browser_navigate（打开网页）' },
  { value: 'browser_snapshot', label: 'browser_snapshot（查看页面结构）' },
  { value: 'browser_click', label: 'browser_click（点击页面）' },
  { value: 'browser_type', label: 'browser_type（输入文本）' },
  { value: 'browser_upload', label: 'browser_upload（上传文件）' },
  { value: 'browser_wait', label: 'browser_wait（等待页面）' },
  { value: 'xhs_publish_note', label: 'xhs_publish_note（发布小红书）' },
  { value: 'douyin_publish_note', label: 'douyin_publish_note（发布抖音）' },
  { value: 'notify_message', label: 'notify_message（渠道通知）' }
]

/** 将已选但未在选项中的工具名合并进下拉，避免历史数据丢失 */
function queryToolSelectOptions(selected?: string | string[]): { value: string; label: string }[] {
  const values = Array.isArray(selected) ? selected : selected ? [selected] : []
  const known = new Set(TOOL_NAME_OPTIONS.map((o) => o.value))
  const extras = values
    .map((v) => v.trim())
    .filter(Boolean)
    .filter((v) => !known.has(v))
    .map((v) => ({ value: v, label: v }))
  return extras.length ? [...TOOL_NAME_OPTIONS, ...extras] : TOOL_NAME_OPTIONS
}

interface WorkflowNodeEditModalProps {
  open: boolean
  node: WorkflowNode | null
  /** 上游节点声明的输出键，用于输入/输出对齐提示 */
  upstreamOutputKeys?: string[]
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
  /** Agent / 条件选路：可选工具名列表 */
  toolWhitelist?: string[]
  toolName?: string
  argsJson?: string
  reason?: string
  inputKeys?: string
  outputKeys?: string
  /** input 节点 */
  inputKinds?: WorkflowInputKind[]
  inputPrompt?: string
  /** output 节点 */
  outputDir?: string
  outputFormat?: WorkflowOutputFormat
  fileNameTemplate?: string
  /** notify */
  channelId?: string
  titleTemplate?: string
  contentTemplate?: string
  msgType?: FeishuNotifyMsgType
  imageKey?: string
  shareChatId?: string
  failSoft?: boolean
  /** toast */
  level?: WorkflowToastLevel
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

function formatKeysForForm(keys?: string[]): string {
  return keys?.join(', ') ?? ''
}

function nodeToFormValues(node: WorkflowNode): FormValues {
  const base: FormValues = {
    type: node.type,
    title: node.title,
    inputKeys: formatKeysForForm('inputKeys' in node ? node.inputKeys : undefined),
    outputKeys: formatKeysForForm('outputKeys' in node ? node.outputKeys : undefined)
  }
  if (node.type === 'agent') {
    return {
      ...base,
      prompt: node.prompt,
      toolWhitelist: node.toolWhitelist ? [...node.toolWhitelist] : []
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
    return {
      ...base,
      reason: node.reason
    }
  }
  if (node.type === 'input') {
    return {
      ...base,
      inputPrompt: node.prompt,
      inputKinds: node.inputKinds?.length ? [...node.inputKinds] : ['text']
    }
  }
  if (node.type === 'output') {
    return {
      ...base,
      outputDir: node.outputDir,
      outputFormat: node.outputFormat,
      fileNameTemplate: node.fileNameTemplate ?? 'output',
      contentTemplate: node.contentTemplate
    }
  }
  if (node.type === 'notify') {
    return {
      ...base,
      channelId: node.channelId,
      titleTemplate: node.titleTemplate ?? '',
      contentTemplate: node.contentTemplate,
      msgType: queryFeishuMsgType({
        msgType: node.msgType,
        richText: node.richText,
        channelId: node.channelId
      }),
      imageKey: node.imageKey ?? '',
      shareChatId: node.shareChatId ?? '',
      failSoft: node.failSoft !== false
    }
  }
  if (node.type === 'toast') {
    return {
      ...base,
      level: node.level,
      contentTemplate: node.contentTemplate
    }
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
      toolWhitelist: node.toolWhitelist ? [...node.toolWhitelist] : [],
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
  const inputKeys = parseContextKeyList(values.inputKeys)
  const outputKeys = parseContextKeyList(values.outputKeys)
  const withIo = <T extends WorkflowLeafNode>(node: T): T => ({
    ...node,
    ...(inputKeys.length ? { inputKeys } : {}),
    ...(outputKeys.length ? { outputKeys } : {})
  })

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
    const whitelist = (values.toolWhitelist ?? [])
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
    const whitelist = (values.toolWhitelist ?? [])
      .map((s) => s.trim())
      .filter(Boolean)
    const node: WorkflowAgentNode = withIo({
      id,
      type: 'agent',
      title,
      prompt: (values.prompt ?? '').trim(),
      toolWhitelist: whitelist.length ? whitelist : undefined
    })
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
    const node: WorkflowToolNode = withIo({
      id,
      type: 'tool',
      title,
      toolName: (values.toolName ?? '').trim(),
      argsTemplate
    })
    if (!node.toolName) throw new Error('请填写工具名')
    return node
  }

  if (values.type === 'input') {
    const kinds = (values.inputKinds ?? []).filter(
      (k): k is WorkflowInputKind =>
        k === 'text' || k === 'attachment' || k === 'image' || k === 'video'
    )
    if (!kinds.length) throw new Error('请至少选择一种输入类型')
    const node: WorkflowInputNode = withIo({
      id,
      type: 'input',
      title,
      prompt: (values.inputPrompt ?? '').trim() || '请输入内容后继续流程',
      inputKinds: kinds
    })
    return node
  }

  if (values.type === 'output') {
    const format = values.outputFormat ?? 'markdown'
    const validFormat: WorkflowOutputFormat =
      format === 'text' || format === 'markdown' || format === 'json' || format === 'file'
        ? format
        : 'markdown'
    const node: WorkflowOutputNode = withIo({
      id,
      type: 'output',
      title,
      outputDir: (values.outputDir ?? '').trim(),
      outputFormat: validFormat,
      fileNameTemplate: (values.fileNameTemplate ?? '').trim() || 'output',
      contentTemplate: (values.contentTemplate ?? '').trim() || '{{summary}}'
    })
    if (!node.outputDir) throw new Error('请选择输出目录')
    return node
  }

  if (values.type === 'await_user') {
    const node: WorkflowAwaitNode = withIo({
      id,
      type: 'await_user',
      title,
      reason: (values.reason ?? '').trim() || '请确认后继续'
    })
    return node
  }

  if (values.type === 'notify') {
    const channelId = (values.channelId ?? '').trim() || 'feishu'
    const msgType = values.msgType ?? queryFeishuMsgType({ channelId })
    const node: WorkflowNotifyNode = withIo({
      id,
      type: 'notify',
      title,
      channelId,
      titleTemplate: (values.titleTemplate ?? '').trim() || undefined,
      contentTemplate: (values.contentTemplate ?? '').trim() || '{{summary}}',
      msgType,
      imageKey: (values.imageKey ?? '').trim() || undefined,
      shareChatId: (values.shareChatId ?? '').trim() || undefined,
      failSoft: values.failSoft !== false
    })
    if (!node.channelId) throw new Error('请选择通知渠道')
    return node
  }

  if (values.type === 'toast') {
    const level = values.level ?? 'info'
    const validLevel: WorkflowToastLevel =
      level === 'success' || level === 'error' || level === 'warning' || level === 'info'
        ? level
        : 'info'
    const node: WorkflowToastNode = withIo({
      id,
      type: 'toast',
      title,
      level: validLevel,
      contentTemplate: (values.contentTemplate ?? '').trim() || '{{summary}}'
    })
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
  upstreamOutputKeys = [],
  leafOnly = false,
  allowCondition = false,
  isFullscreen = false,
  fullscreenContainer = null,
  onCancel,
  onOk
}: WorkflowNodeEditModalProps): React.ReactElement {
  const [form] = Form.useForm<FormValues>()
  const channels = useChannelsStore((s) => s.channels)
  const notifyChannelOptions = useMemo(
    () =>
      queryEnabledNotifyChannelsFromStore(channels).map((c) => ({
        value: c.id,
        label: c.label
      })),
    [channels]
  )
  const type = Form.useWatch('type', form) as WorkflowNode['type'] | undefined
  const mode = Form.useWatch('mode', form)
  const branchShape = Form.useWatch('branchShape', form)
  const useAdvanced = Form.useWatch('useAdvancedExpression', form)
  const op = Form.useWatch('op', form)
  const notifyChannelId = Form.useWatch('channelId', form)
  const notifyMsgType = Form.useWatch('msgType', form) as FeishuNotifyMsgType | undefined
  const toolWhitelist = Form.useWatch('toolWhitelist', form)
  const toolName = Form.useWatch('toolName', form)
  const isEditingCondition = node?.type === 'condition'

  const toolSelectOptions = useMemo(
    () =>
      queryToolSelectOptions(
        [...(toolWhitelist ?? []), ...(toolName ? [toolName] : [])].filter(Boolean)
      ),
    [toolWhitelist, toolName]
  )

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
      { value: 'input', label: '输入节点' },
      { value: 'output', label: '输出节点' },
      { value: 'agent', label: 'Agent 步骤' },
      { value: 'tool', label: '工具步骤' },
      { value: 'notify', label: '渠道通知' },
      { value: 'toast', label: 'Toast 通知' },
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
          : values.type === 'input'
            ? createInputNode()
            : values.type === 'output'
              ? createOutputNode()
              : values.type === 'await_user'
            ? createAwaitNode()
            : values.type === 'notify'
              ? createNotifyNode()
              : values.type === 'toast'
                ? createToastNode()
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
      if (isLeafNode(next)) {
        const issues = queryIoAlignmentIssues(next, upstreamOutputKeys)
        if (issues.missing.length) {
          message.warning(
            `上游可能缺少输出字段：${issues.missing.join(', ')}（上游可用：${formatContextKeyList(upstreamOutputKeys)}）`
          )
        }
      }
      onOk(next)
    } catch (err) {
      if (err instanceof Error && err.message) {
        message.error(err.message)
      }
    }
  }

  const showIoFields =
    type === 'agent' ||
    type === 'tool' ||
    type === 'await_user' ||
    type === 'notify' ||
    type === 'toast' ||
    type === 'input' ||
    type === 'output'

  const defaultOutputHintByType: Partial<Record<WorkflowNode['type'], string>> = {
    agent: 'summary',
    tool: '工具名或自定义键',
    await_user: 'userInput',
    notify: 'notify_<节点id>',
    toast: 'toast_<节点id>',
    input: 'userInput, attachmentPaths',
    output: 'outputPath'
  }

  const handlePickOutputDir = async (): Promise<void> => {
    const dir = await postSelectDirectory()
    if (dir) form.setFieldValue('outputDir', dir)
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

        {showIoFields && (
          <>
            <Form.Item
              name="inputKeys"
              label="输入字段"
              tooltip="声明本节点需要从上游 context 读取的键；留空则从模板 {{key}} 自动推断"
              extra={`上游可用输出：${formatContextKeyList(upstreamOutputKeys)}`}
            >
              <Input placeholder="格式：逗号分隔，如 summary, hotTopics" />
            </Form.Item>
            <Form.Item
              name="outputKeys"
              label="输出字段"
              tooltip="本节点写入 context 的键名，供下游 {{key}} 引用"
              extra={
                type
                  ? `留空时默认：${defaultOutputHintByType[type] ?? '—'}`
                  : undefined
              }
            >
              <Input placeholder="格式：逗号分隔，如 summary, videoPath" />
            </Form.Item>
          </>
        )}

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
                  <Select
                    mode="tags"
                    showSearch
                    allowClear
                    placeholder="选择工具；通常留空"
                    options={toolSelectOptions}
                    optionFilterProp="label"
                  />
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
              <Input.TextArea rows={4} placeholder="本步骤希望 Agent 完成的事；可用 {{contextKey}} 引用上游输出" />
            </Form.Item>
            <Form.Item
              name="toolWhitelist"
              label="工具白名单"
              tooltip="留空表示可用全部工具"
            >
              <Select
                mode="tags"
                showSearch
                allowClear
                placeholder="选择工具；留空表示可用全部"
                options={toolSelectOptions}
                optionFilterProp="label"
              />
            </Form.Item>
          </>
        )}

        {type === 'tool' && (
          <>
            <Form.Item
              name="toolName"
              label="工具名"
              rules={[{ required: true, message: '请选择工具名' }]}
            >
              <Select
                showSearch
                allowClear
                placeholder="选择工具"
                options={toolSelectOptions}
                optionFilterProp="label"
              />
            </Form.Item>
            <Form.Item
              name="argsJson"
              label="参数 JSON"
              tooltip="支持 {{contextKey}} 插值，引用上游上下文"
              initialValue="{}"
            >
              <Input.TextArea rows={5} placeholder='{"title":"{{summary}}"}；JSON 对象，值支持 {{contextKey}}' />
            </Form.Item>
          </>
        )}

        {type === 'await_user' && (
          <>
            <Form.Item name="reason" label="确认说明">
              <Input.TextArea
                rows={3}
                placeholder="展示给用户的暂停原因；可用 {{contextKey}} 引用上游摘要"
              />
            </Form.Item>
          </>
        )}

        {type === 'input' && (
          <>
            <Form.Item
              name="inputKinds"
              label="采集类型"
              rules={[{ required: true, message: '请至少选择一种输入类型' }]}
              tooltip="执行到此节点时暂停，等待用户提供对应类型的内容"
            >
              <Select
                mode="multiple"
                placeholder="选择：文字 / 附件 / 图片 / 视频"
                options={[
                  { value: 'text', label: '文字' },
                  { value: 'attachment', label: '附件' },
                  { value: 'image', label: '图片' },
                  { value: 'video', label: '视频' }
                ]}
              />
            </Form.Item>
            <Form.Item
              name="inputPrompt"
              label="采集说明"
              rules={[{ required: true, message: '请填写采集说明' }]}
            >
              <Input.TextArea
                rows={3}
                placeholder="向用户说明需要提供什么，如：请上传产品图并补充一句卖点"
              />
            </Form.Item>
          </>
        )}

        {type === 'output' && (
          <>
            <Form.Item
              name="outputDir"
              label="输出目录"
              rules={[{ required: true, message: '请选择输出目录' }]}
              extra="绝对路径；运行时将内容写入该文件夹"
            >
              <Input
                placeholder="/Users/你/文稿/流程输出"
                addonAfter={
                  <Button type="link" size="small" onClick={() => void handlePickOutputDir()}>
                    选择文件夹
                  </Button>
                }
              />
            </Form.Item>
            <Form.Item name="outputFormat" label="输出格式" initialValue="markdown">
              <Select
                options={[
                  { value: 'text', label: '纯文本 (.txt)' },
                  { value: 'markdown', label: 'Markdown (.md)' },
                  { value: 'json', label: 'JSON (.json)' },
                  { value: 'file', label: '复制文件（content 为源路径 {{key}}）' }
                ]}
              />
            </Form.Item>
            <Form.Item
              name="fileNameTemplate"
              label="文件名"
              tooltip="不含扩展名时按格式自动补全；支持 {{contextKey}}"
            >
              <Input placeholder="例如 report 或 {{workflowTitle}}" />
            </Form.Item>
            <Form.Item
              name="contentTemplate"
              label="写入内容"
              rules={[{ required: true, message: '请填写内容模板' }]}
              tooltip="支持 {{contextKey}} 引用上游 outputKeys；file 格式填源文件路径"
            >
              <Input.TextArea rows={4} placeholder="{{summary}}" />
            </Form.Item>
          </>
        )}

        {type === 'notify' && (
          <>
            <Form.Item
              name="channelId"
              label="通知渠道"
              rules={[{ required: true, message: '请选择渠道' }]}
            >
              <Select
                placeholder="选择已启用的通知渠道"
                options={notifyChannelOptions}
                notFoundContent="请先在渠道页配置并启用通知渠道"
              />
            </Form.Item>
            <Form.Item
              name="titleTemplate"
              label="推送标题"
              tooltip="支持 {{contextKey}} 引用上游节点 outputKeys 写入的字段"
            >
              <Input placeholder="例如：{{workflowTitle}}" />
            </Form.Item>
            <Form.Item
              name="contentTemplate"
              label="推送正文"
              rules={[
                {
                  validator: async (_, value) => {
                    const mt =
                      (form.getFieldValue('msgType') as FeishuNotifyMsgType | undefined) ??
                      queryFeishuMsgType({ channelId: form.getFieldValue('channelId') })
                    if (mt === 'image' || mt === 'share_chat') return
                    if (!String(value ?? '').trim()) throw new Error('请填写正文模板')
                  }
                }
              ]}
              tooltip="支持 {{contextKey}} 插值；image / 群名片类型可留空"
              initialValue="{{summary}}"
            >
              <Input.TextArea rows={4} placeholder="{{summary}}" />
            </Form.Item>
            {notifyChannelId === 'feishu' ? (
              <Form.Item
                name="msgType"
                label="飞书通知类型"
                tooltip="对应飞书自定义机器人 msg_type"
                initialValue="post"
              >
                <Select
                  options={[
                    { value: 'text', label: '文本' },
                    { value: 'post', label: '富文本（Markdown）' },
                    { value: 'image', label: '图片消息' },
                    { value: 'share_chat', label: '群名片' }
                  ]}
                />
              </Form.Item>
            ) : null}
            {notifyChannelId === 'feishu' && notifyMsgType === 'image' ? (
              <Form.Item
                name="imageKey"
                label="image_key"
                tooltip="飞书图片上传 API 返回的 key；可留空以使用渠道页默认配置"
              >
                <Input placeholder="img_xxx 或留空使用渠道配置" />
              </Form.Item>
            ) : null}
            {notifyChannelId === 'feishu' && notifyMsgType === 'share_chat' ? (
              <Form.Item
                name="shareChatId"
                label="share_chat_id"
                tooltip="群 ID；可留空以使用渠道页默认配置"
              >
                <Input placeholder="oc_xxx 或留空使用渠道配置" />
              </Form.Item>
            ) : null}
            <Form.Item
              name="failSoft"
              label="失败时继续"
              valuePropName="checked"
              tooltip="开启后通知发送失败不阻断流程"
              initialValue
            >
              <Switch />
            </Form.Item>
          </>
        )}

        {type === 'toast' && (
          <>
            <Form.Item name="level" label="提示级别" initialValue="info">
              <Select
                options={[
                  { value: 'success', label: '成功' },
                  { value: 'info', label: '信息' },
                  { value: 'warning', label: '警告' },
                  { value: 'error', label: '错误' }
                ]}
              />
            </Form.Item>
            <Form.Item
              name="contentTemplate"
              label="展示内容"
              rules={[{ required: true, message: '请填写内容模板' }]}
              tooltip="支持 {{contextKey}} 引用上游节点返回值"
              initialValue="{{summary}}"
            >
              <Input.TextArea rows={4} placeholder="{{summary}}" />
            </Form.Item>
          </>
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
