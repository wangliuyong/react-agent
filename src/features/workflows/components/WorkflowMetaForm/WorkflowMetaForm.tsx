import type { WorkflowDefinition, WorkflowTemplateKind } from '@shared/types'
import styles from './WorkflowMetaForm.module.css'

interface WorkflowMetaFormProps {
  workflow: WorkflowDefinition
  onChange: (patch: Partial<Pick<WorkflowDefinition, 'title' | 'description' | 'templateKind'>>) => void
}

const KIND_OPTIONS: { value: WorkflowTemplateKind; label: string }[] = [
  { value: 'generic', label: '通用流程' },
  { value: 'publish', label: '发布模板' }
]

/** 流程元信息表单：标题 / 描述 / 模板类型 */
export function WorkflowMetaForm({
  workflow,
  onChange
}: WorkflowMetaFormProps): React.ReactElement {
  return (
    <div className={styles.form}>
      <div className={styles.field}>
        <label className={styles.label}>标题</label>
        <Input
          value={workflow.title}
          placeholder="流程名称"
          onChange={(e) => onChange({ title: e.target.value })}
        />
      </div>
      <div className={styles.field}>
        <label className={styles.label}>类型</label>
        <Select
          value={workflow.templateKind}
          options={KIND_OPTIONS}
          onChange={(value: WorkflowTemplateKind) => onChange({ templateKind: value })}
          style={{ width: '100%' }}
        />
      </div>
      <div className={styles.field}>
        <label className={styles.label}>描述</label>
        <Input.TextArea
          value={workflow.description}
          placeholder="可选：说明该流程的用途"
          rows={2}
          onChange={(e) => onChange({ description: e.target.value })}
        />
      </div>
    </div>
  )
}
