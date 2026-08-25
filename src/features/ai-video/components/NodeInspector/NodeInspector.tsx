/**
 * 节点检查器：提示词、工作流、skill、@引用、重新生成。
 */

import { useEffect, useMemo, useState } from 'react'
import type { AiVideoCanvasNode, AiVideoProject, ComfyWorkflowMeta } from '@shared/ai-video'
import { AI_VIDEO_KIND_LABEL } from '@shared/ai-video'
import { queryComfyWorkflows } from '../../api'
import {
  queryLinkedRefCandidates,
  queryValidateRefsLocal,
  queryAssetNodes,
  queryNodePromptSources
} from '../../utils/queryLinkedRefs'
import styles from './NodeInspector.module.css'

interface NodeInspectorProps {
  open: boolean
  project: AiVideoProject
  node: AiVideoCanvasNode | null
  skills: Array<{ id: string; name: string }>
  onClose: () => void
  onChange: (node: AiVideoCanvasNode) => void
  onRun: (nodeId: string) => void
}

export function NodeInspector({
  open,
  project,
  node,
  skills,
  onClose,
  onChange,
  onRun
}: NodeInspectorProps): React.ReactElement {
  const [workflows, setWorkflows] = useState<ComfyWorkflowMeta[]>([])

  useEffect(() => {
    if (!open) return
    void queryComfyWorkflows().then(setWorkflows).catch(() => setWorkflows([]))
  }, [open])

  const linkedRefCandidates = useMemo(() => {
    if (!node) return []
    return queryLinkedRefCandidates(project, node.id)
  }, [project, node])

  /** 可 @ 关联的资产节点（角色定妆/三视图/场景/道具） */
  const assetNodes = useMemo(() => (node ? queryAssetNodes(project) : []), [project, node])

  /** 图像节点提示词来源：上游连线的文本节点 */
  const promptSources = useMemo(() => {
    if (!node) return []
    return queryNodePromptSources(project, node.id)
  }, [project, node])

  const refError = node ? queryValidateRefsLocal(project, node) : null

  if (!node) {
    return (
      <Drawer open={open} onClose={onClose} width={380} title="节点属性">
        <Empty description="选择一个节点" />
      </Drawer>
    )
  }

  const promptValue = node.manualPrompt ?? node.prompt

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={400}
      title={`${AI_VIDEO_KIND_LABEL[node.kind]} · ${node.title}`}
      extra={
        <Button
          type="primary"
          icon={<PlayCircleOutlined />}
          loading={node.status === 'running'}
          onClick={() => onRun(node.id)}
        >
          {node.status === 'error' ? '重试' : '重新生成'}
        </Button>
      }
    >
      <div className={styles.form}>
        <label className={styles.label}>标题</label>
        <Input
          value={node.title}
          onChange={(e) => onChange({ ...node, title: e.target.value })}
        />

        <label className={styles.label}>提示词 / 输入</label>
        <Input.TextArea
          rows={6}
          value={promptValue}
          placeholder="支持 @ 引用已连线的角色三视图/场景/道具"
          onChange={(e) =>
            onChange({
              ...node,
              manualPrompt: e.target.value,
              prompt: e.target.value
            })
          }
        />

        {node.type !== 'text' ? (
          <>
            <label className={styles.label}>ComfyUI 工作流</label>
            <Select
              showSearch
              optionFilterProp="label"
              value={node.workflowId}
              placeholder="选择工作流"
              style={{ width: '100%' }}
              options={workflows.map((w) => ({
                value: w.relativePath,
                label: `${w.category}/${w.name}`
              }))}
              onChange={(v) => onChange({ ...node, workflowId: v })}
            />
          </>
        ) : null}

        <label className={styles.label}>节点 Skill</label>
        <Select
          mode="multiple"
          allowClear
          style={{ width: '100%' }}
          placeholder="可选，叠加全局 skill"
          value={node.skillIds ?? []}
          options={skills.map((s) => ({ value: s.id, label: s.name }))}
          onChange={(ids) => onChange({ ...node, skillIds: ids })}
        />

        {node.kind === 'character_views' ||
        node.kind === 'storyboard' ||
        node.kind === 'video_gen' ? (
          <>
            <label className={styles.label}>
              {node.kind === 'character_views'
                ? '参考定妆图（已连线）'
                : node.kind === 'video_gen'
                  ? '参考分镜图（已连线）'
                  : '@ 引用三视图/场景/道具（仅已连线）'}
            </label>
            <Select
              mode="multiple"
              allowClear
              style={{ width: '100%' }}
              placeholder={
                linkedRefCandidates.length
                  ? '选择参考图节点'
                  : node.kind === 'character_views'
                    ? '请先连线角色定妆节点'
                    : node.kind === 'video_gen'
                      ? '请先连线分镜图节点'
                      : '请先连线角色三视图/场景/道具'
              }
              value={node.refs ?? []}
              options={linkedRefCandidates.map((n) => ({
                value: n.id,
                label: n.title
              }))}
              onChange={(ids) => onChange({ ...node, refs: ids })}
            />
            {refError ? <Alert type="warning" showIcon message={refError} /> : null}
          </>
        ) : null}

        {node.errorMessage ? (
          <Alert type="error" showIcon message={node.errorMessage} />
        ) : null}

        {node.result?.text ? (
          <div className={styles.resultBox}>
            <div className={styles.label}>文本结果</div>
            <pre className={styles.pre}>{node.result.text}</pre>
          </div>
        ) : null}
      </div>
    </Drawer>
  )
}
