import type { WorkflowDefinition, WorkflowTemplateKind } from '@shared/types'
import styles from './WorkflowMetaForm.module.css'

interface WorkflowMetaFormProps {
  workflow: WorkflowDefinition
  onChange: (
    patch: Partial<Pick<WorkflowDefinition, 'title' | 'description' | 'templateKind'>>
  ) => void
}

const KIND_OPTIONS: { value: WorkflowTemplateKind; label: string }[] = [
  { value: 'generic', label: '通用流程' },
  { value: 'publish', label: '发布模板' }
]

/** 流程元信息表单：标题 / 描述 / 模板类型（Ant Design Form 布局） */
export function WorkflowMetaForm({
  workflow,
  onChange
}: WorkflowMetaFormProps): React.ReactElement {
  return (
    <Form layout="vertical" className={styles.form} requiredMark={false}>
      <Form.Item label="标题" className={styles.item}>
        <Input
          value={workflow.title}
          placeholder="流程展示名称"
          onChange={(e) => onChange({ title: e.target.value })}
        />
      </Form.Item>
      <Form.Item label="类型" className={styles.item}>
        <Select
          value={workflow.templateKind}
          options={KIND_OPTIONS}
          onChange={(value: WorkflowTemplateKind) => onChange({ templateKind: value })}
          style={{ width: '100%' }}
        />
      </Form.Item>
      <Form.Item
        label="描述"
        className={styles.item}
        extra="用于列表卡片展示，帮助快速识别流程用途"
      >
        <Input.TextArea
          value={workflow.description}
          placeholder="可选：说明该流程解决什么问题"
          rows={3}
          onChange={(e) => onChange({ description: e.target.value })}
        />
      </Form.Item>
    </Form>
  )
}
